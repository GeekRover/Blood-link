import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  updatePassword: (data) => api.put('/auth/password', data),
  // Hospital ID management
  uploadHospitalID: (data) => {
    const formData = new FormData();
    formData.append('hospitalID', data);
    return api.post('/auth/upload-hospital-id', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getHospitalIDStatus: () => api.get('/auth/hospital-id-status')
};

// Donor API
export const donorAPI = {
  search: (params) => api.get('/donors/search', { params }),
  getById: (id) => api.get(`/donors/${id}`),
  checkEligibility: (id) => api.get(`/donors/${id}/eligibility`),
  updateAvailability: (id, data) => api.put(`/donors/${id}/availability`, data),
  getStats: () => api.get('/donors/stats')
};

// Blood Request API
export const requestAPI = {
  create: (data) => api.post('/requests', data),
  getAll: (params) => api.get('/requests', { params }),
  getById: (id) => api.get(`/requests/${id}`),
  update: (id, data) => api.put(`/requests/${id}`, data),
  cancel: (id, data) => api.delete(`/requests/${id}`, { data }),
  respond: (id, data) => api.post(`/requests/${id}/respond`, data),
  getDonorMatched: (params) => api.get('/requests/donor/matched', { params }),
  // Visibility controls
  getDonorVisibilityInfo: () => api.get('/requests/donor/visibility-info'),
  updateDonorRadius: (data) => api.put('/requests/donor/update-radius', data),
  getVisibilityStats: () => api.get('/requests/visibility/stats')
};

// Donation API
export const donationAPI = {
  record: (data) => api.post('/donations', data),
  getHistory: (params) => api.get('/donations/history', { params }),
  getById: (id) => api.get(`/donations/${id}`),
  update: (id, data) => api.put(`/donations/${id}`, data),
  verify: (id) => api.post(`/donations/${id}/verify`),
  reject: (id, data) => api.post(`/donations/${id}/reject`, data),
  getCard: (id) => api.get(`/donations/card/${id}`),
  verifyQR: (data) => api.post('/donations/verify-qr', data),
  // Digital card management
  getMyCards: () => api.get('/donations/cards/my-cards'),
  getDonorCards: (donorId) => api.get(`/donations/cards/donor/${donorId}`),
  regenerateQR: (id, data) => api.post(`/donations/card/${id}/regenerate`, data),
  revokeCard: (id, data) => api.post(`/donations/card/${id}/revoke`, data),
  // Immutability and locking
  getImmutabilityStatus: (id) => api.get(`/donations/${id}/immutability-status`),
  adminOverride: (id, data) => api.put(`/donations/${id}/admin-override`, data),
  lockDonation: (id, data) => api.put(`/donations/${id}/lock`, data),
  unlockDonation: (id) => api.put(`/donations/${id}/unlock`)
};

// Chat API
export const chatAPI = {
  getChats: () => api.get('/chats'),
  getMessages: (chatId) => api.get(`/chats/${chatId}/messages`),
  create: (data) => api.post('/chats', data),
  sendMessage: (chatId, data) => api.post(`/chats/${chatId}/messages`, data),
  reportMessage: (messageId, data) => api.post(`/chats/messages/${messageId}/report`, data),
  // Admin moderation
  getModerationStats: () => api.get('/chats/admin/stats'),
  getAllChats: (params) => api.get('/chats/admin/all', { params }),
  getFlaggedMessages: () => api.get('/chats/admin/flagged'),
  getReportedMessages: () => api.get('/chats/admin/reported'),
  getAdminChatMessages: (chatId) => api.get(`/chats/admin/${chatId}/messages`),
  flagMessage: (messageId, data) => api.post(`/chats/admin/messages/${messageId}/flag`, data),
  hideMessage: (messageId, data) => api.post(`/chats/admin/messages/${messageId}/hide`, data),
  unhideMessage: (messageId) => api.post(`/chats/admin/messages/${messageId}/unhide`)
};

// Notification API
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all')
};

// Availability API
export const availabilityAPI = {
  getSchedule: () => api.get('/availability'),
  toggleScheduled: (data) => api.put('/availability/toggle', data),
  addWeeklySlot: (data) => api.post('/availability/weekly', data),
  updateWeeklySlot: (slotId, data) => api.put(`/availability/weekly/${slotId}`, data),
  deleteWeeklySlot: (slotId) => api.delete(`/availability/weekly/${slotId}`),
  addCustom: (data) => api.post('/availability/custom', data),
  updateCustom: (customId, data) => api.put(`/availability/custom/${customId}`, data),
  deleteCustom: (customId) => api.delete(`/availability/custom/${customId}`),
  checkAvailability: (data) => api.post('/availability/check', data)
};

// Leaderboard API
export const leaderboardAPI = {
  get: (params) => api.get('/leaderboard', { params }),
  getUserRank: (userId, params) => api.get(`/leaderboard/${userId}`, { params })
};

