import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  // Who performed the action
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Performer is required']
  },
  performerRole: {
    type: String,
    required: true
  },
  performerName: {
    type: String,
    required: true
  },
  performerEmail: {
    type: String,
    required: true
  },

  // What action was performed
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: [
      // User verification actions
      'user_verified',
      'user_rejected',
      'user_resubmission_requested',
      'verification_revoked',

      // Donation verification actions
      'donation_verified',
      'donation_rejected',

      // Data modification actions
      'donation_override',
      'donation_corrected',
      'user_data_corrected',

      // Request management
      'request_cancelled_by_admin',
      'request_modified_by_admin',

      // Badge management
      'badge_granted',
      'badge_revoked',

      // User management
      'user_activated',
      'user_deactivated',
      'user_deleted',

      // Review moderation
      'review_hidden',
      'review_deleted',
      'review_approved',

      // Chat moderation
      'chat_deleted',
      'message_deleted',

      // System configuration
      'config_updated',

      // Other
      'other'
    ]
  },

  // Details of the action
  actionCategory: {
    type: String,
    enum: ['verification', 'moderation', 'data_correction', 'user_management', 'system_config'],
    required: true
  },

  description: {
    type: String,
    required: [true, 'Description is required']
  },

  // Target of the action (what was affected)
  targetModel: {
    type: String,
    enum: ['User', 'DonationHistory', 'BloodRequest', 'Review', 'Chat', 'Message', 'SystemConfig', 'Badge'],
    required: true
  },

  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  targetIdentifier: {
    type: String, // e.g., user email, donation ID, etc.
    required: true
  },

  // Before and after states (for data corrections)
  changeDetails: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
    fields: [String] // List of fields that changed
  },

  // Additional metadata
  reason: {
    type: String // Reason for the action (especially important for rejections/overrides)
  },

  ipAddress: {
    type: String
  },

  userAgent: {
    type: String
  },

  // Severity level
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },

  // Status
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'success'
  },

  errorMessage: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ targetModel: 1, targetId: 1 });
auditLogSchema.index({ actionCategory: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ severity: 1, createdAt: -1 });

// Virtual for formatted timestamp
auditLogSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleString();
});

// Method to get human-readable action description
auditLogSchema.methods.getActionDescription = function() {
  const actionMap = {
    'user_verified': 'verified user',
    'user_rejected': 'rejected user verification',
    'user_resubmission_requested': 'requested verification resubmission',
    'verification_revoked': 'revoked verification',
    'donation_verified': 'verified donation',
    'donation_rejected': 'rejected donation',
    'donation_override': 'overrode donation record',
    'donation_corrected': 'corrected donation data',
    'user_data_corrected': 'corrected user data',
    'request_cancelled_by_admin': 'cancelled blood request',
    'request_modified_by_admin': 'modified blood request',
    'badge_granted': 'granted badge',
    'badge_revoked': 'revoked badge',
    'user_activated': 'activated user',
    'user_deactivated': 'deactivated user',
    'user_deleted': 'deleted user',
    'review_hidden': 'hid review',
    'review_deleted': 'deleted review',
    'review_approved': 'approved review',
    'chat_deleted': 'deleted chat',
    'message_deleted': 'deleted message',
    'config_updated': 'updated system configuration'
  };

  return actionMap[this.action] || this.action;
};

// Static method to create audit log entry
auditLogSchema.statics.createLog = async function(logData) {
  try {
    const log = await this.create(logData);
    return log;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error - audit logging should not break the main flow
    return null;
  }
};

// Static method to get logs by user
auditLogSchema.statics.getLogsByUser = function(userId, options = {}) {
  const { page = 1, limit = 20, action, category } = options;

  const query = { performedBy: userId };
  if (action) query.action = action;
  if (category) query.actionCategory = category;

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .populate('performedBy', 'name email role');
};

// Static method to get logs by target
auditLogSchema.statics.getLogsByTarget = function(targetModel, targetId) {
  return this.find({ targetModel, targetId })
    .sort({ createdAt: -1 })
    .populate('performedBy', 'name email role');
};

// Static method to get recent critical actions
auditLogSchema.statics.getCriticalActions = function(days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return this.find({
    severity: { $in: ['high', 'critical'] },
    createdAt: { $gte: cutoffDate }
  })
    .sort({ createdAt: -1 })
    .populate('performedBy', 'name email role');
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
