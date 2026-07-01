import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Keyboard,
  Platform as RNPlatform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../../context/ThemeContext';
import { Button } from '../../../components/ui/Button';
import { Toast } from '../../../components/ui/Toast';
import { useToast } from '../../../hooks/useToast';
import { useChatSSE } from '../../../hooks/useChatSSE';
import { SkeletonLoader } from '../../../components/ui/SkeletonLoader';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store/store';
import {
  fetchHistory,
  loadComparisonRecord,
  compareDocuments,
  clearActiveComparison,
  addChatMessage,
  deleteHistoryRecord,
  renameHistoryRecord,
  clearComparisonWarning,
  hydrateLastSession,
} from '../store/comparisonSlice';
import { documentService } from '../../documents/api/documentService';
import { Spacing, Typography, BorderRadius } from '../../../theme';
import { api } from '../../../services/api';

// Components
import { CompareHeader } from '../components/CompareHeader';
import { DocumentSelectorModal } from '../components/DocumentSelectorModal';
import { SelectedDocumentCard } from '../components/SelectedDocumentCard';
import { AiSynthesisCard } from '../components/AiSynthesisCard';
import { DeltaSection } from '../components/DeltaSection';
import { HistorySidebar } from '../components/HistorySidebar';
import { RenameModal } from '../components/RenameModal';
import { AiChatPanel } from '../../../components/ui/AiChatPanel';

