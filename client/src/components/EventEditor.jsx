import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { eventAPI } from '../services/api';
import { useDarkMode } from '../context/DarkModeContext';
import { X, Plus } from 'lucide-react';

const EventEditor = ({ isOpen, event, onClose, onSave }) => {
  const { isDarkMode } = useDarkMode();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    venue: {
      name: '',
      address: '',
      city: '',
      location: {
        coordinates: [0, 0]
      }
    },
    expectedDonors: 50,
    organizer: '',
    contactEmail: '',
    contactPhone: '',
    image: '',
    isPublished: true
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        eventDate: event.eventDate ? event.eventDate.split('T')[0] : '',
        startTime: event.startTime || '',
        endTime: event.endTime || '',
        venue: {
          name: event.venue?.name || '',
          address: event.venue?.address || '',
          city: event.venue?.city || '',
          location: {
            coordinates: event.venue?.location?.coordinates || [0, 0]
          }
        },
        expectedDonors: event.expectedDonors || 50,
        organizer: event.organizer || '',
        contactEmail: event.contactEmail || '',
        contactPhone: event.contactPhone || '',
        image: event.image || '',
        isPublished: event.isPublished !== undefined ? event.isPublished : true
      });
    } else {
      setFormData({
        title: '',
        description: '',
        eventDate: '',
        startTime: '',
        endTime: '',
        venue: {
          name: '',
          address: '',
          city: '',
          location: {
            coordinates: [0, 0]
          }
        },
        expectedDonors: 50,
        organizer: '',
        contactEmail: '',
        contactPhone: '',
        image: '',
        isPublished: true
      });
    }
  }, [event, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'venue_name') {
      setFormData(prev => ({
        ...prev,
        venue: { ...prev.venue, name: value }
      }));
    } else if (name === 'venue_address') {
      setFormData(prev => ({
        ...prev,
        venue: { ...prev.venue, address: value }
      }));
    } else if (name === 'venue_city') {
      setFormData(prev => ({
        ...prev,
        venue: { ...prev.venue, city: value }
      }));
    } else if (name === 'venue_latitude') {
      setFormData(prev => ({
        ...prev,
        venue: {
          ...prev.venue,
          location: {
            ...prev.venue.location,
            coordinates: [parseFloat(value) || 0, prev.venue.location.coordinates[1]]
          }
        }
      }));
    } else if (name === 'venue_longitude') {
      setFormData(prev => ({
        ...prev,
        venue: {
          ...prev.venue,
          location: {
            ...prev.venue.location,
            coordinates: [prev.venue.location.coordinates[0], parseFloat(value) || 0]
          }
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    if (!formData.title.trim() || formData.title.length < 3) {
      toast.error('Event title must be at least 3 characters', { icon: '⚠️' });
      return false;
    }
    if (!formData.description.trim() || formData.description.length < 10) {
      toast.error('Description must be at least 10 characters', { icon: '⚠️' });
      return false;
    }
    if (!formData.eventDate) {
      toast.error('Event date is required', { icon: '⚠️' });
      return false;
    }
    if (!formData.startTime || !formData.endTime) {
      toast.error('Start and end times are required', { icon: '⚠️' });
      return false;
    }
    if (!formData.venue.name.trim()) {
      toast.error('Venue name is required', { icon: '⚠️' });
      return false;
    }
    if (!formData.venue.city.trim()) {
      toast.error('City is required', { icon: '⚠️' });
      return false;
    }
    if (formData.expectedDonors < 1) {
      toast.error('Expected donors must be at least 1', { icon: '⚠️' });
      return false;
    }
    if (!formData.contactEmail.trim() || !formData.contactEmail.includes('@')) {
      toast.error('Valid contact email is required', { icon: '⚠️' });
      return false;
    }
    if (!formData.contactPhone.trim() || formData.contactPhone.length < 10) {
      toast.error('Valid contact phone is required', { icon: '⚠️' });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitPromise = event
        ? eventAPI.update(event._id, formData)
        : eventAPI.create(formData);

      toast.promise(
        submitPromise,
        {
          loading: event ? 'Updating event...' : 'Creating event...',
          success: event ? 'Event updated successfully!' : 'Event created successfully!',
          error: (err) => `Failed to save event: ${err.message || 'Unknown error'}`
        },
        {
          success: { icon: '✅', duration: 3000 },
          error: { icon: '❌', duration: 4000 }
        }
      );

      await submitPromise;
      onClose();
      onSave();
    } catch (error) {
      console.error('Failed to save event:', error);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.8)',
    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
    color: isDarkMode ? '#f1f5f9' : '#111827',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'all 0.2s'
  };

  const labelStyle = {
    display: 'block',
    color: isDarkMode ? '#e2e8f0' : '#374151',
    fontSize: '0.875rem',
    fontWeight: '600',
    marginBottom: '0.5rem'
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1rem',
            overflowY: 'auto'
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: isDarkMode
                ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
                : 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)',
              borderRadius: '16px',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              padding: '2rem',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.2)',
              my: 'auto'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: isDarkMode ? '#f1f5f9' : '#111827'
              }}>
                {event ? 'Edit Event' : 'Create New Event'}
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(220, 38, 38, 0.1)',
                  color: '#dc2626',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </motion.button>
            </div>

            {/* Form Content */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              {/* Title */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Event Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter event title"
                  maxLength="100"
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#dc2626';
                    e.target.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <p style={{
                  fontSize: '0.75rem',
                  color: isDarkMode ? '#94a3b8' : '#9ca3af',
                  marginTop: '0.25rem'
                }}>
                  {formData.title.length} / 100 characters
                </p>
              </div>

              {/* Description */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter event description"
                  maxLength="500"
                  rows="4"
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    fontFamily: 'inherit'
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
                <p style={{
                  fontSize: '0.75rem',
                  color: isDarkMode ? '#94a3b8' : '#9ca3af',
                  marginTop: '0.25rem'
                }}>
                  {formData.description.length} / 500 characters
                </p>
              </div>

              {/* Event Date */}
              <div>
                <label style={labelStyle}>Event Date *</label>
                <input
                  type="date"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleChange}
                  style={inputStyle}
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

              {/* Start Time */}
              <div>
                <label style={labelStyle}>Start Time *</label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  style={inputStyle}
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

              {/* End Time */}
              <div>
                <label style={labelStyle}>End Time *</label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  style={inputStyle}
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

              {/* Venue Name */}
              <div>
                <label style={labelStyle}>Venue Name *</label>
                <input
                  type="text"
                  name="venue_name"
                  value={formData.venue.name}
                  onChange={handleChange}
                  placeholder="Enter venue name"
                  maxLength="100"
                  style={inputStyle}
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

              {/* Venue City */}
              <div>
                <label style={labelStyle}>City *</label>
                <input
                  type="text"
                  name="venue_city"
                  value={formData.venue.city}
                  onChange={handleChange}
                  placeholder="Enter city name"
                  maxLength="100"
                  style={inputStyle}
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

              {/* Venue Address */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Venue Address (Optional)</label>
                <textarea
                  name="venue_address"
                  value={formData.venue.address}
                  onChange={handleChange}
                  placeholder="Enter complete venue address"
                  maxLength="300"
                  rows="2"
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    fontFamily: 'inherit'
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

              {/* Expected Donors */}
              <div>
                <label style={labelStyle}>Expected Donors *</label>
                <input
                  type="number"
                  name="expectedDonors"
                  value={formData.expectedDonors}
                  onChange={handleChange}
                  min="1"
                  max="5000"
                  style={inputStyle}
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

              {/* Organizer */}
              <div>
                <label style={labelStyle}>Organizer *</label>
                <input
                  type="text"
                  name="organizer"
                  value={formData.organizer}
                  onChange={handleChange}
                  placeholder="Enter organizer name"
                  maxLength="100"
                  style={inputStyle}
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

              {/* Contact Email */}
              <div>
                <label style={labelStyle}>Contact Email *</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="Enter contact email"
                  maxLength="100"
                  style={inputStyle}
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

              {/* Contact Phone */}
              <div>
                <label style={labelStyle}>Contact Phone *</label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  placeholder="Enter contact phone"
                  maxLength="20"
                  style={inputStyle}
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
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end'
            }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(0, 0, 0, 0.05)',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: loading ? 0.5 : 1
                }}
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: loading
                    ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                    : 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus style={{ width: '1rem', height: '1rem' }} />
                    {event ? 'Update Event' : 'Create Event'}
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>

          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EventEditor;
