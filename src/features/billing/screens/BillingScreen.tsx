import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Card } from '../../../components/ui/Card';
import { Spacing, Typography, BorderRadius } from '../../../theme';
import { type PlanId, type BillingCycle, getPlanDetails } from '../constants/plans';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PlanFeatureRow } from '../components/PlanFeatureRow';
import { AddonCard } from '../components/AddonCard';

type Props = NativeStackScreenProps<any, 'Billing'>;

const { width } = Dimensions.get('window');

export default function BillingScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  
  // Note: Since this is read-only for now, we just mock the active plan.
  // In a real app, this would come from Redux or userService.
  const [activePlan] = useState<PlanId>('startup');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const handleManageWeb = () => {
    Linking.openURL('https://context-mvp.com/billing');
  };

  const getPlanBadge = (planId: PlanId) => {
    switch (planId) {
      case 'sandbox': return null;
      case 'startup': return { text: 'Free embed', color: '#10b981' };
      case 'growth': return { text: 'Most Adopted', color: '#8b5cf6' };
      case 'embed': return { text: 'Scale', color: '#f59e0b' };
    }
  };

  const renderPlanCard = (planId: PlanId, title: string, monthlyPrice: number, annualPrice: number, features: { label: string, locked?: boolean }[]) => {
    const isCurrent = activePlan === planId;
    const price = billingCycle === 'annual' ? annualPrice : monthlyPrice;
    const badge = getPlanBadge(planId);
    
    return (
      <View
        style={{
          borderWidth: isCurrent ? 2 : 1,
          borderColor: isCurrent ? colors.primary : (isDark ? 'rgba(255,255,255,0.1)' : colors.border),
          borderRadius: 16,
          padding: Spacing.xl,
          backgroundColor: isCurrent ? (isDark ? 'rgba(99, 102, 241, 0.05)' : '#fff') : (isDark ? '#0A0A0C' : '#fafafa'),
          width: width * 0.75,
          marginRight: Spacing.md,
        }}
      >
        {badge && (
          <View style={{ alignSelf: 'flex-start', backgroundColor: `${badge.color}20`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 12 }}>
            <Text style={{ color: badge.color, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>{badge.text}</Text>
          </View>
        )}
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{title}</Text>
        <Text style={{ fontSize: 32, fontWeight: '900', color: colors.text, marginTop: Spacing.sm }}>
          {price === 0 ? 'Free' : `${price.toLocaleString()} `}
          {price > 0 && <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textSecondary }}>EGP</Text>}
        </Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: Spacing.xl }}>
          {price === 0 ? 'Forever' : `/ month`}
        </Text>

        <TouchableOpacity
          onPress={handleManageWeb}
          style={{
            backgroundColor: isCurrent ? 'transparent' : colors.primary,
            borderWidth: isCurrent ? 1 : 0,
            borderColor: colors.primary,
            paddingVertical: 12,
            borderRadius: 8,
            alignItems: 'center',
            marginBottom: Spacing.xl
          }}
        >
          <Text style={{ color: isCurrent ? colors.primary : '#fff', fontSize: 15, fontWeight: '700' }}>
            {isCurrent ? 'Current Plan' : 'Manage on Web'}
          </Text>
        </TouchableOpacity>

        <View style={{ gap: Spacing.md }}>
          {features.map((f, i) => (
            <PlanFeatureRow key={i} label={f.label} isLocked={f.locked} />
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: Typography.sizes['2xl'], fontWeight: '800', color: colors.text }}>
          Plans & Billing
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: Spacing['4xl'] }}>
        
        {/* Billing Cycle Toggle */}
        <View style={{ flexDirection: 'row', backgroundColor: isDark ? '#1e1e22' : colors.border, padding: 4, borderRadius: 8, alignSelf: 'center', marginBottom: Spacing.xl }}>
          <TouchableOpacity
            onPress={() => setBillingCycle('monthly')}
            style={{
              paddingVertical: 8, paddingHorizontal: 20,
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
              paddingVertical: 8, paddingHorizontal: 20,
              backgroundColor: billingCycle === 'annual' ? (isDark ? '#333' : '#fff') : 'transparent',
              borderRadius: 6,
              shadowColor: billingCycle === 'annual' ? '#000' : 'transparent',
              shadowOpacity: 0.1, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }
            }}
          >
            <Text style={{ fontWeight: billingCycle === 'annual' ? '700' : '500', color: colors.text }}>Annually <Text style={{ color: '#10b981' }}>(-20%)</Text></Text>
          </TouchableOpacity>
        </View>

        {/* Plans Horizontal Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl }}>
          {renderPlanCard('sandbox', 'Sandbox', 0, 0, [
            { label: '50 Documents' },
            { label: '100K AI Tokens / month' },
            { label: 'Standard Models' },
            { label: 'Document Re-Organization' },
            { label: 'Basic Support', locked: true },
          ])}
          {renderPlanCard('startup', 'Startup', 1900, 1520, [
            { label: '5,000 Documents' },
            { label: '2M AI Tokens / month' },
            { label: 'Premium Models (GPT-4o, Claude 3.5)' },
            { label: 'Document Re-Organization' },
            { label: 'Free Embed add-on' },
          ])}
          {renderPlanCard('growth', 'Growth', 4800, 3600, [
            { label: '25,000 Documents' },
            { label: '8M AI Tokens / month' },
            { label: 'Premium Models (GPT-4o, Claude 3.5)' },
            { label: 'Document Re-Organization' },
            { label: 'Priority Support' },
          ])}
          {renderPlanCard('embed', 'Embed', 2500, 2000, [
            { label: '10,000 Embed Documents' },
            { label: 'Unlimited Website Embeds' },
            { label: 'Analytics Dashboard' },
            { label: 'Custom Branding' },
            { label: 'API Access' },
          ])}
        </ScrollView>

        <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border, marginVertical: Spacing.xl, marginHorizontal: Spacing.xl }} />

        {/* Add-ons Section */}
        <View style={{ paddingHorizontal: Spacing.xl }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: Spacing.sm }}>
            Add-ons
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: Spacing.xl }}>
            Scale your workspace resources as you grow without upgrading your entire plan.
          </Text>

          <View style={{ gap: Spacing.md }}>
            <AddonCard
              icon="document-text-outline"
              title="Extra Documents"
              description="Add more document capacity to your workspace for file storage and organization."
              price="200 EGP / 1,000 Docs"
              onPress={handleManageWeb}
            />
            <AddonCard
              icon="flash-outline"
              title="Extra Tokens"
              description="Get additional AI tokens to use for chatting, analysis, and generation."
              price="150 EGP / 500K Tokens"
              onPress={handleManageWeb}
            />
            <AddonCard
              icon="server-outline"
              title="High-Speed Storage"
              description="Upgrade to NVMe SSD storage for lightning-fast document retrieval."
              price="500 EGP / Month"
              onPress={handleManageWeb}
            />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
