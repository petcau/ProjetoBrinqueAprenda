/* =========================================================================
   GAME MANAGER DO LABIRINTO DA MEMÓRIA (MemoryMazeGame)
   Projeto: Ilha do Conhecimento
   Responsabilidade:
   - Máquina de estados completa do minigame de Raciocínio Lógico.
   - Estado 0: Memorização com painel de madeira/folhas em tela cheia e barra decrescente de 4s.
   - Estado 1: Bifurcação (2 caminhos).
   - Estado 2: Trifurcação (3 caminhos).
   - Estado 3: Quadrifurcação (4 caminhos).
   - Estado 4: Câmara da Chave & Portal Roxo místico.
   - TriggerReset(): som de erro, screen-shake, partículas de folhas, teleporte e novo sorteio.
   - Animação "Key Hold" e retorno automático ao mapa principal da ilha via portal.
   ========================================================================= */

window.MemoryMazeGame = (() => {
  'use strict';

  // Constantes de design e física
  const DESIGN_W = 1376;
  const DESIGN_H = 768;
  const PLAYER_SPEED = 220; // pixels por segundo
  const PLAYER_RADIUS = 18;

  /* Regras atuais (design 1376×768): fases 1/2/3 têm 2/3/4 caminhos e pedestais.
     São 6 runas; cada tentativa sorteia 3 distintas, uma por fase, exibidas por 4s.
     Errar reinicia a fase 1, sorteia outra sequência e reabre a memorização de 4s.
     Os 3 corações do HUD são decorativos; não há vidas nem limite de tentativas.
     Acertar avança com fade; após a terceira runa, entra na câmara da chave.
     Movimento: 220 px/s, diagonal normalizada; pés 36x36 nas máscaras das fases.
     A câmara mantém círculo de raio 18, paredes e bloqueio final de raio 28.
     Spawn: fases 1–3 (688,670); câmara (688,660), sempre olhando para cima.
     Chave: E/Enter/Espaço a até 65 de (688,425); comemoração de 2,4s ativa portal.
     Portal: entrar a até 50 de (688,145) após ativá-lo conclui e retorna à ilha. */

  // Estado global do GameManager acessível externamente
  const gameManager = {
    hasLogicKey: false,
    activeRun: null
  };

  // Cache de imagens carregadas
  const assets = {
    ready: false,
    bg1: null,
    bg2: null,
    bg3: null,
    bgChamber: null,
    runeSheet: null,
    pedestal: null,
    heroSheet: null,
    keyImg: null,
    catFace: null
  };

  // Áudio Sintetizado Web Audio
  let audioCtx = null;
  function getAudioContext() {
    if (getVolume() === 0) return null;
    if (!audioCtx) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (Audio) audioCtx = new Audio();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function getVolume() {
    if (window.GameSettings?.get('mute')) return 0;
    const vol = window.GameSettings?.get('sound') ?? 70;
    return (vol / 100) * 0.22;
  }

  function soundSuccess() {
    const ctx = getAudioContext();
    if (!ctx) return;
    const v = getVolume();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(v, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.26);
    });
  }

  function soundError() {
    const ctx = getAudioContext();
    if (!ctx) return;
    const v = getVolume() * 1.25;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.35);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(v, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.37);
  }

  function soundKeyFanfare() {
    const ctx = getAudioContext();
    if (!ctx) return;
    const v = getVolume() * 1.35;
    const now = ctx.currentTime;
    const chord = [392.00, 523.25, 659.25, 783.99, 1046.5]; // G4, C5, E5, G5, C6
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(v, now + idx * 0.06 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.85);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.86);
    });
  }

  function soundPortalWarp() {
    const ctx = getAudioContext();
    if (!ctx) return;
    const v = getVolume() * 1.15;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.7);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.linearRampToValueAtTime(2400, now + 0.7);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(v, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.76);
  }

  /* -------------------------------------------------------------------------
     CARREGAMENTO E PRÉ-PROCESSAMENTO DE ASSETS
     ------------------------------------------------------------------------- */
  function loadImage(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn(`[Labirinto] Imagem não encontrada: ${src}; usando fallback.`);
        resolve(null);
      };
      img.src = src;
    });
  }

  let preparePromise = null;
  function prepare() {
    return preparePromise ||= (async () => {
      const [bg1, bg2, bg3, bgChamber, runeSheet, pedestal, heroSheet, keyImg, catFace] = await Promise.all([
        loadImage('assets/puzzles/labirinto/fase1_v2.webp'),
        loadImage('assets/puzzles/labirinto/fase2_v2.webp'),
        loadImage('assets/puzzles/labirinto/fase3_v2.webp'),
        loadImage('assets/puzzles/labirinto/camara_chave_bg.jpg'),
        loadImage('assets/puzzles/labirinto/runas_sheet.jpg'),
        loadImage('assets/puzzles/labirinto/pedestal_pixel.png'),
        loadImage('assets/personagem/menina-caminhada-8.png'),
        loadImage('assets/hud/chave_logica.png'),
        loadImage('assets/hud/gato-rosto.png')
      ]);

      assets.bg1 = bg1;
      assets.bg2 = bg2;
      assets.bg3 = bg3;
      assets.bgChamber = bgChamber;
      assets.runeSheet = runeSheet;
      assets.pedestal = pedestal;
      assets.heroSheet = heroSheet;
      assets.keyImg = keyImg;
      assets.catFace = catFace;

      await MazeTriggerSystem.prepareMasks(PLAYER_RADIUS);
      assets.ready = true;
      return true;
    })();
  }

  /* -------------------------------------------------------------------------
     ABERTURA DA CENA DO LABIRINTO (open)
     ------------------------------------------------------------------------- */
  let activeInstance = null;

  function open(options = {}) {
    if (activeInstance) {
      activeInstance.close();
    }
    gameManager.hasLogicKey = false;

    // Garante que o carregamento esteja em andamento
    if (!assets.ready) {
      prepare();
    }

    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
                 Boolean(window.GameSettings?.calm);

    // Contêiner em tela cheia com overlay limpo
    const host = document.createElement('div');
    host.id = 'memory-maze-container';
    host.style.cssText = 'position:fixed;inset:0;z-index:2000;background:#0d140e;display:flex;align-items:center;justify-content:center;overflow:hidden;user-select:none;';
    host.setAttribute('role', 'dialog');
    host.setAttribute('aria-modal', 'true');
    host.setAttribute('aria-label', 'Labirinto da Memória — Desafio de Raciocínio Lógico');

    const canvas = document.createElement('canvas');
    canvas.tabIndex = 0;
    canvas.style.cssText = 'display:block;max-width:100%;max-height:100%;aspect-ratio:1376/768;image-rendering:pixelated;outline:none;';
    canvas.setAttribute('aria-label', 'Tela do labirinto. Use WASD ou setas para mover, E para interagir, Escape para sair.');
    host.appendChild(canvas);

    // Botão de fechar (Esc) no topo direito
    const exitBtn = document.createElement('button');
    exitBtn.innerHTML = '✕';
    exitBtn.setAttribute('aria-label', 'Sair do labirinto');
    exitBtn.style.cssText = 'position:absolute;top:16px;right:20px;width:44px;height:44px;font-size:24px;font-weight:bold;color:#fdf6e2;background:#241d13cc;border:2px solid #8e724a;border-radius:10px;cursor:pointer;z-index:10;display:flex;align-items:center;justify-content:center;transition:background 0.2s;';
    exitBtn.onmouseover = () => { exitBtn.style.background = '#8e2d27'; };
    exitBtn.onmouseout = () => { exitBtn.style.background = '#241d13cc'; };
    exitBtn.onclick = () => close(false);
    host.appendChild(exitBtn);

    document.body.appendChild(host);

    const ctx = canvas.getContext('2d');

    // ---------------- MÁQUINA DE ESTADOS DO LABIRINTO ----------------
    // 0: ESTADO 0 - MEMORIZAÇÃO INICIAL (Painel em tela cheia e barra de 4s)
    // 1: ESTADO 1 - BIFURCAÇÃO (2 caminhos)
    // 2: ESTADO 2 - TRIFURCAÇÃO (3 caminhos)
    // 3: ESTADO 3 - QUADRIFURCAÇÃO (4 caminhos)
    // 4: ESTADO 4 - CÂMARA DA CHAVE & PORTAL
    // 5: ESTADO KEY_HOLD - PERSONAGEM ERGUE A CHAVE
    let state = 0;
    let targetSequence = []; // 3 runas sem repetição sorteadas
    let currentRound = null;
    let memorizeTimer = 4.0;
    const MEMORIZE_DURATION = 4.0;

    // Jogador
    const player = {
      x: 688,
      y: 670,
      dir: 'up', // 'down', 'left', 'right', 'up'
      moving: false,
      canMove: false,
      walk: 0,
      idle: 0,
      steps: 0,
      prog: 0,
      dur: 16
    };

    // Controle de Teclado
    const keysDown = { up: false, down: false, left: false, right: false };

    // Partículas e Efeitos Visuais
    let leafParticles = [];
    let sparkleParticles = [];
    let portalParticles = [];
    let screenShake = { duration: 0, intensity: 0, elapsed: 0 };
    let fade = { alpha: 0, target: 0, speed: 3.0, callback: null };
    let banner = { show: false, text: '', subtext: '' };
    let keyCollected = false;
    let keyHoldTimer = 0;
    let portalActive = false;
    let isTransitioning = false;
    let closed = false;
    let animationFrame = 0;
    let lastTime = 0;
    let debug = false, debugFps = 0, debugSequence = '';

    /* -------------------------------------------------------------------------
       SORTEIO DA SEQUÊNCIA ALVO (3 Runas sem repetição)
       ------------------------------------------------------------------------- */
    function drawNewTargetSequence() {
      const runes = MazeTriggerSystem.RUNES;
      targetSequence = MazeTriggerSystem.shuffle(runes).slice(0, 3);
      debugSequence = targetSequence.map(id => MazeTriggerSystem.RUNE_INFO[id].label).join(' → ');
      console.info(`[Labirinto] Nova targetSequence:`, targetSequence);
    }

    /* -------------------------------------------------------------------------
       INICIALIZAÇÃO DO ESTADO 0: MEMORIZAÇÃO INICIAL
       ------------------------------------------------------------------------- */
    function startMemorization() {
      state = 0;
      memorizeTimer = MEMORIZE_DURATION;
      player.canMove = false;
      player.moving = false;

      // Configura a Fase 1 previamente nos bastidores
      currentRound = MazeTriggerSystem.setupPhase(1, targetSequence[0]);
      player.x = currentRound.spawn.x;
      player.y = currentRound.spawn.y;
      player.dir = 'up';
    }

    /* -------------------------------------------------------------------------
       TRANSIÇÃO PARA FASES DO LABIRINTO (1, 2, 3 ou 4)
       ------------------------------------------------------------------------- */
    function goToPhase(phaseNumber) {
      isTransitioning = true;
      fade.target = 1.0;
      fade.callback = () => {
        state = phaseNumber;
        if (phaseNumber >= 1 && phaseNumber <= 3) {
          const targetRune = targetSequence[phaseNumber - 1];
          currentRound = MazeTriggerSystem.setupPhase(phaseNumber, targetRune);
          player.x = currentRound.spawn.x;
          player.y = currentRound.spawn.y;
          player.dir = 'up';
          player.canMove = true;
        } else if (phaseNumber === 4) {
          // Câmara Final
          currentRound = null;
          const config = MazeTriggerSystem.PHASE_CONFIGS[4];
          player.x = config.spawn.x;
          player.y = config.spawn.y;
          player.dir = 'up';
          player.canMove = true;
        }

        fade.target = 0.0;
        fade.callback = () => {
          isTransitioning = false;
        };
      };
    }

    /* -------------------------------------------------------------------------
       FUNÇÃO: TriggerReset() (DESAFIO COM NOVO SORTEIO)
       - Reproduz som de erro e pequeno screen-shake com partículas de folhas.
       - Fade-out da tela e teleporte de volta para a entrada inicial da Fase 1.
       - Sorteia IMEDIATAMENTE uma nova targetSequence.
       - Reabre o painel de memorização por 4 segundos cobrindo a tela inteira.
       ------------------------------------------------------------------------- */
    function TriggerReset() {
      if (isTransitioning) return;
      isTransitioning = true;
      player.canMove = false;

      // 1. Som de erro característico
      soundError();

      // 2. Screen-shake e partículas de folhas ao vento
      if (!calm) {
        screenShake.duration = 0.45;
        screenShake.intensity = 16;
        screenShake.elapsed = 0;

        leafParticles = [];
        for (let i = 0; i < 30; i++) {
          leafParticles.push({
            x: player.x + (Math.random() - 0.5) * 180,
            y: player.y + (Math.random() - 0.5) * 100,
            vx: (Math.random() - 0.5) * 320,
            vy: -140 - Math.random() * 260,
            rot: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 12,
            size: 14 + Math.random() * 16,
            life: 1.0,
            color: Math.random() > 0.4 ? '#4a8522' : '#c2852a'
          });
        }
      }

      // 3. Fade-out e teleporte
      fade.target = 1.0;
      fade.speed = 3.5;
      fade.callback = () => {
        // Teleporta de volta para a entrada inicial da Fase 1
        player.x = 688;
        player.y = 670;
        player.dir = 'up';
        player.moving = false;

        // 4. Sorteia IMEDIATAMENTE nova targetSequence e reabre memorização
        drawNewTargetSequence();
        startMemorization();

        fade.target = 0.0;
        fade.callback = () => {
          isTransitioning = false;
        };
      };
    }

    /* -------------------------------------------------------------------------
       INTERAÇÃO COM A CHAVE E PORTAL (Fase 4: Câmara da Chave)
       ------------------------------------------------------------------------- */
    function collectKey() {
      if (keyCollected) return;
      keyCollected = true;
      player.canMove = false;
      player.moving = false;
      state = 5; // ESTADO KEY_HOLD

      soundKeyFanfare();

      // Partículas douradas e estelares ao redor da personagem
      for (let i = 0; i < 40; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 60 + Math.random() * 160;
        sparkleParticles.push({
          x: player.x,
          y: player.y - 30,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 1.0,
          size: 6 + Math.random() * 8,
          color: Math.random() > 0.5 ? '#facc15' : '#4ade80'
        });
      }

      // Exibe banner popup "Chave Obtida!"
      banner.show = true;
      banner.text = 'Chave da Memória Obtida!';
      banner.subtext = 'O portal místico ao norte se abriu!';

      // Ativa animação do portal roxo no norte
      portalActive = true;

      keyHoldTimer = setTimeout(() => {
        keyHoldTimer = 0;
        if (closed) return;
        banner.show = false;
        state = 4;
        player.canMove = true;
      }, 2400);
    }

    function enterPortal() {
      if (!portalActive || isTransitioning) return;
      isTransitioning = true;
      player.canMove = false;

      soundPortalWarp();

      fade.target = 1.0;
      fade.speed = 1.6;
      fade.callback = () => {
        // Conclui o desafio e retorna ao mapa principal da ilha
        close(true);
      };
    }

    /* -------------------------------------------------------------------------
       ENCERRAMENTO E RETORNO AO MAPA PRINCIPAL
       ------------------------------------------------------------------------- */
    function close(won = false) {
      if (closed) return;
      closed = true;
      cancelAnimationFrame(animationFrame);
      clearTimeout(keyHoldTimer);
      keyHoldTimer = 0;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('keydown', onDebugKey, true);
      document.removeEventListener('keyup', onDebugKey, true);
      window.removeEventListener('resize', resize);
      window.removeEventListener('blur', clearInput);
      document.removeEventListener('visibilitychange', clearInput);

      if (host.parentNode) {
        host.parentNode.removeChild(host);
      }
      activeInstance = null;

      if (won) {
        gameManager.hasLogicKey = true;
      } else {
        keyCollected = false;
        gameManager.hasLogicKey = false;
      }
      if (typeof options.onExit === 'function') {
        options.onExit(won);
      }
    }

    /* -------------------------------------------------------------------------
       TECLADO E INPUTS
       ------------------------------------------------------------------------- */
    let exportingLayouts = false;
    function downloadBlob(blob, name) {
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = name;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    }
    async function exportLayouts() {
      if (exportingLayouts || closed || !debug) return;
      exportingLayouts = true;
      const round = currentRound;
      try {
        for (let phase = 1; phase <= 3; phase++) {
          const config = MazeTriggerSystem.PHASE_CONFIGS[phase];
          const paths = round?.phaseNumber === phase ? round.activePaths : config.paths;
          const sheet = document.createElement('canvas');
          sheet.width = DESIGN_W; sheet.height = DESIGN_H;
          const pen = sheet.getContext('2d'), image = pen.createImageData(DESIGN_W, DESIGN_H);
          pen.imageSmoothingEnabled = false;
          // Marcadores em pixels inteiros; o JSON conserva as coordenadas exatas.
          const rect = (x,y,w,h) => pen.fillRect(Math.round(x),Math.round(y),Math.round(x+w)-Math.round(x),Math.round(y+h)-Math.round(y));
          // Cada pixel representa seu centro: a mesma colisão e raio do jogo
          // decidem se ele é livre (bege) ou bloqueado (verde), inclusive bordas.
          for (let y = 0; y < DESIGN_H; y++) for (let x = 0; x < DESIGN_W; x++) {
            const free = MazeTriggerSystem.fits(phase, x + 0.5, y + 0.5, PLAYER_RADIUS), i = (y * DESIGN_W + x) * 4;
            image.data[i] = free ? 224 : 31; image.data[i + 1] = free ? 201 : 90;
            image.data[i + 2] = free ? 143 : 31; image.data[i + 3] = 255;
          }
          pen.putImageData(image, 0, 0);
          // Molduras internas de 4 px; o interior conserva as colisões sobrepostas.
          pen.fillStyle = '#ff7a00';
          for (const path of paths) {
            const t = path.trigger, w = t.xMax - t.xMin, h = t.yMax - t.yMin;
            rect(t.xMin, t.yMin, w, 4); rect(t.xMin, t.yMax - 4, w, 4);
            rect(t.xMin, t.yMin + 4, 4, h - 8); rect(t.xMax - 4, t.yMin + 4, 4, h - 8);
          }
          pen.fillStyle = '#ff00ff';
          for (const path of paths) rect(path.pedestal.x - 20, path.pedestal.y - 20, 40, 40);
          // Círculo de DIÂMETRO 24 px rasterizado sem antialiasing, como os retângulos.
          const spawn = config.spawn;
          pen.fillStyle = '#00e5ff';
          for (let y = spawn.y - 12; y < spawn.y + 12; y++) for (let x = spawn.x - 12; x < spawn.x + 12; x++) {
            if ((x + 0.5 - spawn.x) ** 2 + (y + 0.5 - spawn.y) ** 2 <= 144) pen.fillRect(x, y, 1, 1);
          }
          // Runas não são fixas: preserva a rodada ativa; null significa sem atribuição.
          const layout = {
            fase: phase, nome: config.name, runas_disponiveis: MazeTriggerSystem.RUNES,
            pedestais: paths.map(p => ({runa: p.runeId ?? null, x: p.pedestal.x, y: p.pedestal.y})),
            saidas: paths.map(p => ({runa: p.runeId ?? null, x: p.trigger.xMin, y: p.trigger.yMin,
              w: p.trigger.xMax - p.trigger.xMin, h: p.trigger.yMax - p.trigger.yMin})),
            spawn: {x: spawn.x, y: spawn.y}, tamanho: [DESIGN_W, DESIGN_H]
          };
          const png = await new Promise(resolve => sheet.toBlob(resolve, 'image/png'));
          if (closed) return;
          if (!png) throw new Error('Não foi possível gerar o PNG da planta.');
          downloadBlob(png, `labirinto_fase${phase}_planta.png`);
          downloadBlob(new Blob([JSON.stringify(layout, null, 2)], {type: 'application/json'}), `labirinto_fase${phase}_layout.json`);
        }
      } finally { exportingLayouts = false; }
    }

    function onDebugKey(e) {
      const k = e.key.toLowerCase();
      if (k !== 'f3' && k !== 'n' && k !== 'g') return;
      e.preventDefault();
      e.stopImmediatePropagation(); // Captura antes de DevPuzzleScreen/ilha.
      if (e.type === 'keyup' || e.repeat || e.ctrlKey || e.altKey || e.metaKey) return;
      if (k === 'f3') debug = !debug;
      else if (k === 'n' && debug && state >= 1 && state <= 3 && !isTransitioning) goToPhase(state + 1);
      else if (k === 'g' && debug) exportLayouts().catch(error => console.error('[Labirinto] Exportação:', error));
    }
    document.addEventListener('keydown', onDebugKey, true);
    document.addEventListener('keyup', onDebugKey, true);

    function onKeyDown(e) {
      if (e.repeat) return;
      const k = e.key.toLowerCase();

      if (k === 'escape') {
        e.preventDefault();
        close(false);
        return;
      }

      if (['arrowup', 'w'].includes(k)) keysDown.up = true;
      if (['arrowdown', 's'].includes(k)) keysDown.down = true;
      if (['arrowleft', 'a'].includes(k)) keysDown.left = true;
      if (['arrowright', 'd'].includes(k)) keysDown.right = true;

      if (['e', 'enter', ' '].includes(k)) {
        if (state === 4 && !keyCollected && MazeTriggerSystem.checkKeyProximity(player.x, player.y)) {
          collectKey();
        }
      }
    }

    function onKeyUp(e) {
      const k = e.key.toLowerCase();
      if (['arrowup', 'w'].includes(k)) keysDown.up = false;
      if (['arrowdown', 's'].includes(k)) keysDown.down = false;
      if (['arrowleft', 'a'].includes(k)) keysDown.left = false;
      if (['arrowright', 'd'].includes(k)) keysDown.right = false;
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    function clearInput() {
      keysDown.up = keysDown.down = keysDown.left = keysDown.right = false;
      player.moving = false;
    }
    window.addEventListener('blur', clearInput);
    document.addEventListener('visibilitychange', clearInput);

    // Redimensionamento responsivo
    function resize() {
      const rect = host.getBoundingClientRect();
      const targetAspect = DESIGN_W / DESIGN_H;
      const hostAspect = rect.width / rect.height;

      let w, h;
      if (hostAspect > targetAspect) {
        h = rect.height;
        w = h * targetAspect;
      } else {
        w = rect.width;
        h = w / targetAspect;
      }

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(DESIGN_W * dpr);
      canvas.height = Math.round(DESIGN_H * dpr);
      canvas.style.width = `${Math.round(w)}px`;
      canvas.style.height = `${Math.round(h)}px`;
    }
    window.addEventListener('resize', resize);
    resize();

    /* -------------------------------------------------------------------------
       LOOP PRINCIPAL: UPDATE (Física, Colisões, Gatilhos e Partículas)
       ------------------------------------------------------------------------- */
    function update(dt) {
      // 1. Atualização do temporizador de memorização (Estado 0)
      if (state === 0) {
        memorizeTimer -= dt;
        if (memorizeTimer <= 0) {
          memorizeTimer = 0;
          state = 1;
          player.canMove = true;
        }
        updateFade(dt);
        return;
      }

      // 2. Movimentação da Personagem
      if (player.canMove && !isTransitioning) {
        let vx = 0;
        let vy = 0;

        if (keysDown.up) vy -= 1;
        if (keysDown.down) vy += 1;
        if (keysDown.left) vx -= 1;
        if (keysDown.right) vx += 1;

        if (vx !== 0 && vy !== 0) {
          vx *= 0.707106;
          vy *= 0.707106;
        }

        const isMoving = vx !== 0 || vy !== 0;
        player.moving = isMoving;

        if (isMoving) {
          player.idle = 0;
          player.walk++;
          player.prog += Math.round(dt * 60);
          if (player.prog >= player.dur) {
            player.prog = 0;
            player.steps++;
          }

          if (Math.abs(vy) >= Math.abs(vx)) {
            player.dir = vy < 0 ? 'up' : 'down';
          } else {
            player.dir = vx < 0 ? 'left' : 'right';
          }

          const newX = player.x + vx * PLAYER_SPEED * dt;
          const newY = player.y + vy * PLAYER_SPEED * dt;
          const resolved = state <= 3
            ? MazeTriggerSystem.moveOnMask(state, player.x, player.y, newX, newY, PLAYER_RADIUS)
            : MazeTriggerSystem.resolveWallCollision(state, newX, newY, PLAYER_RADIUS);
          player.x = resolved.x;
          player.y = resolved.y;

          // Verificação dos gatilhos de corredor nas Fases 1, 2 e 3
          if (state >= 1 && state <= 3 && currentRound) {
            const hit = MazeTriggerSystem.checkTriggers(currentRound.activePaths, player.x, player.y, PLAYER_RADIUS);
            if (hit) {
              if (hit.isCorrect) {
                soundSuccess();
                if (state === 1) goToPhase(2);
                else if (state === 2) goToPhase(3);
                else if (state === 3) goToPhase(4);
              } else {
                TriggerReset();
              }
            }
          }

          // Verificação de colisão com o portal norte na Câmara Final
          if (state === 4 && portalActive && MazeTriggerSystem.checkPortalCollision(player.x, player.y)) {
            enterPortal();
          }
        } else {
          player.walk = 0;
          player.prog = 0;
          player.idle += Math.round(dt * 60);
        }
      }

      // 3. Efeitos de Screen-Shake e Partículas
      if (screenShake.duration > 0) {
        screenShake.elapsed += dt;
        if (screenShake.elapsed >= screenShake.duration) {
          screenShake.duration = 0;
        }
      }

      // Partículas de folhas
      for (let i = leafParticles.length - 1; i >= 0; i--) {
        const p = leafParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 380 * dt;
        p.rot += p.vRot * dt;
        p.life -= dt * 1.6;
        if (p.life <= 0) leafParticles.splice(i, 1);
      }

      // Partículas estelares
      for (let i = sparkleParticles.length - 1; i >= 0; i--) {
        const p = sparkleParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * 1.4;
        if (p.life <= 0) sparkleParticles.splice(i, 1);
      }

      // Partículas do vórtice roxo do portal
      if (state === 4 && portalActive && Math.random() < 0.45) {
        const ang = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 35;
        portalParticles.push({
          x: 688 + Math.cos(ang) * dist,
          y: 145 + Math.sin(ang) * dist,
          tx: 688,
          ty: 145,
          life: 1.0,
          color: Math.random() > 0.4 ? '#c084fc' : '#e879f9'
        });
      }
      for (let i = portalParticles.length - 1; i >= 0; i--) {
        const p = portalParticles[i];
        p.x += (p.tx - p.x) * 2.8 * dt;
        p.y += (p.ty - p.y) * 2.8 * dt;
        p.life -= dt * 1.5;
        if (p.life <= 0) portalParticles.splice(i, 1);
      }

      // Fade de tela
      updateFade(dt);
    }

    function updateFade(dt) {
      if (fade.alpha !== fade.target) {
        const diff = fade.target - fade.alpha;
        const step = Math.sign(diff) * fade.speed * dt;
        if (Math.abs(step) >= Math.abs(diff)) {
          fade.alpha = fade.target;
          if (typeof fade.callback === 'function') {
            const cb = fade.callback;
            fade.callback = null;
            cb();
          }
        } else {
          fade.alpha += step;
        }
      }
    }

    /* -------------------------------------------------------------------------
       RENDERIZAÇÃO NO CANVAS 2D
       ------------------------------------------------------------------------- */
    function draw(time) {
      const dpr = canvas.width / DESIGN_W;
      ctx.save();
      ctx.scale(dpr, dpr);

      // Aplica screen-shake se ativo
      if (screenShake.duration > 0) {
        const prog = screenShake.elapsed / screenShake.duration;
        const currentAmp = screenShake.intensity * (1 - prog);
        const shakeX = Math.sin(time * 0.05) * currentAmp;
        const shakeY = Math.cos(time * 0.06) * currentAmp;
        ctx.translate(shakeX, shakeY);
      }

      // 1. Fundo do cenário
      let bg = assets.bg1;
      if (state === 2) bg = assets.bg2;
      else if (state === 3) bg = assets.bg3;
      else if (state >= 4) bg = assets.bgChamber;

      if (bg) {
        ctx.save();
        if (state <= 3) ctx.imageSmoothingEnabled = true;
        ctx.drawImage(bg, 0, 0, DESIGN_W, DESIGN_H);
        ctx.restore();
      } else {
        ctx.fillStyle = '#1c381c';
        ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);
      }

      // 2. Pedestais e Runas Flutuantes nas Fases 1, 2 e 3
      if (state >= 1 && state <= 3 && currentRound) {
        const tSec = time / 1000;
        let heroDrawn = false;
        for (const path of currentRound.drawPaths) {
          const ped = path.pedestal;
          if (!heroDrawn && player.y < ped.y) { drawPlayer(ctx, time); heroDrawn = true; }
          drawPedestalAndRune(ctx, ped.x, ped.y, path.rune, tSec);
        }
        if (!heroDrawn) drawPlayer(ctx, time);
      }

      // 3. Pedestal Central, Chave e Portal na Câmara Final (Estado 4 & 5)
      if (state >= 4) {
        const tSec = time / 1000;
        const kp = MazeTriggerSystem.PHASE_CONFIGS[4].keyPedestal;

        drawPedestal(ctx, kp.x, kp.y);

        if (!keyCollected) {
          const hoverY = kp.y - 52 + Math.sin(tSec * 2.8) * 6;
          drawMemoryKey(ctx, kp.x, hoverY, tSec);

          if (MazeTriggerSystem.checkKeyProximity(player.x, player.y)) {
            drawInteractPrompt(ctx, kp.x, hoverY - 45);
          }
        }

        if (portalActive) {
          drawActivePortalVortex(ctx, 688, 145, tSec);
        }
      }

      // 4. Personagem
      if (state < 1 || state > 3) drawPlayer(ctx, time);

      // 5. Partículas
      drawParticles(ctx);

      // 6. HUD Retrô
      drawRetroHUD(ctx);

      // 7. Painel de Memorização em Tela Cheia (Estado 0)
      if (state === 0) {
        drawMemorizationOverlay(ctx, time);
      }

      // 8. Banner Popup Comemorativo ("Chave Obtida!")
      if (banner.show) {
        drawKeyBanner(ctx);
      }

      // 9. Camada de Fade
      if (fade.alpha > 0) {
        ctx.fillStyle = `rgba(13, 20, 14, ${fade.alpha})`;
        ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);
      }

      if (debug) drawDebug();
      ctx.restore();
    }

    // Somente leitura: reutiliza configurações/rodada; sem criar objetos por frame.
    function drawDebug() {
      const phase = Math.max(1, Math.min(4, state));
      const config = MazeTriggerSystem.PHASE_CONFIGS[phase];
      ctx.save();
      ctx.lineWidth = 2;
      if (phase <= 3) {
        const overlay = MazeTriggerSystem.maskOverlays[phase];
        if (overlay) ctx.drawImage(overlay, 0, 0, 1024 * MazeTriggerSystem.K, 572 * MazeTriggerSystem.K);
      } else {
        ctx.fillStyle = '#ff000044';
        for (let i = 0; i < config.walls.length; i++) {
          const w = config.walls[i];
          ctx.fillRect(w.x, w.y, w.w, w.h);
        }
        ctx.strokeStyle = '#ff000088'; // Limites aplicados ao centro da personagem.
        ctx.strokeRect(PLAYER_RADIUS, PLAYER_RADIUS, DESIGN_W - 2 * PLAYER_RADIUS, DESIGN_H - 10 - PLAYER_RADIUS);
      }
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      if (phase <= 3 && currentRound) {
        for (let i = 0; i < currentRound.activePaths.length; i++) {
          const p = currentRound.activePaths[i], t = p.trigger;
          ctx.fillStyle = '#ff00ff'; ctx.fillRect(p.pedestal.x - 3, p.pedestal.y - 3, 6, 6);
          ctx.fillStyle = '#ffff0033'; ctx.strokeStyle = '#ffff00';
          ctx.fillRect(t.xMin, t.yMin, t.xMax - t.xMin, t.yMax - t.yMin);
          ctx.strokeRect(t.xMin, t.yMin, t.xMax - t.xMin, t.yMax - t.yMin);
          ctx.fillStyle = p.runeId === targetSequence[phase - 1] ? '#00ff00' : '#ffff00';
          ctx.fillText(p.rune.label, t.xMin + 4, t.yMin + 4);
        }
      } else {
        const kp = config.keyPedestal, portal = config.portal;
        ctx.fillStyle = '#ff000044';
        ctx.beginPath(); ctx.arc(kp.x, kp.y + 10, 28, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#00ffff';
        ctx.beginPath(); ctx.arc(kp.x, kp.y, 65, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(portal.x, portal.y, 50, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.strokeStyle = '#ffffff';
      if (phase === 4) { ctx.beginPath(); ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2); ctx.stroke(); }
      ctx.strokeRect(player.x - PLAYER_RADIUS, player.y - PLAYER_RADIUS, PLAYER_RADIUS * 2, PLAYER_RADIUS * 2);
      ctx.beginPath();
      ctx.moveTo(config.spawn.x - 8, config.spawn.y); ctx.lineTo(config.spawn.x + 8, config.spawn.y);
      ctx.moveTo(config.spawn.x, config.spawn.y - 8); ctx.lineTo(config.spawn.x, config.spawn.y + 8); ctx.stroke();
      ctx.fillStyle = '#000000dd'; ctx.fillRect(8, DESIGN_H - 104, 620, 96);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`F3 | ${config.name}${state === 0 ? ' (memorização)' : ''} | Passo ${Math.min(phase, 3)}/3${phase === 4 ? ' concluído' : ''}`, 16, DESIGN_H - 96);
      ctx.fillText(`Sequência: ${debugSequence}`, 16, DESIGN_H - 74);
      ctx.fillText(`Posição: (${player.x.toFixed(1)}, ${player.y.toFixed(1)}) | FPS: ${Math.round(debugFps)}`, 16, DESIGN_H - 52);
      ctx.fillText('N: próxima fase (após memorização/fade) | Verde: runa CORRETA', 16, DESIGN_H - 30);
      ctx.restore();
    }

    /* -------------------------------------------------------------------------
       SUB-ROTINAS DE DESENHO
       ------------------------------------------------------------------------- */
    function drawPedestal(ctx, x, y) {
      if (assets.pedestal) {
        ctx.drawImage(assets.pedestal, x - 36, y - 56, 72, 72);
      } else {
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.roundRect(x - 28, y - 36, 56, 56, 6);
        ctx.fill();
      }
    }

    function drawPedestalAndRune(ctx, x, y, rune, tSec) {
      drawPedestal(ctx, x, y - 16); // Base do sprite de 72 px coincide com os pés.

      if (!rune) return;
      const hoverY = y - 88 + Math.sin(tSec * 3.2) * 5;

      ctx.save();
      ctx.shadowColor = rune.color;
      ctx.shadowBlur = 18;

      if (assets.runeSheet) {
        const sx = rune.col * 341 + 25;
        const sy = rune.row * 341 + 25;
        const sw = 290;
        const sh = 290;
        ctx.drawImage(assets.runeSheet, sx, sy, sw, sh, x - 28, hoverY - 28, 56, 56);
      } else {
        ctx.fillStyle = rune.color;
        ctx.beginPath();
        ctx.arc(x, hoverY, 18, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawMemoryKey(ctx, x, y, tSec) {
      ctx.save();
      ctx.shadowColor = '#4ade80';
      ctx.shadowBlur = 22;

      if (assets.keyImg) {
        const kw = 44;
        const kh = 88;
        ctx.drawImage(assets.keyImg, x - kw / 2, y - kh / 2, kw, kh);
      } else {
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(x - 14, y - 30, 28, 60);
      }

      // Detalhe da pata na Chave da Memória
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 13px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('🐾', x, y - 24);

      ctx.restore();
    }

    function drawInteractPrompt(ctx, x, y) {
      ctx.save();
      ctx.fillStyle = '#1e293be6';
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x - 90, y - 18, 180, 36, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Pressione [E] para pegar', x, y);
      ctx.restore();
    }

    function drawActivePortalVortex(ctx, px, py, tSec) {
      ctx.save();
      ctx.translate(px, py);

      for (let r = 38; r >= 10; r -= 7) {
        const rot = tSec * (r % 2 === 0 ? 2.2 : -1.8);
        ctx.save();
        ctx.rotate(rot);
        ctx.strokeStyle = r % 2 === 0 ? '#c084fc' : '#a855f7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 1.6);
        ctx.stroke();
        ctx.restore();
      }

      const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 32);
      grad.addColorStop(0, '#fdf4ff');
      grad.addColorStop(0.4, '#c084fc');
      grad.addColorStop(1, '#581c8700');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    function drawPlayer(ctx, time) {
      ctx.save();
      const hs = { frameW: 48, frameH: 56, pivotX: 24, pivotY: 52 };
      const rowIdx = { down: 0, left: 1, right: 2, up: 3 }[player.dir] ?? 3;

      let colIdx = 8;
      if (player.moving) {
        const stepCycle = Math.floor(player.walk / 5) % 8;
        colIdx = Math.max(0, Math.min(7, stepCycle));
      } else {
        colIdx = 8 + (Math.floor(player.idle / 30) % 2);
      }

      const drawScale = 1.35;
      const dw = hs.frameW * drawScale;
      const dh = hs.frameH * drawScale;
      const dx = player.x - hs.pivotX * drawScale;
      const dy = player.y - hs.pivotY * drawScale;

      // Sombra suave sob os pés
      ctx.fillStyle = 'rgba(12, 20, 14, 0.45)';
      ctx.beginPath();
      ctx.ellipse(player.x, player.y, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      if (assets.heroSheet) {
        if (state === 5) {
          // Key Hold: frente, parada, chave erguida no alto
          ctx.drawImage(assets.heroSheet, 8 * hs.frameW, 0, hs.frameW, hs.frameH, dx, dy, dw, dh);
          if (assets.keyImg) {
            ctx.shadowColor = '#4ade80';
            ctx.shadowBlur = 25;
            ctx.drawImage(assets.keyImg, player.x - 22, player.y - 100, 44, 88);
          }
        } else {
          ctx.drawImage(assets.heroSheet, colIdx * hs.frameW, rowIdx * hs.frameH, hs.frameW, hs.frameH, dx, dy, dw, dh);
        }
      } else {
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(player.x - 14, player.y - 44, 28, 44);
      }
      ctx.restore();
    }

    function drawParticles(ctx) {
      ctx.save();
      for (const p of leafParticles) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      for (const p of sparkleParticles) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const p of portalParticles) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    /* -------------------------------------------------------------------------
       HUD RETRÔ (Avatar da Menina, 3 Corações, LV 05, Indicador de Fase)
       ------------------------------------------------------------------------- */
    function drawRetroHUD(ctx) {
      ctx.save();
      const hx = 24;
      const hy = 22;

      // Moldura marrom de madeira para o avatar (66x66)
      ctx.fillStyle = '#2b1b11';
      ctx.beginPath();
      ctx.roundRect(hx, hy, 66, 66, 10);
      ctx.fill();
      ctx.strokeStyle = '#c4975f';
      ctx.lineWidth = 3;
      ctx.stroke();

      if (assets.heroSheet) {
        ctx.drawImage(assets.heroSheet, 8 * 48 + 12, 4, 24, 24, hx + 5, hy + 5, 56, 56);
      } else {
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(hx + 6, hy + 6, 54, 54);
      }

      // 3 Corações vermelhos pixel art
      const heartX = hx + 78;
      const heartY = hy + 6;
      for (let i = 0; i < 3; i++) {
        drawPixelHeart(ctx, heartX + i * 26, heartY, 20);
      }

      // Rótulo LV 05
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 16px "Courier New", monospace, sans-serif';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText('LV 05', heartX, heartY + 36);

      // Indicador da Fase no centro do topo
      let phaseTitle = 'Fase 1: Bifurcação (2 caminhos)';
      if (state === 2) phaseTitle = 'Fase 2: Trifurcação (3 caminhos)';
      else if (state === 3) phaseTitle = 'Fase 3: Quadrifurcação (4 caminhos)';
      else if (state >= 4) phaseTitle = 'Câmara da Memória — Conquiste a Chave!';

      ctx.fillStyle = '#182417e6';
      ctx.strokeStyle = '#6aa84f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(DESIGN_W / 2 - 200, 18, 400, 40, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 16px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(phaseTitle, DESIGN_W / 2, 38);

      ctx.restore();
    }

    function drawPixelHeart(ctx, x, y, size) {
      ctx.save();
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#450a0a';
      ctx.lineWidth = 2;

      ctx.beginPath();
      const topCurveHeight = size * 0.3;
      ctx.moveTo(x + size / 2, y + size);
      ctx.bezierCurveTo(x, y + size * 0.6, x, y + topCurveHeight, x + size * 0.25, y);
      ctx.bezierCurveTo(x + size * 0.5, y, x + size * 0.5, y + topCurveHeight, x + size * 0.5, y + topCurveHeight);
      ctx.bezierCurveTo(x + size * 0.5, y + topCurveHeight, x + size * 0.5, y, x + size * 0.75, y);
      ctx.bezierCurveTo(x + size, y + topCurveHeight, x + size, y + size * 0.6, x + size / 2, y + size);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fca5a5';
      ctx.beginPath();
      ctx.arc(x + size * 0.3, y + size * 0.3, size * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    /* -------------------------------------------------------------------------
       ESTADO 0: PAINEL DE MEMORIZAÇÃO INICIAL (4 SEGUNDOS EM TELA CHEIA)
       ------------------------------------------------------------------------- */
    function drawMemorizationOverlay(ctx, time) {
      ctx.save();

      // Fundo opaco total que cobre os corredores atrás
      ctx.fillStyle = '#0f1711';
      ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);

      // Moldura externa verde e dourada
      ctx.strokeStyle = '#2d4a22';
      ctx.lineWidth = 14;
      ctx.strokeRect(16, 16, DESIGN_W - 32, DESIGN_H - 32);

      ctx.strokeStyle = '#c4975f';
      ctx.lineWidth = 4;
      ctx.strokeRect(26, 26, DESIGN_W - 52, DESIGN_H - 52);

      // Painel de madeira nobre central
      const pw = 940;
      const ph = 540;
      const px = (DESIGN_W - pw) / 2;
      const py = (DESIGN_H - ph) / 2;

      const woodGrad = ctx.createLinearGradient(px, py, px, py + ph);
      woodGrad.addColorStop(0, '#2e1c10');
      woodGrad.addColorStop(1, '#1b1009');
      ctx.fillStyle = woodGrad;
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, 24);
      ctx.fill();

      ctx.strokeStyle = '#dfa552';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Título
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 36px system-ui';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 8;
      ctx.fillText('✨ LABIRINTO DA MEMÓRIA ✨', DESIGN_W / 2, py + 65);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '18px system-ui';
      ctx.fillText('Memorize a sequência sagrada das runas para encontrar o caminho!', DESIGN_W / 2, py + 105);

      // Renderização das 3 Runas alinhadas
      const runeBoxW = 200;
      const runeBoxH = 220;
      const spacing = 60;
      const totalRunesW = 3 * runeBoxW + 2 * spacing;
      const startX = (DESIGN_W - totalRunesW) / 2;
      const runeY = py + 145;

      const stepTitles = ['1º PASSO: Bifurcação', '2º PASSO: Trifurcação', '3º PASSO: Quadrifurcação'];

      targetSequence.forEach((runeId, i) => {
        const rx = startX + i * (runeBoxW + spacing);
        const runeInfo = MazeTriggerSystem.RUNE_INFO[runeId];

        ctx.fillStyle = '#0f1712';
        ctx.beginPath();
        ctx.roundRect(rx, runeY, runeBoxW, runeBoxH, 18);
        ctx.fill();

        ctx.strokeStyle = runeInfo ? runeInfo.color : '#854d0e';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 15px system-ui';
        ctx.fillText(stepTitles[i], rx + runeBoxW / 2, runeY + 28);

        if (runeInfo && assets.runeSheet) {
          const sx = runeInfo.col * 341 + 25;
          const sy = runeInfo.row * 341 + 25;
          ctx.save();
          ctx.shadowColor = runeInfo.color;
          ctx.shadowBlur = 24;
          const iconSize = 100;
          ctx.drawImage(
            assets.runeSheet,
            sx, sy, 290, 290,
            rx + (runeBoxW - iconSize) / 2,
            runeY + 45,
            iconSize, iconSize
          );
          ctx.restore();
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px system-ui';
        ctx.fillText(runeInfo ? runeInfo.label.toUpperCase() : runeId, rx + runeBoxW / 2, runeY + 185);

        if (i < 2) {
          ctx.fillStyle = '#dfa552';
          ctx.font = 'bold 32px system-ui';
          ctx.fillText('➔', rx + runeBoxW + spacing / 2, runeY + runeBoxH / 2);
        }
      });

      // BARRA DE PROGRESSO DECRESCENTE DE 4 SEGUNDOS
      const barW = 560;
      const barH = 26;
      const barX = (DESIGN_W - barW) / 2;
      const barY = py + ph - 80;

      ctx.fillStyle = '#0a100c';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 13);
      ctx.fill();
      ctx.strokeStyle = '#c4975f';
      ctx.lineWidth = 3;
      ctx.stroke();

      const progress = Math.max(0, Math.min(1, memorizeTimer / MEMORIZE_DURATION));
      if (progress > 0) {
        const fillW = Math.max(16, (barW - 6) * progress);
        const fillGrad = ctx.createLinearGradient(barX, barY, barX + fillW, barY);
        fillGrad.addColorStop(0, '#22c55e');
        fillGrad.addColorStop(1, '#4ade80');
        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.roundRect(barX + 3, barY + 3, fillW, barH - 6, 10);
        ctx.fill();
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px system-ui';
      ctx.fillText(`Tempo restante: ${Math.ceil(memorizeTimer)}s`, DESIGN_W / 2, barY + barH + 26);

      ctx.restore();
    }

    function drawKeyBanner(ctx) {
      ctx.save();
      const bx = DESIGN_W / 2;
      const by = DESIGN_H / 2 - 40;

      ctx.fillStyle = '#142014f0';
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(bx - 260, by - 80, 520, 160, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 32px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(banner.text, bx, by - 16);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '18px system-ui';
      ctx.fillText(banner.subtext, bx, by + 26);
      ctx.restore();
    }

    /* -------------------------------------------------------------------------
       LOOP PRINCIPAL (requestAnimationFrame a 60 FPS)
       ------------------------------------------------------------------------- */
    function loop(time) {
      if (closed) return;
      const dt = lastTime ? Math.min(0.1, (time - lastTime) / 1000) : 0;
      if (debug && lastTime && time > lastTime) debugFps = 1000 / (time - lastTime);
      lastTime = time;

      update(dt);
      if (closed) return;
      draw(time);

      animationFrame = requestAnimationFrame(loop);
    }

    // Início imediato: sorteia a sequência inicial e abre Estado 0
    drawNewTargetSequence();
    startMemorization();
    canvas.focus();
    animationFrame = requestAnimationFrame(loop);

    activeInstance = { close };
    return activeInstance;
  }

  return Object.freeze({
    prepare,
    open,
    gameManager,
    get active() { return Boolean(activeInstance); }
  });
})();
