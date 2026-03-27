import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback } from 'react';
import { ReaderSettings, ReaderTheme } from '@/types/content';

const STORAGE_KEY = 'reader_settings';

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 17,
  lineHeight: 1.8,
  theme: 'light' as const,
  speechRate: 1,
  speechPitch: 1,
  speechVoiceId: null,
};

export const [ReaderSettingsProvider, useReaderSettings] = createContextHook(() => {
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as ReaderSettings;
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        } catch {
          console.log('[ReaderSettings] Failed to parse stored settings');
        }
      }
      setLoaded(true);
    });
  }, []);

  const updateSettings = useCallback((partial: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setFontSize = useCallback((fontSize: number) => {
    updateSettings({ fontSize });
  }, [updateSettings]);

  const setLineHeight = useCallback((lineHeight: number) => {
    updateSettings({ lineHeight });
  }, [updateSettings]);

  const setTheme = useCallback((theme: ReaderTheme) => {
    updateSettings({ theme });
  }, [updateSettings]);

  const setSpeechRate = useCallback((speechRate: number) => {
    updateSettings({ speechRate });
  }, [updateSettings]);

  const setSpeechPitch = useCallback((speechPitch: number) => {
    updateSettings({ speechPitch });
  }, [updateSettings]);

  const setSpeechVoiceId = useCallback((speechVoiceId: string | null) => {
    updateSettings({ speechVoiceId });
  }, [updateSettings]);

  return {
    settings,
    loaded,
    setFontSize,
    setLineHeight,
    setTheme,
    setSpeechRate,
    setSpeechPitch,
    setSpeechVoiceId,
  };
});
