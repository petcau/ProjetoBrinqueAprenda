// Mede quanto do PNG embutido decodifica e o tamanho do conteúdo dos 16 quadros do projeto.
const fs=require('fs'),path=require('path'),zlib=require('zlib'),png=require('./png.cjs');
const out=[],b=Buffer.from(fs.readFileSync(path.join(__dirname,'sheet.b64'),'utf8').replace(/\s+/g,''),'base64');
let p=8,idat=[];while(p<b.length){const len=b.readUInt32BE(p),t=b.toString('ascii',p+4,p+8);out.push(`chunk ${t} ${len} fim=${p+12+len}/${b.length}`);if(t==='IDAT')idat.push(b.subarray(p+8,p+8+len));p+=12+len;if(t==='IEND')break;}
try{const raw=zlib.inflateSync(Buffer.concat(idat),{finishFlush:zlib.constants.Z_SYNC_FLUSH});out.push(`inflado ${raw.length} de ${224*193}`);}catch(e){out.push('falha '+e.message);}
const dir=path.join(__dirname,'..','personagem');
for(const d of ['frente','ladoesq','ladodir','costas'])for(let k=1;k<=4;k++){
  const {w,h,data}=png.read(path.join(dir,`menina_${d}${k}.png`));let x0=w,x1=-1,y0=h,y1=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;const bg=data[i+3]===0||(data[i]>=245&&data[i+1]>=245&&data[i+2]>=245);if(!bg){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}}
  out.push(`${d}${k} ${w}x${h} conteudo ${x1-x0+1}x${y1-y0+1} em x${x0}-${x1} y${y0}-${y1}`);
}
fs.writeFileSync(path.join(__dirname,'diagnostico.txt'),out.join('\n'));
