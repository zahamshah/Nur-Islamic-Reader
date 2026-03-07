import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback } from 'react';
import { ReadingProgress } from '@/types/content';

const STORAGE_KEY = 'reading_progress';

export const [ReadingProgressProvider, useReadingProgress] = createContextHook(() => {
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setProgress(JSON.parse(raw) as ReadingProgress);
        } catch {
          console.log('[ReadingProgress] Failed to parse');
        }
      }
      setLoaded(true);
    });
  }, []);

  const markProgress = useCallback(
    (seriesId: string, chapterId: string, seriesTitle: string, chapterTitle: string) => {
      setProgress((prev) => {
        const next: ReadingProgress = {
          seriesId,
          chapterId,
          timestamp: Date.now(),
          seriesTitle,
          chapterTitle,
          scrollY: prev?.seriesId === seriesId && prev?.chapterId === chapterId ? prev.scrollY : 0,
          scrollPercentage: prev?.seriesId === seriesId && prev?.chapterId === chapterId ? prev.scrollPercentage : 0,
        };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const updateScrollPosition = useCallback(
    (scrollY: number, scrollPercentage: number) => {
      setProgress((prev) => {
        if (!prev) return prev;
        const next: ReadingProgress = { ...prev, scrollY, scrollPercentage };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const clearProgress = useCallback(() => {
    setProgress(null);
    AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return { progress, loaded, markProgress, clearProgress, updateScrollPosition };
});
