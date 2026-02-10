import api from '../config/api';

export const authService = {
  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  guestLogin: async () => {
    const response = await api.post('/auth/guest');
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  sendPhoneOTP: async (phoneNumber) => {
    const response = await api.post('/auth/send-otp', {
      phoneNumber,
    });
    return response.data;
  },

  verifyPhoneOTP: async (phoneNumber, otp) => {
    const response = await api.post('/auth/verify-otp', {
      phoneNumber,
      otp,
    });
    return response.data;
  },

  refreshToken: async () => {
    const response = await api.post('/auth/refresh-token');
    return response.data;
  },

  googleAuth: async (token) => {
    const response = await api.post('/auth/google', { token });
    return response.data;
  },

  appleAuth: async (identityToken) => {
    const response = await api.post('/auth/apple', { identityToken });
    return response.data;
  },
};
