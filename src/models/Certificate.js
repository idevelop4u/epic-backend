const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  // User who earned the certificate
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Certificate level
  level: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    required: true,
  },

  // Points when unlocked
  pointsAtUnlock: {
    type: Number,
    required: true,
  },

  // Tasks completed at time of unlock
  tasksCompletedAtUnlock: {
    type: Number,
    default: 0,
  },

  // Certificate details
  certificateNumber: {
    type: String,
    unique: true,
    required: true,
  },

  // Generated PDF URL
  certificateUrl: {
    type: String,
  },

  // Share status
  sharedOnSocialMedia: {
    type: Boolean,
    default: false,
  },

  // Timestamp
  unlockedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
certificateSchema.index({ user: 1, level: 1 }, { unique: true }); // One certificate per level per user
certificateSchema.index({ user: 1, unlockedAt: -1 });

// Generate certificate number before saving
certificateSchema.pre('save', function (next) {
  if (!this.certificateNumber) {
    const levelPrefix = {
      bronze: 'BRZ',
      silver: 'SLV',
      gold: 'GLD',
      platinum: 'PLT',
    };
    const prefix = levelPrefix[this.level] || 'CRT';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.certificateNumber = `EPICS-${prefix}-${timestamp}-${random}`;
  }
  next();
});

// Static method to get thresholds
certificateSchema.statics.getThreshold = function (level) {
  const thresholds = {
    bronze: 50,
    silver: 120,
    gold: 250,
    platinum: 500,
  };
  return thresholds[level] || 0;
};

// Static method to check if user has earned a specific certificate
certificateSchema.statics.hasCertificate = async function (userId, level) {
  const certificate = await this.findOne({ user: userId, level });
  return !!certificate;
};

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate;
