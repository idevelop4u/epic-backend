const mongoose = require('mongoose');

const helpRequestSchema = new mongoose.Schema({
  // The task being applied to
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
  },

  // The helper applying
  helper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Application Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'withdrawn'],
    default: 'pending',
  },

  // Optional message from helper
  message: {
    type: String,
    maxlength: 500,
  },

  // Helper's location when applying
  helperLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
    },
  },

  // Calculated fields
  distanceToTask: {
    type: Number, // in meters
  },
  estimatedArrival: {
    type: Number, // in minutes
  },

  // Timestamps
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  respondedAt: {
    type: Date,
  },
});

// Create 2dsphere index for location queries
helpRequestSchema.index({ 'helperLocation': '2dsphere' });

// Compound index for efficient queries
helpRequestSchema.index({ task: 1, helper: 1 }, { unique: true }); // One application per helper per task
helpRequestSchema.index({ task: 1, status: 1 });
helpRequestSchema.index({ helper: 1, status: 1 });

// Update respondedAt when status changes
helpRequestSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status !== 'pending') {
    this.respondedAt = new Date();
  }
  next();
});

const HelpRequest = mongoose.model('HelpRequest', helpRequestSchema);

module.exports = HelpRequest;
