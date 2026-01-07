import mongoose from 'mongoose';

const systemConfigSchema = new mongoose.Schema({
  // Singleton pattern - only one config document should exist
  configName: {
    type: String,
    default: 'system_config',
    unique: true,
    immutable: true
  },

  // Donation Settings
  donationSettings: {
    cooldownDays: {
      type: Number,
      default: 90,
      min: 30,
      max: 365,
      required: true
    },
    minAge: {
      type: Number,
      default: 18,
      min: 16,
      max: 25,
      required: true
    },
    maxAge: {
      type: Number,
      default: 65,
      min: 50,
      max: 80,
      required: true
    }
  },

  // Matching & Search Settings
  matchingSettings: {
    defaultSearchRadiusKm: {
      type: Number,
      default: 50,
      min: 10,
      max: 500,
      required: true
    },
    maxSearchRadiusKm: {
      type: Number,
      default: 200,
      min: 50,
      max: 1000,
      required: true
    },
    expandedRadiusKm: {
      type: Number,
      default: 100,
      min: 50,
      max: 500,
      required: true
    }
  },

  // Fallback System Settings
  fallbackSettings: {
    unmatchedThresholdHours: {
      type: Number,
      default: 6,
      min: 1,
      max: 72,
      required: true
    },
    autoRunEnabled: {
      type: Boolean,
      default: false
    },
    autoRunIntervalHours: {
      type: Number,
      default: 12,
      min: 1,
      max: 48
    },
    notifyAdminsForCritical: {
      type: Boolean,
      default: true
    }
  },

  // Leaderboard & Points Settings
  pointsSettings: {
    perDonation: {
      type: Number,
      default: 100,
      min: 10,
      max: 1000,
      required: true
    },
    urgentBonus: {
      type: Number,
      default: 50,
      min: 0,
      max: 500,
      required: true
    },
    criticalBonus: {
      type: Number,
      default: 100,
      min: 0,
      max: 500,
      required: true
    },
    reviewBonus: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
      required: true
    },
    firstDonationBonus: {
      type: Number,
      default: 50,
      min: 0,
      max: 200
    }
  },

  // Request Settings
  requestSettings: {
    expirationDays: {
      type: Number,
      default: 30,
      min: 7,
      max: 90,
      required: true
    },
    maxActiveRequestsPerUser: {
      type: Number,
      default: 3,
      min: 1,
      max: 10
    },
    autoMatchEnabled: {
      type: Boolean,
      default: true
    }
  },

  // Security & Rate Limiting
  securitySettings: {
    maxLoginAttempts: {
      type: Number,
      default: 5,
      min: 3,
      max: 10
    },
    lockoutDurationMinutes: {
      type: Number,
      default: 30,
      min: 10,
      max: 1440
    },
    sessionTimeoutHours: {
      type: Number,
      default: 24,
      min: 1,
      max: 168
    }
  },

  // Notification Settings
  notificationSettings: {
    sendEmailNotifications: {
      type: Boolean,
      default: true
    },
    sendSmsNotifications: {
      type: Boolean,
      default: true
    },
    sendPushNotifications: {
      type: Boolean,
      default: true
    },
    criticalRequestImmediateNotify: {
      type: Boolean,
      default: true
    }
  },

  // Maintenance Settings
  maintenanceMode: {
    enabled: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      default: 'System is under maintenance. Please check back later.'
    },
    allowAdminAccess: {
      type: Boolean,
      default: true
    }
  },

  // Last Updated Tracking
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Change History (last 10 changes)
  changeHistory: [{
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    changes: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    },
    reason: String
  }]
}, {
  timestamps: true
});

// Limit change history to last 10 entries
systemConfigSchema.pre('save', function(next) {
  if (this.changeHistory && this.changeHistory.length > 10) {
    this.changeHistory = this.changeHistory.slice(-10);
  }
  next();
});

// Static method to get or create system config
systemConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne({ configName: 'system_config' });

  if (!config) {
    // Create default config if it doesn't exist
    config = await this.create({ configName: 'system_config' });
  }

  return config;
};

// Static method to update config
systemConfigSchema.statics.updateConfig = async function(updates, updatedBy, reason) {
  const config = await this.getConfig();

  // Track changes
  const changeEntry = {
    updatedBy,
    updatedAt: new Date(),
    changes: new Map(),
    reason: reason || 'Configuration updated'
  };

  // Update settings and track changes
  Object.keys(updates).forEach(key => {
    if (config[key] !== undefined) {
      changeEntry.changes.set(key, {
        old: config[key],
        new: updates[key]
      });
      config[key] = updates[key];
    }
  });

  // Add to history
  if (!config.changeHistory) {
    config.changeHistory = [];
  }
  config.changeHistory.push(changeEntry);

  config.lastUpdatedBy = updatedBy;

  await config.save();

  return config;
};

// Virtual to check if maintenance mode is active
systemConfigSchema.virtual('isInMaintenance').get(function() {
  return this.maintenanceMode?.enabled === true;
});

const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);

export default SystemConfig;
