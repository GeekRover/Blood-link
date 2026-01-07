import express from 'express';
import {
  getBadges,
  getBadge,
  createBadge,
  updateBadge,
  deleteBadge,
  assignBadge,
  revokeBadge,
  getUserBadges,
  getBadgeHistory,
  getBadgeStats
} from '../controllers/badgeController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { restrictTo } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getBadges);
router.get('/:id', getBadge);
router.get('/user/:userId', getUserBadges);

// Admin routes - Badge management
router.post('/', protect, restrictTo('admin'), createBadge);
router.put('/:id', protect, restrictTo('admin'), updateBadge);
router.delete('/:id', protect, restrictTo('admin'), deleteBadge);

// Admin routes - Badge assignment
router.post('/assign', protect, restrictTo('admin'), assignBadge);
router.post('/revoke', protect, restrictTo('admin'), revokeBadge);

// Admin routes - Badge analytics
router.get('/admin/stats', protect, restrictTo('admin'), getBadgeStats);
router.get('/admin/history/:userId', protect, restrictTo('admin'), getBadgeHistory);

export default router;
