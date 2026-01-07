import Chat from '../models/Chat.js';
import BloodRequest from '../models/BloodRequest.js';
import { catchAsync, AppError } from './errorHandler.js';

/**
 * Middleware to check if user has access to a chat
 * UNRESTRICTED: Any user can chat with any other user
 */
export const checkChatAccess = catchAsync(async (req, res, next) => {
  const { chatId } = req.params;

  // Find the chat
  const chat = await Chat.findById(chatId).populate('bloodRequest');

  if (!chat) {
    return next(new AppError('Chat not found', 404));
  }

  // Check if user is a participant in this chat
  const isParticipant = chat.participants.some(
    participantId => participantId.toString() === req.user._id.toString()
  );

  if (!isParticipant) {
    return next(new AppError('You do not have access to this chat', 403));
  }

  // Allow access - no restrictions based on blood request status
  req.chat = chat;
  next();
});

/**
 * Middleware to validate chat creation
 * UNRESTRICTED: Any user can create a chat with any other user
 */
export const validateChatCreation = catchAsync(async (req, res, next) => {
  const { participantId, bloodRequestId } = req.body;

  if (!participantId) {
    return next(new AppError('Participant ID is required', 400));
  }

  // If blood request ID is provided, verify it exists
  if (bloodRequestId) {
    const bloodRequest = await BloodRequest.findById(bloodRequestId);
    if (!bloodRequest) {
      return next(new AppError('Blood request not found', 404));
    }
  }

  // Allow chat creation - no restrictions based on blood request status
  next();
});

/**
 * Filter chats based on access restrictions
 * UNRESTRICTED: Returns all chats where user is a participant
 */
export const filterAccessibleChats = async (chats, userId) => {
  const accessibleChats = [];
  const userIdStr = userId.toString();

  for (const chat of chats) {
    // Only check: User must be a participant
    const isParticipant = chat.participants.some(p => {
      const pId = p._id ? p._id.toString() : p.toString();
      return pId === userIdStr;
    });

    if (isParticipant) {
      accessibleChats.push(chat);
    }
  }

  console.log(`[filterAccessibleChats] Total accessible: ${accessibleChats.length} of ${chats.length}`);
  return accessibleChats;
};
