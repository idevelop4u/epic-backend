const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const OTP = require('../models/OTP');

// Generate JWT token
const generateToken = (userId, expiresIn = '1d') => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn }
  );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || 'refresh_fallback_secret',
    { expiresIn: '7d' }
  );
};

// Signup with email/password
const signup = async (req, res) => {
  try {
    const { email, password, username, phone } = req.body;

    // Validate input
    if (!email || !password || !username) {
      return res.status(400).json({ message: 'Email, password, and username are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    // Create new user
    const newUser = new User({
      email,
      username,
      password,
      phone,
      referralCode: uuidv4().substring(0, 8).toUpperCase(),
    });
    await newUser.save();

    // Generate tokens
    const token = generateToken(newUser._id);
    const refreshToken = generateRefreshToken(newUser._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      refreshToken,
      user: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        phone: newUser.phone,
        rolePreference: newUser.rolePreference,
        points: newUser.points,
        level: newUser.level,
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
};

// Login with email/password
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.isGuest) {
      return res.status(400).json({ message: 'Guest accounts cannot login with password' });
    }

    const isMatch = user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last active
    user.lastActiveAt = new Date();
    await user.save();

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(200).json({
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        profilePhoto: user.profilePhoto,
        rolePreference: user.rolePreference,
        points: user.points,
        level: user.level,
        certificateLevel: user.certificateLevel,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Send OTP for phone verification
const sendPhoneOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    const userId = req.user?._id;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    // Create OTP
    const { otp, expiresAt } = await OTP.createOTP({
      user: userId,
      phone,
      type: 'phone_verification',
      expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES) || 10,
    });

    // In production, send OTP via SMS service
    // For development, return OTP in response
    const isDevelopment = process.env.NODE_ENV !== 'production';

    res.status(200).json({
      message: 'OTP sent successfully',
      phone,
      expiresAt,
      ...(isDevelopment && { otp }), // Only include OTP in dev mode
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

// Verify phone OTP
const verifyPhoneOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const userId = req.user?._id;

    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and OTP are required' });
    }

    // Find the OTP document
    const otpDoc = await OTP.findOne({
      phone,
      type: 'phone_verification',
      verified: false,
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return res.status(400).json({ message: 'No pending OTP found for this phone' });
    }

    // Verify OTP
    const result = otpDoc.verify(otp);
    await otpDoc.save();

    if (!result.valid) {
      return res.status(400).json({
        message: result.error,
        attemptsRemaining: result.attemptsRemaining,
      });
    }

    // Update user if authenticated
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        user.phone = phone;
        user.phoneVerified = true;
        if (user.verificationMethod === 'none') {
          user.verificationMethod = 'phone';
        }
        await user.save();
      }
    }

    res.status(200).json({
      message: 'Phone verified successfully',
      verified: true,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
};

// Guest login - create anonymous user
const guestLogin = async (req, res) => {
  try {
    // Generate guest username
    const guestId = uuidv4().substring(0, 8);
    const username = `guest_${guestId}`;
    const email = `guest_${guestId}@guest.local`;

    // Create guest user
    const guestUser = new User({
      email,
      username,
      isGuest: true,
      rolePreference: 'requester', // Guests can only view, not help
    });
    await guestUser.save();

    const token = generateToken(guestUser._id, '24h'); // Shorter expiry for guests

    res.status(201).json({
      message: 'Guest session created',
      token,
      user: {
        id: guestUser._id,
        username: guestUser.username,
        isGuest: true,
        rolePreference: guestUser.rolePreference,
      },
      notice: 'Guest accounts have limited features. Register to unlock full functionality.',
    });
  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({ message: 'Failed to create guest session' });
  }
};

// Refresh access token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || 'refresh_fallback_secret'
    );

    if (decoded.type !== 'refresh') {
      return res.status(400).json({ message: 'Invalid token type' });
    }

    // Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Generate new tokens
    const newAccessToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.status(200).json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Failed to refresh token' });
  }
};

// Google OAuth login/signup
const googleAuth = async (req, res) => {
  try {
    const { idToken, email, name, googleId, profilePhoto } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({ message: 'Google ID and email are required' });
    }

    // Find or create user
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
      }
      user.lastActiveAt = new Date();
      await user.save();
    } else {
      // Create new user
      const username = email.split('@')[0] + '_' + uuidv4().substring(0, 4);
      user = new User({
        email,
        username,
        googleId,
        profilePhoto,
        referralCode: uuidv4().substring(0, 8).toUpperCase(),
      });
      await user.save();
    }

    const token = generateToken(user._id);
    const refreshTokenValue = generateRefreshToken(user._id);

    res.status(200).json({
      message: user.createdAt === user.updatedAt ? 'Account created' : 'Login successful',
      token,
      refreshToken: refreshTokenValue,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        profilePhoto: user.profilePhoto,
        points: user.points,
        level: user.level,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Google authentication failed' });
  }
};

// Apple OAuth login/signup
const appleAuth = async (req, res) => {
  try {
    const { idToken, email, name, appleId } = req.body;

    if (!appleId) {
      return res.status(400).json({ message: 'Apple ID is required' });
    }

    // Find or create user
    let user = await User.findOne({ appleId });

    if (!user && email) {
      user = await User.findOne({ email });
    }

    if (user) {
      if (!user.appleId) {
        user.appleId = appleId;
      }
      user.lastActiveAt = new Date();
      await user.save();
    } else {
      // Create new user
      const username = (email ? email.split('@')[0] : 'apple_user') + '_' + uuidv4().substring(0, 4);
      user = new User({
        email: email || `apple_${appleId.substring(0, 8)}@apple.local`,
        username,
        appleId,
        referralCode: uuidv4().substring(0, 8).toUpperCase(),
      });
      await user.save();
    }

    const token = generateToken(user._id);
    const refreshTokenValue = generateRefreshToken(user._id);

    res.status(200).json({
      message: 'Apple authentication successful',
      token,
      refreshToken: refreshTokenValue,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        points: user.points,
        level: user.level,
      },
    });
  } catch (error) {
    console.error('Apple auth error:', error);
    res.status(500).json({ message: 'Apple authentication failed' });
  }
};

// Logout (for future token blacklisting)
const logout = async (req, res) => {
  try {
    // In a production app, you might want to:
    // 1. Add the token to a blacklist
    // 2. Clear refresh token from database
    // For now, just return success (client should clear tokens)

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
};

module.exports = {
  signup,
  login,
  sendPhoneOTP,
  verifyPhoneOTP,
  guestLogin,
  refreshToken,
  googleAuth,
  appleAuth,
  logout,
};