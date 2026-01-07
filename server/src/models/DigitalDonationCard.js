import mongoose from 'mongoose';

const digitalDonationCardSchema = new mongoose.Schema({
  donationHistory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DonationHistory',
    required: true,
    unique: true
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cardNumber: {
    type: String,
    unique: true,
    required: true
  },
  qrCode: {
    type: String,
    required: true
  },
  qrCodeData: {
    type: String,
    required: true
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  verificationCount: {
    type: Number,
    default: 0
  },
  lastVerifiedAt: Date,
  isRevoked: {
    type: Boolean,
    default: false
  },
  revokedAt: Date,
  revokedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  revokeReason: String
}, {
  timestamps: true
});

// Indexes
digitalDonationCardSchema.index({ donor: 1 });
digitalDonationCardSchema.index({ cardNumber: 1 });
digitalDonationCardSchema.index({ donationHistory: 1 });

// Virtual for is valid
digitalDonationCardSchema.virtual('isValid').get(function() {
  return !this.isRevoked && this.validUntil > new Date();
});

// Static method to generate card number
digitalDonationCardSchema.statics.generateCardNumber = async function() {
  const prefix = 'BL';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// Method to verify card
digitalDonationCardSchema.methods.verify = function() {
  if (!this.isValid) {
    throw new Error('Card is not valid');
  }

  this.verificationCount += 1;
  this.lastVerifiedAt = new Date();
  return this.save();
};

// Method to revoke card
digitalDonationCardSchema.methods.revoke = function(revokedBy, reason) {
  this.isRevoked = true;
  this.revokedAt = new Date();
  this.revokedBy = revokedBy;
  this.revokeReason = reason;
  return this.save();
};

const DigitalDonationCard = mongoose.model('DigitalDonationCard', digitalDonationCardSchema);

export default DigitalDonationCard;
