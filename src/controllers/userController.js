const User = require('../models/User');
const Review = require('../models/Review');
const Achievement = require('../models/Achievement');
const Task = require('../models/Task');

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -googleId -appleId')
      .populate('achievements');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile' });
  }
};

// Get another user's public profile
const getPublicProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user: user.toPublicProfile() });
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({ message: 'Failed to get profile' });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      'username',
      'bio',
      'primaryLanguage',
      'rolePreference',
      'notificationsEnabled',
      'visibilityRadius',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Check if username is being changed and if it's unique
    if (updates.username && updates.username !== req.user.username) {
      const existingUser = await User.findOne({ username: updates.username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -googleId -appleId');

    res.status(200).json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

// Upload profile photo
const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // File path will be set by multer
    const photoPath = `/uploads/profiles/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { profilePhoto: photoPath } },
      { new: true }
    ).select('-password');

    res.status(200).json({
      message: 'Profile photo uploaded successfully',
      profilePhoto: photoPath,
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ message: 'Failed to upload photo' });
  }
};

// Update user location (for helpers)
const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, address, city } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ message: 'Invalid coordinates' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          location: {
            type: 'Point',
            coordinates: [longitude, latitude], // GeoJSON format: [lng, lat]
            address,
            city,
          },
          locationUpdatedAt: new Date(),
        },
      },
      { new: true }
    ).select('location locationUpdatedAt');

    res.status(200).json({
      message: 'Location updated successfully',
      location: user.location,
      locationUpdatedAt: user.locationUpdatedAt,
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Failed to update location' });
  }
};

// Submit ID verification
const verifyIdentity = async (req, res) => {
  try {
    const { method, details } = req.body;

    const validMethods = ['aadhar', 'phone', 'college_id'];
    if (!method || !validMethods.includes(method)) {
      return res.status(400).json({
        message: 'Valid verification method is required',
        validMethods,
      });
    }

    // In production, you would:
    // 1. Validate the details (e.g., Aadhar last 4 digits, college ID)
    // 2. Possibly integrate with verification APIs
    // 3. Store proof documents

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          verificationMethod: method,
          verificationDetails: details,
          idVerified: true, // In production, this might be pending review
        },
      },
      { new: true }
    ).select('idVerified verificationMethod');

    res.status(200).json({
      message: 'Identity verification submitted successfully',
      idVerified: user.idVerified,
      verificationMethod: user.verificationMethod,
    });
  } catch (error) {
    console.error('Verify identity error:', error);
    res.status(500).json({ message: 'Failed to submit verification' });
  }
};

// Get trusted contacts
const getTrustedContacts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('trustedContacts');

    res.status(200).json({
      trustedContacts: user.trustedContacts || [],
    });
  } catch (error) {
    console.error('Get trusted contacts error:', error);
    res.status(500).json({ message: 'Failed to get trusted contacts' });
  }
};

// Update trusted contacts
const updateTrustedContacts = async (req, res) => {
  try {
    const { contacts } = req.body;

    if (!Array.isArray(contacts)) {
      return res.status(400).json({ message: 'Contacts must be an array' });
    }

    // Validate contacts (max 5)
    if (contacts.length > 5) {
      return res.status(400).json({ message: 'Maximum 5 trusted contacts allowed' });
    }

    // Validate each contact
    for (const contact of contacts) {
      if (!contact.name || !contact.phone) {
        return res.status(400).json({ message: 'Each contact must have name and phone' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { trustedContacts: contacts } },
      { new: true }
    ).select('trustedContacts');

    res.status(200).json({
      message: 'Trusted contacts updated successfully',
      trustedContacts: user.trustedContacts,
    });
  } catch (error) {
    console.error('Update trusted contacts error:', error);
    res.status(500).json({ message: 'Failed to update trusted contacts' });
  }
};

// Get user statistics
const getStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('points level tasksHelped tasksRequested averageRating totalReviews certificateLevel badges');

    // Get recent reviews
    const recentReviews = await Review.find({ reviewee: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('reviewer', 'username profilePhoto')
      .populate('task', 'title');

    res.status(200).json({
      stats: {
        points: user.points,
        level: user.level,
        tasksHelped: user.tasksHelped,
        tasksRequested: user.tasksRequested,
        averageRating: user.averageRating,
        totalReviews: user.totalReviews,
        certificateLevel: user.certificateLevel,
        badges: user.badges,
      },
      recentReviews,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to get statistics' });
  }
};

// Update FCM token for push notifications
const updateFCMToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ message: 'FCM token is required' });
    }

    await User.findByIdAndUpdate(req.user._id, { $set: { fcmToken } });

    res.status(200).json({ message: 'FCM token updated successfully' });
  } catch (error) {
    console.error('Update FCM token error:', error);
    res.status(500).json({ message: 'Failed to update FCM token' });
  }
};

// Convert guest to full user
const convertGuestToUser = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!req.user.isGuest) {
      return res.status(400).json({ message: 'User is not a guest account' });
    }

    if (!email || !password || !username) {
      return res.status(400).json({ message: 'Email, password, and username are required' });
    }

    // Check if email or username already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
      _id: { $ne: req.user._id },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email or username already taken' });
    }

    const user = await User.findById(req.user._id);
    user.email = email;
    user.password = password;
    user.username = username;
    user.isGuest = false;
    user.rolePreference = 'both'; // Unlock full functionality
    await user.save();

    res.status(200).json({
      message: 'Account converted successfully',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        isGuest: false,
        rolePreference: user.rolePreference,
      },
    });
  } catch (error) {
    console.error('Convert guest error:', error);
    res.status(500).json({ message: 'Failed to convert account' });
  }
};

module.exports = {
  getProfile,
  getPublicProfile,
  updateProfile,
  uploadProfilePhoto,
  updateLocation,
  verifyIdentity,
  getTrustedContacts,
  updateTrustedContacts,
  getStats,
  updateFCMToken,
  convertGuestToUser,
};
