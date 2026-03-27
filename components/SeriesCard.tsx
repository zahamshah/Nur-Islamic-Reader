import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, ChevronRight } from 'lucide-react-native';
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
      <View style={styles.coverWrap}>
        <Image
          source={series.coverImage}
          style={[styles.cover, { backgroundColor: colors.tagBg }]}
          resizeMode="cover"
        />
        <View
          style={[
            styles.coverOverlay,
            {
              backgroundColor: 'rgba(0,0,0,0.16)',
            },
          ]}
        />
        <View style={styles.coverTopRow}>
          <View style={[styles.coverPill, { backgroundColor: 'rgba(255,255,255,0.16)' }]}>
            <Text style={styles.coverPillText}>Series</Text>
          </View>
          <View style={[styles.coverPill, styles.coverCountPill]}>
            <BookOpen size={12} color="#FFFFFF" />
            <Text style={styles.coverPillText}>
              {series.chapters.length} {series.chapters.length === 1 ? 'Chapter' : 'Chapters'}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {series.title}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={3}>
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
          <View style={styles.ctaWrap}>
            <Text style={[styles.ctaText, { color: colors.accent }]}>
              Open
            </Text>
            <ChevronRight size={16} color={colors.accent} />
          </View>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 5,
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.988 }],
  },
  coverWrap: {
    position: 'relative',
  },
  cover: {
    width: '100%',
    height: 196,
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  coverTopRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  coverPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coverCountPill: {
    backgroundColor: 'rgba(12,12,12,0.34)',
  },
  coverPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.45,
    textTransform: 'uppercase' as const,
  },
  content: {
    padding: 20,
    gap: 10,
  },
  title: {
    fontSize: 21,
    fontWeight: '800' as const,
    letterSpacing: -0.45,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
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
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.55,
  },
  ctaWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.4,
    textTransform: 'uppercase' as const,
  },
});
