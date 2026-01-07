import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useDarkMode } from '../context/DarkModeContext';
import { requestAPI, donationAPI, donorAPI } from '../services/api';
import DonorEligibility from '../components/DonorEligibility';
import {
  Heart, Droplet, Trophy, MessageCircle, FileText, Search,
  Activity, MapPin, Calendar, User, CheckCircle, Clock, AlertCircle
} from 'lucide-react';

const Dashboard = () => {
  const { user, isDonor, isRecipient } = useAuth();
  const { isDarkMode } = useDarkMode();
  const [stats, setStats] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentDonations, setRecentDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [requestsData, donationsData] = await Promise.all([
        requestAPI.getAll({ limit: 5 }),
        donationAPI.getHistory({ limit: 5 })
      ]);

      setRecentRequests(requestsData.data);
      setRecentDonations(donationsData.data);

      if (isDonor) {
        const donorStats = await donorAPI.getStats();
        setStats(donorStats.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <style>{`
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.8;
            }
          }
        `}</style>
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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center' }}
          >
            <Heart
              style={{
                width: '48px',
                height: '48px',
                color: '#dc2626',
                animation: 'pulse 2s ease-in-out infinite',
                marginBottom: '1rem'
              }}
              fill="#dc2626"
            />
            <p style={{
              color: isDarkMode ? '#cbd5e1' : '#6b7280',
              fontSize: '1rem'
            }}>
              Loading dashboard...
            </p>
          </motion.div>
        </div>
      </>
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
          transition={{ duration: 0.5 }}
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
              marginBottom: '0.5rem'
            }}>
              <span style={{ color: isDarkMode ? '#f1f5f9' : '#111827' }}>Welcome back, </span>
              <span style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>{user?.name}</span>
              <span style={{ color: isDarkMode ? '#f1f5f9' : '#111827' }}>! 👋</span>
            </h1>
            <p style={{
              color: isDarkMode ? '#cbd5e1' : '#6b7280',
              fontSize: '0.875rem'
            }}>
              Here's what's happening with your BloodLink account
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
            {user?.role}
          </motion.div>
        </motion.div>

        {/* Stats Grid */}
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
                Blood Type
              </h3>
            </div>
            <p style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: isDarkMode ? '#f1f5f9' : '#111827'
            }}>
              {user?.bloodType}
            </p>
          </motion.div>

          {isDonor && (
            <>
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
                  {user?.totalDonations || 0}
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
                    background: user?.isAvailable ? 'rgba(34, 197, 94, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                    borderRadius: '12px'
                  }}>
                    <Activity style={{ width: '24px', height: '24px', color: user?.isAvailable ? '#22c55e' : '#9ca3af' }} />
                  </div>
                  <h3 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#cbd5e1' : '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Status
                  </h3>
                </div>
                <p style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: user?.isAvailable ? '#22c55e' : '#9ca3af'
                }}>
                  {user?.isAvailable ? 'Available' : 'Unavailable'}
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
                    <Trophy style={{ width: '24px', height: '24px', color: '#eab308' }} />
                  </div>
                  <h3 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#cbd5e1' : '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Badge
                  </h3>
                </div>
                <p style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: isDarkMode ? '#f1f5f9' : '#111827'
                }}>
                  {user?.badge || 'None'}
                </p>
              </motion.div>
            </>
          )}

          {isRecipient && (
            <>
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
                    <FileText style={{ width: '24px', height: '24px', color: '#dc2626' }} />
                  </div>
                  <h3 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#cbd5e1' : '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Total Requests
                  </h3>
                </div>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: isDarkMode ? '#f1f5f9' : '#111827'
                }}>
                  {user?.requestHistory?.totalRequests || 0}
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
                    <CheckCircle style={{ width: '24px', height: '24px', color: '#22c55e' }} />
                  </div>
                  <h3 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#cbd5e1' : '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Fulfilled
                  </h3>
                </div>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: isDarkMode ? '#f1f5f9' : '#111827'
                }}>
                  {user?.requestHistory?.fulfilledRequests || 0}
                </p>
              </motion.div>
            </>
          )}
        </div>

        {isDonor && <DonorEligibility donorId={user?._id} />}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
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
            marginBottom: '1.5rem'
          }}>
            Quick Actions
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {isRecipient && (
              <>
                <motion.div whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.98 }}>
                  <Link to="/requests" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1.5rem',
                    background: isDarkMode ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.05)',
                    border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.2)' : '1px solid rgba(220, 38, 38, 0.1)',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{
                      padding: '0.75rem',
                      background: 'rgba(220, 38, 38, 0.1)',
                      borderRadius: '12px'
                    }}>
                      <Droplet style={{ width: '24px', height: '24px', color: '#dc2626' }} />
                    </div>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      textAlign: 'center'
                    }}>
                      Create Blood Request
                    </span>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.98 }}>
                  <Link to="/search-donors" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1.5rem',
                    background: isDarkMode ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.05)',
                    border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.2)' : '1px solid rgba(220, 38, 38, 0.1)',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{
                      padding: '0.75rem',
                      background: 'rgba(220, 38, 38, 0.1)',
                      borderRadius: '12px'
                    }}>
                      <Search style={{ width: '24px', height: '24px', color: '#dc2626' }} />
                    </div>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      textAlign: 'center'
                    }}>
                      Search Donors
                    </span>
                  </Link>
                </motion.div>
              </>
            )}
            {isDonor && (
              <>
                <motion.div whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.98 }}>
                  <Link to="/requests" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1.5rem',
                    background: isDarkMode ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.05)',
                    border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.2)' : '1px solid rgba(220, 38, 38, 0.1)',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{
                      padding: '0.75rem',
                      background: 'rgba(220, 38, 38, 0.1)',
                      borderRadius: '12px'
                    }}>
                      <FileText style={{ width: '24px', height: '24px', color: '#dc2626' }} />
                    </div>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      textAlign: 'center'
                    }}>
                      View Requests
                    </span>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.98 }}>
                  <Link to="/donations" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1.5rem',
                    background: isDarkMode ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.05)',
                    border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.2)' : '1px solid rgba(220, 38, 38, 0.1)',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{
                      padding: '0.75rem',
                      background: 'rgba(220, 38, 38, 0.1)',
                      borderRadius: '12px'
                    }}>
                      <Heart style={{ width: '24px', height: '24px', color: '#dc2626' }} />
                    </div>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      textAlign: 'center'
                    }}>
                      Donation History
                    </span>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.98 }}>
                  <Link to="/record-donation" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1.5rem',
                    background: isDarkMode ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.05)',
                    border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.2)' : '1px solid rgba(220, 38, 38, 0.1)',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{
                      padding: '0.75rem',
                      background: 'rgba(220, 38, 38, 0.1)',
                      borderRadius: '12px'
                    }}>
                      <Droplet style={{ width: '24px', height: '24px', color: '#dc2626' }} />
                    </div>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      textAlign: 'center'
                    }}>
                      Record Donation
                    </span>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.98 }}>
                  <Link to="/availability" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1.5rem',
                    background: isDarkMode ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.05)',
                    border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.2)' : '1px solid rgba(220, 38, 38, 0.1)',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{
                      padding: '0.75rem',
                      background: 'rgba(220, 38, 38, 0.1)',
                      borderRadius: '12px'
                    }}>
                      <Calendar style={{ width: '24px', height: '24px', color: '#dc2626' }} />
                    </div>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      textAlign: 'center'
                    }}>
                      Availability
                    </span>
                  </Link>
                </motion.div>
              </>
            )}
            <motion.div whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.98 }}>
              <Link to="/chat" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1.5rem',
                background: isDarkMode ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.05)',
                border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.2)' : '1px solid rgba(220, 38, 38, 0.1)',
                borderRadius: '12px',
                textDecoration: 'none',
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(220, 38, 38, 0.1)',
                  borderRadius: '12px'
                }}>
                  <MessageCircle style={{ width: '24px', height: '24px', color: '#dc2626' }} />
                </div>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  textAlign: 'center'
                }}>
                  Messages
                </span>
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.98 }}>
              <Link to="/leaderboard" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1.5rem',
                background: isDarkMode ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.05)',
                border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.2)' : '1px solid rgba(220, 38, 38, 0.1)',
                borderRadius: '12px',
                textDecoration: 'none',
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(220, 38, 38, 0.1)',
                  borderRadius: '12px'
                }}>
                  <Trophy style={{ width: '24px', height: '24px', color: '#dc2626' }} />
                </div>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  textAlign: 'center'
                }}>
                  Leaderboard
                </span>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Recent Blood Requests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
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
            marginBottom: '1.5rem'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: isDarkMode ? '#f1f5f9' : '#111827'
            }}>
              Recent Blood Requests
            </h2>
            <Link to="/requests" style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#dc2626',
              textDecoration: 'none'
            }}>
              View All →
            </Link>
          </div>

          {recentRequests.length === 0 ? (
            <div style={{
              padding: '3rem 2rem',
              textAlign: 'center'
            }}>
              <Droplet style={{
                width: '48px',
                height: '48px',
                color: isDarkMode ? '#475569' : '#cbd5e1',
                margin: '0 auto 1rem'
              }} />
              <p style={{
                color: isDarkMode ? '#94a3b8' : '#6b7280',
                fontSize: '0.875rem'
              }}>
                No recent blood requests
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recentRequests.map((request, index) => (
                <motion.div
                  key={request._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  style={{
                    padding: '1.25rem',
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
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '0.5rem'
                      }}>
                        <User style={{ width: '18px', height: '18px', color: '#dc2626' }} />
                        <h4 style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: isDarkMode ? '#f1f5f9' : '#111827',
                          margin: 0
                        }}>
                          {request.patientName}
                        </h4>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '0.5rem',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          fontSize: '0.875rem',
                          color: isDarkMode ? '#cbd5e1' : '#6b7280'
                        }}>
                          <Droplet style={{ width: '16px', height: '16px' }} />
                          <span>{request.bloodType}</span>
                        </div>
                        <div style={{
                          fontSize: '0.875rem',
                          color: isDarkMode ? '#cbd5e1' : '#6b7280'
                        }}>
                          •
                        </div>
                        <div style={{
                          fontSize: '0.875rem',
                          color: isDarkMode ? '#cbd5e1' : '#6b7280'
                        }}>
                          {request.unitsRequired} units needed
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        fontSize: '0.8125rem',
                        color: isDarkMode ? '#94a3b8' : '#9ca3af'
                      }}>
                        <MapPin style={{ width: '14px', height: '14px' }} />
                        <span>{request.hospital?.name || 'Hospital'}</span>
                      </div>
                    </div>
                    <div style={{
                      padding: '0.375rem 0.875rem',
                      background: request.status === 'fulfilled'
                        ? 'rgba(34, 197, 94, 0.1)'
                        : request.status === 'pending'
                        ? 'rgba(234, 179, 8, 0.1)'
                        : 'rgba(220, 38, 38, 0.1)',
                      color: request.status === 'fulfilled'
                        ? '#22c55e'
                        : request.status === 'pending'
                        ? '#eab308'
                        : '#dc2626',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {request.status}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Donations */}
        {isDonor && recentDonations.length > 0 && (
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
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: isDarkMode ? '#f1f5f9' : '#111827'
              }}>
                Recent Donations
              </h2>
              <Link to="/donations" style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#dc2626',
                textDecoration: 'none'
              }}>
                View All →
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recentDonations.map((donation, index) => (
                <motion.div
                  key={donation._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  style={{
                    padding: '1.25rem',
                    background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(254, 242, 242, 0.6)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(220, 38, 38, 0.1)',
                    borderRadius: '12px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        marginBottom: '0.5rem',
                        fontSize: '0.875rem',
                        color: isDarkMode ? '#cbd5e1' : '#6b7280'
                      }}>
                        <Calendar style={{ width: '16px', height: '16px' }} />
                        <span>{new Date(donation.donationDate).toLocaleDateString()}</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap',
                        fontSize: '0.875rem',
                        color: isDarkMode ? '#cbd5e1' : '#6b7280'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Droplet style={{ width: '16px', height: '16px' }} />
                          <span>{donation.unitsProvided} units</span>
                        </div>
                        <div>•</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Trophy style={{ width: '16px', height: '16px', color: '#eab308' }} />
                          <span>{donation.pointsEarned} points</span>
                        </div>
                      </div>
                    </div>
                    <div style={{
                      padding: '0.375rem 0.875rem',
                      background: donation.verificationStatus === 'verified'
                        ? 'rgba(34, 197, 94, 0.1)'
                        : donation.verificationStatus === 'pending'
                        ? 'rgba(234, 179, 8, 0.1)'
                        : 'rgba(156, 163, 175, 0.1)',
                      color: donation.verificationStatus === 'verified'
                        ? '#22c55e'
                        : donation.verificationStatus === 'pending'
                        ? '#eab308'
                        : '#9ca3af',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {donation.verificationStatus}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
