const Task = require('../models/Task');
const User = require('../models/User');
const HelpRequest = require('../models/HelpRequest');

// Create a new task (help request)
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      urgency,
      latitude,
      longitude,
      address,
      city,
      scheduledFor,
      estimatedDuration,
      maxHelpers,
      hideSensitiveDetails,
    } = req.body;

    // Validate required fields
    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Title, description, and category are required' });
    }

    // Validate coordinates
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'Location coordinates are required' });
    }

    // Calculate points reward based on urgency and category
    let pointsReward = 10; // Base points
    if (urgency === 'urgent') pointsReward += 10;
    else if (urgency === 'high') pointsReward += 5;

    // Bonus for helping vulnerable groups
    if (['elderly_care', 'disability_support', 'medical'].includes(category)) {
      pointsReward += 5;
    }

    const task = new Task({
      requester: req.user._id,
      title,
      description,
      category,
      urgency: urgency || 'normal',
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
        address,
        city,
      },
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      estimatedDuration: estimatedDuration || 30,
      maxHelpers: maxHelpers || 1,
      hideSensitiveDetails: hideSensitiveDetails || false,
      pointsReward,
    });

    await task.save();

    // Increment requester's task count
    await User.findByIdAndUpdate(req.user._id, { $inc: { tasksRequested: 1 } });

    res.status(201).json({
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Failed to create task' });
  }
};

// Get a single task by ID
const getTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId)
      .populate('requester', 'username profilePhoto averageRating phoneVerified idVerified')
      .populate('assignedHelper', 'username profilePhoto averageRating phone')
      .populate('additionalHelpers', 'username profilePhoto');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Hide sensitive details if flag is set and requester is not the current user
    if (task.hideSensitiveDetails && !task.requester._id.equals(req.user._id)) {
      task.location.address = 'Address hidden for privacy';
    }

    res.status(200).json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Failed to get task' });
  }
};

// Get my tasks (as requester)
const getMyTasks = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { requester: req.user._id };
    if (status) {
      query.status = status;
    }

    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('assignedHelper', 'username profilePhoto');

    const total = await Task.countDocuments(query);

    res.status(200).json({
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({ message: 'Failed to get tasks' });
  }
};

// Get tasks I'm helping with
const getHelpingTasks = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {
      $or: [
        { assignedHelper: req.user._id },
        { additionalHelpers: req.user._id },
      ],
    };
    if (status) {
      query.status = status;
    }

    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('requester', 'username profilePhoto phone');

    const total = await Task.countDocuments(query);

    res.status(200).json({
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get helping tasks error:', error);
    res.status(500).json({ message: 'Failed to get tasks' });
  }
};

// Discover nearby tasks (for helpers)
const discoverTasks = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      radius = 10, // km
      category,
      urgency,
      page = 1,
      limit = 20,
    } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Location coordinates are required' });
    }

    // Build query
    const query = {
      status: 'open',
      requester: { $ne: req.user._id }, // Don't show own tasks
    };

    // Geospatial query
    query.location = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
        $maxDistance: parseFloat(radius) * 1000, // Convert km to meters
      },
    };

    // Optional filters
    if (category) {
      query.category = category;
    }
    if (urgency) {
      query.urgency = urgency;
    }

    const tasks = await Task.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('requester', 'username profilePhoto averageRating idVerified');

    // Calculate distance for each task
    const tasksWithDistance = tasks.map(task => {
      const taskLng = task.location.coordinates[0];
      const taskLat = task.location.coordinates[1];
      const distance = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        taskLat,
        taskLng
      );
      return {
        ...task.toObject(),
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal
      };
    });

    res.status(200).json({
      tasks: tasksWithDistance,
      filters: { latitude, longitude, radius, category, urgency },
    });
  } catch (error) {
    console.error('Discover tasks error:', error);
    res.status(500).json({ message: 'Failed to discover tasks' });
  }
};

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Update task
const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const allowedUpdates = [
      'title',
      'description',
      'category',
      'urgency',
      'scheduledFor',
      'estimatedDuration',
      'maxHelpers',
      'hideSensitiveDetails',
    ];

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only requester can update
    if (!task.requester.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    // Can only update if task is still open
    if (task.status !== 'open') {
      return res.status(400).json({ message: 'Cannot update task after it has been accepted' });
    }

    const updates = {};
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Handle location update separately
    if (req.body.latitude !== undefined && req.body.longitude !== undefined) {
      updates.location = {
        type: 'Point',
        coordinates: [req.body.longitude, req.body.latitude],
        address: req.body.address || task.location.address,
        city: req.body.city || task.location.city,
      };
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Task updated successfully',
      task: updatedTask,
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Failed to update task' });
  }
};

