/* True Pixel Art Interactive Sanctuary Menu (320x180 logical pixel grid, 12 FPS sprites / 8 FPS water / 60 Hz float).
 * Preserves the approved menu-aprovado.png layout while enhancing the Monumental Ancient Door,
 * Primordial Gem sockets, crystal clusters, and subterranean water reflections.
 */
(() => {
  'use strict';
  const home = document.getElementById('home');
  const frame = document.getElementById('menuFilmFrame');
  const canvas = document.getElementById('menuParticles');
  const ctx = canvas.getContext('2d');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');

  const W = 320, H = 180;
  const R = Math.round, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let time = 0, last = 0, hoveredChoice = -1, doorPulse = 0;


  function hash(n) {
    let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
    x ^= x >>> 13;
    x = Math.imul(x, 0xc2b2ae35);
    x ^= x >>> 16;
    return (x >>> 0) / 4294967296;
  }

  function fromMap(rows, map) {
    const h = rows.length, w = rows[0].length;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const col = map[rows[j][i]];
        if (col) { x.fillStyle = col; x.fillRect(i, j, 1, 1); }
      }
    }
    return c;
  }

  // True Pixel Art Sprites for the Monumental Ancient Door on the Menu (320x180 coordinate space)
  // Door center in menu-aprovado.png is at x = 219, y = 26..138
  const DOOR_CX = 219;
  const SOCKETS = {
    fairy:   { x: 219, y: 69 },
    emerald: { x: 202, y: 95 },
    paraiba: { x: 236, y: 95 },
    opal:    { x: 219, y: 113 }
  };

  // Grand Butterfly Fairy Gem (Top Socket of the Ancient Door)
  const FAIRY_BUTTERFLY_SPR = fromMap([
    '............oBo............',
    '...........oBCBo...........',
    '..........oBCWCBo..........',
    '.oGGGGGo..oBCWCBo..oGGGGGo.',
    'oGWWWWWGo..oBCBGo.oGWWWWWGo',
    'oGWCCCCWGo..oGo..oGWCCCCWGo',
    'oGWCBBBCWGo.oGo.oGWCBBBCWGo',
    '.oGWCBPMCWGoHYHoGWCMBCWGo..',
    '..oGWCMPMCGHYWYHGCMPCWGo...',
    '...oGGCMPMGHYWYHGMPCGGo....',
    '....ooGGPPGHYWYHGPPGGoo....',
    '...oGWCBBBGHYWYHGBBBCWGo...',
    '..oGWCCCCWGGHYHGGWCCCCWGo..',
    '..oGWWBCWGo.oGo.oGWCBWWGo..',
    '...oGCCCGo..oBo..oGCCCGo...',
    '....oGGGo..oBCBo..oGGGo....',
    '...........oBWBBo..........',
    '...........oBCBo...........',
    '............oBo............'
  ], {
    o: '#5c2f0c', G: '#e59a28', H: '#ffe478', Y: '#ffae22',
    W: '#ffffff', C: '#9ef0ff', B: '#3fc6f0', P: '#ff72e0', M: '#c77dff'
  });

  // Primordial Gems for when player unlocks Worlds 2, 3, 4
  const EMERALD_SPR = fromMap([
    '....oGo....',
    '...oGHGo...',
    '..oGEEEGo..',
    '.oGELELEGo.',
    'oGELLWLLEGo',
    'oGELWWWLLEo',
    'oGELLWLLEGo',
    '.oGELELEGo.',
    '..oGEEEGo..',
    '...oGHGo...',
    '....oGo....'
  ], { o: '#4a2b0d', G: '#e59a28', H: '#ffe478', E: '#179c52', L: '#52ef88', W: '#dcffe8' });

  const PARAIBA_SPR = fromMap([
    '....oGo....',
    '...oGHGo...',
    '..oGBBBGo..',
    '.oGBCCCBo..',
    'oGBCWWWCBo.',
    'oGBCWWWCBo.',
    '.oGBCCCBo..',
    '..oGBBBGo..',
    '...oGHGo...',
    '....oGo....'
  ], { o: '#4a2b0d', G: '#e59a28', H: '#ffe478', B: '#1488b8', C: '#3fe8ff', W: '#e4ffff' });

  const OPAL_SPR = fromMap([
    '....oGo....',
    '...oGHGo...',
    '..oGRRRGo..',
    '.oGROOORGo.',
    'oGROYYYORGo',
    'oGROYWYORGo',
    'oGROYYYORGo',
    '.oGROOORGo.',
    '..oGRRRGo..',
    '...oGHGo...',
    '....oGo....'
  ], { o: '#4a2b0d', G: '#e59a28', H: '#ffe478', R: '#c83214', O: '#ff781e', Y: '#ffd84a', W: '#ffffd0' });

  // Pixel-art Menu Button Icons (11x11 crisp pixel grid: Novo Jogo, Continuar, Opções, Créditos, Sair)
  const MENU_ICONS = [
    fromMap([
      '.....o.....',
      '....oGo....',
      '....oLo....',
      '..ooLWLoo..',
      '.oGLLWLLGo.',
      'oGLWWWWWLo.',
      '.oGLLWLLGo.',
      '..ooLWLoo..',
      '....oLo....',
      '....oGo....',
      '.....o.....'
    ], { o: '#143818', G: '#5ec93a', L: '#a8ff66', W: '#ecffd8' }),
    fromMap([
      '.oo..oGo...',
      'oCCo.oGLo..',
      'oCWooGLLo..',
      'oCWooGLLWo.',
      'oCWooGLLLWo',
      'oCWooGLLLLW',
      'oCWooGLLLWo',
      'oCWooGLLWo.',
      'oCWooGLLo..',
      'oCCo.oGLo..',
      '.oo..oGo...'
    ], { o: '#10303a', G: '#28b8d8', C: '#40d8f8', L: '#7ef4ff', W: '#e4ffff' }),
    fromMap([
      '....ooo....',
      '...oCCCo...',
      '.ooCLLLCoo.',
      '.oCLoooLCo.',
      'oCLo...oLCo',
      'oCLo...oLCo',
      'oCLo...oLCo',
      '.oCLoooLCo.',
      '.ooCLLLCoo.',
      '...oCCCo...',
      '....ooo....'
    ], { o: '#182448', C: '#6898e8', L: '#b8dcff' }),
    fromMap([
      '.ooo...ooo.',
      'oPPPo.oPPPo',
      'oPWWPoPWWPo',
      'oPWWWPWWPpo',
      'oPPPPPPPPpo',
      '.oPPPPPPpo.',
      '..oPPPPpo..',
      '...oPPpo...',
      '....opo....',
      '.....o.....',
      '...........'
    ], { o: '#3a1028', P: '#ff5a8a', W: '#ffc4d8', p: '#c42b5a' }),
    fromMap([
      '....ooo....',
      '...oCCCo...',
      '..oCWWCo...',
      '.oCWWCoo...',
      'oCWWWWCCCCo',
      'oCWWWWCCCCo',
      '.oCWWCoo...',
      '..oCWWCo...',
      '...oCCCo...',
      '....ooo....',
      '...........'
    ], { o: '#182238', C: '#8ca8c8', W: '#d8eeff' })
  ];

  // Crystal tips across menu-aprovado.png in 320x180 coordinates
  const CRYSTAL_TIPS = [
    { x: 18, y: 21, k: 'A' }, { x: 129, y: 26, k: 'A' }, { x: 144, y: 24, k: 'A' },
    { x: 151, y: 31, k: 'B' }, { x: 159, y: 68, k: 'B' }, { x: 124, y: 94, k: 'B' },
    { x: 158, y: 112, k: 'A' }, { x: 96, y: 118, k: 'A' }, { x: 40, y: 153, k: 'A' },
    { x: 179, y: 106, k: 'A' }, { x: 260, y: 106, k: 'A' }, { x: 299, y: 50, k: 'B' },
    { x: 292, y: 96, k: 'A' }, { x: 313, y: 96, k: 'B' }, { x: 272, y: 145, k: 'A' },
    { x: 219, y: 50, k: 'G' }, { x: 202, y: 80, k: 'G' }, { x: 236, y: 80, k: 'G' },
    { x: 219, y: 127, k: 'G' }
  ];

  // Subtle light oscillators preserving the base glow
  const lamps = [[17, 79, 20], [38, 55, 16], [87, 74, 26], [68, 38, 18], [68, 56, 22], [91, 39, 10]].map(([x, y, size]) => {
    const el = document.createElement('div');
    el.className = 'crystal-light';
    el.style.maskImage = `radial-gradient(ellipse ${size / 2}% ${size}% at ${x}% ${y}%, black 20%, transparent 100%)`;
    document.getElementById('crystalLights').append(el);
    return el;
  });

  // Ambient luminescent crystal particles in 320x180 space (smooth 60 FPS organic float & gentle breathing)
  const particles = Array.from({ length: 56 }, (_, i) => ({
    x: hash(i * 19 + 73),
    y: hash(i * 37 + 211),
    phase: hash(i * 53 + 409) * Math.PI * 2,
    freq: 1.1 + hash(i * 71 + 13) * 1.6,
    amp: 0.006 + hash(i * 43 + 31) * 0.012,
    speed: 0.038 + hash(i * 11 + 29) * 0.052,
    twinkle: 1.6 + hash(i * 89 + 17) * 2.2,
    s: (i % 3 === 0) ? 2 : 1,
    kind: i % 5 === 0 ? 'gold' : i % 3 === 0 ? 'pink' : 'cyan'
  }));

  function P1(x, y, c) {
    ctx.fillStyle = c;
    ctx.fillRect(R(x), R(y), 1, 1);
  }

  function ring(cx, cy, r, col) {
    if (r <= 0) return;
    ctx.fillStyle = col;
    let x = R(r), y = 0, e = 1 - x;
    while (x >= y) {
      ctx.fillRect(cx + x, cy + y, 1, 1); ctx.fillRect(cx + y, cy + x, 1, 1);
      ctx.fillRect(cx - y, cy + x, 1, 1); ctx.fillRect(cx - x, cy + y, 1, 1);
      ctx.fillRect(cx - x, cy - y, 1, 1); ctx.fillRect(cx - y, cy - x, 1, 1);
      ctx.fillRect(cx + y, cy - x, 1, 1); ctx.fillRect(cx + x, cy - y, 1, 1);
      y++;
      if (e < 0) e += 2 * y + 1;
      else { x--; e += 2 * (y - x) + 1; }
    }
  }

  function star(cx, cy, s, core, tip) {
    if (s <= 0) return;
    cx = R(cx); cy = R(cy);
    ctx.fillStyle = tip;
    ctx.fillRect(cx - s, cy, 2 * s + 1, 1);
    ctx.fillRect(cx, cy - s, 1, 2 * s + 1);
    const inner = Math.floor(s * 0.55);
    ctx.fillStyle = core;
    ctx.fillRect(cx - inner, cy, 2 * inner + 1, 1);
    ctx.fillRect(cx, cy - inner, 1, 2 * inner + 1);
  }

  function dia(x0, y0, r, rim, fill) {
    x0 = R(x0); y0 = R(y0);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const d = Math.abs(dx) + Math.abs(dy);
        if (d <= r) P1(x0 + dx, y0 + dy, d === r ? rim : fill);
      }
    }
  }

  function fit() {
    const w = home.clientWidth || innerWidth, h = home.clientHeight || innerHeight;
    const fw = Math.max(w, h * 1672 / 941), fh = fw * 941 / 1672;
    frame.style.setProperty('--film-width', fw + 'px');
    frame.style.setProperty('--film-height', fh + 'px');
    frame.style.setProperty('--film-left', (w < 600 ? Math.min(0, (w - fw * 0.31) / 2) : 0) + 'px');
    frame.style.setProperty('--menu-font', fw * 36 / 1672 + 'px');
    // True Pixel Art internal resolution 320x180
    canvas.width = W;
    canvas.height = H;
    ctx.imageSmoothingEnabled = false;
    frame.querySelectorAll('.menu-choice:not(.menu-exit)').forEach(button => {
      button.style.setProperty('--crop-x', -button.offsetLeft + 'px');
      button.style.setProperty('--crop-y', -button.offsetTop + 'px');
    });
  }

  // Hook hover & focus interactions on the 5 menu buttons with immediate visual & audio feedback
  const buttons = [...frame.querySelectorAll('.menu-choice')];
  function activateMenuHover(idx) {
    if (hoveredChoice === idx) return;
    hoveredChoice = idx;
    doorPulse = Math.max(doorPulse, (idx === 0 || idx === 1) ? 1.2 : 0.55);
    window.CrystalAudio?.hover?.();
    if (window.CrystalMenuAudio && !window.CrystalMenuAudio.playing) {
      window.CrystalMenuAudio.play();
    }
  }
  buttons.forEach((btn, idx) => {
    btn.addEventListener('pointerenter', () => activateMenuHover(idx));
    btn.addEventListener('focus', () => activateMenuHover(idx));
    btn.addEventListener('pointerleave', () => {
      if (hoveredChoice === idx) hoveredChoice = -1;
    });
    btn.addEventListener('blur', () => {
      if (hoveredChoice === idx) hoveredChoice = -1;
    });
  });

  // Interactive click on the Ancient Door or Cavern Crystals in the Menu
  frame.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    window.CrystalMenuAudio?.play?.();
    const rect = frame.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const py = ((e.clientY - rect.top) / rect.height) * H;
    // Check if clicked on the Monumental Ancient Door (x = 170..268, y = 24..145)
    if (px >= 168 && px <= 270 && py >= 22 && py <= 145) {
      doorPulse = 1.6;
      window.CrystalAudio?.reward?.(2);
    } else {
      doorPulse = 0.9;
      window.CrystalAudio?.clink?.();
    }
  });

  function drawAncientDoorEnhancements(f12, f8) {
    const completed = window.CrystalApp?.state?.completed || [];
    const boost = hoveredChoice === 0 || hoveredChoice === 1 || doorPulse > 0.1;

    // 1. Arch Keystone & Golden Filigree Nodes along the Monumental Door
    const goldCore = (f12 % 4 === 0 || boost) ? '#fff6b8' : '#ffd35a';
    const goldRim = '#d88b28';
    dia(DOOR_CX, 50, 2, goldRim, goldCore);
    dia(DOOR_CX, 91, 2, goldRim, goldCore);

    // 2. Twin Column Ledge Crystals (x=179, y=109 and x=260, y=109)
    for (const cx of [179, 260]) {
      const hot = ((f12 + cx) % 6) < 2 || boost;
      P1(cx, 108, '#ffffff');
      P1(cx, 109, hot ? '#d0fcff' : '#3fc6f0');
      if (hot) star(cx, 107, 2, '#ffffff', '#9ef0ff');
    }

    // 3. Top Socket: Gema da Fada (Butterfly Crystal Emblem)
    // Drawn at (219, 69) to make the door's centerpiece razor-sharp True Pixel Art
    ctx.drawImage(FAIRY_BUTTERFLY_SPR, SOCKETS.fairy.x - 13, SOCKETS.fairy.y - 9);
    if ((f12 & 1) === 0 || boost) {
      star(SOCKETS.fairy.x, SOCKETS.fairy.y, boost ? 3 : 2, '#ffffff', '#ffe478');
      P1(SOCKETS.fairy.x - 8, SOCKETS.fairy.y - 3, '#ffffff');
      P1(SOCKETS.fairy.x + 8, SOCKETS.fairy.y - 3, '#ffffff');
    }
    if (boost || (f12 % 24) < 6) {
      const r = 6 + ((f12 + R(doorPulse * 6)) % 10);
      ring(SOCKETS.fairy.x, SOCKETS.fairy.y, r, r % 2 === 0 ? '#9ef0ff' : '#ffc6f2');
    }

    // 4. World 2, 3, 4 Primordial Gem Sockets (light up if unlocked, or shimmer with golden filigree)
    if (completed.includes(10)) {
      ctx.drawImage(EMERALD_SPR, SOCKETS.emerald.x - 5, SOCKETS.emerald.y - 5);
      if (f12 % 8 === 0) star(SOCKETS.emerald.x, SOCKETS.emerald.y - 2, 2, '#ffffff', '#7aee8d');
    } else if ((f12 + 2) % 16 === 0 || boost) {
      star(SOCKETS.emerald.x - 4, SOCKETS.emerald.y - 6, 1, '#fff3b0', '#e59a28');
    }

    if (completed.includes(15)) {
      ctx.drawImage(PARAIBA_SPR, SOCKETS.paraiba.x - 5, SOCKETS.paraiba.y - 5);
      if ((f12 + 3) % 8 === 0) star(SOCKETS.paraiba.x, SOCKETS.paraiba.y - 2, 2, '#ffffff', '#57ffe3');
    } else if ((f12 + 7) % 16 === 0 || boost) {
      star(SOCKETS.paraiba.x + 4, SOCKETS.paraiba.y - 6, 1, '#fff3b0', '#e59a28');
    }

    if (completed.includes(20)) {
      ctx.drawImage(OPAL_SPR, SOCKETS.opal.x - 5, SOCKETS.opal.y - 5);
      if ((f12 + 5) % 8 === 0) star(SOCKETS.opal.x, SOCKETS.opal.y - 2, 2, '#ffffff', '#ffa23c');
    } else if ((f12 + 11) % 16 === 0 || boost) {
      star(SOCKETS.opal.x, SOCKETS.opal.y - 8, 1, '#fff3b0', '#e59a28');
    }

    // 5. Subterranean Water Ripples in front of the Ancient Door (y = 144..179, x = 154..284)
    for (let k = 0; k < 28; k++) {
      const wy = 145 + (k * 5) % 34;
      const span = 38 + ((wy - 145) * 1.1);
      const wx = DOOR_CX - span + ((Math.floor(hash(k + 301) * (span * 2)) + f8 * ((k % 2) + 1)) % (span * 2));
      const col = k % 5 === 0 ? '#ffd35a' : k % 3 === 0 ? '#ff72e0' : '#63e5ff';
      ctx.fillStyle = col;
      ctx.fillRect(R(wx), R(wy), 2 + (k % 3), 1);
    }
  }

  function drawMenuSelector(f12) {
    if (hoveredChoice < 0 || hoveredChoice > 4) return;
    // Button vertical centers in 320x180 space matching .menu-choice tops (36.2%, 44.8%, 53.4%, 62.0%, 70.6% with height 6.8%)
    const ys = [71, 87, 102, 118, 133];
    const cols = ['#a8ff66', '#5ef2ff', '#9ef0ff', '#ff8ae2', '#ffd35a'];
    const bws = [76, 72, 60, 64, 46];
    const cy = ys[hoveredChoice];
    const col = cols[hoveredChoice] || '#9ef0ff';
    const bw = bws[hoveredChoice] || 72;
    const bob = [0, -1, 0, 1][f12 % 4];
    const shift = (f12 & 1) ? 1 : 0;

    // Seta luminosa em pixel art apontando para a opção sob o mouse com espaçamento elegante
    dia(8 + shift, cy + bob, 2, '#ffffff', col);
    P1(12 + shift, cy + bob, '#ffffff');

    // Colchetes de canto em pixel art + trilha energética sob o botão focado
    const bx = 18, by = cy - 7, bh = 14;
    ctx.fillStyle = col;
    // Canto superior esquerdo e inferior esquerdo
    ctx.fillRect(bx, by, 5, 1);
    ctx.fillRect(bx, by, 1, 4);
    ctx.fillRect(bx, by + bh, 5, 1);
    ctx.fillRect(bx, by + bh - 3, 1, 4);
    // Canto superior direito e inferior direito
    ctx.fillRect(bx + bw - 4, by, 5, 1);
    ctx.fillRect(bx + bw, by, 1, 4);
    ctx.fillRect(bx + bw - 4, by + bh, 5, 1);
    ctx.fillRect(bx + bw, by + bh - 3, 1, 4);

    // Linha de energia animada + estrelas nas pontas com distância confortável do texto
    ctx.fillRect(bx + 4, by + bh, bw - 8, 1);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx + 6 + ((f12 * 5) % (bw - 20)), by + bh, 10, 1);
    star(bx + bw + 6 - shift, cy, (f12 & 1) ? 2 : 1, '#ffffff', col);
  }

  function renderStaticFrame() {
    ctx.clearRect(0, 0, W, H);
    drawAncientDoorEnhancements(0, 0);
    drawMenuSelector(0);
  }

  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    const reduced = document.body.classList.contains('reduce-motion') || motion.matches;

    if (!home.hidden && !document.hidden && !document.querySelector('dialog[open]')) {
      if (reduced) {
        renderStaticFrame();
      } else {
        time += dt;
        doorPulse = Math.max(0, doorPulse - dt * 1.4);

        const f12 = Math.floor(time * 12);
        const f8 = Math.floor(time * 8);

        // GPU-composited light pulsation via opacity (avoids expensive full-screen filter recalculations)
        lamps.forEach((el, i) => {
          const boost = (hoveredChoice === 0 || hoveredChoice === 1) && (i === 3 || i === 4) ? 0.35 : 0;
          const osc = 0.5 + 0.5 * Math.sin(time * (0.55 + i * 0.07) + i * 1.8);
          el.style.opacity = (0.2 + boost + osc * 0.7).toFixed(2);
        });

        ctx.clearRect(0, 0, W, H);
        drawAncientDoorEnhancements(f12, f8);
        drawMenuSelector(f12);

        // Crystal tip glints at 12 FPS
        CRYSTAL_TIPS.forEach((tp, i) => {
          const phase = (f12 + Math.floor(hash(i + 77) * 36)) % 36;
          if (phase < 3) {
            const tipCol = tp.k === 'G' ? '#ffe478' : tp.k === 'B' ? '#ffc6f2' : '#9ef0ff';
            star(tp.x, tp.y, [1, 2, 1][phase], '#ffffff', tipCol);
          }
        });

        // Ascending True Pixel Art particles (smooth 60 FPS float, organic drift & soft alpha breathing)
        for (const p of particles) {
          p.y -= dt * p.speed;
          if (p.y < -0.04) {
            p.y = 1.04;
            p.x = hash(p.phase * 1000 + Math.floor(time * 12));
          }
          const drift = Math.sin(time * p.freq + p.phase) * p.amp;
          const px = R((p.x + drift) * W);
          const py = R(p.y * H);

          // Smooth vertical envelope: gentle fade-in near bottom, fade-out near top
          const vEnvelope = Math.sin(clamp(p.y, 0, 1) * Math.PI);
          // Harmonic breathing twinkle (gentle luminescence without harsh 8 FPS strobing)
          const breathing = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(time * p.twinkle + p.phase));
          const alpha = vEnvelope * breathing;

          if (alpha > 0.02) {
            const col = p.kind === 'gold' ? '#ffd35a' : p.kind === 'pink' ? '#ff8ae2' : '#9ef0ff';
            ctx.globalAlpha = alpha;
            ctx.fillStyle = col;
            ctx.fillRect(px, py, p.s, p.s);
            if (p.s > 1) {
              // Glowing soft core for fairy motes
              ctx.globalAlpha = alpha * 0.85;
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(px, py, 1, 1);
            }
          }
        }
        ctx.globalAlpha = 1.0;
      }
    }
    requestAnimationFrame(tick);
  }
  addEventListener('resize', fit);
  frame.classList.add('video-ready');
  fit();
  requestAnimationFrame(tick);
})();
