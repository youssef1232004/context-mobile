import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../context/ThemeContext';
import { Button } from '../../../components/ui/Button';
import { Toast } from '../../../components/ui/Toast';
import { useToast } from '../../../hooks/useToast';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store/store';
import { applySemanticFolders } from '../../documents/store/documentSlice';
import { documentService } from '../../documents/api/documentService';
import { Spacing, Typography, BorderRadius } from '../../../theme';

interface ProposedFolder {
  documentId: string;
  newPath: string;
}

interface TreeNode {
  name: string;
  isFolder: boolean;
  children: Record<string, TreeNode>;
}

const buildTree = (proposals: ProposedFolder[], originalDocs: { _id: string, title: string }[]) => {
  const root: TreeNode = { name: 'Root', isFolder: true, children: {} };

  proposals.forEach(p => {
    const parts = p.newPath.split('/').filter(Boolean);
    let current = root;
    parts.forEach(part => {
      if (!current.children[part]) {
        current.children[part] = { name: part, isFolder: true, children: {} };
      }
      current = current.children[part];
    });
    const docTitle = originalDocs.find(d => d._id === p.documentId)?.title || `Document (${p.documentId.slice(-6)})`;
    current.children[`doc_${p.documentId}`] = {
      name: docTitle,
      isFolder: false,
      children: {},
    };
  });

  return root;
};

const TreeView = ({ node, depth = 0 }: { node: TreeNode; depth?: number }) => {
  const { colors } = useTheme();
  const childrenArray = Object.values(node.children).sort((a, b) => {
    if (a.isFolder === b.isFolder) return a.name.localeCompare(b.name);
    return a.isFolder ? -1 : 1;
  });

  return (
    <View style={{ paddingLeft: depth > 1 ? 16 : 0 }}>
      {depth > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 6 }}>
          <Ionicons 
            name={node.isFolder ? 'folder' : 'document-text'} 
            size={18} 
            color={node.isFolder ? '#f59e0b' : colors.primary} 
          />
          <Text style={{ fontSize: Typography.sizes.sm, fontWeight: node.isFolder ? '700' : '500', color: colors.text }} numberOfLines={1}>
            {node.name}
          </Text>
        </View>
      )}
      {childrenArray.map((child, idx) => (
        <TreeView key={`${child.name}_${idx}`} node={child} depth={depth + 1} />
      ))}
    </View>
  );
};

export default function FolderProposalScreen({ route, navigation }: any) {
  const { colors, isDark } = useTheme();
  const { toast, showToast, hideToast } = useToast();

  const dispatch = useDispatch<AppDispatch>();
  const { isActionLoading: applying } = useSelector((state: RootState) => state.document);

  const [tab, setTab] = useState<'messy' | 'clean'>('clean');

  const proposals: ProposedFolder[] = route?.params?.initialProposals || [];
  const originalDocs: { _id: string, title: string }[] = route?.params?.originalDocs || [];

  const cleanTree = useMemo(() => buildTree(proposals, originalDocs), [proposals, originalDocs]);

  const handleApply = async () => {
    try {
      await dispatch(applySemanticFolders(proposals)).unwrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Organization complete!', 'success');
      navigation.goBack();
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(e || 'Failed to apply folder structure', 'error');
    }
  };

  const handleDiscard = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <Toast {...toast} onHide={hideToast} />

      <View style={{ padding: Spacing.xl, paddingBottom: 0 }}>
        <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '600', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1.5 }}>
          AI Organization Complete
        </Text>
        <Text style={{ fontSize: Typography.sizes['3xl'], fontWeight: '800', color: colors.text, marginTop: 4 }}>
          Review Proposal
        </Text>
        <Text style={{ fontSize: Typography.sizes.base, color: colors.textSecondary, marginTop: 4 }}>
          Here is how your documents will be structured.
        </Text>

        <View style={{ flexDirection: 'row', marginTop: Spacing.xl, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6', borderRadius: BorderRadius.xl, padding: 4 }}>
          <TouchableOpacity 
            onPress={() => setTab('messy')}
            style={{ flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: tab === 'messy' ? (isDark ? '#374151' : '#fff') : 'transparent', borderRadius: BorderRadius.lg, shadowColor: tab === 'messy' ? '#000' : 'transparent', shadowOpacity: 0.05, shadowRadius: 4 }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: tab === 'messy' ? colors.text : colors.textSecondary }}>Original (Messy)</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setTab('clean')}
            style={{ flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: tab === 'clean' ? (isDark ? '#374151' : '#fff') : 'transparent', borderRadius: BorderRadius.lg, shadowColor: tab === 'clean' ? '#000' : 'transparent', shadowOpacity: 0.05, shadowRadius: 4 }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: tab === 'clean' ? colors.text : colors.textSecondary }}>Proposed (Clean)</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.xl }}>
        <View style={{ 
          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.surface, 
          borderRadius: BorderRadius.xl, 
          borderWidth: 1, 
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
          padding: Spacing.md,
          minHeight: 250
        }}>
          {tab === 'messy' ? (
            <View>
              {originalDocs.map((doc, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 6 }}>
                  <Ionicons name="document-text" size={18} color={colors.textSecondary} />
                  <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '500', color: colors.textSecondary }} numberOfLines={1}>
                    {doc.title}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <TreeView node={cleanTree} />
          )}
        </View>
      </ScrollView>

      <View style={{ padding: Spacing.xl, paddingTop: 0, gap: Spacing.md }}>
        <Button
          title={applying ? 'Applying…' : 'Accept Organization'}
          onPress={handleApply}
          loading={applying}
          icon={!applying ? <Ionicons name="checkmark-circle-outline" size={20} color={isDark ? '#000' : '#fff'} /> : undefined}
          fullWidth
        />
        <Button
          title="Discard AI (Keep Original)"
          onPress={handleDiscard}
          variant="outline"
          fullWidth
          disabled={applying}
        />
      </View>
    </SafeAreaView>
  );
}
