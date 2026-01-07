import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useDarkMode } from '../context/DarkModeContext';
import { donationAPI } from '../services/api';
import { QrCode, Search, Trash2, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * DigitalCardAdmin - Admin page for viewing and managing donor digital cards
 * Features:
 * - Search for donors
 * - View all digital cards for a donor
 * - See card status and verification info
 * - Revoke digital cards
 */
export default function DigitalCardAdmin() {
  const { user } = useAuth();
  const { isDarkMode } = useDarkMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [donorCards, setDonorCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== 'admin') {
      window.location.href = '/dashboard';
    }
  }, [user]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('Please enter a donor ID or name');
      return;
    }

    try {
      setSearching(true);
      setError(null);
      // In a real app, this would search the backend
      // For now, we'll simulate search results
      setSearchResults([
        {
          _id: searchQuery,
          name: 'John Doe',
          email: 'john@example.com',
          bloodType: 'O+'
        }
      ]);
    } catch (err) {
      setError(err.message || 'Failed to search donors');
    } finally {
      setSearching(false);
    }
  };

  const loadDonorCards = async (donorId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await donationAPI.getDonorCards(donorId);
      setDonorCards(data.data || []);
      setSelectedDonor(data.donor || { _id: donorId });
    } catch (err) {
      setError(err.message || 'Failed to load donor cards');
      toast.error(err.message || 'Failed to load donor cards');
    } finally {
      setLoading(false);
    }
  };

  const openRevokeModal = (card) => {
    setSelectedCard(card);
    setRevokeReason('');
    setShowModal(true);
  };

  const handleRevokeCard = async () => {
    if (!revokeReason || revokeReason.length < 5) {
      toast.error('Reason must be at least 5 characters');
      return;
    }

    try {
      await donationAPI.revokeCard(selectedCard._id, { reason: revokeReason });
      toast.success('Card revoked successfully');
      setShowModal(false);
      loadDonorCards(selectedDonor._id);
    } catch (err) {
      toast.error(err.message || 'Failed to revoke card');
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '2rem', maxWidth: '80rem', margin: '0 auto' }}
      >
        <h1 style={{
          fontSize: '2.25rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: isDarkMode ? '#f1f5f9' : '#111827'
        }}>
          <QrCode style={{ width: '2rem', height: '2rem', color: '#dc2626' }} />
          Digital Card Management
        </h1>
        <p style={{
          color: isDarkMode ? '#cbd5e1' : '#6b7280',
          marginTop: '0.25rem'
        }}>
          View and manage donor digital donation cards
        </p>
      </motion.div>

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              marginBottom: '1.5rem',
              maxWidth: '80rem',
              margin: '0 auto 1.5rem',
              padding: '1rem',
              background: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              borderRadius: '8px',
              color: '#dc2626'
            }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ maxWidth: '80rem', margin: '0 auto 2rem' }}
      >
        <div style={{
          padding: '1.5rem',
          background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
        }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '1.25rem',
                height: '1.25rem',
                color: isDarkMode ? '#64748b' : '#9ca3af'
              }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by donor ID, name, or email..."
                style={{
                  width: '100%',
                  paddingLeft: '2.5rem',
                  paddingRight: '1rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  background: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                  color: isDarkMode ? '#f1f5f9' : '#111827',
                  outline: 'none'
                }}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={searching}
              style={{
                paddingLeft: '1.5rem',
                paddingRight: '1.5rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                color: 'white',
                borderRadius: '8px',
                fontWeight: 'bold',
                border: 'none',
                cursor: searching ? 'default' : 'pointer',
                opacity: searching ? 0.5 : 1,
                transition: 'transform 0.2s'
              }}
            >
              {searching ? 'Searching...' : 'Search'}
            </motion.button>
          </form>
        </div>
      </motion.div>

      {/* Search Results */}
      {searchResults.length > 0 && !selectedDonor && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ maxWidth: '80rem', margin: '0 auto 2rem' }}
        >
          <div style={{
            padding: '1.5rem',
            background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              paddingBottom: '1rem',
              borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              marginBottom: '1rem'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: isDarkMode ? '#f1f5f9' : '#111827'
              }}>
                Search Results
              </h2>
            </div>
            <div>
              {searchResults.map((donor) => (
                <motion.div
                  key={donor._id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => loadDonorCards(donor._id)}
                  style={{
                    padding: '1rem',
                    cursor: 'pointer',
                    borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <div>
                      <h3 style={{
                        fontWeight: 'bold',
                        color: isDarkMode ? '#f1f5f9' : '#111827'
                      }}>
                        {donor.name}
                      </h3>
                      <p style={{
                        fontSize: '0.875rem',
                        color: isDarkMode ? '#cbd5e1' : '#6b7280',
                        marginTop: '0.25rem'
                      }}>
                        {donor.email}
                      </p>
                      <p style={{
                        fontSize: '0.875rem',
                        color: isDarkMode ? '#cbd5e1' : '#6b7280',
                        marginTop: '0.25rem'
                      }}>
                        ID: {donor._id}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        background: 'rgba(220, 38, 38, 0.1)',
                        color: '#dc2626',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}>
                        {donor.bloodType}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Donor Cards */}
      {selectedDonor && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ maxWidth: '80rem', margin: '0 auto' }}
        >
          {/* Back Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setSelectedDonor(null);
              setDonorCards([]);
              setSearchQuery('');
              setSearchResults([]);
            }}
            style={{
              marginBottom: '1.5rem',
              paddingLeft: '1rem',
              paddingRight: '1rem',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
              background: isDarkMode ? 'rgba(64, 74, 90, 0.8)' : 'rgba(107, 114, 128, 0.8)',
              color: 'white',
              borderRadius: '8px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            ← Back to Search
          </motion.button>

          {/* Donor Info */}
          <div style={{
            padding: '1.5rem',
            background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: isDarkMode ? '#f1f5f9' : '#111827'
                }}>
                  {selectedDonor.name}
                </h2>
                <p style={{
                  color: isDarkMode ? '#cbd5e1' : '#6b7280',
                  marginTop: '0.25rem'
                }}>
                  {selectedDonor.email}
                </p>
                <p style={{
                  color: isDarkMode ? '#cbd5e1' : '#6b7280'
                }}>
                  ID: {selectedDonor._id}
                </p>
              </div>
              <span style={{
                padding: '0.5rem 1rem',
                background: 'rgba(220, 38, 38, 0.1)',
                color: '#dc2626',
                borderRadius: '8px',
                fontSize: '1.125rem',
                fontWeight: 'bold'
              }}>
                {selectedDonor.bloodType}
              </span>
            </div>
          </div>

          {/* Digital Cards */}
          <div style={{
            padding: '1.5rem',
            background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              paddingBottom: '1rem',
              borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              marginBottom: '1rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: isDarkMode ? '#f1f5f9' : '#111827'
              }}>
                Digital Cards ({donorCards.length})
              </h2>
              <p style={{
                color: isDarkMode ? '#cbd5e1' : '#6b7280',
                fontSize: '0.875rem',
                marginTop: '0.25rem'
              }}>
                All digital donation cards for this donor
              </p>
            </div>

            {loading ? (
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{
                  display: 'inline-block',
                  animation: 'spin 1s linear infinite',
                  color: '#dc2626'
                }}>
                  <QrCode style={{ width: '2rem', height: '2rem' }} />
                </div>
                <p style={{
                  color: isDarkMode ? '#cbd5e1' : '#6b7280',
                  marginTop: '0.5rem'
                }}>
                  Loading cards...
                </p>
              </div>
            ) : donorCards.length === 0 ? (
              <div style={{
                padding: '3rem',
                textAlign: 'center',
                color: isDarkMode ? '#64748b' : '#9ca3af'
              }}>
                <QrCode style={{
                  width: '4rem',
                  height: '4rem',
                  margin: '0 auto 1rem',
                  color: isDarkMode ? '#334155' : '#d1d5db'
                }} />
                <p>No digital cards found for this donor</p>
              </div>
            ) : (
              <div>
                <AnimatePresence>
                  {donorCards.map((card, idx) => (
                    <motion.div
                      key={card._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: idx * 0.05 }}
                      style={{
                        padding: '1.5rem',
                        borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '0.75rem'
                      }}>
                        <div>
                          <h3 style={{
                            fontWeight: 'bold',
                            color: isDarkMode ? '#f1f5f9' : '#111827'
                          }}>
                            {card.bloodDonation?.bloodType || 'Unknown'} Donation Card
                          </h3>
                          <p style={{
                            fontSize: '0.875rem',
                            color: isDarkMode ? '#cbd5e1' : '#6b7280',
                            marginTop: '0.25rem'
                          }}>
                            ID: {card._id.substring(0, 12)}...
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {card.isRevoked ? (
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              background: 'rgba(220, 38, 38, 0.1)',
                              color: '#dc2626',
                              borderRadius: '9999px',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              <XCircle style={{ width: '1rem', height: '1rem' }} />
                              Revoked
                            </span>
                          ) : (
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              background: 'rgba(34, 197, 94, 0.1)',
                              color: '#22c55e',
                              borderRadius: '9999px',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              <CheckCircle style={{ width: '1rem', height: '1rem' }} />
                              Active
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '0.75rem',
                        marginBottom: '1rem',
                        fontSize: '0.875rem'
                      }}>
                        <div>
                          <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280' }}>Donation Date</p>
                          <p style={{
                            fontWeight: 'bold',
                            color: isDarkMode ? '#f1f5f9' : '#111827'
                          }}>
                            {card.bloodDonation?.donationDate
                              ? new Date(card.bloodDonation.donationDate).toLocaleDateString()
                              : 'Unknown'}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280' }}>Verifications</p>
                          <p style={{
                            fontWeight: 'bold',
                            color: isDarkMode ? '#f1f5f9' : '#111827'
                          }}>
                            {card.verificationCount || 0}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280' }}>Created</p>
                          <p style={{
                            fontWeight: 'bold',
                            color: isDarkMode ? '#f1f5f9' : '#111827'
                          }}>
                            {new Date(card.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280' }}>Expires</p>
                          <p style={{
                            fontWeight: 'bold',
                            color: isDarkMode ? '#f1f5f9' : '#111827'
                          }}>
                            {card.expiryDate
                              ? new Date(card.expiryDate).toLocaleDateString()
                              : 'Never'}
                          </p>
                        </div>
                      </div>

                      {card.isRevoked && card.revokeReason && (
                        <div style={{
                          marginBottom: '1rem',
                          padding: '0.75rem',
                          background: 'rgba(220, 38, 38, 0.1)',
                          borderRadius: '8px'
                        }}>
                          <p style={{
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            color: '#dc2626'
                          }}>
                            Revoke Reason:
                          </p>
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#dc2626'
                          }}>
                            {card.revokeReason}
                          </p>
                        </div>
                      )}

                      {!card.isRevoked && (
                        <div style={{
                          display: 'flex',
                          gap: '0.5rem',
                          paddingTop: '0.75rem',
                          borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'
                        }}>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openRevokeModal(card)}
                            style={{
                              paddingLeft: '1rem',
                              paddingRight: '1rem',
                              paddingTop: '0.5rem',
                              paddingBottom: '0.5rem',
                              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                              color: 'white',
                              fontSize: '0.875rem',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              transition: 'transform 0.2s'
                            }}
                          >
                            <Trash2 style={{ width: '1rem', height: '1rem' }} />
                            Revoke Card
                          </motion.button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Revoke Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              zIndex: 50
            }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: isDarkMode ? '#1e293b' : '#ffffff',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                maxWidth: '28rem',
                width: '100%',
                padding: '1.5rem'
              }}
            >
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: isDarkMode ? '#f1f5f9' : '#111827',
                marginBottom: '1rem'
              }}>
                Revoke Digital Card
              </h3>

              <div style={{
                marginBottom: '1rem',
                padding: '1rem',
                background: 'rgba(220, 38, 38, 0.1)',
                borderRadius: '8px'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#dc2626'
                }}>
                  <span style={{ fontWeight: 'bold' }}>Card ID:</span> {selectedCard?._id?.substring(0, 12)}...
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#dc2626',
                  marginTop: '0.25rem'
                }}>
                  <span style={{ fontWeight: 'bold' }}>Blood Type:</span>{' '}
                  {selectedCard?.bloodDonation?.bloodType}
                </p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#f1f5f9' : '#374151',
                  marginBottom: '0.25rem'
                }}>
                  Reason for Revocation (min 5 characters)
                </label>
                <textarea
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="Enter reason for revoking this card..."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '6px',
                    background: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    outline: 'none',
                    fontFamily: 'inherit',
                    resize: 'none'
                  }}
                  rows="3"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.5rem 1rem',
                    background: isDarkMode ? 'rgba(64, 74, 90, 0.8)' : 'rgba(200, 200, 200, 0.8)',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevokeCard}
                  style={{
                    flex: 1,
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                    color: 'white',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                >
                  Revoke Card
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
