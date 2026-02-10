import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const initialize = async () => {
  if (!Device.isDevice) {
    console.log('Must use physical device for Push Notifications');
    return;
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push notification permissions');
    return;
  }

  const projectId =
    require('../../app.json').expo.extra?.eas?.projectId;
  
  try {
    const pushToken = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    console.log('Push token:', pushToken.data);
    return pushToken.data;
  } catch (e) {
    console.log('Error getting push token:', e);
  }
};

export const addNotificationListener = (callback) => {
  const subscription =
    Notifications.addNotificationReceivedListener(callback);
  return subscription;
};

export const addNotificationResponseListener = (callback) => {
  const subscription =
    Notifications.addNotificationResponseReceivedListener(callback);
  return subscription;
};

export const sendLocalNotification = async (title, body, data = {}) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
      badge: 1,
    },
    trigger: { seconds: 1 },
  });
};
