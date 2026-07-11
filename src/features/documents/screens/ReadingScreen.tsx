import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSelector } from 'react-redux';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useTheme } from '../../../context/ThemeContext';
import { Card } from '../../../components/ui/Card';
import { SkeletonLoader } from '../../../components/ui/SkeletonLoader';
import { Toast } from '../../../components/ui/Toast';
import { useToast } from '../../../hooks/useToast';
import { useChatSSE } from '../../../hooks/useChatSSE';
import { documentService, type Document } from '../api/documentService';
import { api } from '../../../services/api';
import { Spacing, Typography, BorderRadius } from '../../../theme';
import type { RootState } from '../../../store/store';
import { useAppDispatch } from '../../../store/hooks';
import { resetPrettifyState } from '../store/documentSlice';
import { PrettifyViewer } from '../components/viewers/PrettifyViewer';

// Components
import { DocumentNavbar } from '../components/readers/DocumentNavbar';
import { ViewModeToggle, type ViewMode } from '../components/readers/ViewModeToggle';
import { OriginalViewer } from '../components/readers/OriginalViewer';
import { MetaCard } from '../components/readers/MetaCard';
import { AiChatPanel } from '../../../components/ui/AiChatPanel';

type Props = NativeStackScreenProps<any, 'Reading'>;

interface ChatMessage {
  role: 'user' | 'assistant' | 'ai';
  content: string;
}

