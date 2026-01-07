import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import socketService from '../services/socketService';
import { getChats, getChatMessages, sendMessage as sendMessageAPI } from '../services/chatService';
import toast from 'react-hot-toast';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});

  // Connect to Socket.IO when user logs in
  useEffect(() => {
    if (user && token) {
      const socket = socketService.connect(token);

      socket.on('connect', () => {
        setConnected(true);
        console.log('Chat socket connected');
      });

      socket.on('disconnect', () => {
        setConnected(false);
        console.log('Chat socket disconnected');
      });

      // Listen for new messages
      socket.on('new_message', (message) => {
        console.log('New message received:', message);

        // Add message to active chat if it's the current chat
        if (activeChat && message.chat === activeChat._id) {
          setMessages(prev => [...prev, message]);
        }

        // Update chat list with new last message
        setChats(prev => prev.map(chat =>
          chat._id === message.chat
            ? { ...chat, lastMessage: message, lastMessageAt: message.createdAt }
            : chat
        ));

        // Show notification if message is not from current user
        if (message.sender._id !== user._id) {
          toast.success(`New message from ${message.sender.name}`, {
            icon: '💬',
            duration: 3000
          });
        }
      });

      // Listen for typing indicators
      socket.on('user_typing', ({ userId, userName, isTyping }) => {
        if (activeChat && userId !== user._id) {
          if (isTyping) {
            setTypingUsers(prev => ({ ...prev, [activeChat._id]: { _id: userId, name: userName } }));
          } else {
            setTypingUsers(prev => {
              const updated = { ...prev };
              delete updated[activeChat._id];
              return updated;
            });
          }
        }
      });

      return () => {
        socketService.disconnect();
      };
    }
  }, [user, token, activeChat]);

  // Load all chats
  const loadChats = useCallback(async () => {
    if (!user) {
      console.log('[loadChats] No user, skipping...');
      return;
    }

    try {
      setLoading(true);
      console.log('[loadChats] Fetching chats for user:', user._id);
      const response = await getChats();
      console.log('[loadChats] Full response:', response);
      console.log('[loadChats] Response type:', typeof response);
      console.log('[loadChats] Is array:', Array.isArray(response));

      // Response is { success, count, data } from backend
      const chatsToSet = response.data || [];
      console.log('[loadChats] Chats count:', chatsToSet.length);
      console.log('[loadChats] Setting chats:', chatsToSet);

      // Validate chat structure
      chatsToSet.forEach((chat, idx) => {
        console.log(`[loadChats] Chat ${idx}:`, {
          id: chat._id,
          participants: chat.participants?.length,
          hasLastMessage: !!chat.lastMessage
        });
      });

      setChats(chatsToSet);
      console.log('[loadChats] Chats set successfully, total:', chatsToSet.length);
    } catch (error) {
      console.error('[loadChats] Failed to load chats:', error);
      console.error('[loadChats] Error details:', error.response?.data || error.message);
      toast.error('Failed to load conversations');
      setChats([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load messages for a chat
  const loadMessages = useCallback(async (chatId) => {
    try {
      setLoading(true);
      const response = await getChatMessages(chatId);
      setMessages(response.data || []);

      // Join the chat room via socket
      if (connected) {
        socketService.joinChat(chatId);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error(error.message || 'Failed to load messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [connected]);

  // Send a message
  const sendMessage = useCallback(async (content, type = 'text') => {
    if (!activeChat) return;

    try {
      const response = await sendMessageAPI(activeChat._id, { content, type });
      const newMessage = response.data;

      // Message will be added via socket 'new-message' event
      // But add optimistically for better UX
      setMessages(prev => [...prev, newMessage]);

      return newMessage;
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error(error.message || 'Failed to send message');
      throw error;
    }
  }, [activeChat]);

  // Select a chat
  const selectChat = useCallback(async (chat) => {
    // Leave previous chat room
    if (activeChat && connected) {
      socketService.leaveChat(activeChat._id);
    }

    setActiveChat(chat);
    if (chat) {
      await loadMessages(chat._id);
    } else {
      setMessages([]);
    }
  }, [activeChat, connected, loadMessages]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(() => {
    if (activeChat && connected) {
      socketService.sendTyping(activeChat._id);
    }
  }, [activeChat, connected]);

  // Stop typing indicator
  const stopTypingIndicator = useCallback(() => {
    if (activeChat && connected) {
      socketService.stopTyping(activeChat._id);
    }
  }, [activeChat, connected]);

  // Get unread count for a chat
  const getUnreadCount = useCallback((chat) => {
    if (!user || !chat.unreadCount) return 0;
    return chat.unreadCount[user._id] || 0;
  }, [user]);

  // Get total unread messages
  const getTotalUnread = useCallback(() => {
    return chats.reduce((total, chat) => total + getUnreadCount(chat), 0);
  }, [chats, getUnreadCount]);

  const value = {
    chats,
    activeChat,
    messages,
    loading,
    connected,
    typingUsers,
    loadChats,
    loadMessages,
    sendMessage,
    selectChat,
    sendTypingIndicator,
    stopTypingIndicator,
    getUnreadCount,
    getTotalUnread
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
