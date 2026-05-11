import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAppSelector } from '../store/hooks';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Spacing, Typography } from '../theme';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAppSelector((state) => state.auth);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.xl }}>
        {/* Greeting Header */}
        <View>
          <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Dashboard
          </Text>
          <Text style={{ fontSize: Typography.sizes['3xl'], fontWeight: '800', color: colors.text, marginTop: 4 }}>
            Welcome back,{'\n'}
            <Text style={{ color: colors.primary }}>{user?.fullName || 'User'}</Text>
          </Text>
        </View>

        {/* Stats Row */}
        <View style={{ flexDirection: 'row', gap: Spacing.md }}>
          <Card style={{ flex: 1 }}>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Ionicons name="document-text-outline" size={28} color={colors.primary} />
              <Text style={{ fontSize: Typography.sizes['2xl'], fontWeight: '800', color: colors.text }}>0</Text>
              <Text style={{ fontSize: Typography.sizes.xs, fontWeight: '600', color: colors.textSecondary }}>Documents</Text>
            </View>
          </Card>
          <Card style={{ flex: 1 }}>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Ionicons name="folder-outline" size={28} color={colors.primary} />
              <Text style={{ fontSize: Typography.sizes['2xl'], fontWeight: '800', color: colors.text }}>0</Text>
              <Text style={{ fontSize: Typography.sizes.xs, fontWeight: '600', color: colors.textSecondary }}>Folders</Text>
            </View>
          </Card>
        </View>

        {/* User Info Card */}
        <Card
          title="Node Status"
          subtitle="Your current system configuration"
          headerIcon={<Ionicons name="pulse-outline" size={20} color={colors.primary} />}
        >
          <View style={{ gap: Spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: Typography.sizes.base, fontWeight: '600', color: colors.textSecondary }}>Username</Text>
              <Text style={{ fontSize: Typography.sizes.base, fontWeight: '700', color: colors.text }}>@{user?.username}</Text>
            </View>
            <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: Typography.sizes.base, fontWeight: '600', color: colors.textSecondary }}>Persona</Text>
              <Badge label={user?.persona || 'general'} variant="primary" />
            </View>
            <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: Typography.sizes.base, fontWeight: '600', color: colors.textSecondary }}>Email</Text>
              <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '600', color: colors.text }}>{user?.email}</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
