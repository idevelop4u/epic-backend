const { Router } = require('express');
const {
  signup,
  login,
  sendPhoneOTP,
  verifyPhoneOTP,
  guestLogin,
  refreshToken,
  googleAuth,
  appleAuth,
  logout,
} = require('../controllers/authController');
const { authenticateToken, optionalAuth } = require('../middleware/authMiddleware');

const router = Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/guest', guestLogin);
router.post('/refresh-token', refreshToken);

// OAuth routes
router.post('/google', googleAuth);
router.post('/apple', appleAuth);

// OTP routes (optional auth - can work before or after login)
router.post('/send-otp', optionalAuth, sendPhoneOTP);
router.post('/verify-otp', optionalAuth, verifyPhoneOTP);

// Protected routes
router.post('/logout', authenticateToken, logout);

module.exports = router;