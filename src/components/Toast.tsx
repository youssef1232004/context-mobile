import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  visible: boolean;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onHide: () => void;
}

const VARIANT_CONFIG: Record<
  ToastVariant,
  { bg: string; border: string; icon: React.ComponentProps<typeof Ionicons>['name']; iconColor: string }
> = {
  success: { bg: 'rgba(16,185,129,0.12)', border: '#10b981', icon: 'checkmark-circle-outline', iconColor: '#10b981' },
  error:   { bg: 'rgba(239,68,68,0.12)',  border: '#ef4444', icon: 'alert-circle-outline',    iconColor: '#ef4444' },
  info:    { bg: 'rgba(99,102,241,0.12)', border: '#6366f1', icon: 'information-circle-outline', iconColor: '#6366f1' },
  warning: { bg: 'rgba(245,158,11,0.12)', border: '#f59e0b', icon: 'warning-outline',          iconColor: '#f59e0b' },
};

export function Toast({ visible, message, variant = 'info', duration = 3000, onHide }: ToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        hide();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => onHide());
  };

  if (!visible) return null;

  const config = VARIANT_CONFIG[variant];

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 12, opacity, transform: [{ translateY }] },
      ]}
    >
      <View
        style={[
          styles.toast,
          { backgroundColor: config.bg, borderColor: config.border },
        ]}
      >
        <Ionicons name={config.icon} size={20} color={config.iconColor} />
        <Text style={[styles.message, { color: '#fff' }]} numberOfLines={2}>
          {message}
        </Text>
        <TouchableOpacity onPress={hide} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={16} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
