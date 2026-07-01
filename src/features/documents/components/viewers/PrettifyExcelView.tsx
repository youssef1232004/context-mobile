import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { Spacing, BorderRadius } from '../../../../theme';
import type { ExcelPrettifyResult } from '../../../../services/prettify.service';

interface PrettifyExcelViewProps {
  result: ExcelPrettifyResult;
  onReorganize: () => void;
  onShare: () => void;
}

export const PrettifyExcelView: React.FC<PrettifyExcelViewProps> = ({
  result,
  onReorganize,
  onShare,
}) => {
  const { colors, isDark } = useTheme();
  const [activeSheet, setActiveSheet] = useState(0);
  const sheet = result.sheets[activeSheet] || result.sheets[0];
  const isRtl = result.direction === 'rtl';

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#0A0A0C' : colors.surface }}>
      {/* Action bar */}
      <View style={[styles.actionBar, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border, backgroundColor: isDark ? '#18181B' : '#fff' }]}>
        
        {/* Sheet tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(99,102,241,0.1)' }}>
            <Ionicons name="sparkles" size={12} color={colors.primary} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>Prettified</Text>
          </View>
          {result.sheets.length > 1 && result.sheets.map((s, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setActiveSheet(i)}
              style={[
                styles.sheetTab,
                activeSheet === i ? { backgroundColor: isDark ? '#27272a' : '#f3f4f6', borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border } : { borderColor: 'transparent' }
              ]}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: activeSheet === i ? colors.primary : colors.textSecondary }}>{s.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Buttons */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 }}>
          <TouchableOpacity onPress={onReorganize} style={[styles.actionButton, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border }]}>
            <Ionicons name="refresh" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onShare} style={styles.shareButton}>
            <Ionicons name="download-outline" size={14} color="#10b981" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#10b981', marginLeft: 4 }}>Download .xlsx</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Table */}
      <ScrollView horizontal contentContainerStyle={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xl }}>
          {/* Header */}
          <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', backgroundColor: '#1F3864' }}>
            <View style={[styles.cell, styles.headerCell, { width: 40 }]}><Text style={styles.headerText}>#</Text></View>
            {sheet.headers.map((h, ci) => (
              <View key={ci} style={[styles.cell, styles.headerCell]}>
                <Text style={styles.headerText}>{h || `Col ${ci + 1}`}</Text>
              </View>
            ))}
          </View>

          {/* Rows */}
          {sheet.rows.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary }}>No data rows in this sheet.</Text>
            </View>
          ) : (
            sheet.rows.map((row, ri) => {
              const isEvenRow = ri % 2 === 0;
              const rowBg = isEvenRow ? (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)') : (isDark ? '#18181B' : '#fff');
              
              return (
                <View key={ri} style={{ flexDirection: isRtl ? 'row-reverse' : 'row', backgroundColor: rowBg, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border }}>
                  <View style={[styles.cell, { width: 40, borderRightColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border }]}>
                    <Text style={{ fontSize: 10, color: colors.textSecondary, fontFamily: 'monospace', textAlign: 'center' }}>{ri + 1}</Text>
                  </View>
                  {sheet.headers.map((_, ci) => {
                    const cell = row[ci] ?? '';
                    const isNumeric = cell !== '' && (!isNaN(Number(cell)) || /^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}/.test(cell));
                    const isEmpty = !cell;

                    return (
                      <View key={ci} style={[styles.cell, { borderRightColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border }]}>
                        {isEmpty ? (
                          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>—</Text>
                        ) : (
                          <Text style={{ 
                            color: isNumeric ? '#10b981' : colors.text, 
                            fontFamily: isNumeric ? 'monospace' : undefined,
                            textAlign: isNumeric ? 'right' : (isRtl ? 'right' : 'left'),
                            fontSize: 13,
                          }}>
                            {cell}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })
          )}
        </ScrollView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  sheetTab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionButton: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  cell: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRightWidth: 1,
    minWidth: 100,
    justifyContent: 'center',
  },
  headerCell: {
    borderRightColor: '#0D2137',
    borderBottomWidth: 2,
    borderBottomColor: '#0D2137',
  },
  headerText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
});
