import React from 'react';
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Modal, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { useTheme } from '../../../context/ThemeContext';
import { Spacing, Typography, BorderRadius } from '../../../theme';

interface HistorySidebarProps {
  visible: boolean;
  onClose: () => void;
  historyList: any[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  loading: boolean;
  onNewComparison: () => void;
  onLoadRecord: (id: string) => void;
  onDeleteRecord: (id: string) => void;
  onRenameRecord: (id: string, currentName: string) => void;
}

export function HistorySidebar({
  visible,
  onClose,
  historyList,
  searchQuery,
  onSearchChange,
  loading,
  onNewComparison,
  onLoadRecord,
  onDeleteRecord,
  onRenameRecord,
}: HistorySidebarProps) {
  const { colors, isDark } = useTheme();

  const filteredHistory = historyList.filter((h: any) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    const defaultTitle = `${h.titleA || ''} vs ${h.titleB || ''}`.toLowerCase();
    const custom = ((h.customTitle as string) || '').toLowerCase();
    return defaultTitle.includes(q) || custom.includes(q);
  });

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
                  <Ionicons name="time" size={20} color={colors.primary} />
                  <Text style={{ fontSize: Typography.sizes.xl, fontWeight: '800', color: colors.text }}>Comparison History</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={{ padding: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f0f0f0', borderRadius: 12 }}>
                  <Ionicons name="close" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => { onClose(); onNewComparison(); }}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
                  padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1,
                  borderColor: colors.primary, backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.06)',
                  marginBottom: Spacing.md,
                }}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={{ fontWeight: '700', color: colors.primary, fontSize: Typography.sizes.base }}>New Comparison</Text>
              </TouchableOpacity>

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
                  placeholder="Search records…"
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

              {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: Spacing.lg }} />
              ) : historyList.length === 0 ? (
                <Text style={{ color: colors.textSecondary, textAlign: 'center', paddingVertical: Spacing['2xl'] }}>No past comparisons yet.</Text>
              ) : filteredHistory.length === 0 ? (
                <Text style={{ color: colors.textSecondary, textAlign: 'center', paddingVertical: Spacing['2xl'] }}>No results match your search.</Text>
              ) : (
                <FlatList
                  data={filteredHistory}
                  keyExtractor={(h) => h._id!}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                  style={{ maxHeight: 400 }}
                  ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
                  renderItem={({ item: h }) => {
                    const displayName = (h as any).customTitle || ((h as any).titleA && (h as any).titleB ? `${(h as any).titleA} vs ${(h as any).titleB}` : 'Comparison Record');
                    return (
                      <Swipeable
                        renderRightActions={() => (
                          <TouchableOpacity
                            onPress={() => onDeleteRecord(h._id!)}
                            style={{
                              backgroundColor: '#ef4444',
                              justifyContent: 'center',
                              alignItems: 'center',
                              width: 70,
                              borderTopRightRadius: BorderRadius.lg,
                              borderBottomRightRadius: BorderRadius.lg,
                            }}
                          >
                            <Ionicons name="trash" size={24} color="#fff" />
                          </TouchableOpacity>
                        )}
                      >
                        <TouchableOpacity
                          onPress={() => onLoadRecord(h._id!)}
                          onLongPress={() => onRenameRecord(h._id!, displayName)}
                          delayLongPress={400}
                          style={{
                            padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1,
                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
                            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.surface,
                            flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
                          }}
                        >
                          <Ionicons name="git-compare-outline" size={18} color={colors.textSecondary} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.text, fontWeight: '600', fontSize: Typography.sizes.sm }} numberOfLines={1}>
                              {displayName}
                            </Text>
                            {h.createdAt && (
                              <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                                {new Date(h.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </Text>
                            )}
                          </View>
                          <TouchableOpacity
                            onPress={() => onRenameRecord(h._id!, displayName)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={{
                              width: 30, height: 30, borderRadius: 8,
                              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
                              alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <Ionicons name="pencil-outline" size={13} color={colors.textSecondary} />
                          </TouchableOpacity>
                          <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </Swipeable>
                    );
                  }}
                />
              )}
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}