// Blog API
export const blogAPI = {
  getAll: (params) => api.get('/blogs', { params }),
  getBySlug: (slug) => api.get(`/blogs/${slug}`),
  create: (data) => api.post('/blogs', data),
  update: (id, data) => api.put(`/blogs/${id}`, data),
  delete: (id) => api.delete(`/blogs/${id}`),
  like: (id) => api.post(`/blogs/${id}/like`),
  addComment: (id, data) => api.post(`/blogs/${id}/comments`, data)
};

// Event API
export const eventAPI = {
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  register: (id) => api.post(`/events/${id}/register`)
};

// Review API
export const reviewAPI = {
  getAll: (params) => api.get('/reviews', { params }),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  reportReview: (id, data) => api.post(`/reviews/${id}/report`, data),
  getRating: (userId) => api.get(`/reviews/user/${userId}/rating`),
  // Admin moderation
  getPendingReviews: () => api.get('/reviews/admin/pending'),
  getModerationStats: () => api.get('/reviews/admin/stats'),
  approveReview: (id) => api.put(`/reviews/admin/${id}/approve`),
  rejectReview: (id, data) => api.put(`/reviews/admin/${id}/reject`, data),
  clearReviewReports: (id) => api.put(`/reviews/admin/${id}/clear-reports`)
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  verifyUser: (userId) => api.put(`/admin/users/${userId}/verify`),
  rejectUser: (userId, data) => api.put(`/admin/users/${userId}/reject`, data),
  requestResubmission: (userId, data) => api.put(`/admin/users/${userId}/request-resubmission`, data),
  revokeVerification: (userId, data) => api.put(`/admin/users/${userId}/revoke-verification`, data),
  deactivateUser: (userId) => api.put(`/admin/users/${userId}/deactivate`),
  activateUser: (userId) => api.put(`/admin/users/${userId}/activate`),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  getPendingVerifications: () => api.get('/admin/verifications/pending'),
  getAnalytics: (params) => api.get('/admin/analytics', { params })
};

// Badge API
export const badgeAPI = {
  getAllBadges: (params) => api.get('/badges', { params }),
  getBadge: (id) => api.get(`/badges/${id}`),
  createBadge: (data) => api.post('/badges', data),
  updateBadge: (id, data) => api.put(`/badges/${id}`, data),
  deleteBadge: (id) => api.delete(`/badges/${id}`),
  assignBadge: (data) => api.post('/badges/assign', data),
  revokeBadge: (data) => api.post('/badges/revoke', data),
  getUserBadges: (userId) => api.get(`/badges/user/${userId}`),
  getBadgeStats: () => api.get('/badges/admin/stats'),
  getBadgeHistory: (userId) => api.get(`/badges/admin/history/${userId}`)
};

// Config API
export const configAPI = {
  getPublicConfig: () => api.get('/config/public'),
  getConfig: () => api.get('/config'),
  updateConfig: (data) => api.put('/config', data),
  updateDonationSettings: (data) => api.put('/config/donation-settings', data),
  updateMatchingSettings: (data) => api.put('/config/matching-settings', data),
  updateFallbackSettings: (data) => api.put('/config/fallback-settings', data),
  updatePointsSettings: (data) => api.put('/config/points-settings', data),
  toggleMaintenanceMode: (data) => api.put('/config/maintenance-mode', data),
  getChangeHistory: (params) => api.get('/config/history', { params })
};

// Audit API
export const auditAPI = {
  getAllLogs: (params) => api.get('/audit', { params }),
  getStatistics: () => api.get('/audit/statistics'),
  getCriticalLogs: () => api.get('/audit/critical'),
  getMyAuditLogs: () => api.get('/audit/my-actions'),
  getLogsByUser: (userId) => api.get(`/audit/user/${userId}`),
  getLogsByTarget: (targetModel, targetId) => api.get(`/audit/target/${targetModel}/${targetId}`),
  getLogById: (id) => api.get(`/audit/${id}`),
  export: (params) => api.post('/audit/export', {}, { params })
};

// Fallback System API
export const fallbackAPI = {
  getUnmatched: () => api.get('/fallback/unmatched'),
  expandRadius: (requestId, data) => api.post(`/fallback/expand-radius/${requestId}`, data),
  notifyUnavailable: (requestId, data) => api.post(`/fallback/notify-unavailable/${requestId}`, data),
  suggestFacilities: (requestId) => api.post(`/fallback/suggest-facilities/${requestId}`),
  notifyAdmin: (requestId, data) => api.post(`/fallback/notify-admin/${requestId}`, data),
  processSingleFallback: (requestId) => api.post(`/fallback/process/${requestId}`),
  runSystemFallback: () => api.post('/fallback/run-system'),
  giveExpansionConsent: (requestId, data) => api.put(`/fallback/consent-expansion/${requestId}`, data)
};

export default api;
