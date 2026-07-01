import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { registerUser, clearError } from '../store/authSlice';
import { Spacing, BorderRadius, Typography } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RegisterHeader } from '../components/RegisterHeader';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter';
import { PersonaSelector } from '../components/PersonaSelector';

type Props = NativeStackScreenProps<any, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((state) => state.auth);
  const isLoading = status === 'loading';

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [persona, setPersona] = useState<'general' | 'professional' | 'student' | 'developer'>('general');
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!fullName || fullName.length < 5) errors.fullName = 'Full Name must be at least 5 characters';
    if (!username || username.length < 5) errors.username = 'Username must be at least 5 characters';
    else if (!/^[a-zA-Z0-9_]+$/.test(username)) errors.username = 'Letters, numbers, and underscores only';
    if (!email) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Please enter a valid email address';
    if (!password || password.length < 8) errors.password = 'Master key must be at least 8 characters';
    else if (!/[A-Z]/.test(password)) errors.password = 'Must contain at least one uppercase letter';
    else if (!/[0-9]/.test(password)) errors.password = 'Must contain at least one number';
    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    dispatch(clearError());
    try {
      await dispatch(registerUser({ fullName, username, email, password, persona })).unwrap();
      setIsSuccess(true);
    } catch {}
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: Spacing.xl, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="mail-unread-outline" size={64} color={colors.primary} style={{ marginBottom: Spacing.lg }} />
        <Text style={{ fontSize: Typography.sizes['2xl'], fontWeight: '700', color: colors.text, marginBottom: Spacing.sm, textAlign: 'center' }}>
          Check Your Email
        </Text>
        <Text style={{ fontSize: Typography.sizes.base, color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing['2xl'] }}>
          We've sent a verification link to {email}. Please verify your email from your browser before signing in.
        </Text>
        <Button
          title="Return to Login"
          onPress={() => navigation.navigate('Login')}
          fullWidth
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: Spacing.xl, paddingTop: Spacing.lg }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{
              backgroundColor: isDark ? 'rgba(24,24,27,0.9)' : 'rgba(255,255,255,0.9)',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border,
              borderRadius: BorderRadius.xl,
              overflow: 'hidden',
            }}
          >
            <View style={{ padding: Spacing.xl }}>
              <RegisterHeader />

              <View style={{ gap: Spacing.lg }}>
                <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Full Name"
                      labelStyle={{ fontSize: 10, letterSpacing: 2 }}
                      placeholder="fullname"
                      value={fullName}
                      onChangeText={setFullName}
                      error={localErrors.fullName}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Username"
                      labelStyle={{ fontSize: 10, letterSpacing: 2 }}
                      placeholder="username"
                      autoCapitalize="none"
                      value={username}
                      onChangeText={setUsername}
                      error={localErrors.username}
                    />
                  </View>
                </View>

                <Input
                  label="Email Address"
                  labelStyle={{ fontSize: 10, letterSpacing: 2 }}
                  placeholder="name@mail.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  error={localErrors.email}
                />

                <View>
                  <Input
                    label="Password"
                    labelStyle={{ fontSize: 10, letterSpacing: 2 }}
                    placeholder="Create a master key"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    error={localErrors.password}
                  />
                  <PasswordStrengthMeter password={password} />
                </View>

                <PersonaSelector persona={persona} setPersona={setPersona} />

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

                <View style={{ gap: Spacing.md, paddingTop: Spacing.md }}>
                  <Button
                    title={isLoading ? 'Creating...' : 'Create Node'}
                    onPress={handleRegister}
                    loading={isLoading}
                    icon={!isLoading && <Ionicons name="arrow-forward" size={18} color={isDark ? '#000' : '#fff'} />}
                    fullWidth
                  />

                  <TouchableOpacity onPress={() => navigation.goBack()} style={{ alignItems: 'center', paddingVertical: 8 }}>
                    <Text style={{ fontSize: Typography.sizes.base, fontWeight: '500', color: colors.textSecondary }}>
                      Already initialized?{' '}
                      <Text style={{ fontWeight: '700', color: colors.primary }}>Sign In</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
