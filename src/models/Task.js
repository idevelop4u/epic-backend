const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  // Requester (who needs help)
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Task Details
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  category: {
    type: String,
    enum: [
      'elderly_assistance',
      'disability_support',
      'errands',
      'home_help',
      'transport',
      'tech_help',
      'emergency',
      'other',
    ],
    required: true,
  },
  urgency: {
    type: String,
    enum: ['normal', 'urgent', 'sos'],
    default: 'normal',
  },

  // Location (GeoJSON for geospatial queries)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: String,
  },

  // Status Workflow
  status: {
    type: String,
    enum: [
      'open',              // Task is open for helpers to apply
      'pending_approval',  // Helpers have applied, waiting for requester to approve
      'in_progress',       // Helper approved and on the way
      'helper_arrived',    // Helper has arrived at location
      'task_started',      // Task execution started
      'pending_verification', // Task done, waiting for OTP verification
      'completed',         // Task verified and completed
      'cancelled',         // Task was cancelled
      'disputed',          // There's a dispute about the task
    ],
    default: 'open',
  },

  // Assigned Helpers
  assignedHelper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  additionalHelpers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  maxHelpers: {
    type: Number,
    default: 1,
    min: 1,
    max: 5,
  },

  // Scheduling
  scheduledFor: {
    type: Date,
  },
  startedAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },

  // Verification
  completionOTP: {
    type: String,
  },
  otpGeneratedAt: {
    type: Date,
  },
  proofImages: [{
    type: String, // URLs to uploaded images
  }],
  proofVideo: {
    type: String, // URL to uploaded video
  },

  // Privacy
  hideSensitiveDetails: {
    type: Boolean,
    default: false,
  },

  // Rewards
  estimatedDuration: {
    type: Number, // in minutes
  },
  pointsReward: {
    type: Number,
    default: 10,
  },

  // Cancellation & Disputes
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  cancellationReason: {
    type: String,
  },
  disputeReason: {
    type: String,
  },
  disputeResolvedAt: {
    type: Date,
  },

  // Application count (denormalized for performance)
  applicationCount: {
    type: Number,
    default: 0,
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create 2dsphere index for geolocation queries
taskSchema.index({ 'location': '2dsphere' });

// Index for efficient queries
taskSchema.index({ status: 1, createdAt: -1 });
taskSchema.index({ requester: 1, status: 1 });
taskSchema.index({ assignedHelper: 1, status: 1 });
taskSchema.index({ urgency: 1, status: 1 });

// Update timestamp on save
taskSchema.pre('save', async function () {
  this.updatedAt = new Date();
});

// Method to check if task can accept more helpers
taskSchema.methods.canAcceptMoreHelpers = function () {
  const currentHelpers = 1 + (this.additionalHelpers?.length || 0);
  return this.assignedHelper && currentHelpers < this.maxHelpers;
};

// Method to generate OTP
taskSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.completionOTP = otp;
  this.otpGeneratedAt = new Date();
  return otp;
};

// Method to verify OTP
taskSchema.methods.verifyOTP = function (inputOTP) {
  if (!this.completionOTP || !this.otpGeneratedAt) {
    return { valid: false, error: 'OTP not generated' };
  }

  // OTP expires after 30 minutes
  const expiryTime = 30 * 60 * 1000;
  if (Date.now() - this.otpGeneratedAt.getTime() > expiryTime) {
    return { valid: false, error: 'OTP expired' };
  }

  if (this.completionOTP !== inputOTP) {
    return { valid: false, error: 'Invalid OTP' };
  }

  return { valid: true };
};

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