// Cancel task
const cancelTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { reason } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is authorized (requester or assigned helper)
    const isRequester = task.requester.equals(req.user._id);
    const isHelper = task.assignedHelper?.equals(req.user._id);

    if (!isRequester && !isHelper) {
      return res.status(403).json({ message: 'Not authorized to cancel this task' });
    }

    // Check if task can be cancelled
    const cancellableStatuses = ['open', 'pending_approval', 'in_progress'];
    if (!cancellableStatuses.includes(task.status)) {
      return res.status(400).json({ message: 'Task cannot be cancelled in current status' });
    }

    task.status = 'cancelled';
    task.cancelledBy = req.user._id;
    task.cancellationReason = reason || 'No reason provided';
    await task.save();

    // Reject all pending help requests
    await HelpRequest.updateMany(
      { task: taskId, status: 'pending' },
      { status: 'rejected' }
    );

    res.status(200).json({
      message: 'Task cancelled successfully',
      task,
    });
  } catch (error) {
    console.error('Cancel task error:', error);
    res.status(500).json({ message: 'Failed to cancel task' });
  }
};

// Report dispute
const reportDispute = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Dispute reason is required' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is involved in the task
    const isRequester = task.requester.equals(req.user._id);
    const isHelper = task.assignedHelper?.equals(req.user._id) ||
      task.additionalHelpers.some(h => h.equals(req.user._id));

    if (!isRequester && !isHelper) {
      return res.status(403).json({ message: 'Not authorized to report dispute for this task' });
    }

    // Can only dispute completed or in-progress tasks
    const disputableStatuses = ['in_progress', 'helper_arrived', 'task_started', 'pending_verification', 'completed'];
    if (!disputableStatuses.includes(task.status)) {
      return res.status(400).json({ message: 'Cannot report dispute for task in current status' });
    }

    task.status = 'disputed';
    task.disputeReason = reason;
    await task.save();

    res.status(200).json({
      message: 'Dispute reported successfully. Our team will review it.',
      task,
    });
  } catch (error) {
    console.error('Report dispute error:', error);
    res.status(500).json({ message: 'Failed to report dispute' });
  }
};

// Update task status (workflow transitions)
const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Define valid status transitions
    const validTransitions = {
      'open': ['pending_approval', 'cancelled'],
      'pending_approval': ['in_progress', 'open', 'cancelled'],
      'in_progress': ['helper_arrived', 'cancelled', 'disputed'],
      'helper_arrived': ['task_started', 'cancelled', 'disputed'],
      'task_started': ['pending_verification', 'cancelled', 'disputed'],
      'pending_verification': ['completed', 'disputed'],
      'completed': ['disputed'],
      'cancelled': [],
      'disputed': [],
    };

    // Check if transition is valid
    if (!validTransitions[task.status]?.includes(status)) {
      return res.status(400).json({
        message: `Cannot transition from ${task.status} to ${status}`,
        validTransitions: validTransitions[task.status],
      });
    }

    // Check authorization based on status change
    const isRequester = task.requester.equals(req.user._id);
    const isHelper = task.assignedHelper?.equals(req.user._id);

    // Helper-only transitions
    if (['helper_arrived', 'task_started'].includes(status) && !isHelper) {
      return res.status(403).json({ message: 'Only assigned helper can update to this status' });
    }

    // Requester-only transitions
    if (['pending_verification'].includes(status) && !isRequester) {
      return res.status(403).json({ message: 'Only requester can verify task completion' });
    }

    // Update status and timestamps
    task.status = status;
    if (status === 'in_progress') {
      task.startedAt = new Date();
    } else if (status === 'completed') {
      task.completedAt = new Date();
    }

    await task.save();

    res.status(200).json({
      message: `Task status updated to ${status}`,
      task,
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ message: 'Failed to update task status' });
  }
};

// Generate OTP for task completion verification
const generateCompletionOTP = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only requester can generate OTP
    if (!task.requester.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only requester can generate completion OTP' });
    }

    // Task must be in appropriate status
    if (!['task_started', 'pending_verification'].includes(task.status)) {
      return res.status(400).json({ message: 'Task is not ready for completion verification' });
    }

    const otp = task.generateOTP();
    await task.save();

    res.status(200).json({
      message: 'Completion OTP generated',
      otp,
      expiresIn: '10 minutes',
      instruction: 'Share this OTP with the helper to verify task completion',
    });
  } catch (error) {
    console.error('Generate OTP error:', error);
    res.status(500).json({ message: 'Failed to generate OTP' });
  }
};

// Verify task completion with OTP
const verifyTaskCompletion = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only helper can verify with OTP
    const isHelper = task.assignedHelper?.equals(req.user._id) ||
      task.additionalHelpers.some(h => h.equals(req.user._id));

    if (!isHelper) {
      return res.status(403).json({ message: 'Only assigned helper can verify completion' });
    }

    // Verify OTP
    if (!task.verifyOTP(otp)) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Mark task as completed
    task.status = 'completed';
    task.completedAt = new Date();
    task.completionOTP = undefined;
    task.otpGeneratedAt = undefined;
    await task.save();

    // Award points to helper
    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        points: task.pointsReward,
        tasksHelped: 1,
      },
    });

    res.status(200).json({
      message: 'Task completed successfully!',
      pointsEarned: task.pointsReward,
      task,
    });
  } catch (error) {
    console.error('Verify completion error:', error);
    res.status(500).json({ message: 'Failed to verify task completion' });
  }
};

module.exports = {
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
};
