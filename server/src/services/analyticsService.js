import Analytics from '../models/Analytics.js';
import User from '../models/User.js';
import BloodRequest from '../models/BloodRequest.js';
import DonationHistory from '../models/DonationHistory.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import Blog from '../models/Blog.js';
import BloodCampEvent from '../models/BloodCampEvent.js';
import { BLOOD_TYPES } from '../config/constants.js';

/**
 * Generate daily analytics
 * @param {Date} date - Date to generate analytics for
 * @returns {Promise<object>} - Analytics data
 */
export const generateDailyAnalytics = async (date = new Date()) => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // User metrics
    const totalUsers = await User.countDocuments();
    const newUsers = await User.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    const activeDonors = await User.countDocuments({
      role: 'donor',
      isActive: true
    });
    const activeRecipients = await User.countDocuments({
      role: 'recipient',
      isActive: true
    });
    const verifiedUsers = await User.countDocuments({
      verificationStatus: 'verified'
    });
    const pendingVerification = await User.countDocuments({
      verificationStatus: 'pending'
    });

    // Request metrics
    const totalRequests = await BloodRequest.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    const pendingRequests = await BloodRequest.countDocuments({
      status: 'pending'
    });
    const matchedRequests = await BloodRequest.countDocuments({
      status: 'matched'
    });
    const fulfilledRequests = await BloodRequest.countDocuments({
      status: 'fulfilled',
      updatedAt: { $gte: startOfDay, $lte: endOfDay }
    });
    const cancelledRequests = await BloodRequest.countDocuments({
      status: 'cancelled'
    });
    const expiredRequests = await BloodRequest.countDocuments({
      status: 'expired'
    });
    const criticalRequests = await BloodRequest.countDocuments({
      urgency: 'critical',
      status: { $in: ['pending', 'matched'] }
    });

    // Donation metrics
    const totalDonations = await DonationHistory.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    const unitsCollected = await DonationHistory.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$unitsProvided' }
        }
      }
    ]);
    const verifiedDonations = await DonationHistory.countDocuments({
      verificationStatus: 'verified'
    });
    const pendingDonations = await DonationHistory.countDocuments({
      verificationStatus: 'pending'
    });

    // Blood type breakdown
    const bloodTypes = {};
    for (const type of BLOOD_TYPES) {
      const requests = await BloodRequest.countDocuments({
        bloodType: type,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      const donations = await DonationHistory.countDocuments({
        bloodType: type,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      bloodTypes[type] = { requests, donations };
    }

    // Engagement metrics
    const chatSessions = await Chat.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    const messages = await Message.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    const blogViews = await Blog.aggregate([
      {
        $match: {
          updatedAt: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$viewCount' }
        }
      }
    ]);
    const eventRegistrations = await BloodCampEvent.aggregate([
      {
        $match: {
          'registeredDonors.registeredAt': { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $project: {
          count: {
            $size: {
              $filter: {
                input: '$registeredDonors',
                as: 'reg',
                cond: {
                  $and: [
                    { $gte: ['$$reg.registeredAt', startOfDay] },
                    { $lte: ['$$reg.registeredAt', endOfDay] }
                  ]
                }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$count' }
        }
      }
    ]);

    // Performance metrics
    const avgResponseTime = await calculateAverageResponseTime(startOfDay, endOfDay);
    const fulfillmentRate = await calculateFulfillmentRate();
    const avgDonationsPerDonor = await calculateAvgDonationsPerDonor();

    // Geography data
    const topCities = await getTopCities(5);

    // Create or update analytics document
    const analytics = await Analytics.findOneAndUpdate(
      { date: startOfDay },
      {
        date: startOfDay,
        metrics: {
          totalUsers,
          newUsers,
          activeDonors,
          activeRecipients,
          verifiedUsers,
          pendingVerification
        },
        requests: {
          total: totalRequests,
          pending: pendingRequests,
          matched: matchedRequests,
          fulfilled: fulfilledRequests,
          cancelled: cancelledRequests,
          expired: expiredRequests,
          criticalRequests,
          avgResponseTime
        },
        donations: {
          total: totalDonations,
          unitsCollected: unitsCollected[0]?.total || 0,
          verified: verifiedDonations,
          pending: pendingDonations
        },
        bloodTypes,
        engagement: {
          chatSessions,
          messages,
          notifications: 0, // Can be tracked separately
          blogViews: blogViews[0]?.total || 0,
          eventRegistrations: eventRegistrations[0]?.total || 0
        },
        geography: {
          topCities
        },
        performance: {
          avgMatchTime: 0, // Can be calculated from request timestamps
          fulfillmentRate,
          donorRetentionRate: 0, // Complex calculation
          avgDonationsPerDonor
        }
      },
      { upsert: true, new: true }
    );

    return analytics;
  } catch (error) {
    console.error('Error generating daily analytics:', error);
    throw error;
  }
};

/**
 * Calculate average response time for requests
 */
const calculateAverageResponseTime = async (startDate, endDate) => {
  const requests = await BloodRequest.find({
    createdAt: { $gte: startDate, $lte: endDate },
    status: { $in: ['matched', 'fulfilled'] }
  });

  if (requests.length === 0) return 0;

  const totalHours = requests.reduce((sum, req) => {
    if (req.matchedDonors.length > 0) {
      const firstResponse = req.matchedDonors[0].notifiedAt;
      const hours = (firstResponse - req.createdAt) / (1000 * 60 * 60);
      return sum + hours;
    }
    return sum;
  }, 0);

  return (totalHours / requests.length).toFixed(2);
};

/**
 * Calculate fulfillment rate
 */
const calculateFulfillmentRate = async () => {
  const totalRequests = await BloodRequest.countDocuments({
    status: { $in: ['fulfilled', 'cancelled', 'expired'] }
  });

  if (totalRequests === 0) return 0;

  const fulfilledRequests = await BloodRequest.countDocuments({
    status: 'fulfilled'
  });

  return ((fulfilledRequests / totalRequests) * 100).toFixed(2);
};

/**
 * Calculate average donations per donor
 */
const calculateAvgDonationsPerDonor = async () => {
  const result = await DonationHistory.aggregate([
    {
      $group: {
        _id: '$donor',
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        avgDonations: { $avg: '$count' }
      }
    }
  ]);

  return result[0]?.avgDonations.toFixed(2) || 0;
};

/**
 * Get top cities by user count
 */
const getTopCities = async (limit = 5) => {
  const result = await User.aggregate([
    {
      $group: {
        _id: '$address.city',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        city: '$_id',
        count: 1
      }
    }
  ]);

  return result;
};

/**
 * Get analytics summary for date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<object>} - Analytics summary
 */
export const getAnalyticsSummary = async (startDate, endDate) => {
  try {
    const analytics = await Analytics.getDateRange(startDate, endDate);

    const summary = {
      totalUsers: 0,
      newUsers: 0,
      totalRequests: 0,
      fulfilledRequests: 0,
      totalDonations: 0,
      unitsCollected: 0,
      avgFulfillmentRate: 0,
      bloodTypeBreakdown: {},
      dailyData: analytics
    };

    analytics.forEach(day => {
      summary.totalUsers = Math.max(summary.totalUsers, day.metrics.totalUsers);
      summary.newUsers += day.metrics.newUsers;
      summary.totalRequests += day.requests.total;
      summary.fulfilledRequests += day.requests.fulfilled;
      summary.totalDonations += day.donations.total;
      summary.unitsCollected += day.donations.unitsCollected;

      // Aggregate blood types
      BLOOD_TYPES.forEach(type => {
        if (!summary.bloodTypeBreakdown[type]) {
          summary.bloodTypeBreakdown[type] = { requests: 0, donations: 0 };
        }
        summary.bloodTypeBreakdown[type].requests += day.bloodTypes[type]?.requests || 0;
        summary.bloodTypeBreakdown[type].donations += day.bloodTypes[type]?.donations || 0;
      });
    });

    if (summary.totalRequests > 0) {
      summary.avgFulfillmentRate = (
        (summary.fulfilledRequests / summary.totalRequests) * 100
      ).toFixed(2);
    }

    return summary;
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    throw error;
  }
};

/**
 * Get real-time dashboard statistics
 * @returns {Promise<object>} - Real-time stats
 */
export const getDashboardStats = async () => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      users: {
        total: await User.countDocuments(),
        donors: await User.countDocuments({ role: 'donor' }),
        recipients: await User.countDocuments({ role: 'recipient' }),
        verified: await User.countDocuments({ verificationStatus: 'verified' }),
        new24h: await User.countDocuments({ createdAt: { $gte: last24Hours } })
      },
      requests: {
        total: await BloodRequest.countDocuments(),
        pending: await BloodRequest.countDocuments({ status: 'pending' }),
        critical: await BloodRequest.countDocuments({
          status: 'pending',
          urgency: 'critical'
        }),
        fulfilled24h: await BloodRequest.countDocuments({
          status: 'fulfilled',
          updatedAt: { $gte: last24Hours }
        })
      },
      donations: {
        total: await DonationHistory.countDocuments(),
        last7Days: await DonationHistory.countDocuments({
          createdAt: { $gte: last7Days }
        }),
        pendingVerification: await DonationHistory.countDocuments({
          verificationStatus: 'pending'
        })
      },
      engagement: {
        activeChats: await Chat.countDocuments({ isActive: true }),
        upcomingEvents: await BloodCampEvent.countDocuments({
          status: 'upcoming',
          eventDate: { $gte: now }
        })
      }
    };

    return stats;
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error;
  }
};

/**
 * Get monthly donation trends (last 12 months)
 */
export const getMonthlyDonationTrends = async () => {
  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const trends = await DonationHistory.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
          verificationStatus: 'verified'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalUnits: { $sum: '$unitsProvided' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          monthName: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id.month', 1] }, then: 'Jan' },
                { case: { $eq: ['$_id.month', 2] }, then: 'Feb' },
                { case: { $eq: ['$_id.month', 3] }, then: 'Mar' },
                { case: { $eq: ['$_id.month', 4] }, then: 'Apr' },
                { case: { $eq: ['$_id.month', 5] }, then: 'May' },
                { case: { $eq: ['$_id.month', 6] }, then: 'Jun' },
                { case: { $eq: ['$_id.month', 7] }, then: 'Jul' },
                { case: { $eq: ['$_id.month', 8] }, then: 'Aug' },
                { case: { $eq: ['$_id.month', 9] }, then: 'Sep' },
                { case: { $eq: ['$_id.month', 10] }, then: 'Oct' },
                { case: { $eq: ['$_id.month', 11] }, then: 'Nov' },
                { case: { $eq: ['$_id.month', 12] }, then: 'Dec' }
              ],
              default: 'Unknown'
            }
          },
          count: 1,
          totalUnits: 1
        }
      }
    ]);

    return trends;
  } catch (error) {
    console.error('Get monthly donation trends error:', error);
    throw error;
  }
};

