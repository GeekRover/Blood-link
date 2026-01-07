import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Smile } from 'lucide-react';
import { useDarkMode } from '../../context/DarkModeContext';
import { useChat } from '../../context/ChatContext';

const MessageInput = () => {
  const { isDarkMode } = useDarkMode();
  const { sendMessage, sendTypingIndicator, stopTypingIndicator, connected } = useChat();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleTyping = () => {
    sendTypingIndicator();

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTypingIndicator();
    }, 3000);
  };

  const handleSend = async (e) => {
    e.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage || sending) return;

    try {
      setSending(true);
      stopTypingIndicator();

      await sendMessage(trimmedMessage);
      setMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div style={{
      padding: '1rem',
      background: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(12px)',
      borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)'
    }}>
      <form onSubmit={handleSend} style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '0.75rem'
      }}>
        {/* Emoji button (placeholder) */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            padding: '0.75rem',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: isDarkMode ? '#94a3b8' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Emoji (coming soon)"
        >
          <Smile style={{ width: '20px', height: '20px' }} />
        </motion.button>

        {/* Message input */}
        <div style={{ flex: 1, position: 'relative' }}>
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            placeholder={connected ? "Type a message..." : "Connecting..."}
            disabled={!connected || sending}
            rows="1"
            style={{
              width: '100%',
              minHeight: '44px',
              maxHeight: '120px',
              padding: '0.75rem 1rem',
              background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              border: isDarkMode ? '2px solid rgba(255, 255, 255, 0.1)' : '2px solid rgba(0, 0, 0, 0.08)',
              borderRadius: '12px',
              color: isDarkMode ? '#e2e8f0' : '#1e293b',
              fontSize: '0.9375rem',
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
              transition: 'all 0.2s',
              lineHeight: '1.5'
            }}
            onFocus={(e) => e.target.style.borderColor = '#dc2626'}
            onBlur={(e) => e.target.style.borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}
          />

          {/* Connection status */}
          {!connected && (
            <div style={{
              position: 'absolute',
              top: '50%',
              right: '1rem',
              transform: 'translateY(-50%)',
              fontSize: '0.75rem',
              color: '#f59e0b'
            }}>
              ⚠️ Connecting...
            </div>
          )}
        </div>

        {/* Send button */}
        <motion.button
          type="submit"
          disabled={!message.trim() || sending || !connected}
          whileHover={{ scale: message.trim() && connected && !sending ? 1.05 : 1 }}
          whileTap={{ scale: message.trim() && connected && !sending ? 0.95 : 1 }}
          style={{
            padding: '0.75rem 1.25rem',
            background: message.trim() && connected && !sending
              ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
              : isDarkMode ? 'rgba(51, 65, 85, 0.5)' : 'rgba(203, 213, 225, 0.5)',
            color: message.trim() && connected && !sending ? 'white' : isDarkMode ? '#64748b' : '#94a3b8',
            border: 'none',
            borderRadius: '12px',
            cursor: message.trim() && connected && !sending ? 'pointer' : 'not-allowed',
            fontWeight: '600',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s',
            boxShadow: message.trim() && connected && !sending ? '0 2px 8px rgba(220, 38, 38, 0.3)' : 'none'
          }}
        >
          <Send style={{ width: '16px', height: '16px' }} />
          {sending ? 'Sending...' : 'Send'}
        </motion.button>
      </form>
    </div>
  );
};

export default MessageInput;
