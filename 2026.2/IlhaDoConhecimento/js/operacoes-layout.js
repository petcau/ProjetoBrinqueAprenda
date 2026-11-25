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
  // Função pura que avalia a fase apenas pelo estado lógico dos sacos.
  // alvo, tipo e dados da fase derivam do JSON via estado.alvo / estado.tipo.
  function avaliarFase(estado) {
    const f = Number(estado?.fase) || 1;
    const sacos = estado?.sacos || [];
    const tipo = estado?.tipo || '';
    const alvo = estado?.alvo;
    const counts = { plataforma: 0, carrinho: 0, vermelha: 0, azul: 0, verde: 0, mesa: 0, outros: 0 };
    for (let i = 0; i < sacos.length; i++) {
      const z = sacos[i]?.zone;
      if (z && Object.prototype.hasOwnProperty.call(counts, z)) counts[z]++;
      else counts.outros++;
    }
    let ok = false, regra = '', atual = 0;
    if (tipo === 'dobro') {
      atual = counts.plataforma;
      regra = `plataforma == ${alvo}`;
      ok = Number.isInteger(alvo) && atual === alvo;
    } else if (tipo === 'metadeMais') {
      atual = counts.carrinho;
      regra = `carrinho == ${alvo}`;
      ok = Number.isInteger(alvo) && atual === alvo;
    } else if (tipo === 'divisao') {
      // alvo = sacos/carrocas (por carroça)
      const totalCarrocas = counts.vermelha + counts.azul + counts.verde;
      atual = totalCarrocas;
      regra = `mesa == 0 e cada carroça == ${alvo}`;
      ok = Number.isInteger(alvo) && counts.mesa === 0 && counts.vermelha === alvo && counts.azul === alvo && counts.verde === alvo;
    }
    return { ok, detalhe: { fase: f, tipo, counts, alvo, atual, regra } };
  }
  function autoTeste(fases) {
    // fases = data.fases do JSON; sem eles não dá para calcular alvos corretos.
    if (!fases || fases.length < 3) { console.warn('[Operações] Autoteste: dados das fases ausentes; pulando.'); return true; }
    const alvo1 = 2 * fases[0].moinho;                          // dobro → 4
    const alvo2 = Math.floor(fases[1].carrinhoTem / 2) + fases[1].mais; // metadeMais → 8
    const alvo3 = fases[2].sacos / fases[2].carrocas;           // divisao → 4
    const testes = [
      { f: 1, tipo: 'dobro',      alvo: alvo1,
        c: Array.from({length: alvo1},     () => ({zone:'plataforma'})).concat([{zone:'mesa'},{zone:'carrinho'}]),
        e: Array.from({length: alvo1 - 1}, () => ({zone:'plataforma'})).concat([{zone:'mesa'},{zone:'mesa'},{zone:'carrinho'}]) },
      { f: 2, tipo: 'metadeMais', alvo: alvo2,
        c: Array.from({length: fases[1].carrinhoTem}, (_,i) => ({zone: i < alvo2 ? 'carrinho' : 'mesa'})),
        e: Array.from({length: fases[1].carrinhoTem}, (_,i) => ({zone: i < alvo2 - 1 ? 'carrinho' : 'mesa'})) },
      { f: 3, tipo: 'divisao',    alvo: alvo3,
        c: Array.from({length: fases[2].sacos}, (_,i) => ({zone: i < alvo3 ? 'vermelha' : i < 2*alvo3 ? 'azul' : 'verde'})),
        e: Array.from({length: fases[2].sacos}, (_,i) => ({zone: i < alvo3+1 ? 'vermelha' : i < 2*alvo3 ? 'azul' : 'verde'})) }
    ];
    let passou = true;
    for (const t of testes) {
      const resC = avaliarFase({ fase: t.f, tipo: t.tipo, alvo: t.alvo, sacos: t.c });
      const resE = avaliarFase({ fase: t.f, tipo: t.tipo, alvo: t.alvo, sacos: t.e });
      if (!resC.ok || resE.ok) {
        passou = false;
        console.error(`[Operações] Autoteste avaliarFase: ERRO na fase ${t.f} (tipo=${t.tipo}, alvo=${t.alvo}; correto=${resC.ok}, errado=${resE.ok})`);
      } else {
        console.info(`[Operações] Autoteste fase ${t.f} (${t.tipo}, alvo ${t.alvo}): OK`);
      }
    }
    if (passou) console.info('[Operações] Autoteste avaliarFase: OK — todas as 3 fases validadas.');
    return passou;
  }
  return {build,inside,nearest,avaliarFase,autoTeste};
})();
