import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService, NotificationPayload } from '../services/notificationService';
import { fcmService } from '../services/fcmService';

export const useNotifications = (onNotificationTap?: (payload: NotificationPayload) => void) => {
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    // We request permissions in the hook to ensure it's called at the right time
    // typically when the main app layout mounts, after auth.
    notificationService.setup();

    // Handle cold-start (app was killed and user tapped notification)
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response?.notification?.request?.content?.data) {
        const payload = response.notification.request.content.data as NotificationPayload;
        console.log('Cold start notification tapped:', payload);
        if (onNotificationTap && payload) {
          onNotificationTap(payload);
        }
      }
    });

    // 🔔 Listen for FCM Push Notifications while the app is OPEN
    const unsubscribeFCM = fcmService.onForegroundMessage((remoteMessage) => {
      console.log('Foreground FCM received:', remoteMessage);
      const title = remoteMessage.notification?.title || 'Context';
      const body = remoteMessage.notification?.body || 'لديك إشعار جديد';
      const data = remoteMessage.data as unknown as NotificationPayload;
      
      // Use expo-notifications to draw the visual banner on top of the screen
      notificationService.scheduleLocalNotification(title, body, data);
    });

    // Listen for when a user taps on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const payload = response.notification.request.content.data as NotificationPayload;
      console.log('Notification tapped:', payload);
      
      if (onNotificationTap && payload) {
        onNotificationTap(payload);
      }
    });

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
      unsubscribeFCM();
    };
  }, [onNotificationTap]);

  return {
    scheduleLocalNotification: notificationService.scheduleLocalNotification,
    notifyUploadComplete: notificationService.notifyUploadComplete,
    notifyAnalysisReady: notificationService.notifyAnalysisReady,
    notifyAnalysisComplete: notificationService.notifyAnalysisComplete,
    notifyAnalysisFailed: notificationService.notifyAnalysisFailed,
  };
};
