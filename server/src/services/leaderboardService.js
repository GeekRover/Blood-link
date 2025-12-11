import Leaderboard from '../models/Leaderboard.js';
import LeaderboardEntry from '../models/LeaderboardEntry.js';
import DonationHistory from '../models/DonationHistory.js';
import DonorProfile from '../models/DonorProfile.js';
import { LEADERBOARD_POINTS } from '../config/constants.js';

/**
 * Calculate points for a donation
 * @param {object} donation - Donation details
 * @param {object} request - Blood request details (optional)
 * @returns {number} - Points earned
 */
export const calculateDonationPoints = (donation, request = null) => {
  let points = LEADERBOARD_POINTS.DONATION;

  // Bonus for urgent/critical requests
  if (request) {
    if (request.urgency === 'critical') {
      points += LEADERBOARD_POINTS.CRITICAL_BONUS;
    } else if (request.urgency === 'urgent') {
      points += LEADERBOARD_POINTS.URGENT_BONUS;
    }
  }

  // Bonus for multiple units
  if (donation.unitsProvided > 1) {
    points += (donation.unitsProvided - 1) * 20;
  }

  return points;
};

/**
 * Update leaderboard after donation
 * @param {string} donorId - Donor user ID
 * @param {number} points - Points to add
 * @param {string} period - Leaderboard period
 * @returns {Promise<object>} - Updated entry
 */
export const updateLeaderboardEntry = async (donorId, points, period = 'all-time') => {
  try {
    // Get or create leaderboard
    const leaderboard = await Leaderboard.getCurrent(period);

    // Get donor stats
    const donor = await DonorProfile.findById(donorId);
    const donations = await DonationHistory.countDocuments({
      donor: donorId,
      verificationStatus: 'verified'
    });

    // Find or create entry
    let entry = await LeaderboardEntry.findOne({
      leaderboard: leaderboard._id,
      donor: donorId
    });

    if (entry) {
      // Update existing entry
      entry.points += points;
      entry.totalDonations = donations;
      entry.pointsBreakdown.donationPoints += points;
    } else {
      // Create new entry
      entry = new LeaderboardEntry({
        leaderboard: leaderboard._id,
        donor: donorId,
        rank: 9999, // Temporary rank, will be updated
        points: points,
        totalDonations: donations,
        pointsBreakdown: {
          donationPoints: points,
          bonusPoints: 0,
          milestonePoints: 0,
          reviewPoints: 0
        }
      });
    }

    // Update badge
    entry.badge = calculateBadge(donations);

    // Check for milestone bonuses
    const milestoneBonus = checkMilestones(donations);
    if (milestoneBonus > 0) {
      entry.points += milestoneBonus;
      entry.pointsBreakdown.milestonePoints += milestoneBonus;
    }

    await entry.save();

    // Recalculate rankings
    await LeaderboardEntry.updateRankings(leaderboard._id);

    // Get updated entry with rank
    return await LeaderboardEntry.findById(entry._id)
      .populate('donor', 'name bloodType profilePicture');
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    throw error;
  }
};

/**
 * Calculate badge based on donation count
 * @param {number} donations - Total donations
 * @returns {string} - Badge name
 */
const calculateBadge = (donations) => {
  if (donations >= 50) return 'Diamond';
  if (donations >= 25) return 'Platinum';
  if (donations >= 10) return 'Gold';
  if (donations >= 5) return 'Silver';
  if (donations >= 1) return 'Bronze';
  return 'None';
};

/**
 * Check for milestone achievements
 * @param {number} donations - Total donations
 * @returns {number} - Bonus points
 */
const checkMilestones = (donations) => {
  const milestones = {
    1: LEADERBOARD_POINTS.FIRST_DONATION,
    10: LEADERBOARD_POINTS.MILESTONE_10,
    25: LEADERBOARD_POINTS.MILESTONE_25,
    50: LEADERBOARD_POINTS.MILESTONE_50
  };

  return milestones[donations] || 0;
};

/**
 * Get leaderboard with rankings
 * @param {string} period - Leaderboard period
 * @param {number} limit - Number of entries
 * @returns {Promise<Array>} - Leaderboard entries
 */
