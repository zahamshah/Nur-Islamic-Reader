import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Share2, Settings, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { getChapterById, getSeriesById } from '@/constants/content';
import { useReaderSettings } from '@/context/ReaderSettingsContext';
import { useReadingProgress } from '@/context/ReadingProgressContext';
import { useReadingHistory } from '@/context/ReadingHistoryContext';
import { useAppSettings } from '@/context/AppSettingsContext';
import { isDarkTheme } from '@/constants/themes';
import { GlossaryEntry } from '@/types/content';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import GlossaryModal from '@/components/GlossaryModal';
import ShareModal from '@/components/ShareModal';
import ReaderSettingsSheet from '@/components/ReaderSettingsSheet';

const TIP_KEY = 'glossary_tip_shown';

interface SectionInfo {
  heading: string;
  text: string;
}

function extractSections(markdown: string): SectionInfo[] {
  const sections: SectionInfo[] = [];
  const lines = markdown.split('\n');
  let currentHeading = '';
  let currentLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const h2Match = trimmed.match(/^##\s+(.+)/);
    const h3Match = trimmed.match(/^###\s+(.+)/);
    const headingMatch = h2Match || h3Match;

    if (headingMatch) {
      if (currentHeading && currentLines.length > 0) {
        sections.push({
          heading: currentHeading,
          text: currentLines.join('\n'),
        });
      }
      currentHeading = headingMatch[1]
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/\[\[([^\]|]+)\|[^\]]+\]\]/g, '$1')
        .trim();
      currentLines = [];
    } else if (trimmed.length > 0) {
      currentLines.push(trimmed);
    }
  }

  if (currentHeading && currentLines.length > 0) {
    sections.push({
      heading: currentHeading,
      text: currentLines.join('\n'),
    });
  }

  return sections;
}

