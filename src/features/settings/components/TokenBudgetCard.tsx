import React, { useState, useEffect } from 'react';
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
    resetAt?: string;
    dailyTotalUsed?: number;
    dailyTotalLimit?: number;
    monthlyUsed?: number;
    monthlyLimit?: number;
  } | null;
}

export const TokenBudgetCard = React.memo(({ aiUsage }: TokenBudgetCardProps) => {
  const { colors, isDark } = useTheme();
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');

  useEffect(() => {
    if (!aiUsage?.resetAt) {
      setTimeUntilReset('');
      return;
    }

    // Calculate the target reset time once when the effect runs
    let resetTime = Date.parse(aiUsage.resetAt!);
    if (isNaN(resetTime)) {
      resetTime = new Date(aiUsage.resetAt!.replace(/-/g, '/').replace('T', ' ')).getTime();
    }
    
    // If still invalid, default to 8 hours from now
    if (isNaN(resetTime)) {
      resetTime = Date.now() + 8 * 60 * 60 * 1000;
    }

    const calculateTimeLeft = () => {
      const now = Date.now();
      const difference = resetTime - now;

      if (difference <= 0) {
        setTimeUntilReset(() => '00:00:00');
        return;
      }

      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeUntilReset(() => 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [aiUsage?.resetAt]);

  if (!aiUsage) return null;

  // 8-Hour Block
  const blockUsed = aiUsage.tokensUsed || 0;
  const blockLimit = aiUsage.dailyLimit || 1; // prevent div by zero
  const blockRemaining = aiUsage.remaining || 0;
  const blockPercent = Math.min(100, Math.round((blockUsed / blockLimit) * 100));
  const isBlockOver = blockUsed >= blockLimit;

  // Daily Total
  const dailyTotalUsed = aiUsage.dailyTotalUsed ?? 0;
  const dailyTotalLimit = aiUsage.dailyTotalLimit ?? (blockLimit * 3); // 3 blocks per day
  const dailyTotalRemaining = Math.max(0, dailyTotalLimit - dailyTotalUsed);
  const dailyTotalPercent = Math.min(100, Math.round((dailyTotalUsed / dailyTotalLimit) * 100));
  const isDailyOver = dailyTotalUsed >= dailyTotalLimit;

  // Monthly Total
  const monthlyUsed = aiUsage.monthlyUsed ?? 0;
  const monthlyLimit = aiUsage.monthlyLimit ?? 1500000;
  const monthlyRemaining = Math.max(0, monthlyLimit - monthlyUsed);
  const monthlyPercent = Math.min(100, Math.round((monthlyUsed / monthlyLimit) * 100));
  const isMonthlyOver = monthlyUsed >= monthlyLimit;

  const renderProgressBar = (percent: number, isOver: boolean) => (
    <View style={{ height: 8, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
      <View style={{
        height: '100%',
        width: `${percent}%`,
        backgroundColor: isOver ? '#dc2626' : percent > 75 ? '#f59e0b' : '#10b981',
        borderRadius: 4,
      }} />
    </View>
  );

  return (
    <Card
      title="AI Intelligence"
      subtitle="Token Budget Overview"
      headerIcon={<Ionicons name="flash-outline" size={20} color="#f59e0b" />}
    >
      <View style={{ gap: Spacing.xl, padding: Spacing.sm }}>
        
        {/* 8-Hour Block */}
        <View style={{ gap: Spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>8-Hour Block Allowance</Text>
              {timeUntilReset ? (
                <Text style={{ fontSize: 12, color: colors.primary, marginTop: 2, fontWeight: '600' }}>
                  Resets in <Ionicons name="time-outline" size={12} /> {timeUntilReset}
                </Text>
              ) : (
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Resets every 8 hours</Text>
              )}
            </View>
            <Text style={{ fontSize: 16, fontWeight: '900', color: isBlockOver ? '#ef4444' : colors.text }}>
              {blockPercent}%
            </Text>
          </View>
          {isBlockOver && (
            <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 8, borderRadius: 6, marginBottom: 4 }}>
              <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '600' }}>
                <Ionicons name="warning" size={12} /> You've reached your 8-hour limit.
              </Text>
            </View>
          )}
          {renderProgressBar(blockPercent, isBlockOver)}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{blockUsed.toLocaleString()} used</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{blockRemaining.toLocaleString()} remaining</Text>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0' }} />

        {/* Daily Total */}
        <View style={{ gap: Spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Daily Total Allowance</Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Resets at midnight UTC</Text>
            </View>
            <Text style={{ fontSize: 16, fontWeight: '900', color: isDailyOver ? '#ef4444' : colors.text }}>
              {dailyTotalPercent}%
            </Text>
          </View>
          {renderProgressBar(dailyTotalPercent, isDailyOver)}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{dailyTotalUsed.toLocaleString()} used</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{dailyTotalRemaining.toLocaleString()} remaining</Text>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0' }} />

        {/* Monthly Budget */}
        <View style={{ gap: Spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Monthly Token Budget</Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Resets at start of month</Text>
            </View>
            <Text style={{ fontSize: 16, fontWeight: '900', color: isMonthlyOver ? '#ef4444' : colors.text }}>
              {monthlyPercent}%
            </Text>
          </View>
          {renderProgressBar(monthlyPercent, isMonthlyOver)}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{monthlyUsed.toLocaleString()} used</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{monthlyRemaining.toLocaleString()} remaining</Text>
          </View>
        </View>

      </View>
    </Card>
  );
});
