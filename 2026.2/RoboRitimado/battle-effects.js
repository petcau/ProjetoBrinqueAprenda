(() => {
  'use strict';
  const clamp = n => Math.max(0,Math.min(1,n));
  const mix = (a,b,t) => a+(b-a)*t;
  const tau = Math.PI*2;
  const violet = ['#a765fa','#381268','#f7d8ff'];
  const lights = new Map();

  function light(ctx,color,x,y,radius,alpha=1) {
    let stamp=lights.get(color);
    if(!stamp){
      stamp=document.createElement('canvas');
      stamp.width=stamp.height=96;
      const paint=stamp.getContext('2d');
      const fill=paint.createRadialGradient(48,48,0,48,48,48);
      fill.addColorStop(0,color+'e0');fill.addColorStop(.25,color+'85');fill.addColorStop(1,color+'00');
      paint.fillStyle=fill;paint.fillRect(0,0,96,96);
      lights.set(color,stamp);
    }
    ctx.save();ctx.globalAlpha*=alpha;
    ctx.drawImage(stamp,x-radius,y-radius,radius*2,radius*2);ctx.restore();
  }
  function diamond(ctx,x,y,rx,ry,color) {
    ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y-ry);ctx.lineTo(x+rx,y);
    ctx.lineTo(x,y+ry);ctx.lineTo(x-rx,y);ctx.closePath();ctx.fill();
  }
  function flare(ctx,x,y,r,p,palette,quiet) {
    const [color,,core]=palette;
    const radius=r*(.42+p*.72);
    ctx.save();ctx.globalAlpha*=Math.max(0,1-p);
    light(ctx,color,x,y,radius*1.6,.56);
    ctx.lineWidth=Math.max(1,r*.065);
    ctx.strokeStyle=color;ctx.beginPath();ctx.ellipse(x,y,radius,radius*.62,-.18,0,tau);ctx.stroke();
    ctx.lineWidth=1.2;ctx.strokeStyle=core;ctx.beginPath();ctx.ellipse(x,y,radius*.82,radius*.52,.15,0,tau);ctx.stroke();
    const count=quiet?4:12;
    for(let i=0;i<count;i++){
      const a=i*2.39996;
      const reach=radius*(.75+i%4*.13);
      diamond(ctx,x+Math.cos(a)*reach,y+Math.sin(a)*reach,1.8,3+i%3,i%2?core:color);
    }
    ctx.restore();
  }
  function ribbon(ctx,x1,y1,x2,y2,width,bend,palette) {
    const [edge,shade,core]=palette;
    const fill=ctx.createLinearGradient(x1,y1,x2,y2);
    fill.addColorStop(0,shade+'18');fill.addColorStop(.42,edge+'cc');fill.addColorStop(1,core);
    ctx.beginPath();ctx.moveTo(x1,y1);
    ctx.bezierCurveTo(mix(x1,x2,.32),y1+bend,mix(x1,x2,.74),y2-bend,x2,y2);
    ctx.lineCap='round';ctx.strokeStyle=edge+'49';ctx.lineWidth=width*1.9;ctx.stroke();
    ctx.strokeStyle=fill;ctx.lineWidth=width;ctx.stroke();
    ctx.strokeStyle=core+'b0';ctx.lineWidth=Math.max(1,width*.22);ctx.stroke();
  }
  function projectile(ctx,from,to,p,r,palette,quiet,arc=0) {
    const x=mix(from.x,to.x,p), y=mix(from.y,to.y,p)-Math.sin(p*Math.PI)*arc;
    const back=quiet?Math.max(0,p-.14):Math.max(0,p-.28);
    ribbon(ctx,mix(from.x,to.x,back),mix(from.y,to.y,back)-Math.sin(back*Math.PI)*arc,x,y,r*.58,r*.45,palette);
    light(ctx,palette[0],x,y,r*2,.88);
    diamond(ctx,x,y,r*.78,r*.86,palette[0]);
    diamond(ctx,x,y,r*.28,r*.42,palette[2]);
  }
  function shockwave(ctx,from,to,p,r,palette,quiet) {
    const x=mix(from.x,to.x,p);
    const y=to.y, width=r*(.7+p*.55);
    light(ctx,palette[0],x,y,width*1.7,.56);
    ctx.save();ctx.translate(x,y);
    for(let i=0;i<3;i++){
      ctx.lineWidth=3-i*.65;ctx.strokeStyle=[palette[2],palette[0],palette[0]+'60'][i];
      ctx.beginPath();ctx.ellipse(i*width*.22,0,width*(.62+i*.18),width*(.17+i*.045),0,0,tau);ctx.stroke();
    }
    if(!quiet)for(let i=0;i<6;i++){
      const side=i%2?1:-1,dx=width*(.4+i*.12);
      ctx.lineWidth=1.8;ctx.strokeStyle=palette[0]+'bf';ctx.beginPath();ctx.moveTo(0,0);
      ctx.lineTo(side*dx*.48,side*7);ctx.lineTo(side*dx*.73,-side*9);ctx.lineTo(side*dx,side*13);ctx.stroke();
    }
    ctx.restore();
  }
  function enemy(ctx,event,beat,layout,quiet) {
    const attack=event.enemyAttack;
    if(!attack)return;
    const {boss,player,floor,r}=layout;
    const prepared=clamp((beat-event.warn)/(event.begin-event.warn));
    light(ctx,violet[0],boss.x,boss.y,r*(1.3+prepared*.7),.82);
    ctx.strokeStyle='#c795ffba';ctx.lineWidth=2;ctx.beginPath();
    ctx.ellipse(boss.x,boss.y,r*.76,r*.36,-.48,0,tau);ctx.stroke();
    diamond(ctx,boss.x,boss.y,r*.19,r*.32,violet[2]);
    if(beat<event.begin){
      ctx.strokeStyle='#cc95f8ad';ctx.lineWidth=1.5;ctx.beginPath();
      ctx.ellipse(player.x,floor,r*(1.2-.32*prepared),r*.27,0,0,tau);ctx.stroke();
      return;
    }
    const elapsed=beat-event.begin;
    const p=clamp(elapsed/event.duration);
    const ground={x:player.x,y:floor};
    if(attack==='rupture'){
      const wave=quiet?.8:clamp((elapsed%2)/1.6);
      shockwave(ctx,boss,ground,wave,r,violet,quiet);
    }else if(attack==='meteors'){
      const ember=['#ff8c66','#622467','#fff1bd'];
      for(let i=0;i<3;i++){
        const offset=elapsed-i;
        if(offset<-.85||offset>1.1)continue;
        const source={x:boss.x+i*r*.34,y:boss.y-r*(1.45+i*.18)};
        const result=event.judgments[i];
        if(event.id==='meteors'&&result&&result!=='miss'){
          projectile(ctx,ground,boss,quiet?.65:clamp(Math.max(0,offset)/1.1),r*.58,['#80ddfb','#4037b2','#eafaff'],quiet,r*.94);
        }else if(offset<.32){
          projectile(ctx,source,ground,quiet?.67:clamp((offset+.85)/1.17),r*.68,ember,quiet,r*.72);
        }else flare(ctx,ground.x,ground.y,r,clamp((offset-.32)/.78),ember,quiet);
      }
    }else if(attack==='chains'||attack==='constellation'){
      const count=attack==='chains'?6:Math.max(1,4-event.hits);
      ctx.lineWidth=2.4;ctx.strokeStyle=violet[0];
      for(let i=0;i<count;i++){
        const a=i*tau/count+(quiet?0:elapsed*.46);
        const x=player.x+Math.cos(a)*r*1.22,y=player.y+Math.sin(a)*r*.85;
        if(attack==='chains'){
          ctx.beginPath();ctx.ellipse(x,y,r*.29,r*.13,a+Math.PI*.5,0,tau);ctx.stroke();
        }else{
          ribbon(ctx,player.x,player.y,x,y,2,0,violet);
          diamond(ctx,x,y,4,8,violet[2]);
        }
      }
    }else if(attack==='beam'||attack==='rift'){
      const target=mix(player.x,boss.x,.28+event.hits*.065);
      ribbon(ctx,boss.x,boss.y,target,player.y-r*.32,r*.28,r*.45,violet);
      if(attack==='rift')RR_PORTAL.draw(ctx,target,player.y-r*.32,r*.69,r*1.07,quiet?0:beat,.9,false,true);
      else flare(ctx,target,player.y-r*.32,r*.75,p,violet,quiet);
    }else{
      const pulse=quiet?.65:clamp((elapsed%2.2)/1.8);
      if(attack==='magnet')projectile(ctx,player,boss,pulse,r*.54,violet,quiet,r);
      else if(attack==='ash')shockwave(ctx,boss,ground,pulse,r*1.35,violet,quiet);
      else projectile(ctx,boss,player,pulse,r*.76,violet,quiet,r*.6);
    }
  }
  function phoenix(ctx,x,y,r,p,palette) {
    const [color,shade,core]=palette;
    ctx.save();ctx.translate(x,y);
    const flap=Math.sin(p*Math.PI*3)*r*.17;
    const fill=ctx.createLinearGradient(-r,0,r*.65,0);
    fill.addColorStop(0,shade+'35');fill.addColorStop(.54,color);fill.addColorStop(1,core);
    for(const side of [-1,1]){
      ctx.save();ctx.scale(1,side);
      ctx.fillStyle=fill;ctx.beginPath();ctx.moveTo(r*.2,0);
      ctx.quadraticCurveTo(-r*.15,r*.62,-r*1.28,r+flap);
      for(let i=0;i<4;i++){
        const dx=i*r*.21,dy=i*r*.15;
        ctx.lineTo(-r*1.12+dx,r*.74-dy+flap);ctx.lineTo(-r*.79+dx,r*.82-dy+flap);
      }
      ctx.lineTo(-r*.19,r*.12);ctx.closePath();ctx.fill();ctx.restore();
    }
    ctx.fillStyle=core;ctx.beginPath();ctx.moveTo(r*.73,0);
    ctx.quadraticCurveTo(r*.12,-r*.36,-r*.33,0);ctx.quadraticCurveTo(r*.15,r*.23,r*.73,0);ctx.fill();
    ctx.restore();
  }
  function crystal(ctx,x,y,r,palette) {
    const [color,shade,core]=palette;
    ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x-r*.39,y);ctx.lineTo(x-r*.42,y-r*.55);
    ctx.lineTo(x+r*.14,y-r);ctx.lineTo(x+r*.44,y-r*.51);ctx.lineTo(x+r*.32,y);ctx.closePath();ctx.fill();
    ctx.fillStyle=shade;ctx.beginPath();ctx.moveTo(x+r*.14,y-r);ctx.lineTo(x+r*.44,y-r*.51);
    ctx.lineTo(x+r*.32,y);ctx.lineTo(x-r*.02,y);ctx.closePath();ctx.fill();
    ctx.strokeStyle=core;ctx.lineWidth=1.5;ctx.stroke();
  }
  function player(ctx,result,beat,layout,quiet) {
    const age=beat-result.beat,p=clamp(age/2.4);
    const event=result.event;
    const defensive=['geode','bubble','wind','bridge','protect','prism'].includes(event.id);
    const cast=result.damage||result.heal||defensive&&result.count>0&&result.loss<7;
    const {guitar,boss,player,floor,r}=layout;
    if(!cast){
      if(result.loss)flare(ctx,player.x,player.y,r,p,violet,quiet);
      return;
    }
    const [,main,shade,core]=RR_BATTLE.elements[event.element];
    const palette=[main,shade,core];
    const travel=quiet?.58:clamp((age-.42)/1.25);
    const x=mix(guitar.x,boss.x,travel),y=mix(guitar.y,boss.y,travel);
    ctx.save();ctx.globalAlpha*=p>.73?1-(p-.73)/.27:1;
    light(ctx,main,guitar.x,guitar.y,r*1.55,.9);
    if(event.id==='phoenix'){
      ribbon(ctx,guitar.x,guitar.y,x,y,r*.24,r*.72,palette);
      phoenix(ctx,x,y,r*(result.count===result.total?.93:.65),quiet?0:p,palette);
    }else if(event.id==='tectonic'||event.id==='bridge'){
      for(let i=0;i<Math.max(1,result.count);i++){
        const reach=(i+1)/(result.total+1);
        if(reach>travel)break;
        crystal(ctx,mix(guitar.x,boss.x,reach),floor,r*(.75+i*.16),palette);
      }
    }else if(event.id==='tide'||event.id==='storm'||event.id==='wind'){
      shockwave(ctx,guitar,{x:boss.x,y:floor},travel,r*1.23,palette,quiet);
    }else if(defensive||result.heal){
      const radius=r*(1.15+p*.33);
      ctx.strokeStyle=core;ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(player.x,player.y,radius,radius*1.28,-.2,0,tau);ctx.stroke();
      flare(ctx,player.x,player.y,r,p*.85,palette,quiet);
      if(result.damage)projectile(ctx,guitar,boss,travel,r*.47,palette,quiet,r*.65);
    }else {
      projectile(ctx,guitar,boss,travel,r*.65,palette,quiet,r*.72);
      if(event.second){
        const [,edge,dark,bright]=RR_BATTLE.elements[event.second];
        ribbon(ctx,guitar.x,guitar.y,x,y,r*.24,-r*.58,[edge,dark,bright]);
      }
    }
    if(result.damage&&travel>.68)flare(ctx,boss.x,boss.y,r,clamp((p-.45)*1.8),palette,quiet);
    ctx.restore();
  }
  window.RR_BATTLE_EFFECTS=Object.freeze({enemy,player,light,flare});
})();
