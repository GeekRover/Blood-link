import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI, donationAPI } from '../services/api';
import { useDarkMode } from '../context/DarkModeContext';
import {
  Heart, FileText, CheckCircle, XCircle, X, Clock,
  AlertCircle, Eye, Download, User, Calendar, Droplet,
  MapPin, TrendingUp, Shield
} from 'lucide-react';

const DonationVerification = () => {
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');

  // Modal states
  const [showDocumentModal, setShowDocumentModal] = useState({ show: false, donation: null });
  const [showRejectModal, setShowRejectModal] = useState({ show: false, donationId: null, donorName: '' });
  const [showOverrideModal, setShowOverrideModal] = useState({ show: false, donationId: null, donorName: '' });
  const [rejectReason, setRejectReason] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [verifying, setVerifying] = useState(null);

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const dashData = await adminAPI.getDashboard();
      setDashboard(dashData.data);
      fetchDonations();
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
      toast.error('Failed to load dashboard data', { icon: '❌' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDonations = async () => {
    try {
      const data = await adminAPI.getAllUsers();
      setDonations(data.data || []);
    } catch (error) {
      console.error('Failed to fetch donations:', error);
    }
  };

  // Filter donations based on search and status
  const filteredDonations = donations
    .flatMap((user) => (user.donations || []).map((d) => ({ ...d, donor: user })))
    .filter((donation) => {
      const matchesSearch = donation.donor?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donation.donor?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donation.donor?.email?.toLowerCase().includes(searchTerm.toLowerCase());

      if (filterStatus === 'all') return matchesSearch;
      return matchesSearch && donation.status === filterStatus;
    });

  const handleVerifyDonation = async (donationId) => {
    setVerifying(donationId);
    const verifyPromise = donationAPI.verify(donationId);

    toast.promise(
      verifyPromise,
      {
        loading: 'Verifying donation...',
        success: 'Donation verified! Digital card generated. ✅',
        error: (err) => `Failed: ${err.message || 'Unknown error'}`,
      },
      { success: { icon: '✅', duration: 3000 }, error: { icon: '❌', duration: 4000 } }
    );

    try {
      await verifyPromise;
      fetchData();
    } catch (error) {
      console.error('Failed to verify donation:', error);
    } finally {
      setVerifying(null);
    }
  };

  const handleRejectDonation = async () => {
    if (!rejectReason || rejectReason.trim().length < 10) {
      toast.error('Reason must be at least 10 characters', { icon: '⚠️' });
      return;
    }

    const rejectPromise = donationAPI.reject(showRejectModal.donationId, { reason: rejectReason });

    toast.promise(
      rejectPromise,
      {
        loading: 'Rejecting donation...',
        success: `Donation from ${showRejectModal.donorName} rejected ✅`,
        error: (err) => `Failed: ${err.message || 'Unknown error'}`,
      },
      { success: { icon: '✅', duration: 3000 }, error: { icon: '❌', duration: 4000 } }
    );

    try {
      await rejectPromise;
      setShowRejectModal({ show: false, donationId: null, donorName: '' });
      setRejectReason('');
      fetchData();
    } catch (error) {
      console.error('Failed to reject donation:', error);
    }
  };

  const handleOverrideDonation = async () => {
    if (!overrideReason || overrideReason.trim().length < 10) {
      toast.error('Reason must be at least 10 characters', { icon: '⚠️' });
      return;
    }

    const overridePromise = donationAPI.adminOverride(showOverrideModal.donationId, { reason: overrideReason });

    toast.promise(
      overridePromise,
      {
        loading: 'Overriding donation...',
        success: `Donation from ${showOverrideModal.donorName} overridden ✅`,
        error: (err) => `Failed: ${err.message || 'Unknown error'}`,
      },
      { success: { icon: '✅', duration: 3000 }, error: { icon: '❌', duration: 4000 } }
    );

    try {
      await overridePromise;
      setShowOverrideModal({ show: false, donationId: null, donorName: '' });
      setOverrideReason('');
      fetchData();
    } catch (error) {
      console.error('Failed to override donation:', error);
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

  const pendingCount = filteredDonations.filter((d) => d.status === 'pending').length;
  const verifiedCount = filteredDonations.filter((d) => d.status === 'verified').length;
  const rejectedCount = filteredDonations.filter((d) => d.status === 'rejected').length;

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
              <Heart style={{ width: '32px', height: '32px', color: '#dc2626' }} />
              Donation Verification
            </h1>
            <p style={{
              color: isDarkMode ? '#cbd5e1' : '#6b7280',
              fontSize: '0.875rem'
            }}>
              Review and verify donation records, approve documents, manage overrides
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

        {/* Stats */}
        {dashboard && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              style={{
                padding: '1.5rem',
                background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                }}>
                  <Clock style={{ width: '24px', height: '24px', color: 'white' }} />
                </div>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#cbd5e1' : '#6b7280',
                  textTransform: 'uppercase'
                }}>
                  Pending
                </h3>
              </div>
              <p style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: isDarkMode ? '#f1f5f9' : '#111827'
              }}>
                {dashboard.donations?.pending || 0}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
              style={{
                padding: '1.5rem',
                background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
                }}>
                  <CheckCircle style={{ width: '24px', height: '24px', color: 'white' }} />
                </div>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#cbd5e1' : '#6b7280',
                  textTransform: 'uppercase'
                }}>
                  Verified
                </h3>
              </div>
              <p style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: isDarkMode ? '#f1f5f9' : '#111827'
              }}>
                {dashboard.donations?.verified || 0}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
              style={{
                padding: '1.5rem',
                background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                }}>
                  <XCircle style={{ width: '24px', height: '24px', color: 'white' }} />
                </div>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#cbd5e1' : '#6b7280',
                  textTransform: 'uppercase'
                }}>
                  Rejected
                </h3>
              </div>
              <p style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: isDarkMode ? '#f1f5f9' : '#111827'
              }}>
                {dashboard.donations?.rejected || 0}
              </p>
            </motion.div>
          </div>
        )}

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
            placeholder="Search by donor name or email..."
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
            <option value="all">All Donations</option>
            <option value="pending">Pending Only</option>
            <option value="verified">Verified Only</option>
            <option value="rejected">Rejected Only</option>
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
              Loading donations...
            </p>
          </div>
        ) : filteredDonations.length === 0 ? (
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
            <Heart style={{ width: '48px', height: '48px', margin: '0 auto 1rem', color: '#9ca3af' }} />
            <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', fontSize: '1rem' }}>
              No donations found matching your criteria
            </p>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <AnimatePresence>
              {filteredDonations.map((donation, index) => (
                <motion.div
                  key={donation._id}
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
                    {/* Donation Info */}
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
                          background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold'
                        }}>
                          <Droplet style={{ width: '24px', height: '24px' }} />
                        </div>
                        <div>
                          <h3 style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: isDarkMode ? '#f1f5f9' : '#111827',
                            marginBottom: '0.25rem'
                          }}>
                            {donation.donor?.firstName} {donation.donor?.lastName}
                          </h3>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            fontSize: '0.75rem',
                            color: isDarkMode ? '#cbd5e1' : '#6b7280'
                          }}>
                            <span style={{ color: getStatusColor(donation.status) }}>
                              ● {donation.status?.toUpperCase()}
                            </span>
                            {donation.donationDate && (
                              <span>{new Date(donation.donationDate).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '0.75rem',
                        fontSize: '0.875rem'
                      }}>
                        {donation.bloodType && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Droplet style={{ width: '1rem', height: '1rem', color: '#dc2626' }} />
                            <span style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280' }}>
                              Blood Type: <strong>{donation.bloodType}</strong>
                            </span>
                          </div>
                        )}
                        {donation.center && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MapPin style={{ width: '1rem', height: '1rem', color: '#9ca3af' }} />
                            <span style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280' }}>
                              {donation.center}
                            </span>
                          </div>
                        )}
                        {donation.units && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TrendingUp style={{ width: '1rem', height: '1rem', color: '#9ca3af' }} />
                            <span style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280' }}>
                              Units: {donation.units}
                            </span>
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
                      {donation.proofDocument && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowDocumentModal({ show: true, donation })}
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
                          View Doc
                        </motion.button>
                      )}

                      {donation.status === 'pending' && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleVerifyDonation(donation._id)}
                            disabled={verifying === donation._id}
                            style={{
                              padding: '0.5rem 1rem',
                              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              cursor: verifying === donation._id ? 'not-allowed' : 'pointer',
                              opacity: verifying === donation._id ? 0.7 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <CheckCircle style={{ width: '0.875rem', height: '0.875rem' }} />
                            {verifying === donation._id ? 'Verifying...' : 'Verify'}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowRejectModal({ show: true, donationId: donation._id, donorName: `${donation.donor?.firstName} ${donation.donor?.lastName}` })}
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

                      {donation.status === 'verified' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowOverrideModal({ show: true, donationId: donation._id, donorName: `${donation.donor?.firstName} ${donation.donor?.lastName}` })}
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
                          <Shield style={{ width: '0.875rem', height: '0.875rem' }} />
                          Override
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

      {/* Document Modal */}
      <AnimatePresence>
        {showDocumentModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDocumentModal({ show: false, donation: null })}
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
                maxWidth: '600px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                maxHeight: '90vh',
                overflow: 'auto'
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
                  Donation Proof Document
                </h2>
                <button
                  onClick={() => setShowDocumentModal({ show: false, donation: null })}
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

              {showDocumentModal.donation?.verificationDocument && (
                <div style={{
                  marginBottom: '1.5rem',
                  textAlign: 'center'
                }}>
                  <img
                    src={showDocumentModal.donation.verificationDocument}
                    alt="Medical Record / Donation Proof"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '500px',
                      borderRadius: '12px',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </div>
              )}

              {!showDocumentModal.donation?.verificationDocument && (
                <div style={{
                  padding: '2rem',
                  background: isDarkMode ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.05)',
                  borderRadius: '12px',
                  textAlign: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <AlertCircle style={{
                    width: '32px',
                    height: '32px',
                    color: '#dc2626',
                    margin: '0 auto 0.75rem'
                  }} />
                  <p style={{
                    color: isDarkMode ? '#fca5a5' : '#dc2626',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    No medical record/donation proof image uploaded
                  </p>
                </div>
              )}

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setShowDocumentModal({ show: false, donation: null })}
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
                {showDocumentModal.donation?.verificationDocument && (
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    href={showDocumentModal.donation.verificationDocument}
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
                )}
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
            onClick={() => { setShowRejectModal({ show: false, donationId: null, donorName: '' }); setRejectReason(''); }}
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
                Reject donation from {showRejectModal.donorName}?
              </h2>
              <p style={{
                color: isDarkMode ? '#cbd5e1' : '#6b7280',
                marginBottom: '1.5rem',
                fontSize: '0.875rem'
              }}>
                Please provide a reason for rejection.
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
                  onClick={() => { setShowRejectModal({ show: false, donationId: null, donorName: '' }); setRejectReason(''); }}
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
                  onClick={handleRejectDonation}
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
                  Reject Donation
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Override Modal */}
      <AnimatePresence>
        {showOverrideModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowOverrideModal({ show: false, donationId: null, donorName: '' }); setOverrideReason(''); }}
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
                Override donation from {showOverrideModal.donorName}?
              </h2>
              <p style={{
                color: isDarkMode ? '#cbd5e1' : '#6b7280',
                marginBottom: '1.5rem',
                fontSize: '0.875rem'
              }}>
                This action will change the donation status. Please provide a reason.
              </p>

              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
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
                  onClick={() => { setShowOverrideModal({ show: false, donationId: null, donorName: '' }); setOverrideReason(''); }}
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
                  onClick={handleOverrideDonation}
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
                  Override Donation
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

export default DonationVerification;
