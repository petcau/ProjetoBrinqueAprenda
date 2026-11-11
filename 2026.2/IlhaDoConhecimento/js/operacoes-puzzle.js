/* Moinho Encantado — três fases e coleta final. Tipos são estratégias independentes. */
window.OperacoesPuzzle = (() => {
  'use strict';
  const art={},names=['fundo_fazenda','saco_trigo','saco_farinha','slot','placa_pedido','etiqueta','carrinho','carroca_vermelha','carroca_azul','carroca_verde','engrenagem','lanterna_apagada','velas_frames'];
  let ready,data,layout,zones,lit,glow,current,strip=true;
  const ASSENTA_S=.6; // Segurar o resultado correto, sem arrastar, antes de concluir.
  const target=f=>f.tipo==='dobro'?2*f.moinho:f.tipo==='metadeMais'?f.carrinhoTem/2+f.mais:f.sacos/f.carrocas;
  const types={
    dobro:{zone:'plataforma',initial:f=>f.moinho,supply:f=>f.mesa+f.carrinho,win:(f,n)=>n===target(f)},
    metadeMais:{zone:'carrinho',initial:f=>f.carrinhoTem,supply:()=>0,win:(f,n)=>n===target(f)},
    divisao:{containers:f=>['vermelha','azul','verde'].slice(0,f.carrocas),initial:()=>0,supply:f=>f.sacos,win:(f,n,count,containers)=>{
      if(n!==f.sacos||count('mesa')!==0)return false;for(let i=0;i<containers.length;i++)if(count(containers[i])!==f.sacos/f.carrocas)return false;return true;
    }}
  };
  function prepare(input,positions) {
    return ready ||= (async()=>{
      data=input;layout=positions;zones=OperacoesLayout.build(layout);
      // Apoios adicionais autorizados: preservam todos os pontos e a calibração originais.
      const m=layout.mesa_suprimento;
      for(let i=0;i<3;i++)zones.mesa.cells.push({x:m.x+(i+1)*m.w/4,y:m.y+125});
      for(let i=1;i<=2;i++){const p=zones.carrinho.cells[i];zones.carrinho.cells.push({x:p.x,y:p.y-25});}
      for(const i of [0,3,5,6]){const p=zones.carrinho.cells[i];zones.carrinho.cells.push({x:p.x,y:p.y-25});}
      await Promise.all(names.map(name=>new Promise(resolve=>{const img=new Image();img.onload=()=>{art[name]=img;resolve();};img.onerror=()=>{console.warn(`[Operações] Ausente: ${name}.png; usando placeholder.`);resolve();};img.src=`assets/puzzles/operacoes/${name}.png`;})));
      await new Promise(resolve=>{const img=new Image();img.onload=()=>{art.chave=img;resolve();};img.onerror=()=>{console.warn('[Operações] Chave ausente; usando placeholder.');resolve();};img.src='assets/hud/chave_operacoes.png';});
      await Promise.all([['ajudaNormal','assets/tutorial/botao-ajuda-normal.webp'],['ajudaPressionado','assets/tutorial/botao-ajuda-pressionado.webp'],['btnGear','assets/hud/configuracoes.png']].map(([k,src])=>new Promise(resolve=>{const img=new Image();img.onload=()=>{art[k]=img;resolve();};img.onerror=()=>resolve();img.src=src;})));
      const sails=art.velas_frames;
      if(sails){strip=sails.naturalWidth===3584&&sails.naturalHeight===224;const grid=sails.naturalWidth===896&&sails.naturalHeight===896;
        console.info(`[Operações] Velas: ${sails.naturalWidth}×${sails.naturalHeight}, ${strip?'tira horizontal':grid?'grade 4×4':'formato inválido; placeholder'}.`);if(!strip&&!grid)art.velas_frames=null;}
      for(const [id,index,x,y] of [['carrinho',0,636,389],['carrinho',1,676,376],['vermelha',0,492,376],['vermelha',1,515,364],['azul',0,697,376]]) {
        const p=zones[id].cells[index],ok=Math.abs(p.x-x)<=2&&Math.abs(p.y-y)<=2;
        console.info(`[Operações] Calibração ${id}[${index}]: ${ok?'OK':'DIVERGE'} (${p.x.toFixed(2)}, ${p.y.toFixed(2)}).`);
      }
      lit=document.createElement('canvas');lit.width=69;lit.height=99;const c=lit.getContext('2d');
      if(art.lanterna_apagada)c.drawImage(art.lanterna_apagada,0,0,69,99);else{c.fillStyle='#8b6739';c.fillRect(15,10,39,80);}
      c.globalCompositeOperation='source-atop';c.fillStyle='#ffc35799';c.fillRect(0,0,69,99);c.globalCompositeOperation='source-over';
      const warm=c.createRadialGradient(34,53,0,34,53,19);warm.addColorStop(0,'#fff6be');warm.addColorStop(1,'#ffd56a00');c.fillStyle=warm;c.fillRect(10,25,48,52);
      glow=document.createElement('canvas');glow.width=glow.height=96;const g=glow.getContext('2d'),radial=g.createRadialGradient(48,48,0,48,48,48);
      radial.addColorStop(0,'#ffd168aa');radial.addColorStop(1,'#ffd16800');g.fillStyle=radial;g.fillRect(0,0,96,96);
    })();
  }
  function open(options) {
    if(current)current(false);
    const host=document.createElement('div'),frame=document.createElement('div'),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
    host.style.cssText='position:fixed;inset:0;z-index:1000;background:#171c20;display:flex;justify-content:center;';frame.style.cssText='position:relative;height:100%;';
    canvas.style.cssText='display:block;width:100%;height:100%;touch-action:none;';canvas.tabIndex=0;host.setAttribute('role','dialog');host.setAttribute('aria-modal','true');host.setAttribute('aria-label','O Moinho Encantado');
    const exit=document.createElement('button'),restart=document.createElement('button'),takeKey=document.createElement('button'),help=document.createElement('button'),settings=document.createElement('button'),controls=[exit,restart,takeKey,help,settings];
    let helpPressed=false,paused=false;
    const rects=[{x:950,y:16,w:54,h:48},{x:884,y:16,w:54,h:48},{x:482,y:209,w:76,h:92},{x:818,y:16,w:54,h:48},{x:752,y:16,w:54,h:48}];
    const labels=['Sair do moinho','Reiniciar fase','Pegar a Chave de Operações','Ajuda: como jogar','Configurações'];
    for(let i=0;i<controls.length;i++){const b=controls[i];b.type='button';b.textContent=labels[i];b.setAttribute('aria-label',labels[i]);b.title=labels[i];b.style.cssText='position:absolute;background:transparent;color:transparent;font-size:0;padding:0;overflow:hidden;border:0;border-radius:10px;cursor:pointer;';frame.appendChild(b);}
    const status=document.createElement('p');status.setAttribute('aria-live','polite');status.style.cssText='position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);';frame.appendChild(status);
    frame.prepend(canvas);host.appendChild(frame);document.body.appendChild(host);
    const font=getComputedStyle(document.body).fontFamily||'sans-serif',calm=window.matchMedia('(prefers-reduced-motion: reduce)').matches||Boolean(window.GameSettings?.calm);
    const capacity=zones.mesa.cells.length+zones.carrinho.cells.length+zones.plataforma.cells.length;
    const bags=Array.from({length:capacity},()=>({x:0,y:0,h:38,tx:0,ty:0,th:38,fx:0,fy:0,fh:38,t:1,duration:.18,zone:'mesa',origin:'mesa',cell:0,fixed:false,pop:0}));
    const occupied={},order=new Uint8Array(capacity),particles=new Float32Array(32*5),lamps=new Float32Array(3),hops=new Float32Array(3),pointer={x:0,y:0};
    for(const id in zones)occupied[id]=new Int8Array(zones[id].cells.length).fill(-1);
    let phase=0,f,type,containers,bagCount=0,drag=-1,pointerId=-1,s=1,offset=0,state='JOGANDO',elapsed=0,last=0,raf=0,closed=false,completed=0,angle=0,speed=0,message='',messageTime=0,shake=0,cartX=0,cartY=0,sparked=0,claimed=false,keyX=518,keyY=200;
    let item='saco_trigo',dragZone='',dragCell=0,downX=0,downY=0,clock=0,condition=false,result='ok',goal=0,settled=0;
    const ease=t=>1-(1-t)**3;
    function say(text){status.textContent=text;}
    function openSettings(){if(paused)return;paused=true;if(drag>=0){seat(drag,dragZone,dragCell);drag=-1;releaseCapture();}if(window.openSettings)window.openSettings(settings,()=>{paused=false;settings.focus();});else if(window.SettingsBook){window.SettingsBook.open('index');document.getElementById('book-dialog')?.showModal();}}
    function change(next){state=next;elapsed=0;restart.disabled=next!=='JOGANDO';help.disabled=next!=='JOGANDO';takeKey.hidden=next!=='CHAVE';exit.disabled=claimed;}
    function resize() {
      const w=Math.min(window.innerWidth,window.innerHeight*1024/572),dpr=Math.min(2,window.devicePixelRatio||1);frame.style.width=`${w}px`;
      canvas.width=Math.round(w*dpr);canvas.height=Math.round(window.innerHeight*dpr);s=canvas.width/1024;offset=(canvas.height-572*s)/2;
      for(let i=0;i<controls.length;i++){const b=controls[i],r=rects[i];b.style.left=`${r.x*w/1024}px`;b.style.top=`${(offset/s+r.y)*w/1024}px`;b.style.width=`${r.w*w/1024}px`;b.style.height=`${r.h*w/1024}px`;}
    }
    function animate(b,x,y,h,duration=.18){b.fx=b.x;b.fy=b.y;b.fh=b.h;b.tx=x;b.ty=y;b.th=h;b.t=0;b.duration=calm?0:duration;}
    function counts(id){let n=0;for(let i=0;i<occupied[id].length;i++)if(occupied[id][i]>=0)n++;return n;}
    function seat(index,id,cell,instant=false) {
      const b=bags[index],z=zones[id],p=z.cells[cell];b.zone=id;b.cell=cell;occupied[id][cell]=index;
      animate(b,p.x,p.y,z.size);b.pop=instant?0:.18;if(instant){b.x=p.x;b.y=p.y;b.h=z.size;b.t=1;}
    }
    function table(index){seat(index,'mesa',occupied.mesa.indexOf(-1));}
    function restore(index){const id=bags[index].origin;seat(index,id,occupied[id].indexOf(-1));}
    function selfTest(){
      // Testes puros dos dados: nenhuma alteração no jogo nem dependência de renderização.
      const a=data.fases[0],b=data.fases[1],c=data.fases[2];
      const needed=target(a)-a.moinho,needsBoth=a.mesa<needed&&a.carrinho<needed;
      const checks=[a.mesa+a.carrinho>=needed&&needsBoth&&target(a)<=zones.plataforma.cells.length,
        b.carrinhoTem%2===0&&target(b)<b.carrinhoTem&&b.carrinhoTem<=zones.carrinho.cells.length,
        c.sacos%c.carrocas===0&&c.carrocas<=3&&c.sacos/c.carrocas<=zones.vermelha.cells.length&&c.sacos<=zones.mesa.cells.length];
      for(let i=0;i<checks.length;i++)console.info(`[Operações] Autoteste fase ${i+1}: ${checks[i]?'PASSOU':'FALHOU'}`);
      if(!needsBoth)console.info('[Operações] Fase 1: os dados permitem completar com uma fonte só; o teste exige duas fontes.');
    }
    function setup() {
      for(const id in occupied)occupied[id].fill(-1);f=data.fases[phase];type=types[f.tipo];drag=-1;pointerId=-1;particles.fill(0);hops.fill(0);sparked=0;shake=0;cartX=cartY=0;messageTime=0;
      if(!type)throw Error(`Tipo de fase não registrado: ${f.tipo}`);containers=type.containers?type.containers(f):[type.zone];
      bagCount=type.initial(f)+type.supply(f);
      for(let i=0;i<bagCount;i++){const b=bags[i],initial=type.initial(f);let id=i<initial?type.zone:'mesa',cell=i<initial?i:i-initial;
        if(f.tipo==='dobro'&&i>=initial+f.mesa){id='carrinho';cell=i-initial-f.mesa;}
        order[i]=i;b.fixed=f.tipo==='dobro'&&i<initial;b.origin=id;seat(i,id,cell,true);}
      item=f.tipo==='divisao'?'saco_farinha':'saco_trigo';change('JOGANDO');condition=false;result='ok';goal=target(f);settled=0;
      say(`Fase ${phase+1} de 3. ${f.tipo==='dobro'?`O moinho precisa do DOBRO. No moinho: ${f.moinho}. Mesa: ${f.mesa}. Carrinho: ${f.carrinho}.`:f.tipo==='metadeMais'?`Deixe a METADE e mais ${f.mais}. Tem: ${f.carrinhoTem}.`:`Reparta ${f.sacos} sacos igualmente em ${f.carrocas} carroças.`}`);
      canvas.setAttribute('aria-label',`Moinho. ${status.textContent} Arraste os sacos. Escape sai. F3: depuração.`);
    }
    function success() {
      completed=phase+1;messageTime=0;change('SUCESSO');say('Muito bem!');
      if(f.tipo==='dobro')for(let i=0;i<32;i++){const k=i*5;particles[k]=518+(Math.random()-.5)*24;particles[k+1]=200-Math.random()*100;particles[k+2]=(Math.random()-.5)*16;particles[k+3]=85+Math.random()*35;particles[k+4]=1.5;}
    }
    function validate() {
      let n=0;for(let i=0;i<containers.length;i++)n+=counts(containers[i]);condition=drag<0&&type.win(f,n,counts,containers);result='ok';
      if(f.tipo==='dobro'&&n>goal)result='passou';
      else if(f.tipo==='metadeMais'&&n<goal)result='faltou';
      else if(f.tipo==='divisao'&&counts('mesa')>0){let equal=true;for(let i=1;i<containers.length;i++)if(counts(containers[i])!==counts(containers[0]))equal=false;if(equal&&n>0)result='sobras';}
      if(!condition)settled=0;
      if(state!=='JOGANDO'||drag>=0)return;if(condition){if(f.tipo==='divisao')success();return;}
      if(messageTime<=0&&result!=='ok'){message=result==='passou'?'Ops! Passou do dobro.':result==='faltou'?'Ops! Faltou saco no carrinho.':'Use todos os sacos!';messageTime=2;shake=result==='faltou'?.25:0;say(message);}
      else if(f.tipo==='divisao'&&n===f.sacos&&messageTime<=0){message='Ainda não está igual!';messageTime=1.5;say(message);}
    }
    function project(event) {
      const r=canvas.getBoundingClientRect();
      // Ponteiro → pixels do Canvas → design; y desconta a centralização vertical.
      pointer.x=((event.clientX-r.left)*canvas.width/r.width)/s;pointer.y=(((event.clientY-r.top)*canvas.height/r.height)-offset)/s;
    }
    function releaseCapture(){const id=pointerId;pointerId=-1;if(id>=0&&canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}
    function down(event) {
      if(paused||window.TutorialCard?.isAberto?.())return;
      if(state==='CHAVE'){project(event);if(OperacoesLayout.inside(rects[2],pointer.x,pointer.y,0))collect();return;}
      if(state!=='JOGANDO'||drag>=0||event.button>0)return;project(event);canvas.focus();event.preventDefault();
      for(let j=bagCount-1;j>=0;j--){const i=order[j],b=bags[i],w=b.h*(art[item]?.naturalWidth||130)/(art[item]?.naturalHeight||151);
        if(!b.fixed&&pointer.x>=b.x-w/2&&pointer.x<=b.x+w/2&&pointer.y>=b.y-b.h&&pointer.y<=b.y){
          drag=i;dragZone=b.zone;dragCell=b.cell;downX=pointer.x;downY=pointer.y;pointerId=event.pointerId;occupied[b.zone][b.cell]=-1;b.zone='';condition=false;settled=0;animate(b,pointer.x,pointer.y+b.h*1.15,b.h*1.15,.1);canvas.setPointerCapture(pointerId);move(event);break;
        }
      }
    }
    function move(event){if(drag>=0&&pointerId!==event.pointerId)return;project(event);if(drag<0)return;event.preventDefault();const b=bags[drag];b.x=pointer.x;b.y=pointer.y+b.h;b.tx=b.x;b.ty=b.y;}
    function up(event) {
      if(pointerId!==event.pointerId||drag<0)return;move(event);const index=drag;let target='',cell=-1,distance=Infinity;
      for(let i=0;i<containers.length;i++){const id=containers[i],z=zones[id],c=OperacoesLayout.nearest(z,occupied[id],pointer.x,pointer.y);
        if(c>=0){const p=z.cells[c],d=(p.x-pointer.x)**2+(p.y-pointer.y)**2;if(d<distance){target=id;cell=c;distance=d;}}
      }
      const clicked=dragZone==='plataforma'&&Math.hypot(pointer.x-downX,pointer.y-downY)<6;
      if(clicked||f.tipo==='dobro'&&cell<0)restore(index);else if(cell>=0)seat(index,target,cell);else table(index);drag=-1;releaseCapture();validate();
    }
    function cancel(event){if(pointerId!==event.pointerId||drag<0)return;seat(drag,dragZone,dragCell);drag=-1;releaseCapture();validate();}
    function reset(){if(state!=='JOGANDO')return;if(drag>=0){drag=-1;releaseCapture();}setup();canvas.focus();}
    function solve() {
      if(drag>=0){seat(drag,dragZone,dragCell);drag=-1;releaseCapture();}
      settled=0;
      if(f.tipo==='dobro'){
        for(let i=bagCount-1;i>=0&&counts(type.zone)>goal;i--)if(bags[i].zone===type.zone&&!bags[i].fixed){occupied[type.zone][bags[i].cell]=-1;restore(i);}
        for(let i=0;i<bagCount&&counts(type.zone)<goal;i++)if(bags[i].zone!=='plataforma'){occupied[bags[i].zone][bags[i].cell]=-1;seat(i,type.zone,occupied[type.zone].indexOf(-1));}}
      else if(f.tipo==='metadeMais'){for(let i=bagCount-1;i>=0;i--){const b=bags[i],n=counts(type.zone);if(n>goal&&b.zone===type.zone){occupied[type.zone][b.cell]=-1;table(i);}else if(n<goal&&b.zone==='mesa'){occupied.mesa[b.cell]=-1;seat(i,type.zone,occupied[type.zone].indexOf(-1));}}}
      else if(f.tipo==='divisao'){
        for(const id in occupied)occupied[id].fill(-1);
        const each=f.sacos/containers.length;for(let i=0;i<bagCount;i++)seat(i,containers[Math.floor(i/each)],i%each);
      }
      validate();
    }
    function collect(){if(state!=='CHAVE')return;claimed=true;change('COLETAR');say('Chave de Operações obtida!');}
    function key(event) {
      if(window.TutorialCard?.isAberto?.())return;
      if(event.ctrlKey||event.altKey||event.metaKey)return;const k=event.key.toLowerCase();event.stopImmediatePropagation();
      if(k==='escape'){event.preventDefault();openSettings();return;}
      if(paused)return;
      if(k==='tab'){
        event.preventDefault();let i=controls.indexOf(document.activeElement),step=event.shiftKey?-1:1;
        for(let tries=0;tries<controls.length;tries++){i=(i+step+controls.length)%controls.length;if(!controls[i].hidden&&!controls[i].disabled){controls[i].focus();return;}}
        canvas.focus();return;
      }
      if((k==='enter'||k===' ')&&controls.includes(event.target))return;
      event.preventDefault();if(event.repeat)return;if(k==='f3'){options.toggleDebug();if(options.debug())selfTest();}else if((k==='enter'||k==='e')&&state==='CHAVE')collect();else if(k==='n'&&options.debug()&&state==='JOGANDO')solve();
    }
    function close(won=false) {
      if(closed)return;closed=true;if(window.ActivePuzzle?.type==='operacoes')window.ActivePuzzle=null;window.TutorialCard?.fechar?.();cancelAnimationFrame(raf);drag=-1;releaseCapture();
      canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',cancel);canvas.removeEventListener('lostpointercapture',cancel);
      document.removeEventListener('keydown',key,true);window.removeEventListener('resize',resize);host.remove();current=null;options.onExit(won);
    }
    function update(dt) {
      if(paused||window.TutorialCard?.isAberto?.())return;
      elapsed+=dt;clock+=dt;messageTime=Math.max(0,messageTime-dt);shake=Math.max(0,shake-dt);
      if(state==='JOGANDO'&&f.tipo!=='divisao'){settled=condition&&drag<0?settled+dt:0;if(settled+1e-9>=ASSENTA_S)success();}
      const target=completed===0?0:completed===1?6:completed===2?10:16;speed+=(target-speed)*(1-Math.exp(-dt*5));angle+=speed*dt;
      for(let i=0;i<3;i++)lamps[i]+=((i<completed?1:0)-lamps[i])*(1-Math.exp(-dt*6));
      for(let i=0;i<bagCount;i++){const b=bags[i];b.t=Math.min(1,b.t+(b.duration?dt/b.duration:1));const t=ease(b.t);b.h=b.fh+(b.th-b.fh)*ease(calm?1:Math.min(1,b.t*b.duration/.1));
        if(i===drag){b.x=pointer.x;b.y=pointer.y+b.h;}else{b.x=b.fx+(b.tx-b.fx)*t;b.y=b.fy+(b.ty-b.fy)*t;}b.pop=Math.max(0,b.pop-dt);order[i]=i;}
      // Inserção no array fixo: profundidade crescente, sem sort nem arrays por frame.
      for(let i=1;i<bagCount;i++){const v=order[i];let j=i-1;while(j>=0&&bags[order[j]].y>bags[v].y){order[j+1]=order[j];j--;}order[j+1]=v;}
      cartX=state==='SUCESSO'&&f.tipo==='metadeMais'&&!calm?650*Math.min(1,elapsed/1.3)**2:!calm&&shake>0?Math.sin(shake*90)*2:0;
      cartY=!calm&&shake>0&&counts('carrinho')<goal?2:0;
      if(f.tipo==='divisao')for(let i=0;i<containers.length;i++){
        const t=elapsed-i*.28;hops[i]=state==='SUCESSO'&&!calm&&t>=0&&t<.42?-6*Math.sin(t/.42*Math.PI):0;
        if(state==='SUCESSO'&&!calm&&t>=0&&!(sparked&(1<<i))){sparked|=1<<i;const z=zones[containers[i]],p=z.cells[1];
          for(let j=i*10;j<i*10+10;j++){const k=j*5;particles[k]=p.x;particles[k+1]=p.y;particles[k+2]=(Math.random()-.5)*90;particles[k+3]=-30-Math.random()*65;particles[k+4]=.6;}
        }
      }
      for(let i=0;i<32;i++){const k=i*5;if(particles[k+4]>0){particles[k]+=particles[k+2]*dt;particles[k+1]+=particles[k+3]*dt;if(f.tipo==='divisao')particles[k+3]+=90*dt;particles[k+4]-=dt;}}
      if(state==='SUCESSO'&&elapsed>=1.5){if(phase===data.fases.length-1){change('ENGRENAGEM');say('O moinho preparou uma surpresa!');}else change('ESCURECER');}
      else if(state==='ESCURECER'&&elapsed>=.4)change('TITULO');else if(state==='TITULO'&&elapsed>=1){phase++;setup();}
      else if(state==='ENGRENAGEM'&&elapsed>=1.5){change('VOAR_CHAVE');say('A chave está saindo do moinho!');}
      else if(state==='VOAR_CHAVE'&&elapsed>=1.2){change('CHAVE');say('Pegue a Chave de Operações! Clique, toque ou aperte Enter ou E.');}
      else if(state==='COLETAR'&&elapsed>=.45)change('SAIR');else if(state==='SAIR'&&elapsed>=.4)close(true);
      if(state==='VOAR_CHAVE'){const t=ease(Math.min(1,elapsed/1.2));keyX=518+2*t;keyY=200+55*t-(calm?0:Math.sin(t*Math.PI)*28);}
      else if(state==='CHAVE'){keyX=520;keyY=255+(calm?0:Math.sin(elapsed*3)*4);}
      else if(state==='COLETAR')keyY=255-(calm?0:ease(Math.min(1,elapsed/.45))*65);
    }
    function sprite(name,x,y,w,h){const img=art[name];if(img)ctx.drawImage(img,x,y,w,h);else{ctx.fillStyle='#c99b62';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#684527';ctx.strokeRect(x,y,w,h);}}
    function text(value,x,y,size=16,color='#513525'){ctx.fillStyle=color;ctx.font=`bold ${size}px ${font}`;ctx.fillText(value,x,y);}
    function lift(id){return f.tipo==='divisao'?hops[containers.indexOf(id)]||0:0;}
    function bag(index) {
      const b=bags[index],h=b.h*(calm?1:1+.07*Math.sin(b.pop/.18*Math.PI)),img=art[item],w=h*(img?.naturalWidth||130)/(img?.naturalHeight||151),x=b.x+(b.zone==='carrinho'?cartX:0),y=b.y+(b.zone==='carrinho'?cartY:lift(b.zone));
      if(index===drag){ctx.fillStyle='#22160455';ctx.beginPath();ctx.ellipse(x,y+4,w*.55,6,0,0,Math.PI*2);ctx.fill();}sprite(item,x-w/2,y-h,w,h);
      if(f.tipo==='divisao'&&result==='sobras'&&b.zone==='mesa'){ctx.save();ctx.globalAlpha=calm?.8:.45+.35*Math.sin(clock*9);ctx.strokeStyle='#ffe24a';ctx.lineWidth=3;ctx.strokeRect(x-w/2-2,y-h-2,w+4,h+4);ctx.restore();}
    }
    function button(index,label){const r=rects[index];ctx.fillStyle='#34271de8';ctx.beginPath();ctx.roundRect(r.x,r.y,r.w,r.h,10);ctx.fill();if(document.activeElement===controls[index]){ctx.strokeStyle='#fff0a0';ctx.lineWidth=3;ctx.stroke();}text(label,r.x+r.w/2,r.y+r.h/2+9,index===2?19:30,'#fff4d3');}
    function draw() {
      ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#171c20';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.setTransform(s,0,0,s,0,offset);ctx.imageSmoothingEnabled=false;ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.save();ctx.beginPath();ctx.rect(0,0,1024,572);ctx.clip();
      sprite('fundo_fazenda',0,0,1024,572);
      // 16 frames cobrem 90°: a simetria das quatro velas fecha o loop sem salto.
      const frameIndex=Math.floor(calm?0:angle)%16,v=layout.velas,size=v.frame_px*v.escala_sugerida;
      if(art.velas_frames)ctx.drawImage(art.velas_frames,strip?frameIndex*224:frameIndex%4*224,strip?0:Math.floor(frameIndex/4)*224,224,224,v.eixo[0]-size/2,v.eixo[1]-size/2,size,size);
      else {ctx.save();ctx.translate(v.eixo[0],v.eixo[1]);ctx.rotate(calm?0:angle*Math.PI/32);ctx.fillStyle='#d8c394';ctx.fillRect(-size/2,-5,size,10);ctx.fillRect(-5,-size/2,10,size);ctx.restore();}
      if(type&&type.zone==='plataforma')for(let i=0;i<zones.plataforma.cells.length;i++){const p=zones.plataforma.cells[i];sprite('slot',p.x-22.49,p.y-40,46*176/180,46);}
      if(f.tipo==='dobro'||f.tipo==='metadeMais'){const z=zones.carrinho,img=art.carrinho;sprite('carrinho',z.drawX+cartX,z.drawY+cartY,(img?.naturalWidth||875)*z.scale,(img?.naturalHeight||509)*z.scale);}
      if(f.tipo==='divisao')for(let i=0;i<containers.length;i++){const id=containers[i],z=zones[id],name=`carroca_${id}`,img=art[name];sprite(name,z.drawX,z.drawY+hops[i],(img?.naturalWidth||298)*z.scale,(img?.naturalHeight||227)*z.scale);}
      for(let i=0;i<bagCount;i++)if(order[i]!==drag)bag(order[i]);if(drag>=0)bag(drag);
      if(!calm){ctx.fillStyle=f.tipo==='divisao'?'#fff09a':'#fff0cc';for(let i=0;i<32;i++){const k=i*5;if(particles[k+4]>0&&(f.tipo==='divisao'||particles[k+1]>=200&&particles[k+1]<278))ctx.fillRect(particles[k],particles[k+1],3,4);}}
      sprite('placa_pedido',18,12,170,134);
      if(f.tipo==='dobro'){
        text('O moinho',103,59,17);text('precisa do',103,83,17);text('DOBRO',103,111,22);
      }else if(f.tipo==='metadeMais'){
        text('Deixe a',103,59,17);text('METADE',103,84,21);text(`e mais ${f.mais}`,103,111,18);
      }
      else{text('Reparta',103,55,17);text(f.sacos,103,91,32);text('sacos igualmente',103,113,13);}
      for(let i=0;i<3;i++){const x=210+i*40;sprite('lanterna_apagada',x,24,27.6,39.6);ctx.globalAlpha=lamps[i];ctx.drawImage(glow,x-21,0,70,70);ctx.drawImage(lit,x,24,27.6,39.6);ctx.globalAlpha=1;}
      for(let i=0;i<containers.length;i++){
        const id=containers[i],z=zones[id],x=id==='carrinho'?710+cartX:f.tipo==='divisao'?z.cells[1].x:520,y=id==='carrinho'?310+cartY:f.tipo==='divisao'?310+lift(id):205;
        const pulse=f.tipo==='divisao'&&messageTime>0&&!calm?1+.09*Math.sin(messageTime*16):1;
        ctx.save();ctx.translate(x,y);ctx.scale(pulse,pulse);
        if(f.tipo==='divisao'){sprite('etiqueta',-36.7,-20.5,73.4,41);text(counts(id),0,6,22);}
        else tag(f.tipo==='dobro'?`No moinho: ${counts(id)}`:`Tem: ${counts(id)}`,0,0);ctx.restore();
      }
      if(f.tipo==='dobro'){tag(`Mesa: ${counts('mesa')}`,310,338);tag(`Carrinho: ${counts('carrinho')}`,710,310);}
      if(state==='ENGRENAGEM'||state==='VOAR_CHAVE'||state==='CHAVE'||state==='COLETAR'){
        const img=art.engrenagem,scale=.5*(state==='ENGRENAGEM'?ease(Math.min(1,elapsed/1.5)):1),w=(img?.naturalWidth||151)*scale,h=(img?.naturalHeight||155)*scale;
        ctx.save();ctx.translate(518,200);ctx.rotate(calm?0:state==='ENGRENAGEM'?elapsed*2.8:4.2);sprite('engrenagem',-w/2,-h/2,w,h);ctx.restore();
      }
      if(state==='VOAR_CHAVE'||state==='CHAVE'||state==='COLETAR'){
        const h=62,w=h*(art.chave?.naturalWidth||229)/(art.chave?.naturalHeight||482);
        ctx.save();ctx.globalAlpha=state==='COLETAR'?Math.max(0,1-elapsed/.45):1;ctx.drawImage(glow,keyX-48,keyY-48,96,96);sprite('chave',keyX-w/2,keyY-h/2,w,h);
        if(state==='CHAVE'){ctx.strokeStyle='#fff1aa';ctx.lineWidth=document.activeElement===takeKey?4:2;ctx.beginPath();ctx.arc(keyX,keyY,calm?33:33+Math.sin(elapsed*4)*5,0,Math.PI*2);ctx.stroke();}ctx.restore();
      }
      if(messageTime>0){ctx.save();ctx.globalAlpha=calm?1:Math.min(1,messageTime/.3,(2-messageTime)/.15);ctx.fillStyle='#34271de8';ctx.fillRect(310,485,404,46);text(message,512,515,21,'#fff4d3');ctx.restore();}
      if(state==='SUCESSO'&&elapsed<1){ctx.fillStyle='#34271de8';ctx.fillRect(352,135,320,58);text('Muito bem!',512,174,30,'#fff4d3');}
      if(options.debug()){
        ctx.lineWidth=1;ctx.strokeStyle='#ff3939';for(const id in zones){const z=zones[id];ctx.strokeRect(z.x-20,z.y-20,z.w+40,z.h+40);for(let i=0;i<z.cells.length;i++){const p=z.cells[i];ctx.fillStyle='#ff2020';ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill();text(i,p.x,p.y-6,12,'#fff');}text(`${id}: ${counts(id)}`,z.x+60,z.y-24,14,'#fff');}
        const a=layout.area_terra;ctx.strokeRect(a.x,a.y,a.w,a.h);text(`Ponteiro: ${pointer.x.toFixed(1)}, ${pointer.y.toFixed(1)}`,512,554,16,'#fff');
        ctx.fillStyle='#171c20ee';ctx.fillRect(195,75,785,58);
        text(`Fase ${phase+1} | moinho ${counts('plataforma')} | mesa ${counts('mesa')} | carrinho ${counts('carrinho')} | carroças ${counts('vermelha')}/${counts('azul')}/${counts('verde')}`,587,96,14,'#fff');
        const rule=f.tipo==='dobro'?`moinho == ${goal}`:f.tipo==='metadeMais'?`carrinho == ${goal}`:`mesa == 0 e cada carroça == ${goal}`;
        text(`${rule}; sem arrastar | ${settled.toFixed(2)}/${ASSENTA_S}s | estado: ${result}`,587,119,14,'#fff');
      }
      if(state==='ESCURECER'||state==='TITULO'||state==='SAIR'){ctx.globalAlpha=state==='TITULO'?1:Math.min(1,elapsed/.4);ctx.fillStyle='#171c20';ctx.fillRect(0,0,1024,572);ctx.globalAlpha=1;if(state==='TITULO')text(`Fase ${phase+2} de 3`,512,286,36,'#fff4d3');}
      button(0,'×');button(1,'↻');
      const hr=rects[3],helpImg=helpPressed?art.ajudaPressionado:art.ajudaNormal;
      ctx.save();if(help.disabled)ctx.globalAlpha=0.45;
      if(helpImg)ctx.drawImage(helpImg,hr.x+3,hr.y,48,48);else button(3,'?');
      if(document.activeElement===help){ctx.strokeStyle='#fff0a0';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(hr.x,hr.y,hr.w,hr.h,10);ctx.stroke();}
      ctx.restore();
      button(4,'⚙');
      const sr=rects[4],gearImg=art.btnGear;
      if(gearImg)ctx.drawImage(gearImg,sr.x+13,sr.y+10,28,28);
      if(document.activeElement===settings){ctx.strokeStyle='#fff0a0';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(sr.x,sr.y,sr.w,sr.h,10);ctx.stroke();}
      ctx.restore();
    }
    function tag(label,x,y){ctx.fillStyle='#34271de8';ctx.fillRect(x-76,y-20,152,35);text(label,x,y+4,17,'#fff4d3');}
    function loop(time){if(closed)return;if(paused){last=time;raf=requestAnimationFrame(loop);return;}const dt=last?Math.min(.05,(time-last)/1000):0;last=time;update(dt);if(closed)return;draw();raf=requestAnimationFrame(loop);}
    exit.onclick=()=>close(false);restart.onclick=reset;takeKey.onclick=collect;
    help.onpointerdown=()=>{if(!help.disabled)helpPressed=true;};help.onpointerup=()=>{helpPressed=false;};help.onpointerleave=()=>{helpPressed=false;};
    help.onclick=()=>{if(help.disabled||state!=='JOGANDO')return;if(drag>=0){seat(drag,dragZone,dragCell);drag=-1;releaseCapture();}window.TutorialCard?.abrir?.('operacoes',{onFechar:()=>canvas.focus()});};
    settings.onclick=()=>openSettings();
    canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('lostpointercapture',cancel);
    document.addEventListener('keydown',key,true);window.addEventListener('resize',resize);current=close;
    window.ActivePuzzle = { type: 'operacoes', close: () => close(false), pause: () => { paused = true; }, resume: () => { paused = false; }, get active() { return Boolean(current); } };
    setup();resize();
    const tutorialAbriu=window.TutorialCard?.verificarEabrir?.('operacoes',{onFechar:()=>canvas.focus()});
    if(!tutorialAbriu)canvas.focus();
    if(options.debug())selfTest();raf=requestAnimationFrame(loop);
  }
  return {prepare,open,registerType:(name,strategy)=>{types[name]=strategy;},close:()=>close(false),pause:()=>{paused=true;},resume:()=>{paused=false;},get active(){return Boolean(current);}};
})();
