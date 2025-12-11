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
  updatePassword: (data) => api.put('/auth/password', data)
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
  respond: (id, data) => api.post(`/requests/${id}/respond`, data)
};

// Donation API
export const donationAPI = {
  record: (data) => api.post('/donations', data),
  getHistory: (params) => api.get('/donations/history', { params }),
  getById: (id) => api.get(`/donations/${id}`),
  verify: (id) => api.post(`/donations/${id}/verify`),
  getCard: (id) => api.get(`/donations/card/${id}`),
  verifyQR: (data) => api.post('/donations/verify-qr', data)
};

// Chat API
export const chatAPI = {
  getChats: () => api.get('/chats'),
  getMessages: (chatId) => api.get(`/chats/${chatId}/messages`),
  create: (data) => api.post('/chats', data),
  sendMessage: (chatId, data) => api.post(`/chats/${chatId}/messages`, data)
};

// Notification API
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all')
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
  getRating: (userId) => api.get(`/reviews/user/${userId}/rating`)
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  verifyUser: (userId) => api.put(`/admin/users/${userId}/verify`),
  rejectUser: (userId) => api.put(`/admin/users/${userId}/reject`),
  deactivateUser: (userId) => api.put(`/admin/users/${userId}/deactivate`),
  activateUser: (userId) => api.put(`/admin/users/${userId}/activate`),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  getPendingVerifications: () => api.get('/admin/verifications/pending'),
  getAnalytics: (params) => api.get('/admin/analytics', { params })
};

export default api;
