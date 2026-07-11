import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Spacing } from '../../../theme';

interface PlanFeatureRowProps {
  label: string;
  isLocked?: boolean;
}

export const PlanFeatureRow: React.FC<PlanFeatureRowProps> = ({ label, isLocked = false }) => {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
      {isLocked ? (
        <Ionicons name="lock-closed" size={14} color={colors.textSecondary} />
      ) : (
        <Ionicons name="checkmark-circle" size={14} color="#10b981" />
      )}
      <Text style={{ fontSize: 13, color: isLocked ? colors.textSecondary : colors.text, flex: 1, textDecorationLine: isLocked ? 'line-through' : 'none' }}>
        {label}
      </Text>
    </View>
  );
};
