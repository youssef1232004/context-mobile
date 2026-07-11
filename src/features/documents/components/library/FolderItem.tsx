import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable } from '../../../../components/ui/AnimatedPressable';
import { Spacing, Typography, BorderRadius } from '../../../../theme';
import type { FolderData } from '../../../folders/api/folderService';
import { getFolderColorHex } from '../../../../utils/folderColors';

interface FolderItemProps {
  folder: FolderData;
  selected: boolean;
  isSelecting: boolean;
  isDark: boolean;
  colors: any;
  onPress: (folder: FolderData) => void;
  onLongPress: (id: string) => void;
  onActionPress: (folder: FolderData) => void;
}

export const FolderItem = React.memo(({
  folder,
  selected,
  isSelecting,
  isDark,
  colors,
  onPress,
  onLongPress,
  onActionPress,
}: FolderItemProps) => {
  const folderColorHex = getFolderColorHex(folder.color || 'yellow');

  return (
    <AnimatedPressable
      onPress={() => onPress(folder)}
      onLongPress={() => onLongPress(folder._id)}
      scaleTo={0.97}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md,
        borderRadius: BorderRadius.xl, borderWidth: 1,
        borderColor: selected ? colors.primary : (isDark ? 'rgba(255,255,255,0.08)' : colors.border),
        backgroundColor: selected ? (isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.06)') : (isDark ? 'rgba(255,255,255,0.03)' : colors.surface),
      }}>
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
      <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: `${folderColorHex}1F`, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="folder" size={22} color={folderColorHex} />
        {folder.isAIGenerated && (
          <View style={{ position: 'absolute', bottom: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: isDark ? '#18181B' : '#fff' }}>
            <Ionicons name="git-branch" size={10} color="#fff" />
          </View>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: Typography.sizes.base, fontWeight: '700', color: colors.text }}>{folder.name}</Text>
        <Text style={{ fontSize: 11, fontWeight: '500', color: colors.textSecondary }}>Folder</Text>
      </View>
      {!isSelecting && (
        <TouchableOpacity onPress={() => onActionPress(folder)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ padding: 4 }}>
          <Ionicons name="ellipsis-vertical" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </AnimatedPressable>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.folder === nextProps.folder &&
    prevProps.selected === nextProps.selected &&
    prevProps.isSelecting === nextProps.isSelecting &&
    prevProps.isDark === nextProps.isDark
  );
});
