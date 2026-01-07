import express from 'express';
import {
  createRequest,
  getRequests,
  getRequestById,
  updateRequest,
  cancelRequest,
  respondToRequest,
  getDonorMatchedRequests,
  getDonorVisibilityInfo,
  getRequestVisibilityStats,
  updateDonorRadius
} from '../controllers/bloodRequestController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { restrictTo } from '../middlewares/roleMiddleware.js';
import { requestLimiter } from '../middlewares/rateLimiter.js';
import { validateRequestLock, autoLockOnView } from '../middlewares/requestLockMiddleware.js';

const router = express.Router();

// Donor-specific routes (must be before /:id to avoid parameter matching)
router.get('/donor/matched', protect, restrictTo('donor'), getDonorMatchedRequests);
router.get('/donor/visibility-info', protect, restrictTo('donor'), getDonorVisibilityInfo);
router.put('/donor/update-radius', protect, restrictTo('donor'), updateDonorRadius);

// Admin visibility statistics
router.get('/visibility/stats', protect, restrictTo('admin'), getRequestVisibilityStats);

// Standard CRUD routes
router.post('/', protect, restrictTo('recipient', 'admin'), requestLimiter, createRequest);
router.get('/', protect, getRequests);
router.get('/:id', protect, autoLockOnView, getRequestById);
router.put('/:id', protect, updateRequest);
router.delete('/:id', protect, cancelRequest);
router.post('/:id/respond', protect, restrictTo('donor'), validateRequestLock, respondToRequest);

export default router;
