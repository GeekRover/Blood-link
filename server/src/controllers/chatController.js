import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { catchAsync, AppError } from '../middlewares/errorHandler.js';

/**
 * Get all chats for current user - SIMPLE VERSION
 * Returns all chats where user is a participant
 */
export const getChats = catchAsync(async (req, res) => {
  console.log(`\n[getChats] User ID: ${req.user._id}`);

  const chats = await Chat.find({
    participants: req.user._id
  })
    .populate('participants', 'name profilePicture role')
    .populate('lastMessage')
    .populate({
      path: 'bloodRequest',
      select: 'patientName bloodType hospital urgency status'
    })
    .sort({ lastMessageAt: -1 })
    .lean();

  console.log(`[getChats] Found ${chats.length} chats`);
  chats.forEach((chat, idx) => {
    console.log(`  [${idx}] Chat ID: ${chat._id}, Participants: ${chat.participants.length}, BloodRequest: ${chat.bloodRequest ? 'Yes' : 'No'}`);
  });

  res.status(200).json({
    success: true,
    count: chats.length,
    data: chats
  });
});

export const getChatMessages = catchAsync(async (req, res) => {
  const messages = await Message.find({ chat: req.params.chatId })
    .populate('sender', 'name profilePicture')
    .sort({ createdAt: 1 });

  res.status(200).json({ success: true, data: messages });
});

export const createChat = catchAsync(async (req, res) => {
  const { participantId, bloodRequestId } = req.body;

  const chat = await Chat.findOrCreate(
    req.user._id,
    participantId,
    bloodRequestId
  );

  res.status(201).json({ success: true, data: chat });
});

export const sendMessage = catchAsync(async (req, res) => {
  const { content } = req.body;
  const { chatId } = req.params;

  // Create message
  const message = await Message.create({
    chat: chatId,
    sender: req.user._id,
    content
  });

  await message.populate('sender', 'name profilePicture');

  // Update chat's lastMessage and lastMessageAt
  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: message._id,
    lastMessageAt: new Date()
  });

  res.status(201).json({ success: true, data: message });
});

/**
 * @route   GET /api/chats/admin/all
 * @desc    Get all chats (Admin only)
 * @access  Private (Admin)
 */
export const getAllChats = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, search } = req.query;

  const query = {};

  // Search by participant name or blood request
  if (search) {
    // This is a simplified search, in production you'd want to use text indexes
    query.$or = [
      { 'participants.name': new RegExp(search, 'i') }
    ];
  }

  const chats = await Chat.find(query)
    .populate('participants', 'name email phone role bloodType')
    .populate('lastMessage')
    .populate('bloodRequest', 'patientName hospital urgency')
    .sort({ lastMessageAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const totalCount = await Chat.countDocuments(query);

  res.status(200).json({
    success: true,
    count: chats.length,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: parseInt(page),
    data: chats
  });
});

/**
 * @route   GET /api/chats/admin/:chatId/messages
 * @desc    Get all messages in a chat (Admin only)
 * @access  Private (Admin)
 */
export const getAdminChatMessages = catchAsync(async (req, res, next) => {
  const messages = await Message.find({ chat: req.params.chatId })
    .populate('sender', 'name email role')
    .populate('flaggedBy', 'name email')
    .populate('hiddenBy', 'name email')
    .populate('reports.reportedBy', 'name email')
    .sort({ createdAt: 1 });

  if (!messages || messages.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No messages found for this chat'
    });
  }

  const chat = await Chat.findById(req.params.chatId)
    .populate('participants', 'name email role')
    .populate('bloodRequest', 'patientName hospital');

  res.status(200).json({
    success: true,
    count: messages.length,
    data: {
      chat,
      messages
    }
  });
});

/**
 * @route   GET /api/chats/admin/flagged
 * @desc    Get all flagged messages (Admin only)
 * @access  Private (Admin)
 */
export const getFlaggedMessages = catchAsync(async (req, res, next) => {
  const messages = await Message.find({ isFlagged: true })
    .populate('sender', 'name email role')
    .populate('chat')
    .populate('flaggedBy', 'name email')
    .sort({ flaggedAt: -1 });

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages
  });
});

/**
 * @route   GET /api/chats/admin/reported
 * @desc    Get all reported messages (Admin only)
 * @access  Private (Admin)
 */
export const getReportedMessages = catchAsync(async (req, res, next) => {
  const messages = await Message.find({ reportCount: { $gt: 0 } })
    .populate('sender', 'name email role')
    .populate('chat')
    .populate('reports.reportedBy', 'name email')
    .sort({ reportCount: -1, createdAt: -1 });

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages
  });
});

/**
 * @route   POST /api/chats/admin/messages/:messageId/flag
 * @desc    Flag a message (Admin only)
 * @access  Private (Admin)
 */