export default function ReadingScreen({ route, navigation }: Props) {
  const { colors, isDark } = useTheme();
  const { toast, showToast, hideToast } = useToast();
  const documentId: string = route.params?.documentId;
  const dispatch = useAppDispatch();
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('content');
  const [downloading, setDownloading] = useState(false);

  // ── AI Chat ──
  const [chatOpen, setChatOpen] = useState(false);
  const { messages, loading: chatLoading, sendMessage, setInitialMessages } = useChatSSE(`/documents/${documentId}/chat`);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  // Bug #8: Reset ALL local state when documentId changes to prevent stale content bleed-through.
  useEffect(() => {
    setDoc(null);
    setLoading(true);
    setError(null);
    setViewMode('content');
    setInitialMessages([]);
    setChatOpen(false);
    setHistoryLoaded(false);
    setDownloading(false);
    setReanalyzing(false);
    dispatch(resetPrettifyState());
  }, [documentId, dispatch, setInitialMessages]);

  useEffect(() => {
    if (!documentId) { setError('No document selected.'); setLoading(false); return; }
    (async () => {
      try {
        const res = await documentService.getById(documentId);
        setDoc(res.data);
        if (res.data?.cloudinaryUrl && res.data?.fileType !== 'TextSnippet') {
          setViewMode('original');
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load document.');
      } finally { setLoading(false); }
    })();
  }, [documentId]);

  // Sync aiStatus from SSE updates
  const reduxDocuments = useSelector((state: RootState) => state.folder.documents);
  useEffect(() => {
    if (!doc || !documentId) return;
    const match = reduxDocuments.find(d => d._id === documentId);
    if (match && match.aiStatus !== doc.aiStatus) {
      setDoc(prev => prev ? { ...prev, aiStatus: match.aiStatus } : prev);
    }
  }, [reduxDocuments, documentId, doc]);

  // Load chat history
  useEffect(() => {
    if (chatOpen && !historyLoaded && documentId) {
      (async () => {
        try {
          const res = await api.get(`/documents/${documentId}/chat`);
          const history = (res.data?.data || []).map((m: any) => ({
            role: (m.role === 'ai' ? 'assistant' : m.role) as ChatMessage['role'],
            content: m.content,
          }));
          setInitialMessages(history);
        } catch { /* no history yet */ }
        setHistoryLoaded(true);
      })();
    }
  }, [chatOpen, historyLoaded, documentId, setInitialMessages]);

  const handleShare = async () => {
    if (!doc?.cloudinaryUrl) {
      try { await Share.share({ message: `Check out "${doc?.title}" on Context` }); } catch { }
      return;
    }
    try {
      await Share.share({
        message: `Check out "${doc.title}" on Context:\n${doc.cloudinaryUrl}`,
        url: doc.cloudinaryUrl,
      });
    } catch { /* cancelled */ }
  };

  const handleDownload = async () => {
    if (!doc?.cloudinaryUrl) return;
    setDownloading(true);
    try {
      let filename = doc.title.replace(/[^a-zA-Z0-9._-]/g, '_');
      if (!filename.match(/\.[a-zA-Z0-9]+$/)) {
        const extMap: Record<string, string> = { PDF: '.pdf', Word: '.docx', Image: '.png', TextSnippet: '.txt' };
        filename += extMap[doc.fileType] || '';
      }
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      const downloadResult = await FileSystem.downloadAsync(doc.cloudinaryUrl, fileUri);
      if (downloadResult.status !== 200) { showToast('Download failed', 'error'); return; }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: downloadResult.headers?.['content-type'] || 'application/octet-stream',
          dialogTitle: `Save "${doc.title}"`,
        });
      } else {
        showToast('File downloaded', 'success');
      }
    } catch {
      showToast('Download failed. Please try again.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleReanalyze = async () => {
    if (!doc) return;
    setReanalyzing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await documentService.reanalyze(doc._id);
      showToast('Re-analysis started', 'success');
      const res = await documentService.getById(doc._id);
      setDoc(res.data || res);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('Failed to start re-analysis', 'error');
    } finally {
      setReanalyzing(false);
    }
  };

  // ── Helpers ──
  const isImage = doc?.fileType === 'Image' || !!doc?.title?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPDF = doc?.fileType === 'PDF' || !!doc?.title?.match(/\.pdf$/i);
  const isWord = doc?.fileType === 'Word' || !!doc?.title?.match(/\.(docx?)$/i);
  const isDocx = isWord && !doc?.title?.match(/\.doc$/i);
  const isExcel = !!doc?.title?.match(/\.(xlsx?|xls)$/i) || doc?.fileType === 'Excel';
  const isText = doc?.fileType === 'TextSnippet';
  const textContent = doc?.extractedText || doc?.summary;

  const pdfViewerUrl = doc?.cloudinaryUrl
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(doc.cloudinaryUrl)}`
    : null;

  const getMammothHtml = (fileUrl: string) => {
    const bg = isDark ? '#0f0f11' : '#ffffff';
    const fg = isDark ? '#e0e0e6' : '#1a1a2e';
    const accent = '#6366f1';
    return `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1">
<script src="https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js"></script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:${bg}; color:${fg}; font-family:-apple-system,system-ui,sans-serif;
    padding:20px; font-size:15px; line-height:1.7; }
  h1 { font-size:24px; font-weight:800; margin-bottom:16px; color:${accent}; }
  h2 { font-size:20px; font-weight:700; margin:20px 0 10px; }
  h3 { font-size:17px; font-weight:700; margin:16px 0 8px; }
  p { margin-bottom:12px; text-align:justify; }
  ul,ol { padding-left:20px; margin-bottom:12px; }
  li { margin-bottom:4px; }
  table { width:100%; border-collapse:collapse; margin:12px 0; }
  td,th { border:1px solid ${isDark ? '#333' : '#ddd'}; padding:8px; font-size:13px; }
  th { background:${isDark ? '#1a1a1e' : '#f5f5f5'}; font-weight:700; }
  #loading { text-align:center; padding:60px 20px; color:${accent}; }
  #error { text-align:center; padding:40px; color:#ef4444; font-weight:700; }