/**
 * Get monthly request trends (last 12 months)
 */
export const getMonthlyRequestTrends = async () => {
  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const trends = await BloodRequest.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          fulfilled: {
            $sum: { $cond: [{ $eq: ['$status', 'fulfilled'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          monthName: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id.month', 1] }, then: 'Jan' },
                { case: { $eq: ['$_id.month', 2] }, then: 'Feb' },
                { case: { $eq: ['$_id.month', 3] }, then: 'Mar' },
                { case: { $eq: ['$_id.month', 4] }, then: 'Apr' },
                { case: { $eq: ['$_id.month', 5] }, then: 'May' },
                { case: { $eq: ['$_id.month', 6] }, then: 'Jun' },
                { case: { $eq: ['$_id.month', 7] }, then: 'Jul' },
                { case: { $eq: ['$_id.month', 8] }, then: 'Aug' },
                { case: { $eq: ['$_id.month', 9] }, then: 'Sep' },
                { case: { $eq: ['$_id.month', 10] }, then: 'Oct' },
                { case: { $eq: ['$_id.month', 11] }, then: 'Nov' },
                { case: { $eq: ['$_id.month', 12] }, then: 'Dec' }
              ],
              default: 'Unknown'
            }
          },
          count: 1,
          fulfilled: 1
        }
      }
    ]);

    return trends;
  } catch (error) {
    console.error('Get monthly request trends error:', error);
    throw error;
  }
};

