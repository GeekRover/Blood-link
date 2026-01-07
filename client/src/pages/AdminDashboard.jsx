import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI, donationAPI } from '../services/api';
import { useDarkMode } from '../context/DarkModeContext';
import {
  Users, UserCheck, Heart, Droplet, AlertCircle, CheckCircle,
  Clock, Calendar, Shield, Activity, TrendingUp, XCircle, BarChart3,
  FileText, RefreshCw, Eye, X, QrCode, Zap, MessageSquare, Star, Lock, Layers,
  BookOpen, CalendarDays
} from 'lucide-react';

const AdminDashboard = () => {
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState(null);
  const [verifying, setVerifying] = useState(null);

  // Modal states
  const [rejectModal, setRejectModal] = useState({ show: false, userId: null, userName: '' });
  const [resubmitModal, setResubmitModal] = useState({ show: false, userId: null, userName: '' });
  const [hospitalIDModal, setHospitalIDModal] = useState({ show: false, user: null });
  const [rejectDonationModal, setRejectDonationModal] = useState({ show: false, donationId: null, donorName: '' });
  const [donationProofModal, setDonationProofModal] = useState({ show: false, donation: null });
  const [rejectReason, setRejectReason] = useState('');
  const [resubmitReason, setResubmitReason] = useState('');
  const [donationRejectReason, setDonationRejectReason] = useState('');

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

  const handleRejectUser = async () => {
    if (!rejectReason || rejectReason.trim().length < 10) {
      toast.error('Please provide a reason (minimum 10 characters)', { icon: '⚠️' });
      return;
    }

    const rejectPromise = adminAPI.rejectUser(rejectModal.userId, { reason: rejectReason });

    toast.promise(
      rejectPromise,
      {
        loading: 'Rejecting user...',
        success: `User ${rejectModal.userName} rejected`,
        error: (err) => `Failed to reject user: ${err.message || 'Unknown error'}`,
      },
      {
        success: { icon: '✅', duration: 3000 },
        error: { icon: '❌', duration: 4000 },
      }
    );

    try {
      await rejectPromise;
      setRejectModal({ show: false, userId: null, userName: '' });
      setRejectReason('');
      fetchPendingVerifications();
      fetchDashboard();
    } catch (error) {
      console.error('Failed to reject user:', error);
    }
  };

  const handleRequestResubmission = async () => {
    if (!resubmitReason || resubmitReason.trim().length < 10) {
      toast.error('Please provide a reason (minimum 10 characters)', { icon: '⚠️' });
      return;
    }

    const resubmitPromise = adminAPI.requestResubmission(resubmitModal.userId, { reason: resubmitReason });

    toast.promise(
      resubmitPromise,
      {
        loading: 'Requesting resubmission...',
        success: `Resubmission requested from ${resubmitModal.userName}`,
        error: (err) => `Failed to request resubmission: ${err.message || 'Unknown error'}`,
      },
      {
        success: { icon: '✅', duration: 3000 },
        error: { icon: '❌', duration: 4000 },
      }
    );

    try {
      await resubmitPromise;
      setResubmitModal({ show: false, userId: null, userName: '' });
      setResubmitReason('');
      fetchPendingVerifications();
    } catch (error) {
      console.error('Failed to request resubmission:', error);
    }
  };

  const handleRejectDonation = async () => {
    if (!donationRejectReason || donationRejectReason.trim().length < 10) {
      toast.error('Please provide a reason (minimum 10 characters)', { icon: '⚠️' });
      return;
    }

    const rejectPromise = donationAPI.reject(rejectDonationModal.donationId, { reason: donationRejectReason });

    toast.promise(
      rejectPromise,
      {
        loading: 'Rejecting donation...',
        success: `Donation from ${rejectDonationModal.donorName} rejected`,
        error: (err) => `Failed to reject donation: ${err.message || 'Unknown error'}`,
      },
      {
        success: { icon: '✅', duration: 3000 },
        error: { icon: '❌', duration: 4000 },
      }
    );

    try {
      await rejectPromise;
      setRejectDonationModal({ show: false, donationId: null, donorName: '' });
      setDonationRejectReason('');
      fetchPendingVerifications();
      fetchDashboard();
    } catch (error) {
      console.error('Failed to reject donation:', error);
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
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin/verifications')}
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
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <UserCheck style={{ width: '1rem', height: '1rem' }} />
              Verifications
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin/donations')}
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
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Droplet style={{ width: '1rem', height: '1rem' }} />
              Donations
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin/badges')}
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
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Activity style={{ width: '1rem', height: '1rem' }} />
              Badges
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin/audit-logs')}
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
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <FileText style={{ width: '1rem', height: '1rem' }} />
              Audit Logs
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin/config')}
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
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Shield style={{ width: '1rem', height: '1rem' }} />
              System Config
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin/scan-qr')}
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
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <QrCode style={{ width: '1rem', height: '1rem' }} />
              Scan QR
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin/fallback')}
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
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Zap style={{ width: '1rem', height: '1rem' }} />
              Fallback System
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin/chat-moderation')}
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
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <MessageSquare style={{ width: '1rem', height: '1rem' }} />
              Chat Moderation
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin/review-moderation')}
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
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Star style={{ width: '1rem', height: '1rem' }} />
              Review Moderation
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin/donation-immutability')}
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
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Lock style={{ width: '1rem', height: '1rem' }} />
              Donation Locks
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin/digital-cards')}
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
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Layers style={{ width: '1rem', height: '1rem' }} />
              Digital Cards
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin/analytics')}
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
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <BarChart3 style={{ width: '1rem', height: '1rem' }} />
              Analytics
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin/blogs')}
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
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <BookOpen style={{ width: '1rem', height: '1rem' }} />
              Blog Manager
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin/events')}
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
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <CalendarDays style={{ width: '1rem', height: '1rem' }} />
              Event Manager
            </motion.button>
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
          </div>
        </motion.div>

        {/* Stats Grid */}
        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
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
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}>
                  <Users style={{ width: '24px', height: '24px', color: 'white' }} />
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
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                }}>
                  <Droplet style={{ width: '24px', height: '24px', color: 'white' }} />
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
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
                }}>
                  <UserCheck style={{ width: '24px', height: '24px', color: 'white' }} />
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
                  background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(234, 179, 8, 0.3)'
                }}>
                  <Clock style={{ width: '24px', height: '24px', color: 'white' }} />
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
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                }}>
                  <AlertCircle style={{ width: '24px', height: '24px', color: 'white' }} />
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
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                }}>
                  <Heart style={{ width: '24px', height: '24px', color: 'white' }} />
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
                        onClick={() => {
                          console.log('[AdminDashboard] User object:', user);
                          console.log('[AdminDashboard] Verification Documents:', user.verificationDocuments);
                          setHospitalIDModal({ show: true, user });
                        }}
                        style={{
                          padding: '0.75rem 1.25rem',
                          background: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                          color: '#3b82f6',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <Eye style={{ width: '16px', height: '16px' }} />
                        View ID
                      </motion.button>
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
                        onClick={() => setResubmitModal({ show: true, userId: user._id, userName: user.name })}
                        style={{
                          padding: '0.75rem 1.25rem',
                          background: isDarkMode ? 'rgba(234, 179, 8, 0.2)' : 'rgba(234, 179, 8, 0.1)',
                          color: '#eab308',
                          border: '1px solid rgba(234, 179, 8, 0.3)',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <RefreshCw style={{ width: '16px', height: '16px' }} />
                        Resubmit
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setRejectModal({ show: true, userId: user._id, userName: user.name })}
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
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setDonationProofModal({ show: true, donation })}
                        style={{
                          padding: '0.75rem 1.25rem',
                          background: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                          color: '#3b82f6',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <Eye style={{ width: '16px', height: '16px' }} />
                        View Proof
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleVerifyDonation(donation._id)}
                        disabled={verifying === donation._id}
                        style={{
                          padding: '0.75rem 1.5rem',
                          background: verifying === donation._id
                            ? isDarkMode ? 'rgba(220, 38, 38, 0.3)' : 'rgba(220, 38, 38, 0.2)'
                            : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: verifying === donation._id ? 'not-allowed' : 'pointer',
                          boxShadow: verifying === donation._id ? 'none' : '0 2px 8px rgba(34, 197, 94, 0.3)',
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
                            Verify
                          </>
                        )}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setRejectDonationModal({ show: true, donationId: donation._id, donorName: donation.donor?.name || 'Unknown' })}
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
      </div>

      {/* Reject User Modal */}
      <AnimatePresence>
        {rejectModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem'
            }}
            onClick={() => setRejectModal({ show: false, userId: null, userName: '' })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: isDarkMode ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '500px',
                width: '100%',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <XCircle style={{ width: '24px', height: '24px', color: '#ef4444' }} />
                  Reject User
                </h3>
                <button
                  onClick={() => setRejectModal({ show: false, userId: null, userName: '' })}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    color: isDarkMode ? '#94a3b8' : '#6b7280'
                  }}
                >
                  <X style={{ width: '20px', height: '20px' }} />
                </button>
              </div>

              <p style={{
                color: isDarkMode ? '#cbd5e1' : '#6b7280',
                marginBottom: '1.5rem'
              }}>
                Rejecting <strong>{rejectModal.userName}</strong>. Please provide a reason:
              </p>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection (minimum 10 characters)..."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '1rem',
                  background: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(248, 250, 252, 0.8)',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  marginBottom: '1.5rem'
                }}
              />

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setRejectModal({ show: false, userId: null, userName: '' })}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: isDarkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(148, 163, 184, 0.3)',
                    color: isDarkMode ? '#cbd5e1' : '#475569',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRejectUser}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  Reject User
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Request Resubmission Modal */}
      <AnimatePresence>
        {resubmitModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem'
            }}
            onClick={() => setResubmitModal({ show: false, userId: null, userName: '' })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: isDarkMode ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '500px',
                width: '100%',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <RefreshCw style={{ width: '24px', height: '24px', color: '#eab308' }} />
                  Request Resubmission
                </h3>
                <button
                  onClick={() => setResubmitModal({ show: false, userId: null, userName: '' })}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    color: isDarkMode ? '#94a3b8' : '#6b7280'
                  }}
                >
                  <X style={{ width: '20px', height: '20px' }} />
                </button>
              </div>

              <p style={{
                color: isDarkMode ? '#cbd5e1' : '#6b7280',
                marginBottom: '1.5rem'
              }}>
                Requesting resubmission from <strong>{resubmitModal.userName}</strong>. Please provide a reason:
              </p>

              <textarea
                value={resubmitReason}
                onChange={(e) => setResubmitReason(e.target.value)}
                placeholder="Enter reason for resubmission (minimum 10 characters)..."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '1rem',
                  background: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(248, 250, 252, 0.8)',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  marginBottom: '1.5rem'
                }}
              />

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setResubmitModal({ show: false, userId: null, userName: '' })}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: isDarkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(148, 163, 184, 0.3)',
                    color: isDarkMode ? '#cbd5e1' : '#475569',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRequestResubmission}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(234, 179, 8, 0.3)'
                  }}
                >
                  Request Resubmission
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hospital ID Viewer Modal */}
      <AnimatePresence>
        {hospitalIDModal.show && hospitalIDModal.user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem'
            }}
            onClick={() => setHospitalIDModal({ show: false, user: null })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: isDarkMode ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '700px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <FileText style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
                  Hospital ID - {hospitalIDModal.user.name}
                </h3>
                <button
                  onClick={() => setHospitalIDModal({ show: false, user: null })}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    color: isDarkMode ? '#94a3b8' : '#6b7280'
                  }}
                >
                  <X style={{ width: '20px', height: '20px' }} />
                </button>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  background: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(248, 250, 252, 0.5)',
                  borderRadius: '12px'
                }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: isDarkMode ? '#94a3b8' : '#6b7280', marginBottom: '0.25rem' }}>Name</p>
                    <p style={{ fontSize: '0.9375rem', fontWeight: '600', color: isDarkMode ? '#f1f5f9' : '#111827' }}>{hospitalIDModal.user.name}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: isDarkMode ? '#94a3b8' : '#6b7280', marginBottom: '0.25rem' }}>Email</p>
                    <p style={{ fontSize: '0.9375rem', fontWeight: '600', color: isDarkMode ? '#f1f5f9' : '#111827' }}>{hospitalIDModal.user.email}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: isDarkMode ? '#94a3b8' : '#6b7280', marginBottom: '0.25rem' }}>Role</p>
                    <p style={{
                      fontSize: '0.9375rem',
                      fontWeight: '600',
                      color: hospitalIDModal.user.role === 'donor' ? '#dc2626' : '#22c55e',
                      textTransform: 'capitalize'
                    }}>{hospitalIDModal.user.role}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: isDarkMode ? '#94a3b8' : '#6b7280', marginBottom: '0.25rem' }}>Blood Type</p>
                    <p style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#dc2626' }}>{hospitalIDModal.user.bloodType}</p>
                  </div>
                </div>

                {hospitalIDModal.user.verificationDocuments && hospitalIDModal.user.verificationDocuments.length > 0 && hospitalIDModal.user.verificationDocuments[0].documentUrl ? (
                  <div style={{
                    background: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(248, 250, 252, 0.8)',
                    borderRadius: '12px',
                    padding: '1rem',
                    textAlign: 'center'
                  }}>
                    <img
                      src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${hospitalIDModal.user.verificationDocuments[0].documentUrl}`}
                      alt="Hospital ID"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '500px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div style={{ display: 'none', padding: '2rem', color: isDarkMode ? '#ef4444' : '#dc2626' }}>
                      <AlertCircle style={{ width: '48px', height: '48px', margin: '0 auto 1rem' }} />
                      <p>Failed to load hospital ID image</p>
                      <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Path: {hospitalIDModal.user.verificationDocuments[0].documentUrl}</p>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(248, 250, 252, 0.8)',
                    borderRadius: '12px',
                    padding: '3rem 2rem',
                    textAlign: 'center',
                    color: isDarkMode ? '#94a3b8' : '#6b7280'
                  }}>
                    <FileText style={{ width: '48px', height: '48px', margin: '0 auto 1rem', color: isDarkMode ? '#475569' : '#cbd5e1' }} />
                    <p>No hospital ID uploaded</p>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setHospitalIDModal({ show: false, user: null })}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: isDarkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(148, 163, 184, 0.3)',
                    color: isDarkMode ? '#cbd5e1' : '#475569',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Donation Modal */}
      <AnimatePresence>
        {rejectDonationModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem'
            }}
            onClick={() => setRejectDonationModal({ show: false, donationId: null, donorName: '' })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: isDarkMode ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '500px',
                width: '100%',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <XCircle style={{ width: '24px', height: '24px', color: '#ef4444' }} />
                  Reject Donation
                </h3>
                <button
                  onClick={() => setRejectDonationModal({ show: false, donationId: null, donorName: '' })}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    color: isDarkMode ? '#94a3b8' : '#6b7280'
                  }}
                >
                  <X style={{ width: '20px', height: '20px' }} />
                </button>
              </div>

              <p style={{
                color: isDarkMode ? '#cbd5e1' : '#6b7280',
                marginBottom: '1.5rem'
              }}>
                Rejecting donation from <strong>{rejectDonationModal.donorName}</strong>. Please provide a reason:
              </p>

              <textarea
                value={donationRejectReason}
                onChange={(e) => setDonationRejectReason(e.target.value)}
                placeholder="Enter reason for rejection (minimum 10 characters)..."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '1rem',
                  background: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(248, 250, 252, 0.8)',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  marginBottom: '1.5rem'
                }}
              />

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setRejectDonationModal({ show: false, donationId: null, donorName: '' })}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: isDarkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(148, 163, 184, 0.3)',
                    color: isDarkMode ? '#cbd5e1' : '#475569',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRejectDonation}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  Reject Donation
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Donation Proof Modal */}
      <AnimatePresence>
        {donationProofModal.show && donationProofModal.donation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem'
            }}
            onClick={() => setDonationProofModal({ show: false, donation: null })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: isDarkMode ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '700px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <FileText style={{ width: '24px', height: '24px', color: '#dc2626' }} />
                  Donation Proof - {donationProofModal.donation.donor?.name}
                </h3>
                <button
                  onClick={() => setDonationProofModal({ show: false, donation: null })}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    color: isDarkMode ? '#94a3b8' : '#6b7280'
                  }}
                >
                  <X style={{ width: '20px', height: '20px' }} />
                </button>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  background: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(248, 250, 252, 0.5)',
                  borderRadius: '12px'
                }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: isDarkMode ? '#94a3b8' : '#6b7280', marginBottom: '0.25rem' }}>Donor</p>
                    <p style={{ fontSize: '0.9375rem', fontWeight: '600', color: isDarkMode ? '#f1f5f9' : '#111827' }}>{donationProofModal.donation.donor?.name}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: isDarkMode ? '#94a3b8' : '#6b7280', marginBottom: '0.25rem' }}>Date</p>
                    <p style={{ fontSize: '0.9375rem', fontWeight: '600', color: isDarkMode ? '#f1f5f9' : '#111827' }}>
                      {new Date(donationProofModal.donation.donationDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: isDarkMode ? '#94a3b8' : '#6b7280', marginBottom: '0.25rem' }}>Blood Type</p>
                    <p style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#dc2626' }}>{donationProofModal.donation.bloodType}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: isDarkMode ? '#94a3b8' : '#6b7280', marginBottom: '0.25rem' }}>Units</p>
                    <p style={{ fontSize: '0.9375rem', fontWeight: '600', color: isDarkMode ? '#f1f5f9' : '#111827' }}>{donationProofModal.donation.unitsProvided}</p>
                  </div>
                  {donationProofModal.donation.donationCenter && (
                    <div>
                      <p style={{ fontSize: '0.75rem', color: isDarkMode ? '#94a3b8' : '#6b7280', marginBottom: '0.25rem' }}>Center</p>
                      <p style={{ fontSize: '0.9375rem', fontWeight: '600', color: isDarkMode ? '#f1f5f9' : '#111827' }}>{donationProofModal.donation.donationCenter.name}</p>
                    </div>
                  )}
                </div>

                {donationProofModal.donation.donationProof && donationProofModal.donation.donationProof.documentUrl ? (
                  <div style={{
                    background: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(248, 250, 252, 0.8)',
                    borderRadius: '12px',
                    padding: '1rem',
                    textAlign: 'center'
                  }}>
                    <img
                      src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${donationProofModal.donation.donationProof.documentUrl}`}
                      alt="Donation Proof"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '500px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div style={{ display: 'none', padding: '2rem', color: isDarkMode ? '#ef4444' : '#dc2626' }}>
                      <AlertCircle style={{ width: '48px', height: '48px', margin: '0 auto 1rem' }} />
                      <p>Failed to load donation proof image</p>
                      <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Path: {donationProofModal.donation.donationProof.documentUrl}</p>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(248, 250, 252, 0.8)',
                    borderRadius: '12px',
                    padding: '3rem 2rem',
                    textAlign: 'center',
                    color: isDarkMode ? '#94a3b8' : '#6b7280'
                  }}>
                    <FileText style={{ width: '48px', height: '48px', margin: '0 auto 1rem', color: isDarkMode ? '#475569' : '#cbd5e1' }} />
                    <p>No donation proof uploaded</p>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDonationProofModal({ show: false, donation: null })}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: isDarkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(148, 163, 184, 0.3)',
                    color: isDarkMode ? '#cbd5e1' : '#475569',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
