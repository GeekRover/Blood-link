import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useDarkMode } from '../context/DarkModeContext';
import { donationAPI } from '../services/api';
import { Lock, LockOpen, History, AlertCircle, ShieldAlert, CheckCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DonationImmutability() {
  const { user } = useAuth();
  const { isDarkMode } = useDarkMode();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchId, setSearchId] = useState('');
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (user && user.role !== 'admin') {
      window.location.href = '/dashboard';
    }
  }, [user]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchId.trim()) {
      setError('Please enter a donation ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await donationAPI.getById(searchId);
      const status = await donationAPI.getImmutabilityStatus(searchId);
      setDonations([{ ...data, immutabilityStatus: status }]);
    } catch (err) {
      setError(err.message || 'Donation not found');
      setDonations([]);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode, donation) => {
    setModalMode(mode);
    setSelectedDonation(donation);
    setReason('');
    setShowModal(true);
  };

  const handleLock = async () => {
    if (!reason || reason.length < 10) {
      toast.error('Reason must be at least 10 characters');
      return;
    }
    try {
      await donationAPI.lockDonation(selectedDonation._id, { reason });
      toast.success('Donation locked');
      setShowModal(false);
      await handleSearch({ preventDefault: () => {} });
    } catch (err) {
      toast.error(err.message || 'Failed to lock donation');
    }
  };

  const handleUnlock = async () => {
    try {
      await donationAPI.unlockDonation(selectedDonation._id);
      toast.success('Donation unlocked');
      setShowModal(false);
      await handleSearch({ preventDefault: () => {} });
    } catch (err) {
      toast.error(err.message || 'Failed to unlock donation');
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
          style={{ marginBottom: '2rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{
              padding: '0.75rem',
              background: 'rgba(220, 38, 38, 0.1)',
              borderRadius: '12px'
            }}>
              <Lock style={{ width: '24px', height: '24px', color: '#dc2626' }} />
            </div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: isDarkMode ? '#f1f5f9' : '#111827'
            }}>
              Donation <span style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>Immutability</span>
            </h1>
          </div>
          <p style={{
            color: isDarkMode ? '#cbd5e1' : '#6b7280',
            fontSize: '0.875rem'
          }}>
            Lock and unlock donations to control immutability
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
                padding: '1rem',
                background: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                borderRadius: '12px',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <AlertCircle style={{ width: '20px', height: '20px' }} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSearch}
          style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '16px',
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Enter donation ID..."
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '0.75rem',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              background: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(0, 0, 0, 0.02)',
              color: isDarkMode ? '#f1f5f9' : '#111827',
              fontSize: '0.875rem'
            }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              </>
            ) : (
              <>
                <Search style={{ width: '18px', height: '18px' }} />
                Search
              </>
            )}
          </motion.button>
        </motion.form>

        {/* Results */}
        <AnimatePresence mode="wait">
          {donations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: '2rem',
                background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                borderRadius: '16px',
                textAlign: 'center',
                color: isDarkMode ? '#cbd5e1' : '#6b7280'
              }}
            >
              {searchId ? 'No donations found' : 'Search for a donation to see details'}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'grid',
                gap: '1rem'
              }}
            >
              {donations.map((donation) => (
                <motion.div
                  key={donation._id}
                  whileHover={{ y: -2 }}
                  style={{
                    padding: '1.5rem',
                    background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div>
                      <p style={{ color: isDarkMode ? '#f1f5f9' : '#111827', margin: 0, fontWeight: 600 }}>
                        Donation #{donation._id?.substring(0, 8)}
                      </p>
                      <p style={{ color: isDarkMode ? '#cbd5e1' : '#6b7280', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
                        From: {donation.donorName || 'Unknown'}
                      </p>
                    </div>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      background: donation.immutabilityStatus?.isLocked ? 'rgba(220, 38, 38, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                      color: donation.immutabilityStatus?.isLocked ? '#dc2626' : '#22c55e',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      {donation.immutabilityStatus?.isLocked ? (
                        <>
                          <Lock style={{ width: '12px', height: '12px' }} />
                          Locked
                        </>
                      ) : (
                        <>
                          <LockOpen style={{ width: '12px', height: '12px' }} />
                          Unlocked
                        </>
                      )}
                    </span>
                  </div>

                  <div style={{
                    padding: '1rem',
                    background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    fontSize: '0.875rem',
                    color: isDarkMode ? '#cbd5e1' : '#6b7280'
                  }}>
                    <p style={{ margin: 0 }}>
                      <strong>Status:</strong> {donation.immutabilityStatus?.status || 'Normal'}
                    </p>
                    {donation.immutabilityStatus?.lockReason && (
                      <p style={{ margin: '0.5rem 0 0 0' }}>
                        <strong>Reason:</strong> {donation.immutabilityStatus.lockReason}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {!donation.immutabilityStatus?.isLocked ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openModal('lock', donation)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'rgba(220, 38, 38, 0.1)',
                          color: '#dc2626',
                          border: '1px solid rgba(220, 38, 38, 0.2)',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <Lock style={{ width: '14px', height: '14px', marginRight: '0.25rem', display: 'inline' }} />
                        Lock
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openModal('unlock', donation)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'rgba(34, 197, 94, 0.1)',
                          color: '#22c55e',
                          border: '1px solid rgba(34, 197, 94, 0.2)',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <LockOpen style={{ width: '14px', height: '14px', marginRight: '0.25rem', display: 'inline' }} />
                        Unlock
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Modal */}
        <AnimatePresence>
          {showModal && (
            <ActionModal
              donation={selectedDonation}
              mode={modalMode}
              reason={reason}
              onReasonChange={setReason}
              onLock={handleLock}
              onUnlock={handleUnlock}
              onClose={() => setShowModal(false)}
              isDarkMode={isDarkMode}
            />
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function ActionModal({ donation, mode, reason, onReasonChange, onLock, onUnlock, onClose, isDarkMode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
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
        zIndex: 1000
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: isDarkMode ? '#1e293b' : '#ffffff',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}
      >
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: isDarkMode ? '#f1f5f9' : '#111827',
          margin: 0,
          marginBottom: '1rem'
        }}>
          {mode === 'lock' ? 'Lock Donation' : 'Unlock Donation'}
        </h2>

        <p style={{
          color: isDarkMode ? '#cbd5e1' : '#6b7280',
          marginBottom: '1rem',
          fontSize: '0.875rem'
        }}>
          Donation ID: <strong>{donation?._id?.substring(0, 16)}...</strong>
        </p>

        {mode === 'lock' && (
          <textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Enter reason for lock (minimum 10 characters)..."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '0.75rem',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              background: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(0, 0, 0, 0.02)',
              color: isDarkMode ? '#f1f5f9' : '#111827',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              resize: 'vertical',
              boxSizing: 'border-box',
              marginBottom: '1.5rem'
            }}
          />
        )}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={mode === 'lock' ? onLock : onUnlock}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: mode === 'lock'
                ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {mode === 'lock' ? 'Lock' : 'Unlock'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              color: isDarkMode ? '#f1f5f9' : '#111827',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Cancel
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
