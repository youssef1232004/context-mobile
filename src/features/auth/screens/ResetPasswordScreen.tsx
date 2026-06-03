import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { GradientLine } from '../../../components/GradientLine';
import { authService } from '../api/authService';
import { Spacing, BorderRadius, Typography } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'ResetPassword'>;

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const { colors, isDark } = useTheme();

  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localErrors, setLocalErrors] = useState<{ token?: string; password?: string; confirm?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const validate = (): boolean => {
    const errors: { token?: string; password?: string; confirm?: string } = {};
    if (!token) errors.token = 'Recovery code is required';
    if (!password) errors.password = 'New Access Key is required';
    else if (password.length < 8) errors.password = 'Access Key must be at least 8 characters';
    if (password !== confirmPassword) errors.confirm = 'Access keys do not match';
    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleReset = async () => {
    if (!validate()) return;
    setError(null);
    setIsLoading(true);
    try {
      await authService.resetPassword(token, password);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to reset access key.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            padding: Spacing.xl,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ position: 'absolute', top: Spacing.xl, left: Spacing.xl, zIndex: 10, padding: 8 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          {/* Card */}
          <View
            style={{
              backgroundColor: isDark ? 'rgba(24,24,27,0.8)' : 'rgba(255,255,255,0.9)',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border,
              borderRadius: BorderRadius['2xl'],
              padding: Spacing['2xl'],
              overflow: 'hidden',
              marginTop: Spacing['4xl'],
            }}
          >

            {/* Header */}
            <View style={{ marginBottom: Spacing['2xl'] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: isDark ? colors.surface : colors.bg,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border,
                    borderRadius: BorderRadius.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="git-network-outline" size={22} color={colors.primary} />
                </View>
              </View>
              <Text style={{ fontFamily: Typography.families.display, fontSize: Typography.sizes['3xl'], color: colors.text, marginBottom: 6 }}>
                New Access Key
              </Text>
              <Text style={{ fontSize: Typography.sizes.base, fontWeight: '500', color: colors.textSecondary }}>
                Enter a secure access key to regain entry to the node.
              </Text>
            </View>

            {isSuccess ? (
              <View style={{ alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl }}>
                <Ionicons name="checkmark-circle-outline" size={48} color="#10b981" />
                <Text style={{ fontSize: Typography.sizes.lg, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
                  Access Key Updated
                </Text>
                <Text style={{ fontSize: Typography.sizes.sm, color: colors.textSecondary, textAlign: 'center' }}>
                  Your system access has been restored. You can now authenticate with your new key.
                </Text>
                <Button
                  title="Return to Login"
                  onPress={() => navigation.navigate('Login')}
                  style={{ marginTop: Spacing.md }}
                  fullWidth
                />
              </View>
            ) : (
              <View style={{ gap: Spacing.lg }}>
                <Input
                  label="Recovery Code"
                  labelStyle={{ fontSize: 10, letterSpacing: 2 }}
                  placeholder="Enter token"
                  autoCapitalize="none"
                  value={token}
                  onChangeText={setToken}
                  error={localErrors.token}
                  icon={<Ionicons name="keypad-outline" size={18} color={colors.primary} />}
                />

                <View>
                  <Input
                    label="New Access Key"
                    labelStyle={{ fontSize: 10, letterSpacing: 2 }}
                    placeholder="••••••••••••"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    error={localErrors.password}
                    icon={<Ionicons name="key-outline" size={18} color={colors.primary} />}
                  />
                  {/* Strength Meter */}
                  <View style={{ flexDirection: 'row', gap: 4, marginTop: 8, paddingHorizontal: 4 }}>
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
                  <View style={{ marginTop: 8, gap: 4, paddingHorizontal: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons
                        name={password.length >= 8 ? "checkmark-circle" : "radio-button-off"}
                        size={14}
                        color={password.length >= 8 ? "#10b981" : colors.textSecondary}
                      />
                      <Text style={{ fontSize: 11, color: password.length >= 8 ? "#10b981" : colors.textSecondary }}>At least 8 characters</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons
                        name={/[A-Z]/.test(password) ? "checkmark-circle" : "radio-button-off"}
                        size={14}
                        color={/[A-Z]/.test(password) ? "#10b981" : colors.textSecondary}
                      />
                      <Text style={{ fontSize: 11, color: /[A-Z]/.test(password) ? "#10b981" : colors.textSecondary }}>At least 1 uppercase letter</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons
                        name={/[0-9]/.test(password) ? "checkmark-circle" : "radio-button-off"}
                        size={14}
                        color={/[0-9]/.test(password) ? "#10b981" : colors.textSecondary}
                      />
                      <Text style={{ fontSize: 11, color: /[0-9]/.test(password) ? "#10b981" : colors.textSecondary }}>At least 1 number</Text>
                    </View>
                  </View>
                </View>

                <Input
                  label="Confirm Access Key"
                  labelStyle={{ fontSize: 10, letterSpacing: 2 }}
                  placeholder="••••••••••••"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  error={localErrors.confirm}
                  icon={<Ionicons name="key-outline" size={18} color={colors.primary} />}
                />

                {error && (
                  <View style={{ backgroundColor: isDark ? 'rgba(248,113,113,0.1)' : 'rgba(239,68,68,0.08)', padding: Spacing.md, borderRadius: BorderRadius.md }}>
                    <Text style={{ color: colors.error, fontSize: Typography.sizes.sm, fontWeight: '600' }}>{error}</Text>
                  </View>
                )}

                <Button
                  title={isLoading ? 'Updating...' : 'Update Access Key'}
                  onPress={handleReset}
                  loading={isLoading}
                  icon={!isLoading && <Ionicons name="lock-closed-outline" size={20} color={isDark ? '#000' : '#fff'} />}
                  style={{ marginTop: Spacing.sm }}
                  fullWidth
                />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
