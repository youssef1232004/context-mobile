import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter = React.memo(({ password }: PasswordStrengthMeterProps) => {
  const { colors, isDark } = useTheme();

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length > 0) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    return score;
  };

  const strengthScore = getPasswordStrength(password);

  const getBarColor = (barIndex: number) => {
    if (strengthScore >= barIndex) {
      if (strengthScore === 1) return '#ef4444';
      if (strengthScore === 2) return '#f97316';
      if (strengthScore === 3) return '#eab308';
      if (strengthScore === 4) return '#22c55e';
    }
    return isDark ? 'rgba(255,255,255,0.1)' : colors.border;
  };

  return (
    <>
      {/* Strength Meter */}
      <View style={{ flexDirection: 'row', gap: 4, marginTop: 6, paddingHorizontal: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: getBarColor(i),
            }}
          />
        ))}
      </View>
      
      {/* Criteria Checklist */}
      <View style={{ marginTop: 12, gap: 6, paddingHorizontal: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons
            name={password.length >= 8 ? "checkmark-circle" : "radio-button-off"}
            size={14}
            color={password.length >= 8 ? "#10b981" : colors.textSecondary}
          />
          <Text style={{ fontSize: 13, color: password.length >= 8 ? "#10b981" : colors.textSecondary }}>At least 8 characters</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons
            name={/[A-Z]/.test(password) ? "checkmark-circle" : "radio-button-off"}
            size={14}
            color={/[A-Z]/.test(password) ? "#10b981" : colors.textSecondary}
          />
          <Text style={{ fontSize: 13, color: /[A-Z]/.test(password) ? "#10b981" : colors.textSecondary }}>At least 1 uppercase letter</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons
            name={/[0-9]/.test(password) ? "checkmark-circle" : "radio-button-off"}
            size={14}
            color={/[0-9]/.test(password) ? "#10b981" : colors.textSecondary}
          />
          <Text style={{ fontSize: 13, color: /[0-9]/.test(password) ? "#10b981" : colors.textSecondary }}>At least 1 number</Text>
        </View>
      </View>
    </>
  );
});
