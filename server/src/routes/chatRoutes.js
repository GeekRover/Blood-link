import express from 'express';
import { getChats, getChatMessages, createChat, sendMessage } from '../controllers/chatController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { chatLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.get('/', protect, getChats);
router.post('/', protect, createChat);
router.get('/:chatId/messages', protect, getChatMessages);
router.post('/:chatId/messages', protect, chatLimiter, sendMessage);

export default router;
