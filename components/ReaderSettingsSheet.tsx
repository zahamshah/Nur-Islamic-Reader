import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Minus, Plus, Type, AlignJustify } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useReaderSettings } from '@/context/ReaderSettingsContext';
import { ThemeConfig } from '@/types/content';

interface Props {
  visible: boolean;
  onClose: () => void;
  themeColors: ThemeConfig['colors'];
}

export default React.memo(function ReaderSettingsSheet({ visible, onClose, themeColors }: Props) {
  const insets = useSafeAreaInsets();
  const { settings, setFontSize, setLineHeight } = useReaderSettings();

  const adjustFontSize = useCallback(
    (delta: number) => {
      const next = Math.min(28, Math.max(13, settings.fontSize + delta));
      setFontSize(next);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [settings.fontSize, setFontSize]
  );

  const adjustLineHeight = useCallback(
    (delta: number) => {
      const next = Math.min(2.4, Math.max(1.3, Math.round((settings.lineHeight + delta) * 10) / 10));
      setLineHeight(next);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [settings.lineHeight, setLineHeight]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: themeColors.surface,
              paddingBottom: insets.bottom + 18,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: themeColors.divider }]} />
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.headerSpacer} />
              <View style={styles.headerTitleWrap}>
                <Text style={[styles.heading, { color: themeColors.text }]}>Reading Settings</Text>
              </View>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeBtn,
                  { backgroundColor: themeColors.tagBg },
                  pressed && styles.btnPressed,
                ]}
                hitSlop={12}
              >
                <X size={18} color={themeColors.textSecondary} />
              </Pressable>
            </View>
            <Text style={[styles.subheading, { color: themeColors.textSecondary }]}>
              Fine-tune text size and spacing for comfortable reading.
            </Text>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.card,
                { backgroundColor: themeColors.tagBg, borderColor: themeColors.cardBorder },
              ]}
            >
              <View style={styles.sectionHeader}>
                <Type size={16} color={themeColors.textSecondary} />
                <Text style={[styles.sectionLabel, { color: themeColors.text }]}>Font Size</Text>
                <Text style={[styles.sectionValue, { color: themeColors.accent }]}>{settings.fontSize}px</Text>
              </View>
              <View style={styles.stepper}>
                <Pressable
                  onPress={() => adjustFontSize(-1)}
                  style={({ pressed }) => [
                    styles.stepperBtn,
                    { backgroundColor: themeColors.surface },
                    pressed && styles.btnPressed,
                  ]}
                >
                  <Minus size={18} color={themeColors.text} />
                </Pressable>
                <View style={[styles.stepperTrack, { backgroundColor: themeColors.surface }]}>
                  <View
                    style={[
                      styles.stepperFill,
                      {
                        width: `${((settings.fontSize - 13) / 15) * 100}%`,
                        backgroundColor: themeColors.primary,
                      },
                    ]}
                  />
                </View>
                <Pressable
                  onPress={() => adjustFontSize(1)}
                  style={({ pressed }) => [
                    styles.stepperBtn,
                    { backgroundColor: themeColors.surface },
                    pressed && styles.btnPressed,
                  ]}
                >
                  <Plus size={18} color={themeColors.text} />
                </Pressable>
              </View>
            </View>

            <View
              style={[
                styles.card,
                { backgroundColor: themeColors.tagBg, borderColor: themeColors.cardBorder },
              ]}
            >
              <View style={styles.sectionHeader}>
                <AlignJustify size={16} color={themeColors.textSecondary} />
                <Text style={[styles.sectionLabel, { color: themeColors.text }]}>Line Height</Text>
                <Text style={[styles.sectionValue, { color: themeColors.accent }]}>{settings.lineHeight.toFixed(1)}</Text>
              </View>
              <View style={styles.stepper}>
                <Pressable
                  onPress={() => adjustLineHeight(-0.1)}
                  style={({ pressed }) => [
                    styles.stepperBtn,
                    { backgroundColor: themeColors.surface },
                    pressed && styles.btnPressed,
                  ]}
                >
                  <Minus size={18} color={themeColors.text} />
                </Pressable>
                <View style={[styles.stepperTrack, { backgroundColor: themeColors.surface }]}>
                  <View
                    style={[
                      styles.stepperFill,
                      {
                        width: `${((settings.lineHeight - 1.3) / 1.1) * 100}%`,
                        backgroundColor: themeColors.primary,
                      },
                    ]}
                  />
                </View>
                <Pressable
                  onPress={() => adjustLineHeight(0.1)}
                  style={({ pressed }) => [
                    styles.stepperBtn,
                    { backgroundColor: themeColors.surface },
                    pressed && styles.btnPressed,
                  ]}
                >
                  <Plus size={18} color={themeColors.text} />
                </Pressable>
              </View>
            </View>

            <View
              style={[
                styles.note,
                { backgroundColor: themeColors.accentMuted, borderColor: themeColors.cardBorder },
              ]}
            >
              <Text style={[styles.noteText, { color: themeColors.textSecondary }]}>
                Use the speaker button in the reader toolbar to choose a system voice (English).
              </Text>
            </View>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  btnPressed: {
    opacity: 0.82,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 14,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
    marginBottom: 12,
    gap: 6,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 32,
    height: 32,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  heading: {
    fontSize: 19,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
    letterSpacing: -0.2,
  },
  subheading: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center' as const,
    paddingHorizontal: 12,
  },
  content: {
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingBottom: 24,
    gap: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    flex: 1,
  },
  sectionValue: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  stepperFill: {
    height: '100%',
    borderRadius: 3,
  },
  note: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center' as const,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
