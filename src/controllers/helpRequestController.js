const HelpRequest = require('../models/HelpRequest');
const Task = require('../models/Task');
const User = require('../models/User');

// Helper function to calculate distance (Haversine formula)
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

// Helper function to calculate ETA (simple estimation based on average speed)
function calculateETA(distanceKm) {
  const averageSpeedKmh = 20; // Average speed in city (walking/cycling/driving mix)
  const hours = distanceKm / averageSpeedKmh;
  const minutes = Math.round(hours * 60);
  return minutes;
}

// Apply to help with a task
const applyToTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { message, currentLatitude, currentLongitude } = req.body;

    // Get the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task is still open
    if (task.status !== 'open') {
      return res.status(400).json({ message: 'Task is no longer accepting applications' });
    }

    // Can't apply to your own task
    if (task.requester.equals(req.user._id)) {
      return res.status(400).json({ message: 'Cannot apply to your own task' });
    }

    // Check if already applied
    const existingApplication = await HelpRequest.findOne({
      task: taskId,
      helper: req.user._id,
      status: { $in: ['pending', 'approved'] },
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied to this task' });
    }

    // Calculate distance and ETA if location provided
    let distance, estimatedTimeMinutes;
    if (currentLatitude && currentLongitude) {
      const taskLat = task.location.coordinates[1];
      const taskLng = task.location.coordinates[0];
      distance = calculateDistance(currentLatitude, currentLongitude, taskLat, taskLng);
      estimatedTimeMinutes = calculateETA(distance);
    }

    // Create help request
    const helpRequest = new HelpRequest({
      task: taskId,
      helper: req.user._id,
      message: message || 'I would like to help with this task',
      helperLocation: currentLatitude && currentLongitude ? {
        type: 'Point',
        coordinates: [currentLongitude, currentLatitude],
      } : undefined,
      distance: distance || 0,
      estimatedTimeMinutes: estimatedTimeMinutes || 0,
    });

    await helpRequest.save();

    // Increment application count on task
    await Task.findByIdAndUpdate(taskId, { $inc: { applicationCount: 1 } });

    // TODO: Send notification to task requester

    res.status(201).json({
      message: 'Application submitted successfully',
      helpRequest: {
        id: helpRequest._id,
        taskId: task._id,
        taskTitle: task.title,
        message: helpRequest.message,
        distance: distance ? `${Math.round(distance * 10) / 10} km` : 'N/A',
        estimatedArrival: estimatedTimeMinutes ? `${estimatedTimeMinutes} minutes` : 'N/A',
        status: helpRequest.status,
      },
    });
  } catch (error) {
    console.error('Apply to task error:', error);
    res.status(500).json({ message: 'Failed to apply to task' });
  }
};

// Get applications for a specific task (for requester)
const getTaskApplications = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Get the task and verify ownership
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!task.requester.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view applications for this task' });
    }

    // Get all applications
    const applications = await HelpRequest.find({ task: taskId })
      .populate('helper', 'username profilePhoto averageRating totalReviews idVerified phoneVerified')
      .sort({ createdAt: -1 });

    res.status(200).json({
      applications,
      total: applications.length,
    });
  } catch (error) {
    console.error('Get task applications error:', error);
    res.status(500).json({ message: 'Failed to get applications' });
  }
};

// Get my applications (as helper)
const getMyApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { helper: req.user._id };
    if (status) {
      query.status = status;
    }

    const applications = await HelpRequest.find(query)
      .populate('task', 'title category urgency location status pointsReward')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await HelpRequest.countDocuments(query);

    res.status(200).json({
      applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ message: 'Failed to get applications' });
  }
};

