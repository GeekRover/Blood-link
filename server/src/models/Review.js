import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  donationHistory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DonationHistory'
  },
  bloodRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodRequest'
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5
  },
  reviewType: {
    type: String,
    enum: ['donor_to_recipient', 'recipient_to_donor'],
    required: true
  },
  title: {
    type: String,
    trim: true
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    maxlength: 1000
  },
  aspects: {
    communication: { type: Number, min: 1, max: 5 },
    responsiveness: { type: Number, min: 1, max: 5 },
    professionalism: { type: Number, min: 1, max: 5 },
    overall: { type: Number, min: 1, max: 5 }
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: Date,
  moderationReason: String,
  helpfulCount: {
    type: Number,
    default: 0
  },
  reportCount: {
    type: Number,
    default: 0
  },
  response: {
    content: String,
    respondedAt: Date
  }
}, {
  timestamps: true
});

// Indexes
reviewSchema.index({ reviewee: 1, status: 1 });
reviewSchema.index({ reviewer: 1 });
reviewSchema.index({ donationHistory: 1 });
reviewSchema.index({ bloodRequest: 1 });
reviewSchema.index({ rating: 1 });

// Ensure one review per donation
reviewSchema.index(
  { reviewer: 1, reviewee: 1, donationHistory: 1 },
  { unique: true, sparse: true }
);

// Static method to calculate average rating
reviewSchema.statics.getAverageRating = async function(userId) {
  const result = await this.aggregate([
    {
      $match: {
        reviewee: mongoose.Types.ObjectId(userId),
        status: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  return result.length > 0
    ? { average: result[0].avgRating.toFixed(1), total: result[0].totalReviews }
    : { average: 0, total: 0 };
};

// Method to mark as helpful
reviewSchema.methods.markHelpful = function() {
  this.helpfulCount += 1;
  return this.save();
};

// Method to report
reviewSchema.methods.report = function() {
  this.reportCount += 1;

  // Auto-hide if too many reports
  if (this.reportCount >= 5) {
    this.status = 'pending';
  }

  return this.save();
};

const Review = mongoose.model('Review', reviewSchema);

export default Review;
