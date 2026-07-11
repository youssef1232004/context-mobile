import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Spacing, BorderRadius, Typography } from '../../../theme';

interface AddonCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  price: string;
  onPress: () => void;
}

export const AddonCard: React.FC<AddonCardProps> = ({ icon, title, description, price, onPress }) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={{
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#fff',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm }}>
        <View style={{
          width: 40, height: 40, borderRadius: 20,
          backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.05)',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: Typography.sizes.base, fontWeight: '700', color: colors.text }}>{title}</Text>
          <Text style={{ fontSize: Typography.sizes.sm, color: colors.textSecondary }}>{price}</Text>
        </View>
      </View>
      <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: Spacing.md, lineHeight: 20 }}>
        {description}
      </Text>
      <TouchableOpacity
        onPress={onPress}
        style={{
          backgroundColor: isDark ? '#333' : '#f3f4f6',
          paddingVertical: 10,
          borderRadius: 8,
          alignItems: 'center'
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Add to Plan</Text>
      </TouchableOpacity>
    </View>
  );
};