export default function ReaderScreen() {
  const { seriesId, chapterId } = useLocalSearchParams<{
    seriesId: string;
    chapterId: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings } = useReaderSettings();
  const { markProgress, updateScrollPosition, progress } = useReadingProgress();
  const { addToHistory, updateHistoryScroll } = useReadingHistory();
  const { currentThemeId, theme: appTheme } = useAppSettings();
  const dark = isDarkTheme(currentThemeId);
  const scrollRef = useRef<ScrollView>(null);
  const hasRestoredScroll = useRef<boolean>(false);
  const lastSavedScrollY = useRef<number>(0);
  const contentHeight = useRef<number>(0);
  const viewHeight = useRef<number>(0);

  const [glossaryEntry, setGlossaryEntry] = useState<GlossaryEntry | null>(null);
  const [glossaryVisible, setGlossaryVisible] = useState<boolean>(false);
  const [shareVisible, setShareVisible] = useState<boolean>(false);
  const [settingsVisible, setSettingsVisible] = useState<boolean>(false);
  const [showTip, setShowTip] = useState<boolean>(false);
  const [tipOpacity] = useState(() => new Animated.Value(0));
  const [currentSectionIdx, setCurrentSectionIdx] = useState<number>(0);

  const result = useMemo(
    () => getChapterById(seriesId ?? '', chapterId ?? ''),
    [seriesId, chapterId]
  );

  const sections = useMemo(() => {
    if (!result) return [];
    return extractSections(result.chapter.text);
  }, [result]);

  const series = useMemo(() => getSeriesById(seriesId ?? ''), [seriesId]);

  const nextChapter = useMemo(() => {
    if (!series || !result) return null;
    const idx = series.chapters.findIndex((c) => c.id === result.chapter.id);
    if (idx >= 0 && idx < series.chapters.length - 1) {
      return series.chapters[idx + 1];
    }
    return null;
  }, [series, result]);

  useEffect(() => {
    if (result) {
      markProgress(
        result.series.id,
        result.chapter.id,
        result.series.title,
        result.chapter.title
      );
      addToHistory({
        seriesId: result.series.id,
        chapterId: result.chapter.id,
        seriesTitle: result.series.title,
        chapterTitle: result.chapter.title,
        scrollY: 0,
        scrollPercentage: 0,
      });
    }
  }, [result, markProgress, addToHistory]);

  const savedScrollY = useMemo(() => {
    if (
      progress &&
      progress.seriesId === seriesId &&
      progress.chapterId === chapterId &&
      progress.scrollY > 0
    ) {
      return progress.scrollY;
    }
    return 0;
  }, [progress, seriesId, chapterId]);

  const handleContentSizeChange = useCallback(
    (_w: number, h: number) => {
      contentHeight.current = h;
      if (!hasRestoredScroll.current && savedScrollY > 0 && h > 0) {
        hasRestoredScroll.current = true;
        setTimeout(() => {
          scrollRef.current?.scrollTo({ y: savedScrollY, animated: false });
        }, 100);
      }
    },
    [savedScrollY]
  );

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const cHeight = e.nativeEvent.contentSize.height;
      const vHeight = e.nativeEvent.layoutMeasurement.height;
      viewHeight.current = vHeight;
      contentHeight.current = cHeight;
      const maxScroll = cHeight - vHeight;
      const pct = maxScroll > 0 ? Math.min(Math.round((y / maxScroll) * 100), 100) : 0;
      if (Math.abs(y - lastSavedScrollY.current) > 50) {
        lastSavedScrollY.current = y;
        updateScrollPosition(y, pct);
        if (seriesId && chapterId) {
          updateHistoryScroll(seriesId, chapterId, y, pct);
        }
      }

      if (sections.length > 0) {
        const sectionPct = maxScroll > 0 ? y / maxScroll : 0;
        const idx = Math.min(
          Math.floor(sectionPct * sections.length),
          sections.length - 1
        );
        setCurrentSectionIdx(Math.max(0, idx));
      }
    },
    [updateScrollPosition]
  );

  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const cHeight = e.nativeEvent.contentSize.height;
      const vHeight = e.nativeEvent.layoutMeasurement.height;
      const maxScroll = cHeight - vHeight;
      const pct = maxScroll > 0 ? Math.min(Math.round((y / maxScroll) * 100), 100) : 0;
      lastSavedScrollY.current = y;
      updateScrollPosition(y, pct);
      if (seriesId && chapterId) {
        updateHistoryScroll(seriesId, chapterId, y, pct);
      }
    },
    [updateScrollPosition, updateHistoryScroll, seriesId, chapterId]
  );

  useEffect(() => {
    AsyncStorage.getItem(TIP_KEY).then((val) => {
      if (!val) {
        setShowTip(true);
        Animated.timing(tipOpacity, {
          toValue: 1,
          duration: 600,
          delay: 1200,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [tipOpacity]);

  const dismissTip = useCallback(() => {
    Animated.timing(tipOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowTip(false);
      AsyncStorage.setItem(TIP_KEY, 'true');
    });
  }, [tipOpacity]);

  const handleGlossaryTap = useCallback((entry: GlossaryEntry) => {
    setGlossaryEntry(entry);
    setGlossaryVisible(true);
  }, []);

  const handleGlossaryClose = useCallback(() => {
    setGlossaryVisible(false);
  }, []);

  const handleNextChapter = useCallback(() => {
    if (nextChapter && seriesId) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.replace({ pathname: '/read/[seriesId]/[chapterId]' as any, params: { seriesId, chapterId: nextChapter.id } });
    }
  }, [nextChapter, seriesId, router]);

  const colors = appTheme.colors;
  const bgColor = colors.background;
  const cardBg = colors.surface;
  const textColor = colors.text;
  const borderColor = colors.cardBorder;

  if (!result) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: bgColor }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={[styles.errorText, { color: textColor }]}>Chapter not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={[styles.backLinkText, { color: colors.primary }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const { chapter } = result;
  const glossary = result.series.glossary;
  const plainExcerpt = chapter.text
    .replace(/\[\[([^\]|]+)\|[^\]]+\]\]/g, '$1')
    .replace(/[#*>\-_]/g, '')
    .trim()
    .slice(0, 300);

  return (
    <View style={[styles.root, { backgroundColor: bgColor }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View
        style={[
          styles.toolbar,
          {
            paddingTop: insets.top + 4,
            backgroundColor: bgColor,
            borderBottomColor: borderColor,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.toolbarBtn,
            { backgroundColor: colors.tagBg },
            pressed && styles.toolbarBtnPressed,
          ]}
          hitSlop={8}
        >
          <ArrowLeft size={18} color={textColor} />
        </Pressable>

        <Text
          style={[styles.toolbarTitle, { color: textColor }]}
          numberOfLines={1}
        >
          {chapter.title}
        </Text>

        <View style={styles.toolbarRight}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShareVisible(true);
            }}
            style={({ pressed }) => [
              styles.toolbarBtn,
              { backgroundColor: colors.tagBg },
              pressed && styles.toolbarBtnPressed,
            ]}
            hitSlop={8}
          >
            <Share2 size={17} color={textColor} />
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSettingsVisible(true);
            }}
            style={({ pressed }) => [
              styles.toolbarBtn,
              { backgroundColor: colors.tagBg },
              pressed && styles.toolbarBtnPressed,
            ]}
            hitSlop={8}
          >
            <Settings size={17} color={textColor} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        onContentSizeChange={handleContentSizeChange}
        scrollEventThrottle={64}
      >
        {showTip ? (
          <Animated.View style={[styles.tipContainer, { opacity: tipOpacity }]}>
            <Pressable
              onPress={dismissTip}
              style={[
                styles.tip,
                {
                  backgroundColor: colors.accentMuted,
                  borderColor: dark ? 'rgba(196,154,60,0.25)' : 'rgba(196,154,60,0.2)',
                },
              ]}
            >
              <Text
                style={[
                  styles.tipText,
                  { color: colors.tagText },
                ]}
              >
                💡 Tap highlighted terms to explore key concepts
              </Text>
              <Text style={[styles.tipDismiss, { color: colors.accent }]}>
                Dismiss
              </Text>
            </Pressable>
          </Animated.View>
        ) : null}

        <View
          style={[
            styles.readerCard,
            {
              backgroundColor: cardBg,
              borderColor: borderColor,
            },
          ]}
        >
          <MarkdownRenderer
            markdown={chapter.text}
            fontSize={settings.fontSize}
            lineHeight={settings.lineHeight}
            themeColors={{
              text: textColor,
              textSecondary: colors.textSecondary,
              border: borderColor,
              accent: colors.accent,
              accentMuted: colors.accentMuted,
              primary: colors.primary,
              accentLight: colors.accentLight,
            }}
            isDark={dark}
            glossary={glossary}
            onGlossaryTap={handleGlossaryTap}
          />
        </View>

        {nextChapter ? (
          <Pressable
            onPress={handleNextChapter}
            style={({ pressed }) => [
              styles.nextChapter,
              {
                backgroundColor: cardBg,
                borderColor: borderColor,
              },
              pressed && styles.nextChapterPressed,
            ]}
          >
            <View style={styles.nextChapterContent}>
              <Text style={[styles.nextLabel, { color: colors.accent }]}>
                Next Chapter
              </Text>
              <Text style={[styles.nextTitle, { color: textColor }]}>
                {nextChapter.title}
              </Text>
              {nextChapter.subtitle ? (
                <Text
                  style={[
                    styles.nextSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  {nextChapter.subtitle}
                </Text>
              ) : null}
            </View>
            <ChevronRight size={20} color={colors.accent} />
          </Pressable>
        ) : null}
      </ScrollView>

      <GlossaryModal
        entry={glossaryEntry}
        visible={glossaryVisible}
        onClose={handleGlossaryClose}
        themeColors={colors}
        isDark={dark}
      />

      <ShareModal
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        title={chapter.title}
        excerpt={plainExcerpt}
        seriesTitle={result.series.title}
        themeColors={colors}
        isDark={dark}
        coverImage={result.series.coverImage}
        currentSubheading={sections[currentSectionIdx]?.heading}
        currentSectionText={sections[currentSectionIdx]?.text}
      />

      <ReaderSettingsSheet
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        themeColors={colors}
        isDark={dark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  toolbarBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarBtnPressed: {
    opacity: 0.7,
  },
  toolbarTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  toolbarRight: {
    flexDirection: 'row',
    gap: 6,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tipContainer: {
    marginBottom: 14,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  tipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    flex: 1,
  },
  tipDismiss: {
    fontSize: 13,
    fontWeight: '600' as const,
    marginLeft: 12,
  },
  readerCard: {
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
  },
  nextChapter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  nextChapterPressed: {
    opacity: 0.8,
  },
  nextChapterContent: {
    flex: 1,
    gap: 3,
  },
  nextLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  nextTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  nextSubtitle: {
    fontSize: 13,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 12,
  },
  backLink: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backLinkText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
});
