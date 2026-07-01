import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Card } from '../../../components/ui/Card';
import { Spacing, Typography } from '../../../theme';

interface DeltaSectionProps {
  title: string;
  items: string[];
  accentColor: string;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
}

export function DeltaSection({ title, items, accentColor, iconName }: DeltaSectionProps) {
  const { colors } = useTheme();

  return (
    <Card
      title={title}
      headerIcon={<Ionicons name={iconName} size={18} color={accentColor} />}
    >
      <View style={{ gap: Spacing.sm }}>
        {items.length === 0 ? (
          <Text style={{ fontSize: Typography.sizes.sm, color: colors.textSecondary, fontStyle: 'italic' }}>None found.</Text>
        ) : items.map((item: string, i: number) => (
          <View key={i} style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }}>
            <Ionicons name="ellipse" size={6} color={accentColor} style={{ marginTop: 7 }} />
            <Text style={{ flex: 1, fontSize: Typography.sizes.sm, color: colors.text, lineHeight: 20 }}>{item}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
