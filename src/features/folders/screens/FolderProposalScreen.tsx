import React, { useState } from 'react';
import { api } from '../../../services/api';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Badge } from '../../../components/Badge';
import { Toast } from '../../../components/Toast';
import { useToast } from '../../../hooks/useToast';
import { SkeletonLoader } from '../../../components/SkeletonLoader';
import { folderService, type FolderData } from '../api/folderService';
import { documentService } from '../../documents/api/documentService';
import { Spacing, Typography, BorderRadius } from '../../../theme';

interface ProposedFolder {
  name: string;
  description: string;
  documentIds: string[];
}

export default function FolderProposalScreen() {
  const { colors, isDark } = useTheme();
  const { toast, showToast, hideToast } = useToast();

  const [documents, setDocuments] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [proposing, setProposing] = useState(false);
  const [proposals, setProposals] = useState<ProposedFolder[]>([]);
  const [creating, setCreating] = useState<string | null>(null);
  const [docsLoaded, setDocsLoaded] = useState(false);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await documentService.getAll();
      setDocuments(res.data || []);
      setDocsLoaded(true);
    } catch {
      showToast('Failed to load documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handlePropose = async () => {
    if (selected.length < 2) {
      showToast('Select at least 2 documents', 'warning');
      return;
    }
    setProposing(true);
    setProposals([]);
    try {
      const res = await api.post('/ai/organize-folder', { documents: selected.map(id => ({ _id: id })) });
      setProposals(res.data || []);
      if ((res.data || []).length === 0) showToast('No proposals generated', 'info');
    } catch (e: any) {
      showToast(e?.response?.data?.message || 'Proposal failed', 'error');
    } finally {
      setProposing(false);
    }
  };

  const handleCreateFolder = async (proposal: ProposedFolder) => {
    setCreating(proposal.name);
    try {
      await folderService.create({ name: proposal.name });
      showToast(`Folder "${proposal.name}" created!`, 'success');
      setProposals((prev) => prev.filter((p) => p.name !== proposal.name));
    } catch (e: any) {
      showToast(e?.response?.data?.message || 'Failed to create folder', 'error');
    } finally {
      setCreating(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <Toast {...toast} onHide={hideToast} />

      <ScrollView contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.xl }}>
        {/* Header */}
        <View>
          <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            AI Organizer
          </Text>
          <Text style={{ fontSize: Typography.sizes['3xl'], fontWeight: '800', color: colors.text, marginTop: 4 }}>
            Folder Proposals
          </Text>
          <Text style={{ fontSize: Typography.sizes.base, color: colors.textSecondary, marginTop: 4 }}>
            Select documents and let AI propose smart folder structures.
          </Text>
        </View>

        {/* Load docs */}
        {!docsLoaded && (
          <Button
            title="Load Documents"
            onPress={loadDocuments}
            loading={loading}
            icon={<Ionicons name="folder-open-outline" size={20} color={isDark ? '#000' : '#fff'} />}
          />
        )}

        {loading && <SkeletonLoader count={4} type="list" />}

        {/* Document picker */}
        {docsLoaded && documents.length > 0 && (
          <Card
            title={`Select Documents (${selected.length} selected)`}
            headerIcon={<Ionicons name="documents-outline" size={18} color={colors.primary} />}
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
                      width: 22, height: 22, borderRadius: 6,
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
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        )}

        {/* Propose button */}
        {selected.length >= 2 && (
          <Button
            title={proposing ? 'Analyzing…' : 'Propose Folder Structure'}
            onPress={handlePropose}
            loading={proposing}
            icon={!proposing ? <Ionicons name="sparkles-outline" size={20} color={isDark ? '#000' : '#fff'} /> : undefined}
            fullWidth
          />
        )}

        {proposing && <SkeletonLoader count={2} type="card" />}

        {/* Proposals */}
        {proposals.length > 0 && (
          <>
            <Text style={{ fontSize: Typography.sizes.lg, fontWeight: '700', color: colors.text }}>
              AI Suggestions ({proposals.length})
            </Text>
            {proposals.map((proposal, idx) => (
              <Card
                key={idx}
                title={proposal.name}
                subtitle={proposal.description}
                headerIcon={<Ionicons name="folder-outline" size={18} color="#f59e0b" />}
              >
                <View style={{ gap: Spacing.md }}>
                  <Text style={{ fontSize: Typography.sizes.xs, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {proposal.documentIds?.length || 0} documents
                  </Text>
                  <Button
                    title={creating === proposal.name ? 'Creating…' : 'Create This Folder'}
                    onPress={() => handleCreateFolder(proposal)}
                    loading={creating === proposal.name}
                    variant="outline"
                    icon={creating !== proposal.name ? <Ionicons name="add-circle-outline" size={18} color={colors.text} /> : undefined}
                  />
                </View>
              </Card>
            ))}
          </>
        )}

        {docsLoaded && documents.length === 0 && (
          <View style={{ alignItems: 'center', gap: Spacing.md, padding: Spacing['2xl'] }}>
            <Ionicons name="folder-open-outline" size={48} color={colors.textSecondary} />
            <Text style={{ fontSize: Typography.sizes.lg, fontWeight: '700', color: colors.text }}>No documents yet</Text>
            <Text style={{ fontSize: Typography.sizes.sm, color: colors.textSecondary, textAlign: 'center' }}>
              Capture some documents first, then return here to organize them.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
