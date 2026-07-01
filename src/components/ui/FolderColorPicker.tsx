import React from 'react';
import { View, ScrollView, TouchableOpacity, Text } from 'react-native';
import { FOLDER_COLORS } from '../../utils/folderColors';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '../../theme';

interface FolderColorPickerProps {
  selectedColor: string;
  onSelectColor: (colorHex: string) => void;
  isDark: boolean;
}

export const FolderColorPicker: React.FC<FolderColorPickerProps> = ({ selectedColor, onSelectColor, isDark }) => {
  return (
    <View style={{ paddingVertical: Spacing.md }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)', marginBottom: Spacing.sm, paddingHorizontal: Spacing.md }}>
        Folder Color
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.md, gap: Spacing.sm }}>
        {FOLDER_COLORS.map(color => {
          const isSelected = color.hex === selectedColor || color.key === selectedColor; // handle both cases
          const actualHex = color.hex;
          return (
            <TouchableOpacity
              key={color.key}
              onPress={() => onSelectColor(color.key)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: actualHex,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: isSelected ? 2 : 0,
                borderColor: isDark ? '#fff' : '#000',
              }}
            >
              {isSelected && <Ionicons name="checkmark" size={18} color="#fff" style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 2, textShadowOffset: { width: 0, height: 1 } }} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
