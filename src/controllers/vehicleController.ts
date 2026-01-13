import { Response } from 'express';
import { validationResult } from 'express-validator';
import Vehicle from '../models/Vehicle';
import Owner from '../models/Owner';
import Person from '../models/Person';
import { AuthRequest } from '../middleware/auth';
import { generateSerialNumber } from '../utils/generateSerialNumber';
import { logCreate, logUpdate, logDelete } from '../services/auditService';
import { uploadToCloudinary } from '../services/cloudinaryService';

/**
 * @desc    Create new vehicle entry
 * @route   POST /api/vehicles
 * @access  Private (All roles)
 */
export const createVehicle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const {
      vehicleType,
      companyBrand,
      registrationNumber,
      engineNumber,
      chassisNumber,
      owner,
      dropOffPerson,
      pickUpPerson,
      dateSubmitted,
      status,
    } = req.body;

    // Create owner
    const ownerDoc = await Owner.create(owner);

    // Create drop-off person if provided
    let dropOffPersonDoc;
    if (dropOffPerson) {
      dropOffPersonDoc = await Person.create(dropOffPerson);
    }

    // Create pick-up person if provided
    let pickUpPersonDoc;
    if (pickUpPerson) {
      pickUpPersonDoc = await Person.create(pickUpPerson);
    }

    // Generate serial number
    const stationId = req.user!.stationId.toString();
    const serialNumber = await generateSerialNumber(stationId);

    // Create vehicle
    const vehicle = await Vehicle.create({
      serialNumber,
      vehicleType,
      companyBrand,
      registrationNumber,
      engineNumber,
      chassisNumber,
      ownerId: ownerDoc._id,
      dropOffPersonId: dropOffPersonDoc?._id,
      pickUpPersonId: pickUpPersonDoc?._id,
      dateSubmitted: dateSubmitted || new Date(),
      status: status || 'pending',
      stationId: req.user!.stationId,
      documents: [],
      createdBy: req.user!._id,
    });

    // Log creation
    await logCreate(req.user!._id, 'vehicle', vehicle._id, vehicle, req.ip);

    const populatedVehicle = await Vehicle.findById(vehicle._id)
      .populate('ownerId')
      .populate('dropOffPersonId')
      .populate('pickUpPersonId')
      .populate('stationId', 'name')
      .populate('createdBy', 'fullName username');

    res.status(201).json({
      success: true,
      message: 'Vehicle entry created successfully',
      data: populatedVehicle,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all vehicles with filters
 * @route   GET /api/vehicles
 * @access  Private (All roles)
 */
export const getVehicles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, search, dateFrom, dateTo, page = 1, limit = 10 } = req.query;

    const query: any = {};

    // Filter by station (staff and managers can only see their station's vehicles)
    if (req.user!.role !== 'admin') {
      query.stationId = req.user!.stationId;
    } else if (req.query.stationId) {
      query.stationId = req.query.stationId;
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.dateSubmitted = {};
      if (dateFrom) query.dateSubmitted.$gte = new Date(dateFrom as string);
      if (dateTo) query.dateSubmitted.$lte = new Date(dateTo as string);
    }

    // Search by registration number or owner mobile
    if (search) {
      const owners = await Owner.find({
        mobile: { $regex: search, $options: 'i' },
      });
      const ownerIds = owners.map((o) => o._id);

      query.$or = [
        { registrationNumber: { $regex: search, $options: 'i' } },
        { ownerId: { $in: ownerIds } },
      ];
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const vehicles = await Vehicle.find(query)
      .populate('ownerId')
      .populate('dropOffPersonId')
      .populate('pickUpPersonId')
      .populate('stationId', 'name')
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Vehicle.countDocuments(query);

    res.status(200).json({
      success: true,
      data: vehicles,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get single vehicle
 * @route   GET /api/vehicles/:id
 * @access  Private (All roles)
 */
export const getVehicle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('ownerId')
      .populate('dropOffPersonId')
      .populate('pickUpPersonId')
      .populate('stationId')
      .populate('createdBy', 'fullName username')
      .populate('updatedBy', 'fullName username');

    if (!vehicle) {
      res.status(404).json({ success: false, message: 'Vehicle not found' });
      return;
    }

    res.status(200).json({ success: true, data: vehicle });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update vehicle
 * @route   PUT /api/vehicles/:id
 * @access  Private (Manager, Admin)
 */
export const updateVehicle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      res.status(404).json({ success: false, message: 'Vehicle not found' });
      return;
    }

    const oldData = { ...vehicle.toObject() };

    const { owner, dropOffPerson, pickUpPerson, ...vehicleFields } = req.body;

    // Update owner if provided
    if (owner && vehicle.ownerId) {
      await Owner.findByIdAndUpdate(vehicle.ownerId, owner);
    }

    // Handle drop-off person
    if (dropOffPerson) {
      // Update or create drop-off person
      if (vehicle.dropOffPersonId) {
        await Person.findByIdAndUpdate(vehicle.dropOffPersonId, dropOffPerson);
      } else {
        const dropOffPersonDoc = await Person.create(dropOffPerson);
        vehicle.dropOffPersonId = dropOffPersonDoc._id;
      }
    } else if (req.body.hasOwnProperty('dropOffPerson')) {
      // If dropOffPerson key exists but is null/undefined, remove it
      if (vehicle.dropOffPersonId) {
        await Person.findByIdAndDelete(vehicle.dropOffPersonId);
        vehicle.dropOffPersonId = undefined;
      }
    }

    // Handle pick-up person
    if (pickUpPerson) {
      // Update or create pick-up person
      if (vehicle.pickUpPersonId) {
        await Person.findByIdAndUpdate(vehicle.pickUpPersonId, pickUpPerson);
      } else {
        const pickUpPersonDoc = await Person.create(pickUpPerson);
        vehicle.pickUpPersonId = pickUpPersonDoc._id;
      }
    } else if (req.body.hasOwnProperty('pickUpPerson')) {
      // If pickUpPerson key exists but is null/undefined, remove it
      if (vehicle.pickUpPersonId) {
        await Person.findByIdAndDelete(vehicle.pickUpPersonId);
        vehicle.pickUpPersonId = undefined;
      }
    }

    // Update vehicle fields
    Object.assign(vehicle, vehicleFields);
    vehicle.updatedBy = req.user!._id;
    await vehicle.save();

    // Log update
    await logUpdate(req.user!._id, 'vehicle', vehicle._id, oldData, vehicle, req.ip);

    const updatedVehicle = await Vehicle.findById(vehicle._id)
      .populate('ownerId')
      .populate('dropOffPersonId')
      .populate('pickUpPersonId')
      .populate('stationId', 'name');

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: updatedVehicle,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete vehicle
 * @route   DELETE /api/vehicles/:id
 * @access  Private (Manager, Admin)
 */
export const deleteVehicle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      res.status(404).json({ success: false, message: 'Vehicle not found' });
      return;
    }

    // Log deletion
    await logDelete(req.user!._id, 'vehicle', vehicle._id, vehicle, req.ip);

    await vehicle.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Upload document for vehicle
 * @route   POST /api/vehicles/:id/upload
 * @access  Private (All roles)
 */
export const uploadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      res.status(404).json({ success: false, message: 'Vehicle not found' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    const { documentType } = req.body;

    // Upload to Cloudinary
    const folder = documentType === 'rc' ? 'rc-documents' : 'id-proofs';
    const uploadResult = await uploadToCloudinary(req.file, folder);

    // Add document to vehicle
    vehicle.documents.push({
      type: documentType,
      cloudinaryUrl: uploadResult.url,
      cloudinaryPublicId: uploadResult.publicId,
      uploadedAt: new Date(),
    });

    await vehicle.save();

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: uploadResult,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/vehicles/stats/dashboard
 * @access  Private (All roles)
 */
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stationId = req.user!.role === 'admin' ? req.query.stationId : req.user!.stationId;

    const baseQuery: any = stationId ? { stationId } : {};

    // Total vehicles today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalToday = await Vehicle.countDocuments({
      ...baseQuery,
      createdAt: { $gte: today },
    });

    // Pending deliveries
    const pendingDeliveries = await Vehicle.countDocuments({
      ...baseQuery,
      status: { $in: ['in_service', 'pending'] },
    });

    // Completed entries
    const completedEntries = await Vehicle.countDocuments({
      ...baseQuery,
      status: 'delivered',
    });

    // Alerts (vehicles in service for more than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const alerts = await Vehicle.countDocuments({
      ...baseQuery,
      status: { $in: ['in_service', 'pending'] },
      dateSubmitted: { $lte: sevenDaysAgo },
      dateCollected: { $exists: false },
    });

    res.status(200).json({
      success: true,
      data: {
        totalToday,
        pendingDeliveries,
        completedEntries,
        alerts,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  createVehicle,
  getVehicles,
  getVehicle,
  updateVehicle,
  deleteVehicle,
  uploadDocument,
  getDashboardStats,
};
