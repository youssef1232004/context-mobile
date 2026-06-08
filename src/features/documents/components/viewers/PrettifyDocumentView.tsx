import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { Spacing, BorderRadius, Typography } from '../../../../theme';
import type { DocumentPrettifyResult } from '../../../../services/prettify.service';
import { stripHtml, getListItems, htmlToMarkdown } from '../../../../utils/prettify-helpers';
import Markdown from 'react-native-markdown-display';

interface PrettifyDocumentViewProps {
  result: DocumentPrettifyResult;
  isSnippet: boolean;
  onReorganize: () => void;
  onShare: () => void;
  onCopy?: () => void;
}

export const PrettifyDocumentView: React.FC<PrettifyDocumentViewProps> = ({
  result,
  isSnippet,
  onReorganize,
  onShare,
  onCopy,
}) => {
  const { colors, isDark } = useTheme();
  const isRtl = result.direction === 'rtl';

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#0A0A0C' : colors.surface }}>
      {/* Action bar */}
      <View style={[styles.actionBar, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border, backgroundColor: isDark ? '#18181B' : '#fff' }]}>
        
        {/* Left: Scrollable Metadata Badges */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1, marginRight: 12 }}
          contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 8 }}
        >
          <Ionicons name="sparkles" size={14} color={colors.primary} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
            Prettified — {result.sections.length} sections
          </Text>
          {result.language && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{result.language}</Text>
            </View>
          )}
          {result.metadata?.detectedType && (
            <View style={[styles.badge, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
              <Text style={[styles.badgeText, { color: '#10b981' }]}>
                {result.metadata.detectedType}
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <TouchableOpacity onPress={onReorganize} style={[styles.actionButton, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border }]}>
            <Ionicons name="refresh" size={14} color={colors.textSecondary} />
            {!isSnippet && <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary }}>Re-organize</Text>}
          </TouchableOpacity>
          
          {isSnippet && onCopy && (
            <TouchableOpacity onPress={onCopy} style={[styles.actionButton, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border }]}>
              <Ionicons name="copy-outline" size={14} color={colors.textSecondary} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary }}>Copy</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={onShare} style={styles.shareButton}>
            <Ionicons name="share-outline" size={14} color="#10b981" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#10b981' }}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ padding: Spacing.xl }}>
        {result.sections.map((section, si) => {
          const listData = getListItems(section);

          // Headings styling logic
          let headingStyle: any = { color: colors.text, writingDirection: isRtl ? 'rtl' : 'ltr', textAlign: isRtl ? 'right' : 'left' };
          switch (section.level) {
            case 1:
              headingStyle = { ...headingStyle, fontSize: 24, fontWeight: '800', marginBottom: 16, marginTop: 24, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border };
              break;
            case 2:
              headingStyle = { ...headingStyle, fontSize: 20, fontWeight: '800', marginBottom: 12, marginTop: 20, paddingTop: 16, borderTopWidth: 4, borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border };
              break;
            case 3:
              headingStyle = { ...headingStyle, fontSize: 17, fontWeight: '700', marginBottom: 10, marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border };
              break;
            case 4:
              headingStyle = { ...headingStyle, fontSize: 15, fontWeight: '600', marginBottom: 8, marginTop: 12 };
              break;
            case 5:
              headingStyle = { ...headingStyle, fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 };
              break;
            default:
              headingStyle = { ...headingStyle, fontSize: 17, fontWeight: '700', marginBottom: 10 };
          }
          if (si === 0) {
            headingStyle.marginTop = 0;
            headingStyle.borderTopWidth = 0;
            headingStyle.paddingTop = 0;
          }

          // Markdown styling config
          const markdownStyles = {
            body: {
              color: section.level === 3 ? colors.text : colors.textSecondary,
              fontSize: section.level === 3 ? 16 : 14,
              lineHeight: 22,
              writingDirection: isRtl ? 'rtl' : 'ltr',
              textAlign: isRtl ? 'right' : 'left',
            } as any,
            strong: { fontWeight: '800', color: colors.text } as any,
            em: { fontStyle: 'italic', color: colors.textSecondary } as any,
            code_inline: {
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              color: '#8b5cf6', // violet-500
              fontFamily: 'monospace',
              borderRadius: 4,
              paddingHorizontal: 4,
            } as any,
            code_block: {
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              color: colors.textSecondary,
              fontFamily: 'monospace',
              padding: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            } as any,
            blockquote: {
              borderLeftWidth: 4,
              borderLeftColor: 'rgba(139,92,246,0.5)',
              backgroundColor: 'rgba(139,92,246,0.05)',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderTopRightRadius: 8,
              borderBottomRightRadius: 8,
              fontStyle: 'italic',
              color: colors.textSecondary,
            } as any,
            table: {
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              borderRadius: 8,
            } as any,
            thead: { backgroundColor: isDark ? '#18181B' : '#111827' } as any,
            th: { 
              color: '#FFFFFF',
              fontWeight: '700',
              padding: 8,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255,255,255,0.1)',
            } as any,
            td: {
              padding: 8,
              borderBottomWidth: 1,
              borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            } as any,
            tr: {
              backgroundColor: isDark ? '#0A0A0C' : '#FFFFFF',
            } as any,
            hr: {
              borderTopWidth: 2,
              borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              borderStyle: 'dashed',
              marginVertical: 16,
            } as any,
            a: {
              color: '#8b5cf6',
              textDecorationLine: 'underline',
              fontWeight: 'bold',
            } as any,
            list_item: {
              flexDirection: isRtl ? 'row-reverse' : 'row',
              marginBottom: 4,
            } as any,
          };

          return (
            <View key={si} style={{ marginBottom: Spacing.lg }}>
              <Text style={headingStyle}>{stripHtml(section.heading)}</Text>

              {section.content ? (
                <View style={{ marginBottom: Spacing.md }}>
                  <Markdown style={markdownStyles}>
                    {htmlToMarkdown(section.content)}
                  </Markdown>
                </View>
              ) : null}

              {listData && (
                <View style={{ paddingLeft: isRtl ? 0 : Spacing.md, paddingRight: isRtl ? Spacing.md : 0, marginBottom: Spacing.md }}>
                  {listData.items.map((item, ii) => (
                    <View key={ii} style={{ flexDirection: isRtl ? 'row-reverse' : 'row', alignItems: 'flex-start', marginBottom: 4 }}>
                      <Text style={{
                        fontSize: 14, color: colors.textSecondary, marginRight: isRtl ? 0 : 8, marginLeft: isRtl ? 8 : 0, marginTop: 2
                      }}>
                        {listData.type === 'bullet' ? '•' : `${ii + 1}.`}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Markdown style={markdownStyles}>
                          {htmlToMarkdown(item)}
                        </Markdown>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(99,102,241,0.1)',
    marginLeft: 4,
  },
  badgeText: {
    color: '#6366f1',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
});