</style></head><body>
<div id="loading">Rendering Word document…</div>
<div id="content" style="display:none"></div>
<div id="error" style="display:none"></div>
<script>
(async()=>{
  try {
    const res = await fetch("${fileUrl}");
    const buf = await res.arrayBuffer();
    const result = await mammoth.convertToHtml({arrayBuffer:buf});
    const cleanHtml = DOMPurify.sanitize(result.value);
    document.getElementById('loading').style.display='none';
    document.getElementById('content').style.display='block';
    document.getElementById('content').innerHTML = cleanHtml || '<p>No content extracted.</p>';
  } catch(e) {
    document.getElementById('loading').style.display='none';
    document.getElementById('error').style.display='block';
    document.getElementById('error').textContent='Failed to render: '+e.message;
  }
})();
</script></body></html>`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <Toast {...toast} onHide={hideToast} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <DocumentNavbar
          onBack={() => navigation.goBack()}
          doc={doc}
          loading={loading}
          onReanalyze={handleReanalyze}
          reanalyzing={reanalyzing}
          onDownload={handleDownload}
          downloading={downloading}
          onShare={handleShare}
          chatOpen={chatOpen}
          onToggleChat={() => setChatOpen(!chatOpen)}
        />

        {!loading && !error && doc && (doc.cloudinaryUrl && !isText || ['Word', 'Excel', 'TextSnippet'].includes(doc.fileType)) && (
          <ViewModeToggle
            doc={doc}
            viewMode={viewMode}
            onChange={setViewMode}
            isPDF={isPDF}
            isImage={isImage}
            isText={isText}
          />
        )}

        {viewMode === 'prettify' && doc ? (
          <PrettifyViewer document={doc} />
        ) : viewMode === 'original' && doc?.cloudinaryUrl && !isText ? (
          <OriginalViewer
            doc={doc}
            isImage={isImage}
            isPDF={isPDF}
            pdfViewerUrl={pdfViewerUrl}
            isDocx={isDocx}
            isExcel={isExcel}
            onDownload={handleDownload}
            downloading={downloading}
            getMammothHtml={getMammothHtml}
          />
        ) : (
          <ScrollView contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.lg, paddingBottom: chatOpen ? 10 : Spacing['4xl'] }}>
            {loading && <SkeletonLoader count={3} type="card" />}

            {error && (
              <View style={{ alignItems: 'center', gap: Spacing.md, paddingTop: Spacing['3xl'] }}>
                <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
                <Text style={{ fontSize: Typography.sizes.lg, fontWeight: '700', color: colors.text }}>{error}</Text>
              </View>
            )}

            {!loading && !error && doc && (
              <>
                <MetaCard doc={doc} />

                {(isImage || isText) && (
                  textContent ? (
                    <Card title="Content" headerIcon={<Ionicons name="reader-outline" size={18} color={colors.primary} />}>
                      <Text style={{ fontSize: Typography.sizes.sm, color: colors.text, lineHeight: 22, fontWeight: '400' }}>
                        {textContent}
                      </Text>
                    </Card>
                  ) : (
                    <View style={{
                      alignItems: 'center', gap: Spacing.md, padding: Spacing['2xl'],
                      borderRadius: BorderRadius.xl, borderWidth: 1, borderStyle: 'dashed',
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border,
                    }}>
                      <Ionicons name="reader-outline" size={36} color={colors.textSecondary} />
                      <Text style={{ fontSize: Typography.sizes.base, fontWeight: '600', color: colors.text }}>No extracted text</Text>
                      <Text style={{ fontSize: Typography.sizes.sm, color: colors.textSecondary, textAlign: 'center' }}>
                        {doc.cloudinaryUrl ? 'Switch to "Original" view to see the file.' : 'No content available for this document.'}
                      </Text>
                    </View>
                  )
                )}
              </>
            )}
          </ScrollView>
        )}

        <AiChatPanel
          messages={messages as any}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          onSendMessage={sendMessage}
          loading={chatLoading}
          placeholder="Ask about this document…"
          title="AI Assistant"
          subtitle="Chat with Document"
          suggestedPrompts={['Summarize this document', 'What are the key takeaways?', 'Explain like I am 5']}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
