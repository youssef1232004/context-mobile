import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Card } from '../../../components/ui/Card';
import { Spacing, Typography } from '../../../theme';
import { type PlanId, type BillingCycle, getPlanDetails } from '../constants/plans';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'Billing'>;

export default function BillingScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  
  // Note: Since this is read-only for now, we just mock the active plan.
  // In a real app, this would come from Redux or userService.
  const [activePlan] = useState<PlanId>('startup');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(activePlan);

  const planDetails = getPlanDetails(selectedPlan, billingCycle);

  const handleUpgradePress = () => {
    Alert.alert('Read Only', 'Managing billing and payments is currently only supported on the web version.');
  };

  const renderPlanCard = (planId: PlanId, title: string, monthlyPrice: number, annualPrice: number) => {
    const isSelected = selectedPlan === planId;
    const price = billingCycle === 'annual' ? annualPrice : monthlyPrice;
    
    return (
      <TouchableOpacity
        onPress={() => setSelectedPlan(planId)}
        style={{
          borderWidth: 2,
          borderColor: isSelected ? colors.primary : colors.border,
          borderRadius: 12,
          padding: Spacing.md,
          backgroundColor: isSelected ? (isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)') : 'transparent',
          flex: 1,
          alignItems: 'center',
          opacity: planId === 'embed' ? 0.5 : 1,
        }}
      >
        <Text style={{ fontSize: Typography.sizes.base, fontWeight: '700', color: colors.text }}>{title}</Text>
        <Text style={{ fontSize: Typography.sizes.xl, fontWeight: '800', color: colors.text, marginTop: Spacing.sm }}>
          {price === 0 ? 'Free' : `${price} EGP`}
        </Text>
        <Text style={{ fontSize: Typography.sizes.xs, color: colors.textSecondary, marginTop: 4 }}>
          {price === 0 ? 'Forever' : `/ month`}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.xl, paddingBottom: Spacing['4xl'] }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: Typography.sizes['2xl'], fontWeight: '800', color: colors.text }}>
            Plan & Billing
          </Text>
        </View>

        {/* Current Plan Overview */}
        <Card>
          <View style={{ alignItems: 'center', paddingVertical: Spacing.md }}>
            <View style={{
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#e0e7ff',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              marginBottom: Spacing.md
            }}>
              <Text style={{ color: colors.primary, fontWeight: '700', textTransform: 'uppercase', fontSize: 12 }}>
                Current Plan
              </Text>
            </View>
            <Text style={{ fontSize: Typography.sizes['2xl'], fontWeight: '800', color: colors.text }}>
              {activePlan.charAt(0).toUpperCase() + activePlan.slice(1)}
            </Text>
            <Text style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>
              Your workspace is currently on the {activePlan} plan.
            </Text>
          </View>
        </Card>

        {/* Billing Cycle Toggle */}
        <View style={{ flexDirection: 'row', backgroundColor: colors.border, padding: 4, borderRadius: 8, alignSelf: 'center' }}>
          <TouchableOpacity
            onPress={() => setBillingCycle('monthly')}
            style={{
              paddingVertical: 6, paddingHorizontal: 16,
              backgroundColor: billingCycle === 'monthly' ? (isDark ? '#333' : '#fff') : 'transparent',
              borderRadius: 6,
              shadowColor: billingCycle === 'monthly' ? '#000' : 'transparent',
              shadowOpacity: 0.1, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }
            }}
          >
            <Text style={{ fontWeight: billingCycle === 'monthly' ? '700' : '500', color: colors.text }}>Monthly</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setBillingCycle('annual')}
            style={{
              paddingVertical: 6, paddingHorizontal: 16,
              backgroundColor: billingCycle === 'annual' ? (isDark ? '#333' : '#fff') : 'transparent',
              borderRadius: 6,
              shadowColor: billingCycle === 'annual' ? '#000' : 'transparent',
              shadowOpacity: 0.1, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }
            }}
          >
            <Text style={{ fontWeight: billingCycle === 'annual' ? '700' : '500', color: colors.text }}>Annually (-20%)</Text>
          </TouchableOpacity>
        </View>

        {/* Plans Grid */}
        <View style={{ flexDirection: 'row', gap: Spacing.md }}>
          {renderPlanCard('sandbox', 'Sandbox', 0, 0)}
          {renderPlanCard('startup', 'Startup', 1900, 1520)}
        </View>
        <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: -8 }}>
          {renderPlanCard('growth', 'Growth', 4800, 3600)}
          {renderPlanCard('embed', 'Embed', 0, 0)}
        </View>

        {/* Plan Details */}
        <Card title="Plan Features" headerIcon={<Ionicons name="list-outline" size={20} color={colors.primary} />}>
          <View style={{ gap: Spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.text }}>Base Documents</Text>
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                {planDetails.baseDocs === Infinity ? 'Unlimited' : planDetails.baseDocs}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.text }}>Base AI Tokens</Text>
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                {planDetails.baseTokens === Infinity ? 'Unlimited' : (planDetails.baseTokens / 1000).toLocaleString() + 'K'}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.text }}>Document Overage Rate</Text>
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                {planDetails.hasDocOverage ? `${planDetails.docRate} EGP / doc` : 'N/A'}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.text }}>Token Overage Rate</Text>
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                {planDetails.hasTokenOverage ? `${planDetails.tokenRatePer100k} EGP / 100K` : 'N/A'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Upgrade Button */}
        <TouchableOpacity
          onPress={handleUpgradePress}
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 14,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: Spacing.sm,
            opacity: activePlan === selectedPlan ? 0.5 : 1
          }}
          disabled={activePlan === selectedPlan}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
            {activePlan === selectedPlan ? 'Current Plan' : 'Manage on Web to Upgrade'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
