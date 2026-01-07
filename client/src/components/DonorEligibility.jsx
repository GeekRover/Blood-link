import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { donorAPI } from '../services/api';
import { useDarkMode } from '../context/DarkModeContext';

const DonorEligibility = ({ donorId }) => {
  const { isDarkMode } = useDarkMode();
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    if (donorId) {
      fetchEligibility();
    }
  }, [donorId]);

  // Countdown timer that updates every hour
  useEffect(() => {
    if (!eligibility?.nextEligibleDate || eligibility?.eligible) {
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const nextDate = new Date(eligibility.nextEligibleDate);
      const diffMs = nextDate - now;

      if (diffMs <= 0) {
        // Time is up, re-fetch eligibility
        fetchEligibility();
        return;
      }

      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setCountdown({
        days: diffDays,
        hours: diffHours,
        minutes: diffMinutes,
        seconds: diffSeconds,
        totalMs: diffMs
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000); // Update every second for real-time countdown

    return () => clearInterval(interval);
  }, [eligibility?.nextEligibleDate, eligibility?.eligible]);

  const fetchEligibility = async () => {
    try {
      setLoading(true);
      const response = await donorAPI.checkEligibility(donorId);
      setEligibility(response.data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to check eligibility');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
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
        <h3 style={{ color: isDarkMode ? '#f1f5f9' : '#111827' }}>🩸 Donation Eligibility Status</h3>
        <p style={{ color: isDarkMode ? '#94a3b8' : '#6b7280' }}>Checking eligibility...</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
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
        <h3 style={{ color: isDarkMode ? '#f1f5f9' : '#111827' }}>🩸 Donation Eligibility Status</h3>
        <div style={{
          padding: '1rem',
          background: 'rgba(220, 38, 38, 0.1)',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          borderRadius: '12px',
          color: '#dc2626'
        }}>
          {error}
        </div>
      </motion.div>
    );
  }

  if (!eligibility) {
    return null;
  }

  return (
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
      <h3 style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: isDarkMode ? '#f1f5f9' : '#111827',
        marginBottom: '1.5rem'
      }}>
        🩸 Donation Eligibility Status
      </h3>

      {eligibility.eligible ? (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            background: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(220, 252, 231, 0.8)',
            border: isDarkMode ? '2px solid rgba(34, 197, 94, 0.3)' : '2px solid #16a34a',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '2rem' }}>✅</span>
            <strong style={{
              color: isDarkMode ? '#86efac' : '#166534',
              fontSize: '1.25rem'
            }}>
              Eligible to Donate
            </strong>
          </div>
          <p style={{
            color: isDarkMode ? '#86efac' : '#166534',
            margin: 0,
            fontSize: '1rem',
            lineHeight: '1.6'
          }}>
            {eligibility.isFirstTime
              ? 'You are a first-time donor. Thank you for saving lives!'
              : `You can donate blood now. It's been ${eligibility.daysSinceLastDonation} days since your last donation.`}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            background: isDarkMode ? 'rgba(220, 38, 38, 0.1)' : 'rgba(254, 226, 226, 0.8)',
            border: isDarkMode ? '2px solid rgba(220, 38, 38, 0.3)' : '2px solid #dc2626',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '2rem' }}>❌</span>
            <strong style={{
              color: isDarkMode ? '#fca5a5' : '#991b1b',
              fontSize: '1.25rem'
            }}>
              Not Eligible
            </strong>
          </div>
          <p style={{
            color: isDarkMode ? '#fca5a5' : '#991b1b',
            marginBottom: '0.75rem',
            fontSize: '1rem'
          }}>
            <strong>Reason:</strong> {eligibility.reason}
          </p>

          {eligibility.daysSinceLastDonation !== null && eligibility.daysRemaining && (
            <>
              <p style={{
                color: isDarkMode ? '#fca5a5' : '#991b1b',
                marginBottom: '0.5rem',
                fontSize: '0.875rem'
              }}>
                Days since last donation: <strong>{eligibility.daysSinceLastDonation} days</strong>
              </p>
              <p style={{
                color: isDarkMode ? '#fca5a5' : '#991b1b',
                marginBottom: '1rem',
                fontSize: '0.875rem'
              }}>
                Days remaining: <strong>{eligibility.daysRemaining} days</strong>
              </p>
            </>
          )}

          {/* Countdown Timer */}
          {countdown && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(243, 244, 246, 0.8)',
                border: isDarkMode ? '2px solid rgba(220, 38, 38, 0.2)' : '2px solid rgba(220, 38, 38, 0.2)',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1rem'
              }}
            >
              <p style={{
                color: isDarkMode ? '#cbd5e1' : '#6b7280',
                fontSize: '0.875rem',
                margin: '0 0 1rem 0',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                ⏱️ Time Until Next Donation
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                gap: '0.75rem'
              }}>
                {/* Days */}
                <motion.div
                  key={`days-${countdown.days}`}
                  initial={{ scale: 1 }}
                  animate={{ scale: 1 }}
                  style={{
                    textAlign: 'center',
                    padding: '1rem 0.75rem',
                    background: isDarkMode ? 'rgba(220, 38, 38, 0.15)' : 'rgba(254, 226, 226, 0.9)',
                    borderRadius: '10px',
                    border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid rgba(220, 38, 38, 0.2)'
                  }}
                >
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#dc2626',
                    fontVariantNumeric: 'tabular-nums'
                  }}>
                    {String(countdown.days).padStart(2, '0')}
                  </div>
                  <div style={{
                    fontSize: '0.65rem',
                    color: isDarkMode ? '#fca5a5' : '#991b1b',
                    marginTop: '0.375rem',
                    fontWeight: '700',
                    letterSpacing: '0.05em'
                  }}>
                    DAYS
                  </div>
                </motion.div>

                {/* Hours */}
                <motion.div
                  key={`hours-${countdown.hours}`}
                  initial={{ scale: 1 }}
                  animate={{ scale: 1 }}
                  style={{
                    textAlign: 'center',
                    padding: '1rem 0.75rem',
                    background: isDarkMode ? 'rgba(220, 38, 38, 0.15)' : 'rgba(254, 226, 226, 0.9)',
                    borderRadius: '10px',
                    border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid rgba(220, 38, 38, 0.2)'
                  }}
                >
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#dc2626',
                    fontVariantNumeric: 'tabular-nums'
                  }}>
                    {String(countdown.hours).padStart(2, '0')}
                  </div>
                  <div style={{
                    fontSize: '0.65rem',
                    color: isDarkMode ? '#fca5a5' : '#991b1b',
                    marginTop: '0.375rem',
                    fontWeight: '700',
                    letterSpacing: '0.05em'
                  }}>
                    HRS
                  </div>
                </motion.div>

                {/* Minutes */}
                <motion.div
                  key={`minutes-${countdown.minutes}`}
                  initial={{ scale: 1 }}
                  animate={{ scale: 1 }}
                  style={{
                    textAlign: 'center',
                    padding: '1rem 0.75rem',
                    background: isDarkMode ? 'rgba(220, 38, 38, 0.15)' : 'rgba(254, 226, 226, 0.9)',
                    borderRadius: '10px',
                    border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid rgba(220, 38, 38, 0.2)'
                  }}
                >
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#dc2626',
                    fontVariantNumeric: 'tabular-nums'
                  }}>
                    {String(countdown.minutes).padStart(2, '0')}
                  </div>
                  <div style={{
                    fontSize: '0.65rem',
                    color: isDarkMode ? '#fca5a5' : '#991b1b',
                    marginTop: '0.375rem',
                    fontWeight: '700',
                    letterSpacing: '0.05em'
                  }}>
                    MINS
                  </div>
                </motion.div>

                {/* Seconds */}
                <motion.div
                  key={`seconds-${countdown.seconds}`}
                  initial={{ scale: 1 }}
                  animate={{ scale: 1 }}
                  style={{
                    textAlign: 'center',
                    padding: '1rem 0.75rem',
                    background: isDarkMode ? 'rgba(220, 38, 38, 0.15)' : 'rgba(254, 226, 226, 0.9)',
                    borderRadius: '10px',
                    border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid rgba(220, 38, 38, 0.2)'
                  }}
                >
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#dc2626',
                    fontVariantNumeric: 'tabular-nums'
                  }}>
                    {String(countdown.seconds).padStart(2, '0')}
                  </div>
                  <div style={{
                    fontSize: '0.65rem',
                    color: isDarkMode ? '#fca5a5' : '#991b1b',
                    marginTop: '0.375rem',
                    fontWeight: '700',
                    letterSpacing: '0.05em'
                  }}>
                    SECS
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {eligibility.nextEligibleDate && (
            <p style={{
              color: isDarkMode ? '#fca5a5' : '#991b1b',
              margin: 0,
              fontSize: '0.875rem'
            }}>
              You can donate again on: <strong>{new Date(eligibility.nextEligibleDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short'
              })}</strong>
            </p>
          )}
        </motion.div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '1.5rem',
        padding: '1.5rem',
        background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(243, 244, 246, 0.6)',
        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
        borderRadius: '12px'
      }}>
        <div>
          <strong style={{
            display: 'block',
            color: isDarkMode ? '#94a3b8' : '#6b7280',
            fontSize: '0.875rem',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Required Wait Period
          </strong>
          <span style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#dc2626'
          }}>
            90 Days
          </span>
        </div>

        {eligibility.lastDonationDate && (
          <div>
            <strong style={{
              display: 'block',
              color: isDarkMode ? '#94a3b8' : '#6b7280',
              fontSize: '0.875rem',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Last Donation
            </strong>
            <span style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              color: isDarkMode ? '#f1f5f9' : '#111827'
            }}>
              {new Date(eligibility.lastDonationDate).toLocaleDateString()}
            </span>
          </div>
        )}

        {eligibility.daysSinceLastDonation !== null && !eligibility.isFirstTime && (
          <div>
            <strong style={{
              display: 'block',
              color: isDarkMode ? '#94a3b8' : '#6b7280',
              fontSize: '0.875rem',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Days Since Last Donation
            </strong>
            <span style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: eligibility.daysSinceLastDonation >= 90
                ? '#22c55e'
                : '#dc2626'
            }}>
              {eligibility.daysSinceLastDonation}
            </span>
          </div>
        )}
      </div>

      <div style={{
        padding: '1.25rem',
        background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 246, 255, 0.8)',
        border: isDarkMode ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: '12px',
        fontSize: '0.875rem'
      }}>
        <strong style={{
          color: isDarkMode ? '#93c5fd' : '#1e40af',
          fontSize: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          ℹ️ Important:
        </strong>
        <p style={{
          margin: '0.75rem 0 0 0',
          color: isDarkMode ? '#bfdbfe' : '#1e3a8a',
          lineHeight: '1.6'
        }}>
          For your safety and health, blood donors must wait at least 90 days (approximately 3 months) between donations.
          This allows your body to fully replenish red blood cells and maintain optimal health.
        </p>
      </div>
    </motion.div>
  );
};

export default DonorEligibility;
