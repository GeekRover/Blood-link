import AuditLog from '../models/AuditLog.js';

/**
 * Create an audit log entry
 * @param {Object} params - Audit log parameters
 * @param {Object} params.performedBy - User who performed the action
 * @param {String} params.action - Action performed
 * @param {String} params.actionCategory - Category of action
 * @param {String} params.description - Description of action
 * @param {String} params.targetModel - Model that was affected
 * @param {String} params.targetId - ID of affected document
 * @param {String} params.targetIdentifier - Human-readable identifier
 * @param {Object} params.changeDetails - Before/after details (optional)
 * @param {String} params.reason - Reason for action (optional)
 * @param {String} params.severity - Severity level (optional)
 * @param {Object} params.req - Express request object (optional)
 */
export const createAuditLog = async (params) => {
  try {
    const {
      performedBy,
      action,
      actionCategory,
      description,
      targetModel,
      targetId,
      targetIdentifier,
      changeDetails,
      reason,
      severity = 'medium',
      req
    } = params;

    // Validate required parameters
    if (!performedBy || !action || !actionCategory || !description || !targetModel || !targetId) {
      console.error('Missing required audit log parameters');
      return null;
    }

    const logData = {
      performedBy: performedBy._id,
      performerRole: performedBy.role,
      performerName: performedBy.name,
      performerEmail: performedBy.email,
      action,
      actionCategory,
      description,
      targetModel,
      targetId,
      targetIdentifier,
      severity,
      status: 'success'
    };

    // Add optional fields
    if (changeDetails) {
      logData.changeDetails = changeDetails;
    }

    if (reason) {
      logData.reason = reason;
    }

    // Extract request metadata if available
    if (req) {
      logData.ipAddress = req.ip || req.connection?.remoteAddress;
      logData.userAgent = req.get('user-agent');
    }

    const auditLog = await AuditLog.createLog(logData);
    return auditLog;
  } catch (error) {
    console.error('Error creating audit log:', error);
    return null;
  }
};

/**
 * Log user verification action
 */
export const logUserVerification = async (admin, user, action, reason, req) => {
  const actionMap = {
    'verify': 'user_verified',
    'reject': 'user_rejected',
    'revoke': 'verification_revoked',
    'request_resubmission': 'user_resubmission_requested'
  };

  const descriptionMap = {
    'verify': `Verified user ${user.name} (${user.email})`,
    'reject': `Rejected verification for ${user.name} (${user.email})`,
    'revoke': `Revoked verification for ${user.name} (${user.email})`,
    'request_resubmission': `Requested resubmission from ${user.name} (${user.email})`
  };

  return await createAuditLog({
    performedBy: admin,
    action: actionMap[action],
    actionCategory: 'verification',
    description: descriptionMap[action],
    targetModel: 'User',
    targetId: user._id,
    targetIdentifier: user.email,
    reason,
    severity: action === 'revoke' ? 'high' : 'medium',
    req
  });
};

/**
 * Log donation verification action
 */
export const logDonationVerification = async (admin, donation, action, reason, req) => {
  const actionMap = {
    'verify': 'donation_verified',
    'reject': 'donation_rejected'
  };

  const descriptionMap = {
    'verify': `Verified donation #${donation._id}`,
    'reject': `Rejected donation #${donation._id}`
  };

  return await createAuditLog({
    performedBy: admin,
    action: actionMap[action],
    actionCategory: 'verification',
    description: descriptionMap[action],
    targetModel: 'DonationHistory',
    targetId: donation._id,
    targetIdentifier: donation._id.toString(),
    reason,
    severity: 'medium',
    req
  });
};

/**
 * Log data correction/override
 */
export const logDataCorrection = async (admin, targetModel, targetId, targetIdentifier, before, after, reason, req) => {
  const fields = Object.keys(after);

  return await createAuditLog({
    performedBy: admin,
    action: targetModel === 'DonationHistory' ? 'donation_override' : 'user_data_corrected',
    actionCategory: 'data_correction',
    description: `Corrected ${targetModel} data for ${targetIdentifier}`,
    targetModel,
    targetId,
    targetIdentifier,
    changeDetails: {
      before,
      after,
      fields
    },
    reason,
    severity: 'high',
    req
  });
};

/**
 * Log badge management action
 */
