import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { BorderRadius } from '../../../theme';

interface RenameModalProps {
  visible: boolean;
  initialValue: string;
  onCancel: () => void;
  onSave: (value: string) => void;
}

export function RenameModal({
  visible,
  initialValue,
  onCancel,
  onSave,
}: RenameModalProps) {
  const { colors, isDark } = useTheme();
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 }}
        activeOpacity={1}
        onPress={onCancel}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} style={{ width: '100%', alignItems: 'center' }}>
          <TouchableOpacity
            activeOpacity={1}
            style={{
              width: '100%', maxWidth: 360,
              backgroundColor: isDark ? '#141418' : '#fff',
              borderRadius: 24, overflow: 'hidden',
              borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb',
              shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 24,
            }}
          >
            <View style={{ alignItems: 'center', paddingTop: 28, paddingHorizontal: 24, paddingBottom: 16, gap: 10 }}>
              <View style={{
                width: 52, height: 52, borderRadius: 26,
                backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="pencil" size={24} color={colors.primary} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>Rename Comparison</Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center' }}>
                Enter a new name for this comparison record.
              </Text>
            </View>

            <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
              <TextInput
                value={value}
                onChangeText={setValue}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => value.trim() && onSave(value.trim())}
                placeholder="Enter new name…"
                placeholderTextColor={colors.textSecondary}
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
                  borderRadius: BorderRadius.lg, borderWidth: 1,
                  borderColor: isDark ? 'rgba(99,102,241,0.35)' : 'rgba(99,102,241,0.3)',
                  paddingHorizontal: 16, paddingVertical: 12,
                  fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'center',
                }}
              />
            </View>

            <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.07)' : '#f3f4f6' }}>
              <TouchableOpacity
                onPress={onCancel}
                style={{ flex: 1, paddingVertical: 16, alignItems: 'center' }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>Cancel</Text>
              </TouchableOpacity>
              <View style={{ width: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#f3f4f6' }} />
              <TouchableOpacity
                onPress={() => value.trim() && onSave(value.trim())}
                disabled={!value.trim()}
                style={{ flex: 1, paddingVertical: 16, alignItems: 'center', opacity: value.trim() ? 1 : 0.45 }}
              >
                <Text style={{ fontSize: 14, fontWeight: '800', color: colors.primary }}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}
