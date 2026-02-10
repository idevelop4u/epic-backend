import api from '../config/api';

export const helpRequestService = {
  // Apply to help a task
  applyToTask: async (taskId) => {
    const response = await api.post(`/help-requests/apply/${taskId}`);
    return response.data;
  },

  // Get my applications
  getMyApplications: async () => {
    const response = await api.get('/help-requests/my-applications');
    return response.data;
  },

  // Get applications for a task (for requester)
  getTaskApplications: async (taskId) => {
    const response = await api.get(`/help-requests/task/${taskId}`);
    return response.data;
  },

  // Approve an application
  approveApplication: async (applicationId) => {
    const response = await api.post(
      `/help-requests/${applicationId}/approve`
    );
    return response.data;
  },

  // Reject an application
  rejectApplication: async (applicationId) => {
    const response = await api.post(
      `/help-requests/${applicationId}/reject`
    );
    return response.data;
  },

  // Cancel application
  cancelApplication: async (applicationId) => {
    const response = await api.post(
      `/help-requests/${applicationId}/cancel`
    );
    return response.data;
  },

  // Update helper location
  updateHelperLocation: async (applicationId, latitude, longitude) => {
    const response = await api.put(`/help-requests/${applicationId}/location`, {
      latitude,
      longitude,
    });
    return response.data;
  },
};
