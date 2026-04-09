import express from 'express';
import { getUsers, getUser, updateUser, deleteUser, reactivateUser } from '../controllers/userController';
import { protect } from '../middleware/auth';
import { authorize, checkPermission } from '../middleware/rbac';
import { UserRole } from '../models/User';

const router = express.Router();

router.use(protect);

router.get('/', checkPermission('staff.view'), getUsers);
router.get('/:id', checkPermission('staff.view'), getUser);
router.put('/:id', authorize(UserRole.ADMIN), updateUser);
router.delete('/:id', authorize(UserRole.ADMIN), deleteUser);
router.patch('/:id/reactivate', authorize(UserRole.ADMIN), reactivateUser);

export default router;
