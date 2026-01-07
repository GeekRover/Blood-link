import mongoose from 'mongoose';

const userBadgeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  badge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  reason: {
    type: String,
    trim: true,
    maxlength: [500, 'Reason must not exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  revokedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  revokedAt: {
    type: Date
  },
  revocationReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Revocation reason must not exceed 500 characters']
  },
  displayOnProfile: {
    type: Boolean,
    default: true // User can choose to hide certain badges
  },
  displayOrder: {
    type: Number,
    default: 0 // Order in which badges are displayed on profile
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate badge assignments
userBadgeSchema.index({ user: 1, badge: 1, isActive: 1 });
userBadgeSchema.index({ user: 1, isActive: 1 });
userBadgeSchema.index({ badge: 1, isActive: 1 });
userBadgeSchema.index({ assignedBy: 1 });
userBadgeSchema.index({ assignedAt: -1 });

// Method to revoke badge
userBadgeSchema.methods.revoke = function(revokedById, reason) {
  this.isActive = false;
  this.revokedBy = revokedById;
  this.revokedAt = new Date();
  this.revocationReason = reason;
  return this.save();
};

// Static method to get user's active badges
userBadgeSchema.statics.getUserBadges = function(userId) {
  return this.find({ user: userId, isActive: true })
    .populate('badge')
    .sort({ displayOrder: -1, assignedAt: -1 });
};

// Static method to get badge assignment history for a user
userBadgeSchema.statics.getUserBadgeHistory = function(userId) {
  return this.find({ user: userId })
    .populate('badge')
    .populate('assignedBy', 'name email')
    .populate('revokedBy', 'name email')
    .sort({ assignedAt: -1 });
};

// Static method to check if user has a specific badge
userBadgeSchema.statics.userHasBadge = async function(userId, badgeId) {
  const assignment = await this.findOne({
    user: userId,
    badge: badgeId,
    isActive: true
  });
  return !!assignment;
};

// Static method to get all users with a specific badge
userBadgeSchema.statics.getUsersWithBadge = function(badgeId) {
  return this.find({ badge: badgeId, isActive: true })
    .populate('user', 'name email profilePicture')
    .sort({ assignedAt: -1 });
};

const UserBadge = mongoose.model('UserBadge', userBadgeSchema);

export default UserBadge;
