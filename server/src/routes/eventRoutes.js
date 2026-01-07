import express from 'express';
import { getEvents, getEventById, createEvent, updateEvent, deleteEvent, registerForEvent } from '../controllers/eventController.js';
import { protect, optionalAuth } from '../middlewares/authMiddleware.js';
import { restrictTo } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.get('/', optionalAuth, getEvents);
router.get('/:id', optionalAuth, getEventById);
router.post('/', protect, restrictTo('admin'), createEvent);
router.put('/:id', protect, restrictTo('admin'), updateEvent);
router.delete('/:id', protect, restrictTo('admin'), deleteEvent);
router.post('/:id/register', protect, restrictTo('donor'), registerForEvent);

export default router;
