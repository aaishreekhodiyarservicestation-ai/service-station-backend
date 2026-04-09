import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Vehicle from '../models/Vehicle';

/**
 * @desc    Get service reminders (today / upcoming / completed)
 * @route   GET /api/reminders?type=today|upcoming|completed
 * @access  Private (All roles)
 */
export const getReminders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type = 'today' } = req.query;

    const stationQuery: any = {};
    if (req.user!.role !== 'admin') {
      stationQuery.stationId = req.user!.stationId;
    } else if (req.query.stationId) {
      stationQuery.stationId = req.query.stationId;
    }

    // Only vehicles that have a reminder date
    const baseQuery: any = {
      ...stationQuery,
      serviceReminderDate: { $exists: true, $ne: null },
    };

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    if (type === 'today') {
      baseQuery.serviceReminderStatus = 'pending';
      baseQuery.serviceReminderDate = { $gte: todayStart, $lte: todayEnd };
    } else if (type === 'upcoming') {
      baseQuery.serviceReminderStatus = 'pending';
      baseQuery.serviceReminderDate = { $gt: todayEnd };
    } else if (type === 'completed') {
      baseQuery.serviceReminderStatus = 'completed';
    }

    const vehicles = await Vehicle.find(baseQuery)
      .populate('ownerId', 'name mobile address')
      .populate('stationId', 'name')
      .sort({ serviceReminderDate: 1 })
      .select('serialNumber registrationNumber vehicleType companyBrand modelNumber ownerId dateSubmitted nextServiceDate serviceReminderDate serviceReminderStatus stationId status');

    res.status(200).json({ success: true, data: vehicles });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get count of today's pending reminders (for sidebar badge)
 * @route   GET /api/reminders/count
 * @access  Private (All roles)
 */
export const getReminderCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stationQuery: any = {};
    if (req.user!.role !== 'admin') {
      stationQuery.stationId = req.user!.stationId;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const count = await Vehicle.countDocuments({
      ...stationQuery,
      serviceReminderStatus: 'pending',
      serviceReminderDate: { $gte: todayStart, $lte: todayEnd },
    });

    res.status(200).json({ success: true, data: { count } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update reminder — snooze or mark complete
 * @route   PATCH /api/reminders/:vehicleId
 * @access  Private (All roles)
 */
export const updateReminder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { action, snoozeDate } = req.body;
    // action: 'complete' | 'snooze_2h' | 'snooze_1d' | 'snooze_custom'
    // snoozeDate: ISO string (required for snooze_custom)

    const vehicle = await Vehicle.findById(req.params.vehicleId);
    if (!vehicle) {
      res.status(404).json({ success: false, message: 'Vehicle not found' });
      return;
    }

    if (action === 'complete') {
      vehicle.serviceReminderStatus = 'completed';
    } else if (action === 'snooze_2h') {
      const d = new Date();
      d.setHours(d.getHours() + 2);
      vehicle.serviceReminderDate = d;
    } else if (action === 'snooze_1d') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      vehicle.serviceReminderDate = d;
    } else if (action === 'snooze_custom' && snoozeDate) {
      vehicle.serviceReminderDate = new Date(snoozeDate);
    } else {
      res.status(400).json({ success: false, message: 'Invalid action' });
      return;
    }

    vehicle.updatedBy = req.user!._id;
    await vehicle.save();

    res.status(200).json({ success: true, message: 'Reminder updated', data: vehicle });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default { getReminders, getReminderCount, updateReminder };
