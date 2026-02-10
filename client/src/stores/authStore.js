import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  loading: false,

  setUser: async (user) => {
    set({ user });
    if (user) {
      try {
        await SecureStore.setItemAsync('user', JSON.stringify(user));
      } catch (e) {
        console.log('Error storing user', e);
      }
    }
  },

  setToken: async (token) => {
    set({ token });
    if (token) {
      try {
        await SecureStore.setItemAsync('authToken', token);
      } catch (e) {
        console.log('Error storing token', e);
      }
    }
  },

  setLoading: (loading) => set({ loading }),

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('user');
    } catch (e) {
      console.log('Error clearing storage', e);
    }
    set({ user: null, token: null });
  },

  updateUserProfile: (updates) => {
    set((state) => ({
      user: { ...state.user, ...updates },
    }));
  },
}));
