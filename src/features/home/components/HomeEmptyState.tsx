import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Button } from '../../../components/ui/Button';
import { Spacing, Typography } from '../../../theme';

interface HomeEmptyStateProps {
  onUploadFile: () => void;
  onPasteText: () => void;
}

export const HomeEmptyState = React.memo(({ onUploadFile, onPasteText }: HomeEmptyStateProps) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing['4xl'], paddingHorizontal: Spacing.md }}>
      <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(16,55,102,0.05)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl, borderWidth: 1, borderColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(16,55,102,0.1)' }}>
        <Ionicons name="cube-outline" size={40} color={colors.primary} />
      </View>
      <Text style={{ fontFamily: Typography.families.display, fontSize: Typography.sizes['4xl'], color: colors.text, textAlign: 'center', lineHeight: 42 }}>
        Welcome to your{'\n'}
        <Text style={{ color: colors.primary }}>new second brain.</Text>
      </Text>
      <Text style={{ fontSize: Typography.sizes.base, color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.lg, lineHeight: 24, paddingHorizontal: Spacing.lg }}>
        Context is ready. To get started, upload files or paste raw text to define your semantic intent.
      </Text>

      <View style={{ width: '100%', flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing['2xl'], paddingHorizontal: Spacing.md }}>
        <Button
          title="Upload File"
          onPress={onUploadFile}
          style={{ flex: 1, paddingHorizontal: 8 }}
          textStyle={{ fontSize: 14 }}
          icon={<Ionicons name="cloud-upload-outline" size={18} color={isDark ? '#000' : '#fff'} />}
        />
        <Button
          title="Paste Text"
          variant="outline"
          onPress={onPasteText}
          style={{ flex: 1, paddingHorizontal: 8 }}
          textStyle={{ fontSize: 14 }}
          icon={<Ionicons name="document-text-outline" size={18} color={colors.primary} />}
        />
      </View>
    </View>
  );
});
