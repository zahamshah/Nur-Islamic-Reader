const fs = require('fs');
const path = 'constants/chapters/great-women-of-islam.ts';
const text = fs.readFileSync(path, 'utf8');
const re = /"([^"]+)"\s*:\s*`([\s\S]*?)`,/g;
let m;
const items = [];
while ((m = re.exec(text))) {
  items.push({ key: m[1], content: m[2] });
}
if (items.length !== 10) {
  console.error('Expected 10 chapters, got', items.length);
  process.exit(1);
}

function reformat(raw) {
  let out = raw.replace(/\r\n/g, '\n');
  // Flatten to single line to remove broken wraps
  out = out.replace(/\s+/g, ' ').trim();

  // Normalize chapter headings
  out = out.replace(/#{2,3}\s*Chapter\s*\d+[:.\-–—]?\s*/gi, '## ');
  out = out.replace(/\bCh\s*\d+[:.\-–—]?\s*/gi, '## ');

  // Ensure headings and markers start on new lines
  out = out.replace(/\s*(#{1,6}\s+)/g, '\n$1');
  out = out.replace(/\s*(>\s+)/g, '\n$1');
  out = out.replace(/\s*(-\s+)/g, '\n$1');
  out = out.replace(/\s*(---)/g, '\n$1');

  // Normalize first heading to H1
  out = out.replace(/\n#{1,6}\s+([^\n]+)/, (m, title) => `\n# ${title}`);

  // Add blank lines after headings and blockquotes
  out = out.replace(/\n(#{1,6}[^\n]*)/g, '\n$1\n');
  out = out.replace(/\n(>[^\n]*)/g, '\n$1\n');

  // Normalize Sources heading
  out = out.replace(/\n#+\s*Sources\s*&\s*Notes/gi, '\n## Sources & Notes');

  // Collapse extra blank lines
  out = out.replace(/\n{3,}/g, '\n\n').trim();

  return out;
}

const bt = '`';
let output = 'export const GREAT_WOMEN_CHAPTERS: Record<string, string> = {\n';
for (const item of items) {
  const content = reformat(item.content);
  output += `  "${item.key}": ${bt}\n${content}\n${bt},\n`;
}
output += '};\n';
fs.writeFileSync(path, output, 'utf8');