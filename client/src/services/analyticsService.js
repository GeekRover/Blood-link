import api from './api';

/**
 * Analytics Service
 * API calls for analytics and dashboard data
 */

/**
 * Get real-time dashboard statistics
 * @returns {Promise} - Dashboard stats
 */
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/analytics/dashboard');
    // api interceptor already unwraps response.data
    return response;
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    throw error.response?.data || { error: 'Failed to fetch dashboard statistics' };
  }
};

/**
 * Get monthly donation trends (last 12 months)
 * @returns {Promise} - Donation trends data
 */
export const getDonationTrends = async () => {
  try {
    const response = await api.get('/analytics/trends/donations');
    // api interceptor already unwraps response.data
    return response;
  } catch (error) {
    console.error('Get donation trends error:', error);
    throw error.response?.data || { error: 'Failed to fetch donation trends' };
  }
};

/**
 * Get monthly request trends (last 12 months)
 * @returns {Promise} - Request trends data
 */
export const getRequestTrends = async () => {
  try {
    const response = await api.get('/analytics/trends/requests');
    // api interceptor already unwraps response.data
    return response;
  } catch (error) {
    console.error('Get request trends error:', error);
    throw error.response?.data || { error: 'Failed to fetch request trends' };
  }
};

/**
 * Get blood group demand vs supply analysis
 * @returns {Promise} - Blood group analysis data
 */
export const getBloodGroupAnalysis = async () => {
  try {
    const response = await api.get('/analytics/blood-groups');
    // api interceptor already unwraps response.data
    return response;
  } catch (error) {
    console.error('Get blood group analysis error:', error);
    throw error.response?.data || { error: 'Failed to fetch blood group analysis' };
  }
};

/**
 * Get urgency distribution statistics
 * @returns {Promise} - Urgency distribution data
 */
export const getUrgencyDistribution = async () => {
  try {
    const response = await api.get('/analytics/urgency-distribution');
    // api interceptor already unwraps response.data
    return response;
  } catch (error) {
    console.error('Get urgency distribution error:', error);
    throw error.response?.data || { error: 'Failed to fetch urgency distribution' };
  }
};

/**
 * Get custom date range analytics
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise} - Custom range analytics data
 */
export const getCustomRangeAnalytics = async (startDate, endDate) => {
  try {
    const response = await api.get('/analytics/custom-range', {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    console.error('Get custom range analytics error:', error);
    throw error.response?.data || { error: 'Failed to fetch custom range analytics' };
  }
};

/**
 * Get analytics summary for date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise} - Analytics summary
 */
export const getAnalyticsSummary = async (startDate, endDate) => {
  try {
    const response = await api.get('/analytics/summary', {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    console.error('Get analytics summary error:', error);
    throw error.response?.data || { error: 'Failed to fetch analytics summary' };
  }
};

/**
 * Export analytics data as CSV
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise} - CSV file download
 */
export const exportCSV = async (startDate, endDate) => {
  try {
    const response = await api.get('/analytics/export/csv', {
      params: { startDate, endDate },
      responseType: 'blob'
    });

    // When responseType is 'blob', axios returns the blob directly
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `analytics-${startDate}-to-${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    return { success: true };
  } catch (error) {
    console.error('Export CSV error:', error);
    throw error.response?.data || { error: 'Failed to export CSV' };
  }
};

/**
 * Export analytics data as JSON
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise} - JSON file download
 */
export const exportJSON = async (startDate, endDate) => {
  try {
    const response = await api.get('/analytics/export/json', {
      params: { startDate, endDate },
      responseType: 'blob'
    });

    // When responseType is 'blob', axios returns the blob directly
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `analytics-${startDate}-to-${endDate}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    return { success: true };
  } catch (error) {
    console.error('Export JSON error:', error);
    throw error.response?.data || { error: 'Failed to export JSON' };
  }
};

/**
 * Generate daily analytics (admin only)
 * @returns {Promise} - Generation result
 */
export const generateDailyAnalytics = async () => {
  try {
    const response = await api.post('/analytics/generate');
    return response;
  } catch (error) {
    console.error('Generate daily analytics error:', error);
    throw error.response?.data || { error: 'Failed to generate analytics' };
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
  exportCSV,
  exportJSON,
  generateDailyAnalytics
};
