'use strict';
/**
 * MUNDO 1: A CAVERNA — Cutscene de Abertura, Fases 1–4, Show Musical "Era Uma Vez (A Ordem)",
 * Conclusão Especial do Mundo e Transição Iris Out/In para o Mapa (True Pixel Art 320x180).
 * Reutiliza 100% do Banco Central de Animações (`TruePixelEngine.SpriteBank` / `ActorAnimator`),
 * a Caixa de Diálogo Global (`DialogueBox`), o Tutorial Paginado (`TutorialModal`) e `IrisTransition`.
 */
(function (global) {
  const E = global.TruePixelEngine;
  if (!E) return;

  const {
    W, H, SPRITE_FPS, SIM_HZ, bay, mulberry, c32, fromMap, silhouette,
    P1, drawRing, drawStar, drawPixelText, drawPixelTextCentered, measurePixelText, drawParchmentBox,
    ActorAnimator, IrisTransition, DialogueBox, TutorialModal, GameHUD, StandardTutorialCards
  } = E;
  const R = Math.round;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeInOut = p => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);

  const HW = 640, HH = 360;
  const RH = (v) => Math.round(v * 2) * 0.5;
  // Pixel físico Hi-Bit (0.5 px lógico) alinhado à grade 640x360
  const P = (ctx, x, y, col) => {
    ctx.fillStyle = col;
    ctx.fillRect(RH(x), RH(y), 0.5, 0.5);
  };

  // ============================================================================
  // SPRITES HI-BIT DE CRISTAIS E FRAGMENTOS (34x42 PIXELS FÍSICOS — ESTILO OWLBOY)
  // Gemas grandes esculpidas com facetas pictóricas suaves, refração interna e
  // brilho especular sem contorno preto grosso.
  // ============================================================================
  function buildHiBitGem(shape, pal) {
    const GW = 34, GH = 42;
    const c = document.createElement('canvas');
    c.width = GW;
    c.height = GH;
    c.hib = true;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;

    const put = (px, py, col) => {
      if (px >= 0 && py >= 0 && px < GW && py < GH) {
        x.fillStyle = col;
        x.fillRect(px, py, 1, 1);
      }
    };

    const cx = 16.5, cy = 20.5;
    for (let py = 2; py < GH - 2; py++) {
      const dy = (py - cy) / 18.5;
      const ny = Math.abs(dy);
      // Formato octogonal lapidado para Quartzo ou gota flamejante multifacetada para Opala
      const maxHalfW = shape === 'opal'
        ? (dy < 0 ? (1 - Math.pow(ny, 0.82)) * 14.5 : (1 - Math.pow(ny, 1.35)) * 14.5)
        : (ny < 0.36 ? 13.5 - ny * 4.5 : (1 - (ny - 0.36) / 0.64) * 11.8);

      const hw = Math.round(maxHalfW);
      if (hw <= 0) continue;

      for (let px = Math.round(cx - hw); px <= Math.round(cx + hw); px++) {
        const dx = (px - cx) / Math.max(1, hw);
        const adx = Math.abs(dx);
        let col = pal.M;

        // Borda pictórica suave colorida (sem contorno preto grosso)
        if (adx > 0.88 || ny > 0.91) {
          col = (dx < 0 && dy < 0) ? pal.L : pal.K;
        } else if (shape === 'opal') {
          // Núcleo incandescente vivo da Opala de Fogo
          const coreD = Math.hypot(dx * 1.15, (dy - 0.06) * 1.25);
          if (coreD < 0.32) col = pal.W;
          else if (coreD < 0.56) col = ((px + py) & 1) ? pal.H : pal.W;
          else if (coreD < 0.78) col = (dx < 0 || ((px + py) & 1)) ? pal.L : pal.M;
          else col = dx < 0 ? pal.M : pal.D;
        } else {
          // Facetas cristalinas com planos de luz, dithering suave e refração interna
          const inTable = adx < 0.46 && ny < 0.48;
          if (inTable) {
            if (dx + dy < -0.32) col = pal.W;
            else if (dx + dy < 0.08) col = ((px + py) & 1) ? pal.H : pal.L;
            else if (dx + dy < 0.42) col = pal.L;
            else col = pal.M;
          } else {
            // Cristas diagonais de lapidação
            const ridge = Math.abs(adx - 0.46) < 0.09 || Math.abs(ny - 0.48) < 0.06;
            if (ridge && dx < 0.25 && dy < 0.25) {
              col = pal.H;
            } else if (dx < -0.35 && dy < 0.25) {
              col = ((px + py) & 1) ? pal.W : pal.H;
            } else if (dx < 0 && dy < 0) {
              col = pal.L;
            } else if (dx > 0.32 && dy > 0.15) {
              col = ((px + py) & 1) ? pal.K : pal.D;
            } else if (dx > 0 || dy > 0.35) {
              col = pal.D;
            } else {
              col = pal.M;
            }
          }
        }
        put(px, py, col);
      }
    }

    // Brilho especular estrelado na faceta superior esquerda
    put(11, 9, '#ffffff');
    put(12, 9, '#ffffff');
    put(11, 10, '#ffffff');
    put(10, 9, pal.W);
    put(11, 8, pal.W);
    return c;
  }

  // Paleta Owlboy pictórica quente e suave (warm muted tones, sem neon agressivo nem bordas pretas)
  const GEM_SPRITES = {
    white_pure: buildHiBitGem('quartz', {
      W: '#ffffff', H: '#e3f4f7', L: '#a8d8e6', M: '#6caac4', D: '#437794', K: '#294c66'
    }),
    white_shadow: buildHiBitGem('quartz', {
      W: '#b8a6d9', H: '#8572ab', L: '#5e4d82', M: '#413361', D: '#2a1f42', K: '#1a122b'
    }),
    rose_pure: buildHiBitGem('quartz', {
      W: '#fff2f5', H: '#f7cad8', L: '#e396b1', M: '#bf6588', D: '#8c3f60', K: '#59223b'
    }),
    rose_shadow: buildHiBitGem('quartz', {
      W: '#cfa3c4', H: '#96688c', L: '#6e4666', M: '#4d2d47', D: '#331a2e', K: '#1f0e1c'
    }),
    opal_pure: buildHiBitGem('opal', {
      W: '#fff6cc', H: '#f7c97e', L: '#e68a49', M: '#c45131', D: '#8c2d1f', K: '#541812'
    }),
    opal_shadow: buildHiBitGem('opal', {
      W: '#c99b8f', H: '#8f5d52', L: '#693c34', M: '#4a2620', D: '#301512', K: '#1c0b09'
    }),
    flash: buildHiBitGem('quartz', {
      W: '#ffffff', H: '#ffffff', L: '#ffffff', M: '#ffffff', D: '#e8f6ff', K: '#b8ecff'
    })
  };

  const SHARD_ROWS = [
    ['..W..', '.LWM.', 'LLMMD', '.MDD.', '..D..'],
    ['.LW..', 'LLMMD', '.MDDD', '..D..'],
    ['.LW.', 'WMMD', 'MDDD', '.DD.'],
    ['..WW.', '.LMMM', 'DDDD.']
  ];
  const SHARD_SPR = {
    pure: SHARD_ROWS.map(r => fromMap(r, { W: '#ffffff', L: '#dff4ff', M: '#6caac4', D: '#437794' })),
    rose: SHARD_ROWS.map(r => fromMap(r, { W: '#ffffff', L: '#f7cad8', M: '#bf6588', D: '#8c3f60' })),
    opal: SHARD_ROWS.map(r => fromMap(r, { W: '#fff6cc', L: '#e68a49', M: '#c45131', D: '#8c2d1f' })),
    shadow: SHARD_ROWS.map(r => fromMap(r, { W: '#b8a6d9', L: '#5e4d82', M: '#413361', D: '#2a1f42' })),
    rock: SHARD_ROWS.map(r => fromMap(r, { W: '#6e635f', L: '#524846', M: '#3b3332', D: '#262020' }))
  };

  // ============================================================================
  // UNIDADES EM BOLINHAS LUMINOSAS FORA DOS CRISTAIS (Estilo Pictórico Owlboy)
  // Facetas do cristal 100% limpas; as unidades (1 a 6) flutuam em um arco
  // harmonioso logo acima/ao redor do cristal com sombreamento esférico e brilho.
  // ============================================================================
  const EXTERNAL_ORB_ARCS = {
    1: [[0, -14.5]],
    2: [[-4.5, -14], [4.5, -14]],
    3: [[-7.5, -12.5], [0, -15], [7.5, -12.5]],
    4: [[-9.5, -11], [-3.5, -14.5], [3.5, -14.5], [9.5, -11]],
    5: [[-11, -9.5], [-6, -13.5], [0, -15.5], [6, -13.5], [11, -9.5]],
    6: [[-12, -8.5], [-7.5, -12.5], [-2.5, -15], [2.5, -15], [7.5, -12.5], [12, -8.5]]
  };

  function drawExternalOrb(ctx, ox, oy, coreCol, midCol, rimCol, pulse = false) {
    ox = RH(ox);
    oy = RH(oy);
    const r = pulse ? 3.0 : 2.5;
    // Halo externo suave quando soma/subtrai
    if (pulse) {
      ctx.fillStyle = '#fff6cc';
      ctx.fillRect(ox - 3.5, oy - 1.5, 7, 3);
      ctx.fillRect(ox - 1.5, oy - 3.5, 3, 7);
    }
    // Borda esférica sombreada (7x7 pixels físicos = 3.5x3.5 lógicos)
    ctx.fillStyle = rimCol;
    ctx.fillRect(ox - r, oy - r + 0.5, r * 2, r * 2 - 1);
    ctx.fillRect(ox - r + 0.5, oy - r, r * 2 - 1, r * 2);

    // Corpo luminoso da bolinha
    ctx.fillStyle = midCol;
    ctx.fillRect(ox - r + 0.5, oy - r + 0.5, r * 2 - 1, r * 2 - 1);

    // Núcleo brilhante e ponto especular superior esquerdo
    ctx.fillStyle = coreCol;
    ctx.fillRect(ox - 1, oy - 1, 2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ox - 1, oy - 1.5, 1, 1);
  }

  function drawCrystalPiece(ctx, piece, t) {
    if (!piece || piece.broken || piece.value <= 0) return;

    // 100% ESTÁTICO por padrão: só treme quando a Opala de Fogo está próxima ou em rejeição de cor!
    const isTrembling = Boolean(piece.trembling) || Boolean(piece.rejectUntil && t < piece.rejectUntil);
    const [tx, ty] = ActorAnimator.getCrystalTrembleOffset(t, isTrembling, ctx, piece.x, piece.y);
    const x = RH(piece.x + tx), y = RH(piece.y + ty);

    if (piece.dragging) {
      drawRing(ctx, R(x), R(y), 14, '#e6cf9c');
    }

    let spr = GEM_SPRITES.white_pure;
    if (piece.shadow) {
      if (piece.type === 'rose') spr = GEM_SPRITES.rose_shadow;
      else if (piece.type === 'opal') spr = GEM_SPRITES.opal_shadow;
      else spr = GEM_SPRITES.white_shadow;
    } else if (piece.type === 'rose') {
      spr = GEM_SPRITES.rose_pure;
    } else if (piece.type === 'opal') {
      spr = GEM_SPRITES.opal_pure;
    }
    // Desenha o cristal com as facetas 100% limpas (sem marcadores internos!)
    const gw = spr.width * 0.5, gh = spr.height * 0.5;
    ctx.drawImage(spr, RH(x - gw / 2), RH(y - gh / 2), gw, gh);

    // Desenha as unidades como bolinhas luminosas FORA do cristal em um arco acima dele
    const val = clamp(piece.value || 1, 1, 6);
    const orbCoords = EXTERNAL_ORB_ARCS[val] || EXTERNAL_ORB_ARCS[1];
    const recentlyChanged = Boolean(piece.lastValChangeAt && (t - piece.lastValChangeAt) < 0.28);

    const coreCol = piece.shadow ? '#f3e0ff' : '#fffdf2';
    const midCol = piece.shadow
      ? (piece.type === 'rose' ? '#cfa3c4' : '#9b84c4')
      : piece.type === 'opal'
        ? '#f7b259'
        : piece.type === 'rose'
          ? '#f29bb8'
          : '#7fd4e6';
    const rimCol = piece.shadow ? '#1f142e' : (piece.type === 'opal' ? '#4a1912' : (piece.type === 'rose' ? '#4f1e35' : '#1e3a4d'));
    const linkCol = piece.shadow ? '#6e5794' : (piece.type === 'opal' ? '#e68a49' : (piece.type === 'rose' ? '#d97a9c' : '#569bb0'));

    // Filamento energético suave conectando o arco de bolinhas externas ao topo do cristal
    ctx.fillStyle = linkCol;
    for (let i = 0; i < orbCoords.length; i++) {
      const [ox, oy] = orbCoords[i];
      ctx.fillRect(RH(x + ox * 0.65), RH(y + oy * 0.72), 1, 1);
      if (i < orbCoords.length - 1) {
        const [nx, ny] = orbCoords[i + 1];
        ctx.fillRect(RH(x + (ox + nx) * 0.5), RH(y + (oy + ny) * 0.5), 1, 1);
      }
    }

    for (let i = 0; i < orbCoords.length; i++) {
      const [ox, oy] = orbCoords[i];
      drawExternalOrb(ctx, x + ox, y + oy, coreCol, midCol, rimCol, recentlyChanged);
    }
  }

  // ============================================================================
  // AURA EXPANSÍVEL DA EQUAÇÃO CRISTALINA EM LOOP (Estilo Pictórico Owlboy)
  // Inclui conexões luminosas entre os cristais internos e destaque de encaixe!
  // ============================================================================
  function drawEquationAura(ctx, eq, t, members = []) {
    if (!eq || eq.broken) return;
    const f12 = Math.floor(t * SPRITE_FPS);
    const isReceptive = Boolean(eq.expanded || eq.dropHover || eq.removeHover);
    const rx = isReceptive ? 46 : 29;
    const ry = isReceptive ? 26 : 18;
    const cx = R(eq.x), cy = R(eq.y);

    if (isReceptive) {
      const fillCol = eq.dropHover ? '#243c4a' : (eq.shadow ? '#241836' : '#1c2c3d');
      ctx.fillStyle = fillCol;
      for (let dy = -ry + 2; dy <= ry - 2; dy++) {
        for (let dx = -rx + 2; dx <= rx - 2; dx++) {
          if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 0.92 && bay(cx + dx, cy + dy) < (eq.dropHover ? 9 : 6)) {
            ctx.fillRect(cx + dx, cy + dy, 1, 1);
          }
        }
      }
    }

    const rimA = eq.dropHover
      ? '#f2cc6b'
      : eq.removeHover
        ? '#e68a49'
        : (eq.shadow ? '#b8a6d9' : (eq.expanded ? '#a8d8e6' : '#d9c398'));
    const rimB = eq.dropHover
      ? '#a8d8e6'
      : eq.removeHover
        ? '#c45131'
        : (eq.shadow ? '#5e4d82' : (eq.expanded ? '#5e96ab' : '#8c7248'));

    for (let a = 0; a < 76; a++) {
      const ang = (a / 76) * Math.PI * 2;
      const wave = Math.sin(ang * 4 + f12 * 0.6) * (isReceptive ? 1.2 : 0.7);
      const px = R(cx + Math.cos(ang) * (rx + wave));
      const py = R(cy + Math.sin(ang) * (ry + wave * 0.6));
      P1(ctx, px, py, ((a + f12) & 1) ? rimA : rimB);
    }

    // Conexões energéticas luminosas ligando os cristais que estão dentro da equação
    if (members && members.length > 0) {
      const sorted = members.slice().sort((a, b) => a.x - b.x);
      const beamHi = eq.shadow ? '#e2d4f7' : '#fff6cc';
      const beamLo = eq.shadow ? '#8572ab' : '#68b8c4';
      for (let i = 0; i < sorted.length - 1; i++) {
        const p1 = sorted[i], p2 = sorted[i + 1];
        const x1 = R(p1.x), y1 = R(p1.y);
        const x2 = R(p2.x), y2 = R(p2.y);
        const steps = Math.max(1, Math.hypot(x2 - x1, y2 - y1));
        for (let s = 0; s <= steps; s++) {
          const u = s / steps;
          const lx = R(x1 + (x2 - x1) * u);
          const ly = R(y1 + (y2 - y1) * u + Math.sin(u * Math.PI * 2 + f12 * 0.8) * 1.1);
          P1(ctx, lx, ly, ((s + f12) & 1) ? beamHi : beamLo);
          P1(ctx, lx, ly + 1, beamLo);
        }
      }
      for (const m of sorted) {
        drawRing(ctx, R(m.x), R(m.y), 11, eq.shadow ? '#8572ab' : '#68b8c4');
      }
    } else if (!isReceptive) {
      const lineY = cy + ((f12 & 1) ? 0 : 1);
      for (let x = cx - rx + 6; x <= cx + rx - 6; x += 2) {
        P1(ctx, x, lineY, eq.shadow ? '#8572ab' : '#a8d8e6');
      }
    }

    // Etiqueta de pergaminho perfeitamente centralizada ao arrastar um cristal para adicionar/retirar
    if (eq.dropHover || eq.removeHover) {
      const label = eq.dropHover ? 'Solte para adicionar' : 'Solte para retirar';
      const bw = 96, bh = 13;
      const bx = clamp(R(cx - bw / 2), 6, W - bw - 6);
      const by = Math.max(22, R(cy - ry - 16));
      drawParchmentBox(ctx, bx, by, bw, bh);
      drawPixelTextCentered(ctx, label, bx + bw / 2, by + 3, eq.dropHover ? '#3e7338' : '#8c2d1f', null, bw - 6, 9);
    }
  }

  // ============================================================================
  // CRISTAL ENORME DO TETO NA FASE 4 — HI-BIT 136x104 PIXELS FÍSICOS (68x52 LÓGICOS)
  // Formação cristalina monumental no teto com a silhueta de alta resolução da Rainha da Ordem.
  // ============================================================================
  function buildGiantCeilingCrystalSprite(crackStage = 0, flashMode = false) {
    const CW = 136, CH = 104;
    const c = document.createElement('canvas');
    c.width = CW;
    c.height = CH;
    c.hib = true;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    const put = (px, py, col) => {
      if (px >= 0 && py >= 0 && px < CW && py < CH) {
        x.fillStyle = col;
        x.fillRect(px, py, 1, 1);
      }
    };

    const cx = 68;
    // Cristais secundários laterais cravados no teto (estilo pictórico Owlboy)
    const drawSpire = (sx, sy, sw, sh, tilt) => {
      for (let py = 0; py < sh; py++) {
        const hw = Math.max(1, Math.round(sw * (1 - py / sh)));
        const ox = Math.round((py / sh) * tilt);
        for (let dx = -hw; dx <= hw; dx++) {
          const px = sx + ox + dx, y = sy + py;
          if (flashMode) { put(px, y, '#ffffff'); continue; }
          const ndx = dx / Math.max(1, hw);
          let col = '#3d5873';
          if (Math.abs(ndx) > 0.85) col = ndx < 0 ? '#a8d8e6' : '#243547';
          else if (ndx < -0.25) col = ((px + y) & 1) ? '#84bdd1' : '#5e96ab';
          else if (ndx > 0.35) col = '#2c4157';
          put(px, y, col);
        }
      }
    };
    drawSpire(cx - 46, 0, 14, 54, -12);
    drawSpire(cx + 46, 0, 14, 54, 12);
    drawSpire(cx - 32, 0, 13, 70, -6);
    drawSpire(cx + 32, 0, 13, 70, 6);

    // Corpo central monumental octogonal multifacetado (100px de altura física)
    const maxHW = 46;
    for (let py = 0; py < 100; py++) {
      let hw = maxHW;
      if (py < 16) hw = Math.round(32 + (py / 16) * 14);
      else if (py > 56) hw = Math.max(3, Math.round(maxHW * (1 - (py - 56) / 44)));

      for (let dx = -hw; dx <= hw; dx++) {
        const px = cx + dx;
        if (flashMode) { put(px, py, '#ffffff'); continue; }
        const ndx = dx / Math.max(1, hw);
        const adx = Math.abs(ndx);
        let col = '#3d5873';
        if (adx > 0.92 || py === 99) col = ndx < 0 ? '#d8f3fa' : '#223242';
        else if (Math.abs(adx - 0.48) < 0.05) col = '#b8e4f2';
        else if (ndx < -0.48) col = ((px + py) & 1) ? '#96cde0' : '#73afc4';
        else if (ndx < 0) col = ((px + py) & 1) ? '#5e96ab' : '#4a7a8f';
        else if (ndx < 0.48) col = '#37536b';
        else col = '#263b4d';
        put(px, py, col);
      }
    }

    if (!flashMode && E.SpriteBank && E.SpriteBank.ordem) {
      // Silhueta de alta resolução (64x64) da Fada / Rainha da Ordem aprisionada no núcleo
      const silSpr = E.SpriteBank.ordem.back_silhouette[0];
      x.globalAlpha = 0.85;
      x.drawImage(silSpr, cx - Math.round(silSpr.width / 2), 14);
      x.globalAlpha = 1.0;

      // Rachaduras luminosas progressivas em alta resolução
      const crackPaths = [
        [[-10, 14], [-7, 24], [-3, 34], [2, 44], [6, 54], [3, 66], [0, 76]],
        [[18, 18], [14, 28], [8, 38], [2, 46], [-8, 56], [-15, 68], [-10, 82]],
        [[-24, 26], [-18, 36], [-10, 46], [0, 54], [12, 64], [20, 76], [8, 90]]
      ];
      for (let s = 0; s < crackStage; s++) {
        const path = crackPaths[s];
        for (let i = 0; i < path.length - 1; i++) {
          const [x0, y0] = path[i], [x1, y1] = path[i + 1];
          const steps = Math.max(1, Math.hypot(x1 - x0, y1 - y0));
          for (let k = 0; k <= steps; k++) {
            const u = k / steps;
            const rx = Math.round(cx + x0 + (x1 - x0) * u);
            const ry = Math.round(y0 + (y1 - y0) * u);
            put(rx, ry, '#ffffff');
            put(rx + 1, ry, '#a8e6cf');
          }
        }
      }
    }
    return c;
  }

  const GIANT_CRYSTAL_CACHE = [
    buildGiantCeilingCrystalSprite(0, false),
    buildGiantCeilingCrystalSprite(1, false),
    buildGiantCeilingCrystalSprite(2, false),
    buildGiantCeilingCrystalSprite(3, false),
    buildGiantCeilingCrystalSprite(0, true)
  ];

  function drawGiantCeilingCrystal(ctx, crackRatio, flashMode, broken, t) {
    if (broken) return;
    const stage = clamp(Math.floor(crackRatio * 3), 0, 3);
    const spr = flashMode ? GIANT_CRYSTAL_CACHE[4] : GIANT_CRYSTAL_CACHE[stage];
    const w = spr.width * 0.5, h = spr.height * 0.5;
    ctx.drawImage(spr, RH(176 - w / 2), 20, w, h);
    if (!flashMode && (Math.floor(t * SPRITE_FPS) & 1) === 0) {
      P1(ctx, 176, 40, '#ffffff');
    }
  }

  // ============================================================================
  // CENÁRIO HI-BIT (640x360) EM CAMADAS ESTILO OWLBOY (buildCaveBackground)
  // Pilares rochosos monumentais em múltiplas camadas de paralaxe, neblina atmosférica
  // em dithering horizontal suave, plataformas de pedra esculpida (#262020..#6e635f)
  // e cobertura de musgo/grama detalhada folha a folha (#367030..#a5e06c).
  // ============================================================================
  function buildCaveBackground(mode) {
    // mode: 'dark' | 'cinematic_crystals' | 'lit'
    const buf = new Uint32Array(HW * HH);
    const rnd = mulberry(2026);
    const P = mode === 'lit'
      ? {
          sky0: '#4a6b82', sky1: '#688ea3', sky2: '#8cb3c2', mist: '#bfd9de',
          farPillar: '#3d586b', midPillar: '#2e4352', midPillarHi: '#4f6d80',
          rock0: '#262020', rock1: '#3b3332', rock2: '#524846', rock3: '#6e635f',
          moss0: '#367030', moss1: '#539e43', moss2: '#7ec456', moss3: '#a5e06c',
          cA: '#68b8c4', cAHi: '#e6fafc', cALo: '#396e7a'
        }
      : mode === 'cinematic_crystals'
        ? {
            sky0: '#0b0e17', sky1: '#111726', sky2: '#182236', mist: '#24344d',
            farPillar: '#0e1320', midPillar: '#090d17', midPillarHi: '#1c283d',
            rock0: '#0d0b0c', rock1: '#171415', rock2: '#241f20', rock3: '#332c2d',
            moss0: '#142914', moss1: '#1f3d1e', moss2: '#2d572a', moss3: '#3e7338',
            cA: '#5ec9db', cAHi: '#ffffff', cALo: '#296473'
          }
        : {
            sky0: '#1e2836', sky1: '#2a394a', sky2: '#394d61', mist: '#546e82',
            farPillar: '#1b2430', midPillar: '#141b24', midPillarHi: '#2c3b4d',
            rock0: '#1c1717', rock1: '#2b2423', rock2: '#3d3432', rock3: '#544845',
            moss0: '#224720', moss1: '#34692f', moss2: '#4b8c41', moss3: '#68ad58',
            cA: '#4b8a9c', cAHi: '#a8e6f0', cALo: '#274d59'
          };

    const put = (x, y, h) => {
      x = R(x); y = R(y);
      if (x < 0 || y < 0 || x >= HW || y >= HH) return;
      buf[y * HW + x] = c32(h);
    };

    // 1. Gradiente atmosférico de profundidade + bandas de neblina estilo Owlboy
    const skyBands = [P.sky0, P.sky1, P.sky2, P.mist];
    for (let y = 0; y < HH; y++) {
      const t = clamp(y / 290, 0, 0.999) * 3;
      const b0 = Math.floor(t);
      const frac = t - b0;
      for (let x = 0; x < HW; x++) {
        let b = b0;
        if (b < 3 && bay(x, y) / 16 < frac) b++;
        put(x, y, skyBands[b]);
      }
    }

    // 2. Camada distante de pilares rochosos monumentais (paralaxe 1)
    const farPillars = [
      [58, 34, 290, P.farPillar],
      [152, 44, 285, P.farPillar],
      [274, 52, 292, P.farPillar],
      [412, 48, 288, P.farPillar],
      [536, 40, 290, P.farPillar]
    ];
    for (const [cx, hw, maxH, col] of farPillars) {
      for (let y = 24; y < maxH; y++) {
        const wobble = Math.round(Math.sin(y * 0.07 + cx) * 4);
        const curHW = hw + Math.round(Math.sin(y * 0.04) * 3);
        for (let x = cx - curHW + wobble; x <= cx + curHW + wobble; x++) {
          // Dissolve na neblina inferior com dithering horizontal estilo Owlboy
          const mistFade = (y - 210) / 80;
          if (mistFade > 0 && bay(x, y) / 16 < mistFade) continue;
          put(x, y, col);
        }
      }
    }

    // 3. Camada média de pilares rochosos esculpidos com musgo suspenso (paralaxe 2)
    const midPillars = [
      [24, 30, 300],
      [108, 26, 295],
      [482, 32, 298],
      [608, 36, 304]
    ];
    for (const [cx, hw, maxH] of midPillars) {
      for (let y = 16; y < maxH; y++) {
        const jag = Math.round(Math.sin(y * 0.11 + cx * 0.2) * 3);
        for (let dx = -hw; dx <= hw; dx++) {
          const px = cx + dx + jag;
          const mistFade = (y - 235) / 68;
          if (mistFade > 0 && bay(px, y) / 16 < mistFade) continue;
          const isLit = dx < -hw * 0.35 && ((px + y) & 1) === 0;
          put(px, y, isLit ? P.midPillarHi : P.midPillar);
        }
      }
    }

    // 4. Bandas horizontais de neblina atmosférica ao pé dos pilares (assinatura visual da print de Owlboy)
    for (const [mistY, mistH] of [[218, 12], [244, 16], [268, 18]]) {
      for (let dy = 0; dy < mistH; dy++) {
        const y = mistY + dy;
        const density = 1 - Math.abs(dy - mistH / 2) / (mistH / 2);
        for (let x = 0; x < HW; x++) {
          if (bay(x, y) / 16 < density * 0.65) {
            put(x, y, P.mist);
          }
        }
      }
    }

    // 5. Arco rochoso superior com vegetação/musgo pendurado (moldura natural da caverna)
    for (let x = 0; x < HW; x++) {
      const archH = Math.round(38 + Math.sin(x * 0.025) * 8 + Math.cos(x * 0.07) * 4 + (x < 90 || x > 550 ? 22 : 0));
      for (let y = 0; y < archH; y++) {
        const depth = (archH - y) / archH;
        const col = depth < 0.18 ? P.rock0 : (depth < 0.45 ? P.rock1 : P.rock2);
        put(x, y, col);
      }
      // Vinhas e musgo pendurados do teto rochoso
      if ((x % 11) < 4) {
        const vineLen = 4 + ((x * 7) % 10);
        for (let vy = 0; vy < vineLen; vy++) {
          put(x, archH + vy, vy < 2 ? P.moss0 : (vy < vineLen - 2 ? P.moss1 : P.moss2));
        }
      }
    }

    // 6. Grande Ilha/Plataforma de Pedra Esculpida (y = 284..360 em 640x360, equiv. y = 142 em 320x180)
    // Blocos facetados em tons terrosos/ardósia (#262020, #3b3332, #524846, #6e635f)
    for (let y = 284; y < HH; y++) {
      for (let x = 0; x < HW; x++) {
        // Facetas poligonais de rocha esculpida
        const cellX = Math.floor((x + Math.sin(y * 0.08) * 6) / 34);
        const cellY = Math.floor((y - 284) / 22);
        const fx = ((x + Math.sin(y * 0.08) * 6) % 34 + 34) % 34;
        const fy = (y - 284) % 22;
        const seam = fx < 2 || fy < 2;
        let col = P.rock1;
        if (seam || y > 346) {
          col = P.rock0;
        } else if (fx + fy < 18) {
          col = ((x + y) & 1) === 0 ? P.rock3 : P.rock2;
        } else if (fx + fy < 34) {
          col = P.rock2;
        } else {
          col = ((cellX + cellY) & 1) ? P.rock1 : P.rock0;
        }
        put(x, y, col);
      }
    }

    // 7. Cobertura de Musgo e Grama Detalhada Folha a Folha no topo da plataforma (y = 278..294)
    for (let x = 0; x < HW; x++) {
      const grassTop = 280 - Math.round(Math.sin(x * 0.19) * 2 + ((x * 13) % 3));
      const mossBottom = 289 + Math.round(Math.sin(x * 0.11) * 3 + ((x * 7) % 4));
      for (let y = grassTop; y <= mossBottom; y++) {
        const t = (y - grassTop) / Math.max(1, mossBottom - grassTop);
        let col = P.moss1;
        if (t < 0.22) col = ((x + y) & 1) ? P.moss3 : P.moss2;
        else if (t < 0.55) col = P.moss2;
        else if (t < 0.82) col = P.moss1;
        else col = P.moss0;
        put(x, y, col);
      }
    }

    // 8. Cristais minerais do ambiente (que permanecem acesos na escuridão cinemática!)
    const envCrystals = [
      [44, 282, 32, 10, -0.15],
      [58, 282, 44, 14, 0.05],
      [124, 282, 26, 10, -0.15],
      [138, 282, 36, 14, 0.0],
      [152, 282, 32, 14, 0.08],
      [166, 282, 28, 10, 0.2],
      [576, 282, 40, 14, -0.1],
      [592, 282, 30, 10, 0.2]
    ];
    for (const [cx, base, h, w, lean] of envCrystals) {
      const hw = w >> 1;
      for (let y = 0; y < h; y++) {
        const half = Math.min(hw, Math.max(1, Math.round(hw * (1 - y / h))));
        const ox = cx + R(y * lean);
        for (let dx = -half; dx <= half; dx++) {
          put(ox + dx, base - y, dx < -1 ? P.cAHi : dx <= 1 ? P.cA : P.cALo);
        }
      }
      if (mode === 'cinematic_crystals') {
        for (let dy = -48; dy <= 14; dy++) {
          for (let dx = -48; dx <= 48; dx++) {
            const dist = Math.hypot(dx, dy);
            if (dist < 46 && bay(cx + dx, base - 18 + dy) < (1 - dist / 46) * 10) {
              const py = base - 18 + dy, px = cx + dx;
              if (py < 282) put(px, py, '#1c384f');
            }
          }
        }
      }
    }
    return buf;
  }

  const BG_DARK = buildCaveBackground('dark');
  const BG_CINEMATIC = buildCaveBackground('cinematic_crystals');
  const BG_LIT = buildCaveBackground('lit');
  const BG_IMAGE = new ImageData(HW, HH);
  const BG_U32 = new Uint32Array(BG_IMAGE.data.buffer);

  function drawMagicCushion(ctx, cx, cy, progress, t) {
    if (progress <= 0) return;
    const f12 = Math.floor(t * SPRITE_FPS);
    const rx = R(22 * progress), ry = R(7 * progress);
    if (rx <= 1 || ry <= 1) return;

    for (let dy = -ry; dy <= ry; dy++) {
      for (let dx = -rx; dx <= rx; dx++) {
        const d = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
        if (d > 1) continue;
        const px = R(cx + dx), py = R(cy + dy);
        if (d > 0.76) {
          P1(ctx, px, py, ((px + py + f12) & 1) ? '#9ef0ff' : '#c7a6ff');
        } else if (bay(px + f12, py) < 7) {
          P1(ctx, px, py, dy < 0 ? '#d0fcff' : '#3fc6f0');
        }
      }
    }
  }

  function drawPathObstacle(ctx, decayRatio, t) {
    if (decayRatio >= 1) return;
    const ox = 264, baseY = 142;
    const maxH = 74;
    const curH = R(maxH * (1 - decayRatio));
    const topY = baseY - curH;

    for (let y = topY; y < baseY; y++) {
      const progressY = (y - topY) / Math.max(1, curH);
      const hw = R(14 + progressY * 8);
      for (let dx = -hw; dx <= hw; dx++) {
        const x = ox + dx;
        let col = '#261e4a';
        if (dx === -hw || y === topY) col = '#4a3c74';
        else if (dx === hw) col = '#140f2d';
        else if (((x + y) % 7 === 0) && decayRatio > 0) col = '#9ef0ff';
        P1(ctx, x, y, col);
      }
    }
    if (decayRatio < 0.9) {
      const f6 = Math.floor(t * 6);
      drawRing(ctx, ox, baseY - R(curH * 0.5), 5, (f6 & 1) ? '#b070ff' : '#5a3296');
    }
  }

  // ============================================================================
  // ELEMENTOS VISUAIS DA PARTE MUSICAL (PARTE 1 E PARTE 2)
  // ============================================================================

  // 1. PARTE 1 (00:00 - 01:20): Teatro de Sombras Hi-Bit na Parede da Caverna + Coreografia da Ordem
  function drawShadowPlayOnWall(ctx, mt, t, ordemX = 160, ordemY = 140) {
    const wx = 66, wy = 18, ww = 188, wh = 92;
    const cx = wx + ww * 0.5;
    const cy = wy + wh * 0.5;
    const f12 = Math.floor(t * SPRITE_FPS);

    // Quase-blecaute dramático no fim do Verso 2 (01:00 - 01:03: "E assim chegamos ao fim...")
    const blackoutFade = (mt >= 59.5 && mt < 63.5)
      ? clamp(1 - Math.sin(clamp((mt - 59.5) / 4.0, 0, 1) * Math.PI) * 0.88, 0.12, 1)
      : 1.0;

    // 1. Feixes de luz volumétricos dramáticos cortando a neblina da caverna (presentes em toda a Parte 1, mais intensos na Intro e no Solo)
    const beamIntensity = mt < 11.0 ? 0.22 : (mt >= 63.5 ? 0.20 : 0.11 * blackoutFade);
    ctx.save();
    for (let b = 0; b < 3; b++) {
      const topX = 112 + b * 48 + Math.sin(t * 0.9 + b * 1.7) * 6;
      const botX = ( b === 1 ? ordemX : (104 + b * 56 + Math.sin(t * 1.1 + b) * 10) );
      ctx.fillStyle = b === 1
        ? `rgba(242, 204, 107, ${beamIntensity.toFixed(3)})`
        : `rgba(104, 184, 196, ${(beamIntensity * 0.85).toFixed(3)})`;
      for (let y = 16; y < 142; y += 2) {
        const p = (y - 16) / 126;
        const bx = topX + (botX - topX) * p;
        const bw = 6 + p * (b === 1 ? 26 : 18);
        ctx.fillRect(RH(bx - bw * 0.5), y, RH(bw), 2);
      }
    }
    ctx.restore();

    // 2. Mural rochoso iluminado em estilo Hi-Bit Owlboy (com bordas orgânicas suaves em 0.5px)
    if (mt >= 7.5) {
      const muralReveal = mt < 11.0 ? clamp((mt - 7.5) / 3.5, 0, 1) : 1.0;
      const effAlpha = muralReveal * blackoutFade;
      ctx.save();
      ctx.globalAlpha = effAlpha;
      for (let y = wy; y < wy + wh; y += 2) {
        for (let x = wx; x < wx + ww; x += 2) {
          const dx = (x - cx) / (ww * 0.5);
          const dy = (y - cy) / (wh * 0.5);
          const dist = Math.hypot(dx, dy);
          if (dist <= 1.0) {
            const col = dist < 0.55 ? '#1f2b4d' : (dist < 0.82 ? '#161e38' : '#0f1428');
            ctx.fillStyle = col;
            ctx.fillRect(x, y, 2, 2);
          }
        }
      }
      // Moldura de pedra antiga entalhada ao redor do mural
      drawRing(ctx, R(cx), R(cy), R(wh * 0.48), '#3b4e7a');
      ctx.restore();
    }

    // 3. Cenas sincronizadas verso a verso com a música (00:00 a 01:20)
    if (mt < 11.0) {
      // [00:00 - 00:11] INTRO DE VIOLINO: Neblina mística, feixes de luz e partículas acompanhando a descida e abertura de asas da Ordem
      for (let i = 0; i < 16; i++) {
        const px = 84 + ((i * 31 + R(Math.sin(t * 1.4 + i) * 12)) % 152);
        const py = 22 + ((i * 19 + f12 * 2) % 114);
        P(ctx, px, py, (i & 1) ? '#f2cc6b' : '#9ee6f0');
      }
      // Halo de pouso e abertura de asas quando a Ordem toca o palco (mt >= 5.5)
      if (mt >= 5.5) {
        const wingP = clamp((mt - 5.5) / 4.5, 0, 1);
        const wingSpan = R(10 + wingP * 28);
        drawRing(ctx, R(ordemX), R(ordemY - 22), R(8 + wingP * 16), '#f2cc6b');
        for (let w = 4; w <= wingSpan; w += 2) {
          const wyOff = R(Math.sin((w / wingSpan) * Math.PI) * 10);
          P(ctx, ordemX - w, ordemY - 22 - wyOff, '#f7e2b8');
          P(ctx, ordemX + w, ordemY - 22 - wyOff, '#f7e2b8');
        }
      }
    } else if (mt < 22.0) {
      // [00:11 - 00:22] "Era uma vez um reino envolto em pura alegria, guiado por quatro gemas em harmonia"
      const pVerse = clamp((mt - 11.0) / 11.0, 0, 1);

      // Silhueta Hi-Bit das torres e pontes do Reino em paz na base do mural
      const baseMuralY = wy + wh - 16;
      ctx.fillStyle = '#0c1022';
      ctx.fillRect(cx - 58, baseMuralY, 116, 8);
      const spires = [
        [-44, 22, 10], [-26, 32, 12], [-8, 44, 16], [12, 34, 12], [30, 26, 10], [44, 18, 8]
      ];
      for (const [sx, sh, sw] of spires) {
        ctx.fillStyle = '#111830';
        ctx.fillRect(R(cx + sx), baseMuralY - sh, sw, sh);
        // Telhado pontiagudo estilo Owlboy
        for (let r = 0; r < 6; r++) {
          ctx.fillStyle = '#293861';
          ctx.fillRect(R(cx + sx + r), baseMuralY - sh - r, Math.max(2, sw - r * 2), 1);
        }
        // Janelinhas acesas em ouro quente
        P(ctx, cx + sx + sw * 0.5, baseMuralY - sh + 6, '#f2cc6b');
        P(ctx, cx + sx + sw * 0.5, baseMuralY - sh + 12, '#f2cc6b');
      }

      // As 4 Gemas Primordiais orbitando em harmonia acima do Reino (Caverna, Floresta, Rio, Caatinga)
      const gemColors = [
        ['#e396b1', '#ffffff'], // Gema da Fada / Caverna
        ['#6ec488', '#e2ffea'], // Esmeralda Primordial / Floresta
        ['#68b8c4', '#e0faff'], // Turmalina Paraíba / Rio
        ['#e37b4b', '#ffe6b8']  // Opala de Fogo / Caatinga
      ];
      const orbitCx = cx, orbitCy = wy + 34;
      drawRing(ctx, R(orbitCx), R(orbitCy), 22, '#354973');
      for (let g = 0; g < 4; g++) {
        const ang = t * 1.15 + (g * Math.PI * 0.5);
        const gx = orbitCx + Math.cos(ang) * 24;
        const gy = orbitCy + Math.sin(ang) * 11;
        // Feixe suave ligando as gemas ao centro do reino
        P(ctx, (gx + orbitCx) * 0.5, (gy + orbitCy) * 0.5, gemColors[g][0]);
        drawStar(ctx, R(gx), R(gy), 3, gemColors[g][1], gemColors[g][0]);
        drawExternalOrb(ctx, gx, gy, gemColors[g][1], gemColors[g][0], '#161e38', 1.1);
      }
      // Brilho de alegria irradiando do centro
      if (pVerse > 0.25) {
        drawStar(ctx, R(orbitCx), R(orbitCy), (f12 & 1) ? 4 : 3, '#ffffff', '#f2cc6b');
      }
    } else if (mt < 30.0) {
      // [00:22 - 00:30] "Cada cristal tinha sua rainha, e entre elas a Ordem era minha"
      const gemColors = ['#e396b1', '#f2cc6b', '#68b8c4', '#e37b4b'];
      const highlightOrdem = mt >= 25.2; // "...e entre elas a Ordem era minha!"

      for (let q = 0; q < 4; q++) {
        const qx = wx + 36 + q * 38;
        const qy = wy + 52;
        const isOrdem = q === 1;
        const bob = Math.sin(t * 2.4 + q) * 1.5;

        // Halo de destaque e asas de borboleta quando a Ordem canta "e entre elas a Ordem era minha"
        if (isOrdem) {
          if (highlightOrdem) {
            drawRing(ctx, R(qx), R(qy - 2 + bob), 16, '#77eef8');
            drawRing(ctx, R(qx), R(qy - 2 + bob), 12, '#e2adf6');
          }
          // Asas de borboleta superiores e inferiores da Fada / Rainha da Ordem
          const wingColHi = highlightOrdem ? '#77eef8' : '#3b4e7a';
          const wingColLo = highlightOrdem ? '#e2adf6' : '#293861';
          for (let w = 4; w <= 13; w += 2) {
            P(ctx, qx - w, qy - 6 - (w * 0.4) + bob, wingColHi);
            P(ctx, qx + w, qy - 6 - (w * 0.4) + bob, wingColHi);
            if (w <= 10) {
              P(ctx, qx - w + 1, qy + 2 + (w * 0.2) + bob, wingColLo);
              P(ctx, qx + w - 1, qy + 2 + (w * 0.2) + bob, wingColLo);
            }
          }
        }

        // Silhueta Hi-Bit esculpida de cada Rainha (vestido de pétalas para a Ordem, manto para as demais)
        ctx.fillStyle = (isOrdem && highlightOrdem) ? '#4ec0ee' : '#090d1c';
        ctx.fillRect(RH(qx - 4), RH(qy - 4 + bob), 8, isOrdem ? 12 : 20);
        ctx.fillRect(RH(qx - 7), RH(qy + 4 + bob), 14, isOrdem ? 8 : 14);
        ctx.fillRect(RH(qx - 3), RH(qy - 10 + bob), 6, 6);

        if (isOrdem) {
          // Flor cristalina azul com miolo dourado no cabelo + cinto dourado
          P(ctx, qx + 3, qy - 10 + bob, '#77eef8');
          P(ctx, qx + 4, qy - 9 + bob, '#f7d75b');
          P(ctx, qx, qy + 2 + bob, '#f7d75b');
        } else {
          // Coroa real delicada de 3 pontas
          const crownCol = gemColors[q];
          P(ctx, qx - 3, qy - 12 + bob, crownCol);
          P(ctx, qx, qy - 14 + bob, '#ffffff');
          P(ctx, qx + 3, qy - 12 + bob, crownCol);
        }

        // Gema Primordial pairando sobre cada Rainha
        drawExternalOrb(ctx, qx, qy - 22 + bob, '#ffffff', gemColors[q], '#161e38', isOrdem && highlightOrdem ? 1.35 : 1.0);
        drawStar(ctx, R(qx), R(qy - 22 + bob), isOrdem ? 4 : 2, '#ffffff', gemColors[q]);
      }
    } else if (mt < 45.0) {
      // [00:30 - 00:44] "Mas com o tempo a fumaça e a ambição vieram manchar o ar e envenenar o chão /
      //                  Mesmo com o grito de alerta iminente, chamaram de farsa o perigo presente"
      const isAlertPart = mt >= 37.5; // "Mesmo com o grito de alerta iminente..."

      // Chão do reino envenenado com fissuras roxas/verdes tóxicas
      ctx.fillStyle = '#12081c';
      ctx.fillRect(wx + 16, wy + wh - 18, ww - 32, 10);
      for (let f = 0; f < 7; f++) {
        const fx = wx + 28 + f * 22;
        const fy = wy + wh - 16;
        P(ctx, fx, fy, '#a844c4');
        P(ctx, fx + 2, fy + 2, '#62d458');
        P(ctx, fx - 2, fy + 4, '#a844c4');
      }

      // Nuvens densas de fumaça escura subindo e manchando o ar do mural
      for (let i = 0; i < 10; i++) {
        const sx = wx + 22 + i * 16 + Math.sin(t * 1.8 + i * 0.9) * 6;
        const sy = wy + wh - 20 - ((t * 18 + i * 9) % 58);
        const sr = 6 + (i % 3) * 2;
        ctx.fillStyle = (i & 1) ? '#0a0514' : '#1b0e2e';
        ctx.fillRect(RH(sx - sr), RH(sy - sr * 0.6), sr * 2, sr * 1.2);
        P(ctx, sx, sy, '#5d2d7a');
      }

      // Seção 00:37 - 00:44: O grito de alerta iminente da Ordem sendo ignorado/engolido pelas sombras
      if (isAlertPart) {
        const alertX = cx - 28;
        const alertY = cy + 6;
        // Silhueta da Ordem emitindo anéis urgentes de alerta
        ctx.fillStyle = '#f2cc6b';
        ctx.fillRect(alertX - 3, alertY - 6, 6, 18);
        const ringR1 = 8 + R(((t * 18) % 22));
        const ringR2 = 8 + R(((t * 18 + 11) % 22));
        drawRing(ctx, alertX, alertY - 4, ringR1, '#f2cc6b');
        drawRing(ctx, alertX, alertY - 4, ringR2, '#e36956');

        // As outras silhuetas dão as costas, engolidas pela fumaça da ambição
        for (let s = 0; s < 3; s++) {
          const ox = cx + 8 + s * 20;
          ctx.fillStyle = '#07040e';
          ctx.fillRect(ox - 4, alertY - 4, 8, 18);
        }
      }
    } else if (mt < 63.5) {
      // [00:45 - 01:03] "Na sombra gerada por mãos tão cruéis, viramos cristais voláteis...
      //                  intensificando o caos e a desordem / E assim chegamos ao fim"
      const clampP = clamp((mt - 45.0) / 10.0, 0, 1);

      // Mãos gigantes de sombra com garras cruéis se fechando pelas laterais sobre o mural
      const handReach = R(18 + clampP * 38);
      ctx.fillStyle = `rgba(6, 3, 14, ${blackoutFade.toFixed(2)})`;
      // Mão esquerda e dedos em garra
      ctx.fillRect(wx + 8, wy + 14, handReach, 14);
      for (let c = 0; c < 4; c++) {
        ctx.fillRect(wx + 8 + handReach, wy + 12 + c * 6, 12, 4);
      }
      // Mão direita e dedos em garra
      ctx.fillRect(wx + ww - 8 - handReach, wy + 14, handReach, 14);
      for (let c = 0; c < 4; c++) {
        ctx.fillRect(wx + ww - 20 - handReach, wy + 12 + c * 6, 12, 4);
      }

      // As 4 Rainhas aprisionadas dentro de Cristais Voláteis que racham com arcos de caos
      for (let q = 0; q < 4; q++) {
        const qx = wx + 38 + q * 38;
        const qy = wy + 52;
        const jitter = (mt < 60.0 && ((f12 + q) & 1)) ? -1 : 1;

        // Prisma de cristal volátil aprisionando a rainha
        ctx.fillStyle = '#221038';
        ctx.fillRect(qx - 9 + jitter, qy - 14, 18, 28);
        ctx.fillStyle = '#090412';
        ctx.fillRect(qx - 4 + jitter, qy - 8, 8, 18);

        // Rachaduras elétricas instáveis no cristal volátil
        const crackCol = (q & 1) ? '#e36956' : '#c068f0';
        P(ctx, qx - 5 + jitter, qy - 10, crackCol);
        P(ctx, qx - 2 + jitter, qy - 6, '#ffffff');
        P(ctx, qx + 2 + jitter, qy - 2, crackCol);
        P(ctx, qx - 1 + jitter, qy + 4, crackCol);
        P(ctx, qx + 4 + jitter, qy + 8, '#ffffff');
      }
    } else {
      // [01:04 - 01:20] SOLO DE VIOLINO: Arcos melódicos dourados e turquesa acompanhando o giro aéreo da Ordem
      const soloP = clamp((mt - 63.5) / 16.5, 0, 1);
      const numArcs = 3 + R(soloP * 3);
      for (let k = 0; k < numArcs; k++) {
        const r = 12 + ((f12 * 2 + k * 9) % 38);
        drawRing(ctx, R(cx), R(cy), r, (k & 1) ? '#f2cc6b' : '#68b8c4');
      }
      // Fitas de luz sinfônica serpenteando pelo mural em sincronia com o violino
      for (let x = wx + 18; x < wx + ww - 18; x += 4) {
        const rel = (x - wx) / ww;
        const y1 = cy + Math.sin(t * 3.8 + rel * 6.2) * (12 + soloP * 14);
        const y2 = cy - Math.sin(t * 3.8 + rel * 6.2) * (10 + soloP * 12);
        P(ctx, x, y1, '#f2cc6b');
        P(ctx, x, y2, '#68b8c4');
      }
    }

    // Partículas luminosas ao redor da Ordem acompanhando sua movimentação pelo palco
    for (let p = 0; p < 5; p++) {
      const ang = t * 2.6 + p * 1.25;
      const px = ordemX + Math.cos(ang) * (14 + (p & 1) * 6);
      const py = (ordemY - 20) + Math.sin(ang * 1.5) * 12;
      P(ctx, px, py, (p & 1) ? '#f2cc6b' : '#9ee6f0');
    }
  }

  // 2. PARTE 2A (01:20 - 01:55): Luz da Manhã, Vinheta Pictórica de Nuvem (3 cenas) + Contagem "1, 2, 3" e Estouro
  function drawMorningSunbeams(ctx, mt, t) {
    const fade = clamp((mt - 80.0) / 3.5, 0, 1);
    ctx.save();
    for (let b = 0; b < 4; b++) {
      const topX = 58 + b * 64 + Math.sin(t * 0.7 + b) * 5;
      const botX = 38 + b * 72;
      ctx.fillStyle = `rgba(247, 226, 184, ${(0.14 * fade).toFixed(3)})`;
      for (let y = 16; y < 144; y += 2) {
        const p = (y - 16) / 128;
        const bx = topX + (botX - topX) * p;
        const bw = 8 + p * 22;
        ctx.fillRect(RH(bx - bw * 0.5), y, RH(bw), 2);
      }
    }
    ctx.restore();
  }

  function drawCloudThoughtBubble(ctx, mt, t, ordemX = 104, ordemY = 140) {
    const bx = 84, by = 16, bw = 152, bh = 72;
    const f12 = Math.floor(t * SPRITE_FPS);

    // Bolinhas de pensamento pictóricas subindo da Ordem até a nuvem
    const tailX = clamp(ordemX + 6, bx + 20, bx + bw - 20);
    ctx.fillStyle = '#3b2d26';
    ctx.fillRect(RH(tailX - 2), RH(ordemY - 46), 5, 5);
    ctx.fillRect(RH(tailX + 2), RH(ordemY - 56), 7, 6);
    ctx.fillStyle = '#f7f3e8';
    ctx.fillRect(RH(tailX - 1), RH(ordemY - 45), 3, 3);
    ctx.fillRect(RH(tailX + 3), RH(ordemY - 55), 5, 4);

    // Contorno e volume fofo de nuvem em Hi-Bit Owlboy (sombra quente + creme claro)
    const puffs = [
      [bx + 20, by + 22, 16], [bx + 46, by + 14, 18], [bx + 76, by + 12, 20],
      [bx + 106, by + 14, 18], [bx + 132, by + 22, 16],
      [bx + 24, by + 50, 16], [bx + 56, by + 54, 18], [bx + 94, by + 54, 18], [bx + 128, by + 50, 16]
    ];
    ctx.fillStyle = '#3b2d26';
    for (const [px, py, r] of puffs) {
      ctx.fillRect(px - r - 1, py - R(r * 0.55) - 1, r * 2 + 2, r + 2);
    }
    ctx.fillStyle = '#dfd5c4';
    for (const [px, py, r] of puffs) {
      ctx.fillRect(px - r, py - R(r * 0.5), r * 2, r);
    }
    ctx.fillStyle = '#f7f3e8';
    ctx.fillRect(bx + 12, by + 12, bw - 24, bh - 22);
    for (const [px, py, r] of puffs) {
      ctx.fillRect(px - r + 2, py - R(r * 0.5) + 1, r * 2 - 4, r - 3);
    }

    // Recorte interno da cena (3 atos sincronizados com a letra de 01:25 a 01:55)
    const ix = bx + 16, iy = by + 14, iw = bw - 32, ih = bh - 28;
    ctx.save();
    ctx.beginPath();
    ctx.rect(ix, iy, iw, ih);
    ctx.clip();

    if (mt < 95.5) {
      // (a) 01:25 - 01:35: "Era uma vez uma criança inocente vagando cá e acolá!" (Superfície alegre e ensolarada)
      ctx.fillStyle = '#a8e0f0';
      ctx.fillRect(ix, iy, iw, ih);
      // Colinas verdes suaves ao fundo
      ctx.fillStyle = '#6ec488';
      ctx.fillRect(ix, iy + ih - 18, iw, 18);
      ctx.fillStyle = '#489660';
      ctx.fillRect(ix, iy + ih - 10, iw, 10);
      // Sol brilhando no canto e flores pelo caminho
      drawStar(ctx, ix + iw - 18, iy + 10, 4, '#ffffff', '#f2cc6b');
      for (let f = 0; f < 5; f++) {
        P(ctx, ix + 14 + f * 24, iy + ih - 11, (f & 1) ? '#f2cc6b' : '#e396b1');
      }
      const walkX = ix + 60 + Math.sin(t * 2.1) * 34;
      const flip = Math.cos(t * 2.1) < 0;
      ctx.save();
      ctx.translate(walkX, iy + ih - 8);
      ctx.scale(0.65, 0.65);
      ActorAnimator.drawActor(ctx, 'protagonist', 'walk', 0, 0, t, { flipX: flip });
      ctx.restore();
    } else if (mt < 101.2) {
      // (b) 01:36 - 01:41: "Em meio a uma aventura, escuridão da caverna..." (Entrando na caverna escura)
      ctx.fillStyle = '#14192e';
      ctx.fillRect(ix, iy, iw, ih);
      // Estalactites no teto da vinheta
      ctx.fillStyle = '#263154';
      for (let s = 0; s < 6; s++) {
        ctx.fillRect(ix + 10 + s * 20, iy, 8, 8 + (s % 3) * 4);
      }
      ctx.fillStyle = '#2c221e';
      ctx.fillRect(ix, iy + ih - 10, iw, 10);
      const walkX = ix + 24 + clamp((mt - 95.5) / 5.5, 0, 1) * 68;
      // Halo de lanterna/luz suave ao redor da criança na caverna escura
      drawRing(ctx, R(walkX), iy + ih - 20, 14, '#f2cc6b');
      ctx.save();
      ctx.translate(walkX, iy + ih - 8);
      ctx.scale(0.65, 0.65);
      ActorAnimator.drawActor(ctx, 'protagonist', 'walk', 0, 0, t);
      ctx.restore();
    } else if (mt < 105.8) {
      // (c) 01:42 - 01:45: "O chão se abriu e no calabouço ela caiu!" (Chão rachando e abrindo com queda!)
      ctx.fillStyle = '#101324';
      ctx.fillRect(ix, iy, iw, ih);
      // Bordas do chão rachado com pedrinhas caindo
      ctx.fillStyle = '#3d2b24';
      ctx.fillRect(ix, iy + ih - 12, 38, 12);
      ctx.fillRect(ix + iw - 38, iy + ih - 12, 38, 12);
      const fallP = clamp((mt - 101.2) / 4.2, 0, 1);
      for (let r = 0; r < 4; r++) {
        P(ctx, ix + 46 + r * 8, iy + 18 + ((R(fallP * 36) + r * 7) % 26), '#b88458');
      }
      const fallY = iy + 12 + fallP * (ih - 14);
      ctx.save();
      ctx.translate(ix + iw * 0.5, fallY);
      ctx.scale(0.65, 0.65);
      ActorAnimator.drawActor(ctx, 'protagonist', 'fall', 0, 0, t);
      ctx.restore();
    } else {
      // (d) 01:46 - 01:55: "Contudo, respira fundo, isso não foi o fim! Foi a deixa perfeita pra mim!"
      ctx.fillStyle = '#1c2442';
      ctx.fillRect(ix, iy, iw, ih);
      drawMagicCushion(ctx, ix + iw * 0.5, iy + ih - 10, 1, t);
      ctx.save();
      ctx.translate(ix + iw * 0.5, iy + ih - 10);
      ctx.scale(0.65, 0.65);
      ActorAnimator.drawActor(ctx, 'protagonist', 'celebrate', 0, 0, t);
      ctx.restore();
      drawStar(ctx, ix + iw * 0.5 - 24, iy + 16, 3, '#ffffff', '#f2cc6b');
      drawStar(ctx, ix + iw * 0.5 + 24, iy + 16, 3, '#ffffff', '#68b8c4');
    }
    ctx.restore();

    if ((f12 & 1) === 0) {
      drawStar(ctx, bx + 16, by + 16, 2, '#ffffff', '#f2cc6b');
      drawStar(ctx, bx + bw - 16, by + 16, 2, '#ffffff', '#68b8c4');
    }

    // Emblemas pulsantes "1", "2", "3" no ritmo exato (01:52.8 a 01:55.3)
    if (mt >= 112.6 && mt < 115.4) {
      const countNum = mt < 113.55 ? '1' : (mt < 114.45 ? '2' : '3');
      const badgeX = countNum === '1' ? bx + 34 : (countNum === '2' ? bx + bw * 0.5 : bx + bw - 34);
      const badgeY = by + bh + 6;
      drawParchmentBox(ctx, R(badgeX - 11), R(badgeY - 9), 22, 18);
      drawPixelTextCentered(ctx, countNum, R(badgeX), R(badgeY - 4), '#7a251c', '#f2cc6b', 18, 9);
      drawStar(ctx, R(badgeX - 13), R(badgeY - 6), 2, '#ffffff', '#f2cc6b');
      drawStar(ctx, R(badgeX + 13), R(badgeY - 6), 2, '#ffffff', '#f2cc6b');
    }
  }

  function drawCloudPopEffect(ctx, popElapsed) {
    if (popElapsed > 0.85) return;
    const cx = 160, cy = 52;
    const r = R(18 + popElapsed * 82);
    for (let k = 0; k < 12; k++) {
      const ang = (k / 12) * Math.PI * 2;
      const px = R(cx + Math.cos(ang) * r);
      const py = R(cy + Math.sin(ang) * r * 0.6);
      ctx.fillStyle = '#f7f3e8';
      ctx.fillRect(px - 3, py - 2, 6, 4);
      drawStar(ctx, px, py, 3, '#ffffff', (k & 1) ? '#f2cc6b' : '#68b8c4');
    }
    if (popElapsed < 0.55) {
      drawParchmentBox(ctx, cx - 38, cy - 10, 76, 19);
      drawPixelTextCentered(ctx, 'Vamos lá!', cx, cy - 4, '#2c221e', '#f2cc6b', 68, 9);
    }
  }

  // 2B. (01:56 - 02:05): Demonstração Visual Telecinética ("move o cristal aqui, tudo isso é bem facinho! Essa luz faz a magia, abriu-se o caminho!")
  function drawTelekineticCrystalDance(ctx, mt, t, ordemX, ordemY) {
    const localP = clamp((mt - 115.5) / 10.0, 0, 1);
    const cx = 186, cy = 84;

    if (localP < 0.55) {
      // Dois cristais com 2 bolinhas externas sendo movidos no ar pela magia da Ordem até se fundirem!
      const mergeP = easeInOut(clamp(localP / 0.55, 0, 1));
      const sep = R((1 - mergeP) * 34);
      const leftX = cx - sep;
      const rightX = cx + sep;

      // Feixes telecinéticos dourados saindo das mãos da Ordem até os cristais
      for (let s = 0; s <= 8; s++) {
        const p = s / 8;
        P(ctx, ordemX + (leftX - ordemX) * p, (ordemY - 24) + (cy - (ordemY - 24)) * p, '#f2cc6b');
        P(ctx, ordemX + (rightX - ordemX) * p, (ordemY - 24) + (cy - (ordemY - 24)) * p, '#68b8c4');
      }

      drawCrystalPiece(ctx, { x: leftX, y: cy, type: 'white', value: 2, shadow: false }, t);
      drawCrystalPiece(ctx, { x: rightX, y: cy, type: 'white', value: 2, shadow: false }, t);
    } else {
      // Cristais fundidos em um Quartzo brilhante de 4 unidades externas que dispara luz para abrir o caminho!
      const postP = (localP - 0.55) / 0.45;
      drawRing(ctx, cx, cy, R(14 + Math.sin(t * 6) * 3), '#f2cc6b');
      drawCrystalPiece(ctx, { x: cx, y: cy, type: 'white', value: 4, shadow: false, lastValChangeAt: postP < 0.25 ? t : 0 }, t);

      // Feixe de luz mágica indo do cristal fundido até a parede direita ("abriu-se o caminho!")
      for (let x = cx + 12; x < 248; x += 3) {
        const py = cy + Math.sin(t * 8 + x * 0.15) * 3;
        P(ctx, x, py, '#f2cc6b');
        P(ctx, x, py - 1, '#ffffff');
      }
      drawStar(ctx, 248, cy, 4, '#ffffff', '#f2cc6b');
    }
  }

  // 3. PARTE 2C (02:06 - 02:09): Projeção de Tambor feita por Dois Cristais com Duas Pedras manipuladas por Magia ("Abre o sapatinho! Vai no sapatinho!")
  function drawCrystalDrumMagic(ctx, cx, cy, t) {
    const f12 = Math.floor(t * SPRITE_FPS);
    // Dois cristais laterais Hi-Bit projetando o tambor energético horizontal
    drawCrystalPiece(ctx, { x: cx - 24, y: cy, type: 'white', value: 1, shadow: false }, t);
    drawCrystalPiece(ctx, { x: cx + 24, y: cy, type: 'rose', value: 1, shadow: false }, t);

    // Superfície da projeção mágica de tambor entre os dois cristais
    for (let x = cx - 15; x <= cx + 15; x++) {
      P(ctx, x, cy + 1, '#ffffff');
      P(ctx, x, cy + 2, (f12 & 1) ? '#f2cc6b' : '#68b8c4');
      P(ctx, x, cy + 3, '#3b2d26');
    }

    // Duas pedras manipuladas por magia batendo alternadamente no tambor de cristal!
    const beatLeft = (f12 % 4) < 2;
    const ly = beatLeft ? cy - 1 : cy - 10;
    const ry = beatLeft ? cy - 10 : cy - 1;

    drawRing(ctx, cx - 6, ly, 4, '#f2cc6b');
    ctx.fillStyle = '#5c4338';
    ctx.fillRect(cx - 8, ly - 2, 5, 4);

    drawRing(ctx, cx + 6, ry, 4, '#68b8c4');
    ctx.fillStyle = '#5c4338';
    ctx.fillRect(cx + 4, ry - 2, 5, 4);

    const hitX = beatLeft ? cx - 6 : cx + 6;
    drawStar(ctx, hitX, cy + 1, 3, '#ffffff', '#f2cc6b');
  }

  // 3B. PARTE 2D (02:09 - 02:46): Grama Viva e Flores Brotando nas Plataformas ("Pequenos passos fazendo a terra inteira florescer!")
  function drawCaveBloomingFlora(ctx, mt, t) {
    if (mt < 129.5) return;
    const bloomP = clamp((mt - 129.5) / 10.0, 0, 1);
    const maxPatches = R(bloomP * 18);
    const flowerColors = ['#f2cc6b', '#e396b1', '#68b8c4', '#ffffff'];

    for (let i = 0; i < maxPatches; i++) {
      const gx = 32 + i * 14;
      const gy = 142 + ((i * 3) % 4);
      // Tufos de grama esmeralda viva estilo Owlboy
      ctx.fillStyle = '#3e7338';
      ctx.fillRect(gx - 3, gy - 2, 6, 2);
      ctx.fillStyle = '#6ec488';
      P(ctx, gx - 2, gy - 3, '#6ec488');
      P(ctx, gx, gy - 4, '#8ee09e');
      P(ctx, gx + 2, gy - 3, '#6ec488');

      // Pequenas flores luminosas desabrochando
      if (i % 2 === 0) {
        const fCol = flowerColors[(i >> 1) % flowerColors.length];
        const sway = Math.sin(t * 2.5 + i) * 0.5;
        P(ctx, gx + sway, gy - 5, fCol);
        P(ctx, gx + sway, gy - 6, '#ffffff');
      }
    }

    // Feixes dourados ascendentes quando a Ordem canta "Eu sou a Ordem... Chegamos ao topo de novo, o reino inteiro vai renascer!" (02:15 - 02:23)
    if (mt >= 135.0 && mt < 143.8) {
      for (let r = 0; r < 3; r++) {
        const rad = 14 + ((R(t * 18) + r * 11) % 34);
        drawRing(ctx, 160, 108, rad, (r & 1) ? '#f2cc6b' : '#6ec488');
      }
    }
  }

  // 3C. PARTE 2E (02:24 - 02:33): Coreografia "Move pra cá! Move pra lá! Sem bagunça, sem fumaça!"
  function drawMovePraCaPraLaShow(ctx, mt, t) {
    if (mt < 143.8 || mt >= 153.8) return;

    if (mt < 148.8) {
      // "Move pra cá! (Move pra lá!) Que o dom da Ordem faz tudo brilhar!"
      const isLeft = mt < 146.2;
      const shiftX = isLeft
        ? -easeInOut(clamp((mt - 143.8) / 1.8, 0, 1)) * 28
        : -28 + easeInOut(clamp((mt - 146.2) / 2.0, 0, 1)) * 56;

      // Trio de cristais flutuantes com suas bolinhas externas dançando em sincronia horizontal com a Ordem e o Protagonista
      const trio = [
        { baseX: 112, y: 78, color: 'white', val: 2 },
        { baseX: 160, y: 68, color: 'rose', val: 3 },
        { baseX: 208, y: 78, color: 'white', val: 2 }
      ];
      for (const c of trio) {
        const cx = R(c.baseX + shiftX);
        // Trilha luminosa indicando o deslize ("Move pra cá / Move pra lá")
        ctx.fillStyle = 'rgba(242, 204, 107, 0.35)';
        ctx.fillRect(cx - (isLeft ? -8 : 18), c.y - 2, 12, 4);
        drawCrystalPiece(ctx, { x: cx, y: c.y, type: c.color, value: c.val, shadow: false }, t);
      }
    } else {
      // "Sem bagunça, sem fumaça, pode agradecer!" (02:28.8 - 02:33.8): Dissipando a fumaça em estrelas douradas
      const cleanP = clamp((mt - 148.8) / 4.8, 0, 1);
      const waveX = R(40 + cleanP * 240);
      for (let i = 0; i < 7; i++) {
        const sx = 56 + i * 32;
        const sy = 64 + (i % 3) * 14;
        if (sx < waveX) {
          drawStar(ctx, sx, sy, 3, '#ffffff', '#f2cc6b');
        } else {
          ctx.fillStyle = '#241536';
          ctx.fillRect(sx - 5, sy - 4, 10, 8);
        }
      }
    }
  }

  // 4. FINAL DA MÚSICA (02:34 - 02:46): Abertura do Caminho e Panorama Hi-Bit estilo Owlboy do Mundo da Floresta
  function drawWorldPanorama(ctx, openProgress, t) {
    const pw = R(104 * clamp(openProgress, 0, 1));
    if (pw <= 2) return;
    const cx = 252, topY = 40, h = 102;
    const x0 = cx - (pw >> 1), x1 = cx + (pw >> 1);
    const f12 = Math.floor(t * SPRITE_FPS);

    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, topY, pw, h);
    ctx.clip();

    // 1. Céu diurno estilo Owlboy (azul celeste suave -> dourado quente no horizonte)
    for (let y = topY; y < topY + h; y++) {
      const p = (y - topY) / h;
      ctx.fillStyle = p < 0.28 ? '#5ca8d6' : (p < 0.52 ? '#88cce8' : (p < 0.72 ? '#cbe8d4' : '#f7e2b8'));
      ctx.fillRect(x0, y, pw, 1);
    }

    // 2. Nuvens volumosas iluminadas pelo sol
    ctx.fillStyle = '#fffdf5';
    ctx.fillRect(cx - 38, topY + 14, 32, 8);
    ctx.fillRect(cx + 6, topY + 10, 36, 9);
    ctx.fillStyle = '#d8c8b4';
    ctx.fillRect(cx - 36, topY + 21, 28, 3);
    ctx.fillRect(cx + 8, topY + 18, 32, 3);

    // 3. Ilhas rochosas flutuantes e pilares da Floresta (assinatura visual de Owlboy)
    const islands = [
      [cx - 28, topY + 34, 22, 14],
      [cx + 14, topY + 28, 26, 16]
    ];
    for (const [ix, iy, iw, ih] of islands) {
      // Rocha marrom-terrosa esculpida abaixo da ilha
      ctx.fillStyle = '#633b34';
      ctx.fillRect(ix + 3, iy + 5, iw - 6, ih - 4);
      ctx.fillStyle = '#402624';
      ctx.fillRect(ix + 7, iy + ih, iw - 14, 6);
      // Topo de grama esmeralda exuberante
      ctx.fillStyle = '#3e7338';
      ctx.fillRect(ix, iy + 2, iw, 5);
      ctx.fillStyle = '#6ec488';
      ctx.fillRect(ix + 2, iy, iw - 4, 3);
    }

    // Cachoeira cristalina caindo da ilha direita
    for (let wy = topY + 33; wy < topY + 86; wy += 2) {
      P(ctx, cx + 24, wy, ((wy + f12) & 2) ? '#ffffff' : '#68b8c4');
      P(ctx, cx + 26, wy + 1, '#9ee6f0');
    }

    // 4. Copa das árvores da Floresta e caminho iluminado pelo sol na base
    ctx.fillStyle = '#26522b';
    ctx.fillRect(x0, topY + 68, pw, 18);
    ctx.fillStyle = '#3e7338';
    ctx.fillRect(x0, topY + 64, pw, 8);
    ctx.fillStyle = '#6ec488';
    for (let tx = x0 + 4; tx < x1 - 4; tx += 10) {
      ctx.fillRect(tx, topY + 60, 7, 5);
    }

    // Rio Turmalina e trilha dourada rumo à Floresta
    ctx.fillStyle = '#4da6ba';
    ctx.fillRect(x0, topY + 84, pw, 8);
    ctx.fillStyle = '#e3b454';
    ctx.fillRect(x0, topY + 92, pw, 10);

    ctx.restore();

    // Moldura de pedra iluminada e partículas solares na passagem aberta
    for (let y = topY; y < topY + h; y += 2) {
      P(ctx, x0, y, (y + f12) & 2 ? '#f7e2b8' : '#d9a85b');
      P(ctx, x1, y, (y + f12) & 2 ? '#f7e2b8' : '#d9a85b');
    }
  }

  // Verifica se há mais de uma voz / coro secundário no instante `mt` da música
  // (Regra Crítica: SEMPRE aciona os animais de pedra com cristais neon e NUNCA confunde com a voz principal da Ordem!)
  const SECONDARY_VOICE_WINDOWS = [
    [80.2, 84.0],   // 01:20 "Mas..." (coro dos animais de pedra)
    [112.6, 116.2], // 01:53 "Um, dois, três e... Vamos lá!"
    [120.8, 123.6], // 02:01 "(Bem facinho!)"
    [125.5, 129.8], // 02:06 "(Abre o sapatinho! Vai no sapatinho!)"
    [133.0, 135.8], // 02:13 "(Pode aplaudir!)"
    [138.0, 143.8], // 02:18 Coro: "Chegamos, chegamos ao topo de novo, o reino inteiro vai renascer!"
    [145.5, 148.8], // 02:26 "(Move pra lá!)"
    [153.5, 166.2]  // 02:34 Grand Finale com coro: "Vai renascer! (Vai renascer! Bem facinho!) A Ordem voltou!"
  ];
  function isSecondaryVoiceActive(mt) {
    return SECONDARY_VOICE_WINDOWS.some(([a, b]) => mt >= a && mt <= b);
  }

  // ============================================================================
  // MOTOR DE RITMO E KARAOKÊ DA CAVERNA (True Pixel Art Bouncing Ball & Holds)
  // Sincronização exata das legendas por trecho e palavra com a cantora (00:00 - 02:46)
  // ============================================================================
  const KARAOKE_PHRASES = [
    {
      t0: 0.5,
      t1: 10.8,
      banner: '♪ Prelúdio de Violino — O Despertar da Ordem ♪',
      words: []
    },
    {
      t0: 10.9,
      t1: 14.3,
      words: [
        { text: 'Era', t: 11.00, dur: 0.55 },
        { text: 'uma', t: 11.65, dur: 0.55 },
        { text: 'vez...', t: 12.35, dur: 1.20, isHold: true, holdDur: 1.20 }
      ]
    },
    {
      t0: 14.4,
      t1: 18.35,
      words: [
        { text: 'um', t: 14.60, dur: 0.28 },
        { text: 'reino', t: 14.95, dur: 0.45 },
        { text: 'envolto', t: 15.45, dur: 0.55 },
        { text: 'em', t: 16.05, dur: 0.30 },
        { text: 'pura', t: 16.45, dur: 0.50 },
        { text: 'alegria,', t: 17.05, dur: 1.15, isHold: true, holdDur: 1.15 }
      ]
    },
    {
      t0: 18.4,
      t1: 22.25,
      words: [
        { text: 'guiado', t: 18.60, dur: 0.55 },
        { text: 'por', t: 19.25, dur: 0.30 },
        { text: 'quatro', t: 19.60, dur: 0.50 },
        { text: 'gemas', t: 20.15, dur: 0.50 },
        { text: 'em', t: 20.70, dur: 0.30 },
        { text: 'harmonia...', t: 21.05, dur: 1.10, isHold: true, holdDur: 1.10 }
      ]
    },
    {
      t0: 22.3,
      t1: 25.95,
      words: [
        { text: 'Cada', t: 22.45, dur: 0.50 },
        { text: 'cristal', t: 23.05, dur: 0.70 },
        { text: 'tinha', t: 23.85, dur: 0.45 },
        { text: 'sua', t: 24.35, dur: 0.40 },
        { text: 'rainha,', t: 24.85, dur: 1.00, isHold: true, holdDur: 1.00 }
      ]
    },
    {
      t0: 26.0,
      t1: 29.95,
      words: [
        { text: 'e', t: 26.05, dur: 0.32 },
        { text: 'entre', t: 26.45, dur: 0.42 },
        { text: 'elas,', t: 26.95, dur: 0.40 },
        { text: 'a', t: 27.40, dur: 0.28 },
        { text: 'Ordem', t: 27.75, dur: 0.60 },
        { text: 'era', t: 28.45, dur: 0.35 },
        { text: 'minha!', t: 28.90, dur: 0.95, isHold: true, holdDur: 0.95 }
      ]
    },
    {
      t0: 30.0,
      t1: 33.85,
      words: [
        { text: 'Mas', t: 30.05, dur: 0.30 },
        { text: 'com', t: 30.38, dur: 0.28 },
        { text: 'o', t: 30.70, dur: 0.28 },
        { text: 'tempo,', t: 31.02, dur: 0.40 },
        { text: 'a', t: 31.46, dur: 0.28 },
        { text: 'fumaça', t: 31.78, dur: 0.42 },
        { text: 'e', t: 32.24, dur: 0.28 },
        { text: 'a', t: 32.56, dur: 0.28 },
        { text: 'ambição', t: 32.88, dur: 0.88, isHold: true, holdDur: 0.88 }
      ]
    },
    {
      t0: 33.9,
      t1: 37.65,
      words: [
        { text: 'vieram', t: 33.95, dur: 0.45 },
        { text: 'manchar', t: 34.45, dur: 0.45 },
        { text: 'o', t: 34.95, dur: 0.28 },
        { text: 'ar', t: 35.28, dur: 0.38 },
        { text: 'e', t: 35.70, dur: 0.28 },
        { text: 'envenenar', t: 36.02, dur: 0.50 },
        { text: 'o', t: 36.56, dur: 0.28 },
        { text: 'chão...', t: 36.90, dur: 0.65, isHold: true, holdDur: 0.65 }
      ]
    },
    {
      t0: 37.7,
      t1: 41.35,
      words: [
        { text: 'Mesmo', t: 37.75, dur: 0.42 },
        { text: 'com', t: 38.22, dur: 0.28 },
        { text: 'o', t: 38.55, dur: 0.28 },
        { text: 'grito', t: 38.88, dur: 0.40 },
        { text: 'de', t: 39.32, dur: 0.28 },
        { text: 'alerta', t: 39.65, dur: 0.55 },
        { text: 'iminente,', t: 40.30, dur: 0.95, isHold: true, holdDur: 0.95 }
      ]
    },
    {
      t0: 41.4,
      t1: 44.95,
      words: [
        { text: 'chamaram', t: 41.45, dur: 0.55 },
        { text: 'de', t: 42.05, dur: 0.30 },
        { text: 'farsa', t: 42.40, dur: 0.55 },
        { text: 'o', t: 43.00, dur: 0.30 },
        { text: 'perigo', t: 43.35, dur: 0.55 },
        { text: 'presente!', t: 44.00, dur: 0.85, isHold: true, holdDur: 0.85 }
      ]
    },
    {
      t0: 45.0,
      t1: 48.65,
      words: [
        { text: 'Na', t: 45.05, dur: 0.28 },
        { text: 'sombra', t: 45.38, dur: 0.48 },
        { text: 'gerada', t: 45.92, dur: 0.55 },
        { text: 'por', t: 46.52, dur: 0.32 },
        { text: 'mãos', t: 46.90, dur: 0.42 },
        { text: 'tão', t: 47.38, dur: 0.32 },
        { text: 'cruéis,', t: 47.75, dur: 0.80, isHold: true, holdDur: 0.80 }
      ]
    },
    {
      t0: 48.7,
      t1: 52.25,
      words: [
        { text: 'viramos', t: 48.75, dur: 0.55 },
        { text: 'cristais', t: 49.35, dur: 0.55 },
        { text: 'voláteis,', t: 49.95, dur: 0.45 },
        { text: 'sem', t: 50.45, dur: 0.30 },
        { text: 'paz', t: 50.80, dur: 0.32 },
        { text: 'nos', t: 51.18, dur: 0.30 },
        { text: 'céus,', t: 51.55, dur: 0.60, isHold: true, holdDur: 0.60 }
      ]
    },
    {
      t0: 52.3,
      t1: 55.85,
      words: [
        { text: 'intensificando', t: 52.35, dur: 0.85 },
        { text: 'o', t: 53.25, dur: 0.30 },
        { text: 'caos', t: 53.60, dur: 0.38 },
        { text: 'e', t: 54.02, dur: 0.28 },
        { text: 'a', t: 54.35, dur: 0.28 },
        { text: 'desordem,', t: 54.68, dur: 1.05, isHold: true, holdDur: 1.05 }
      ]
    },
    {
      t0: 55.9,
      t1: 63.8,
      words: [
        { text: 'e', t: 56.00, dur: 0.35 },
        { text: 'assim...', t: 56.45, dur: 0.85, isHold: true, holdDur: 0.85 },
        { text: 'chegamos', t: 58.00, dur: 1.20, isHold: true, holdDur: 1.20 },
        { text: 'ao', t: 59.95, dur: 0.55 },
        { text: 'fim.', t: 61.80, dur: 1.80, isHold: true, holdDur: 1.80 }
      ]
    },
    {
      t0: 63.85,
      t1: 79.8,
      banner: '♪ Solo de Violino — A Dança das Sombras e da Luz ♪',
      words: []
    },
    {
      t0: 80.0,
      t1: 86.85,
      words: [
        { text: 'Mas...', t: 80.70, dur: 1.20, isHold: true, holdDur: 1.20 },
        { text: 'Era', t: 84.55, dur: 0.35 },
        { text: 'uma', t: 84.95, dur: 0.35 },
        { text: 'vez...', t: 85.40, dur: 1.20, isHold: true, holdDur: 1.20 }
      ]
    },
    {
      t0: 86.9,
      t1: 90.0,
      words: [
        { text: 'uma', t: 87.10, dur: 0.35 },
        { text: 'criança', t: 87.50, dur: 0.95 },
        { text: 'inocente,', t: 88.65, dur: 1.20, isHold: true, holdDur: 1.20 }
      ]
    },
    {
      t0: 90.05,
      t1: 95.35,
      words: [
        { text: 'vagando', t: 90.10, dur: 0.85 },
        { text: 'cá', t: 91.10, dur: 0.38 },
        { text: 'e', t: 91.55, dur: 0.30 },
        { text: 'acolá,', t: 91.95, dur: 0.65 },
        { text: 'tão', t: 92.68, dur: 0.32 },
        { text: 'de', t: 93.05, dur: 0.30 },
        { text: 'repente!', t: 93.45, dur: 1.45, isHold: true, holdDur: 1.45 }
      ]
    },
    {
      t0: 95.4,
      t1: 98.35,
      words: [
        { text: 'Em', t: 95.45, dur: 0.28 },
        { text: 'uma', t: 95.78, dur: 0.30 },
        { text: 'aventura,', t: 96.15, dur: 0.65 },
        { text: 'escuridão', t: 96.88, dur: 0.55 },
        { text: 'da', t: 97.48, dur: 0.28 },
        { text: 'caverna,', t: 97.82, dur: 0.45 }
      ]
    },
    {
      t0: 98.4,
      t1: 101.18,
      words: [
        { text: 'topou', t: 98.45, dur: 0.30 },
        { text: 'com', t: 98.78, dur: 0.28 },
        { text: 'a', t: 99.10, dur: 0.28 },
        { text: 'verdade', t: 99.42, dur: 0.35 },
        { text: 'mais', t: 99.80, dur: 0.28 },
        { text: 'dura', t: 100.12, dur: 0.30 },
        { text: 'e', t: 100.45, dur: 0.28 },
        { text: 'eterna:', t: 100.78, dur: 0.35 }
      ]
    },
    {
      t0: 101.2,
      t1: 105.75,
      words: [
        { text: 'O', t: 101.28, dur: 0.30 },
        { text: 'chão', t: 101.65, dur: 0.50 },
        { text: 'se', t: 102.25, dur: 0.30 },
        { text: 'abriu,', t: 102.62, dur: 0.55 },
        { text: 'e', t: 103.22, dur: 0.28 },
        { text: 'no', t: 103.55, dur: 0.30 },
        { text: 'calabouço', t: 103.90, dur: 0.60 },
        { text: 'ela', t: 104.55, dur: 0.35 },
        { text: 'caiu!', t: 104.95, dur: 0.72, isHold: true, holdDur: 0.72 }
      ]
    },
    {
      t0: 105.8,
      t1: 109.11,
      words: [
        { text: 'Contudo,', t: 105.85, dur: 0.65 },
        { text: 'respira', t: 106.58, dur: 0.40 },
        { text: 'fundo,', t: 107.02, dur: 0.38 },
        { text: 'isso', t: 107.48, dur: 0.30 },
        { text: 'não', t: 107.82, dur: 0.28 },
        { text: 'foi', t: 108.15, dur: 0.28 },
        { text: 'o', t: 108.48, dur: 0.28 },
        { text: 'fim!', t: 108.80, dur: 0.28 }
      ]
    },
    {
      t0: 109.12,
      t1: 112.5,
      words: [
        { text: 'Na', t: 109.22, dur: 0.28 },
        { text: 'verdade,', t: 109.55, dur: 0.32 },
        { text: 'foi', t: 109.90, dur: 0.28 },
        { text: 'a', t: 110.22, dur: 0.28 },
        { text: 'deixa', t: 110.55, dur: 0.40 },
        { text: 'perfeita', t: 111.00, dur: 0.45 },
        { text: 'pra', t: 111.50, dur: 0.30 },
        { text: 'mim!', t: 111.85, dur: 0.60, isHold: true, holdDur: 0.60 }
      ]
    },
    {
      t0: 112.55,
      t1: 115.65,
      words: [
        { text: 'Um,', t: 112.80, dur: 0.45 },
        { text: 'dois,', t: 113.60, dur: 0.45 },
        { text: 'três', t: 114.15, dur: 0.35 },
        { text: 'e...', t: 114.55, dur: 0.32 },
        { text: 'vamos', t: 114.92, dur: 0.32 },
        { text: 'lá!', t: 115.30, dur: 0.32 }
      ]
    },
    {
      t0: 115.7,
      t1: 118.45,
      words: [
        { text: 'Olha', t: 115.78, dur: 0.35 },
        { text: 'só', t: 116.18, dur: 0.30 },
        { text: 'que', t: 116.52, dur: 0.30 },
        { text: 'novidade,', t: 116.88, dur: 0.50 },
        { text: 'eu', t: 117.42, dur: 0.28 },
        { text: 'tô', t: 117.75, dur: 0.28 },
        { text: 'livre!', t: 118.10, dur: 0.32 }
      ]
    },
    {
      t0: 118.5,
      t1: 122.45,
      words: [
        { text: 'Move', t: 118.55, dur: 0.28 },
        { text: 'o', t: 118.88, dur: 0.28 },
        { text: 'cristal', t: 119.20, dur: 0.38 },
        { text: 'aqui,', t: 119.62, dur: 0.35 },
        { text: 'tudo', t: 120.00, dur: 0.32 },
        { text: 'isso', t: 120.35, dur: 0.30 },
        { text: 'é', t: 120.68, dur: 0.28 },
        { text: 'bem', t: 121.00, dur: 0.32 },
        { text: 'facinho!', t: 121.35, dur: 1.00, isHold: true, holdDur: 1.00 }
      ]
    },
    {
      t0: 122.5,
      t1: 126.25,
      words: [
        { text: 'Essa', t: 122.65, dur: 0.35 },
        { text: 'luz', t: 123.05, dur: 0.35 },
        { text: 'faz', t: 123.45, dur: 0.30 },
        { text: 'a', t: 123.80, dur: 0.30 },
        { text: 'magia,', t: 124.15, dur: 0.50 },
        { text: 'abriu-se', t: 124.70, dur: 0.42 },
        { text: 'o', t: 125.18, dur: 0.28 },
        { text: 'caminho!', t: 125.50, dur: 0.70, isHold: true, holdDur: 0.70 }
      ]
    },
    {
      t0: 126.3,
      t1: 129.75,
      words: [
        { text: 'Abre', t: 126.38, dur: 0.32 },
        { text: 'o', t: 126.75, dur: 0.30 },
        { text: 'sapatinho!', t: 127.10, dur: 0.75 },
        { text: 'Vai', t: 128.05, dur: 0.32 },
        { text: 'no', t: 128.42, dur: 0.30 },
        { text: 'sapatinho!', t: 128.78, dur: 0.90, isHold: true, holdDur: 0.90 }
      ]
    },
    {
      t0: 129.8,
      t1: 132.6,
      words: [
        { text: 'Pequenos', t: 129.85, dur: 0.38 },
        { text: 'passos', t: 130.28, dur: 0.35 },
        { text: 'fazendo', t: 130.68, dur: 0.35 },
        { text: 'a', t: 131.08, dur: 0.28 },
        { text: 'terra', t: 131.42, dur: 0.35 },
        { text: 'inteira', t: 131.82, dur: 0.35 },
        { text: 'florescer!', t: 132.22, dur: 0.35 }
      ]
    },
    {
      t0: 132.65,
      t1: 135.42,
      words: [
        { text: 'Eu', t: 132.70, dur: 0.28 },
        { text: 'sou', t: 133.02, dur: 0.28 },
        { text: 'a', t: 133.35, dur: 0.28 },
        { text: 'Ordem,', t: 133.68, dur: 0.30 },
        { text: 'está', t: 134.02, dur: 0.28 },
        { text: 'aqui!', t: 134.35, dur: 0.30 },
        { text: 'Pode', t: 134.70, dur: 0.28 },
        { text: 'aplaudir!', t: 135.02, dur: 0.35 }
      ]
    },
    {
      t0: 135.45,
      t1: 138.35,
      words: [
        { text: 'Siga', t: 135.50, dur: 0.32 },
        { text: 'as', t: 135.85, dur: 0.28 },
        { text: 'minhas', t: 136.18, dur: 0.38 },
        { text: 'regras', t: 136.60, dur: 0.42 },
        { text: 'que', t: 137.05, dur: 0.28 },
        { text: 'tudo', t: 137.38, dur: 0.30 },
        { text: 'vai', t: 137.72, dur: 0.28 },
        { text: 'fluir!', t: 138.05, dur: 0.28 }
      ]
    },
    {
      t0: 138.4,
      t1: 141.12,
      words: [
        { text: 'Chegamos,', t: 138.45, dur: 0.60 },
        { text: 'chegamos', t: 139.15, dur: 0.55 },
        { text: 'ao', t: 139.75, dur: 0.30 },
        { text: 'topo', t: 140.10, dur: 0.32 },
        { text: 'de', t: 140.45, dur: 0.28 },
        { text: 'novo,', t: 140.78, dur: 0.30 }
      ]
    },
    {
      t0: 141.15,
      t1: 144.3,
      words: [
        { text: 'o', t: 141.20, dur: 0.28 },
        { text: 'reino', t: 141.52, dur: 0.40 },
        { text: 'inteiro', t: 141.98, dur: 0.50 },
        { text: 'vai...', t: 142.55, dur: 0.55 },
        { text: 'renascer!', t: 143.15, dur: 1.05, isHold: true, holdDur: 1.05 }
      ]
    },
    {
      t0: 144.35,
      t1: 146.95,
      words: [
        { text: 'Move', t: 144.50, dur: 0.35 },
        { text: 'pra', t: 144.90, dur: 0.30 },
        { text: 'cá!', t: 145.25, dur: 0.45 },
        { text: 'Move', t: 145.78, dur: 0.35 },
        { text: 'pra', t: 146.18, dur: 0.30 },
        { text: 'lá!', t: 146.52, dur: 0.40 }
      ]
    },
    {
      t0: 147.0,
      t1: 150.15,
      words: [
        { text: 'Viu', t: 147.05, dur: 0.30 },
        { text: 'como', t: 147.40, dur: 0.32 },
        { text: 'a', t: 147.75, dur: 0.28 },
        { text: 'Ordem', t: 148.08, dur: 0.40 },
        { text: 'faz', t: 148.52, dur: 0.30 },
        { text: 'tudo', t: 148.88, dur: 0.35 },
        { text: 'brilhar?', t: 149.30, dur: 0.80, isHold: true, holdDur: 0.80 }
      ]
    },
    {
      t0: 150.2,
      t1: 153.9,
      words: [
        { text: 'Sem', t: 150.25, dur: 0.35 },
        { text: 'bagunça,', t: 150.65, dur: 0.70 },
        { text: 'sem', t: 151.45, dur: 0.35 },
        { text: 'fumaça,', t: 151.85, dur: 0.65 },
        { text: 'pode', t: 152.60, dur: 0.38 },
        { text: 'agradecer!', t: 153.05, dur: 0.80, isHold: true, holdDur: 0.80 }
      ]
    },
    {
      t0: 153.95,
      t1: 159.2,
      words: [
        { text: 'O', t: 154.00, dur: 0.28 },
        { text: 'reino', t: 154.32, dur: 0.48 },
        { text: 'vai', t: 154.85, dur: 0.40 },
        { text: 'renascer!', t: 155.35, dur: 1.50, isHold: true, holdDur: 1.50 },
        { text: 'Vai', t: 157.00, dur: 0.38 },
        { text: 'renascer!', t: 157.45, dur: 0.80 },
        { text: 'Bem', t: 158.30, dur: 0.30 },
        { text: 'facinho!', t: 158.65, dur: 0.50 }
      ]
    },
    {
      t0: 159.3,
      t1: 166.5,
      words: [
        { text: 'A', t: 159.60, dur: 0.50 },
        { text: 'Ordem', t: 160.20, dur: 0.90 },
        { text: 'voltou!', t: 161.20, dur: 3.40, isHold: true, holdDur: 3.40 }
      ]
    }
  ];

  const PRACTICE_PHRASE = {
    t0: 0.0,
    t1: 7.2,
    words: [
      { text: 'Era', t: 0.8, dur: 0.6 },
      { text: 'uma', t: 1.8, dur: 0.6 },
      { text: 'vez...', t: 2.8, dur: 0.6 },
      { text: 'harmonia!', t: 3.9, dur: 2.3, isHold: true, holdDur: 2.3 }
    ]
  };

  // Legendas sincronizadas legadas (compatibilidade de consulta)
  const MUSICAL_CAPTIONS = KARAOKE_PHRASES.map(p => [
    p.t0,
    p.t1,
    p.banner || p.words.map(w => w.text).join(' ')
  ]);

  function drawBouncingBall(ctx, x, y, radius = 4, t = 0, isGlowing = false) {
    const rx = Math.round(x);
    const ry = Math.round(y);
    ctx.fillStyle = isGlowing ? 'rgba(255, 234, 49, 0.42)' : 'rgba(122, 234, 255, 0.35)';
    ctx.fillRect(rx - 4, ry - 3, 9, 7);
    ctx.fillRect(rx - 3, ry - 4, 7, 9);
    ctx.fillStyle = isGlowing ? '#ffea31' : '#7aeaff';
    ctx.fillRect(rx - 3, ry - 2, 7, 5);
    ctx.fillRect(rx - 2, ry - 3, 5, 7);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(rx - 1, ry - 1, 3, 3);
    ctx.fillRect(rx - 2, ry - 2, 1, 1);
  }

  const CaveRhythmKaraoke = {
    phrases: KARAOKE_PHRASES,
    practicePhrase: PRACTICE_PHRASE,
    feedbacks: [],
    particles: [],
    practiceHits: 0,

    layoutPhrase(phrase, box = { x: 10, y: 153, w: 300, h: 25 }) {
      if (!phrase || !phrase.words || !phrase.words.length) return 0;
      const words = phrase.words;
      let totalW = 0;
      const gap = words.length > 7 ? 4 : 5;
      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        if (w.width === undefined) w.width = measurePixelText(w.text);
        totalW += w.width + (i > 0 ? gap : 0);
      }
      const startX = Math.round(box.x + Math.max(6, (box.w - totalW) / 2));
      let curX = startX;
      const wordY = box.y + 7;
      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        w.x = curX;
        w.y = wordY;
        w.midX = Math.round(curX + w.width / 2);
        curX += w.width + gap;
      }
      return totalW;
    },

    initLayouts() {
      for (const p of this.phrases) {
        this.layoutPhrase(p);
      }
      this.layoutPhrase(this.practicePhrase, { x: 36, y: 56, w: 248, h: 32 });
    },

    resetSong() {
      this.feedbacks = [];
      this.particles = [];
      for (const phrase of this.phrases) {
        if (!phrase.words) continue;
        for (const w of phrase.words) {
          w.judged = false;
          w.holding = false;
          w.holdSuccess = false;
          w.holdFailed = false;
          w.missed = false;
        }
      }
    },

    resetPractice() {
      this.feedbacks = [];
      this.particles = [];
      for (const w of this.practicePhrase.words) {
        w.judged = false;
        w.holding = false;
        w.holdSuccess = false;
        w.holdFailed = false;
        w.missed = false;
      }
    },

    getCurrentPhrase(mt, isPractice = false) {
      if (isPractice) return this.practicePhrase;
      for (let i = 0; i < this.phrases.length; i++) {
        const p = this.phrases[i];
        if (mt >= p.t0 && mt <= p.t1) return p;
      }
      return null;
    },

    evaluateHit(time, isPractice = false) {
      const phrase = this.getCurrentPhrase(time, isPractice);
      if (!phrase || !phrase.words || !phrase.words.length) return null;
      let target = null;
      let minDiff = 999;
      for (let i = 0; i < phrase.words.length; i++) {
        const w = phrase.words[i];
        const diff = time - w.t;
        if (!w.judged && diff >= -0.40005 && diff <= 0.36005) {
          if (Math.abs(diff) < Math.abs(minDiff)) {
            minDiff = diff;
            target = w;
          }
        }
      }
      if (!target) return null;
      const absDiff = Math.abs(minDiff);
      let grade = 'otimo';
      let text = 'Ótimo!';
      let score = 25;
      let col = '#68e3a2';

      if (absDiff <= 0.095) {
        grade = 'perfeito';
        text = 'Perfeito!';
        score = 50;
        col = '#ffe033';
      } else if ((minDiff >= -0.22 && minDiff < -0.095) || (minDiff > 0.095 && minDiff <= 0.24)) {
        grade = 'otimo';
        text = 'Ótimo!';
        score = 25;
        col = '#68e3a2';
      } else if (minDiff >= -0.40005 && minDiff < -0.22) {
        grade = 'cedo_demais';
        text = 'Cedo demais';
        score = 10;
        col = '#ff9c42';
      } else if (minDiff > 0.24 && minDiff <= 0.36005) {
        grade = 'tarde';
        text = 'Tarde!';
        score = 10;
        col = '#ff9c42';
      } else {
        return null;
      }
      return { grade, text, label: text, score, col, target, diff: minDiff };
    },

    onInput(isDown, isSpace, time, isPractice = false) {
      const phrase = this.getCurrentPhrase(time, isPractice);
      if (!phrase || !phrase.words || !phrase.words.length) return null;

      if (isDown) {
        const hit = this.evaluateHit(time, isPractice);
        if (hit) {
          const target = hit.target;
          target.judged = true;
          if (hit.grade === 'cedo_demais' || hit.grade === 'tarde') {
            GameHUD.playSfx('click');
          } else if (hit.grade === 'perfeito') {
            GameHUD.playSfx('clink');
            this.spawnSparks(target.midX || 160, (target.y || 160) - 4, '#ffe033', 6);
          } else {
            GameHUD.playSfx('click');
            this.spawnSparks(target.midX || 160, (target.y || 160) - 4, '#68e3a2', 4);
          }

          if (target.isHold) {
            target.holding = true;
            target.holdFailed = false;
            target.holdSuccess = false;
          }

          this.feedbacks.push({
            text: hit.text,
            col: hit.col,
            x: target.midX || 160,
            y: (target.y || 160) - 12,
            vy: -15,
            life: 0.75
          });

          if (isPractice) {
            this.practiceHits++;
          }
          return hit;
        }
      } else {
        // Release Space/touch
        for (const w of phrase.words) {
          if (w.isHold && w.holding && !w.holdSuccess && !w.holdFailed) {
            const elapsed = time - w.t;
            if (elapsed < w.holdDur * 0.72) {
              w.holding = false;
              w.holdFailed = true;
              this.feedbacks.push({
                text: 'Soltou cedo',
                col: '#ff9c42',
                x: w.midX || 160,
                y: (w.y || 160) - 12,
                vy: -14,
                life: 0.65
              });
            }
          }
        }
      }
      return null;
    },

    spawnSparks(x, y, col, count = 4) {
      for (let i = 0; i < count; i++) {
        const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        const spd = 12 + Math.random() * 20;
        this.particles.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 6,
          col,
          life: 0.45 + Math.random() * 0.25
        });
      }
    },

    update(dt, time, isHolding, isPractice = false) {
      for (let i = this.feedbacks.length - 1; i >= 0; i--) {
        const fb = this.feedbacks[i];
        fb.y += fb.vy * dt;
        fb.life -= dt;
        if (fb.life <= 0) this.feedbacks.splice(i, 1);
      }

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 45 * dt;
        p.life -= dt;
        if (p.life <= 0) this.particles.splice(i, 1);
      }

      const phrase = this.getCurrentPhrase(time, isPractice);
      if (phrase && phrase.words) {
        for (const w of phrase.words) {
          if (!w.judged && time > w.t + 0.38) {
            w.judged = true;
            w.missed = true;
          }
          if (w.isHold && !w.holdFailed && !w.holdSuccess) {
            if (w.holding) {
              if (isHolding && time >= w.t && time <= w.t + w.holdDur) {
                if (Math.random() < 0.35) {
                  this.spawnSparks(w.x + clamp((time - w.t) / w.holdDur, 0, 1) * w.width, (w.y || 160) - 3, '#fff6a8', 1);
                }
              }
              if ((time - w.t) >= w.holdDur * 0.88) {
                w.holdSuccess = true;
                w.holding = false;
                GameHUD.playSfx('clink');
                this.spawnSparks(w.midX || 160, (w.y || 160) - 6, '#ffd700', 8);
                this.feedbacks.push({
                  text: 'Sustentado!',
                  col: '#ffe033',
                  x: w.midX || 160,
                  y: (w.y || 160) - 14,
                  vy: -15,
                  life: 0.85
                });
              }
            }
          }
        }
      }
    },

    computeJumpArc(deltaT, deltaX = 30) {
      const norm = clamp((deltaT - 0.25) / (1.40 - 0.25), 0, 1);
      const height = Math.round(6 + norm * 19);
      const steps = Math.max(12, Math.round(Math.abs(deltaX) / 3));
      return {
        height: clamp(height, 6, 25),
        duration: deltaT,
        steps
      };
    },

    renderTrajectoryArc(ctx, x0, x1, yBase, arcHeight, currentU = 0) {
      if (arcHeight <= 0) return;
      const steps = Math.max(12, Math.round(Math.abs(x1 - x0) / 2.5));
      for (let s = 0; s <= steps; s++) {
        const u = s / steps;
        const px = Math.round(x0 + (x1 - x0) * u);
        const py = Math.round(yBase - 4 * arcHeight * u * (1 - u));
        if (currentU > 0 && u <= currentU) {
          // Pontos já percorridos pela bolinha: iluminados em dourado vibrante (#ffea31)
          ctx.fillStyle = '#ffea31';
          ctx.fillRect(px, py, 1, 1);
        } else {
          // Trajeto já traçado para todas as palavras do trecho desde o momento em que o trecho aparece
          if (s % 2 === 0) {
            ctx.fillStyle = (s % 4 === 0) ? 'rgba(122, 234, 255, 0.78)' : 'rgba(255, 234, 49, 0.65)';
            ctx.fillRect(px, py, 1, 1);
          }
        }
      }
    },

    getPhraseArcs(phrase, box = { x: 10, y: 153, w: 300, h: 25 }, time = null) {
      if (!phrase || !phrase.words || phrase.words.length < 2) return [];
      const words = phrase.words;
      if (words[0].midX === undefined) {
        this.layoutPhrase(phrase, box);
      }
      const arcs = [];
      for (let i = 0; i < words.length - 1; i++) {
        const curW = words[i];
        const nextW = words[i + 1];
        const nextTargetX = nextW.isHold ? Math.round(nextW.x + 3) : nextW.midX;
        let x0, tLaunch, flightDur, arc;
        if (curW.isHold) {
          const holdDur = curW.holdDur || curW.dur;
          x0 = Math.round(curW.x + curW.width - 3);
          tLaunch = curW.t + holdDur;
          flightDur = Math.max(0.05, nextW.t - tLaunch);
          arc = this.computeJumpArc(flightDur, nextTargetX - x0);
        } else {
          const deltaT = nextW.t - curW.t;
          const dwell = Math.min(0.12, deltaT * 0.25);
          x0 = curW.midX;
          tLaunch = curW.t + dwell;
          flightDur = Math.max(0.05, nextW.t - tLaunch);
          arc = this.computeJumpArc(deltaT, nextTargetX - x0);
        }
        let u = 0;
        if (time !== null) {
          if (time >= nextW.t) u = 1;
          else if (time > tLaunch) u = clamp((time - tLaunch) / flightDur, 0, 1);
        }
        arcs.push({
          fromIndex: i,
          toIndex: i + 1,
          x0,
          x1: nextTargetX,
          height: arc.height,
          duration: arc.duration,
          tLaunch,
          tLand: nextW.t,
          u
        });
      }
      return arcs;
    },

    renderPhraseTrajectories(ctx, phrase, box, time) {
      if (!phrase || !phrase.words || !phrase.words.length) return;
      const words = phrase.words;
      if (words[0].midX === undefined) {
        this.layoutPhrase(phrase, box);
      }
      const wordY = box.y + 7;
      const baseY = wordY - 5;

      // 1. Traço horizontal guia sobre palavras sustentadas (isHold)
      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        if (!w.isHold) continue;
        const hx0 = Math.round(w.x + 3);
        const hx1 = Math.round(w.x + w.width - 3);
        const holdDur = w.holdDur || w.dur;
        const pHold = time <= w.t ? 0 : clamp((time - w.t) / holdDur, 0, 1);
        const curHX = Math.round(hx0 + (hx1 - hx0) * pHold);
        for (let px = hx0; px <= hx1; px += 2) {
          ctx.fillStyle = (pHold > 0 && px <= curHX) ? '#ffea31' : 'rgba(255, 234, 49, 0.55)';
          ctx.fillRect(px, baseY, 1, 1);
        }
      }

      // 2. Todos os arcos de salto entre as palavras do trecho já ficam traçados desde o início do trecho
      const arcs = this.getPhraseArcs(phrase, box, time);
      for (let i = 0; i < arcs.length; i++) {
        const seg = arcs[i];
        this.renderTrajectoryArc(ctx, seg.x0, seg.x1, baseY, seg.height, seg.u);
      }
    },

    getBallPosition(time, isPractice = false, customBox = null) {
      const phrase = this.getCurrentPhrase(time, isPractice);
      const box = customBox || (isPractice ? { x: 36, y: 56, w: 248, h: 32 } : { x: 10, y: 153, w: 300, h: 25 });
      const defaultY = box.y + 7 - 5;
      if (!phrase || !phrase.words || !phrase.words.length) {
        return { x: 160, y: defaultY, arcActive: false, arcHeight: 0, isGlow: false };
      }

      const words = phrase.words;
      if (words[0].midX === undefined) {
        this.layoutPhrase(phrase, box);
      }
      const wordY = box.y + 7;
      const baseY = wordY - 5;
      const firstW = words[0];
      const lastW = words[words.length - 1];

      // Caso 1: Antes da primeira palavra da frase (time < firstW.t)
      if (time < firstW.t) {
        const targetFirstX = firstW.isHold ? Math.round(firstW.x + 3) : firstW.midX;
        const availablePrep = firstW.t - phrase.t0;
        if (availablePrep < 0.15) {
          return { x: targetFirstX, y: baseY, arcActive: false, arcHeight: 0, isGlow: false };
        }
        const hopDist = Math.min(16, Math.max(8, Math.round(availablePrep * 35)));
        const startX = targetFirstX - hopDist;
        const tLaunch = Math.max(phrase.t0, firstW.t - 0.4);
        if (time < tLaunch) {
          return { x: startX, y: baseY, arcActive: false, arcHeight: 0, isGlow: false };
        }
        const tau = Math.max(0.1, firstW.t - tLaunch);
        const p = clamp((time - tLaunch) / tau, 0, 1);
        const arc = this.computeJumpArc(tau, hopDist);
        const ballX = Math.round(startX + (targetFirstX - startX) * p);
        const ballY = baseY - Math.round(4 * arc.height * p * (1 - p));
        return {
          x: ballX,
          y: ballY,
          arcActive: true,
          arcHeight: arc.height,
          isGlow: true,
          arcX0: startX,
          arcX1: targetFirstX,
          arcU: p
        };
      }

      // Caso 2: Entre as palavras da frase atual
      for (let i = 0; i < words.length; i++) {
        const curW = words[i];
        const nextW = (i < words.length - 1) ? words[i + 1] : null;

        if (nextW) {
          if (time >= curW.t && time < nextW.t) {
            const nextTargetX = nextW.isHold ? Math.round(nextW.x + 3) : nextW.midX;
            if (curW.isHold) {
              const holdDur = curW.holdDur || curW.dur;
              const tHoldEnd = curW.t + holdDur;
              if (time < tHoldEnd) {
                const pHold = clamp((time - curW.t) / holdDur, 0, 1);
                const ballX = Math.round(curW.x + 3 + (curW.width - 6) * pHold);
                const pRampIn = clamp((time - curW.t) / 0.12, 0, 1);
                let ballY = baseY;
                if (curW.holdFailed) {
                  ballY = baseY + Math.round(1 * pRampIn);
                } else if (curW.holding || curW.holdSuccess) {
                  const targetElev = -5 + Math.sin(time * 12) * 1.5;
                  ballY = baseY + Math.round(targetElev * pRampIn);
                } else {
                  const targetElev = -1 + Math.sin(time * 10) * 1.0;
                  ballY = baseY + Math.round(targetElev * pRampIn);
                }
                const guideStart = Math.round(curW.x + curW.width - 3);
                const flightDur = Math.max(0.05, nextW.t - tHoldEnd);
                const arc = this.computeJumpArc(flightDur, nextTargetX - guideStart);
                return {
                  x: ballX,
                  y: ballY,
                  arcActive: false,
                  arcHeight: 0,
                  isGlow: true,
                  guideX0: guideStart,
                  guideX1: nextTargetX,
                  guideHeight: arc.height
                };
              } else {
                const xStart = Math.round(curW.x + curW.width - 3);
                const flightDur = Math.max(0.05, nextW.t - tHoldEnd);
                const p = clamp((time - tHoldEnd) / flightDur, 0, 1);
                const arc = this.computeJumpArc(flightDur, nextTargetX - xStart);
                const ballX = Math.round(xStart + (nextTargetX - xStart) * p);
                const yStart = (curW.holding || curW.holdSuccess) ? (baseY - 5) : (curW.holdFailed ? (baseY + 1) : (baseY - 1));
                const yBaseCur = yStart + (baseY - yStart) * p;
                const ballY = Math.round(yBaseCur - 4 * arc.height * p * (1 - p));
                return {
                  x: ballX,
                  y: ballY,
                  arcActive: true,
                  arcHeight: arc.height,
                  isGlow: true,
                  arcX0: xStart,
                  arcX1: nextTargetX,
                  arcU: p
                };
              }
            } else {
              const deltaT = nextW.t - curW.t;
              const dwell = Math.min(0.12, deltaT * 0.25);
              const xStart = curW.midX;
              const arc = this.computeJumpArc(deltaT, nextTargetX - xStart);
              if (time < curW.t + dwell) {
                const pBounce = (time - curW.t) / dwell;
                const ballX = curW.midX;
                const ballY = baseY - Math.round(Math.sin(pBounce * Math.PI) * 2.5);
                return {
                  x: ballX,
                  y: ballY,
                  arcActive: false,
                  arcHeight: 0,
                  isGlow: true,
                  guideX0: xStart,
                  guideX1: nextTargetX,
                  guideHeight: arc.height
                };
              } else {
                const tLaunch = curW.t + dwell;
                const flightDur = Math.max(0.05, nextW.t - tLaunch);
                const p = clamp((time - tLaunch) / flightDur, 0, 1);
                const ballX = Math.round(xStart + (nextTargetX - xStart) * p);
                const ballY = baseY - Math.round(4 * arc.height * p * (1 - p));
                return {
                  x: ballX,
                  y: ballY,
                  arcActive: true,
                  arcHeight: arc.height,
                  isGlow: true,
                  arcX0: xStart,
                  arcX1: nextTargetX,
                  arcU: p
                };
              }
            }
          }
        } else {
          // Última palavra da frase
          if (time >= curW.t) {
            if (curW.isHold) {
              const holdDur = curW.holdDur || curW.dur;
              const tHoldEnd = curW.t + holdDur;
              if (time <= tHoldEnd) {
                const pHold = clamp((time - curW.t) / holdDur, 0, 1);
                const ballX = Math.round(curW.x + 3 + (curW.width - 6) * pHold);
                const pRampIn = clamp((time - curW.t) / 0.12, 0, 1);
                let ballY = baseY;
                if (curW.holdFailed) {
                  ballY = baseY + Math.round(1 * pRampIn);
                } else if (curW.holding || curW.holdSuccess) {
                  const targetElev = -5 + Math.sin(time * 12) * 1.5;
                  ballY = baseY + Math.round(targetElev * pRampIn);
                } else {
                  const targetElev = -1 + Math.sin(time * 10) * 1.0;
                  ballY = baseY + Math.round(targetElev * pRampIn);
                }
                return { x: ballX, y: ballY, arcActive: false, arcHeight: 0, isGlow: true };
              } else {
                const ballX = Math.round(curW.x + curW.width - 3);
                const pSettle = clamp((time - tHoldEnd) / 0.15, 0, 1);
                const yHoldExit = (curW.holding || curW.holdSuccess) ? (baseY - 5) : (curW.holdFailed ? (baseY + 1) : (baseY - 1));
                const ballY = Math.round(yHoldExit + (baseY - yHoldExit) * pSettle);
                return { x: ballX, y: ballY, arcActive: false, arcHeight: 0, isGlow: false };
              }
            } else {
              if (time <= curW.t + 0.16) {
                const pBounce = clamp((time - curW.t) / 0.16, 0, 1);
                const ballX = curW.midX;
                const ballY = baseY - Math.round(Math.sin(pBounce * Math.PI) * 2.5);
                return { x: ballX, y: ballY, arcActive: false, arcHeight: 0, isGlow: true };
              } else {
                return { x: curW.midX, y: baseY, arcActive: false, arcHeight: 0, isGlow: false };
              }
            }
          }
        }
      }

      const lastEndX = lastW.isHold ? Math.round(lastW.x + lastW.width - 3) : lastW.midX;
      return { x: lastEndX, y: baseY, arcActive: false, arcHeight: 0, isGlow: false };
    },

    render(ctx, time, isPractice = false, customBox = null) {
      const box = customBox || (isPractice ? { x: 36, y: 56, w: 248, h: 32 } : { x: 10, y: 153, w: 300, h: 25 });
      drawParchmentBox(ctx, box.x, box.y, box.w, box.h);

      const phrase = this.getCurrentPhrase(time, isPractice);
      if (!phrase) return;

      if (phrase.banner) {
        drawPixelTextCentered(ctx, phrase.banner, box.x + box.w / 2, box.y + 7, '#ffea31', '#1f1410', box.w - 12, 9);
        return;
      }

      const words = phrase.words;
      if (!words || !words.length) return;

      this.layoutPhrase(phrase, box);
      const wordY = box.y + 7;
      const baseY = wordY - 5;

      let activeIndex = -1;
      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        const span = w.isHold ? (w.holdDur || w.dur) : w.dur;
        if (time >= w.t && time <= (w.t + span)) {
          activeIndex = i;
          break;
        }
      }

      const ballPos = this.getBallPosition(time, isPractice, customBox);
      const ballX = ballPos.x;
      const ballY = ballPos.y;
      const ballGlow = ballPos.isGlow;

      // Renderiza todos os arcos de salto entre as palavras do trecho desde o instante em que o trecho aparece
      this.renderPhraseTrajectories(ctx, phrase, box, time);
      // Caso a bolinha esteja no salto inicial de entrada antes da primeira palavra, desenha também o arco de entrada
      if (time < words[0].t && ballPos.arcActive && ballPos.arcX0 !== undefined && ballPos.arcX1 !== undefined) {
        this.renderTrajectoryArc(ctx, ballPos.arcX0, ballPos.arcX1, baseY, ballPos.arcHeight, ballPos.arcU);
      }

      // Approach Circle: círculo que se fecha sobre a palavra alvo no tempo exato
      let targetWord = null;
      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        if (!w.judged && time <= w.t + 0.20) {
          targetWord = w;
          break;
        }
      }
      if (targetWord && time >= targetWord.t - 0.65) {
        const pRing = clamp((time - (targetWord.t - 0.65)) / 0.65, 0, 1);
        const radius = Math.round(20 * (1 - pRing) + 5 * pRing);
        const ringCol = pRing > 0.85 ? '#ffea31' : '#7aeaff';
        drawRing(ctx, targetWord.midX, wordY - 4, radius, ringCol);
        if (targetWord.isHold && pRing > 0.35) {
          drawRing(ctx, targetWord.midX, wordY - 4, radius + 2, '#ffea31');
        }
      }

      // Words render
      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        const span = w.isHold ? (w.holdDur || w.dur) : w.dur;
        const isPast = time > (w.t + span);
        const isCurrent = (i === activeIndex);

        if (isCurrent && w.isHold) {
          // Palavra apagada na base
          drawPixelText(ctx, w.text, w.x, w.y, '#6c5b52', null);
          const pHold = clamp((time - w.t) / (w.holdDur || w.dur), 0, 1);
          const fillW = Math.round(w.width * pHold);
          if (fillW > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(w.x, w.y - 3, fillW, 16);
            ctx.clip();
            drawPixelText(ctx, w.text, w.x, w.y, '#ffe033', '#2c221e');
            ctx.restore();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(w.x + fillW, w.y - 1, 1, 9);
            ctx.fillStyle = '#ffea31';
            ctx.fillRect(w.x + fillW - 1, w.y, 1, 7);
          }
        } else if (isCurrent || isPast) {
          drawPixelText(ctx, w.text, w.x, w.y, '#ffe033', '#2c221e');
        } else {
          // Palavra apagada / dim antes da bolinha pular nela
          drawPixelText(ctx, w.text, w.x, w.y, '#6c5b52', null);
        }
      }

      // Bouncing ball
      drawBouncingBall(ctx, ballX, ballY, 4, time, ballGlow);

      // Prompt on hold
      if (activeIndex >= 0 && words[activeIndex].isHold) {
        const curW = words[activeIndex];
        const isTouch = typeof E.isMobileOrTouch === 'function' && E.isMobileOrTouch();
        const promptText = curW.holding ? '♥ Segurando!' : (curW.holdFailed ? 'Soltou cedo!' : (isTouch ? 'Segure o Botão!' : 'Segure ESPAÇO!'));
        const promptCol = curW.holding ? '#fff275' : (curW.holdFailed ? '#ff9c42' : '#ffe033');
        drawPixelTextCentered(ctx, promptText, ballX, box.y - 12, promptCol, '#000000', 96, 8);
      }

      // Botão virtual visível para dispositivos touch/mobile substituir a tecla física Espaço
      if (!isPractice && typeof E.isMobileOrTouch === 'function' && E.isMobileOrTouch() && typeof E.drawVirtualTouchButton === 'function') {
        E.drawVirtualTouchButton(ctx, { x: 222, y: 129, w: 88, h: 20 }, '⎵ ESPAÇO / SEGURAR', Boolean(CaveChapter1.isHoldingSpace));
      }

      // Particles
      for (const p of this.particles) {
        ctx.fillStyle = p.col;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 1.5, 1.5);
      }

      // Floating Feedbacks
      for (const fb of this.feedbacks) {
        drawPixelTextCentered(ctx, fb.text, fb.x, fb.y, fb.col, '#1f1410', 80, 8);
      }
    }
  };

  CaveRhythmKaraoke.initLayouts();
  global.CaveRhythmKaraoke = CaveRhythmKaraoke;

  // ============================================================================
  // CONTROLADOR DO MUNDO 1: CAVERNA (ABERTURA + FASES 1–4 + MUSICAL + MAPA)
  // ============================================================================
  const CaveChapter1 = {
    canvas: null,
    ctx: null,
    running: false,
    _inLoop: false,
    _rafId: null,
    t: 0,
    lastNow: 0,

    currentLevel: 1,
    currentStep: 1,
    totalSteps: 1,

    phase: 'cutscene_fall',
    phaseTime: 0,

    protag: {
      x: 74,
      y: -12,
      state: 'fall'
    },
    ordemActor: {
      x: 176,
      y: 32,
      state: 'back_silhouette',
      flipX: false,
      visible: false
    },
    cushionAlpha: 0,

    obstacleDecay: 0,
    targetObstacleDecay: 0,
    ceilingCrystalFlash: false,
    ceilingCrystalBroken: false,

    waveOrigin: { x: 185, y: 96 },
    waveRadius: 0,
    waveActive: false,

    // Controle do Show Musical da Fase 5 (O Sussurro da Fada)
    musicAudio: null,
    musicalTime: 0,
    _lastAudioTime: null,
    _lastAudioPerf: null,
    cloudPopTime: -1,
    skipMusicalBtnRect: { x: 92, y: 2, w: 58, h: 16 },
    vignetteCard: 1,
    vignettePracticeTime: 0,
    isHoldingSpace: false,

    pieces: [],
    pureEquation: null,
    shadowEquation: null,
    draggedPiece: null,
    equationPointer: null,
    magneticAnim: null,

    opalDrainTimer: 0,
    opalStepInterval: 0.55,
    shards: [],

    // Parâmetros de colisão física circular sólida e limites visíveis do cenário (320x180 lógico)
    CRYSTAL_RADIUS: 9,
    SOLID_MIN_DIST: 18,       // 2 * CRYSTAL_RADIUS (impede sobreposição, mantendo alcance <= 26 da Opala de Fogo)
    ANNUL_CONTACT_DIST: 19,   // distância de toque das bordas para anulação imediata Puro + Sombrio
    STAGE_MIN_X: 16,
    STAGE_MAX_X: W - 16,
    STAGE_MIN_Y: 38,          // abaixo do HUD superior (0..20), mantendo as bolinhas externas visíveis
    STAGE_MAX_Y: 128,         // acima do piso de pedra/musgo (y >= 138)

    completeBtnRect: { x: 112, y: 112, w: 96, h: 16 },
    gameOverBtnRect: { x: 96, y: 120, w: 128, h: 16 },
    onChapterFinish: null,

    init(canvasElement) {
      this.canvas = canvasElement || this.ensureCanvas();
      this.ctx = this.canvas.getContext('2d');
      this.ctx.imageSmoothingEnabled = false;
      this.bindInput();

      // Conecta os botões do HUD Superior (Pause, Recomeçar Fase, Mudo e Configurações)
      GameHUD.onRestart = () => {
        this.restartCurrentPhase();
      };

      GameHUD.onGoMap = () => {
        DialogueBox.close();
        TutorialModal.close();
        this.stopMusicAudio();
        this.enterJourneyMapWithIrisIn(false);
      };

      GameHUD.onMuteChange = (muted, effMus) => {
        const vol = effMus !== undefined ? effMus : (muted ? 0 : GameHUD.musicVol / 100);
        const inMusical = this.phase === 'musical_part1_shadows' || this.phase === 'musical_part2_bright';

        if (this.musicAudio) {
          this.musicAudio.muted = !!muted || vol <= 0;
          this.musicAudio.volume = vol;
          if (inMusical) {
            if (muted || vol <= 0 || GameHUD.paused || GameHUD.settingsOpen) {
              try { this.musicAudio.pause(); } catch (_) {}
            } else if (this.musicAudio.paused && this.musicalTime < 166.0) {
              try { this.musicAudio.play().catch(() => {}); } catch (_) {}
            }
          }
        }

        if (global.CrystalMenuAudio && global.CrystalMenuAudio.track) {
          const menuTr = global.CrystalMenuAudio.track;
          menuTr.muted = !!muted || vol <= 0;
          menuTr.volume = vol;
          if (inMusical || muted || vol <= 0 || GameHUD.paused || GameHUD.settingsOpen || !this.isActiveGame()) {
            try { menuTr.pause(); } catch (_) {}
          } else if (this.running && menuTr.paused && this.isActiveGame()) {
            try { menuTr.play().catch(() => {}); } catch (_) {}
          }
        }
      };

      GameHUD.syncAudio();
    },

    isActiveGame() {
      return Boolean(this.running && this.phase !== 'map_iris_in' && this.phase !== 'map_active');
    },

    deactivateCanvas() {
      this.stopMusicAudio();
      global.CrystalMenuAudio?.pause?.();
      this.phase = 'map_active';
      this.running = false;
      this._inLoop = false;
      if (this._rafId) {
        if (typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(this._rafId);
        }
        this._rafId = null;
      }
      IrisTransition.active = false;
      IrisTransition.onDone = null;
      const mapSec = typeof document !== 'undefined' ? document.getElementById('map') : null;
      if (mapSec) mapSec.classList.remove('iris-entering');
      if (this.canvas) {
        this.canvas.hidden = true;
        if (this.canvas.style) {
          this.canvas.style.display = 'none';
          this.canvas.style.pointerEvents = 'none';
          this.canvas.style.background = 'transparent';
          this.canvas.style.boxShadow = 'none';
        }
      }
    },

    prepareCanvasForGame() {
      global.TruePixelWorlds?.deactivateCanvas?.();
      if (!this.canvas) this.init();
      this.canvas.hidden = false;
      this.canvas.style.display = 'block';
      this.canvas.style.pointerEvents = 'auto';
      this.canvas.style.background = '#05030f';
      this.canvas.style.boxShadow = '0 0 0 100vmax #05030f';
      this.fitCanvas(this.canvas);

      if (typeof document !== 'undefined') {
        document.body.dataset.screen = 'game';
        for (const secId of ['home', 'map', 'game']) {
          const el = document.getElementById(secId);
          if (el) el.hidden = true;
        }
      }

      DialogueBox.syncSocketsFromCompleted?.(global.CrystalApp?.state?.completed);
      GameHUD.worldLabel = 'Caverna';
      GameHUD.onRestart = () => {
        this.restartCurrentPhase();
      };
      GameHUD.onGoMap = () => {
        DialogueBox.close();
        TutorialModal.close();
        this.stopMusicAudio();
        this.enterJourneyMapWithIrisIn(false);
      };
      GameHUD.paused = false;
      GameHUD.settingsOpen = false;
      GameHUD.syncAudio();
    },

    restartCurrentPhase() {
      this.prepareCanvasForGame();
      if (typeof DialogueBox.close === 'function') DialogueBox.close();
      if (typeof TutorialModal.close === 'function') TutorialModal.close();
      GameHUD.paused = false;
      GameHUD.settingsOpen = false;
      this.draggedPiece = null;
      this.equationPointer = null;
      this.magneticAnim = null;
      this.clearTrembleStates();
      this.shards = [];
      this.cushionAlpha = 0;
      this.waveActive = false;
      this.waveRadius = 0;
      this.obstacleDecay = 0;
      this.targetObstacleDecay = 0;
      this.ceilingCrystalFlash = false;
      this.ceilingCrystalBroken = false;
      this.ordemActor.visible = false;

      // Se estava na parte musical ou na vinheta da Fase 5, reinicia a fase especial do mundo da caverna
      if (
        this.phase === 'musical_part1_shadows' ||
        this.phase === 'musical_part2_bright' ||
        this.phase === 'musical_vignette' ||
        this.currentLevel === 5
      ) {
        this.startFase5();
        IrisTransition.start('in', 160, 90, 0.45);
        return;
      }

      this.stopMusicAudio();
      const lvl = clamp(this.currentLevel || 1, 1, 4);
      this.currentLevel = lvl;
      this.currentStep = 1;
      this.totalSteps = lvl === 1 ? 1 : 3;
      this.protag.x = 42;
      this.protag.y = 142;
      this.protag.state = 'idle';

      this.setupLevelStep(lvl, 1);
      // Garante entrada direta na jogabilidade da Etapa 1 ao clicar em Recomeçar Fase
      if (typeof TutorialModal.close === 'function') TutorialModal.close();
      this.phase = 'gameplay';
      this.phaseTime = 0;
      this.spawnShatter(160, 90, 'pure', 14);
      GameHUD.playSfx('start');
      IrisTransition.start('in', 160, 90, 0.45);

      if (!this.running) {
        this.running = true;
        this.lastNow = (typeof performance !== 'undefined' ? performance.now() : 0);
        requestAnimationFrame((now) => this.loop(now));
      }
    },

    ensureCanvas() {
      let cv = document.getElementById('truePixelScreen');
      if (!cv) {
        cv = document.createElement('canvas');
        cv.id = 'truePixelScreen';
        cv.width = HW;
        cv.height = HH;
        cv.style.cssText = [
          'position:fixed',
          'left:50%',
          'top:50%',
          'transform:translate(-50%,-50%)',
          'display:block',
          'z-index:40',
          'image-rendering:pixelated',
          'image-rendering:crisp-edges',
          'background:#05030f',
          'box-shadow:0 0 0 100vmax #05030f',
          'cursor:pointer',
          'touch-action:none',
          '-webkit-tap-highlight-color:transparent',
          '-webkit-touch-callout:none',
          '-webkit-user-select:none',
          'user-select:none'
        ].join(';');
        document.body.appendChild(cv);
      } else if (cv.width !== HW || cv.height !== HH) {
        cv.width = HW;
        cv.height = HH;
      }
      this.fitCanvas(cv);
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function' && !cv._resizeHooked) {
        cv._resizeHooked = true;
        window.addEventListener('resize', () => this.fitCanvas(cv));
      }
      return cv;
    },

    fitCanvas(cv) {
      if (!cv || !cv.style) return;
      // Enquadramento 16:9 exato; durante map_iris_in cobre 100% da janela (incluindo bordas) igual ao .journey-map
      const vw = typeof window !== 'undefined' && window.innerWidth ? Math.max(320, window.innerWidth) : 320;
      const vh = typeof window !== 'undefined' && window.innerHeight ? Math.max(180, window.innerHeight) : 180;
      const isMapIris = this.phase === 'map_iris_in' || global.TruePixelWorlds?.phase === 'map_iris_in';
      const scale = isMapIris ? Math.max(vw / W, vh / H) : Math.min(vw / W, vh / H);
      const roundFn = isMapIris ? Math.ceil : Math.round;
      cv.style.width = roundFn(W * scale) + 'px';
      cv.style.height = roundFn(H * scale) + 'px';
      cv.style.display = cv.hidden ? 'none' : 'block';
    },

    toLogicalCoords(clientX, clientY) {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: clamp(R(((clientX - rect.left) / rect.width) * W), 0, W - 1),
        y: clamp(R(((clientY - rect.top) / rect.height) * H), 0, H - 1)
      };
    },

    isInsideEquationAura(eq, x, y, allowReception = false) {
      if (!eq || eq.broken) return false;
      const rx = (eq.expanded || allowReception) ? 48 : 30;
      const ry = (eq.expanded || allowReception) ? 28 : 18;
      const dx = (x - eq.x) / rx, dy = (y - eq.y) / ry;
      return dx * dx + dy * dy <= 1.08;
    },

    bindInput() {
      if (this._bound) return;
      this._bound = true;

      const onDown = (e) => {
        if (!this.running || this.phase === 'map_iris_in' || this.phase === 'map_active') return;
        const pt = e.touches ? e.touches[0] : e;
        const { x, y } = this.toLogicalCoords(pt.clientX, pt.clientY);

        // Prioridade máxima para os botões do HUD Superior (Pause, Recomeçar, Mudo, Configurações) e seus Modais
        if (GameHUD.handleClick(x, y)) {
          return;
        }

        if (DialogueBox.isOpen) {
          GameHUD.playSfx('click');
          DialogueBox.advance();
          return;
        }

        if (TutorialModal.isOpen) {
          TutorialModal.handleClick(x, y);
          return;
        }

        // Botão REINICIAR FASE na Tela de Game Over
        if (this.phase === 'game_over') {
          const gb = this.gameOverBtnRect;
          if (x >= gb.x && x <= gb.x + gb.w && y >= gb.y && y <= gb.y + gb.h) {
            GameHUD.triggerRestart();
          }
          return;
        }

        // Interações da Vinheta da Fase 5 (Cards 1 e 2)
        if (this.phase === 'musical_vignette') {
          this.handleVignetteClick(x, y);
          return;
        }

        // Botão para avançar/concluir durante o show musical caso o jogador queira pular ou tocar no ritmo
        if (this.phase === 'musical_part1_shadows' || this.phase === 'musical_part2_bright') {
          const sb = this.skipMusicalBtnRect;
          if (x >= sb.x && x <= sb.x + sb.w && y >= sb.y && y <= sb.y + sb.h) {
            GameHUD.playSfx('click');
            this.finishMusicalShow();
            return;
          }
          this.isHoldingSpace = true;
          CaveRhythmKaraoke.onInput(true, false, this.musicalTime, false);
          return;
        }

        if (this.phase === 'celebrate_complete' || this.phase === 'world_celebrate_complete') {
          const b = this.completeBtnRect;
          if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
            GameHUD.playSfx('click');
            if (this.phase === 'world_celebrate_complete' || this.currentLevel >= 4) {
              this.startForestExitTransition();
            } else if (this.currentLevel === 1) {
              this.startFase2();
            } else if (this.currentLevel === 2) {
              this.startFase3();
            } else if (this.currentLevel === 3) {
              this.startFase4();
            } else {
              this.startForestExitTransition();
            }
          }
          return;
        }

        if (this.phase !== 'gameplay') return;

        const eq = this.pureEquation;
        const clickedInEq = this.isInsideEquationAura(eq, x, y);

        if (eq && !eq.broken && !eq.expanded && clickedInEq) {
          this.equationPointer = {
            startX: x,
            startY: y,
            origX: eq.x,
            origY: eq.y,
            moved: false
          };
          return;
        }

        for (let i = this.pieces.length - 1; i >= 0; i--) {
          const p = this.pieces[i];
          if (!p.shadow && !p.broken && p.value > 0 && Math.hypot(x - p.x, y - p.y) <= 16) {
            if (p.inEquation && eq && !eq.expanded) continue;
            GameHUD.playSfx(p.type === 'opal' ? 'opalGrab' : (p.type === 'rose' ? 'roseGrab' : 'quartzGrab'));
            this.draggedPiece = p;
            p.dragging = true;
            const immediateHit = this.findTouchingCompatibleShadow(p, p.x, p.y);
            if (immediateHit) {
              this.triggerImmediateAnnulment(p, immediateHit);
            }
            return;
          }
        }

        if (eq && !eq.broken && eq.expanded && clickedInEq) {
          this.equationPointer = {
            startX: x,
            startY: y,
            origX: eq.x,
            origY: eq.y,
            moved: false
          };
        }
      };

      const onMove = (e) => {
        if (!this.running || this.phase === 'map_iris_in' || this.phase === 'map_active') return;
        const pt = e.touches ? e.touches[0] : e;
        if (!pt) return;
        const { x, y } = this.toLogicalCoords(pt.clientX, pt.clientY);

        if (this.draggedPiece) {
          if (this.phase !== 'gameplay' || this.draggedPiece.broken || this.draggedPiece.value <= 0) {
            this.draggedPiece.dragging = false;
            this.draggedPiece = null;
            return;
          }

          const res = this.moveDraggedPieceWithCollision(this.draggedPiece, x, y);
          if (res && res.annulled) {
            return;
          }

          if (this.draggedPiece && this.pureEquation && !this.pureEquation.broken) {
            const overEq = this.isInsideEquationAura(this.pureEquation, this.draggedPiece.x, this.draggedPiece.y, true);
            this.pureEquation.dropHover = overEq && this.draggedPiece.inEquation !== 'pure';
            this.pureEquation.removeHover = !overEq && this.draggedPiece.inEquation === 'pure';
          }
          return;
        }

        if (this.equationPointer && this.pureEquation && !this.pureEquation.broken) {
          const dist = Math.hypot(x - this.equationPointer.startX, y - this.equationPointer.startY);
          if (dist >= 4) {
            this.equationPointer.moved = true;
          }
          if (this.equationPointer.moved) {
            const rawEqX = this.equationPointer.origX + (x - this.equationPointer.startX);
            const rawEqY = this.equationPointer.origY + (y - this.equationPointer.startY);
            this.moveEquationWithCollision(rawEqX, rawEqY);
          }
        }
      };

      const onUp = () => {
        if (!this.running || this.phase === 'map_iris_in' || this.phase === 'map_active') return;

        if (this.isHoldingSpace) {
          this.isHoldingSpace = false;
          if (this.phase === 'musical_vignette' && this.vignetteCard === 2) {
            CaveRhythmKaraoke.onInput(false, true, this.vignettePracticeTime, true);
          } else if (this.phase === 'musical_part1_shadows' || this.phase === 'musical_part2_bright') {
            CaveRhythmKaraoke.onInput(false, false, this.musicalTime, false);
          }
        }

        if (this.equationPointer && this.pureEquation && !this.pureEquation.broken) {
          const wasTap = !this.equationPointer.moved;
          this.equationPointer = null;
          if (wasTap) {
            this.pureEquation.expanded = !this.pureEquation.expanded;
            GameHUD.playSfx(this.pureEquation.expanded ? 'equationExpand' : 'equationCollapse');
            this.layoutEquationPieces(this.pureEquation, 'pure');
          } else {
            GameHUD.playSfx('quartzDrop');
          }
          this.checkEquationSolved();
          return;
        }

        if (this.draggedPiece) {
          const p = this.draggedPiece;
          p.dragging = false;
          this.draggedPiece = null;
          if (this.pureEquation) {
            this.pureEquation.dropHover = false;
            this.pureEquation.removeHover = false;
          }
          this.clearTrembleStates();
          if (p.broken || p.value <= 0 || this.phase !== 'gameplay') return;
          GameHUD.playSfx(p.type === 'opal' ? 'opalDrop' : (p.type === 'rose' ? 'roseDrop' : 'quartzDrop'));
          this.checkPieceDrop(p);
          if (this.phase === 'gameplay') {
            this.checkEquationSolved();
            this.triggerDefeatIfImpossible();
          }
        }
      };

      const onKeyDown = (e) => {
        if (!this.running || this.phase === 'map_iris_in' || this.phase === 'map_active') return;
        if (e.key === 'r' || e.key === 'R') {
          if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
          if (this.isActiveGame()) {
            e.preventDefault();
            this.restartCurrentPhase();
            return;
          }
        }

        if (e.code === 'Space' || e.key === ' ' || e.code === 'Enter' || e.key === 'Enter') {
          if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
          if (this.phase === 'celebrate_complete' || this.phase === 'world_celebrate_complete') {
            e.preventDefault();
            GameHUD.playSfx('click');
            if (this.phase === 'world_celebrate_complete' || this.currentLevel >= 4) {
              this.startForestExitTransition();
            } else if (this.currentLevel === 1) {
              this.startFase2();
            } else if (this.currentLevel === 2) {
              this.startFase3();
            } else if (this.currentLevel === 3) {
              this.startFase4();
            } else {
              this.startForestExitTransition();
            }
            return;
          }
          if (this.phase === 'musical_vignette') {
            e.preventDefault();
            if (this.vignetteCard === 1) {
              this.vignetteCard = 2;
              this.vignettePracticeTime = 0;
              CaveRhythmKaraoke.resetPractice();
              GameHUD.playSfx('click');
              return;
            }
            if (this.vignetteCard === 2) {
              if (e.code === 'Enter' || e.key === 'Enter') {
                this.startMusicalShow();
                return;
              }
              if (!e.repeat) {
                this.isHoldingSpace = true;
                CaveRhythmKaraoke.onInput(true, true, this.vignettePracticeTime, true);
              }
              return;
            }
          } else if (this.phase === 'musical_part1_shadows' || this.phase === 'musical_part2_bright') {
            if (e.code === 'Space' || e.key === ' ') {
              e.preventDefault();
              if (!e.repeat) {
                this.isHoldingSpace = true;
                CaveRhythmKaraoke.onInput(true, false, this.musicalTime, false);
              }
              return;
            }
          }
        }
      };

      const onKeyUp = (e) => {
        if (e.code === 'Space' || e.key === ' ') {
          if (this.phase === 'musical_vignette' && this.vignetteCard === 2) {
            this.isHoldingSpace = false;
            CaveRhythmKaraoke.onInput(false, true, this.vignettePracticeTime, true);
          } else if (this.phase === 'musical_part1_shadows' || this.phase === 'musical_part2_bright') {
            this.isHoldingSpace = false;
            CaveRhythmKaraoke.onInput(false, false, this.musicalTime, false);
          }
        }
      };

      if (this.canvas && typeof this.canvas.addEventListener === 'function') {
        this.canvas.addEventListener('pointerdown', onDown);
      }
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
      }
    },

    clearTrembleStates() {
      this.opalDrainTimer = 0;
      for (const p of this.pieces) p.trembling = false;
    },

    clampCrystalPos(x, y) {
      return {
        x: clamp(x, this.STAGE_MIN_X, this.STAGE_MAX_X),
        y: clamp(y, this.STAGE_MIN_Y, this.STAGE_MAX_Y)
      };
    },

    isCompatibleShadowTarget(purePiece, candidate, px = purePiece.x, py = purePiece.y) {
      if (this.phase !== 'gameplay') return false;
      if (!purePiece || purePiece.shadow || purePiece.broken || purePiece.value <= 0) return false;
      if (!candidate || !candidate.shadow || candidate.broken || candidate.value <= 0 || candidate.inEquation) return false;
      if (
        purePiece.inEquation === 'pure' &&
        this.pureEquation &&
        !this.pureEquation.broken &&
        this.isInsideEquationAura(this.pureEquation, px, py, true)
      ) {
        return false;
      }
      return candidate.type === purePiece.type && candidate.value === purePiece.value;
    },

    findTouchingCompatibleShadow(purePiece, px = purePiece.x, py = purePiece.y) {
      if (!purePiece || purePiece.shadow || purePiece.broken || purePiece.value <= 0) return null;
      let best = null;
      let bestDist = this.ANNUL_CONTACT_DIST;
      for (let i = 0; i < this.pieces.length; i++) {
        const k = this.pieces[i];
        if (!this.isCompatibleShadowTarget(purePiece, k, px, py)) continue;
        const d = Math.hypot(px - k.x, py - k.y);
        if (d <= bestDist) {
          bestDist = d;
          best = k;
        }
      }
      return best;
    },

    triggerImmediateAnnulment(purePiece, shadowTarget) {
      if (!purePiece || !shadowTarget || purePiece.broken || shadowTarget.broken) return false;

      // Cancela imediatamente o estado de arrasto para evitar ponteiros fantasmas
      purePiece.dragging = false;
      if (this.draggedPiece === purePiece) {
        this.draggedPiece = null;
      }

      const wasInPureEq = purePiece.inEquation === 'pure';
      purePiece.inEquation = null;
      if (this.pureEquation) {
        this.pureEquation.dropHover = false;
        this.pureEquation.removeHover = false;
        if (wasInPureEq && !this.pureEquation.broken) {
          this.layoutEquationPieces(this.pureEquation, 'pure');
        }
      }
      this.clearTrembleStates();

      purePiece.broken = true;
      shadowTarget.broken = true;
      GameHUD.playSfx('shatter');
      GameHUD.playSfx('reward');
      const shardSet = purePiece.type === 'rose' ? 'rose' : (purePiece.type === 'opal' ? 'opal' : 'pure');
      this.spawnShatter(shadowTarget.x, shadowTarget.y, shardSet, 12);
      this.spawnShatter(shadowTarget.x, shadowTarget.y, 'shadow', 12);

      this.checkIfAllStepTargetsCleared(shadowTarget.x, shadowTarget.y);
      if (this.phase === 'gameplay') {
        this.checkEquationSolved();
        this.triggerDefeatIfImpossible();
      }
      return true;
    },

    moveDraggedPieceWithCollision(piece, rawX, rawY) {
      if (!piece || piece.broken || piece.value <= 0) return { annulled: false };

      const clampedTarget = this.clampCrystalPos(rawX, rawY);
      let curX = clamp(piece.x, this.STAGE_MIN_X, this.STAGE_MAX_X);
      let curY = clamp(piece.y, this.STAGE_MIN_Y, this.STAGE_MAX_Y);

      const initialHit = this.findTouchingCompatibleShadow(piece, curX, curY);
      if (initialHit) {
        piece.x = curX;
        piece.y = curY;
        this.triggerImmediateAnnulment(piece, initialHit);
        return { annulled: true };
      }

      const totalDx = clampedTarget.x - curX;
      const totalDy = clampedTarget.y - curY;
      const totalDist = Math.hypot(totalDx, totalDy);
      if (totalDist < 1e-4) {
        piece.x = curX;
        piece.y = curY;
        return { annulled: false };
      }

      const minD = this.SOLID_MIN_DIST;
      const steps = Math.max(1, Math.ceil(totalDist / 1.25));
      const stepDx = totalDx / steps;
      const stepDy = totalDy / steps;

      for (let s = 0; s < steps; s++) {
        let nx = clamp(curX + stepDx, this.STAGE_MIN_X, this.STAGE_MAX_X);
        let ny = clamp(curY + stepDy, this.STAGE_MIN_Y, this.STAGE_MAX_Y);

        // 1. Cristais compatíveis disparam anulação imediata ao tocarem suas bordas de colisão
        const shadowHit = this.findTouchingCompatibleShadow(piece, nx, ny);
        if (shadowHit) {
          piece.x = nx;
          piece.y = ny;
          this.triggerImmediateAnnulment(piece, shadowHit);
          return { annulled: true };
        }

        // 2. Cristais incompatíveis possuem colisão sólida circular (sem sobreposição nem travessia)
        let blockedDead = false;
        for (let iter = 0; iter < 6; iter++) {
          let anyOverlap = false;
          for (let i = 0; i < this.pieces.length; i++) {
            const other = this.pieces[i];
            if (
              other === piece ||
              other.broken ||
              other.value <= 0 ||
              this.isCompatibleShadowTarget(piece, other, nx, ny)
            ) {
              continue;
            }
            const dx = nx - other.x;
            const dy = ny - other.y;
            const d = Math.hypot(dx, dy);
            if (d < minD) {
              anyOverlap = true;
              let ux, uy;
              if (d > 1e-4) {
                ux = dx / d;
                uy = dy / d;
              } else {
                const fdx = curX - other.x;
                const fdy = curY - other.y;
                const fd = Math.hypot(fdx, fdy);
                ux = fd > 1e-4 ? fdx / fd : 1;
                uy = fd > 1e-4 ? fdy / fd : 0;
              }

              if (iter === 0) {
                const mvX = nx - curX;
                const mvY = ny - curY;
                const vn = mvX * ux + mvY * uy;
                if (vn < 0) {
                  const vtX = mvX - vn * ux;
                  const vtY = mvY - vn * uy;
                  if (Math.hypot(vtX, vtY) <= Math.abs(vn) * 0.25) {
                    const od = Math.hypot(curX - other.x, curY - other.y);
                    if (od <= minD + 0.05) {
                      blockedDead = true;
                      break;
                    }
                  }
                }
              }

              nx = other.x + ux * minD;
              ny = other.y + uy * minD;
            }
          }
          nx = clamp(nx, this.STAGE_MIN_X, this.STAGE_MAX_X);
          ny = clamp(ny, this.STAGE_MIN_Y, this.STAGE_MAX_Y);
          if (blockedDead || !anyOverlap) break;
        }

        if (blockedDead) break;

        let valid = true;
        for (let i = 0; i < this.pieces.length; i++) {
          const other = this.pieces[i];
          if (
            other === piece ||
            other.broken ||
            other.value <= 0 ||
            this.isCompatibleShadowTarget(piece, other, nx, ny)
          ) {
            continue;
          }
          if (Math.hypot(nx - other.x, ny - other.y) < minD - 0.04) {
            valid = false;
            break;
          }
        }
        if (!valid) break;

        curX = nx;
        curY = ny;

        const postHit = this.findTouchingCompatibleShadow(piece, curX, curY);
        if (postHit) {
          piece.x = curX;
          piece.y = curY;
          this.triggerImmediateAnnulment(piece, postHit);
          return { annulled: true };
        }
      }

      piece.x = curX;
      piece.y = curY;
      return { annulled: false };
    },

    moveEquationWithCollision(rawEqX, rawEqY) {
      const eq = this.pureEquation;
      if (!eq || eq.broken) return;
      const members = this.pieces.filter(p => !p.broken && p.value > 0 && p.inEquation === 'pure');
      const spacing = eq.expanded ? 24 : 18;
      const halfSpan = members.length > 1 ? ((members.length - 1) * spacing) * 0.5 : 0;
      const minEqX = Math.max(44, this.STAGE_MIN_X + halfSpan);
      const maxEqX = Math.min(W - 44, this.STAGE_MAX_X - halfSpan);
      const targetX = clamp(rawEqX, minEqX, maxEqX);
      const targetY = clamp(rawEqY, this.STAGE_MIN_Y, this.STAGE_MAX_Y);

      const totalDx = targetX - eq.x;
      const totalDy = targetY - eq.y;
      const totalDist = Math.hypot(totalDx, totalDy);
      if (totalDist < 1e-4) return;

      const minD = this.SOLID_MIN_DIST;
      const others = this.pieces.filter(p => !p.broken && p.value > 0 && p.inEquation !== 'pure');
      const canShiftBy = (dx, dy) => {
        for (let m = 0; m < members.length; m++) {
          const mx = members[m].x + dx;
          const my = members[m].y + dy;
          if (mx < this.STAGE_MIN_X || mx > this.STAGE_MAX_X || my < this.STAGE_MIN_Y || my > this.STAGE_MAX_Y) {
            return false;
          }
          for (let o = 0; o < others.length; o++) {
            if (Math.hypot(mx - others[o].x, my - others[o].y) < minD - 0.04) {
              return false;
            }
          }
        }
        return true;
      };

      const steps = Math.max(1, Math.ceil(totalDist / 1.5));
      const sdx = totalDx / steps;
      const sdy = totalDy / steps;
      for (let s = 0; s < steps; s++) {
        let appliedDx = 0;
        let appliedDy = 0;
        if (canShiftBy(sdx, sdy)) {
          appliedDx = sdx;
          appliedDy = sdy;
        } else if (Math.abs(sdx) > 1e-4 && canShiftBy(sdx, 0)) {
          appliedDx = sdx;
        } else if (Math.abs(sdy) > 1e-4 && canShiftBy(0, sdy)) {
          appliedDy = sdy;
        } else {
          break;
        }
        eq.x += appliedDx;
        eq.y += appliedDy;
        for (let m = 0; m < members.length; m++) {
          members[m].x += appliedDx;
          members[m].y += appliedDy;
        }
      }
    },

    resolveFreeCrystalCollisions() {
      const minD = this.SOLID_MIN_DIST;
      for (let iter = 0; iter < 6; iter++) {
        for (let i = 0; i < this.pieces.length; i++) {
          const p = this.pieces[i];
          if (p.broken || p.value <= 0 || p.shadow || p.inEquation) continue;
          p.x = clamp(p.x, this.STAGE_MIN_X, this.STAGE_MAX_X);
          p.y = clamp(p.y, this.STAGE_MIN_Y, this.STAGE_MAX_Y);
          for (let j = 0; j < this.pieces.length; j++) {
            if (i === j) continue;
            const o = this.pieces[j];
            if (o.broken || o.value <= 0) continue;
            const dx = p.x - o.x;
            const dy = p.y - o.y;
            const d = Math.hypot(dx, dy);
            if (d < minD) {
              const ux = d > 1e-4 ? dx / d : 0;
              const uy = d > 1e-4 ? dy / d : -1;
              if (!o.shadow && !o.inEquation) {
                const push = (minD - d) * 0.5;
                p.x = clamp(p.x + ux * push, this.STAGE_MIN_X, this.STAGE_MAX_X);
                p.y = clamp(p.y + uy * push, this.STAGE_MIN_Y, this.STAGE_MAX_Y);
                o.x = clamp(o.x - ux * push, this.STAGE_MIN_X, this.STAGE_MAX_X);
                o.y = clamp(o.y - uy * push, this.STAGE_MIN_Y, this.STAGE_MAX_Y);
              } else {
                p.x = clamp(o.x + ux * minD, this.STAGE_MIN_X, this.STAGE_MAX_X);
                p.y = clamp(o.y + uy * minD, this.STAGE_MIN_Y, this.STAGE_MAX_Y);
              }
            }
          }
        }
      }
    },

    layoutEquationPieces(eq, tag) {
      if (!eq || eq.broken) return;
      const members = this.pieces.filter(p => !p.broken && p.value > 0 && p.inEquation === tag);
      const spacing = eq.expanded ? 24 : 18;
      const halfSpan = members.length > 1 ? ((members.length - 1) * spacing) * 0.5 : 0;
      if (this.phase !== 'equation_magnetic') {
        eq.x = clamp(eq.x, this.STAGE_MIN_X + halfSpan, this.STAGE_MAX_X - halfSpan);
        eq.y = clamp(eq.y, this.STAGE_MIN_Y, this.STAGE_MAX_Y);
      }
      const startX = eq.x - halfSpan;
      members.forEach((m, idx) => {
        m.x = R(startX + idx * spacing);
        m.y = R(eq.y);
      });
      if (this.phase === 'gameplay') {
        this.resolveFreeCrystalCollisions();
      }
    },

    // ==========================================================================
    // INICIALIZAÇÃO DAS FASES 1, 2, 3 E 4
    // ==========================================================================
    startCutsceneAndFase1(onFinish = null) {
      this.prepareCanvasForGame();
      this.onChapterFinish = onFinish;
      this.t = 0;
      this.currentLevel = 1;
      this.currentStep = 1;
      this.totalSteps = 1;
      this.phase = 'cutscene_fall';
      this.phaseTime = 0;
      this.protag.x = 74;
      this.protag.y = -10;
      this.protag.state = 'fall';
      this.ordemActor.visible = false;
      this.cushionAlpha = 0;
      this.obstacleDecay = 0;
      this.targetObstacleDecay = 0;
      this.ceilingCrystalFlash = false;
      this.ceilingCrystalBroken = false;
      this.waveRadius = 0;
      this.waveActive = false;
      this.pieces = [];
      this.pureEquation = null;
      this.shadowEquation = null;
      this.shards = [];
      IrisTransition.start('in', 74, 118, 0.75);

      if (!this.running) {
        this.running = true;
        this.lastNow = performance.now();
        requestAnimationFrame((now) => this.loop(now));
      }
    },

    startFase2(onFinish = null) {
      this.startStandardLevel(2, 3, onFinish);
    },

    startFase3(onFinish = null) {
      this.startStandardLevel(3, 3, onFinish);
    },

    startFase4(onFinish = null) {
      this.prepareCanvasForGame();
      if (onFinish) this.onChapterFinish = onFinish;

      this.currentLevel = 4;
      this.currentStep = 1;
      this.totalSteps = 3;
      this.phase = 'cutscene_fase4_walk';
      this.phaseTime = 0;
      this.obstacleDecay = 0;
      this.targetObstacleDecay = 0;
      this.ceilingCrystalFlash = false;
      this.ceilingCrystalBroken = false;
      this.ordemActor.visible = false;
      this.waveRadius = 0;
      this.waveActive = false;
      this.pieces = [];
      this.pureEquation = null;
      this.shadowEquation = null;
      this.magneticAnim = null;
      this.shards = [];

      this.protag.x = -8;
      this.protag.y = 142;
      this.protag.state = 'walk';
      IrisTransition.start('in', 42, 126, 0.65);

      if (!this.running) {
        this.running = true;
        this.lastNow = performance.now();
        requestAnimationFrame((now) => this.loop(now));
      }
    },

    startFase5(onFinish = null) {
      this.prepareCanvasForGame();
      if (onFinish) this.onChapterFinish = onFinish;

      this.currentLevel = 5;
      this.currentStep = 1;
      this.totalSteps = 1;
      this.openMusicalVignette();
    },

    openMusicalVignette() {
      this.currentLevel = 5;
      this.phase = 'musical_vignette';
      this.phaseTime = 0;
      this.vignetteCard = 1;
      this.vignettePracticeTime = 0;
      this.isHoldingSpace = false;
      this.protag.x = 46;
      this.protag.y = 142;
      this.protag.state = 'idle';
      this.ordemActor.visible = true;
      this.ordemActor.x = 160;
      this.ordemActor.y = 36;
      this.ordemActor.state = 'back_silhouette';
      this.stopMusicAudio();
      this.musicalTime = 0;
      this._lastAudioTime = null;
      this._lastAudioPerf = null;
      CaveRhythmKaraoke.resetPractice();
      IrisTransition.start('in', 160, 90, 0.45);

      if (!this.running) {
        this.running = true;
        this.lastNow = performance.now();
        requestAnimationFrame((now) => this.loop(now));
      }
    },

    handleVignetteClick(x, y) {
      const cx = 24, cy = 18, cw = 272, ch = 152;
      if (this.vignetteCard === 1) {
        const b = { x: cx + cw - 92, y: cy + ch - 20, w: 82, h: 15 };
        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
          GameHUD.playSfx('click');
          this.vignetteCard = 2;
          this.vignettePracticeTime = 0;
          CaveRhythmKaraoke.resetPractice();
        }
      } else {
        const bReset = { x: cx + 10, y: cy + ch - 20, w: 88, h: 15 };
        if (x >= bReset.x && x <= bReset.x + bReset.w && y >= bReset.y && y <= bReset.y + bReset.h) {
          GameHUD.playSfx('click');
          this.vignettePracticeTime = 0;
          CaveRhythmKaraoke.resetPractice();
          return;
        }
        const bStart = { x: cx + cw - 124, y: cy + ch - 20, w: 114, h: 15 };
        if (x >= bStart.x && x <= bStart.x + bStart.w && y >= bStart.y && y <= bStart.y + bStart.h) {
          GameHUD.playSfx('start');
          this.startMusicalShow();
          return;
        }
        // Clique no palco de treino aciona o pulo rítmico
        this.isHoldingSpace = true;
        CaveRhythmKaraoke.onInput(true, false, this.vignettePracticeTime, true);
      }
    },

    renderMusicalVignette(ctx, tq) {
      ctx.fillStyle = 'rgba(10, 8, 6, 0.65)';
      ctx.fillRect(0, 20, W, H - 20);

      const cx = 24, cy = 18, cw = 272, ch = 152;
      drawParchmentBox(ctx, cx, cy, cw, ch, { headerH: 18, headerBg: '#3d2b24' });

      if (this.vignetteCard === 1) {
        drawPixelText(ctx, 'A Canção da Caverna', cx + 10, cy + 6, '#ffea31', '#000000', 160, 9);
        drawPixelText(ctx, 'Página 1/2', cx + 10, cy + 6, '#fff66b', '#000000', cw - 20, 9, 'right');

        const prevBox = { x: cx + 12, y: cy + 24, w: cw - 24, h: 36 };
        ctx.fillStyle = '#261c18';
        ctx.fillRect(prevBox.x, prevBox.y, prevBox.w, prevBox.h);
        ctx.fillStyle = '#d9a85b';
        ctx.fillRect(prevBox.x, prevBox.y, prevBox.w, 1);
        ctx.fillRect(prevBox.x, prevBox.y + prevBox.h - 1, prevBox.w, 1);

        drawPixelText(ctx, 'Era', prevBox.x + 18, prevBox.y + 14, '#ffe033', '#000000');
        drawPixelText(ctx, 'uma', prevBox.x + 62, prevBox.y + 14, '#ffe033', '#000000');
        drawPixelText(ctx, 'vez...', prevBox.x + 112, prevBox.y + 14, '#ffe033', '#000000');
        drawPixelText(ctx, 'harmonia!', prevBox.x + 168, prevBox.y + 14, '#92e8ff', '#000000');

        const demT = (tq % 3.0) / 3.0;
        const demX = Math.round(prevBox.x + 118 + 58 * demT);
        const demY = Math.round(prevBox.y + 10 - 4 * 10 * demT * (1 - demT));
        drawBouncingBall(ctx, demX, demY, 4, tq, false);
        const ringR = Math.round(18 * (1 - demT) + 5 * demT);
        drawRing(ctx, prevBox.x + 196, prevBox.y + 10, ringR, '#7aeaff');

        let ty = cy + 68;
        ty += drawPixelText(ctx, 'A Fada das Gemas canta o renascimento da Caverna!', cx + 12, ty, '#ffea31', '#000000', cw - 24, 9) + 4;
        ty += drawPixelText(ctx, '• A bolinha salta de palavra em palavra no compasso.', cx + 12, ty, '#ffea31', '#000000', cw - 24, 9) + 3;
        ty += drawPixelText(ctx, '• No fechamento do círculo, aperte ESPAÇO ou TOQUE!', cx + 12, ty, '#ffea31', '#000000', cw - 24, 9) + 3;
        ty += drawPixelText(ctx, '• Em notas longas, SEGURE para sustentar!', cx + 12, ty, '#ffea31', '#000000', cw - 24, 9) + 3;

        const b = { x: cx + cw - 92, y: cy + ch - 20, w: 82, h: 15 };
        ctx.fillStyle = '#14111c';
        ctx.fillRect(b.x - 1, b.y - 1, b.w + 2, b.h + 2);
        ctx.fillStyle = '#2b689c';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = '#92e8ff';
        ctx.fillRect(b.x, b.y, b.w, 1);
        ctx.fillRect(b.x, b.y + b.h - 1, b.w, 1);
        drawPixelTextCentered(ctx, 'Treinar >', b.x + b.w / 2, b.y + 3, '#ffffff', '#000000', b.w - 4, 8);
      } else {
        drawPixelText(ctx, 'Treino Livre de Ritmo', cx + 10, cy + 6, '#ffea31', '#000000', 160, 9);
        drawPixelText(ctx, 'Página 2/2 • Sem penalidade', cx + 10, cy + 6, '#fff66b', '#000000', cw - 20, 9, 'right');

        drawPixelText(ctx, 'Experimente o salto! Aperte ESPAÇO ou o Botão:', cx + 12, cy + 24, '#ffea31', '#000000', cw - 24, 9);

        const practiceBox = { x: cx + 12, y: cy + 40, w: cw - 24, h: 32 };
        CaveRhythmKaraoke.render(ctx, this.vignettePracticeTime, true, practiceBox);

        drawPixelTextCentered(
          ctx,
          'Aperte ESPAÇO / Botão ao fechar o círculo e SEGURE em "harmonia!"',
          cx + cw / 2,
          cy + 78,
          '#ffea31',
          '#000000',
          cw - 20,
          9
        );

        if (typeof E.isMobileOrTouch === 'function' && E.isMobileOrTouch() && typeof E.drawVirtualTouchButton === 'function') {
          E.drawVirtualTouchButton(ctx, { x: cx + R((cw - 108) / 2), y: cy + 94, w: 108, h: 18 }, '⎵ ESPAÇO / SEGURAR', Boolean(this.isHoldingSpace));
        }

        const bReset = { x: cx + 10, y: cy + ch - 20, w: 88, h: 15 };
        ctx.fillStyle = '#14111c';
        ctx.fillRect(bReset.x - 1, bReset.y - 1, bReset.w + 2, bReset.h + 2);
        ctx.fillStyle = '#324b81';
        ctx.fillRect(bReset.x, bReset.y, bReset.w, bReset.h);
        ctx.fillStyle = '#92e8ff';
        ctx.fillRect(bReset.x, bReset.y, bReset.w, 1);
        ctx.fillRect(bReset.x, bReset.y + bReset.h - 1, bReset.w, 1);
        drawPixelTextCentered(ctx, '↺ Recomeçar', bReset.x + bReset.w / 2, bReset.y + 3, '#ffffff', '#000000', bReset.w - 4, 8);

        const bStart = { x: cx + cw - 124, y: cy + ch - 20, w: 114, h: 15 };
        ctx.fillStyle = '#14111c';
        ctx.fillRect(bStart.x - 1, bStart.y - 1, bStart.w + 2, bStart.h + 2);
        ctx.fillStyle = '#2b689c';
        ctx.fillRect(bStart.x, bStart.y, bStart.w, bStart.h);
        ctx.fillStyle = '#92e8ff';
        ctx.fillRect(bStart.x, bStart.y, bStart.w, 1);
        ctx.fillRect(bStart.x, bStart.y + bStart.h - 1, bStart.w, 1);
        drawPixelTextCentered(ctx, '♪ Iniciar Show!', bStart.x + bStart.w / 2, bStart.y + 3, '#ffffff', '#000000', bStart.w - 4, 8);
      }
    },

    startStandardLevel(levelNum, totalSteps, onFinish = null) {
      this.prepareCanvasForGame();
      if (onFinish) this.onChapterFinish = onFinish;

      this.currentLevel = levelNum;
      this.currentStep = 1;
      this.totalSteps = totalSteps;
      this.phase = 'cutscene_enter_level';
      this.phaseTime = 0;
      this.obstacleDecay = 0;
      this.targetObstacleDecay = 0;
      this.ceilingCrystalFlash = false;
      this.ceilingCrystalBroken = false;
      this.ordemActor.visible = false;
      this.waveRadius = 0;
      this.waveActive = false;
      this.pieces = [];
      this.pureEquation = null;
      this.shadowEquation = null;
      this.magneticAnim = null;
      this.shards = [];

      this.protag.x = -8;
      this.protag.y = 142;
      this.protag.state = 'walk';
      IrisTransition.start('in', 42, 126, 0.65);

      if (!this.running) {
        this.running = true;
        this.lastNow = performance.now();
        requestAnimationFrame((now) => this.loop(now));
      }
    },

    openFase4IntroDialogue() {
      this.phase = 'cutscene_fase4_dlg';
      this.phaseTime = 0;
      this.protag.state = 'shock';

      DialogueBox.open([
        {
          speaker: 'Protagonista',
          portrait: 'portrait_protagonist',
          text: 'Quê?! Mas que cristal enorme é esse?!'
        },
        {
          speaker: 'Voz Misteriosa',
          portrait: 'portrait_mystery_silhouette',
          text: '... Eu estou aqui dentro!!'
        },
        {
          speaker: 'Protagonista',
          portrait: 'portrait_protagonist',
          text: 'Aaaahh!'
        },
        {
          speaker: 'Voz Misteriosa',
          portrait: 'portrait_mystery_silhouette',
          text: 'Manipule os cristais e me tire daqui!'
        },
        {
          speaker: 'Protagonista',
          portrait: 'portrait_protagonist',
          text: 'O-ok! Eu consigo!'
        }
      ], () => {
        this.protag.state = 'idle';
        this.phase = 'gameplay';
        this.phaseTime = 0;
        this.setupLevelStep(4, 1);
      });
    },

    // ==========================================================================
    // SEQUÊNCIA MUSICAL DA FASE 4 ("ERA UMA VEZ — A ORDEM")
    // ==========================================================================
    startMusicalShow() {
      this.currentLevel = 5;
      this.phase = 'musical_part1_shadows';
      this.phaseTime = 0;
      this.musicalTime = 0;
      this._lastAudioTime = null;
      this._lastAudioPerf = null;
      this.cloudPopTime = -1;
      this.isHoldingSpace = false;
      CaveRhythmKaraoke.resetSong();

      // Protagonista recua para a esquerda assistindo à libertação grandiosa
      this.protag.x = 46;
      this.protag.y = 142;
      this.protag.state = 'idle';

      // Quem estava dentro se liberta de forma grandiosa e cai em pé, de costas, em silhueta
      this.ordemActor.visible = true;
      this.ordemActor.x = 160;
      this.ordemActor.y = 36;
      this.ordemActor.state = 'back_silhouette';

      try {
        if (global.CrystalMenuAudio) {
          global.CrystalMenuAudio.pause?.();
        }
        if (global.CrystalMusic) {
          global.CrystalMusic.stop?.();
        }
        if (!this.musicAudio) {
          this.musicAudio = new Audio('assets/audio/era-uma-vez-caverna.mp3?v=13');
          this.musicAudio.preload = 'auto';
        }
        GameHUD.syncAudio();
        this.musicAudio.currentTime = 0;
        const effMus = GameHUD.muted ? 0 : clamp(GameHUD.musicVol / 100, 0, 1);
        this.musicAudio.muted = GameHUD.muted || effMus <= 0;
        this.musicAudio.volume = effMus;
        if (!GameHUD.muted && GameHUD.musicVol > 0) {
          this.musicAudio.play().catch(() => {});
        }
      } catch (_) {}
    },

    stopMusicAudio() {
      if (this.musicAudio) {
        try { this.musicAudio.pause(); } catch (_) {}
      }
      global.CrystalMenuAudio?.pause?.();
    },

    finishMusicalShow() {
      this.stopMusicAudio();
      // Acende a Gema da Caverna no topo da Caixa de Diálogo Global
      DialogueBox.sockets.fairy = true;
      global.CrystalApp?.syncProgress?.([1, 2, 3, 4, 5], 5);
      this.waveOrigin = { x: 160, y: 90 };
      this.waveActive = true;
      this.waveRadius = 400;
      this.obstacleDecay = 1;

      // Corta para o jogo normal com a "Ordem" explicando que agora devem ir para a Floresta
      this.phase = 'post_musical_ordem_dlg';
      this.phaseTime = 0;
      this.protag.x = 84;
      this.protag.y = 142;
      this.protag.state = 'idle';
      this.ordemActor.visible = true;
      this.ordemActor.x = 148;
      this.ordemActor.y = 142;
      this.ordemActor.state = 'idle';

      DialogueBox.open([
        {
          speaker: 'Ordem',
          portrait: 'portrait_ordem',
          text: 'Livre! Eu sou a Ordem, e a Caverna voltou a brilhar!'
        },
        {
          speaker: 'Ordem',
          portrait: 'portrait_ordem',
          text: 'Agora devemos ir para a Floresta restaurar a próxima gema!'
        }
      ], () => {
        // Corta para a animação de conclusão de fase MAIS ANIMADA que o comum (última fase do mundo)
        this.phase = 'world_celebrate_complete';
        this.phaseTime = 0;
        this.protag.state = 'celebrate';
        this.ordemActor.state = 'celebrate';
      });
    },

    startForestExitTransition() {
      // Os personagens caminham juntos até a entrada para o mundo da Floresta (reutilizando `walk`)
      IrisTransition.active = false;
      IrisTransition.onDone = null;
      this._forestExitIrisStarted = false;
      this.phase = 'walk_to_forest_exit';
      this.phaseTime = 0;
      this.protag.state = 'walk';
      this.ordemActor.state = 'walk';
    },

    enterJourneyMapWithIrisIn(worldCompleted = true) {
      const wasInLoop = Boolean(this._inLoop);
      if (typeof DialogueBox.close === 'function') DialogueBox.close();
      if (typeof TutorialModal.close === 'function') TutorialModal.close();
      this.stopMusicAudio();
      GameHUD.paused = false;
      GameHUD.settingsOpen = false;
      this.draggedPiece = null;
      this.equationPointer = null;
      this.clearTrembleStates();

      const finishedCave = Boolean(worldCompleted || DialogueBox.sockets.fairy);
      const completedIds = finishedCave
        ? [1, 2, 3, 4, 5]
        : Array.from({ length: Math.max(0, (this.currentLevel || 1) - 1) }, (_, i) => i + 1);
      const targetCurrent = finishedCave ? 5 : clamp(this.currentLevel || 1, 1, 5);

      if (global.CrystalApp && typeof global.CrystalApp.goto === 'function') {
        global.CrystalApp.syncProgress?.(completedIds, targetCurrent);
        global.CrystalApp.goto('map');
      } else {
        if (typeof document !== 'undefined') {
          document.body.dataset.screen = 'map';
          const homeSec = document.getElementById('home');
          const gameSec = document.getElementById('game');
          const mapSec = document.getElementById('map');
          if (homeSec) homeSec.hidden = true;
          if (gameSec) gameSec.hidden = true;
          if (mapSec) mapSec.hidden = false;
        }
        if (global.CrystalJourney && typeof global.CrystalJourney.render === 'function') {
          let unlockedLvl = 1;
          while (completedIds.includes(unlockedLvl) && unlockedLvl < 20) unlockedLvl++;
          global.CrystalJourney.render({
            current: targetCurrent,
            unlocked: unlockedLvl,
            completed: completedIds,
            records: {},
            reduced: Boolean(GameHUD.reducedMotion),
            notify: (msg) => global.CrystalApp?.notify?.(msg),
            start: (lvlId) => {
              if (lvlId === 1) this.startCutsceneAndFase1();
              else if (lvlId === 2) this.startFase2();
              else if (lvlId === 3) this.startFase3();
              else if (lvlId === 4) this.startFase4();
              else if (lvlId === 5) this.startFase5();
              else {
                this.deactivateCanvas();
                if (global.CrystalApp?.startLevel) {
                  global.CrystalApp.startLevel(lvlId);
                } else {
                  global.TruePixelWorlds?.startByCampaignNode?.(lvlId);
                }
              }
            }
          });
        }
      }

      // Adapta o ícone da fada no Mapa para o estilo True Pixel Art novo
      ActorAnimator.adaptMapFairyIcon();

      // Efeito inverso (Iris In: círculo se abrindo sobre o Mapa!) sem bloquear cliques no DOM
      if (this.canvas) {
        this.phase = 'map_iris_in';
        this.phaseTime = 0;
        this.canvas.hidden = false;
        if (this.canvas.style) {
          this.canvas.style.display = 'block';
          this.canvas.style.background = 'transparent';
          this.canvas.style.boxShadow = 'none';
          this.canvas.style.pointerEvents = 'none';
        }
        this.fitCanvas(this.canvas);
        const mapSec = typeof document !== 'undefined' ? document.getElementById('map') : null;
        if (mapSec) mapSec.classList.add('iris-entering');
        IrisTransition.start('in', 160, 90, 0.95, () => {
          if (mapSec) mapSec.classList.remove('iris-entering');
          this.deactivateCanvas();
        });
        if (wasInLoop) {
          this._inLoop = true;
        }
        if (!this.running || !wasInLoop) {
          this.running = true;
          this.lastNow = typeof performance !== 'undefined' ? performance.now() : 0;
          if (!wasInLoop) {
            if (this._rafId && typeof cancelAnimationFrame === 'function') {
              cancelAnimationFrame(this._rafId);
            }
            this._rafId = requestAnimationFrame((now) => this.loop(now));
          }
        }
      } else {
        this.phase = 'map_active';
      }
    },

    setupLevelStep(level, step) {
      this.currentLevel = level;
      this.currentStep = step;
      this.opalDrainTimer = 0;
      this.pureEquation = null;
      this.shadowEquation = null;
      this.magneticAnim = null;

      if (level === 1) {
        this.totalSteps = 1;
        this.pieces = [
          { id: 'f1_q1', type: 'white', value: 1, shadow: false, x: 118, y: 96 },
          { id: 'f1_s1', type: 'white', value: 1, shadow: true, x: 204, y: 96 }
        ];
      } else if (level === 2) {
        this.totalSteps = 3;
        if (step === 1) {
          this.pieces = [
            { id: 'f2_e1_q1', type: 'white', value: 1, shadow: false, x: 112, y: 96 },
            { id: 'f2_e1_s1', type: 'white', value: 1, shadow: true, x: 206, y: 96 }
          ];
        } else if (step === 2) {
          this.pieces = [
            { id: 'f2_e2_q2', type: 'white', value: 2, shadow: false, x: 122, y: 92 },
            { id: 'f2_e2_op1', type: 'opal', value: 1, shadow: false, x: 84, y: 108 },
            { id: 'f2_e2_s1', type: 'white', value: 1, shadow: true, x: 208, y: 96 }
          ];
          TutorialModal.open(StandardTutorialCards.FASE2_OPAL);
        } else if (step === 3) {
          this.pieces = [
            { id: 'f2_e3_q3', type: 'white', value: 3, shadow: false, x: 96, y: 82 },
            { id: 'f2_e3_q2', type: 'white', value: 2, shadow: false, x: 138, y: 82 },
            { id: 'f2_e3_op3', type: 'opal', value: 3, shadow: false, x: 116, y: 118 },
            { id: 'f2_e3_s2', type: 'white', value: 2, shadow: true, x: 212, y: 96 }
          ];
        }
      } else if (level === 3) {
        this.totalSteps = 3;
        if (step === 1) {
          this.pieces = [
            { id: 'f3_e1_qw3', type: 'white', value: 3, shadow: false, x: 96, y: 76 },
            { id: 'f3_e1_qr2', type: 'rose', value: 2, shadow: false, x: 96, y: 114 },
            { id: 'f3_e1_op2', type: 'opal', value: 2, shadow: false, x: 138, y: 95 },
            { id: 'f3_e1_sw2', type: 'white', value: 2, shadow: true, x: 208, y: 76 },
            { id: 'f3_e1_sr1', type: 'rose', value: 1, shadow: true, x: 208, y: 114 }
          ];
          TutorialModal.open(StandardTutorialCards.FASE3_ROSE_AND_AURA);
        } else if (step === 2) {
          this.pureEquation = { x: 112, y: 94, expanded: false, shadow: false, broken: false };
          this.shadowEquation = { x: 210, y: 94, expanded: false, shadow: true, broken: false };
          this.pieces = [
            { id: 'f3_e2_qr2', type: 'rose', value: 2, shadow: false, inEquation: 'pure', x: 98, y: 94 },
            { id: 'f3_e2_qr3', type: 'rose', value: 3, shadow: false, inEquation: 'pure', x: 112, y: 94 },
            { id: 'f3_e2_qw2', type: 'white', value: 2, shadow: false, inEquation: 'pure', x: 126, y: 94 },
            { id: 'f3_e2_sr5', type: 'rose', value: 5, shadow: true, inEquation: 'shadow', x: 202, y: 94 },
            { id: 'f3_e2_sw2', type: 'white', value: 2, shadow: true, inEquation: 'shadow', x: 218, y: 94 }
          ];
          this.layoutEquationPieces(this.pureEquation, 'pure');
          this.layoutEquationPieces(this.shadowEquation, 'shadow');
          TutorialModal.open(StandardTutorialCards.FASE3_EQUATION_AURA);
        } else if (step === 3) {
          this.pureEquation = { x: 112, y: 94, expanded: false, shadow: false, broken: false };
          this.shadowEquation = { x: 210, y: 94, expanded: false, shadow: true, broken: false };
          this.pieces = [
            { id: 'f3_e3_qr3', type: 'rose', value: 3, shadow: false, inEquation: 'pure', x: 98, y: 94 },
            { id: 'f3_e3_qw2', type: 'white', value: 2, shadow: false, inEquation: 'pure', x: 112, y: 94 },
            { id: 'f3_e3_op4', type: 'opal', value: 4, shadow: false, inEquation: 'pure', x: 126, y: 94 },
            { id: 'f3_e3_sr2', type: 'rose', value: 2, shadow: true, inEquation: 'shadow', x: 202, y: 94 },
            { id: 'f3_e3_sop1', type: 'opal', value: 1, shadow: true, inEquation: 'shadow', x: 218, y: 94 }
          ];
          this.layoutEquationPieces(this.pureEquation, 'pure');
          this.layoutEquationPieces(this.shadowEquation, 'shadow');
        }
      } else if (level === 4) {
        this.totalSteps = 3;
        if (step === 1) {
          this.pieces = [
            { id: 'f4_e1_qw1', type: 'white', value: 1, shadow: false, x: 84, y: 78 },
            { id: 'f4_e1_qw3', type: 'white', value: 3, shadow: false, x: 120, y: 78 },
            { id: 'f4_e1_qr3', type: 'rose', value: 3, shadow: false, x: 96, y: 114 },
            { id: 'f4_e1_op1', type: 'opal', value: 1, shadow: false, x: 138, y: 114 },
            { id: 'f4_e1_sw3', type: 'white', value: 3, shadow: true, x: 212, y: 78 },
            { id: 'f4_e1_sr3', type: 'rose', value: 3, shadow: true, x: 212, y: 114 }
          ];
        } else if (step === 2) {
          this.pureEquation = { x: 112, y: 98, expanded: false, shadow: false, broken: false };
          this.shadowEquation = { x: 212, y: 98, expanded: false, shadow: true, broken: false };
          this.pieces = [
            { id: 'f4_e2_qr2a', type: 'rose', value: 2, shadow: false, inEquation: 'pure', x: 96, y: 98 },
            { id: 'f4_e2_qr2b', type: 'rose', value: 2, shadow: false, inEquation: 'pure', x: 112, y: 98 },
            { id: 'f4_e2_qw4', type: 'white', value: 4, shadow: false, inEquation: 'pure', x: 128, y: 98 },
            { id: 'f4_e2_op1', type: 'opal', value: 1, shadow: false, x: 112, y: 64 },
            { id: 'f4_e2_sr4', type: 'rose', value: 4, shadow: true, inEquation: 'shadow', x: 204, y: 98 },
            { id: 'f4_e2_sw3', type: 'white', value: 3, shadow: true, inEquation: 'shadow', x: 220, y: 98 }
          ];
          this.layoutEquationPieces(this.pureEquation, 'pure');
          this.layoutEquationPieces(this.shadowEquation, 'shadow');
        } else if (step === 3) {
          this.pureEquation = { x: 112, y: 108, expanded: false, shadow: false, broken: false };
          this.shadowEquation = { x: 212, y: 108, expanded: false, shadow: true, broken: false };
          this.pieces = [
            { id: 'f4_e3_qw4', type: 'white', value: 4, shadow: false, x: 92, y: 68 },
            { id: 'f4_e3_op3', type: 'opal', value: 3, shadow: false, x: 132, y: 68 },
            { id: 'f4_e3_qr1', type: 'rose', value: 1, shadow: false, inEquation: 'pure', x: 104, y: 108 },
            { id: 'f4_e3_qr3', type: 'rose', value: 3, shadow: false, inEquation: 'pure', x: 120, y: 108 },
            { id: 'f4_e3_sw2', type: 'white', value: 2, shadow: true, x: 212, y: 68 },
            { id: 'f4_e3_sr3', type: 'rose', value: 3, shadow: true, inEquation: 'shadow', x: 204, y: 108 },
            { id: 'f4_e3_sop1', type: 'opal', value: 1, shadow: true, inEquation: 'shadow', x: 220, y: 108 }
          ];
          this.layoutEquationPieces(this.pureEquation, 'pure');
          this.layoutEquationPieces(this.shadowEquation, 'shadow');
        }
      }
    },

    spawnShatter(cx, cy, setKey, count = 12) {
      const rnd = mulberry(R(cx * 31 + cy * 17 + this.t * 100));
      for (let i = 0; i < count; i++) {
        const a = rnd() * Math.PI * 2;
        const sp = 55 + rnd() * 65;
        this.shards.push({
          t0: this.t,
          x0: cx,
          y0: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 45,
          floorY: 140 + Math.floor(rnd() * 3),
          set: setKey,
          v: i & 3
        });
      }
    },

    updateOpalProximity(dt) {
      if (this.phase !== 'gameplay' || TutorialModal.isOpen || DialogueBox.isOpen) return;

      for (const p of this.pieces) p.trembling = false;

      const canManipulate = (p) => {
        if (p.broken || p.shadow || p.value <= 0) return false;
        if (p.inEquation === 'pure' && this.pureEquation && !this.pureEquation.expanded) return false;
        return true;
      };

      const opals = this.pieces.filter(p => canManipulate(p) && p.type === 'opal');
      const minTargetValue = (this.currentLevel === 3 && this.currentStep === 3) ? 1 : 2;
      const targets = this.pieces.filter(p => canManipulate(p) && p.type !== 'opal' && (p.value >= minTargetValue));

      let activeOpal = null;
      let activeTarget = null;
      let bestDist = 26;

      for (const op of opals) {
        for (const tg of targets) {
          if (!op.dragging && !tg.dragging) continue;
          const d = Math.hypot(op.x - tg.x, op.y - tg.y);
          if (d <= bestDist) {
            bestDist = d;
            activeOpal = op;
            activeTarget = tg;
          }
        }
      }

      if (!activeOpal || !activeTarget) {
        this.opalDrainTimer = 0;
        return;
      }

      activeOpal.trembling = true;
      activeTarget.trembling = true;
      GameHUD.playSfx('opalPulse');
      this.opalDrainTimer += dt;

      if (this.opalDrainTimer >= this.opalStepInterval) {
        this.opalDrainTimer -= this.opalStepInterval;
        activeTarget.value -= 1;
        activeOpal.value -= 1;
        activeTarget.lastValChangeAt = this.t;
        activeOpal.lastValChangeAt = this.t;
        GameHUD.playSfx('opalSubtract');

        this.spawnShatter(
          (activeOpal.x + activeTarget.x) * 0.5,
          (activeOpal.y + activeTarget.y) * 0.5,
          'opal',
          6
        );

        if (activeTarget.value <= 0) {
          activeTarget.broken = true;
          activeTarget.dragging = false;
          if (this.draggedPiece === activeTarget) this.draggedPiece = null;
        }
        if (activeOpal.value <= 0) {
          activeOpal.broken = true;
          activeOpal.dragging = false;
          if (this.draggedPiece === activeOpal) this.draggedPiece = null;
        }
        if (activeTarget.broken || activeOpal.broken) {
          GameHUD.playSfx('shatter');
          this.clearTrembleStates();
        }
        // Se a subtração da Opala de Fogo igualar o cristal a um sombrio já encostado, dispara anulação imediata
        if (!activeTarget.broken && activeTarget.value > 0) {
          const hit = this.findTouchingCompatibleShadow(activeTarget, activeTarget.x, activeTarget.y);
          if (hit) {
            this.triggerImmediateAnnulment(activeTarget, hit);
            return;
          }
        }
        if (!activeOpal.broken && activeOpal.value > 0) {
          const opalHit = this.findTouchingCompatibleShadow(activeOpal, activeOpal.x, activeOpal.y);
          if (opalHit) {
            this.triggerImmediateAnnulment(activeOpal, opalHit);
            return;
          }
        }
        this.checkEquationSolved();
        this.triggerDefeatIfImpossible();
      }
    },

    checkPieceDrop(dropped) {
      if (!dropped || dropped.broken || dropped.value <= 0) return;

      // Garante limites do cenário e separação sólida ao soltar livremente pelo campo
      const clamped = this.clampCrystalPos(dropped.x, dropped.y);
      dropped.x = clamped.x;
      dropped.y = clamped.y;

      // 1. Verifica fusão entre Quartzos da mesma cor primeiro (dentro ou fora da equação)
      if (dropped.type !== 'opal') {
        for (const other of this.pieces) {
          if (
            other !== dropped &&
            !other.broken &&
            !other.shadow &&
            other.value > 0 &&
            other.type !== 'opal' &&
            Math.hypot(dropped.x - other.x, dropped.y - other.y) <= 22
          ) {
            if (other.type !== dropped.type) {
              dropped.rejectUntil = this.t + 0.35;
              other.rejectUntil = this.t + 0.35;
              GameHUD.playSfx('error');
              this.resolveFreeCrystalCollisions();
              return;
            }
            other.value += dropped.value;
            other.lastValChangeAt = this.t;
            dropped.broken = true;
            GameHUD.playSfx(other.type === 'rose' ? 'roseMerge' : 'quartzMerge');
            this.spawnShatter(other.x, other.y, other.type === 'rose' ? 'rose' : 'pure', 8);
            if (this.pureEquation && !this.pureEquation.broken) {
              this.layoutEquationPieces(this.pureEquation, 'pure');
            }
            const mergedShadowHit = this.findTouchingCompatibleShadow(other, other.x, other.y);
            if (mergedShadowHit) {
              this.triggerImmediateAnnulment(other, mergedShadowHit);
            }
            return;
          }
        }
      }

      // 2. Adição ou retirada intuitiva na Equação Cristalina (funciona mesmo se estiver fechada!)
      if (this.pureEquation && !this.pureEquation.broken) {
        if (this.isInsideEquationAura(this.pureEquation, dropped.x, dropped.y, true)) {
          if (dropped.inEquation !== 'pure') {
            dropped.inEquation = 'pure';
            GameHUD.playSfx('equationInsert');
          }
          this.layoutEquationPieces(this.pureEquation, 'pure');
          return;
        } else if (dropped.inEquation === 'pure') {
          dropped.inEquation = null;
          GameHUD.playSfx('equationRemove');
          this.layoutEquationPieces(this.pureEquation, 'pure');
        }
      }

      this.resolveFreeCrystalCollisions();

      // 3. Salvaguarda caso o cristal solto tenha ficado em contato de borda com sombrio compatível
      if (!dropped.inEquation) {
        const shadowTarget = this.findTouchingCompatibleShadow(dropped, dropped.x, dropped.y);
        if (shadowTarget) {
          this.triggerImmediateAnnulment(dropped, shadowTarget);
        }
      }
    },

    /**
     * Verifica matematicamente se os cristais puros restantes ainda conseguem formar
     * todos os valores exigidos pelos cristais/equações sombrias restantes na etapa.
     */
    isStepStillSolvable() {
      const shadows = this.pieces.filter(p => p.shadow && !p.broken && p.value > 0);
      if (shadows.length === 0) return true;

      const pures = this.pieces.filter(p => !p.shadow && !p.broken && p.value > 0);
      if (pures.length === 0) return false;

      const pureByType = {
        white: pures.filter(p => p.type === 'white').map(p => p.value),
        rose: pures.filter(p => p.type === 'rose').map(p => p.value),
        opal: pures.filter(p => p.type === 'opal').map(p => p.value)
      };
      const shadowByType = {
        white: shadows.filter(p => p.type === 'white').map(p => p.value),
        rose: shadows.filter(p => p.type === 'rose').map(p => p.value),
        opal: shadows.filter(p => p.type === 'opal').map(p => p.value)
      };

      const totalOpal = pureByType.opal.reduce((a, b) => a + b, 0);
      const reqOpalSum = shadowByType.opal.reduce((a, b) => a + b, 0);
      if (shadowByType.opal.length > pureByType.opal.length) return false;
      if (totalOpal < reqOpalSum) return false;

      // Quantidade de unidades que a Opala de Fogo PODE (ou DEVE, se houver Opala Sombria) subtrair
      const maxOpalAvailableForDrain = totalOpal - reqOpalSum;
      const mustDrainFromQuartz = shadowByType.opal.length > 0 ? (totalOpal - reqOpalSum) : 0;
      const minLeave = (this.currentLevel === 3 && this.currentStep === 3) ? 0 : 1;

      let minDrainNeeded = 0;
      let maxDrainCapacity = 0;

      for (const color of ['white', 'rose']) {
        const pList = pureByType[color];
        const sList = shadowByType[color];
        const pSum = pList.reduce((a, b) => a + b, 0);
        const sSum = sList.reduce((a, b) => a + b, 0);

        // Se a soma total de Quartzos dessa cor já ficou menor que o alvo sombrio, é impossível recuperar
        if (pSum < sSum) return false;
        if (sList.length > 0 && pList.length === 0) return false;

        if (sList.length === 0) {
          // Nenhum alvo sombrio dessa cor: os cristais dessa cor podem apenas absorver drenagem da Opala
          maxDrainCapacity += Math.max(0, pSum - minLeave);
        } else {
          // Há alvo sombrio (sSum): verifica o menor dreno necessário a partir de qualquer subconjunto de pList >= sSum
          let bestMinDrain = Infinity;
          const n = pList.length;
          for (let mask = 1; mask < (1 << n); mask++) {
            let subSum = 0;
            for (let i = 0; i < n; i++) {
              if (mask & (1 << i)) subSum += pList[i];
            }
            if (subSum >= sSum) {
              bestMinDrain = Math.min(bestMinDrain, subSum - sSum);
            }
          }
          if (!Number.isFinite(bestMinDrain)) return false;
          minDrainNeeded += bestMinDrain;
          maxDrainCapacity += (pSum - sSum);
        }
      }

      // 1) Se os Quartzos precisam ser reduzidos mais do que a Opala disponível permite -> Derrota!
      if (minDrainNeeded > maxOpalAvailableForDrain) return false;
      // 2) Se a Opala precisa ser reduzida para igualar uma Opala Sombria, mas os Quartzos não têm margem para absorver -> Derrota!
      if (mustDrainFromQuartz > maxDrainCapacity) return false;

      return true;
    },

    triggerDefeatIfImpossible() {
      if (this.phase !== 'gameplay') return;
      const remainingShadows = this.pieces.some(k => k.shadow && !k.broken && k.value > 0);
      if (!remainingShadows) return;

      if (!this.isStepStillSolvable()) {
        if (this.draggedPiece) {
          this.draggedPiece.dragging = false;
          this.draggedPiece = null;
        }
        this.equationPointer = null;
        if (this.pureEquation) {
          this.pureEquation.dropHover = false;
          this.pureEquation.removeHover = false;
        }
        this.clearTrembleStates();
        GameHUD.playSfx('error');
        this.phase = 'defeat_pause';
        this.phaseTime = 0;
      }
    },

    checkIfAllStepTargetsCleared(originX, originY) {
      const remainingShadows = this.pieces.some(k => k.shadow && !k.broken);
      const remainingShadowEq = this.shadowEquation && !this.shadowEquation.broken;
      if (!remainingShadows && !remainingShadowEq) {
        this.onStepCleared(originX, originY);
      }
    },

    checkEquationSolved() {
      if (this.phase !== 'gameplay' || !this.pureEquation || !this.shadowEquation) return;
      if (this.pureEquation.broken || this.shadowEquation.broken) return;

      const pureMembers = this.pieces.filter(p => !p.broken && !p.shadow && p.value > 0 && p.inEquation === 'pure');
      const shadowMembers = this.pieces.filter(p => !p.broken && p.shadow && p.value > 0 && p.inEquation === 'shadow');

      if (pureMembers.length !== shadowMembers.length) return;

      const countsMatch = shadowMembers.every(sm =>
        pureMembers.some(pm => pm.type === sm.type && pm.value === sm.value)
      );
      if (!countsMatch) return;

      this.pureEquation.expanded = false;
      this.layoutEquationPieces(this.pureEquation, 'pure');
      this.layoutEquationPieces(this.shadowEquation, 'shadow');
      GameHUD.playSfx('equationMagnetic');

      this.phase = 'equation_magnetic';
      this.phaseTime = 0;
      this.magneticAnim = {
        pStartX: this.pureEquation.x,
        pStartY: this.pureEquation.y,
        sStartX: this.shadowEquation.x,
        sStartY: this.shadowEquation.y,
        midX: R((this.pureEquation.x + this.shadowEquation.x) * 0.5),
        midY: R((this.pureEquation.y + this.shadowEquation.y) * 0.5)
      };
    },

    onStepCleared(originX, originY) {
      this.targetObstacleDecay = this.currentStep / this.totalSteps;
      this.spawnShatter(this.currentLevel === 4 ? 176 : 264, this.currentLevel === 4 ? 32 : 110, 'rock', 14);

      if (this.currentStep < this.totalSteps) {
        this.phase = 'next_step_pause';
        this.phaseTime = 0;
      } else if (this.currentLevel === 4) {
        this.phase = 'ceiling_crystal_shatter';
        this.phaseTime = 0;
        this.ceilingCrystalFlash = true;
      } else {
        this.waveOrigin = { x: originX, y: originY };
        this.waveActive = true;
        this.waveRadius = 1;
        this.phase = 'step_resolving';
        this.phaseTime = 0;
      }
    },

    openWakeUpDialogue() {
      this.phase = 'cutscene_wake_dlg';
      this.phaseTime = 0;
      this.protag.state = 'talk';
      DialogueBox.open([
        {
          speaker: 'Protagonista',
          portrait: 'portrait_protagonist',
          text: 'O que aconteceu? Onde eu estou?'
        }
      ], () => {
        this.phase = 'cutscene_listen_notes';
        this.phaseTime = 0;
        this.protag.state = 'idle';
      });
    },

    openMysteryVoiceDialogue() {
      this.phase = 'cutscene_voice_dlg';
      this.phaseTime = 0;
      DialogueBox.open([
        {
          speaker: 'Voz Misteriosa',
          portrait: 'portrait_mystery_silhouette',
          text: 'Me salve! Me salve!'
        },
        {
          speaker: 'Protagonista',
          portrait: 'portrait_protagonist',
          text: 'Hã? Escutei alguma coisa? De onde vem essa voz? Onde você está?'
        },
        {
          speaker: 'Voz Misteriosa',
          portrait: 'portrait_mystery_silhouette',
          text: 'Siga a minha voz!'
        },
        {
          speaker: 'Protagonista',
          portrait: 'portrait_protagonist',
          text: 'Mas como? O caminho está bloqueado!'
        },
        {
          speaker: 'Voz Misteriosa',
          portrait: 'portrait_mystery_silhouette',
          text: 'Não se preocupe! Está vendo aqueles cristais?'
        },
        {
          speaker: 'Protagonista',
          portrait: 'portrait_protagonist',
          text: 'S-sim, estou!'
        },
        {
          speaker: 'Voz Misteriosa',
          portrait: 'portrait_mystery_silhouette',
          text: 'Quebre eles!'
        }
      ], () => {
        this.phase = 'tutorial';
        this.setupLevelStep(1, 1);
        TutorialModal.open(StandardTutorialCards.FASE1_INTRO, () => {
          this.phase = 'gameplay';
          this.phaseTime = 0;
        });
      });
    },

    openPostLevelDialogue() {
      this.phase = 'post_dialogue';
      this.phaseTime = 0;

      if (this.currentLevel === 1) {
        global.CrystalApp?.syncProgress?.([1], 2);
        this.protag.state = 'talk';
        DialogueBox.open([
          {
            speaker: 'Protagonista',
            portrait: 'portrait_protagonist',
            text: 'Consegui! Consegui!'
          },
          {
            speaker: 'Voz Misteriosa',
            portrait: 'portrait_mystery_silhouette',
            text: 'Isso! Continue, pequeno gafanhoto! Assim você vai conseguir me tirar daqui!'
          }
        ], () => {
          this.phase = 'celebrate_complete';
          this.phaseTime = 0;
          this.protag.state = 'celebrate';
        });
      } else if (this.currentLevel === 2) {
        global.CrystalApp?.syncProgress?.([1, 2], 3);
        this.protag.state = 'celebrate';
        DialogueBox.open([
          {
            speaker: 'Voz Misteriosa',
            portrait: 'portrait_mystery_silhouette',
            text: 'Isso! Você é muito inteligente! Continue!'
          }
        ], () => {
          this.phase = 'celebrate_complete';
          this.phaseTime = 0;
          this.protag.state = 'celebrate';
        });
      } else if (this.currentLevel === 3) {
        global.CrystalApp?.syncProgress?.([1, 2, 3], 4);
        this.protag.state = 'celebrate';
        DialogueBox.open([
          {
            speaker: 'Voz Misteriosa',
            portrait: 'portrait_mystery_silhouette',
            text: 'Isso, você chegou até onde estou!'
          },
          {
            speaker: 'Protagonista',
            portrait: 'portrait_protagonist',
            text: 'Isso, finalmente! Não posso esperar para saber de onde vem essa voz!'
          }
        ], () => {
          this.phase = 'celebrate_complete';
          this.phaseTime = 0;
          this.protag.state = 'celebrate';
        });
      }
    },

    update(dt) {
      if (GameHUD.paused || GameHUD.settingsOpen) {
        if (this.musicAudio && !this.musicAudio.paused) {
          try { this.musicAudio.pause(); } catch (_) {}
        }
        return;
      }

      if (
        (this.phase === 'musical_part1_shadows' || this.phase === 'musical_part2_bright') &&
        this.musicAudio &&
        this.musicAudio.paused &&
        this.musicalTime < 166.0
      ) {
        try { this.musicAudio.play().catch(() => {}); } catch (_) {}
      }

      this.t += dt;
      this.phaseTime += dt;
      IrisTransition.update(dt);
      DialogueBox.update(dt);

      if (this.obstacleDecay < this.targetObstacleDecay) {
        this.obstacleDecay = Math.min(this.targetObstacleDecay, this.obstacleDecay + dt * 1.4);
      }

      if (this.waveActive) {
        this.waveRadius += dt * 210;
        this.obstacleDecay = Math.max(this.obstacleDecay, clamp(this.waveRadius / 180, 0, 1));
      }

      this.updateOpalProximity(dt);

      if (this.phase === 'musical_vignette') {
        if (this.vignetteCard === 2) {
          this.vignettePracticeTime += dt;
          if (this.vignettePracticeTime >= 7.2) {
            this.vignettePracticeTime = 0;
            CaveRhythmKaraoke.resetPractice();
          }
          CaveRhythmKaraoke.update(dt, this.vignettePracticeTime, this.isHoldingSpace, true);
        }
      } else if (this.phase === 'cutscene_fall') {
        const pt = this.phaseTime;
        if (pt < 1.1) {
          this.protag.state = 'fall';
          const p = clamp(pt / 1.1, 0, 1);
          this.protag.y = R(-10 + p * 138);
          if (p > 0.55) {
            this.cushionAlpha = clamp((p - 0.55) / 0.35, 0, 1);
          }
        } else if (pt < 2.5) {
          this.cushionAlpha = 1;
          this.protag.y = 128;
          this.protag.state = 'recover_stand';
        } else if (pt < 3.4) {
          this.cushionAlpha = clamp(1 - (pt - 2.5) / 0.8, 0, 1);
          this.protag.y = R(128 + ((pt - 2.5) / 0.9) * 14);
          this.protag.state = 'idle';
        } else {
          this.protag.y = 142;
          this.cushionAlpha = 0;
          this.openWakeUpDialogue();
        }
      } else if (this.phase === 'cutscene_listen_notes') {
        if (this.phaseTime >= 1.8) {
          this.openMysteryVoiceDialogue();
        }
      } else if (this.phase === 'cutscene_enter_level') {
        const p = clamp(this.phaseTime / 1.1, 0, 1);
        this.protag.x = R(-8 + p * 50);
        this.protag.state = p < 1 ? 'walk' : 'idle';
        if (this.phaseTime >= 1.2) {
          this.protag.x = 42;
          this.protag.state = 'idle';
          this.phase = 'gameplay';
          this.phaseTime = 0;
          this.setupLevelStep(this.currentLevel, 1);
        }
      } else if (this.phase === 'cutscene_fase4_walk') {
        const p = clamp(this.phaseTime / 1.0, 0, 1);
        this.protag.x = R(-8 + p * 50);
        this.protag.state = p < 1 ? 'walk' : 'shock';
        if (this.phaseTime >= 1.35) {
          this.protag.x = 42;
          this.openFase4IntroDialogue();
        }
      } else if (this.phase === 'equation_magnetic' && this.magneticAnim) {
        const p = easeInOut(clamp(this.phaseTime / 0.75, 0, 1));
        const m = this.magneticAnim;
        this.pureEquation.x = R(m.pStartX + (m.midX - 10 - m.pStartX) * p);
        this.pureEquation.y = R(m.pStartY + (m.midY - m.pStartY) * p);
        this.shadowEquation.x = R(m.sStartX + (m.midX + 10 - m.sStartX) * p);
        this.shadowEquation.y = R(m.sStartY + (m.midY - m.sStartY) * p);
        this.layoutEquationPieces(this.pureEquation, 'pure');
        this.layoutEquationPieces(this.shadowEquation, 'shadow');

        if (this.phaseTime >= 0.78) {
          this.pureEquation.broken = true;
          this.shadowEquation.broken = true;
          for (const pc of this.pieces) {
            if (pc.inEquation === 'pure' || pc.inEquation === 'shadow') {
              pc.broken = true;
            }
          }
          GameHUD.playSfx('equationShatter');
          GameHUD.playSfx('reward');
          this.spawnShatter(m.midX, m.midY, 'rose', 14);
          this.spawnShatter(m.midX, m.midY, 'pure', 12);
          this.spawnShatter(m.midX, m.midY, 'shadow', 14);

          const remainingShadows = this.pieces.some(k => k.shadow && !k.broken);
          if (remainingShadows) {
            this.phase = 'gameplay';
            this.phaseTime = 0;
          } else {
            this.onStepCleared(m.midX, m.midY);
          }
        }
      } else if (this.phase === 'ceiling_crystal_shatter') {
        if (this.phaseTime >= 0.22 && !this.ceilingCrystalBroken) {
          this.ceilingCrystalFlash = false;
          this.ceilingCrystalBroken = true;
          GameHUD.playSfx('ceilingShatter');
          this.spawnShatter(176, 26, 'pure', 24);
          this.spawnShatter(176, 26, 'shadow', 16);
        }
        if (this.phaseTime >= 1.1) {
          this.currentLevel = 5;
          this.openMusicalVignette();
        }
      } else if (this.phase === 'musical_part1_shadows' || this.phase === 'musical_part2_bright') {
        // Relógio contínuo de alta precisão (Precision Audio Clock) com amortecimento de drift e calibração de latência (~45ms)
        if (this.musicAudio && !this.musicAudio.paused && this.musicAudio.currentTime > 0) {
          const nowPerf = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
          if (this._lastAudioTime !== this.musicAudio.currentTime) {
            this._lastAudioTime = this.musicAudio.currentTime;
            this._lastAudioPerf = nowPerf;
          }
          const estimated = this._lastAudioTime + (nowPerf - this._lastAudioPerf) / 1000 - 0.045;
          if (Math.abs(estimated - this.musicalTime) > 0.4) {
            this.musicalTime = Math.max(0, estimated);
          } else {
            this.musicalTime = Math.max(0, this.musicalTime + (estimated - this.musicalTime) * 0.35);
          }
        } else {
          this.musicalTime += dt;
        }
        const mt = this.musicalTime;
        CaveRhythmKaraoke.update(dt, mt, this.isHoldingSpace, false);

        if (mt < 80.0) {
          // PARTE 1 DA MÚSICA (00:00 - 01:20): Coreografia contínua da Ordem pelo palco + Teatro de Sombras Hi-Bit
          this.phase = 'musical_part1_shadows';
          this.ordemActor.state = 'back_silhouette';

          if (mt < 11.0) {
            // [00:00 - 00:11] Intro de Violino: Descida graciosa em espiral de luz (0..6s) + deslize de abertura de asas (6..11s)
            if (mt < 6.0) {
              const pDesc = easeInOut(clamp(mt / 6.0, 0, 1));
              this.ordemActor.x = R(176 - pDesc * 16 + Math.sin(mt * 1.8) * 14);
              this.ordemActor.y = R(32 + pDesc * 108);
              this.ordemActor.flipX = Math.cos(mt * 1.8) < 0;
            } else {
              const pGlide = (mt - 6.0) / 5.0;
              this.ordemActor.x = R(160 + Math.sin(pGlide * Math.PI * 2) * 28);
              this.ordemActor.y = R(140 - Math.sin(pGlide * Math.PI) * 6);
              this.ordemActor.flipX = Math.cos(pGlide * Math.PI * 2) < 0;
            }
          } else if (mt < 22.0) {
            // [00:11 - 00:22] "Era uma vez um reino...": Caminhada/flutuação suave de um lado ao outro apontando para o Reino e as 4 Gemas
            const sweep = Math.sin((mt - 11.0) * 0.85);
            this.ordemActor.x = R(160 + sweep * 42);
            this.ordemActor.y = R(140 - Math.abs(Math.cos((mt - 11.0) * 1.7)) * 4);
            this.ordemActor.flipX = Math.cos((mt - 11.0) * 0.85) < 0;
          } else if (mt < 30.0) {
            // [00:22 - 00:30] "Cada cristal tinha sua rainha...": Desliza apresentando as 4 rainhas e flutua sob sua própria efígie real
            if (mt < 26.0) {
              const pQ = (mt - 22.0) / 4.0;
              this.ordemActor.x = R(112 + pQ * 92);
              this.ordemActor.y = R(140 - Math.sin(pQ * Math.PI * 2) * 3);
              this.ordemActor.flipX = false;
            } else {
              const pH = (mt - 26.0) / 4.0;
              this.ordemActor.x = R(204 - easeInOut(pH) * 66);
              this.ordemActor.y = R(134 - Math.sin(pH * Math.PI) * 7);
              this.ordemActor.flipX = true;
            }
          } else if (mt < 45.0) {
            // [00:30 - 00:44] "Mas com o tempo a fumaça... / grito de alerta": Movimento urgente de um lado ao outro alertando sobre o perigo
            const urg = (mt - 30.0) * 1.45;
            this.ordemActor.x = R(160 + Math.sin(urg) * 46);
            this.ordemActor.y = R(140 - Math.abs(Math.sin(urg * 2)) * 5);
            this.ordemActor.flipX = Math.cos(urg) < 0;
          } else if (mt < 63.5) {
            // [00:45 - 01:03] "Na sombra gerada por mãos tão cruéis...": Levitação dramática tentando resistir às garras até o quase-blecaute
            if (mt < 59.5) {
              const pTrap = (mt - 45.0) / 14.5;
              this.ordemActor.x = R(160 + Math.sin(pTrap * Math.PI * 3) * 34);
              this.ordemActor.y = R(140 - Math.sin(pTrap * Math.PI) * 14);
              this.ordemActor.flipX = Math.cos(pTrap * Math.PI * 3) < 0;
            } else {
              // Pausa dramática em descida lenta durante "E assim chegamos ao fim..."
              const pEnd = clamp((mt - 59.5) / 4.0, 0, 1);
              this.ordemActor.x = R(160 + (1 - pEnd) * 12);
              this.ordemActor.y = R(128 + easeInOut(pEnd) * 14);
              this.ordemActor.flipX = false;
            }
          } else {
            // [01:04 - 01:20] Solo de Violino: Giro e dança aérea expressiva em figura-8 pelo palco acompanhando o crescendo
            const vTime = mt - 63.5;
            this.ordemActor.x = R(160 + Math.sin(vTime * 1.55) * 52);
            this.ordemActor.y = R(132 - Math.abs(Math.sin(vTime * 3.1)) * 16);
            // Giro expressivo nos picos do violino
            this.ordemActor.flipX = (Math.floor(vTime * 2.5) & 1) === 1;
          }
        } else if (mt < 166.5) {
          // PARTE 2 DA MÚSICA (01:20 - 02:46): Luz da manhã, vinheta de nuvem em 3 atos, dança de cristais, sapatinho, florescer e panorama Owlboy!
          this.phase = 'musical_part2_bright';

          if (mt < 84.5) {
            // [01:20 - 01:24.5] "Mas...": Ordem voa em arco luminoso até o Protagonista enquanto os animais de pedra cantam o coro
            const p = easeInOut(clamp((mt - 80.0) / 4.5, 0, 1));
            this.ordemActor.x = R(160 - p * 54);
            this.ordemActor.y = R(142 - Math.sin(p * Math.PI) * 16);
            this.ordemActor.state = p < 0.85 ? 'walk' : 'sing';
            this.ordemActor.flipX = true;
            this.protag.x = 64;
            this.protag.y = 142;
            this.protag.state = 'idle';
          } else if (mt < 105.8) {
            // [01:25 - 01:45.8] Vinheta de nuvem com a história da criança (superfície -> caverna escura -> queda no calabouço)
            const sway = (mt - 84.5) * 1.15;
            this.ordemActor.x = R(106 + Math.sin(sway) * 14);
            this.ordemActor.y = R(140 - Math.abs(Math.cos(sway * 1.5)) * 4);
            this.ordemActor.state = 'sing';
            this.ordemActor.flipX = Math.cos(sway) < 0;
            this.protag.x = 62;
            this.protag.y = 142;
            this.protag.state = mt >= 101.2 ? 'shock' : 'idle';
          } else if (mt < 115.3) {
            // [01:46 - 01:55.3] "Contudo, respira fundo... Um, dois, três e... Vamos lá!": Ordem circula o Protagonista animada
            const cir = (mt - 105.8) * 2.1;
            this.ordemActor.x = R(92 + Math.sin(cir) * 32);
            this.ordemActor.y = R(136 - Math.abs(Math.cos(cir)) * 10);
            this.ordemActor.state = 'sing';
            this.ordemActor.flipX = Math.cos(cir) < 0;
            this.protag.x = 64;
            this.protag.y = 142;
            this.protag.state = mt >= 112.6 ? 'celebrate' : 'idle';
          } else if (mt < 125.5) {
            // [01:56 - 02:05.5] "Olha só que novidade, eu tô livre, move o cristal aqui... abriu-se o caminho!"
            if (this.cloudPopTime < 0) this.cloudPopTime = mt;
            const dTime = mt - 115.3;
            this.ordemActor.x = R(142 + Math.sin(dTime * 1.5) * 38);
            this.ordemActor.y = R(128 - Math.abs(Math.sin(dTime * 3.0)) * 12);
            this.ordemActor.state = 'sing';
            this.ordemActor.flipX = Math.cos(dTime * 1.5) < 0;
            this.protag.x = R(68 + Math.sin(dTime * 2.0) * 8);
            this.protag.y = 142;
            this.protag.state = (Math.floor(mt * 2) & 1) ? 'celebrate' : 'walk';
            this.obstacleDecay = clamp((mt - 120.0) / 5.0, 0, 1);
          } else if (mt < 129.8) {
            // [02:06 - 02:09.8] "Abre o sapatinho! Vai no sapatinho!": Passos ritmados junto ao tambor mágico
            const stepT = (mt - 125.5) * 7.5;
            this.ordemActor.x = R(132 + Math.sin(stepT) * 12);
            this.ordemActor.y = R(142 - Math.abs(Math.sin(stepT * 2)) * 5);
            this.ordemActor.state = 'sing';
            this.ordemActor.flipX = Math.cos(stepT) < 0;
            this.protag.x = R(74 + Math.sin(stepT) * 10);
            this.protag.y = R(142 - Math.abs(Math.cos(stepT * 2)) * 4);
            this.protag.state = (Math.floor(stepT) & 1) ? 'celebrate' : 'walk';
          } else if (mt < 143.8) {
            // [02:09.8 - 02:23.8] "Pequenos passos fazendo a terra inteira florescer! ... Chegamos ao topo de novo!"
            if (mt < 135.5) {
              const flP = (mt - 129.8) / 5.7;
              this.ordemActor.x = R(96 + Math.sin(flP * Math.PI * 2) * 54);
              this.ordemActor.y = R(138 - Math.abs(Math.cos(flP * Math.PI * 4)) * 6);
              this.ordemActor.flipX = Math.cos(flP * Math.PI * 2) < 0;
            } else {
              // Sobe flutuando em destaque no refrão "Eu sou a Ordem... Chegamos ao topo de novo!"
              const chP = clamp((mt - 135.5) / 8.3, 0, 1);
              this.ordemActor.x = R(160 + Math.sin(chP * Math.PI * 2) * 28);
              this.ordemActor.y = R(124 - Math.sin(chP * Math.PI) * 16);
              this.ordemActor.flipX = Math.cos(chP * Math.PI * 2) < 0;
            }
            this.ordemActor.state = 'sing';
            this.protag.x = 76;
            this.protag.y = 142;
            this.protag.state = 'celebrate';
          } else if (mt < 153.5) {
            // [02:24 - 02:33.5] "Move pra cá! Move pra lá! Que o dom da Ordem faz tudo brilhar! Sem bagunça, sem fumaça!"
            if (mt < 148.8) {
              const isLeft = mt < 146.2;
              const shiftX = isLeft
                ? -easeInOut(clamp((mt - 143.8) / 1.8, 0, 1)) * 28
                : -28 + easeInOut(clamp((mt - 146.2) / 2.0, 0, 1)) * 56;
              this.ordemActor.x = R(156 + shiftX);
              this.ordemActor.y = R(134 - Math.abs(Math.sin((mt - 143.8) * 5)) * 5);
              this.ordemActor.flipX = isLeft;
              this.protag.x = R(84 + shiftX * 0.75);
              this.protag.y = 142;
              this.protag.state = 'walk';
            } else {
              const cleanP = (mt - 148.8) / 4.7;
              this.ordemActor.x = R(120 + cleanP * 68);
              this.ordemActor.y = R(132 - Math.sin(cleanP * Math.PI) * 10);
              this.ordemActor.flipX = false;
              this.protag.x = 84;
              this.protag.y = 142;
              this.protag.state = 'celebrate';
            }
            this.ordemActor.state = 'sing';
          } else {
            // [02:34 - 02:46.5] "O reino vai renascer! A Ordem voltou!": Celebração diante do Panorama da Floresta
            const finT = mt - 153.5;
            this.ordemActor.x = R(148 + Math.sin(finT * 2.0) * 18);
            this.ordemActor.y = R(136 - Math.abs(Math.sin(finT * 3.0)) * 8);
            this.ordemActor.state = 'sing';
            this.ordemActor.flipX = false;
            this.protag.x = R(84 + Math.sin(finT * 2.0) * 8);
            this.protag.y = 142;
            this.protag.state = (Math.floor(mt * 2) & 1) ? 'celebrate' : 'idle';
          }
        } else {
          this.finishMusicalShow();
        }
      } else if (this.phase === 'walk_to_forest_exit') {
        // Personagens entram na entrada para a Floresta -> Iris Out (círculo se fechando até ficar tudo preto)
        const p = clamp(this.phaseTime / 1.4, 0, 1);
        this.protag.x = R(84 + p * 165);
        this.ordemActor.x = R(148 + p * 115);
        if (this.phaseTime >= 0.45 && !IrisTransition.active && !this._forestExitIrisStarted) {
          this._forestExitIrisStarted = true;
          IrisTransition.start('out', 250, 118, 0.85, () => {
            this.enterJourneyMapWithIrisIn(true);
          });
        }
      } else if (this.phase === 'next_step_pause') {
        if (this.phaseTime >= 0.65) {
          this.phase = 'gameplay';
          this.phaseTime = 0;
          this.setupLevelStep(this.currentLevel, this.currentStep + 1);
        }
      } else if (this.phase === 'step_resolving') {
        if (this.phaseTime >= 1.35) {
          this.obstacleDecay = 1;
          this.openPostLevelDialogue();
        }
      } else if (this.phase === 'defeat_pause') {
        this.protag.state = 'shock';
        if (this.phaseTime >= 0.65) {
          this.phase = 'game_over';
          this.phaseTime = 0;
          GameHUD.playSfx('gameOver');
        }
      }
    },

    composeBackground() {
      // Na Parte 1 da música, tudo fica escuro cinematicamente mantendo apenas os cristais do ambiente acesos!
      if (this.phase === 'musical_part1_shadows') {
        BG_U32.set(BG_CINEMATIC);
        return;
      }
      // Na Parte 2 da música e pós-música, tudo fica claro e animado!
      if (
        this.phase === 'musical_part2_bright' ||
        this.phase === 'post_musical_ordem_dlg' ||
        this.phase === 'world_celebrate_complete' ||
        this.phase === 'walk_to_forest_exit'
      ) {
        BG_U32.set(BG_LIT);
        return;
      }
      if (!this.waveActive || this.waveRadius <= 0) {
        BG_U32.set(BG_DARK);
        return;
      }
      if (this.waveRadius >= 360) {
        BG_U32.set(BG_LIT);
        return;
      }
      const ox = this.waveOrigin.x * 2, oy = this.waveOrigin.y * 2;
      const rad = Math.floor(this.waveRadius * 48) / 24;
      const rim1 = c32('#c8fbff'), rim2 = c32('#ffffff');
      for (let y = 0, i = 0; y < HH; y++) {
        for (let x = 0; x < HW; x++, i++) {
          const d = Math.hypot(x - ox, y - oy) + bay(x, y) * 1.2;
          if (d < rad - 6) BG_U32[i] = BG_LIT[i];
          else if (d < rad) BG_U32[i] = ((x + y) & 1) ? rim1 : BG_LIT[i];
          else if (d < rad + 4 && bay(x, y) < 4) BG_U32[i] = rim2;
          else BG_U32[i] = BG_DARK[i];
        }
      }
    },

    drawShards(ctx) {
      const G = 260;
      for (const s of this.shards) {
        const tau = this.t - s.t0;
        if (tau < 0 || tau > 1.4) continue;
        const x = s.x0 + s.vx * tau;
        const y = Math.min(s.floorY, s.y0 + s.vy * tau + 0.5 * G * tau * tau);
        const frame = (s.v + Math.floor(tau * 12)) & 3;
        const sprSet = SHARD_SPR[s.set] || SHARD_SPR.pure;
        ctx.drawImage(sprSet[frame], R(x), R(y));
      }
    },

    drawCompletionOverlay(ctx, isWorldFinale = false) {
      // Card de conclusão em Pergaminho Estilo Owlboy, perfeitamente centralizado e enquadrado
      const bx = 42, by = 28, bw = 236, bh = 108;
      drawParchmentBox(ctx, bx, by, bw, bh, { headerH: 17, headerBg: '#163b6c' });

      if (isWorldFinale) {
        const f12 = Math.floor(this.t * SPRITE_FPS);
        for (let k = 0; k < 8; k++) {
          const fx = 24 + ((k * 37) % 272);
          const fy = 24 + ((f12 * 3 + k * 19) % 110);
          drawStar(ctx, fx, fy, (k & 1) ? 3 : 2, '#ffffff', (k % 3 === 0) ? '#f2cc6b' : (k % 3 === 1 ? '#68b8c4' : '#e396b1'));
        }
        drawPixelTextCentered(ctx, 'Mundo 1 Restaurado!', bx + bw / 2, by + 8, '#ffffff', '#000000', bw - 16, 9);
        drawPixelTextCentered(ctx, 'A Ordem despertou a Caverna!', bx + bw / 2, by + 28, '#ffea31', '#000000', bw - 20, 10);
        drawPixelTextCentered(ctx, 'Rumo ao Mundo da Floresta!', bx + bw / 2, by + 41, '#92e8ff', '#000000', bw - 20, 10);
      } else {
        drawPixelTextCentered(ctx, `Fase ${this.currentLevel} Concluída!`, bx + bw / 2, by + 8, '#ffffff', '#000000', bw - 16, 9);
        drawPixelTextCentered(ctx, 'O caminho da Caverna se abriu!', bx + bw / 2, by + 32, '#ffea31', '#000000', bw - 20, 10);
      }

      const starY = by + 62;
      for (let i = 0; i < 3; i++) {
        drawStar(ctx, bx + bw / 2 - 20 + i * 20, starY, 4, '#ffffff', '#e3b454');
      }

      const b = this.completeBtnRect;
      ctx.fillStyle = '#14111c';
      ctx.fillRect(b.x - 1, b.y - 1, b.w + 2, b.h + 2);
      ctx.fillStyle = '#2b689c';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = '#92e8ff';
      ctx.fillRect(b.x, b.y, b.w, 1);
      ctx.fillRect(b.x, b.y + b.h - 1, b.w, 1);
      drawPixelTextCentered(ctx, isWorldFinale ? 'Ir à Floresta >' : 'Continuar >', b.x + b.w / 2, b.y + 4, '#ffffff', '#000000', b.w - 6, 9);
    },

    drawGameOverOverlay(ctx) {
      ctx.fillStyle = 'rgba(10, 8, 6, 0.58)';
      ctx.fillRect(0, 20, W, H - 20);

      const bx = 34, by = 28, bw = 252, bh = 116;
      drawParchmentBox(ctx, bx, by, bw, bh, { headerH: 17, headerBg: '#59221c' });
      drawPixelTextCentered(ctx, 'Equilíbrio Perdido!', bx + bw / 2, by + 8, '#ffffff', '#000000', bw - 16, 9);

      drawPixelTextCentered(
        ctx,
        'Os cristais perderam o equilíbrio e não podem mais formar o valor exigido nesta etapa.',
        bx + bw / 2,
        by + 28,
        '#ffea31',
        '#000000',
        bw - 24,
        10
      );
      drawPixelTextCentered(
        ctx,
        'Recomece a fase para tentar novamente!',
        bx + bw / 2,
        by + 64,
        '#92e8ff',
        '#000000',
        bw - 24,
        9
      );

      // Botão destacado "Reiniciar Fase"
      const b = this.gameOverBtnRect;
      const pulse = (Math.floor(this.t * 6) & 1) === 0;
      ctx.fillStyle = '#14111c';
      ctx.fillRect(b.x - 1, b.y - 1, b.w + 2, b.h + 2);
      ctx.fillStyle = pulse ? '#2b8bc2' : '#1b3a69';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = '#92e8ff';
      ctx.fillRect(b.x, b.y, b.w, 1);
      ctx.fillRect(b.x, b.y + b.h - 1, b.w, 1);
      drawPixelTextCentered(ctx, '↻ Reiniciar Fase', b.x + b.w / 2, b.y + 4, '#ffffff', '#000000', b.w - 8, 9);
    },

    renderMusicalElements(ctx, tq) {
      const mt = this.musicalTime;

      if (this.phase === 'musical_part1_shadows') {
        // Parte 1 (00:00 - 01:20): Feixes volumétricos, Teatro de Sombras Hi-Bit na parede e notas acompanhando a Ordem em movimento
        drawShadowPlayOnWall(ctx, mt, tq, this.ordemActor.x, this.ordemActor.y);
        ActorAnimator.drawMusicNotesLoop(ctx, this.ordemActor.x, this.ordemActor.y - 24, tq, {
          count: 4,
          dirX: this.ordemActor.flipX ? -16 : 16,
          dirY: -20,
          period: 1.6
        });
      } else if (this.phase === 'musical_part2_bright') {
        const ox = this.ordemActor.x, oy = this.ordemActor.y;

        // 01:20+: Luz quente da manhã iluminando rochas, musgo e neblina
        drawMorningSunbeams(ctx, mt, tq);

        // Panorama Owlboy da Floresta abrindo pela passagem direita (02:34 - 02:46)
        if (mt >= 153.5) {
          drawWorldPanorama(ctx, (mt - 153.5) / 6.0, tq);
        }

        // Vinheta de nuvem pictórica (01:24.5 - 01:55.3) + estouro em "Vamos lá!"
        if (mt >= 84.5 && mt < 115.3) {
          drawCloudThoughtBubble(ctx, mt, tq, ox, oy);
        } else if (this.cloudPopTime > 0 && mt - this.cloudPopTime <= 0.85) {
          drawCloudPopEffect(ctx, mt - this.cloudPopTime);
        }

        // Grama viva e flores brotando por onde a Ordem passa (02:09.8+)
        drawCaveBloomingFlora(ctx, mt, tq);

        // Dança telecinética de cristais com bolinhas de unidade (01:55.5 - 02:05.5)
        if (mt >= 115.5 && mt < 125.5) {
          drawTelekineticCrystalDance(ctx, mt, tq, ox, oy);
        }

        // Tambor mágico do "Sapatinho" (02:05.5 - 02:09.8)
        if (mt >= 125.5 && mt < 129.8) {
          drawCrystalDrumMagic(ctx, 104, 116, tq);
        }

        // "Move pra cá! Move pra lá! Sem bagunça, sem fumaça!" (02:23.8 - 02:33.8)
        drawMovePraCaPraLaShow(ctx, mt, tq);

        // Animais de Pedra com Cristais Neon cantando as vozes secundárias / coro
        const extraVoice = isSecondaryVoiceActive(mt);
        ActorAnimator.drawStoneNeonAnimal(ctx, 'cyan', extraVoice, 24, 142, tq, false);
        ActorAnimator.drawStoneNeonAnimal(ctx, 'magenta', extraVoice, 206, 142, tq, true);
        if (mt < 153.5) {
          ActorAnimator.drawStoneNeonAnimal(ctx, 'gold', extraVoice, 296, 142, tq, true);
        }

        // Notas musicais da voz principal da Ordem acompanhando sua direção
        ActorAnimator.drawMusicNotesLoop(ctx, ox, oy - 24, tq, {
          count: 4,
          dirX: this.ordemActor.flipX ? -14 : 14,
          dirY: -20,
          period: 1.5
        });
      }

      // Mecânica interativa de Ritmo & Karaokê (Bolinha saltitante, círculo de tempo, julgamentos e segurar no espaço)
      CaveRhythmKaraoke.render(ctx, mt, false);
    },

    render() {
      const ctx = this.ctx;
      const tq = Math.floor(this.t * SIM_HZ) / SIM_HZ;
      ctx.imageSmoothingEnabled = false;

      // Se já entrou no Mapa, desenha apenas o Iris In abrindo sobre o Mapa
      if (this.phase === 'map_iris_in' || this.phase === 'map_active') {
        ctx.setTransform(2, 0, 0, 2, 0, 0);
        ctx.clearRect(0, 0, W, H);
        IrisTransition.render(ctx);
        return;
      }

      this.composeBackground();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.putImageData(BG_IMAGE, 0, 0);
      ctx.setTransform(2, 0, 0, 2, 0, 0);

      // Na saída para a Floresta, mantém o panorama aberto à direita
      if (this.phase === 'post_musical_ordem_dlg' || this.phase === 'world_celebrate_complete' || this.phase === 'walk_to_forest_exit') {
        drawWorldPanorama(ctx, 1.0, tq);
        ActorAnimator.drawStoneNeonAnimal(ctx, 'cyan', this.phase === 'world_celebrate_complete', 24, 142, tq, false);
        ActorAnimator.drawStoneNeonAnimal(ctx, 'magenta', this.phase === 'world_celebrate_complete', 294, 142, tq, true);
      } else if (this.currentLevel === 4) {
        drawGiantCeilingCrystal(
          ctx,
          this.obstacleDecay,
          this.ceilingCrystalFlash,
          this.ceilingCrystalBroken,
          tq
        );
        if (!this.ceilingCrystalBroken) {
          ActorAnimator.drawMusicNotesLoop(ctx, 176, 46, tq, {
            count: 4,
            dirX: -24,
            dirY: 18,
            period: 2.0
          });
        }
      } else {
        drawPathObstacle(ctx, this.obstacleDecay, tq);
      }

      if (this.cushionAlpha > 0) {
        drawMagicCushion(ctx, 74, 127, this.cushionAlpha, tq);
      }

      if (
        this.currentLevel < 4 &&
        (this.phase === 'cutscene_listen_notes' ||
          this.phase === 'cutscene_voice_dlg' ||
          this.phase === 'gameplay' ||
          this.phase === 'equation_magnetic' ||
          this.phase === 'next_step_pause')
      ) {
        ActorAnimator.drawMusicNotesLoop(ctx, 312, 92, tq, {
          count: 4,
          dirX: -28,
          dirY: -16,
          period: 2.2
        });
      }

      // Renderiza elementos da Parte Musical (Show de Sombras, Nuvem, Animais de Pedra Neon, Tambor de Cristal e Panorama)
      if (this.phase === 'musical_part1_shadows' || this.phase === 'musical_part2_bright') {
        this.renderMusicalElements(ctx, tq);
      }

      // Protagonista Hi-Bit (40x54 pixels físicos)
      if (this.phase === 'cutscene_fall' && this.protag.state === 'recover_stand') {
        const recElapsed = Math.max(0, this.phaseTime - 1.1);
        const subFrame = recElapsed < 0.85 ? 0 : recElapsed < 1.15 ? 2 : 3;
        const spr = E.SpriteBank.protagonist.recover_stand[subFrame];
        const scale = spr.hib ? 0.5 : 1;
        const sw = spr.width * scale, sh = spr.height * scale;
        ctx.drawImage(spr, RH(this.protag.x - sw / 2), RH(this.protag.y - sh), sw, sh);
      } else {
        ActorAnimator.drawActor(ctx, 'protagonist', this.protag.state, this.protag.x, this.protag.y, tq);
      }

      // Personagem liberta ("Ordem") usando os estados em loop do SpriteBank e flipX coreografado
      if (this.ordemActor.visible) {
        ActorAnimator.drawActor(ctx, 'ordem', this.ordemActor.state, this.ordemActor.x, this.ordemActor.y, tq, {
          flipX: Boolean(this.ordemActor.flipX)
        });
      }

      if (
        this.phase === 'tutorial' ||
        this.phase === 'gameplay' ||
        this.phase === 'equation_magnetic' ||
        this.phase === 'next_step_pause' ||
        this.phase === 'step_resolving' ||
        this.phase === 'defeat_pause' ||
        this.phase === 'game_over'
      ) {
        if (this.phase === 'equation_magnetic' && this.pureEquation && this.shadowEquation) {
          const f12 = Math.floor(tq * 12);
          for (let x = this.pureEquation.x; x <= this.shadowEquation.x; x += 3) {
            P1(ctx, x, this.pureEquation.y + ((x + f12) & 1 ? -1 : 1), '#ffffff');
          }
        }

        const pureEqMembers = this.pieces.filter(p => !p.broken && p.value > 0 && p.inEquation === 'pure');
        const shadowEqMembers = this.pieces.filter(p => !p.broken && p.value > 0 && p.inEquation === 'shadow');
        drawEquationAura(ctx, this.pureEquation, tq, pureEqMembers);
        drawEquationAura(ctx, this.shadowEquation, tq, shadowEqMembers);

        for (const p of this.pieces) {
          drawCrystalPiece(ctx, p, tq);
        }
      }

      this.drawShards(ctx);

      // HUD Superior Completo (Título da Fase, Etapa + Botões de Pause, Recomeçar, Mudo e Configurações)
      const inMusical = this.phase === 'musical_part1_shadows' || this.phase === 'musical_part2_bright';
      GameHUD.renderTopBar(ctx, this.currentLevel, this.currentStep, this.totalSteps, inMusical);

      // Botão Pular >> no topo durante o show musical, enquadrado ao lado dos 4 botões do HUD
      if (inMusical) {
        const sb = this.skipMusicalBtnRect;
        ctx.fillStyle = '#3d2b24';
        ctx.fillRect(sb.x, sb.y, sb.w, sb.h);
        ctx.fillStyle = '#d9a85b';
        ctx.fillRect(sb.x, sb.y, sb.w, 1);
        ctx.fillRect(sb.x, sb.y + sb.h - 1, sb.w, 1);
        ctx.fillRect(sb.x, sb.y, 1, sb.h);
        ctx.fillRect(sb.x + sb.w - 1, sb.y, 1, sb.h);
        drawPixelTextCentered(ctx, 'Pular >>', sb.x + sb.w / 2, sb.y + 4, '#f7e2b8', '#120d0b', sb.w - 4, 8);
      }

      if (this.phase === 'musical_vignette') {
        this.renderMusicalVignette(ctx, tq);
      }

      DialogueBox.render(ctx, tq);
      TutorialModal.render(ctx, tq);

      if (this.phase === 'celebrate_complete') {
        this.drawCompletionOverlay(ctx, false);
      } else if (this.phase === 'world_celebrate_complete') {
        this.drawCompletionOverlay(ctx, true);
      } else if (this.phase === 'game_over') {
        this.drawGameOverOverlay(ctx);
      }

      // Modais interativos de Pause e Configurações sobre a cena
      GameHUD.renderModals(ctx);

      IrisTransition.render(ctx);
    },

    loop(now) {
      this._rafId = null;
      if (!this.running) return;
      this._inLoop = true;
      const currentNow = typeof now === 'number' && Number.isFinite(now) ? now : (typeof performance !== 'undefined' ? performance.now() : Date.now());
      const prevNow = typeof this.lastNow === 'number' && Number.isFinite(this.lastNow) ? this.lastNow : currentNow;
      const dt = Math.min(0.1, Math.max(0.001, (currentNow - prevNow) / 1000));
      this.lastNow = currentNow;
      this.update(dt);
      this.render();
      this._inLoop = false;
      if (this.running) {
        this._rafId = requestAnimationFrame((n) => this.loop(n));
      }
    }
  };

  function hookPlayButton() {
    ActorAnimator.adaptMapFairyIcon();
    if (global.CrystalApp) return;
    const newGameBtn = document.getElementById('newGameButton');
    if (newGameBtn && !newGameBtn._truePixelHooked) {
      newGameBtn._truePixelHooked = true;
      newGameBtn.addEventListener('click', (ev) => {
        if (global.CrystalApp) return;
        ev.stopImmediatePropagation();
        ev.preventDefault();
        if (global.CrystalAssetsReady === false) return;
        CaveChapter1.startCutsceneAndFase1();
      }, true);
    }
    const continueBtn = document.getElementById('continueButton');
    if (continueBtn && !continueBtn._truePixelHooked) {
      continueBtn._truePixelHooked = true;
      continueBtn.addEventListener('click', (ev) => {
        if (global.CrystalApp) return;
        ev.stopImmediatePropagation();
        ev.preventDefault();
        if (global.CrystalAssetsReady === false) return;
        CaveChapter1.enterJourneyMapWithIrisIn(false);
      }, true);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hookPlayButton);
  } else {
    hookPlayButton();
  }

  CaveChapter1.CaveRhythmKaraoke = CaveRhythmKaraoke;
  global.CaveChapter1 = CaveChapter1;
})(typeof window !== 'undefined' ? window : globalThis);
