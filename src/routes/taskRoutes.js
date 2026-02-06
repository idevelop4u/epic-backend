const { Router } = require('express');
const {
  createTask,
  getTask,
  getMyTasks,
  getHelpingTasks,
  discoverTasks,
  updateTask,
  cancelTask,
  reportDispute,
  updateTaskStatus,
  generateCompletionOTP,
  verifyTaskCompletion,
} = require('../controllers/taskController');
const {
  authenticateToken,
  requireNonGuest,
  requireVerifiedUser,
} = require('../middleware/authMiddleware');

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Task discovery (for helpers)
router.get('/discover', discoverTasks);

// Get my tasks (as requester)
router.get('/my-tasks', getMyTasks);

// Get tasks I'm helping with
router.get('/helping', getHelpingTasks);

// Create a new task (requires non-guest)
router.post('/', requireNonGuest, createTask);

// Get a specific task
router.get('/:taskId', getTask);

// Update a task
router.put('/:taskId', requireNonGuest, updateTask);

// Cancel a task
router.post('/:taskId/cancel', requireNonGuest, cancelTask);

// Report dispute
router.post('/:taskId/dispute', requireNonGuest, reportDispute);

// Update task status (workflow transitions)
router.patch('/:taskId/status', requireNonGuest, updateTaskStatus);

// Generate completion OTP (for requester)
router.post('/:taskId/generate-otp', requireNonGuest, generateCompletionOTP);

// Verify task completion with OTP (for helper)
router.post('/:taskId/verify-completion', requireNonGuest, verifyTaskCompletion);

module.exports = router;
