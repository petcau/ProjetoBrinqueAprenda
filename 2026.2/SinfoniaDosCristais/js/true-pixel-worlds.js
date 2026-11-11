'use strict';
/**
 * MUNDOS 2, 3, 4 E PORTÃO FINAL (NÓS 6..21) — CONTINUAÇÃO EM TRUE PIXEL ART (640x360 / 320x180)
 * Mantém 100% da temática, direção de arte Hi-Bit estilo Owlboy, HUD, Caixa de Diálogo Global
 * (com os 4 encaixes de gemas no topo e retratos somente de rosto em losango), Tutorial Paginado,
 * mecânicas táteis de cristais, Show Musical em 2 atos (Teatro de Sombras + Nuvem + Animais de Pedra Neon
 * + Tambor Mágico + Panorama) e Transição Iris Out/In para o Mapa de `CaveChapter1`.
 */
(function (global) {
  const E = global.TruePixelEngine;
  if (!E) return;

  const {
    W, H, SPRITE_FPS, SIM_HZ, bay, mulberry, c32, fromMap, silhouette,
    P1, drawRing, drawStar, measurePixelText, drawPixelChar, drawPixelText, drawPixelTextCentered, drawParchmentBox,
    ActorAnimator, IrisTransition, DialogueBox, TutorialModal, GameHUD, StandardTutorialCards
  } = E;

  const R = Math.round;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeInOut = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
  const HW = 640, HH = 360;
  const RH = (v) => Math.round(v * 2) * 0.5;

  // ============================================================================
  // 1. SPRITES HI-BIT DE CRISTAIS, ALTAR DE ESMERALDA E FRAGMENTOS (34x42 FÍSICOS)
  // ============================================================================
  function buildHiBitWorldGem(shape, pal) {
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
      let maxHalfW;
      if (shape === 'opal') {
        maxHalfW = dy < 0 ? (1 - Math.pow(ny, 0.82)) * 14.5 : (1 - Math.pow(ny, 1.35)) * 14.5;
      } else if (shape === 'aqua') {
        // Gota cristalina lapidada para Água-Marinha
        maxHalfW = dy < 0 ? (1 - Math.pow(ny, 0.72)) * 12.2 : (1 - Math.pow(ny, 1.65)) * 14.6;
      } else if (shape === 'citrine') {
        // Prisma solar hexagonal para Citrino
        maxHalfW = ny < 0.52 ? 13.8 - ny * 2.4 : (1 - (ny - 0.52) / 0.48) * 12.5;
      } else {
        maxHalfW = ny < 0.36 ? 13.5 - ny * 4.5 : (1 - (ny - 0.36) / 0.64) * 11.8;
      }

      const hw = Math.round(maxHalfW);
      if (hw <= 0) continue;

      for (let px = Math.round(cx - hw); px <= Math.round(cx + hw); px++) {
        const dx = (px - cx) / Math.max(1, hw);
        const adx = Math.abs(dx);
        let col = pal.M;

        if (adx > 0.88 || ny > 0.91) {
          col = (dx < 0 && dy < 0) ? pal.L : pal.K;
        } else if (shape === 'opal') {
          const coreD = Math.hypot(dx * 1.15, (dy - 0.06) * 1.25);
          if (coreD < 0.32) col = pal.W;
          else if (coreD < 0.56) col = ((px + py) & 1) ? pal.H : pal.W;
          else if (coreD < 0.78) col = (dx < 0 || ((px + py) & 1)) ? pal.L : pal.M;
          else col = dx < 0 ? pal.M : pal.D;
        } else {
          const inTable = adx < 0.46 && ny < 0.48;
          if (inTable) {
            if (dx + dy < -0.32) col = pal.W;
            else if (dx + dy < 0.08) col = ((px + py) & 1) ? pal.H : pal.L;
            else if (dx + dy < 0.42) col = pal.L;
            else col = pal.M;
          } else {
            const ridge = Math.abs(adx - 0.46) < 0.09 || Math.abs(ny - 0.48) < 0.06;
            if (ridge && dx < 0.25 && dy < 0.25) col = pal.H;
            else if (dx < -0.35 && dy < 0.25) col = ((px + py) & 1) ? pal.W : pal.H;
            else if (dx < 0 && dy < 0) col = pal.L;
            else if (dx > 0.32 && dy > 0.15) col = ((px + py) & 1) ? pal.K : pal.D;
            else if (dx > 0 || dy > 0.35) col = pal.D;
            else col = pal.M;
          }
        }
        put(px, py, col);
      }
    }

    put(11, 9, '#ffffff');
    put(12, 9, '#ffffff');
    put(11, 10, '#ffffff');
    put(10, 9, pal.W);
    put(11, 8, pal.W);
    return c;
  }

  const GEM_SPRITES = {
    white_pure: buildHiBitWorldGem('quartz', {
      W: '#ffffff', H: '#e3f4f7', L: '#a8d8e6', M: '#6caac4', D: '#437794', K: '#294c66'
    }),
    white_shadow: buildHiBitWorldGem('quartz', {
      W: '#b8a6d9', H: '#8572ab', L: '#5e4d82', M: '#413361', D: '#2a1f42', K: '#1a122b'
    }),
    rose_pure: buildHiBitWorldGem('quartz', {
      W: '#fff2f5', H: '#f7cad8', L: '#e396b1', M: '#bf6588', D: '#8c3f60', K: '#59223b'
    }),
    rose_shadow: buildHiBitWorldGem('quartz', {
      W: '#cfa3c4', H: '#96688c', L: '#6e4666', M: '#4d2d47', D: '#331a2e', K: '#1f0e1c'
    }),
    opal_pure: buildHiBitWorldGem('opal', {
      W: '#fff6cc', H: '#f7c97e', L: '#e68a49', M: '#c45131', D: '#8c2d1f', K: '#541812'
    }),
    opal_shadow: buildHiBitWorldGem('opal', {
      W: '#c99b8f', H: '#8f5d52', L: '#693c34', M: '#4a2620', D: '#301512', K: '#1c0b09'
    }),
    citrine_pure: buildHiBitWorldGem('citrine', {
      W: '#fffbe0', H: '#f7df86', L: '#e6b84c', M: '#c48a2b', D: '#8c5a18', K: '#54320b'
    }),
    citrine_shadow: buildHiBitWorldGem('citrine', {
      W: '#d6c49c', H: '#9c865e', L: '#705d3d', M: '#4f4028', D: '#332818', K: '#1f170d'
    }),
    aqua_pure: buildHiBitWorldGem('aqua', {
      W: '#edffff', H: '#b8f5f2', L: '#6bd4db', M: '#3ca1b0', D: '#236c7a', K: '#133f4a'
    }),
    aqua_shadow: buildHiBitWorldGem('aqua', {
      W: '#a6cad4', H: '#6e93a1', L: '#4c6a78', M: '#334957', D: '#20303b', K: '#121d26'
    }),
    emerald_core: buildHiBitWorldGem('quartz', {
      W: '#ecffea', H: '#b2f09e', L: '#7ec456', M: '#4b943b', D: '#2c6324', K: '#183b14'
    }),
    emerald_pure: buildHiBitWorldGem('quartz', {
      W: '#ecffea', H: '#b2f09e', L: '#7ec456', M: '#4b943b', D: '#2c6324', K: '#183b14'
    }),
    shadow_bomb: buildHiBitWorldGem('quartz', {
      W: '#6d2e82', H: '#451859', L: '#2c0c3b', M: '#1e0529', D: '#12021c', K: '#0a0010'
    })
  };

  const SHARD_ROWS = [
    ['..W..', '.LWM.', 'LLMMD', '.MDD.', '..D..'],
    ['.LW..', 'LLMMD', '.MDDD', '..D..'],
    ['.LW.', 'WMMD', 'MDDD', '.DD.'],
    ['..WW.', '.LMMM', 'DDDD.']
  ];
  const SHARD_SPR = {
    pure: SHARD_ROWS.map((r) => fromMap(r, { W: '#ffffff', L: '#dff4ff', M: '#6caac4', D: '#437794' })),
    rose: SHARD_ROWS.map((r) => fromMap(r, { W: '#ffffff', L: '#f7cad8', M: '#bf6588', D: '#8c3f60' })),
    opal: SHARD_ROWS.map((r) => fromMap(r, { W: '#fff6cc', L: '#e68a49', M: '#c45131', D: '#8c2d1f' })),
    citrine: SHARD_ROWS.map((r) => fromMap(r, { W: '#fffbe0', L: '#f7df86', M: '#c48a2b', D: '#8c5a18' })),
    aqua: SHARD_ROWS.map((r) => fromMap(r, { W: '#edffff', L: '#6bd4db', M: '#3ca1b0', D: '#236c7a' })),
    emerald: SHARD_ROWS.map((r) => fromMap(r, { W: '#ecffea', L: '#8ed46a', M: '#4b943b', D: '#2c6324' })),
    shadow: SHARD_ROWS.map((r) => fromMap(r, { W: '#b8a6d9', L: '#5e4d82', M: '#413361', D: '#2a1f42' })),
    rock: SHARD_ROWS.map((r) => fromMap(r, { W: '#6e635f', L: '#524846', M: '#3b3332', D: '#262020' }))
  };

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
    if (pulse) {
      ctx.fillStyle = '#fff6cc';
      ctx.fillRect(ox - 3.5, oy - 1.5, 7, 3);
      ctx.fillRect(ox - 1.5, oy - 3.5, 3, 7);
    }
    ctx.fillStyle = rimCol;
    ctx.fillRect(ox - r, oy - r + 0.5, r * 2, r * 2 - 1);
    ctx.fillRect(ox - r + 0.5, oy - r, r * 2 - 1, r * 2);
    ctx.fillStyle = midCol;
    ctx.fillRect(ox - r + 0.5, oy - r + 0.5, r * 2 - 1, r * 2 - 1);
    ctx.fillStyle = coreCol;
    ctx.fillRect(ox - 1, oy - 1, 2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ox - 1, oy - 1.5, 1, 1);
  }

  function getPieceSprite(piece) {
    const key = `${piece.type || 'white'}_${piece.shadow ? 'shadow' : 'pure'}`;
    return GEM_SPRITES[key] || (piece.shadow ? GEM_SPRITES.white_shadow : GEM_SPRITES.white_pure);
  }

  function getOrbPalette(piece) {
    if (piece.shadow) {
      return {
        core: '#f3e0ff',
        mid: piece.type === 'rose' ? '#cfa3c4' : (piece.type === 'citrine' ? '#c9b489' : (piece.type === 'aqua' ? '#8eb8c7' : '#9b84c4')),
        rim: '#1f142e',
        link: '#6e5794'
      };
    }
    if (piece.type === 'opal') return { core: '#fffdf2', mid: '#f7b259', rim: '#4a1912', link: '#e68a49' };
    if (piece.type === 'rose') return { core: '#fffdf2', mid: '#f29bb8', rim: '#4f1e35', link: '#d97a9c' };
    if (piece.type === 'citrine') return { core: '#fffdf2', mid: '#f5cf64', rim: '#4d2e0a', link: '#d9a43b' };
    if (piece.type === 'aqua') return { core: '#fffdf2', mid: '#7be3eb', rim: '#143f4a', link: '#4bb2bf' };
    return { core: '#fffdf2', mid: '#7fd4e6', rim: '#1e3a4d', link: '#569bb0' };
  }

  const SHAPE_COLOR_MAP = {
    white:   { hi: '#ffffff', mid: '#e2e8f0', lo: '#64748b', rim: '#1e293b' },
    rose:    { hi: '#ffe4ef', mid: '#ff6ba8', lo: '#b82562', rim: '#4a0d26' },
    opal:    { hi: '#fff0b8', mid: '#ff7b24', lo: '#b83209', rim: '#4a1204' },
    citrine: { hi: '#fffbd1', mid: '#ffd426', lo: '#b87d00', rim: '#422c00' },
    aqua:    { hi: '#d9fffb', mid: '#1ad1c2', lo: '#0d7a73', rim: '#06373a' },
    emerald: { hi: '#e3ffe8', mid: '#38d968', lo: '#197a38', rim: '#0a3618' },
    shadow:  { hi: '#e2d4f7', mid: '#6e5794', lo: '#392a54', rim: '#171026' }
  };

  const SHAPE_BANNERS = {
    circle:    'CÍRCULO!',
    square:    'QUADRADO!',
    rectangle: 'RETÂNGULO!',
    triangle:  'TRIÂNGULO!',
    trapezoid: 'TRAPÉZIO!',
    rhombus:   'LOSANGO!',
    pentagon:  'PENTÁGONO!',
    hexagon:   'HEXÁGONO!'
  };

  function getShapeTone(typeKey, isShadow = false) {
    const base = SHAPE_COLOR_MAP[typeKey] || SHAPE_COLOR_MAP.white;
    if (!isShadow) return base;
    // Mantém as cores reais da borda e do núcleo 100% legíveis mesmo nas peças sombrias,
    // adicionando contorno violeta profundo (e halo sombrio externo na renderização).
    return {
      hi: base.hi,
      mid: base.mid,
      lo: base.lo,
      rim: '#2e1065'
    };
  }

  function drawOrbsForValue(ctx, x, y, rawVal, pal, recentlyChanged) {
    const total = clamp(Math.round(rawVal || 1), 1, 12);
    const row1 = Math.min(6, total);
    const row2 = Math.max(0, total - 6);
    const arcs1 = EXTERNAL_ORB_ARCS[row1] || EXTERNAL_ORB_ARCS[1];

    ctx.fillStyle = pal.link;
    for (let i = 0; i < arcs1.length; i++) {
      const [ox, oy] = arcs1[i];
      ctx.fillRect(RH(x + ox * 0.65), RH(y + oy * 0.72), 1, 1);
      if (i < arcs1.length - 1) {
        const [nx, ny] = arcs1[i + 1];
        ctx.fillRect(RH(x + (ox + nx) * 0.5), RH(y + (oy + ny) * 0.5), 1, 1);
      }
    }
    for (let i = 0; i < arcs1.length; i++) {
      const [ox, oy] = arcs1[i];
      drawExternalOrb(ctx, x + ox, y + oy, pal.core, pal.mid, pal.rim, recentlyChanged);
    }
    if (row2 > 0) {
      const arcs2 = EXTERNAL_ORB_ARCS[row2] || EXTERNAL_ORB_ARCS[1];
      for (let i = 0; i < arcs2.length; i++) {
        const [ox, oy] = arcs2[i];
        drawExternalOrb(ctx, x + ox, y + oy - 6, pal.core, pal.mid, pal.rim, recentlyChanged);
      }
    }
  }

  function drawMaterializedShapePiece(ctx, piece, x, y, t) {
    const shape = piece.shape;
    const isShadow = Boolean(piece.shadow);
    const bPal = getShapeTone(piece.borderType || piece.type || 'white', isShadow);
    const cPal = getShapeTone(piece.coreType || piece.type || 'white', isShadow);
    const highContrast = typeof document !== 'undefined' && document.body?.classList?.contains('high-contrast');
    const f12 = Math.floor(t * SPRITE_FPS);
    const cx = R(x), cy = R(y);

    // Aura sombria externa inconfundível para formas-alvo sombrias (sem apagar as cores reais da borda/núcleo)
    if (isShadow) {
      const pulse = (f12 & 1) ? 13 : 12;
      drawRing(ctx, cx, cy, pulse, '#7e22ce');
      drawRing(ctx, cx, cy, pulse + 1, '#3b0764');
      for (let k = 0; k < 4; k++) {
        const ang = (k / 4) * Math.PI * 2 + f12 * 0.15;
        P1(ctx, R(cx + Math.cos(ang) * (pulse + 1)), R(cy + Math.sin(ang) * (pulse + 1)), '#d8b4fe');
      }
    }

    const rot = Number(piece.rotAngle) || 0;
    const hasRot = Math.abs(rot) > 0.01 && typeof ctx.save === 'function' && typeof ctx.rotate === 'function';
    const ox = hasRot ? 0 : cx;
    const oy = hasRot ? 0 : cy;
    if (hasRot) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
    }

    if (shape === 'circle') {
      // Circunferência pontilhada composta por múltiplos cristais orbitais + núcleo circular facetado
      drawRing(ctx, ox, oy, 8, bPal.rim);
      for (let dy = -6; dy <= 6; dy++) {
        for (let dx = -6; dx <= 6; dx++) {
          const d = Math.hypot(dx, dy);
          if (d <= 6.2) {
            ctx.fillStyle = d > 4.2 ? bPal.mid : (dx + dy < -2 ? cPal.hi : (dx + dy > 2 ? cPal.lo : cPal.mid));
            ctx.fillRect(ox + dx, oy + dy, 1, 1);
          }
        }
      }
      for (let k = 0; k < 8; k++) {
        const ang = (k / 8) * Math.PI * 2 + (isShadow ? -1 : 1) * (f12 * 0.18);
        const rx = R(ox + Math.cos(ang) * 9.5);
        const ry = R(oy + Math.sin(ang) * 9.5);
        ctx.fillStyle = bPal.rim;
        ctx.fillRect(rx - 1, ry - 1, 3, 3);
        P1(ctx, rx, ry, (k & 1) ? bPal.hi : bPal.mid);
      }
    } else if (shape === 'square' || shape === 'rectangle') {
      const hw = shape === 'rectangle' ? 11 : 8;
      const hh = shape === 'rectangle' ? 7 : 8;
      const isJoinedSquares = shape === 'rectangle' && (
        piece.joinedSquares ||
        (piece.components && piece.components.length === 2 && piece.components[0].shape === 'square')
      );
      ctx.fillStyle = bPal.rim;
      ctx.fillRect(ox - hw - 1, oy - hh - 1, (hw + 1) * 2, (hh + 1) * 2);
      // Borda externa (3px) determinada pelo 1º elemento
      ctx.fillStyle = bPal.mid;
      ctx.fillRect(ox - hw, oy - hh, hw * 2, hh * 2);
      ctx.fillStyle = bPal.hi;
      ctx.fillRect(ox - hw, oy - hh, hw * 2, 2);
      ctx.fillRect(ox - hw, oy - hh, 2, hh * 2);
      ctx.fillStyle = bPal.lo;
      ctx.fillRect(ox - hw, oy + hh - 2, hw * 2, 2);
      ctx.fillRect(ox + hw - 2, oy - hh, 2, hh * 2);
      // Núcleo interno determinado pelo 2º elemento
      const iw = hw - 3, ih = hh - 3;
      for (let dy = -ih; dy < ih; dy++) {
        for (let dx = -iw; dx < iw; dx++) {
          if (isJoinedSquares && Math.abs(dx) <= 1) {
            // Costura vertical de junção mostrando claramente os 2 quadrados unidos lado a lado ([■|■])
            ctx.fillStyle = dx === 0 ? '#ffffff' : bPal.mid;
          } else {
            let col = cPal.mid;
            if (dx + dy < -2) col = cPal.hi;
            else if (dx + dy > 2) col = cPal.lo;
            ctx.fillStyle = col;
          }
          ctx.fillRect(ox + dx, oy + dy, 1, 1);
        }
      }
    } else if (shape === 'triangle' && (!piece.subTriangles || piece.subTriangles <= 1)) {
      const h = 15;
      for (let row = 0; row < h; row++) {
        const py = oy - 7 + row;
        const hw = Math.max(1, R((row / (h - 1)) * 9));
        ctx.fillStyle = bPal.rim;
        ctx.fillRect(ox - hw - 1, py, (hw + 1) * 2 + 1, 1);
        for (let dx = -hw; dx <= hw; dx++) {
          const isBorder = row < 3 || row >= h - 3 || Math.abs(dx) >= hw - 2;
          const pal = isBorder ? bPal : cPal;
          const col = dx < -2 ? pal.hi : (dx > 2 ? pal.lo : pal.mid);
          ctx.fillStyle = col;
          ctx.fillRect(ox + dx, py, 1, 1);
        }
      }
    } else if (shape === 'trapezoid') {
      for (let dy = -7; dy <= 7; dy++) {
        const tRatio = (dy + 7) / 14;
        const hw = R(5 + tRatio * 5);
        ctx.fillStyle = bPal.rim;
        ctx.fillRect(ox - hw - 1, oy + dy, (hw + 1) * 2 + 1, 1);
        for (let dx = -hw; dx <= hw; dx++) {
          const isBorder = dy <= -5 || dy >= 5 || Math.abs(dx) >= hw - 2;
          const pal = isBorder ? bPal : cPal;
          ctx.fillStyle = dx < -2 ? pal.hi : (dx > 2 ? pal.lo : pal.mid);
          ctx.fillRect(ox + dx, oy + dy, 1, 1);
        }
      }
    } else if (shape === 'rhombus') {
      // Losango formado visivelmente por 2 Triângulos unidos pela base (▲ em cima + ▼ girado 180° embaixo)
      const r = 9;
      for (let dy = -r; dy <= r; dy++) {
        const hw = r - Math.abs(dy);
        ctx.fillStyle = bPal.rim;
        ctx.fillRect(ox - hw - 1, oy + dy, (hw + 1) * 2 + 1, 1);
        for (let dx = -hw; dx <= hw; dx++) {
          if (dy === 0) {
            ctx.fillStyle = Math.abs(dx) >= hw - 1 ? bPal.hi : '#ffffff';
          } else {
            const isBorder = Math.abs(dx) >= hw - 2 || Math.abs(dy) >= r - 1;
            const pal = isBorder ? bPal : cPal;
            ctx.fillStyle = dx < -1 ? pal.hi : (dx > 1 ? pal.lo : pal.mid);
          }
          ctx.fillRect(ox + dx, oy + dy, 1, 1);
        }
      }
    } else if (shape === 'pentagon') {
      // Pentágono: preserva 100% as cores do Triângulo no topo (dy < -1) e do Trapézio na base (dy > -1)
      const triBorderPal = getShapeTone(piece.triBorder || piece.upperType || piece.coreType || 'white', isShadow);
      const triCorePal   = getShapeTone(piece.triCore   || piece.upperType || piece.coreType || 'white', isShadow);
      const trapBorderPal = getShapeTone(piece.trapBorder || piece.borderType || piece.type || 'citrine', isShadow);
      const trapCorePal   = getShapeTone(piece.trapCore   || piece.lowerType  || piece.coreType || 'aqua', isShadow);
      for (let dy = -9; dy <= 8; dy++) {
        const hw = dy < -1 ? R(2 + ((dy + 9) / 8) * 8) : R(10 - ((dy + 1) / 9) * 3);
        const halfRim = dy < -1 ? triBorderPal.rim : trapBorderPal.rim;
        ctx.fillStyle = halfRim;
        ctx.fillRect(ox - hw - 1, oy + dy, (hw + 1) * 2 + 1, 1);
        for (let dx = -hw; dx <= hw; dx++) {
          if (dy === -1) {
            // Linha de junção luminosa onde o Triângulo assenta sobre o Trapézio
            ctx.fillStyle = Math.abs(dx) >= hw - 1 ? trapBorderPal.hi : '#ffffff';
          } else if (dy < -1) {
            // Metade superior = Triângulo com sua borda e seu núcleo exatos
            const isBorder = dy <= -7 || Math.abs(dx) >= hw - 2;
            const pal = isBorder ? triBorderPal : triCorePal;
            ctx.fillStyle = dx < -2 ? pal.hi : (dx > 2 ? pal.lo : pal.mid);
          } else {
            // Metade inferior = Trapézio com sua borda e seu núcleo exatos
            const isBorder = dy >= 6 || Math.abs(dx) >= hw - 2;
            const pal = isBorder ? trapBorderPal : trapCorePal;
            ctx.fillStyle = dx < -2 ? pal.hi : (dx > 2 ? pal.lo : pal.mid);
          }
          ctx.fillRect(ox + dx, oy + dy, 1, 1);
        }
      }
    } else if (shape === 'hexagon' || (shape === 'triangle' && piece.subTriangles > 1)) {
      // Hexágono (ou construção progressiva de 2..5 fatias triangulares radiais de 60°)
      const slices = shape === 'hexagon' ? 6 : clamp(piece.subTriangles || 2, 2, 6);
      for (let dy = -9; dy <= 9; dy++) {
        const ady = Math.abs(dy);
        const hw = ady <= 4 ? 10 : R(10 - (ady - 4) * 1.2);
        for (let dx = -hw; dx <= hw; dx++) {
          // Determina em qual das 6 fatias radiais de 60° o pixel (dx, dy) está
          let ang = Math.atan2(dy, dx) + Math.PI / 2;
          if (ang < 0) ang += Math.PI * 2;
          const sector = Math.floor((ang / (Math.PI * 2)) * 6) % 6;
          if (sector >= slices) {
            // Guia pontilhada das fatias restantes para completar o Hexágono
            if ((ady === 8 || Math.abs(dx) === hw) && ((dx + dy) & 1) === 0) {
              ctx.fillStyle = '#FBBF24';
              ctx.fillRect(ox + dx, oy + dy, 1, 1);
            }
            continue;
          }
          const isOuterRim = ady >= 9 || Math.abs(dx) >= hw;
          const isBorder = ady >= 7 || Math.abs(dx) >= hw - 2;
          const isRadialSeam = dy === 0 || Math.abs(Math.abs(dx) - Math.round(ady * 0.58)) <= 0;
          if (isOuterRim) {
            ctx.fillStyle = bPal.rim;
          } else if (isRadialSeam && !isBorder) {
            ctx.fillStyle = '#ffffff';
          } else {
            const pal = isBorder ? bPal : cPal;
            ctx.fillStyle = (dx + dy < 0) ? pal.hi : pal.mid;
          }
          ctx.fillRect(ox + dx, oy + dy, 1, 1);
        }
      }
      P1(ctx, ox, oy, '#FBBF24');
    }

    if (hasRot) {
      ctx.restore();
    }

    if (highContrast) {
      // Padrão de hachura + sublinhado de alto contraste para acessibilidade daltônica
      ctx.fillStyle = isShadow ? '#ffffff' : '#FBBF24';
      ctx.fillRect(cx - 7, cy + 10, 14, 1);
      for (let hx = -4; hx <= 4; hx += 4) {
        P1(ctx, cx + hx, cy, '#ffffff');
      }
    }
  }

  function drawElectricShapeNode(ctx, node, t) {
    if (!node || node.used) return;
    const cx = R(node.x), cy = R(node.y);
    const f18 = Math.floor(t * 18);
    const isRejected = Boolean(node.barrierUntil && t < node.barrierUntil);
    const highContrast = typeof document !== 'undefined' && document.body?.classList?.contains('high-contrast');
    const mainCol = isRejected ? '#ef4444' : (node.hover ? '#ffffff' : '#FBBF24');
    const subCol = isRejected ? '#fca5a5' : '#D97706';

    const plotPerimeter = (px, py, idx) => {
      if (((idx + f18) % 3) !== 0 || node.hover || isRejected) {
        P1(ctx, px, py, ((idx + f18) & 1) ? mainCol : subCol);
      }
      if (highContrast && (idx & 3) === 0) {
        P1(ctx, px, py + 1, '#ffffff');
      }
    };

    let idx = 0;
    if (node.shape === 'circle') {
      const r = 13;
      for (let a = 0; a < 36; a++) {
        const ang = (a / 36) * Math.PI * 2;
        plotPerimeter(R(cx + Math.cos(ang) * r), R(cy + Math.sin(ang) * r), idx++);
      }
    } else if (node.shape === 'square' || node.shape === 'rectangle') {
      const hw = node.shape === 'rectangle' ? 15 : 12;
      const hh = node.shape === 'rectangle' ? 10 : 12;
      for (let dx = -hw; dx <= hw; dx++) {
        plotPerimeter(cx + dx, cy - hh, idx++);
        plotPerimeter(cx + dx, cy + hh, idx++);
      }
      for (let dy = -hh; dy <= hh; dy++) {
        plotPerimeter(cx - hw, cy + dy, idx++);
        plotPerimeter(cx + hw, cy + dy, idx++);
      }
    } else if (node.shape === 'triangle') {
      const h = 22;
      for (let row = 0; row <= h; row++) {
        const py = cy - 11 + row;
        const hw = R((row / h) * 13);
        plotPerimeter(cx - hw, py, idx++);
        plotPerimeter(cx + hw, py, idx++);
        if (row === h) {
          for (let dx = -hw; dx <= hw; dx++) plotPerimeter(cx + dx, py, idx++);
        }
      }
    } else if (node.shape === 'trapezoid') {
      for (let dy = -10; dy <= 10; dy++) {
        const hw = R(7 + ((dy + 10) / 20) * 7);
        plotPerimeter(cx - hw, cy + dy, idx++);
        plotPerimeter(cx + hw, cy + dy, idx++);
        if (dy === -10 || dy === 10) {
          for (let dx = -hw; dx <= hw; dx++) plotPerimeter(cx + dx, cy + dy, idx++);
        }
      }
    }

    // Pequenos arcos de eletricidade estática a 12-24 FPS
    const sparkAng = (f18 * 0.9) % (Math.PI * 2);
    const sx = R(cx + Math.cos(sparkAng) * 12);
    const sy = R(cy + Math.sin(sparkAng) * 10);
    P1(ctx, sx, sy, '#FEF3C7');
    P1(ctx, sx + ((f18 & 1) ? 1 : -1), sy - 1, '#FBBF24');

    // Barreira de eletricidade estática amarela quando uma entrada inválida é bloqueada (Seção 2.2)
    if (isRejected) {
      for (let dy = -9; dy <= 9; dy += 3) {
        for (let dx = -11; dx <= 11; dx += 2) {
          const jitter = ((dx + dy + f18) & 1) ? 1 : -1;
          P1(ctx, cx + dx, cy + dy + jitter, (dx & 2) ? '#FBBF24' : '#FEF3C7');
        }
      }
    }

    if (highContrast) {
      ctx.fillStyle = '#FEF3C7';
      ctx.fillRect(cx - 10, cy + 14, 20, 1);
    }
  }

  function drawFloatingBanners(ctx, banners, t) {
    if (!banners || !banners.length) return;
    for (const b of banners) {
      const elapsed = t - b.t0;
      if (elapsed < 0 || elapsed > 1.35) continue;
      const p = clamp(elapsed / 1.35, 0, 1);
      const bx = R(b.x), by = R(b.y - p * 18);
      const textW = typeof measurePixelText === 'function' ? measurePixelText(b.text, 9) : String(b.text || '').length * 6;
      const bw = Math.max(58, textW + 14);
      ctx.fillStyle = '#2c221e';
      ctx.fillRect(bx - R(bw / 2) - 1, by - 7, bw + 2, 13);
      ctx.fillStyle = '#D97706';
      ctx.fillRect(bx - R(bw / 2), by - 6, bw, 11);
      ctx.fillStyle = '#FBBF24';
      ctx.fillRect(bx - R(bw / 2), by - 6, bw, 1);
      ctx.fillRect(bx - R(bw / 2), by + 4, bw, 1);
      drawPixelTextCentered(ctx, b.text, bx, by - 4, '#FEF3C7', '#2c221e', bw - 4, 9);
      if ((Math.floor(t * 16) & 1) === 0) {
        drawStar(ctx, bx - R(bw / 2) - 4, by - 2, 2, '#ffffff', '#FBBF24');
        drawStar(ctx, bx + R(bw / 2) + 4, by - 2, 2, '#ffffff', '#FBBF24');
      }
    }
  }

  function drawCrystalPiece(ctx, piece, t, isSelected = false, isTutorialHighlight = false) {
    if (!piece || piece.broken || piece.value <= 0) return;

    const isTrembling = Boolean(piece.trembling) || Boolean(piece.rejectUntil && t < piece.rejectUntil);
    const [tx, ty] = ActorAnimator.getCrystalTrembleOffset(t, isTrembling, ctx, piece.x, piece.y);
    const x = RH(piece.x + tx), y = RH(piece.y + ty);

    if (isTutorialHighlight && !piece.shadow) {
      const pulseR = 14 + (Math.floor(t * 8) & 1) * 2;
      drawRing(ctx, R(x), R(y), pulseR, '#FBBF24');
      drawRing(ctx, R(x), R(y), pulseR + 2, '#FEF3C7');
    }

    if (piece.dragging || isSelected) {
      drawRing(ctx, R(x), R(y), 14, isSelected ? '#c084fc' : '#e6cf9c');
    } else if (!piece.shadow && !piece.shape && (piece.type === 'citrine' || piece.type === 'aqua') && piece.value >= 2 && piece.value % 2 === 0) {
      // Halo sutil indicando que o cristal par pode ser dividido com um toque rápido
      if ((Math.floor(t * 6) & 1) === 0) {
        P1(ctx, R(x - 10), R(y), piece.type === 'citrine' ? '#f7df86' : '#a8f0f0');
        P1(ctx, R(x + 10), R(y), piece.type === 'citrine' ? '#f7df86' : '#a8f0f0');
      }
    }

    if (piece.shape) {
      drawMaterializedShapePiece(ctx, piece, x, y, t);
    } else {
      const spr = getPieceSprite(piece);
      const gw = spr.width * 0.5, gh = spr.height * 0.5;
      ctx.drawImage(spr, RH(x - gw / 2), RH(y - gh / 2), gw, gh);
    }

    // Selo dourado-esmeralda caso o cristal já tenha sido abençoado pelo Altar de Esmeralda
    if (piece.boosted && !piece.shadow) {
      drawStar(ctx, R(x), R(y + 9), 2, '#ffffff', '#8ed46a');
    }

    const recentlyChanged = Boolean(piece.lastValChangeAt && (t - piece.lastValChangeAt) < 0.28);
    const pal = getOrbPalette(piece);
    drawOrbsForValue(ctx, x, y - (piece.shape ? 2 : 0), piece.value || 1, pal, recentlyChanged);
  }

  function drawEmeraldAltar(ctx, altar, t) {
    if (!altar) return;
    const f12 = Math.floor(t * SPRITE_FPS);
    const ax = R(altar.x), ay = R(altar.y);
    const bob = (f12 & 2) ? -1 : 0;

    // Pedestal de pedra esculpida com musgo
    ctx.fillStyle = '#262020';
    ctx.fillRect(ax - 11, ay + 6, 22, 8);
    ctx.fillStyle = '#524846';
    ctx.fillRect(ax - 10, ay + 7, 20, 6);
    ctx.fillStyle = '#539e43';
    ctx.fillRect(ax - 10, ay + 6, 20, 2);

    // Aura de duplicação em anel esmeralda
    drawRing(ctx, ax, ay - 2, 14 + (f12 & 1), '#7ec456');
    const spr = GEM_SPRITES.emerald_core;
    const gw = spr.width * 0.5, gh = spr.height * 0.5;
    ctx.drawImage(spr, RH(ax - gw / 2), RH(ay - 4 + bob - gh / 2), gw, gh);
    if ((f12 & 1) === 0) {
      drawStar(ctx, ax - 9, ay - 10, 2, '#ffffff', '#a5e06c');
      drawStar(ctx, ax + 9, ay - 8, 2, '#ffffff', '#f2cc6b');
    }
  }

  function drawFractionPlatform(ctx, fp, t) {
    if (!fp || fp.broken) return;
    const f12 = Math.floor(t * SPRITE_FPS);
    const fx = R(fp.x), fy = R(fp.y);
    const fw = fp.w || 64, fh = fp.h || 76;
    const halfW = R(fw * 0.5), halfH = R(fh * 0.5);
    const isGlowing = Boolean(fp.glowing);
    const glowWave = Math.sin(t * 8) * 0.5 + 0.5;

    // Fundo da plataforma: pedra cristalina esculpida do rio
    ctx.fillStyle = '#101724';
    ctx.fillRect(fx - halfW - 2, fy - halfH - 2, fw + 4, fh + 4);

    // Corpo interno texturizado
    ctx.fillStyle = isGlowing ? '#24142a' : '#182436';
    ctx.fillRect(fx - halfW, fy - halfH, fw, fh);

    // Bordas de cantos em relevo
    const cornerCol = isGlowing ? '#ff79c6' : '#57d1de';
    const darkCorner = isGlowing ? '#9e2d67' : '#23606e';
    ctx.fillStyle = darkCorner;
    ctx.fillRect(fx - halfW, fy - halfH, 6, 2);
    ctx.fillRect(fx - halfW, fy - halfH, 2, 6);
    ctx.fillRect(fx + halfW - 6, fy - halfH, 6, 2);
    ctx.fillRect(fx + halfW - 2, fy - halfH, 2, 6);
    ctx.fillRect(fx - halfW, fy + halfH - 2, 6, 2);
    ctx.fillRect(fx - halfW, fy + halfH - 6, 2, 6);
    ctx.fillRect(fx + halfW - 6, fy + halfH - 2, 6, 2);
    ctx.fillRect(fx + halfW - 2, fy + halfH - 6, 2, 6);

    ctx.fillStyle = cornerCol;
    ctx.fillRect(fx - halfW + 1, fy - halfH + 1, 4, 1);
    ctx.fillRect(fx - halfW + 1, fy - halfH + 1, 1, 4);
    ctx.fillRect(fx + halfW - 5, fy - halfH + 1, 4, 1);
    ctx.fillRect(fx + halfW - 2, fy - halfH + 1, 1, 4);
    ctx.fillRect(fx - halfW + 1, fy + halfH - 2, 4, 1);
    ctx.fillRect(fx - halfW + 1, fy + halfH - 5, 1, 4);
    ctx.fillRect(fx + halfW - 5, fy + halfH - 2, 4, 1);
    ctx.fillRect(fx + halfW - 2, fy + halfH - 5, 1, 4);

    // Receptores / slots para Topo e Fundo (em cima e embaixo)
    const topHov = Boolean(fp.topHover);
    ctx.fillStyle = topHov ? '#2c425e' : (isGlowing ? '#381c3e' : '#1c2838');
    ctx.fillRect(fx - halfW + 4, fy - halfH + 4, fw - 8, halfH - 6);
    if (topHov) {
      ctx.strokeStyle = '#6fe4f5';
      ctx.lineWidth = 1;
      ctx.strokeRect(fx - halfW + 4.5, fy - halfH + 4.5, fw - 9, halfH - 7);
    }

    const botHov = Boolean(fp.bottomHover);
    ctx.fillStyle = botHov ? '#2c425e' : (isGlowing ? '#381c3e' : '#1c2838');
    ctx.fillRect(fx - halfW + 4, fy + 2, fw - 8, halfH - 6);
    if (botHov) {
      ctx.strokeStyle = '#6fe4f5';
      ctx.lineWidth = 1;
      ctx.strokeRect(fx - halfW + 4.5, fy + 2.5, fw - 9, halfH - 7);
    }

    // Barra de fração centralizada
    const barW = fw - 10;
    if (isGlowing) {
      drawRing(ctx, fx, fy, 28 + glowWave * 4, '#ff69b4');
      drawRing(ctx, fx, fy, 38 + glowWave * 6, '#ffaae5');
      ctx.fillStyle = '#ff2a8d';
      ctx.fillRect(fx - R(barW * 0.5) - 1, fy - 2, barW + 2, 4);
      ctx.fillStyle = '#ff85c8';
      ctx.fillRect(fx - R(barW * 0.5), fy - 1, barW, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(fx - R(barW * 0.5) + 4, fy, barW - 8, 1);

      if ((f12 & 3) === 0) {
        drawStar(ctx, fx - 22 + (f12 % 5) * 11, fy - 14 - (f12 % 3) * 4, 2, '#ffffff', '#ff69b4');
      }
      if ((f12 & 3) === 2) {
        drawStar(ctx, fx - 16 + ((f12 + 2) % 5) * 8, fy + 12 + (f12 % 4) * 3, 2, '#ffffff', '#ffaae5');
      }

      const btnW = 44, btnH = 11;
      const bbx = fx - R(btnW * 0.5), bby = fy - 5;
      ctx.fillStyle = '#3a0d24';
      ctx.fillRect(bbx - 1, bby - 1, btnW + 2, btnH + 2);
      ctx.fillStyle = (f12 & 2) ? '#ff409a' : '#ff6eb5';
      ctx.fillRect(bbx, bby, btnW, btnH);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bbx + 1, bby + 1, btnW - 2, 1);
      drawPixelTextCentered(ctx, 'DIVIDIR!', fx, bby + 2, '#ffffff', '#3a0d24');
    } else {
      ctx.fillStyle = '#0f1a24';
      ctx.fillRect(fx - R(barW * 0.5) - 1, fy - 2, barW + 2, 4);
      ctx.fillStyle = '#3ba7b8';
      ctx.fillRect(fx - R(barW * 0.5), fy - 1, barW, 2);
      ctx.fillStyle = '#8ce8f5';
      ctx.fillRect(fx - R(barW * 0.5) + 6, fy - 1, barW - 12, 1);
    }
  }

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
  // 2. CRISTAL GIGANTE DE CADA GUARDIÃ + OBSTÁCULOS + PORTÃO ANCESTRAL FINAL
  // ============================================================================
  const GIANT_BIOME_CRYSTAL_CACHE = {};

  function buildGiantBiomeCrystal(biomeKey, guardianKey, pal, crackStage = 0, flashMode = false) {
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
    const drawSpire = (sx, sy, sw, sh, tilt) => {
      for (let py = 0; py < sh; py++) {
        const hw = Math.max(1, Math.round(sw * (1 - py / sh)));
        const ox = Math.round((py / sh) * tilt);
        for (let dx = -hw; dx <= hw; dx++) {
          const px = sx + ox + dx, y = sy + py;
          if (flashMode) { put(px, y, '#ffffff'); continue; }
          const ndx = dx / Math.max(1, hw);
          let col = pal.M;
          if (Math.abs(ndx) > 0.85) col = ndx < 0 ? pal.H : pal.K;
          else if (ndx < -0.25) col = ((px + y) & 1) ? pal.L : pal.M;
          else if (ndx > 0.35) col = pal.D;
          put(px, y, col);
        }
      }
    };
    drawSpire(cx - 46, 0, 14, 54, -12);
    drawSpire(cx + 46, 0, 14, 54, 12);
    drawSpire(cx - 32, 0, 13, 70, -6);
    drawSpire(cx + 32, 0, 13, 70, 6);

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
        let col = pal.M;
        if (adx > 0.92 || py === 99) col = ndx < 0 ? pal.W : pal.K;
        else if (Math.abs(adx - 0.48) < 0.05) col = pal.H;
        else if (ndx < -0.48) col = ((px + py) & 1) ? pal.H : pal.L;
        else if (ndx < 0) col = ((px + py) & 1) ? pal.L : pal.M;
        else if (ndx < 0.48) col = pal.D;
        else col = pal.K;
        put(px, py, col);
      }
    }

    const actorSet = E.SpriteBank && E.SpriteBank[guardianKey];
    if (!flashMode && actorSet && actorSet.back_silhouette) {
      const silSpr = actorSet.back_silhouette[0];
      x.globalAlpha = 0.85;
      x.drawImage(silSpr, cx - 24, 14);
      x.globalAlpha = 1.0;

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
            put(rx + 1, ry, pal.H);
          }
        }
      }
    }
    return c;
  }

  function getGiantBiomeCrystalFrames(biomeKey) {
    if (GIANT_BIOME_CRYSTAL_CACHE[biomeKey]) return GIANT_BIOME_CRYSTAL_CACHE[biomeKey];
    const cfg = biomeKey === 'forest'
      ? { actor: 'araci', pal: { W: '#ebffe6', H: '#9be884', L: '#63b54d', M: '#3a7a2c', D: '#24521c', K: '#143310' } }
      : biomeKey === 'river'
        ? { actor: 'irece', pal: { W: '#ebffff', H: '#9ef0f5', L: '#57bbc9', M: '#318091', D: '#1f5563', K: '#11333d' } }
        : { actor: 'jurema', pal: { W: '#fff6d9', H: '#f7c272', L: '#d97a41', M: '#9e4724', D: '#6b2914', K: '#3d1409' } };
    GIANT_BIOME_CRYSTAL_CACHE[biomeKey] = [
      buildGiantBiomeCrystal(biomeKey, cfg.actor, cfg.pal, 0, false),
      buildGiantBiomeCrystal(biomeKey, cfg.actor, cfg.pal, 1, false),
      buildGiantBiomeCrystal(biomeKey, cfg.actor, cfg.pal, 2, false),
      buildGiantBiomeCrystal(biomeKey, cfg.actor, cfg.pal, 3, false),
      buildGiantBiomeCrystal(biomeKey, cfg.actor, cfg.pal, 0, true)
    ];
    return GIANT_BIOME_CRYSTAL_CACHE[biomeKey];
  }

  function drawGiantBiomeCrystal(ctx, biomeKey, crackRatio, flashMode, broken, t) {
    if (broken) return;
    const frames = getGiantBiomeCrystalFrames(biomeKey);
    const stage = clamp(Math.floor(crackRatio * 3), 0, 3);
    const spr = flashMode ? frames[4] : frames[stage];
    const w = spr.width * 0.5, h = spr.height * 0.5;
    ctx.drawImage(spr, RH(176 - w / 2), 20, w, h);
    if (!flashMode && (Math.floor(t * SPRITE_FPS) & 1) === 0) {
      P1(ctx, 176, 40, '#ffffff');
    }
  }

  function drawBiomeObstacle(ctx, biomeKey, decayRatio, t) {
    if (decayRatio >= 1) return;
    const f12 = Math.floor(t * SPRITE_FPS);
    const maxH = R((1 - decayRatio) * 94);
    if (maxH <= 2) return;
    const baseX = 258, baseY = 142;

    const pal = biomeKey === 'forest'
      ? { k0: '#211814', k1: '#3b2a21', k2: '#573f31', vein: '#7ec456' }
      : biomeKey === 'river'
        ? { k0: '#18222e', k1: '#2a3b4f', k2: '#435b75', vein: '#6bd4db' }
        : { k0: '#2b1914', k1: '#4d2c22', k2: '#734535', vein: '#e68a49' };

    for (let dy = 0; dy < maxH; dy++) {
      const y = baseY - dy;
      const tap = 1 - (dy / 104) * 0.45;
      const hw = Math.max(4, R(20 * tap + Math.sin(dy * 0.25) * 2));
      for (let dx = -hw; dx <= hw; dx++) {
        const x = baseX + dx;
        let col = pal.k1;
        if (Math.abs(dx) > hw - 2 || dy === maxH - 1) col = pal.k0;
        else if (dx < -hw * 0.25) col = pal.k2;
        ctx.fillStyle = col;
        ctx.fillRect(x, y, 1, 1);
      }
      if (decayRatio > 0.15 && dy % 9 === 0) {
        P1(ctx, baseX + ((dy * 3) % 9) - 4, y, (f12 & 1) ? '#ffffff' : pal.vein);
      }
    }
  }

  function drawAncientSanctuaryGate(ctx, sealRatio, openRatio, t) {
    const f12 = Math.floor(t * SPRITE_FPS);
    const gx = 248, gy = 26, gw = 58, gh = 116;

    // Se o portão está se abrindo, revela o Panorama Radiante dos 4 Biomas ao fundo!
    if (openRatio > 0.02) {
      drawNextBiomePanorama(ctx, 'kingdom', openRatio, t, gx - 30, gy + 6, gw + 48, gh - 6);
    }

    const split = R(easeInOut(clamp(openRatio, 0, 1)) * 24);
    // Moldura monumental do Portão das Gemas
    ctx.fillStyle = '#1f1816';
    ctx.fillRect(gx - 30, gy, 60, gh);
    ctx.fillStyle = '#4a3a31';
    ctx.fillRect(gx - 28, gy + 2, 56, 10);

    // Folhas duplas de pedra ancestral que deslizam para os lados ao abrir
    const leafW = Math.max(2, 25 - split);
    for (const side of [-1, 1]) {
      const lx = side < 0 ? (gx - 26) : (gx + 26 - leafW);
      ctx.fillStyle = '#382d29';
      ctx.fillRect(lx, gy + 12, leafW, gh - 12);
      ctx.fillStyle = '#574740';
      ctx.fillRect(lx + 1, gy + 13, Math.max(1, leafW - 2), gh - 14);
      ctx.fillStyle = '#bfa36f';
      ctx.fillRect(side < 0 ? lx + leafW - 2 : lx, gy + 12, 2, gh - 12);
    }

    // Os 4 Relicários Primordiais cravados no arco superior do Portão
    const gems = [
      [gx - 18, gy + 7, '#68b8c4', sealRatio >= 0.25],
      [gx - 6,  gy + 6, '#7ec456', sealRatio >= 0.50],
      [gx + 6,  gy + 6, '#57bbc9', sealRatio >= 0.75],
      [gx + 18, gy + 7, '#e68a49', sealRatio >= 0.99]
    ];
    for (let i = 0; i < gems.length; i++) {
      const [rx, ry, col, unlocked] = gems[i];
      ctx.fillStyle = '#d9bf86';
      ctx.fillRect(rx - 3, ry - 3, 7, 7);
      ctx.fillStyle = unlocked ? col : '#2b211d';
      ctx.fillRect(rx - 2, ry - 2, 5, 5);
      if (unlocked) {
        P1(ctx, rx - 1, ry - 1, '#ffffff');
        if (((f12 + i) & 3) === 0) drawStar(ctx, rx, ry - 4, 2, '#ffffff', col);
      }
    }
  }

  // ============================================================================
  // 3. CENÁRIOS HI-BIT 640x360 PROCEDURAIS (CACHE LAZY POR BIOMA)
  // ============================================================================
  const BIOME_PALETTES = {
    forest: {
      seed: 3102,
      dark: {
        sky: ['#1d2424', '#293332', '#394745', '#52635f'],
        far: '#18211f', mid: '#121917', midHi: '#283632',
        rock: ['#1a1715', '#292320', '#3d342f', '#52463f'],
        moss: ['#233b22', '#31542f', '#447040', '#5a8f54'],
        cA: '#3d7a47', cHi: '#a8e6b0', cLo: '#214728'
      },
      cinematic: {
        sky: ['#07100c', '#0d1c15', '#142b20', '#1e3d2e'],
        far: '#09140f', mid: '#060d0a', midHi: '#162e22',
        rock: ['#0c0a09', '#171311', '#241e1b', '#332b27'],
        moss: ['#132b16', '#1e4222', '#2c5e31', '#3f8045'],
        cA: '#68c958', cHi: '#ffffff', cLo: '#275920'
      },
      lit: {
        sky: ['#35634d', '#548c68', '#84ba86', '#cae6b5'],
        far: '#2a523d', mid: '#1f3f2e', midHi: '#467856',
        rock: ['#29201b', '#403129', '#59453a', '#755c4e'],
        moss: ['#2f6e2b', '#4ca13f', '#7ac754', '#a8eb75'],
        cA: '#68cf57', cHi: '#f2ffeb', cLo: '#2d6e26'
      }
    },
    river: {
      seed: 4203,
      dark: {
        sky: ['#1c2433', '#283447', '#384961', '#516782'],
        far: '#18202e', mid: '#121824', midHi: '#28364d',
        rock: ['#181b21', '#252a33', '#373e4a', '#4c5666'],
        moss: ['#1e4247', '#2c5e63', '#3e7d82', '#569ea3'],
        cA: '#3d8799', cHi: '#a8eef5', cLo: '#1f4c59'
      },
      cinematic: {
        sky: ['#070e17', '#0d1929', '#14263d', '#1e3854'],
        far: '#09121f', mid: '#050b14', midHi: '#172b45',
        rock: ['#0a0c10', '#14181f', '#202630', '#2e3745'],
        moss: ['#102b30', '#1a444a', '#266169', '#38838c'],
        cA: '#57d1de', cHi: '#ffffff', cLo: '#215963'
      },
      lit: {
        sky: ['#386c8a', '#5896b5', '#87c4de', '#ccf0fa'],
        far: '#2d5873', mid: '#214459', midHi: '#497d99',
        rock: ['#222830', '#343e4a', '#4b5869', '#67788c'],
        moss: ['#286b5c', '#3ea188', '#68cfad', '#9ef0ce'],
        cA: '#54d2e0', cHi: '#ebffff', cLo: '#256c78'
      }
    },
    caatinga: {
      seed: 5304,
      dark: {
        sky: ['#2b2220', '#3d302d', '#54433e', '#705a52'],
        far: '#241c1a', mid: '#1a1412', midHi: '#382b27',
        rock: ['#241a16', '#382822', '#4f3930', '#694d41'],
        moss: ['#423d24', '#5c5432', '#786e42', '#948854'],
        cA: '#9e5031', cHi: '#ffd7b8', cLo: '#542414'
      },
      cinematic: {
        sky: ['#120a0c', '#1f1114', '#301a1d', '#452629'],
        far: '#170d0e', mid: '#0d0708', midHi: '#2e1a1c',
        rock: ['#120b09', '#211410', '#33201a', '#472d24'],
        moss: ['#292414', '#3d361e', '#574d2b', '#736639'],
        cA: '#e6783e', cHi: '#ffffff', cLo: '#662812'
      },
      lit: {
        sky: ['#6e3d2c', '#a66238', '#d9964e', '#fae09e'],
        far: '#593224', mid: '#45251a', midHi: '#854e35',
        rock: ['#362017', '#543324', '#784a35', '#9c6449'],
        moss: ['#3b6e28', '#59993b', '#82c255', '#b4e67a'],
        cA: '#f0803c', cHi: '#fff8db', cLo: '#823415'
      }
    },
    sanctuary: {
      seed: 6405,
      dark: {
        sky: ['#1a2133', '#25314a', '#354666', '#4d6487'],
        far: '#161d2e', mid: '#101521', midHi: '#273552',
        rock: ['#1c1719', '#2b2326', '#403438', '#59494f'],
        moss: ['#244a3d', '#356b59', '#4b917a', '#6bc2a6'],
        cA: '#5eb8cf', cHi: '#e6fcff', cLo: '#2b5d6e'
      },
      cinematic: {
        sky: ['#090c17', '#101629', '#18223d', '#243357'],
        far: '#0c1020', mid: '#070a14', midHi: '#1c2845',
        rock: ['#0d0b0c', '#171316', '#241e22', '#362d33'],
        moss: ['#142b24', '#1f4237', '#2e6151', '#428772'],
        cA: '#6ad8eb', cHi: '#ffffff', cLo: '#296373'
      },
      lit: {
        sky: ['#395b80', '#5884ab', '#84b4d4', '#caebfa'],
        far: '#2c4969', mid: '#20364f', midHi: '#496e94',
        rock: ['#261f22', '#3b3136', '#54464d', '#736069'],
        moss: ['#2e6e49', '#479e68', '#6ec98c', '#a1f0b8'],
        cA: '#70deed', cHi: '#ffffff', cLo: '#327282'
      }
    }
  };

  const BIOME_BG_CACHE = {};

  function buildBiomeBackgroundMode(biomeKey, mode) {
    const cfg = BIOME_PALETTES[biomeKey] || BIOME_PALETTES.forest;
    const P = cfg[mode] || cfg.dark;
    const rnd = mulberry(cfg.seed);
    const buf = new Uint32Array(HW * HH);

    const put = (x, y, h) => {
      x = R(x); y = R(y);
      if (x < 0 || y < 0 || x >= HW || y >= HH) return;
      buf[y * HW + x] = c32(h);
    };

    // 1. Céu / Atmosfera em bandas com dithering Bayer 4x4
    for (let y = 0; y < HH; y++) {
      const t = clamp(y / 290, 0, 0.999) * 3;
      const b0 = Math.floor(t);
      const frac = t - b0;
      for (let x = 0; x < HW; x++) {
        let b = b0;
        if (b < 3 && bay(x, y) / 16 < frac) b++;
        put(x, y, P.sky[b]);
      }
    }

    // 2. Silhuetas distantes em paralaxe (troncos gigantes na Floresta, quedas no Rio, chapadas na Caatinga)
    const pillars = [
      [56, 36, 290], [156, 46, 286], [282, 50, 292], [418, 46, 288], [542, 38, 290]
    ];
    for (const [cx, hw, maxH] of pillars) {
      const startY = biomeKey === 'caatinga' ? 88 : 22;
      for (let y = startY; y < maxH; y++) {
        const wobble = biomeKey === 'caatinga' ? Math.round((y - startY) * 0.08) : Math.round(Math.sin(y * 0.06 + cx) * 4);
        const curHW = hw + (biomeKey === 'caatinga' ? wobble : Math.round(Math.sin(y * 0.04) * 3));
        for (let x = cx - curHW; x <= cx + curHW; x++) {
          const mistFade = (y - 212) / 78;
          if (mistFade > 0 && bay(x, y) / 16 < mistFade) continue;
          put(x, y, P.far);
        }
      }
    }

    // Cachoeiras luminosas ao fundo no bioma do Rio quando restaurado
    if (biomeKey === 'river') {
      const fallCol = mode === 'lit' ? '#ccf5fc' : (mode === 'cinematic' ? '#296373' : '#3d5066');
      const fallHi = mode === 'lit' ? '#ffffff' : '#6bd4db';
      for (const [fx, fw] of [[112, 18], [348, 24]]) {
        for (let y = 34; y < 278; y++) {
          for (let dx = -fw; dx <= fw; dx++) {
            if (bay(fx + dx, y) < 11) {
              put(fx + dx, y, ((dx + y) % 5 === 0) ? fallHi : fallCol);
            }
          }
        }
      }
    }

    // 3. Camada média esculpida + mandacarus na Caatinga
    const midCols = [[26, 28, 298], [104, 24, 294], [488, 30, 298], [608, 34, 302]];
    for (const [cx, hw, maxH] of midCols) {
      const topY = biomeKey === 'caatinga' ? 118 : 16;
      for (let y = topY; y < maxH; y++) {
        for (let dx = -hw; dx <= hw; dx++) {
          const px = cx + dx;
          const mistFade = (y - 236) / 66;
          if (mistFade > 0 && bay(px, y) / 16 < mistFade) continue;
          const isLit = dx < -hw * 0.35 && ((px + y) & 1) === 0;
          put(px, y, isLit ? P.midHi : P.mid);
        }
      }
    }

    if (biomeKey === 'caatinga') {
      const cactCol = mode === 'lit' ? '#4f8f38' : '#3b3828';
      const cactHi = mode === 'lit' ? '#8ed46a' : '#57523a';
      for (const [mx, my, mh] of [[86, 280, 62], [452, 280, 70], [568, 280, 54]]) {
        for (let dy = 0; dy < mh; dy++) {
          for (let dx = -5; dx <= 5; dx++) {
            put(mx + dx, my - dy, dx < -1 ? cactHi : cactCol);
          }
        }
        for (const side of [-1, 1]) {
          for (let ay = 18; ay < 38; ay++) {
            for (let dx = 0; dx < 12; dx++) {
              if (ay < 24 || dx >= 7) put(mx + side * (5 + dx), my - ay, cactCol);
            }
          }
          if (mode === 'lit') {
            put(mx + side * 14, my - 39, '#ffffff');
            put(mx + side * 15, my - 39, '#ffb35c');
          }
        }
      }
    }

    // 4. Moldura superior (copa de folhas na Floresta, arco mineral nos demais)
    for (let x = 0; x < HW; x++) {
      const archH = Math.round(34 + Math.sin(x * 0.028) * 8 + (x < 84 || x > 556 ? 20 : 0));
      for (let y = 0; y < archH; y++) {
        const cSet = biomeKey === 'forest' ? P.moss : P.rock;
        const d = (archH - y) / archH;
        put(x, y, d < 0.22 ? cSet[0] : (d < 0.55 ? cSet[1] : cSet[2]));
      }
      if (biomeKey === 'forest' && (x % 9) < 3) {
        const vLen = 6 + ((x * 5) % 14);
        for (let vy = 0; vy < vLen; vy++) put(x, archH + vy, vy < vLen - 3 ? P.moss[1] : P.moss[3]);
      }
    }

    // 5. Plataforma de Pedra Esculpida + Cobertura Orgânica e Cristais Ambientais (y = 284..360)
    for (let y = 284; y < HH; y++) {
      for (let x = 0; x < HW; x++) {
        const fx = ((x + Math.sin(y * 0.08) * 6) % 34 + 34) % 34;
        const fy = (y - 284) % 22;
        const seam = fx < 2 || fy < 2;
        let col = P.rock[1];
        if (seam || y > 346) col = P.rock[0];
        else if (fx + fy < 18) col = ((x + y) & 1) === 0 ? P.rock[3] : P.rock[2];
        else if (fx + fy < 34) col = P.rock[2];
        put(x, y, col);
      }
    }

    for (let x = 0; x < HW; x++) {
      const mH = 4 + Math.round((Math.sin(x * 0.09) + 1) * 2.5);
      for (let dy = -3; dy < mH; dy++) {
        const py = 284 + dy;
        const col = dy < -1 ? P.moss[3] : (dy < 1 ? P.moss[2] : (dy < 3 ? P.moss[1] : P.moss[0]));
        put(x, py, col);
      }
    }

    // Afloramentos cristalinos acesos do ambiente (iluminação da Parte 1 do musical!)
    for (const [cx, cy, ch] of [[38, 282, 22], [62, 284, 15], [586, 282, 20], [608, 284, 14]]) {
      for (let dy = 0; dy < ch; dy++) {
        const hw = Math.max(1, Math.round((1 - dy / ch) * 6));
        for (let dx = -hw; dx <= hw; dx++) {
          put(cx + dx, cy - dy, dx < 0 ? P.cHi : (dx === 0 ? P.cA : P.cLo));
        }
      }
    }

    // Poeira luminosa sutil no modo lit/cinematic
    for (let i = 0; i < 40; i++) {
      const sx = Math.floor(rnd() * HW);
      const sy = 44 + Math.floor(rnd() * 210);
      if (mode !== 'dark') put(sx, sy, P.cHi);
    }

    return buf;
  }

  function getBiomeBgSet(biomeKey) {
    if (!BIOME_BG_CACHE[biomeKey]) {
      const compositeImage = new ImageData(HW, HH);
      BIOME_BG_CACHE[biomeKey] = {
        dark: buildBiomeBackgroundMode(biomeKey, 'dark'),
        cinematic: buildBiomeBackgroundMode(biomeKey, 'cinematic'),
        lit: buildBiomeBackgroundMode(biomeKey, 'lit'),
        image: compositeImage,
        u32: new Uint32Array(compositeImage.data.buffer)
      };
    }
    return BIOME_BG_CACHE[biomeKey];
  }

  // ============================================================================
  // 4. ELEMENTOS DO SHOW MUSICAL EM 2 PARTES (TEATRO DE SOMBRAS, NUVEM, TAMBOR E PANORAMA)
  // ============================================================================
  function isWorldChorusActive(mt) {
    return (mt >= 25.0 && mt <= 31.0) || (mt >= 39.0 && mt <= 45.0) || (mt >= 48.0 && mt <= 55.5);
  }

  function drawBiomeShadowPlay(ctx, biomeKey, mt, tq, gx, gy) {
    const f12 = Math.floor(tq * SPRITE_FPS);
    const wallX = 56, wallY = 36, wallW = 208, wallH = 74;

    // Feixes suaves de luz cristalina projetando o mural de sombras na parede
    const rimCol = biomeKey === 'forest' ? '#68c958' : (biomeKey === 'river' ? '#57d1de' : '#e6783e');
    const silDark = '#090d14';
    const silGlow = biomeKey === 'forest' ? '#a5e06c' : (biomeKey === 'river' ? '#9ef0ff' : '#ffd35a');

    ctx.fillStyle = 'rgba(18, 28, 38, 0.42)';
    ctx.fillRect(wallX, wallY, wallW, wallH);
    ctx.fillStyle = rimCol;
    ctx.fillRect(wallX, wallY, wallW, 1);
    ctx.fillRect(wallX, wallY + wallH - 1, wallW, 1);

    if (mt < 8.5) {
      // Ato 1 do mural: A harmonia ancestral da Guardiã com seu bioma
      for (let i = 0; i < 4; i++) {
        const sx = wallX + 32 + i * 46;
        const sy = wallY + 54;
        ctx.fillStyle = silGlow;
        ctx.fillRect(sx - 6, sy - 26, 12, 26);
        drawStar(ctx, sx, sy - 32 - ((f12 + i) & 1), 3, '#ffffff', rimCol);
      }
    } else if (mt < 16.5) {
      // Ato 2 do mural: Fumaça, seca e desordem cobrindo os cristais do bioma
      for (let k = 0; k < 7; k++) {
        const wx = wallX + 18 + k * 28 + Math.round(Math.sin(tq * 2 + k) * 4);
        const wy = wallY + 20 + ((k * 11) % 34);
        ctx.fillStyle = silDark;
        ctx.fillRect(wx - 10, wy - 6, 20, 12);
        P1(ctx, wx, wy, rimCol);
      }
    } else {
      // Ato 3 do mural: A semente de luz resistindo no cristal até o despertar
      const r = 10 + Math.round(Math.sin(tq * 3) * 4);
      drawRing(ctx, wallX + wallW / 2, wallY + 38, r, silGlow);
      drawRing(ctx, wallX + wallW / 2, wallY + 38, r + 6, rimCol);
      drawStar(ctx, wallX + wallW / 2, wallY + 38, 4, '#ffffff', silGlow);
    }

    // Feixe sutil entre a Guardiã em silhueta e o mural
    P1(ctx, R((gx + 160) * 0.5), R((gy - 18 + wallY + wallH) * 0.5), silGlow);
  }

  function drawGuardianCloudStory(ctx, biomeKey, mt, tq, gx, gy) {
    const bx = 94, by = 28, bw = 132, bh = 54;
    // Pequenas bolhas de pensamento subindo da Guardiã até a nuvem
    ctx.fillStyle = '#f4eedf';
    ctx.fillRect(R(gx + 6), R(gy - 36), 4, 4);
    ctx.fillRect(R((gx + bx + 20) * 0.5), R(by + bh + 3), 6, 5);

    // Moldura de nuvem em pixel art estilo Owlboy
    ctx.fillStyle = '#2c221e';
    ctx.fillRect(bx - 2, by, bw + 4, bh);
    ctx.fillRect(bx, by - 2, bw, bh + 4);
    ctx.fillStyle = '#f4eedf';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#d9cfb8';
    ctx.fillRect(bx + 2, by + bh - 3, bw - 4, 2);

    // Cena interna ilustrando a restauração do bioma
    const skyCol = biomeKey === 'forest' ? '#84ba86' : (biomeKey === 'river' ? '#87c4de' : '#fae09e');
    const landCol = biomeKey === 'forest' ? '#367030' : (biomeKey === 'river' ? '#2c6880' : '#a66238');
    ctx.fillStyle = skyCol;
    ctx.fillRect(bx + 6, by + 6, bw - 12, bh - 12);
    ctx.fillStyle = landCol;
    ctx.fillRect(bx + 6, by + bh - 18, bw - 12, 12);

    const f12 = Math.floor(tq * SPRITE_FPS);
    for (let i = 0; i < 3; i++) {
      drawStar(ctx, bx + 28 + i * 38, by + 20 + ((f12 + i) & 1) * 2, 3, '#ffffff', '#f2cc6b');
    }
  }

  function drawCloudPopParticles(ctx, elapsed) {
    const r = R(12 + elapsed * 52);
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const px = R(160 + Math.cos(ang) * r);
      const py = R(54 + Math.sin(ang) * (r * 0.55));
      ctx.fillStyle = '#f4eedf';
      ctx.fillRect(px - 2, py - 2, 4, 4);
    }
  }

  function drawMagicCrystalDrum(ctx, cx, cy, tq) {
    // Projeção mágica de tambor feita por dois cristais com duas pedras manipuladas por magia
    const f12 = Math.floor(tq * SPRITE_FPS);
    const beat = (f12 % 4) === 0;
    ctx.drawImage(GEM_SPRITES.white_pure, RH(cx - 22), RH(cy - 6), 17, 21);
    ctx.drawImage(GEM_SPRITES.rose_pure, RH(cx + 5), RH(cy - 6), 17, 21);

    // Membrana translúcida de luz entre os dois cristais
    ctx.fillStyle = beat ? '#ffffff' : '#9ef0ff';
    ctx.fillRect(cx - 10, cy, 20, 3);
    if (beat) drawRing(ctx, cx, cy + 1, 12, '#f2cc6b');

    // Duas pedras flutuantes batendo alternadamente por magia
    const leftY = cy - 10 + ((f12 % 4 === 0) ? 7 : 0);
    const rightY = cy - 10 + ((f12 % 4 === 2) ? 7 : 0);
    ctx.fillStyle = '#6e635f';
    ctx.fillRect(cx - 8, leftY, 5, 5);
    ctx.fillRect(cx + 3, rightY, 5, 5);
    P1(ctx, cx - 6, leftY - 1, '#f2cc6b');
    P1(ctx, cx + 5, rightY - 1, '#f2cc6b');
  }

  function drawNextBiomePanorama(ctx, nextBiome, openProgress, tq, px = 228, py = 34, pw = 86, ph = 108) {
    const p = clamp(openProgress, 0, 1);
    if (p <= 0) return;
    const w = Math.max(4, R(pw * easeInOut(p)));
    const x0 = px + (pw - w);

    const sky = nextBiome === 'river' ? '#87c4de' : (nextBiome === 'caatinga' ? '#f5c77e' : '#9be8c8');
    const mid = nextBiome === 'river' ? '#3ca1b0' : (nextBiome === 'caatinga' ? '#c46835' : '#539e43');
    const low = nextBiome === 'river' ? '#236c7a' : (nextBiome === 'caatinga' ? '#8c3f23' : '#2f6328');

    ctx.fillStyle = '#241c19';
    ctx.fillRect(x0 - 2, py - 2, w + 4, ph + 4);
    ctx.fillStyle = sky;
    ctx.fillRect(x0, py, w, ph);
    ctx.fillStyle = mid;
    ctx.fillRect(x0, py + R(ph * 0.52), w, R(ph * 0.48));
    ctx.fillStyle = low;
    ctx.fillRect(x0, py + R(ph * 0.76), w, R(ph * 0.24));

    const f12 = Math.floor(tq * SPRITE_FPS);
    if (w > 24) {
      drawStar(ctx, x0 + R(w * 0.5), py + 22, 4, '#ffffff', '#fff6cc');
      if ((f12 & 1) === 0) {
        P1(ctx, x0 + R(w * 0.35), py + R(ph * 0.62), '#ffffff');
        P1(ctx, x0 + R(w * 0.7), py + R(ph * 0.68), '#ffffff');
      }
    }
  }

  // ============================================================================
  // 5. DADOS COMPLETOS DOS MUNDOS 2, 3, 4 E PORTÃO FINAL (NÓS 6..21)
  // ============================================================================
  const WORLD_SPECS = {
    forest: {
      key: 'forest',
      worldIndex: 2,
      hudLabel: 'Floresta',
      guardianKey: 'araci',
      guardianName: 'Araci',
      guardianPortrait: 'portrait_araci',
      socketKey: 'forest',
      nextBiome: 'river',
      nextWorldButton: 'Ir ao Rio >',
      worldClearedTitle: 'Mundo 2 Restaurado!',
      worldClearedLine1: 'Araci despertou a Esmeralda da Floresta!',
      worldClearedLine2: 'Rumo ao Rio das Águas Claras!',
      phaseClearedLine: 'As raízes da Floresta abriram passagem!',
      nodeSyncByLevel: {
        1: { ids: [6], next: 7 },
        2: { ids: [6, 7], next: 8 },
        3: { ids: [6, 7, 8], next: 9 },
        4: { ids: [6, 7, 8, 9], next: 10 },
        5: { ids: [6, 7, 8, 9, 10], next: 11 }
      },
      introDialogues: {
        1: [
          { speaker: 'Protagonista', portrait: 'portrait_protagonist', text: 'A Floresta inteira está coberta por cinzas silenciosas...' },
          { speaker: 'Ordem', portrait: 'portrait_ordem', text: 'Ouça! A Guardiã da Esmeralda está cantando além dessas raízes petrificadas!' },
          { speaker: 'Voz Misteriosa', portrait: 'portrait_mystery_silhouette', text: 'Usem o Altar de Esmeralda para despertar a força das sementes!' }
        ],
        4: [
          { speaker: 'Protagonista', portrait: 'portrait_protagonist', text: 'As raízes petrificadas estão cada vez mais densas por aqui!' },
          { speaker: 'Ordem', portrait: 'portrait_ordem', text: 'Estamos quase no coração da mata! Vamos combinar luz, Citrino, Esmeralda e Fogo para abrir passagem!' }
        ],
        5: [
          { speaker: 'Protagonista', portrait: 'portrait_protagonist', text: 'Olhe no alto da copa! Um cristal gigante envolto por raízes prende a Guardiã da Floresta!' },
          { speaker: 'Voz Misteriosa', portrait: 'portrait_mystery_silhouette', text: 'A fumaça me prendeu aqui dentro! Cortem os cristais puros no ar para libertar a mata!' },
          { speaker: 'Ordem', portrait: 'portrait_ordem', text: 'Deslize para fatiar os cristais puros! Cuidado com os sombrios: cada sombra cortada tira 2 segundos do tempo!' }
        ]
      },
      postDialogues: {
        1: [
          { speaker: 'Ordem', portrait: 'portrait_ordem', text: 'A luz da Esmeralda dobrou nossa energia! As primeiras folhas voltaram a respirar!' }
        ],
        2: [
          { speaker: 'Voz Misteriosa', portrait: 'portrait_mystery_silhouette', text: 'Isso! Ao repartir o Citrino Solar, cada raio encontra seu lugar na mata!' }
        ],
        3: [
          { speaker: 'Ordem', portrait: 'portrait_ordem', text: 'Continuem firmes! Mais uma barreira de raízes e chegaremos ao coração da Floresta!' }
        ],
        4: [
          { speaker: 'Ordem', portrait: 'portrait_ordem', text: 'O caminho se abriu! Agora vamos resgatar a Guardiã da Floresta na Fase 10!' }
        ],
        5: [
          { speaker: 'Araci', portrait: 'portrait_araci', text: 'Livre! Eu sou Araci, Guardiã da Floresta, e a Esmeralda voltou a pulsar!' },
          { speaker: 'Ordem', portrait: 'portrait_ordem', text: 'Mais uma gema primordial acesa! Agora precisamos seguir até o Rio das Águas Claras!' }
        ]
      },
      tutorialsByLevel: {
        1: 'FOREST_EMERALD',
        2: 'FOREST_CITRINE',
        5: 'FOREST_SLICING_NINJA'
      },
      musicalCaptions: [
        [0.5, 8.0, 'Era uma mata inteira a cantar, onde cada folha sabia dançar...'],
        [8.5, 16.0, 'Mas cinza e fumaça cobriram o chão, calando o pulsar do seu coração...'],
        [16.5, 23.5, 'Na semente oculta guardei minha voz, esperando a luz despertar entre nós!'],
        [24.5, 32.5, 'E você veio com a Ordem brilhar, fazendo as raízes voltarem ao ar!'],
        [33.0, 41.5, 'Duplica a energia, reparte o calor, cada cristal faz brotar uma flor!'],
        [42.0, 47.0, 'Bate o maracá no tambor de cristal, a mata renasce em acorde vital!'],
        [47.5, 55.5, 'Abre-se a trilha das Águas Claras: a Esmeralda voltou a cantar!']
      ],
      levels: {
        1: [
          {
            emeraldAltar: { x: 156, y: 104 },
            pieces: [
              { id: 'fo1_1_q', type: 'white', value: 2, shadow: false, x: 96, y: 96 },
              { id: 'fo1_1_s', type: 'white', value: 4, shadow: true, x: 214, y: 96 }
            ]
          },
          {
            emeraldAltar: { x: 156, y: 106 },
            pieces: [
              { id: 'fo1_2_q', type: 'white', value: 1, shadow: false, x: 92, y: 78 },
              { id: 'fo1_2_r', type: 'rose', value: 2, shadow: false, x: 92, y: 112 },
              { id: 'fo1_2_sq', type: 'white', value: 2, shadow: true, x: 216, y: 78 },
              { id: 'fo1_2_sr', type: 'rose', value: 4, shadow: true, x: 216, y: 112 }
            ]
          }
        ],
        2: [
          {
            pieces: [
              { id: 'fo2_1_c', type: 'citrine', value: 4, shadow: false, x: 108, y: 96 },
              { id: 'fo2_1_s1', type: 'citrine', value: 2, shadow: true, x: 206, y: 78 },
              { id: 'fo2_1_s2', type: 'citrine', value: 2, shadow: true, x: 206, y: 114 }
            ]
          },
          {
            emeraldAltar: { x: 154, y: 104 },
            pieces: [
              { id: 'fo2_2_c', type: 'citrine', value: 4, shadow: false, x: 94, y: 96 },
              { id: 'fo2_2_s1', type: 'citrine', value: 4, shadow: true, x: 216, y: 78 },
              { id: 'fo2_2_s2', type: 'citrine', value: 4, shadow: true, x: 216, y: 114 }
            ]
          },
          {
            pieces: [
              { id: 'fo2_3_c', type: 'citrine', value: 6, shadow: false, x: 96, y: 88 },
              { id: 'fo2_3_o', type: 'opal', value: 1, shadow: false, x: 138, y: 116 },
              { id: 'fo2_3_s1', type: 'citrine', value: 3, shadow: true, x: 214, y: 78 },
              { id: 'fo2_3_s2', type: 'citrine', value: 2, shadow: true, x: 214, y: 114 }
            ]
          }
        ],
        3: [
          {
            emeraldAltar: { x: 152, y: 108 },
            pieces: [
              { id: 'fo3_1_c', type: 'citrine', value: 4, shadow: false, x: 92, y: 78 },
              { id: 'fo3_1_q', type: 'white', value: 2, shadow: false, x: 92, y: 114 },
              { id: 'fo3_1_s1', type: 'citrine', value: 4, shadow: true, x: 216, y: 66 },
              { id: 'fo3_1_s2', type: 'citrine', value: 2, shadow: true, x: 216, y: 96 },
              { id: 'fo3_1_s3', type: 'white', value: 4, shadow: true, x: 216, y: 122 }
            ]
          },
          {
            pureEq: { x: 120, y: 74, expanded: false },
            shadowEq: { x: 210, y: 74, expanded: false },
            pieces: [
              { id: 'fo3_2_c', type: 'citrine', value: 4, shadow: false, x: 92, y: 114 },
              { id: 'fo3_2_r', type: 'rose', value: 3, shadow: false, x: 138, y: 114 },
              { id: 'fo3_2_sc1', type: 'citrine', value: 2, shadow: true, x: 202, y: 74, inEquation: 'shadow' },
              { id: 'fo3_2_sr1', type: 'rose', value: 3, shadow: true, x: 220, y: 74, inEquation: 'shadow' },
              { id: 'fo3_2_sc2', type: 'citrine', value: 2, shadow: true, x: 212, y: 116 }
            ]
          },
          {
            emeraldAltar: { x: 150, y: 114 },
            pureEq: { x: 116, y: 72, expanded: false },
            shadowEq: { x: 210, y: 72, expanded: false },
            pieces: [
              { id: 'fo3_3_q', type: 'white', value: 2, shadow: false, x: 88, y: 114 },
              { id: 'fo3_3_c', type: 'citrine', value: 4, shadow: false, x: 116, y: 114 },
              { id: 'fo3_3_sq', type: 'white', value: 4, shadow: true, x: 202, y: 72, inEquation: 'shadow' },
              { id: 'fo3_3_sc', type: 'citrine', value: 2, shadow: true, x: 220, y: 72, inEquation: 'shadow' },
              { id: 'fo3_3_sl', type: 'citrine', value: 2, shadow: true, x: 214, y: 116 }
            ]
          }
        ],
        4: [
          {
            emeraldAltar: { x: 154, y: 108 },
            pieces: [
              { id: 'fo4_1_c', type: 'citrine', value: 4, shadow: false, x: 96, y: 102 },
              { id: 'fo4_1_s1', type: 'citrine', value: 4, shadow: true, x: 216, y: 84 },
              { id: 'fo4_1_s2', type: 'citrine', value: 2, shadow: true, x: 216, y: 116 }
            ]
          },
          {
            emeraldAltar: { x: 148, y: 114 },
            pureEq: { x: 114, y: 78, expanded: false },
            shadowEq: { x: 212, y: 78, expanded: false },
            pieces: [
              { id: 'fo4_2_c', type: 'citrine', value: 6, shadow: false, x: 88, y: 116 },
              { id: 'fo4_2_r', type: 'rose', value: 2, shadow: false, x: 116, y: 116 },
              { id: 'fo4_2_sc', type: 'citrine', value: 3, shadow: true, x: 204, y: 78, inEquation: 'shadow' },
              { id: 'fo4_2_sr', type: 'rose', value: 4, shadow: true, x: 222, y: 78, inEquation: 'shadow' },
              { id: 'fo4_2_sl', type: 'citrine', value: 3, shadow: true, x: 216, y: 116 }
            ]
          },
          {
            emeraldAltar: { x: 146, y: 116 },
            pureEq: { x: 112, y: 78, expanded: false },
            shadowEq: { x: 212, y: 78, expanded: false },
            pieces: [
              { id: 'fo4_3_c', type: 'citrine', value: 4, shadow: false, x: 82, y: 114 },
              { id: 'fo4_3_q', type: 'white', value: 3, shadow: false, x: 106, y: 114 },
              { id: 'fo4_3_o', type: 'opal', value: 1, shadow: false, x: 126, y: 98 },
              { id: 'fo4_3_sc', type: 'citrine', value: 4, shadow: true, x: 204, y: 78, inEquation: 'shadow' },
              { id: 'fo4_3_sq', type: 'white', value: 2, shadow: true, x: 222, y: 78, inEquation: 'shadow' },
              { id: 'fo4_3_sl', type: 'citrine', value: 2, shadow: true, x: 216, y: 116 }
            ]
          }
        ],
        5: [
          {
            pieces: [
              { id: 'fo5_ninja_stage1_emerald', type: 'emerald', value: 2, shadow: false, x: 120, y: 104 },
              { id: 'fo5_ninja_stage1_quartz', type: 'white', value: 2, shadow: false, x: 196, y: 104 }
            ]
          },
          {
            pieces: [
              { id: 'fo5_ninja_stage2_emerald', type: 'emerald', value: 2, shadow: false, x: 120, y: 104 },
              { id: 'fo5_ninja_stage2_quartz', type: 'white', value: 2, shadow: false, x: 196, y: 104 }
            ]
          },
          {
            pieces: [
              { id: 'fo5_ninja_stage3_emerald', type: 'emerald', value: 2, shadow: false, x: 120, y: 104 },
              { id: 'fo5_ninja_stage3_quartz', type: 'white', value: 2, shadow: false, x: 196, y: 104 }
            ]
          },
          {
            pieces: [
              { id: 'fo5_ninja_stage4_emerald', type: 'emerald', value: 2, shadow: false, x: 120, y: 104 },
              { id: 'fo5_ninja_stage4_quartz', type: 'white', value: 2, shadow: false, x: 196, y: 104 }
            ]
          }
        ]
      }
    },

    river: {
      key: 'river',
      worldIndex: 3,
      hudLabel: 'Rio',
      guardianKey: 'irece',
      guardianName: 'Irecê',
      guardianPortrait: 'portrait_irece',
      socketKey: 'river',
      nextBiome: 'caatinga',
      nextWorldButton: 'Ir à Caatinga >',
      worldClearedTitle: 'Mundo 3 Restaurado!',
      worldClearedLine1: 'Irecê despertou a Turmalina do Rio!',
      worldClearedLine2: 'Rumo ao Mundo da Caatinga!',
      phaseClearedLine: 'As águas claras abriram caminho!',
      nodeSyncByLevel: {
        1: { ids: [11], next: 12 },
        2: { ids: [11, 12], next: 13 },
        3: { ids: [11, 12, 13], next: 14 },
        4: { ids: [11, 12, 13, 14], next: 15 },
        5: { ids: [11, 12, 13, 14, 15], next: 16 }
      },
      introDialogues: {
        1: [
          { speaker: 'Protagonista', portrait: 'portrait_protagonist', text: 'As cachoeiras pararam de correr... a água parece pesada e escura.' },
          { speaker: 'Ordem', portrait: 'portrait_ordem', text: 'Veja aquela plataforma de pedra no centro da correnteza!' },
          { speaker: 'Voz Misteriosa', portrait: 'portrait_mystery_silhouette', text: 'É o Altar de Frações! Coloquem valores iguais em cima e embaixo para liberar a divisão!' }
        ],
        2: [
          { speaker: 'Ordem', portrait: 'portrait_ordem', text: 'A correnteza acelera! Não importa a quantidade de peças: o valor total de cima e de baixo precisa ser idêntico!' }
        ],
        3: [
          { speaker: 'Ordem', portrait: 'portrait_ordem', text: 'As frações agora revelam caminhos para Equações Cristalinas! Divida primeiro para conectar depois!' }
        ],
        4: [
          { speaker: 'Protagonista', portrait: 'portrait_protagonist', text: 'Um prisma imenso de Turmalina Paraíba está represando a nascente!' },
          { speaker: 'Voz Misteriosa', portrait: 'portrait_mystery_silhouette', text: 'Estou presa no gelo turvo da cachoeira! Harmonizem as águas e o fogo com cuidado!' },
          { speaker: 'Ordem', portrait: 'portrait_ordem', text: 'Aguente firme! Vamos libertar a nascente agora mesmo!' }
        ],
        5: [
          { speaker: 'Irecê', portrait: 'portrait_irece', text: 'Vocês alcançaram o coração da cascata! Agora, a música das águas nos libertará!' },
          { speaker: 'Ordem', portrait: 'portrait_ordem', text: 'Cinco cristais sonoros estão flutuando sobre a água!' },
          { speaker: 'Irecê', portrait: 'portrait_irece', text: 'Ouçam a melodia e toquem os cristais na ordem exata para harmonizar o rio!' }
        ]
      },
      postDialogues: {
        1: [
          { speaker: 'Ordem', portrait: 'portrait_ordem', text: 'Que limpidez! A fração se quebrou e a divisão fez a primeira gota pura correr!' }
        ],
        2: [
          { speaker: 'Voz Misteriosa', portrait: 'portrait_mystery_silhouette', text: 'Maravilhoso! Já consigo ouvir a espuma das corredeiras despertando!' }
        ],
        3: [
          { speaker: 'Ordem', portrait: 'portrait_ordem', text: 'Equações e frações unificadas! A correnteza está ganhando força cristalina!' }
        ],
        4: [
          { speaker: 'Ordem', portrait: 'portrait_ordem', text: 'Chegamos à grande queda d’água! Vamos libertar a Guardiã do Rio!' }
        ],
        5: [
          { speaker: 'Irecê', portrait: 'portrait_irece', text: 'Obrigada! Eu sou Irecê, e as Águas Claras voltaram a cantar!' },
          { speaker: 'Ordem', portrait: 'portrait_ordem', text: 'Resta apenas uma gema primordial! Vamos levar essa brisa até a Caatinga!' }
        ]
      },
      tutorialsByLevel: {
        1: 'RIVER_FRACTION_PLATFORM',
        5: 'RIVER_MELODY_SIMON'
      },
      musicalCaptions: [
        [0.5, 8.0, 'Corria o rio em turquesa e cristal, levando canções pelo vale ancestral...'],
        [8.5, 16.0, 'Mas lama e silêncio travaram a foz, prendendo no prisma o eco da voz...'],
        [16.5, 23.5, 'Nas gotas partidas guardei a maré, esperando um amigo guiado por fé!'],
        [24.5, 32.5, 'Reparte a corrente, reúne o esplendor, a água desperta limpando o rancor!'],
        [33.0, 41.5, 'A flauta de Irecê faz a fonte saltar, espelhos de luz começam a dançar!'],
        [42.0, 47.0, 'No tambor cristalino repica o trovão, cachoeira liberta em pura canção!'],
        [47.5, 55.5, 'Brilha no horizonte o sol do sertão: rumo à Caatinga de coração!']
      ],
      levels: {
        1: [
          {
            fractionPlatform: { x: 154, y: 104, resultType: 'aqua', resultValue: 1 },
            pieces: [
              { id: 'ri1_1_top', type: 'aqua', value: 2, shadow: false, inFraction: 'top' },
              { id: 'ri1_1_free', type: 'aqua', value: 2, shadow: false, x: 88, y: 104 },
              { id: 'ri1_1_s', type: 'aqua', value: 1, shadow: true, x: 226, y: 104 }
            ]
          },
          {
            fractionPlatform: { x: 154, y: 104, resultType: 'aqua', resultValue: 1 },
            pieces: [
              { id: 'ri1_2_top', type: 'aqua', value: 4, shadow: false, inFraction: 'top' },
              { id: 'ri1_2_free1', type: 'aqua', value: 2, shadow: false, x: 82, y: 84 },
              { id: 'ri1_2_free2', type: 'aqua', value: 2, shadow: false, x: 82, y: 124 },
              { id: 'ri1_2_s', type: 'aqua', value: 1, shadow: true, x: 226, y: 104 }
            ]
          }
        ],
        2: [
          {
            fractionPlatform: { x: 154, y: 104, resultType: 'aqua', resultValue: 1 },
            pieces: [
              { id: 'ri2_1_a4', type: 'aqua', value: 4, shadow: false, x: 84, y: 80 },
              { id: 'ri2_1_a2a', type: 'aqua', value: 2, shadow: false, x: 84, y: 108 },
              { id: 'ri2_1_a2b', type: 'aqua', value: 2, shadow: false, x: 84, y: 134 },
              { id: 'ri2_1_s', type: 'aqua', value: 1, shadow: true, x: 226, y: 104 }
            ]
          },
          {
            fractionPlatform: { x: 154, y: 104, resultType: 'aqua', resultValue: 1 },
            pieces: [
              { id: 'ri2_2_top', type: 'aqua', value: 3, shadow: false, inFraction: 'top' },
              { id: 'ri2_2_bot', type: 'aqua', value: 1, shadow: false, inFraction: 'bottom' },
              { id: 'ri2_2_free', type: 'aqua', value: 2, shadow: false, x: 84, y: 104 },
              { id: 'ri2_2_s', type: 'aqua', value: 1, shadow: true, x: 226, y: 104 }
            ]
          },
          {
            fractionPlatform: { x: 154, y: 104, resultType: 'white', resultValue: 1 },
            pieces: [
              { id: 'ri2_3_top', type: 'white', value: 2, shadow: false, inFraction: 'top' },
              { id: 'ri2_3_free_w2', type: 'white', value: 2, shadow: false, x: 84, y: 88 },
              { id: 'ri2_3_free_w1', type: 'white', value: 1, shadow: false, x: 84, y: 124 },
              { id: 'ri2_3_s', type: 'white', value: 2, shadow: true, x: 226, y: 104 }
            ]
          }
        ],
        3: [
          {
            fractionPlatform: { x: 144, y: 110, resultType: 'aqua', resultValue: 1 },
            pureEq: { x: 106, y: 66, expanded: false },
            shadowEq: { x: 220, y: 78, expanded: false },
            pieces: [
              { id: 'ri3_1_top', type: 'aqua', value: 3, shadow: false, inFraction: 'top' },
              { id: 'ri3_1_a3', type: 'aqua', value: 3, shadow: false, x: 84, y: 98 },
              { id: 'ri3_1_q2', type: 'white', value: 2, shadow: false, x: 84, y: 124 },
              { id: 'ri3_1_sa', type: 'aqua', value: 1, shadow: true, x: 210, y: 78, inEquation: 'shadow' },
              { id: 'ri3_1_sq', type: 'white', value: 2, shadow: true, x: 230, y: 78, inEquation: 'shadow' }
            ]
          },
          {
            fractionPlatform: { x: 144, y: 110, resultType: 'aqua', resultValue: 1 },
            emeraldAltar: { x: 92, y: 116 },
            pureEq: { x: 106, y: 66, expanded: false },
            shadowEq: { x: 220, y: 78, expanded: false },
            pieces: [
              { id: 'ri3_2_top', type: 'aqua', value: 2, shadow: false, inFraction: 'top' },
              { id: 'ri3_2_a2', type: 'aqua', value: 2, shadow: false, x: 76, y: 92 },
              { id: 'ri3_2_q2', type: 'white', value: 2, shadow: false, x: 112, y: 92 },
              { id: 'ri3_2_sa', type: 'aqua', value: 2, shadow: true, x: 210, y: 78, inEquation: 'shadow' },
              { id: 'ri3_2_sq', type: 'white', value: 2, shadow: true, x: 230, y: 78, inEquation: 'shadow' }
            ]
          }
        ],
        4: [
          {
            fractionPlatform: { x: 154, y: 104, resultType: 'white', resultValue: 1 },
            pieces: [
              { id: 'ri4_1_top', type: 'white', value: 4, shadow: false, inFraction: 'top' },
              { id: 'ri4_1_q5', type: 'white', value: 5, shadow: false, x: 84, y: 84 },
              { id: 'ri4_1_o1', type: 'opal', value: 1, shadow: false, x: 84, y: 122 },
              { id: 'ri4_1_s', type: 'white', value: 1, shadow: true, x: 226, y: 104 }
            ]
          },
          {
            fractionPlatform: { x: 144, y: 112, resultType: 'aqua', resultValue: 1 },
            pureEq: { x: 106, y: 66, expanded: false },
            shadowEq: { x: 220, y: 78, expanded: false },
            pieces: [
              { id: 'ri4_2_top', type: 'aqua', value: 4, shadow: false, inFraction: 'top' },
              { id: 'ri4_2_a4', type: 'aqua', value: 4, shadow: false, x: 76, y: 94 },
              { id: 'ri4_2_q3', type: 'white', value: 3, shadow: false, x: 112, y: 94 },
              { id: 'ri4_2_o1', type: 'opal', value: 1, shadow: false, x: 94, y: 122 },
              { id: 'ri4_2_sa', type: 'aqua', value: 1, shadow: true, x: 210, y: 78, inEquation: 'shadow' },
              { id: 'ri4_2_sq', type: 'white', value: 2, shadow: true, x: 230, y: 78, inEquation: 'shadow' }
            ]
          }
        ],
        5: [
          {
            pieces: [
              { id: 'ri_bell_0', type: 'aqua', value: 1, shadow: false, x: 76, y: 110, bellIndex: 0 },
              { id: 'ri_bell_1', type: 'emerald', value: 1, shadow: false, x: 118, y: 110, bellIndex: 1 },
              { id: 'ri_bell_2', type: 'citrine', value: 1, shadow: false, x: 160, y: 110, bellIndex: 2 },
              { id: 'ri_bell_3', type: 'opal', value: 1, shadow: false, x: 202, y: 110, bellIndex: 3 },
              { id: 'ri_bell_4', type: 'rose', value: 1, shadow: false, x: 244, y: 110, bellIndex: 4 }
            ]
          }
        ]
      }
    },

    caatinga: {
      key: 'caatinga',
      worldIndex: 4,
      hudLabel: 'Caatinga',
      guardianKey: 'jurema',
      guardianName: 'Jurema',
      guardianPortrait: 'portrait_jurema',
      socketKey: 'caatinga',
      nextBiome: 'kingdom',
      nextWorldButton: 'Ir ao Santuário >',
      worldClearedTitle: 'Mundo 4 Restaurado!',
      worldClearedLine1: 'Jurema acendeu a Opala da Caatinga!',
      worldClearedLine2: 'As 4 Gemas estão prontas para o Portão!',
      phaseClearedLine: 'A geometria solar abriu passagem no sertão!',
      nodeSyncByLevel: {
        1: { ids: [16], next: 17 },
        2: { ids: [16, 17], next: 18 },
        3: { ids: [16, 17, 18], next: 19 },
        4: { ids: [16, 17, 18, 19], next: 20 },
        5: { ids: [16, 17, 18, 19, 20], next: 21 }
      },
      introDialogues: {
        1: [
          { speaker: 'Ordem', portrait: 'portrait_ordem', text: 'Bem, chegamos à Caatinga!' },
          { speaker: 'Protagonista', portrait: 'portrait_protagonist', text: 'Uf... uf... uf...', protagState: 'panting' },
          { speaker: 'Protagonista', portrait: 'portrait_protagonist', text: 'QUE CALOR!!!', shake: true, protagState: 'shock' },
          { speaker: 'Protagonista', portrait: 'portrait_protagonist', text: 'Desde quando existe um Deserto do Saara no Brasil?! Não vejo uma planta ou árvore sequer aqui, só areia e rochas...' },
          { speaker: 'Ordem', portrait: 'portrait_ordem', text: 'Bem, na verdade a Caatinga não era assim...' },
          { speaker: 'Ordem', portrait: 'portrait_ordem', text: 'Mas eu explico no caminho... Veja só, tem uns cristais ali! Quebre eles!', pointRight: true }
        ],
        2: [
          { speaker: 'Ordem', portrait: 'portrait_ordem', text: 'Veja as linhas elétricas nas rochas! Quando dois cristais se unem, eles moldam quadriláteros sagrados!' }
        ],
        3: [
          { speaker: 'Ordem', portrait: 'portrait_ordem', text: 'As formas cristalinas também se atraem! Una duas formas prontas para revelar polígonos ainda maiores!' }
        ],
        4: [
          { speaker: 'Ordem', portrait: 'portrait_ordem', text: 'Chegamos aos mosaicos ancestrais! Triângulos formam Losangos e Hexágonos, e cabem dentro de equações!' }
        ],
        5: [
          { speaker: 'Protagonista', portrait: 'portrait_protagonist', text: 'Encontramos o Santuário da Caatinga! A Opala de Fogo Primordial está selada no Altar!' },
          { speaker: 'Voz Misteriosa', portrait: 'portrait_mystery_silhouette', text: 'A tempestade de areia trancou minha canção! Usem todas as formas sagradas para purificar o núcleo!' },
          { speaker: 'Ordem', portrait: 'portrait_ordem', text: 'É a última Gema Primordial! Vamos libertar o Altar!' }
        ]
      },
      postDialogues: {
        1: [
          { speaker: 'Ordem', portrait: 'portrait_ordem', text: 'O Círculo Sagrado despertou a primeira brisa dourada entre as chapadas!' }
        ],
        2: [
          { speaker: 'Ordem', portrait: 'portrait_ordem', text: 'Quadrados, Retângulos e Trapézios alinhados! Você dominou a ordem das cores e facetas!' }
        ],
        3: [
          { speaker: 'Voz Misteriosa', portrait: 'portrait_mystery_silhouette', text: 'As cacimbas estão brilhando com seus encaixes! Continuem rumo ao santuário!' }
        ],
        4: [
          { speaker: 'Ordem', portrait: 'portrait_ordem', text: 'O Hexágono Solar abriu os portões do Santuário da Caatinga! Vamos despertar sua Guardiã!' }
        ],
        5: [
          { speaker: 'Jurema', portrait: 'portrait_jurema', text: 'Viva! Eu sou Jurema, e a Caatinga inteira floresceu com mandacarus e água cristalina!' },
          { speaker: 'Ordem', portrait: 'portrait_ordem', text: 'Reunimos todas as 4 Gemas Primordiais! Voltemos à Caverna para abrir a Porta Ancestral!' }
        ]
      },
      tutorialsByLevel: {
        1: 'CAATINGA_CIRCLE',
        2: 'CAATINGA_SQUARE',
        3: 'CAATINGA_TESSELLATION',
        4: 'CAATINGA_NESTED',
        5: 'CAATINGA_SHELL_GAME'
      },
      musicalCaptions: [
        [0.5, 8.0, 'Sob o céu do sertão reluzia o calor, cada flor de mandacaru tinha seu valor...'],
        [8.5, 16.0, 'Veio a sombra cruel ressecar o torrão, trancando a rabeca na pedra em carvão...'],
        [16.5, 23.5, 'Mas quem guarda raiz nunca perde o cantar, esperando o orvalho voltar a brilhar!'],
        [24.5, 32.5, 'Com a Ordem, a mata e as águas na mão, você trouxe harmonia pro meu coração!'],
        [33.0, 41.5, 'Canta a rabeca acordando o luar, brota água cristalina em todo lugar!'],
        [42.0, 47.0, 'No tambor de opala ressoa o baião, floresce a Caatinga em plena estação!'],
        [47.5, 55.5, 'Quatro gemas acesas num só esplendor: o Portão Ancestral vai se abrir com amor!']
      ],
      levels: {
        // FASE 1 (Nó 16): O Despertar do Deserto & O Círculo Sagrado
        1: [
          {
            // Etapa 1: Opala de Fogo (3) + Pequeno Círculo Elétrico -> Círculo de Opala (3) -> Anula Círculo Sombrio de Opala (3)
            tutorialHighlightId: 'ca1_1_o',
            disableOpalDrain: true,
            electricShapes: [
              { id: 'ca1_1_ec', shape: 'circle', x: 148, y: 96 }
            ],
            pieces: [
              { id: 'ca1_1_o', type: 'opal', value: 3, shadow: false, x: 92, y: 96 },
              { id: 'ca1_1_s', type: 'opal', value: 3, shadow: true, shape: 'circle', borderType: 'opal', coreType: 'opal', x: 214, y: 96 }
            ]
          },
          {
            // Etapa 2: Fusão de Quartzos + Círculos Elétricos
            electricShapes: [
              { id: 'ca1_2_ec1', shape: 'circle', x: 150, y: 78 },
              { id: 'ca1_2_ec2', shape: 'circle', x: 150, y: 114 }
            ],
            pieces: [
              { id: 'ca1_2_q1', type: 'white', value: 2, shadow: false, x: 86, y: 68 },
              { id: 'ca1_2_q2', type: 'white', value: 2, shadow: false, x: 86, y: 96 },
              { id: 'ca1_2_r', type: 'rose', value: 3, shadow: false, x: 112, y: 116 },
              { id: 'ca1_2_sq', type: 'white', value: 4, shadow: true, shape: 'circle', borderType: 'white', coreType: 'white', x: 214, y: 78 },
              { id: 'ca1_2_sr', type: 'rose', value: 3, shadow: true, shape: 'circle', borderType: 'rose', coreType: 'rose', x: 214, y: 114 }
            ]
          },
          {
            // Etapa 3: Subtração com Opala de Fogo antes da entrada no Círculo Elétrico
            electricShapes: [
              { id: 'ca1_3_ec1', shape: 'circle', x: 154, y: 78 },
              { id: 'ca1_3_ec2', shape: 'circle', x: 154, y: 114 }
            ],
            pieces: [
              { id: 'ca1_3_q', type: 'white', value: 5, shadow: false, x: 86, y: 78 },
              { id: 'ca1_3_o', type: 'opal', value: 2, shadow: false, x: 116, y: 78 },
              { id: 'ca1_3_c', type: 'citrine', value: 4, shadow: false, x: 96, y: 114 },
              { id: 'ca1_3_sq', type: 'white', value: 3, shadow: true, shape: 'circle', borderType: 'white', coreType: 'white', x: 216, y: 78 },
              { id: 'ca1_3_sc', type: 'citrine', value: 4, shadow: true, shape: 'circle', borderType: 'citrine', coreType: 'citrine', x: 216, y: 114 }
            ]
          }
        ],
        // FASE 2 (Nó 17): Quadriláteros & A Ordem dos Fatores
        2: [
          {
            // Etapa 1: Quartzo Branco (2) + Quartzo Rosa (2) + Quadrado Elétrico (exige valores iguais e respeita ordem borda/núcleo)
            pureEq: { x: 102, y: 74, expanded: false },
            electricShapes: [
              { id: 'ca2_1_es', shape: 'square', x: 158, y: 96 }
            ],
            pieces: [
              { id: 'ca2_1_q', type: 'white', value: 2, shadow: false, x: 84, y: 114 },
              { id: 'ca2_1_r', type: 'rose', value: 2, shadow: false, x: 118, y: 114 },
              { id: 'ca2_1_ss', type: 'white', value: 4, shadow: true, shape: 'square', borderType: 'white', coreType: 'rose', x: 216, y: 96 }
            ]
          },
          {
            // Etapa 2: Quartzo Branco (3) + Opala (6) + Retângulo Elétrico (exige valores diferentes: Base != Altura)
            stepTutorial: 'CAATINGA_RECTANGLE',
            disableOpalDrain: true,
            pureEq: { x: 102, y: 74, expanded: false },
            electricShapes: [
              { id: 'ca2_2_er', shape: 'rectangle', x: 158, y: 96 }
            ],
            pieces: [
              { id: 'ca2_2_q', type: 'white', value: 3, shadow: false, x: 84, y: 114 },
              { id: 'ca2_2_o', type: 'opal', value: 6, shadow: false, x: 118, y: 114 },
              { id: 'ca2_2_sr', type: 'white', value: 9, shadow: true, shape: 'rectangle', borderType: 'white', coreType: 'opal', x: 216, y: 96 }
            ]
          },
          {
            // Etapa 3: Trapézio Elétrico + Círculo Elétrico em síntese combinada
            stepTutorial: 'CAATINGA_TRAPEZOID',
            pureEq: { x: 102, y: 68, expanded: false },
            electricShapes: [
              { id: 'ca2_3_et', shape: 'trapezoid', x: 156, y: 78 },
              { id: 'ca2_3_ec', shape: 'circle', x: 156, y: 116 }
            ],
            pieces: [
              { id: 'ca2_3_c', type: 'citrine', value: 2, shadow: false, x: 82, y: 102 },
              { id: 'ca2_3_a', type: 'aqua', value: 4, shadow: false, x: 112, y: 102 },
              { id: 'ca2_3_r', type: 'rose', value: 3, shadow: false, x: 96, y: 122 },
              { id: 'ca2_3_st', type: 'citrine', value: 6, shadow: true, shape: 'trapezoid', borderType: 'citrine', coreType: 'aqua', x: 216, y: 78 },
              { id: 'ca2_3_sc', type: 'rose', value: 3, shadow: true, shape: 'circle', borderType: 'rose', coreType: 'rose', x: 216, y: 116 }
            ]
          }
        ],
        // FASE 3 (Nó 18): A Arte do Encaixe (Tesselação Básica)
        3: [
          {
            // Etapa 1: Quadrado + Quadrado -> Encaixe gerando Retângulo Cristalino -> Anula Retângulo Cristalino Sombrio
            pieces: [
              { id: 'ca3_1_sq1', type: 'citrine', value: 4, shadow: false, shape: 'square', borderType: 'citrine', coreType: 'rose', x: 94, y: 80 },
              { id: 'ca3_1_sq2', type: 'citrine', value: 4, shadow: false, shape: 'square', borderType: 'citrine', coreType: 'rose', x: 94, y: 114 },
              { id: 'ca3_1_sr', type: 'citrine', value: 8, shadow: true, shape: 'rectangle', borderType: 'citrine', coreType: 'rose', joinedSquares: true, x: 214, y: 96 }
            ]
          },
          {
            // Etapa 2: Síntese de Triângulo via cristais + conexão com Trapézio existente -> Forma Pentágono -> Anula Pentágono Sombrio
            pureEq: { x: 98, y: 68, expanded: false },
            electricShapes: [
              { id: 'ca3_2_etr', shape: 'triangle', x: 148, y: 78 }
            ],
            pieces: [
              { id: 'ca3_2_q', type: 'white', value: 2, shadow: false, x: 82, y: 104 },
              { id: 'ca3_2_r', type: 'rose', value: 2, shadow: false, x: 112, y: 104 },
              { id: 'ca3_2_trap', type: 'citrine', value: 5, shadow: false, shape: 'trapezoid', borderType: 'citrine', coreType: 'aqua', x: 148, y: 116 },
              { id: 'ca3_2_sp', type: 'citrine', value: 9, shadow: true, shape: 'pentagon', borderType: 'citrine', coreType: 'white', upperType: 'white', lowerType: 'aqua', triBorder: 'white', triCore: 'rose', trapBorder: 'citrine', trapCore: 'aqua', x: 216, y: 96 }
            ]
          },
          {
            // Etapa 3: Fusão de cristais + Quadrado Elétrico + Tesselação em cadeia
            pureEq: { x: 98, y: 68, expanded: false },
            electricShapes: [
              { id: 'ca3_3_es', shape: 'square', x: 148, y: 78 },
              { id: 'ca3_3_ec', shape: 'circle', x: 148, y: 116 }
            ],
            pieces: [
              { id: 'ca3_3_q1', type: 'white', value: 1, shadow: false, x: 76, y: 98 },
              { id: 'ca3_3_q2', type: 'white', value: 1, shadow: false, x: 98, y: 98 },
              { id: 'ca3_3_r', type: 'rose', value: 2, shadow: false, x: 120, y: 98 },
              { id: 'ca3_3_sq2', type: 'white', value: 4, shadow: false, shape: 'square', borderType: 'white', coreType: 'rose', x: 112, y: 120 },
              { id: 'ca3_3_c', type: 'citrine', value: 3, shadow: false, x: 82, y: 120 },
              { id: 'ca3_3_sr', type: 'white', value: 8, shadow: true, shape: 'rectangle', borderType: 'white', coreType: 'rose', joinedSquares: true, x: 216, y: 78 },
              { id: 'ca3_3_sc', type: 'citrine', value: 3, shadow: true, shape: 'circle', borderType: 'citrine', coreType: 'citrine', x: 216, y: 116 }
            ]
          }
        ],
        // FASE 4 (Nó 19): Geometria Avançada & Equações Aninhadas
        4: [
          {
            // Etapa 1: Múltiplos triângulos conectados aos pares para formar Losangos e anular pares sombrios
            pieces: [
              { id: 'ca4_1_t1', type: 'white', value: 3, shadow: false, shape: 'triangle', borderType: 'white', coreType: 'aqua', x: 88, y: 68 },
              { id: 'ca4_1_t2', type: 'white', value: 3, shadow: false, shape: 'triangle', borderType: 'white', coreType: 'aqua', x: 122, y: 68 },
              { id: 'ca4_1_t3', type: 'rose', value: 4, shadow: false, shape: 'triangle', borderType: 'rose', coreType: 'citrine', x: 88, y: 114 },
              { id: 'ca4_1_t4', type: 'rose', value: 4, shadow: false, shape: 'triangle', borderType: 'rose', coreType: 'citrine', x: 122, y: 114 },
              { id: 'ca4_1_sr1', type: 'white', value: 6, shadow: true, shape: 'rhombus', borderType: 'white', coreType: 'aqua', x: 216, y: 76 },
              { id: 'ca4_1_sr2', type: 'rose', value: 8, shadow: true, shape: 'rhombus', borderType: 'rose', coreType: 'citrine', x: 216, y: 114 }
            ]
          },
          {
            // Etapa 2: Construção progressiva de um Hexágono completo a partir de 6 triângulos equiláteros conectados radialmente
            pieces: [
              { id: 'ca4_2_t1', type: 'citrine', value: 2, shadow: false, shape: 'triangle', borderType: 'citrine', coreType: 'white', subTriangles: 1, x: 82, y: 68 },
              { id: 'ca4_2_t2', type: 'citrine', value: 2, shadow: false, shape: 'triangle', borderType: 'citrine', coreType: 'white', subTriangles: 1, x: 114, y: 68 },
              { id: 'ca4_2_t3', type: 'citrine', value: 2, shadow: false, shape: 'triangle', borderType: 'citrine', coreType: 'white', subTriangles: 1, x: 146, y: 68 },
              { id: 'ca4_2_t4', type: 'citrine', value: 2, shadow: false, shape: 'triangle', borderType: 'citrine', coreType: 'white', subTriangles: 1, x: 82, y: 112 },
              { id: 'ca4_2_t5', type: 'citrine', value: 2, shadow: false, shape: 'triangle', borderType: 'citrine', coreType: 'white', subTriangles: 1, x: 114, y: 112 },
              { id: 'ca4_2_t6', type: 'citrine', value: 2, shadow: false, shape: 'triangle', borderType: 'citrine', coreType: 'white', subTriangles: 1, x: 146, y: 112 },
              { id: 'ca4_2_sh', type: 'citrine', value: 12, shadow: true, shape: 'hexagon', borderType: 'citrine', coreType: 'white', x: 216, y: 92 }
            ]
          },
          {
            // Etapa 3: Quebra-cabeça mestre com Equações Aninhadas em Formas (formas geométricas dentro da Equação Cristalina)
            pureEq: { x: 116, y: 72, expanded: false },
            shadowEq: { x: 210, y: 72, expanded: false },
            electricShapes: [
              { id: 'ca4_3_ec', shape: 'circle', x: 148, y: 114 }
            ],
            pieces: [
              { id: 'ca4_3_t1', type: 'aqua', value: 2, shadow: false, shape: 'triangle', borderType: 'aqua', coreType: 'white', x: 78, y: 114 },
              { id: 'ca4_3_t2', type: 'aqua', value: 2, shadow: false, shape: 'triangle', borderType: 'aqua', coreType: 'white', x: 104, y: 114 },
              { id: 'ca4_3_c', type: 'rose', value: 3, shadow: false, x: 126, y: 114 },
              { id: 'ca4_3_sr', type: 'aqua', value: 4, shadow: true, shape: 'rhombus', borderType: 'aqua', coreType: 'white', x: 200, y: 72, inEquation: 'shadow' },
              { id: 'ca4_3_sc', type: 'rose', value: 3, shadow: true, shape: 'circle', borderType: 'rose', coreType: 'rose', x: 220, y: 72, inEquation: 'shadow' }
            ]
          }
        ],
        // FASE 5 (Nó 20): Sala do Minigame Final da Caatinga — O Desafio das Areias (6 Rodadas das Cúpulas)
        5: [
          {
            pieces: [
              { id: 'ca5_shell_opal_left', type: 'opal', value: 1, shadow: false, x: 116, y: 104 },
              { id: 'ca5_shell_opal_right', type: 'opal', value: 1, shadow: false, x: 204, y: 104 }
            ]
          }
        ]
      }
    },

    sanctuary: {
      key: 'sanctuary',
      worldIndex: 5,
      hudLabel: 'Porta',
      customHudTitle: 'Porta - Final',
      guardianKey: 'ordem',
      guardianName: 'Ordem',
      guardianPortrait: 'portrait_ordem',
      socketKey: null,
      nextBiome: 'kingdom',
      nextWorldButton: 'Voltar ao Mapa >',
      worldClearedTitle: 'Sinfonia Completa!',
      worldClearedLine1: 'A Porta das Gemas abriu o Reino!',
      worldClearedLine2: 'Todos os quatro biomas cantam em paz!',
      phaseClearedLine: 'O Portão Ancestral despertou!',
      nodeSyncByLevel: {
        1: { ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21], next: 21 }
      },
      introDialogues: {
        1: [
          { speaker: 'Ordem', portrait: 'portrait_ordem', text: 'De volta ao Santuário da Caverna! As 4 Gemas Primordiais estão reunidas!' },
          { speaker: 'Araci', portrait: 'portrait_araci', text: 'A força viva da Floresta pulsa neste altar!' },
          { speaker: 'Irecê', portrait: 'portrait_irece', text: 'As Águas Claras fluem em harmonia com cada cristal!' },
          { speaker: 'Jurema', portrait: 'portrait_jurema', text: 'E o calor da Caatinga ilumina os quatro selos ancestrais!' },
          { speaker: 'Protagonista', portrait: 'portrait_protagonist', text: 'Vamos resolver a Grande Harmonia e abrir a Porta das Gemas!' }
        ]
      },
      postDialogues: {
        1: [
          { speaker: 'Ordem', portrait: 'portrait_ordem', text: 'A Porta das Gemas se abriu! O Reino inteiro voltou a florescer!' },
          { speaker: 'Protagonista', portrait: 'portrait_protagonist', text: 'Conseguimos! A Sinfonia dos Cristais está completa!' }
        ]
      },
      tutorialsByLevel: {},
      musicalCaptions: [
        [0.5, 9.0, 'Quatro vozes unidas no altar ancestral, despertando a memória de cada cristal!'],
        [9.5, 18.5, 'Da Caverna à Floresta, do Rio ao Sertão, a sombra desfez-se diante da união!'],
        [19.0, 28.0, 'Abre-se o Portão em acordes de luz, a grande sinfonia o Reino conduz!'],
        [28.5, 39.0, 'Ordem, Araci, Irecê e Jurema a cantar: o que um cristal unido é capaz de curar!'],
        [39.5, 55.5, 'Renasce a natureza em perfeita harmonia — viva para sempre a nossa Sinfonia!']
      ],
      levels: {
        1: [
          {
            emeraldAltar: { x: 146, y: 108 },
            pieces: [
              { id: 'sa1_1_q', type: 'white', value: 2, shadow: false, x: 88, y: 82 },
              { id: 'sa1_1_c', type: 'citrine', value: 4, shadow: false, x: 88, y: 114 },
              { id: 'sa1_1_sq', type: 'white', value: 4, shadow: true, x: 204, y: 68 },
              { id: 'sa1_1_sc1', type: 'citrine', value: 2, shadow: true, x: 204, y: 96 },
              { id: 'sa1_1_sc2', type: 'citrine', value: 2, shadow: true, x: 204, y: 122 }
            ]
          },
          {
            emeraldAltar: { x: 146, y: 114 },
            pureEq: { x: 110, y: 74, expanded: false },
            shadowEq: { x: 198, y: 74, expanded: false },
            pieces: [
              { id: 'sa1_2_r', type: 'rose', value: 3, shadow: false, x: 82, y: 114 },
              { id: 'sa1_2_a', type: 'aqua', value: 4, shadow: false, x: 106, y: 114 },
              { id: 'sa1_2_o', type: 'opal', value: 1, shadow: false, x: 124, y: 98 },
              { id: 'sa1_2_sr', type: 'rose', value: 5, shadow: true, x: 190, y: 74, inEquation: 'shadow' },
              { id: 'sa1_2_sa', type: 'aqua', value: 2, shadow: true, x: 208, y: 74, inEquation: 'shadow' },
              { id: 'sa1_2_sl', type: 'aqua', value: 2, shadow: true, x: 204, y: 116 }
            ]
          },
          {
            emeraldAltar: { x: 144, y: 116 },
            pureEq: { x: 108, y: 74, expanded: false },
            shadowEq: { x: 198, y: 74, expanded: false },
            pieces: [
              { id: 'sa1_3_q', type: 'white', value: 2, shadow: false, x: 76, y: 114 },
              { id: 'sa1_3_a', type: 'aqua', value: 2, shadow: false, x: 98, y: 114 },
              { id: 'sa1_3_c', type: 'citrine', value: 6, shadow: false, x: 118, y: 98 },
              { id: 'sa1_3_o', type: 'opal', value: 1, shadow: false, x: 76, y: 88 },
              { id: 'sa1_3_sq', type: 'white', value: 4, shadow: true, x: 190, y: 74, inEquation: 'shadow' },
              { id: 'sa1_3_sc', type: 'citrine', value: 2, shadow: true, x: 208, y: 74, inEquation: 'shadow' },
              { id: 'sa1_3_sl1', type: 'citrine', value: 3, shadow: true, x: 196, y: 116 },
              { id: 'sa1_3_sl2', type: 'aqua', value: 4, shadow: true, x: 214, y: 102 }
            ]
          }
        ]
      }
    }
  };

  // ============================================================================
  // 6. CONTROLADOR DOS MUNDOS 2, 3, 4 E PORTÃO FINAL (`TruePixelWorlds`)
  // ============================================================================
  const TruePixelWorlds = {
    canvas: null,
    ctx: null,
    running: false,
    _inLoop: false,
    _rafId: null,
    t: 0,
    lastNow: 0,
    phase: 'idle',
    phaseTime: 0,
    musicalTime: 0,
    cloudPopTime: -1,
    musicAudio: null,

    worldKey: 'forest',
    currentLevel: 1,
    currentStep: 1,
    totalSteps: 2,
    campaignNodeId: 6,

    protag: { x: 34, y: 142, state: 'idle' },
    ordemCompanion: { x: 52, y: 142, state: 'idle', visible: true, flipX: false },
    guardianActor: { x: 160, y: 142, state: 'idle', visible: false, flipX: false },

    obstacleDecay: 0,
    targetObstacleDecay: 0,
    giantCrystalFlash: false,
    giantCrystalBroken: false,
    gateOpenRatio: 0,
    waveOrigin: { x: 160, y: 90 },
    waveRadius: 0,
    waveActive: false,

    pieces: [],
    electricShapes: [],
    floatingBanners: [],
    selectedPiece: null,
    tutorialHighlightId: null,
    disableOpalDrain: false,
    camPanY: 0,
    shellGame: null,
    shellCalmBtnRect: { x: 8, y: 23, w: 98, h: 14 },
    emeraldAltar: null,
    pureEquation: null,
    shadowEquation: null,
    fractionPlatform: null,
    riverMelody: null,
    draggedPiece: null,
    dragStartPos: null,
    dragMovedDist: 0,
    equationPointer: null,
    magneticAnim: null,
    opalDrainTimer: 0,
    opalStepInterval: 0.42,
    shards: [],

    SOLID_MIN_DIST: 18,
    ANNUL_CONTACT_DIST: 19,
    STAGE_MIN_X: 62,
    STAGE_MAX_X: 242,
    STAGE_MIN_Y: 42,
    STAGE_MAX_Y: 125,

    completeBtnRect: { x: 108, y: 115, w: 104, h: 15 },
    skipMusicalBtnRect: { x: 92, y: 2, w: 58, h: 16 },
    gameOverBtnRect: { x: 96, y: 118, w: 128, h: 16 },
    forestSlashBtnRect: null,
    _exitIrisStarted: false,
    _bound: false,
    WORLD_SPECS,

    getSpec() {
      return WORLD_SPECS[this.worldKey] || WORLD_SPECS.forest;
    },

    isWorldFinale() {
      return this.worldKey === 'sanctuary' || this.currentLevel === 5;
    },

    init() {
      this.canvas = this.ensureCanvas();
      this.ctx = this.canvas.getContext('2d');
      this.ctx.imageSmoothingEnabled = false;
      this.bindInput();
    },

    ensureCanvas() {
      if (global.CaveChapter1 && typeof global.CaveChapter1.ensureCanvas === 'function') {
        return global.CaveChapter1.ensureCanvas();
      }
      let cv = document.getElementById('truePixelScreen');
      if (!cv) {
        cv = document.createElement('canvas');
        cv.id = 'truePixelScreen';
        cv.width = HW;
        cv.height = HH;
        cv.style.cssText = [
          'position:fixed', 'left:50%', 'top:50%', 'transform:translate(-50%,-50%)',
          'display:block', 'z-index:40', 'image-rendering:pixelated', 'image-rendering:crisp-edges',
          'background:#05030f', 'box-shadow:0 0 0 100vmax #05030f', 'cursor:pointer', 'touch-action:none',
          '-webkit-tap-highlight-color:transparent', '-webkit-touch-callout:none', '-webkit-user-select:none', 'user-select:none'
        ].join(';');
        document.body.appendChild(cv);
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
      const vw = typeof window !== 'undefined' && window.innerWidth ? Math.max(320, window.innerWidth) : 320;
      const vh = typeof window !== 'undefined' && window.innerHeight ? Math.max(180, window.innerHeight) : 180;
      const isMapIris = this.phase === 'map_iris_in' || global.CaveChapter1?.phase === 'map_iris_in';
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

    isActiveGame() {
      return Boolean(this.running && this.phase !== 'map_iris_in' && this.phase !== 'map_active');
    },

    deactivateCanvas() {
      this.stopMusicAudio();
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
      global.CaveChapter1?.deactivateCanvas?.();
      global.CaveChapter1?.stopMusicAudio?.();
      global.CrystalMenuAudio?.pause?.();
      global.CrystalAudio?.stopAllMusic?.(this.regularAudio || this.musicAudio);
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

      const spec = this.getSpec();
      DialogueBox.sockets.fairy = true;
      DialogueBox.syncSocketsFromCompleted?.(global.CrystalApp?.state?.completed);
      if (this.worldKey === 'river' || this.worldKey === 'caatinga' || this.worldKey === 'sanctuary') {
        DialogueBox.sockets.forest = true;
      }
      if (this.worldKey === 'caatinga' || this.worldKey === 'sanctuary') {
        DialogueBox.sockets.river = true;
      }
      if (this.worldKey === 'sanctuary') {
        DialogueBox.sockets.caatinga = true;
      }

      GameHUD.worldLabel = spec.hudLabel;
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
        const maxLvl = this.worldKey === 'sanctuary' ? 1 : 5;
        const inSpecial = this.phase === 'musical_part1_shadows' || this.phase === 'musical_part2_bright' ||
          Boolean(this.forestNinja) || Boolean(this.riverMelody) || Boolean(this.shellGame) ||
          this.currentLevel === maxLvl;

        if (this.musicAudio) {
          this.musicAudio.muted = !!muted || vol <= 0;
          this.musicAudio.volume = vol;
          if (inSpecial) {
            if (muted || vol <= 0 || GameHUD.paused || GameHUD.settingsOpen) {
              try { this.musicAudio.pause(); } catch (_) {}
            } else if (this.musicAudio.paused && this.running && this.phase !== 'map_active') {
              try { this.musicAudio.play().catch(() => {}); } catch (_) {}
            }
          } else {
            try { this.musicAudio.pause(); } catch (_) {}
          }
        }
        if (this.regularAudio) {
          this.regularAudio.muted = !!muted || vol <= 0;
          this.regularAudio.volume = vol;
          if (!inSpecial) {
            if (muted || vol <= 0 || GameHUD.paused || GameHUD.settingsOpen) {
              try { this.regularAudio.pause(); } catch (_) {}
            } else if (this.regularAudio.paused && this.running && this.phase !== 'map_active') {
              try { this.regularAudio.play().catch(() => {}); } catch (_) {}
            }
          } else {
            try { this.regularAudio.pause(); } catch (_) {}
          }
        }
      };

      GameHUD.paused = false;
      GameHUD.settingsOpen = false;
      GameHUD.syncAudio();
    },

    // ==========================================================================
    // ROTEAMENTO POR NÓ DO MAPA (6..21) OU POR MUNDO + FASE
    // ==========================================================================
    resolveNodeToWorldLevel(nodeId) {
      const id = Number(nodeId) || 6;
      if (id >= 6 && id <= 10) {
        return { worldKey: 'forest', levelNum: id - 5, nodeId: id };
      }
      if (id >= 11 && id <= 15) {
        return { worldKey: 'river', levelNum: id - 10, nodeId: id };
      }
      if (id >= 16 && id <= 20) {
        return { worldKey: 'caatinga', levelNum: id - 15, nodeId: id };
      }
      return { worldKey: 'sanctuary', levelNum: 1, nodeId: 21 };
    },

    startByCampaignNode(nodeId) {
      const target = this.resolveNodeToWorldLevel(nodeId);
      this.startWorldLevel(target.worldKey, target.levelNum, target.nodeId);
    },

    startFinalGate() {
      this.startWorldLevel('sanctuary', 1, 21);
    },

    startWorldLevel(worldKey, levelNum = 1, nodeId = null) {
      this.worldKey = WORLD_SPECS[worldKey] ? worldKey : 'forest';
      const spec = this.getSpec();
      const maxLvl = this.worldKey === 'sanctuary' ? 1 : 5;
      this.currentLevel = clamp(levelNum, 1, maxLvl);
      const stepList = spec.levels[this.currentLevel] || spec.levels[1];
      this.totalSteps = stepList.length;
      this.currentStep = 1;
      this.campaignNodeId = nodeId || (spec.nodeSyncByLevel[this.currentLevel]?.ids?.slice(-1)[0] || 6);

      this.prepareCanvasForGame();
      DialogueBox.close();
      TutorialModal.close();
      this.stopMusicAudio();
      this.stopRegularBgm();

      this.phase = 'cutscene_enter';
      this.phaseTime = 0;
      this.obstacleDecay = 0;
      this.targetObstacleDecay = 0;
      this.giantCrystalFlash = false;
      this.giantCrystalBroken = false;
      this.gateOpenRatio = 0;
      this.waveActive = false;
      this.waveRadius = 0;
      this.pieces = [];
      this.electricShapes = [];
      this.floatingBanners = [];
      this.selectedPiece = null;
      this.shellGame = null;
      this.camPanY = (this.worldKey === 'caatinga' && this.currentLevel === 1) ? -14 : 0;
      this.emeraldAltar = null;
      this.pureEquation = null;
      this.shadowEquation = null;
      this.magneticAnim = null;
      this.draggedPiece = null;
      this.equationPointer = null;
      this.shards = [];
      this.setupStep(1);

      if (this.phase === 'cutscene_enter') {
        this.protag.x = -12;
        this.protag.y = 142;
        this.protag.state = 'walk';
        this.ordemCompanion.visible = true;
        this.ordemCompanion.x = -28;
        this.ordemCompanion.y = 142;
        this.ordemCompanion.state = 'walk';
        this.ordemCompanion.flipX = false;
      } else {
        this.protag.x = 30;
        this.protag.y = 142;
        this.protag.state = 'idle';
        this.ordemCompanion.visible = true;
        this.ordemCompanion.x = 48;
        this.ordemCompanion.y = 142;
        this.ordemCompanion.state = 'idle';
        this.ordemCompanion.flipX = false;
      }
      this.guardianActor.visible = false;

      IrisTransition.start('in', 44, 126, 0.65);
      if (this.currentLevel < maxLvl) {
        this.playRegularBgm();
      } else {
        this.playSpecialBgm();
      }

      if (!this.running) {
        this.running = true;
        this.lastNow = typeof performance !== 'undefined' ? performance.now() : 0;
        requestAnimationFrame((now) => this.loop(now));
      }
    },

    restartCurrentPhase() {
      this.prepareCanvasForGame();
      DialogueBox.close();
      TutorialModal.close();
      this.stopMusicAudio();
      this.stopRegularBgm();
      GameHUD.paused = false;
      GameHUD.settingsOpen = false;
      this.draggedPiece = null;
      this.dragStartPos = null;
      this.equationPointer = null;
      this.magneticAnim = null;
      this.clearTrembleStates();
      this.shards = [];
      this.waveActive = false;
      this.waveRadius = 0;
      this.obstacleDecay = 0;
      this.targetObstacleDecay = 0;
      this.giantCrystalFlash = false;
      this.giantCrystalBroken = false;
      this.gateOpenRatio = 0;
      this.guardianActor.visible = false;

      if (this.phase === 'musical_part1_shadows' || this.phase === 'musical_part2_bright') {
        this.startMusicalShow();
        IrisTransition.start('in', 160, 90, 0.45);
        return;
      }

      this.stopMusicAudio();
      this.shellGame = null;
      this.riverMelody = null;
      this.forestNinja = null;
      this.fractionPlatform = null;
      this.selectedPiece = null;

      if (this.worldKey === 'forest' && this.currentLevel === 5) {
        this.startForestNinjaGame();
        IrisTransition.start('in', 160, 90, 0.45);
        return;
      }
      if (this.worldKey === 'river' && this.currentLevel === 5) {
        this.startRiverMelodyGame();
        IrisTransition.start('in', 160, 90, 0.45);
        return;
      }
      if (this.worldKey === 'caatinga' && this.currentLevel === 5) {
        this.startShellGame();
        IrisTransition.start('in', 160, 90, 0.45);
        return;
      }
      this.floatingBanners = [];
      this.camPanY = 0;
      this.currentStep = 1;
      this.protag.x = 30;
      this.protag.y = 142;
      this.protag.state = 'idle';
      this.ordemCompanion.visible = true;
      this.ordemCompanion.x = 48;
      this.ordemCompanion.y = 142;
      this.ordemCompanion.state = 'idle';

      this.setupStep(1);
      this.phase = 'gameplay';
      this.phaseTime = 0;
      this.spawnShatter(160, 90, 'pure', 14);
      GameHUD.playSfx('start');
      IrisTransition.start('in', 160, 90, 0.45);
      const maxLvl = this.worldKey === 'sanctuary' ? 1 : 5;
      if (this.currentLevel < maxLvl) {
        this.playRegularBgm();
      } else {
        this.playSpecialBgm();
      }

      if (!this.running) {
        this.running = true;
        this.lastNow = typeof performance !== 'undefined' ? performance.now() : 0;
        requestAnimationFrame((now) => this.loop(now));
      }
    },

    setupStep(stepNum) {
      const spec = this.getSpec();
      const stepList = spec.levels[this.currentLevel] || spec.levels[1];
      this.totalSteps = stepList.length;
      this.currentStep = clamp(stepNum, 1, this.totalSteps);
      const stepDef = stepList[this.currentStep - 1];

      this.opalDrainTimer = 0;
      this.magneticAnim = null;
      this.selectedPiece = null;
      this.tessellationPreview = null;
      this.tutorialHighlightId = stepDef.tutorialHighlightId || null;
      this.disableOpalDrain = Boolean(stepDef.disableOpalDrain);
      this.emeraldAltar = stepDef.emeraldAltar ? { x: stepDef.emeraldAltar.x, y: stepDef.emeraldAltar.y } : null;
      this.pureEquation = stepDef.pureEq ? { x: stepDef.pureEq.x, y: stepDef.pureEq.y, expanded: Boolean(stepDef.pureEq.expanded) } : null;
      this.shadowEquation = stepDef.shadowEq ? { x: stepDef.shadowEq.x, y: stepDef.shadowEq.y, expanded: Boolean(stepDef.shadowEq.expanded) } : null;
      this.fractionPlatform = stepDef.fractionPlatform ? {
        x: stepDef.fractionPlatform.x,
        y: stepDef.fractionPlatform.y,
        topY: stepDef.fractionPlatform.y - 18,
        bottomY: stepDef.fractionPlatform.y + 18,
        w: stepDef.fractionPlatform.w || 64,
        h: stepDef.fractionPlatform.h || 52,
        resultType: stepDef.fractionPlatform.resultType || 'aqua',
        resultValue: stepDef.fractionPlatform.resultValue || 1,
        glowing: false,
        broken: false,
        topHover: false,
        bottomHover: false,
        topPieces: [],
        bottomPieces: [],
        topSum: 0,
        bottomSum: 0
      } : null;
      this.electricShapes = (stepDef.electricShapes || []).map((es) => ({
        id: es.id,
        shape: es.shape,
        x: es.x,
        y: es.y,
        used: false,
        barrierUntil: 0,
        hover: false
      }));
      this.pieces = (stepDef.pieces || []).map((p) => ({
        id: p.id,
        type: p.type,
        value: p.value,
        shadow: Boolean(p.shadow),
        boosted: Boolean(p.boosted),
        inEquation: p.inEquation || null,
        inFraction: p.inFraction || null,
        shape: p.shape || null,
        borderType: p.borderType || null,
        coreType: p.coreType || null,
        upperType: p.upperType || null,
        lowerType: p.lowerType || null,
        triBorder: p.triBorder || null,
        triCore: p.triCore || null,
        trapBorder: p.trapBorder || null,
        trapCore: p.trapCore || null,
        joinedSquares: Boolean(p.joinedSquares),
        subTriangles: p.subTriangles || 0,
        rotAngle: 0,
        targetRotAngle: 0,
        components: p.components ? p.components.map((c) => ({ ...c })) : null,
        sourceNodeId: p.sourceNodeId || null,
        x: p.x,
        y: p.y
      }));

      if (this.fractionPlatform) {
        this.fractionPlatform.topPieces = this.pieces.filter((p) => p.inFraction === 'top');
        this.fractionPlatform.bottomPieces = this.pieces.filter((p) => p.inFraction === 'bottom');
        this.layoutFractionPieces();
        this.updateFractionPlatformState();
      }
      if (this.worldKey === 'river' && this.currentLevel === 5) {
        this.startRiverMelodyGame();
      }
      if (this.worldKey === 'forest' && this.currentLevel === 5) {
        this.startForestNinjaGame();
      }
      if (this.worldKey === 'caatinga' && this.currentLevel === 5) {
        this.startShellGame();
      }

      if (this.pureEquation) this.layoutEquationPieces(this.pureEquation, 'pure');
      if (this.shadowEquation) this.layoutEquationPieces(this.shadowEquation, 'shadow');
      this.resolveFreeCrystalCollisions();

      if (stepNum > 1 && stepDef.stepTutorial && StandardTutorialCards[stepDef.stepTutorial]) {
        const cards = StandardTutorialCards[stepDef.stepTutorial];
        if (cards && cards.length) {
          this.phase = 'tutorial';
          TutorialModal.open(cards, () => {
            this.phase = 'gameplay';
            this.phaseTime = 0;
          }, true);
        }
      }
    },

    openIntroIfAny() {
      const spec = this.getSpec();
      const lines = spec.introDialogues && spec.introDialogues[this.currentLevel];
      const tutKey = spec.tutorialsByLevel && spec.tutorialsByLevel[this.currentLevel];

      const launchTutorialOrPlay = () => {
        if (this.worldKey === 'forest' && this.currentLevel === 5) {
          this.startForestNinjaGame();
          return;
        }
        if (this.worldKey === 'river' && this.currentLevel === 5) {
          this.startRiverMelodyGame();
          return;
        }
        if (this.worldKey === 'caatinga' && this.currentLevel === 5) {
          this.startShellGame();
          return;
        }
        this.setupStep(1);
        const cards = tutKey && StandardTutorialCards[tutKey];
        if (cards && cards.length) {
          this.phase = 'tutorial';
          TutorialModal.open(cards, () => {
            this.phase = 'gameplay';
            this.phaseTime = 0;
          }, true);
        } else {
          this.phase = 'gameplay';
          this.phaseTime = 0;
        }
      };

      if (lines && lines.length) {
        this.phase = 'intro_dialogue';
        this.phaseTime = 0;
        this.protag.state = this.currentLevel === 5 ? 'shock' : 'idle';
        DialogueBox.open(lines, () => {
          this.protag.state = 'idle';
          launchTutorialOrPlay();
        });
      } else {
        launchTutorialOrPlay();
      }
    },

    // ==========================================================================
    // FÍSICA TÁTIL DE CRISTAIS, ALTAR DE ESMERALDA, DIVISÃO E EQUAÇÕES
    // ==========================================================================
    spawnShatter(cx, cy, setKey = 'pure', count = 10) {
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2 + (i % 3) * 0.2;
        const spd = 28 + (i % 4) * 18;
        this.shards.push({
          x0: cx,
          y0: cy,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 48,
          floorY: 138,
          t0: this.t,
          v: i & 3,
          set: setKey
        });
      }
      if (this.shards.length > 96) {
        this.shards.splice(0, this.shards.length - 96);
      }
    },

    isInsideEquationAura(eq, x, y, allowReception = false) {
      if (!eq || eq.broken) return false;
      const rx = (eq.expanded || allowReception) ? 48 : 30;
      const ry = (eq.expanded || allowReception) ? 28 : 18;
      const dx = (x - eq.x) / rx, dy = (y - eq.y) / ry;
      return dx * dx + dy * dy <= 1.08;
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

    arePiecesEquivalent(purePiece, shadowPiece) {
      if (!purePiece || !shadowPiece) return false;
      if (purePiece.value !== shadowPiece.value) return false;
      const pShape = purePiece.shape || null;
      const sShape = shadowPiece.shape || null;
      if (pShape !== sShape) return false;
      if (sShape) {
        const pBorder = purePiece.borderType || purePiece.type || 'white';
        const sBorder = shadowPiece.borderType || shadowPiece.type || 'white';
        const pCore = purePiece.coreType || purePiece.type || 'white';
        const sCore = shadowPiece.coreType || shadowPiece.type || 'white';
        if (pBorder !== sBorder || pCore !== sCore) return false;
        if (sShape === 'pentagon') {
          if (shadowPiece.triBorder && (purePiece.triBorder || purePiece.upperType || pCore) !== shadowPiece.triBorder) return false;
          if (shadowPiece.triCore && (purePiece.triCore || purePiece.upperType || pCore) !== shadowPiece.triCore) return false;
          if (shadowPiece.trapBorder && (purePiece.trapBorder || pBorder) !== shadowPiece.trapBorder) return false;
          if (shadowPiece.trapCore && (purePiece.trapCore || purePiece.lowerType || pBorder) !== shadowPiece.trapCore) return false;
          if (shadowPiece.upperType && shadowPiece.lowerType) {
            const pUp = purePiece.upperType || pCore;
            const pLow = purePiece.lowerType || pBorder;
            if (pUp !== shadowPiece.upperType || pLow !== shadowPiece.lowerType) return false;
          }
        }
        return true;
      }
      return purePiece.type === shadowPiece.type;
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
      return this.arePiecesEquivalent(purePiece, candidate);
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
      purePiece.dragging = false;
      if (this.draggedPiece === purePiece) {
        this.draggedPiece = null;
        this.dragStartPos = null;
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
      const shardSet = SHARD_SPR[purePiece.type] ? purePiece.type : 'pure';
      this.spawnShatter(shadowTarget.x, shadowTarget.y, shardSet, 12);
      this.spawnShatter(shadowTarget.x, shadowTarget.y, 'shadow', 12);

      this.checkIfAllStepTargetsCleared(shadowTarget.x, shadowTarget.y);
      if (this.phase === 'gameplay') {
        this.checkEquationSolved();
        this.triggerDefeatIfImpossible();
      }
      return true;
    },

    checkEmeraldAltarBlessing(piece) {
      if (!this.emeraldAltar || !piece || piece.shadow || piece.broken || piece.value <= 0) return false;
      if (piece.type === 'opal' || piece.boosted || piece.value * 2 > 6) return false;
      if (Math.hypot(piece.x - this.emeraldAltar.x, piece.y - this.emeraldAltar.y) <= 22) {
        piece.value = clamp(piece.value * 2, 1, 6);
        piece.boosted = true;
        piece.lastValChangeAt = this.t;
        GameHUD.playSfx('reward');
        this.spawnShatter(this.emeraldAltar.x, this.emeraldAltar.y, 'emerald', 10);
        const hit = this.findTouchingCompatibleShadow(piece, piece.x, piece.y);
        if (hit) {
          this.triggerImmediateAnnulment(piece, hit);
        }
        return true;
      }
      return false;
    },

    trySplitCrystalOnTap(piece) {
      if (!piece || piece.shadow || piece.broken || piece.inFraction || piece.value < 2 || piece.value % 2 !== 0) return false;
      if (piece.type !== 'citrine' && piece.type !== 'aqua') return false;

      const half = piece.value / 2;
      piece.value = half;
      piece.lastValChangeAt = this.t;
      const origX = piece.x, origY = piece.y;
      piece.x = clamp(origX - 10, this.STAGE_MIN_X, this.STAGE_MAX_X);

      const clone = {
        id: `${piece.id}_sp_${Math.floor(this.t * 1000)}_${this.pieces.length}`,
        type: piece.type,
        value: half,
        shadow: false,
        boosted: Boolean(piece.boosted),
        inEquation: piece.inEquation || null,
        lastValChangeAt: this.t,
        x: clamp(origX + 10, this.STAGE_MIN_X, this.STAGE_MAX_X),
        y: origY
      };
      this.pieces.push(clone);

      GameHUD.playSfx('shatter');
      this.spawnShatter(origX, origY, piece.type === 'citrine' ? 'citrine' : 'aqua', 8);

      if (piece.inEquation === 'pure' && this.pureEquation && !this.pureEquation.broken) {
        this.layoutEquationPieces(this.pureEquation, 'pure');
      } else {
        this.resolveFreeCrystalCollisions();
      }

      for (const candidate of [piece, clone]) {
        if (!candidate.broken) {
          const hit = this.findTouchingCompatibleShadow(candidate, candidate.x, candidate.y);
          if (hit) this.triggerImmediateAnnulment(candidate, hit);
        }
      }
      if (this.phase === 'gameplay') {
        this.checkEquationSolved();
        this.triggerDefeatIfImpossible();
      }
      return true;
    },

    moveDraggedPieceWithCollision(piece, rawX, rawY) {
      if (!piece || piece.broken || piece.value <= 0 || piece.inFraction) return { annulled: false };

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

        const shadowHit = this.findTouchingCompatibleShadow(piece, nx, ny);
        if (shadowHit) {
          piece.x = nx;
          piece.y = ny;
          this.triggerImmediateAnnulment(piece, shadowHit);
          return { annulled: true };
        }

        let blockedDead = false;
        for (let iter = 0; iter < 6; iter++) {
          let anyOverlap = false;
          for (let i = 0; i < this.pieces.length; i++) {
            const other = this.pieces[i];
            if (
              other === piece ||
              other.broken ||
              other.value <= 0 ||
              other.inFraction ||
              this.isCompatibleShadowTarget(piece, other, nx, ny)
            ) {
              continue;
            }
            const canFormEq = !piece.shape && !other.shape && piece.type !== 'opal' && other.type !== 'opal' &&
              !other.shadow && (piece.type !== other.type || other.inEquation === 'pure') &&
              (this.pureEquation || this.shadowEquation || (this.electricShapes && this.electricShapes.length > 0));
            const effMinD = ((piece.shape && other.shape && this.getTessellationMatch(other, piece)) || canFormEq) ? 10 : minD;
            const dx = nx - other.x;
            const dy = ny - other.y;
            const d = Math.hypot(dx, dy);
            if (d < effMinD) {
              anyOverlap = true;
              const ux = d > 1e-4 ? dx / d : 1;
              const uy = d > 1e-4 ? dy / d : 0;
              if (iter === 0) {
                const mvX = nx - curX, mvY = ny - curY;
                const vn = mvX * ux + mvY * uy;
                if (vn < 0) {
                  const vtX = mvX - vn * ux, vtY = mvY - vn * uy;
                  if (Math.hypot(vtX, vtY) <= Math.abs(vn) * 0.25 && Math.hypot(curX - other.x, curY - other.y) <= effMinD + 0.05) {
                    blockedDead = true;
                    break;
                  }
                }
              }
              nx = other.x + ux * effMinD;
              ny = other.y + uy * effMinD;
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
          if (other === piece || other.broken || other.value <= 0 || other.inFraction || this.isCompatibleShadowTarget(piece, other, nx, ny)) {
            continue;
          }
          const canFormEq = !piece.shape && !other.shape && piece.type !== 'opal' && other.type !== 'opal' &&
            !other.shadow && (piece.type !== other.type || other.inEquation === 'pure') &&
            (this.pureEquation || this.shadowEquation || (this.electricShapes && this.electricShapes.length > 0));
          const effMinD = ((piece.shape && other.shape && this.getTessellationMatch(other, piece)) || canFormEq) ? 10 : minD;
          if (Math.hypot(nx - other.x, ny - other.y) < effMinD - 0.04) {
            valid = false;
            break;
          }
        }
        if (!valid) break;

        curX = nx;
        curY = ny;
        piece.x = curX;
        piece.y = curY;

        if (this.checkEmeraldAltarBlessing(piece)) {
          if (piece.broken || this.phase !== 'gameplay') return { annulled: true };
        }

        if (!piece.shape && !piece.inEquation && this.electricShapes && this.electricShapes.length > 0) {
          for (const es of this.electricShapes) {
            if (!es.used && es.shape === 'circle' && Math.hypot(curX - es.x, curY - es.y) <= 14) {
              this.tryEnterElectricShapeNode(es, [piece]);
              curX = piece.x;
              curY = piece.y;
              if (piece.broken || this.phase !== 'gameplay') return { annulled: true };
              break;
            }
          }
        }

        const postHit = this.findTouchingCompatibleShadow(piece, curX, curY);
        if (postHit) {
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
      const members = this.pieces.filter((p) => !p.broken && p.value > 0 && p.inEquation === 'pure');
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
      const others = this.pieces.filter((p) => !p.broken && p.value > 0 && p.inEquation !== 'pure');
      const canShiftBy = (dx, dy) => {
        for (let m = 0; m < members.length; m++) {
          const mx = members[m].x + dx, my = members[m].y + dy;
          if (mx < this.STAGE_MIN_X || mx > this.STAGE_MAX_X || my < this.STAGE_MIN_Y || my > this.STAGE_MAX_Y) return false;
          for (let o = 0; o < others.length; o++) {
            if (Math.hypot(mx - others[o].x, my - others[o].y) < minD - 0.04) return false;
          }
        }
        return true;
      };

      const steps = Math.max(1, Math.ceil(totalDist / 1.5));
      const sdx = totalDx / steps, sdy = totalDy / steps;
      for (let s = 0; s < steps; s++) {
        let ax = 0, ay = 0;
        if (canShiftBy(sdx, sdy)) { ax = sdx; ay = sdy; }
        else if (Math.abs(sdx) > 1e-4 && canShiftBy(sdx, 0)) ax = sdx;
        else if (Math.abs(sdy) > 1e-4 && canShiftBy(0, sdy)) ay = sdy;
        else break;
        eq.x += ax;
        eq.y += ay;
        for (const m of members) {
          m.x += ax;
          m.y += ay;
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
            const dx = p.x - o.x, dy = p.y - o.y;
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
      const members = this.pieces.filter((p) => !p.broken && p.value > 0 && p.inEquation === tag);
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

    ensurePureEquation(x = 110, y = 76) {
      if (!this.pureEquation || this.pureEquation.broken) {
        this.pureEquation = {
          x: clamp(R(x), this.STAGE_MIN_X + 18, this.STAGE_MAX_X - 18),
          y: clamp(R(y), this.STAGE_MIN_Y + 8, this.STAGE_MAX_Y - 8),
          expanded: false,
          broken: false,
          dropHover: false,
          removeHover: false
        };
      }
      return this.pureEquation;
    },

    breakPureEquation() {
      if (!this.pureEquation || this.pureEquation.broken) return false;
      const members = this.pieces.filter((p) => !p.broken && !p.shadow && p.value > 0 && p.inEquation === 'pure');
      members.forEach((m, idx) => {
        m.inEquation = null;
        m.x = clamp(this.pureEquation.x + (idx - (members.length - 1) * 0.5) * 24, this.STAGE_MIN_X, this.STAGE_MAX_X);
        m.y = clamp(this.pureEquation.y, this.STAGE_MIN_Y, this.STAGE_MAX_Y);
      });
      GameHUD.playSfx('equationRemove');
      this.resolveFreeCrystalCollisions();
      return true;
    },

    updateOpalProximity(dt) {
      if (this.phase !== 'gameplay' || !this.draggedPiece || this.disableOpalDrain) {
        this.clearTrembleStates();
        return;
      }
      const dp = this.draggedPiece;
      if (dp.broken || dp.value <= 0 || dp.shadow || dp.shape || dp.inEquation === 'pure') {
        this.clearTrembleStates();
        return;
      }
      if (this.pureEquation && !this.pureEquation.broken && this.isInsideEquationAura(this.pureEquation, dp.x, dp.y, true)) {
        this.clearTrembleStates();
        return;
      }

      let activeOpal = null;
      let activeTarget = null;
      let bestDist = 26;

      if (dp.type === 'opal') {
        for (const p of this.pieces) {
          if (p !== dp && !p.broken && !p.shadow && !p.shape && p.inEquation !== 'pure' && p.value > 0 && p.type !== 'opal') {
            const d = Math.hypot(dp.x - p.x, dp.y - p.y);
            if (d <= bestDist) {
              bestDist = d;
              activeOpal = dp;
              activeTarget = p;
            }
          }
        }
      } else {
        for (const p of this.pieces) {
          if (p !== dp && !p.broken && !p.shadow && !p.shape && p.inEquation !== 'pure' && p.value > 0 && p.type === 'opal') {
            const d = Math.hypot(dp.x - p.x, dp.y - p.y);
            if (d <= bestDist) {
              bestDist = d;
              activeOpal = p;
              activeTarget = dp;
            }
          }
        }
      }

      for (const p of this.pieces) p.trembling = false;
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

        this.spawnShatter((activeOpal.x + activeTarget.x) * 0.5, (activeOpal.y + activeTarget.y) * 0.5, 'opal', 6);

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
        if (this.fractionPlatform && (activeTarget.inFraction || activeOpal.inFraction)) {
          this.layoutFractionPieces();
          this.updateFractionPlatformState();
        }
        if (!activeTarget.broken && activeTarget.value > 0) {
          const hit = this.findTouchingCompatibleShadow(activeTarget, activeTarget.x, activeTarget.y);
          if (hit) {
            this.triggerImmediateAnnulment(activeTarget, hit);
            return;
          }
        }
        this.checkEquationSolved();
        this.triggerDefeatIfImpossible();
      }
    },

    spawnFloatingBanner(arg1, arg2, arg3) {
      let text, x, y;
      if (typeof arg1 === 'number') {
        x = arg1;
        y = arg2;
        text = typeof arg3 === 'string' ? arg3 : 'DIVISÃO!';
      } else {
        text = SHAPE_BANNERS[arg1] || String(arg1 || 'FORMA!');
        x = arg2;
        y = arg3;
      }
      this.floatingBanners.push({
        text,
        x: clamp(R(x || 160), 42, W - 42),
        y: clamp(R((y || 80) - 12), 28, H - 24),
        t0: this.t
      });
      if (this.floatingBanners.length > 8) {
        this.floatingBanners.shift();
      }
      GameHUD.playSfx('shapeMaterialize');
      GameHUD.playSfx('shapeBanner');
    },

    snapshotPiece(p) {
      return {
        type: p.type,
        value: p.value,
        boosted: Boolean(p.boosted),
        shape: p.shape || null,
        borderType: p.borderType || null,
        coreType: p.coreType || null,
        upperType: p.upperType || null,
        lowerType: p.lowerType || null,
        triBorder: p.triBorder || null,
        triCore: p.triCore || null,
        trapBorder: p.trapBorder || null,
        trapCore: p.trapCore || null,
        joinedSquares: Boolean(p.joinedSquares),
        subTriangles: p.subTriangles || 0,
        sourceNodeId: p.sourceNodeId || null,
        components: p.components ? p.components.map((c) => ({ ...c })) : null
      };
    },

    getTessellationMatch(target, dragged) {
      if (!target || !dragged || target === dragged) return null;
      if (target.broken || dragged.broken || target.shadow || dragged.shadow) return null;
      if (!target.shape || !dragged.shape) return null;

      const s1 = target.shape, s2 = dragged.shape;

      // 1. 2 Quadrados idênticos -> Retângulo Cristalino (gira 90° e encaixa lado a lado [■|■])
      if (
        s1 === 'square' &&
        s2 === 'square' &&
        target.value === dragged.value &&
        (target.borderType || target.type) === (dragged.borderType || dragged.type) &&
        (target.coreType || target.type) === (dragged.coreType || dragged.type)
      ) {
        return {
          resultShape: 'rectangle',
          targetRotAngle: Math.PI / 2,
          label: 'QUADRADO + QUADRADO = RETÂNGULO'
        };
      }

      // 2. 1 Trapézio + 1 Triângulo -> Pentágono (gira suavemente 360° e encaixa o Triângulo no topo do Trapézio)
      if ((s1 === 'trapezoid' && s2 === 'triangle') || (s1 === 'triangle' && s2 === 'trapezoid')) {
        return {
          resultShape: 'pentagon',
          targetRotAngle: Math.PI * 2,
          label: 'TRIÂNGULO + TRAPÉZIO = PENTÁGONO'
        };
      }

      // 3. Tesselação radial de 6 Triângulos equiláteros -> Hexágono (gira k * 60° para a próxima fatia radial)
      if (s1 === 'triangle' && s2 === 'triangle' && ((target.subTriangles || 0) > 0 || (dragged.subTriangles || 0) > 0)) {
        const curSlices = target.subTriangles || 1;
        const addSlices = dragged.subTriangles || 1;
        const total = curSlices + addSlices;
        return {
          resultShape: total >= 6 ? 'hexagon' : 'triangle',
          targetRotAngle: (curSlices % 6) * (Math.PI / 3),
          label: total >= 6 ? '6 TRIÂNGULOS = HEXÁGONO!' : `${total}/6 TRIÂNGULOS -> HEXÁGONO`
        };
      }

      // 4. 2 Triângulos congruentes -> Losango (gira 180° de cabeça para baixo ▼ para unir base com base ▲+▼ = ◆)
      if (
        s1 === 'triangle' &&
        s2 === 'triangle' &&
        target.value === dragged.value &&
        (target.borderType || target.type) === (dragged.borderType || dragged.type) &&
        (target.coreType || target.type) === (dragged.coreType || dragged.type)
      ) {
        return {
          resultShape: 'rhombus',
          targetRotAngle: Math.PI,
          label: 'TRIÂNGULO + TRIÂNGULO (180°) = LOSANGO'
        };
      }

      return null;
    },

    updateShapeTessellationPreview(dt) {
      let bestMatch = null;
      const dp = this.phase === 'gameplay' ? this.draggedPiece : null;

      if (dp && !dp.broken && !dp.shadow && dp.value > 0 && dp.shape) {
        let bestDist = 42;
        for (const other of this.pieces) {
          if (other === dp || other.broken || other.shadow || other.value <= 0 || !other.shape) continue;
          const d = Math.hypot(dp.x - other.x, dp.y - other.y);
          if (d <= bestDist) {
            const match = this.getTessellationMatch(other, dp);
            if (match) {
              bestDist = d;
              bestMatch = {
                target: other,
                dragged: dp,
                dist: d,
                resultShape: match.resultShape,
                targetRotAngle: match.targetRotAngle,
                label: match.label
              };
            }
          }
        }
      }

      const prevTargetId = this.tessellationPreview?.target?.id || null;
      const nextTargetId = bestMatch?.target?.id || null;
      if (bestMatch && nextTargetId !== prevTargetId) {
        GameHUD.playSfx('click');
      }
      this.tessellationPreview = bestMatch;

      for (const p of this.pieces) {
        if (!p || p.broken) continue;
        const desired = (bestMatch && p === bestMatch.dragged) ? bestMatch.targetRotAngle : 0;
        p.targetRotAngle = desired;
        const cur = Number(p.rotAngle) || 0;
        const diff = desired - cur;
        if (Math.abs(diff) < 0.005) {
          p.rotAngle = desired;
        } else {
          p.rotAngle = cur + diff * Math.min(1, dt * 10);
        }
      }
    },

    rejectAtElectricShape(node, piecesToReject = []) {
      if (node) {
        node.barrierUntil = this.t + 0.65;
        node.hover = false;
      }
      GameHUD.playSfx('electricReject');
      for (const p of piecesToReject) {
        if (!p) continue;
        p.rejectUntil = this.t + 0.55;
        if (!p.inEquation && node) {
          const dx = p.x - node.x;
          const dy = p.y - node.y;
          const d = Math.hypot(dx, dy) || 1;
          p.x = clamp(R(node.x + (dx / d) * 24), this.STAGE_MIN_X, this.STAGE_MAX_X);
          p.y = clamp(R(node.y + (dy / d) * 20), this.STAGE_MIN_Y, this.STAGE_MAX_Y);
        }
      }
      if (this.pureEquation && !this.pureEquation.broken && piecesToReject.some((p) => p && p.inEquation === 'pure')) {
        this.pureEquation.x = clamp(this.pureEquation.x - 16, 62, 180);
        this.layoutEquationPieces(this.pureEquation, 'pure');
      }
      this.resolveFreeCrystalCollisions();
      return false;
    },

    tryEnterElectricShapeNode(node, candidatePieces = []) {
      if (!node || node.used) return false;
      const validList = candidatePieces.filter((p) => p && !p.broken && !p.shadow && p.value > 0);
      if (validList.length === 0) return false;

      if (node.shape === 'circle') {
        // O Círculo aceita apenas 1 elemento cristalino unitário
        if (validList.length !== 1 || validList[0].shape) {
          return this.rejectAtElectricShape(node, validList);
        }
        const p = validList[0];
        const snap = this.snapshotPiece(p);
        p.shape = 'circle';
        p.borderType = p.type;
        p.coreType = p.type;
        p.components = [snap];
        p.sourceNodeId = node.id;
        p.inEquation = null;
        p.x = node.x;
        p.y = node.y;
        p.lastValChangeAt = this.t;
        node.used = true;
        node.hover = false;
        if (this.tutorialHighlightId === p.id) this.tutorialHighlightId = null;
        this.spawnFloatingBanner('circle', node.x, node.y);
        this.spawnShatter(node.x, node.y, SHARD_SPR[p.type] ? p.type : 'pure', 10);
        if (this.pureEquation && !this.pureEquation.broken) {
          this.layoutEquationPieces(this.pureEquation, 'pure');
        }
        const hit = this.findTouchingCompatibleShadow(p, p.x, p.y);
        if (hit) this.triggerImmediateAnnulment(p, hit);
        return true;
      }

      // Regra das Barreiras Elétricas (Seção 2.2): todas as demais formas exigem ESTRITAMENTE 2 ELEMENTOS conectados
      if (validList.length !== 2 || validList[0].shape || validList[1].shape) {
        return this.rejectAtElectricShape(node, validList);
      }

      const ordered = validList.slice().sort((a, b) => a.x - b.x);
      const first = ordered[0], second = ordered[1];

      if (node.shape === 'square' && first.value !== second.value) {
        return this.rejectAtElectricShape(node, ordered);
      }
      if (node.shape === 'rectangle' && first.value === second.value) {
        return this.rejectAtElectricShape(node, ordered);
      }

      const snap1 = this.snapshotPiece(first);
      const snap2 = this.snapshotPiece(second);
      first.shape = node.shape;
      first.borderType = first.type; // 1º elemento define a cor da borda externa
      first.coreType = second.type;  // 2º elemento define a cor do núcleo interno
      first.value = first.value + second.value;
      first.components = [snap1, snap2];
      first.sourceNodeId = node.id;
      first.inEquation = null;
      first.x = node.x;
      first.y = node.y;
      first.lastValChangeAt = this.t;

      second.broken = true;
      second.inEquation = null;
      node.used = true;
      node.hover = false;

      if (this.pureEquation && !this.pureEquation.broken) {
        this.layoutEquationPieces(this.pureEquation, 'pure');
      }

      this.spawnFloatingBanner(node.shape, node.x, node.y);
      this.spawnShatter(node.x, node.y, SHARD_SPR[first.type] ? first.type : 'pure', 12);

      const hit = this.findTouchingCompatibleShadow(first, first.x, first.y);
      if (hit) this.triggerImmediateAnnulment(first, hit);
      return true;
    },

    tryTessellateShapes(target, dropped) {
      if (!target || !dropped || target === dropped) return false;
      if (target.broken || dropped.broken || target.shadow || dropped.shadow) return false;
      if (!target.shape || !dropped.shape) return false;

      const s1 = target.shape, s2 = dropped.shape;
      const snapT = this.snapshotPiece(target);
      const snapD = this.snapshotPiece(dropped);

      // 1. 2 Quadrados idênticos -> Retângulo Cristalino
      if (
        s1 === 'square' &&
        s2 === 'square' &&
        target.value === dropped.value &&
        (target.borderType || target.type) === (dropped.borderType || dropped.type) &&
        (target.coreType || target.type) === (dropped.coreType || dropped.type)
      ) {
        target.shape = 'rectangle';
        target.joinedSquares = true;
        target.value += dropped.value;
        target.components = [snapT, snapD];
        target.sourceNodeId = null;
        target.rotAngle = 0;
        target.targetRotAngle = 0;
        target.lastValChangeAt = this.t;
        dropped.broken = true;
        dropped.inEquation = null;
        this.tessellationPreview = null;
        this.spawnFloatingBanner('rectangle', target.x, target.y);
        this.spawnShatter(target.x, target.y, 'pure', 12);
        const hit = this.findTouchingCompatibleShadow(target, target.x, target.y);
        if (hit) this.triggerImmediateAnnulment(target, hit);
        return true;
      }

      // 2. 1 Trapézio + 1 Triângulo -> Pentágono (preserva 100% as cores do Triângulo no topo e do Trapézio na base)
      if ((s1 === 'trapezoid' && s2 === 'triangle') || (s1 === 'triangle' && s2 === 'trapezoid')) {
        const trap = s1 === 'trapezoid' ? target : dropped;
        const tri = s1 === 'triangle' ? target : dropped;
        const trapB = trap.borderType || trap.type;
        const trapC = trap.coreType || trap.type;
        const triB = tri.borderType || tri.type;
        const triC = tri.coreType || tri.type;
        const sumVal = trap.value + tri.value;
        target.shape = 'pentagon';
        target.type = trap.type;
        target.borderType = trapB;
        target.coreType = triB;
        target.upperType = triB;
        target.lowerType = trapC;
        target.triBorder = triB;
        target.triCore = triC;
        target.trapBorder = trapB;
        target.trapCore = trapC;
        target.value = sumVal;
        target.components = [snapT, snapD];
        target.sourceNodeId = null;
        target.rotAngle = 0;
        target.targetRotAngle = 0;
        target.lastValChangeAt = this.t;
        dropped.broken = true;
        dropped.inEquation = null;
        this.tessellationPreview = null;
        this.spawnFloatingBanner('pentagon', target.x, target.y);
        this.spawnShatter(target.x, target.y, 'citrine', 12);
        const hit = this.findTouchingCompatibleShadow(target, target.x, target.y);
        if (hit) this.triggerImmediateAnnulment(target, hit);
        return true;
      }

      // 3. Tesselação radial de 6 Triângulos equiláteros -> Hexágono
      if (s1 === 'triangle' && s2 === 'triangle' && ((target.subTriangles || 0) > 0 || (dropped.subTriangles || 0) > 0)) {
        const totalTris = (target.subTriangles || 1) + (dropped.subTriangles || 1);
        target.value += dropped.value;
        target.subTriangles = totalTris;
        target.components = [snapT, snapD];
        target.rotAngle = 0;
        target.targetRotAngle = 0;
        target.lastValChangeAt = this.t;
        dropped.broken = true;
        dropped.inEquation = null;
        this.tessellationPreview = null;
        if (totalTris >= 6) {
          target.shape = 'hexagon';
          this.spawnFloatingBanner('hexagon', target.x, target.y);
        } else {
          this.spawnFloatingBanner('triangle', target.x, target.y);
        }
        this.spawnShatter(target.x, target.y, 'citrine', 10);
        const hit = this.findTouchingCompatibleShadow(target, target.x, target.y);
        if (hit) this.triggerImmediateAnnulment(target, hit);
        return true;
      }

      // 4. 2 Triângulos congruentes -> Losango
      if (
        s1 === 'triangle' &&
        s2 === 'triangle' &&
        target.value === dropped.value &&
        (target.borderType || target.type) === (dropped.borderType || dropped.type) &&
        (target.coreType || target.type) === (dropped.coreType || dropped.type)
      ) {
        target.shape = 'rhombus';
        target.value += dropped.value;
        target.components = [snapT, snapD];
        target.sourceNodeId = null;
        target.rotAngle = 0;
        target.targetRotAngle = 0;
        target.lastValChangeAt = this.t;
        dropped.broken = true;
        dropped.inEquation = null;
        this.tessellationPreview = null;
        this.spawnFloatingBanner('rhombus', target.x, target.y);
        this.spawnShatter(target.x, target.y, 'pure', 12);
        const hit = this.findTouchingCompatibleShadow(target, target.x, target.y);
        if (hit) this.triggerImmediateAnnulment(target, hit);
        return true;
      }

      return false;
    },

    tryDisassembleShapeOnTap(piece) {
      if (!piece || piece.shadow || piece.broken || !piece.shape) return false;
      if (!piece.components || piece.components.length === 0) return false;

      const ox = piece.x, oy = piece.y;
      const comps = piece.components;
      if (piece.sourceNodeId) {
        const srcNode = this.electricShapes.find((es) => es.id === piece.sourceNodeId);
        if (srcNode) srcNode.used = false;
      }

      const c0 = comps[0];
      piece.type = c0.type;
      piece.value = c0.value;
      piece.boosted = Boolean(c0.boosted);
      piece.shape = c0.shape || null;
      piece.borderType = c0.borderType || null;
      piece.coreType = c0.coreType || null;
      piece.upperType = c0.upperType || null;
      piece.lowerType = c0.lowerType || null;
      piece.triBorder = c0.triBorder || null;
      piece.triCore = c0.triCore || null;
      piece.trapBorder = c0.trapBorder || null;
      piece.trapCore = c0.trapCore || null;
      piece.joinedSquares = Boolean(c0.joinedSquares);
      piece.subTriangles = c0.subTriangles || 0;
      piece.rotAngle = 0;
      piece.targetRotAngle = 0;
      piece.sourceNodeId = c0.sourceNodeId || null;
      piece.components = c0.components ? c0.components.map((c) => ({ ...c })) : null;
      piece.inEquation = null;
      piece.x = clamp(ox - (comps.length > 1 ? 14 : 20), this.STAGE_MIN_X, this.STAGE_MAX_X);
      piece.y = oy;
      piece.lastValChangeAt = this.t;

      if (comps.length > 1) {
        const c1 = comps[1];
        this.pieces.push({
          id: `${piece.id}_dis_${Math.floor(this.t * 1000)}_${this.pieces.length}`,
          type: c1.type,
          value: c1.value,
          shadow: false,
          boosted: Boolean(c1.boosted),
          inEquation: null,
          shape: c1.shape || null,
          borderType: c1.borderType || null,
          coreType: c1.coreType || null,
          upperType: c1.upperType || null,
          lowerType: c1.lowerType || null,
          triBorder: c1.triBorder || null,
          triCore: c1.triCore || null,
          trapBorder: c1.trapBorder || null,
          trapCore: c1.trapCore || null,
          joinedSquares: Boolean(c1.joinedSquares),
          subTriangles: c1.subTriangles || 0,
          rotAngle: 0,
          targetRotAngle: 0,
          sourceNodeId: c1.sourceNodeId || null,
          components: c1.components ? c1.components.map((c) => ({ ...c })) : null,
          lastValChangeAt: this.t,
          x: clamp(ox + 14, this.STAGE_MIN_X, this.STAGE_MAX_X),
          y: oy
        });
      }

      GameHUD.playSfx('equationRemove');
      this.resolveFreeCrystalCollisions();
      return true;
    },

    layoutFractionPieces() {
      const fp = this.fractionPlatform;
      if (!fp) return;
      const spacing = 22;
      if (fp.topPieces && fp.topPieces.length > 0) {
        const topCount = fp.topPieces.length;
        const startX = fp.x - ((topCount - 1) * spacing) * 0.5;
        for (let i = 0; i < topCount; i++) {
          const p = fp.topPieces[i];
          p.x = startX + i * spacing;
          p.y = fp.topY;
          p.inFraction = 'top';
          p.inEquation = null;
        }
      }
      if (fp.bottomPieces && fp.bottomPieces.length > 0) {
        const botCount = fp.bottomPieces.length;
        const startX = fp.x - ((botCount - 1) * spacing) * 0.5;
        for (let i = 0; i < botCount; i++) {
          const p = fp.bottomPieces[i];
          p.x = startX + i * spacing;
          p.y = fp.bottomY;
          p.inFraction = 'bottom';
          p.inEquation = null;
        }
      }
    },

    updateFractionPlatformState() {
      const fp = this.fractionPlatform;
      if (!fp || fp.broken) return;
      fp.topPieces = (fp.topPieces || []).filter((p) => !p.broken && p.value > 0);
      fp.bottomPieces = (fp.bottomPieces || []).filter((p) => !p.broken && p.value > 0);
      const sumTop = (fp.topPieces || []).reduce((acc, p) => acc + (p.value || 0), 0);
      const sumBottom = (fp.bottomPieces || []).reduce((acc, p) => acc + (p.value || 0), 0);
      fp.topSum = sumTop;
      fp.bottomSum = sumBottom;
      const wasGlowing = fp.glowing;
      fp.glowing = sumTop > 0 && sumTop === sumBottom;
      if (!wasGlowing && fp.glowing) {
        if (global.CrystalAudio?.fractionPinkGlow) {
          global.CrystalAudio.fractionPinkGlow();
        } else {
          GameHUD.playSfx('shapeSnap');
        }
        this.spawnShatter(fp.x, fp.y, 'rose', 6);
      }
    },

    isInsideFractionPlatform(x, y) {
      const fp = this.fractionPlatform;
      if (!fp || fp.broken) return false;
      return Math.abs(x - fp.x) <= (fp.w * 0.5 + 4) && Math.abs(y - fp.y) <= (fp.h * 0.5 + 4);
    },

    triggerFractionDivide() {
      const fp = this.fractionPlatform;
      if (!fp || fp.broken || !fp.glowing) return;
      fp.broken = true;

      this.spawnShatter(fp.x, fp.y, 'rose', 16);
      this.spawnShatter(fp.x, fp.y, 'aqua', 16);
      if (global.CrystalAudio?.fractionDivide) {
        global.CrystalAudio.fractionDivide();
      } else {
        GameHUD.playSfx('equationShatter');
      }

      const allInternal = [...(fp.topPieces || []), ...(fp.bottomPieces || [])];
      for (const p of allInternal) {
        p.broken = true;
        p.value = 0;
      }
      this.pieces = this.pieces.filter((p) => !p.broken && p.value > 0);

      const resultPiece = {
        id: 'ri_frac_res_' + Math.floor(Math.random() * 100000),
        type: fp.resultType || 'aqua',
        value: fp.resultValue || 1,
        shadow: false,
        boosted: false,
        inEquation: null,
        inFraction: null,
        x: fp.x,
        y: fp.y
      };
      this.pieces.push(resultPiece);

      this.spawnFloatingBanner('DIVISÃO!', fp.x, fp.y - 12);
      this.fractionPlatform = null;
      this.checkEquationSolved();
      this.triggerDefeatIfImpossible();
    },

    checkPieceDrop(dropped) {
      if (!dropped || dropped.broken || dropped.value <= 0) return;

      const clamped = this.clampCrystalPos(dropped.x, dropped.y);
      dropped.x = clamped.x;
      dropped.y = clamped.y;

      this.checkEmeraldAltarBlessing(dropped);
      if (dropped.broken || this.phase !== 'gameplay') return;

      // -1. Entrada na Plataforma de Fração do Rio (Topo ou Embaixo)
      if (this.fractionPlatform && !this.fractionPlatform.broken && !dropped.inFraction) {
        const fp = this.fractionPlatform;
        const overTop = Math.abs(dropped.x - fp.x) <= fp.w * 0.5 && Math.abs(dropped.y - fp.topY) <= 16;
        const overBottom = Math.abs(dropped.x - fp.x) <= fp.w * 0.5 && Math.abs(dropped.y - fp.bottomY) <= 16;
        // Opala de Fogo não entra na fração: ela subtrai do cristal que está lá dentro.
        if ((overTop || overBottom) && dropped.type !== 'opal') {
          const wasInPureEq = dropped.inEquation === 'pure';
          dropped.inFraction = overTop ? 'top' : 'bottom';
          dropped.inEquation = null;
          if (wasInPureEq && this.pureEquation && !this.pureEquation.broken) {
            const members = this.pieces.filter((p) => !p.broken && !p.shadow && p.value > 0 && p.inEquation === 'pure');
            if (members.length <= 1) {
              this.breakPureEquation();
            } else {
              this.layoutEquationPieces(this.pureEquation, 'pure');
            }
          }
          const targetList = overTop ? fp.topPieces : fp.bottomPieces;
          if (!targetList.includes(dropped)) targetList.push(dropped);
          this.layoutFractionPieces();
          this.updateFractionPlatformState();
          GameHUD.playSfx('equationInsert');
          return;
        }
      }

      // 0. Entrada em Forma Geométrica Elétrica da Caatinga
      if (this.electricShapes && this.electricShapes.length > 0) {
        for (const es of this.electricShapes) {
          if (!es.used && Math.hypot(dropped.x - es.x, dropped.y - es.y) <= 22) {
            if (dropped.inEquation === 'pure' && this.pureEquation && !this.pureEquation.broken) {
              const members = this.pieces.filter((p) => !p.broken && !p.shadow && p.value > 0 && p.inEquation === 'pure');
              this.tryEnterElectricShapeNode(es, members);
            } else {
              this.tryEnterElectricShapeNode(es, [dropped]);
            }
            return;
          }
        }
      }

      // 1. Encaixe / Tesselação entre duas Formas Geométricas prontas (raio generoso de 34px coincidente com o preview de giro)
      if (dropped.shape) {
        for (const other of this.pieces) {
          if (
            other !== dropped &&
            !other.broken &&
            !other.shadow &&
            other.value > 0 &&
            other.shape &&
            Math.hypot(dropped.x - other.x, dropped.y - other.y) <= 34
          ) {
            if (this.tryTessellateShapes(other, dropped)) {
              return;
            }
          }
        }
      }

      // 2. Adição ou reordenação na Equação Cristalina (priorizada quando solto dentro da aura receptiva)
      if (this.pureEquation && !this.pureEquation.broken) {
        if (this.isInsideEquationAura(this.pureEquation, dropped.x, dropped.y, true)) {
          if (dropped.inEquation !== 'pure') {
            dropped.inEquation = 'pure';
            GameHUD.playSfx('equationInsert');
          } else {
            GameHUD.playSfx('click');
          }
          // Ordena os membros pela posição X onde foram soltos (permitindo inverter a ordem borda/núcleo!)
          const members = this.pieces
            .filter((p) => !p.broken && p.value > 0 && p.inEquation === 'pure')
            .sort((a, b) => a.x - b.x);
          const nonMembers = this.pieces.filter((p) => p.broken || p.value <= 0 || p.inEquation !== 'pure');
          this.pieces = [...nonMembers, ...members];
          this.layoutEquationPieces(this.pureEquation, 'pure');
          return;
        } else if (dropped.inEquation === 'pure') {
          dropped.inEquation = null;
          GameHUD.playSfx('equationRemove');
          this.layoutEquationPieces(this.pureEquation, 'pure');
        }
      }

      // 3. Fusão entre cristais puros da mesma cor (até 6 bolinhas, fora de formas geométricas)
      //    ou formação automática do agrupador/parênteses (pureEquation) ao unir cristais puros de cores diferentes!
      if (!dropped.shape && dropped.type !== 'opal') {
        for (const other of this.pieces) {
          if (
            other !== dropped &&
            !other.broken &&
            !other.shadow &&
            !other.shape &&
            other.value > 0 &&
            other.type !== 'opal' &&
            Math.hypot(dropped.x - other.x, dropped.y - other.y) <= 24
          ) {
            if (other.type !== dropped.type || other.inEquation === 'pure') {
              if (this.pureEquation || this.shadowEquation || (this.electricShapes && this.electricShapes.length > 0)) {
                const eq = this.ensurePureEquation((dropped.x + other.x) * 0.5, (dropped.y + other.y) * 0.5);
                other.inEquation = 'pure';
                dropped.inEquation = 'pure';
                GameHUD.playSfx('equationInsert');
                const members = this.pieces.filter((p) => !p.broken && !p.shadow && p.value > 0 && p.inEquation === 'pure');
                members.sort((a, b) => a.x - b.x);
                const nonMembers = this.pieces.filter((p) => p.broken || p.shadow || p.value <= 0 || p.inEquation !== 'pure');
                this.pieces = [...nonMembers, ...members];
                this.layoutEquationPieces(eq, 'pure');
                return;
              }
              dropped.rejectUntil = this.t + 0.35;
              other.rejectUntil = this.t + 0.35;
              GameHUD.playSfx('error');
              this.resolveFreeCrystalCollisions();
              return;
            }
            if (other.value + dropped.value > 6) {
              dropped.rejectUntil = this.t + 0.35;
              other.rejectUntil = this.t + 0.35;
              GameHUD.playSfx('error');
              this.resolveFreeCrystalCollisions();
              return;
            }
            other.value += dropped.value;
            other.boosted = Boolean(other.boosted && dropped.boosted);
            other.lastValChangeAt = this.t;
            dropped.broken = true;
            GameHUD.playSfx(other.type === 'rose' ? 'roseMerge' : 'quartzMerge');
            this.spawnShatter(other.x, other.y, SHARD_SPR[other.type] ? other.type : 'pure', 8);
            if (this.pureEquation && !this.pureEquation.broken) {
              this.layoutEquationPieces(this.pureEquation, 'pure');
            }
            const mergedHit = this.findTouchingCompatibleShadow(other, other.x, other.y);
            if (mergedHit) this.triggerImmediateAnnulment(other, mergedHit);
            return;
          }
        }
      }

      this.resolveFreeCrystalCollisions();

      if (!dropped.inEquation) {
        const shadowTarget = this.findTouchingCompatibleShadow(dropped, dropped.x, dropped.y);
        if (shadowTarget) this.triggerImmediateAnnulment(dropped, shadowTarget);
      }
    },

    isStepStillSolvable() {
      const shadows = this.pieces.filter((p) => p.shadow && !p.broken && p.value > 0);
      if (shadows.length === 0) return true;
      const pures = this.pieces.filter((p) => !p.shadow && !p.broken && p.value > 0);
      if (this.fractionPlatform && !this.fractionPlatform.broken) {
        return true;
      }
      if (pures.length === 0) return false;
      if (this.worldKey === 'caatinga' || (this.electricShapes && this.electricShapes.length > 0)) {
        return true;
      }

      const hasAltar = Boolean(this.emeraldAltar);
      for (const color of ['white', 'rose', 'citrine', 'aqua']) {
        const sSum = shadows.filter((s) => s.type === color).reduce((a, b) => a + b.value, 0);
        if (sSum === 0) continue;
        const pList = pures.filter((p) => p.type === color);
        if (pList.length === 0) return false;
        const maxPureSum = pList.reduce((sum, p) => {
          if (!hasAltar || p.boosted) return sum + p.value;
          // Se puder dividir antes de passar no Altar (ex: Citrino/Água 4 -> 2+2 -> 4+4 = 8), considera o teto real
          if ((color === 'citrine' || color === 'aqua') && p.value >= 2 && p.value % 2 === 0) {
            return sum + p.value * 2;
          }
          return sum + (p.value * 2 <= 6 ? p.value * 2 : p.value);
        }, 0);
        if (maxPureSum < sSum) return false;
      }
      return true;
    },

    triggerDefeatIfImpossible() {
      if (this.phase !== 'gameplay') return;
      if (!this.pieces.some((k) => k.shadow && !k.broken && k.value > 0)) return;
      if (!this.isStepStillSolvable()) {
        if (this.draggedPiece) {
          this.draggedPiece.dragging = false;
          this.draggedPiece = null;
        }
        this.dragStartPos = null;
        this.equationPointer = null;
        this.clearTrembleStates();
        GameHUD.playSfx('error');
        this.phase = 'defeat_pause';
        this.phaseTime = 0;
      }
    },

    checkIfAllStepTargetsCleared(originX, originY) {
      const remainingShadows = this.pieces.some((k) => k.shadow && !k.broken);
      const remainingShadowEq = this.shadowEquation && !this.shadowEquation.broken;
      if (!remainingShadows && !remainingShadowEq) {
        this.onStepCleared(originX, originY);
      }
    },

    checkEquationSolved() {
      if (this.phase !== 'gameplay' || !this.pureEquation || !this.shadowEquation) return;
      if (this.pureEquation.broken || this.shadowEquation.broken) return;

      const pureMembers = this.pieces.filter((p) => !p.broken && !p.shadow && p.value > 0 && p.inEquation === 'pure');
      const shadowMembers = this.pieces.filter((p) => !p.broken && p.shadow && p.value > 0 && p.inEquation === 'shadow');
      if (pureMembers.length !== shadowMembers.length || shadowMembers.length === 0) return;

      const pool = pureMembers.slice();
      for (const sm of shadowMembers) {
        const idx = pool.findIndex((pm) => this.arePiecesEquivalent(pm, sm));
        if (idx < 0) return;
        pool.splice(idx, 1);
      }

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

    // ==========================================================================
    // MINIGAME DA FASE 5 DA CAATINGA: 'SHELL GAME' (O DESAFIO DAS AREIAS — 6 RODADAS)
    // ==========================================================================
    startShellGame() {
      const assistEl = typeof document !== 'undefined' ? document.getElementById('assistToggle') : null;
      const calmDefault = Boolean(assistEl?.checked || global.CrystalApp?.state?.settings?.assist);
      this.shellGame = {
        roundIndex: 0,
        calmMode: calmDefault,
        winningCup: 0,
        pickedCup: -1,
        lastSuccess: true,
        swapTimer: 0,
        swapDuration: 0.45,
        swapsRemaining: 0,
        swapPair: null,
        swapStyle: 'linear',
        feintMidpoint: false,
        cups: [],
        rounds: [
          { round: 1, cups: 2, duration: 3.0, swaps: 4,  speedLabel: 'Lenta',  style: 'linear' },
          { round: 2, cups: 2, duration: 4.0, swaps: 6,  speedLabel: 'Média',  style: 'cross' },
          { round: 3, cups: 3, duration: 5.0, swaps: 8,  speedLabel: 'Média',  style: 'triangle_feint' },
          { round: 4, cups: 4, duration: 6.0, swaps: 10, speedLabel: 'Média',  style: 'parallel_cross' },
          { round: 5, cups: 4, duration: 7.0, swaps: 13, speedLabel: 'Rápida', style: 'zigzag_spin' },
          { round: 6, cups: 5, duration: 8.0, swaps: 16, speedLabel: 'Rápida', style: 'quantum_feint' }
        ]
      };
      this.pieces = [
        { id: 'ca5_shell_opal_left',  type: 'opal', value: 1, shadow: false, x: 42,  y: 104 },
        { id: 'ca5_shell_opal_right', type: 'opal', value: 1, shadow: false, x: 278, y: 104 }
      ];
      this.electricShapes = [];
      this.pureEquation = null;
      this.shadowEquation = null;
      this.setupShellRound(0);
      this.playSpecialBgm();

      const cards = StandardTutorialCards.CAATINGA_SHELL_GAME;
      if (cards && cards.length) {
        this.phase = 'tutorial';
        TutorialModal.open(cards, () => {
          this.phase = 'shell_game_show';
          this.phaseTime = 0;
        }, false);
      } else {
        this.phase = 'shell_game_show';
        this.phaseTime = 0;
      }
    },

    setupShellRound(roundIdx) {
      const sg = this.shellGame;
      if (!sg) return;
      sg.roundIndex = clamp(roundIdx, 0, sg.rounds.length - 1);
      sg.round = sg.roundIndex + 1;
      sg.totalRounds = sg.rounds.length;
      const rDef = sg.rounds[sg.roundIndex];
      const count = rDef.cups;
      const spacing = count <= 2 ? 56 : (count === 3 ? 46 : (count === 4 ? 38 : 32));
      const startX = R(160 - ((count - 1) * spacing) * 0.5);
      const baseY = 104;

      sg.winningCup = sg.roundIndex % count;
      sg.opalCupIdx = sg.winningCup;
      sg.pickedCup = -1;
      sg.roundResult = null;
      sg.showTimer = 0;
      sg.swapPair = null;
      sg.swapsRemaining = rDef.swaps;
      sg.swapStyle = rDef.style;
      sg.swapDuration = rDef.duration / Math.max(1, rDef.swaps);
      sg.cups = Array.from({ length: count }, (_, i) => ({
        id: i,
        slot: i,
        x: startX + i * spacing,
        y: baseY,
        startX: startX + i * spacing,
        startY: baseY,
        targetX: startX + i * spacing,
        targetY: baseY,
        liftY: 18
      }));
    },

    beginNextShellSwap() {
      const sg = this.shellGame;
      if (!sg) return false;
      if (sg.swapsRemaining <= 0) {
        sg.swapPair = null;
        GameHUD.playSfx('cupStop');
        this.phase = 'shell_game_pick';
        this.phaseTime = 0;
        return false;
      }
      sg.swapsRemaining--;
      sg.swapTimer = 0;
      const n = sg.cups.length;
      const a = (sg.swapsRemaining + sg.roundIndex) % n;
      let b = (a + 1 + (sg.swapsRemaining & 1)) % n;
      if (b === a) b = (a + 1) % n;

      const cupA = sg.cups[a];
      const cupB = sg.cups[b];
      cupA.startX = cupA.x;
      cupA.startY = cupA.y;
      cupB.startX = cupB.x;
      cupB.startY = cupB.y;

      // Fintas nos modos triangle_feint / quantum_feint a cada 4ª troca
      const isFeint = (sg.swapStyle === 'triangle_feint' || sg.swapStyle === 'quantum_feint') && (sg.swapsRemaining % 4 === 1);
      sg.feintMidpoint = isFeint;
      if (!isFeint) {
        cupA.targetX = cupB.startX;
        cupA.targetY = cupB.startY;
        cupB.targetX = cupA.startX;
        cupB.targetY = cupA.startY;
        const tmpSlot = cupA.slot;
        cupA.slot = cupB.slot;
        cupB.slot = tmpSlot;
      } else {
        cupA.targetX = cupA.startX;
        cupA.targetY = cupA.startY;
        cupB.targetX = cupB.startX;
        cupB.targetY = cupB.startY;
      }
      sg.swapPair = [cupA, cupB];
      GameHUD.playSfx('sandSlide');
      return true;
    },

    pickShellCup(cupIndex) {
      const sg = this.shellGame;
      if (!sg || this.phase !== 'shell_game_pick') return false;
      if (cupIndex < 0 || cupIndex >= sg.cups.length) return false;
      sg.pickedCup = cupIndex;
      sg.lastSuccess = (cupIndex === sg.winningCup);
      sg.roundResult = sg.lastSuccess ? 'hit' : 'miss';
      sg.revealTimer = 0;
      this.phase = 'shell_game_reveal';
      this.phaseTime = 0;
      if (sg.lastSuccess) {
        GameHUD.playSfx('shellHit');
        this.spawnShatter(sg.cups[cupIndex].x, sg.cups[cupIndex].y - 8, 'opal', 12);
      } else {
        GameHUD.playSfx('shellMiss');
      }
      return true;
    },

    updateShellGame(dt) {
      const sg = this.shellGame;
      if (!sg) return;

      if (this.phase === 'shell_game_show') {
        sg.showTimer = (sg.showTimer || 0) + dt;
        const showT = Math.max(this.phaseTime, sg.showTimer);
        // Pausa de 1 segundo revelando a Opala sob a cúpula antes de descer e iniciar o embaralhamento
        if (showT < 1.0) {
          for (const c of sg.cups) {
            c.liftY = 18;
          }
        } else {
          const p = clamp((showT - 1.0) / 0.45, 0, 1);
          for (const c of sg.cups) {
            c.liftY = R(18 * (1 - easeInOut(p)));
          }
        }
        if (showT >= 1.5) {
          for (const c of sg.cups) c.liftY = 0;
          GameHUD.playSfx('cupStop');
          this.phase = 'shell_game_shuffle';
          this.phaseTime = 0;
          this.beginNextShellSwap();
        }
      } else if (this.phase === 'shell_game_shuffle') {
        // Modo Calmo reduz a velocidade de embaralhamento em 40% (fator 0.6) sem penalidade
        const speedMult = sg.calmMode ? 0.6 : 1.0;
        sg.swapTimer += dt * speedMult;
        const u = clamp(sg.swapTimer / sg.swapDuration, 0, 1);
        if (sg.swapPair) {
          const [cA, cB] = sg.swapPair;
          const e = easeInOut(u);
          const arcH = sg.swapStyle === 'linear' ? 6 : (sg.swapStyle === 'zigzag_spin' || sg.swapStyle === 'quantum_feint' ? 14 : 10);
          const arc = Math.sin(u * Math.PI) * arcH;
          if (sg.feintMidpoint) {
            const midX = (cA.startX + cB.startX) * 0.5;
            const f = Math.sin(u * Math.PI);
            cA.x = R(cA.startX + (midX - cA.startX) * f * 0.75);
            cB.x = R(cB.startX + (midX - cB.startX) * f * 0.75);
          } else {
            cA.x = R(cA.startX + (cA.targetX - cA.startX) * e);
            cB.x = R(cB.startX + (cB.targetX - cB.startX) * e);
          }
          cA.y = R(cA.startY - arc);
          cB.y = R(cB.startY + arc * 0.75);
        }
        if (u >= 1) {
          if (sg.swapPair) {
            const [cA, cB] = sg.swapPair;
            cA.x = cA.targetX;
            cA.y = cA.targetY;
            cB.x = cB.targetX;
            cB.y = cB.targetY;
          }
          this.beginNextShellSwap();
        }
      } else if (this.phase === 'shell_game_reveal') {
        sg.revealTimer = (sg.revealTimer || 0) + dt;
        const revT = Math.max(this.phaseTime, sg.revealTimer);
        const p = easeInOut(clamp(revT / 0.35, 0, 1));
        for (let i = 0; i < sg.cups.length; i++) {
          if (i === sg.pickedCup || (!sg.lastSuccess && i === sg.winningCup && revT > 0.35)) {
            sg.cups[i].liftY = R(18 * p);
          }
        }
        if (revT >= 1.15) {
          if (sg.lastSuccess) {
            if (sg.roundIndex + 1 < sg.rounds.length) {
              this.setupShellRound(sg.roundIndex + 1);
              this.phase = 'shell_game_show';
              this.phaseTime = 0;
            } else {
              // Vitória na 6ª rodada! A Opala de Fogo Primordial levita ao centro e irradia a onda solar!
              DialogueBox.sockets.caatinga = true;
              this.giantCrystalBroken = true;
              this.obstacleDecay = 1;
              this.waveOrigin = { x: 160, y: 86 };
              this.waveActive = true;
              this.waveRadius = 2;
              this.phase = 'shell_game_victory';
              this.phaseTime = 0;
              GameHUD.playSfx('reward');
              this.spawnShatter(160, 84, 'opal', 20);
            }
          } else {
            // Erro sem penalidade: reinicia suavemente a rodada atual!
            this.setupShellRound(sg.roundIndex);
            this.phase = 'shell_game_show';
            this.phaseTime = 0;
          }
        }
      } else if (this.phase === 'shell_game_victory') {
        if (this.phaseTime >= 2.2) {
          this.shellGame = null;
          this.startMusicalShow();
        }
      }
    },

    drawShellGame(ctx, tq) {
      const sg = this.shellGame;
      if (!sg) return;
      const f12 = Math.floor(tq * SPRITE_FPS);
      const rDef = sg.rounds[sg.roundIndex] || sg.rounds[0];

      if (this.phase === 'shell_game_victory') {
        // A Opala de Fogo Primordial levita ao centro irradiando onda solar, mandacarus em flor de rubi e água cristalina brotando!
        const gy = R(82 + Math.sin(tq * 4) * 3);
        drawRing(ctx, 160, gy, 16 + (f12 & 1) * 3, '#FBBF24');
        drawRing(ctx, 160, gy, 24 + (f12 & 1) * 4, '#FEF3C7');
        const spr = GEM_SPRITES.opal_pure;
        ctx.drawImage(spr, RH(160 - spr.width * 0.25), RH(gy - spr.height * 0.25), spr.width * 0.5, spr.height * 0.5);
        drawStar(ctx, 160, gy - 14, 4, '#ffffff', '#FBBF24');

        // Mandacarus florescendo com flores de rubi e filetes de água cristalina brotando do solo rochoso
        for (const mx of [84, 122, 198, 236]) {
          ctx.fillStyle = '#3e7338';
          ctx.fillRect(mx - 2, 118, 5, 22);
          ctx.fillRect(mx - 6, 124, 4, 8);
          ctx.fillRect(mx + 3, 122, 4, 8);
          drawStar(ctx, mx, 116, 3, '#fff2f5', '#e11d48');
          ctx.fillStyle = '#6cd9e6';
          ctx.fillRect(mx - 8, 138, 16, 2);
        }
        drawParchmentBox(ctx, 48, 26, 224, 20);
        drawPixelTextCentered(ctx, 'A Opala de Fogo Primordial despertou a Caatinga!', 160, 32, '#ffea31', '#000000', 212, 9);
        return;
      }

      // Cabeçalho da Rodada + Botão Modo Calmo (Acessibilidade sem penalização)
      drawParchmentBox(ctx, 110, 23, 148, 15);
      drawPixelTextCentered(
        ctx,
        `Desafio das Areias - Rodada ${rDef.round}/6`,
        184,
        27,
        '#ffffff',
        '#000000',
        140,
        8
      );

      const cb = this.shellCalmBtnRect;
      ctx.fillStyle = '#2c221e';
      ctx.fillRect(cb.x - 1, cb.y - 1, cb.w + 2, cb.h + 2);
      ctx.fillStyle = sg.calmMode ? '#3e7338' : '#4a3830';
      ctx.fillRect(cb.x, cb.y, cb.w, cb.h);
      ctx.fillStyle = '#FBBF24';
      ctx.fillRect(cb.x, cb.y, cb.w, 1);
      drawPixelTextCentered(
        ctx,
        sg.calmMode ? 'Modo Calmo: ON' : 'Modo Calmo: OFF',
        cb.x + cb.w / 2,
        cb.y + 3,
        '#FEF3C7',
        '#1f1410',
        cb.w - 4,
        8
      );

      // Tapete de areia dourada do altar
      ctx.fillStyle = '#D97706';
      ctx.fillRect(54, 112, 212, 6);
      ctx.fillStyle = '#FEF3C7';
      ctx.fillRect(58, 112, 204, 1);

      // Desenha a Opala de Fogo Primordial sob a cúpula vencedora quando o copo está erguido
      const winCup = sg.cups[sg.winningCup];
      if (winCup && winCup.liftY > 2) {
        const spr = GEM_SPRITES.opal_pure;
        const gw = spr.width * 0.5, gh = spr.height * 0.5;
        ctx.drawImage(spr, RH(winCup.x - gw / 2), RH(104 - gh / 2), gw, gh);
        drawStar(ctx, R(winCup.x), 92, 3, '#ffffff', '#FBBF24');
      }

      // Desenha as cúpulas de arenito e quartzo dourado
      for (let i = 0; i < sg.cups.length; i++) {
        const c = sg.cups[i];
        const cx = R(c.x), cy = R(c.y - (c.liftY || 0));

        // Rastro luminoso sutil na base do copo correto quando o Modo Calmo está ativo (Seção 6.4)
        if (sg.calmMode && i === sg.winningCup) {
          ctx.fillStyle = '#FBBF24';
          ctx.fillRect(cx - 8, R(c.y + 9), 16, 2);
          P1(ctx, cx, R(c.y + 8), '#ffffff');
        }

        // Sombra na areia
        ctx.fillStyle = '#4a2c18';
        ctx.fillRect(cx - 11, R(c.y + 7), 22, 3);

        // Corpo da cúpula de arenito esculpido
        ctx.fillStyle = '#7c2d12';
        ctx.fillRect(cx - 11, cy - 8, 22, 16);
        ctx.fillStyle = '#C2410C';
        ctx.fillRect(cx - 10, cy - 7, 20, 14);
        ctx.fillStyle = '#D97706';
        ctx.fillRect(cx - 8, cy - 10, 16, 16);
        ctx.fillStyle = '#FBBF24';
        ctx.fillRect(cx - 10, cy - 2, 20, 2);
        ctx.fillRect(cx - 4, cy - 12, 8, 2);
        ctx.fillStyle = '#FEF3C7';
        ctx.fillRect(cx - 6, cy - 9, 3, 6);

        // Nuvem inofensiva de poeira caso o jogador tenha aberto um copo vazio
        if (this.phase === 'shell_game_reveal' && !sg.lastSuccess && i === sg.pickedCup) {
          ctx.fillStyle = '#FEF3C7';
          ctx.fillRect(cx - 6, R(c.y - 2), 12, 5);
          ctx.fillStyle = '#D97706';
          ctx.fillRect(cx - 4, R(c.y - 4), 8, 3);
        }
      }

      if (this.phase === 'shell_game_show') {
        drawParchmentBox(ctx, 56, 124, 208, 16);
        drawPixelTextCentered(ctx, 'Memorize onde está a Opala de Fogo!', 160, 128, '#ffea31', '#000000', 198, 9);
      } else if (this.phase === 'shell_game_pick') {
        drawParchmentBox(ctx, 56, 124, 208, 16);
        drawPixelTextCentered(ctx, 'Toque na cúpula onde está a Opala de Fogo!', 160, 128, '#ffea31', '#000000', 198, 9);
      }
    },

    // ==========================================================================
    // MINIGAME DA FASE 5 DO RIO: SINFONIA DAS ÁGUAS (SIMON-SAYS EM 5 RODADAS)
    // ==========================================================================
    startRiverMelodyGame() {
      const assistEl = typeof document !== 'undefined' ? document.getElementById('assistToggle') : null;
      const calmDefault = Boolean(assistEl?.checked || global.CrystalApp?.state?.settings?.assist);
      this.riverMelody = {
        roundIndex: 0,
        calmMode: calmDefault,
        crystals: [
          { id: 'ri_bell_0', index: 0, type: 'aqua',    x: 76,  y: 110, baseY: 110, liftY: 0, glowing: false, shakeTimer: 0 },
          { id: 'ri_bell_1', index: 1, type: 'emerald', x: 118, y: 110, baseY: 110, liftY: 0, glowing: false, shakeTimer: 0 },
          { id: 'ri_bell_2', index: 2, type: 'citrine', x: 160, y: 110, baseY: 110, liftY: 0, glowing: false, shakeTimer: 0 },
          { id: 'ri_bell_3', index: 3, type: 'opal',    x: 202, y: 110, baseY: 110, liftY: 0, glowing: false, shakeTimer: 0 },
          { id: 'ri_bell_4', index: 4, type: 'rose',    x: 244, y: 110, baseY: 110, liftY: 0, glowing: false, shakeTimer: 0 }
        ],
        masterSequence: [0, 2, 1, 3, 4],
        demoIndex: 0,
        demoTimer: 1.0,
        playerIndex: 0,
        phase: 'demo',
        phaseTimer: 0
      };
      this.pieces = this.riverMelody.crystals.map((c) => ({
        id: c.id,
        type: c.type,
        value: 1,
        shadow: false,
        x: c.x,
        y: c.baseY
      }));
      this.pureEquation = null;
      this.shadowEquation = null;
      this.fractionPlatform = null;
      this.setupRiverMelodyRound(0);
      this.playSpecialBgm();

      const cards = StandardTutorialCards.RIVER_MELODY_SIMON;
      if (cards && cards.length) {
        this.phase = 'tutorial';
        TutorialModal.open(cards, () => {
          this.phase = 'river_melody_game';
          if (this.riverMelody) {
            this.riverMelody.phase = 'demo';
            this.riverMelody.demoIndex = 0;
            this.riverMelody.demoTimer = 1.0;
          }
        }, false);
      } else {
        this.phase = 'river_melody_game';
        this.riverMelody.phase = 'demo';
        this.riverMelody.demoIndex = 0;
        this.riverMelody.demoTimer = 1.0;
      }
    },

    setupRiverMelodyRound(roundIdx) {
      const rm = this.riverMelody;
      if (!rm) return;
      rm.roundIndex = clamp(roundIdx, 0, 4);
      rm.demoIndex = 0;
      rm.demoTimer = 1.0;
      rm.playerIndex = 0;
      rm.phase = 'demo';
      for (let i = 0; i < rm.crystals.length; i++) {
        const c = rm.crystals[i];
        c.liftY = 0;
        c.floating = false;
        c.orderStep = null;
        c.isReference = (i === rm.masterSequence[0]);
        c.glowing = c.isReference;
        c.shakeTimer = 0;
      }
    },

    isInsideRiverMelodyCrystal(c, x, y) {
      if (!c || c.x == null || c.baseY == null) return false;
      if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
      const hw = 13;
      if (Math.abs(x - c.x) > hw) return false;
      const lift = Math.max(0, Number(c.liftY) || 0);
      const cy = c.baseY - lift;
      const minY = Math.min(cy - 22, c.baseY - 22);
      const maxY = Math.max(cy + 16, c.baseY + 16);
      return y >= minY && y <= maxY;
    },

    clickRiverMelodyCrystal(gemIdx) {
      const rm = this.riverMelody;
      if (!rm || this.phase !== 'river_melody_game' || rm.phase !== 'player_input') return false;
      const targetSeq = rm.masterSequence.slice(0, rm.roundIndex + 1);
      const expectedNote = targetSeq[rm.playerIndex];
      const crystal = rm.crystals[gemIdx];
      if (!crystal) return false;

      if (gemIdx === expectedNote) {
        crystal.liftY = 14;
        crystal.glowing = true;
        this.spawnShatter(crystal.x, crystal.baseY - 14, crystal.type, 4);
        if (global.CrystalAudio?.playRiverNote) {
          global.CrystalAudio.playRiverNote(gemIdx);
        } else {
          GameHUD.playSfx('click');
        }

        rm.playerIndex++;
        if (rm.playerIndex >= targetSeq.length) {
          rm.phase = 'success_pause';
          rm.phaseTimer = 0;
          this.spawnFloatingBanner('Acorde Perfeito!', 160, 50);
          if (rm.roundIndex >= 4) {
            setTimeout(() => {
              this.finishRiverMelodyVictory();
            }, 900);
          } else {
            setTimeout(() => {
              if (this.riverMelody && this.phase === 'river_melody_game') {
                this.setupRiverMelodyRound(rm.roundIndex + 1);
              }
            }, 1000);
          }
        }
        return true;
      } else {
        crystal.shakeTimer = 0.6;
        if (global.CrystalAudio?.errorFairy) {
          global.CrystalAudio.errorFairy();
        } else {
          GameHUD.playSfx('error');
        }

        rm.phase = 'error_pause';
        rm.phaseTimer = 0;

        DialogueBox.open([
          {
            speaker: 'Irecê',
            portrait: 'portrait_irece',
            text: 'Que pena... você errou dessa vez... mas não se preocupe, pode tentar de novo!'
          }
        ], () => {
          if (this.riverMelody && this.phase === 'river_melody_game') {
            this.setupRiverMelodyRound(rm.roundIndex);
          }
        });
        return false;
      }
    },

    updateRiverMelodyGame(dt) {
      const rm = this.riverMelody;
      if (!rm || this.phase !== 'river_melody_game') return;

      const targetSeq = rm.masterSequence.slice(0, rm.roundIndex + 1);
      const noteDuration = rm.calmMode ? 0.9 : 0.6;

      for (const c of rm.crystals) {
        if (c.shakeTimer > 0) c.shakeTimer = Math.max(0, c.shakeTimer - dt);
        if (rm.phase === 'demo') {
          // Enquanto os cristais estiverem tocando na demonstração, eles ficam flutuando
          // criando a ordem que deve ser tocada
          if (c.floating) {
            c.liftY = 14;
          } else {
            c.liftY = 0;
          }
        } else {
          // Após a demonstração e durante a entrada do jogador, eles descem suavemente
          if (c.liftY > 0) {
            c.liftY = Math.max(0, c.liftY - dt * 24);
            if (c.liftY <= 0) {
              c.glowing = false;
              c.orderStep = null;
            }
          }
        }
      }

      if (rm.phase === 'demo') {
        rm.demoTimer -= dt;
        if (rm.demoTimer <= 0) {
          if (rm.demoIndex < targetSeq.length) {
            const noteIdx = targetSeq[rm.demoIndex];
            const crystal = rm.crystals[noteIdx];
            crystal.floating = true;
            crystal.liftY = 14;
            crystal.orderStep = rm.demoIndex + 1;
            crystal.glowing = true;
            this.spawnShatter(crystal.x, crystal.baseY - 14, crystal.type, 3);
            if (global.CrystalAudio?.playRiverNote) {
              global.CrystalAudio.playRiverNote(noteIdx);
            } else {
              GameHUD.playSfx('click');
            }
            rm.demoIndex++;
            rm.demoTimer = noteDuration;
          } else {
            // Demonstração concluída: "e após isso eles descem"
            for (const c of rm.crystals) {
              c.floating = false;
            }
            rm.phase = 'player_input';
            rm.playerIndex = 0;
          }
        }
      }
    },

    drawRiverMelodyGame(ctx, tq) {
      const rm = this.riverMelody;
      if (!rm) return;

      drawParchmentBox(ctx, 84, 23, 152, 15);
      drawPixelTextCentered(
        ctx,
        `Sinfonia das Águas - Melodia ${rm.roundIndex + 1}/5`,
        160,
        27,
        '#ffffff',
        '#000000',
        144,
        8
      );

      const cb = this.shellCalmBtnRect;
      ctx.fillStyle = '#2c221e';
      ctx.fillRect(cb.x - 1, cb.y - 1, cb.w + 2, cb.h + 2);
      ctx.fillStyle = rm.calmMode ? '#1e40af' : '#234e52';
      ctx.fillRect(cb.x, cb.y, cb.w, cb.h);
      ctx.fillStyle = '#57d1de';
      ctx.fillRect(cb.x, cb.y, cb.w, 1);
      drawPixelTextCentered(
        ctx,
        rm.calmMode ? 'Modo Calmo: ON' : 'Modo Calmo: OFF',
        cb.x + cb.w / 2,
        cb.y + 3,
        '#d9fffb',
        '#082f49',
        cb.w - 4,
        8
      );

      const targetSeq = rm.masterSequence.slice(0, rm.roundIndex + 1);
      const expectedNote = rm.phase === 'player_input' ? targetSeq[rm.playerIndex] : -1;

      for (let i = 0; i < rm.crystals.length; i++) {
        const c = rm.crystals[i];
        const shakeX = c.shakeTimer > 0 ? (Math.sin(tq * 40) * 4) : 0;
        const cx = R(c.x + shakeX), cy = R(c.baseY - (c.liftY || 0));

        const wave = Math.sin(tq * 3 + i) * 1.5;
        ctx.fillStyle = 'rgba(87, 209, 222, 0.35)';
        ctx.fillRect(cx - 10, c.baseY + 12 + wave, 20, 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fillRect(cx - 5, c.baseY + 12 + wave, 10, 1);

        if (rm.calmMode && i === expectedNote) {
          ctx.fillStyle = '#57d1de';
          ctx.fillRect(cx - 8, c.baseY + 15, 16, 2);
          P1(ctx, cx, c.baseY + 14, '#ffffff');
        }

        if (c.glowing) {
          drawRing(ctx, cx, cy, 18, '#ffffff');
          drawRing(ctx, cx, cy, 22, '#57d1de');
          drawStar(ctx, cx, cy - 14, 3, '#ffffff', '#57d1de');
        }

        const sprKey = `${c.type}_pure`;
        const spr = GEM_SPRITES[sprKey] || GEM_SPRITES.aqua_pure;
        const gw = spr.width * 0.5, gh = spr.height * 0.5;
        ctx.drawImage(spr, RH(cx - gw / 2), RH(cy - gh / 2), gw, gh);

        drawStar(ctx, cx, cy - 8, 2, '#ffffff', '#d9fffb');

        // Distintivo da ordem enquanto flutuam na melodia: "criando a ordem que deve ser tocado"
        if (c.orderStep && (c.floating || c.liftY > 4)) {
          const bx = cx, by = cy - 16;
          ctx.fillStyle = '#1e1b4b';
          ctx.fillRect(bx - 5, by - 5, 10, 10);
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(bx - 4, by - 4, 8, 8);
          drawPixelChar(ctx, String(c.orderStep), bx - 2, by - 3, '#1e1b4b');
        }
      }

      if (rm.phase === 'demo') {
        drawParchmentBox(ctx, 64, 128, 192, 16);
        const demoLabel = (rm.demoIndex === 0 && rm.demoTimer > 0)
          ? 'Observe o cristal de referência...'
          : 'Ouça com atenção a melodia...';
        drawPixelTextCentered(ctx, demoLabel, 160, 132, '#ffea31', '#000000', 184, 8);
      } else if (rm.phase === 'player_input') {
        drawParchmentBox(ctx, 64, 128, 192, 16);
        drawPixelTextCentered(ctx, `Toque os cristais na ordem! (${rm.playerIndex}/${rm.roundIndex + 1})`, 160, 132, '#ffea31', '#000000', 184, 8);
      }
    },

    finishRiverMelodyVictory() {
      const spec = this.getSpec();
      const syncInfo = spec.nodeSyncByLevel[this.currentLevel];
      if (syncInfo) {
        global.CrystalApp?.syncProgress?.(syncInfo.ids, syncInfo.next);
      }
      this.obstacleDecay = 1;
      this.giantCrystalBroken = true;
      this.waveActive = true;
      this.waveRadius = 300;
      this.phase = 'post_musical_dlg';
      this.phaseTime = 0;
      this.protag.x = 68;
      this.protag.state = 'idle';
      this.ordemCompanion.x = 96;
      this.ordemCompanion.state = 'idle';
      this.guardianActor.visible = true;
      this.guardianActor.x = 152;
      this.guardianActor.y = 142;
      this.guardianActor.state = 'idle';
      this.guardianActor.flipX = true;

      DialogueBox.sockets.river = true;
      const lines = (spec.postDialogues && spec.postDialogues[5]) || [];
      DialogueBox.open(lines, () => {
        this.phase = 'world_celebrate_complete';
        this.phaseTime = 0;
        this.protag.state = 'celebrate';
        this.ordemCompanion.state = 'celebrate';
        this.guardianActor.state = 'celebrate';
      });
    },

    // ==========================================================================
    // MINIGAME DA FASE 5 DA FLORESTA: CORTE CRISTALINO ('FRUIT NINJA' EM 4 ETAPAS)
    // ==========================================================================
    startForestNinjaGame() {
      const assistEl = typeof document !== 'undefined' ? document.getElementById('assistToggle') : null;
      const calmDefault = Boolean(assistEl?.checked || global.CrystalApp?.state?.settings?.assist);

      this.forestNinja = {
        phase: 'vignette',
        vignetteCard: 1, // 1: Vídeo explicativo, 2: Treino livre
        vignettePracticeTime: 0,
        calmMode: calmDefault,

        currentStage: 1, // 1 a 4
        totalStages: 4,
        stageDuration: 30.0, // ~30 segundos por etapa
        stageTimeRemaining: 30.0,

        strikes: 0,
        maxStrikes: 3,

        score: 0,
        pureCuts: 0,
        maxCombo: 0,

        spawnTimer: 0.8,

        flyingCrystals: [],
        halvedCrystals: [],
        bladeTrail: [],

        isSlicing: false,
        lastStrokeX: 0,
        lastStrokeY: 0,
        strokePureCuts: 0,
        strokeCrystals: [],

        activeComboBanner: null, // { text, x, y, scale, alpha, timer, duration, color }
        floatingBanner: null,    // { text, x, y, color, timer }
        shakeTimer: 0,

        // Treino do Card 2
        practiceCrystals: [],
        practiceHalves: [],
        practiceTrail: [],
        practiceSpawnTimer: 0.6,
        practiceBanner: null,
        practiceStrokeCuts: 0,
        practiceStrokeCrystals: []
      };

      if (typeof window !== 'undefined') {
        window.ForestCrystalNinja = this.forestNinja;
      }

      this.pieces = [
        { id: 'fo5_ninja_target_emerald', type: 'emerald', value: 2, shadow: false, x: 120, y: 104 },
        { id: 'fo5_ninja_target_quartz', type: 'white', value: 2, shadow: false, x: 196, y: 104 }
      ];

      this.phase = 'forest_ninja_vignette';
      this.phaseTime = 0;
      this.playSpecialBgm();
    },

    startForestNinjaStage(stageNum) {
      this.playSpecialBgm();
      const fn = this.forestNinja;
      if (!fn) return;
      fn.currentStage = clamp(stageNum, 1, 4);
      this.currentStep = fn.currentStage;
      this.totalSteps = fn.totalStages;
      fn.stageTimeRemaining = fn.stageDuration;
      fn.strikes = 0;
      fn.flyingCrystals = [];
      fn.halvedCrystals = [];
      fn.bladeTrail = [];
      fn.isSlicing = false;
      fn.strokePureCuts = 0;
      fn.strokeCrystals = [];
      fn.activeComboBanner = null;
      fn.spawnTimer = 0.6;
      this.phase = 'forest_ninja_game';

      const stageTitles = {
        1: 'ETAPA 1: CORTE CRISTALINO',
        2: 'ETAPA 2: CRISTAIS SOMBRIOS!',
        3: 'ETAPA 3: SOMBRAS EM ENXAME',
        4: 'ETAPA 4: O CLÍMAX DA MATA!'
      };
      const stageColors = {
        1: '#2ecc71',
        2: '#e74c3c',
        3: '#9b59b6',
        4: '#f39c12'
      };
      fn.floatingBanner = {
        text: stageTitles[fn.currentStage] || 'NOVA ETAPA!',
        color: stageColors[fn.currentStage] || '#ffffff',
        x: 160,
        y: 65,
        timer: 2.2
      };
      GameHUD.playSfx('start');
    },

    restartForestNinjaStage() {
      const fn = this.forestNinja;
      if (!fn) return;
      fn.strikes = 0;
      fn.stageTimeRemaining = fn.stageDuration;
      fn.flyingCrystals = [];
      fn.halvedCrystals = [];
      fn.bladeTrail = [];
      fn.strokePureCuts = 0;
      fn.strokeCrystals = [];
      fn.activeComboBanner = null;
      fn.bladeTrail = [];
      fn.isSlicing = false;
      fn.strokePureCuts = 0;
      fn.activeComboBanner = null;
      fn.floatingBanner = {
        text: `3 Sombras cortadas! Reiniciando Etapa ${fn.currentStage}...`,
        color: '#e74c3c',
        x: 160,
        y: 65,
        timer: 2.6
      };
      this.clearTrembleStates?.();
      GameHUD.playSfx('error');
    },

    spawnForestNinjaWave(isPractice = false) {
      const fn = this.forestNinja;
      if (!fn) return;
      const g = 135; // px/s² gravidade
      const speedMult = fn.calmMode ? 0.88 : 1.0;

      const makeCrystal = (isShadow, preferredType = null) => {
        const types = ['emerald', 'white', 'citrine', 'aqua', 'rose'];
        const type = isShadow ? 'shadow_bomb' : (preferredType || types[Math.floor(Math.random() * types.length)]);
        const startX = R(55 + Math.random() * 210);
        const startY = 186; // Começa imediatamente abaixo da tela (180px)

        // Vértice do salto rigorosamente entre 32px e 64px para NUNCA cruzar o topo
        const targetApexY = R(32 + Math.random() * 32);
        const deltaH = startY - targetApexY; // 122 a 154 px
        const vy = -Math.sqrt(2 * g * deltaH) * speedMult;

        // Velocidade horizontal direcionada suavemente ao centro da tela
        let vx = 0;
        if (startX < 120) {
          vx = (15 + Math.random() * 25) * speedMult;
        } else if (startX > 200) {
          vx = (-15 - Math.random() * 25) * speedMult;
        } else {
          vx = (-20 + Math.random() * 40) * speedMult;
        }

        return {
          id: 'c_' + Math.random().toString(36).slice(2, 8),
          type,
          shadow: Boolean(isShadow),
          x: startX,
          y: startY,
          vx,
          vy,
          rot: Math.random() * Math.PI * 2,
          vrot: (-2.5 + Math.random() * 5.0),
          radius: 13,
          value: isShadow ? 1 : (1 + Math.floor(Math.random() * 4)),
          sliced: false
        };
      };

      if (isPractice) {
        // Modo treino: lança 1 ou 2 cristais puros e ocasionalmente 1 sombra de teste inofensiva
        const count = 1 + (Math.random() < 0.65 ? 1 : 0);
        for (let i = 0; i < count; i++) {
          fn.practiceCrystals.push(makeCrystal(false));
        }
        if (Math.random() < 0.28 && fn.practiceCrystals.length < 3) {
          fn.practiceCrystals.push(makeCrystal(true));
        }
        return;
      }

      // 4 Etapas do jogo oficial:
      const stage = fn.currentStage;
      if (stage === 1) {
        // Etapa 1: APENAS cristais puros (focada na mecânica normal de cortar e combos)
        const count = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
          fn.flyingCrystals.push(makeCrystal(false));
        }
      } else if (stage === 2) {
        // Etapa 2: Introduz cristais sombrios que não podem ser cortados até 3 vezes
        const pureCount = 2 + (Math.random() < 0.5 ? 1 : 0);
        for (let i = 0; i < pureCount; i++) {
          fn.flyingCrystals.push(makeCrystal(false));
        }
        fn.flyingCrystals.push(makeCrystal(true));
      } else if (stage === 3) {
        // Etapa 3: Adição de mais cristais sombrios a serem evitados durante os cortes
        const pureCount = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < pureCount; i++) {
          fn.flyingCrystals.push(makeCrystal(false));
        }
        const shadowCount = 1 + (Math.random() < 0.7 ? 1 : 0);
        for (let s = 0; s < shadowCount; s++) {
          fn.flyingCrystals.push(makeCrystal(true));
        }
      } else if (stage === 4) {
        // Etapa 4: Adição de mais cristais sombrios em trajetórias cruzadas densas
        const pureCount = 3 + (Math.random() < 0.5 ? 1 : 0);
        for (let i = 0; i < pureCount; i++) {
          fn.flyingCrystals.push(makeCrystal(false));
        }
        const shadowCount = 2 + (Math.random() < 0.4 ? 1 : 0);
        for (let s = 0; s < shadowCount; s++) {
          fn.flyingCrystals.push(makeCrystal(true));
        }
      }
    },

    sliceForestCrystal(crystal, isPractice = false) {
      const fn = this.forestNinja;
      if (!fn || crystal.sliced) return false;
      crystal.sliced = true;

      if (crystal.shadow) {
        // Cristais sombrios: NÃO podem ser cortados!
        if (isPractice) {
          this.spawnShatter(crystal.x, crystal.y, 'rock', 12);
          GameHUD.playSfx('error');
          fn.practiceBanner = {
            text: 'CUIDADO: Sombra evitada no treino!',
            color: '#e74c3c',
            timer: 1.5,
            x: 160,
            y: 70
          };
          return false;
        }

        fn.strikes++;
        fn.shakeTimer = 0.35;
        fn.stageTimeRemaining = Math.max(0, fn.stageTimeRemaining - 2.0);
        this.spawnShatter(crystal.x, crystal.y, 'rock', 14);
        if (global.CrystalAudio?.shadowStrike) {
          global.CrystalAudio.shadowStrike();
        } else {
          GameHUD.playSfx('error');
        }

        // Sem reset total da partida: apenas penaliza subtraindo 2 segundos do tempo restante!
        fn.floatingBanner = {
          text: 'CRISTAL SOMBRIO! -2s!',
          color: '#ff4d4d',
          x: 160,
          y: 65,
          timer: 1.6
        };
        return false;
      }

      // Cristais puros: cortáveis! Divide em duas metades com física de separação
      const halfList = isPractice ? fn.practiceHalves : fn.halvedCrystals;
      const sprType = crystal.type || 'emerald';

      halfList.push({
        x: crystal.x - 4,
        y: crystal.y,
        vx: crystal.vx - 32,
        vy: crystal.vy - 18,
        rot: crystal.rot,
        vrot: -5.5,
        type: sprType,
        side: 'left',
        alpha: 1.0
      });
      halfList.push({
        x: crystal.x + 4,
        y: crystal.y,
        vx: crystal.vx + 32,
        vy: crystal.vy - 18,
        rot: crystal.rot,
        vrot: 5.5,
        type: sprType,
        side: 'right',
        alpha: 1.0
      });

      this.spawnShatter(crystal.x, crystal.y, sprType === 'shadow_bomb' ? 'pure' : sprType, 8);
      if (global.CrystalAudio?.crystalSlice) {
        global.CrystalAudio.crystalSlice();
      } else {
        GameHUD.playSfx('reward');
      }

      if (isPractice) {
        fn.practiceStrokeCuts = (fn.practiceStrokeCuts || 0) + 1;
        fn.practiceStrokeCrystals.push(crystal);
        if (fn.practiceStrokeCuts >= 2) {
          const comboTxt = `COMBO X${fn.practiceStrokeCuts}!`;
          fn.activeComboBanner = {
            text: comboTxt,
            x: crystal.x,
            y: crystal.y - 12,
            scale: 1.4,
            alpha: 1.0,
            timer: 1.3,
            count: fn.practiceStrokeCuts
          };
          if (global.CrystalAudio?.comboChime) global.CrystalAudio.comboChime(fn.practiceStrokeCuts);
        }
        return true;
      }

      fn.pureCuts++;
      fn.score += 10;
      fn.strokePureCuts++;
      fn.strokeCrystals.push(crystal);

      // Mecânica de combo caso corte 2, 3 ou 4 cristais de uma vez
      if (fn.strokePureCuts >= 2) {
        fn.score += fn.strokePureCuts * 5;
        fn.maxCombo = Math.max(fn.maxCombo, fn.strokePureCuts);
        const comboTxt = `COMBO X${fn.strokePureCuts}!`;
        const avgX = fn.strokeCrystals.reduce((acc, c) => acc + c.x, 0) / fn.strokeCrystals.length;
        const avgY = fn.strokeCrystals.reduce((acc, c) => acc + c.y, 0) / fn.strokeCrystals.length;

        fn.activeComboBanner = {
          text: comboTxt,
          x: avgX,
          y: avgY - 14,
          scale: 1.5,
          alpha: 1.0,
          timer: 1.4,
          count: fn.strokePureCuts
        };
        if (global.CrystalAudio?.comboChime) {
          global.CrystalAudio.comboChime(fn.strokePureCuts);
        } else {
          GameHUD.playSfx('reward');
        }
      }
      return true;
    },

    updateForestNinjaGame(dt) {
      const fn = this.forestNinja;
      if (!fn) return;
      const g = 135;

      // 1. Vinheta (Demonstração no Card 1 ou Treino no Card 2)
      if (this.phase === 'forest_ninja_vignette') {
        if (fn.vignetteCard === 1) {
          fn.vignettePracticeTime += dt;
        } else if (fn.vignetteCard === 2) {
          fn.vignettePracticeTime += dt;
          fn.practiceSpawnTimer -= dt;
          if (fn.practiceSpawnTimer <= 0) {
            this.spawnForestNinjaWave(true);
            fn.practiceSpawnTimer = 1.6 + Math.random() * 0.8;
          }

          // Atualiza cristais do modo treino
          for (let i = fn.practiceCrystals.length - 1; i >= 0; i--) {
            const c = fn.practiceCrystals[i];
            c.x += c.vx * dt;
            c.y += c.vy * dt;
            c.vy += g * dt;
            c.rot += c.vrot * dt;
            if (c.y > 195 && c.vy > 0) {
              fn.practiceCrystals.splice(i, 1);
            }
          }
          // Atualiza metades cortadas do treino
          for (let i = fn.practiceHalves.length - 1; i >= 0; i--) {
            const h = fn.practiceHalves[i];
            h.x += h.vx * dt;
            h.y += h.vy * dt;
            h.vy += g * 1.2 * dt;
            h.rot += h.vrot * dt;
            h.alpha -= dt * 0.5;
            if (h.y > 200 || h.alpha <= 0) {
              fn.practiceHalves.splice(i, 1);
            }
          }
          // Atualiza rastro de corte do treino
          const now = fn.vignettePracticeTime;
          fn.practiceTrail = fn.practiceTrail.filter((p) => now - p.time < 0.16);
          if (fn.activeComboBanner) {
            fn.activeComboBanner.timer -= dt;
            fn.activeComboBanner.y -= 12 * dt;
            if (fn.activeComboBanner.timer <= 0) fn.activeComboBanner = null;
          }
          if (fn.practiceBanner) {
            fn.practiceBanner.timer -= dt;
            if (fn.practiceBanner.timer <= 0) fn.practiceBanner = null;
          }
        }
        return;
      }

      // 2. Jogo ao vivo (Etapas 1..4)
      if (this.phase !== 'forest_ninja_game') return;

      if (fn.shakeTimer > 0) fn.shakeTimer = Math.max(0, fn.shakeTimer - dt);

      // Atualiza banner de combo
      if (fn.activeComboBanner) {
        fn.activeComboBanner.timer -= dt;
        fn.activeComboBanner.y -= 10 * dt;
        if (fn.activeComboBanner.timer <= 0) fn.activeComboBanner = null;
      }
      if (fn.floatingBanner) {
        fn.floatingBanner.timer -= dt;
        if (fn.floatingBanner.timer <= 0) fn.floatingBanner = null;
      }

      // Rastro de corte
      const curTime = typeof performance !== 'undefined' ? performance.now() / 1000 : 0;
      fn.bladeTrail = fn.bladeTrail.filter((pt) => curTime - pt.time < 0.18);

      // Contagem regressiva da etapa (~30 segundos)
      fn.stageTimeRemaining -= dt;
      if (fn.stageTimeRemaining <= 0) {
        fn.stageTimeRemaining = 0;
        if (fn.currentStage < fn.totalStages) {
          GameHUD.playSfx('reward');
          this.startForestNinjaStage(fn.currentStage + 1);
        } else {
          this.finishForestNinjaVictory();
        }
        return;
      }

      // Spawner de ondas
      fn.spawnTimer -= dt;
      if (fn.spawnTimer <= 0) {
        this.spawnForestNinjaWave(false);
        const intervalBase = fn.currentStage === 1 ? 1.8 : (fn.currentStage === 2 ? 1.7 : 1.5);
        fn.spawnTimer = intervalBase + Math.random() * 0.7;
      }

      // Movimento dos cristais no ar com gravidade
      for (let i = fn.flyingCrystals.length - 1; i >= 0; i--) {
        const c = fn.flyingCrystals[i];
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.vy += g * dt;
        c.rot += c.vrot * dt;

        if (c.y > 195 && c.vy > 0) {
          fn.flyingCrystals.splice(i, 1);
        }
      }

      // Movimento das metades cortadas
      for (let i = fn.halvedCrystals.length - 1; i >= 0; i--) {
        const h = fn.halvedCrystals[i];
        h.x += h.vx * dt;
        h.y += h.vy * dt;
        h.vy += g * 1.2 * dt;
        h.rot += h.vrot * dt;
        h.alpha -= dt * 0.55;
        if (h.y > 200 || h.alpha <= 0) {
          fn.halvedCrystals.splice(i, 1);
        }
      }
    },

    handleForestNinjaVignetteClick(x, y) {
      const fn = this.forestNinja;
      if (!fn || this.phase !== 'forest_ninja_vignette') return false;
      const cx = 24, cy = 18, cw = 272, ch = 152;

      if (fn.vignetteCard === 1) {
        // Botão "Praticar Corte >" no Card 1
        const b = { x: cx + cw - 96, y: cy + ch - 18, w: 86, h: 14 };
        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
          GameHUD.playSfx('click');
          fn.vignetteCard = 2;
          fn.practiceCrystals = [];
          fn.practiceHalves = [];
          fn.practiceTrail = [];
          fn.practiceSpawnTimer = 0.4;
          return true;
        }
      } else if (fn.vignetteCard === 2) {
        // Botões do Card 2:
        // 1. "< Vídeo"
        const bBack = { x: cx + 10, y: cy + ch - 18, w: 72, h: 14 };
        if (x >= bBack.x && x <= bBack.x + bBack.w && y >= bBack.y && y <= bBack.y + bBack.h) {
          GameHUD.playSfx('click');
          fn.vignetteCard = 1;
          return true;
        }
        // 2. "↺ Recomeçar"
        const bReset = { x: cx + 86, y: cy + ch - 18, w: 76, h: 14 };
        if (x >= bReset.x && x <= bReset.x + bReset.w && y >= bReset.y && y <= bReset.y + bReset.h) {
          GameHUD.playSfx('click');
          fn.practiceCrystals = [];
          fn.practiceHalves = [];
          fn.practiceTrail = [];
          fn.practiceSpawnTimer = 0.4;
          return true;
        }
        // 3. "Iniciar Desafio! ⚔"
        const bStart = { x: cx + cw - 96, y: cy + ch - 18, w: 86, h: 14 };
        if (x >= bStart.x && x <= bStart.x + bStart.w && y >= bStart.y && y <= bStart.y + bStart.h) {
          this.startForestNinjaStage(1);
          return true;
        }

        // Toque na arena de treino (para cortar cristais)
        const arena = { x: cx + 12, y: cy + 30, w: cw - 24, h: 88 };
        if (x >= arena.x && x <= arena.x + arena.w && y >= arena.y && y <= arena.y + arena.h) {
          fn.isSlicing = true;
          fn.lastStrokeX = x;
          fn.lastStrokeY = y;
          fn.practiceStrokeCuts = 0;
          fn.practiceStrokeCrystals = [];
          const now = fn.vignettePracticeTime;
          fn.practiceTrail.push({ x, y, time: now });

          for (let i = fn.practiceCrystals.length - 1; i >= 0; i--) {
            const c = fn.practiceCrystals[i];
            if (Math.hypot(x - c.x, y - c.y) <= (c.radius + 6)) {
              this.sliceForestCrystal(c, true);
              fn.practiceCrystals.splice(i, 1);
            }
          }
          return true;
        }
      }
      return false;
    },

    handleForestNinjaPointerDown(x, y) {
      const fn = this.forestNinja;
      if (!fn || this.phase !== 'forest_ninja_game') return false;
      if (y <= 20) return false;

      fn.isSlicing = true;
      fn.lastStrokeX = x;
      fn.lastStrokeY = y;
      fn.strokePureCuts = 0;
      fn.strokeCrystals = [];

      const curTime = typeof performance !== 'undefined' ? performance.now() / 1000 : 0;
      fn.bladeTrail.push({ x, y, time: curTime });

      // Verificação de clique direto (suporte acessível / Modo Toque Único)
      for (let i = fn.flyingCrystals.length - 1; i >= 0; i--) {
        const c = fn.flyingCrystals[i];
        if (Math.hypot(x - c.x, y - c.y) <= (c.radius + 6)) {
          this.sliceForestCrystal(c, false);
          fn.flyingCrystals.splice(i, 1);
        }
      }
      return true;
    },

    handleForestNinjaPointerMove(x, y) {
      const fn = this.forestNinja;
      if (!fn) return;

      const isPractice = this.phase === 'forest_ninja_vignette' && fn.vignetteCard === 2;
      if (!isPractice && this.phase !== 'forest_ninja_game') return;
      if (!fn.isSlicing) {
        fn.isSlicing = true;
        fn.lastStrokeX = x;
        fn.lastStrokeY = y;
      }

      const curTime = isPractice ? fn.vignettePracticeTime : (typeof performance !== 'undefined' ? performance.now() / 1000 : 0);
      const trail = isPractice ? fn.practiceTrail : fn.bladeTrail;
      trail.push({ x, y, time: curTime });

      const x1 = fn.lastStrokeX;
      const y1 = fn.lastStrokeY;
      const x2 = x;
      const y2 = y;
      const crystals = isPractice ? fn.practiceCrystals : fn.flyingCrystals;

      const distToSeg = (px, py) => {
        const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
        if (l2 < 1) return Math.hypot(px - x1, py - y1);
        const t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2));
        const qx = x1 + t * (x2 - x1);
        const qy = y1 + t * (y2 - y1);
        return Math.hypot(px - qx, py - qy);
      };

      for (let i = crystals.length - 1; i >= 0; i--) {
        const c = crystals[i];
        if (distToSeg(c.x, c.y) <= (c.radius + 6)) {
          this.sliceForestCrystal(c, isPractice);
          crystals.splice(i, 1);
        }
      }

      fn.lastStrokeX = x;
      fn.lastStrokeY = y;
    },

    handleForestNinjaPointerUp() {
      const fn = this.forestNinja;
      if (!fn) return;
      fn.isSlicing = false;
      fn.strokePureCuts = 0;
      fn.strokeCrystals = [];
      fn.practiceStrokeCuts = 0;
      fn.practiceStrokeCrystals = [];
    },

    handleForestNinjaKeyboardSlash() {
      const fn = this.forestNinja;
      if (!fn) return;
      const isPractice = this.phase === 'forest_ninja_vignette' && fn.vignetteCard === 2;
      const crystals = isPractice ? fn.practiceCrystals : fn.flyingCrystals;
      if (!crystals.length) return;

      // Corta até 2 cristais puros no ar com golpe de espada cristalina
      const pures = crystals.filter((c) => !c.shadow && c.y < 160);
      const targets = pures.slice(0, 2);
      if (targets.length) {
        fn.isSlicing = true;
        fn.strokePureCuts = 0;
        fn.strokeCrystals = [];
        targets.forEach((c) => {
          const idx = crystals.indexOf(c);
          if (idx !== -1) {
            this.sliceForestCrystal(c, isPractice);
            crystals.splice(idx, 1);
          }
        });
        fn.isSlicing = false;
      }
    },

    finishForestNinjaVictory() {
      const spec = this.getSpec();
      const syncInfo = spec.nodeSyncByLevel[this.currentLevel];
      if (syncInfo) {
        global.CrystalApp?.syncProgress?.(syncInfo.ids, syncInfo.next);
      }
      this.obstacleDecay = 1;
      this.giantCrystalBroken = true;
      this.waveActive = true;
      this.waveRadius = 300;
      this.phase = 'post_musical_dlg';
      this.phaseTime = 0;
      this.protag.x = 68;
      this.protag.state = 'idle';
      this.ordemCompanion.x = 96;
      this.ordemCompanion.state = 'idle';
      this.guardianActor.visible = true;
      this.guardianActor.x = 152;
      this.guardianActor.y = 142;
      this.guardianActor.state = 'idle';
      this.guardianActor.flipX = true;

      DialogueBox.sockets.forest = true;
      const lines = (spec.postDialogues && spec.postDialogues[5]) || [];
      DialogueBox.open(lines, () => {
        this.phase = 'world_celebrate_complete';
        this.phaseTime = 0;
        this.protag.state = 'celebrate';
        this.ordemCompanion.state = 'celebrate';
        this.guardianActor.state = 'celebrate';
      });
    },

    drawForestNinjaGame(ctx, tq) {
      const fn = this.forestNinja;
      if (!fn) return;

      if (this.phase === 'forest_ninja_vignette') {
        this.drawForestNinjaVignette(ctx, tq);
        return;
      }

      ctx.save();
      if (fn.shakeTimer > 0) {
        const sMag = fn.shakeTimer * 7;
        ctx.translate(RH((Math.sin(tq * 50) * sMag)), RH((Math.cos(tq * 50) * sMag)));
      }

      // 1. Cristais inteiros arremessados no ar
      for (const c of fn.flyingCrystals) {
        ctx.save();
        ctx.translate(RH(c.x), RH(c.y));
        ctx.rotate(c.rot);

        if (c.shadow) {
          // Cristal Sombrio (obsidiana com aura violeta sinistra e centelhas)
          drawRing(ctx, 0, 0, 15, '#7c3aed');
          const spr = GEM_SPRITES.shadow_bomb || GEM_SPRITES.white_shadow;
          const gw = spr.width * 0.5, gh = spr.height * 0.5;
          ctx.drawImage(spr, RH(-gw / 2), RH(-gh / 2), gw, gh);
          drawStar(ctx, 0, -8, 2, '#c084fc', '#4c1d95');
        } else {
          // Cristal Puro (brilhante com facetas e pips de energia)
          const sprKey = (c.type === 'emerald' ? 'emerald_core' : `${c.type}_pure`);
          const spr = GEM_SPRITES[sprKey] || GEM_SPRITES.emerald_core;
          const gw = spr.width * 0.5, gh = spr.height * 0.5;
          ctx.drawImage(spr, RH(-gw / 2), RH(-gh / 2), gw, gh);

          // Pips luminosos orbitando
          const pCol = c.type === 'emerald' ? '#8ed46a' : (c.type === 'citrine' ? '#fde047' : '#a5f3fc');
          for (let p = 0; p < c.value; p++) {
            const ang = (p / c.value) * Math.PI * 2;
            P1(ctx, RH(Math.cos(ang) * 9), RH(Math.sin(ang) * 9), pCol);
          }
          drawStar(ctx, 0, -6, 2, '#ffffff', pCol);
        }
        ctx.restore();
      }

      // 2. Metades de cristais cortados (efeito de divisão limpa do corte)
      for (const h of fn.halvedCrystals) {
        ctx.save();
        ctx.globalAlpha = clamp(h.alpha, 0, 1);
        ctx.translate(RH(h.x), RH(h.y));
        ctx.rotate(h.rot);

        const sprKey = (h.type === 'emerald' ? 'emerald_core' : `${h.type}_pure`);
        const spr = GEM_SPRITES[sprKey] || GEM_SPRITES.emerald_core;
        const gw = spr.width * 0.5, gh = spr.height * 0.5;
        const halfSprW = spr.width * 0.5;

        if (h.side === 'left') {
          ctx.drawImage(spr, 0, 0, halfSprW, spr.height, RH(-gw / 2), RH(-gh / 2), gw * 0.5, gh);
        } else {
          ctx.drawImage(spr, halfSprW, 0, halfSprW, spr.height, 0, RH(-gh / 2), gw * 0.5, gh);
        }
        ctx.restore();
      }

      // 3. Rastro do corte ninja em True Pixel Art
      if (fn.bladeTrail.length >= 2) {
        ctx.save();
        for (let i = 0; i < fn.bladeTrail.length - 1; i++) {
          const p1 = fn.bladeTrail[i];
          const p2 = fn.bladeTrail[i + 1];
          // Núcleo brilhante
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(RH(p1.x), RH(p1.y));
          ctx.lineTo(RH(p2.x), RH(p2.y));
          ctx.stroke();

          // Centelhas ao longo da lâmina
          P1(ctx, RH(p2.x), RH(p2.y), '#6ef58c');
        }
        ctx.restore();
      }

      ctx.restore();

      // 4. Barra Superior do Desafio: Etapa / Tempo 30s / Pontuação visível da criança
      const barBox = { x: 24, y: 22, w: 272, h: 16 };
      drawParchmentBox(ctx, barBox.x, barBox.y, barBox.w, barBox.h);

      // Etapa (1 a 4)
      drawPixelText(ctx, `Etapa ${fn.currentStage}/4`, barBox.x + 8, barBox.y + 4, '#ffffff', '#000000', 64, 8);

      // Tempo de 30 segundos
      const secLeft = Math.max(0, Math.ceil(fn.stageTimeRemaining));
      const timeCol = secLeft <= 5 ? '#ff4d4d' : '#ffea31';
      drawPixelTextCentered(ctx, `Tempo: ${secLeft}s`, 154, barBox.y + 4, timeCol, '#000000', 76, 8);

      // Barra fina de progresso dos 30s
      const timeFrac = clamp(fn.stageTimeRemaining / fn.stageDuration, 0, 1);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(126, barBox.y + 13, R(56 * timeFrac), 2);

      // Exibição visível da pontuação da criança
      drawPixelText(ctx, `Pontos: ${fn.score}`, barBox.x + barBox.w - 86, barBox.y + 4, '#92e8ff', '#000000', 78, 8, 'right');

      // 5. Banner de COMBO (COMBO X2!, COMBO X3!, COMBO X4!)
      if (fn.activeComboBanner) {
        const cb = fn.activeComboBanner;
        const bw = 92, bh = 18;
        const bx = R(cb.x - bw / 2), by = R(cb.y - bh / 2);
        ctx.save();
        ctx.globalAlpha = clamp(cb.timer / 0.35, 0, 1);

        // Caixa temática de combo
        ctx.fillStyle = '#064e3b';
        ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
        ctx.fillStyle = '#065f46';
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(bx, by, bw, 1);
        ctx.fillRect(bx, by + bh - 1, bw, 1);

        // Texto do combo
        drawPixelTextCentered(ctx, cb.text, bx + bw / 2, by + 4, '#ffea31', '#000000', bw - 10, 10);
        drawStar(ctx, bx + 10, by + 9, 3, '#ffffff', '#fbbf24');
        drawStar(ctx, bx + bw - 10, by + 9, 3, '#ffffff', '#fbbf24');
        ctx.restore();
      }

      // 6. Banner flutuante de avisos de etapa / penalidade (-2s)
      if (fn.floatingBanner) {
        const fb = fn.floatingBanner;
        drawParchmentBox(ctx, 40, fb.y, 240, 18);
        drawPixelTextCentered(ctx, fb.text, 160, fb.y + 5, fb.color || '#ffea31', '#000000', 230, 9);
      }
    },

    drawForestNinjaVignette(ctx, tq) {
      const fn = this.forestNinja;
      if (!fn) return;
      ctx.fillStyle = 'rgba(10, 14, 8, 0.72)';
      ctx.fillRect(0, 20, W, H - 20);

      const cx = 24, cy = 18, cw = 272, ch = 152;
      drawParchmentBox(ctx, cx, cy, cw, ch, { headerH: 18, headerBg: '#213d28' });

      if (fn.vignetteCard === 1) {
        // CARD 1: VÍDEO EXPLICATIVO DA MECÂNICA
        drawPixelText(ctx, 'Corte Cristalino', cx + 10, cy + 6, '#ffea31', '#000000', 120, 9);
        drawPixelText(ctx, '1/2', cx + 10, cy + 6, '#ffffff', '#000000', cw - 20, 9, 'right');

        // Moldura do vídeo demonstrativo
        const prevBox = { x: cx + 12, y: cy + 22, w: cw - 24, h: 48 };
        ctx.fillStyle = '#112217';
        ctx.fillRect(prevBox.x, prevBox.y, prevBox.w, prevBox.h);
        ctx.fillStyle = '#3e7338';
        ctx.fillRect(prevBox.x, prevBox.y, prevBox.w, 1);
        ctx.fillRect(prevBox.x, prevBox.y + prevBox.h - 1, prevBox.w, 1);
        ctx.fillRect(prevBox.x, prevBox.y, 1, prevBox.h);
        ctx.fillRect(prevBox.x + prevBox.w - 1, prevBox.y, 1, prevBox.h);

        // Tag "▶ VÍDEO DEMO"
        ctx.fillStyle = '#166534';
        ctx.fillRect(prevBox.x + 4, prevBox.y + 4, 62, 9);
        drawPixelText(ctx, '▶ VÍDEO DEMO', prevBox.x + 6, prevBox.y + 5, '#ffffff', '#000000', 60, 7);

        // Animação contínua em loop demonstrando a mecânica de corte e combo
        const tLoop = (fn.vignettePracticeTime % 5.2) / 5.2;
        const midY = prevBox.y + prevBox.h / 2;

        if (tLoop < 0.45) {
          // Cristais subindo em parábola sob a gravidade
          const u = tLoop / 0.45;
          const arcY = R(midY + 12 - Math.sin(u * Math.PI) * 22);
          const sprE = GEM_SPRITES.emerald_core;
          const sprQ = GEM_SPRITES.white_pure;
          ctx.drawImage(sprE, prevBox.x + 85, arcY - 10, 17, 21);
          ctx.drawImage(sprQ, prevBox.x + 135, arcY - 8, 17, 21);
        } else if (tLoop < 0.58) {
          // Lâmina cortando ambos em um só golpe!
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(prevBox.x + 60, midY + 12);
          ctx.lineTo(prevBox.x + 175, midY - 14);
          ctx.stroke();
          drawStar(ctx, prevBox.x + 95, midY, 4, '#ffffff', '#6ef58c');
          drawStar(ctx, prevBox.x + 145, midY - 6, 4, '#ffffff', '#6ef58c');
        } else if (tLoop < 0.78) {
          // Metades se separando + COMBO X2!
          const sep = R((tLoop - 0.58) * 45);
          const sprE = GEM_SPRITES.emerald_core;
          const sprQ = GEM_SPRITES.white_pure;
          ctx.drawImage(sprE, 0, 0, 17, 42, prevBox.x + 80 - sep, midY - 5 + sep * 0.4, 8.5, 21);
          ctx.drawImage(sprE, 17, 0, 17, 42, prevBox.x + 92 + sep, midY - 5 + sep * 0.4, 8.5, 21);
          ctx.drawImage(sprQ, 0, 0, 17, 42, prevBox.x + 130 - sep, midY - 8 + sep * 0.4, 8.5, 21);
          ctx.drawImage(sprQ, 17, 0, 17, 42, prevBox.x + 142 + sep, midY - 8 + sep * 0.4, 8.5, 21);

          drawParchmentBox(ctx, prevBox.x + 80, prevBox.y + 6, 80, 14);
          drawPixelTextCentered(ctx, 'COMBO X2!', prevBox.x + 120, prevBox.y + 9, '#ffea31', '#000000', 70, 8);
        } else {
          // Cristal Sombrio sobe com aviso "NÃO CORTE A SOMBRA!"
          const u = (tLoop - 0.78) / 0.22;
          const arcY = R(midY + 12 - Math.sin(u * Math.PI) * 20);
          drawRing(ctx, prevBox.x + 120, arcY, 14, '#7c3aed');
          const sprS = GEM_SPRITES.shadow_bomb || GEM_SPRITES.white_shadow;
          ctx.drawImage(sprS, prevBox.x + 112, arcY - 10, 17, 21);
          drawPixelTextCentered(ctx, 'NÃO CORTE A SOMBRA! (-2s)', prevBox.x + 120, prevBox.y + 8, '#ff4d4d', '#000000', 148, 8);
        }

        // Pontos explicativos
        let ty = cy + 74;
        ty += drawPixelText(ctx, '• Arraste o dedo ou mouse para fatiar cristais no ar.', cx + 14, ty, '#ffea31', '#000000', cw - 28, 8) + 4;
        ty += drawPixelText(ctx, '• Corte 2, 3 ou 4 de vez: COMBO X2, X3, X4!', cx + 14, ty, '#ffea31', '#000000', cw - 28, 8) + 4;
        ty += drawPixelText(ctx, '• Cortar uma Sombra desconta apenas 2 segundos!', cx + 14, ty, '#ffea31', '#000000', cw - 28, 8) + 4;
        drawPixelText(ctx, '• Acumule pontos e supere as 4 etapas!', cx + 14, ty, '#ffea31', '#000000', cw - 28, 8);

        // Botão "Praticar Corte >"
        const b = { x: cx + cw - 96, y: cy + ch - 18, w: 86, h: 14 };
        ctx.fillStyle = '#142918';
        ctx.fillRect(b.x - 1, b.y - 1, b.w + 2, b.h + 2);
        ctx.fillStyle = '#166534';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = '#86efac';
        ctx.fillRect(b.x, b.y, b.w, 1);
        ctx.fillRect(b.x, b.y + b.h - 1, b.w, 1);
        drawPixelTextCentered(ctx, 'Praticar Corte >', b.x + b.w / 2, b.y + 3, '#ffffff', '#000000', b.w - 4, 8);
      } else {
        // CARD 2: OPORTUNIDADE DE TESTAR / TREINO LIVRE
        drawPixelText(ctx, 'Treino Livre', cx + 10, cy + 6, '#ffea31', '#000000', 120, 9);
        drawPixelText(ctx, '2/2', cx + 10, cy + 6, '#ffffff', '#000000', cw - 20, 9, 'right');

        drawPixelText(ctx, 'Arraste na área abaixo para testar cortes e combos:', cx + 14, cy + 21, '#ffea31', '#000000', cw - 28, 8);

        // Arena interativa de teste
        const arena = { x: cx + 12, y: cy + 32, w: cw - 24, h: 86 };
        ctx.fillStyle = '#0f2015';
        ctx.fillRect(arena.x, arena.y, arena.w, arena.h);
        ctx.fillStyle = '#22543d';
        ctx.fillRect(arena.x, arena.y, arena.w, 1);
        ctx.fillRect(arena.x, arena.y + arena.h - 1, arena.w, 1);
        ctx.fillRect(arena.x, arena.y, 1, arena.h);
        ctx.fillRect(arena.x + arena.w - 1, arena.y, 1, arena.h);

        // Cristais de treino no ar
        for (const c of fn.practiceCrystals) {
          ctx.save();
          ctx.translate(RH(c.x), RH(c.y));
          ctx.rotate(c.rot);
          if (c.shadow) {
            drawRing(ctx, 0, 0, 14, '#7c3aed');
            const spr = GEM_SPRITES.shadow_bomb || GEM_SPRITES.white_shadow;
            ctx.drawImage(spr, RH(-spr.width * 0.25), RH(-spr.height * 0.25), spr.width * 0.5, spr.height * 0.5);
            drawPixelTextCentered(ctx, 'SOMBRA', 0, 10, '#f87171', null, 40, 6);
          } else {
            const sprKey = (c.type === 'emerald' ? 'emerald_core' : `${c.type}_pure`);
            const spr = GEM_SPRITES[sprKey] || GEM_SPRITES.emerald_core;
            ctx.drawImage(spr, RH(-spr.width * 0.25), RH(-spr.height * 0.25), spr.width * 0.5, spr.height * 0.5);
          }
          ctx.restore();
        }

        // Metades de treino cortadas
        for (const h of fn.practiceHalves) {
          ctx.save();
          ctx.globalAlpha = clamp(h.alpha, 0, 1);
          ctx.translate(RH(h.x), RH(h.y));
          ctx.rotate(h.rot);
          const sprKey = (h.type === 'emerald' ? 'emerald_core' : `${h.type}_pure`);
          const spr = GEM_SPRITES[sprKey] || GEM_SPRITES.emerald_core;
          const gw = spr.width * 0.5, gh = spr.height * 0.5;
          const halfSprW = spr.width * 0.5;
          if (h.side === 'left') {
            ctx.drawImage(spr, 0, 0, halfSprW, spr.height, RH(-gw / 2), RH(-gh / 2), gw * 0.5, gh);
          } else {
            ctx.drawImage(spr, halfSprW, 0, halfSprW, spr.height, 0, RH(-gh / 2), gw * 0.5, gh);
          }
          ctx.restore();
        }

        // Rastro de treino
        if (fn.practiceTrail.length >= 2) {
          ctx.save();
          for (let i = 0; i < fn.practiceTrail.length - 1; i++) {
            const p1 = fn.practiceTrail[i];
            const p2 = fn.practiceTrail[i + 1];
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(RH(p1.x), RH(p1.y));
            ctx.lineTo(RH(p2.x), RH(p2.y));
            ctx.stroke();
            P1(ctx, RH(p2.x), RH(p2.y), '#4ade80');
          }
          ctx.restore();
        }

        // Aviso / Combo no treino
        if (fn.activeComboBanner) {
          drawParchmentBox(ctx, 110, arena.y + 6, 100, 15);
          drawPixelTextCentered(ctx, fn.activeComboBanner.text, 160, arena.y + 9, '#15803d', null, 90, 8);
        } else if (fn.practiceBanner) {
          drawPixelTextCentered(ctx, fn.practiceBanner.text, 160, arena.y + 8, fn.practiceBanner.color, null, 180, 8);
        }

        // Botões do Card 2:
        // 1. "< Vídeo"
        const bBack = { x: cx + 10, y: cy + ch - 18, w: 72, h: 14 };
        ctx.fillStyle = '#142918';
        ctx.fillRect(bBack.x - 1, bBack.y - 1, bBack.w + 2, bBack.h + 2);
        ctx.fillStyle = '#374151';
        ctx.fillRect(bBack.x, bBack.y, bBack.w, bBack.h);
        ctx.fillStyle = '#9ca3af';
        ctx.fillRect(bBack.x, bBack.y, bBack.w, 1);
        ctx.fillRect(bBack.x, bBack.y + bBack.h - 1, bBack.w, 1);
        drawPixelTextCentered(ctx, '< Vídeo', bBack.x + bBack.w / 2, bBack.y + 3, '#ffffff', '#1f2937', bBack.w - 4, 8);

        // 2. "↺ Recomeçar"
        const bReset = { x: cx + 86, y: cy + ch - 18, w: 76, h: 14 };
        ctx.fillStyle = '#142918';
        ctx.fillRect(bReset.x - 1, bReset.y - 1, bReset.w + 2, bReset.h + 2);
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(bReset.x, bReset.y, bReset.w, bReset.h);
        ctx.fillStyle = '#93c5fd';
        ctx.fillRect(bReset.x, bReset.y, bReset.w, 1);
        ctx.fillRect(bReset.x, bReset.y + bReset.h - 1, bReset.w, 1);
        drawPixelTextCentered(ctx, '↺ Recomeçar', bReset.x + bReset.w / 2, bReset.y + 3, '#ffffff', '#1e3a8a', bReset.w - 4, 8);

        // 3. "Iniciar Desafio! >"
        const bStart = { x: cx + cw - 96, y: cy + ch - 18, w: 86, h: 14 };
        ctx.fillStyle = '#142918';
        ctx.fillRect(bStart.x - 1, bStart.y - 1, bStart.w + 2, bStart.h + 2);
        ctx.fillStyle = '#15803d';
        ctx.fillRect(bStart.x, bStart.y, bStart.w, bStart.h);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(bStart.x, bStart.y, bStart.w, 1);
        ctx.fillRect(bStart.x, bStart.y + bStart.h - 1, bStart.w, 1);
        drawPixelTextCentered(ctx, 'Iniciar Desafio! >', bStart.x + bStart.w / 2, bStart.y + 3, '#ffffff', '#142918', bStart.w - 4, 8);
      }
    },

    onStepCleared(originX, originY) {
      this.targetObstacleDecay = this.currentStep / this.totalSteps;
      this.spawnShatter(this.isWorldFinale() ? 176 : 258, this.isWorldFinale() ? 34 : 108, 'rock', 14);

      if (this.currentStep < this.totalSteps) {
        this.phase = 'next_step_pause';
        this.phaseTime = 0;
      } else if (this.isWorldFinale()) {
        this.phase = 'finale_crystal_shatter';
        this.phaseTime = 0;
        this.giantCrystalFlash = true;
      } else {
        this.waveOrigin = { x: originX, y: originY };
        this.waveActive = true;
        this.waveRadius = 1;
        this.phase = 'step_resolving';
        this.phaseTime = 0;
      }
    },

    // ==========================================================================
    // SHOW MUSICAL EM 2 PARTES + PÓS-DIÁLOGO + TRANSIÇÃO AO MAPA
    // ==========================================================================
    getRegularBgmSrc() {
      if (this.worldKey === 'forest') return 'assets/audio/musica-floresta-fases.mp3';
      if (this.worldKey === 'river') return 'assets/audio/musica-rio-fases.mp3';
      if (this.worldKey === 'caatinga') return 'assets/audio/musica-caatinga-fases.mp3';
      return null;
    },

    getSpecialBgmSrc() {
      if (this.worldKey === 'forest') return 'assets/audio/musica-floresta-especial.mp3';
      if (this.worldKey === 'river') return 'assets/audio/musica-rio-especial.mp3';
      if (this.worldKey === 'caatinga') return 'assets/audio/musica-caatinga-especial.mp3';
      return 'assets/audio/o-que-um-cristal-pode-fazer.mp3';
    },

    playSpecialBgm() {
      const specSrc = this.getSpecialBgmSrc();
      if (!specSrc) return;
      try {
        this.stopRegularBgm();
        global.CrystalAudio?.stopAllMusic?.(this.musicAudio);
        global.CrystalMenuAudio?.pause?.();
        global.CaveChapter1?.stopMusicAudio?.();
        if (!this.musicAudio || this.musicAudio._src !== specSrc) {
          if (this.musicAudio) {
            try { this.musicAudio.pause(); } catch (_) {}
          }
          this.musicAudio = new Audio(specSrc);
          this.musicAudio._src = specSrc;
          this.musicAudio.loop = true;
          this.musicAudio.preload = 'auto';
        }
        GameHUD.syncAudio();
        const effMus = GameHUD.muted ? 0 : clamp(GameHUD.musicVol / 100, 0, 1);
        this.musicAudio.muted = GameHUD.muted || effMus <= 0;
        this.musicAudio.volume = effMus;
        if (!GameHUD.muted && GameHUD.musicVol > 0 && this.musicAudio.paused) {
          this.musicAudio.play().catch(() => {});
        }
      } catch (_) {}
    },

    playRegularBgm() {
      const src = this.getRegularBgmSrc();
      if (!src) return;
      try {
        if (this.musicAudio) {
          try { this.musicAudio.pause(); } catch (_) {}
        }
        global.CrystalAudio?.stopAllMusic?.(this.regularAudio);
        global.CrystalMenuAudio?.pause?.();
        global.CaveChapter1?.stopMusicAudio?.();
        if (!this.regularAudio || this.regularAudio._src !== src) {
          if (this.regularAudio) {
            try { this.regularAudio.pause(); } catch (_) {}
          }
          this.regularAudio = new Audio(src);
          this.regularAudio._src = src;
          this.regularAudio.loop = true;
          this.regularAudio.preload = 'auto';
        }
        const effMus = GameHUD.muted ? 0 : clamp(GameHUD.musicVol / 100, 0, 1);
        this.regularAudio.muted = GameHUD.muted || effMus <= 0;
        this.regularAudio.volume = effMus;
        if (!GameHUD.muted && GameHUD.musicVol > 0 && this.regularAudio.paused) {
          this.regularAudio.play().catch(() => {});
        }
      } catch (_) {}
    },

    stopRegularBgm() {
      if (this.regularAudio) {
        try { this.regularAudio.pause(); } catch (_) {}
      }
    },

    startMusicalShow() {
      this.stopRegularBgm();
      const spec = this.getSpec();
      this.phase = this.worldKey === 'sanctuary' ? 'musical_part2_bright' : 'musical_part1_shadows';
      this.phaseTime = 0;
      this.musicalTime = this.worldKey === 'sanctuary' ? 24.0 : 0;
      this.cloudPopTime = -1;

      this.protag.x = 38;
      this.protag.y = 142;
      this.protag.state = 'idle';
      this.ordemCompanion.visible = true;
      this.ordemCompanion.x = 60;
      this.ordemCompanion.y = 142;
      this.ordemCompanion.state = 'idle';

      this.guardianActor.visible = this.worldKey !== 'sanctuary';
      this.guardianActor.x = 168;
      this.guardianActor.y = 40;
      this.guardianActor.state = 'back_silhouette';
      this.guardianActor.flipX = false;

      if (this.worldKey === 'sanctuary') {
        this.waveOrigin = { x: 248, y: 84 };
        this.waveActive = true;
        this.waveRadius = 400;
      }

      this.playSpecialBgm();
      if (this.musicAudio) this.musicAudio.currentTime = 0;
    },

    stopMusicAudio() {
      if (this.musicAudio) {
        try { this.musicAudio.pause(); } catch (_) {}
      }
      this.stopRegularBgm();
    },

    finishMusicalShow() {
      this.stopMusicAudio();
      const spec = this.getSpec();
      if (spec.socketKey) {
        DialogueBox.sockets[spec.socketKey] = true;
      }
      const syncInfo = spec.nodeSyncByLevel[this.currentLevel];
      if (syncInfo) {
        global.CrystalApp?.syncProgress?.(syncInfo.ids, syncInfo.next);
      }

      this.waveOrigin = { x: 160, y: 90 };
      this.waveActive = true;
      this.waveRadius = 400;
      this.obstacleDecay = 1;
      this.gateOpenRatio = 1;

      this.phase = 'post_musical_dlg';
      this.phaseTime = 0;
      this.protag.x = 68;
      this.protag.state = 'idle';
      this.ordemCompanion.x = 96;
      this.ordemCompanion.state = 'idle';
      if (this.worldKey !== 'sanctuary') {
        this.guardianActor.visible = true;
        this.guardianActor.x = 152;
        this.guardianActor.y = 142;
        this.guardianActor.state = 'idle';
        this.guardianActor.flipX = true;
      }

      const lines = (spec.postDialogues && spec.postDialogues[this.currentLevel]) || [];
      DialogueBox.open(lines, () => {
        this.phase = 'world_celebrate_complete';
        this.phaseTime = 0;
        this.protag.state = 'celebrate';
        this.ordemCompanion.state = 'celebrate';
        if (this.guardianActor.visible) this.guardianActor.state = 'celebrate';
      });
    },

    openPostLevelDialogue() {
      const spec = this.getSpec();
      const syncInfo = spec.nodeSyncByLevel[this.currentLevel];
      if (syncInfo) {
        global.CrystalApp?.syncProgress?.(syncInfo.ids, syncInfo.next);
      }
      this.phase = 'post_dialogue';
      this.phaseTime = 0;
      this.protag.state = 'celebrate';
      this.ordemCompanion.state = 'celebrate';

      const lines = (spec.postDialogues && spec.postDialogues[this.currentLevel]) || [];
      DialogueBox.open(lines, () => {
        this.phase = 'celebrate_complete';
        this.phaseTime = 0;
      });
    },

    startWorldExitTransition() {
      IrisTransition.active = false;
      IrisTransition.onDone = null;
      this._exitIrisStarted = false;
      this.phase = 'walk_to_world_exit';
      this.phaseTime = 0;
      this.protag.state = 'walk';
      this.ordemCompanion.state = 'walk';
      if (this.guardianActor.visible) {
        this.guardianActor.state = 'walk';
        this.guardianActor.flipX = false;
      }
    },

    enterJourneyMapWithIrisIn(worldCompleted = true) {
      const wasInLoop = Boolean(this._inLoop);
      DialogueBox.close();
      TutorialModal.close();
      this.stopMusicAudio();
      this.stopRegularBgm();
      global.CrystalAudio?.stopAllMusic?.();
      global.CrystalMenuAudio?.pause?.();
      GameHUD.paused = false;
      GameHUD.settingsOpen = false;
      this.draggedPiece = null;
      this.equationPointer = null;
      this.clearTrembleStates();

      const spec = this.getSpec();
      if (worldCompleted) {
        const syncInfo = spec.nodeSyncByLevel[this.currentLevel];
        if (syncInfo) {
          global.CrystalApp?.syncProgress?.(syncInfo.ids, syncInfo.next);
        }
      }

      if (global.CrystalApp && typeof global.CrystalApp.goto === 'function') {
        global.CrystalApp.goto('map');
      } else if (typeof document !== 'undefined') {
        document.body.dataset.screen = 'map';
        const homeSec = document.getElementById('home');
        const gameSec = document.getElementById('game');
        const mapSec = document.getElementById('map');
        if (homeSec) homeSec.hidden = true;
        if (gameSec) gameSec.hidden = true;
        if (mapSec) mapSec.hidden = false;
      }

      ActorAnimator.adaptMapFairyIcon();

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

    // ==========================================================================
    // INPUT UNIFICADO (TOQUE/ARRASTO + ATALHO `R`)
    // ==========================================================================
    bindInput() {
      if (this._bound) return;
      this._bound = true;

      const onDown = (e) => {
        if (!this.running || this.phase === 'map_iris_in' || this.phase === 'map_active') return;
        const pt = e.touches ? e.touches[0] : e;
        const { x, y } = this.toLogicalCoords(pt.clientX, pt.clientY);

        if (GameHUD.handleClick(x, y)) return;

        if (DialogueBox.isOpen) {
          GameHUD.playSfx('click');
          DialogueBox.advance();
          return;
        }

        if (TutorialModal.isOpen) {
          TutorialModal.handleClick(x, y);
          return;
        }

        if (this.phase === 'game_over') {
          const gb = this.gameOverBtnRect;
          if (x >= gb.x && x <= gb.x + gb.w && y >= gb.y && y <= gb.y + gb.h) {
            GameHUD.triggerRestart();
          }
          return;
        }

        if (this.phase && this.phase.startsWith('shell_game_') && this.shellGame) {
          const cb = this.shellCalmBtnRect;
          if (cb && x >= cb.x && x <= cb.x + cb.w && y >= cb.y && y <= cb.y + cb.h) {
            GameHUD.playSfx('click');
            this.shellGame.calmMode = !this.shellGame.calmMode;
            return;
          }
          if (this.phase === 'shell_game_pick') {
            for (let i = 0; i < this.shellGame.cups.length; i++) {
              const cup = this.shellGame.cups[i];
              if (Math.hypot(x - cup.x, y - cup.y) <= 18) {
                this.pickShellCup(i);
                return;
              }
            }
          }
          return;
        }

        if (this.phase === 'river_melody_game' && this.riverMelody) {
          const cb = this.shellCalmBtnRect;
          if (cb && x >= cb.x && x <= cb.x + cb.w && y >= cb.y && y <= cb.y + cb.h) {
            GameHUD.playSfx('click');
            this.riverMelody.calmMode = !this.riverMelody.calmMode;
            return;
          }
          if (this.riverMelody.phase === 'player_input') {
            for (let i = 0; i < this.riverMelody.crystals.length; i++) {
              const c = this.riverMelody.crystals[i];
              if (this.isInsideRiverMelodyCrystal(c, x, y)) {
                this.clickRiverMelodyCrystal(i);
                return;
              }
            }
          }
          return;
        }

        if (this.phase === 'forest_ninja_vignette') {
          this.handleForestNinjaVignetteClick(x, y);
          return;
        }

        if (this.phase === 'forest_ninja_game') {
          this.handleForestNinjaPointerDown(x, y);
          return;
        }

        if (this.phase === 'musical_part1_shadows' || this.phase === 'musical_part2_bright') {
          const sb = this.skipMusicalBtnRect;
          if (x >= sb.x && x <= sb.x + sb.w && y >= sb.y && y <= sb.y + sb.h) {
            GameHUD.playSfx('click');
            this.finishMusicalShow();
            return;
          }
        }

        if (this.phase === 'celebrate_complete' || this.phase === 'world_celebrate_complete') {
          const b = this.completeBtnRect;
          if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
            GameHUD.playSfx('click');
            if (this.phase === 'world_celebrate_complete') {
              this.startWorldExitTransition();
            } else {
              this.startWorldLevel(this.worldKey, this.currentLevel + 1);
            }
          }
          return;
        }

        if (this.phase !== 'gameplay') return;

        if (this.fractionPlatform?.glowing && !this.fractionPlatform.broken && this.isInsideFractionPlatform(x, y)) {
          this.triggerFractionDivide();
          return;
        }

        const eq = this.pureEquation;
        const clickedInEq = this.isInsideEquationAura(eq, x, y);

        if (eq && !eq.broken && !eq.expanded && clickedInEq) {
          this.equationPointer = { startX: x, startY: y, origX: eq.x, origY: eq.y, moved: false };
          return;
        }

        for (let i = this.pieces.length - 1; i >= 0; i--) {
          const p = this.pieces[i];
          if (!p.shadow && !p.broken && p.value > 0 && Math.hypot(x - p.x, y - p.y) <= 16) {
            if (p.inFraction) continue;
            if (p.inEquation && eq && !eq.expanded) continue;
            GameHUD.playSfx(p.type === 'opal' ? 'opalGrab' : (p.type === 'rose' ? 'roseGrab' : 'quartzGrab'));
            this.draggedPiece = p;
            this.dragStartPos = { x, y };
            this.dragMovedDist = 0;
            p.dragging = true;
            const immediateHit = this.findTouchingCompatibleShadow(p, p.x, p.y);
            if (immediateHit) {
              this.triggerImmediateAnnulment(p, immediateHit);
            }
            return;
          }
        }

        if (eq && !eq.broken && eq.expanded && clickedInEq) {
          this.equationPointer = { startX: x, startY: y, origX: eq.x, origY: eq.y, moved: false };
        }
      };

      const onMove = (e) => {
        if (!this.running || this.phase === 'map_iris_in' || this.phase === 'map_active') return;
        if (GameHUD.paused || GameHUD.settingsOpen) return;
        const pt = e.touches ? e.touches[0] : e;
        if (!pt) return;
        const { x, y } = this.toLogicalCoords(pt.clientX, pt.clientY);

        if (this.phase === 'forest_ninja_vignette' && this.forestNinja?.vignetteCard === 2) {
          this.handleForestNinjaPointerMove(x, y);
          return;
        }
        if (this.phase === 'forest_ninja_game') {
          this.handleForestNinjaPointerMove(x, y);
          return;
        }

        if (this.draggedPiece) {
          if (this.phase !== 'gameplay' || this.draggedPiece.broken || this.draggedPiece.value <= 0) {
            this.draggedPiece.dragging = false;
            this.draggedPiece = null;
            this.dragStartPos = null;
            return;
          }
          if (this.dragStartPos) {
            this.dragMovedDist = Math.max(this.dragMovedDist, Math.hypot(x - this.dragStartPos.x, y - this.dragStartPos.y));
          }
          const res = this.moveDraggedPieceWithCollision(this.draggedPiece, x, y);
          if (res && res.annulled) return;

          if (this.draggedPiece && this.fractionPlatform && !this.fractionPlatform.broken) {
            const fp = this.fractionPlatform;
            fp.topHover = Math.abs(this.draggedPiece.x - fp.x) <= fp.w * 0.5 && Math.abs(this.draggedPiece.y - fp.topY) <= 16;
            fp.bottomHover = Math.abs(this.draggedPiece.x - fp.x) <= fp.w * 0.5 && Math.abs(this.draggedPiece.y - fp.bottomY) <= 16;
          }
          if (this.draggedPiece && this.pureEquation && !this.pureEquation.broken) {
            const overEq = this.isInsideEquationAura(this.pureEquation, this.draggedPiece.x, this.draggedPiece.y, true);
            this.pureEquation.dropHover = overEq && this.draggedPiece.inEquation !== 'pure';
            this.pureEquation.removeHover = !overEq && this.draggedPiece.inEquation === 'pure';
          }
          if (this.draggedPiece && this.electricShapes) {
            for (const es of this.electricShapes) {
              es.hover = !es.used && Math.hypot(this.draggedPiece.x - es.x, this.draggedPiece.y - es.y) <= 22;
            }
          }
          return;
        }

        if (this.equationPointer && this.pureEquation && !this.pureEquation.broken) {
          const dist = Math.hypot(x - this.equationPointer.startX, y - this.equationPointer.startY);
          if (dist >= 4) this.equationPointer.moved = true;
          if (this.equationPointer.moved) {
            const rawEqX = this.equationPointer.origX + (x - this.equationPointer.startX);
            const rawEqY = this.equationPointer.origY + (y - this.equationPointer.startY);
            this.moveEquationWithCollision(rawEqX, rawEqY);
            if (this.electricShapes) {
              for (const es of this.electricShapes) {
                es.hover = !es.used && Math.hypot(this.pureEquation.x - es.x, this.pureEquation.y - es.y) <= 24;
              }
            }
          }
        }
      };

      const onUp = () => {
        if (!this.running || this.phase === 'map_iris_in' || this.phase === 'map_active') return;

        if (this.phase === 'forest_ninja_vignette' && this.forestNinja?.vignetteCard === 2) {
          this.handleForestNinjaPointerUp();
          return;
        }
        if (this.phase === 'forest_ninja_game') {
          this.handleForestNinjaPointerUp();
          return;
        }

        if (this.fractionPlatform) {
          this.fractionPlatform.topHover = false;
          this.fractionPlatform.bottomHover = false;
        }
        if (this.electricShapes) {
          for (const es of this.electricShapes) es.hover = false;
        }

        if (this.equationPointer && this.pureEquation && !this.pureEquation.broken) {
          const wasTap = !this.equationPointer.moved;
          this.equationPointer = null;
          if (wasTap) {
            this.pureEquation.expanded = !this.pureEquation.expanded;
            GameHUD.playSfx(this.pureEquation.expanded ? 'equationExpand' : 'equationCollapse');
            this.layoutEquationPieces(this.pureEquation, 'pure');
          } else {
            let enteredShape = false;
            if (this.electricShapes) {
              for (const es of this.electricShapes) {
                if (!es.used && Math.hypot(this.pureEquation.x - es.x, this.pureEquation.y - es.y) <= 24) {
                  const members = this.pieces.filter((p) => !p.broken && !p.shadow && p.value > 0 && p.inEquation === 'pure');
                  this.tryEnterElectricShapeNode(es, members);
                  enteredShape = true;
                  break;
                }
              }
            }
            if (!enteredShape) {
              GameHUD.playSfx('quartzDrop');
            }
          }
          if (this.phase === 'gameplay') {
            this.checkEquationSolved();
            this.triggerDefeatIfImpossible();
          }
          return;
        }

        if (this.draggedPiece) {
          const p = this.draggedPiece;
          const wasQuickTap = this.dragMovedDist < 5;
          p.dragging = false;
          this.draggedPiece = null;
          this.dragStartPos = null;
          if (this.pureEquation) {
            this.pureEquation.dropHover = false;
            this.pureEquation.removeHover = false;
          }
          this.clearTrembleStates();
          if (p.broken || p.value <= 0 || this.phase !== 'gameplay') return;

          if (wasQuickTap) {
            if (this.tryDisassembleShapeOnTap(p)) {
              if (this.selectedPiece === p) this.selectedPiece = null;
              return;
            }
            if (this.trySplitCrystalOnTap(p)) {
              if (this.selectedPiece === p) this.selectedPiece = null;
              return;
            }
            if (this.selectedPiece === p) {
              this.selectedPiece = null;
              GameHUD.playSfx('click');
              return;
            }
            if (this.selectedPiece && !this.selectedPiece.broken && !this.selectedPiece.shadow && this.selectedPiece.value > 0) {
              const prev = this.selectedPiece;
              this.selectedPiece = null;
              if (prev.shape && p.shape && this.tryTessellateShapes(prev, p)) {
                if (this.phase === 'gameplay') {
                  this.checkEquationSolved();
                  this.triggerDefeatIfImpossible();
                }
                return;
              }
              if (this.pureEquation || this.shadowEquation || (this.electricShapes && this.electricShapes.length > 0)) {
                const eq = this.ensurePureEquation((prev.x + p.x) * 0.5, (prev.y + p.y) * 0.5);
                prev.inEquation = 'pure';
                p.inEquation = 'pure';
                GameHUD.playSfx('equationInsert');
                this.layoutEquationPieces(eq, 'pure');
                if (this.phase === 'gameplay') {
                  this.checkEquationSolved();
                  this.triggerDefeatIfImpossible();
                }
                return;
              }
            } else {
              this.selectedPiece = p;
              GameHUD.playSfx('click');
              return;
            }
          }

          this.selectedPiece = null;
          GameHUD.playSfx(p.type === 'opal' ? 'opalDrop' : (p.type === 'rose' ? 'roseDrop' : 'quartzDrop'));
          this.checkPieceDrop(p);
          if (this.phase === 'gameplay') {
            this.checkEquationSolved();
            this.triggerDefeatIfImpossible();
          }
        }
      };

      const onKeyDown = (e) => {
        if (e.key === 'r' || e.key === 'R') {
          if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
          if (this.isActiveGame()) {
            e.preventDefault();
            this.restartCurrentPhase();
          }
          return;
        }

        if ((this.phase === 'forest_ninja_game' || (this.phase === 'forest_ninja_vignette' && this.forestNinja?.vignetteCard === 2)) && (e.code === 'Space' || e.code === 'KeyC' || e.code === 'Enter')) {
          e.preventDefault();
          this.handleForestNinjaKeyboardSlash();
          return;
        }

        if (e.code === 'Space' || e.key === ' ' || e.code === 'Enter' || e.key === 'Enter') {
          if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
          if (this.phase === 'celebrate_complete' || this.phase === 'world_celebrate_complete') {
            e.preventDefault();
            GameHUD.playSfx('click');
            if (this.phase === 'world_celebrate_complete') {
              this.startWorldExitTransition();
            } else {
              this.startWorldLevel(this.worldKey, this.currentLevel + 1);
            }
            return;
          }
        }
      };

      if (this.canvas && typeof this.canvas.addEventListener === 'function') {
        this.canvas.addEventListener('pointerdown', (e) => {
          if (e.cancelable) e.preventDefault();
          if (this.canvas.setPointerCapture && e.pointerId != null) {
            try { this.canvas.setPointerCapture(e.pointerId); } catch (_) {}
          }
          onDown(e);
        });
        this.canvas.addEventListener('touchstart', (e) => {
          if (e.cancelable) e.preventDefault();
        }, { passive: false });
      }
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', (e) => {
          if (this.canvas?.releasePointerCapture && e.pointerId != null) {
            try { this.canvas.releasePointerCapture(e.pointerId); } catch (_) {}
          }
          onUp(e);
        });
        window.addEventListener('pointercancel', (e) => {
          if (this.canvas?.releasePointerCapture && e.pointerId != null) {
            try { this.canvas.releasePointerCapture(e.pointerId); } catch (_) {}
          }
          onUp(e);
        });
        window.addEventListener('touchmove', (e) => {
          if ((this.phase === 'forest_ninja_game' || (this.phase === 'forest_ninja_vignette' && this.forestNinja?.vignetteCard === 2)) && e.cancelable) {
            e.preventDefault();
          }
        }, { passive: false });
        window.addEventListener('keydown', onKeyDown);
      }
    },

    // ==========================================================================
    // UPDATE & RENDER LOOP
    // ==========================================================================
    update(dt) {
      if (GameHUD.paused || GameHUD.settingsOpen) {
        if (this.musicAudio && !this.musicAudio.paused) {
          try { this.musicAudio.pause(); } catch (_) {}
        }
        if (this.regularAudio && !this.regularAudio.paused) {
          try { this.regularAudio.pause(); } catch (_) {}
        }
        return;
      }

      if (
        (this.phase === 'musical_part1_shadows' || this.phase === 'musical_part2_bright') &&
        this.musicAudio &&
        this.musicAudio.paused &&
        this.musicalTime < 55.5
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
      this.updateShapeTessellationPreview(dt);

      if (this.phase === 'cutscene_enter') {
        const p = clamp(this.phaseTime / 1.1, 0, 1);
        if (this.worldKey === 'caatinga' && this.currentLevel === 1) {
          this.camPanY = R((1 - easeInOut(p)) * -14);
        } else {
          this.camPanY = 0;
        }
        this.protag.x = R(-12 + p * 42);
        this.ordemCompanion.x = R(-28 + p * 76);
        this.protag.state = p < 1 ? 'walk' : 'idle';
        this.ordemCompanion.state = p < 1 ? 'walk' : 'idle';
        if (this.phaseTime >= 1.2) {
          this.camPanY = 0;
          this.protag.x = 30;
          this.ordemCompanion.x = 48;
          this.protag.state = 'idle';
          this.ordemCompanion.state = 'idle';
          this.openIntroIfAny();
        }
      } else if (this.phase === 'intro_dialogue') {
        const curLine = DialogueBox.isOpen && DialogueBox.queue ? DialogueBox.queue[DialogueBox.idx] : null;
        if (curLine && curLine.protagState) {
          this.protag.state = curLine.protagState === 'shock' ? 'shock' : 'idle';
        } else if (this.worldKey === 'caatinga' && this.currentLevel === 1) {
          this.protag.state = 'idle';
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
            if (pc.inEquation === 'pure' || pc.inEquation === 'shadow') pc.broken = true;
          }
          GameHUD.playSfx('equationShatter');
          GameHUD.playSfx('reward');
          this.spawnShatter(m.midX, m.midY, 'pure', 14);
          this.spawnShatter(m.midX, m.midY, 'shadow', 14);

          if (this.pieces.some((k) => k.shadow && !k.broken)) {
            this.phase = 'gameplay';
            this.phaseTime = 0;
          } else {
            this.onStepCleared(m.midX, m.midY);
          }
        }
      } else if (this.phase === 'finale_crystal_shatter') {
        if (this.phaseTime >= 0.22 && !this.giantCrystalBroken) {
          this.giantCrystalFlash = false;
          this.giantCrystalBroken = true;
          GameHUD.playSfx('ceilingShatter');
          this.spawnShatter(176, 36, 'emerald', 20);
          this.spawnShatter(176, 36, 'pure', 16);
        }
        if (this.phaseTime >= 1.05) {
          if (this.worldKey === 'caatinga' && this.currentLevel === 5) {
            this.startShellGame();
          } else if (this.worldKey === 'river' && this.currentLevel === 5) {
            this.startRiverMelodyGame();
          } else if (this.worldKey === 'forest' && this.currentLevel === 5) {
            this.startForestNinjaGame();
          } else {
            this.startMusicalShow();
          }
        }
      } else if (this.phase && this.phase.startsWith('shell_game_')) {
        this.updateShellGame(dt);
      } else if (this.phase === 'river_melody_game') {
        this.updateRiverMelodyGame(dt);
      } else if (this.phase === 'forest_ninja_vignette' || this.phase === 'forest_ninja_game' || (this.phase && this.phase.startsWith('forest_ninja_'))) {
        this.updateForestNinjaGame(dt);
      } else if (this.phase === 'musical_part1_shadows' || this.phase === 'musical_part2_bright') {
        if (this.musicAudio && !this.musicAudio.paused && this.musicAudio.currentTime > 0 && this.worldKey !== 'sanctuary') {
          this.musicalTime = this.musicAudio.currentTime;
        } else {
          this.musicalTime += dt;
        }
        const mt = this.musicalTime;

        if (this.worldKey === 'sanctuary') {
          this.phase = 'musical_part2_bright';
          const st = mt - 24.0;
          this.gateOpenRatio = clamp(st / 8.0, 0, 1);
          this.ordemCompanion.x = R(132 + Math.sin(st * 1.6) * 20);
          this.ordemCompanion.y = R(136 - Math.abs(Math.sin(st * 2.4)) * 8);
          this.ordemCompanion.state = 'sing';
          this.ordemCompanion.flipX = Math.cos(st * 1.6) < 0;
          this.protag.x = R(62 + Math.sin(st * 1.8) * 8);
          this.protag.state = (Math.floor(st * 2) & 1) ? 'celebrate' : 'idle';
          if (mt >= 56.0) this.finishMusicalShow();
        } else if (mt < 24.0) {
          // PARTE 1: Ambiente escuro cinemático + Guardiã em silhueta + Show de Sombras na parede
          this.phase = 'musical_part1_shadows';
          this.guardianActor.visible = true;
          this.guardianActor.state = 'back_silhouette';
          if (mt < 5.0) {
            const p = easeInOut(clamp(mt / 5.0, 0, 1));
            this.guardianActor.x = R(176 - p * 16 + Math.sin(mt * 2.0) * 10);
            this.guardianActor.y = R(36 + p * 104);
          } else {
            const sw = (mt - 5.0) * 1.2;
            this.guardianActor.x = R(160 + Math.sin(sw) * 38);
            this.guardianActor.y = R(140 - Math.abs(Math.cos(sw * 1.8)) * 6);
            this.guardianActor.flipX = Math.cos(sw) < 0;
          }
        } else if (mt < 56.0) {
          // PARTE 2: Tudo claro + Guardiã vai até o Protagonista + Nuvem + Animais Neon + Tambor + Panorama!
          this.phase = 'musical_part2_bright';
          this.guardianActor.visible = true;
          if (mt < 38.0) {
            const p = easeInOut(clamp((mt - 24.0) / 3.5, 0, 1));
            const sway = Math.sin((mt - 24.0) * 1.4) * 12;
            this.guardianActor.x = R(160 - p * 44 + sway);
            this.guardianActor.y = R(140 - Math.abs(Math.cos(mt * 2.0)) * 4);
            this.guardianActor.state = 'sing';
            this.guardianActor.flipX = true;
          } else {
            if (this.cloudPopTime < 0) this.cloudPopTime = mt;
            const dT = mt - 38.0;
            this.guardianActor.x = R(142 + Math.sin(dT * 1.8) * 34);
            this.guardianActor.y = R(136 - Math.abs(Math.sin(dT * 3.2)) * 8);
            this.guardianActor.state = 'sing';
            this.guardianActor.flipX = Math.cos(dT * 1.8) < 0;
            this.protag.state = (Math.floor(mt * 2) & 1) ? 'celebrate' : 'walk';
            this.ordemCompanion.state = 'sing';
          }
        } else {
          this.finishMusicalShow();
        }
      } else if (this.phase === 'walk_to_world_exit') {
        const p = clamp(this.phaseTime / 1.4, 0, 1);
        this.protag.x = R(68 + p * 176);
        this.ordemCompanion.x = R(96 + p * 156);
        if (this.guardianActor.visible) {
          this.guardianActor.x = R(152 + p * 118);
        }
        if (this.phaseTime >= 0.45 && !IrisTransition.active && !this._exitIrisStarted) {
          this._exitIrisStarted = true;
          IrisTransition.start('out', 250, 118, 0.85, () => {
            this.enterJourneyMapWithIrisIn(true);
          });
        }
      } else if (this.phase === 'next_step_pause') {
        if (this.phaseTime >= 0.65) {
          this.phase = 'gameplay';
          this.phaseTime = 0;
          this.setupStep(this.currentStep + 1);
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

    composeBackground(bgSet) {
      const { dark, cinematic, lit, u32 } = bgSet;
      if (this.phase === 'musical_part1_shadows') {
        u32.set(cinematic);
        return;
      }
      if (
        this.phase === 'musical_part2_bright' ||
        this.phase === 'post_musical_dlg' ||
        this.phase === 'world_celebrate_complete' ||
        this.phase === 'walk_to_world_exit' ||
        this.phase === 'shell_game_victory'
      ) {
        u32.set(lit);
        return;
      }
      if (!this.waveActive || this.waveRadius <= 0) {
        u32.set(dark);
        return;
      }
      if (this.waveRadius >= 360) {
        u32.set(lit);
        return;
      }
      const ox = this.waveOrigin.x * 2, oy = this.waveOrigin.y * 2;
      const rad = Math.floor(this.waveRadius * 48) / 24;
      const rim1 = c32('#c8fbff'), rim2 = c32('#ffffff');
      for (let y = 0, i = 0; y < HH; y++) {
        for (let x = 0; x < HW; x++, i++) {
          const d = Math.hypot(x - ox, y - oy) + bay(x, y) * 1.2;
          if (d < rad - 6) u32[i] = lit[i];
          else if (d < rad) u32[i] = ((x + y) & 1) ? rim1 : lit[i];
          else if (d < rad + 4 && bay(x, y) < 4) u32[i] = rim2;
          else u32[i] = dark[i];
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
      const spec = this.getSpec();
      const bx = 42, by = 28, bw = 236, bh = 108;
      drawParchmentBox(ctx, bx, by, bw, bh, { headerH: 17, headerBg: '#3d2b24' });

      if (isWorldFinale) {
        const f12 = Math.floor(this.t * SPRITE_FPS);
        for (let k = 0; k < 8; k++) {
          const fx = 24 + ((k * 37) % 272);
          const fy = 24 + ((f12 * 3 + k * 19) % 110);
          drawStar(ctx, fx, fy, (k & 1) ? 3 : 2, '#ffffff', (k % 3 === 0) ? '#f2cc6b' : (k % 3 === 1 ? '#7ec456' : '#68b8c4'));
        }
        drawPixelTextCentered(ctx, spec.worldClearedTitle, bx + bw / 2, by + 8, '#ffea31', '#000000', bw - 16, 9);
        drawPixelTextCentered(ctx, spec.worldClearedLine1, bx + bw / 2, by + 28, '#ffffff', '#000000', bw - 20, 10);
        drawPixelTextCentered(ctx, spec.worldClearedLine2, bx + bw / 2, by + 41, '#92e8ff', '#000000', bw - 20, 10);
      } else {
        drawPixelTextCentered(ctx, `${spec.hudLabel} - Fase ${this.currentLevel} Concluída!`, bx + bw / 2, by + 8, '#ffea31', '#000000', bw - 16, 9);
        drawPixelTextCentered(ctx, spec.phaseClearedLine, bx + bw / 2, by + 32, '#ffffff', '#000000', bw - 20, 10);
      }

      for (let i = 0; i < 3; i++) {
        drawStar(ctx, bx + bw / 2 - 20 + i * 20, by + 62, 4, '#ffffff', '#e3b454');
      }

      const b = this.completeBtnRect;
      ctx.fillStyle = '#2c221e';
      ctx.fillRect(b.x - 1, b.y - 1, b.w + 2, b.h + 2);
      ctx.fillStyle = '#3e7338';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = '#d9a85b';
      ctx.fillRect(b.x, b.y, b.w, 1);
      ctx.fillRect(b.x, b.y + b.h - 1, b.w, 1);
      drawPixelTextCentered(ctx, isWorldFinale ? spec.nextWorldButton : 'Continuar >', b.x + b.w / 2, b.y + 4, '#ffffff', '#000000', b.w - 6, 9);
    },

    drawGameOverOverlay(ctx) {
      ctx.fillStyle = 'rgba(10, 8, 6, 0.58)';
      ctx.fillRect(0, 20, W, H - 20);
      const bx = 34, by = 28, bw = 252, bh = 116;
      drawParchmentBox(ctx, bx, by, bw, bh, { headerH: 17, headerBg: '#59221c' });
      drawPixelTextCentered(ctx, 'Equilíbrio Perdido!', bx + bw / 2, by + 8, '#ffea31', '#000000', bw - 16, 9);
      drawPixelTextCentered(ctx, 'Os cristais perderam o equilíbrio e não podem mais formar o valor exigido nesta etapa.', bx + bw / 2, by + 28, '#ffffff', '#000000', bw - 24, 10);
      drawPixelTextCentered(ctx, 'Recomece a fase para tentar novamente!', bx + bw / 2, by + 64, '#92e8ff', '#000000', bw - 24, 9);

      const b = this.gameOverBtnRect;
      const pulse = (Math.floor(this.t * 6) & 1) === 0;
      ctx.fillStyle = '#2c221e';
      ctx.fillRect(b.x - 1, b.y - 1, b.w + 2, b.h + 2);
      ctx.fillStyle = pulse ? '#9e3328' : '#7a251c';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = pulse ? '#f2cc6b' : '#d9a85b';
      ctx.fillRect(b.x, b.y, b.w, 1);
      ctx.fillRect(b.x, b.y + b.h - 1, b.w, 1);
      drawPixelTextCentered(ctx, '↻ Reiniciar Fase', b.x + b.w / 2, b.y + 4, '#ffffff', '#000000', b.w - 8, 9);
    },

    renderMusicalElements(ctx, tq) {
      const spec = this.getSpec();
      const mt = this.musicalTime;

      if (this.phase === 'musical_part1_shadows') {
        drawBiomeShadowPlay(ctx, this.worldKey, mt, tq, this.guardianActor.x, this.guardianActor.y);
        ActorAnimator.drawMusicNotesLoop(ctx, this.guardianActor.x, this.guardianActor.y - 24, tq, {
          count: 4,
          dirX: this.guardianActor.flipX ? -16 : 16,
          dirY: -20,
          period: 1.6
        });
      } else if (this.phase === 'musical_part2_bright') {
        const extraVoice = isWorldChorusActive(mt);
        if (this.worldKey === 'sanctuary') {
          // As 4 Rainhas cantam juntas diante do Portão Ancestral aberto!
          ActorAnimator.drawActor(ctx, 'araci', 'sing', 94, 142, tq, { flipX: false });
          ActorAnimator.drawActor(ctx, 'irece', 'sing', 168, 142, tq, { flipX: true });
          ActorAnimator.drawActor(ctx, 'jurema', 'sing', 196, 142, tq, { flipX: true });
          ActorAnimator.drawStoneNeonAnimal(ctx, 'cyan', extraVoice, 18, 142, tq, false);
          ActorAnimator.drawStoneNeonAnimal(ctx, 'magenta', extraVoice, 302, 142, tq, true);
        } else {
          if (mt >= 47.0) {
            drawNextBiomePanorama(ctx, spec.nextBiome, (mt - 47.0) / 5.5, tq);
          }
          if (mt >= 26.0 && mt < 38.0) {
            drawGuardianCloudStory(ctx, this.worldKey, mt, tq, this.guardianActor.x, this.guardianActor.y);
          } else if (this.cloudPopTime > 0 && mt - this.cloudPopTime <= 0.85) {
            drawCloudPopParticles(ctx, mt - this.cloudPopTime);
          }
          if (mt >= 42.0 && mt < 47.0) {
            drawMagicCrystalDrum(ctx, 118, 118, tq);
          }
          ActorAnimator.drawStoneNeonAnimal(ctx, 'cyan', extraVoice, 18, 142, tq, false);
          ActorAnimator.drawStoneNeonAnimal(ctx, 'magenta', extraVoice, 206, 142, tq, true);
          if (mt < 47.0) {
            ActorAnimator.drawStoneNeonAnimal(ctx, 'gold', extraVoice, 298, 142, tq, true);
          }
          ActorAnimator.drawMusicNotesLoop(ctx, this.guardianActor.x, this.guardianActor.y - 24, tq, {
            count: 4,
            dirX: this.guardianActor.flipX ? -14 : 14,
            dirY: -20,
            period: 1.5
          });
        }
      }

      const captions = spec.musicalCaptions || [];
      const capTime = this.worldKey === 'sanctuary' ? (mt - 24.0) * 1.7 : mt;
      for (const [t0, t1, text] of captions) {
        if (capTime >= t0 && capTime <= t1) {
          drawParchmentBox(ctx, 10, 155, 300, 21);
          drawPixelTextCentered(ctx, text, 160, 162, '#ffea31', '#000000', 286, 9);
          break;
        }
      }
    },

    render() {
      const ctx = this.ctx;
      const tq = Math.floor(this.t * SIM_HZ) / SIM_HZ;
      ctx.imageSmoothingEnabled = false;

      if (this.phase === 'map_iris_in' || this.phase === 'map_active') {
        ctx.setTransform(2, 0, 0, 2, 0, 0);
        ctx.clearRect(0, 0, W, H);
        IrisTransition.render(ctx);
        return;
      }

      const bgSet = getBiomeBgSet(this.worldKey);
      this.composeBackground(bgSet);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.putImageData(bgSet.image, 0, 0);
      const panOffset = R(this.camPanY || 0);
      ctx.setTransform(2, 0, 0, 2, 0, panOffset * 2);

      const spec = this.getSpec();

      if (this.worldKey === 'sanctuary') {
        drawAncientSanctuaryGate(ctx, this.obstacleDecay, this.gateOpenRatio, tq);
      } else if (this.phase === 'post_musical_dlg' || this.phase === 'world_celebrate_complete' || this.phase === 'walk_to_world_exit') {
        drawNextBiomePanorama(ctx, spec.nextBiome, 1.0, tq);
        ActorAnimator.drawStoneNeonAnimal(ctx, 'cyan', this.phase === 'world_celebrate_complete', 20, 142, tq, false);
        ActorAnimator.drawStoneNeonAnimal(ctx, 'magenta', this.phase === 'world_celebrate_complete', 298, 142, tq, true);
      } else if (this.isWorldFinale()) {
        drawGiantBiomeCrystal(ctx, this.worldKey, this.obstacleDecay, this.giantCrystalFlash, this.giantCrystalBroken, tq);
        if (!this.giantCrystalBroken) {
          ActorAnimator.drawMusicNotesLoop(ctx, 176, 46, tq, { count: 4, dirX: -24, dirY: 18, period: 2.0 });
        }
      } else {
        drawBiomeObstacle(ctx, this.worldKey, this.obstacleDecay, tq);
        if (this.phase === 'gameplay' || this.phase === 'intro_dialogue' || this.phase === 'next_step_pause') {
          ActorAnimator.drawMusicNotesLoop(ctx, 308, 92, tq, { count: 4, dirX: -28, dirY: -16, period: 2.2 });
        }
      }

      // Efeitos cinemáticos de chegada à Caatinga (Fase 1): faíscas de eletricidade estática amarela (#FBBF24) + suor / apontar
      if (this.worldKey === 'caatinga' && (this.phase === 'cutscene_enter' || this.phase === 'intro_dialogue')) {
        const f18 = Math.floor(tq * 18);
        for (let k = 0; k < 6; k++) {
          const rx = 92 + k * 34 + ((f18 + k * 5) % 9) - 4;
          const ry = 128 - (k % 3) * 14 - ((f18 + k * 3) % 7);
          P1(ctx, rx, ry, '#fbbf24');
          if (((f18 + k) & 1) === 0) {
            P1(ctx, rx + 1, ry - 1, '#fef08a');
            P1(ctx, rx - 1, ry + 1, '#f59e0b');
          }
        }
      }

      if (this.phase === 'musical_part1_shadows' || this.phase === 'musical_part2_bright') {
        this.renderMusicalElements(ctx, tq);
      }

      ActorAnimator.drawActor(ctx, 'protagonist', this.protag.state, this.protag.x, this.protag.y, tq);
      if (this.ordemCompanion.visible) {
        ActorAnimator.drawActor(ctx, 'ordem', this.ordemCompanion.state, this.ordemCompanion.x, this.ordemCompanion.y, tq, {
          flipX: Boolean(this.ordemCompanion.flipX)
        });
      }
      if (this.worldKey === 'caatinga' && this.phase === 'intro_dialogue' && DialogueBox.isOpen && DialogueBox.queue) {
        const curLine = DialogueBox.queue[DialogueBox.idx];
        if (curLine && (curLine.protagState === 'panting' || curLine.protagState === 'shock')) {
          const f12 = Math.floor(tq * 12);
          const dropY = this.protag.y - 22 + (f12 % 5);
          P1(ctx, this.protag.x - 7, dropY, '#7be1f6');
          P1(ctx, this.protag.x + 8, dropY + 1, '#7be1f6');
        }
        if (curLine && curLine.pointRight) {
          const f16 = Math.floor(tq * 16);
          for (let px = this.ordemCompanion.x + 8; px <= 136; px += 6) {
            const py = R(this.ordemCompanion.y - 14 + Math.sin((px + f16 * 3) * 0.1) * 2);
            P1(ctx, px, py, '#fbbf24');
            P1(ctx, px + 1, py, '#fef08a');
          }
        }
      }
      if (this.guardianActor.visible) {
        ActorAnimator.drawActor(ctx, spec.guardianKey, this.guardianActor.state, this.guardianActor.x, this.guardianActor.y, tq, {
          flipX: Boolean(this.guardianActor.flipX)
        });
      }
      if (this.worldKey === 'sanctuary' && (this.phase === 'intro_dialogue' || this.phase === 'post_musical_dlg' || this.phase === 'world_celebrate_complete')) {
        const st = this.phase === 'world_celebrate_complete' ? 'celebrate' : 'idle';
        ActorAnimator.drawActor(ctx, 'araci', st, 126, 142, tq, { flipX: false });
        ActorAnimator.drawActor(ctx, 'irece', st, 156, 142, tq, { flipX: true });
        ActorAnimator.drawActor(ctx, 'jurema', st, 184, 142, tq, { flipX: true });
      }

      if ((this.phase && this.phase.startsWith('shell_game_')) || (this.phase === 'tutorial' && this.shellGame)) {
        this.drawShellGame(ctx, tq);
      }
      if (this.phase === 'river_melody_game' || (this.phase === 'tutorial' && this.riverMelody)) {
        this.drawRiverMelodyGame(ctx, tq);
      }
      if (this.phase === 'forest_ninja_vignette' || this.phase === 'forest_ninja_game' || (this.phase && this.phase.startsWith('forest_ninja_'))) {
        this.drawForestNinjaGame(ctx, tq);
      }

      if (
        !this.shellGame &&
        !this.riverMelody &&
        !this.forestNinja &&
        (
          this.phase === 'tutorial' ||
          this.phase === 'gameplay' ||
          this.phase === 'equation_magnetic' ||
          this.phase === 'next_step_pause' ||
          this.phase === 'step_resolving' ||
          this.phase === 'defeat_pause' ||
          this.phase === 'game_over'
        )
      ) {
        drawEmeraldAltar(ctx, this.emeraldAltar, tq);
        if (this.fractionPlatform) {
          drawFractionPlatform(ctx, this.fractionPlatform, tq);
        }

        if (this.electricShapes && this.electricShapes.length > 0) {
          for (const es of this.electricShapes) {
            drawElectricShapeNode(ctx, es, tq);
          }
        }

        if (this.phase === 'equation_magnetic' && this.pureEquation && this.shadowEquation) {
          const f12 = Math.floor(tq * 12);
          for (let x = this.pureEquation.x; x <= this.shadowEquation.x; x += 3) {
            P1(ctx, x, this.pureEquation.y + ((x + f12) & 1 ? -1 : 1), '#ffffff');
          }
        }

        const pureEqMembers = this.pieces.filter((p) => !p.broken && p.value > 0 && p.inEquation === 'pure');
        const shadowEqMembers = this.pieces.filter((p) => !p.broken && p.value > 0 && p.inEquation === 'shadow');
        drawEquationAura(ctx, this.pureEquation, tq, pureEqMembers);
        drawEquationAura(ctx, this.shadowEquation, tq, shadowEqMembers);

        if (this.tessellationPreview && this.tessellationPreview.target && this.tessellationPreview.dragged) {
          const tp = this.tessellationPreview;
          const tx = R(tp.target.x), ty = R(tp.target.y);
          const dx = R(tp.dragged.x), dy = R(tp.dragged.y);
          const f16 = Math.floor(tq * 16);
          drawRing(ctx, tx, ty, 14 + (f16 & 1), '#FBBF24');
          drawRing(ctx, tx, ty, 16 + (f16 & 1), '#FEF3C7');
          for (let s = 1; s <= 7; s++) {
            const u = s / 8;
            const lx = R(tx + (dx - tx) * u);
            const ly = R(ty + (dy - ty) * u);
            P1(ctx, lx, ly, ((s + f16) & 1) ? '#FBBF24' : '#ffffff');
          }
          if (tp.label) {
            const mx = clamp(R((tx + dx) * 0.5), 72, W - 72);
            const my = clamp(Math.min(ty, dy) - 22, 26, H - 24);
            const tw = typeof measurePixelText === 'function' ? measurePixelText(tp.label, 8) : tp.label.length * 5;
            const bw = Math.max(76, tw + 10);
            ctx.fillStyle = '#1e1b4b';
            ctx.fillRect(mx - R(bw / 2) - 1, my - 6, bw + 2, 11);
            ctx.fillStyle = '#FBBF24';
            ctx.fillRect(mx - R(bw / 2), my - 6, bw, 1);
            ctx.fillRect(mx - R(bw / 2), my + 4, bw, 1);
            drawPixelTextCentered(ctx, tp.label, mx, my - 4, '#FEF3C7', '#1e1b4b', bw - 4, 8);
          }
        }

        for (const p of this.pieces) {
          drawCrystalPiece(ctx, p, tq, p === this.selectedPiece, p.id === this.tutorialHighlightId);
        }

        drawFloatingBanners(ctx, this.floatingBanners, tq);
      }

      this.drawShards(ctx);

      ctx.setTransform(2, 0, 0, 2, 0, 0);
      const inMusical = this.phase === 'musical_part1_shadows' || this.phase === 'musical_part2_bright';
      const hudCustomTitle = spec.customHudTitle || (this.phase && this.phase.startsWith('shell_game_') ? 'Caatinga - O Desafio das Areias' : (this.phase === 'river_melody_game' ? 'Rio - Melodia das Águas' : null));
      GameHUD.renderTopBar(ctx, this.currentLevel, this.currentStep, this.totalSteps, inMusical, hudCustomTitle);

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

      DialogueBox.render(ctx, tq);
      TutorialModal.render(ctx, tq);

      if (this.phase === 'celebrate_complete') {
        this.drawCompletionOverlay(ctx, false);
      } else if (this.phase === 'world_celebrate_complete') {
        this.drawCompletionOverlay(ctx, true);
      } else if (this.phase === 'game_over') {
        this.drawGameOverOverlay(ctx);
      }

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

  global.TruePixelWorlds = TruePixelWorlds;
})(typeof window !== 'undefined' ? window : globalThis);
