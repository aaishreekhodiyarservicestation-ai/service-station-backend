import express from 'express';
import { getReminders, getReminderCount, updateReminder } from '../controllers/reminderController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/count', getReminderCount);
router.get('/', getReminders);
router.patch('/:vehicleId', updateReminder);

export default router;
