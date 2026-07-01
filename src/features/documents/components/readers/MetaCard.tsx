import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { SectionLabel } from '../../../../components/ui/SectionLabel';
import { CognitiveLoadBadge } from '../../../../components/ui/CognitiveLoadBadge';
import { Spacing, Typography, BorderRadius } from '../../../../theme';
import { getTagColor } from '../../../../utils/tagUtils';
import type { Document } from '../../api/documentService';

interface MetaCardProps {
  doc: Document;
}

export function MetaCard({ doc }: MetaCardProps) {
  const { colors, isDark } = useTheme();

  return (
    <Card>
      <View style={{ gap: Spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <Badge label={doc.fileType?.toUpperCase() || 'FILE'} variant="primary" />
            <Badge label={doc.aiStatus || 'Pending'} variant="outline" />
          </View>
          <CognitiveLoadBadge load={doc.cognitiveLoad} />
        </View>

        <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border }} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: Typography.sizes.sm, color: colors.textSecondary, fontWeight: '500' }}>Uploaded</Text>
          <Text style={{ fontSize: Typography.sizes.sm, color: colors.text, fontWeight: '600' }}>
            {new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>

        {doc.tags?.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {doc.tags.map((tag: string) => {
              const tColor = getTagColor(tag, isDark);
              return (
                <View key={tag} style={{
                  paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full,
                  backgroundColor: tColor.bg,
                  borderWidth: 1, borderColor: tColor.border,
                }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: tColor.text }}>#{tag}</Text>
                </View>
              );
            })}
          </View>
        )}

        {doc.summary && (
          <>
            <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border }} />
            <View style={{ gap: 4 }}>
              <SectionLabel text="AI Summary" color={colors.textSecondary} />
              <Text style={{ fontSize: Typography.sizes.sm, color: colors.text, lineHeight: 20 }}>{doc.summary}</Text>
            </View>
          </>
        )}
      </View>
    </Card>
  );
}
