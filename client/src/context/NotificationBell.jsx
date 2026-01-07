import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationAPI } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { useDarkMode } from '../context/DarkModeContext';
import { Bell, Check, CheckCheck, X } from 'lucide-react';

const NotificationBell = () => {
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const socket = useSocket();
  const { isDarkMode } = useDarkMode();
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();

    if (socket) {
      socket.on('notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setCount(prev => prev + 1);
      });
    }

    return () => {
      if (socket) {
        socket.off('notification');
      }
    };
  }, [socket]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const fetchNotifications = async () => {
    try {
      const data = await notificationAPI.getAll({ limit: 10 });
      setNotifications(data.data);
      setCount(data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setCount(prev => Math.max(0, prev - 1));
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <motion.button
        onClick={() => setShowDropdown(!showDropdown)}
        className="modern-icon-btn"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Notifications"
        style={{ position: 'relative' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={count > 0 ? 'active' : 'inactive'}
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.8, rotate: 10 }}
            transition={{ duration: 0.2 }}
          >
            <Bell className={`w-4 h-4 ${count > 0 ? 'text-red-500' : ''}`} />
          </motion.div>
        </AnimatePresence>

        {count > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              minWidth: '18px',
              height: '18px',
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              color: 'white',
              borderRadius: '9px',
              fontSize: '0.65rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: isDarkMode ? '2px solid #1e293b' : '2px solid white',
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.4)'
            }}
          >
            {count > 99 ? '99+' : count}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '380px',
              maxWidth: '90vw',
              maxHeight: '500px',
              background: isDarkMode ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(12px)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '16px',
              boxShadow: isDarkMode
                ? '0 20px 60px rgba(0, 0, 0, 0.5)'
                : '0 20px 60px rgba(0, 0, 0, 0.15)',
              overflow: 'hidden',
              zIndex: 1000
            }}
          >
            {/* Header */}
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  margin: 0
                }}>
                  Notifications
                </h3>
                {count > 0 && (
                  <p style={{
                    fontSize: '0.75rem',
                    color: isDarkMode ? '#94a3b8' : '#6b7280',
                    margin: '0.25rem 0 0 0'
                  }}>
                    {count} unread
                  </p>
                )}
              </div>

              {notifications.length > 0 && (
                <motion.button
                  onClick={handleMarkAllAsRead}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(220, 38, 38, 0.1)',
                    border: '1px solid rgba(220, 38, 38, 0.2)',
                    borderRadius: '8px',
                    color: '#dc2626',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(220, 38, 38, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)';
                  }}
                >
                  <CheckCheck style={{ width: '14px', height: '14px' }} />
                  Mark all read
                </motion.button>
              )}
            </div>

            {/* Notification List */}
            <div style={{
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {notifications.length === 0 ? (
                <div style={{
                  padding: '3rem 2rem',
                  textAlign: 'center'
                }}>
                  <Bell style={{
                    width: '48px',
                    height: '48px',
                    color: isDarkMode ? '#475569' : '#cbd5e1',
                    margin: '0 auto 1rem'
                  }} />
                  <p style={{
                    color: isDarkMode ? '#94a3b8' : '#6b7280',
                    fontSize: '0.875rem',
                    margin: 0
                  }}>
                    No notifications yet
                  </p>
                </div>
              ) : (
                notifications.map((notification, index) => (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                    style={{
                      padding: '1rem 1.25rem',
                      borderBottom: index < notifications.length - 1
                        ? isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)'
                        : 'none',
                      cursor: notification.isRead ? 'default' : 'pointer',
                      background: notification.isRead
                        ? 'transparent'
                        : isDarkMode ? 'rgba(220, 38, 38, 0.05)' : 'rgba(220, 38, 38, 0.03)',
                      position: 'relative',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!notification.isRead) {
                        e.currentTarget.style.background = isDarkMode
                          ? 'rgba(220, 38, 38, 0.08)'
                          : 'rgba(220, 38, 38, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!notification.isRead) {
                        e.currentTarget.style.background = isDarkMode
                          ? 'rgba(220, 38, 38, 0.05)'
                          : 'rgba(220, 38, 38, 0.03)';
                      }
                    }}
                  >
                    {!notification.isRead && (
                      <div style={{
                        position: 'absolute',
                        left: '0.5rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '6px',
                        height: '6px',
                        background: '#dc2626',
                        borderRadius: '50%'
                      }} />
                    )}

                    <div style={{ marginLeft: notification.isRead ? 0 : '0.75rem' }}>
                      <h4 style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: isDarkMode ? '#f1f5f9' : '#111827',
                        margin: '0 0 0.25rem 0',
                        lineHeight: '1.4'
                      }}>
                        {notification.title}
                      </h4>
                      <p style={{
                        fontSize: '0.8125rem',
                        color: isDarkMode ? '#cbd5e1' : '#6b7280',
                        margin: '0 0 0.5rem 0',
                        lineHeight: '1.5'
                      }}>
                        {notification.message}
                      </p>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <small style={{
                          fontSize: '0.75rem',
                          color: isDarkMode ? '#94a3b8' : '#9ca3af'
                        }}>
                          {formatTime(notification.createdAt)}
                        </small>
                        {!notification.isRead && (
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            style={{
                              padding: '0.25rem',
                              background: 'rgba(220, 38, 38, 0.1)',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Check style={{ width: '12px', height: '12px', color: '#dc2626' }} />
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
