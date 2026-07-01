import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Spacing, Typography } from '../../../theme';

interface NodeStatusCardProps {
  user: any;
}

export const NodeStatusCard = React.memo(({ user }: NodeStatusCardProps) => {
  const { colors, isDark } = useTheme();

  return (
    <Card
      title="Node Status"
      subtitle="Your current system configuration"
      headerIcon={<Ionicons name="pulse-outline" size={20} color={colors.primary} />}
    >
      <View style={{ gap: Spacing.md }}>
        {[
          { label: 'Username', value: `@${user?.username || '—'}` },
          { label: 'Persona', badge: user?.persona || 'general' },
          { label: 'Email', value: user?.email || '—' },
        ].map((row, i) => (
          <View key={row.label}>
            {i > 0 && <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border, marginBottom: Spacing.md }} />}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: Typography.sizes.base, fontWeight: '600', color: colors.textSecondary }}>{row.label}</Text>
              {row.badge ? (
                <Badge label={row.badge} variant="primary" />
              ) : (
                <Text style={{ fontSize: row.label === 'Email' ? Typography.sizes.sm : Typography.sizes.base, fontWeight: '700', color: colors.text }}>{row.value}</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
});
