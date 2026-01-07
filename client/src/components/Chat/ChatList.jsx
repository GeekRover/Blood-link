import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Users, Loader } from 'lucide-react';
import { useDarkMode } from '../../context/DarkModeContext';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

const ChatList = () => {
  const { isDarkMode } = useDarkMode();
  const { user } = useAuth();
  const {
    chats,
    activeChat,
    loading,
    connected,
    loadChats,
    selectChat,
    getUnreadCount
  } = useChat();

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const getOtherParticipant = (chat) => {
    if (!chat?.participants || !Array.isArray(chat.participants)) {
      console.error('[ChatList] Invalid chat participants:', chat);
      return null;
    }
    if (!user?._id) {
      console.error('[ChatList] No user ID');
      return null;
    }
    return chat.participants.find(p => p._id !== user._id);
  };

  // Debug logging
  useEffect(() => {
    console.log('[ChatList] State:', {
      chatsCount: chats.length,
      loading,
      connected,
      hasUser: !!user
    });
  }, [chats, loading, connected, user]);

  if (loading && chats.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: isDarkMode ? '#94a3b8' : '#64748b'
      }}>
        <Loader style={{ width: '24px', height: '24px', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <MessageCircle style={{
          width: '48px',
          height: '48px',
          color: isDarkMode ? '#475569' : '#94a3b8',
          marginBottom: '1rem'
        }} />
        <p style={{
          color: isDarkMode ? '#94a3b8' : '#64748b',
          fontSize: '0.875rem',
          marginBottom: '0.5rem'
        }}>
          No conversations yet
        </p>
        <p style={{
          color: isDarkMode ? '#64748b' : '#94a3b8',
          fontSize: '0.75rem'
        }}>
          Start chatting with donors or recipients
        </p>
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem',
        borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
        position: 'sticky',
        top: 0,
        background: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        zIndex: 10
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: isDarkMode ? '#f1f5f9' : '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <MessageCircle style={{ width: '20px', height: '20px', color: '#dc2626' }} />
            Messages
          </h2>

          {/* Connection status */}
          <div style={{
            fontSize: '0.75rem',
            color: connected ? '#22c55e' : '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: connected ? '#22c55e' : '#f59e0b',
              animation: connected ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
            }} />
            {connected ? 'Online' : 'Connecting...'}
          </div>
        </div>
      </div>

      {/* Chat list */}
      <div style={{ padding: '0.5rem 0' }}>
        {chats.map((chat, index) => {
          try {
            const otherUser = getOtherParticipant(chat);
            const unreadCount = getUnreadCount(chat);
            const isActive = activeChat?._id === chat._id;
            const lastMessageTime = chat.lastMessageAt
              ? formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: false })
              : '';

            // Skip if no other participant found
            if (!otherUser) {
              console.warn('[ChatList] Skipping chat with no other participant:', chat._id);
              return null;
            }

            return (
            <motion.div
              key={chat._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ x: 4 }}
              onClick={() => selectChat(chat)}
              style={{
                padding: '1rem',
                cursor: 'pointer',
                background: isActive
                  ? isDarkMode ? 'rgba(220, 38, 38, 0.15)' : 'rgba(220, 38, 38, 0.08)'
                  : 'transparent',
                borderLeft: isActive ? '3px solid #dc2626' : '3px solid transparent',
                transition: 'all 0.2s',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                {/* Avatar */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '1.125rem',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)'
                }}>
                  {otherUser?.name?.charAt(0).toUpperCase() || '?'}
                </div>

                {/* Chat info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.25rem'
                  }}>
                    <h3 style={{
                      fontSize: '0.9375rem',
                      fontWeight: '600',
                      color: isDarkMode ? '#f1f5f9' : '#1e293b',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {otherUser?.name || 'Unknown User'}
                    </h3>

                    <span style={{
                      fontSize: '0.6875rem',
                      color: isDarkMode ? '#64748b' : '#94a3b8',
                      flexShrink: 0,
                      marginLeft: '0.5rem'
                    }}>
                      {lastMessageTime}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <p style={{
                      fontSize: '0.8125rem',
                      color: isDarkMode ? '#94a3b8' : '#64748b',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1
                    }}>
                      {chat.lastMessage?.content || 'No messages yet'}
                    </p>

                    {/* Unread badge */}
                    {unreadCount > 0 && (
                      <div style={{
                        marginLeft: '0.5rem',
                        padding: '0.125rem 0.5rem',
                        background: '#dc2626',
                        color: 'white',
                        borderRadius: '999px',
                        fontSize: '0.6875rem',
                        fontWeight: '700',
                        minWidth: '20px',
                        textAlign: 'center'
                      }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
            );
          } catch (error) {
            console.error('[ChatList] Error rendering chat:', chat._id, error);
            return null;
          }
        })}
      </div>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatList;
