import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useDarkMode } from '../context/DarkModeContext';
import { authAPI } from '../services/api';
import {
  User, Phone, MapPin, Navigation, Settings, Users,
  Activity, Save, X, Home, Map, Globe
} from 'lucide-react';

const EditProfile = () => {
  const { user, updateUser } = useAuth();
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    location: {
      type: 'Point',
      coordinates: [0, 0]
    },
    availabilityRadius: 50,
    isAvailable: true,
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    }
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipCode: user.address?.zipCode || '',
          country: user.address?.country || ''
        },
        location: user.location || {
          type: 'Point',
          coordinates: [0, 0]
        },
        availabilityRadius: user.availabilityRadius || 50,
        isAvailable: user.isAvailable !== undefined ? user.isAvailable : true,
        emergencyContact: {
          name: user.emergencyContact?.name || '',
          relationship: user.emergencyContact?.relationship || '',
          phone: user.emergencyContact?.phone || ''
        }
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    const index = name === 'longitude' ? 0 : 1;
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        coordinates: [
          index === 0 ? parseFloat(value) : prev.location.coordinates[0],
          index === 1 ? parseFloat(value) : prev.location.coordinates[1]
        ]
      }
    }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      toast.loading('Getting your location...');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: {
              type: 'Point',
              coordinates: [
                position.coords.longitude,
                position.coords.latitude
              ]
            }
          }));
          toast.dismiss();
          toast.success('Location updated successfully!', {
            icon: '📍',
            duration: 3000,
          });
        },
        (error) => {
          toast.dismiss();
          toast.error('Unable to retrieve your location');
          setError('Unable to retrieve your location');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
      setError('Geolocation is not supported by your browser');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        location: formData.location
      };

      // Add role-specific fields
      if (user.role === 'donor') {
        updateData.availabilityRadius = formData.availabilityRadius;
        updateData.isAvailable = formData.isAvailable;
      }

      if (user.role === 'recipient') {
        updateData.emergencyContact = formData.emergencyContact;
      }

      const updatePromise = authAPI.updateProfile(updateData);

      toast.promise(
        updatePromise,
        {
          loading: 'Updating profile...',
          success: 'Profile updated successfully!',
          error: (err) => `Failed to update profile: ${err.message || 'Unknown error'}`,
        },
        {
          success: {
            icon: '🩸',
            duration: 3000,
          },
        }
      );

      const response = await updatePromise;

      // Update user context
      if (updateUser) {
        updateUser(response.data);
      }

      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: isDarkMode
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
        : 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem'
            }}>
              <span style={{ color: isDarkMode ? '#f1f5f9' : '#111827' }}>Edit </span>
              <span style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>Profile</span>
            </h1>
            <p style={{
              color: isDarkMode ? '#cbd5e1' : '#6b7280',
              fontSize: '0.875rem'
            }}>
              Update your personal information and settings
            </p>
          </div>
        </motion.div>

        {/* Error/Success Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              fontSize: '0.875rem'
            }}
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: '#dcfce7',
              border: '1px solid #bbf7d0',
              color: '#166534',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              fontSize: '0.875rem'
            }}
          >
            {success}
          </motion.div>
        )}

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          style={{
            padding: '2rem',
            background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Basic Information */}
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: isDarkMode ? '#f1f5f9' : '#111827',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <User style={{ width: '20px', height: '20px', color: '#dc2626' }} />
            Basic Information
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: isDarkMode ? '#e2e8f0' : '#374151',
                marginBottom: '0.5rem'
              }}>
                Full Name *
              </label>
              <div style={{ position: 'relative' }}>
                <User style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '18px',
                  height: '18px',
                  color: '#9ca3af'
                }} />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    height: '45px',
                    paddingLeft: '2.75rem',
                    paddingRight: '1rem',
                    border: isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    outline: 'none',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = isDarkMode ? '#334155' : '#e5e7eb'}
                />
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: isDarkMode ? '#e2e8f0' : '#374151',
                marginBottom: '0.5rem'
              }}>
                Phone Number *
              </label>
              <div style={{ position: 'relative' }}>
                <Phone style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '18px',
                  height: '18px',
                  color: '#9ca3af'
                }} />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    height: '45px',
                    paddingLeft: '2.75rem',
                    paddingRight: '1rem',
                    border: isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    outline: 'none',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = isDarkMode ? '#334155' : '#e5e7eb'}
                />
              </div>
            </div>
          </div>

          {/* Address Section */}
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: isDarkMode ? '#f1f5f9' : '#111827',
            marginBottom: '1.5rem',
            marginTop: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Home style={{ width: '20px', height: '20px', color: '#dc2626' }} />
            Address
          </h3>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: isDarkMode ? '#e2e8f0' : '#374151',
              marginBottom: '0.5rem'
            }}>
              Street Address
            </label>
            <input
              type="text"
              id="address.street"
              name="address.street"
              value={formData.address.street}
              onChange={handleChange}
              placeholder="Enter street address"
              style={{
                width: '100%',
                height: '45px',
                paddingLeft: '1rem',
                paddingRight: '1rem',
                border: isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '0.875rem',
                background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                color: isDarkMode ? '#f1f5f9' : '#111827',
                outline: 'none'
              }}
            />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: isDarkMode ? '#e2e8f0' : '#374151',
                marginBottom: '0.5rem'
              }}>
                City *
              </label>
              <input
                type="text"
                id="address.city"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                required
                placeholder="Enter city"
                style={{
                  width: '100%',
                  height: '45px',
                  paddingLeft: '1rem',
                  paddingRight: '1rem',
                  border: isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: isDarkMode ? '#e2e8f0' : '#374151',
                marginBottom: '0.5rem'
              }}>
                State/Province
              </label>
              <input
                type="text"
                id="address.state"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
                placeholder="Enter state"
                style={{
                  width: '100%',
                  height: '45px',
                  paddingLeft: '1rem',
                  paddingRight: '1rem',
                  border: isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: isDarkMode ? '#e2e8f0' : '#374151',
                marginBottom: '0.5rem'
              }}>
                ZIP/Postal Code
              </label>
              <input
                type="text"
                id="address.zipCode"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleChange}
                placeholder="Enter ZIP code"
                style={{
                  width: '100%',
                  height: '45px',
                  paddingLeft: '1rem',
                  paddingRight: '1rem',
                  border: isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: isDarkMode ? '#e2e8f0' : '#374151',
                marginBottom: '0.5rem'
              }}>
                Country
              </label>
              <div style={{ position: 'relative' }}>
                <Globe style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '18px',
                  height: '18px',
                  color: '#9ca3af'
                }} />
                <input
                  type="text"
                  id="address.country"
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleChange}
                  placeholder="Enter country"
                  style={{
                    width: '100%',
                    height: '45px',
                    paddingLeft: '2.75rem',
                    paddingRight: '1rem',
                    border: isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Location Coordinates */}
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: isDarkMode ? '#f1f5f9' : '#111827',
            marginBottom: '0.5rem',
            marginTop: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Map style={{ width: '20px', height: '20px', color: '#dc2626' }} />
            Location Coordinates
          </h3>
          <p style={{
            color: isDarkMode ? '#94a3b8' : '#6b7280',
            fontSize: '0.875rem',
            marginBottom: '1rem'
          }}>
            Used for finding nearby donors/recipients
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginBottom: '1rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: isDarkMode ? '#e2e8f0' : '#374151',
                marginBottom: '0.5rem'
              }}>
                Longitude
              </label>
              <input
                type="number"
                step="any"
                id="longitude"
                name="longitude"
                value={formData.location.coordinates[0]}
                onChange={handleLocationChange}
                style={{
                  width: '100%',
                  height: '45px',
                  paddingLeft: '1rem',
                  paddingRight: '1rem',
                  border: isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: isDarkMode ? '#e2e8f0' : '#374151',
                marginBottom: '0.5rem'
              }}>
                Latitude
              </label>
              <input
                type="number"
                step="any"
                id="latitude"
                name="latitude"
                value={formData.location.coordinates[1]}
                onChange={handleLocationChange}
                style={{
                  width: '100%',
                  height: '45px',
                  paddingLeft: '1rem',
                  paddingRight: '1rem',
                  border: isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <motion.button
            type="button"
            onClick={getCurrentLocation}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: '0.75rem 1.5rem',
              background: isDarkMode ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.05)',
              border: `2px solid ${isDarkMode ? 'rgba(220, 38, 38, 0.3)' : 'rgba(220, 38, 38, 0.2)'}`,
              borderRadius: '12px',
              color: '#dc2626',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '2rem'
            }}
          >
            <Navigation style={{ width: '18px', height: '18px' }} />
            Use My Current Location
          </motion.button>

          {/* Donor Settings */}
          {user?.role === 'donor' && (
            <>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: isDarkMode ? '#f1f5f9' : '#111827',
                marginBottom: '1.5rem',
                marginTop: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Settings style={{ width: '20px', height: '20px', color: '#dc2626' }} />
                Donor Settings
              </h3>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#e2e8f0' : '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Availability Radius (km)
                </label>
                <input
                  type="number"
                  id="availabilityRadius"
                  name="availabilityRadius"
                  min="1"
                  max="200"
                  value={formData.availabilityRadius}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    height: '45px',
                    paddingLeft: '1rem',
                    paddingRight: '1rem',
                    border: isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    outline: 'none'
                  }}
                />
                <small style={{
                  display: 'block',
                  marginTop: '0.5rem',
                  color: isDarkMode ? '#94a3b8' : '#6b7280',
                  fontSize: '0.8125rem'
                }}>
                  How far you're willing to travel to donate (1-200 km)
                </small>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(254, 242, 242, 0.6)',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(220, 38, 38, 0.1)',
                borderRadius: '12px',
                marginBottom: '2rem'
              }}>
                <input
                  type="checkbox"
                  id="isAvailable"
                  name="isAvailable"
                  checked={formData.isAvailable}
                  onChange={handleChange}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer'
                  }}
                />
                <label htmlFor="isAvailable" style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Activity style={{ width: '18px', height: '18px', color: '#dc2626' }} />
                  I am currently available to donate
                </label>
              </div>
            </>
          )}

          {/* Emergency Contact */}
          {user?.role === 'recipient' && (
            <>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: isDarkMode ? '#f1f5f9' : '#111827',
                marginBottom: '1.5rem',
                marginTop: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Users style={{ width: '20px', height: '20px', color: '#dc2626' }} />
                Emergency Contact
              </h3>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#e2e8f0' : '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Contact Name *
                </label>
                <input
                  type="text"
                  id="emergencyContact.name"
                  name="emergencyContact.name"
                  value={formData.emergencyContact.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter contact name"
                  style={{
                    width: '100%',
                    height: '45px',
                    paddingLeft: '1rem',
                    paddingRight: '1rem',
                    border: isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#e2e8f0' : '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Relationship *
                  </label>
                  <input
                    type="text"
                    id="emergencyContact.relationship"
                    name="emergencyContact.relationship"
                    value={formData.emergencyContact.relationship}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Spouse, Parent"
                    style={{
                      width: '100%',
                      height: '45px',
                      paddingLeft: '1rem',
                      paddingRight: '1rem',
                      border: isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#e2e8f0' : '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="emergencyContact.phone"
                    name="emergencyContact.phone"
                    value={formData.emergencyContact.phone}
                    onChange={handleChange}
                    required
                    placeholder="Enter phone number"
                    style={{
                      width: '100%',
                      height: '45px',
                      paddingLeft: '1rem',
                      paddingRight: '1rem',
                      border: isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '2rem',
            flexWrap: 'wrap'
          }}>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              style={{
                flex: 1,
                minWidth: '200px',
                height: '50px',
                background: loading
                  ? isDarkMode ? 'rgba(156, 163, 175, 0.2)' : 'rgba(156, 163, 175, 0.2)'
                  : 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(220, 38, 38, 0.3)',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Updating...
                </>
              ) : (
                <>
                  <Save style={{ width: '20px', height: '20px' }} />
                  Update Profile
                </>
              )}
            </motion.button>

            <motion.button
              type="button"
              onClick={() => navigate('/profile')}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              style={{
                flex: 1,
                minWidth: '200px',
                height: '50px',
                background: isDarkMode ? 'rgba(156, 163, 175, 0.2)' : 'rgba(156, 163, 175, 0.1)',
                color: isDarkMode ? '#f1f5f9' : '#111827',
                border: isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: loading ? 0.5 : 1
              }}
            >
              <X style={{ width: '20px', height: '20px' }} />
              Cancel
            </motion.button>
          </div>
        </motion.form>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default EditProfile;
