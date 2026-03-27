import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Share2, Settings, ChevronRight, Volume2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { getChapterById, getSeriesById } from '@/constants/content';
import { useReaderSettings } from '@/context/ReaderSettingsContext';
import { useReadingProgress } from '@/context/ReadingProgressContext';
import { useReadingHistory } from '@/context/ReadingHistoryContext';
import { useAppSettings } from '@/context/AppSettingsContext';
import { isDarkTheme } from '@/constants/themes';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { markdownToNarrationText, prepareMarkdownForDisplay } from '@/utils/chapterMarkdown';
import ShareModal from '@/components/ShareModal';
import ReaderSettingsSheet from '@/components/ReaderSettingsSheet';
import NarrationControlSheet from '@/components/NarrationControlSheet';

interface SectionInfo {
  heading: string;
  text: string;
}

type SystemVoice = {
  id: string;
  name: string;
  language: string;
  quality?: string;
  order?: number;
};

type DisplayVoice = SystemVoice & {
  label: string;
  gender: 'male' | 'female' | 'unknown';
};

function normalizeSystemVoices(rawVoices: Record<string, unknown>[]): SystemVoice[] {
  return rawVoices
    .map((voice, index) => {
      const identifier =
        (typeof voice.identifier === 'string' && voice.identifier) ||
        (typeof voice.id === 'string' && voice.id) ||
        (typeof voice.name === 'string' && voice.name) ||
        '';
      const name =
        (typeof voice.name === 'string' && voice.name) ||
        identifier ||
        'System voice';
      const language =
        (typeof voice.language === 'string' && voice.language) || '';
      const quality =
        typeof voice.quality === 'string' ? voice.quality : undefined;
      return {
        id: identifier,
        name,
        language,
        quality,
        order: index,
      };
    })
    .filter((voice) => voice.id.length > 0);
}

function rankVoiceQuality(quality?: string) {
  if (!quality) return 0;
  const value = quality.toLowerCase();
  if (value.includes('premium')) return 3;
  if (value.includes('enhanced')) return 2;
  if (value.includes('default')) return 1;
  return 0;
}

function inferVoiceGender(voice: SystemVoice) {
  const source = `${voice.id} ${voice.name}`.toLowerCase();

  if (/\b(female|woman|girl|femme)\b/.test(source)) return 'female' as const;
  if (/\b(male|man|boy)\b/.test(source)) return 'male' as const;

  const femaleTokens = [
    'samantha',
    'susan',
    'karen',
    'tessa',
    'moira',
    'serena',
    'amelia',
    'ava',
    'allison',
    'jenny',
    'jane',
    'fiona',
    'emma',
    'olivia',
    'aria',
  ];
  const maleTokens = [
    'alex',
    'aaron',
    'daniel',
    'david',
    'fred',
    'tom',
    'thomas',
    'oliver',
    'arthur',
    'mark',
    'ryan',
    'guy',
  ];

  if (femaleTokens.some((token) => source.includes(token))) return 'female' as const;
  if (maleTokens.some((token) => source.includes(token))) return 'male' as const;

  if (/en[-_]us[-_]x[-_]sfg/.test(source)) return 'female' as const;
  if (/en[-_]us[-_]x[-_]sfm/.test(source)) return 'male' as const;
  if (/en[-_]gb[-_]x[-_]gbd/.test(source)) return 'female' as const;
  if (/en[-_]gb[-_]x[-_]gbc/.test(source)) return 'male' as const;
  if (/en[-_]us[-_]x[-_]tpc/.test(source)) return 'female' as const;
  if (/en[-_]us[-_]x[-_]tpd/.test(source)) return 'male' as const;
  if (/en[-_]au[-_]x[-_]aua/.test(source)) return 'female' as const;
  if (/en[-_]au[-_]x[-_]auc/.test(source)) return 'male' as const;
  if (/en[-_]ca[-_]x[-_]cab/.test(source)) return 'female' as const;
  if (/en[-_]ca[-_]x[-_]cac/.test(source)) return 'male' as const;

  return 'unknown' as const;
}

