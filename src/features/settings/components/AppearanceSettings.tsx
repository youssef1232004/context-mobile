import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Card } from '../../../components/ui/Card';
import { SettingRow, Divider } from './SettingRow';

export const AppearanceSettings = React.memo(() => {
  const { colors, mode, setMode } = useTheme();

  return (
    <Card
      title="Appearance"
      subtitle="Customize the look and feel of your app"
      headerIcon={<Ionicons name="color-palette-outline" size={20} color={colors.primary} />}
    >
      <View>
        <SettingRow
          icon="sunny-outline"
          label="Light Mode"
          rightElement={
            <TouchableOpacity
              onPress={() => setMode('light')}
              style={{
                width: 22, height: 22, borderRadius: 11, borderWidth: 2,
                borderColor: mode === 'light' ? colors.primary : colors.border,
                backgroundColor: mode === 'light' ? colors.primary : 'transparent',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {mode === 'light' && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />}
            </TouchableOpacity>
          }
        />
        <Divider />
        <SettingRow
          icon="moon-outline"
          label="Dark Mode"
          rightElement={
            <TouchableOpacity
              onPress={() => setMode('dark')}
              style={{
                width: 22, height: 22, borderRadius: 11, borderWidth: 2,
                borderColor: mode === 'dark' ? colors.primary : colors.border,
                backgroundColor: mode === 'dark' ? colors.primary : 'transparent',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {mode === 'dark' && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />}
            </TouchableOpacity>
          }
        />
        <Divider />
        <SettingRow
          icon="phone-portrait-outline"
          label="System Default"
          rightElement={
            <TouchableOpacity
              onPress={() => setMode('system')}
              style={{
                width: 22, height: 22, borderRadius: 11, borderWidth: 2,
                borderColor: mode === 'system' ? colors.primary : colors.border,
                backgroundColor: mode === 'system' ? colors.primary : 'transparent',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {mode === 'system' && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />}
            </TouchableOpacity>
          }
        />
      </View>
    </Card>
  );
});
