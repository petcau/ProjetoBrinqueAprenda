/* Geometria pura do finale. Coordenadas em pixels do design 1024 × 572. */
window.FinalLogic = (() => {
  'use strict';
  function layout(d) {
    // Frações locais preservam novaPos = baseNova + k * (posAntiga - baseAntiga),
    // com k = larguraNova / larguraAntiga; gato, argolas e jaula compartilham a base.
    const j=d.jaula,k=j.largura*TOPO_CAGE_SCALE/j.sprite[0],h=j.sprite[1]*k;
    // Escala em torno da base fixa: novaPos = base + escala * (posAntiga - base).
    const cage={x:j.base[0]-j.largura*TOPO_CAGE_SCALE/2,y:j.base[1]-h,w:j.largura*TOPO_CAGE_SCALE,h};
    return {
      cage,open:{x:cage.x+j.deslocamentoAberta*k,y:cage.y,w:j.aberta[0]*k,h},
      cat:{x:cage.x+cage.w*d.gato.dentro[0],y:cage.y+cage.h*d.gato.dentro[1]},
      locks:d.cadeados.map(p=>({x:cage.x+cage.w*p.fracao[0],y:cage.y+cage.h*p.fracao[1],w:d.cadeadoAltura*TOPO_CAGE_SCALE*110/177,h:d.cadeadoAltura*TOPO_CAGE_SCALE})),
      scale:k
    };
  }
  function hit(r,x,y,pad=0) {return x>=r.x-pad&&x<=r.x+r.w+pad&&y>=r.y-pad&&y<=r.y+r.h+pad;}
  function flight(out,from,to,t,height=70) {
    t=Math.max(0,Math.min(1,t));
    // Interpolação linear + parábola: 4*t*(1-t) vale zero nas pontas e um no meio do arco.
    out.x=from.x+(to.x-from.x)*t;out.y=from.y+(to.y-from.y)*t-height*4*t*(1-t);
    return out;
  }
  function routeLength(route) {
    let length=0;for(let i=1;i<route.length;i++)length+=Math.hypot(route[i].x-route[i-1].x,route[i].y-route[i-1].y);return length;
  }
  function walkRoute(out,route,distance) {
    distance=Math.max(0,distance);
    for(let i=1;i<route.length;i++){
      const a=route[i-1],b=route[i],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
      if(distance<=length||i===route.length-1){
        const t=length?Math.min(1,distance/length):1;out.x=a.x+dx*t;out.y=a.y+dy*t;
        out.dir=Math.abs(dx)>Math.abs(dy)?dx<0?1:2:dy<0?3:0;
        return i===route.length-1&&distance>=length;
      }
      distance-=length;
    }
    if(route.length){out.x=route[0].x;out.y=route[0].y;}return true;
  }
  function selfTest(d,sizes) {
    const g=layout(d),errors=[],k=g.scale;
    if(Math.abs(g.cage.x+219*k-(g.open.x+255*k))>1e-6)errors.push('cabeças douradas desalinhadas');
    for(let i=0;i<4;i++) {
      const r=g.locks[i];
      if(!hit(g.cage,r.x-r.w/2,r.y)||!hit(g.cage,r.x+r.w/2,r.y+r.h))errors.push(`cadeado ${i+1} fora da jaula`);
    }
    for(const item of sizes)if(item.actual&&(Math.abs(item.actual[0]-item.expected[0])>1||item.actual[1]!==item.expected[1]))errors.push(`tamanho de ${item.name}: ${item.actual.join('×')}`);
    return errors;
  }
  return Object.freeze({layout,hit,flight,routeLength,walkRoute,selfTest});
})();
