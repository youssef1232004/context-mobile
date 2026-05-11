import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Spacing, Typography } from '../theme';

export default function LibraryScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.lg }}>
        <Ionicons name="library-outline" size={64} color={colors.textSecondary} />
        <Text style={{ fontSize: Typography.sizes.xl, fontWeight: '700', color: colors.text }}>
          Smart Library
        </Text>
        <Text style={{ fontSize: Typography.sizes.base, color: colors.textSecondary, textAlign: 'center', fontWeight: '500' }}>
          Your document library and folder management will be available here.
        </Text>
      </View>
    </SafeAreaView>
  );
}
