import express from 'express';
import { createStation, getStations, getStation, updateStation, deleteStation } from '../controllers/stationController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { UserRole } from '../models/User';
import { validateStation } from '../utils/validators';

const router = express.Router();

router.use(protect);

router.post('/', authorize(UserRole.ADMIN), validateStation, createStation);
router.get('/', getStations);
router.get('/:id', getStation);
router.put('/:id', authorize(UserRole.ADMIN), updateStation);
router.delete('/:id', authorize(UserRole.ADMIN), deleteStation);

export default router;
