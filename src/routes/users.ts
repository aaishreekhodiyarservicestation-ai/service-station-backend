import express from 'express';
import { getUsers, getUser, updateUser, deleteUser } from '../controllers/userController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { UserRole } from '../models/User';

const router = express.Router();

router.use(protect);

router.get('/', authorize(UserRole.ADMIN, UserRole.MANAGER), getUsers);
router.get('/:id', getUser);
router.put('/:id', authorize(UserRole.ADMIN), updateUser);
router.delete('/:id', authorize(UserRole.ADMIN), deleteUser);

export default router;
