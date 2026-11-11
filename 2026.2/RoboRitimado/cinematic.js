(() => {
  'use strict';
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),smooth=t=>{t=clamp(t);return t*t*(3-2*t);},lerp=(a,b,t)=>a+(b-a)*t;
  const shots = RR_NARRATIVE.opening;
  function create(canvas){
    const ctx=canvas.getContext('2d');let w=1440,h=900,dpr=1,lastModel={};
    const standard=RR_SPRITES.load('assets/pixel-padrao-v1.png'),candy=RR_SPRITES.load('assets/pixel-doces-danca-v6.png'),story=RR_SPRITES.load('assets/pixel-doces-historia-v6.png'),guitar=RR_SPRITES.load('assets/guitarra-doces-v6.png');
    const locations = Object.fromEntries(['concert','backstage','dressing'].map(name=>[name,RR_SPRITES.load('assets/orbithop-'+name+'-v13.png')]));
    const resting = RR_SPRITES.load('assets/pixel-backstage-v13.png');
    const standardGuitar = RR_SPRITES.load('assets/guitarra-padrao-v13.png');
    const ready=Promise.all([standard.ready,candy.ready,story.ready,guitar.ready,resting.ready,standardGuitar.ready,...Object.values(locations).map(asset=>asset.ready)]).then(()=>{
      RR_SPRITES.validate(standard.image,RR_SPRITES.standard);RR_SPRITES.validate(candy.image,RR_SPRITES.cells());RR_SPRITES.validate(story.image,RR_SPRITES.story.map(f=>f.r));
    });ready.catch(()=>{});
    new ResizeObserver(()=>{const b=canvas.getBoundingClientRect();w=Math.max(1,b.width);h=Math.max(1,b.height);dpr=RR_SETTINGS.dpr();canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}).observe(canvas);
    function star(x,y,r,angle=0){ctx.beginPath();for(let i=0;i<10;i++){const a=angle+i*Math.PI/5-Math.PI/2,rr=i%2?r*.42:r;i?ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr):ctx.moveTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}ctx.closePath();}
    const portal=(...args)=>RR_PORTAL.draw(ctx,...args);
    function body(asset,frame,x,y,height,rotation=0,alpha=1,flip=false){if(asset.image.complete&&asset.image.naturalWidth)RR_SPRITES.draw(ctx,asset.image,frame,x,y,height,{rotation,alpha,flip});}
    function guitarProp(x,y,scale=1,rotation=0,alpha=1){if(!guitar.image.complete||!guitar.image.naturalWidth)return;ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.globalAlpha=alpha;const ww=w*(w<700?.28:.16)*scale;ctx.drawImage(guitar.image,-ww/2,-ww*.33,ww,ww*2/3);ctx.restore();}
    function puffs(x,y,t){if(RR_SETTINGS.gentle())return;const p=clamp(t/1.7);ctx.save();ctx.globalAlpha=(1-p)*.6;for(let i=0;i<9;i++){ctx.fillStyle=i%2?'#ffe2f1':'#d7eeff';ctx.beginPath();ctx.ellipse(x+(i-4)*(12+p*23),y-6-Math.sin(i)*p*25,15+p*30,9+p*16,0,0,Math.PI*2);ctx.fill();}ctx.restore();}
    function drawLegacy(shot,t){
      const index=shot.motion;
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
      backdrop(shot.world);
      const gentle=RR_SETTINGS.gentle(),safe=RR_SETTINGS.get().sensitivity,mobile=w<700;
      const floor=h*(mobile?.73:.83),H=Math.min(h*(mobile?.41:.62),w*(mobile?.82:.46)),x=w*(mobile?.59:.69),px=w*(mobile?.47:.48),py=h*(mobile?.36:.43),rx=Math.min(w*.15,h*.2),ry=Math.min(h*.24,w*.24);
      let actorX=x,actorY=floor,actorH=H,rotation=0,alpha=1,pose=0,kind='default',portalOpen=0,portalX=px,portalY=py,prop=false,propX=w*.67,propY=floor-4;
      const bob=gentle?0:Math.sin(t*2)*3;
      if(index===0){pose=t<2.6?5:0;actorY+=bob;}
      if(index===1){pose=t<1.5?3:4;actorY+=gentle?0:Math.sin(t*5)*2;portalOpen=smooth((t-.6)/2.1);}
      if(index===2){pose=7;portalOpen=1;actorX-=gentle?0:smooth(t/4.5)*w*.06;rotation=gentle?0:-.09*Math.sin(t*2);}
      if(index===3){
        pose=7;portalOpen=1;portalX=w*(mobile?.30:.43);portalY=h*.83-H*.52;
        const p=smooth((t-.35)/3.8);
        actorX=lerp(w*(mobile?.60:.70),portalX,p);
        actorY=lerp(h*.83-H*.28,portalY+H*.18,p);
        actorH=H*(1-.95*p);rotation=gentle?0:-p*.46;alpha=1-smooth((p-.84)/.16);
      }
      if(index===4){
        const g=ctx.createRadialGradient(w*.5,h*.45,20,w*.5,h*.45,w*.7);g.addColorStop(0,'#c8b0f0');g.addColorStop(.25,'#6d52a4');g.addColorStop(1,'#141a43');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
        if(!safe)for(let i=0;i<16;i++){const p=(i/16+(gentle?0:t*.12))%1;ctx.strokeStyle=['#eac4ed80','#a0edff77','#ad97f688'][i%3];ctx.lineWidth=1+p*3;ctx.beginPath();ctx.ellipse(w*.5,h*.45,(40+p*w*.9),(20+p*h*.65),-.2,0,Math.PI*2);ctx.stroke();}
        pose=7;actorX=w*.5+(gentle?0:Math.sin(t*1.1)*w*.06);actorY=h*.6;actorH=H*.6;rotation=gentle?0:Math.sin(t)*.24;alpha=1;
      }
      if(index===5){kind='story';pose=0;portalX=w*.51;portalY=h*.27;portalOpen=smooth(t/1.3);const p=smooth((t-1.2)/2.8);actorX=lerp(portalX,x,p);actorY=lerp(portalY+H*.1,floor,p*p);actorH=H*(.2+.8*p);rotation=gentle?0:lerp(-.8,.1,p);alpha=clamp((t-1.1)/.5);prop=true;propX=lerp(portalX,w*.48,p);propY=lerp(portalY+40,floor,p*p);if(t>4.1){pose=1;rotation=0;actorY=floor;puffs(x,floor,t-4.1);}}
      if(index===6){kind='story';pose=1;portalX=w*.51;portalY=h*.27;portalOpen=1-smooth(t/2.2);actorY=floor+(gentle?0:Math.sin(Math.min(1,t)*Math.PI)*4);prop=true;propX=w*.46;propY=floor-(gentle?0:Math.abs(Math.sin(Math.min(1,t/1.2)*Math.PI*2))*18*(1-clamp(t/1.2)));puffs(x,floor,t+.1);}
      if(index===7){kind='story';pose=t<2.1?2:3;prop=true;propX=w*.46;propY=floor;actorX=x+(gentle?0:Math.sin(t*.6)*5);}
      if(index===8){kind='story';pose=t<1.9?4:t<3.6?5:6;actorX=lerp(x,w*.59,smooth(t/2));prop=t<2.05;propX=w*.46;propY=floor;}
      if(index===9){kind='story';pose=t<3?6:7;actorY+=bob*.4;actorX=w*.59;}
      if(gentle){rotation=0;if(index===1)portalOpen=t>.6?1:0;if(index===5)portalOpen=1;if(index===6)portalOpen=t<1.5?1:0;if(index===3){actorX=px;actorY=floor;actorH=H;alpha=1-smooth(t/3.5);}if(index===4){actorX=w*.5;actorY=h*.68;}if(index===5){actorX=x;actorH=H;actorY=floor;alpha=clamp(t);pose=t<2?0:1;}}
      if(index!==4&&portalOpen>0)portal(portalX,portalY,rx,ry,t,portalOpen,false,!!shot.corrupted);
      // A floor shadow anchors Pixel, but is absent while flying through the tunnel.
      if(index!==3&&index!==4&&index!==5){ctx.save();ctx.globalAlpha=.2;ctx.fillStyle='#36264b';ctx.beginPath();ctx.ellipse(actorX,floor+2,H*.2,H*.025,0,0,Math.PI*2);ctx.fill();ctx.restore();}
      if(prop)guitarProp(propX,propY,1,index===5&&!gentle?t*1.4:gentle?0:.14);
      body(kind==='story'?story:standard,kind==='story'?RR_SPRITES.story[pose]:RR_SPRITES.standard[pose],actorX,actorY,actorH,rotation,alpha,index===3);
      if(index!==4&&portalOpen>0)portal(portalX,portalY,rx,ry,t,portalOpen,true,!!shot.corrupted);
      if(!gentle&&[2,3].includes(index)){ctx.save();ctx.strokeStyle='#dccef066';ctx.lineWidth=2;for(let i=0;i<22;i++){const a=i*.62,tau=(t*.35+i*.071)%1;const xx=lerp(w*(.2+(i*.177)% .8),portalX,tau),yy=lerp(h*(.12+(i*.237)%.7),portalY,tau);ctx.beginPath();ctx.moveTo(xx+Math.cos(a)*15*(1-tau),yy+Math.sin(a)*15*(1-tau));ctx.lineTo(xx,yy);ctx.stroke();}ctx.restore();}
      lastModel={index,world:shot.world,corrupted:!!shot.corrupted,pose,kind,x:actorX,y:actorY,height:actorH,rotation,alpha,portalOpen,guitarOnGround:prop,width:w,heightCanvas:h};
      return lastModel;
    }
    function backdrop(world) {
      const image=locations[world]?.image;
      if(!image?.naturalWidth)return;
      const scale=Math.max(w/image.naturalWidth,h/image.naturalHeight);
      ctx.drawImage(image,(w-image.naturalWidth*scale)/2,(h-image.naturalHeight*scale)/2,image.naturalWidth*scale,image.naturalHeight*scale);
    }
    function standardProp(x,y,size,rotation=0) {
      const image=standardGuitar.image;
      ctx.save();ctx.translate(x,y);ctx.rotate(rotation);
      ctx.drawImage(image,-size/2,-size*image.naturalHeight/image.naturalWidth/2,size,size*image.naturalHeight/image.naturalWidth);
      ctx.restore();
    }
    function restBody(x,y,height,rotation=0) {
      const image=resting.image,scale=height/image.naturalHeight;
      ctx.save();ctx.translate(x,y);ctx.rotate(rotation);
      ctx.drawImage(image,-image.naturalWidth*scale/2,-height,image.naturalWidth*scale,height);
      ctx.restore();
    }
    function audience(t,fade) {
      const gentle=RR_SETTINGS.gentle();
      ctx.save();ctx.globalAlpha=fade*.70;
      for(let i=0;i<42;i++){
        const x=w*(.02+(i%21)*.031),base=h*(.91+Math.floor(i/21)*.065);
        const y=base-(gentle?0:Math.sin(t*3+i)*h*.006);
        const r=h*.011;
        ctx.strokeStyle='#403b68';ctx.lineWidth=r*.50;
        ctx.beginPath();ctx.moveTo(x+r*.8,y);ctx.lineTo(x+r*1.7,y-r*3.6);ctx.stroke();
        ctx.strokeStyle=i%2?'#f9a2e2':'#8de7ff';ctx.lineWidth=3;
        ctx.beginPath();ctx.moveTo(x+r*1.7,y-r*3.6);ctx.lineTo(x+r*1.8,y-r*5);ctx.stroke();
      }
      ctx.restore();
    }
    function surge(x,y,height,t,power) {
      const safe=RR_SETTINGS.gentle();
      ctx.save();
      const halo=ctx.createRadialGradient(x,y-height*.5,0,x,y-height*.5,height*.7);
      halo.addColorStop(0,safe?'#b598ce22':'#a7dfff45');halo.addColorStop(1,'#bb6ac900');
      ctx.fillStyle=halo;ctx.fillRect(0,0,w,h);
      if(!safe){
        ctx.globalAlpha=power*.75;ctx.lineWidth=2;
        for(let i=0;i<8;i++){
          const angle=i*Math.PI/4+t*.32;
          ctx.strokeStyle=i%2?'#9ddfff':'#e89bcf';ctx.beginPath();
          for(let j=0;j<7;j++){
            const distance=height*(.16+j*.055);
            const px=x+Math.cos(angle+j*.09)*distance;
            const py=y-height*.45+Math.sin(angle+j*.09)*distance*.76;
            j?ctx.lineTo(px,py):ctx.moveTo(px,py);
          }
          ctx.stroke();
        }
        ctx.font='bold 25px Trebuchet MS';ctx.fillStyle='#c2eaff';
        for(let i=0;i<6;i++)ctx.fillText(i%2?'♯':'♭',x+Math.sin(i*2.1+t*.7)*height*.4,y-height*(.2+(i/6+t*.06)% .7));
      }
      ctx.restore();
    }
    function drawPrelude(shot,t) {
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);backdrop(shot.world);
      const gentle=RR_SETTINGS.gentle(),mobile=w<700;
      const H=Math.min(h*(shot.world==='concert'?.43:mobile?.4:.56),w*(mobile?.73:.38)),floor=h*(shot.world==='concert'?.56:.83);
      const homeX=w*(mobile?.60:.70),guitarX=w*.81;
      let x=homeX,y=floor,pose=0,rotation=0,open=0,holding=true;
      if(shot.motion==='show'){
        pose=Math.floor(t/3)%2?5:3;
        if(!gentle){
          ctx.save();ctx.globalCompositeOperation='lighter';
          for(let i=0;i<4;i++){
            ctx.fillStyle=i%2?'#f3a0de2b':'#84dfff2b';ctx.beginPath();
            ctx.moveTo(w*(.45+i*.15),h*.08);ctx.lineTo(homeX-H*.4,floor);ctx.lineTo(homeX+H*.4,floor);ctx.closePath();ctx.fill();
          }ctx.restore();
        }
      }
      if(shot.motion==='exit'){
        const p=smooth(t/6);pose=Math.floor(t*1.7)%2?0:2;x=lerp(homeX,w*1.09,p);
        ctx.fillStyle='#111029';ctx.globalAlpha=p*.55;ctx.fillRect(0,0,w,h);ctx.globalAlpha=1;
      }
      if(shot.motion==='walk'){
        x=lerp(w*.28,homeX,smooth(t/7));pose=Math.floor(t*1.6)%2?0:2;
        y-=gentle?0:Math.abs(Math.sin(t*3))*3;
      }
      if(shot.motion==='rest'){holding=false;x=homeX-w*.09;}
      if(shot.motion==='guitar'){
        const p=smooth(t/5);holding=t>=4.5;x=lerp(homeX-w*.09,guitarX-w*.07,p);pose=4;
      }
      if(shot.motion==='surge'){
        pose=7;rotation=gentle?0:Math.sin(t*2.1)*.023;surge(x,y,H,t,smooth(t/2));
      }
      if(shot.motion==='levitate'){
        pose=7;
        const rise=smooth((t-.4)/5);
        y-=gentle?0:rise*H*.28;
        rotation=gentle?0:-.13*rise+.025*Math.sin(t*1.7)*rise;
        open=smooth((t-1.7)/3.2);
        ctx.fillStyle=`rgba(22,10,38,${rise*.36})`;ctx.fillRect(0,0,w,h);
        surge(x,y,H,t,.85);
      }
      const portalX=w*(mobile?.30:.43),portalY=floor-H*.52,rx=H*.43,ry=H*.55;
      if(open)portal(portalX,portalY,rx,ry,t,open,false,true);
      if(!holding){
        standardProp(guitarX,floor-H*.35,H*.7,-1.25+(gentle?0:Math.sin(t*5)*.012));
        restBody(x,y,H);
      }else body(standard,RR_SPRITES.standard[pose],x,y,H,rotation,1,shot.motion==='levitate');
      if(open)portal(portalX,portalY,rx,ry,t,open,true,true);
      if(shot.world==='concert')audience(t,shot.motion==='exit'?1-smooth(t/7)*.6:1);
      lastModel={world:shot.world,motion:shot.motion,pose,x,y,height:H,rotation,portalOpen:open,corrupted:!!shot.corrupted,guitarOnGround:!holding,width:w,heightCanvas:h};
      return lastModel;
    }
    function draw(index,t) {
      const shot=shots[index];
      if(typeof shot.motion==='number')drawLegacy(shot,t);
      else drawPrelude(shot,t);
      lastModel.shot=index;
      return {...lastModel};
    }
    return Object.freeze({ready,draw,snapshot:()=>({...lastModel}),shots});
  }
  window.RR_CINEMA=Object.freeze({create,shots});
})();
