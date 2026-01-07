import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { donationAPI } from '../services/api';
import { useDarkMode } from '../context/DarkModeContext';
import {
  QrCode, Camera, CameraOff, Check, X, AlertCircle, Copy, Eye,
  Shield, Clock, User, Droplet, MapPin
} from 'lucide-react';

const QRCodeScanner = () => {
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [inputMode, setInputMode] = useState('camera'); // 'camera' or 'manual'

  useEffect(() => {
    return () => {
      if (cameraActive) {
        stopCamera();
      }
    };
  }, [cameraActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        scanQRCode();
      }
    } catch (error) {
      console.error('Failed to start camera:', error);
      toast.error('Could not access camera. Please check permissions.', { icon: '📷' });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const scanQRCode = () => {
    if (!cameraActive || !videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Simulate QR code detection (in production, use a QR code library like jsQR)
    // For now, we'll just scan the canvas
    setTimeout(scanQRCode, 300);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);

        // In production, decode the QR code from the image
        toast.info('Image loaded. Please enter QR code manually or use camera.', { icon: '📸' });
      };
      img.src = e.target?.result;
    };
    reader.readAsDataURL(file);
  };

  const verifyQRCode = async (code) => {
    if (!code || code.trim().length === 0) {
      toast.error('Please enter or scan a QR code', { icon: '⚠️' });
      return;
    }

    try {
      setLoading(true);
      const result = await donationAPI.verifyQRCode({ code: code.trim() });
      setVerificationResult(result.data);
      setShowResultModal(true);
      toast.success('QR Code verified!', { icon: '✅' });
    } catch (error) {
      console.error('Failed to verify QR code:', error);
      const errorMsg = error.response?.data?.message || 'Failed to verify QR code';
      setVerificationResult({ error: errorMsg });
      setShowResultModal(true);
      toast.error(errorMsg, { icon: '❌' });
    } finally {
      setLoading(false);
    }
  };

  const handleScanSubmit = () => {
    const code = scannedCode || manualCode;
    if (!code) {
      toast.error('No QR code to verify', { icon: '⚠️' });
      return;
    }
    verifyQRCode(code);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(manualCode);
    toast.success('Code copied!', { icon: '📋' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: isDarkMode
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
        : 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
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
              <QrCode style={{ width: '32px', height: '32px', color: '#22c55e' }} />
              QR Code Scanner
            </h1>
            <p style={{
              color: isDarkMode ? '#cbd5e1' : '#6b7280',
              fontSize: '0.875rem'
            }}>
              Scan or verify digital donation card QR codes
            </p>
          </div>
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
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            Back to Dashboard
          </motion.button>
        </motion.div>

        {/* Mode Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            marginBottom: '2rem',
            display: 'flex',
            gap: '1rem',
            background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            padding: '0.5rem',
            borderRadius: '12px',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => {
              setInputMode('camera');
              if (!cameraActive) startCamera();
            }}
            style={{
              flex: 1,
              padding: '0.75rem 1.5rem',
              background: inputMode === 'camera' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'transparent',
              color: inputMode === 'camera' ? 'white' : (isDarkMode ? '#cbd5e1' : '#6b7280'),
              border: 'none',
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
            <Camera style={{ width: '1rem', height: '1rem' }} />
            Camera Scan
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => {
              setInputMode('manual');
              stopCamera();
            }}
            style={{
              flex: 1,
              padding: '0.75rem 1.5rem',
              background: inputMode === 'manual' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'transparent',
              color: inputMode === 'manual' ? 'white' : (isDarkMode ? '#cbd5e1' : '#6b7280'),
              border: 'none',
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
            <AlertCircle style={{ width: '1rem', height: '1rem' }} />
            Manual Entry
          </motion.button>
        </motion.div>

        {/* Camera Mode */}
        {inputMode === 'camera' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
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
              position: 'relative',
              paddingBottom: '100%',
              background: '#000',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              <video
                ref={videoRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                autoPlay
                playsInline
              />
              <canvas
                ref={canvasRef}
                style={{ display: 'none' }}
              />

              {/* QR Code Frame */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '250px',
                height: '250px',
                border: '3px solid #22c55e',
                borderRadius: '12px',
                boxShadow: '0 0 20px rgba(34, 197, 94, 0.5), inset 0 0 20px rgba(34, 197, 94, 0.1)'
              }} />

              {cameraActive && (
                <div style={{
                  position: 'absolute',
                  bottom: '1rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  color: '#fff',
                  fontSize: '0.875rem',
                  textAlign: 'center'
                }}>
                  Position QR code inside frame
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '1.5rem',
              justifyContent: 'center'
            }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={cameraActive ? stopCamera : startCamera}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: cameraActive
                    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                    : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {cameraActive ? (
                  <>
                    <CameraOff style={{ width: '1rem', height: '1rem' }} />
                    Stop Camera
                  </>
                ) : (
                  <>
                    <Camera style={{ width: '1rem', height: '1rem' }} />
                    Start Camera
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => fileInputRef.current?.click()}
                style={{
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
                  gap: '0.5rem'
                }}
              >
                Upload Image
              </motion.button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>
          </motion.div>
        )}

        {/* Manual Entry Mode */}
        {inputMode === 'manual' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
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
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: isDarkMode ? '#f1f5f9' : '#111827',
              marginBottom: '1rem'
            }}>
              Enter QR Code Manually
            </h3>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#f1f5f9' : '#111827'
                }}>
                  QR Code Data
                </label>
                <textarea
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Paste the QR code data here..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    outline: 'none',
                    minHeight: '120px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem'
              }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleCopyCode()}
                  disabled={!manualCode}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(0, 0, 0, 0.05)',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: !manualCode ? 'not-allowed' : 'pointer',
                    opacity: !manualCode ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Copy style={{ width: '1rem', height: '1rem' }} />
                  Copy
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={handleScanSubmit}
                  disabled={loading || !manualCode}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1.5rem',
                    background: loading || !manualCode
                      ? 'rgba(34, 197, 94, 0.5)'
                      : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: loading || !manualCode ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Check style={{ width: '1rem', height: '1rem' }} />
                  {loading ? 'Verifying...' : 'Verify Code'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            padding: '1.5rem',
            background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
            border: '1px solid #3b82f6',
            borderRadius: '12px',
            color: isDarkMode ? '#cbd5e1' : '#6b7280',
            fontSize: '0.875rem'
          }}
        >
          <h4 style={{
            fontWeight: '600',
            marginBottom: '0.75rem',
            color: isDarkMode ? '#f1f5f9' : '#111827',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle style={{ width: '1.25rem', height: '1.25rem' }} />
            How It Works
          </h4>
          <ul style={{ marginLeft: '1.5rem', display: 'grid', gap: '0.5rem' }}>
            <li>Use camera mode to scan QR codes from digital donation cards</li>
            <li>Or manually paste the QR code data in the manual entry field</li>
            <li>Click verify to check the donation record validity</li>
            <li>View detailed donation information in the result modal</li>
          </ul>
        </motion.div>
      </div>

      {/* Result Modal */}
      <AnimatePresence>
        {showResultModal && verificationResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowResultModal(false)}
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
              {verificationResult.error ? (
                <>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <X style={{ width: '32px', height: '32px', color: 'white' }} />
                    </div>
                  </div>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    textAlign: 'center',
                    marginBottom: '1rem'
                  }}>
                    Verification Failed
                  </h2>
                  <p style={{
                    color: isDarkMode ? '#cbd5e1' : '#6b7280',
                    textAlign: 'center',
                    marginBottom: '1.5rem'
                  }}>
                    {verificationResult.error}
                  </p>
                </>
              ) : (
                <>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Check style={{ width: '32px', height: '32px', color: 'white' }} />
                    </div>
                  </div>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: isDarkMode ? '#f1f5f9' : '#111827',
                    textAlign: 'center',
                    marginBottom: '1rem'
                  }}>
                    QR Code Valid
                  </h2>

                  {/* Donation Details */}
                  {verificationResult.donation && (
                    <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div style={{
                        padding: '1rem',
                        background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                        borderRadius: '8px'
                      }}>
                        <p style={{
                          color: isDarkMode ? '#cbd5e1' : '#6b7280',
                          fontSize: '0.75rem',
                          marginBottom: '0.25rem'
                        }}>
                          Donor
                        </p>
                        <p style={{
                          color: isDarkMode ? '#f1f5f9' : '#111827',
                          fontWeight: '600'
                        }}>
                          {verificationResult.donation.donor?.firstName} {verificationResult.donation.donor?.lastName}
                        </p>
                      </div>

                      {verificationResult.donation.bloodType && (
                        <div style={{
                          padding: '1rem',
                          background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <Droplet style={{ width: '1.25rem', height: '1.25rem', color: '#dc2626' }} />
                          <span style={{ color: isDarkMode ? '#f1f5f9' : '#111827', fontWeight: '600' }}>
                            {verificationResult.donation.bloodType}
                          </span>
                        </div>
                      )}

                      {verificationResult.donation.donationDate && (
                        <div style={{
                          padding: '1rem',
                          background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <Clock style={{ width: '1.25rem', height: '1.25rem', color: '#f59e0b' }} />
                          <span style={{ color: isDarkMode ? '#f1f5f9' : '#111827' }}>
                            {new Date(verificationResult.donation.donationDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {verificationResult.donation.center && (
                        <div style={{
                          padding: '1rem',
                          background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <MapPin style={{ width: '1.25rem', height: '1.25rem', color: '#3b82f6' }} />
                          <span style={{ color: isDarkMode ? '#f1f5f9' : '#111827' }}>
                            {verificationResult.donation.center}
                          </span>
                        </div>
                      )}

                      {verificationResult.donation.status && (
                        <div style={{
                          padding: '1rem',
                          background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <Shield style={{ width: '1.25rem', height: '1.25rem', color: '#22c55e' }} />
                          <span style={{ color: isDarkMode ? '#f1f5f9' : '#111827', fontWeight: '600' }}>
                            Status: <span style={{ textTransform: 'capitalize' }}>
                              {verificationResult.donation.status}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => {
                    setShowResultModal(false);
                    setManualCode('');
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

export default QRCodeScanner;
