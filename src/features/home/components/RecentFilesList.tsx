import React, { useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable';
import { CognitiveLoadBadge } from '../../../components/ui/CognitiveLoadBadge';
import { Spacing, Typography, BorderRadius } from '../../../theme';
import type { Document } from '../../documents/api/documentService';

const CARD_WIDTH = Dimensions.get('window').width * 0.42;

interface RecentFilesListProps {
  documents: Document[];
  getIcon: (ft: string) => { name: any; color: string };
  relativeDate: (iso: string) => string;
  onSeeAll: () => void;
  onDocumentPress: (id: string) => void;
}

export const RecentFilesList = React.memo(({ documents, getIcon, relativeDate, onSeeAll, onDocumentPress }: RecentFilesListProps) => {
  const { colors, isDark } = useTheme();

  const renderItem = useCallback(({ item }: { item: Document }) => {
    const ic = getIcon(item.fileType);
    return (
      <AnimatedPressable
        scaleTo={0.96}
        onPress={() => onDocumentPress(item._id)}
        style={{
          width: CARD_WIDTH,
          padding: Spacing.md,
          borderRadius: BorderRadius.xl,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.surface,
          gap: Spacing.sm,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${ic.color}18`, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={ic.name} size={18} color={ic.color} />
          </View>
          <CognitiveLoadBadge load={item.cognitiveLoad} compact />
        </View>
        <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '700', color: colors.text, marginTop: 4 }} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={{ fontSize: 11, fontWeight: '500', color: colors.textSecondary }}>
          {relativeDate(item.updatedAt)}
        </Text>
      </AnimatedPressable>
    );
  }, [getIcon, relativeDate, onDocumentPress, isDark, colors]);

  if (documents.length === 0) return null;

  return (
    <View style={{ gap: Spacing.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontFamily: Typography.families.display, fontSize: Typography.sizes.lg, color: colors.text }}>Recent Files</Text>
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={{ fontFamily: Typography.families.mono, fontSize: Typography.sizes.xs, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 }}>See All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={documents}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ gap: Spacing.md }}
        windowSize={5}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        removeClippedSubviews={true}
        renderItem={renderItem}
      />
    </View>
  );
});
