import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { UserRole } from '../models/User';
import { Permission } from '../config/permissions';

// Legacy role-based authorization (still used for admin-only routes)
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized. Please login.' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
      return;
    }
    next();
  };
};

// Granular permission-based authorization
// Admin always passes all permission checks
export const checkPermission = (permission: Permission) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized. Please login.' });
      return;
    }
    // Admin bypasses all permission checks
    if (req.user.role === UserRole.ADMIN) {
      next();
      return;
    }
    if (!req.user.permissions.includes(permission)) {
      res.status(403).json({
        success: false,
        message: `Access denied. You do not have permission: ${permission}`,
      });
      return;
    }
    next();
  };
};

// Check multiple permissions (user must have ALL of them)
export const checkPermissions = (...permissions: Permission[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized. Please login.' });
      return;
    }
    if (req.user.role === UserRole.ADMIN) {
      next();
      return;
    }
    const missing = permissions.filter(p => !req.user!.permissions.includes(p));
    if (missing.length > 0) {
      res.status(403).json({
        success: false,
        message: `Access denied. Missing permissions: ${missing.join(', ')}`,
      });
      return;
    }
    next();
  };
};

export default authorize;
