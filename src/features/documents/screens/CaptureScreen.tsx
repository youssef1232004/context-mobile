import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Animated, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../../context/ThemeContext';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Toast } from '../../../components/Toast';
import { useToast } from '../../../hooks/useToast';
import { documentService } from '../api/documentService';
import { Spacing, Typography, BorderRadius } from '../../../theme';

const FILE_ACCEPT = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const MAX_TEXT_CHARS = 5000;

type CaptureMode = 'file' | 'camera' | 'text';

interface PickedFile {
  name: string;
  uri: string;
  mimeType: string;
  size?: number;
}

export default function CaptureScreen() {
  const { colors, isDark } = useTheme();
  const { toast, showToast, hideToast } = useToast();

  // ── Mode ──
  const [mode, setMode] = useState<CaptureMode>('file');

  // ── File state ──
  const [pickedFiles, setPickedFiles] = useState<PickedFile[]>([]);

  // ── Text state ──
  const [pasteText, setPasteText] = useState('');
  const [textTitle, setTextTitle] = useState('');

  // ── Upload state ──
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ── Helpers ──
  const formatBytes = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mime: string): React.ComponentProps<typeof Ionicons>['name'] => {
    if (mime.includes('pdf')) return 'document-text';
    if (mime.includes('word') || mime.includes('doc')) return 'document';
    if (mime.includes('image')) return 'image';
    return 'reader';
  };

  const getFileColor = (mime: string) => {
    if (mime.includes('pdf')) return '#ef4444';
    if (mime.includes('word') || mime.includes('doc')) return '#3b82f6';
    if (mime.includes('image')) return '#8b5cf6';
    return '#f59e0b';
  };

  // ── Pickers ──
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: FILE_ACCEPT,
        copyToCacheDirectory: true,
        multiple: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const files = result.assets.map((a) => ({
        name: a.name,
        uri: a.uri,
        mimeType: a.mimeType || 'application/octet-stream',
        size: a.size,
      }));
      setPickedFiles((prev) => [...prev, ...files]);
    } catch {
      showToast('Failed to pick document', 'error');
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showToast('Camera permission is required', 'error');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const name = asset.fileName || `photo_${Date.now()}.jpg`;
      setPickedFiles((prev) => [...prev, {
        name,
        uri: asset.uri,
        mimeType: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
      }]);
      setMode('file'); // switch to file view to show the picked image
    } catch {
      showToast('Camera capture failed', 'error');
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('Gallery permission is required', 'error');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.length) return;
      const files = result.assets.map((a) => ({
        name: a.fileName || `image_${Date.now()}.jpg`,
        uri: a.uri,
        mimeType: a.mimeType || 'image/jpeg',
        size: a.fileSize,
      }));
      setPickedFiles((prev) => [...prev, ...files]);
      setMode('file');
    } catch {
      showToast('Gallery selection failed', 'error');
    }
  };

  const removeFile = (idx: number) => {
    setPickedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Upload ──
  const handleUploadFiles = async () => {
    if (pickedFiles.length === 0) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      pickedFiles.forEach((f) => {
        formData.append('files', {
          uri: f.uri,
          name: f.name,
          type: f.mimeType,
        } as any);
      });

      await documentService.uploadWithProgress(formData, (pct) => setUploadProgress(pct));
      showToast(`${pickedFiles.length} file${pickedFiles.length > 1 ? 's' : ''} uploaded!`, 'success');
      setPickedFiles([]);
      setUploadProgress(0);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Upload failed. Please try again.';
      showToast(msg, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadText = async () => {
    if (!pasteText.trim()) return;
    setIsUploading(true);
    try {
      await documentService.uploadText(pasteText.trim(), textTitle.trim() || undefined);
      showToast('Text snippet saved!', 'success');
      setPasteText('');
      setTextTitle('');
      Keyboard.dismiss();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to save text snippet.';
      showToast(msg, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // ── Mode tabs ──
  const MODES: { key: CaptureMode; icon: React.ComponentProps<typeof Ionicons>['name']; label: string }[] = [
    { key: 'file', icon: 'document-attach-outline', label: 'Files' },
    { key: 'camera', icon: 'camera-outline', label: 'Camera' },
    { key: 'text', icon: 'create-outline', label: 'Paste Text' },
  ];

  const totalSize = pickedFiles.reduce((s, f) => s + (f.size || 0), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <Toast {...toast} onHide={hideToast} />

      <ScrollView contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.lg, paddingBottom: Spacing['4xl'] }} keyboardShouldPersistTaps="handled">
        {/* ── Header ── */}
        <View>
          <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Capture
          </Text>
          <Text style={{ fontSize: Typography.sizes['3xl'], fontWeight: '800', color: colors.text, marginTop: 4 }}>
            Add Document
          </Text>
        </View>

        {/* ── Mode Tabs ── */}
        <View style={{
          flexDirection: 'row', borderRadius: BorderRadius.xl, overflow: 'hidden',
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f1f4',
          padding: 4,
        }}>
          {MODES.map((m) => {
            const active = mode === m.key;
            return (
              <TouchableOpacity
                key={m.key}
                onPress={() => setMode(m.key)}
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                  paddingVertical: 10, borderRadius: BorderRadius.lg,
                  backgroundColor: active ? (isDark ? colors.primary : '#fff') : 'transparent',
                  shadowColor: active ? '#000' : 'transparent',
                  shadowOffset: { width: 0, height: 2 }, shadowOpacity: active ? 0.1 : 0, shadowRadius: 4, elevation: active ? 3 : 0,
                }}
              >
                <Ionicons name={m.icon} size={16} color={active ? (isDark ? '#000' : colors.primary) : colors.textSecondary} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: active ? (isDark ? '#000' : colors.primary) : colors.textSecondary }}>{m.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ═══════════ FILE MODE ═══════════ */}
        {mode === 'file' && (
          <>
            {/* Drop zone */}
            <TouchableOpacity
              onPress={handlePickDocument}
              activeOpacity={0.7}
              style={{
                borderWidth: 2, borderStyle: 'dashed',
                borderColor: pickedFiles.length > 0 ? colors.primary : (isDark ? 'rgba(255,255,255,0.15)' : colors.border),
                borderRadius: BorderRadius['2xl'], padding: Spacing['2xl'], alignItems: 'center',
                backgroundColor: pickedFiles.length > 0
                  ? (isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)')
                  : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                gap: Spacing.sm,
              }}
            >
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="cloud-upload-outline" size={28} color={colors.primary} />
              </View>
              <Text style={{ fontSize: Typography.sizes.base, fontWeight: '700', color: colors.text }}>
                Tap to select files
              </Text>
              <Text style={{ fontSize: Typography.sizes.xs, color: colors.textSecondary, textAlign: 'center' }}>
                PDF, Word (.docx), or plain text (.txt)
              </Text>
            </TouchableOpacity>

            {/* Picked files list */}
            {pickedFiles.length > 0 && (
              <View style={{ gap: Spacing.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {pickedFiles.length} file{pickedFiles.length > 1 ? 's' : ''} · {formatBytes(totalSize)}
                  </Text>
                  <TouchableOpacity onPress={() => setPickedFiles([])}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#ef4444' }}>Clear All</Text>
                  </TouchableOpacity>
                </View>

                {pickedFiles.map((f, idx) => {
                  const ic = getFileIcon(f.mimeType);
                  const clr = getFileColor(f.mimeType);
                  return (
                    <View key={`${f.name}-${idx}`} style={{
                      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md,
                      borderRadius: BorderRadius.xl, borderWidth: 1,
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.surface,
                    }}>
                      <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: `${clr}18`, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name={ic} size={18} color={clr} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }} numberOfLines={1}>{f.name}</Text>
                        <Text style={{ fontSize: 11, color: colors.textSecondary }}>{formatBytes(f.size)}</Text>
                      </View>
                      <TouchableOpacity onPress={() => removeFile(idx)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Upload button + progress */}
            {pickedFiles.length > 0 && (
              <View style={{ gap: Spacing.sm }}>
                {isUploading && (
                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary }}>Uploading…</Text>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>{uploadProgress}%</Text>
                    </View>
                    <View style={{ height: 6, borderRadius: 3, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb', overflow: 'hidden' }}>
                      <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.primary, width: `${uploadProgress}%` }} />
                    </View>
                  </View>
                )}
                <Button
                  title={isUploading ? 'Uploading…' : `Upload ${pickedFiles.length} File${pickedFiles.length > 1 ? 's' : ''}`}
                  onPress={handleUploadFiles}
                  loading={isUploading}
                  fullWidth
                  icon={!isUploading ? <Ionicons name="cloud-upload-outline" size={20} color={isDark ? '#000' : '#fff'} /> : undefined}
                />
              </View>
            )}
          </>
        )}

        {/* ═══════════ CAMERA MODE ═══════════ */}
        {mode === 'camera' && (
          <View style={{ gap: Spacing.lg }}>
            <TouchableOpacity
              onPress={handlePickImage}
              activeOpacity={0.7}
              style={{
                borderWidth: 2, borderStyle: 'dashed',
                borderColor: isDark ? 'rgba(255,255,255,0.15)' : colors.border,
                borderRadius: BorderRadius['2xl'], padding: Spacing['2xl'], alignItems: 'center',
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                gap: Spacing.md,
              }}
            >
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(139,92,246,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="camera" size={28} color="#8b5cf6" />
              </View>
              <Text style={{ fontSize: Typography.sizes.base, fontWeight: '700', color: colors.text }}>Take a Photo</Text>
              <Text style={{ fontSize: Typography.sizes.xs, color: colors.textSecondary }}>Capture a document with your camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePickFromGallery}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
                padding: Spacing.lg, borderRadius: BorderRadius.xl, borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.surface,
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(59,130,246,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="images-outline" size={22} color="#3b82f6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.sizes.base, fontWeight: '700', color: colors.text }}>Choose from Gallery</Text>
                <Text style={{ fontSize: Typography.sizes.xs, color: colors.textSecondary }}>Select images from your photo library</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* ═══════════ TEXT MODE ═══════════ */}
        {mode === 'text' && (
          <View style={{ gap: Spacing.lg }}>
            {/* Title input */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>
                Title (optional)
              </Text>
              <TextInput
                value={textTitle}
                onChangeText={setTextTitle}
                placeholder="Give your snippet a title…"
                placeholderTextColor={colors.textSecondary}
                style={{
                  borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.12)' : colors.border,
                  borderRadius: BorderRadius.lg, padding: Spacing.md,
                  fontSize: Typography.sizes.sm, color: colors.text, fontWeight: '600',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#fafafa',
                }}
              />
            </View>

            {/* Text area */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>
                Content
              </Text>
              <TextInput
                value={pasteText}
                onChangeText={(t) => { if (t.length <= MAX_TEXT_CHARS) setPasteText(t); }}
                placeholder="Paste or type your text here…"
                placeholderTextColor={colors.textSecondary}
                multiline
                textAlignVertical="top"
                style={{
                  borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.12)' : colors.border,
                  borderRadius: BorderRadius.xl, padding: Spacing.md,
                  fontSize: Typography.sizes.sm, color: colors.text, fontWeight: '500',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#fafafa',
                  minHeight: 180, maxHeight: 300,
                }}
              />
              {/* Character count */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: pasteText.length > MAX_TEXT_CHARS * 0.9 ? '#ef4444' : colors.textSecondary }}>
                  {pasteText.length > 0 ? `${pasteText.length.toLocaleString()} characters` : 'No text entered'}
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, fontFamily: 'monospace' }}>
                  {pasteText.length.toLocaleString()}/{MAX_TEXT_CHARS.toLocaleString()}
                </Text>
              </View>
              {/* Character progress bar */}
              <View style={{ height: 3, borderRadius: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb', overflow: 'hidden' }}>
                <View style={{
                  height: 3, borderRadius: 2,
                  width: `${Math.min((pasteText.length / MAX_TEXT_CHARS) * 100, 100)}%`,
                  backgroundColor: pasteText.length > MAX_TEXT_CHARS * 0.9 ? '#ef4444' : colors.primary,
                }} />
              </View>
            </View>

            {/* Submit */}
            {pasteText.trim().length > 0 && (
              <Button
                title={isUploading ? 'Saving…' : 'Save Text Snippet'}
                onPress={handleUploadText}
                loading={isUploading}
                fullWidth
                icon={!isUploading ? <Ionicons name="save-outline" size={20} color={isDark ? '#000' : '#fff'} /> : undefined}
              />
            )}
          </View>
        )}

        {/* ── Supported Formats ── */}
        <Card title="Supported Formats" headerIcon={<Ionicons name="information-circle-outline" size={18} color={colors.primary} />}>
          <View style={{ gap: Spacing.sm }}>
            {[
              { icon: 'document-text' as const, label: 'PDF', desc: 'Portable Document Format', color: '#ef4444' },
              { icon: 'document' as const, label: 'Word', desc: '.doc / .docx', color: '#3b82f6' },
              { icon: 'reader' as const, label: 'Plain Text', desc: '.txt files', color: '#f59e0b' },
              { icon: 'image' as const, label: 'Images', desc: 'Camera & gallery photos', color: '#8b5cf6' },
            ].map((fmt) => (
              <View key={fmt.label} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${fmt.color}15`, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={fmt.icon} size={18} color={fmt.color} />
                </View>
                <View>
                  <Text style={{ fontSize: Typography.sizes.sm, fontWeight: '700', color: colors.text }}>{fmt.label}</Text>
                  <Text style={{ fontSize: Typography.sizes.xs, color: colors.textSecondary }}>{fmt.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
