import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'reading_history';
const MAX_HISTORY = 3;

export interface HistoryEntry {
  seriesId: string;
  chapterId: string;
  seriesTitle: string;
  chapterTitle: string;
  scrollY: number;
  scrollPercentage: number;
  timestamp: number;
}

export const [ReadingHistoryProvider, useReadingHistory] = createContextHook(() => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);

  const mergeHistory = useCallback((current: HistoryEntry[], stored: HistoryEntry[]) => {
    const map = new Map<string, HistoryEntry>();
    for (const entry of [...stored, ...current]) {
      const key = `${entry.seriesId}:${entry.chapterId}`;
      const existing = map.get(key);
      if (!existing || entry.timestamp > existing.timestamp) {
        map.set(key, entry);
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_HISTORY);
  }, []);

  const refreshHistory = useCallback(async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as HistoryEntry[];
      if (!Array.isArray(parsed)) return;
      setHistory((prev) => mergeHistory(prev, parsed));
    } catch {
      console.log('[ReadingHistory] Failed to parse');
    }
  }, [mergeHistory]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as HistoryEntry[];
          if (Array.isArray(parsed)) {
            setHistory((prev) => mergeHistory(prev, parsed));
          }
        } catch {
          console.log('[ReadingHistory] Failed to parse');
        }
      }
      setLoaded(true);
    });
  }, [mergeHistory]);

  const addToHistory = useCallback(
    (entry: Omit<HistoryEntry, 'timestamp'>) => {
      setHistory((prev) => {
        const filtered = prev.filter(
          (h) => !(h.seriesId === entry.seriesId && h.chapterId === entry.chapterId)
        );
        const next: HistoryEntry[] = [
          { ...entry, timestamp: Date.now() },
          ...filtered,
        ].slice(0, MAX_HISTORY);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const updateHistoryScroll = useCallback(
    (seriesId: string, chapterId: string, scrollY: number, scrollPercentage: number) => {
      setHistory((prev) => {
        const idx = prev.findIndex(
          (h) => h.seriesId === seriesId && h.chapterId === chapterId
        );
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], scrollY, scrollPercentage };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return { history, loaded, addToHistory, updateHistoryScroll, clearHistory, refreshHistory };
});
