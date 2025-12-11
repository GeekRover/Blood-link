import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import Notification from '../models/Notification.js';


/**
* Initialize Socket.IO server
* @param {object} server - HTTP server instance
* @returns {object} - Socket.IO instance
*/
export const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });


    // Socket authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;


            if (!token) {
                return next(new Error('Authentication error'));
            }


            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');


            if (!user) {
                return next(new Error('User not found'));
            }


            socket.userId = user._id.toString();
            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });


    // Handle socket connections
    io.on('connection', (socket) => {
        console.log(`✅ User connected: ${socket.userId}`);


        // Join user's personal room for notifications
        socket.join(`user:${socket.userId}`);


        // Join chat room
        socket.on('join_chat', async (chatId) => {
            try {
                const chat = await Chat.findById(chatId);


                if (!chat) {
                    socket.emit('error', { message: 'Chat not found' });
                    return;
                }


                // Verify user is participant
                const isParticipant = chat.participants.some(
                    p => p.toString() === socket.userId
                );


                if (!isParticipant) {
                    socket.emit('error', { message: 'Not authorized' });
                    return;
                }


                socket.join(`chat:${chatId}`);
                console.log(`User ${socket.userId} joined chat ${chatId}`);


                // Mark messages as read
                await Message.updateMany(
                    {
                        chat: chatId,
                        sender: { $ne: socket.userId },
                        isRead: false
                    },
                    {
                        isRead: true,
                        readAt: new Date()
                    }
                );


                // Reset unread count
                await chat.resetUnread(socket.userId);


                socket.emit('chat_joined', { chatId });
            } catch (error) {
                console.error('Join chat error:', error);
                socket.emit('error', { message: 'Failed to join chat' });
            }
        });


        // Leave chat room
        socket.on('leave_chat', (chatId) => {
            socket.leave(`chat:${chatId}`);
            console.log(`User ${socket.userId} left chat ${chatId}`);
        });


        // Send message
        socket.on('send_message', async (data) => {
            try {
                const { chatId, content } = data;


                // Create message
                const message = await Message.create({
                    chat: chatId,
                    sender: socket.userId,
                    content
                });


                await message.populate('sender', 'name profilePicture');


                // Update chat
                const chat = await Chat.findById(chatId);
                await chat.incrementUnread(
                    chat.participants.find(p => p.toString() !== socket.userId)
                );


                // Emit to chat room
                io.to(`chat:${chatId}`).emit('new_message', message);


                // Send notification to other participant
                const otherParticipant = chat.participants.find(
                    p => p.toString() !== socket.userId
                );


                if (otherParticipant) {
                    const notification = await Notification.create({
                        user: otherParticipant,
                        type: 'chat_message',
                        title: 'New Message',
                        message: `${socket.user.name}: ${content.substring(0, 50)}...`,
                        relatedModel: 'Chat',
                        relatedId: chatId
                    });


                    io.to(`user:${otherParticipant.toString()}`).emit('notification', notification);
                }
            } catch (error) {
                console.error('Send message error:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });


        // Typing indicator
        socket.on('typing', (data) => {
            const { chatId, isTyping } = data;
            socket.to(`chat:${chatId}`).emit('user_typing', {
                userId: socket.userId,
                userName: socket.user.name,
                isTyping
            });
        });


        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`❌ User disconnected: ${socket.userId}`);
        });


        // Handle errors
        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });


    return io;
};


/**
* Send notification to user
* @param {object} io - Socket.IO instance
* @param {string} userId - User ID
* @param {object} notification - Notification data
*/
export const sendNotificationToUser = (io, userId, notification) => {
    io.to(`user:${userId}`).emit('notification', notification);
};


/**
* Broadcast blood request to nearby donors
* @param {object} io - Socket.IO instance
* @param {array} donorIds - Array of donor user IDs
* @param {object} request - Blood request data
*/
export const broadcastBloodRequest = (io, donorIds, request) => {
    donorIds.forEach(donorId => {
        io.to(`user:${donorId.toString()}`).emit('new_blood_request', request);
    });
};


/**
* Notify request status update
* @param {object} io - Socket.IO instance
* @param {string} userId - User ID
* @param {object} request - Updated request data
*/
export const notifyRequestUpdate = (io, userId, request) => {
    io.to(`user:${userId}`).emit('request_update', request);
};


export default {
    initializeSocket,
    sendNotificationToUser,
    broadcastBloodRequest,
    notifyRequestUpdate
};




