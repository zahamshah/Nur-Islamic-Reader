const fs=require('fs');
const text=fs.readFileSync('constants/chapters/great-women-of-islam.ts','utf8');
// parse entries
function parseEntries(text){
  const start=text.indexOf('{'); const end=text.lastIndexOf('}');
  const body=text.slice(start+1,end);
  const entries=[]; let idx=0;
  while(true){
    const keyStart=body.indexOf('"', idx); if(keyStart<0) break;
    const keyEnd=body.indexOf('"', keyStart+1); if(keyEnd<0) break;
    const key=body.slice(keyStart+1, keyEnd);
    const tickStart=body.indexOf('`', keyEnd); if(tickStart<0) break;
    let j=tickStart+1; while(j<body.length){ if(body[j]==='`' && body[j-1] !== '\\') break; j++; }
    const raw=body.slice(tickStart+1, j);
    entries.push({key, body: raw});
    idx=j+1;
  }
  return entries;
}

const entries=parseEntries(text);
for(const e of entries){
  if(!e.key.startsWith('ch0')) continue;
  const lines=e.body.split(/\r?\n/);
  const headingLevels=lines.filter(l=>/^#+\s+/.test(l)).map(l=>l.match(/^(#+)\s+/)[1].length);
  const unique=[...new Set(headingLevels)].sort();
  console.log(`${e.key}: headings=${unique.join(',')||'none'} (count ${headingLevels.length})`);
}
