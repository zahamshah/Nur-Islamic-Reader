const fs=require('fs');
const projPath='constants/chapters/great-women-of-islam.ts';
const deskPath='C:/Users/LENOVO/Desktop/great-women-of-islam.ts';
const proj=fs.readFileSync(projPath,'utf8');
const desk=fs.readFileSync(deskPath,'utf8');

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

function extractSegment(startMarker, endMarker){
  const s=desk.indexOf(startMarker);
  if(s<0) return null;
  const e=endMarker? desk.indexOf(endMarker, s+startMarker.length) : -1;
  const end = e>=0? e : desk.length;
  let seg=desk.slice(s, end);
  const btStart=seg.indexOf('`');
  if(btStart>=0) seg=seg.slice(btStart+1);
  const btEnd=seg.lastIndexOf('`');
  if(btEnd>=0) seg=seg.slice(0, btEnd);
  seg=seg.replace(/^\s+/, '');
  const srcIdx=seg.indexOf('## Sources & Notes');
  if(srcIdx>=0) seg=seg.slice(0, srcIdx).trimEnd();

  let lines=seg.split(/\r?\n/);
  while(lines.length && lines[0].trim()==='') lines.shift();
  if(lines.length){
    lines.shift();
    while(lines.length && lines[0].trim()==='') lines.shift();
  }
  if(lines.length && /^#{1,6}\s*Chapter\b/i.test(lines[0].trim())){
    lines.shift();
    while(lines.length && lines[0].trim()==='') lines.shift();
  }
  return lines.join('\n').trim();
}

const desktopMap=[
  {key:'ch01-hajar-the-matriarch-of-the-desert', start:'"hajar_ch01_exile"', end:'Ch02:'},
  {key:'ch02-asiyah-the-queen-of-tyranny', start:'Ch02:', end:'"ch03:'},
  {key:'ch03-maryam-the-miracle-of-devotion', start:'"ch03: Maryam', end:'"ch04"'},
  {key:'ch04-khadijah-the-syndicate-queen', start:'"ch04"', end:'"ch05-sumayyah'},
  {key:'ch05-sumayyah-the-first-blood', start:'"ch05-sumayyah', end:'"ch06-fatimah'},
  {key:'ch06-fatimah-bint-al-khattab-the-catalyst-of-iron', start:'"ch06-fatimah', end:'"ch07-aishah'},
  {key:'ch07-aishah-the-scholar-of-the-ummah', start:'"ch07-aishah', end:'"ch08-fatimah-az-zahra'},
  {key:'ch08-fatimah-az-zahra-leader-of-the-women-of-paradise', start:'"ch08-fatimah-az-zahra', end:'"ch09-nasibah'},
  {key:'ch09-nasibah-bint-kab-the-shield-of-uhud', start:'"ch09-nasibah', end:null},
];

const deskLenByKey={};
for(const d of desktopMap){
  const seg=extractSegment(d.start, d.end);
  deskLenByKey[d.key]=seg? seg.length : null;
}

const entries=parseEntries(proj);
for(const e of entries){
  if(!e.key.startsWith('ch0')) continue;
  const projLen = e.body.replace(/## Sources & Notes[\s\S]*$/, '').trim().length;
  const deskLen = deskLenByKey[e.key] ?? null;
  console.log(`${e.key}\tprojBody=${projLen}\tdeskBody=${deskLen ?? 'NA'}\tdelta=${deskLen!=null? (projLen-deskLen) : 'NA'}`);
}
