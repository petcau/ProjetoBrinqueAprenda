// Ajusta a sequência longa de "A" (zeros da paleta) até todos os CRCs do PNG baterem.
const fs=require('fs'),path=require('path'),zlib=require('zlib');
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
const crc=b=>{let c=0xffffffff;for(const x of b)c=CRC[(c^x)&255]^(c>>>8);return (c^0xffffffff)>>>0;};
const src=fs.readFileSync(path.join(__dirname,'sheet.b64'),'utf8').replace(/\s+/g,'');
const m=[...src.matchAll(/A{100,}/g)].sort((a,b)=>b[0].length-a[0].length)[0];
const out=[`sequência de A: ${m[0].length} em ${m.index}`];
function check(b){
  let p=8,chunks=[];
  while(p+8<=b.length){const len=b.readUInt32BE(p),t=b.toString('ascii',p+4,p+8);if(p+12+len>b.length)return null;
    const ok=crc(b.subarray(p+4,p+8+len))===b.readUInt32BE(p+8+len);chunks.push({t,len,ok});p+=12+len;if(t==='IEND')break;}
  return chunks;
}
let fixed=null;
for(let k=1;k<=1500&&!fixed;k++){
  const s=src.slice(0,m.index)+'A'.repeat(k)+src.slice(m.index+m[0].length);
  const b=Buffer.from(s,'base64'),ch=check(b);
  if(ch&&ch.length>=4&&ch[1].t==='PLTE'&&ch[1].ok){out.push(`k=${k}: `+ch.map(c=>`${c.t}(${c.len},${c.ok?'ok':'CRC errado'})`).join(' '));if(ch.every(c=>c.ok)&&ch.at(-1).t==='IEND')fixed={k,b,s};}
}
if(fixed){
  fs.writeFileSync(path.join(__dirname,'sheet-original.png'),fixed.b);fs.writeFileSync(path.join(__dirname,'sheet.b64'),fixed.s);
  let idat=[],p=8;while(p<fixed.b.length){const len=fixed.b.readUInt32BE(p),t=fixed.b.toString('ascii',p+4,p+8);if(t==='IDAT')idat.push(fixed.b.subarray(p+8,p+8+len));p+=12+len;}
  try{out.push('inflado: '+zlib.inflateSync(Buffer.concat(idat)).length+' bytes (esperado 43232)');}catch(e){out.push('inflate falhou: '+e.message);}
} else out.push('sem reparo completo');
fs.writeFileSync(path.join(__dirname,'reparar.txt'),out.join('\n'));
