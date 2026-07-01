import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService, NotificationPayload } from '../services/notificationService';

export const useNotifications = (onNotificationTap?: (payload: NotificationPayload) => void) => {
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    // We request permissions in the hook to ensure it's called at the right time
    // typically when the main app layout mounts, after auth.
    notificationService.setup();

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
    };
  }, [onNotificationTap]);

  return {
    scheduleLocalNotification: notificationService.scheduleLocalNotification,
    notifyUploadComplete: notificationService.notifyUploadComplete,
    notifyAnalysisReady: notificationService.notifyAnalysisReady,
    notifyAnalysisFailed: notificationService.notifyAnalysisFailed,
  };
};
