import express from 'express';
import {
  createVehicle,
  getVehicles,
  getVehicle,
  updateVehicle,
  deleteVehicle,
  uploadDocument,
  getDashboardStats,
  addPayment,
} from '../controllers/vehicleController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { UserRole } from '../models/User';
import { upload } from '../middleware/upload';
import { validateVehicle } from '../utils/validators';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Dashboard stats
router.get('/stats/dashboard', getDashboardStats);

// CRUD routes
router.post('/', validateVehicle, createVehicle);
router.get('/', getVehicles);
router.get('/:id', getVehicle);
router.put('/:id', authorize(UserRole.MANAGER, UserRole.ADMIN), updateVehicle);
router.delete('/:id', authorize(UserRole.MANAGER, UserRole.ADMIN), deleteVehicle);

// File upload
router.post('/:id/upload', upload.single('document'), uploadDocument);

// Payments
router.post('/:id/payments', authorize(UserRole.MANAGER, UserRole.ADMIN), addPayment);

export default router;