export const flagMessage = catchAsync(async (req, res, next) => {
  const { reason } = req.body;

  if (!reason || reason.length < 10) {
    return next(new AppError('Flag reason is required (minimum 10 characters)', 400));
  }

  const message = await Message.findById(req.params.messageId)
    .populate('sender', 'name email')
    .populate('chat');

  if (!message) {
    return next(new AppError('Message not found', 404));
  }

  if (message.isFlagged) {
    return res.status(400).json({
      success: false,
      message: 'Message is already flagged',
      flaggedAt: message.flaggedAt,
      flagReason: message.flagReason
    });
  }

  await message.flagMessage(req.user._id, reason);

  res.status(200).json({
    success: true,
    message: 'Message flagged successfully',
    data: message
  });
});

/**
 * @route   POST /api/chats/admin/messages/:messageId/hide
 * @desc    Hide a message (Admin only)
 * @access  Private (Admin)
 */
export const hideMessage = catchAsync(async (req, res, next) => {
  const { reason } = req.body;

  if (!reason || reason.length < 10) {
    return next(new AppError('Hide reason is required (minimum 10 characters)', 400));
  }

  const message = await Message.findById(req.params.messageId)
    .populate('sender', 'name email')
    .populate('chat');

  if (!message) {
    return next(new AppError('Message not found', 404));
  }

  if (message.isHidden) {
    return res.status(400).json({
      success: false,
      message: 'Message is already hidden',
      hiddenAt: message.hiddenAt,
      hiddenReason: message.hiddenReason
    });
  }

  await message.hideMessage(req.user._id, reason);

  res.status(200).json({
    success: true,
    message: 'Message hidden successfully',
    data: message
  });
});

/**
 * @route   POST /api/chats/admin/messages/:messageId/unhide
 * @desc    Unhide a message (Admin only)
 * @access  Private (Admin)
 */
export const unhideMessage = catchAsync(async (req, res, next) => {
  const message = await Message.findById(req.params.messageId)
    .populate('sender', 'name email')
    .populate('chat');

  if (!message) {
    return next(new AppError('Message not found', 404));
  }

  if (!message.isHidden) {
    return res.status(400).json({
      success: false,
      message: 'Message is not hidden'
    });
  }

  await message.unhideMessage();

  res.status(200).json({
    success: true,
    message: 'Message unhidden successfully',
    data: message
  });
});

/**
 * @route   POST /api/chats/messages/:messageId/report
 * @desc    Report a message (User)
 * @access  Private
 */
export const reportMessage = catchAsync(async (req, res, next) => {
  const { reason, category } = req.body;

  if (!reason || reason.length < 10) {
    return next(new AppError('Report reason is required (minimum 10 characters)', 400));
  }

  if (!category) {
    return next(new AppError('Report category is required', 400));
  }

  const validCategories = ['spam', 'harassment', 'inappropriate', 'scam', 'other'];
  if (!validCategories.includes(category)) {
    return next(new AppError(`Category must be one of: ${validCategories.join(', ')}`, 400));
  }

  const message = await Message.findById(req.params.messageId)
    .populate('sender', 'name email');

  if (!message) {
    return next(new AppError('Message not found', 404));
  }

  // Check if user already reported this message
  const alreadyReported = message.reports.some(
    report => report.reportedBy.toString() === req.user._id.toString()
  );

  if (alreadyReported) {
    return res.status(400).json({
      success: false,
      message: 'You have already reported this message'
    });
  }

  await message.addReport(req.user._id, reason, category);

  res.status(200).json({
    success: true,
    message: 'Message reported successfully. Our team will review it.',
    data: {
      messageId: message._id,
      reportCount: message.reportCount
    }
  });
});

/**
 * @route   GET /api/chats/admin/stats
 * @desc    Get chat moderation statistics (Admin only)
 * @access  Private (Admin)
 */
export const getModerationStats = catchAsync(async (req, res, next) => {
  const totalChats = await Chat.countDocuments();
  const totalMessages = await Message.countDocuments();
  const flaggedMessages = await Message.countDocuments({ isFlagged: true });
  const hiddenMessages = await Message.countDocuments({ isHidden: true });
  const reportedMessages = await Message.countDocuments({ reportCount: { $gt: 0 } });
  const totalReports = await Message.aggregate([
    { $match: { reportCount: { $gt: 0 } } },
    { $group: { _id: null, total: { $sum: '$reportCount' } } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalChats,
      totalMessages,
      flaggedMessages,
      hiddenMessages,
      reportedMessages,
      totalReports: totalReports[0]?.total || 0,
      pendingReview: reportedMessages - flaggedMessages
    }
  });
});

export default {
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
};
