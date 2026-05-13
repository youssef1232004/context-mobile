import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput, Share, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Badge } from '../../../components/Badge';
import { CognitiveLoadBadge } from '../../../components/CognitiveLoadBadge';
import { SkeletonLoader } from '../../../components/SkeletonLoader';
import { BulkActionBar } from '../../../components/BulkActionBar';
import { DocumentActionSheet, RenameDialog, ConfirmDialog } from '../../../components/Dialogs';
import { Toast } from '../../../components/Toast';
import { useToast } from '../../../hooks/useToast';
import { documentService, type Document } from '../api/documentService';
import { folderService, type FolderData } from '../../folders/api/folderService';
import { Spacing, Typography, BorderRadius } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'Library'>;

const FILE_ICONS: Record<string, { name: React.ComponentProps<typeof Ionicons>['name']; color: string }> = {
  PDF:         { name: 'document-text', color: '#ef4444' },
  Word:        { name: 'document',      color: '#3b82f6' },
  Image:       { name: 'image',         color: '#8b5cf6' },
  TextSnippet: { name: 'reader',        color: '#f59e0b' },
};

export default function LibraryScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const { toast, showToast, hideToast } = useToast();

  // ── Data State ──
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FolderData | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<FolderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Filter / Sort State ──
  const [search, setSearch] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
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
  const [actionLoading, setActionLoading] = useState(false);

  // ── Fetch ──
  const fetchContents = useCallback(async (folderId?: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await folderService.getContents({
        folderId: folderId || undefined,
        search: search.trim() || undefined,
        tags: activeTags.length > 0 ? activeTags.join(',') : undefined,
        sortBy, sortOrder, limit: 50,
      });
      setCurrentFolder(res.data.currentFolder);
      setBreadcrumbs(res.data.breadcrumbs || []);
      setFolders(res.data.folders || []);
      setDocuments(res.data.documents || []);
    } catch {
      showToast('Failed to load library', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, activeTags, sortBy, sortOrder]);

  useEffect(() => { fetchContents(currentFolder?._id); }, [sortBy, sortOrder, activeTags]);
  useEffect(() => { const t = setTimeout(() => fetchContents(currentFolder?._id), 400); return () => clearTimeout(t); }, [search]);

  const onRefresh = () => { setRefreshing(true); fetchContents(currentFolder?._id, true); };

  const navigateToFolder = (folder: FolderData | null) => {
    setSelectedIds([]);
    fetchContents(folder?._id || undefined);
  };

  // ── Tags from documents ──
  const knownTags = useMemo(() => {
    const tags = new Set<string>();
    documents.forEach((d) => d.tags?.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [documents]);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  // ── Selection ──
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

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
    setActionLoading(true);
    try {
      await documentService.update(renameDoc._id, { title: newName });
      showToast('Renamed successfully', 'success');
      setRenameDoc(null);
      fetchContents(currentFolder?._id, true);
    } catch { showToast('Rename failed', 'error'); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteDoc) return;
    setActionLoading(true);
    try {
      await documentService.delete(deleteDoc._id);
      showToast('Document deleted', 'success');
      setDeleteDoc(null);
      fetchContents(currentFolder?._id, true);
    } catch { showToast('Delete failed', 'error'); }
    finally { setActionLoading(false); }
  };

  const handleBulkDelete = async () => {
    setActionLoading(true);
    try {
      await documentService.bulkDelete(selectedIds);
      showToast(`Deleted ${selectedIds.length} documents`, 'success');
      setSelectedIds([]);
      setBulkDeleteVisible(false);
      fetchContents(currentFolder?._id, true);
    } catch { showToast('Bulk delete failed', 'error'); }
    finally { setActionLoading(false); }
  };

  // ── Helpers ──
  const getIcon = (ft: string) => FILE_ICONS[ft] || { name: 'document-outline' as const, color: colors.textSecondary };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const SORT_OPTIONS = [
    { key: 'updatedAt', label: 'Date' },
    { key: 'title', label: 'Title' },
    { key: 'cognitiveLoad', label: 'Cognitive Load' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <Toast {...toast} onHide={hideToast} />

      <ScrollView
        contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.md, paddingBottom: isSelecting ? 100 : Spacing['4xl'] }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* ── Header ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.5 }}>Library</Text>
            <Text style={{ fontSize: Typography.sizes['2xl'], fontWeight: '800', color: colors.text, marginTop: 2 }}>
              {currentFolder ? currentFolder.name : 'All Documents'}
            </Text>
          </View>
          <Badge label={`${documents.length}`} variant="primary" />
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

        {/* ── Tag chips ── */}
        {knownTags.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {knownTags.map((tag) => {
                const active = activeTags.includes(tag);
                return (
                  <TouchableOpacity key={tag} onPress={() => toggleTag(tag)} style={{
                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full,
                    backgroundColor: active ? (isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.12)') : 'transparent',
                    borderWidth: 1, borderColor: active ? colors.primary : (isDark ? 'rgba(255,255,255,0.12)' : colors.border),
                  }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: active ? colors.primary : colors.textSecondary }}>#{tag}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
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

        {/* ── Documents ── */}
        {!loading && documents.length > 0 && (
          <View style={{ gap: Spacing.sm }}>
            {folders.length > 0 && <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginTop: Spacing.sm }}>Files</Text>}
            {documents.map((doc) => {
              const ic = getIcon(doc.fileType);
              const selected = selectedIds.includes(doc._id);
              return (
                <TouchableOpacity
                  key={doc._id}
                  activeOpacity={0.7}
                  onPress={() => isSelecting ? toggleSelect(doc._id) : navigation.navigate('Reading', { documentId: doc._id })}
                  onLongPress={() => toggleSelect(doc._id)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md,
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
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Empty State ── */}
        {!loading && documents.length === 0 && folders.length === 0 && (
          <View style={{ alignItems: 'center', gap: Spacing.md, paddingTop: Spacing['3xl'] }}>
            <Ionicons name="documents-outline" size={56} color={colors.textSecondary} />
            <Text style={{ fontSize: Typography.sizes.xl, fontWeight: '700', color: colors.text }}>
              {search || activeTags.length > 0 ? 'No results found' : 'Library is empty'}
            </Text>
            <Text style={{ fontSize: Typography.sizes.base, color: colors.textSecondary, textAlign: 'center' }}>
              {search || activeTags.length > 0 ? 'Try different filters.' : 'Use the Capture tab to upload your first document.'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Bulk Action Bar ── */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        onCompare={() => navigation.navigate('Compare')}
        onOrganizeAI={() => navigation.navigate('FolderProposal')}
        onDelete={() => setBulkDeleteVisible(true)}
        onClear={() => setSelectedIds([])}
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
        message={`Permanently delete ${selectedIds.length} documents?`}
        onClose={() => setBulkDeleteVisible(false)}
        onConfirm={handleBulkDelete}
        loading={actionLoading}
      />
    </SafeAreaView>
  );
}
