import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { Spacing, Typography, BorderRadius } from '../../../../theme';
import type { FolderData } from '../../../folders/api/folderService';
import { getFolderColorHex } from '../../../../utils/folderColors';

const SORT_OPTIONS = [
  { key: 'updatedAt', label: 'Last Modified' },
  { key: 'title', label: 'Name' },
  { key: 'cognitiveLoad', label: 'Cognitive Load' },
];

interface LibraryHeaderProps {
  currentFolder: FolderData | null;
  breadcrumbs: FolderData[];
  user: any;
  search: string;
  onSearchChange: (text: string) => void;
  showSortMenu: boolean;
  onToggleSortMenu: () => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (key: string) => void;
  onNavigateToFolder: (folder: FolderData | null) => void;
  onNavigateToProfile: () => void;
  onCreateFolder: () => void;
}

export const LibraryHeader = React.memo(({
  currentFolder,
  breadcrumbs,
  user,
  search,
  onSearchChange,
  showSortMenu,
  onToggleSortMenu,
  sortBy,
  sortOrder,
  onSortChange,
  onNavigateToFolder,
  onNavigateToProfile,
  onCreateFolder,
}: LibraryHeaderProps) => {
  const { colors, isDark } = useTheme();

  const currentFolderColor = currentFolder ? getFolderColorHex(currentFolder.color || 'yellow') : colors.text;

  return (
    <View style={{ gap: Spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: Typography.sizes.sm, fontFamily: Typography.families.mono, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.5 }}>Library</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2 }}>
            <Text style={{ fontSize: Typography.sizes['3xl'], fontFamily: Typography.families.display, color: currentFolderColor }}>
              {currentFolder ? currentFolder.name : 'Smart Library'}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <TouchableOpacity onPress={onCreateFolder} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}>
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onNavigateToProfile}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border, overflow: 'hidden' }}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <Ionicons name="person" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {currentFolder && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <TouchableOpacity onPress={() => onNavigateToFolder(null)}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>Root</Text>
            </TouchableOpacity>
            {breadcrumbs.map((bc, index) => (
              <View key={bc._id || `bc-${index}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="chevron-forward" size={12} color={colors.textSecondary} />
                <TouchableOpacity onPress={() => onNavigateToFolder(bc)}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: getFolderColorHex(bc.color || 'yellow') }}>{bc.name}</Text>
                </TouchableOpacity>
              </View>
            ))}
            <Ionicons name="chevron-forward" size={12} color={colors.textSecondary} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: currentFolderColor }}>{currentFolder.name}</Text>
          </View>
        </ScrollView>
      )}

      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <View style={{
          flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, height: 44,
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.surface,
          borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border,
          paddingHorizontal: Spacing.md,
        }}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput placeholder="Search…" placeholderTextColor={colors.textSecondary} value={search} onChangeText={onSearchChange}
            style={{ flex: 1, fontSize: Typography.sizes.sm, color: colors.text, fontWeight: '500' }} />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange('')}><Ionicons name="close-circle" size={16} color={colors.textSecondary} /></TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={onToggleSortMenu} style={{
          width: 44, height: 44, borderRadius: BorderRadius.xl, borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border,
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.surface,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name="swap-vertical-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {showSortMenu && (
        <View style={{
          borderRadius: BorderRadius.lg, borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border,
          backgroundColor: isDark ? '#1e1e22' : '#fff', overflow: 'hidden',
        }}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity key={opt.key} onPress={() => onSortChange(opt.key)} style={{
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
    </View>
  );
});
