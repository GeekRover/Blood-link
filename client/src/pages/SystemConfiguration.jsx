import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { configAPI } from '../services/api';
import { useDarkMode } from '../context/DarkModeContext';
import {
  Settings, Save, RotateCcw, History, Shield, Heart, Zap,
  AlertCircle, CheckCircle, Clock, X, Eye, EyeOff
} from 'lucide-react';

const SystemConfiguration = () => {
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [changeHistory, setChangeHistory] = useState([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [config, setConfig] = useState({
    donationSettings: {},
    matchingSettings: {},
    fallbackSettings: {},
    pointsSettings: {}
  });

  const [formData, setFormData] = useState({
    donationSettings: {},
    matchingSettings: {},
    fallbackSettings: {},
    pointsSettings: {}
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await configAPI.getConfig();
      setConfig(data.data);
      setFormData(data.data);
      setMaintenanceMode(data.data.maintenanceMode || false);
    } catch (error) {
      console.error('Failed to fetch configuration:', error);
      toast.error('Failed to load configuration', { icon: '❌' });
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const data = await configAPI.getChangeHistory();
      setChangeHistory(data.data || []);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      toast.error('Failed to load change history', { icon: '❌' });
    }
  };

  const handleToggleMaintenance = async () => {
    try {
      setSaving(true);
      const newMode = !maintenanceMode;
      await configAPI.toggleMaintenanceMode({ maintenanceMode: newMode });
      setMaintenanceMode(newMode);
      toast.success(
        newMode ? 'Maintenance mode enabled' : 'Maintenance mode disabled',
        { icon: newMode ? '🔧' : '✅' }
      );
    } catch (error) {
      console.error('Failed to toggle maintenance mode:', error);
      toast.error('Failed to update maintenance mode', { icon: '❌' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSection = async (section) => {
    try {
      setSaving(true);
      const sectionData = formData[section];

      if (!sectionData || Object.keys(sectionData).length === 0) {
        toast.error('No changes to save', { icon: '⚠️' });
        return;
      }

      const updatePromise =
        section === 'donationSettings' ? configAPI.updateDonationSettings(sectionData) :
        section === 'matchingSettings' ? configAPI.updateMatchingSettings(sectionData) :
        section === 'fallbackSettings' ? configAPI.updateFallbackSettings(sectionData) :
        section === 'pointsSettings' ? configAPI.updatePointsSettings(sectionData) :
        null;

      if (!updatePromise) {
        toast.error('Invalid section', { icon: '❌' });
        return;
      }

      toast.promise(
        updatePromise,
        {
          loading: 'Saving configuration...',
          success: `${section.replace(/([A-Z])/g, ' $1').trim()} updated successfully! ✅`,
          error: (err) => `Failed: ${err.message || 'Unknown error'}`,
        },
        { success: { icon: '✅', duration: 3000 }, error: { icon: '❌', duration: 4000 } }
      );

      await updatePromise;
      fetchConfig();
    } catch (error) {
      console.error('Failed to save configuration:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleResetSection = (section) => {
    if (!window.confirm(`Reset ${section} to saved values?`)) return;
    setFormData({
      ...formData,
      [section]: config[section]
    });
    toast.success('Changes discarded', { icon: '↩️' });
  };

  const handleInputChange = (section, key, value) => {
    setFormData({
      ...formData,
      [section]: {
        ...formData[section],
        [key]: value
      }
    });
  };

  const renderConfigSection = (title, section, fields) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: '1.5rem',
        background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(12px)',
        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
      }}
    >
      <h3 style={{
        fontSize: '1.125rem',
        fontWeight: '600',
        color: isDarkMode ? '#f1f5f9' : '#111827',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        {title}
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {fields.map((field) => (
          <div key={field.key}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: isDarkMode ? '#f1f5f9' : '#111827'
            }}>
              {field.label}
            </label>
            {field.type === 'number' ? (
              <input
                type="number"
                value={formData[section]?.[field.key] || ''}
                onChange={(e) => handleInputChange(section, field.key, e.target.value)}
                step={field.step || '1'}
                min={field.min}
                max={field.max}
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
            ) : field.type === 'text' ? (
              <input
                type="text"
                value={formData[section]?.[field.key] || ''}
                onChange={(e) => handleInputChange(section, field.key, e.target.value)}
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
            ) : field.type === 'select' ? (
              <select
                value={formData[section]?.[field.key] || ''}
                onChange={(e) => handleInputChange(section, field.key, e.target.value)}
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
                {field.options?.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : null}
            {field.description && (
              <p style={{
                fontSize: '0.75rem',
                color: isDarkMode ? '#cbd5e1' : '#6b7280',
                marginTop: '0.25rem'
              }}>
                {field.description}
              </p>
            )}
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex',
        gap: '1rem'
      }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => handleSaveSection(section)}
          disabled={saving}
          style={{
            flex: 1,
            padding: '0.75rem 1.5rem',
            background: saving ? 'rgba(34, 197, 94, 0.5)' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <Save style={{ width: '1rem', height: '1rem' }} />
          {saving ? 'Saving...' : 'Save Changes'}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => handleResetSection(section)}
          style={{
            flex: 1,
            padding: '0.75rem 1.5rem',
            background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(0, 0, 0, 0.05)',
            color: isDarkMode ? '#f1f5f9' : '#111827',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <RotateCcw style={{ width: '1rem', height: '1rem' }} />
          Reset
        </motion.button>
      </div>
    </motion.div>
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
              <Settings style={{ width: '32px', height: '32px', color: '#3b82f6' }} />
              System Configuration
            </h1>
            <p style={{
              color: isDarkMode ? '#cbd5e1' : '#6b7280',
              fontSize: '0.875rem'
            }}>
              Manage system settings, donation rules, matching algorithms, and more
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={fetchHistory}
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
              <History style={{ width: '1rem', height: '1rem' }} />
              History
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

        {/* Maintenance Mode Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            background: maintenanceMode
              ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
              : isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            border: maintenanceMode ? '1px solid #f59e0b' : (isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'),
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: maintenanceMode ? 'white' : (isDarkMode ? '#f1f5f9' : '#111827'),
              marginBottom: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Shield style={{ width: '1.25rem', height: '1.25rem' }} />
              Maintenance Mode
            </h3>
            <p style={{
              fontSize: '0.875rem',
              color: maintenanceMode ? 'rgba(255, 255, 255, 0.9)' : (isDarkMode ? '#cbd5e1' : '#6b7280')
            }}>
              {maintenanceMode
                ? 'System is in maintenance mode. Users cannot access the platform.'
                : 'System is running normally. Click toggle to enable maintenance mode.'}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={handleToggleMaintenance}
            disabled={saving}
            style={{
              padding: '0.75rem 1.5rem',
              background: maintenanceMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)',
              color: maintenanceMode ? 'white' : (isDarkMode ? '#f1f5f9' : '#111827'),
              border: maintenanceMode ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1
            }}
          >
            {maintenanceMode ? 'Disable' : 'Enable'}
          </motion.button>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            marginBottom: '2rem',
            display: 'flex',
            gap: '0.5rem',
            borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            overflowX: 'auto'
          }}
        >
          {[
            { id: 'general', label: 'General', icon: Settings },
            { id: 'donation', label: 'Donation Settings', icon: Heart },
            { id: 'matching', label: 'Matching Algorithm', icon: Zap },
            { id: 'fallback', label: 'Fallback System', icon: AlertCircle }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: activeTab === tab.id ? 'transparent' : 'transparent',
                  color: activeTab === tab.id ? '#3b82f6' : (isDarkMode ? '#cbd5e1' : '#6b7280'),
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : 'transparent',
                  fontSize: '0.875rem',
                  fontWeight: activeTab === tab.id ? '600' : '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.3s ease'
                }}
              >
                <Icon style={{ width: '1rem', height: '1rem' }} />
                {tab.label}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: `3px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', marginTop: '1rem' }}>
              Loading configuration...
            </p>
          </div>
        ) : (
          <>
            {/* General Settings Tab */}
            {activeTab === 'general' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ display: 'grid', gap: '2rem' }}>
                  {renderConfigSection(
                    'General Settings',
                    'generalSettings',
                    [
                      {
                        key: 'siteTitle',
                        label: 'Site Title',
                        type: 'text',
                        description: 'Name of the blood donation platform'
                      },
                      {
                        key: 'siteDescription',
                        label: 'Site Description',
                        type: 'text',
                        description: 'Brief description of the platform'
                      },
                      {
                        key: 'contactEmail',
                        label: 'Contact Email',
                        type: 'text',
                        description: 'Support email address'
                      },
                      {
                        key: 'contactPhone',
                        label: 'Contact Phone',
                        type: 'text',
                        description: 'Support phone number'
                      }
                    ]
                  )}
                </div>
              </motion.div>
            )}

            {/* Donation Settings Tab */}
            {activeTab === 'donation' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ display: 'grid', gap: '2rem' }}>
                  {renderConfigSection(
                    'Donation Configuration',
                    'donationSettings',
                    [
                      {
                        key: 'minDonationAge',
                        label: 'Minimum Donor Age',
                        type: 'number',
                        min: '16',
                        max: '30',
                        description: 'Minimum age for blood donation (years)'
                      },
                      {
                        key: 'maxDonationAge',
                        label: 'Maximum Donor Age',
                        type: 'number',
                        min: '50',
                        max: '70',
                        description: 'Maximum age for blood donation (years)'
                      },
                      {
                        key: 'minWeightKg',
                        label: 'Minimum Weight',
                        type: 'number',
                        min: '40',
                        max: '60',
                        step: '0.5',
                        description: 'Minimum body weight for donation (kg)'
                      },
                      {
                        key: 'donationIntervalDays',
                        label: 'Donation Interval',
                        type: 'number',
                        min: '30',
                        max: '90',
                        description: 'Days between donations (days)'
                      },
                      {
                        key: 'bloodUnitsPerDonation',
                        label: 'Units Per Donation',
                        type: 'number',
                        min: '1',
                        max: '2',
                        step: '0.1',
                        description: 'Standard units collected per donation'
                      },
                      {
                        key: 'verificationRequired',
                        label: 'Require Verification',
                        type: 'select',
                        options: [
                          { value: 'true', label: 'Yes' },
                          { value: 'false', label: 'No' }
                        ],
                        description: 'Require admin verification for donations'
                      }
                    ]
                  )}
                </div>
              </motion.div>
            )}

            {/* Matching Settings Tab */}
            {activeTab === 'matching' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ display: 'grid', gap: '2rem' }}>
                  {renderConfigSection(
                    'Matching Algorithm Settings',
                    'matchingSettings',
                    [
                      {
                        key: 'matchRadius',
                        label: 'Match Radius (km)',
                        type: 'number',
                        min: '5',
                        max: '50',
                        description: 'Initial search radius for donor matching'
                      },
                      {
                        key: 'prioritizeVerified',
                        label: 'Prioritize Verified',
                        type: 'select',
                        options: [
                          { value: 'true', label: 'Yes' },
                          { value: 'false', label: 'No' }
                        ],
                        description: 'Prioritize verified donors in matching'
                      },
                      {
                        key: 'matchingAlgorithm',
                        label: 'Algorithm Type',
                        type: 'select',
                        options: [
                          { value: 'distance', label: 'Distance-Based' },
                          { value: 'score', label: 'Score-Based' },
                          { value: 'hybrid', label: 'Hybrid' }
                        ],
                        description: 'Algorithm for calculating best matches'
                      },
                      {
                        key: 'bloodTypeCompatibility',
                        label: 'Enforce Blood Type',
                        type: 'select',
                        options: [
                          { value: 'strict', label: 'Strict' },
                          { value: 'flexible', label: 'Flexible' }
                        ],
                        description: 'Blood type matching strictness'
                      }
                    ]
                  )}
                </div>
              </motion.div>
            )}

            {/* Fallback Settings Tab */}
            {activeTab === 'fallback' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ display: 'grid', gap: '2rem' }}>
                  {renderConfigSection(
                    'Fallback System Settings',
                    'fallbackSettings',
                    [
                      {
                        key: 'enableFallback',
                        label: 'Enable Fallback System',
                        type: 'select',
                        options: [
                          { value: 'true', label: 'Yes' },
                          { value: 'false', label: 'No' }
                        ],
                        description: 'Enable automatic fallback to blood banks'
                      },
                      {
                        key: 'radiusExpansionStep',
                        label: 'Radius Expansion (km)',
                        type: 'number',
                        min: '5',
                        max: '50',
                        description: 'Expand search radius by this amount'
                      },
                      {
                        key: 'maxRadiusExpansions',
                        label: 'Max Expansions',
                        type: 'number',
                        min: '1',
                        max: '10',
                        description: 'Maximum number of radius expansions'
                      },
                      {
                        key: 'bloodBankSuggestions',
                        label: 'Show Blood Banks',
                        type: 'select',
                        options: [
                          { value: 'true', label: 'Yes' },
                          { value: 'false', label: 'No' }
                        ],
                        description: 'Show blood bank alternatives'
                      }
                    ]
                  )}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Change History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHistoryModal(false)}
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
                  Configuration Change History
                </h2>
                <button
                  onClick={() => setShowHistoryModal(false)}
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

              {changeHistory.length === 0 ? (
                <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', textAlign: 'center' }}>
                  No changes recorded yet
                </p>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {changeHistory.map((entry, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '1rem',
                        background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                        borderRadius: '8px',
                        borderLeft: '3px solid #3b82f6'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.5rem'
                      }}>
                        <Clock style={{ width: '1rem', height: '1rem', color: '#3b82f6' }} />
                        <span style={{ color: isDarkMode ? '#f1f5f9' : '#111827', fontWeight: '600' }}>
                          {entry.setting}
                        </span>
                      </div>
                      {entry.oldValue && entry.newValue && (
                        <div style={{
                          display: 'grid',
                          gap: '0.5rem',
                          fontSize: '0.875rem',
                          marginBottom: '0.5rem'
                        }}>
                          <div>
                            <span style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280' }}>Old: </span>
                            <span style={{ color: '#ef4444', fontFamily: 'monospace' }}>
                              {String(entry.oldValue).substring(0, 50)}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280' }}>New: </span>
                            <span style={{ color: '#22c55e', fontFamily: 'monospace' }}>
                              {String(entry.newValue).substring(0, 50)}
                            </span>
                          </div>
                        </div>
                      )}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        fontSize: '0.75rem',
                        color: '#9ca3af'
                      }}>
                        {entry.admin && (
                          <span>By {entry.admin.firstName} {entry.admin.lastName}</span>
                        )}
                        {entry.timestamp && (
                          <>
                            <span>•</span>
                            <span>{new Date(entry.timestamp).toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setShowHistoryModal(false)}
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

export default SystemConfiguration;
