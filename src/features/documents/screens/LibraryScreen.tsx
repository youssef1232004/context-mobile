import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, RefreshControl, ActivityIndicator, BackHandler, Platform, Share, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { SkeletonLoader } from '../../../components/ui/SkeletonLoader';
import { BulkActionBar } from '../../../components/layout/BulkActionBar';
import { DocumentActionSheet, RenameDialog, ConfirmDialog, FolderActionSheet, SmartActionSheet } from '../../../components/ui/Dialogs';
import { CreateFolderDialog } from '../../../components/ui/CreateFolderDialog';
import { FolderPickerBottomSheet } from '../../../components/ui/FolderPickerBottomSheet';
import { FolderColorPicker } from '../../../components/ui/FolderColorPicker';
import { Toast } from '../../../components/ui/Toast';
import { useToast } from '../../../hooks/useToast';
import { useLibraryCache } from '../../../hooks/useLibraryCache';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store/store';
import { fetchFolderContents, fetchFolderTree, createFolderThunk, moveItemsThunk, copyItemsThunk, setFolderColorThunk, updateDocumentStatus } from '../../folders/store/folderSlice';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { FlashList } from '@shopify/flash-list';
import { secureStorage } from '../../../services/secureStorage';
import { deleteDocument, bulkDeleteDocuments, synthesizeDocuments, clearSynthesisResult } from '../store/documentSlice';
import { documentService, type Document } from '../api/documentService';
import { folderService, type FolderData } from '../../folders/api/folderService';
import { api } from '../../../services/api';
import { Spacing, Typography } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

// Components
import { DocumentItem } from '../components/library/DocumentItem';
import { FolderItem } from '../components/library/FolderItem';
import { LibraryHeader } from '../components/library/LibraryHeader';
import { EmptyLibraryState } from '../components/library/EmptyLibraryState';
import { SynthesisModal } from '../components/library/SynthesisModal';

