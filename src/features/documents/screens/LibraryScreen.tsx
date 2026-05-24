import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput, Share, FlatList, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../../../context/ThemeContext';
import { Badge } from '../../../components/Badge';
import { CognitiveLoadBadge } from '../../../components/CognitiveLoadBadge';
import { SkeletonLoader } from '../../../components/SkeletonLoader';
import { BulkActionBar } from '../../../components/BulkActionBar';
import { AnimatedPressable } from '../../../components/AnimatedPressable';
import { DocumentActionSheet, RenameDialog, ConfirmDialog } from '../../../components/Dialogs';
import { Toast } from '../../../components/Toast';
import { useToast } from '../../../hooks/useToast';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store/store';
import { fetchFolderContents, updateDocumentStatuses } from '../../../store/folderSlice';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import EventSource from 'react-native-sse';
import { secureStorage } from '../../../services/secureStorage';
import { deleteDocument, bulkDeleteDocuments, synthesizeDocuments, applySemanticFolders, clearSynthesisResult } from '../../../store/documentSlice';
import { documentService, type Document } from '../api/documentService';
import { folderService, type FolderData } from '../../folders/api/folderService';
import { api } from '../../../services/api';
import { Spacing, Typography, BorderRadius } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'Library'>;

const FILE_ICONS: Record<string, { name: React.ComponentProps<typeof Ionicons>['name']; color: string }> = {
  PDF:         { name: 'document-text', color: '#ef4444' },
  Word:        { name: 'document',      color: '#3b82f6' },
  Excel:       { name: 'grid',          color: '#10b981' },
  CSV:         { name: 'grid',          color: '#10b981' },
  Image:       { name: 'image',         color: '#8b5cf6' },
  TextSnippet: { name: 'reader',        color: '#f59e0b' },
};

