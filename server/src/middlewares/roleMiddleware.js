import { USER_ROLES } from '../config/constants.js';

/**
 * Restrict access to specific roles
 * @param  {...string} roles - Allowed roles
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Check if user is admin
 */
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  if (req.user.role !== USER_ROLES.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }

  next();
};

/**
 * Check if user is donor
 */
export const isDonor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  if (req.user.role !== USER_ROLES.DONOR) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Donor privileges required.'
    });
  }

  next();
};

/**
 * Check if user is recipient
 */
export const isRecipient = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  if (req.user.role !== USER_ROLES.RECIPIENT) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Recipient privileges required.'
    });
  }

  next();
};

/**
 * Check if user is verified
 */
export const isVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  if (req.user.verificationStatus !== 'verified') {
    return res.status(403).json({
      success: false,
      message: 'Account verification required. Please wait for admin approval.'
    });
  }

  next();
};

/**
 * Check if user owns the resource
 */
export const isOwner = (resourceUserIdField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Allow admins to access any resource
    if (req.user.role === USER_ROLES.ADMIN) {
      return next();
    }

    // Check ownership
    const resourceUserId = req.resource?.[resourceUserIdField]?.toString();
    const currentUserId = req.user._id.toString();

    if (resourceUserId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this resource.'
      });
    }

    next();
  };
};

/**
 * Check admin permission
 */
export const checkPermission = (permission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (req.user.role !== USER_ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Admin privileges required'
      });
    }

    // Check if admin has the specific permission
    if (!req.user.permissions?.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Permission denied. Required permission: ${permission}`
      });
    }

    next();
  };
};

export default {
  restrictTo,
  isAdmin,
  isDonor,
  isRecipient,
  isVerified,
  isOwner,
  checkPermission
};
