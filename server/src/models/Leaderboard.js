import mongoose from 'mongoose';

const leaderboardSchema = new mongoose.Schema({
  period: {
    type: String,
    enum: ['all-time', 'yearly', 'monthly', 'weekly'],
    required: true
  },
  year: Number,
  month: Number,
  week: Number,
  startDate: Date,
  endDate: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
leaderboardSchema.index({ period: 1, year: 1, month: 1, week: 1 }, { unique: true });
leaderboardSchema.index({ isActive: 1 });

// Static method to get or create current leaderboard
leaderboardSchema.statics.getCurrent = async function(period = 'all-time') {
  const now = new Date();
  const query = { period, isActive: true };

  if (period === 'yearly') {
    query.year = now.getFullYear();
  } else if (period === 'monthly') {
    query.year = now.getFullYear();
    query.month = now.getMonth() + 1;
  } else if (period === 'weekly') {
    const weekNumber = this.getWeekNumber(now);
    query.year = now.getFullYear();
    query.week = weekNumber;
  }

  let leaderboard = await this.findOne(query);

  if (!leaderboard) {
    leaderboard = await this.create(query);
  }

  return leaderboard;
};

// Helper to get week number
leaderboardSchema.statics.getWeekNumber = function(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

export default Leaderboard;
