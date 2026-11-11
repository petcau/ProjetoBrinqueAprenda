/* Cena isolada de ponte: não usa nem modifica os puzzles antigos. */
window.GeometriaPuzzle = (() => {
  'use strict';
  let data,catalog,ready,current;const images=new Map(),dash=[6,5],solid=[];
  // Lógica pura, também disponível no console: GeometriaPuzzle.selfTest().
  function selfTest(input=data) {
    const results=[],expected=[{}, {'01':'2,0 2,1 1,1 1,2'}, {'05':'0,0 0,1 1,1 1,2 2,2','04':'4,2 3,3 4,3'}];
    let prepared;
    try{prepared=Polyomino.prepare(input);}catch(error){console.error(`[Geometria] FALHOU: ${error.message}`);return false;}
    for(let index=0;index<prepared.cycles.length;index++) {
      const cycle=prepared.cycles[index],{cols,rows}=cycle,board=new Int8Array(cols*rows).fill(-1),ids=new Set();
      let ok=Array.isArray(cycle.travadas);
      for(const pose of cycle.travadas||[]) {
        const shape=prepared.pieces[pose.id]?.rotations[pose.rotation],cells=[];
        if(!shape||!Number.isInteger(pose.col)||!Number.isInteger(pose.row)||ids.has(pose.id)||!cycle.pieces.includes(pose.id)||!Polyomino.valid(board,cols,rows,shape,pose.col,pose.row)){ok=false;continue;}
        ids.add(pose.id);
        for(let j=0;j<shape.cells.length;j+=2){const x=pose.col+shape.cells[j],y=pose.row+shape.cells[j+1];board[y*cols+x]=1;cells.push(`${x},${y}`);if(cycle.solution[y][x]!==pose.id)ok=false;}
        if(cells.sort().join(' ')!==(expected[index]?.[pose.id]||'').split(' ').sort().join(' '))ok=false;
      }
      if(ids.size!==Object.keys(expected[index]||{}).length)ok=false;
      const free=cycle.pieces.filter(id=>!ids.has(id));
      const shapes=free.map(id=>{const seen=new Set();return prepared.pieces[id].rotations.filter(r=>{const key=r.rows.join('/');if(seen.has(key))return false;seen.add(key);return true;});});
      function search(depth) {
        if(depth===free.length)return board.includes(-1)?0:1;
        let count=0;
        for(const shape of shapes[depth])for(let row=0;row<=rows-shape.h;row++)for(let col=0;col<=cols-shape.w;col++) {
          if(!Polyomino.valid(board,cols,rows,shape,col,row))continue;
          for(let j=0;j<shape.cells.length;j+=2)board[(row+shape.cells[j+1])*cols+col+shape.cells[j]]=1;
          count+=search(depth+1);
          for(let j=0;j<shape.cells.length;j+=2)board[(row+shape.cells[j+1])*cols+col+shape.cells[j]]=-1;
        }
        return count;
      }
      const count=search(0);ok=ok&&count>=1;results.push(ok);
      console.info(`[Geometria] Ponte ${index+1}: ${ok?'PASSOU':'FALHOU'}; travadas: ${ids.size}; soluções: ${count} (só rotações)`);
    }
    return results.every(Boolean);
  }
  function image(src) {
    if(!src)return Promise.resolve(null);
    if(images.has(src))return images.get(src);
    const pending=new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>{console.warn(`[Geometria] Ausente: ${src}; usando alternativa local ou placeholder.`);resolve(null);};img.src=src;});
    images.set(src,pending);return pending;
  }
  function prepare(input) {
    return ready ||= (async()=>{
      data=input;
      try{catalog=Polyomino.prepare(data);}catch(error){console.error(`[Geometria] ${error.message}`);ready=null;throw error;}
      if(!selfTest(data))throw Error('Geometria: autoteste das pontes falhou');
      const entries=Object.values(catalog.pieces);
      await Promise.all(entries.map(async p=>{p.image=await image(p.sprite);}));
      const bg=await image(data.background);data.bg=bg||await image(data.backgroundFallback);
      data.keyImage=await image(data.key);data.hero=await image(`assets/${HERO_SHEET.src}`);data.side=await image('assets/personagem/personagem-lado.png');
      data.btnHelpNormal=await image('assets/tutorial/botao-ajuda-normal.webp');data.btnHelpPressed=await image('assets/tutorial/botao-ajuda-pressionado.webp');
      data.btnGear=await image('assets/hud/configuracoes.png');
    })();
  }
  function open(options) {
    if(current)current();
    const m=data.metrics,host=document.createElement('div'),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
    const exit=document.createElement('button'),help=document.createElement('button'),restart=document.createElement('button'),settingsBtn=document.createElement('button'),frameHost=document.createElement('div');
    let helpPressed=false,paused=false;
    host.style.cssText='position:fixed;inset:0;z-index:1000;background:#10131d;display:flex;justify-content:center;';
    frameHost.style.cssText='position:relative;height:100%;';canvas.style.cssText='display:block;width:100%;height:100%;touch-action:none;';canvas.tabIndex=0;
    canvas.setAttribute('aria-label','Geometria: monte a ponte. Clique para girar; arraste para encaixar; R gira ao arrastar; Escape sai.');
    host.setAttribute('role','dialog');host.setAttribute('aria-modal','true');host.setAttribute('aria-label','Ponte de peças');
    exit.setAttribute('aria-label','Sair da ponte');help.setAttribute('aria-label','Ajuda: como jogar');restart.setAttribute('aria-label','Reiniciar ponte');settingsBtn.setAttribute('aria-label','Configurações');settingsBtn.title='Configurações';
    for(const b of [exit,help,restart,settingsBtn]){b.style.cssText='position:absolute;background:transparent;color:transparent;border:0;border-radius:10px;cursor:pointer;';frameHost.appendChild(b);}
    frameHost.prepend(canvas);host.appendChild(frameHost);document.body.appendChild(host);
    const particles=new Float32Array(24*5),hero={moving:false,walk:0,idle:0};
    const pointer={x:0,y:0},grab={id:-1,index:-1,x:0,y:0,startX:0,startY:0,time:0,moved:0,rotation:0,drag:false,col:0,row:0,valid:false};
    const calm=window.matchMedia('(prefers-reduced-motion: reduce)').matches||Boolean(window.GameSettings?.calm);
    let cycleIndex=0,cycle,board,pieces,cell,left,state='JOGANDO',elapsed=0,last=0,raf=0,walkX=1100,walkTime=0,closed=false,s=1,offset=0;
    const turn=Math.PI/2,ease=t=>1-(1-t)**3;
    function openSettings(){if(paused)return;paused=true;if(grab.id!==-1)cancel({pointerId:grab.id});if(window.openSettings)window.openSettings(settingsBtn,()=>{paused=false;settingsBtn.focus();});else if(window.SettingsBook){window.SettingsBook.open('index');document.getElementById('book-dialog')?.showModal();}}
    function change(next){state=next;elapsed=0;restart.disabled=next!=='JOGANDO';}
    function resize() {
      const w=Math.min(window.innerWidth,window.innerHeight*m.WIDTH/m.HEIGHT),dpr=Math.min(2,window.devicePixelRatio||1);
      frameHost.style.width=`${w}px`;canvas.width=Math.round(w*dpr);canvas.height=Math.round(window.innerHeight*dpr);
      s=canvas.width/m.WIDTH;offset=(canvas.height-m.HEIGHT*s)/2;
      const hudBtns=[exit,help,restart,settingsBtn],hudX=[20,1136,1204,1068];
      for(let i=0;i<4;i++){const b=hudBtns[i];b.style.left=`${hudX[i]*w/m.WIDTH}px`;b.style.top=`${(offset/s+16)*w/m.WIDTH}px`;b.style.width=`${56*w/m.WIDTH}px`;b.style.height=`${50*w/m.WIDTH}px`;}
    }
    function animate(p,x,y,size,angle,duration=.12) {
      p.fx=p.x;p.fy=p.y;p.fs=p.size;p.fa=p.angle;p.tx=x;p.ty=y;p.ts=size;p.ta=angle;p.anim=0;p.duration=calm?0:duration;
    }
    function layout() {
      let width=0,count=0;for(const p of pieces)if(!p.locked){width+=p.def.rotations[p.r].w*m.TRAY_CELL;count++;}
      const gap=Math.min(56,(m.TRAY_RIGHT-m.TRAY_LEFT-width)/(count+1));let x=(m.TRAY_LEFT+m.TRAY_RIGHT-width-gap*(count-1))/2;
      for(const p of pieces)if(!p.locked){const r=p.def.rotations[p.r];p.homeX=x+r.w*m.TRAY_CELL/2;p.homeY=m.TRAY_BOTTOM-r.h*m.TRAY_CELL/2;x+=r.w*m.TRAY_CELL+gap;}
    }
    function setup() {
      cycle=catalog.cycles[cycleIndex];cell=Math.min((m.GAP_RIGHT-m.GAP_LEFT)/cycle.cols,(m.BOTTOM-m.SLOT_Y0)/cycle.rows);left=m.CENTER_X-cycle.cols*cell/2;
      board=new Int8Array(cycle.cols*cycle.rows).fill(-1);
      pieces=cycle.pieces.map(id=>({id,def:catalog.pieces[id],locked:cycle.travadas.some(p=>p.id===id),r:Math.floor(Math.random()*4),placed:false,x:0,y:0,size:m.TRAY_CELL,angle:0,duration:0,anim:0,pop:0}));
      for(let i=pieces.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)),p=pieces[i];pieces[i]=pieces[j];pieces[j]=p;}
      layout();for(const p of pieces)if(!p.locked){p.x=p.homeX;p.y=p.homeY;p.angle=p.r*turn;}
      for(const pose of cycle.travadas){const i=pieces.findIndex(p=>p.id===pose.id),p=pieces[i];p.r=pose.rotation;fill(i,pose.col,pose.row);p.x=p.tx;p.y=p.ty;p.size=p.ts;p.angle=p.ta;p.duration=0;p.pop=0;}
      grab.index=-1;grab.id=-1;particles.fill(0);walkX=1100;walkTime=0;hero.walk=0;change('JOGANDO');
    }
    function remove(index){if(pieces[index].locked)return;for(let i=0;i<board.length;i++)if(board[i]===index)board[i]=-1;}
    function fill(index,col,row) {
      const p=pieces[index],r=p.def.rotations[p.r];p.placed=true;p.col=col;p.row=row;
      // A matriz rotacionada escreve o índice da peça; os espaços vazios não ocupam a grade.
      for(let i=0;i<r.cells.length;i+=2)board[(row+r.cells[i+1])*cycle.cols+col+r.cells[i]]=index;
      animate(p,left+(col+r.w/2)*cell,m.SLOT_Y0+(row+r.h/2)*cell,cell,p.r*turn);p.pop=.18;
    }
    function complete() {
      if(board.includes(-1))return;change('BRILHO');
      for(let i=0;i<24;i++){const j=i*5;particles[j]=left+(i/24)*cell*cycle.cols;particles[j+1]=m.SLOT_Y0+Math.random()*cell*cycle.rows;particles[j+2]=(Math.random()-.5)*50;particles[j+3]=-30-Math.random()*70;particles[j+4]=.5;}
    }
    function project(event) {
      const rect=canvas.getBoundingClientRect();
      // client → pixels reais do canvas → design: dx=((clientX-left)*width/rect.width)/s.
      // Em y, descontamos também a margem de centralização vertical antes de dividir por s.
      pointer.x=((event.clientX-rect.left)*canvas.width/rect.width)/s;
      pointer.y=(((event.clientY-rect.top)*canvas.height/rect.height)-offset)/s;
    }
    function candidate() {
      const p=pieces[grab.index],r=p.def.rotations[p.r];
      grab.col=Math.round((pointer.x-grab.x*cell-left)/cell);grab.row=Math.round((pointer.y-grab.y*cell-m.SLOT_Y0)/cell);
      grab.valid=Polyomino.valid(board,cycle.cols,cycle.rows,r,grab.col,grab.row);
    }
    function hit(p) {
      const r=p.def.rotations[p.r],x=Math.floor((pointer.x-p.x)/p.size+r.w/2),y=Math.floor((pointer.y-p.y)/p.size+r.h/2);
      return y>=0&&y<r.h&&x>=0&&x<r.w&&r.rows[y][x]==='#';
    }
    function down(event) {
      if(paused||window.TutorialCard?.isAberto?.())return;
      if(state!=='JOGANDO'||grab.id!==-1||event.button>0)return;event.preventDefault();project(event);canvas.focus();
      for(let i=pieces.length-1;i>=0;i--)if(!pieces[i].locked&&hit(pieces[i])) {
        const p=pieces[i],r=p.def.rotations[p.r];grab.id=event.pointerId;grab.index=i;grab.x=(pointer.x-p.x)/p.size+r.w/2;grab.y=(pointer.y-p.y)/p.size+r.h/2;
        grab.startX=event.clientX;grab.startY=event.clientY;grab.time=performance.now();grab.moved=0;grab.rotation=p.r;grab.drag=false;canvas.setPointerCapture(event.pointerId);break;
      }
    }
    function move(event) {
      if(grab.id!==event.pointerId)return;event.preventDefault();project(event);grab.moved=Math.max(grab.moved,Math.hypot(event.clientX-grab.startX,event.clientY-grab.startY));
      const p=pieces[grab.index],r=p.def.rotations[p.r];
      if(!grab.drag&&(grab.moved>=8||performance.now()-grab.time>=250)){grab.drag=true;remove(grab.index);animate(p,p.x,p.y,cell,p.angle);}
      if(grab.drag){p.tx=pointer.x+(r.w/2-grab.x)*cell;p.ty=pointer.y+(r.h/2-grab.y)*cell;candidate();}
    }
    function restore(p) {
      p.r=grab.rotation;
      const r=p.def.rotations[p.r];
      if(p.placed){fill(grab.index,p.col,p.row);p.pop=0;p.duration=calm?0:.18;}
      else animate(p,p.homeX,p.homeY,m.TRAY_CELL,p.r*turn,.18);
      if(p.placed){p.tx=left+(p.col+r.w/2)*cell;p.ty=m.SLOT_Y0+(p.row+r.h/2)*cell;}
    }
    function release(event) {
      if(grab.id!==event.pointerId)return;move(event);const p=pieces[grab.index];
      if(!grab.drag&&performance.now()-grab.time<250&&grab.moved<8){
        if(p.placed){remove(grab.index);p.placed=false;animate(p,p.homeX,p.homeY,m.TRAY_CELL,p.r*turn,.18);}
        else {p.r=(p.r+1)%4;layout();for(const other of pieces)if(!other.placed)animate(other,other.homeX,other.homeY,m.TRAY_CELL,other===p?p.angle+turn:other.r*turn);}
      }else if(grab.drag&&grab.valid)fill(grab.index,grab.col,grab.row);else restore(p);
      const id=grab.id;grab.id=-1;grab.index=-1;grab.drag=false;if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);complete();
    }
    function cancel(event) {
      if(grab.id!==event.pointerId)return;restore(pieces[grab.index]);const id=grab.id;grab.id=-1;grab.index=-1;grab.drag=false;if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);
    }
    function reset(){if(state!=='JOGANDO')return;if(grab.id!==-1)cancel({pointerId:grab.id});setup();canvas.focus();}
    function solve() {
      if(grab.id!==-1)cancel({pointerId:grab.id});for(let i=0;i<pieces.length;i++)remove(i);
      for(const placement of cycle.placements){const i=pieces.findIndex(p=>p.id===placement.id);if(pieces[i].locked)continue;pieces[i].r=placement.rotation;fill(i,placement.col,placement.row);}complete();
    }
    function key(event) {
      if(window.TutorialCard?.isAberto?.())return;
      if(event.ctrlKey||event.altKey||event.metaKey)return;
      const k=event.key.toLowerCase();
      if(k==='tab'){event.preventDefault();event.stopImmediatePropagation();const list=[exit,settingsBtn,help,restart].filter(b=>!b.disabled);const idx=list.indexOf(document.activeElement);const next=list[(idx+1)%list.length]||exit;next.focus();return;}
      if((event.target===exit||event.target===help||event.target===restart||event.target===settingsBtn)&&(k==='enter'||k===' ')){event.preventDefault();event.stopImmediatePropagation();if(!event.repeat){if(event.target===exit)close(false);else if(event.target===settingsBtn)openSettings();else if(event.target===help)window.TutorialCard?.abrir?.('geometria',{onFechar:()=>canvas.focus()});else reset();}return;}
      event.preventDefault();event.stopImmediatePropagation();if(event.repeat)return;
      if(k==='escape'){openSettings();return;}
      if(paused)return;
      if(k==='f3'){options.toggleDebug();return;}
      if(state!=='JOGANDO')return;
      if(k==='n'&&options.debug())solve();
      if(k==='r'&&grab.drag){const p=pieces[grab.index],r=p.def.rotations[p.r],x=grab.x;grab.x=r.h-grab.y;grab.y=x;p.r=(p.r+1)%4;const next=p.def.rotations[p.r];animate(p,pointer.x+(next.w/2-grab.x)*cell,pointer.y+(next.h/2-grab.y)*cell,cell,p.angle+turn);candidate();}
    }
    function close(complete=false) {
      if(closed)return;closed=true;cancelAnimationFrame(raf);
      if(window.ActivePuzzle?.type==='geometria')window.ActivePuzzle=null;
      if(window.TutorialCard?.isAberto?.())window.TutorialCard.fechar();
      window.GameAudio?.stopGeometryMusic?.();
      canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',release);canvas.removeEventListener('pointercancel',cancel);canvas.removeEventListener('lostpointercapture',cancel);
      document.removeEventListener('keydown',key,true);window.removeEventListener('resize',resize);host.remove();current=null;options.onExit(complete);
    }
    function update(dt) {
      if(paused||window.TutorialCard?.isAberto?.())return;
      elapsed+=dt;
      for(let i=0;i<pieces.length;i++) {
        const p=pieces[i];p.anim=Math.min(p.duration,p.anim+dt);const t=p.duration?ease(p.anim/p.duration):1;
        if(p.duration){p.x=p.fx+(p.tx-p.fx)*t;p.y=p.fy+(p.ty-p.fy)*t;p.size=p.fs+(p.ts-p.fs)*t;p.angle=p.fa+(p.ta-p.fa)*t;}
        if(grab.index===i&&grab.drag&&p.anim>=p.duration){p.x=p.tx;p.y=p.ty;}p.pop=Math.max(0,p.pop-dt);
      }
      if(state==='BRILHO'){for(let i=0;i<24;i++){const j=i*5;particles[j]+=particles[j+2]*dt;particles[j+1]+=particles[j+3]*dt;particles[j+4]-=dt;}if(elapsed>=.5)change('TRAVESSIA');}
      else if(state==='TRAVESSIA'){
        walkTime+=dt;hero.walk=Math.floor(walkTime*60)+1;walkX=Math.max(cycleIndex===catalog.cycles.length-1?150:330,walkX-m.WALK_SPEED*dt);
        if(walkX<=330&&cycleIndex<catalog.cycles.length-1)change('ESCURECER');else if(walkX===150)change('PEGAR');
      }else if(state==='PEGAR'&&elapsed>=.6)change('CHAVE');
      else if(state==='CHAVE'&&elapsed>=.5)change('COLETAR');
      else if(state==='COLETAR'&&elapsed>=.4)close(true);
      else if(state==='ESCURECER'&&elapsed>=.4)change('TITULO');
      else if(state==='TITULO'&&elapsed>=1){cycleIndex++;setup();}
    }
    function piece(p) {
      const base=p.def.rotations[0],pop=calm?1:1+.06*Math.sin(p.pop/.18*Math.PI),size=p.size*pop;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);
      // Recorta também sprites opacos: os vazios da matriz nunca cobrem outra peça.
      ctx.beginPath();for(let i=0;i<base.cells.length;i+=2)ctx.rect((base.cells[i]-base.w/2)*size,(base.cells[i+1]-base.h/2)*size,size,size);ctx.clip();
      if(p.def.image)ctx.drawImage(p.def.image,-base.w*size/2,-base.h*size/2,base.w*size,base.h*size);
      else {ctx.fillStyle='#a66beb';ctx.strokeStyle='#eed7ff';for(let i=0;i<base.cells.length;i+=2){const x=(base.cells[i]-base.w/2)*size,y=(base.cells[i+1]-base.h/2)*size;ctx.fillRect(x,y,size,size);ctx.strokeRect(x+1,y+1,size-2,size-2);}}
      if(p.locked){ctx.fillStyle='rgba(0,0,0,0.18)';ctx.fillRect(-base.w*size/2,-base.h*size/2,base.w*size,base.h*size);}
      ctx.restore();
    }
    function draw() {
      ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#10131d';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.setTransform(s,0,0,s,0,offset);ctx.imageSmoothingEnabled=false;
      if(data.bg)ctx.drawImage(data.bg,0,0,m.WIDTH,m.HEIGHT);
      else {ctx.fillStyle='#775033';ctx.fillRect(0,0,1280,714);ctx.fillStyle='#211d2d';ctx.fillRect(m.GAP_LEFT,m.SLOT_Y0,m.GAP_RIGHT-m.GAP_LEFT,m.BOTTOM-m.SLOT_Y0);ctx.fillRect(5,618,1270,92);}
      ctx.lineWidth=2;ctx.setLineDash(dash);
      for(let y=0;y<cycle.rows;y++)for(let x=0;x<cycle.cols;x++){ctx.fillStyle='#10152699';ctx.fillRect(left+x*cell,m.SLOT_Y0+y*cell,cell,cell);ctx.strokeStyle='#eee4d49a';ctx.strokeRect(left+x*cell+2,m.SLOT_Y0+y*cell+2,cell-4,cell-4);}ctx.setLineDash(solid);
      if(grab.drag){const p=pieces[grab.index],r=p.def.rotations[p.r];ctx.fillStyle=grab.valid?'#4dff8590':'#ff435b90';for(let i=0;i<r.cells.length;i+=2)ctx.fillRect(left+(grab.col+r.cells[i])*cell,m.SLOT_Y0+(grab.row+r.cells[i+1])*cell,cell,cell);}
      for(let i=0;i<pieces.length;i++)if(i!==grab.index)piece(pieces[i]);if(grab.index>=0){ctx.globalAlpha=grab.drag ? .8 : 1;piece(pieces[grab.index]);ctx.globalAlpha=1;}
      if(options.debug()) {
        ctx.strokeStyle='#66e5ff';ctx.lineWidth=4;
        for(let y=0;y<cycle.rows;y++)for(let x=0;x<cycle.cols;x++)if(board[y*cycle.cols+x]>=0&&pieces[board[y*cycle.cols+x]].locked)ctx.strokeRect(left+x*cell+5,m.SLOT_Y0+y*cell+5,cell-10,cell-10);
        ctx.fillStyle='#10131de6';ctx.fillRect(92,16,390,42);ctx.fillStyle='#fff';ctx.font='20px monospace';ctx.textAlign='left';ctx.fillText(`Ponte ${cycleIndex+1} | travadas: ${cycle.travadas.length}`,104,44);
      }
      if(state==='BRILHO'){
        ctx.save();ctx.beginPath();ctx.rect(left,m.SLOT_Y0,cell*cycle.cols,cell*cycle.rows);ctx.clip();ctx.fillStyle='#fff8d77a';ctx.fillRect(left-70+elapsed*2*(cell*cycle.cols+70),m.SLOT_Y0,70,cell*cycle.rows);ctx.restore();
        ctx.fillStyle='#fff3b9';for(let i=0;i<24;i++){const j=i*5;ctx.globalAlpha=Math.max(0,particles[j+4]*2);ctx.fillRect(particles[j],particles[j+1],4,4);}ctx.globalAlpha=1;
      }
      if(cycleIndex===catalog.cycles.length-1&&state!=='COLETAR') {
        ctx.save();ctx.globalAlpha=state==='CHAVE'?Math.max(0,1-elapsed*2):1;const y=m.WALK_Y-32-(state==='CHAVE'?elapsed*90:calm?0:Math.sin(elapsed*2)*4);
        if(data.keyImage)ctx.drawImage(data.keyImage,133,y-60,34,60);else {ctx.fillStyle='#c693ff';ctx.fillRect(138,y-48,24,48);}ctx.restore();
      }
      const hs=HERO_SHEET,scale=m.CHAR_H/hs.frameH,col=HeroAnimation.column(hero,calm),walking=state==='TRAVESSIA';
      ctx.save();ctx.translate(walkX,m.WALK_Y);ctx.scale(-1,1);
      if(data.hero)ctx.drawImage(data.hero,(walking?col:HeroAnimation.IDLE)*hs.frameW,2*hs.frameH,hs.frameW,hs.frameH,-hs.pivotX*scale,-hs.pivotY*scale,hs.frameW*scale,hs.frameH*scale);
      else if(data.side)ctx.drawImage(data.side,-50,-m.CHAR_H,100,m.CHAR_H);else {ctx.fillStyle='#efad75';ctx.fillRect(-30,-m.CHAR_H,60,m.CHAR_H);}ctx.restore();
      if(state==='PEGAR'&&!calm){ctx.strokeStyle='#f8ddff';ctx.lineWidth=5;ctx.beginPath();ctx.arc(150,m.WALK_Y-90,20+elapsed*35,0,Math.PI*2);ctx.stroke();}
      ctx.fillStyle='#171829bb';ctx.beginPath();ctx.roundRect(552,16,176,50,12);ctx.fill();
      for(let i=0;i<catalog.cycles.length;i++){ctx.beginPath();ctx.arc(640+(i-(catalog.cycles.length-1)/2)*42,41,12,0,Math.PI*2);ctx.fillStyle=i<cycleIndex||i===cycleIndex&&state!=='JOGANDO'?'#ae6af0':'#161523';ctx.fill();ctx.strokeStyle=i===cycleIndex?'#e4bdff':'#776880';ctx.lineWidth=3;ctx.stroke();}
      for(let i=0;i<2;i++){ctx.fillStyle='#171829c9';ctx.beginPath();ctx.roundRect(i?1204:20,16,56,50,10);ctx.fill();if(document.activeElement===(i?restart:exit)){ctx.strokeStyle='#ffe59a';ctx.stroke();}}
      ctx.fillStyle='#fff';ctx.font='bold 30px system-ui';ctx.textAlign='center';ctx.fillText('×',48,52);
      ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(1232,41,13,.3,Math.PI*1.9);ctx.stroke();
      ctx.beginPath();ctx.moveTo(1246,28);ctx.lineTo(1248,41);ctx.lineTo(1235,37);ctx.closePath();ctx.fill();
      const helpImg=helpPressed?data.btnHelpPressed:data.btnHelpNormal;
      if(helpImg)ctx.drawImage(helpImg,1139,16,50,50);
      else{ctx.fillStyle='#171829c9';ctx.beginPath();ctx.roundRect(1136,16,56,50,10);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 26px system-ui';ctx.textAlign='center';ctx.fillText('?',1164,50);}
      if(document.activeElement===help){ctx.strokeStyle='#ffe59a';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(1136,16,56,50,10);ctx.stroke();}
      ctx.fillStyle='#171829c9';ctx.beginPath();ctx.roundRect(1068,16,56,50,10);ctx.fill();
      const gearImg=data.btnGear;
      if(gearImg)ctx.drawImage(gearImg,1082,27,28,28);
      else{ctx.fillStyle='#fff';ctx.font='bold 22px system-ui';ctx.textAlign='center';ctx.fillText('⚙',1096,49);}
      if(document.activeElement===settingsBtn){ctx.strokeStyle='#ffe59a';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(1068,16,56,50,10);ctx.stroke();}
      if(state==='ESCURECER'||state==='TITULO'||state==='COLETAR'){
        ctx.fillStyle='#10131d';ctx.globalAlpha=state==='TITULO'?1:Math.min(1,elapsed/.4);ctx.fillRect(0,0,m.WIDTH,m.HEIGHT);ctx.globalAlpha=1;
        if(state==='TITULO'){ctx.fillStyle='#fff';ctx.font='bold 36px system-ui';ctx.fillText(`Ponte ${cycleIndex+2} de ${catalog.cycles.length}`,640,357);}
      }
    }
    function loop(time){if(closed)return;if(paused){last=time;raf=requestAnimationFrame(loop);return;}const dt=last?Math.min(.05,(time-last)/1000):0;last=time;update(dt);if(closed)return;draw();raf=requestAnimationFrame(loop);}
    exit.onclick=()=>close(false);restart.onclick=reset;
    help.onpointerdown=()=>{helpPressed=true;};help.onpointerup=()=>{helpPressed=false;};help.onpointerleave=()=>{helpPressed=false;};
    help.onclick=()=>{if(grab.id!==-1)cancel({pointerId:grab.id});window.TutorialCard?.abrir?.('geometria',{onFechar:()=>canvas.focus()});};
    settingsBtn.onclick=()=>openSettings();
    canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('lostpointercapture',cancel);
    document.addEventListener('keydown',key,true);window.addEventListener('resize',resize);
    current=close;
    window.ActivePuzzle = { type: 'geometria', close: () => close(false), pause: () => { paused = true; }, resume: () => { paused = false; }, get active() { return Boolean(current); } };
    resize();setup();
    const tutorialAbriu=window.TutorialCard?.verificarEabrir?.('geometria',{onFechar:()=>canvas.focus()});
    if(!tutorialAbriu)canvas.focus();
    raf=requestAnimationFrame(loop);
  }
  return {prepare,open,selfTest,close:()=>close(false),pause:()=>{paused=true;},resume:()=>{paused=false;},get active(){return Boolean(current);}};
})();
