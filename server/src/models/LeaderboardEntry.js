import mongoose from 'mongoose';

const leaderboardEntrySchema = new mongoose.Schema({
  leaderboard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Leaderboard',
    required: true
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rank: {
    type: Number,
    required: true
  },
  points: {
    type: Number,
    default: 0,
    required: true
  },
  totalDonations: {
    type: Number,
    default: 0
  },
  pointsBreakdown: {
    donationPoints: { type: Number, default: 0 },
    bonusPoints: { type: Number, default: 0 },
    milestonePoints: { type: Number, default: 0 },
    reviewPoints: { type: Number, default: 0 }
  },
  badge: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'None'],
    default: 'None'
  },
  previousRank: Number,
  rankChange: {
    type: String,
    enum: ['up', 'down', 'same', 'new'],
    default: 'new'
  }
}, {
  timestamps: true
});

// Indexes
leaderboardEntrySchema.index({ leaderboard: 1, rank: 1 });
leaderboardEntrySchema.index({ donor: 1, leaderboard: 1 }, { unique: true });
leaderboardEntrySchema.index({ points: -1 });

// Virtual for rank trend
leaderboardEntrySchema.virtual('rankTrend').get(function() {
  if (!this.previousRank || this.rankChange === 'new') return null;

  const change = this.previousRank - this.rank;
  return {
    direction: this.rankChange,
    amount: Math.abs(change)
  };
});

// Static method to update rankings
leaderboardEntrySchema.statics.updateRankings = async function(leaderboardId) {
  const entries = await this.find({ leaderboard: leaderboardId })
    .sort({ points: -1, totalDonations: -1 });

  const bulkOps = entries.map((entry, index) => {
    const newRank = index + 1;
    const rankChange = entry.rank
      ? (newRank < entry.rank ? 'up' : newRank > entry.rank ? 'down' : 'same')
      : 'new';

    return {
      updateOne: {
        filter: { _id: entry._id },
        update: {
          previousRank: entry.rank,
          rank: newRank,
          rankChange
        }
      }
    };
  });

  if (bulkOps.length > 0) {
    await this.bulkWrite(bulkOps);
  }
};

const LeaderboardEntry = mongoose.model('LeaderboardEntry', leaderboardEntrySchema);

export default LeaderboardEntry;
