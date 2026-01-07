import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

const LegalDisclaimer = ({ accepted, onAcceptChange, isDarkMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      style={{
        marginTop: '2rem',
        padding: '1.5rem',
        borderRadius: '16px',
        background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(254, 242, 242, 0.6)',
        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(220, 38, 38, 0.1)',
        backdropFilter: 'blur(8px)'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Shield style={{ width: '24px', height: '24px', color: '#dc2626' }} />
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: isDarkMode ? '#f1f5f9' : '#111827',
            margin: 0
          }}>
            Medical Data Consent
          </h3>
        </div>
        <motion.button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            padding: '0.5rem',
            background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
            border: isDarkMode ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(59, 130, 246, 0.1)',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: '#3b82f6'
          }}
        >
          {isExpanded ? (
            <>
              <ChevronUp size={16} />
              <span>Hide Details</span>
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              <span>Read Full Terms</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Collapsed Summary */}
      {!isExpanded && (
        <p style={{
          fontSize: '0.8125rem',
          color: isDarkMode ? '#cbd5e1' : '#6b7280',
          lineHeight: '1.5',
          marginBottom: '1rem'
        }}>
          We collect and secure your medical data (blood type, donation history, health info) to match donors with recipients. Your data is encrypted and never shared without consent.
        </p>
      )}

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              maxHeight: '250px',
              overflowY: 'auto',
              paddingRight: '0.5rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Section 1 */}
                <div>
                  <h4 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    marginBottom: '0.5rem'
                  }}>
                    1. What We Collect
                  </h4>
                  <p style={{
                    fontSize: '0.8125rem',
                    color: isDarkMode ? '#cbd5e1' : '#6b7280',
                    lineHeight: '1.5'
                  }}>
                    Blood type, donation history, health records, medical conditions, medications, allergies, and location data.
                  </p>
                </div>

                {/* Section 2 */}
                <div>
                  <h4 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    marginBottom: '0.5rem'
                  }}>
                    2. How We Use It
                  </h4>
                  <p style={{
                    fontSize: '0.8125rem',
                    color: isDarkMode ? '#cbd5e1' : '#6b7280',
                    lineHeight: '1.5'
                  }}>
                    Matching donors with recipients, tracking eligibility, maintaining records, generating digital cards, and anonymized analytics.
                  </p>
                </div>

                {/* Section 3 */}
                <div>
                  <h4 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    marginBottom: '0.5rem'
                  }}>
                    3. Your Data Security
                  </h4>
                  <p style={{
                    fontSize: '0.8125rem',
                    color: isDarkMode ? '#cbd5e1' : '#6b7280',
                    lineHeight: '1.5'
                  }}>
                    Encrypted storage, authorized-only access, no third-party sharing without consent, retained while account is active.
                  </p>
                </div>

                {/* Section 4 */}
                <div>
                  <h4 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    marginBottom: '0.5rem'
                  }}>
                    4. Your Rights
                  </h4>
                  <p style={{
                    fontSize: '0.8125rem',
                    color: isDarkMode ? '#cbd5e1' : '#6b7280',
                    lineHeight: '1.5'
                  }}>
                    Access data anytime, request corrections, withdraw consent & delete account, opt-out of communications.
                  </p>
                </div>

                {/* Disclaimer */}
                <div style={{
                  padding: '0.75rem',
                  background: isDarkMode ? 'rgba(234, 179, 8, 0.1)' : 'rgba(234, 179, 8, 0.05)',
                  border: isDarkMode ? '1px solid rgba(234, 179, 8, 0.2)' : '1px solid rgba(234, 179, 8, 0.15)',
                  borderRadius: '8px'
                }}>
                  <p style={{
                    fontSize: '0.8125rem',
                    color: isDarkMode ? '#fbbf24' : '#ca8a04',
                    lineHeight: '1.5',
                    margin: 0
                  }}>
                    <strong>Important:</strong> BloodLink facilitates blood donation matching but does not provide medical advice. Always consult healthcare professionals for medical decisions.
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollbar Styling */}
            <style>{`
              div::-webkit-scrollbar {
                width: 6px;
              }
              div::-webkit-scrollbar-track {
                background: ${isDarkMode ? 'rgba(15, 23, 42, 0.4)' : 'rgba(248, 250, 252, 0.4)'};
                border-radius: 3px;
              }
              div::-webkit-scrollbar-thumb {
                background: ${isDarkMode ? 'rgba(148, 163, 184, 0.3)' : 'rgba(148, 163, 184, 0.5)'};
                border-radius: 3px;
              }
              div::-webkit-scrollbar-thumb:hover {
                background: ${isDarkMode ? 'rgba(148, 163, 184, 0.5)' : 'rgba(148, 163, 184, 0.7)'};
              }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Consent Checkbox */}
      <motion.label
        whileHover={{ scale: 1.01 }}
        htmlFor="medicalDataConsent"
        style={{
          display: 'flex',
          alignItems: 'start',
          gap: '0.75rem',
          padding: '1rem',
          background: accepted
            ? isDarkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)'
            : isDarkMode ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.6)',
          border: accepted
            ? '2px solid #22c55e'
            : isDarkMode ? '2px solid #334155' : '2px solid #e5e7eb',
          borderRadius: '12px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          userSelect: 'none'
        }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginTop: '2px' }}>
          <input
            type="checkbox"
            id="medicalDataConsent"
            checked={accepted}
            onChange={(e) => onAcceptChange(e.target.checked)}
            required
            style={{
              width: '20px',
              height: '20px',
              cursor: 'pointer',
              accentColor: '#dc2626'
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: isDarkMode ? '#f1f5f9' : '#111827',
            marginBottom: '0.25rem'
          }}>
            I accept the Medical Data Consent & Legal Disclaimer
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: isDarkMode ? '#94a3b8' : '#6b7280',
            lineHeight: '1.4'
          }}>
            I consent to the collection, storage, and processing of my medical data for blood donation matching as described {isExpanded ? 'above' : 'in the full terms'}.
          </div>
        </div>
      </motion.label>

      {/* Error Message */}
      <AnimatePresence>
        {!accepted && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '0.75rem',
              padding: '0.625rem 0.875rem',
              background: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(254, 226, 226, 0.8)',
              border: isDarkMode ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(252, 165, 165, 0.5)',
              borderRadius: '8px'
            }}
          >
            <AlertTriangle style={{ width: '16px', height: '16px', color: '#ef4444', flexShrink: 0 }} />
            <span style={{
              fontSize: '0.75rem',
              color: '#ef4444',
              fontWeight: '500'
            }}>
              You must accept the consent to continue
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <div style={{
        marginTop: '1rem',
        paddingTop: '1rem',
        borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem'
      }}>
        <p style={{
          fontSize: '0.6875rem',
          color: isDarkMode ? '#64748b' : '#9ca3af',
          margin: 0
        }}>
          Consent Version 1.0 • Last Updated: December 2025
        </p>
        <p style={{
          fontSize: '0.6875rem',
          color: isDarkMode ? '#64748b' : '#9ca3af',
          margin: 0
        }}>
          Questions? Contact:{' '}
          <a href="mailto:privacy@bloodlink.com" style={{
            color: '#3b82f6',
            textDecoration: 'none'
          }}>
            privacy@bloodlink.com
          </a>
        </p>
      </div>
    </motion.div>
  );
};

export default LegalDisclaimer;
