import express from 'express';
import {
  recordDonation,
  getDonationHistory,
  getDonationById,
  verifyDonation,
  rejectDonation,
  getDigitalCard,
  verifyQRCode,
  validateDonationCount,
  syncAllDonationCounts,
  updateDonation,
  adminOverrideDonation,
  getImmutabilityStatus,
  lockDonation,
  unlockDonation,
  regenerateQRCode,
  getMyDigitalCards,
  revokeDigitalCard,
  getDonorCards
} from '../controllers/donationController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Standard donation endpoints
router.post('/', protect, recordDonation);
router.get('/history', protect, getDonationHistory);
router.get('/validate-count', protect, validateDonationCount);
router.post('/admin/sync-all-counts', protect, isAdmin, syncAllDonationCounts);

// Digital card endpoints (QR code management)
router.get('/cards/my-cards', protect, getMyDigitalCards);
router.get('/cards/donor/:donorId', protect, isAdmin, getDonorCards);
router.get('/card/:id', protect, getDigitalCard);
router.post('/card/:id/regenerate', protect, regenerateQRCode);
router.post('/card/:id/revoke', protect, isAdmin, revokeDigitalCard);
router.post('/verify-qr', verifyQRCode);

// Individual donation operations
router.get('/:id', protect, getDonationById);
router.put('/:id', protect, updateDonation);
router.post('/:id/verify', protect, isAdmin, verifyDonation);
router.post('/:id/reject', protect, isAdmin, rejectDonation);

// Immutability management endpoints
router.get('/:id/immutability-status', protect, getImmutabilityStatus);
router.put('/:id/admin-override', protect, isAdmin, adminOverrideDonation);
router.put('/:id/lock', protect, isAdmin, lockDonation);
router.put('/:id/unlock', protect, isAdmin, unlockDonation);

export default router;
