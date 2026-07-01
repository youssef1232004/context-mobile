import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Spacing, Typography } from '../../../theme';

export const RegisterHeader = React.memo(() => {
  const { colors, isDark } = useTheme();

  return (
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
  );
});
