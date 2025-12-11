import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { adminAPI, donationAPI } from '../services/api';
import { useDarkMode } from '../context/DarkModeContext';
import {
  Users, UserCheck, Heart, Droplet, AlertCircle, CheckCircle,
  Clock, Calendar, Shield, Activity, TrendingUp, XCircle
} from 'lucide-react';

const AdminDashboard = () => {
  const { isDarkMode } = useDarkMode();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState(null);
  const [verifying, setVerifying] = useState(null);

  useEffect(() => {
    fetchDashboard();
    fetchPendingVerifications();
  }, []);

  const fetchDashboard = async () => {
    try {
      const data = await adminAPI.getDashboard();
      setStats(data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
      toast.error('Failed to load dashboard data', {
        icon: '❌',
      });
    }
  };

  const fetchPendingVerifications = async () => {
    try {
      const data = await adminAPI.getPendingVerifications();
      setPending(data.data);
    } catch (error) {
      console.error('Failed to fetch pending verifications:', error);
      toast.error('Failed to load pending verifications', {
        icon: '❌',
      });
    }
  };

  const handleVerify = async (userId) => {
    const verifyPromise = adminAPI.verifyUser(userId);

    toast.promise(
      verifyPromise,
      {
        loading: 'Verifying user...',
        success: 'User verified successfully! 🎉',
        error: (err) => `Failed to verify user: ${err.message || 'Unknown error'}`,
      },
      {
        success: {
          icon: '✅',
          duration: 3000,
        },
        error: {
          icon: '❌',
          duration: 4000,
        },
      }
    );

    try {
      await verifyPromise;
      fetchPendingVerifications();
    } catch (error) {
      console.error('Failed to verify user:', error);
    }
  };

  const handleVerifyDonation = async (donationId) => {
    setVerifying(donationId);

    const verifyPromise = donationAPI.verify(donationId);

    toast.promise(
      verifyPromise,
      {
        loading: 'Verifying donation...',
        success: 'Donation verified successfully! Digital donation card generated. 🎉',
        error: (err) => `Failed to verify donation: ${err.message || 'Unknown error'}`,
      },
      {
        success: {
          icon: '✅',
          duration: 4000,
        },
        error: {
          icon: '❌',
          duration: 4000,
        },
      }
    );

    try {
      await verifyPromise;
      fetchPendingVerifications();
      fetchDashboard();
    } catch (error) {
      console.error('Failed to verify donation:', error);
    } finally {
      setVerifying(null);
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
              gap: '0.75rem'
            }}>
              <Shield style={{ width: '32px', height: '32px', color: '#dc2626' }} />
              <span style={{ color: isDarkMode ? '#f1f5f9' : '#111827' }}>Admin </span>
              <span style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>Dashboard</span>
            </h1>
            <p style={{
              color: isDarkMode ? '#cbd5e1' : '#6b7280',
              fontSize: '0.875rem'
            }}>
              Manage users, verifications, and monitor system activity
            </p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            style={{
              padding: '0.5rem 1.5rem',
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              color: 'white',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
            }}
          >
            ADMIN
          </motion.div>
        </motion.div>

        {/* Stats Grid */}
        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
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
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '12px'
                }}>
                  <Users style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
                </div>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#cbd5e1' : '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Total Users
                </h3>
              </div>
              <p style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: isDarkMode ? '#f1f5f9' : '#111827'
              }}>
                {stats.users?.total || 0}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02, y: -5 }}
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
                  background: 'rgba(220, 38, 38, 0.1)',
                  borderRadius: '12px'
                }}>
                  <Droplet style={{ width: '24px', height: '24px', color: '#dc2626' }} />
                </div>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#cbd5e1' : '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Donors
                </h3>
              </div>
              <p style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: isDarkMode ? '#f1f5f9' : '#111827'
              }}>
                {stats.users?.donors || 0}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02, y: -5 }}
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
                  background: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '12px'
                }}>
                  <UserCheck style={{ width: '24px', height: '24px', color: '#22c55e' }} />
                </div>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#cbd5e1' : '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Recipients
                </h3>
              </div>
              <p style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: isDarkMode ? '#f1f5f9' : '#111827'
              }}>
                {stats.users?.recipients || 0}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02, y: -5 }}
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
                  background: 'rgba(234, 179, 8, 0.1)',
                  borderRadius: '12px'
                }}>
                  <Clock style={{ width: '24px', height: '24px', color: '#eab308' }} />
                </div>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#cbd5e1' : '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Pending Requests
                </h3>
              </div>
              <p style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: isDarkMode ? '#f1f5f9' : '#111827'
              }}>
                {stats.requests?.pending || 0}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02, y: -5 }}
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
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '12px'
                }}>
                  <AlertCircle style={{ width: '24px', height: '24px', color: '#ef4444' }} />
                </div>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#cbd5e1' : '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Critical Requests
                </h3>
              </div>
              <p style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: isDarkMode ? '#f1f5f9' : '#111827'
              }}>
                {stats.requests?.critical || 0}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.02, y: -5 }}
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
                  background: 'rgba(220, 38, 38, 0.1)',
                  borderRadius: '12px'
                }}>
                  <Heart style={{ width: '24px', height: '24px', color: '#dc2626' }} />
                </div>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#cbd5e1' : '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Total Donations
                </h3>
              </div>
              <p style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: isDarkMode ? '#f1f5f9' : '#111827'
              }}>
                {stats.donations?.total || 0}
              </p>
            </motion.div>
          </div>
        )}

        {/* Pending User Verifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
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
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: isDarkMode ? '#f1f5f9' : '#111827',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <UserCheck style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
            Pending User Verifications
          </h2>
          {pending?.users?.length === 0 ? (
            <div style={{
              padding: '3rem 2rem',
              textAlign: 'center'
            }}>
              <CheckCircle style={{
                width: '48px',
                height: '48px',
                color: isDarkMode ? '#475569' : '#cbd5e1',
                margin: '0 auto 1rem'
              }} />
              <p style={{
                color: isDarkMode ? '#94a3b8' : '#6b7280',
                fontSize: '0.875rem'
              }}>
                No pending user verifications
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pending?.users?.map((user, index) => (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  style={{
                    padding: '1.5rem',
                    background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(254, 242, 242, 0.6)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(220, 38, 38, 0.1)',
                    borderRadius: '12px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'start',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: isDarkMode ? '#f1f5f9' : '#111827',
                        marginBottom: '0.75rem'
                      }}>
                        {user.name}
                      </h4>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        color: isDarkMode ? '#cbd5e1' : '#6b7280'
                      }}>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>Role:</strong> <span style={{
                          padding: '0.25rem 0.75rem',
                          background: user.role === 'donor' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                          color: user.role === 'donor' ? '#dc2626' : '#22c55e',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          textTransform: 'capitalize'
                        }}>{user.role}</span></p>
                        <p><strong>Blood Type:</strong> <span style={{
                          padding: '0.25rem 0.75rem',
                          background: 'rgba(220, 38, 38, 0.1)',
                          color: '#dc2626',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>{user.bloodType}</span></p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleVerify(user._id)}
                        style={{
                          padding: '0.75rem 1.5rem',
                          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <CheckCircle style={{ width: '16px', height: '16px' }} />
                        Verify
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          padding: '0.75rem 1.5rem',
                          background: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <XCircle style={{ width: '16px', height: '16px' }} />
                        Reject
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Pending Donation Verifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          style={{
            padding: '2rem',
            background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          }}
        >
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: isDarkMode ? '#f1f5f9' : '#111827',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Heart style={{ width: '24px', height: '24px', color: '#dc2626' }} />
            Pending Donation Verifications
          </h2>
          {pending?.donations?.length === 0 ? (
            <div style={{
              padding: '3rem 2rem',
              textAlign: 'center'
            }}>
              <CheckCircle style={{
                width: '48px',
                height: '48px',
                color: isDarkMode ? '#475569' : '#cbd5e1',
                margin: '0 auto 1rem'
              }} />
              <p style={{
                color: isDarkMode ? '#94a3b8' : '#6b7280',
                fontSize: '0.875rem'
              }}>
                No pending donation verifications
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pending?.donations?.map((donation, index) => (
                <motion.div
                  key={donation._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  style={{
                    padding: '1.5rem',
                    background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(254, 242, 242, 0.6)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(220, 38, 38, 0.1)',
                    borderRadius: '12px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'start',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: isDarkMode ? '#f1f5f9' : '#111827',
                        marginBottom: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <Droplet style={{ width: '20px', height: '20px', color: '#dc2626' }} />
                        Donation by {donation.donor?.name}
                      </h4>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        color: isDarkMode ? '#cbd5e1' : '#6b7280'
                      }}>
                        <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Calendar style={{ width: '16px', height: '16px' }} />
                          <strong>Date:</strong> {new Date(donation.donationDate).toLocaleDateString()}
                        </p>
                        <p><strong>Units:</strong> <span style={{
                          padding: '0.25rem 0.75rem',
                          background: 'rgba(220, 38, 38, 0.1)',
                          color: '#dc2626',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>{donation.unitsProvided}</span></p>
                        <p><strong>Blood Type:</strong> <span style={{
                          padding: '0.25rem 0.75rem',
                          background: 'rgba(220, 38, 38, 0.1)',
                          color: '#dc2626',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>{donation.bloodType}</span></p>
                        {donation.donationCenter && (
                          <p><strong>Center:</strong> {donation.donationCenter.name}</p>
                        )}
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleVerifyDonation(donation._id)}
                      disabled={verifying === donation._id}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: verifying === donation._id
                          ? isDarkMode ? 'rgba(220, 38, 38, 0.3)' : 'rgba(220, 38, 38, 0.2)'
                          : 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: verifying === donation._id ? 'not-allowed' : 'pointer',
                        boxShadow: verifying === donation._id ? 'none' : '0 2px 8px rgba(220, 38, 38, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        opacity: verifying === donation._id ? 0.6 : 1
                      }}
                    >
                      {verifying === donation._id ? (
                        <>
                          <Activity style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle style={{ width: '16px', height: '16px' }} />
                          Verify Donation
                        </>
                      )}
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
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
