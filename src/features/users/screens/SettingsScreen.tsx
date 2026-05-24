import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../context/ThemeContext';
import { Card } from '../../../components/Card';
import { Spacing, BorderRadius, Typography } from '../../../theme';
import { settingsService, type UserSettings } from '../api/settingsService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const { colors, isDark, mode, setMode } = useTheme();
  
  const [persona, setPersona] = useState<'Concise' | 'Detailed'>('Concise');
  const [aiUsage, setAiUsage] = useState<{
    tokensUsed: number;
    dailyLimit: number;
    remaining: number;
    monthlyUsed?: number;
    monthlyLimit?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsService.getSettings();
        if (data.aiPersona) setPersona(data.aiPersona);
        if (data.aiUsage) setAiUsage(data.aiUsage);
      } catch (error) {
        console.log('Failed to fetch settings', error);
      }
    };
    fetchSettings();
  }, []);

  const togglePersona = async () => {
    const newPersona = persona === 'Concise' ? 'Detailed' : 'Concise';
    setPersona(newPersona);
    try {
      await settingsService.updateSettings({ aiPersona: newPersona });
    } catch (error) {
      setPersona(persona); // revert on failure
      Alert.alert('Error', 'Failed to update AI Persona.');
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Local Cache',
      'This will remove temporary data and downloaded files. You will remain logged in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Preserve auth data
              const token = await AsyncStorage.getItem('context_token');
              const user = await AsyncStorage.getItem('context_user');
              
              await AsyncStorage.clear();
              
              // Restore auth data
              if (token) await AsyncStorage.setItem('context_token', token);
              if (user) await AsyncStorage.setItem('context_user', user);

              Alert.alert('Success', 'Local cache cleared successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

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

        {/* Token Budget */}
        {aiUsage && (
          <Card
            title="AI Intelligence"
            subtitle="Token Budget Overview"
            headerIcon={<Ionicons name="flash-outline" size={20} color="#f59e0b" />}
          >
            <View style={{ gap: Spacing.lg, padding: Spacing.sm }}>

              {/* ── Daily Budget ── */}
              <View style={{ gap: Spacing.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Daily Token Budget</Text>
                    <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Resets at midnight UTC</Text>
                  </View>
                  <Text style={{
                    fontSize: 16, fontWeight: '900',
                    color: (aiUsage.tokensUsed / aiUsage.dailyLimit) >= 1 ? '#ef4444' : colors.text
                  }}>
                    {Math.min(100, Math.round((aiUsage.tokensUsed / aiUsage.dailyLimit) * 100))}%
                  </Text>
                </View>
                <View style={{ height: 8, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{
                    height: '100%',
                    width: `${Math.min(100, (aiUsage.tokensUsed / aiUsage.dailyLimit) * 100)}%`,
                    backgroundColor: (aiUsage.tokensUsed / aiUsage.dailyLimit) >= 1 ? '#dc2626' : (aiUsage.tokensUsed / aiUsage.dailyLimit) > 0.75 ? '#f59e0b' : '#10b981',
                    borderRadius: 4,
                  }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{aiUsage.tokensUsed.toLocaleString()} used</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{aiUsage.remaining.toLocaleString()} remaining</Text>
                </View>
              </View>

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0' }} />

              {/* ── Monthly Budget ── */}
              {(() => {
                const monthlyUsed = aiUsage.monthlyUsed ?? 0;
                const monthlyLimit = aiUsage.monthlyLimit ?? 1500000;
                const monthlyRemaining = Math.max(0, monthlyLimit - monthlyUsed);
                const monthlyPercent = Math.min(100, Math.round((monthlyUsed / monthlyLimit) * 100));
                const isMonthlyOver = monthlyUsed >= monthlyLimit;
                return (
                  <View style={{ gap: Spacing.sm }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Monthly Token Budget</Text>
                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Resets at the start of next month</Text>
                      </View>
                      <Text style={{
                        fontSize: 16, fontWeight: '900',
                        color: isMonthlyOver ? '#ef4444' : colors.text
                      }}>
                        {monthlyPercent}%
                      </Text>
                    </View>
                    <View style={{ height: 8, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                      <View style={{
                        height: '100%',
                        width: `${monthlyPercent}%`,
                        backgroundColor: isMonthlyOver ? '#dc2626' : monthlyPercent > 75 ? '#f59e0b' : '#10b981',
                        borderRadius: 4,
                      }} />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>{monthlyUsed.toLocaleString()} used</Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>{monthlyRemaining.toLocaleString()} remaining</Text>
                    </View>
                  </View>
                );
              })()}

            </View>
          </Card>
        )}

        {/* AI Preferences */}
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
                  onValueChange={togglePersona}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              }
            />
          </View>
        </Card>

        {/* Data & Storage */}
        <Card
          title="Data & Storage"
          subtitle="Manage your local app data"
          headerIcon={<Ionicons name="server-outline" size={20} color={colors.primary} />}
        >
          <View>
            <SettingRow
              icon="trash-outline"
              label={loading ? 'Clearing...' : 'Clear Local Cache'}
              onPress={handleClearCache}
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
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
