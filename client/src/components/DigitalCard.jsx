import { motion, AnimatePresence } from 'framer-motion';
import { useDarkMode } from '../context/DarkModeContext';
import {
  X, Download, Share2, Printer, Calendar, Droplet, MapPin,
  CheckCircle, QrCode, Award, RefreshCw
} from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { donationAPI } from '../services/api';
import QRCode from 'qrcode';

const DigitalCard = ({ card, onClose, onRegenerate }) => {
  const { isDarkMode } = useDarkMode();
  const [qrDataURL, setQrDataURL] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  // Generate QR code from card data
  useEffect(() => {
    const qrData = card?.qrCodeData || card?.qrCode || '';
    if (qrData) {
      QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 300,
        color: {
          dark: '#111827',
          light: '#FFFFFF'
        }
      })
        .then(url => setQrDataURL(url))
        .catch(err => console.error('QR code generation error:', err));
    }
  }, [card]);

  const handleDownload = () => {
    if (!qrDataURL) {
      toast.error('QR code not ready yet');
      return;
    }

    const link = document.createElement('a');
    link.download = `donation-card-${card.cardNumber}.png`;
    link.href = qrDataURL;
    link.click();
    toast.success('Card downloaded successfully!', { icon: '💾' });
  };

  const handleShare = async () => {
    if (!qrDataURL) {
      toast.error('QR code not ready yet');
      return;
    }

    try {
      // Convert data URL to blob
      const response = await fetch(qrDataURL);
      const blob = await response.blob();
      const file = new File([blob], `donation-card-${card.cardNumber}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'My Blood Donation Card',
          text: `I donated blood on ${new Date(card.donationDate).toLocaleDateString()}!`,
          files: [file]
        });
        toast.success('Card shared successfully!', { icon: '📤' });
      } else {
        // Fallback: copy to clipboard
        const cardURL = window.location.origin + '/donations/card/' + card._id;
        await navigator.clipboard.writeText(cardURL);
        toast.success('Card link copied to clipboard!', { icon: '📋' });
      }
    } catch (error) {
      console.error('Share failed:', error);
      toast.error('Failed to share card');
    }
  };

  const handlePrint = () => {
    window.print();
    toast.success('Print dialog opened', { icon: '🖨️' });
  };

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      const reason = prompt('Please provide a reason for regenerating the QR code (minimum 10 characters):');

      if (!reason || reason.length < 10) {
        toast.error('Reason must be at least 10 characters', { icon: '⚠️' });
        return;
      }

      await donationAPI.regenerateQR(card._id, { reason });
      toast.success('QR code regenerated successfully!', { icon: '✅' });
      if (onRegenerate) onRegenerate();
      onClose();
    } catch (error) {
      console.error('Regenerate failed:', error);
      toast.error('Failed to regenerate QR code');
    } finally {
      setRegenerating(false);
    }
  };

  if (!card) return null;

  // Extract data from populated references
  const donorName = card.donor?.name || card.donorName || 'Anonymous Donor';
  const bloodType = card.donor?.bloodType || card.bloodType || card.donationHistory?.bloodType || 'N/A';
  const donationDate = card.donationHistory?.donationDate || card.donationDate || card.issuedDate;
  const donationCenter = card.donationHistory?.donationCenter?.name || card.donationCenter || null;
  const qrCodeString = card.qrCodeData || card.qrCode || '';
  const expiryDate = card.validUntil || card.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
          overflow: 'auto'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: isDarkMode ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            borderRadius: '24px',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '95vh',
            overflow: 'auto',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)'
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              color: isDarkMode ? '#f1f5f9' : '#111827',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <Award style={{ width: '28px', height: '28px', color: '#dc2626' }} />
              Digital Donation Card
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                color: isDarkMode ? '#94a3b8' : '#6b7280',
                transition: 'color 0.2s'
              }}
            >
              <X style={{ width: '24px', height: '24px' }} />
            </button>
          </div>

          {/* Digital Card Display */}
          <div
            className="printable-card"
            style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              borderRadius: '20px',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 8px 32px rgba(220, 38, 38, 0.4)',
              color: 'white'
            }}
          >
            {/* Card Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
              marginBottom: '1.5rem'
            }}>
              <div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  marginBottom: '0.25rem',
                  color: 'white'
                }}>
                  BloodLink
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  opacity: 0.9
                }}>
                  Digital Donation Certificate
                </p>
              </div>
              <div style={{
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                backdropFilter: 'blur(8px)'
              }}>
                <CheckCircle style={{ width: '24px', height: '24px' }} />
              </div>
            </div>

            {/* Donor Info */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              backdropFilter: 'blur(8px)'
            }}>
              <p style={{
                fontSize: '0.75rem',
                opacity: 0.8,
                marginBottom: '0.5rem'
              }}>
                Donor Name
              </p>
              <p style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '1rem'
              }}>
                {donorName}
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem'
              }}>
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.25rem'
                  }}>
                    <Droplet style={{ width: '16px', height: '16px' }} />
                    <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Blood Type</p>
                  </div>
                  <p style={{ fontSize: '1.125rem', fontWeight: '600' }}>{bloodType}</p>
                </div>

                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.25rem'
                  }}>
                    <Calendar style={{ width: '16px', height: '16px' }} />
                    <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Donation Date</p>
                  </div>
                  <p style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                    {new Date(donationDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {donationCenter && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.25rem'
                  }}>
                    <MapPin style={{ width: '16px', height: '16px' }} />
                    <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Donation Center</p>
                  </div>
                  <p style={{ fontSize: '0.9375rem', fontWeight: '600' }}>
                    {donationCenter}
                  </p>
                </div>
              )}
            </div>

            {/* QR Code */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              {qrDataURL ? (
                <>
                  <img
                    src={qrDataURL}
                    alt="QR Code"
                    style={{
                      width: '200px',
                      height: '200px',
                      margin: '0 auto',
                      display: 'block',
                      borderRadius: '8px'
                    }}
                  />
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginTop: '1rem'
                  }}>
                    Card #: {card.cardNumber}
                  </p>
                  <p style={{
                    fontSize: '0.625rem',
                    color: '#9ca3af',
                    marginTop: '0.25rem'
                  }}>
                    Scan to verify donation
                  </p>
                </>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '3rem 1rem',
                  color: '#6b7280'
                }}>
                  <QrCode style={{ width: '48px', height: '48px' }} />
                  <p>Generating QR code...</p>
                </div>
              )}
            </div>

            {/* Valid Until */}
            <div style={{
              marginTop: '1.5rem',
              textAlign: 'center',
              fontSize: '0.75rem',
              opacity: 0.8
            }}>
              <p>Valid until: {new Date(expiryDate).toLocaleDateString()}</p>
              <p style={{ marginTop: '0.25rem' }}>
                Verified count: {card.verificationCount || 0} times
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '0.75rem'
          }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownload}
              style={{
                padding: '0.875rem',
                background: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                color: '#3b82f6',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Download style={{ width: '16px', height: '16px' }} />
              Download
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              style={{
                padding: '0.875rem',
                background: isDarkMode ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)',
                color: '#22c55e',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Share2 style={{ width: '16px', height: '16px' }} />
              Share
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrint}
              style={{
                padding: '0.875rem',
                background: isDarkMode ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.1)',
                color: '#a855f7',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Printer style={{ width: '16px', height: '16px' }} />
              Print
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRegenerate}
              disabled={regenerating}
              style={{
                padding: '0.875rem',
                background: regenerating
                  ? isDarkMode ? 'rgba(234, 179, 8, 0.1)' : 'rgba(234, 179, 8, 0.05)'
                  : isDarkMode ? 'rgba(234, 179, 8, 0.2)' : 'rgba(234, 179, 8, 0.1)',
                color: '#eab308',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: regenerating ? 'not-allowed' : 'pointer',
                opacity: regenerating ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <RefreshCw
                style={{
                  width: '16px',
                  height: '16px',
                  animation: regenerating ? 'spin 1s linear infinite' : 'none'
                }}
              />
              Regenerate
            </motion.button>
          </div>

          {/* Print Styles */}
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .printable-card, .printable-card * {
                visibility: visible;
              }
              .printable-card {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DigitalCard;
