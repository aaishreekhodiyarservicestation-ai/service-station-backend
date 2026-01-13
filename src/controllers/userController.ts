import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { logUpdate, logDelete } from '../services/auditService';

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find({})
      .select('-password')
      .populate('stationId', 'name');

    res.status(200).json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('stationId');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const oldData = { ...user.toObject() };

    // Don't allow password update through this endpoint
    delete req.body.password;

    Object.assign(user, req.body);
    await user.save();

    await logUpdate(req.user!._id, 'user', user._id, oldData, user, req.ip);

    res.status(200).json({ success: true, message: 'User updated successfully', data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    user.isActive = false;
    await user.save();

    await logDelete(req.user!._id, 'user', user._id, user, req.ip);

    res.status(200).json({ success: true, message: 'User deactivated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default { getUsers, getUser, updateUser, deleteUser };
