/**
 * SMS Service - Stub implementation
 * In production, integrate with actual SMS provider (Twilio, Nexmo, etc.)
 */

const SMS_ENABLED = process.env.SMS_ENABLED === 'true';

/**
 * Send SMS notification
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - SMS message content
 * @returns {Promise<object>} - Result object
 */
export const sendSMS = async (phoneNumber, message) => {
  console.log(`📱 SMS Service Called`);
  console.log(`To: ${phoneNumber}`);
  console.log(`Message: ${message}`);

  if (!SMS_ENABLED) {
    console.log('⚠️  SMS is disabled in environment');
    return {
      success: false,
      message: 'SMS service is disabled',
      mock: true
    };
  }

  // Stub implementation - simulate SMS sending
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        messageId: `SMS-${Date.now()}`,
        timestamp: new Date(),
        mock: true
      });
    }, 100);
  });
};

/**
 * Send blood request notification to donor
 */
export const notifyDonorAboutRequest = async (donor, bloodRequest) => {
  const message = `BloodLink Alert: ${bloodRequest.patientName} needs ${bloodRequest.bloodType} blood urgently at ${bloodRequest.hospital.name}. Please respond ASAP.`;

  return await sendSMS(donor.phone, message);
};

/**
 * Send donation confirmation SMS
 */
export const sendDonationConfirmation = async (donor, donationHistory) => {
  const message = `Thank you for your donation! You've saved a life. Your donation has been recorded. Next eligible date: ${donationHistory.nextEligibleDate || 'TBD'}`;

  return await sendSMS(donor.phone, message);
};

/**
 * Send request fulfillment notification to recipient
 */
export const notifyRequestFulfilled = async (recipient, bloodRequest) => {
  const message = `Good news! Your blood request has been fulfilled. ${bloodRequest.totalUnitsFulfilled}/${bloodRequest.unitsRequired} units collected.`;

  return await sendSMS(recipient.phone, message);
};

/**
 * Send verification approval notification
 */
export const notifyVerificationApproved = async (user) => {
  const message = `Congratulations! Your BloodLink account has been verified. You can now access all features.`;

  return await sendSMS(user.phone, message);
};

/**
 * Send OTP for verification
 */
export const sendOTP = async (phoneNumber, otp) => {
  const message = `Your BloodLink verification code is: ${otp}. Valid for 10 minutes.`;

  return await sendSMS(phoneNumber, message);
};

/**
 * Send reminder for donation eligibility
 */
export const sendDonationReminderSMS = async (donor) => {
  const message = `You're now eligible to donate blood again! Help save lives by making another donation through BloodLink.`;

  return await sendSMS(donor.phone, message);
};

/**
 * Send event reminder
 */
export const sendEventReminder = async (donor, event) => {
  const message = `Reminder: Blood donation camp "${event.title}" is tomorrow at ${event.venue.name}. Your participation can save lives!`;

  return await sendSMS(donor.phone, message);
};

export default {
  sendSMS,
  notifyDonorAboutRequest,
  sendDonationConfirmation,
  notifyRequestFulfilled,
  notifyVerificationApproved,
  sendOTP,
  sendDonationReminderSMS,
  sendEventReminder
};
