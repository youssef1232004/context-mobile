import React from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Spacing, Typography, BorderRadius } from '../../../theme';
import { Button } from '../../../components/ui/Button';

interface DocumentSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  documents: any[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onCompare: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isComparing: boolean;
}

const FILE_ICONS: Record<string, { name: React.ComponentProps<typeof Ionicons>['name']; color: string }> = {
  PDF: { name: 'document-text', color: '#ef4444' },
  Word: { name: 'document', color: '#3b82f6' },
  Excel: { name: 'grid', color: '#10b981' },
  CSV: { name: 'grid', color: '#10b981' },
  Image: { name: 'image', color: '#8b5cf6' },
  TextSnippet: { name: 'reader', color: '#f59e0b' },
};

export function DocumentSelectorModal({
  visible,
  onClose,
  documents,
  selectedIds,
  onToggleSelect,
  onCompare,
  searchQuery,
  onSearchChange,
  isComparing,
}: DocumentSelectorModalProps) {
  const { colors, isDark } = useTheme();

  const filteredDocs = documents.filter((doc) => 
    doc.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        activeOpacity={1}
        onPress={onClose}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} style={{ width: '100%' }}>
          <TouchableOpacity activeOpacity={1} style={{ width: '100%' }}>
            <View style={{
              maxHeight: '95%',
              backgroundColor: isDark ? '#0f0f11' : '#fff',
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: Spacing.xl,
              shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 20,
            }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#e0e0e0', alignSelf: 'center', marginBottom: Spacing.lg }} />

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <Ionicons name="checkbox-outline" size={20} color={colors.primary} />
                  <Text style={{ fontSize: Typography.sizes.xl, fontWeight: '800', color: colors.text }}>Select Documents ({selectedIds.length}/2)</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={{ padding: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f0f0f0', borderRadius: 12 }}>
                  <Ionicons name="close" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
                borderRadius: BorderRadius.lg, borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
                paddingHorizontal: 12, marginBottom: Spacing.md,
              }}>
                <Ionicons name="search-outline" size={15} color={colors.textSecondary} />
                <TextInput
                  value={searchQuery}
                  onChangeText={onSearchChange}
                  placeholder="Search documents…"
                  placeholderTextColor={colors.textSecondary}
                  returnKeyType="search"
                  style={{
                    flex: 1, paddingVertical: 9, fontSize: 13,
                    color: colors.text, fontWeight: '500',
                  }}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => onSearchChange('')}>
                    <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              <FlatList
                data={filteredDocs}
                keyExtractor={(item) => item._id}
                style={{ maxHeight: 400 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: Spacing.sm, paddingBottom: Spacing.xl }}
                renderItem={({ item }) => {
                  const isSelected = selectedIds.includes(item._id);
                  const isMaxedOut = selectedIds.length >= 2 && !isSelected;
                  const ic = FILE_ICONS[item.fileType] || { name: 'document-outline', color: colors.textSecondary };
                  return (
                    <TouchableOpacity
                      onPress={() => onToggleSelect(item._id)}
                      disabled={isMaxedOut}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
                        padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1,
                        borderColor: isSelected ? colors.primary : (isDark ? 'rgba(255,255,255,0.08)' : colors.border),
                        backgroundColor: isSelected ? (isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)') : (isDark ? 'rgba(255,255,255,0.03)' : colors.surface),
                        opacity: isMaxedOut ? 0.4 : 1,
                      }}
                    >
                      <View style={{
                        width: 22, height: 22, borderRadius: 11, borderWidth: 2,
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? colors.primary : 'transparent',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isSelected && <Ionicons name="checkmark" size={14} color={isDark ? '#000' : '#fff'} />}
                      </View>

                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${ic.color}15`, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name={ic.name as any} size={18} color={ic.color} />
                      </View>
                      
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '700', color: colors.text }} numberOfLines={1}>{item.title}</Text>
                        <Text style={{ fontSize: 11, color: colors.textSecondary }}>{item.fileType}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
                    <Text style={{ color: colors.textSecondary }}>No documents found.</Text>
                  </View>
                }
              />

              <View style={{ paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border }}>
                <Button
                  title={selectedIds.length === 2 ? 'Compare 2 Documents' : `Select ${2 - selectedIds.length} more`}
                  onPress={() => {
                    onClose();
                    if (selectedIds.length === 2) onCompare();
                  }}
                  disabled={selectedIds.length < 2 || isComparing}
                  loading={isComparing}
                  icon={<Ionicons name="git-compare-outline" size={18} color={isDark ? '#000' : '#fff'} />}
                  fullWidth
                />
              </View>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}
