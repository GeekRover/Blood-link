import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useDarkMode } from '../context/DarkModeContext';
import { Heart, Mail, Lock, ArrowRight, User, Users } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isDarkMode } = useDarkMode();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData);
      toast.success('Login successful! Welcome back to BloodLink', {
        icon: '❤️',
        duration: 3000,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      toast.error(err.message || 'Login failed. Please check your credentials and try again.', {
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (email, password) => {
    setFormData({ email, password });
    toast.success('Demo credentials filled! Click "Sign In" to continue', {
      icon: '🩸',
      duration: 2000,
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isDarkMode
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1e293b 100%)'
        : 'linear-gradient(135deg, #fef2f2 0%, #ffffff 50%, #fee2e2 100%)',
      backgroundAttachment: 'fixed',
      padding: '2rem 1rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Blobs */}
      <div style={{
        position: 'absolute',
        top: '-10rem',
        right: '-10rem',
        width: '30rem',
        height: '30rem',
        background: 'rgba(220, 38, 38, 0.1)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'float 8s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10rem',
        left: '-10rem',
        width: '30rem',
        height: '30rem',
        background: 'rgba(239, 68, 68, 0.1)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'float 10s ease-in-out infinite reverse'
      }} />

      <div style={{
        width: '100%',
        maxWidth: '900px',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          alignItems: 'center'
        }}>
          {/* Left Side - Branding */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', padding: '2rem' }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                borderRadius: '20px',
                boxShadow: '0 10px 40px rgba(220, 38, 38, 0.3)',
                marginBottom: '1.5rem'
              }}
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <Heart style={{ width: '40px', height: '40px', color: 'white' }} fill="white" />
              </motion.div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '1rem'
              }}
            >
              BloodLink
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{
                fontSize: '1.125rem',
                color: isDarkMode ? '#cbd5e1' : '#6b7280',
                marginBottom: '2rem',
                lineHeight: '1.6'
              }}
            >
              Connecting donors with those in need, saving lives one donation at a time.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginTop: '2rem'
              }}
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                style={{
                  padding: '1.5rem',
                  textAlign: 'center',
                  background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(12px)',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)'
                }}
              >
                <Users style={{ width: '32px', height: '32px', color: '#dc2626', margin: '0 auto 0.5rem' }} />
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>10K+</div>
                <div style={{ fontSize: '0.875rem', color: isDarkMode ? '#cbd5e1' : '#6b7280' }}>Active Donors</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                style={{
                  padding: '1.5rem',
                  textAlign: 'center',
                  background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(12px)',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)'
                }}
              >
                <Heart style={{ width: '32px', height: '32px', color: '#dc2626', margin: '0 auto 0.5rem' }} />
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>50K+</div>
                <div style={{ fontSize: '0.875rem', color: isDarkMode ? '#cbd5e1' : '#6b7280' }}>Lives Saved</div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right Side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              padding: '2.5rem',
              borderRadius: '24px',
              background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(12px)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 20px 60px rgba(31, 38, 135, 0.2)'
            }}
          >
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: isDarkMode ? '#f1f5f9' : '#111827',
                marginBottom: '0.5rem'
              }}>
                Welcome Back
              </h2>
              <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', fontSize: '0.875rem' }}>
                Sign in to access your account and continue saving lives
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{
                    background: '#fee2e2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    marginBottom: '1.5rem',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                  {error}
                </motion.div>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="email" style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#e2e8f0' : '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '20px',
                    height: '20px',
                    color: '#9ca3af'
                  }} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@bloodlink.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      height: '50px',
                      paddingLeft: '3rem',
                      paddingRight: '1rem',
                      border: isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      transition: 'all 0.3s ease',
                      background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                    onBlur={(e) => e.target.style.borderColor = isDarkMode ? '#334155' : '#e5e7eb'}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label htmlFor="password" style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#e2e8f0' : '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '20px',
                    height: '20px',
                    color: '#9ca3af'
                  }} />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      height: '50px',
                      paddingLeft: '3rem',
                      paddingRight: '1rem',
                      border: isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      transition: 'all 0.3s ease',
                      background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                    onBlur={(e) => e.target.style.borderColor = isDarkMode ? '#334155' : '#e5e7eb'}
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                className="glass-button"
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                style={{
                  width: '100%',
                  height: '50px',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.5rem',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight style={{ width: '20px', height: '20px' }} />
                  </>
                )}
              </motion.button>

              <div style={{
                textAlign: 'center',
                fontSize: '0.875rem',
                color: isDarkMode ? '#cbd5e1' : '#6b7280',
                marginBottom: '1.5rem'
              }}>
                Don't have an account?{' '}
                <Link to="/register" style={{
                  color: '#dc2626',
                  fontWeight: '600',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                >
                  Sign up here
                </Link>
              </div>

              {/* Demo Credentials */}
              <div style={{
                borderTop: isDarkMode ? '1px solid #334155' : '1px solid #e5e7eb',
                paddingTop: '1.5rem'
              }}>
                <p style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#cbd5e1' : '#6b7280',
                  marginBottom: '1rem',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Demo Credentials
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('admin@bloodlink.com', 'Admin@123')}
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1e40af' }}>
                        Admin Account
                      </span>
                    </div>
                    <code style={{
                      fontSize: '0.75rem',
                      color: '#3b82f6',
                      background: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px'
                    }}>
                      Click to fill
                    </code>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('donor1@example.com', 'Donor@123')}
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'rgba(220, 38, 38, 0.1)',
                      border: '1px solid rgba(220, 38, 38, 0.2)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(220, 38, 38, 0.15)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Heart style={{ width: '16px', height: '16px', color: '#dc2626' }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#991b1b' }}>
                        Donor Account
                      </span>
                    </div>
                    <code style={{
                      fontSize: '0.75rem',
                      color: '#dc2626',
                      background: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px'
                    }}>
                      Click to fill
                    </code>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('recipient1@example.com', 'Recipient@123')}
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.2)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(34, 197, 94, 0.15)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User style={{ width: '16px', height: '16px', color: '#16a34a' }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#166534' }}>
                        Recipient Account
                      </span>
                    </div>
                    <code style={{
                      fontSize: '0.75rem',
                      color: '#16a34a',
                      background: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px'
                    }}>
                      Click to fill
                    </code>
                  </button>
                </div>
              </div>
            </form>

            <p style={{
              textAlign: 'center',
              fontSize: '0.75rem',
              color: isDarkMode ? '#94a3b8' : '#9ca3af',
              marginTop: '1.5rem',
              lineHeight: '1.5'
            }}>
              By signing in, you agree to our{' '}
              <a href="#" style={{ color: '#dc2626', textDecoration: 'none' }}>Terms</a>
              {' '}and{' '}
              <a href="#" style={{ color: '#dc2626', textDecoration: 'none' }}>Privacy Policy</a>
            </p>
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          h1 {
            font-size: 2.5rem !important;
          }

          h2 {
            font-size: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
