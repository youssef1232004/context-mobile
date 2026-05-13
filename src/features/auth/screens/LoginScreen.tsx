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
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { loginUser, clearError } from '../../../store/authSlice';
import { Spacing, BorderRadius, Typography } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((state) => state.auth);
  const isLoading = status === 'loading';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localErrors, setLocalErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    if (!email) errors.email = 'Identity (email) is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Please enter a valid email address';
    if (!password) errors.password = 'Access Key is required';
    else if (password.length < 8) errors.password = 'Access Key must be at least 8 characters';
    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    dispatch(clearError());
    try {
      await dispatch(loginUser({ email, password })).unwrap();
    } catch {}
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
          {/* Card */}
          <View
            style={{
              backgroundColor: isDark ? 'rgba(24,24,27,0.8)' : 'rgba(255,255,255,0.9)',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border,
              borderRadius: BorderRadius['2xl'],
              padding: Spacing['2xl'],
              overflow: 'hidden',
            }}
          >
            {/* Top accent line */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                backgroundColor: colors.primary,
                opacity: 0.6,
              }}
            />

            {/* Logo + Header */}
            <View style={{ marginBottom: Spacing['2xl'] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.lg }}>
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
                <Text style={{ fontWeight: '700', fontSize: Typography.sizes.xl, color: isDark ? '#fff' : colors.primary }}>
                  Context
                </Text>
              </View>
              <Text style={{ fontSize: Typography.sizes['3xl'], fontWeight: '700', color: colors.text, marginBottom: 6 }}>
                Authenticate
              </Text>
              <Text style={{ fontSize: Typography.sizes.base, fontWeight: '500', color: colors.textSecondary }}>
                Enter your credentials to access the node.
              </Text>
            </View>

            {/* Form */}
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

              <Input
                label="Access Key"
                placeholder="••••••••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                error={localErrors.password}
                icon={<Ionicons name="key-outline" size={18} color={colors.primary} />}
              />

              {error && (
                <View
                  style={{
                    backgroundColor: isDark ? 'rgba(248,113,113,0.1)' : 'rgba(239,68,68,0.08)',
                    padding: Spacing.md,
                    borderRadius: BorderRadius.md,
                  }}
                >
                  <Text style={{ color: colors.error, fontSize: Typography.sizes.sm, fontWeight: '600' }}>
                    {error}
                  </Text>
                </View>
              )}

              {/* Submit */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
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
                {isLoading ? (
                  <ActivityIndicator size="small" color={isDark ? '#000' : '#fff'} />
                ) : (
                  <Ionicons name="sync-outline" size={20} color={isDark ? '#000' : '#fff'} />
                )}
                <Text style={{ color: isDark ? '#000' : '#fff', fontWeight: '700', fontSize: Typography.sizes.md }}>
                  {isLoading ? 'Authenticating...' : 'Sync Context'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View
              style={{
                marginTop: Spacing['2xl'],
                paddingTop: Spacing.lg,
                borderTopWidth: 1,
                borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: Typography.sizes.base, color: colors.textSecondary, fontWeight: '500' }}>
                New to the network?{' '}
                <Text
                  onPress={() => navigation.navigate('Register')}
                  style={{ color: isDark ? '#fff' : colors.primary, fontWeight: '700' }}
                >
                  Initialize System
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
