import io from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

let socket = null;

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export const initializeSocket = async (userId) => {
  try {
    const token = await SecureStore.getItemAsync('authToken');

    socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      if (userId) {
        socket.emit('user_online', { userId });
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('error', (error) => {
      console.log('Socket error:', error);
    });

    return socket;
  } catch (e) {
    console.log('Error initializing socket:', e);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const onTaskAssigned = (callback) => {
  if (socket) {
    socket.on('task_assigned', callback);
  }
};

export const onApplicationApproved = (callback) => {
  if (socket) {
    socket.on('application_approved', callback);
  }
};

export const onApplicationRejected = (callback) => {
  if (socket) {
    socket.on('application_rejected', callback);
  }
};

export const onNewApplication = (callback) => {
  if (socket) {
    socket.on('new_application', callback);
  }
};

export const onMessageReceived = (callback) => {
  if (socket) {
    socket.on('message', callback);
  }
};

export const sendMessage = (recipientId, message) => {
  if (socket) {
    socket.emit('send_message', { recipientId, message });
  }
};

export const updateHelperLocation = (applicationId, latitude, longitude) => {
  if (socket) {
    socket.emit('update_location', {
      applicationId,
      latitude,
      longitude,
    });
  }
};
