import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Card } from '../../../components/Card';
import { Spacing, BorderRadius, Typography } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const { colors, isDark, mode, setMode } = useTheme();

  const SettingRow = ({
    icon,
    label,
    value,
    onPress,
    rightElement,
  }: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    value?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !rightElement}
      activeOpacity={onPress ? 0.7 : 1}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        gap: Spacing.md,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: Typography.sizes.base, fontWeight: '600', color: colors.text }}>
          {label}
        </Text>
      </View>
      {rightElement || (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {value && (
            <Text style={{ fontSize: Typography.sizes.sm, color: colors.textSecondary, fontWeight: '500' }}>
              {value}
            </Text>
          )}
          {onPress && <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />}
        </View>
      )}
    </TouchableOpacity>
  );

  const Divider = () => (
    <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border }} />
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.xl, paddingBottom: Spacing['4xl'] }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: Typography.sizes['2xl'], fontWeight: '800', color: colors.text }}>
            Settings
          </Text>
        </View>

        {/* Appearance */}
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
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: mode === 'light' ? colors.primary : colors.border,
                    backgroundColor: mode === 'light' ? colors.primary : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
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
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: mode === 'dark' ? colors.primary : colors.border,
                    backgroundColor: mode === 'dark' ? colors.primary : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
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
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: mode === 'system' ? colors.primary : colors.border,
                    backgroundColor: mode === 'system' ? colors.primary : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {mode === 'system' && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />}
                </TouchableOpacity>
              }
            />
          </View>
        </Card>

        {/* About */}
        <Card
          title="About"
          subtitle="App information"
          headerIcon={<Ionicons name="information-circle-outline" size={20} color={colors.primary} />}
        >
          <View>
            <SettingRow icon="code-slash-outline" label="Version" value="1.0.0" />
            <Divider />
            <SettingRow icon="server-outline" label="API Server" value={process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'N/A'} />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
