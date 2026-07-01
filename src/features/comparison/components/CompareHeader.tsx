import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Spacing, Typography } from '../../../theme';

interface CompareHeaderProps {
  hasResult: boolean;
  onNewComparison: () => void;
  onOpenHistory: () => void;
}

export function CompareHeader({ hasResult, onNewComparison, onOpenHistory }: CompareHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm }}>
      <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.5 }}>
        AI Compare
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
        {hasResult && (
          <TouchableOpacity onPress={onNewComparison} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 }}>
            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 12 }}>New</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onOpenHistory} style={{ padding: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="time-outline" size={18} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 12 }}>History</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
