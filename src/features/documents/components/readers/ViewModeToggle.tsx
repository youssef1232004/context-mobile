import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { Spacing, BorderRadius } from '../../../../theme';
import type { Document } from '../../api/documentService';

export type ViewMode = 'content' | 'original' | 'prettify';

interface ViewModeToggleProps {
  doc: Document;
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
  isPDF: boolean;
  isImage: boolean;
  isText: boolean;
}

export function ViewModeToggle({
  doc, viewMode, onChange, isPDF, isImage, isText
}: ViewModeToggleProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={{
      flexDirection: 'row', alignSelf: 'center', marginTop: Spacing.sm,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f1f4',
      borderRadius: BorderRadius.full, padding: 3,
    }}>
      {([
        { key: 'content' as ViewMode, label: 'WorkSpace', icon: 'reader-outline' as const },
        ...(doc.cloudinaryUrl && !isText ? [{ key: 'original' as ViewMode, label: isPDF ? 'PDF View' : isImage ? 'Image' : 'Original', icon: isPDF ? 'document-text-outline' as const : isImage ? 'image-outline' as const : 'document-outline' as const }] : []),
        // Show Prettify tab for supported file types
        ...(['Word', 'Excel', 'TextSnippet'].includes(doc.fileType) 
          ? [{ key: 'prettify' as ViewMode, label: 'Prettify ✨', icon: 'sparkles-outline' as const }]
          : [])
      ]).map((tab) => {
        const active = viewMode === tab.key;
        return (
          <TouchableOpacity key={tab.key} onPress={() => onChange(tab.key)} style={{
            flexDirection: 'row', alignItems: 'center', gap: 5,
            paddingHorizontal: 14, paddingVertical: 7, borderRadius: BorderRadius.full,
            backgroundColor: active ? (isDark ? colors.primary : '#fff') : 'transparent',
            shadowColor: active ? '#000' : 'transparent',
            shadowOffset: { width: 0, height: 1 }, shadowOpacity: active ? 0.08 : 0, shadowRadius: 3, elevation: active ? 2 : 0,
          }}>
            <Ionicons name={tab.icon} size={14} color={active ? (isDark ? '#000' : colors.primary) : colors.textSecondary} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: active ? (isDark ? '#000' : colors.primary) : colors.textSecondary }}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