export default function LibraryScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const { toast, showToast, hideToast } = useToast();

  const dispatch = useDispatch<AppDispatch>();
  const { documents, folders, currentFolder, breadcrumbs, loading } = useSelector((state: RootState) => state.folder);
  const { isActionLoading: actionLoading, synthesisResult } = useSelector((state: RootState) => state.document);

  const [refreshing, setRefreshing] = useState(false);

  // ── Filter / Sort State ──
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // ── Selection State ──
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const isSelecting = selectedIds.length > 0;

  // ── Dialog State ──
  const [actionDoc, setActionDoc] = useState<Document | null>(null);
  const [renameDoc, setRenameDoc] = useState<Document | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);
  const [bulkDeleteVisible, setBulkDeleteVisible] = useState(false);

  // ── Fetch ──
  const fetchContents = useCallback((folderId?: string) => {
    dispatch(fetchFolderContents({
      folderId: folderId || undefined,
      search: search.trim() || undefined,
      sortBy, sortOrder
    })).finally(() => setRefreshing(false));
  }, [search, sortBy, sortOrder, dispatch]);

  useEffect(() => { fetchContents(currentFolder?._id); }, [sortBy, sortOrder]);
  useEffect(() => { const t = setTimeout(() => fetchContents(currentFolder?._id), 400); return () => clearTimeout(t); }, [search]);

  // ── Live Updates (SSE) ──
  useEffect(() => {
    let sse: EventSource | null = null;
    
    const connectSSE = async () => {
      const token = await secureStorage.getToken();
      const url = `${api.defaults.baseURL?.replace(/\/+$/, '')}/documents/status/stream`;
      
      sse = new EventSource(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      sse.addEventListener('message', (event) => {
        if (event?.data) {
          try {
            const data = JSON.parse(event.data);
            dispatch(updateDocumentStatuses(data));
          } catch (e) {}
        }
      });
    };
    
    connectSSE();
    
    return () => {
      if (sse) sse.close();
    };
  }, []);

  const onRefresh = () => { setRefreshing(true); fetchContents(currentFolder?._id); };

  const navigateToFolder = (folder: FolderData | null) => {
    setSelectedIds([]);
    fetchContents(folder?._id || undefined);
  };



  // ── Selection ──
  // ALL documents are selectable regardless of folder status.
  // The restriction on Organize AI is enforced in BulkActionBar via the hasOrganizedDocs prop.
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  // True if any selected doc is already organized
  const hasOrganizedDocs = selectedIds.some((id) => documents.find((d) => d._id === id)?.isOrganized);

  // ── Actions ──
  const handleShare = async (doc: Document) => {
    if (!doc.cloudinaryUrl) {
      try { await Share.share({ message: `Check out "${doc.title}" on Context` }); } catch {}
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


  const handleRename = async (newName: string) => {
    if (!renameDoc) return;
    try {
      await documentService.update(renameDoc._id, { title: newName });
      showToast('Renamed successfully', 'success');
      setRenameDoc(null);
      fetchContents(currentFolder?._id);
    } catch { showToast('Rename failed', 'error'); }
  };

  const handleDelete = async () => {
    if (!deleteDoc) return;
    try {
      await dispatch(deleteDocument(deleteDoc._id)).unwrap();
      showToast('Document deleted', 'success');
      setDeleteDoc(null);
    } catch { showToast('Delete failed', 'error'); }
  };

  const handleBulkDelete = async () => {
    try {
      await dispatch(bulkDeleteDocuments(selectedIds)).unwrap();
      showToast(`Deleted ${selectedIds.length} documents`, 'success');
      setSelectedIds([]);
      setBulkDeleteVisible(false);
    } catch { showToast('Bulk delete failed', 'error'); }
  };

  const handleSynthesize = async () => {
    try {
      await dispatch(synthesizeDocuments(selectedIds)).unwrap();
      setSelectedIds([]);
    } catch { showToast('Synthesis failed', 'error'); }
  };

  const handleOrganizeAI = async () => {
    try {
      const selectedDocs = documents
        .filter(d => selectedIds.includes(d._id))
        .map(d => ({ _id: d._id, title: d.title }));
      const res = await api.post('/ai/organize-folder', { documents: selectedDocs });
      const updates = res.data?.data?.updates || [];
      navigation.navigate('FolderProposal', { initialProposals: updates, originalDocs: selectedDocs });
      setSelectedIds([]);
    } catch {
      showToast('AI Organize failed', 'error');
    }
  };

  const handleGlobalOrganize = async () => {
    try {
      const res = await documentService.proposeGlobalFolderStructure();
      const updates = res.data?.tree || res.data || [];
      const flatUpdates: any[] = [];
      const extractUpdates = (node: any, path: string) => {
        const currentPath = path ? `${path}/${node.name}` : node.name;
        if (Array.isArray(node.documentIds)) {
          node.documentIds.forEach((id: string) => flatUpdates.push({ documentId: id, newPath: currentPath }));
        }
        if (Array.isArray(node.subfolders)) {
          node.subfolders.forEach((sub: any) => extractUpdates(sub, currentPath));
        }
      };
      if (Array.isArray(updates)) {
        updates.forEach((u) => extractUpdates(u, ''));
      }
      navigation.navigate('FolderProposal', { initialProposals: flatUpdates, originalDocs: documents });
    } catch {
      showToast('Global Organize failed', 'error');
    }
  };

  const handleDownloadFolder = async () => {
    if (!currentFolder) return;
    try {
      showToast('Preparing download...', 'info');
      const token = await secureStorage.getToken();
      const url = `${api.defaults.baseURL?.replace(/\/+$/, '')}/folders/${currentFolder._id}/download`;
      const fileUri = `${FileSystem.documentDirectory}${currentFolder.name}.zip`;
      
      const downloadRes = await FileSystem.downloadAsync(url, fileUri, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (downloadRes.status === 200) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadRes.uri);
        } else {
          showToast('Saved to device', 'success');
        }
      } else {
        showToast('Download failed', 'error');
      }
    } catch {
      showToast('Download failed', 'error');
    }
  };

  const handleReanalyze = async () => {
    if (!actionDoc) return;
    try {
      await documentService.reanalyze(actionDoc._id);
      showToast('Reanalysis started', 'success');
      fetchContents(currentFolder?._id);
    } catch { showToast('Reanalysis failed', 'error'); }
    finally {
      setActionDoc(null);
    }
  };

  // ── Helpers ──
  const getIcon = (ft: string) => FILE_ICONS[ft] || { name: 'document-outline' as const, color: colors.textSecondary };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Bug #5: Labels now match the Web dashboard exactly
  const SORT_OPTIONS = [
    { key: 'updatedAt', label: 'Last Modified' },
    { key: 'title', label: 'Name' },
    { key: 'cognitiveLoad', label: 'Cognitive Load' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <Toast {...toast} onHide={hideToast} />

      <FlatList
        data={documents}
        keyExtractor={item => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.md, paddingBottom: isSelecting ? 100 : Spacing['4xl'] }}
        windowSize={5}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        removeClippedSubviews={true}
        ListHeaderComponent={
          <View style={{ gap: Spacing.md }}>
            {/* ── Header ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.5 }}>Library</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2 }}>
              <Text style={{ fontSize: Typography.sizes['2xl'], fontWeight: '800', color: colors.text }}>
                {currentFolder ? currentFolder.name : 'All Documents'}
              </Text>
              {currentFolder && (
                <TouchableOpacity onPress={handleDownloadFolder} style={{ padding: 4 }}>
                  <Ionicons name="download-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            {!currentFolder && (
              <TouchableOpacity onPress={handleGlobalOrganize} style={{ padding: 6, backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)', borderRadius: 12 }}>
                <Ionicons name="color-wand-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
            )}
            <Badge label={`${documents.length}`} variant="primary" />
            <TouchableOpacity 
              onPress={() => navigation.navigate('Profile')}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border }}
            >
              <Ionicons name="person" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Breadcrumbs ── */}
        {currentFolder && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <TouchableOpacity onPress={() => navigateToFolder(null)}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>Root</Text>
              </TouchableOpacity>
              {breadcrumbs.map((bc) => (
                <View key={bc._id} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="chevron-forward" size={12} color={colors.textSecondary} />
                  <TouchableOpacity onPress={() => navigateToFolder(bc)}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>{bc.name}</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <Ionicons name="chevron-forward" size={12} color={colors.textSecondary} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>{currentFolder.name}</Text>
            </View>
          </ScrollView>
        )}

        {/* ── Search + Sort ── */}
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <View style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.surface,
            borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border,
            paddingHorizontal: Spacing.md, paddingVertical: 10,
          }}>
            <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
            <TextInput placeholder="Search…" placeholderTextColor={colors.textSecondary} value={search} onChangeText={setSearch}
              style={{ flex: 1, fontSize: Typography.sizes.sm, color: colors.text, fontWeight: '500' }} />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={16} color={colors.textSecondary} /></TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={() => setShowSortMenu(!showSortMenu)} style={{
            width: 44, height: 44, borderRadius: BorderRadius.xl, borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border,
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.surface,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name="swap-vertical-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ── Sort dropdown ── */}
        {showSortMenu && (
          <View style={{
            borderRadius: BorderRadius.lg, borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border,
            backgroundColor: isDark ? '#1e1e22' : '#fff', overflow: 'hidden',
          }}>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity key={opt.key} onPress={() => {
                if (sortBy === opt.key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortBy(opt.key); setSortOrder('desc'); }
                setShowSortMenu(false);
              }} style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingHorizontal: Spacing.md, paddingVertical: 12,
                borderBottomWidth: opt.key === 'cognitiveLoad' ? 0 : 1,
                borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0',
                backgroundColor: sortBy === opt.key ? (isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.05)') : 'transparent',
              }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: sortBy === opt.key ? colors.primary : colors.text }}>{opt.label}</Text>
                {sortBy === opt.key && <Ionicons name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} size={14} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        )}



        {/* ── Loading ── */}
        {loading && <SkeletonLoader count={5} type="list" />}

        {/* ── Folders ── */}
        {!loading && folders.length > 0 && (
          <View style={{ gap: Spacing.sm }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>Folders</Text>
            {folders.map((folder) => (
              <TouchableOpacity key={folder._id} onPress={() => navigateToFolder(folder)} activeOpacity={0.7}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md,
                  borderRadius: BorderRadius.xl, borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.surface,
                }}>
                <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="folder" size={22} color="#f59e0b" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.sizes.base, fontWeight: '700', color: colors.text }}>{folder.name}</Text>
                  <Text style={{ fontSize: 11, fontWeight: '500', color: colors.textSecondary }}>Folder</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

            {documents.length > 0 && folders.length > 0 && <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginTop: Spacing.sm }}>Files</Text>}
          </View>
        }
        renderItem={({ item: doc }) => {
              const ic = getIcon(doc.fileType);
              const selected = selectedIds.includes(doc._id);
              return (
                <AnimatedPressable
                  scaleTo={0.97}
                  onPress={() => isSelecting ? toggleSelect(doc._id) : navigation.navigate('Reading', { documentId: doc._id })}
                  onLongPress={() => toggleSelect(doc._id)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md,
                    borderRadius: BorderRadius.xl, borderWidth: 1,
                    borderColor: selected ? colors.primary : (isDark ? 'rgba(255,255,255,0.08)' : colors.border),
                    backgroundColor: selected ? (isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.06)') : (isDark ? 'rgba(255,255,255,0.03)' : colors.surface),
                    marginBottom: Spacing.sm
                  }}>
                  {/* Selection indicator */}
                  {isSelecting && (
                    <View style={{
                      width: 22, height: 22, borderRadius: 11, borderWidth: 2,
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.primary : 'transparent',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      {selected && <Ionicons name="checkmark" size={13} color={isDark ? '#000' : '#fff'} />}
                    </View>
                  )}

                  {/* Icon */}
                  <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: `${ic.color}18`, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={ic.name} size={20} color={ic.color} />
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '700', color: colors.text }} numberOfLines={1}>{doc.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: '500', color: colors.textSecondary }}>{doc.fileType} · {formatDate(doc.updatedAt)}</Text>
                    </View>
                    {/* Tags */}
                    {doc.tags && doc.tags.length > 0 && (
                      <View style={{ flexDirection: 'row', gap: 4, marginTop: 2 }}>
                        {doc.tags.slice(0, 2).map((tag) => (
                          <Text key={tag} style={{ fontSize: 9, fontWeight: '700', color: colors.primary, backgroundColor: `${colors.primary}15`, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, overflow: 'hidden' }}>#{tag}</Text>
                        ))}
                        {doc.tags.length > 2 && <Text style={{ fontSize: 9, fontWeight: '700', color: colors.textSecondary }}>+{doc.tags.length - 2}</Text>}
                      </View>
                    )}
                  </View>

                  {/* Cognitive load */}
                  <CognitiveLoadBadge load={doc.cognitiveLoad} compact />

                  {/* Three-dot menu */}
                  {!isSelecting && (
                    <TouchableOpacity onPress={() => setActionDoc(doc)} style={{ padding: 4 }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name="ellipsis-vertical" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </AnimatedPressable>
              );
        }}
        ListEmptyComponent={
          !loading && documents.length === 0 && folders.length === 0 ? (
            <View style={{ alignItems: 'center', gap: Spacing.md, paddingTop: Spacing['3xl'] }}>
              <Ionicons name="documents-outline" size={56} color={colors.textSecondary} />
              <Text style={{ fontSize: Typography.sizes.xl, fontWeight: '700', color: colors.text }}>
                {search ? 'No results found' : 'Library is empty'}
              </Text>
              <Text style={{ fontSize: Typography.sizes.base, color: colors.textSecondary, textAlign: 'center' }}>
                {search ? 'Try a different search.' : 'Use the Capture tab to upload your first document.'}
              </Text>
            </View>
          ) : null
        }
      />

      {/* ── Bulk Action Bar ── */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        hasOrganizedDocs={hasOrganizedDocs}
        onOrganizeAI={handleOrganizeAI}
        onSynthesize={handleSynthesize}
        onDelete={() => setBulkDeleteVisible(true)}
        onClear={() => setSelectedIds([])}
      />

      {/* ── Dialogs ── */}
      <DocumentActionSheet
        visible={!!actionDoc}
        onClose={() => setActionDoc(null)}
        onShare={() => actionDoc && handleShare(actionDoc)}
        onRename={() => { if (actionDoc) { setRenameDoc(actionDoc); setActionDoc(null); } }}
        onReanalyze={handleReanalyze}
        onDelete={() => { if (actionDoc) { setDeleteDoc(actionDoc); setActionDoc(null); } }}
      />
      <RenameDialog
        visible={!!renameDoc}
        currentName={renameDoc?.title || ''}
        onClose={() => setRenameDoc(null)}
        onConfirm={handleRename}
        loading={actionLoading}
      />
      <ConfirmDialog
        visible={!!deleteDoc}
        title="Delete Document"
        message={`Permanently delete "${deleteDoc?.title}"?`}
        onClose={() => setDeleteDoc(null)}
        onConfirm={handleDelete}
        loading={actionLoading}
      />
      <ConfirmDialog
        visible={bulkDeleteVisible}
        title="Delete Selected"
        message={`Permanently delete ${selectedIds.length} documents?`}
        onClose={() => setBulkDeleteVisible(false)}
        onConfirm={handleBulkDelete}
        loading={actionLoading}
      />

      {/* ── Synthesis Result Modal ── */}
      <Modal transparent animationType="slide" visible={!!synthesisResult} onRequestClose={() => dispatch(clearSynthesisResult())}>
        <View style={{ flex: 1, backgroundColor: isDark ? '#0f0f11' : '#fff', marginTop: 50, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <Ionicons name="flask" size={24} color="#10b981" />
              <Text style={{ fontSize: Typography.sizes.xl, fontWeight: '800', color: colors.text }}>Document Synthesis</Text>
            </View>
            <TouchableOpacity onPress={() => dispatch(clearSynthesisResult())} style={{ padding: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0', borderRadius: 16 }}>
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
    </SafeAreaView>
  );
}
