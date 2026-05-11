import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { BorderRadius, Typography } from '../theme';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  style,
}) => {
  const { colors, isDark } = useTheme();

  const colorMap = {
    primary: { bg: `${colors.primary}20`, text: colors.primary },
    success: { bg: isDark ? 'rgba(74,222,128,0.15)' : 'rgba(34,197,94,0.1)', text: colors.success },
    warning: { bg: isDark ? 'rgba(251,191,36,0.15)' : 'rgba(245,158,11,0.1)', text: colors.warning },
    error: { bg: isDark ? 'rgba(248,113,113,0.15)' : 'rgba(239,68,68,0.1)', text: colors.error },
    neutral: { bg: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', text: colors.textSecondary },
  };

  const c = colorMap[variant];

  return (
    <View
      style={[
        {
          backgroundColor: c.bg,
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