function labelSystemVoices(voices: SystemVoice[]): DisplayVoice[] {
  let maleCount = 0;
  let femaleCount = 0;
  let neutralCount = 0;

  return voices.map((voice) => {
    const gender = inferVoiceGender(voice);
    let label = '';

    if (gender === 'male') {
      maleCount += 1;
      label = `Man ${maleCount}`;
    } else if (gender === 'female') {
      femaleCount += 1;
      label = `Woman ${femaleCount}`;
    } else {
      neutralCount += 1;
      label = `Voice ${neutralCount}`;
    }

    return {
      ...voice,
      label,
      gender,
    };
  });
}

function pickPreferredVoices(voices: SystemVoice[], prioritizeIds?: Set<string>) {
  const isPreferredEnglish = (language: string) => /en[-_](us|gb|uk|au|ca)\b/i.test(language);
  const isEnglish = (language: string) => /^en(\b|[-_])/i.test(language);

  const preferred = voices.filter((voice) => isPreferredEnglish(voice.language));
  const english = voices.filter((voice) => isEnglish(voice.language));
  const base = preferred.length > 0 ? preferred : english.length > 0 ? english : voices;

  const noveltyBlocklist = [
    'grandma',
    'grandpa',
    'flo',
    'novelty',
    'whisper',
    'robot',
    'alien',
    'cartoon',
    'comic',
    'funny',
    'child',
    'kid',
    'chipmunk',
    'monster',
    'pirate',
    'jester',
    'celebrity',
    'meme',
    'sfx',
  ];

  const filtered = base.filter((voice) => {
    const name = `${voice.name} ${voice.id}`.toLowerCase();
    return !noveltyBlocklist.some((token) => name.includes(token));
  });

  const sorted = [...(filtered.length > 0 ? filtered : base)].sort((a, b) => {
    const aNew = prioritizeIds?.has(a.id) ? 1 : 0;
    const bNew = prioritizeIds?.has(b.id) ? 1 : 0;
    if (aNew !== bNew) return bNew - aNew;
    const qualityDelta = rankVoiceQuality(b.quality) - rankVoiceQuality(a.quality);
    if (qualityDelta !== 0) return qualityDelta;
    return (a.order ?? 0) - (b.order ?? 0);
  });

  const unique = new Map<string, SystemVoice>();
  for (const voice of sorted) {
    const key = `${voice.name}-${voice.language}`;
    if (!unique.has(key)) {
      unique.set(key, voice);
    }
  }

  const candidates = Array.from(unique.values());
  const maxVoices = 10;
  return candidates.slice(0, maxVoices);
}

function normalizeHeadingKey(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/gi, ' ').trim();
}

