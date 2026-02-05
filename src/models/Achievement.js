const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  // Achievement name (unique identifier)
  name: {
    type: String,
    required: true,
    unique: true,
  },

  // Display name
  displayName: {
    type: String,
    required: true,
  },

  // Description
  description: {
    type: String,
    required: true,
  },

  // Icon (emoji or URL)
  icon: {
    type: String,
    default: '🏆',
  },

  // Points reward for unlocking
  pointsReward: {
    type: Number,
    default: 5,
  },

  // Achievement criteria
  criteria: {
    // Type of criteria
    type: {
      type: String,
      enum: [
        'tasks_completed',      // Total tasks completed
        'tasks_requested',      // Total tasks requested
        'category_specific',    // Tasks in specific category
        'streak',               // Consecutive days helping
        'first_time',           // First time doing something
        'rating_based',         // Based on rating received
        'points_milestone',     // Reaching points milestone
      ],
      required: true,
    },
    // Threshold to reach
    threshold: {
      type: Number,
      default: 1,
    },
    // Category for category_specific achievements
    category: {
      type: String,
      enum: [
        'elderly_assistance',
        'disability_support',
        'errands',
        'home_help',
        'transport',
        'tech_help',
        'emergency',
      ],
    },
    // Specific action for first_time achievements
    action: {
      type: String,
    },
  },

  // Achievement tier
  tier: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common',
  },

  // Whether this achievement is active
  isActive: {
    type: Boolean,
    default: true,
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for querying active achievements
achievementSchema.index({ isActive: 1 });
achievementSchema.index({ 'criteria.type': 1 });

// Static method to seed default achievements
achievementSchema.statics.seedDefaults = async function () {
  const defaults = [
    {
      name: 'first_task_completed',
      displayName: 'First Task Completed',
      description: 'Complete your first helping task',
      icon: '🎉',
      pointsReward: 10,
      criteria: { type: 'first_time', action: 'task_completed', threshold: 1 },
      tier: 'common',
    },
    {
      name: 'first_help_request',
      displayName: 'First Help Request',
      description: 'Create your first help request',
      icon: '🙋',
      pointsReward: 5,
      criteria: { type: 'first_time', action: 'task_requested', threshold: 1 },
      tier: 'common',
    },
    {
      name: 'helped_elderly_5',
      displayName: 'Helping Elders',
      description: 'Help 5 elderly people',
      icon: '👴',
      pointsReward: 20,
      criteria: { type: 'category_specific', category: 'elderly_assistance', threshold: 5 },
      tier: 'rare',
    },
    {
      name: 'disability_support_5',
      displayName: 'Disability Ally',
      description: 'Help 5 people with disabilities',
      icon: '♿',
      pointsReward: 20,
      criteria: { type: 'category_specific', category: 'disability_support', threshold: 5 },
      tier: 'rare',
    },
    {
      name: 'helper_10',
      displayName: 'Dedicated Helper',
      description: 'Complete 10 helping tasks',
      icon: '🤝',
      pointsReward: 25,
      criteria: { type: 'tasks_completed', threshold: 10 },
      tier: 'rare',
    },
    {
      name: 'helper_50',
      displayName: 'Community Champion',
      description: 'Complete 50 helping tasks',
      icon: '🏅',
      pointsReward: 50,
      criteria: { type: 'tasks_completed', threshold: 50 },
      tier: 'epic',
    },
    {
      name: 'helper_100',
      displayName: 'Legendary Helper',
      description: 'Complete 100 helping tasks',
      icon: '👑',
      pointsReward: 100,
      criteria: { type: 'tasks_completed', threshold: 100 },
      tier: 'legendary',
    },
    {
      name: 'five_star_rating',
      displayName: 'Five Star Helper',
      description: 'Maintain a 5-star rating with at least 10 reviews',
      icon: '⭐',
      pointsReward: 30,
      criteria: { type: 'rating_based', threshold: 5 },
      tier: 'epic',
    },
    {
      name: 'week_streak',
      displayName: 'Weekly Warrior',
      description: 'Help for 7 consecutive days',
      icon: '🔥',
      pointsReward: 25,
      criteria: { type: 'streak', threshold: 7 },
      tier: 'rare',
    },
    {
      name: 'emergency_responder',
      displayName: 'Emergency Responder',
      description: 'Respond to 3 emergency/SOS tasks',
      icon: '🚨',
      pointsReward: 30,
      criteria: { type: 'category_specific', category: 'emergency', threshold: 3 },
      tier: 'epic',
    },
  ];

  for (const achievement of defaults) {
    await this.findOneAndUpdate(
      { name: achievement.name },
      achievement,
      { upsert: true, new: true }
    );
  }
};

const Achievement = mongoose.model('Achievement', achievementSchema);

module.exports = Achievement;
