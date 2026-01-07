import express from 'express';
import {
  getChats,
  getChatMessages,
  createChat,
  sendMessage,
  getAllChats,
  getAdminChatMessages,
  getFlaggedMessages,
  getReportedMessages,
  flagMessage,
  hideMessage,
  unhideMessage,
  reportMessage,
  getModerationStats
} from '../controllers/chatController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/roleMiddleware.js';
import { chatLimiter } from '../middlewares/rateLimiter.js';
import { checkChatAccess, validateChatCreation } from '../middlewares/chatAccessMiddleware.js';

const router = express.Router();

// ============================================
// ADMIN ROUTES - Chat Moderation
// ============================================

// Get moderation statistics
router.get('/admin/stats', protect, isAdmin, getModerationStats);

// Get all chats (Admin only)
router.get('/admin/all', protect, isAdmin, getAllChats);

// Get all flagged messages
router.get('/admin/flagged', protect, isAdmin, getFlaggedMessages);

// Get all reported messages
router.get('/admin/reported', protect, isAdmin, getReportedMessages);

// Get messages in a specific chat (Admin only)
router.get('/admin/:chatId/messages', protect, isAdmin, getAdminChatMessages);

// Flag a message (Admin only)
router.post('/admin/messages/:messageId/flag', protect, isAdmin, flagMessage);

// Hide a message (Admin only)
router.post('/admin/messages/:messageId/hide', protect, isAdmin, hideMessage);

// Unhide a message (Admin only)
router.post('/admin/messages/:messageId/unhide', protect, isAdmin, unhideMessage);

// ============================================
// USER ROUTES - Chat Management (SIMPLIFIED)
// ============================================

// Get all chats for current user - NO filtering for now
router.get('/', protect, getChats);

// Create new chat - NO validation for now
router.post('/', protect, createChat);

// Get messages for a specific chat - NO access check for now
router.get('/:chatId/messages', protect, getChatMessages);

// Send message in a chat - NO access check for now
router.post('/:chatId/messages', protect, chatLimiter, sendMessage);

// Report a message (User)
router.post('/messages/:messageId/report', protect, reportMessage);

export default router;
