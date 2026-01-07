import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { eventAPI } from '../services/api';
import { useDarkMode } from '../context/DarkModeContext';
import {
  Calendar, Search, Trash2, Edit3, Plus, X, CheckCircle,
  Clock, MapPin, Users, AlertCircle, ChevronDown, Eye
} from 'lucide-react';
import EventEditor from '../components/EventEditor';
import LiquidBackground from '../components/LiquidBackground';

const AdminEventManager = () => {
  const { isDarkMode } = useDarkMode();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [deleteModal, setDeleteModal] = useState({ show: false, eventId: null, eventTitle: '' });
  const [editorModal, setEditorModal] = useState({ show: false, event: null });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await eventAPI.getAll();
      setEvents(data.data || []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      toast.error('Failed to load events', { icon: '❌' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = () => {
    setEditorModal({ show: true, event: null });
  };

  const handleEditEvent = (event) => {
    setEditorModal({ show: true, event });
  };

  const handleDeleteEvent = async () => {
    const deletePromise = eventAPI.delete(deleteModal.eventId);

    toast.promise(
      deletePromise,
      {
        loading: 'Deleting event...',
        success: `Event "${deleteModal.eventTitle}" deleted successfully`,
        error: (err) => `Failed to delete event: ${err.message || 'Unknown error'}`,
      },
      {
        success: { icon: '✅', duration: 3000 },
        error: { icon: '❌', duration: 4000 },
      }
    );

    try {
      await deletePromise;
      setDeleteModal({ show: false, eventId: null, eventTitle: '' });
      setSelectedStatus('all');
      fetchEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const handleSaveEvent = async () => {
    setEditorModal({ show: false, event: null });
    setSearchTerm('');
    setSelectedStatus('all');
    // Immediately fetch and also after a small delay
    await fetchEvents();
    // Also fetch again after modal animation completes
    setTimeout(() => {
      fetchEvents();
    }, 500);
  };

  const getEventStatus = (event) => {
    const eventDate = new Date(event.eventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (eventDate < today) return 'completed';
    if (eventDate.toDateString() === today.toDateString()) return 'today';
    return 'upcoming';
  };

  const filterEvents = () => {
    return events.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.venue?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      if (selectedStatus === 'all') return matchesSearch;
      return matchesSearch && getEventStatus(event) === selectedStatus;
    });
  };

  const filteredEvents = filterEvents();

  const stats = {
    total: events.length,
    upcoming: events.filter(e => getEventStatus(e) === 'upcoming').length,
    today: events.filter(e => getEventStatus(e) === 'today').length,
    completed: events.filter(e => getEventStatus(e) === 'completed').length,
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: isDarkMode
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)',
        padding: '2rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <LiquidBackground />
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: `4px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            borderTopColor: '#dc2626',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', fontSize: '1rem', fontWeight: '500' }}>
            Loading events...
          </p>
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: isDarkMode
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
        : 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)',
      padding: '2rem 1rem',
      position: 'relative'
    }}>
      <LiquidBackground />

      <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2rem',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <Calendar style={{ width: '32px', height: '32px', color: '#dc2626' }} />
              <span style={{ color: isDarkMode ? '#f1f5f9' : '#111827' }}>Event </span>
              <span style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>Manager</span>
            </h1>
            <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', fontSize: '0.875rem' }}>
              Create and manage blood donation camp events
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreateEvent}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
            }}
          >
            <Plus style={{ width: '1rem', height: '1rem' }} />
            Create Event
          </motion.button>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {[
            { label: 'Total Events', value: stats.total, icon: Calendar, color: '#dc2626' },
            { label: 'Upcoming', value: stats.upcoming, icon: CheckCircle, color: '#10b981' },
            { label: 'Today', value: stats.today, icon: Clock, color: '#f59e0b' },
            { label: 'Completed', value: stats.completed, icon: Eye, color: '#6366f1' }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              style={{
                background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                padding: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: `rgba(${stat.color === '#dc2626' ? '220,38,38' : stat.color === '#10b981' ? '16,185,129' : stat.color === '#f59e0b' ? '245,158,11' : '99,102,241'}, 0.1)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <stat.icon style={{ width: '24px', height: '24px', color: stat.color }} />
              </div>
              <div>
                <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                  {stat.label}
                </p>
                <p style={{ color: isDarkMode ? '#f1f5f9' : '#111827', fontSize: '1.75rem', fontWeight: 'bold' }}>
                  {stat.value}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search and Filter */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}>
          <div style={{
            flex: 1,
            minWidth: '250px',
            position: 'relative'
          }}>
            <Search style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '1.25rem',
              height: '1.25rem',
              color: isDarkMode ? '#64748b' : '#9ca3af'
            }} />
            <input
              type="text"
              placeholder="Search events by title, description, or venue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.75rem',
                background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '12px',
                color: isDarkMode ? '#f1f5f9' : '#111827',
                fontSize: '0.875rem',
                backdropFilter: 'blur(12px)',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#dc2626';
                e.target.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '12px',
              color: isDarkMode ? '#f1f5f9' : '#111827',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              backdropFilter: 'blur(12px)',
              outline: 'none',
              transition: 'all 0.2s'
            }}
          >
            <option value="all">All Events</option>
            <option value="upcoming">Upcoming</option>
            <option value="today">Today</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Events Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
        >
          {filteredEvents.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{
                    background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(0, 0, 0, 0.03)',
                    borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'
                  }}>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      color: isDarkMode ? '#cbd5e1' : '#6b7280',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Event Title</th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      color: isDarkMode ? '#cbd5e1' : '#6b7280',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Date & Time</th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      color: isDarkMode ? '#cbd5e1' : '#6b7280',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Venue</th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      color: isDarkMode ? '#cbd5e1' : '#6b7280',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Registrations</th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      color: isDarkMode ? '#cbd5e1' : '#6b7280',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Status</th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'center',
                      color: isDarkMode ? '#cbd5e1' : '#6b7280',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event, index) => {
                    const status = getEventStatus(event);
                    const statusColors = {
                      upcoming: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', label: 'Upcoming' },
                      today: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', label: 'Today' },
                      completed: { bg: 'rgba(99, 102, 241, 0.1)', text: '#6366f1', label: 'Completed' }
                    };
                    const statusColor = statusColors[status];

                    return (
                      <motion.tr
                        key={event._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        style={{
                          borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <td style={{ padding: '1rem' }}>
                          <p style={{
                            color: isDarkMode ? '#f1f5f9' : '#111827',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            marginBottom: '0.25rem'
                          }}>
                            {event.title}
                          </p>
                          <p style={{
                            color: isDarkMode ? '#94a3b8' : '#9ca3af',
                            fontSize: '0.75rem'
                          }}>
                            {event.description?.substring(0, 50)}...
                          </p>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <p style={{
                            color: isDarkMode ? '#f1f5f9' : '#111827',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            marginBottom: '0.25rem'
                          }}>
                            {new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p style={{
                            color: isDarkMode ? '#94a3b8' : '#9ca3af',
                            fontSize: '0.75rem'
                          }}>
                            {event.startTime} - {event.endTime}
                          </p>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <p style={{
                            color: isDarkMode ? '#f1f5f9' : '#111827',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}>
                            {event.venue?.name || 'TBA'}
                          </p>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <p style={{
                            color: isDarkMode ? '#f1f5f9' : '#111827',
                            fontSize: '0.875rem',
                            fontWeight: '600'
                          }}>
                            {event.registeredDonors?.length || 0} / {event.expectedDonors}
                          </p>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.4rem 0.8rem',
                            background: statusColor.bg,
                            color: statusColor.text,
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {statusColor.label}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <div style={{
                            display: 'flex',
                            gap: '0.5rem',
                            justifyContent: 'center'
                          }}>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleEditEvent(event)}
                              style={{
                                padding: '0.5rem',
                                background: 'rgba(59, 130, 246, 0.1)',
                                color: '#3b82f6',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                              }}
                            >
                              <Edit3 style={{ width: '1rem', height: '1rem' }} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setDeleteModal({ show: true, eventId: event._id, eventTitle: event.title })}
                              style={{
                                padding: '0.5rem',
                                background: 'rgba(220, 38, 38, 0.1)',
                                color: '#dc2626',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)';
                              }}
                            >
                              <Trash2 style={{ width: '1rem', height: '1rem' }} />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{
              padding: '3rem',
              textAlign: 'center'
            }}>
              <Calendar style={{
                width: '48px',
                height: '48px',
                color: isDarkMode ? '#475569' : '#d1d5db',
                margin: '0 auto 1rem'
              }} />
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: isDarkMode ? '#f1f5f9' : '#111827',
                marginBottom: '0.5rem'
              }}>
                No Events Found
              </h3>
              <p style={{
                color: isDarkMode ? '#cbd5e1' : '#6b7280',
                fontSize: '0.875rem'
              }}>
                {searchTerm || selectedStatus !== 'all'
                  ? 'No events match your search criteria. Try adjusting your filters.'
                  : 'No events created yet. Click "Create Event" to get started.'}
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteModal({ show: false, eventId: null, eventTitle: '' })}
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
              zIndex: 1000,
              padding: '1rem'
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: isDarkMode ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)',
                borderRadius: '16px',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                padding: '2rem',
                maxWidth: '400px',
                width: '100%',
                boxShadow: '0 20px 25px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(220, 38, 38, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <AlertCircle style={{ width: '24px', height: '24px', color: '#dc2626' }} />
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: isDarkMode ? '#f1f5f9' : '#111827',
                marginBottom: '0.5rem'
              }}>
                Delete Event?
              </h3>
              <p style={{
                color: isDarkMode ? '#cbd5e1' : '#6b7280',
                fontSize: '0.875rem',
                marginBottom: '1.5rem'
              }}>
                Are you sure you want to delete "{deleteModal.eventTitle}"? This action cannot be undone.
              </p>
              <div style={{
                display: 'flex',
                gap: '0.75rem'
              }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDeleteModal({ show: false, eventId: null, eventTitle: '' })}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(0, 0, 0, 0.05)',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDeleteEvent}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Editor Modal */}
      <EventEditor
        isOpen={editorModal.show}
        event={editorModal.event}
        onClose={() => setEditorModal({ show: false, event: null })}
        onSave={handleSaveEvent}
      />
    </div>
  );
};

export default AdminEventManager;
