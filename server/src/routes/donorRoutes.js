import express from 'express';
import { searchDonors, getDonorById, checkEligibility, updateAvailability, getDonorStats } from '../controllers/donorController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { searchLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.get('/search', protect, searchLimiter, searchDonors);
router.get('/stats', protect, getDonorStats);
router.get('/:id', protect, getDonorById);
router.get('/:id/eligibility', protect, checkEligibility);
router.put('/:id/availability', protect, updateAvailability);

export default router;
