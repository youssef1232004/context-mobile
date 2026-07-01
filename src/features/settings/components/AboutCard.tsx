import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Card } from '../../../components/ui/Card';
import { SettingRow } from './SettingRow';

export const AboutCard = React.memo(() => {
  const { colors } = useTheme();

  return (
    <Card
      title="About"
      subtitle="App information"
      headerIcon={<Ionicons name="information-circle-outline" size={20} color={colors.primary} />}
    >
      <View>
        <SettingRow icon="code-slash-outline" label="Version" value="1.0.0" />
      </View>
    </Card>
  );
});
