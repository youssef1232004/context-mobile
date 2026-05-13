import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Card } from '../../../components/Card';
import { Badge } from '../../../components/Badge';
import { Button } from '../../../components/Button';
import { Toast } from '../../../components/Toast';
import { useToast } from '../../../hooks/useToast';
import { SkeletonLoader } from '../../../components/SkeletonLoader';
import { comparisonService } from '../api/comparisonService';
import { documentService } from '../../documents/api/documentService';
import { Spacing, Typography, BorderRadius } from '../../../theme';

export default function CompareScreen() {
  const { colors, isDark } = useTheme();
  const { toast, showToast, hideToast } = useToast();

  const [documents, setDocuments] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [docsLoaded, setDocsLoaded] = useState(false);

  const loadDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await documentService.getAll();
      setDocuments(res.data || []);
      setDocsLoaded(true);
    } catch {
      showToast('Failed to load documents', 'error');
    } finally {
      setLoadingDocs(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const handleCompare = async () => {
    if (selected.length < 2) {
      showToast('Select at least 2 documents to compare', 'warning');
      return;
    }
    setComparing(true);
    setResult(null);
    try {
      const res = await comparisonService.compare(selected);
      setResult(res.data);
    } catch (e: any) {
      showToast(e?.response?.data?.message || 'Comparison failed', 'error');
    } finally {
      setComparing(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <Toast {...toast} onHide={hideToast} />

      <ScrollView contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.xl }}>
        {/* Header */}
        <View>
          <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            AI Compare
          </Text>
          <Text style={{ fontSize: Typography.sizes['3xl'], fontWeight: '800', color: colors.text, marginTop: 4 }}>
            Compare Docs
          </Text>
          <Text style={{ fontSize: Typography.sizes.base, color: colors.textSecondary, marginTop: 4 }}>
            Select 2–3 documents and let AI surface similarities and differences.
          </Text>
        </View>

        {/* Load docs button */}
        {!docsLoaded && (
          <Button
            title="Load My Documents"
            onPress={loadDocuments}
            loading={loadingDocs}
            icon={<Ionicons name="folder-open-outline" size={20} color={isDark ? '#000' : '#fff'} />}
          />
        )}

        {loadingDocs && <SkeletonLoader count={4} type="list" />}

        {/* Document selection */}
        {docsLoaded && documents.length > 0 && (
          <Card
            title={`Select Documents (${selected.length}/3)`}
            headerIcon={<Ionicons name="checkbox-outline" size={18} color={colors.primary} />}
          >
            <View style={{ gap: Spacing.sm }}>
              {documents.map((doc) => {
                const isSelected = selected.includes(doc._id);
                return (
                  <TouchableOpacity
                    key={doc._id}
                    onPress={() => toggleSelect(doc._id)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: Spacing.md,
                      padding: Spacing.md,
                      borderRadius: BorderRadius.lg,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.primary : isDark ? 'rgba(255,255,255,0.08)' : colors.border,
                      backgroundColor: isSelected
                        ? isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.06)'
                        : 'transparent',
                    }}
                  >
                    <View style={{
                      width: 22, height: 22, borderRadius: 11,
                      borderWidth: 2,
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected ? colors.primary : 'transparent',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isSelected && <Ionicons name="checkmark" size={13} color={isDark ? '#000' : '#fff'} />}
                    </View>
                    <Ionicons name="document-text-outline" size={18} color={isSelected ? colors.primary : colors.textSecondary} />
                    <Text style={{ flex: 1, fontSize: Typography.sizes.sm, fontWeight: '600', color: colors.text }} numberOfLines={1}>
                      {doc.title}
                    </Text>
                    <Badge label={doc.fileType?.toUpperCase() || 'FILE'} variant={isSelected ? 'primary' : 'outline'} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        )}

        {docsLoaded && documents.length === 0 && (
          <View style={{ alignItems: 'center', gap: Spacing.md, padding: Spacing['2xl'] }}>
            <Ionicons name="documents-outline" size={48} color={colors.textSecondary} />
            <Text style={{ fontSize: Typography.sizes.lg, fontWeight: '700', color: colors.text }}>No documents yet</Text>
            <Text style={{ fontSize: Typography.sizes.sm, color: colors.textSecondary }}>Upload documents via the Capture tab first.</Text>
          </View>
        )}

        {/* Compare Button */}
        {selected.length >= 2 && (
          <Button
            title={comparing ? 'Comparing…' : `Compare ${selected.length} Documents`}
            onPress={handleCompare}
            loading={comparing}
            icon={!comparing ? <Ionicons name="git-compare-outline" size={20} color={isDark ? '#000' : '#fff'} /> : undefined}
            fullWidth
          />
        )}

        {/* Results */}
        {comparing && <SkeletonLoader count={2} type="card" />}

        {result && (
          <>
            {result.summary && (
              <Card title="Summary" headerIcon={<Ionicons name="sparkles-outline" size={18} color={colors.primary} />}>
                <Text style={{ fontSize: Typography.sizes.sm, color: colors.text, lineHeight: 22 }}>{result.summary}</Text>
              </Card>
            )}

            {result.similarities?.length > 0 && (
              <Card title="Similarities" headerIcon={<Ionicons name="git-merge-outline" size={18} color="#10b981" />}>
                <View style={{ gap: Spacing.sm }}>
                  {result.similarities.map((s: string, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }}>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#10b981" style={{ marginTop: 2 }} />
                      <Text style={{ flex: 1, fontSize: Typography.sizes.sm, color: colors.text, lineHeight: 20 }}>{s}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            )}

            {result.differences?.length > 0 && (
              <Card title="Differences" headerIcon={<Ionicons name="git-branch-outline" size={18} color="#f59e0b" />}>
                <View style={{ gap: Spacing.sm }}>
                  {result.differences.map((d: string, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }}>
                      <Ionicons name="remove-circle-outline" size={16} color="#f59e0b" style={{ marginTop: 2 }} />
                      <Text style={{ flex: 1, fontSize: Typography.sizes.sm, color: colors.text, lineHeight: 20 }}>{d}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
