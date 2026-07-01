import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { SectionLabel } from '../../../components/ui/SectionLabel';
import { Spacing, BorderRadius, Typography } from '../../../theme';

const PERSONAS = [
  { id: 'general'  as const, label: 'General',      sub: 'Broad Scope',        icon: 'globe-outline'     as const },
  { id: 'professional' as const, label: 'Professional',  sub: 'Business & Specs',   icon: 'briefcase-outline' as const },
  { id: 'student'  as const, label: 'Student',       sub: 'Learning Focus',     icon: 'school-outline'    as const },
  { id: 'developer' as const, label: 'Developer',     sub: 'Technical & Code',   icon: 'terminal-outline'  as const },
];

type PersonaType = 'general' | 'professional' | 'student' | 'developer';

interface PersonaSelectorProps {
  persona: PersonaType;
  setPersona: (p: PersonaType) => void;
}

export const PersonaSelector = React.memo(({ persona, setPersona }: PersonaSelectorProps) => {
  const { colors, isDark } = useTheme();

  return (
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
  );
});
