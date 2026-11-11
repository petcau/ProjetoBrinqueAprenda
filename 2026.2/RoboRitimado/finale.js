(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const files = {
    ruins:'orbithop-ruinas-v14.png', encore:'orbithop-encore-v14.png', boss:'galactus-v14.png',
    pixel:'pixel-padrao-v1.png', walking:'pixel-backstage-v13.png',
    dressing:'orbithop-dressing-v13.png', backstage:'orbithop-backstage-v13.png'
  };
  const asset=key=>RR_SPRITES.load('assets/'+files[key]);
  const prepareArena=()=>Promise.all(['ruins','boss','pixel'].map(key=>asset(key).ready));
  const smooth = n => { n=Math.max(0,Math.min(1,n));return n*n*(3-2*n); };
  const mix = (a,b,p) => a+(b-a)*p;
  function surface(canvas,bounds,limit=Infinity) {
    const {width,height}=bounds||canvas.getBoundingClientRect();
    const dpr=Math.min(limit,RR_SETTINGS.dpr());
    const w=Math.max(1,Math.round(width*dpr)),h=Math.max(1,Math.round(height*dpr));
    if (canvas.width!==w || canvas.height!==h) { canvas.width=w;canvas.height=h; }
    const ctx=canvas.getContext('2d');
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    return {ctx,width,height};
  }
  function cover(ctx,image,w,h) {
    const scale=Math.max(w/image.naturalWidth,h/image.naturalHeight);
    const iw=image.naturalWidth*scale,ih=image.naturalHeight*scale;
    ctx.drawImage(image,(w-iw)/2,(h-ih)/2,iw,ih);
  }
  function figure(ctx,image,x,y,height,alpha=1) {
    const width=height*image.naturalWidth/image.naturalHeight;
    ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(image,x-width/2,y-height,width,height);ctx.restore();
  }
  function spark(ctx,x,y,r,points=5) {
    ctx.beginPath();
    for(let i=0;i<points*2;i++){
      const angle=i*Math.PI/points-Math.PI/2, radius=i%2?r*.44:r;
      ctx.lineTo(x+Math.cos(angle)*radius,y+Math.sin(angle)*radius);
    }
    ctx.closePath();ctx.fill();
  }
  function ruinsFX(ctx,w,h,t) {
    if(RR_SETTINGS.get().sensitivity)return;
    const gentle=RR_SETTINGS.gentle();
    if(gentle)t=0;
    for(const [ax,ay] of [[.03,.48],[.25,.55],[.315,.43],[.905,.275],[.945,.50]]) {
      const x=w*ax,y=h*ay,r=Math.max(8,h*.024);
      for(let i=0;i<5;i++){
        const p=(t*.32+i/5)%1;
        ctx.fillStyle=`rgba(38,30,53,${(1-p)*.21})`;
        ctx.beginPath();ctx.ellipse(x+p*r*3,y-p*r*7,r*(1+p*1.3),r*(.8+p),-.5,0,Math.PI*2);ctx.fill();
      }
      for(let i=0;i<3;i++){
        const curl=Math.sin(t*3+i*2+ax*8),base=x+(i-1)*r*.42;
        ctx.fillStyle=['#fc653aa8','#ffb063ad','#ffe1a6bb'][i];
        ctx.beginPath();ctx.moveTo(base-r*.4,y);ctx.quadraticCurveTo(base-r*.5,y-r,base+r*.45*curl,y-r*(1.4+curl*.34));
        ctx.quadraticCurveTo(base+r*.75,y-r*.8,base+r*.35,y);ctx.fill();
      }
    }
  }
  function power(ctx,key,x,y,r,time,amount=1) {
    const [symbol,primary,secondary,light]=RR_BATTLE.elements[key];
    const gentle=RR_SETTINGS.gentle();
    ctx.save();ctx.globalAlpha=(gentle?.55:.85)*amount;
    ctx.strokeStyle=primary;ctx.fillStyle=light;ctx.lineWidth=Math.max(2,r*.07);
    if(!gentle){ctx.shadowColor=primary;ctx.shadowBlur=12;}
    if(key==='fire'){
      for(let i=0;i<5;i++){
        const cx=x+(i-2)*r*.32,tip=Math.sin(i*4+time*7)*r*.22;
        ctx.fillStyle=i%2?secondary:primary;ctx.beginPath();
        ctx.moveTo(cx-r*.18,y+r*.3);ctx.quadraticCurveTo(cx-r*.4,y-r*.1,cx+tip,y-r*(.7+i*.08));
        ctx.quadraticCurveTo(cx+r*.5,y-r*.2,cx+r*.2,y+r*.3);ctx.fill();
      }
      ctx.fillStyle=light;spark(ctx,x,y,r*.32);
    } else if(key==='earth'||key==='ice'){
      for(let i=0;i<5;i++){
        const px=x+(i-2)*r*.35,top=y-r*(.6+(2-Math.abs(i-2))*.24);
        ctx.fillStyle=i%2?secondary:primary;ctx.beginPath();
        ctx.moveTo(px,top);ctx.lineTo(px+r*.22,y-r*.1);ctx.lineTo(px+r*.12,y+r*.28);ctx.lineTo(px-r*.19,y+r*.28);ctx.closePath();ctx.fill();ctx.stroke();
      }
    } else {
      for(let i=0;i<4;i++){
        const p=(time*.25+i*.23)%1;
        ctx.beginPath();ctx.ellipse(x,y,r*(.32+p),r*(.18+p*.55),key==='air'?-.42:p*.2,0,Math.PI*2);ctx.stroke();
        if(key==='water'){ctx.beginPath();ctx.arc(x+Math.cos(i*2)*r*p,y-r*p,r*.09,0,Math.PI*2);ctx.stroke();}
        else{ctx.fillStyle=i%2?secondary:light;spark(ctx,x+Math.cos(i*1.6-time)*r*p,y+Math.sin(i*1.6-time)*r*p,r*.11,4);}
      }
    }
    ctx.shadowBlur=0;ctx.font=`bold ${Math.max(11,r*.34)}px system-ui`;ctx.textAlign='center';
    ctx.fillStyle=light;ctx.fillText(symbol,x,y+r*.63);ctx.restore();
  }
  const arenaCanvas=$('battleArt');
  let arenaBounds=null,lastArenaPaint=-Infinity;
  new ResizeObserver(([entry])=>{
    arenaBounds=entry.contentRect;
    lastArenaPaint=-Infinity;
  }).observe(arenaCanvas);

  function drawArena(canvas,sprite,beat,event,battle,step,now) {
    const profile=RR_SETTINGS.get().device;
    const interval=profile==='pc'?16:32;
    if(now-lastArenaPaint<interval)return;
    lastArenaPaint=now;
    const {ctx,width:w,height:h}=surface(canvas,arenaBounds,profile==='pc'?1.2:1);
    if(w<2||h<2)return;
    const quiet=RR_SETTINGS.gentle();
    const t=quiet?0:beat;
    const floor=h*.95, x=w*.175,bx=w*.835;
    const ph=Math.min(h*.67,w*.33),bh=Math.min(h*.93,w*.44);
    ruinsFX(ctx,w,h,t*.5);
    const recent=battle.result&&beat-battle.result.beat<2.4?battle.result:null;
    const recoil=recent?.damage&&!quiet?Math.sin(smooth((beat-recent.beat)/2.4)*Math.PI):0;
    const windup=event?.enemyAttack&&!quiet?Math.sin(smooth((beat-event.warn)/4)*Math.PI):0;
    const layout={
      boss:{x:bx-bh*.20,y:floor-bh*.48},player:{x,y:floor-ph*.49},
      guitar:{x:x+ph*.19,y:floor-ph*.44},floor:floor-4,r:Math.max(15,ph*.22)
    };
    figure(ctx,asset('boss').image,bx+recoil*w*.023-windup*w*.02,floor-windup*bh*.012,bh,battle.won?.25:1);
    if(battle.frenzy)RR_BATTLE_EFFECTS.light(ctx,'#aab1ff',x,floor-ph*.48,ph*.59,.5);
    RR_PERFORMANCE.arenaPose(ctx,sprite,x,floor,ph,step);
    if(event?.enemyAttack)RR_BATTLE_EFFECTS.enemy(ctx,event,beat,layout,quiet);
    if(event?.hits&&event.actor!=='Galactus'){
      const [,color]=RR_BATTLE.elements[event.element];
      RR_BATTLE_EFFECTS.light(ctx,color,layout.guitar.x,layout.guitar.y,layout.r*(.55+event.hits*.17),quiet?.4:.66);
    }
    if(recent)RR_BATTLE_EFFECTS.player(ctx,recent,beat,layout,quiet);
    for(let i=0;i<battle.ring;i++){
      const [,color]=RR_BATTLE.elements[['earth','water','fire','air'][i]];
      const ringX=x+(i-1.5)*ph*.16,ringY=floor-ph*.88;
      RR_BATTLE_EFFECTS.light(ctx,color,ringX,ringY,ph*.09,.68);
      ctx.lineWidth=1.6;ctx.strokeStyle=color;ctx.beginPath();
      ctx.ellipse(ringX,ringY,ph*.04,ph*.055,-.28,0,Math.PI*2);ctx.stroke();
    }
  }

  const returnStory = [
    ['O acorde de volta','return','PIXEL','Desta vez eu escolho o caminho. OrbitHop, escute a minha guitarra.','Pixel levita com calma e abre um portal estelar.'],
    ['A volta para casa','cross','PIXEL','Estou pronto. O ritmo que me trouxe até aqui vai me levar de volta.','Pixel se vira para a estrela e atravessa o portal.'],
    ['A cidade ferida','ruins','PIXEL','OrbitHop... Ainda vejo suas luzes sob a fumaça. Vou cuidar de você.','Pixel caminha pela praça entre fumaça e pequenas chamas.'],
    ['O Devorador de Mundos','confront','GALACTUS','Covarde! Você fugiu e abandonou seu povo. Agora não há escapatória.','Galactus surge diante de Pixel. Sua armadura puxa partículas para uma fenda violeta.'],
    ['A resposta de Pixel','confront','PIXEL','Eu voltei por eles. Cada mundo me ensinou uma nota. Juntas, elas têm força para proteger meu lar.','Pixel ergue a guitarra e encara Galactus.']
  ];
  const victoryStory = [
    ['Sinfonia dos Mundos','charge','PIXEL','Cada lição, cada desafio e cada pessoa que me ajudou... estão neste acorde.','Quatro anéis elementais envolvem a guitarra. Os portais mostram lembranças dos mundos.'],
    ['Tempus Infinitum','tempus','PIXEL','Tempus Infinitum!','Uma rajada intergaláctica reúne todas as cores da jornada e desfaz a armadura de Galactus.'],
    ['OrbitHop respira','saved','PIXEL','Conseguimos! As luzes estão voltando. Ouço o coração de OrbitHop outra vez.','Galactus se dissolve em poeira cósmica. Pixel comemora e a cena escurece.'],
    ['No camarim','dressing','PIXEL','Neste camarim comecei uma viagem sem saber para onde ia. Hoje sei quanta força existe em tocar juntos.','Algum tempo depois, Pixel volta ao camarim reconstruído.'],
    ['O caminho para o palco','backstage','PIXEL','Ouça! As pessoas voltaram. Vamos tocar uma última música para elas.','Pixel atravessa o corredor em direção a um novo estádio.'],
    ['Estrelas de Casa','encore','PIXEL','OrbitHop! Este show é para vocês. Nosso ritmo trouxe as estrelas de volta!','Uma multidão celebra a cidade reconstruída e lança estrelas para o palco.'],
    ['Créditos','credits','PIXEL','Obrigado por tocar comigo. Até o próximo show!','A música Estrelas de Casa acompanha os agradecimentos.']
  ];
  let story,source,scene=0,elapsed=0,last=0,resolve=null,paused=false,serial=0;
  const memoryImages = () => RR_LEVELS.slice(0,10).map(world=>RR_SPRITES.load(world.background).image);
  let memories=[];
  function render() {
    const [title,kind,speaker,line,action]=story[scene];
    $('travelDestination').textContent=title;
    $('travelStatus').textContent=line;
    $('travelStatus').dataset.speaker=speaker;
    $('travelAction').textContent=action;
    $('backTravel').disabled=scene===0;
    $('nextTravel').textContent=scene===story.length-1?'Concluir →':'Avançar →';
    $('finalCredits').hidden=kind!=='credits';
    $('travelOverlay').dataset.memory='false';
    if(!paused)RR_AUDIO.scene(kind);
  }
  function draw() {
    const {ctx,width:w,height:h}=surface($('travelCanvas'));
    const kind=story[scene][1], gentle=RR_SETTINGS.gentle(),t=gentle?0:elapsed;
    const concert=kind==='encore'||kind==='credits',travel=kind==='return'||kind==='cross';
    const arena=['ruins','confront','charge','tempus','saved'].includes(kind);
    const bg=travel?source.background:arena?asset('ruins').image:asset(concert?'encore':kind).image;
    cover(ctx,bg,w,h);
    if(arena)ruinsFX(ctx,w,h,t);
    const floor=h*(concert?.67:.82),H=Math.min(h*.48,w*.5),portalX=w*.41;
    let x=w*.30,y=floor,pose=3,alpha=1,flip=false;
    if(travel){
      const progress=kind==='cross'?smooth((elapsed-.5)/3.8):0;
      x=mix(w*.68,portalX,progress);y=floor-H*.24*smooth(elapsed/4);
      flip=true;alpha=1-progress;pose=kind==='return'?5:2;
      RR_PORTAL.draw(ctx,portalX,y-H*.36,H*.40,H*.55,t,kind==='cross'?1:smooth(elapsed/4));
    }
    if(kind==='ruins'){
      x=mix(w*.14,w*.32,smooth(elapsed/5));pose=Math.floor(t*3)%2?0:2;
      RR_PORTAL.draw(ctx,w*.13,floor-H*.5,H*.36,H*.48,t,1-smooth(elapsed/3));
    }
    if(['confront','charge','tempus','saved'].includes(kind)){
      const fade=kind==='tempus'?1-smooth((elapsed-3)/4):kind==='saved'?0:1;
      figure(ctx,asset('boss').image,w*.78,floor,Math.min(h*.77,w*.62),fade);
      if(kind==='confront')power(ctx,'void',w*.76,h*.43,H*.34,t,.68);
    }
    if(kind==='charge'||kind==='tempus'){
      const p=smooth(elapsed/3), palette=['earth','water','fire','air','ice','pixel'];
      for(let i=0;i<memories.length;i++){
        const image=memories[i],xx=w*(.07+i*.06),yy=h*(.145+(i%2)*.078),radius=H*.068;
        if(image.naturalWidth){
          ctx.save();ctx.globalAlpha=p*.9;ctx.beginPath();ctx.arc(xx,yy,radius,0,Math.PI*2);ctx.clip();
          ctx.drawImage(image,xx-radius*1.75,yy-radius,radius*3.5,radius*2);ctx.restore();
          ctx.save();ctx.globalAlpha=p;ctx.strokeStyle=RR_BATTLE.elements[palette[i%palette.length]][1];
          ctx.lineWidth=2;ctx.beginPath();ctx.arc(xx,yy,radius,0,Math.PI*2);ctx.stroke();ctx.restore();
        }
      }
      for(let i=0;i<palette.length;i++){
        power(ctx,palette[i],x+Math.cos(i+ t*.8)*H*.25,y-H*.52+Math.sin(i+t*.8)*H*.26,H*.16,t,p);
        if(kind==='tempus'){
          const color=RR_BATTLE.elements[palette[i]][1];
          ctx.save();ctx.globalAlpha=(gentle?.32:.68)*p;ctx.strokeStyle=color;
          ctx.lineCap='round';ctx.shadowBlur=gentle?0:19;ctx.shadowColor=color;
          ctx.lineWidth=H*.028;ctx.beginPath();ctx.moveTo(x+H*.2,y-H*.51);
          ctx.bezierCurveTo(w*.43,h*.34+Math.sin(t+i)*H*.19,w*.6,h*.66+Math.cos(t+i)*H*.16,w*.79,h*.42);
          ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle='#fff0ff';ctx.lineWidth=H*.005;ctx.stroke();ctx.restore();
        }
      }
      if(kind==='tempus'&&!gentle){
        const disperse=smooth((elapsed-2.5)/4);
        for(let i=0;i<Math.ceil(54*RR_SETTINGS.effects());i++){
          const angle=i*2.39996,reach=H*(.07+(i%11)*.018)*disperse;
          ctx.fillStyle=RR_BATTLE.elements[palette[i%palette.length]][3];
          spark(ctx,w*.79+Math.cos(angle)*reach,h*.42+Math.sin(angle)*reach,2+(i%4)*disperse,4);
        }
      }
      pose=Math.floor(t*5)%2?4:5;
    }
    if(kind==='dressing'||kind==='backstage'){
      x=kind==='backstage'?mix(w*.35,w*.76,smooth(elapsed/6)):w*.68;
      figure(ctx,asset('walking').image,x,floor-(gentle?0:Math.abs(Math.sin(t*3))*4),H);
    }else{
      if(concert){
        x=w*.65;pose=Math.floor(t*2)%2?3:5;
        for(let i=0;i<32;i++){
          const p=(i/32+t*.19)%1;
          ctx.fillStyle=i%2?'#ffb8f8':'#aaf6ff';spark(ctx,w*(.05+(i*.131)% .88),h*(.89-p*.4),3+p*6);
        }
      }
      if(kind==='saved')pose=5;
      RR_SPRITES.draw(ctx,asset('pixel').image,RR_SPRITES.standard[pose],x,y,H*(travel?1-(1-alpha)*.55:1),{alpha,flip});
    }
    if(kind==='saved'){
      ctx.fillStyle=`rgba(15,12,30,${smooth((elapsed-4)/3)})`;ctx.fillRect(0,0,w,h);
    }
  }
  function tick(now,token){
    if(!resolve||serial!==token)return;
    if(!paused&&!document.hidden)elapsed+=Math.min(.05,(now-last)/1000);
    last=now;draw();
    const duration=story[scene][1]==='credits'?22:RR_NARRATIVE.readingTime(story[scene][3]);
    if(elapsed>=duration)advance();
    if(resolve)requestAnimationFrame(time=>tick(time,token));
  }
  function finish(){
    serial++;
    if(!resolve)return;
    const done=resolve;resolve=null;$('finalCredits').hidden=true;
    $('travelOverlay').removeAttribute('data-paused');
    $('travelStatus').removeAttribute('data-speaker');done();
  }
  function advance(){if(!resolve)return;if(scene===story.length-1)finish();else{scene++;elapsed=0;render();draw();}}
  window.RR_FINALE=Object.freeze({get arenaReady(){return prepareArena();},drawArena,active:()=>!!resolve,advance,finish,
    back(){if(resolve&&scene>0){scene--;elapsed=0;render();draw();}},
    toggle(){
      if(!resolve)return;
      paused=!paused;
      $('travelOverlay').dataset.paused=String(paused);
      $('pauseTravel').textContent=paused?'Continuar cena':'Pausar cena';
      if(paused)RR_AUDIO.silence();else render();
    },
    async play(kind,world){
      const token=++serial;
      story=kind==='return'?returnStory:victoryStory;source=world;
      await prepareArena();
      if(kind==='victory'){
        memories=memoryImages();
        await Promise.all(['encore','dressing','backstage','walking'].map(key=>asset(key).ready));
      }
      if(token!==serial)return;
      scene=0;elapsed=0;paused=false;last=performance.now();
      $('pauseTravel').textContent='Pausar cena';
      return new Promise(done=>{resolve=done;render();draw();requestAnimationFrame(time=>tick(time,token));});
    }
  });
})();
