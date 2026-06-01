import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator,
  Modal, FlatList, Animated
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../../../context/ThemeContext';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Toast } from '../../../components/Toast';
import { useToast } from '../../../hooks/useToast';
import { SkeletonLoader } from '../../../components/SkeletonLoader';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store/store';
import { fetchHistory, loadComparisonRecord, compareDocuments, clearActiveComparison, addChatMessage, deleteHistoryRecord } from '../../../store/comparisonSlice';
import { comparisonService, type ComparisonResult } from '../api/comparisonService';
import { documentService } from '../../documents/api/documentService';
import { Spacing, Typography, BorderRadius } from '../../../theme';
import { api } from '../../../services/api';
import { secureStorage } from '../../../services/secureStorage';

export default function CompareScreen({ route }: { route?: any }) {
  const { colors, isDark } = useTheme();
  const { toast, showToast, hideToast } = useToast();

  const dispatch = useDispatch<AppDispatch>();
  const { historyList, activeComparison: result, activeChatMessages: messages, isHistoryLoading: loadingHistory, isComparing: comparing } = useSelector((state: RootState) => state.comparison);

  const [documents, setDocuments] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [docsLoaded, setDocsLoaded] = useState(false);

  // History modal state
  const [historyOpen, setHistoryOpen] = useState(false);

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);

  // Auto-trigger if IDs passed from Library
  const autoTriggered = useRef(false);
  useEffect(() => {
    const initialSelected: string[] = route?.params?.initialSelected || [];
    if (initialSelected.length >= 2 && !autoTriggered.current) {
      autoTriggered.current = true;
      setSelected(initialSelected);
      if (documents.length === 0) {
        loadDocuments();
      } else {
        setDocsLoaded(true);
      }
    }
  }, []);

  const loadDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await documentService.getAll();
      setDocuments(res.data || []);
      setDocsLoaded(true);
    } catch {
      showToast('Failed to load documents', 'error');
    } finally {
      setLoadingDocs(false);
    }
  };

  const loadHistory = async () => {
    dispatch(fetchHistory());
  };

  useEffect(() => {
    if (historyOpen && historyList.length === 0) {
      loadHistory();
    }
  }, [historyOpen]);

  // After selected is populated from Library params, auto-compare
  useEffect(() => {
    if (autoTriggered.current && selected.length >= 2 && documents.length > 0) {
      autoTriggered.current = false;
      handleCompare();
    }
  }, [selected, documents]);

  const loadHistoryRecordHandler = async (id: string) => {
    setHistoryOpen(false);
    try {
      const res = await dispatch(loadComparisonRecord(id)).unwrap();
      const docAId = res.record.docIdA;
      const docBId = res.record.docIdB;
      if (docAId && docBId) {
        setSelected([docAId, docBId]);
      }
    } catch {
      showToast('Failed to load comparison record', 'error');
    }
  };

  const handleNewComparison = () => {
    dispatch(clearActiveComparison());
    setSelected([]);
    setIsChatOpen(false);
    setHistoryOpen(false);
    setDocsLoaded(false);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 2 ? [...prev, id] : prev
    );
  };

  const handleCompare = async () => {
    if (selected.length < 2) {
      showToast('Select at least 2 documents to compare', 'warning');
      return;
    }
    try {
      await dispatch(compareDocuments({ selectedIds: selected, documents })).unwrap();
    } catch (e: any) {
      showToast(e || 'Comparison failed', 'error');
    }
  };

  // ── Bug #1: Chat — uses `selected` array (not result.documents which doesn't exist in compare response) ──
  const sendChatMessage = async () => {
    const msg = chatInput.trim();
    // Guard: need at least 2 selected docs and an active result
    if (!msg || chatLoading || !result || selected.length < 2) return;

    Keyboard.dismiss();
    setChatInput('');
    dispatch(addChatMessage({ role: 'user', content: msg }));
    setChatLoading(true);
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const docIdA = selected[0];
      const docIdB = selected[1];

      const response = await api.post(`/comparison/${docIdA}/${docIdB}/chat`, { message: msg });

      // Backend returns { success, data: { role: 'assistant', content: string } }
      const aiContent = response.data?.data?.content || response.data?.content || 'No response received.';
      dispatch(addChatMessage({ role: 'assistant', content: aiContent }));
    } catch (e) {
      dispatch(addChatMessage({ role: 'assistant', content: 'Failed to get response. Please try again.' }));
    } finally {
      setChatLoading(false);
      setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 150);
    }
  };

  // ── Markdown styles for chat bubbles ──
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

  // ── Bug #12: Delta section builder ──
  const DeltaSection = ({ title, items, accentColor, iconName }: { title: string; items: string[]; accentColor: string; iconName: React.ComponentProps<typeof Ionicons>['name'] }) => (
    <Card
      title={title}
      headerIcon={<Ionicons name={iconName} size={18} color={accentColor} />}
    >
      <View style={{ gap: Spacing.sm }}>
        {items.length === 0 ? (
          <Text style={{ fontSize: Typography.sizes.sm, color: colors.textSecondary, fontStyle: 'italic' }}>None found.</Text>
        ) : items.map((item: string, i: number) => (
          <View key={i} style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }}>
            <Ionicons name="ellipse" size={6} color={accentColor} style={{ marginTop: 7 }} />
            <Text style={{ flex: 1, fontSize: Typography.sizes.sm, color: colors.text, lineHeight: 20 }}>{item}</Text>
          </View>
        ))}
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <Toast {...toast} onHide={hideToast} />

      {/* ── Header ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm }}>
        <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.5 }}>
          AI Compare
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
          {result && (
            <TouchableOpacity onPress={handleNewComparison} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 }}>
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 12 }}>New</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setHistoryOpen(true)} style={{ padding: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 12 }}>History</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bug #6: keyboardVerticalOffset fixes keyboard hiding input */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.xl, paddingBottom: Spacing['4xl'] }}>

          {!docsLoaded && (
            <>
              <View>
                <Text style={{ fontSize: Typography.sizes['3xl'], fontWeight: '800', color: colors.text, marginTop: 4 }}>Compare Docs</Text>
                <Text style={{ fontSize: Typography.sizes.base, color: colors.textSecondary, marginTop: 4 }}>Select 2–3 documents and let AI surface similarities and differences.</Text>
              </View>
              <Button
                title="Load My Documents"
                onPress={loadDocuments}
                loading={loadingDocs}
                icon={<Ionicons name="folder-open-outline" size={20} color={isDark ? '#000' : '#fff'} />}
              />
            </>
          )}

          {loadingDocs && <SkeletonLoader count={4} type="list" />}

          {docsLoaded && documents.length > 0 && !result && (
            <Card
              title={`Select Documents (${selected.length}/2)`}
              headerIcon={<Ionicons name="checkbox-outline" size={18} color={colors.primary} />}
            >
              <View style={{ gap: Spacing.sm }}>
                {documents.map((doc) => {
                  const isSelected = selected.includes(doc._id);
                  return (
                    <TouchableOpacity
                      key={doc._id}
                      onPress={() => toggleSelect(doc._id)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
                        padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1,
                        borderColor: isSelected ? colors.primary : isDark ? 'rgba(255,255,255,0.08)' : colors.border,
                        backgroundColor: isSelected ? (isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.06)') : 'transparent',
                      }}
                    >
                      <View style={{
                        width: 22, height: 22, borderRadius: 11, borderWidth: 2,
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? colors.primary : 'transparent',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isSelected && <Ionicons name="checkmark" size={13} color={isDark ? '#000' : '#fff'} />}
                      </View>
                      <Ionicons name="document-text-outline" size={18} color={isSelected ? colors.primary : colors.textSecondary} />
                      <Text style={{ flex: 1, fontSize: Typography.sizes.sm, fontWeight: '600', color: colors.text }} numberOfLines={1}>
                        {doc.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>
          )}

          {selected.length >= 2 && !result && !comparing && (
            <Button
              title={`Compare ${selected.length} Documents`}
              onPress={handleCompare}
              loading={comparing}
              icon={<Ionicons name="git-compare-outline" size={20} color={isDark ? '#000' : '#fff'} />}
              fullWidth
            />
          )}

          {comparing && <SkeletonLoader count={3} type="card" />}

          {/* ── Bug #12: AI Synthesis Card ── */}
          {result && !comparing && (
            <>
              {/* AI Synthesis + Similarity Badge */}
              {(result.synthesis || result.summary) && (
                <View style={{
                  backgroundColor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)',
                  borderRadius: BorderRadius.xl, borderWidth: 1,
                  borderColor: isDark ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.2)',
                  padding: Spacing.lg, gap: Spacing.md,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="sparkles" size={16} color={isDark ? '#000' : '#fff'} />
                    </View>
                    <Text style={{ fontSize: Typography.sizes.lg, fontWeight: '800', color: colors.text }}>AI Synthesis</Text>
                  </View>

                  <Text style={{ fontSize: Typography.sizes.sm, color: colors.text, lineHeight: 22 }}>
                    {result.synthesis || result.summary}
                  </Text>

                  {result.similarityPercentage !== undefined && (
                    <View style={{ flexDirection: 'row', marginTop: Spacing.xs }}>
                      <View style={{
                        flexDirection: 'row', alignItems: 'center', gap: 6,
                        backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)',
                        borderRadius: BorderRadius.lg, borderWidth: 1,
                        borderColor: isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)',
                        paddingHorizontal: 10, paddingVertical: 5,
                      }}>
                        <Ionicons name="analytics-outline" size={14} color={colors.primary} />
                        <Text style={{ fontSize: 12, fontWeight: '800', fontFamily: 'monospace', color: colors.primary }}>
                          Similarity: {result.similarityPercentage}%
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Bug #12: DeltaBoard — Shared Concepts (similarities), Unique to Base (uniqueToA), Unique to Comparison (uniqueToB) */}
              {result.similarities && result.similarities.length > 0 && (
                <DeltaSection
                  title="Shared Concepts"
                  items={result.similarities}
                  accentColor="#10b981"
                  iconName="git-merge-outline"
                />
              )}

              {result.uniqueToA && result.uniqueToA.length > 0 && (
                <DeltaSection
                  title="Unique to Base"
                  items={result.uniqueToA}
                  accentColor={colors.primary}
                  iconName="remove-circle-outline"
                />
              )}

              {result.uniqueToB && result.uniqueToB.length > 0 && (
                <DeltaSection
                  title="Unique to Comparison"
                  items={result.uniqueToB}
                  accentColor="#f59e0b"
                  iconName="add-circle-outline"
                />
              )}

              {/* Legacy fallback: differences field from history records */}
              {!result.uniqueToA && result.differences && result.differences.length > 0 && (
                <DeltaSection
                  title="Differences"
                  items={result.differences}
                  accentColor="#f59e0b"
                  iconName="git-branch-outline"
                />
              )}

              {/* ── Chat Toggle Button — opens the AI Assistant panel ── */}
              <TouchableOpacity
                onPress={() => {
                  setIsChatOpen((prev) => !prev);
                  if (!isChatOpen) {
                    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 200);
                  }
                }}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
                  paddingVertical: 12, paddingHorizontal: Spacing.lg,
                  borderRadius: BorderRadius.xl, borderWidth: 1,
                  borderColor: isChatOpen ? colors.primary : (isDark ? 'rgba(255,255,255,0.12)' : colors.border),
                  backgroundColor: isChatOpen
                    ? (isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)')
                    : (isDark ? 'rgba(255,255,255,0.04)' : colors.surface),
                }}
              >
                <Ionicons name="sparkles" size={16} color={isChatOpen ? colors.primary : '#f59e0b'} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: isChatOpen ? colors.primary : colors.text }}>
                  AI Assistant
                </Text>
                {messages.length > 0 && (
                  <View style={{
                    backgroundColor: colors.primary, borderRadius: 10,
                    paddingHorizontal: 7, paddingVertical: 2, minWidth: 20, alignItems: 'center',
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: isDark ? '#000' : '#fff' }}>
                      {messages.length}
                    </Text>
                  </View>
                )}
                <Ionicons
                  name={isChatOpen ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={isChatOpen ? colors.primary : colors.textSecondary}
                />
              </TouchableOpacity>
            </>
          )}
        </ScrollView>

        {/* ── AI Assistant Chat Panel — fixed panel below scroll, mirroring ReadingScreen ── */}
        {isChatOpen && result && (
          <View style={{
            height: 340,
            borderTopWidth: 1,
            borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
            backgroundColor: isDark ? '#0f0f11' : '#fafafa',
          }}>
            {/* Panel header */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
              borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : '#ececec',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="sparkles" size={15} color="#f59e0b" />
                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>AI Assistant</Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>· Chat across Documents</Text>
              </View>
              <TouchableOpacity onPress={() => setIsChatOpen(false)}>
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView
              ref={chatScrollRef}
              style={{ flex: 1, paddingHorizontal: Spacing.lg }}
              contentContainerStyle={{ gap: Spacing.sm, paddingVertical: Spacing.sm }}
              onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {messages.length === 0 && !chatLoading && (
                <Text style={{ fontSize: 12, color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center', paddingVertical: Spacing.lg }}>
                  Ask anything about both documents…
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
              {chatLoading && (
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

            {/* Input row */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
              paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
              borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : '#e8e8ec',
            }}>
              <TextInput
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Ask about both documents…"
                placeholderTextColor={colors.textSecondary}
                onSubmitEditing={sendChatMessage}
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
                onPress={sendChatMessage}
                disabled={!chatInput.trim() || chatLoading}
                style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: colors.primary,
                  alignItems: 'center', justifyContent: 'center',
                  opacity: (!chatInput.trim() || chatLoading) ? 0.45 : 1,
                }}
              >
                <Ionicons name="send" size={15} color={isDark ? '#000' : '#fff'} style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ── Bug #5: History as bottom-sheet Modal ── */}
      <Modal
        visible={historyOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setHistoryOpen(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1}
          onPress={() => setHistoryOpen(false)}
        />
        <View style={{
          backgroundColor: isDark ? '#0f0f11' : '#fff',
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          padding: Spacing.xl, maxHeight: '70%',
          shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 20,
        }}>
          {/* Handle */}
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#e0e0e0', alignSelf: 'center', marginBottom: Spacing.lg }} />

          {/* Modal Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <Ionicons name="time" size={20} color={colors.primary} />
              <Text style={{ fontSize: Typography.sizes.xl, fontWeight: '800', color: colors.text }}>Comparison History</Text>
            </View>
            <TouchableOpacity onPress={() => setHistoryOpen(false)} style={{ padding: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f0f0f0', borderRadius: 12 }}>
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* New Comparison CTA */}
          <TouchableOpacity
            onPress={handleNewComparison}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
              padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1,
              borderColor: colors.primary, backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.06)',
              marginBottom: Spacing.md,
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={{ fontWeight: '700', color: colors.primary, fontSize: Typography.sizes.base }}>New Comparison</Text>
          </TouchableOpacity>

          {/* History list */}
          {loadingHistory ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: Spacing.lg }} />
          ) : historyList.length === 0 ? (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', paddingVertical: Spacing['2xl'] }}>No past comparisons yet.</Text>
          ) : (
            <FlatList
              data={historyList}
              keyExtractor={(h) => h._id!}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
              renderItem={({ item: h }) => (
                <Swipeable
                  renderRightActions={() => (
                    <TouchableOpacity
                      onPress={() => dispatch(deleteHistoryRecord(h._id!))}
                      style={{
                        backgroundColor: '#ef4444',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: 70,
                        borderTopRightRadius: BorderRadius.lg,
                        borderBottomRightRadius: BorderRadius.lg,
                      }}
                    >
                      <Ionicons name="trash" size={24} color="#fff" />
                    </TouchableOpacity>
                  )}
                >
                  <TouchableOpacity
                    onPress={() => loadHistoryRecordHandler(h._id!)}
                    style={{
                      padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1,
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.surface,
                      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
                    }}
                  >
                    <Ionicons name="git-compare-outline" size={18} color={colors.textSecondary} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '600', fontSize: Typography.sizes.sm }} numberOfLines={1}>
                        {(h as any).titleA && (h as any).titleB ? `${(h as any).titleA} vs ${(h as any).titleB}` : 'Comparison Record'}
                      </Text>
                      {h.createdAt && (
                        <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                          {new Date(h.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </Swipeable>
              )}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
