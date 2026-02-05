const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authenticate token - required for protected routes
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'Invalid token - user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Optional auth - attaches user if token present, but doesn't require it
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Token is invalid, but we continue without user
    next();
  }
};

// Require verified user (phone or ID verified)
const requireVerifiedUser = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!req.user.phoneVerified && !req.user.idVerified) {
    return res.status(403).json({
      message: 'Account verification required',
      requiresVerification: true,
    });
  }

  next();
};

// Require non-guest user
const requireNonGuest = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.isGuest) {
    return res.status(403).json({
      message: 'Guest accounts cannot perform this action. Please register.',
      isGuest: true,
    });
  }

  next();
};

// Require helper role preference
const requireHelperRole = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.rolePreference === 'requester') {
    return res.status(403).json({
      message: 'You need to enable helper role in your profile',
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireVerifiedUser,
  requireNonGuest,
  requireHelperRole,
};