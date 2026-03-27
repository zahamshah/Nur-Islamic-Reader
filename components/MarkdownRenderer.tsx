import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { prepareMarkdownForDisplay } from '@/utils/chapterMarkdown';

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
  chapterTitle?: string;
  fontSize: number;
  lineHeight: number;
  themeColors: MarkdownThemeColors;
  isDark: boolean;
  onHeadingPress?: (heading: string) => void;
  selectableHeadings?: boolean;
}

interface TextSegment {
  type: 'text' | 'bold' | 'italic' | 'bolditalic';
  content: string;
}

interface ParsedBlock {
  type: 'h1' | 'h2' | 'h3' | 'paragraph' | 'blockquote' | 'hr' | 'listItem';
  segments: TextSegment[];
  raw: string;
}

function parseInlineSegments(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const pattern = /\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    if (match[1]) {
      segments.push({ type: 'bolditalic', content: match[1] });
    } else if (match[2]) {
      segments.push({ type: 'bold', content: match[2] });
    } else if (match[3]) {
      segments.push({ type: 'italic', content: match[3] });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return segments;
}

function parseMarkdown(raw: string, chapterTitle?: string): ParsedBlock[] {
  const sanitized = prepareMarkdownForDisplay(raw, chapterTitle);
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
  chapterTitle,
  fontSize,
  lineHeight,
  themeColors,
  isDark,
  onHeadingPress,
  selectableHeadings = false,
}: Props) {
  const blocks = useMemo(() => parseMarkdown(markdown, chapterTitle), [chapterTitle, markdown]);
  const computedLineHeight = fontSize * lineHeight;

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
          default:
            return (
              <Text key={idx} style={baseStyle}>
                {seg.content}
              </Text>
            );
        }
      });
    },
    []
  );

  const renderHeadingBlock = (
    block: ParsedBlock,
    level: 'h1' | 'h2' | 'h3',
    key: number
  ) => {
    const touchable = Boolean(onHeadingPress) && selectableHeadings;
    const isPrimary = level === 'h1';
    const isSecondary = level === 'h2';
    const compactWords = block.raw.trim().split(/\s+/).filter(Boolean).length;
    const isCompact = !isPrimary && compactWords <= 2;
    const headingSize = isPrimary ? fontSize + 10 : isSecondary ? fontSize + 5 : fontSize + 2;
    const headingLineHeight = headingSize * (isPrimary ? 1.25 : 1.3);

    const blockStyle = [
      styles.headingBlock,
      isPrimary
        ? styles.headingBlockH1
        : isCompact
          ? styles.headingBlockCompact
          : isSecondary
            ? styles.headingBlockH2
            : styles.headingBlockH3,
      isPrimary
        ? {
            borderTopColor: themeColors.accentMuted,
            borderBottomColor: themeColors.accentMuted,
            backgroundColor: isDark ? 'rgba(196,154,60,0.04)' : 'rgba(196,154,60,0.03)',
          }
        : isCompact
          ? {
              borderTopColor: themeColors.accentMuted,
              borderBottomColor: themeColors.accentMuted,
              backgroundColor: isDark ? 'rgba(196,154,60,0.08)' : 'rgba(196,154,60,0.06)',
            }
          : isSecondary
            ? {
                borderTopColor: themeColors.accentMuted,
                borderBottomColor: themeColors.accentMuted,
                backgroundColor: isDark
                  ? 'rgba(196,154,60,0.06)'
                  : 'rgba(196,154,60,0.045)',
              }
            : {
                borderColor: themeColors.accentMuted,
                backgroundColor: isDark
                  ? 'rgba(196,154,60,0.06)'
                  : 'rgba(196,154,60,0.05)',
              },
    ];

    const content = (
      <Text
        style={[
          level === 'h1'
            ? styles.h1
            : isCompact
              ? styles.headingCompact
              : level === 'h2'
                ? styles.h2
                : styles.h3,
          {
            color: themeColors.accent,
            fontSize: headingSize,
            lineHeight: headingLineHeight,
            textAlign: 'center',
            alignSelf: 'stretch',
          },
        ]}
      >
        {renderSegments(block.segments, {
          color: themeColors.accent,
          fontSize: headingSize,
        })}
      </Text>
    );

    if (touchable) {
      return (
        <Pressable
          key={key}
          onPress={() => onHeadingPress?.(block.raw)}
          style={({ pressed }) => [blockStyle, pressed && styles.headingPressed]}
        >
          {content}
        </Pressable>
      );
    }

    return (
      <View key={key} style={blockStyle}>
        {content}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'h1':
            return renderHeadingBlock(block, 'h1', i);
          case 'h2':
            return renderHeadingBlock(block, 'h2', i);
          case 'h3':
            return renderHeadingBlock(block, 'h3', i);
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
                  {"\u2022"}
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
  headingBlock: {
    alignSelf: 'center',
    width: '100%',
    marginTop: 20,
    marginBottom: 12,
  },
  headingBlockH1: {
    marginTop: 8,
    marginBottom: 22,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 14,
    alignSelf: 'center',
    width: '96%',
    maxWidth: 680,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRadius: 18,
  },
  headingBlockCompact: {
    alignItems: 'center',
    alignSelf: 'center',
    width: '88%',
    maxWidth: 520,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRadius: 16,
  },
  headingBlockH2: {
    alignItems: 'center',
    alignSelf: 'center',
    width: '92%',
    maxWidth: 620,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRadius: 18,
  },
  headingBlockH3: {
    alignItems: 'center',
    alignSelf: 'center',
    width: '84%',
    maxWidth: 520,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 999,
  },
  h1: {
    fontWeight: '800' as const,
    letterSpacing: -0.5,
    textAlign: 'center' as const,
  },
  h2: {
    fontWeight: '700' as const,
    letterSpacing: -0.2,
    textAlign: 'center' as const,
  },
  h3: {
    fontWeight: '700' as const,
    letterSpacing: 0.1,
    textAlign: 'center' as const,
  },
  headingCompact: {
    textAlign: 'center' as const,
    letterSpacing: 0.2,
  },
  headingPressed: {
    opacity: 0.82,
  },
  blockquote: {
    borderLeftWidth: 3,
    paddingLeft: 16,
    paddingVertical: 13,
    paddingRight: 14,
    marginVertical: 16,
    borderRadius: 12,
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
