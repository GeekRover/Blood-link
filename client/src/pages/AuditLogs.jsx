import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { auditAPI } from '../services/api';
import { useDarkMode } from '../context/DarkModeContext';
import {
  FileText, Search, Download, Filter, X, AlertCircle,
  CheckCircle, XCircle, Clock, User, Shield, TrendingUp
} from 'lucide-react';

const AuditLogs = () => {
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modal state
  const [showDetailModal, setShowDetailModal] = useState({ show: false, log: null });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [logsData, statsData] = await Promise.all([
        auditAPI.getAllLogs(),
        auditAPI.getStatistics()
      ]);
      setLogs(logsData.data || []);
      setStats(statsData.data);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      toast.error('Failed to load audit logs', { icon: '❌' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await auditAPI.export();
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(data));
      element.setAttribute('download', 'audit_logs.csv');
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success('Audit logs exported successfully!', { icon: '✅' });
    } catch (error) {
      console.error('Failed to export logs:', error);
      toast.error('Failed to export logs', { icon: '❌' });
    }
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.admin?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.admin?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.targetUser?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.targetUser?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = filterSeverity === 'all' || log.severity === filterSeverity;
    const matchesAction = filterAction === 'all' || log.action === filterAction;

    let matchesDate = true;
    if (dateFrom || dateTo) {
      const logDate = new Date(log.timestamp);
      if (dateFrom) matchesDate = logDate >= new Date(dateFrom);
      if (dateTo) matchesDate = matchesDate && logDate <= new Date(dateTo);
    }

    return matchesSearch && matchesSeverity && matchesAction && matchesDate;
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'critical': return '#7c3aed';
      default: return '#6b7280';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'low': return <CheckCircle style={{ width: '1.25rem', height: '1.25rem' }} />;
      case 'medium': return <AlertCircle style={{ width: '1.25rem', height: '1.25rem' }} />;
      case 'high': return <XCircle style={{ width: '1.25rem', height: '1.25rem' }} />;
      case 'critical': return <Shield style={{ width: '1.25rem', height: '1.25rem' }} />;
      default: return <Clock style={{ width: '1.25rem', height: '1.25rem' }} />;
    }
  };

  const uniqueActions = [...new Set(logs.map(log => log.action))];

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
              <FileText style={{ width: '32px', height: '32px', color: '#3b82f6' }} />
              Audit Logs
            </h1>
            <p style={{
              color: isDarkMode ? '#cbd5e1' : '#6b7280',
              fontSize: '0.875rem'
            }}>
              View system actions, user verifications, and admin activities
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={handleExport}
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
              <Download style={{ width: '1rem', height: '1rem' }} />
              Export
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

        {/* Statistics */}
        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
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
                  <FileText style={{ width: '24px', height: '24px', color: 'white' }} />
                </div>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#cbd5e1' : '#6b7280',
                  textTransform: 'uppercase'
                }}>
                  Total Logs
                </h3>
              </div>
              <p style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: isDarkMode ? '#f1f5f9' : '#111827'
              }}>
                {stats.totalLogs || 0}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
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
                  textTransform: 'uppercase'
                }}>
                  Critical Actions
                </h3>
              </div>
              <p style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: isDarkMode ? '#f1f5f9' : '#111827'
              }}>
                {stats.criticalCount || 0}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
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
                  <TrendingUp style={{ width: '24px', height: '24px', color: 'white' }} />
                </div>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#cbd5e1' : '#6b7280',
                  textTransform: 'uppercase'
                }}>
                  Today
                </h3>
              </div>
              <p style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: isDarkMode ? '#f1f5f9' : '#111827'
              }}>
                {stats.todayCount || 0}
              </p>
            </motion.div>
          </div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: isDarkMode ? '#f1f5f9' : '#111827'
              }}>
                <Search style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.5rem' }} />
                Search
              </label>
              <input
                type="text"
                placeholder="Search by action, user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                <Filter style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.5rem' }} />
                Severity
              </label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
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
                <option value="all">All Severity</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
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
                Action
              </label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
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
                <option value="all">All Actions</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>{action}</option>
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
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
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
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
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
          </div>
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
              Loading audit logs...
            </p>
          </div>
        ) : filteredLogs.length === 0 ? (
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
            <FileText style={{ width: '48px', height: '48px', margin: '0 auto 1rem', color: '#9ca3af' }} />
            <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', fontSize: '1rem' }}>
              No audit logs found
            </p>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <AnimatePresence>
              {filteredLogs.map((log, index) => (
                <motion.div
                  key={log._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => setShowDetailModal({ show: true, log })}
                  style={{
                    padding: '1.5rem',
                    background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(12px)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    cursor: 'pointer',
                    borderLeft: `4px solid ${getSeverityColor(log.severity)}`
                  }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    {/* Log Info */}
                    <div style={{ flex: 1, minWidth: '250px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '1rem'
                      }}>
                        <div style={{
                          color: getSeverityColor(log.severity)
                        }}>
                          {getSeverityIcon(log.severity)}
                        </div>
                        <div>
                          <h3 style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: isDarkMode ? '#f1f5f9' : '#111827',
                            marginBottom: '0.25rem'
                          }}>
                            {log.action}
                          </h3>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            fontSize: '0.75rem',
                            color: isDarkMode ? '#cbd5e1' : '#6b7280'
                          }}>
                            {log.admin && (
                              <span>By {log.admin.firstName} {log.admin.lastName}</span>
                            )}
                            <span>•</span>
                            <span>{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      {log.targetUser && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.875rem',
                          color: isDarkMode ? '#cbd5e1' : '#6b7280',
                          marginBottom: '0.75rem'
                        }}>
                          <User style={{ width: '1rem', height: '1rem' }} />
                          Target: {log.targetUser.firstName} {log.targetUser.lastName}
                        </div>
                      )}

                      {log.description && (
                        <p style={{
                          color: isDarkMode ? '#cbd5e1' : '#6b7280',
                          fontSize: '0.875rem'
                        }}>
                          {log.description}
                        </p>
                      )}
                    </div>

                    {/* Severity Badge */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: `${getSeverityColor(log.severity)}20`,
                      color: getSeverityColor(log.severity),
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {log.severity}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetailModal({ show: false, log: null })}
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
                  Log Details
                </h2>
                <button
                  onClick={() => setShowDetailModal({ show: false, log: null })}
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

              {showDetailModal.log && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{
                    padding: '1rem',
                    background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                    borderRadius: '8px'
                  }}>
                    <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      Action
                    </p>
                    <p style={{ color: isDarkMode ? '#f1f5f9' : '#111827', fontWeight: '600' }}>
                      {showDetailModal.log.action}
                    </p>
                  </div>

                  <div style={{
                    padding: '1rem',
                    background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                    borderRadius: '8px'
                  }}>
                    <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      Severity
                    </p>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: `${getSeverityColor(showDetailModal.log.severity)}20`,
                      color: getSeverityColor(showDetailModal.log.severity),
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {showDetailModal.log.severity}
                    </div>
                  </div>

                  {showDetailModal.log.admin && (
                    <div style={{
                      padding: '1rem',
                      background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                      borderRadius: '8px'
                    }}>
                      <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        Admin
                      </p>
                      <p style={{ color: isDarkMode ? '#f1f5f9' : '#111827', fontWeight: '600' }}>
                        {showDetailModal.log.admin.firstName} {showDetailModal.log.admin.lastName}
                      </p>
                    </div>
                  )}

                  {showDetailModal.log.targetUser && (
                    <div style={{
                      padding: '1rem',
                      background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                      borderRadius: '8px'
                    }}>
                      <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        Target User
                      </p>
                      <p style={{ color: isDarkMode ? '#f1f5f9' : '#111827', fontWeight: '600' }}>
                        {showDetailModal.log.targetUser.firstName} {showDetailModal.log.targetUser.lastName}
                      </p>
                    </div>
                  )}

                  <div style={{
                    padding: '1rem',
                    background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                    borderRadius: '8px'
                  }}>
                    <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      Timestamp
                    </p>
                    <p style={{ color: isDarkMode ? '#f1f5f9' : '#111827', fontWeight: '600' }}>
                      {new Date(showDetailModal.log.timestamp).toLocaleString()}
                    </p>
                  </div>

                  {showDetailModal.log.description && (
                    <div style={{
                      padding: '1rem',
                      background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                      borderRadius: '8px'
                    }}>
                      <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        Description
                      </p>
                      <p style={{ color: isDarkMode ? '#f1f5f9' : '#111827' }}>
                        {showDetailModal.log.description}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setShowDetailModal({ show: false, log: null })}
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

export default AuditLogs;
