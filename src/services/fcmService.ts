import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

export const fcmService = {
  /**
   * Request permission for push notifications (required on iOS, optional but recommended on Android 13+)
   */
  requestPermission: async (): Promise<boolean> => {
    const authStatus = await messaging().requestPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  },

  /**
   * Get the FCM token for the device
   */
  getFCMToken: async (): Promise<string | null> => {
    try {
      const token = await messaging().getToken();
      return token;
    } catch (error) {
      console.error('FCM Token Error:', error);
      return null;
    }
  },

  /**
   * Listen for token refresh events
   */
  onTokenRefresh: (callback: (token: string) => void) => {
    return messaging().onTokenRefresh(callback);
  },

  /**
   * Setup background message handler
   */
  setupBackgroundHandler: () => {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Background FCM received:', remoteMessage);
      // Expo-notifications automatically handles displaying the notification
    });
  },

  /**
   * Setup foreground message listener
   */
  onForegroundMessage: (callback: (msg: any) => void) => {
    return messaging().onMessage(callback);
  }
};
