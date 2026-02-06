const { Router } = require('express');
const {
  applyToTask,
  getTaskApplications,
  getMyApplications,
  approveApplication,
  rejectApplication,
  cancelApplication,
  updateHelperLocation,
} = require('../controllers/helpRequestController');
const {
  authenticateToken,
  requireNonGuest,
} = require('../middleware/authMiddleware');

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get my applications (as helper)
router.get('/my-applications', getMyApplications);

// Apply to a task (helper)
router.post('/apply/:taskId', requireNonGuest, applyToTask);

// Get all applications for a task (requester)
router.get('/task/:taskId', getTaskApplications);

// Approve an application (requester)
router.post('/:applicationId/approve', requireNonGuest, approveApplication);

// Reject an application (requester)
router.post('/:applicationId/reject', requireNonGuest, rejectApplication);

// Cancel application (helper)
router.post('/:applicationId/cancel', requireNonGuest, cancelApplication);

// Update helper location for ETA tracking (helper)
router.put('/:applicationId/location', requireNonGuest, updateHelperLocation);

module.exports = router;