// Approve a help request (requester)
const approveApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const helpRequest = await HelpRequest.findById(applicationId)
      .populate('task')
      .populate('helper', 'username phone');

    if (!helpRequest) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const task = helpRequest.task;

    // Verify requester
    if (!task.requester.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to approve this application' });
    }

    // Check if task already has assigned helper
    if (task.assignedHelper && !task.canAcceptMoreHelpers()) {
      return res.status(400).json({ message: 'Task already has maximum number of helpers' });
    }

    // Check if application is pending
    if (helpRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Application is not in pending status' });
    }

    // Approve the application
    helpRequest.status = 'approved';
    helpRequest.respondedAt = new Date();
    await helpRequest.save();

    // Assign helper to task
    if (!task.assignedHelper) {
      task.assignedHelper = helpRequest.helper._id;
      task.status = 'pending_approval';
    } else if (task.canAcceptMoreHelpers()) {
      task.additionalHelpers.push(helpRequest.helper._id);
    }
    await task.save();

    // Reject all other pending applications
    await HelpRequest.updateMany(
      {
        task: task._id,
        _id: { $ne: applicationId },
        status: 'pending',
      },
      {
        status: 'rejected',
        respondedAt: new Date(),
      }
    );

    // TODO: Send notification to approved helper

    res.status(200).json({
      message: 'Application approved successfully',
      helpRequest,
      assignedHelper: {
        username: helpRequest.helper.username,
        phone: helpRequest.helper.phone,
      },
    });
  } catch (error) {
    console.error('Approve application error:', error);
    res.status(500).json({ message: 'Failed to approve application' });
  }
};

// Reject a help request (requester)
const rejectApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { reason } = req.body;

    const helpRequest = await HelpRequest.findById(applicationId).populate('task');

    if (!helpRequest) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const task = helpRequest.task;

    // Verify requester
    if (!task.requester.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to reject this application' });
    }

    // Check if application is pending
    if (helpRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Application is not in pending status' });
    }

    // Reject the application
    helpRequest.status = 'rejected';
    helpRequest.respondedAt = new Date();
    helpRequest.rejectionReason = reason;
    await helpRequest.save();

    // TODO: Send notification to rejected helper

    res.status(200).json({
      message: 'Application rejected',
      helpRequest,
    });
  } catch (error) {
    console.error('Reject application error:', error);
    res.status(500).json({ message: 'Failed to reject application' });
  }
};

// Cancel application (helper)
const cancelApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const helpRequest = await HelpRequest.findById(applicationId);

    if (!helpRequest) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify helper
    if (!helpRequest.helper.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to cancel this application' });
    }

    // Can only cancel if pending
    if (helpRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Can only cancel pending applications' });
    }

    // Cancel the application
    helpRequest.status = 'cancelled';
    await helpRequest.save();

    // Decrement application count
    await Task.findByIdAndUpdate(helpRequest.task, { $inc: { applicationCount: -1 } });

    res.status(200).json({
      message: 'Application cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel application error:', error);
    res.status(500).json({ message: 'Failed to cancel application' });
  }
};

// Update helper location (for ETA tracking)
const updateHelperLocation = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const helpRequest = await HelpRequest.findById(applicationId).populate('task');

    if (!helpRequest) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify helper
    if (!helpRequest.helper.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }

    // Only update if approved
    if (helpRequest.status !== 'approved') {
      return res.status(400).json({ message: 'Can only update location for approved applications' });
    }

    // Update location
    helpRequest.helperLocation = {
      type: 'Point',
      coordinates: [longitude, latitude],
    };

    // Recalculate distance and ETA
    const task = helpRequest.task;
    const taskLat = task.location.coordinates[1];
    const taskLng = task.location.coordinates[0];
    const distance = calculateDistance(latitude, longitude, taskLat, taskLng);
    const eta = calculateETA(distance);

    helpRequest.distance = distance;
    helpRequest.estimatedTimeMinutes = eta;

    await helpRequest.save();

    // TODO: Send real-time location update via Socket.io

    res.status(200).json({
      message: 'Location updated successfully',
      distance: `${Math.round(distance * 10) / 10} km`,
      eta: `${eta} minutes`,
    });
  } catch (error) {
    console.error('Update helper location error:', error);
    res.status(500).json({ message: 'Failed to update location' });
  }
};

module.exports = {
  applyToTask,
  getTaskApplications,
  getMyApplications,
  approveApplication,
  rejectApplication,
  cancelApplication,
  updateHelperLocation,
};
