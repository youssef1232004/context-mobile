import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  ActivityIndicator, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { SkeletonLoader } from '../../../components/SkeletonLoader';
import { searchService, type SemanticSearchResult } from '../api/searchService';
import { Spacing, Typography, BorderRadius } from '../../../theme';
import { useNavigation } from '@react-navigation/native';

// Icon mapping for document types returned by the backend
const TYPE_ICONS: Record<string, { name: React.ComponentProps<typeof Ionicons>['name']; color: string }> = {
  PDF:         { name: 'document-text', color: '#ef4444' },
  Word:        { name: 'document',      color: '#3b82f6' },
  Image:       { name: 'image',         color: '#8b5cf6' },
  TextSnippet: { name: 'reader',        color: '#f59e0b' },
};

export default function SearchScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search — fires 500ms after the user stops typing
  // (matches web behaviour: heavy embedding calls warrant a delay)
  const triggerSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setSearched(true);
      try {
        const res = await searchService.search(q, 8);
        setResults(res.data || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);
  }, []);

  const handleChange = (text: string) => {
    setQuery(text);
    triggerSearch(text);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  const handleSelectResult = (documentId: string) => {
    navigation.navigate('Library', {
      screen: 'Reading',
      params: { documentId },
    });
  };

  const getIcon = (type: string) =>
    TYPE_ICONS[type] || { name: 'document-outline' as const, color: colors.textSecondary };

  const renderResult = ({ item, index }: { item: SemanticSearchResult; index: number }) => {
    const ic = getIcon(item.documentType);
    const score = item.confidenceScore != null ? Math.round(item.confidenceScore) : null;
    const scoreColor =
      score != null
        ? score > 75 ? '#10b981' : score > 40 ? '#f59e0b' : '#ef4444'
        : colors.textSecondary;

    return (
      <TouchableOpacity
        key={`${item.documentId}-${item.chunkIndex}-${index}`}
        onPress={() => handleSelectResult(item.documentId)}
        activeOpacity={0.75}
      >
        <View style={{
          padding: Spacing.md, borderRadius: BorderRadius.xl, borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.surface,
          marginBottom: Spacing.sm,
          gap: Spacing.sm,
        }}>
          {/* ── Title row ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <View style={{
              width: 38, height: 38, borderRadius: 10,
              backgroundColor: `${ic.color}18`,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name={ic.name} size={18} color={ic.color} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                {item.documentTitle}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '500', color: colors.textSecondary }}>
                {item.documentType} · Chunk #{item.chunkIndex + 1}
              </Text>
            </View>

            {/* Confidence badge */}
            {score !== null && (
              <View style={{
                paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
                backgroundColor: isDark ? `${scoreColor}18` : `${scoreColor}12`,
                borderWidth: 1, borderColor: isDark ? `${scoreColor}30` : `${scoreColor}25`,
                flexDirection: 'row', alignItems: 'center', gap: 3,
              }}>
                <Ionicons name="radio-outline" size={10} color={scoreColor} />
                <Text style={{ fontSize: 10, fontWeight: '800', color: scoreColor, fontFamily: 'monospace' }}>
                  {score}%
                </Text>
              </View>
            )}
          </View>

          {/* ── Matched text snippet ── */}
          {item.text ? (
            <View style={{
              backgroundColor: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.04)',
              borderRadius: 8, padding: Spacing.sm,
              borderLeftWidth: 2, borderLeftColor: colors.primary,
            }}>
              <Text style={{
                fontSize: 12, color: colors.textSecondary, lineHeight: 18,
                fontStyle: 'italic',
              }} numberOfLines={3}>
                "{item.text}"
              </Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <FlatList
        data={(!loading && searched) ? results : []}
        keyExtractor={(item, index) => `${item.documentId}-${item.chunkIndex}-${index}`}
        renderItem={renderResult}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 40 }}
        ListHeaderComponent={
          <>
            {/* ── Header ── */}
            <View style={{ marginBottom: Spacing.md, marginTop: Spacing.xl }}>
              <Text style={{
                fontSize: Typography.sizes.sm, fontWeight: '600',
                color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.5,
              }}>
                Semantic Search
              </Text>
              <Text style={{
                fontSize: Typography.sizes['3xl'], fontWeight: '800',
                color: colors.text, marginTop: 4,
              }}>
                Find Anything
              </Text>
            </View>

            {/* ── Search input ── */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.surface,
              borderRadius: BorderRadius.xl, borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : colors.border,
              paddingHorizontal: Spacing.md, paddingVertical: 14,
              marginBottom: Spacing.md,
            }}>
              {loading
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
              }
              <TextInput
                placeholder="Ask anything, search by meaning…"
                placeholderTextColor={colors.textSecondary}
                value={query}
                onChangeText={handleChange}
                returnKeyType="search"
                onSubmitEditing={() => {
                  if (debounceRef.current) clearTimeout(debounceRef.current);
                  triggerSearch(query);
                }}
                style={{
                  flex: 1, fontSize: Typography.sizes.base,
                  color: colors.text, fontWeight: '500',
                  padding: 0, paddingVertical: 0, // fixes vertical centering on android
                }}
              />
              {query.length > 0 && !loading && (
                <TouchableOpacity onPress={handleClear}>
                  <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* ── Loading skeletons ── */}
            {loading && <SkeletonLoader count={4} type="list" />}

            {/* ── Empty state (pre-search) ── */}
            {!searched && !loading && (
              <View style={{ alignItems: 'center', gap: Spacing.md, paddingTop: Spacing['2xl'] }}>
                <View style={{
                  width: 72, height: 72, borderRadius: 36,
                  backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="sparkles-outline" size={34} color={colors.primary} />
                </View>
                <Text style={{ fontSize: Typography.sizes.lg, fontWeight: '700', color: colors.text }}>
                  Semantic Search
                </Text>
                <Text style={{
                  fontSize: Typography.sizes.base, color: colors.textSecondary,
                  textAlign: 'center', lineHeight: 22,
                }}>
                  Search by meaning, not just keywords.{'\n'}Results show the exact matched chunk.
                </Text>
              </View>
            )}

            {/* ── No results ── */}
            {!loading && searched && results.length === 0 && (
              <View style={{ alignItems: 'center', gap: Spacing.md, paddingTop: Spacing['2xl'] }}>
                <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
                <Text style={{ fontSize: Typography.sizes.lg, fontWeight: '700', color: colors.text }}>
                  No semantic matches
                </Text>
                <Text style={{ fontSize: Typography.sizes.base, color: colors.textSecondary, textAlign: 'center' }}>
                  Try asking your question differently or using broader terms.
                </Text>
              </View>
            )}

            {/* ── Result count ── */}
            {!loading && searched && results.length > 0 && (
              <Text style={{
                fontSize: Typography.sizes.sm, fontWeight: '600',
                color: colors.textSecondary, marginBottom: Spacing.xs,
              }}>
                {results.length} semantic match{results.length !== 1 ? 'es' : ''} for "{query}"
              </Text>
            )}
          </>
        }
      />
    </SafeAreaView>
  );
}
