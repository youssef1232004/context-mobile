import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../../../../context/ThemeContext';
import { Spacing, Typography } from '../../../../theme';

interface SynthesisModalProps {
  synthesisResult: string | null;
  onClose: () => void;
}

export const SynthesisModal = React.memo(({
  synthesisResult,
  onClose,
}: SynthesisModalProps) => {
  const { colors, isDark } = useTheme();

  return (
    <Modal transparent animationType="slide" visible={!!synthesisResult} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: isDark ? '#0f0f11' : '#fff', marginTop: 50, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <Ionicons name="flask" size={24} color="#10b981" />
            <Text style={{ fontSize: Typography.sizes.xl, fontWeight: '800', color: colors.text }}>Document Synthesis</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={{ padding: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0', borderRadius: 16 }}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: Spacing['4xl'] }}>
          <Markdown style={{
            body: { color: colors.text, fontSize: Typography.sizes.base, lineHeight: 24 },
            paragraph: { color: colors.text, fontSize: Typography.sizes.base, lineHeight: 24, marginBottom: 8 },
            heading1: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 },
            heading2: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 6 },
            heading3: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
            bullet_list: { marginBottom: 8 },
            ordered_list: { marginBottom: 8 },
            list_item: { color: colors.text, fontSize: Typography.sizes.base, lineHeight: 22 },
            strong: { fontWeight: '700' as const, color: colors.text },
            em: { fontStyle: 'italic' as const },
            code_inline: { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6', borderRadius: 4, fontFamily: 'monospace', fontSize: 13, color: colors.primary },
          }}>
            {synthesisResult || ''}
          </Markdown>
        </ScrollView>
      </View>
    </Modal>
  );
});
