import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { Spacing, Typography } from '../../../../theme';
import type { Document } from '../../api/documentService';

interface DocumentNavbarProps {
  onBack: () => void;
  doc: Document | null;
  loading: boolean;
  onReanalyze: () => void;
  reanalyzing: boolean;
  onDownload: () => void;
  downloading: boolean;
  onShare: () => void;
  chatOpen: boolean;
  onToggleChat: () => void;
}

export function DocumentNavbar({
  onBack, doc, loading, onReanalyze, reanalyzing,
  onDownload, downloading, onShare, chatOpen, onToggleChat
}: DocumentNavbarProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
      borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : colors.border,
    }}>
      <TouchableOpacity onPress={onBack} style={{ padding: 4 }}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: Typography.sizes.base, fontWeight: '700', color: colors.text }} numberOfLines={1}>
          {loading ? 'Loading…' : (doc?.title || 'Document')}
        </Text>
        {doc?.aiStatus && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <View style={{
              width: 6, height: 6, borderRadius: 3,
              backgroundColor: doc.aiStatus === 'Analyzed' ? '#10b981' : doc.aiStatus === 'Failed' ? '#ef4444' : '#f59e0b'
            }} />
            <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '500' }}>{doc.aiStatus}</Text>
            {doc.aiStatus === 'Failed' && (
              <TouchableOpacity 
                onPress={onReanalyze} 
                disabled={reanalyzing} 
                style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 4, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 6 }}
              >
                {reanalyzing
                  ? <ActivityIndicator size={10} color="#ef4444" />
                  : <Ionicons name="refresh" size={11} color="#ef4444" />
                }
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#ef4444' }}>{reanalyzing ? 'Retrying…' : 'Retry'}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Download button */}
      {doc?.cloudinaryUrl && (
        <TouchableOpacity onPress={onDownload} disabled={downloading} style={{ padding: 4 }}>
          {downloading
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Ionicons name="download-outline" size={18} color={colors.primary} />
          }
        </TouchableOpacity>
      )}

      {/* Share button */}
      {doc?.cloudinaryUrl && (
        <TouchableOpacity onPress={onShare} style={{ padding: 4 }}>
          <Ionicons name="share-outline" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      )}

      {/* AI Chat toggle */}
      <TouchableOpacity
        onPress={onToggleChat}
        style={{
          padding: 6, borderRadius: 10,
          backgroundColor: chatOpen ? (isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)') : 'transparent',
        }}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={18} color={chatOpen ? colors.primary : colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}
