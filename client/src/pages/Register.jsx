import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useDarkMode } from '../context/DarkModeContext';
import { Heart, Mail, Lock, ArrowRight, User, Phone, Calendar, MapPin, Users } from 'lucide-react';
import { DatePicker } from '../components/ui/date-picker';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { isDarkMode } = useDarkMode();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'donor',
    name: '',
    phone: '',
    dateOfBirth: '',
    gender: 'male',
    bloodType: 'A+',
    city: 'Dhaka',
    latitude: '23.8103',
    longitude: '90.4125',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: ''
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (date) {
      const formattedDate = date.toISOString().split('T')[0];
      setFormData({ ...formData, dateOfBirth: formattedDate });
    } else {
      setFormData({ ...formData, dateOfBirth: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        name: formData.name,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bloodType: formData.bloodType,
        address: {
          city: formData.city,
          country: 'Bangladesh'
        },
        location: {
          type: 'Point',
          coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)]
        }
      };

      if (formData.role === 'recipient') {
        userData.emergencyContact = {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelationship
        };
      }

      await register(userData);
      toast.success('Registration successful! Welcome to BloodLink', {
        icon: '❤️',
        duration: 3000,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      toast.error(err.message || 'Registration failed. Please try again.', {
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
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
        maxWidth: '1000px',
        position: 'relative',
        zIndex: 1
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                borderRadius: '16px',
                boxShadow: '0 10px 40px rgba(220, 38, 38, 0.3)',
                marginBottom: '1rem'
              }}
            >
              <Heart style={{ width: '30px', height: '30px', color: 'white' }} fill="white" />
            </motion.div>

            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '0.5rem'
            }}>
              Join BloodLink
            </h1>
            <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', fontSize: '0.875rem' }}>
              Create an account and start saving lives today
            </p>
          </div>

          {/* Registration Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              padding: '2.5rem',
              borderRadius: '24px',
              background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(12px)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 20px 60px rgba(31, 38, 135, 0.2)'
            }}
          >
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

              {/* Role Selection */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#e2e8f0' : '#374151',
                  marginBottom: '0.5rem'
                }}>
                  I want to register as
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setFormData({ ...formData, role: 'donor' })}
                    style={{
                      padding: '1rem',
                      borderRadius: '12px',
                      border: formData.role === 'donor'
                        ? '2px solid #dc2626'
                        : isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                      background: formData.role === 'donor'
                        ? 'rgba(220, 38, 38, 0.1)'
                        : isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textAlign: 'center'
                    }}
                  >
                    <Heart style={{ width: '24px', height: '24px', color: '#dc2626', margin: '0 auto 0.5rem' }} />
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: isDarkMode ? '#f1f5f9' : '#111827'
                    }}>
                      Donor
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: isDarkMode ? '#cbd5e1' : '#6b7280',
                      marginTop: '0.25rem'
                    }}>
                      Save lives by donating blood
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setFormData({ ...formData, role: 'recipient' })}
                    style={{
                      padding: '1rem',
                      borderRadius: '12px',
                      border: formData.role === 'recipient'
                        ? '2px solid #dc2626'
                        : isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                      background: formData.role === 'recipient'
                        ? 'rgba(220, 38, 38, 0.1)'
                        : isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textAlign: 'center'
                    }}
                  >
                    <Users style={{ width: '24px', height: '24px', color: '#dc2626', margin: '0 auto 0.5rem' }} />
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: isDarkMode ? '#f1f5f9' : '#111827'
                    }}>
                      Recipient
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: isDarkMode ? '#cbd5e1' : '#6b7280',
                      marginTop: '0.25rem'
                    }}>
                      Find donors when you need blood
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Personal Information */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
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
                    Full Name
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
                      name="name"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        height: '45px',
                        paddingLeft: '2.75rem',
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

                <div>
                  <label style={{
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
                      width: '18px',
                      height: '18px',
                      color: '#9ca3af'
                    }} />
                    <input
                      type="email"
                      name="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        height: '45px',
                        paddingLeft: '2.75rem',
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
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
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
                    Phone Number
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '18px',
                      height: '18px',
                      color: '#9ca3af'
                    }} />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="01XXXXXXXXX"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        height: '45px',
                        paddingLeft: '2.75rem',
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

                <div>
                  <label style={{
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
                      width: '18px',
                      height: '18px',
                      color: '#9ca3af'
                    }} />
                    <input
                      type="password"
                      name="password"
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength="6"
                      style={{
                        width: '100%',
                        height: '45px',
                        paddingLeft: '2.75rem',
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
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
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
                    Date of Birth
                  </label>
                  <DatePicker
                    date={selectedDate}
                    onDateChange={handleDateChange}
                    placeholder="Select your birth date"
                    isDarkMode={isDarkMode}
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
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      height: '45px',
                      paddingLeft: '1rem',
                      paddingRight: '1rem',
                      border: isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      transition: 'all 0.3s ease',
                      background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                    onBlur={(e) => e.target.style.borderColor = isDarkMode ? '#334155' : '#e5e7eb'}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
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
                    Blood Type
                  </label>
                  <select
                    name="bloodType"
                    value={formData.bloodType}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      height: '45px',
                      paddingLeft: '1rem',
                      paddingRight: '1rem',
                      border: isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      transition: 'all 0.3s ease',
                      background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                    onBlur={(e) => e.target.style.borderColor = isDarkMode ? '#334155' : '#e5e7eb'}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#e2e8f0' : '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    City
                  </label>
                  <div style={{ position: 'relative' }}>
                    <MapPin style={{
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
                      name="city"
                      placeholder="Your city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        height: '45px',
                        paddingLeft: '2.75rem',
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
              </div>

              {/* Emergency Contact (for recipients) */}
              {formData.role === 'recipient' && (
                <div style={{
                  marginTop: '2rem',
                  padding: '1.5rem',
                  borderRadius: '16px',
                  background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(254, 242, 242, 0.6)',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(220, 38, 38, 0.1)'
                }}>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Users style={{ width: '20px', height: '20px', color: '#dc2626' }} />
                    Emergency Contact
                  </h3>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: isDarkMode ? '#e2e8f0' : '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        Contact Name
                      </label>
                      <input
                        type="text"
                        name="emergencyContactName"
                        placeholder="Full name"
                        value={formData.emergencyContactName}
                        onChange={handleChange}
                        required
                        style={{
                          width: '100%',
                          height: '45px',
                          paddingLeft: '1rem',
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

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: isDarkMode ? '#e2e8f0' : '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        name="emergencyContactPhone"
                        placeholder="Phone number"
                        value={formData.emergencyContactPhone}
                        onChange={handleChange}
                        required
                        style={{
                          width: '100%',
                          height: '45px',
                          paddingLeft: '1rem',
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

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: isDarkMode ? '#e2e8f0' : '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Relationship
                    </label>
                    <input
                      type="text"
                      name="emergencyContactRelationship"
                      placeholder="e.g., Spouse, Parent, Sibling"
                      value={formData.emergencyContactRelationship}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        height: '45px',
                        paddingLeft: '1rem',
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
              )}

              {/* Submit Button */}
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
                  marginTop: '2rem',
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
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight style={{ width: '20px', height: '20px' }} />
                  </>
                )}
              </motion.button>

              <div style={{
                textAlign: 'center',
                fontSize: '0.875rem',
                color: isDarkMode ? '#cbd5e1' : '#6b7280'
              }}>
                Already have an account?{' '}
                <Link to="/login" style={{
                  color: '#dc2626',
                  fontWeight: '600',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                >
                  Login here
                </Link>
              </div>
            </form>

            <p style={{
              textAlign: 'center',
              fontSize: '0.75rem',
              color: isDarkMode ? '#94a3b8' : '#9ca3af',
              marginTop: '1.5rem',
              lineHeight: '1.5'
            }}>
              By creating an account, you agree to our{' '}
              <a href="#" style={{ color: '#dc2626', textDecoration: 'none' }}>Terms</a>
              {' '}and{' '}
              <a href="#" style={{ color: '#dc2626', textDecoration: 'none' }}>Privacy Policy</a>
            </p>
          </motion.div>
        </motion.div>
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
            font-size: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Register;
