const { Router } = require('express');
const {
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
} = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { profileUpload } = require('../middleware/uploadMiddleware');

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile/photo', profileUpload.single('photo'), uploadProfilePhoto);

// Get another user's public profile
router.get('/:userId', getPublicProfile);

// Location
router.put('/location', updateLocation);

// Verification
router.post('/verify-identity', verifyIdentity);

// Trusted contacts
router.get('/trusted-contacts', getTrustedContacts);
router.put('/trusted-contacts', updateTrustedContacts);

// Stats
router.get('/stats', getStats);

// FCM token for push notifications
router.put('/fcm-token', updateFCMToken);

// Convert guest to full user
router.post('/convert-guest', convertGuestToUser);

module.exports = router;
