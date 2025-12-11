import Payment from '../models/Payment.js';
import { catchAsync, AppError } from '../middlewares/errorHandler.js';

/**
 * Payment stub - integrate with actual payment gateway in production
 */

export const createPayment = catchAsync(async (req, res) => {
  const { amount, paymentMethod, paymentType, relatedModel, relatedId } = req.body;

  const payment = await Payment.create({
    user: req.user._id,
    amount,
    paymentMethod,
    paymentType,
    relatedModel,
    relatedId,
    status: 'pending'
  });

  // Simulate payment gateway response
  const mockGatewayResponse = {
    success: true,
    transactionId: payment.transactionId,
    timestamp: new Date()
  };

  // Mark as paid (in production, this would be done by payment gateway callback)
  await payment.markAsPaid(mockGatewayResponse);

  res.status(201).json({
    success: true,
    message: 'Payment processed successfully (MOCK)',
    data: payment
  });
});

export const getPayments = catchAsync(async (req, res) => {
  const query = {};

  if (req.user.role !== 'admin') {
    query.user = req.user._id;
  }

  const payments = await Payment.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: payments });
});

export const getPaymentById = catchAsync(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id)
    .populate('user', 'name email phone');

  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }

  res.status(200).json({ success: true, data: payment });
});

export default { createPayment, getPayments, getPaymentById };
