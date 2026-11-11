// Confere o relógio da caminhada: 60 ticks/s, 16 ticks por passo, 8 ticks por quadro (ciclo 0→1→2→3).
// Usa as constantes reais de js/config.js e o mesmo acumulador de island-game.js.
const fs=require('fs'),path=require('path'),vm=require('vm'),cp=require('child_process');
const root=path.join(__dirname,'..','..'),ctx={};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'js/config.js'),'utf8')+';this.C={TICK_HZ,TICKS_PER_TILE,TICKS_PER_FRAME,TURN_TICKS,STEP_TILE,HERO_SHEET};',ctx);
const C=ctx.C,TICK_MS=1000/C.TICK_HZ,out=[];
out.push(`config: ${C.TICK_HZ} ticks/s, ${C.TICKS_PER_TILE} ticks/passo, ${C.TICKS_PER_FRAME} ticks/quadro, virar ${C.TURN_TICKS} ticks`);
for(const hz of [30,60,75,120,144]) {
  let acc=0,ticks=0,last=0;const frames=[];let walk=0;
  for(let i=1;i<=hz*10;i++){const t=i*1000/hz,el=Math.min(t-last,100);last=t;acc+=el;
    while(acc>=TICK_MS-1e-6){ticks++;walk++;frames.push(Math.floor(walk/C.TICKS_PER_FRAME)%4);acc-=TICK_MS;}}
  out.push(`tela ${hz} Hz: ${ticks} ticks em 10 s = ${(ticks/10).toFixed(2)} ticks/s`);
}
// Sequência de um segundo andando (60 ticks): quadro mostrado em cada tick.
const seq=[];for(let w=1;w<=60;w++)seq.push(Math.floor(w/C.TICKS_PER_FRAME)%4);
out.push('1 s andando (60 ticks), quadro por tick: '+seq.join(''));
const changes=seq.filter((f,i)=>i&&f!==seq[i-1]).length;
out.push(`trocas de quadro em 1 s: ${changes} (60/${C.TICKS_PER_FRAME} = ${60/C.TICKS_PER_FRAME}); passos em 1 s: ${60/C.TICKS_PER_TILE}`);
out.push(`ciclo completo 0→1→2→3: ${4*C.TICKS_PER_FRAME} ticks = 2 passos`);
for(const f of fs.readdirSync(path.join(root,'js')).filter(f=>f.endsWith('.js'))){try{cp.execSync(`node --check "${path.join(root,'js',f)}"`,{stdio:'pipe'});}catch(e){out.push('ERRO '+f+': '+e.stderr);}}
out.push('sintaxe js/: verificada; folha existe: '+fs.existsSync(path.join(root,'assets',C.HERO_SHEET.src)));
fs.writeFileSync(path.join(__dirname,'verificar-60fps.txt'),out.join('\n'));
