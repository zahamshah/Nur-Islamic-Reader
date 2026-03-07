import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ArrowLeft, Clock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { getSeriesById } from '@/constants/content';
import { useAppSettings } from '@/context/AppSettingsContext';
import { isDarkTheme } from '@/constants/themes';
import ChapterCard from '@/components/ChapterCard';

export default function SeriesDetailScreen() {
  const { seriesId } = useLocalSearchParams<{ seriesId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentThemeId, theme } = useAppSettings();

  const colors = theme.colors;
  const dark = isDarkTheme(currentThemeId);

  const series = useMemo(() => getSeriesById(seriesId ?? ''), [seriesId]);

  const totalTime = useMemo(
    () => series?.chapters.reduce((sum, ch) => sum + ch.readingTime, 0) ?? 0,
    [series]
  );

  if (!series) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Series not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={[styles.backLinkText, { color: colors.primary }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroContainer}>
          <Image
            source={series.coverImage}
            style={[styles.heroImage, { backgroundColor: colors.tagBg }]}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.heroGradient}
          />
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { top: insets.top + 8 }]}
            hitSlop={12}
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>{series.title}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {series.description}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={14} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                {totalTime} min total
              </Text>
            </View>
            <Text style={[styles.metaDot, { color: colors.textMuted }]}>·</Text>
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              {series.chapters.length} {series.chapters.length === 1 ? 'chapter' : 'chapters'}
            </Text>
          </View>

          <View style={styles.tags}>
            {series.tags.map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: colors.accentMuted }]}>
                <Text style={[styles.tagText, { color: colors.accent }]}>{tag}</Text>
              </View>
            ))}
          </View>

          <View style={styles.chaptersSection}>
            <Text style={[styles.chaptersTitle, { color: colors.text }]}>Chapters</Text>
            <View style={styles.chaptersList}>
              {series.chapters.map((chapter, index) => (
                <ChapterCard
                  key={chapter.id}
                  chapter={chapter}
                  seriesId={series.id}
                  index={index}
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
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
  scroll: {
    flex: 1,
  },
  heroContainer: {
    height: 280,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 13,
  },
  metaDot: {
    fontSize: 13,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 28,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  chaptersSection: {
    gap: 14,
  },
  chaptersTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  chaptersList: {
    gap: 10,
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