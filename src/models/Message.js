const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Task this message belongs to (chat is task-scoped)
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
  },

  // Sender
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Receiver
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Message content
  content: {
    type: String,
    required: true,
    maxlength: 1000,
  },

  // Message type
  messageType: {
    type: String,
    enum: ['text', 'location', 'image'],
    default: 'text',
  },

  // For location messages
  locationData: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: [Number],
    address: String,
  },

  // For image messages
  imageUrl: {
    type: String,
  },

  // Read status
  read: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },

  // TTL for auto-deletion after task completion (privacy feature)
  expiresAt: {
    type: Date,
  },
});

// Index for efficient message queries
messageSchema.index({ task: 1, createdAt: 1 });
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, read: 1 });

// TTL index for auto-deletion
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Update readAt when message is marked as read
messageSchema.pre('save', function (next) {
  if (this.isModified('read') && this.read === true && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

// Static method to mark all messages as read for a conversation
messageSchema.statics.markAllAsRead = async function (taskId, receiverId) {
  return this.updateMany(
    { task: taskId, receiver: receiverId, read: false },
    { $set: { read: true, readAt: new Date() } }
  );
};

// Static method to set expiry for all messages in a task
messageSchema.statics.setExpiryForTask = async function (taskId, hoursUntilExpiry = 24) {
  const expiresAt = new Date(Date.now() + hoursUntilExpiry * 60 * 60 * 1000);
  return this.updateMany(
    { task: taskId },
    { $set: { expiresAt } }
  );
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
