import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { donationAPI } from '../services/api';
import { useDarkMode } from '../context/DarkModeContext';
import {
  Heart, Droplet, Calendar, MapPin, Trophy, CheckCircle,
  Clock, XCircle, Award, TrendingUp, CreditCard
} from 'lucide-react';
import DigitalCard from '../components/DigitalCard';
import toast from 'react-hot-toast';

const DonationHistory = () => {
  const [donations, setDonations] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [loadingCard, setLoadingCard] = useState(null);
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const data = await donationAPI.getHistory();
      setDonations(data.data);
      setTotalCount(data.totalCount || data.data.length);
      setVerifiedCount(data.verifiedCount || 0);
    } catch (error) {
      console.error('Failed to fetch donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCard = async (donation) => {
    try {
      setLoadingCard(donation._id);

      // If donation already has digitalCard populated, use it
      if (donation.digitalCard) {
        setSelectedCard(donation.digitalCard);
      } else {
        // Otherwise fetch the donation with populated digitalCard
        const response = await donationAPI.getById(donation._id);
        if (response.data.digitalCard) {
          setSelectedCard(response.data.digitalCard);
        } else {
          toast.error('No digital card found for this donation', { icon: '❌' });
        }
      }
    } catch (error) {
      console.error('Failed to fetch card:', error);
      toast.error('Failed to load digital card', { icon: '❌' });
    } finally {
      setLoadingCard(null);
    }
  };

  const handleCloseCard = () => {
    setSelectedCard(null);
  };

  const handleRegenerate = () => {
    fetchDonations();
  };

  // Calculate stats
  const totalDonations = verifiedCount; // Use verified count to match Profile page
  const totalUnits = donations.reduce((sum, d) => sum + (d.unitsProvided || 0), 0);
  const totalPoints = donations.reduce((sum, d) => sum + (d.pointsEarned || 0), 0);
  const verifiedDonations = donations.filter(d => d.verificationStatus === 'verified').length;

  if (loading) {
    return (
      <>
        <style>{`
          @keyframes heartbeat {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.1);
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center' }}
          >
            <Heart
              style={{
                width: '48px',
                height: '48px',
                color: '#dc2626',
                animation: 'heartbeat 1.5s ease-in-out infinite',
                marginBottom: '1rem'
              }}
              fill="#dc2626"
            />
            <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280' }}>
              Loading donations...
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
          style={{ marginBottom: '2rem' }}
        >
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem'
          }}>
            <span style={{ color: isDarkMode ? '#f1f5f9' : '#111827' }}>Donation </span>
            <span style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>History</span>
          </h1>
          <p style={{
            color: isDarkMode ? '#cbd5e1' : '#6b7280',
            fontSize: '0.875rem'
          }}>
            Track your blood donation journey and impact
          </p>
        </motion.div>

        {/* Stats Grid */}
        {donations.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
                {totalDonations}
              
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
                  Total Units
                </h3>
              </div>
              <p style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: isDarkMode ? '#f1f5f9' : '#111827'
              }}>
                {totalUnits}
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
                  Total Points
                </h3>
              </div>
              <p style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: isDarkMode ? '#f1f5f9' : '#111827'
              }}>
                {totalPoints}
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
                  Verified
                </h3>
              </div>
              <p style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: isDarkMode ? '#f1f5f9' : '#111827'
              }}>
                {verifiedCount}
              </p>
            </motion.div>
          </div>
        )}

        {/* Donations List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {donations.length === 0 ? (
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
              <Heart style={{
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
                No donation history yet
              </h3>
              <p style={{
                color: isDarkMode ? '#94a3b8' : '#6b7280',
                fontSize: '0.875rem'
              }}>
                Your donation history will appear here once you start donating blood
              </p>
            </motion.div>
          ) : (
            donations.map((donation, index) => (
              <motion.div
                key={donation._id}
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
                    donation.verificationStatus === 'verified' ? '#22c55e'
                    : donation.verificationStatus === 'pending' ? '#eab308'
                    : '#ef4444'
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
                      <Calendar style={{ width: '20px', height: '20px', color: '#dc2626' }} />
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: isDarkMode ? '#f1f5f9' : '#111827',
                        margin: 0
                      }}>
                        {new Date(donation.donationDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h3>
                    </div>
                  </div>

                  <div style={{
                    padding: '0.5rem 1rem',
                    background: donation.verificationStatus === 'verified'
                      ? 'rgba(34, 197, 94, 0.1)'
                      : donation.verificationStatus === 'pending'
                      ? 'rgba(234, 179, 8, 0.1)'
                      : 'rgba(239, 68, 68, 0.1)',
                    color: donation.verificationStatus === 'verified'
                      ? '#22c55e'
                      : donation.verificationStatus === 'pending'
                      ? '#eab308'
                      : '#ef4444',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem'
                  }}>
                    {donation.verificationStatus === 'verified' ? (
                      <CheckCircle style={{ width: '14px', height: '14px' }} />
                    ) : donation.verificationStatus === 'pending' ? (
                      <Clock style={{ width: '14px', height: '14px' }} />
                    ) : (
                      <XCircle style={{ width: '14px', height: '14px' }} />
                    )}
                    {donation.verificationStatus}
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
                        {donation.bloodType || 'N/A'}
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
                      <TrendingUp style={{ width: '16px', height: '16px', color: '#dc2626' }} />
                    </div>
                    <div>
                      <p style={{
                        fontSize: '0.75rem',
                        color: isDarkMode ? '#94a3b8' : '#9ca3af',
                        margin: 0
                      }}>
                        Units Donated
                      </p>
                      <p style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: isDarkMode ? '#f1f5f9' : '#111827',
                        margin: 0
                      }}>
                        {donation.unitsProvided || 0}
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
                      background: 'rgba(234, 179, 8, 0.1)',
                      borderRadius: '8px'
                    }}>
                      <Award style={{ width: '16px', height: '16px', color: '#eab308' }} />
                    </div>
                    <div>
                      <p style={{
                        fontSize: '0.75rem',
                        color: isDarkMode ? '#94a3b8' : '#9ca3af',
                        margin: 0
                      }}>
                        Points Earned
                      </p>
                      <p style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: isDarkMode ? '#f1f5f9' : '#111827',
                        margin: 0
                      }}>
                        {donation.pointsEarned || 0}
                      </p>
                    </div>
                  </div>

                  {donation.donationCenter?.name && (
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
                          Donation Center
                        </p>
                        <p style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: isDarkMode ? '#f1f5f9' : '#111827',
                          margin: 0
                        }}>
                          {donation.donationCenter.name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* View Digital Card Button - Only for verified donations */}
                {donation.verificationStatus === 'verified' && (
                  <div style={{ marginTop: '1.5rem', borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)', paddingTop: '1.5rem' }}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleViewCard(donation)}
                      disabled={loadingCard === donation._id}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '0.9375rem',
                        fontWeight: '600',
                        cursor: loadingCard === donation._id ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                        opacity: loadingCard === donation._id ? 0.6 : 1
                      }}
                    >
                      <CreditCard style={{ width: '20px', height: '20px' }} />
                      {loadingCard === donation._id ? 'Loading Card...' : 'View Digital Donation Card'}
                    </motion.button>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Digital Card Modal */}
      {selectedCard && (
        <DigitalCard
          card={selectedCard}
          onClose={handleCloseCard}
          onRegenerate={handleRegenerate}
        />
      )}
    </div>
  );
};

export default DonationHistory;
