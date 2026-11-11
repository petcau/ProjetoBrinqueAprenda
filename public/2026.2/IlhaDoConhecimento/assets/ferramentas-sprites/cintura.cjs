// Descobre, por direção, a primeira linha em que parado e passo diferem (início das pernas).
const fs=require('fs'),path=require('path'),png=require('./png.cjs');
const img=png.read(path.join(__dirname,'..','personagem','menina-caminhada.png')),FW=48,FH=56,out=[];
const px=(c,r,x,y)=>img.data.readUInt32BE(((r*FH+y)*img.w+c*FW+x)*4);
for(let r=0;r<4;r++){
  const diffs=[];
  for(const c of [1,2,3]){let first=-1;for(let y=0;y<FH&&first<0;y++)for(let x=0;x<FW;x++)if(px(0,r,x,y)!==px(c,r,x,y)){first=y;break;}diffs.push(first);}
  // Linha de cada quadro com pixels mais baixos (pés).
  const feet=[0,1,2,3].map(c=>{for(let y=FH-1;y>=0;y--)for(let x=0;x<FW;x++)if(img.data[((r*FH+y)*img.w+c*FW+x)*4+3])return y;return -1;});
  out.push(`linha ${r}: primeira diferença de 0 para 1,2,3 = ${diffs.join(',')} | pés = ${feet.join(',')}`);
}
fs.writeFileSync(path.join(__dirname,'cintura.txt'),out.join('\n'));
