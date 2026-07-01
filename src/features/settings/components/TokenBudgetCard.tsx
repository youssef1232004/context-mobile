import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Card } from '../../../components/ui/Card';
import { Spacing } from '../../../theme';

interface TokenBudgetCardProps {
  aiUsage: {
    tokensUsed: number;
    dailyLimit: number;
    remaining: number;
    monthlyUsed?: number;
    monthlyLimit?: number;
  } | null;
}

export const TokenBudgetCard = React.memo(({ aiUsage }: TokenBudgetCardProps) => {
  const { colors, isDark } = useTheme();

  if (!aiUsage) return null;

  const monthlyUsed = aiUsage.monthlyUsed ?? 0;
  const monthlyLimit = aiUsage.monthlyLimit ?? 1500000;
  const monthlyRemaining = Math.max(0, monthlyLimit - monthlyUsed);
  const monthlyPercent = Math.min(100, Math.round((monthlyUsed / monthlyLimit) * 100));
  const isMonthlyOver = monthlyUsed >= monthlyLimit;

  return (
    <Card
      title="AI Intelligence"
      subtitle="Token Budget Overview"
      headerIcon={<Ionicons name="flash-outline" size={20} color="#f59e0b" />}
    >
      <View style={{ gap: Spacing.lg, padding: Spacing.sm }}>
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

        <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0' }} />

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
      </View>
    </Card>
  );
});
