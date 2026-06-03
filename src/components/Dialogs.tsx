import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BorderRadius, Spacing, Typography } from '../theme';

/* ── Document Action Sheet ── */
interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onShare: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export const DocumentActionSheet: React.FC<ActionSheetProps> = ({ visible, onClose, onShare, onRename, onDelete }) => {
  const { colors, isDark } = useTheme();
  if (!visible) return null;

  const actions = [
    { icon: 'share-outline' as const, label: 'Share', color: colors.primary, onPress: onShare },
    { icon: 'create-outline' as const, label: 'Rename', color: '#3b82f6', onPress: onRename },
    { icon: 'trash-outline' as const, label: 'Delete', color: '#ef4444', onPress: onDelete },
  ];

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <TouchableOpacity activeOpacity={1} style={{
          backgroundColor: isDark ? '#1e1e22' : '#fff',
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          paddingTop: Spacing.lg, paddingBottom: 40, paddingHorizontal: Spacing.xl,
        }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#ddd', alignSelf: 'center', marginBottom: Spacing.lg }} />
          {actions.map((a) => (
            <TouchableOpacity
              key={a.label}
              onPress={() => { onClose(); a.onPress(); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 14, borderBottomWidth: a.label === 'Delete' ? 0 : 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0' }}
            >
              <Ionicons name={a.icon} size={20} color={a.color} />
              <Text style={{ fontSize: Typography.sizes.base, fontWeight: '600', color: a.label === 'Delete' ? '#ef4444' : colors.text }}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

/* ── Folder Action Sheet ── */
interface FolderActionSheetProps {
  visible: boolean;
  isAIGenerated?: boolean;
  folderName?: string;
  onClose: () => void;
  onRename: () => void;
  onDownload?: () => void;
  onDelete: () => void;
}

export const FolderActionSheet: React.FC<FolderActionSheetProps> = ({ visible, isAIGenerated, folderName, onClose, onRename, onDownload, onDelete }) => {
  const { colors, isDark } = useTheme();
  if (!visible) return null;

  const actions = [];
  if (!isAIGenerated && folderName?.toLowerCase() !== 'random files') {
    actions.push({ icon: 'create-outline' as const, label: 'Rename', color: '#3b82f6', onPress: onRename });
  }
  if (isAIGenerated && onDownload) {
    actions.push({ icon: 'download-outline' as const, label: 'Download', color: '#10b981', onPress: onDownload });
  }
  actions.push({ icon: 'trash-outline' as const, label: 'Delete', color: '#ef4444', onPress: onDelete });

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <TouchableOpacity activeOpacity={1} style={{
          backgroundColor: isDark ? '#1e1e22' : '#fff',
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          paddingTop: Spacing.lg, paddingBottom: 40, paddingHorizontal: Spacing.xl,
        }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#ddd', alignSelf: 'center', marginBottom: Spacing.lg }} />
          {actions.map((a) => (
            <TouchableOpacity
              key={a.label}
              onPress={() => { onClose(); a.onPress(); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 14, borderBottomWidth: a.label === 'Delete' ? 0 : 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0' }}
            >
              <Ionicons name={a.icon} size={20} color={a.color} />
              <Text style={{ fontSize: Typography.sizes.base, fontWeight: '600', color: a.label === 'Delete' ? '#ef4444' : colors.text }}>{a.label}</Text>
            </TouchableOpacity>
          ))}
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
