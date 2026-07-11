import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../../../context/ThemeContext';
import { Spacing, BorderRadius } from '../../../../theme';
import { useAppDispatch } from '../../../../store/hooks';
import { prettifyDocument, updateDocumentPrettifiedJson } from '../../store/documentSlice';
import type { Document } from '../../api/documentService';
import { computeCapacity, convertToMarkdown, stripHtml } from '../../../../utils/prettify-helpers';
import { PrettifyDocumentView } from './PrettifyDocumentView';
import { PrettifyExcelView } from './PrettifyExcelView';
import { useToast } from '../../../../hooks/useToast';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../../store/store';
import Papa from 'papaparse';
import { Document as DocxDocument, Packer, Paragraph, HeadingLevel } from 'docx';
import * as XLSX from 'xlsx';

interface PrettifyViewerProps {
  document: Document;
}

export const PrettifyViewer: React.FC<PrettifyViewerProps> = ({ document: doc }) => {
  const { colors, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const prettifyState = useSelector((state: RootState) => state.document.prettifyState);
  const capacity = useMemo(() => computeCapacity(doc.fileType, doc.extractedText || ''), [doc]);

  // Handle cached result
  useEffect(() => {
    if (doc.prettifiedJson && typeof doc.prettifiedJson === 'object' && prettifyState.status === 'initial') {
      dispatch(updateDocumentPrettifiedJson({ documentId: doc._id, result: doc.prettifiedJson as any }));
    }
  }, [doc.prettifiedJson, doc._id]);

  const handlePrettify = (force = false) => {
    dispatch(prettifyDocument({ documentId: doc._id, force }));
  };

  const handleShareText = async () => {
    const result = prettifyState.result;
    if (!result || result.type !== 'document') return;

    try {
      showToast('Generating .docx...', 'info');
      const title = doc.title.replace(/\.[^/.]+$/, '');
      const fileUri = `${FileSystem.cacheDirectory}${title} - Organized.docx`;

      const children: any[] = [];
      (result.blocks || []).forEach(block => {
        if (block.type === 'heading') {
          let headingLevel = HeadingLevel.HEADING_1;
          if (block.level === 2) headingLevel = HeadingLevel.HEADING_2;
          if (block.level === 3) headingLevel = HeadingLevel.HEADING_3;
          if (block.level === 4) headingLevel = HeadingLevel.HEADING_4;
          if (block.level === 5) headingLevel = HeadingLevel.HEADING_5;
          if (block.level === 6) headingLevel = HeadingLevel.HEADING_6;
          children.push(new Paragraph({ text: stripHtml(block.text), heading: headingLevel }));
        } else if (block.type === 'paragraph' || block.type === 'quote') {
          children.push(new Paragraph({ text: stripHtml(block.text) }));
        } else if (block.type === 'code') {
          children.push(new Paragraph({ text: block.text }));
        } else if (block.type === 'bullet_list_item' || block.type === 'mcq_option') {
          const text = block.type === 'mcq_option' ? `${block.letter}) ${stripHtml(block.text)}` : stripHtml(block.text);
          children.push(new Paragraph({ text, bullet: { level: 0 } }));
        } else if (block.type === 'numbered_list_item') {
          children.push(new Paragraph({ text: stripHtml(block.text), bullet: { level: 0 } }));
        } else if (block.type === 'table') {
          children.push(new Paragraph({ text: block.headers.map(cell => stripHtml(cell)).join(' | ') }));
          block.rows.forEach(row => {
            children.push(new Paragraph({ text: row.map(cell => stripHtml(cell)).join(' | ') }));
          });
        } else if (block.type === 'divider') {
          children.push(new Paragraph({ text: '---' }));
        }
      });

      const docxFile = new DocxDocument({
        sections: [{ children }]
      });

      const base64Str = await Packer.toBase64String(docxFile);
      await FileSystem.writeAsStringAsync(fileUri, base64Str, { encoding: FileSystem.EncodingType.Base64 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          dialogTitle: `Share "${title}"`,
        });
      } else {
        showToast('Saved to device', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to share document', 'error');
    }
  };

  const handleCopyText = async () => {
    const result = prettifyState.result;
    if (!result || result.type !== 'document') return;

    try {
      const text = convertToMarkdown(result);
      await Clipboard.setStringAsync(text);
      showToast('Text copied to clipboard', 'success');
    } catch (e) {
      showToast('Failed to copy text', 'error');
    }
  };

  const handleShareCsv = async () => {
    const result = prettifyState.result;
    if (!result || result.type !== 'spreadsheet') return;

    try {
      showToast('Generating .xlsx...', 'info');
      const wb = XLSX.utils.book_new();
      result.sheets.forEach((sheet, idx) => {
        const ws = XLSX.utils.aoa_to_sheet([sheet.headers, ...sheet.rows]);
        XLSX.utils.book_append_sheet(wb, ws, sheet.name || `Sheet${idx + 1}`);
      });
      const base64Str = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

      const title = doc.title.replace(/\.[^/.]+$/, '');
      const fileUri = `${FileSystem.cacheDirectory}${title} - Organized.xlsx`;
      await FileSystem.writeAsStringAsync(fileUri, base64Str, { encoding: FileSystem.EncodingType.Base64 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: `Share "${title}"`,
        });
      } else {
        showToast('Sharing not available', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to share spreadsheet', 'error');
    }
  };

  const getCapacityColor = (pct: number, isOver: boolean) => {
    if (isOver || pct >= 100) return { text: '#ef4444', icon: 'alert-circle', bg: 'rgba(239,68,68,0.1)' };
    if (pct > 80) return { text: '#f59e0b', icon: 'warning', bg: 'rgba(245,158,11,0.1)' };
    return { text: '#10b981', icon: 'checkmark-circle', bg: 'rgba(16,185,129,0.1)' };
  };

  if (prettifyState.status === 'initial') {
    const capColor = capacity ? getCapacityColor(capacity.percentage, capacity.isOverLimit) : null;

    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl }}>
        <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl }}>
          <Ionicons name="sparkles" size={40} color="#6366f1" />
        </View>

        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8, textAlign: 'center' }}>
          Prettify this Document
        </Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 22 }}>
          AI will organize and structure your content into a clean, readable format — ready to preview and share.
        </Text>

        <TouchableOpacity
          onPress={() => handlePrettify(false)}
          disabled={capacity?.isOverLimit}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: capacity?.isOverLimit ? (isDark ? 'rgba(255,255,255,0.05)' : '#e5e7eb') : colors.primary,
            paddingHorizontal: 32, paddingVertical: 14, borderRadius: BorderRadius.xl,
            marginBottom: Spacing.xl,
          }}
        >
          <Ionicons name="sparkles" size={18} color={capacity?.isOverLimit ? colors.textSecondary : '#fff'} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: capacity?.isOverLimit ? colors.textSecondary : '#fff' }}>
            Prettify ✨
          </Text>
        </TouchableOpacity>

        {capacity && capColor && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: capColor.bg }}>
            <Ionicons name={capColor.icon as any} size={14} color={capColor.text} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: capColor.text }}>{capacity.label}</Text>
          </View>
        )}
      </View>
    );
  }

  if (prettifyState.status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl }}>
        <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl }}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 }}>Organizing your document…</Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>AI is structuring your content. This usually takes 10–20 seconds.</Text>
      </View>
    );
  }

  if (prettifyState.status === 'error') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl }}>
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl }}>
          <Ionicons name="alert-circle" size={32} color="#ef4444" />
        </View>

        {prettifyState.limitError ? (
          <>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8, textAlign: 'center' }}>
              Document Too Large for Prettify
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 22 }}>
              {prettifyState.limitError.message}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 16, borderRadius: 12, backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb', borderWidth: 1, borderColor: isDark ? 'rgba(245,158,11,0.2)' : '#fde68a' }}>
              <Ionicons name="bulb" size={18} color="#d97706" style={{ marginTop: 2 }} />
              <Text style={{ flex: 1, fontSize: 13, fontWeight: '500', color: '#b45309', lineHeight: 20 }}>
                {prettifyState.limitError.suggestion}
              </Text>
            </View>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8, textAlign: 'center' }}>
              Something went wrong
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl }}>
              {prettifyState.genericError}
            </Text>
            <TouchableOpacity
              onPress={() => handlePrettify(false)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: colors.primary,
                paddingHorizontal: 24, paddingVertical: 12, borderRadius: BorderRadius.xl,
              }}
            >
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Try Again</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  }

  if (prettifyState.status === 'result' && prettifyState.result) {
    if (prettifyState.result.type === 'spreadsheet') {
      return (
        <PrettifyExcelView
          result={prettifyState.result as any}
          onReorganize={() => handlePrettify(true)}
          onShare={handleShareCsv}
        />
      );
    }

    return (
      <PrettifyDocumentView
        result={prettifyState.result as any}
        isSnippet={doc.fileType === 'TextSnippet'}
        onReorganize={() => handlePrettify(true)}
        onShare={handleShareText}
        onCopy={handleCopyText}
      />
    );
  }

  return null;
};
