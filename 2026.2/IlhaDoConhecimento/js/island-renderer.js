/* Desenho em Canvas 2D: imagens locais, terreno, profundidade e orientação. */
window.IslandRenderer = (() => {
  'use strict';
  const T=48, types=IslandWorld.terrain, noise=IslandWorld.noise;

  const sources={island:'ilha/ilha.jpeg',hero:HERO_SHEET.src,heroDiag:typeof HERO_DIAGONAL_SHEET!=='undefined'?HERO_DIAGONAL_SHEET.src:'personagem/menina-diagonal-8.webp',front:IslandArt.sources.front,back:IslandArt.sources.back,side:IslandArt.sources.side};
  let occlusionLoading;
  function loadOcclusion() {
    if(window.IslandOcclusion)return Promise.resolve(window.IslandOcclusion);
    return occlusionLoading ||= new Promise(resolve=>{
      const script=document.createElement('script');script.src='js/island-occlusion.js';
      script.onload=()=>resolve(window.IslandOcclusion);script.onerror=()=>{
        console.warn('[Oclusão] Falha ao carregar módulo: sem oclusão.');resolve(null);
      };document.head.appendChild(script);
    });
  }
  function create(canvas,miniCanvas,mapCanvas,world) {
    const ctx=canvas.getContext('2d'),mini=miniCanvas.getContext('2d'),map=mapCanvas.getContext('2d');
    const images={},failed=[],patterns={};
    const hudKeys=['logica','algebra','geometria','operacoes'].map(id=>KEYS.find(key=>key.id===id));
    const hudIcons=new Array(4),hudSilhouettes=new Array(4),hudGlows=new Array(4);
    const hudPrevious=new Uint8Array(4),hudPop=new Float64Array(4).fill(-Infinity);
    const hudBox={x:0,y:0,w:0,h:0,s:1},slotW=Math.ceil(HUD_KEY_H*229/482);
    const overlayNodes=Array.from(document.querySelectorAll('.island-place, .island-minimap, .island-gear, .island-touch'));
    let hudWidth=0,hudDirty=true,occlusion=null;
    if(HUD_KEYS_CORNER===DEBUG_PANEL_CORNER)console.warn('[HUD] HUD_KEYS_CORNER e DEBUG_PANEL_CORNER são iguais; o F3 será reposicionado para evitar sobreposição.');
    if(typeof ResizeObserver!=='undefined') {
      const observer=new ResizeObserver(()=>{hudDirty=true;});overlayNodes.forEach(node=>observer.observe(node));
    }
    const ready=Promise.all(Object.entries(sources).map(([name,path])=>new Promise(resolve=>{
      const img=new Image();images[name]=img;
      img.onload=async()=>{
        if(name==='island') {
          world.width=img.naturalWidth*WORLD_SCALE;world.height=img.naturalHeight*WORLD_SCALE;
          overviewCtx.drawImage(img,0,0,overview.width,overview.height);
          try {await IslandWorld.buildCollision(world,img);}
          catch(error){world.collision=null;console.error('[Colisão] Falha ao preparar terreno; movimento bloqueado.',error);failed.push('colisão do terreno');}
          try {occlusion=await (await loadOcclusion())?.create(img);}
          catch(error){console.warn('[Oclusão] Não foi possível preparar a máscara; sem oclusão.',error);}
        }
        resolve();
      };img.onerror=()=>{
        if(name==='heroDiag') {
          const fallback=typeof HERO_DIAGONAL_SHEET!=='undefined'?HERO_DIAGONAL_SHEET.fallbackSrc:'personagem/menina-diagonal-8.png';
          if(fallback&&!img._triedFallback) {
            img._triedFallback=true;
            img.src=`assets/${fallback}`;
            return;
          }
          console.warn('[Personagem] Folha diagonal não carregou; usando fallback para direções ortogonais.');
        }
        failed.push(path);resolve();
      };img.src=`assets/${path}`;
    }))).then(()=>{occlusion?.setHero(images.hero,images.heroDiag);return window.IslandKeys?.load();}).then(prepareHud);
    let width=960,height=600,dpr=1,debug=false,hitboxOverlay=false,occlusionOverlay=false,zoom=CAMERA_ZOOM;

    // Única escala mapa → tela; o mínimo de encaixe evita expor área fora do JPEG.
    const scale=()=>Math.max(WORLD_SCALE*zoom,width/(images.island?.naturalWidth||Infinity),height/(images.island?.naturalHeight||Infinity));
    const viewSize=()=>{const s=scale();return {width:width*WORLD_SCALE/s,height:height*WORLD_SCALE/s};};
    document.addEventListener('keydown',event=>{
      if(!debug||canvas.closest('[hidden]')||document.querySelector('dialog[open]')||event.ctrlKey||event.altKey||event.metaKey)return;
      if(event.key.toLowerCase()==='h') {
        event.preventDefault();if(!event.repeat)hitboxOverlay=!hitboxOverlay;return;
      }
      if(event.key.toLowerCase()==='o') {
        event.preventDefault();if(!event.repeat)occlusionOverlay=!occlusionOverlay;return;
      }
      if(!['+','=','-','_'].includes(event.key))return;
      event.preventDefault();
      zoom=Math.max(.8,Math.min(2,Math.round((zoom+(['-','_'].includes(event.key)?-.05:.05))*100)/100));
    });
    const overview=document.createElement('canvas');overview.width=world.cols*3;overview.height=world.rows*3;
    const overviewCtx=overview.getContext('2d');
    function resize() {
      const rect=canvas.getBoundingClientRect();
      width=Math.max(320,Math.round(rect.width));height=Math.max(240,Math.round(rect.height));
      dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
      ctx.imageSmoothingEnabled=false;
      hudDirty=true;
    }
    function prepareHud() {
      ctx.save();ctx.font='bold 14px system-ui';hudWidth=20+4*(slotW+HUD_GAP)+Math.ceil(ctx.measureText('4/4').width);ctx.restore();
      hudKeys.forEach((key,i)=>{
        const icon=document.createElement('canvas');icon.width=slotW;icon.height=HUD_KEY_H;
        window.IslandKeys?.icon(icon.getContext('2d'),key,slotW/2,HUD_KEY_H,HUD_KEY_H);hudIcons[i]=icon;
        const silhouette=document.createElement('canvas');silhouette.width=slotW;silhouette.height=HUD_KEY_H;
        const shadow=silhouette.getContext('2d');shadow.drawImage(icon,0,0);
        // source-in recorta o preenchimento escuro pelo alfa do ícone, uma única vez.
        shadow.globalCompositeOperation='source-in';shadow.fillStyle='rgba(0,0,0,0.55)';shadow.fillRect(0,0,slotW,HUD_KEY_H);hudSilhouettes[i]=silhouette;
        // Os brilhos do mapa são privados; este cache local também é preparado só uma vez.
        const glow=document.createElement('canvas');glow.width=glow.height=64;
        const g=glow.getContext('2d'),gradient=g.createRadialGradient(32,32,0,32,32,32);
        gradient.addColorStop(0,key.color);gradient.addColorStop(1,key.color+'00');g.fillStyle=gradient;g.fillRect(0,0,64,64);hudGlows[i]=glow;
      });
    }
    function overlaySpaces(margin,reserveHud=false) {
      const bounds=canvas.getBoundingClientRect();let spaces=[{x:margin,y:margin,w:width-margin*2,h:height-margin*2}];
      function reserve(l,t,r,d) {
        spaces=spaces.flatMap(a=>l>=a.x+a.w||r<=a.x||t>=a.y+a.h||d<=a.y?[a]:[
          {...a,w:l-a.x},{...a,x:r,w:a.x+a.w-r},{...a,h:t-a.y},{...a,y:d,h:a.y+a.h-d}]).filter(a=>a.w>0&&a.h>0);
      }
      for(const node of overlayNodes) {
        if(node.classList.contains('island-place')&&!node.classList.contains('is-visible'))continue;
        const b=node.getBoundingClientRect();if(!b.width||!b.height)continue;
        reserve((b.left-bounds.left)*width/bounds.width-margin,(b.top-bounds.top)*height/bounds.height-margin,
          (b.right-bounds.left)*width/bounds.width+margin,(b.bottom-bounds.top)*height/bounds.height+margin);
      }
      if(reserveHud&&hudBox.w)reserve(hudBox.x-margin,hudBox.y-margin,hudBox.x+hudBox.w+margin,hudBox.y+hudBox.h+margin);
      return spaces;
    }
    function drawHud(time,calm) {
      if(!hudWidth)return;
      if(hudDirty) {
        const h=HUD_KEY_H+20,right=HUD_KEYS_CORNER.endsWith('right'),top=HUD_KEYS_CORNER.startsWith('top');
        const spaces=overlaySpaces(HUD_MARGIN),fit=a=>Math.min(1,a.w/hudWidth,a.h/h);
        const score=a=>fit(a)*1e6-Math.hypot((right?width-a.x-a.w:a.x),(top?a.y:height-a.y-a.h));
        spaces.sort((a,b)=>score(b)-score(a));
        if(spaces.length){const a=spaces[0],s=fit(a);Object.assign(hudBox,{x:right?a.x+a.w-hudWidth*s:a.x,y:top?a.y:a.y+a.h-h*s,w:hudWidth*s,h:h*s,s});}
        hudDirty=false;
      }
      ctx.save();ctx.translate(hudBox.x,hudBox.y);ctx.scale(hudBox.s,hudBox.s);
      ctx.fillStyle='rgba(10,20,30,0.7)';ctx.beginPath();ctx.roundRect(0,0,hudWidth,HUD_KEY_H+20,8);ctx.fill();
      ctx.strokeStyle='#e3e9ed88';ctx.lineWidth=1;ctx.stroke();let count=0;
      for(let i=0;i<4;i++) {
        const owned=world.keyState?.keys[hudKeys[i].id]?1:0;
        if(owned&&!hudPrevious[i])hudPop[i]=time;
        if(!owned)hudPop[i]=-Infinity;hudPrevious[i]=owned;count+=owned;
        const p=calm?1:Math.min(1,Math.max(0,(time-hudPop[i])/400));
        // Seno ao quadrado: 1 → 1,35 → 1 em 0,4 s, com velocidade zero nas extremidades.
        const pop=1+.35*Math.sin(Math.PI*p)**2,x=10+i*(slotW+HUD_GAP)+slotW/2,y=10+HUD_KEY_H/2;
        if(owned){ctx.globalAlpha=.28;ctx.drawImage(hudGlows[i],x-24,y-24,48,48);ctx.globalAlpha=1;}
        ctx.drawImage(owned?hudIcons[i]:hudSilhouettes[i],x-slotW*pop/2,y-HUD_KEY_H*pop/2,slotW*pop,HUD_KEY_H*pop);
      }
      ctx.font='bold 14px system-ui';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle=count===4?'#ffd56a':'#fff';
      ctx.fillText(`${count}/4`,10+4*(slotW+HUD_GAP),10+HUD_KEY_H/2);ctx.restore();
    }
    const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
    function polygon(coords,color) {
      ctx.fillStyle=color;ctx.beginPath();coords.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();
    }
    function ellipse(x,y,rx,ry,color) {ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
    function sprite(name,x,y,w,h,flip=false) {
      const img=images[name];if(!img?.complete||!img.naturalWidth)return false;
      const ratio=Math.min(w/img.naturalWidth,h/img.naturalHeight);
      const sw=Math.round(img.naturalWidth*ratio),sh=Math.round(img.naturalHeight*ratio);
      ctx.save();ctx.translate(Math.round(x),Math.round(y));if(flip)ctx.scale(-1,1);ctx.drawImage(img,-sw/2,-sh,sw,sh);ctx.restore();
      return true;
    }
    function fallbackTile(x,y,time,reducedMotion) {
      const type=world.at(x,y),px=x*T,py=y*T,n=noise(x,y);
      if(type===types.water) {
        rect(px,py,T,T,'#55acbc');
        const phase=reducedMotion?0:Math.floor(time/1300)%3;
        rect(px+8+n*19,py+12+((x+y+phase)%3)*7,16,2,'#88cdd0');
        rect(px+13+n*15,py+14+((x+y+phase)%3)*7,7,2,'#b5e5db');
        if(world.at(x-1,y)!==types.water)rect(px,py,5,T,'#9cd6cb');
        if(world.at(x+1,y)!==types.water)rect(px+T-5,py,5,T,'#9cd6cb');
        if(world.at(x,y-1)!==types.water)rect(px,py,T,5,'#9cd6cb');
        if(world.at(x,y+1)!==types.water)rect(px,py+T-5,T,5,'#9cd6cb');
        return;
      }
      if(type===types.grass) {
        const forest=x<36&&y<38;
        rect(px,py,T,T,forest?'#7b9b55':'#91ad61');
        for(let i=0;i<5;i++) {
          const a=noise(x,y,i+1),b=noise(x,y,i+11);
          rect(px+5+a*36,py+5+b*36,3,2,i%2?'#a5bc72':forest?'#658a4e':'#7d9d54');
          if(i===0&&a>.76){rect(px+5+a*36,py+1+b*36,2,4,'#5e8447');rect(px+3+a*36,py+b*36,5,2,'#e9d782');}
        }
      } else if(type===types.sand) {
        rect(px,py,T,T,'#e5cb93');
        for(let i=0;i<4;i++)rect(px+6+noise(x,y,i+2)*35,py+6+noise(y,x,i+9)*35,3,2,'#cbb27d');
      } else if(type===types.stone) {
        rect(px,py,T,T,'#9cab9d');
        rect(px+3,py+3,42,19,n>.5?'#adb8a4':'#a4b29f');
        rect(px+3,py+25,20,20,'#b1b8a6');rect(px+26,py+25,19,20,'#a9b6a2');
        rect(px+5,py+4,36,2,'#c4ccaf');
      } else if(type===types.path) {
        rect(px,py,T,T,'#ccaf79');
        rect(px+7+n*26,py+8+noise(y,x)*28,7,3,'#b99c6d');
        rect(px+4+noise(x,y,5)*33,py+4+noise(x,y,7)*34,4,2,'#e3ca91');
        for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])if(world.at(x+dx,y+dy)===types.grass) {
          if(dx)rect(px+(dx<0?0:44),py,4,T,'#a1a96b');
          if(dy)rect(px,py+(dy<0?0:44),T,4,'#a1a96b');
        }
      } else if(type===types.bridge) {
        rect(px,py,T,T,'#70533f');
        for(let i=0;i<4;i++){rect(px+2+i*12,py+2,9,44,i%2?'#b68a5b':'#c29a67');rect(px+3+i*12,py+3,7,2,'#d7b481');}
        if(world.at(x,y-1)!==types.bridge||world.at(x,y+1)!==types.bridge) {
          const railY=world.at(x,y-1)!==types.bridge?py+3:py+41;
          rect(px,railY,T,6,'#4e4435');rect(px,railY-6,6,15,'#796345');rect(px+42,railY-6,6,15,'#796345');
        }
      }
    }
    function house(o,barn=false) {
      const {x,y,width:w,height:h}=o,top=y-h;
      ellipse(x,y+2,w*.54,12,'#3e593b33');
      rect(x-w*.42,top+h*.38,w*.84,h*.62,'#624b3b');
      rect(x-w*.40,top+h*.4,w*.8,h*.58,barn?'#b7644c':'#eed4a2');
      rect(x-w*.4,y-12,w*.8,12,'#b09670');
      polygon([[x-w*.52,top+h*.42],[x-w*.45,top+h*.12],[x,top],[x+w*.45,top+h*.12],[x+w*.52,top+h*.42]],'#574737');
      polygon([[x-w*.48,top+h*.37],[x-w*.42,top+h*.14],[x,top+7],[x+w*.42,top+h*.14],[x+w*.48,top+h*.37]],o.color||'#a85743');
      for(let i=0;i<4;i++)rect(x-w*.38,top+h*(.18+i*.052),w*.76,3,barn?'#d48760':'#ffffff20');
      rect(x-w*.3,top+h*.05,18,h*.17,'#736555');rect(x-w*.32,top+h*.04,23,6,'#9d9379');
      rect(x-19,y-57,38,57,'#6c513d');rect(x-14,y-53,28,49,barn?'#834e39':'#ae8556');
      rect(x+7,y-29,4,4,'#f2d797');
      if(barn){rect(x-40,y-74,80,6,'#e8d3a1');polygon([[x-33,y-7],[x+33,y-57],[x+36,y-51],[x-30,y-1]],'#e8d3a1');}
      else for(const dx of [-w*.27,w*.27]){rect(x+dx-15,y-66,30,35,'#6a604c');rect(x+dx-11,y-62,22,26,'#7caca8');rect(x+dx-1,y-63,3,29,'#ede0b6');rect(x+dx-13,y-51,26,3,'#ede0b6');rect(x+dx-18,y-29,36,6,'#a37650');}
      rect(x-28,y-3,56,10,'#b8b096');rect(x-32,y+7,64,5,'#93977d');
      if(o.library){rect(x-43,y-100,86,23,'#5c7057');ctx.fillStyle='#f8e3ac';ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText('BIBLIOTECA',x,y-84);}
    }
    function fallbackObject(o,time,reducedMotion) {
      const {x,y,width:w,height:h}=o;
      if(o.kind==='tree'){ellipse(x,y,43,12,'#415b3933');sprite('treeOriginal',x,y,w,h);return;}
      if(o.kind==='cat'){sprite('cat',x,y,w,h);return;}
      if(o.kind==='house'||o.kind==='barn'){house(o,o.kind==='barn');return;}
      if(o.kind==='portal') {
        ellipse(x,y+2,51,13,'#4c5a5944');rect(x-43,y-12,86,15,'#7b8d89');
        polygon([[x-34,y-12],[x-34,y-80],[x-20,y-104],[x+20,y-104],[x+34,y-80],[x+34,y-12]],'#485a6e');
        polygon([[x-25,y-14],[x-25,y-75],[x-13,y-95],[x+13,y-95],[x+25,y-75],[x+25,y-14]],'#9eb7c1');
        rect(x-22,y-72,44,57,'#b1b1d8');rect(x-18,y-64,36,49,'#cbd5e7');
        for(let i=0;i<4;i++){rect(x-40,y-75+i*18,12,13,'#899d9d');rect(x+28,y-75+i*18,12,13,'#899d9d');}
        rect(x-27,y-94,54,12,'#a2b5ae');rect(x-14,y-105,28,11,'#bccaba');
        const drift=reducedMotion?0:Math.sin(time/600)*4;rect(x-3,y-56+drift,6,6,'#fff3c3');rect(x+11,y-34-drift,3,3,'#fff3c3');
      } else if(o.kind==='sign') {
        ellipse(x,y+2,22,6,'#415b3933');rect(x-4,y-34,8,36,'#775334');rect(x-24,y-55,48,30,'#674c32');rect(x-21,y-52,42,23,'#deb575');rect(x-15,y-46,30,3,'#8f7048');rect(x-12,y-40,24,3,'#8f7048');
      } else if(o.kind==='fountain') {
        ellipse(x,y,69,28,'#64786f');ellipse(x,y-7,64,26,'#c4c7aa');ellipse(x,y-12,53,21,'#67b2b8');ellipse(x,y-13,43,16,'#92d1c8');
        rect(x-14,y-66,28,51,'#7d918d');rect(x-10,y-65,20,46,'#b3bfaa');ellipse(x,y-61,27,12,'#657d78');ellipse(x,y-67,28,11,'#c8d1b2');ellipse(x,y-70,20,7,'#82bdbc');
        rect(x-3,y-84,6,16,'#d4eee0');rect(x-19,y-56,3,24,'#bce6d5');rect(x+17,y-56,3,24,'#bce6d5');
      } else if(o.kind==='well') {
        ellipse(x,y,37,16,'#626c60');rect(x-33,y-35,66,29,'#acb39b');ellipse(x,y-34,33,13,'#d2cdb0');ellipse(x,y-35,22,8,'#4e6967');rect(x-31,y-68,7,47,'#765b40');rect(x+24,y-68,7,47,'#765b40');polygon([[x-42,y-64],[x,y-91],[x+42,y-64]],'#986648');
      } else if(o.kind==='column') {
        ellipse(x,y+3,34,9,'#a1896033');rect(x-28,y-12,56,15,'#998e72');rect(x-22,y-21,44,10,'#c8bd97');rect(x-17,y-90,34,70,'#b6ac8c');rect(x-12,y-88,7,63,'#dfd2a8');rect(x+10,y-88,5,67,'#978f75');rect(x-25,y-102,50,15,'#958e73');rect(x-22,y-105,44,8,'#e0d0a5');
      } else if(o.kind==='arch') {
        for(const dx of [-55,55]){rect(x+dx-17,y-128,34,128,'#b9ae8d');rect(x+dx-12,y-121,7,112,'#d6c9a0');rect(x+dx-23,y-12,46,15,'#9d957b');}
        rect(x-72,y-141,144,30,'#8d8a75');rect(x-67,y-143,134,19,'#d2c49a');rect(x-22,y-157,44,25,'#aa9b7e');rect(x-15,y-151,30,14,'#e0cf9e');
      } else if(o.kind==='tablet') {
        rect(x-33,y-50,66,51,'#9f9275');rect(x-29,y-54,58,48,'#d2bd8e');rect(x-24,y-49,48,38,'#bba678');
        if(o.shape==='triangle')polygon([[x,y-44],[x-17,y-17],[x+17,y-17]],'#776f5e');
        if(o.shape==='square')rect(x-14,y-42,28,25,'#776f5e');
        if(o.shape==='circle')ellipse(x,y-29,14,13,'#776f5e');
      } else if(o.kind==='mill') {
        rect(x-48,y-135,96,135,'#b9b69c');rect(x-42,y-132,84,127,'#d5ceb0');polygon([[x-63,y-134],[x,y-193],[x+63,y-134]],'#8d644f');rect(x-15,y-47,30,47,'#715a42');rect(x-12,y-104,24,28,'#7ba6a5');
        const angle=reducedMotion?Math.PI/4:time/4200;
        ctx.save();ctx.translate(x,y-158);ctx.rotate(angle);
        for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);rect(-5,4,10,84,'#705b45');rect(5,22,28,66,'#ece0b6');for(let j=0;j<4;j++)rect(5,25+j*17,28,3,'#a7946a');}ellipse(0,0,11,11,'#685741');ctx.restore();
      } else if(o.kind==='crops') {
        rect(x-w/2,y-h,w,h,'#82674c');rect(x-w/2+5,y-h+5,w-10,h-10,'#ac8053');
        for(let row=0;row<4;row++)for(let col=0;col<7;col++) {
          const sx=x-w/2+16+col*24,sy=y-h+18+row*26;rect(sx-6,sy+4,17,3,'#795f44');rect(sx,sy-4,5,15,'#5d883f');rect(sx-6,sy-2,6,7,'#78a64b');rect(sx+5,sy-7,6,9,'#adc265');rect(sx+1,sy+2,4,5,'#de9856');
        }
      } else if(o.kind==='hay') {
        rect(x-30,y-38,60,38,'#b89b52');rect(x-27,y-41,54,36,'#e1c276');for(let i=0;i<5;i++)rect(x-23+i*10,y-36,3,27,'#cbae5e');rect(x-12,y-42,5,39,'#947548');rect(x+12,y-42,5,39,'#947548');
      } else if(o.kind==='rock'||o.kind==='cliff') {
        polygon([[x-w/2,y],[x-w*.48,y-h*.55],[x-w*.23,y-h],[x+w*.27,y-h*.92],[x+w*.5,y-h*.46],[x+w/2,y]],o.kind==='rock'?'#839181':'#6f807e');
        polygon([[x-w*.44,y-h*.56],[x-w*.21,y-h+6],[x+w*.24,y-h*.88],[x+w*.42,y-h*.46],[x+w*.15,y-h*.36],[x-w*.17,y-h*.4]],'#a6b0a1');rect(x-w*.31,y-h*.31,w*.21,4,'#899993');rect(x+w*.12,y-h*.17,w*.24,4,'#536e6b');
      } else if(o.kind==='rescue') {
        rect(x-61,y+3,122,9,'#7c8074');
        for(const dx of [-54,54]){rect(x+dx-5,y-104,10,107,'#9d9b83');rect(x+dx-7,y-108,14,8,'#d0c3a0');}
        rect(x-57,y-105,114,8,'#b4ae91');
        for(let i=0;i<4;i++){const lx=x-33+i*22;rect(lx-6,y-12,12,17,'#676d65');rect(lx-4,y-16,8,7,'#c5b895');rect(lx-2,y-9,4,5,'#d9c38b');}
      }
    }
    function ground(name,x,y) {
      const img=images[`ground-${name}`];
      if(!img?.complete||!img.naturalWidth)return false;
      const sx=((x%96)+96)%96,sy=((y%96)+96)%96;
      ctx.drawImage(img,sx,sy,T,T,x,y,T,T);return true;
    }
    function tile(x,y,time,reducedMotion) {
      const type=world.at(x,y),px=x*T,py=y*T;
      if(type===types.bridge){fallbackTile(x,y,time,reducedMotion);return;}
      const region=IslandWorld.regionAt(px,py).id;
      const name=type===types.path?(region==='ruins'?'sand':region==='mountain'?'paving':'grass'):
        type===types.stone&&y>25?'grass':{0:'water',1:'grass',2:'sand',4:'paving'}[type];
      if(!ground(name,px,py)){fallbackTile(x,y,time,reducedMotion);return;}
      if(name==='grass') {
        // A sombra da floresta se mistura à campina em uma faixa de transição.
        const shade=Math.max(0,Math.min(1,(37-x)/6))*Math.max(0,Math.min(1,(39-y)/6));
        if(shade){ctx.globalAlpha=shade;ground('forest',px,py);ctx.globalAlpha=1;}
      }
      if(type===types.sand) {
        const grassAt=(dx,dy)=>world.at(x+dx,y+dy)===types.grass;
        // Cantos recortados suavizam as trilhas sem alterar a área caminhável.
        for(const [cx,cy,dx,dy] of [[0,0,-1,-1],[T,0,1,-1],[0,T,-1,1],[T,T,1,1]]) {
          if(!grassAt(dx,0)||!grassAt(0,dy))continue;
          ctx.save();ctx.beginPath();
          for(let row=0;row<3;row++) {
            const size=12-row*4;
            ctx.rect(px+cx+(dx<0?0:-size),py+cy+(dy<0?row*4:-row*4-4),size,4);
          }
          ctx.clip();ground(x<34&&y<35?'forest':'grass',px,py);ctx.restore();
        }
      }
      if(type===types.water) {
        const drift=reducedMotion?0:Math.sin(time/950+x*.7+y*.4)*2;
        for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])if(world.at(x+dx,y+dy)!==types.water) {
          const tint='#c4e4ca';
          if(dx){rect(px+(dx<0?2:43),py+3+drift,3,20,tint);rect(px+(dx<0?4:41),py+27-drift,2,16,'#96d4c6');}
          else {rect(px+3+drift,py+(dy<0?2:43),20,3,tint);rect(px+27-drift,py+(dy<0?4:41),16,2,'#96d4c6');}
        }
        if(!reducedMotion&&noise(x,y,31)>.8) {
          const shimmer=(Math.sin(time/1400+x+y)+1)/2;
          ctx.globalAlpha=shimmer*.28;rect(px+12,py+20,16,2,'#d6f1de');ctx.globalAlpha=1;
        }
      }
    }
    function roads(minX,minY,maxX,maxY) {
      for(const name of ['dirt','paving']) {
        const img=images[`ground-${name}`];
        if(!img?.complete||!img.naturalWidth)return;
        if(!patterns[name])patterns[name]=ctx.createPattern(img,'repeat');
      }
      ctx.save();ctx.beginPath();
      // Água mantém seu contorno físico. A trilha pode curvar sobre a grama.
      for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++)if(world.at(x,y)!==types.water)ctx.rect(x*T,y*T,T,T);
      ctx.clip();ctx.strokeStyle=patterns.dirt;ctx.lineWidth=126;ctx.lineCap='round';ctx.lineJoin='round';
      for(const route of world.routes) {
        const points=route.map(([x,y])=>[(x+.5)*T,(y+.5)*T]);
        ctx.beginPath();ctx.moveTo(...points[0]);
        for(let i=1;i<points.length-1;i++) {
          const next=points[i+1],current=points[i];
          ctx.quadraticCurveTo(...current,(current[0]+next[0])/2,(current[1]+next[1])/2);
        }
        ctx.lineTo(...points[points.length-1]);ctx.stroke();
      }
      ctx.fillStyle=patterns.dirt;ctx.beginPath();ctx.ellipse(48.5*T,38.5*T,262,244,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=patterns.paving;ctx.beginPath();ctx.ellipse(48.5*T,35.5*T,146,132,0,0,Math.PI*2);ctx.fill();ctx.restore();
      // O piso e os corrimãos ficam por cima da trilha, atravessando o rio.
      for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++)if(world.at(x,y)===types.bridge)fallbackTile(x,y,0,true);
    }
    function object(o,time,reducedMotion) {
      let name=o.art||o.kind;
      if(o.kind==='house')name=o.library?'library':'cottage';
      if(o.kind==='tree')name=o.art||'treeOriginal';
      if(o.kind==='tablet')name=`${o.shape}Tile`;
      if(o.kind==='rescue') {
        sprite('arch',o.x,o.y,134,122);
        if(!world.catRescued)sprite('fence',o.x,o.y+5,112,30);
        const regions=['forest','village','ruins','farm'];
        for(let i=0;i<4;i++)if(!(world.unlockedLocks||[]).includes(regions[i]))sprite('lock',o.x-33+i*22,o.y+6,15,20);
        return;
      }
      const organic=['tree','fern','flowers','flowerBush','berryBush'].includes(o.kind);
      const sway=!reducedMotion&&organic?Math.sin(time/1900+o.x*.015)*.7:0;
      if(!['crops','fern','flowers'].includes(o.kind))ellipse(o.x,o.y+1,Math.min(48,o.width*.35),Math.min(10,o.width*.09),'#3d56342a');
      const mirror=o.kind==='house'&&!o.library&&Math.floor(o.x/T)%2===0;
      if(!sprite(name,o.x+sway,o.y,o.width,o.height,mirror)){fallbackObject(o,time,reducedMotion);return;}
      if(o.kind==='portal'&&!reducedMotion) {
        for(let i=0;i<3;i++) {
          const drift=((time/70+i*19)%64);
          ctx.globalAlpha=Math.sin(drift/64*Math.PI)*.8;
          rect(o.x-16+i*15+Math.sin(time/800+i)*5,o.y-25-drift,2,2,'#fff0bd');
        }
        ctx.globalAlpha=1;
      }
      if(o.kind==='fountain'&&!reducedMotion) {
        const shine=(Math.sin(time/450)+1)/2;
        ctx.globalAlpha=shine*.6;rect(o.x-23,o.y-29,7,1,'#e1faf0');rect(o.x+16,o.y-37,5,1,'#e1faf0');ctx.globalAlpha=1;
      }
    }
    function pollen(camera,time,reducedMotion) {
      if(reducedMotion)return;
      const spots=[[40,40],[54,47],[22,24],[25,54],[78,54]];
      for(const [tx,ty] of spots)for(let i=0;i<4;i++) {
        const px=(tx+.5)*T+Math.sin(time/2900+i*2+tx)*120;
        const py=(ty+.5)*T+Math.cos(time/3300+i*3+ty)*85;
        if(px<camera.x||px>camera.x+width||py<camera.y||py>camera.y+height)continue;
        ctx.globalAlpha=.3+Math.sin(time/1800+i)*.15;rect(px,py,2,2,'#fff3b5');
      }
      ctx.globalAlpha=1;
    }
    function marker(context,px,py,r=4) {
      context.fillStyle='#4e493f';context.beginPath();context.arc(px,py,r+2,0,Math.PI*2);context.fill();
      context.fillStyle='#fff4c8';context.beginPath();context.arc(px,py,r,0,Math.PI*2);context.fill();
    }
    function renderOverview(player,camera,visited,large=false) {
      const target=large?map:mini,c=large?mapCanvas:miniCanvas;
      target.imageSmoothingEnabled=false;target.clearRect(0,0,c.width,c.height);target.drawImage(overview,0,0,c.width,c.height);
      if(!world.width||!world.height)return;
      const sx=c.width/world.width,sy=c.height/world.height;
      if(!large){const view=viewSize();target.strokeStyle='#fff1c399';target.lineWidth=1;target.strokeRect(camera.x*sx,camera.y*sy,view.width*sx,view.height*sy);}
      for(const region of world.regions) {
        const rx=(region.x+.5)*T*sx,ry=(region.y+.5)*T*sy;
        target.fillStyle=visited.has(region.id)?'#fbefc1':'#454e40';target.fillRect(rx-2,ry-2,4,4);
        if(large){target.font='bold 13px system-ui';target.textAlign='center';target.strokeStyle='#344b45';target.lineWidth=3;target.strokeText(region.short,rx,ry-10);target.fillStyle='#fff4d2';target.fillText(region.short,rx,ry-10);}
      }
      marker(target,player.x*sx,player.y*sy,large?6:3);
    }
    function drawHero(player) {
      const hero=images.hero;
      if(hero?.complete&&hero.naturalWidth) {
        const {frameW:fw,frameH:fh,pivotX,pivotY}=HERO_SHEET,k=HERO_SCALE;
        const column=player.frame??HeroAnimation.IDLE,row=player.row??player.dir??0;
        ctx.save();
        ctx.imageSmoothingEnabled=false;
        ctx.drawImage(hero,column*fw,row*fh,fw,fh,Math.round(player.x-pivotX*k),Math.round(player.y-pivotY*k),fw*k,fh*k);
        ctx.restore();
      } else sprite(player.facing==='up'?'back':player.facing==='down'?'front':'side',player.x,player.y,PLAYER_HEIGHT,PLAYER_HEIGHT,player.facing==='left');
    }
    function draw(player,camera,near,time,reducedMotion,visited) {
      if(world.spawnPending){Object.assign(player,world.spawn);world.spawnPending=false;}
      const view=viewSize(),factor=scale()/WORLD_SCALE;
      // Janela em mundo, centralizada no jogador e limitada pelo tamanho real do mapa.
      camera={x:Math.max(0,Math.min(world.width-view.width,player.x-view.width/2)),y:Math.max(0,Math.min(world.height-view.height,player.y-view.height/2))};
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);ctx.save();ctx.scale(factor,factor);ctx.translate(-camera.x,-camera.y);
      const background=images.island,vw=Math.min(view.width,world.width-camera.x),vh=Math.min(view.height,world.height-camera.y);
      if(background.naturalWidth&&vw>0&&vh>0) {
        // Câmera em px do mundo → JPEG: sx = cam.x / WORLD_SCALE (idem y e tamanho).
        ctx.drawImage(occlusion?.backgroundCanvas||background,camera.x/WORLD_SCALE,camera.y/WORLD_SCALE,vw/WORLD_SCALE,vh/WORLD_SCALE,camera.x,camera.y,vw,vh);
      }
      // Sombra acompanha o tamanho da personagem (9×3 era para HERO_SCALE 1,2).
      const shadow=HERO_SCALE/1.2;
      ellipse(player.x,player.y-2*shadow,9*shadow,3*shadow,'#3b593a55');
      const hero=images.hero;
      const dir=player.dir||0;

      if(hero?.complete&&hero.naturalWidth) {
        // Quadro da folha: coluna = passo da animação, linha = direção; pés no pivô (24,52).
        const {frameW:fw,frameH:fh,pivotX,pivotY}=HERO_SHEET,k=HERO_SCALE;
        // A coluna já vem de HeroAnimation (respeita "Menos animações").
        const column=player.frame??HeroAnimation.IDLE;
        const row=dir;
        ctx.save();
        ctx.imageSmoothingEnabled=false;
        ctx.drawImage(hero,column*fw,row*fh,fw,fh,player.x-pivotX*k,player.y-pivotY*k,fw*k,fh*k);
        ctx.restore();
      } else {
        const side=(player.facing==='left'||player.facing==='down-left'||player.facing==='up-left');
        const face=player.facing==='up'?'back':player.facing==='down'?'front':'side';
        sprite(face,player.x,player.y,PLAYER_HEIGHT,PLAYER_HEIGHT,side);
      }
   
      occlusion?.update(player.x/WORLD_SCALE,player.y/WORLD_SCALE,player.frame??HeroAnimation.IDLE,player.dir||0);
      player.behind=!!occlusion?.behind;
      occlusion?.draw(ctx,camera.x,camera.y,vw,vh);
      window.IslandKeys?.draw(ctx,world,player,camera,view,factor,time,reducedMotion);
      if(debug) {
        const c=world.collision;
        if(c&&vw>0&&vh>0) {
          if(hitboxOverlay&&c.mask) {
            ctx.globalAlpha=.35;
            ctx.drawImage(c.mask,camera.x/WORLD_SCALE*c.maskScaleX,camera.y/WORLD_SCALE*c.maskScaleY,
              vw/WORLD_SCALE*c.maskScaleX,vh/WORLD_SCALE*c.maskScaleY,camera.x,camera.y,vw,vh);
            ctx.globalAlpha=1;
          }
          const unit=COLLISION_CELL_SIZE*WORLD_SCALE;
          ctx.drawImage(c.overlay,camera.x/unit,camera.y/unit,vw/unit,vh/unit,camera.x,camera.y,vw,vh);
        }
        if(occlusionOverlay&&occlusion&&vw>0&&vh>0)ctx.drawImage(occlusion.overlay,
          camera.x/WORLD_SCALE,camera.y/WORLD_SCALE,vw/WORLD_SCALE,vh/WORLD_SCALE,camera.x,camera.y,vw,vh);
        ctx.strokeStyle='#00ff70';ctx.lineWidth=1;
        ctx.strokeRect(player.x-FOOT_W/2,player.y-FOOT_H,FOOT_W,FOOT_H);
      }
      ctx.restore();
      drawHud(time,reducedMotion);
      renderOverview(player,camera,visited);
      world.devScreen?.draw(ctx,width,height,time);
      if(debug) {
        ctx.save();
        ctx.fillStyle = '#000c';
        ctx.fillRect(8, 8, 310, 96);
        ctx.strokeStyle = '#ffe36b';
        ctx.lineWidth = 1;
        ctx.strokeRect(8, 8, 310, 96);
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const dRow = player.row ?? player.dir ?? 0;
        const dCol = player.frame ?? 0;
        const DIRS_PT = ['baixo', 'esquerda', 'direita', 'cima', 'baixo-esq', 'baixo-dir', 'cima-esq', 'cima-dir'];
        const dDirName = DIRS_PT[dRow] || '';
        const dSpeed = (player.speed || 0).toFixed(1);
        const dDist = (player.distSinceCommand || 0).toFixed(1);
        ctx.fillText(`linha: ${dRow} (${dDirName})  coluna: ${dCol}`, 16, 16);
        ctx.fillText(`velocidade: ${dSpeed} px/s  distância: ${dDist} px`, 16, 34);
        ctx.fillText(`andando: ${player.moving ? 'sim' : 'não'}  setor: ${player.sector ?? '-'}`, 16, 52);
        ctx.fillText(`animTime: ${(player.animTime || 0).toFixed(3)}s`, 16, 70);
        ctx.fillStyle = '#ffe36b';
        ctx.fillText('F3 liga/desliga este painel', 16, 86);
        ctx.restore();

        ctx.save();ctx.font='14px monospace';ctx.textAlign='left';ctx.textBaseline='top';
        const curReg=(typeof getIslandRegion==='function')?getIslandRegion(player.x/WORLD_SCALE,player.y/WORLD_SCALE):IslandWorld.regionAt(player.x,player.y);
        const spriteDirName = DIRS_PT[player.dir ?? 0] || player.facing || '';
        const lines=[
          `x: ${(player.x/WORLD_SCALE).toFixed(0)}  y: ${(player.y/WORLD_SCALE).toFixed(0)}`,
          `Região: ${curReg?.name||''}`,
          `Intenção: ${player.intentName || '(nenhuma)'}`,
          `Sprite: ${spriteDirName} (${player.facing || ''})`,
          `Trocas/s: ${player.switchesPerSec ?? 0}`,
          `Célula: ${IslandWorld.cellAt(world,player.x,player.y)?'andável':'bloqueada'}`,
          `atrás: ${player.behind?'sim':'não'} [O] | máscara [H]`,
          `Zoom: ${zoom.toFixed(2)}${factor>zoom+.001?` (encaixe: ${factor.toFixed(2)})`:''} [+/-]`,
          `Largura visível: ${(Math.min(1,view.width/world.width)*100).toFixed(2)}%`
        ];
        const pw=Math.ceil(Math.max(...lines.map(line=>ctx.measureText(line).width)))+20,ph=lines.length*22+16;
        const right=DEBUG_PANEL_CORNER.endsWith('right'),top=DEBUG_PANEL_CORNER.startsWith('top');
        const spaces=overlaySpaces(8,true);
        const fit=a=>Math.min(1,a.w/pw,a.h/ph),anchor=a=>({x:right?a.x+a.w-pw*fit(a):a.x,y:top?a.y:a.y+a.h-ph*fit(a)});
        const score=a=>{const p=anchor(a);return fit(a)*1e6-Math.hypot(p.x-(right?width-pw-8:8),p.y-(top?8:height-ph-8));};
        spaces.sort((a,b)=>score(b)-score(a));
        if(spaces.length) {
          const area=spaces[0],p=anchor(area);ctx.translate(p.x,p.y);ctx.scale(fit(area),fit(area));
          ctx.fillStyle='rgba(10,20,30,0.7)';ctx.beginPath();ctx.roundRect(0,0,pw,ph,8);ctx.fill();
          lines.forEach((line,i)=>{ctx.fillStyle=i?'#fff':'#ffe36b';ctx.fillText(line,10,8+i*22);});
        }
        ctx.restore();
      }
    }
    return {ready,failed,resize,draw,renderOverview,toggleDebug(){debug=!debug;hitboxOverlay=debug;occlusionOverlay=debug;},get debug(){return debug;},get width(){return viewSize().width;},get height(){return viewSize().height;}};
  }
  return {create};
})();
