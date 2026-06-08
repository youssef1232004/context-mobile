import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput, Share, FlatList, Modal, ActivityIndicator, BackHandler, Image
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
import { DocumentActionSheet, RenameDialog, ConfirmDialog, FolderActionSheet } from '../../../components/Dialogs';
import { Toast } from '../../../components/Toast';
import { useToast } from '../../../hooks/useToast';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store/store';
import { fetchFolderContents } from '../../../store/folderSlice';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { secureStorage } from '../../../services/secureStorage';
import { deleteDocument, bulkDeleteDocuments, synthesizeDocuments, applySemanticFolders, clearSynthesisResult } from '../../../store/documentSlice';
import { documentService, type Document } from '../api/documentService';
import { folderService, type FolderData } from '../../folders/api/folderService';
import { getTagColor } from '../../../utils/tagUtils';
import { api } from '../../../services/api';
import { Spacing, Typography, BorderRadius } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<any, 'Library'>;

const FILE_ICONS: Record<string, { name: React.ComponentProps<typeof Ionicons>['name']; color: string }> = {
  PDF: { name: 'document-text', color: '#ef4444' },
  Word: { name: 'document', color: '#3b82f6' },
  Excel: { name: 'grid', color: '#10b981' },
  CSV: { name: 'grid', color: '#10b981' },
  Image: { name: 'image', color: '#8b5cf6' },
  TextSnippet: { name: 'reader', color: '#f59e0b' },
};

