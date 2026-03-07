import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen } from 'lucide-react-native';
import { useAppSettings } from '@/context/AppSettingsContext';
import { Series } from '@/types/content';

interface Props {
  series: Series;
}

export default React.memo(function SeriesCard({ series }: Props) {
  const router = useRouter();
  const { theme } = useAppSettings();
  const colors = theme.colors;

  const handlePress = useCallback(() => {
    router.push({ pathname: '/series/[seriesId]' as any, params: { seriesId: series.id } });
  }, [router, series.id]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
        pressed && styles.cardPressed,
      ]}
      testID={`series-card-${series.id}`}
    >
      <Image
        source={series.coverImage}
        style={[styles.cover, { backgroundColor: colors.tagBg }]}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {series.title}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
          {series.description}
        </Text>
        <View style={styles.footer}>
          <View style={styles.tags}>
            {series.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: colors.tagBg }]}>
                <Text style={[styles.tagText, { color: colors.tagText }]}>{tag}</Text>
              </View>
            ))}
          </View>
          <View style={styles.chapterCount}>
            <BookOpen size={13} color={colors.textMuted} />
            <Text style={[styles.chapterCountText, { color: colors.textMuted }]}>
              {series.chapters.length} {series.chapters.length === 1 ? 'chapter' : 'chapters'}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  cover: {
    width: '100%',
    height: 180,
  },
  content: {
    padding: 18,
    gap: 8,
  },
  title: {
    fontSize: 19,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  tags: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  chapterCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chapterCountText: {
    fontSize: 12,
  },
});
