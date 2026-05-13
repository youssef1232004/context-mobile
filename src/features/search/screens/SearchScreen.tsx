import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Badge } from '../../../components/Badge';
import { CognitiveLoadBadge } from '../../../components/CognitiveLoadBadge';
import { SkeletonLoader } from '../../../components/SkeletonLoader';
import { searchService, type SearchResult } from '../api/searchService';
import { Spacing, Typography, BorderRadius } from '../../../theme';
import { useNavigation } from '@react-navigation/native';

const FILE_ICONS: Record<string, { name: React.ComponentProps<typeof Ionicons>['name']; color: string }> = {
  PDF:         { name: 'document-text', color: '#ef4444' },
  Word:        { name: 'document',      color: '#3b82f6' },
  Image:       { name: 'image',         color: '#8b5cf6' },
  TextSnippet: { name: 'reader',        color: '#f59e0b' },
};

export default function SearchScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      const res = await searchService.search(q, { limit: 20 });
      setResults(res.data || []);
      setTotalItems(res.pagination?.totalItems ?? res.data?.length ?? 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (text: string) => {
    setQuery(text);
    if (!text.trim()) { setResults([]); setSearched(false); }
  };

  const getIcon = (ft: string) => FILE_ICONS[ft] || { name: 'document-outline' as const, color: colors.textSecondary };

  // Compute max score for normalizing relevance bars
  const maxScore = results.reduce((max, r) => Math.max(max, r.score ?? 0), 0) || 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View>
          <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Semantic Search
          </Text>
          <Text style={{ fontSize: Typography.sizes['3xl'], fontWeight: '800', color: colors.text, marginTop: 4 }}>
            Find Anything
          </Text>
        </View>

        {/* ── Search input ── */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.surface,
          borderRadius: BorderRadius.xl, borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : colors.border,
          paddingHorizontal: Spacing.md, paddingVertical: 12,
        }}>
          <Ionicons name="search-outline" size={20} color={colors.primary} />
          <TextInput
            placeholder="Search across all your documents…"
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={handleChange}
            onSubmitEditing={() => doSearch(query)}
            returnKeyType="search"
            style={{ flex: 1, fontSize: Typography.sizes.base, color: colors.text, fontWeight: '500' }}
          />
          {loading && <ActivityIndicator size="small" color={colors.primary} />}
          {!loading && query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Hint ── */}
        {!searched && (
          <View style={{ alignItems: 'center', gap: Spacing.md, paddingTop: Spacing['2xl'] }}>
            <View style={{
              width: 72, height: 72, borderRadius: 36,
              backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="sparkles-outline" size={34} color={colors.primary} />
            </View>
            <Text style={{ fontSize: Typography.sizes.lg, fontWeight: '700', color: colors.text }}>Semantic Search</Text>
            <Text style={{ fontSize: Typography.sizes.base, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
              Search by meaning, not just keywords.{'\n'}Type a concept or question and press Search.
            </Text>
          </View>
        )}

        {/* ── Loading ── */}
        {loading && <SkeletonLoader count={4} type="list" />}

        {/* ── No results ── */}
        {!loading && searched && results.length === 0 && (
          <View style={{ alignItems: 'center', gap: Spacing.md, paddingTop: Spacing['2xl'] }}>
            <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
            <Text style={{ fontSize: Typography.sizes.lg, fontWeight: '700', color: colors.text }}>No results</Text>
            <Text style={{ fontSize: Typography.sizes.base, color: colors.textSecondary }}>Try a different search term.</Text>
          </View>
        )}

        {/* ── Results ── */}
        {!loading && results.length > 0 && (
          <View style={{ gap: Spacing.md }}>
            <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '600', color: colors.textSecondary }}>
              {totalItems} result{totalItems !== 1 ? 's' : ''} for "{query}"
            </Text>

            {results.map((item) => {
              const ic = getIcon(item.fileType);
              const relevance = item.score ? Math.round((item.score / maxScore) * 100) : null;

              return (
                <TouchableOpacity
                  key={item._id}
                  onPress={() => navigation.navigate('Library', { screen: 'Reading', params: { documentId: item._id } })}
                  activeOpacity={0.75}
                >
                  <View style={{
                    padding: Spacing.md, borderRadius: BorderRadius.xl, borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.surface,
                    gap: Spacing.sm,
                  }}>
                    {/* Title row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                      <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: `${ic.color}18`, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name={ic.name} size={18} color={ic.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={{ fontSize: 11, fontWeight: '500', color: colors.textSecondary }}>
                          {item.fileType}
                        </Text>
                      </View>
                      <CognitiveLoadBadge load={item.cognitiveLoad} compact />
                    </View>

                    {/* Summary snippet */}
                    {item.summary && (
                      <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18 }} numberOfLines={2}>
                        {item.summary}
                      </Text>
                    )}

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                        {item.tags.slice(0, 4).map((tag) => {
                          const isMatch = query.toLowerCase().split(/\s+/).some((w) => tag.toLowerCase().includes(w));
                          return (
                            <View key={tag} style={{
                              paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
                              backgroundColor: isMatch
                                ? (isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.12)')
                                : (isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.06)'),
                              borderWidth: isMatch ? 1 : 0,
                              borderColor: isMatch ? '#f59e0b' : 'transparent',
                            }}>
                              <Text style={{
                                fontSize: 10, fontWeight: '700',
                                color: isMatch ? '#f59e0b' : colors.primary,
                              }}>#{tag}</Text>
                            </View>
                          );
                        })}
                        {item.tags.length > 4 && (
                          <Text style={{ fontSize: 10, fontWeight: '600', color: colors.textSecondary }}>+{item.tags.length - 4}</Text>
                        )}
                      </View>
                    )}

                    {/* Relevance bar */}
                    {relevance !== null && (
                      <View style={{ gap: 4 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 10, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>Relevance</Text>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary, fontFamily: 'monospace' }}>{relevance}%</Text>
                        </View>
                        <View style={{ height: 4, borderRadius: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb', overflow: 'hidden' }}>
                          <View style={{
                            height: 4, borderRadius: 2, width: `${relevance}%`,
                            backgroundColor: relevance > 75 ? '#10b981' : relevance > 40 ? '#f59e0b' : '#ef4444',
                          }} />
                        </View>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
