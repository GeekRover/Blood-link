import express from 'express';
import {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
  getAverageRating,
  getPendingReviews,
  approveReview,
  rejectReview,
  reportReview,
  clearReports,
  getModerationStats
} from '../controllers/reviewController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { restrictTo } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Public/User routes
router.get('/', protect, getReviews);
router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.get('/user/:userId/rating', protect, getAverageRating);

// User reporting route
router.post('/:id/report', protect, reportReview);

// Admin moderation routes
router.get('/admin/pending', protect, restrictTo('admin'), getPendingReviews);
router.get('/admin/stats', protect, restrictTo('admin'), getModerationStats);
router.put('/admin/:id/approve', protect, restrictTo('admin'), approveReview);
router.put('/admin/:id/reject', protect, restrictTo('admin'), rejectReview);
router.put('/admin/:id/clear-reports', protect, restrictTo('admin'), clearReports);

export default router;
