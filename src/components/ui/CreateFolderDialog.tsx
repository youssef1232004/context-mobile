import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { FolderColorPicker } from './FolderColorPicker';
import { Spacing, Typography, BorderRadius } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

interface CreateFolderDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (name: string, color: string) => void;
  isDark: boolean;
  colors: any;
  parentFolderName?: string;
}

export const CreateFolderDialog: React.FC<CreateFolderDialogProps> = ({ visible, onClose, onConfirm, isDark, colors, parentFolderName }) => {
  const [folderName, setFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState('yellow');

  const handleConfirm = () => {
    if (folderName.trim()) {
      onConfirm(folderName.trim(), selectedColor);
      setFolderName('');
      setSelectedColor('yellow');
    }
  };

  const handleClose = () => {
    setFolderName('');
    setSelectedColor('yellow');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <TouchableOpacity style={{ flex: 1 }} onPress={handleClose} activeOpacity={1} />
          
          <View style={{ backgroundColor: isDark ? '#1E1E22' : '#FFFFFF', borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, paddingBottom: Platform.OS === 'ios' ? 30 : 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
              <View>
                <Text style={{ fontSize: Typography.sizes.lg, fontWeight: '700', color: colors.text }}>New Folder</Text>
                {parentFolderName && (
                  <Text style={{ fontSize: Typography.sizes.sm, color: colors.textSecondary }}>Inside: {parentFolderName}</Text>
                )}
              </View>
              <TouchableOpacity onPress={handleClose} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: Spacing.xl }}>
              <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: Spacing.xs }}>Name</Text>
              <TextInput
                value={folderName}
                onChangeText={setFolderName}
                placeholder="Folder name"
                placeholderTextColor={colors.textSecondary}
                autoFocus
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  color: colors.text,
                  borderRadius: BorderRadius.lg,
                  padding: Spacing.md,
                  fontSize: Typography.sizes.md,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                }}
              />
            </View>

            <FolderColorPicker selectedColor={selectedColor} onSelectColor={setSelectedColor} isDark={isDark} />

            <View style={{ flexDirection: 'row', padding: Spacing.xl, paddingTop: Spacing.md, gap: Spacing.md }}>
              <TouchableOpacity
                onPress={handleClose}
                style={{ flex: 1, padding: Spacing.md, borderRadius: BorderRadius.lg, alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
              >
                <Text style={{ fontWeight: '600', color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirm}
                disabled={!folderName.trim()}
                style={{ flex: 1, padding: Spacing.md, borderRadius: BorderRadius.lg, alignItems: 'center', backgroundColor: colors.primary, opacity: folderName.trim() ? 1 : 0.5 }}
              >
                <Text style={{ fontWeight: '600', color: '#FFF' }}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
