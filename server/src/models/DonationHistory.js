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
  followUpDate: Date,

  // Immutability fields
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedAt: Date,
  lockedReason: {
    type: String,
    enum: ['verified', 'admin_locked', 'compliance_review'],
    default: null
  },

  // Edit history for audit trail
  editHistory: [{
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    editedAt: {
      type: Date,
      default: Date.now
    },
    fieldChanged: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    reason: String,
    isAdminOverride: {
      type: Boolean,
      default: false
    }
  }],

  // Track admin overrides separately for compliance
  adminOverrides: [{
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    overrideAt: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      required: true
    },
    changesDescription: String,
    ipAddress: String
  }]
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

// Virtual for checking if donation can be edited
donationHistorySchema.virtual('isEditable').get(function() {
  return !this.isLocked;
});

// Fields that are always immutable once donation is created
const ALWAYS_IMMUTABLE_FIELDS = ['donor', 'donationDate', 'bloodType'];

// Fields that become immutable after verification
const POST_VERIFICATION_IMMUTABLE_FIELDS = [
  'unitsProvided',
  'donationCenter',
  'healthCheckBefore',
  'healthCheckAfter',
  'bloodRequest',
  'recipient'
];

// Method to lock donation
donationHistorySchema.methods.lockDonation = function(reason = 'verified') {
  this.isLocked = true;
  this.lockedAt = new Date();
  this.lockedReason = reason;
};

// Method to unlock donation (admin only)
donationHistorySchema.methods.unlockDonation = function() {
  this.isLocked = false;
  this.lockedAt = null;
  this.lockedReason = null;
};

// Method to check if a specific field can be edited
donationHistorySchema.methods.canEditField = function(fieldName) {
  // Always immutable fields can never be changed
  if (ALWAYS_IMMUTABLE_FIELDS.includes(fieldName)) {
    return {
      canEdit: false,
      reason: `Field '${fieldName}' is always immutable and cannot be changed`
    };
  }

  // If donation is locked, check if field is in post-verification immutable list
  if (this.isLocked && POST_VERIFICATION_IMMUTABLE_FIELDS.includes(fieldName)) {
    return {
      canEdit: false,
      reason: `Field '${fieldName}' is locked after verification. Admin override required.`
    };
  }

  return { canEdit: true };
};

// Method to record an edit in history
donationHistorySchema.methods.recordEdit = function(editedBy, fieldChanged, oldValue, newValue, reason, isAdminOverride = false) {
  this.editHistory.push({
    editedBy,
    editedAt: new Date(),
    fieldChanged,
    oldValue,
    newValue,
    reason,
    isAdminOverride
  });
};

// Method to record admin override
donationHistorySchema.methods.recordAdminOverride = function(adminId, reason, changesDescription, ipAddress) {
  this.adminOverrides.push({
    admin: adminId,
    overrideAt: new Date(),
    reason,
    changesDescription,
    ipAddress
  });
};

// Pre-save middleware to auto-lock on verification
donationHistorySchema.pre('save', function(next) {
  // Auto-lock when verification status changes to 'verified'
  if (this.isModified('verificationStatus') && this.verificationStatus === 'verified') {
    if (!this.isLocked) {
      this.lockDonation('verified');
    }
  }
  next();
});

// Static method to get immutability rules
donationHistorySchema.statics.getImmutabilityRules = function() {
  return {
    alwaysImmutable: ALWAYS_IMMUTABLE_FIELDS,
    postVerificationImmutable: POST_VERIFICATION_IMMUTABLE_FIELDS,
    description: {
      alwaysImmutable: 'These fields can never be changed once the donation record is created',
      postVerificationImmutable: 'These fields become immutable after the donation is verified'
    }
  };
};

// Static method to check if update is allowed
donationHistorySchema.statics.validateUpdate = function(donation, updates, isAdminOverride = false) {
  const errors = [];
  const warnings = [];

  for (const [field, newValue] of Object.entries(updates)) {
    // Skip internal fields
    if (['_id', '__v', 'createdAt', 'updatedAt', 'editHistory', 'adminOverrides'].includes(field)) {
      continue;
    }

    // Check always immutable fields
    if (ALWAYS_IMMUTABLE_FIELDS.includes(field)) {
      errors.push({
        field,
        message: `Field '${field}' is always immutable and cannot be changed`,
        severity: 'error'
      });
      continue;
    }

    // Check post-verification immutable fields
    if (donation.isLocked && POST_VERIFICATION_IMMUTABLE_FIELDS.includes(field)) {
      if (isAdminOverride) {
        warnings.push({
          field,
          message: `Field '${field}' is being modified via admin override`,
          severity: 'warning'
        });
      } else {
        errors.push({
          field,
          message: `Field '${field}' is locked after verification. Use admin override to modify.`,
          severity: 'error'
        });
      }
    }
  }

  return {
    allowed: errors.length === 0,
    errors,
    warnings
  };
};

const DonationHistory = mongoose.model('DonationHistory', donationHistorySchema);

export default DonationHistory;
