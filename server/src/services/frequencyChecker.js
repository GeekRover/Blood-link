import DonationHistory from '../models/DonationHistory.js';
import DonorProfile from '../models/DonorProfile.js';
import { DONATION_COOLDOWN_DAYS } from '../config/constants.js';

/**
 * Check if donor is eligible to donate based on frequency rules
 * @param {string} donorId - Donor user ID
 * @returns {Promise<object>} - Eligibility status and details
 */
export const checkDonationEligibility = async (donorId) => {
  try {
    // Get donor profile
    const donor = await DonorProfile.findById(donorId);

    if (!donor) {
      return {
        eligible: false,
        reason: 'Donor not found',
        nextEligibleDate: null
      };
    }

    // Check if donor is available
    if (!donor.isAvailable) {
      return {
        eligible: false,
        reason: 'Donor marked as unavailable',
        nextEligibleDate: null
      };
    }

    // Check verification status
    if (donor.verificationStatus !== 'verified') {
      return {
        eligible: false,
        reason: 'Donor account not verified',
        nextEligibleDate: null
      };
    }

    // Check age eligibility
    const age = donor.age;
    if (age < 18 || age > 65) {
      return {
        eligible: false,
        reason: `Donor age (${age}) is outside eligible range (18-65)`,
        nextEligibleDate: null
      };
    }

    // Get last donation
    const lastDonation = await DonationHistory.findOne({
      donor: donorId,
      verificationStatus: 'verified'
    })
      .sort({ donationDate: -1 })
      .limit(1);

    if (!lastDonation) {
      // First time donor - eligible
      return {
        eligible: true,
        reason: 'First time donor',
        daysSinceLastDonation: null,
        nextEligibleDate: null,
        isFirstTime: true
      };
    }

    // Calculate days since last donation
    const daysSinceLastDonation = Math.floor(
      (Date.now() - lastDonation.donationDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check cooldown period
    if (daysSinceLastDonation < DONATION_COOLDOWN_DAYS) {
      const daysRemaining = DONATION_COOLDOWN_DAYS - daysSinceLastDonation;
      const nextEligibleDate = new Date(
        lastDonation.donationDate.getTime() + DONATION_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
      );

      return {
        eligible: false,
        reason: `Must wait ${DONATION_COOLDOWN_DAYS} days between donations`,
        daysSinceLastDonation,
        daysRemaining,
        nextEligibleDate,
        lastDonationDate: lastDonation.donationDate,
        isFirstTime: false
      };
    }

    // Eligible to donate
    return {
      eligible: true,
      reason: 'Eligible to donate',
      daysSinceLastDonation,
      lastDonationDate: lastDonation.donationDate,
      nextEligibleDate: null,
      isFirstTime: false
    };
  } catch (error) {
    console.error('Error checking donation eligibility:', error);
    throw error;
  }
};

/**
 * Get donors who are now eligible and send reminders
 * @returns {Promise<Array>} - List of newly eligible donors
 */
export const getNewlyEligibleDonors = async () => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DONATION_COOLDOWN_DAYS);

    // Find donations exactly DONATION_COOLDOWN_DAYS ago
    const startOfDay = new Date(cutoffDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(cutoffDate);
    endOfDay.setHours(23, 59, 59, 999);

    const eligibleDonations = await DonationHistory.find({
      donationDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      verificationStatus: 'verified'
    }).populate('donor');

    const eligibleDonors = eligibleDonations
      .map(d => d.donor)
      .filter(donor => donor && donor.isAvailable && donor.preferences?.notificationEnabled);

    return eligibleDonors;
  } catch (error) {
    console.error('Error getting newly eligible donors:', error);
    return [];
  }
};

/**
 * Calculate next eligible donation date
 * @param {Date} lastDonationDate - Date of last donation
 * @returns {Date} - Next eligible date
 */
export const calculateNextEligibleDate = (lastDonationDate) => {
  const nextDate = new Date(lastDonationDate);
  nextDate.setDate(nextDate.getDate() + DONATION_COOLDOWN_DAYS);
  return nextDate;
};

/**
 * Validate donation against frequency rules
 * @param {string} donorId - Donor ID
 * @param {Date} proposedDate - Proposed donation date
 * @returns {Promise<object>} - Validation result
 */
export const validateDonationDate = async (donorId, proposedDate) => {
  const eligibility = await checkDonationEligibility(donorId);

  if (!eligibility.eligible) {
    return {
      valid: false,
      message: eligibility.reason,
      nextEligibleDate: eligibility.nextEligibleDate
    };
  }

  // Check if proposed date is not in the future
  if (new Date(proposedDate) > new Date()) {
    return {
      valid: false,
      message: 'Donation date cannot be in the future',
      nextEligibleDate: null
    };
  }

  return {
    valid: true,
    message: 'Donation date is valid',
    eligibility
  };
};

/**
 * Get donation statistics for a donor
 * @param {string} donorId - Donor ID
 * @returns {Promise<object>} - Statistics
 */
export const getDonorStatistics = async (donorId) => {
  try {
    const donations = await DonationHistory.find({
      donor: donorId,
      verificationStatus: 'verified'
    }).sort({ donationDate: -1 });

    const totalDonations = donations.length;
    const totalUnits = donations.reduce((sum, d) => sum + d.unitsProvided, 0);

    let averageDaysBetween = null;
    if (donations.length > 1) {
      const intervals = [];
      for (let i = 0; i < donations.length - 1; i++) {
        const days = Math.floor(
          (donations[i].donationDate - donations[i + 1].donationDate) / (1000 * 60 * 60 * 24)
        );
        intervals.push(days);
      }
      averageDaysBetween = Math.round(
        intervals.reduce((sum, days) => sum + days, 0) / intervals.length
      );
    }

    return {
      totalDonations,
      totalUnits,
      firstDonation: donations[donations.length - 1]?.donationDate,
      lastDonation: donations[0]?.donationDate,
      averageDaysBetween,
      donationHistory: donations
    };
  } catch (error) {
    console.error('Error getting donor statistics:', error);
    throw error;
  }
};

export default {
  checkDonationEligibility,
  getNewlyEligibleDonors,
  calculateNextEligibleDate,
  validateDonationDate,
  getDonorStatistics
};
