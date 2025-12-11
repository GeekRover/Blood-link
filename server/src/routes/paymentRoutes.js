import express from 'express';
import { createPayment, getPayments, getPaymentById } from '../controllers/paymentController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createPayment);
router.get('/', protect, getPayments);
router.get('/:id', protect, getPaymentById);

export default router;
