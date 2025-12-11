import QRCode from 'qrcode';
import crypto from 'crypto';

/**
 * Generate QR code for digital donation card
 * @param {object} donationData - Donation information
 * @returns {Promise<object>} - QR code data and image
 */
export const generateDonationQR = async (donationData) => {
  try {
    // Create secure data string
    const qrData = {
      cardNumber: donationData.cardNumber,
      donorId: donationData.donorId,
      donationId: donationData.donationId,
      bloodType: donationData.bloodType,
      donationDate: donationData.donationDate,
      timestamp: Date.now(),
      // Add signature for security
      signature: generateSignature(donationData)
    };

    const qrDataString = JSON.stringify(qrData);

    // Generate QR code as Data URL
    const qrCodeImage = await QRCode.toDataURL(qrDataString, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return {
      qrCode: qrCodeImage,
      qrData: qrDataString,
      cardNumber: donationData.cardNumber
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Verify QR code data
 * @param {string} qrDataString - QR code data string
 * @returns {object} - Parsed and verified data
 */
export const verifyDonationQR = (qrDataString) => {
  try {
    const qrData = JSON.parse(qrDataString);

    // Verify signature
    const dataToVerify = {
      cardNumber: qrData.cardNumber,
      donorId: qrData.donorId,
      donationId: qrData.donationId,
      bloodType: qrData.bloodType,
      donationDate: qrData.donationDate
    };

    const expectedSignature = generateSignature(dataToVerify);

    if (qrData.signature !== expectedSignature) {
      throw new Error('Invalid QR code signature');
    }

    // Check timestamp (QR code valid for 1 year)
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    if (Date.now() - qrData.timestamp > oneYearInMs) {
      throw new Error('QR code has expired');
    }

    return {
      valid: true,
      data: qrData
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
};

/**
 * Generate signature for QR data security
 * @param {object} data - Data to sign
 * @returns {string} - Signature
 */
const generateSignature = (data) => {
  const secret = process.env.JWT_SECRET || 'bloodlink-secret';
  const dataString = JSON.stringify({
    cardNumber: data.cardNumber,
    donorId: data.donorId,
    donationId: data.donationId
  });

  return crypto
    .createHmac('sha256', secret)
    .update(dataString)
    .digest('hex');
};

/**
 * Generate QR code for event check-in
 */
export const generateEventQR = async (eventData) => {
  try {
    const qrData = {
      eventId: eventData.eventId,
      donorId: eventData.donorId,
      registrationId: eventData.registrationId,
      timestamp: Date.now()
    };

    const qrDataString = JSON.stringify(qrData);

    const qrCodeImage = await QRCode.toDataURL(qrDataString, {
      errorCorrectionLevel: 'M',
      width: 250
    });

    return {
      qrCode: qrCodeImage,
      qrData: qrDataString
    };
  } catch (error) {
    throw new Error('Failed to generate event QR code');
  }
};

export default {
  generateDonationQR,
  verifyDonationQR,
  generateEventQR
};
