import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings, Heart, Clock, Search } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LIBRARY } from '@/constants/content';
import { useReadingProgress } from '@/context/ReadingProgressContext';
import { useAppSettings } from '@/context/AppSettingsContext';
import { isDarkTheme } from '@/constants/themes';
import SeriesCard from '@/components/SeriesCard';
import ContinueReadingCard from '@/components/ContinueReadingCard';
import HistoryModal from '@/components/HistoryModal';
import SearchModal from '@/components/SearchModal';

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { progress, loaded } = useReadingProgress();
  const { currentThemeId, theme } = useAppSettings();
  const [historyVisible, setHistoryVisible] = useState<boolean>(false);
  const [searchVisible, setSearchVisible] = useState<boolean>(false);

  const colors = theme.colors;
  const dark = isDarkTheme(currentThemeId);

  const handleSettings = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/settings' as any);
  }, [router]);

  const handleHistory = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHistoryVisible(true);
  }, []);

  const handleSearch = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchVisible(true);
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.appName, { color: colors.primary }]}>Nūr</Text>
            <Text style={[styles.appTagline, { color: colors.textMuted }]}>
              Premium Islamic Reader
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={handleSearch}
              style={({ pressed }) => [
                styles.headerBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.cardBorder,
                },
                pressed && styles.headerBtnPressed,
              ]}
              hitSlop={8}
              testID="search-btn"
            >
              <Search size={19} color={colors.textSecondary} />
            </Pressable>
            <Pressable
              onPress={handleHistory}
              style={({ pressed }) => [
                styles.headerBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.cardBorder,
                },
                pressed && styles.headerBtnPressed,
              ]}
              hitSlop={8}
              testID="history-btn"
            >
              <Clock size={19} color={colors.textSecondary} />
            </Pressable>
            <Pressable
              onPress={handleSettings}
              style={({ pressed }) => [
                styles.headerBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.cardBorder,
                },
                pressed && styles.headerBtnPressed,
              ]}
              hitSlop={8}
              testID="settings-btn"
            >
              <Settings size={19} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {loaded && progress ? (
          <View style={styles.section}>
            <ContinueReadingCard progress={progress} />
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Library</Text>
            <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
              {LIBRARY.length} series
            </Text>
          </View>
          <View style={styles.seriesList}>
            {LIBRARY.map((series) => (
              <SeriesCard key={series.id} series={series} />
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <View style={[styles.footerDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.footerContent}>
            <Heart size={14} color={colors.accent} />
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              Built with love for the seekers of knowledge
            </Text>
          </View>
        </View>
      </ScrollView>

      <HistoryModal
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
        themeColors={colors}
        isDark={dark}
      />

      <SearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        themeColors={colors}
        isDark={dark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingTop: 8,
  },
  headerLeft: {
    gap: 3,
    flex: 1,
    paddingRight: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerBtnPressed: {
    opacity: 0.7,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    letterSpacing: -0.35,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '700' as const,
    letterSpacing: 0.25,
    textTransform: 'uppercase' as const,
  },
  seriesList: {
    gap: 20,
  },
  footer: {
    marginTop: 16,
    alignItems: 'center',
    gap: 16,
  },
  footerDivider: {
    width: 40,
    height: 2,
    borderRadius: 1,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    fontStyle: 'italic' as const,
  },
});
