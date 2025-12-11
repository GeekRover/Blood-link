import mongoose from 'mongoose';
import User from './User.js';

const donorProfileSchema = new mongoose.Schema({
  lastDonationDate: {
    type: Date,
    default: null
  },
  totalDonations: {
    type: Number,
    default: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  availabilityRadius: {
    type: Number,
    default: 50, // km
    min: 1,
    max: 200
  },
  medicalHistory: {
    hasChronicDiseases: { type: Boolean, default: false },
    diseases: [String],
    currentMedications: [String],
    allergies: [String],
    lastHealthCheckup: Date,
    weight: Number, // kg
    hemoglobinLevel: Number
  },
  preferences: {
    preferredDonationCenter: String,
    notificationEnabled: { type: Boolean, default: true },
    smsNotification: { type: Boolean, default: true },
    emailNotification: { type: Boolean, default: true },
    urgentOnly: { type: Boolean, default: false }
  },
  badge: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'None'],
    default: 'None'
  },
  achievements: [{
    name: String,
    description: String,
    earnedAt: { type: Date, default: Date.now },
    icon: String
  }]
}, {
  timestamps: true
});

// Virtual for donation eligibility
donorProfileSchema.virtual('isEligibleToDonate').get(function() {
  if (!this.lastDonationDate) return true;

  const daysSinceLastDonation = Math.floor(
    (Date.now() - this.lastDonationDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const cooldownDays = parseInt(process.env.DONATION_COOLDOWN_DAYS) || 90;
  return daysSinceLastDonation >= cooldownDays;
});

// Virtual for days until eligible
donorProfileSchema.virtual('daysUntilEligible').get(function() {
  if (!this.lastDonationDate) return 0;

  const cooldownDays = parseInt(process.env.DONATION_COOLDOWN_DAYS) || 90;
  const daysSinceLastDonation = Math.floor(
    (Date.now() - this.lastDonationDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const daysRemaining = cooldownDays - daysSinceLastDonation;
  return daysRemaining > 0 ? daysRemaining : 0;
});

// Method to update badge based on donations
donorProfileSchema.methods.updateBadge = function() {
  const donations = this.totalDonations;

  if (donations >= 50) this.badge = 'Diamond';
  else if (donations >= 25) this.badge = 'Platinum';
  else if (donations >= 10) this.badge = 'Gold';
  else if (donations >= 5) this.badge = 'Silver';
  else if (donations >= 1) this.badge = 'Bronze';
  else this.badge = 'None';
};

// Create Donor model as discriminator of User
const DonorProfile = User.discriminator('donor', donorProfileSchema);

export default DonorProfile;
