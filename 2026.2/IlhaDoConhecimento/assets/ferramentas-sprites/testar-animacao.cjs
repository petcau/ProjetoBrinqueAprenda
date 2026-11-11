// Teste da animação completa: (1) os 40 quadros da folha; (2) a sequência de quadros a 60 ticks/s.
const fs=require('fs'),path=require('path'),vm=require('vm'),cp=require('child_process'),png=require('./png.cjs');
const root=path.join(__dirname,'..','..'),out=[];let fails=0;
const ok=(cond,msg)=>{out.push((cond?'OK   ':'FALHA ')+msg);if(!cond)fails++;};

// ---------- 1. Folha ----------
const sheet=png.read(path.join(root,'assets/personagem/menina-caminhada-8.png'));
const src=png.read(path.join(root,'assets/personagem/menina-caminhada.png'));
const FW=48,FH=56,CYCLE=[1,1,2,2,3,3,0,0,0,0]; // coluna original de cada coluna nova
ok(sheet.w===480&&sheet.h===224,`folha ${sheet.w}x${sheet.h} (esperado 480x224 = 10×4 quadros)`);
const light=(d,i)=>Math.min(d[i],d[i+1],d[i+2])>=200&&Math.max(d[i],d[i+1],d[i+2])-Math.min(d[i],d[i+1],d[i+2])<=45;
function stats(img,c,r){
  const a=(x,y)=>img.data[((r*FH+y)*img.w+c*FW+x)*4+3],s={opaque:0,semi:0,border:0,edgeLight:0,innerLight:0,holes:0,feet:-1};
  const outside=new Uint8Array(FW*FH),q=[];
  for(let y=0;y<FH;y++)for(let x=0;x<FW;x++)if((x===0||y===0||x===FW-1||y===FH-1)&&!a(x,y)){outside[y*FW+x]=1;q.push([x,y]);}
  while(q.length){const [x,y]=q.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=FW||Y>=FH||outside[Y*FW+X]||a(X,Y))continue;outside[Y*FW+X]=1;q.push([X,Y]);}}
  for(let y=0;y<FH;y++)for(let x=0;x<FW;x++){const v=a(x,y),i=((r*FH+y)*img.w+c*FW+x)*4;
    if(!v){if(!outside[y*FW+x])s.holes++;continue;}
    s.opaque++;if(v<255)s.semi++;if(x===0||y===0||x===FW-1||y===FH-1)s.border++;s.feet=Math.max(s.feet,y);
    if(light(img.data,i)){const touch=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{const X=x+dx,Y=y+dy;return X<0||Y<0||X>=FW||Y>=FH||outside[Y*FW+X];});touch?s.edgeLight++:s.innerLight++;}}
  return s;
}
const rows=['baixo','esquerda','direita','cima'];
for(let r=0;r<4;r++)for(let c=0;c<10;c++){
  const s=stats(sheet,c,r),o=stats(src,CYCLE[c],r);
  // Subir/descer o tronco 1 px repete ou cobre só a linha da cintura (y 44–45): essa é a variação permitida.
  let waist=0;for(const y of [44,45])for(let x=0;x<FW;x++)if(src.data[((r*FH+y)*src.w+CYCLE[c]*FW+x)*4+3])waist++;
  ok(!s.semi&&!s.border&&!s.edgeLight&&s.holes===o.holes&&s.feet===o.feet&&s.innerLight===o.innerLight&&Math.abs(s.opaque-o.opaque)<=waist,
    `${rows[r]} col ${c}: sem fundo (borda ${s.border}, claros no contorno ${s.edgeLight}, semi ${s.semi}), buracos ${s.holes}=${o.holes}, pés y${s.feet}=${o.feet}, olhos/brilhos ${s.innerLight}=${o.innerLight}, opacos ${s.opaque}~${o.opaque} (±${waist})`);
}

// ---------- 2. Animação com os arquivos reais ----------
const ctx={window:{}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'js/config.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'js/hero-animation.js'),'utf8')+
  ';this.C={TICK_HZ,TICKS_PER_TILE,TICKS_PER_FRAME,IDLE_BREATH_TICKS,TURN_TICKS};',ctx);