// ── Optimized List Item Component ──
const DocumentItem = React.memo(({
  doc,
  selected,
  isSelecting,
  isDark,
  colors,
  onPress,
  onLongPress,
  onActionPress,
}: {
  doc: Document;
  selected: boolean;
  isSelecting: boolean;
  isDark: boolean;
  colors: any;
  onPress: () => void;
  onLongPress: () => void;
  onActionPress: () => void;
}) => {
  const ic = FILE_ICONS[doc.fileType] || { name: 'document-outline' as const, color: colors.textSecondary };
  const d = new Date(doc.updatedAt);
  const now = new Date();
  const dateStr = d.toDateString() === now.toDateString()
    ? `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <AnimatedPressable
      scaleTo={0.97}
      onPress={onPress}
      onLongPress={onLongPress}
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
          <Text style={{ fontSize: 11, fontWeight: '500', color: colors.textSecondary }}>{doc.fileType} · {dateStr}</Text>
        </View>
        {/* Tags */}
        {doc.tags && doc.tags.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 4, marginTop: 2 }}>
            {doc.tags.slice(0, 2).map((tag: string) => {
              const tColor = getTagColor(tag, isDark);
              return (
                <Text key={tag} style={{ fontSize: 9, fontWeight: '700', color: tColor.text, backgroundColor: tColor.bg, borderWidth: 1, borderColor: tColor.border, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, overflow: 'hidden' }}>#{tag}</Text>
              );
            })}
            {doc.tags.length > 2 && <Text style={{ fontSize: 9, fontWeight: '700', color: colors.textSecondary }}>+{doc.tags.length - 2}</Text>}
          </View>
        )}
      </View>

      {/* Cognitive load */}
      <CognitiveLoadBadge load={doc.cognitiveLoad} compact />

      {/* Three-dot menu */}
      {!isSelecting && (
        <TouchableOpacity onPress={onActionPress} style={{ padding: 4 }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="ellipsis-vertical" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </AnimatedPressable>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.doc === nextProps.doc &&
    prevProps.selected === nextProps.selected &&
    prevProps.isSelecting === nextProps.isSelecting &&
    prevProps.isDark === nextProps.isDark
  );
});

export default function LibraryScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const { toast, showToast, hideToast } = useToast();

  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { documents, folders, currentFolder, breadcrumbs, loading, pagination } = useSelector((state: RootState) => state.folder);
  const { isActionLoading: actionLoading, synthesisResult } = useSelector((state: RootState) => state.document);

  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // ── Filter / Sort State ──
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // ── Selection State ──
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const isSelecting = selectedDocIds.length > 0 || selectedFolderIds.length > 0;
  const selectedCount = selectedDocIds.length + selectedFolderIds.length;

  // ── Dialog State ──
  const [actionDoc, setActionDoc] = useState<Document | null>(null);
  const [renameDoc, setRenameDoc] = useState<Document | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);
  const [bulkDeleteVisible, setBulkDeleteVisible] = useState(false);

  // ── Folder Dialog State ──
  const [actionFolder, setActionFolder] = useState<FolderData | null>(null);
  const [renameFolder, setRenameFolder] = useState<FolderData | null>(null);
  const [deleteFolder, setDeleteFolder] = useState<FolderData | null>(null);

  // ── Fetch ──
  const fetchContents = useCallback((folderId?: string, page = 1) => {
    if (page > 1) setLoadingMore(true);
    dispatch(fetchFolderContents({
      folderId: folderId || undefined,
      search: search.trim() || undefined,
      sortBy, sortOrder,
      page, limit: 10
    })).finally(() => {
      setRefreshing(false);
      setLoadingMore(false);
    });
  }, [search, sortBy, sortOrder, dispatch]);

  useEffect(() => { fetchContents(currentFolder?._id, 1); }, [sortBy, sortOrder]);
  useEffect(() => { const t = setTimeout(() => fetchContents(currentFolder?._id, 1), 400); return () => clearTimeout(t); }, [search]);

  // ── Auto-refresh when screen regains focus (e.g. returning from Capture after upload) ──
  useFocusEffect(
    React.useCallback(() => {
      fetchContents(currentFolder?._id, 1);
    }, [currentFolder?._id, search, sortBy, sortOrder])
  );

  // ── Hardware Back Button Interceptor ──
  // Only active when LibraryScreen is focused (not when ReadingScreen is on top)
  useFocusEffect(
    React.useCallback(() => {
      const handleBackPress = () => {
        if (currentFolder) {
          const parent = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1] : null;
          navigateToFolder(parent);
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () => subscription.remove();
    }, [currentFolder, breadcrumbs])
  );

  const onRefresh = () => { setRefreshing(true); fetchContents(currentFolder?._id, 1); };

  const loadMore = () => {
    if (!loading && !loadingMore && pagination && pagination.currentPage < pagination.totalPages) {
      fetchContents(currentFolder?._id, pagination.currentPage + 1);
    }
  };

  const navigateToFolder = (folder: FolderData | null) => {
    setSelectedDocIds([]);
    setSelectedFolderIds([]);
    fetchContents(folder?._id || undefined);
  };



  // ── Selection ──
  const toggleSelectDoc = (id: string) => {
    setSelectedDocIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleSelectFolder = (id: string) => {
    setSelectedFolderIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  // True if any selected doc is already organized OR any selected folder is AI generated
  const hasOrganizedDocs =
    selectedDocIds.some((id) => documents.find((d) => d._id === id)?.isOrganized) ||
    selectedFolderIds.some((id) => folders.find((f) => f._id === id)?.isAIGenerated);

  // ── Actions ──
  const handleShare = async (doc: Document) => {
    if (!doc.cloudinaryUrl) {
      try { await Share.share({ message: `Check out "${doc.title}" on Context` }); } catch { }
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

  const handleRenameFolder = async (newName: string) => {
    if (!renameFolder) return;
    try {
      await folderService.rename(renameFolder._id, newName);
      showToast('Folder renamed', 'success');
      setRenameFolder(null);
      fetchContents(currentFolder?._id);
    } catch { showToast('Rename failed', 'error'); }
  };

  const handleDeleteFolder = async () => {
    if (!deleteFolder) return;
    try {
      await folderService.delete(deleteFolder._id);
      showToast('Folder deleted', 'success');
      setDeleteFolder(null);
      fetchContents(currentFolder?._id);
    } catch { showToast('Delete failed', 'error'); }
  };

  const handleBulkDelete = async () => {
    try {
      if (selectedDocIds.length > 0) {
        await dispatch(bulkDeleteDocuments(selectedDocIds)).unwrap();
      }
      // Mobile currently doesn't have a bulk folder delete Redux action, so we delete them sequentially
      if (selectedFolderIds.length > 0) {
        for (const fId of selectedFolderIds) {
          await folderService.delete(fId);
        }
      }
      showToast(`Deleted ${selectedCount} items`, 'success');
      setSelectedDocIds([]);
      setSelectedFolderIds([]);
      setBulkDeleteVisible(false);
      fetchContents(currentFolder?._id);
    } catch { showToast('Bulk delete failed', 'error'); }
  };

  const handleSynthesize = async () => {
    try {
      await dispatch(synthesizeDocuments(selectedDocIds)).unwrap();
      setSelectedDocIds([]);
      setSelectedFolderIds([]);
    } catch { showToast('Synthesis failed', 'error'); }
  };

  const handleOrganizeAI = async () => {
    try {
      const selectedDocsFiltered = documents
        .filter(d => selectedDocIds.includes(d._id))
        .map(d => ({ _id: d._id, title: d.title }));
      const res = await api.post('/ai/organize-folder', { documents: selectedDocsFiltered });
      const updates = res.data?.data?.updates || [];
      navigation.navigate('FolderProposal', { initialProposals: updates, originalDocs: selectedDocsFiltered });
      setSelectedDocIds([]);
      setSelectedFolderIds([]);
    } catch {
      showToast('AI Organize failed', 'error');
    }
  };


  const handleDownloadFolder = async (folder?: any) => {
    const targetFolder = folder?._id ? folder : currentFolder;
    if (!targetFolder) return;
    try {
      showToast('Preparing download...', 'info');
      const token = await secureStorage.getToken();
      const url = `${api.defaults.baseURL?.replace(/\/+$/, '')}/folders/${targetFolder._id}/download`;
      const safeName = targetFolder.name.replace(/[^a-zA-Z0-9-_\.]/g, '_');
      const fileUri = `${FileSystem.documentDirectory}${safeName}.zip`;

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
        showToast(`Download failed (${downloadRes.status})`, 'error');
      }
    } catch (e: any) {
      console.error('Download failed:', e);
      showToast('Download failed', 'error');
    }
  };

  // Bug #5: Labels now match the Web dashboard exactly
  const SORT_OPTIONS = [
    { key: 'updatedAt', label: 'Last Modified' },
    { key: 'title', label: 'Name' },
    { key: 'cognitiveLoad', label: 'Cognitive Load' },
  ];

  const renderDocumentItem = useCallback(({ item: doc }: { item: Document }) => {
    const selected = selectedDocIds.includes(doc._id);
    return (
      <DocumentItem
        doc={doc}
        selected={selected}
        isSelecting={isSelecting}
        isDark={isDark}
        colors={colors}
        onPress={() => isSelecting ? toggleSelectDoc(doc._id) : navigation.navigate('Reading', { documentId: doc._id })}
        onLongPress={() => toggleSelectDoc(doc._id)}
        onActionPress={() => setActionDoc(doc)}
      />
    );
  }, [selectedDocIds, isSelecting, isDark, colors, navigation]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <FolderActionSheet
        visible={!!actionFolder}
        isAIGenerated={actionFolder?.isAIGenerated}
        folderName={actionFolder?.name}
        onClose={() => setActionFolder(null)}
        onRename={() => { setRenameFolder(actionFolder); setActionFolder(null); }}
        onDownload={() => { if (actionFolder) { handleDownloadFolder(actionFolder); setActionFolder(null); } }}
        onDelete={() => { setDeleteFolder(actionFolder); setActionFolder(null); }}
      />

      <RenameDialog
        visible={!!renameFolder}
        currentName={renameFolder?.name || ''}
        onClose={() => setRenameFolder(null)}
        onConfirm={handleRenameFolder}
      />

      <ConfirmDialog
        visible={!!deleteFolder}
        title="Delete Folder"
        message={`Are you sure you want to delete "${deleteFolder?.name}"? All contents will be permanently deleted.`}
        confirmText="Delete"
        destructive
        onClose={() => setDeleteFolder(null)}
        onConfirm={handleDeleteFolder}
      />

      <Toast {...toast} onHide={hideToast} />

      <FlatList
        data={(loading && !refreshing) ? [] : documents}
        keyExtractor={item => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? <View style={{ padding: 20 }}><ActivityIndicator size="small" color={colors.primary} /></View> : <View style={{ height: 40 }} />}
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
                <Text style={{ fontSize: Typography.sizes.sm, fontFamily: Typography.families.mono, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.5 }}>Library</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2 }}>
                  <Text style={{ fontSize: Typography.sizes['3xl'], fontFamily: Typography.families.display, color: colors.text }}>
                    {currentFolder ? currentFolder.name : 'Smart Library'}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Profile')}
                  style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border, overflow: 'hidden' }}
                >
                  {user?.avatar ? (
                    <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Ionicons name="person" size={24} color={colors.primary} />
                  )}
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
                flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, height: 44,
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.surface,
                borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border,
                paddingHorizontal: Spacing.md,
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
                    <Text style={{ fontSize: 13, fontFamily: Typography.families.mono, fontWeight: '600', color: sortBy === opt.key ? colors.primary : colors.text }}>{opt.label}</Text>
                    {sortBy === opt.key && <Ionicons name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} size={14} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}



            {/* ── Loading ── */}
            {loading && !refreshing && <SkeletonLoader count={5} type="list" />}

            {/* ── Folders ── */}
            {(!loading || refreshing) && folders.length > 0 && (
              <View style={{ gap: Spacing.sm }}>
                <Text style={{ fontSize: 11, fontFamily: Typography.families.mono, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>Folders</Text>
                {folders.map((folder) => {
                  const selected = selectedFolderIds.includes(folder._id);
                  return (
                    <AnimatedPressable key={folder._id}
                      onPress={() => isSelecting ? toggleSelectFolder(folder._id) : navigateToFolder(folder)}
                      onLongPress={() => toggleSelectFolder(folder._id)}
                      scaleTo={0.97}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md,
                        borderRadius: BorderRadius.xl, borderWidth: 1,
                        borderColor: selected ? colors.primary : (isDark ? 'rgba(255,255,255,0.08)' : colors.border),
                        backgroundColor: selected ? (isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.06)') : (isDark ? 'rgba(255,255,255,0.03)' : colors.surface),
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
                      <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="folder" size={22} color="#f59e0b" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: Typography.sizes.base, fontWeight: '700', color: colors.text }}>{folder.name}</Text>
                        <Text style={{ fontSize: 11, fontWeight: '500', color: colors.textSecondary }}>Folder</Text>
                      </View>
                      {!isSelecting && (
                        <TouchableOpacity onPress={() => setActionFolder(folder)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ padding: 4 }}>
                          <Ionicons name="ellipsis-vertical" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                      )}
                    </AnimatedPressable>
                  );
                })}
              </View>
            )}

            {documents.length > 0 && folders.length > 0 && <Text style={{ fontSize: 11, fontFamily: Typography.families.mono, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginTop: Spacing.sm }}>Files</Text>}
          </View>
        }
        renderItem={renderDocumentItem}
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
        selectedCount={selectedCount}
        hasOrganizedDocs={hasOrganizedDocs}
        onOrganizeAI={handleOrganizeAI}
        onSynthesize={handleSynthesize}
        onDelete={() => setBulkDeleteVisible(true)}
        onClear={() => { setSelectedDocIds([]); setSelectedFolderIds([]); }}
      />

      {/* ── Dialogs ── */}
      <DocumentActionSheet
        visible={!!actionDoc}
        onClose={() => setActionDoc(null)}
        onShare={() => actionDoc && handleShare(actionDoc)}
        onRename={() => { if (actionDoc) { setRenameDoc(actionDoc); setActionDoc(null); } }}
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
        message={`Permanently delete ${selectedCount} selected items?`}
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
