import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../context/ThemeContext';
import { Spacing, Typography } from '../../../theme';
import { settingsService } from '../../settings/api/settingsService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppearanceSettings } from '../components/AppearanceSettings';
import { TokenBudgetCard } from '../components/TokenBudgetCard';
import { AIPreferencesCard } from '../components/AIPreferencesCard';
import { AccountStorageCard } from '../components/AccountStorageCard';
import { AboutCard } from '../components/AboutCard';

type Props = NativeStackScreenProps<any, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  
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

  const togglePersona = useCallback(async () => {
    const newPersona = persona === 'Concise' ? 'Detailed' : 'Concise';
    setPersona(newPersona);
    try {
      await settingsService.updateSettings({ aiPersona: newPersona });
    } catch (error) {
      setPersona(persona);
      Alert.alert('Error', 'Failed to update AI Persona.');
    }
  }, [persona]);

  const handleClearCache = useCallback(async () => {
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
              const token = await AsyncStorage.getItem('context_token');
              const user = await AsyncStorage.getItem('context_user');
              
              await AsyncStorage.clear();
              
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
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.xl, paddingBottom: Spacing['4xl'] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: Typography.sizes['2xl'], fontWeight: '800', color: colors.text }}>
            Settings
          </Text>
        </View>

        <AppearanceSettings />
        
        <TokenBudgetCard aiUsage={aiUsage} />
        
        <AIPreferencesCard persona={persona} onTogglePersona={togglePersona} />

        <AccountStorageCard 
          onBillingPress={() => navigation.navigate('Billing')} 
          onClearCachePress={handleClearCache} 
          loading={loading} 
        />

        <AboutCard />
      </ScrollView>
    </SafeAreaView>
  );
}