/**
 * Get blood group demand vs supply analysis
 */
export const getBloodGroupAnalysis = async () => {
  try {
    const bloodTypes = BLOOD_TYPES;
    const analysis = [];

    for (const bloodType of bloodTypes) {
      // Supply: Active verified donors
      const supply = await User.countDocuments({
        role: 'donor',
        bloodType,
        verificationStatus: 'verified',
        isActive: true
      });

      // Demand: Active pending requests
      const demand = await BloodRequest.countDocuments({
        bloodType,
        status: { $in: ['pending', 'matched'] }
      });

      // Total donations for this blood type (last 3 months)
      const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const recentDonations = await DonationHistory.countDocuments({
        bloodType,
        createdAt: { $gte: threeMonthsAgo },
        verificationStatus: 'verified'
      });

      analysis.push({
        bloodType,
        supply,
        demand,
        recentDonations,
        supplyDemandRatio: demand > 0 ? (supply / demand).toFixed(2) : supply > 0 ? 'Surplus' : 'No Data',
        status: supply >= demand ? 'Adequate' : supply > 0 ? 'Low' : 'Critical'
      });
    }

    return analysis;
  } catch (error) {
    console.error('Get blood group analysis error:', error);
    throw error;
  }
};

/**
 * Get urgency distribution of blood requests
 */
