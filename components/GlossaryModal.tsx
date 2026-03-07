import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { X, BookMarked } from 'lucide-react-native';
import { GlossaryEntry, ThemeConfig } from '@/types/content';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Props {
  entry: GlossaryEntry | null;
  visible: boolean;
  onClose: () => void;
  themeColors: ThemeConfig['colors'];
  isDark: boolean;
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=60';

export default React.memo(function GlossaryModal({ entry, visible, onClose, themeColors, isDark }: Props) {
  const [imageError, setImageError] = useState<boolean>(false);

  const handleImageError = useCallback(() => {
    console.log('[GlossaryModal] Image failed to load, using placeholder');
    setImageError(true);
  }, []);

  if (!entry) return null;

  const imageUri = imageError || !entry.image ? PLACEHOLDER_IMAGE : entry.image;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: themeColors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.handle, { backgroundColor: themeColors.divider }]} />
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.scrollContent}
          >
            {entry.image || imageError ? (
              <View style={[styles.imageContainer, { backgroundColor: themeColors.tagBg }]}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.image}
                  resizeMode="cover"
                  onError={handleImageError}
                />
                {entry.caption ? (
                  <Text style={[styles.caption, { color: themeColors.textMuted }]}>{entry.caption}</Text>
                ) : null}
              </View>
            ) : null}

            <View style={styles.content}>
              <View style={styles.labelRow}>
                <View style={[styles.labelIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : `${themeColors.primary}14` }]}>
                  <BookMarked size={16} color={themeColors.primary} />
                </View>
                <Text style={[styles.label, { color: themeColors.text }]}>{entry.label}</Text>
              </View>
              <Text style={[styles.description, { color: themeColors.textSecondary }]}>{entry.description}</Text>
            </View>
          </ScrollView>

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
    maxHeight: '80%',
    minHeight: 200,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageContainer: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: SCREEN_WIDTH * 0.5,
  },
  caption: {
    fontSize: 12,
    fontStyle: 'italic' as const,
    padding: 10,
    textAlign: 'center' as const,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  labelIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 20,
    fontWeight: '700' as const,
    flex: 1,
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
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
