import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ReadingProgress } from '@/types/content';
import { useAppSettings } from '@/context/AppSettingsContext';
import { isDarkTheme } from '@/constants/themes';

interface Props {
  progress: ReadingProgress;
}

export default React.memo(function ContinueReadingCard({ progress }: Props) {
  const router = useRouter();
  const { currentThemeId, theme } = useAppSettings();
  const dark = isDarkTheme(currentThemeId);

  const handlePress = useCallback(() => {
    router.push({ pathname: '/read/[seriesId]/[chapterId]' as any, params: { seriesId: progress.seriesId, chapterId: progress.chapterId } });
  }, [router, progress.seriesId, progress.chapterId]);

  const percentage = progress.scrollPercentage ?? 0;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [pressed && styles.pressed]}
      testID="continue-reading-card"
    >
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.iconContainer}>
          <BookOpen size={20} color="rgba(255,255,255,0.9)" />
        </View>
        <View style={styles.content}>
          <Text style={styles.label}>Continue Reading</Text>
          <Text style={styles.title} numberOfLines={1}>
            {progress.chapterTitle}
          </Text>
          <Text style={styles.series} numberOfLines={1}>
            {progress.seriesTitle}
          </Text>
          {percentage > 0 ? (
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${percentage}%` }]} />
              </View>
              <Text style={styles.progressText}>{percentage}%</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.arrow}>
          <ArrowRight size={18} color="rgba(255,255,255,0.8)" />
        </View>
      </LinearGradient>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 14,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  series: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.65)',
    minWidth: 30,
    textAlign: 'right' as const,
  },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
