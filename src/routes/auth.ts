import express from 'express';
import { register, login, logout, getMe } from '../controllers/authController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { UserRole } from '../models/User';
import { validateUserRegistration, validateLogin } from '../utils/validators';

const router = express.Router();

// Public routes
router.post('/login', validateLogin, login);

// Protected routes
router.post('/register', protect, authorize(UserRole.ADMIN), validateUserRegistration, register);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

export default router;
