(() => {
 'use strict';
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),smooth=n=>{n=clamp(n);return n*n*(3-2*n)},mix=(a,b,t)=>a+(b-a)*t;
 function create(canvas){
  const ctx=canvas.getContext('2d'),stageCanvas=document.createElement('canvas'),stageContext=stageCanvas.getContext('2d');let width=1440,height=900,dpr=1,from=null,to=null,time=0,total=12,active=false,paused=false,last=0,resolve=null,pendingSkip=false,model={},lineKey='',lineElapsed=0;
  const label=document.getElementById('travelStatus'),pauseButton=document.getElementById('pauseTravel');
  new ResizeObserver(()=>{const b=canvas.getBoundingClientRect();width=Math.max(1,b.width);height=Math.max(1,b.height);dpr=RR_SETTINGS.dpr();canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}).observe(canvas);
  function cover(image,alpha=1){const k=Math.max(width/image.naturalWidth,height/image.naturalHeight);ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(image,(width-image.naturalWidth*k)/2,(height-image.naturalHeight*k)/2,image.naturalWidth*k,image.naturalHeight*k);ctx.restore();}
  function actor(world,x,floor,H,alpha=1,walk=0){
   const r=world.level.frames[0],k=H/r[3],gy=world.level.groundY||r[3],bob=RR_SETTINGS.gentle()?0:Math.sin(walk*Math.PI*2)**2*3.5;
   ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,floor-bob);ctx.rotate(RR_SETTINGS.gentle()?0:Math.sin(walk*Math.PI*2)*.009);if(time<8.4)ctx.scale(-1,1);ctx.drawImage(world.sprite,...r,-r[2]*k/2,-gy*k,r[2]*k,r[3]*k);ctx.restore();
  }
  function stage(world,floor,center){const w=width*(width<700?.94:.58),x=center-w*.52;if(stageCanvas.width!==Math.ceil(w)||stageCanvas.height!==Math.ceil(height)){stageCanvas.width=Math.ceil(w);stageCanvas.height=Math.ceil(height);}RR_PERFORMANCE.platform(stageContext,{width:w,height:height,floor,x:w*.52,id:world.level.id,colors:world.level.colors,accent:world.level.accent,power:1,beat:RR_SETTINGS.gentle()?0:time*.45,soft:RR_SETTINGS.gentle(),still:RR_SETTINGS.gentle()});ctx.drawImage(stageCanvas,x,0,w,height);}
  function caption(key,text){
   if(lineKey===key)return;
   lineKey=key;lineElapsed=0;label.textContent=text;
   document.getElementById('backTravel').disabled=key==='channel';
   if(!paused)RR_AUDIO.scene(key==='arrive'||key==='landed'?'reflection':'cross');
   document.getElementById('travelAction').textContent={channel:'Pixel canaliza sua energia pela guitarra.',open:'Um portal estável se abre diante do palco.',walk:'Pixel caminha voluntariamente em direção ao portal.',enter:'Pixel atravessa o caminho entre mundos.',arrive:'Pixel sai com seu novo outfit, ao lado do próximo palco.',landed:'O portal se fecha suavemente atrás de Pixel.'}[key]||'';
  }
  function draw(){
   if(!from)return;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
   const safe=RR_SETTINGS.gentle(),mobile=width<700,floor=height*(mobile?.75:.84),H=Math.min(height*(mobile?.46:.64),width*(mobile?.65:.55)),startX=width*(mobile?.72:.75),portalX=width*(mobile?.32:.43),portalY=floor-H*.52,rx=H*(mobile?.35:.44),ry=H*.55;
   const arrival=!!to&&time>=8.4,world=arrival?to:from;
   cover(world.background);ctx.fillStyle='#120f2c44';ctx.fillRect(0,0,width,height);stage(world,floor,width*(mobile?.53:.61));
   let x=startX,fy=floor,h=H,alpha=1,open=0,walk=0,phase='channel',guitarPower=0;
   if(!arrival){
    if(time<2.7){open=smooth((time-1)/2.1);guitarPower=smooth(time/2);caption('channel','Levo o ritmo de '+from.level.name+' comigo.');}
    else if(time<4.4){open=1;phase='open';guitarPower=1;caption('open','Meu acorde abre o caminho para '+to.level.name+'.');}
    else if(time<6.8){open=1;phase='walk-in';const p=smooth((time-4.4)/2.4);x=mix(startX,portalX,p);walk=time*1.4;caption('walk','Depois de '+from.level.name+', escolho continuar.');}
    else{phase='enter';open=1;const p=smooth((time-6.8)/1.5);x=portalX;fy=mix(floor,portalY+H*.06,p);h=H*(1-p*.95);alpha=1-smooth((p-.6)/.4);caption('enter',to?'♪ Conexão encontrada! Próxima parada: '+to.level.name+'!':'O próximo caminho ainda está bloqueado. A jornada continua em breve.');}
   }else{
    open=1;phase='walk-out';const p=smooth((time-8.5)/2.5);x=mix(portalX,startX,p);h=H*(.16+.84*smooth((time-8.4)/1.0));fy=mix(portalY+H*.15,floor,smooth((time-8.4)/1.0));alpha=smooth((time-8.4)/.65);walk=time*1.1;
    if(time>=10.8){phase='landed';open=1-smooth((time-10.8)/1.2);walk=0;caption('landed','Pronto para descobrir o compasso de '+to.level.name+'!');}
    else caption('arrive','Este é o mundo de '+to.level.name+'. Vou escutar sua melodia.');
   }
   RR_PORTAL.draw(ctx,portalX,portalY,rx,ry,safe?0:time,open);
   if(guitarPower>0&&!safe){
    const gx=startX-H*.02,gy=floor-H*.44;ctx.save();ctx.globalCompositeOperation='lighter';
    for(let i=0;i<6;i++){const p=(time*.55+i/6)%1;ctx.strokeStyle=from.level.colors[i%4]+'9a';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(gx,gy,H*(.03+p*.16),H*(.02+p*.10),-.3,0,Math.PI*2);ctx.stroke();}
    ctx.strokeStyle='#f6c8ff99';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(gx,gy);ctx.quadraticCurveTo((gx+portalX)/2,gy-H*.23,portalX,portalY);ctx.stroke();ctx.restore();
   }
   if(safe){x=startX;fy=floor;h=H;walk=0;alpha=arrival?smooth((time-8.4)/.6):time<6.8?1:1-smooth((time-6.8)/1.5);}
   actor(world,x,fy,h,alpha,walk);RR_PORTAL.draw(ctx,portalX,portalY,rx,ry,safe?0:time,open,true);
   if(to&&time>7.9&&time<8.8){ctx.save();ctx.fillStyle='#161024';ctx.globalAlpha=Math.sin(clamp((time-7.9)/.9)*Math.PI)*.96;ctx.fillRect(0,0,width,height);ctx.restore();}
   model={active,paused,time,total,phase,voluntary:true,corrupted:false,from:from.level.id,to:to?.level.id||null,outfit:world.level.id,portalOpen:open,actorX:x,actorFloor:fy,stageFloor:floor,arrival,rotation:0};
  }
  function end(){if(!active)return;active=false;draw();const done=resolve;resolve=null;done?.();}
  function tick(now){
   if(!active)return;
   const dt=Math.min(.05,(now-last)/1000);last=now;
   if(!paused&&!document.hidden){
    lineElapsed+=dt;
    const boundary={channel:2.7,open:4.4,'walk-in':6.8,enter:8.4,'walk-out':10.8,landed:12}[model.phase]||total;
    const canAdvance=lineElapsed>=RR_NARRATIVE.readingTime(label.textContent);
    time=canAdvance?time+dt:Math.min(time+dt,boundary-.00001);
   }
   draw();if(time>=total)end();else requestAnimationFrame(tick);
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&active){paused=true;pauseButton.textContent='Continuar cena';}});
  return Object.freeze({
   play(a,b){from=a;to=b;time=0;total=b?12:8.4;lineKey='';lineElapsed=0;document.getElementById('travelOverlay').dataset.memory='false';document.getElementById('nextTravel').textContent='Continuar cena →';paused=false;active=true;pauseButton.textContent='Pausar cena';last=performance.now();return new Promise(done=>{resolve=done;draw();if(pendingSkip){pendingSkip=false;time=total;end();}else requestAnimationFrame(tick);});},
   advance(){if(!active)return;time=[2.7,4.4,6.8,8.4,10.8,12].find(boundary=>boundary>time+.00002)||total;if(time>=total)end();else draw();},
   back(){if(!active)return;const starts={channel:0,open:0,'walk-in':2.7,enter:4.4,'walk-out':6.8,landed:8.4};time=starts[model.phase];draw();},
   toggle(){if(!active)return;paused=!paused;pauseButton.textContent=paused?'Continuar cena':'Pausar cena';if(paused)RR_AUDIO.silence();else RR_AUDIO.scene('cross');},
   finish(){if(!active){pendingSkip=true;return;}time=total;draw();end();},
   snapshot:()=>({...model,active,paused})
  });
 }
 window.RR_TRAVEL=Object.freeze({create});
})();
