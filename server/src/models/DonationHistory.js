import mongoose from 'mongoose';
import { BLOOD_TYPES } from '../config/constants.js';

const donationHistorySchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  bloodRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodRequest'
  },
  donationDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  bloodType: {
    type: String,
    enum: BLOOD_TYPES,
    required: true
  },
  unitsProvided: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  donationCenter: {
    name: String,
    address: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number]
    }
  },
  healthCheckBefore: {
    bloodPressure: String,
    hemoglobin: Number,
    weight: Number,
    temperature: Number,
    pulse: Number
  },
  healthCheckAfter: {
    bloodPressure: String,
    pulse: Number,
    notes: String
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationDocument: String,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  digitalCard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DigitalDonationCard'
  },
  pointsEarned: {
    type: Number,
    default: 100
  },
  notes: String,
  complications: String,
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date
}, {
  timestamps: true
});

// Indexes
donationHistorySchema.index({ donor: 1, donationDate: -1 });
donationHistorySchema.index({ recipient: 1 });
donationHistorySchema.index({ bloodRequest: 1 });
donationHistorySchema.index({ verificationStatus: 1 });

// Virtual for days since donation
donationHistorySchema.virtual('daysSinceDonation').get(function() {
  return Math.floor((Date.now() - this.donationDate.getTime()) / (1000 * 60 * 60 * 24));
});

const DonationHistory = mongoose.model('DonationHistory', donationHistorySchema);

export default DonationHistory;
