import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { Spacing, Typography } from '../../../../theme';

interface EmptyLibraryStateProps {
  search: string;
  loading: boolean;
  hasDocuments: boolean;
  hasFolders: boolean;
}

export const EmptyLibraryState = React.memo(({
  search,
  loading,
  hasDocuments,
  hasFolders,
}: EmptyLibraryStateProps) => {
  const { colors, isDark } = useTheme();

  if (loading || hasDocuments || hasFolders) return null;

  return (
    <View style={{ alignItems: 'center', gap: Spacing.md, paddingTop: Spacing['3xl'] }}>
      <Ionicons name="documents-outline" size={56} color={colors.textSecondary} />
      <Text style={{ fontSize: Typography.sizes.xl, fontWeight: '700', color: colors.text }}>
        {search ? 'No results found' : 'Library is empty'}
      </Text>
      <Text style={{ fontSize: Typography.sizes.base, color: colors.textSecondary, textAlign: 'center' }}>
        {search ? 'Try a different search.' : 'Use the Capture tab to upload your first document.'}
      </Text>
    </View>
  );
});
