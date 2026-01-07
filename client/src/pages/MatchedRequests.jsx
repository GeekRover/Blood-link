import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useDarkMode } from '../context/DarkModeContext';
import { requestAPI } from '../services/api';
import {
  Droplet, MapPin, AlertCircle, Clock, CheckCircle, X, Phone,
  Mail, Hospital, Calendar, FileText, User, MessageCircle
} from 'lucide-react';

const MatchedRequests = () => {
  const { user, isDonor } = useAuth();
  const { isDarkMode } = useDarkMode();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    if (!isDonor) {
      toast.error('Only donors can view matched requests');
      return;
    }
    fetchMatchedRequests();
  }, [isDonor]);

  const fetchMatchedRequests = async () => {
    try {
      setLoading(true);
      // Use the dedicated getDonorMatched endpoint - backend handles filtering
      const data = await requestAPI.getDonorMatched();

      // Filter to show only pending responses (not yet accepted/declined)
      const pendingMatches = data.data?.filter(req => {
        const myMatch = req.matchedDonors?.find(m =>
          m.donor?._id === user?._id || m.donor === user?._id
        );
        return myMatch && myMatch.response === 'pending';
      }) || [];

      setRequests(pendingMatches);
    } catch (error) {
      console.error('Failed to fetch matched requests:', error);
      console.error('Error details:', error);
      toast.error('Failed to load matched requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId, response) => {
    if (!requestId) return;

    try {
      setResponding(true);
      const data = {
        response,
        ...(response === 'declined' && { declineReason })
      };

      await requestAPI.respond(requestId, data);

      toast.success(
        response === 'accepted'
          ? '✅ Request accepted! Go to Chat to connect, then Record your Donation.'
          : '❌ Request declined'
      );

      // Remove request from list
      setRequests(requests.filter(r => r._id !== requestId));
      setSelectedRequest(null);
      setDeclineReason('');
    } catch (error) {
      console.error('Failed to respond to request:', error);
      toast.error(error.message || 'Failed to respond to request');
    } finally {
      setResponding(false);
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
            Loading your matched requests...
          </p>
        </motion.div>
      </div>
    );
  }

  if (!isDonor) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDarkMode
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)',
        padding: '2rem 1rem'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            maxWidth: '500px',
            textAlign: 'center',
            padding: '2rem',
            background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '16px'
          }}
        >
          <AlertCircle style={{ width: '64px', height: '64px', color: '#eab308', margin: '0 auto 1rem' }} />
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: isDarkMode ? '#f1f5f9' : '#111827',
            marginBottom: '0.5rem'
          }}>
            Donor Only
          </h3>
          <p style={{ color: isDarkMode ? '#94a3b8' : '#6b7280' }}>
            This page is only available for donors. Please log in as a donor to view matched requests.
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
            marginBottom: '0.5rem'
          }}>
            <span style={{ color: isDarkMode ? '#f1f5f9' : '#111827' }}>Matched </span>
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
            Review blood requests you've been matched to and accept or decline them
          </p>
        </motion.div>

        {/* Empty State */}
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
              No Matched Requests
            </h3>
            <p style={{
              color: isDarkMode ? '#94a3b8' : '#6b7280',
              fontSize: '0.875rem'
            }}>
              You haven't been matched with any blood requests yet. Check back later or use the Donor Search to find requests.
            </p>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {requests.map((request, index) => (
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
                {/* Header */}
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
                  </div>
                </div>

                {/* Request Details */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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

                {/* Medical Reason */}
                {request.medicalReason && (
                  <div style={{
                    padding: '1rem',
                    background: isDarkMode ? 'rgba(79, 70, 229, 0.1)' : 'rgba(79, 70, 229, 0.05)',
                    border: isDarkMode ? '1px solid rgba(79, 70, 229, 0.2)' : '1px solid rgba(79, 70, 229, 0.1)',
                    borderRadius: '12px',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <FileText style={{ width: '16px', height: '16px', color: '#4f46e5', flexShrink: 0 }} />
                      <p style={{
                        fontSize: '0.75rem',
                        color: isDarkMode ? '#94a3b8' : '#9ca3af',
                        margin: 0,
                        fontWeight: '600'
                      }}>
                        Medical Reason
                      </p>
                    </div>
                    <p style={{
                      fontSize: '0.875rem',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      margin: 0
                    }}>
                      {request.medicalReason}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRespond(request._id, 'accepted')}
                    disabled={responding}
                    style={{
                      flex: 1,
                      minWidth: '140px',
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: responding ? 'not-allowed' : 'pointer',
                      opacity: responding ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <CheckCircle style={{ width: '18px', height: '18px' }} />
                    {responding ? 'Accepting...' : 'Accept'}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedRequest(request)}
                    disabled={responding}
                    style={{
                      flex: 1,
                      minWidth: '140px',
                      padding: '0.75rem 1.5rem',
                      background: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: isDarkMode ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      opacity: responding ? 0.7 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    <X style={{ width: '18px', height: '18px' }} />
                    Decline
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Decline Modal */}
      <AnimatePresence>
        {selectedRequest && (
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
            onClick={() => setSelectedRequest(null)}
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
                fontSize: '1.25rem',
                fontWeight: '700',
                marginBottom: '1rem',
                color: '#ef4444'
              }}>
                Decline Request?
              </h3>

              <p style={{
                color: isDarkMode ? '#cbd5e1' : '#6b7280',
                fontSize: '0.875rem',
                marginBottom: '1.5rem'
              }}>
                Are you sure you want to decline this blood request? The recipient will be notified.
              </p>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#e2e8f0' : '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Reason (optional)
                </label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Why are you declining this request?"
                  style={{
                    width: '100%',
                    height: '80px',
                    padding: '0.75rem',
                    border: isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#ef4444'}
                  onBlur={(e) => e.target.style.borderColor = isDarkMode ? '#334155' : '#e5e7eb'}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRespond(selectedRequest._id, 'declined')}
                  disabled={responding}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: responding ? 'not-allowed' : 'pointer',
                    opacity: responding ? 0.7 : 1,
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                    transition: 'all 0.2s'
                  }}
                >
                  {responding ? 'Declining...' : 'Decline'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedRequest(null)}
                  disabled={responding}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: isDarkMode ? 'rgba(51, 65, 85, 0.8)' : 'rgba(243, 244, 246, 0.8)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    color: isDarkMode ? '#cbd5e1' : '#374151',
                    transition: 'all 0.2s'
                  }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MatchedRequests;
