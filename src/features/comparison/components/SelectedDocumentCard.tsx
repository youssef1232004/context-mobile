import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Spacing, Typography, BorderRadius } from '../../../theme';

interface SelectedDocumentCardProps {
  document: any;
}

export function SelectedDocumentCard({ document }: SelectedDocumentCardProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.surface,
    }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#eef2ff', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="document-text" size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: Typography.sizes.base, fontWeight: '600', color: colors.text }} numberOfLines={1}>{document.title}</Text>
      </View>
    </View>
  );
}
