import { Response } from 'express';
import { validationResult } from 'express-validator';
import Station from '../models/Station';
import { AuthRequest } from '../middleware/auth';
import { logCreate, logUpdate, logDelete } from '../services/auditService';

export const createStation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const station = await Station.create(req.body);
    await logCreate(req.user!._id, 'station', station._id, station, req.ip);

    res.status(201).json({ success: true, message: 'Station created successfully', data: station });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stations = await Station.find({});
    res.status(200).json({ success: true, data: stations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const station = await Station.findById(req.params.id);
    if (!station) {
      res.status(404).json({ success: false, message: 'Station not found' });
      return;
    }
    res.status(200).json({ success: true, data: station });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const station = await Station.findById(req.params.id);
    if (!station) {
      res.status(404).json({ success: false, message: 'Station not found' });
      return;
    }

    const oldData = { ...station.toObject() };
    Object.assign(station, req.body);
    await station.save();

    await logUpdate(req.user!._id, 'station', station._id, oldData, station, req.ip);

    res.status(200).json({ success: true, message: 'Station updated successfully', data: station });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteStation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const station = await Station.findById(req.params.id);
    if (!station) {
      res.status(404).json({ success: false, message: 'Station not found' });
      return;
    }

    station.isActive = false;
    await station.save();

    await logDelete(req.user!._id, 'station', station._id, station, req.ip);

    res.status(200).json({ success: true, message: 'Station deactivated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default { createStation, getStations, getStation, updateStation, deleteStation };