export const getLeaderboard = async (period = 'all-time', limit = 100) => {
  try {
    const leaderboard = await Leaderboard.getCurrent(period);

    const entries = await LeaderboardEntry.find({
      leaderboard: leaderboard._id
    })
      .sort({ rank: 1 })
      .limit(limit)
      .populate('donor', 'name bloodType profilePicture location')
      .lean();

    return {
      period,
      leaderboard,
      entries,
      totalEntries: entries.length
    };
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    throw error;
  }
};

/**
 * Get donor's rank and position
 * @param {string} donorId - Donor user ID
 * @param {string} period - Leaderboard period
 * @returns {Promise<object>} - Rank details
 */
export const getDonorRank = async (donorId, period = 'all-time') => {
  try {
    const leaderboard = await Leaderboard.getCurrent(period);

    const entry = await LeaderboardEntry.findOne({
      leaderboard: leaderboard._id,
      donor: donorId
    }).populate('donor', 'name bloodType profilePicture');

    if (!entry) {
      return {
        rank: null,
        points: 0,
        totalDonations: 0,
        message: 'Not ranked yet'
      };
    }

    // Get total entries count
    const totalEntries = await LeaderboardEntry.countDocuments({
      leaderboard: leaderboard._id
    });

    // Get nearby ranks
    const nearbyEntries = await LeaderboardEntry.find({
      leaderboard: leaderboard._id,
      rank: {
        $gte: Math.max(1, entry.rank - 2),
        $lte: entry.rank + 2
      }
    })
      .sort({ rank: 1 })
      .populate('donor', 'name bloodType profilePicture');

    return {
      rank: entry.rank,
      points: entry.points,
      totalDonations: entry.totalDonations,
      badge: entry.badge,
      rankChange: entry.rankChange,
      totalEntries,
      percentile: ((totalEntries - entry.rank + 1) / totalEntries * 100).toFixed(1),
      nearbyRanks: nearbyEntries,
      pointsBreakdown: entry.pointsBreakdown
    };
  } catch (error) {
    console.error('Error getting donor rank:', error);
    throw error;
  }
};

/**
 * Add review points to donor
 * @param {string} donorId - Donor user ID
 * @param {number} points - Review points
 * @returns {Promise<object>} - Updated entry
 */
export const addReviewPoints = async (donorId, points = LEADERBOARD_POINTS.REVIEW_BONUS) => {
  try {
    const leaderboard = await Leaderboard.getCurrent('all-time');

    const entry = await LeaderboardEntry.findOne({
      leaderboard: leaderboard._id,
      donor: donorId
    });

    if (entry) {
      entry.points += points;
      entry.pointsBreakdown.reviewPoints += points;
      await entry.save();

      await LeaderboardEntry.updateRankings(leaderboard._id);
    }

    return entry;
  } catch (error) {
    console.error('Error adding review points:', error);
    throw error;
  }
};

/**
 * Get top donors by blood type
 * @param {string} bloodType - Blood type
 * @param {number} limit - Number of donors
 * @returns {Promise<Array>} - Top donors
 */
export const getTopDonorsByBloodType = async (bloodType, limit = 10) => {
  try {
    const leaderboard = await Leaderboard.getCurrent('all-time');

    const entries = await LeaderboardEntry.find({
      leaderboard: leaderboard._id
    })
      .populate({
        path: 'donor',
        match: { bloodType: bloodType },
        select: 'name bloodType profilePicture location'
      })
      .sort({ rank: 1 })
      .limit(limit * 2); // Get extra to account for filtering

    // Filter out null donors (didn't match blood type)
    const filtered = entries
      .filter(entry => entry.donor !== null)
      .slice(0, limit);

    return filtered;
  } catch (error) {
    console.error('Error getting top donors by blood type:', error);
    throw error;
  }
};

export default {
  calculateDonationPoints,
  updateLeaderboardEntry,
  getLeaderboard,
  getDonorRank,
  addReviewPoints,
  getTopDonorsByBloodType
};
