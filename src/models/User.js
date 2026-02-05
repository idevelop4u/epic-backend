const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Info (existing)
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: function() {
      // Password not required for OAuth users or guests
      return !this.isGuest && !this.googleId && !this.appleId;
    },
  },

  // Profile Information
  phone: {
    type: String,
    trim: true,
  },
  phoneVerified: {
    type: Boolean,
    default: false,
  },
  profilePhoto: {
    type: String, // URL or file path
  },
  bio: {
    type: String,
    maxlength: 500,
  },
  primaryLanguage: {
    type: String,
    default: 'en',
  },

  // Role & Preferences
  rolePreference: {
    type: String,
    enum: ['helper', 'requester', 'both'],
    default: 'both',
  },
  isGuest: {
    type: Boolean,
    default: false,
  },

  // Location (for helpers - using GeoJSON)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0],
    },
    address: String,
    city: String,
  },
  locationUpdatedAt: {
    type: Date,
  },

  // Identity Verification
  idVerified: {
    type: Boolean,
    default: false,
  },
  verificationMethod: {
    type: String,
    enum: ['aadhar', 'phone', 'college_id', 'none'],
    default: 'none',
  },
  verificationDetails: {
    type: Object, // Store last 4 digits, etc.
  },

  // Gamification
  points: {
    type: Number,
    default: 0,
  },
  level: {
    type: Number,
    default: 1,
  },
  badges: [{
    type: String, // e.g., "Reliable Helper", "Friendly", "Always On Time"
  }],
  achievements: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement',
  }],
  certificateLevel: {
    type: String,
    enum: ['none', 'bronze', 'silver', 'gold', 'platinum'],
    default: 'none',
  },

  // Statistics
  tasksHelped: {
    type: Number,
    default: 0,
  },
  tasksRequested: {
    type: Number,
    default: 0,
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },

  // Privacy & Settings
  trustedContacts: [{
    name: String,
    phone: String,
  }],
  notificationsEnabled: {
    type: Boolean,
    default: true,
  },
  visibilityRadius: {
    type: Number, // in kilometers
    default: 10,
  },

  // OAuth
  googleId: {
    type: String,
    sparse: true,
  },
  appleId: {
    type: String,
    sparse: true,
  },

  // FCM Push Token
  fcmToken: {
    type: String,
  },

  // Referral
  referralCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  // Timestamps
  lastActiveAt: {
    type: Date,
    default: Date.now,
  },
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
userSchema.index({ 'location': '2dsphere' });

// Hash password before saving
userSchema.pre('save', function (next) {
  // Update the updatedAt timestamp
  this.updatedAt = new Date();
  
  if (!this.isModified('password') || !this.password) return next();

  const salt = bcrypt.genSaltSync(10);
  this.password = bcrypt.hashSync(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compareSync(candidatePassword, this.password);
};

// Method to get public profile (without sensitive data)
userSchema.methods.toPublicProfile = function () {
  return {
    id: this._id,
    username: this.username,
    profilePhoto: this.profilePhoto,
    bio: this.bio,
    points: this.points,
    level: this.level,
    badges: this.badges,
    certificateLevel: this.certificateLevel,
    tasksHelped: this.tasksHelped,
    averageRating: this.averageRating,
    totalReviews: this.totalReviews,
    idVerified: this.idVerified,
    createdAt: this.createdAt,
  };
};

// Method to calculate certificate level based on points
userSchema.methods.calculateCertificateLevel = function () {
  if (this.points >= 500) return 'platinum';
  if (this.points >= 250) return 'gold';
  if (this.points >= 120) return 'silver';
  if (this.points >= 50) return 'bronze';
  return 'none';
};

// Method to update certificate level
userSchema.methods.updateCertificateLevel = function () {
  const newLevel = this.calculateCertificateLevel();
  if (newLevel !== this.certificateLevel) {
    this.certificateLevel = newLevel;
    return true; // Level changed
  }
  return false; // No change
};

const User = mongoose.model('User', userSchema);

module.exports = User;