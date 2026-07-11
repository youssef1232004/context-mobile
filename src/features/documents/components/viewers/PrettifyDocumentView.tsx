import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { Spacing, BorderRadius, Typography } from '../../../../theme';
import type { DocumentPrettifyResult } from '../../../../services/prettify.service';
import { htmlToMarkdown } from '../../../../utils/prettify-helpers';
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
            Prettified — {result.blocks?.length || 0} blocks
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
            <Ionicons name="download-outline" size={14} color="#10b981" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#10b981' }}>Download .docx</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ padding: Spacing.xl }}>
        {(() => {
          // Pre-pass for numbered list items
          const listNumbers: number[] = [];
          let currentNum = 0;
          (result.blocks || []).forEach((block) => {
            if (block.type === 'heading' || block.type === 'divider' || block.type === 'table') {
              currentNum = 0;
            } else if (block.type === 'numbered_list_item') {
              currentNum++;
            }
            listNumbers.push(currentNum);
          });

          // Markdown styling config
          const markdownStyles = {
            body: {
              color: colors.textSecondary,
              fontSize: 14,
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

          return (result.blocks || []).map((block, bi) => {
            if (block.type === 'heading') {
              let headingStyle: any = { color: colors.text, writingDirection: isRtl ? 'rtl' : 'ltr', textAlign: isRtl ? 'right' : 'left' };
              switch (block.level) {
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
              if (bi === 0) {
                headingStyle.marginTop = 0;
                headingStyle.borderTopWidth = 0;
                headingStyle.paddingTop = 0;
              }
              return (
                <Text key={bi} style={headingStyle}>{block.text}</Text>
              );
            }

            if (block.type === 'paragraph') {
              return (
                <View key={bi} style={{ marginBottom: Spacing.md }}>
                  <Markdown style={markdownStyles}>
                    {htmlToMarkdown(block.text)}
                  </Markdown>
                </View>
              );
            }

            if (block.type === 'code') {
              return (
                <View key={bi} style={{ marginBottom: Spacing.md }}>
                  <Markdown style={markdownStyles}>
                    {`\`\`\`${block.language || ''}\n${block.text}\n\`\`\``}
                  </Markdown>
                </View>
              );
            }

            if (block.type === 'quote') {
              return (
                <View key={bi} style={{ marginBottom: Spacing.md, borderLeftWidth: 4, borderLeftColor: 'rgba(139,92,246,0.5)', backgroundColor: 'rgba(139,92,246,0.05)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}>
                  <Markdown style={markdownStyles}>
                    {htmlToMarkdown(block.text)}
                  </Markdown>
                </View>
              );
            }

            if (block.type === 'bullet_list_item' || block.type === 'numbered_list_item' || block.type === 'mcq_option') {
              let prefix = '•';
              if (block.type === 'numbered_list_item') prefix = `${listNumbers[bi]}.`;
              if (block.type === 'mcq_option') prefix = `${block.letter})`;

              return (
                <View key={bi} style={{ flexDirection: isRtl ? 'row-reverse' : 'row', alignItems: 'flex-start', marginBottom: 4, paddingLeft: isRtl ? 0 : Spacing.md, paddingRight: isRtl ? Spacing.md : 0 }}>
                  <Text style={{ fontSize: 14, color: colors.textSecondary, marginRight: isRtl ? 0 : 8, marginLeft: isRtl ? 8 : 0, marginTop: 2, fontWeight: '700' }}>
                    {prefix}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Markdown style={markdownStyles}>
                      {htmlToMarkdown(block.text)}
                    </Markdown>
                  </View>
                </View>
              );
            }

            if (block.type === 'table') {
              const mdTable = `| ${block.headers.join(' | ')} |\n| ${block.headers.map(() => '---').join(' | ')} |\n${block.rows.map(row => `| ${row.join(' | ')} |`).join('\n')}`;
              return (
                <View key={bi} style={{ marginBottom: Spacing.md }}>
                  <Markdown style={markdownStyles}>
                    {mdTable}
                  </Markdown>
                </View>
              );
            }

            if (block.type === 'divider') {
              return (
                <View key={bi} style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', marginVertical: Spacing.xl }} />
              );
            }

            return null;
          });
        })()}
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
