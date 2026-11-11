// Analisa cada quadro: dimensões, alfa, restos de fundo ligados à borda e brancos internos (olhos).
const png=require('./png.cjs'),path=require('path'),fs=require('fs');
const dir=process.argv[2]||'c:/Users/gpjac/Ilha-do-Conhecimento/assets/personagem';
const names=[];for(const d of ['frente','ladoesq','ladodir','costas'])for(let i=1;i<=4;i++)names.push(`menina_${d}${i}.png`);
const light=(d,i)=>{const r=d[i],g=d[i+1],b=d[i+2];return Math.min(r,g,b)>=200&&Math.max(r,g,b)-Math.min(r,g,b)<=40;};
const out=[];
for(const n of names){
  const img=png.read(path.join(dir,n)),{w,h,data}=img;let transp=0,semi=0,opaque=0;
  for(let i=0;i<w*h;i++){const a=data[i*4+3];if(a===0)transp++;else if(a<255)semi++;else opaque++;}
  // Pixels claros opacos que tocam o exterior (borda ou área transparente) = provável resto de fundo.
  const ext=new Uint8Array(w*h),q=[];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(data[i*4+3]===0&&!ext[i]){ext[i]=1;q.push(i);}}
  const edgeLight=[];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(data[i*4+3]===0||!light(data,i*4))continue;
    const border=x===0||y===0||x===w-1||y===h-1;
    const nb=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{const X=x+dx,Y=y+dy;return X>=0&&Y>=0&&X<w&&Y<h&&data[(Y*w+X)*4+3]===0;});
    if(border||nb)edgeLight.push(`${x},${y}`);}
  // Brancos internos (cercados pelo contorno) — olhos e brilhos.
  let inner=0;for(let i=0;i<w*h;i++)if(data[i*4+3]===255&&light(data,i*4))inner++;
  inner-=edgeLight.length;
  const corners=[0,w-1,(h-1)*w,h*w-1].map(i=>data[i*4+3]);
  out.push(`${n} ${w}x${h} tipo=${img.type} transp=${transp} semi=${semi} opaco=${opaque} cantosAlfa=${corners} restosBorda=${edgeLight.length}${edgeLight.length?' ['+edgeLight.slice(0,12).join(' ')+']':''} brancosInternos=${inner}`);
}
fs.writeFileSync(path.join(__dirname,'analise.txt'),out.join('\n'));
