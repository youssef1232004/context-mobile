import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  visible: boolean;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onHide: () => void;
}

const getVariantConfig = (variant: ToastVariant, isDark: boolean) => {
  const configs = {
    success: {
      icon: 'checkmark-circle' as const,
      iconBg: isDark ? 'rgba(16,185,129,0.2)' : '#d1fae5',
      iconColor: isDark ? '#34d399' : '#059669',
      barColor: '#10b981',
      title: 'Success',
    },
    error: {
      icon: 'alert-circle' as const,
      iconBg: isDark ? 'rgba(239,68,68,0.2)' : '#fee2e2',
      iconColor: isDark ? '#f87171' : '#dc2626',
      barColor: '#ef4444',
      title: 'Error',
    },
    info: {
      icon: 'information-circle' as const,
      iconBg: isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe',
      iconColor: isDark ? '#60a5fa' : '#2563eb',
      barColor: '#3b82f6',
      title: 'System Info',
    },
    warning: {
      icon: 'warning' as const,
      iconBg: isDark ? 'rgba(234,179,8,0.2)' : '#fef3c7',
      iconColor: isDark ? '#facc15' : '#ca8a04',
      barColor: '#eab308',
      title: 'Warning',
    },
  };
  return configs[variant];
};

export function Toast({ visible, message, variant = 'info', duration = 3000, onHide }: ToastProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(100)).current;
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const remainingTimeRef = useRef(duration);
  const [isPaused, setIsPaused] = useState(false);

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => onHide());
  };

  const startTimer = (timeToRun: number) => {
    Animated.timing(progress, {
      toValue: 0,
      duration: timeToRun,
      useNativeDriver: false,
    }).start();

    timerRef.current = setTimeout(() => {
      hide();
    }, timeToRun);
  };

  useEffect(() => {
    if (visible) {
      progress.setValue(100);
      remainingTimeRef.current = duration;
      setIsPaused(false);

      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();

      startTimer(duration);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  const handlePressIn = () => {
    setIsPaused(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    progress.stopAnimation((currentVal) => {
       remainingTimeRef.current = duration * (currentVal / 100);
    });
  };

  const handlePressOut = () => {
    setIsPaused(false);
    startTimer(remainingTimeRef.current);
  };

  if (!visible) return null;

  const config = getVariantConfig(variant, isDark);

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 12, opacity, transform: [{ translateY }] },
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.toast,
          { 
            backgroundColor: colors.surface, 
            borderColor: colors.border,
            transform: [{ scale: isPaused ? 0.98 : 1 }]
          },
        ]}
      >
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: config.iconBg }]}>
            <Ionicons name={config.icon} size={16} color={config.iconColor} />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.text }]}>{config.title}</Text>
            <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={2}>
              {message}
            </Text>
          </View>
          <TouchableOpacity onPress={hide} style={styles.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={{ height: 3, width: '100%', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
          <Animated.View 
            style={{ 
              height: 3, 
              backgroundColor: config.barColor, 
              width: progress.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] })
            }} 
          />
        </View>
      </Pressable>
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
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  message: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  closeBtn: {
    padding: 4,
    marginTop: -2,
    marginRight: -4,
    opacity: 0.7,
  }
});
