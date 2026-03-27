import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { X, Search, BookOpen } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LIBRARY } from '@/constants/content';
import { ThemeConfig } from '@/types/content';

interface SearchResult {
  seriesId: string;
  seriesTitle: string;
  chapterId: string;
  chapterTitle: string;
  snippet: string;
  matchType: 'title' | 'tag' | 'content';
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\[\[([^\]|]+)\|[^\]]+\]\]/g, '$1')
    .replace(/[#*>\-_`]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}

function findSnippet(text: string, query: string): string {
  const plain = stripMarkdown(text);
  const lower = plain.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return '';
  const start = Math.max(0, idx - 40);
  const end = Math.min(plain.length, idx + query.length + 80);
  let snippet = plain.slice(start, end).trim();
  if (start > 0) snippet = '…' + snippet;
  if (end < plain.length) snippet = snippet + '…';
  return snippet;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  themeColors: ThemeConfig['colors'];
  isDark: boolean;
}

export default React.memo(function SearchModal({ visible, onClose, themeColors, isDark }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState<string>('');

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const found: SearchResult[] = [];
    const MAX = 20;

    for (const series of LIBRARY) {
      for (const chapter of series.chapters) {
        if (found.length >= MAX) break;

        if (chapter.title.toLowerCase().includes(q)) {
          found.push({
            seriesId: series.id,
            seriesTitle: series.title,
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            snippet: chapter.title,
            matchType: 'title',
          });
          continue;
        }

        const tagMatch = chapter.tags.find((t) => t.toLowerCase().includes(q));
        if (tagMatch) {
          found.push({
            seriesId: series.id,
            seriesTitle: series.title,
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            snippet: `Tag: ${tagMatch}`,
            matchType: 'tag',
          });
          continue;
        }

        const snippet = findSnippet(chapter.text, q);
        if (snippet) {
          found.push({
            seriesId: series.id,
            seriesTitle: series.title,
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            snippet,
            matchType: 'content',
          });
        }
      }
    }
    return found;
  }, [query]);

  const handlePress = useCallback((result: SearchResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    onClose();
    setQuery('');
    setTimeout(() => {
      router.push({
        pathname: '/read/[seriesId]/[chapterId]' as any,
        params: { seriesId: result.seriesId, chapterId: result.chapterId },
      });
    }, 150);
  }, [router, onClose]);

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    setQuery('');
    onClose();
  }, [onClose]);

  const highlightMatch = useCallback((text: string, q: string) => {
    if (q.length < 2) return <Text>{text}</Text>;
    const lower = text.toLowerCase();
    const qLower = q.toLowerCase();
    const idx = lower.indexOf(qLower);
    if (idx === -1) return <Text>{text}</Text>;
    return (
      <Text>
        {text.slice(0, idx)}
        <Text style={{ fontWeight: '700' as const, color: themeColors.accent }}>
          {text.slice(idx, idx + q.length)}
        </Text>
        {text.slice(idx + q.length)}
      </Text>
    );
  }, [themeColors.accent]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 8,
              borderBottomColor: themeColors.divider,
            },
          ]}
        >
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.cardBorder,
              },
            ]}
          >
            <Search size={16} color={themeColors.textMuted} />
            <TextInput
              style={[styles.input, { color: themeColors.text }]}
              placeholder="Search chapters, concepts, topics…"
              placeholderTextColor={themeColors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <X size={16} color={themeColors.textMuted} />
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={handleClose}
            hitSlop={8}
            style={({ pressed }) => [pressed && { opacity: 0.6 }]}
          >
            <Text style={[styles.cancelText, { color: themeColors.accent }]}>
              Cancel
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.results}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20, paddingTop: 14 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {query.trim().length < 2 ? (
            <View style={styles.emptyState}>
              <Search size={32} color={themeColors.textMuted} />
              <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
                Search across all chapters
              </Text>
              <Text style={[styles.emptySubtext, { color: themeColors.textMuted }]}>
                Find topics, people, events, and concepts
              </Text>
            </View>
          ) : results.length === 0 ? (
            <View style={styles.emptyState}>
              <BookOpen size={32} color={themeColors.textMuted} />
              <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
                No results found
              </Text>
              <Text style={[styles.emptySubtext, { color: themeColors.textMuted }]}>
                Try a different term or keyword
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.resultCount, { color: themeColors.textMuted }]}>
                {results.length} result{results.length !== 1 ? 's' : ''}
              </Text>
              {results.map((r, idx) => (
                <Pressable
                  key={`${r.seriesId}-${r.chapterId}-${idx}`}
                  onPress={() => handlePress(r)}
                  style={({ pressed }) => [
                    styles.resultItem,
                    {
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.cardBorder,
                    },
                    pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <View style={styles.resultContent}>
                    <Text
                      style={[styles.resultTitle, { color: themeColors.text }]}
                      numberOfLines={1}
                    >
                      {highlightMatch(r.chapterTitle, query.trim())}
                    </Text>
                    <Text
                      style={[styles.resultSeries, { color: themeColors.textMuted }]}
                      numberOfLines={1}
                    >
                      {r.seriesTitle}
                    </Text>
                    {r.matchType === 'content' && (
                      <Text
                        style={[styles.resultSnippet, { color: themeColors.textSecondary }]}
                        numberOfLines={2}
                      >
                        {highlightMatch(r.snippet, query.trim())}
                      </Text>
                    )}
                    {r.matchType === 'tag' && (
                      <View style={styles.tagRow}>
                        <View
                          style={[
                            styles.matchTag,
                            { backgroundColor: themeColors.accentMuted },
                          ]}
                        >
                          <Text style={[styles.matchTagText, { color: themeColors.accent }]}>
                            {r.snippet}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </Pressable>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500' as const,
    padding: 0,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  results: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
  resultCount: {
    fontSize: 12,
    fontWeight: '600' as const,
    marginBottom: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  resultItem: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  resultContent: {
    gap: 3,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  resultSeries: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  resultSnippet: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  tagRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  matchTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  matchTagText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
});
