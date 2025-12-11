import express from 'express';
import { recordDonation, getDonationHistory, getDonationById, verifyDonation, getDigitalCard, verifyQRCode, validateDonationCount } from '../controllers/donationController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.post('/', protect, recordDonation);
router.get('/history', protect, getDonationHistory);
router.get('/validate-count', protect, validateDonationCount);
router.get('/card/:id', protect, getDigitalCard);
router.post('/verify-qr', verifyQRCode);
router.get('/:id', protect, getDonationById);
router.post('/:id/verify', protect, isAdmin, verifyDonation);

export default router;
