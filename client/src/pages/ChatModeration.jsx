import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useDarkMode } from '../context/DarkModeContext';
import { chatAPI } from '../services/api';
import { MessageSquare, Flag, Eye, EyeOff, AlertCircle, Shield, TrendingUp, MessageCircle, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChatModeration() {
  const { user } = useAuth();
  const { isDarkMode } = useDarkMode();
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [allChats, setAllChats] = useState([]);
  const [flaggedMessages, setFlaggedMessages] = useState([]);
  const [reportedMessages, setReportedMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (user && user.role !== 'admin') {
      window.location.href = '/dashboard';
    }
  }, [user]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await chatAPI.getModerationStats();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const loadAllChats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await chatAPI.getAllChats({ page: 1, limit: 50 });
      setAllChats(data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const loadFlaggedMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await chatAPI.getFlaggedMessages();
      setFlaggedMessages(data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load flagged messages');
    } finally {
      setLoading(false);
    }
  };

  const loadReportedMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await chatAPI.getReportedMessages();
      setReportedMessages(data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load reported messages');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    switch (tab) {
      case 'chats':
        await loadAllChats();
        break;
      case 'flagged':
        await loadFlaggedMessages();
        break;
      case 'reported':
        await loadReportedMessages();
        break;
      default:
        break;
    }
  };

  const handleFlagMessage = async () => {
    if (!reason || reason.length < 10) {
      toast.error('Reason must be at least 10 characters');
      return;
    }
    try {
      await chatAPI.flagMessage(selectedMessage._id, { reason });
      toast.success('Message flagged successfully');
      setShowModal(false);
      if (activeTab === 'flagged') await loadFlaggedMessages();
    } catch (err) {
      toast.error(err.message || 'Failed to flag message');
    }
  };

  const handleHideMessage = async () => {
    if (!reason || reason.length < 10) {
      toast.error('Reason must be at least 10 characters');
      return;
    }
    try {
      await chatAPI.hideMessage(selectedMessage._id, { reason });
      toast.success('Message hidden successfully');
      setShowModal(false);
    } catch (err) {
      toast.error(err.message || 'Failed to hide message');
    }
  };

  const openModal = (mode, message) => {
    setModalMode(mode);
    setSelectedMessage(message);
    setReason('');
    setShowModal(true);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: isDarkMode
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
        : 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '2rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{
              padding: '0.75rem',
              background: 'rgba(220, 38, 38, 0.1)',
              borderRadius: '12px'
            }}>
              <MessageSquare style={{ width: '24px', height: '24px', color: '#dc2626' }} />
            </div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: isDarkMode ? '#f1f5f9' : '#111827'
            }}>
              Chat <span style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>Moderation</span>
            </h1>
          </div>
          <p style={{
            color: isDarkMode ? '#cbd5e1' : '#6b7280',
            fontSize: '0.875rem'
          }}>
            Manage and moderate chat messages across the platform
          </p>
        </motion.div>

        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                background: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                borderRadius: '12px',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <AlertCircle style={{ width: '20px', height: '20px' }} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: '2rem',
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          {['stats', 'chats', 'flagged', 'reported'].map((tab) => (
            <motion.button
              key={tab}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleTabChange(tab)}
              style={{
                padding: '0.75rem 1.5rem',
                background: activeTab === tab
                  ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
                  : isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                border: activeTab === tab ? 'none' : isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                color: activeTab === tab ? 'white' : isDarkMode ? '#f1f5f9' : '#111827',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {tab === 'stats' && <TrendingUp style={{ width: '18px', height: '18px' }} />}
              {tab === 'chats' && <MessageCircle style={{ width: '18px', height: '18px' }} />}
              {tab === 'flagged' && <Flag style={{ width: '18px', height: '18px' }} />}
              {tab === 'reported' && <AlertCircle style={{ width: '18px', height: '18px' }} />}
              {tab === 'stats' && 'Statistics'}
              {tab === 'chats' && 'All Chats'}
              {tab === 'flagged' && 'Flagged'}
              {tab === 'reported' && 'Reported'}
            </motion.button>
          ))}
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'stats' && (
            <StatsView key="stats" stats={stats} loading={loading} isDarkMode={isDarkMode} />
          )}
          {activeTab === 'chats' && (
            <ChatsView key="chats" chats={allChats} loading={loading} isDarkMode={isDarkMode} />
          )}
          {activeTab === 'flagged' && (
            <MessagesView
              key="flagged"
              messages={flaggedMessages}
              title="Flagged Messages"
              loading={loading}
              isDarkMode={isDarkMode}
              onAction={openModal}
            />
          )}
          {activeTab === 'reported' && (
            <MessagesView
              key="reported"
              messages={reportedMessages}
              title="Reported Messages"
              loading={loading}
              isDarkMode={isDarkMode}
              onAction={openModal}
            />
          )}
        </AnimatePresence>

        {/* Action Modal */}
        <AnimatePresence>
          {showModal && (
            <ActionModal
              message={selectedMessage}
              mode={modalMode}
              reason={reason}
              onReasonChange={setReason}
              onFlag={handleFlagMessage}
              onHide={handleHideMessage}
              onClose={() => setShowModal(false)}
              isDarkMode={isDarkMode}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatsView({ stats, loading, isDarkMode }) {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: isDarkMode ? '#cbd5e1' : '#6b7280'
        }}
      >
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(220, 38, 38, 0.2)',
          borderTopColor: '#dc2626',
          borderRadius: '50%',
          margin: '0 auto 1rem',
          animation: 'spin 1s linear infinite'
        }} />
        Loading statistics...
      </motion.div>
    );
  }

  if (!stats) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: isDarkMode ? '#cbd5e1' : '#6b7280'
        }}
      >
        No data available
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem'
      }}
    >
      <StatCard label="Total Chats" value={stats.totalChats || 0} isDarkMode={isDarkMode} />
      <StatCard label="Total Messages" value={stats.totalMessages || 0} isDarkMode={isDarkMode} />
      <StatCard label="Flagged Messages" value={stats.flaggedCount || 0} isDarkMode={isDarkMode} />
      <StatCard label="Reported Messages" value={stats.reportedCount || 0} isDarkMode={isDarkMode} />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
}

