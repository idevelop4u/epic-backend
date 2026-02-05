const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // User to notify
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Notification type
  type: {
    type: String,
    enum: [
      'help_request',        // Someone wants to help with your task
      'helper_approved',     // You've been approved to help
      'helper_rejected',     // Your help request was rejected
      'helper_nearby',       // A helper is near your task location
      'task_update',         // Task status changed
      'task_cancelled',      // Task was cancelled
      'chat_message',        // New chat message
      'certificate_unlocked', // New certificate unlocked
      'achievement_unlocked', // New achievement unlocked
      'urgent_nearby',       // Urgent help needed in your area
      'level_up',            // User leveled up
      'reminder',            // Task reminder
      'system',              // System notification
    ],
    required: true,
  },

  // Notification content
  title: {
    type: String,
    required: true,
    maxlength: 100,
  },
  body: {
    type: String,
    required: true,
    maxlength: 500,
  },

  // Reference data (for deep linking in the app)
  data: {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    helpRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HelpRequest',
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    achievementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Achievement',
    },
    certificateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Certificate',
    },
    // Any additional custom data
    extra: Object,
  },

  // Read status
  read: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },

  // Push notification sent status
  pushSent: {
    type: Boolean,
    default: false,
  },
  pushSentAt: {
    type: Date,
  },

  // Timestamp
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ user: 1, type: 1 });

// Update readAt when notification is marked as read
notificationSchema.pre('save', function (next) {
  if (this.isModified('read') && this.read === true && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

// Static method to mark all notifications as read for a user
notificationSchema.statics.markAllAsRead = async function (userId) {
  return this.updateMany(
    { user: userId, read: false },
    { $set: { read: true, readAt: new Date() } }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function (userId) {
  return this.countDocuments({ user: userId, read: false });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
