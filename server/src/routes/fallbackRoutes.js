import express from 'express';
import {
  getUnmatchedRequests,
  expandRadius,
  notifyUnavailable,
  suggestFacilities,
  notifyAdmin,
  processSingleFallback,
  runSystem,
  giveExpansionConsent
} from '../controllers/fallbackController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Public routes (for recipients and admins)
router.put('/consent-expansion/:requestId', giveExpansionConsent);
router.post('/suggest-facilities/:requestId', suggestFacilities);
router.post('/expand-radius/:requestId', expandRadius);
router.post('/notify-admin/:requestId', notifyAdmin);

// Admin-only routes
router.get('/unmatched', isAdmin, getUnmatchedRequests);
router.post('/notify-unavailable/:requestId', isAdmin, notifyUnavailable);
router.post('/process/:requestId', isAdmin, processSingleFallback);
router.post('/run-system', isAdmin, runSystem);

export default router;
