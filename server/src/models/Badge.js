import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Badge name is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Badge name must be at least 3 characters'],
    maxlength: [50, 'Badge name must not exceed 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Badge description is required'],
    trim: true,
    maxlength: [500, 'Description must not exceed 500 characters']
  },
  icon: {
    type: String,
    default: '🏅' // Default emoji icon
  },
  iconUrl: {
    type: String, // URL to custom icon image
    default: null
  },
  color: {
    type: String,
    default: '#3B82F6', // Blue color
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color code']
  },
  category: {
    type: String,
    enum: ['achievement', 'special', 'community', 'recognition', 'custom'],
    default: 'custom'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  criteria: {
    type: String, // Description of how to earn this badge
    trim: true,
    maxlength: [300, 'Criteria must not exceed 300 characters']
  },
  autoAssign: {
    type: Boolean,
    default: false // If true, badge is auto-assigned based on criteria
  },
  priority: {
    type: Number,
    default: 0, // Higher priority badges displayed first
    min: 0,
    max: 100
  },
  assignmentCount: {
    type: Number,
    default: 0 // Track how many users have this badge
  },
  metadata: {
    // Additional flexible data
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
badgeSchema.index({ name: 1 });
badgeSchema.index({ category: 1 });
badgeSchema.index({ isActive: 1 });
badgeSchema.index({ createdBy: 1 });

// Virtual for display name
badgeSchema.virtual('displayName').get(function() {
  return `${this.icon} ${this.name}`;
});

// Method to increment assignment count
badgeSchema.methods.incrementAssignment = async function() {
  this.assignmentCount += 1;
  return await this.save();
};

// Method to decrement assignment count
badgeSchema.methods.decrementAssignment = async function() {
  if (this.assignmentCount > 0) {
    this.assignmentCount -= 1;
  }
  return await this.save();
};

// Static method to get active badges
badgeSchema.statics.getActiveBadges = function() {
  return this.find({ isActive: true }).sort({ priority: -1, createdAt: -1 });
};

// Static method to get badges by category
badgeSchema.statics.getBadgesByCategory = function(category) {
  return this.find({ category, isActive: true }).sort({ priority: -1 });
};

const Badge = mongoose.model('Badge', badgeSchema);

export default Badge;
