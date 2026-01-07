import * as analyticsService from '../services/analyticsService.js';

/**
 * Analytics Controller
 * Handle analytics and dashboard API requests
 */

/**
 * Get real-time dashboard statistics
 * GET /api/analytics/dashboard
 */
export const getDashboardStats = async (req, res) => {
  try {
    const stats = await analyticsService.getDashboardStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboard statistics'
    });
  }
};

/**
 * Get monthly donation trends (last 12 months)
 * GET /api/analytics/trends/donations
 */
export const getDonationTrends = async (req, res) => {
  try {
    const trends = await analyticsService.getMonthlyDonationTrends();

    res.status(200).json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Get donation trends error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve donation trends'
    });
  }
};

/**
 * Get monthly request trends (last 12 months)
 * GET /api/analytics/trends/requests
 */
export const getRequestTrends = async (req, res) => {
  try {
    const trends = await analyticsService.getMonthlyRequestTrends();

    res.status(200).json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Get request trends error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve request trends'
    });
  }
};

/**
 * Get blood group demand vs supply analysis
 * GET /api/analytics/blood-groups
 */
export const getBloodGroupAnalysis = async (req, res) => {
  try {
    const analysis = await analyticsService.getBloodGroupAnalysis();

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Get blood group analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve blood group analysis'
    });
  }
};

/**
 * Get urgency distribution statistics
 * GET /api/analytics/urgency-distribution
 */
export const getUrgencyDistribution = async (req, res) => {
  try {
    const distribution = await analyticsService.getUrgencyDistribution();

    res.status(200).json({
      success: true,
      data: distribution
    });
  } catch (error) {
    console.error('Get urgency distribution error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve urgency distribution'
    });
  }
};

/**
 * Get custom date range analytics
 * GET /api/analytics/custom-range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const getCustomRangeAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Both startDate and endDate are required'
      });
    }

    // Validate date format
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        error: 'Start date must be before or equal to end date'
      });
    }

    const analytics = await analyticsService.getCustomRangeAnalytics(startDate, endDate);

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get custom range analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve custom range analytics'
    });
  }
};

/**
 * Get analytics summary for date range
 * GET /api/analytics/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const getAnalyticsSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Both startDate and endDate are required'
      });
    }

    const summary = await analyticsService.getAnalyticsSummary(
      new Date(startDate),
      new Date(endDate)
    );

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get analytics summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve analytics summary'
    });
  }
};

/**
 * Generate daily analytics (admin only)
 * POST /api/analytics/generate
 */
export const generateDailyAnalytics = async (req, res) => {
  try {
    const { date } = req.body;
    const analyticsDate = date ? new Date(date) : new Date();

    const analytics = await analyticsService.generateDailyAnalytics(analyticsDate);

    res.status(201).json({
      success: true,
      message: 'Daily analytics generated successfully',
      data: analytics
    });
  } catch (error) {
    console.error('Generate daily analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate daily analytics'
    });
  }
};

/**
 * Export analytics data as CSV
 * GET /api/analytics/export/csv?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const exportCSV = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Both startDate and endDate are required'
      });
    }

    const analytics = await analyticsService.getCustomRangeAnalytics(startDate, endDate);

    // Generate CSV content
    let csv = 'Metric,Value\n';
    csv += `Date Range,"${startDate} to ${endDate}"\n`;
    csv += `Total Days,${analytics.dateRange.days}\n`;
    csv += `\nSummary\n`;
    csv += `Total Donations,${analytics.summary.donations}\n`;
    csv += `Total Requests,${analytics.summary.requests}\n`;
    csv += `New Users,${analytics.summary.newUsers}\n`;
    csv += `Blood Camps,${analytics.summary.bloodCamps}\n`;
    csv += `\nTop Blood Types\n`;
    csv += `Blood Type,Request Count\n`;

    analytics.topBloodTypes.forEach(item => {
      csv += `${item.bloodType},${item.count}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-${startDate}-to-${endDate}.csv`);
    res.status(200).send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics as CSV'
    });
  }
};

/**
 * Export analytics data as JSON
 * GET /api/analytics/export/json?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const exportJSON = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Both startDate and endDate are required'
      });
    }

    const analytics = await analyticsService.getCustomRangeAnalytics(startDate, endDate);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-${startDate}-to-${endDate}.json`);
    res.status(200).json(analytics);
  } catch (error) {
    console.error('Export JSON error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics as JSON'
    });
  }
};

export default {
  getDashboardStats,
  getDonationTrends,
  getRequestTrends,
  getBloodGroupAnalysis,
  getUrgencyDistribution,
  getCustomRangeAnalytics,
  getAnalyticsSummary,
  generateDailyAnalytics,
  exportCSV,
  exportJSON
};
