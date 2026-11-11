(() => {
  'use strict';
  const tau = Math.PI * 2;
  function star(ctx,rx,ry,scale,offset=0,fractured=false,t=0) {
    ctx.beginPath();
    for(let i=0;i<10;i++){
      const angle=i*tau/10-Math.PI/2+offset;
      const radius=(i%2?.51:1)*scale*(fractured?1+Math.sin(i*3+t)*.085:1);
      ctx.lineTo(Math.cos(angle)*rx*radius,Math.sin(angle)*ry*radius);
    }
    ctx.closePath();
  }
  function draw(ctx,x,y,rx,ry,time,open=1,front=false,corrupted=false) {
    if(open<=.01 || rx<=0 || ry<=0)return;
    const gentle=RR_SETTINGS.gentle(), safe=RR_SETTINGS.get().sensitivity;
    const t=gentle?0:time;
    const edge=corrupted?'#ff9caf':'#d5faff';
    const shine=corrupted?'#c651e3':'#68d9ff';
    const dark=corrupted?'#170a23':'#15124a';
    ctx.save();
    ctx.translate(x,y);ctx.scale(open,open);
    if(!front){
      if(!safe){
        const halo=ctx.createRadialGradient(0,0,0,0,0,ry*1.17);
        halo.addColorStop(0,shine+'65');halo.addColorStop(.55,shine+'43');halo.addColorStop(1,shine+'00');
        ctx.fillStyle=halo;ctx.fillRect(-ry*1.2,-ry*1.2,ry*2.4,ry*2.4);
      }
      ctx.save();
      star(ctx,rx,ry,1,0,corrupted,t);ctx.clip();
      const space=ctx.createRadialGradient(rx*.1,-ry*.2,0,0,0,ry);
      space.addColorStop(0,corrupted?'#583047':'#3e4794');space.addColorStop(.48,dark);space.addColorStop(1,corrupted?'#60214b':'#5e5bbd');
      ctx.fillStyle=space;ctx.fillRect(-rx,-ry,rx*2,ry*2);
      for(let i=0;i<6;i++){
        const depth=((i/6+t*.19)%1+1)%1;
        ctx.globalAlpha=.12+depth*.36;ctx.strokeStyle=i%2?shine:edge;
        ctx.lineWidth=1+depth*3;star(ctx,rx,ry,.12+depth*.91,Math.sin(i*.8+t*.4)*.065,corrupted,t);ctx.stroke();
      }
      if(!safe)for(let i=0;i<Math.ceil(44*RR_SETTINGS.effects());i++){
        const angle=i*2.39996+t*.16,depth=(i*.618+t*.18)%1;
        const px=Math.cos(angle)*rx*depth,py=Math.sin(angle)*ry*depth;
        ctx.globalAlpha=.2+depth*.55;ctx.fillStyle=i%4===0?shine:edge;
        ctx.beginPath();ctx.arc(px,py,.6+depth*1.7,0,tau);ctx.fill();
      }
      ctx.restore();
      ctx.strokeStyle=shine;
      ctx.shadowColor=shine;ctx.shadowBlur=safe?0:20;
      ctx.lineWidth=Math.max(3,rx*.064);star(ctx,rx,ry,1,0,corrupted,t);ctx.stroke();
      ctx.shadowBlur=0;
      ctx.strokeStyle=edge;ctx.lineWidth=Math.max(1,rx*.018);star(ctx,rx,ry,.99,0,corrupted,t);ctx.stroke();
    }
    if(!safe){
      const count=Math.ceil(26*RR_SETTINGS.effects());
      for(let i=0;i<count;i++){
        const p=(i/count+t*.18)%1,section=Math.floor(p*10),f=p*10-section;
        const a=section*tau/10-Math.PI/2,b=a+tau/10;
        const ra=section%2?.51:1,rb=section%2?1:.51;
        const px=(Math.cos(a)*ra*(1-f)+Math.cos(b)*rb*f)*rx;
        const py=(Math.sin(a)*ra*(1-f)+Math.sin(b)*rb*f)*ry;
        if(front && py<0 || !front && py>=0)continue;
        ctx.fillStyle=i%3?edge:shine;ctx.globalAlpha=.45+(i%4)*.14;
        ctx.beginPath();ctx.arc(px,py,1+i%3,0,tau);ctx.fill();
        if(corrupted&&i%3===0){
          ctx.strokeStyle='#ec6894';ctx.lineWidth=2;
          ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px*1.12+7,py*1.10-4);ctx.lineTo(px*1.22+2,py*1.26);ctx.stroke();
        }
      }
    }
    ctx.restore();
  }
  window.RR_PORTAL=Object.freeze({draw});
})();
