import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { GlossaryEntry } from '@/types/content';

export interface MarkdownThemeColors {
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  accentMuted: string;
  accentLight: string;
  primary: string;
}

interface Props {
  markdown: string;
  fontSize: number;
  lineHeight: number;
  themeColors: MarkdownThemeColors;
  isDark: boolean;
  glossary: GlossaryEntry[];
  onGlossaryTap: (entry: GlossaryEntry) => void;
}

interface TextSegment {
  type: 'text' | 'bold' | 'italic' | 'bolditalic' | 'glossary';
  content: string;
  glossaryId?: string;
}

interface ParsedBlock {
  type: 'h1' | 'h2' | 'h3' | 'paragraph' | 'blockquote' | 'hr' | 'listItem';
  segments: TextSegment[];
  raw: string;
}

function sanitizeMarkdown(raw: string): string {
  let text = raw;
  text = text.replace(/\uFEFF/g, '');
  text = text.replace(/\u200B|\u200C|\u200D|\uFEFF/g, '');

  const lines = text.split('\n');
  const hasBulkPrefix = lines.filter((l) => l.length > 0).every((l) => l.startsWith('# ') || l.trim() === '');
  if (hasBulkPrefix) {
    text = lines.map((l) => (l.startsWith('# ') ? l.slice(2) : l)).join('\n');
  }

  text = text.replace(/\\\[\\\[/g, '[[');
  text = text.replace(/\\\]\\\]/g, ']]');
  text = text.replace(/\\\[\[/g, '[[');
  text = text.replace(/\]\\\]/g, ']]');
  text = text.replace(/\[\[([^\]|]+)\}\]\]/g, '[[$1]]');
  text = text.replace(/\[\[([^\]|]+)\|([^\]]+)\}\]\]/g, '[[$1|$2]]');
  text = text.replace(/\[\[([^\]]+)\]\}/g, '[[$1]]');
  text = text.replace(/\\#/g, '#');
  text = text.replace(/\\\*\\\*/g, '**');
  text = text.replace(/\\\*/g, '*');
  text = text.replace(/\\-/g, '-');
  text = text.replace(/&nbsp;/g, ' ');
  return text;
}

function parseInlineSegments(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const pattern = /(\[\[([^\]|]+)\|([^\]]+)\]\])|\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    if (match[1]) {
      segments.push({ type: 'glossary', content: match[2], glossaryId: match[3] });
    } else if (match[4]) {
      segments.push({ type: 'bolditalic', content: match[4] });
    } else if (match[5]) {
      segments.push({ type: 'bold', content: match[5] });
    } else if (match[6]) {
      segments.push({ type: 'italic', content: match[6] });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return segments;
}

function parseMarkdown(raw: string): ParsedBlock[] {
  const sanitized = sanitizeMarkdown(raw);
  const lines = sanitized.split('\n');
  const blocks: ParsedBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') {
      i++;
      continue;
    }

    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      blocks.push({ type: 'hr', segments: [], raw: trimmed });
      i++;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      const content = trimmed.slice(4);
      blocks.push({ type: 'h3', segments: parseInlineSegments(content), raw: content });
      i++;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      const content = trimmed.slice(3);
      blocks.push({ type: 'h2', segments: parseInlineSegments(content), raw: content });
      i++;
      continue;
    }

    if (trimmed.startsWith('# ')) {
      const content = trimmed.slice(2);
      blocks.push({ type: 'h1', segments: parseInlineSegments(content), raw: content });
      i++;
      continue;
    }

    if (trimmed.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().slice(2));
        i++;
      }
      const content = quoteLines.join('\n');
      blocks.push({ type: 'blockquote', segments: parseInlineSegments(content), raw: content });
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.slice(2);
      blocks.push({ type: 'listItem', segments: parseInlineSegments(content), raw: content });
      i++;
      continue;
    }

    const paraLines: string[] = [trimmed];
    i++;
    while (i < lines.length) {
      const nextTrimmed = lines[i].trim();
      if (
        nextTrimmed === '' ||
        nextTrimmed.startsWith('#') ||
        nextTrimmed.startsWith('>') ||
        nextTrimmed.startsWith('- ') ||
        nextTrimmed.startsWith('* ') ||
        nextTrimmed === '---' ||
        nextTrimmed === '***'
      ) {
        break;
      }
      paraLines.push(nextTrimmed);
      i++;
    }
    const content = paraLines.join(' ');
    blocks.push({ type: 'paragraph', segments: parseInlineSegments(content), raw: content });
  }

  return blocks;
}

