const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const currentPath = path.join(cwd, 'constants', 'chapters', 'great-women-of-islam.ts');
const backupPath = path.join(cwd, '_tmp_seerah', 'constants', 'chapters', 'great-women-of-islam.ts');
const contentPath = path.join(cwd, 'constants', 'content.ts');

function extractWellFormed(src) {
  const map = new Map();
  const re = /"([^"]+)"\s*:\s*`([\s\S]*?)`/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    map.set(m[1], m[2]);
  }
  return map;
}

function lastUnescapedBacktickIndex(s) {
  for (let i = s.length - 1; i >= 0; i--) {
    if (s[i] === '`') {
      const prev = s[i - 1];
      if (prev !== '\\') return i;
    }
  }
  return -1;
}

function extractBroken(src) {
  const map = new Map();
  const keyRe = /^\s+"(ch[^\"]+)"\s*:/gm;
  const matches = [];
  let km;
  while ((km = keyRe.exec(src))) {
    matches.push({ key: km[1], index: km.index, after: keyRe.lastIndex });
  }
  for (let i = 0; i < matches.length; i++) {
    const { key, after } = matches[i];
    const startTick = src.indexOf('`', after);
    if (startTick === -1) continue;
    const nextIndex = i + 1 < matches.length ? matches[i + 1].index : src.length;
    const segment = src.slice(startTick + 1, nextIndex);
    const endTick = lastUnescapedBacktickIndex(segment);
    let content = endTick >= 0 ? segment.slice(0, endTick) : segment;
    const keyLineMatch = content.match(/\n\s+"ch[^\"]+"\s*:/);
    if (keyLineMatch) content = content.slice(0, keyLineMatch.index);
    map.set(key, content);
  }
  return map;
}

function getGreatWomenOrder(content) {
  const start = content.indexOf("id: 'women-sahabiyat'");
  if (start === -1) throw new Error('women-sahabiyat not found');
  const chaptersIdx = content.indexOf('chapters:', start);
  const open = content.indexOf('[', chaptersIdx);
  let depth = 0, inS = false, inD = false, esc = false, close = -1;
  for (let i = open; i < content.length; i++) {
    const ch = content[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (!inD && ch === "'") { inS = !inS; continue; }
    if (!inS && ch === '"') { inD = !inD; continue; }
    if (inS || inD) continue;
    if (ch === '[') depth++;
    if (ch === ']') { depth--; if (depth === 0) { close = i; break; } }
  }
  if (close === -1) throw new Error('chapters closing ] not found');
  const section = content.slice(open + 1, close);
  const ids = [];
  const re = /id:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(section))) ids.push(m[1]);
  return ids;
}

const currentRaw = fs.readFileSync(currentPath, 'utf8');
const backupRaw = fs.readFileSync(backupPath, 'utf8');
const contentRaw = fs.readFileSync(contentPath, 'utf8');

const backupMap = extractWellFormed(backupRaw);
const currentMap = extractBroken(currentRaw);
const order = getGreatWomenOrder(contentRaw);

// Map updated keys to canonical IDs
const overrides = {
  'ch01-khadijah-bint-khuwaylid-the-foundation': 'ch08-khadijah-the-first-home-of-faith',
  'ch02-sumayyah-bint-khayyat-the-first-blood': 'ch18-sumayyah-the-first-price-of-steadfastness',
  'ch03-fatimah-bint-muhammad-the-lineage': 'ch09-fatimah-light-in-a-small-home',
  'ch04-aishah-bint-abi-bakr-the-sovereign-mind': 'ch10-aishah-the-home-that-taught-the-ummah',
  'ch05-asma-bint-abi-bakr-dhat-al-nitaqayn': 'ch14-asma-the-two-belts-of-service',
  'ch06-umm-salamah-the-strategist': 'ch11-umm-salamah-wisdom-in-the-storm',
  'ch07-nusaybah-bint-kab-the-shield-of-uhud': 'ch15-umm-ammarah-courage-at-uhud',
  'ch08-hafsah-bint-umar-custodian-of-the-codex': 'ch12-hafsah-stewardship-and-seriousness',
};

const finalMap = new Map();
for (const id of order) {
  if (backupMap.has(id)) finalMap.set(id, backupMap.get(id));
}

for (const [from, to] of Object.entries(overrides)) {
  if (currentMap.has(from) && currentMap.get(from).trim()) {
    const content = currentMap.get(from);
    if (!content.includes('export const')) {
      finalMap.set(to, content);
    }
  }
}

let out = 'export const GREAT_WOMEN_CHAPTERS: Record<string, string> = {\n';
for (const id of order) {
  const content = finalMap.get(id) ?? '';
  out += `  "${id}": \`${content}\`,\n`;
}
out += '};\n';

fs.writeFileSync(currentPath, out, 'utf8');
console.log(`Great Women rebuilt (safe). Chapters: ${order.length}`);
