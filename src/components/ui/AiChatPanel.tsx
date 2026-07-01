import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Animated, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius } from '../../theme';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'ai';
  content: string;
}

interface AiChatPanelProps {
  messages: ChatMessage[];
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (msg: string) => Promise<void>;
  loading: boolean;
  placeholder?: string;
  title?: string;
  subtitle?: string;
  suggestedPrompts?: string[];
}

export function AiChatPanel({
  messages,
  isOpen,
  onClose,
  onSendMessage,
  loading,
  placeholder = "Ask anything...",
  title = "AI Assistant",
  subtitle,
  suggestedPrompts,
}: AiChatPanelProps) {
  const { colors, isDark } = useTheme();
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef<ScrollView>(null);
  const panelHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(panelHeight, {
      toValue: isOpen ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isOpen]);

  const handleSend = async () => {
    const msg = chatInput.trim();
    if (!msg || loading) return;
    Keyboard.dismiss();
    setChatInput('');
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
    await onSendMessage(msg);
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 150);
  };

  const markdownStyles = {
    body: { color: colors.text, fontSize: 13, lineHeight: 20 },
    paragraph: { color: colors.text, fontSize: 13, lineHeight: 20, marginBottom: 4 },
    bullet_list: { marginBottom: 4 },
    ordered_list: { marginBottom: 4 },
    list_item: { color: colors.text, fontSize: 13, lineHeight: 20 },
    strong: { fontWeight: '700' as const, color: colors.text },
    em: { fontStyle: 'italic' as const },
    code_inline: { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6', borderRadius: 4, fontFamily: 'monospace', fontSize: 12, color: colors.primary },
    fence: { backgroundColor: isDark ? '#1a1a2e' : '#f9fafb', borderRadius: 8, padding: 8 },
    heading1: { fontSize: 16, fontWeight: '800' as const, color: colors.text, marginBottom: 6 },
    heading2: { fontSize: 14, fontWeight: '700' as const, color: colors.text, marginBottom: 4 },
    heading3: { fontSize: 13, fontWeight: '700' as const, color: colors.text, marginBottom: 4 },
  };

  return (
    <Animated.View style={{
      height: panelHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 340] }),
      overflow: 'hidden',
      borderTopWidth: isOpen ? 1 : 0,
      borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
      backgroundColor: isDark ? '#0f0f11' : '#fafafa',
    }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
        borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : '#ececec',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="sparkles" size={15} color="#f59e0b" />
          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>{title}</Text>
          {subtitle && <Text style={{ fontSize: 11, color: colors.textSecondary }}>· {subtitle}</Text>}
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={chatScrollRef}
        style={{ flex: 1, paddingHorizontal: Spacing.lg }}
        contentContainerStyle={{ gap: Spacing.sm, paddingVertical: Spacing.sm }}
        onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 && !loading && (
          <Text style={{ fontSize: 12, color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center', paddingVertical: Spacing.lg }}>
            {placeholder}
          </Text>
        )}
        {messages.map((m, i) => (
          <View key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '82%', padding: Spacing.sm, borderRadius: BorderRadius.lg,
            backgroundColor: m.role === 'user'
              ? colors.primary
              : (isDark ? 'rgba(255,255,255,0.08)' : '#e8e8ec'),
          }}>
            {m.role === 'user' ? (
              <Text style={{ fontSize: 13, lineHeight: 19, fontWeight: '500', color: isDark ? '#000' : '#fff' }}>
                {m.content}
              </Text>
            ) : (
              <Markdown style={markdownStyles}>{m.content}</Markdown>
            )}
          </View>
        ))}
        {loading && (messages.length === 0 || messages[messages.length - 1].role === 'user' || (messages[messages.length - 1].role === 'assistant' && !messages[messages.length - 1].content)) && (
          <View style={{
            alignSelf: 'flex-start', flexDirection: 'row', gap: 4,
            padding: Spacing.sm, borderRadius: BorderRadius.lg,
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e8e8ec',
          }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary, opacity: 0.6 }} />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
        borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : '#e8e8ec',
      }}>
        <TextInput
          value={chatInput}
          onChangeText={setChatInput}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          style={{
            flex: 1,
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f5',
            paddingHorizontal: Spacing.md, paddingVertical: 9,
            borderRadius: BorderRadius.full, fontSize: 13,
            color: colors.text, fontWeight: '500',
          }}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!chatInput.trim() || loading}
          style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: colors.primary,
            alignItems: 'center', justifyContent: 'center',
            opacity: (!chatInput.trim() || loading) ? 0.45 : 1,
          }}
        >
          <Ionicons name="send" size={15} color={isDark ? '#000' : '#fff'} style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      </View>

      {suggestedPrompts && suggestedPrompts.length > 0 && (
        <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', color: colors.textSecondary, fontFamily: 'monospace', marginRight: 4 }}>
              Suggested
            </Text>
            {suggestedPrompts.map((prompt) => (
              <TouchableOpacity
                key={prompt}
                disabled={loading}
                onPress={async () => {
                  if (loading) return;
                  await onSendMessage(prompt);
                  setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 150);
                }}
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
                  paddingHorizontal: 10, paddingVertical: 6,
                  borderRadius: BorderRadius.md,
                  borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border,
                  opacity: loading ? 0.5 : 1,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '600', color: isDark ? 'rgba(255,255,255,0.7)' : colors.textSecondary }}>
                  "{prompt}"
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </Animated.View>
  );
}
