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

type Props = NativeStackScreenProps<any, 'ResetPassword'>;

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const { colors, isDark } = useTheme();

  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [localErrors, setLocalErrors] = useState<{ token?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): boolean => {
    const errors: { token?: string; password?: string } = {};
    if (!token) errors.token = 'Recovery code is required';
    if (!password) errors.password = 'New Access Key is required';
    else if (password.length < 8) errors.password = 'Access Key must be at least 8 characters';
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
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: colors.primary, opacity: 0.6 }} />

            {/* Header */}
            <View style={{ marginBottom: Spacing['2xl'] }}>
              <Text style={{ fontSize: Typography.sizes['3xl'], fontWeight: '700', color: colors.text, marginBottom: 6 }}>
                Reset Access Key
              </Text>
              <Text style={{ fontSize: Typography.sizes.base, fontWeight: '500', color: colors.textSecondary }}>
                Provide the recovery code sent to your email to establish a new access key.
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
                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                  style={{
                    backgroundColor: colors.primary,
                    paddingVertical: 12,
                    paddingHorizontal: Spacing.xl,
                    borderRadius: BorderRadius.lg,
                    marginTop: Spacing.md,
                  }}
                >
                  <Text style={{ color: isDark ? '#000' : '#fff', fontWeight: '700' }}>Return to Login</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: Spacing.lg }}>
                <Input
                  label="Recovery Code"
                  placeholder="Enter token"
                  autoCapitalize="none"
                  value={token}
                  onChangeText={setToken}
                  error={localErrors.token}
                  icon={<Ionicons name="keypad-outline" size={18} color={colors.primary} />}
                />

                <Input
                  label="New Access Key"
                  placeholder="••••••••••••"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  error={localErrors.password}
                  icon={<Ionicons name="key-outline" size={18} color={colors.primary} />}
                />

                {error && (
                  <View style={{ backgroundColor: isDark ? 'rgba(248,113,113,0.1)' : 'rgba(239,68,68,0.08)', padding: Spacing.md, borderRadius: BorderRadius.md }}>
                    <Text style={{ color: colors.error, fontSize: Typography.sizes.sm, fontWeight: '600' }}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={handleReset}
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
                  {isLoading ? <ActivityIndicator size="small" color={isDark ? '#000' : '#fff'} /> : <Ionicons name="lock-closed-outline" size={20} color={isDark ? '#000' : '#fff'} />}
                  <Text style={{ color: isDark ? '#000' : '#fff', fontWeight: '700', fontSize: Typography.sizes.md }}>
                    {isLoading ? 'Processing...' : 'Confirm Reset'}
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
