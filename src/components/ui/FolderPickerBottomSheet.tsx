import React, { useState, useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Typography, BorderRadius } from '../../theme';
import type { FolderData } from '../../features/folders/api/folderService';

interface FolderPickerBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (targetFolderId: string | null) => void;
  title: string;
  actionLabel: string;
  globalFolderTree: FolderData[];
  onCreateNewFolder: (parentFolderId: string | null) => void;
  disabledFolderIds?: string[];
  isLoading?: boolean;
  isDark: boolean;
  colors: any;
}

const PickerTreeItem = ({
  folder,
  allFolders,
  level = 0,
  selectedFolderId,
  invalidDestinationIds,
  onSelect,
  isDark,
  colors,
}: {
  folder: FolderData;
  allFolders: FolderData[];
  level?: number;
  selectedFolderId: string | null;
  invalidDestinationIds: Set<string>;
  onSelect: (id: string | null) => void;
  isDark: boolean;
  colors: any;
}) => {
  const children = allFolders.filter((f) => f.parentFolder === folder._id);
  const [isExpanded, setIsExpanded] = useState(false);
  const isSelected = selectedFolderId === folder._id;
  const isInvalid = invalidDestinationIds.has(folder._id);

  return (
    <View style={{ opacity: isInvalid ? 0.4 : 1 }} pointerEvents={isInvalid ? 'none' : 'auto'}>
      <TouchableOpacity
        onPress={() => onSelect(folder._id)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 10,
          paddingRight: Spacing.md,
          paddingLeft: level * 20 + Spacing.md,
          backgroundColor: isSelected ? (isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)') : 'transparent',
          borderRadius: BorderRadius.sm,
        }}
      >
        <TouchableOpacity
          onPress={() => children.length > 0 && setIsExpanded(!isExpanded)}
          style={{ width: 24, alignItems: 'center', justifyContent: 'center', opacity: children.length > 0 ? 1 : 0 }}
          disabled={children.length === 0}
        >
          <Ionicons name={isExpanded ? 'chevron-down' : 'chevron-forward'} size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <Ionicons name={isExpanded && children.length > 0 ? 'folder-open' : 'folder'} size={22} color={isSelected ? colors.primary : '#F5C518'} style={{ marginRight: 8 }} />
        
        <Text style={{ flex: 1, fontSize: 14, fontWeight: isSelected ? '600' : '500', color: isSelected ? colors.primary : colors.text }} numberOfLines={1}>
          {folder.name}
        </Text>

        {isSelected && <Ionicons name="checkmark" size={18} color={colors.primary} />}
      </TouchableOpacity>

      {isExpanded && children.length > 0 && (
        <View>
          {children.map((child) => (
            <PickerTreeItem
              key={child._id}
              folder={child}
              allFolders={allFolders}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              invalidDestinationIds={invalidDestinationIds}
              onSelect={onSelect}
              isDark={isDark}
              colors={colors}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export const FolderPickerBottomSheet: React.FC<FolderPickerBottomSheetProps> = ({
  visible, onClose, onConfirm, title, actionLabel, globalFolderTree, onCreateNewFolder, disabledFolderIds, isLoading, isDark, colors
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const rootFolders = useMemo(() => globalFolderTree.filter((f) => !f.parentFolder), [globalFolderTree]);

  const invalidDestinationIds = useMemo(() => {
    if (!disabledFolderIds || disabledFolderIds.length === 0) return new Set<string>();
    const invalidSet = new Set<string>(disabledFolderIds);
    let added = true;
    while (added) {
      added = false;
      globalFolderTree.forEach((f) => {
        if (f.parentFolder && invalidSet.has(f.parentFolder) && !invalidSet.has(f._id)) {
          invalidSet.add(f._id);
          added = true;
        }
      });
    }
    return invalidSet;
  }, [disabledFolderIds, globalFolderTree]);

  const filteredFolders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return globalFolderTree.filter((f) => f.name.toLowerCase().includes(q) && !invalidDestinationIds.has(f._id));
  }, [search, globalFolderTree, invalidDestinationIds]);

  const selectedFolderName = useMemo(() => {
    if (selectedFolderId === null) return "My files";
    return globalFolderTree.find((f) => f._id === selectedFolderId)?.name ?? "My files";
  }, [selectedFolderId, globalFolderTree]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <TouchableOpacity style={{ flex: 1 }} onPress={!isLoading ? onClose : undefined} activeOpacity={1} />

          <View style={{ backgroundColor: isDark ? '#1E1E22' : '#FFFFFF', borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, height: '80%' }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.xl, paddingBottom: Spacing.md }}>
              <View>
                <Text style={{ fontSize: Typography.sizes.lg, fontWeight: '700', color: colors.text }}>{title}</Text>
                <Text style={{ fontSize: Typography.sizes.sm, color: colors.textSecondary }}>Choose a destination folder</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={{ paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, height: 40 }}>
                <Ionicons name="search" size={18} color={colors.textSecondary} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search folders..."
                  placeholderTextColor={colors.textSecondary}
                  style={{ flex: 1, marginLeft: Spacing.sm, color: colors.text, fontSize: 14 }}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Tree / Search Results */}
            <ScrollView style={{ flex: 1, paddingHorizontal: Spacing.md }}>
              {filteredFolders ? (
                filteredFolders.length === 0 ? (
                  <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
                    <Ionicons name="search-outline" size={32} color={colors.textSecondary} />
                    <Text style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>No folders found</Text>
                  </View>
                ) : (
                  filteredFolders.map((folder) => (
                    <TouchableOpacity
                      key={folder._id}
                      onPress={() => setSelectedFolderId(folder._id)}
                      style={{
                        flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
                        backgroundColor: selectedFolderId === folder._id ? (isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)') : 'transparent',
                        borderRadius: BorderRadius.sm,
                      }}
                    >
                      <Ionicons name="folder" size={22} color="#F5C518" style={{ marginRight: Spacing.sm }} />
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: selectedFolderId === folder._id ? '600' : '500', color: selectedFolderId === folder._id ? colors.primary : colors.text }}>
                        {folder.name}
                      </Text>
                      {selectedFolderId === folder._id && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                    </TouchableOpacity>
                  ))
                )
              ) : (
                <>
                  <TouchableOpacity
                    onPress={() => setSelectedFolderId(null)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingLeft: Spacing.md, paddingRight: Spacing.md,
                      backgroundColor: selectedFolderId === null ? (isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)') : 'transparent',
                      borderRadius: BorderRadius.sm,
                    }}
                  >
                    <View style={{ width: 24 }} />
                    <Ionicons name="folder" size={22} color={selectedFolderId === null ? colors.primary : colors.textSecondary} style={{ marginRight: 8 }} />
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: selectedFolderId === null ? '600' : '500', color: selectedFolderId === null ? colors.primary : colors.text }}>
                      My files
                    </Text>
                    {selectedFolderId === null && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                  </TouchableOpacity>

                  {rootFolders.length > 0 && <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', marginVertical: 8 }} />}

                  {rootFolders.map((folder) => (
                    <PickerTreeItem
                      key={folder._id}
                      folder={folder}
                      allFolders={globalFolderTree}
                      selectedFolderId={selectedFolderId}
                      invalidDestinationIds={invalidDestinationIds}
                      onSelect={setSelectedFolderId}
                      isDark={isDark}
                      colors={colors}
                    />
                  ))}
                </>
              )}
            </ScrollView>

            {/* Destination Strip */}
            <View style={{ padding: Spacing.md, paddingHorizontal: Spacing.xl, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="folder-outline" size={16} color={colors.textSecondary} />
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginLeft: Spacing.sm, marginRight: Spacing.xs }}>Destination:</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text, flex: 1 }} numberOfLines={1}>{selectedFolderName}</Text>
            </View>

            {/* Footer */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.xl, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', paddingBottom: Platform.OS === 'ios' ? 30 : Spacing.xl }}>
              <TouchableOpacity onPress={() => onCreateNewFolder(selectedFolderId)} disabled={isLoading} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="add-circle-outline" size={20} color={colors.textSecondary} />
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginLeft: Spacing.xs }}>New folder</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                <TouchableOpacity onPress={onClose} disabled={isLoading}>
                  <Text style={{ fontSize: 14, color: colors.text }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onConfirm(selectedFolderId)} disabled={isLoading} style={{ backgroundColor: colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md }}>
                  {isLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFF' }}>{actionLabel} here</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
