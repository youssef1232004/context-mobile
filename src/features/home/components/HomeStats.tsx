import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Card } from '../../../components/ui/Card';
import { Spacing, Typography } from '../../../theme';

interface HomeStatsProps {
  totalDocs: number;
  folderCount: number;
  loading: boolean;
}

export const HomeStats = React.memo(({ totalDocs, folderCount, loading }: HomeStatsProps) => {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: 'row', gap: Spacing.md }}>
      {[
        { icon: 'document-text-outline' as const, count: totalDocs, label: 'Documents', color: colors.primary },
        { icon: 'folder-outline' as const, count: folderCount, label: 'Folders', color: '#f59e0b' },
      ].map((s) => (
        <Card key={s.label} style={{ flex: 1 }}>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${s.color}18`, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={s.icon} size={24} color={s.color} />
            </View>
            <Text style={{ fontFamily: Typography.families.mono, fontSize: Typography.sizes['2xl'], fontWeight: '800', color: colors.text }}>
              {loading ? '–' : s.count}
            </Text>
            <Text style={{ fontFamily: Typography.families.mono, fontSize: Typography.sizes.xs, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</Text>
          </View>
        </Card>
      ))}
    </View>
  );
});
