const fs = require('fs');
const path = 'constants/chapters/great-women-of-islam.ts';
const text = fs.readFileSync(path, 'utf8');
const start = text.indexOf('{');
const end = text.lastIndexOf('}');
const body = text.slice(start + 1, end);
const entries = [];
let idx = 0;
while (true) {
  const keyStart = body.indexOf('"', idx);
  if (keyStart < 0) break;
  const keyEnd = body.indexOf('"', keyStart + 1);
  if (keyEnd < 0) break;
  const key = body.slice(keyStart + 1, keyEnd);
  const tickStart = body.indexOf('`', keyEnd);
  if (tickStart < 0) break;
  let j = tickStart + 1;
  while (j < body.length) {
    if (body[j] === '`' && body[j - 1] !== '\\') break;
    j++;
  }
  const raw = body.slice(tickStart + 1, j);
  entries.push({ key, body: raw });
  idx = j + 1;
}
for (const e of entries) {
  const lines = e.body.split(/\r?\n/);
  const title = (lines.find(l => l.trim().startsWith('# ')) || '').trim();
  const headingLines = lines.filter(l => /^#+\s+/.test(l.trim()));
  const levels = [...new Set(headingLines.map(l => l.match(/^(#+)\s+/)[1].length))].sort((a,b)=>a-b);
  const numbered = lines.filter(l => /^(?:\s*\d+[:.)\-]|\s*[IVXLC]+[.)])\s+/.test(l.trim()));
  const verseLines = lines.filter(l => /^>/.test(l.trim()) || /S\u016brah|Qur'|Qur?|\(19:\d|\(66:\d|\(3:\d|\(14:\d/.test(l));
  console.log(JSON.stringify({key:e.key, title, levels, headings: headingLines.length, numbered: numbered.slice(0,5), verseCount: verseLines.length}));
}
