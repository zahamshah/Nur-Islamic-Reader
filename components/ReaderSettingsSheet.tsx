import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { X, Minus, Plus, Type, AlignJustify } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useReaderSettings } from '@/context/ReaderSettingsContext';
import { ThemeConfig } from '@/types/content';

interface Props {
  visible: boolean;
  onClose: () => void;
  themeColors: ThemeConfig['colors'];
  isDark: boolean;
}

export default React.memo(function ReaderSettingsSheet({ visible, onClose, themeColors, isDark }: Props) {
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
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: themeColors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.handle, { backgroundColor: themeColors.divider }]} />
          <Text style={[styles.heading, { color: themeColors.text }]}>Reading Settings</Text>

          <View style={styles.section}>
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
                  { backgroundColor: themeColors.tagBg },
                  pressed && styles.stepperBtnPressed,
                ]}
              >
                <Minus size={18} color={themeColors.text} />
              </Pressable>
              <View style={[styles.stepperTrack, { backgroundColor: themeColors.tagBg }]}>
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
                  { backgroundColor: themeColors.tagBg },
                  pressed && styles.stepperBtnPressed,
                ]}
              >
                <Plus size={18} color={themeColors.text} />
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
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
                  { backgroundColor: themeColors.tagBg },
                  pressed && styles.stepperBtnPressed,
                ]}
              >
                <Minus size={18} color={themeColors.text} />
              </Pressable>
              <View style={[styles.stepperTrack, { backgroundColor: themeColors.tagBg }]}>
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
                  { backgroundColor: themeColors.tagBg },
                  pressed && styles.stepperBtnPressed,
                ]}
              >
                <Plus size={18} color={themeColors.text} />
              </Pressable>
            </View>
          </View>

          <View style={[styles.themeNote, { backgroundColor: themeColors.accentMuted }]}>
            <Text style={[styles.themeNoteText, { color: themeColors.textSecondary }]}>
              To change the reader theme, go to Settings and select an app theme. The reader will follow the global theme.
            </Text>
          </View>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeBtn,
              { backgroundColor: themeColors.tagBg },
              pressed && styles.closeBtnPressed,
            ]}
            hitSlop={12}
          >
            <X size={18} color={themeColors.textSecondary} />
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700' as const,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    flex: 1,
  },
  sectionValue: {
    fontSize: 14,
    fontWeight: '600' as const,
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
  stepperBtnPressed: {
    opacity: 0.7,
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
  themeNote: {
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 12,
  },
  themeNoteText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center' as const,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnPressed: {
    opacity: 0.7,
  },
});
