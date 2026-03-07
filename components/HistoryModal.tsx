import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { X, Clock, BookOpen, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HistoryEntry, useReadingHistory } from '@/context/ReadingHistoryContext';
import { ThemeConfig } from '@/types/content';

interface Props {
  visible: boolean;
  onClose: () => void;
  themeColors: ThemeConfig['colors'];
  isDark: boolean;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export default React.memo(function HistoryModal({ visible, onClose, themeColors, isDark }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { history, clearHistory } = useReadingHistory();

  const handlePress = useCallback((entry: HistoryEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    setTimeout(() => {
      router.push({
        pathname: '/read/[seriesId]/[chapterId]' as any,
        params: { seriesId: entry.seriesId, chapterId: entry.chapterId },
      });
    }, 150);
  }, [router, onClose]);

  const handleClear = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearHistory();
  }, [clearHistory]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: themeColors.background,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: themeColors.divider }]} />

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Clock size={18} color={themeColors.accent} />
              <Text style={[styles.headerTitle, { color: themeColors.text }]}>
                Recent
              </Text>
            </View>
            <View style={styles.headerRight}>
              {history.length > 0 && (
                <Pressable
                  onPress={handleClear}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.clearBtn,
                    { backgroundColor: themeColors.tagBg },
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <Trash2 size={14} color={themeColors.textMuted} />
                </Pressable>
              )}
              <Pressable
                onPress={onClose}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.closeBtn,
                  { backgroundColor: themeColors.tagBg },
                  pressed && { opacity: 0.6 },
                ]}
              >
                <X size={16} color={themeColors.textSecondary} />
              </Pressable>
            </View>
          </View>

          <ScrollView
            style={styles.list}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {history.length === 0 ? (
              <View style={styles.emptyState}>
                <BookOpen size={32} color={themeColors.textMuted} />
                <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
                  No reading history yet
                </Text>
                <Text style={[styles.emptySubtext, { color: themeColors.textMuted }]}>
                  Start reading to see your recent chapters here
                </Text>
              </View>
            ) : (
              history.map((entry, idx) => (
                <Pressable
                  key={`${entry.seriesId}-${entry.chapterId}`}
                  onPress={() => handlePress(entry)}
                  style={({ pressed }) => [
                    styles.historyItem,
                    {
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.cardBorder,
                    },
                    pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                    idx < history.length - 1 && { marginBottom: 10 },
                  ]}
                >
                  <View
                    style={[
                      styles.itemIndex,
                      { backgroundColor: themeColors.accentMuted },
                    ]}
                  >
                    <Text style={[styles.itemIndexText, { color: themeColors.accent }]}>
                      {idx + 1}
                    </Text>
                  </View>
                  <View style={styles.itemContent}>
                    <Text
                      style={[styles.itemTitle, { color: themeColors.text }]}
                      numberOfLines={1}
                    >
                      {entry.chapterTitle}
                    </Text>
                    <View style={styles.itemMeta}>
                      <Text
                        style={[styles.itemSeries, { color: themeColors.textMuted }]}
                        numberOfLines={1}
                      >
                        {entry.seriesTitle}
                      </Text>
                      <View style={[styles.dot, { backgroundColor: themeColors.divider }]} />
                      <Text style={[styles.itemTime, { color: themeColors.textMuted }]}>
                        {timeAgo(entry.timestamp)}
                      </Text>
                    </View>
                    {entry.scrollPercentage > 0 && (
                      <View style={styles.progressRow}>
                        <View
                          style={[
                            styles.progressTrack,
                            { backgroundColor: themeColors.tagBg },
                          ]}
                        >
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${entry.scrollPercentage}%`,
                                backgroundColor: themeColors.accent,
                              },
                            ]}
                          />
                        </View>
                        <Text style={[styles.progressText, { color: themeColors.textMuted }]}>
                          {entry.scrollPercentage}%
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 20,
    maxHeight: '55%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginTop: 4,
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center' as const,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  itemIndex: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIndexText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  itemContent: {
    flex: 1,
    gap: 3,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemSeries: {
    fontSize: 12,
    fontWeight: '500' as const,
    flexShrink: 1,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  itemTime: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600' as const,
    minWidth: 28,
    textAlign: 'right' as const,
  },
});
