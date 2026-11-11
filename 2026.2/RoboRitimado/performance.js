(() => {
  'use strict';
  const clamp = (n,a=0,b=1) => Math.max(a,Math.min(b,n));
  const smooth = n => { n=clamp(n);return n*n*(3-2*n); };
  const TAU=Math.PI*2;
  function mixColor(a,b,t){return '#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');}
  const definitions=Object.freeze({
    doces:{style:'Pop de açúcar',name:'Doce balanço',phrases:['Balanço de açúcar','Passo de nuvem','Onda de confeitos','Final coração']},
    brinquedos:{style:'Funk dos brinquedos',name:'Desfile das estrelas',phrases:['Marca o passinho','Deslize de brinquedo','Balanço das estrelas','Desfile triunfal']},
    gelo:{style:'Ballet · valsa em 3 tempos',name:'Valsa dos cristais',phrases:['Plié suave','Passo de valsa','Arco de cristal','Reverência de neve']},
    nebulosa:{style:'Dança dos vaga-lumes',name:'Órbita violeta',phrases:['Passo da névoa','Balanço de luz','Roda das estrelas','Abraço de vaga-lumes']},
    atlanta:{style:'Dança das marés',name:'Onda de cristal',phrases:['Passo da maré','Balanço de coral','Órbita das conchas','Onda de alegria']},
    deserto:{style:'Dança das dunas',name:'Passos do sol',phrases:['Balanço das dunas','Passo solar','Onda de areia','Grande final do sol']},
    pantano:{style:'Groove da floresta',name:'Balanço das raízes',phrases:['Passo de raiz','Onda de folhas','Groove dos vaga-lumes','Abraço da floresta']},
    ceu:{style:'Dança contemporânea',name:'Órbita das nuvens',phrases:['Respiração das nuvens','Onda celestial','Passo em órbita','Abraço das estrelas']},
    masmorra:{style:'Rock vulcânico',name:'Pulso de magma',phrases:['Passo da forja','Dupla batida','Solo de magma','Ritmo incandescente']},
    colina:{style:'Rock melódico',name:'Voo das pétalas',phrases:['Passo escarlate','Onda de pétalas','Volta do mirante','Acorde da jornada']}
  });
  const moods=[
    {name:'Tristinho',message:'A próxima é nossa. Vamos juntos!',color:'#b5b8f4'},
    {name:'Concentrado',message:'No seu tempo. Estou com você!',color:'#a5d8ff'},
    {name:'Animando',message:'Isso! Estamos pegando o ritmo!',color:'#c6a8ff'},
    {name:'Feliz',message:'Que alegria tocar com você!',color:'#f6a1d8'},
    {name:'Radiante',message:'Uau! Nosso show está brilhando!',color:'#ffe29b'}
  ];
  const textures=new WeakMap();
  function face(ctx,box,mood,id,clip,mouth,tears){
    // The original face and original eyes are never repainted. Only a small
    // mouth patch below the eyes and two cheek tear paths may change.
    if(mood===2||!mouth)return;
    const [x,y,w,h,angle,skin,ink]=mouth;
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);
    ctx.fillStyle=skin;ctx.beginPath();ctx.ellipse(0,0,w*.65,h*.8,0,0,TAU);ctx.fill();
    ctx.strokeStyle=ink;ctx.lineWidth=Math.max(1,w*.11);ctx.lineCap='round';ctx.lineJoin='round';
    ctx.shadowColor=ink;ctx.shadowBlur=1.2;ctx.beginPath();ctx.moveTo(-w*.48,mood===0?h*.25:-h*.2);
    ctx.quadraticCurveTo(0,mood===0?-h*.65:h*.75,w*.48,mood===0?h*.25:-h*.2);ctx.stroke();
    if(mood===4){ctx.globalAlpha=.3;ctx.lineWidth=Math.max(.7,w*.045);ctx.translate(0,h*.16);ctx.stroke();}
    ctx.restore();
    if(mood===0&&tears){
      ctx.save();ctx.strokeStyle='#8ce6ff';ctx.fillStyle='#b9f4ff';ctx.lineCap='round';ctx.lineWidth=Math.max(1,w*.085);
      for(const [tx,ty,dx,dy]of tears){ctx.beginPath();ctx.moveTo(tx,ty);ctx.quadraticCurveTo(tx+dx*.3,ty+dy*.45,tx+dx,ty+dy);ctx.stroke();ctx.beginPath();ctx.ellipse(tx+dx,ty+dy,w*.085,h*.23,-.12,0,TAU);ctx.fill();}
      ctx.restore();
    }
  }
  function texture(image,rect,box,mood,id,clip,mouth,tears){
    let cache=textures.get(image);if(!cache){cache=new Map();textures.set(image,cache);}
    mood=mood===0?0:mood>=3?4:2;
    const key=rect.join(',')+':'+mood+':'+id;if(cache.has(key))return cache.get(key);
    const c=document.createElement('canvas');c.width=rect[2];c.height=rect[3];const cx=c.getContext('2d');
    cx.drawImage(image,...rect,0,0,c.width,c.height);if(box)face(cx,box,mood,id,clip,mouth,tears);cache.set(key,c);return c;
  }
  // Rigid whole-body illustration: uniform scale and sole-pivot rotation only.
  // No vertex warping, bending, stretching or separate limb physics.
  function body(ctx,image,rect,x,floor,scale,stance,alpha) {
    ctx.save();
    ctx.globalAlpha=alpha;ctx.translate(x,floor);ctx.rotate(stance.lean);
    if(stance.flip)ctx.scale(-1,1);
    ctx.drawImage(image,...rect,-stance.contactX*scale,-stance.groundY*scale,rect[2]*scale,rect[3]*scale);
    ctx.restore();
  }
  const stages=new Map();
  function staticPlatform(ctx,{width,height,floor,x,id,colors,accent,power,beat,soft,still}){
    ctx.clearRect(0,0,width,height);
    x=width*.52;
    const rx=width*.44,ry=Math.min(28,width*.073),cy=floor,depth=Math.min(24,width*.06),intensity=soft?.12:.25+power*.55;
    const stageTints={doces:'#59325e',brinquedos:'#2d4772',gelo:'#253957',deserto:'#68454b',pantano:'#254b4b',masmorra:'#5b2339',colina:'#67294c'};
    const tint=stageTints[id]||'#49405e';
    ctx.save();
    // A stable, dark scenic backing separates the original outfit from the view.
    const halo=ctx.createRadialGradient(x,cy-height*.42,12,x,cy-height*.42,width*.7);
    halo.addColorStop(0,tint+'8c');halo.addColorStop(.7,tint+'45');halo.addColorStop(1,tint+'00');
    ctx.fillStyle=halo;ctx.fillRect(0,0,width,height);
    const front=ctx.createLinearGradient(0,cy,0,cy+ry+depth);front.addColorStop(0,accent);front.addColorStop(1,tint);
    ctx.fillStyle=front;ctx.beginPath();ctx.ellipse(x,cy+depth,rx,ry,0,0,TAU);ctx.fill();ctx.fillRect(x-rx,cy,rx*2,depth);
    ctx.save();ctx.beginPath();ctx.ellipse(x,cy+depth,rx,ry,0,0,TAU);ctx.rect(x-rx,cy,rx*2,depth);ctx.clip();
    for(let i=0;i<12;i++){
      const px=x-rx+i*rx/6,ww=rx/6;
      if(id==='doces'){
        ctx.fillStyle=i%2?'#f7cfed':'#f4a9d9';ctx.beginPath();ctx.roundRect(px,cy-2,ww+2,depth*.6+ry*(.5+(i%3)*.1),[0,0,ww*.35,ww*.35]);ctx.fill();
      }else if(id==='brinquedos'){
        ctx.fillStyle=colors[i%4];ctx.fillRect(px+2,cy+5,ww-4,depth+ry);ctx.strokeStyle='#ffffff99';ctx.strokeRect(px+2,cy+5,ww-4,depth+ry);
      }else if(id==='gelo'){
        ctx.fillStyle=i%2?'#94dfffc0':'#cbbcf9b0';ctx.beginPath();ctx.moveTo(px,cy);ctx.lineTo(px+ww,cy+depth+ry);ctx.lineTo(px+ww*1.5,cy);ctx.closePath();ctx.fill();
      }else if(id==='nebulosa'){
        ctx.fillStyle=i%2?'#bb83d9':'#6e639d';ctx.beginPath();ctx.ellipse(px+ww*.5,cy+depth,ww*.6,ry*.7,0,0,TAU);ctx.fill();
        ctx.fillStyle='#f2d8ff';ctx.beginPath();ctx.arc(px+ww*.5,cy+depth,2,0,TAU);ctx.fill();
      }else if(id==='atlanta'){
        ctx.fillStyle=i%2?'#478fbe':'#73bfcf';ctx.fillRect(px,cy,ww+1,depth+ry);ctx.strokeStyle='#b4f5dd';ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(px,cy+depth);ctx.quadraticCurveTo(px+ww*.5,cy+depth-ry*.6,px+ww,cy+depth);ctx.stroke();
      }else if(id==='deserto'){
        ctx.fillStyle=i%2?'#e3a271':'#a97b66';ctx.fillRect(px+1,cy,ww-2,depth+ry);ctx.strokeStyle='#ffe0aa';ctx.strokeRect(px+3,cy+7,ww-6,9);
      }else if(id==='pantano'){
        ctx.fillStyle=i%2?'#658d70':'#446d60';ctx.beginPath();ctx.ellipse(px+ww*.5,cy+depth,ww*.65,ry*.7,-.3,0,TAU);ctx.fill();
      }else if(id==='masmorra'){
        ctx.strokeStyle=i%2?'#ffc486':'#ee739a';
        ctx.lineWidth=3;
        ctx.beginPath();ctx.moveTo(px,cy+2);ctx.lineTo(px+ww*.53,cy+depth);ctx.lineTo(px+ww,cy+2);ctx.stroke();
      }else if(id==='colina'){
        ctx.fillStyle=i%2?'#f88fb7':'#cf87e2';
        ctx.beginPath();ctx.ellipse(px+ww*.5,cy+depth,ww*.58,ry*.45,-.45,0,TAU);ctx.fill();
      }else{
        ctx.fillStyle='#e3cb8dbb';ctx.fillRect(px,cy+depth+ry*.4,ww,3);
        ctx.fillStyle='#e7e4fff0';ctx.beginPath();ctx.ellipse(px+ww*.5,cy+depth+ry*.4,ww*.55,ry*.38,0,0,TAU);ctx.fill();
      }
    }
    ctx.restore();
    ctx.fillStyle=tint;ctx.beginPath();ctx.ellipse(x,cy,rx,ry,0,0,TAU);ctx.fill();
    const top=ctx.createLinearGradient(0,cy-ry,0,cy+ry);top.addColorStop(0,colors[1]+'66');top.addColorStop(1,accent+'9a');
    ctx.fillStyle=top;ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#f5ecff';ctx.stroke();
    ctx.lineWidth=2;ctx.strokeStyle=colors[1];ctx.beginPath();ctx.ellipse(x,cy,rx*.86,ry*.72,0,0,TAU);ctx.stroke();
    for(let i=0;i<9;i++){
      const px=x-rx*.86+i*rx*.215,py=cy+depth+Math.sqrt(Math.max(0,1-((px-x)/rx)**2))*ry*.7;
      ctx.save();ctx.translate(px,py);ctx.fillStyle=colors[i%4];ctx.strokeStyle='#fff';ctx.lineWidth=1;
      if(id==='doces'){ctx.beginPath();ctx.arc(0,0,4,0,TAU);ctx.fill();}
      else if(id==='brinquedos'){ctx.rotate((i%2?.12:-.12));ctx.fillRect(-5,-5,10,10);ctx.strokeRect(-5,-5,10,10);}
      else if(id==='gelo'){ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(4,0);ctx.lineTo(0,7);ctx.lineTo(-4,0);ctx.closePath();ctx.fill();}
      else {ctx.font='16px Trebuchet MS';ctx.textAlign='center';ctx.fillText('✦',0,5);}
      ctx.restore();
    }
    ctx.restore();
  }
  function lighting(ctx,{width,height,floor,x,colors,power=0,beat=0,soft=false,still=false,deluxe=false,frenzy=false,symbol}){
    const intensity=soft?.12:.04+power*.96,center=width*.52;
    ctx.save();
    if(!soft&&!deluxe){
      ctx.strokeStyle='#ded4ff80';ctx.lineWidth=deluxe?5:3;ctx.beginPath();ctx.moveTo(width*.12,height*.065);ctx.lineTo(width*.9,height*.065);ctx.stroke();
    }
    for(let n=0;n<4;n++){
      const top=n>=2,side=n%2?1:-1;
      const sx=center+side*width*(top?.36:.38),sy=top?height*.085:floor-6;
      const target=x+Math.sin(still?0:beat*Math.PI/4+n)*width*.018;
      const ty=top?floor-8:height*.2,spread=width*(top?.2:.19);
      const color=mixColor(colors[n%4],colors[(n+1)%4],smooth(power));
      if(!soft){
        const beam=ctx.createLinearGradient(sx,sy,target,ty);beam.addColorStop(0,color+'d5');beam.addColorStop(.5,color+'70');beam.addColorStop(1,color+'12');
        ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=intensity*(deluxe?.76:.65);ctx.fillStyle=beam;
        ctx.beginPath();ctx.moveTo(sx-4,sy);ctx.lineTo(target-spread,ty);ctx.quadraticCurveTo(target,ty+(top?15:-15),target+spread,ty);ctx.lineTo(sx+4,sy);ctx.closePath();ctx.fill();
        ctx.strokeStyle=beam;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(target,ty);ctx.stroke();
        if(top){ctx.fillStyle=color+'50';ctx.beginPath();ctx.ellipse(target,floor-6,width*.18,10+power*7,0,0,TAU);ctx.fill();}
        ctx.restore();
      }
      ctx.save();ctx.translate(sx,sy);ctx.rotate((top?-1:1)*side*.25);ctx.fillStyle='#28233d';ctx.strokeStyle='#f1e8ff';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.roundRect(-11,-6,22,15,4);ctx.fill();ctx.stroke();ctx.fillStyle=color;ctx.globalAlpha=soft?.35:intensity;ctx.shadowColor=color;ctx.shadowBlur=soft?0:power*27;ctx.beginPath();ctx.ellipse(0,top?7:-5,8,4,0,0,TAU);ctx.fill();ctx.restore();
    }
    if(!soft){
      ctx.strokeStyle=colors[1]+'a0';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(center,floor-4,width*.4,Math.min(23,width*.055),0,0,TAU);ctx.stroke();
      if(power>.35){
        for(let i=0;i<8;i++){
          const phase=((beat*.08+i/8)%1+1)%1,alpha=Math.sin(phase*Math.PI)*intensity;
          ctx.globalAlpha=alpha;ctx.fillStyle=colors[i%4];const px=center+Math.sin(i*2.3+beat*.12)*width*.42,py=floor-height*(.08+phase*.68);
          ctx.beginPath();ctx.moveTo(px,py-4);ctx.lineTo(px+2,py);ctx.lineTo(px,py+4);ctx.lineTo(px-2,py);ctx.closePath();ctx.fill();
        }
      }
      if(frenzy && symbol?.complete && symbol.naturalWidth){
        const glow = ctx.createRadialGradient(center,floor*.52,0,center,floor*.52,width*.48);
        glow.addColorStop(0,colors[0]+'80');
        glow.addColorStop(1,colors[1]+'00');
        ctx.fillStyle=glow;
        ctx.fillRect(0,0,width,floor);
        for(let i=0;i<12;i++){
          const phase=(beat/8+i/12)%1;
          const angle=i*2.399+beat*.21;
          const size=Math.min(48,width*.12)*(1+.24*Math.sin(phase*TAU));
          const px=center+Math.cos(angle)*width*.39;
          const py=floor*(.92-phase*.8);
          ctx.globalAlpha=Math.sin(phase*Math.PI)*.85;
          ctx.drawImage(symbol,px-size/2,py-size/2,size,size);
        }
      }
    }
    ctx.restore();return{intensity,fixtures:4,topFixtures:2,bottomFixtures:2,following:true,topProjected:true};
  }
  function platform(ctx,o){
    const {width,height,floor,id,colors,accent,power,x}=o;
    const key=[Math.round(width),Math.round(height),Math.round(floor),id,...colors,accent].join('|');
    let base=stages.get(key);
    if(!base){
      if(stages.size>=6)stages.delete(stages.keys().next().value);
      base=document.createElement('canvas');base.width=Math.ceil(width*1.25);base.height=Math.ceil(height*1.25);const cx=base.getContext('2d');cx.scale(1.25,1.25);staticPlatform(cx,o);stages.set(key,base);
    }
    ctx.clearRect(0,0,width,height);ctx.drawImage(base,0,0,width,height);
    return{theme:id,center:width*.52,floor,power,...lighting(ctx,o),cachedBase:true};
  }
  // Direction order is ← ↓ ↑ →. Each stance has a frame (−1 is the
  // alternate illustration), reflection, sole-pivot angle and lateral offset.
  const stances = {
    doces:      [[1,false,-.045,-.045],[4,false,.012,0],[5,false,-.025,.012],[3,false,.052,.037]],
    brinquedos: [[2,false,-.065,-.046],[4,false,.022,-.006],[5,false,-.018,.006],[7,false,.048,.043]],
    gelo:       [[-1,true,-.025,-.033],[0,false,.060,-.012],[-1,false,-.012,.008],[0,true,.045,.035]],
    ceu:        [[0,true,-.065,-.041],[-1,false,.045,-.01],[0,false,-.040,.007],[-1,true,.028,.036]],
    deserto:    [[-1,false,-.065,-.042],[-1,true,.050,-.007],[0,true,-.028,.006],[0,false,.066,.044]],
    pantano:    [[0,true,-.050,-.048],[0,false,.055,-.011],[-1,true,-.021,.011],[-1,false,.050,.037]],
    nebulosa:   [[-1,true,-.043,-.037],[0,true,.045,-.01],[-1,false,-.047,.007],[0,false,.055,.043]],
    atlanta:    [[0,false,-.057,-.044],[-1,true,.038,-.016],[-1,false,-.030,.013],[0,true,.060,.036]],
    masmorra:   [[-1,false,-.070,-.039],[0,true,.065,-.009],[0,false,-.042,.004],[-1,true,.063,.042]],
    colina:     [[0,true,-.056,-.036],[-1,false,.056,-.013],[-1,true,-.034,.013],[0,false,.058,.039]],
    fase11:     [[2,false,-.053,-.038],[4,false,.030,-.008],[5,false,-.028,.006],[3,false,.052,.034]]
  };
  function stepAmount(progress) {
    return smooth(progress / .24) * (1 - smooth((progress - .56) / .44));
  }
  function draw(ctx,image,level,{width,height,mood=2,danceImage,lane=null,weight=0,previousLane=null,previousWeight=0,motion=1}){
    const neutral = [0,false,0,0];
    const move = lane==null ? neutral : stances[level.id][lane];
    const previous = previousLane==null ? neutral : stances[level.id][previousLane];
    const floor=height*.935;
    const distance=Math.min(height,width*1.1);
    const center=width*.52+distance*motion*(move[3]*weight+previous[3]*previousWeight);
    const lean=motion*(move[2]*weight+previous[2]*previousWeight);
    const base=level.frames[0];
    const heightLimit=Math.min(width*.84/(level.designWidth||440),height*.86/(level.designHeight||552))*base[3];
    function layer(stance,alpha){
      if(alpha<=.001)return;
      const [index,flip]=stance;
      const alternate=index===-1&&danceImage?.complete&&danceImage.naturalWidth;
      const frame=index===-1?0:index;
      const rect=alternate?[0,0,danceImage.naturalWidth,danceImage.naturalHeight]:level.frames[frame];
      const [groundY,contactX]=alternate?level.dance.contact:level.contacts?.[frame]||
        [frame===0?(level.groundY||rect[3]):rect[3],frame===0?(level.contactX||rect[2]*.5):rect[2]*.5];
      const scale=Math.min(heightLimit/rect[3],width*.84/rect[2]);
      const x=center+(flip?-1:1)*(contactX-rect[2]*.5)*scale;
      const transform={lean,groundY,contactX,flip};
      if(!alternate&&frame===0&&level.mouth&&mood!==2){
        const tex=texture(image,rect,level.face,mood,level.id,level.faceClip,level.mouth,level.tears);
        body(ctx,tex,[0,0,rect[2],rect[3]],x,floor,scale,transform,alpha);
      }else body(ctx,alternate?danceImage:image,rect,x,floor,scale,transform,alpha);
    }
    const neutralWeight=Math.max(0,1-weight-previousWeight);
    layer(neutral,neutralWeight);
    layer(previous,previousWeight);
    layer(move,weight);
    const definition=definitions[level.id];
    const phrase=lane==null?definition.name:definition.phrases[lane];
    return { x:center,floor,height:heightLimit,lean,phrase,scale:heightLimit/base[3],frame:0,
      nextFrame:move[0],blend:weight,stepLane:lane,flipped:move[1],groundContact:{x:center,y:floor},
      pose:{x:center,lean,lift:0},backend:'rigid-illustration',connected:true,rigid:true,mood:moods[mood].name };
  }
  function arenaPose(ctx,sprite,x,floor,height,step) {
    const move = step.lane==null?[0,false,0,0]:stances.fase11[step.lane];
    const previous = step.previousLane==null?[0,false,0,0]:stances.fase11[step.previousLane];
    const {weight,previousWeight,motion}=step;
    const center=x+height*motion*(move[3]*weight+previous[3]*previousWeight);
    const rotation=motion*(move[2]*weight+previous[2]*previousWeight);
    const layers=[[0,Math.max(0,1-weight-previousWeight)],[previous[0],previousWeight],[move[0],weight]];
    for(const [frame,alpha] of layers)if(alpha>.001)
      RR_SPRITES.draw(ctx,sprite,RR_SPRITES.standard[frame],center,floor,height,{rotation,alpha});
  }
  window.RR_PERFORMANCE=Object.freeze({definitions,moods,draw,platform,texture,lighting,stepAmount,arenaPose});
})();