export default function CompareScreen({ route }: { route?: any }) {
  const { colors, isDark } = useTheme();
  const { toast, showToast, hideToast } = useToast();

  const dispatch = useDispatch<AppDispatch>();
  const {
    historyList,
    activeComparison: result,
    activeChatMessages: reduxMessages,
    activeDocIdA,
    activeDocIdB,
    comparisonWarning,
    isHistoryLoading: loadingHistory,
    isComparing: comparing,
  } = useSelector((state: RootState) => state.comparison);

  const [historySearch, setHistorySearch] = useState('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [docsLoaded, setDocsLoaded] = useState(false);

  const [docsModalOpen, setDocsModalOpen] = useState(false);
  const [docsSearch, setDocsSearch] = useState('');

  const [historyOpen, setHistoryOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; current: string } | null>(null);

  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    dispatch(hydrateLastSession());
  }, []);

  useEffect(() => {
    if (comparisonWarning) {
      showToast(comparisonWarning, 'warning');
      dispatch(clearComparisonWarning());
    }
  }, [comparisonWarning]);

  // Show global comparison error (like Duplicate comparison 400 error)
  const comparisonError = useSelector((state: RootState) => state.comparison.error);
  useEffect(() => {
    if (comparisonError) {
      showToast(typeof comparisonError === 'string' ? comparisonError : 'An error occurred', 'error');
    }
  }, [comparisonError]);

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

  useEffect(() => {
    if (docsModalOpen && documents.length === 0 && !docsLoaded) {
      loadDocuments();
    }
  }, [docsModalOpen]);

  const loadHistory = async () => {
    dispatch(fetchHistory());
  };

  useEffect(() => {
    if (historyOpen && historyList.length === 0) {
      loadHistory();
    }
  }, [historyOpen]);

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
      setDocsLoaded(true);
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
      const errorMsg = typeof e === 'string' ? e : (e?.message || 'Comparison failed');
      showToast(errorMsg, 'error');
    }
  };

  const handleExportReport = async () => {
    if (!result) {
      showToast('No comparison data available to export.', 'error');
      return;
    }

    let titleA = 'Document A';
    let titleB = 'Document B';

    if (result.documents && result.documents.length >= 2) {
      titleA = result.documents[0].title;
      titleB = result.documents[1].title;
    } else {
      const docA = documents.find((d) => d._id === selected[0]);
      const docB = documents.find((d) => d._id === selected[1]);
      if (docA && docB) {
        titleA = docA.title;
        titleB = docB.title;
      } else {
        const hRec: any = historyList.find((h: any) => h.docIdA === activeDocIdA && h.docIdB === activeDocIdB);
        if (hRec?.titleA && hRec?.titleB) {
          titleA = hRec.titleA;
          titleB = hRec.titleB;
        }
      }
    }

    const synthesis = result.synthesis || result.summary || '';
    const similarities = result.similarities || [];
    const uniqueToA = result.uniqueToA || [];
    const uniqueToB = result.uniqueToB || result.differences || [];

    const reportContent = [
      `# Comparison Report: ${titleA} vs ${titleB}`,
      '',
      `## AI Synthesis`,
      synthesis,
      '',
      `## Shared Concepts`,
      similarities.length > 0 ? similarities.map((i: string) => `- ${i}`).join('\n') : '_None found._',
      '',
      `## Unique to ${titleA}`,
      uniqueToA.length > 0 ? uniqueToA.map((i: string) => `- ${i}`).join('\n') : '_None found._',
      '',
      `## Unique to ${titleB}`,
      uniqueToB.length > 0 ? uniqueToB.map((i: string) => `- ${i}`).join('\n') : '_None found._',
      '',
      `---`,
      `_Generated on ${new Date().toLocaleString()}_`,
    ].join('\n');

    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `comparison-report-${dateStr}.md`;
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, reportContent, { encoding: 'utf8' as any });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(filePath, { 
          mimeType: RNPlatform.OS === 'android' ? 'text/plain' : 'text/markdown', 
          dialogTitle: 'Export Comparison Report',
          UTI: 'net.daringfireball.markdown'
        });
      } else {
        showToast('Sharing is not available on this device.', 'error');
      }
    } catch (err) {
      showToast('Failed to export report.', 'error');
    }
  };

  const handleRename = async (customTitle: string) => {
    if (!renameTarget) return;
    try {
      await dispatch(renameHistoryRecord({ id: renameTarget.id, customTitle })).unwrap();
      setRenameTarget(null);
      showToast('Renamed successfully', 'success');
    } catch {
      showToast('Failed to rename record', 'error');
    }
  };

  const { messages, loading: chatLoading, sendMessage, setInitialMessages } = useChatSSE(`/comparison/${activeDocIdA}/${activeDocIdB}/chat`);

  useEffect(() => {
    setInitialMessages(reduxMessages);
  }, [reduxMessages, setInitialMessages]);

  const sendChatMessage = async (msg: string) => {
    if (!result || !activeDocIdA || !activeDocIdB) return;
    await sendMessage(msg);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <Toast {...toast} onHide={hideToast} />

      <CompareHeader 
        hasResult={!!result}
        onNewComparison={handleNewComparison}
        onOpenHistory={() => setHistoryOpen(true)}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.xl, paddingBottom: Spacing['4xl'] }}>

          {!result && !comparing && (
            <>
              <View>
                <Text style={{ fontSize: Typography.sizes['3xl'], fontWeight: '800', color: colors.text, marginTop: 4 }}>Compare Docs</Text>
                <Text style={{ fontSize: Typography.sizes.base, color: colors.textSecondary, marginTop: 4 }}>Select 2 documents and let AI surface similarities and differences.</Text>
              </View>

              <Button
                title={selected.length > 0 ? "Change Selection" : "Select Documents"}
                onPress={() => setDocsModalOpen(true)}
                loading={loadingDocs && !docsModalOpen}
                icon={<Ionicons name={selected.length > 0 ? "create-outline" : "folder-open-outline"} size={20} color={isDark ? '#000' : '#fff'} />}
                variant={selected.length > 0 ? 'outline' : 'primary'}
              />

              {selected.length > 0 && (
                <View style={{ gap: Spacing.sm, marginTop: Spacing.md }}>
                  <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>Selected for Comparison</Text>
                  {selected.map((docId) => {
                    const doc = documents.find(d => d._id === docId);
                    if (!doc) return null;
                    return <SelectedDocumentCard key={docId} document={doc} />;
                  })}
                </View>
              )}
            </>
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

          {result && !comparing && (
            <>
              <AiSynthesisCard 
                synthesis={result.synthesis || result.summary || ''}
                similarityPercentage={result.similarityPercentage}
              />

              {result.similarities && result.similarities.length > 0 && (
                <DeltaSection title="Shared Concepts" items={result.similarities} accentColor="#10b981" iconName="git-merge-outline" />
              )}
              {result.uniqueToA && result.uniqueToA.length > 0 && (
                <DeltaSection title="Unique to Base" items={result.uniqueToA} accentColor={colors.primary} iconName="remove-circle-outline" />
              )}
              {result.uniqueToB && result.uniqueToB.length > 0 && (
                <DeltaSection title="Unique to Comparison" items={result.uniqueToB} accentColor="#f59e0b" iconName="add-circle-outline" />
              )}
              {!result.uniqueToA && result.differences && result.differences.length > 0 && (
                <DeltaSection title="Differences" items={result.differences} accentColor="#f59e0b" iconName="git-branch-outline" />
              )}

              {/* AI Assistant toggle */}
              <TouchableOpacity
                onPress={() => setIsChatOpen((prev) => !prev)}
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
                <Ionicons name={isChatOpen ? 'chevron-up' : 'chevron-down'} size={14} color={isChatOpen ? colors.primary : colors.textSecondary} />
              </TouchableOpacity>

              {/* Export Report button */}
              <TouchableOpacity
                onPress={handleExportReport}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                  paddingVertical: 12, paddingHorizontal: Spacing.lg,
                  borderRadius: BorderRadius.xl, borderWidth: 1,
                  borderColor: isDark ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.5)',
                  backgroundColor: 'transparent',
                  marginTop: Spacing.sm,
                }}
              >
                <Ionicons name="share-outline" size={18} color={colors.primary} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
                  Export Report
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>

        <AiChatPanel
          messages={messages as any}
          isOpen={isChatOpen && !!result}
          onClose={() => setIsChatOpen(false)}
          onSendMessage={sendChatMessage}
          loading={chatLoading}
          placeholder="Ask about both documents…"
          title="AI Assistant"
          subtitle="Chat across Documents"
          suggestedPrompts={['Summarize key differences', 'Find shared topics', 'What contradictions exist?']}
        />
      </KeyboardAvoidingView>

      <DocumentSelectorModal
        visible={docsModalOpen}
        onClose={() => setDocsModalOpen(false)}
        documents={documents}
        selectedIds={selected}
        onToggleSelect={toggleSelect}
        onCompare={handleCompare}
        searchQuery={docsSearch}
        onSearchChange={setDocsSearch}
        isComparing={comparing}
      />

      <HistorySidebar
        visible={historyOpen}
        onClose={() => setHistoryOpen(false)}
        historyList={historyList}
        searchQuery={historySearch}
        onSearchChange={setHistorySearch}
        loading={loadingHistory}
        onNewComparison={handleNewComparison}
        onLoadRecord={loadHistoryRecordHandler}
        onDeleteRecord={(id) => dispatch(deleteHistoryRecord(id))}
        onRenameRecord={(id, currentName) => setRenameTarget({ id, current: currentName })}
      />

      <RenameModal
        visible={!!renameTarget}
        initialValue={renameTarget ? renameTarget.current : ''}
        onCancel={() => setRenameTarget(null)}
        onSave={handleRename}
      />
    </SafeAreaView>
  );
}
