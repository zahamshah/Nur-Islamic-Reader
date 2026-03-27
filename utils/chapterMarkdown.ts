const NAME_PREFIX_RE = /^Name:\s*/i;
const CHAPTER_PREFIX_RE = /^Chapter\s+(?:[A-Za-z]+|\d+|[IVXLCDM]+)\s*:\s*/i;
const SHORT_CH_PREFIX_RE = /^Ch\s*\d+\s*:\s*/i;
const NUMERIC_PREFIX_RE = /^\d+\s*:\s*/;
const ROMAN_PREFIX_RE = /^[IVXLCDM]+\.\s+/i;
const ROMAN_DASH_PREFIX_RE = /^[IVXLCDM]+\s+[–—-]\s+/i;
const CHUNK_PREFIX_RE = /^Chunk\s+\d+(?:\/\d+)?\s+[–—-]\s+/i;
const PART_PREFIX_RE = /^Part\s+\d+\s+[–—-]\s+/i;
const PART_PAREN_RE = /\s*\((?:[^()]*\bPart\b[^()]*)\)\s*/gi;

function cleanupEscapedMarkdown(raw: string): string {
  let text = raw;
  text = text.replace(/\uFEFF/g, '');
  text = text.replace(/\u200B|\u200C|\u200D|\uFEFF/g, '');
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
  text = text.replace(/(?:\\`)+\[\[([^\]|]+)\|[^\]]+\]\](?:\\`)+/g, '$1');
  text = text.replace(/(?:\\`)+\[\[([^\]]+)\]\](?:\\`)+/g, '$1');
  text = text.replace(/\[\[([^\]|]+)\|[^\]]+\]\]/g, '$1');
  text = text.replace(/\[\[([^\]]+)\]\]/g, '$1');
  return text;
}

export function normalizeHeadingText(input: string): string {
  let text = input.trim();
  text = text.replace(NAME_PREFIX_RE, '');
  text = text.replace(CHAPTER_PREFIX_RE, '');
  text = text.replace(SHORT_CH_PREFIX_RE, '');
  text = text.replace(NUMERIC_PREFIX_RE, '');
  text = text.replace(ROMAN_PREFIX_RE, '');
  text = text.replace(ROMAN_DASH_PREFIX_RE, '');
  text = text.replace(CHUNK_PREFIX_RE, '');
  text = text.replace(PART_PREFIX_RE, '');
  text = text.replace(PART_PAREN_RE, ' ');
  text = text.replace(/\s+:\s+/g, ': ');
  text = text.replace(/\s{2,}/g, ' ');
  return text.trim();
}

export function prepareMarkdownForDisplay(raw: string, chapterTitle?: string): string {
  const cleaned = cleanupEscapedMarkdown(raw);
  const lines = cleaned.split('\n');
  const chapterHeadingCount = lines.filter((line) => /^#\s+Chapter\s+/i.test(line.trim())).length;
  const displayTitle = chapterTitle ? normalizeHeadingText(chapterTitle) : '';
  let hasH1 = false;

  const normalizedLines = lines.map((line) => {
    const indent = (line.match(/^\s*/) ?? [''])[0];
    const trimmed = line.trim();

    if (!trimmed) {
      return '';
    }

    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      return '---';
    }

    const h1Match = trimmed.match(/^#\s+(.+)$/);
    if (h1Match) {
      const originalHeading = h1Match[1].trim();
      const normalizedHeading = normalizeHeadingText(originalHeading);
      if (!normalizedHeading) return '';

      if (/^Chapter\s+/i.test(originalHeading) && chapterHeadingCount > 1) {
        return `${indent}## ${normalizedHeading}`;
      }

      hasH1 = true;
      return `${indent}# ${displayTitle || normalizedHeading}`;
    }

    const h2Match = trimmed.match(/^##\s+(.+)$/);
    if (h2Match) {
      return `${indent}## ${normalizeHeadingText(h2Match[1])}`;
    }

    const h3Match = trimmed.match(/^###\s+(.+)$/);
    if (h3Match) {
      return `${indent}## ${normalizeHeadingText(h3Match[1])}`;
    }

    return line;
  });

  if (!hasH1 && displayTitle) {
    const firstHeadingIndex = normalizedLines.findIndex((line) => /^##\s+/.test(line.trim()));
    if (firstHeadingIndex >= 0) {
      const firstHeadingText = normalizedLines[firstHeadingIndex].trim().replace(/^##\s+/, '');
      if (normalizeHeadingText(firstHeadingText).toLowerCase() === displayTitle.toLowerCase()) {
        normalizedLines[firstHeadingIndex] = normalizedLines[firstHeadingIndex].replace(
          /^(\s*)##\s+/,
          '$1# '
        );
      } else {
        normalizedLines.unshift(`# ${displayTitle}`, '');
      }
    } else {
      normalizedLines.unshift(`# ${displayTitle}`, '');
    }
  }

  return normalizedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function extractDisplayTitle(raw: string): string {
  const prepared = prepareMarkdownForDisplay(raw);
  const match = prepared.match(/^#\s+(.+)$/m) ?? prepared.match(/^##\s+(.+)$/m);
  return match ? normalizeHeadingText(match[1]) : 'Untitled Chapter';
}

export function markdownToNarrationText(raw: string, chapterTitle?: string): string {
  return prepareMarkdownForDisplay(raw, chapterTitle)
    .replace(/\[\[([^\]|]+)\|[^\]]+\]\]/g, '$1')
    .replace(/[#*>\-_`]/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
}
