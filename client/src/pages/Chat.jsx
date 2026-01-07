import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useDarkMode } from '../context/DarkModeContext';
import { useChat } from '../context/ChatContext';
import { ArrowLeft } from 'lucide-react';
import ChatList from '../components/Chat/ChatList';
import ChatWindow from '../components/Chat/ChatWindow';

const Chat = () => {
  const { isDarkMode } = useDarkMode();
  const location = useLocation();
  const { chats, activeChat, selectChat, loadChats } = useChat();
  const [showChatWindow, setShowChatWindow] = useState(false);

  // Handle auto-selection of newly created chat
  useEffect(() => {
    const newChatId = location.state?.newChatId;
    const shouldSelect = location.state?.selectChat;

    if (newChatId && shouldSelect && chats.length > 0) {
      // Find and select the new chat
      const newChat = chats.find(c => c._id === newChatId);
      if (newChat) {
        console.log('[Chat] Auto-selecting newly created chat:', newChatId);
        selectChat(newChat);
        setShowChatWindow(true); // Auto-show chat window on mobile
      } else {
        console.log('[Chat] New chat not found in list yet, will retry...');
        // Chat might not be loaded yet, trigger a reload
        loadChats();
      }
    }
  }, [location.state, chats, selectChat, loadChats]);

  // Show chat window when chat is selected on mobile
  useEffect(() => {
    if (activeChat) {
      setShowChatWindow(true);
    }
  }, [activeChat]);

  const handleBackToList = () => {
    setShowChatWindow(false);
    selectChat(null);
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      background: isDarkMode
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
        : 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)',
      padding: '2rem 1rem'
    }}>
      {/* Max-width container */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        height: 'calc(100vh - 64px - 4rem)',
        background: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        display: 'flex'
      }}>
        {/* Chat list sidebar - hidden on mobile when chat is open */}
        <div className="chat-sidebar" style={{
          width: '100%',
          flexShrink: 0,
          borderRight: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
          background: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.5)',
          display: showChatWindow ? 'none' : 'flex',
          flexDirection: 'column'
        }}>
          <ChatList />
        </div>

        {/* Main chat window - hidden on mobile when no chat selected */}
        <div className="chat-window" style={{
          flex: 1,
          display: showChatWindow ? 'flex' : 'none',
          flexDirection: 'column',
          minWidth: 0,
          position: 'relative'
        }}>
          {/* Mobile back button */}
          {activeChat && (
            <button
              className="mobile-back-btn"
              onClick={handleBackToList}
              style={{
                display: 'none',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(248, 250, 252, 0.8)',
                border: 'none',
                borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
                color: isDarkMode ? '#f1f5f9' : '#1e293b',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              <ArrowLeft style={{ width: '20px', height: '20px' }} />
              Back to chats
            </button>
          )}
          <ChatWindow />
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (min-width: 768px) {
          .chat-sidebar {
            width: 380px !important;
            display: flex !important;
          }
          .chat-window {
            display: flex !important;
          }
          .mobile-back-btn {
            display: none !important;
          }
        }

        @media (max-width: 767px) {
          .mobile-back-btn {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Chat;
