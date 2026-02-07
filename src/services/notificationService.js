const Notification = require('../models/Notification');
const { sendNotificationToUser } = require('../socket');

/**
 * Create and save a notification
 * @param {Object} data - Notification data
 * @param {String} data.userId - User ID to send notification to
 * @param {String} data.type - Notification type
 * @param {String} data.title - Notification title
 * @param {String} data.body - Notification body
 * @param {Object} data.data - Additional data
 * @returns {Promise<Object>} Created notification
 */
const createNotification = async ({ userId, type, title, body, data = {} }) => {
  try {
    const notification = new Notification({
      user: userId,
      type,
      title,
      body,
      data,
    });

    await notification.save();

    // Send real-time notification via Socket.io
    sendNotificationToUser(userId, notification);

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create notification for new help request
 */
const notifyNewHelpRequest = async (taskId, requesterId, helperId) => {
  const User = require('../models/User');
  const requester = await User.findById(requesterId).select('username');

  return createNotification({
    userId: helperId,
    type: 'help_request',
    title: 'New Help Request',
    body: `${requester.username} requested help on their task`,
    data: { taskId },
  });
};

/**
 * Create notification when helper is approved
 */
const notifyHelperApproved = async (taskId, requesterId, helperId) => {
  const Task = require('../models/Task');
  const task = await Task.findById(taskId).select('title');

  return createNotification({
    userId: helperId,
    type: 'helper_approved',
    title: 'You\'re Approved!',
    body: `You've been approved to help with "${task.title}"`,
    data: { taskId },
  });
};

/**
 * Create notification when helper is rejected
 */
const notifyHelperRejected = async (taskId, helperId) => {
  const Task = require('../models/Task');
  const task = await Task.findById(taskId).select('title');

  return createNotification({
    userId: helperId,
    type: 'helper_approved',
    title: 'Application Update',
    body: `Your application for "${task.title}" was not selected`,
    data: { taskId },
  });
};

/**
 * Create notification when helper is nearby
 */
const notifyHelperNearby = async (taskId, requesterId, helperId, estimatedArrival) => {
  const User = require('../models/User');
  const helper = await User.findById(helperId).select('username');

  return createNotification({
    userId: requesterId,
    type: 'helper_nearby',
    title: 'Helper Nearby',
    body: `${helper.username} is ${estimatedArrival} minutes away`,
    data: { taskId, helperId },
  });
};

/**
 * Create notification for task status update
 */
const notifyTaskUpdate = async (taskId, userId, status, message) => {
  return createNotification({
    userId,
    type: 'task_update',
    title: 'Task Update',
    body: message,
    data: { taskId, status },
  });
};

/**
 * Create notification when urgent task is nearby
 */
const notifyUrgentTaskNearby = async (taskId, helperId, distance) => {
  const Task = require('../models/Task');
  const task = await Task.findById(taskId).select('title urgency');

  return createNotification({
    userId: helperId,
    type: 'urgent_nearby',
    title: `${task.urgency === 'sos' ? '🆘 SOS Alert!' : '⚠️ Urgent Task Nearby'}`,
    body: `"${task.title}" - ${Math.round(distance / 1000)}km away`,
    data: { taskId, urgency: task.urgency },
  });
};

/**
 * Create notification when certificate is unlocked
 */
const notifyCertificateUnlocked = async (userId, level, certificateId) => {
  return createNotification({
    userId,
    type: 'certificate_unlocked',
    title: '🎉 Certificate Unlocked!',
    body: `Congratulations! You've earned a ${level.toUpperCase()} certificate`,
    data: { certificateId, level },
  });
};

/**
 * Create notification when achievement is unlocked
 */
const notifyAchievementUnlocked = async (userId, achievementName, points) => {
  return createNotification({
    userId,
    type: 'certificate_unlocked',
    title: '🏆 Achievement Unlocked!',
    body: `${achievementName} (+${points} points)`,
    data: { achievementName, points },
  });
};

/**
 * Send bulk notifications to multiple users
 */
const sendBulkNotifications = async (userIds, { type, title, body, data }) => {
  const notifications = userIds.map((userId) => ({
    user: userId,
    type,
    title,
    body,
    data,
  }));

  const created = await Notification.insertMany(notifications);

  // Send real-time notifications
  created.forEach((notification) => {
    sendNotificationToUser(notification.user.toString(), notification);
  });

  return created;
};

module.exports = {
  createNotification,
  notifyNewHelpRequest,
  notifyHelperApproved,
  notifyHelperRejected,
  notifyHelperNearby,
  notifyTaskUpdate,
  notifyUrgentTaskNearby,
  notifyCertificateUnlocked,
  notifyAchievementUnlocked,
  sendBulkNotifications,
};
