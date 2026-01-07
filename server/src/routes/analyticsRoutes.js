import express from 'express';
import * as analyticsController from '../controllers/analyticsController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/roleMiddleware.js';

const router = express.Router();

/**
 * Analytics Routes
 * All routes require authentication
 * Some routes require admin privileges
 */

// Public analytics routes (authenticated users)
router.get('/dashboard', protect, analyticsController.getDashboardStats);
router.get('/trends/donations', protect, analyticsController.getDonationTrends);
router.get('/trends/requests', protect, analyticsController.getRequestTrends);
router.get('/blood-groups', protect, analyticsController.getBloodGroupAnalysis);
router.get('/urgency-distribution', protect, analyticsController.getUrgencyDistribution);
router.get('/custom-range', protect, analyticsController.getCustomRangeAnalytics);
router.get('/summary', protect, analyticsController.getAnalyticsSummary);

// Export routes (authenticated users)
router.get('/export/csv', protect, analyticsController.exportCSV);
router.get('/export/json', protect, analyticsController.exportJSON);

// Admin-only routes
router.post('/generate', protect, isAdmin, analyticsController.generateDailyAnalytics);

export default router;
