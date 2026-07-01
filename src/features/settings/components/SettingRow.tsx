import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Spacing, Typography } from '../../../theme';

interface SettingRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

export const SettingRow = React.memo(({ icon, label, value, onPress, rightElement }: SettingRowProps) => {
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !rightElement}
      activeOpacity={onPress ? 0.7 : 1}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        gap: Spacing.md,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: Typography.sizes.base, fontWeight: '600', color: colors.text }}>
          {label}
        </Text>
      </View>
      {rightElement || (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {value && (
            <Text style={{ fontSize: Typography.sizes.sm, color: colors.textSecondary, fontWeight: '500' }}>
              {value}
            </Text>
          )}
          {onPress && <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />}
        </View>
      )}
    </TouchableOpacity>
  );
});

export const Divider = React.memo(() => {
  const { colors, isDark } = useTheme();
  return <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border }} />;
});
