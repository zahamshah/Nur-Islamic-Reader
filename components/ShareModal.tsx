import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Share,
  Platform,
  Alert,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { X, Link2, Quote } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ThemeConfig } from '@/types/content';

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  excerpt: string;
  seriesTitle: string;
  themeColors: ThemeConfig['colors'];
  isDark: boolean;
  coverImage?: ImageSourcePropType;
  currentSubheading?: string;
  currentSectionText?: string;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\[\[([^\]|]+)\|[^\]]+\]\]/g, '$1')
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/---/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  } catch (e) {
    console.log('[ShareModal] Clipboard copy failed:', e);
    return false;
  }
}

export default React.memo(function ShareModal({
  visible,
  onClose,
  title,
  excerpt,
  seriesTitle,
  themeColors,
  isDark,
  coverImage,
  currentSubheading,
  currentSectionText,
}: Props) {
  const quoteExcerpt = useMemo(() => {
    if (currentSectionText) {
      const clean = stripMarkdown(currentSectionText);
      return clean.slice(0, 280);
    }
    return stripMarkdown(excerpt).slice(0, 280);
  }, [currentSectionText, excerpt]);

  const linkExcerpt = useMemo(() => {
    return stripMarkdown(excerpt).slice(0, 200);
  }, [excerpt]);

  const displaySubheading = currentSubheading || title;

  const handleShareLink = useCallback(async () => {
    const message = `📖 ${title}\nFrom "${seriesTitle}"\n\n${linkExcerpt}...`;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await Share.share({
        message,
        title: `${title} — ${seriesTitle}`,
      });
      console.log('[ShareModal] Share link result:', result);
      onClose();
    } catch (error: any) {
      console.log('[ShareModal] Share link error:', error);
      if (error?.message !== 'User did not share') {
        const copied = await copyToClipboard(message);
        if (copied) {
          Alert.alert('Copied!', 'The link info has been copied to your clipboard.');
        } else {
          Alert.alert('Share', message);
        }
      }
      onClose();
    }
  }, [title, seriesTitle, linkExcerpt, onClose]);

  const handleShareQuote = useCallback(async () => {
    const attribution = currentSubheading
      ? `— ${currentSubheading}, ${title}`
      : `— ${title}`;
    const message = `"${quoteExcerpt}"\n\n${attribution}\n📚 ${seriesTitle}`;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = await Share.share({
        message,
        title: `Quote from ${title}`,
      });
      console.log('[ShareModal] Share quote result:', result);
      onClose();
    } catch (error: any) {
      console.log('[ShareModal] Share quote error:', error);
      if (error?.message !== 'User did not share') {
        const copied = await copyToClipboard(message);
        if (copied) {
          Alert.alert('Copied!', 'The quote has been copied to your clipboard.');
        } else {
          Alert.alert('Quote', message);
        }
      }
      onClose();
    }
  }, [title, seriesTitle, quoteExcerpt, currentSubheading, onClose]);

  const accentRgba = isDark ? 'rgba(196,154,60,0.18)' : 'rgba(196,154,60,0.08)';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: themeColors.surface },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.handle, { backgroundColor: themeColors.divider }]} />

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeBtn,
              { backgroundColor: themeColors.tagBg },
              pressed && styles.closeBtnPressed,
            ]}
            hitSlop={12}
          >
            <X size={16} color={themeColors.textSecondary} />
          </Pressable>

          <View style={styles.previewCard}>
            <View
              style={[
                styles.preview,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FAFAF7',
                  borderColor: themeColors.cardBorder,
                },
              ]}
            >
              {coverImage ? (
                <View style={styles.previewHeader}>
                  <Image
                    source={coverImage}
                    style={styles.coverThumb}
                    resizeMode="cover"
                  />
                  <View style={styles.previewHeaderText}>
                    <Text
                      style={[styles.previewSeries, { color: themeColors.accent }]}
                      numberOfLines={1}
                    >
                      {seriesTitle}
                    </Text>
                    <Text
                      style={[styles.previewTitle, { color: themeColors.text }]}
                      numberOfLines={2}
                    >
                      {title}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.previewHeaderNoCover}>
                  <Text
                    style={[styles.previewSeries, { color: themeColors.accent }]}
                    numberOfLines={1}
                  >
                    {seriesTitle}
                  </Text>
                  <Text
                    style={[styles.previewTitle, { color: themeColors.text }]}
                    numberOfLines={2}
                  >
                    {title}
                  </Text>
                </View>
              )}

              {currentSubheading ? (
                <View style={[styles.subheadingBadge, { backgroundColor: accentRgba }]}>
                  <Text
                    style={[styles.subheadingText, { color: themeColors.accent }]}
                    numberOfLines={1}
                  >
                    📍 {displaySubheading}
                  </Text>
                </View>
              ) : null}

              <Text
                style={[styles.previewExcerpt, { color: themeColors.textSecondary }]}
                numberOfLines={3}
              >
                "{quoteExcerpt.slice(0, 140)}..."
              </Text>
            </View>
          </View>

          <View style={styles.options}>
            <Pressable
              onPress={handleShareLink}
              style={({ pressed }) => [
                styles.option,
                {
                  borderColor: themeColors.cardBorder,
                  backgroundColor: pressed
                    ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)')
                    : 'transparent',
                },
              ]}
              testID="share-link-btn"
            >
              <View
                style={[
                  styles.optionIcon,
                  {
                    backgroundColor: isDark
                      ? 'rgba(27,67,50,0.3)'
                      : `${themeColors.primary}14`,
                  },
                ]}
              >
                <Link2 size={19} color={themeColors.primary} />
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: themeColors.text }]}>
                  Share Link
                </Text>
                <Text style={[styles.optionDesc, { color: themeColors.textSecondary }]}>
                  Chapter title and intro
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={handleShareQuote}
              style={({ pressed }) => [
                styles.option,
                {
                  borderColor: themeColors.cardBorder,
                  backgroundColor: pressed
                    ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)')
                    : 'transparent',
                },
              ]}
              testID="share-quote-btn"
            >
              <View
                style={[
                  styles.optionIcon,
                  { backgroundColor: isDark ? 'rgba(196,154,60,0.15)' : themeColors.accentMuted },
                ]}
              >
                <Quote size={19} color={themeColors.accent} />
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: themeColors.text }]}>
                  Share Quote
                </Text>
                <Text style={[styles.optionDesc, { color: themeColors.textSecondary }]}>
                  {currentSubheading
                    ? `From "${currentSubheading}"`
                    : 'Beautiful excerpt from this chapter'}
                </Text>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 44,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 16,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeBtnPressed: {
    opacity: 0.6,
  },
  previewCard: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  preview: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  previewHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  coverThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  previewHeaderText: {
    flex: 1,
    gap: 3,
  },
  previewHeaderNoCover: {
    gap: 3,
  },
  previewSeries: {
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  subheadingBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  subheadingText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  previewExcerpt: {
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic' as const,
  },
  options: {
    paddingHorizontal: 20,
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  optionDesc: {
    fontSize: 13,
  },
});
