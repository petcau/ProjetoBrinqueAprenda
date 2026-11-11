/* Labirinto das runas: cruzamentos configuráveis (1024×434 _v3), câmara (1024×434) e portal; contrato onExit preservado. */
window.LabirintoPuzzle = (() => {
  'use strict';
  const base = 'assets/puzzles/labirinto/', cache = new Map(), art = {}, surfaces = [], runes = {};
  let ready, data, current, warning = '';

  // Tabela única símbolo -> arquivo de laje e cor característica
  const SLAB_MAP = {
    lua: { src: 'assets/puzzles/simbolos/laje-lua.webp', cor: '#38bdf8', nome: 'Lua' },
    estrela: { src: 'assets/puzzles/simbolos/laje-estrela.webp', cor: '#facc15', nome: 'Estrela' },
    flor: { src: 'assets/puzzles/simbolos/laje-flor.webp', cor: '#f472b6', nome: 'Flor' },
    pata: { src: 'assets/puzzles/simbolos/laje-pata.webp', cor: '#fb923c', nome: 'Pata' },
    borboleta: { src: 'assets/puzzles/simbolos/laje-borboleta.webp', cor: '#a855f7', nome: 'Borboleta' },
    folha: { src: 'assets/puzzles/simbolos/laje-folha.webp', cor: '#4ade80', nome: 'Folha' }
  };

  const SCENARIOS = [
    base + 'fase1_v3.webp',
    base + 'fase2_v3.webp',
    base + 'fase3_v3.webp',
    'assets/puzzles/chave/cena-chave.webp'
  ];

  function image(src) {
    if (!cache.has(src)) cache.set(src, new Promise(resolve => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => {
        console.warn(`[Labirinto] Ausente: ${src}. Placeholder ativado.`);
        resolve(null);
      };
      im.src = src;
    }));
    return cache.get(src);
  }

  // Sorteio puro: executado uma vez por tentativa, nunca durante o desenho.
  function makeAttempt(ids, crossings, previous) {
    const shuffle = window.LabirintoLogica.shuffle;
    const seq = previous || shuffle(ids).slice(0, crossings.length);
    const outside = ids.find(id => !seq.includes(id));
    const pedestals = crossings.map((crossing, i) => {
      const correct = seq[i], count = crossing.pedestais;
      const required = i === 0 ? outside : shuffle(seq.filter(id => id !== correct))[0];
      const rest = shuffle(ids.filter(id => id !== correct && id !== required));
      return shuffle([correct, required, ...rest.slice(0, count - 2)]);
    });
    return { seq, outside, pedestals };
  }

  function randomTest(ids, crossings) {
    try {
      for (let n = 0; n < 1000; n++) {
        const a = makeAttempt(ids, crossings);
        if (a.seq.length !== crossings.length || new Set(a.seq).size !== a.seq.length || !a.outside || a.seq.includes(a.outside)) throw Error('sequência ou runa de fora');
        for (let i = 0; i < crossings.length; i++) {
          const p = a.pedestals[i], correct = a.seq[i], distractors = p.filter(id => id !== correct);
          if (p.length !== crossings[i].pedestais || new Set(p).size !== p.length || p.filter(id => id === correct).length !== 1 || p.some(id => !ids.includes(id))) throw Error('pedestais do cruzamento ' + (i + 1));
          if (i === 0 ? distractors.length !== 1 || distractors[0] !== a.outside : !distractors.some(id => a.seq.includes(id))) throw Error('distratores do cruzamento ' + (i + 1));
        }
      }
      console.info('[Labirinto] PASSOU: 1000 gerações aleatórias.');
      return true;
    } catch (error) {
      console.error('[Labirinto] FALHOU: ' + error.message);
      return false;
    }
  }

  function prepare(input) {
    return ready ||= (async () => {
      const cfg = LABIRINTO_CONFIG, c = input.camara;
      data = {
        ...input,
        metrics: { ...input.metrics, footW: cfg.FOOT_W, footH: cfg.FOOT_H },
        camara: {
          ...c,
          pedestal: c.pedestal || { pe: [512, 240], altura: 0, raio: 0 },
          chave: {
            ...c.chave,
            centro: c.chave?.centro || [512, 218.2]
          }
        }
      };
      const L = window.LabirintoLogica, m = data.metrics, ids = data.runas.map(r => r.id);
      const crossings = data.LABIRINTO.CRUZAMENTOS;
      if (!crossings.length || crossings.length >= ids.length || LABIRINTO.MEM_S <= 0 ||
          crossings.some((r, i) => !Number.isInteger(r.cenario) || !data.fases[r.cenario - 1] ||
            !Number.isInteger(r.pedestais) || r.pedestais < 2 || r.pedestais > data.fases[r.cenario - 1].saidas.length || (i === 0 && r.pedestais !== 2))) {
        throw Error('Configuração de cruzamentos inválida.');
      }

      // Carrega as lajes dos símbolos e pré-gera os brilhos radiais
      await Promise.all(data.runas.map(async r => {
        const slabInfo = SLAB_MAP[r.id];
        const slabImage = slabInfo ? await image(slabInfo.src) : null;
        const cor = slabInfo ? slabInfo.cor : r.cor;
        const glow = document.createElement('canvas'); glow.width = glow.height = 200;
        const gc = glow.getContext('2d'), g = gc.createRadialGradient(100, 100, 10, 100, 100, 100);
        g.addColorStop(0, cor); g.addColorStop(1, cor + '00'); gc.fillStyle = g; gc.fillRect(0, 0, 200, 200);
        runes[r.id] = { ...r, cor, glow, slabImage, nome: slabInfo ? slabInfo.nome : r.nome };
      }));

      [art.hero, art.pedestal, art.key, art.bgCamara1x, art.bgCamara2x] = await Promise.all([
        image(`assets/${HERO_SHEET.src}`),
        image(base + 'pedestal_pedra.png'),
        image('assets/hud/chave_logica.png'),
        image('assets/puzzles/chave/cena-chave.webp'),
        image('assets/puzzles/chave/cena-chave-2x.webp')
      ]);

      if (art.pedestal) try {
        const im = art.pedestal, canvas = document.createElement('canvas');
        canvas.width = im.naturalWidth; canvas.height = im.naturalHeight;
        const ctx = canvas.getContext('2d'); ctx.drawImage(im, 0, 0);
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const removed = L.removeBlackBorder(pixels.data, canvas.width, canvas.height);
        ctx.putImageData(pixels, 0, 0); art.pedestal = canvas;
        if (removed) console.warn(`[Labirinto] Fundo quase preto removido em memória (${removed} pixels). Substitua pedestal_pedra.png por uma versão transparente.`);
      } catch (error) {
        console.warn('[Labirinto] Não foi possível ler os pixels do pedestal da câmara; usando marcador.', error);
        art.pedestal = null;
      }

      for (const name of ['portalGlow', 'keyGlow']) {
        const glow = art[name] = document.createElement('canvas'); glow.width = glow.height = 280;
        const gc = glow.getContext('2d'), g = gc.createRadialGradient(140, 140, 0, 140, 140, 140);
        g.addColorStop(0, name === 'portalGlow' ? '#c58bff' : '#8affb5');
        g.addColorStop(1, name === 'portalGlow' ? '#a855f700' : '#4ade8000');
        gc.fillStyle = g; gc.fillRect(0, 0, 280, 280);
      }

      const grades = window.LABIRINTO_GRADES;
      if (!grades) throw Error('Grades de colisão do labirinto não encontradas (js/labirinto-mascaras.js).');

      for (let n = 0; n < 4; n++) {
        const chamber = n === 3;
        const bg = chamber ? (art.bgCamara1x || await image(SCENARIOS[n])) : await image(SCENARIOS[n]);
        const mask = grades.getMask(n);
        if (!mask) throw Error(`Grade ${n + 1} ausente: impossível navegar sem colisão.`);

        const gInfo = grades.getInfo ? grades.getInfo(n) : { cols: chamber ? 256 : 128, rows: chamber ? 109 : 55, cell: chamber ? 4 : 8 };
        const W = gInfo.width || 1024;
        const H = gInfo.height || 434;

        // Overlay de depuração gerado via createImageData/putImageData (seguro em file://)
        const overlay = document.createElement('canvas'); overlay.width = gInfo.cols; overlay.height = gInfo.rows;
        const oc = overlay.getContext('2d'), imgData = oc.createImageData(gInfo.cols, gInfo.rows);
        for (let i = 0; i < mask.length; i++) {
          imgData.data[i * 4] = 0; imgData.data[i * 4 + 1] = 255; imgData.data[i * 4 + 2] = 0; imgData.data[i * 4 + 3] = mask[i] ? 75 : 0;
        }
        oc.putImageData(imgData, 0, 0);

        const config = chamber ? data.camara : data.fases[n];
        const spawn = config.spawn;
        const exits = chamber ? [] : config.saidas.map(e => ({ id: e.id, zone: e.zona, x: e.pe[0], y: e.pe[1], arco: e.arco }));
        const obstacle = null;
        const field = L.field(mask, gInfo.cols, gInfo.rows, gInfo.cell, m.footW, m.footH, obstacle, LABIRINTO_CONFIG.CORNER_NUDGE);
        const nav = L.grid(field, gInfo.cell, 0);
        const zones = chamber ? [config.soleira] : exits.map(e => e.zone);
        const failures = L.geometryTest(nav, spawn, zones, obstacle), label = chamber ? 'Câmara' : `Fase ${n + 1}`;
        if (chamber) {
          const path = L.path(nav, spawn[0], spawn[1], config.alvo[0], config.alvo[1]), end = path[path.length - 1];
          if (!end || Math.hypot(end.x - config.alvo[0], end.y - config.alvo[1]) > 2) failures.push('alvo final do portal sem acesso');
        }
        console[failures.length ? 'error' : 'info'](`[Labirinto] ${label}: ${failures.join('; ') || 'spawn, cobertura e BFS OK'}`);
        if (failures.length) throw Error(`${label}: ${failures.join('; ')}`);
        surfaces[n] = {
          bg, overlay, field, nav, spawn, exits, w: W, h: H,
          safeXMin: chamber ? W * 0.21 : W * 0.12,
          safeXMax: chamber ? W * 0.79 : W * 0.88,
          safeW: chamber ? W * 0.58 : W * 0.76,
          safeH: chamber ? H * 0.88 : H,
          safeYMin: chamber ? H * 0.06 : 0,
          safeYMax: chamber ? H * 0.94 : H
        };
      }
      console.info('[Labirinto] Pés 8×4; grade 8/4 px; cenários em 1024×434 (cover com zona segura); câmara com chave flutuante.');
    })().catch(error => { ready = null; throw error; });
  }

  function open(options = {}) {
    if (current) current(false);
    window.Music?.entrarNaCena?.('labirinto');
    const L = window.LabirintoLogica, cfg = LABIRINTO_CONFIG, m = data.metrics, c = data.camara, ids = data.runas.map(r => r.id), returnFocus = document.activeElement;
    const crossings = data.LABIRINTO.CRUZAMENTOS, N = crossings.length;
    const host = document.createElement('div'), frame = document.createElement('div'), canvas = document.createElement('canvas'), ctx = canvas.getContext('2d'), status = document.createElement('p');
    host.style.cssText = 'position:fixed;inset:0;z-index:1000;background:#0d1814;display:flex;justify-content:center;align-items:center;overflow:hidden;';
    frame.style.cssText = 'position:relative;width:100%;height:100%;overflow:hidden;';
    host.setAttribute('role', 'dialog'); host.setAttribute('aria-modal', 'true'); host.setAttribute('aria-label', 'Labirinto das runas');
    canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;'; canvas.tabIndex = 0;
    status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); status.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);';
    frame.appendChild(canvas); frame.appendChild(status); host.appendChild(frame); document.body.appendChild(host);

    const controls = [], labels = ['X', '↻', 'Já memorizei', 'E — Pegar a chave', '', ''];
    for (let i = 0; i < 6; i++) {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = labels[i];
      b.setAttribute('aria-label', i === 0 ? 'Sair do labirinto' : i === 1 ? 'Reiniciar com nova sequência' : i === 4 ? 'Ajuda: como jogar' : i === 5 ? 'Configurações' : labels[i]);
      if (i === 4) {
        b.className = 'puzzle-hud-help-btn';
        b.style.cssText = 'position:absolute;width:44px;height:44px;border:none;background:url("assets/tutorial/botao-ajuda-normal.webp") center/contain no-repeat transparent;cursor:pointer;padding:0;z-index:10;user-select:none;image-rendering:pixelated;';
        b.addEventListener('pointerdown', () => { if (!b.disabled) b.style.backgroundImage = 'url("assets/tutorial/botao-ajuda-pressionado.webp")'; });
        const restoreHelpBtn = () => { b.style.backgroundImage = 'url("assets/tutorial/botao-ajuda-normal.webp")'; };
        b.addEventListener('pointerup', restoreHelpBtn); b.addEventListener('pointerleave', restoreHelpBtn); b.addEventListener('pointercancel', restoreHelpBtn);
      } else if (i === 5) {
        b.className = 'puzzle-hud-gear-btn';
        b.style.cssText = 'position:absolute;width:44px;height:44px;border:none;background:url("assets/hud/configuracoes.png") center/contain no-repeat transparent;cursor:pointer;padding:0;z-index:10;user-select:none;image-rendering:pixelated;';
        b.setAttribute('title', 'Configurações');
      } else {
        b.style.cssText = 'position:absolute;min-height:44px;min-width:44px;border:2px solid #b9dc9a;border-radius:10px;background:#183a30ed;color:#fff5d7;font:inherit;font-size:16px;cursor:pointer;padding:6px 14px;z-index:10;user-select:none;';
      }
      b.onfocus = () => { b.style.outline = '3px solid #ffe591'; }; b.onblur = () => { b.style.outline = ''; };
      frame.appendChild(b); controls.push(b);
    }
    const font = getComputedStyle(document.body).fontFamily || 'sans-serif', calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches || Boolean(window.GameSettings?.calm);
    const SIMBOLO_ESCALA_NA_PRACA = options.simboloEscala ?? cfg.SIMBOLO_ESCALA_NA_PRACA ?? 0.62;
    const PERSONAGEM_ESCALA = options.personagemEscala ?? cfg.PERSONAGEM_ESCALA ?? 1.0;

    const hero = { x: 512, y: 400, dir: 3, moving: false, walk: 0, idle: 0 };
    const held = new Uint8Array(8), particles = new Float32Array(24 * 5), empty = [];
    const skipMem = Boolean(options.skipMemorize || (typeof location !== 'undefined' && location.search.includes('pular_memoria')));

    let s = 1, offsetX = 0, offsetY = 0, state = '', elapsed = 0, time = 0, last = 0, raf = 0, closed = false, debug = false, paused = false;
    let attempt, seq = [], ped = [], order = [], sequenceNames = '', debugLine = '', route = empty, waypoint = 0, chosen = -1, completed = 0;
    let phase = 0, f = surfaces[0], claimed = false, sparkColor = '#4ade80';
    let routeTime = 0, routeX = 0, routeY = 0, targetX = 0, targetY = 0, routeRetried = false;
    const slabFlags = { chosenHere: false, success: false, error: false, idle: false };
    const memoryFlags = { chosenHere: true }, dashed = [6, 6];
    const surfaceIndex = () => phase === N ? 3 : crossings[phase].cenario - 1;
    const isDebug = () => options.debug ? options.debug() : debug;
    const dirs = { arrowleft: 0, a: 1, arrowright: 2, d: 3, arrowup: 4, w: 5, arrowdown: 6, s: 7 };

    function openSettings() {
      if (paused) return;
      paused = true;
      held.fill(0); route = empty;
      if (window.openSettings) {
        window.openSettings(controls[5], () => { paused = false; controls[5].focus(); });
      } else if (window.SettingsBook) {
        window.SettingsBook.open('index');
        document.getElementById('book-dialog')?.showModal();
      }
    }

    function say(message) { status.textContent = message; canvas.setAttribute('aria-label', `${message} WASD/setas ou toque para andar. Escape sai. F3 depura; N avança com F3.`); }
    function canTake() {
      const discX = c.disco ? c.disco[0] : 512, discY = c.disco ? c.disco[1] : 239.6;
      return state === 'CAMARA_ANDAR' && !claimed && Math.hypot(hero.x - discX, hero.y - discY) <= (c.interacao || 39);
    }

    function change(next) {
      state = next; elapsed = 0; held.fill(0); route = empty; hero.walk = 0;
      const cardOpen = Boolean(window.TutorialCard?.isAberto?.());
      controls[2].hidden = next !== 'MEMORIZAR' || cardOpen; controls[2].disabled = true; controls[3].hidden = true;
      controls[4].disabled = (next !== 'ANDAR' && next !== 'CAMARA_ANDAR');
      controls[4].style.opacity = controls[4].disabled ? '0.45' : '1';
      controls[4].style.cursor = controls[4].disabled ? 'not-allowed' : 'pointer';
      if (next === 'MEMORIZAR') say('Memorize a ordem dos símbolos! ' + sequenceNames);
      else if (next === 'ANDAR') say(`Escolha o ${phase + 1}º símbolo da sequência!`);
      else if (next === 'ERRO') say('Ainda não é essa! Vamos recomeçar!');
      else if (next === 'FEEDBACK_CERTO') say(`Muito bem! Caminho ${completed} de ${N} concluído.`);
      else if (next === 'CAMARA_ANDAR') { window.Music?.entrarNaCena?.('camara'); say('Pegue a chave! Aproxime-se do pedestal.'); }
      else if (next === 'PEGAR_CHAVE') say('Chave encontrada!');
      else if (next === 'PORTAL') say('O portal está aberto! Vamos voltar à ilha.');
      else if (next === 'ENTRAR_PORTAL') say('Entrando no portal...');
    }

    function round(memorize = true) {
      f = surfaces[surfaceIndex()];
      ped = phase < N ? attempt.pedestals[phase] : empty;
      order = f.exits.slice(0, ped.length).map((_, i) => i).sort((a, b) => f.exits[a].y - f.exits[b].y);
      debugLine = `${phase === N ? "Câmara" : `cruz ${phase + 1}/${N}`} · S: ${sequenceNames} · correta: ${phase < N ? runes[seq[phase]].nome : "—"}`;
      hero.x = f.spawn[0]; hero.y = f.spawn[1]; hero.dir = 3; hero.idle = 0;
      chosen = -1; particles.fill(0);
      resize();
      change(phase === N ? 'CAMARA_ANDAR' : (memorize && !skipMem) ? 'MEMORIZAR' : 'ANDAR');
    }

    function restart() {
      attempt = makeAttempt(ids, crossings); seq = attempt.seq;
      sequenceNames = seq.map((id, i) => `${i + 1}: ${runes[id].nome}`).join(" → ");
      completed = phase = 0;
      claimed = false;
      round(!skipMem);
      canvas.focus();
    }

    function resize() {
      const vw = window.innerWidth, vh = window.innerHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(vw * dpr);
      canvas.height = Math.round(vh * dpr);

      const curF = f;
      const W = curF.w, H = curF.h;
      const coverScale = Math.max(canvas.width / W, canvas.height / H);
      const maxScaleSafe = Math.min(canvas.width / curF.safeW, canvas.height / (curF.safeH || H));
      s = Math.min(coverScale, maxScaleSafe);

      offsetX = (canvas.width - W * s) / 2;
      offsetY = (canvas.height - H * s) / 2;

      // Botões superiores (X, ↻, ? e ⚙) ancorados no topo direito seguro
      controls[0].style.top = '14px'; controls[0].style.right = '14px';
      controls[1].style.top = '14px'; controls[1].style.right = '70px';
      controls[4].style.top = '14px'; controls[4].style.right = '126px';
      controls[5].style.top = '14px'; controls[5].style.right = '182px';

      // Botão "Já memorizei" centralizado
      controls[2].style.left = '50%';
      controls[2].style.transform = 'translateX(-50%)';
      controls[2].style.top = `${Math.round((offsetY + (phase === N ? 518 : 310) * s) / dpr)}px`;
      controls[2].style.width = '200px';

      // Botão "Pegar chave"
      if (phase === N) {
        controls[3].style.left = `${Math.round((offsetX + c.chave.centro[0] * s) / dpr)}px`;
        controls[3].style.transform = 'translateX(-50%)';
        controls[3].style.top = `${Math.round((offsetY + (c.chave.centro[1] - c.chave.altura / 2 - 44) * s) / dpr)}px`;
        controls[3].style.width = '210px';
      }
    }

    function screenToGame(clientX, clientY) {
      const r = canvas.getBoundingClientRect();
      const px = (clientX - r.left) * (canvas.width / r.width);
      const py = (clientY - r.top) * (canvas.height / r.height);
      return {
        x: (px - offsetX) / s,
        y: (py - offsetY) / s
      };
    }

    function choose(index) {
      if (state !== 'ANDAR') return;
      chosen = index;
      if (ped[index] !== seq[phase]) { change('ERRO'); return; }
      completed = phase + 1; change('FEEDBACK_CERTO');
      const e = f.exits[index]; burst(e.x, e.y, runes[seq[phase]].cor);
    }

    function burst(x, y, color) {
      sparkColor = color;
      for (let i = 0; i < 24; i++) {
        const j = i * 5;
        particles[j] = x; particles[j + 1] = y;
        particles[j + 2] = (Math.random() - .5) * 170;
        particles[j + 3] = -30 - Math.random() * 100;
        particles[j + 4] = .9;
      }
    }

    function collect(dev = false) {
      if (state !== 'CAMARA_ANDAR' || claimed || (!dev && !canTake())) return;
      claimed = true; change('PEGAR_CHAVE');
      burst(c.chave.centro[0], c.chave.centro[1], '#4ade80');
      canvas.focus();
    }

    function follow(x, y, retry = false) {
      route = L.path(f.nav, hero.x, hero.y, x, y);
      waypoint = 0; targetX = x; targetY = y;
      routeX = hero.x; routeY = hero.y; routeTime = 0; routeRetried = retry;
    }

    function beginPortal() {
      change('PORTAL'); follow(c.alvo[0], c.alvo[1]);
      if (!route.length) {
        console.error('[Labirinto] Não foi possível traçar o caminho do portal.');
        claimed = false; change('CAMARA_ANDAR');
      }
    }

    function down(event) {
      if (paused || window.TutorialCard?.isAberto?.()) return;
      event.preventDefault();
      if (state !== 'ANDAR' && state !== 'CAMARA_ANDAR') return;
      const { x, y } = screenToGame(event.clientX, event.clientY);
      if (state === 'CAMARA_ANDAR') {
        const discX = c.disco ? c.disco[0] : 512, discY = c.disco ? c.disco[1] : 239.6;
        const keyX = c.chave.centro[0], keyY = c.chave.centro[1];
        if (Math.hypot(x - discX, y - discY) <= (c.interacao || 39) ||
            (Math.abs(x - keyX) <= 45 && Math.abs(y - keyY) <= c.chave.altura / 2 + 10)) {
          collect(); return;
        }
      }
      follow(x, y); canvas.focus();
    }

    function key(event) {
      if (window.TutorialCard?.isAberto?.()) return;
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      const k = event.key.toLowerCase(); event.stopImmediatePropagation();
      if (k === 'escape') { event.preventDefault(); openSettings(); return; }
      if (paused) return;
      if (k === 'tab') {
        event.preventDefault(); let i = controls.indexOf(document.activeElement);
        const step = event.shiftKey ? -1 : 1;
        for (let n = 0; n < controls.length; n++) {
          i = (i + step + controls.length) % controls.length;
          if (!controls[i].hidden && !controls[i].disabled) { controls[i].focus(); break; }
        }
        return;
      }
      if ((k === 'enter' || k === ' ') && controls.includes(event.target)) return;
      event.preventDefault();
      if (k in dirs) {
        if (state === 'ANDAR' || state === 'CAMARA_ANDAR') { held[dirs[k]] = 1; route = empty; }
        return;
      }
      if (event.repeat) return;
      if (k === 'f3') {
        if (options.toggleDebug) options.toggleDebug(); else debug = !debug;
        if (isDebug()) randomTest(ids, crossings);
      }
      else if ((k === 'e' || k === 'enter') && state === 'CAMARA_ANDAR') collect();
      else if (k === 'n' && isDebug()) {
        if (state === 'CAMARA_ANDAR') collect(true);
        else if (state === 'ANDAR' || state === 'MEMORIZAR') {
          if (state === 'MEMORIZAR') change('ANDAR');
          choose(ped.indexOf(seq[phase]));
        }
      }
    }

    function up(event) {
      const k = event.key.toLowerCase();
      if (k in dirs) { event.preventDefault(); event.stopImmediatePropagation(); held[dirs[k]] = 0; }
    }

    function blur() { held.fill(0); if (state !== 'PORTAL') route = empty; last = 0; }

    function close(won = false) {
      if (closed) return;
      closed = true; held.fill(0); route = empty;
      if (window.ActivePuzzle?.type === 'labirinto') window.ActivePuzzle = null;
      if (window.TutorialCard?.isAberto?.()) window.TutorialCard.fechar();
      window.Music?.sairDaCena?.('labirinto');
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', down);
      document.removeEventListener('keydown', key, true);
      document.removeEventListener('keyup', up, true);
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
      if (window.visualViewport) window.visualViewport.removeEventListener('resize', resize);
      window.removeEventListener('blur', blur);
      host.remove(); current = null; returnFocus?.focus();
      options.onExit?.(won);
    }

    function walk(dt) {
      let vx = Number(held[2] || held[3]) - Number(held[0] || held[1]);
      let vy = Number(held[6] || held[7]) - Number(held[4] || held[5]);
      let distance = m.speed * dt;
      const following = !vx && !vy && waypoint < route.length;
      if (!vx && !vy && waypoint < route.length) {
        const p = route[waypoint];
        vx = p.x - hero.x; vy = p.y - hero.y;
        const d = Math.hypot(vx, vy);
        if (d < .5) { waypoint++; return; }
        distance = Math.min(distance, d);
      }
      const len = Math.hypot(vx, vy), x = hero.x, y = hero.y;
      if (len) {
        L.move(f.field, hero, vx / len * distance, vy / len * distance);
        hero.dir = Math.abs(vx) > Math.abs(vy) ? vx < 0 ? 1 : 2 : vy < 0 ? 3 : 0;
      }
      const moving = Math.hypot(hero.x - x, hero.y - y) > .001;
      hero.walk = moving ? Math.max(1, hero.walk + dt * 60) : 0;
      hero.idle = moving ? 0 : hero.idle + dt * 60;
      if (following && state !== 'PORTAL' && (routeTime += dt) >= .5) {
        if (Math.hypot(hero.x - routeX, hero.y - routeY) < 1) {
          if (routeRetried) route = empty; else follow(targetX, targetY, true);
        }
        routeX = hero.x; routeY = hero.y; routeTime = 0;
      }
      if (state === 'ANDAR') for (let i = 0; i < ped.length; i++) {
        if (L.hit(hero, f.exits[i].zone, m.footW, m.footH)) { choose(i); break; }
      }
      if (state === 'CAMARA_ANDAR' && canTake()) {
        collect();
      }
    }

    function update(dt) {
      if (paused || window.TutorialCard?.isAberto?.()) {
        if (state === 'MEMORIZAR') controls[2].hidden = true;
        return;
      }
      if (state === 'MEMORIZAR' && controls[2].hidden) controls[2].hidden = false;
      time += dt; elapsed += dt;
      if (state === 'MEMORIZAR') {
        controls[2].disabled = elapsed < 1.5;
        if (elapsed >= LABIRINTO.MEM_S) change('ANDAR');
      } else if (state === 'ANDAR' || state === 'CAMARA_ANDAR') walk(dt);
      else if (state === 'FEEDBACK_CERTO' && elapsed >= .9) change('ESCURECER_CERTO');
      else if (state === 'ERRO' && elapsed >= 1.1) change('ESCURECER_ERRO');
      else if (state === 'ESCURECER_ERRO' && elapsed >= .4) {
        completed = phase = 0; claimed = false;
        attempt = makeAttempt(ids, crossings, data.LABIRINTO.ERRO_NOVA_SEQUENCIA ? null : seq); seq = attempt.seq;
        sequenceNames = seq.map((id, i) => `${i + 1}: ${runes[id].nome}`).join(' → ');
        round();
      } else if (state === 'ESCURECER_CERTO' && elapsed >= .4) change('TRANSICAO');
      else if (state === 'TRANSICAO' && elapsed >= 1) { phase++; round(false); }
      else if (state === 'PEGAR_CHAVE' && elapsed >= .8) beginPortal();
      else if (state === 'PORTAL') {
        walk(dt);
        if (waypoint >= route.length && L.hit(hero, c.soleira, m.footW, m.footH)) change('ENTRAR_PORTAL');
      } else if (state === 'ENTRAR_PORTAL' && elapsed >= .6) change('BRANCO');
      else if (state === 'BRANCO' && elapsed >= .4) { close(true); return; }

      controls[3].hidden = !canTake();
      for (let i = 0; i < 24; i++) {
        const j = i * 5;
        if (particles[j + 4] > 0) {
          particles[j] += particles[j + 2] * dt;
          particles[j + 1] += particles[j + 3] * dt;
          particles[j + 4] -= dt;
        }
      }
    }

    function text(value, x, y, size = 26, color = '#fff5d7') {
      ctx.fillStyle = color; ctx.font = `bold ${size}px ${font}`;
      ctx.textAlign = 'center'; ctx.fillText(value, x, y);
    }
    function panel(x, y, w, h, r = 16) {
      ctx.fillStyle = '#112b26df'; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
      ctx.strokeStyle = '#b9dc9a'; ctx.lineWidth = 2; ctx.stroke();
    }

    // Desenha uma laje de símbolo assentada no quadrado de pedra do cenário
    // Largura = 62% do quadrado de pedra (~74 px em 1024 px = ~46 px), centralizada pela face de cima
    function drawSlab(id, x, y, customWidth = null, alpha = 1, opts = memoryFlags) {
      const r = runes[id]; if (!r) return;
      const img = r.slabImage;
      const { chosenHere = false, success = false, error = false, idle = false } = opts;
      const stateScale = (chosenHere || success) ? 1.05 : 1.0;
      const stoneW = phase === N ? 137.6 : 74;
      const baseW = customWidth || (stoneW * SIMBOLO_ESCALA_NA_PRACA);
      const w = baseW * stateScale;
      const h = img ? w * (img.naturalHeight / img.naturalWidth) : w;
      const left = x - w / 2;
      const top = y - (img ? h * 0.44 : h / 2);

      const glowSize = w * 1.8;
      if (chosenHere || success) {
        ctx.save(); ctx.globalAlpha = alpha * .95;
        ctx.drawImage(r.glow, x - glowSize / 2, y - glowSize / 2, glowSize, glowSize);
        ctx.restore();
      } else if (idle && !calm) {
        ctx.save(); ctx.globalAlpha = alpha * (.28 + .08 * Math.sin(2.2 * time + x));
        const idleGlow = w * 1.4;
        ctx.drawImage(r.glow, x - idleGlow / 2, y - idleGlow / 2, idleGlow, idleGlow);
        ctx.restore();
      }

      ctx.save(); ctx.globalAlpha = alpha;
      const smooth = (options.smooth !== undefined) ? options.smooth : (window._TEST_SMOOTH !== undefined ? window._TEST_SMOOTH : true);
      ctx.imageSmoothingEnabled = smooth;
      if (smooth) ctx.imageSmoothingQuality = 'high';

      if (img) {
        ctx.drawImage(img, left, top, w, h);
      } else {
        ctx.fillStyle = r.cor; ctx.fillRect(left, top, w, h);
        text(r.nome, x, y + 5, 15, '#102820');
      }

      if (error) {
        ctx.fillStyle = '#ff384b88';
        ctx.fillRect(left, top, w, h);
      }
      ctx.restore();
    }

    function stone(x, y, height) {
      ctx.imageSmoothingEnabled = true;
      if (art.pedestal) {
        const w = height * art.pedestal.width / art.pedestal.height;
        ctx.drawImage(art.pedestal, x - w / 2, y - height, w, height);
      } else text('?', x, y - height / 2, height * .6, '#ffe591');
    }

    function pedestal(index) {
      const e = f.exits[index], chosenHere = chosen === index, success = completed > phase;
      const alpha = success && !chosenHere ? .35 : 1;
      const isError = chosenHere && state === 'ERRO' && elapsed < .3;
      const shake = !calm && isError ? Math.sin(elapsed * 90) * 4 : 0;
      const x = e.x + shake, y = e.y;
      slabFlags.chosenHere = chosenHere && (state === 'FEEDBACK_CERTO' || success);
      slabFlags.success = success && chosenHere; slabFlags.error = isError;
      slabFlags.idle = state === 'ANDAR';
      drawSlab(ped[index], x, y, null, alpha, slabFlags);
    }

    function keyArt() {
      if (claimed && state !== 'PEGAR_CHAVE') return;
      const t = state === 'PEGAR_CHAVE' ? Math.min(1, elapsed / .8) : 0;
      const x = c.chave.centro[0];
      const osc = calm ? 0 : Math.sin(time * 2.618) * (c.chave.flutuacao || 5.2);
      const y = c.chave.centro[1] + osc - 48 * t;
      const height = c.chave.altura || 61;
      const width = height * (art.key?.naturalWidth || 229) / (art.key?.naturalHeight || 482);
      const size = 130 + 70 * t;

      // Sombra projetada no chão da vaga central (elipse suave pulsando em ritmo inverso à flutuação)
      const discX = c.disco ? c.disco[0] : 512;
      const discY = c.disco ? c.disco[1] : 239.6;
      const shadowFactor = calm ? 0 : Math.sin(time * 2.618);
      const shadowScale = 1 - 0.08 * shadowFactor;
      const shadowAlpha = Math.max(0, 0.28 * (1 - 0.15 * shadowFactor) * (1 - t));
      ctx.save();
      ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
      ctx.beginPath();
      ctx.ellipse(discX, discY, 20.3 * shadowScale, 7.0 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Brilho suave ao redor da chave
      ctx.globalAlpha = (1 - t) * (calm ? .35 : .35 + .1 * Math.sin(time * 2.618));
      ctx.drawImage(art.keyGlow, x - size / 2, y - size / 2, size, size);
      ctx.globalAlpha = 1 - t;

      // Chave verde de trevo
      if (art.key) ctx.drawImage(art.key, x - width / 2, y - height / 2, width, height);
      else { ctx.fillStyle = '#4ade80'; ctx.fillRect(x - 8, y - 32, 16, 64); ctx.fillRect(x, y + 20, 22, 8); }
      ctx.globalAlpha = 1;
    }

    function portalArt() {
      const r = c.portal.raio, x = c.portal.centro[0], y = c.portal.centro[1];
      ctx.globalAlpha = claimed ? (calm ? .55 : .55 + .1 * Math.sin(time * 3)) : (calm ? .20 : .20 + .06 * Math.sin(time * 2));
      ctx.drawImage(art.portalGlow, x - r, y - r, r * 2, r * 2);
      ctx.globalAlpha = 1;
    }

    function player() {
      if (state === 'BRANCO') return;
      const t = state === 'ENTRAR_PORTAL' ? Math.min(1, elapsed / .6) : 0;
      const hs = HERO_SHEET;
      const scale = (m.heroH / hs.frameH * Math.max(.001, 1 - t)) * PERSONAGEM_ESCALA;
      const col = window.HeroAnimation ? window.HeroAnimation.column(hero, calm) : 0;
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = '#10251d77';
      ctx.beginPath();
      ctx.ellipse(hero.x, hero.y, 16 * (1 - t) * PERSONAGEM_ESCALA, 6 * (1 - t) * PERSONAGEM_ESCALA, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.imageSmoothingEnabled = false;
      if (art.hero) {
        ctx.drawImage(art.hero, col * hs.frameW, hero.dir * hs.frameH, hs.frameW, hs.frameH,
          hero.x - hs.pivotX * scale, hero.y - hs.pivotY * scale, hs.frameW * scale, hs.frameH * scale);
      } else {
        ctx.fillStyle = '#efba78';
        ctx.fillRect(hero.x - 15 * (1 - t) * PERSONAGEM_ESCALA, hero.y - m.heroH * (1 - t) * PERSONAGEM_ESCALA,
          30 * (1 - t) * PERSONAGEM_ESCALA, m.heroH * (1 - t) * PERSONAGEM_ESCALA);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.globalAlpha = 1;
    }

    function draw() {
      const W = f.w, H = f.h;
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // Fundo: usa 2x quando largura de exibição passar de 1100 px na câmara
      const activeBg = (phase === N)
        ? ((canvas.width > 1100 && art.bgCamara2x) ? art.bgCamara2x : (art.bgCamara1x || f.bg))
        : f.bg;

      // Preenchimento de fundo borrado e escurecido (nunca faixas pretas ou vazias)
      if (activeBg && (offsetY > 0 || offsetX > 0)) {
        ctx.save();
        ctx.filter = 'blur(16px) brightness(0.4)';
        const coverScale = Math.max(canvas.width / W, canvas.height / H);
        const bgW = W * coverScale, bgH = H * coverScale;
        ctx.drawImage(activeBg, (canvas.width - bgW) / 2, (canvas.height - bgH) / 2, bgW, bgH);
        ctx.restore();
      } else {
        ctx.fillStyle = '#101c19';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Palco centralizado com escala única
      ctx.setTransform(s, 0, 0, s, offsetX, offsetY);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.clip();

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      if (activeBg) ctx.drawImage(activeBg, 0, 0, W, H);
      else { ctx.fillStyle = '#304e39'; ctx.fillRect(0, 0, W, H); }

      let drawn = false;
      if (phase === N) {
        portalArt();
        const discY = c.disco ? c.disco[1] : 239.6;
        if (hero.y < discY) { player(); drawn = true; }
        keyArt();
      } else {
        for (let i = 0; i < order.length; i++) {
          const n = order[i];
          if (!drawn && hero.y < f.exits[n].y) { player(); drawn = true; }
          pedestal(n);
        }
      }
      if (!drawn) player();

      for (let i = 0; i < 24 && !calm; i++) {
        const j = i * 5;
        if (particles[j + 4] > 0) {
          ctx.globalAlpha = particles[j + 4] / .9;
          ctx.fillStyle = sparkColor;
          ctx.fillRect(particles[j], particles[j + 1], 4, 4);
        }
      }
      ctx.globalAlpha = 1;

      // Depuração F3
      if (options.debug ? options.debug() : debug) {
        ctx.drawImage(f.overlay, 0, 0, W, H);
        ctx.lineWidth = 2;
        for (let i = 0; i < ped.length; i++) {
          const e = f.exits[i], z = e.zone;
          ctx.strokeStyle = ped[i] === seq[phase] ? '#28ff35' : '#ffe230';
          ctx.strokeRect(z[0], z[1], z[2], z[3]);
          text(runes[ped[i]].nome + (ped[i] === seq[phase] ? ' — CORRETA' : ''), e.x, z[1] - 12, 16, ctx.strokeStyle);
          ctx.fillStyle = '#ff42d0'; ctx.fillRect(e.x - 4, e.y - 4, 8, 8);
          if (e.arco) {
            ctx.strokeStyle = '#38bdf8';
            ctx.strokeRect(e.arco[0] - 16, e.arco[1] - 16, 32, 32);
          }
        }
        if (phase === N) {
          const discX = c.disco ? c.disco[0] : 512, discY = c.disco ? c.disco[1] : 239.6;
          ctx.strokeStyle = '#28ff35'; ctx.beginPath(); ctx.arc(discX, discY, c.interacao || 39, 0, Math.PI * 2); ctx.stroke();
          ctx.strokeStyle = '#ffe230'; ctx.strokeRect(c.soleira[0], c.soleira[1], c.soleira[2], c.soleira[3]);
          ctx.strokeStyle = '#c58bff'; ctx.beginPath(); ctx.arc(c.portal.centro[0], c.portal.centro[1], c.portal.raio, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.strokeStyle = '#fff'; ctx.strokeRect(hero.x - m.footW / 2, hero.y - m.footH / 2, m.footW, m.footH);
        ctx.fillStyle = '#fff'; ctx.fillRect(f.spawn[0] - 4, f.spawn[1] - 4, 8, 8);

        // Indicador de zona segura
        ctx.strokeStyle = '#ff880088'; ctx.lineWidth = 1; ctx.setLineDash(dashed);
        ctx.strokeRect(f.safeXMin, f.safeYMin || 0, f.safeW, f.safeH || H);
        ctx.setLineDash(empty);

        panel(12, H - 46, W - 24, 36);
        text(`${debugLine} · (${hero.x.toFixed(1)}, ${hero.y.toFixed(1)}) · N avança`, W / 2, H - 23, 15);
      }

      // Tela de memorização (só acende depois que o cartão de tutorial fecha)
      const tutorialAberto = Boolean(window.TutorialCard?.isAberto?.());
      if (state === 'MEMORIZAR' && !tutorialAberto) {
        ctx.fillStyle = '#000000a8'; ctx.fillRect(0, 0, W, H);
        const spacing = Math.min(140, (W * 0.76 - 74) / Math.max(1, N - 1));
        const startX = W / 2 - (N - 1) * spacing / 2;
        const slabY = H * 0.44;
        for (let i = 0; i < N; i++) {
          const sx = startX + i * spacing;
          drawSlab(seq[i], sx, slabY, 74, 1, memoryFlags);
          text(`${i + 1}ª`, sx, slabY + 54, 22);
        }
        const barW = Math.min(360, W * 0.4);
        ctx.fillStyle = '#d8e7c444'; ctx.fillRect(W / 2 - barW / 2, slabY + 76, barW, 8);
        ctx.fillStyle = '#b4ed92'; ctx.fillRect(W / 2 - barW / 2, slabY + 76, barW * Math.max(0, 1 - elapsed / LABIRINTO.MEM_S), 8);
      }

      // Cabeçalho da fase
      const compact = surfaceIndex() === 1 || surfaceIndex() === 2;
      const headerY = compact ? 8 : 12;
      const headerW = phase === N ? 560 : 440;
      panel(W / 2 - headerW / 2, headerY, headerW, 36);
      text(state === 'MEMORIZAR' ? 'Memorize a ordem das runas!' : phase === N ? (claimed ? 'Chave conquistada!' : 'Pegue a chave!') : `Escolha o ${phase + 1}º símbolo da sequência!`,
        W / 2, headerY + 24, compact ? 17 : 19);

      // Indicadores circulares de progresso
      for (let i = 0; i < N; i++) {
        ctx.beginPath(); ctx.arc(28 + i * 30, 24, 10, 0, Math.PI * 2);
        ctx.fillStyle = i < completed ? '#4ade80' : '#14362ddd'; ctx.fill();
        ctx.strokeStyle = '#a5dfac'; ctx.lineWidth = 2; ctx.stroke();
      }

      // Mensagens de erro ou acerto
      if (state === 'ERRO' || state === 'FEEDBACK_CERTO') {
        const msgW = state === 'ERRO' ? 520 : 420;
        panel(W / 2 - msgW / 2, H * 0.72, msgW, 46);
        text(state === 'ERRO' ? 'Ainda não é essa! Vamos recomeçar!' : 'Muito bem! Caminho encontrado!', W / 2, H * 0.72 + 30, 21);
      }
      if (state === 'ESCURECER_CERTO' || state === 'ESCURECER_ERRO') {
        ctx.fillStyle = `rgba(0,0,0,${Math.min(1, elapsed / .4)})`; ctx.fillRect(0, 0, W, H);
      }
      if (state === 'TRANSICAO') {
        ctx.fillStyle = '#0b1c18'; ctx.fillRect(0, 0, W, H);
        text(completed === N ? 'Câmara da chave' : `Fase ${completed + 1} de ${N}`, W / 2, H / 2, 32);
      }
      if (warning) {
        ctx.fillStyle = '#17271deb'; ctx.fillRect(0, H - 16, W, 16);
        text(warning, W / 2, H - 4, 12, '#ffe59f');
      }
      ctx.restore();

      if (state === 'BRANCO') {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = `rgba(255,255,255,${Math.min(1, elapsed / .4)})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    function loop(stamp) {
      if (closed) return;
      if (paused) { last = stamp; raf = requestAnimationFrame(loop); return; }
      const dt = last ? Math.min(.05, (stamp - last) / 1000) : 0;
      last = stamp;
      update(dt);
      if (closed) return;
      draw();
      raf = requestAnimationFrame(loop);
    }

    controls[0].onclick = () => close(false);
    controls[1].onclick = restart;
    controls[2].onclick = () => { if (state === 'MEMORIZAR' && elapsed >= 1.5) { change('ANDAR'); canvas.focus(); } };
    controls[3].onclick = () => collect();
    controls[4].onclick = () => {
      if (controls[4].disabled) return;
      held.fill(0); route = empty;
      window.TutorialCard?.abrir?.('logica', {
        onFechar: () => { canvas.focus(); }
      });
    };
    controls[5].onclick = () => openSettings();

    canvas.addEventListener('pointerdown', down);
    document.addEventListener('keydown', key, true);
    document.addEventListener('keyup', up, true);
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
    window.addEventListener('blur', blur);

    current = close;
    window.ActivePuzzle = { type: 'labirinto', close: () => close(false), pause: () => { paused = true; }, resume: () => { paused = false; }, get active() { return Boolean(current); } };
    restart();
    if (isDebug()) randomTest(ids, crossings);
    resize();
    const tutorialAbriu = window.TutorialCard?.verificarEabrir?.('logica', {
      onFechar: () => {
        if (state === 'MEMORIZAR') controls[2].hidden = false;
        canvas.focus();
      }
    });
    if (tutorialAbriu && state === 'MEMORIZAR') controls[2].hidden = true;
    if (!tutorialAbriu) canvas.focus();
    raf = requestAnimationFrame(loop);
  }

  return { prepare, open, close: () => close(false), pause: () => { paused = true; }, resume: () => { paused = false; }, get active() { return Boolean(current); } };
})();
