import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI } from '../services/api';
import { useDarkMode } from '../context/DarkModeContext';
import {
  Users, UserCheck, Shield, AlertCircle, CheckCircle, XCircle,
  Eye, X, FileText, Clock, Mail, Phone, MapPin, BadgeCheck, Download
} from 'lucide-react';

const UserVerification = () => {
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal states
  const [showHospitalIDModal, setShowHospitalIDModal] = useState({ show: false, user: null });
  const [showRejectModal, setShowRejectModal] = useState({ show: false, userId: null, userName: '' });
  const [showResubmitModal, setShowResubmitModal] = useState({ show: false, userId: null, userName: '' });
  const [showRevokeModal, setShowRevokeModal] = useState({ show: false, userId: null, userName: '' });
  const [rejectReason, setRejectReason] = useState('');
  const [resubmitReason, setResubmitReason] = useState('');
  const [revokeReason, setRevokeReason] = useState('');
  const [verifying, setVerifying] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getAllUsers();
      setUsers(data.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users', { icon: '❌' });
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search and status
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'pending') return matchesSearch && user.verificationStatus === 'pending';
    if (filterStatus === 'verified') return matchesSearch && user.verificationStatus === 'verified';
    if (filterStatus === 'rejected') return matchesSearch && user.verificationStatus === 'rejected';

    return matchesSearch;
  });

  const handleVerify = async (userId) => {
    setVerifying(userId);
    const verifyPromise = adminAPI.verifyUser(userId);

    toast.promise(
      verifyPromise,
      {
        loading: 'Verifying user...',
        success: 'User verified successfully! ✅',
        error: (err) => `Failed: ${err.message || 'Unknown error'}`,
      },
      { success: { icon: '✅', duration: 3000 }, error: { icon: '❌', duration: 4000 } }
    );

    try {
      await verifyPromise;
      fetchUsers();
    } catch (error) {
      console.error('Failed to verify user:', error);
    } finally {
      setVerifying(null);
    }
  };

  const handleRejectUser = async () => {
    if (!rejectReason || rejectReason.trim().length < 10) {
      toast.error('Reason must be at least 10 characters', { icon: '⚠️' });
      return;
    }

    const rejectPromise = adminAPI.rejectUser(showRejectModal.userId, { reason: rejectReason });

    toast.promise(
      rejectPromise,
      {
        loading: 'Rejecting user...',
        success: `User ${showRejectModal.userName} rejected ✅`,
        error: (err) => `Failed: ${err.message || 'Unknown error'}`,
      },
      { success: { icon: '✅', duration: 3000 }, error: { icon: '❌', duration: 4000 } }
    );

    try {
      await rejectPromise;
      setShowRejectModal({ show: false, userId: null, userName: '' });
      setRejectReason('');
      fetchUsers();
    } catch (error) {
      console.error('Failed to reject user:', error);
    }
  };

  const handleRequestResubmission = async () => {
    if (!resubmitReason || resubmitReason.trim().length < 10) {
      toast.error('Reason must be at least 10 characters', { icon: '⚠️' });
      return;
    }

    const resubmitPromise = adminAPI.requestResubmission(showResubmitModal.userId, { reason: resubmitReason });

    toast.promise(
      resubmitPromise,
      {
        loading: 'Requesting resubmission...',
        success: `Resubmission requested from ${showResubmitModal.userName} ✅`,
        error: (err) => `Failed: ${err.message || 'Unknown error'}`,
      },
      { success: { icon: '✅', duration: 3000 }, error: { icon: '❌', duration: 4000 } }
    );

    try {
      await resubmitPromise;
      setShowResubmitModal({ show: false, userId: null, userName: '' });
      setResubmitReason('');
      fetchUsers();
    } catch (error) {
      console.error('Failed to request resubmission:', error);
    }
  };

  const handleRevokeVerification = async () => {
    if (!revokeReason || revokeReason.trim().length < 10) {
      toast.error('Reason must be at least 10 characters', { icon: '⚠️' });
      return;
    }

    const revokePromise = adminAPI.revokeVerification(showRevokeModal.userId, { reason: revokeReason });

    toast.promise(
      revokePromise,
      {
        loading: 'Revoking verification...',
        success: `Verification revoked from ${showRevokeModal.userName} ✅`,
        error: (err) => `Failed: ${err.message || 'Unknown error'}`,
      },
      { success: { icon: '✅', duration: 3000 }, error: { icon: '❌', duration: 4000 } }
    );

    try {
      await revokePromise;
      setShowRevokeModal({ show: false, userId: null, userName: '' });
      setRevokeReason('');
      fetchUsers();
    } catch (error) {
      console.error('Failed to revoke verification:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return '#22c55e';
      case 'pending': return '#f59e0b';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified': return <CheckCircle style={{ width: '1.25rem', height: '1.25rem' }} />;
      case 'pending': return <Clock style={{ width: '1.25rem', height: '1.25rem' }} />;
      case 'rejected': return <XCircle style={{ width: '1.25rem', height: '1.25rem' }} />;
      default: return <AlertCircle style={{ width: '1.25rem', height: '1.25rem' }} />;
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
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: isDarkMode ? '#f1f5f9' : '#111827'
            }}>
              <UserCheck style={{ width: '32px', height: '32px', color: '#22c55e' }} />
              User Verification Management
            </h1>
            <p style={{
              color: isDarkMode ? '#cbd5e1' : '#6b7280',
              fontSize: '0.875rem'
            }}>
              Manage user verifications, review documents, and approve/reject submissions
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/admin')}
            style={{
              padding: '0.5rem 1.5rem',
              background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              color: isDarkMode ? '#f1f5f9' : '#111827',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            Back to Dashboard
          </motion.button>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            marginBottom: '2rem',
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}
        >
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              minWidth: '250px',
              padding: '0.75rem 1rem',
              background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              color: isDarkMode ? '#f1f5f9' : '#111827',
              borderRadius: '12px',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              color: isDarkMode ? '#f1f5f9' : '#111827',
              borderRadius: '12px',
              fontSize: '0.875rem',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="all">All Users</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: `3px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              borderTopColor: '#dc2626',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', marginTop: '1rem' }}>
              Loading users...
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '2rem',
              background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              borderRadius: '16px',
              textAlign: 'center',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            }}
          >
            <Users style={{ width: '48px', height: '48px', margin: '0 auto 1rem', color: '#9ca3af' }} />
            <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', fontSize: '1rem' }}>
              No users found matching your criteria
            </p>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <AnimatePresence>
              {filteredUsers.map((user, index) => (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  style={{
                    padding: '1.5rem',
                    background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(12px)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    {/* User Info */}
                    <div style={{ flex: 1, minWidth: '250px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '1rem'
                      }}>
                        <div style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold'
                        }}>
                          {user.firstName?.[0]?.toUpperCase()}{user.lastName?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <h3 style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: isDarkMode ? '#f1f5f9' : '#111827',
                            marginBottom: '0.25rem'
                          }}>
                            {user.firstName} {user.lastName}
                          </h3>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.75rem',
                            color: isDarkMode ? '#cbd5e1' : '#6b7280'
                          }}>
                            <span style={{ color: getStatusColor(user.verificationStatus) }}>
                              ● {user.verificationStatus?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* User Details */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '0.75rem',
                        fontSize: '0.875rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Mail style={{ width: '1rem', height: '1rem', color: '#9ca3af' }} />
                          <span style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280' }}>{user.email}</span>
                        </div>
                        {user.phoneNumber && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Phone style={{ width: '1rem', height: '1rem', color: '#9ca3af' }} />
                            <span style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280' }}>{user.phoneNumber}</span>
                          </div>
                        )}
                        {user.address && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MapPin style={{ width: '1rem', height: '1rem', color: '#9ca3af' }} />
                            <span style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280' }}>{user.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{
                      display: 'flex',
                      gap: '0.75rem',
                      flexWrap: 'wrap',
                      justifyContent: 'flex-end'
                    }}>
                      {user.hospitalID && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowHospitalIDModal({ show: true, user })}
                          style={{
                            padding: '0.5rem 1rem',
                            background: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                            color: '#3b82f6',
                            border: '1px solid #3b82f6',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <Eye style={{ width: '0.875rem', height: '0.875rem' }} />
                          View ID
                        </motion.button>
                      )}

                      {user.verificationStatus === 'pending' && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleVerify(user._id)}
                            disabled={verifying === user._id}
                            style={{
                              padding: '0.5rem 1rem',
                              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              cursor: verifying === user._id ? 'not-allowed' : 'pointer',
                              opacity: verifying === user._id ? 0.7 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <CheckCircle style={{ width: '0.875rem', height: '0.875rem' }} />
                            {verifying === user._id ? 'Verifying...' : 'Verify'}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowRejectModal({ show: true, userId: user._id, userName: `${user.firstName} ${user.lastName}` })}
                            style={{
                              padding: '0.5rem 1rem',
                              background: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                              color: '#ef4444',
                              border: '1px solid #ef4444',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <XCircle style={{ width: '0.875rem', height: '0.875rem' }} />
                            Reject
                          </motion.button>
                        </>
                      )}

                      {user.verificationStatus === 'rejected' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowResubmitModal({ show: true, userId: user._id, userName: `${user.firstName} ${user.lastName}` })}
                          style={{
                            padding: '0.5rem 1rem',
                            background: isDarkMode ? 'rgba(249, 115, 22, 0.2)' : 'rgba(249, 115, 22, 0.1)',
                            color: '#f97316',
                            border: '1px solid #f97316',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <FileText style={{ width: '0.875rem', height: '0.875rem' }} />
                          Request Resubmit
                        </motion.button>
                      )}

                      {user.verificationStatus === 'verified' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowRevokeModal({ show: true, userId: user._id, userName: `${user.firstName} ${user.lastName}` })}
                          style={{
                            padding: '0.5rem 1rem',
                            background: isDarkMode ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.1)',
                            color: '#a855f7',
                            border: '1px solid #a855f7',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <BadgeCheck style={{ width: '0.875rem', height: '0.875rem' }} />
                          Revoke
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Hospital ID Modal */}
      <AnimatePresence>
        {showHospitalIDModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHospitalIDModal({ show: false, user: null })}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              zIndex: 50
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: isDarkMode ? '#1e293b' : 'white',
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: isDarkMode ? '#f1f5f9' : '#111827'
                }}>
                  Hospital ID
                </h2>
                <button
                  onClick={() => setShowHospitalIDModal({ show: false, user: null })}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem'
                  }}
                >
                  <X style={{ width: '1.5rem', height: '1.5rem', color: isDarkMode ? '#cbd5e1' : '#6b7280' }} />
                </button>
              </div>

              {showHospitalIDModal.user?.hospitalID && (
                <div style={{
                  marginBottom: '1.5rem',
                  textAlign: 'center'
                }}>
                  <img
                    src={showHospitalIDModal.user.hospitalID}
                    alt="Hospital ID"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '400px',
                      borderRadius: '12px',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </div>
              )}

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setShowHospitalIDModal({ show: false, user: null })}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(0, 0, 0, 0.05)',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Close
                </motion.button>
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  href={showHospitalIDModal.user?.hospitalID}
                  download
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Download style={{ width: '1rem', height: '1rem' }} />
                  Download
                </motion.a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowRejectModal({ show: false, userId: null, userName: '' }); setRejectReason(''); }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              zIndex: 50
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: isDarkMode ? '#1e293b' : 'white',
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
              }}
            >
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: isDarkMode ? '#f1f5f9' : '#111827',
                marginBottom: '1rem'
              }}>
                Reject {showRejectModal.userName}?
              </h2>
              <p style={{
                color: isDarkMode ? '#cbd5e1' : '#6b7280',
                marginBottom: '1.5rem',
                fontSize: '0.875rem'
              }}>
                Please provide a reason for rejection. This will be communicated to the user.
              </p>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason (minimum 10 characters)..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(0, 0, 0, 0.05)',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  minHeight: '100px',
                  outline: 'none',
                  marginBottom: '1.5rem'
                }}
              />

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => { setShowRejectModal({ show: false, userId: null, userName: '' }); setRejectReason(''); }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(0, 0, 0, 0.05)',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={handleRejectUser}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Reject User
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resubmit Modal */}
      <AnimatePresence>
        {showResubmitModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowResubmitModal({ show: false, userId: null, userName: '' }); setResubmitReason(''); }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              zIndex: 50
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: isDarkMode ? '#1e293b' : 'white',
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
              }}
            >
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: isDarkMode ? '#f1f5f9' : '#111827',
                marginBottom: '1rem'
              }}>
                Request Resubmission from {showResubmitModal.userName}?
              </h2>
              <p style={{
                color: isDarkMode ? '#cbd5e1' : '#6b7280',
                marginBottom: '1.5rem',
                fontSize: '0.875rem'
              }}>
                Please provide the reason why you're requesting resubmission.
              </p>

              <textarea
                value={resubmitReason}
                onChange={(e) => setResubmitReason(e.target.value)}
                placeholder="Enter reason (minimum 10 characters)..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(0, 0, 0, 0.05)',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  minHeight: '100px',
                  outline: 'none',
                  marginBottom: '1.5rem'
                }}
              />

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => { setShowResubmitModal({ show: false, userId: null, userName: '' }); setResubmitReason(''); }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(0, 0, 0, 0.05)',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={handleRequestResubmission}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Request Resubmission
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Revoke Modal */}
      <AnimatePresence>
        {showRevokeModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowRevokeModal({ show: false, userId: null, userName: '' }); setRevokeReason(''); }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              zIndex: 50
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: isDarkMode ? '#1e293b' : 'white',
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
              }}
            >
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: isDarkMode ? '#f1f5f9' : '#111827',
                marginBottom: '1rem'
              }}>
                Revoke Verification for {showRevokeModal.userName}?
              </h2>
              <p style={{
                color: isDarkMode ? '#cbd5e1' : '#6b7280',
                marginBottom: '1.5rem',
                fontSize: '0.875rem'
              }}>
                This action will revoke their verified status. Please provide a reason.
              </p>

              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Enter reason (minimum 10 characters)..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(0, 0, 0, 0.05)',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  minHeight: '100px',
                  outline: 'none',
                  marginBottom: '1.5rem'
                }}
              />

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => { setShowRevokeModal({ show: false, userId: null, userName: '' }); setRevokeReason(''); }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(0, 0, 0, 0.05)',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={handleRevokeVerification}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Revoke Verification
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default UserVerification;
