// Gera assets/personagem/menina-caminhada-8.png: 10 colunas × 4 linhas de 48×56.
// Colunas 0–7 = ciclo de caminhada fluido (4 quadros por passo); 8–9 = respiração parada.
// Os quadros novos reaproveitam a arte original: só o tronco (acima de HIP) sobe ou desce 1 px;
// os pés ficam no pivô (24,52). Nada é esticado nem redimensionado.
const fs=require('fs'),path=require('path'),png=require('./png.cjs');
const base=path.join(__dirname,'..','personagem');
const src=png.read(path.join(base,'menina-caminhada.png')),FW=48,FH=56,COLS=10;
const HIP=44; // linhas 0..44 = cabeça e tronco; abaixo disso, pernas e pés
// [coluna da folha original, deslocamento do tronco]: + desce (apoio), − sobe (passagem).
const CYCLE=[[1,0],[1,1],[2,0],[2,-1],[3,0],[3,1],[0,0],[0,-1]];
const IDLE=[[0,0],[0,1]];
const get=(c,r,x,y)=>{const i=((r*FH+y)*src.w+c*FW+x)*4;return src.data.subarray(i,i+4);};
const out=png.blank(FW*COLS,FH*4);
const put=(c,r,x,y,p)=>p.copy?p.copy(out.data,((r*FH+y)*out.w+c*FW+x)*4):null;
function frame(dc,r,[sc,dy]) {
  for(let y=0;y<FH;y++)for(let x=0;x<FW;x++)put(dc,r,x,y,Buffer.from(get(sc,r,x,y)));
  if(!dy)return;
  if(dy>0) {
    // Desce 1 px: cada linha do tronco vai para baixo; na emenda, só sobrepõe pixels opacos.
    for(let y=HIP+1;y>=1;y--)for(let x=0;x<FW;x++){
      const p=Buffer.from(get(sc,r,x,y-1));
      if(y===HIP+1&&!p[3])continue;
      put(dc,r,x,y,p);
    }
    for(let x=0;x<FW;x++)put(dc,r,x,0,Buffer.alloc(4));
  } else {
    // Sobe 1 px: a linha da cintura se repete, sem abrir buraco entre tronco e pernas.
    for(let y=0;y<HIP;y++)for(let x=0;x<FW;x++)put(dc,r,x,y,Buffer.from(get(sc,r,x,y+1)));
  }
}
for(let r=0;r<4;r++){CYCLE.forEach((f,i)=>frame(i,r,f));IDLE.forEach((f,i)=>frame(8+i,r,f));}
png.write(path.join(base,'menina-caminhada-8.png'),out);
// Prévia 4× sobre magenta para conferência visual.
const S=4,pv=png.blank(out.w*S,out.h*S);
for(let y=0;y<pv.h;y++)for(let x=0;x<pv.w;x++){const s=((y/S|0)*out.w+(x/S|0))*4,d=(y*pv.w+x)*4,a=out.data[s+3]/255,bg=(x/S|0)%FW===0||(y/S|0)%FH===0?[40,40,40]:[255,0,255];
  for(let k=0;k<3;k++)pv.data[d+k]=Math.round(out.data[s+k]*a+bg[k]*(1-a));pv.data[d+3]=255;}
png.write(path.join(__dirname,'previa-ciclo-8.png'),pv);
