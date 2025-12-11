import express from 'express';
import { createRequest, getRequests, getRequestById, updateRequest, cancelRequest, respondToRequest } from '../controllers/bloodRequestController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { restrictTo } from '../middlewares/roleMiddleware.js';
import { requestLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/', protect, restrictTo('recipient', 'admin'), requestLimiter, createRequest);
router.get('/', protect, getRequests);
router.get('/:id', protect, getRequestById);
router.put('/:id', protect, updateRequest);
router.delete('/:id', protect, cancelRequest);
router.post('/:id/respond', protect, restrictTo('donor'), respondToRequest);

export default router;
