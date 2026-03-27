import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { AppTheme, ThemeConfig } from '@/types/content';
import { APP_THEMES, getThemeById } from '@/constants/themes';

const THEME_KEY = 'app_theme';
const PURCHASED_KEY = 'purchased_themes';

export const [AppSettingsProvider, useAppSettings] = createContextHook(() => {
  const [currentThemeId, setCurrentThemeId] = useState<AppTheme>('light');
  const [purchasedThemes, setPurchasedThemes] = useState<AppTheme[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(THEME_KEY),
      AsyncStorage.getItem(PURCHASED_KEY),
    ]).then(([themeRaw, purchasedRaw]) => {
      if (themeRaw) {
        try {
          setCurrentThemeId(themeRaw as AppTheme);
        } catch {
          console.log('[AppSettings] Failed to parse theme');
        }
      }
      if (purchasedRaw) {
        try {
          setPurchasedThemes(JSON.parse(purchasedRaw) as AppTheme[]);
        } catch {
          console.log('[AppSettings] Failed to parse purchased themes');
        }
      }
      setLoaded(true);
    });
  }, []);

  const theme: ThemeConfig = useMemo(() => getThemeById(currentThemeId), [currentThemeId]);

  const setTheme = useCallback((id: AppTheme) => {
    setCurrentThemeId(id);
    AsyncStorage.setItem(THEME_KEY, id);
  }, []);

  const purchaseTheme = useCallback((id: AppTheme) => {
    setPurchasedThemes((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      AsyncStorage.setItem(PURCHASED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const purchaseAllThemes = useCallback(() => {
    const premiumIds = APP_THEMES.filter((theme) => theme.isPremium).map((theme) => theme.id);
    setPurchasedThemes((prev) => {
      const next = Array.from(new Set([...prev, ...premiumIds]));
      AsyncStorage.setItem(PURCHASED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isThemePurchased = useCallback(
    (id: AppTheme) => purchasedThemes.includes(id),
    [purchasedThemes]
  );

  return {
    currentThemeId,
    theme,
    loaded,
    setTheme,
    purchaseTheme,
    purchaseAllThemes,
    isThemePurchased,
    purchasedThemes,
  };
});
