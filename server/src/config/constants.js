/**
 * Application Constants
 */

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const USER_ROLES = {
  DONOR: 'donor',
  RECIPIENT: 'recipient',
  ADMIN: 'admin'
};

export const REQUEST_STATUS = {
  PENDING: 'pending',
  MATCHED: 'matched',
  FULFILLED: 'fulfilled',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
};

export const REQUEST_URGENCY = {
  CRITICAL: 'critical',
  URGENT: 'urgent',
  NORMAL: 'normal'
};

export const NOTIFICATION_TYPES = {
  REQUEST_CREATED: 'request_created',
  REQUEST_MATCHED: 'request_matched',
  DONATION_RECORDED: 'donation_recorded',
  CHAT_MESSAGE: 'chat_message',
  VERIFICATION_APPROVED: 'verification_approved',
  VERIFICATION_REJECTED: 'verification_rejected',
  VERIFICATION_RESUBMISSION_REQUESTED: 'verification_resubmission_requested',
  VERIFICATION_REVOKED: 'verification_revoked',
  REMINDER: 'reminder',
  SYSTEM: 'system'
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

export const PAYMENT_METHODS = {
  BKASH: 'bKash',
  NAGAD: 'Nagad',
  CARD: 'card',
  CASH: 'cash'
};

export const DONATION_COOLDOWN_DAYS = parseInt(process.env.DONATION_COOLDOWN_DAYS) || 90;

export const DEFAULT_SEARCH_RADIUS_KM = parseInt(process.env.DEFAULT_SEARCH_RADIUS_KM) || 50;

export const MAX_SEARCH_RADIUS_KM = parseInt(process.env.MAX_SEARCH_RADIUS_KM) || 200;

export const LEADERBOARD_POINTS = {
  DONATION: parseInt(process.env.POINTS_PER_DONATION) || 100,
  URGENT_BONUS: parseInt(process.env.POINTS_URGENT_BONUS) || 50,
  CRITICAL_BONUS: 100,
  REVIEW_BONUS: parseInt(process.env.POINTS_REVIEW_BONUS) || 10,
  FIRST_DONATION: 50,
  MILESTONE_10: 500,
  MILESTONE_25: 1000,
  MILESTONE_50: 2500
};

export const MIN_AGE = parseInt(process.env.MIN_AGE) || 18;
export const MAX_AGE = parseInt(process.env.MAX_AGE) || 65;

export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected'
};
