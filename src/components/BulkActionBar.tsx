import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BorderRadius, Spacing } from '../theme';

interface Props {
  selectedCount: number;
  /** True when at least one selected doc already belongs to a folder — disables Organize AI only */
  hasOrganizedDocs?: boolean;
  onOrganizeAI: () => void;
  onSynthesize: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export const BulkActionBar: React.FC<Props> = ({ selectedCount, hasOrganizedDocs = false, onOrganizeAI, onSynthesize, onDelete, onClear }) => {
  const { colors, isDark } = useTheme();
  if (selectedCount === 0) return null;

  const showSynthesize = selectedCount >= 2;
  const textColor = isDark ? '#000' : '#fff';
  const dividerColor = isDark ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)';
  // Organize AI is hidden when any selected doc is already organized
  const shouldShowOrganize = !hasOrganizedDocs;

  return (
    <View style={{
      position: 'absolute', bottom: 24, left: 16, right: 16,
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: isDark ? '#e0e0e6' : '#1a1a2e',
      borderRadius: BorderRadius['2xl'], paddingHorizontal: 12, paddingVertical: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 12,
    }}>
      {/* Pinned: count badge */}
      <Text style={{ fontSize: 12, fontWeight: '800', color: textColor, marginRight: 8 }}>
        {selectedCount} selected
      </Text>
      <View style={{ width: 1, height: 16, backgroundColor: dividerColor, marginRight: 8 }} />

      {/* Scrollable actions */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
        style={{ flex: 1 }}
      >
        {showSynthesize && (
          <TouchableOpacity onPress={onSynthesize} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="flask-outline" size={16} color="#10b981" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#10b981' }}>Synthesize</Text>
          </TouchableOpacity>
        )}

        {showSynthesize && <View style={{ width: 1, height: 16, backgroundColor: dividerColor }} />}

        {/* Organize AI — hidden when any selected doc is already organized */}
        {shouldShowOrganize && (
          <TouchableOpacity
            onPress={onOrganizeAI}
            activeOpacity={0.7}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Ionicons name="sparkles-outline" size={16} color={isDark ? '#8b5cf6' : '#a78bfa'} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#8b5cf6' : '#a78bfa' }}>
              Organize AI
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Pinned: destructive actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 }}>
        <View style={{ width: 1, height: 16, backgroundColor: dividerColor, marginRight: 4 }} />
        <TouchableOpacity onPress={onDelete} style={{ padding: 4 }}>
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onClear} style={{ padding: 4 }}>
          <Ionicons name="close" size={18} color={isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)'} />
        </TouchableOpacity>
      </View>
    </View>
  );
};
