import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Image, Share,
  KeyboardAvoidingView, Platform, Animated, Keyboard, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../../context/ThemeContext';
import { Card } from '../../../components/Card';
import { Badge } from '../../../components/Badge';
import { CognitiveLoadBadge } from '../../../components/CognitiveLoadBadge';
import { SkeletonLoader } from '../../../components/SkeletonLoader';
import { Toast } from '../../../components/Toast';
import { useToast } from '../../../hooks/useToast';
import { documentService, type Document } from '../api/documentService';
import { api } from '../../../services/api';
import { Spacing, Typography, BorderRadius } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'Reading'>;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

type ViewMode = 'content' | 'original';

export default function ReadingScreen({ route, navigation }: Props) {
  const { colors, isDark } = useTheme();
  const { toast, showToast, hideToast } = useToast();
  const documentId: string = route.params?.documentId;
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── View mode ──
  const [viewMode, setViewMode] = useState<ViewMode>('content');

  // ── Download ──
  const [downloading, setDownloading] = useState(false);

  // ── AI Chat ──
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);
  const panelHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!documentId) { setError('No document selected.'); setLoading(false); return; }
    (async () => {
      try {
        const res = await documentService.getById(documentId);
        setDoc(res.data);
        // Default to 'original' for non-text documents that have a cloudinary URL
        if (res.data?.cloudinaryUrl && res.data?.fileType !== 'TextSnippet') {
          setViewMode('original');
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load document.');
      } finally { setLoading(false); }
    })();
  }, [documentId]);

  // Load chat history when panel opens
  useEffect(() => {
    if (chatOpen && !historyLoaded && documentId) {
      (async () => {
        try {
          const res = await api.get(`/ai/chat/${documentId}`);
          const history = (res.data?.data || []).map((m: any) => ({
            role: m.role, content: m.content,
          }));
          setMessages(history);
        } catch { /* no history yet */ }
        setHistoryLoaded(true);
      })();
    }
  }, [chatOpen]);

  // Animate panel
  useEffect(() => {
    Animated.timing(panelHeight, {
      toValue: chatOpen ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [chatOpen]);

  // ── Share ──
  const handleShare = async () => {
    if (!doc?.cloudinaryUrl) {
      try { await Share.share({ message: `Check out "${doc?.title}" on Context` }); } catch {}
      return;
    }

    // The Cloudinary URL now includes the correct file extension (e.g. .docx),
    // so the OS can recognise the file type directly — no local download needed.
    try {
      await Share.share({
        message: `Check out "${doc.title}" on Context:\n${doc.cloudinaryUrl}`,
        url: doc.cloudinaryUrl,
      });
    } catch { /* cancelled */ }
  };


  // ── Download (direct to device) ──
  const handleDownload = async () => {
    if (!doc?.cloudinaryUrl) return;
    setDownloading(true);
    try {
      // Ensure filename has an extension for proper save
      let filename = doc.title.replace(/[^a-zA-Z0-9._-]/g, '_');
      if (!filename.match(/\.[a-zA-Z0-9]+$/)) {
        // Guess extension from fileType
        const extMap: Record<string, string> = { PDF: '.pdf', Word: '.docx', Image: '.png', TextSnippet: '.txt' };
        filename += extMap[doc.fileType] || '';
      }
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      const downloadResult = await FileSystem.downloadAsync(doc.cloudinaryUrl, fileUri);
      if (downloadResult.status !== 200) { showToast('Download failed', 'error'); return; }

      // Use native share sheet for all file types (Save to Files / Gallery / Share)
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

  // ── Chat ──
  const sendMessage = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    Keyboard.dismiss();
    setChatInput('');
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setChatLoading(true);
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await api.post('/ai/chat', { documentId, message: msg });
      const data = res.data?.data;
      let reply = data?.reply || 'No response from AI.';
      if (data?.insights?.length) reply += '\n\n💡 Insights:\n• ' + data.insights.join('\n• ');
      if (data?.riskWarnings?.length) reply += '\n\n⚠️ Warnings:\n• ' + data.riskWarnings.join('\n• ');
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Failed to get response. Please try again.' }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  // ── Helpers ──
  const isImage = doc?.fileType === 'Image' || !!doc?.title?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPDF = doc?.fileType === 'PDF' || !!doc?.title?.match(/\.pdf$/i);
  const isWord = doc?.fileType === 'Word' || !!doc?.title?.match(/\.(docx?)$/i);
  const isDocx = isWord && !doc?.title?.match(/\.doc$/i); // true for .docx, false for old .doc
  const isText = doc?.fileType === 'TextSnippet';
  const textContent = doc?.extractedText || doc?.summary;

  // PDF viewer URL — use Google Docs viewer for reliable in-app rendering
  const pdfViewerUrl = doc?.cloudinaryUrl
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(doc.cloudinaryUrl)}`
    : null;

  // Mammoth WebView HTML for rendering .docx in-app
  const getMammothHtml = (fileUrl: string) => {
    const bg = isDark ? '#0f0f11' : '#ffffff';
    const fg = isDark ? '#e0e0e6' : '#1a1a2e';
    const accent = '#6366f1';
    return `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1">
<script src="https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js"></script>
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
    document.getElementById('loading').style.display='none';
    document.getElementById('content').style.display='block';
    document.getElementById('content').innerHTML = result.value || '<p>No content extracted.</p>';
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
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* ── Navbar ── */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
          paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
          borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : colors.border,
        }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: Typography.sizes.base, fontWeight: '700', color: colors.text, flex: 1 }} numberOfLines={1}>
            {loading ? 'Loading…' : (doc?.title || 'Document')}
          </Text>

          {/* Download button */}
          {doc?.cloudinaryUrl && (
            <TouchableOpacity onPress={handleDownload} disabled={downloading} style={{ padding: 4 }}>
              {downloading
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Ionicons name="download-outline" size={18} color={colors.primary} />
              }
            </TouchableOpacity>
          )}

          {/* Share button */}
          {doc?.cloudinaryUrl && (
            <TouchableOpacity onPress={handleShare} style={{ padding: 4 }}>
              <Ionicons name="share-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          {/* AI Chat toggle */}
          <TouchableOpacity
            onPress={() => setChatOpen(!chatOpen)}
            style={{
              padding: 6, borderRadius: 10,
              backgroundColor: chatOpen ? (isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)') : 'transparent',
            }}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={chatOpen ? colors.primary : colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ── View Mode Toggle ── */}
        {!loading && !error && doc && doc.cloudinaryUrl && !isText && (
          <View style={{
            flexDirection: 'row', alignSelf: 'center', marginTop: Spacing.sm,
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f1f4',
            borderRadius: BorderRadius.full, padding: 3,
          }}>
            {([
              { key: 'content' as ViewMode, label: 'Extracted', icon: 'reader-outline' as const },
              { key: 'original' as ViewMode, label: isPDF ? 'PDF View' : isImage ? 'Image' : 'Original', icon: isPDF ? 'document-text-outline' as const : isImage ? 'image-outline' as const : 'document-outline' as const },
            ]).map((tab) => {
              const active = viewMode === tab.key;
              return (
                <TouchableOpacity key={tab.key} onPress={() => setViewMode(tab.key)} style={{
                  flexDirection: 'row', alignItems: 'center', gap: 5,
                  paddingHorizontal: 14, paddingVertical: 7, borderRadius: BorderRadius.full,
                  backgroundColor: active ? (isDark ? colors.primary : '#fff') : 'transparent',
                  shadowColor: active ? '#000' : 'transparent',
                  shadowOffset: { width: 0, height: 1 }, shadowOpacity: active ? 0.08 : 0, shadowRadius: 3, elevation: active ? 2 : 0,
                }}>
                  <Ionicons name={tab.icon} size={14} color={active ? (isDark ? '#000' : colors.primary) : colors.textSecondary} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: active ? (isDark ? '#000' : colors.primary) : colors.textSecondary }}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Main Content ── */}
        {viewMode === 'original' && doc?.cloudinaryUrl && !isText ? (
          // ── In-App Viewer ──
          <View style={{ flex: 1 }}>
            {isImage ? (
              <ScrollView
                contentContainerStyle={{ alignItems: 'center', padding: Spacing.lg }}
                maximumZoomScale={3}
                minimumZoomScale={1}
              >
                <Image
                  source={{ uri: doc.cloudinaryUrl }}
                  style={{ width: '100%', aspectRatio: 1, borderRadius: BorderRadius.xl }}
                  resizeMode="contain"
                />
              </ScrollView>
            ) : isPDF && pdfViewerUrl ? (
              <WebView
                source={{ uri: pdfViewerUrl }}
                style={{ flex: 1, backgroundColor: isDark ? '#0a0a0c' : '#fff' }}
                startInLoadingState
                renderLoading={() => (
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ marginTop: Spacing.md, fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>Loading PDF…</Text>
                  </View>
                )}
              />
            ) : isDocx && doc.cloudinaryUrl ? (
              // .docx — render with mammoth inside WebView
              <WebView
                originWhitelist={['*']}
                source={{ html: getMammothHtml(doc.cloudinaryUrl) }}
                style={{ flex: 1, backgroundColor: isDark ? '#0f0f11' : '#fff' }}
                javaScriptEnabled
                startInLoadingState
                renderLoading={() => (
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ marginTop: Spacing.md, fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>Rendering Word Engine…</Text>
                  </View>
                )}
              />
            ) : (
              // .doc (legacy) or unknown — fallback with download
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['2xl'], gap: Spacing.lg }}>
                <Ionicons name="document-outline" size={56} color={colors.textSecondary} />
                <Text style={{ fontSize: Typography.sizes.lg, fontWeight: '700', color: colors.text }}>Legacy Document Format</Text>
                <Text style={{ fontSize: Typography.sizes.sm, color: colors.textSecondary, textAlign: 'center' }}>
                  Old .doc files can't be rendered in-app. Use the "Extracted" tab to read the text, or download the original file.
                </Text>
                <TouchableOpacity onPress={handleDownload} disabled={downloading} style={{
                  flexDirection: 'row', alignItems: 'center', gap: 8,
                  paddingHorizontal: 20, paddingVertical: 12, borderRadius: BorderRadius.lg, backgroundColor: colors.primary,
                }}>
                  <Ionicons name="download-outline" size={18} color={isDark ? '#000' : '#fff'} />
                  <Text style={{ fontWeight: '700', color: isDark ? '#000' : '#fff' }}>{downloading ? 'Downloading…' : 'Download File'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          // ── Extracted Text / Meta view ──
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
                {/* Meta Card */}
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
                        {doc.tags.map((tag: string) => (
                          <View key={tag} style={{
                            paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full,
                            backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)',
                            borderWidth: 1, borderColor: isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)',
                          }}>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>#{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {doc.summary && (
                      <>
                        <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border }} />
                        <View style={{ gap: 4 }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>AI Summary</Text>
                          <Text style={{ fontSize: Typography.sizes.sm, color: colors.text, lineHeight: 20 }}>{doc.summary}</Text>
                        </View>
                      </>
                    )}
                  </View>
                </Card>

                {/* Content preview */}
                {textContent ? (
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
                )}
              </>
            )}
          </ScrollView>
        )}

        {/* ── AI Chat Panel ── */}
        <Animated.View style={{
          height: panelHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 340] }),
          overflow: 'hidden',
          borderTopWidth: chatOpen ? 1 : 0,
          borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
          backgroundColor: isDark ? '#0f0f11' : '#fafafa',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="sparkles" size={16} color="#f59e0b" />
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>AI Assistant</Text>
            </View>
            <TouchableOpacity onPress={() => setChatOpen(false)}>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={chatScrollRef}
            style={{ flex: 1, paddingHorizontal: Spacing.lg }}
            contentContainerStyle={{ gap: Spacing.sm, paddingBottom: Spacing.sm }}
            onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.length === 0 && !chatLoading && (
              <Text style={{ fontSize: 12, color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center', paddingVertical: Spacing.lg }}>
                Ask anything about this document…
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
                <Text style={{
                  fontSize: 13, lineHeight: 19, fontWeight: '500',
                  color: m.role === 'user' ? (isDark ? '#000' : '#fff') : colors.text,
                }}>
                  {m.content}
                </Text>
              </View>
            ))}
            {chatLoading && (
              <View style={{
                alignSelf: 'flex-start', flexDirection: 'row', gap: 4,
                padding: Spacing.sm, borderRadius: BorderRadius.lg,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e8e8ec',
              }}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={{
                    width: 7, height: 7, borderRadius: 4,
                    backgroundColor: colors.primary, opacity: 0.6,
                  }} />
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
              placeholder="Ask about this document…"
              placeholderTextColor={colors.textSecondary}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              style={{
                flex: 1, fontSize: 13, color: colors.text, fontWeight: '500',
                paddingHorizontal: Spacing.md, paddingVertical: 8,
                borderRadius: BorderRadius.lg, borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border,
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
              }}
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!chatInput.trim() || chatLoading}
              style={{
                width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                backgroundColor: chatInput.trim() ? colors.primary : (isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'),
              }}
            >
              <Ionicons name="send" size={16} color={chatInput.trim() ? (isDark ? '#000' : '#fff') : colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
