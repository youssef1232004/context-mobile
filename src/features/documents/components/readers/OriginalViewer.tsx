import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import Pdf from 'react-native-pdf';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { Spacing, Typography, BorderRadius } from '../../../../theme';
import { ExcelViewer } from '../viewers/ExcelViewer';
import type { Document } from '../../api/documentService';

interface OriginalViewerProps {
  doc: Document;
  isImage: boolean;
  isPDF: boolean;
  pdfViewerUrl: string | null;
  isDocx: boolean;
  isExcel: boolean;
  onDownload: () => void;
  downloading: boolean;
  getMammothHtml: (url: string) => string;
}

export function OriginalViewer({
  doc, isImage, isPDF, pdfViewerUrl, isDocx, isExcel,
  onDownload, downloading, getMammothHtml
}: OriginalViewerProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      {isImage && doc.cloudinaryUrl ? (
        <ScrollView
          contentContainerStyle={{ alignItems: 'center', padding: Spacing.lg }}
          maximumZoomScale={3}
          minimumZoomScale={1}
        >
          <Image
            source={{ uri: doc.cloudinaryUrl }}
            style={{ width: '100%', aspectRatio: 1, borderRadius: BorderRadius.xl }}
            resizeMode="contain"
          />
        </ScrollView>
      ) : isPDF && doc.cloudinaryUrl ? (
        <View style={{ flex: 1, backgroundColor: isDark ? '#0a0a0c' : '#fff' }}>
          <Pdf
            trustAllCerts={false}
            source={{ uri: doc.cloudinaryUrl, cache: true }}
            style={{ flex: 1, backgroundColor: isDark ? '#0a0a0c' : '#fff' }}
            renderActivityIndicator={() => (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: Spacing.md, fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>Loading Native PDF Viewer…</Text>
              </View>
            )}
            onLoadComplete={(numberOfPages, filePath) => {
              console.log(`Number of pages: ${numberOfPages}`);
            }}
            onPageChanged={(page, numberOfPages) => {
              console.log(`Current page: ${page}`);
            }}
            onError={(error) => {
              console.log(error);
            }}
          />
        </View>
      ) : isDocx && doc.cloudinaryUrl ? (
        <WebView
          originWhitelist={['*']}
          source={{ html: getMammothHtml(doc.cloudinaryUrl) }}
          style={{ flex: 1, backgroundColor: isDark ? '#0f0f11' : '#fff' }}
          javaScriptEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: Spacing.md, fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>Rendering Word Engine…</Text>
            </View>
          )}
        />
      ) : isExcel ? (
        <ExcelViewer extractedText={doc.extractedText || doc.summary || ''} />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['2xl'], gap: Spacing.lg }}>
          <Ionicons name="document-outline" size={56} color={colors.textSecondary} />
          <Text style={{ fontSize: Typography.sizes.lg, fontWeight: '700', color: colors.text }}>Legacy Document Format</Text>
          <Text style={{ fontSize: Typography.sizes.sm, color: colors.textSecondary, textAlign: 'center' }}>
            Old .doc files can't be rendered in-app. Use the "Extracted" tab to read the text, or download the original file.
          </Text>
          <TouchableOpacity onPress={onDownload} disabled={downloading} style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            paddingHorizontal: 20, paddingVertical: 12, borderRadius: BorderRadius.lg, backgroundColor: colors.primary,
          }}>
            <Ionicons name="download-outline" size={18} color={isDark ? '#000' : '#fff'} />
            <Text style={{ fontWeight: '700', color: isDark ? '#000' : '#fff' }}>{downloading ? 'Downloading…' : 'Download File'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
