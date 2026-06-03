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
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { SectionLabel } from '../../../components/SectionLabel';
import { GradientLine } from '../../../components/GradientLine';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { registerUser, clearError } from '../../../store/authSlice';
import { Spacing, BorderRadius, Typography } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'Register'>;

/**
 * UI labels match the Web frontend (General, Professional, Student, Developer).
 * The `id` values are silently mapped to the backend Mongoose enum on submit:
 * user.model.ts → enum: ['General', 'Engineer', 'Analyst', 'Marketer']
 */
const PERSONAS = [
  { id: 'general'  as const, label: 'General',      sub: 'Broad Scope',        icon: 'globe-outline'     as const },
  { id: 'professional' as const, label: 'Professional',  sub: 'Business & Specs',   icon: 'briefcase-outline' as const },
  { id: 'student'  as const, label: 'Student',       sub: 'Learning Focus',     icon: 'school-outline'    as const },
  { id: 'developer' as const, label: 'Developer',     sub: 'Technical & Code',   icon: 'terminal-outline'  as const },
];

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
    } catch {}
  };

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
          {/* Card */}
          <View
            style={{
              backgroundColor: isDark ? 'rgba(24,24,27,0.9)' : 'rgba(255,255,255,0.9)',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border,
              borderRadius: BorderRadius.xl,
              overflow: 'hidden',
            }}
          >
            {/* Top accent line removed as requested */}

            <View style={{ padding: Spacing.xl }}>
              {/* Header */}
              <View style={{ marginBottom: Spacing['2xl'] }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontFamily: Typography.families.display, fontSize: Typography.sizes['2xl'], color: colors.text, flex: 1, marginRight: 12 }} numberOfLines={1} adjustsFontSizeToFit>
                    Initialize System
                  </Text>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.bg,
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="git-network-outline" size={22} color={colors.primary} />
                  </View>
                </View>
                <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '500', color: colors.textSecondary, marginTop: Spacing.xs }}>
                  Create a new identity to access the network.
                </Text>
              </View>

              {/* Form */}
              <View style={{ gap: Spacing.lg }}>
                {/* Name + Username Row */}
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
                </View>

                {/* Persona Selection */}
                <View
                  style={{
                    paddingTop: Spacing.lg,
                    borderTopWidth: 1,
                    borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border,
                  }}
                >
                  <SectionLabel text="Select Semantic Core" style={{ marginBottom: Spacing.md, marginLeft: 4 }} />
                  <View style={{ gap: Spacing.sm }}>
                    {/* Row 1 */}
                    <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                    {PERSONAS.slice(0, 2).map((p) => {
                      const isSelected = persona === p.id;
                      return (
                        <TouchableOpacity
                          key={p.id}
                          onPress={() => setPersona(p.id)}
                          activeOpacity={0.8}
                          style={{
                            flex: 1,
                            padding: Spacing.md,
                            borderRadius: BorderRadius.lg,
                            borderWidth: 1,
                            borderColor: isSelected ? colors.primary : isDark ? 'rgba(255,255,255,0.1)' : colors.border,
                            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(248,249,250,0.5)',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: Spacing.sm,
                          }}
                        >
                          <View
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.bg,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Ionicons
                              name={p.icon}
                              size={16}
                              color={isSelected ? colors.primary : colors.textSecondary}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                              {p.label}
                            </Text>
                            <Text style={{ fontSize: 10, fontWeight: '600', color: colors.textSecondary }} numberOfLines={1}>
                              {p.sub}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                    </View>
                    {/* Row 2 */}
                    <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                    {PERSONAS.slice(2, 4).map((p) => {
                      const isSelected = persona === p.id;
                      return (
                        <TouchableOpacity
                          key={p.id}
                          onPress={() => setPersona(p.id)}
                          activeOpacity={0.8}
                          style={{
                            flex: 1,
                            padding: Spacing.md,
                            borderRadius: BorderRadius.lg,
                            borderWidth: 1,
                            borderColor: isSelected ? colors.primary : isDark ? 'rgba(255,255,255,0.1)' : colors.border,
                            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(248,249,250,0.5)',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: Spacing.sm,
                          }}
                        >
                          <View
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.bg,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Ionicons
                              name={p.icon}
                              size={16}
                              color={isSelected ? colors.primary : colors.textSecondary}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                              {p.label}
                            </Text>
                            <Text style={{ fontSize: 10, fontWeight: '600', color: colors.textSecondary }} numberOfLines={1}>
                              {p.sub}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                    </View>
                  </View>
                </View>

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

                {/* Footer */}
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
