import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, ChevronRight } from 'lucide-react-native';
import { useAppSettings } from '@/context/AppSettingsContext';
import { Chapter } from '@/types/content';

interface Props {
  chapter: Chapter;
  seriesId: string;
  index: number;
}

export default React.memo(function ChapterCard({ chapter, seriesId, index }: Props) {
  const router = useRouter();
  const { theme } = useAppSettings();
  const colors = theme.colors;

  const handlePress = useCallback(() => {
    router.push({ pathname: '/read/[seriesId]/[chapterId]' as any, params: { seriesId, chapterId: chapter.id } });
  }, [router, seriesId, chapter.id]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
        pressed && { backgroundColor: colors.tagBg },
      ]}
      testID={`chapter-card-${chapter.id}`}
    >
      <View style={[styles.indexBadge, { backgroundColor: colors.accentMuted }]}>
        <Text style={[styles.indexText, { color: colors.accent }]}>{index + 1}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {chapter.title}
        </Text>
        {chapter.subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {chapter.subtitle}
          </Text>
        ) : null}
        <View style={styles.meta}>
          <View style={styles.readingTime}>
            <Clock size={12} color={colors.textMuted} />
            <Text style={[styles.metaText, { color: colors.textMuted }]}>{chapter.readingTime} min</Text>
          </View>
          {chapter.tags.slice(0, 2).map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: colors.accentMuted }]}>
              <Text style={[styles.tagText, { color: colors.accent }]}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
      <ChevronRight size={18} color={colors.textMuted} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderWidth: 1,
  },
  indexBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  subtitle: {
    fontSize: 13,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  readingTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.4,
  },
});
