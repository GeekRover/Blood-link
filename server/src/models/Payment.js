import mongoose from 'mongoose';
import { PAYMENT_STATUS, PAYMENT_METHODS } from '../config/constants.js';

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  currency: {
    type: String,
    default: 'BDT'
  },
  paymentMethod: {
    type: String,
    enum: Object.values(PAYMENT_METHODS),
    required: true
  },
  paymentType: {
    type: String,
    enum: ['donation', 'sponsorship', 'event_fee', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  paymentGatewayResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  relatedModel: {
    type: String,
    enum: ['BloodCampEvent', 'Blog', 'DonationHistory', 'Other']
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId
  },
  paidAt: Date,
  refundedAt: Date,
  refundAmount: Number,
  refundReason: String,
  failureReason: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes
paymentSchema.index({ user: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentType: 1 });

// Generate transaction ID
paymentSchema.pre('save', async function(next) {
  if (!this.transactionId && this.isNew) {
    this.transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

// Method to mark as paid
paymentSchema.methods.markAsPaid = function(gatewayResponse) {
  this.status = PAYMENT_STATUS.COMPLETED;
  this.paidAt = new Date();
  this.paymentGatewayResponse = gatewayResponse;
  return this.save();
};

// Method to mark as failed
paymentSchema.methods.markAsFailed = function(reason) {
  this.status = PAYMENT_STATUS.FAILED;
  this.failureReason = reason;
  return this.save();
};

// Method to process refund
paymentSchema.methods.processRefund = function(amount, reason) {
  if (this.status !== PAYMENT_STATUS.COMPLETED) {
    throw new Error('Can only refund completed payments');
  }

  this.status = PAYMENT_STATUS.REFUNDED;
  this.refundedAt = new Date();
  this.refundAmount = amount || this.amount;
  this.refundReason = reason;
  return this.save();
};

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
