import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import { useTheme } from '../../../../context/ThemeContext';
import { Spacing, Typography, BorderRadius } from '../../../../theme';

const PALETTE = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
];

type ChartType = 'bar' | 'line' | 'area' | 'pie';

interface ChartMeta {
  type: ChartType;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

const CHART_TYPES: ChartMeta[] = [
  { type: 'bar',  label: 'Bar',  icon: 'bar-chart-outline'  },
  { type: 'line', label: 'Line', icon: 'trending-up-outline' },
  { type: 'area', label: 'Area', icon: 'stats-chart-outline' },
  { type: 'pie',  label: 'Pie',  icon: 'pie-chart-outline'  },
];

function toNum(v: string | undefined): number {
  const n = parseFloat((v || '').replace(/,/g, ''));
  return isFinite(n) ? n : 0;
}



interface ExcelChartsViewProps {
  headers: string[];
  dataRows: string[][];
}

export const ExcelChartsView: React.FC<ExcelChartsViewProps> = ({ headers, dataRows }) => {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();

  const [chartType, setChartType] = useState<ChartType>('bar');

  const { xColIdx, yColIdx } = useMemo(() => {
    if (!dataRows || dataRows.length === 0) return { xColIdx: 0, yColIdx: 1 };
    
    const numCols = headers.length || dataRows[0].length;
    const numericCols: number[] = [];
    const labelCols: number[] = [];
    
    // Mirror Web's exact categorization logic (using .some)
    for (let c = 0; c < numCols; c++) {
      const isNumeric = dataRows.some((row) => {
        const val = row[c];
        return val !== undefined && val.trim() !== '' && !isNaN(parseFloat(val.replace(/,/g, '')));
      });
      
      if (isNumeric) {
        numericCols.push(c);
      } else {
        labelCols.push(c);
      }
    }
    
    // Select X-Axis (First non-numeric column, fallback to 0)
    const xIdx = labelCols.length > 0 ? labelCols[0] : 0;
    
    // Select Y-Axis (First numeric column, fallback to 1 or 0)
    let yIdx = numericCols.length > 0 
      ? numericCols[0] 
      : (numCols > 1 ? 1 : 0);
      
    // Edge Case: Prevent X and Y from being the exact same column if data exists
    if (yIdx === xIdx && numCols > 1) {
      yIdx = (yIdx + 1) % numCols;
    }
      
    return { xColIdx: xIdx, yColIdx: yIdx };
  }, [dataRows, headers]);

  const cappedRows = dataRows.slice(0, 30);

  const barLineData = useMemo(
    () =>
      cappedRows.map((row, i) => ({
        value:     toNum(row[yColIdx]),
        label:     String(row[xColIdx] ?? '').slice(0, 10),
        frontColor: PALETTE[i % PALETTE.length],
      })),
    [cappedRows, xColIdx, yColIdx],
  );

  const pieData = useMemo(
    () =>
      cappedRows.map((row, i) => ({
        value: Math.abs(toNum(row[yColIdx])) || 0.001,
        text:  String(row[xColIdx] ?? '').slice(0, 12),
        color: PALETTE[i % PALETTE.length],
      })),
    [cappedRows, xColIdx, yColIdx],
  );

  const hasData     = dataRows.length > 0 && headers.length > 0;
  const hasNumeric  = barLineData.some((d) => d.value !== 0);
  const chartValid  = hasData && hasNumeric;

  const labelColor  = colors.textSecondary;
  const axisColor   = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
  const chartBg     = 'transparent';

  const chartWidth  = width - Spacing.xl * 2 - 16;

  return (
    <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing['4xl'] }}>
      {/* Chart type selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {CHART_TYPES.map(({ type, label, icon }) => {
            const active = chartType === type;
            return (
              <TouchableOpacity
                key={type}
                onPress={() => setChartType(type)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 5,
                  paddingHorizontal: 12, paddingVertical: 7, borderRadius: BorderRadius.full,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : (isDark ? 'rgba(255,255,255,0.12)' : colors.border),
                  backgroundColor: active
                    ? (isDark ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.08)')
                    : 'transparent',
                }}
              >
                <Ionicons name={icon} size={13} color={active ? colors.primary : colors.textSecondary} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: active ? colors.primary : colors.textSecondary }}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Axis info */}
      <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg, flexWrap: 'wrap' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: PALETTE[0] }} />
          <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary }}>
            X: {headers[xColIdx] || 'Labels'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: PALETTE[2] }} />
          <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary }}>
            Y: {headers[yColIdx] || 'Values'}
          </Text>
        </View>
        {cappedRows.length < dataRows.length && (
          <Text style={{ fontSize: 11, color: colors.textSecondary, fontStyle: 'italic' }}>
            Showing first 30 of {dataRows.length} rows
          </Text>
        )}
      </View>

      {/* Chart canvas */}
      {!chartValid ? (
        <View style={{ alignItems: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.md }}>
          <Ionicons name="warning-outline" size={32} color={colors.textSecondary} />
          <Text style={{ fontSize: Typography.sizes.base, fontWeight: '700', color: colors.text }}>Chart unavailable</Text>
          <Text style={{ fontSize: Typography.sizes.sm, color: colors.textSecondary, textAlign: 'center' }}>
            No numeric column detected. Switch to Grid view to see the raw data.
          </Text>
        </View>
      ) : (
        <View style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fafafa',
          borderRadius: BorderRadius.xl,
          borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
          padding: Spacing.md, overflow: 'hidden',
        }}>
          {chartType === 'bar' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BarChart
                data={barLineData}
                width={Math.max(chartWidth, barLineData.length * 44)}
                height={220}
                barWidth={28}
                spacing={16}
                roundedTop
                hideRules={false}
                rulesColor={axisColor}
                rulesType="solid"
                backgroundColor={chartBg}
                yAxisColor={axisColor}
                xAxisColor={axisColor}
                yAxisTextStyle={{ color: labelColor, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: labelColor, fontSize: 9 }}
                noOfSections={5}
                isAnimated
              />
            </ScrollView>
          )}

          {chartType === 'line' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart
                data={barLineData}
                width={Math.max(chartWidth, barLineData.length * 44)}
                height={220}
                spacing={40}
                color={PALETTE[0]}
                thickness={2.5}
                startFillColor={PALETTE[0]}
                endFillColor="transparent"
                startOpacity={0.15}
                endOpacity={0}
                hideDataPoints={false}
                dataPointsColor={PALETTE[0]}
                dataPointsRadius={4}
                curved
                backgroundColor={chartBg}
                yAxisColor={axisColor}
                xAxisColor={axisColor}
                yAxisTextStyle={{ color: labelColor, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: labelColor, fontSize: 9 }}
                rulesColor={axisColor}
                noOfSections={5}
                isAnimated
              />
            </ScrollView>
          )}

          {chartType === 'area' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart
                data={barLineData}
                width={Math.max(chartWidth, barLineData.length * 44)}
                height={220}
                spacing={40}
                color={PALETTE[1]}
                thickness={2.5}
                startFillColor={PALETTE[1]}
                endFillColor={isDark ? 'rgba(16,185,129,0.03)' : 'rgba(16,185,129,0.05)'}
                startOpacity={0.35}
                endOpacity={0.05}
                areaChart
                curved
                hideDataPoints={false}
                dataPointsColor={PALETTE[1]}
                dataPointsRadius={4}
                backgroundColor={chartBg}
                yAxisColor={axisColor}
                xAxisColor={axisColor}
                yAxisTextStyle={{ color: labelColor, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: labelColor, fontSize: 9 }}
                rulesColor={axisColor}
                noOfSections={5}
                isAnimated
              />
            </ScrollView>
          )}

          {chartType === 'pie' && (
            <View style={{ alignItems: 'center', paddingVertical: Spacing.md }}>
              <PieChart
                data={pieData}
                donut
                radius={110}
                innerRadius={58}
                innerCircleColor={isDark ? '#0f0f11' : '#fafafa'}
                centerLabelComponent={() => (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text }}>
                      {pieData.length}
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.textSecondary }}>slices</Text>
                  </View>
                )}
                isAnimated
                animationDuration={700}
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: Spacing.lg, justifyContent: 'center' }}>
                {pieData.map((slice, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: slice.color }} />
                    <Text style={{ fontSize: 11, fontWeight: '600', color: colors.text }} numberOfLines={1}>
                      {slice.text}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};
