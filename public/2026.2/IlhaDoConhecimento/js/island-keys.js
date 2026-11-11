/* Chaves de desenvolvimento: recursos únicos e progresso apenas em memória. */
window.IslandKeys = (() => {
  'use strict';
  const art=new Map();let loading;
  function load() {
    return loading ||= Promise.all(KEYS.map(key=>new Promise(resolve=>{
      const glow=document.createElement('canvas');glow.width=glow.height=96;
      const ctx=glow.getContext('2d'),gradient=ctx.createRadialGradient(48,48,0,48,48,48);
      gradient.addColorStop(0,key.color);gradient.addColorStop(1,key.color+'00');
      ctx.fillStyle=gradient;ctx.fillRect(0,0,96,96);
      const image=new Image(),entry={image,glow};art.set(key.id,entry);
      image.onload=resolve;image.onerror=()=>{
        entry.image=null;console.warn(`[Chaves] Imagem ausente: ${key.img}; usando placeholder ${key.label}.`);resolve();
      };image.src=key.img;
    })));
  }
  function place(world,seen) {
    const {cells,cols}=world.collision,C=COLLISION_CELL_SIZE,radius=INTERACT_RADIUS/WORLD_SCALE;
    world.keyState ||= {keys:{}};
    world.mapKeys=KEYS.map(key=>{
      let distance2=Infinity;
      for(let i=0;i<seen.length;i++)if(cells[i]&&seen[i]) {
        const d=(i%cols*C+C/2-key.x)**2+(Math.floor(i/cols)*C+C/2-key.y)**2;
        if(d<distance2)distance2=d;
      }
      const reachableDistance=Math.sqrt(distance2),blocked=!cells[Math.floor(key.y/C)*cols+Math.floor(key.x/C)];
      console.info(`[Chaves] ${key.label}: imagem (${key.x}, ${key.y}) px; célula bloqueada: ${blocked?'sim':'não'}; célula alcançável mais próxima: ${reachableDistance.toFixed(1)} px da imagem.`);
      if(reachableDistance>radius)console.warn(`[Chaves] ${key.label}: nenhuma célula andável alcançável no raio de interação (${radius.toFixed(1)} px da imagem).`);
      // O BFS só diagnostica o alcance; a base visual permanece exatamente no config.
      return {...key,wx:key.x*WORLD_SCALE,wy:key.y*WORLD_SCALE,reachableDistance,name:`Chave de ${key.label}`};
    });
  }
  function nearest(world,player) {
    let result=null,best=INTERACT_RADIUS**2;
    for(const key of world.mapKeys||[])if(!world.keyState.keys[key.id]) {
      const distance=(key.wx-player.x)**2+(key.wy-player.y)**2;
      if(distance<=best){best=distance;result=key;}
    }
    return result;
  }
  function icon(ctx,key,x,y,height) {
    const image=art.get(key.id)?.image,width=height*(image?.naturalWidth||229)/(image?.naturalHeight||482);
    if(image?.naturalWidth)ctx.drawImage(image,x-width/2,y-height,width,height);
    else {
      ctx.fillStyle=key.color;ctx.fillRect(x-width/2,y-height,width,height);
      ctx.fillStyle='#fff';ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillText(key.label,x,y-height-5);
    }
  }
  function draw(ctx,world,player,camera,view,factor,time,calm) {
    const near=nearest(world,player),t=calm?0:time/1000;
    for(const key of world.mapKeys||[]) {
      if(world.keyState.keys[key.id]||key.wx+65<camera.x||key.wx-65>camera.x+view.width||key.wy+48<camera.y||key.wy-75>camera.y+view.height)continue;
      // Seno em segundos: flutuação de 3 px de mundo, a 2,2 rad/s.
      const offsetY=Math.sin(t*2.2)*3,y=key.wy-KEY_HOVER+offsetY;
      ctx.save();ctx.fillStyle='#10182055';ctx.beginPath();ctx.ellipse(key.wx,key.wy,11,3,0,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=.35+Math.sin(t*2.2)*.10;
      const glow=art.get(key.id)?.glow;if(glow)ctx.drawImage(glow,key.wx-48,y-KEY_HEIGHT/2-48,96,96);
      ctx.globalAlpha=1;icon(ctx,key,key.wx,y,KEY_HEIGHT);
      if(key===near) {
        // Mundo → tela: herda a transformação do personagem; desfaz só a escala do balão.
        ctx.translate(key.wx,y-KEY_HEIGHT-8);ctx.scale(1/factor,1/factor);
        ctx.fillStyle='#12202de6';ctx.beginPath();ctx.roundRect(-72,-30,144,28,8);ctx.fill();
        ctx.fillStyle='#fff';ctx.font='bold 14px system-ui';ctx.textAlign='center';ctx.fillText('E — Interagir',0,-11);
      }
      ctx.restore();
    }
  }
  function reset(world){if(world.keyState)world.keyState.keys={};}
  return {load,place,nearest,icon,draw,reset};
})();
