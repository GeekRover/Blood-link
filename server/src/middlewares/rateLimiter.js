import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10000, // Unlimited for development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Strict rate limiter for authentication routes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Essentially unlimited for development
  skipSuccessfulRequests: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes.'
  }
});

/**
 * Rate limiter for registration
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10000, // Unlimited for development
  message: {
    success: false,
    message: 'Too many accounts created from this IP, please try again after an hour.'
  }
});

/**
 * Rate limiter for blood request creation
 */
export const requestLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // 5 requests per day
  message: {
    success: false,
    message: 'Too many blood requests created today, please try again tomorrow.'
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?._id?.toString() || req.ip;
  }
});

/**
 * Rate limiter for SMS sending
 */
export const smsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 SMS per hour
  message: {
    success: false,
    message: 'SMS limit exceeded. Please try again later.'
  }
});

/**
 * Rate limiter for chat messages
 */
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute
  message: {
    success: false,
    message: 'Too many messages sent. Please slow down.'
  },
  keyGenerator: (req) => {
    return req.user?._id?.toString() || req.ip;
  }
});

/**
 * Rate limiter for donor search
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 searches per minute
  message: {
    success: false,
    message: 'Too many searches. Please try again in a minute.'
  },
  keyGenerator: (req) => {
    return req.user?._id?.toString() || req.ip;
  }
});

/**
 * Rate limiter for file uploads
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: {
    success: false,
    message: 'Upload limit exceeded. Please try again later.'
  },
  keyGenerator: (req) => {
    return req.user?._id?.toString() || req.ip;
  }
});

/**
 * Rate limiter for admin actions
 */
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    success: false,
    message: 'Too many admin actions. Please slow down.'
  },
  keyGenerator: (req) => {
    return req.user?._id?.toString() || req.ip;
  }
});

export default {
  apiLimiter,
  authLimiter,
  registerLimiter,
  requestLimiter,
  smsLimiter,
  chatLimiter,
  searchLimiter,
  uploadLimiter,
  adminLimiter
};
