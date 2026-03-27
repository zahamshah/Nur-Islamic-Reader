import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Palette,
  Heart,
  Shield,
  FileText,
  Lock,
  Check,
  Sparkles,
  HandHeart,
  Globe,
  Rocket,
} from 'lucide-react-native';
import { useAppSettings } from '@/context/AppSettingsContext';
import { APP_THEMES, isDarkTheme } from '@/constants/themes';
import { ThemeConfig } from '@/types/content';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    currentThemeId,
    theme,
    setTheme,
    purchaseTheme,
    purchaseAllThemes,
    isThemePurchased,
  } = useAppSettings();
  const [purchasingTheme, setPurchasingTheme] = useState<string | null>(null);
  const [purchasingAll, setPurchasingAll] = useState<boolean>(false);

  const colors = theme.colors;
  const dark = isDarkTheme(currentThemeId);

  const handleThemeSelect = useCallback(
    (t: ThemeConfig) => {
      if (t.isPremium && !isThemePurchased(t.id)) {
        Alert.alert(
          `Unlock ${t.name}`,
          `This theme costs ${t.price} - a small way to support this free app. All proceeds go toward keeping Nur ad-free and open.

Would you like to unlock it?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: `Unlock for ${t.price}`,
              onPress: () => {
                setPurchasingTheme(t.id);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setTimeout(() => {
                  purchaseTheme(t.id);
                  setTheme(t.id);
                  setPurchasingTheme(null);
                }, 800);
              },
            },
            {
              text: 'Unlock All $2.99',
              onPress: () => {
                setPurchasingAll(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setTimeout(() => {
                  purchaseAllThemes();
                  setTheme(t.id);
                  setPurchasingAll(false);
                }, 800);
              },
            },
          ]
        );
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTheme(t.id);
    },
    [isThemePurchased, purchaseAllThemes, purchaseTheme, setTheme]
  );

  const premiumThemeIds = useMemo(
    () => APP_THEMES.filter((t) => t.isPremium).map((t) => t.id),
    []
  );
  const allUnlocked = premiumThemeIds.every((id) => isThemePurchased(id));

  const orderedThemes = useMemo(() => {
    const lightThemes = APP_THEMES.filter((t) => !isDarkTheme(t.id));
    const darkThemes = APP_THEMES.filter((t) => isDarkTheme(t.id));
    const max = Math.max(lightThemes.length, darkThemes.length);
    const ordered: ThemeConfig[] = [];
    for (let i = 0; i < max; i += 1) {
      if (lightThemes[i]) ordered.push(lightThemes[i]);
      if (darkThemes[i]) ordered.push(darkThemes[i]);
    }
    return ordered;
  }, []);

  const handleUnlockAll = useCallback(() => {
    if (allUnlocked) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPurchasingAll(true);
    setTimeout(() => {
      purchaseAllThemes();
      setPurchasingAll(false);
    }, 800);
  }, [allUnlocked, purchaseAllThemes]);

  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const handleSupportTier = useCallback((tier: string, price: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedTier(tier);
    Alert.alert(
      'Thank You!',
      `Your ${price} contribution means the world to us.\n\n25% goes to orphans & the needy\n25% goes to Palestine relief\n50% supports future projects & running this app\n\nMay Allah reward you abundantly.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setSelectedTier(null) },
        {
          text: `Support ${price}`,
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimeout(() => setSelectedTier(null), 500);
          },
        },
      ]
    );
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top - 8, 8),
            borderBottomColor: colors.divider,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: dark ? 'rgba(255,255,255,0.08)' : colors.tagBg },
            pressed && styles.btnPressed,
          ]}
          hitSlop={8}
        >
          <ArrowLeft size={18} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Palette size={16} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>App Theme</Text>
          </View>
          <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
            Choose how Nūr looks across the entire app
          </Text>

          

          {!allUnlocked && (
            <Pressable
              onPress={handleUnlockAll}
              style={({ pressed }) => [
                styles.unlockAllCard,
                {
                  backgroundColor: dark ? 'rgba(255,255,255,0.04)' : colors.surface,
                  borderColor: colors.cardBorder,
                },
                pressed && styles.unlockAllPressed,
              ]}
            >
              <View style={[styles.unlockAllIcon, { backgroundColor: colors.accentMuted }]}>
                <Sparkles size={16} color={colors.accent} />
              </View>
              <View style={styles.unlockAllContent}>
                <Text style={[styles.unlockAllTitle, { color: colors.text }]}>
                  Unlock All Themes
                </Text>
                <Text style={[styles.unlockAllDesc, { color: colors.textSecondary }]}>
                  One-time access to every premium theme.
                </Text>
              </View>
              <View style={[styles.unlockAllPrice, { backgroundColor: colors.accentMuted }]}>
                <Text style={[styles.unlockAllPriceText, { color: colors.accent }]}>
                  {purchasingAll ? 'Unlocking...' : '$2.99'}
                </Text>
                <Text style={[styles.unlockAllPriceSub, { color: colors.textMuted }]}>
                  All themes
                </Text>
              </View>
            </Pressable>
          )}
