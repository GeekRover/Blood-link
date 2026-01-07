import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Droplet, MapPin, Phone, Mail } from 'lucide-react';
import { useDarkMode } from '../../context/DarkModeContext';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../hooks/useAuth';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

const ChatWindow = () => {
  const { isDarkMode } = useDarkMode();
  const { user } = useAuth();
  const { activeChat, messages, loading, typingUsers } = useChat();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!activeChat) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            boxShadow: '0 8px 24px rgba(220, 38, 38, 0.3)'
          }}>
            <MessageCircle style={{ width: '60px', height: '60px', color: 'white' }} />
          </div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: isDarkMode ? '#f1f5f9' : '#1e293b',
            marginBottom: '0.5rem'
          }}>
            Welcome to BloodLink Chat
          </h2>
          <p style={{
            fontSize: '0.9375rem',
            color: isDarkMode ? '#94a3b8' : '#64748b',
            maxWidth: '400px'
          }}>
            Select a conversation from the sidebar to start messaging
          </p>
        </motion.div>
      </div>
    );
  }

  const otherParticipant = activeChat.participants.find(p => p._id !== user._id);
  const typingUser = typingUsers[activeChat._id];

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Chat header */}
      <div style={{
        padding: '1rem 1.5rem',
        borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
        background: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
            {otherParticipant?.name?.charAt(0).toUpperCase() || '?'}
          </div>

          {/* User info */}
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '700',
              color: isDarkMode ? '#f1f5f9' : '#1e293b',
              marginBottom: '0.125rem'
            }}>
              {otherParticipant?.name || 'Unknown User'}
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              fontSize: '0.8125rem',
              color: isDarkMode ? '#94a3b8' : '#64748b'
            }}>
              {otherParticipant?.bloodType && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Droplet style={{ width: '14px', height: '14px', color: '#dc2626' }} />
                  {otherParticipant.bloodType}
                </div>
              )}
              {otherParticipant?.address?.city && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <MapPin style={{ width: '14px', height: '14px' }} />
                  {otherParticipant.address.city}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem 0',
          background: isDarkMode
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
            : 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)'
        }}
      >
        {loading && messages.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: isDarkMode ? '#94a3b8' : '#64748b'
          }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
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
              fontSize: '0.875rem'
            }}>
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const prevMessage = messages[index - 1];
              const isConsecutive =
                prevMessage &&
                prevMessage.sender._id === message.sender._id &&
                new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() < 60000; // Within 1 minute

              return (
                <MessageBubble
                  key={message._id}
                  message={message}
                  isConsecutive={isConsecutive}
                />
              );
            })}

            {/* Typing indicator */}
            {typingUser && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                style={{
                  padding: '0 1rem',
                  marginBottom: '0.5rem'
                }}
              >
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  background: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '16px 16px 16px 4px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  fontSize: '0.875rem',
                  color: isDarkMode ? '#94a3b8' : '#64748b'
                }}>
                  <span>{typingUser.name} is typing</span>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: isDarkMode ? '#64748b' : '#94a3b8',
                          animation: `typing-dot 1.4s infinite`,
                          animationDelay: `${i * 0.2}s`
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message input */}
      <MessageInput />

      <style>{`
        @keyframes typing-dot {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-8px);
          }
        }
      `}</style>
    </div>
  );
};

export default ChatWindow;
