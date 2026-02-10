import api from '../config/api';

export const taskService = {
  // Get all tasks
  getAllTasks: async (filters = {}) => {
    const response = await api.get('/tasks', { params: filters });
    return response.data;
  },

  // Get single task
  getTask: async (taskId) => {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  },

  // Create task (for requester/elderly)
  createTask: async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  // Update task
  updateTask: async (taskId, updates) => {
    const response = await api.put(`/tasks/${taskId}`, updates);
    return response.data;
  },

  // Delete task
  deleteTask: async (taskId) => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },

  // Get my tasks (created by current user)
  getMyTasks: async () => {
    const response = await api.get('/tasks/my-tasks');
    return response.data;
  },

  // Assign a volunteer to a task
  assignVolunteer: async (taskId, volunteerId) => {
    const response = await api.post(`/tasks/${taskId}/assign`, {
      volunteerId,
    });
    return response.data;
  },

  // Mark task as complete
  completeTask: async (taskId) => {
    const response = await api.put(`/tasks/${taskId}/complete`);
    return response.data;
  },

  // Rate a completed task
  rateTask: async (taskId, rating, review) => {
    const response = await api.post(`/tasks/${taskId}/rate`, {
      rating,
      review,
    });
    return response.data;
  },
};
