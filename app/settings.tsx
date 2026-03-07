import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  Animated,
  Platform,
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
import { AppTheme, ThemeConfig } from '@/types/content';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentThemeId, theme, setTheme, purchaseTheme, isThemePurchased } = useAppSettings();
  const [purchasingTheme, setPurchasingTheme] = useState<string | null>(null);

  const colors = theme.colors;
  const dark = isDarkTheme(currentThemeId);

  const handleThemeSelect = useCallback(
    (t: ThemeConfig) => {
      if (t.isPremium && !isThemePurchased(t.id)) {
        Alert.alert(
          `Unlock ${t.name}`,
          `This theme costs ${t.price} — a small way to support this free app. All proceeds go toward keeping Nūr ad-free and open.\n\nWould you like to unlock it?`,
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
          ]
        );
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTheme(t.id);
    },
    [isThemePurchased, purchaseTheme, setTheme]
  );

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
            paddingTop: insets.top + 4,
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

          <View style={styles.themeGrid}>
            {APP_THEMES.map((t) => {
              const isActive = currentThemeId === t.id;
              const isPurchased = isThemePurchased(t.id);
              const isLocked = t.isPremium && !isPurchased;
              const isPurchasing = purchasingTheme === t.id;

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
                        { backgroundColor: t.colors.background },
                        { borderWidth: 1, borderColor: t.colors.cardBorder },
                      ]}
                    />
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
              Premium themes ($0.99 each) are another great way to support this app. Every purchase keeps Nūr alive and growing.
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
    paddingTop: 24,
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
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeCard: {
    width: '47%' as any,
    borderRadius: 14,
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  themeCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  themePreview: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  previewDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  themeName: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  themeDesc: {
    fontSize: 11,
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
