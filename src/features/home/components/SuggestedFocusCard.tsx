import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Card } from '../../../components/ui/Card';
import { AnimatedPressable } from '../../../components/ui/AnimatedPressable';
import { CognitiveLoadBadge } from '../../../components/ui/CognitiveLoadBadge';
import { Spacing, Typography, BorderRadius } from '../../../theme';
import { getTagColor } from '../../../utils/tagUtils';
import type { Document } from '../../documents/api/documentService';

interface SuggestedFocusCardProps {
  focusDoc: Document;
  getIcon: (ft: string) => { name: any; color: string };
  relativeDate: (iso: string) => string;
  onPress: () => void;
}

export const SuggestedFocusCard = React.memo(({ focusDoc, getIcon, relativeDate, onPress }: SuggestedFocusCardProps) => {
  const { colors, isDark } = useTheme();

  return (
    <AnimatedPressable
      scaleTo={0.98}
      onPress={onPress}
    >
      <Card
        title="Suggested Focus"
        subtitle="AI-recommended next read"
        headerIcon={<Ionicons name="sparkles" size={18} color="#f59e0b" />}
      >
        <View style={{ gap: Spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${getIcon(focusDoc.fileType).color}18`, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={getIcon(focusDoc.fileType).name} size={20} color={getIcon(focusDoc.fileType).color} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: Typography.sizes.base, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                {focusDoc.title}
              </Text>
              <Text style={{ fontSize: Typography.sizes.xs, color: colors.textSecondary, fontWeight: '500' }}>
                {focusDoc.fileType} · {relativeDate(focusDoc.updatedAt)}
              </Text>
            </View>
            <CognitiveLoadBadge load={focusDoc.cognitiveLoad} />
          </View>

          <Text
            style={{ fontSize: Typography.sizes.sm, color: colors.textSecondary, lineHeight: 20, fontStyle: focusDoc.summary ? 'normal' : 'italic' }}
            numberOfLines={3}
          >
            {focusDoc.summary || 'AI analysis pending — summary will appear once processing completes.'}
          </Text>

          {focusDoc.tags && focusDoc.tags.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {focusDoc.tags.slice(0, 4).map((tag) => {
                const tColor = getTagColor(tag, isDark);
                return (
                  <View
                    key={tag}
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: BorderRadius.full,
                      backgroundColor: tColor.bg,
                      borderWidth: 1,
                      borderColor: tColor.border,
                    }}
                  >
                    <Text style={{ fontFamily: Typography.families.mono, fontSize: 10, fontWeight: '700', color: tColor.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {tag}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </Card>
    </AnimatedPressable>
  );
});
