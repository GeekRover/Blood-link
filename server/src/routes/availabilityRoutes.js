import express from 'express';
import {
  getAvailabilitySchedule,
  toggleScheduledAvailability,
  addWeeklySlot,
  updateWeeklySlot,
  deleteWeeklySlot,
  addCustomAvailability,
  updateCustomAvailability,
  deleteCustomAvailability,
  checkAvailability,
  getDonorAvailability
} from '../controllers/availabilityController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { restrictTo } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Public route - get donor's availability (for matching purposes)
router.get('/donor/:donorId', getDonorAvailability);

// Protected routes - donors only
router.use(protect);
router.use(restrictTo('donor'));

// Get own availability schedule
router.get('/', getAvailabilitySchedule);

// Toggle scheduled availability on/off
router.put('/toggle', toggleScheduledAvailability);

// Weekly slots management
router.post('/weekly', addWeeklySlot);
router.put('/weekly/:slotId', updateWeeklySlot);
router.delete('/weekly/:slotId', deleteWeeklySlot);

// Custom availability management (date-specific overrides)
router.post('/custom', addCustomAvailability);
router.put('/custom/:customId', updateCustomAvailability);
router.delete('/custom/:customId', deleteCustomAvailability);

// Check availability at specific time
router.post('/check', checkAvailability);

export default router;
