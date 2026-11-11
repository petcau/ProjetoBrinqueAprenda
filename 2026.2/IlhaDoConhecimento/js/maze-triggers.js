/* =========================================================================
   SISTEMA DE GATILHOS E COLISÃO DO LABIRINTO DA MEMÓRIA (MazeTriggerSystem)
   Projeto: Ilha do Conhecimento
   Responsabilidade:
   - Máscaras de colisão das três fases; geometria original da câmara final.
   - Posição e renderização dos pedestais de pedra cinzenta e lajetas.
   - Distribuição dinâmica da runa correta e distratores em cada fase.
   - Detecção de passagem/entrada nos corredores para acionar avanços ou reset.
   ========================================================================= */

window.MazeTriggerSystem = (() => {
  'use strict';

  // Lista oficial das 6 runas místicas
  const RUNES = Object.freeze(['flor', 'folha', 'estrela', 'lua', 'borboleta', 'pata']);

  // Metadados das runas: coordenadas no sprite sheet (1024×1024, 3 colunas × 2 linhas) e cores
  const RUNE_INFO = Object.freeze({
    estrela: {
      id: 'estrela',
      label: 'Estrela',
      color: '#facc15',
      glow: 'rgba(250, 204, 21, 0.85)',
      col: 0,
      row: 0
    },
    lua: {
      id: 'lua',
      label: 'Lua',
      color: '#38bdf8',
      glow: 'rgba(56, 189, 248, 0.85)',
      col: 1,
      row: 0
    },
    flor: {
      id: 'flor',
      label: 'Flor',
      color: '#f43f5e',
      glow: 'rgba(244, 63, 94, 0.85)',
      col: 2,
      row: 0
    },
    folha: {
      id: 'folha',
      label: 'Folha',
      color: '#22c55e',
      glow: 'rgba(34, 197, 94, 0.85)',
      col: 0,
      row: 1
    },
    borboleta: {
      id: 'borboleta',
      label: 'Borboleta',
      color: '#a855f7',
      glow: 'rgba(168, 85, 247, 0.85)',
      col: 1,
      row: 1
    },
    pata: {
      id: 'pata',
      label: 'Pata',
      color: '#fb923c',
      glow: 'rgba(251, 146, 60, 0.85)',
      col: 2,
      row: 1
    }
  });

  // Dimensão do espaço de design (16:9, exatamente como os backgrounds gerados)
  const DESIGN_W = 1376;
  const DESIGN_H = 768;

  // Embaralha um array sem mutar o original (Fisher-Yates)
  function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /* -------------------------------------------------------------------------
     CONFIGURAÇÃO DAS FASES (Geometria, Paredes, Pedestais e Gatilhos)
     ------------------------------------------------------------------------- */
  const K = DESIGN_W / 1024, masks = [], maskOverlays = [];
  // Arte -> design: x*K, y*K; consulta inversa usa floor(x/K), floor(y/K).
  function path(id,label,x,y,w,h,px,py) {
    return {id,label,pedestal:{x:px*K,y:py*K},trigger:{xMin:x*K,xMax:(x+w)*K,yMin:y*K,yMax:(y+h)*K}};
  }
  const PHASE_CONFIGS = {
    1: {name: 'Fase 1: Bifurcação', spawn: {x: 688, y: 670, dir: 'up'}, paths: [
      path('left', 'Caminho da Esquerda', 298,220,52,42,322,252),
      path('right', 'Caminho da Direita', 690,220,47,42,714,250)]},
    2: {name: 'Fase 2: Trifurcação', spawn: {x: 688, y: 670, dir: 'up'}, paths: [
      path('left', 'Caminho da Esquerda', 298,220,52,42,322,252),
      path('center', 'Caminho da Frente', 490,106,60,34,520,100),
      path('right', 'Caminho da Direita', 690,220,47,42,714,250)]},
    3: {name: 'Fase 3: Quadrifurcação', spawn: {x: 688, y: 670, dir: 'up'}, paths: [
      path('left', 'Caminho da Esquerda', 300,222,58,40,318,252),
      path('center-left', 'Caminho Frente-Esquerda', 370,106,66,34,402,100),
      path('center-right', 'Caminho Frente-Direita', 604,106,58,34,632,100),
      path('right', 'Caminho da Direita', 668,222,67,36,722,250)]},

    // CÂMARA FINAL: CLAREIRA CIRCULAR COM CHAVE E PORTAL MÍSTICO
    4: {
      name: 'Câmara da Memória',
      spawn: { x: 688, y: 660, dir: 'up' },
      keyPedestal: { x: 688, y: 425 },
      portal: { x: 688, y: 145, radius: 46 },
      walls: [
        // Limites externos que contornam a clareira circular e o corredor norte
        { x: 0, y: 520, w: 580, h: 248 },
        { x: 796, y: 520, w: 580, h: 248 },
        { x: 0, y: 0, w: 580, h: 360 },
        { x: 796, y: 0, w: 580, h: 360 },
        // Paredes do corredor norte do portal
        { x: 0, y: 0, w: 610, h: 200 },
        { x: 766, y: 0, w: 610, h: 200 }
      ]
    }
  };

  /* -------------------------------------------------------------------------
     CONFIGURAÇÃO DINÂMICA DA RODADA
     Sortear caminhos corretos e distratores para a fase atual
     ------------------------------------------------------------------------- */
  function setupPhase(phaseNumber, correctRuneId) {
    const config = PHASE_CONFIGS[phaseNumber];
    if (!config || !config.paths) return null;

    const pathCount = config.paths.length;
    // Sorteia dinamicamente qual caminho conterá a runa correta
    const correctPathIndex = Math.floor(Math.random() * pathCount);

    // Seleciona runas distratoras distintas que não sejam a runa correta
    const otherRunes = shuffle(RUNES.filter(r => r !== correctRuneId));

    // Monta a lista de caminhos ativos com suas runas vinculadas
    const activePaths = config.paths.map((p, index) => {
      const isCorrect = index === correctPathIndex;
      const runeId = isCorrect ? correctRuneId : otherRunes.pop();
      const runeInfo = RUNE_INFO[runeId];
      return {
        ...p,
        pathIndex: index,
        isCorrect,
        runeId,
        rune: runeInfo
      };
    });

    return {
      phaseNumber,
      name: config.name,
      spawn: { ...config.spawn },
      activePaths,
      correctPathIndex,
      correctRuneId,
      drawPaths: [...activePaths].sort((a,b) => a.pedestal.y - b.pedestal.y)
    };
  }

  function walkable(phase,x,y) {
    const u=Math.floor(x/K),v=Math.floor(y/K);
    return x>=0&&y>=0&&x<DESIGN_W&&y<DESIGN_H&&u<1024&&v<572&&Boolean(masks[phase]?.[v*1024+u]);
  }
  function fits(phase,x,y,r=18) {
    return walkable(phase,x-r,y-r)&&walkable(phase,x+r,y-r)&&walkable(phase,x-r,y+r)&&walkable(phase,x+r,y+r);
  }
  // Mesma caixa de pés 36x36 do F3: testa os quatro cantos, X antes de Y.
  // Subpassos de até 1 px evitam atravessar uma borda entre dois frames.
  function moveOnMask(phase,x,y,nx,ny,r=18) {
    let a=x,b=y,n=Math.ceil(Math.abs(nx-x));
    for(let i=1;i<=n;i++){const t=x+(nx-x)*i/n;if(!fits(phase,t,b,r))break;a=t;}
    n=Math.ceil(Math.abs(ny-y));
    for(let i=1;i<=n;i++){const t=y+(ny-y)*i/n;if(!fits(phase,a,t,r))break;b=t;}
    return {x:a,y:b};
  }
  function selfTest(phase,r) {
    const c=PHASE_CONFIGS[phase],seen=new Uint8Array(DESIGN_W*DESIGN_H),q=new Int32Array(seen.length),hits=new Set();let head=0,tail=0;
    function add(x,y){const i=y*DESIGN_W+x;if(!seen[i]&&fits(phase,x,y,r)){seen[i]=1;q[tail++]=i;}}
    // BFS de 4 px com os 16 alinhamentos da célula inicial, ligados ao spawn.
    for(let dy=0;dy<4;dy++)for(let dx=0;dx<4;dx++){const x=c.spawn.x+dx,y=c.spawn.y+dy,p=moveOnMask(phase,c.spawn.x,c.spawn.y,x,y,r);if(p.x===x&&p.y===y)add(x,y);}
    while(head<tail){const i=q[head++],x=i%DESIGN_W,y=Math.floor(i/DESIGN_W);
      for(const path of c.paths){const t=path.trigger;if(x+r>=t.xMin&&x-r<=t.xMax&&y+r>=t.yMin&&y-r<=t.yMax)hits.add(path.id);}
      for(const [dx,dy] of [[4,0],[-4,0],[0,4],[0,-4]]){const nx=x+dx,ny=y+dy;if(seen[ny*DESIGN_W+nx])continue;const p=moveOnMask(phase,x,y,nx,ny,r);if(p.x===nx&&p.y===ny)add(nx,ny);}
    }
    const failures=[];
    if(!fits(phase,c.spawn.x,c.spawn.y,r))failures.push('spawn');
    for(const path of c.paths){const t=path.trigger;let free=0,total=0;
      for(let y=Math.ceil(t.yMin);y<t.yMax;y++)for(let x=Math.ceil(t.xMin);x<t.xMax;x++){total++;if(walkable(phase,x,y))free++;}
      if(free/total<.6)failures.push(path.label+' (cobertura)');if(!hits.has(path.id))failures.push(path.label+' (BFS)');
    }
    console[failures.length?'warn':'info'](`[Labirinto] Fase ${phase}: ${failures.length?failures.join(', '):'OK'}`);
  }
  let maskPromise;
  function prepareMasks(r=18) {
    return maskPromise ||= Promise.all([1,2,3].map(phase=>new Promise((resolve,reject)=>{
      const img=new Image();img.onerror=()=>reject(Error(`Máscara da fase ${phase} não carregou.`));
      img.onload=()=>{try{
        if(img.naturalWidth!==1024||img.naturalHeight!==572)throw Error('Máscara precisa ter 1024x572.');
        const c=document.createElement('canvas');c.width=1024;c.height=572;const pen=c.getContext('2d');pen.drawImage(img,0,0);
        const pixels=pen.getImageData(0,0,1024,572),mask=masks[phase]=new Uint8Array(1024*572);
        for(let i=0;i<mask.length;i++){mask[i]=pixels.data[i*4+3]>40?1:0;pixels.data[i*4]=0;pixels.data[i*4+1]=255;pixels.data[i*4+2]=0;pixels.data[i*4+3]=mask[i]?80:0;}
        const overlay=maskOverlays[phase]=document.createElement('canvas');overlay.width=1024;overlay.height=572;overlay.getContext('2d').putImageData(pixels,0,0);
        c.width=c.height=0;selfTest(phase,r);resolve();
      }catch(error){reject(error);}};img.src=`assets/puzzles/labirinto/fase${phase}_mascara.png`;
    })));
  }

  /* -------------------------------------------------------------------------
     COLISÃO ORIGINAL DA CÂMARA (Sliding Box-Circle Collision)
     Preservada para a fase 4; as fases 1–3 usam moveOnMask.
     ------------------------------------------------------------------------- */
  function resolveWallCollision(phaseNumber, px, py, radius = 16) {
    const config = PHASE_CONFIGS[phaseNumber];
    if (!config) return { x: px, y: py };

    let x = px;
    let y = py;

    // Limites da tela
    x = Math.max(radius, Math.min(DESIGN_W - radius, x));
    y = Math.max(radius, Math.min(DESIGN_H - 10, y));

    const walls = config.walls || [];
    for (let iter = 0; iter < 2; iter++) {
      for (const w of walls) {
        // Ponto mais próximo do retângulo da cerca
        const closestX = Math.max(w.x, Math.min(x, w.x + w.w));
        const closestY = Math.max(w.y, Math.min(y, w.y + w.h));

        const dx = x - closestX;
        const dy = y - closestY;
        const distSq = dx * dx + dy * dy;

        if (distSq < radius * radius && distSq > 0) {
          const dist = Math.sqrt(distSq);
          const overlap = radius - dist;
          x += (dx / dist) * overlap;
          y += (dy / dist) * overlap;
        } else if (distSq === 0) {
          // Personagem dentro da caixa (caso raro): empurra para fora
          y += radius;
        }
      }
    }

    // Se estiver na câmara da chave, o pedestal central bloqueia colisão física
    if (phaseNumber === 4 && config.keyPedestal) {
      const kp = config.keyPedestal;
      const dx = x - kp.x;
      const dy = y - (kp.y + 10);
      const distSq = dx * dx + dy * dy;
      const pRad = 28;
      if (distSq < pRad * pRad) {
        const dist = Math.sqrt(distSq) || 0.001;
        x = kp.x + (dx / dist) * pRad;
        y = kp.y + 10 + (dy / dist) * pRad;
      }
    }

    return { x, y };
  }

  /* -------------------------------------------------------------------------
     VERIFICAÇÃO DE GATILHOS DE CORREDOR
     Checa se a jogadora entrou em alguma zona de gatilho
     ------------------------------------------------------------------------- */
  function checkTriggers(activePaths, px, py, radius = 18) {
    if (!activePaths) return null;
    for (const p of activePaths) {
      const t = p.trigger;
      if (px + radius >= t.xMin && px - radius <= t.xMax && py + radius >= t.yMin && py - radius <= t.yMax) {
        return {
          pathIndex: p.pathIndex,
          isCorrect: p.isCorrect,
          runeId: p.runeId,
          rune: p.rune,
          label: p.label
        };
      }
    }
    return null;
  }

  /* -------------------------------------------------------------------------
     VERIFICAÇÃO DE INTERAÇÃO COM A CHAVE E PORTAL (Fase 4)
     ------------------------------------------------------------------------- */
  function checkKeyProximity(px, py) {
    const config = PHASE_CONFIGS[4];
    if (!config || !config.keyPedestal) return false;
    const dx = px - config.keyPedestal.x;
    const dy = py - config.keyPedestal.y;
    return Math.hypot(dx, dy) <= 65;
  }

  function checkPortalCollision(px, py) {
    const config = PHASE_CONFIGS[4];
    if (!config || !config.portal) return false;
    const p = config.portal;
    return Math.hypot(px - p.x, py - p.y) <= 50;
  }

  return Object.freeze({
    RUNES,
    RUNE_INFO,
    DESIGN_W,
    DESIGN_H,
    PHASE_CONFIGS, K, maskOverlays, prepareMasks, walkable, fits, moveOnMask,
    shuffle,
    setupPhase,
    resolveWallCollision,
    checkTriggers,
    checkKeyProximity,
    checkPortalCollision
  });
})();
