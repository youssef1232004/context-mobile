import * as Notifications from 'expo-notifications';
import { Platform, Linking } from 'react-native';

// Set how notifications should be handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type NotificationPayload = {
  type: 'UPLOAD_COMPLETE' | 'ANALYSIS_READY' | 'ANALYSIS_FAILED' | 'ANALYSIS_COMPLETE' | 'SUGGESTED_FOCUS';
  documentId?: string;
  [key: string]: any;
};

export const notificationService = {
  /**
   * Request permissions and setup notification channels (for Android)
   */
  setup: async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Context Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8b5cf6', // Primary color
      });
    }

    const { status: existingStatus, canAskAgain } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If permission was previously denied and we can't ask again, direct user to settings
    if (existingStatus === 'denied' && !canAskAgain) {
      console.log('Permission previously denied. Redirecting to settings...');
      Linking.openSettings();
      return false;
    }

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission not granted for push notifications!');
      return false;
    }
    return true;
  },

  /**
   * Schedule a generic local notification
   */
  scheduleLocalNotification: async (title: string, body: string, data?: NotificationPayload) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
      },
      trigger: null, // trigger immediately
    });
  },

  // Specific notification triggers for standardizing content
  notifyUploadComplete: (documentName: string, documentId: string) => {
    return notificationService.scheduleLocalNotification(
      '📤 Upload Complete',
      `Your file '${documentName}' has been uploaded and is being analyzed.`,
      { type: 'UPLOAD_COMPLETE', documentId }
    );
  },

  notifyAnalysisReady: (documentName: string, documentId: string) => {
    return notificationService.scheduleLocalNotification(
      '✨ Analysis Ready',
      `'${documentName}' insights are ready! Tap to view.`,
      { type: 'ANALYSIS_READY', documentId }
    );
  },

  notifyAnalysisComplete: (documentName: string, documentId: string) => {
    return notificationService.scheduleLocalNotification(
      '✨ Analysis Complete',
      `'${documentName}' is ready! Tap to open.`,
      { type: 'ANALYSIS_COMPLETE', documentId }
    );
  },

  notifyAnalysisFailed: (documentName: string, documentId: string) => {
    return notificationService.scheduleLocalNotification(
      '⚠️ Analysis Failed',
      `Could not process '${documentName}'. Please try again.`,
      { type: 'ANALYSIS_FAILED', documentId }
    );
  }
};
