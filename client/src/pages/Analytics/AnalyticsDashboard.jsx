import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { useDarkMode } from '../../context/DarkModeContext';
import { Users, Heart, AlertCircle, Calendar, TrendingUp, Download, FileDown } from 'lucide-react';
import * as analyticsService from '../../services/analyticsService';

const AnalyticsDashboard = () => {
  const { isDarkMode } = useDarkMode();

  // State management
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [donationTrends, setDonationTrends] = useState([]);
  const [requestTrends, setRequestTrends] = useState([]);
  const [bloodGroupAnalysis, setBloodGroupAnalysis] = useState([]);
  const [urgencyDistribution, setUrgencyDistribution] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [exportLoading, setExportLoading] = useState(false);

  // Load all analytics data
  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Load all analytics in parallel
      const [stats, donations, requests, bloodGroups, urgency] = await Promise.all([
        analyticsService.getDashboardStats(),
        analyticsService.getDonationTrends(),
        analyticsService.getRequestTrends(),
        analyticsService.getBloodGroupAnalysis(),
        analyticsService.getUrgencyDistribution()
      ]);

      setDashboardStats(stats.data);
      setDonationTrends(donations.data);
      setRequestTrends(requests.data);
      setBloodGroupAnalysis(bloodGroups.data);
      setUrgencyDistribution(urgency.data);
    } catch (error) {
      console.error('Load analytics error:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Handle CSV export
  const handleExportCSV = async () => {
    try {
      setExportLoading(true);
      await analyticsService.exportCSV(dateRange.startDate, dateRange.endDate);
      toast.success('Analytics exported as CSV');
    } catch (error) {
      toast.error('Failed to export CSV');
    } finally {
      setExportLoading(false);
    }
  };

  // Handle JSON export
  const handleExportJSON = async () => {
    try {
      setExportLoading(true);
      await analyticsService.exportJSON(dateRange.startDate, dateRange.endDate);
      toast.success('Analytics exported as JSON');
    } catch (error) {
      toast.error('Failed to export JSON');
    } finally {
      setExportLoading(false);
    }
  };

  // Handle generate daily analytics
  const handleGenerateAnalytics = async () => {
    if (!window.confirm('Generate daily analytics? This may take a few moments.')) {
      return;
    }
    try {
      setExportLoading(true);
      await analyticsService.generateDailyAnalytics();
      toast.success('Analytics generated successfully');
      // Reload analytics after generation
      setTimeout(() => {
        loadAnalytics();
      }, 1000);
    } catch (error) {
      toast.error(error.error || 'Failed to generate analytics');
    } finally {
      setExportLoading(false);
    }
  };

  // Chart colors
  const COLORS = {
    primary: '#dc2626',
    secondary: '#f59e0b',
    success: '#10b981',
    info: '#3b82f6',
    warning: '#f59e0b',
    danger: '#ef4444'
  };

  const PIE_COLORS = ['#dc2626', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: isDarkMode
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid rgba(220, 38, 38, 0.2)',
          borderTop: '3px solid #dc2626',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
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
          style={{ marginBottom: '2rem' }}
        >
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            Analytics Dashboard
          </h1>
          <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', fontSize: '1rem' }}>
            Comprehensive insights into blood donation platform performance
          </p>
        </motion.div>

        {/* Real-Time Metrics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Total Users */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -4 }}
            style={{
              background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: '0.5rem' }}>
                  Total Users
                </p>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#111827' }}>
                  {dashboardStats?.users?.total || 0}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
                  +{dashboardStats?.users?.new24h || 0} in last 24h
                </p>
              </div>
              <div style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}>
                <Users style={{ width: '28px', height: '28px', color: 'white' }} />
              </div>
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: isDarkMode ? '#64748b' : '#94a3b8' }}>
              {dashboardStats?.users?.donors || 0} Donors | {dashboardStats?.users?.recipients || 0} Recipients
            </div>
          </motion.div>

          {/* Active Requests */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -4 }}
            style={{
              background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: '0.5rem' }}>
                  Active Requests
                </p>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#111827' }}>
                  {dashboardStats?.requests?.pending || 0}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>
                  {dashboardStats?.requests?.critical || 0} critical
                </p>
              </div>
              <div style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
              }}>
                <AlertCircle style={{ width: '28px', height: '28px', color: 'white' }} />
              </div>
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: isDarkMode ? '#64748b' : '#94a3b8' }}>
              {dashboardStats?.requests?.fulfilled24h || 0} fulfilled in last 24h
            </div>
          </motion.div>

          {/* Total Donations (Last 7 Days) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -4 }}
            style={{
              background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: '0.5rem' }}>
                  Donations (7d)
                </p>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#111827' }}>
                  {dashboardStats?.donations?.last7Days || 0}
                </p>
                <p style={{ fontSize: '0.75rem', color: isDarkMode ? '#64748b' : '#94a3b8', marginTop: '0.25rem' }}>
                  {dashboardStats?.donations?.total || 0} total
                </p>
              </div>
              <div style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}>
                <Heart style={{ width: '28px', height: '28px', color: 'white' }} />
              </div>
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: isDarkMode ? '#64748b' : '#94a3b8' }}>
              {dashboardStats?.donations?.pendingVerification || 0} pending verification
            </div>
          </motion.div>

          {/* Upcoming Events */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -4 }}
            style={{
              background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: '0.5rem' }}>
                  Upcoming Events
                </p>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: isDarkMode ? '#f1f5f9' : '#111827' }}>
                  {dashboardStats?.engagement?.upcomingEvents || 0}
                </p>
                <p style={{ fontSize: '0.75rem', color: isDarkMode ? '#64748b' : '#94a3b8', marginTop: '0.25rem' }}>
                  Blood camps scheduled
                </p>
              </div>
              <div style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
              }}>
                <Calendar style={{ width: '28px', height: '28px', color: 'white' }} />
              </div>
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: isDarkMode ? '#64748b' : '#94a3b8' }}>
              {dashboardStats?.engagement?.activeChats || 0} active chats
            </div>
          </motion.div>
        </div>

        {/* Trends Charts */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Donation Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
            }}
          >
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '700',
              color: isDarkMode ? '#f1f5f9' : '#111827',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <TrendingUp style={{ width: '20px', height: '20px', color: '#dc2626' }} />
              Donation Trends (12 Months)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={donationTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                <XAxis dataKey="monthName" stroke={isDarkMode ? '#94a3b8' : '#64748b'} style={{ fontSize: '0.75rem' }} />
                <YAxis stroke={isDarkMode ? '#94a3b8' : '#64748b'} style={{ fontSize: '0.75rem' }} />
                <Tooltip
                  contentStyle={{
                    background: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    color: isDarkMode ? '#f1f5f9' : '#111827'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="count" stroke={COLORS.primary} strokeWidth={3} name="Donations" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="totalUnits" stroke={COLORS.success} strokeWidth={3} name="Units Collected" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Request Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{
              background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
            }}
          >
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '700',
              color: isDarkMode ? '#f1f5f9' : '#111827',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <TrendingUp style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
              Request Trends (12 Months)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={requestTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                <XAxis dataKey="monthName" stroke={isDarkMode ? '#94a3b8' : '#64748b'} style={{ fontSize: '0.75rem' }} />
                <YAxis stroke={isDarkMode ? '#94a3b8' : '#64748b'} style={{ fontSize: '0.75rem' }} />
                <Tooltip
                  contentStyle={{
                    background: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    color: isDarkMode ? '#f1f5f9' : '#111827'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="count" stroke={COLORS.warning} strokeWidth={3} name="Total Requests" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="fulfilled" stroke={COLORS.success} strokeWidth={3} name="Fulfilled" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Blood Group Analysis and Urgency Distribution */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Blood Group Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            style={{
              background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
            }}
          >
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '700',
              color: isDarkMode ? '#f1f5f9' : '#111827',
              marginBottom: '1.5rem'
            }}>
              Blood Group Supply vs Demand
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bloodGroupAnalysis}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                <XAxis dataKey="bloodType" stroke={isDarkMode ? '#94a3b8' : '#64748b'} style={{ fontSize: '0.75rem' }} />
                <YAxis stroke={isDarkMode ? '#94a3b8' : '#64748b'} style={{ fontSize: '0.75rem' }} />
                <Tooltip
                  contentStyle={{
                    background: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    color: isDarkMode ? '#f1f5f9' : '#111827'
                  }}
                />
                <Legend />
                <Bar dataKey="supply" fill={COLORS.success} name="Supply (Available Donors)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="demand" fill={COLORS.danger} name="Demand (Active Requests)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{
              marginTop: '1.5rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.75rem'
            }}>
              {bloodGroupAnalysis.map((group) => (
                <div key={group.bloodType} style={{
                  textAlign: 'center',
                  padding: '0.5rem',
                  background: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(248, 250, 252, 0.8)',
                  borderRadius: '8px'
                }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', color: isDarkMode ? '#f1f5f9' : '#111827' }}>
                    {group.bloodType}
                  </p>
                  <p style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    marginTop: '0.25rem',
                    color: group.status === 'Adequate' ? '#10b981' :
                           group.status === 'Low' ? '#f59e0b' : '#ef4444'
                  }}>
                    {group.status}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Urgency Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            style={{
              background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
            }}
          >
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '700',
              color: isDarkMode ? '#f1f5f9' : '#111827',
              marginBottom: '1.5rem'
            }}>
              Request Urgency Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={urgencyDistribution}
                  dataKey="total"
                  nameKey="urgency"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.urgency}: ${entry.total}`}
                >
                  {urgencyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    color: isDarkMode ? '#f1f5f9' : '#111827'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {urgencyDistribution.map((item) => (
                <div key={item.urgency} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(248, 250, 252, 0.8)',
                  borderRadius: '8px',
                  fontSize: '0.875rem'
                }}>
                  <span style={{ color: isDarkMode ? '#94a3b8' : '#64748b', textTransform: 'capitalize' }}>
                    {item.urgency}:
                  </span>
                  <span style={{ fontWeight: '600', color: isDarkMode ? '#f1f5f9' : '#111827' }}>
                    {item.active} active / {item.total} total ({item.fulfillmentRate}% fulfilled)
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Export Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          style={{
            background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            padding: '1.5rem',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
          }}
        >
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '700',
            color: isDarkMode ? '#f1f5f9' : '#111827',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Download style={{ width: '20px', height: '20px', color: '#dc2626' }} />
            Export Analytics
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '1rem',
            flexWrap: 'wrap',
            alignItems: 'flex-end'
          }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: isDarkMode ? '#cbd5e1' : '#374151',
                marginBottom: '0.5rem'
              }}>
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  background: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: isDarkMode ? '#cbd5e1' : '#374151',
                marginBottom: '0.5rem'
              }}>
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  background: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGenerateAnalytics}
                disabled={exportLoading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: exportLoading ? 'rgba(168, 85, 247, 0.5)' : 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
                  color: 'white',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: exportLoading ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: exportLoading ? 0.6 : 1
                }}
              >
                <TrendingUp style={{ width: '16px', height: '16px' }} />
                {exportLoading ? 'Generating...' : 'Generate Analytics'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExportCSV}
                disabled={exportLoading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: exportLoading ? 'rgba(16, 185, 129, 0.5)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: exportLoading ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: exportLoading ? 0.6 : 1
                }}
              >
                <FileDown style={{ width: '16px', height: '16px' }} />
                {exportLoading ? 'Exporting...' : 'Export CSV'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExportJSON}
                disabled={exportLoading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: exportLoading ? 'rgba(59, 130, 246, 0.5)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: exportLoading ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: exportLoading ? 0.6 : 1
                }}
              >
                <FileDown style={{ width: '16px', height: '16px' }} />
                {exportLoading ? 'Exporting...' : 'Export JSON'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
