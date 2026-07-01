import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable } from '../../../../components/ui/AnimatedPressable';
import { CognitiveLoadBadge } from '../../../../components/ui/CognitiveLoadBadge';
import { Spacing, Typography, BorderRadius } from '../../../../theme';
import { getTagColor } from '../../../../utils/tagUtils';
import type { Document } from '../../api/documentService';

const FILE_ICONS: Record<string, { name: React.ComponentProps<typeof Ionicons>['name']; color: string }> = {
  PDF: { name: 'document-text', color: '#ef4444' },
  Word: { name: 'document', color: '#3b82f6' },
  Excel: { name: 'grid', color: '#10b981' },
  CSV: { name: 'grid', color: '#10b981' },
  Image: { name: 'image', color: '#8b5cf6' },
  TextSnippet: { name: 'reader', color: '#f59e0b' },
};

interface DocumentItemProps {
  doc: Document;
  selected: boolean;
  isSelecting: boolean;
  isDark: boolean;
  colors: any;
  onPress: (id: string) => void;
  onLongPress: (id: string) => void;
  onActionPress: (doc: Document) => void;
}

export const DocumentItem = React.memo(({
  doc,
  selected,
  isSelecting,
  isDark,
  colors,
  onPress,
  onLongPress,
  onActionPress,
}: DocumentItemProps) => {
  const ic = FILE_ICONS[doc.fileType] || { name: 'document-outline' as const, color: colors.textSecondary };
  const d = new Date(doc.updatedAt);
  const now = new Date();
  const dateStr = d.toDateString() === now.toDateString()
    ? `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <AnimatedPressable
      scaleTo={0.97}
      onPress={() => onPress(doc._id)}
      onLongPress={() => onLongPress(doc._id)}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md,
        borderRadius: BorderRadius.xl, borderWidth: 1,
        borderColor: selected ? colors.primary : (isDark ? 'rgba(255,255,255,0.08)' : colors.border),
        backgroundColor: selected ? (isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.06)') : (isDark ? 'rgba(255,255,255,0.03)' : colors.surface),
        marginBottom: Spacing.sm
      }}>
      {isSelecting && (
        <View style={{
          width: 22, height: 22, borderRadius: 11, borderWidth: 2,
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primary : 'transparent',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {selected && <Ionicons name="checkmark" size={13} color={isDark ? '#000' : '#fff'} />}
        </View>
      )}

      <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: `${ic.color}18`, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={ic.name} size={20} color={ic.color} />
      </View>

      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '700', color: colors.text }} numberOfLines={1}>{doc.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 11, fontWeight: '500', color: colors.textSecondary }}>{doc.fileType} · {dateStr}</Text>
        </View>
        {doc.tags && doc.tags.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 4, marginTop: 2 }}>
            {doc.tags.slice(0, 2).map((tag: string) => {
              const tColor = getTagColor(tag, isDark);
              return (
                <Text key={tag} style={{ fontSize: 9, fontWeight: '700', color: tColor.text, backgroundColor: tColor.bg, borderWidth: 1, borderColor: tColor.border, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, overflow: 'hidden' }}>#{tag}</Text>
              );
            })}
            {doc.tags.length > 2 && <Text style={{ fontSize: 9, fontWeight: '700', color: colors.textSecondary }}>+{doc.tags.length - 2}</Text>}
          </View>
        )}
      </View>

      <CognitiveLoadBadge load={doc.cognitiveLoad} compact />

      {!isSelecting && (
        <TouchableOpacity onPress={() => onActionPress(doc)} style={{ padding: 4 }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="ellipsis-vertical" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </AnimatedPressable>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.doc === nextProps.doc &&
    prevProps.selected === nextProps.selected &&
    prevProps.isSelecting === nextProps.isSelecting &&
    prevProps.isDark === nextProps.isDark
  );
});
