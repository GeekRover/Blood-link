import api from './api';

/**
 * Chat Service
 * API calls for real-time chat functionality
 */

/**
 * Get all chats for the current user
 * @returns {Promise} - User's chats
 */
export const getChats = async () => {
  try {
    const response = await api.get('/chats');
    // api interceptor already unwraps response.data
    // Backend returns { success, count, data }
    // So response is already { success, count, data }
    return response;
  } catch (error) {
    console.error('Get chats error:', error);
    throw error.response?.data || { error: 'Failed to fetch chats' };
  }
};

/**
 * Get messages for a specific chat
 * @param {string} chatId - Chat ID
 * @returns {Promise} - Chat messages
 */
export const getChatMessages = async (chatId) => {
  try {
    const response = await api.get(`/chats/${chatId}/messages`);
    // api interceptor already unwraps response.data
    return response;
  } catch (error) {
    console.error('Get chat messages error:', error);
    throw error.response?.data || { error: 'Failed to fetch messages' };
  }
};

/**
 * Create a new chat
 * @param {Object} data - { recipientId, bloodRequestId (optional) }
 * @returns {Promise} - New chat
 */
export const createChat = async (data) => {
  try {
    const response = await api.post('/chats', data);
    // api interceptor already unwraps response.data
    return response;
  } catch (error) {
    console.error('Create chat error:', error);
    throw error.response?.data || { error: 'Failed to create chat' };
  }
};

/**
 * Send a message in a chat
 * @param {string} chatId - Chat ID
 * @param {Object} data - { content, type (optional) }
 * @returns {Promise} - Sent message
 */
export const sendMessage = async (chatId, data) => {
  try {
    const response = await api.post(`/chats/${chatId}/messages`, data);
    // api interceptor already unwraps response.data
    return response;
  } catch (error) {
    console.error('Send message error:', error);
    throw error.response?.data || { error: 'Failed to send message' };
  }
};

/**
 * Report a message
 * @param {string} messageId - Message ID
 * @param {Object} data - { reason, category }
 * @returns {Promise} - Report result
 */
export const reportMessage = async (messageId, data) => {
  try {
    const response = await api.post(`/chats/messages/${messageId}/report`, data);
    return response.data;
  } catch (error) {
    console.error('Report message error:', error);
    throw error.response?.data || { error: 'Failed to report message' };
  }
};

/**
 * Mark chat as read
 * @param {string} chatId - Chat ID
 * @returns {Promise}
 */
export const markChatAsRead = async (chatId) => {
  try {
    // This endpoint may need to be added to backend
    const response = await api.put(`/chats/${chatId}/read`);
    return response.data;
  } catch (error) {
    // Silently fail for now if endpoint doesn't exist
    console.warn('Mark as read not implemented on backend');
    return null;
  }
};

export default {
  getChats,
  getChatMessages,
  createChat,
  sendMessage,
  reportMessage,
  markChatAsRead
};
