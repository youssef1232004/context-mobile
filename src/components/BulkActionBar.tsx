import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BorderRadius, Spacing } from '../theme';

interface Props {
  selectedCount: number;
  onCompare: () => void;
  onOrganizeAI: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export const BulkActionBar: React.FC<Props> = ({ selectedCount, onCompare, onOrganizeAI, onDelete, onClear }) => {
  const { colors, isDark } = useTheme();
  if (selectedCount === 0) return null;

  const showCompare = selectedCount === 2;

  return (
    <View style={{
      position: 'absolute', bottom: 24, left: 16, right: 16,
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: isDark ? '#e0e0e6' : '#1a1a2e',
      borderRadius: BorderRadius['2xl'], paddingHorizontal: 12, paddingVertical: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 12,
    }}>
      <Text style={{ fontSize: 12, fontWeight: '800', color: isDark ? '#000' : '#fff' }}>
        {selectedCount} selected
      </Text>

      <View style={{ width: 1, height: 16, backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)' }} />

      {showCompare && (
        <TouchableOpacity onPress={onCompare} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="git-compare-outline" size={16} color={isDark ? '#3b82f6' : '#60a5fa'} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#3b82f6' : '#60a5fa' }} numberOfLines={1}>Compare</Text>
        </TouchableOpacity>
      )}

      {showCompare && (
        <View style={{ width: 1, height: 16, backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)' }} />
      )}

      <TouchableOpacity onPress={onOrganizeAI} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Ionicons name="sparkles-outline" size={16} color={isDark ? '#8b5cf6' : '#a78bfa'} />
        <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#8b5cf6' : '#a78bfa' }} numberOfLines={1}>Organize AI</Text>
      </TouchableOpacity>

      <View style={{ flex: 1 }} />

      <TouchableOpacity onPress={onDelete} style={{ padding: 4 }}>
        <Ionicons name="trash-outline" size={18} color="#ef4444" />
      </TouchableOpacity>

      <TouchableOpacity onPress={onClear} style={{ padding: 4 }}>
        <Ionicons name="close" size={18} color={isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)'} />
      </TouchableOpacity>
    </View>
  );
};
