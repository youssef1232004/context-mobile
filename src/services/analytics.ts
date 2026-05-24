import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

const SESSION_KEY = 'context_analytics_session';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

async function getOrCreateSessionId(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(SESSION_KEY);
    if (stored) {
      const { sessionId, timestamp } = JSON.parse(stored);
      if (Date.now() - timestamp < SESSION_DURATION) {
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ sessionId, timestamp: Date.now() }));
        return sessionId;
      }
    }
    
    const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ sessionId, timestamp: Date.now() }));
    return sessionId;
  } catch (e) {
    return 'fallback-session-id';
  }
}

export const analytics = {
  track: async (
    eventType: string,
    route?: string,
    metadata?: Record<string, any>,
    errorMessage?: string,
    errorStack?: string
  ) => {
    try {
      const sessionId = await getOrCreateSessionId();
      await api.post(
        '/analytics/track',
        { eventType, route, metadata, errorMessage, errorStack },
        { headers: { 'X-Session-Id': sessionId } }
      );
    } catch (error) {
      // Fail silently - telemetry should not break the app
      console.warn('[Analytics] Failed to track event:', error);
    }
  },
};
