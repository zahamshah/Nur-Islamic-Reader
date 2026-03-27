const fs = require('fs');
const path = require('path');

const currentPath = path.join(process.cwd(), 'constants', 'content.ts');
const backupPath = path.join(process.cwd(), '_tmp_seerah', 'constants', 'content.ts');

const current = fs.readFileSync(currentPath, 'utf8');
const backup = fs.readFileSync(backupPath, 'utf8');

function extractChaptersSection(src) {
  const idIdx = src.indexOf("id: 'seerah-of-prophet-muhammad'");
  if (idIdx === -1) throw new Error('Seerah id not found');
  const chaptersIdx = src.indexOf('chapters:', idIdx);
  if (chaptersIdx === -1) throw new Error('chapters not found');
  const open = src.indexOf('[', chaptersIdx);
  if (open === -1) throw new Error('opening [ not found');
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let escaped = false;
  let close = -1;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (!inDouble && ch === "'") { inSingle = !inSingle; continue; }
    if (!inSingle && ch === '"') { inDouble = !inDouble; continue; }
    if (inSingle || inDouble) continue;
    if (ch === '[') depth++;
    if (ch === ']') { depth--; if (depth === 0) { close = i; break; } }
  }
  if (close === -1) throw new Error('closing ] not found');
  return { open, close, body: src.slice(open + 1, close) };
}

const backupChapters = extractChaptersSection(backup);
const currentChapters = extractChaptersSection(current);

const newCurrent = current.slice(0, currentChapters.open + 1) + backupChapters.body + current.slice(currentChapters.close);

fs.writeFileSync(currentPath, newCurrent, 'utf8');
console.log('Seerah chapters restored from backup content.ts');