<View style={styles.themeGrid}>
            {orderedThemes.map((t) => {
              const isActive = currentThemeId === t.id;
              const isPurchased = isThemePurchased(t.id);
              const isLocked = t.isPremium && !isPurchased;
              const isPurchasing = purchasingTheme === t.id;
              const darkThemeCard = isDarkTheme(t.id);

              return (
                <Pressable
                  key={t.id}
                  onPress={() => handleThemeSelect(t)}
                  style={({ pressed }) => [
                    styles.themeCard,
                    {
                      backgroundColor: t.colors.surface,
                      borderColor: isActive ? colors.accent : t.colors.cardBorder,
                      borderWidth: isActive ? 2 : 1,
                    },
                    pressed && styles.themeCardPressed,
                  ]}
                  testID={`theme-card-${t.id}`}
                >
                  <View style={styles.themeTopRow}>
                    <View
                      style={[
                        styles.themeTonePill,
                        {
                          backgroundColor: darkThemeCard
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(0,0,0,0.05)',
                        },
                      ]}
                    >
                      <Text style={[styles.themeToneText, { color: t.colors.textSecondary }]}>
                        {darkThemeCard ? 'Dark' : 'Light'}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.themePreviewPanel,
                      {
                        backgroundColor: t.colors.background,
                        borderColor: t.colors.cardBorder,
                      },
                    ]}
                  >
                    <View style={styles.themePreviewChrome}>
                      <View
                        style={[
                          styles.previewLine,
                          { width: '34%', backgroundColor: t.colors.cardBorder },
                        ]}
                      />
                      <View
                        style={[
                          styles.previewLine,
                          { width: '18%', backgroundColor: t.colors.cardBorder },
                        ]}
                      />
                    </View>

                    <View style={styles.themePreviewBody}>
                      <View
                        style={[
                          styles.previewMiniCard,
                          {
                            backgroundColor: t.colors.surface,
                            borderColor: t.colors.cardBorder,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.previewAccentBar,
                            { backgroundColor: t.colors.accent },
                          ]}
                        />
                        <View
                          style={[
                            styles.previewMiniTextRow,
                            { backgroundColor: darkThemeCard ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.10)' },
                          ]}
                        />
                        <View
                          style={[
                            styles.previewMiniTextRowShort,
                            { backgroundColor: darkThemeCard ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)' },
                          ]}
                        />
                      </View>

                      <View style={styles.themePreview}>
                        <View
                          style={[
                            styles.previewDot,
                            { backgroundColor: t.colors.primary },
                          ]}
                        />
                        <View
                          style={[
                            styles.previewDot,
                            { backgroundColor: t.colors.accent },
                          ]}
                        />
                        <View
                          style={[
                            styles.previewDot,
                            { backgroundColor: t.colors.background, borderWidth: 1, borderColor: t.colors.cardBorder },
                          ]}
                        />
                      </View>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.themeName,
                      { color: t.colors.text },
                    ]}
                    numberOfLines={1}
                  >
                    {t.name}
                  </Text>
                  <Text
                    style={[
                      styles.themeDesc,
                      { color: t.colors.textMuted },
                    ]}
                    numberOfLines={1}
                  >
                    {t.description}
                  </Text>

                  {isActive ? (
                    <View style={[styles.themeBadge, { backgroundColor: colors.accent }]}>
                      <Check size={10} color="#FFF" strokeWidth={3} />
                    </View>
                  ) : isLocked ? (
                    <View style={[styles.themeBadge, { backgroundColor: t.colors.tagBg }]}>
                      <Lock size={10} color={t.colors.tagText} />
                    </View>
                  ) : null}

                  {t.isPremium && !isPurchased ? (
                    <View style={[styles.priceTag, { backgroundColor: colors.accentMuted }]}>
                      <Sparkles size={9} color={colors.accent} />
                      <Text style={[styles.priceText, { color: colors.accent }]}>
                        {isPurchasing ? 'Unlocking...' : t.price}
                      </Text>
                    </View>
                  ) : null}

                  {t.isPremium && isPurchased ? (
                    <View style={[styles.priceTag, { backgroundColor: 'rgba(77,184,77,0.1)' }]}>
                      <Text style={[styles.priceText, { color: '#4DB84D' }]}>Owned</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Heart size={16} color="#E05A5A" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Support Nūr</Text>
          </View>
          <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
            Nūr is free, ad-free, and always will be. If it benefits you, consider supporting its development.
          </Text>

          <Text style={[styles.supportSubtitle, { color: colors.textSecondary }]}>
            Help us add more chapters, keep this app running, and support those in need.
          </Text>

          <View style={styles.tiersContainer}>
            {[
              { id: 'tier1', price: '0.99', label: 'Seed', icon: HandHeart, color: '#5BAE6E' },
              { id: 'tier2', price: '2.99', label: 'Growth', icon: Globe, color: '#3D8BDB' },
              { id: 'tier3', price: '4.99', label: 'Impact', icon: Rocket, color: '#D4AF5C' },
            ].map((tier) => {
              const TierIcon = tier.icon;
              const isSelected = selectedTier === tier.id;
              return (
                <Pressable
                  key={tier.id}
                  onPress={() => handleSupportTier(tier.id, tier.price)}
                  style={({ pressed }) => [
                    styles.tierCard,
                    {
                      backgroundColor: dark ? 'rgba(255,255,255,0.05)' : colors.surface,
                      borderColor: isSelected ? tier.color : colors.cardBorder,
                      borderWidth: isSelected ? 2 : 1,
                    },
                    pressed && styles.tierCardPressed,
                  ]}
                  testID={`support-tier-${tier.id}`}
                >
                  <View style={[styles.tierIconWrap, { backgroundColor: tier.color + '18' }]}> 
                    <TierIcon size={20} color={tier.color} />
                  </View>
                  <Text style={[styles.tierLabel, { color: colors.text }]}>{tier.label}</Text>
                  <Text style={[styles.tierPrice, { color: tier.color }]}>${tier.price}</Text>
                </Pressable>
              );
            })}
          </View>

          <View
            style={[
              styles.premiumNote,
              {
                backgroundColor: dark ? 'rgba(212,175,92,0.06)' : colors.accentMuted,
                borderColor: dark ? 'rgba(212,175,92,0.12)' : 'rgba(196,154,60,0.15)',
              },
            ]}
          >
            <Heart size={14} color="#E05A5A" />
            <Text style={[styles.premiumNoteText, { color: colors.textSecondary }]}>
              25% goes to orphans & the needy{"\n"}25% to Palestine relief{"\n"}50% to future projects & running this app
            </Text>
          </View>

          <View
            style={[
              styles.premiumNote,
              {
                backgroundColor: dark ? 'rgba(212,175,92,0.06)' : colors.accentMuted,
                borderColor: dark ? 'rgba(212,175,92,0.12)' : 'rgba(196,154,60,0.15)',
              },
            ]}
          >
            <Sparkles size={14} color={colors.accent} />
            <Text style={[styles.premiumNoteText, { color: colors.textSecondary }]}>
              Premium themes are $0.99 each, or unlock them all for $2.99. Every purchase keeps Nur alive and growing.
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={16} color={colors.textMuted} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          </View>

          <View style={styles.aboutList}>
            <View
              style={[
                styles.aboutItem,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <FileText size={16} color={colors.textSecondary} />
              <View style={styles.aboutItemContent}>
                <Text style={[styles.aboutItemTitle, { color: colors.text }]}>
                  Disclaimer
                </Text>
                <Text style={[styles.aboutItemDesc, { color: colors.textSecondary }]}>
                  The content in Nūr is compiled from authentic Islamic sources including the Quran and verified Hadith collections. While we strive for accuracy, this app is for educational purposes. Always consult qualified scholars for religious rulings and guidance.
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.aboutItem,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Shield size={16} color={colors.textSecondary} />
              <View style={styles.aboutItemContent}>
                <Text style={[styles.aboutItemTitle, { color: colors.text }]}>
                  Privacy
                </Text>
                <Text style={[styles.aboutItemDesc, { color: colors.textSecondary }]}>
                  Nūr does not collect any personal data. All reading progress and preferences are stored locally on your device. No analytics, no trackers, no ads — ever.
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.aboutItem,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Heart size={16} color={colors.textSecondary} />
              <View style={styles.aboutItemContent}>
                <Text style={[styles.aboutItemTitle, { color: colors.text }]}>
                  Credits
                </Text>
                <Text style={[styles.aboutItemDesc, { color: colors.textSecondary }]}>
                  Built with love for the Muslim ummah. May Allah accept this effort and make it a source of benefit. All praise belongs to Allah alone.
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.textMuted }]}>
            Nūr v1.0.0
          </Text>
          <Text style={[styles.versionSubtext, { color: colors.textMuted }]}>
            Premium Islamic Reader
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    opacity: 0.7,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  sectionDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  unlockAllCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  unlockAllPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  unlockAllIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockAllContent: {
    flex: 1,
    gap: 4,
  },
  unlockAllTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  unlockAllDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  unlockAllPrice: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: 'center',
  },
  unlockAllPriceText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  unlockAllPriceSub: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeCard: {
    width: '47%' as any,
    minHeight: 176,
    borderRadius: 18,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 4,
  },
  themeCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  themeTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  themeTonePill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  themeToneText: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.55,
  },
  themePreviewPanel: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
  },
  themePreviewChrome: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  previewLine: {
    height: 4,
    borderRadius: 999,
  },
  themePreviewBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  previewMiniCard: {
    flex: 1,
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  previewAccentBar: {
    width: '42%',
    height: 4,
    borderRadius: 999,
  },
  previewMiniTextRow: {
    width: '82%',
    height: 6,
    borderRadius: 999,
  },
  previewMiniTextRowShort: {
    width: '56%',
    height: 6,
    borderRadius: 999,
  },
  themePreview: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 2,
  },
  previewDot: {
    width: 16,
    height: 16,
    borderRadius: 999,
  },
  themeName: {
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 3,
  },
  themeDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  themeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    marginTop: 8,
  },
  priceText: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    marginVertical: 24,
  },
  supportSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  tiersContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  tierCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 14,
    gap: 8,
  },
  tierCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  tierIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  tierPrice: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  premiumNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  premiumNoteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  aboutList: {
    gap: 10,
  },
  aboutItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  aboutItemContent: {
    flex: 1,
    gap: 4,
  },
  aboutItemTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  aboutItemDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 32,
    gap: 2,
  },
  versionText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  versionSubtext: {
    fontSize: 11,
  },
});
