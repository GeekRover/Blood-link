import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useDarkMode } from '../context/DarkModeContext';
import { useNavigate } from 'react-router-dom';
import DonorEligibility from '../components/DonorEligibility';
import {
  User, Mail, Phone, Droplet, Calendar, MapPin, Users,
  Heart, Trophy, Activity, Edit, CheckCircle, Clock,
  Shield, Award
} from 'lucide-react';

const Profile = () => {
  const { user, isDonor } = useAuth();
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
              <span style={{ color: isDarkMode ? '#f1f5f9' : '#111827' }}>My </span>
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
              Manage your account information and settings
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/profile/edit')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
            }}
          >
            <Edit style={{ width: '18px', height: '18px' }} />
            Edit Profile
          </motion.button>
        </motion.div>

        {isDonor && <DonorEligibility donorId={user?._id} />}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          marginTop: '2rem'
        }}>
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              padding: '2rem',
              background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(12px)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}
          >
            {/* Avatar */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              style={{
                width: '120px',
                height: '120px',
                margin: '0 auto 1.5rem',
                background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: 'white',
                boxShadow: '0 8px 24px rgba(220, 38, 38, 0.3)',
                border: '4px solid ' + (isDarkMode ? '#1e293b' : '#ffffff')
              }}
            >
              {getInitials(user?.name)}
            </motion.div>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: isDarkMode ? '#f1f5f9' : '#111827',
              marginBottom: '0.5rem'
            }}>
              {user?.name}
            </h2>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              color: 'white',
              borderRadius: '50px',
              fontSize: '0.75rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '1.5rem'
            }}>
              <Users style={{ width: '14px', height: '14px' }} />
              {user?.role}
            </div>

            {/* Verification Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: user?.verificationStatus === 'verified'
                ? 'rgba(34, 197, 94, 0.1)'
                : user?.verificationStatus === 'pending'
                ? 'rgba(234, 179, 8, 0.1)'
                : 'rgba(156, 163, 175, 0.1)',
              border: `1px solid ${
                user?.verificationStatus === 'verified'
                  ? 'rgba(34, 197, 94, 0.3)'
                  : user?.verificationStatus === 'pending'
                  ? 'rgba(234, 179, 8, 0.3)'
                  : 'rgba(156, 163, 175, 0.3)'
              }`,
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: user?.verificationStatus === 'verified'
                ? '#22c55e'
                : user?.verificationStatus === 'pending'
                ? '#eab308'
                : '#9ca3af'
            }}>
              {user?.verificationStatus === 'verified' ? (
                <CheckCircle style={{ width: '18px', height: '18px' }} />
              ) : user?.verificationStatus === 'pending' ? (
                <Clock style={{ width: '18px', height: '18px' }} />
              ) : (
                <Shield style={{ width: '18px', height: '18px' }} />
              )}
              {user?.verificationStatus === 'verified' ? 'Verified Account' : user?.verificationStatus === 'pending' ? 'Pending Verification' : 'Not Verified'}
            </div>
          </motion.div>

          {/* Details Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              padding: '2rem',
              background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(12px)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}
          >
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: isDarkMode ? '#f1f5f9' : '#111827',
              marginBottom: '1.5rem'
            }}>
              Personal Information
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(220, 38, 38, 0.1)',
                  borderRadius: '12px'
                }}>
                  <Mail style={{ width: '20px', height: '20px', color: '#dc2626' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: '0.75rem',
                    color: isDarkMode ? '#94a3b8' : '#9ca3af',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>
                    Email
                  </p>
                  <p style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    margin: 0
                  }}>
                    {user?.email}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(220, 38, 38, 0.1)',
                  borderRadius: '12px'
                }}>
                  <Phone style={{ width: '20px', height: '20px', color: '#dc2626' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: '0.75rem',
                    color: isDarkMode ? '#94a3b8' : '#9ca3af',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>
                    Phone Number
                  </p>
                  <p style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    margin: 0
                  }}>
                    {user?.phone}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(220, 38, 38, 0.1)',
                  borderRadius: '12px'
                }}>
                  <Droplet style={{ width: '20px', height: '20px', color: '#dc2626' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: '0.75rem',
                    color: isDarkMode ? '#94a3b8' : '#9ca3af',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>
                    Blood Type
                  </p>
                  <p style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    margin: 0
                  }}>
                    {user?.bloodType}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(220, 38, 38, 0.1)',
                  borderRadius: '12px'
                }}>
                  <Calendar style={{ width: '20px', height: '20px', color: '#dc2626' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: '0.75rem',
                    color: isDarkMode ? '#94a3b8' : '#9ca3af',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>
                    Date of Birth
                  </p>
                  <p style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    margin: 0
                  }}>
                    {new Date(user?.dateOfBirth).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(220, 38, 38, 0.1)',
                  borderRadius: '12px'
                }}>
                  <User style={{ width: '20px', height: '20px', color: '#dc2626' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: '0.75rem',
                    color: isDarkMode ? '#94a3b8' : '#9ca3af',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>
                    Gender
                  </p>
                  <p style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    margin: 0,
                    textTransform: 'capitalize'
                  }}>
                    {user?.gender}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(220, 38, 38, 0.1)',
                  borderRadius: '12px'
                }}>
                  <MapPin style={{ width: '20px', height: '20px', color: '#dc2626' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: '0.75rem',
                    color: isDarkMode ? '#94a3b8' : '#9ca3af',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>
                    Location
                  </p>
                  <p style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    margin: 0
                  }}>
                    {user?.address?.city || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Donor Stats */}
        {user?.role === 'donor' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              marginTop: '2rem'
            }}
          >
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: isDarkMode ? '#f1f5f9' : '#111827',
              marginBottom: '1rem'
            }}>
              Donor Statistics
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem'
            }}>
              <motion.div
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
                  <h4 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#cbd5e1' : '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    margin: 0
                  }}>
                    Total Donations
                  </h4>
                </div>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  margin: 0
                }}>
                  {user?.totalDonations || 0}
                </p>
              </motion.div>

              <motion.div
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
                    <Award style={{ width: '24px', height: '24px', color: '#eab308' }} />
                  </div>
                  <h4 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#cbd5e1' : '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    margin: 0
                  }}>
                    Badge
                  </h4>
                </div>
                <p style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  margin: 0
                }}>
                  {user?.badge || 'None'}
                </p>
              </motion.div>

              <motion.div
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
                  <h4 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#cbd5e1' : '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    margin: 0
                  }}>
                    Availability
                  </h4>
                </div>
                <p style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: user?.isAvailable ? '#22c55e' : '#9ca3af',
                  margin: 0
                }}>
                  {user?.isAvailable ? 'Available' : 'Unavailable'}
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Profile;
