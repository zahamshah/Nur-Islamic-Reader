import React, { useCallback, useEffect, useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pause, Play, Volume2, X, Minus, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useReaderSettings } from '@/context/ReaderSettingsContext';
import { ThemeConfig } from '@/types/content';

type VoiceOption = {
  id: string;
  label: string;
  language: string;
  quality?: string;
};

interface Props {
  visible: boolean;
  onClose: () => void;
  themeColors: ThemeConfig['colors'];
  isSpeaking: boolean;
  onTogglePlayback: () => void;
  isPreparing: boolean;
  narrationSupported: boolean;
  narrationError: string | null;
  voices: VoiceOption[];
  voicesLoaded: boolean;
  startMode: 'beginning' | 'current' | 'custom';
  onStartModeChange: (mode: 'beginning' | 'current' | 'custom') => void;
  onPickStartPoint: () => void;
  customStartLabel?: string | null;
}

export default React.memo(function NarrationControlSheet({
  visible,
  onClose,
  themeColors,
  isSpeaking,
  onTogglePlayback,
  isPreparing,
  narrationSupported,
  narrationError,
  voices,
  voicesLoaded,
  startMode,
  onStartModeChange,
  onPickStartPoint,
  customStartLabel,
}: Props) {
  const insets = useSafeAreaInsets();
  const { settings, setSpeechRate, setSpeechPitch, setSpeechVoiceId } = useReaderSettings();

  const selectedVoice = useMemo(
    () => voices.find((voice) => voice.id === settings.speechVoiceId) ?? voices[0],
    [settings.speechVoiceId, voices]
  );

  useEffect(() => {
    if (!visible) return;
    const exists = voices.some((voice) => voice.id === settings.speechVoiceId);
    if (!exists && voices.length > 0) {
      setSpeechVoiceId(voices[0].id);
    }
  }, [setSpeechVoiceId, settings.speechVoiceId, visible, voices]);

  const adjustSpeechRate = useCallback(
    (delta: number) => {
      const next = Math.min(1.6, Math.max(0.8, Math.round((settings.speechRate + delta) * 10) / 10));
      setSpeechRate(next);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [settings.speechRate, setSpeechRate]
  );

  const adjustSpeechPitch = useCallback(
    (delta: number) => {
      const next = Math.min(1.3, Math.max(0.7, Math.round((settings.speechPitch + delta) * 10) / 10));
      setSpeechPitch(next);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [settings.speechPitch, setSpeechPitch]
  );

  const handleVoiceSelect = useCallback(
    (voiceId: string) => {
      setSpeechVoiceId(voiceId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [setSpeechVoiceId]
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
                <Text style={[styles.heading, { color: themeColors.text }]}>Voice Settings</Text>
              </View>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeBtn,
                  { backgroundColor: themeColors.tagBg },
                  pressed && styles.btnPressed,
                ]}
                hitSlop={10}
              >
                <X size={18} color={themeColors.textSecondary} />
              </Pressable>
            </View>
            <Text style={[styles.subheading, { color: themeColors.textSecondary }]}>
              System voices are pulled from your device. Download an English voice in device settings for the best offline quality.
            </Text>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <Pressable
              onPress={onTogglePlayback}
              disabled={(!narrationSupported && !isSpeaking) || isPreparing}
              style={({ pressed }) => [
                styles.playBtn,
                { backgroundColor: themeColors.primary },
                ((!narrationSupported && !isSpeaking) || isPreparing) && styles.playBtnDisabled,
                pressed && styles.btnPressed,
              ]}
            >
              {isSpeaking ? <Pause size={18} color="#FFFFFF" /> : <Play size={18} color="#FFFFFF" />}
              <Text style={styles.playBtnText}>
                {isSpeaking ? 'Stop Reading' : isPreparing ? 'Preparing Voice...' : 'Play Reading'}
              </Text>
            </Pressable>

            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: themeColors.accentMuted,
                  borderColor: themeColors.cardBorder,
                },
              ]}
            >
              <Volume2 size={16} color={themeColors.accent} />
              <Text style={[styles.infoText, { color: themeColors.textSecondary }]}>
                {voicesLoaded
                  ? narrationSupported
                    ? `Selected voice: ${selectedVoice?.label ?? 'System default'}.`
                    : 'No compatible system voices found yet.'
                  : 'Loading system voices...'}
              </Text>
            </View>

            {narrationError ? (
              <View
                style={[
                  styles.errorCard,
                  {
                    backgroundColor: themeColors.accentMuted,
                    borderColor: themeColors.cardBorder,
                  },
                ]}
              >
                <Text style={[styles.errorText, { color: themeColors.textSecondary }]}>
                  {narrationError}
                </Text>
              </View>
            ) : null}

            <View
              style={[
                styles.card,
                {
                  backgroundColor: themeColors.tagBg,
                  borderColor: themeColors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Start Reading From</Text>
              <View style={styles.startModeRow}>
                {[
                  { id: 'current' as const, label: 'Current' },
                  { id: 'beginning' as const, label: 'Beginning' },
                ].map((option) => {
                  const active = startMode === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => onStartModeChange(option.id)}
                      style={({ pressed }) => [
                        styles.startModeBtn,
                        {
                          backgroundColor: active ? themeColors.primary : themeColors.surface,
                          borderColor: active ? themeColors.primary : themeColors.cardBorder,
                        },
                        pressed && styles.btnPressed,
                      ]}
                    >
                      <Text style={[styles.startModeText, { color: active ? '#FFFFFF' : themeColors.text }]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={[styles.helperText, { color: themeColors.textMuted }]}>
                Current uses your last scroll position.
              </Text>
              <Pressable
                onPress={onPickStartPoint}
                style={({ pressed }) => [
                  styles.pickStartBtn,
                  { backgroundColor: themeColors.surface, borderColor: themeColors.cardBorder },
                  pressed && styles.btnPressed,
                ]}
              >
                <Text style={[styles.pickStartText, { color: themeColors.accent }]}>
                  Pick Start Point
                </Text>
                <Text style={[styles.pickStartHint, { color: themeColors.textMuted }]}>
                  Tap a heading in the reader to start from there.
                </Text>
                {startMode === 'custom' && customStartLabel ? (
                  <Text style={[styles.pickStartHint, { color: themeColors.textSecondary }]}>
                    Selected: {customStartLabel}
                  </Text>
                ) : null}
              </Pressable>
            </View>

            <View
              style={[
                styles.card,
                {
                  backgroundColor: themeColors.tagBg,
                  borderColor: themeColors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>System Voices</Text>
              <View style={styles.voiceList}>
                {voices.map((voice, index) => {
                  const selected = voice.id === settings.speechVoiceId;
                  return (
                    <Pressable
                      key={voice.id}
                      onPress={() => handleVoiceSelect(voice.id)}
                      style={({ pressed }) => [
                        styles.voiceRow,
                        {
                          backgroundColor: themeColors.tagBg,
                          borderColor: selected ? themeColors.accent : themeColors.cardBorder,
                        },
                        pressed && styles.btnPressed,
                      ]}
                    >
                      <View style={styles.voiceMeta}>
                        <Text
                          style={[
                            styles.voiceName,
                            { color: selected ? themeColors.accent : themeColors.text },
                          ]}
                          numberOfLines={1}
                        >
                          {voice.label}
                        </Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: themeColors.accentMuted }]}>
                        <Text style={[styles.badgeText, { color: themeColors.accent }]}>
                          {index === 0 ? 'Default' : 'System'}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
                {voices.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={[styles.helperText, { color: themeColors.textMuted }]}>
                      {"No system voices detected. Install one in your phone's Text-to-Speech settings."}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View
              style={[
                styles.card,
                {
                  backgroundColor: themeColors.tagBg,
                  borderColor: themeColors.cardBorder,
                },
              ]}
            >
              <View style={styles.stepperHeader}>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Speed</Text>
                <Text style={[styles.stepperValue, { color: themeColors.accent }]}>
                  {settings.speechRate.toFixed(1)}x
                </Text>
              </View>
              <Text style={[styles.helperText, { color: themeColors.textMuted }]}>
                Speed updates as the narration progresses.
              </Text>
              <View style={styles.stepper}>
                <Pressable
                  onPress={() => adjustSpeechRate(-0.1)}
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
                        width: `${((settings.speechRate - 0.8) / 0.8) * 100}%`,
                        backgroundColor: themeColors.primary,
                      },
                    ]}
                  />
                </View>
                <Pressable
                  onPress={() => adjustSpeechRate(0.1)}
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
                {
                  backgroundColor: themeColors.tagBg,
                  borderColor: themeColors.cardBorder,
                },
              ]}
            >
              <View style={styles.stepperHeader}>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Pitch</Text>
                <Text style={[styles.stepperValue, { color: themeColors.accent }]}>
                  {settings.speechPitch.toFixed(1)}
                </Text>
              </View>
              <Text style={[styles.helperText, { color: themeColors.textMuted }]}>
                Pitch updates as the narration progresses.
              </Text>
              <View style={styles.stepper}>
                <Pressable
                  onPress={() => adjustSpeechPitch(-0.1)}
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
                        width: `${((settings.speechPitch - 0.7) / 0.6) * 100}%`,
                        backgroundColor: themeColors.primary,
                      },
                    ]}
                  />
                </View>
                <Pressable
                  onPress={() => adjustSpeechPitch(0.1)}
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
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
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
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingBottom: 20,
    gap: 16,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  playBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700' as const,
  },
  playBtnDisabled: {
    opacity: 0.55,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  errorCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 18,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 17,
  },
  voiceList: {
    gap: 8,
  },
  startModeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  startModeBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: 'center',
  },
  startModeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.4,
  },
  pickStartBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  pickStartText: {
    fontSize: 13,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.4,
  },
  pickStartHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  emptyState: {
    paddingVertical: 6,
  },
  voiceRow: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  voiceMeta: {
    flex: 1,
    gap: 2,
  },
  voiceName: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.4,
  },
  stepperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepperValue: {
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
    borderRadius: 14,
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
  btnPressed: {
    opacity: 0.82,
  },
});
