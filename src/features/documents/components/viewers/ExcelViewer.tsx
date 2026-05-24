import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Papa from 'papaparse';
import { useTheme } from '../../../../context/ThemeContext';
import { Spacing, BorderRadius } from '../../../../theme';
import { ExcelGridView } from './ExcelGridView';
import { ExcelChartsView } from './ExcelChartsView';

interface SheetData {
  name: string;
  data: string;
}

interface ExcelViewerProps {
  extractedText: string;
}

type TabMode = 'grid' | 'charts';

function parseCsv(csvText: string) {
  const result = Papa.parse<string[]>(csvText.trim(), {
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  const rows = result.data as string[][];
  if (rows.length < 2) return { headers: [], rows: [], dataRows: [] };
  const headers  = rows[0];
  const dataRows = rows.slice(1);
  return { headers, rows, dataRows };
}

export const ExcelViewer: React.FC<ExcelViewerProps> = ({ extractedText }) => {
  const { colors, isDark } = useTheme();

  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheet, setActiveSheet] = useState<number>(0);
  const [tab, setTab] = useState<TabMode>('grid');

  useEffect(() => {
    if (!extractedText) return;
    const parsed = extractedText
      .split('--- Sheet: ')
      .filter(Boolean)
      .map((s) => {
        const lines = s.split('\n');
        return {
          name: lines[0].replace(' ---', '').trim(),
          data: lines.slice(1).join('\n').trim(),
        };
      });
    setSheets(parsed.length > 0 ? parsed : [{ name: 'Data', data: extractedText }]);
    setActiveSheet(0);
  }, [extractedText]);

  const activeData = sheets[activeSheet]?.data || '';
  const { headers, dataRows } = useMemo(() => parseCsv(activeData), [activeData]);

  if (sheets.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['2xl'] }}>
        <Ionicons name="warning-outline" size={40} color={colors.textSecondary} />
        <Text style={{ marginTop: Spacing.md, fontSize: 14, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' }}>
          No spreadsheet data found.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Sheet Tabs */}
      {sheets.length > 1 && (
        <View style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, gap: Spacing.sm }}>
            {sheets.map((sheet, index) => {
              const active = activeSheet === index;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => setActiveSheet(index)}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.full,
                    backgroundColor: active ? colors.primary : (isDark ? 'rgba(255,255,255,0.06)' : colors.surface),
                    borderWidth: 1, borderColor: active ? colors.primary : (isDark ? 'rgba(255,255,255,0.1)' : colors.border),
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: active ? (isDark ? '#000' : '#fff') : colors.textSecondary }}>
                    {sheet.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Grid / Charts tab toggle */}
      <View style={{
        flexDirection: 'row', marginHorizontal: Spacing.lg, marginTop: Spacing.md,
        borderRadius: BorderRadius.lg, overflow: 'hidden',
        borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border,
      }}>
        {(['grid', 'charts'] as TabMode[]).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={{
              flex: 1, paddingVertical: 9, alignItems: 'center', flexDirection: 'row',
              justifyContent: 'center', gap: 6,
              backgroundColor: tab === t
                ? (isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)')
                : 'transparent',
            }}
          >
            <Ionicons
              name={t === 'grid' ? 'grid-outline' : 'bar-chart-outline'}
              size={14}
              color={tab === t ? colors.primary : colors.textSecondary}
            />
            <Text style={{
              fontSize: 13, fontWeight: '700',
              color: tab === t ? colors.primary : colors.textSecondary,
            }}>
              {t === 'grid' ? 'Grid' : 'Charts'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main View Area */}
      {tab === 'grid' ? (
        <ExcelGridView headers={headers} dataRows={dataRows} />
      ) : (
        <ExcelChartsView headers={headers} dataRows={dataRows} />
      )}
    </View>
  );
};
