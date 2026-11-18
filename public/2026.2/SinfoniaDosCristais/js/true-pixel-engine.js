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
    const fontPx = Math.round(Math.max(6, Math.min(8.5, (lineHeight || 9) - 2)));
    const fillCol = normalizeReadableTextColor(col);
    const strokeCol = (shadowCol && shadowCol !== fillCol) ? shadowCol : '#000000';
    if (typeof ctx.save === 'function') ctx.save();
    ctx.font = `700 ${fontPx}px "Fredoka", "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = align === 'center' ? 'center' : (align === 'right' ? 'right' : 'left');
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.lineWidth = 1;
    ctx.strokeStyle = strokeCol;
    const baseY = Math.round(topY + fontPx * 0.9);
    const dx = Math.round(drawX);
    const limitW = (Number.isFinite(maxW) && maxW > 0 && maxW < 900) ? Math.round(maxW) : undefined;
    if (typeof ctx.strokeText === 'function') {
      if (limitW !== undefined) ctx.strokeText(line, dx, baseY, limitW);
      else ctx.strokeText(line, dx, baseY);
    }
    ctx.fillStyle = fillCol;
    if (limitW !== undefined) ctx.fillText(line, dx, baseY, limitW);
    else ctx.fillText(line, dx, baseY);
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
  // MOTOR DE TEXTO JUSTIFICADO E DESTAQUE DINÂMICO (Rich Tokens & Justified Wrapping)
  // Permite marcação de cores vivas ({cyan:...}, {gold:...}, {green:...}, {pink:...}, **...**)
  // e distribuição justificada de texto para ocupar harmoniosamente os cards de tutorial.
  // ============================================================================
  const RICH_COLOR_MAP = {
    cyan: '#38bdf8',
    blue: '#38bdf8',
    light_blue: '#7aeaff',
    gold: '#fbbf24',
    yellow: '#ffe887',
    green: '#4ade80',
    emerald: '#8ed46a',
    pink: '#f472b6',
    rose: '#ff80bf',
    orange: '#fb923c',
    fire: '#f97316',
    red: '#f87171',
    white: '#ffffff',
    purple: '#c084fc'
  };

  function parseRichTokens(rawText) {
    if (!rawText) return [];
    const str = String(rawText);
    const regex = /\{([a-zA-Z0-9_#]+):([^}]+)\}|\*\*([^*]+)\*\*/g;
    const tokens = [];
    let lastIndex = 0;
    let match;

    const pushWords = (subText, color) => {
      const parts = subText.split(/\s+/).filter(Boolean);
      for (const w of parts) {
        tokens.push({ text: w, color: color || null });
      }
    };

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        pushWords(str.slice(lastIndex, match.index), null);
      }
      if (match[1] && match[2] !== undefined) {
        const colKey = match[1].toLowerCase();
        const resolvedColor = RICH_COLOR_MAP[colKey] || (match[1].startsWith('#') ? match[1] : '#38bdf8');
        pushWords(match[2], resolvedColor);
      } else if (match[3] !== undefined) {
        pushWords(match[3], '#fbbf24');
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < str.length) {
      pushWords(str.slice(lastIndex), null);
    }

    return tokens;
  }

  function wrapJustifiedLines(text, maxWidth = 999) {
    const rawParagraphs = String(text || '').split('\n');
    const lines = [];

    for (const para of rawParagraphs) {
      const tokens = parseRichTokens(para);
      if (!tokens.length) {
        lines.push({ words: [], justify: false, gapWidth: 3, totalWidth: 0 });
        continue;
      }

      // Pre-calcula larguras de cada palavra
      const measuredTokens = tokens.map(t => ({
        ...t,
        width: measurePixelText(t.text)
      }));

      let curWords = [];
      let curWordsWidth = 0;

      for (let i = 0; i < measuredTokens.length; i++) {
        const token = measuredTokens[i];
        const nextWordsWidth = curWordsWidth + token.width;
        const defaultSpace = (curWords.length > 0) ? curWords.length * 3 : 0;

        if (curWords.length > 0 && (nextWordsWidth + defaultSpace > maxWidth)) {
          const gaps = curWords.length - 1;
          const extra = maxWidth - curWordsWidth;
          const gapW = gaps > 0 ? (extra / gaps) : 3;
          lines.push({
            words: curWords,
            justify: gaps > 0,
            gapWidth: gaps > 0 ? Math.max(3, gapW) : 3,
            totalWidth: curWordsWidth + gaps * (gaps > 0 ? Math.max(3, gapW) : 3)
          });
          curWords = [token];
          curWordsWidth = token.width;
        } else {
          curWords.push(token);
          curWordsWidth += token.width;
        }
      }

      if (curWords.length > 0) {
        // Última linha do parágrafo nunca é justificada em largura total
        lines.push({
          words: curWords,
          justify: false,
          gapWidth: 3,
          totalWidth: curWordsWidth + (curWords.length - 1) * 3
        });
      }
    }

    return lines;
  }

  function drawJustifiedPixelText(ctx, text, x, y, maxWidth = 999, lineHeight = 11, defaultCol = '#ffea31', shadowCol = '#000000') {
    x = R(x);
    y = R(y);
    const lines = wrapJustifiedLines(text, maxWidth);
    let cy = y;

    for (const line of lines) {
      if (!line.words.length) {
        cy += lineHeight;
        continue;
      }

      let curX = x;
      const gap = line.justify ? line.gapWidth : 3.5;

      for (let i = 0; i < line.words.length; i++) {
        const word = line.words[i];
        const col = word.color || defaultCol;
        const rx = R(curX);

        if (!renderHDCanvasLine(ctx, word.text, rx, cy, col, shadowCol, word.width + 6, lineHeight, 'left')) {
          let px = rx;
          for (let c = 0; c < word.text.length; c++) {
            const ch = word.text[c];
            if (ch === ' ') px += 3;
            else px += drawPixelChar(ctx, ch, px, cy, col, shadowCol);
          }
        }

        curX += word.width + gap;
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
  function decodeHiBitFrame(rows, pal, editFn = null) {
    const W = 64, H = 64;
    const [c, x] = mk(W, H);
    c.hib = true;
    const put = (px, py, col) => {
      const ix = Math.round(px), iy = Math.round(py);
      if (ix >= 0 && iy >= 0 && ix < W && iy < H && col) {
        x.fillStyle = col;
        x.fillRect(ix, iy, 1, 1);
      }
    };
    for (let sy = 0; sy < rows.length && sy < H; sy++) {
      const row = rows[sy];
      for (let sx = 0; sx < row.length && sx < W; sx++) {
        const ch = row[sx];
        if (!ch || ch === '.') continue;
        const col = pal[ch];
        if (col) {
          x.fillStyle = col;
          x.fillRect(sx, sy, 1, 1);
        }
      }
    }
    if (editFn) editFn(x, put);
    return c;
  }

  function buildBreathingFrame(rows, pal, cutY, editFn = null) {
    const W = 64, H = 64;
    const [c, x] = mk(W, H);
    c.hib = true;
    const put = (px, py, col) => {
      const ix = Math.round(px), iy = Math.round(py);
      if (ix >= 0 && iy >= 0 && ix < W && iy < H && col) {
        x.fillStyle = col;
        x.fillRect(ix, iy, 1, 1);
      }
    };
    for (let sy = cutY; sy < rows.length && sy < H; sy++) {
      const row = rows[sy];
      for (let sx = 0; sx < row.length && sx < W; sx++) {
        const ch = row[sx];
        if (ch && ch !== '.' && pal[ch]) put(sx, sy, pal[ch]);
      }
    }
    for (let sy = 0; sy <= cutY && sy < rows.length; sy++) {
      const row = rows[sy];
      for (let sx = 0; sx < row.length && sx < W; sx++) {
        const ch = row[sx];
        if (ch && ch !== '.' && pal[ch]) put(sx, sy - 1, pal[ch]);
      }
    }
    if (editFn) editFn(x, put);
    return c;
  }

  function buildOffsetFrame(rows, pal, dyOffset, editFn = null) {
    const W = 64, H = 64;
    const [c, x] = mk(W, H);
    c.hib = true;
    const put = (px, py, col) => {
      const ix = Math.round(px), iy = Math.round(py);
      if (ix >= 0 && iy >= 0 && ix < W && iy < H && col) {
        x.fillStyle = col;
        x.fillRect(ix, iy, 1, 1);
      }
    };
    for (let sy = 0; sy < rows.length; sy++) {
      const dy = sy + dyOffset;
      if (dy < 0 || dy >= H) continue;
      const row = rows[sy];
      for (let sx = 0; sx < row.length && sx < W; sx++) {
        const ch = row[sx];
        if (ch && ch !== '.' && pal[ch]) put(sx, dy, pal[ch]);
      }
    }
    if (editFn) editFn(x, put);
    return c;
  }

  function buildSilhouetteFrame(rows, pal, core, rim, accentFn) {
    const W = 64, H = 64;
    const [c, x] = mk(W, H);
    c.hib = true;
    for (let sy = 0; sy < H; sy++) {
      const row = rows[sy] || '';
      for (let sx = 0; sx < W; sx++) {
        const ch = row[sx];
        if (!ch || ch === '.') continue;
        const nL = sx > 0 ? row[sx - 1] : '.';
        const nR = sx < W - 1 ? row[sx + 1] : '.';
        const nU = sy > 0 ? (rows[sy - 1] || '')[sx] : '.';
        const nD = sy < H - 1 ? (rows[sy + 1] || '')[sx] : '.';
        const isEdge = nL === '.' || nR === '.' || nU === '.' || nD === '.';
        const col = isEdge ? rim : (accentFn ? (accentFn(sx, sy, pal[ch]) || core) : core);
        x.fillStyle = col;
        x.fillRect(sx, sy, 1, 1);
      }
    }
    return c;
  }

  function buildPortraitFromRows(rows, pal, sxOff, syOff, opts = {}) {
    const [c, x] = mk(28, 28);
    c._isDiamondBust = true;
    const isInsideDiamondMask = (px, py) => (Math.abs(px - 13.5) + Math.abs(py - 13.5)) <= 13.5;
    const put = (px, py, col) => {
      if (px >= 0 && py >= 0 && px < 28 && py < 28 && col && isInsideDiamondMask(px, py)) {
        x.fillStyle = col;
        x.fillRect(px, py, 1, 1);
      }
    };
    for (let py = 0; py < 28; py++) {
      const sy = py + syOff;
      const row = rows[sy] || '';
      for (let px = 0; px < 28; px++) {
        if (opts.trimBottomCorners && py >= 19 && (px <= 3 || px >= 24)) continue;
        if (!isInsideDiamondMask(px, py)) continue;
        const sx = px + sxOff;
        const ch = row[sx];
        if (!ch || ch === '.') continue;
        const col = pal[ch];
        if (col) put(px, py, col);
      }
    }
    if (opts.blink && opts.drawBlink) opts.drawBlink(put);
    if (opts.mouthOpen > 0 && opts.drawMouth) opts.drawMouth(put, opts.mouthOpen);
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

  // ============================================================================
  // PROTAGONISTA — SPRITES REAIS 64x64 (`main  masculino`) + RETRATO 28x28
  // ============================================================================
  const PROTAG_PIXEL_PALETTE = {
    "A": '#060606', "B": '#4e312b', "C": '#5a372e', "D": '#1e0f0b', "E": '#402723', "F": '#2f1b17', "G": '#925b46', "H": '#77422f',
    "I": '#91482d', "J": '#d78763', "K": '#e79b73', "L": '#423d3c', "M": '#ca7352', "N": '#ee9070', "O": '#878b89', "P": '#f6f6f5',
    "Q": '#3e1b11', "R": '#4b2519', "S": '#ba6246', "T": '#643221', "U": '#d08f54', "V": '#073460', "W": '#05172c', "X": '#041d3d',
    "Y": '#0e3e70', "Z": '#0f4477', "a": '#042951', "b": '#29262a', "c": '#1e6897', "d": '#40d3f7', "e": '#3688a6', "f": '#298fc4',
    "g": '#e2d0b1', "h": '#1e384c', "i": '#978065', "j": '#caae88', "k": '#f7e7c3', "l": '#0a4f87', "m": '#020915', "n": '#f9eed2',
    "o": '#b4977a', "p": '#ccb1a7', "q": '#61615e', "r": '#adadab', "s": '#a0deee', "t": '#a66a36', "u": '#12a0e7', "v": '#35777f',
    "w": '#4bb7e1', "x": '#587dab', "y": '#0d74af', "z": '#6fcfe8', "0": '#76edfa', "1": '#1cb3ed', "2": '#ddd9d9', "3": '#979890'
  };

  const PROTAG_IDLE_ROWS = [
    [
      '................................................................',
      '................................................................',
      '.............................AAAA...............................',
      '.............................ABBBAA.............................',
      '......................AB...AAAABBBBA...A........................',
      '.....................ACBB.DBBBBBBEBBEABA........................',
      '......................CBBBBBBBBBBBEBBFBA........................',
      '.......................BBBBBBBBBEBFFEBBBA.......................',
      '.....................AABBBBBBFBFBFBFEBBBBA......................',
      '....................AGGBBBBBBFBBBBBFBBBBGHA.....................',
      '..................AAEGGHBBBBFBBBBBBBBBBGGBD.....................',
      '..................ABBBBHHBBBFBBBBBBBBBGBBBA.....................',
      '...................FFBBBHBIEHHBBBBBEBBCBEBBA....................',
      '...................ABBBBBBBFBHHHBBBEBBBBFBBBAA..................',
      '..................ABBFBBBBBFBBBBBBBEBBBBBBBBBA..................',
      '..................ABBBBBEBEDBBBBBBDFCBBBBEBFA...................',
      '.................AEBFBBBEBEJFBBBEEKKDBEBBFBEL...................',
      '................ABBBFBBEEDEFABBBDJFFFFEBBDEBD...................',
      '.................AFFDBBEDMKKKDBBDKKNNNEBBDEA....................',
      '..................AEABBDMBAAFKABBBFAAACBEEEA....................',
      '..................AEBFBDHOFFFKKKMKPFFOHBDJAFA...................',
      '.................ABDJHEDAPQAFKKKKKRAFPIFSJAAA...................',
      '..................AAKMDFKPTQBKKKKKTRTKGSKJA.....................',
      '....................CKMGKKPTKKKKKKSKKKGKKA......................',
      '.....................AUGKKKKKKKKKKKKKKAAA.......................',
      '......................AAAKKKKKGKSKKKKAVA........................',
      '......................AAVAKKKKKKKKKKAWXVA.......................',
      '......................AYWXAAKKKKKKJAWYYYA.......................',
      '.....................AVYZZVXAAGIIAAXVYYYVA......................',
      '.....................AZZYYZZVVDMILYYYYVYZA......................',
      '......................AAXXXXXaVAXVXXXXaXA.......................',
      '.......................AVVXHHbcdeHXaaYYYA.......................',
      '......................WVYYZWIIDfAWVYYYYYV.......................',
      '......................DZYYZZAHIQgVVXaYYYZA......................',
      '.....................aYYYaWaVAIIEVVVaWDZYVD.....................',
      '.....................VVXhiWZYZAIIEYYVbgXXYa.....................',
      '....................WXHjkjXZYlkAIHEYVAkkjmaA....................',
      '...................WWkkjjiYZZlnkAIHFVAkokkpXD...................',
      '...................WgkknkAZZYlnjkAIIFaonkkgbVW..................',
      '..................XVqiknkAXXXXUUKaAIIQjkgroVVV..................',
      '.................XVVDSSSiATHTGfsltTFIIFSSSHVVVW.................',
      '...............bVVVVWKKKSATTTGfultTFTRITKKHVYYVXb...............',
      '.............bvlYVYVWKKKAXXAAAShUADATRITDKKAYYVelb..............',
      '.............lccZYYXWKKKAYVYVcFWAlaaRHTIAKKAZYccwhh.............',
      '............hweweZZXWKKKhYYYVVgfgZlVAHFUAKKAZZcwcww.............',
      '............bfwwwclWWKKDYYYYfOkVgxlZAHIQDKNAclclwcL.............',
      '.............wcecccaWJKAVYYYugkVkgylAHTTTJDVfclweL..............',
      '.............adwlwwXXAAAVXXZlVZVZZalaFTHIFXlccewA...............',
      '..............hwcaclXXXAYYZXXZVaaYaaVATTTAWYceeW................',
      '...............Fc.WefalAZZZZZZaXXVYZZVAAbyXhcvF.................',
      '....................AfWlZZZZZZaXXYZZZZYYXWh.L...................',
      '.....................DAZZZZZZZVWXVZZZZZZYA......................',
      '......................AZYZZZZZZWWYZZZZZZYA......................',
      '......................AZVVZZZYVAFVZZZZVaYA......................',
      '.......................AVXZVVVA..XXVaaVaA.......................',
      '........................ABBbWA.....WXbbF........................',
      '.......................AHHHHHTA...AHHHHHA.......................',
      '.......................AFFFTTQA...AQTTFDA.......................',
      '.......................AEHTEEA.....AEEHRA.......................',
      '......................ACCCFBBA.....ABBFBBA......................',
      '.....................ACCCCBBBA.....ABBCBBBA.....................',
      '.....................AEEBBEDEA.....AEDEEEEA.....................',
      '......................AAAAAAA.......AAAAAA......................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '.............................AAAAA..............................',
      '.............................ABBBBAA............................',
      '......................AC...AAAABBBBBA..A........................',
      '......................ABBDDBBBBBBBEBBABA........................',
      '.......................BBBBBBBBBBBBEBFBA........................',
      '......................DBBBBBBBBFBFFFEBBBA.......................',
      '.....................AGBBBBBBFBBBBBFEBBBBA......................',
      '..................AAACGGBBBBFBBBBBBFBBBBGHA.....................',
      '..................ABBBBHHBBBFBBBBBBBBBBGGBD.....................',
      '...................FFBBBHBIEHHBBBBBBBBGBBBA.....................',
      '...................ABBFBBBBFBHHHBBBEBBCBEBBA....................',
      '..................ABBFBBBBBFBBBBBBBEBBBBFBBBAA..................',
      '..................ABBFBBEBEDBBBBBBDFCBBBBBBBBA..................',
      '.................AEBFBBBEBEJFBBBEEKKDBEBBEBFA...................',
      '................ABBBFBBEEDEFABBBDJFFFFEBBFBEL...................',
      '.................AFFDBBEDMKKKDBBDKKNNNEBBDEBD...................',
      '..................AEABBDMBAAFKABBBFAAACBBDEA....................',
      '..................AEBFBDHOFFFKKKMKPFFOHBEEFA....................',
      '.................ABDJHEDAPQAFKKKKKRAFnCBDJAFA...................',
      '..................AAKMDFKPTQBKKKKKTQRPIFSJAAA...................',
      '....................CKMGKKPTKKKKKKSHjKGSKJA.....................',
      '.....................AJGKKKKKKKKKKKKKKGKKA......................',
      '......................AAAKKKKKGKSKKKKKAAA.......................',
      '.......................AVAKKKKKKKKKKKAVA........................',
      '......................AYWXAAKKKKKKKJAWXYA.......................',
      '......................AYVVaXADIIIIAAXYYYA.......................',
      '.....................AYYYYZZZAMMMIXYYYYYVA......................',
      '.....................AZZZZZZZZAMHYZZYYVYYA......................',
      '......................AAXXXXXaVAXVXXXXaWA.......................',
      '.......................AYVXHHbcdeGXaaYYYA.......................',
      '......................WVYYZWIIDyAWVYYYYYV.......................',
      '......................WZYYZZAHIQgVVXaYYYZA......................',
      '.....................DYYYaWaVAIIEVVVaWDZYV......................',
      '....................bYVXAiWZYZAIIEYYVbgXmYA.....................',
      '....................WXbjkjXZYlkAIHEYVAkkjmaD....................',
      '....................WgkjjiYZZlnkAIHFVAkokkpW....................',
      '....................bknnkAZZYlnjkAIIFaonkkpF....................',
      '...................mhMknkAXXXXUUKaAIIQjkgrGVW...................',
      '..................DVWMSSiATHTGfsltTFIIFSSSHVV...................',
      '..................XVmKKKSATTTGfultTFTRITKKHAYVW.................',
      '.................WVVWKKKAXXAAAShUADATRITDKKAYYV.................',
      '................WVZYWKKKAYVYVcFWAlaaRHTIAKKAZlfVh...............',
      '...............blwcYWKKKhYYYVVgfgZlVAHFUAKKAZlfccb..............',
      '..............LccfyZWKKAYYYYfOkVgxlZAHIQDKNAlllfww..............',
      '.............DflwcfcVAKAVYYYugkVkgylAHTTTJDlfcfcwb..............',
      '.............DwzcwclXXAAVXXZlVZVZZalaFTHIFXcwylwh...............',
      '..............bdlZddXXXAYYZXXZVaaYaaVATTTAYZZzzV................',
      '...............bddccyfZAZZZZZZaXXVYZZVAAblVcffA.................',
      '................Lhb.DWWlZZZZZZaXXYZZZZYYXhbWD...................',
      '.....................DAZZZZZZZZWXVZZZZZZYA......................',
      '......................AZYZZZZZYWWYZZZZZZYA......................',
      '......................AZVVZZZYVA.YZZZZVaYA......................',
      '.......................AVXZVVVA...XVaaVaA.......................',
      '........................ABBbWA.....WXbbF........................',
      '.......................AHHHHHTA...AHHHHHA.......................',
      '.......................AFFFTTQA...AQTTDDA.......................',
      '.......................ARHTEEA.....AEEHRA.......................',
      '......................ACCCFBBA.....ABBFBBA......................',
      '.....................ACCCCBBBA.....ABBCBBBA.....................',
      '.....................AEEBBEDEA.....AEDEEEEA.....................',
      '......................AAAAAAA.......AAAAAA......................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '.............................AAAAA..............................',
      '.......................A.....ABBBBAA............................',
      '......................ACA..AAAABBBBBA..A........................',
      '......................ABBBDBBBBBBBEBBABA........................',
      '.......................DBBBBBBBBBBBEBFBA........................',
      '......................ABBBBBBBBFBFFFEBBBA.......................',
      '.....................AGBBBBBBFBBBBBFEBBBBA......................',
      '..................AAACGGBBBBFBBBBBBFBBBBGHA.....................',
      '..................ABBBBHGBBBFBBBBBBBBBBGGBD.....................',
      '...................FFBBBHBIEHHBBBBBBBBGBBBA.....................',
      '...................ABBFBBBBFBHHHBBBEBBCBEBBA....................',
      '..................ABBFBBBBBFBBBBBBBEBBBBFBBBAA..................',
      '..................ABBFBBEBEDBBBBBBDFCBBBBBBBBA..................',
      '.................AEBFBBBEBEJFBBBEEKKDBEBBEBFA...................',
      '................ABBBFBBEEDEFABBBDJFFFFEBBFBEL...................',
      '.................AFFDBBEDMKKKDBBDKKNNNEBBDEBD...................',
      '..................AEABBDMBAAFKABBBFAAACBBDEA....................',
      '..................AEBFBDHOFFFKKKMKPFFOHBEEEA....................',
      '.................ABDJHEDAPQAFKKKKKRAFnCBDJAFA...................',
      '..................AAKMDFKPTQBKKKKKTQRPIFSJAAA...................',
      '....................CKMGKKPTKKKKKKSHjKGSKJA.....................',
      '.....................AJGKKKKKKKKKKKKKKGKKA......................',
      '......................AAAKKKKKGKSKKKKKAAA.......................',
      '.......................AVAKKKKKKKKKKKAVA........................',
      '......................AYWXAAKKKKKKKJAWXYA.......................',
      '......................AYVVaXADIIIIAAXYYYA.......................',
      '.....................AYYYYZZZAMMMIXYYYYYVA......................',
      '.....................AZZYZZZZZAMHYZZYYVYYA......................',
      '......................AAXXXXXaVAXVXXXXaWA.......................',
      '.......................AYVXHHbcdeGXaaYYYA.......................',
      '......................WVYYZWIIDyAWVYYYYYV.......................',
      '......................WZYYZZAHIQgVVXaYYYYA......................',
      '.....................DYYYaWaVAIIEVVVaWDZYVD.....................',
      '....................WYVXAiWZYZAIIEYYVbgXAYV.....................',
      '....................WWbjkjXZYlkAIHEYVAkkjmaA....................',
      '....................WgkjjiYZZlnkAIHFVAkokkpW....................',
      '...................mWknnkAZZYlnjkAIIFaonkkpbD...................',
      '..................FahMknkAXXXXUUKaAIIQjkggHVm...................',
      '..................WVWMSSiATHTGfsltTFIIFSSSHaVA..................',
      '.................bVVWKKKSATTTGfultTFTRITKKHAYW..................',
      '.................DYVWKKKAXXAAAShUADATRITDKKAYVm.................',
      '................baYYWKKKAYVYVcFWAlaaRHTIAKKAYYW.................',
      '................XlYYWKKKhYYYVVgfgZlVAHFUAKKAZZl.................',
      '...............DlfZZWKKAYYYYfOkVgxlZAHIQDKNAlZwX................',
      '...............WdwwZVAKAVYYYugkVkgylAHTTTJDZlwwcW...............',
      '..............bwwfyfaXAAVXXZlVZVZZalaFTHIFXflycyw...............',
      '..............DwwZcwaWXAYYZXXZVaaYaaVATTTAXfwllzA...............',
      '...............XdylyfVYAZZZZZZaXXVYZZVAAblVylz0F................',
      '................Ad0zhcWlZZZZZZaXXYZZZZYYXWlczXA.................',
      '.................AhdwXAZZZZZZZaXXVZZZZZZYAhwh...................',
      '...................A..AZYZZZZZZWWYZZZZZZYA.D....................',
      '......................AZVVZZZYVAFVZZZZVaYA......................',
      '.......................AVXZVVVA..bXVaaVaA.......................',
      '........................ABBbWA.....WXbbF........................',
      '.......................AHHHHHTA...AHHHHHA.......................',
      '.......................AFFFTTQA...AQTTFDA.......................',
      '.......................AEHTEEA.....AEEHRA.......................',
      '......................ACCCFBBA.....ABBFBBA......................',
      '.....................ACCCCBBBA.....ABBCBBBA.....................',
      '.....................AEEBBEDEA.....AEDEEEEA.....................',
      '......................AAAAAAA.......AAAAAA......................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '.............................AAAAA..............................',
      '.............................ABBBBAA............................',
      '......................HA...AAAABBBBBA..A........................',
      '.....................ACBBADBBBBBBBEBBABA........................',
      '.....................ACBBBBBBBBBBBBEBFBA........................',
      '......................ABBBBBBBBFBFFFEBBBA.......................',
      '.....................ABBBBBBBFBBBBBFEBBBBA......................',
      '..................AAACGGBBBBFBBBBBBFBBBBGHA.....................',
      '..................ABBBBHBBBBFBBBBBBBBBBGGBD.....................',
      '...................FFBBBHBIEHHBBBBBBBBGBBBA.....................',
      '...................ABBFBBBBFBHHHBBBEBBCBEBBA....................',
      '..................ABBFBBBBBFBBBBBBBEBBBBFBBBAA..................',
      '..................ABBFBBEBEDBBBBBBDFCBBBBBBBBA..................',
      '.................AEBFBBBEBEDBBBBEEKKDBEBBEBFA...................',
      '................ABBBFBBBEEEFDBBBDJFFFFEBBFBEL...................',
      '................ABBBDBBEEDFFDDBBDKKNNNEBBDEBD...................',
      '.................AFEABBEDMAAKKABBBFAAACBBDEA....................',
      '..................AEBFBDMBAAFKKKMKPFFOHBEEFA....................',
      '.................AEDJHEDEOQAFKKKKKRAFOCBDJAFA...................',
      '.................AADKMDFKPTQBKKKKKTQRPIFSJAAA...................',
      '...................DKJMGKKPTKKKKKKSHjKGSKJA.....................',
      '....................BAJGKKKKKKKKKKKKKKGKKA......................',
      '......................AAAKKKKKKKKKKKKKAAA.......................',
      '.......................AVAKKKKKKKKKKKAVA........................',
      '......................AYWXAAKKKKKKKJAWXVA.......................',
      '......................AYVVaXADIIIIAAXYYYA.......................',
      '.....................AVYYYZZZAMMMIXYYYYYVA......................',
      '.....................AZZZZZZZZAMHYZZYYVYZA......................',
      '......................AAXXXXXaVAXVXXXXaXA.......................',
      '.......................AVVXHHbcdeHXaaYYYA.......................',
      '......................WVYYZWIIDyAWVYYYYYV.......................',
      '......................WZYYZZAHIQgVVXaYYYYA......................',
      '.....................DYYYaWaVAIIEVVVaWDZYV......................',
      '.....................YVXWiWZYZAIIEYYVbgXWYW.....................',
      '....................WXbjkjXZYlkAIHEYVAkkjmaD....................',
      '....................WgkjjiYZZlnkAIHFVAkokkpW....................',
      '....................WknnkAZZYlnjkAIIFaonkkpD....................',
      '...................AhMknkAXXXXUUKaAIIQjkggCaA...................',
      '...................VWMSSiATHTGfsltTFIIFSSSHVa...................',
      '..................WVmKKKSATTTGfultTFTRITKKHAVD..................',
      '.................DVVWKKKAXXAAAShUADATRITDKKAVW..................',
      '.................DYYWKKKAYVYVcFWAlaaRHTIAKKAYW..................',
      '.................WYYWKKKhYYYVVgfgZlVAHFUAKKAYVW.................',
      '.................XYZWKKAYYYYfOkVgxlZAHIQDKNAZZX.................',
      '................WdwZVAKAVYYYugkVkgylAHTTTJDZldeD................',
      '...............bhddyVXAAVXXZlVZVZZalaFTHIFXlwwwW................',
      '...............DdwfyyXXAYYZXXZVaaYaaVATTTAelcdfw................',
      '...............bedllwaVAZZZZZZaXXVYZZVAAblcel0wW................',
      '.................W0zcYWlZZZZZZaXXYZZZZYYXXcldeA.................',
      '.................DAdlVAZZZZZZZaXXVZZZZZZYmcdeD..................',
      '...................md.AZYZZZZZZWWYZZZZZZYAdbL...................',
      '....................D.AZVVZZZYVAFYZZZZVaVADA....................',
      '.......................AVXZVVVA...XVaaVaA.......................',
      '........................ABBbWA.....WXbbF........................',
      '.......................AHHHHHTA...AHHHHHA.......................',
      '.......................AFFFTTQA...AQTTDDA.......................',
      '.......................ARHTEEA.....AEEHRA.......................',
      '......................ACCCFBBA.....ABBFBBA......................',
      '.....................ACCCCBBBA.....ABBCBBBA.....................',
      '.....................AEEBBEDEA.....AEDEEEEA.....................',
      '......................AAAAAAA.......AAAAAA......................',
      '................................................................'
    ]
  ];

  const PROTAG_WALK_ROWS = [
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '........................................AAAAA...................',
      '......................................AABBBBA.....A.............',
      '..................................A..ABBBBBAAAA..ACA............',
      '..................................ABABBBEBBBBBBEEBCA............',
      '..................................ABDBEFBBBBBBBBBBD.............',
      '..............................AAAAFBBBEFFFFBFEFBBBBAA.AA........',
      '..............................ABBBGBBBFFBBBBBBBFBBBBAABA........',
      '...............................ABBBGBBBFBBBBBBBBFBBBBBF.........',
      '................................ABBBGBBBBBBBBBBBEEBBtBD.........',
      '............................AAAABBBBBBtBBBBBBBBHHEtBBBBA........',
      '............................ABBBBBBBBBBBBBFBBHHHBFBBBBFBA.......',
      '.............................ABBBBBBFBBBBBFBBBBBBFBBBBBBEA......',
      '..........................AWALFBBBBFBBBBBFKFBBBBBFDBBBBEBDA.....',
      '.........................AllZAEBFCBFBBBBFKKKFFBBCFKFBEBFA.......',
      '........................AZZZAABFFFBFBBCFKFFKKFBBFKKJEEEA........',
      '.......................AZZZaABEFFFFFBBFKKKMFKDCFKKFEMFCA........',
      '......................AZZZZZZAAFFFFFBBFKKFAAFFFKKEAAAFCA........',
      '......................AZZZZZZZAAFFKHFCFKIOPFFJSKKPFqAFA.........',
      '......................AVaZZZZZZAAKItKFFKKPEAEKKKKFAPAA..........',
      '.................AAAAAAAWYYZZZZZAKKtKKAKKPBBBKKKKBBP............',
      '.............AAAAZYYVVVVZXAAYZZZXAKSKKKKKKPHKKKKSHPA............',
      '............AZZZZZZZZZZZZZYXAXZZZZAKKMKKKKKKKKKKMKKA............',
      '...........AZZZZZZZZZZZZZZZZZZXXXZZAAtGKKKKKFKKKKKKA............',
      '..........AlZZZZZZZZZZZZZZZZZZZZZXZZZYGGKKKKKMAAAKA.............',
      '.........AZZZZZZZZYZYYZYZZZZZZZZZZaXZZZGIUKKKAAKKA..............',
      '........AeZZZZZZZAAAAAAAAAZZZZYYYYYYXXaYShAAAKKKKKA.............',
      '........A1YYZZZAAfffaWXXXXAAAAAAAmmaYYmAAVZAAKKKKKKA............',
      '........A00VYAA1faaac1XXXXXXaXWXhEiDAA2gkoikpAKKKKKA............',
      '........Ac0caAAAA11VWV1yXXXXXAZZYaApkkkknjonIFKKKKKA............',
      '........AYdcA....AA1ffmffWXXAZZZZZmWgkkknoknIKKKKAA.............',
      '........AdcA.......DA11aa1XWAlZZZZYWWoknkkknMKKKAA..............',
      '........DdA..........AA1aauAEAYZZZYYAAppnJnnMKNA................',
      '.........DD............AAAAATTAYZZYYajApiknkHTD.................',
      '.......................AZYYaAHTAmlYaknaAogpkKD..................',
      '.............AAA.......AlZZZWATTAAAiMFA..AAAA...................',
      '............AFEBAAAA....AlZZlAATTTxPctAOX.......................',
      '............AAFBCFEHFA...XlllZYAATJyGl1flA......................',
      '...........AABBCBFTaWYAAAallZlZyAAAAkf10l.......................',
      '..........ADBCCCFHHaYZZWaaWY11u2kkYZlnknA.......................',
      '.........AFBCCGFCIaalZaaYZaYyZknlllZZZZYlA......................',
      '.........AECCFIFHHaZZZaYZZYZYZZYZZZaZZZZZZA.....................',
      '.........ABCCHAAHFVlZZYYZZYZZZYYYXZZZZZZZZZA....................',
      '.........ABBA...AAAlZZZZZZZZZYZAAaaaZZZZZZZZA...................',
      '..........AA.......AYZZZZZZZZAA.AAaaaaZZZZZZZA..................',
      '....................AAZZZZZAAA....AAVaZZZZZZZa..................',
      '......................AAAAA.........AVaZZZZZYaA...AAAA..........',
      '.....................................AZZZZZZaHTA.ACCEFA.........',
      '......................................AZZZZXCHEEAHCBDDA.........',
      '.......................................AYZaFCBFTFHBFAAA.........',
      '........................................AAAHCFBBCCFAAA..........',
      '..........................................ATEEBBFEAAA...........',
      '...........................................DABBBDAAAA...........',
      '............................................AATFFAAA............',
      '.............................................ADFAA..............',
      '..............................................AAAA..............',
      '...............................................AA...............',
      '................................................................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '........................................AAAAA...................',
      '......................................AABBBBA.....A.............',
      '..................................A..ABBBBBAAAA..ABA............',
      '..................................ABABBBFBBBBBBFFBCA............',
      '..................................ABDBEFBBBBBBBBBBA...AA........',
      '..............................AAAAEBBBEFFFFBFEFBBBBAA.CA........',
      '..............................AABBSBBBFFBBBBBBBFBBBBAABA........',
      '...............................ABBBGBBBFBBBBBBBBFBBBBBF.........',
      '............................AAA.ABBBGBBBBBBBBBBBBEBBtBD.........',
      '............................ABBABBBBBBtBBBBBBBBHHESBBBBA........',
      '.............................ABBBBBBBBBBBBFBBBHHBFBBBBFBA.......',
      '..............................DBBBBBFBBBBBFBBBBBBFBBBBBBBDA.....',
      '..........................AAAWFBBBBFBBBBBDKJDBBBBFFBBBBEA.......',
      '.........................AllVABBFBBFBBBBDKKKKDBBBDKFBEBDA.......',
      '........................AZZVABBFFFBFBBBFKFDKKDBBFKKKEEBA........',
      '........................XZZaaDAFFFFFBBDKKKMFKKBFKKFENFBA........',
      '...........AAAAAAAA....AZZZZZZAAFFFFBBFKNDAADKDKKFAAAEDA........',
      '..........AcZZZZZZYWAA.AZZZZZZZAAFKHDBFKHoPFFKMKKPFLAEA.........',
      '.........WfZZZZZZZZZZZAAVVZZZZZZANHGKDFKKPEAEKKKKFDPAA..........',
      '........AdfZZZZZZZZZZZZVVaZZZZZZANKGKKAKKPBEEKKKKHEP............',
      '.......Ay00ZZZZZZZZZZZZZZaAaZZZZZAKGKKKKKKPHKKKKSHPA............',
      '......Ddy0YZZZZZZZZZZZZZZZZXAaZZZlANKSKKKKKKKKKKtKKA............',
      '.....DdycAAAAAAAAZZZZZZZZZZZZXaZlllVASGKKKKKDKKKKKKA............',
      '.....DDAD........AAZZZZZZZZZZZZXXXXZZZISKKKKKSJKKKA.............',
      '.....D.............AAZZZZZZZZZZZZZYVXVYYSMKKKKKKKA..............',
      '.....................AAAAZZZZZZZZZZZZZXaMlAKKKNAA...............',
      '........................AAAAAAAAAAAAAAVVXucAAAAA................',
      '.............................AaVAnkkkkAalVAAAA..................',
      '............................AZllAnkkkkjAAANDKKA.................',
      '............................AlllAnkkkoigkAKKKKKA................',
      '...........................AEAlZAkkkokgnTAKKKKKA................',
      '...........................ACAAZAOngkkPGHKKKKKKA................',
      '.......................AAAAAATTAApoJkkJSKKKKKKKA................',
      '....................AAAAlZZXAATTAAgnkkSKKKKKAAA.................',
      '..................ADFECAZZZZZAATCEAxnGSKKKAA....................',
      '..................ADFCCLAlZZZlhAAHjXkSFAAA......................',
      '...............AAAECCCBEHAYZZZYyAAAAnAW0Z.......................',
      '..............AEFCCCCFETCAZZ1uuknkYZZnkkA.......................',
      '..............ADCCEICFHSaAVVyYknZZZZZZZZZA......................',
      '..............ACTCESFTHXVAVVZlZZZZZZZZZZZZA.....................',
      '..............ABBFAAAIaZZXZZZZZZZZZZZZZZZZZA....................',
      '...............ADD...AalZWZZZZZZZlAVaZZZZZZA....................',
      '......................AlZZZZZZZZZAAaVZZZZZZA....................',
      '......................AlZZZZZZZZcA.AAZZZZZZA....................',
      '.......................AZZZZZZZlA..AYZZZZZlA....................',
      '.......................DWZZZZZlA...AZZZZZZZ.....................',
      '........................AAZZZZA....AaaZZZYA.....................',
      '..........................AAAA....AIITXXXXX.....................',
      '..................................AECTHHID......................',
      '..................................AFFFFFF.......................',
      '..................................ACBBHIFAAAA...................',
      '..................................ACBBBBIIIHTA..................',
      '..................................AFFFBBHCCCCA..................',
      '..................................AEFAEFEEEEEA..................',
      '..................................AAAAAAAAAAAA..................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '........................................AAAAA...................',
      '......................................AABBBBA.....A.............',
      '..................................A..ABBBBBAAAA..ABA............',
      '..................................ABABBBFBBBBBBFFBCA............',
      '..................................ABDBEFBBBBBBBBBBA.............',
      '................................AAEBBBEFFFFBFEFBBBBAA...........',
      '.............................ABBBBSBBBFFBBBBBBBFBBBBAAAAA.......',
      '..............................AABBBGBBBFBBBBBBBBFBBBBBBA........',
      '................................ABBBGBBBBBBBBBBBBEBBtBA.........',
      '..............................AABBBBBBtBBBBBBBBHHESBBBBA........',
      '............................AAEBBBBBBBBBBBFBBHHHBFBBBBFEA.......',
      '............................AEBBBBBBFBBBBBFBBBBBBFBBBBBBB.......',
      '.............................LFBBBBFBBBBBDKFBBBBBFFBBBBBCA......',
      '.............................ACBFBBFBBBBDKKKDEBBBDKFBEBFDA......',
      '.............................ABFFFBFBBBFKFDKKDBBFKKKEEBA.A......',
      '............................AFFFFFFFBBDKKKMFKKBFMKFEIFBA........',
      '............................AAAFFFFFBBFKNDAADKDiKFAAAECA........',
      '..............................AAFFKHDBFKHoPFFKHKKPFqAEA.........',
      '...............................AANHGKDFKKPEAEKKKKFDPAA..........',
      '......AAAAAAA............AAAAAAAANKGKKAKKPBEEKKKKEBP............',
      '......AdX1fldWAAA......AWYZZZZZZVAKGKKKKKKPHKKKKSHPA............',
      '.......Adlf0fcZZYAAAA.AVYZZZZZZZZZANKSKKKKKKKKKKtKKA............',
      '........Wddd1YZZZZZZZWAXVZZZZZZXXYlAASGKKKKKDKKKKKKA............',
      '........DuZZZZZZZZZZZZVVXaaaaaZlZVaZZZSSKKKKKSJKKKA.............',
      '.........DlZZZZZZZZZZZZZYaaVYlAAAllaXZVMSSKKKKKKKA..............',
      '..........AYZZZZZZZZZZZZZZZVZAkkkAAcVaVVMfANKKKAA...............',
      '...........DDZZZZZZZZZZZZZlAAkkkkkkAlVaah1fAAAA.................',
      '.............AZZZZZZZZZZZlAokkkkkkkgAAAlYlyD....................',
      '..............AAAZZZZZlAAAggMkoookgWllkAAAZA....................',
      '.................AAAAAA.AjjkkkkkiiWAZZkOkkAAAA..................',
      '........................ApkgkkkkknWlYgkkphAKKKA.................',
      '........................AopGttSSTkkAAAkkYAKKIKKA................',
      '.........................DFKKKKKKFDKKKAcAAoKIKSA................',
      '.........................AAAMKKKKKKKKKKAITTKHHKA................',
      '........................AllZAAKKKKKKKKKAAAHHTKAA................',
      '.......................AZZZZZAAKKKKKKNA...AGSKD.................',
      '.......................AlZZZYZllAKKKKA1....AAA..................',
      '........................FlZZudunkAAKNA1V........................',
      '........................hAAVyYknZllAAkPf........................',
      '.......................AAAAAhVZZZZZZZAp.........................',
      '......................AFFCEEAaZZZZZZZWA.........................',
      '......................AFBCFTGXWZZZZZZZA.........................',
      '......................AEBCFTIVYXZZZZZZA.........................',
      '.....................AFBBCFTIalZaaZZZZA.........................',
      '....................AFFBBSFEIalZZZZZZZA.........................',
      '....................AEBBEFAAAAWlZZZZZA..........................',
      '....................AEBBTMAAZZAllllVA...........................',
      '....................ABBBEDAAVVaAAAAAA...........................',
      '.....................AAAD.AIIhhVVYA.............................',
      '..........................DFTHIIBA..............................',
      '.........................AEEFFEBI...............................',
      '.........................ABBBBGFAAAA............................',
      '.........................ABBBBBTHTTTA...........................',
      '.........................AFFFBBHBBTTA...........................',
      '.........................AEEAFFFFFEEA...........................',
      '.........................AAAAAAAAAAAA...........................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '........................................AAAAA...................',
      '......................................AABBBBA.....A.............',
      '..................................A..ABBBBBAAAA..ABA............',
      '..................................ABABBBFBBBBBBFFBCA............',
      '..................................ABDBEFBBBBBBBBBBA.............',
      '................................AAEBBBEFFFFBFEFBBBBAA...........',
      '.............................ABBBBSBBBFFBBBBBBBFBBBBAAAAA.......',
      '..............................AABBBGBBBFBBBBBBBBFBBBBBBD........',
      '................................ABBBGBBBBBBBBBBBBEBBtBD.........',
      '...............................ABBBBBBtBBBBBBBBHHESBBBBA........',
      '............................AAABBBBBBBBBBBFBBHHHBFBBBBFB........',
      '............................ABBBBBBBFBBBBBFBBBBBBFBBBBBBBA......',
      '.............................ABBBBBFBBBBBDKFBBBBBFFBBBBECA......',
      '.............................LFBFBBFBBBBDKKKDEBBBDKFBEBEDA......',
      '.............................ABFFFBFBBBFKFDKKDBBFKKKEEBA.A......',
      '.............................FFFFFFFBBDKKKMFKKBFMKFENFBA........',
      '............................AAAFFFFFBBFKNDAADKDFKFAAAECA........',
      '..............................AAFFKHDBFKHoPFFKHKKPFLAEA.........',
      '...............................AANHGKDFKKPEAEKKKKFDPAA..........',
      '................................AKKGKKAKKPBEEKKKKEBP............',
      '............................AAAAWAKGKKKKKKPHKKKKSHPA............',
      '........................AAAAAAlVaZANKSKKKKKKKKKKtKKA............',
      '......................AokMkkkkAlZXlAASGKKKKKDKKKKKKA............',
      '.....................AkkkJMkkkkAYZaZZZSSKKKKKSGKKKA.............',
      '....................AAMkkkkkkkkkAllaZZStGMKKKKKKKA..............',
      '....................AAtMkkkKkkkkkAVlaZVNNlWNKKNDA...............',
      '...................AcANNtkkKopkoopAAlaVWNlcAAAA.................',
      '..................AlZANNtIkkioAAXXZZAVaZYdcVADA..AAAA...........',
      '..........A......AZZZANNKJHkAAaVZZZlZAWYYlcVAiAAAKJJKA..........',
      '......AAAVXAAAAAAZZZAAKKKAAAAXVaZZZZZk2AAAAAkGPAGKtMKKA.........',
      '......AdfVdyZZYYYZZAXAKKKKKAAlZZZZZVckknkkAkGkkAMKtHIKA.........',
      '.......DudfduVYZZAAaXAKKKKKNAAZZZZZXkkkkkWppnPHHEGgHKKA.........',
      '........AAflZZVAAfcfuANKKKKKATAZZZV2kkkplqoknGSJIHHHMKA.........',
      '..........DAAAAAlfYXXANNNNKNAHTAAAakkkkyAAopnGKKMSSMAA..........',
      '................hDDuffAMNJKAAATTAAcoiDAA..ABPMMKKAAA............',
      '...................AAyhAAAAllAATEElnaSA.....AAAAA...............',
      '.....................AAAYlllllyAACkAAAA.........................',
      '........................hllZlluuOkZZZZZWAA......................',
      '.........................alZ11kkZYZZZZZZZZA.....................',
      '.........................AAAlZYVZZZZZZZZZZZA....................',
      '........................AVaaAVYZZZZZZZZZZZZA....................',
      '.......................AaaaaAAWWaVZZZZZXZZlA....................',
      '......................AZZaaaVVXXAAAaZZZZZZlA....................',
      '.....................AZZZZZZZVaVAHhaZZZZZZA.....................',
      '....................AlZZZZZZZlhAATtXaYZZZA......................',
      '...................AlZZZZZZZZADABEHttaalA.......................',
      '..................AZVlZZZZZZA.AECBFBTIHA........................',
      '.................AIhXZZZZZZA..AEBCCFFA..........................',
      '................AEBHLXZZZZA...AEFCCITT..........................',
      '...............ABBFHHIXVah.....AABBBHtHA........................',
      '..............ABBBBDEHqAB.......AECCHIGA........................',
      '..............AFBCCCFDD..........AFBBBHA........................',
      '..............AFFCCCIDF...........AECCHA........................',
      '...............AAECCCIHW...........AAAA.........................',
      '................AEBCCHHHA.......................................',
      '................DAEBBBBBA.......................................',
      '.................AAFFFFEA.......................................',
      '...................AAAAAA.......................................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '........................................AAAAA...................',
      '......................................AABBBBA.....A.............',
      '..................................A..ABBBBBAAAA..ABA............',
      '..................................ABABBBFBBBBBBFFBCA............',
      '..................................ABDBEFBBBBBBBBBBA.............',
      '..............................AAAAEBBBEFFFFBFEFBBBBAA.AA........',
      '..............................ABBBSBBBFFBBBBBBBFBBBBAABA........',
      '...............................ABBBGBBBFBBBBBBBBFBBBBBF.........',
      '................................ABBBGBBBBBBBBBBBBEBBtBD.........',
      '............................AAAABBBBBBtBBBBBBBBHHESBBBBA........',
      '............................ABBBBBBBBBBBBBFBBHHHBFBBBBFBA.......',
      '.............................ABBBBBBFBBBBBFBBBBBBFBBBBBBBA......',
      '..............................DBBBBFBBBBBDKFBBBBBFFBBBBEBDA.....',
      '.............................ABBFBBFBBBBDKKKDDBBBDKFBEBEA.......',
      '............................AAFFFFBFBBBFKFDKKDBBFKKKEEBA........',
      '............................AAFFFFFFBBDKKKMFKDBFKKFENFBA........',
      '.......................AAA....AFFFFFBBFKNDAADKDKKFAAAECA........',
      '.....................AAkggA.AAAAFFKHDBFKHoPFFKKKKPFLAEA.........',
      '....................AkknKJnDAXaVANHGKDAKKPEAEKKKKFDPAA..........',
      '.................AAAAIknkJkkkAlaANKGKKAKKPBEEKKKKEBP............',
      '...............AAZZZAMSnkKkkkkVVXAKGKKKKKKPHKKKKSHPA............',
      '..............AYYYAAKKMJkJkkkkAlaaANKSKKKKKKKKKKtKKA............',
      '.............AYaAADAKKKGkkonkkkAZVlAASGKKKKKDKKKKKNA............',
      '............DZWAXXANKKKIKkijjkkkAZaZZZSSKKKKKSKKKKA.AAAA........',
      '...........WVAAXXXAKKKAFkAAAFipkpAZaZZJSSMKKKKKKKD.AKKKAA.......',
      '...........VAaXXXAKKKKAAAAWXWADijVAZaVNNShWNKKNAA.AKKHKKA.......',
      '..........AVAcWXXAKKKKKAAXXXXaAYYlYAaYNNSllAAAAjoAAKKHHKNA......',
      '.........AlAXu1XXAKKKKKKAXXXXAYVZZlapAlll1lZAkkkonoASKTTKA......',
      '.........AZAWaV1fANNKNKAAXXXAAZZZZZVkkAVZZZAkkkkoPHEIITMJA......',
      '........A1AfycWluuAJKKNAXXXXAlZZZZVVokpkALAjkkkJnoGJMSTAA.......',
      '........AlDDVuuaXuuAAAAXXXXAEAZZZZZOkkkkkxAAoojKnTIKJtA.........',
      '........AADADAuuuaXf11XXXXAATTAZZZVkkkkkxA..AiignnIKSA..........',
      '........AA....DDAufaaa1uulAWATTAAVakkknla....DGjinIEA...........',
      '.................AA1uuXVlAZZWATTAAiooAAZA.....FDAAAD............',
      '...................AA11uAZZZZAATTHlPlJAA........................',
      '.....................AAAAZZZZllAACgclSxA........................',
      '.............AAAAA.......WZZZZYcfpgAAjfA........................',
      '............AFFBBBAAAAAAAAAZZ1uupkVZYAf.........................',
      '............AFCCCEThYYVVaVVAYlYknYZZZZA.........................',
      '............ADCCCFHhVZZZZZaAYVlZZZZZZZZA........................',
      '...........AFBBCCFHVVZZZZZZXAVZZZZZZZZZZA.......................',
      '..........ADEBBSBFHYZZZZZZZZaAVVZZZZZZZZZA......................',
      '..........ABBBBSFACXZZZZZZZZYaAVaaZZZZZZZZA.....................',
      '..........ABBBTH..AAAZZZZZZZAAAAAaaZZZZZZZZA....................',
      '..........ABBBC......AAAAAAA....AAVaaZZZZZZa....................',
      '...........AAAD...................AaVZZZZZZaA...AAAA............',
      '...................................AZZZZZZaHTA.ABBBFA...........',
      '....................................AZZZZXCIFEAIBBFDA...........',
      '.....................................AZZXXCBFTFHBFAAA...........',
      '......................................AAATBFBBBBEAAA............',
      '........................................ATEEBBFFAAA.............',
      '.........................................DDCBBDAAAA.............',
      '..........................................AATFFAAA..............',
      '...........................................AFFAA................',
      '............................................AAAA................',
      '.............................................AA.................',
      '................................................................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '........................................AAAAA...................',
      '......................................AABBBBA.....A.............',
      '..................................A..ABBBBBAAAA..ABA............',
      '..................................ABABBBFBBBBBBFFBCA............',
      '..................................ABDBEFBBBBBBBBBBA...AA........',
      '..............................AAAAEBBBEFFFFBFEFBBBBAA.CA........',
      '...............................ABBSBBBFFBBBBBBBFBBBBAABA........',
      '...............................ABBBGBBBFBBBBBBBBFBBBBBF.........',
      '............................AAA.ABBBGBBBBBBBBBBBBEBBtBD.........',
      '............................ABBABBBBBBtBBBBBBBBHHESBBBBA........',
      '.............................ABBBBBBBBBBBBFBBHHHBFBBBBFBA.......',
      '..............................FBBBBBFBBBBBFBBBBBBFBBBBBBBDA.....',
      '.............................ABBFBBFBBBBBDKFBBBBBFFBBBBEA.......',
      '.............................ABFFBBFBBBBDKKKDDBBBDKFBEBDA.......',
      '............................AFFFFFBFBBBFKFDKKDBBFKKKEEBA........',
      '.............................AAFFFFFBBDKKKMFKKBFKKFENFBA........',
      '...........FDAAAAAAA..........AAFFFFBBFKNDAADKDKKFAAAECA........',
      '...........VVVVVYYZZWAAA.......AAFKHDBFKHoPFFKKKKPFLAEA.........',
      '.........hVVVVYYYYZZZZZXWAAAAA..ANHGKDAKKPEAEKKKKFDPAA..........',
      '........YlaAAAADDhZZZZZZZVVVVVXAANKGKKAKKPBEEKKKKEEP............',
      '.......WVWWVu1AWWAAAAVZZAAAAAAYVYAKGKKKKKKPHKKKKSHPA............',
      '......FcW1XaaV1VXWXXXAADkgkkkkAlXZANKSKKKKKKKKKKtKKA............',
      '.....AaAAyffVXX111XXXFFkkJkkkkkAZVlAASGKKKKKDKKKKKKA............',
      '.....AA..DAcf1aVa11WWDkkkkMkkkkkAlVZZZSSKKKKKSKKKKA.............',
      '.....A.....FA11YXVZ1WAGMkkkJkkkkkAlVZZSSSMKKKKKKNA..............',
      '.............AD1faXacAKNSkkjogkpggAlXZVNMcANKKNAA...............',
      '...............DAu111AKKSSnkJjLALqXAWlYKSllAAAA..AAAA...........',
      '.................AAAAAKKKMGkEADVXYZYcAlllfZlApF.AKKKKA..........',
      '.....................ANNKAAAAWaaZZZVinAaVVYAkiPOAKSJKKA.........',
      '.....................ANNKJAAAlZZZZZViknTnkAgonjAKKMCtKA.........',
      '.....................AKKKKKKAWZZZZZakkkknhoooPITTtgTGKA.........',
      '.....................AKKKKKKADAZZZVpkkkklookPGGNJIHHSKA.........',
      '.....................ANKKKKKAHTAAVakkknyAAjgPGGKJSttAA..........',
      '.....................OANKKgAAATTAAioiDAA..AqPPSJMAAA............',
      '....................AAAMAAAhZAATTCcPYMD.....AAAAA...............',
      '...................AFFBAAVYYZlZAADglYM..........................',
      '..................DADECTZZZZZZYlu0kAAAA.........................',
      '.................AAFCCBBAAZZZZu1dkZZlZAA........................',
      '................ADBBBBCFHIAAVlYkkYZZZZZZ........................',
      '...............AFBCBTIDCIVVYAVVZZZZZZZZZA.......................',
      '...............ABBBTEIFHLVZZaAaVZZZZZZZZZA......................',
      '...............ABBHAAACIVlZZZVAAVZZZZZZZZA......................',
      '................AAA...AAhZZZZXXXAVZZZZZZZA......................',
      '........................AYlZZZZXVAZZZZZZZA......................',
      '.........................ADZZZZZVZAYZZZZZA......................',
      '..........................DAZZZZXAAZZZZZZA......................',
      '............................AAAA..WaVZZZVA......................',
      '.................................AIVaaaaA.......................',
      '.................................ATHHIIIA.......................',
      '.................................AEEFBEEA.......................',
      '.................................ACFFFIHFDAAA...................',
      '.................................ATBBBBBSSIHCA..................',
      '.................................AEEBBLBHCCCCA..................',
      '.................................AEEAEEEEEEEEA..................',
      '.................................AAAAAAAAAAAAA..................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '........................................AAAAA...................',
      '......................................AABBBBA.....A.............',
      '..................................A..ABBBBBAAAA..ABA............',
      '..................................ABABBBFBBBBBBFFBCA............',
      '..................................ABDBEFBBBBBBBBBBA.............',
      '................................AAEBBBEFFFFBFEFBBBBAA...........',
      '.............................ABBBBSBBBFFBBBBBBBFBBBBAAAAA.......',
      '..............................AABBBGBBBFBBBBBBBBFBBBBBBA........',
      '................................ABBBGBBBBBBBBBBBBEBBtBA.........',
      '..............................AABBBBBBtBBBBBBBBHHESBBBBA........',
      '............................AABBBBBBBBBBBBFBBHHHBFBBBBFEA.......',
      '............................AEBBBBBBFBBBBBFBBBBBBFBBBBBBD.......',
      '.............................LFBBBBFBBBBBDKFBBBBBFFBBBBBCA......',
      '.............................AFBFBBFBBBBDKKKDEBBBDKFBEBFDA......',
      '.............................ABFFFBFBBBFKFDKKDBBFKKKEEBA.A......',
      '............................AFFFFFFFBBDKKKMFKKBFKKFENFBA........',
      '............................AAAFFFFFBBFKNDAADKDFKFAAAECA........',
      '..............................AAFFKHDBFKHoPFFKTKKPFLAEA.........',
      '...............................AANHGKDFKKPEAEKKKKFDPAA..........',
      '.....DAAAAAAAAA..........AAAAAAAANKGKKAKKPBEEKKKKEEP............',
      '.....D11Xffcd1YVaAAAA..FDZZZZZZZhAKGKKKKKKPHKKKKSHPA............',
      '......A1dl00lZZZZZZZZDAVYZZZZZZZZZANKSKKKKKKKKKKtKKA............',
      '.......Aad1cyZZZZZZZZZAWVZZZZZZXXVlAASGKKKKKDKKKKKKA............',
      '........AyZZZZZZZZZZZZZVaaaaaaZZZVaZZZSSKKKKKSGKKKA.............',
      '.........AZZZZZZZZZZZZZVYaaVVlAAAllaaZVMSSKKKKKKKA..............',
      '..........AAZZZZZZZZZZZZZZZYVAkkkAAlVaVVMfANKKKAA...............',
      '............AZZZZZZZZZZZZZlAAkkkkkkAlYVaaffAAAA.................',
      '.............ADZZZZZZZZZZlApkkkkkkkkAAAlllyD....................',
      '..............DAAZZZZZlAAAppJkooonkWll2AAAZA....................',
      '.................AAAAAA.AjKnkkkkSSpWlZkjkkAAAA..................',
      '........................ApkkkkkkknDyZkknkcAJKKA.................',
      '........................AiktttSSHkkAAAkklAggIKKA................',
      '.........................DFKKKKKKFDKKKAyAAKgHKSA................',
      '.........................AAAMKKKKKKKKKDDITTgHHKA................',
      '........................AllZAWKKKKKKKKKAAAHHTNA.................',
      '.......................AZZZZZAAKKKKKKNA...AGGJA.................',
      '.......................AlZZZZZYYAKKKKA1....AAA..................',
      '........................hlZZ1dunnAANKA1l........................',
      '........................FAAVyYknYllAAnnf........................',
      '.........................AAWVlZZZZZZAZlD........................',
      '.........................ADAaaZZZZZZAZlA........................',
      '.........................DDDaaZZZZZZAZZZA.......................',
      '........................AFETAZZZZZZZAZZZA.......................',
      '.......................DFCCBAVZZZZZZAZZZA.......................',
      '......................AAEBEBAaaZZZZZAZZZA.......................',
      '......................AEBBCTDVaaZZZZAZlA........................',
      '......................ABBBHAalllZZZZAAA.........................',
      '.......................AAAAAaZlZZZlA............................',
      '..........................DHHaaZZlA.............................',
      '..........................DBHHIaWA..............................',
      '.........................ABEBBCIW...............................',
      '.........................DBBEIFFDAAA............................',
      '........................AGBBBBEIITBTA...........................',
      '........................AFFFFCBHCBCCA...........................',
      '........................AFEAABEEEFEFA...........................',
      '........................AAAAAAAAAAAAA...........................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '........................................AAAAA...................',
      '......................................AABBBBA.....A.............',
      '..................................A..ABBBBBAAAA..ABA............',
      '..................................ABABBBFBBBBBBFFBCA............',
      '..................................ABDBEFBBBBBBBBBBA.............',
      '................................AAEBBBEFFFFBFEFBBBBAA...........',
      '.............................ABBBBSBBBFFBBBBBBBFBBBBAAAAA.......',
      '..............................AABBBGBBBFBBBBBBBBFBBBBBBD........',
      '................................ABBBGBBBBBBBBBBBBEBBtBD.........',
      '...............................ABBBBBBtBBBBBBBBHHESBBBBA........',
      '............................AAABBBBBBBBBBBFBBHHHBFBBBBFB........',
      '............................ABBBBBBBFBBBBBFBBBBBBFBBBBBBBA......',
      '.............................ABBBBBFBBBBBDKFBBBBBFFBBBBECA......',
      '.............................LFBFBBFBBBBDKKKDEBBBDKFBEBEDA......',
      '.............................ACFFFBFBBBFKFDKKDBBFKKKEEBA.A......',
      '.............................FFFFFFFBBDKKKMFKKBFKKFENFBA........',
      '.............................AAFFFFFBBFKNDAADKDFKFAAAECA........',
      '..............................AAFFKHDBFKHoPFFKTKKPFLAEA.........',
      '...............................AANHGKDFKKPEAEKKKKFDPAA..........',
      '................................AKKGKKAKKPBEEKKKKEBP............',
      '..............................AAWAKGKKKKKKPHKKKKSHPA............',
      '............................AAlZZlANKSKKKKKKKKKKtKKA............',
      '...........................AZZZZlllAASGKKKKKDKKKKKKA............',
      '..........................WlZZZXXXXZZZSSKKKKKSGKKKA.............',
      '.........................AlYaXZZllllaXVGISKKKKKKKA..............',
      '.........................aXXlZlllAAAAZXYMcFNKKKAA...............',
      '........................AAlllllAAkkkkAXaVcfAAAA.................',
      '.....................AAAZZZZZZAAkkkkkkAXZYcA....................',
      '...................AAlZZZZZZZAVAkkkkkkpAAAAFA...................',
      '......AAAAWDAAAAAAAllZZZZZlAAllAkkkkpiiAAiKKKA..................',
      '......Ad1Yf1ZZZZYVVZZZZZlAAWAllAkkkKkjPTAiKKKKA.................',
      '.......Dyd10dZZZZZZZZZlAAXXAEAZAiPkkknSTGKJJKKA.................',
      '........AAfclZZZZZZZAAAycaAATTAaioJkkSSKJKKKKKA.................',
      '..........DDAaWWWAAAA1XWcAZaATTAGknkkSKKKKNKKKA.................',
      '.............FWWA11uycuuAlZZWATTAookCKKKKKAAAA..................',
      '.................AAAAAAAZZZZlAATFAAkGHAAAG......................',
      '........................ZZZZlllADFqAAAf0DA......................',
      '........................DlZZZZluAAAAAnkkYZDA....................',
      '.........................Ayf11uknnYZZZZZZZZZA...................',
      '........................AVXayYkkZZZZXZZZZZZZZA..................',
      '.......................DaVaYZlZZZZZZZZZZZZZZZA..................',
      '.......................AaaZZZZZZllWaaaXXZZZZlA..................',
      '......................AZaZZZZZZZlAAAAAaZXZZZlA..................',
      '.....................AZZZZZZZZZZA..AAVlZZZZlA...................',
      '....................AZZZZZZZZZZD..AFITaaZZlA....................',
      '...................AZZZZZZZZlA...ABFBIIVaaA.....................',
      '..................AZZZZZZZZZA...ABBBFFHHHA......................',
      '..................WVZZZZZZZA....AFECCBFD........................',
      '.................AHaXZZZZZA.....AFFECCIFA.......................',
      '................AEHIaaVVlA.......AADBBHITA......................',
      '...............ABEFHHTXZA..........AFCBGHA......................',
      '..............AEBBBFBBIW...........AAFCBTA......................',
      '..............AEBBBHBED..............AFEEA......................',
      '..............FFFBBHBBBD..............AAA.......................',
      '..............DAAEBBSSICA.......................................',
      '................AWBBCBCBA.......................................',
      '................AAFEEEEEA.......................................',
      '.................AAAAAAAA.......................................',
      '................................................................'
    ]
  ];

  const PROTAG_FALL_ROWS = [
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '............................AAAAAAA.............................',
      '..........................AA0000000AA...........................',
      '.........................A00llZYZYY00A..........................',
      '........................A0Zl000000dyl0A.........................',
      '.............AAAAA.....AfVl0zAAAAAfz0VzA.....AAAAA..............',
      '...........AVf0000A....AyV0clABBBBAAf0VyA...A0000fVA............',
      '...........Ad0lllllAAAATDwlAAAABBBCCAyzAfAAAVVZZZ0zA............',
      '............AYll00YXuuACCCQCBBBBBBEBCABAVffVa00lYZA.............',
      '............A00lZZ1yVVfFCBBBBBBBBBBEBQCAfVVYfZZZ0zA.............',
      '.............AZYYYZayfABBBBEBBBFBFFFEBBBAffVVZYYZA..............',
      '.............AZYYYYaaAGBBBBEBFBBBBBFBBBBCAVaYZYYYA..............',
      '.............AZZYYAAABGGEBBBFBBBBBBFBBBBGHAaZZYYYA..............',
      '.............AZZYYABCCFESBBBFBBBBBBBBBBGSCDVZZYYYA..............',
      '..............AZYYZFFBEBCBGEHHBBBBBBBBGEBBAZZZYYA...............',
      '..............AZYYZABBFBBBBFBHHHBBBEBBBBEBBAZZYYA...............',
      '..............AYZZABBFBBBBBFBBBBBBBEBBBBFBBBAAZYA...............',
      '...............AYZABBFBBECEDBBBBBBFFTBBBBBBBCAZA................',
      '...............AYAEBFCBBECEKFBBBFEKKDCEBBEBFAlZA................',
      '...............AACBBFCBEBDQKABBBDKKBFFEBBFBBEZZA................',
      '................AAQFDCBFAMNFFABBDKFFNKEBBDEBAZA.................',
      '................AlAEACBDKRAAFKABEHQAAFHBBFEAllA.................',
      '................AVAETFCDH3FFQKKKMKPFFrHBEEEAlVA.................',
      '.................ARFKIQDDPQAQKKKKKEAFPCBAKAFAA..................',
      '..................AAKMAFKPTFTKKKKKTFTPHFMJAAA...................',
      '................AAAAHKMGKKPTKKKMKKtHgNISJKAAAAA.................',
      '...............AongjXAKGKKKKKKKKKKKKKKGKKAXjjnjA................',
      '.............AASTjnjjYAAAKKKKKHJSJKKKKAAAVjjnjHGAA..............',
      '............AKKKJGnngnAaZAKKKKKKKKKKKAlVAkjnnIMKKKAA............',
      '...........ANSKKKSHngnnDVYAAKKKKKKKJAYaAknjnHSKKKMNAA...........',
      '..........ASHKKUKAUnjAA.AVaVAAIHIIAAVXA.AAonoAKKKNHMA...........',
      '..........AGNAAAKAjnA...AAXXXllSIlYXXW....AnjAKAAAKtAA..........',
      '...........AA..AKAAA.....AYmWHaVXaXXVA.....AAAKAA.AAA...........',
      '...............AAA.......AZZlASyTAXYZA........AA................',
      '................A........AZZZZAIIFZZZA..........................',
      '.........................AZZZlnAIIFZZA..........................',
      '..........................AAYlnnAIIRD...........................',
      '.........................ATAEmUjKAAIIFFA........................',
      '........................AVATRS3UlMTAIQIIA.......................',
      '.......................AYZYATSuulMTFATRITA......................',
      '.......................AZZlVAAiMUAAAATITHA......................',
      '.......................AVXl11nAAAnyulAHFUD......................',
      '......................AYYXynnjYYYnj1lAIHQF......................',
      '......................AYYYaVYYYYYZnllAHTRTA.....................',
      '.....................AlZZZZZZVAXYZZZZVATItA.....................',
      '.....................AZZZZZZVA.AXZZZZVATTA......................',
      '.....................AZZZZZVAA..AZZZZZYAAA......................',
      '.....................AVVZZVVAFA..AZZZZZZaA......................',
      '......................AVVVVARFA..AXZZZZZaA......................',
      '.......................AVVFRFEA..AVVZZZVaA......................',
      '........................AFFFQQA..AXVZZZVA.......................',
      '.........................AFDEA...AHEVVVA........................',
      '.........................AQEQA..AQFHHHBA........................',
      '..........................AAA...ABFFFFD.........................',
      '................................ABBFHHA.........................',
      '................................AQBBFFCA........................',
      '.................................AFBBBCA........................',
      '..................................AQEEEA........................',
      '...................................AAAA.........................',
      '................................................................',
      '................................................................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '............................AAAAAAA.............................',
      '..........................AA0000000AA...........................',
      '.........................A00lYVVVVV00A..........................',
      '........................Azll0AAAAA0clzA.........................',
      '.............AAAAA.....AfV00lAAAAAA00VdA.....AAAAA..............',
      '...........Al1000lA...ABDV0AAAABBCAAD0V1A...AZ0l01hA............',
      '...........Ad0llYYlAAAACCCRCBBABBBBCAl0A1AAAVVZZYZzA............',
      '............AYll00fXuuACCBBBBBBBBBEBCABAV11Yal0lYZA.............',
      '............A00lYYlyaVAFBBBBEBBBBBBEBFCAAVVYfZYY0zA.............',
      '.............AYYYYZXVfABBBBEBBBFBFFFEBBBAAfVVZYYYA..............',
      '.............AYYYYAAaASBBBBEBFBBBBBFBBBBTAAaZZYYYA..............',
      '.............AYYYYAAACGGBBBBFBBBBBBBBBBBSIAaZZYYYA..............',
      '..............AYYYABBBBHCBBBFBBBBBBBBBBGGCDYZZYYA...............',
      '..............AYYYZAFBEBCBGEHHBBBBBBBBGEBCAAYZYYA...............',
      '..............AYYZAACBFBBBBFBHHHBBBEBBBBEBCAAAZZA...............',
      '...............AYZAEBFBBBBBFBBBBBBBEBBBBFBBCAAZA................',
      '...............AYAEBBFBBECEDFBBBBBFFTBBBBBBBClZA................',
      '...............AAABBFCBBECEKFBBBFEKKDBEBBEBFAZYA................',
      '................AABBFCBFCDFFAABBDKKQFFEBBFBBEZA.................',
      '................AAAFDCBFATKFFABBDKFFKNEBBDEBAZA.................',
      '................AVAEADCDH3AAFKABEHQAADHBBFEAlZA.................',
      '.................AAETDEDDiFFFKKKKKPAF3HBEEEAlA..................',
      '.................AADKIAFKPCAQKKKKKRAFPHBAKAFAA..................',
      '..................AABJAFKPTFTKKKKKTHHPHFMKAAA...................',
      '................AAAABKJGKKPTKKKMKKtH2KISJKAAAAA.................',
      '...............ATnnjWANDAKKKKKKKKKKKKKGNKAbjnnjA................',
      '.............AASHjngghAAAAKKKKKKKJKKKKAAAVjknjHSAA..............',
      '............ANKKKGnngnAaYAAAKKKKKKKKKAlVAnjnnHKKNNAA............',
      '...........ANSKKKSHngnnAXYAAAAKKKKKJAYXAknjnqSKKKSNAA...........',
      '..........AMTKMMKAjnAAA.AAXXAAYIIIAAVWA.AAAnjAKMMKHMA...........',
      '..........AIKAAANAAA.....AYmXXYVaYXXXA.....AAAKAAANIA...........',
      '...........AA..ANA.......AYVAIG1qAXXVA.......AKAA.AAA...........',
      '................A........AZZZAAIRFZZZA........AA................',
      '.........................AZZZlAAIIFZZA..........................',
      '..........................AlZlnnAIIQZA..........................',
      '.........................ATAVlgjkAIID...........................',
      '........................AATHRDJJUWAIIFDA........................',
      '........................AVATTtuslMTAIRIIA.......................',
      '.......................AZZZATSuulMRRATRIHA......................',
      '.......................AZZZVAAMMUAAAATITIA......................',
      '.......................AXXV11nAAAkl1YAIFRF......................',
      '......................AYYYYnnjYYYkn1lAITRTA.....................',
      '......................AYZZZYYYVVYYYZlAHTISA.....................',
      '.....................AZYZZZZZVAWZZZZZVATHHA.....................',
      '.....................AZZZZZVVA.AXZZZZZYAAA......................',
      '.....................AVZZZVVAA..AZZZZZZYA.......................',
      '.....................AAaZZVARFA..AZZZZZZaA......................',
      '......................AaVVVARFA..AXVZZZZaA......................',
      '.......................AaFFFQRA..AVVYZZVA.......................',
      '........................AFFFRA...AXVVVVA........................',
      '.........................ADDQA...AHEDEBA........................',
      '.........................AEEQA..AQFHHHHA........................',
      '..........................AAA...ABEFFFD.........................',
      '................................ACBBBHA.........................',
      '................................AEBBBFCA........................',
      '.................................AFEBHCA........................',
      '..................................AQEEEA........................',
      '...................................AAAA.........................',
      '................................................................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '............................AAAAAAA.............................',
      '..........................AAA000000AA...........................',
      '.........................AA0llYYYYY00A..........................',
      '........................AAll000f000cl0A.........................',
      '.............AAAAA.....AWYl0zAAAAA100VzA.....AAAAA..............',
      '...........Al10000A....AfY0clACCCCAAf0V1A...A0000fhA............',
      '...........A10llZZYAAAACAfZAAAABBBBBAl0AAAAAVYYZZ0zA............',
      '............Alll00VXffACCTRCBBBBBBEBCABAV11VV00lZZA.............',
      '............A00lYY1yaVyFBBBBBBBBBBBEBFCAYVXYfZYY0zA.............',
      '.............AYYYYZXyfABBBBEBBBFBFFFEBBBAffXVZYYZA..............',
      '.............AYYYYZaaASBBBBEBFBBBBBFBBBBTAVaZZYYYA..............',
      '.............AYYYYAAACGGBBBBFBBBBBBFBBBBSIDaZZYYYA..............',
      '.............AYYYYACBBBHGBBBFBBBBBBBBBBGGCDaZZYYYA..............',
      '..............AYYYZFFBEBCBGEHHBBBBBBBBGEBCAYYZYYA...............',
      '..............AYYYZACBFBBBBFBHHHBBBEBBBBEBCAYYYYA...............',
      '..............AYYYABBFBBBBBFBBBBBBBEBBBBFBBCAAYYA...............',
      '...............AYYABBFBBECEDBBBBBBFFTBBBBBBBCAYA................',
      '...............AZAEBFCBBECEKFBBBFEKKDBEBBEBFAlYA................',
      '...............AABBBFCBECDFKABBBDKKKFFEBBFBBEZZA................',
      '................AAQFDCBFAMKDFABBDKFFKNEBBDEBAlA.................',
      '................AlAEABCDKBAAFKABEHQAAFHBBFEAZZA.................',
      '................AVAETDCDH3FFFKKKMKPQF3HBEEEAlYA.................',
      '.................ARDKHQDDPQAQKKKKKRAFPHBAKAFAA..................',
      '..................AAKJADNPTFTKKKKKTFHPHFMKAAA...................',
      '................AAAAHKMGKKPTKKKMKKtH2KISJKAAAAA.................',
      '...............AingAXANtKKKKKKKKKKKKKKGNKAbjjnjA................',
      '.............AAGHjngjaAAANKKKKIMSJKKKKAAAVjknjHtAA..............',
      '............AKKKJtnngnAaYAKKKKKKKKKKKAlVAnjnnHMKKKA.............',
      '...........ANSKKKSHngnnAXZAANKKKKKKJAYYAknjnnSKKKSKA............',
      '..........AMHKKJKSHnoAA.AVaaAAIIIIAAVWA.AAonHSKKKKHMA...........',
      '..........AIKAAANAjkA...AAXXXYYSSYYXXm....AnjAKAAAKIAA..........',
      '...........AA..ANAAA.....AVmWXVVaXXXaA.....AAAKAA.AA............',
      '...............ANA.......AZZZAtfBAaZYA.......ANA................',
      '................A........AZZZZAIIFZZZA........A.................',
      '.........................AZZZlnAIIDZlA..........................',
      '..........................AZYlkkAIIQD...........................',
      '.........................ATAhlJjkAIIIFFA........................',
      '........................AaATTSUJUMTAIQIIA.......................',
      '.......................AYZYATSu1lMTRATRITA......................',
      '.......................AYZZVAAUUUAAAATITHA......................',
      '.......................AXXV11nAAAkl1YAIFUD......................',
      '......................AYYXYnnjYYYkj1lAIIRR......................',
      '......................AYYZXYYYVVYYn1lAHTTHA.....................',
      '......................AYZZZZZVAXYZZZZZDTIIA.....................',
      '.....................AZZZZZVVA.AVZZZZZYTTTA.....................',
      '.....................AZZZZZVAA..AZZZZZZAAA......................',
      '.....................AVYZZVVAFA..AZZZZZZaA......................',
      '......................AaVVVARFA..AXVZZZZaA......................',
      '.......................AaaFRFRA..AVVYZZVaA......................',
      '........................AFFFRQA..AVVVVZVA.......................',
      '.........................ADDEA...AbVVVVA........................',
      '.........................AEERA...AHECHHA........................',
      '..........................AAA...AQFHFFD.........................',
      '................................ABQFFFA.........................',
      '................................AQBBHFCA........................',
      '.................................AFBBCCA........................',
      '..................................AQEEBA........................',
      '...................................AAAA.........................',
      '................................................................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '............................AAAAAAA.............................',
      '..........................AA0000000AA...........................',
      '.........................A00lZZZlll00A..........................',
      '........................Adll000D000yl0A.........................',
      '.............AAAAA.....AfYl0ZAAAAAb0dVwA.....AAAAA..............',
      '...........Al10000A...AADY0llACCCCAAy0afA...A0000fXA............',
      '...........Aw0ZZYYlAAAATAxlAAAABBBCCDl0AfAAAXVYZY0dA............',
      '............AYZY00YVffACCCRBBBBBBBEBBARAVffYV00lZYA.............',
      '............A00ZYYflVVyFBBBBBBBBBBBEEQCAlXVYfYZZ0dA.............',
      '.............AYYYYYayfACBBBEBBBFBFFFEBBBAffaYYYYYA..............',
      '.............AYYYYZaVASBBBBEBFBBBBBFBBBBTAXaZZYYYA..............',
      '.............AZZYYAAACSGBBBBFBBBBBBFBBBBGIFaYZYYYA..............',
      '..............AYYYACBBBHGBBBFBBBBBBBBBBGGCDZYZYYA...............',
      '..............AYYYZFFBEBCBGEHHBBBBBBBBGEBCAYYZYYA...............',
      '..............AYYYZACBFBBBBFBHHHBBBEBBBBEBCAZZYYA...............',
      '..............AYYYABBFBBBBBFBBBBBBBEBBBBFBBCAAYYA...............',
      '...............AYYABBFBBEBEDBBBBBBFFTBBBBBBBBAYA................',
      '...............AZAEBFCBBEBEKFBBBFEKKDCEBBEBFAlZA................',
      '...............AABBBFCBEBDEKABBBDKKQFFEBBFBBEZZA................',
      '................AAQQDCBFDJJFQDABDgFQNNEBBDEBAZA.................',
      '................AYAEABBDKEAAFKABECQAADHBBFEAlZA.................',
      '.................AAETDBDIrFAQKKKMKPFFrHBEEAAAA..................',
      '.................ARAKHQDDPFAQKKKKKRAFPCBAKAFAA..................',
      '..................AAKJAHKPTDTKKKKKTFHPHFMUAAA...................',
      '................AAAACKMGKKPTKKKMKKGH2KISJKAAAAA.................',
      '...............AjnnjmAKGKKKKKKKKKKKKKKIKKAXojnjA................',
      '.............AASIjnggVAAANKKKKIKKJKKKKAAAVjknoHSAA..............',
      '............ANKKJGnngnAaYAKKKKKKKKKKKAlVAnjnnGKKKKAA............',
      '...........ANGKKKSHngnnAmYAAKKKKKKKJAVXAknjnqSKKKSMAA...........',
      '..........ASHKJMKAjnAAA.AAXVAAIHIIAAVmA.AAAnjAKJMKIMA...........',
      '..........AINDAAKAAAA....AYmXXZVXYYXXA....AAAAKAAANIA...........',
      '...........AA..AKA.......AYZAHGdlaXXVA......AAKA..AA............',
      '................A........AZlZAIqRFaZZA........AA................',
      '.........................AZZZlAIIIDlZA..........................',
      '..........................AlZlnAAIIbZA..........................',
      '.........................ARAVlkjnAIID...........................',
      '.........................ATTEmUJUDAIIFFA........................',
      '........................AYATTSfPlMHAHQIIA.......................',
      '.......................AZlZAHSuulMTRATRHHA......................',
      '.......................AYYZYAAUUUAAAATITIA......................',
      '.......................AaXV11kAAAky1lAIQUQ......................',
      '......................AYYXakkoYZYkj1lAIIRFA.....................',
      '......................AYYYYYVYYVYYnZZAHTTSA.....................',
      '.....................AYYZYYYYVAXYZZZZZAHHHA.....................',
      '.....................AZYZZZVVA.AaZZZZZZAAA......................',
      '.....................AZZYZZVAA..AYZZZZZZm.......................',
      '.....................AaaZZVVAFA..AZZZZZZVA......................',
      '......................AVVVVARFA..AXZZZZYVA......................',
      '.......................AaaFBFQA..AVVVVZVA.......................',
      '........................AFFFRQA..AbVVVYVA.......................',
      '.........................ADDRA...AIRbBCA........................',
      '.........................ARREA..AFQHHHHA........................',
      '..........................AAA...ACQFFFD.........................',
      '................................ACBEHHA.........................',
      '................................AQBBEFCA........................',
      '.................................AFBBTTA........................',
      '..................................AFEEEA........................',
      '...................................AAAA.........................',
      '................................................................'
    ]
  ];

  const PROTAG_LAND_ROW = [
    '................................................................',
    '................................................................',
    '.............................AAAAA..............................',
    '.......................A.....ABBBBAA............................',
    '......................ABA..AAAABBBBBA..A........................',
    '......................ABBBQBBBBBBBEBBAEA........................',
    '.......................FBBBBBBBBBBBEBFBA........................',
    '......................ABBBBBBBEFEFFFEBBBA.......................',
    '.....................AGBBBBBBFBBBBBFEBBBBA......................',
    '..................AAABGGBBBBFBBBBBBFBBBBGHA.....................',
    '..................ACBBBHGBBBFBBBBBBBBBBGGCF.....................',
    '...................FFCEBCBGEHHBBBBBBBBGEBCA.....................',
    '...................ABBFBBBBFBHHHBBBBBBBBEBCA....................',
    '..................ABBFBBBBBFBBBBBBBEBBBBFBBBAA..................',
    '..................ABBFBBEBEDBBBBBBDFCBBBBBBBCA..................',
    '.................AEBFBBBEBEKFBBBFEKJDBEBBECFA...................',
    '................ABBBFBBEBDEFABBBDKFFFFEBBFCBB...................',
    '.................AFFDBBFDMKKKDBBDKKKKKEBBDEBA...................',
    '..................AEABBDKBAAQKABECFAAACBBFEA....................',
    '..................AECFCDH3QFFKKKMKPFFrHBEEEA....................',
    '.................ARDKIQDAPRAFKKKKKQAFPCBAKAQA...................',
    '..................AAKMAFKPTFTKKKKKTFTPHFMJAAA...................',
    '....................TKSGKKPCKKKMKKGHgKISJKA.....................',
    '.....................AKGKKKKKKKKKKKKKKIKKA......................',
    '......................AAAKKKKKIJSJKKKKAAA.......................',
    '......................DYaAKKKKKKKKKKKAYlA.......................',
    '......................AYYYADKKKKKKKJAZYZA.......................',
    '.....................AZZYZVXAASIIIAAZYYYZA......................',
    '.....................AZZYYZZYVSSSYlZYZVYZA......................',
    '......................AAXXXXXVmAXVXXXXamA.......................',
    '.....................AllYYXIHXlAvSWaVYYYZA......................',
    '....................AlZYYZlWHWDfmmZZZYZZZZA.....................',
    '...................AZZZYaWAAHIDfoVaWXWXlYZYAA...................',
    '..................AZZWADjjmYATIRkVYZVqixAAZYYA..................',
    '...............AAmlXAknkggXYYAIIFYYYYDkknkbDaZA.................',
    '.............AAlZlTknnoggAalZlAIIRYYYAAknonnkhYmAA..............',
    '..........AADlYZYYknnnnojAVZYlnAIIRYYAAkjnnnnhYYYlAAA...........',
    '.........DdYf1YZZZGCCnkkqAZZZlnnAIIbYXWhknnHqhYYYl1l0A..........',
    '.........A0YfyZZYWAMMTjjXAXXXXnjkAIIHXXAoqGJAAZZYY1Y0A..........',
    '.........A0YddZZAATKKJWWXATHXIUUSVAIIIRXWWUKNAAaY1dV0A..........',
    '.........DdY0dcADlNKKDWWWATTHtfsltTDIRRHVAANKNXmVydh0A..........',
    '.........DW0ldA..AKKKKAWWWXADtffltTFTRITADKKKKAWAf1Z0D..........',
    '..........Ddla...ANKIKAWmYYYAADXAADATRITAKgSNNA..TV00...........',
    '...........AdD...AKNSAD1AYYYYVDXAlccRHTSAqDSNKA..D0AA...........',
    '............A.....ANKAWYWYYYfxkYkxclAHFUDDAKKA....A.............',
    '...................AA..AVYYYunkllkrYAHHFF.AAA...................',
    '.......................AaXXZZVYYYZZZAHTBI.......................',
    '.......................AYYZXWYVaVZXXVFTII.......................',
    '.......................AYZZYZZaWaVZZVARD........................',
    '.......................lZZZZZZaWVZZZZZZm........................',
    '......................AZYZZZZZa.WZZZZZZZA.......................',
    '......................AZYYYYZZY.DZZZZZZZA.......................',
    '......................AZVVZZZZa.DYZZZYaYA.......................',
    '.......................AVXZVVYA..WYaXYaA........................',
    '........................ABBbXA....AWbFF.........................',
    '.......................AHHHHHTA..AHHHHHA........................',
    '.......................AFFFCCRA..ARRCFFA........................',
    '.......................ARHTEEA....AFFHTA........................',
    '......................ABCCFBCA....ABBFBBA.......................',
    '.....................ACCCCBBCA....ABBBBBCA......................',
    '.....................AEEBBEDEA....AEDEEEEA......................',
    '......................AAAAAAA......AAAAAA.......................',
    '................................................................',
    '................................................................'
  ];

  function drawProtagBlink(put, y0) {
    for (const ox of [25, 34]) {
      for (let dx = 0; dx < 4; dx++) {
        put(ox + dx, y0, '#ca7352');
        put(ox + dx, y0 + 1, '#e79b73');
        put(ox + dx, y0 + 2, '#2f1b17');
      }
    }
    put(26, y0 + 3, '#e79b73');
    put(27, y0 + 3, '#e79b73');
  }

  function drawProtagMouth(put, mouthOpen, y0 = 24, xOff = 0, yOff = 0) {
    if (mouthOpen === 1) {
      for (let bx = 30; bx <= 32; bx++) {
        put(bx + xOff, y0 + 1 + yOff, '#3e1b11');
      }
    } else if (mouthOpen >= 2) {
      for (let bx = 30; bx <= 32; bx++) {
        put(bx + xOff, y0 + yOff, '#3e1b11');
        put(bx + xOff, y0 + 1 + yOff, bx === 31 ? '#ee9070' : '#ca7352');
      }
    }
  }

  function buildProtagFallenPose() {
    const [c, x] = mk(64, 64);
    c.hib = true;
    const base = PROTAG_IDLE_ROWS[0];
    for (let sy = 2; sy < 63; sy++) {
      const row = base[sy];
      if (!row) continue;
      for (let sx = 12; sx < 52; sx++) {
        const ch = row[sx];
        if (!ch || ch === '.') continue;
        const col = PROTAG_PIXEL_PALETTE[ch];
        if (!col) continue;
        const dx = 9 + Math.round((sy - 2) * 0.76);
        const dy = 52 + Math.round((sx - 31) * 0.42);
        if (dx >= 0 && dy >= 0 && dx < 64 && dy < 64) {
          x.fillStyle = col;
          x.fillRect(dx, dy, 1, 1);
        }
      }
    }
    return c;
  }

  function buildProtagonistPortrait(mouthOpen, blink) {
    return buildPortraitFromRows(PROTAG_IDLE_ROWS[0], PROTAG_PIXEL_PALETTE, 17, 6, {
      mouthOpen,
      blink,
      drawBlink: (put) => {
        for (const ox of [8, 17]) {
          for (let dx = 0; dx < 4; dx++) {
            put(ox + dx, 14, '#ca7352');
            put(ox + dx, 15, '#e79b73');
            put(ox + dx, 16, '#2f1b17');
          }
        }
        put(9, 17, '#e79b73');
        put(10, 17, '#e79b73');
      },
      drawMouth: (put, m) => drawProtagMouth(put, m, 24, -17, -6)
    });
  }

  // ============================================================================
  // PROTAGONISTA FEMININA — SPRITES REAIS 64x64 (`Main Feminino`) + RETRATO 28x28
  // ============================================================================
  const FEMALE_PROTAG_PIXEL_PALETTE = {
    "A": '#020208',     "B": '#050302',     "C": '#070607',     "D": '#100e2e',     "E": '#170c0c',     "F": '#22295b',     "G": '#27191a',     "H": '#2f3581',
    "I": '#34211f',     "J": '#392e46',     "K": '#3e2068',     "L": '#424ba8',     "M": '#432a27',     "N": '#514d65',     "O": '#523431',     "P": '#5e3d39',
    "Q": '#604288',     "R": '#6872d0',     "S": '#7071b2',     "T": '#75ddfd',     "U": '#7d4531',     "V": '#80baf5',     "W": '#8461b3',     "X": '#855952',
    "Y": '#898dde',     "Z": '#8f8c9a',     "a": '#a25e4e',     "b": '#ac8bde',     "c": '#adaef1',     "d": '#b0adbc',     "e": '#b27ca5',     "f": '#bfe5f9',
    "g": '#ca876f',     "h": '#cdccf5',     "i": '#d1d0d6',     "j": '#d4bba9',     "k": '#f3f3f4'
  };

  const FEMALE_PROTAG_IDLE_ROWS = [
    [
      '................................................................',
      '................................................................',
      '.......................CCC...........QCC........................',
      '......................EQQQGB.......BCbQWb.......................',
      '.....................EbbbbbWE.CCC.CWbbbbbQE.....................',
      '....................EPbbbWbWbCOOOCbbbWbbWWC.....................',
      '....................CPQbkcWWQKWhQKWWWYkkQD......................',
      '.....................MQbcccWGMMIOMIbchhYQC......................',
      '..................DDNDWbbGMOPPPPOIPOMYhYQWWDD...................',
      '................DSWbWQWWIPPPPPMMPPPOPOGWQWbkcD..................',
      '...............ZbbfbQQQMPPPPOMOOMMMPPPPGWWWVbbC.................',
      '...............bbbcWWWGXPPOPMPPPPMMPMMPOIbbbbbB.................',
      '..............BWWWWbbMPXXPPPPPPPPPPOPPXXPJcbWbB.................',
      '...............DQQWbbMPPPPXOXPPPMMMPPXXOXMcbWD..................',
      '.................QbbCOPPPPPMPPPPGMOIPPPPPOGbbD..................',
      '.................BWWCOPPPPPUPPPMggggPPPPPOIWbW..................',
      '..................CGIPMPPOIOMPPMggPOMPPPMMMEWD..................',
      '.................BOMOIPPPMXgMPPMggaggMPPPMOGC...................',
      '................COOGIPPPMaPPgMPOgggOMgIPPPMIE...................',
      '...............BOOGMOPPMUBCCCgMOggCBBCaMPPOMiRO.................',
      '...............BOIQRNIMICZkBEgggggkCEXBMMIIOYSOC................',
      '................MMJRJaOIgkIBMgggggIBMkgMPaCMMXE.................',
      '................COOJdaMOgkMOMgggggIPPkgMaUGGIPOGE...............',
      '...............BOOIWWOgOggjgggggggggjggMgCIIIPOOPC..............',
      '..............COOIOWIIGOagggggggggggggMOIMIIcYXMOOC.............',
      '.............COIEOOiIIMOEggggggaggggggCMMIMIcYPEIOC.............',
      '.............BOCMONVVJOIIGGgggggggggCGIIOGMMMQOIOOB.............',
      '.............BPOIOIYdIOOEIIGBXaaaXCCIGEMIIIMOOOOMC..............',
      '..............COOIOIIIGOIGGECSaaaSBDGGIIIIMIOOOIC...............',
      '...............CMOIOIIGGICCUFhiaiiHLDCEIIIIOIOOOOC..............',
      '..............COOOIOMIIIERHUJRSYSYRLHSdGIIIIOMIOOOC.............',
      '.............COMIIMMIIICiYHFUIkLkHcYHSdkIIIIIIMIOOC.............',
      '............COMCMMIIIIEkkdHRUUYRiciRHkkkEIIIIMOEIOC.............',
      '............COMCMMIIIEikkkHLFUIRHLLLHdikkCIIIMGOMC..............',
      '.............CMMGMIIEikkkiHHLJUQLLLLHdkikkEIGMOC................',
      '...............CMIGGkkkkBCCDDHUIHHHHHikkkkkCGMMB................',
      '...............CEIECkkkEDHZjjDGUMHHFZikkkkkBECB.................',
      '................CBECkiiCFFNHZjFcUCEPZikkkkiB....................',
      '...................EdddDJJPFjHFcYUbWZikiiid.....................',
      '....................EdiFJJJFjEQYhUPEJdddddC.....................',
      '....................CggIFJJHjEDiFFUUCEdikEE.....................',
      '....................BggaaJJFjDLHLHFFOGZggGUE....................',
      '....................BggaIFFHjDLLLLLEMPgggGUPE...................',
      '.....................BggDPFjjDLLLLLCOagggEUUC...................',
      '....................BHGaXJFjFDLLLLLFPUaggEUPE...................',
      '...................CHHHLLDFDDLLLLLLHIUgggPUUE...................',
      '...................CHLHLLLHLLLLLLLLLEUXIJaUUC...................',
      '..................ELLLLLLLHLLLLLLLLLCPYVYPPGC...................',
      '..................HLLHLLLLLLLLLLLLLLLCEcECCHHB..................',
      '.................HhYHLLLLHLLLLLkLLLLLFHHHFLHSHB.................',
      '................CHiRHLRLLFLLLLLkLLLRRLLLLLHRiLB.................',
      '...............CRYLLHRRcLLLhLLkcVLLRRLLLRRHLLLRC................',
      '..............CYYYcHLLLLHRRRLLYkLLLRLYLLYLLRYcccB...............',
      '..............CccccRccLLHcRcLccRcccccYHLLRcRccccB...............',
      '...............CYYRYccccLLYccccRRcLLcHLcccccYccB................',
      '................CCRccccccLaIXHHHHHHLXXYccccYRXB.................',
      '..................CCYcYYDdiiiBCBBBBCiiGYYYYBB...................',
      '....................CCCCEGIIGB.....EIGIMBBB.....................',
      '.......................CCMgIGB.....BIggEC.......................',
      '.......................BMMMIGB.....BIMMMMB......................',
      '......................COOOOIIB.....BIIOXMMB.....................',
      '......................CIIIIIEB.....BEIIIIIB.....................',
      '.......................BBBBBB.......BBBBBB......................',
      '................................................................'
    ],
    [
      '................................................................',
      '.....................................ICC........................',
      '.......................CCC...........QWWJ.......................',
      '......................CWWQGB.......AbbbbbB......................',
      '.....................EbbbbbWE.CCC.CbbWbbbWE.....................',
      '....................EPbbbWbWbCOPPCbbbbkbQWC.....................',
      '....................CPQbkcWWQKWhQKWWWhckQD......................',
      '.....................MQbcccWGMMIOMIWcYhYQC......................',
      '..................DDNDWbbGMOPPPPOIPMMPcWQWWDD...................',
      '................AWWbWQWWIPPPPPMMPPPOPOGWQWbkcD..................',
      '................bbfbQQQMPPPPOMOOMMMPPPPGWWWYbbC.................',
      '...............WbbcWWWGXPPOPMPPPPMMPMMPOIbbbbbB.................',
      '...............EWWWbbMPXXPPPPPPPPPPOPPXXPJcbWWB.................',
      '................NQWbbMPPPPXOXPPPMMMPPXXOXMcbWD..................',
      '.................BWbCOPPPPPMPPPPGMOIPPPPPOGbbFC.................',
      '.................BWQCOPPPPPUPPPMggggPPPPPOINWWC.................',
      '..................CGIPMPPOIOMPPMggPOMPPPMMOEEW..................',
      '.................BOMOIPPPMXgMPPMggaggMPPPMMMCC..................',
      '................COOGIPPPMaPPgMPOgggOMgIPPPMIGiE.................',
      '...............BOOGdOPPMaBCCCgMOggCBBCaMPPOOiRXC................',
      '...............BOIQRNIMICZkBEgggggkCEZBMMIEMNdPE................',
      '................MMMRGaOIgkIBMgggggIBMkgMXaCMMXC.................',
      '................COOGiaMOgkMOMgggggIPPkgMaCGGIPOGC...............',
      '...............BOOINWMgOggjgggggggggjggMIMIIIdOOPC..............',
      '..............COOIOJcIGOagggggggggggggMOIIMIcYdMOOC.............',
      '.............CPIEOOYiIMOEggggggaggggggCMMGMIOiPEIOC.............',
      '.............BPCMOMVVNOIIGGgggggggggCGIIOGMMMQOIOOB.............',
      '.............BOOIOIOdIOOEIIGBNaaaXBCIGEMIIIMOOOOMC..............',
      '..............CMOIOIIIGOIGGECiaaaiHLGGIIIIMIOOOIC...............',
      '...............BMOIOIIGGICCUFhidSiRLHREIIIIOIOOOOC..............',
      '..............COOOIOMIIIERHUJRSYSYRYHSdEIIIIOMIOOOC.............',
      '.............COMIIMMIIICiYHFUIkLkHcYHSkkIIIIIIMIOOC.............',
      '............COMCMMIIIIEkkiHRUUdRiciLHkikEIIIIMOEIOC.............',
      '............CMMCIMIIIEikkkHLFUIRLLLLHdkkkCIIIMGOMC..............',
      '.............CMMGMIIEikkiDHHLJUQLLLLHdkikkEIGMOC................',
      '...............CMIGGkkkkECCDDHUIHHHHHikkkkkCGIIB................',
      '...............BEIECkkkkCHQjjDGUMHHFZikkkkkBGCB.................',
      '................BBECkiidEFNHZjFcUCWPZikkkkiB....................',
      '...................EEdZZDJPFjNFcbUXQZikiiid.....................',
      '....................EdidFJJFjEDdHXPOJdddddC.....................',
      '....................CggPFJJHjELHLHFUCEdikEGC....................',
      '....................BgggaJJFjDLLLLFFOGgggGUEE...................',
      '....................BgggIFFHjDLLLLLEMPgggGPUC...................',
      '.....................BggDPFjjDLLLLLCOagggEUUC...................',
      '....................BHGaXJFjNDLLLLLFPUaggEUPE...................',
      '...................CHHHLLDDDDLLLLLLHIUgggPUUE...................',
      '...................CLLHLLLHLLLLLLLLLEUPIJaUUC...................',
      '..................BLLLLLLLHLLLLLLLLLCPYVYPPGC...................',
      '.................BLLLHLLLHLLLLLRLLLLLCEcECCHHB..................',
      '................EHhYHLLLLFLLLLLkLLLLLFHHHFLHSHB.................',
      '................CHiRHLRLLFLhLLLkbLLRRLLLLLHRiLB.................',
      '...............CRYLLHRRcHLLRLLkcVLLRLLLRhRHLLLRB................',
      '..............CYYccHLLLLHRRRLLYkLLLRRYLLYLLRYcccB...............',
      '..............CYcccRccLLHccccccRcccccYHLLRcRccccB...............',
      '...............CYYRYccccLLYHYLYRRRLLHHLcccccYccB................',
      '................CCRccccccQaUXHHHHHHLaXYccccYRXC.................',
      '..................CCYYYYDdiiiBCCBBCCiiGYYYYBB...................',
      '....................CCCCEGIIGB.....EIGIMBBB.....................',
      '.......................CCMgIGB.....BIggEC.......................',
      '.......................BMMMIGB.....BIMMMMB......................',
      '......................COOOOIIB.....BIIOXXMB.....................',
      '......................CIIIIIEB.....CEIIIIIB.....................',
      '.......................BBBBBB.......BBBBBB......................',
      '................................................................'
    ],
    [
      '................................................................',
      '.......................CCC...........ICC........................',
      '......................NQQQGB.......BDWWWD.......................',
      '.....................EbbbbbWE.CCC.CWbbbbbB......................',
      '.....................JbbbWbWbCOOOCbbbWbbbWE.....................',
      '....................BObbkcWWQKWhQKWWWYkbQWC.....................',
      '....................BONbcccWGMMIOMIWchckQD......................',
      '...................DDNQbbGMOPPPPOIPMMWhYQC......................',
      '..................WcbQNWIPPPPPMMPPPOPPGWQWWDD...................',
      '.................bbcWQQMPPPPOMOOMMMPPPPGWWWicD..................',
      '...............BbbccWWGXPPOPMPPPPMMPMMPOIbWYbbC.................',
      '...............BbbcbbMPXXPPPPPPPPPPOPPXXPJcbbbC.................',
      '...............EWWWbbMPPPPXOXPPPMMMPPXXOXMcbWWC.................',
      '................CQWbCOPPPPPMPPPPGMOIPPPPPOGbbDB.................',
      '.................BWbCOPPPPPUPPPMggggPPPPPOIbbbB.................',
      '.................BWGIPMPPOIOMPPMggPOMPPPMMIFWWC.................',
      '.................BOMOIPPPMXgMPPMggaggMPPPMOEEQG.................',
      '................COOGIPPPMaPPgMPOgggOMgIPPOMOCI..................',
      '...............COOGGOPPMUBCCCgMOggCBBCaMPPOIIkC.................',
      '...............BOIQRNIMICZkBEgggggkCEXBMMIIMiRZC................',
      '................MMMRFaOIgkIBMgggggIBMkgMOgCMMiPE................',
      '................COOGdaMOgkMOMgggggIPPkgMaUBIIgC.................',
      '...............BOOMIWagOggjgggggggggjggMgCIGIPOGC...............',
      '..............CPOIOIcMGOagggggggggggggMMIMIIIkOPPC..............',
      '.............COIEOOOiGMOEggggggaggggggCMIIMIcYZMOOC.............',
      '.............COCMOMYVYOIIGGgggggggggCGIIOGMIOdPEIOC.............',
      '.............BOOIOIIcIOOEIIGBUaaaXCCIGEMIGMMMQOIOOC.............',
      '..............COOIOIIIGOIGGECRaaaSCEGGIIIIIMOOOOIC..............',
      '...............BMOIOIIGGICCUFhhaiiHLDCEIIIMIOOOIC...............',
      '..............COOOIOMIIICRHUJRSiSdRLHSYGIIIOIOOOOC..............',
      '.............COMIIMMMIIGdYHFUIkLkHcYHSdEIIIIOMIOOOC.............',
      '............COMCMMIMIIIEkdHRUUdRiciRHSkkIIIIIIMIOOC.............',
      '............COMCMMMIIIEkkkHLFUIRHLLLHkikEIIIIMOEIOC.............',
      '.............CMMGMIIIEikkdHLLJUQLLLLHdkkkCIIIMGOMC..............',
      '...............CMIIIEkkkkEEHHHUIHHHHHdkikkEIGMOC................',
      '...............BEIECkkkkJdjCEHGUMHHFSikkkkkCGIIC................',
      '................CBECiiidEFHZjEFcUCDPZikkkkkBJCC.................',
      '...................EEddZDFPFjZFTRUbWZikkkkiB....................',
      '....................EdidFJJFjFFRhUPEGikiiid.....................',
      '....................CggaFJJFjEDdFFUPNEddddC.....................',
      '....................BgggaJJHjELHLHFUCEdikEUE....................',
      '....................BgggaJJFjDLLLLFFOGXggGUPE...................',
      '....................BgggIFFHjDLLLLLEMPgggGPUC...................',
      '.....................BggDPFjjDLLLLLCOagggEUUC...................',
      '....................BHGaXJFjDDLLLLLFPUaggEUPE...................',
      '...................CHHHLLDDDDLLLLLLHIUgggPUUE...................',
      '...................ELLHLLLHLLLLLLLLLEUXIJaUUC...................',
      '..................BLLLLLLLHLLLLLLLLLCPYVYPPGC...................',
      '.................BLLLHLLLHLLLLLRLLLLLCEcECCHHB..................',
      '................EHhYHLLLLFLLLLLkLLLLLFHHHFLHSHB.................',
      '................CHiRHLRLLFLhLLkkbLLRRLLLLLHRiLB.................',
      '...............CRYLLHRRcHLLRLLYTVLLRLLLRhRHLLLRC................',
      '..............CYYccHLLLLHRRRLLLkLLLRYYLLYLLRYcccB...............',
      '..............CccccRccLLHccccccRcccccYHLLRcRccccB...............',
      '...............CYYRYccccLLYGLLRRRLLLHHLcccccYccB................',
      '................CCRccccccZaaXHHHHHHLaXYccccYRXB.................',
      '..................CCYYYYDdiiiBCBBBCCiiJLYYYBB...................',
      '....................CCCCEGIIGC.....CIGIMBBB.....................',
      '.......................CCMgIGB.....BIggEC.......................',
      '.......................BMMMIGB.....BIMMMMB......................',
      '......................COOOOIIB.....BIIOXMMB.....................',
      '......................CIIIIIEB.....CEIIIIIB.....................',
      '.......................BBBBBB.......BBBBBB......................',
      '................................................................'
    ],
    [
      '................................................................',
      '......................................B.........................',
      '.......................CCC...........WWWE.......................',
      '......................DWWQGB.......BbbbbbB......................',
      '.....................EbbbbbWE.CCC.CbbbbbbWE.....................',
      '....................EPbbbWbWbCOPPCbbbbkbQWC.....................',
      '....................CPQbkcWWQKWhQKWWWYckQD......................',
      '.....................MQbcccWGMMIOMIbchhYQC......................',
      '..................DDNDWbbGMOPPPPOIPMMWcWQWWDD...................',
      '.................WWbWQWWIPPPPPMMPPPOPPGWQWbkcD..................',
      '................bbcbQQQMPPPPOMOOMMMPPPPGWWWVbbC.................',
      '...............IbbcWWWGXPPOPMPPPPMMPMMPOIbbbbbB.................',
      '...............EWWWbbMPXXPPPPPPPPPPOPPXXPJcbWbB.................',
      '................QQWbbMPPPPXOXPPPMMMPPXXOXMcbWD..................',
      '.................QbbCOPPPPPMPPPPGMOIPPPPPOGbbD..................',
      '.................BWWCOPPPPPUPPPMggggPPPPPOIQWW..................',
      '..................CGMPMPPOIOMPPMggPOMPPPMMOEEW..................',
      '.................BOMOIPPPMXgMPPMggaggMPPPMMICC..................',
      '................COOGIPPPMaPPgMPOgggOMgIPPOMGGZG.................',
      '...............COOGJOPPMaBCCCgMOggCBBCaMPPOOfRPC................',
      '...............BOIQRNIMICZkBEgggggkCEZBMMIIOQQPE................',
      '................MMMRIaOIgkIBMgggggIBMkgMUaCMMPC.................',
      '................COOGdaMOgkMOMgggggIPPkgMaUGGIPOGE...............',
      '...............BOOIJWMgOggjgggggggggjggMgCIIIPOPPC..............',
      '..............CPOIOWWIGOagggggggggggggMMIMIIcYZMOOC.............',
      '.............CPIEOOcIIMOEggggggaggggggCMIIMIOdPEIOC.............',
      '.............CPCMOJVVKOIIGGgggggggggCGIIOGMMMQOIOOC.............',
      '.............BPOIOIcZIOOEIIGBUaaaXCCIGEMIIIMOOOOIC..............',
      '..............CMOIOIIIGOIGGECQaaaSDLGGIIIIMIOOOIC...............',
      '...............CMOIOIIGGICCUFhhaiiHLHCEIIIIOIOOOOC..............',
      '..............COOOIOMIIICRHUJRSbSYRLHSdEIIIIOMIOOOC.............',
      '.............COMIIMMIIICdYHFUIkLkHcYHSkkIIIIIIMIOOC.............',
      '............COMCMMIIIIEkkdHRUUbRiciLHkkkEIIIIMOEIOC.............',
      '............CMMCIMIIIEikkkHLFUIRLLLLHdikkCIIIMGOMC..............',
      '.............CMMGMIIEkkkkiHHLJUQLLLLHdkikkEIGMOC................',
      '...............CMIGGkkkkkCCDDHUIHHHHHikkkkkCGMMC................',
      '...............CEIECkkkkEFHjjDGUMHHFdikkkkkBICC.................',
      '................BBECiiidCFJHZjDcUCGPZikkkkiB....................',
      '...................EdddZDJPFjHFcYUPWZikiiid.....................',
      '....................EdidFJJFjEDbHUPOJdddddC.....................',
      '....................CggaFJJHjELHLFUUCEdikEUC....................',
      '....................BgggaJJFjDLLLLFFOGZggGUPE...................',
      '....................BggaIFFHjDLLLLLEMPgggGPUC...................',
      '.....................BggDPFjjDLLLLLCOagggEUUC...................',
      '....................BHGaXJFjJDLLLLLFPUaggEUPE...................',
      '...................CHHHLLDFDDLLLLLLHIUgggPUUE...................',
      '...................EHLHLLLHLLLLLLLLLEUPIJaUUC...................',
      '..................BLLLLLLLHLLLLLLLLLCPYVYPPGC...................',
      '.................BLLLHLLLLLLLLLRLLLLLCEcECCHHB..................',
      '................EHhYHLLLLFLLLLLkLLLLLFHHHFLHSHB.................',
      '................CHiRHLRLLFLLLLLkLLLRRLLLLLHRiLB.................',
      '...............CRYLLHRRcLLLRLLkcVLLRRLLLRRHLLLRB................',
      '..............CYYYcHLLLLHRRRLLYkTLLRcYLLYLLRYcccB...............',
      '..............CYcccRccLLHcRcccckcccccYHLLRcRccccB...............',
      '...............CYYRYccccLLYYcccRRYLLYHLcccccYccB................',
      '................CCRccccccZaPXHHHHHHLXXYccccYRXC.................',
      '..................CCYcYYDdiiiBCCBBBCiiZLYYYBB...................',
      '....................CCCCEGIIGC.....CIGIMBBB.....................',
      '.......................CCMgIGB.....BIggEC.......................',
      '.......................BMMMIGB.....BIMMMMB......................',
      '......................COOOOIIB.....BIIOXXMB.....................',
      '......................CIIIIIEB.....BEIIIIIB.....................',
      '.......................BBBBBB.......BBBBBB......................',
      '................................................................'
    ]
  ];

  const FEMALE_PROTAG_WALK_ROWS = [
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '..................CCC..........CCC..............................',
      '.................DWWWCC.....CCCWWWJ.............................',
      '................CbcbbWWC...CWWcbbbcC............................',
      '................CccQbbbWCCCWbbbbbbcC............................',
      '................CbkbQQbFbQbcQccbbbcMCCCC........................',
      '................CbbcccQbcKQWWQckbbWNbbbbWK......................',
      '...............CWbbIMMQIMIQQWbbkbbWKbckkbbE.....................',
      '...............CMOOPPPMMMMIIcbccbcWKWbbbbbbC....................',
      '..............CMIOMMPPPPPPPPPMIcccWKQQbbbQQC....................',
      '.............CPPPMPPMPPMMMPPPPPIccKWWbbbQWCCCCCCC...............',
      '............CUPPMPPPMPOPPPMPPPPPMQQccccWWCPPGPPPPE..............',
      '...........CPXPOPPPPPPMPPPXOPPPPIQbccccWCCPPPPPPPM..............',
      '...........CPPXMaPPMMPPPXaPPMPPPPIQWbccQCPPPPPIIOOC.............',
      '..........CPPPOPPPMIMOOPPPPPMMPPMOkQQQWQCOOPMOOCIMC.............',
      '..........CPPPMPPPMggggPOPPPPMUIPOIkLECMOOMOdOOMCG..............',
      '..........CPPIMOPPIggOOMMPPPPMIIOOIMkVfMNckVVkOOOE..............',
      '..........COPIIaPUMggOgggIPPPPPIMOIMGkJcccPOOOOOIMCCC...........',
      '..........CMPMXaMUOgggOOggIMPPPIMOIOIMMOOOOOOOOOOIOPPC..........',
      '...........COMXCCOOggCCCCggMMMIMaOIIIOOOOOOOOOOIIIOPOPC.........',
      '............GCCNCgggCkCCNCggMMgagMIIMMOOMMIIIIIOOIIIOOC.........',
      '.............IIkCggggICOkgggOMXXgCIIIIIIIEOOOOIIIIOEIPC.........',
      '..............CkOggggOUPkgggOgaagLCNkkkkkkCGIIIIIIEMOC..........',
      '..............CggggggggjggggOgggDLkkkkkkkkkCIIIIIIMC............',
      '..............CgggggggggggggOiLLLkkkkkikkkkkCCCCCCCC............',
      '.............CCCgggagggggggOMjLLFckkiiikkkkiCUOGC...............',
      '............CjiDCggggaggaaaagGcLLFccECikkZZdeUUMPC..............',
      '............CjjHHCCgggkaUPkcRdYLLHHHHCCkddkkCakMUPC.............',
      '............CjjHUJFFCkkiMUOIhLcYLLLHKECCCZgggCjMUUOC............',
      '............CjjFFPJFDkkddHOUMaILLLHHCeCLHEggggCUUPOC............',
      '............CiFFJJJFkkiidCfJOUUUUMMMMMDDEgggggCUUOMC............',
      '...........CjjFJJJJFiiiiCCELLHFJUUUUUUUUIaXgggkVVOC.............',
      '...........CjjFJJJJHddiC...CHHFDEZcFFFFFHGaagCfVVeC.............',
      '...........EjFNNJJFHddC.....CCFhkQHFLLLLLCCCCUPVVCCCC...........',
      '............CFFFFNFCCC.....CCFFHFFHLLLLLLLLCCOPCCLLcYC..........',
      '.............CCCHHFC......CHLLLLLLLLLLLLLLLLCCCLShLhcC..........',
      '................CCC.....CCHLLkLLLLLLLLLLLLLLLLLLLcLLRC..........',
      '.......................CCLLcfccLLLLLLLLLLLLLLLLLYLLhYC..........',
      '......................CSRLLLkHLLLLLLLLLLLLLLLLLcLLccC...........',
      '......................bcchhhcccYLLLkLLLLLLLLLLYLLcccC...........',
      '.....................CHHLLLLHLhccRLLLkLLLYRYkLLLccYC............',
      '.....................CHFgggXaNHYccccLLLLLLLLLLccccC.............',
      '.....................CHFggggggaFDHYcccccccccccccSC..............',
      '......................CFEgggggkIIGFFLLLLcccccccCC...............',
      '......................CHDEagggkGIMECXXXXECCCCCC.................',
      '.......................EFHCCIkEIIMECXXXXELC.....................',
      '.........................CECFCMgMMECXXgggC......................',
      '............................CCCEPMGCXggggC......................',
      '..............................COPIICagggggC.....................',
      '..............................CIIIC.CgggggE.....................',
      '...............................CCC...CggggZN....................',
      '.....................................CgggikE....................',
      '......................................CiidIC....................',
      '......................................CIGGGGC...................',
      '......................................CIgIIIC...................',
      '.....................................CMMIIIIGC..................',
      '....................................COXUIIIGGC..................',
      '....................................CIIIIMCCCC..................',
      '.....................................CCCCC.C....................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '..................CCC..........CCC..............................',
      '.................CWWWCC.....CCCWWWJ.............................',
      '................CbbbbWWC...CQQbbbbcC............................',
      '................CccQbbbWCCCWbbbbbbcC............................',
      '................CbkbQQbFbQbcQccbbbcMCCCC........................',
      '................CbbcccNbcKQWWNckbbWNbbbbWK......................',
      '...............CQbbIIIQIMIQQWbbkbbWKbbkkbbC.....................',
      '...............CMPPPPPMMMMIIcbccbcWKWbbbbbbC....................',
      '..............CMIPMMPPPPPPPPPMIcccWKQQbbbQWC....................',
      '.............CPPPMPPMPPMMMPPPPPIccKWWbbbWWC.....................',
      '............CPPPMPPPMPMPPPMPPPPPIQQccccWQC......................',
      '...........CPaPOPPPPPPMPPPXMPPPPIQbccccWC.......................',
      '...........CPPaMaPPMMPPPaaPPMPPPPIQWbccQC.......................',
      '..........CPPPPPPPMIMOOPPPPPMMPPMOkQQQWQC.......................',
      '..........CPPPMPPPIggggPPPPPMMUIIOIkLCCPOEC.....................',
      '..........CPPPMOPPIggOOMPPPPPMPPOOIOkYfOPPPCE...................',
      '..........COPIGgOUMggMggIPPPPPPMMOIMIkOIXUPNPCC.................',
      '..........CMPMagMUMgggOMgMIPPPPMMOIOIIOffkVfPOOC................',
      '...........CPMXCCMMggCCCCgPMMIIgaOIIIIMIICXXkMMMG...............',
      '............GECQCgggCkCCNCggMMgXgOIIMkkkkkCPOOMEPC..............',
      '.............IMkCggggICOkgggOMXXgCZZkkkkkkkCPOMCP...............',
      '..............CkPggggMUPkgggOgXagFkkkkikkkkkCMIOC...............',
      '............CCCggggggggjggggOgggEkkkkdikkkkhEMMMOC..............',
      '...........CiiCgggggggggggggOiLLHckkiiikkddiCCMMOPC.............',
      '...........CiiHCgggagggggggPMiLLHcYYCCCkddkkCCEIMPC.............',
      '...........EiiHOCggggXggaaaagEcLLFHLCOPCCCgggggCMPC.............',
      '..........CiiiFUFCCgggkaUOkcRccLLHLHHCCCCCCggggCIC..............',
      '..........CiiFFJJFCCGkkjMUOOMIccLLLHHC...EgggggC................',
      '.........CiiQJJJJFkkkkdiDHJUUUULLLHHCWCCCCaXggC.................',
      '.........CiiFFJJJFkkkiiiCCkRRRUUUIMMMUOOOOGXECEG................',
      '.........CiFXPJJJFiiiiCC..ELRRFFUUUUUUUUjkgMkGUOC...............',
      '..........CFFFFFFHddiCC....CHHFECZkFFFFJGgjkjgaaUC..............',
      '...........CCFHHCjddC...CCCDCCFfkQHFLLLLDCOUjkfVVPC.............',
      '.............CCCDCCC..CCCLLLHHFLFFHLLLLLLCGEOOPVVVC.............',
      '......................LLLLLkLLLLLLLLLLLLLLLCCOMMCC..............',
      '.....................SLLLccccLLLLLLLLLLLLLLLLCCC................',
      '....................CQhccLkLLLLLLLLLLLLLLLLLLLLECE..............',
      '....................CQHHhhccLLLLLLLLLLLLLLLLLLLLcLC.............',
      '....................CggaLQRhcLLLLLLLLLLLLLLLLLLcLLcC............',
      '....................CgggggHLccYLkLLLLLLLLLLLLLYLLhcC............',
      '....................CggggjCCHcccLLkLLLLLLLLLkLLLchcC............',
      '....................CggggCHHFHLccLLLLLYYckLYLLccccC.............',
      '....................CggggCHHFFFLccccYLLLLLLLLccRSC..............',
      '....................CggggCHHFFFFFFHHcccccccchLHEC...............',
      '....................CkkkgCCDFFFFHHHHDCCHHHHHHHggGC..............',
      '....................CMMjOC...CCHHHHHDDCCCgggggggggCCCC..........',
      '....................EOIGIE.....CCCCC.....CgggggggkEGIIEC........',
      '..................ECMgIIIC................CCEggggkIIIEC.........',
      '.................COMMIMMIIC..................ECEkGIIIIC.........',
      '................COUUUIMMEIC.....................COgIIICZ........',
      '................CMMMMMMCCCC......................CEMOMEC........',
      '.................CCCCCC.C........................CCIUIIC........',
      '..................................................CIPME.........',
      '..................................................CGMMC.........',
      '...................................................CCC..........',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '..................CCC..........CCC..............................',
      '.................CWWWCC.....CCEWWWJ.............................',
      '................CbbbbWWC...CQQbbbbcCCCCC........................',
      '................CccQbbbWCCCWbbbbbbcCbbbbQK......................',
      '................CbkbQQbFcQbcQccbbbcObbkkbbC.....................',
      '...............CQbbcccKbcKQWWNckbbWQbbbbbbbC....................',
      '...............CQbbIIIQIMIQQWbbkbbWKWbbbbQQC....................',
      '...............CMPPPPPMMMMIIcbccbcWKQQbbbQC.....................',
      '..............CMIPMMPPPPPPPPPMIcccWKQbbbQC......................',
      '.............CPPPMPPMPPMMPMPPPPIccKbcccWC.......................',
      '............CPPMMPPPMPMPPPXMPPPPIQQccccWCCCCCCC.................',
      '...........CPaPOaaPPPPMPaaPPMPPPIQQWbccQCPPOPPUEE...............',
      '..........CPPPMPPPPMMPPPPPPPPMPPMOkQQQQJMMMMaOPPPC..............',
      '.........CPPPMPPPPIMMOMMPPPPPMMIIOIkYYYfSYkYYkMIOPC.............',
      '.........CPPPMPPPIggggggIPPPPPPPOOIOPikMVcUPOOIEIIC.............',
      '.........CPPIMPPMggggOOMgXIIPPPMMPIOMMMMOOPPOOOOIC..............',
      '.........COPMCPPIggggMgggggMMPPMMOIOIIOOOOPPPOPOMOC.............',
      '.........COM.CMOggggggOMggggMIPMMOIPIMOOPPPPPMIIMOOC............',
      '..........CM.CgCgggggCCCCgggMIIgaOIIIOOOMMIIIOOOIPOC............',
      '...........E..CLCgggCkCCQCggMMgXgMIIMMMIIEPPIIIIIMOPC...........',
      '..............EkCggggICOkgggOMXXgCMIkkkkkiCMIIIIMIMPC...........',
      '..............CkPggggMUPkgggOgXagHDZkkkkkkkCEIIICMMOC...........',
      '..............CggggggggjggggOgggCHkkkkikkkkkCCIC.CJE............',
      '............CCCgggggggggggggOiLLHkkkddikkkkdC.CC..C.............',
      '...........CiiDCgggagggggggPMiLLDcikiCikkddii...................',
      '...........CiiHECggggXggaaaagEcLLFccCCCkddkkCCC.................',
      '...........CiiFUJCCgggkUUOkcRccLLHHHHC.CCdgggCJCC...............',
      '..........CiiiFFUFHCCkkiMUIIcLccLLLHFC.CMCggggCVVC..............',
      '..........CiiFFJJJFCkkdddFUUUUILLLHHC.COMgggggCVVRE.............',
      '.........CiiiFJJJJFkkiiiCCkHOUUUUIMMIIUUIgUgggEMMC..............',
      '.........CiiFFJJJJFiiiiC..CLLLFFUUUUUUUFHDaagCCC................',
      '.........CiiFPJJJFHdiiC....CHFFECjkFFFFLLCCCCLCCF...............',
      '..........CCFFFQFCdddC......CCFfkQHFLLLLLLLLLLLLDCC.............',
      '...........CCCFHHCCCC.......PLFLFFHLLLLLLLLLLLLYLLcC............',
      '..............CCC..........CHLLLLLLLLLLLLLLLLLhcLccC............',
      '..........................CLLLLLLLLLLLLLLLLLLLYLLhD.............',
      '........................DFRLLLLLLLLLLLLLLLLLLcLLhcE.............',
      '.......................CQkfcLLLLLLLLLLLLLLLLLLLccEEC............',
      '......................CLLHLLLLLLLLLLLLLLLLLLLRcYDMMCC...........',
      '.....................CYhccccLLLkLLLLLLLLkLLLYhRJMMIMMC..........',
      '.....................EFHHLcccYLLLkLLLYcRLLchcLNNMMMMMMC.........',
      '......................CgQQLLccccLLLLLLLcYcccHHgkIagMUIIC........',
      '.....................CgggXXXJHcccchccccccLLHgggkiCCEOIIC........',
      '....................CgggggggCCCCCCCCCDJJPXaggggCC....CC.........',
      '...................CCggggggC.........CaaagggggC.................',
      '...................gggggggC............CggggCC..................',
      '...........CCC...CCggggggC..............CCCC....................',
      '..........CMMUCCDJkgggggC.......................................',
      '..........CMMaUMMIkkgggC........................................',
      '..........CMMPPMgIIJkkC.........................................',
      '...........CMIIMIIIMCC..........................................',
      '............CIMMMMMII...........................................',
      '.............CEIMMMC............................................',
      '...............CIIC.............................................',
      '................CE..............................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '..................CCC...........................................',
      '.................CWWWWC.......CCCC..............................',
      '................CbccbWWE.....CWWWWJ.............................',
      '................CccbbWWE...CKWbbbbcCCCCC........................',
      '................CbcQbbbQCCCWbbbbbbcCbbbbQK......................',
      '................CbkbQQbFbQbbQccbbbcObbkkbbC.....................',
      '...............CQbbcccKbcKQWWNckbbWQWbbbbbWC....................',
      '...............CQbbIIIQIMIQQWbbkbbWKWQbbbQQC....................',
      '...............CMPPPPPMMMMIIcbccbcWKQbbbQWCCCCCCCC..............',
      '..............CMIPMMPPPPPPPPPMIcccWKQbcWWCPPGPPPOOC.............',
      '.............CPPPMPPMPPPPPMPPPPIccKbcccWCCPPPUMMCC..............',
      '............CPPMMPPPMPMPPPXMPPPPIQWccccWCPOPkMMG................',
      '..........CCPaPOaPPPPPMPaaPPMPPPPOQQWWWQCMMfMMOC.CCCC...........',
      '.........CPPPPPPPPMMMPPPPPPPPMMIMOkKKKCEOckJOOOMEOOOOC..........',
      '........CPPPMPPPPIMMaOMPPPPPPMMPIOIkhYVhVVXOOOOMMPPPOPC.........',
      '........CPPIIPPPEagggggPIPPPPPPMOOIMOkkOUPPPOOOPIIIIMPC.........',
      '........CPOICUXEgggggOOMgIIIPPPMMPIOMMOMPPPPPPIIIIMMEEE.........',
      '........COE.CMMggggggMgggggMMIPMMOIOIIOOPPPPPOOPOICC............',
      '.........IC..CXgggggggOMggggMIPMMOIPIMOOPIIIIIIIIC..............',
      '.............CgCgggggCCCCgggMIIgaOIIIOOOPOPOIIIIC...............',
      '..............CQCgggCkCCQCggMMgXgMIIIIIIIIIIIMCE................',
      '..............EkCggggICOkgggOMXXgCIIIIIIIIECCC..................',
      '..............CkPggggMUPkgggOgXagCCCCCCCC..COIGEEC..............',
      '..............CggggggggjggggOgggCHHC......EUXMUUUPC.............',
      '..............CgggggggggggggOiLLLLLdC.....CUkMUUOOC.............',
      '...............CgggagggggggPMiLLFdkjiC...CUXkaUUVOC.............',
      '................CggggaggXaaagEcLHikkkkC..CUUkgXVVYC.............',
      '.................CCgggUUOOkcRccLDikkkkkC.UUUgMkVVCE.............',
      '...................CCCCZIOMHkLccHDikkkkkCEOUkkaUUE..............',
      '................CCCHHHCdiCOUGbLLLHCcikkkkCkgUUCCC...............',
      '...............CFHFHHFFCCCCOUUUOHHCYkkkkkCUUGG..................',
      '..............CkFaaOPJFFkkCFHUUUOCikkkkkkCLJCC.CC...............',
      '...............CZFXFgFJFhcdJFFFECadddkkkkCLLLLLDDEC.............',
      '...............CkHFFJJJFFHZdCCCggDZkdkkkCLLLLLLLYLcC............',
      '................EiFFJJJJHHdCXCggggggddiCLLLLLLLYLYcC............',
      '................EiFFJJFQFFCCLCagggggddCRLLLLLLhcLccC............',
      '................OgFFXFFHFFCCLLDgggggCHLLLLLLLLcLLcYC............',
      '.................ChFQHHCECCLLLFCgggCLLLLLLLLLYLLccC.............',
      '..................CLHCCC.CLLLLLRCCCLLLLLLLLLkLLccC..............',
      '...................CC...CLLLLLLLLLLLLLLLLLLYLccYC...............',
      '.......................CLLcLLLLLLLLLLLLLLkLLRhRE................',
      '.......................CLFLkkLLLLLLLLLLccLLccHO.................',
      '.......................CLhLLLLLkLLLLLYcLLhhcFJC.................',
      '........................ChccLLLLLkLLLLLccLLLMMIC................',
      '.........................EFccccLLLLcccccLIgIUMMC................',
      '..........................CLHRccccchiHLHkkCCOPMC................',
      '..........................CggHHHHLLHHgggCC..CCC.................',
      '..........................CgggggCagggggC........................',
      '..........................CgggggCagggEE.........................',
      '..........................CggggC.CCCC...........................',
      '.........................CgggggC................................',
      '.........................CgggggE................................',
      '.........................CkkkkGC................................',
      '........................CMGGMMC.................................',
      '.....................CCCDgIIIIC.................................',
      '....................CMMMMMMMIIC.................................',
      '....................CIPPPIIIIIC.................................',
      '....................CIIIIIMCCCC.................................',
      '.....................CCCCCC.C...................................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '..................CCC..........CCC..............................',
      '.................CWWWCC.....CCCWWWJ.............................',
      '................CbcbbWWC...CWWbbbbcC............................',
      '................CccQbbbWCCCWbbbbbbcC............................',
      '................CbkbQQbFcQbbQccbbbcOCCCC........................',
      '................CbbcccNbcKQWWNckbbWNbbbbWK......................',
      '...............CQbbIIIQIMIQQWbbkbbWKbbkkbbC.....................',
      '...............CMPPPPPMMMMIIcbccbcWKWbbbbbbC....................',
      '..............CMIPMMPPPPPPPPPMIcccWKQQbbbQQC....................',
      '.............CPPPMPPMPPMMMPPPPPIccJWWbbbQWCCCCCCC...............',
      '............CPPPMPPPMPMPPPMPPPPPIQQccccWWCPPGPPPPC..............',
      '...........CPaPOPPPPPPMPPPXMPPPPIQbccccWCCPPPPPPPPC.............',
      '...........CPPaMaPPMMPPPaaPPMPPPPIQWbccQCPOPPPMIIMC.............',
      '..........CPPPPPPPMIMOOPPPPPMMPPMOkQQQWQCOOMkMOICE..............',
      '..........CPPPMPPPMggggPPPPPPMUIIOIkLCCIOOPfMMOIE...............',
      '..........CPPPMOPPIggOOMMPPPPMMIOOIMkcfMPckJOOOOMCCCC...........',
      '..........COPIGaPUMggMgggIPPPPPMMOIMGkMcccOOOOOOMMOOOC..........',
      '..........CMPMXaMUMgggOMggIMPPPMMOIOIMMOOOPPPPOOPIPPOC..........',
      '...........CPMXCCMMggCCCCggMMIIgaOIOIOOOOPPPPPPIIIIIMC..........',
      '............GCCQCgggCkCCQCggMMgXgMIIIOOOOPIIIIIOPOICC...........',
      '.............IMkCggggICOkgggOMXXgCIIIOIIOIPOPOIIIIC.............',
      '..............CkPggggMUPkgggOgXagCMIIIIIIIIIIIIIIC..............',
      '..............CggggggggjggggMgggCCIIIIIIIIIIIICCC...............',
      '..............CgggggggggggggOhLHLLEECCCCCCECCCC.................',
      '...............CgggagggggggPMHFkkHHLC......CMIIGG...............',
      '................CggggCCCaaaagHkkkkHLC.....EUUMUUUC..............',
      '.................CCgCgggCOkYRYkkkkHLHC....UUUMUUPMC.............',
      '...................CgggggCMMSdkkkkHHHC...CXXkUUUOOC.............',
      '...................CgggggCZZZdkkkiHHCWC.CUUUkUUVVeC.............',
      '...................CgggggkZkkiikkkECaWCCOUUUjkkVVdC.............',
      '....................CgggkkZkkkkkkkEIIIOUkkkkkkkVVC..............',
      '.....................CCCkdkkkkkkkCUUUUUUUaaaUOPE................',
      '......................CFCdkkkkkkkCFFFFFFFFFJECC.................',
      '......................CCFCCdkkkiCLLLLLLLLLLLLCCC................',
      '.......................jECLECCCLLLLLLLLLLLLLLLLEYCC.............',
      '.......................CHLLLLLLLLLLLLLLLLLLLLLLLLYcC............',
      '......................CSLLLLLLLLLLLLLLLLLLLLLLLhLhcC............',
      '.....................ELHhcLLLLLLLLLLLLLLLLLLLLYYLRSC............',
      '....................EhhLLhkLLLLLLLLLLLLLLLLLLLYLLhb.............',
      '....................CLhhLHRkhLLLLLLLLLLLLLLLkLLLcbC.............',
      '....................CZLLcbRLLLLLLLLLLLLLLLLYLLccYC..............',
      '....................CggSHhhhcLLLkLLLLLLLLkLLLhcHC...............',
      '.....................CgggQLLccYLLLkLLLYYYLLccYD.................',
      '......................CagggLLLhcYLLLLLLLLhccCC..................',
      '.......................CCCCkDDLcccccccccccHH....................',
      '...........................CMgIFJccccchHLNgC....................',
      '............................CEUMMCCCCCPZgggC....................',
      '............................CMPIIC...CggggggC...................',
      '............................CIIIC.....CgggggC...................',
      '.............................CCC.......CggggZN..................',
      '.......................................CgggikC..................',
      '........................................CiidIC..................',
      '........................................CIIIEEC.................',
      '........................................CIgIIIC.................',
      '.......................................CMMIIIIIC................',
      '......................................COUUIIIGGC................',
      '......................................CIIIIMCCCC................',
      '.......................................CCCCC.C..................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '..................CCC..........CCC..............................',
      '.................CWWWCC.....CCCWWWJ.............................',
      '................CbbbbWWC...CQQbbbbcC............................',
      '................CccQbbbWCCCWbbbbbbcC............................',
      '................CbkbQQbFbQbcQccbbbcOCCCC........................',
      '................CbbcccNbcKQWWNckbbWNbbbbWK......................',
      '...............CQbbIIIQIMIQQWbbkbbWKbbkkbbC.....................',
      '...............CMPPPPPMMMMIIcbccbcWKWbbbbbbC....................',
      '..............CMIPMMPPPPPPPPPMIcccWKQQbbbQWC....................',
      '.............CPPPMPPMPPMMMPPPPPIccJWWbbbQWC.....................',
      '............CPPPMPPPMPMPPPMPPPPPIQQccccWQC......................',
      '...........CPaPOPPPPPPMPPPXMPPPPIQbccccWC.......................',
      '...........CPPaMaPPMMPPPaaPPMPPPPIQWbccQC.......................',
      '..........CPPPPPPPMIMOOPPPPPMMPPMOkQQWbQC.......................',
      '..........CPPPMPPPMggggPPPPPMMUIIOIkLCCOOEC.....................',
      '..........CPPPMOPPIggOOMPPPPPMMPOOIMkYcOPPPCC...................',
      '..........COPIGaPUMggMggIPPPPPIMMOIMGkOMPPONUCC.................',
      '..........CMPMXgMUMgggOMgMIPPPPMMOIOIMMffkcfUPOCC...............',
      '...........CPMXCCMMggCCCCgPMMIIgaOIIIOPPSOONkMMMMC..............',
      '............GECQCgggCkCCNCggMMgXgMIIIOPPPOPPPOOC................',
      '.............IMkCggggICOkgggOMXXgCIIOOOPPIPIIPPGCECC............',
      '..............CkPggggMUPkgggOgXagCMIOOOOPOPOIIIIMMMO............',
      '..............CgggCCgggjggggMgggECIIIIIIIMIIIOPIOPMG............',
      '..............CggCCCCCggggggMHLLLLCMIIIIIPOOIIIIMMC.............',
      '...............CgggggCgggggOOLkLQLLCCIIIIIIIIIIEEE..............',
      '................CgggggCgOUONkkkkHLLDhCCMIIIIIIIE................',
      '................CgggggGZJCkkkkkkFLLHHCCCCCCCCCCC................',
      '.................CgggkidkiikikkiFLLHHC..........................',
      '..................CCkkddkkikkkkDFLLHCeCCCCCCCC..................',
      '....................CiikkkkkkkkJLLHDZQCCaXaPOOCC................',
      '....................CkkkkkkkkkEMODDjjJUUUUkIOUUUI...............',
      '.....................CkikkkkkCUUUUUUUUaaaUgjUUUOOC..............',
      '......................CCCCCCCFFJJFFFFFJJgkkNkVVVPC..............',
      '.......................CCCLLLLLLLLLLLLLHEUUkkfVDCC..............',
      '....................DCRRLLLLLLLLLLLLLLLLLCCUOOCC................',
      '...................CccLhLLLLLLLLLLLLLLLLLLLCCC..................',
      '..................CFLcLLfLLLLLLLLLLLLLLLLLLLFLC.................',
      '..................CgQchLRkLLLLLLLLLLLLLLLLLLLLSC................',
      '..................CggLhcLLkLLLLLLLLLLLLLLLLLLLcLC...............',
      '..................CggQLhcLLLLLLLLLLLLLLLLLLLLcRLcC..............',
      '..................CgggNLcccLLLLLLLLLLLLLLLLLYRLcRE..............',
      '..................CggggEHccYLLkLLLLLLLLLLLkLLLcYC...............',
      '..................CggggC.JcccLLLkLLLLLLLLYLLLcR.................',
      '..................CkgggC..JJcccLLLLLcchkLLLccHCC................',
      '..................CMkkkC....DchccccLLLLLLchRNgggEC..............',
      '.................CEUIIGC......EcccccccccSLQQgggggdCCCC..........',
      '...............DICMgIIIE.......CCCCCCCCCCCgggggggkEEIGEC........',
      '..............EOOMOMIIIGC.................CECggggkIIIECC........',
      '..............EMUUMMIEEGC....................CCCkIIIIIC.........',
      '..............CMIIIMCCCCC.......................CMgIIIC.........',
      '...............CCCCC.............................CIMOIIC........',
      '.................................................CCMUIIC........',
      '..................................................CMPME.........',
      '..................................................CGMMC.........',
      '...................................................CCC..........',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '..................CCC..........CCC..............................',
      '.................CWWWWC.....CCEWWWJ.............................',
      '................CbbbbWQC...CQQbbbbcCCCCC........................',
      '................CccQbbbWCCCWbbbbbbcCbbbbQK......................',
      '................CbkbQQbFcQbcQccbbbcObbkkbbC.....................',
      '...............CQbbcccNbcKQWWNckbbWQbbbbbbbC....................',
      '...............CQbbIIIQIMIQQWbbkbbWKWbbbbQWC....................',
      '...............CMPPPPPMMMMIIcbccbcWKQQbbQWC.....................',
      '..............CMIPMMPPPPPPPPPMIcccWKWbbWQC......................',
      '.............CPPPMPPMPPMMMMPPPPIccJbcccWC.......................',
      '............CPPMMPPPMPMPPPXMPPPPIQQccccWCCCCCCC.................',
      '...........CPaPOaPPPPPMPaaPPMPPPIQWWbccQCOPOPPUEE...............',
      '..........CPPPMPPPPMMPPPPPPPPMPPMOkQQQQNOOMMXMPPPC..............',
      '.........CPPPOPPPPIMMOMMPPPPPMMPIOIkVVYhSYkcVkMIMPC.............',
      '.........CPPPMPPPIggggggIPPPPPPMOOIOPkkOccUPOOIEIIC.............',
      '.........CPPIMPPMggggOOMgUIMPPPMMPIOMMMMOOPOOOOOEC..............',
      '.........COPMCPPIggggMgggggMMIPMMOIOIIOOOOPOOOPOMME.............',
      '.........COM.CMOggggggOMggggMIPMMOIPIIOOOOPOPIIIMOOC............',
      '..........CM.CaCgggggCCCCgggMIIgaOIIIOOPIMIIIOOOIOOC............',
      '...........E..CLCgggCkCCNCggMMgXgMIIIOOIOPPOIIIIIMPPC...........',
      '..............EkCggggICOkgggOMXXgCIIIIIIIIIIIIIIIIMPC...........',
      '..............CkPggggMUPkgggOgXagCMIIIIIICCCIIIICOMPC...........',
      '..............CggggggggjggggOgggCCIMICCCC...CCIIECME............',
      '..............CgggggggggggggOiLLLLCECC.......CCC................',
      '...............CgggaCCCggggPMHHLLLLLC...........................',
      '................CggCgggCgaUXXNikHLLLC...CCCCCC..................',
      '.................CCgggggCOkjYkkkkFLHHC..CXjMUUUD................',
      '..................CggggCCIEEikkkkJLDHC.CUUkkacVVC...............',
      '..................CggggkiiiiikkkZFHHCSCMUUUgkkVcVC..............',
      '...................CgggkdZkkikkkFFDjjDCIgkkjgUUOPC..............',
      '....................CCkddkkkkkkkEIIOIIUUUUIIEECCE...............',
      '......................CddkkkkkkEIUUUUUXFFFCCC...................',
      '.......................CiikkkkECjJFJFFLLLLLLLCCCCC..............',
      '........................CNkkkdCLFFLLLLLLLLLLLLLYLcC.............',
      '........................CCCCCCLLLLLLLLLLLLLLLLLYLhC.............',
      '........................CLLLLLLLLLLLLLLLLLLLLLkLYcC.............',
      '.......................CYLLLLLLLLLLLLLLLLLLLLYSLcC..............',
      '.....................DCScLLLLLLLLLLLLLLLLLLLYYLccECC............',
      '....................CcRLhhLLLLLLLLLLLLLLLLLkLLccEMMCC...........',
      '....................CdcRLkkLLLLLLLLLLLLLLLYLLhREIMIMMC..........',
      '.....................CYhYLLLLLLLLLLLLLLLLLLLhYFQIMIMMMCC........',
      '.....................CLLhhcLLLkLLLLLLLcckLLcLHgkMaaMUIIC........',
      '....................CggNHRcYSLLLkLLLccLLLhhHggggkCEEOMMC........',
      '...................CggggXaFRcccLLLLLLLcchhHggggCC....CC.........',
      '..................CgggggggCCYcccccccccccHHggggC.................',
      '.................CgggggggC..CCEcccccccFCggggCC..................',
      '...........CCC..CgggggggC......ECCCCCC..CCCC....................',
      '..........CMUUCCCkgggggC........................................',
      '..........CMUUMOOIkgggC.........................................',
      '..........CMIUIgaIIkiE..........................................',
      '...........EIIIIIIIIE...........................................',
      '............CMIIIMIC............................................',
      '.............CEIIEC.............................................',
      '..............EEIE..............................................',
      '...............E................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '..................CCC...........................................',
      '.................CWWWWC.......CCCC..............................',
      '................CbcbbWQE.....CWWWWJ.............................',
      '................CccQbbWE...CMWbbbbcCCCCC........................',
      '................CbcQbbbQCCCWbbbbbbcCbbbbQK......................',
      '................CbkbQQbFbQbcQccbbbcObbkkbbC.....................',
      '...............CQbbcccNbcKQWWNckbbWQbbbbbbbC....................',
      '...............CQbbIIIQIMIQQWbbkbbWKWQbbbQQC....................',
      '...............CMPPPPPMMMMIIcbccbcWKQQbbWWCCCCCCC...............',
      '..............CMIPMMPPPPPPPPPMIcccWKWbcWWCPPGPPPPME.............',
      '.............CPPPMPPMPPPPPMPPPPIccJbcccWCCPPPUMMEC..............',
      '............CPPMMPPPMPMPPPXMPPPPIQWccccWCPOOkMMME...............',
      '..........CCPaPOPPPPPPMPaaPPMPPPPIQWWWWQCMOfMMME................',
      '.........CPPPPPPPPMMMPPPPPPPPMMIMOkKKKCEMckJOOOPCCCCC...........',
      '........CPPPMPPPPIMXMOMPPPPPPMMPIOIkdVVfVVgOOOOMMOOOPC..........',
      '........CPPIIPPPEagggggPIPPPPPPMOOIOOkkOUPPOOPOPIMIMMPC.........',
      '........CPOICUXCgggggOOMgIIMPPPMMPIOMMOMOOOOOOIIIIMMEEE.........',
      '........COG.COMggggggMgggggMMIPMMOIOIIOOPOPPPPOPOICC............',
      '.........IC..CXgggggggOMggggMIPMMOIPIIOPPIMIIIIIIC..............',
      '.............CgCgggggCCCCgggMIIgaOIIIOOOPOPPPPIIC...............',
      '..............CQCgggCkCCNCggMMgXgMIIIIIIIIIIIMCC................',
      '..............EkCggggICOkgggOMXXgCIIIIIIIIECCC..................',
      '..............CkPggggMUPkgggOgXagCCCCCCCC..COIEEEC..............',
      '..............CggggggggjggggOgggCHLC......CUUMUUPOC.............',
      '..............CgggggggggggggOiLLLLLdE.....CUkMUUMOC.............',
      '...............CgggagggggggPMjLLHdkiPC...CUUkUUUYOC.............',
      '................CggggaggaaaagEcLLikkkkC..CUUkaXVVcC.............',
      '.................CCgggUUOOecRccLJikkkkkC.MUUgUkVVcC.............',
      '...................CCCCCJUOOfLcYLFkkkkkCCPPUjkjUZC..............',
      '................CCCCHHHCCFUUIbHLLEEiikkkCPjjaUIEC...............',
      '...............CCHHFHFFHCCCIUUUOHHCikkkkCUUUMME.................',
      '...............CkFXPXJJHDkCLFFUUGCkkkkkkCUUUCC..................',
      '...............DjFFFFJJJHhdCCHCCGRdZkkkkCLLLLLLEEEC.............',
      '...............DCiFFJJJJFFddECggaXkZkkkCLLLLLLLLRLcC............',
      '.................CdFJJJJJFHdCaXggggfdkCLLLLLLLLYLRcC............',
      '................CEiFJJJQQFCCCaggggggdCLLLLLLLLLcLccC............',
      '.................EgFFUFFFFDCLCgggggDDLLLLLLLLLYLLcYC............',
      '.................IiFNJHFCCCRLHCgggCLLLLLLLLLLYLLccC.............',
      '...................CHHCC.CLLLLLCCCLLLLLLLLLLkLLccC..............',
      '....................CC..CRLLLLLLLLLLLLLLLLLYLhhcC...............',
      '.......................CHRcLLLLLLLLLLLLLLkLLRhRD................',
      '.......................CLHRkkLLLLLLLLLLccLLchHJ.................',
      '.......................CYcLLLLLkkLLLLccLLhhcHJC.................',
      '........................CcccLLLLkkLLLLLchLHHMMIC................',
      '.........................CLccccLLLLcccccLKgMUPMC................',
      '..........................CLHYcccccchHLLkjCCPUMC................',
      '..........................CggHHHHHHHLgggCC..CCC.................',
      '..........................CgggggMOgggggC.....C..................',
      '..........................CgggggCagggCE.........................',
      '..........................CggggC.CCCC...........................',
      '.........................CgggggE................................',
      '.........................CgggggI................................',
      '.........................CkkkkIE................................',
      '........................COIIIMC.................................',
      '.....................CCCDgIIIIC.................................',
      '....................CMMMOMMMIIC.................................',
      '....................CIPPPMIIIIC.................................',
      '....................CIIIIIMCCCC.................................',
      '.....................CCCCCC.C...................................',
      '................................................................'
    ]
  ];

  function drawFemaleProtagBlink(put, y0 = 20) {
    for (const ox of [25, 34]) {
      for (let dx = 0; dx < 4; dx++) {
        put(ox + dx, y0, '#a25e4e');
        put(ox + dx, y0 + 1, '#ca876f');
        put(ox + dx, y0 + 2, '#27191a');
      }
    }
    put(26, y0 + 3, '#ca876f');
    put(27, y0 + 3, '#ca876f');
  }

  function drawFemaleProtagMouth(put, mouthOpen, y0 = 24, xOff = 0, yOff = 0) {
    if (mouthOpen === 1) {
      for (let bx = 30; bx <= 32; bx++) {
        put(bx + xOff, y0 + 1 + yOff, '#34211f');
      }
    } else if (mouthOpen >= 2) {
      for (let bx = 30; bx <= 32; bx++) {
        put(bx + xOff, y0 + yOff, '#34211f');
        put(bx + xOff, y0 + 1 + yOff, bx === 31 ? '#d4bba9' : '#a25e4e');
      }
    }
  }

  function buildFemaleProtagFallenPose() {
    const [c, x] = mk(64, 64);
    c.hib = true;
    const base = FEMALE_PROTAG_IDLE_ROWS[0];
    for (let sy = 2; sy < 63; sy++) {
      const row = base[sy];
      if (!row) continue;
      for (let sx = 12; sx < 52; sx++) {
        const ch = row[sx];
        if (!ch || ch === '.') continue;
        const col = FEMALE_PROTAG_PIXEL_PALETTE[ch];
        if (!col) continue;
        const dx = 9 + Math.round((sy - 2) * 0.76);
        const dy = 52 + Math.round((sx - 31) * 0.42);
        if (dx >= 0 && dy >= 0 && dx < 64 && dy < 64) {
          x.fillStyle = col;
          x.fillRect(dx, dy, 1, 1);
        }
      }
    }
    return c;
  }

  function buildFemaleProtagonistPortrait(mouthOpen, blink) {
    return buildPortraitFromRows(FEMALE_PROTAG_IDLE_ROWS[0], FEMALE_PROTAG_PIXEL_PALETTE, 17, 6, {
      mouthOpen,
      blink,
      drawBlink: (put) => {
        for (const ox of [8, 17]) {
          for (let dx = 0; dx < 4; dx++) {
            put(ox + dx, 14, '#a25e4e');
            put(ox + dx, 15, '#ca876f');
            put(ox + dx, 16, '#27191a');
          }
        }
        put(9, 17, '#ca876f');
        put(10, 17, '#ca876f');
      },
      drawMouth: (put, m) => drawFemaleProtagMouth(put, m, 24, -17, -6)
    });
  }

  // ============================================================================
  // RAINHA DA "ORDEM" / FADA LIBERTA — SPRITES 64x64 + CORRIDA (`Fada ordem`)
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
    const isInsideDiamondMask = (px, py) => (Math.abs(px - 13.5) + Math.abs(py - 13.5)) <= 13.5;
    const put = (px, py, col) => {
      if (px >= 0 && py >= 0 && px < 28 && py < 28 && col && isInsideDiamondMask(px, py)) {
        x.fillStyle = col;
        x.fillRect(px, py, 1, 1);
      }
    };
    if (pulseStep > 0) {
      let ringCol = pulseStep === 1 ? '#77eef8' : '#f7d75b';
      drawRing({
        set fillStyle(v) { ringCol = v; },
        fillRect(rx, ry) { put(rx, ry, ringCol); }
      }, 14, 14, 8 + pulseStep, ringCol);
    }
    for (let py = 0; py < 28; py++) {
      const sy = py + 10;
      const row = ORDEM_FAIRY_ROWS[sy] || '';
      for (let px = 0; px < 28; px++) {
        if (py >= 19 && (px <= 3 || px >= 24)) continue;
        if (!isInsideDiamondMask(px, py)) continue;
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


  const ORDEM_WALK_PALETTE = {
    "A": '#708ab8', "B": '#52b8e0', "C": '#f1fbfa', "D": '#95ecf6', "E": '#5cd1f0', "F": '#77eef8', "G": '#64e1f5', "H": '#b7a8f1',
    "I": '#84d8f7', "J": '#cbf7f9', "K": '#4ba1e4', "L": '#6c9fd9', "M": '#383b68', "N": '#34294a', "O": '#391d3b', "P": '#150a28',
    "Q": '#4a2c41', "R": '#9fc5f5', "S": '#e2adf6', "T": '#889ce9', "U": '#6782d6', "V": '#86c3ef', "W": '#5b373d', "X": '#b8bdf6',
    "Y": '#b76039', "Z": '#b7e5fa', "a": '#b9d2f9', "b": '#c8723c', "c": '#764a3d', "d": '#310e28', "e": '#261635', "f": '#3473be',
    "g": '#e6e2f6', "h": '#9a94e9', "i": '#f7e7a8', "j": '#a34935', "k": '#b28d6d', "l": '#fae687', "m": '#676abe', "n": '#b095ef',
    "o": '#47132a', "p": '#8082e1', "q": '#6d69d8', "r": '#75262e', "s": '#241c4d', "t": '#5e44c0', "u": '#cdfadd', "v": '#498fdb',
    "w": '#8e3730', "x": '#170714', "y": '#afb3bf', "z": '#eca14f', "0": '#f99475', "1": '#571526', "2": '#3765cf', "3": '#122b7d',
    "4": '#1b2f98', "5": '#2155a8', "6": '#182560', "7": '#1c1d53', "8": '#143f90', "9": '#2942b3', "!": '#726f72', "@": '#69687b',
    "#": '#525282', "$": '#535b72'
  };

  const ORDEM_WALK_ROWS = [
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '.................................................AA.............',
      '................................................BCCB............',
      '...............................................ACDDB............',
      '...............................................CDCDE............',
      '..............................................BCDDF.............',
      '.............GGB.............................ACCHIJK............',
      '............DCCCCL.................MNOOPPPQ..ICRSTJL............',
      '...........UJLVDCCV...............MWWWWOOPPNBCDCSCT.............',
      '...........UJLDCDXCCL............MYWWWWWPPPOMCDCCTT.............',
      '............AZLDDVTHCaA.........MWbbcWWdWWQPefBBCaT.............',
      '.............ZUUTSgHhCCL.......MQWWbbcPccWWOeQMiXCH.............',
      '.............LRZTSSgXhXCL......NOWWWbOcbccWPPWjklBm.............',
      '.............LUhCSSSSCXnCL....MOOQWWWPcbbcPjoeQMCXm.............',
      '..............HpUqCHSHXnHCA...eeOPQWPeWccPjbYPeMFX..............',
      '..............HUBhhHCHXCahCA..PeeeOOPOOWPjbbbrPsFX..............',
      '...............HtpnXXUgCJZLCL.PePOPPPOQPjbbbbrPeeP..............',
      '...............qXtHXXaUuDJZLJ.PPeeeOWQePQbbbooPPep..............',
      '...............mZXtSSuAuDJDDDLPPPeOOePPrjbYjgPPMa...............',
      '................HttTRRIvuDDDKCNPPPPPPPgPwYYYxPeNa...............',
      '................htDnXZDDBZJDFEMPYwPrryxxYYYYrddNU...............',
      '................atthaVDCZBDDFENPYworjjjzYYYYb0dN................',
      '.................ntttaDJJFBGFGNerwwwjbzzbYYzYbdN................',
      '.................aTZTTTFFFEEFEeePPYrwjYYYYYYYwdQN...............',
      '..................athTVFFFeeeeQOOPPP1wYYYYjYjPOWN...............',
      '..................ZTqTVIFFFeQccQOPPPPo1YYYYwPPOcbO..............',
      '...................JT2TVIINWcccOOPPPPPoooooPPPPOWe..............',
      '....................JLvVVvWWbbOOOPPrYY11rrrwPPPPOe..............',
      '.....................CLKKeWWWWOePPwbbbbbjjbb1PPPOe..............',
      '.......................JJeOOPPPPPobbbbDCbbbbCsPNe...............',
      '.........................eOPPePPPobbwfDCCbbCCKPe................',
      '........................BeOOeeNPPobbofKDCFfFCG3s................',
      '.......................ECIeNPPNPPobbO4vKEFfEEv3.................',
      '......................ECIFeNNNNPPobbO44vv5Z5f6F.................',
      '.....................BCLIFFeNNPPPobbo3333bCb7OCE................',
      '....................BCTIIKDCePPPPojb1jbbzCCCb1CE................',
      '...................LCTXXKDJKFIUg.djbbo7ssbgbsOoE................',
      '...................ZCTFUFFFEITa..8obbo9946b694oG................',
      '...................CpqRTIFBIVUg.BGOYb12299324K8G................',
      '...................CthtTRVUVUX.VJB5obbov9292B8GG................',
      '....................XttpqqpUqTJCU5Fobbbo9q24E8LCB...............',
      '....................gthtqpptXDCT8DFGrbbr2TL4EZ3CC...............',
      '....................CXttpttX.663CZaKsY17KVI8KCT6CG..............',
      '..................ACaaHttHH...f5CgR2vZF3KXRB3CC663..............',
      '.................ACDq..XXX....fCCXT3TCD3KXXX3VC6K...............',
      '.................CZTq.........vCXH76CCD33CXX6vIBE...............',
      '.................CCZ...........V67r7CCF67CCC776.................',
      '.................EE............7sorOaZKd1TCT7...................',
      '..............................oowrjYs6oo1OC7....................',
      '.............................owwwwwjjooor1s7....................',
      '...........................oowwwww11o.o111d.....................',
      '...........................owwwwo1....orro......................',
      '...........................owwwo......orro......................',
      '...........................oYY1......o1rro1.....................',
      '............................1Yo......o1rrro.....................',
      '............................oYo........oooo.....................',
      '................................................................',
      '................................................................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '.................................................AA.............',
      '................................................BCCB............',
      '...............................................ACDDB............',
      '...............................................CDCDE............',
      '..............................................BCDDF.............',
      '.............GGB.............................ACCHIJK............',
      '............DCCCCL.................MNOOPPPQ..ICRSTJL............',
      '...........UJLVDCCV...............MWWWWOOPPNBCDCSCT.............',
      '...........AJLDCDXCCL............MYWWWWWPPPOMCDCCTT.............',
      '.............ZLDDVTHCaA.........MWbbcWWdWWQPe5BBCaT.............',
      '.............ZUUTSgHhCCA.......MQWWbbcPccWWOeQMiXCH.............',
      '.............LRZTSSgXhXCA......NOWWWbOcbccWPPWjkiBm.............',
      '.............LUhCSSSSCXnCL....MOOQWWWPcbbcPjoeQMCXm.............',
      '..............HpUqCHSHXnHCA...eeOPQWPeWccPjbYPeMFX..............',
      '..............HUBhhHCHXCahCA..PeeeOOPOOWPjbbbrPsFX..............',
      '...............HtpnXXUgCJZLCL.PePOPPPOQPjbbbbrPeeP..............',
      '...............qXtHXXaUuDJZLJ.PPeeeOWQePQbbbooPPep..............',
      '...............mZXtSSuAuDJDDDLPPPeOOePP1jbYjgPPMa...............',
      '................HttTRRIvuDDDKCNPrPPPPPgPwYYYxPeNa...............',
      '................htDnXZDDBZJDFEMPYwPrryxxYYYYrddNU...............',
      '................atthaVDCZBDDFENPYworjjjzYYYYb0dN................',
      '.................ntttaDJJFBGFGNerwwwjbzzbYYzYbdN................',
      '.................aTZTTTFFFEEFEeePPYrwjYYYYYYYwdQN...............',
      '..................athTVFFFeeeeQOOPPP1wYYYYjYjPOWN...............',
      '..................ZTqTVIFFFeQccQOPPPPo1YYYYwPPOcbO..............',
      '...................JT2TVIINWcccOOPPPPPoooooPPPPOWe..............',
      '....................JLvVVvWWbbOOOPPrYY1rrrrwPPPPOe..............',
      '.....................CLKKeWWWWOePPYbbbbbjjbb1PPPOe..............',
      '.......................JJeOOPPPPPobbbbDCbbbbCsPNe...............',
      '.........................eOPPePPPobbrfDCCbbCCKPe................',
      '........................BeOOeeNPPbbbofKDCFfFCG3s................',
      '.......................BCIeNPPNPobbbo4vKEFfEEv6.................',
      '......................BCIFeNNNNPobbb444vv5Z5f7o.................',
      '.....................BCLIFFeNNPPobbo33333bCb71oF................',
      '....................BCTIIKDCePPPobborYbbzCCCbrro................',
      '...................LCTXXKDJKDIUgobbo7ssssbgbsOrd................',
      '...................ZCTFUFFFEITa.obbo999946b694ro!...............',
      '...................CTqRTIFBIVUg.obbof99299324K31o...............',
      '...................CthtTRVUVUX.LdbboK9Kv9292B3ELQ...............',
      '....................XttpqqpUqL.Lobbjv9KK9q24EZvCC...............',
      '....................gthtqpptXTJCobbw52BB5LL3EZ43CC..............',
      '....................CXttpttX.ZCqOww1f9II3LIvfCg3633.............',
      '..................ACaaHttHH..663gCaL22ZD3vXR3LCC6f..............',
      '.................ACZq..XXX.....4CCX23RCD3KXX3fBC6f..............',
      '.................CZTq..........5CXh76CCD33CXA7v6V...............',
      '.................CCZ............V67O7CCF67CCC6..................',
      '.................EE.............7..oOXZKreLCX6..................',
      '..................................dr1N711N7g7...................',
      '.................................o1wwwjYo..7....................',
      '.................................owwwwwo........................',
      '................................owwwwro.........................',
      '................................owwwo1..........................',
      '................................dYbo11!.........................',
      '.................................1bo1ro.........................',
      '.................................oroooo.........................',
      '................................................................',
      '................................................................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '.................................................AA.............',
      '................................................BCCB............',
      '...............................................ACDDB............',
      '...............................................CDCDB............',
      '..............................................BCDDF.............',
      '.............GGB.............................ACCHIJK............',
      '............DCCCCL.................MNOOPPPQ..VCRSTJL............',
      '...........UJLVDCCV...............MWWWWOOPPNBCDCSCT.............',
      '...........UJLDCDXCCL............MYWWWWWPPPOMCDCCTT.............',
      '............AZLDDVTHCaA.........MWbbcWWdWWQPe5BBCaT.............',
      '.............ZUUTSgHhCCA.......MQWWbbcPccWWOeQMiXCH.............',
      '.............LRZTSSgXhXCA......NOWWWbOcbccWPPWjkiBm.............',
      '.............LUhCSSSSCXnCL....MOOQWWWPcbbcPjoeQMCXm.............',
      '..............HpUqCHSHXnHCA...eeOPQWPeWccPjbYPeMFX..............',
      '..............HUBhhHCHXCahCA..PeeeOOPOOWPjbbbrPsFX..............',
      '...............HtpnXXUgCJZLCL.PePOPPPOQPWbbbbdPeeP..............',
      '...............qXtHXXaUuDJZLJ.PPeeeOWQePjbbbooPPep..............',
      '...............mZXtSSuAuDJDDDLPPPeOOePgPwbYjgPPMa...............',
      '................HttTRRIvuDDDKCNPrPPPPPxPwYYYxPeNa...............',
      '................htDnXZDDBZJDFEMPYwPrryxxYYYYrddNU...............',
      '................atthaVDCZBDDFENPYworjjjzYYYYb0dN................',
      '.................ntttaDJJFBGFGNerwwwjbzzbYYzYbdN................',
      '.................aTZTTTFFFEEFEeePPYrwjYYYYYYYwdQN...............',
      '..................athTVFFFeeeeQOOPPP1wYYYYjYjPOWN...............',
      '..................ZTqTVIFFFeQccQOPPPPo1YYYYwPPOcbO..............',
      '...................JT2TVIINWcccOOPPPPPoooooPPPPOWe..............',
      '....................JLvVVvWWbbOOOPPrYY1rrrrwPPPPOe..............',
      '.....................CLKKeWWWWOeP1Ybbbbbjjbb1PPPOe..............',
      '.......................JJeOOPPPPPbbbbbDCbbbbCsPNe...............',
      '.........................eOPPePPobbbrfDCCbbCCKPe................',
      '........................BeOOeeNPrbbbofKDCFfFCG3s................',
      '.......................BCIeNPPPobbbbo4vKEFfEEv6.................',
      '......................BCIFeNNNPobbbo444vv5Z5f7o.................',
      '.....................BCLIFFeNNPobbbe63333bCb71oE................',
      '....................BCTIIKDCePPobborjYbbzCCCbrro................',
      '...................LCTXXKDJKDIUobbo7sssssbgbsOrr................',
      '...................ZCTFUFFFEITaobbo9999946b694rro...............',
      '...................CTqRTIFBIVUgoYbo2v99299324K5rwo..............',
      '...................CthtTRVUVUX!oYboEv9Kv9292B3GLro..............',
      '....................XttpqqpUqTZobbbMv9KK9q24EKfCZ1..............',
      '....................gthtqpptXDC1bbbo3vGK2TL4EZ3CCC..............',
      '....................CXttpttX.663wroL4RI3KVI3KCX6CK..............',
      '..................ACaaHttHH...f4CCa2vZD3vXRB3CC663..............',
      '.................ACZq..XXX....fCCXL3XCD3KXXX3LC6v...............',
      '.................CZTq..........CXh76CCD33CXX63IBE...............',
      '.................CCZ...........V77o7CCF67CCC6.7.................',
      '.................EE............77oooXZB1oTCX7...................',
      '................................oooos7OwjsC7....................',
      '................................oooo1rjb1.7.....................',
      '................................oooorwbbo.......................',
      '................................oooowbbo........................',
      '...............................ooooojbbo........................',
      '...............................oooo1bbo.........................',
      '..............................ooooowbbo.........................',
      '..............................ooooorwbo.........................',
      '...............................oooo.oYbo........................',
      '.....................................ooo........................',
      '................................................................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '.................................................AA.............',
      '................................................BCCB............',
      '...............................................ACDDB............',
      '...............................................CDCDB............',
      '..............................................BCDDF.............',
      '.............GGB.............................ACCHIJK............',
      '............DCCCCL.................MNOPPPPQ..VCRSTJL............',
      '...........UJLVDCCV...............MWWWOOOPPNBCDCSCT.............',
      '...........AJLDCDXCCL............MYWWWWdWPPOMCDCCTT.............',
      '.............ZLDDVTHCaA.........MWbbccPccWQPe5BBCaT.............',
      '.............ZUUTSgHhCCA.......MQWWbbOcbccWOeQMiXCH.............',
      '.............LRZTSSgXhXCA......NOWWWWPcbbcPjPWjkiBm.............',
      '.............LUhCSSSSCXnCL....MOOQQWPeWccPjboeQMCXm.............',
      '..............HpUqCHSHXnHCA...eeOeOOPOOWPjbbbPeMFX..............',
      '..............HUBhhHCHXCahCA..PeeOPPPOQPdbbbbrPsFX..............',
      '...............HtpnXXUgCJZLCL.PePeeOWQePQbbbooPeeP..............',
      '...............qXtHXXaUuDJZLJ.PPPeOOePP1jbYjgPPPep..............',
      '...............mZXtSSuAuDJDDDLPPPPPPP@gPwYYYxPPMa...............',
      '................HttTRRIvuDDDKCNPYOPrryxxwYYYrdeNa...............',
      '................htDnXZDDBZJDFEMPYwPrwywbYYYYrddNU...............',
      '................atthaVDCZBDDFENPYworjjbzbYYYb0dN................',
      '.................ntttaDJJFBGFGNerwwwjbzzbYYzYbdN................',
      '.................aTZTTTFFFEEFEeePPYrwjYYYYYYYwdQN...............',
      '..................athTVFFFeeeeQOOPPP1wYYYYjYjPOWN...............',
      '..................ZTqTVIFFFeQccQOPPPPo1YYYYwPPOcbO..............',
      '...................JT2TVIINWcccOOPPPPPoooooPPPPOWe..............',
      '....................JLvVVvWWbbOOOPPrYY1rrrrwPPPPOe..............',
      '.....................CLKKeWWWWOeP1YbbbbbjjbbjPPPOe..............',
      '.......................JJeOOPPPPPbbbbbDCbbbbCsPNe...............',
      '.........................eOPPePPobbbrfDCCbbCCKPe................',
      '........................BeOOeeNobbbbofKDCFfFCG3s................',
      '.......................BCIeNPPNbbbbo44vKEFfEEv6.................',
      '......................BCIFeNNNobbbo7444vv5Z5f7ro................',
      '.....................BCLIFFeNNobbbe763333bCb71rwo...............',
      '....................BCTIIKDCePYbboPrwYbbzCCCbrrrr...............',
      '...................LCTXXKDJKDI1bbo56sssssbgbsOrrwo..............',
      '...................ZCTFUFFFEIA1b15v2999946b694Orrjo.............',
      '...................CTqRTIFBIVAob1BK9v99299324K4O111.............',
      '...................CthtTRVUVUobb1L5Bv9Kv9292B3ENrr1.............',
      '....................XttpqqpUUobbboIGffKK9q24E3BGd1W.............',
      '....................gthtqpptaMrb11IE4vGK2TL4ED5Cy@..............',
      '....................CXttpttX.I77gZZv4RI3KVI3BZ3CCV..............',
      '..................ACaaHttHH..M24CgR9vZD3vXRBfCa7A6..............',
      '.................ACZq..XXX....fCCXT3TCD3KXXX3ZC7f...............',
      '.................CZTq..........CXh76CCD33CXX6vJ5E...............',
      '.................CCZ...........V77o7CCF67CCC6.7.................',
      '.................EE............eeoooXCBooTCX7...................',
      '...............................ooooo77err7C7....................',
      '..............................oooooo.owwbO7.....................',
      '..............................ooooo..dwYboQ.....................',
      '..............................oooo...owbbro.....................',
      '.............................oooo.....1bbbo.....................',
      '............................oooo......ojbbo.....................',
      '............................oooo.......obbYo1o..................',
      '.............................oooo......owbbbro..................',
      '.............................oooo.......rjwo....................',
      '........................................1oo.....................',
      '................................................................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '.................................................AA.............',
      '................................................BCCB............',
      '...............................................ACDDB............',
      '...............................................CDCDE............',
      '..............................................BCDDF.............',
      '.............GGB.............................ACCHIJK............',
      '............DCCCCL.................MNOOPPPQ..ICRSTJL............',
      '...........UJLVDCCV...............MWWWWOOPPNBCDCSCT.............',
      '...........UJLDCDXCCL............MYWWWWWPPPOMCDCCTT.............',
      '............AZLDDVTHCaA.........MWbbcWWdWWQPe5BBCaT.............',
      '.............ZUUTSgHhCCA.......MQWWbbcPccWWOeQMiXCH.............',
      '.............LRZTSSgXhXCA......NOWWWbOcbccWPPWjkiBm.............',
      '.............LUhCSSSSCXnCL....MOOQWWWPcbbcPjoeQMCXm.............',
      '..............HpUqCHSHXnHCA...eeOPQWPeWccPjbYPeMFX..............',
      '..............HUBhhHCHXCahCA..PeeeOOPOOWPjbbbrPsFX..............',
      '...............HtpnXXUgCJZLCL.PeeOPPPOQPjbbbbrPeeP..............',
      '...............qXtHXXaUuDJZLJ.PPPeeOWQePQbbbooPPep..............',
      '...............mZXtSSuAuDJDDDLPPPeOOePP1jbYjgPPMa...............',
      '................HttTRRIvuDDDKCNPPPPPPPgPwYYYxPeNa...............',
      '................htDnXZDDBZJDFEMPYwPrryxxYYYYrddNU...............',
      '................atthaVDCZBDDFENPYworjjjzYYYYb0dN................',
      '.................ntttaDJJFBGFGNerwwwjbzzbYYzYbdN................',
      '.................aTZTTTFFFEEFEeePPYrwjYYYYYYYwdQN...............',
      '..................athTVFFFeeeeQOOPPP1wYYYYjYjPOWN...............',
      '..................ZTqTVIFFFeQccQOPPPPo1YYYYwPPOcbO..............',
      '...................JT2TVIINWcccOOPPPPPoooooPPPPOWe..............',
      '....................JLvVVvWWbbOOOPPrYY1rrrrwPPPPOe..............',
      '.....................CLKKeWWWWOeP1YbbbbbjjbbrPPPOe..............',
      '.......................JJeOOPPPPPbbbbbDCbbbbCsPNe...............',
      '.........................eOPPePPobbbrfDCCbbCCKPe................',
      '........................BeOOeeNPbbbbofKDCFfFCG3s................',
      '.......................BCIeNPPNobbbo44vKEFfEEv6.................',
      '......................BCIFeNNNobbbo7444vv5Z5f7ro................',
      '.....................BCLIFFeNNobbbe763333bCb71rwo...............',
      '....................BCTIIKDCedbbboPrwYbbzCCCbrrwo...............',
      '...................LCTXXKDJKDdbbbo3ssssssbgbsOrwwo..............',
      '...................ZCTFUFFFEIobbo#4f999946b694orwwo.............',
      '...................CTqRTIFBIVobbofEv929299324K4Orwr.............',
      '...................CthtTRVUVobb1BFB4vv9v9292K4BE11wd............',
      '....................XttpqqpUobbboI2GBf4K9224KG8BCy1.............',
      '....................gthtqppt.jbroK2FG4vBK2vL4IL6CCA.............',
      '....................CXttpttX.d1yU4DFG4vI3KVI3KCf6CD.............',
      '..................ACaaHttHH...Z66CZaK4RI3vXRB3CC663.............',
      '.................ACZq..XXX....346CgR92ZD3KXXX3VC6f..............',
      '.................CZTq..........8CCXT3TCD33CXX63I6E..............',
      '.................CCZ...........MCXh76CCD67CCC6.7................',
      '.................EE...........ooa67o7CCDsomCCs..................',
      '.............................ooossoodfZvrrsCXs..................',
      '...........................oooooooooWssswbdss...................',
      '...........................oooooo....drwwbo.....................',
      '...........................oooo......drwbbo.....................',
      '...........................ooo........ojbbo.....................',
      '...........................ooo........ojbbo.....................',
      '.......................................obbo.....................',
      '.......................................ojbbo....................',
      '.......................................owbbbo...................',
      '.......................................o111oo...................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '.................................................AA.............',
      '................................................BCCB............',
      '...............................................ACDDB............',
      '...............................................CDCDE............',
      '..............................................BCDDF.............',
      '.............GGB.............................ACCHIJK............',
      '............DCCCCL.................MNOOPPPQ..ICRSTJL............',
      '...........UJLVDCCV...............MWWWWOOPPNBCDCSCT.............',
      '...........AJLDCDXCCL............MYWWWWWPPPOMCDCCTT.............',
      '.............ZLDDVTHCaA.........MWbbcWWdWWQPe5BBCaT.............',
      '.............ZUUTSgHhCCA.......MQWWbbcPccWWOeQMiXCH.............',
      '.............LRZTSSgXhXCA......NOWWWbOcbccWPPWjkiBm.............',
      '.............LUhCSSSSCXnCL....MOOQWWWPcbbcPjoeQMCXm.............',
      '..............HpUqCHSHXnHCA...eeOPQWPeWccPjbYPeMFX..............',
      '..............HUBhhHCHXCahCA..PeeeOOPOOWPjbbbrPsFX..............',
      '...............HtpnXXUgCJZLCL.PeeOPPPOQPjbbbbrPeeP..............',
      '...............qXtHXXaUuDJZLJ.PPPeeOWQePQbbbooPPep..............',
      '...............mZXtSSuAuDJDDDLPPPeOOePP1jbYjgPPMa...............',
      '................HttTRRIvuDDDKCNPPPPPPPgPwYYYxPeNa...............',
      '................htDnXZDDBZJDFEMPYwPrryxxYYYYrddNU...............',
      '................atthaVDCZBDDFENPYworjjjzYYYYb0dN................',
      '.................ntttaDJJFBGFGNerwwwjbzzbYYzYbdN................',
      '.................aTZTTTFFFEEFEeePPYrwjYYYYYYYwdQN...............',
      '..................athTVFFFeeeeQOOPPP1wYYYYjYjPOWN...............',
      '..................ZTqTVIFFFeQccQOPPPPo1YYYYwPPOcbO..............',
      '...................JT2TVIINWcccOOPPPPPoooooPPPPOWe..............',
      '....................JLvVVvWWbbOOOPPrYY1rrrrwPPPPOe..............',
      '.....................CLKKeWWWWOeP1YbbbbbjjbbrPPPOe..............',
      '.......................JJeOOPPPPPbbbbbDCbbbbCsPNe...............',
      '.........................eOPPePPobbbrfDCCbbCCKPe................',
      '........................BeOOeeNPobbbofKDCFfFCG3s................',
      '.......................BCIeNPPNPbbbo44vKEFfEEv6.................',
      '......................BCIFeNNNNobbbo444vv5Z5f7o.................',
      '.....................BCLIFFeNNPobboe63333bCb71ro................',
      '....................BCTIIKDCePPobborwYbbzCCCbrro................',
      '...................LCTXXKDJKDRAobbo7sssssbgbsOrwo...............',
      '...................ZCTFUFFFEITaobbo2999946b694rro...............',
      '...................CTqRTIFBIVUgob1ffv99299324KMwwo..............',
      '...................CthtTRVUVUXObb1vKv9Kv9292B3GMro..............',
      '....................XttpqqpUqpwbb1FBf9KK9q2fE5BCAo..............',
      '....................gthtqpptaR1bb1FG2vGK2TL4EZ3CCV..............',
      '....................CXttpttX.JMwwoDB4RI3vVI3KC26CC..............',
      '..................ACaaHttHH..663CgR92ZD3vXRBvCC663..............',
      '.................ACZq..XXX....f4CXL3TCD3KXXX3VC6f...............',
      '.................CZTq.........fCCX76CCD33CXX63J6E...............',
      '.................CCZ...........Cf7o7CCF67CCC6.7.................',
      '.................EE............v66ooXCGOoXCC6...................',
      '...............................ooooo32Nr1eCX6...................',
      '...............................ooooooNwjo.ss....................',
      '...............................oooo.1wYbo.......................',
      '...............................oo...1Ybbo.......................',
      '...............................oo...1Yb1........................',
      '....................................oYbo........................',
      '....................................oYbo........................',
      '....................................oYbbo.......................',
      '....................................owbbbo......................',
      '....................................oooooo......................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '.................................................AA.............',
      '................................................BCCB............',
      '...............................................ACDDB............',
      '...............................................CDCDE............',
      '..............................................BCDDF.............',
      '.............GGB.............................ACCHIJK............',
      '............DCCCCL.................MNOOPPPQ..ICRSTJL............',
      '...........UJLVDCCV...............MWWWWOOPPNBCDCSCT.............',
      '...........UJLDCDXCCL............MYWWWWWPPPOMCDCCTT.............',
      '............AZLDDVTHCaA.........MWbbcWWdWWQPe5BBCaT.............',
      '.............ZUUTSgHhCCA.......MQWWbbcPccWWOeQMiXCH.............',
      '.............LRZTSSgXhXCA......NOWWWbOcbccWPPWjkiBm.............',
      '.............LUhCSSSSCXnCL....MOOQWWWPcbbcPjoeQMCXm.............',
      '..............HpUqCHSHXnHCA...eeOPQWPeWccPjbYPeMFX..............',
      '..............HUBhhHCHXCahCA..PeeeOOPOOWPjbbbrPsFX..............',
      '...............HtpnXXUgCJZLCL.PeeOPPPOQPjbbbbrPeeP..............',
      '...............qXtHXXaUuDJZLJ.PPPeeOWQePQbbbooPPep..............',
      '...............mZXtSSuAuDJDDDLPPPeOOePP1jbYjgPPMa...............',
      '................HttTRRIvuDDDKCNPrPPPPPgPwYYYxPeNa...............',
      '................htDnXZDDBZJDFEMPYwPrryxxYYYYrddNU...............',
      '................atthaVDCZBDDFENPYworjjjzYYYYb0dN................',
      '.................ntttaDJJFBGFGNerwwwjbzzbYYzYbdN................',
      '.................aTZTTTFFFEEFEeePPYrwjYYYYYYYwdQN...............',
      '..................athTVFFFeeeeQOOPPP1wYYYYjYjPOWN...............',
      '..................ZTqTVIFFFeQccQOPPPPo1YYYYwPPOcbO..............',
      '...................JT2TVIINWcccOOPPPPPoooooPPPPOWe..............',
      '....................JLvVVvWWbbOOOPPrYY1rrrrwPPPPOe..............',
      '.....................CLKKeWWWWOeP1YbbbbbjjbbrPPPOe..............',
      '.......................JJeOOPPPPPbbbbbDCbbbbCsPNe...............',
      '.........................eOPPePPPbbbrfDCCbbCCKPe................',
      '........................BeOOeeNPobbbofKDCFfFCG3s................',
      '.......................BCIeNPPNPobbbo4vKEFfEEv6.................',
      '......................BCIFeNNNNPobbo444vv5Z5f7o.................',
      '.....................BCLIFFeNNPPobbo33333bCb71oE................',
      '....................BCTIIKDCePPPobborYbbzCCCbrro................',
      '...................LCTXXKDJKDIUgobbo7ssssbgbsOro................',
      '...................ZCTFUFFFEITa.obbo999946b694rro...............',
      '...................CTqRTIFBIVUg.LYbov99299324K3wo...............',
      '...................CthtTRVUVUX.LJobov4Kv9292B3G#o...............',
      '....................XttpqqpUqTJCfjbbo2KK9q24E3KCB...............',
      '....................gthtqpptXZCpOYbb1vGK2TL4EZ3CC...............',
      '....................CXttpttX.773CoY16RI3vVI3KCX6CF..............',
      '..................ACaaHttHH...f4CgR2vZD3vXRBvCC663..............',
      '.................ACZq..XXX....fCCXT3TCD3KXXX3VC6v...............',
      '.................CZTq..........CXn76CCD33CXX6fIBE...............',
      '.................CCZ...........V67d7CCD67CCC6.7.................',
      '.................EE............67.ooXZBooTCX7...................',
      '..................................o1s7oooeC7....................',
      '..................................owwwooooO.....................',
      '.................................owwYboo........................',
      '.................................owwbbo.........................',
      '.................................owbbo..........................',
      '.................................owbbo..........................',
      '.................................oYbo...........................',
      '.................................obbo...........................',
      '................................owbbbo..........................',
      '................................o1jbbbo.........................',
      '..................................ooooo.........................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '.................................................AA.............',
      '................................................BCCB............',
      '...............................................ACDDB............',
      '...............................................CDCDE............',
      '..............................................BCDDF.............',
      '.............GGB.............................ACCHIJK............',
      '............DCCCCL.................MNOOPPPQ..ICRSTJL............',
      '...........UJLVDCCV...............MWWWWOOPPNBCDCSCT.............',
      '...........AJLDCDXCCL............MYWWWWWPPPOMCDCCTT.............',
      '.............ZLDDVTHCaA.........MWbbcWWdcWQPe5BBCaT.............',
      '.............ZUUTSgHhCCA.......MQWWbbcPbccWOeQMiXCH.............',
      '.............LRZTSSgXhXCA......NOWWWbOcbbcPPPWjkiBm.............',
      '.............LUhCSSSSCXnCL....MOOQWWWeWccPjjoeQMCXm.............',
      '..............HpUqCHSHXnHCA...eeOPQWPOOWPjbbYPeMFX..............',
      '..............HUBhhHCHXCahCA..PeeeOPPOQPjbbbbrPsFX..............',
      '...............HtpnXXUgCJZLCL.PeeOeOWQePQbbbbrPeeP..............',
      '...............qXtHXXaUuDJZLJ.PPPeOOePP1jbbbooPPep..............',
      '...............mZXtSSuAuDJDDDLPPPPPPPegPwbYjgPPMa...............',
      '................HttTRRIvuDDDKCNPYPPrdy$PwYYYxPeNa...............',
      '................htDnXZDDBZJDFEMPYwPrryxdYYYYrddNU...............',
      '................atthaVDCZBDDFENPYworjjjzYYYYb0dN................',
      '.................ntttaDJJFBGFGNerwwwjbzzbYYzYbdN................',
      '.................aTZTTTFFFEEFEeePPYrwjYYYYYYYwdQN...............',
      '..................athTVFFFeeeeQOOPPP1wYYYYjYjPOWN...............',
      '..................ZTqTVIFFFeQccQOPPPPo1YYYYwPPOcbO..............',
      '...................JT2TVIINWcccOOPPPPPoooooPPPPOWe..............',
      '....................JLvVVvWWbbOOOPPrYY1rrrrwPPPPOe..............',
      '.....................CLKKeWWWWOeP1YbbbbbjjbbrPPPOe..............',
      '.......................JJeOOPPPPPrbbbbDCbbbbCsPNe...............',
      '.........................eOPPePPPobbrfDCCbbCCKPe................',
      '........................BeOOeeNPPobbofKDCFfFCG3s................',
      '.......................BCIeNPPNPPobbo4vKEFfEEv6.................',
      '......................BCIFeNNNNPPobbo44vv5Z5f7o.................',
      '.....................BCLIFFeNNPPPobbo3333bCb71oF................',
      '....................BCTIIKDCePPPPobbojYbzCCCbrro................',
      '...................LCTXXKDJKDIUg.dbbo7sssbgbsOro................',
      '...................ZCTFUFFFEITa..5bbo99946b694w1................',
      '...................CTqRTIFBIVUg.KEYbo29299324K3r................',
      '...................CthtTRVUVUX.VJBobrOvv9292B3IW................',
      '....................XttpqqpUqTJCv9obbYvK9q24E3KCL...............',
      '....................gthtqpptXZCT3JoYbbov2TL4EZ3CC...............',
      '....................CXttpttX.733CJZobo13vVI3KCX6CF..............',
      '..................ACaaHttHH...f4CgR9vZD3vXRB3CC663..............',
      '.................ACZq..XXX....fCCXT3VCD3KXXX3VC6f...............',
      '.................CZTq..........CXh76CCD33CXX6vIBE...............',
      '.................CCZ...........V77r7CCD67CCC6.7.................',
      '.................EE............7errOXZBooTCh7...................',
      '................................dwjY77oooOC7....................',
      '................................owYY1oo1rrN.....................',
      '...............................owwb1ooorr1......................',
      '...............................owbbo.o1r1.......................',
      '..............................owjbo..orro.......................',
      '..............................owbbo...1r1o......................',
      '..............................oYbo.....oro......................',
      '.............................oYbbo......11......................',
      '.............................ojbbo..............................',
      '.............................ooYbbo.............................',
      '...............................oooo.............................',
      '................................................................'
    ]
  ];

  function buildOrdemPortrait(mouthOpen, blink) {
    return buildPortraitFromRows(ORDEM_FAIRY_ROWS, ORDEM_FAIRY_PALETTE, 18, 10, {
      trimBottomCorners: true,
      mouthOpen,
      blink,
      drawBlink: (put) => {
        for (const ox of [8, 16]) {
          for (let dx = 0; dx < 3; dx++) {
            put(ox + dx, 10, '#8e3730');
            put(ox + dx, 11, '#b76039');
            put(ox + dx, 12, '#150a28');
          }
        }
      },
      drawMouth: (put, m) => {
        put(12, 15, '#47132a');
        put(13, 15, '#47132a');
        put(14, 15, '#47132a');
        put(13, 16, '#f99475');
        put(14, 16, '#f99475');
        if (m > 1) {
          put(12, 16, '#75262e');
          put(15, 15, '#47132a');
          put(15, 16, '#75262e');
        }
      }
    });
  }

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
    const isTalk1 = pose === 'talk1';
    const isTalk2 = pose === 'talk2';
    const isSing = pose === 'sing1' || pose === 'sing2';
    const isCeleb = pose === 'celeb0';
    const bobY = (pose === 'idle1' || pose === 'sing1' || pose === 'sil2' || isTalk2)
      ? -1
      : isCeleb
        ? -2
        : 0;
    const wingLift = (pose === 'idle1' || pose === 'sil1' || isTalk1)
      ? 1
      : (pose === 'sing1' || pose === 'celeb0' || pose === 'sil2' || isTalk2)
        ? 2
        : 0;
    const wingPinch = (pose === 'idle1' || pose === 'sing2' || isTalk1) ? 1 : 0;

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

        let dx = sx;
        let dy = sy + bobY;

        if (isWing) {
          const dist = Math.max(0, Math.abs(sx - 31.5) - 10);
          dy -= Math.round((wingLift * dist) / 14);
          if (wingPinch && dist > 6) {
            dx += isLeftWing ? 1 : -1;
          }
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
          if (isEdge) put(dx, dy, SIL_RIM);
          else if (isFlowerOrGem) put(dx, dy, 'vx2'.includes(ch) ? '#f7d75b' : '#77eef8');
          else if (isWing && 'CGJKMPUVq'.includes(ch)) put(dx, dy, SIL_MID);
          else put(dx, dy, SIL_CORE);
        } else {
          const col = ORDEM_FAIRY_PALETTE[ch];
          if (col) put(dx, dy, col);
        }
      }
    }

    if (!isSil) {
      if (isBlink) {
        for (const ox of [26, 34]) {
          for (let i = 0; i < 3; i++) {
            put(ox + i, 20 + bobY, '#8e3730');
            put(ox + i, 21 + bobY, '#b76039');
            put(ox + i, 22 + bobY, '#150a28');
          }
        }
      }

      if (isTalk1 || isTalk2 || isSing || isCeleb) {
        put(30, 25 + bobY, isTalk1 ? '#75262e' : '#47132a');
        put(31, 25 + bobY, '#47132a');
        put(32, 25 + bobY, '#47132a');
        put(33, 25 + bobY, isTalk1 ? '#75262e' : '#47132a');
        put(31, 26 + bobY, '#f99475');
        put(32, 26 + bobY, '#f99475');
        if (isTalk2 || isSing || isCeleb) {
          put(30, 26 + bobY, '#75262e');
          put(33, 26 + bobY, '#75262e');
        }
        if (isSing || isCeleb) {
          put(38, 13 + bobY, '#ffffff');
          put(31, 38 + bobY, '#ffffff');
        }
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
  // GUARDIÃS DOS BIOMAS (ARACI, IRECÊ, JUREMA) — SPRITES E RETRATOS REAIS 64x64
  // ============================================================================
  const ARACI_PALETTE = {
    "A": '#080706', "B": '#514f4e', "C": '#e12c20', "D": '#482215', "E": '#ab2016', "F": '#313132', "G": '#811811', "H": '#2c150d',
    "I": '#000000', "J": '#d87c1d', "K": '#f6a11e', "L": '#060302', "M": '#aa642c', "N": '#894c2a', "O": '#4b311d', "P": '#212121',
    "Q": '#6e3821', "R": '#151413', "S": '#4a6f3b', "T": '#c86543', "U": '#3a5430', "V": '#7ba442', "W": '#78713b', "X": '#273e26',
    "Y": '#d39553', "Z": '#ea9165', "a": '#918984', "b": '#f4f3f2', "c": '#fefefd', "d": '#d2c2bb'
  };

  const ARACI_IDLE_ROW = [
    '................................A...............................',
    '...............................BCA..............................',
    '...............................DECF.............................',
    '..............................ACECD.............................',
    '........................AF....ACGCH.....A.......................',
    '.......................IJKA..ICGGGCL...LJL......................',
    '.......................AKMKA.ICCGCCI.AKJKL......................',
    '.......................IKJKKLLLCGCGLAKKJKL......................',
    '.......................AJKMKKLCEMECLKKMKML......................',
    '.......................FJMJJJLECMCCLKJMKKA......................',
    '........................LKKNKLCCMJCLJMKJL.......................',
    '........................LJKKJMLJMKJOJMKKA.......................',
    '.......................AFLKKMJLJMKKNMKKLFA......................',
    '......................ABPPLJJQPQMJLOMJLPFBA.....................',
    '.....................LFPBPPLRIRLNLARPAPPFPBL....................',
    '.....................LFRAARSNCSJBCSSETUAAPFL....................',
    '....................ASSSTSCSCSJNVQKQSSESCSUMR...................',
    '....................AWQWXCSCSJSSESSYSESCUCUEA...................',
    '....................ANSXUAIILIIPRPLILIIASXNWA...................',
    '....................ARAPARTFPPHFPFLRPPNRRFRAA...................',
    '....................APRFAZHLLTZAPAZTLILTAPPFA...................',
    '...................LFPPRTIaRLAZZPZZRIHaLTRFRFL..................',
    '...................LPARRDbcDIDZZZZZDLDdbHRPHPL..................',
    '...................LRTRPZZcNDQZZTZZQDNdbZARTAL..................',
    '...................LRITRTZZZTZZZZZZZNMZZCLFTLL..................',
    '...................LPRLPLCCCTZZZZZZZCCCCHAPLPL..................',
    '...................LPRRPLCCCCZZZZZZZTCCQLPRRPL..................',
    '...................AFRAFALITZZZZZZZZZTILRPRRFL..................',
    '...................LFRAFLAALLHTZZZZQIILAAFRRFL..................',
    '...................LFRIFRAAIIRLTTTAHILAAAFIRFL..................',
    '..................LPFRLFPLLMNDNTTTTHOTLLPFLRFFA.................',
    '..................AFPRIRRAZZNdBZZZLbDZZLPRIRPFA.................',
    '..................AFPRALLZZZMdQPNRbaOZZZLLARPFA.................',
    '..................AFRRRLZZZHYMbNbNdNMRZZZLARRFA.................',
    '.................LFFPRALQNOQYYNMbNNYYYIMNLARRFFA................',
    '.................AFPRRLMYYONYYYYNYYYYYLYYMIARRFA................',
    '.................AFRPRLZZNONYYYMMMYYYMIMZZIRRRFA................',
    '.................AFRPAZZZZQANMMNYMMMNIHTZZZLRRFA................',
    '.................LFRRLZZZTILDQYZZZYNQLLTZZZLRRFA................',
    '..................AFLZZZTLLITZZZTZZZNILLTZZZAPA.................',
    '..................AFLZZZZLLPOHDHAHHRUUIIZZZZAPA.................',
    '...................LLZZZDILXXXSSSSSXUXILQZZZLI..................',
    '...................AZZZZALUXSXSXUSUSSUULAZZZZA..................',
    '...................AZZZZZLSUUUSXUSXSUSSLZZZZZL..................',
    '...................AZZTZZLSSXSUSUSXSXSSLZZTZZA..................',
    '...................AZZZTLXSSXSXSUSXSXSSXATZZZA..................',
    '....................RZZZIXSUXSXSSSXSXXSUAZZZA...................',
    '.....................ALILSNCSXSUSXSXUCESLILA....................',
    '........................LCEICSCXSXCUCGGCA.......................',
    '........................LILTLCHCUCLEDQTLA.......................',
    '.........................AZTTLTLCLTLDTZA........................',
    '.........................AZZZTT.A.ATZZZL........................',
    '.........................AZZZZT...AZZZZA........................',
    '.........................LNZTZT...ATZZTL........................',
    '........................ASXXAHHA.LDHHUPSA.......................',
    '.......................ASUUXUSSA.LUSXSUUSA......................',
    '.......................ASXSSRXFL.ADXASSXSA......................',
    '.......................ARHSHQNQ...ANNRSHXL......................',
    '........................IDRNNNQ...ANNQPDA.......................',
    '........................ANNNDNQ...ANDNNNA.......................',
    '.......................ANNNNNNQ...ADNNNNNA......................',
    '......................LQQQQQQHH...ADQQQQQQL.....................',
    '......................ILIIIIIIL....LIIIIILL.....................',
    '................................................................'
  ];

  const ARACI_WALK_ROWS = [
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '...........................................R....................',
      '..........................................FCB...................',
      '.........................................FCGF...................',
      '.........................................LCGCAL.................',
      '....................................L....LCCEGLL..L.............',
      '...................................LKLL..LCGGGCL.LKL............',
      '...................................LKJKKLLGCGCCLLKKA............',
      '....................................KJKKKLCGCGCLKKKA............',
      '....................................LKKMKKLCGMCCLKMKL...........',
      '....................................LJKMMKLCCMMCLKMKL...........',
      '..................................LLALKKTMMCCJMCLMJKL...........',
      '.................................LPPPRLKKMKQKKMJLJMKL...........',
      '................................LBPRPFRLKKMQKKMJLMKL............',
      '...............................LFPFPPRRRLKJQLKTFNMKLL...........',
      '...............................LFPPFRRRRRLARRATPRARFLL..........',
      '..............................LNUHRRRRRRRSCCSJQKSCCSFL..........',
      '................LLLLLLLLLLLLLLLMSCUSUUJUCSMEJUTUKUMSESL.........',
      '..............LLFFFFFFFFFBPPFFPRMUCSGTUJQCSKSSCNSKGMMGL.........',
      '............LLPFFFFFFFFBaFFFPRPRXURCTUULLLLZZLBPPLLLLSL.........',
      '...........LFFFRRRRRRRFFFFFFFPPRRRRRAFULZLLLZZLPPLLLLPL.........',
      '..........LFFPRRRRRRRRRRFFFFFFFRRLLRRFLDLLPLLZLFLLDZLPP.........',
      '.........LFFFRRFFFFFFFFFFFFFFRRRLZZLFLZLdLLZZZZPZLLLLAPL........',
      '........LFFPFFFRRRRRFFFFFFFRRRRRLLLFFLZLaDLLZZZZRLLaLLFL........',
      '........LFPRRRRRRRRRRRRRRRRRRFFFFFFLLZZZbQLDZZZZDDDbLLFL........',
      '........LLLLLLRRRRRRRRRRRRRRRRRRRLLZZZZZbQDQZZTZDDQZLPR.........',
      '........L....RLLLRRRRRRRRRRRRLRXLLZZZZCZZZMZZZZZZZZCRPA.........',
      '................LLLLLRRRRRRRRRLLLLLLZZZCCCCZZZZZZTCERP..........',
      '..................LLLLLLLLLLLLLLLLLLLTZZCCZZZZZZCCCA............',
      '...................LLLLLLLLLLLLLLLLTTTTTZZZZZZZZZEL.............',
      '....................LLLLLLLLLLLLLLJZZZTTTTZZZZZLLL..............',
      '.......................LLLLLLLLLDTZZZZZLZLLLLLL.................',
      '..........................LLLLLLNYLZZZZLHbL.LLLL................',
      '..............................LPMNLZZZQLNaLLZZZL................',
      '..............................LTMYLZTQMLZLLZZZZZL...............',
      '.............................ADZQMLNQZZTLLLZZZZZL...............',
      '................LLL.........LQZZZQMLZZZZZZZZZZZZL...............',
      '...............LHQDL......LLXXDZZZDLZZZZZZZZZZZL................',
      '..............LOQNNQL....LSSSUURZZZLZZZZZZZZZLL.................',
      '.............LHNNNNNNLALLSSXSSSSPHHDLYZZZZLLL...................',
      '............LONNNNNNNPLCSSSSSSSXSSSSSSLLLL......................',
      '...........LDQNNNNNNHUXLCSSSXXXSSSSSXSSRL.......................',
      '...........LONNDMQNRSSULDCSSSSSSXXXSSSSUUL......................',
      '...........LQNLLLLSHSQOZRLCWSUXSSSSSSUCCCL......................',
      '...........LLL..LSPUSHZZZZLCCCCSSSCCCCLLLL......................',
      '................LRSSPZZZZZZLLLCCCJLLLLZZZL......................',
      '................APSXNZZZZZZZZLLLLLLMTTZZZZL.....................',
      '.................LLLLZZZZZZZL......LTTZZZZL.....................',
      '.....................RZZZZZR........LTTZZZZL....................',
      '......................RLLLL..........LTZZZZLL...................',
      '.....................................LTTZZPUSRL.................',
      '......................................LZDDSSSSL.................',
      '......................................LHSSUSHLL.................',
      '......................................LSSHDHQL..................',
      '......................................LDDNNNNL..................',
      '.......................................LNNNNNNL.................',
      '.......................................LNNNNNNNLL...............',
      '.......................................LNNNNNNNNNLL.............',
      '.......................................LDDDDQQQQQLL.............',
      '.......................................LLLLLLLLLLLL.............',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '........................................F.......................',
      '.......................................DCU......................',
      '.......................................LCGC.L...................',
      '.......................................LCGEGLL....L.............',
      '..................................L....LCCGGGEL..LKL............',
      '.................................LKLLLLLCCCGCCL.LKKL............',
      '..................................HKJKKKLDEEGECLKKKL............',
      '..................................PJKKJKKTCEGMCCLKMKL...........',
      '...................................LKKKMMKLCCMMCLKMKL...........',
      '..................................LLLLKKMMMCCJMCLMKKL...........',
      '.................................LPPPRLKKMKQKKMKLJMKL...........',
      '................................LBPRPFRLKKMQKKMKLMKL............',
      '...............................LFPFPPRRRLKMQLKMPNMKLL...........',
      '...............................LFPPFRRRRRLLRRLCPRLRFLL..........',
      '..............................LNSHRRRRRRRSCCSKQKSCCSFL..........',
      '..............................LTUCUSUUKXCSTGKUCUKUCSESL.........',
      '.............................LPRMUCSGCUKQCSKSSCUUKDTCGL.........',
      '............................LFPRXURCCUULLLLZZLFRZLLLLSL.........',
      '...........................LFRPRRRRRLFULZLLLZLFRZLLLLPL.........',
      '.........................LLFPPFRRLLRLFLDLLHLLLFZLLDZLPL.........',
      '.......................LLaFFFFFRLZZLPLZLbLLZZZXZZLLLLPL.........',
      '..........L.........LLLFBaFFFFRRLZZZFLZLaDLLZZZZRLLaLPL.........',
      '...........LLLLLLLLLFFFFBFFFFRRRLLLUFZZZbQLDZZZZDDDbLFL.........',
      '...........LFFFFFFFFFFFRRFFFFRRFFRPLRZZZbQDQZZTZDDQZLP..........',
      '............LPPRRRRRRRRFFFFRRRRFRRLZZZCZZZTZZZZZZZZCLR..........',
      '............LRRRRRRRFFFFFFRRRRRRULLLZZZCCCCZZZZZZCCCH...........',
      '.............LRRRRFFFFFFRRRRRRRLLLLLLTZZCCZZZZZZCCCL............',
      '..............LRRRRRRRRRRRRRRRLLZZZZMTTTZZZZZZZZZCL.............',
      '...............LRRRRRRRRRRRRRRLZZZZZTQTTTTZZZZZLLL..............',
      '................LLLRLLRRRRRLLLZZZZZZZMZZZLLLLLL.................',
      '..................LLLRRRRLLLLMMZZZZZZZDZNbL.....................',
      '....................LLLLLLLLZZZQMLLZZZZQQZL.....................',
      '......................LLLLLZZZZZLNMDQQYMdHL.....................',
      '..........................LZZZZHRMMMMMMQNA..LLL.................',
      '..........................LZZZZZLMLLLLYMYHLLALZL................',
      '..........................LTZZZZZLZZZLHMNLRMZLLZL...............',
      '..........................LLZZZZZZZZZZLLLTLNLYZZL...............',
      '.........................LSSULZZZZZZZZLNTTMMLLLZL...............',
      '.........................LSXSURYYZZZZZLLLLLNTLZZL...............',
      '.........................LSUSXSSLYZZZL......LLLL................',
      '.......................LLLSSSSSSSRLLLP..........................',
      '.......................LQQLMSSSCCCCCLL..........................',
      '......................LHNNLECCCALLLLLH..........................',
      '.....................LQQNNNLAARLZZZZLL..........................',
      '.....................LDNNNNNHSULZZZZL...........................',
      '....................LFNNNNNHSUHZZZZZL...........................',
      '....................LQNNNNNDUUDZZZZZL...........................',
      '....................LQNNNLDRSSDZZZZZL...........................',
      '....................LQNNL.LUSSZZZZZA............................',
      '....................LQNL..LXSLLLLLL.............................',
      '....................LLL..RLLLYZZZZ..............................',
      '.........................LSSSDDZZL..............................',
      '.........................LXUSSSHDR..............................',
      '.........................LDHHSSSSL..............................',
      '.........................LNNQHHXUL..............................',
      '.........................LNNNNHLLL..............................',
      '........................LMNNNNNNLLL.............................',
      '........................LNNNNNNNNNNL............................',
      '........................LDDDDQQQQQQL............................',
      '........................LLLLLLLLLLLL............................',
      '................................................................'
    ],
    [
      '................................................................',
      '..........................................H.....................',
      '.........................................PCU....................',
      '........................................FQGQ....................',
      '........................................LCGGCL..................',
      '....................................L....LCCGGL...L.............',
      '...................................LKLL.LDCGGGC..LKL............',
      '...................................LKJKKLLGCGCCLLKKL............',
      '....................................KJKKKLCGCGCLKKKL............',
      '....................................LJKMKKLCGMCCLKMKL...........',
      '....................................LJKKMKLCCMMCLKMKL...........',
      '..................................LLLLKKMMMCCJMCLMKKL...........',
      '.................................LPPPRLKKMKQKKMKLMMKL...........',
      '................................LBPRPFRLKKMQKKMKLMKL............',
      '...............................LFPFPPRRRLKJQLKMPNMKLL...........',
      '...............................LFPPFRRRRRLLRRLCPRLRFLL..........',
      '..............................LNSHRRRRRRRSCCSKQKSCCSFL..........',
      '...........................LLLLTSCUSUUKXCSTGKUCUKUCSESL.........',
      '.......................LLLLPFFPRMUCSDCUJQCSKSSCQUKDTCGL.........',
      '.....................LLBBBFFPRPRXURCCUULLLLZZLFPZLLLLSL.........',
      '..................LLRFFBaFFFFFPRRRRRLFULZLLLZZPRLLLLLPL.........',
      '.................LFFFFFFFFFFFFFRRLLRRFLDLLHLLZRYLLDZLRPL........',
      '................LFFFFRRRFFFFFRRRLZZLFLZLbLLZZZXZZLLLLLPL........',
      '...............LFFFRRRFFFFFRRRRRLLLBFLZLaDLLZZZZRLLaLLPL........',
      '..............LFFPRFFFFFRRRRRRFFFFFLLZZZbQLDZZZZDDDbLLBL........',
      '.............RFFRRFFFFHRLLLLLHRRRRLZZZZZbQDQZZTZDDQTLP..........',
      '............LFFRRRRRRRRLZZZZMNTXZLZZZZCZZZTZZZZZZZZELR..........',
      '............LFRPRRRRRRLZZZZZZQZRZZLLZZZCCCCZZZZZZCCEH...........',
      '...........LFFFFRRRRRRLZZZZZTNZZZZZZLTZZCCZZZZZZCCCL............',
      '...........LFFFRRRRRRLZZZZZZQNZZZZZZQTTTZZZZZZZZZEL.............',
      '...........PFRRRRRRLLLZZZZLLLLLLZZZZDZTTTTZZZZZLLL..............',
      '..........LFRRLLLLLLZZZZZLLLLLLZZZZZZQZZZLLLLLL...LLL...........',
      '..........LLLL.....LZZZZLLLRLLLNQQQZZTNdDZZZZRL..RLZZLL.........',
      '..........L.......LZZZZZLR....LQTTTNQZQZZZZZZZL.LZTLLZNP........',
      '..................LZZZZZZL....LNTTTTTTQDQZLZZNNLFTLZZZZL........',
      '..................LZZZZZZL...LMTDTTTTTNTTQLTNQTLLHTLLLZL........',
      '...................LZZZZL...LQZZTDTTTQTTTTLQHTTTTTTLLLZL........',
      '....................LLLLR..SSHHZZMDDQNDTTL.LTTTTTTTTLLL.........',
      '.........................LDSSSUHQdZZZDLLL..RTTTTTTMLLL..........',
      '.........................LSSSSSSSRLLRL......LTTTTTL.............',
      '.........................LSXSSSXSSSSULL......LLLLL..............',
      '.................LLL...LLASSSSXSSSCCCCH.........................',
      '...........LL.LL.USUAHHDTLETSSSSSCCLLLHL........................',
      '..........LDHNNLLBUHPRTTTTMLCSSCCALZZZZZR.......................',
      '..........LDNNNNDUSDZZZTTTTLGCCCLLZZZZZZZL......................',
      '..........LQNNNNDSSDTTTTTTTTLLLLTTZZZZZZZL......................',
      '..........LDNNNNHSUDTTTTTTTTAL..LLTTTZZZZLLL....................',
      '.........LFDNNNNNXSHTTTTTLLL.....LHLTMZZDXSUL...................',
      '.........LDNNNNDGHSDLLLLLL..........LTTHSSSSL...................',
      '.........LQNNNNLLRSSL...............LLRSSXDLL...................',
      '.........LQNNLL..RLL................LSSHQHNNL...................',
      '.........LQQNL......................LSXQNNNNNLLLLLL.............',
      '..........LDQL.......................LLNNNNNNNNNNQR.............',
      '..........LLL..........................LNNNNNNNQQLL.............',
      '.......................................LDNNNNDDDLL..............',
      '........................................LNMDQHLL................',
      '........................................LHDQLL..................',
      '.........................................LLL....................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '...........................................R....................',
      '..........................................PC....................',
      '.........................................FCGF...................',
      '.........................................LCGCLL.................',
      '....................................L....LCCEGLL..L.............',
      '...................................LKLL..LCGGGCL.LKL............',
      '...................................LKJKKLLGCGCCLLKKL............',
      '....................................KJKKKLCGCGCLKKKL............',
      '....................................LKKMKKLCGMCCLKMKL...........',
      '....................................LJKMMKLCCMMCLKMKL...........',
      '..................................LLLLKKMMMCCJMCLMKKL...........',
      '.................................LPPPRLKKMKQKKMKLKMKL...........',
      '................................LBPRPFRLKKMQKKMKLMKL............',
      '...............................LFPFPPRRRLKJQLKMPNMKLL...........',
      '...............................LFPPFRRRRRLLRRLCPRLRFLL..........',
      '..............................LNUHRRRRRRRSCCSKQKSCCSFL..........',
      '................LLLLLLLLLLLLLLLTSCUSUUKXCSTEKUCUKUCSESL.........',
      '..............LLFFFFFFFFFBPPFFPRMUCSGCUJQCSKSSCSUKDTCGL.........',
      '............LLPFFFFFFFFB.FFFRRPRXURCCUULLLLZZLBPPLLLLSL.........',
      '...........LFFFRRRRRRRFFFFFFFFPRRRRRLFULZLLLZZLPPLLLLPL.........',
      '..........LFFPRRRRRRRRRRFFFFFFFRRLLRRFLDLLHLLZLFLLDZLPP.........',
      '.........LFFFRPFFFFFFFFFFFFFFRRRLZZLFLZLbLLZZZZPZLLLLLPL........',
      '........LFFPFFFRRRRRFFFFFFFRRRRRLLLFFLZLaDLLZZZZRLLaLLFL........',
      '........LFRRRRRRRRRRRRRRLLLLLFFFFFFLLZZZbQLDZZZZDDDbLLFL........',
      '........LLLLLLRRRRRRRRRLZZZZNRRRRLLZZZZZbQDQZZTZDDQTLPR.........',
      '........L....RLLLRRRRRRLZZZZNHHWRLZZZZCZZZTZZZZZZZZERPL.........',
      '................LLLRLRLZZZZZTQZXZZLLZZZCCCCZZZZZZCCERP..........',
      '..................LLLLZZZZZZNNZZZZZZLTZZCCZZZZZZCCCL............',
      '...................LLLZZZZZZQNZZZZZZQTTTZZZZZZZZZEL.............',
      '....................LZZZZZLLLLLLZZZZDZTTTTZZZZZLLL..............',
      '...................LZZZZTLLLLLLZZZZZZQZZZLLLLLL...LLL...........',
      '...................LZZZLL.LLLLLNQQQZZZNdDZZZZLL..LLZZL..........',
      '..................LZZZZZL.....LQTTTNQZQZZZZZZTL.LZMLZZL.........',
      '..................LZZZZZZL....LQTTTTTTQDQZLZZMLLLZLZZZZL........',
      '..................LZZZZZZL...LNZDTTTTTNTTQLTMQTLLNTLLLZL........',
      '...................LZZZTL...LQZZZDTTTQTTTTLQDTTTTTTLLLZ.........',
      '....................LLLL...LSXHZZZDDQNDTTL.LTTTTTTTTLLR.........',
      '...................LQHL...LSSSURZZZZZNLLL..LTTTTTTDLL...........',
      '..................DDNNNHL.LSSSSSHHHDDL......LTTTTT..............',
      '.................HQNNNNNNLLSXSSSSSSURL.......LLLLL..............',
      '...............LRQNNNNNNNRLSXSSSSSXSSXL.........................',
      '..............LDQNNNNNNNUULSSSSXSSSNCCCL........................',
      '..............LQNNQNMQHDSSLESSSSSSCCLLLL........................',
      '..............LQNRLLLLWSUDMLCCSSNCLLZZZL........................',
      '..............LLL..LWHXSSDZZLCCCCLLZZZZL........................',
      '...................LHSSHHZZZTLLLLMTTZZZZL.......................',
      '...................LPSXNMTTTTTTTLLTTZZZZL.......................',
      '....................LLLLLTTTTTTL..LTMZZZZL......................',
      '.........................HLLLLL....LTZZZZLL.....................',
      '...................................LZZZZHXSRL...................',
      '....................................LZDDSSSSL...................',
      '....................................LHSSSSHLL...................',
      '....................................LSSHDHQL....................',
      '....................................LDHNNNNL....................',
      '.....................................LNNNNNNL...................',
      '.....................................LNNNNNNNLL.................',
      '.....................................LNNNNNNNNNLL...............',
      '.....................................LDDDDQQQQQLL...............',
      '.....................................LLLLLLLLLLLL...............',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '........................................O.......................',
      '.......................................DCU......................',
      '.......................................LCGCLL...................',
      '..................................L....LCCCEAL....L.............',
      '.................................LKLLLLLCCGGGCL..LKL............',
      '.................................RKKKKKLLECGCCL.LKKL............',
      '..................................LKJKKKLGEECECLKKKL............',
      '...................................LKKMMKKLCGMCCLKMKL...........',
      '...................................LJKKMMKLCCMMCLKMKL...........',
      '..................................LLLLKKMMMCCJMCLMKKL...........',
      '.................................LPPPRLKKMKQKKMKLKMKL...........',
      '................................LBPRPFRLKKMQKKMKLMKL............',
      '...............................LFPFPPRRRLKJQLKMPNMKLL...........',
      '...............................LFPPFRRRRRLLRRLCPRLRFLL..........',
      '..............................LNSHRRRRRRRSCCSKQKSCCSDL..........',
      '.............................LLTUCUSUUKXCSTGKUCUKUCSESL.........',
      '............................LFPRMUCSDCUJQCSKSSCUUKDTCGL.........',
      '...........................LFFPRXURCCUULLLLZZLFRZLLLLSL.........',
      '..........................LFPPPRRRRRLFULZLLLZLFRZLLLLPL.........',
      '.........................LFPFFPRRLLRLFLDLLHLLLFZLLDZLPL.........',
      '........................LBBFFFFRLZZLFLZLbLLZZMOZZLLLLPL.........',
      '.......................LBBFFFRRRLZZPFLZLaDLLZZZZRLLaLFL.........',
      '......................LFBPFFFRRRLLPFLZZZbQLDZZZZDDDbLFL.........',
      '....................LLFFLLLLLLLFFFRLZZZZbQDQZZTZDDQZLP..........',
      '...................LFFFLZZZZMMMRRRHZZZCZZZTZZZZZZZZELR..........',
      '.................LLFFPLZZZZZZNZRPZLLZZZCCCCZZZZZZCCCH...........',
      '.............LLLLFFFRLZZZZZZJNZZZZZZLTZZCCZZZZZZCCCL............',
      '.........RLLLFFFFRRRPLZZZZZZTNZZZZZZQTTTZZZZZZZZZCL.............',
      '..........RFFFFRRFFFLZZZZZLLLLLLZZZZDZTTTTZZZZZLLL..............',
      '...........LPPPFFRPLZZZZZLRLLLLZZZZZZQZZZLLLLLL.................',
      '............LLLRRRRLZZZHLLLLLLLMQQQZZZZdDTZZZL...LLL............',
      '...............LLLLZZZZZLLLLLLLQTTTNQZQdZZZZZL..LLZZL...........',
      '..................LZZZZZZLLLLLLNTTTTTTQDQZLZNMLLZLLZZL..........',
      '..................LZZZZZZL...LNZDTTTTTNTTNLNQMLLZLZZZL..........',
      '...................LZZZZLL..LQZZZDTTTQTTTTLDTTMLLMLLZL..........',
      '....................LLLLH..LUXHZZZDDQNNTJLLTTTTTTTLZZL..........',
      '...........................USXURZZZZZMLLL.LTTTTTTTTLL...........',
      '..........................LSSSSSHHLZZL.....LTTTTTLLL............',
      '..........................LSXSSXSSXLAL......LLLLL...............',
      '..........................LSXSSSSSSULL..........................',
      '..........................LSUSXSSSSECCL.........................',
      '..........................LSSSSSSCCCLLL.........................',
      '.........................LTLOSSMCALLZZL.........................',
      '........................LTTLECCCLLZZZZZL........................',
      '.......................LTTTMLLLLLNZZZZZL........................',
      '.......................LLLLLLPSXDZZZZZZL........................',
      '.....................LZLDQNNNDSUDZZZZZZL........................',
      '...................LLZZLQNNNNHUUDZZZZZZL........................',
      '...................LXHZLDNNNNDFSOHZZZAL.........................',
      '..................LSSODLQNNNNNHSSDLLL...........................',
      '..................LHSSULQNNNDLLXSSL.............................',
      '.................LNNHUSLQNNNL..LLL..............................',
      '................RNNNQHSLDNNL....................................',
      '...............LQNNNNQHLQQNL....................................',
      '...............LQNNNNNNLLLL.....................................',
      '...............LDQNNNNL.........................................',
      '................LDNNNNL.........................................',
      '.................LDNNNNL........................................',
      '.................LLDNNNML.......................................',
      '..................RRDDDDL.......................................',
      '...................LLLLLL.......................................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '...........................................H....................',
      '..........................................PC....................',
      '.........................................FCGF...................',
      '.........................................LCGCLL.................',
      '....................................L....LCCEGLL..L.............',
      '...................................LKLL..LCGGGCL.LKL............',
      '...................................LKJKKLLGCGCCLLKKL............',
      '....................................KJKKKLCGCGCLKKKL............',
      '....................................LKKMKKLCGMCCLKMKL...........',
      '....................................LJKMMKLCCMMCLKMKL...........',
      '..................................LLLLKKMMMCCJMCLMKKL...........',
      '.................................LPPPRLKKMKQKKMKLKMKL...........',
      '................................LBPRPFRLKKMDKKMKLMKL............',
      '...............................LFPFPPRRRLKMQLKMPNMKLL...........',
      '...............................LFPPFRRRRRLLRRLCPRLRFLL..........',
      '..............................LTUHRRRRRRRSCCSKQKSCCSQL..........',
      '.....................LLLLLLLLLLTSCUSUUKXCSTGKUCUKUCSESL.........',
      '................LLRRFFFFFFPRFFPRMUCSDCUKQCSKSSCSUKDTCGL.........',
      '...............LFFFFFFFB.FFFPRPRXURCCUULLLLZZLBPPLLLLSL.........',
      '.............LLFFRRRRRFFFFFFFFPRRRRRLFULZLLLZZLPPLLLLPL.........',
      '............RFFFRRRRRRRRFFFFFFFRRLLRRFLDLLHLLZLFLLDZLRP.........',
      '............LFFRRBFFFFFFFFFFFRRRLZZLFLZLbLLZZZZPDLLLLLPL........',
      '...........LFFRRBRRRFFFFFFFRRRRFFLLFFLZLaDLLZZZZRLLaLLFL........',
      '...........LFFRFRRRRRRRRRRRRRRFFFFFLLZZZbQLDZZZZDDDbLLFL........',
      '...........PFFFRRRRRRRRRRRRRRRRPLLLZZZZZbQDQZZTZDDQTLPR.........',
      '..........LFFRRRRRRRRRRRRRRRRLRLLLZZZZCZZZTZZZZZZZZERPL.........',
      '..........LFRRLLLLLRRRLLLLLLLRRZZZLLZZZCCCCZZZZZZCCCRP..........',
      '..........LFLaaaa.LLLLLLLLLZMMZZZZZZLTZZCCZZZZZZCCCL............',
      '..........LL.........LLLLZZZZNNZZZZZMTTTZZZZZZZZZCL.............',
      '..........L............LZZZZZTQZZZZZNTTTTTZZZZZLLL..............',
      '..........L............LZZZZZZHLLZZZZQZZZLLLLLL.................',
      '.......................LZZZZLLLTTTZZZZNNDTZL....................',
      '.......................LZZZLaaLNMNQQQNZNZZFL....................',
      '.......................LZZZLaaLTTTTTTTQNQZLaLLL.................',
      '.......................LZZZLLLZZDTTTTTNTTQLZTLZL................',
      '.......................LZZZZZLZZZDTTTQQTTMLHTLLZL...............',
      '.......................LZZZZZZLZZDDQDQNTTLRMLTZZL...............',
      '................LLL....LZZZZZZRRZZZTTTLLLTTTLLLZL...............',
      '...............LHQQLL..LZZZZZLLSPDQZZL.LLLHTTLZZL...............',
      '..............LQQNNNNLLLLZZQLSSSSSRXQL....LLALPR................',
      '..............DDNNNNNHSSLLLAPSSXSSSLSL......LLA.................',
      '.............LDQNNNNDQSDTTLSSXXSSXSALL..........................',
      '............LDDNNNNHRSSHTTLSSSSSSSSSA...........................',
      '............LDNNNNNQSSHTTTTCSSSESQCCCL..........................',
      '............LQNLLLLLSUNTTTTLCCCCCCLLLL..........................',
      '............LLL....LSPLTTTTMLLALLLZZZL..........................',
      '...................LLLRLLTTMTTLZZZZZZZL.........................',
      '.........................LLLLRLZZZZZZZL.........................',
      '...............................LZZZZZZZL........................',
      '................................LZZZZZZZLF......................',
      '.................................LZZZZZZAULL....................',
      '.................................LZZZZZRUSSL....................',
      '..................................LZZDDSSPRL...LLL..............',
      '...................................LDSSSHHNLLLLNQL..............',
      '...................................LSSXHNNNNNNNDHL..............',
      '...................................LSPDNNNNNNNQDLL..............',
      '....................................RLHMNNNNNDDLL...............',
      '......................................RRNNNNDDLL................',
      '.......................................RANNDDLL.................',
      '........................................LLDDL...................',
      '..........................................LL....................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '........................................CS......................',
      '.......................................FEG......................',
      '.......................................LCGCGLL....L.............',
      '..................................L....LCCCGGCL..LKL............',
      '.................................LKLLLLLCEGGCCL.LKKL............',
      '..................................AKKKKLLGCCCCGLKKKL............',
      '..................................PKJKKKLKCECCCLKKMKL...........',
      '...................................LKKKMMKLCGMCCLKMKL...........',
      '..................................LLLLKKMMMCCJMCLMKKL...........',
      '.................................LPPPRLKKMKQKKMKLKMKL...........',
      '................................LBPRPFRLKKMDKKMKLMKL............',
      '...............................LFPFPPRRRLKJQLKMPNMKLL...........',
      '...............................LFPPFRRRRRLLRRLCPRLRFLL..........',
      '..............................LNSHRRRRRRRSCCSKQKSCCSFL..........',
      '..............................LTUCUSUUKXCSTEKUCUKQCSESL.........',
      '.............................LPRMUCSGCUKQCSKSSCUUKDTCGL.........',
      '............................LFPRXURCCUULLLLZZLFRZLLLLSL.........',
      '...........................LFRPRRRRRLFULZLLLZLFRZLLLLPL.........',
      '.........................LLFPPPRRLLRLFLDLLHLLLFRLLDZLPL.........',
      '.......................LLaFFFFFRLZZLPFLLbLLZZZPZZLLLLPL.........',
      '..........L.........LLLFBaFFFFRRLZZZFLZLaDLLZZZZRLLaLFL.........',
      '...........LLPLLLLLLFFFFBFFFFRRRLZLBFLZZbDLDZZZZDDDbLFL.........',
      '...........LFFFFFFFFFFFFRFFFFRRRFLRLLZZZbQDQZZTZDDDZLPL.........',
      '............LPPRRRRRRRRFFFFRRRRFRPRZZZCZZZTZZZZZZZZCLR..........',
      '............LRRRRRRRFFFFFFRRRRRRULLLZZZCCCCZZZZZZCCCH...........',
      '.............LRRRRFFFFFFRRRRRRRLLLLLLTZZCCZZZZZZCCCL............',
      '..............LRRRRRRRRRRRRRRRRLLLLNNTTTZZZZZZZZZCL.............',
      '...............LRRRRRRRRRRRRRRLLLLZZZQTTTTZZZZZLLL..............',
      '................LLLRLLRRRRRRLLLLZZZZZQTZZLLLLLL.................',
      '..................LLLLRRRLLLLLLZZZZZZZDZMNL.....................',
      '....................LLLLLLLLLLLZNZZZLZZQQbL.....................',
      '.......................LLLLLLLLQZQNQHZZQZGL.....................',
      '.............................LLZZZMLQQNDTL......................',
      '............................RLZZZZTLZZLLLL......................',
      '...........................LXLZZZZZHLLZZZLL.....................',
      '..........................LSULZZZZZZZZZZZZL.....................',
      '.........................LLSSULZZZZZZZZZZZL.....................',
      '.........................LSSSSSAAZZZZZZZZZL.....................',
      '........................AXSXSSXSWLLLLZZZZL......................',
      '........................PSSSXXSSSSSSSWLLLL......................',
      '........................RSSSSSSXXSSPSSLL........................',
      '........................HCCSSUSSSUSSSSUUL.......................',
      '........................LLGCMTSSSSSSSCCCL.......................',
      '........................LLALLHCCCCCCCLLL........................',
      '.......................LDLLZZZLLLLLLLZZL........................',
      '.......................LQLLZZZZZLTTTZZZL........................',
      '......................LDNLLZZZZZLTTTTZZL........................',
      '.......................DQLZZZZZLDTTTTZL.........................',
      '......................LLLZZZZZZLLLLLLL..........................',
      '......................LLUZZZZZL.................................',
      '.....................LLSSDDZZZL.................................',
      '.....................LUUSSSDHH..................................',
      '......................LHHPSSSU..................................',
      '......................LNQDHUUL..................................',
      '......................RNNNNHHL..................................',
      '.....................LNNNNNNMLLL................................',
      '.....................LNNNNNNNNNNL...............................',
      '.....................LDDDDQQQQQQL...............................',
      '.....................LLLLLLLLLLLL...............................',
      '................................................................'
    ],
    [
      '................................................................',
      '.........................................P......................',
      '........................................DCU.....................',
      '........................................QGGQL...................',
      '........................................LCGCGL....L.............',
      '...................................L....LCCEGCL..LKL............',
      '..................................LKLLLQLCEGGCL.LKKL............',
      '..................................RKKJKKKACCCCCLKKKL............',
      '...................................LKKKKKKCECMCCLKMKL...........',
      '....................................LTKMKKLCCMMCLKMKL...........',
      '..................................LLLLKKMMMCCJMCLMKKL...........',
      '.................................LPPPRLKKMKQKKMKLTMKL...........',
      '................................LBPRPFRLKKMQKKMKLMKL............',
      '...............................LFPFPPRRRLKJQLKMPNMKLL...........',
      '...............................LFPPFRRRRRLLRRLCPRLRFLL..........',
      '..............................LNUHRRRRRRRSCCSKFKSCCSFL..........',
      '..............................LTUCUSUUKXCSTEKUCUKQCSESL.........',
      '...........................LLLLRMUCSDCUKQCSKSSCUUKDTCGL.........',
      '.......................LLLLPFFPRXURCCUULLLLZZLFRZLLLLSL.........',
      '.....................LLBFBFFPRPRRRRRLFULZLLLZLFRZLLLLPL.........',
      '..................LLRFFB.FFFFFPRRLLRLFLDLLHLLLFLLLDZLPL.........',
      '.................LLFFFFFFFFFFFFRLLZLPFLLbLLZZLFZZLLLLPL.........',
      '................LFFFFRRRFFFFFRRRLZZLFLZLaDLLZZZZRLLaLPL.........',
      '...............LFFFRRRFFFFFRRRRRLHLBFLZZbDLDZZZZDDDbLFL.........',
      '..............LFFFRRFFFFFRRRRRRFFFFLLZZZbQDQZZTZDDDZLP..........',
      '..............RFFRRFFFFRRRRRRRRFRRLLZZZZZZTZZZTZZZZCLR..........',
      '.............LFFRRRRRRRRRRRRRRRRSLZZZZZCCCCZZZZZZCCCH...........',
      '............LFFRFFRRRRRRRRRRRRRLLLLLZZZZCCZZZZZZCCCL............',
      '............RFFFFRRRRRRRRRRLLLLLLLLLLTTTZZZZZZZZZCL.............',
      '...........LFFFFRRRRRRRLLLLLLLLLLLLTTTTTTZZZZZZLLL..............',
      '...........LFFFRRRRRLLLLLLLLLLLLLDTZZZZGLRLLLLL.................',
      '...........PFRRRLLLLLLLLLLLLLLQQQZZLZZZZLbL..LLLL...............',
      '..........LFRLLL....LLLLLLLL.LMLMMNLZZZNLFLaLZZZL...............',
      '..........LLL................LTLTTMLZZMMLPaLZZZZZL..............',
      '.............................LLMMQTLQQZZTLLLZZZZZL..............',
      '.............................LNZZNTLLQZZTZZZZZZZZL..............',
      '............................RQZZZZQMLZZZZZZZZZZZL...............',
      '.........................RLLUXXDZZZLLZZZZZZZZZLL................',
      '.......................LBLSSSSURZZZZDLZZZZZLLL..................',
      '......................LASSSXSSSSHHHHSSSLLLL.....................',
      '......................LCSSSSXXSXSSSSPSSSUL......................',
      '......................LLCSSSSSSSXXXSSSSSCCL.....................',
      '....................ALZZLCSSSUSSSSSSSSCCLLZR....................',
      '...............LLLRHZZZZZLCCCCMSSXCCCCLLZZZZL...................',
      '..............LUSDZZZZZZZZLLLLCCCCLLLLTTZZZZL...................',
      '.........LLLLLHSUDZZZZZZZZddLLLLLL...DTTTZZZLL..................',
      '........LDNNNNHSSDZZZZZZZZDD.........LLTTZZHPSAL................',
      '........LDNNNNDSSDZZZZZZTA.............LZHHSSSSL................',
      '........LQNNNNDSSSHZZLLH...............LRSSSSRLL................',
      '........LQNNNNNDSSXLL..................LSSHDANL.................',
      '........LQNNNNNLLSSL...................LDDNNNNL.................',
      '........LNNNNNL..LL.....................LNNNNNDL................',
      '........LNNNNL..........................LNNNNNNNLL..............',
      '........LDNNL...........................LNNNNNNNNNLL............',
      '.........LDML...........................LDDDDQQQQQL.............',
      '..........LL............................LLLLLLLLLLL.............',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................'
    ]
  ];

  const IRECE_PALETTE = {
    "A": '#050302', "B": '#020505', "C": '#000101', "D": '#060707', "E": '#1e2e46', "F": '#425677', "G": '#142135', "H": '#30405c',
    "I": '#398c72', "J": '#0e3633', "K": '#5cb58d', "L": '#8ad1a6', "M": '#0a1720', "N": '#27a0a6', "O": '#f3e7d7', "P": '#585556',
    "Q": '#064754', "R": '#313230', "S": '#fbfbfb', "T": '#aeafa0', "U": '#195a53', "V": '#dccec1', "W": '#868e90', "X": '#1f110c',
    "Y": '#f4f4f1', "Z": '#d1aa8f', "a": '#4d2314', "b": '#efc591', "c": '#8c7e6d', "d": '#c98f65', "e": '#40d3e0', "f": '#fefefd',
    "g": '#e1e0af', "h": '#33bede', "i": '#b65d42', "j": '#b77044', "k": '#e28c69', "l": '#959d7c', "m": '#85432c', "n": '#d37859',
    "o": '#59797b', "p": '#165376', "q": '#3bb7bf', "r": '#1b91b2', "s": '#1c808b', "t": '#1c6575', "u": '#77a9ab', "v": '#abeae6',
    "w": '#7bc9d6', "x": '#7ddfe0', "y": '#c3e9eb', "z": '#b1bc70'
  };

  const IRECE_IDLE_ROW = [
    '................................................................',
    '................................................................',
    '............................ABACCCAA............................',
    '.........................ADAEFFGGFFHBD..........................',
    '.....................D..DIHFFHEHHGEEFEJD..D.....................',
    '....................BKBAKLMHFFHGEHFFHGKKBBKA....................',
    '....................DKKJLNCHHHHHEEEEECKLJKIB....................',
    '...................AOBDPKQLIHHHHHHHHILQKRDJOD...................',
    '.................PPDSTSPULLBHHHGGHHHDLLJVSWSDRX.................',
    '................AYTAOVYZaIBOOEDObMHYbMIXVOVOATYD................',
    '................CcSObOVSOMKDdSbYeVYdMKDOSVfbOSYA................',
    '.................DVZgbffZUBHHEdehdEHHDIZffbYbOD.................',
    '................DIDVSVYZDCEFHGibjkGHHEMDZOYfVDKD................',
    '...............BKISSfYVYKEHFECkTkkAEHHMKOZVffSIKD...............',
    '...............YCCAAVcCKBHFHAkkSlkkAHFEBLJcODACC................',
    '.................PUIIKBIUHGBPkdeejkPMEHHLBKUIIC.................',
    '.................CKLUOEHGMmnkkkookkknmGGHGOUKKD.................',
    '.................UKUBYEGiBCCXkkkkkkXCCAiGEYBUKD.................',
    '.................CCBnPHGCpGMMkkkkknMGGpCGHMnACC.................',
    '.................BqAkMHAZrGMrkkkkkkhMMrVBHDkAIA.................',
    '................AKsAktHCkerMhkkkkkkeQQeVCHHnANKD................',
    '.................ADYDbHAkSeeekknnkkVeeSkBHbDYWA.................',
    '................DVVCAsEMnkkkkkkkkkkkkkkiGEJQCVVD................',
    '................DYDAubGHAkkkkkknikkkkkkAHEgWBBvD................',
    '................DwBDYZMECAkkkkkkkkkkknACHMZSHBxD................',
    '................CtBVVYBHCMCAkkkkkkkkAAGBHBVOYAMA................',
    '..................PBWYECHCGEBCiXXiADGGCHBEYZtA..................',
    '..................RMMZEEABECCCXjiXCCCGBBEEdMtD..................',
    '..................DEMYEEGGCNnnAdjAinuCGGEGOGFB..................',
    '..................DHGYEEEAkkvnAbjXnvnnAGGGSRFA..................',
    '..................DFHGGGAkkknSXTlDOjkknAGGGHHC..................',
    '..................DHHGECtkiQqNAjjaqqJiktCEGEHC..................',
    '.................DHHHGCQVNBxvqDedAMyxBNuDCGEHHA.................',
    '.................BHHGGDygbDvyyDdankDxDTgvQCGEHD.................',
    '.................MHECtNgItBqqXAmiikkQCtsgNtBEHG.................',
    '................DHHDgtgsqtsAkkkXkkkkkSOwsgtgDHHB................',
    '................AHgSNzQxOOfkknmmmmkkkOSOwtzNSgHB................',
    '...............DHHBVLMyOOSOkkkkmXinkkVVOOvDlTAHHC...............',
    '...............BHGtBCDOOOSOkknaajACCiOVYOysCBQGHB...............',
    '...............CHBsEMBwOvVOnnACjjXstBstOywtDEtBHA...............',
    '...............AHCsEDsqqyttBBsDTeDKtBNsYqqsCEtCHA...............',
    '................GBssBeqNvsNBpsAdjBspBNsyqqxBssBG................',
    '................BpBNBxqqysNEpLDZeBKEpNNYeNxBsBpB................',
    '.................ACGBxqxysUrEqBjeDqGrBNvyqxBQCC.................',
    '...................BvxvywsBwHqDjmBNEwBNqyvxvD...................',
    '...................DvvvyqMqwHNvCCesEhrQNYvvvD...................',
    '...................DvvvvqBhhuGgwwgEpwqBqyvvvD...................',
    '..................DvvvvyBreyuDxggeBpyqrDyyvvvD..................',
    '..................DyvvvNBhwywDvyLhBwywhBNyyxyD..................',
    '.................CqvvvqBphyywBeywhBwyyhpBqvvvLB.................',
    '.................BxuyNACNyyyqBxvehBqyywrCBNyuLC.................',
    '.................CxqsBCpqyyymBeyehCMyyyrpCBJqLB.................',
    '.................BqetYBrqyyxiBexehAiwyyrrBYNNKB.................',
    '..................BesBBeqyyDnAhxhhDnDyyNepBNqB..................',
    '..................XeNBeeqyDnnAhxhrAnnDyqeeBDxC..................',
    '...................DBMexeAcdZnAhhCoZoiANxeeBA...................',
    '...................XMxevBDsNNWBBBDZNqsBBveeqA...................',
    '..................RAxevvBAZdkkDrrAkddZABvvexJA..................',
    '..................DUxvvqBotNVsRCCJNVNscBqvvxxD..................',
    '...................CCvvDAknntOD..DOsknbADvvAC...................',
    '.....................DD.DybORkD..DkRbYuD.DD.....................',
    '.........................DDBBB....MDDDD.........................',
    '................................................................',
    '................................................................'
  ];

  const IRECE_WALK_ROWS = [
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '..................................BBBBBBBBB.....................',
      '.............................B.BBIEHHFGEHHHBB.UB.B..............',
      '............................BKBMLLGFFEEGGEHFFMKKBKB.............',
      '............................BKKGLIBHHHHHHGEEEBILHKB.............',
      '..........................BBSBBEKJLKHHHHHHHHKLGKHBSB............',
      '.........................BBBSTSZJLLBHHHHGGHFBLLHHVSB............',
      '........................BSZBSVOZMIBgScEMbSBHSBKBTVSBVB..........',
      '..............DBBBBBBBBBBSSObSVSOBKBjOSbyeTSntBOSVbOSB..........',
      '..............HHHHHHHHBBBBObObSSbIBHHFEkeekEHHMZSSgZgB..........',
      '...........BDMHHHHHHHFFBKBBOSOSZBBGHHFGkibnBEFHBZSSbBKB.........',
      '..........BHHHHHHHHHFFBIIISSSSZSKGGHHEBkkkkkBEHIVbSSIIKB........',
      '.........DHHBMBBBBGHHEEBBBBBOKRKBEHFEBkknSnkkBHELJOBBBB.........',
      '........BHMBeewwxxBBoSMKKDKLIuBKHHHMMnkneeekknBEHEKKBB..........',
      '.......BHEMxqqwyvvyyMBTOJIKJMSEHHGBnpppkIhkkHHHnBHSBIBSS........',
      '.......BHBNqqveevvyvygBBRBBXVBHHMnBBBBkkkkkkkkknBHBkBRBB........',
      '.......BBBBBteyvvvvvyvBZLKZXBGFHBBsBGGkkkkkkBBBkBEBBZITV........',
      '.......BBHRRHMuvvvvvyyBBgMBknHFEBysGGhkkkkkkBGQBBEDPBIVSZ.......',
      '........BHEBBBuvvvvvvvcSDBXBRHHBkVeMMhkkkkkkhMrTBHEB.BBcZZS.....',
      '........BHB.DHBevvqeqhMgSBHHHBDkkOertekkkkkkhJedBBHB............',
      '........BHBBMBBQvyhehhBLQBBBBBBkkkSeeSkkkknkSeykB.GB............',
      '........BB.BB..ByyNhqheROyxxqXXBkkkkkkkkkkkkkkkB..B.............',
      '...........B...BqyeNqyysZyyvkkkXBkkkkkkkknkkkkBB................',
      '................BeyryyysIyyNkkkkkBkkkkkkkkkkBDB.................',
      '................BtOOOOOOHcSNkkkkknBBBBkkkkBB....................',
      '.................BOOOOOwBNIBBikkkSBijjBBBBB......BBB............',
      '.................BuSSSSbB....BmnknSBiiBSknnB...BXkkkB...........',
      '.................BiOSVyB.....BrrNNhBViBSkkkZDBBBnimkkBB.........',
      '.................BikkkB......BeeyqeBijMeBikNyygBimknkBB.........',
      '.............BBBBXkkkkB.....BBeeyyxBeDxvBcNxOsqMXmmkkBB.........',
      '............BheeeBkkkkkB....XBeehyyBnByyBBwOosySbmakkR..........',
      '............DyeeeXikkinBBBBBiiBBhhBikBvB.BscUyOOOiiaX...........',
      '...........BByyeeeBBBBBsrrGeBankBQBnOBBBBhBBwvVVVSNMX...........',
      '..........BikMyyeeeNNssssDeeeMRBbkBBBM.XhhqNNNyysNND............',
      '..........BniMyyyeesNNsssseeeeDBniinm..BxxqqxyvsNNMX............',
      '...........BBByyyeeeessssheeeeehGBimB...BBwyysssNB..............',
      '..............ByyyeeeeeNeeeeeeesteBVZB....BBBBBDD...............',
      '..............ByyyyeeeeeeeeeeeeerMeBkqB.........................',
      '...............BvyyyyeeeeeeeeeeyvBBJBmXB........................',
      '................BqyyyvyyvvvvyyvyBdBexBBB........................',
      '.................BByvvvvvvvvvvvBkkkBxyyB........................',
      '...................BBvvvvvvvyBBnkkkBrqyxB.......................',
      '.....................BBBBBBX.BjjkkkkBseyJB......................',
      '..............................BkkkkkXBeeeB......................',
      '...............................BkkkkkBXheB......................',
      '...............................BBkkkkkXBr.......................',
      '................................BdkkkkBXB.......................',
      '.................................BkkkkkB........................',
      '..................................BkkkkkB.......................',
      '..................................BkkkkKuBBBBBB.................',
      '...................................BkkNNnOMWdSXB................',
      '....................................BWNnqqyZdBmB................',
      '....................................BtknqNSBBiiDB...............',
      '.....................................BcNbIwBiiiB................',
      '......................................JegcBiii..................',
      '......................................BxBBiiBB..................',
      '.......................................BBnBB....................',
      '........................................BB......................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '..................................BBBBBBBBB.....................',
      '.............................B.BBIEHHFMEHHHBB.UB.B..............',
      '............................BKBMLLMFFEEGGEHFFBLKBKB.............',
      '............................BKKGLtBHHHHHHGGEEBILHKB.............',
      '.............BBBBBBBB.....BBSBBEKMLLHHHHHHHHKLMKHBSB............',
      '..........BBBHHHHHHHHMBB.BBBSZSZMLLBHHHHGGHFBLLEHVSB............',
      '.........BGHHHHHHHHHHHHXBSZBSVVZBIBgSdEMZSBHSBKBVVSBVB..........',
      '........BHEHHHHHHHHHHHHHBSSObSVSOBKBiOSZSeZSnHBOSVZOSB..........',
      '.......XGBBBBBGHHHHHHHHFBBObOZSSZIBHHFMkeekGHHMkSSbZgB..........',
      '.......XPBRHHHHHHHHHHHFBKBBOSOSZBBGHHFMkibkBHFHBZSSbBKB.........',
      '........BHFHGGHHHHHEHFBIIISSSSkSKGGHHEBkkkkkBHHKgbSSIIKB........',
      '.......BGBBBMGGEHHHHHHGBBBBBSKQKBGFFEBkknSukkBHELMSBBBB.........',
      '.......XG..BRGEEEHHHoSBKKBKLIKBKMHFMMkkkeeekkkBHHEIKBB..........',
      '............BBEEEEEEEBkSMIKEBSBHHHBaHHHkIhkkHHFBBHSBIBSS........',
      '..............BBBEEEEEBBUBBGZBHHHHBBBBkkkkkkkkkkBHBkBUBB........',
      '..............BqqBBEEEMZLKZBBGFHGBsBGGkkkkkkBBBkBHBBkIZV........',
      '..............BqqhBBMdZSLBBkiHFEBysGGhkkkkkkBGQBBEB.BIVSZ.......',
      '..............BqyevSSZkdBBMBHFHBkSeGMhkkkkkkeMrkBHHB.BBcZZS.....',
      '..............BevyySvBREEEBHHBBkkOesrhkkkkkkhGekBBHB............',
      '..............BxeyvvyyXXGMBBBGBkkkSeeSkkkkikSeSkB.MB............',
      '..............BvyyyvyuIvBBBBBBBBkkkkkkkkkkkkkkkB..B.............',
      '..............BxyyyyeeNmGyvennkBBkkkkkkkkikkkkBB................',
      '...............XyyeehheRgySykkkkkBkkkkkkkkkkBBB.................',
      '...............ByyhehhqNtSyeTkkkknBBBBkkkkBB....................',
      '................ByvNhhyyssOydkkkkSBiiiBBBBB.....................',
      '................ByyrNvOOSptyBBmiknSBiiBSkB......................',
      '.................BxSryOOOsBU.BNrNNeBgiBSkdB.....................',
      '..................NNOOOOSdB..BeeyqeBiiBeBeOBB..BBB..............',
      '.................BBBvSSSSVB.BBeeyyxBeBxxBSVvBBnkkkB.............',
      '................XvxBqySSVBB.BBeeeyyBkBvyBtUqpBnmmkkB............',
      '...............MvveeBikkkkXBniBBeeBnkBxBcUSSSBmmkkkB............',
      '..............sRveeeMnkkkkkBBmikBpBiSBMGxvggSZmmmkkB............',
      '..............XyveeeNBkkkikBeBEBOkBBBBerssOOgkiiikB.............',
      '..............ByyeeeeMaikkBeeeBBiinkiBvyvyyNNvqBBB..............',
      '..............ByyeeeeeBBBBxeeeeeMBiiXRBBvrrqqBX.................',
      '..............MvyyeeeeeeeeeeeeespeMgVB..BBBB....................',
      '..............ByyyeeeeeeeeeeeeeeNBBXVB..........................',
      '..............ByyyeeeeeeeeeeeeevyBXXiBB.........................',
      '...............ByyyyyeeeeeeeevyyBkkXBXB.........................',
      '...............BvyyyyyeeeevvvyyBakkXXMB.........................',
      '................BxyyyyyyyyvvvSBiikkkBexB........................',
      '.................BByvvvvvvvvvBsXkkkkBvxB........................',
      '...................BBBBBBBBBMNuXkkkkBvxxB.......................',
      '..........................RBpspXkkkkXyxyB.......................',
      '............................BBBkkkkBqBxvB.......................',
      '.............................BkkkkkBBBBB........................',
      '............................BdkkkkBBBBB.........................',
      '...........................BprrrkiB.............................',
      '...........................BnkrrrB..............................',
      '..........................BhhhnniB..............................',
      '..........................BvykhhhBRX............................',
      '..........................BxKNNSyViaB...........................',
      '..........................BddcucbkkOB...........................',
      '...........................BBBBXBXBBB...........................',
      '................................................................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '..................................BBBBBBBBB.....................',
      '.............................B.BBIEHHFMEHHHBB.UB.B..............',
      '............................BKBMLLMFFEEGGEHFFBLKBKB.............',
      '............................BKKGLtBHHHHHHGGEEBILHKB.............',
      '..........................BBSBBEKMLLHHHHHHHHKLMKHBSB............',
      '.........................BBBSZSZMLLBHHHHGGHFBLLEHVSB............',
      '........................BSZBSVVZBKBgScEMZSBHSBKBVVSBVB..........',
      '........................BSSObSVSOBKBiOSZSeZSnHBOSVZOSB..........',
      '........................BBObObSSZIBHHFMkeekGHHMkSSOZgB..........',
      '.......................BKBBOSOSZBBGHHFMkikkBHFHBZSSbBKB.........',
      '.............B........BKIISSSSkSKGGHHEBkkkkkBHHIgbSSIIKB........',
      '.............BM.....XBBBBBBBsKGKBGFFEBkknShkkBHELMSBBBB.........',
      '...........B.BHBB...XSBKKBKLISBKMHFMBkkkeeekkkBHHEKKBB..........',
      '...........BBBHHFBBBFBkSMIKEBSBHHHBmHHHkKkkkHHFBFHSBIBSS........',
      '...........BHBXHHHHHHHBBUBBGgBBHHHBBBBkkkkkkkkkkBHBkBUBB........',
      '...........BHHBHHHHHHFBkLIZBBBBHGBsBGGkkkkkkBBBkBHBBkIV.........',
      '..........BBHHHHHHHHFFBBSBBkkiBHMysGGhkkkkkkBGQBBHB.BIS.........',
      '..........BBEHHHHHHHFFFSoHBBkbBHByeGMhkkkkkkeMhkBHB..Bbb........',
      '..........BHBHHHHHHHHHFdQHEGBBBHByhqphkkkkkkhGekBHB....b........',
      '..........BEGGGHHHHHHHSGGEEEGGHHBnSeeSkkkknkSeSkBG......S.......',
      '...........BGGEEEEHHHHHEEEGGGMBBkkkkkkkkkkkkkkkBB...............',
      '...........BMEEGGGGGHGGGGGGGGBBBBkkkkkkkkkkkkkBB................',
      '............MBGEGGGGGGGGGGGGBBnkkBkkkkkkkkkkBBB.................',
      '..............BBMGGGGGGGGGMBnkkkkkcBBBkkkkBB....................',
      '.................BBBBBBBBBBeVkkkkkSBniBBBBB.....................',
      '........................XXyyvqckkknSBnBSB.......................',
      '.................BBBBBBBxyVOSSvBkNNeBnBqB.......................',
      '.................BexvyyeNXoocUUqNveeBnBqB.......................',
      '.................BexyyywhhqqvMMBevyvBQByB.......................',
      '.................BqyyyyhhhyyyVVMrMMBamBBBBBB....................',
      '.................BewyyyhhhhyOOSOBXZiBaBBmkkkB...................',
      '..................ByyyrqhrrSOOSSkkddBBOBkmmkB...................',
      '..................ByyyyyrNvsOOSZkkkkBMOBimkkB...................',
      '...................XyyyyvvxySxLkkkkkBBVimmnnB...................',
      '....................BByyyvvMMXXBkkkBBhBmmmknB...................',
      '..................BBeeBBBBBeeeNNBBBkBeeBXBmB....................',
      '................BBheeeeeeeeeeeNNBMibBeeeeB......................',
      '...............BxeeeeeeeeeeeeeexBamBeeeeeB......................',
      '...............MveeeeeeeeeeeevyxBBBvvxehheB.....................',
      '..............ByyeeeeeeeeeeevyvBiBBByyyyyvB.....................',
      '..............ByyyyeeeeeeeevyyBjsjjjBMyyyyB.....................',
      '..............ByyyyyeeeevyyyyBsnscjjiiBByyB.....................',
      '...............ByyyyyyyyyyyyBqNncsnjiijnBB......................',
      '................BvyyyvyyyyBBSeBBBBBBBBBB........................',
      '.................BvyvvvBBBMkyB..................................',
      '..................XBBBXXnBnnB...................................',
      '..................BkkkkkB.BB....................................',
      '.................BkkkkkB........................................',
      '................BqukkkkB........................................',
      '...............BnnrrqdB.........................................',
      '..............BehhkkkM..........................................',
      '..............BeehWrqB..........................................',
      '..............BVbdrrhSBM........................................',
      '..............BmmcxSyknnM.......................................',
      '..............BBBXaknknbB.......................................',
      '..................BBBBBBB.......................................',
      '................................................................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '..................................BBBBBBBBB.....................',
      '.............................B.BBIEHHFMEHHHBB.FB.B..............',
      '............................BKBMLLMFFEEGGEHFF.LDBKB.............',
      '............................BKBGLIBHHHHHHGHEFBKLBKB.............',
      '............................BBBEKMLLHHHHHHHHKLULHBB.............',
      '.........................BBBSBBEKLLBHHHHGGHFBLGEHBSB............',
      '........................BMBBSVSZMLBgSFEMZSBFSBLBHVSB............',
      '........................BSSSZSgSSBKBiOSZSeBSSBBSOVSBVB..........',
      '........................BBSbObSSZIBHHFSkeekSHHMkSSgOSB..........',
      '.......................BKBBOSOSZBBGHHFMkeekGHHHBZSVbXK..........',
      '.......................KKBSSSSkSKGGHHEBkkkkBHHHBgbSbBKBB........',
      '......................BBBBBBSKQKBGFHEBkkkkkkBHHQLBSBBKK.........',
      '.....................MJBBBDDIKBKHHMGXkkkeShkkBHEKGKKBBB.........',
      '....................BSBKKBKGMSBEHHMGHkkkIhekkkBEHEKBIBSSS.......',
      '....................BMbXMBBGbBBHHBkkHHHkkkkkHHFBBHBBBQBB........',
      '...................BFFBBUKXBBBHHBkBBBBkkkkkkkkXkBHBXBIB.........',
      '...................HFFBXKKBkXBHHBBsBGGkkkkkkBBBBBHBBBKT.........',
      '..................BFFFBBSBBknBHHBysGGhkkkkkkBMsPBHB..KS.........',
      '.................BHHHHHSoFFBkBHHByeMMhkkkkkkhGhkBEM..Bb.........',
      '................BHHHHHHZoHEEBBMHBkSeeSkkkkkkSeSkMGB...Z.........',
      '...............BHHHHHHHSEEEEGGBEBkkkkkkkkkkkkkkkBG.....S........',
      '............BBBHHHHHHHHHEEGGGGGBkkkkkkkkkkkkkkBBB...............',
      '.........XBEHHHHHHHHHHGGGGGGGGMBBkkkkkkkkkkkBBBB................',
      '...........BBMQEMHHHHHGGGGGGGGBBkBkkkkkkkkBkBBB.................',
      '...........BBBBBHHHHHGGGGGGGBBBXkkkBBBkBBBBB....................',
      '..........BHHHHHHHHHGGGGGGGBsqBkkkBBSiBBBBB.....................',
      '...........BGEEEEEEEGGEEGGGBppBkkkkBBXByBBXB....................',
      '............BHHEEEEEBEEEEEBSSJBkuquMBXBvBkkkX...................',
      '..............BBBBBBEGEEBBBOSBXryyOVBBMBkkkkkB..................',
      '...................BBBBB...BBXpOySIUpyvOkkkkkB..................',
      '...........................BnBBOSLUsyOSSSkkkkX..................',
      '.......................BBMMhnBepVUNyyOOSSkkkBB..................',
      '..................BBBBBXeeeeBhysohhhSOOOObBBB...................',
      '..............BBBBeeeeeeeeeeDvSLehhhhNOOeB......................',
      '............BBXeeeeeeeeeeeeBqvyyqhhhryvNBBB.....................',
      '...........BvvvveeeeeeeeeeeBvvyyyhhNvvBeeeeBB...................',
      '...........BvyyyyyeeeeeeqqhBvvyyyyvvvxxxeexxoB..................',
      '.......BBBBBBMvyyyyyyyyyyyyvBvyyyyyBBBxvyyyvvB..................',
      '......BShcuknnXBByyyvvyBBBBMoBBBBBBqvvvvyBBBBB..................',
      '......BSOdhkkkkndBBBBBBcnknBXpsssssNBBBBminnB...................',
      '.....MBxZkrkkkkkkknnnnkBBBNssssssssssrpBiikkB...................',
      '....BBcrhnrkkkkkkkkkBBBNssNsssssssNBBBBimkkkB...................',
      '....BnOOhiNNkBBBBBB....BBBBBBBBBBBB...BmmkkB....................',
      '....BnnSvBXBB........................BcmkkkB....................',
      '....BnnyD............................BnkkkkB....................',
      '....BnnB............................BcrrruB.....................',
      '....Bkk.............................BiNnucB.....................',
      '.....BB............................BrhuuqrB.....................',
      '...................................BOOZqhqB.....................',
      '...................................BBBZxSSvB....................',
      '...................................BXXiZvkkkM...................',
      '....................................ccBBiikkX...................',
      '........................................BBBBB...................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '..................................BBBBBBBBB.....................',
      '.............................B.BBIEHHFMEHHHBB.UB.B..............',
      '............................BKBMLLMFFEEGGEHFFBLKBKB.............',
      '............................BKKGLIBHHHHHHGHEEBILHKB.............',
      '..........................BBSBBEKMLLHHHHHHHHKLMKHBSB............',
      '.........................BBBSZSZMLLBHHHHGGHFBLLEHVSB............',
      '........................BSZBSVVZBKBgScEMZSBHSBKBVVSBVB..........',
      '...................BBBBBBSSObSVSOBKBiOSZSeZSnHBOSVbOSB..........',
      '.................BBHHFFFBBObObSSZIBHHFMkeekGHHMkSSOZgB..........',
      '...............BBHHHFHFBKBBOSOSZBBGHHFMkibkBHFHBZSSbBKB.........',
      '.............BBHHHHFHFBIIISSSSkSKGGHHEBkkkkkBHHKgbSSIIKB........',
      '............BHHHHHHHHHHBBBBBSKGKBGFFMBkknSkkkBHELMSBBBB.........',
      '...........BHHHHHHHHFSBKKBKLIKBUHHMMBkkkeeekkkBGHEKKBB..........',
      '..........BBHHHHHGGEGBkSMIKEBSEHHBkkHHHkIhkkHHFnBHSBIBSS........',
      '..........BHHHHGGHHEGEBBUBBGZBFHBkBBBBkkkkkkkkknBHBkBUBB........',
      '.........BHHHHGEEEEEEEBZLKZBBHFMBBsBGGkkkkkkBBBkBHBBkIV.........',
      '.........BHHHHHEEHHHEESSLBBkXHHMnSsGGhkkkkkkBGQBBEB.BIS.........',
      '.........BHHHHHHHHHHGSkZBBMBHHEBkSeMMhkkkkkkeMrkBGUB.Bbb........',
      '.........BHHHHEEEEEHGGEEEEGBHHBkkOesshkkkkkkhGekBBHB...b........',
      '.........BMFGGGGEEEEEGGGGGMBHHBkkkSeeSkkkknkSeSkBFB.....S.......',
      '.........BBFEBJBEEEHBBBBBBBBBBBBkkkkkkkkkkkkkkkBBB..............',
      '..........BHEBMHEGBB.....BNsqqyOBkkkkkkkkikkkkBB................',
      '..........BHEBBMMB.......BqssSvOBBkkkkkkkkkkBBB.................',
      '...........BB.BoB........BxvNooBnkBBBBkkkkBBB...................',
      '..............BX.........BBSOOoBnkkkBiBBBBBkkB..................',
      '..........................BvOOBBkkkkBiBB.BkkkkX.................',
      '............BBBBBBBBBBB...BZSXeBkkkqBnBBBBkkkkkB................',
      '............BeveeeeeeeeBB.BinBeBkuyOToBBSSkkkkkB................',
      '.........BBBBMyveeeeeeehhBFBiMeeBhOOTUqSOSSkkkB.................',
      '........BaovvBByyeeeessssssBiBeeByOOUUSOOOSZnB..................',
      '......BBBWkqdhBMyyeeeessssUBiiBheBOPUySOOOOTB...................',
      '.....BBkSqinnWNBXyyeeeeesseeBmkaaJUUhhhOsOeB....................',
      '....BinSShhkNN.BBvyyyeeeeeeeeMBBDvJhhhhhvyD.....................',
      '....BiiONqqkWNkkaBMyvyyeeeeNNNGBeSyvqqqhyeX.....................',
      '.....BXXBBBcukkkkaXBMyyyehqNrrBeyyyyyqqyyMB.....................',
      '...........BMkkkkkknnBBBvyyyBBBevyyyyyyvB.......................',
      '.............BkkkkkkkknkBBBjinBeqvyyyyyBBB......................',
      '..............BkkkkkkkkkknnBXXBBsyyyBBBeeB......................',
      '...............BjkkkkkkkkkB...XXBBBByyyeexBB....................',
      '................BkkkkkkBBB........BiaByyyyyBB...................',
      '.................BBBBBB...........BiijaBBJWLX...................',
      '...................................BiiiiicBBB...................',
      '....................................BiinnnB.....................',
      '.....................................BiikkkB....................',
      '.....................................BiikkkkB...................',
      '......................................BiikkkkB..................',
      '.......................................BiikkndB.................',
      '........................................BiikkNcB..BBBM..........',
      '.........................................BikqqkyBBkOBB..........',
      '.........................................BikNcNqyOnBiB..........',
      '..........................................BrNnNNqLBiiB..........',
      '..........................................BBiNbNNXXiB...........',
      '...........................................B.NykXXiB............',
      '.............................................BeBiiB.............',
      '..............................................BBBB..............',
      '...............................................B................',
      '................................................................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '..................................BBBBBBBBB.....................',
      '.............................B.BBIEHHFMEHHHBB.UB.B..............',
      '............................BKBMLLMFFEEGGEHFFBLKBKB.............',
      '............................BKKGLIBHHHHHHGGEEBILHKB.............',
      '..........................BBSBBEKMLLHHHHHHHHKLMKHBSB............',
      '.............BBBBBBBB....BBBSZSZMLLBHHHHGGHFBLLEHVSB............',
      '..........BBBHHHHHHHHBBBBSZBSVVZBIBgSdEMZSBHSBKBVVSBVB..........',
      '.........BMHHHHHHHHHHHHHBSSObSVSOBKBiOSZSeZSnHBOSVZOSB..........',
      '........BHHHHHHHHHHHHHHFBBObOZSSZIBHHFMkeekGHHMkSSbZgB..........',
      '........BGBBBBMHHHHHHHFBKBBOSOSZBBGHHFMkibkBHFHBZSSbBKB.........',
      '.......B.BMHHHHHHHHFHFBIIISSSSkSKGGHHEBkkkkkBHHKgbSSIIKB........',
      '........MHFGGMHHHHHHHHHBBBBBSKQKBGFFEBkknSWkkBHELMSBBBB.........',
      '.......BBHGGGGGEHHHHoSBKKBKLIKBKMHFMMkkkeeekkkBHHEIKBB..........',
      '.........BBBBGGGEHHEHBkSMIKEBSBHHHBXHHHkIhkkHHFBBHSBIBSS........',
      '........B....BGGEEHEHEBBUBBGZBHHHHBBBBkkkkkkkkkkBHBkBQBB........',
      '..............MGEEEEEEBZLKZBBMFHMBsBGGkkkkkkBBBkBHBBkITb........',
      '...............BEEEEEdkSLBBknHFEBvsGGhkkkkkkBGQBBEB.BIVSZ.......',
      '................BEGGSZddBBMBHFFBkSeMMhkkkkkkeMrkBHHB.BB.ZZS.....',
      '.................BMEEEGGEEBHHBBkkSesshkkkkkkhGekBBHB............',
      '...................BBEEEEEBBBBBkkkSeeSkkkkikSeSkB.EB............',
      '.....................BBBBBBBBMMBkkkkkkkkkkkkkkkB..B.............',
      '.............................BBBBkkkkkkkkikkkkBB................',
      '...........................BXxVMBBkkkkkkkkkkBBB.................',
      '...........................BsNMXkkaBBBkkkkBB....................',
      '...........................wqBBkkkSBniBBBBB.....................',
      '...........................BeBnkkkiSBiBBB.......................',
      '...............MXXBBBB.....BMkkkknBeBiBBB.......................',
      '.............BBxeeeeeeNJX...BpxWNaBeBBBkkB......................',
      '.............ByyeeeeeeeeeBBXqySSOXBBBBnknkB.....................',
      '.............ByyyeeeeehhqsEBXSSFUsWSSkkkkkBB....................',
      '..............ByyyeeeqssssBeQZFFqSOSSSkkkknB....................',
      '...............EyyeeessssBqyQcqhSSOOSSnkkknB....................',
      '...............ByyyeeeNssByyLhqqqSOOOSnnnBB.....................',
      '.............BBBByyyeeeeBMvyyqqqqqsOwJBBB.......................',
      '............BBamLByyyeeeBByyyyqNqqyyMMB.........................',
      '...........BiOSquQByyyyeeByyyyvvvvsGJeeB........................',
      '..........BnkShrhkNBByvyvvByyyvvBBBJeeeeB.......................',
      '..........BnnSqqZkqkkBBBMBBBBBBBBnXeeeeeeB......................',
      '...........XXXBBVZqkkkBBBkBBiiXBBXByveeeeeBB....................',
      '................BukkkkkBkkkknnXttBMByySLWeeBX...................',
      '.................BdkkkkkkkkkkBXssssMBJRyyyyyB...................',
      '..................BkkkkkkkkkkB.BBBBBiiiBBBBBB...................',
      '...................BBkkkkkkkB.....BXiinnB.......................',
      '.....................BkkkkkB......BBikkkB.......................',
      '......................BBBBB......BiikkkkB.......................',
      '.................................XiikkkB........................',
      '................................BsnkkkB.........................',
      '...............................BtrrrdkB.........................',
      '...............................BnknnrB..........................',
      '..............................BhhrnnuB..........................',
      '..............................ByOkhhhBBX........................',
      '..............................BwKNNSyVimB.......................',
      '..............................BccccdbknbB.......................',
      '...............................BBBXXBBBBB.......................',
      '................................................................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '..................................BBBBBBBBB.....................',
      '.............................B.BBIEHHFMEHHHBB.UB.B..............',
      '............................BKBMLLMFFEEGGEHFFBLKBKB.............',
      '............................BKKGLIBHHHHHHGGEEBILHKB.............',
      '..........................BBSBBEKMLLHHHHHHHHKLMKHBSB............',
      '.........................BBBSZSZMLLBHHHHGGHFBLLEHVSB............',
      '........................BSZBSVVZBIBgSdEMZSBHSBKBVVSBVB..........',
      '........................BSSObSVSOBKBiOSZSeZSnHBOSVZOSB..........',
      '........................BBObOZSSZIBHHFMkeekGHHMkSSbZgB..........',
      '.......................BKBBOSOSZBBGHHFMkikkBHFHBZSSbBKB.........',
      '.............BB.......BKIISSSSkSKGGHHEBkkkkkBHHKgbSSIIKB........',
      '.............BMB.....BMBBBBBSKMKBGFFEBkknSWkkBHELMSBBBB.........',
      '...........B.BHBB...BSBKKBKLIKBKMHFMBkkkeeekkPEHHEIKBB..........',
      '...........BBBHHFBBBFBkSMIKEBSBBHHEXHHHkIhkkHHFBFHSBIBSS........',
      '...........BHBXHHHHHHHMBUBBGZBBHHEBBBBkkkkkkkkknBHBkBUBB........',
      '...........BHHHHHHHHHFBkLKZBBBBHEBsBGGkkkkkkBBBkBHBBkIV.........',
      '..........BBHHHHHHHHFFHZSBBknnBHGysGGhkkkkkkBGQBBHB.BIS.........',
      '..........BBMHHHHHHHFFFSoBBBkkBHMyeMMhkkkkkkeMrkBHB..Bbb........',
      '..........BHBHHHHHHHHHFkGHEBBBBHByesthkkkkkkhGekBHB....b........',
      '..........BEGGGHHHHHHHSEGEEEGBHEBnSeeSkkkknkSeSkBHB.....S.......',
      '...........BGGGEEEHHHHHEEEEEGMBBkkkkkkkkkkkkkkkBBB..............',
      '............GEGEEEGGHGGGGGGEGBBBBkkkkkkkkikkkkBB................',
      '.............BGEGEGGGGGEGEMBBdkknBkkkkkkkkkkBBB.................',
      '...............BMGGGGGEEBBBkkkkkkkBBBBkkkkBB....................',
      '.................BBBBBBBvvvekkkkkkSBniBBBBB.....................',
      '...................BBBhVVyyyqnkkkknSBiBSB.......................',
      '..................BvvIeXPOcSSeBikNNeBnXwB.......................',
      '.................ByyyxhhxUUoNBsrryqeBkXeB.......................',
      '.................vyvvhhhexSGBBeeeyyxBhBxBB......................',
      '................ByvvvehhyySVVBhheeySBmBBBBBBBX..................',
      '................BvvvNqesySOSSSBBBwvBimBSSBikkkB.................',
      '................BvvvyqrvsOOSSSkkkMBaBBOSSBkmmkB.................',
      '.................BvyyyySSOOSSkkkkkBBXqVSOXmknkB.................',
      '...............GBUMMyyysrSyOkkkkkmBmirsSbmmannB.................',
      '..............BvxeeeBMBBBBBBkkkkkBBknBsMMimknnB.................',
      '.............ByyeeeeesqqqqheBBkkBqBVSkB..BXBBB..................',
      '.............ByyyeeeeeeeeeeeeBBBBreBmdB....B....................',
      '.............BvvyyyeeeeeeexyyyPnBBeeBBB.........................',
      '..............BByyyyyyyyyyyyXBnnkBBehh..........................',
      '................BBByvvvyBBBBXnkkkkBeeeB.........................',
      '...................BBBBBKcnniikkkkXBxeNB........................',
      '..................XXqvwnNWknnnkkkkBBvvxB........................',
      '...................XerrnuqknnnkkkkkBByvwB.......................',
      '..................BkShhnuNnnnnnnknXsBvyyvB......................',
      '..................BkkSvBBBBBBBXBBBrrrBMyyB......................',
      '..................BnnvB...BiiinnXrssrrNMBB......................',
      '..................BkXX...BiikkkBBBBBBBBXM.......................',
      '...................B....Bnikkkk.................................',
      '.......................BrrnkkkB.................................',
      '......................BniqrrWB..................................',
      '.....................XhhrkkkM...................................',
      '......................MybnhyB...................................',
      '......................BBorhyyBB.................................',
      '.....................BBdnwyydkmB................................',
      '......................MBXBVikkkB................................',
      '..........................BBBBBB................................',
      '................................................................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '..................................BBBBBBBBB.....................',
      '.............................B.BBIEHHFMEHHHBB.UB.B..............',
      '............................BKBMLLMFFEEGGEHFFBLKBKB.............',
      '............................BKKGLIBHHHHHHGGEEBILHKB.............',
      '..........................BBSBBEKMLLHHHHHHHHKLMKHBSB............',
      '.........................BBBSZSZMLLBHHHHGGHFBLLEHVSB............',
      '........................BSZBSVVZBIBgSdEMZSBHSBKBVVSBVB..........',
      '........................BSSObSVSOBKBiOSZSeZSnHBOSVZOSB..........',
      '........................BBObOZSSZIBHHFMkeenSHHMkSSbZgB..........',
      '.......................BKBBOSOSZBBGHHFMkienBHHHBZSSbBKB.........',
      '......................BIIISSSSkSKGGHHEBkkkkBHHHMZbSSIIMB........',
      '......................BBBBBBSKQKBGFHEBkknSkkBHHELMSBBBB.........',
      '.....................MBKKBKLIKBKHHMHBkkkeehkkBMEHEIKBBB.........',
      '....................BSBOKIKEBSBEHHGGpkkkIhkkFFBEFHSBIBSSS.......',
      '....................BMBBMBBGZBBHHBkkHHHkkkkkHHHBBHBkBQBB........',
      '...................BFFBXLIbBBBHHBkBBBBkkkkkkBBBkBHBBbIV.........',
      '...................HFFBBSBBknBHHBBsBGGkkkkkkBBBBBHBXBIT.........',
      '..................BHHHEBSBBkkBHHBytGGhkkkkkkBMtkBHBc.IS.........',
      '...............BBBBBBHHSTHEBkBEEByhMMhkkkkkkhMhkBEM..Bb.........',
      '.............BByyyvvvBBkdEEGBBBHBkSeeSkkkkkkSeSkMEB...Z.........',
      '............RwvvvvyyKISOdBBBBBBEBkkkkkkkkkkkkkkmBG.....S........',
      '...........BNyvvvvyqhNeQvyyNBBBBkkkkkkkkkkkkkkXBB...............',
      '..........BBhevyyeehheQdOSyxkkkBBkkkkkkkkkkkBkBB................',
      '..........BBhvyyyeehhhetZyyrkkkkkBBBBBkkkkBk.BB.................',
      '..........PBNNqvyvNqqyystSSrkkkkknBBBBBBBBBB....................',
      '..........BBBtMNyyeNyyOStWqXBikkkSBiiiBBBB......................',
      '...........BGGBBvySNvOOONBRGBBmkknSBiiBSkkB....BBBB.............',
      '...........BBHEGBssOOOOSOBEMMBeeNNeBniBxBkVBBMBkkkBB............',
      '.............BBBBBMeSSSOVBBBBBeeyqeBiiBeBWhSOBnjmikBB...........',
      '...................BTSSOBM..BBeeyyxBhBxSBxSQNBmmmkkBB...........',
      '....................jkkkkB.BBBeBeeSBnByBLSttSSBmmnkBB...........',
      '...................BnkkkkkBBiiBBeeBiSBvBWWRySSkiXkkB............',
      '...................XkkkkTkBeBmnkPPBXBBBrBByyOOgSimX.............',
      '....................BiTkBBXeeBBBBBBBiMBrNNNrOONSrB..............',
      '.....................BBBeeeeeeeeeeBGddiBrryySNNsXB..............',
      '....................MBheeeeeeeeeeTBBBBBBByysNNrB................',
      '...................XMqeeeeeeeeexytakkkBBRBBBBB..................',
      '................XXXeeeeeeeeeeevOcBkkkkkBB.......................',
      '...............BseeeeeeeeeeeevvcmkkkkkkkB.......................',
      '..............BvweeeeeeeeeeeyyyBBBkkkkkkB.......................',
      '..............ByyyeeeeeeeevvvxXssrXBkkkkB.......................',
      '..............ByyyyyeeeeyyvvRBssrBBkkkkB........................',
      '...........BBBBByvyyyyyyvyvXQrssBdkkkkB.........................',
      '..........BxxqqBByyyyvvyIBBNNrssBhkkkkB.........................',
      '..........BIbbnrsXBBBBBBBqssssGXnrrkkaB.........................',
      '..........BINrnnsniB....BBrrrBGhrkqrqB..........................',
      '..........BtqrrnqBB.......BBBBvvbinkB...........................',
      '..........BbSrhmB............BakrreeB...........................',
      '..........BknSBM..............BdxhyyB...........................',
      '..........BRkjB................BmSyyB...........................',
      '...........BkiB................BPkkkB...........................',
      '............BX..................XXkkB...........................',
      '..................................BB............................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................'
    ]
  ];

  const JUREMA_PALETTE = {
    "A": '#080706', "B": '#050201', "C": '#010000', "D": '#080402', "E": '#bd5b31', "F": '#994c29', "G": '#83371c', "H": '#f8e7d9',
    "I": '#d47b44', "J": '#5f2813', "K": '#dfb899', "L": '#a8724f', "M": '#1c100a', "N": '#efd4b8', "O": '#2f1a13', "P": '#f1a079',
    "Q": '#412820', "R": '#f4953d', "S": '#faf9f9', "T": '#a63a1e', "U": '#eb612c', "V": '#fefefd', "W": '#52352c', "X": '#ca532d',
    "Y": '#f9b772', "Z": '#737326', "a": '#714630', "b": '#85807c', "c": '#bbb5b1', "d": '#302f18', "e": '#c7a07f'
  };

  const JUREMA_IDLE_ROW = [
    '................................................................',
    '..........................ABBCCBA...............................',
    '.......................ABDEEEEEEEBBB............................',
    '.....................AAEEEFFGGGFFEEEB...........................',
    '....................AEEGGGEEEFHEEGGGEDA.........................',
    '..................ADEGGEEEEIHJKLEEEEGEEB........................',
    '..................MEGEEEEEKHJNOHNEEEEGEEA.......................',
    '.................BEGEHEEEEEEHJPKEEEENNGEEA......................',
    '................AEGENOHEEEEEEHNEEEEPHQKGEF.....R....R...........',
    '...............AEGEHJHJHEEEEEEEEEEEHONFEGED.....................',
    '..............DEGFEESGHEEGCBCCCBDFFFHFHEEGEA.....T..............',
    '..............BEGBBFFHFBDCOOOOOOOCBJINEEEGEA.N..TUT...R.........',
    '..............TDAVHCGBCOQWWWMWQQQWQDCGFFEEGEC...URUT............',
    '.............BCSKSKSAOOWWWWQBWWQWWWQOBGGGFGEB..XUYUX............',
    '............AZASHRYSSAWaWWQMEWWQOWWWWOCBCGGEA.TURYYUG...........',
    '............AZMbNKNNMCWWWWBaPBWOMQWWQWASSBBFB.TURYRUG...........',
    '.............BOBSHHSAWWOBBOPPIMQMBOWWcVHNSNA..XUURUUT...........',
    '...............BNSACQWOBIPIEPPIDEIBMWcSRRHSA...TXUXT............',
    '..............AZCBQQWMOBCCIPPPPPFCCBOBdHHNAZA...TXT.............',
    '.............AZdBOBOWDBcOHBPPPPPOcJcCQbSSSAdBR...T...NR.........',
    '.............AA.MBIDQBFVFBFPPPPPGDFSGQQBBdZW....................',
    '................MBPDWJPVIIIPPPPPEEISIQAPDBZM....................',
    '...............CSDFIQDPKEEPPPIPPPXHPIQAIA.AA....................',
    '..............AVHMCBOWDPPPPPPPPPPPPPMQDBM.......................',
    '...............AOASHAWAPPPPPEIEPPPPPDQBOMA......................',
    '................AVNRSMABPPPPPPPPPPIBODQCEFB.....................',
    '................ASYHAWCOBCMPPPPPEBCOMQDLIID.....................',
    '................AASSAQCMBEMCFFFBBFBOMBILELZA....................',
    '...............BWODMQQMBIRICIIIDRRBCCBLKICA.....................',
    '..............AWWOOMOOBTRERRQIDRIDIIILLIBa...A..................',
    '..............AWWQOMMBXTDRIEEERIBIIIaFEBOM.BBaD.................',
    '...............CQOOOBXXXTJGFRRIDIIIWLaIEBMAWWOGA................',
    '..............AWQOOBXXXXXTTGDIGDIIFaaEICAWQOWWQA................',
    '..............AWOMBSXITXXXPHOBAJBILWFBQWOJPJBCC.................',
    '...............BQBXXXHXTXXXBFIIDRWBCaWOFEPIPB...................',
    '................AXGGGXKNTHAIIIFDAOaMOKaLPPPPB...................',
    '...............DTUXBCCTTHTDRIBaaMBWNIEICPPPEB...................',
    '...............AUFOPPPCJEOBMaaCJeHMIJIEBIIEA....................',
    '...............AXDPPPPPAMFFOBFHWMIIQCJOBJJJA....................',
    '...............AGDPPPIPAMBBbNIaMMIIBJBBIIIIA....................',
    '...............ATJBPEPBBBTOCFIaIIIIIDGGBIID.....................',
    '................ACQCCBTDeeeeDFIIIIIGDTGOBA......................',
    '.................BBaBTTDKNeNeBFIIIJBTXGTB.......................',
    '................AXGMTXAeKNeNNeABBCBBGXGTXA......................',
    '...............BXXTGXXBKNNeNNNKeeeNeBUXTXXD.....................',
    '...............AHXTXITBNNNeNNNKNeNNKDIXXXHA.....................',
    '..............AHXHXXXDKNNNNNNNNNKNNNeBUXHXXA....................',
    '..............AXHXXHTDKNNNNNNNNNKNNNeAHNXHEA....................',
    '..............AGXHXXBeNNNNNNNNNNKNNNKDXXHXTA....................',
    '..............ARGXHXDNENNNNNNNNNKNNINDTHXTIA....................',
    '...............AIGXJeKNXNNEKNNNNXNTNXKDXGUD.....................',
    '................AITDEEEHIXNIIINENXHENTBTIA......................',
    '.................DIANNXXXXXEEEEXEXXXXNAXB.......................',
    '..................ABDLKNNNNNXETENNNNeBCM........................',
    '..................M..ADCaLNNNNNNeaCCC..A........................',
    '.....................QFGDADBBBBDCBFGEA..........................',
    '.....................MGGGGGB...AGGJGGA..........................',
    '.....................MJFFFFD...AFFFFJA..........................',
    '...................AEFFJFFFD...AFFFGFFD.........................',
    '..................AFFFFFFFGB...AJFFFFFFD........................',
    '..................AGGGGGJOJD...AGJGGGGGA........................',
    '...................BBCCBCDA.....ACCBCBA.........................',
    '................................................................',
    '................................................................'
  ];

  const JUREMA_WALK_ROWS = [
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '.................................BBBBBBBB.......................',
      '.............................BBBBXEXXXXXEBBBB...................',
      '...........................BBXXEEEEGGGGGEXEEB...................',
      '..........................BXXEEGGGGEXUHJHGGGEBB.................',
      '..................BM.....BXXXGXXEEEENHONNKEEGEEB................',
      '...............BO.MWMM..BXEGGXESXEEEEEQQNNNEEEEB................',
      '...............BQMBWWWBBXEEEEXSQHXEEEEEHNEEEEXHHOB..............',
      '................BWWWWWMBXEGEESJSJHEEEEEEEEEEEHQQHXB.............',
      '................OWWWWWBEGEXXEESJSTTGBBBBBBBGFFQHGEMB............',
      '..............OOBWWWWBXGFEBBEEESTBBBOOOOOOOBTMHJHGXB............',
      '..............BOOOWOBBXBBBSSBTGBBOQQWWWWBWOOBMFHTEXB............',
      '...............BOOBBSBBBSNSYBBGOOWWWWWWWBWWOOBBFFFTB............',
      '...............BOOOScBBBSSRNSSBOOWWWWWWBEBWOOWWMBBTB............',
      '...............BBOOMcBZBcNNKNBWaWWWBQWBIIIBQBWWBSSBB............',
      '................BMMBSSBBBSHHMMWQWWBBBBIIPIIBBOWQeNSSB...........',
      '...............BBBBSHYWQBSSMOWBBQBEIRBPPPEERRBOWBYSSB...........',
      '.............DEXXHBSNBBZZBMBWWMBBBBBIPPPPPRBBBOWBHNBZB..........',
      '............BEETSESBSSBBBBBBWBFIBcMSBPPPPBBBbBMWBSSBZB..........',
      '...........BXEESUXXXBBMOOBBWBIPPPSEBFPPPPRBESBWBBBBZB...........',
      '..........BTTTTIKXXXXBMMMMBWIPPPPSIIEPPPPFIESBQBIB.a............',
      '..........BETXUSXXXXXXJBOMBEPPPPPPSEPPPPIPPEPBBEBB.B............',
      '.........BXEESXXXXXXGTTGBBBBBBPPPPPPPPPPPPPPBEEEB.BaB...........',
      '.........BXTSXSXEXXXXXTGBTXXXXBPLPPPPPXIEPPBIaIBBBWOFB..........',
      '........BXXGUIXXXXXXXXGBXXXXXXXBBIPPPPPPPPBIWEIIBaQaOB..........',
      '.........BBUXSXEXXXXXXGXXXXXXXXXJBBGPPPPBBIIaaIOMaPBB...........',
      '..........BBHXXXXXXXXXXXXXGXXXESIBRBBBBBPPBIaFBWEREB............',
      '............BbBXXXXXXXXXXXGFXXIISNBBBBBPPPPBBFWBIPPB............',
      '.............BBBBBXXXXXXXTTBSTHSTGTBGIBPPPPBOBEFBPB.............',
      '............BJJMBeBBBBBBBBBBBHXXXXXXGEBPPPPBaHIIBB..............',
      '..........BOJFFJBeTeeeeeeBTMBOXXXXXXXXBPPPRBJIGIB...............',
      '.........BGGFFFGBIIKeeeeKKBXQBXXXXXEEUBIIIBIIGBB................',
      '........BGGFFFGGBHNNNNNNNKNBJTBXXXXXFIBBBJBIIBB.................',
      '........BGEEGGJBMNXNNNNNNeKeMMMMBXXEGIBPRaIIIIB.................',
      '........BGGGBGMPBNXNINNNNNNKNNKKKBBBBBBJRIIIIFB.................',
      '.........BBB.BRRBNXXNNNNNNNNNNNNNNNNNKBBGIIIJB..................',
      '.............BRIFBNXNNNNNNNNNNNNNNNENNBQBBBBB...................',
      '..............BEIBNPXENNNNNNNNNNNNXNNKIB........................',
      '...............BBBBNKXXHIINNNNNXNXHHXXHNB.......................',
      '..................BBNNNXXXIIIIIXXUXXNNBBM.......................',
      '....................BBNNNNXXXXNNNNNNKBIBB.......................',
      '......................BBBNNNNNNLBBBBMIRFM.......................',
      '.........................BBBBBBB...BIPPPB.......................',
      '...................................BIKPFEM.BBBB.................',
      '....................................BYBGGGBFFGGBM...............',
      '...................................BOOGFFJEFGJBBM...............',
      '....................................BFFFFFFGJBMMM...............',
      '....................................BGFFFFGMBMMB................',
      '.....................................BFFFBQMOM..................',
      '......................................BGJBBBB...................',
      '........................................BB......................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '.................................MBBBBBBB.......................',
      '.............................BBBBXXXXXXXXBBBB...................',
      '...........................BBXXXXXXGGGGGXXXXB...................',
      '..........................BXXXXGGGGXXXHJHGGGXBB.................',
      '.........................BXXXGXXXEEEHHONNKEEGXXB................',
      '........................BXXGGXESXEEEEXQQNNNEXXXB................',
      '.......................BXXXXEESQSXXEEXXHHEEEEEHHMB..............',
      '.......................BXXGEESQSJSXXXXXXXXEEEHQQHXB.............',
      '......................BXGXXXXXSJSTTTBBBBBBBTTFOHGXMB............',
      '.....................BUGGXBBXXXSTBBBOOOOOOOBFMHGHGUB............',
      '....................BBXBBBSSBTTBBOQOWWWWBWOOBMTHTXXB............',
      '...................BSBBBSNSYBBGOOQWWWWWWBWWOOBBFTTTB............',
      '..................BScBBBHSRKSSBOOWWWWWWWBWWOOWWBBBFB............',
      '................MBMMcBZBcNNKHBWWWWWWWWWBIBWOWWWBSSBB............',
      '...............MOMOBSSBBBSHHMMWWWWWWWWBIIIMWBWWWKKSSB...........',
      '...............BOQBSNYWQBSSMMWWWBQWMJBWIPEEWBQWQBYSSB...........',
      '................MOBSNBBZZBMBBWWQBMMBBJPPPPIBBMWaBSNBZB..........',
      '................MOMBSSBBBBBRJMWBRcBSBPPPPBBBbBQBBSSBZB..........',
      '................BBMOBBOOOBBIBMQBPSEBEPPPPPBESBWBBBBZB...........',
      '..................BMMMBMMMBJEPBPPSIEEPPPPFIESBB..B.a............',
      '...................BBBBBBMBFKPPPPPSEPPPPIPPERB...B..............',
      '.........................BBBBBPPPPPPPPPPPPPPB......B............',
      '........................BJXXXXBPEPPPPPEREPPBBWBB..BaB...........',
      '.........MB...........BBUXXXXXXBBIPPPPPPPPBRPQPB.BQQFB..........',
      '.........BTBB.......MBXXXXXXXXXUTBBFPPPPBBIRIRXMBaMaOB..........',
      '.........BXXXBBBBBBBXXXXXXGXXXXSEBRBBBBBPPBEWFUDMFPBB...........',
      '.........BXXXXEHXXXXXXXXXXXTXXUUSHBBBBBPPPPBGFBWEIEB............',
      '.........BXXTTSXXXXXXXXXXXXBSTSSTTTBGXBPPPPBBFWBIPPB............',
      '.........BXXGTXSXXXXXXXXXXXTBSXXXXXXGXBPPPPBJBIFBPB.............',
      '.........BXXXTSXXXXXXXXXXXXXBQXXXXXXXXBPPPRBGSIIBB..............',
      '..........BXXSXSXXXXXXXXXXXTJBXXXXXXXUBIIRBRJEGIB...............',
      '...........BXXXUXXXXXXXXXUMBGXBXXXXXFUBBBGBIIGBB................',
      '............BXXSXXXXXXXTBBeeDMDBBXXXGXBRIGBIIBB.................',
      '.............BBEXXXXXXBBNNNNNNeeKBBBBBOIRJIIIRB.................',
      '...............bBBBBBBNNNNNNNNNNNNNENGBMIIIIIFB.................',
      '................BNTPNNNNNNNNNNNNNNNNRPNBJIIIJB..................',
      '................BNPXHNNNNNNNNNNNNNHHUXBBBBBBB...................',
      '.................BNKXENNNNNNNNNNXUXXHHB.........................',
      '..................BNNXXHUUNIKUIUUXNNBMB.........................',
      '...................BNNNXXXXXXXXINNMBRIB.........................',
      '....................BBNNNNNNNNNNMBRRRB..........................',
      '......................BBBBBBBBBBBBBBB...........................',
      '.....................BIEEIIBTFFJB...............................',
      '.....................BPKPPRBOFEGB...............................',
      '....................BaBKKKBWBFFB................................',
      '...................BEFBBBBBbBBB.................................',
      '...................BFFGFFFB.....................................',
      '...................BFFFFJGBBBM..................................',
      '...................BFFFFFETFEFB.................................',
      '...................BGGFFFEEEETB.................................',
      '....................MMBJGGGGJJB.................................',
      '....................MM.BBBBBB...................................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '.................................BBBBBBBB.......................',
      '.............................BBBBXXXXXXXXBBBB...................',
      '...........................BBXXXXXXGGGGGXXXXB...................',
      '..........................BXXXXGGGGXXXHJHGGGXBB.................',
      '.........................BXXXGXXXEEEHHONNKEEGXXB................',
      '........................BXXGGXESXEEEEXQQNNNEXXXB................',
      '.......................BXXXXEESQSXXEEXXHHEEEEEHHMB..............',
      '.................BBMMM.BXXGEESQSJSXXXXXXXXEEEHQQHXB.............',
      '...............MMWWWWWBXGXXXXXSJSTTTBBBBBBBTTEOHGXMB............',
      '...............MMWWWWBUGGXBBXXXSTBBBOOOOOOOBFMHJHGXB............',
      '...............MQWWWBBXBBBSSBTTBBOQOWWWWBWOOBMTHTXXB............',
      '...............DDWWBSBBBSNSYBBGOOQWWWWWWBWWOOBBFTTTB............',
      '................BQBScBBBHSRKSSBOOWWWWWWBIBWOOWWBBBFB............',
      '..............QOMOOQcBZBcNNKHBWWWWWBWWBIIIBWBWWBSSBB............',
      '..............BMMMOBSSBBBSHHMMWWWaBBBBIIPIIBBOWWKKSSB...........',
      '...............MMMBSNYWQBSSMOaBOWBIIRBPPPEERRBOaBYSSB...........',
      '.................BBSNBBZZBMBWaBBOBBBIPPPPPRBBBOaBSNBZB..........',
      '..................BBSSBBBBBBWBERBcBSBPPPPBBBbBMaBSSBZB..........',
      '................MBBDBBMOOBBBBIPPPSEBFPPPPPBESBQBBBBZB...........',
      '..............BMSXXXXBMMMMBJUPPPPSIEEPPPPFIESBQBIB.W............',
      '.............BXSTPXXXXTBOMBEPPPPPPSEPPPPIPPEYBBEBB..............',
      '............BXEPXXXXXTTTBBBBBBPPPPPPPPPPPPPPBUEEB..B............',
      '...........MXTSUNXXXXXTGBGXXXXBPEPPPPPEREPPBREEFB.BaB...........',
      '..........BTGTXSXXXXXXGBXXXXXXXBBIPPPPPPPPBRIaIBBBQMFB..........',
      '..........BXXXSXXXXXXXXXXXXXXXXUMBBFPPPPBBWIWIIIBaQaOB..........',
      '..........BXXXXSXXXXXXXXXXGXXXXSEBRBBBBBPPBIWGUOOWPBB...........',
      '..........BXXHXXXXXXXXXXXXTTXXUUSHBBBBBPPPPBFFBWEIEB............',
      '..........XXGXESXXXXXXXXGGTBSTSSTTTBGXBPPPPBBFWBIPPB............',
      '.........BXXTTSaaBBBBBBBBBBBBSXXXXXXGXBPPPPBJBIFBPB.............',
      '.........BBBBBB.BIXXKKKeeBTMBQXXXXXXXXBPPPRBGSIIBB..............',
      '.........BB.....BURXNNNeeMBOMBXXXXXXXUBIIRBMJIGIB...............',
      '........BGFBBB...bHNNNNNNeBBGXBXXXXXFUBBBGBIIGBB................',
      '........BFEFGJBBBBHXNNNNNeKKBMDBBXXXGUBPBGBIIBB.................',
      '.......BFFFFFJUPPBHXNPNNNNNNNNeeKBBBBBBBUJIIIRB.................',
      '.......BGFFFGBPPPBHXXENNNNNNNNNNNNNUPUUMSBIIIFB.................',
      '......BFFFFGGNPPPPBHKUXENNNNNNNNNINXHINBBMIIJB..................',
      '......BFEFJJGBKRRRUBHNUXXHUUNNNNNUUUUKBBBMBBB...................',
      '......BFEEFBBBBRRRUJBBNNNXXXIUIUUUHHBBBIP.......................',
      '......BGFFGB...BBBBB.BBBNNNNXXXXNNBBMIIPPBB.....................',
      '......BGGFB.............BBBNNNNHBB..BIIPPPUB..BBBB..............',
      '.......BBB................BBBBBB.....BPPPPEJMBEEJGBM............',
      '......................................BPPBGGGBEGJBMM............',
      '......................................BRGFFEJFGGMMMM............',
      '.......................................BJOFFFGJBMMM.............',
      '........................................BFFFFJMMMB..............',
      '........................................BMFFMOOOM...............',
      '.........................................BFGBBBB................',
      '..........................................BJB...................',
      '...........................................BB...................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '.................................BBBBBBBB.......................',
      '.............................BBBBXXXXXXXXBBBB...................',
      '...........................BBXXXXXXGGGGGXXXXB...................',
      '..........................BXXXXGGGGXXXHJHGGGXBB.................',
      '..................BM.....BXXXGXXXEEEHHONNKEEGXXB................',
      '...............BQ.MWMM..BXXGGXESXEEEEXQQNNNEXXXB................',
      '...............BQMBWWWBBXXXXEESQSXXEEXXHHEEEEEHHMB..............',
      '................BWWWWWMBXXGEESQSJSXXXXXXXXEEEHQQHXB.............',
      '................QWWWWWBEGXXXXXSJSTTTBBBBBBBTTFOHGXMB............',
      '..............OOBWWWWBUGGXBBXXXSTBBBOOOOOOOBFMHGHGXB............',
      '..............BOOOWWBBXBBBSSBTTBBOQOWWWWBWOOBMTHTXXB............',
      '...............BOOBBSBBBSNSYBBGOOQWWWWWWBWWOOBBFTTTB............',
      '...............BOOOScBBBHSRKSSBOOWWWWWWBIBWOOWWMBBFB............',
      '...............BBOOMcBZBcNNKHBWWWWWBWWBIIIBWBWWBSSBB............',
      '................BMMBSSBBBSHHMMWOWaBBBBIIPIIBBOWWKKSSB...........',
      '...............BBBBSNYaQBSSMOaBBWBIIRBPPPEERRBOaBYSSB...........',
      '.............BEXXSBSNBBZZBMBWaBBBBBBIPPPPPRBBBOaBSNBZB..........',
      '............BXETSXSBSSBBBBBBWBEIBbBSBPPPPBBBbBMaBSSBZB..........',
      '...........BXXESXXXXBBMOOBBWBIPPPSEBEPPPPPBESBQBBBBZB...........',
      '..........BTTGGIKXXXXBMMMMBJUPPPPSIEEPPPPFIESBQBTBbZ............',
      '..........BXGXUSXXXXXXTBOMBEPPPPPPSEPPPPIPPEYBBIEBBB............',
      '.........BXXXSXXXXXXGTTTBBBBBBPPPPPPPPPPPPPPBFIEEBBaBB..........',
      '.........BXGSXSXXXXXXXTGBMXXXXBPEPPPPPEREPPBRPFEMBBQFBB.........',
      '........BUXGUUXXXXXXXXTBTMUXXXXBBIPPPPPPPPBIPaFIBBOaOBB.........',
      '.........BBUUSXXXXXXXXGXBUXXXXXEJBBFPPPPBBEIIaaFDWPBBB..........',
      '..........BBSXXXXXXXXXXXaUXPXXXBBURBBBBBEIIIIaBWQIEBD...........',
      '............BbBXXXXXXXXBSPSPSSBQMBBBMQB.BBBBBBaBMEPBB...........',
      '.............M.BBBXXXXXBSXXXTEBTBBPBBQ..BFFGGBBIBPBB............',
      '.................BBBBBMBXXXXTXJBBPPPBB.BJFIIGSSIBBB.............',
      '...............BBBPEKeeBXXXXGXXBKPPPB.BGIIIIJJPIIM..............',
      '.............BBJJBPINeeBXXXXXUMBPPPPB.BGRRJIIGBBB...............',
      '...........BBJJFTBNNNNNKMXXXJUBPPPPPB.BGIGBBIBBB................',
      '..........BJGFFFFBHXNNNNNBXXEXBIRRPBNBBGRRaIIIBB................',
      '..........GJFFFJGBHXNXNNNNMEEEBBBBPWHBBMERIIIFBB................',
      '.........BGEEFGJBBHEXNNNNNNNBBKNNNKNNNBBGFIIGGB.................',
      '.........BGFFMBTOBBNXNNNNNNNNNNNNNNKXNBbBBBBBB..................',
      '..........BBB..BPBBHIXENNNNNNNNNNNXNNNIB........................',
      '................PRMBHNXXHUUNNNNNXNXHHXHHB.......................',
      '................BUUBBNNNXXXIUUIUEUUUNHBBB.......................',
      '.................BBBBBBNNNNXXXXNNNNNNBUIB.......................',
      '.......................BBBNNNNNNIBBBBIIIB.......................',
      '..........................BBBBBBB..BEIPKB.......................',
      '...................................BFOPFRBD.....................',
      '....................................BJBJJFBBBBB.................',
      '....................................BFFFFJJFFFGB................',
      '....................................BFFFFFFFFTQB................',
      '....................................BFFFFEEGGJB.................',
      '....................................BFFFMFGGBB..................',
      '....................................BGGFBBBBB...................',
      '.....................................BBBB.......................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '.................................MBBBBBBB.......................',
      '.............................BBBBXXXXXXXXBBBB...................',
      '...........................BBXXXXXXGGGGGXXXXB...................',
      '..........................BXXXXGGGGXXXHJHGGGXBB.................',
      '.........................BXXXGXXXEEEHHONNKEEGXXB................',
      '........................BXXGGXESXEEEEXQQNNNEXXXB................',
      '.......................BXXXXEESQSXXEEXXHHEEEEEHHOB..............',
      '.......................BXXGEESQSJSXXXXXXXXEEEHQQHXB.............',
      '......................BXGXXXXXSJSTTTBBBBBBBTTEOHGXMB............',
      '.....................BUGGXBBXXXSTBBBOOOOOOOBFMHJHGUB............',
      '....................BBXBBBSSBTTBBOQOWWWWBWOOBMTHTXXB............',
      '...................BSBBBSNSYBBGOOQWWWWWWBWWOOBBFTTTB............',
      '..................BScBBBHSRKSSBOOWWWWWWWBWWOOWWMBBFB............',
      '................MBMQcBZBcNNKHBWWWWWWWWWBIBWWWWWBSSBB............',
      '...............MOMOBSSBBBSHHMMWWWWWWWWBIIEMWOWWWKKSSB...........',
      '...............BOQBSNYaQBSSMMWWWBQOWWBIIPEBWBQWQBYSSB...........',
      '...............BMOBSNBBZZBMBBWWQBMMBBIIPPPIBBMWaBSNBZB..........',
      '................MOMBSSBBBBBRFMWBMbBSBPPPPBBBbBQBBSSBZB..........',
      '................BMMOBBMOOQBIBMQBPSEBFPPPPPBESBWBBBBZB...........',
      '..................BOOMMMMMBGEPBPPSIEEPPPPFIESBB..B.a............',
      '...................BBBBBBBBFKPPPPPSEPPPPIPPERB...B..............',
      '....................MBHXXXXBBBPPPPPPPPPPPPPPB........B..........',
      '..................MJINNXXXXXXXBPEPPPPPEREPPBFB......BaB.........',
      '.........MB......BXXXXSISXXXXXXBBIPPPPPPPPBXXEB.MBBBWQFB........',
      '.........BTBBBBBBXXXXXTPXSXXXXXEJBBFPPPPBBEXXGRGPYBWQFOB........',
      '.........BXXXUeIBXXXXXFGSXXXXXUBBURBBBBBXEXXFFULIMBWPBB.........',
      '.........BXXTTSFBUXXXXXJKXXXXMBWQBBBQOBMXXXETTIFBWEIIB..........',
      '.........BXXGTXSBXTXXXXXBFXMMBWQQQQQQOBBBXXBBBBFWBEPPB..........',
      '.........BMXXTSTBXXBBBBBGXBBWQWQQQQWQBBBBBJGFGGBIFBPB...........',
      '..........BXXNXSTBRRPKPPOBTTBWWQQWWBBBBBBJJIIIGSIRBB............',
      '...........BXXXXTBPPPPPPMeBXGGBBBBBMBBBBJGIIIIGEGIB.............',
      '............MMSURBPPPPPPPBKBMIUUUUUBBBBBBFIIaIIGBB..............',
      '.............BBPGXBPPPPPPBKNZBBMMDMBB...JIIFBIIBB...............',
      '...............MBBMBPPPPBNNNNNNNNNHB....BIIaIIIRB...............',
      '....................BBBBNNNNHXXXXIHB....BQIIIIIFB...............',
      '....................BENNNXNNXNNNNJNB.....BJIIIGB................',
      '....................BXILXTXXENBBBcBB......MBBBB.................',
      '....................BNUPGBBBBBEIIBBB............................',
      '....................BKNQGGGGBIFIPTBB............................',
      '.....................BBQGFGFOPPPPBPB............................',
      '.......................MGFTJBPPKBBKB............................',
      '......................BBGFTJMBBBBKB.............................',
      '......................BBGFQJBBBBBB..............................',
      '.....................BFBGFFGBB..................................',
      '.....................BFBGFFFMB..................................',
      '....................BaFaBJTFM...................................',
      '....................BFFFWBMJB...................................',
      '....................BFFFFEMMMB..................................',
      '....................BGFFFFJFETB.................................',
      '....................BJJGGFEEETB.................................',
      '.....................BBMJJJJJGB.................................',
      '.......................BBBBBBB..................................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '.................................MBBBBBBB.......................',
      '.............................BBBBXXXXXXXXBBBB...................',
      '...........................BBXXXXXXGGGGGXXXXB...................',
      '..........................BXXXXGGGGXXXHJHGGGXBB.................',
      '.........................BXXXGXXXEEEHHONNKEEGXXB................',
      '........................BXXGGXESXEEEEXQQNNNEXXXB................',
      '.......................BXXXXEESQSXXEEXXHHEEEEEHHOB..............',
      '.................MBMMMOBXXGEESQSJSXXXXXXXXEEEHQQHXB.............',
      '.................WWWWWBEGXXXXXSJSTTTBBBBBBBTTEOHGXMB............',
      '...............DMWWWWBUGGXBBXXXSTBBBOOOOOOOBFMHGHGUB............',
      '...............BWWWWBBXBBBSSBTTBBOQOWWWWBWOOBMTHTXXB............',
      '................BWWBSBBBSNSYBBGOOQWWWWWWBWWOOBBFTTTB............',
      '................MOBScBBBHSRKSSBOOWWWWWWBIBWOOWWMBBFB............',
      '..............MOMMOQcBZBcNNKHBWWQWWBWWBIIIBWBWWBSSBB............',
      '..............BMMMOBSSBBBSHHMMWOWaBBBBIIPIIBBOWWKKSSB...........',
      '................BMBSNYaQBSSMOaBBWBIIRBPPPEERRBOQBYSSB...........',
      '.................BBSNBBZZBMBWaBBBBBBIPPPPPRBBBOaBSNBZB..........',
      '...................BSSBBBBYBWBEPBcBSBPPPPBBBbBMaBSSBZB..........',
      '................BMOMBMMOMMRMBIPPPSEBFPPPPPBESBQBBBBZB...........',
      '...............BUXXXUISTTXBFEPPPPSIEEPPPPFIESBQB.B.a............',
      '..............BXXXXXXNIETXBFPPPPPPSEPPPPIPPEPBB..B..............',
      '..............MXXXXXXXKHTXXBBBPPPPPPPPPPPPPPB........B..........',
      '............BBBXXXXXXXXSXXXXXXBPEPPPPPEREPPBEBB..BB.BaB.........',
      '...........BFQYBBXXXTTSXXXXXXXXBBIPPPPPPPPBXXXOJJPBBWQFB........',
      '..........BXXOPPBBMUBGQXXXXXXXOXJBBFPPPPBBEXXTIIPYBaQFOB........',
      '.........BEXBPPPPPBBXBBBBBBBBBBBBURBBBBBMXXXXFUaEMBWPBB.........',
      '.........MTBBPPPPPPBUXXXXXBQQQQWBBBBQOBBBMXETTIFBWEIIB..........',
      '.........BBBBBPPPPPBBBBBBBBQQQQQQQQQQOBBBBBBBBBEWBEPPB..........',
      '.........BBBBBGPPPPBBBBBBMXBWQWQQQWQOBBBBBJGFGJBIFBPB...........',
      '.........BBBBBBBBMBBBBBBeBBTBQWQQWWBBBBBDGQIIIGSIRBB............',
      '............BBBBBBBBBBBeeKBXGJBBBBBB....BGIIIIQEGIB.............',
      '............MBBBBBBBBBeeNKKBBXUUUUUB....BFIIBIIGBB..............',
      '...........MBTFJMBBPEKeNNNNKZMMMBBB.....BGIFBIIBB...............',
      '...........BTFFGJBKNXeNNNNNNNNNNNKB.....BFIIIIIRB...............',
      '..........MGFFGTBRBHXHNNNNNNNNNNNUEEB...BQIIIIIFB...............',
      '..........BGFEGTBPBNHXNNNNNNNNIHXXIKZB...BJIIIGB................',
      '.........BGGFJJGBRRBSXXNUNNNNNXXKNNHMB....MBBBB.................',
      '.........BGEETJBMBBBMHEXKXIUIXNNNBBBB...........................',
      '.........BGFFGB.....BeNNNXXXXNNBBIIIQM..........................',
      '.........BGGGB.......MMBNNNNNBBBEIIPPB..........................',
      '..........BBB...........BBBBB...BIPPPPB....BB...................',
      '.................................BPPPPGD.BBGGBB.................',
      '.................................BPPPLGGBMEJBBB.................',
      '.................................BPPPBGGGEJJMMB.................',
      '..................................BBBFFFTTJBMB..................',
      '..................................BJFFFFFGBMM...................',
      '...................................MGFFFMQMM....................',
      '....................................BFFFMBB.....................',
      '.....................................MBGBB......................',
      '......................................BMB.......................',
      '................................................................',
      '................................................................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '.................................BBBBBBBB.......................',
      '.............................BBBBXXXXXXXXBBBB...................',
      '...........................BBXXXXXXGGGGGXXXXB...................',
      '..........................BXXXXGGGGXXXHJHGGGXBB.................',
      '.................BQ.BM...BXXXGXXXEEEHHONNKEEGXXB................',
      '.................BQ.BJB.BXXGGXESXEEEEXQQNNNEXXXB................',
      '..................JMOWWBXXXXEESQSXXEEXXHHEEEEEHHMB..............',
      '..................BWWWWBXXGEESQSJSXXXXXXXXEEEHQQHXB.............',
      '................QOMWWWBEGXXXXXSJSTTTBBBBBBBTTFOHGXMB............',
      '................BOOWWBUGGXBBXXXSTBBBOOOOOOOBFMHJHGXB............',
      '................BMMWBBXBBBSSBTTBBOQOWWWWBWOOBMTHTXXB............',
      '................BMMBSBBBSNSYBBGOOQWWWWWWBWWOOBBFTTTB............',
      '................BMMScBBBHSRKSSBOOWWWWWWBIBWOOWWMBBFB............',
      '.................BBMcBZBcNNKHBWWQWWBWWBIIIBWBWWBSSBB............',
      '..............BBBMBBSSBBBSHHMMWOWaBBBBIIPIIBBOWWKKSSB...........',
      '...........BBBXXXSMSNYaQBSSMOaBBWBIIRBPPPEERRBOQBYSSB...........',
      '.........WMXXXXXSSBSNBBZZBMBWaBBBBBBIPPPPPRBBBOaBSNBZB..........',
      '.........MXXTTTTSXXMSSBBBBBBWBEIBcBSBPPPPBBBbBMaBSSBZB..........',
      '..........MXTTTXKXXUBBMOOBBWBIPPPSEBEPPPPPBESBQBBBBZB...........',
      '..........MXXSUSXXXXXBMMMMBJUPPPPSIEEPPPPFIESBQB.B.a............',
      '...........BPESUXXXXTTBBBBBEPPPPPPSEPPPPIPPEPBB..B..............',
      '...........BIXXXXXXXBBKEXXXBBBPPPPPPPPPPPPPPB........BB.........',
      '............OHXXXXUBMSFSXXXXXXBPEPPPPPEREPPBXB...BB.BaB.........',
      '............MUIXXXBUXXSPSXXXXXXBBIPPPPPPPPBXXXBQJPBBWQEBB.......',
      '.............BJUUBXXXXTSXSXXXXXEJBBFPPPPBBEXXGRRRYBaQFOB........',
      '..............MBBMXXXXTESXXXXXXBBRRBBBBBUEXXTFUaEMBWPBB.........',
      '................BXXJXXXJeEXXXBBWBBBBQOBBOXXETTIFBWEIEB..........',
      '................BXXUXXXUBMBBBMWQQQQQQOBBBXUBBBBEWBMPPB..........',
      '................BXXBBBBBMUMBQQWQQQWQBBBBBBBQFGJBIFBPB...........',
      '.................BBMPPPPMBMGBQWQQWWB.....BQIIIGSIIBB............',
      '.................BPPPPPPBKBBGOBBBBBJ....BGIIIIQIGIB.............',
      '.................BPPPPPPPBKNBUUUUUUB....BGIIBIIGBB..............',
      '................BBOPPPPPPBKKKbMMMBBB....BGIFBIIBB...............',
      '...............BGGBOPPPPMNNNNNNeKKKB....BGIIIIIRB...............',
      '..............BGGFTMBBBBNNNNNNNNNNNNB...BQIIIIIFB...............',
      '..............BGEFGMHRNNNNNNNNNNNNUNB....BJIIIGB................',
      '..............BGGGGBNXXNNNNNNNNNNPKNUM....MBBBB.................',
      '...............BBBQBHNXXHNUNNNNTNTSXTNB.........................',
      '....................BHNNXXXRIIUEUXXNHBB.........................',
      '.....................BBNNNNXXXNNNNNNB...........................',
      '.......................BBBNNNNNFBMMIB...........................',
      '..........................BBBBBMIIRRB...........................',
      '...............................BBPPPB...........................',
      '...............................BQBBBOM..........................',
      '...............................BFGFFFB..........................',
      '...............................BFFFFGFBBBM......................',
      '...............................BFFFFFFTFEFB.....................',
      '...............................BFFFFFFFFFFB.....................',
      '...............................MTGBJGGGGJJB.....................',
      '................................MBOMBBBBBB......................',
      '................................................................'
    ],
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '.................................MBBBBBBB.......................',
      '.............................BBBBXXXXXXXXBBBB...................',
      '...........................BBXXXXXXGGGGGXXXXB...................',
      '..........................BXXXXGGGGXXXHJHGGGXBB.................',
      '.........................BXXXGXXXEEEHHONNKEEGXXB................',
      '........................BXXGGXESXEEEEXQQNNNEXXXB................',
      '.......................BXXXXEESQSXXEEXXHHEEEEEHHMB..............',
      '.......................BXXGEESQSJSXXXXXXXXEEEHQQHXB.............',
      '......................BXGXXXXXSJSTTTBBBBBBBTTEOHGXMB............',
      '.....................BUGGXBBXXXSTBBBOOOOOOOBFMHGHGUB............',
      '....................BBXBBBSSBTTBBOQOWWWWBWOOBMTHTXXB............',
      '...................BSBBBSNSYBBGOOQWWWWWWBWWOOBBFTTTB............',
      '..................BScBBBHSRKSSBOOWWWWWWWBWWOOWWBBBFB............',
      '................MBMMcBZBcNNKHBWWWWWWWWWBIBWOWWWBSSBB............',
      '...............MOMOBSSBBBSHHMMWWWWWWWWBIIEMWBWWWKKSSB...........',
      '...............BOQBSNYWQBSSMMWWWBBWMWBIIPEaWBQWQBYSSB...........',
      '................MMBSNBBZZBMBBWWQBMMBBIIPPPIBBMWaBSNBZB..........',
      '................MMMBSSBBBBBRGMWBEcBSBPPPPBBBbBQBBSSBZB..........',
      '.................BMOBBOOOBBIBMQBPSEBEPPPPPBESBWBBBBZB...........',
      '..................BOMMBMMMBGEPBPPSIEEPPPPFIESBB..B.a............',
      '...................BBBBBBMBFKPPPPPSEPPPPIPPERB...B..............',
      '.........................BBBBBPPPPPPPPPPPPPPB.......B...........',
      '........................DMBXXXBPEPPPPPEREPPBJB.BB..BaB..........',
      '.........MB...........MBUBXXXXXBBIPPPPPPPPBXGIQFFBBQQFB.........',
      '.........BTBB........BXXBXXXXXXJXBBFPPPPBBEFIPEPKBWMFOB.........',
      '.........BXXXBBBBBBBXXXXBEXXSXXBBRRBBBBBUUTGIJbUBBWPBB..........',
      '.........BXXXXESXXXXXXXXBTSSSSSBOBBBBQBRUUXGIFFBWEIEB...........',
      '.........BXXTTSXXXXXXXXXBSXXXXUBBBPPPBBBXBBBBBFWBIPPB...........',
      '.........BXXGTXSXXXXXXXXBXXXXXJTJBPPPPBBBGGFEGBIFBPB............',
      '.........BXXXTSXXXXXXXXXBXXXXXXUBPPPPPBBaGIIIGSIIBB.............',
      '..........BXXSXSXXXXXXXXBXXXXXTXMPPPPPBGGIIIIQIGIB..............',
      '...........BXUEEXXXXXXXXUBXXXXTTBPPPPMBGIIIBIIGBB...............',
      '............BXXSXXXXXXXBBKBXXFXXBRIPMBBGIEFBIIBB................',
      '.............BSIXXXXXXBBNNNBBUXXBBBBeBBGEIWIIIRB................',
      '................BBBBBBNNNNNNNONNNNNLHXTBMIIIIIFB................',
      '................BNXINNNNNNNNNNNNNNNNUIHHBGIIIGB.................',
      '................BHNXHNNNNNNNNNNNNNXHUNBB.BBBBB..................',
      '.................BHPXUNNNNNNNNNNXUXXHBRB........................',
      '..................BHNXXHUUNXPPIUUUNNBIPB........................',
      '..................BBNNNXXXXXXXXPNHMBRPB.........................',
      '.................BJPBBNNNNNNNKNNBBMBBB..........................',
      '................BPPPRRBBBBBBMDBBaFJM............................',
      '...............BMPPPPPB.....BMFFFJGB............................',
      '...............MMBPPPB.......BQFFFFTD...........................',
      '..............BFGBPPB.........BTFFFGD...........................',
      '.............BFFFGBGB..........MGFFGM...........................',
      '.............BEFFFFGB...........BBB.............................',
      '.............BGFFFGFBBB.........................................',
      '..............BGFFEJFTEB........................................',
      '...............MFFFEEEEB........................................',
      '...............MJGGGGGGB........................................',
      '................MBBBBBM.........................................',
      '................................................................'
    ]
  ];

  const GUARDIAN_SPRITE_SPECS = {
    araci: {
      pal: ARACI_PALETTE,
      idleRow: ARACI_IDLE_ROW,
      walkRows: ARACI_WALK_ROWS,
      breatheCutY: 46,
      sxOff: 18,
      syOff: 6,
      silCore: '#101c15',
      silRims: ['#68bd59', '#a5e06c', '#f2cc6b'],
      silAccent: (sx, sy, col) => (
        sy <= 15 && col !== '#000000' && col !== '#060302' && col !== '#080706' && col !== '#151413'
          ? '#68bd59'
          : null
      ),
      stars: ['#7ec456', '#f2cc6b', '#7ef08b'],
      starPos: [[14, 18], [49, 16]],
      drawBlink: (put, oxOff = 0, oyOff = 0) => {
        for (const ox of [25, 36]) {
          for (let i = 0; i < 4; i++) {
            put(ox + i + oxOff, 21 + oyOff, '#c86543');
            put(ox + i + oxOff, 22 + oyOff, '#ea9165');
            put(ox + i + oxOff, 23 + oyOff, '#2c150d');
          }
        }
      },
      drawMouth: (put, m, oxOff = 0, oyOff = 0) => {
        if (m === 1) {
          for (let bx = 31; bx <= 33; bx++) put(bx + oxOff, 25 + oyOff, '#482215');
          put(32 + oxOff, 26 + oyOff, '#c86543');
        } else if (m >= 2) {
          for (let bx = 31; bx <= 33; bx++) {
            put(bx + oxOff, 25 + oyOff, '#2c150d');
            put(bx + oxOff, 26 + oyOff, bx === 32 ? '#e12c20' : '#c86543');
          }
        }
      }
    },
    irece: {
      pal: IRECE_PALETTE,
      idleRow: IRECE_IDLE_ROW,
      walkRows: IRECE_WALK_ROWS,
      breatheCutY: 47,
      sxOff: 18,
      syOff: 5,
      silCore: '#0f1a26',
      silRims: ['#4da6b8', '#9ef0ff', '#f2cc6b'],
      silAccent: (sx, sy, col) => (
        sx >= 29 && sx <= 34 && sy >= 9 && sy <= 16 &&
        col !== '#000101' && col !== '#020505' && col !== '#0a1720' && col !== '#142135'
          ? '#9ef0ff'
          : null
      ),
      shimmerPos: [31, 12],
      stars: ['#9ef0ff', '#7af7f0', '#f2cc6b'],
      starPos: [[13, 19], [50, 18]],
      drawBlink: (put, oxOff = 0, oyOff = 0) => {
        for (const ox of [25, 35]) {
          for (let i = 0; i < 4; i++) {
            put(ox + i + oxOff, 18 + oyOff, '#d37859');
            put(ox + i + oxOff, 19 + oyOff, '#e28c69');
            put(ox + i + oxOff, 20 + oyOff, '#e28c69');
            put(ox + i + oxOff, 21 + oyOff, '#142135');
          }
        }
      },
      drawMouth: (put, m, oxOff = 0, oyOff = 0) => {
        if (m === 1) {
          put(31 + oxOff, 23 + oyOff, '#1f110c');
          put(32 + oxOff, 23 + oyOff, '#1f110c');
          put(31 + oxOff, 24 + oyOff, '#b65d42');
          put(32 + oxOff, 24 + oyOff, '#b65d42');
        } else if (m >= 2) {
          put(30 + oxOff, 23 + oyOff, '#b65d42');
          put(31 + oxOff, 23 + oyOff, '#1f110c');
          put(32 + oxOff, 23 + oyOff, '#1f110c');
          put(33 + oxOff, 23 + oyOff, '#b65d42');
          put(31 + oxOff, 24 + oyOff, '#85432c');
          put(32 + oxOff, 24 + oyOff, '#85432c');
        }
      }
    },
    jurema: {
      pal: JUREMA_PALETTE,
      idleRow: JUREMA_IDLE_ROW,
      walkRows: JUREMA_WALK_ROWS,
      breatheCutY: 48,
      sxOff: 16,
      syOff: 5,
      silCore: '#241310',
      silRims: ['#d96538', '#ffd35a', '#f2cc6b'],
      silAccent: (sx, sy) => (sx >= 45 && sx <= 54 && sy >= 7 && sy <= 20 ? '#ffd35a' : null),
      shimmerPos: [49, 14],
      stars: ['#ffd35a', '#f7c97e', '#ffb35c'],
      starPos: [[10, 22], [50, 7]],
      drawBlink: (put, oxOff = 0, oyOff = 0) => {
        for (const ox of [23, 33]) {
          for (let i = 0; i < 4; i++) {
            put(ox + i + oxOff, 19 + oyOff, '#d47b44');
            put(ox + i + oxOff, 20 + oyOff, '#f1a079');
            put(ox + i + oxOff, 21 + oyOff, '#2f1a13');
            put(ox + i + oxOff, 22 + oyOff, '#f1a079');
          }
        }
      },
      drawMouth: (put, m, oxOff = 0, oyOff = 0) => {
        if (m === 1) {
          for (let bx = 28; bx <= 30; bx++) {
            put(bx + oxOff, 24 + oyOff, '#2f1a13');
            put(bx + oxOff, 25 + oyOff, '#bd5b31');
          }
        } else if (m >= 2) {
          for (let bx = 28; bx <= 30; bx++) {
            put(bx + oxOff, 24 + oyOff, '#2f1a13');
            put(bx + oxOff, 25 + oyOff, bx === 29 ? '#d47b44' : '#bd5b31');
          }
          put(27 + oxOff, 24 + oyOff, '#5f2813');
          put(31 + oxOff, 24 + oyOff, '#5f2813');
        }
      }
    }
  };

  function makeGuardianActor(spec) {
    const { pal, idleRow, walkRows, breatheCutY, silCore, silRims, silAccent, shimmerPos, stars, starPos, drawBlink, drawMouth } = spec;
    const sil0 = buildSilhouetteFrame(idleRow, pal, silCore, silRims[0], silAccent);
    const sil1 = buildSilhouetteFrame(idleRow, pal, silCore, silRims[1], silAccent);
    const sil2 = buildSilhouetteFrame(idleRow, pal, silCore, silRims[2], silAccent);
    const idle0 = decodeHiBitFrame(idleRow, pal);
    const idle1 = buildBreathingFrame(idleRow, pal, breatheCutY, (x, put) => {
      if (shimmerPos) put(shimmerPos[0], shimmerPos[1] - 1, '#ffffff');
    });
    const idle2 = decodeHiBitFrame(idleRow, pal, (x, put) => drawBlink(put));
    const walk = walkRows.map(rows => decodeHiBitFrame(rows, pal));
    const talk1 = decodeHiBitFrame(idleRow, pal, (x, put) => drawMouth(put, 1));
    const talk2 = decodeHiBitFrame(idleRow, pal, (x, put) => drawMouth(put, 2));
    const sing1 = decodeHiBitFrame(idleRow, pal, (x, put) => {
      drawMouth(put, 1);
      if (shimmerPos) put(shimmerPos[0], shimmerPos[1], '#ffffff');
      drawStar(x, starPos[0][0], starPos[0][1], 2, '#ffffff', stars[0]);
    });
    const sing2 = buildBreathingFrame(idleRow, pal, breatheCutY, (x, put) => {
      drawMouth(put, 2, 0, -1);
      if (shimmerPos) put(shimmerPos[0], shimmerPos[1] - 1, '#ffffff');
      drawStar(x, starPos[1][0], starPos[1][1] - 1, 2, '#ffffff', stars[1]);
    });
    const celeb1 = buildOffsetFrame(idleRow, pal, -1, (x, put) => {
      drawMouth(put, 2, 0, -1);
      drawStar(x, starPos[0][0], starPos[0][1] - 3, 2, '#ffffff', stars[2]);
      drawStar(x, starPos[1][0], starPos[1][1] - 1, 2, '#ffffff', stars[1]);
    });
    const celeb2 = buildOffsetFrame(idleRow, pal, -2, (x, put) => {
      drawMouth(put, 2, 0, -2);
      drawStar(x, starPos[0][0], starPos[0][1] - 5, 2, '#ffffff', stars[0]);
      drawStar(x, starPos[1][0], starPos[1][1] - 3, 2, '#ffffff', stars[2]);
    });
    return {
      back_silhouette: [sil0, sil1, sil2, sil1],
      idle: [idle0, idle1, idle2, idle1],
      walk,
      talk: [idle0, talk1, talk2, talk1],
      sing: [idle0, sing1, sing2, sing1],
      celebrate: [idle0, celeb1, celeb2, celeb1]
    };
  }

  function buildGuardianPortrait(spec, mouthOpen, blink) {
    return buildPortraitFromRows(spec.idleRow, spec.pal, spec.sxOff, spec.syOff, {
      mouthOpen,
      blink,
      drawBlink: (put) => spec.drawBlink(put, -spec.sxOff, -spec.syOff),
      drawMouth: (put, m) => spec.drawMouth(put, m, -spec.sxOff, -spec.syOff)
    });
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
  // ANIMAIS DE PEDRA COM MUSGO E CRISTAIS LUMINOSOS — HI-BIT 38x36 PIXELS (ESTILO OWLBOY)
  // ============================================================================
  // BICHINHOS DE PEDRA MUSICAIS (EXCLUSIVOS DA CAVERNA)
  // Criaturas de pedra arredondadas, expressivas e fofas/caricatas com coroinha
  // de cristais cintilantes, bochechinhas coradas, olhões kawaii e boquinha em "O".
  // ============================================================================
  function buildHiBitStoneAnimal(neonHi, neonMid, isSing = false, frame = 0, cheekCol = '#ff9eb5') {
    const W = 40, H = 38;
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

    const ROCK_0 = '#221c1c'; // contorno
    const ROCK_1 = '#382e2c'; // sombra
    const ROCK_2 = '#544745'; // tom médio
    const ROCK_3 = '#726360'; // brilho
    const ROCK_4 = '#8f807c'; // luz superior
    const MOSS_0 = '#2f5e27';
    const MOSS_1 = '#4e943c';
    const MOSS_2 = '#79bd54';

    const squashY = (isSing && frame === 1) ? -1 : 0;
    const centerY = 23 + squashY;

    // 1. Cristais cintilantes no topo da cabeça
    const crystals = [
      [13, 10 + squashY, 7, -1],
      [20, 7 + squashY, 9, 0],
      [27, 10 + squashY, 7, 1]
    ];
    for (const [cx, cy, h, lean] of crystals) {
      for (let py = cy - h; py <= cy; py++) {
        const progress = (cy - py) / h;
        const w = Math.max(1, Math.round((1 - progress) * 2.8));
        const lx = Math.round(lean * (1 - progress));
        for (let px = cx - w + lx; px <= cx + w + lx; px++) {
          let col = neonMid;
          if (px < cx) col = (py === cy - h) ? '#ffffff' : neonHi;
          else if (px === cx) col = (py <= cy - h + 1 || (frame === 1 && ((px + py) & 1) === 0)) ? '#ffffff' : neonHi;
          put(px, py, col);
        }
      }
    }

    // 2. Corpinho arredondado gordinho e fofo (batatinha de pedra alegre)
    const bodyRx = 13.5;
    const bodyRy = 10.5 + ((isSing && frame === 0) ? 0.5 : (isSing && frame === 1) ? -0.5 : 0);
    fillEll(20, centerY, bodyRx, bodyRy, (px, py, dx, dy, d) => {
      if (d > 0.82) return ROCK_0;
      if (dy < -0.58 && dx < 0.2) return ((px + py) & 1) === 0 ? MOSS_2 : MOSS_1;
      if (dy < -0.48 && dx < 0.25 && d > 0.6) return MOSS_0;
      if (dy < -0.4 && dx > -0.3 && dx < 0.3) return ROCK_4;
      if (dx + dy < -0.15) return ROCK_3;
      if (dx + dy > 0.35) return ROCK_1;
      return ROCK_2;
    });

    // 3. Patinhas curtas redondinhas de pedra na base
    const footY = 33 + squashY;
    fillEll(14, footY, 3.8, 2.8, (px, py, dx, dy, d) => d > 0.75 ? ROCK_0 : dy < -0.2 ? ROCK_3 : ROCK_1);
    fillEll(26, footY, 3.8, 2.8, (px, py, dx, dy, d) => d > 0.75 ? ROCK_0 : dy < -0.2 ? ROCK_3 : ROCK_1);

    // 4. Bochechinhas coradas fofas (rosadas/iluminadas)
    const cheekY = centerY + 1;
    put(13, cheekY, cheekCol);
    put(14, cheekY, cheekCol);
    put(13, cheekY + 1, cheekCol);
    put(14, cheekY + 1, cheekCol);
    put(25, cheekY, cheekCol);
    put(26, cheekY, cheekCol);
    put(25, cheekY + 1, cheekCol);
    put(26, cheekY + 1, cheekCol);

    // 5. Olhos grandes expressivos e caricatos
    const eyeY = centerY - 2;
    if (isSing && frame === 1) {
      // Olhos fechados em arco de felicidade ao cantar nota aguda (^ ^)
      put(14, eyeY, ROCK_0);
      put(15, eyeY - 1, ROCK_0);
      put(16, eyeY - 1, ROCK_0);
      put(17, eyeY, ROCK_0);
      put(22, eyeY, ROCK_0);
      put(23, eyeY - 1, ROCK_0);
      put(24, eyeY - 1, ROCK_0);
      put(25, eyeY, ROCK_0);
    } else {
      // Olhões grandes brilhantes "kawaii" com brilho duplo
      for (const ox of [15, 23]) {
        put(ox - 1, eyeY - 2, ROCK_0);
        put(ox, eyeY - 2, ROCK_0);
        put(ox + 1, eyeY - 2, ROCK_0);
        put(ox + 2, eyeY - 2, ROCK_0);

        put(ox - 1, eyeY - 1, ROCK_0);
        put(ox, eyeY - 1, '#ffffff'); // Brilho principal
        put(ox + 1, eyeY - 1, '#ffffff');
        put(ox + 2, eyeY - 1, ROCK_0);

        put(ox - 1, eyeY, ROCK_0);
        put(ox, eyeY, neonMid);      // Íris
        put(ox + 1, eyeY, neonHi);   // Brilho da íris
        put(ox + 2, eyeY, ROCK_0);

        put(ox - 1, eyeY + 1, ROCK_0);
        put(ox, eyeY + 1, ROCK_0);
        put(ox + 1, eyeY + 1, '#ffffff'); // Brilho secundário
        put(ox + 2, eyeY + 1, ROCK_0);

        put(ox, eyeY + 2, ROCK_0);
        put(ox + 1, eyeY + 2, ROCK_0);
      }
    }

    // 6. Boquinha expressiva e cômica
    const mouthY = centerY + 2;
    if (isSing) {
      if (frame === 0) {
        // Boquinha em 'O' redondinha clássica
        put(18, mouthY - 1, ROCK_0);
        put(19, mouthY - 1, ROCK_0);
        put(20, mouthY - 1, ROCK_0);
        put(21, mouthY - 1, ROCK_0);

        put(17, mouthY, ROCK_0);
        put(18, mouthY, '#831843');
        put(19, mouthY, '#ec4899'); // linguinha fofa
        put(20, mouthY, '#831843');
        put(21, mouthY, ROCK_0);

        put(17, mouthY + 1, ROCK_0);
        put(18, mouthY + 1, '#831843');
        put(19, mouthY + 1, '#831843');
        put(20, mouthY + 1, '#831843');
        put(21, mouthY + 1, ROCK_0);

        put(18, mouthY + 2, ROCK_0);
        put(19, mouthY + 2, ROCK_0);
        put(20, mouthY + 2, ROCK_0);
        put(21, mouthY + 2, ROCK_0);
      } else {
        // Boquinha em 'O' mais aberta, vibrando
        put(18, mouthY - 1, ROCK_0);
        put(19, mouthY - 1, ROCK_0);
        put(20, mouthY - 1, ROCK_0);
        put(21, mouthY - 1, ROCK_0);

        put(17, mouthY, ROCK_0);
        put(18, mouthY, '#9d174d');
        put(19, mouthY, '#f472b6');
        put(20, mouthY, '#f472b6');
        put(21, mouthY, '#9d174d');
        put(22, mouthY, ROCK_0);

        put(17, mouthY + 1, ROCK_0);
        put(18, mouthY + 1, '#500724');
        put(19, mouthY + 1, '#f472b6');
        put(20, mouthY + 1, '#f472b6');
        put(21, mouthY + 1, '#500724');
        put(22, mouthY + 1, ROCK_0);

        put(17, mouthY + 2, ROCK_0);
        put(18, mouthY + 2, '#500724');
        put(19, mouthY + 2, '#500724');
        put(20, mouthY + 2, '#500724');
        put(21, mouthY + 2, '#500724');
        put(22, mouthY + 2, ROCK_0);

        put(18, mouthY + 3, ROCK_0);
        put(19, mouthY + 3, ROCK_0);
        put(20, mouthY + 3, ROCK_0);
        put(21, mouthY + 3, ROCK_0);
      }
    } else {
      // Boquinha sorridente fofa no estado idle (sorrisinho :3)
      put(17, mouthY, ROCK_0);
      put(18, mouthY + 1, ROCK_0);
      put(19, mouthY, ROCK_0);
      put(20, mouthY + 1, ROCK_0);
      put(21, mouthY, ROCK_0);
    }

    return c;
  }

  function makeStoneNeonAnimal(neonHi, neonMid, cheekCol = '#ff9eb5') {
    const idle0 = buildHiBitStoneAnimal(neonHi, neonMid, false, 0, cheekCol);
    const idle1 = buildHiBitStoneAnimal(neonHi, neonMid, false, 1, cheekCol);
    const sing0 = buildHiBitStoneAnimal(neonHi, neonMid, true, 0, cheekCol);
    const sing1 = buildHiBitStoneAnimal(neonHi, neonMid, true, 1, cheekCol);
    return {
      idle: [idle0, idle0, idle1, idle0],
      sing: [sing0, sing1, sing0, sing1]
    };
  }


  // Compila todos os sprites Hi-Bit uma única vez no SpriteBank
  const PROTAG_F_IDLE0 = decodeHiBitFrame(PROTAG_IDLE_ROWS[0], PROTAG_PIXEL_PALETTE);
  const PROTAG_F_IDLE1 = decodeHiBitFrame(PROTAG_IDLE_ROWS[1], PROTAG_PIXEL_PALETTE);
  const PROTAG_F_IDLE2_BLINK = decodeHiBitFrame(PROTAG_IDLE_ROWS[2], PROTAG_PIXEL_PALETTE, (x, put) => drawProtagBlink(put, 19));
  const PROTAG_F_IDLE3 = decodeHiBitFrame(PROTAG_IDLE_ROWS[3], PROTAG_PIXEL_PALETTE);
  const PROTAG_WALK_FRAMES = PROTAG_WALK_ROWS.map(rows => decodeHiBitFrame(rows, PROTAG_PIXEL_PALETTE));
  const PROTAG_F_TALK1 = decodeHiBitFrame(PROTAG_IDLE_ROWS[0], PROTAG_PIXEL_PALETTE, (x, put) => drawProtagMouth(put, 1, 24));
  const PROTAG_F_TALK2 = decodeHiBitFrame(PROTAG_IDLE_ROWS[0], PROTAG_PIXEL_PALETTE, (x, put) => drawProtagMouth(put, 2, 24));
  const PROTAG_F_CELEB1 = buildOffsetFrame(PROTAG_IDLE_ROWS[0], PROTAG_PIXEL_PALETTE, -1, (x, put) => {
    drawProtagMouth(put, 2, 23);
    put(31, 40, '#ffffff');
  });
  const PROTAG_F_CELEB2 = buildOffsetFrame(PROTAG_IDLE_ROWS[0], PROTAG_PIXEL_PALETTE, -2, (x, put) => {
    drawProtagMouth(put, 2, 22);
    put(31, 39, '#ffffff');
  });
  const PROTAG_FALL_EYE_Y = [25, 26, 26, 27];
  const PROTAG_FALL_MOUTH_Y = [29, 30, 30, 31];
  const PROTAG_FALL_FRAMES = PROTAG_FALL_ROWS.map((rows, i) => decodeHiBitFrame(rows, PROTAG_PIXEL_PALETTE, (x, put) => {
    const ey = PROTAG_FALL_EYE_Y[i];
    const my = PROTAG_FALL_MOUTH_Y[i];
    put(26, ey - 1, '#f6f6f5');
    put(35, ey - 1, '#f6f6f5');
    drawProtagMouth(put, 2, my);
  }));
  const PROTAG_F_FALLEN = buildProtagFallenPose();
  const PROTAG_F_LAND29 = decodeHiBitFrame(PROTAG_LAND_ROW, PROTAG_PIXEL_PALETTE);
  const PROTAG_F_SHOCK0 = decodeHiBitFrame(PROTAG_IDLE_ROWS[0], PROTAG_PIXEL_PALETTE, (x, put) => {
    put(26, 20, '#f6f6f5');
    put(35, 20, '#f6f6f5');
    put(26, 23, '#f6f6f5');
    put(35, 23, '#f6f6f5');
    drawProtagMouth(put, 2, 24);
  });

  const FEMALE_PROTAG_F_IDLE0 = decodeHiBitFrame(FEMALE_PROTAG_IDLE_ROWS[0], FEMALE_PROTAG_PIXEL_PALETTE);
  const FEMALE_PROTAG_F_IDLE1 = decodeHiBitFrame(FEMALE_PROTAG_IDLE_ROWS[1], FEMALE_PROTAG_PIXEL_PALETTE);
  const FEMALE_PROTAG_F_IDLE2_BLINK = decodeHiBitFrame(FEMALE_PROTAG_IDLE_ROWS[2], FEMALE_PROTAG_PIXEL_PALETTE, (x, put) => drawFemaleProtagBlink(put, 20));
  const FEMALE_PROTAG_F_IDLE3 = decodeHiBitFrame(FEMALE_PROTAG_IDLE_ROWS[3], FEMALE_PROTAG_PIXEL_PALETTE);
  const FEMALE_PROTAG_WALK_FRAMES = FEMALE_PROTAG_WALK_ROWS.map(rows => decodeHiBitFrame(rows, FEMALE_PROTAG_PIXEL_PALETTE));
  const FEMALE_PROTAG_F_TALK1 = decodeHiBitFrame(FEMALE_PROTAG_IDLE_ROWS[0], FEMALE_PROTAG_PIXEL_PALETTE, (x, put) => drawFemaleProtagMouth(put, 1, 24));
  const FEMALE_PROTAG_F_TALK2 = decodeHiBitFrame(FEMALE_PROTAG_IDLE_ROWS[0], FEMALE_PROTAG_PIXEL_PALETTE, (x, put) => drawFemaleProtagMouth(put, 2, 24));
  const FEMALE_PROTAG_F_CELEB1 = buildOffsetFrame(FEMALE_PROTAG_IDLE_ROWS[0], FEMALE_PROTAG_PIXEL_PALETTE, -1, (x, put) => {
    drawFemaleProtagMouth(put, 2, 23);
    put(31, 40, '#f3f3f4');
  });
  const FEMALE_PROTAG_F_CELEB2 = buildOffsetFrame(FEMALE_PROTAG_IDLE_ROWS[0], FEMALE_PROTAG_PIXEL_PALETTE, -2, (x, put) => {
    drawFemaleProtagMouth(put, 2, 22);
    put(31, 39, '#f3f3f4');
  });
  const FEMALE_PROTAG_FALL_FRAMES = FEMALE_PROTAG_IDLE_ROWS.map((rows, i) =>
    buildOffsetFrame(rows, FEMALE_PROTAG_PIXEL_PALETTE, i < 2 ? -1 : 0, (x, put) => {
      const dy = i < 2 ? -1 : 0;
      put(26, 20 + dy, '#f3f3f4');
      put(35, 20 + dy, '#f3f3f4');
      drawFemaleProtagMouth(put, 2, 24 + dy);
    })
  );
  const FEMALE_PROTAG_F_FALLEN = buildFemaleProtagFallenPose();
  const FEMALE_PROTAG_F_LAND29 = buildOffsetFrame(FEMALE_PROTAG_IDLE_ROWS[1], FEMALE_PROTAG_PIXEL_PALETTE, 1);
  const FEMALE_PROTAG_F_SHOCK0 = decodeHiBitFrame(FEMALE_PROTAG_IDLE_ROWS[0], FEMALE_PROTAG_PIXEL_PALETTE, (x, put) => {
    put(26, 20, '#f3f3f4');
    put(35, 20, '#f3f3f4');
    put(26, 23, '#f3f3f4');
    put(35, 23, '#f3f3f4');
    drawFemaleProtagMouth(put, 2, 24);
  });

  const ORDEM_F_SIL0 = buildHiBitOrdem('sil0');
  const ORDEM_F_SIL1 = buildHiBitOrdem('sil1');
  const ORDEM_F_SIL2 = buildHiBitOrdem('sil2');
  const ORDEM_F_IDLE0 = buildHiBitOrdem('idle0');
  const ORDEM_F_IDLE1 = buildHiBitOrdem('idle1');
  const ORDEM_F_IDLE2 = buildHiBitOrdem('idle2');
  const ORDEM_WALK_FRAMES = ORDEM_WALK_ROWS.map(rows => decodeHiBitFrame(rows, ORDEM_WALK_PALETTE));
  const ORDEM_F_TALK1 = buildHiBitOrdem('talk1');
  const ORDEM_F_TALK2 = buildHiBitOrdem('talk2');
  const ORDEM_F_SING1 = buildHiBitOrdem('sing1');
  const ORDEM_F_SING2 = buildHiBitOrdem('sing2');
  const ORDEM_F_CELEB0 = buildHiBitOrdem('celeb0');

  const PROTAGONIST_MALE_ACTOR = {
    idle: [PROTAG_F_IDLE0, PROTAG_F_IDLE1, PROTAG_F_IDLE2_BLINK, PROTAG_F_IDLE3],
    walk: PROTAG_WALK_FRAMES,
    talk: [PROTAG_F_IDLE0, PROTAG_F_TALK1, PROTAG_F_TALK2, PROTAG_F_TALK1],
    celebrate: [PROTAG_F_IDLE0, PROTAG_F_CELEB1, PROTAG_F_CELEB2, PROTAG_F_CELEB1],
    fall: PROTAG_FALL_FRAMES,
    recover_stand: [PROTAG_F_FALLEN, PROTAG_F_FALLEN, PROTAG_F_LAND29, PROTAG_F_IDLE0],
    shock: [PROTAG_F_SHOCK0, PROTAG_F_IDLE1]
  };

  const PROTAGONIST_FEMALE_ACTOR = {
    idle: [FEMALE_PROTAG_F_IDLE0, FEMALE_PROTAG_F_IDLE1, FEMALE_PROTAG_F_IDLE2_BLINK, FEMALE_PROTAG_F_IDLE3],
    walk: FEMALE_PROTAG_WALK_FRAMES,
    talk: [FEMALE_PROTAG_F_IDLE0, FEMALE_PROTAG_F_TALK1, FEMALE_PROTAG_F_TALK2, FEMALE_PROTAG_F_TALK1],
    celebrate: [FEMALE_PROTAG_F_IDLE0, FEMALE_PROTAG_F_CELEB1, FEMALE_PROTAG_F_CELEB2, FEMALE_PROTAG_F_CELEB1],
    fall: FEMALE_PROTAG_FALL_FRAMES,
    recover_stand: [FEMALE_PROTAG_F_FALLEN, FEMALE_PROTAG_F_FALLEN, FEMALE_PROTAG_F_LAND29, FEMALE_PROTAG_F_IDLE0],
    shock: [FEMALE_PROTAG_F_SHOCK0, FEMALE_PROTAG_F_IDLE1]
  };

  const PORTRAIT_PROTAG_MALE_SET = makePortraitSet(buildProtagonistPortrait);
  const PORTRAIT_PROTAG_FEMALE_SET = makePortraitSet(buildFemaleProtagonistPortrait);

  const playerProfile = { name: 'Protagonista', gender: 'male' };

  function getPlayerName() {
    return (playerProfile.name && playerProfile.name.trim()) ? playerProfile.name.trim() : 'Protagonista';
  }

  function resolvePlayerText(str) {
    const s = String(str ?? '');
    const pName = getPlayerName();
    return pName === 'Protagonista' ? s : s.replace(/Protagonista/g, pName);
  }

  const SpriteBank = {
    protagonist_male: PROTAGONIST_MALE_ACTOR,
    protagonist_female: PROTAGONIST_FEMALE_ACTOR,
    protagonist: PROTAGONIST_MALE_ACTOR,
    ordem: {
      back_silhouette: [ORDEM_F_SIL0, ORDEM_F_SIL1, ORDEM_F_SIL2, ORDEM_F_SIL1],
      idle: [ORDEM_F_IDLE0, ORDEM_F_IDLE1, ORDEM_F_IDLE2, ORDEM_F_IDLE1],
      walk: ORDEM_WALK_FRAMES,
      talk: [ORDEM_F_IDLE0, ORDEM_F_TALK1, ORDEM_F_TALK2, ORDEM_F_TALK1],
      sing: [ORDEM_F_IDLE0, ORDEM_F_SING1, ORDEM_F_SING2, ORDEM_F_SING1],
      celebrate: [ORDEM_F_CELEB0, ORDEM_F_IDLE0, ORDEM_F_CELEB0, ORDEM_F_IDLE1]
    },
    araci: makeGuardianActor(GUARDIAN_SPRITE_SPECS.araci),
    irece: makeGuardianActor(GUARDIAN_SPRITE_SPECS.irece),
    jurema: makeGuardianActor(GUARDIAN_SPRITE_SPECS.jurema),
    stoneNeonAnimals: {
      cyan: makeStoneNeonAnimal('#67e8f9', '#0891b2', '#f472b6'),
      magenta: makeStoneNeonAnimal('#f472b6', '#be185d', '#fda4af'),
      gold: makeStoneNeonAnimal('#fde047', '#ca8a04', '#f87171')
    },
    portraits: {
      portrait_protagonist_male: PORTRAIT_PROTAG_MALE_SET,
      portrait_protagonist_female: PORTRAIT_PROTAG_FEMALE_SET,
      portrait_protagonist: PORTRAIT_PROTAG_MALE_SET,
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
      portrait_araci: makePortraitSet((m, b) => buildGuardianPortrait(GUARDIAN_SPRITE_SPECS.araci, m, b)),
      portrait_irece: makePortraitSet((m, b) => buildGuardianPortrait(GUARDIAN_SPRITE_SPECS.irece, m, b)),
      portrait_jurema: makePortraitSet((m, b) => buildGuardianPortrait(GUARDIAN_SPRITE_SPECS.jurema, m, b))
    },
    notes: [NOTE_SINGLE, NOTE_DOUBLE]
  };

  // ============================================================================
  // INSTANCIADOR DE ATORES E EFEITOS EM LOOP (ActorAnimator)
  // Renderiza sprites Hi-Bit (640x360) com precisão 1:1 de pixel físico.
  // ============================================================================
  const SPEAKER_TO_ACTOR = {
    protagonista: 'protagonist',
    ordem: 'ordem',
    'rainha da ordem': 'ordem',
    araci: 'araci',
    'araci (floresta)': 'araci',
    'irecê': 'irece',
    irece: 'irece',
    'irecê (rio)': 'irece',
    'irece (rio)': 'irece',
    jurema: 'jurema',
    'jurema (caatinga)': 'jurema'
  };

  function setPlayerProfile({ name, gender } = {}) {
    if (typeof name === 'string' && name.trim()) {
      playerProfile.name = name.trim();
    } else if (name === 'Protagonista' || name === '') {
      playerProfile.name = 'Protagonista';
    }
    if (gender === 'female' || gender === 'menina') {
      playerProfile.gender = 'female';
      SpriteBank.protagonist = SpriteBank.protagonist_female;
      SpriteBank.portraits.portrait_protagonist = SpriteBank.portraits.portrait_protagonist_female;
    } else if (gender === 'male' || gender === 'menino') {
      playerProfile.gender = 'male';
      SpriteBank.protagonist = SpriteBank.protagonist_male;
      SpriteBank.portraits.portrait_protagonist = SpriteBank.portraits.portrait_protagonist_male;
    }
    return { ...playerProfile };
  }

  function isActorDialogueSpeaking(actorKey) {
    if (typeof DialogueBox === 'undefined' || !DialogueBox.isOpen) return false;
    const cur = DialogueBox.queue[DialogueBox.currentIndex];
    if (!cur) return false;
    if (Math.floor(DialogueBox.charProgress) >= (cur.text || '').length) return false;
    const pRef = cur.portrait !== undefined ? cur.portrait : (cur.sprite !== undefined ? cur.sprite : cur.image);
    if (pRef === 'portrait_mystery_silhouette') return false;
    if (pRef === `portrait_${actorKey}`) return true;
    if (typeof pRef === 'string' && pRef.startsWith('portrait_')) return false;
    const sp = String(cur.speaker || '').trim().toLowerCase();
    if (actorKey === 'protagonist' && (cur._isProtagonist || sp === getPlayerName().toLowerCase())) return true;
    return SPEAKER_TO_ACTOR[sp] === actorKey;
  }

  const RH = (v) => Math.round(v * 2) * 0.5;
  const ActorAnimator = {
    /**
     * Desenha um ator do SpriteBank no estado desejado (em loop a 12 FPS),
     * sincronizando automaticamente a animação de fala quando a DialogueBox está ativa.
     */
    drawActor(ctx, actorKey, stateKey, x, y, t, opts = {}) {
      const effectiveKey = actorKey || 'protagonist';
      const actor = SpriteBank[effectiveKey] || SpriteBank.protagonist;
      const isDialogueTalking = stateKey === 'idle' && isActorDialogueSpeaking(effectiveKey);
      const frames = isDialogueTalking
        ? (actor.talk || actor.sing || actor.idle)
        : (actor[stateKey] || actor.idle);
      const f12 = Math.floor(t * (isDialogueTalking ? 10 : SPRITE_FPS));
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
    },

    getCrystalIdleAnim(piece, t = 0) {
      const key = String(piece?.id || `${R(piece?.x || 0)}_${R(piece?.y || 0)}_${piece?.type || ''}`);
      let hash = 0;
      for (let i = 0; i < key.length; i++) {
        hash = ((hash * 31 + key.charCodeAt(i)) | 0) & 0x7fffffff;
      }
      const phase = (hash % 628) / 100;
      if (GameHUD.reducedMotion || piece?.dragging) {
        return { bobY: 0, phase, pulse: 0.5, sparkleActive: false, sparkleCorner: 1 };
      }
      const bobY = RH(Math.sin(t * 2.8 + phase) * 1.5);
      const pulse = 0.5 + 0.5 * Math.sin(t * 3.8 + phase * 1.3);
      const sparkleActive = pulse > 0.82;
      const sparkleCorner = ((Math.floor(t * 4 + phase) & 1) === 0) ? -1 : 1;
      return { bobY, phase, pulse, sparkleActive, sparkleCorner };
    },

    drawShadowCrystalAura(ctx, x, y, t, phase = 0, baseRadius = 11.5) {
      if (!ctx) return;
      const cx = R(x), cy = R(y);
      const reduced = Boolean(GameHUD.reducedMotion);
      const spin = reduced ? 0 : t;
      const f12 = Math.floor(spin * SPRITE_FPS);

      // Halo ondulante sombrio externo em roxo abissal
      for (let a = 0; a < 28; a++) {
        const ang = (a / 28) * Math.PI * 2;
        const wave = reduced ? 0 : Math.sin(ang * 5 - spin * 6.5 + phase) * 1.2;
        const rr = baseRadius + 1.5 + wave;
        const px = R(cx + Math.cos(ang) * rr);
        const py = R(cy + Math.sin(ang) * rr);
        P1(ctx, px, py, (a & 1) ? '#3b0764' : '#1e0529');
        if (!reduced && (a % 3) === 0) {
          P1(ctx, R(cx + Math.cos(ang) * (rr + 1.2)), R(cy + Math.sin(ang) * (rr + 1.2)), '#581c87');
        }
      }

      // Anel energético maligno pulsante
      const ringR = R(baseRadius + (reduced ? 0 : Math.sin(spin * 5 + phase) * 0.8));
      drawRing(ctx, cx, cy, ringR, (f12 & 1) ? '#9333ea' : '#6b21a8');

      // 5 partículas/chamas sombrias orbitais girando ao redor do cristal
      for (let k = 0; k < 5; k++) {
        const ang = (k / 5) * Math.PI * 2 - spin * 2.6 + phase;
        const orbitR = baseRadius + 2.5 + (reduced ? 0 : Math.sin(spin * 4 + k * 1.3) * 0.9);
        const ox = R(cx + Math.cos(ang) * orbitR);
        const oy = R(cy + Math.sin(ang) * orbitR);
        P1(ctx, ox - 1, oy, '#2e0947');
        P1(ctx, ox + 1, oy, '#2e0947');
        P1(ctx, ox, oy + 1, '#2e0947');
        P1(ctx, ox, oy, '#7e22ce');
        P1(ctx, ox, oy - 1, '#c084fc');
      }
    },

    computeEquationMagneticState(m, phaseTime = 0) {
      if (!m) {
        return {
          pureX: 0, pureY: 0, shadowX: 0, shadowY: 0,
          isImpactShock: false, impactProgress: 0, flashRadius: 0, shockwaveRadius: 0,
          squashScaleX: 1, squashScaleY: 1, shakeX: 0, shakeY: 0
        };
      }
      const impactTime = 0.50;
      const totalTime = 0.78;
      if (phaseTime < impactTime) {
        const u = clamp(phaseTime / impactTime, 0, 1);
        const curve = u < 0.18
          ? -Math.sin((u / 0.18) * Math.PI) * 0.08
          : Math.pow((u - 0.18) / 0.82, 2.2);
        const arcY = GameHUD.reducedMotion ? 0 : Math.sin(u * Math.PI) * -4;
        return {
          pureX: R(m.pStartX + (m.midX - 6 - m.pStartX) * curve),
          pureY: R(m.pStartY + (m.midY - m.pStartY) * u + arcY),
          shadowX: R(m.sStartX + (m.midX + 6 - m.sStartX) * curve),
          shadowY: R(m.sStartY + (m.midY - m.sStartY) * u - arcY),
          isImpactShock: false,
          impactProgress: 0,
          flashRadius: 0,
          shockwaveRadius: 0,
          squashScaleX: 1,
          squashScaleY: 1,
          shakeX: 0,
          shakeY: 0
        };
      }

      const impactProgress = clamp((phaseTime - impactTime) / (totalTime - impactTime), 0, 1);
      const vib = GameHUD.reducedMotion ? 0 : Math.sin(impactProgress * Math.PI * 6) * (1 - impactProgress) * 1.5;
      const J = [[-2, 1], [2, -1], [-1, -2], [2, 2], [-2, 0], [1, -1]];
      const [jx, jy] = J[Math.floor(impactProgress * 12) % J.length];
      const damp = GameHUD.reducedMotion ? 0 : (1 - impactProgress * 0.6);
      return {
        pureX: R(m.midX - 3 + vib),
        pureY: R(m.midY),
        shadowX: R(m.midX + 3 - vib),
        shadowY: R(m.midY),
        isImpactShock: true,
        impactProgress,
        flashRadius: R(4 + impactProgress * 28),
        shockwaveRadius: R(6 + easeInOut(impactProgress) * 44),
        squashScaleX: 1 + Math.sin(impactProgress * Math.PI * 3) * 0.18,
        squashScaleY: 1 - Math.sin(impactProgress * Math.PI * 3) * 0.14,
        shakeX: R(jx * damp),
        shakeY: R(jy * damp)
      };
    },

    drawEquationMagneticShock(ctx, pureEq, shadowEq, m, phaseTime, t = 0) {
      if (!ctx || !m) return;
      const st = this.computeEquationMagneticState(m, phaseTime);
      const f16 = Math.floor(t * 16);

      if (!st.isImpactShock && pureEq && shadowEq) {
        const x1 = R(pureEq.x), y1 = R(pureEq.y);
        const x2 = R(shadowEq.x), y2 = R(shadowEq.y);
        const dist = Math.max(1, Math.hypot(x2 - x1, y2 - y1));
        const steps = Math.max(8, Math.ceil(dist / 2));
        for (let i = 0; i <= steps; i++) {
          const u = i / steps;
          const env = Math.sin(u * Math.PI);
          const bx = x1 + (x2 - x1) * u;
          const by = y1 + (y2 - y1) * u;
          const off1 = Math.sin(u * Math.PI * 4 - t * 24) * env * 4.5;
          const off2 = Math.cos(u * Math.PI * 4 + t * 24) * env * 4.5;
          P1(ctx, R(bx), R(by + off1), ((i + f16) & 1) ? '#9ef0ff' : '#fff6cc');
          P1(ctx, R(bx), R(by + off2), ((i + f16) & 1) ? '#d8b4fe' : '#9333ea');
        }
        const convR = Math.max(3, R((phaseTime / 0.50) * 10));
        drawRing(ctx, R(m.midX), R(m.midY), convR, (f16 & 1) ? '#ffffff' : '#9ef0ff');
        return;
      }

      if (st.isImpactShock) {
        const cx = R(m.midX), cy = R(m.midY);
        const coreR = Math.max(2, R((1 - st.impactProgress * 0.4) * 10));
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - coreR, cy - 2, coreR * 2, 4);
        ctx.fillRect(cx - 2, cy - coreR, 4, coreR * 2);
        drawRing(ctx, cx, cy, st.flashRadius > 0 ? Math.min(18, R(st.flashRadius * 0.45)) : 4, '#fff6cc');
        drawRing(ctx, cx, cy, st.shockwaveRadius, '#ffffff');
        drawRing(ctx, cx, cy, Math.max(2, R(st.shockwaveRadius * 0.65)), '#9ef0ff');
        drawRing(ctx, cx, cy, Math.max(1, R(st.shockwaveRadius * 0.4)), '#c084fc');

        // 8 raios elétricos radiais ramificados
        const rayLen = st.shockwaveRadius + 6;
        for (let k = 0; k < 8; k++) {
          const ang = (k / 8) * Math.PI * 2 + (st.impactProgress * 0.6);
          const col = (k & 1) ? '#9ef0ff' : '#d8b4fe';
          for (let s = 3; s <= rayLen; s += 2) {
            const zig = ((s + k + f16) & 1) ? 1.5 : -1.5;
            const px = R(cx + Math.cos(ang) * s - Math.sin(ang) * zig);
            const py = R(cy + Math.sin(ang) * s + Math.cos(ang) * zig);
            P1(ctx, px, py, s > rayLen - 5 ? '#ffffff' : col);
          }
        }
        drawStar(ctx, cx, cy, 4, '#ffffff', '#fff6cc');
      }
    },

    drawEquationShockwave(ctx, shock, t = 0) {
      if (!ctx || !shock || shock.elapsed >= shock.duration) return;
      const p = clamp(shock.elapsed / Math.max(0.01, shock.duration), 0, 1);
      const cx = R(shock.x), cy = R(shock.y);
      const outerR = R(18 + easeInOut(p) * 42);
      const innerR = R(10 + easeInOut(p) * 28);
      if (p < 0.75) {
        drawRing(ctx, cx, cy, outerR, p < 0.35 ? '#ffffff' : '#9ef0ff');
      }
      if (p < 0.55) {
        drawRing(ctx, cx, cy, innerR, '#d8b4fe');
      }
      const sparks = 8;
      for (let k = 0; k < sparks; k++) {
        const ang = (k / sparks) * Math.PI * 2 + p * 1.4;
        const sx = R(cx + Math.cos(ang) * (outerR + 2));
        const sy = R(cy + Math.sin(ang) * (outerR + 2));
        if (p < 0.85) {
          drawStar(ctx, sx, sy, p < 0.3 ? 2 : 1, '#ffffff', (k & 1) ? '#9ef0ff' : '#c084fc');
        }
      }
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
    _lastSpokenCharIndex: -1,
    _voiceCooldown: 0,
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
      if (typeof GameHUD !== 'undefined' && typeof GameHUD.syncAbilitiesState === 'function') {
        GameHUD.syncAbilitiesState(false);
      }
    },

    open(lines, onComplete = null) {
      const rawList = Array.isArray(lines) ? lines : [lines];
      this.queue = rawList.map((item) => {
        if (!item || typeof item !== 'object') return item;
        const rawSpeaker = item.speaker;
        const isProtagSpeaker = rawSpeaker === 'Protagonista' || rawSpeaker === getPlayerName();
        const isProtagPortrait = item.portrait === 'portrait_protagonist';
        return {
          ...item,
          _isProtagonist: Boolean(item._isProtagonist || isProtagSpeaker || isProtagPortrait),
          speaker: rawSpeaker !== undefined ? resolvePlayerText(rawSpeaker) : undefined,
          text: item.text !== undefined ? resolvePlayerText(item.text) : ''
        };
      });
      this.currentIndex = 0;
      this.charProgress = 0;
      this._lastSpokenCharIndex = -1;
      this._voiceCooldown = 0;
      this.isOpen = this.queue.length > 0;
      this.onComplete = onComplete;
    },

    close() {
      this.isOpen = false;
      this.queue = [];
      this.currentIndex = 0;
      this.charProgress = 0;
      this._lastSpokenCharIndex = -1;
      this._voiceCooldown = 0;
      this.onComplete = null;
    },

    advance() {
      if (!this.isOpen) return false;
      const cur = this.queue[this.currentIndex];
      if (!cur) return false;
      const fullLen = (cur.text || '').length;
      if (this.charProgress < fullLen) {
        this.charProgress = fullLen;
        this._lastSpokenCharIndex = fullLen - 1;
        return true;
      }
      this.currentIndex++;
      this.charProgress = 0;
      this._lastSpokenCharIndex = -1;
      this._voiceCooldown = 0;
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
      this._voiceCooldown = Math.max(0, (this._voiceCooldown || 0) - dt);
      const cur = this.queue[this.currentIndex];
      if (!cur) return;
      const fullText = resolvePlayerText(cur.text || '');
      const fullLen = fullText.length;
      if (this.charProgress < fullLen) {
        this.charProgress = Math.min(fullLen, this.charProgress + dt * this.charsPerSec);
        const curCharIdx = Math.floor(this.charProgress) - 1;
        if (curCharIdx >= 0 && curCharIdx > this._lastSpokenCharIndex && this._voiceCooldown <= 0) {
          const ch = fullText[curCharIdx] || '';
          if (ch && !/[\s.,!?;:…—\-()"']/.test(ch)) {
            const voiceTarget = cur._isProtagonist
              ? (playerProfile.gender === 'female' ? 'protagonist_female' : 'protagonist_male')
              : (cur.portrait || cur.speaker || 'protagonist_male');
            if (!GameHUD.muted && GameHUD.sfxVol > 0) {
              global.CrystalAudio?.playVoiceBlip?.(voiceTarget, ch, curCharIdx);
            }
            this._lastSpokenCharIndex = curCharIdx;
            this._voiceCooldown = 0.045;
          } else if (ch) {
            this._lastSpokenCharIndex = curCharIdx;
          }
        }
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
      const fullText = resolvePlayerText(cur.text || '');
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
          : (Boolean(cur._isProtagonist) || portraitRef === 'portrait_protagonist' || cur.speaker === 'Protagonista' || cur.speaker === getPlayerName());
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
      const speaker = resolvePlayerText(cur.speaker || getPlayerName());
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
        diamond(dInner - 0.5);
        ctx.clip();
      }
      ActorAnimator.drawPortrait(ctx, portraitKey, isTalking, cx, cy, t, {
        center: true,
        diamondRadius: dInner,
        flipX: Boolean(flipX),
        resolvedFrame: frame
      });
      if (typeof ctx.restore === 'function') ctx.restore();

      const strokeDiamond = (d, col) => {
        ctx.fillStyle = col;
        for (let dy = -d; dy <= d; dy++) {
          const half = d - Math.abs(dy);
          ctx.fillRect(R(cx - half), R(cy + dy), 1, 1);
          if (half > 0) ctx.fillRect(R(cx + half), R(cy + dy), 1, 1);
        }
      };
      strokeDiamond(D - 2, '#2c221e');
      strokeDiamond(D - 1, '#5c4938');
      strokeDiamond(D, '#5c4938');
      strokeDiamond(D + 1, '#d9bf86');
      strokeDiamond(D + 2, '#2c221e');
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

  const GHOST_CRYSTAL_MAP = {
    pure:    { spr: SPR_PURE,    orb: '#a8d8e6', rim: '#294c66' },
    white:   { spr: SPR_PURE,    orb: '#a8d8e6', rim: '#294c66' },
    shadow:  { spr: SPR_SHADOW,  orb: '#b8a6d9', rim: '#1a122b' },
    dark:    { spr: SPR_SHADOW,  orb: '#b8a6d9', rim: '#1a122b' },
    opal:    { spr: SPR_OPAL,    orb: '#f7c97e', rim: '#541812' },
    rose:    { spr: SPR_ROSE,    orb: '#fff2f5', rim: '#59223b' },
    pink:    { spr: SPR_ROSE,    orb: '#fff2f5', rim: '#59223b' },
    emerald: { spr: SPR_EMERALD, orb: '#8ed46a', rim: '#193d20' },
    citrine: { spr: SPR_CITRINE, orb: '#f7dc7e', rim: '#52300a' },
    aqua:    { spr: SPR_AQUA,    orb: '#a8f0f0', rim: '#123b45' }
  };

  const SPR_GHOST_HAND_OPEN = fromMap([
    '..oo.......',
    '.oWLo......',
    '.oLMo.oo...',
    '.oLMooLLo..',
    '..oLLLMMo..',
    'ooLLLLMMDo.',
    'oWLLLMMMMo.',
    'oLLLMMMMDo.',
    '.oLLMMMMDo.',
    '..oMMMMDo..',
    '...oMDDo...',
    '....ooo....'
  ], { o: '#3b0764', W: '#ffffff', L: '#f3e8ff', M: '#c084fc', D: '#a855f7' });

  const SPR_GHOST_HAND_PRESS = fromMap([
    '...........',
    '..oo.......',
    '.oWLo.oo...',
    '.oLMooLLo..',
    '.oLLLMMMo..',
    '.oWLLLMMDo.',
    '.oLLLMMMMo.',
    '..oLLMMMDo.',
    '...oMMMDo..',
    '...oMMDo...',
    '....ooo....',
    '...........'
  ], { o: '#3b0764', W: '#ffffff', L: '#f3e8ff', M: '#c084fc', D: '#a855f7' });

  /** Renderiza a dica visual translúcida da Mão Fantasma (Visão do Próximo Passo). */
  function drawGhostHandHint(ctx, anim, t = 0) {
    if (!ctx || !anim) return;
    const dur = Math.max(0.2, anim.duration || (anim.kind === 'tap' ? 1.8 : 2.2));
    const p = clamp((anim.t || 0) / dur, 0, 1);
    if (p >= 1) return;

    const fadeIn = p < 0.14 ? p / 0.14 : 1;
    const fadeOut = p > 0.84 ? (1 - p) / 0.16 : 1;
    const masterAlpha = clamp(fadeIn * fadeOut * 0.78, 0.05, 0.78);

    const fromX = anim.fromX ?? 160;
    const fromY = anim.fromY ?? 100;
    const toX = anim.toX ?? fromX;
    const toY = anim.toY ?? fromY;

    ctx.save();
    try {
      if (anim.kind === 'tap') {
        const tap1 = p >= 0.24 && p <= 0.44;
        const tap2 = p >= 0.54 && p <= 0.74;
        const pressing = tap1 || tap2;
        const bob = pressing ? 1 : Math.round(Math.sin(t * 7) * 1.5);

        ctx.globalAlpha = masterAlpha * 0.72;
        const pulseR = 9 + Math.round(((p * 3) % 1) * 9);
        drawRing(ctx, R(fromX), R(fromY), pulseR, '#e040fb');
        if (pressing) {
          drawRing(ctx, R(fromX), R(fromY), 6, '#f3e8ff');
          drawStar(ctx, R(fromX + 9), R(fromY - 8), 2, '#ffffff', '#e040fb');
        }

        ctx.globalAlpha = masterAlpha * 0.92;
        const handSpr = pressing ? SPR_GHOST_HAND_PRESS : SPR_GHOST_HAND_OPEN;
        ctx.drawImage(handSpr, R(fromX - 2), R(fromY - 1 + bob));
      } else {
        // Animação de arrasto fantasma: aproximar -> segurar -> arco até destino -> soltar
        const dots = 9;
        ctx.globalAlpha = masterAlpha * 0.65;
        for (let i = 1; i < dots; i++) {
          const u = i / dots;
          const arcY = -Math.sin(u * Math.PI) * 14;
          const dx = R(fromX + (toX - fromX) * u);
          const dy = R(fromY + (toY - fromY) * u + arcY);
          ctx.fillStyle = (i % 2 === 0) ? '#f3e8ff' : '#c084fc';
          ctx.fillRect(dx, dy, 1, 1);
        }

        const targetPulse = 8 + Math.round(Math.sin(t * 8) * 1.5);
        drawRing(ctx, R(toX), R(toY), targetPulse, '#e040fb');

        let cx = fromX, cy = fromY;
        let hx = fromX, hy = fromY;
        let pressing = false;
        let showGhostCrystal = false;

        if (p < 0.22) {
          const u = easeInOut(p / 0.22);
          hx = fromX + (1 - u) * 10;
          hy = fromY + (1 - u) * 10;
        } else if (p < 0.34) {
          pressing = true;
          showGhostCrystal = true;
          ctx.globalAlpha = masterAlpha * 0.8;
          drawRing(ctx, R(fromX), R(fromY), 9, '#f3e8ff');
        } else if (p < 0.82) {
          pressing = true;
          showGhostCrystal = true;
          const u = easeInOut((p - 0.34) / 0.48);
          const arcY = -Math.sin(u * Math.PI) * 14;
          cx = fromX + (toX - fromX) * u;
          cy = fromY + (toY - fromY) * u + arcY;
          hx = cx;
          hy = cy;
        } else {
          showGhostCrystal = true;
          cx = toX;
          cy = toY;
          hx = toX + 3;
          hy = toY + 3;
          ctx.globalAlpha = masterAlpha * 0.85;
          drawRing(ctx, R(toX), R(toY), 11, '#fbbf24');
          drawStar(ctx, R(toX + 8), R(toY - 8), 3, '#ffffff', '#e040fb');
        }

        if (showGhostCrystal && anim.pieceType) {
          const style = GHOST_CRYSTAL_MAP[anim.pieceType] || GHOST_CRYSTAL_MAP.pure;
          ctx.globalAlpha = masterAlpha * 0.72;
          ctx.drawImage(style.spr, R(cx - 6), R(cy - 7));
          const valCount = clamp(Math.abs(Math.round(anim.pieceValue || 1)), 1, 6);
          const spacing = valCount > 3 ? 4 : 5;
          const startOx = -((valCount - 1) * spacing) / 2;
          for (let i = 0; i < valCount; i++) {
            drawMiniOrb(ctx, R(cx + startOx + i * spacing), R(cy - 10), style.orb, style.rim);
          }
        }

        ctx.globalAlpha = masterAlpha * 0.92;
        const handSpr = pressing ? SPR_GHOST_HAND_PRESS : SPR_GHOST_HAND_OPEN;
        ctx.drawImage(handSpr, R(hx - 2), R(hy - 1));
      }

      if (anim.label) {
        const textW = measurePixelText(anim.label, 9);
        const pillW = Math.min(200, Math.max(48, textW + 14));
        const midX = R(clamp((fromX + toX) * 0.5, pillW * 0.5 + 8, W - pillW * 0.5 - 8));
        const topCandidate = Math.min(fromY, toY) - 24;
        const rawY = topCandidate >= 42 ? topCandidate : Math.max(fromY, toY) + 15;
        const pillY = R(clamp(rawY, 42, H - 20));
        const px = R(midX - pillW / 2);

        ctx.globalAlpha = masterAlpha * 0.88;
        ctx.fillStyle = '#1e1133';
        ctx.fillRect(px, pillY, pillW, 13);
        ctx.fillStyle = '#c084fc';
        ctx.fillRect(px, pillY, pillW, 1);
        ctx.fillRect(px, pillY + 12, pillW, 1);
        ctx.fillRect(px, pillY, 1, 13);
        ctx.fillRect(px + pillW - 1, pillY, 1, 13);
        drawPixelTextCentered(ctx, anim.label, midX, pillY + 3, '#f3e8ff', '#1e1133', pillW - 6, 9);
      }
    } finally {
      ctx.restore();
    }
  }

  const TutorialModal = {
    isOpen: false,
    cards: [],
    currentIndex: 0,
    seenKeys: new Set(),
    onFinish: null,
    onDone: null,
    btnRect: { x: 194, y: 140, w: 78, h: 15 },
    pageElapsed: 0,
    pageDuration: 3.5,
    lastRenderTime: null,
    practiceState: null,

    initPracticeState() {
      const pr = { x: 34, y: 38, w: 252, h: 66 };
      this.practiceState = {
        practiceRect: pr,
        resetBtnRect: { x: pr.x + 4, y: pr.y + 4, w: 48, h: 12 },
        eq: { x: 204, y: pr.y + 34, expanded: false },
        pieces: [
          { id: 'p1', type: 'rose', value: 2, x: 76, y: pr.y + 30, inEq: false },
          { id: 'p2', type: 'white', value: 1, x: 112, y: pr.y + 42, inEq: false },
          { id: 'p3', type: 'rose', value: 1, x: 204, y: pr.y + 34, inEq: true }
        ],
        dragPiece: null,
        eqTapStart: null,
        statusText: 'Arraste um cristal para a Equação ou toque nela!'
      };
      this.layoutPracticeEquation();
    },

    layoutPracticeEquation() {
      const ps = this.practiceState;
      if (!ps || !ps.eq) return;
      const inList = ps.pieces.filter(p => p.inEq);
      if (!inList.length) return;
      const eq = ps.eq;
      const step = eq.expanded ? 18 : 11;
      const startX = eq.x - ((inList.length - 1) * step) / 2;
      inList.forEach((p, idx) => {
        if (ps.dragPiece !== p) {
          p.x = R(startX + idx * step);
          p.y = R(eq.y);
        }
      });
    },

    handlePracticePointerDown(lx, ly) {
      const ps = this.practiceState;
      if (!ps) return false;
      const rb = ps.resetBtnRect;
      if (lx >= rb.x && lx <= rb.x + rb.w && ly >= rb.y && ly <= rb.y + rb.h) {
        GameHUD.playSfx('click');
        this.initPracticeState();
        return true;
      }
      for (let i = ps.pieces.length - 1; i >= 0; i--) {
        const p = ps.pieces[i];
        if (p.inEq && !ps.eq.expanded) continue;
        if (Math.hypot(lx - p.x, ly - p.y) <= 13) {
          ps.dragPiece = p;
          GameHUD.playSfx(p.type === 'rose' ? 'roseGrab' : 'quartzGrab');
          return true;
        }
      }
      const rad = ps.eq.expanded ? 34 : 20;
      if (Math.hypot(lx - ps.eq.x, ly - ps.eq.y) <= rad) {
        ps.eqTapStart = { x: lx, y: ly, origX: ps.eq.x, origY: ps.eq.y, moved: false };
        return true;
      }
      return true;
    },

    handlePointerMove(lx, ly) {
      const ps = this.practiceState;
      if (!this.isOpen || !ps) return false;
      const pr = ps.practiceRect;
      if (ps.dragPiece) {
        ps.dragPiece.x = clamp(lx, pr.x + 12, pr.x + pr.w - 12);
        ps.dragPiece.y = clamp(ly, pr.y + 18, pr.y + pr.h - 10);
        return true;
      }
      if (ps.eqTapStart) {
        if (Math.hypot(lx - ps.eqTapStart.x, ly - ps.eqTapStart.y) >= 4) {
          ps.eqTapStart.moved = true;
          ps.eq.x = clamp(ps.eqTapStart.origX + (lx - ps.eqTapStart.x), pr.x + 64, pr.x + pr.w - 28);
          ps.eq.y = clamp(ps.eqTapStart.origY + (ly - ps.eqTapStart.y), pr.y + 24, pr.y + pr.h - 18);
          this.layoutPracticeEquation();
        }
        return true;
      }
      return false;
    },

    handlePointerUp(lx, ly) {
      const ps = this.practiceState;
      if (!this.isOpen || !ps) return false;
      if (ps.eqTapStart) {
        const wasTap = !ps.eqTapStart.moved;
        ps.eqTapStart = null;
        if (wasTap) {
          ps.eq.expanded = !ps.eq.expanded;
          GameHUD.playSfx(ps.eq.expanded ? 'equationExpand' : 'equationCollapse');
          this.layoutPracticeEquation();
          ps.statusText = ps.eq.expanded
            ? 'Expandida! Arraste p/ organizar ou remover!'
            : 'Fechada! Toque para expandir novamente.';
        } else {
          GameHUD.playSfx('quartzDrop');
        }
        return true;
      }
      if (ps.dragPiece) {
        const p = ps.dragPiece;
        ps.dragPiece = null;
        const dropRad = ps.eq.expanded ? 34 : 22;
        const overEq = Math.hypot(p.x - ps.eq.x, p.y - ps.eq.y) <= dropRad;
        if (overEq && !p.inEq) {
          p.inEq = true;
          GameHUD.playSfx('equationExpand');
          ps.statusText = 'Cristal adicionado! Toque na Equação p/ expandir!';
        } else if (!overEq && p.inEq) {
          p.inEq = false;
          GameHUD.playSfx('quartzDrop');
          ps.statusText = 'Cristal removido da Equação!';
        } else if (overEq && p.inEq) {
          ps.pieces.sort((a, b) => a.x - b.x);
          GameHUD.playSfx('quartzDrop');
          ps.statusText = 'Ordem atualizada dentro da Equação!';
        } else {
          GameHUD.playSfx('quartzDrop');
        }
        this.layoutPracticeEquation();
        return true;
      }
      return false;
    },

    renderEquationPractice(ctx, vx, vy, vw, vh, t) {
      ctx.fillStyle = '#181c2b';
      ctx.fillRect(vx, vy, vw, vh);
      ctx.fillStyle = '#57688a';
      ctx.fillRect(vx, vy, vw, 1);
      ctx.fillRect(vx, vy + vh - 1, vw, 1);
      ctx.fillRect(vx, vy, 1, vh);
      ctx.fillRect(vx + vw - 1, vy, 1, vh);

      const ps = this.practiceState;
      if (!ps) return;
      ps.practiceRect = { x: vx, y: vy, w: vw, h: vh };
      ps.resetBtnRect = { x: vx + 4, y: vy + 4, w: 48, h: 12 };

      // Botão Limpar / Reiniciar Treino
      const rb = ps.resetBtnRect;
      ctx.fillStyle = '#14111c';
      ctx.fillRect(rb.x - 1, rb.y - 1, rb.w + 2, rb.h + 2);
      ctx.fillStyle = '#2b436e';
      ctx.fillRect(rb.x, rb.y, rb.w, rb.h);
      ctx.fillStyle = '#92e8ff';
      ctx.fillRect(rb.x, rb.y, rb.w, 1);
      drawPixelTextCentered(ctx, '↺ Reset', rb.x + rb.w / 2, rb.y + 2, '#ffffff', '#000000', rb.w - 4, 8);

      drawPixelText(ctx, ps.statusText, vx + 58, vy + 6, '#92e8ff', '#000000', vw - 64, 8);

      // Aura da Equação Prática
      const eq = ps.eq;
      const auraR = eq.expanded ? 30 : 18;
      drawRing(ctx, R(eq.x), R(eq.y), auraR, eq.expanded ? '#f472b6' : '#cfa3c4');
      if (eq.expanded) {
        drawRing(ctx, R(eq.x), R(eq.y), auraR + 2, 'rgba(244, 114, 182, 0.4)');
      }
      const eqTag = eq.expanded ? 'ABERTA (arraste)' : 'TOQUE P/ ABRIR';
      drawPixelTextCentered(ctx, eqTag, R(eq.x), R(eq.y + auraR - 1), eq.expanded ? '#4ade80' : '#fbbf24', '#000000', 110, 7);

      // Cristais do treino
      for (const p of ps.pieces) {
        const spr = p.type === 'rose' ? SPR_ROSE : SPR_PURE;
        const orbCol = p.type === 'rose' ? '#ff99cc' : '#a8d8e6';
        const rimCol = p.type === 'rose' ? '#59223b' : '#294c66';
        const px = R(p.x), py = R(p.y);
        ctx.drawImage(spr, px - 6, py - 7);
        for (let k = 0; k < p.value; k++) {
          const dx = (k - (p.value - 1) / 2) * 5;
          drawMiniOrb(ctx, R(px + dx), py - 11, orbCol, rimCol);
        }
      }
    },

    calculatePageDuration(card) {
      if (!card) return 3.0;
      const plainText = String(card.body || '')
        .replace(/\{[a-zA-Z0-9_#]+:([^}]+)\}/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1');
      const words = plainText.split(/\s+/).filter(Boolean).length;
      return Math.max(3.0, Math.min(5.0, 1.8 + words * 0.16));
    },

    isPageLocked() {
      if (GameHUD && GameHUD.godMode) return false;
      return this.pageElapsed < this.pageDuration;
    },

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
      this.onDone = onFinish;
      this.pageElapsed = 0;
      this.pageDuration = this.calculatePageDuration(list[0]);
      this.lastRenderTime = null;
      if (list[0].interactivePractice === 'equation_practice') {
        this.initPracticeState();
      } else {
        this.practiceState = null;
      }
      if (list[0].id) this.seenKeys.add(list[0].id);
      GameHUD.playSfx('tutorialOpen');
    },

    close() {
      this.isOpen = false;
      this.cards = [];
      this.currentIndex = 0;
      this.pageElapsed = 0;
      this.lastRenderTime = null;
      this.practiceState = null;
      this.onFinish = null;
      this.onDone = null;
    },

    nextStep() {
      if (!this.isOpen) return false;
      this.currentIndex++;
      if (this.currentIndex < this.cards.length) {
        const cur = this.cards[this.currentIndex];
        if (cur && cur.id) this.seenKeys.add(cur.id);
        this.pageElapsed = 0;
        this.pageDuration = this.calculatePageDuration(cur);
        this.lastRenderTime = null;
        if (cur && cur.interactivePractice === 'equation_practice') {
          this.initPracticeState();
        } else {
          this.practiceState = null;
        }
        GameHUD.playSfx('tutorialAdvance');
        return true;
      }
      this.isOpen = false;
      this.pageElapsed = 0;
      this.lastRenderTime = null;
      this.practiceState = null;
      GameHUD.playSfx('tutorialClose');
      const cb = this.onFinish || this.onDone;
      this.onFinish = null;
      this.onDone = null;
      if (typeof cb === 'function') cb();
      return true;
    },

    handleClick(lx, ly) {
      if (!this.isOpen) return false;
      const card = this.cards[this.currentIndex];
      if (card && card.interactivePractice === 'equation_practice' && this.practiceState) {
        const pr = this.practiceState.practiceRect;
        if (lx >= pr.x && lx <= pr.x + pr.w && ly >= pr.y && ly <= pr.y + pr.h) {
          return this.handlePracticePointerDown(lx, ly);
        }
      }
      const b = this.btnRect;
      const onBtn = (lx >= b.x - 8 && lx <= b.x + b.w + 8 && ly >= b.y - 6 && ly <= b.y + b.h + 6);
      const onCard = (lx >= 24 && lx <= 296 && ly >= 18 && ly <= 162);
      const allowCardTap = !(card && card.interactivePractice);
      if (onBtn || (allowCardTap && onCard)) {
        if (this.isPageLocked()) return false;
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
      } else if (type === 'leftover_crystals') {
        const sx = vx + vw - 44;
        const leftX = vx + 42;
        const px = phase < 0.55
          ? R(vx + 92 + easeInOut(phase / 0.55) * (sx - (vx + 92)))
          : sx;

        // Cristal que sobra em segurança à esquerda
        ctx.drawImage(SPR_PURE, leftX - 6, cy - 7);
        for (const dx of [-5, 0, 5]) drawMiniOrb(ctx, leftX + dx, cy - 11, '#a8d8e6', '#294c66');

        if (phase < 0.6) {
          ctx.drawImage(SPR_SHADOW, sx - 6, cy - 7);
          drawMiniOrb(ctx, sx - 3, cy - 11, '#b8a6d9', '#1a122b');
          drawMiniOrb(ctx, sx + 3, cy - 11, '#b8a6d9', '#1a122b');
          ctx.drawImage(SPR_PURE, px - 6, cy - 7);
          drawMiniOrb(ctx, px - 3, cy - 11, '#a8d8e6', '#294c66');
          drawMiniOrb(ctx, px + 3, cy - 11, '#a8d8e6', '#294c66');
        } else {
          drawRing(ctx, sx, cy, R((phase - 0.6) * 42), '#a8d8e6');
          drawStar(ctx, sx, cy, 4, '#ffffff', '#f2cc6b');
        }

        if (phase >= 0.52) {
          drawRing(ctx, leftX, cy, 13, '#4ade80');
          drawStar(ctx, leftX - 10, cy - 8, 2, '#ffffff', '#4ade80');
          drawPixelTextCentered(ctx, 'SOBROU = OK!', leftX + 26, cy - 4, '#4ade80', '#000000', 84, 8);
        }
      } else if (type === 'aura_equation_practice') {
        const expanded = phase > 0.35 && phase < 0.85;
        const r = expanded ? 16 : 11;
        drawRing(ctx, R(vx + vw / 2 + 18), cy, r, '#f472b6');
        ctx.drawImage(SPR_ROSE, R(vx + vw / 2 + 12), cy - 7);
        const px = phase < 0.35
          ? R(vx + 36 + easeInOut(phase / 0.35) * ((vx + vw / 2 - 4) - (vx + 36)))
          : R(vx + vw / 2 + 24);
        ctx.drawImage(SPR_PURE, px, cy - 7);
        drawPixelText(ctx, expanded ? 'ORGANIZAR!' : 'ARRASTE + TOQUE!', vx + 12, cy - 12, '#38bdf8', '#000000', 96, 8);
      } else if (type === 'river_fraction') {
        const mx = R(vx + vw / 2 + 8);
        const pfW = 74, pfH = Math.max(32, vh - 8);
        const pTop = R(vy + (vh - pfH) / 2);
        const barY = R(pTop + pfH / 2);
        const matched = phase >= 0.52;
        const glow = Math.sin(t * 8) * 0.5 + 0.5;

        // Plataforma de Fração ampliada (TOPO e BASE claramente separados)
        ctx.fillStyle = '#101724';
        ctx.fillRect(mx - pfW / 2 - 1, pTop - 1, pfW + 2, pfH + 2);
        ctx.fillStyle = matched ? '#24142a' : '#182436';
        ctx.fillRect(mx - pfW / 2, pTop, pfW, pfH);
        ctx.fillStyle = matched ? '#ff69b4' : '#57d1de';
        ctx.fillRect(mx - pfW / 2 + 4, barY - 1, pfW - 8, 2);

        // Rótulos TOPO e BASE na lateral esquerda da plataforma
        drawPixelText(ctx, 'TOPO', mx - pfW / 2 - 32, pTop + 4, '#38bdf8', '#000000', 32, 8);
        drawPixelText(ctx, 'BASE', mx - pfW / 2 - 32, barY + 5, '#fbbf24', '#000000', 32, 8);

        // Cristal no TOPO (valor 4)
        ctx.drawImage(SPR_AQUA, mx - 6, pTop + 4);
        for (const dx of [-7, -2, 3, 8]) drawMiniOrb(ctx, mx + dx, pTop + 2, '#a8f0f0', '#123b45');

        // Cristais indo para a BASE (dois cristais 2 = 4)
        const slide = clamp(phase / 0.52, 0, 1);
        const srcX1 = R(vx + 22 + easeInOut(slide) * ((mx - 14) - (vx + 22)));
        const srcX2 = R(vx + 40 + easeInOut(slide) * ((mx + 6) - (vx + 40)));
        const botY = barY + 5;
        ctx.drawImage(SPR_AQUA, srcX1 - 3, botY);
        drawMiniOrb(ctx, srcX1 + 1, botY - 2, '#a8f0f0', '#123b45');
        drawMiniOrb(ctx, srcX1 + 6, botY - 2, '#a8f0f0', '#123b45');
        ctx.drawImage(SPR_AQUA, srcX2 - 3, botY);
        drawMiniOrb(ctx, srcX2 + 1, botY - 2, '#a8f0f0', '#123b45');
        drawMiniOrb(ctx, srcX2 + 6, botY - 2, '#a8f0f0', '#123b45');

        if (matched) {
          drawRing(ctx, mx, barY, 22 + glow * 3, '#ff69b4');
          drawPixelText(ctx, 'IGUAIS!', mx + pfW / 2 + 6, barY - 4, '#4ade80', '#000000', 54, 8);
        } else {
          drawPixelText(ctx, 'ARRASTE!', vx + 10, pTop + 3, '#fbbf24', '#000000', 48, 8);
        }
      } else if (type === 'river_divide') {
        const mx = R(vx + vw / 2 - 34);
        const pfW = 66, pfH = Math.max(32, vh - 8);
        const pTop = R(vy + (vh - pfH) / 2);
        const barY = R(pTop + pfH / 2);
        const glow = Math.sin(t * 8) * 0.5 + 0.5;
        const divided = phase >= 0.48;

        if (!divided) {
          ctx.fillStyle = '#24142a';
          ctx.fillRect(mx - pfW / 2, pTop, pfW, pfH);
          ctx.fillStyle = '#ff69b4';
          ctx.fillRect(mx - pfW / 2 + 4, barY - 1, pfW - 8, 2);
          ctx.drawImage(SPR_AQUA, mx - 6, pTop + 4);
          ctx.drawImage(SPR_AQUA, mx - 6, barY + 4);
          drawRing(ctx, mx, barY, 19 + glow * 4, '#ff69b4');
        } else {
          drawStar(ctx, mx, barY, 5, '#ffffff', '#ff69b4');
          drawRing(ctx, mx, barY, R((phase - 0.48) * 52), '#ff85c8');
        }

        // Botão demonstrativo de DIVIDIR e cristal resultante = 1
        drawPixelText(ctx, 'CLIQUE DIVIDIR!', mx + pfW / 2 + 8, pTop + 4, divided ? '#4ade80' : '#ff85c8', '#000000', 96, 8);

        const outX = divided
          ? R(mx + pfW / 2 + 18 + easeInOut((phase - 0.48) / 0.52) * 34)
          : mx + pfW / 2 + 18;
        if (divided) {
          ctx.drawImage(SPR_AQUA, outX, barY);
          drawMiniOrb(ctx, outX + 6, barY - 3, '#a8f0f0', '#123b45');
          drawPixelText(ctx, '= 1', outX + 16, barY + 2, '#92e8ff', '#000000', 26, 8);
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

      // Atualiza o tempo decorrido na página atual com proteção contra saltos de clock
      if (this.lastRenderTime != null && Number.isFinite(t)) {
        let dt = t - this.lastRenderTime;
        if (dt > 0 && dt < 0.5) {
          this.pageElapsed += dt;
        }
      }
      this.lastRenderTime = t;

      // Véu escuro suave sobre o fundo
      ctx.fillStyle = 'rgba(10, 8, 6, 0.65)';
      ctx.fillRect(0, 20, W, H - 20);

      // Card com enquadramento ampliado e harmonioso para preenchimento de texto
      const cx = 24, cy = 18, cw = 272, ch = 144;
      this.btnRect = { x: cx + cw - 88, y: cy + ch - 20, w: 78, h: 15 };

      drawParchmentBox(ctx, cx, cy, cw, ch, { headerH: 16, headerBg: '#3d2b24' });

      // Cabeçalho + paginação bem enquadrados (amarelo com bordas pretas)
      const stepLabel = `Página ${this.currentIndex + 1}/${this.cards.length}`;
      drawPixelText(ctx, card.title || 'Como Jogar', cx + 10, cy + 6, '#ffea31', '#000000', 168, 9);
      drawPixelText(ctx, stepLabel, cx + 10, cy + 6, '#fff66b', '#000000', cw - 20, 9, 'right');

      // Suporte à etapa interativa de treino (Equação Cristalina) ou vinheta ampliada (Fração Cristalina)
      if (card.interactivePractice === 'equation_practice') {
        if (!this.practiceState) this.initPracticeState();
        this.renderEquationPractice(ctx, cx + 10, cy + 20, cw - 20, 66, t);
        drawJustifiedPixelText(ctx, card.body || '', cx + 12, cy + 90, cw - 24, 10, '#ffea31', '#000000');
      } else {
        const vigH = card.largeVignette ? 54 : 36;
        const bodyY = card.largeVignette ? (cy + 78) : (cy + 62);
        const bodyLH = card.largeVignette ? 10 : 11;
        this.drawVignette(ctx, card.vignette || 'drag_and_shadow', cx + 10, cy + 21, cw - 20, vigH, t);
        drawJustifiedPixelText(ctx, card.body || '', cx + 12, bodyY, cw - 24, bodyLH, '#ffea31', '#000000');
      }

      // Barra de progresso de leitura infantil na base inferior esquerda
      const barX = cx + 12;
      const barY = cy + ch - 15;
      const barW = cw - 108;
      const barH = 5;
      const duration = Math.max(0.1, this.pageDuration || 3.0);
      const ratio = Math.max(0, Math.min(1, this.pageElapsed / duration));
      const isLocked = this.isPageLocked();

      // Trilho da barra
      ctx.fillStyle = '#0f1422';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
      ctx.fillStyle = '#1c2438';
      ctx.fillRect(barX, barY, barW, barH);

      // Preenchimento animado suave
      const fillW = Math.round(barW * ratio);
      if (fillW > 0) {
        ctx.fillStyle = ratio >= 1 ? '#fbbf24' : '#38bdf8';
        ctx.fillRect(barX, barY, fillW, barH);
        ctx.fillStyle = ratio >= 1 ? '#fff6a0' : '#a5f3fc';
        ctx.fillRect(barX, barY, fillW, 1);
        if (ratio < 1) {
          // Centelha luminosa na ponta da barra
          P1(ctx, barX + fillW - 1, barY + 1, '#ffffff');
          P1(ctx, barX + fillW - 1, barY + 2, '#ffffff');
          P1(ctx, barX + fillW - 1, barY + 3, '#ffffff');
        } else {
          // Brilho estelar de leitura concluída
          drawStar(ctx, barX + fillW - 2, barY + 2, 2, '#ffffff', '#fbbf24');
        }
      }

      // Botão para avançar/concluir no canto inferior direito
      const b = this.btnRect;
      const isLast = this.currentIndex >= this.cards.length - 1;
      const btnText = isLast ? 'Começar!' : 'Avançar >';

      if (isLocked) {
        // Estado bloqueado/em leitura: cores escuras e sem destaque
        ctx.fillStyle = '#0f1422';
        ctx.fillRect(b.x - 1, b.y - 1, b.w + 2, b.h + 2);
        ctx.fillStyle = '#1b2334';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = '#2d3b54';
        ctx.fillRect(b.x, b.y, b.w, 1);
        ctx.fillRect(b.x, b.y + b.h - 1, b.w, 1);
        drawPixelTextCentered(ctx, btnText, b.x + b.w / 2, b.y + 4, '#6b7d9b', '#000000', b.w - 4, 9);
      } else {
        // Estado liberado: destaque vibrante com pulso sutil
        const pulse = (Math.floor(t * 4) & 1) ? 1 : 0;
        ctx.fillStyle = '#14111c';
        ctx.fillRect(b.x - 1, b.y - 1, b.w + 2, b.h + 2);
        ctx.fillStyle = isLast ? '#2b689c' : '#324b81';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = pulse ? '#ffe887' : '#92e8ff';
        ctx.fillRect(b.x, b.y, b.w, 1);
        ctx.fillRect(b.x, b.y + b.h - 1, b.w, 1);
        drawPixelTextCentered(ctx, btnText, b.x + b.w / 2, b.y + 4, '#ffffff', '#000000', b.w - 4, 9);
      }
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
    guideOpen: false,
    guideWorld: 'caverna',
    guideItemIndex: 0,
    guideCardPage: 0,
    guideLayout: null,
    _lastHideSteps: false,
    muted: false,
    musicVol: 50,
    sfxVol: 50,
    reducedMotion: false,
    godMode: false,
    restartFlashUntil: 0,

    // Sistema de Habilidades dos Cristais Primordiais
    abilityButtons: {
      vision: { id: 'vision', num: 1, label: 'Visão',  x: 4,  y: 22, w: 52, h: 16 },
      rewind: { id: 'rewind', num: 2, label: 'Voltar', x: 60, y: 22, w: 52, h: 16 }
    },
    abilities: {
      vision: { unlocked: false, charges: 0, maxCharges: 0, usedCount: 0, infinite: false, flashUntil: 0, chargeSources: [] },
      rewind: { unlocked: false, charges: 0, maxCharges: 0, usedCount: 0, infinite: false, flashUntil: 0, chargeSources: [] }
    },
    abilityParticles: [],
    onUseAbility1: null,
    onUseAbility2: null,

    // Botões na barra superior (320x20):
    buttons: {
      guide:      { x: 120, y: 2, w: 32, h: 16 },
      map:        { x: 154, y: 2, w: 32, h: 16 },
      pause:      { x: 188, y: 2, w: 20, h: 16 },
      restart:    { x: 210, y: 2, w: 44, h: 16 },
      fullscreen: { x: 256, y: 2, w: 18, h: 16 },
      mute:       { x: 276, y: 2, w: 20, h: 16 },
      settings:   { x: 298, y: 2, w: 20, h: 16 }
    },

    get guideCatalog() {
      return this.getGuideCatalog();
    },

    getGuideCatalog() {
      return {
        caverna: {
          label: 'Caverna',
          items: [
            { key: 'FASE1_INTRO', title: 'Cristais/Sombras', cards: StandardTutorialCards.FASE1_INTRO },
            { key: 'FASE2_OPAL', title: 'Opala de Fogo', cards: StandardTutorialCards.FASE2_OPAL },
            { key: 'FASE2_LEFTOVER', title: 'Sobras Cristais', cards: StandardTutorialCards.FASE2_LEFTOVER },
            { key: 'FASE3_ROSE_AND_AURA', title: 'Quartzo Rosa', cards: StandardTutorialCards.FASE3_ROSE_AND_AURA },
            { key: 'FASE3_EQUATION_AURA', title: 'Equação Crist.', cards: StandardTutorialCards.FASE3_EQUATION_AURA }
          ]
        },
        floresta: {
          label: 'Floresta',
          items: [
            { key: 'FOREST_EMERALD', title: 'Altar Esmeralda', cards: StandardTutorialCards.FOREST_EMERALD },
            { key: 'FOREST_CITRINE', title: 'Citrino Solar', cards: StandardTutorialCards.FOREST_CITRINE },
            { key: 'FOREST_SLICING_NINJA', title: 'Corte Cristalino', cards: StandardTutorialCards.FOREST_SLICING_NINJA }
          ]
        },
        rio: {
          label: 'Rio',
          items: [
            { key: 'RIVER_FRACTION_PLATFORM', title: 'Fração Cristalina', cards: StandardTutorialCards.RIVER_FRACTION_PLATFORM },
            { key: 'RIVER_AQUA', title: 'Água-Marinha', cards: StandardTutorialCards.RIVER_AQUA },
            { key: 'RIVER_MELODY_SIMON', title: 'Sinfonia Águas', cards: StandardTutorialCards.RIVER_MELODY_SIMON }
          ]
        },
        caatinga: {
          label: 'Caatinga',
          items: [
            { key: 'CAATINGA_CIRCLE', title: 'Círculo Elétr.', cards: StandardTutorialCards.CAATINGA_CIRCLE },
            { key: 'CAATINGA_SQUARE', title: 'Quadrado/Ordem', cards: StandardTutorialCards.CAATINGA_SQUARE },
            { key: 'CAATINGA_RECTANGLE', title: 'Retângulo El.', cards: StandardTutorialCards.CAATINGA_RECTANGLE },
            { key: 'CAATINGA_TRAPEZOID', title: 'Trapézio El.', cards: StandardTutorialCards.CAATINGA_TRAPEZOID },
            { key: 'CAATINGA_TESSELLATION', title: 'Arte Encaixe', cards: StandardTutorialCards.CAATINGA_TESSELLATION },
            { key: 'CAATINGA_NESTED', title: 'Geom. Avançada', cards: StandardTutorialCards.CAATINGA_NESTED },
            { key: 'CAATINGA_SHELL_GAME', title: 'Desafio Areias', cards: StandardTutorialCards.CAATINGA_SHELL_GAME }
          ]
        }
      };
    },

    ensureGuideLayout() {
      const cx = 6, cy = 21, cw = 308, ch = 156;
      const lx = cx + 5, ly = cy + 19, lw = 108;
      const rx = cx + 117, ry = cy + 19, rw = 186;
      const worldTabRects = {
        caverna:  { x: lx,      y: ly,      w: 53, h: 12 },
        floresta: { x: lx + 55, y: ly,      w: 53, h: 12 },
        rio:      { x: lx,      y: ly + 14, w: 53, h: 12 },
        caatinga: { x: lx + 55, y: ly + 14, w: 53, h: 12 }
      };
      const cat = this.getGuideCatalog();
      const worldData = cat[this.guideWorld] || cat.caverna;
      const items = worldData.items || [];
      const rowH = 13;
      const listStartY = ly + 29;
      const itemRects = items.map((item, idx) => ({
        index: idx,
        item,
        x: lx,
        y: listStartY + idx * (rowH + 1),
        w: lw,
        h: rowH
      }));
      this.guideLayout = {
        modalRect: { x: cx, y: cy, w: cw, h: ch },
        leftRect: { x: lx, y: ly, w: lw, h: ch - 23 },
        rightRect: { x: rx, y: ry, w: rw, h: ch - 23 },
        closeBtn: { x: cx + cw - 48, y: cy + 2, w: 42, h: 12 },
        worldTabRects,
        itemRects,
        prevPageRect: { x: rx + rw - 44, y: ry + 2, w: 12, h: 11 },
        nextPageRect: { x: rx + rw - 14, y: ry + 2, w: 12, h: 11 }
      };
      return this.guideLayout;
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
      musMinus:      { x: 136, y: 46, w: 18, h: 13 },
      musBar:        { x: 158, y: 46, w: 56, h: 13 },
      musPlus:       { x: 218, y: 46, w: 18, h: 13 },
      sfxMinus:      { x: 136, y: 63, w: 18, h: 13 },
      sfxBar:        { x: 158, y: 63, w: 56, h: 13 },
      sfxPlus:       { x: 218, y: 63, w: 18, h: 13 },
      muteBtn:       { x: 136, y: 80, w: 112, h: 13 },
      fullscreenBtn: { x: 136, y: 97, w: 112, h: 13 },
      motionBtn:     { x: 136, y: 114, w: 112, h: 13 },
      closeBtn:      { x: 106, y: 133, w: 108, h: 15 }
    },

    onRestart: null,
    onGoMap: null,
    onMuteChange: null,
    onGodModeChange: null,

    isFullscreen() {
      if (typeof document === 'undefined') return false;
      return Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
    },

    async toggleFullscreen(targetElement) {
      if (typeof document === 'undefined') return false;
      try {
        if (this.isFullscreen()) {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            await document.webkitExitFullscreen();
          } else if (document.mozCancelFullScreen) {
            await document.mozCancelFullScreen();
          } else if (document.msExitFullscreen) {
            await document.msExitFullscreen();
          }
          return false;
        } else {
          const el = targetElement || document.documentElement;
          if (el.requestFullscreen) {
            await el.requestFullscreen();
          } else if (el.webkitRequestFullscreen) {
            await el.webkitRequestFullscreen();
          } else if (el.mozRequestFullScreen) {
            await el.mozRequestFullScreen();
          } else if (el.msRequestFullscreen) {
            await el.msRequestFullscreen();
          }
          return true;
        }
      } catch (err) {
        console.warn('Fullscreen toggle failed:', err);
        return this.isFullscreen();
      }
    },

    hasInfiniteAbilities() {
      return Boolean(this.godMode);
    },

    isMapLocked() {
      if (this.godMode) return false;
      const isCave = (this.worldLabel === 'Caverna') || Boolean(global.CaveChapter1?.isActiveGame?.());
      if (!isCave) return false;
      const caveCompleted = Boolean(
        DialogueBox?.sockets?.fairy ||
        (global.CrystalApp?.state?.completed || []).includes(5)
      );
      return !caveCompleted;
    },

    syncGodModeBadge() {
      if (typeof document === 'undefined' || !document.body) return;
      let badge = document.getElementById('godModeBadge');
      if (!badge && typeof document.createElement === 'function') {
        badge = document.createElement('div');
        badge.id = 'godModeBadge';
        badge.setAttribute('aria-live', 'polite');
        if (badge.style) {
          badge.style.cssText = [
            'position:fixed',
            'left:10px',
            'bottom:10px',
            'z-index:9999',
            'pointer-events:none',
            'padding:4px 10px',
            'background:rgba(28, 16, 48, 0.92)',
            'border:2px solid #ffea31',
            'border-radius:4px',
            'color:#ffea31',
            'font-family:"Fredoka","Segoe UI",sans-serif',
            'font-size:12px',
            'font-weight:800',
            'letter-spacing:0.6px',
            'text-shadow:1px 1px 0 #000',
            'box-shadow:0 0 10px rgba(255, 234, 49, 0.45)'
          ].join(';');
        }
        badge.textContent = '⚡ GOD MODE ATIVO';
        document.body.appendChild(badge);
      }
      if (badge) {
        badge.hidden = !this.godMode;
        if (badge.style) {
          badge.style.display = this.godMode ? 'block' : 'none';
        }
      }
    },

    setGodMode(active, silent = false) {
      const next = Boolean(active);
      if (this.godMode === next) {
        this.syncGodModeBadge();
        this.syncAbilitiesState(false);
        return this.godMode;
      }
      this.godMode = next;
      this.syncGodModeBadge();
      this.syncAbilitiesState(false);
      if (!silent) {
        this.playSfx(this.godMode ? 'reward' : 'click');
      }
      if (typeof this.onGodModeChange === 'function') {
        this.onGodModeChange(this.godMode);
      }
      return this.godMode;
    },

    toggleGodMode(silent = false) {
      return this.setGodMode(!this.godMode, silent);
    },

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
            tr._fadeTargetVol = effMus;
            if (!tr._fadingIn) {
              tr.volume = effMus;
            }
            if (!tr.muted && effMus > 0 && tr.paused && typeof document !== 'undefined' && (!document.body?.dataset?.screen || document.body.dataset.screen === 'home')) {
              global.CrystalMenuAudio.play?.();
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
      this.guideOpen = false;
      this.restartFlashUntil = (typeof performance !== 'undefined' ? performance.now() : 0) + 280;
      this.resetAbilityCharges();
      this.playSfx('click');
      if (typeof this.onRestart === 'function') {
        this.onRestart();
      } else if (global.TruePixelWorlds && global.TruePixelWorlds.isActiveGame?.()) {
        global.TruePixelWorlds.restartCurrentPhase();
      } else if (global.CaveChapter1 && typeof global.CaveChapter1.restartCurrentPhase === 'function') {
        global.CaveChapter1.restartCurrentPhase();
      }
    },

    resolveAbilityKey(idOrNum) {
      if (idOrNum === 2 || idOrNum === '2' || idOrNum === 'rewind' || idOrNum === 'undo') {
        return 'rewind';
      }
      if (idOrNum === 1 || idOrNum === '1' || idOrNum === 'vision' || idOrNum === 'ghost') {
        return 'vision';
      }
      return 'vision';
    },

    syncAbilitiesState(resetCharges = false) {
      const completed = Array.isArray(global.CrystalApp?.state?.completed)
        ? global.CrystalApp.state.completed
        : [];
      const sockets = (typeof DialogueBox !== 'undefined' && DialogueBox.sockets) ? DialogueBox.sockets : {};
      const caveDone = Boolean(sockets.fairy || completed.includes(5));
      const forestDone = Boolean(sockets.forest || completed.includes(10));
      const riverDone = Boolean(sockets.river || completed.includes(15));
      const caatingaDone = Boolean(sockets.caatinga || completed.includes(20));

      const bonus = (riverDone ? 1 : 0) + (caatingaDone ? 1 : 0);
      const sources = ['base'];
      if (riverDone) sources.push('river');
      if (caatingaDone) sources.push('caatinga');

      const updateOne = (key, worldDone) => {
        const st = this.abilities[key];
        const unlocked = Boolean(this.godMode || worldDone);
        const maxCharges = unlocked ? (1 + bonus) : 0;
        if (resetCharges) {
          st.usedCount = 0;
        }
        st.unlocked = unlocked;
        st.maxCharges = maxCharges;
        st.infinite = Boolean(this.godMode);
        st.chargeSources = unlocked ? sources.slice() : [];
        if (this.godMode) {
          st.charges = Math.max(3, maxCharges);
        } else {
          st.usedCount = clamp(st.usedCount || 0, 0, maxCharges);
          st.charges = Math.max(0, maxCharges - st.usedCount);
        }
      };

      updateOne('vision', caveDone);
      updateOne('rewind', forestDone);
      return this.abilities;
    },

    getAbilityState(idOrNum) {
      this.syncAbilitiesState(false);
      const key = this.resolveAbilityKey(idOrNum);
      return this.abilities[key];
    },

    isAbilityUnlocked(idOrNum) {
      return Boolean(this.getAbilityState(idOrNum).unlocked);
    },

    getMaxAbilityCharges(idOrNum) {
      return this.getAbilityState(idOrNum).maxCharges || 0;
    },

    resetAbilityCharges() {
      this.syncAbilitiesState(true);
      this.abilityParticles = [];
    },

    spawnAbilityParticles(key) {
      const btn = this.abilityButtons[key] || this.abilityButtons.vision;
      const cx = btn.x + btn.w * 0.5;
      const cy = btn.y + btn.h * 0.5;
      const palette = key === 'vision'
        ? ['#e040fb', '#c084fc', '#92e8ff', '#ffffff']
        : ['#4ade80', '#69f0ae', '#ffe887', '#ffffff'];
      for (let i = 0; i < 10; i++) {
        const ang = (i / 10) * Math.PI * 2 + (i & 1 ? 0.25 : 0);
        const sp = 0.35 + (i % 3) * 0.25;
        this.abilityParticles.push({
          x: cx + Math.cos(ang) * 4,
          y: cy + Math.sin(ang) * 3,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp - 0.15,
          life: 18 + (i % 4) * 3,
          col: palette[i % palette.length]
        });
      }
    },

    useAbility(idOrNum) {
      this.syncAbilitiesState(false);
      const key = this.resolveAbilityKey(idOrNum);
      const st = this.abilities[key];
      if (!st || !st.unlocked || (!this.godMode && st.charges <= 0)) {
        this.playSfx('error');
        return false;
      }

      const cb = key === 'vision' ? this.onUseAbility1 : this.onUseAbility2;
      if (typeof cb === 'function') {
        const res = cb(key, { ...st });
        if (res === false) {
          return false;
        }
      }

      if (!this.godMode) {
        st.usedCount = (st.usedCount || 0) + 1;
        st.charges = Math.max(0, st.maxCharges - st.usedCount);
      }
      st.flashUntil = (typeof performance !== 'undefined' ? performance.now() : Date.now()) + 360;
      this.spawnAbilityParticles(key);
      this.playSfx('tutorialAdvance');
      return true;
    },

    drawCrystalAbilityButton(ctx, btn, st, key, t) {
      const x = R(btn.x), y = R(btn.y), w = R(btn.w), h = R(btn.h);
      const isVision = key === 'vision';
      const nowMs = typeof performance !== 'undefined' ? performance.now() : 0;
      const flashing = nowMs < (st.flashUntil || 0);
      const ready = st.unlocked && (st.infinite || st.charges > 0);
      const pulse = ready ? ((Math.floor(t * 4) & 1) === 0) : false;

      // Cores cristalinas por mundo de origem:
      // Visão = Gema da Caverna (ametista #e040fb / #c084fc)
      // Voltar = Esmeralda da Floresta (#4ade80 / #69f0ae)
      const rimCol = !st.unlocked
        ? '#323c54'
        : (!ready ? '#4a5568' : (isVision ? (flashing ? '#ffffff' : '#e040fb') : (flashing ? '#ffffff' : '#4ade80')));
      const hiCol = !st.unlocked
        ? '#45516e'
        : (isVision ? '#c084fc' : '#69f0ae');
      const bgCol = !st.unlocked
        ? '#141826'
        : (flashing ? (isVision ? '#4c1d95' : '#14532d') : (ready ? (isVision ? '#2a1647' : '#113524') : '#1c2130'));

      // Moldura facetada cristalina (cantos chanfrados)
      ctx.fillStyle = '#0d0f1a';
      ctx.fillRect(x, y + 1, w, h - 2);
      ctx.fillRect(x + 1, y, w - 2, h);

      ctx.fillStyle = bgCol;
      ctx.fillRect(x + 1, y + 1, w - 2, h - 2);

      // Filete cristalino externo + chanfro superior
      ctx.fillStyle = rimCol;
      ctx.fillRect(x + 2, y, w - 4, 1);
      ctx.fillRect(x + 2, y + h - 1, w - 4, 1);
      ctx.fillRect(x, y + 2, 1, h - 4);
      ctx.fillRect(x + w - 1, y + 2, 1, h - 4);
      P1(ctx, x + 1, y + 1, hiCol);
      P1(ctx, x + w - 2, y + 1, hiCol);
      P1(ctx, x + 1, y + h - 2, hiCol);
      P1(ctx, x + w - 2, y + h - 2, hiCol);

      // Ícone do cristal primordial à esquerda (losango Caverna vs gota/folha Esmeralda Floresta)
      const ix = x + 6, iy = y + 8;
      if (!st.unlocked) {
        ctx.fillStyle = '#5a6580';
        ctx.fillRect(ix - 2, iy - 1, 5, 4);
        ctx.fillRect(ix - 1, iy - 3, 3, 2);
      } else if (isVision) {
        ctx.fillStyle = ready ? '#e040fb' : '#6b7280';
        ctx.fillRect(ix - 2, iy - 3, 5, 6);
        ctx.fillRect(ix - 3, iy - 1, 7, 2);
        P1(ctx, ix - 1, iy - 2, '#ffffff');
        if (ready && pulse) P1(ctx, ix + 3, iy - 4, '#c084fc');
      } else {
        ctx.fillStyle = ready ? '#4ade80' : '#6b7280';
        ctx.fillRect(ix - 2, iy - 3, 5, 6);
        ctx.fillRect(ix - 3, iy - 2, 7, 4);
        P1(ctx, ix - 1, iy - 2, '#ffffff');
        P1(ctx, ix + 2, iy + 2, '#69f0ae');
      }

      // Rótulo da habilidade
      const labelCol = !st.unlocked ? '#64748b' : (ready ? '#ffffff' : '#94a3b8');
      this.renderSingleLineHudText(ctx, btn.label, x + 12, y + 3, w - 15, labelCol, '#000000', 5.6);

      // Indicadores de cargas disponíveis na base direita com cores das gemas de origem
      if (st.unlocked) {
        if (st.infinite || this.godMode) {
          this.renderSingleLineHudText(ctx, '∞', x + w - 11, y + 6, 10, '#ffea31', '#000000', 6.2);
        } else {
          const maxC = st.maxCharges || 1;
          for (let i = 0; i < maxC; i++) {
            const src = (st.chargeSources && st.chargeSources[i]) || 'base';
            const gemCol = src === 'caatinga'
              ? '#fbbf24'
              : (src === 'river' ? '#38bdf8' : (isVision ? '#e040fb' : '#4ade80'));
            const gx = x + w - 6 - (maxC - 1 - i) * 6;
            const gy = y + h - 5;
            ctx.fillStyle = '#0f1320';
            ctx.fillRect(gx - 1, gy - 1, 5, 5);
            ctx.fillStyle = i < st.charges ? gemCol : '#1e2638';
            ctx.fillRect(gx, gy, 3, 3);
            if (i < st.charges) {
              P1(ctx, gx, gy, '#ffffff');
            }
          }
        }
      }
    },

    renderAbilities(ctx, t = 0) {
      if (!ctx) return;
      this.syncAbilitiesState(false);
      this.drawCrystalAbilityButton(ctx, this.abilityButtons.vision, this.abilities.vision, 'vision', t);
      this.drawCrystalAbilityButton(ctx, this.abilityButtons.rewind, this.abilities.rewind, 'rewind', t);

      // Partículas cristalinas ao acionar habilidades
      if (this.abilityParticles && this.abilityParticles.length > 0) {
        const nextParticles = [];
        for (const p of this.abilityParticles) {
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 1;
          if (p.life > 0) {
            P1(ctx, R(p.x), R(p.y), p.col);
            nextParticles.push(p);
          }
        }
        this.abilityParticles = nextParticles;
      }
    },

    handleClick(x, y) {
      if (this.inRect(x, y, this.buttons.map, 2)) {
        if (this.isMapLocked()) {
          this.playSfx('error');
          global.CrystalApp?.notify?.('Conclua a Caverna para liberar o Mapa!');
          return true;
        }
        this.paused = false;
        this.settingsOpen = false;
        this.guideOpen = false;
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
        this.guideOpen = false;
        this.paused = !this.paused;
        this.playSfx('click');
        this.syncAudio();
        return true;
      }
      if (this.inRect(x, y, this.buttons.restart, 2)) {
        this.guideOpen = false;
        this.triggerRestart();
        return true;
      }
      if (this.inRect(x, y, this.buttons.mute, 2)) {
        this.toggleMute();
        return true;
      }
      if (this.inRect(x, y, this.buttons.fullscreen, 2)) {
        this.toggleFullscreen();
        this.playSfx('click');
        return true;
      }
      if (this.inRect(x, y, this.buttons.settings, 2)) {
        this.guideOpen = false;
        this.settingsOpen = !this.settingsOpen;
        this.playSfx('click');
        this.syncAudio();
        return true;
      }
      if (this.inRect(x, y, this.buttons.guide, 1)) {
        this.settingsOpen = false;
        this.paused = false;
        this.guideOpen = !this.guideOpen;
        if (this.guideOpen) {
          const wl = String(this.worldLabel || '').toLowerCase();
          if (wl.includes('flor')) this.guideWorld = 'floresta';
          else if (wl.includes('rio')) this.guideWorld = 'rio';
          else if (wl.includes('caat')) this.guideWorld = 'caatinga';
          else this.guideWorld = 'caverna';
          this.guideItemIndex = 0;
          this.guideCardPage = 0;
          this.ensureGuideLayout();
        }
        this.playSfx('click');
        this.syncAudio();
        return true;
      }

      if (this.guideOpen) {
        const gl = this.ensureGuideLayout();
        if (this.inRect(x, y, gl.closeBtn, 2)) {
          this.guideOpen = false;
          this.playSfx('click');
          this.syncAudio();
          return true;
        }
        for (const wKey of ['caverna', 'floresta', 'rio', 'caatinga']) {
          const tr = gl.worldTabRects[wKey];
          if (tr && this.inRect(x, y, tr, 1)) {
            this.guideWorld = wKey;
            this.guideItemIndex = 0;
            this.guideCardPage = 0;
            this.ensureGuideLayout();
            this.playSfx('click');
            return true;
          }
        }
        for (const ir of gl.itemRects) {
          if (this.inRect(x, y, ir, 1)) {
            this.guideItemIndex = ir.index;
            this.guideCardPage = 0;
            this.playSfx('click');
            return true;
          }
        }
        const cat = this.getGuideCatalog();
        const curWorld = cat[this.guideWorld] || cat.caverna;
        const curItem = (curWorld.items || [])[this.guideItemIndex] || curWorld.items[0];
        const totalPages = (curItem && Array.isArray(curItem.cards)) ? curItem.cards.length : 1;
        if (totalPages > 1) {
          if (this.inRect(x, y, gl.prevPageRect, 2)) {
            this.guideCardPage = (this.guideCardPage - 1 + totalPages) % totalPages;
            this.playSfx('click');
            return true;
          }
          if (this.inRect(x, y, gl.nextPageRect, 2)) {
            this.guideCardPage = (this.guideCardPage + 1) % totalPages;
            this.playSfx('click');
            return true;
          }
        }
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
        if (this.inRect(x, y, sb.fullscreenBtn)) {
          this.toggleFullscreen();
          this.playSfx('click');
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
              if (this.isMapLocked()) {
                this.playSfx('error');
                global.CrystalApp?.notify?.('Conclua a Caverna para liberar o Mapa!');
                return true;
              }
              this.paused = false;
              this.playSfx('click');
              if (typeof this.onGoMap === 'function') this.onGoMap();
            }
            return true;
          }
        }
        return true;
      }

      if (!this._lastHideSteps && !this.paused && !this.settingsOpen && !this.guideOpen) {
        if (this.isAbilityUnlocked('vision') && this.inRect(x, y, this.abilityButtons.vision, 1)) {
          this.useAbility('vision');
          return true;
        }
        if (this.isAbilityUnlocked('rewind') && this.inRect(x, y, this.abilityButtons.rewind, 1)) {
          this.useAbility('rewind');
          return true;
        }
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
        const fontPx = Math.round(Math.max(5, baseFontPx * scale));
        if (typeof ctx.save === 'function') ctx.save();
        ctx.font = `700 ${fontPx}px "Fredoka", "Segoe UI", system-ui, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.lineWidth = 1;
        ctx.strokeStyle = strokeCol;
        const baseY = Math.round(y + fontPx * 0.9);
        const dx = Math.round(x);
        const mw = Math.round(maxW);
        if (typeof ctx.strokeText === 'function') ctx.strokeText(s, dx, baseY, mw);
        ctx.fillStyle = col;
        ctx.fillText(s, dx, baseY, mw);
        if (typeof ctx.restore === 'function') ctx.restore();
      } else {
        drawPixelText(ctx, s, Math.round(x), Math.round(y), col, strokeCol, Math.round(maxW), 8);
      }
    },

    renderTopBar(ctx, levelNum, currentStep, totalSteps, hideSteps = false, customTitle = null) {
      this._lastHideSteps = Boolean(hideSteps);
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
      const rightLimit = hideSteps ? 96 : (this.buttons.guide.x - 4);

      if (!hideSteps) {
        const safeSteps = Math.max(1, Number(totalSteps) || 1);
        const safeCur = clamp(Number(currentStep) || 1, 1, safeSteps);
        const stepStr = `Etapa ${safeCur}/${safeSteps}`;
        const dotStep = safeSteps > 5 ? 3 : 4;
        const dotsTotalW = Math.min(20, Math.max(4, (safeSteps - 1) * dotStep + 3));
        const dotsStartX = rightLimit - dotsTotalW;
        const stepTextW = Math.min(38, Math.max(30, measurePixelText(stepStr)));
        const stepX = Math.max(54, dotsStartX - stepTextW - 2);
        const titleMaxW = Math.max(46, stepX - 6);

        this.renderSingleLineHudText(ctx, titleStr, 4, 6, titleMaxW, '#ffffff', '#000000', 6.0);
        this.renderSingleLineHudText(ctx, stepStr, stepX, 6, stepTextW + 2, '#92e8ff', '#000000', 5.8);

        for (let s = 1; s <= safeSteps; s++) {
          const dx = R(dotsStartX + (s - 1) * ((dotsTotalW - 3) / Math.max(1, safeSteps - 1))), dy = 10;
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
        this.renderSingleLineHudText(ctx, titleStr, 5, 6, rightLimit - 6, '#ffffff', '#000000', 6.4);
      }

      // Botão GUIA DE TUTORIAIS (Livro + Rótulo "Guia")
      const bguide = this.buttons.guide;
      this.drawButtonBox(ctx, bguide, this.guideOpen);
      // Mini livro aberto pixel art (esquerda)
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(bguide.x + 2, bguide.y + 5, 3, 6);
      ctx.fillRect(bguide.x + 6, bguide.y + 5, 3, 6);
      ctx.fillStyle = '#fff6cc';
      ctx.fillRect(bguide.x + 3, bguide.y + 6, 2, 4);
      ctx.fillRect(bguide.x + 6, bguide.y + 6, 2, 4);
      drawPixelTextCentered(ctx, 'Guia', bguide.x + 9 + (bguide.w - 9) / 2, bguide.y + 4, this.guideOpen ? '#ffea31' : '#ffe887', '#000000', bguide.w - 8, 8);

      // 0. Botão MAPA (Bloqueado dentro da Caverna até concluí-la, salvo God Mode)
      const bmap = this.buttons.map;
      const mapLocked = this.isMapLocked();
      if (mapLocked) {
        ctx.fillStyle = '#181420';
        ctx.fillRect(bmap.x - 1, bmap.y - 1, bmap.w + 2, bmap.h + 2);
        ctx.fillStyle = '#241e2e';
        ctx.fillRect(bmap.x, bmap.y, bmap.w, bmap.h);
        ctx.fillStyle = '#524b62';
        ctx.fillRect(bmap.x, bmap.y, bmap.w, 1);
        ctx.fillRect(bmap.x, bmap.y + bmap.h - 1, bmap.w, 1);
        ctx.fillRect(bmap.x, bmap.y, 1, bmap.h);
        ctx.fillRect(bmap.x + bmap.w - 1, bmap.y, 1, bmap.h);
        // Pequeno cadeado pixel art à esquerda + texto esmaecido
        ctx.fillStyle = '#8b829e';
        ctx.fillRect(bmap.x + 3, bmap.y + 7, 5, 5);
        ctx.fillRect(bmap.x + 4, bmap.y + 5, 3, 2);
        drawPixelTextCentered(ctx, 'Mapa', bmap.x + 4 + (bmap.w - 4) / 2, bmap.y + 4, '#6e6882', '#000000', bmap.w - 8, 8);
      } else {
        this.drawButtonBox(ctx, bmap, false);
        drawPixelTextCentered(ctx, 'Mapa', bmap.x + bmap.w / 2, bmap.y + 4, '#92e8ff', '#000000', bmap.w - 4, 8);
      }

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

      // 4. Botão TELA CHEIA (⛶ / 🗗)
      const bf = this.buttons.fullscreen;
      const isFull = this.isFullscreen();
      this.drawButtonBox(ctx, bf, isFull);
      const fx = bf.x + 10, fy = bf.y + 8;
      const iconCol = isFull ? '#ffe033' : '#92e8ff';
      if (isFull) {
        P1(ctx, fx - 4, fy - 3, iconCol);
        P1(ctx, fx - 3, fy - 3, iconCol);
        P1(ctx, fx - 3, fy - 4, iconCol);
        P1(ctx, fx + 3, fy - 3, iconCol);
        P1(ctx, fx + 2, fy - 3, iconCol);
        P1(ctx, fx + 2, fy - 4, iconCol);
        P1(ctx, fx - 4, fy + 2, iconCol);
        P1(ctx, fx - 3, fy + 2, iconCol);
        P1(ctx, fx - 3, fy + 3, iconCol);
        P1(ctx, fx + 3, fy + 2, iconCol);
        P1(ctx, fx + 2, fy + 2, iconCol);
        P1(ctx, fx + 2, fy + 3, iconCol);
      } else {
        P1(ctx, fx - 5, fy - 4, iconCol);
        P1(ctx, fx - 4, fy - 4, iconCol);
        P1(ctx, fx - 5, fy - 3, iconCol);
        P1(ctx, fx + 4, fy - 4, iconCol);
        P1(ctx, fx + 3, fy - 4, iconCol);
        P1(ctx, fx + 4, fy - 3, iconCol);
        P1(ctx, fx - 5, fy + 3, iconCol);
        P1(ctx, fx - 4, fy + 3, iconCol);
        P1(ctx, fx - 5, fy + 2, iconCol);
        P1(ctx, fx + 4, fy + 3, iconCol);
        P1(ctx, fx + 3, fy + 3, iconCol);
        P1(ctx, fx + 4, fy + 2, iconCol);
      }

      // 5. Botão CONFIGURAÇÕES (⚙)
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

      if (!hideSteps) {
        const nowSec = (typeof performance !== 'undefined' ? performance.now() : 0) / 1000;
        this.renderAbilities(ctx, nowSec);
      }

      if (this.godMode) {
        const bx = hideSteps ? 3 : 116, by = hideSteps ? 21 : 23, bw = 56, bh = 11;
        ctx.fillStyle = 'rgba(24, 14, 42, 0.88)';
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = '#ffea31';
        ctx.fillRect(bx, by, bw, 1);
        ctx.fillRect(bx, by + bh - 1, bw, 1);
        ctx.fillRect(bx, by, 1, bh);
        ctx.fillRect(bx + bw - 1, by, 1, bh);
        this.renderSingleLineHudText(ctx, 'GOD MODE', bx + 4, by + 2, bw - 6, '#ffea31', '#000000', 5.4);
      }
    },

    renderGuideModal(ctx, t = 0) {
      const gl = this.ensureGuideLayout();
      const { modalRect: m, leftRect: lr, rightRect: rr, closeBtn, worldTabRects, itemRects, prevPageRect, nextPageRect } = gl;

      drawParchmentBox(ctx, m.x, m.y, m.w, m.h, { headerH: 15, headerBg: '#163b6c' });
      drawPixelText(ctx, 'Guia de Tutoriais', m.x + 8, m.y + 4, '#ffe887', '#000000', 180, 9);

      // Botão Fechar no cabeçalho
      this.drawButtonBox(ctx, closeBtn, true);
      drawPixelTextCentered(ctx, 'Fechar', closeBtn.x + closeBtn.w / 2, closeBtn.y + 3, '#ffffff', '#000000', closeBtn.w - 4, 8);

      // Fundo da Coluna Esquerda (Mundos + Lista de Títulos)
      ctx.fillStyle = '#141826';
      ctx.fillRect(lr.x - 1, lr.y - 1, lr.w + 2, lr.h + 2);

      // Abas de Mundo 2x2
      const cat = this.getGuideCatalog();
      for (const wKey of ['caverna', 'floresta', 'rio', 'caatinga']) {
        const tr = worldTabRects[wKey];
        const active = this.guideWorld === wKey;
        this.drawButtonBox(ctx, tr, active);
        drawPixelTextCentered(ctx, cat[wKey].label, tr.x + tr.w / 2, tr.y + 3, active ? '#ffea31' : '#ffffff', '#000000', tr.w - 4, 8);
      }

      // Lista de tutoriais separados por mundo na coluna esquerda
      for (const ir of itemRects) {
        const selected = this.guideItemIndex === ir.index;
        ctx.fillStyle = selected ? '#2b4a7a' : '#1d2438';
        ctx.fillRect(ir.x, ir.y, ir.w, ir.h);
        if (selected) {
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(ir.x, ir.y, 2, ir.h);
        }
        drawPixelText(ctx, ir.item.title, ir.x + 5, ir.y + 3, selected ? '#ffe887' : '#d6e4ff', '#000000', ir.w - 7, 8);
      }

      // Fundo da Coluna Direita (Card Completo do Tutorial Selecionado)
      ctx.fillStyle = '#181c2b';
      ctx.fillRect(rr.x, rr.y, rr.w, rr.h);
      ctx.fillStyle = '#5577b2';
      ctx.fillRect(rr.x, rr.y, rr.w, 1);
      ctx.fillRect(rr.x, rr.y + rr.h - 1, rr.w, 1);
      ctx.fillRect(rr.x, rr.y, 1, rr.h);
      ctx.fillRect(rr.x + rr.w - 1, rr.y, 1, rr.h);

      const worldData = cat[this.guideWorld] || cat.caverna;
      const items = worldData.items || [];
      const curItem = items[this.guideItemIndex] || items[0];
      const cards = (curItem && Array.isArray(curItem.cards) && curItem.cards.length) ? curItem.cards : [];
      if (!cards.length) return;

      const pageIdx = clamp(this.guideCardPage, 0, cards.length - 1);
      const card = cards[pageIdx];

      drawPixelText(ctx, card.title || curItem.title, rr.x + 5, rr.y + 4, '#ffea31', '#000000', cards.length > 1 ? rr.w - 54 : rr.w - 10, 9);

      if (cards.length > 1) {
        this.drawButtonBox(ctx, prevPageRect, false);
        drawPixelTextCentered(ctx, '<', prevPageRect.x + prevPageRect.w / 2, prevPageRect.y + 2, '#ffffff', '#000000', 10, 8);
        drawPixelTextCentered(ctx, `${pageIdx + 1}/${cards.length}`, rr.x + rr.w - 23, rr.y + 4, '#fff66b', '#000000', 22, 8);
        this.drawButtonBox(ctx, nextPageRect, false);
        drawPixelTextCentered(ctx, '>', nextPageRect.x + nextPageRect.w / 2, nextPageRect.y + 2, '#ffffff', '#000000', 10, 8);
      }

      TutorialModal.drawVignette(ctx, card.vignette || 'drag_and_shadow', rr.x + 5, rr.y + 16, rr.w - 10, 44, t);
      drawJustifiedPixelText(ctx, card.body || '', rr.x + 6, rr.y + 64, rr.w - 12, 10, '#ffea31', '#000000');
    },

    renderModals(ctx, t = 0) {
      if (!this.paused && !this.settingsOpen && !this.guideOpen) return;

      ctx.fillStyle = 'rgba(10, 8, 6, 0.55)';
      ctx.fillRect(0, 20, W, H - 20);

      if (this.guideOpen) {
        this.renderGuideModal(ctx, t);
        return;
      }

      if (this.settingsOpen) {
        const cx = 32, cy = 24, cw = 256, ch = 136;
        drawParchmentBox(ctx, cx, cy, cw, ch, { headerH: 16, headerBg: '#163b6c' });
        drawPixelTextCentered(ctx, 'Configurações de Som e Jogo', cx + cw / 2, cy + 7, '#ffffff', '#000000', cw - 16, 9);

        const sb = this.settingsBtns;
        drawPixelText(ctx, 'Música:', cx + 14, 50, '#92e8ff', '#000000', 80, 9);
        this.drawButtonBox(ctx, sb.musMinus, false);
        drawPixelTextCentered(ctx, '-', sb.musMinus.x + sb.musMinus.w / 2, sb.musMinus.y + 4, '#ffffff', '#000000', 14, 9);
        this.drawVolumeBar(ctx, sb.musBar, this.musicVol, this.muted);
        this.drawButtonBox(ctx, sb.musPlus, false);
        drawPixelTextCentered(ctx, '+', sb.musPlus.x + sb.musPlus.w / 2, sb.musPlus.y + 4, '#ffffff', '#000000', 14, 9);
        drawPixelText(ctx, `${this.muted ? 0 : Math.round(this.musicVol)}%`, sb.musPlus.x + 22, 50, '#ffffff', '#000000', 40, 9);

        drawPixelText(ctx, 'Efeitos:', cx + 14, 67, '#92e8ff', '#000000', 80, 9);
        this.drawButtonBox(ctx, sb.sfxMinus, false);
        drawPixelTextCentered(ctx, '-', sb.sfxMinus.x + sb.sfxMinus.w / 2, sb.sfxMinus.y + 4, '#ffffff', '#000000', 14, 9);
        this.drawVolumeBar(ctx, sb.sfxBar, this.sfxVol, this.muted);
        this.drawButtonBox(ctx, sb.sfxPlus, false);
        drawPixelTextCentered(ctx, '+', sb.sfxPlus.x + sb.sfxPlus.w / 2, sb.sfxPlus.y + 4, '#ffffff', '#000000', 14, 9);
        drawPixelText(ctx, `${this.muted ? 0 : Math.round(this.sfxVol)}%`, sb.sfxPlus.x + 22, 67, '#ffffff', '#000000', 40, 9);

        drawPixelText(ctx, 'Áudio Geral:', cx + 14, 84, '#92e8ff', '#000000', 88, 9);
        this.drawButtonBox(ctx, sb.muteBtn, this.muted);
        drawPixelTextCentered(ctx, this.muted ? 'Mudo: Ativado' : 'Som: Ativado', sb.muteBtn.x + sb.muteBtn.w / 2, sb.muteBtn.y + 4, '#ffffff', '#000000', sb.muteBtn.w - 4, 9);

        drawPixelText(ctx, 'Tela Cheia:', cx + 14, 101, '#92e8ff', '#000000', 88, 9);
        const isFull = this.isFullscreen();
        this.drawButtonBox(ctx, sb.fullscreenBtn, isFull);
        drawPixelTextCentered(ctx, isFull ? 'Janela [F]' : 'Tela Cheia [F]', sb.fullscreenBtn.x + sb.fullscreenBtn.w / 2, sb.fullscreenBtn.y + 4, isFull ? '#ffe033' : '#ffffff', '#000000', sb.fullscreenBtn.w - 4, 9);

        drawPixelText(ctx, 'Movimento:', cx + 14, 118, '#92e8ff', '#000000', 88, 9);
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
          const mapLocked = b.id === 'map' && this.isMapLocked();
          this.drawButtonBox(ctx, b, b.id === 'resume');
          const label = b.id === 'mute'
            ? (this.muted ? 'Som: Mudo' : 'Som: Ligado')
            : (mapLocked ? 'Mapa (Bloqueado)' : b.label);
          const col = mapLocked ? '#77708a' : (b.id === 'resume' ? '#92e8ff' : '#ffffff');
          drawPixelTextCentered(ctx, label, b.x + b.w / 2, b.y + 4, col, '#000000', b.w - 6, 9);
        }
      }
    }
  };

  // Cards padrões de Tutorial do Jogo em Pergaminho Estilo Owlboy (com acentuação completa e destaques dinâmicos)
  const StandardTutorialCards = {
    FASE1_INTRO: [
      {
        id: 'tut_drag_and_shadow_once',
        title: 'Cristais e Sombras',
        vignette: 'drag_and_shadow',
        body: '{cyan:Arraste os cristais} pelo campo. As {gold:bolinhas luminosas} indicam seu valor: una {cyan:cristais puros} aos {orange:sombrios equivalentes} para {green:anulá-los}!'
      },
      {
        id: 'tut_obstacle_decay',
        title: 'Caminho Bloqueado',
        vignette: 'obstacle_decay',
        body: 'Cada etapa resolvida {cyan:enfraquece a barreira de pedra} do cenário até {green:liberar a passagem} para a próxima área!'
      }
    ],
    FASE2_OPAL: [
      {
        id: 'tut_fire_opal',
        title: 'Opala de Fogo',
        vignette: 'fire_opal',
        body: 'Ao aproximar a {gold:Opala de Fogo} de um cristal, ambos {orange:tremem} e {orange:subtraem 1 bolinha} por vez. {cyan:Afaste para parar}!'
      }
    ],
    FASE2_LEFTOVER: [
      {
        id: 'tut_leftover_crystals',
        title: 'Podem Sobrar Cristais!',
        vignette: 'leftover_crystals',
        body: '{gold:Nem todos os cristais} da tela precisam ser usados! {green:Podem sobrar cristais} puros ou opalas no campo após você {cyan:anular todas as sombras}!'
      }
    ],
    FASE3_ROSE_AND_AURA: [
      {
        id: 'tut_rose_quartz',
        title: 'Quartzo Rosa',
        vignette: 'rose_quartz',
        body: 'O {pink:Quartzo Rosa} {cyan:soma igual} ao Quartzo Branco, mas {orange:cristais de cores diferentes não podem se fundir}!'
      }
    ],
    FASE3_EQUATION_AURA: [
      {
        id: 'tut_aura_equation',
        title: 'Equação Cristalina',
        vignette: 'aura_equation',
        body: '{cyan:Arraste cristais} para dentro da {pink:Equação Cristalina} para somá-los, ou {gold:toque nela para expandir} e {green:organizar seu interior}!'
      },
      {
        id: 'tut_aura_equation_practice',
        title: 'Treino: Equação Cristalina',
        vignette: 'aura_equation_practice',
        interactivePractice: 'equation_practice',
        body: '{cyan:Arraste cristais} para a {pink:Equação} e {gold:toque nela} para expandir e organizar a ordem sem penalidade!'
      }
    ],
    FOREST_EMERALD: [
      {
        id: 'tut_emerald_altar',
        title: 'Altar de Esmeralda',
        vignette: 'emerald_altar',
        body: 'Aproxime um {cyan:cristal puro} do {green:Altar de Esmeralda} para {gold:duplicar suas bolinhas} de energia {orange:uma única vez}!'
      }
    ],
    FOREST_CITRINE: [
      {
        id: 'tut_citrine_split',
        title: 'Citrino Solar',
        vignette: 'citrine_split',
        body: '{gold:Toque rápido} em um {gold:Citrino Solar} com {cyan:número par} de bolinhas para {green:dividi-lo em dois} cristais iguais!'
      }
    ],
    FOREST_SLICING_NINJA: [
      {
        id: 'tut_forest_ninja',
        title: 'Corte Cristalino da Floresta',
        vignette: 'forest_ninja_slice',
        body: '{cyan:Deslize o dedo ou mouse} para {green:cortar cristais puros} no ar! Faça {gold:combos cortando múltiplos}. Cortar sombras {orange:desconta 2s}!'
      }
    ],
    RIVER_AQUA: [
      {
        id: 'tut_aqua_drop',
        title: 'Água-Marinha',
        vignette: 'aqua_drop',
        body: '{cyan:Toque rápido} em uma {cyan:Água-Marinha par} para {green:reparti-la ao meio}, ou {gold:arraste gotas iguais} para {gold:somá-las}!'
      }
    ],
    RIVER_FRACTION_PLATFORM: [
      {
        id: 'tut_river_fraction',
        title: 'Fração Cristalina: Passo 1',
        vignette: 'river_fraction',
        largeVignette: true,
        body: 'Coloque cristais no {cyan:TOPO} e na {gold:BASE} da plataforma. Arraste cristais da mesma cor até {green:igualar os valores de cima e de baixo}!'
      },
      {
        id: 'tut_river_divide',
        title: 'Fração Cristalina: Passo 2',
        vignette: 'river_divide',
        largeVignette: true,
        body: 'Quando {green:TOPO e BASE têm valores iguais}, a barra {pink:brilha em rosa}! {gold:Clique em Dividir} na plataforma para repartir e gerar o {cyan:cristal resultante}!'
      }
    ],
    RIVER_MELODY_SIMON: [
      {
        id: 'tut_river_melody',
        title: 'Sinfonia das Águas',
        vignette: 'river_melody',
        body: '{gold:Observe o cristal de referência por 1s} e acompanhe os {cyan:5 cristais flutuando}. Depois, {green:toque na ordem exata} para {green:harmonizar o rio}!'
      }
    ],
    CAATINGA_CIRCLE: [
      {
        id: 'tut_caatinga_circle',
        title: 'O Círculo Elétrico',
        vignette: 'caatinga_circle',
        body: '{cyan:Arraste 1 único cristal} até o {gold:Círculo Elétrico} amarelo para criar uma {green:matriz circular} e {green:anular a sombra circular}!'
      }
    ],
    CAATINGA_SQUARE: [
      {
        id: 'tut_caatinga_square',
        title: 'O Quadrado Elétrico',
        vignette: 'caatinga_square',
        body: 'Todas as formas exigem {gold:2 cristais}! Arraste diretamente para o {cyan:Quadrado Elétrico} — eles precisam ter o {green:mesmo valor matemático}.'
      },
      {
        id: 'tut_caatinga_order',
        title: 'A Ordem dos Fatores',
        vignette: 'caatinga_order',
        body: '{orange:A ordem importa}! O {cyan:1º cristal define a cor da borda externa} e o {pink:2º cristal define o núcleo interno} da forma.'
      }
    ],
    CAATINGA_RECTANGLE: [
      {
        id: 'tut_caatinga_rectangle',
        title: 'O Retângulo Elétrico',
        vignette: 'caatinga_rectangle',
        body: 'Arraste diretamente {gold:2 cristais com quantidades diferentes} para dentro do {cyan:Retângulo Elétrico} ({cyan:1º = borda}, {pink:2º = interior})!'
      }
    ],
    CAATINGA_TRAPEZOID: [
      {
        id: 'tut_caatinga_trapezoid',
        title: 'O Trapézio Elétrico',
        vignette: 'caatinga_trapezoid',
        body: 'Arraste diretamente {gold:2 cristais} para dentro do {cyan:Trapézio Elétrico} ({cyan:1º = borda}, {pink:2º = interior}) para moldar a {green:matriz trapezoidal}!'
      }
    ],
    CAATINGA_TESSELLATION: [
      {
        id: 'tut_caatinga_tessellation',
        title: 'A Arte do Encaixe',
        vignette: 'caatinga_tessellation',
        body: '{green:Conecte duas formas prontas} para criar {gold:polígonos maiores} (Quadrados = Retângulo, Trapézio + Triângulo = Pentágono). {cyan:Arraste para desmontar}!'
      }
    ],
    CAATINGA_NESTED: [
      {
        id: 'tut_caatinga_nested',
        title: 'Geometria Avançada',
        vignette: 'caatinga_nested',
        body: '{green:Una Triângulos em Losangos} e {cyan:encaixe formas dentro de Equações} para anular {gold:sombras compostas em cascata}!'
      }
    ],
    CAATINGA_SHELL_GAME: [
      {
        id: 'tut_caatinga_shell_game',
        title: 'O Desafio das Areias',
        vignette: 'caatinga_shell_game',
        body: '{gold:Observe a Opala revelada por 1s} sob a cúpula antes do embaralhamento! Acompanhe as trocas e {green:toque na cúpula correta} nas {green:6 rodadas}!'
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
    RICH_COLOR_MAP,
    parseRichTokens,
    wrapJustifiedLines,
    drawJustifiedPixelText,
    drawParchmentBox,
    drawGhostHandHint,
    isMobileOrTouch,
    drawVirtualTouchButton,
    SpriteBank,
    ActorAnimator,
    IrisTransition,
    DialogueBox,
    TutorialModal,
    GameHUD,
    StandardTutorialCards,
    playerProfile,
    getPlayerName,
    resolvePlayerText,
    setPlayerProfile
  };

  if (typeof global.addEventListener === 'function' && !global._crystalGodModeKeyBound) {
    global._crystalGodModeKeyBound = true;
    global.addEventListener('keydown', (e) => {
      if (!e || e.repeat) return;
      const isCtrlShiftG = e.ctrlKey && e.shiftKey && (e.key === 'G' || e.key === 'g' || e.code === 'KeyG');
      const isF9 = e.key === 'F9' || e.code === 'F9';
      if (isCtrlShiftG || isF9) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        GameHUD.toggleGodMode();
      }
    });
  }

  global.TruePixelEngine = TruePixelEngine;
})(typeof window !== 'undefined' ? window : globalThis);
