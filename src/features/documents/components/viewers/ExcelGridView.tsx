import React from 'react';
import { View, Text, ScrollView, FlatList } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { Spacing } from '../../../../theme';

interface ExcelGridViewProps {
  headers: string[];
  dataRows: string[][];
}

export const ExcelGridView: React.FC<ExcelGridViewProps> = ({ headers, dataRows }) => {
  const { colors, isDark } = useTheme();

  const renderHeader = () => (
    <View style={{ flexDirection: 'row', borderBottomWidth: 2, borderColor: colors.primary, marginBottom: 2 }}>
      {headers.map((h, i) => (
        <View key={i} style={{ minWidth: 110, paddingHorizontal: 10, paddingVertical: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 }} numberOfLines={1}>
            {h}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderRow = ({ item: row, index: ri }: { item: string[], index: number }) => (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: ri % 2 === 0
          ? (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)')
          : 'transparent',
        borderRadius: 4,
      }}
    >
      {headers.map((_, ci) => (
        <View key={ci} style={{ minWidth: 110, paddingHorizontal: 10, paddingVertical: 7 }}>
          <Text style={{ fontSize: 12, fontWeight: '500', color: colors.text }} numberOfLines={1}>
            {row[ci] ?? ''}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator style={{ flex: 1 }}>
      <FlatList
        data={dataRows}
        keyExtractor={(_, i) => String(i)}
        ListHeaderComponent={renderHeader}
        renderItem={renderRow}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing['4xl'] }}
        showsVerticalScrollIndicator
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={5}
      />
    </ScrollView>
  );
};
