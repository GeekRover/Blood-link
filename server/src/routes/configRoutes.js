import express from 'express';
import {
  getConfig,
  updateConfig,
  updateDonationSettings,
  updateMatchingSettings,
  updateFallbackSettings,
  updatePointsSettings,
  toggleMaintenanceMode,
  getChangeHistory,
  getPublicConfig
} from '../controllers/configController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Public route - non-sensitive configuration
router.get('/public', getPublicConfig);

// Admin-only routes - protected
router.use(protect);
router.use(isAdmin);

// Get full configuration
router.get('/', getConfig);

// Update full configuration
router.put('/', updateConfig);

// Update specific configuration sections
router.put('/donation-settings', updateDonationSettings);
router.put('/matching-settings', updateMatchingSettings);
router.put('/fallback-settings', updateFallbackSettings);
router.put('/points-settings', updatePointsSettings);

// Maintenance mode
router.put('/maintenance-mode', toggleMaintenanceMode);

// Change history
router.get('/history', getChangeHistory);

export default router;
