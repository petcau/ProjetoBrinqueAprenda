'use strict';
/**
 * TELA DE LOADING FUNCIONAL EM TRUE PIXEL ART — SINFONIA DOS CRISTAIS
 * Garante que 100% dos assets (imagens, cenários, spritesheets e áudios)
 * sejam previamente carregados e validados antes que o jogo e o menu sejam liberados.
 */
(function (global) {
  const W = 320, H = 180;
  const HW = 640, HH = 360;
  const R = Math.round;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // Manifest completo dos recursos essenciais ativos do jogo (Menu, Mapa e Trilhas)
  const IMAGE_MANIFEST = [
    { id: 'menu_aprovado', src: 'assets/story/interface/menu-aprovado.png', label: 'Pórtico do Menu' },
    { id: 'btn_novo_jogo', src: 'assets/story/interface/btn-novo-jogo.png', label: 'Botão Novo Jogo' },
    { id: 'btn_continuar', src: 'assets/story/interface/btn-continuar.png', label: 'Botão Continuar' },
    { id: 'btn_opcoes', src: 'assets/story/interface/btn-opcoes.png', label: 'Botão Opções' },
    { id: 'btn_creditos', src: 'assets/story/interface/btn-creditos.png', label: 'Botão Créditos' },
    { id: 'btn_sair', src: 'assets/story/interface/btn-sair.png', label: 'Botão Sair' },
    { id: 'paineis_mundos', src: 'assets/story/interface-extra/paineis-mundos.png', label: 'Painéis dos Mundos' },
    { id: 'mapa_sem_personagem', src: 'assets/story/interface-extra/mapa-sem-personagem.png', label: 'Caminho do Mapa' }
  ];

  const AUDIO_MANIFEST = [
    { id: 'musica_menu', src: 'assets/audio/musica-menu.mp3', label: 'Sinfonia do Santuário' },
    { id: 'era_uma_vez_caverna', src: 'assets/audio/era-uma-vez-caverna.mp3', label: 'A Canção da Ordem' },
    { id: 'o_que_um_cristal_pode_fazer', src: 'assets/audio/o-que-um-cristal-pode-fazer.mp3', label: 'Apresentação Final' },
    { id: 'musica_floresta_fases', src: 'assets/audio/musica-floresta-fases.mp3', label: 'Floresta: Sussurros da Mata' },
    { id: 'musica_floresta_especial', src: 'assets/audio/musica-floresta-especial.mp3', label: 'Floresta: O Despertar da Esmeralda' },
    { id: 'musica_rio_fases', src: 'assets/audio/musica-rio-fases.mp3', label: 'Rio: Correnteza Turquesa' },
    { id: 'musica_rio_especial', src: 'assets/audio/musica-rio-especial.mp3', label: 'Rio: A Dança das Cascatas' },
    { id: 'musica_caatinga_fases', src: 'assets/audio/musica-caatinga-fases.mp3', label: 'Caatinga: Sol Sobre o Arenito' },
    { id: 'musica_caatinga_especial', src: 'assets/audio/musica-caatinga-especial.mp3', label: 'Caatinga: O Baião da Opala de Fogo' }
  ];

  const TOTAL_RESOURCES = IMAGE_MANIFEST.length + AUDIO_MANIFEST.length;

  const AssetPreloader = {
    active: true,
    ready: false,
    loadedCount: 0,
    totalCount: TOTAL_RESOURCES,
    smoothRatio: 0,
    currentLabel: 'Harmonizando cristais...',
    cache: {
      images: {},
      audios: {}
    },
    particles: [],
    startTime: 0,
    fadeAlpha: 0,
    fadingOut: false,

    init() {
      global.CrystalAssetsReady = false;
      global.CrystalAssetCache = this.cache;

      if (typeof document === 'undefined') return;

      this.ensureDOM();
      this.initParticles();
      this.startTime = typeof performance !== 'undefined' ? performance.now() : 0;
      this.startLoop();
      this.preloadAll();
    },

    ensureDOM() {
      if (typeof document === 'undefined' || typeof document.createElement !== 'function') return;
      let root = typeof document.getElementById === 'function' ? document.getElementById('preloaderScreen') : null;
      if (!root) {
        root = document.createElement('div');
        root.id = 'preloaderScreen';
        root.style = root.style || {};
        root.addEventListener = root.addEventListener || (() => {});
        if (document.body && typeof document.body.appendChild === 'function') {
          document.body.appendChild(root);
        }
      }

      let cv = typeof document.getElementById === 'function' ? document.getElementById('preloaderCanvas') : null;
      if (!cv) {
        cv = document.createElement('canvas');
        cv.id = 'preloaderCanvas';
        cv.width = HW;
        cv.height = HH;
        cv.style = cv.style || {};
        if (root && typeof root.appendChild === 'function') {
          root.appendChild(cv);
        }
      }
      this.canvas = cv;
      if (cv && typeof cv.getContext === 'function') {
        this.ctx = cv.getContext('2d');
        if (this.ctx) this.ctx.imageSmoothingEnabled = false;
      }

      this.fitCanvas();
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window.addEventListener('resize', () => this.fitCanvas());
      }

      // Clique ou tecla para entrar quando estiver 100% carregado
      const onTrigger = (e) => {
        if (!this.ready || this.fadingOut) return;
        if (e && e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ' && e.key !== 'r' && e.key !== 'R') return;
        this.finishAndEnterGame();
      };

      if (root && typeof root.addEventListener === 'function') {
        root.addEventListener('pointerdown', onTrigger);
      }
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window.addEventListener('keydown', onTrigger);
      }
    },

    fitCanvas() {
      if (!this.canvas) return;
      const vw = Math.max(320, window.innerWidth);
      const vh = Math.max(180, window.innerHeight);
      const scale = Math.min(vw / W, vh / H);
      this.canvas.style.width = Math.round(W * scale) + 'px';
      this.canvas.style.height = Math.round(H * scale) + 'px';
    },

    initParticles() {
      this.particles = [];
      for (let i = 0; i < 48; i++) {
        this.particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vy: 6 + Math.random() * 14,
          vx: (Math.random() - 0.5) * 4,
          phase: Math.random() * Math.PI * 2,
          size: Math.random() < 0.25 ? 2 : 1,
          color: ['#9ef0ff', '#ffe478', '#ff8ae2', '#b37af0'][Math.floor(Math.random() * 4)]
        });
      }
    },

    preloadAll() {
      let completed = 0;

      const onItemLoaded = (item, success) => {
        completed++;
        this.loadedCount = completed;
        this.currentLabel = success
          ? `Carregado: ${item.label}`
          : `Verificado: ${item.label}`;

        if (completed >= this.totalCount) {
          this.onAllLoaded();
        }
      };

      // 1. Carrega todas as imagens
      IMAGE_MANIFEST.forEach((item) => {
        const img = new Image();
        img.onload = () => {
          this.cache.images[item.src] = img;
          onItemLoaded(item, true);
        };
        img.onerror = () => {
          this.cache.images[item.src] = img;
          onItemLoaded(item, false);
        };
        img.src = item.src;
      });

      // 2. Carrega e decodifica os áudios com timeout seguro
      AUDIO_MANIFEST.forEach((item) => {
        const audio = new Audio();
        let finished = false;
        const mark = (ok) => {
          if (finished) return;
          finished = true;
          clearTimeout(safetyTimer);
          audio.removeEventListener('canplaythrough', onCanPlay);
          audio.removeEventListener('error', onError);
          this.cache.audios[item.src] = audio;
          onItemLoaded(item, ok);
        };

        const onCanPlay = () => mark(true);
        const onError = () => mark(false);

        // Timeout de fallback para não prender a tela caso o navegador restrinja codec
        const safetyTimer = setTimeout(() => mark(true), 3500);

        audio.addEventListener('canplaythrough', onCanPlay, { once: true });
        audio.addEventListener('error', onError, { once: true });
        audio.preload = 'auto';
        audio.src = item.src;
        try {
          audio.load();
        } catch (_) {
          mark(true);
        }
      });
    },

    onAllLoaded() {
      // Confirmação de harmonia completa
      this.currentLabel = 'Cristais em harmonia';
      global.CrystalAssetsReady = true;

      // Mantém a prontidão visível
      setTimeout(() => {
        this.ready = true;
      }, 350);
    },

    finishAndEnterGame() {
      if (this.fadingOut) return;
      this.fadingOut = true;

      // Destrava o áudio do navegador imediatamente no gesto do usuário
      try {
        if (global.CrystalAudio && typeof global.CrystalAudio.unlock === 'function') {
          global.CrystalAudio.unlock();
        }
        if (global.CrystalMenuAudio && typeof global.CrystalMenuAudio.autoStart === 'function') {
          global.CrystalMenuAudio.autoStart();
        }
      } catch (_) {}

      // Fade-out suave do overlay de carregamento
      const root = document.getElementById('preloaderScreen');
      if (root) {
        root.style.transition = 'opacity 0.45s ease-out';
        root.style.opacity = '0';
        setTimeout(() => {
          root.remove();
          this.active = false;
        }, 460);
      } else {
        this.active = false;
      }
    },

    startLoop() {
      const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (cb) => setTimeout(cb, 16);
      const renderFrame = (now) => {
        if (!this.active) return;
        this.update(now);
        this.render(now);
        raf(renderFrame);
      };
      raf(renderFrame);
    },

    update(now) {
      const targetRatio = clamp(this.loadedCount / Math.max(1, this.totalCount), 0, 1);
      // Interpolação fluida do progresso para suavidade Hi-Bit
      this.smoothRatio += (targetRatio - this.smoothRatio) * 0.14;
      if (Math.abs(targetRatio - this.smoothRatio) < 0.002) {
        this.smoothRatio = targetRatio;
      }

      const dt = 1 / 60;
      for (const p of this.particles) {
        p.y -= p.vy * dt;
        p.x += Math.sin(now * 0.002 + p.phase) * 0.4;
        if (p.y < -4) {
          p.y = H + 4;
          p.x = Math.random() * W;
        }
      }
    },

    render(now) {
      if (!this.ctx) return;
      const ctx = this.ctx;
      const t = (now - this.startTime) * 0.001;

      // Escala 2x para pixel art 320x180 em canvas 640x360
      ctx.setTransform(2, 0, 0, 2, 0, 0);

      // Fundo Caverna Mística Profunda (#05030f)
      ctx.fillStyle = '#05030f';
      ctx.fillRect(0, 0, W, H);

      // Brilho ambiente místico em degradê suave de fundo
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
      const radGlow = ctx.createRadialGradient(160, 64, 4, 160, 64, 120);
      radGlow.addColorStop(0, `rgba(74, 185, 224, ${0.14 + pulse * 0.08})`);
      radGlow.addColorStop(0.5, `rgba(132, 60, 180, ${0.08 + pulse * 0.06})`);
      radGlow.addColorStop(1, 'rgba(5, 3, 15, 0)');
      ctx.fillStyle = radGlow;
      ctx.fillRect(0, 0, W, H);

      // Partículas ascendentes de energia cristalina (1-bit pixels)
      for (const p of this.particles) {
        ctx.fillStyle = p.color;
        ctx.fillRect(R(p.x), R(p.y), p.size, p.size);
      }

      // 1. TÍTULO OFICIAL LIMPO: - SINFONIA DOS CRISTAIS -
      this.drawTitle(ctx, t);

      // 2. CRISTAL CENTRAL EM HARMONIA (TRUE PIXEL ART PURO)
      this.drawChargingCrystal(ctx, 160, 64, t, this.smoothRatio);

      // 3. BARRA DE PROGRESSO ESCULPIDA E PORCENTAGEM
      this.drawProgressBar(ctx, 60, 122, 200, 8, this.smoothRatio, t);

      // 4. MENSAGEM SUTIL DE HARMONIA / STATUS SIMPLIFICADO
      this.drawStatusInfo(ctx, t);

      // 5. PROMPT DE ENTRADA RESPONSIVO E SEM OVERFLOW QUANDO PRONTO
      if (this.ready) {
        this.drawReadyPrompt(ctx, t);
      }
    },

    drawTitle(ctx, t) {
      const title = '— SINFONIA DOS CRISTAIS —';
      const bob = Math.round(Math.sin(t * 1.6) * 1.0);

      // Sombra profunda gravada em obsidian e texto nítido em ciano luminoso
      this.drawPixelText(ctx, title, 160, 18 + bob, '#0b0616', true, 9);
      this.drawPixelText(ctx, title, 160, 17 + bob, '#9ef0ff', true, 9);
    },

    drawChargingCrystal(ctx, cx, cy, t, ratio) {
      cx = R(cx);
      cy = R(cy);
      const bob = Math.round(Math.sin(t * 2.2) * 2);
      cy += bob;

      // 1. AURA DE RESSONÂNCIA EM PIXEL ART ESCALONADA (SEM ctx.arc)
      const radMax = R(14 + ratio * 18);
      const auraPulse = Math.sin(t * 3.2) * 2;
      const rad = Math.max(10, R(radMax + auraPulse));
      const auraAlpha = 0.08 + ratio * 0.16 + Math.sin(t * 2.8) * 0.03;

      for (let r = rad; r >= 8; r -= 5) {
        const stepAlpha = Math.max(0, (auraAlpha * (1 - (r - 8) / (rad + 1)))).toFixed(3);
        ctx.fillStyle = `rgba(110, 220, 255, ${stepAlpha})`;
        ctx.beginPath();
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx + R(r * 1.3), cy);
        ctx.lineTo(cx, cy + r);
        ctx.lineTo(cx - R(r * 1.3), cy);
        ctx.closePath();
        ctx.fill();
      }

      // Definição das 5 Gemas dos Biomas em Harmonia
      const GEMS = [
        { name: 'Quartzo', main: '#4ec5db', hi: '#9ef0ff', dark: '#1a5b78', rgb: '78, 197, 219' },
        { name: 'Esmeralda', main: '#52d670', hi: '#b2ffc8', dark: '#18602b', rgb: '82, 214, 112' },
        { name: 'Citrino', main: '#ffc83b', hi: '#fff3a8', dark: '#8f5800', rgb: '255, 200, 59' },
        { name: 'Ametista', main: '#c77dfa', hi: '#f0cbff', dark: '#6e2b9c', rgb: '199, 125, 250' },
        { name: 'OpalaDeFogo', main: '#ff6b3b', hi: '#ffa378', dark: '#8f2500', rgb: '255, 107, 59' }
      ];

      // 2. SATÉLITES ORBITAIS ATRÁS DO CRISTAL (Camada Traseira: Y <= cy)
      this.drawSatellites(ctx, cx, cy, t, ratio, GEMS, false);

      // 3. FACETAS DO CRISTAL PRIMORDIAL CENTRAL LAPIDADO
      const pSync = Math.sin(t * 3.5);
      const isReady = this.ready || ratio >= 0.98;

      // Faceta 1: Quartzo Ciano (Inferior Esquerda - ratio >= 0.15)
      const qLit = ratio >= 0.15;
      ctx.fillStyle = qLit ? (isReady && pSync > 0.2 ? '#6ee5ff' : '#4ec5db') : '#182836';
      ctx.beginPath();
      ctx.moveTo(cx - 14, cy + 2);
      ctx.lineTo(cx, cy + 22);
      ctx.lineTo(cx, cy + 9);
      ctx.lineTo(cx - 5, cy + 3);
      ctx.closePath();
      ctx.fill();

      // Faceta 2: Esmeralda Verde (Inferior Direita - ratio >= 0.35)
      const eLit = ratio >= 0.35;
      ctx.fillStyle = eLit ? (isReady && pSync > 0.2 ? '#6eed85' : '#52d670') : '#16281e';
      ctx.beginPath();
      ctx.moveTo(cx + 14, cy + 2);
      ctx.lineTo(cx, cy + 22);
      ctx.lineTo(cx, cy + 9);
      ctx.lineTo(cx + 5, cy + 3);
      ctx.closePath();
      ctx.fill();

      // Faceta 3: Citrino Dourado (Superior Direita - ratio >= 0.55)
      const cLit = ratio >= 0.55;
      ctx.fillStyle = cLit ? (isReady && pSync > 0.2 ? '#ffe066' : '#ffc83b') : '#362812';
      ctx.beginPath();
      ctx.moveTo(cx + 7, cy - 12);
      ctx.lineTo(cx + 14, cy + 2);
      ctx.lineTo(cx + 5, cy + 3);
      ctx.lineTo(cx, cy - 5);
      ctx.closePath();
      ctx.fill();

      // Faceta 4: Ametista Lilás (Superior Esquerda - ratio >= 0.75)
      const aLit = ratio >= 0.75;
      ctx.fillStyle = aLit ? (isReady && pSync > 0.2 ? '#dca6ff' : '#c77dfa') : '#2e1838';
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy - 12);
      ctx.lineTo(cx - 14, cy + 2);
      ctx.lineTo(cx - 5, cy + 3);
      ctx.lineTo(cx, cy - 5);
      ctx.closePath();
      ctx.fill();

      // Faceta 5: Coração Opala de Fogo (Núcleo Central - ratio >= 0.88)
      const oLit = ratio >= 0.88;
      ctx.fillStyle = oLit ? (isReady && pSync > 0.2 ? '#ff8554' : '#ff6b3b') : '#3a180f';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 5);
      ctx.lineTo(cx - 5, cy + 3);
      ctx.lineTo(cx, cy + 9);
      ctx.lineTo(cx + 5, cy + 3);
      ctx.closePath();
      ctx.fill();

      // Faceta 6: Ápice Diamantino da Fada (ratio >= 0.95)
      const dLit = ratio >= 0.95;
      ctx.fillStyle = dLit ? '#ffffff' : '#453856';
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy - 12);
      ctx.lineTo(cx, cy - 23);
      ctx.lineTo(cx + 7, cy - 12);
      ctx.lineTo(cx, cy - 5);
      ctx.closePath();
      ctx.fill();

      // Contornos esculpidos em True Pixel Art
      ctx.strokeStyle = '#0a0614';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Silhueta externa
      ctx.moveTo(cx, cy - 23);
      ctx.lineTo(cx + 7, cy - 12);
      ctx.lineTo(cx + 14, cy + 2);
      ctx.lineTo(cx, cy + 22);
      ctx.lineTo(cx - 14, cy + 2);
      ctx.lineTo(cx - 7, cy - 12);
      ctx.closePath();
      // Nervuras internas
      ctx.moveTo(cx, cy - 23); ctx.lineTo(cx, cy - 5);
      ctx.moveTo(cx, cy - 5); ctx.lineTo(cx - 14, cy + 2);
      ctx.moveTo(cx, cy - 5); ctx.lineTo(cx + 14, cy + 2);
      ctx.moveTo(cx - 5, cy + 3); ctx.lineTo(cx, cy + 9);
      ctx.moveTo(cx + 5, cy + 3); ctx.lineTo(cx, cy + 9);
      ctx.moveTo(cx, cy + 9); ctx.lineTo(cx, cy + 22);
      ctx.stroke();

      // 4. SATÉLITES ORBITAIS À FRENTE DO CRISTAL (Camada Frontal: Y > cy)
      this.drawSatellites(ctx, cx, cy, t, ratio, GEMS, true);

      // 5. BRILHO ESTELAR 1-BIT NO ÁPICE QUANDO HARMONIZADO
      if (ratio >= 0.95 || isReady) {
        const star = 2 + (Math.floor(t * 8) % 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - star, cy - 23, star * 2 + 1, 1);
        ctx.fillRect(cx, cy - 23 - star, 1, star * 2 + 1);
        ctx.fillStyle = '#9ef0ff';
        ctx.fillRect(cx - 1, cy - 24, 3, 3);
      }
    },

    drawSatellites(ctx, cx, cy, t, ratio, gems, inFront) {
      const rx = 34;
      const ry = 14;
      const baseAngle = t * 1.5;

      for (let i = 0; i < gems.length; i++) {
        const angle = baseAngle + (i * Math.PI * 2) / gems.length;
        const sinA = Math.sin(angle);
        const isFront = sinA > 0;
        if (isFront !== inFront) continue;

        const sx = R(cx + Math.cos(angle) * rx);
        const sy = R(cy + sinA * ry);
        const gem = gems[i];
        const lit = ratio >= (i + 1) * 0.18;

        // Moldura em pixel art 1-bit
        ctx.fillStyle = '#0a0614';
        ctx.fillRect(sx - 2, sy - 1, 5, 3);
        ctx.fillRect(sx - 1, sy - 2, 3, 5);

        // Núcleo da gema satélite
        ctx.fillStyle = lit ? gem.main : '#1d1728';
        ctx.fillRect(sx - 1, sy - 1, 3, 3);
        ctx.fillStyle = lit ? gem.hi : '#2f243d';
        ctx.fillRect(sx, sy - 1, 1, 1);
        ctx.fillRect(sx - 1, sy, 1, 1);

        // Feixe sutil de ressonância harmônica com o cristal central
        if (lit && ratio >= 0.75) {
          const beamAlpha = (0.12 + 0.08 * Math.sin(t * 3.5 + i)).toFixed(3);
          ctx.strokeStyle = `rgba(${gem.rgb}, ${beamAlpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(sx, sy);
          ctx.stroke();
        }
      }
    },

    drawProgressBar(ctx, x, y, w, h, ratio, t) {
      x = R(x);
      y = R(y);
      w = R(w);
      h = R(h);

      // Porcentagem limpa e centralizada ACIMA da barra (sem disputar espaço interno)
      const pct = Math.floor(ratio * 100);
      const pctText = `${pct}%`;
      this.drawPixelText(ctx, pctText, x + w / 2, y - 11, '#0b0616', true, 8);
      this.drawPixelText(ctx, pctText, x + w / 2, y - 12, '#9ef0ff', true, 8);

      // Moldura externa esculpida em rocha com bordas chanfradas
      ctx.fillStyle = '#0c0714';
      ctx.fillRect(x - 2, y - 2, w + 4, h + 4);

      ctx.fillStyle = '#261c30';
      ctx.fillRect(x - 1, y - 1, w + 2, h + 2);

      // Detalhes dourados nos 4 cantos da barra
      ctx.fillStyle = '#d9a85b';
      ctx.fillRect(x - 2, y - 2, 3, 2);
      ctx.fillRect(x + w - 1, y - 2, 3, 2);
      ctx.fillRect(x - 2, y + h, 3, 2);
      ctx.fillRect(x + w - 1, y + h, 3, 2);

      // Fundo escuro interno da barra
      ctx.fillStyle = '#120d1c';
      ctx.fillRect(x, y, w, h);

      // Preenchimento com gradiente de energia cristalina
      const fillW = clamp(R(w * ratio), 0, w);
      if (fillW > 0) {
        const barGrad = ctx.createLinearGradient(x, y, x + fillW, y);
        barGrad.addColorStop(0, '#2d728f');
        barGrad.addColorStop(0.5, '#4ec5db');
        barGrad.addColorStop(1, '#a8f2ff');
        ctx.fillStyle = barGrad;
        ctx.fillRect(x, y, fillW, h);

        // Brilho interior pulsante na borda superior
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.fillRect(x, y, fillW, 1);

        // Varredura de pulso de luz cintilante
        const sweep = (Math.floor(t * 110) % (w + 20)) - 20;
        if (sweep >= 0 && sweep < fillW) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + sweep, y, 3, h);
        }
      }
    },

    drawStatusInfo(ctx, t) {
      // Mensagem harmônica sutil: sem contagens numéricas repetitivas ou poluição
      if (this.ready) return; // Quando o botão de início aparece, o status dá lugar ao prompt

      const status = 'Cristais em harmonia...';
      const bob = Math.round(Math.sin(t * 2.5) * 0.8);
      this.drawPixelText(ctx, status, 160, 137 + bob, '#0b0616', true, 7);
      this.drawPixelText(ctx, status, 160, 136 + bob, '#c8dce8', true, 7);
    },

    drawReadyPrompt(ctx, t) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 5);
      const prompt = 'TOQUE OU PRESSIONE [ENTER]';

      // Cálculo dinâmico da largura da moldura para garantir ZERO overflow
      let textW = 140;
      if (global.TruePixelEngine && typeof global.TruePixelEngine.measurePixelText === 'function') {
        textW = global.TruePixelEngine.measurePixelText(prompt);
      } else if (ctx && typeof ctx.measureText === 'function') {
        textW = ctx.measureText(prompt).width;
      }

      const bw = Math.max(180, Math.round(textW + 24));
      const bx = Math.round(160 - bw / 2);
      const by = 138;
      const bh = 15;

      // Caixa botão pulsante com moldura chanfrada
      ctx.fillStyle = pulse > 0.4 ? '#254e20' : '#183415';
      ctx.fillRect(bx, by, bw, bh);

      ctx.fillStyle = '#f2cc6b';
      ctx.fillRect(bx, by, bw, 1);
      ctx.fillRect(bx, by + bh - 1, bw, 1);
      ctx.fillRect(bx, by, 1, bh);
      ctx.fillRect(bx + bw - 1, by, 1, bh);

      // Texto perfeitamente contido e centralizado
      this.drawPixelText(ctx, prompt, 160, by + 4, '#0a0614', true, 8);
      this.drawPixelText(ctx, prompt, 160, by + 3, pulse > 0.45 ? '#ffffff' : '#f2cc6b', true, 8);
    },

    drawPixelText(ctx, text, x, y, col, center = false, size = 8) {
      if (global.TruePixelEngine) {
        const shadow = col === '#100c1e' ? null : '#100c1e';
        if (center && typeof global.TruePixelEngine.drawPixelTextCentered === 'function') {
          global.TruePixelEngine.drawPixelTextCentered(ctx, text, R(x), R(y), col, shadow, 320, size);
          return;
        }
        if (typeof global.TruePixelEngine.drawPixelText === 'function') {
          global.TruePixelEngine.drawPixelText(ctx, text, R(x), R(y), col, shadow, 320, size);
          return;
        }
      }
      ctx.fillStyle = col;
      ctx.font = `bold ${Math.max(9, Math.round(size * 1.15))}px "Fredoka", "Trebuchet MS", sans-serif`;
      if (typeof ctx.strokeText === 'function') {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.4;
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeText(text, R(x), R(y));
      }
      ctx.textAlign = center ? 'center' : 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = col;
      ctx.fillText(text, R(x), R(y));
    }
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => AssetPreloader.init());
    } else {
      AssetPreloader.init();
    }
  }

  global.AssetPreloader = AssetPreloader;
})(typeof window !== 'undefined' ? window : globalThis);
