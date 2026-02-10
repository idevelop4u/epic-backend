import api from '../config/api';

export const userService = {
  // Get user profile
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (updates) => {
    const response = await api.put('/users/profile', updates);
    return response.data;
  },

  // Upload profile picture
  uploadProfilePicture: async (formData) => {
    const response = await api.post('/users/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get user by ID
  getUserById: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Search users
  searchUsers: async (query) => {
    const response = await api.get('/users/search', { params: { q: query } });
    return response.data;
  },

  // Get user reviews
  getReviews: async (userId) => {
    const response = await api.get(`/users/${userId}/reviews`);
    return response.data;
  },

  // Get user achievements
  getAchievements: async (userId) => {
    const response = await api.get(`/users/${userId}/achievements`);
    return response.data;
  },

  // Request help (elderly user)
  requestHelp: async (helpData) => {
    const response = await api.post('/users/help-request', helpData);
    return response.data;
  },

  // Verify identity
  verifyIdentity: async (documentData) => {
    const response = await api.post('/users/verify-identity', documentData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
