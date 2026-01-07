import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { MapPin, Search, Users, Droplet, Phone, Mail, MessageCircle, Navigation, Award, Map, List } from 'lucide-react';
import { donorAPI } from '../services/api';
import { createChat } from '../services/chatService';
import { useDarkMode } from '../context/DarkModeContext';
import { StaggerChildren } from '../components/StaggerChildren';
import AnimatedCard from '../components/AnimatedCard';
import LeafletMap from '../components/Map/LeafletMap';

const DonorSearch = () => {
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState({
    bloodType: 'A+',
    latitude: '',
    longitude: '',
    radius: '50',
    urgency: 'normal'
  });
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [searchMode, setSearchMode] = useState('location'); // 'location' or 'coordinates'
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [creatingChat, setCreatingChat] = useState(false);

  // Auto-detect location on mount
  useEffect(() => {
    if (navigator.geolocation && !searchParams.latitude) {
      getCurrentLocation();
    }
  }, []);

  const getCurrentLocation = () => {
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSearchParams(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(4),
          longitude: position.coords.longitude.toFixed(4)
        }));
        setGettingLocation(false);
        toast.success('Location detected!', { icon: '📍' });
      },
      (error) => {
        setGettingLocation(false);
        toast.error('Could not get your location. Please enter manually.');
        console.error('Geolocation error:', error);
      }
    );
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchParams.latitude || !searchParams.longitude) {
      toast.error('Please provide location coordinates', { icon: '⚠️' });
      return;
    }

    setLoading(true);

    const searchPromise = donorAPI.search(searchParams);

    toast.promise(
      searchPromise,
      {
        loading: 'Searching for donors...',
        success: (data) => {
          const count = data.data?.length || 0;
          return count > 0
            ? `Found ${count} donor${count !== 1 ? 's' : ''} nearby! 🎉`
            : 'No donors found in this area';
        },
        error: 'Failed to search donors',
      },
      {
        success: {
          icon: '🔍',
          duration: 3000,
        },
        error: {
          icon: '❌',
          duration: 4000,
        },
      }
    );

    try {
      const data = await searchPromise;
      setDonors(data.data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (donorLat, donorLng) => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(donorLat - parseFloat(searchParams.latitude));
    const dLon = toRad(donorLng - parseFloat(searchParams.longitude));

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(parseFloat(searchParams.latitude))) *
        Math.cos(toRad(donorLat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const toRad = (degrees) => {
    return (degrees * Math.PI) / 180;
  };

  const handleContactDonor = (donor) => {
    setSelectedDonor(donor);
  };

  const handleStartChat = async (donor) => {
    setCreatingChat(true);
    try {
      // Create chat with the donor
      // donor._id is the user ID (DonorProfile extends User model)
      const response = await createChat({
        participantId: donor._id
      });

      toast.success(`Chat created with ${donor.name}!`, { icon: '💬' });

      // Close the modal
      setSelectedDonor(null);

      // Navigate to chat page with the chat ID
      navigate('/chat', {
        state: {
          newChatId: response.data._id,
          selectChat: true
        }
      });
    } catch (error) {
      console.error('Failed to create chat:', error);
      toast.error(error.error || 'Failed to create chat');
    } finally {
      setCreatingChat(false);
    }
  };

  const ContactModal = () => {
    if (!selectedDonor) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
        onClick={() => setSelectedDonor(null)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          style={{
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            background: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            color: '#dc2626'
          }}>
            Contact Donor
          </h3>
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              marginBottom: '0.5rem',
              color: isDarkMode ? '#f1f5f9' : '#111827'
            }}>
              {selectedDonor.name}
            </p>
            <p style={{ color: isDarkMode ? '#94a3b8' : '#6b7280' }}>
              Blood Type: <strong style={{ color: '#dc2626' }}>{selectedDonor.bloodType}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {selectedDonor.phone && (
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href={`tel:${selectedDonor.phone}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  border: isDarkMode ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(59, 130, 246, 0.1)'
                }}
              >
                <Phone style={{ width: '1.25rem', height: '1.25rem', color: '#3b82f6' }} />
                <span style={{ color: isDarkMode ? '#93c5fd' : '#2563eb', fontWeight: '500' }}>{selectedDonor.phone}</span>
              </motion.a>
            )}

            {selectedDonor.email && (
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href={`mailto:${selectedDonor.email}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  background: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  border: isDarkMode ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(34, 197, 94, 0.1)'
                }}
              >
                <Mail style={{ width: '1.25rem', height: '1.25rem', color: '#22c55e' }} />
                <span style={{ color: isDarkMode ? '#86efac' : '#16a34a', fontWeight: '500' }}>{selectedDonor.email}</span>
              </motion.a>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                borderRadius: '12px',
                background: isDarkMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.05)',
                border: isDarkMode ? '1px solid rgba(168, 85, 247, 0.2)' : '1px solid rgba(168, 85, 247, 0.1)',
                cursor: creatingChat ? 'wait' : 'pointer',
                width: '100%',
                transition: 'all 0.2s',
                opacity: creatingChat ? 0.7 : 1
              }}
              onClick={() => handleStartChat(selectedDonor)}
              disabled={creatingChat}
            >
              <MessageCircle style={{ width: '1.25rem', height: '1.25rem', color: '#a855f7' }} />
              <span style={{ color: isDarkMode ? '#e9d5ff' : '#9333ea', fontWeight: '500' }}>
                {creatingChat ? 'Creating chat...' : 'Send Message'}
              </span>
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setSelectedDonor(null)}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: isDarkMode ? 'rgba(51, 65, 85, 0.8)' : 'rgba(243, 244, 246, 0.8)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s',
              color: isDarkMode ? '#cbd5e1' : '#374151'
            }}
          >
            Close
          </motion.button>
        </motion.div>
      </motion.div>
    );
  };

  const DonorCardSkeleton = () => (
    <div style={{
      padding: '1.5rem',
      background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(12px)',
      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
        <div style={{
          height: '1.5rem',
          background: isDarkMode ? '#334155' : '#e5e7eb',
          borderRadius: '0.25rem',
          width: '75%',
          marginBottom: '1rem'
        }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ height: '1rem', background: isDarkMode ? '#334155' : '#e5e7eb', borderRadius: '0.25rem', width: '50%' }}></div>
          <div style={{ height: '1rem', background: isDarkMode ? '#334155' : '#e5e7eb', borderRadius: '0.25rem', width: '66%' }}></div>
          <div style={{ height: '1rem', background: isDarkMode ? '#334155' : '#e5e7eb', borderRadius: '0.25rem', width: '33%' }}></div>
        </div>
        <div style={{ height: '2.5rem', background: isDarkMode ? '#334155' : '#e5e7eb', borderRadius: '0.25rem', marginTop: '1rem' }}></div>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: isDarkMode
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
        : 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)',
      paddingTop: '2rem',
      paddingBottom: '2rem'
    }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: '2rem' }}
        >
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1rem'
          }}>
            Find Blood Donors
          </h1>
          <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', maxWidth: '42rem', margin: '0 auto' }}>
            Search for verified donors near you. Connect with life-savers in your area.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderLeft: '4px solid #3b82f6',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div style={{ fontSize: '1.5rem' }}>ℹ️</div>
            <div>
              <strong style={{ color: isDarkMode ? '#f1f5f9' : '#111827' }}>Important Note:</strong>
              <p style={{ color: isDarkMode ? '#94a3b8' : '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                Search results only show donors who are eligible to donate. Donors who have donated within the last 90 days
                are automatically excluded for their health and safety.
              </p>
            </div>
          </div>
        </motion.div>

        <AnimatedCard delay={0.2}>
          <form onSubmit={handleSearch} style={{
            padding: '1.5rem',
            marginBottom: '2rem',
            background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: isDarkMode ? '#e2e8f0' : '#374151'
                }}>
                  <Droplet style={{ display: 'inline', width: '1rem', height: '1rem', marginRight: '0.25rem' }} />
                  Blood Type Required
                </label>
                <select
                  value={searchParams.bloodType}
                  onChange={(e) => setSearchParams({ ...searchParams, bloodType: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    borderRadius: '12px',
                    border: isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                    outline: 'none',
                    transition: 'all 0.2s',
                    background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = isDarkMode ? '#334155' : '#e5e7eb'}
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: isDarkMode ? '#e2e8f0' : '#374151'
                }}>
                  <MapPin style={{ display: 'inline', width: '1rem', height: '1rem', marginRight: '0.25rem' }} />
                  Search Radius (km)
                </label>
                <input
                  type="number"
                  value={searchParams.radius}
                  onChange={(e) => setSearchParams({ ...searchParams, radius: e.target.value })}
                  min="1"
                  max="200"
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    borderRadius: '12px',
                    border: isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                    outline: 'none',
                    transition: 'all 0.2s',
                    background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    color: isDarkMode ? '#f1f5f9' : '#111827'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = isDarkMode ? '#334155' : '#e5e7eb'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: isDarkMode ? '#e2e8f0' : '#374151'
                }}>
                  Urgency Level
                </label>
                <select
                  value={searchParams.urgency}
                  onChange={(e) => setSearchParams({ ...searchParams, urgency: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    borderRadius: '12px',
                    border: isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                    outline: 'none',
                    transition: 'all 0.2s',
                    background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = isDarkMode ? '#334155' : '#e5e7eb'}
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setSearchMode('location')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '12px',
                    border: searchMode === 'location' ? 'none' : isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    background: searchMode === 'location'
                      ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
                      : isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    color: searchMode === 'location' ? '#ffffff' : isDarkMode ? '#f1f5f9' : '#111827'
                  }}
                >
                  <Navigation style={{ display: 'inline', width: '1rem', height: '1rem', marginRight: '0.25rem' }} />
                  Auto Location
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode('coordinates')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '12px',
                    border: searchMode === 'coordinates' ? 'none' : isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    background: searchMode === 'coordinates'
                      ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
                      : isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    color: searchMode === 'coordinates' ? '#ffffff' : isDarkMode ? '#f1f5f9' : '#111827'
                  }}
                >
                  <MapPin style={{ display: 'inline', width: '1rem', height: '1rem', marginRight: '0.25rem' }} />
                  Manual Coordinates
                </button>
              </div>

              {searchMode === 'location' && (
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="glass-button"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: gettingLocation ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    opacity: gettingLocation ? 0.5 : 1,
                    color: '#ffffff',
                    fontWeight: '600'
                  }}
                >
                  <Navigation style={{ width: '1.25rem', height: '1.25rem' }} />
                  {gettingLocation ? 'Getting Location...' : 'Use My Current Location'}
                </button>
              )}

              {searchMode === 'coordinates' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                      color: isDarkMode ? '#e2e8f0' : '#374151'
                    }}>
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={searchParams.latitude}
                      onChange={(e) => setSearchParams({ ...searchParams, latitude: e.target.value })}
                      placeholder="23.8103"
                      required
                      style={{
                        width: '100%',
                        padding: '0.5rem 1rem',
                        borderRadius: '12px',
                        border: isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                        outline: 'none',
                        transition: 'all 0.2s',
                        background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                        color: isDarkMode ? '#f1f5f9' : '#111827'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                      onBlur={(e) => e.target.style.borderColor = isDarkMode ? '#334155' : '#e5e7eb'}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                      color: isDarkMode ? '#e2e8f0' : '#374151'
                    }}>
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={searchParams.longitude}
                      onChange={(e) => setSearchParams({ ...searchParams, longitude: e.target.value })}
                      placeholder="90.4125"
                      required
                      style={{
                        width: '100%',
                        padding: '0.5rem 1rem',
                        borderRadius: '12px',
                        border: isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                        outline: 'none',
                        transition: 'all 0.2s',
                        background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                        color: isDarkMode ? '#f1f5f9' : '#111827'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                      onBlur={(e) => e.target.style.borderColor = isDarkMode ? '#334155' : '#e5e7eb'}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !searchParams.latitude || !searchParams.longitude}
              className="glass-button"
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: (loading || !searchParams.latitude || !searchParams.longitude) ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: (loading || !searchParams.latitude || !searchParams.longitude) ? 0.5 : 1,
                color: '#ffffff'
              }}
            >
              <Search style={{ width: '1.25rem', height: '1.25rem' }} />
              {loading ? 'Searching...' : 'Search Donors'}
            </button>
          </form>
        </AnimatedCard>

        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}
          >
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: isDarkMode ? '#f1f5f9' : '#111827',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Users style={{ width: '1.5rem', height: '1.5rem', color: '#dc2626' }} />
              Search Results ({donors.length})
            </h2>

            {/* View Mode Toggle */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setViewMode('list')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '12px',
                  border: viewMode === 'list' ? 'none' : isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  background: viewMode === 'list'
                    ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
                    : isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                  color: viewMode === 'list' ? '#ffffff' : isDarkMode ? '#f1f5f9' : '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <List style={{ width: '1rem', height: '1rem' }} />
                List View
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setViewMode('map')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '12px',
                  border: viewMode === 'map' ? 'none' : isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  background: viewMode === 'map'
                    ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
                    : isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                  color: viewMode === 'map' ? '#ffffff' : isDarkMode ? '#f1f5f9' : '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Map style={{ width: '1rem', height: '1rem' }} />
                Map View
              </motion.button>
            </div>
          </motion.div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <DonorCardSkeleton key={i} />
              ))}
            </div>
          ) : donors.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                padding: '3rem',
                textAlign: 'center',
                background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: isDarkMode ? '#f1f5f9' : '#111827',
                marginBottom: '0.5rem'
              }}>
                No Donors Found
              </h3>
              <p style={{ color: isDarkMode ? '#94a3b8' : '#6b7280' }}>
                Try adjusting your search parameters or expanding the search radius.
              </p>
            </motion.div>
          ) : viewMode === 'map' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '1rem',
                background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
              }}
            >
              <LeafletMap
                donors={donors.map(donor => ({
                  id: donor._id,
                  name: donor.name,
                  bloodType: donor.bloodType,
                  isAvailable: donor.isAvailable,
                  totalDonations: donor.totalDonations || 0,
                  distance: donor.location?.coordinates
                    ? calculateDistance(donor.location.coordinates[1], donor.location.coordinates[0])
                    : 0,
                  location: {
                    lat: donor.location?.coordinates[1] || 0,
                    lng: donor.location?.coordinates[0] || 0
                  },
                  address: donor.address
                }))}
                center={searchParams.latitude && searchParams.longitude
                  ? [parseFloat(searchParams.latitude), parseFloat(searchParams.longitude)]
                  : [23.8103, 90.4125]}
                zoom={12}
                radius={parseInt(searchParams.radius) || 50}
                showRadius={true}
                height="600px"
              />
            </motion.div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {donors.map((donor, index) => {
                const distance = donor.location?.coordinates
                  ? calculateDistance(donor.location.coordinates[1], donor.location.coordinates[0])
                  : null;

                return (
                  <motion.div
                    key={donor._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.01, y: -5 }}
                    style={{
                      padding: '1.5rem',
                      background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(12px)',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '16px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <div style={{ marginBottom: '1rem' }}>
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        color: isDarkMode ? '#f1f5f9' : '#111827',
                        marginBottom: '0.5rem'
                      }}>
                        {donor.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          background: 'rgba(220, 38, 38, 0.1)',
                          color: '#dc2626',
                          borderRadius: '9999px',
                          fontSize: '0.875rem',
                          fontWeight: '600'
                        }}>
                          {donor.bloodType}
                        </span>
                        {distance && (
                          <span style={{
                            fontSize: '0.875rem',
                            color: isDarkMode ? '#94a3b8' : '#6b7280',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <MapPin style={{ width: '0.75rem', height: '0.75rem' }} />
                            {distance} km
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                      <p style={{
                        fontSize: '0.875rem',
                        color: isDarkMode ? '#94a3b8' : '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <MapPin style={{ width: '1rem', height: '1rem', color: isDarkMode ? '#64748b' : '#9ca3af' }} />
                        <strong>Location:</strong> {donor.address?.city || 'N/A'}
                      </p>
                      <p style={{
                        fontSize: '0.875rem',
                        color: isDarkMode ? '#94a3b8' : '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <Droplet style={{ width: '1rem', height: '1rem', color: isDarkMode ? '#64748b' : '#9ca3af' }} />
                        <strong>Donations:</strong> {donor.totalDonations || 0}
                      </p>
                      {donor.badge && (
                        <p style={{
                          fontSize: '0.875rem',
                          color: isDarkMode ? '#94a3b8' : '#6b7280',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <Award style={{ width: '1rem', height: '1rem', color: isDarkMode ? '#64748b' : '#9ca3af' }} />
                          <strong>Badge:</strong>
                          <span style={{
                            padding: '0.125rem 0.5rem',
                            background: 'rgba(234, 179, 8, 0.1)',
                            color: '#eab308',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem'
                          }}>
                            {donor.badge}
                          </span>
                        </p>
                      )}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleContactDonor(donor)}
                      className="glass-button"
                      style={{
                        width: '100%',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        color: '#ffffff'
                      }}
                    >
                      <Phone style={{ width: '1rem', height: '1rem' }} />
                      Contact Donor
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedDonor && <ContactModal />}
      </AnimatePresence>
    </div>
  );
};

export default DonorSearch;
