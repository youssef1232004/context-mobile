import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { BorderRadius } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'destructive';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const { colors, isDark } = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: BorderRadius.lg,
      gap: 8,
      ...(fullWidth && { width: '100%' }),
    };

    switch (variant) {
      case 'primary':
        return {
          ...base,
          backgroundColor: colors.primary,
        };
      case 'outline':
        return {
          ...base,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'ghost':
        return {
          ...base,
          backgroundColor: 'transparent',
        };
      case 'destructive':
        return {
          ...base,
          backgroundColor: '#dc2626',
        };
      default:
        return base;
    }
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontSize: 15,
      fontWeight: '700',
    };

    switch (variant) {
      case 'primary':
        return { ...base, color: isDark ? '#000000' : '#ffffff' };
      case 'outline':
        return { ...base, color: colors.text };
      case 'ghost':
        return { ...base, color: colors.primary };
      case 'destructive':
        return { ...base, color: '#ffffff' };
      default:
        return base;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[getButtonStyle(), disabled && { opacity: 0.5 }, style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? (isDark ? '#000' : '#fff') : colors.primary}
        />
      ) : (
        <>
          {icon}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};