export default React.memo(function MarkdownRenderer({
  markdown,
  fontSize,
  lineHeight,
  themeColors,
  isDark,
  glossary,
  onGlossaryTap,
}: Props) {
  const blocks = useMemo(() => parseMarkdown(markdown), [markdown]);
  const computedLineHeight = fontSize * lineHeight;
  const glossaryById = useMemo(() => {
    const mapped = new Map<string, GlossaryEntry>();
    glossary.forEach((entry) => {
      mapped.set(entry.id, entry);
    });
    return mapped;
  }, [glossary]);

  const handleGlossaryPress = useCallback(
    (id: string) => {
      const entry = glossaryById.get(id);
      if (entry) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onGlossaryTap(entry);
      } else {
        console.log('[MarkdownRenderer] Glossary entry not found, rendering as plain text:', id);
      }
    },
    [glossaryById, onGlossaryTap]
  );

  const renderSegments = useCallback(
    (segments: TextSegment[], baseStyle: object) => {
      return segments.map((seg, idx) => {
        switch (seg.type) {
          case 'bold':
            return (
              <Text key={idx} style={[baseStyle, { fontWeight: '700' as const }]}>
                {seg.content}
              </Text>
            );
          case 'italic':
            return (
              <Text key={idx} style={[baseStyle, { fontStyle: 'italic' as const }]}>
                {seg.content}
              </Text>
            );
          case 'bolditalic':
            return (
              <Text
                key={idx}
                style={[baseStyle, { fontWeight: '700' as const, fontStyle: 'italic' as const }]}
              >
                {seg.content}
              </Text>
            );
          case 'glossary': {
            const hasGlossaryEntry = seg.glossaryId ? glossaryById.has(seg.glossaryId) : false;

            if (!hasGlossaryEntry) {
              return (
                <Text key={idx} style={baseStyle}>
                  {seg.content}
                </Text>
              );
            }

            return (
              <Text
                key={idx}
                testID={`glossary-chip-${seg.glossaryId}`}
                onPress={() => {
                  if (seg.glossaryId) {
                    handleGlossaryPress(seg.glossaryId);
                  }
                }}
                style={[
                  baseStyle,
                  {
                    backgroundColor: isDark ? 'rgba(196,154,60,0.15)' : themeColors.accentMuted,
                    color: isDark ? themeColors.accentLight : themeColors.primary,
                    fontWeight: '600' as const,
                    borderRadius: 4,
                    overflow: 'hidden',
                  },
                ]}
              >
                {' '}{seg.content}{' '}
              </Text>
            );
          }
          default:
            return (
              <Text key={idx} style={baseStyle}>
                {seg.content}
              </Text>
            );
        }
      });
    },
    [glossaryById, handleGlossaryPress, isDark, themeColors]
  );

  return (
    <View style={styles.container}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'h1':
            return (
              <Text
                key={i}
                style={[
                  styles.h1,
                  {
                    color: themeColors.text,
                    fontSize: fontSize + 10,
                    lineHeight: (fontSize + 10) * 1.25,
                  },
                ]}
              >
                {renderSegments(block.segments, {
                  color: themeColors.text,
                  fontSize: fontSize + 10,
                })}
              </Text>
            );
          case 'h2':
            return (
              <Text
                key={i}
                style={[
                  styles.h2,
                  {
                    color: themeColors.text,
                    fontSize: fontSize + 5,
                    lineHeight: (fontSize + 5) * 1.3,
                  },
                ]}
              >
                {renderSegments(block.segments, {
                  color: themeColors.text,
                  fontSize: fontSize + 5,
                })}
              </Text>
            );
          case 'h3':
            return (
              <Text
                key={i}
                style={[
                  styles.h3,
                  {
                    color: themeColors.text,
                    fontSize: fontSize + 2,
                    lineHeight: (fontSize + 2) * 1.3,
                  },
                ]}
              >
                {renderSegments(block.segments, {
                  color: themeColors.text,
                  fontSize: fontSize + 2,
                })}
              </Text>
            );
          case 'blockquote':
            return (
              <View
                key={i}
                style={[
                  styles.blockquote,
                  {
                    borderLeftColor: themeColors.accent,
                    backgroundColor: isDark
                      ? 'rgba(196,154,60,0.08)'
                      : 'rgba(196,154,60,0.06)',
                  },
                ]}
              >
                <Text
                  style={{
                    color: themeColors.textSecondary,
                    fontSize: fontSize - 1,
                    lineHeight: (fontSize - 1) * lineHeight,
                    fontStyle: 'italic' as const,
                  }}
                >
                  {renderSegments(block.segments, {
                    color: themeColors.textSecondary,
                    fontSize: fontSize - 1,
                    fontStyle: 'italic' as const,
                  })}
                </Text>
              </View>
            );
          case 'hr':
            return (
              <View
                key={i}
                style={[styles.hr, { backgroundColor: themeColors.border }]}
              />
            );
          case 'listItem':
            return (
              <View key={i} style={styles.listItem}>
                <Text
                  style={[
                    styles.listBullet,
                    { color: themeColors.accent, fontSize, lineHeight: computedLineHeight },
                  ]}
                >
                  •
                </Text>
                <Text
                  style={{
                    color: themeColors.text,
                    fontSize,
                    lineHeight: computedLineHeight,
                    flex: 1,
                  }}
                >
                  {renderSegments(block.segments, {
                    color: themeColors.text,
                    fontSize,
                  })}
                </Text>
              </View>
            );
          default:
            return (
              <Text
                key={i}
                style={{
                  color: themeColors.text,
                  fontSize,
                  lineHeight: computedLineHeight,
                  marginBottom: 14,
                }}
              >
                {renderSegments(block.segments, {
                  color: themeColors.text,
                  fontSize,
                })}
              </Text>
            );
        }
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  h1: {
    fontWeight: '800' as const,
    marginBottom: 18,
    marginTop: 8,
    letterSpacing: -0.5,
  },
  h2: {
    fontWeight: '700' as const,
    marginBottom: 12,
    marginTop: 28,
    letterSpacing: -0.3,
  },
  h3: {
    fontWeight: '600' as const,
    marginBottom: 10,
    marginTop: 22,
  },
  blockquote: {
    borderLeftWidth: 3,
    paddingLeft: 16,
    paddingVertical: 12,
    paddingRight: 12,
    marginVertical: 16,
    borderRadius: 4,
  },
  hr: {
    height: 1,
    marginVertical: 28,
  },
  listItem: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
    paddingLeft: 4,
  },
  listBullet: {
    fontWeight: '700' as const,
    width: 16,
  },
});
