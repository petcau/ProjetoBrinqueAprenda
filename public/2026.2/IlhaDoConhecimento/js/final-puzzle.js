/* Finale: topo, resgate, portal e encerramento; mesma pausa/dev.open dos puzzles novos. */
window.FinalPuzzle = (() => {
  'use strict';
  const art={},sizes=[],missing=[],cache=new Map();
  let ready,data,geometry,current;
  function load(name,src,w,h,expected) {
    if(!cache.has(src))cache.set(src,new Promise(resolve=>{
      const im=new Image();
      im.onload=()=>{
        const iw=im.naturalWidth,ih=im.naturalHeight;
        sizes.push({name,actual:[iw,ih],expected:expected||[iw,ih]});
        if(expected&&iw!==expected[0]&&Math.abs(iw-expected[0])<=1)console.warn(`[Finale] ${name}: largura ${iw}px; proporção original preservada.`);
        if(!w&&!h){w=iw*data.gato.escala*TOPO_CAGE_SCALE;h=ih*data.gato.escala*TOPO_CAGE_SCALE;}else{if(!w)w=h*iw/ih;if(!h)h=w*ih/iw;}
        const c=document.createElement('canvas');c.width=Math.ceil(w*2);c.height=Math.ceil(h*2);
        const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(im,0,0,c.width,c.height);
        art[name]={canvas:c,w,h};
        if(name==='fechada'||name==='aberta'){
          // O PNG tem piso opaco: separamos o primeiro plano em memória para o piso não cobrir o gato.
          // Não lemos pixels (compatível com file://); as grades e argolas originais ficam por cima.
          const f=document.createElement('canvas');f.width=c.width;f.height=c.height;const z=f.getContext('2d'),kx=f.width/iw,ky=f.height/ih,shift=name==='aberta'?36:0;z.imageSmoothingEnabled=false;
          z.drawImage(c,0,0);z.scale(kx,ky);
          if(name==='aberta')z.clearRect(140+shift,300,159,178);
          else {
            for(const x of [140,192,253])for(const row of [[300,27],[365,55],[454,24]])z.clearRect(x,row[0],x===140?31:x===192?44:46,row[1]);
            for(const r of [[147,340,32,47],[237,340,22,47],[272,340,22,47],[147,430,32,43],[272,430,22,43]])z.drawImage(im,...r,...r);
          }
          art[name+'Frente']={canvas:f,w,h};
        }
        resolve(im);
      };
      im.onerror=()=>{missing.push(name);console.warn(`[Finale] Ausente: ${src}. Placeholder ativado.`);art[name]={canvas:null,w:w||30,h:h||40};resolve(null);};im.src=src;
    }));
    return cache.get(src);
  }
  function prepare(input) {return ready ||= (async()=>{
    data=input;geometry=FinalLogic.layout(data);const j=data.jaula,g=geometry,k=j.largura*TOPO_CAGE_SCALE/190;
    const tasks=[load('bg','assets/final/topo_bg.png',1024,572,[1024,572]),load('fechada','assets/final/jaula_fechada.png',g.cage.w,g.cage.h,j.sprite),load('aberta','assets/final/jaula_aberta.png',g.open.w,g.open.h,j.aberta)];
    for(const mood of ['triste','esperanca','feliz'])tasks.push(load(mood,`assets/final/gatos/gato_${mood}.png`,0,0).then(im=>{
      if(mood!=='feliz')return;const h=data.final.alturaGato,w=h*(im?im.naturalWidth/im.naturalHeight:305/412),c=document.createElement('canvas');c.width=Math.ceil(w*2);c.height=Math.ceil(h*2);
      if(im){const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(im,0,0,c.width,c.height);}art.finalCat={canvas:im?c:null,w,h};
    }));
    tasks.push(load('anel','assets/final/portal_anel.png',data.portal.largura,0,[461,444]),load('redemoinho','assets/final/portal_redemoinho.png',data.portal.largura*data.portal.redemoinho,0,[439,448]));
    for(const name of ['halo','brilhoPortal','noite']){
      const c=document.createElement('canvas'),night=name==='noite';c.width=night?1024:560;c.height=night?572:560;const x=c.getContext('2d');
      const gradient=night?x.createLinearGradient(0,0,0,572):x.createRadialGradient(280,280,0,280,280,280);
      gradient.addColorStop(0,night?'#0b1440':name==='halo'?'#ffda7fdd':'#c58bffbb');gradient.addColorStop(1,night?'#3b1d6e':name==='halo'?'#ffda7f00':'#a855f700');x.fillStyle=gradient;x.fillRect(0,0,c.width,c.height);art[name]={canvas:c,w:night?1024:280,h:night?572:280};
    }
    for(const p of data.cadeados) {
      tasks.push(load(p.id,`assets/hud/chave_${p.id}.png`,0,data.barra.altura));
      for(const state of ['fechado','aberto'])tasks.push(load(`${p.id}_${state}`,`assets/final/cadeados/cadeado_${p.cor}_${state}.png`,0,data.cadeadoAltura*TOPO_CAGE_SCALE,[110,state==='fechado'?177:194]));
    }
    tasks.push(load('sheet',`assets/${HERO_SHEET.src}`,480,224,[192,448]).then(im=>{
      art.hero=[];if(!im)return;
      const k=data.menina.altura*TOPO_HERO_SCALE/HERO_SHEET.frameH;
      for(let row=0;row<4;row++)for(let col=0;col<10;col++) {
        const c=document.createElement('canvas');c.width=Math.ceil(48*k*2);c.height=Math.ceil(56*k*2);
        const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(im,col*48,row*56,48,56,0,0,c.width,c.height);art.hero.push(c);
      }
    }));
    await Promise.all(tasks);
    const errors=FinalLogic.selfTest(data,sizes);
    for(const mood of ['triste','esperanca','feliz']){const a=art[mood];if(a.canvas&&(a.w<58*k||a.w>65*k||a.h<76*k||a.h>83*k))errors.push(`dimensões inesperadas do gato ${mood}`);}
    console[errors.length?'error':'info'](`[Finale] Autoteste: ${errors.join('; ')||'OK — tamanhos, alinhamento da cabeça e 4 cadeados dentro da jaula.'}${missing.length?' Placeholders: '+missing.join(', '):''}`);
  })().catch(error=>{ready=null;throw error;});}
  function open(options={}) {
    if(current)current();
    const d=data,g=geometry,L=FinalLogic,state=options.state,sceneScale=d.jaula.largura*TOPO_CAGE_SCALE/190;state.cadeados ||= {};
    const heroStop=[TOPO_HERO_X,TOPO_HERO_Y];
    window.ActivePuzzle = {
      type: 'final',
      close: () => close(),
      pause: () => {},
      resume: () => {},
      get active() { return !closed; }
    };
    const returnFocus=document.activeElement,host=document.createElement('div'),frame=document.createElement('div'),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
    const mission=document.createElement('p'),status=document.createElement('p'),style=document.createElement('style'),finalCopy=document.createElement('div'),homeCopy=document.createElement('p');
    host.className='finale';host.style.cssText='position:fixed;inset:0;z-index:1000;background:#101527;display:flex;justify-content:center;';frame.style.cssText='position:relative;height:100%;';
    host.setAttribute('role','dialog');host.setAttribute('aria-modal','true');host.setAttribute('aria-label','Libertar o gato');
    canvas.tabIndex=0;canvas.style.cssText='display:block;width:100%;height:100%;touch-action:none;';
    mission.style.cssText='position:absolute;top:8px;left:50%;transform:translateX(-50%);margin:0;padding:8px 14px;background:#111b32df;color:#fff5d7;border-radius:10px;text-align:center;max-width:70%;font:inherit;pointer-events:none;';
    status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.className='visually-hidden';
    style.textContent='.finale button{font:inherit;cursor:pointer;color:#fff5d7}.finale button:focus-visible{outline:3px solid #ffe591!important;outline-offset:2px}.finale .final-control{position:absolute;min-height:44px;min-width:44px;border:2px solid #e5c278;border-radius:10px;background:#1c2d4aef;padding:6px 12px}.finale .final-control:hover{background:#41597a}.finale .final-lock{position:absolute;padding:0;border:0;background:transparent;touch-action:manipulation}.finale .final-lock:hover{box-shadow:0 0 8px #ffe591;border-radius:6px}';
    finalCopy.hidden=homeCopy.hidden=true;finalCopy.style.cssText='position:absolute;top:6%;left:5%;width:90%;text-align:center;color:#fff5d7;pointer-events:none;';
    const title=document.createElement('h1'),subtitle=document.createElement('p');title.textContent='Parabéns!';title.style.cssText='margin:0 0 12px;color:#ffe194;font-size:clamp(32px,5.7vw,58px);line-height:1.15;';
    subtitle.textContent='Você libertou o gato e salvou a Ilha do Conhecimento!';subtitle.style.cssText='margin:0 auto;max-width:850px;font-size:clamp(15px,2.3vw,24px);line-height:1.4;';finalCopy.append(title,subtitle);
    homeCopy.textContent='Os dois voltaram para casa pelo portal.';homeCopy.style.cssText='position:absolute;left:5%;width:90%;margin:0;text-align:center;color:#f1dfef;font-size:clamp(14px,1.8vw,18px);line-height:1.4;pointer-events:none;';
    frame.append(canvas,mission,status,finalCopy,homeCopy);host.append(style,frame);document.body.appendChild(host);
    const controls=[],rects=g.locks.map(r=>({x:r.x-r.w/2,y:r.y,w:r.w,h:r.h})),targets=rects.map(r=>({...r})),slots=[],debugPoints=[];
    function button(label,cls,action){const b=document.createElement('button');b.type='button';b.className=cls;b.setAttribute('aria-label',label);b.onclick=action;frame.appendChild(b);controls.push(b);return b;}
    const exit=button('Sair do topo e voltar à ilha','final-control',()=>close());exit.textContent='X';exit.style.cssText+='right:8px;top:8px;';
    for(let i=0;i<4;i++)button(`Abrir cadeado de ${d.cadeados[i].regiao}`,'final-lock',()=>unlock(i));
    const next=button('[DEV] Continuar para o encerramento','final-control',()=>change('FINAL'));next.textContent='[DEV] Continuar para o encerramento';next.hidden=true;next.style.cssText+='left:50%;bottom:12px;transform:translateX(-50%);max-width:85%;';
    const replay=button('Jogar de novo','final-control',restart);replay.textContent='Jogar de novo';replay.hidden=true;replay.style.cssText+='left:50%;bottom:6%;transform:translateX(-50%);width:240px;max-width:85%;font-size:20px;';
    const skip=button('Pular ▶','final-control',()=>home());skip.textContent='Pular ▶';skip.hidden=true;skip.style.cssText+='right:16px;bottom:16px;';
    const font=getComputedStyle(document.body).fontFamily,calm=matchMedia('(prefers-reduced-motion: reduce)').matches||Boolean(window.GameSettings?.get('calm'));
    const hero={x:d.menina.entrada[0],y:d.menina.entrada[1],dir:3,walk:0,idle:0},flightPoint={x:0,y:0},cat={x:g.cat.x,y:g.cat.y},catTarget={x:d.gato.livre[0],y:d.gato.livre[1]};
    const particles=new Float32Array(24*6),shake=new Float32Array(4);
    const stars=new Float32Array(d.final.estrelas*4),confetti=new Float32Array(d.final.confetes*6),confettiColors=['#ffe194','#ff93bb','#93e1ff','#ba9dff','#a0f4b9'];
    for(let i=0;i<stars.length;i+=4){stars[i]=Math.random()*1024;stars[i+1]=Math.random();stars[i+2]=.6+Math.random()*1.4;stars[i+3]=Math.random()*Math.PI*2;}
    for(let i=0;i<confetti.length;i+=6){confetti[i]=Math.random()*1024;confetti[i+1]=Math.random();confetti[i+2]=22+Math.random()*45;confetti[i+3]=Math.random()*Math.PI*2;confetti[i+4]=i/6%5;confetti[i+5]=4+Math.random()*4;}
    const heroRoute=[{x:heroStop[0],y:heroStop[1]},{x:d.caminhoFinal[0],y:d.caminhoFinal[1]},{x:d.portal.centro[0],y:d.portal.centro[1]}];
    const catRoute=[catTarget,heroRoute[1],heroRoute[2]],heroLength=L.routeLength(heroRoute),catLength=L.routeLength(catRoute);
    // Mesmo percurso após o desvio: a diferença entre as distâncias mantém o gato 40 px atrás.
    const catDelay=Math.hypot(heroRoute[1].x-heroRoute[0].x,heroRoute[1].y-heroRoute[0].y)+d.portal.distanciaGato-Math.hypot(catTarget.x-heroRoute[1].x,catTarget.y-heroRoute[1].y);
    let s=1,offset=0,width=1024,phase='ENTRAR',elapsed=0,time=0,last=0,raf=0,closed=false,debug=false,flying=-1,flyTime=0,celebrated=false,notice='',noticeTime=0,heroScale=1,catScale=1,whiteDrawn=false,restarting=false,finalHeight=572,finalCatX=512;
    // Referências exclusivas desta abertura: não entram no cache permanente do topo.
    const slides=d.slides.map(item=>({...item,image:null,lines:[],duration:Math.max(FINAL_MIN_MS,Math.min(FINAL_MAX_MS,item.text.length*FINAL_MS_PER_CHAR))}));
    const room={image:null},ending=d.encerramento;let slideIndex=0,homeFrom=0,musicStarted=false,loaded=0,settled=0,roomReady=false,textSize=24,textFont='';
    function preload(target,src,isRoom=false){const image=new Image();target.image=image;
      const done=ok=>{if(closed)return;if(!ok){target.image=null;console.warn('Final: imagem ausente, usando placeholder:',src);}else if(isRoom)roomReady=true;else loaded++;
        if(++settled===5)console.info(`final: slides ${loaded}/4 carregados, fim_quarto: ${roomReady?'ok':'placeholder'}`);
        image.onload=image.onerror=null;};
      image.onload=()=>done(true);image.onerror=()=>done(false);image.src=src;
    }
    for(const slide of slides)preload(slide,slide.img);preload(room,ending.img,true);
    function fullScreen(){return phase==='STORY'||phase==='HOME'||phase==='RESTART';}
    function beginMusic(){if(musicStarted)return;musicStarted=true;window.Music?.definirLugar?.('final');}
    function story(){phase='STORY';elapsed=0;slideIndex=0;mission.hidden=exit.hidden=next.hidden=replay.hidden=finalCopy.hidden=homeCopy.hidden=true;skip.hidden=false;
      beginMusic();resize();say(slides[0].text);skip.focus();syncButtons();}
    function home(){if(phase==='HOME'||phase==='RESTART')return;homeFrom=elapsed*1000;phase='HOME';elapsed=0;state.jogoConcluido=true;particles.fill(0);
      mission.hidden=exit.hidden=next.hidden=skip.hidden=replay.hidden=homeCopy.hidden=true;finalCopy.hidden=false;
      title.textContent=ending.title;subtitle.textContent=ending.subtitle;replay.textContent=ending.button;
      beginMusic();resize();say(`${ending.title} ${ending.subtitle}`);canvas.focus();syncButtons();}
    function layoutSlides(){textSize=Math.max(16,Math.min(34,canvas.height*.04))*(window.GameSettings?.get('largeText')?1.2:1);textFont=`700 ${textSize}px ${font}`;ctx.font=textFont;
      for(const slide of slides){slide.lines.length=0;let line='';for(const word of slide.text.split(/\s+/)){const next=line?line+' '+word:word;
        if(line&&ctx.measureText(next).width>canvas.width*.88){slide.lines.push(line);line=word;}else line=next;}if(line)slide.lines.push(line);}
    }
    function cover(image,zoom=1){if(!image?.naturalWidth)return;
      // Cover escolhe o maior fator; multiplicar por (1 + Z*t/T) amplia até Z sem expor bordas.
      const scale=Math.max(canvas.width/image.naturalWidth,canvas.height/image.naturalHeight)*zoom,w=image.naturalWidth*scale,h=image.naturalHeight*scale;
      ctx.drawImage(image,(canvas.width-w)/2,(canvas.height-h)/2,w,h);
    }
    function slideDraw(i,t,alpha=1){const slide=slides[i];ctx.globalAlpha=alpha;if(!slide.image?.naturalWidth){ctx.fillStyle='#101018';ctx.fillRect(0,0,canvas.width,canvas.height);}
      cover(slide.image,1+(calm?0:FINAL_ZOOM)*Math.min(1,t/slide.duration));
      const h=(slide.lines.length*1.3+1)*textSize,y=canvas.height-h-Math.max(72,canvas.height*.1);
      ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(0,y,canvas.width,h);ctx.font=textFont;ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';
      for(let n=0;n<slide.lines.length;n++)ctx.fillText(slide.lines[n],canvas.width/2,y+textSize*(1.15+n*1.3));ctx.globalAlpha=1;
    }
    function storyDraw(){ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;
      if(phase==='STORY'){slideDraw(slideIndex,elapsed*1000);const fade=Math.max(0,elapsed*1000-slides[slideIndex].duration);
        if(slideIndex<slides.length-1&&fade>0)slideDraw(slideIndex+1,fade,Math.min(1,fade/FINAL_FADE_MS));
        if(slideIndex===0&&elapsed*1000<FINAL_FADE_MS){ctx.fillStyle='#000';ctx.globalAlpha=1-elapsed*1000/FINAL_FADE_MS;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.globalAlpha=1;}
      }else{const alpha=Math.min(1,elapsed*1000/600);
        // O fundo antigo permanece como reserva, inclusive seu confete leve.
        if(room.image?.naturalWidth){ctx.fillStyle='#101018';ctx.fillRect(0,0,canvas.width,canvas.height);cover(room.image);confettiDraw();}else finalScreen();
        ctx.setTransform(1,0,0,1,0,0);if(alpha<1)slideDraw(slideIndex,homeFrom,1-alpha);finalCopy.style.opacity=alpha;
      }
    }
    let slotX=d.barra.x+12;
    for(let i=0;i<4;i++){const a=art[d.cadeados[i].id];slots.push({x:slotX+a.w/2,y:d.barra.y+d.barra.altura/2+10});slotX+=a.w+d.barra.espaco;}
    const bar={x:d.barra.x,y:d.barra.y,w:slotX-d.barra.x+4,h:d.barra.altura+20};
    function point(x,y,label){debugPoints.push({x,y,label:`${label} (${x.toFixed(1)}, ${y.toFixed(1)})`});}
    point(...d.jaula.base,'Jaula');point(g.cat.x,g.cat.y,'Gato dentro');point(...d.gato.livre,'Gato livre');point(...d.portal.centro,'Portal');point(...d.menina.entrada,'Entrada');point(...heroStop,'Parada');point(bar.x,bar.y,'Barra');
    for(let i=0;i<4;i++)point(g.locks[i].x,g.locks[i].y,d.cadeados[i].cor);
    const allOpen=()=>d.cadeados.every(p=>state.cadeados[p.id]);
    const isDebug=()=>options.debug?options.debug():debug;
    function say(text){status.textContent=text;}
    function change(p){phase=p;elapsed=0;mission.textContent=p==='LIBERTAR'?'O gato está livre!':p==='PORTAL'||p==='BRANCO'?'Vamos voltar para casa!':'Abra os 4 cadeados!';say(p==='FINAL'?`${title.textContent} ${subtitle.textContent} ${homeCopy.textContent}`:mission.textContent);
      const end=p==='FINAL',white=p==='BRANCO';mission.hidden=end||white;exit.hidden=end||white;replay.hidden=!end;finalCopy.hidden=homeCopy.hidden=!end;next.hidden=true;
      if(p==='PORTAL'){hero.x=heroRoute[0].x;hero.y=heroRoute[0].y;cat.x=catTarget.x;cat.y=catTarget.y;heroScale=catScale=1;hero.walk=0;}
      if(p==='BRANCO'){heroScale=catScale=0;whiteDrawn=false;}
      if(end){state.jogoConcluido=true;particles.fill(0);replay.focus();}syncButtons();
    }
    function restart(){if((phase!=='HOME'&&phase!=='FINAL')||replay.hidden||restarting)return;restarting=true;replay.disabled=true;phase='RESTART';elapsed=0;window.Music?.definirLugar?.('menu');
      // Todo o progresso da aventura vive em memória; recarregar também zera os estados privados dos puzzles e a posição.
      // localStorage contém apenas preferências: não há progresso salvo para apagar.
      // A recarga ocorre no loop, depois dos 600 ms do fade de áudio.
    }
    function syncButtons(){for(let i=0;i<4;i++){controls[i+1].disabled=phase!=='CADEADOS'||flying>=0||Boolean(state.cadeados[d.cadeados[i].id]);controls[i+1].hidden=Boolean(state.cadeados[d.cadeados[i].id]);}}
    function resize(){width=fullScreen()?window.innerWidth:Math.min(window.innerWidth,window.innerHeight*1024/572);frame.style.width=`${width}px`;const ratio=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(width*ratio);canvas.height=Math.round(window.innerHeight*ratio);s=canvas.width/1024;offset=(canvas.height-572*s)/2;
      const k=width/1024,top=offset/s*k,short=window.innerHeight<480;finalHeight=canvas.height/s;finalCatX=short?790:512;
      // Em paisagem baixa, texto/botão à esquerda e gato à direita evitam sobreposição no rodapé.
      finalCopy.style.left=homeCopy.style.left=short?'4%':'5%';finalCopy.style.width=homeCopy.style.width=short?'55%':'90%';finalCopy.style.top=short?'4%':'6%';
      title.style.fontSize=short?'28px':'clamp(32px,5.7vw,58px)';title.style.marginBottom=short?'6px':'12px';subtitle.style.fontSize=short?'14px':'clamp(15px,2.3vw,24px)';
      homeCopy.style.top=short?'auto':`calc(52% + ${d.final.alturaGato/2*k+20}px)`;homeCopy.style.bottom=short?'calc(6% + 56px)':'auto';replay.style.left=short?'31.5%':'50%';replay.style.maxWidth=short?'52%':'85%';
      // s usa pixels físicos; corrigir pelo DPR garante 44 px CSS reais: 44 * DPR / s.
      const minDesign=44*(canvas.width/width)/s,splitX=d.jaula.base[0],splitY=(Math.max(rects[0].y+rects[0].h,rects[1].y+rects[1].h)+Math.min(rects[2].y,rects[3].y))/2;
      for(let i=0;i<4;i++){const r=rects[i],t=targets[i],b=controls[i+1];t.w=Math.max(r.w+12,minDesign);t.h=Math.max(r.h+12,minDesign);
        // Expansão para fora dos quatro quadrantes: alvos grandes sem cobrir uns aos outros.
        t.x=i===0||i===2?Math.min(r.x+(r.w-t.w)/2,splitX-t.w):Math.max(r.x+(r.w-t.w)/2,splitX);
        t.y=i<2?Math.min(r.y+(r.h-t.h)/2,splitY-t.h):Math.max(r.y+(r.h-t.h)/2,splitY);
        b.style.left=`${t.x*k}px`;b.style.top=`${top+t.y*k}px`;b.style.width=`${t.w*k}px`;b.style.height=`${t.h*k}px`;}
      if(fullScreen()){
        finalCopy.style.cssText='position:absolute;inset:0;width:100%;height:100%;text-align:center;color:#fff5d7;pointer-events:none;';
        title.style.cssText+=`;position:absolute;left:50%;top:${FINAL_TITLE_Y*100}%;transform:translate(-50%,-50%);margin:0;width:90%;padding:2px 6px;background:rgba(0,0,0,.5);`;
        subtitle.style.cssText+=`;position:absolute;left:50%;top:${FINAL_SUBTITLE_Y*100}%;transform:translate(-50%,-50%);margin:0;width:90%;padding:2px 6px;background:rgba(0,0,0,.5);`;
        replay.style.left='50%';replay.style.top=`${FINAL_BUTTON_Y*100}%`;replay.style.bottom='auto';replay.style.transform='translate(-50%,-50%)';replay.style.height='44px';replay.style.maxWidth='85%';
      }layoutSlides();
    }
    function burst(x,y,hearts=false){for(let i=0;i<24;i++){const j=i*6;particles[j]=x;particles[j+1]=y;particles[j+2]=(Math.random()-.5)*100*sceneScale;particles[j+3]=(-25-Math.random()*85)*sceneScale;particles[j+4]=1.2;particles[j+5]=hearts&&i%3===0?1:0;}}
    function unlock(i){if(phase!=='CADEADOS'||flying>=0||state.cadeados[d.cadeados[i].id])return;
      const p=d.cadeados[i];if(!state.keys[p.id]){shake[i]=.45;notice=`Falta a chave de ${p.regiao}`;noticeTime=2.5;say(notice);return;}
      flying=i;flyTime=0;syncButtons();canvas.focus();
    }
    function down(event){event.preventDefault();const r=canvas.getBoundingClientRect();
      // Ponteiro → pixels do canvas → design: dx desfaz CSS/DPR e s; dy também desconta a centralização vertical.
      const dx=((event.clientX-r.left)*canvas.width/r.width)/s,dy=(((event.clientY-r.top)*canvas.height/r.height)-offset)/s;
      for(let i=0;i<4;i++)if(L.hit(targets[i],dx,dy)){unlock(i);break;}
    }
    function key(event){if(event.ctrlKey||event.altKey||event.metaKey)return;const k=event.key.toLowerCase();event.stopImmediatePropagation();
      if(fullScreen()&&(k==='escape'||k===' '||k==='enter')){event.preventDefault();if(!event.repeat){if(phase==='STORY')home();else if(k==='enter')restart();}return;}
      if(k==='tab'){event.preventDefault();let i=controls.indexOf(document.activeElement),step=event.shiftKey?-1:1;for(let n=0;n<controls.length;n++){i=(i+step+controls.length)%controls.length;if(!controls[i].hidden&&!controls[i].disabled){controls[i].focus();break;}}return;}
      if((k==='enter'||k===' ')&&controls.includes(event.target))return;
      event.preventDefault();if(event.repeat)return;
      if(k==='escape')close();else if(k==='f3'){if(options.toggleDebug)options.toggleDebug();else debug=!debug;}
      else if((k==='g'||k==='j')&&isDebug()){for(const p of d.cadeados){state.keys[p.id]=true;state.cadeados[p.id]=true;}flying=-1;if(k==='g')story();else home();}
      else if(k==='n'&&isDebug()){
        if(phase==='ENTRAR'){hero.x=heroStop[0];hero.y=heroStop[1];hero.walk=0;hero.dir=2;change('CADEADOS');}
        else if(phase==='CADEADOS'&&flying<0){const i=d.cadeados.findIndex(p=>!state.cadeados[p.id]);if(i<0){phase='WAIT_LOCKS';elapsed=0;beginMusic();}else unlock(i);}
        else if(phase==='LIBERTAR'){elapsed=2.5;}else if(phase==='PORTAL')change('BRANCO');else if(phase==='BRANCO')change('FINAL');
      }
    }
    function keyup(event){event.stopImmediatePropagation();}
    function close(message=''){if(closed)return;closed=true;if(window.ActivePuzzle?.type==='final')window.ActivePuzzle=null;cancelAnimationFrame(raf);canvas.removeEventListener('pointerdown',down);document.removeEventListener('keydown',key,true);document.removeEventListener('keyup',keyup,true);document.removeEventListener('visibilitychange',blur);window.removeEventListener('resize',resize);window.removeEventListener('blur',blur);for(const b of controls)b.onclick=null;
      for(const slide of [...slides,room]){if(slide.image)slide.image.onload=slide.image.onerror=null;slide.image=null;}slides.length=0;window.Music?.definirLugar?.('exploracao');host.remove();current=null;returnFocus?.focus();options.onExit?.(false,message);}
    function blur(){last=0;}
    function update(dt){time+=dt;elapsed+=dt;noticeTime=Math.max(0,noticeTime-dt);for(let i=0;i<4;i++)shake[i]=Math.max(0,shake[i]-dt);
      if(phase==='WAIT_LOCKS'&&elapsed*1000>=FINAL_AFTER_LOCKS_MS){phase='DARK';elapsed=0;mission.hidden=exit.hidden=true;}
      if(phase==='DARK'&&elapsed*1000>=FINAL_FADE_MS)story();
      if(phase==='STORY'&&elapsed*1000>=slides[slideIndex].duration+(slideIndex===slides.length-1?0:FINAL_FADE_MS)){
        if(slideIndex===slides.length-1)home();else{elapsed=Math.max(0,elapsed-slides[slideIndex].duration/1000);slideIndex++;say(slides[slideIndex].text);}}
      if(phase==='HOME'&&elapsed*1000>=FINAL_BUTTON_DELAY_MS&&replay.hidden){replay.hidden=false;replay.focus();}
      if(phase==='RESTART'&&elapsed>=.6){close();window.location.reload();return;}
      if(phase==='ENTRAR'){
        const dx=heroStop[0]-hero.x,dy=heroStop[1]-hero.y,len=Math.hypot(dx,dy),step=Math.min(180*dt,len);
        if(len>.01){hero.x+=dx/len*step;hero.y+=dy/len*step;hero.dir=Math.abs(dy)>Math.abs(dx)?3:1;hero.walk=Math.max(1,hero.walk+dt*60);}
        if(len<=step+.01){hero.walk=0;hero.dir=2;change('CADEADOS');}
      }else hero.idle+=dt*60;
      if(flying>=0){flyTime+=dt;const p=d.cadeados[flying];
        if(flyTime>=.5&&!state.cadeados[p.id]){state.cadeados[p.id]=true;burst(g.locks[flying].x,g.locks[flying].y);say(`Cadeado de ${p.regiao} aberto!`);syncButtons();if(allOpen()){phase='WAIT_LOCKS';elapsed=0;beginMusic();}}
        if(flyTime>=.9){flying=-1;syncButtons();}
      }
      // LEGADO: remover na limpeza final. LIBERTAR/PORTAL/BRANCO não recebem mais o fluxo normal.
      if(phase==='LIBERTAR'){
        const t=Math.max(0,Math.min(1,(elapsed-.6)/.65));L.flight(cat,g.cat,catTarget,t,calm?0:70);
        if(t>=1&&!celebrated){celebrated=true;burst(cat.x,cat.y-40,true);}
        if(elapsed>=2.5){cat.x=d.gato.livre[0];cat.y=d.gato.livre[1];change('PORTAL');}
      }
      if(phase==='PORTAL'){
        const distance=Math.max(0,elapsed-d.portal.crescer)*d.portal.velocidade,behind=Math.max(0,distance-catDelay);
        const heroDone=L.walkRoute(hero,heroRoute,distance),catDone=L.walkRoute(cat,catRoute,behind);
        hero.walk=!heroDone&&distance>0?Math.max(1,hero.walk+dt*60):0;
        heroScale=heroDone?Math.max(0,1-(distance-heroLength)/d.portal.velocidade/d.portal.encolher):1;
        catScale=catDone?Math.max(0,1-(behind-catLength)/d.portal.velocidade/d.portal.encolher):1;
        if(heroScale===0&&catScale===0)change('BRANCO');
      }else if(phase==='BRANCO'&&whiteDrawn)change('FINAL');
      if((phase==='HOME'||phase==='FINAL')&&!calm)for(let i=0;i<confetti.length;i+=6){confetti[i+1]+=confetti[i+2]*dt/finalHeight;confetti[i]+=Math.sin(time+confetti[i+3])*12*dt;confetti[i+3]+=dt;if(confetti[i+1]>1.04){confetti[i+1]=-.04;confetti[i]=(confetti[i]+173)%1024;}}
      for(let i=0;i<24;i++){const j=i*6;if(particles[j+4]<=0)continue;particles[j+4]-=dt;particles[j]+=particles[j+2]*dt;particles[j+1]+=particles[j+3]*dt;particles[j+3]+=110*sceneScale*dt;}
    }
    function sprite(name,x,y,alpha=1,k=1,top=false){if(alpha<=0||k<=0)return;const a=art[name];ctx.save();ctx.globalAlpha=alpha;const w=a.w*k,h=a.h*k;
      if(a.canvas)ctx.drawImage(a.canvas,x-w/2,top?y:y-h,w,h);else{ctx.fillStyle='#f1c56c';ctx.fillRect(x-w/2,top?y:y-h,w,h);ctx.fillStyle='#17273c';ctx.font=`10px ${font}`;ctx.fillText(name,x,top?y+12:y-10);}ctx.restore();}
    function panel(x,y,w,h){ctx.fillStyle='#101b30de';ctx.beginPath();ctx.roundRect(x,y,w,h,10);ctx.fill();}
    function portal(){
      const grow=phase==='BRANCO'?1:Math.min(1,elapsed/d.portal.crescer),k=1-(1-grow)**3;if(k<=0)return;
      ctx.save();ctx.translate(d.portal.centro[0],d.portal.centro[1]);ctx.scale(k,k);
      sprite('brilhoPortal',0,140,calm?.6:.6+Math.sin(time*3)*.15);
      ctx.save();ctx.rotate(calm?0:time*d.portal.grausSegundo*Math.PI/180);sprite('redemoinho',0,art.redemoinho.h/2);ctx.restore();sprite('anel',0,art.anel.h/2);ctx.restore();
    }
    function finalScreen(){
      ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(art.noite.canvas,0,0,canvas.width,canvas.height);ctx.setTransform(s,0,0,s,0,0);
      for(let i=0;i<stars.length;i+=4){ctx.globalAlpha=calm?.7:.35+.65*(1+Math.sin(time*1.7+stars[i+3]))/2;ctx.fillStyle='#fff2d4';ctx.fillRect(stars[i],stars[i+1]*finalHeight,stars[i+2],stars[i+2]);}ctx.globalAlpha=1;
      const center=finalHeight*.52;sprite('halo',finalCatX,center+140,calm?.8:.8+Math.sin(time*1.5)*.1);sprite('finalCat',finalCatX,center+d.final.alturaGato/2);
      confettiDraw();
    }
    function confettiDraw(){ctx.save();ctx.setTransform(s,0,0,s,0,0);for(let i=0;i<confetti.length;i+=6){ctx.save();ctx.translate(confetti[i],confetti[i+1]*finalHeight);ctx.rotate(calm?confetti[i+3]:time+confetti[i+3]);ctx.fillStyle=confettiColors[confetti[i+4]];ctx.fillRect(-confetti[i+5]/2,-2,confetti[i+5],4);ctx.restore();}ctx.restore();}
    function draw(){ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#101527';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.setTransform(s,0,0,s,0,offset);ctx.imageSmoothingEnabled=false;ctx.textAlign='center';
      if(fullScreen()){storyDraw();return;}
      next.hidden=!isDebug()||phase!=='LIBERTAR'&&phase!=='PORTAL';
      if(phase==='FINAL'){finalScreen();return;}
      if(art.bg.canvas)ctx.drawImage(art.bg.canvas,0,0,1024,572);else{ctx.fillStyle='#666885';ctx.fillRect(0,0,1024,572);}
      const freed=phase==='LIBERTAR'||phase==='PORTAL'||phase==='BRANCO',opening=freed?phase==='LIBERTAR'?Math.min(1,elapsed/.4):1:0;
      if(phase==='PORTAL'||phase==='BRANCO')portal();
      sprite('fechada',g.cage.x+g.cage.w/2,d.jaula.base[1],1-opening);
      sprite('aberta',g.open.x+g.open.w/2,d.jaula.base[1],opening);
      sprite(!freed?'triste':celebrated?'feliz':'esperanca',cat.x,cat.y,1,catScale);
      sprite(art.fechadaFrente?'fechadaFrente':'fechada',g.cage.x+g.cage.w/2,d.jaula.base[1],1-opening);
      sprite(art.abertaFrente?'abertaFrente':'aberta',g.open.x+g.open.w/2,d.jaula.base[1],opening);
      for(let i=0;i<4;i++){
        const p=d.cadeados[i],r=g.locks[i],fall=i===flying&&flyTime>=.5,drop=fall?Math.min(1,(flyTime-.5)/.4):0;
        if(!state.cadeados[p.id]||fall)sprite(`${p.id}_${fall?'aberto':'fechado'}`,r.x+(calm?0:Math.sin(time*65)*shake[i]*6*sceneScale),r.y+30*sceneScale*drop,1-drop,fall&&!calm?1+Math.sin(drop*Math.PI)*.22:1,true);
      }
      const jump=phase==='LIBERTAR'&&!calm?Math.sin(Math.min(1,Math.max(0,(elapsed-1.05)/.5))*Math.PI)*14:0;
      const c=HeroAnimation.column(hero,calm),im=art.hero[hero.dir*10+c],k=d.menina.altura*TOPO_HERO_SCALE/HERO_SHEET.frameH*heroScale;
      if(heroScale>0){if(im)ctx.drawImage(im,hero.x-HERO_SHEET.pivotX*k,hero.y-HERO_SHEET.pivotY*k-jump,48*k,56*k);else{ctx.fillStyle='#ffdd92';ctx.fillRect(hero.x-14*heroScale,hero.y-78*heroScale-jump,28*heroScale,78*heroScale);}}
      panel(bar.x,bar.y,bar.w,bar.h);for(let i=0;i<4;i++)sprite(d.cadeados[i].id,slots[i].x,slots[i].y+d.barra.altura/2,state.cadeados[d.cadeados[i].id]?.35:1);
      if(flying>=0&&flyTime<.5){L.flight(flightPoint,slots[flying],g.locks[flying],flyTime/.5,calm?0:70);sprite(d.cadeados[flying].id,flightPoint.x,flightPoint.y+d.barra.altura/2);}
      ctx.font=`18px ${font}`;
      for(let i=0;i<24;i++){const j=i*6;if(particles[j+4]<=0)continue;ctx.globalAlpha=Math.min(1,particles[j+4]);ctx.fillStyle=particles[j+5]?'#ff9cba':'#ffe798';if(particles[j+5])ctx.fillText('♥',particles[j],particles[j+1]);else ctx.fillRect(particles[j],particles[j+1],(calm?2:4)*sceneScale,4*sceneScale);}ctx.globalAlpha=1;
      if(noticeTime>0){panel(270,435,484,40);ctx.fillStyle='#fff5d7';ctx.fillText(notice,512,461,460);}
      if(missing.length){ctx.fillStyle='#fff';ctx.font=`12px ${font}`;ctx.fillText('Placeholder: '+missing.join(', '),512,493,980);}
      if(isDebug()){
        ctx.strokeStyle='#64ffec';ctx.lineWidth=1;ctx.font='11px monospace';ctx.textAlign='left';ctx.fillStyle='#fff';
        ctx.strokeRect(g.cage.x,g.cage.y,g.cage.w,g.cage.h);ctx.strokeRect(g.open.x,g.open.y,g.open.w,g.open.h);ctx.strokeRect(bar.x,bar.y,bar.w,bar.h);
        for(const r of targets)ctx.strokeRect(r.x,r.y,r.w,r.h);ctx.fillRect(d.jaula.base[0]-2,d.jaula.base[1]-2,4,4);
        for(const p of debugPoints){ctx.beginPath();ctx.moveTo(p.x-5,p.y);ctx.lineTo(p.x+5,p.y);ctx.moveTo(p.x,p.y-5);ctx.lineTo(p.x,p.y+5);ctx.stroke();ctx.strokeStyle='#12202d';ctx.lineWidth=3;ctx.strokeText(p.label,p.x+7,p.y-5);ctx.fillText(p.label,p.x+7,p.y-5);ctx.strokeStyle='#64ffec';ctx.lineWidth=1;}
        ctx.fillStyle='#4ade80';ctx.beginPath();ctx.arc(hero.x,hero.y,3,0,Math.PI*2);ctx.fill();
        ctx.fillText(`F3 · N: cadeado · G: história · J: final · ${phase}`,16,85);ctx.textAlign='center';
      }
      if(phase==='ENTRAR'&&elapsed<.4){ctx.fillStyle=`rgba(0,0,0,${1-elapsed/.4})`;ctx.fillRect(0,0,1024,572);}
      if(phase==='DARK'){ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#000';ctx.globalAlpha=Math.min(1,elapsed*1000/FINAL_FADE_MS);ctx.fillRect(0,0,canvas.width,canvas.height);ctx.globalAlpha=1;}
      if(phase==='BRANCO'){const alpha=Math.min(1,elapsed/d.portal.branco);ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#fff';ctx.globalAlpha=alpha;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.globalAlpha=1;if(alpha===1)whiteDrawn=true;}
    }
    function loop(now){if(closed)return;const dt=!document.hidden&&last?Math.min(.05,(now-last)/1000):0;last=now;update(dt);if(closed)return;draw();raf=requestAnimationFrame(loop);}
    if(allOpen()){hero.x=heroStop[0];hero.y=heroStop[1];hero.dir=2;phase='WAIT_LOCKS';}else change('ENTRAR');
    current=close;resize();canvas.addEventListener('pointerdown',down);document.addEventListener('keydown',key,true);document.addEventListener('keyup',keyup,true);document.addEventListener('visibilitychange',blur);window.addEventListener('resize',resize);window.addEventListener('blur',blur);canvas.focus();raf=requestAnimationFrame(loop);
  }
  return {prepare,open,get active(){return Boolean(current);}};
})();
