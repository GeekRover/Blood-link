import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { catchAsync, AppError } from '../middlewares/errorHandler.js';

export const getChats = catchAsync(async (req, res) => {
  const chats = await Chat.find({
    participants: req.user._id
  })
    .populate('participants', 'name profilePicture role')
    .populate('lastMessage')
    .sort({ lastMessageAt: -1 });

  res.status(200).json({ success: true, data: chats });
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

  const message = await Message.create({
    chat: req.params.chatId,
    sender: req.user._id,
    content
  });

  await message.populate('sender', 'name profilePicture');

  res.status(201).json({ success: true, data: message });
});

export default { getChats, getChatMessages, createChat, sendMessage };
