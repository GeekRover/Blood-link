import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { availabilityAPI } from '../services/api';
import { useDarkMode } from '../context/DarkModeContext';
import {
  Calendar, Clock, Plus, Trash2, Edit2, Save, X, AlertCircle,
  Check, Sun, Moon, CalendarDays, CalendarX, ToggleLeft, ToggleRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

const AvailabilitySettings = () => {
  const { isDarkMode } = useDarkMode();
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);
  const [editingCustom, setEditingCustom] = useState(null);
  const [newSlot, setNewSlot] = useState({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isActive: true });
  const [newCustom, setNewCustom] = useState({
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    isAvailable: true,
    reason: ''
  });
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const response = await availabilityAPI.getSchedule();
      setSchedule(response.data);
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
      toast.error('Failed to load availability schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleScheduled = async () => {
    try {
      const newState = !schedule?.availabilitySchedule?.enabled;
      await availabilityAPI.toggleScheduled({ enabled: newState });
      toast.success(newState ? 'Scheduled availability enabled!' : 'Scheduled availability disabled!', {
        icon: newState ? '✅' : '❌'
      });
      fetchSchedule();
    } catch (error) {
      console.error('Failed to toggle:', error);
      toast.error('Failed to update availability');
    }
  };

  const handleAddWeeklySlot = async () => {
    try {
      if (!newSlot.startTime || !newSlot.endTime) {
        toast.error('Please fill in all time fields', { icon: '⚠️' });
        return;
      }

      await availabilityAPI.addWeeklySlot(newSlot);
      toast.success('Weekly slot added!', { icon: '✅' });
      setShowAddSlot(false);
      setNewSlot({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isActive: true });
      fetchSchedule();
    } catch (error) {
      console.error('Failed to add slot:', error);
      toast.error(error.message || 'Failed to add slot');
    }
  };

  const handleUpdateWeeklySlot = async (slotId, data) => {
    try {
      await availabilityAPI.updateWeeklySlot(slotId, data);
      toast.success('Weekly slot updated!', { icon: '✅' });
      setEditingSlot(null);
      fetchSchedule();
    } catch (error) {
      console.error('Failed to update slot:', error);
      toast.error('Failed to update slot');
    }
  };

  const handleDeleteWeeklySlot = async (slotId) => {
    if (!confirm('Are you sure you want to delete this weekly slot?')) return;

    try {
      await availabilityAPI.deleteWeeklySlot(slotId);
      toast.success('Weekly slot deleted!', { icon: '🗑️' });
      fetchSchedule();
    } catch (error) {
      console.error('Failed to delete slot:', error);
      toast.error('Failed to delete slot');
    }
  };

  const handleAddCustom = async () => {
    try {
      if (!newCustom.startDate || !newCustom.endDate) {
        toast.error('Please fill in date fields', { icon: '⚠️' });
        return;
      }

      await availabilityAPI.addCustom(newCustom);
      toast.success('Custom availability added!', { icon: '✅' });
      setShowAddCustom(false);
      setNewCustom({
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        isAvailable: true,
        reason: ''
      });
      fetchSchedule();
    } catch (error) {
      console.error('Failed to add custom:', error);
      toast.error(error.message || 'Failed to add custom availability');
    }
  };

  const handleDeleteCustom = async (customId) => {
    if (!confirm('Are you sure you want to delete this custom availability?')) return;

    try {
      await availabilityAPI.deleteCustom(customId);
      toast.success('Custom availability deleted!', { icon: '🗑️' });
      fetchSchedule();
    } catch (error) {
      console.error('Failed to delete custom:', error);
      toast.error('Failed to delete custom availability');
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDarkMode
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)'
      }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center' }}
        >
          <Clock
            style={{
              width: '48px',
              height: '48px',
              color: '#dc2626',
              animation: 'spin 2s linear infinite',
              marginBottom: '1rem'
            }}
          />
          <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280' }}>
            Loading availability settings...
          </p>
        </motion.div>
      </div>
    );
  }

  const weeklySlots = schedule?.availabilitySchedule?.weeklySlots || [];
  const customAvailability = schedule?.availabilitySchedule?.customAvailability || [];
  const isEnabled = schedule?.availabilitySchedule?.enabled || false;

  return (
    <div style={{
      minHeight: '100vh',
      background: isDarkMode
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
        : 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '2rem' }}
        >
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Calendar style={{ width: '32px', height: '32px', color: '#dc2626' }} />
            <span style={{ color: isDarkMode ? '#f1f5f9' : '#111827' }}>Availability </span>
            <span style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Settings</span>
          </h1>
          <p style={{
            color: isDarkMode ? '#cbd5e1' : '#6b7280',
            fontSize: '0.875rem'
          }}>
            Manage your donation availability schedule
          </p>
        </motion.div>

        {/* Enable/Disable Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            padding: '2rem',
            background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            marginBottom: '2rem'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: isDarkMode ? '#f1f5f9' : '#111827',
                marginBottom: '0.5rem'
              }}>
                Scheduled Availability
              </h2>
              <p style={{
                color: isDarkMode ? '#94a3b8' : '#6b7280',
                fontSize: '0.875rem'
              }}>
                {isEnabled
                  ? 'Schedule-based matching is active. You\'ll only receive requests during your set hours.'
                  : 'Schedule-based matching is off. You\'ll receive all compatible requests regardless of time.'}
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleScheduled}
              style={{
                padding: '0.75rem 1.5rem',
                background: isEnabled
                  ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                  : isDarkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(148, 163, 184, 0.3)',
                color: isEnabled ? 'white' : isDarkMode ? '#cbd5e1' : '#475569',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.9375rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: isEnabled ? '0 4px 12px rgba(34, 197, 94, 0.3)' : 'none'
              }}
            >
              {isEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              {isEnabled ? 'Enabled' : 'Disabled'}
            </motion.button>
          </div>
        </motion.div>

        {/* Weekly Slots Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            padding: '2rem',
            background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            marginBottom: '2rem',
            opacity: isEnabled ? 1 : 0.5,
            pointerEvents: isEnabled ? 'auto' : 'none'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CalendarDays style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: isDarkMode ? '#f1f5f9' : '#111827'
              }}>
                Weekly Schedule
              </h2>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddSlot(!showAddSlot)}
              style={{
                padding: '0.625rem 1.25rem',
                background: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                color: '#3b82f6',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {showAddSlot ? <X size={16} /> : <Plus size={16} />}
              {showAddSlot ? 'Cancel' : 'Add Slot'}
            </motion.button>
          </div>

          {/* Add New Slot Form */}
          <AnimatePresence>
            {showAddSlot && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  padding: '1.5rem',
                  background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 0.6)',
                  borderRadius: '12px',
                  marginBottom: '1.5rem'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: isDarkMode ? '#cbd5e1' : '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Day of Week
                    </label>
                    <select
                      value={newSlot.dayOfWeek}
                      onChange={(e) => setNewSlot({ ...newSlot, dayOfWeek: parseInt(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'white',
                        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        color: isDarkMode ? '#f1f5f9' : '#111827',
                        fontSize: '0.875rem'
                      }}
                    >
                      {DAYS_OF_WEEK.map(day => (
                        <option key={day.value} value={day.value}>{day.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: isDarkMode ? '#cbd5e1' : '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={newSlot.startTime}
                      onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'white',
                        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        color: isDarkMode ? '#f1f5f9' : '#111827',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: isDarkMode ? '#cbd5e1' : '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      End Time
                    </label>
                    <input
                      type="time"
                      value={newSlot.endTime}
                      onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'white',
                        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        color: isDarkMode ? '#f1f5f9' : '#111827',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddWeeklySlot}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)'
                  }}
                >
                  <Plus size={16} />
                  Add Weekly Slot
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Weekly Slots List */}
          {weeklySlots.length === 0 ? (
            <div style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              color: isDarkMode ? '#94a3b8' : '#6b7280'
            }}>
              <Clock style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>No weekly slots configured</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Add slots to define your recurring availability
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {weeklySlots.map((slot, index) => (
                <motion.div
                  key={slot._id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  style={{
                    padding: '1.25rem',
                    background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 0.6)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{
                        padding: '0.375rem 0.875rem',
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: '#3b82f6',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}>
                        {DAYS_OF_WEEK.find(d => d.value === slot.dayOfWeek)?.label}
                      </span>
                      {!slot.isActive && (
                        <span style={{
                          padding: '0.375rem 0.875rem',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          Inactive
                        </span>
                      )}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: isDarkMode ? '#cbd5e1' : '#6b7280',
                      fontSize: '0.9375rem'
                    }}>
                      <Clock size={16} />
                      <span>{slot.startTime} - {slot.endTime}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDeleteWeeklySlot(slot._id)}
                      style={{
                        padding: '0.5rem',
                        background: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Custom Availability Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            padding: '2rem',
            background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            opacity: isEnabled ? 1 : 0.5,
            pointerEvents: isEnabled ? 'auto' : 'none'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CalendarX style={{ width: '24px', height: '24px', color: '#eab308' }} />
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: isDarkMode ? '#f1f5f9' : '#111827'
              }}>
                Custom Availability
              </h2>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddCustom(!showAddCustom)}
              style={{
                padding: '0.625rem 1.25rem',
                background: isDarkMode ? 'rgba(234, 179, 8, 0.2)' : 'rgba(234, 179, 8, 0.1)',
                color: '#eab308',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {showAddCustom ? <X size={16} /> : <Plus size={16} />}
              {showAddCustom ? 'Cancel' : 'Add Custom'}
            </motion.button>
          </div>

          {/* Add Custom Form */}
          <AnimatePresence>
            {showAddCustom && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  padding: '1.5rem',
                  background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 0.6)',
                  borderRadius: '12px',
                  marginBottom: '1.5rem'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: isDarkMode ? '#cbd5e1' : '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={newCustom.startDate}
                      onChange={(e) => setNewCustom({ ...newCustom, startDate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'white',
                        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        color: isDarkMode ? '#f1f5f9' : '#111827',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: isDarkMode ? '#cbd5e1' : '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      End Date
                    </label>
                    <input
                      type="date"
                      value={newCustom.endDate}
                      onChange={(e) => setNewCustom({ ...newCustom, endDate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'white',
                        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        color: isDarkMode ? '#f1f5f9' : '#111827',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: isDarkMode ? '#cbd5e1' : '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Start Time (Optional)
                    </label>
                    <input
                      type="time"
                      value={newCustom.startTime}
                      onChange={(e) => setNewCustom({ ...newCustom, startTime: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'white',
                        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        color: isDarkMode ? '#f1f5f9' : '#111827',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: isDarkMode ? '#cbd5e1' : '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      End Time (Optional)
                    </label>
                    <input
                      type="time"
                      value={newCustom.endTime}
                      onChange={(e) => setNewCustom({ ...newCustom, endTime: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'white',
                        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        color: isDarkMode ? '#f1f5f9' : '#111827',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#cbd5e1' : '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Availability Type
                  </label>
                  <select
                    value={newCustom.isAvailable.toString()}
                    onChange={(e) => setNewCustom({ ...newCustom, isAvailable: e.target.value === 'true' })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'white',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="true">Available (Override to be available)</option>
                    <option value="false">Unavailable (Vacation/Emergency Only)</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#cbd5e1' : '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Reason (Optional)
                  </label>
                  <input
                    type="text"
                    value={newCustom.reason}
                    onChange={(e) => setNewCustom({ ...newCustom, reason: e.target.value })}
                    placeholder="e.g., Vacation, Emergency, Special availability"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'white',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddCustom}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 2px 8px rgba(234, 179, 8, 0.3)'
                  }}
                >
                  <Plus size={16} />
                  Add Custom Availability
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Custom Availability List */}
          {customAvailability.length === 0 ? (
            <div style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              color: isDarkMode ? '#94a3b8' : '#6b7280'
            }}>
              <CalendarX style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>No custom availability configured</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Add custom dates for vacations or special availability
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {customAvailability.map((custom, index) => (
                <motion.div
                  key={custom._id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  style={{
                    padding: '1.25rem',
                    background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 0.6)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
                    borderRadius: '12px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'start',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '0.75rem',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{
                          padding: '0.375rem 0.875rem',
                          background: custom.isAvailable
                            ? 'rgba(34, 197, 94, 0.1)'
                            : 'rgba(239, 68, 68, 0.1)',
                          color: custom.isAvailable ? '#22c55e' : '#ef4444',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: '600'
                        }}>
                          {custom.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                        {custom.reason && (
                          <span style={{
                            padding: '0.375rem 0.875rem',
                            background: 'rgba(234, 179, 8, 0.1)',
                            color: '#eab308',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {custom.reason}
                          </span>
                        )}
                      </div>

                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        color: isDarkMode ? '#cbd5e1' : '#6b7280',
                        fontSize: '0.875rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Calendar size={16} />
                          <span>
                            {new Date(custom.startDate).toLocaleDateString()} - {new Date(custom.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        {custom.startTime && custom.endTime && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={16} />
                            <span>{custom.startTime} - {custom.endTime}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDeleteCustom(custom._id)}
                      style={{
                        padding: '0.5rem',
                        background: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AvailabilitySettings;
