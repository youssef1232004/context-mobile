import React, { ReactNode } from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { BorderRadius, Spacing } from '../theme';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerIcon?: ReactNode;
  headerVariant?: 'default' | 'destructive';
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  headerIcon,
  headerVariant = 'default',
  style,
}) => {
  const { colors, isDark } = useTheme();

  const headerBg =
    headerVariant === 'destructive'
      ? isDark
        ? 'rgba(239, 68, 68, 0.05)'
        : 'rgba(239, 68, 68, 0.04)'
      : isDark
      ? 'rgba(18, 18, 20, 0.5)'
      : 'rgba(248, 249, 250, 0.5)';

  const titleColor =
    headerVariant === 'destructive'
      ? isDark
        ? '#ef4444'
        : '#dc2626'
      : colors.primary;

  return (
    <View
      style={[
        {
          backgroundColor: colors.cardBg,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border,
          borderRadius: BorderRadius.xl,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {title && (
        <View
          style={{
            backgroundColor: headerBg,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border,
            paddingHorizontal: Spacing.xl,
            paddingVertical: Spacing.lg,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {headerIcon}
            <Text
              style={{
                fontSize: 17,
                fontWeight: '700',
                color: titleColor,
              }}
            >
              {title}
            </Text>
          </View>
          {subtitle && (
            <Text
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                marginTop: 6,
                fontWeight: '500',
              }}
            >
              {subtitle}
            </Text>
          )}
        </View>
      )}
      <View style={{ padding: Spacing.xl }}>{children}</View>
    </View>
  );
};
