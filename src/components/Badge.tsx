import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { BorderRadius, Typography } from '../theme';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'outline';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  style,
}) => {
  const { colors, isDark } = useTheme();

  const colorMap = {
    primary: { bg: `${colors.primary}20`, text: colors.primary, border: 'transparent' },
    success: { bg: isDark ? 'rgba(74,222,128,0.15)' : 'rgba(34,197,94,0.1)', text: colors.success, border: 'transparent' },
    warning: { bg: isDark ? 'rgba(251,191,36,0.15)' : 'rgba(245,158,11,0.1)', text: colors.warning, border: 'transparent' },
    error: { bg: isDark ? 'rgba(248,113,113,0.15)' : 'rgba(239,68,68,0.1)', text: colors.error, border: 'transparent' },
    neutral: { bg: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', text: colors.textSecondary, border: 'transparent' },
    outline: { bg: 'transparent', text: colors.textSecondary, border: isDark ? 'rgba(255,255,255,0.2)' : colors.border },
  };

  const c = colorMap[variant];

  return (
    <View
      style={[
        {
          backgroundColor: c.bg,
          borderWidth: c.border === 'transparent' ? 0 : 1,
          borderColor: c.border,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: BorderRadius.full,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text
        style={{
          fontSize: Typography.sizes.xs,
          fontWeight: Typography.weights.bold,
          color: c.text,
          textTransform: 'capitalize',
        }}
      >
        {label}
      </Text>
    </View>
  );
};
