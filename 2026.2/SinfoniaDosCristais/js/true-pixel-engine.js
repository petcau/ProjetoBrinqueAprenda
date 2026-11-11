'use strict';
/**
 * TRUE PIXEL ART ENGINE — Sinfonia dos Cristais
 * Baseado estritamente na arquitetura de `demo-pixel-art.html`:
 * - Canvas lógico 320x180 (imageSmoothingEnabled = false, image-rendering: pixelated)
 * - Matrizes procedurais fromMap / silhouette / Uint32Array
 * - Dithering Bayer 4x4
 * - Sprites a 12 FPS e Lógica a 60 Hz
 * - Banco Central de Animações Reutilizáveis em Loop (SpriteBank / ActorAnimator)
 * - Caixa de Diálogo Global com encaixes das gemas faltantes no topo e Retrato (Somente Rosto) em loop
 * - Sistema de Tutorial Paginado (Vignette / Animated Tutorial Card) com botão Avançar
 */
(function (global) {
  const W = 320, H = 180, SPRITE_FPS = 12, SIM_HZ = 60;
  const R = Math.round;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeInOut = p => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);

  // Matriz Bayer 4x4 idêntica à demo-pixel-art.html
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const bay = (x, y) => BAYER[((y & 3) << 2) | (x & 3)];

  function mulberry(a) {
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hex(h) {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  const C32 = new Map();
  function c32(h) {
    let v = C32.get(h);
    if (v === undefined) {
      const [r, g, b] = hex(h);
      v = ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
      C32.set(h, v);
    }
    return v;
  }

  function mk(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    return [c, x];
  }

  function fromMap(rows, map) {
    const h = rows.length, w = rows[0].length;
    const [c, x] = mk(w, h);
    for (let j = 0; j < h; j++) {
      const row = rows[j];
      for (let i = 0; i < w; i++) {
        const col = map[row[i]];
        if (col) {
          x.fillStyle = col;
          x.fillRect(i, j, 1, 1);
        }
      }
    }
    return c;
  }

  function silhouette(rows, col) {
    const m = {};
    for (const r of rows) {
      for (const ch of r) {
        if (ch !== '.') m[ch] = col;
      }
    }
    return fromMap(rows, m);
  }

  function mirrorCanvas(c) {
    const [m, x] = mk(c.width, c.height);
    x.translate(c.width, 0);
    x.scale(-1, 1);
    x.drawImage(c, 0, 0);
    if (c.hib) m.hib = true;
    return m;
  }

  // Utilitários de desenho 1-bit / True Pixel no contexto alvo
  function P1(ctx, x, y, col) {
    ctx.fillStyle = col;
    ctx.fillRect(R(x), R(y), 1, 1);
  }

  function drawRing(ctx, cx, cy, r, col) {
    cx = R(cx); cy = R(cy); r = R(r);
    if (r <= 0) return;
    ctx.fillStyle = col;
    let x = r, y = 0, e = 1 - r;
    while (x >= y) {
      ctx.fillRect(cx + x, cy + y, 1, 1);
      ctx.fillRect(cx + y, cy + x, 1, 1);
      ctx.fillRect(cx - y, cy + x, 1, 1);
      ctx.fillRect(cx - x, cy + y, 1, 1);
      ctx.fillRect(cx - x, cy - y, 1, 1);
      ctx.fillRect(cx - y, cy - x, 1, 1);
      ctx.fillRect(cx + y, cy - x, 1, 1);
      ctx.fillRect(cx + x, cy - y, 1, 1);
      y++;
      if (e < 0) e += 2 * y + 1;
      else { x--; e += 2 * (y - x) + 1; }
    }
  }

  function drawStar(ctx, cx, cy, s, core, tip) {
    cx = R(cx); cy = R(cy); s = R(s);
    if (s <= 0) return;
    ctx.fillStyle = tip;
    ctx.fillRect(cx - s, cy, 2 * s + 1, 1);
    ctx.fillRect(cx, cy - s, 1, 2 * s + 1);
    const inner = Math.floor(s * 0.55);
    ctx.fillStyle = core;
    ctx.fillRect(cx - inner, cy, 2 * inner + 1, 1);
    ctx.fillRect(cx, cy - inner, 1, 2 * inner + 1);
  }

  // ============================================================================
  // FONTE BITMAP PROPORCIONAL ESTILO OWLBOY (Maiúsculas, Minúsculas e Acentos PT-BR)
  // Renderizada com precisão sub-lógica (1:1 com os 640x360 pixels físicos) e
  // cálculo exato de largura para que NENHUM texto saia de esquadro!
  // ============================================================================
  const BASE_GLYPHS = {
    // Maiúsculas (7 linhas)
    A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
    C: ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
    D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
    E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
    F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
    G: ['.####', '#....', '#....', '#.###', '#...#', '#...#', '.###.'],
    H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
    J: ['..###', '...#.', '...#.', '...#.', '#..#.', '#..#.', '.##..'],
    K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
    L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
    M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
    N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
    O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
    Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
    R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
    S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
    T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
    U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    V: ['#...#', '#...#', '#...#', '#...#', '.#.#.', '.#.#.', '..#..'],
    W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
    X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
    Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
    Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
    // Minúsculas (8 linhas: 0..6 corpo + 7 descendente)
    a: ['....', '....', '.###', '#..#', '#..#', '#..#', '.###', '....'],
    b: ['#...', '#...', '###.', '#..#', '#..#', '#..#', '###.', '....'],
    c: ['....', '....', '.###', '#...', '#...', '#...', '.###', '....'],
    d: ['...#', '...#', '.###', '#..#', '#..#', '#..#', '.###', '....'],
    e: ['....', '....', '.##.', '#..#', '####', '#...', '.###', '....'],
    f: ['..##', '.#..', '####', '.#..', '.#..', '.#..', '.#..', '....'],
    g: ['....', '....', '.###', '#..#', '#..#', '.###', '...#', '###.'],
    h: ['#...', '#...', '###.', '#..#', '#..#', '#..#', '#..#', '....'],
    i: ['.#.', '...', '##.', '.#.', '.#.', '.#.', '###', '...'],
    j: ['..#', '...', '.##', '..#', '..#', '..#', '#.#', '.#.'],
    k: ['#...', '#...', '#..#', '#.#.', '##..', '#.#.', '#..#', '....'],
    l: ['##.', '.#.', '.#.', '.#.', '.#.', '.#.', '###', '...'],
    m: ['.....', '.....', '##.#.', '#.#.#', '#.#.#', '#...#', '#...#', '.....'],
    n: ['....', '....', '###.', '#..#', '#..#', '#..#', '#..#', '....'],
    o: ['....', '....', '.##.', '#..#', '#..#', '#..#', '.##.', '....'],
    p: ['....', '....', '###.', '#..#', '#..#', '###.', '#...', '#...'],
    q: ['....', '....', '.###', '#..#', '#..#', '.###', '...#', '...#'],
    r: ['....', '....', '#.##', '##..', '#...', '#...', '#...', '....'],
    s: ['....', '....', '.###', '#...', '.##.', '...#', '###.', '....'],
    t: ['.#..', '.#..', '####', '.#..', '.#..', '.#..', '..##', '....'],
    u: ['....', '....', '#..#', '#..#', '#..#', '#..#', '.###', '....'],
    v: ['....', '....', '#..#', '#..#', '#..#', '.##.', '.##.', '....'],
    w: ['.....', '.....', '#...#', '#...#', '#.#.#', '#.#.#', '.#.#.', '.....'],
    x: ['....', '....', '#..#', '.##.', '.##.', '.##.', '#..#', '....'],
    y: ['....', '....', '#..#', '#..#', '#..#', '.###', '...#', '###.'],
    z: ['....', '....', '####', '..#.', '.#..', '#...', '####', '....'],
    // Dígitos e pontuação
    '0': ['.###.', '#..##', '#.#.#', '#.#.#', '##..#', '#...#', '.###.'],
    '1': ['.#.', '##.', '.#.', '.#.', '.#.', '.#.', '###'],
    '2': ['.###.', '#...#', '....#', '..##.', '.#...', '#....', '#####'],
    '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
    '4': ['#...#', '#...#', '#...#', '#####', '....#', '....#', '....#'],
    '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
    '6': ['.###.', '#....', '####.', '#...#', '#...#', '#...#', '.###.'],
    '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
    '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
    '9': ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
    '!': ['#', '#', '#', '#', '#', '.', '#'],
    '?': ['###.', '...#', '..#.', '.#..', '.#..', '....', '.#..'],
    '.': ['..', '..', '..', '..', '..', '..', '##'],
    ',': ['..', '..', '..', '..', '..', '.#', '#.'],
    ':': ['..', '.#', '..', '..', '.#', '..', '..'],
    ';': ['..', '.#', '..', '..', '.#', '#.', '..'],
    '-': ['...', '...', '...', '###', '...', '...', '...'],
    '+': ['...', '.#.', '.#.', '###', '.#.', '.#.', '...'],
    '=': ['...', '...', '###', '...', '###', '...', '...'],
    '/': ['...#', '..#.', '..#.', '.#..', '.#..', '#...', '#...'],
    '(': ['.#', '#.', '#.', '#.', '#.', '#.', '.#'],
    ')': ['#.', '.#', '.#', '.#', '.#', '.#', '#.'],
    '"': ['#.#', '#.#', '...', '...', '...', '...', '...'],
    '\'': ['#', '#', '.', '.', '.', '.', '.'],
    '>': ['#..', '.#.', '..#', '.#.', '#..', '...', '...'],
    '<': ['..#', '.#.', '#..', '.#.', '..#', '...', '...'],
    '%': ['#..#', '...#', '..#.', '.#..', '#...', '#..#', '....'],
    '•': ['.#.', '###', '.#.', '...', '...', '...', '...'],
    '♪': ['..##', '..##', '..#.', '..#.', '.##.', '####', '.##.'],
    '↺': ['.###.', '#...#', '#.###', '#.#..', '#....', '#...#', '.###.'],
    '↻': ['.###.', '#...#', '###.#', '..#.#', '....#', '#...#', '.###.'],
    '♥': ['.#.#.', '#####', '#####', '.###.', '..#..', '.....', '.....'],
    '❚': ['##', '##', '##', '##', '##', '##', '##'],
    '—': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
    '–': ['....', '....', '....', '####', '....', '....', '....'],
    '…': ['.....', '.....', '.....', '.....', '.....', '.....', '#.#.#'],
    '&': ['.##..', '#..#.', '.##..', '#..#.', '#.#..', '#..#.', '.##.#'],
    '*': ['.#.', '###', '.#.', '...', '...', '...', '...'],
    '[': ['##', '#.', '#.', '#.', '#.', '#.', '##'],
    ']': ['##', '.#', '.#', '.#', '.#', '.#', '##'],
    '_': ['....', '....', '....', '....', '....', '....', '####'],
    '°': ['###', '#.#', '###', '...', '...', '...', '...'],
    'º': ['###', '#.#', '###', '...', '###', '...', '...'],
    'ª': ['###', '#.#', '###', '...', '###', '...', '...'],
    '▶': ['#...', '##..', '###.', '####', '###.', '##..', '#...'],
    '◀': ['...#', '..##', '.###', '####', '.###', '..##', '...#']
  };

  const ACCENT_MAP = {
    'Á': ['A', 'acute', false], 'À': ['A', 'grave', false], 'Â': ['A', 'circ', false], 'Ã': ['A', 'tilde', false],
    'É': ['E', 'acute', false], 'Ê': ['E', 'circ', false],
    'Í': ['I', 'acute', false],
    'Ó': ['O', 'acute', false], 'Ô': ['O', 'circ', false], 'Õ': ['O', 'tilde', false],
    'Ú': ['U', 'acute', false],
    'Ç': ['C', 'cedilla', false],
    'á': ['a', 'acute', true], 'à': ['a', 'grave', true], 'â': ['a', 'circ', true], 'ã': ['a', 'tilde', true],
    'é': ['e', 'acute', true], 'ê': ['e', 'circ', true],
    'í': ['i', 'acute', true],
    'ó': ['o', 'acute', true], 'ô': ['o', 'circ', true], 'õ': ['o', 'tilde', true],
    'ú': ['u', 'acute', true],
    'ç': ['c', 'cedilla', true],
    'ü': ['u', 'umlaut', true],
    'Ü': ['U', 'umlaut', false]
  };

  const FALLBACK_GLYPH = [
    '###',
    '#.#',
    '#.#',
    '#.#',
    '#.#',
    '#.#',
    '###'
  ];

  function getGlyphInfo(ch) {
    if (ch === '’' || ch === '‘') ch = '\'';
    else if (ch === '“' || ch === '”') ch = '"';

    let acc = ACCENT_MAP[ch];
    let key = acc ? acc[0] : ch;
    let g = BASE_GLYPHS[key];
    if (!g) {
      const up = ch.toUpperCase();
      acc = ACCENT_MAP[up];
      key = acc ? acc[0] : up;
      g = BASE_GLYPHS[key];
    }
    if (!g) return { g: FALLBACK_GLYPH, acc: null, w: 3 };
    return { g, acc, w: g[0].length };
  }

  function measurePixelText(text) {
    const s = String(text || '');
    let total = 0;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === ' ') {
        total += 3;
      } else {
        const info = getGlyphInfo(ch);
        total += info.w + 1;
      }
    }
    return Math.max(0, total - 1);
  }

  function drawPixelChar(ctx, ch, x, y, col, shadowCol) {
    const { g, acc, w } = getGlyphInfo(ch);
    if (!g) return 3;
    const rows = g.length;

    const drawAccent = (ox, oy) => {
      if (!acc) return;
      const type = acc[1];
      const isLow = acc[2];
      const ay = oy + (isLow ? 0 : -2);
      const ax = ox + Math.max(0, Math.floor((w - 3) / 2));
      if (type === 'acute') {
        ctx.fillRect(ax + 2, ay, 1, 1);
        ctx.fillRect(ax + 1, ay + 1, 1, 1);
      } else if (type === 'grave') {
        ctx.fillRect(ax, ay, 1, 1);
        ctx.fillRect(ax + 1, ay + 1, 1, 1);
      } else if (type === 'circ') {
        ctx.fillRect(ax + 1, ay, 1, 1);
        ctx.fillRect(ax, ay + 1, 1, 1);
        ctx.fillRect(ax + 2, ay + 1, 1, 1);
      } else if (type === 'tilde') {
        ctx.fillRect(ax, ay + 1, 1, 1);
        ctx.fillRect(ax + 1, ay + 1, 1, 1);
        ctx.fillRect(ax + 2, ay + 1, 1, 1);
      } else if (type === 'cedilla') {
        ctx.fillRect(ox + 1, oy + 7, 1, 1);
        ctx.fillRect(ox, oy + 8, 2, 1);
      } else if (type === 'umlaut') {
        ctx.fillRect(ax, ay + 1, 1, 1);
        ctx.fillRect(ax + 2, ay + 1, 1, 1);
      }
    };

    if (shadowCol) {
      ctx.fillStyle = shadowCol;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < w; i++) {
          if (g[j][i] === '#') ctx.fillRect(x + i + 1, y + j + 1, 1, 1);
        }
      }
      drawAccent(x + 1, y + 1);
    }
    ctx.fillStyle = col || '#2c221e';
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < w; i++) {
        if (g[j][i] === '#') ctx.fillRect(x + i, y + j, 1, 1);
      }
    }
    drawAccent(x, y);
    return w + 1;
  }

  function wrapPixelLines(text, maxWidth = 999) {
    const paragraphs = String(text || '').split('\n');
    const lines = [];
    for (const para of paragraphs) {
      const words = para.split(' ').filter(Boolean);
      if (!words.length) {
        lines.push('');
        continue;
      }
      let curLine = words[0];
      let curW = measurePixelText(curLine);
      for (let w = 1; w < words.length; w++) {
        const word = words[w];
        const wordW = measurePixelText(word);
        if (curW + 3 + wordW <= maxWidth) {
          curLine += ' ' + word;
          curW += 3 + wordW;
        } else {
          lines.push(curLine);
          curLine = word;
          curW = wordW;
        }
      }
      lines.push(curLine);
    }
    return lines;
  }

  function normalizeReadableTextColor(col) {
    if (!col) return '#ffea31';
    const c = String(col).toLowerCase();
    if (c === '#2c221e' || c === '#1f1410' || c === '#120d0b' || c === '#633b34' || c === '#8c2d1f') {
      return '#ffea31';
    }
    return col;
  }

  function renderHDCanvasLine(ctx, line, drawX, topY, col, shadowCol, maxW, lineHeight, align = 'left') {
    if (!ctx || typeof ctx.fillText !== 'function') return false;
    if (!line) return true;
    const fontPx = Math.max(5.6, Math.min(8.2, (lineHeight || 9) - 2.2));
    const fillCol = normalizeReadableTextColor(col);
    const strokeCol = (shadowCol && shadowCol !== fillCol) ? shadowCol : '#000000';
    if (typeof ctx.save === 'function') ctx.save();
    ctx.font = `700 ${fontPx.toFixed(1)}px "Fredoka", "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = align === 'center' ? 'center' : (align === 'right' ? 'right' : 'left');
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.lineWidth = 1.65;
    ctx.strokeStyle = strokeCol;
    const baseY = topY + fontPx * 0.88;
    const limitW = (Number.isFinite(maxW) && maxW > 0 && maxW < 900) ? maxW : undefined;
    if (typeof ctx.strokeText === 'function') {
      if (limitW !== undefined) ctx.strokeText(line, drawX, baseY, limitW);
      else ctx.strokeText(line, drawX, baseY);
    }
    ctx.fillStyle = fillCol;
    if (limitW !== undefined) ctx.fillText(line, drawX, baseY, limitW);
    else ctx.fillText(line, drawX, baseY);
    if (typeof ctx.restore === 'function') ctx.restore();
    return true;
  }

  function drawPixelText(ctx, text, x, y, col = '#ffea31', shadowCol = '#000000', maxWidth = 999, lineHeight = 10, align = 'left') {
    x = R(x); y = R(y);
    const lines = wrapPixelLines(text, maxWidth);
    let cy = y;
    for (const line of lines) {
      let drawX = x;
      if (align === 'center') {
        drawX = x + maxWidth / 2;
      } else if (align === 'right') {
        drawX = x + maxWidth;
      }
      if (!renderHDCanvasLine(ctx, line, drawX, cy, col, shadowCol, maxWidth, lineHeight, align)) {
        const lw = measurePixelText(line);
        let cx = x;
        if (align === 'center') {
          cx = R(x + (maxWidth - lw) / 2);
        } else if (align === 'right') {
          cx = R(x + maxWidth - lw);
        }
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === ' ') cx += 3;
          else cx += drawPixelChar(ctx, ch, cx, cy, col, shadowCol);
        }
      }
      cy += lineHeight;
    }
    return lines.length * lineHeight;
  }

  function drawPixelTextCentered(ctx, text, centerX, y, col = '#ffea31', shadowCol = '#000000', maxWidth = 280, lineHeight = 10) {
    const lines = wrapPixelLines(text, maxWidth);
    let cy = R(y);
    for (const line of lines) {
      if (!renderHDCanvasLine(ctx, line, centerX, cy, col, shadowCol, maxWidth, lineHeight, 'center')) {
        const lw = measurePixelText(line);
        let cx = R(centerX - lw / 2);
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === ' ') cx += 3;
          else cx += drawPixelChar(ctx, ch, cx, cy, col, shadowCol);
        }
      }
      cy += lineHeight;
    }
    return lines.length * lineHeight;
  }

  // ============================================================================
  // MOLDURA DE PERGAMINHO / CAIXA DE ALTO CONTRASTE ESTILO OWLBOY (drawParchmentBox)
  // Fundo escuro profundo (#1e2236 / #282c44) para máximo contraste do texto
  // amarelo com borda preta (diálogos/tutoriais) e branco/azul (menus/HUD).
  // ============================================================================
  function drawParchmentBox(ctx, bx, by, bw, bh, opts = {}) {
    bx = R(bx); by = R(by); bw = R(bw); bh = R(bh);
    // Sombra projetada suave sob a caixa
    ctx.fillStyle = 'rgba(8, 6, 14, 0.6)';
    ctx.fillRect(bx + 2, by + 3, bw, bh);

    // Borda externa escura (#14111c) com cantos chanfrados
    ctx.fillStyle = '#14111c';
    ctx.fillRect(bx + 1, by, bw - 2, bh);
    ctx.fillRect(bx, by + 1, bw, bh - 2);

    // Fundo de alto contraste (#262338) + miolo escuro (#1c1a2b)
    ctx.fillStyle = '#262338';
    ctx.fillRect(bx + 1, by + 1, bw - 2, bh - 2);
    ctx.fillStyle = '#1c1a2b';
    ctx.fillRect(bx + 3, by + 3, bw - 6, bh - 6);

    // Borda interna dourada/bronze (#bfa36f) + cantoneiras (#d9bf86)
    ctx.fillStyle = '#8c7d70';
    ctx.fillRect(bx + 2, by + 2, bw - 4, 1);
    ctx.fillRect(bx + 2, by + bh - 3, bw - 4, 1);
    ctx.fillRect(bx + 2, by + 2, 1, bh - 4);
    ctx.fillRect(bx + bw - 3, by + 2, 1, bh - 4);

    ctx.fillStyle = '#bfa36f';
    ctx.fillRect(bx + 2, by + 2, 3, 2);
    ctx.fillRect(bx + bw - 5, by + 2, 3, 2);
    ctx.fillRect(bx + 2, by + bh - 4, 3, 2);
    ctx.fillRect(bx + bw - 5, by + bh - 4, 3, 2);

    // Faixa opcional de cabeçalho
    if (opts.headerH) {
      const hh = opts.headerH;
      ctx.fillStyle = opts.headerBg || '#3d2b24';
      ctx.fillRect(bx + 3, by + 3, bw - 6, hh);
      ctx.fillStyle = '#8c7d70';
      ctx.fillRect(bx + 3, by + 3 + hh, bw - 6, 1);
    }

    // Rabicho do balão de fala apontando para o personagem que está falando
    if (opts.tailX !== undefined) {
      const tx = clamp(R(opts.tailX), bx + 18, bx + bw - 18);
      const dir = opts.tailDir || 'up';
      if (dir === 'up') {
        for (let i = 0; i < 6; i++) {
          const hw = 5 - i;
          ctx.fillStyle = '#2c221e';
          ctx.fillRect(tx - hw - 1, by - i, hw * 2 + 3, 1);
          ctx.fillStyle = i < 2 ? '#f4eedf' : '#e8dfc9';
          ctx.fillRect(tx - hw, by - i + 1, hw * 2 + 1, 1);
        }
      } else if (dir === 'down') {
        for (let i = 0; i < 6; i++) {
          const hw = 5 - i;
          ctx.fillStyle = '#2c221e';
          ctx.fillRect(tx - hw - 1, by + bh - 1 + i, hw * 2 + 3, 1);
          ctx.fillStyle = i < 2 ? '#f4eedf' : '#e8dfc9';
          ctx.fillRect(tx - hw, by + bh - 2 + i, hw * 2 + 1, 1);
        }
      }
    }
  }


  // ============================================================================
  // 1. BANCO CENTRAL DE ANIMAÇÕES REUTILIZÁVEIS EM LOOP (SpriteBank)
  // Criado UMA ÚNICA VEZ e instanciado em todas as cutscenes e fases do jogo.
  // ============================================================================
  // ============================================================================
  // MATRIZ PIXEL ART OFICIAL 64x64 DO PROTAGONISTA
  // Cabelos castanho-escuro despenteados, olhos castanhos expressivos, capa e capuz
  // azul-marinho com bordado geométrico ciano luminoso na barra, mangas creme,
  // bolsa tiracolo de couro, cinto com fivela de cristal azul e botas de couro.
  // ============================================================================
  const PROTAG_PIXEL_PALETTE = {
    A: '#4e312b', B: '#060606', C: '#0e3e70', D: '#0f4477', E: '#e79b73', F: '#2f1b17', G: '#402723', H: '#060201',
    I: '#010001', J: '#073460', K: '#77422f', L: '#041d3d', M: '#1e0f0b', N: '#5a372e', O: '#643221', P: '#91482d',
    Q: '#042951', R: '#05172c', S: '#76edfa', T: '#f7e7c3', U: '#f9eed2', V: '#925b46', W: '#0a4f87', X: '#020915',
    Y: '#4b2519', Z: '#3e1b11', a: '#ca7352', b: '#d78763', c: '#ba6246', d: '#e2d0b1', e: '#29262a', f: '#d08f54',
    g: '#f6f6f5', h: '#ee9070', i: '#b4977a', j: '#4bb7e1', k: '#0d74af', l: '#a66a36', m: '#298fc4', n: '#6fcfe8',
    o: '#40d3f7', p: '#12a0e7', q: '#caae88', r: '#1e6897', s: '#423d3c', t: '#3688a6', u: '#1cb3ed', v: '#878b89',
    w: '#978065', x: '#587dab', y: '#35777f', z: '#1e384c', 0: '#61615e', 1: '#a0deee', 2: '#adadab', 3: '#979890',
    4: '#ccb1a7', 5: '#ddd9d9'
  };

  const PROTAG_PIXEL_ROWS = [
    '................................................................',
    '................................................................',
    '.............................BHIIB..............................',
    '.......................B.....BAAANBB............................',
    '......................BNH..BIIHAAAAAB..B........................',
    '......................BAAAFAAAAAAAGAAHGB........................',
    '.......................MAAAAAAAAAAAGAFAB........................',
    '......................BAAAAAAAGFGFFFGAAAH.......................',
    '.....................BVNAAAAAFAAAAAFGAAAAH......................',
    '..................BBIAVVAAAAFAAAAAAFAAAAVKB.....................',
    '..................BAAAAKVAAAFAAAAAAAAAAVVNM.....................',
    '...................FFAGANAVGKKAAAAAAAAVGAAB.....................',
    '...................BAAFAAAAFAKKKAAAGAANAGAAB....................',
    '..................BAAFAAAAAFAAAAAAAGAAAAFAAABB..................',
    '..................BNAFAAGAGMAAAAAAMFNAAAAAAAAB..................',
    '.................BGAFAAAGAGbFAAAFGbbMAGAAGAFH...................',
    '................BAAAFAAGAMGFHAAAMbFFFFGAAFAGs...................',
    '.................HFFMAAFMaEEEFNAMEEEEbGAAMGAH...................',
    '..................BGBNAMEAIHFEHAANFHIHNAAFGB....................',
    '..................BGOFNMKvYFFEEEaE5FF2KAGYGB....................',
    '.................HAMEPGMHgZIZEEEEEFIZgNAMEHFB...................',
    '..................BHEaMFEgOFOEEEEEOFOgKFabHIH...................',
    '....................KEcVEEgOEEEaEEVK4EVcbEB.....................',
    '.....................BEVEhhEEEEEEEEEhhVhEB......................',
    '......................BHIEEEEEPbcbEEEEIHB.......................',
    '.......................IJHEEEEEEEEEEEBJB........................',
    '......................BDRLIMEEEEEEEbIRLCH.......................',
    '......................BDCCJLIHPPPPIXQDCCI.......................',
    '.....................BDDCCCCCBaacKQCCCCCDB......................',
    '.....................BCCCCDCDDXaODDCCCJCDB......................',
    '......................BXLLLLLQJBLJLLLLQRB.......................',
    '......................HCCCLPKeyntVLQJDCCH.......................',
    '.....................MDDCCCRPPIkBRCCCCCCC.......................',
    '.....................XDCCCDCXOPYUCQRQDCCDH......................',
    '....................ICCCQRXQJIPPZJCCJMXCCCB.....................',
    '...................BDDRBTqRCCDIPPYCCCeTFBDDB....................',
    '...................BXMdTUqLCCWUBPPYCJBTUTHLX....................',
    '..................BQdTTidwCCCWUTHPPZCBTiUUdJB...................',
    '.................BCMTUUUTICCCWTqTBPPZQiUUUUsCB..................',
    '.................CDC0VTUdBRRLLfffQHPPZdUTKwCCC..................',
    '................BCCCBacViBOKKVxSWlOMPKFVcaHCCCB.................',
    '...............HCCCDZEEaRBOOKlmpWlOFOYPOEEZCCCCB................',
    '...............RCCCJEEEMXLRIXHlWfIMBOYPOMEECCCCR................',
    '..............BCCCCBEEEEBDCCCrFMBWQJYKOPHEEMCCCCB...............',
    '.............BWSCCDBEEcELCCCDJTtUWWJIKFfHEEMDCCSDB..............',
    '.............BnoSDCBEEcBCCCCu3UJTvWDIKKZMEEMDDSknB..............',
    '............ISCSDDWLIEEBJCDCuTTJTUkWBKOYOEBCjCCSDSB.............',
    '............BkSCCSSBLXBIJLLWWJCCDDQDJFOPPZBrpSDCSX..............',
    '.............BmSCJrLLLQBDDDLLDJQJCQQJIOOOHXJnCDSB...............',
    '..............BRS1JjjQWIDDDDDDQRQJDDDJIBLmzCWSSB................',
    '................BooBBjRWDDDDDDQRQDDDDDDRmBBSSpB.................',
    '.................IH..BIDDDDDDDJRRDDDDDDDB.BBIB..................',
    '......................BDCDDDDDDRRDDDDDDDB.......................',
    '......................BDJJDDCCJXRCDDDCQDB.......................',
    '.......................BJLDJJJX..LCQQCQB........................',
    '........................BNseLB....ILeeF.........................',
    '.......................BKKKKKOB..BKKKKKB........................',
    '.......................BFFFOOYB..HYANFMB........................',
    '.......................BYKOGGB....BFFKOB........................',
    '......................BNNNFAAB....BAAFNNH.......................',
    '.....................BNNNNANNB....BAANNNNB......................',
    '.....................BGGAAGMGB....BGMGGGGB......................',
    '......................BHIIIIB......BHIIHB.......................',
    '................................................................'
  ];

  function buildHiBitProtagonist(pose = 'idle0') {
    const W = 64, H = 64;
    const [c, x] = mk(W, H);
    c.hib = true;
    const put = (px, py, col) => {
      const ix = Math.round(px), iy = Math.round(py);
      if (ix >= 0 && iy >= 0 && ix < W && iy < H) {
        x.fillStyle = col;
        x.fillRect(ix, iy, 1, 1);
      }
    };

    // Pose horizontal caída no chão (abertura da Fase 1 antes de se levantar)
    if (pose === 'fallen') {
      for (let sy = 2; sy < 63; sy++) {
        const row = PROTAG_PIXEL_ROWS[sy];
        if (!row) continue;
        for (let sx = 12; sx < 52; sx++) {
          const ch = row[sx];
          if (!ch || ch === '.') continue;
          const col = PROTAG_PIXEL_PALETTE[ch];
          if (!col) continue;
          const dx = 9 + Math.round((sy - 2) * 0.76);
          const dy = 52 + Math.round((sx - 31) * 0.42);
          put(dx, dy, col);
        }
      }
      return c;
    }

    const isFall = pose === 'fall0' || pose === 'fall1';
    const isBlink = pose === 'idle2';
    const isTalk = pose === 'talk1';
    const isCeleb = pose === 'celeb1';
    const isShock = pose === 'shock0';
    const isKneel = pose === 'kneel';
    const bobY = (pose === 'idle1' || pose === 'walk1')
      ? 1
      : isCeleb
        ? -2
        : isKneel
          ? 4
          : 0;

    for (let sy = 0; sy < 64; sy++) {
      const row = PROTAG_PIXEL_ROWS[sy];
      if (!row) continue;
      for (let sx = 0; sx < 64; sx++) {
        const ch = row[sx];
        if (!ch || ch === '.') continue;
        const col = PROTAG_PIXEL_PALETTE[ch];
        if (!col) continue;

        const isLeftCloak = sx <= 19 && sy >= 33 && sy <= 51;
        const isRightCloak = sx >= 43 && sy >= 33 && sy <= 51;
        const isLeftArm = sx >= 20 && sx <= 24 && sy >= 35 && sy <= 47;
        const isRightArm = sx >= 38 && sx <= 42 && sy >= 35 && sy <= 47;
        const isLeftLeg = sy >= 51 && sx >= 21 && sx <= 30;
        const isRightLeg = sy >= 51 && sx >= 33 && sx <= 41;

        let dx = sx;
        let dy = sy + bobY;

        if (isKneel && (isLeftLeg || isRightLeg)) {
          dy = sy;
          if (sy >= 53 && sy <= 56) continue;
        } else if (pose === 'walk0') {
          if (isLeftLeg) { dx -= 1; dy -= 2; }
          else if (isRightLeg) { dx += 1; dy += 1; }
          else if (isLeftArm) { dy -= 1; }
          else if (isRightArm) { dy += 1; }
          else if (isLeftCloak) { dx -= 1; }
        } else if (pose === 'walk2') {
          if (isRightLeg) { dx += 1; dy -= 2; }
          else if (isLeftLeg) { dx -= 1; dy += 1; }
          else if (isRightArm) { dy -= 1; }
          else if (isLeftArm) { dy += 1; }
          else if (isRightCloak) { dx += 1; }
        } else if (pose === 'idle1') {
          if (isLeftLeg || isRightLeg) dy = sy;
          else if (isLeftCloak) dx -= 1;
          else if (isRightCloak) dx += 1;
        } else if (isTalk && isRightArm) {
          dy -= 1;
        } else if (isCeleb) {
          if (isLeftArm) { dx -= 1; dy -= 4; }
          else if (isRightArm) { dx += 1; dy -= 4; }
          else if (isLeftCloak) { dx -= 1; dy -= 2; }
          else if (isRightCloak) { dx += 1; dy -= 2; }
        } else if (isShock) {
          if (isLeftArm || isRightArm) dy -= 3;
          else if (isLeftCloak) { dx -= 1; dy -= 1; }
          else if (isRightCloak) { dx += 1; dy -= 1; }
        } else if (isFall) {
          const flutter = pose === 'fall0' ? -1 : 1;
          if (isLeftCloak) { dx -= 2; dy -= 4 + flutter; }
          else if (isRightCloak) { dx += 2; dy -= 4 - flutter; }
          else if (isLeftArm || isRightArm) { dy -= 4; }
          else if (isLeftLeg) { dy += flutter; }
          else if (isRightLeg) { dy -= flutter; }
        }

        put(dx, dy, col);
      }
    }

    // Piscar suave dos olhos (left eye: x 25..28, right eye: x 34..37, y 19..22)
    if (isBlink) {
      for (const ox of [25, 34]) {
        for (let i = 0; i < 4; i++) {
          put(ox + i, 19 + bobY, '#ca7352');
          put(ox + i, 20 + bobY, '#e79b73');
          put(ox + i, 21 + bobY, '#2f1b17');
        }
      }
    }

    // Expressão de susto/surpresa (olhos mais abertos com brilho branco)
    if (isShock || isFall) {
      put(26, 19 + bobY, '#f6f6f5');
      put(35, 19 + bobY, '#f6f6f5');
      put(26, 22 + bobY, '#f6f6f5');
      put(35, 22 + bobY, '#f6f6f5');
    }

    // Boca aberta ao falar, celebrar, cair ou levar susto
    if (isTalk || isCeleb || isShock || isFall) {
      for (let bx = 30; bx <= 32; bx++) {
        put(bx, 24 + bobY, '#3e1b11');
        put(bx, 25 + bobY, isShock || isFall ? '#1e0f0b' : '#ee9070');
      }
      if (isCeleb) {
        // Brilho na fivela de cristal azul do cinto ao celebrar
        put(31, 41 + bobY, '#ffffff');
      }
    }

    return c;
  }


  // ============================================================================
  // RETRATOS DE DIALOGO PROCEDURAIS ESTILO OWLBOY (fillOvalPainterly - TONS TERROSOS SUAVES)
  // Paleta quente e naturalista inspirada em Owlboy, sem contornos pretos duros,
  // com sombreamento volumetrico eliptico suave e dithering Bayer.
  // ============================================================================
  function fillOvalPainterly(ctx, cx, cy, rx, ry, pal) {
    const [cEdge, cDark, cMid, cLight, cHi] = pal;
    const x0 = Math.floor(cx - rx - 1), x1 = Math.ceil(cx + rx + 1);
    const y0 = Math.floor(cy - ry - 1), y1 = Math.ceil(cy + ry + 1);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const nx = (x - cx) / rx, ny = (y - cy) / ry;
        const d = nx * nx + ny * ny;
        if (d > 1.0) continue;
        // Luz vinda da esquerda-topo (estilo Owlboy)
        const light = -nx * 0.55 - ny * 0.45 + (bay(x, y) / 16 - 0.5) * 0.22;
        let col = cMid;
        if (d > 0.84) col = nx < -0.2 && ny < -0.2 ? cMid : cEdge;
        else if (light > 0.36) col = cHi || cLight;
        else if (light > 0.10) col = cLight;
        else if (light < -0.22) col = cDark;
        ctx.fillStyle = col;
        ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
    }
  }

  function buildProtagonistPortrait(mouthOpen, blink) {
    const [c, x] = mk(28, 28);
    c._isDiamondBust = true;
    const put = (px, py, col) => {
      if (px >= 0 && py >= 0 && px < 28 && py < 28) {
        x.fillStyle = col;
        x.fillRect(px, py, 1, 1);
      }
    };
    // Recorta o busto real 28x28 do Protagonista (sx = 17..44, sy = 6..33)
    for (let py = 0; py < 28; py++) {
      const sy = py + 6;
      const row = PROTAG_PIXEL_ROWS[sy] || '';
      for (let px = 0; px < 28; px++) {
        if (Math.abs(px - 13.5) + Math.abs(py - 13.5) > 20.5) continue;
        const sx = px + 17;
        const ch = row[sx];
        if (!ch || ch === '.') continue;
        const col = PROTAG_PIXEL_PALETTE[ch];
        if (col) put(px, py, col);
      }
    }
    // Piscar suave dos olhos (left eye: px 8..11, right eye: px 17..20, py 13..16)
    if (blink) {
      for (const ox of [8, 17]) {
        for (let dx = 0; dx < 4; dx++) {
          put(ox + dx, 13, '#ca7352');
          put(ox + dx, 14, '#e79b73');
          put(ox + dx, 15, '#2f1b17');
        }
      }
    }
    // Animação da boca ao falar
    if (mouthOpen > 0) {
      for (let px = 13; px <= 15; px++) {
        put(px, 18, '#3e1b11');
        put(px, 19, mouthOpen === 1 ? '#ee9070' : '#ca7352');
      }
    }
    return c;
  }

  // ============================================================================
  // MATRIZ PIXEL ART OFICIAL 64x64 DA RAINHA DA ORDEM / FADA DAS GEMAS
  // Pele marrom quente, cabelos longos castanho-escuro com flor cristalina azul/dourada,
  // asas de borboleta translúcidas em violeta/lilás/ciano, vestido de pétalas azuis
  // com cinto dourado e gema central.
  // ============================================================================
  const ORDEM_FAIRY_PALETTE = {
    A: '#150a28', B: '#b76039', C: '#f1fbfa', D: '#c8723c', E: '#889ce9', F: '#571526', G: '#77eef8', H: '#8e3730',
    I: '#75262e', J: '#95ecf6', K: '#cbf7f9', L: '#a34935', M: '#84d8f7', N: '#261635', O: '#391d3b', P: '#64e1f5',
    Q: '#6782d6', R: '#4ba1e4', S: '#5e44c0', T: '#b7a8f1', U: '#b8bdf6', V: '#e2adf6', W: '#122b7d', X: '#6c9fd9',
    Y: '#b9d2f9', Z: '#86c3ef', a: '#34294a', b: '#5b373d', c: '#6d69d8', d: '#47132a', e: '#4ec0ee', f: '#764a3d',
    g: '#182560', h: '#987eec', i: '#3765cf', j: '#143f90', k: '#b095ef', l: '#2c7cc8', m: '#b7e5fa', n: '#cdfadd',
    o: '#4a2c41', p: '#383b68', q: '#e6e2f6', r: '#455390', s: '#2942b3', t: '#445776', u: '#581941', v: '#f09732',
    w: '#f99475', x: '#f7d75b', y: '#170714', z: '#646165', 0: '#5a9caa', 1: '#b7b3b9', 2: '#fbf293', 3: '#ac9374'
  };

  const ORDEM_FAIRY_ROWS = [
    '................................................................',
    '................................................................',
    '................................................................',
    '................................................................',
    '................................................................',
    '................................................................',
    '................................................................',
    '................................................................',
    '................................................................',
    '.....YKKCZ..................pONNAAA...................XCCCK.....',
    '.....YXZJKCZ..............rbbboOAAaaCe.CP...........XCCJZXK.....',
    '.....YXJCJUCCX...........rfffOOAANotGCGKC.........QCCUJCJXK.....',
    '......mXJJZETCCQ........rfBbbbbOONbtResPP........MCqEZJJXm......',
    '......mXXEVKTEqCE......rbbDffbbbOOpCGi2xPCK....QCCTEVVEXXm......',
    '......EMEEVVqTEkCE....raObfDffbAAAtrRlxCRR....ECkTTqVVEEmE......',
    '......EckCVVVVCTECE...pOOoffDbAHHIazGiDviJ...ECkTCVVVVCEQE......',
    '.......TQccqkVTUTECQ..pNoNObfAHDDLAzCPiiPC..QCETUTVVCcQQU.......',
    '.......kQRhETCTUCCECQ.ANAAOOAHDDDDHotgGGg..QCECCUTnZZheQU.......',
    '........TShkUUQCnJJXK.AAAoOAHDDDDDLAaogKg.QKXJJnCQUTThcU........',
    '........cTSkUUYQnJKGXAOooAAddbDDDbddAaagaAKXJKJnQUUTTSTc........',
    '........cmYSVVnQnJKGXAAAAFdAIHBBBLIAIAAAAAXGJKJnQnVVSYmc........',
    '.........hSSEZMMRnGGPadBdAyqAHBBBIqAANdBNNPGJGnRZUUESSk.........',
    '.........hSGhEMMMRKGPadHdF1yyBBBBByd1FOHNNPGGKRJJmYkGSk.........',
    '.........YSShUXJGGeKPpNLIIDfDBBBBBfDBFILNaPGKeJJJZYkSSm.........',
    '..........kSSSYJKKeeraAADFwwDBBvBBDwwFDNNareeJKKJYSSST..........',
    '..........YEYEEEMPPpaNOAAALBBBBBBBBBHAAAopapGPMMEEQYEm..........',
    '...........YShEZPPOrPNbOAAAHBBBBBBBHAAAoopGraGGMZEkSY...........',
    '...........YccEZPPOpZobOOAAAFHBBBHFAAAOobtRaaGGMZEccY...........',
    '............mEiEZMMNffbAOAAAAAdddAAAAANAfftaPMMERiEK............',
    '.............mEQZZabDfAOAAIIIIIIIIIIFAAaABftpZZRQXK.............',
    '..............mKRRObfANAAHDDBLLHLLBBDIAANAfbNRRmKm..............',
    '................KKNbOANAFDDGCBBDDDCPDBdANAObNKK.................',
    '..................NOOAaALDQGCCDD3CCGiDHAaAOOA...................',
    '..................AOOAAOBHjGKPeDMGKeWBHAANOaN...................',
    '................XCJAOaAFBHjleGeleGPlgBBdNaaAJCX.................',
    '...............XCZGGaNFLBHgjelllllljNHBLNaNGGZCX................',
    '..............ECEMGGpoLBHFAWsijZjisWNFLDHppGGMECX...............',
    '..............CQZMRKPLDBINAHggxCDggHANHDDIPKRMMhCX..............',
    '.............EkVVXMegBDLFMgHD2vKvxDHgMILDIPPMQVVVZ..............',
    '.............TcQEMZRLBLFMWssggDevggWsWMIBDFPXMEccT..............',
    '.............TSVEMLLLBIMWiRWlsWDWsiWRiWMILBuQMEVST..............',
    '.............ThSdDBDLIMWQPiieisWsieicPQWMIBDDQSShT..............',
    '..............TFDdFDIEWEeQjeejSQSjPRjEPEWEBIFBIST...............',
    '..............kFFdLIEjUUGsRGPjERQjPGRiZUYjILFFFSk...............',
    '..............YkShchlKCUQWJGRiJRZlRGJWhUCKhchSSkY...............',
    '............QCEUkTcclChYWYnJjRYMUijJnYWYhClcckVUEC..............',
    '...........lCJc..mTYPVUWWCnJjGKMUXjJnCWjUVPYTY..cJC.............',
    '...........qJEc.....WWjRWCRPFGKUUXFeRCWRWWj.....cEMC............',
    '...........qEU........QRWGeFFhqUCcIdeGWRQ........YhC............',
    '...........00.........RllWFHHNVqEFHHFglle.........XZ............',
    '..........................FLLIgqgHLHF...........................',
    '..........................dBDLdgFLLLr...........................',
    '..........................FHDLd.dLDHu...........................',
    '..........................FHHHF.dIIIu...........................',
    '..........................FLLLF.dIIIu...........................',
    '..........................FLBBF.dIII............................',
    '...........................LBBF.FIId............................',
    '...........................FBBu.FHHF............................',
    '...........................FBBu.FHHF............................',
    '...........................FDDH.FIIF............................',
    '...........................FDDL.FHHF............................',
    '...........................FDDBF................................',
    '...........................FHHHF................................',
    '................................................................'
  ];

  function buildMysterySilhouettePortrait(pulseStep) {
    const [c, x] = mk(28, 28);
    c._isDiamondBust = true;
    const put = (px, py, col) => {
      if (px >= 0 && py >= 0 && px < 28 && py < 28) {
        x.fillStyle = col;
        x.fillRect(px, py, 1, 1);
      }
    };
    if (pulseStep > 0) {
      drawRing(x, 14, 14, 10 + pulseStep, pulseStep === 1 ? '#77eef8' : '#f7d75b');
    }
    for (let py = 0; py < 28; py++) {
      const sy = py + 10;
      const row = ORDEM_FAIRY_ROWS[sy] || '';
      for (let px = 0; px < 28; px++) {
        if (py >= 19 && (px <= 3 || px >= 24)) continue;
        if (Math.abs(px - 13.5) + Math.abs(py - 13.5) > 20.5) continue;
        const sx = px + 18;
        const ch = row[sx];
        if (!ch || ch === '.') continue;
        const nL = sx > 18 ? row[sx - 1] : '.';
        const nR = sx < 45 ? row[sx + 1] : '.';
        const nU = sy > 10 ? (ORDEM_FAIRY_ROWS[sy - 1] || '')[sx] : '.';
        const nD = sy < 37 ? (ORDEM_FAIRY_ROWS[sy + 1] || '')[sx] : '.';
        const isEdge = nL === '.' || nR === '.' || nU === '.' || nD === '.';
        const isFlower = sx >= 35 && sx <= 42 && sy >= 10 && sy <= 18 && 'CGJKMPQRceijrstvx2'.includes(ch);
        const isWing = sx <= 21 || sx >= 42;
        if (isFlower) {
          put(px, py, 'vx2'.includes(ch) ? (pulseStep ? '#f7d75b' : '#cca252') : (pulseStep ? '#77eef8' : '#527394'));
        } else if (isEdge) {
          put(px, py, pulseStep ? '#95ecf6' : '#527394');
        } else if (isWing) {
          put(px, py, ((px + py) & 1) === 0 ? '#283647' : '#1c2533');
        } else {
          put(px, py, '#161d29');
        }
      }
    }
    if (pulseStep > 0) {
      put(13, 15, '#f1fbfa');
      put(14, 15, '#f1fbfa');
    }
    return c;
  }

  function buildOrdemPortrait(mouthOpen, blink) {
    const [c, x] = mk(28, 28);
    c._isDiamondBust = true;
    const put = (px, py, col) => {
      if (px >= 0 && py >= 0 && px < 28 && py < 28) {
        x.fillStyle = col;
        x.fillRect(px, py, 1, 1);
      }
    };
    for (let py = 0; py < 28; py++) {
      const sy = py + 10;
      const row = ORDEM_FAIRY_ROWS[sy] || '';
      for (let px = 0; px < 28; px++) {
        if (py >= 19 && (px <= 3 || px >= 24)) continue;
        if (Math.abs(px - 13.5) + Math.abs(py - 13.5) > 20.5) continue;
        const sx = px + 18;
        const ch = row[sx];
        if (!ch || ch === '.') continue;
        const col = ORDEM_FAIRY_PALETTE[ch];
        if (col) put(px, py, col);
      }
    }
    if (blink) {
      for (const ox of [8, 16]) {
        for (let dx = 0; dx < 3; dx++) {
          put(ox + dx, 10, '#8e3730');
          put(ox + dx, 11, '#b76039');
          put(ox + dx, 12, '#150a28');
        }
      }
    }
    if (mouthOpen > 0) {
      put(12, 15, '#47132a');
      put(13, 15, '#47132a');
      put(14, 15, '#47132a');
      put(13, 16, '#f99475');
      put(14, 16, '#f99475');
      if (mouthOpen > 1) {
        put(12, 16, '#75262e');
        put(15, 15, '#47132a');
        put(15, 16, '#75262e');
      }
    }
    return c;
  }

  function buildGuardianPortrait(spec, mouthOpen, blink) {
    const [c, x] = mk(28, 28);
    c._isDiamondBust = true;
    const put = (px, py, col) => {
      if (px >= 0 && py >= 0 && px < 28 && py < 28) {
        x.fillStyle = col;
        x.fillRect(px, py, 1, 1);
      }
    };
    fillOvalPainterly(x, 14, 13.5, 8.8, 9.8, spec.hairRamp);
    fillOvalPainterly(x, 14, 15.2, 6.8, 7.0, spec.skinRamp);

    // Diadema temático da Guardiã (folhas/esmeralda, onda/turmalina ou flor/opala)
    for (let i = 9; i <= 18; i++) {
      put(i, 6, (i === 13 || i === 14) ? spec.gemHi : spec.crownMid);
    }
    put(13, 5, '#ffffff');
    put(14, 5, spec.gemHi);
    put(10, 5, spec.crownAccent);
    put(17, 5, spec.crownAccent);

    if (blink) {
      for (let dx = 0; dx < 3; dx++) {
        put(9 + dx, 14, spec.hairRamp[1]);
        put(16 + dx, 14, spec.hairRamp[1]);
      }
    } else {
      for (const ox of [9, 16]) {
        for (let dy = 0; dy < 3; dy++) {
          for (let dx = 0; dx < 3; dx++) {
            put(ox + dx, 13 + dy, dx === 0 ? '#f5efe2' : '#241410');
          }
        }
        put(ox + 1, 13, '#ffffff');
        put(ox + 2, 15, spec.eyeGlint);
      }
    }

    if (mouthOpen === 0) {
      put(12, 19, spec.lipClosed);
      put(13, 19, spec.lipClosed);
      put(14, 19, spec.lipClosed);
    } else {
      const mh = mouthOpen > 1 ? 2 : 1;
      for (let dx = 12; dx <= 15; dx++) {
        put(dx, 18, '#54201e');
        if (mh > 1) put(dx, 19, '#cf655d');
      }
    }

    for (let i = 8; i <= 19; i++) put(i, 22, i < 14 ? spec.collarHi : spec.collarLo);
    for (let i = 9; i <= 18; i++) put(i, 23, i < 14 ? '#f2cc6b' : '#b88d3d');
    for (let i = 11; i <= 16; i++) put(i, 24, spec.collarBase);
    return c;
  }

  function makePortraitSet(builderFn) {
    return {
      idle: [
        builderFn(0, false),
        builderFn(0, false),
        builderFn(0, false),
        builderFn(0, true)
      ],
      talk: [
        builderFn(0, false),
        builderFn(1, false),
        builderFn(2, false),
        builderFn(1, false)
      ]
    };
  }

  // Notas musicais em pixel art para o `music_notes_loop`
  const NOTE_SINGLE = fromMap([
    '..ooo.',
    '..oCBo',
    '..oCo.',
    '..oCo.',
    'oooCo.',
    'oWCCo.',
    'oCCoo.',
    '.ooo..'
  ], { o: '#140d2e', W: '#ffffff', C: '#9ef0ff', B: '#3fc6f0' });

  const NOTE_DOUBLE = fromMap([
    '..oooooo.',
    '..oMMMMBo',
    '..oMo..oM',
    '..oMo..oM',
    'oooMo.ooM',
    'oWMMo.oWM',
    'oMMoo.oMM',
    '.ooo...oo'
  ], { o: '#140d2e', W: '#ffffff', M: '#ffc6f2', B: '#ff72e0' });

  // ============================================================================
  // RAINHA DA "ORDEM" / FADA LIBERTA — SPRITE HI-BIT 64x64 PIXELS (TRUE PIXEL ART)
  // Fada com pele marrom quente, cabelos longos castanho-escuro com flor cristalina
  // azul e miolo dourado, grandes asas de borboleta translúcidas em violeta/lilás/ciano,
  // vestido de pétalas azuis e cinto dourado com gema central.
  // ============================================================================
  function buildHiBitOrdem(pose = 'idle0') {
    const W = 64, H = 64;
    const [c, x] = mk(W, H);
    c.hib = true;
    const put = (px, py, col) => {
      const ix = Math.round(px), iy = Math.round(py);
      if (ix >= 0 && iy >= 0 && ix < W && iy < H) {
        x.fillStyle = col;
        x.fillRect(ix, iy, 1, 1);
      }
    };

    const isSil = pose === 'sil0' || pose === 'sil1' || pose === 'sil2';
    const isBlink = pose === 'idle2';
    const isSing = pose === 'sing1' || pose === 'sing2';
    const isCeleb = pose === 'celeb0';
    const bobY = (pose === 'idle1' || pose === 'walk1' || pose === 'sing1' || pose === 'sil2')
      ? -1
      : (pose === 'walk2' || pose === 'celeb0')
        ? -2
        : 0;
    const wingLift = (pose === 'idle1' || pose === 'walk1' || pose === 'sil1')
      ? 1
      : (pose === 'walk2' || pose === 'sing1' || pose === 'celeb0' || pose === 'sil2')
        ? 2
        : 0;
    const wingPinch = (pose === 'idle1' || pose === 'walk1' || pose === 'sing2') ? 1 : 0;

    const SIL_CORE = '#131824';
    const SIL_MID = '#202b3d';
    const SIL_RIM = pose === 'sil2' ? '#f7d75b' : (pose === 'sil1' ? '#95ecf6' : '#65b8d9');

    for (let sy = 0; sy < 64; sy++) {
      const row = ORDEM_FAIRY_ROWS[sy];
      if (!row) continue;
      for (let sx = 0; sx < 64; sx++) {
        const ch = row[sx];
        if (!ch || ch === '.') continue;

        const isLeftWing = sx <= 19 || (sx <= 21 && sy <= 31);
        const isRightWing = sx >= 44 || (sx >= 42 && sy >= 19 && sy <= 31);
        const isWing = isLeftWing || isRightWing;
        const isLeftLeg = sy >= 50 && sx >= 24 && sx <= 31;
        const isRightLeg = sy >= 50 && sx >= 32 && sx <= 39;

        let dx = sx;
        let dy = sy + bobY;

        if (isWing) {
          const dist = Math.max(0, Math.abs(sx - 31.5) - 10);
          dy -= Math.round((wingLift * dist) / 14);
          if (wingPinch && dist > 6) {
            dx += isLeftWing ? 1 : -1;
          }
        } else if (pose === 'walk1' && isLeftLeg) {
          dy -= 1;
        } else if (pose === 'walk2' && isRightLeg) {
          dy -= 1;
        }

        if (isSil) {
          const nL = sx > 0 ? row[sx - 1] : '.';
          const nR = sx < 63 ? row[sx + 1] : '.';
          const nU = sy > 0 ? ORDEM_FAIRY_ROWS[sy - 1][sx] : '.';
          const nD = sy < 63 ? ORDEM_FAIRY_ROWS[sy + 1][sx] : '.';
          const isEdge = nL === '.' || nR === '.' || nU === '.' || nD === '.';
          const isFlowerOrGem =
            (sx >= 35 && sx <= 42 && sy >= 10 && sy <= 18 && 'CGJKMPQRceijrstvx2'.includes(ch)) ||
            (sx >= 29 && sx <= 34 && sy >= 37 && sy <= 39 && 'vx2CDGK'.includes(ch));
          if (isEdge) {
            put(dx, dy, SIL_RIM);
          } else if (isFlowerOrGem) {
            put(dx, dy, 'vx2'.includes(ch) ? '#f7d75b' : '#77eef8');
          } else if (isWing && 'CGJKMPUVq'.includes(ch)) {
            put(dx, dy, SIL_MID);
          } else {
            put(dx, dy, SIL_CORE);
          }
        } else {
          const col = ORDEM_FAIRY_PALETTE[ch];
          if (col) put(dx, dy, col);
        }
      }
    }

    if (!isSil) {
      // Piscar suave dos olhos no quadro idle2
      if (isBlink) {
        for (const ox of [26, 34]) {
          for (let i = 0; i < 3; i++) {
            put(ox + i, 20 + bobY, '#8e3730');
            put(ox + i, 21 + bobY, '#b76039');
            put(ox + i, 22 + bobY, '#150a28');
          }
        }
      }

      // Boca expressiva ao cantar ou celebrar + brilho na flor do cabelo e no cinto dourado
      if (isSing || isCeleb) {
        put(30, 25 + bobY, '#75262e');
        put(31, 25 + bobY, '#47132a');
        put(32, 25 + bobY, '#47132a');
        put(33, 25 + bobY, '#75262e');
        put(31, 26 + bobY, '#f99475');
        put(32, 26 + bobY, '#f99475');
        // Brilho intenso na flor azul/dourada do cabelo e na gema central do cinto
        put(38, 13 + bobY, '#ffffff');
        put(31, 38 + bobY, '#ffffff');
      }

      if (isCeleb) {
        drawStar(x, 8, 12 + bobY, 2, '#ffffff', '#77eef8');
        drawStar(x, 55, 12 + bobY, 2, '#ffffff', '#e2adf6');
        drawStar(x, 11, 44 + bobY, 2, '#ffffff', '#f7d75b');
        drawStar(x, 52, 44 + bobY, 2, '#ffffff', '#77eef8');
      }
    }

    return c;
  }

  // ============================================================================
  // ANIMAIS DE PEDRA COM MUSGO E CRISTAIS LUMINOSOS — HI-BIT 38x36 PIXELS (ESTILO OWLBOY)
  // Criaturas rochosas esculpidas em tons terrosos (#262020, #3b3332, #524846, #6e635f)
  // com musgo vivo (#367030, #539e43, #7ec456) e veios cristalinos suaves.
  // ============================================================================
  function buildHiBitStoneAnimal(neonHi, neonMid, isSing = false) {
    const W = 38, H = 36;
    const [c, x] = mk(W, H);
    c.hib = true;
    const put = (px, py, col) => {
      const ix = Math.round(px), iy = Math.round(py);
      if (ix >= 0 && iy >= 0 && ix < W && iy < H) {
        x.fillStyle = col;
        x.fillRect(ix, iy, 1, 1);
      }
    };
    const fillEll = (cx, cy, rx, ry, fn) => {
      for (let py = Math.floor(cy - ry - 1); py <= Math.ceil(cy + ry + 1); py++) {
        for (let px = Math.floor(cx - rx - 1); px <= Math.ceil(cx + rx + 1); px++) {
          const dx = (px - cx) / rx, dy = (py - cy) / ry;
          const d = dx * dx + dy * dy;
          if (d <= 1.0) {
            const col = fn(px, py, dx, dy, d);
            if (col) put(px, py, col);
          }
        }
      }
    };

    const ROCK_0 = '#262020', ROCK_1 = '#3b3332', ROCK_2 = '#524846', ROCK_3 = '#6e635f';
    const MOSS_0 = '#367030', MOSS_1 = '#539e43', MOSS_2 = '#7ec456';

    // Cristais nas costas do guardião de pedra
    for (const [cx, cy, h] of [[13, 9, 8], [19, 7, 10], [25, 10, 7]]) {
      for (let py = cy - h; py <= cy; py++) {
        const w = Math.max(1, Math.round((1 - (cy - py) / h) * 3));
        for (let px = cx - w; px <= cx + w; px++) {
          put(px, py, px < cx ? '#ffffff' : (px === cx ? neonHi : neonMid));
        }
      }
    }

    // Corpo rochoso esculpido (guardião coruja/golem de pedra estilo Owlboy)
    fillEll(19, 22, 13, 10, (px, py, dx, dy, d) => {
      if (d > 0.85) return ROCK_0;
      if (dy < -0.55) {
        return ((px + py) & 1) === 0 ? MOSS_2 : (dy < -0.7 ? MOSS_1 : MOSS_0);
      }
      if (dx + dy < -0.2) return ROCK_3;
      if (dx + dy > 0.35) return ROCK_1;
      return ROCK_2;
    });

    // Patas de pedra na base
    fillEll(13, 32, 4, 3, (px, py, dx, dy) => dy < 0 ? ROCK_2 : ROCK_0);
    fillEll(25, 32, 4, 3, (px, py, dx, dy) => dy < 0 ? ROCK_2 : ROCK_0);

    // Olhos minerais luminosos e boca cantando
    for (const ox of [15, 23]) {
      put(ox, 19, neonHi);
      put(ox + 1, 19, '#ffffff');
      put(ox, 20, neonMid);
      put(ox + 1, 20, neonHi);
    }
    if (isSing) {
      for (let py = 23; py <= 26; py++) {
        for (let px = 17; px <= 21; px++) {
          put(px, py, py === 23 ? '#ffffff' : neonHi);
        }
      }
    } else {
      for (let px = 17; px <= 21; px++) put(px, 24, ROCK_0);
    }

    return c;
  }

  function makeStoneNeonAnimal(neonHi, neonMid) {
    const idle0 = buildHiBitStoneAnimal(neonHi, neonMid, false);
    const sing0 = buildHiBitStoneAnimal(neonHi, neonMid, true);
    return {
      idle: [idle0],
      sing: [sing0, idle0]
    };
  }

  function buildHiBitGuardian(spec, pose = 'idle0') {
    const W = 48, H = 68;
    const [c, x] = mk(W, H);
    c.hib = true;
    const put = (px, py, col) => {
      const ix = Math.round(px), iy = Math.round(py);
      if (ix >= 0 && iy >= 0 && ix < W && iy < H) {
        x.fillStyle = col;
        x.fillRect(ix, iy, 1, 1);
      }
    };
    const fillEll = (cx, cy, rx, ry, fn) => {
      for (let py = Math.floor(cy - ry - 1); py <= Math.ceil(cy + ry + 1); py++) {
        for (let px = Math.floor(cx - rx - 1); px <= Math.ceil(cx + rx + 1); px++) {
          const dx = (px - cx) / rx, dy = (py - cy) / ry;
          const d = dx * dx + dy * dy;
          if (d <= 1.0) {
            const col = fn(px, py, dx, dy, d);
            if (col) put(px, py, col);
          }
        }
      }
    };

    const isSil = pose === 'sil0' || pose === 'sil1' || pose === 'sil2';
    const capeLift = (pose === 'sing1' || pose === 'celeb0' || pose === 'sil1' || pose === 'sil2') ? -3 : 0;
    const capeSpread = (pose === 'sil2' || pose === 'celeb0') ? 2 : 0;
    const bobY = (pose === 'walk1' || pose === 'sing1' || pose === 'sil2') ? -1 : 0;
    const silRim = pose === 'sil2' ? '#f2cc6b' : (pose === 'sil1' ? spec.silRimHi : spec.silRim);

    // 1. Manto / Xale pictórico temático em camadas suaves
    for (const side of [-1, 1]) {
      for (let layer = 0; layer < 3; layer++) {
        const wy = 27 + layer * 6 + capeLift + bobY;
        const wx = 24 + side * (10 + capeSpread + layer * 2);
        fillEll(wx, wy, 8.5 - layer, 13.5 - layer * 2, (px, py, dx, dy, d) => {
          if (isSil) return d > 0.78 ? silRim : (d > 0.55 ? spec.silMid : spec.silCore);
          if (d > 0.84) return spec.cape[0];
          const weave = ((px + py) & 1) === 0;
          if (dy < -0.25) return weave ? spec.cape[3] : spec.cape[2];
          return weave ? spec.cape[2] : spec.cape[1];
        });
      }
    }

    // 2. Túnica longa esculpida até os pés
    for (let py = 27 + bobY; py <= 63 + bobY; py++) {
      const t = (py - (27 + bobY)) / 36;
      const halfW = Math.round(7 + t * 8.5);
      for (let px = 24 - halfW; px <= 24 + halfW; px++) {
        const dx = (px - 24) / Math.max(1, halfW);
        if (isSil) {
          put(px, py, Math.abs(dx) > 0.82 || py >= 62 + bobY ? silRim : spec.silCore);
        } else {
          let col = spec.robe[1];
          if (Math.abs(dx) > 0.84 || py === 63 + bobY) col = spec.robe[0];
          else if (py >= 60 + bobY) col = spec.sash[1];
          else if (Math.abs(dx) < 0.28) col = Math.abs(dx) < 0.14 ? spec.sash[2] : spec.sash[1];
          else if (dx < -0.3) col = spec.robe[2];
          else if (dx > 0.45) col = spec.robe[0];
          put(px, py, col);
        }
      }
    }

    // 3. Cabelos longos esculpidos
    fillEll(24, 21 + bobY, 11, 12.2, (px, py, dx, dy, d) => {
      if (isSil) return d > 0.82 ? silRim : spec.silCore;
      return d > 0.82 ? spec.hair[0] : (dx < 0 ? spec.hair[2] : spec.hair[1]);
    });

    // 4. Braços e instrumento musical regional ao cantar/celebrar
    const armUp = (pose === 'sing1' || pose === 'celeb0' || pose === 'sil2');
    for (const side of [-1, 1]) {
      const ax = 24 + side * (armUp ? 12.5 : 9);
      const ay = (armUp ? 24 : 32) + bobY;
      fillEll(ax, ay, 3.2, 6, (px, py, dx, dy, d) => {
        if (isSil) return d > 0.75 ? silRim : spec.silCore;
        return dy > 0.4 ? spec.skin[1] : (d > 0.8 ? spec.robe[0] : spec.robe[2]);
      });
    }

    if (!isSil && (pose === 'sing1' || pose === 'celeb0')) {
      if (spec.instrument === 'maraca') {
        fillEll(37, 19 + bobY, 3.2, 3.8, (px, py, dx, dy) => (dx + dy < 0 ? '#f2cc6b' : '#539e43'));
        put(37, 23 + bobY, '#6e4531');
        put(37, 24 + bobY, '#6e4531');
      } else if (spec.instrument === 'flute') {
        for (let fx = 26; fx <= 37; fx++) {
          put(fx, 21 + bobY, fx % 3 === 0 ? '#ffffff' : '#9be8f0');
          put(fx, 22 + bobY, '#367588');
        }
      } else if (spec.instrument === 'rabeca') {
        fillEll(14, 24 + bobY, 3.5, 4.8, (px, py, dx) => (dx < 0 ? '#d98a4e' : '#8c4427'));
        for (let bx = 11; bx <= 20; bx++) put(bx, 22 + bobY, '#f7e2b8');
      }
    }

    // 5. Rosto expressivo Hi-Bit
    const headY = 16 + bobY;
    fillEll(24, headY, 7.5, 8.5, (px, py, dx, dy, d) => {
      if (isSil) return d > 0.8 ? silRim : spec.silCore;
      if (d > 0.85) return spec.skin[0];
      if (py < headY - 2) return dx < 0 ? spec.hair[2] : spec.hair[1];
      return (dx > 0.35 || dy > 0.45) ? spec.skin[1] : spec.skin[2];
    });

    if (!isSil) {
      for (const ox of [21, 27]) {
        for (let dy = -1; dy <= 1; dy++) {
          put(ox, headY + dy, '#1c1210');
          put(ox + 1, headY + dy, '#1c1210');
        }
        put(ox, headY - 1, '#ffffff');
        put(ox + 1, headY + 1, spec.eyeGlint);
      }
      if (pose === 'sing1' || pose === 'celeb0') {
        for (let dx = -2; dx <= 2; dx++) {
          put(24 + dx, headY + 4, '#4a1c24');
          put(24 + dx, headY + 5, '#d96b7d');
        }
      } else {
        put(23, headY + 4, '#6e352c');
        put(24, headY + 4, '#6e352c');
        put(25, headY + 4, '#6e352c');
      }
    }

    // 6. Diadema/Coroa com a Gema Primordial da Guardiã
    for (let dx = -6; dx <= 6; dx++) {
      const cy = headY - 7;
      const spike = (dx === -5 || dx === 0 || dx === 5) ? 3 : ((dx === -2 || dx === 2) ? 1 : 0);
      for (let s = 0; s <= spike; s++) {
        put(24 + dx, cy - s, isSil ? silRim : (s === spike ? '#ffffff' : (Math.abs(dx) <= 1 ? spec.gemHi : spec.crownLit)));
      }
      put(24 + dx, cy + 1, isSil ? spec.silMid : spec.crownDark);
    }

    return c;
  }

  function makeGuardianActor(spec) {
    const sil0 = buildHiBitGuardian(spec, 'sil0');
    const sil1 = buildHiBitGuardian(spec, 'sil1');
    const sil2 = buildHiBitGuardian(spec, 'sil2');
    const idle0 = buildHiBitGuardian(spec, 'idle0');
    const walk1 = buildHiBitGuardian(spec, 'walk1');
    const sing1 = buildHiBitGuardian(spec, 'sing1');
    const celeb0 = buildHiBitGuardian(spec, 'celeb0');
    return {
      back_silhouette: [sil0, sil1, sil2, sil1],
      idle: [idle0, walk1],
      walk: [idle0, walk1],
      sing: [idle0, sing1],
      celebrate: [celeb0, idle0]
    };
  }

  const ARACI_SPEC = {
    instrument: 'maraca',
    silCore: '#101c15', silMid: '#1d3326', silRim: '#68bd59', silRimHi: '#a5e06c',
    cape: ['#1d4224', '#316938', '#539e43', '#8ed46a'],
    robe: ['#36261e', '#523b2e', '#735442'],
    sash: ['#427834', '#7ec456', '#f2cc6b'],
    hair: ['#241712', '#3d271e', '#5e3d2f'],
    skin: ['#6e432c', '#945d3f', '#ba7956'],
    eyeGlint: '#8ed46a',
    gemHi: '#7ef08b',
    crownLit: '#d9be62',
    crownDark: '#8c6d2b',
    hairRamp: ['#1f1410', '#36221a', '#523529', '#6e4939', '#8c5f4b'],
    skinRamp: ['#543120', '#73462f', '#965f42', '#b87a58', '#d49877'],
    crownMid: '#c9a649',
    crownAccent: '#7ec456',
    lipClosed: '#6e3d2c',
    collarHi: '#539e43',
    collarLo: '#2f6328',
    collarBase: '#1d3d19'
  };

  const IRECE_SPEC = {
    instrument: 'flute',
    silCore: '#0f1a26', silMid: '#1b3045', silRim: '#4da6b8', silRimHi: '#9ef0ff',
    cape: ['#1b4152', '#2c6880', '#4da6b8', '#9be8f0'],
    robe: ['#203047', '#334c6e', '#4f739e'],
    sash: ['#437794', '#84bdd1', '#e8faff'],
    hair: ['#161a29', '#273047', '#415073'],
    skin: ['#704631', '#966146', '#bd7f5e'],
    eyeGlint: '#8cebf5',
    gemHi: '#7af7f0',
    crownLit: '#cbe8f2',
    crownDark: '#4f7c8f',
    hairRamp: ['#141826', '#232b42', '#384566', '#50618a', '#6e82ab'],
    skinRamp: ['#573524', '#754933', '#996449', '#bd8162', '#d9a182'],
    crownMid: '#84bdd1',
    crownAccent: '#f2cc6b',
    lipClosed: '#6e3f32',
    collarHi: '#4da6b8',
    collarLo: '#2c6878',
    collarBase: '#1b3e4a'
  };

  const JUREMA_SPEC = {
    instrument: 'rabeca',
    silCore: '#241310', silMid: '#3d201a', silRim: '#d96538', silRimHi: '#ffd35a',
    cape: ['#542118', '#8c3726', '#c45635', '#eda055'],
    robe: ['#473023', '#6b4936', '#94694f'],
    sash: ['#8c2d1f', '#d96538', '#f7c97e'],
    hair: ['#241510', '#42271e', '#663e30'],
    skin: ['#693e2a', '#8f573d', '#b57354'],
    eyeGlint: '#ffd35a',
    gemHi: '#ffb35c',
    crownLit: '#f2cc6b',
    crownDark: '#995326',
    hairRamp: ['#21130e', '#382018', '#573326', '#784837', '#965e49'],
    skinRamp: ['#522f1f', '#70422d', '#945b40', '#b87656', '#d49474'],
    crownMid: '#e69d45',
    crownAccent: '#e65c4f',
    lipClosed: '#693629',
    collarHi: '#d96538',
    collarLo: '#8c3726',
    collarBase: '#4f1e15'
  };

  // Compila todos os sprites Hi-Bit uma única vez no SpriteBank
  const PROTAG_F_IDLE0 = buildHiBitProtagonist('idle0');
  const PROTAG_F_IDLE1 = buildHiBitProtagonist('idle1');
  const PROTAG_F_IDLE2 = buildHiBitProtagonist('idle2');
  const PROTAG_F_WALK0 = buildHiBitProtagonist('walk0');
  const PROTAG_F_WALK2 = buildHiBitProtagonist('walk2');
  const PROTAG_F_TALK1 = buildHiBitProtagonist('talk1');
  const PROTAG_F_CELEB1 = buildHiBitProtagonist('celeb1');
  const PROTAG_F_FALL0 = buildHiBitProtagonist('fall0');
  const PROTAG_F_FALL1 = buildHiBitProtagonist('fall1');
  const PROTAG_F_FALLEN = buildHiBitProtagonist('fallen');
  const PROTAG_F_KNEEL = buildHiBitProtagonist('kneel');
  const PROTAG_F_SHOCK0 = buildHiBitProtagonist('shock0');

  const ORDEM_F_SIL0 = buildHiBitOrdem('sil0');
  const ORDEM_F_SIL1 = buildHiBitOrdem('sil1');
  const ORDEM_F_SIL2 = buildHiBitOrdem('sil2');
  const ORDEM_F_IDLE0 = buildHiBitOrdem('idle0');
  const ORDEM_F_IDLE1 = buildHiBitOrdem('idle1');
  const ORDEM_F_IDLE2 = buildHiBitOrdem('idle2');
  const ORDEM_F_WALK1 = buildHiBitOrdem('walk1');
  const ORDEM_F_WALK2 = buildHiBitOrdem('walk2');
  const ORDEM_F_SING1 = buildHiBitOrdem('sing1');
  const ORDEM_F_SING2 = buildHiBitOrdem('sing2');
  const ORDEM_F_CELEB0 = buildHiBitOrdem('celeb0');

  const SpriteBank = {
    protagonist: {
      idle: [PROTAG_F_IDLE0, PROTAG_F_IDLE1, PROTAG_F_IDLE2, PROTAG_F_IDLE1],
      walk: [PROTAG_F_WALK0, PROTAG_F_IDLE1, PROTAG_F_WALK2, PROTAG_F_IDLE1],
      talk: [PROTAG_F_IDLE0, PROTAG_F_TALK1, PROTAG_F_IDLE0, PROTAG_F_TALK1],
      celebrate: [PROTAG_F_IDLE0, PROTAG_F_CELEB1, PROTAG_F_CELEB1, PROTAG_F_IDLE0],
      fall: [PROTAG_F_FALL0, PROTAG_F_FALL1],
      recover_stand: [PROTAG_F_FALLEN, PROTAG_F_FALLEN, PROTAG_F_KNEEL, PROTAG_F_IDLE0],
      shock: [PROTAG_F_SHOCK0, PROTAG_F_IDLE1]
    },
    ordem: {
      back_silhouette: [ORDEM_F_SIL0, ORDEM_F_SIL1, ORDEM_F_SIL2, ORDEM_F_SIL1],
      idle: [ORDEM_F_IDLE0, ORDEM_F_IDLE1, ORDEM_F_IDLE2, ORDEM_F_IDLE1],
      walk: [ORDEM_F_IDLE0, ORDEM_F_WALK1, ORDEM_F_WALK2, ORDEM_F_WALK1],
      sing: [ORDEM_F_IDLE0, ORDEM_F_SING1, ORDEM_F_SING2, ORDEM_F_SING1],
      celebrate: [ORDEM_F_CELEB0, ORDEM_F_IDLE0, ORDEM_F_CELEB0, ORDEM_F_IDLE1]
    },
    araci: makeGuardianActor(ARACI_SPEC),
    irece: makeGuardianActor(IRECE_SPEC),
    jurema: makeGuardianActor(JUREMA_SPEC),
    stoneNeonAnimals: {
      cyan: makeStoneNeonAnimal('#a8e6cf', '#56ab91'),
      magenta: makeStoneNeonAnimal('#f2b8c6', '#bd6b82'),
      gold: makeStoneNeonAnimal('#f5df98', '#c49b45')
    },
    portraits: {
      portrait_protagonist: makePortraitSet(buildProtagonistPortrait),
      portrait_mystery_silhouette: {
        idle: [
          buildMysterySilhouettePortrait(0),
          buildMysterySilhouettePortrait(1),
          buildMysterySilhouettePortrait(0),
          buildMysterySilhouettePortrait(0)
        ],
        talk: [
          buildMysterySilhouettePortrait(0),
          buildMysterySilhouettePortrait(1),
          buildMysterySilhouettePortrait(2),
          buildMysterySilhouettePortrait(1)
        ]
      },
      portrait_ordem: makePortraitSet(buildOrdemPortrait),
      portrait_araci: makePortraitSet((m, b) => buildGuardianPortrait(ARACI_SPEC, m, b)),
      portrait_irece: makePortraitSet((m, b) => buildGuardianPortrait(IRECE_SPEC, m, b)),
      portrait_jurema: makePortraitSet((m, b) => buildGuardianPortrait(JUREMA_SPEC, m, b))
    },
    notes: [NOTE_SINGLE, NOTE_DOUBLE]
  };

  // ============================================================================
  // INSTANCIADOR DE ATORES E EFEITOS EM LOOP (ActorAnimator)
  // Renderiza sprites Hi-Bit (640x360) com precisão 1:1 de pixel físico.
  // ============================================================================
  const RH = (v) => Math.round(v * 2) * 0.5;
  const ActorAnimator = {
    /**
     * Desenha um ator do SpriteBank no estado desejado (em loop a 12 FPS).
     */
    drawActor(ctx, actorKey, stateKey, x, y, t, opts = {}) {
      const actor = SpriteBank[actorKey] || SpriteBank.protagonist;
      const frames = actor[stateKey] || actor.idle;
      const f12 = Math.floor(t * SPRITE_FPS);
      const idx = opts.loop === false
        ? clamp(f12, 0, frames.length - 1)
        : ((f12 % frames.length) + frames.length) % frames.length;
      let spr = frames[idx];
      if (!spr) return;
      if (opts.flipX) spr = mirrorCanvas(spr);
      if (!spr) return;

      const scale = spr.hib ? 0.5 : 1;
      const w = spr.width * scale;
      const h = spr.height * scale;

      let dy = 0;
      if (stateKey === 'celebrate' && (idx === 1 || idx === 2)) dy = -4;
      const dx = RH(x - w / 2), drawY = RH(y - h + dy);
      ctx.drawImage(spr, dx, drawY, w, h);

      if (stateKey === 'celebrate') {
        const starPhase = f12 % 6;
        drawStar(ctx, x - 12, y - 20 - (starPhase & 1), 2, '#ffffff', '#ffd35a');
        drawStar(ctx, x + 12, y - 18 + (starPhase & 1), 2, '#ffffff', '#9ef0ff');
      } else if (stateKey === 'shock' && (f12 & 1) === 0) {
        drawPixelChar(ctx, '!', R(x - 2), R(y - h - 9), '#ffd35a', '#140d2e');
      }
    },

    _externalPortraitCache: new Map(),

    isDrawablePortraitSource(src) {
      if (!src || typeof src !== 'object' || src._failed) return false;
      const isImg =
        src.tagName === 'IMG' ||
        (typeof HTMLImageElement !== 'undefined' && src instanceof HTMLImageElement) ||
        ('complete' in src && src.tagName !== 'CANVAS');
      if (isImg) {
        if (!src.complete) return false;
        const nw = src.naturalWidth !== undefined ? src.naturalWidth : src.width;
        const nh = src.naturalHeight !== undefined ? src.naturalHeight : src.height;
        return Number(nw) > 0 && Number(nh) > 0;
      }
      return Number(src.width) > 0 && Number(src.height) > 0;
    },

    /**
     * Resolve o quadro válido do retrato do falante.
     * Retorna `null` se o retrato for nulo, inexistente, inválido ou falhar ao carregar.
     */
    resolvePortraitFrame(portraitRef, isTalking, t) {
      if (!portraitRef || portraitRef === 'none') return null;

      if (typeof portraitRef === 'string') {
        const key = portraitRef.trim();
        if (!key || key === 'none') return null;

        const pSet = SpriteBank.portraits && SpriteBank.portraits[key];
        if (pSet) {
          const frames = isTalking ? pSet.talk : pSet.idle;
          if (!Array.isArray(frames) || frames.length === 0) return null;
          const f12 = Math.floor(t * (isTalking ? 10 : 4));
          const frame = frames[((f12 % frames.length) + frames.length) % frames.length];
          return this.isDrawablePortraitSource(frame) ? frame : null;
        }

        const cachedMap = global.CrystalAssetCache && global.CrystalAssetCache.images;
        if (cachedMap) {
          const cached = typeof cachedMap.get === 'function' ? cachedMap.get(key) : cachedMap[key];
          if (cached) {
            return this.isDrawablePortraitSource(cached) ? cached : null;
          }
        }

        if (key.includes('/') || /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(key) || key.startsWith('data:image/')) {
          let extImg = this._externalPortraitCache.get(key);
          if (!extImg && typeof Image !== 'undefined') {
            extImg = new Image();
            extImg._failed = false;
            extImg.onerror = () => {
              extImg._failed = true;
            };
            extImg.src = key;
            this._externalPortraitCache.set(key, extImg);
          }
          return this.isDrawablePortraitSource(extImg) ? extImg : null;
        }

        return null;
      }

      if (typeof portraitRef === 'object') {
        if (Array.isArray(portraitRef.idle) || Array.isArray(portraitRef.talk)) {
          const frames = (isTalking ? portraitRef.talk : portraitRef.idle) || portraitRef.idle || portraitRef.talk;
          if (!Array.isArray(frames) || frames.length === 0) return null;
          const f12 = Math.floor(t * (isTalking ? 10 : 4));
          const frame = frames[((f12 % frames.length) + frames.length) % frames.length];
          return this.isDrawablePortraitSource(frame) ? frame : null;
        }
        return this.isDrawablePortraitSource(portraitRef) ? portraitRef : null;
      }

      return null;
    },

    /**
     * Desenha um retrato válido em loop, perfeitamente centralizado e contido quando solicitado.
     */
    drawPortrait(ctx, portraitKey, isTalking, x, y, t, opts = {}) {
      const frame = opts.resolvedFrame || this.resolvePortraitFrame(portraitKey, isTalking, t);
      if (!this.isDrawablePortraitSource(frame)) return false;

      const rawW = frame.naturalWidth || frame.width || 0;
      const rawH = frame.naturalHeight || frame.height || 0;
      if (rawW <= 0 || rawH <= 0) return false;

      const baseScale = frame.hib ? 0.5 : 1;
      let dw = rawW * baseScale;
      let dh = rawH * baseScale;

      if (opts.diamondRadius) {
        const dIn = opts.diamondRadius;
        if (frame._isDiamondBust) {
          const maxBox = Math.max(8, dIn * 2 - 4);
          if (dw > maxBox || dh > maxBox) {
            const fit = Math.min(maxBox / dw, maxBox / dh);
            dw = Math.max(1, Math.floor(dw * fit));
            dh = Math.max(1, Math.floor(dh * fit));
          }
        } else {
          // Inscreve imagens retangulares dentro da área útil do losango (dw/2 + dh/2 <= dIn - 1)
          const maxSum = Math.max(6, (dIn - 1) * 2);
          if (dw + dh > maxSum) {
            const fit = maxSum / (dw + dh);
            dw = Math.max(1, Math.round(dw * fit));
            dh = Math.max(1, Math.round(dh * fit));
          }
        }
      }

      const drawX = opts.center ? RH(x - dw / 2) : (opts.anchor === 'bottom' ? RH(x - dw / 2) : R(x));
      const drawY = opts.center ? RH(y - dh / 2) : (opts.anchor === 'bottom' ? RH(y - dh) : R(y));

      if (opts.flipX) {
        if (typeof ctx.save === 'function' && typeof ctx.translate === 'function' && typeof ctx.scale === 'function') {
          ctx.save();
          ctx.translate(drawX + dw, drawY);
          ctx.scale(-1, 1);
          ctx.drawImage(frame, 0, 0, dw, dh);
          ctx.restore();
        } else if (frame.tagName === 'CANVAS') {
          ctx.drawImage(mirrorCanvas(frame), drawX, drawY, dw, dh);
        } else {
          ctx.drawImage(frame, drawX, drawY, dw, dh);
        }
      } else {
        ctx.drawImage(frame, drawX, drawY, dw, dh);
      }
      return true;
    },

    /**
     * Efeito reutilizável em loop: `music_notes_loop`
     * Notas musicais flutuando a partir de qualquer coordenada (x, y) e direção.
     */
    drawMusicNotesLoop(ctx, originX, originY, t, opts = {}) {
      const count = opts.count || 4;
      const dirX = opts.dirX !== undefined ? opts.dirX : -18;
      const dirY = opts.dirY !== undefined ? opts.dirY : -14;
      const period = opts.period || 2.4;

      for (let i = 0; i < count; i++) {
        const phase = ((t + (i * period) / count) % period) / period;
        const nx = R(originX + dirX * phase + Math.sin(phase * Math.PI * 2 + i) * 4);
        const ny = R(originY + dirY * phase + Math.cos(phase * Math.PI * 2) * 3);
        const spr = SpriteBank.notes[i & 1];
        if (phase < 0.88) {
          ctx.drawImage(spr, nx, ny);
          if (((Math.floor(t * 12) + i) & 3) === 0) {
            P1(ctx, nx + 3, ny - 2, '#ffffff');
          }
        }
      }
    },

    /**
     * Desenha um Animal de Pedra com Cristais Neon (em loop `idle` ou `sing` quando há voz secundária).
     */
    drawStoneNeonAnimal(ctx, variantKey, isSingingExtraVoice, x, y, t, flipX = false) {
      const animSet = SpriteBank.stoneNeonAnimals[variantKey] || SpriteBank.stoneNeonAnimals.cyan;
      const frames = isSingingExtraVoice ? animSet.sing : animSet.idle;
      const f12 = Math.floor(t * SPRITE_FPS);
      let spr = frames[f12 % frames.length];
      if (flipX) spr = mirrorCanvas(spr);
      const scale = spr.hib ? 0.5 : 1;
      const w = spr.width * scale;
      const h = spr.height * scale;
      const bob = isSingingExtraVoice ? ((f12 & 1) ? -1.5 : 0) : 0;
      ctx.drawImage(spr, RH(x - w / 2), RH(y - h + bob), w, h);

      if (isSingingExtraVoice) {
        this.drawMusicNotesLoop(ctx, x, y - h - 2, t, {
          count: 2,
          dirX: flipX ? -10 : 10,
          dirY: -12,
          period: 1.2
        });
      }
    },

    /**
     * Adapta SOMENTE o ícone da fada no círculo da fase no Mapa (`.journey-fairy`)
     * para o novo estilo Hi-Bit Pixel Art do jogo, mantendo o Mapa como placeholder intacto.
     */
    adaptMapFairyIcon() {
      const fairyEl = document.querySelector('.journey-fairy');
      if (!fairyEl) return;
      const cellW = 64, cellH = 64;
      const [sheet, sctx] = mk(cellW * 4, cellH * 2);
      for (let col = 0; col < 4; col++) {
        const idleSpr = SpriteBank.ordem.idle[col % SpriteBank.ordem.idle.length];
        const walkSpr = SpriteBank.ordem.walk[col % SpriteBank.ordem.walk.length];
        sctx.drawImage(idleSpr, col * cellW, 0);
        sctx.drawImage(walkSpr, col * cellW, cellH);
      }
      const dataUrl = sheet.toDataURL('image/png');
      fairyEl.style.backgroundImage = `url("${dataUrl}")`;
      fairyEl.style.aspectRatio = '1';
      fairyEl.style.imageRendering = 'pixelated';
    },

    /**
     * Efeito reutilizável em loop: `crystal_tremble_loop`
     * Retorna o deslocamento [dx, dy] em pixels inteiros a 12 FPS e desenha faíscas se ctx for passado.
     */
    getCrystalTrembleOffset(t, active = true, ctx = null, cx = 0, cy = 0) {
      if (!active) return [0, 0];
      const JITTER = [[-1, 0], [1, -1], [-1, 1], [1, 0], [0, -1], [1, 1], [-1, -1], [0, 1]];
      const f24 = Math.floor(t * 24);
      const [dx, dy] = JITTER[((f24 % 8) + 8) % 8];
      if (ctx && (f24 & 1) === 0) {
        drawStar(ctx, cx + dx * 3, cy + dy * 3, 2, '#ffffff', '#ff7043');
      }
      return [dx, dy];
    }
  };

  // ============================================================================
  // TRANSIÇÃO REUTILIZÁVEL: IRIS OUT / IRIS IN (`iris_transition`)
  // Tela preta onde um círculo vai se fechando até ficar tudo preto e vice-versa.
  // ============================================================================
  const IrisTransition = {
    active: false,
    mode: 'out', // 'out' (fechando círculo) | 'in' (abrindo círculo)
    duration: 0.9,
    elapsed: 0,
    cx: 160,
    cy: 90,
    onDone: null,

    start(mode = 'out', cx = 160, cy = 90, duration = 0.85, onDone = null) {
      this.active = true;
      this.mode = mode;
      this.cx = R(cx);
      this.cy = R(cy);
      this.duration = Math.max(0.2, duration);
      this.elapsed = 0;
      this.onDone = onDone;
    },

    update(dt) {
      if (!this.active) return;
      this.elapsed += dt;
      if (this.elapsed >= this.duration) {
        this.elapsed = this.duration;
        this.active = false;
        const cb = this.onDone;
        this.onDone = null;
        if (typeof cb === 'function') cb();
      }
    },

    render(ctx, overrideProgress = null, overrideMode = null) {
      const mode = overrideMode || this.mode;
      let p = overrideProgress !== null
        ? clamp(overrideProgress, 0, 1)
        : clamp(this.elapsed / this.duration, 0, 1);
      if (overrideProgress === null && !this.active && p === 0) return;

      // Quantizado a 24 FPS para fidelidade True Pixel Art
      p = Math.floor(p * 24) / 24;
      const maxCornerDist = Math.max(
        Math.hypot(this.cx, this.cy),
        Math.hypot(W - this.cx, this.cy),
        Math.hypot(this.cx, H - this.cy),
        Math.hypot(W - this.cx, H - this.cy)
      );
      const maxR = Math.max(200, Math.ceil(maxCornerDist) + 6);
      const radius = mode === 'out'
        ? maxR * (1 - easeInOut(p))
        : maxR * easeInOut(p);

      if (radius <= 1) {
        ctx.fillStyle = '#05030f';
        ctx.fillRect(0, 0, W, H);
        return;
      }
      if (radius >= maxR - 1) return;

      for (let y = 0; y < H; y++) {
        const dy = y - this.cy;
        const dy2 = dy * dy;
        let currentColor = null;
        let runStart = 0;

        for (let x = 0; x < W; x++) {
          const dx = x - this.cx;
          const d = Math.sqrt(dx * dx + dy2) + (bay(x, y) - 7.5) * 0.35;
          let col = null;
          if (d > radius) {
            col = '#05030f';
          } else if (d > radius - 2 && ((x + y) & 1) === 0) {
            col = '#3fc6f0';
          }

          if (col !== currentColor) {
            if (currentColor !== null) {
              ctx.fillStyle = currentColor;
              ctx.fillRect(runStart, y, x - runStart, 1);
            }
            currentColor = col;
            runStart = x;
          }
        }

        if (currentColor !== null) {
          ctx.fillStyle = currentColor;
          ctx.fillRect(runStart, y, W - runStart, 1);
        }
      }
    }
  };

  // ============================================================================
  // 2. CAIXA DE DIÁLOGO GLOBAL (TRUE PIXEL ART)
  // - Design único e genérico para o jogo todo.
  // - No TOPO da caixa: moldura com o formato dos encaixes das 4 gemas faltantes.
  // - No LADO ESQUERDO: retrato (somente o rosto) mais detalhado em loop.
  // ============================================================================
  const DialogueBox = {
    isOpen: false,
    queue: [],
    currentIndex: 0,
    charProgress: 0,
    charsPerSec: 28,
    onComplete: null,
    // Estado global dos 4 encaixes das gemas no topo da caixa de diálogo
    sockets: {
      fairy: false,    // Gema da Fada (Caverna — formato borboleta/losango)
      forest: false,   // Esmeralda (Floresta — formato folha/oval)
      river: false,    // Turmalina Paraíba (Rio — formato gota/onda)
      caatinga: false  // Opala de Fogo (Caatinga — formato chama/sol)
    },

    syncSocketsFromCompleted(completedIds = []) {
      const list = Array.isArray(completedIds) ? completedIds : [];
      this.sockets.fairy = Boolean(this.sockets.fairy || list.includes(5));
      this.sockets.forest = Boolean(this.sockets.forest || list.includes(10));
      this.sockets.river = Boolean(this.sockets.river || list.includes(15));
      this.sockets.caatinga = Boolean(this.sockets.caatinga || list.includes(20));
    },

    open(lines, onComplete = null) {
      this.queue = Array.isArray(lines) ? lines : [lines];
      this.currentIndex = 0;
      this.charProgress = 0;
      this.isOpen = this.queue.length > 0;
      this.onComplete = onComplete;
    },

    close() {
      this.isOpen = false;
      this.queue = [];
      this.currentIndex = 0;
      this.charProgress = 0;
      this.onComplete = null;
    },

    advance() {
      if (!this.isOpen) return false;
      const cur = this.queue[this.currentIndex];
      if (!cur) return false;
      const fullLen = (cur.text || '').length;
      if (this.charProgress < fullLen) {
        this.charProgress = fullLen;
        return true;
      }
      this.currentIndex++;
      this.charProgress = 0;
      if (this.currentIndex >= this.queue.length) {
        this.isOpen = false;
        const cb = this.onComplete;
        this.onComplete = null;
        if (typeof cb === 'function') cb();
      }
      return true;
    },

    update(dt) {
      if (!this.isOpen) return;
      const cur = this.queue[this.currentIndex];
      if (!cur) return;
      const fullLen = (cur.text || '').length;
      if (this.charProgress < fullLen) {
        this.charProgress = Math.min(fullLen, this.charProgress + dt * this.charsPerSec);
      }
    },

    drawSocketCrest(ctx, cx, by, f12) {
      // Barra compacta e simétrica dos 4 encaixes, assentada sobre a borda superior da caixa sem invadir o cenário
      const cw = 54, ch = 9;
      const x0 = R(cx - cw / 2), y0 = R(by - 5);
      ctx.fillStyle = '#2c221e';
      ctx.fillRect(x0 - 1, y0 - 1, cw + 2, ch + 2);
      ctx.fillStyle = '#4a3830';
      ctx.fillRect(x0, y0, cw, ch);
      ctx.fillStyle = '#bfa36f';
      ctx.fillRect(x0 + 1, y0, cw - 2, 1);
      ctx.fillStyle = '#8c7d70';
      ctx.fillRect(x0 + 1, y0 + ch - 1, cw - 2, 1);

      const slots = [
        [this.sockets.fairy, '#68b8c4'],
        [this.sockets.forest, '#539e43'],
        [this.sockets.river, '#4da6b8'],
        [this.sockets.caatinga, '#d96538']
      ];
      for (let i = 0; i < slots.length; i++) {
        const [lit, gemCol] = slots[i];
        const sx = x0 + 5 + i * 12;
        const sy = y0 + 2;
        ctx.fillStyle = '#bfa36f';
        ctx.fillRect(sx, sy, 8, 5);
        ctx.fillStyle = lit ? gemCol : '#211815';
        ctx.fillRect(sx + 1, sy + 1, 6, 3);
        if (lit) {
          P1(ctx, sx + 2 + (((f12 >> 2) + i) & 1), sy + 1, '#ffffff');
        }
      }
    },

    render(ctx, t) {
      if (!this.isOpen) return;
      const cur = this.queue[this.currentIndex];
      if (!cur) return;

      const f12 = Math.floor(t * SPRITE_FPS);
      const fullText = cur.text || '';
      const visibleCount = Math.floor(this.charProgress);
      const isTalking = visibleCount < fullText.length;

      const portraitRef = cur.portrait !== undefined
        ? cur.portrait
        : (cur.sprite !== undefined ? cur.sprite : cur.image);
      const portraitFrame = ActorAnimator.resolvePortraitFrame(portraitRef, isTalking, t);
      const hasPortrait = Boolean(portraitFrame);

      const by = 132, bh = 44;
      let bx, bw, nx, crestCx, textX, textW, arrowX;
      let portraitLeft = true;
      const D = 25;
      let pcx = 34;
      const pcy = 151;

      if (hasPortrait) {
        portraitLeft = cur.side
          ? cur.side === 'left'
          : (portraitRef === 'portrait_protagonist' || cur.speaker === 'Protagonista');
        pcx = portraitLeft ? 34 : W - 34;
        bx = portraitLeft ? 46 : 10;
        bw = 264;
        nx = portraitLeft ? 66 : 24;
        crestCx = portraitLeft ? bx + bw - 38 : 218;
        textX = portraitLeft ? 65 : 20;
        textW = portraitLeft ? (bx + bw - 12 - textX) : 235;
        arrowX = portraitLeft ? bx + bw - 12 : 249;
      } else {
        // Fallback limpo: sem retrato válido -> oculta completamente o losango e expande a caixa de diálogo
        bx = 16;
        bw = W - 32;
        nx = bx + 14;
        crestCx = bx + bw - 38;
        textX = bx + 12;
        textW = bw - 24;
        arrowX = bx + bw - 12;
      }

      // Suporte a tremor cômico de impacto ("QUE CALOR!!!") sem quebrar o alinhamento inteiro de pixels
      let shakeX = 0, shakeY = 0;
      if (cur.shake && !GameHUD.reducedMotion) {
        const f24 = Math.floor(t * 24);
        const J = [[-2, 0], [2, -1], [-1, 1], [2, 1], [-2, -1], [1, -1], [-1, 0], [1, 1]];
        [shakeX, shakeY] = J[((f24 % 8) + 8) % 8];
      }

      // Balão de Diálogo em Pergaminho (#f4eedf com borda dupla #2c221e e #8c7d70)
      drawParchmentBox(ctx, bx + shakeX, by + shakeY, bw, bh);
      if (cur.shake) {
        ctx.fillStyle = '#FBBF24';
        ctx.fillRect(bx + shakeX + 1, by + shakeY + 1, bw - 2, 1);
        ctx.fillRect(bx + shakeX + 1, by + shakeY + bh - 2, bw - 2, 1);
      }

      // Barra simétrica dos 4 encaixes alinhada na borda superior direita da caixa
      this.drawSocketCrest(ctx, crestCx + shakeX, by + shakeY, f12);

      // Plaqueta do nome alinhada na mesma linha de base superior (sem colidir com os slots)
      const speaker = cur.speaker || 'Protagonista';
      const maxNameW = Math.max(54, R(crestCx - 34 - nx));
      const nameW = Math.min(112, maxNameW, measurePixelText(speaker, 9) + 18);
      this.drawNamePlate(ctx, nx + shakeX, by - 6 + shakeY, nameW, speaker);

      // Texto em amarelo com bordas pretas (alta definição)
      drawPixelText(ctx, fullText.slice(0, visibleCount), textX + shakeX, by + 9 + shakeY, cur.shake ? '#fff66b' : '#ffea31', '#000000', textW, 10);

      // Setinha indicadora no canto inferior direito quando o texto terminou
      if (!isTalking) {
        const bob = (f12 & 1) ? 1 : 0;
        const ax = arrowX, ay = by + bh - 10 + bob;
        ctx.fillStyle = '#ffea31';
        ctx.fillRect(ax, ay, 1, 7);
        ctx.fillRect(ax + 1, ay + 1, 1, 5);
        ctx.fillRect(ax + 2, ay + 2, 1, 3);
        ctx.fillRect(ax + 3, ay + 3, 1, 1);
      }

      // Exibe a moldura em losango SOMENTE quando houver imagem/sprite válido carregado
      if (hasPortrait) {
        const flipX = cur.flipX !== undefined ? Boolean(cur.flipX) : !portraitLeft;
        this.drawDiamondPortrait(ctx, portraitRef, isTalking, pcx, pcy, D, t, flipX, portraitFrame);
      }
    },

    drawNamePlate(ctx, x, y, w, name) {
      x = R(x); y = R(y);
      const h = 12, mid = y + h / 2;
      // Pontas em losango nas laterais
      for (let i = 0; i <= 6; i++) {
        const half = 6 - i;
        ctx.fillStyle = '#2c221e';
        ctx.fillRect(x - 7 + i, R(mid - half - 0.5), 1, half * 2 + 1);
        ctx.fillRect(x + w + 6 - i, R(mid - half - 0.5), 1, half * 2 + 1);
        if (i > 1 && half > 0) {
          ctx.fillStyle = '#bfa36f';
          ctx.fillRect(x - 7 + i, R(mid - half + 0.5), 1, Math.max(1, half * 2 - 1));
          ctx.fillRect(x + w + 6 - i, R(mid - half + 0.5), 1, Math.max(1, half * 2 - 1));
        }
      }
      // Corpo da plaqueta em madeira escura com filete dourado
      ctx.fillStyle = '#2c221e';
      ctx.fillRect(x - 1, y, w + 2, h);
      ctx.fillStyle = '#6e5444';
      ctx.fillRect(x, y + 1, w, h - 2);
      ctx.fillStyle = '#86685a';
      ctx.fillRect(x, y + 1, w, 2);
      ctx.fillStyle = '#4a3830';
      ctx.fillRect(x, y + h - 3, w, 2);
      ctx.fillStyle = '#d9bf86';
      ctx.fillRect(x, y + 1, w, 1);
      drawPixelTextCentered(ctx, name, x + w / 2, y + 2, '#ffea31', '#000000', w - 4, 9);
    },

    drawDiamondPortrait(ctx, portraitKey, isTalking, cx, cy, D, t, flipX, resolvedFrame = null) {
      const frame = resolvedFrame || ActorAnimator.resolvePortraitFrame(portraitKey, isTalking, t);
      if (!frame) return;

      const dInner = D - 3;
      const diamond = (d) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy - d);
        ctx.lineTo(cx + d, cy);
        ctx.lineTo(cx, cy + d);
        ctx.lineTo(cx - d, cy);
        ctx.closePath();
      };
      // Desenha o losango em faixas de pixel inteiro (sem anti-aliasing)
      const fillDiamond = (d, col) => {
        ctx.fillStyle = col;
        for (let dy = -d; dy <= d; dy++) {
          const half = d - Math.abs(dy);
          ctx.fillRect(R(cx - half), R(cy + dy), half * 2 + 1, 1);
        }
      };
      fillDiamond(D + 2, '#2c221e');       // contorno externo
      fillDiamond(D + 1, '#d9bf86');       // filete dourado
      fillDiamond(D, '#5c4938');           // moldura de madeira
      fillDiamond(D - 2, '#2c221e');       // contorno interno
      fillDiamond(dInner, '#3b4a3a');      // fundo do retrato (verde-musgo escuro)
      // Leve gradiente pictórico no fundo
      ctx.fillStyle = '#4a5c46';
      for (let dy = -dInner; dy < -dInner / 3; dy++) {
        const half = dInner - Math.abs(dy);
        ctx.fillRect(R(cx - half), R(cy + dy), half * 2 + 1, 1);
      }

      if (typeof ctx.save === 'function') ctx.save();
      if (typeof ctx.clip === 'function') {
        diamond(dInner);
        ctx.clip();
      }
      ActorAnimator.drawPortrait(ctx, portraitKey, isTalking, cx, cy, t, {
        center: true,
        diamondRadius: dInner,
        flipX: Boolean(flipX),
        resolvedFrame: frame
      });
      if (typeof ctx.restore === 'function') ctx.restore();
    }
  };

  // ============================================================================
  // 3. SISTEMA DE TUTORIAL PAGINADO ESTILO OWLBOY (Vignette / Animated Tutorial Card)
  // ============================================================================
  const Q_TUT_ROWS = [
    '......o......',
    '.....oWo.....',
    '....oLWLo....',
    '...oLLWMLo...',
    '..oLLWLMMDo..',
    '.oLLWWLMMMDo.',
    '.oLLLWLMMMDo.',
    '.oLLLWLMMMDo.',
    '.oLLLWLMMMDo.',
    '.oLLLWLMMMDo.',
    '.oLLLLMDDDDo.',
    '..oLLLMDDDo..',
    '...oLLMDDo...',
    '....oLMDo....',
    '.....ooo.....'
  ];
  const SPR_PURE = fromMap(Q_TUT_ROWS, { o: '#294c66', W: '#ffffff', L: '#a8d8e6', M: '#6caac4', D: '#437794' });
  const SPR_SHADOW = fromMap(Q_TUT_ROWS, { o: '#1a122b', W: '#b8a6d9', L: '#5e4d82', M: '#413361', D: '#2a1f42' });
  const SPR_OPAL = fromMap(Q_TUT_ROWS, { o: '#541812', W: '#fff6cc', L: '#e68a49', M: '#c45131', D: '#8c2d1f' });
  const SPR_ROSE = fromMap(Q_TUT_ROWS, { o: '#59223b', W: '#fff2f5', L: '#e396b1', M: '#bf6588', D: '#8c3f60' });
  const SPR_EMERALD = fromMap(Q_TUT_ROWS, { o: '#193d20', W: '#eaffea', L: '#8ed46a', M: '#539e43', D: '#2f6328' });
  const SPR_CITRINE = fromMap(Q_TUT_ROWS, { o: '#52300a', W: '#fff9d6', L: '#f7dc7e', M: '#e3b448', D: '#875616' });
  const SPR_AQUA = fromMap(Q_TUT_ROWS, { o: '#123b45', W: '#ebffff', L: '#a8f0f0', M: '#4da6b8', D: '#1f6170' });

  function drawMiniOrb(ctx, x, y, col, rim) {
    ctx.fillStyle = rim;
    ctx.fillRect(x - 2, y - 2, 4, 4);
    ctx.fillStyle = col;
    ctx.fillRect(x - 1, y - 1, 2, 2);
    P1(ctx, x - 1, y - 1, '#ffffff');
  }

  const TutorialModal = {
    isOpen: false,
    cards: [],
    currentIndex: 0,
    seenKeys: new Set(),
    onFinish: null,
    btnRect: { x: 194, y: 140, w: 78, h: 15 },

    open(cards, onFinish = null, onlyNew = false) {
      const list = (Array.isArray(cards) ? cards : [cards]).filter(c => {
        if (!onlyNew || !c.id) return true;
        if (this.seenKeys.has(c.id)) return false;
        return true;
      });
      if (!list.length) {
        if (typeof onFinish === 'function') onFinish();
        return;
      }
      this.cards = list;
      this.currentIndex = 0;
      this.isOpen = true;
      this.onFinish = onFinish;
      if (list[0].id) this.seenKeys.add(list[0].id);
      GameHUD.playSfx('tutorialOpen');
    },

    close() {
      this.isOpen = false;
      this.cards = [];
      this.currentIndex = 0;
      this.onFinish = null;
    },

    nextStep() {
      if (!this.isOpen) return false;
      this.currentIndex++;
      if (this.currentIndex < this.cards.length) {
        const cur = this.cards[this.currentIndex];
        if (cur && cur.id) this.seenKeys.add(cur.id);
        GameHUD.playSfx('tutorialAdvance');
        return true;
      }
      this.isOpen = false;
      GameHUD.playSfx('tutorialClose');
      const cb = this.onFinish;
      this.onFinish = null;
      if (typeof cb === 'function') cb();
      return true;
    },

    handleClick(lx, ly) {
      if (!this.isOpen) return false;
      const b = this.btnRect;
      if (lx >= b.x && lx <= b.x + b.w && ly >= b.y && ly <= b.y + b.h) {
        return this.nextStep();
      }
      return false;
    },

    drawVignette(ctx, type, vx, vy, vw, vh, t) {
      ctx.fillStyle = '#241d1a';
      ctx.fillRect(vx, vy, vw, vh);
      ctx.fillStyle = '#8c7d70';
      ctx.fillRect(vx, vy, vw, 1);
      ctx.fillRect(vx, vy + vh - 1, vw, 1);
      ctx.fillRect(vx, vy, 1, vh);
      ctx.fillRect(vx + vw - 1, vy, 1, vh);

      const phase = (t % 2.4) / 2.4;
      const cy = R(vy + vh / 2 + 2);

      if (type === 'drag_and_shadow') {
        const sx = vx + vw - 44;
        const px = phase < 0.65
          ? R(vx + 36 + easeInOut(phase / 0.65) * (sx - (vx + 36)))
          : sx;

        if (phase < 0.72) {
          ctx.drawImage(SPR_SHADOW, sx - 6, cy - 7);
          drawMiniOrb(ctx, sx, cy - 11, '#b8a6d9', '#1a122b');
          ctx.drawImage(SPR_PURE, px - 6, cy - 7);
          drawMiniOrb(ctx, px, cy - 11, '#a8d8e6', '#294c66');
          ctx.fillStyle = '#f2cc6b';
          ctx.fillRect(px + 3, cy + 4, 3, 3);
        } else {
          const r = R((phase - 0.72) * 45);
          drawRing(ctx, sx, cy, r, '#a8d8e6');
          drawStar(ctx, sx, cy, 4, '#ffffff', '#f2cc6b');
        }
      } else if (type === 'obstacle_decay') {
        const stage = Math.floor(phase * 3);
        const ox = R(vx + vw / 2 - 14), oy = vy + 6;
        for (let k = 0; k < 3; k++) {
          const lit = k <= stage;
          ctx.fillStyle = lit ? '#7ec456' : '#3b3332';
          ctx.fillRect(vx + 22 + k * 14, cy - 2, 8, 6);
        }
        const hBar = (3 - stage) * 8;
        ctx.fillStyle = '#524846';
        ctx.fillRect(ox + 24, oy + (24 - hBar), 16, hBar);
        if (stage > 0) drawStar(ctx, ox + 32, oy + (24 - hBar), 3, '#ffffff', '#f2cc6b');
      } else if (type === 'fire_opal') {
        const near = phase > 0.25 && phase < 0.75;
        const [jx, jy] = ActorAnimator.getCrystalTrembleOffset(t, near, ctx, vx + 96, cy);
        const ox = near ? vx + 80 : R(vx + 40 + Math.sin(phase * Math.PI) * 34);
        ctx.drawImage(SPR_PURE, vx + 94 + jx, cy - 7 + jy);
        drawMiniOrb(ctx, vx + 98 + jx, cy - 11 + jy, '#a8d8e6', '#294c66');
        if (!near) drawMiniOrb(ctx, vx + 104 + jx, cy - 10 + jy, '#a8d8e6', '#294c66');
        ctx.drawImage(SPR_OPAL, ox - jx, cy - 7 - jy);
        drawMiniOrb(ctx, ox + 6 - jx, cy - 11 - jy, '#f7c97e', '#541812');
      } else if (type === 'rose_quartz' || type === 'aura_equation') {
        const expanded = phase > 0.35 && phase < 0.75;
        const r = expanded ? 16 : 11;
        drawRing(ctx, R(vx + vw / 2), cy, r, '#cfa3c4');
        ctx.drawImage(SPR_ROSE, R(vx + vw / 2 - (expanded ? 12 : 8)), cy - 7);
        ctx.drawImage(SPR_PURE, R(vx + vw / 2 + (expanded ? 3 : 0)), cy - 7);
      } else if (type === 'emerald_altar') {
        const ax = R(vx + vw / 2 + 18);
        ctx.fillStyle = '#3b3332';
        ctx.fillRect(ax - 8, cy + 5, 16, 6);
        ctx.drawImage(SPR_EMERALD, ax - 6, cy - 8);
        drawRing(ctx, ax, cy, 12, '#7ec456');
        const boosted = phase >= 0.52;
        const px = phase < 0.52
          ? R(vx + 46 + easeInOut(phase / 0.52) * (ax - 18 - (vx + 46)))
          : R(ax - 18 - easeInOut((phase - 0.52) / 0.48) * 30);
        ctx.drawImage(SPR_PURE, px - 6, cy - 7);
        drawMiniOrb(ctx, px - 3, cy - 11, '#a8d8e6', '#294c66');
        drawMiniOrb(ctx, px + 3, cy - 11, '#a8d8e6', '#294c66');
        if (boosted) {
          drawMiniOrb(ctx, px - 8, cy - 9, '#a8d8e6', '#294c66');
          drawMiniOrb(ctx, px + 8, cy - 9, '#a8d8e6', '#294c66');
          drawStar(ctx, ax - 8, cy - 6, 3, '#ffffff', '#8ed46a');
        }
      } else if (type === 'citrine_split' || type === 'aqua_drop') {
        const spr = type === 'citrine_split' ? SPR_CITRINE : SPR_AQUA;
        const orbCol = type === 'citrine_split' ? '#f7dc7e' : '#a8f0f0';
        const rimCol = type === 'citrine_split' ? '#52300a' : '#123b45';
        const mx = R(vx + vw / 2);
        if (phase < 0.45) {
          ctx.drawImage(spr, mx - 6, cy - 7);
          for (const dx of [-7, -2, 3, 8]) drawMiniOrb(ctx, mx + dx, cy - 11, orbCol, rimCol);
          if (phase > 0.3) drawRing(ctx, mx, cy, 11, '#ffffff');
        } else {
          const sep = R(6 + easeInOut(clamp((phase - 0.45) / 0.35, 0, 1)) * 18);
          ctx.drawImage(spr, mx - sep - 6, cy - 7);
          drawMiniOrb(ctx, mx - sep - 3, cy - 11, orbCol, rimCol);
          drawMiniOrb(ctx, mx - sep + 3, cy - 11, orbCol, rimCol);
          ctx.drawImage(spr, mx + sep - 6, cy - 7);
          drawMiniOrb(ctx, mx + sep - 3, cy - 11, orbCol, rimCol);
          drawMiniOrb(ctx, mx + sep + 3, cy - 11, orbCol, rimCol);
          if (phase < 0.65) drawStar(ctx, mx, cy - 2, 3, '#ffffff', orbCol);
        }
      } else if (type === 'forest_ninja_slice') {
        const mx = R(vx + vw / 2);
        const my = cy;
        // Desenha corte ninja: cristais sobem, rastro de corte corta ambos, 'COMBO X2!' aparece
        if (phase < 0.45) {
          const u = phase / 0.45;
          const arcY = R(cy + 10 - Math.sin(u * Math.PI) * 16);
          ctx.drawImage(SPR_EMERALD, mx - 16, arcY - 7);
          ctx.drawImage(SPR_PURE, mx + 6, arcY - 7);
        } else if (phase < 0.58) {
          // Rastro do corte
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(mx - 24, cy - 10);
          ctx.lineTo(mx + 24, cy + 10);
          ctx.stroke();
          drawStar(ctx, mx, cy, 4, '#ffffff', '#6ef58c');
        } else {
          // Metades se separando
          const sep = R((phase - 0.58) * 36);
          ctx.drawImage(SPR_EMERALD, mx - 20 - sep, cy - 7 + sep * 0.5);
          ctx.drawImage(SPR_PURE, mx + 10 + sep, cy - 7 + sep * 0.5);
          drawPixelTextCentered(ctx, 'COMBO X2!', mx, cy - 12, '#fbbf24', '#1f1410', 60, 7);
        }
      } else if (type === 'caatinga_circle') {
        const sx = R(vx + vw / 2 + 24);
        drawRing(ctx, sx, cy, 11, '#FBBF24');
        if (phase < 0.52) {
          const px = R(vx + 44 + easeInOut(phase / 0.52) * (sx - (vx + 44)));
          ctx.drawImage(SPR_OPAL, px - 6, cy - 7);
          for (const dx of [-4, 0, 4]) drawMiniOrb(ctx, px + dx, cy - 11, '#f7c97e', '#541812');
        } else {
          drawRing(ctx, sx, cy, 7, '#e68a49');
          ctx.fillStyle = '#c45131';
          ctx.fillRect(sx - 4, cy - 4, 9, 9);
          for (let k = 0; k < 6; k++) {
            const ang = (k / 6) * Math.PI * 2 + t * 2;
            P1(ctx, R(sx + Math.cos(ang) * 9), R(cy + Math.sin(ang) * 9), '#fff6cc');
          }
          drawStar(ctx, sx, cy - 10, 3, '#ffffff', '#FBBF24');
        }
      } else if (type === 'caatinga_square' || type === 'caatinga_order') {
        const mx = R(vx + vw / 2);
        const swapped = type === 'caatinga_order' && phase >= 0.5;
        const borderCol = swapped ? '#e396b1' : '#a8d8e6';
        const coreCol = swapped ? '#6caac4' : '#bf6588';
        ctx.drawImage(swapped ? SPR_ROSE : SPR_PURE, mx - 54, cy - 7);
        ctx.drawImage(swapped ? SPR_PURE : SPR_ROSE, mx - 34, cy - 7);
        ctx.fillStyle = '#9b72cf';
        ctx.fillRect(mx - 42, cy, 8, 2);
        ctx.fillStyle = '#FBBF24';
        ctx.fillRect(mx + 14, cy - 10, 20, 20);
        ctx.fillStyle = borderCol;
        ctx.fillRect(mx + 15, cy - 9, 18, 18);
        ctx.fillStyle = coreCol;
        ctx.fillRect(mx + 19, cy - 5, 10, 10);
        drawStar(ctx, mx + 24, cy - 11, 2, '#ffffff', '#FBBF24');
      } else if (type === 'caatinga_rectangle' || type === 'caatinga_trapezoid') {
        const mx = R(vx + vw / 2);
        ctx.drawImage(SPR_PURE, mx - 54, cy - 7);
        ctx.drawImage(SPR_OPAL, mx - 34, cy - 7);
        ctx.fillStyle = '#9b72cf';
        ctx.fillRect(mx - 42, cy, 8, 2);
        if (type === 'caatinga_rectangle') {
          ctx.fillStyle = '#FBBF24';
          ctx.fillRect(mx + 10, cy - 8, 26, 16);
          ctx.fillStyle = '#a8d8e6';
          ctx.fillRect(mx + 11, cy - 7, 24, 14);
          ctx.fillStyle = '#c45131';
          ctx.fillRect(mx + 15, cy - 4, 16, 8);
        } else {
          for (let dy = -8; dy <= 7; dy++) {
            const hw = R(8 + ((dy + 8) / 15) * 6);
            ctx.fillStyle = dy === -8 || dy === 7 ? '#FBBF24' : '#a8d8e6';
            ctx.fillRect(mx + 22 - hw, cy + dy, hw * 2, 1);
            if (dy > -5 && dy < 4) {
              ctx.fillStyle = '#c45131';
              ctx.fillRect(mx + 22 - (hw - 3), cy + dy, (hw - 3) * 2, 1);
            }
          }
        }
      } else if (type === 'caatinga_tessellation' || type === 'caatinga_nested') {
        const mx = R(vx + vw / 2);
        const sep = phase < 0.5 ? R(14 * (1 - easeInOut(phase / 0.5))) : 0;
        ctx.fillStyle = '#a8d8e6';
        ctx.fillRect(mx - 14 - sep, cy - 7, 13, 14);
        ctx.fillStyle = '#6caac4';
        ctx.fillRect(mx - 11 - sep, cy - 4, 7, 8);
        ctx.fillStyle = '#a8d8e6';
        ctx.fillRect(mx + sep, cy - 7, 13, 14);
        ctx.fillStyle = '#6caac4';
        ctx.fillRect(mx + 3 + sep, cy - 4, 7, 8);
        if (sep === 0) {
          ctx.fillStyle = '#FBBF24';
          ctx.fillRect(mx - 15, cy - 8, 29, 1);
          ctx.fillRect(mx - 15, cy + 7, 29, 1);
          drawStar(ctx, mx, cy - 10, 3, '#ffffff', '#FBBF24');
        }
      } else if (type === 'caatinga_shell_game') {
        const mx = R(vx + vw / 2);
        const swap = Math.sin(phase * Math.PI * 2) * 26;
        const cups = [R(mx - 26 + swap), mx, R(mx + 26 - swap)];
        for (let i = 0; i < 3; i++) {
          const cxCup = cups[i];
          ctx.fillStyle = '#D97706';
          ctx.fillRect(cxCup - 8, cy - 6, 16, 12);
          ctx.fillStyle = '#FBBF24';
          ctx.fillRect(cxCup - 6, cy - 8, 12, 2);
          ctx.fillStyle = '#92400e';
          ctx.fillRect(cxCup - 9, cy + 5, 18, 2);
        }
        if (phase < 0.25 || phase > 0.8) {
          drawStar(ctx, cups[0], cy - 11, 3, '#ffffff', '#FBBF24');
        }
      } else if (type === 'river_fraction' || type === 'river_divide') {
        const mx = R(vx + vw / 2);
        const glow = Math.sin(t * 8) * 0.5 + 0.5;
        ctx.fillStyle = '#1c2c3d';
        ctx.fillRect(mx - 24, cy - 14, 48, 28);
        ctx.fillStyle = type === 'river_divide' || phase > 0.4 ? '#ff69b4' : '#57d1de';
        ctx.fillRect(mx - 22, cy - 1, 44, 2);
        ctx.drawImage(SPR_PURE, mx - 6, cy - 13);
        ctx.drawImage(SPR_PURE, mx - 6, cy + 3);
        if (type === 'river_divide' || phase > 0.4) {
          drawRing(ctx, mx, cy, 18 + glow * 4, '#ff69b4');
          drawStar(ctx, mx - 18, cy - 8, 2, '#ffffff', '#ff69b4');
          drawStar(ctx, mx + 18, cy + 6, 2, '#ffffff', '#ffaae5');
        }
      } else if (type === 'river_melody') {
        const mx = R(vx + vw / 2);
        const activeIdx = Math.floor(t * 2) % 5;
        const freqsCols = ['#5ee7ff', '#70ea85', '#ffd64d', '#ff8c3b', '#ff6bc9'];
        for (let i = 0; i < 5; i++) {
          const cxGem = mx - 40 + i * 20;
          const isAct = i === activeIdx;
          const gemY = cy + (isAct ? -6 : 2);
          ctx.fillStyle = freqsCols[i];
          ctx.fillRect(cxGem - 4, gemY - 4, 8, 8);
          if (isAct) {
            drawStar(ctx, cxGem, gemY - 9, 2, '#ffffff', freqsCols[i]);
            drawPixelChar(ctx, '♪', cxGem - 2, gemY - 14, '#ffffff', '#111338');
          }
        }
      }
    },

    render(ctx, t) {
      if (!this.isOpen || !this.cards.length) return;
      const card = this.cards[this.currentIndex];
      if (!card) return;

      // Véu escuro suave sobre o fundo
      ctx.fillStyle = 'rgba(10, 8, 6, 0.55)';
      ctx.fillRect(0, 20, W, H - 20);

      const cx = 32, cy = 24, cw = 256, ch = 138;
      this.btnRect = { x: cx + cw - 86, y: cy + ch - 21, w: 76, h: 15 };

      drawParchmentBox(ctx, cx, cy, cw, ch, { headerH: 16, headerBg: '#3d2b24' });

      // Cabeçalho + paginação bem enquadrados (amarelo com bordas pretas)
      const stepLabel = `Página ${this.currentIndex + 1}/${this.cards.length}`;
      drawPixelText(ctx, card.title || 'Como Jogar', cx + 10, cy + 7, '#ffea31', '#000000', 168, 9);
      drawPixelText(ctx, stepLabel, cx + 10, cy + 7, '#fff66b', '#000000', cw - 20, 9, 'right');

      // Vinheta animada demonstrativa
      this.drawVignette(ctx, card.vignette || 'drag_and_shadow', cx + 10, cy + 23, cw - 20, 36, t);

      // Texto explicativo em amarelo com borda preta
      drawPixelText(ctx, card.body || '', cx + 12, cy + 65, '#ffea31', '#000000', cw - 24, 10);

      // Botão para avançar/concluir no canto inferior direito
      const b = this.btnRect;
      const isLast = this.currentIndex >= this.cards.length - 1;
      ctx.fillStyle = '#14111c';
      ctx.fillRect(b.x - 1, b.y - 1, b.w + 2, b.h + 2);
      ctx.fillStyle = isLast ? '#2b689c' : '#324b81';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = '#92e8ff';
      ctx.fillRect(b.x, b.y, b.w, 1);
      ctx.fillRect(b.x, b.y + b.h - 1, b.w, 1);

      const btnText = isLast ? 'Começar!' : 'Avançar >';
      drawPixelTextCentered(ctx, btnText, b.x + b.w / 2, b.y + 4, '#ffffff', '#000000', b.w - 4, 9);
    }
  };

  // ============================================================================
  // 4. BARRA DE HUD SUPERIOR + PAUSE + RECOMEÇAR + MUDO + CONFIGURAÇÕES (Estilo Owlboy)
  // ============================================================================
  const RESTART_ICON_SPR = fromMap([
    '..ooGGGoo.',
    '.oGWWWWGo.',
    'oGWooooYWo',
    'oWo..oYYYo',
    'oWo...oYYo',
    'oWo......o',
    'oGWo....o.',
    '.oGWWWWGo.',
    '..ooGGGoo.',
    '..........'
  ], {
    o: '#1f1410',
    G: '#a8d8e6',
    W: '#ffffff',
    Y: '#f2cc6b'
  });

  function isMobileOrTouch() {
    if (typeof window === 'undefined') return false;
    if (typeof document !== 'undefined' && document.body?.classList?.contains('is-touch-device')) return true;
    const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua)) return true;
    const hasTouch = ('ontouchstart' in window) || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);
    const coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    return Boolean(hasTouch && (coarse || window.innerWidth <= 1024));
  }

  function drawVirtualTouchButton(ctx, rect, label = '⎵ ESPAÇO', active = false) {
    if (!rect || !ctx) return;
    const { x, y, w, h } = rect;
    ctx.fillStyle = 'rgba(8, 12, 28, 0.85)';
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = active ? '#2b8bc2' : '#1b3a69';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = active ? '#ffffff' : '#92e8ff';
    ctx.fillRect(x, y, w, 1);
    ctx.fillRect(x, y + h - 1, w, 1);
    ctx.fillRect(x, y, 1, h);
    ctx.fillRect(x + w - 1, y, 1, h);
    drawPixelTextCentered(ctx, label, x + w / 2, y + Math.max(2, Math.floor((h - 8) / 2)), active ? '#ffea31' : '#ffffff', '#000000', w - 6, 9);
  }

  const GameHUD = {
    worldLabel: 'Caverna',
    paused: false,
    settingsOpen: false,
    muted: false,
    musicVol: 50,
    sfxVol: 50,
    reducedMotion: false,
    restartFlashUntil: 0,

    // Botões na barra superior (320x20):
    buttons: {
      map:      { x: 154, y: 2, w: 32, h: 16 },
      pause:    { x: 188, y: 2, w: 20, h: 16 },
      restart:  { x: 210, y: 2, w: 64, h: 16 },
      mute:     { x: 276, y: 2, w: 20, h: 16 },
      settings: { x: 298, y: 2, w: 20, h: 16 }
    },

    // Botões do Modal de Pause (centralizados na caixa 184px)
    pauseMenuBtns: [
      { id: 'resume',   label: 'Continuar Jogo',  x: 92, y: 52,  w: 136, h: 15 },
      { id: 'restart',  label: 'Reiniciar Fase',  x: 92, y: 71,  w: 136, h: 15 },
      { id: 'mute',     label: 'Alternar Mudo',   x: 92, y: 90,  w: 136, h: 15 },
      { id: 'settings', label: 'Configurações',   x: 92, y: 109, w: 136, h: 15 },
      { id: 'map',      label: 'Voltar ao Mapa',  x: 92, y: 128, w: 136, h: 15 }
    ],

    // Botões e barras clicáveis do Modal de Configurações
    settingsBtns: {
      musMinus: { x: 136, y: 50, w: 18, h: 14 },
      musBar:   { x: 158, y: 50, w: 56, h: 14 },
      musPlus:  { x: 218, y: 50, w: 18, h: 14 },
      sfxMinus: { x: 136, y: 70, w: 18, h: 14 },
      sfxBar:   { x: 158, y: 70, w: 56, h: 14 },
      sfxPlus:  { x: 218, y: 70, w: 18, h: 14 },
      muteBtn:  { x: 136, y: 90, w: 112, h: 14 },
      motionBtn:{ x: 136, y: 110, w: 112, h: 14 },
      closeBtn: { x: 106, y: 132, w: 108, h: 15 }
    },

    onRestart: null,
    onGoMap: null,
    onMuteChange: null,

    inRect(x, y, r, padX = 2, padY = 2) {
      return x >= (r.x - padX) && x <= (r.x + r.w + padX) && y >= (r.y - padY) && y <= (r.y + r.h + padY);
    },

    syncAudio() {
      if (this.musicVol > 0 && this.musicVol <= 1) this.musicVol = Math.round(this.musicVol * 100);
      if (this.sfxVol > 0 && this.sfxVol <= 1) this.sfxVol = Math.round(this.sfxVol * 100);
      const isMuted = !!this.muted;
      const effMus = isMuted ? 0 : clamp(this.musicVol / 100, 0, 1);
      const effSfx = isMuted ? 0 : clamp(this.sfxVol / 100, 0, 1);

      try {
        if (global.CrystalAudio) {
          global.CrystalAudio.setVolume?.(effSfx);
          global.CrystalAudio.setEnabled?.(!isMuted && this.sfxVol > 0);
        }
        if (global.CrystalMusic) {
          global.CrystalMusic.setVolume?.(effMus);
          global.CrystalMusic.setEnabled?.(!isMuted && this.musicVol > 0);
        }
        if (global.CrystalShowdown) {
          global.CrystalShowdown.setVolume?.(effMus);
        }
        if (global.CrystalMenuAudio) {
          global.CrystalMenuAudio.setVolume?.(effMus);
          const tr = global.CrystalMenuAudio.track;
          if (tr) {
            tr.muted = isMuted || effMus <= 0;
            tr.volume = effMus;
            if (!tr.muted && effMus > 0 && tr.paused && typeof document !== 'undefined' && (!document.body?.dataset?.screen || document.body.dataset.screen === 'home')) {
              tr.play().catch(() => {});
            }
          }
        }
        if (typeof document !== 'undefined') {
          document.querySelectorAll('audio, video').forEach((media) => {
            media.muted = isMuted || effMus <= 0;
            media.volume = effMus;
          });
          const musInput = document.getElementById('musicVolume');
          const musOut = document.getElementById('musicValue');
          const musPct = Math.round(isMuted ? 0 : this.musicVol);
          if (musInput) musInput.value = String(musPct);
          if (musOut) musOut.textContent = `${musPct}%`;

          const fxInput = document.getElementById('fxVolume');
          const fxOut = document.getElementById('fxValue');
          const fxPct = Math.round(isMuted ? 0 : this.sfxVol);
          if (fxInput) fxInput.value = String(fxPct);
          if (fxOut) fxOut.textContent = `${fxPct}%`;
        }
      } catch (_) {}

      if (typeof this.onMuteChange === 'function') {
        this.onMuteChange(isMuted, effMus, effSfx);
      }
    },

    playSfx(kind = 'click') {
      if (this.muted || this.sfxVol <= 0) return;
      try {
        if (global.CrystalAudio) {
          global.CrystalAudio.unlock?.();
          global.CrystalAudio.setEnabled?.(true);
          global.CrystalAudio.setVolume?.(clamp(this.sfxVol / 100, 0, 1));
          if (typeof global.CrystalAudio[kind] === 'function') {
            global.CrystalAudio[kind](2);
          }
        }
      } catch (_) {}
    },

    toggleMute() {
      this.muted = !this.muted;
      this.syncAudio();
      if (!this.muted) {
        this.playSfx('click');
      }
    },

    triggerRestart() {
      this.paused = false;
      this.settingsOpen = false;
      this.restartFlashUntil = (typeof performance !== 'undefined' ? performance.now() : 0) + 280;
      this.playSfx('click');
      if (typeof this.onRestart === 'function') {
        this.onRestart();
      } else if (global.TruePixelWorlds && global.TruePixelWorlds.isActiveGame?.()) {
        global.TruePixelWorlds.restartCurrentPhase();
      } else if (global.CaveChapter1 && typeof global.CaveChapter1.restartCurrentPhase === 'function') {
        global.CaveChapter1.restartCurrentPhase();
      }
    },

    handleClick(x, y) {
      if (this.inRect(x, y, this.buttons.map, 2)) {
        this.paused = false;
        this.settingsOpen = false;
        this.playSfx('click');
        if (typeof this.onGoMap === 'function') {
          this.onGoMap();
        } else if (global.CrystalApp?.goto) {
          global.CrystalApp.goto('map');
        }
        return true;
      }
      if (this.inRect(x, y, this.buttons.pause, 2)) {
        this.settingsOpen = false;
        this.paused = !this.paused;
        this.playSfx('click');
        this.syncAudio();
        return true;
      }
      if (this.inRect(x, y, this.buttons.restart, 2)) {
        this.triggerRestart();
        return true;
      }
      if (this.inRect(x, y, this.buttons.mute, 2)) {
        this.toggleMute();
        return true;
      }
      if (this.inRect(x, y, this.buttons.settings, 2)) {
        this.settingsOpen = !this.settingsOpen;
        this.playSfx('click');
        this.syncAudio();
        return true;
      }

      if (this.settingsOpen) {
        const sb = this.settingsBtns;
        if (this.inRect(x, y, sb.musMinus)) {
          this.musicVol = Math.max(0, this.musicVol - 20);
          this.syncAudio();
          this.playSfx('click');
          return true;
        }
        if (this.inRect(x, y, sb.musPlus)) {
          this.musicVol = Math.min(100, this.musicVol + 20);
          if (this.musicVol > 0 && this.muted) this.muted = false;
          this.syncAudio();
          this.playSfx('click');
          return true;
        }
        if (this.inRect(x, y, sb.musBar)) {
          const ratio = clamp((x - sb.musBar.x) / sb.musBar.w, 0, 1);
          this.musicVol = clamp(Math.round((ratio * 100) / 20) * 20, 0, 100);
          if (this.musicVol > 0 && this.muted) this.muted = false;
          this.syncAudio();
          this.playSfx('click');
          return true;
        }
        if (this.inRect(x, y, sb.sfxMinus)) {
          this.sfxVol = Math.max(0, this.sfxVol - 20);
          this.syncAudio();
          this.playSfx('clink');
          return true;
        }
        if (this.inRect(x, y, sb.sfxPlus)) {
          this.sfxVol = Math.min(100, this.sfxVol + 20);
          if (this.sfxVol > 0 && this.muted) this.muted = false;
          this.syncAudio();
          this.playSfx('clink');
          return true;
        }
        if (this.inRect(x, y, sb.sfxBar)) {
          const ratio = clamp((x - sb.sfxBar.x) / sb.sfxBar.w, 0, 1);
          this.sfxVol = clamp(Math.round((ratio * 100) / 20) * 20, 0, 100);
          if (this.sfxVol > 0 && this.muted) this.muted = false;
          this.syncAudio();
          this.playSfx('clink');
          return true;
        }
        if (this.inRect(x, y, sb.muteBtn)) {
          this.toggleMute();
          return true;
        }
        if (this.inRect(x, y, sb.motionBtn)) {
          this.reducedMotion = !this.reducedMotion;
          if (typeof document !== 'undefined') {
            document.body.classList.toggle('reduce-motion', this.reducedMotion);
          }
          this.playSfx('click');
          return true;
        }
        if (this.inRect(x, y, sb.closeBtn)) {
          this.settingsOpen = false;
          this.playSfx('click');
          this.syncAudio();
          return true;
        }
        return true;
      }

      if (this.paused) {
        for (const b of this.pauseMenuBtns) {
          if (this.inRect(x, y, b)) {
            if (b.id === 'resume') {
              this.paused = false;
              this.playSfx('click');
              this.syncAudio();
            } else if (b.id === 'restart') {
              this.triggerRestart();
            } else if (b.id === 'mute') {
              this.toggleMute();
            } else if (b.id === 'settings') {
              this.settingsOpen = true;
              this.playSfx('click');
            } else if (b.id === 'map') {
              this.paused = false;
              this.playSfx('click');
              if (typeof this.onGoMap === 'function') this.onGoMap();
            }
            return true;
          }
        }
        return true;
      }

      return false;
    },

    drawButtonBox(ctx, r, active = false) {
      ctx.fillStyle = '#2c221e';
      ctx.fillRect(r.x - 1, r.y - 1, r.w + 2, r.h + 2);
      ctx.fillStyle = active ? '#633b34' : '#3d2b24';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = active ? '#f2cc6b' : '#9e8c7a';
      ctx.fillRect(r.x, r.y, r.w, 1);
      ctx.fillRect(r.x, r.y + r.h - 1, r.w, 1);
      ctx.fillRect(r.x, r.y, 1, r.h);
      ctx.fillRect(r.x + r.w - 1, r.y, 1, r.h);
    },

    drawVolumeBar(ctx, r, val, isMuted) {
      ctx.fillStyle = '#2c221e';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = '#8c7d70';
      ctx.fillRect(r.x, r.y, r.w, 1);
      ctx.fillRect(r.x, r.y + r.h - 1, r.w, 1);
      const steps = 5;
      const activeSteps = isMuted ? 0 : Math.round((val / 100) * steps);
      for (let i = 0; i < steps; i++) {
        const bx = r.x + 3 + i * 10;
        const by = r.y + 3;
        ctx.fillStyle = i < activeSteps ? '#539e43' : '#423630';
        ctx.fillRect(bx, by, 8, r.h - 6);
        if (i < activeSteps) {
          ctx.fillStyle = '#a5e06c';
          ctx.fillRect(bx, by, 8, 2);
        }
      }
    },

    renderSingleLineHudText(ctx, text, x, y, maxW, col = '#ffffff', strokeCol = '#000000', baseFontPx = 6.6) {
      const s = String(text || '');
      if (!s) return;
      if (ctx && typeof ctx.fillText === 'function') {
        const estW = Math.max(1, measurePixelText(s));
        const scale = estW > maxW ? Math.max(0.68, maxW / estW) : 1;
        const fontPx = Math.max(4.8, baseFontPx * scale);
        if (typeof ctx.save === 'function') ctx.save();
        ctx.font = `700 ${fontPx.toFixed(1)}px "Fredoka", "Segoe UI", system-ui, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = strokeCol;
        const baseY = y + baseFontPx * 0.88;
        if (typeof ctx.strokeText === 'function') ctx.strokeText(s, x, baseY, maxW);
        ctx.fillStyle = col;
        ctx.fillText(s, x, baseY, maxW);
        if (typeof ctx.restore === 'function') ctx.restore();
      } else {
        drawPixelText(ctx, s, x, y, col, strokeCol, 999, 8);
      }
    },

    renderTopBar(ctx, levelNum, currentStep, totalSteps, hideSteps = false, customTitle = null) {
      // Barra Superior Esculpida (0..20) com alto contraste para texto branco/azul
      ctx.fillStyle = '#141930';
      ctx.fillRect(0, 0, W, 20);
      ctx.fillStyle = '#5577b2';
      ctx.fillRect(0, 19, W, 1);
      ctx.fillStyle = '#92e8ff';
      ctx.fillRect(0, 19, 8, 1);
      ctx.fillRect(W - 8, 19, 8, 1);

      const labelPrefix = this.worldLabel || 'Caverna';
      const titleStr = customTitle || `${labelPrefix} - Fase ${levelNum}`;
      const rightLimit = hideSteps ? 96 : (this.buttons.map.x - 4);

      if (!hideSteps) {
        const safeSteps = Math.max(1, Number(totalSteps) || 1);
        const safeCur = clamp(Number(currentStep) || 1, 1, safeSteps);
        const stepStr = `Etapa ${safeCur}/${safeSteps}`;
        const dotStep = safeSteps > 5 ? 3 : 5;
        const dotsTotalW = Math.min(28, Math.max(4, (safeSteps - 1) * dotStep + 4));
        const dotsStartX = rightLimit - dotsTotalW;
        const stepTextW = Math.min(44, Math.max(32, measurePixelText(stepStr)));
        const stepX = Math.max(76, dotsStartX - stepTextW - 3);
        const titleMaxW = Math.max(66, stepX - 8);

        this.renderSingleLineHudText(ctx, titleStr, 5, 6, titleMaxW, '#ffffff', '#000000', 6.5);
        this.renderSingleLineHudText(ctx, stepStr, stepX, 6, stepTextW + 2, '#92e8ff', '#000000', 6.0);

        for (let s = 1; s <= safeSteps; s++) {
          const dx = R(dotsStartX + (s - 1) * (( dotsTotalW - 4) / Math.max(1, safeSteps - 1))), dy = 10;
          const done = s < safeCur;
          const cur = s === safeCur;
          ctx.fillStyle = done ? '#52e697' : cur ? '#92e8ff' : '#2a3556';
          ctx.fillRect(dx - 1, dy - 2, 3, 4);
          if (done || cur) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(dx, dy - 1, 1, 2);
          }
        }
      } else {
        this.renderSingleLineHudText(ctx, titleStr, 5, 6, rightLimit - 6, '#ffffff', '#000000', 6.6);
      }

      // 0. Botão MAPA (Acesso rápido a todas as fases para o dev/jogador)
      const bmap = this.buttons.map;
      this.drawButtonBox(ctx, bmap, false);
      drawPixelTextCentered(ctx, 'Mapa', bmap.x + bmap.w / 2, bmap.y + 4, '#92e8ff', '#000000', bmap.w - 4, 8);

      // 1. Botão PAUSE (❚❚)
      const bp = this.buttons.pause;
      this.drawButtonBox(ctx, bp, this.paused);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bp.x + 6, bp.y + 4, 3, 8);
      ctx.fillRect(bp.x + 11, bp.y + 4, 3, 8);

      // 2. Botão REINICIAR FASE (↻ Reiniciar — representativo e perfeitamente enquadrado)
      const br = this.buttons.restart;
      const nowMs = typeof performance !== 'undefined' ? performance.now() : 0;
      const flashing = nowMs < this.restartFlashUntil;
      ctx.fillStyle = flashing ? '#2b8bc2' : '#1e3a5f';
      ctx.fillRect(br.x, br.y, br.w, br.h);
      ctx.fillStyle = flashing ? '#ffffff' : '#92e8ff';
      ctx.fillRect(br.x, br.y, br.w, 1);
      ctx.fillRect(br.x, br.y + br.h - 1, br.w, 1);
      ctx.fillRect(br.x, br.y, 1, br.h);
      ctx.fillRect(br.x + br.w - 1, br.y, 1, br.h);
      ctx.drawImage(RESTART_ICON_SPR, br.x + 3, br.y + 3);
      drawPixelTextCentered(ctx, 'Reiniciar', br.x + 13 + (br.w - 14) / 2, br.y + 5, flashing ? '#92e8ff' : '#ffffff', '#000000', br.w - 14, 8);

      // 3. Botão DEIXAR NO MUDO (🔊 / 🔇)
      const bm = this.buttons.mute;
      this.drawButtonBox(ctx, bm, this.muted);
      ctx.fillStyle = this.muted ? '#d96538' : '#7ec456';
      ctx.fillRect(bm.x + 4, bm.y + 6, 3, 4);
      ctx.fillRect(bm.x + 7, bm.y + 5, 2, 6);
      ctx.fillRect(bm.x + 9, bm.y + 4, 2, 8);
      if (this.muted) {
        P1(ctx, bm.x + 13, bm.y + 5, '#e65c4f');
        P1(ctx, bm.x + 14, bm.y + 6, '#e65c4f');
        P1(ctx, bm.x + 15, bm.y + 7, '#e65c4f');
        P1(ctx, bm.x + 16, bm.y + 8, '#e65c4f');
        P1(ctx, bm.x + 16, bm.y + 5, '#e65c4f');
        P1(ctx, bm.x + 15, bm.y + 6, '#e65c4f');
        P1(ctx, bm.x + 14, bm.y + 7, '#e65c4f');
        P1(ctx, bm.x + 13, bm.y + 8, '#e65c4f');
      } else {
        P1(ctx, bm.x + 13, bm.y + 6, '#a8d8e6');
        P1(ctx, bm.x + 13, bm.y + 9, '#a8d8e6');
        P1(ctx, bm.x + 15, bm.y + 5, '#ffffff');
        P1(ctx, bm.x + 15, bm.y + 10, '#ffffff');
      }

      // 4. Botão CONFIGURAÇÕES (⚙)
      const bs = this.buttons.settings;
      this.drawButtonBox(ctx, bs, this.settingsOpen);
      const gx = bs.x + 10, gy = bs.y + 8;
      ctx.fillStyle = '#92e8ff';
      ctx.fillRect(gx - 3, gy - 3, 7, 7);
      P1(ctx, gx, gy - 4, '#ffffff');
      P1(ctx, gx, gy + 4, '#ffffff');
      P1(ctx, gx - 4, gy, '#ffffff');
      P1(ctx, gx + 4, gy, '#ffffff');
      ctx.fillStyle = '#141930';
      ctx.fillRect(gx - 1, gy - 1, 3, 3);
    },

    renderModals(ctx) {
      if (!this.paused && !this.settingsOpen) return;

      ctx.fillStyle = 'rgba(10, 8, 6, 0.55)';
      ctx.fillRect(0, 20, W, H - 20);

      if (this.settingsOpen) {
        const cx = 32, cy = 26, cw = 256, ch = 132;
        drawParchmentBox(ctx, cx, cy, cw, ch, { headerH: 16, headerBg: '#163b6c' });
        drawPixelTextCentered(ctx, 'Configurações de Som e Jogo', cx + cw / 2, cy + 7, '#ffffff', '#000000', cw - 16, 9);

        const sb = this.settingsBtns;
        drawPixelText(ctx, 'Música:', cx + 14, 54, '#92e8ff', '#000000', 80, 9);
        this.drawButtonBox(ctx, sb.musMinus, false);
        drawPixelTextCentered(ctx, '-', sb.musMinus.x + sb.musMinus.w / 2, sb.musMinus.y + 4, '#ffffff', '#000000', 14, 9);
        this.drawVolumeBar(ctx, sb.musBar, this.musicVol, this.muted);
        this.drawButtonBox(ctx, sb.musPlus, false);
        drawPixelTextCentered(ctx, '+', sb.musPlus.x + sb.musPlus.w / 2, sb.musPlus.y + 4, '#ffffff', '#000000', 14, 9);
        drawPixelText(ctx, `${this.muted ? 0 : Math.round(this.musicVol)}%`, sb.musPlus.x + 22, 54, '#ffffff', '#000000', 40, 9);

        drawPixelText(ctx, 'Efeitos:', cx + 14, 74, '#92e8ff', '#000000', 80, 9);
        this.drawButtonBox(ctx, sb.sfxMinus, false);
        drawPixelTextCentered(ctx, '-', sb.sfxMinus.x + sb.sfxMinus.w / 2, sb.sfxMinus.y + 4, '#ffffff', '#000000', 14, 9);
        this.drawVolumeBar(ctx, sb.sfxBar, this.sfxVol, this.muted);
        this.drawButtonBox(ctx, sb.sfxPlus, false);
        drawPixelTextCentered(ctx, '+', sb.sfxPlus.x + sb.sfxPlus.w / 2, sb.sfxPlus.y + 4, '#ffffff', '#000000', 14, 9);
        drawPixelText(ctx, `${this.muted ? 0 : Math.round(this.sfxVol)}%`, sb.sfxPlus.x + 22, 74, '#ffffff', '#000000', 40, 9);

        drawPixelText(ctx, 'Áudio Geral:', cx + 14, 94, '#92e8ff', '#000000', 88, 9);
        this.drawButtonBox(ctx, sb.muteBtn, this.muted);
        drawPixelTextCentered(ctx, this.muted ? 'Mudo: Ativado' : 'Som: Ativado', sb.muteBtn.x + sb.muteBtn.w / 2, sb.muteBtn.y + 4, '#ffffff', '#000000', sb.muteBtn.w - 4, 9);

        drawPixelText(ctx, 'Movimento:', cx + 14, 114, '#92e8ff', '#000000', 88, 9);
        this.drawButtonBox(ctx, sb.motionBtn, this.reducedMotion);
        drawPixelTextCentered(ctx, this.reducedMotion ? 'Reduzido' : 'Normal', sb.motionBtn.x + sb.motionBtn.w / 2, sb.motionBtn.y + 4, '#92e8ff', '#000000', sb.motionBtn.w - 4, 9);

        this.drawButtonBox(ctx, sb.closeBtn, true);
        drawPixelTextCentered(ctx, 'Voltar ao Jogo', sb.closeBtn.x + sb.closeBtn.w / 2, sb.closeBtn.y + 4, '#ffffff', '#000000', sb.closeBtn.w - 4, 9);
        return;
      }

      if (this.paused) {
        const cx = 68, cy = 26, cw = 184, ch = 132;
        drawParchmentBox(ctx, cx, cy, cw, ch, { headerH: 16, headerBg: '#163b6c' });
        drawPixelTextCentered(ctx, 'Jogo Pausado', cx + cw / 2, cy + 7, '#ffffff', '#000000', cw - 16, 9);

        for (const b of this.pauseMenuBtns) {
          this.drawButtonBox(ctx, b, b.id === 'resume');
          const label = b.id === 'mute' ? (this.muted ? 'Som: Mudo' : 'Som: Ligado') : b.label;
          drawPixelTextCentered(ctx, label, b.x + b.w / 2, b.y + 4, b.id === 'resume' ? '#92e8ff' : '#ffffff', '#000000', b.w - 6, 9);
        }
      }
    }
  };

  // Cards padrões de Tutorial do Jogo em Pergaminho Estilo Owlboy (com acentuação completa)
  const StandardTutorialCards = {
    FASE1_INTRO: [
      {
        id: 'tut_drag_and_shadow_once',
        title: 'Cristais e Sombras',
        vignette: 'drag_and_shadow',
        body: 'Arraste os cristais pelo campo. As bolinhas luminosas acima do cristal mostram seu valor: una cristais puros aos sombrios equivalentes para anulá-los!'
      },
      {
        id: 'tut_obstacle_decay',
        title: 'Caminho Bloqueado',
        vignette: 'obstacle_decay',
        body: 'Cada etapa concluída enfraquece a barreira de pedra do cenário até liberar a passagem!'
      }
    ],
    FASE2_OPAL: [
      {
        id: 'tut_fire_opal',
        title: 'Opala de Fogo',
        vignette: 'fire_opal',
        body: 'Ao aproximar a Opala de Fogo de um cristal, ambos tremem e subtraem 1 bolinha por vez. Afaste para parar!'
      }
    ],
    FASE3_ROSE_AND_AURA: [
      {
        id: 'tut_rose_quartz',
        title: 'Quartzo Rosa',
        vignette: 'rose_quartz',
        body: 'Soma igual ao Quartzo Branco, mas cristais de cores diferentes não podem se fundir!'
      }
    ],
    FASE3_EQUATION_AURA: [
      {
        id: 'tut_aura_equation',
        title: 'Equação Cristalina',
        vignette: 'aura_equation',
        body: 'Arraste cristais até a Equação Cristalina para adicioná-los, ou toque nela para expandir e organizar seu interior!'
      }
    ],
    FOREST_EMERALD: [
      {
        id: 'tut_emerald_altar',
        title: 'Altar de Esmeralda',
        vignette: 'emerald_altar',
        body: 'Aproxime um cristal puro do Altar de Esmeralda para duplicar suas bolinhas de energia uma única vez!'
      }
    ],
    FOREST_CITRINE: [
      {
        id: 'tut_citrine_split',
        title: 'Citrino Solar',
        vignette: 'citrine_split',
        body: 'Toque rápido em um Citrino Solar com número par de bolinhas para dividi-lo em dois cristais iguais!'
      }
    ],
    FOREST_SLICING_NINJA: [
      {
        id: 'tut_forest_ninja',
        title: 'Corte Cristalino da Floresta',
        vignette: 'forest_ninja_slice',
        body: 'Deslize o dedo ou mouse para cortar os cristais puros no ar! Faça combos cortando múltiplos de uma vez. Cortar sombras desconta 2s do tempo!'
      }
    ],
    RIVER_AQUA: [
      {
        id: 'tut_aqua_drop',
        title: 'Água-Marinha',
        vignette: 'aqua_drop',
        body: 'Toque rápido em uma Água-Marinha par para reparti-la ao meio, ou arraste gotas iguais para somá-las!'
      }
    ],
    RIVER_FRACTION_PLATFORM: [
      {
        id: 'tut_river_fraction',
        title: 'Plataforma de Frações',
        vignette: 'river_fraction',
        body: 'Arraste cristais para dentro da plataforma. Depois que entram, não podem mais sair! Iguale os valores de cima e de baixo.'
      },
      {
        id: 'tut_river_divide',
        title: 'Divisão Cristalina',
        vignette: 'river_divide',
        body: 'Quando os valores se igualarem, a fração brilhará em rosa! Clique nela para quebrar e realizar a divisão de tudo!'
      }
    ],
    RIVER_MELODY_SIMON: [
      {
        id: 'tut_river_melody',
        title: 'Sinfonia das Águas',
        vignette: 'river_melody',
        body: 'Observe o cristal de referência por 1 segundo e acompanhe os 5 cristais flutuando na melodia. Depois, toque-os na ordem exata para harmonizar o rio!'
      }
    ],
    CAATINGA_CIRCLE: [
      {
        id: 'tut_caatinga_circle',
        title: 'O Círculo Elétrico',
        vignette: 'caatinga_circle',
        body: 'Arraste 1 único cristal até o Círculo Elétrico amarelo para criar um Círculo Cristalino de pontos orbitais e anular a sombra circular!'
      }
    ],
    CAATINGA_SQUARE: [
      {
        id: 'tut_caatinga_square',
        title: 'O Quadrado Elétrico',
        vignette: 'caatinga_square',
        body: 'Todas as formas (exceto o círculo) exigem 2 cristais conectados! O Quadrado exige 2 elementos de mesmo valor matemático.'
      },
      {
        id: 'tut_caatinga_order',
        title: 'A Ordem dos Fatores',
        vignette: 'caatinga_order',
        body: 'A ordem importa! O 1º cristal define a cor da borda externa e o 2º cristal define a cor do núcleo interno da forma.'
      }
    ],
    CAATINGA_RECTANGLE: [
      {
        id: 'tut_caatinga_rectangle',
        title: 'O Retângulo Elétrico',
        vignette: 'caatinga_rectangle',
        body: 'Conecte 2 cristais com quantidades diferentes em uma Equação Cristalina e leve-os ao Retângulo Elétrico!'
      }
    ],
    CAATINGA_TRAPEZOID: [
      {
        id: 'tut_caatinga_trapezoid',
        title: 'O Trapézio Elétrico',
        vignette: 'caatinga_trapezoid',
        body: 'Conecte 2 cristais em uma Equação Cristalina e atravesse o Trapézio Elétrico para moldar uma matriz trapezoidal!'
      }
    ],
    CAATINGA_TESSELLATION: [
      {
        id: 'tut_caatinga_tessellation',
        title: 'A Arte do Encaixe',
        vignette: 'caatinga_tessellation',
        body: 'Conecte duas formas prontas para criar polígonos maiores (2 Quadrados = Retângulo, Trapézio + Triângulo = Pentágono). Arraste para desmontar!'
      }
    ],
    CAATINGA_NESTED: [
      {
        id: 'tut_caatinga_nested',
        title: 'Geometria Avançada',
        vignette: 'caatinga_nested',
        body: 'Una Triângulos em Losangos ou Hexágonos e encaixe formas dentro de Equações Cristalinas para anular sombras compostas em cascata!'
      }
    ],
    CAATINGA_SHELL_GAME: [
      {
        id: 'tut_caatinga_shell_game',
        title: 'O Desafio das Areias',
        vignette: 'caatinga_shell_game',
        body: 'Observe a Opala de Fogo revelada por 1 segundo sob a cúpula antes do embaralhamento! Acompanhe as trocas e toque na cúpula correta nas 6 rodadas!'
      }
    ]
  };

  const TruePixelEngine = {
    W,
    H,
    SPRITE_FPS,
    SIM_HZ,
    BAYER,
    bay,
    mulberry,
    c32,
    mk,
    fromMap,
    silhouette,
    mirrorCanvas,
    P1,
    drawRing,
    drawStar,
    measurePixelText,
    wrapPixelLines,
    drawPixelChar,
    drawPixelText,
    drawPixelTextCentered,
    drawParchmentBox,
    isMobileOrTouch,
    drawVirtualTouchButton,
    SpriteBank,
    ActorAnimator,
    IrisTransition,
    DialogueBox,
    TutorialModal,
    GameHUD,
    StandardTutorialCards
  };

  global.TruePixelEngine = TruePixelEngine;
})(typeof window !== 'undefined' ? window : globalThis);