function StatCard({ label, value, isDarkMode }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      style={{
        padding: '1.5rem',
        background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(12px)',
        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
      }}
    >
      <p style={{
        fontSize: '0.75rem',
        color: isDarkMode ? '#94a3b8' : '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        margin: 0,
        marginBottom: '0.5rem'
      }}>
        {label}
      </p>
      <p style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        color: isDarkMode ? '#f1f5f9' : '#111827',
        margin: 0
      }}>
        {value}
      </p>
    </motion.div>
  );
}

function ChatsView({ chats, loading, isDarkMode }) {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: isDarkMode ? '#cbd5e1' : '#6b7280'
        }}
      >
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(220, 38, 38, 0.2)',
          borderTopColor: '#dc2626',
          borderRadius: '50%',
          margin: '0 auto 1rem',
          animation: 'spin 1s linear infinite'
        }} />
        Loading chats...
      </motion.div>
    );
  }

  if (!chats || chats.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          padding: '2rem',
          background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          borderRadius: '16px',
          textAlign: 'center',
          color: isDarkMode ? '#cbd5e1' : '#6b7280'
        }}
      >
        No chats found
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'grid',
        gap: '1rem'
      }}
    >
      {chats.map((chat) => (
        <motion.div
          key={chat._id}
          whileHover={{ y: -2 }}
          style={{
            padding: '1rem',
            background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            cursor: 'pointer'
          }}
        >
          <p style={{ color: isDarkMode ? '#f1f5f9' : '#111827', margin: 0, fontWeight: 600 }}>
            {chat.participantName || 'Chat'}
          </p>
          <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
            {chat.messageCount || 0} messages
          </p>
        </motion.div>
      ))}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
}

function MessagesView({ messages, title, loading, isDarkMode, onAction }) {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: isDarkMode ? '#cbd5e1' : '#6b7280'
        }}
      >
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(220, 38, 38, 0.2)',
          borderTopColor: '#dc2626',
          borderRadius: '50%',
          margin: '0 auto 1rem',
          animation: 'spin 1s linear infinite'
        }} />
        Loading messages...
      </motion.div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          padding: '2rem',
          background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          borderRadius: '16px',
          textAlign: 'center',
          color: isDarkMode ? '#cbd5e1' : '#6b7280'
        }}
      >
        No {title.toLowerCase()} found
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'grid',
        gap: '1rem'
      }}
    >
      {messages.map((msg) => (
        <motion.div
          key={msg._id}
          whileHover={{ y: -2 }}
          style={{
            padding: '1rem',
            background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '12px'
          }}
        >
          <p style={{ color: isDarkMode ? '#f1f5f9' : '#111827', margin: 0, fontWeight: 600 }}>
            {msg.senderName || 'User'}
          </p>
          <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', margin: '0.5rem 0', fontSize: '0.875rem' }}>
            {msg.content}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onAction('flag', msg)}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(220, 38, 38, 0.1)',
                color: '#dc2626',
                border: '1px solid rgba(220, 38, 38, 0.2)',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <Flag style={{ width: '14px', height: '14px', marginRight: '0.25rem', display: 'inline' }} />
              Flag
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onAction('hide', msg)}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(220, 38, 38, 0.1)',
                color: '#dc2626',
                border: '1px solid rgba(220, 38, 38, 0.2)',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <Eye style={{ width: '14px', height: '14px', marginRight: '0.25rem', display: 'inline' }} />
              Hide
            </motion.button>
          </div>
        </motion.div>
      ))}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
}

function ActionModal({ message, mode, reason, onReasonChange, onFlag, onHide, onClose, isDarkMode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: isDarkMode ? '#1e293b' : '#ffffff',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}
      >
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: isDarkMode ? '#f1f5f9' : '#111827',
          marginBottom: '1rem'
        }}>
          {mode === 'flag' ? 'Flag Message' : 'Hide Message'}
        </h2>

        <p style={{
          color: isDarkMode ? '#cbd5e1' : '#6b7280',
          marginBottom: '1rem',
          fontSize: '0.875rem'
        }}>
          Message from: <strong>{message?.senderName || 'User'}</strong>
        </p>

        <textarea
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="Enter reason for action (minimum 10 characters)..."
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '0.75rem',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            background: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(0, 0, 0, 0.02)',
            color: isDarkMode ? '#f1f5f9' : '#111827',
            fontSize: '0.875rem',
            fontFamily: 'inherit',
            resize: 'vertical',
            boxSizing: 'border-box'
          }}
        />

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={mode === 'flag' ? onFlag : onHide}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {mode === 'flag' ? 'Flag' : 'Hide'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              color: isDarkMode ? '#f1f5f9' : '#111827',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Cancel
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
