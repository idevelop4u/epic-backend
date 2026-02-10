import { create } from 'zustand';

export const useTasksStore = create((set, get) => ({
  tasks: [],
  myApplications: [],
  selectedTask: null,
  loading: false,
  error: null,

  setTasks: (tasks) => set({ tasks }),
  setMyApplications: (applications) => set({ myApplications: applications }),
  setSelectedTask: (task) => set({ selectedTask: task }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  addTask: (task) => {
    set((state) => ({
      tasks: [task, ...state.tasks],
    }));
  },

  updateTask: (taskId, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t._id === taskId ? { ...t, ...updates } : t)),
    }));
  },

  deleteTask: (taskId) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t._id !== taskId),
    }));
  },

  addApplication: (application) => {
    set((state) => ({
      myApplications: [application, ...state.myApplications],
    }));
  },

  updateApplication: (appId, updates) => {
    set((state) => ({
      myApplications: state.myApplications.map((a) =>
        a._id === appId ? { ...a, ...updates } : a
      ),
    }));
  },
}));