type Props = NativeStackScreenProps<any, 'LibraryMain'>;

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

  const hasOrganizedDocs =
    selectedDocIds.some((id) => documents.find((d) => d._id === id)?.isOrganized) ||
    selectedFolderIds.some((id) => (folders.find((f) => f._id === id) as any)?.isAIGenerated);

  const allDocsFailed =
    selectedDocIds.length > 0 &&
    selectedFolderIds.length === 0 &&
    selectedDocIds.every((id) => documents.find((d) => d._id === id)?.aiStatus === 'Failed');

  // ── Dialog State ──
  const [renameDoc, setRenameDoc] = useState<Document | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);
  const [bulkDeleteVisible, setBulkDeleteVisible] = useState(false);

  // ── Folder Dialog State ──
  const [renameFolder, setRenameFolder] = useState<FolderData | null>(null);
  const [deleteFolder, setDeleteFolder] = useState<FolderData | null>(null);

  // ── New Bottom Sheets State ──
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [actionSheetMode, setActionSheetMode] = useState<'document'|'folder'|'multi'>('document');
  const [actionSheetItem, setActionSheetItem] = useState<Document|FolderData|null>(null);

  const [folderPickerVisible, setFolderPickerVisible] = useState(false);
  const [folderPickerMode, setFolderPickerMode] = useState<'move'|'copy'>('move');

  const [createFolderVisible, setCreateFolderVisible] = useState(false);
  const [createFolderParentId, setCreateFolderParentId] = useState<string|null>(null);

  const [editFolderColorVisible, setEditFolderColorVisible] = useState(false);
  const [editingFolderColor, setEditingFolderColor] = useState<string>('yellow');

  // ── Local State for Loading & Cache ──
  const [targetFolderId, setTargetFolderId] = useState<string | undefined>(undefined);
  const [hasInitialized, setHasInitialized] = useState(false);
  const currentFolderIdRef = useRef<string | undefined>(undefined);
  const fetchIdRef = useRef<number>(0);

  // ── Fetch ──
  const { isCacheLoading } = useLibraryCache({
    folderId: targetFolderId,
    search: search.trim() || undefined,
    sortBy,
    sortOrder,
    page: 1,
    limit: 10
  });

  const isActuallyLoading = (!hasInitialized && !refreshing) ? true : (loading || isCacheLoading);

  const fetchContents = useCallback((folderId?: string, page = 1) => {
    const currentFetchId = ++fetchIdRef.current;
    if (page > 1) setLoadingMore(true);
    dispatch(fetchFolderContents({
      folderId: folderId || undefined,
      search: search.trim() || undefined,
      sortBy, sortOrder,
      page, limit: 10
    })).finally(() => {
      if (currentFetchId !== fetchIdRef.current) return;
      setRefreshing(false);
      setLoadingMore(false);
      setHasInitialized(true);
    });
  }, [search, sortBy, sortOrder, dispatch]);

  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(() => fetchContents(currentFolderIdRef.current, 1), 300);
      return () => clearTimeout(t);
    }, [search, sortBy, sortOrder])
  );

  useFocusEffect(
    useCallback(() => {
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

  const navigateToFolder = useCallback((folder: FolderData | null) => {
    setSelectedDocIds([]);
    setSelectedFolderIds([]);
    const id = folder?._id || undefined;
    currentFolderIdRef.current = id;
    setTargetFolderId(id);
    fetchContents(id);
  }, [fetchContents]);

  // ── Selection ──
  const toggleSelectDoc = useCallback((id: string) => {
    setSelectedDocIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }, []);

  const toggleSelectFolder = useCallback((id: string) => {
    setSelectedFolderIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }, []);

  // ── Actions ──
  const handleShare = async (doc: Document) => {
    if (!doc.cloudinaryUrl) {
      try { await Share.share({ message: `Check out "${doc.title}" on Context` }); } catch { }
      return;
    }
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
    } catch { showToast('Folder deleted failed', 'error'); }
  };

  const handleBulkDelete = async () => {
    try {
      if (selectedDocIds.length > 0) {
        await dispatch(bulkDeleteDocuments(selectedDocIds)).unwrap();
      }
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

  const handleRetryAnalysis = async () => {
    if (!actionSheetItem || actionSheetMode !== 'document') return;
    const doc = actionSheetItem as Document;
    try {
      // Optimistically set status to Processing immediately so the icon updates
      dispatch(updateDocumentStatus({ id: doc._id, status: 'Processing' }));
      setActionSheetVisible(false);
      await documentService.reanalyze(doc._id);
      showToast('Analysis restarted', 'success');
      // Tell the poller to watch this document
      const { DeviceEventEmitter } = require('react-native');
      DeviceEventEmitter.emit('START_DOCUMENT_POLLING', doc._id);
    } catch {
      // Revert optimistic update on failure
      dispatch(updateDocumentStatus({ id: doc._id, status: 'Failed' }));
      showToast('Failed to restart analysis', 'error');
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

  const handleCreateFolder = async (name: string, color: string) => {
    try {
      await dispatch(createFolderThunk({ name, parentFolderId: createFolderParentId, color })).unwrap();
      showToast('Folder created', 'success');
      setCreateFolderVisible(false);
      setCreateFolderParentId(null);
      fetchContents(currentFolder?._id);
    } catch { showToast('Create folder failed', 'error'); }
  };

  const handleMoveCopyConfirm = async (targetFolderId: string | null) => {
    try {
      const itemsToMoveDocs = actionSheetMode === 'multi' ? selectedDocIds : (actionSheetMode === 'document' ? [(actionSheetItem as Document)._id] : []);
      const itemsToMoveFolders = actionSheetMode === 'multi' ? selectedFolderIds : (actionSheetMode === 'folder' ? [(actionSheetItem as FolderData)._id] : []);

      if (folderPickerMode === 'move') {
        await dispatch(moveItemsThunk({ documentIds: itemsToMoveDocs, folderIds: itemsToMoveFolders, targetFolderId })).unwrap();
        showToast('Items moved', 'success');
      } else {
        await dispatch(copyItemsThunk({ documentIds: itemsToMoveDocs, folderIds: itemsToMoveFolders, targetFolderId })).unwrap();
        showToast('Items copied', 'success');
      }
      setFolderPickerVisible(false);
      setSelectedDocIds([]);
      setSelectedFolderIds([]);
      fetchContents(currentFolder?._id);
    } catch { showToast(`${folderPickerMode === 'move' ? 'Move' : 'Copy'} failed`, 'error'); }
  };

  const handleSetFolderColor = async (color: string) => {
    if (!actionSheetItem || actionSheetMode !== 'folder') return;
    try {
      await dispatch(setFolderColorThunk({ folderId: (actionSheetItem as FolderData)._id, color })).unwrap();
      showToast('Folder color updated', 'success');
      setEditFolderColorVisible(false);
      fetchContents(currentFolder?._id);
    } catch { showToast('Update color failed', 'error'); }
  };

  const handleSortChange = useCallback((key: string) => {
    if (sortBy === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortOrder('desc'); }
    setShowSortMenu(false);
  }, [sortBy, sortOrder]);

  const handleDocumentPress = useCallback((id: string) => {
    if (isSelecting) toggleSelectDoc(id);
    else navigation.navigate('Reading', { documentId: id });
  }, [isSelecting, toggleSelectDoc, navigation]);

  const handleFolderPress = useCallback((folder: FolderData) => {
    if (isSelecting) toggleSelectFolder(folder._id);
    else navigateToFolder(folder);
  }, [isSelecting, toggleSelectFolder, navigateToFolder]);

  const renderDocumentItem = useCallback(({ item: doc }: { item: Document }) => {
    const selected = selectedDocIds.includes(doc._id);
    return (
      <DocumentItem
        doc={doc}
        selected={selected}
        isSelecting={isSelecting}
        isDark={isDark}
        colors={colors}
        onPress={handleDocumentPress}
        onLongPress={toggleSelectDoc}
        onActionPress={(d) => {
          setActionSheetItem(d);
          setActionSheetMode('document');
          setActionSheetVisible(true);
        }}
      />
    );
  }, [selectedDocIds, isSelecting, isDark, colors, handleDocumentPress, toggleSelectDoc,
      setActionSheetItem, setActionSheetMode, setActionSheetVisible]);

  const treeData = useSelector((state: RootState) => state.folder.tree);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <SmartActionSheet
        visible={actionSheetVisible}
        mode={actionSheetMode}
        item={actionSheetItem}
        selectedCount={selectedCount}
        onClose={() => setActionSheetVisible(false)}
        onOpenReader={() => {
          if (actionSheetMode === 'document') navigation.navigate('Reading', { documentId: (actionSheetItem as Document)._id });
          else if (actionSheetMode === 'folder') navigateToFolder(actionSheetItem as FolderData);
        }}
        onOpenFolder={() => {
          if (actionSheetMode === 'folder') navigateToFolder(actionSheetItem as FolderData);
        }}
        onShare={() => actionSheetItem && handleShare(actionSheetItem as Document)}
        onDownload={() => {}} // implement single doc download
        onDownloadFolder={() => handleDownloadFolder(actionSheetItem)}
        onMove={() => { setFolderPickerMode('move'); dispatch(fetchFolderTree()); setFolderPickerVisible(true); }}
        onCopy={() => { setFolderPickerMode('copy'); dispatch(fetchFolderTree()); setFolderPickerVisible(true); }}
        onRename={() => {
          if (actionSheetMode === 'document') setRenameDoc(actionSheetItem as Document);
          else if (actionSheetMode === 'folder') setRenameFolder(actionSheetItem as FolderData);
        }}
        onDelete={() => {
          if (actionSheetMode === 'multi') setBulkDeleteVisible(true);
          else if (actionSheetMode === 'document') setDeleteDoc(actionSheetItem as Document);
          else if (actionSheetMode === 'folder') setDeleteFolder(actionSheetItem as FolderData);
        }}
        onOrganizeAI={handleOrganizeAI}
        onSynthesizeAI={handleSynthesize}
        onRetryAnalysis={handleRetryAnalysis}
        onSetFolderColor={() => {
           setActionSheetVisible(false);
           if (actionSheetMode === 'folder' && actionSheetItem) {
             setEditingFolderColor((actionSheetItem as FolderData).color || 'yellow');
             setTimeout(() => setEditFolderColorVisible(true), 300);
           }
        }}
      />

      <FolderPickerBottomSheet
        visible={folderPickerVisible}
        onClose={() => setFolderPickerVisible(false)}
        onConfirm={handleMoveCopyConfirm}
        title={folderPickerMode === 'move' ? 'Move to' : 'Copy to'}
        actionLabel={folderPickerMode === 'move' ? 'Move' : 'Copy'}
        globalFolderTree={treeData}
        onCreateNewFolder={(parentId) => {
           setCreateFolderParentId(parentId);
           setCreateFolderVisible(true);
        }}
        disabledFolderIds={actionSheetMode === 'folder' ? [(actionSheetItem as FolderData)?._id] : (actionSheetMode === 'multi' ? selectedFolderIds : [])}
        isDark={isDark}
        colors={colors}
      />

      <CreateFolderDialog
        visible={createFolderVisible}
        onClose={() => { setCreateFolderVisible(false); setCreateFolderParentId(null); }}
        onConfirm={handleCreateFolder}
        isDark={isDark}
        colors={colors}
        parentFolderName={createFolderParentId ? treeData.find(f => f._id === createFolderParentId)?.name : 'Root'}
      />

      <RenameDialog
        visible={!!renameFolder}
        currentName={renameFolder?.name || ''}
        onClose={() => setRenameFolder(null)}
        onConfirm={handleRenameFolder}
      />

      <Modal visible={editFolderColorVisible} transparent animationType="fade" onRequestClose={() => setEditFolderColorVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setEditFolderColorVisible(false)} activeOpacity={1} />
          <View style={{ backgroundColor: isDark ? '#1E1E22' : '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: Platform.OS === 'ios' ? 30 : 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Folder Color</Text>
              <TouchableOpacity onPress={() => setEditFolderColorVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={{ paddingVertical: 16 }}>
              <FolderColorPicker selectedColor={editingFolderColor} onSelectColor={setEditingFolderColor} isDark={isDark} />
            </View>
            <View style={{ flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 24, gap: 16 }}>
              <TouchableOpacity
                onPress={() => setEditFolderColorVisible(false)}
                style={{ flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
              >
                <Text style={{ fontWeight: '600', color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleSetFolderColor(editingFolderColor)}
                style={{ flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: colors.primary }}
              >
                <Text style={{ fontWeight: '600', color: '#FFF' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

      <View style={{ flex: 1, minHeight: 200 }}>
        <FlashList
          data={(isActuallyLoading && !refreshing && documents.length === 0) ? [] : documents}
          keyExtractor={item => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <View style={{ padding: 20 }}><ActivityIndicator size="small" color={colors.primary} /></View> : <View style={{ height: 40 }} />}
          contentContainerStyle={{ padding: Spacing.xl, paddingBottom: isSelecting ? 100 : Spacing['4xl'] }}
          estimatedItemSize={72}
          ListHeaderComponent={
            <View style={{ gap: Spacing.md, paddingBottom: Spacing.md }}>
              <LibraryHeader
                currentFolder={currentFolder}
                breadcrumbs={breadcrumbs}
                user={user}
                search={search}
                onSearchChange={setSearch}
                showSortMenu={showSortMenu}
                onToggleSortMenu={() => setShowSortMenu(!showSortMenu)}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                onNavigateToFolder={navigateToFolder}
                onNavigateToProfile={() => navigation.navigate('Profile')}
                onCreateFolder={() => {
                  setCreateFolderParentId(currentFolder?._id || null);
                  setCreateFolderVisible(true);
                }}
              />

            {isActuallyLoading && !refreshing && documents.length === 0 && folders.length === 0 && <SkeletonLoader count={5} type="list" />}

            {(!isActuallyLoading || refreshing || folders.length > 0) && folders.length > 0 && (
              <View style={{ gap: Spacing.sm }}>
                <Text style={{ fontSize: 11, fontFamily: Typography.families.mono, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>Folders</Text>
                {folders.map((folder) => {
                  const selected = selectedFolderIds.includes(folder._id);
                  return (
                    <FolderItem
                      key={folder._id}
                      folder={folder}
                      selected={selected}
                      isSelecting={isSelecting}
                      isDark={isDark}
                      colors={colors}
                      onPress={handleFolderPress}
                      onLongPress={toggleSelectFolder}
                      onActionPress={(folder) => {
                        setActionSheetItem(folder);
                        setActionSheetMode('folder');
                        setActionSheetVisible(true);
                      }}
                    />
                  );
                })}
              </View>
            )}

            {documents.length > 0 && folders.length > 0 && <Text style={{ fontSize: 11, fontFamily: Typography.families.mono, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginTop: Spacing.sm }}>Files</Text>}
          </View>
        }
          renderItem={renderDocumentItem}
          ListEmptyComponent={<EmptyLibraryState search={search} loading={isActuallyLoading} hasDocuments={documents.length > 0} hasFolders={folders.length > 0} />}
        />
      </View>

      <BulkActionBar 
        selectedCount={selectedCount} 
        hasOrganizedDocs={hasOrganizedDocs}
        allDocsFailed={allDocsFailed}
        onOrganizeAI={handleOrganizeAI}
        onSynthesize={handleSynthesize}

        onDelete={() => setBulkDeleteVisible(true)}
        onClear={() => { setSelectedDocIds([]); setSelectedFolderIds([]); }}
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

      <SynthesisModal
        synthesisResult={synthesisResult}
        onClose={() => dispatch(clearSynthesisResult())}
      />
    </SafeAreaView>
  );
}
