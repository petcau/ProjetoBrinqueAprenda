/* Sobreposição Canvas independente dos puzzles existentes. */
window.DevPuzzleScreen = (() => {
  'use strict';
  function create(canvas,world,clearInput) {
    let current=null,selected=0,hover=-1,buttons=[],notice='',until=0,opened=0,pending=null;
    let sceneActive=false,busy=false,veil=null;
    const down=new Set(),quarantined=new Set();
    function guard(event) {
      if(event.type==='focusin'){if(busy&&event.target!==veil)veil.focus();return;}
      const key=event.key?.toLowerCase(),blocked=busy||quarantined.has(key);
      if(event.type==='keydown'){down.add(key);if(busy)quarantined.add(key);}
      if(event.type==='keyup'){down.delete(key);quarantined.delete(key);}
      if(blocked){event.preventDefault();event.stopImmediatePropagation();}
    }
    for(const type of ['keydown','keyup','pointerdown','pointerup','pointermove','click','dblclick','wheel','contextmenu','touchstart','touchmove','touchend','focusin'])window.addEventListener(type,guard,{capture:true,passive:false});
    window.addEventListener('blur',()=>{down.clear();quarantined.clear();});
    function transition(prepare,reveal,focus) {
      busy=true;clearInput();for(const key of down)quarantined.add(key);
      const overlay=veil=document.createElement('canvas'),ctx=overlay.getContext('2d'),start=performance.now();
      overlay.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:2147483647;touch-action:none;';
      overlay.tabIndex=-1;overlay.setAttribute('role','status');overlay.setAttribute('aria-label','Transição');document.body.appendChild(overlay);overlay.focus();
      return new Promise((resolve,reject)=>{
        let done=false,ready=false,revealing=null,raf=0;
        const finish=error=>{if(done)return;done=true;clearTimeout(deadline);cancelAnimationFrame(raf);overlay.remove();veil=null;busy=false;clearInput();(error?canvas:focus())?.focus();error?reject(error):resolve();};
        const deadline=setTimeout(()=>finish(Error('Tempo limite de 10 s ao abrir o puzzle.')),10000);
        function draw(time) {
          overlay.width=window.innerWidth;overlay.height=window.innerHeight;
          const alpha=revealing===null?Math.min(1,(time-start)/250):Math.max(0,1-(time-revealing)/250);
          ctx.fillStyle=`rgba(7,17,29,${alpha})`;ctx.fillRect(0,0,overlay.width,overlay.height);
          if(!ready&&time-start>250){overlay.setAttribute('aria-label','Carregando…');ctx.fillStyle='#fff5d7';ctx.font='16px monospace';ctx.textAlign='center';ctx.fillText('Carregando'+'.'.repeat(1+Math.floor(time/300)%3),overlay.width/2,overlay.height/2);}
          if(revealing!==null&&time-revealing>=250)finish();else raf=requestAnimationFrame(draw);
        }
        raf=requestAnimationFrame(draw);
        Promise.all([Promise.resolve().then(prepare).then(value=>{ready=true;return value;}),new Promise(r=>setTimeout(r,250))]).then(([value])=>{
          if(done)return;clearTimeout(deadline);reveal(value);
          // A cena agenda seu desenho em open(); dois RAFs também permitem que ele seja apresentado.
          requestAnimationFrame(()=>requestAnimationFrame(()=>{if(!done)revealing=performance.now();}));
        }).catch(finish);
      });
    }
    async function openScene(key,load,options) {
      if(sceneActive||busy||current)return;sceneActive=true;let host,closing=false;
      try {
        await transition(load,scene=>{
          scene.open({...options,onExit:(won,...args)=>{
            if(closing)return;closing=true;
            if(key.id==='geometria')window.GameAudio?.stopGeometryMusic?.();
            window.Music?.definirLugar?.('exploracao');
            // close() já removeu a cena: conserva seu último quadro durante o fade, sem reabri-la.
            host.inert=true;document.body.appendChild(host);
            transition(()=>null,()=>{host.remove();if(won&&key.id!=='montanha')award(key);options.onExit?.(won,...args);},()=>canvas)
              .catch(error=>console.error('[Transição]',error)).finally(()=>{host.remove();sceneActive=false;});
          }});
          host=document.body.lastElementChild;
          if(key.id==='geometria')window.GameAudio?.playGeometryMusic?.();
          window.Music?.definirLugar?.(key.id);
        },()=>host?.querySelector('canvas')||canvas);
      } catch(error) {
        if(key.id==='geometria')window.GameAudio?.stopGeometryMusic?.();
        window.Music?.definirLugar?.('exploracao');
        sceneActive=false;host?.remove();const message='Não foi possível abrir o puzzle. Tente de novo.';
        announce(message);document.querySelector('#island-announcement').textContent=message;console.error(`[Puzzle ${key.id}]`,error);
      }
    }
    function announce(message,duration=2500){notice=message;until=performance.now()+duration;}
    const hit=event=>{
      const box=canvas.getBoundingClientRect(),x=event.clientX-box.left,y=event.clientY-box.top;
      return buttons.findIndex(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);
    };
    function award(key) {
      const state=world.keyState;state.keys[key.id]=true;
      notice=`Chave de ${key.label} obtida! (${KEYS.filter(k=>state.keys[k.id]).length}/4)`;
      until=performance.now()+2000;
    }
    function close(complete=false) {
      if(!current)return;
      if(current.id==='geometria')window.GameAudio?.stopGeometryMusic?.();
      window.Music?.definirLugar?.('exploracao');
      if(complete)award(current);
      current=null;pending=null;buttons=[];hover=-1;canvas.style.cursor='';clearInput();canvas.focus();
      canvas.setAttribute('aria-label','Ilha do Conhecimento. WASD ou setas para explorar, E para interagir.');
    }
    canvas.addEventListener('pointermove',event=>{if(current){hover=hit(event);canvas.style.cursor=hover<0?'':'pointer';}});
    canvas.addEventListener('pointerleave',()=>{hover=-1;});
    canvas.addEventListener('click',event=>{if(current){const index=hit(event);if(index>=0)close(index===1);}});
    function open(key) {
      current=key;opened=performance.now();pending=null;selected=0;hover=-1;buttons=[];clearInput();canvas.focus();
      if(key.id==='geometria')window.GameAudio?.playGeometryMusic?.();
      window.Music?.definirLugar?.(key.id);
      canvas.setAttribute('aria-label',key.id==='montanha'?'Abrindo o topo da montanha. Escape: voltar.':`Puzzle de ${key.label}. Tela de desenvolvimento. Escape: voltar. Enter: simular conclusão.`);
    }
    function input(event) {
      if(sceneActive||busy)return true;
      if(window.FinalPuzzle?.active||window.MemoryMazeGame?.active)return true;
      if(!current)return false;
      event.preventDefault();if(event.repeat)return true;
      const key=event.key.toLowerCase();
      if(key==='escape')close();
      else if(current.id==='montanha')return true;
      else if(key==='enter')close(true);
      else if(key==='tab'||key==='arrowleft'||key==='arrowright')selected=1-selected;
      else if(key===' ')close(selected===1);
      return true;
    }
    function draw(ctx,width,height,time) {
      ctx.save();ctx.textAlign='center';ctx.textBaseline='alphabetic';
      if(current?.id==='montanha') {
        const t=Math.min(1,Math.max(0,(time-opened)/300));ctx.fillStyle=`rgba(0,0,0,${t})`;ctx.fillRect(0,0,width,height);
        if(t>=1&&pending){const run=pending;pending=null;run();}
      } else if(current) {
        ctx.fillStyle='#07111dcc';ctx.fillRect(0,0,width,height);
        const w=Math.min(560,width-24),h=Math.min(320,height-16),x=(width-w)/2,y=(height-h)/2;
        ctx.fillStyle='#20374a';ctx.beginPath();ctx.roundRect(x,y,w,h,16);ctx.fill();
        const compact=h<300;
        IslandKeys.icon(ctx,current,width/2,y+(compact?42:78),compact?32:54);
        ctx.fillStyle='#fff';ctx.font='bold 22px system-ui';ctx.fillText(`Puzzle de ${current.label}`,width/2,y+(compact?70:113),w-24);
        ctx.font='15px system-ui';ctx.fillText('Tela de desenvolvimento — puzzle ainda não implementado',width/2,y+(compact?96:145),w-24);
        buttons=['Voltar','[DEV] Simular conclusão'].map((label,i)=>({label,x:x+16,y:y+h-108+i*48,w:w-32,h:40}));
        buttons.forEach((b,i)=>{
          ctx.fillStyle=hover===i?'#53738c':selected===i?'#42647e':'#304e66';
          ctx.beginPath();ctx.roundRect(b.x,b.y,b.w,b.h,8);ctx.fill();
          if(selected===i){ctx.strokeStyle='#f9de8c';ctx.lineWidth=2;ctx.stroke();}
          ctx.fillStyle='#fff';ctx.font='bold 16px system-ui';ctx.fillText(b.label,b.x+b.w/2,b.y+26);
        });
      } else if(time<until||world.mountainNearby) {
        const w=Math.min(width-20,520);ctx.fillStyle='#12202deb';ctx.beginPath();ctx.roundRect((width-w)/2,18,w,48,10);ctx.fill();
        ctx.fillStyle='#fff';ctx.font='bold 16px system-ui';ctx.fillText(time<until?notice:'E — Examinar a cela',width/2,48,w-16);
      }
      ctx.restore();
    }
    return {open,openScene,close,input,draw,announce,get active(){return Boolean(current)||sceneActive||busy;},get id(){return current?.id;}};
  }
  return {create};
})();
