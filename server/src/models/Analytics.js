import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  metrics: {
    totalUsers: { type: Number, default: 0 },
    newUsers: { type: Number, default: 0 },
    activeDonors: { type: Number, default: 0 },
    activeRecipients: { type: Number, default: 0 },
    verifiedUsers: { type: Number, default: 0 },
    pendingVerification: { type: Number, default: 0 }
  },
  requests: {
    total: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    matched: { type: Number, default: 0 },
    fulfilled: { type: Number, default: 0 },
    cancelled: { type: Number, default: 0 },
    expired: { type: Number, default: 0 },
    criticalRequests: { type: Number, default: 0 },
    avgResponseTime: { type: Number, default: 0 } // in hours
  },
  donations: {
    total: { type: Number, default: 0 },
    unitsCollected: { type: Number, default: 0 },
    verified: { type: Number, default: 0 },
    pending: { type: Number, default: 0 }
  },
  bloodTypes: {
    'A+': { requests: { type: Number, default: 0 }, donations: { type: Number, default: 0 } },
    'A-': { requests: { type: Number, default: 0 }, donations: { type: Number, default: 0 } },
    'B+': { requests: { type: Number, default: 0 }, donations: { type: Number, default: 0 } },
    'B-': { requests: { type: Number, default: 0 }, donations: { type: Number, default: 0 } },
    'AB+': { requests: { type: Number, default: 0 }, donations: { type: Number, default: 0 } },
    'AB-': { requests: { type: Number, default: 0 }, donations: { type: Number, default: 0 } },
    'O+': { requests: { type: Number, default: 0 }, donations: { type: Number, default: 0 } },
    'O-': { requests: { type: Number, default: 0 }, donations: { type: Number, default: 0 } }
  },
  engagement: {
    chatSessions: { type: Number, default: 0 },
    messages: { type: Number, default: 0 },
    notifications: { type: Number, default: 0 },
    blogViews: { type: Number, default: 0 },
    eventRegistrations: { type: Number, default: 0 }
  },
  geography: {
    topCities: [{
      city: String,
      count: Number
    }],
    topStates: [{
      state: String,
      count: Number
    }]
  },
  performance: {
    avgMatchTime: { type: Number, default: 0 }, // minutes
    fulfillmentRate: { type: Number, default: 0 }, // percentage
    donorRetentionRate: { type: Number, default: 0 }, // percentage
    avgDonationsPerDonor: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Indexes
analyticsSchema.index({ date: -1 });

// Static method to get analytics for date range
analyticsSchema.statics.getDateRange = async function(startDate, endDate) {
  return await this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: 1 });
};

// Static method to aggregate metrics
analyticsSchema.statics.aggregateMetrics = async function(startDate, endDate) {
  const analytics = await this.getDateRange(startDate, endDate);

  const totals = {
    totalUsers: 0,
    newUsers: 0,
    totalRequests: 0,
    fulfilledRequests: 0,
    totalDonations: 0,
    unitsCollected: 0
  };

  analytics.forEach(day => {
    totals.totalUsers = Math.max(totals.totalUsers, day.metrics.totalUsers);
    totals.newUsers += day.metrics.newUsers;
    totals.totalRequests += day.requests.total;
    totals.fulfilledRequests += day.requests.fulfilled;
    totals.totalDonations += day.donations.total;
    totals.unitsCollected += day.donations.unitsCollected;
  });

  return totals;
};

const Analytics = mongoose.model('Analytics', analyticsSchema);

export default Analytics;
