const fs = require('fs');
const path = require('path');

const inputPath = path.join('constants','chapters','seerah-of-prophet-muhammad.ts');
const contentPath = path.join('constants','content.ts');
const outputPath = inputPath;

const raw = fs.readFileSync(inputPath, 'utf8');

// Extract chapter entries from any existing exports
const entryRegex = /"([^"]+)"\s*:\s*`([\s\S]*?)`/g;
const chapters = new Map();
const duplicates = new Set();
let match;
while ((match = entryRegex.exec(raw)) !== null) {
  const key = match[1];
  const val = match[2];
  if (chapters.has(key)) duplicates.add(key);
  chapters.set(key, val);
}

// Get ordered IDs from content.ts
const contentRaw = fs.readFileSync(contentPath, 'utf8');
const order = [];
const orderRegex = /SEERAH_OF_PROPHET_MUHAMMAD_CHAPTERS,\s*'([^']+)'/g;
let m;
while ((m = orderRegex.exec(contentRaw)) !== null) {
  order.push(m[1]);
}

// Formatting helper (spacing only)
function format(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let lastNonEmptyIsList = false;

  function isHeading(line) {
    return /^#{1,3}\s+/.test(line);
  }
  function isRule(line) {
    return /^---+$/.test(line.trim());
  }
  function isBlockquote(line) {
    return /^>/.test(line.trim());
  }
  function isList(line) {
    return /^(\s*[-*]\s+|\s*\d+\.\s+)/.test(line);
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const blank = trimmed === '';
    const heading = isHeading(line);
    const rule = isRule(line);
    const blockquote = isBlockquote(line);
    const list = isList(line);

    if (heading || rule) {
      if (out.length > 0 && out[out.length - 1].trim() !== '') out.push('');
      out.push(line);
      if (i < lines.length - 1 && lines[i + 1].trim() !== '') out.push('');
      lastNonEmptyIsList = false;
      continue;
    }

    if (blockquote) {
      if (out.length > 0 && out[out.length - 1].trim() !== '') out.push('');
      out.push(line);
      if (i < lines.length - 1) {
        const next = lines[i + 1];
        if (next.trim() !== '' && !/^>/.test(next.trim())) out.push('');
      }
      lastNonEmptyIsList = false;
      continue;
    }

    if (list) {
      if (out.length > 0 && out[out.length - 1].trim() !== '' && !lastNonEmptyIsList) out.push('');
      out.push(line);
      lastNonEmptyIsList = true;
      continue;
    }

    if (blank) {
      if (out.length === 0 || out[out.length - 1].trim() === '') continue;
      out.push('');
      lastNonEmptyIsList = false;
      continue;
    }

    out.push(line);
    lastNonEmptyIsList = false;
  }

  while (out.length > 0 && out[out.length - 1].trim() === '') out.pop();
  return out.join('\n');
}

function escapeTemplate(str) {
  return str.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

const missing = [];
const orderedEntries = [];
for (const id of order) {
  if (!chapters.has(id)) {
    missing.push(id);
  } else {
    const formatted = format(chapters.get(id));
    orderedEntries.push([id, formatted]);
  }
}

// Include any extra chapters not referenced in content.ts (append)
const extras = [];
for (const [id, text] of chapters.entries()) {
  if (!order.includes(id)) {
    extras.push([id, format(text)]);
  }
}

let output = "export const SEERAH_OF_PROPHET_MUHAMMAD_CHAPTERS: Record<string, string> = {\n";
for (const [id, text] of orderedEntries) {
  output += `  \"${id}\": \`${escapeTemplate(text)}\`,\n`;
}
for (const [id, text] of extras) {
  output += `  \"${id}\": \`${escapeTemplate(text)}\`,\n`;
}
output += "};\n";

fs.writeFileSync(outputPath, output, 'utf8');

console.log(`found=${chapters.size}`);
console.log(`ordered=${orderedEntries.length}`);
console.log(`extras=${extras.length}`);
console.log(`missing=${missing.length}`);
if (missing.length) {
  console.log('missing_ids=' + missing.join(','));
}
if (duplicates.size) {
  console.log('duplicates=' + [...duplicates].join(','));
}
