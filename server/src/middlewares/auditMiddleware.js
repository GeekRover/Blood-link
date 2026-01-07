import { createAuditLog } from '../utils/auditLogger.js';

/**
 * Middleware to automatically log admin actions
 * Attach this middleware to routes that should be audited
 *
 * Usage:
 * router.post('/verify', protect, restrictTo('admin'), auditAction('user_verified', 'verification'), controller)
 */
export const auditAction = (action, category, getTargetInfo) => {
  return async (req, res, next) => {
    // Store original send function
    const originalSend = res.send;

    // Override send function to log after successful response
    res.send = function(data) {
      // Only log if response was successful (2xx status)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Get target information
        let targetModel, targetId, targetIdentifier, description;

        if (typeof getTargetInfo === 'function') {
          const targetInfo = getTargetInfo(req, res);
          targetModel = targetInfo.targetModel;
          targetId = targetInfo.targetId;
          targetIdentifier = targetInfo.targetIdentifier;
          description = targetInfo.description;
        } else {
          // Default target info extraction
          targetModel = 'User';
          targetId = req.params.userId || req.params.id;
          targetIdentifier = req.body.email || targetId;
          description = `Performed ${action}`;
        }

        // Create audit log asynchronously (don't block response)
        setImmediate(() => {
          createAuditLog({
            performedBy: req.user,
            action,
            actionCategory: category,
            description,
            targetModel,
            targetId,
            targetIdentifier,
            reason: req.body.reason,
            req
          }).catch(err => {
            console.error('Failed to create audit log:', err);
          });
        });
      }

      // Call original send function
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Middleware to log data changes
 * Captures before and after states
 */
export const auditDataChange = (getChangeInfo) => {
  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setImmediate(async () => {
          try {
            const changeInfo = await getChangeInfo(req, res);

            if (changeInfo && changeInfo.before && changeInfo.after) {
              await createAuditLog({
                performedBy: req.user,
                action: changeInfo.action || 'data_corrected',
                actionCategory: 'data_correction',
                description: changeInfo.description,
                targetModel: changeInfo.targetModel,
                targetId: changeInfo.targetId,
                targetIdentifier: changeInfo.targetIdentifier,
                changeDetails: {
                  before: changeInfo.before,
                  after: changeInfo.after,
                  fields: Object.keys(changeInfo.after)
                },
                reason: req.body.reason || changeInfo.reason,
                severity: 'high',
                req
              });
            }
          } catch (err) {
            console.error('Failed to create audit log for data change:', err);
          }
        });
      }

      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Helper function to create audit log from controller
 * Use this when middleware approach is not suitable
 */
export const logFromController = async (req, action, category, targetInfo, severity = 'medium') => {
  try {
    await createAuditLog({
      performedBy: req.user,
      action,
      actionCategory: category,
      description: targetInfo.description,
      targetModel: targetInfo.targetModel,
      targetId: targetInfo.targetId,
      targetIdentifier: targetInfo.targetIdentifier,
      changeDetails: targetInfo.changeDetails,
      reason: targetInfo.reason || req.body.reason,
      severity,
      req
    });
  } catch (error) {
    console.error('Failed to log from controller:', error);
    // Don't throw - audit logging should not break main flow
  }
};

export default {
  auditAction,
  auditDataChange,
  logFromController
};
