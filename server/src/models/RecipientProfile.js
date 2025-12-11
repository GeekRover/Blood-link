import mongoose from 'mongoose';
import User from './User.js';

const recipientProfileSchema = new mongoose.Schema({
  emergencyContact: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    relationship: String
  },
  medicalCondition: {
    diagnosis: String,
    treatmentCenter: String,
    attendingPhysician: String,
    physicianContact: String,
    bloodRequirementReason: String,
    estimatedUnitsNeeded: Number
  },
  requestHistory: {
    totalRequests: { type: Number, default: 0 },
    fulfilledRequests: { type: Number, default: 0 },
    activeRequests: { type: Number, default: 0 }
  },
  preferences: {
    notificationEnabled: { type: Boolean, default: true },
    smsNotification: { type: Boolean, default: true },
    emailNotification: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Virtual for success rate
recipientProfileSchema.virtual('successRate').get(function() {
  if (this.requestHistory.totalRequests === 0) return 0;
  return (this.requestHistory.fulfilledRequests / this.requestHistory.totalRequests * 100).toFixed(2);
});

// Create Recipient model as discriminator of User
const RecipientProfile = User.discriminator('recipient', recipientProfileSchema);

export default RecipientProfile;
