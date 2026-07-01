import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Typography } from '../../../theme';

interface HomeGreetingProps {
  user: any;
  onProfilePress: () => void;
}

export const HomeGreeting = React.memo(({ user, onProfilePress }: HomeGreetingProps) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View>
        <Text style={{ fontFamily: Typography.families.mono, fontSize: Typography.sizes.sm, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.5 }}>
          Dashboard
        </Text>
        <Text style={{ fontFamily: Typography.families.display, fontSize: Typography.sizes['3xl'], color: colors.text, marginTop: 4 }}>
          Welcome back,{'\n'}
          <Text style={{ color: colors.primary }}>{user?.fullName || 'User'}</Text>
        </Text>
      </View>
      <TouchableOpacity
        onPress={onProfilePress}
        style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border, overflow: 'hidden' }}
      >
        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <Ionicons name="person" size={24} color={colors.primary} />
        )}
      </TouchableOpacity>
    </View>
  );
});
