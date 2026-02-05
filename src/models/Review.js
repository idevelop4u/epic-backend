const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // The task this review is for
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
  },

  // Who is writing the review
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Who is being reviewed
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Reviewer's role in the task
  reviewerRole: {
    type: String,
    enum: ['requester', 'helper'],
    required: true,
  },

  // Rating (1-5 stars)
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },

  // Written review (optional)
  comment: {
    type: String,
    maxlength: 500,
  },

  // Badges awarded to reviewee (e.g., "Reliable Helper", "Friendly")
  badges: [{
    type: String,
    enum: [
      'reliable_helper',
      'friendly',
      'always_on_time',
      'excellent_communication',
      'went_above_and_beyond',
      'patient',
      'professional',
    ],
  }],

  // Timestamp
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to ensure one review per reviewer per task
reviewSchema.index({ task: 1, reviewer: 1 }, { unique: true });

// Index for querying reviews by reviewee
reviewSchema.index({ reviewee: 1, createdAt: -1 });

// Index for aggregating ratings
reviewSchema.index({ reviewee: 1, rating: 1 });

// Static method to calculate average rating for a user
reviewSchema.statics.calculateAverageRating = async function (userId) {
  const result = await this.aggregate([
    { $match: { reviewee: userId } },
    {
      $group: {
        _id: '$reviewee',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    return {
      averageRating: Math.round(result[0].averageRating * 10) / 10,
      totalReviews: result[0].totalReviews,
    };
  }

  return { averageRating: 0, totalReviews: 0 };
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
