import AuditLog, { AuditAction } from '../models/AuditLog';
import { Types } from 'mongoose';

export interface AuditLogData {
  userId: Types.ObjectId;
  action: AuditAction;
  entityType: string;
  entityId?: Types.ObjectId;
  changes?: Record<string, any>;
  ipAddress?: string;
}

/**
 * Create audit log entry
 */
export const createAuditLog = async (data: AuditLogData): Promise<void> => {
  try {
    await AuditLog.create({
      userId: data.userId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      changes: data.changes,
      ipAddress: data.ipAddress,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error - audit logging should not break the main operation
  }
};

/**
 * Log user login
 */
export const logLogin = async (userId: Types.ObjectId, ipAddress?: string): Promise<void> => {
  await createAuditLog({
    userId,
    action: AuditAction.LOGIN,
    entityType: 'user',
    entityId: userId,
    ipAddress,
  });
};

/**
 * Log user logout
 */
export const logLogout = async (userId: Types.ObjectId, ipAddress?: string): Promise<void> => {
  await createAuditLog({
    userId,
    action: AuditAction.LOGOUT,
    entityType: 'user',
    entityId: userId,
    ipAddress,
  });
};

/**
 * Log entity creation
 */
export const logCreate = async (
  userId: Types.ObjectId,
  entityType: string,
  entityId: Types.ObjectId,
  data: any,
  ipAddress?: string
): Promise<void> => {
  await createAuditLog({
    userId,
    action: AuditAction.CREATE,
    entityType,
    entityId,
    changes: { new: data },
    ipAddress,
  });
};

/**
 * Log entity update
 */
export const logUpdate = async (
  userId: Types.ObjectId,
  entityType: string,
  entityId: Types.ObjectId,
  oldData: any,
  newData: any,
  ipAddress?: string
): Promise<void> => {
  await createAuditLog({
    userId,
    action: AuditAction.UPDATE,
    entityType,
    entityId,
    changes: { old: oldData, new: newData },
    ipAddress,
  });
};

/**
 * Log entity deletion
 */
export const logDelete = async (
  userId: Types.ObjectId,
  entityType: string,
  entityId: Types.ObjectId,
  data: any,
  ipAddress?: string
): Promise<void> => {
  await createAuditLog({
    userId,
    action: AuditAction.DELETE,
    entityType,
    entityId,
    changes: { deleted: data },
    ipAddress,
  });
};

export default {
  createAuditLog,
  logLogin,
  logLogout,
  logCreate,
  logUpdate,
  logDelete,
};
