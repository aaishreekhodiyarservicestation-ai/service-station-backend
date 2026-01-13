import express from 'express';
import { exportDailyRegister } from '../controllers/reportController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/daily-register', exportDailyRegister);

export default router;
