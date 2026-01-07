import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { requestAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useDarkMode } from '../context/DarkModeContext';
import {
  Plus, X, User, Droplet, Activity, MapPin, Calendar,
  FileText, AlertCircle, Clock, CheckCircle, Hospital
} from 'lucide-react';

const BloodRequests = () => {
  const { isRecipient } = useAuth();
  const { isDarkMode } = useDarkMode();
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    patientName: '',
    bloodType: 'A+',
    unitsRequired: 1,
    urgency: 'normal',
    hospitalName: '',
    hospitalAddress: '',
    hospitalPhone: '',
    latitude: '23.8103',
    longitude: '90.4125',
    requiredBy: '',
    medicalReason: ''
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await requestAPI.getAll();
      setRequests(data.data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      toast.error('Failed to load blood requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const requestData = {
        patientName: formData.patientName,
        bloodType: formData.bloodType,
        unitsRequired: parseInt(formData.unitsRequired),
        urgency: formData.urgency,
        hospital: {
          name: formData.hospitalName,
          address: formData.hospitalAddress,
          contactNumber: formData.hospitalPhone,
          location: {
            type: 'Point',
            coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)]
          }
        },
        requiredBy: formData.requiredBy,
        medicalReason: formData.medicalReason
      };

      const createPromise = requestAPI.create(requestData);

      toast.promise(
        createPromise,
        {
          loading: 'Creating blood request...',
          success: 'Blood request created successfully!',
          error: 'Failed to create blood request',
        },
        {
          success: {
            icon: '🩸',
            duration: 3000,
          },
        }
      );

      await createPromise;
      setShowForm(false);
      setFormData({
        patientName: '',
        bloodType: 'A+',
        unitsRequired: 1,
        urgency: 'normal',
        hospitalName: '',
        hospitalAddress: '',
        hospitalPhone: '',
        latitude: '23.8103',
        longitude: '90.4125',
        requiredBy: '',
        medicalReason: ''
      });
      fetchRequests();
    } catch (error) {
      console.error('Failed to create request:', error);
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
          <Droplet
            style={{
              width: '48px',
              height: '48px',
              color: '#dc2626',
              marginBottom: '1rem'
            }}
          />
          <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280' }}>
            Loading requests...
          </p>
        </motion.div>
      </div>
    );
  }

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
              <span style={{ color: isDarkMode ? '#f1f5f9' : '#111827' }}>Blood </span>
              <span style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>Requests</span>
            </h1>
            <p style={{
              color: isDarkMode ? '#cbd5e1' : '#6b7280',
              fontSize: '0.875rem'
            }}>
              {isRecipient ? 'Manage and create blood requests' : 'View all active blood requests'}
            </p>
          </div>

          {isRecipient && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowForm(!showForm)}
              style={{
                padding: '0.75rem 1.5rem',
                background: showForm
                  ? isDarkMode ? 'rgba(156, 163, 175, 0.2)' : 'rgba(156, 163, 175, 0.1)'
                  : 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: showForm ? 'none' : '0 4px 12px rgba(220, 38, 38, 0.3)'
              }}
            >
              {showForm ? (
                <>
                  <X style={{ width: '18px', height: '18px' }} />
                  Cancel
                </>
              ) : (
                <>
                  <Plus style={{ width: '18px', height: '18px' }} />
                  Create Request
                </>
              )}
            </motion.button>
          )}
        </motion.div>

        {/* Create Request Form */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSubmit}
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
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: isDarkMode ? '#f1f5f9' : '#111827',
                marginBottom: '1.5rem'
              }}>
                Create Blood Request
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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
                    Patient Name
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
                      value={formData.patientName}
                      onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                      required
                      placeholder="Enter patient name"
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
                    Blood Type
                  </label>
                  <select
                    value={formData.bloodType}
                    onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                    required
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
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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
                    Units Required
                  </label>
                  <input
                    type="number"
                    value={formData.unitsRequired}
                    onChange={(e) => setFormData({ ...formData, unitsRequired: e.target.value })}
                    min="1"
                    max="10"
                    required
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
                    Urgency Level
                  </label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                    required
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
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#e2e8f0' : '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Hospital Name
                </label>
                <div style={{ position: 'relative' }}>
                  <Hospital style={{
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
                    value={formData.hospitalName}
                    onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                    required
                    placeholder="Enter hospital name"
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

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#e2e8f0' : '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Required By
                </label>
                <div style={{ position: 'relative' }}>
                  <Calendar style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '18px',
                    height: '18px',
                    color: '#9ca3af'
                  }} />
                  <input
                    type="datetime-local"
                    value={formData.requiredBy}
                    onChange={(e) => setFormData({ ...formData, requiredBy: e.target.value })}
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
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#e2e8f0' : '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Medical Reason
                </label>
                <textarea
                  value={formData.medicalReason}
                  onChange={(e) => setFormData({ ...formData, medicalReason: e.target.value })}
                  required
                  rows="3"
                  placeholder="Describe the medical reason for blood requirement"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%',
                  height: '50px',
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Plus style={{ width: '20px', height: '20px' }} />
                Create Request
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Requests List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {requests.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '16px'
              }}
            >
              <Droplet style={{
                width: '64px',
                height: '64px',
                color: isDarkMode ? '#475569' : '#cbd5e1',
                margin: '0 auto 1.5rem'
              }} />
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: isDarkMode ? '#f1f5f9' : '#111827',
                marginBottom: '0.5rem'
              }}>
                No blood requests found
              </h3>
              <p style={{
                color: isDarkMode ? '#94a3b8' : '#6b7280',
                fontSize: '0.875rem'
              }}>
                {isRecipient
                  ? 'Create your first blood request to get started'
                  : 'Check back later for active blood requests'}
              </p>
            </motion.div>
          ) : (
            requests.map((request, index) => (
              <motion.div
                key={request._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.01, y: -5 }}
                style={{
                  padding: '1.75rem',
                  background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(12px)',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  borderLeft: `4px solid ${
                    request.urgency === 'critical' ? '#dc2626'
                    : request.urgency === 'urgent' ? '#eab308'
                    : '#22c55e'
                  }`
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'start',
                  justifyContent: 'space-between',
                  marginBottom: '1.25rem',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.5rem'
                    }}>
                      <User style={{ width: '20px', height: '20px', color: '#dc2626' }} />
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: isDarkMode ? '#f1f5f9' : '#111827',
                        margin: 0
                      }}>
                        {request.patientName}
                      </h3>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{
                      padding: '0.5rem 1rem',
                      background: request.urgency === 'critical'
                        ? 'rgba(220, 38, 38, 0.1)'
                        : request.urgency === 'urgent'
                        ? 'rgba(234, 179, 8, 0.1)'
                        : 'rgba(34, 197, 94, 0.1)',
                      color: request.urgency === 'critical'
                        ? '#dc2626'
                        : request.urgency === 'urgent'
                        ? '#eab308'
                        : '#22c55e',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem'
                    }}>
                      <AlertCircle style={{ width: '14px', height: '14px' }} />
                      {request.urgency}
                    </div>

                    <div style={{
                      padding: '0.5rem 1rem',
                      background: request.status === 'fulfilled'
                        ? 'rgba(34, 197, 94, 0.1)'
                        : request.status === 'active'
                        ? 'rgba(59, 130, 246, 0.1)'
                        : 'rgba(156, 163, 175, 0.1)',
                      color: request.status === 'fulfilled'
                        ? '#22c55e'
                        : request.status === 'active'
                        ? '#3b82f6'
                        : '#9ca3af',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem'
                    }}>
                      {request.status === 'fulfilled' ? (
                        <CheckCircle style={{ width: '14px', height: '14px' }} />
                      ) : (
                        <Clock style={{ width: '14px', height: '14px' }} />
                      )}
                      {request.status}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      padding: '0.5rem',
                      background: 'rgba(220, 38, 38, 0.1)',
                      borderRadius: '8px'
                    }}>
                      <Droplet style={{ width: '16px', height: '16px', color: '#dc2626' }} />
                    </div>
                    <div>
                      <p style={{
                        fontSize: '0.75rem',
                        color: isDarkMode ? '#94a3b8' : '#9ca3af',
                        margin: 0
                      }}>
                        Blood Type
                      </p>
                      <p style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: isDarkMode ? '#f1f5f9' : '#111827',
                        margin: 0
                      }}>
                        {request.bloodType}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      padding: '0.5rem',
                      background: 'rgba(220, 38, 38, 0.1)',
                      borderRadius: '8px'
                    }}>
                      <Activity style={{ width: '16px', height: '16px', color: '#dc2626' }} />
                    </div>
                    <div>
                      <p style={{
                        fontSize: '0.75rem',
                        color: isDarkMode ? '#94a3b8' : '#9ca3af',
                        margin: 0
                      }}>
                        Units Required
                      </p>
                      <p style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: isDarkMode ? '#f1f5f9' : '#111827',
                        margin: 0
                      }}>
                        {request.unitsRequired}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      padding: '0.5rem',
                      background: 'rgba(220, 38, 38, 0.1)',
                      borderRadius: '8px'
                    }}>
                      <MapPin style={{ width: '16px', height: '16px', color: '#dc2626' }} />
                    </div>
                    <div>
                      <p style={{
                        fontSize: '0.75rem',
                        color: isDarkMode ? '#94a3b8' : '#9ca3af',
                        margin: 0
                      }}>
                        Hospital
                      </p>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: isDarkMode ? '#f1f5f9' : '#111827',
                        margin: 0
                      }}>
                        {request.hospital?.name || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      padding: '0.5rem',
                      background: 'rgba(220, 38, 38, 0.1)',
                      borderRadius: '8px'
                    }}>
                      <Calendar style={{ width: '16px', height: '16px', color: '#dc2626' }} />
                    </div>
                    <div>
                      <p style={{
                        fontSize: '0.75rem',
                        color: isDarkMode ? '#94a3b8' : '#9ca3af',
                        margin: 0
                      }}>
                        Required By
                      </p>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: isDarkMode ? '#f1f5f9' : '#111827',
                        margin: 0
                      }}>
                        {new Date(request.requiredBy).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BloodRequests;
