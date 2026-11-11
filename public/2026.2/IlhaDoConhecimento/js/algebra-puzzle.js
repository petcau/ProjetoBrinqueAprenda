/* A Balança Misteriosa: três fases e coleta, sem progresso persistente. */
window.AlgebraPuzzle = (() => {
  'use strict';
  const names=['fundo_vila','bandeja','caixa_misteriosa','coluna','corrente','esmeralda','prato','rubi','safira','topazio','travessa_frames','chave'];
  const types=['rubi','safira','esmeralda','topazio','caixa_misteriosa'];
  const art={},frames=new Float32Array(31*4);let ready,data,layout,b,glow,current;
  // Enumeração pura por tipo: joias iguais não multiplicam as soluções.
  function solutions(f,stock,model) {
    const sum=list=>list.reduce((total,type)=>total+model.weight(type,f.peso_caixa),0);
    const left=sum(f.esq),right=sum(f.dir),gems=[];
    if(stock===null){
      const rubies=Math.abs(left-right)/model.weight('rubi',f.peso_caixa);
      return {count:f.bandeja.includes('rubi')&&Number.isInteger(rubies)&&rubies>0&&rubies+(left<right?f.esq.length:f.dir.length)<=8?1:0,rubies,side:left<right?0:1};
    }
    for(let i=0;i<4;i++)for(let n=0;n<(stock[types[i]]||0);n++)gems.push(types[i]);
    const counts=types.slice(0,4).map(type=>stock[type]||0);
    let count=0,first=-1,combinations=1;
    for(let i=0;i<4;i++)combinations*=counts[i]+1;
    // Cada tipo envia de zero até todas as suas joias para o prato esquerdo.
    for(let code=0;code<combinations;code++){
      let value=code,l=left,r=right,nl=f.esq.length,nr=f.dir.length,mask=0,offset=0;
      for(let i=0;i<4;i++){
        const total=counts[i],take=value%(total+1),weight=model.weight(types[i],f.peso_caixa);
        value=Math.floor(value/(total+1));
        l+=take*weight;r+=(total-take)*weight;nl+=take;nr+=total-take;
        // A máscara continua disponível para a tecla N montar uma solução.
        for(let j=0;j<take;j++)mask|=1<<(offset+j);
        offset+=total;
      }
      if(l===r&&nl<=8&&nr<=8){if(!count)first=mask;count++;}
    }
    return {count,mask:first,gems};
  }
  function stockTest(){
    try{
      for(let i=0;i<data.fases.length;i++){
        const stock=ALGEBRA.FASES[i].estoque,result=solutions(data.fases[i],stock,b);
        if(!result.count)throw Error('Fase '+(i+1)+' sem solução usando todo o estoque');
        console.info('[Álgebra] Fase '+(i+1)+': '+(stock===null?'combinação de rubis encontrada':result.count+' distribuição(ões) por tipo equilibrada(s) usando todas as joias')+'.');
      }
      console.info('[Álgebra] PASSOU: soluções de todas as fases.');
      return true;
    }catch(error){console.error('[Álgebra] FALHOU: '+error.message);return false;}
  }
  function prepare(input,positions) {
    return ready ||= (async()=>{
      data=input;layout=positions;b=Balanca.create(layout);
      if(!Number.isFinite(ALGEBRA.ASSENTA_S)||ALGEBRA.ASSENTA_S<0||ALGEBRA.FASES.length!==data.fases.length||
        ALGEBRA.FASES.some(f=>f.estoque!==null&&types.slice(0,4).some(type=>!Number.isInteger(f.estoque?.[type]??0)||(f.estoque?.[type]??0)<0)))throw Error('Configuração do estoque de Álgebra inválida.');
      for(let i=0;i<31;i++){frames[i*4]=i%8*353;frames[i*4+1]=Math.floor(i/8)*160;frames[i*4+2]=353;frames[i*4+3]=160;}
      const ok=Math.abs(b.px-511.55)<2&&Math.abs(b.py-114.5)<2&&Math.abs(b.hookX(10,0)-360.3)<2&&Math.abs(b.hookY(10,0)-87.8)<2&&Math.abs(b.hookX(10,1)-662.8)<2&&Math.abs(b.hookY(10,1)-141.2)<2&&Math.abs(b.panX(10,0)-258.7)<2&&Math.abs(b.panY(10,0)-164.1)<2;
      console.info(`[Álgebra] Autoteste pivô, ganchos +10° e prato esquerdo: ${ok?'OK':'DIVERGE'}`);
      await Promise.all(names.map(name=>new Promise(resolve=>{const src=name==='chave'?'assets/hud/chave_algebra.png':`assets/puzzles/algebra/${name}.png`,img=new Image();img.onload=()=>{art[name]=img;resolve();};img.onerror=()=>{console.warn(`[Álgebra] Ausente: ${src}; usando placeholder.`);resolve();};img.src=src;})));
      await Promise.all([['btn_ajuda_normal','assets/tutorial/botao-ajuda-normal.webp'],['btn_ajuda_pressionado','assets/tutorial/botao-ajuda-pressionado.webp'],['btn_engrenagem','assets/hud/configuracoes.png']].map(([k,src])=>new Promise(resolve=>{const img=new Image();img.onload=()=>{art[k]=img;resolve();};img.onerror=()=>resolve();img.src=src;})));
      glow=document.createElement('canvas');glow.width=glow.height=96;const c=glow.getContext('2d'),g=c.createRadialGradient(48,48,0,48,48,48);g.addColorStop(0,'#70d9ffbb');g.addColorStop(1,'#70d9ff00');c.fillStyle=g;c.fillRect(0,0,96,96);
    })();
  }
  function open(options={}) {
    if(current)current(false);
    const host=document.createElement('div'),frame=document.createElement('div'),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),status=document.createElement('div');
    host.style.cssText='position:fixed;inset:0;z-index:1000;background:#101820;display:flex;justify-content:center;';frame.style.cssText='position:relative;height:100%;';
    canvas.style.cssText='display:block;width:100%;height:100%;touch-action:none;';canvas.tabIndex=0;host.setAttribute('role','dialog');host.setAttribute('aria-modal','true');host.setAttribute('aria-label','A Balança Misteriosa');
    canvas.setAttribute('aria-label','Arraste pedras aos pratos. Teclado: setas escolhem o prato, 1 a 5 adicionam pedras, Backspace retira. Arraste para fora ou use Backspace para devolver. Tab acessa os botões. Escape sai.');
    status.style.cssText='position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    frame.appendChild(canvas);host.appendChild(frame);host.appendChild(status);document.body.appendChild(host);
    const rects=[[920,12,44,40],[866,12,44,40],[476,248,72,84],[812,12,44,40],[758,12,44,40]],labels=['Sair da balança','Reiniciar fase','Pegar Chave de Álgebra','Ajuda: como jogar','Configurações'],buttons=[];
    let helpPressed=false,paused=false;
    for(let i=0;i<5;i++){const el=document.createElement('button');el.setAttribute('aria-label',labels[i]);el.title=labels[i];el.style.cssText='position:absolute;border:0;background:transparent;color:transparent;cursor:pointer;border-radius:8px;';el.onfocus=()=>{el.style.outline='3px solid #ffe591';};el.onblur=()=>{el.style.outline='';};buttons.push(el);frame.appendChild(el);}
    const remaining=new Int16Array(5);
    const items=Array.from({length:17},()=>({side:-1,slot:0,type:'rubi',fixed:false,pop:0})),particles=new Float32Array(24*7),pointer={x:0,y:0};
    const calm=window.matchMedia('(prefers-reduced-motion: reduce)').matches||Boolean(window.GameSettings?.calm),scale=layout.escala_jogo,font=window.getComputedStyle?window.getComputedStyle(canvas).fontFamily:'sans-serif';
    let phase=0,f=data.fases[0],state='JOGANDO',elapsed=0,last=0,time=0,raf=0,closed=false,s=1,offset=0,angle=0,velocity=0,left=0,right=0,message=0,drag=-1,pid=-1,origin=-1,originSlot=0,target=-1,keyboardSide=1,completed=0,keyX=b.px,keyY=b.py,claimed=false,finite=false,settled=0,placed=0,surplus=false,notified=false,debug=false,stockLabel='livre';
    const isDebug=()=>options.debug?options.debug():debug;
    function openSettings(){if(paused)return;paused=true;cancel();if(window.openSettings)window.openSettings(buttons[4],()=>{paused=false;buttons[4].focus();});else if(window.SettingsBook){window.SettingsBook.open('index');document.getElementById('book-dialog')?.showModal();}}
    function change(next){
      state=next;elapsed=0;buttons[0].disabled=claimed;buttons[1].disabled=next!=='JOGANDO';buttons[2].hidden=next!=='CHAVE';buttons[3].disabled=next!=='JOGANDO';buttons[4].disabled=claimed;
      if(next==='CHAVE'){status.textContent='Pegue a Chave de Álgebra! Clique, toque ou aperte Enter ou E.';buttons[2].focus();}
    }
    function resize(){const w=Math.min(window.innerWidth,window.innerHeight*1024/572),dpr=Math.min(2,window.devicePixelRatio||1);frame.style.width=`${w}px`;canvas.width=Math.round(w*dpr);canvas.height=Math.round(window.innerHeight*dpr);s=canvas.width/1024;offset=(canvas.height-572*s)/2;for(let i=0;i<5;i++){const r=rects[i],el=buttons[i];el.style.left=`${r[0]*w/1024}px`;el.style.top=`${(r[1]+offset/s)*w/1024}px`;el.style.width=`${r[2]*w/1024}px`;el.style.height=`${r[3]*w/1024}px`;}}
    function setup(){cancel();f=data.fases[phase];for(let i=0;i<17;i++){items[i].side=-1;items[i].fixed=false;items[i].pop=0;}let n=0;for(let side=0;side<2;side++){const list=side?f.dir:f.esq;for(let slot=0;slot<list.length;slot++)Object.assign(items[n++],{side,slot,type:list[slot],fixed:true});}const stock=ALGEBRA.FASES[phase].estoque;finite=stock!==null;
      for(let i=0;i<5;i++)remaining[i]=finite?(stock[types[i]]||0):-1;
      angle=velocity=message=settled=0;surplus=notified=false;completed=phase;particles.fill(0);change('JOGANDO');status.textContent=f.missao;weights();canvas.focus();}
    function weights(){left=b.total(items,0,f.peso_caixa);right=b.total(items,1,f.peso_caixa);settled=0;placed=0;
      for(let i=0;i<17;i++)if(items[i].side>=0&&!items[i].fixed)placed++;
      stockLabel=finite?'':'livre';if(finite)for(let i=0;i<4;i++)stockLabel+=(i?' · ':'')+types[i]+':'+remaining[i];
    }
    function canTake(type){const i=types.indexOf(type);return available(type)&&(!finite||remaining[i]>0);}
    function returnStock(p){if(finite)remaining[types.indexOf(p.type)]++;}
    // Ponteiro client → pixels físicos → design; y desconta a centralização vertical.
    function project(event){const r=canvas.getBoundingClientRect();pointer.x=((event.clientX-r.left)*canvas.width/r.width)/s;pointer.y=(((event.clientY-r.top)*canvas.height/r.height)-offset)/s;}
    function available(type){return f.bandeja.includes(type)&&(type!=='caixa_misteriosa'||f.caixa_na_bandeja);}
    function spare(){for(let i=0;i<17;i++)if(items[i].side===-1)return i;return -1;}
    function burst(x,y,gold){for(let i=0;i<24;i++){const j=i*7;particles[j]=x;particles[j+1]=y;particles[j+2]=(Math.random()-.5)*(gold?180:65);particles[j+3]=-20-Math.random()*(gold?120:35);particles[j+4]=particles[j+5]=gold?.8:.35;particles[j+6]=gold?1:0;}}
    function down(event){
      if(paused||window.TutorialCard?.isAberto?.())return;
      if(event.button>0)return;
      if(state==='CHAVE'){project(event);const r=rects[2];if(b.inside(pointer.x,pointer.y,r[0],r[1],r[2],r[3])){event.preventDefault();collect();}return;}
      if(state!=='JOGANDO'||pid!==-1)return;event.preventDefault();project(event);canvas.focus();origin=-1;
      for(let slot=7;slot>=0&&drag<0;slot--)for(let i=16;i>=0;i--){const p=items[i];if(p.side>=0&&p.slot===slot&&!p.fixed&&b.inside(pointer.x,pointer.y,b.cellX(angle,p.side,p.slot)-20,b.cellY(angle,p.side,p.slot)-38,40,42)){drag=i;origin=p.side;originSlot=p.slot;break;}}
      if(drag<0)for(let i=0;i<5;i++){const slot=layout.bandeja.slots[i];if(canTake(types[i])&&b.inside(pointer.x,pointer.y,190+slot[0]*scale-30,424+slot[1]*scale-30,60,60)){drag=spare();if(drag>=0)items[drag].type=types[i];break;}}
      if(drag>=0){items[drag].side=-2;pid=event.pointerId;canvas.setPointerCapture(pid);weights();target=b.target(angle,pointer.x,pointer.y);}}
    function move(event){if(pid!==-1&&event.pointerId!==pid)return;project(event);if(drag>=0){event.preventDefault();target=b.target(angle,pointer.x,pointer.y);}}
    function releaseCapture(){const id=pid;pid=-1;drag=-1;target=-1;if(id>=0&&canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}
    function up(event){if(event.pointerId!==pid||drag<0)return;project(event);target=b.target(angle,pointer.x,pointer.y);const slot=target<0?-1:b.free(items,target),p=items[drag];if(slot>=0){if(finite&&origin<0)remaining[types.indexOf(p.type)]--;p.side=target;p.slot=slot;p.fixed=false;p.pop=.2;}else{if(origin>=0)returnStock(p);p.side=-1;burst(pointer.x,pointer.y,false);}releaseCapture();weights();}
    function cancel(event){if(drag<0||event&&event.pointerId!==pid)return;items[drag].side=origin;items[drag].slot=originSlot;releaseCapture();weights();}
    function success(){if(state!=='JOGANDO')return;completed=phase+1;message=0;change('SUCESSO');burst(b.px,220,true);status.textContent=phase===1?`Equilibrou! A caixa pesava ${f.peso_caixa}!`:'Equilibrou!';}
    function collect(){
      if(state!=='CHAVE')return;
      // Confirmada a coleta, concluímos a animação antes de devolver a mesma recompensa da ilha.
      claimed=true;change('COLETAR');status.textContent='Chave de Álgebra obtida!';
    }
    function solve(){
      if(state!=='JOGANDO')return;
      const result=solutions(f,ALGEBRA.FASES[phase].estoque,b);if(!result.count)return;
      setup();const n=finite?result.gems.length:result.rubies;
      for(let j=0;j<n;j++){
        const type=finite?result.gems[j]:'rubi',side=finite?(result.mask&(1<<j)?0:1):result.side,i=spare(),slot=b.free(items,side);
        if(i<0||slot<0)return;
        Object.assign(items[i],{side,slot,type,fixed:false,pop:.2});if(finite)remaining[types.indexOf(type)]--;
      }
      weights();success();
    }
    function key(event){
      if(window.TutorialCard?.isAberto?.())return;
      if(event.ctrlKey||event.altKey||event.metaKey)return;
      const k=event.key.toLowerCase();event.stopImmediatePropagation();
      if(k==='escape'){event.preventDefault();openSettings();return;}
      if(paused)return;
      if(k==='tab'){event.preventDefault();let i=buttons.indexOf(document.activeElement);for(let tries=0;tries<buttons.length;tries++){i=(i+buttons.length+(event.shiftKey?-1:1))%buttons.length;if(!buttons[i].hidden&&!buttons[i].disabled){buttons[i].focus();return;}}canvas.focus();return;}
      if(k==='e'&&state==='CHAVE'){event.preventDefault();if(!event.repeat)collect();return;}
      if(k==='enter'||k===' '){event.preventDefault();if(!event.repeat){const i=buttons.indexOf(document.activeElement);if(i>=0&&!buttons[i].disabled&&!buttons[i].hidden)buttons[i].onclick();else if(k==='enter'&&state==='CHAVE')collect();}return;}
      event.preventDefault();if(event.repeat)return;
      if(k==='f3'){if(options.toggleDebug)options.toggleDebug();else debug=!debug;if(isDebug())stockTest();}else if(k==='n'&&isDebug())solve();
      else if(state==='JOGANDO'&&drag<0){if(k==='arrowleft')keyboardSide=0;else if(k==='arrowright')keyboardSide=1;else if(k==='backspace'){for(let i=16;i>=0;i--)if(items[i].side===keyboardSide&&!items[i].fixed){returnStock(items[i]);items[i].side=-1;break;}weights();}else{const type=types[Number(k)-1],i=spare(),slot=b.free(items,keyboardSide);if(type&&canTake(type)&&i>=0&&slot>=0){Object.assign(items[i],{type,side:keyboardSide,slot,fixed:false,pop:.2});if(finite)remaining[types.indexOf(type)]--;weights();}}}}
    function close(won=false){if(closed)return;closed=true;if(window.ActivePuzzle?.type==='algebra')window.ActivePuzzle=null;if(window.TutorialCard?.isAberto?.())window.TutorialCard.fechar();cancel();cancelAnimationFrame(raf);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',cancel);canvas.removeEventListener('lostpointercapture',cancel);document.removeEventListener('keydown',key,true);window.removeEventListener('resize',resize);host.remove();current=null;options.onExit(won);}
    function update(dt){if(paused||window.TutorialCard?.isAberto?.())return;time+=dt;elapsed+=dt;message=Math.max(0,message-dt);const goal=b.angle(left,right);if(calm){angle=goal;velocity=0;}else{let remaining=dt;while(remaining>0){const step=Math.min(remaining,1/120);velocity+=((goal-angle)*90-velocity*12)*step;angle+=velocity*step;
        // Mantém os ganchos no intervalo dos 31 quadros, inclusive durante o balanço de erro.
        if(angle>15){angle=15;velocity=Math.min(0,velocity);}else if(angle< -15){angle=-15;velocity=Math.max(0,velocity);}remaining-=step;}}
      for(let i=0;i<17;i++)items[i].pop=Math.max(0,items[i].pop-dt);
      for(let i=0;i<24;i++){const j=i*7;if(particles[j+4]>0){particles[j]+=particles[j+2]*dt;particles[j+1]+=particles[j+3]*dt;particles[j+3]+=70*dt;particles[j+4]-=dt;}}
      if(drag>=0)target=b.target(angle,pointer.x,pointer.y);
      if(state==='JOGANDO'){
        let leftovers=false;for(let i=0;i<5;i++)if(remaining[i]>0)leftovers=true;
        surplus=left===right&&drag<0&&finite&&leftovers;
        if(surplus&&!notified){if(message<=0){message=2;status.textContent='Use todas as joias!';}notified=true;}
        else if(!surplus)notified=false;
        if(left===right&&drag<0&&(finite?!leftovers&&placed>0:placed>0)){settled+=dt;if(settled>=ALGEBRA.ASSENTA_S)success();}else settled=0;
      }
      if(state==='SUCESSO'&&elapsed>=(phase===1?1.8:1))change(phase===data.fases.length-1?'PISCAR':'ESCURECER');
      else if(state==='ESCURECER'&&elapsed>=.4)change('TITULO');
      else if(state==='TITULO'&&elapsed>=1){phase++;setup();}
      else if(state==='PISCAR'&&elapsed>=.8)change('VOAR_CHAVE');
      else if(state==='VOAR_CHAVE'&&elapsed>=1.2)change('CHAVE');
      else if(state==='COLETAR'&&elapsed>=.45)change('SAIR');
      else if(state==='SAIR'&&elapsed>=.4)close(true);
      // A chave nasce no cristal e desce em coordenadas de design até o centro do palco.
      if(state==='VOAR_CHAVE'){const t=1-(1-Math.min(1,elapsed/1.2))**3;keyX=b.px+(512-b.px)*t;keyY=b.py+(290-b.py)*t;}
      else if(state==='CHAVE'){keyX=512;keyY=290+(calm?0:Math.sin(elapsed*3)*4);}
      else if(state==='COLETAR')keyY=290-(calm?0:65*(1-(1-Math.min(1,elapsed/.45))**3));
    }
    function sprite(name,x,y,w,h){const img=art[name];if(img)ctx.drawImage(img,x,y,w,h);else{ctx.fillStyle='#8b7550';ctx.fillRect(x,y,w,h);}}
    function text(value,x,y,size=18,color='#fff'){ctx.font=`bold ${size}px ${font}`;ctx.fillStyle=color;ctx.fillText(value,x,y);}
    function stone(type,x,y,size,base=false,pop=1){const img=art[type],w=img?.naturalWidth||60,h=img?.naturalHeight||70,k=size/Math.max(w,h)*pop;ctx.save();ctx.translate(x,y);sprite(type,-w*k/2,base?-h*k:-h*k/2,w*k,h*k);ctx.restore();}
    function dot(x,y,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();}
    function draw(){ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#101820';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.setTransform(s,0,0,s,0,offset);ctx.imageSmoothingEnabled=false;ctx.textAlign='center';
      sprite('fundo_vila',0,0,1024,572);sprite('coluna',453,123.5,236*scale,509*scale);
      const n=b.frame(angle)*4,img=art.travessa_frames;if(img)ctx.drawImage(img,frames[n],frames[n+1],353,160,b.px-176.5,b.py-80,353,160);else{ctx.save();ctx.translate(b.px,b.py);ctx.rotate(angle*Math.PI/180);ctx.fillStyle='#f1b74e';ctx.fillRect(-176,-6,352,12);ctx.restore();}
      if(left===right){ctx.globalAlpha=calm?.65:state==='PISCAR'?.55+.4*Math.cos(elapsed*12):.6+Math.sin(time*3)*.15;ctx.drawImage(glow,b.px-38,b.py-38,76,76);ctx.globalAlpha=1;}
      for(let side=0;side<2;side++){const gx=b.hookX(angle,side),gy=b.hookY(angle,side),x=b.panX(angle,side),y=b.panY(angle,side);
        for(let ring=0;ring<2;ring++){const a=ring?layout.prato.anel_dir:layout.prato.anel_esq,ax=x+a[0]*scale,ay=y+a[1]*scale;
          // Sprite vertical: atan2(-dx,dy) aponta ao anel; comprimento ajustado pela distância.
          ctx.save();ctx.translate(gx,gy);ctx.rotate(Math.atan2(-(ax-gx),ay-gy));sprite('corrente',-12,0,24,Math.hypot(ax-gx,ay-gy));ctx.restore();}
        if(state==='SUCESSO'){ctx.globalAlpha=calm?.35:.35+.1*Math.sin(time*4);ctx.drawImage(glow,x+31.75,y+6.25,140,70);ctx.globalAlpha=1;}
        if(drag>=0&&target===side){ctx.save();ctx.shadowColor='#b5f5ff';ctx.shadowBlur=18;ctx.fillStyle='#8ee8ff55';ctx.fillRect(x-8,y-8,219.5,102);ctx.restore();}sprite('prato',x,y,407*scale,172*scale);
        for(let slot=0;slot<8;slot++)for(let i=0;i<17;i++){const p=items[i];if(p.side===side&&p.slot===slot)stone(p.type,b.cellX(angle,side,slot),b.cellY(angle,side,slot),p.type==='caixa_misteriosa'?38:34,true,calm?1:1+.13*Math.sin(p.pop/.2*Math.PI));}}
      sprite('bandeja',190,424,958*scale,280*scale);
      for(let i=0;i<5;i++){const slot=layout.bandeja.slots[i],x=190+slot[0]*scale,y=424+slot[1]*scale;const empty=finite&&remaining[i]===0;ctx.globalAlpha=empty?.35:available(types[i])?1:.3;ctx.filter=empty?'grayscale(1)':'none';stone(types[i],x,y,46);ctx.filter='none';ctx.globalAlpha=1;
        if(finite){ctx.fillStyle='#152638eb';ctx.fillRect(x+2,y+15,34,22);text('x'+remaining[i],x+19,y+32,15);}
        if(surplus&&remaining[i]>0){ctx.globalAlpha=calm?.8:.45+.35*Math.sin(time*9);ctx.strokeStyle='#ffdf62';ctx.lineWidth=3;ctx.strokeRect(x-31,y-31,62,62);ctx.globalAlpha=1;}if(window.MOSTRAR_PESOS&&i<4){ctx.fillStyle='#1a2534';ctx.fillRect(x+10,y-27,20,20);text(b.weight(types[i],null),x+20,y-12,14);}}
      ctx.fillStyle='#152638dd';ctx.fillRect(156,8,690,45);text(f.missao,501,37);
      for(let i=0;i<3;i++){ctx.save();ctx.globalAlpha=i<completed?1:.3;if(i<completed){ctx.shadowColor='#62c9ff';ctx.shadowBlur=12;}stone('safira',30+i*35,31,26);ctx.restore();}
      if(message>0){ctx.globalAlpha=calm?1:Math.max(0,Math.min(1,message/.3,(2-message)/.2));ctx.fillStyle='#152638ed';ctx.fillRect(307,337,410,40);text('Use todas as joias!',512,364,21);ctx.globalAlpha=1;}
      if(state==='SUCESSO'){ctx.fillStyle='#152638e8';ctx.fillRect(322,294,380,phase===1?86:60);text('Equilibrou!',512,333,30,'#ffe28a');if(phase===1)text(`A caixa pesava ${f.peso_caixa}!`,512,363,23,'#fff0bd');}
      for(let i=0;i<24;i++){const j=i*7;if(particles[j+4]>0){ctx.globalAlpha=Math.max(0,particles[j+4]/particles[j+5]);ctx.fillStyle=particles[j+6]?'#ffdf73':'#d3dfee';ctx.fillRect(particles[j],particles[j+1],particles[j+6]?4:6,particles[j+6]?4:6);}}ctx.globalAlpha=1;
      if(isDebug()){dot(b.px,b.py,'#ff3b6d');for(let side=0;side<2;side++){dot(b.hookX(angle,side),b.hookY(angle,side),'#3bff93');for(let ring=0;ring<2;ring++){const a=ring?layout.prato.anel_dir:layout.prato.anel_esq;dot(b.panX(angle,side)+a[0]*scale,b.panY(angle,side)+a[1]*scale,'#ffdb36');}for(let slot=0;slot<8;slot++)dot(b.cellX(angle,side,slot),b.cellY(angle,side,slot),'#db73ff');}for(let i=0;i<5;i++)dot(190+layout.bandeja.slots[i][0]*scale,424+layout.bandeja.slots[i][1]*scale,'#3fffff');dot(pointer.x,pointer.y,'#fff');text(`pesoEsq: ${left} · pesoDir: ${right} · ${stockLabel} · ${surplus?'sobras':settled>0?`assentando ${settled.toFixed(1)}/${ALGEBRA.ASSENTA_S}`:left===right?'equilibrada':'desequilibrada'}`,512,544,13);text(`Ponteiro: ${pointer.x.toFixed(1)}, ${pointer.y.toFixed(1)} · ${angle.toFixed(1)}° · N resolve`,512,563,14);}
      if(state==='VOAR_CHAVE'||state==='CHAVE'||state==='COLETAR'){
        const h=64,w=h*(art.chave?.naturalWidth||229)/(art.chave?.naturalHeight||482);
        ctx.save();ctx.globalAlpha=state==='COLETAR'?Math.max(0,1-elapsed/.45):1;ctx.drawImage(glow,keyX-48,keyY-48,96,96);sprite('chave',keyX-w/2,keyY-h/2,w,h);
        if(state==='CHAVE'){ctx.strokeStyle='#c7eeff';ctx.lineWidth=document.activeElement===buttons[2]?4:2;ctx.beginPath();ctx.arc(keyX,keyY,calm?36:36+Math.sin(elapsed*4)*4,0,Math.PI*2);ctx.stroke();}ctx.restore();
      }
      if(state==='CHAVE'){ctx.fillStyle='#152638e8';ctx.fillRect(305,346,414,46);text('Pegue a Chave de Álgebra!',512,375,23);}
      if(state==='ESCURECER'||state==='TITULO'||state==='SAIR'){ctx.globalAlpha=state==='TITULO'?1:Math.min(1,elapsed/.4);ctx.fillStyle='#101820';ctx.fillRect(0,0,1024,572);ctx.globalAlpha=1;if(state==='TITULO')text(`Fase ${phase+2} de ${data.fases.length}`,512,286,32);}
      ctx.fillStyle='#152638dc';ctx.fillRect(920,12,44,40);text('×',942,41,30);if(state==='JOGANDO'){ctx.fillStyle='#152638dc';ctx.fillRect(866,12,44,40);ctx.strokeStyle='#fff';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(888,32,11,.3,Math.PI*1.9);ctx.stroke();ctx.beginPath();ctx.moveTo(893,18);ctx.lineTo(899,29);ctx.lineTo(886,27);ctx.stroke();const helpImg=art[helpPressed?'btn_ajuda_pressionado':'btn_ajuda_normal'];if(helpImg)ctx.drawImage(helpImg,814,12,40,40);else{ctx.fillStyle='#152638dc';ctx.fillRect(812,12,44,40);text('?',834,39,24);}}
      ctx.fillStyle='#152638dc';ctx.fillRect(758,12,44,40);
      const gearImg=art.btn_engrenagem;
      if(gearImg)ctx.drawImage(gearImg,766,18,28,28);
      else text('⚙',780,39,24);
      if(document.activeElement===buttons[4]){ctx.strokeStyle='#ffe591';ctx.lineWidth=2.5;ctx.strokeRect(758,12,44,40);}
      if(drag>=0){ctx.fillStyle='#10182055';ctx.beginPath();ctx.ellipse(pointer.x,pointer.y+25,22,6,0,0,Math.PI*2);ctx.fill();stone(items[drag].type,pointer.x,pointer.y,46*1.15);}
    }
    function loop(stamp){if(closed)return;if(paused){last=stamp;raf=requestAnimationFrame(loop);return;}const dt=last?Math.min(.05,(stamp-last)/1000):0;last=stamp;update(dt);if(closed)return;draw();raf=requestAnimationFrame(loop);}
    buttons[0].onclick=()=>{if(!claimed)close(false);};buttons[1].onclick=()=>{if(state==='JOGANDO')setup();};buttons[2].onclick=collect;
    buttons[3].onpointerdown=()=>{helpPressed=true;};buttons[3].onpointerup=()=>{helpPressed=false;};buttons[3].onpointerleave=()=>{helpPressed=false;};
    buttons[3].onclick=()=>{if(state==='JOGANDO'){cancel();window.TutorialCard?.abrir?.('algebra',{onFechar:()=>canvas.focus()});}};
    buttons[4].onclick=()=>openSettings();
    canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('lostpointercapture',cancel);document.addEventListener('keydown',key,true);window.addEventListener('resize',resize);current=close;
    window.ActivePuzzle = { type: 'algebra', close: () => close(false), pause: () => { paused = true; }, resume: () => { paused = false; }, get active() { return Boolean(current); } };
    setup();if(isDebug())stockTest();resize();
    const tutorialAbriu=window.TutorialCard?.verificarEabrir?.('algebra',{onFechar:()=>canvas.focus()});
    if(!tutorialAbriu)canvas.focus();
    raf=requestAnimationFrame(loop);
  }
  return {prepare,open,close:()=>close(false),pause:()=>{paused=true;},resume:()=>{paused=false;},get active(){return Boolean(current);}};
})();
