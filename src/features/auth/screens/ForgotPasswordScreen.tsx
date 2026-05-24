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
import { authService } from '../api/authService';
import { Spacing, BorderRadius, Typography } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [localErrors, setLocalErrors] = useState<{ email?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): boolean => {
    const errors: { email?: string } = {};
    if (!email) errors.email = 'Identity (email) is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Please enter a valid email address';
    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleForgot = async () => {
    if (!validate()) return;
    setError(null);
    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send recovery link.');
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
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: colors.primary, opacity: 0.6 }} />

            {/* Header */}
            <View style={{ marginBottom: Spacing['2xl'] }}>
              <Text style={{ fontSize: Typography.sizes['3xl'], fontWeight: '700', color: colors.text, marginBottom: 6 }}>
                Recover Identity
              </Text>
              <Text style={{ fontSize: Typography.sizes.base, fontWeight: '500', color: colors.textSecondary }}>
                Enter your email to receive a recovery code.
              </Text>
            </View>

            {isSuccess ? (
              <View style={{ alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl }}>
                <Ionicons name="mail-unread-outline" size={48} color={colors.primary} />
                <Text style={{ fontSize: Typography.sizes.lg, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
                  Recovery Protocol Sent
                </Text>
                <Text style={{ fontSize: Typography.sizes.sm, color: colors.textSecondary, textAlign: 'center' }}>
                  Check your inbox for the recovery code. Use it to reset your access key.
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ResetPassword', { email })}
                  style={{
                    backgroundColor: colors.primary,
                    paddingVertical: 12,
                    paddingHorizontal: Spacing.xl,
                    borderRadius: BorderRadius.lg,
                    marginTop: Spacing.md,
                  }}
                >
                  <Text style={{ color: isDark ? '#000' : '#fff', fontWeight: '700' }}>Enter Recovery Code</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: Spacing.lg }}>
                <Input
                  label="Identity"
                  placeholder="user@context.ai"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  error={localErrors.email}
                  icon={<Ionicons name="finger-print-outline" size={18} color={colors.primary} />}
                />

                {error && (
                  <View style={{ backgroundColor: isDark ? 'rgba(248,113,113,0.1)' : 'rgba(239,68,68,0.08)', padding: Spacing.md, borderRadius: BorderRadius.md }}>
                    <Text style={{ color: colors.error, fontSize: Typography.sizes.sm, fontWeight: '600' }}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={handleForgot}
                  disabled={isLoading}
                  style={{
                    backgroundColor: colors.primary,
                    paddingVertical: 16,
                    borderRadius: BorderRadius.lg,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: Spacing.sm,
                    opacity: isLoading ? 0.7 : 1,
                  }}
                >
                  {isLoading ? <ActivityIndicator size="small" color={isDark ? '#000' : '#fff'} /> : <Ionicons name="paper-plane-outline" size={20} color={isDark ? '#000' : '#fff'} />}
                  <Text style={{ color: isDark ? '#000' : '#fff', fontWeight: '700', fontSize: Typography.sizes.md }}>
                    {isLoading ? 'Transmitting...' : 'Send Recovery Link'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
