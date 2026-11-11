// Decodifica a spritesheet do teste e confere cada um dos 16 quadros (48x56).
const fs=require('fs'),path=require('path'),png=require('./png.cjs');
const dest='c:/Users/gpjac/Ilha-do-Conhecimento/assets/personagem/menina-caminhada.png';
const buf=Buffer.from(fs.readFileSync(path.join(__dirname,'sheet.b64'),'utf8').replace(/\s+/g,''),'base64');
const tmp=path.join(__dirname,'sheet-original.png');fs.writeFileSync(tmp,buf);
const img=png.read(tmp),{w,h,data}=img,out=[`folha ${w}x${h} tipo=${img.type}`];
const FW=48,FH=56,rows=['baixo','esquerda','direita','cima'];
const light=i=>Math.min(data[i],data[i+1],data[i+2])>=200&&Math.max(data[i],data[i+1],data[i+2])-Math.min(data[i],data[i+1],data[i+2])<=45;
let problems=0;
for(let r=0;r<4;r++)for(let c=0;c<4;c++){
  let opaque=0,semi=0,edgeLight=0,innerLight=0,borderOpaque=0,minY=FH,maxY=-1,minX=FW,maxX=-1;
  for(let y=0;y<FH;y++)for(let x=0;x<FW;x++){
    const X=c*FW+x,Y=r*FH+y,i=(Y*w+X)*4,a=data[i+3];
    if(!a)continue;if(a<255)semi++;opaque++;
    minY=Math.min(minY,y);maxY=Math.max(maxY,y);minX=Math.min(minX,x);maxX=Math.max(maxX,x);
    if(x===0||y===0||x===FW-1||y===FH-1)borderOpaque++;
    if(!light(i))continue;
    const touches=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=FW||yy>=FH)return true;return data[((r*FH+yy)*w+c*FW+xx)*4+3]===0;});
    touches?edgeLight++:innerLight++;
  }
  if(edgeLight||borderOpaque||semi)problems++;
  out.push(`${rows[r]} quadro ${c}: opacos=${opaque} semi=${semi} bordaDoQuadro=${borderOpaque} clarosNoContorno=${edgeLight} clarosInternos(olhos/brilhos)=${innerLight} caixa=${minX}-${maxX} x ${minY}-${maxY}`);
}
out.push('quadros com problema: '+problems);
// Pinta uma prévia 4x sobre magenta para conferir restos de fundo e olhos.
const S=4,pv=png.blank(w*S,h*S);
for(let y=0;y<h*S;y++)for(let x=0;x<w*S;x++){const s=((y/S|0)*w+(x/S|0))*4,d=(y*w*S+x)*4,a=data[s+3]/255;
  const bg=[255,0,255];for(let k=0;k<3;k++)pv.data[d+k]=Math.round(data[s+k]*a+bg[k]*(1-a));pv.data[d+3]=255;}
png.write(path.join(__dirname,'previa.png'),pv);
if(!problems){fs.copyFileSync(tmp,dest);out.push('copiado para '+dest);}
fs.writeFileSync(path.join(__dirname,'sheet.txt'),out.join('\n'));
