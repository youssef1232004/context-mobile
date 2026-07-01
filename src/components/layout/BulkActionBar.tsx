import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { BorderRadius } from '../../theme';

interface Props {
  selectedCount: number;
  hasOrganizedDocs?: boolean;
  onOrganizeAI: () => void;
  onSynthesize: () => void;
  onDownload?: () => void;
  onMore?: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export const BulkActionBar: React.FC<Props> = ({ selectedCount, hasOrganizedDocs = false, onOrganizeAI, onSynthesize, onDownload, onMore, onDelete, onClear }) => {
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
      position: 'absolute', bottom: 24, alignSelf: 'center',
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: barBg,
      borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 10,
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 12,
      minWidth: '90%', maxWidth: '95%',
    }}>
      {/* Pinned Left: count badge */}
      <View style={{ 
        width: 32, height: 32, borderRadius: 16, 
        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        alignItems: 'center', justifyContent: 'center',
        marginRight: 10,
      }}>
        <Text style={{ fontSize: 13, fontWeight: '800', color: textColor }}>
          {selectedCount}
        </Text>
      </View>

      {/* Center Actions (Scrollable) */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={{ flex: 1 }}
        contentContainerStyle={{ alignItems: 'center', gap: 6, paddingRight: 8 }}
      >
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
            }}
          >
            <Ionicons name="sparkles" size={14} color={organizeColors.text} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: organizeColors.text }}>Organize</Text>
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
            }}
          >
            <Ionicons name="flask" size={14} color={synthesizeColors.text} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: synthesizeColors.text }}>Synthesize</Text>
          </TouchableOpacity>
        )}

        {onDownload && (
          <TouchableOpacity 
            onPress={onDownload} 
            activeOpacity={0.7}
            style={{ 
              flexDirection: 'row', alignItems: 'center', gap: 4, 
              paddingHorizontal: 10, paddingVertical: 6, 
              backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.2)',
              borderRadius: BorderRadius.full,
              borderWidth: 1, borderColor: isDark ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.3)',
            }}
          >
            <Ionicons name="download-outline" size={14} color={isDark ? '#10b981' : '#059669'} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#10b981' : '#059669' }}>Download</Text>
          </TouchableOpacity>
        )}

        {onMore && (
          <TouchableOpacity 
            onPress={onMore} 
            activeOpacity={0.7}
            style={{ 
              flexDirection: 'row', alignItems: 'center', gap: 4, 
              paddingHorizontal: 10, paddingVertical: 6, 
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              borderRadius: BorderRadius.full,
              borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={14} color={textColor} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: textColor }}>More</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Pinned Right: destructive actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 1, height: 20, backgroundColor: dividerColor, marginHorizontal: 2 }} />
        
        {/* Delete Pill */}
        <TouchableOpacity 
          onPress={onDelete} 
          activeOpacity={0.7}
          style={{ 
            width: 32, height: 32, 
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: deleteColors.bg,
            borderRadius: BorderRadius.full,
            borderWidth: 1, borderColor: deleteColors.border,
          }}
        >
          <Ionicons name="trash" size={15} color={deleteColors.text} />
        </TouchableOpacity>

        {/* Close Pill */}
        <TouchableOpacity 
          onPress={onClear} 
          style={{ 
            width: 32, height: 32, 
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
            borderRadius: BorderRadius.full,
          }}
        >
          <Ionicons name="close" size={16} color={textColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
};
