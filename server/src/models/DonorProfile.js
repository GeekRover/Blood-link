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
  }],
  // Availability scheduling system
  availabilitySchedule: {
    enabled: { type: Boolean, default: false }, // Whether to use scheduled availability
    weeklySlots: [{
      dayOfWeek: {
        type: Number,
        min: 0,
        max: 6,
        required: true
      }, // 0=Sunday, 1=Monday, ..., 6=Saturday
      startTime: {
        type: String,
        required: true,
        match: /^([01]\d|2[0-3]):([0-5]\d)$/ // HH:MM format
      },
      endTime: {
        type: String,
        required: true,
        match: /^([01]\d|2[0-3]):([0-5]\d)$/ // HH:MM format
      },
      isActive: { type: Boolean, default: true }
    }],
    customAvailability: [{
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      startTime: {
        type: String,
        match: /^([01]\d|2[0-3]):([0-5]\d)$/
      },
      endTime: {
        type: String,
        match: /^([01]\d|2[0-3]):([0-5]\d)$/
      },
      isAvailable: { type: Boolean, default: true }, // true = available, false = unavailable (override)
      reason: String // e.g., "vacation", "busy", "available for emergency"
    }],
    timezone: { type: String, default: 'Asia/Dhaka' } // Donor's timezone
  }
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

// Method to check if donor is available at a specific time
donorProfileSchema.methods.isAvailableAt = function(dateTime = new Date()) {
  // If scheduled availability is not enabled, use the simple isAvailable flag
  if (!this.availabilitySchedule?.enabled) {
    return this.isAvailable;
  }

  // Check custom availability first (overrides weekly schedule)
  const customAvailability = this.checkCustomAvailability(dateTime);
  if (customAvailability !== null) {
    return customAvailability;
  }

  // Check weekly schedule
  return this.checkWeeklyAvailability(dateTime);
};

// Helper method to check custom availability (date-specific overrides)
donorProfileSchema.methods.checkCustomAvailability = function(dateTime) {
  if (!this.availabilitySchedule?.customAvailability?.length) {
    return null; // No custom availability set
  }

  const checkDate = new Date(dateTime);

  for (const custom of this.availabilitySchedule.customAvailability) {
    const startDate = new Date(custom.startDate);
    const endDate = new Date(custom.endDate);

    // Check if dateTime falls within this custom availability period
    if (checkDate >= startDate && checkDate <= endDate) {
      // If time slots are specified, check time too
      if (custom.startTime && custom.endTime) {
        const isWithinTimeSlot = this.isTimeWithinSlot(
          checkDate,
          custom.startTime,
          custom.endTime
        );
        if (isWithinTimeSlot) {
          return custom.isAvailable;
        }
      } else {
        // No time restriction, return availability for the whole day
        return custom.isAvailable;
      }
    }
  }

  return null; // No matching custom availability
};

// Helper method to check weekly schedule availability
donorProfileSchema.methods.checkWeeklyAvailability = function(dateTime) {
  if (!this.availabilitySchedule?.weeklySlots?.length) {
    return this.isAvailable; // No schedule set, use default
  }

  const checkDate = new Date(dateTime);
  const dayOfWeek = checkDate.getDay(); // 0=Sunday, 6=Saturday

  // Find all active slots for this day of week
  const daySlots = this.availabilitySchedule.weeklySlots.filter(
    slot => slot.dayOfWeek === dayOfWeek && slot.isActive
  );

  if (daySlots.length === 0) {
    return false; // No slots for this day
  }

  // Check if current time falls within any slot for this day
  return daySlots.some(slot =>
    this.isTimeWithinSlot(checkDate, slot.startTime, slot.endTime)
  );
};

// Helper method to check if a time falls within a time slot
donorProfileSchema.methods.isTimeWithinSlot = function(dateTime, startTime, endTime) {
  const checkDate = new Date(dateTime);
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const checkMinutes = checkDate.getHours() * 60 + checkDate.getMinutes();
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // Handle slots that cross midnight
  if (endMinutes < startMinutes) {
    return checkMinutes >= startMinutes || checkMinutes <= endMinutes;
  }

  return checkMinutes >= startMinutes && checkMinutes <= endMinutes;
};

// Create Donor model as discriminator of User
const DonorProfile = User.discriminator('donor', donorProfileSchema);

export default DonorProfile;