export const logBadgeAction = async (admin, user, action, badgeType, reason, req) => {
  const actionMap = {
    'grant': 'badge_granted',
    'revoke': 'badge_revoked'
  };

  const descriptionMap = {
    'grant': `Granted ${badgeType} badge to ${user.name}`,
    'revoke': `Revoked ${badgeType} badge from ${user.name}`
  };

  return await createAuditLog({
    performedBy: admin,
    action: actionMap[action],
    actionCategory: 'user_management',
    description: descriptionMap[action],
    targetModel: 'User',
    targetId: user._id,
    targetIdentifier: user.email,
    changeDetails: {
      before: { badge: action === 'grant' ? 'None' : badgeType },
      after: { badge: action === 'grant' ? badgeType : 'None' }
    },
    reason,
    severity: 'medium',
    req
  });
};

/**
 * Log user management action
 */
export const logUserManagement = async (admin, user, action, reason, req) => {
  const actionMap = {
    'activate': 'user_activated',
    'deactivate': 'user_deactivated',
    'delete': 'user_deleted'
  };

  const descriptionMap = {
    'activate': `Activated user ${user.name} (${user.email})`,
    'deactivate': `Deactivated user ${user.name} (${user.email})`,
    'delete': `Deleted user ${user.name} (${user.email})`
  };

  return await createAuditLog({
    performedBy: admin,
    action: actionMap[action],
    actionCategory: 'user_management',
    description: descriptionMap[action],
    targetModel: 'User',
    targetId: user._id,
    targetIdentifier: user.email,
    reason,
    severity: action === 'delete' ? 'critical' : 'high',
    req
  });
};

/**
 * Log blood request admin action
 */
export const logRequestAction = async (admin, request, action, reason, req) => {
  const actionMap = {
    'cancel': 'request_cancelled_by_admin',
    'modify': 'request_modified_by_admin'
  };

  const descriptionMap = {
    'cancel': `Cancelled blood request #${request._id}`,
    'modify': `Modified blood request #${request._id}`
  };

  return await createAuditLog({
    performedBy: admin,
    action: actionMap[action],
    actionCategory: 'user_management',
    description: descriptionMap[action],
    targetModel: 'BloodRequest',
    targetId: request._id,
    targetIdentifier: request._id.toString(),
    reason,
    severity: action === 'cancel' ? 'high' : 'medium',
    req
  });
};

/**
 * Log review moderation action
 */
export const logReviewModeration = async (admin, review, action, reason, req) => {
  const actionMap = {
    'hide': 'review_hidden',
    'delete': 'review_deleted',
    'approve': 'review_approved'
  };

  const descriptionMap = {
    'hide': `Hid review #${review._id}`,
    'delete': `Deleted review #${review._id}`,
    'approve': `Approved review #${review._id}`
  };

  return await createAuditLog({
    performedBy: admin,
    action: actionMap[action],
    actionCategory: 'moderation',
    description: descriptionMap[action],
    targetModel: 'Review',
    targetId: review._id,
    targetIdentifier: review._id.toString(),
    reason,
    severity: action === 'delete' ? 'high' : 'medium',
    req
  });
};

/**
 * Log chat moderation action
 */
export const logChatModeration = async (admin, targetModel, targetId, action, reason, req) => {
  const actionMap = {
    'delete_chat': 'chat_deleted',
    'delete_message': 'message_deleted'
  };

  const descriptionMap = {
    'delete_chat': `Deleted chat #${targetId}`,
    'delete_message': `Deleted message #${targetId}`
  };

  return await createAuditLog({
    performedBy: admin,
    action: actionMap[action],
    actionCategory: 'moderation',
    description: descriptionMap[action],
    targetModel,
    targetId,
    targetIdentifier: targetId.toString(),
    reason,
    severity: 'medium',
    req
  });
};

/**
 * Log system configuration change
 */
export const logConfigChange = async (admin, configKey, before, after, req) => {
  return await createAuditLog({
    performedBy: admin,
    action: 'config_updated',
    actionCategory: 'system_config',
    description: `Updated system configuration: ${configKey}`,
    targetModel: 'SystemConfig',
    targetId: admin._id, // Using admin ID as placeholder
    targetIdentifier: configKey,
    changeDetails: {
      before: { [configKey]: before },
      after: { [configKey]: after },
      fields: [configKey]
    },
    severity: 'high',
    req
  });
};

export default {
  createAuditLog,
  logUserVerification,
  logDonationVerification,
  logDataCorrection,
  logBadgeAction,
  logUserManagement,
  logRequestAction,
  logReviewModeration,
  logChatModeration,
  logConfigChange
};