function splitNarrationText(text: string, maxChars = 320): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const sentences =
    normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((s) => s.trim()) ?? [];
  const chunks: string[] = [];
  let current = '';

  const pushCurrent = () => {
    if (current.trim()) {
      chunks.push(current.trim());
      current = '';
    }
  };

  for (const sentence of sentences) {
    if (!sentence) continue;

    if (sentence.length > maxChars) {
      const words = sentence.split(' ');
      for (const word of words) {
        if (!word) continue;
        if ((current.length + word.length + 1) > maxChars) {
          pushCurrent();
          current = word;
        } else {
          current = current ? `${current} ${word}` : word;
        }
      }
      pushCurrent();
      continue;
    }

    if ((current.length + sentence.length + 1) > maxChars) {
      pushCurrent();
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }

  pushCurrent();
  return chunks.length > 0 ? chunks : [normalized];
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
  const { settings, setSpeechVoiceId } = useReaderSettings();
  const { markProgress, updateScrollPosition, progress } = useReadingProgress();
  const { addToHistory, updateHistoryScroll } = useReadingHistory();
  const { currentThemeId, theme: appTheme } = useAppSettings();
  const dark = isDarkTheme(currentThemeId);
  const scrollRef = useRef<ScrollView>(null);
  const hasRestoredScroll = useRef<boolean>(false);
  const lastSavedScrollY = useRef<number>(0);
  const contentHeight = useRef<number>(0);
  const viewHeight = useRef<number>(0);
  const narrationRunId = useRef<number>(0);
  const speechRateRef = useRef<number>(settings.speechRate);
  const speechVoiceIdRef = useRef<string | null>(settings.speechVoiceId ?? null);
  const speechPitchRef = useRef<number>(settings.speechPitch);
  const knownVoiceIdsRef = useRef<Set<string>>(new Set());

  const [shareVisible, setShareVisible] = useState<boolean>(false);
  const [settingsVisible, setSettingsVisible] = useState<boolean>(false);
  const [narrationSheetVisible, setNarrationSheetVisible] = useState<boolean>(false);
  const [currentSectionIdx, setCurrentSectionIdx] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPreparingNarration, setIsPreparingNarration] = useState<boolean>(false);
  const [narrationError, setNarrationError] = useState<string | null>(null);
  const [displayVoices, setDisplayVoices] = useState<DisplayVoice[]>([]);
  const [voicesLoaded, setVoicesLoaded] = useState<boolean>(false);
  const [startMode, setStartMode] = useState<'beginning' | 'current' | 'custom'>('current');
  const [customStartSectionIdx, setCustomStartSectionIdx] = useState<number | null>(null);
  const [isSelectingStartPoint, setIsSelectingStartPoint] = useState<boolean>(false);

  const result = useMemo(
    () => getChapterById(seriesId ?? '', chapterId ?? ''),
    [seriesId, chapterId]
  );

  const displayMarkdown = useMemo(() => {
    if (!result) return '';
    return prepareMarkdownForDisplay(result.chapter.text, result.chapter.title);
  }, [result]);

  const sections = useMemo(() => {
    if (!displayMarkdown) return [];
    return extractSections(displayMarkdown);
  }, [displayMarkdown]);

  const ttsText = useMemo(() => {
    if (!result) return '';
    return markdownToNarrationText(result.chapter.text, result.chapter.title);
  }, [result]);

  const sectionIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    sections.forEach((section, index) => {
      const key = normalizeHeadingKey(section.heading);
      if (!map.has(key)) {
        map.set(key, index);
      }
    });
    return map;
  }, [sections]);

  const buildNarrationFromSection = useCallback(
    (index: number | null) => {
      if (!sections.length || index === null || index < 0 || index >= sections.length) {
        return ttsText;
      }
      const slice = sections.slice(index);
      return slice
        .map((section) => `${section.heading}. ${section.text}`.trim())
        .join('\n');
    },
    [sections, ttsText]
  );

  const resolveNarrationText = useCallback(() => {
    if (startMode === 'custom' && customStartSectionIdx !== null) {
      return buildNarrationFromSection(customStartSectionIdx);
    }
    if (startMode === 'current' && sections.length > 0) {
      return buildNarrationFromSection(currentSectionIdx);
    }
    return ttsText;
  }, [
    buildNarrationFromSection,
    currentSectionIdx,
    customStartSectionIdx,
    sections.length,
    startMode,
    ttsText,
  ]);

  useEffect(() => {
    speechRateRef.current = settings.speechRate;
  }, [settings.speechRate]);

  useEffect(() => {
    speechPitchRef.current = settings.speechPitch;
  }, [settings.speechPitch]);

  useEffect(() => {
    speechVoiceIdRef.current = settings.speechVoiceId ?? null;
  }, [settings.speechVoiceId]);

  const loadSystemVoices = useCallback(() => {
    if (Platform.OS === 'web') {
      setVoicesLoaded(true);
      return;
    }

    Speech.getAvailableVoicesAsync()
      .then((voices) => {
        const normalized = normalizeSystemVoices(voices as Record<string, unknown>[]);
        const newIds = new Set<string>();
        for (const voice of normalized) {
          if (!knownVoiceIdsRef.current.has(voice.id)) {
            newIds.add(voice.id);
          }
        }
        knownVoiceIdsRef.current = new Set(normalized.map((voice) => voice.id));
        const preferred = pickPreferredVoices(normalized, newIds);
        setDisplayVoices(labelSystemVoices(preferred));
        setVoicesLoaded(true);
      })
      .catch(() => {
        setDisplayVoices([]);
        setVoicesLoaded(true);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (cancelled) return;
    loadSystemVoices();
    return () => {
      cancelled = true;
    };
  }, [loadSystemVoices]);

  useEffect(() => {
    if (!narrationSheetVisible) return;
    loadSystemVoices();
  }, [loadSystemVoices, narrationSheetVisible]);

  useEffect(() => {
    const handler = (state: AppStateStatus) => {
      if (state === 'active') {
        loadSystemVoices();
      }
    };
    const subscription = AppState.addEventListener('change', handler);
    return () => {
      subscription.remove();
    };
  }, [loadSystemVoices]);

  useEffect(() => {
    if (!voicesLoaded || displayVoices.length === 0) return;
    const exists = displayVoices.some((voice) => voice.id === settings.speechVoiceId);
    if (!exists) {
      setSpeechVoiceId(displayVoices[0].id);
    }
  }, [displayVoices, setSpeechVoiceId, settings.speechVoiceId, voicesLoaded]);

  const narrationSupported = useMemo(
    () => Platform.OS !== 'web' && displayVoices.length > 0,
    [displayVoices.length]
  );

  const customStartLabel = useMemo(() => {
    if (customStartSectionIdx === null) return null;
    return sections[customStartSectionIdx]?.heading ?? null;
  }, [customStartSectionIdx, sections]);

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
    [updateScrollPosition, updateHistoryScroll, seriesId, chapterId, sections.length]
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
    return () => {
      narrationRunId.current += 1;
      Speech.stop();
    };
  }, []);

  const stopNarration = useCallback(() => {
    narrationRunId.current += 1;
    setIsPreparingNarration(false);
    setIsSpeaking(false);
    Speech.stop();
  }, []);

  useEffect(() => {
    void stopNarration();
    setNarrationError(null);
  }, [chapterId, seriesId, stopNarration]);

  const startNarrationWithText = useCallback(
    (baseText: string) => {
      if (!baseText.trim()) {
        return;
      }

      if (Platform.OS === 'web') {
        setNarrationError('Voice playback is not available on the web build.');
        return;
      }

      if (!voicesLoaded || displayVoices.length === 0) {
        setNarrationError(
          'No system voices were found. Download a voice in your device TTS settings.'
        );
        return;
      }

      const runId = narrationRunId.current + 1;
      narrationRunId.current = runId;
      setNarrationError(null);
      setIsPreparingNarration(true);

      const chunks = splitNarrationText(baseText);
      const voiceId = speechVoiceIdRef.current ?? displayVoices[0]?.id ?? undefined;

      Speech.stop();

      const speakNext = (index: number) => {
        if (narrationRunId.current !== runId) return;
        if (index >= chunks.length) {
          setIsSpeaking(false);
          setIsPreparingNarration(false);
          return;
        }

        const text = chunks[index];
        if (!text) {
          speakNext(index + 1);
          return;
        }

        if (index === 0) {
          setIsPreparingNarration(false);
          setIsSpeaking(true);
        }

        Speech.speak(text, {
          voice: voiceId,
          rate: speechRateRef.current,
          pitch: speechPitchRef.current,
          onDone: () => speakNext(index + 1),
          onStopped: () => {
            if (narrationRunId.current === runId) {
              setIsSpeaking(false);
            }
          },
          onError: () => {
            if (narrationRunId.current !== runId) return;
            setIsSpeaking(false);
            setIsPreparingNarration(false);
            setNarrationError('Narration could not be started.');
          },
        });
      };

      speakNext(0);
    },
    [displayVoices, voicesLoaded]
  );

  const handleToggleNarration = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!ttsText) {
      return;
    }

    if (isSpeaking || isPreparingNarration) {
      stopNarration();
      return;
    }

    if (isSelectingStartPoint) {
      setIsSelectingStartPoint(false);
    }

    startNarrationWithText(resolveNarrationText());
  }, [
    isPreparingNarration,
    isSelectingStartPoint,
    isSpeaking,
    resolveNarrationText,
    startNarrationWithText,
    stopNarration,
    ttsText,
  ]);

  const handlePickStartPoint = useCallback(() => {
    setStartMode('custom');
    setIsSelectingStartPoint(true);
    setNarrationSheetVisible(false);
  }, []);

  const handleCancelStartPoint = useCallback(() => {
    setIsSelectingStartPoint(false);
  }, []);

  const handleHeadingPress = useCallback(
    (heading: string) => {
      if (!isSelectingStartPoint) return;
      const key = normalizeHeadingKey(heading);
      const idx = sectionIndexMap.get(key);
      if (idx === undefined) {
        setIsSelectingStartPoint(false);
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCustomStartSectionIdx(idx);
      setStartMode('custom');
      setIsSelectingStartPoint(false);
      stopNarration();
      startNarrationWithText(buildNarrationFromSection(idx));
    },
    [
      buildNarrationFromSection,
      isSelectingStartPoint,
      sectionIndexMap,
      startNarrationWithText,
      stopNarration,
    ]
  );

  const handleStartModeChange = useCallback(
    (mode: 'beginning' | 'current' | 'custom') => {
      setStartMode(mode);
      if (mode !== 'custom') {
        setIsSelectingStartPoint(false);
      }
    },
    []
  );

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
  const plainExcerpt = displayMarkdown
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
              setNarrationSheetVisible(true);
            }}
            style={({ pressed }) => [
              styles.toolbarBtn,
              { backgroundColor: colors.tagBg },
              pressed && styles.toolbarBtnPressed,
            ]}
            hitSlop={8}
          >
            <Volume2 size={17} color={isSpeaking ? colors.accent : textColor} />
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

      {isSelectingStartPoint ? (
        <View
          style={[
            styles.startPointBanner,
            { backgroundColor: colors.accentMuted, borderBottomColor: borderColor },
          ]}
        >
          <Text style={[styles.startPointText, { color: colors.textSecondary }]}>
            Tap a heading to start reading from there.
          </Text>
          <Pressable
            onPress={handleCancelStartPoint}
            style={({ pressed }) => [
              styles.startPointBtn,
              { backgroundColor: colors.tagBg },
              pressed && styles.toolbarBtnPressed,
            ]}
          >
            <Text style={[styles.startPointBtnText, { color: colors.accent }]}>Cancel</Text>
          </Pressable>
        </View>
      ) : null}

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
            chapterTitle={chapter.title}
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
            onHeadingPress={handleHeadingPress}
            selectableHeadings={isSelectingStartPoint}
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
      />

      <NarrationControlSheet
        visible={narrationSheetVisible}
        onClose={() => setNarrationSheetVisible(false)}
        themeColors={colors}
        isSpeaking={isSpeaking}
        onTogglePlayback={handleToggleNarration}
        isPreparing={isPreparingNarration}
        narrationSupported={narrationSupported}
        narrationError={narrationError}
        voices={displayVoices.map((voice) => ({
          id: voice.id,
          label: voice.label,
          language: voice.language,
          quality: voice.quality,
        }))}
        voicesLoaded={voicesLoaded}
        startMode={startMode}
        onStartModeChange={handleStartModeChange}
        onPickStartPoint={handlePickStartPoint}
        customStartLabel={customStartLabel}
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
  startPointBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  startPointText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  startPointBtn: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  startPointBtnText: {
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  readerCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
  },
  nextChapter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
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
