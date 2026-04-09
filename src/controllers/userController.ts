import { Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { logUpdate, logDelete } from '../services/auditService';
import { ALL_PERMISSIONS } from '../config/permissions';

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query: any = {};
    // Non-admins can only see users in their station
    if (req.user!.role !== 'admin' && !req.user!.isManagement) {
      query.stationId = req.user!.stationId;
    }

    const users = await User.find(query)
      .select('-password')
      .populate('stationId', 'name')
      .sort({ createdAt: -1 });

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
    const user = await User.findById(req.params.id).select('+password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const oldData = { ...user.toObject() };
    const { password, permissions, isManagement, stationId, fullName, email, role, isActive } = req.body;

    // Update basic fields
    if (fullName !== undefined) user.fullName = fullName;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (isManagement !== undefined) user.isManagement = isManagement;
    if (stationId !== undefined) user.stationId = stationId || undefined;

    // Update permissions — validate each one
    if (permissions !== undefined) {
      const validPerms = permissions.filter((p: string) => (ALL_PERMISSIONS as readonly string[]).includes(p));
      user.permissions = validPerms;
    }

    // Update password if provided
    if (password && password.trim().length >= 8) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    await logUpdate(req.user!._id, 'user', user._id, oldData, user, req.ip);

    const updated = await User.findById(user._id).select('-password').populate('stationId', 'name');
    res.status(200).json({ success: true, message: 'User updated successfully', data: updated });
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

    if (user._id.toString() === req.user!._id.toString()) {
      res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
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

export const reactivateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    user.isActive = true;
    await user.save();
    res.status(200).json({ success: true, message: 'User reactivated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default { getUsers, getUser, updateUser, deleteUser, reactivateUser };
