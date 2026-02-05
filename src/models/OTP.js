const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  // User (optional - may be for unregistered phone verification)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  // Phone number (for phone verification)
  phone: {
    type: String,
  },

  // Email (for email verification)
  email: {
    type: String,
  },

  // Task (for task completion OTP)
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  },

  // The OTP code
  otp: {
    type: String,
    required: true,
  },

  // OTP type
  type: {
    type: String,
    enum: ['phone_verification', 'email_verification', 'task_completion', 'password_reset'],
    required: true,
  },

  // Verification status
  verified: {
    type: Boolean,
    default: false,
  },
  verifiedAt: {
    type: Date,
  },

  // Attempts tracking (for security)
  attempts: {
    type: Number,
    default: 0,
  },
  maxAttempts: {
    type: Number,
    default: 5,
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

// TTL index for auto-deletion of expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for efficient lookups
otpSchema.index({ phone: 1, type: 1, verified: 1 });
otpSchema.index({ email: 1, type: 1, verified: 1 });
otpSchema.index({ task: 1, type: 1, verified: 1 });
otpSchema.index({ user: 1, type: 1, verified: 1 });

// Static method to generate OTP
otpSchema.statics.generateOTP = function (length = 6) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
};

// Static method to create and save OTP
otpSchema.statics.createOTP = async function (data) {
  const { user, phone, email, task, type, expiryMinutes = 10 } = data;

  // Invalidate any existing OTPs of the same type
  await this.updateMany(
    {
      $or: [
        { phone, type },
        { email, type },
        { task, type },
        { user, type },
      ],
      verified: false,
    },
    { $set: { expiresAt: new Date() } } // Expire immediately
  );

  // Create new OTP
  const otp = this.generateOTP();
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  const otpDoc = new this({
    user,
    phone,
    email,
    task,
    otp,
    type,
    expiresAt,
  });

  await otpDoc.save();
  return { otp, expiresAt };
};

// Method to verify OTP
otpSchema.methods.verify = function (inputOTP) {
  // Check if already verified
  if (this.verified) {
    return { valid: false, error: 'OTP already used' };
  }

  // Check if expired
  if (new Date() > this.expiresAt) {
    return { valid: false, error: 'OTP expired' };
  }

  // Check max attempts
  if (this.attempts >= this.maxAttempts) {
    return { valid: false, error: 'Maximum attempts exceeded' };
  }

  // Increment attempts
  this.attempts += 1;

  // Verify OTP
  if (this.otp !== inputOTP) {
    return { valid: false, error: 'Invalid OTP', attemptsRemaining: this.maxAttempts - this.attempts };
  }

  // Mark as verified
  this.verified = true;
  this.verifiedAt = new Date();

  return { valid: true };
};

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
