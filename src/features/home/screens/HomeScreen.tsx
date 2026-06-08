import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { useAppSelector } from '../../../store/hooks';
import { Card } from '../../../components/Card';
import { Badge } from '../../../components/Badge';
import { Button } from '../../../components/Button';
import { getTagColor } from '../../../utils/tagUtils';
import { CognitiveLoadBadge } from '../../../components/CognitiveLoadBadge';
import { SkeletonLoader } from '../../../components/SkeletonLoader';
import { AnimatedPressable } from '../../../components/AnimatedPressable';
import { documentService, type Document } from '../../documents/api/documentService';
import { folderService, type FolderData } from '../../folders/api/folderService';
import { Spacing, Typography, BorderRadius } from '../../../theme';
import { useNavigation } from '@react-navigation/native';

const CARD_WIDTH = Dimensions.get('window').width * 0.42;

const FILE_ICONS: Record<string, { name: React.ComponentProps<typeof Ionicons>['name']; color: string }> = {
  PDF: { name: 'document-text', color: '#ef4444' },
  Word: { name: 'document', color: '#3b82f6' },
  Excel: { name: 'grid', color: '#10b981' },
  CSV: { name: 'grid', color: '#10b981' },
  Image: { name: 'image', color: '#8b5cf6' },
  TextSnippet: { name: 'reader', color: '#f59e0b' },
};

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAppSelector((state: any) => state.auth);
  const navigation = useNavigation<any>();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [focusDoc, setFocusDoc] = useState<Document | null>(null);
  const [folderCount, setFolderCount] = useState(0);
  const [totalDocs, setTotalDocs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [docRes, treeRes, focusRes] = await Promise.all([
        documentService.getAll({ limit: 10, sortBy: 'updatedAt', sortOrder: 'desc' }),
        folderService.getTree(),
        // GET /documents/suggested-focus: backend ranks by cognitiveLoad weight +
        // 30-day recency decay + isUnread bonus (+2). Only returns Analyzed docs.
        documentService.getSuggestedFocus(),
      ]);
      setDocuments(docRes.data || []);
      setTotalDocs(docRes.pagination?.totalItems ?? docRes.data?.length ?? 0);
      setFolderCount(treeRes.data?.length ?? 0);
      // Take the top-ranked document from the AI-scored list
      setFocusDoc(focusRes.data?.[0] ?? null);
    } catch {
      // silent fail — screen still shows empty states
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchData(true); };

  const getIcon = (ft: string) => FILE_ICONS[ft] || { name: 'document-outline' as const, color: colors.textSecondary };

  const relativeDate = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.xl, paddingBottom: Spacing['4xl'] }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* ─── Greeting ─── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontFamily: Typography.families.mono, fontSize: Typography.sizes.sm, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              Dashboard
            </Text>
            <Text style={{ fontFamily: Typography.families.display, fontSize: Typography.sizes['3xl'], color: colors.text, marginTop: 4 }}>
              Welcome back,{'\n'}
              <Text style={{ color: colors.primary }}>{user?.fullName || 'User'}</Text>
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border, overflow: 'hidden' }}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <Ionicons name="person" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* ─── Main Content ─── */}
        {loading && !refreshing && totalDocs === 0 && folderCount === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing['4xl'] }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : totalDocs === 0 && folderCount === 0 ? (
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
                onPress={() => navigation.navigate('Capture', { mode: 'file' })}
                style={{ flex: 1, paddingHorizontal: 8 }}
                textStyle={{ fontSize: 14 }}
                icon={<Ionicons name="cloud-upload-outline" size={18} color={isDark ? '#000' : '#fff'} />}
              />
              <Button
                title="Paste Text"
                variant="outline"
                onPress={() => navigation.navigate('Capture', { mode: 'text' })}
                style={{ flex: 1, paddingHorizontal: 8 }}
                textStyle={{ fontSize: 14 }}
                icon={<Ionicons name="document-text-outline" size={18} color={colors.primary} />}
              />
            </View>
          </View>
        ) : (
          <View style={{ gap: Spacing.xl }}>
            {/* ─── Stats Row ─── */}
            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              {[
                { icon: 'document-text-outline' as const, count: totalDocs, label: 'Documents', color: colors.primary },
                { icon: 'folder-outline' as const, count: folderCount, label: 'Folders', color: '#f59e0b' },
              ].map((s) => (
                <Card key={s.label} style={{ flex: 1 }}>
                  <View style={{ alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${s.color}18`, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={s.icon} size={24} color={s.color} />
                    </View>
                    <Text style={{ fontFamily: Typography.families.mono, fontSize: Typography.sizes['2xl'], fontWeight: '800', color: colors.text }}>
                      {loading ? '–' : s.count}
                    </Text>
                    <Text style={{ fontFamily: Typography.families.mono, fontSize: Typography.sizes.xs, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</Text>
                  </View>
                </Card>
              ))}
            </View>

            {/* ─── Suggested Focus ─── */}
            {loading ? (
              <SkeletonLoader count={1} type="card" />
            ) : focusDoc ? (
              <AnimatedPressable
                scaleTo={0.98}
                onPress={() => navigation.navigate('Library', { screen: 'Reading', params: { documentId: focusDoc._id } })}
              >
                <Card
                  title="Suggested Focus"
                  subtitle="AI-recommended next read"
                  headerIcon={<Ionicons name="sparkles" size={18} color="#f59e0b" />}
                >
                  <View style={{ gap: Spacing.md }}>
                    {/* Title row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${getIcon(focusDoc.fileType).color}18`, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name={getIcon(focusDoc.fileType).name} size={20} color={getIcon(focusDoc.fileType).color} />
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={{ fontSize: Typography.sizes.base, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                          {focusDoc.title}
                        </Text>
                        <Text style={{ fontSize: Typography.sizes.xs, color: colors.textSecondary, fontWeight: '500' }}>
                          {focusDoc.fileType} · {relativeDate(focusDoc.updatedAt)}
                        </Text>
                      </View>
                      <CognitiveLoadBadge load={focusDoc.cognitiveLoad} />
                    </View>

                    {/* Summary preview */}
                    <Text
                      style={{ fontSize: Typography.sizes.sm, color: colors.textSecondary, lineHeight: 20, fontStyle: focusDoc.summary ? 'normal' : 'italic' }}
                      numberOfLines={3}
                    >
                      {focusDoc.summary || 'AI analysis pending — summary will appear once processing completes.'}
                    </Text>

                    {/* Tags */}
                    {focusDoc.tags && focusDoc.tags.length > 0 && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {focusDoc.tags.slice(0, 4).map((tag) => {
                          const tColor = getTagColor(tag, isDark);
                          return (
                            <View
                              key={tag}
                              style={{
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: BorderRadius.full,
                                backgroundColor: tColor.bg,
                                borderWidth: 1,
                                borderColor: tColor.border,
                              }}
                            >
                              <Text style={{ fontFamily: Typography.families.mono, fontSize: 10, fontWeight: '700', color: tColor.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                {tag}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                </Card>
              </AnimatedPressable>
            ) : null}

            {/* ─── Recent Files ─── */}
            {!loading && documents.length > 0 && (
              <View style={{ gap: Spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontFamily: Typography.families.display, fontSize: Typography.sizes.lg, color: colors.text }}>Recent Files</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Library')}>
                    <Text style={{ fontFamily: Typography.families.mono, fontSize: Typography.sizes.xs, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 }}>See All</Text>
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={documents}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item._id}
                  contentContainerStyle={{ gap: Spacing.md }}
                  windowSize={5}
                  initialNumToRender={4}
                  maxToRenderPerBatch={4}
                  removeClippedSubviews={true}
                  renderItem={({ item }) => {
                    const ic = getIcon(item.fileType);
                    return (
                      <AnimatedPressable
                        scaleTo={0.96}
                        onPress={() => navigation.navigate('Library', { screen: 'Reading', params: { documentId: item._id } })}
                        style={{
                          width: CARD_WIDTH,
                          padding: Spacing.md,
                          borderRadius: BorderRadius.xl,
                          borderWidth: 1,
                          borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.surface,
                          gap: Spacing.sm,
                        }}
                      >
                        {/* Icon + type */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${ic.color}18`, alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name={ic.name} size={18} color={ic.color} />
                          </View>
                          <CognitiveLoadBadge load={item.cognitiveLoad} compact />
                        </View>
                        {/* Title */}
                        <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '700', color: colors.text, marginTop: 4 }} numberOfLines={2}>
                          {item.title}
                        </Text>
                        {/* Date */}
                        <Text style={{ fontSize: 11, fontWeight: '500', color: colors.textSecondary }}>
                          {relativeDate(item.updatedAt)}
                        </Text>
                      </AnimatedPressable>
                    );
                  }}
                />
              </View>
            )}
          </View>
        )}

        {loading && (
          <View style={{ gap: Spacing.md }}>
            <Text style={{ fontSize: Typography.sizes.lg, fontWeight: '800', color: colors.text }}>Recent Files</Text>
            <SkeletonLoader count={3} type="list" />
          </View>
        )}

        {/* ─── Node Status ─── */}
        <Card
          title="Node Status"
          subtitle="Your current system configuration"
          headerIcon={<Ionicons name="pulse-outline" size={20} color={colors.primary} />}
        >
          <View style={{ gap: Spacing.md }}>
            {[
              { label: 'Username', value: `@${user?.username || '—'}` },
              { label: 'Persona', badge: user?.persona || 'general' },
              { label: 'Email', value: user?.email || '—' },
            ].map((row, i) => (
              <View key={row.label}>
                {i > 0 && <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border, marginBottom: Spacing.md }} />}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: Typography.sizes.base, fontWeight: '600', color: colors.textSecondary }}>{row.label}</Text>
                  {row.badge ? (
                    <Badge label={row.badge} variant="primary" />
                  ) : (
                    <Text style={{ fontSize: row.label === 'Email' ? Typography.sizes.sm : Typography.sizes.base, fontWeight: '700', color: colors.text }}>{row.value}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
