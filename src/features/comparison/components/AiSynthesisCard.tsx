import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Spacing, Typography, BorderRadius } from '../../../theme';

interface AiSynthesisCardProps {
  synthesis: string;
  similarityPercentage?: number;
}

export function AiSynthesisCard({ synthesis, similarityPercentage }: AiSynthesisCardProps) {
  const { colors, isDark } = useTheme();

  if (!synthesis) return null;

  return (
    <View style={{
      backgroundColor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)',
      borderRadius: BorderRadius.xl, borderWidth: 1,
      borderColor: isDark ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.2)',
      padding: Spacing.lg, gap: Spacing.md,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="sparkles" size={16} color={isDark ? '#000' : '#fff'} />
        </View>
        <Text style={{ fontSize: Typography.sizes.lg, fontWeight: '800', color: colors.text }}>AI Synthesis</Text>
      </View>

      <Text style={{ fontSize: Typography.sizes.sm, color: colors.text, lineHeight: 22 }}>
        {synthesis}
      </Text>

      {similarityPercentage !== undefined && (
        <View style={{ flexDirection: 'row', marginTop: Spacing.xs }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)',
            borderRadius: BorderRadius.lg, borderWidth: 1,
            borderColor: isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)',
            paddingHorizontal: 10, paddingVertical: 5,
          }}>
            <Ionicons name="analytics-outline" size={14} color={colors.primary} />
            <Text style={{ fontSize: 12, fontWeight: '800', fontFamily: 'monospace', color: colors.primary }}>
              Similarity: {similarityPercentage}%
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
