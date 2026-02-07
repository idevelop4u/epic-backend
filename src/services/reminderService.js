const cron = require('node-cron');
const Task = require('../models/Task');
const User = require('../models/User');
const { notifyUrgentTaskNearby } = require('./notificationService');

/**
 * Calculate distance between two points using Haversine formula
 * @param {Array} coords1 - [longitude, latitude]
 * @param {Array} coords2 - [longitude, latitude]
 * @returns {Number} Distance in meters
 */
const calculateDistance = (coords1, coords2) => {
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;

  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Find nearby helpers and send notifications for urgent tasks
 */
const notifyNearbyHelpersForUrgentTasks = async () => {
  try {
    console.log('Running auto-reminder job for nearby helpers...');

    // Find urgent tasks that are open
    const urgentTasks = await Task.find({
      status: 'open',
      urgency: { $in: ['urgent', 'sos'] },
      location: { $exists: true },
    }).select('_id title urgency location');

    if (urgentTasks.length === 0) {
      console.log('No urgent tasks found');
      return;
    }

    console.log(`Found ${urgentTasks.length} urgent tasks`);

    // Find active helpers (recently updated location)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const activeHelpers = await User.find({
      rolePreference: { $in: ['helper', 'both'] },
      location: { $exists: true },
      locationUpdatedAt: { $gte: thirtyMinutesAgo },
    }).select('_id location');

    if (activeHelpers.length === 0) {
      console.log('No active helpers found');
      return;
    }

    console.log(`Found ${activeHelpers.length} active helpers`);

    // Match helpers with nearby urgent tasks
    for (const task of urgentTasks) {
      const taskCoords = task.location.coordinates;

      for (const helper of activeHelpers) {
        const helperCoords = helper.location.coordinates;
        const distance = calculateDistance(taskCoords, helperCoords);

        // Notify if helper is within 5km for urgent or 10km for SOS
        const maxDistance = task.urgency === 'sos' ? 10000 : 5000;

        if (distance <= maxDistance) {
          await notifyUrgentTaskNearby(task._id, helper._id, distance);
          console.log(
            `Notified helper ${helper._id} about ${task.urgency} task ${task._id} (${Math.round(distance / 1000)}km away)`
          );
        }
      }
    }

    console.log('Auto-reminder job completed');
  } catch (error) {
    console.error('Error in auto-reminder job:', error);
  }
};

/**
 * Initialize cron jobs
 */
const initializeReminderJobs = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    notifyNearbyHelpersForUrgentTasks();
  });

  console.log('Reminder jobs initialized');
};

module.exports = {
  initializeReminderJobs,
  notifyNearbyHelpersForUrgentTasks,
  calculateDistance,
};
