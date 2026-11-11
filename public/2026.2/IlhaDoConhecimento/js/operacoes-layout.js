/* Geometria pura: centros são apoios dos sacos; nenhuma dependência de DOM. */
window.OperacoesLayout = (() => {
  'use strict';
  function bed(def,x,y,scale,cart=false) {
    const cells=[],a=cart?def.longo:def.passo_longo,b=cart?def.curto:def.passo_curto,o=cart?def.origem:def.centro;
    // Carrinho: TL+(origem+(i+.5)/4*longo+(j+.5)/2*curto)*escala.
    // Carroça: TL+(centro+(i-1)*passo_longo+(j-.5)*passo_curto)*escala.
    for(let j=0;j<def.cels_curto;j++)for(let i=0;i<def.cels_longo;i++) {
      const u=cart?(i+.5)/def.cels_longo:i-1,v=cart?(j+.5)/def.cels_curto:j-.5;
      cells.push({x:x+(o[0]+u*a[0]+v*b[0])*scale,y:y+(o[1]+u*a[1]+v*b[1])*scale});
    }
    let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
    for(const u of cart?[0,1]:[-1.5,1.5])for(const v of cart?[0,1]:[-1,1]) {
      const px=x+(o[0]+u*a[0]+v*b[0])*scale,py=y+(o[1]+u*a[1]+v*b[1])*scale;
      left=Math.min(left,px);right=Math.max(right,px);top=Math.min(top,py);bottom=Math.max(bottom,py);
    }
    return {x:left,y:top,w:right-left,h:bottom-top,cells,size:def.saco_px,sprite:def.sprite,drawX:x,drawY:y,scale};
  }
  function build(layout) {
    const p=layout.plataforma_moinho,m=layout.mesa_suprimento;
    return {
      plataforma:{...p,size:46,cells:Array.from({length:p.slots},(_,i)=>({x:p.x+(i+.5)*p.w/p.slots,y:p.y+56}))},
      mesa:{...m,size:38,cells:Array.from({length:12},(_,i)=>({x:m.x+(i%4+.5)*m.w/4,y:m.y+40+Math.floor(i/4)*30}))},
      carrinho:bed(layout.leito_carrinho,500,300,.42,true),
      vermelha:bed(layout.leito_carroca,406,318,.68),azul:bed(layout.leito_carroca,611,318,.68),verde:bed(layout.leito_carroca,816,318,.68)
    };
  }
  const inside=(r,x,y,margin=20)=>x>=r.x-margin&&x<=r.x+r.w+margin&&y>=r.y-margin&&y<=r.y+r.h+margin;
  function nearest(zone,occupied,x,y) {
    if(!inside(zone,x,y))return -1;let best=-1,distance=60*60;
    for(let i=0;i<zone.cells.length;i++)if(occupied[i]<0){const p=zone.cells[i],d=(p.x-x)**2+(p.y-y)**2;if(d<=distance){best=i;distance=d;}}
    return best;
  }
  return {build,inside,nearest};
})();
