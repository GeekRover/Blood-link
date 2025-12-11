import mongoose from 'mongoose';
import User from './User.js';

const administratorSchema = new mongoose.Schema({
  department: {
    type: String,
    enum: ['Operations', 'Verification', 'Support', 'Analytics', 'Content'],
    required: true
  },
  permissions: [{
    type: String,
    enum: [
      'verify_users',
      'manage_requests',
      'view_analytics',
      'manage_content',
      'manage_events',
      'manage_blogs',
      'handle_reports',
      'system_config',
      'user_management'
    ]
  }],
  employeeId: {
    type: String,
    unique: true,
    required: true
  },
  activityLog: [{
    action: String,
    targetType: String,
    targetId: mongoose.Schema.Types.ObjectId,
    details: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Method to check permission
administratorSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

// Method to log activity
administratorSchema.methods.logActivity = function(action, targetType, targetId, details) {
  this.activityLog.push({
    action,
    targetType,
    targetId,
    details,
    timestamp: new Date()
  });
  return this.save();
};

// Create Administrator model as discriminator of User
const Administrator = User.discriminator('admin', administratorSchema);

export default Administrator;
