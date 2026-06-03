import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BorderRadius } from '../theme';

interface Props {
  selectedCount: number;
  hasOrganizedDocs?: boolean;
  onOrganizeAI: () => void;
  onSynthesize: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export const BulkActionBar: React.FC<Props> = ({ selectedCount, hasOrganizedDocs = false, onOrganizeAI, onSynthesize, onDelete, onClear }) => {
  const { isDark } = useTheme();
  if (selectedCount === 0) return null;

  const showSynthesize = selectedCount >= 2;
  const shouldShowOrganize = !hasOrganizedDocs;

  // The BulkActionBar uses an INVERTED theme for high contrast (Dark bar in Light mode, Light bar in Dark mode)
  const barBg = isDark ? '#e0e0e6' : '#1a1a2e';
  const textColor = isDark ? '#000' : '#fff';
  const dividerColor = isDark ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)';
  
  // Colors for action pills
  const organizeColors = {
    bg: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.2)',
    text: isDark ? '#2563eb' : '#93c5fd',
    border: isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.3)',
  };
  const synthesizeColors = {
    bg: isDark ? 'rgba(168,85,247,0.15)' : 'rgba(168,85,247,0.2)',
    text: isDark ? '#9333ea' : '#d8b4fe',
    border: isDark ? 'rgba(168,85,247,0.3)' : 'rgba(168,85,247,0.3)',
  };
  const deleteColors = {
    bg: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.2)',
    text: isDark ? '#dc2626' : '#fca5a5',
    border: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.3)',
  };

  return (
    <View style={{
      position: 'absolute', bottom: 24, left: 16, right: 16,
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: barBg,
      borderRadius: BorderRadius['2xl'], paddingHorizontal: 16, paddingVertical: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 12,
    }}>
      {/* Pinned Left: count badge */}
      <Text style={{ fontSize: 12, fontWeight: '800', color: textColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {selectedCount} selected
      </Text>
      <View style={{ width: 1, height: 20, backgroundColor: dividerColor, marginHorizontal: 12 }} />

      {/* Center Actions (Flex) */}
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {shouldShowOrganize && (
          <TouchableOpacity
            onPress={onOrganizeAI}
            activeOpacity={0.7}
            style={{ 
              flexDirection: 'row', alignItems: 'center', gap: 4, 
              paddingHorizontal: 10, paddingVertical: 6, 
              backgroundColor: organizeColors.bg,
              borderRadius: BorderRadius.full,
              borderWidth: 1, borderColor: organizeColors.border,
              flexShrink: 1,
            }}
          >
            <Ionicons name="sparkles" size={14} color={organizeColors.text} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: organizeColors.text, flexShrink: 1 }} numberOfLines={1}>Organize</Text>
          </TouchableOpacity>
        )}

        {showSynthesize && (
          <TouchableOpacity 
            onPress={onSynthesize} 
            activeOpacity={0.7}
            style={{ 
              flexDirection: 'row', alignItems: 'center', gap: 4, 
              paddingHorizontal: 10, paddingVertical: 6, 
              backgroundColor: synthesizeColors.bg,
              borderRadius: BorderRadius.full,
              borderWidth: 1, borderColor: synthesizeColors.border,
              flexShrink: 1,
            }}
          >
            <Ionicons name="flask" size={14} color={synthesizeColors.text} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: synthesizeColors.text, flexShrink: 1 }} numberOfLines={1}>Synthesize</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Pinned Right: destructive actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 1, height: 20, backgroundColor: dividerColor, marginHorizontal: 10 }} />
        
        {/* Delete Pill - Always visible */}
        <TouchableOpacity 
          onPress={onDelete} 
          activeOpacity={0.7}
          style={{ 
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            width: 30, height: 30, marginRight: 8,
            backgroundColor: deleteColors.bg,
            borderRadius: BorderRadius.full,
            borderWidth: 1, borderColor: deleteColors.border,
          }}
        >
          <Ionicons name="trash" size={14} color={deleteColors.text} />
        </TouchableOpacity>

        <TouchableOpacity onPress={onClear} style={{ padding: 4 }}>
          <Ionicons name="close" size={20} color={isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)'} />
        </TouchableOpacity>
      </View>
    </View>
  );
};
