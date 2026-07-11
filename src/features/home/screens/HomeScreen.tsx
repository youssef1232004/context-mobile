import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator, DeviceEventEmitter } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { useAppSelector } from '../../../store/hooks';
import { SkeletonLoader } from '../../../components/ui/SkeletonLoader';
import { documentService, type Document } from '../../documents/api/documentService';
import { folderService } from '../../folders/api/folderService';
import { Spacing } from '../../../theme';
import { useNavigation } from '@react-navigation/native';

// Components
import { HomeGreeting } from '../components/HomeGreeting';
import { HomeEmptyState } from '../components/HomeEmptyState';
import { HomeStats } from '../components/HomeStats';
import { SuggestedFocusCard } from '../components/SuggestedFocusCard';
import { RecentFilesList } from '../components/RecentFilesList';
import { NodeStatusCard } from '../components/NodeStatusCard';

const FILE_ICONS: Record<string, { name: React.ComponentProps<typeof Ionicons>['name']; color: string }> = {
  PDF: { name: 'document-text', color: '#ef4444' },
  Word: { name: 'document', color: '#3b82f6' },
  Excel: { name: 'grid', color: '#10b981' },
  CSV: { name: 'grid', color: '#10b981' },
  Image: { name: 'image', color: '#8b5cf6' },
  TextSnippet: { name: 'reader', color: '#f59e0b' },
};

export default function HomeScreen() {
  const { colors } = useTheme();
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
        documentService.getSuggestedFocus(),
      ]);
      setDocuments(docRes.data || []);
      setTotalDocs(docRes.pagination?.totalItems ?? docRes.data?.length ?? 0);
      setFolderCount(treeRes.data?.length ?? 0);
      setFocusDoc(focusRes.data?.[0] ?? null);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh when analysis completes (fired by poller or notification)
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('REFRESH_HOME', () => {
      fetchData(true);
    });
    return () => sub.remove();
  }, [fetchData]);


  const onRefresh = () => { setRefreshing(true); fetchData(true); };

  const getIcon = useCallback((ft: string) => FILE_ICONS[ft] || { name: 'document-outline' as const, color: colors.textSecondary }, [colors]);

  const relativeDate = useCallback((iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.xl, paddingBottom: Spacing['4xl'] }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <HomeGreeting user={user} onProfilePress={() => navigation.navigate('Profile')} />

        {loading && !refreshing && totalDocs === 0 && folderCount === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing['4xl'] }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : totalDocs === 0 && folderCount === 0 ? (
          <HomeEmptyState
            onUploadFile={() => navigation.navigate('Capture', { mode: 'file' })}
            onPasteText={() => navigation.navigate('Capture', { mode: 'text' })}
          />
        ) : (
          <View style={{ gap: Spacing.xl }}>
            <HomeStats totalDocs={totalDocs} folderCount={folderCount} loading={loading} />

            {loading ? (
              <SkeletonLoader count={1} type="card" />
            ) : focusDoc ? (
              <SuggestedFocusCard
                focusDoc={focusDoc}
                getIcon={getIcon}
                relativeDate={relativeDate}
                onPress={() => navigation.navigate('Library', { screen: 'Reading', params: { documentId: focusDoc._id } })}
              />
            ) : null}

            {loading ? (
              <SkeletonLoader count={3} type="list" />
            ) : (
              <RecentFilesList
                documents={documents}
                getIcon={getIcon}
                relativeDate={relativeDate}
                onSeeAll={() => navigation.navigate('Library')}
                onDocumentPress={(id) => navigation.navigate('Library', { screen: 'Reading', params: { documentId: id } })}
              />
            )}
          </View>
        )}

        <NodeStatusCard user={user} />
      </ScrollView>
    </SafeAreaView>
  );
}
