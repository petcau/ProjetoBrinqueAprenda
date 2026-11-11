/* Geometria e pesos puros, sem DOM nem estado de animação. */
window.Balanca = (() => {
  'use strict';
  function create(layout) {
    const scale=layout.escala_jogo,p=layout.prato,m=layout.montagem_validada,f=layout.travessa_frames;
    const px=m.base_da_coluna[0]-236*scale/2+layout.coluna.topo_cap[0]*scale;
    const py=m.base_da_coluna[1]-509*scale+layout.coluna.topo_cap[1]*scale-m.pivo_acima_do_topo_px;
    const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
    // Positivo = horário: peso maior à direita faz esse lado descer.
    const angle=(left,right)=>clamp((right-left)*5,-15,15);
    // Os ganchos giram em torno do pivô; pratos horizontais pendem 105 px abaixo.
    const hookX=(a,side)=>px+(side?1:-1)*Math.cos(a*Math.PI/180)*f.meia_dist_ganchos;
    const hookY=(a,side)=>py+(side?1:-1)*Math.sin(a*Math.PI/180)*f.meia_dist_ganchos;
    const panX=(a,side)=>hookX(a,side)-p.centro_itens[0]*scale;
    const panY=(a,side)=>hookY(a,side)+m.queda_da_corrente_px-p.anel_esq[1]*scale;
    const cellX=(a,side,slot)=>panX(a,side)+p.centro_itens[0]*scale+m.grade_prato.colunas_x[slot%4];
    const cellY=(a,side,slot)=>panY(a,side)+p.centro_itens[1]*scale+m.grade_prato.linhas_y[Math.floor(slot/4)];
    const inside=(x,y,rx,ry,w,h)=>x>=rx&&x<=rx+w&&y>=ry&&y<=ry+h;
    function target(a,x,y) {
      let found=-1,best=Infinity;
      for(let side=0;side<2;side++)if(inside(x,y,panX(a,side)-20,panY(a,side)-60,203.5+40,86+80)) {
        const d=(x-hookX(a,side))**2+(y-panY(a,side)-41.25)**2;if(d<best){best=d;found=side;}
      }
      return found;
    }
    const weight=(type,box)=>type==='caixa_misteriosa'?(box||0):layout.pesos[type]||0;
    function total(items,side,box){let n=0;for(let i=0;i<items.length;i++)if(items[i].side===side)n+=weight(items[i].type,box);return n;}
    function free(items,side){for(let slot=0;slot<8;slot++){let used=false;for(let i=0;i<items.length;i++)if(items[i].side===side&&items[i].slot===slot){used=true;break;}if(!used)return slot;}return -1;}
    return {px,py,angle,hookX,hookY,panX,panY,cellX,cellY,inside,target,weight,total,free,frame:a=>clamp(Math.round(a)+15,0,30)};
  }
  return {create};
})();
