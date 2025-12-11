import mongoose from 'mongoose';
import { BLOOD_TYPES, REQUEST_STATUS, REQUEST_URGENCY } from '../config/constants.js';

const bloodRequestSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientName: {
    type: String,
    required: [true, 'Patient name is required']
  },
  bloodType: {
    type: String,
    enum: BLOOD_TYPES,
    required: [true, 'Blood type is required']
  },
  unitsRequired: {
    type: Number,
    required: [true, 'Units required is mandatory'],
    min: 1,
    max: 10
  },
  urgency: {
    type: String,
    enum: Object.values(REQUEST_URGENCY),
    default: REQUEST_URGENCY.NORMAL
  },
  status: {
    type: String,
    enum: Object.values(REQUEST_STATUS),
    default: REQUEST_STATUS.PENDING
  },
  hospital: {
    name: { type: String, required: true },
    address: String,
    contactNumber: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    }
  },
  requiredBy: {
    type: Date,
    required: [true, 'Required by date is mandatory']
  },
  medicalReason: {
    type: String,
    required: true
  },
  additionalNotes: String,
  matchedDonors: [{
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notifiedAt: Date,
    respondedAt: Date,
    response: {
      type: String,
      enum: ['pending', 'accepted', 'declined']
    },
    declineReason: String
  }],
  fulfilledBy: [{
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    donationDate: Date,
    unitsContributed: Number
  }],
  totalUnitsFulfilled: {
    type: Number,
    default: 0
  },
  verificationDocument: {
    type: String
  },
  cancelledReason: String,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: Date
}, {
  timestamps: true
});

// Indexes
bloodRequestSchema.index({ recipient: 1 });
bloodRequestSchema.index({ status: 1 });
bloodRequestSchema.index({ urgency: 1 });
bloodRequestSchema.index({ bloodType: 1 });
bloodRequestSchema.index({ requiredBy: 1 });
bloodRequestSchema.index({ 'hospital.location': '2dsphere' });

// Virtual for is expired
bloodRequestSchema.virtual('isExpired').get(function() {
  return this.requiredBy < new Date() && this.status === REQUEST_STATUS.PENDING;
});

// Virtual for is urgent
bloodRequestSchema.virtual('isUrgent').get(function() {
  const hoursUntilRequired = (this.requiredBy - Date.now()) / (1000 * 60 * 60);
  return hoursUntilRequired <= 24 || this.urgency === REQUEST_URGENCY.CRITICAL;
});

// Method to check if fully fulfilled
bloodRequestSchema.methods.checkFulfillment = function() {
  if (this.totalUnitsFulfilled >= this.unitsRequired) {
    this.status = REQUEST_STATUS.FULFILLED;
  }
};

// Pre-save middleware to check expiration
bloodRequestSchema.pre('save', function(next) {
  if (this.isExpired && this.status === REQUEST_STATUS.PENDING) {
    this.status = REQUEST_STATUS.EXPIRED;
  }
  next();
});

const BloodRequest = mongoose.model('BloodRequest', bloodRequestSchema);

export default BloodRequest;
