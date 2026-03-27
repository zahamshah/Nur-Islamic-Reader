const fs = require('fs');
const path = require('path');

const root = process.cwd();
const seerahPath = path.join(root, 'constants', 'chapters', 'seerah-of-prophet-muhammad.ts');
const contentPath = path.join(root, 'constants', 'content.ts');

const raw = fs.readFileSync(seerahPath, 'utf8');
const parts = raw.split(/(?=export const )/g);

const entries = new Map();
const warnings = [];

function lastUnescapedBacktickIndex(s) {
  for (let i = s.length - 1; i >= 0; i--) {
    if (s[i] === '`') {
      const prev = s[i - 1];
      if (prev !== '\\') return i;
    }
  }
  return -1;
}

for (const part of parts) {
  const m = part.match(/^export const (\w+)/);
  if (!m) continue;
  const name = m[1];
  if (!name.startsWith('SEERAH')) continue;

  const keyRegex = /^\s+"(ch[^\"]+)"\s*:/gm;
  const matches = [];
  let km;
  while ((km = keyRegex.exec(part))) {
    matches.push({ key: km[1], index: km.index, after: keyRegex.lastIndex });
  }

  for (let i = 0; i < matches.length; i++) {
    const { key, after } = matches[i];
    const startTick = part.indexOf('`', after);
    if (startTick === -1) {
      warnings.push(`No opening backtick for ${key} in ${name}`);
      continue;
    }

    const nextIndex = i + 1 < matches.length ? matches[i + 1].index : part.length;
    const segment = part.slice(startTick + 1, nextIndex);
    const endTick = lastUnescapedBacktickIndex(segment);
    let content = endTick >= 0 ? segment.slice(0, endTick) : segment;

    // If content still includes the next key line due to missing backtick, trim at first key line inside segment.
    const keyLineMatch = content.match(/\n\s+"ch[^\"]+"\s*:/);
    if (keyLineMatch) {
      content = content.slice(0, keyLineMatch.index);
    }

    if (!entries.has(key) || content.trim().length > entries.get(key).content.trim().length) {
      entries.set(key, { content, source: name });
    }
  }
}

const keys = Array.from(entries.keys());

function parseKey(k) {
  const m = k.match(/^ch(\d+)([a-z])?/i);
  if (!m) return { n: Number.MAX_SAFE_INTEGER, s: k };
  return { n: parseInt(m[1], 10), s: m[2] || '' };
}

keys.sort((a, b) => {
  const pa = parseKey(a);
  const pb = parseKey(b);
  if (pa.n !== pb.n) return pa.n - pb.n;
  if (pa.s !== pb.s) return pa.s.localeCompare(pb.s);
  return a.localeCompare(b);
});

const emptyKeys = keys.filter((k) => !entries.get(k).content.trim());

// Build new seerah file
let out = 'export const SEERAH_OF_PROPHET_MUHAMMAD_CHAPTERS: Record<string, string> = {\n';
for (const key of keys) {
  const content = entries.get(key).content;
  out += `  "${key}": \`${content}\`,\n`;
}
out += '};\n';

fs.writeFileSync(seerahPath, out, 'utf8');

function extractTitle(content, key) {
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('#')) {
      return t.replace(/^#+\s*/, '').trim();
    }
  }
  // fallback from key
  const slug = key.replace(/^ch\d+[a-z]?-/, '');
  return slug
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function escapeTsString(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

const chapterEntries = keys.map((key) => {
  const content = entries.get(key).content;
  const title = escapeTsString(extractTitle(content, key));
  return (
`      {\n` +
`        id: '${key}',\n` +
`        title: '${title}',\n` +
`        tags: ['Seerah'],\n` +
`        readingTime: 12,\n` +
`        text: t(SEERAH_OF_PROPHET_MUHAMMAD_CHAPTERS, '${key}'),\n` +
`      },`
  );
}).join('\n');

const contentText = fs.readFileSync(contentPath, 'utf8');
const seerahIndex = contentText.indexOf("id: 'seerah-of-prophet-muhammad'");
if (seerahIndex === -1) {
  throw new Error('Seerah section not found in content.ts');
}
const chaptersIndex = contentText.indexOf('chapters:', seerahIndex);
if (chaptersIndex === -1) {
  throw new Error('chapters: not found after seerah id');
}
const openBracket = contentText.indexOf('[', chaptersIndex);
if (openBracket === -1) {
  throw new Error('Opening [ for chapters not found');
}

// Find matching closing bracket
let depth = 0;
let inSingle = false;
let inDouble = false;
let escaped = false;
let closeBracket = -1;
for (let i = openBracket; i < contentText.length; i++) {
  const ch = contentText[i];
  if (escaped) {
    escaped = false;
    continue;
  }
  if (ch === '\\') {
    escaped = true;
    continue;
  }
  if (!inDouble && ch === "'") {
    inSingle = !inSingle;
    continue;
  }
  if (!inSingle && ch === '"') {
    inDouble = !inDouble;
    continue;
  }
  if (inSingle || inDouble) continue;
  if (ch === '[') depth++;
  if (ch === ']') {
    depth--;
    if (depth === 0) {
      closeBracket = i;
      break;
    }
  }
}
if (closeBracket === -1) {
  throw new Error('Closing ] for chapters not found');
}

const newContentText =
  contentText.slice(0, openBracket + 1) +
  '\n' + chapterEntries + '\n' +
  contentText.slice(closeBracket);

fs.writeFileSync(contentPath, newContentText, 'utf8');

console.log(`Seerah rebuild: chapters=${keys.length}, empty=${emptyKeys.length}`);
if (emptyKeys.length) {
  console.log('Empty chapters:', emptyKeys.join(', '));
}
if (warnings.length) {
  console.log('Warnings:', warnings.length);
}
