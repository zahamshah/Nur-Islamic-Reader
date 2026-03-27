export interface Chapter {
  id: string;
  title: string;
  subtitle?: string;
  tags: string[];
  readingTime: number;
  text: string;
}

export interface Series {
  id: string;
  title: string;
  description: string;
  coverImage: number;
  tags: string[];
  chapters: Chapter[];
}

export type ReaderTheme = 'light' | 'dark' | 'sepia';

export interface ReaderSettings {
  fontSize: number;
  lineHeight: number;
  theme: ReaderTheme;
  speechRate: number;
  speechPitch: number;
  speechVoiceId: string | null;
}

export interface ReadingProgress {
  seriesId: string;
  chapterId: string;
  timestamp: number;
  seriesTitle: string;
  chapterTitle: string;
  scrollY: number;
  scrollPercentage: number;
}

export type AppTheme =
  | 'light'
  | 'dark'
  | 'oasis'
  | 'midnight-gold'
  | 'midnight-onyx'
  | 'crisp-alabaster'
  | 'desert-rose'
  | 'ocean-depth';

export interface ThemeConfig {
  id: AppTheme;
  name: string;
  description: string;
  isPremium: boolean;
  price?: string;
  colors: {
    background: string;
    surface: string;
    cardBorder: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    tagBg: string;
    tagText: string;
    divider: string;
    accent: string;
    accentLight: string;
    accentMuted: string;
    primary: string;
    primaryLight: string;
  };
}
