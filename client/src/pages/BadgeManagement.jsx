import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { badgeAPI, adminAPI } from '../services/api';
import { useDarkMode } from '../context/DarkModeContext';
import {
  Medal, Plus, Edit2, Trash2, X, Award, User, History,
  Users, TrendingUp, Search
} from 'lucide-react';

const BadgeManagement = () => {
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [badges, setBadges] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState({ show: false, badge: null });
  const [showAssignModal, setShowAssignModal] = useState({ show: false, badge: null });
  const [showHistoryModal, setShowHistoryModal] = useState({ show: false, history: [], badgeName: '' });
  const [showStatsModal, setShowStatsModal] = useState({ show: false, stats: null });

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    iconUrl: '',
    criteria: '',
    rarity: 'common'
  });
  const [assignData, setAssignData] = useState({
    userId: '',
    reason: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [badgesData, usersData] = await Promise.all([
        badgeAPI.getAllBadges(),
        adminAPI.getAllUsers()
      ]);
      setBadges(badgesData.data || []);
      setUsers(usersData.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data', { icon: '❌' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBadge = async () => {
    if (!formData.name || !formData.description) {
      toast.error('Name and description are required', { icon: '⚠️' });
      return;
    }

    const createPromise = badgeAPI.createBadge(formData);

    toast.promise(
      createPromise,
      {
        loading: 'Creating badge...',
        success: 'Badge created successfully! ✅',
        error: (err) => `Failed: ${err.message || 'Unknown error'}`,
      },
      { success: { icon: '✅', duration: 3000 }, error: { icon: '❌', duration: 4000 } }
    );

    try {
      await createPromise;
      setShowCreateModal(false);
      setFormData({ name: '', description: '', iconUrl: '', criteria: '', rarity: 'common' });
      fetchData();
    } catch (error) {
      console.error('Failed to create badge:', error);
    }
  };

  const handleUpdateBadge = async () => {
    if (!formData.name || !formData.description) {
      toast.error('Name and description are required', { icon: '⚠️' });
      return;
    }

    const updatePromise = badgeAPI.updateBadge(showEditModal.badge._id, formData);

    toast.promise(
      updatePromise,
      {
        loading: 'Updating badge...',
        success: 'Badge updated successfully! ✅',
        error: (err) => `Failed: ${err.message || 'Unknown error'}`,
      },
      { success: { icon: '✅', duration: 3000 }, error: { icon: '❌', duration: 4000 } }
    );

    try {
      await updatePromise;
      setShowEditModal({ show: false, badge: null });
      setFormData({ name: '', description: '', iconUrl: '', criteria: '', rarity: 'common' });
      fetchData();
    } catch (error) {
      console.error('Failed to update badge:', error);
    }
  };

  const handleDeleteBadge = async (badgeId) => {
    if (!window.confirm('Are you sure you want to delete this badge?')) return;

    const deletePromise = badgeAPI.deleteBadge(badgeId);

    toast.promise(
      deletePromise,
      {
        loading: 'Deleting badge...',
        success: 'Badge deleted successfully! ✅',
        error: (err) => `Failed: ${err.message || 'Unknown error'}`,
      },
      { success: { icon: '✅', duration: 3000 }, error: { icon: '❌', duration: 4000 } }
    );

    try {
      await deletePromise;
      fetchData();
    } catch (error) {
      console.error('Failed to delete badge:', error);
    }
  };

  const handleAssignBadge = async () => {
    if (!assignData.userId || !assignData.reason) {
      toast.error('User and reason are required', { icon: '⚠️' });
      return;
    }

    const assignPromise = badgeAPI.assignBadge({
      userId: assignData.userId,
      badgeId: showAssignModal.badge._id,
      reason: assignData.reason
    });

    toast.promise(
      assignPromise,
      {
        loading: 'Assigning badge...',
        success: 'Badge assigned successfully! ✅',
        error: (err) => `Failed: ${err.message || 'Unknown error'}`,
      },
      { success: { icon: '✅', duration: 3000 }, error: { icon: '❌', duration: 4000 } }
    );

    try {
      await assignPromise;
      setShowAssignModal({ show: false, badge: null });
      setAssignData({ userId: '', reason: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to assign badge:', error);
    }
  };

  const handleViewHistory = async (badgeId) => {
    try {
      const data = await badgeAPI.getBadgeHistory(badgeId);
      const badge = badges.find(b => b._id === badgeId);
      setShowHistoryModal({ show: true, history: data.data || [], badgeName: badge?.name });
    } catch (error) {
      console.error('Failed to fetch history:', error);
      toast.error('Failed to load history', { icon: '❌' });
    }
  };

  const handleViewStats = async () => {
    try {
      const data = await badgeAPI.getBadgeStats();
      setShowStatsModal({ show: true, stats: data.data });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Failed to load statistics', { icon: '❌' });
    }
  };

  const filteredBadges = badges.filter(badge =>
    badge.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    badge.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <Medal style={{ width: '32px', height: '32px', color: '#f59e0b' }} />
              Badge Management
            </h1>
            <p style={{
              color: isDarkMode ? '#cbd5e1' : '#6b7280',
              fontSize: '0.875rem'
            }}>
              Create, manage, and assign badges to reward users
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={handleViewStats}
              style={{
                padding: '0.5rem 1.5rem',
                background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                color: isDarkMode ? '#f1f5f9' : '#111827',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <TrendingUp style={{ width: '1rem', height: '1rem' }} />
              Statistics
            </motion.button>
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
                cursor: 'pointer'
              }}
            >
              Back to Dashboard
            </motion.button>
          </div>
        </motion.div>

        {/* Search and Create */}
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
            placeholder="Search badges..."
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
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
            }}
          >
            <Plus style={{ width: '1rem', height: '1rem' }} />
            Create Badge
          </motion.button>
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: `3px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              borderTopColor: '#f59e0b',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', marginTop: '1rem' }}>
              Loading badges...
            </p>
          </div>
        ) : filteredBadges.length === 0 ? (
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
            <Medal style={{ width: '48px', height: '48px', margin: '0 auto 1rem', color: '#9ca3af' }} />
            <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', fontSize: '1rem' }}>
              {searchTerm ? 'No badges found matching your search' : 'No badges created yet'}
            </p>
          </motion.div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            <AnimatePresence>
              {filteredBadges.map((badge, index) => (
                <motion.div
                  key={badge._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  style={{
                    padding: '1.5rem',
                    background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(12px)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  whileHover={{ scale: 1.02 }}
                >
                  {/* Badge Icon/Image */}
                  {badge.iconUrl && (
                    <div style={{
                      width: '100px',
                      height: '100px',
                      margin: '0 auto 1rem',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      <img src={badge.iconUrl} alt={badge.name} style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }} />
                    </div>
                  )}

                  {/* Badge Info */}
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    marginBottom: '0.5rem',
                    textAlign: 'center'
                  }}>
                    {badge.name}
                  </h3>

                  <p style={{
                    color: isDarkMode ? '#cbd5e1' : '#6b7280',
                    fontSize: '0.875rem',
                    marginBottom: '1rem',
                    textAlign: 'center',
                    flex: 1
                  }}>
                    {badge.description}
                  </p>

                  {badge.rarity && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.25rem 0.75rem',
                      background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                      color: '#3b82f6',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      marginBottom: '1rem',
                      width: 'fit-content',
                      margin: '0 auto 1rem'
                    }}>
                      <Award style={{ width: '0.875rem', height: '0.875rem' }} />
                      {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
                    </div>
                  )}

                  {/* Stats */}
                  {badge.awardedCount !== undefined && (
                    <div style={{
                      padding: '0.75rem',
                      background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      textAlign: 'center',
                      fontSize: '0.875rem'
                    }}>
                      <span style={{
                        color: isDarkMode ? '#cbd5e1' : '#6b7280'
                      }}>
                        Awarded to <strong>{badge.awardedCount || 0}</strong> {badge.awardedCount === 1 ? 'user' : 'users'}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    marginTop: 'auto'
                  }}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => handleViewHistory(badge._id)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                        color: '#3b82f6',
                        border: '1px solid #3b82f6',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <History style={{ width: '0.875rem', height: '0.875rem' }} />
                      History
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setShowAssignModal({ show: true, badge })}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <Plus style={{ width: '0.875rem', height: '0.875rem' }} />
                      Assign
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => {
                        setFormData(badge);
                        setShowEditModal({ show: true, badge });
                      }}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                        color: '#3b82f6',
                        border: '1px solid #3b82f6',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <Edit2 style={{ width: '0.875rem', height: '0.875rem' }} />
                      Edit
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => handleDeleteBadge(badge._id)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: '1px solid #ef4444',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <Trash2 style={{ width: '0.875rem', height: '0.875rem' }} />
                      Delete
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create/Edit Badge Modal */}
      <AnimatePresence>
        {(showCreateModal || showEditModal.show) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowCreateModal(false);
              setShowEditModal({ show: false, badge: null });
              setFormData({ name: '', description: '', iconUrl: '', criteria: '', rarity: 'common' });
            }}
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
                  {showEditModal.show ? 'Edit Badge' : 'Create Badge'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal({ show: false, badge: null });
                    setFormData({ name: '', description: '', iconUrl: '', criteria: '', rarity: 'common' });
                  }}
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

              {/* Form Fields */}
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#f1f5f9' : '#111827'
                  }}>
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#f1f5f9' : '#111827'
                  }}>
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      minHeight: '100px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#f1f5f9' : '#111827'
                  }}>
                    Icon URL
                  </label>
                  <input
                    type="text"
                    value={formData.iconUrl}
                    onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#f1f5f9' : '#111827'
                  }}>
                    Criteria
                  </label>
                  <input
                    type="text"
                    value={formData.criteria}
                    onChange={(e) => setFormData({ ...formData, criteria: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#f1f5f9' : '#111827'
                  }}>
                    Rarity
                  </label>
                  <select
                    value={formData.rarity}
                    onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  >
                    <option value="common">Common</option>
                    <option value="uncommon">Uncommon</option>
                    <option value="rare">Rare</option>
                    <option value="epic">Epic</option>
                    <option value="legendary">Legendary</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginTop: '1.5rem',
                justifyContent: 'flex-end'
              }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal({ show: false, badge: null });
                    setFormData({ name: '', description: '', iconUrl: '', criteria: '', rarity: 'common' });
                  }}
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
                  onClick={showEditModal.show ? handleUpdateBadge : handleCreateBadge}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  {showEditModal.show ? 'Update Badge' : 'Create Badge'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assign Badge Modal */}
      <AnimatePresence>
        {showAssignModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowAssignModal({ show: false, badge: null }); setAssignData({ userId: '', reason: '' }); }}
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
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: isDarkMode ? '#f1f5f9' : '#111827',
                marginBottom: '1rem'
              }}>
                Assign {showAssignModal.badge?.name}
              </h2>

              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#f1f5f9' : '#111827'
                  }}>
                    Select User *
                  </label>
                  <select
                    value={assignData.userId}
                    onChange={(e) => setAssignData({ ...assignData, userId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  >
                    <option value="">Choose a user...</option>
                    {users.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#f1f5f9' : '#111827'
                  }}>
                    Reason *
                  </label>
                  <textarea
                    value={assignData.reason}
                    onChange={(e) => setAssignData({ ...assignData, reason: e.target.value })}
                    placeholder="Why are you assigning this badge?"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => { setShowAssignModal({ show: false, badge: null }); setAssignData({ userId: '', reason: '' }); }}
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
                  onClick={handleAssignBadge}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Assign Badge
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {showHistoryModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHistoryModal({ show: false, history: [], badgeName: '' })}
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
                  {showHistoryModal.badgeName} - Assignment History
                </h2>
                <button
                  onClick={() => setShowHistoryModal({ show: false, history: [], badgeName: '' })}
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

              {showHistoryModal.history.length === 0 ? (
                <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', textAlign: 'center' }}>
                  No assignment history yet
                </p>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {showHistoryModal.history.map((entry, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '1rem',
                        background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                        borderRadius: '8px',
                        borderLeft: '3px solid #22c55e'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.5rem'
                      }}>
                        <Users style={{ width: '1rem', height: '1rem', color: '#3b82f6' }} />
                        <span style={{ color: isDarkMode ? '#f1f5f9' : '#111827', fontWeight: '600' }}>
                          {entry.user?.firstName} {entry.user?.lastName}
                        </span>
                      </div>
                      {entry.reason && (
                        <p style={{
                          color: isDarkMode ? '#cbd5e1' : '#6b7280',
                          fontSize: '0.875rem',
                          marginBottom: '0.5rem'
                        }}>
                          {entry.reason}
                        </p>
                      )}
                      <p style={{
                        color: '#9ca3af',
                        fontSize: '0.75rem'
                      }}>
                        {entry.awardedAt ? new Date(entry.awardedAt).toLocaleDateString() : 'Unknown date'}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setShowHistoryModal({ show: false, history: [], badgeName: '' })}
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistics Modal */}
      <AnimatePresence>
        {showStatsModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowStatsModal({ show: false, stats: null })}
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
                  Badge Statistics
                </h2>
                <button
                  onClick={() => setShowStatsModal({ show: false, stats: null })}
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

              {showStatsModal.stats && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{
                    padding: '1rem',
                    background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                    borderRadius: '8px'
                  }}>
                    <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', fontSize: '0.875rem' }}>
                      Total Badges
                    </p>
                    <p style={{
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      fontSize: '2rem',
                      fontWeight: 'bold'
                    }}>
                      {showStatsModal.stats.totalBadges || 0}
                    </p>
                  </div>

                  <div style={{
                    padding: '1rem',
                    background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                    borderRadius: '8px'
                  }}>
                    <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', fontSize: '0.875rem' }}>
                      Total Awards
                    </p>
                    <p style={{
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      fontSize: '2rem',
                      fontWeight: 'bold'
                    }}>
                      {showStatsModal.stats.totalAwards || 0}
                    </p>
                  </div>

                  <div style={{
                    padding: '1rem',
                    background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                    borderRadius: '8px'
                  }}>
                    <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', fontSize: '0.875rem' }}>
                      Users with Badges
                    </p>
                    <p style={{
                      color: isDarkMode ? '#f1f5f9' : '#111827',
                      fontSize: '2rem',
                      fontWeight: 'bold'
                    }}>
                      {showStatsModal.stats.usersWithBadges || 0}
                    </p>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setShowStatsModal({ show: false, stats: null })}
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

export default BadgeManagement;
