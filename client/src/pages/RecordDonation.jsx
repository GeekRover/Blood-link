import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { donationAPI, requestAPI } from '../services/api';
import { useDarkMode } from '../context/DarkModeContext';
import { useAuth } from '../hooks/useAuth';
import { Heart, Calendar, MapPin, Droplet, Plus, CheckCircle, Upload, X } from 'lucide-react';
import LiquidBackground from '../components/LiquidBackground';

const RecordDonation = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    bloodRequest: '',
    bloodType: '',
    unitsProvided: 1,
    donationDate: new Date().toISOString().split('T')[0],
    donationCenter: {
      name: '',
      address: '',
      city: ''
    },
    healthCheckBefore: {
      bloodPressure: '',
      hemoglobin: '',
      weight: '',
      temperature: '',
      pulse: ''
    },
    healthCheckAfter: {
      bloodPressure: '',
      pulse: '',
      notes: ''
    },
    notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchAcceptedRequests();
    }
  }, [user]);

  const fetchAcceptedRequests = async () => {
    try {
      setLoadingRequests(true);
      const data = await requestAPI.getDonorMatched();

      // Filter for accepted requests - where the donor has accepted the match
      const accepted = data.data?.filter(req => {
        const myMatch = req.matchedDonors?.find(m => {
          // Check if this match belongs to current user and was accepted
          const donorId = m.donor?._id || m.donor;
          const userId = user?._id || user;
          return donorId === userId && m.response === 'accepted';
        });
        return myMatch;
      }) || [];

      setAcceptedRequests(accepted);
    } catch (error) {
      console.error('Failed to fetch accepted requests:', error);
      toast.error('Failed to load your accepted requests', { icon: '❌' });
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file', { icon: '⚠️' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB', { icon: '⚠️' });
      return;
    }

    setImageFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('healthCheckBefore')) {
      const field = name.split('_')[1];
      setFormData(prev => ({
        ...prev,
        healthCheckBefore: {
          ...prev.healthCheckBefore,
          [field]: value
        }
      }));
    } else if (name.includes('healthCheckAfter')) {
      const field = name.split('_')[1];
      setFormData(prev => ({
        ...prev,
        healthCheckAfter: {
          ...prev.healthCheckAfter,
          [field]: value
        }
      }));
    } else if (name.includes('donationCenter')) {
      const field = name.split('_')[1];
      setFormData(prev => ({
        ...prev,
        donationCenter: {
          ...prev.donationCenter,
          [field]: value
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
    if (!formData.bloodRequest) {
      toast.error('Please select a blood request', { icon: '⚠️' });
      return false;
    }
    if (!formData.bloodType) {
      toast.error('Blood type is required', { icon: '⚠️' });
      return false;
    }
    if (formData.unitsProvided < 1 || formData.unitsProvided > 10) {
      toast.error('Units must be between 1 and 10', { icon: '⚠️' });
      return false;
    }
    if (!formData.donationDate) {
      toast.error('Donation date is required', { icon: '⚠️' });
      return false;
    }
    if (!formData.donationCenter.name.trim()) {
      toast.error('Donation center name is required', { icon: '⚠️' });
      return false;
    }
    if (!formData.healthCheckBefore.bloodPressure.trim()) {
      toast.error('Pre-donation blood pressure is required', { icon: '⚠️' });
      return false;
    }
    if (!formData.healthCheckBefore.hemoglobin.trim()) {
      toast.error('Pre-donation hemoglobin is required', { icon: '⚠️' });
      return false;
    }
    if (!formData.healthCheckAfter.bloodPressure.trim()) {
      toast.error('Post-donation blood pressure is required', { icon: '⚠️' });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!imageFile) {
      toast.error('Please upload a medical record/donation proof image', { icon: '⚠️' });
      return;
    }

    setLoading(true);
    try {
      // Create FormData to send file + data
      const submissionData = new FormData();

      // Add all form fields
      submissionData.append('bloodRequest', formData.bloodRequest);
      submissionData.append('bloodType', formData.bloodType);
      submissionData.append('unitsProvided', formData.unitsProvided);
      submissionData.append('donationDate', formData.donationDate);
      submissionData.append('donationCenter', JSON.stringify(formData.donationCenter));
      submissionData.append('healthCheckBefore', JSON.stringify(formData.healthCheckBefore));
      submissionData.append('healthCheckAfter', JSON.stringify(formData.healthCheckAfter));
      submissionData.append('notes', formData.notes);

      // Add image file
      submissionData.append('verificationDocument', imageFile);

      const submitPromise = donationAPI.record(submissionData);

      toast.promise(
        submitPromise,
        {
          loading: 'Recording your donation...',
          success: 'Donation recorded successfully! Admin will verify it soon.',
          error: (err) => `Failed to record donation: ${err.message || 'Unknown error'}`
        },
        {
          success: { icon: '✅', duration: 4000 },
          error: { icon: '❌', duration: 4000 }
        }
      );

      await submitPromise;

      // Reset form and redirect
      setImageFile(null);
      setImagePreview(null);
      setFormData({
        bloodRequest: '',
        bloodType: '',
        unitsProvided: 1,
        donationDate: new Date().toISOString().split('T')[0],
        donationCenter: {
          name: '',
          address: '',
          city: ''
        },
        healthCheckBefore: {
          bloodPressure: '',
          hemoglobin: '',
          weight: '',
          temperature: '',
          pulse: ''
        },
        healthCheckAfter: {
          bloodPressure: '',
          pulse: '',
          notes: ''
        },
        notes: ''
      });

      setTimeout(() => {
        navigate('/donations');
      }, 1500);
    } catch (error) {
      console.error('Failed to record donation:', error);
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

  if (loadingRequests) {
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
            Loading your requests...
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

      <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            color: isDarkMode ? '#f1f5f9' : '#111827'
          }}>
            <Heart style={{ width: '40px', height: '40px', color: '#dc2626' }} />
            <span>Record Your </span>
            <span style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Blood Donation
            </span>
          </h1>
          <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', fontSize: '0.875rem' }}>
            Submit your donation details after completing your blood donation
          </p>
        </div>

        {/* Main Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            padding: '2rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
        >
          {acceptedRequests.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem'
            }}>
              <Heart style={{
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
                No Accepted Requests
              </h3>
              <p style={{
                color: isDarkMode ? '#cbd5e1' : '#6b7280',
                fontSize: '0.875rem',
                marginBottom: '1.5rem'
              }}>
                Accept a blood request first from "Matched Requests" to record your donation.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/matched-requests')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                View Matched Requests
              </motion.button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Left Column - Request Selection */}
              <div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  marginBottom: '1rem'
                }}>
                  Select Request *
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {acceptedRequests.map(req => (
                    <motion.button
                      key={req._id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedRequest(req);
                        setFormData(prev => ({
                          ...prev,
                          bloodRequest: req._id,
                          bloodType: req.bloodType || ''
                        }));
                      }}
                      style={{
                        padding: '1rem',
                        background: formData.bloodRequest === req._id
                          ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
                          : isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '8px',
                        color: formData.bloodRequest === req._id ? 'white' : isDarkMode ? '#f1f5f9' : '#111827',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Droplet style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                            {req.patientName || 'Patient'}
                          </p>
                          <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                            {req.bloodType} • {req.unitsRequired} units • {req.urgency}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Right Column - Form */}
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* Units Provided */}
                  <div>
                    <label style={labelStyle}>Units Provided * (1-10)</label>
                    <input
                      type="number"
                      name="unitsProvided"
                      value={formData.unitsProvided}
                      onChange={handleChange}
                      min="1"
                      max="10"
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

                  {/* Donation Date */}
                  <div>
                    <label style={labelStyle}>Donation Date *</label>
                    <input
                      type="date"
                      name="donationDate"
                      value={formData.donationDate}
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

                  {/* Donation Center Name */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Donation Center Name *</label>
                    <input
                      type="text"
                      name="donationCenter_name"
                      value={formData.donationCenter.name}
                      onChange={handleChange}
                      placeholder="e.g., Red Cross Blood Bank"
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

                  {/* Donation Center Address */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Address</label>
                    <input
                      type="text"
                      name="donationCenter_address"
                      value={formData.donationCenter.address}
                      onChange={handleChange}
                      placeholder="Street address"
                      maxLength="200"
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

                  {/* Donation Center City */}
                  <div>
                    <label style={labelStyle}>City</label>
                    <input
                      type="text"
                      name="donationCenter_city"
                      value={formData.donationCenter.city}
                      onChange={handleChange}
                      placeholder="City"
                      maxLength="50"
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
              </div>
            </div>
          )}

          {acceptedRequests.length > 0 && (
            <>
              {/* Pre-Donation Health Checks */}
              <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)' }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  marginBottom: '1rem'
                }}>
                  Pre-Donation Health Check *
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Blood Pressure (e.g., 120/80)</label>
                    <input
                      type="text"
                      name="healthCheckBefore_bloodPressure"
                      value={formData.healthCheckBefore.bloodPressure}
                      onChange={handleChange}
                      placeholder="120/80 mmHg"
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
                  <div>
                    <label style={labelStyle}>Hemoglobin (g/dL)</label>
                    <input
                      type="number"
                      name="healthCheckBefore_hemoglobin"
                      value={formData.healthCheckBefore.hemoglobin}
                      onChange={handleChange}
                      placeholder="12.5"
                      step="0.1"
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
                  <div>
                    <label style={labelStyle}>Weight (kg)</label>
                    <input
                      type="number"
                      name="healthCheckBefore_weight"
                      value={formData.healthCheckBefore.weight}
                      onChange={handleChange}
                      placeholder="70"
                      step="0.5"
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
                  <div>
                    <label style={labelStyle}>Temperature (°C)</label>
                    <input
                      type="number"
                      name="healthCheckBefore_temperature"
                      value={formData.healthCheckBefore.temperature}
                      onChange={handleChange}
                      placeholder="37"
                      step="0.1"
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
                  <div>
                    <label style={labelStyle}>Pulse (bpm)</label>
                    <input
                      type="number"
                      name="healthCheckBefore_pulse"
                      value={formData.healthCheckBefore.pulse}
                      onChange={handleChange}
                      placeholder="72"
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
              </div>

              {/* Post-Donation Health Checks */}
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  marginBottom: '1rem'
                }}>
                  Post-Donation Health Check *
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Blood Pressure (e.g., 120/80)</label>
                    <input
                      type="text"
                      name="healthCheckAfter_bloodPressure"
                      value={formData.healthCheckAfter.bloodPressure}
                      onChange={handleChange}
                      placeholder="120/80 mmHg"
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
                  <div>
                    <label style={labelStyle}>Pulse (bpm)</label>
                    <input
                      type="number"
                      name="healthCheckAfter_pulse"
                      value={formData.healthCheckAfter.pulse}
                      onChange={handleChange}
                      placeholder="72"
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
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Notes (any complications, side effects, etc.)</label>
                    <textarea
                      name="healthCheckAfter_notes"
                      value={formData.healthCheckAfter.notes}
                      onChange={handleChange}
                      placeholder="Any complications or notes after donation?"
                      maxLength="500"
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
                </div>
              </div>

              {/* Medical Record/Donation Proof Image Upload */}
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  marginBottom: '1rem'
                }}>
                  Medical Record / Donation Proof * (Required)
                </h3>

                {!imagePreview ? (
                  <label style={{
                    display: 'block',
                    padding: '2rem',
                    background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                    border: `2px dashed ${isDarkMode ? 'rgba(220, 38, 38, 0.3)' : 'rgba(220, 38, 38, 0.2)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    ':hover': {
                      borderColor: '#dc2626'
                    }
                  }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                    <Upload style={{
                      width: '32px',
                      height: '32px',
                      color: '#dc2626',
                      margin: '0 auto 0.75rem'
                    }} />
                    <p style={{
                      color: isDarkMode ? '#e2e8f0' : '#374151',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      marginBottom: '0.25rem'
                    }}>
                      Click to upload medical record/donation proof
                    </p>
                    <p style={{
                      color: isDarkMode ? '#94a3b8' : '#9ca3af',
                      fontSize: '0.75rem'
                    }}>
                      PNG, JPG, GIF (Max 5MB)
                    </p>
                  </label>
                ) : (
                  <div style={{
                    background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                    border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid rgba(220, 38, 38, 0.2)',
                    borderRadius: '8px',
                    padding: '1rem',
                    position: 'relative'
                  }}>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        width: '100%',
                        maxHeight: '300px',
                        objectFit: 'contain',
                        borderRadius: '6px',
                        marginBottom: '0.75rem'
                      }}
                    />
                    <p style={{
                      color: isDarkMode ? '#cbd5e1' : '#6b7280',
                      fontSize: '0.875rem',
                      marginBottom: '0.75rem',
                      textAlign: 'center'
                    }}>
                      File: {imageFile?.name}
                    </p>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRemoveImage}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        background: 'rgba(220, 38, 38, 0.1)',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      <X style={{ width: '1rem', height: '1rem' }} />
                      Remove Image
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Additional Notes */}
              <div style={{ marginTop: '2rem' }}>
                <label style={labelStyle}>Additional Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional information about your donation"
                  maxLength="500"
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'vertical',
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

              {/* Submit Button */}
              <div style={{
                marginTop: '2rem',
                paddingTop: '2rem',
                borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/dashboard')}
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
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle style={{ width: '1rem', height: '1rem' }} />
                      Record Donation
                    </>
                  )}
                </motion.button>
              </div>
            </>
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

export default RecordDonation;
