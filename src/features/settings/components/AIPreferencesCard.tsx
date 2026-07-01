import React from 'react';
import { View, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Card } from '../../../components/ui/Card';
import { SettingRow } from './SettingRow';

interface AIPreferencesCardProps {
  persona: 'Concise' | 'Detailed';
  onTogglePersona: () => void;
}

export const AIPreferencesCard = React.memo(({ persona, onTogglePersona }: AIPreferencesCardProps) => {
  const { colors } = useTheme();

  return (
    <Card
      title="AI Preferences"
      subtitle="Customize how the AI behaves"
      headerIcon={<Ionicons name="sparkles-outline" size={20} color={colors.primary} />}
    >
      <View>
        <SettingRow
          icon="chatbubbles-outline"
          label="AI Persona"
          value={persona}
          rightElement={
            <Switch
              value={persona === 'Detailed'}
              onValueChange={onTogglePersona}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          }
        />
      </View>
    </Card>
  );
});
