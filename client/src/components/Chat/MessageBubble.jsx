import { motion } from 'framer-motion';
import { useDarkMode } from '../../context/DarkModeContext';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck, AlertCircle } from 'lucide-react';

const MessageBubble = ({ message, isConsecutive }) => {
  const { isDarkMode } = useDarkMode();
  const { user } = useAuth();

  const isOwnMessage = message.sender._id === user._id;
  const timeAgo = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'flex',
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        marginBottom: isConsecutive ? '0.25rem' : '1rem',
        padding: '0 1rem'
      }}
    >
      <div style={{
        maxWidth: '70%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isOwnMessage ? 'flex-end' : 'flex-start'
      }}>
        {/* Sender name (only for other users and first message in sequence) */}
        {!isOwnMessage && !isConsecutive && (
          <div style={{
            fontSize: '0.75rem',
            color: isDarkMode ? '#94a3b8' : '#64748b',
            marginBottom: '0.25rem',
            marginLeft: '0.5rem',
            fontWeight: '600'
          }}>
            {message.sender.name}
          </div>
        )}

        {/* Message bubble */}
        <div style={{
          background: isOwnMessage
            ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
            : isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          color: isOwnMessage ? 'white' : isDarkMode ? '#e2e8f0' : '#1e293b',
          padding: '0.75rem 1rem',
          borderRadius: isOwnMessage
            ? '16px 16px 4px 16px'
            : '16px 16px 16px 4px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(8px)',
          border: isOwnMessage
            ? 'none'
            : isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
          wordBreak: 'break-word'
        }}>
          {/* Message content */}
          <div style={{
            fontSize: '0.9375rem',
            lineHeight: '1.5',
            marginBottom: '0.25rem'
          }}>
            {message.content}
          </div>

          {/* Message metadata */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: '0.6875rem',
            marginTop: '0.25rem',
            opacity: 0.8
          }}>
            <span>{timeAgo.replace('about ', '')}</span>

            {/* Read/Delivered status for own messages */}
            {isOwnMessage && (
              <>
                {message.isRead ? (
                  <CheckCheck style={{ width: '14px', height: '14px' }} />
                ) : (
                  <Check style={{ width: '14px', height: '14px' }} />
                )}
              </>
            )}

            {/* Hidden/Flagged indicator */}
            {message.isHidden && (
              <AlertCircle style={{ width: '14px', height: '14px', color: '#ef4444' }} title="Message hidden by admin" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