const H=ctx.window.HeroAnimation,C=ctx.C;
// Mesma ordem do tick de island-game.js: avança, calcula o quadro, fecha o passo.
function simulate(ticks,{dur=C.TICKS_PER_TILE,calm=false,mode='walk'}={}){
  const p={moving:false,prog:0,dur,steps:0,walk:0,idle:0},seq=[];
  for(let t=0;t<ticks;t++){
    if(mode==='walk'){if(!p.moving)Object.assign(p,{moving:true,prog:0,dur});p.prog++;p.walk=0;}
    else if(mode==='bump')p.walk++;
    else p.idle++;
    seq.push(H.column(p,calm));
    if(p.moving&&p.prog>=p.dur){p.moving=false;p.prog=0;p.steps++;}
  }
  return seq;
}
const runs=s=>s.reduce((a,v,i)=>(i&&v===s[i-1]?a[a.length-1].n++:a.push({v,n:1}),a),[]);
const walk=simulate(60);
out.push('1 s andando, normal (coluna por tick): '+walk.join(','));
const r=runs(walk);
ok(r.every(x=>x.n===C.TICKS_PER_FRAME),`normal: cada quadro fica ${C.TICKS_PER_FRAME} ticks (${[...new Set(r.map(x=>x.n))].join('/')})`);
ok(r.length===60/C.TICKS_PER_FRAME,`normal: ${r.length} trocas de quadro em 1 s (esperado ${60/C.TICKS_PER_FRAME})`);
ok(JSON.stringify(walk.slice(0,32).filter((v,i)=>i%4===0))==='[0,1,2,3,4,5,6,7]',`ciclo completo 0→7 em 32 ticks = 2 passos`);
for(const [label,factor] of [['devagar',.7],['rápido',1.3]]){
  const dur=Math.round(C.TICKS_PER_TILE/factor),s=simulate(dur*2,{dur}),cols=[...new Set(s)];
  ok(cols.length===8,`${label}: passo de ${dur} ticks mostra os 8 quadros (${runs(s).map(x=>x.v+'×'+x.n).join(' ')})`);
}
const calm=[...new Set(simulate(64,{calm:true}))];
ok(calm.every(c=>c%2===0),`menos animações: só quadros principais (${calm.join(',')})`);
const bump=runs(simulate(64,{mode:'bump'}));
ok(bump.every(x=>x.n===C.TICKS_PER_FRAME)&&new Set(bump.map(x=>x.v)).size===8,`encostada na parede: anda no lugar com os 8 quadros`);
const idle=runs(simulate(C.IDLE_BREATH_TICKS*4,{mode:'idle'}));
ok(idle.every(x=>(x.v===8||x.v===9)),`parada: respiração alterna colunas 8 e 9 (${idle.map(x=>x.v+'×'+x.n).join(' ')})`);
ok(H.column({moving:false,walk:0,idle:500},true)===8,'parada com menos animações: coluna 8 fixa');

// ---------- 3. Integração ----------
const game=fs.readFileSync(path.join(root,'js/island-game.js'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
ok(/HeroAnimation\.column\(p,calmMotion\(\)\)/.test(game),'island-game.js usa HeroAnimation.column a cada tick');
ok(html.indexOf('js/hero-animation.js')>0&&html.indexOf('js/hero-animation.js')<html.indexOf('js/island-game.js'),'index.html carrega hero-animation.js antes do jogo');
for(const f of fs.readdirSync(path.join(root,'js')).filter(f=>f.endsWith('.js'))){try{cp.execSync(`node --check "${path.join(root,'js',f)}"`,{stdio:'pipe'});}catch(e){ok(false,'sintaxe '+f+': '+e.stderr);}}
out.push(`\n${fails?fails+' FALHA(S)':'TUDO OK'}`);
fs.writeFileSync(path.join(__dirname,'testar-animacao.txt'),out.join('\n'));