export const getUrgencyDistribution = async () => {
  try {
    const distribution = await BloodRequest.aggregate([
      {
        $group: {
          _id: '$urgency',
          count: { $sum: 1 },
          active: {
            $sum: {
              $cond: [
                { $in: ['$status', ['pending', 'matched']] },
                1,
                0
              ]
            }
          },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$status', 'fulfilled'] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          urgency: '$_id',
          total: '$count',
          active: 1,
          completed: 1,
          fulfillmentRate: {
            $cond: [
              { $eq: ['$count', 0] },
              0,
              { $multiply: [{ $divide: ['$completed', '$count'] }, 100] }
            ]
          }
        }
      },
      {
        $sort: { urgency: 1 }
      }
    ]);

    return distribution.map(item => ({
      urgency: item.urgency || 'normal',
      total: item.total,
      active: item.active,
      completed: item.completed,
      fulfillmentRate: parseFloat(item.fulfillmentRate.toFixed(1))
    }));
  } catch (error) {
    console.error('Get urgency distribution error:', error);
    throw error;
  }
};

/**
 * Get custom date range analytics
 */
export const getCustomRangeAnalytics = async (startDate, endDate) => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Donations in range
    const donations = await DonationHistory.countDocuments({
      createdAt: { $gte: start, $lte: end },
      verificationStatus: 'verified'
    });

    // Blood requests in range
    const requests = await BloodRequest.countDocuments({
      createdAt: { $gte: start, $lte: end }
    });

    // New users registered
    const newUsers = await User.countDocuments({
      createdAt: { $gte: start, $lte: end }
    });

    // Blood camps held
    const bloodCamps = await BloodCampEvent.countDocuments({
      eventDate: { $gte: start, $lte: end }
    });

    // Top blood types requested
    const topBloodTypes = await BloodRequest.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$bloodType',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      },
      {
        $project: {
          _id: 0,
          bloodType: '$_id',
          count: 1
        }
      }
    ]);

    return {
      dateRange: {
        start: start,
        end: end,
        days: Math.ceil((end - start) / (1000 * 60 * 60 * 24))
      },
      summary: {
        donations,
        requests,
        newUsers,
        bloodCamps
      },
      topBloodTypes
    };
  } catch (error) {
    console.error('Get custom range analytics error:', error);
    throw error;
  }
};

export default {
  generateDailyAnalytics,
  getAnalyticsSummary,
  getDashboardStats,
  getMonthlyDonationTrends,
  getMonthlyRequestTrends,
  getBloodGroupAnalysis,
  getUrgencyDistribution,
  getCustomRangeAnalytics
};
