import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateProfile, logout } from '../store/authSlice';
import { authService } from '../features/auth/api/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Spacing, BorderRadius, Typography } from '../theme';

const PERSONAS = [
  { id: 'general', label: 'General' },
  { id: 'professional', label: 'Professional' },
  { id: 'student', label: 'Student' },
  { id: 'developer', label: 'Developer' },
] as const;

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'ProfileMain'>;

export default function ProfileScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const { user, status } = useAppSelector((state) => state.auth);

  // Identity form
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [identityErrors, setIdentityErrors] = useState<Record<string, string>>({});
  const [isUpdatingIdentity, setIsUpdatingIdentity] = useState(false);

  // Security form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityErrors, setSecurityErrors] = useState<Record<string, string>>({});
  const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false);

  // Persona
  const [showPersonaDropdown, setShowPersonaDropdown] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library access to upload an avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      const filename = asset.uri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri: asset.uri,
        name: filename,
        type,
      } as any);

      const data = await authService.uploadAvatar(formData);
      const updatedUser = data.data;
      await AsyncStorage.setItem('context_user', JSON.stringify(updatedUser));
      // Update redux state manually
      dispatch(updateProfile({
        fullName: updatedUser.fullName,
        username: updatedUser.username,
        email: updatedUser.email,
      }));
      Alert.alert('Success', 'Avatar uploaded successfully');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to upload avatar';
      Alert.alert('Error', msg);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setUsername(user.username || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleUpdateIdentity = async () => {
    const errors: Record<string, string> = {};
    if (!fullName || fullName.length < 5) errors.fullName = 'Full Name must be at least 5 characters';
    if (!username || username.length < 5) errors.username = 'Username must be at least 5 characters';
    if (!email || !/\S+@\S+\.\S+/.test(email)) errors.email = 'Invalid email address';
    setIdentityErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsUpdatingIdentity(true);
    try {
      await dispatch(updateProfile({ fullName, username, email })).unwrap();
      Alert.alert('Success', 'Identity updated successfully');
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : 'Failed to update identity';
      if (msg.includes('username') && msg.includes('already taken')) {
        setIdentityErrors({ username: 'This username is already taken' });
      } else if (msg.includes('email') && msg.includes('already taken')) {
        setIdentityErrors({ email: 'This email is already taken' });
      }
      Alert.alert('Error', msg);
    } finally {
      setIsUpdatingIdentity(false);
    }
  };

  const handleUpdateSecurity = async () => {
    const errors: Record<string, string> = {};
    if (!currentPassword) errors.currentPassword = 'Current password is required';
    if (!newPassword || newPassword.length < 8) errors.newPassword = 'Must be at least 8 characters';
    if (newPassword !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setSecurityErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsUpdatingSecurity(true);
    try {
      await dispatch(updateProfile({ currentPassword, password: newPassword })).unwrap();
      Alert.alert('Success', 'Master key updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : 'Failed to update master key';
      if (msg.toLowerCase().includes('current') && msg.toLowerCase().includes('incorrect')) {
        setSecurityErrors({ currentPassword: msg });
      }
      Alert.alert('Error', msg);
    } finally {
      setIsUpdatingSecurity(false);
    }
  };

  const handleSelectPersona = async (personaId: string) => {
    setShowPersonaDropdown(false);
    try {
      await dispatch(updateProfile({ persona: personaId })).unwrap();
      Alert.alert('Success', 'Semantic Persona updated');
    } catch {
      Alert.alert('Error', 'Failed to update persona');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to disconnect?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: () => dispatch(logout()) },
    ]);
  };

  const currentPersonaLabel = PERSONAS.find((p) => p.id === user?.persona)?.label || 'General';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.xl, paddingBottom: Spacing['4xl'] }}>
          {/* Page Header */}
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <Ionicons name="person-circle-outline" size={32} color={colors.primary} />
                <Text style={{ fontSize: Typography.sizes['3xl'], fontWeight: '900', color: colors.text }}>
                  Node Operator
                </Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ padding: 4 }}>
                <Ionicons name="settings-outline" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: Typography.sizes.base, color: colors.textSecondary, marginTop: 6, fontWeight: '500' }}>
              Manage your digital identity, master key, and system preferences.
            </Text>
          </View>

          {/* Identity Core Card */}
          <Card
            title="Identity Core"
            subtitle="Update your node's alias, public identification markers, and avatar."
            headerIcon={<Ionicons name="finger-print-outline" size={20} color={colors.primary} />}
          >
            <View style={{ gap: Spacing.lg }}>
              {/* Avatar */}
              <View style={{ alignItems: 'center', marginBottom: Spacing.sm }}>
                <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.7}>
                  <View
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 48,
                      borderWidth: 2,
                      borderStyle: 'dashed',
                      borderColor: isDark ? 'rgba(255,255,255,0.2)' : colors.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isDark ? '#121214' : colors.bg,
                      overflow: 'hidden',
                    }}
                  >
                    {isUploadingAvatar ? (
                      <ActivityIndicator size="large" color={colors.primary} />
                    ) : user?.avatar ? (
                      <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <Ionicons name="camera-outline" size={32} color={colors.textSecondary} />
                    )}
                  </View>
                </TouchableOpacity>
                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 8 }}>
                  Tap to Upload Avatar
                </Text>
              </View>

              {/* Form Fields */}
              <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Input label="Full Name" placeholder="System Admin" value={fullName} onChangeText={setFullName} error={identityErrors.fullName} />
                </View>
                <View style={{ flex: 1 }}>
                  <Input label="Username" placeholder="@admin" autoCapitalize="none" value={username} onChangeText={setUsername} error={identityErrors.username} />
                </View>
              </View>

              <Input label="Email Address" placeholder="admin@context.ai" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} error={identityErrors.email} />

              {/* Persona Dropdown */}
              <View>
                <Text style={{ fontSize: Typography.sizes.xs, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, marginLeft: 4 }}>
                  Semantic Persona
                </Text>
                <TouchableOpacity
                  onPress={() => setShowPersonaDropdown(!showPersonaDropdown)}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: isDark ? '#121214' : colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: BorderRadius.lg,
                    padding: Spacing.md,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: Typography.sizes.base, fontWeight: '600', color: colors.text }}>
                    {currentPersonaLabel}
                  </Text>
                  <Ionicons name={showPersonaDropdown ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
                </TouchableOpacity>

                {showPersonaDropdown && (
                  <View
                    style={{
                      marginTop: 8,
                      backgroundColor: isDark ? colors.surface : '#fff',
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border,
                      borderRadius: BorderRadius.lg,
                      overflow: 'hidden',
                    }}
                  >
                    {PERSONAS.map((p, idx) => (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => handleSelectPersona(p.id)}
                        style={{
                          padding: Spacing.md,
                          borderBottomWidth: idx < PERSONAS.length - 1 ? 1 : 0,
                          borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border,
                        }}
                      >
                        <Text style={{ fontSize: Typography.sizes.base, fontWeight: '600', color: user?.persona === p.id ? colors.primary : colors.text }}>
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Save Button */}
              <View style={{ alignItems: 'flex-end' }}>
                <Button
                  title={isUpdatingIdentity ? 'Saving...' : 'Save Identity'}
                  onPress={handleUpdateIdentity}
                  loading={isUpdatingIdentity}
                  icon={!isUpdatingIdentity ? <Ionicons name="save-outline" size={18} color={isDark ? '#000' : '#fff'} /> : undefined}
                />
              </View>
            </View>
          </Card>

          {/* Security Core Card */}
          <Card
            title="Security Core"
            subtitle="Modify your master access key. Changing this will disconnect all other active sessions."
            headerIcon={<Ionicons name="shield-checkmark-outline" size={20} color={isDark ? '#ef4444' : '#dc2626'} />}
            headerVariant="destructive"
          >
            <View style={{ gap: Spacing.lg }}>
              <Input
                label="Current Master Key"
                placeholder="••••••••"
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                error={securityErrors.currentPassword}
              />

              <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border, marginVertical: Spacing.xs }} />

              <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Input label="New Master Key" placeholder="••••••••" secureTextEntry value={newPassword} onChangeText={setNewPassword} error={securityErrors.newPassword} />
                </View>
                <View style={{ flex: 1 }}>
                  <Input label="Confirm New Key" placeholder="••••••••" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} error={securityErrors.confirmPassword} />
                </View>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Button
                  title={isUpdatingSecurity ? 'Updating...' : 'Change Master Key'}
                  onPress={handleUpdateSecurity}
                  loading={isUpdatingSecurity}
                  variant="destructive"
                  icon={!isUpdatingSecurity ? <Ionicons name="key-outline" size={18} color="#fff" /> : undefined}
                />
              </View>
            </View>
          </Card>

          <View style={{ gap: Spacing.md }}>
            {/* Settings Button */}
            <Button
              title="System Settings"
              onPress={() => navigation.navigate('Settings')}
              variant="outline"
              fullWidth
              icon={<Ionicons name="settings-outline" size={20} color={colors.text} />}
            />
            {/* Logout Button */}
            <Button
              title="Disconnect from Node"
              onPress={handleLogout}
              variant="outline"
              fullWidth
              icon={<Ionicons name="log-out-outline" size={20} color={colors.text} />}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
