import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, DeviceEventEmitter } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import { useAppDispatch } from '../store/hooks';
import { restoreSession, logout } from '../features/auth/store/authSlice';
import type { RootState } from '../store/store';
import AuthStack from './AuthStack';
import MainTabNavigator from './MainTabNavigator';
import ProfileStack from './ProfileStack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSSE } from '../hooks/useSSE';
import { Toast } from '../components/ui/Toast';
import { TOAST_EVENT } from '../services/toastEmitter';
import type { ToastVariant } from '../components/ui/Toast';
import { useNotifications } from '../hooks/useNotifications';
import type { NotificationPayload } from '../services/notificationService';

import BootSequenceScreen from '../features/auth/screens/BootSequenceScreen';

const Stack = createNativeStackNavigator();
export const navigationRef = createNavigationContainerRef<any>();

interface GlobalToastState {
  visible: boolean;
  message: string;
  variant: ToastVariant;
}

import { useDocumentAnalysisPoller } from '../hooks/useDocumentAnalysisPoller';

function AppStack() {
  const [isBooting, setIsBooting] = useState(true);

  // ── App-level SSE: stays connected across all tabs ──
  useSSE();

  // ── Document Analysis Poller: checks status and sends notifications ──
  useDocumentAnalysisPoller();

  // ── Global Toast: receives events from toastEmitter.show() ──
  const [globalToast, setGlobalToast] = useState<GlobalToastState>({
    visible: false,
    message: '',
    variant: 'info',
  });

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      TOAST_EVENT,
      ({ message, variant }: { message: string; variant: ToastVariant }) => {
        setGlobalToast({ visible: true, message, variant });
      }
    );
    return () => sub.remove();
  }, []);

  if (isBooting) {
    return <BootSequenceScreen onComplete={() => setIsBooting(false)} />;
  }

  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen name="Profile" component={ProfileStack} />
      </Stack.Navigator>

      {/* Global SSE toast — visible on every screen */}
      <Toast
        visible={globalToast.visible}
        message={globalToast.message}
        variant={globalToast.variant}
        onHide={() => setGlobalToast((prev) => ({ ...prev, visible: false }))}
      />
    </>
  );
}

export default function RootNavigator() {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [isRestoring, setIsRestoring] = useState(true);

  // Setup notifications and handle taps
  useNotifications((payload: NotificationPayload) => {
    if (payload.documentId && navigationRef.isReady()) {
      // If it's a document-related notification, navigate to the reading screen
      navigationRef.navigate('MainTabs', {
        screen: 'HomeStack',
        params: {
          screen: 'Reading',
          params: { documentId: payload.documentId }
        }
      });
    }
  });

  useEffect(() => {
    const restore = async () => {
      await dispatch(restoreSession());
      setIsRestoring(false);
    };
    restore();

    // Listen for global 401s
    const subscription = DeviceEventEmitter.addListener('auth-expired', () => {
      dispatch(logout());
    });

    return () => {
      subscription.remove();
    };
  }, [dispatch]);

  if (isRestoring) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

