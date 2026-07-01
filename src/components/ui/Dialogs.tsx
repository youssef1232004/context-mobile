import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { BorderRadius, Spacing, Typography } from '../../theme';

/* ── Smart Action Sheet ── */
export interface SmartActionSheetProps {
  visible: boolean;
  mode: 'document' | 'folder' | 'multi';
  item: any | null; // Document or FolderData
  selectedCount: number;
  onClose: () => void;
  onOpenReader?: () => void;
  onOpenFolder?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
  onMove?: () => void;
  onCopy?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onOrganizeAI?: () => void;
  onSynthesizeAI?: () => void;
  onDownloadFolder?: () => void;
  onSetFolderColor?: () => void;
}

export const SmartActionSheet: React.FC<SmartActionSheetProps> = ({
  visible, mode, item, selectedCount, onClose,
  onOpenReader, onOpenFolder, onShare, onDownload, onMove, onCopy, onRename, onDelete,
  onOrganizeAI, onSynthesizeAI, onDownloadFolder, onSetFolderColor
}) => {
  const { colors, isDark } = useTheme();
  if (!visible) return null;

  // Build groups based on mode
  const actionGroups: { icon: string; label: string; color: string; onPress?: () => void; danger?: boolean }[][] = [];

  if (mode === 'document' && item) {
    const doc = item;
    actionGroups.push([
      { icon: 'book-outline', label: 'Open Reader', color: colors.primary, onPress: onOpenReader },
      { icon: 'share-outline', label: 'Share', color: colors.text, onPress: onShare },
      { icon: 'download-outline', label: 'Download', color: colors.text, onPress: onDownload },
    ]);
    if (!doc.isOrganized) {
       actionGroups.push([{ icon: 'sparkles', label: 'Organize with AI', color: '#8b5cf6', onPress: onOrganizeAI }]);
    }
    actionGroups.push([
      { icon: 'folder-open-outline', label: 'Move to...', color: colors.text, onPress: onMove },
      { icon: 'copy-outline', label: 'Copy to...', color: colors.text, onPress: onCopy },
      { icon: 'create-outline', label: 'Rename', color: colors.text, onPress: onRename },
    ]);
    actionGroups.push([
      { icon: 'trash-outline', label: 'Delete', color: '#ef4444', onPress: onDelete, danger: true },
    ]);
  } else if (mode === 'folder' && item) {
    actionGroups.push([
      { icon: 'folder-open-outline', label: 'Open Folder', color: colors.primary, onPress: onOpenFolder },
      { icon: 'download-outline', label: 'Download ZIP', color: colors.text, onPress: onDownloadFolder },
    ]);
    actionGroups.push([
      { icon: 'sparkles', label: 'Organize with AI', color: '#8b5cf6', onPress: onOrganizeAI },
      { icon: 'flask-outline', label: 'Synthesize AI', color: '#8b5cf6', onPress: onSynthesizeAI },
    ]);
    actionGroups.push([
      { icon: 'folder-open-outline', label: 'Move to...', color: colors.text, onPress: onMove },
      { icon: 'copy-outline', label: 'Copy to...', color: colors.text, onPress: onCopy },
      { icon: 'color-palette-outline', label: 'Folder Color', color: colors.text, onPress: onSetFolderColor },
      { icon: 'create-outline', label: 'Rename', color: colors.text, onPress: onRename },
    ]);
    actionGroups.push([
      { icon: 'trash-outline', label: 'Delete', color: '#ef4444', onPress: onDelete, danger: true },
    ]);
  }

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <TouchableOpacity activeOpacity={1} style={{
          backgroundColor: isDark ? '#1e1e22' : '#fff',
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          paddingTop: Spacing.lg, paddingBottom: 40,
        }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#ddd', alignSelf: 'center', marginBottom: Spacing.md }} />
          
          {item && (
             <View style={{ paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
               <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }} numberOfLines={1}>{item.name || item.title}</Text>
               <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{mode === 'document' ? 'Document' : 'Folder'}</Text>
             </View>
          )}

          <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
            {actionGroups.map((group, groupIndex) => (
              <View key={`group-${groupIndex}`} style={{ borderBottomWidth: groupIndex < actionGroups.length - 1 ? 1 : 0, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', paddingVertical: Spacing.xs }}>
                {group.map((a) => (
                  <TouchableOpacity
                    key={a.label}
                    onPress={() => { onClose(); a.onPress?.(); }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 14, paddingHorizontal: Spacing.xl }}
                  >
                    <Ionicons name={a.icon as any} size={22} color={a.danger ? '#ef4444' : a.color} />
                    <Text style={{ fontSize: Typography.sizes.base, fontWeight: '500', color: a.danger ? '#ef4444' : a.color }}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

/* ── Rename Dialog ── */
interface RenameProps {
  visible: boolean;
  currentName: string;
  onClose: () => void;
  onConfirm: (newName: string) => void;
  loading?: boolean;
}

export const RenameDialog: React.FC<RenameProps> = ({ visible, currentName, onClose, onConfirm, loading }) => {
  const { colors, isDark } = useTheme();

  // Bug #7: Split name into base + extension so the user can never corrupt the file type.
  // e.g. "Report Q3.pdf" → baseName="Report Q3", ext=".pdf"
  const getExtension = (name: string) => {
    const match = name.match(/\.[a-zA-Z0-9]{1,6}$/);
    return match ? match[0] : '';
  };
  const ext = getExtension(currentName);
  const initialBase = ext ? currentName.slice(0, -ext.length) : currentName;

  const [baseName, setBaseName] = React.useState(initialBase);
  React.useEffect(() => {
    const e = getExtension(currentName);
    setBaseName(e ? currentName.slice(0, -e.length) : currentName);
  }, [currentName]);

  const handleSave = () => {
    const trimmed = baseName.trim();
    if (!trimmed) return;
    // Reattach the original extension — user cannot change or delete it
    onConfirm(trimmed + ext);
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 32 }}>
        <View style={{ backgroundColor: isDark ? '#1e1e22' : '#fff', borderRadius: BorderRadius.xl, padding: Spacing.xl, gap: Spacing.lg }}>
          <Text style={{ fontSize: Typography.sizes.lg, fontWeight: '800', color: colors.text }}>Rename</Text>

          {/* Input row: editable base name + static extension pill */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TextInput
              value={baseName}
              onChangeText={setBaseName}
              autoFocus
              selectTextOnFocus
              style={{
                flex: 1,
                borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.15)' : colors.border,
                borderRadius: BorderRadius.lg, padding: Spacing.md,
                fontSize: Typography.sizes.base, color: colors.text, fontWeight: '600',
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fafafa',
              }}
            />
            {/* Extension pill — read-only, matches Web behavior */}
            {!!ext && (
              <View style={{
                paddingHorizontal: 10, paddingVertical: 8,
                borderRadius: BorderRadius.lg, borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.15)' : colors.border,
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
              }}>
                <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '700', color: colors.textSecondary, fontFamily: 'monospace' }}>
                  {ext}
                </Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', gap: Spacing.sm, justifyContent: 'flex-end' }}>
            <TouchableOpacity onPress={onClose} style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
              <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '700', color: colors.textSecondary }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading || !baseName.trim()}
              style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: BorderRadius.lg, opacity: loading ? 0.5 : 1 }}
            >
              <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '700', color: isDark ? '#000' : '#fff' }}>
                {loading ? 'Saving…' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/* ── Confirm Dialog ── */
interface ConfirmProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  destructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmProps> = ({ visible, title, message, confirmText = 'Delete', onClose, onConfirm, loading, destructive = true }) => {
  const { colors, isDark } = useTheme();

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 32 }}>
        <View style={{ backgroundColor: isDark ? '#1e1e22' : '#fff', borderRadius: BorderRadius.xl, padding: Spacing.xl, gap: Spacing.md }}>
          <Text style={{ fontSize: Typography.sizes.lg, fontWeight: '800', color: colors.text }}>{title}</Text>
          <Text style={{ fontSize: Typography.sizes.sm, color: colors.textSecondary, lineHeight: 20 }}>{message}</Text>
          <View style={{ flexDirection: 'row', gap: Spacing.sm, justifyContent: 'flex-end', marginTop: Spacing.sm }}>
            <TouchableOpacity onPress={onClose} style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
              <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '700', color: colors.textSecondary }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: destructive ? '#ef4444' : colors.primary, borderRadius: BorderRadius.lg, opacity: loading ? 0.5 : 1 }}
            >
              <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '700', color: '#fff' }}>
                {loading ? 'Deleting…' : confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
