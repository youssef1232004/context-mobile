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
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { GradientLine } from '../../../components/ui/GradientLine';
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
                Recovery
              </Text>
              <Text style={{ fontSize: Typography.sizes.base, fontWeight: '500', color: colors.textSecondary }}>
                Enter your identity to receive a new access key.
              </Text>
            </View>

            {isSuccess ? (
              <View style={{ alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: `${colors.primary}1A`, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm }}>
                  <Ionicons name="mail-unread-outline" size={32} color={colors.primary} />
                </View>
                <Text style={{ fontSize: Typography.sizes.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
                  A link has been sent to your email.{'\n'}
                  Please open it from a web browser to reset your password, then return here to login.
                </Text>
                <Button
                  title="Return to Authentication"
                  onPress={() => navigation.navigate('Login')}
                  style={{ marginTop: Spacing.lg }}
                  variant="outline"
                  fullWidth
                />
              </View>
            ) : (
              <View style={{ gap: Spacing.lg }}>
                <Input
                  label="Identity"
                  labelStyle={{ fontSize: 10, letterSpacing: 2 }}
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

                <Button
                  title={isLoading ? 'Transmitting...' : 'Send Request'}
                  onPress={handleForgot}
                  loading={isLoading}
                  icon={!isLoading && <Ionicons name="paper-plane-outline" size={20} color={isDark ? '#000' : '#fff'} />}
                  style={{ marginTop: Spacing.sm }}
                  fullWidth
                />
              </View>
            )}

            <View style={{ marginTop: Spacing['2xl'], paddingTop: Spacing.lg, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border, alignItems: 'center' }}>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="arrow-back" size={14} color={colors.textSecondary} />
                <Text style={{ fontSize: Typography.sizes.sm, color: colors.textSecondary }}>Cancel and return</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
