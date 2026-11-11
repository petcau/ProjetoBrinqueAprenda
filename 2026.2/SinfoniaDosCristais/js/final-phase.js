/* ============================================================================
 * FASE FINAL (NÓ 21 — PORTA ANCESTRAL: 4 PUZZLES ESPECIAIS + LAST DANCE + CRÉDITOS)
 * Crystal Math Mania — Sinfonia dos Cristais
 * ============================================================================ */
((global) => {
  'use strict';

  const W = 320, H = 180;
  const R = Math.round;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  // ==========================================================================
  // 1. FOTOS E BRASÕES DOS CRÉDITOS (IMAGENS ENVIADAS + FALLBACK CANVAS OFFLINE)
  // ==========================================================================
  const PETERSON_SRC = 'assets/credits/peterson-lobato.jpg';
  const UNEB_SRC = 'assets/credits/uneb-logo.png';

  function buildAdvisorPortraitDataURI() {
    const c = document.createElement('canvas');
    c.width = 96; c.height = 96;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;

    const bg = x.createLinearGradient(0, 0, 0, 96);
    bg.addColorStop(0, '#cfd8dc');
    bg.addColorStop(1, '#eceff1');
    x.fillStyle = bg;
    x.fillRect(0, 0, 96, 96);

    const fillEll = (cx, cy, rx, ry, col) => {
      x.fillStyle = col;
      for (let py = Math.floor(cy - ry); py <= Math.ceil(cy + ry); py++) {
        for (let px = Math.floor(cx - rx); px <= Math.ceil(cx + rx); px++) {
          const dx = (px - cx) / rx, dy = (py - cy) / ry;
          if (dx * dx + dy * dy <= 1) x.fillRect(px, py, 1, 1);
        }
      }
    };

    fillEll(48, 92, 42, 24, '#2b547e');
    fillEll(48, 92, 36, 20, '#36648b');
    x.fillStyle = '#1e3f5e';
    x.beginPath(); x.moveTo(28, 72); x.lineTo(42, 96); x.lineTo(20, 96); x.fill();
    x.beginPath(); x.moveTo(68, 72); x.lineTo(54, 96); x.lineTo(76, 96); x.fill();

    fillEll(48, 74, 13, 12, '#d7a184');
    fillEll(48, 71, 12, 9, '#c68b6e');
    fillEll(48, 38, 25, 27, '#1c1a1b');
    fillEll(33, 38, 12, 22, '#242021');
    fillEll(63, 38, 12, 22, '#242021');

    fillEll(48, 46, 20, 23, '#e0ac90');
    fillEll(46, 44, 18, 20, '#ebbca2');
    fillEll(35, 51, 6, 4, '#dfa288');
    fillEll(61, 51, 6, 4, '#dfa288');

    fillEll(34, 27, 11, 8, '#1c1a1b');
    fillEll(62, 27, 11, 8, '#1c1a1b');
    x.fillStyle = '#292526';
    x.fillRect(30, 22, 12, 6);
    x.fillRect(54, 22, 12, 6);

    x.fillStyle = '#2b2422';
    x.fillRect(34, 37, 9, 2);
    x.fillRect(53, 37, 9, 2);

    x.fillStyle = '#ffffff';
    x.fillRect(35, 41, 7, 3);
    x.fillRect(54, 41, 7, 3);
    x.fillStyle = '#3b2318';
    x.fillRect(37, 41, 4, 3);
    x.fillRect(56, 41, 4, 3);
    x.fillStyle = '#ffffff';
    x.fillRect(37, 41, 1, 1);
    x.fillRect(56, 41, 1, 1);

    x.fillStyle = '#cc9276';
    x.fillRect(47, 43, 3, 9);
    x.fillRect(45, 51, 7, 2);

    x.fillStyle = '#a86458';
    x.fillRect(39, 57, 18, 2);
    x.fillStyle = '#c97b6d';
    x.fillRect(41, 59, 14, 2);
    return c.toDataURL('image/png');
  }

  function buildUnebCrestDataURI() {
    const c = document.createElement('canvas');
    c.width = 96; c.height = 112;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, 96, 112);

    for (const tx of [32, 48, 64]) {
      x.fillStyle = '#8d6e63';
      x.fillRect(tx - 4, 18, 8, 6);
      x.fillStyle = '#ffb300';
      x.fillRect(tx - 3, 9, 6, 9);
      x.fillStyle = '#fff176';
      x.fillRect(tx - 2, 11, 4, 5);
    }

    const sx = 26, sy = 24, sw = 44, sh = 42;
    for (let py = 0; py < sh; py++) {
      for (let px = 0; px < sw; px++) {
        x.fillStyle = (px / sw > py / sh) ? '#154c9c' : '#d32f2f';
        x.fillRect(sx + px, sy + py, 1, 1);
      }
    }
    x.strokeStyle = '#102a56';
    x.lineWidth = 2;
    x.strokeRect(sx, sy, sw, sh);

    x.fillStyle = '#eceff1';
    x.fillRect(45, sy + 4, 6, sh - 8);
    x.fillRect(sx + 5, sy + 18, sw - 10, 6);
    for (const [fx, fy] of [[34, 33], [60, 33], [34, 54], [60, 54]]) {
      x.fillRect(fx - 2, fy - 4, 4, 8);
      x.fillRect(fx - 4, fy - 2, 8, 3);
    }

    x.fillStyle = '#0d47a1';
    x.fillRect(16, 68, 64, 10);
    x.fillStyle = '#ffffff';
    x.font = 'bold 6px monospace';
    x.textAlign = 'center';
    x.fillText('HOMINEM AUGERE', 48, 75);

    x.fillStyle = '#0d47a1';
    x.font = 'bold 18px serif';
    x.fillText('UNEB', 48, 95);
    x.fillStyle = '#0d47a1';
    x.fillRect(16, 98, 30, 2);
    x.fillStyle = '#d32f2f';
    x.fillRect(50, 98, 30, 2);
    x.fillStyle = '#37474f';
    x.font = 'bold 5px sans-serif';
    x.fillText('UNIVERSIDADE DO ESTADO DA BAHIA', 48, 107);

    return c.toDataURL('image/png');
  }

  function hydrateCreditImages(root = document) {
    const advisorFallback = buildAdvisorPortraitDataURI();
    const unebFallback = buildUnebCrestDataURI();

    root.querySelectorAll('img[data-credit-img="peterson"]').forEach((img) => {
      img.onerror = () => {
        img.onerror = null;
        img.src = advisorFallback;
      };
      img.src = PETERSON_SRC;
    });
    root.querySelectorAll('img[data-credit-img="uneb"]').forEach((img) => {
      img.onerror = () => {
        img.onerror = null;
        img.src = unebFallback;
      };
      img.src = UNEB_SRC;
    });
  }

  // ==========================================================================
  // 2. MÚSICA EXCLUSIVA DA FASE FINAL (MISTERIOSA NO INÍCIO + VARIANTES DE CADA MUNDO)
  // Nenhuma variante usa a música normal das fases!
  // ==========================================================================
  const FinalPhaseMusic = {
    ctx: null,
    timer: null,
    mode: 'none',
    step: 0,

    ensureContext() {
      const AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return null;
      if (!this.ctx) this.ctx = new AC();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    },

    getEffectiveVolume() {
      const E = global.TruePixelEngine;
      if (E && E.GameHUD) {
        if (E.GameHUD.muted) return 0;
        return clamp((E.GameHUD.musicVol || 70) / 100, 0, 1);
      }
      return 0.6;
    },

    playTone(freq, dur, type = 'sine', gainMul = 0.12, delay = 0) {
      const vol = this.getEffectiveVolume();
      if (vol <= 0.001) return;
      const ctx = this.ensureContext();
      if (!ctx) return;

      const t0 = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);

      const peak = Math.max(0.0005, vol * gainMul);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.linearRampToValueAtTime(peak, t0 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.04);
    },

    setMode(newMode) {
      if (this.mode === newMode && this.timer) return;
      this.stop();
      this.mode = newMode;
      this.step = 0;
      if (newMode === 'none') return;

      try { global.CrystalMenuAudio?.pause?.(); } catch (_) {}
      try { global.CrystalAudio?.stopAllMusic?.(); } catch (_) {}
      try { global.TruePixelWorlds?.stopMusicAudio?.(); } catch (_) {}
      try { global.CaveChapter1?.stopMusicAudio?.(); } catch (_) {}

      const intervalMs = newMode === 'last_dance' ? 210 : (newMode === 'mystery' ? 420 : 280);
      const tick = () => {
        if (this.mode !== newMode) return;
        const E = global.TruePixelEngine;
        if (E?.GameHUD && (E.GameHUD.paused || E.GameHUD.settingsOpen)) return;
        const s = this.step++;

        if (newMode === 'mystery') {
          // Música inicial misteriosa do Santuário Ancestral
          const notes = [220.0, 261.63, 311.13, 329.63, 261.63, 246.94, 220.0, 196.0];
          const f = notes[s % notes.length];
          this.playTone(f, 0.38, 'triangle', 0.11, 0);
          if (s % 4 === 0) this.playTone(110.0, 1.1, 'sine', 0.14, 0);
          if (s % 8 === 6) this.playTone(f * 2, 0.28, 'sine', 0.06, 0.12);
        } else if (newMode === 'floresta_variant') {
          // Variante exclusiva do Mundo da Floresta (Araci)
          const melody = [293.66, 349.23, 440.0, 493.88, 587.33, 493.88, 440.0, 349.23];
          const bass = [146.83, 174.61, 220.0, 196.0];
          const f = melody[s % melody.length];
          this.playTone(f, 0.24, 'triangle', 0.13, 0);
          if (s % 2 === 1) this.playTone(f * 1.5, 0.12, 'sine', 0.06, 0.08);
          if (s % 2 === 0) this.playTone(bass[(s >> 1) % bass.length], 0.45, 'sine', 0.12, 0);
        } else if (newMode === 'rio_variant') {
          // Variante exclusiva do Mundo do Rio (Irecê)
          const cascade = [392.0, 493.88, 587.33, 739.99, 783.99, 739.99, 587.33, 493.88];
          const f = cascade[s % cascade.length];
          this.playTone(f, 0.32, 'sine', 0.13, 0);
          this.playTone(f * 0.5, 0.35, 'triangle', 0.08, 0.06);
          if (s % 4 === 0) this.playTone(196.0, 0.85, 'sine', 0.12, 0);
        } else if (newMode === 'caatinga_variant') {
          // Variante exclusiva do Mundo da Caatinga (Jurema)
          const baiao = [329.63, 415.30, 493.88, 587.33, 493.88, 440.0, 415.30, 329.63];
          const f = baiao[s % baiao.length];
          this.playTone(f, 0.22, 'sawtooth', 0.065, 0);
          this.playTone(f, 0.25, 'triangle', 0.11, 0.02);
          if (s % 3 === 0) this.playTone(164.81, 0.42, 'triangle', 0.14, 0);
        } else if (newMode === 'ordem_variant') {
          // Variante exclusiva da Rainha da Ordem / Musical
          const symph = [523.25, 659.25, 783.99, 1046.5, 987.77, 783.99, 659.25, 587.33];
          const f = symph[s % symph.length];
          this.playTone(f, 0.28, 'sine', 0.14, 0);
          this.playTone(f * 0.5, 0.32, 'triangle', 0.10, 0);
          if (s % 2 === 0) this.playTone(261.63, 0.48, 'sine', 0.12, 0);
        } else if (newMode === 'last_dance') {
          // "Last Dance" — Corrida triunfal pelos 4 mundos restaurados!
          const dance = [523.25, 659.25, 783.99, 1046.5, 880.0, 1046.5, 1174.66, 1318.5];
          const bass = [261.63, 329.63, 349.23, 392.0];
          const f = dance[s % dance.length];
          this.playTone(f, 0.19, 'triangle', 0.14, 0);
          this.playTone(f * 0.5, 0.18, 'sine', 0.11, 0);
          if (s % 2 === 0) this.playTone(bass[(s >> 1) % bass.length], 0.35, 'triangle', 0.13, 0);
        }
      };

      tick();
      this.timer = setInterval(tick, intervalMs);
    },

    stop() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      this.mode = 'none';
    }
  };

  // ==========================================================================
  // 3. TELA PRETA DE CRÉDITOS ROLANTES + RETORNO À TELA INICIAL
  // ==========================================================================
  const RollingCredits = {
    overlay: null,
    trackEl: null,
    active: false,
    rafId: 0,
    scrollY: 0,
    lastTs: 0,
    speedPxPerSec: 44, // Velocidade moderada-lenta ("lentos mas nem tanto também")

    ensureDOM() {
      if (this.overlay) return;
      const el = document.createElement('div');
      el.id = 'rollingCreditsOverlay';
      el.className = 'rolling-credits-overlay';
      el.hidden = true;
      el.innerHTML = `
        <div class="rolling-credits-stars" aria-hidden="true"></div>
        <button type="button" id="skipRollingCreditsBtn" class="rolling-credits-skip" aria-label="Pular créditos">
          Pular Créditos ⏭
        </button>
        <div class="rolling-credits-viewport">
          <div class="rolling-credits-roll" id="rollingCreditsRoll">
            <div class="rc-crystal-badge">✦ SINFONIA DOS CRISTAIS ✦</div>
            <h1 class="rc-game-title">Crystal Math Mania</h1>
            <p class="rc-subtitle">Sinfonia dos Cristais</p>

            <div class="rc-divider"><span>◆</span><span>❖</span><span>◆</span></div>

            <section class="rc-section">
              <h2 class="rc-heading">Orientador e Professor</h2>
              <div class="rc-advisor-box">
                <div class="rc-photo-frame">
                  <img data-credit-img="peterson" alt="Orientador e Professor Peterson Lobato">
                </div>
                <div class="rc-advisor-name">Peterson Lobato</div>
                <div class="rc-advisor-role">Orientador e Professor</div>
              </div>
            </section>

            <div class="rc-divider"><span>◆</span><span>❖</span><span>◆</span></div>

            <section class="rc-section">
              <h2 class="rc-heading">Integrantes da Equipe</h2>
              <ul class="rc-team-list">
                <li>
                  <span class="rc-member-gem gem-cyan">❖</span>
                  <strong>Heitor Givercy Nascimento Macedo</strong>
                  <span class="rc-role-tag">Gestor</span>
                </li>
                <li>
                  <span class="rc-member-gem gem-emerald">❖</span>
                  <strong>Eyder Sanshes Brandão</strong>
                  <span class="rc-role-tag">Programador</span>
                </li>
                <li>
                  <span class="rc-member-gem gem-paraiba">❖</span>
                  <strong>Ítalo José Bomfim da Rocha</strong>
                  <span class="rc-role-tag">Programador</span>
                </li>
                <li>
                  <span class="rc-member-gem gem-opal">❖</span>
                  <strong>Italo Marcus de Sant'Ana Freitas</strong>
                  <span class="rc-role-tag">Desinger</span>
                </li>
              </ul>
            </section>

            <div class="rc-divider"><span>◆</span><span>❖</span><span>◆</span></div>

            <section class="rc-section">
              <h2 class="rc-heading">Ferramentas Usadas</h2>
              <div class="rc-tools-grid">
                <span class="rc-tool-pill">VS Code</span>
                <span class="rc-tool-pill">Antigravity IDE</span>
                <span class="rc-tool-pill">Codex IDE</span>
                <span class="rc-tool-pill">PixelLabAi</span>
                <span class="rc-tool-pill">Google Sala de Aula</span>
                <span class="rc-tool-pill">Trello</span>
                <span class="rc-tool-pill">Figma</span>
              </div>
            </section>

            <div class="rc-divider"><span>◆</span><span>❖</span><span>◆</span></div>

            <section class="rc-section">
              <h2 class="rc-heading">Instituição</h2>
              <div class="rc-uneb-box">
                <div class="rc-uneb-frame">
                  <img data-credit-img="uneb" alt="Brasão da UNEB">
                </div>
                <div class="rc-uneb-name">Universidade do Estado da Bahia (UNEB)</div>
              </div>
            </section>

            <div class="rc-divider"><span>◆</span><span>❖</span><span>◆</span></div>

            <div class="rc-finale-thanks">
              <div class="rc-gems-row">
                <span class="gem-cyan">✦</span>
                <span class="gem-emerald">✦</span>
                <span class="gem-paraiba">✦</span>
                <span class="gem-opal">✦</span>
              </div>
              <h3>Obrigado por jogar!</h3>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(el);
      this.overlay = el;
      this.trackEl = el.querySelector('#rollingCreditsRoll');
      hydrateCreditImages(el);

      const skipBtn = el.querySelector('#skipRollingCreditsBtn');
      if (skipBtn) {
        skipBtn.addEventListener('click', () => this.finishAndReturnHome());
      }
      window.addEventListener('keydown', (e) => {
        if (this.active && (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          this.finishAndReturnHome();
        }
      });
    },

    start() {
      this.ensureDOM();
      FinalPhaseMusic.stop();

      // Toca a mesma música do menu inicial durante os créditos
      try {
        global.TruePixelWorlds?.stopMusicAudio?.();
        global.CaveChapter1?.stopMusicAudio?.();
        global.CrystalAudio?.stopAllMusic?.();
        if (global.CrystalMenuAudio) {
          if (global.CrystalMenuAudio.track) {
            global.CrystalMenuAudio.track.currentTime = 0;
          }
          global.CrystalMenuAudio.play?.(true);
        }
      } catch (_) {}

      this.active = true;
      this.overlay.hidden = false;
      this.scrollY = window.innerHeight * 0.92;
      this.lastTs = performance.now();
      if (this.trackEl) {
        this.trackEl.style.transform = `translate3d(0, ${this.scrollY}px, 0)`;
      }

      const step = (now) => {
        if (!this.active) return;
        const dt = Math.min(0.1, Math.max(0.001, (now - this.lastTs) / 1000));
        this.lastTs = now;
        this.scrollY -= this.speedPxPerSec * dt;
        if (this.trackEl) {
          this.trackEl.style.transform = `translate3d(0, ${this.scrollY}px, 0)`;
          const totalH = this.trackEl.offsetHeight || 1100;
          if (this.scrollY < -totalH - 60) {
            this.finishAndReturnHome();
            return;
          }
        }
        this.rafId = requestAnimationFrame(step);
      };
      this.rafId = requestAnimationFrame(step);
    },

    finishAndReturnHome() {
      this.active = false;
      cancelAnimationFrame(this.rafId);
      if (this.overlay) this.overlay.hidden = true;
      FinalPhaseMusic.stop();

      try {
        global.TruePixelWorlds?.deactivateCanvas?.();
        global.CaveChapter1?.deactivateCanvas?.();
        global.CrystalApp?.syncProgress?.(
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
          21
        );
      } catch (_) {}

      if (global.CrystalApp && typeof global.CrystalApp.goto === 'function') {
        global.CrystalApp.goto('home');
      } else {
        document.body.dataset.screen = 'home';
        const home = document.getElementById('home');
        const map = document.getElementById('map');
        const game = document.getElementById('game');
        if (home) home.hidden = false;
        if (map) map.hidden = true;
        if (game) game.hidden = true;
      }
      try { global.CrystalMenuAudio?.play?.(); } catch (_) {}
    }
  };

  // ==========================================================================
  // 4. PORTA ANCESTRAL, INÍCIO DA CAVERNA LÁ DENTRO, LAST DANCE E PAREDE DE CRISTAIS
  // ==========================================================================
  const DOOR_SOCKETS = {
    forest:   { x: 230, y: 33, col: '#69f0ae', label: 'Esmeralda' },
    river:    { x: 242, y: 32, col: '#40c4ff', label: 'Turmalina Paraíba' },
    caatinga: { x: 254, y: 32, col: '#ff9100', label: 'Opala de Fogo' },
    fairy:    { x: 266, y: 33, col: '#e040fb', label: 'Gema da Ordem' }
  };

  function drawBeginningCaveInsideGate(ctx, openRatio, t) {
    if (openRatio <= 0.02) return;
    const f12 = Math.floor(t * 12);
    const gx = 248, gy = 26, gh = 116;
    const halfOpen = Math.max(2, R(easeInOut(clamp(openRatio, 0, 1)) * 24));
    const vx0 = gx - halfOpen, vw = halfOpen * 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(vx0, gy + 12, vw, gh - 12);
    ctx.clip();

    // Interior mostra exatamente o INÍCIO DA CAVERNA (feixe de luz vertical da queda inicial + musgo da Fase 1)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(vx0, gy + 12, vw, gh - 12);
    ctx.fillStyle = 'rgba(158, 240, 255, 0.28)';
    ctx.fillRect(gx - 12, gy + 12, 24, gh - 20);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(gx - 5, gy + 12, 10, gh - 22);

    // Pedras e musgo da entrada inicial da caverna
    ctx.fillStyle = '#3e7338';
    ctx.fillRect(vx0, gy + gh - 12, vw, 6);
    ctx.fillStyle = '#7ec456';
    ctx.fillRect(vx0, gy + gh - 12, vw, 2);

    // Poeira cristalina na fresta de luz inicial
    ctx.fillStyle = '#9ef0ff';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(gx - 9 + i * 6, gy + 24 + ((f12 + i * 5) % 48), 2, 2);
    }
    ctx.restore();
  }

  function drawCustomGateSockets(ctx, sockets, t) {
    const E = global.TruePixelEngine;
    const f12 = Math.floor(t * 12);
    for (const [key, s] of Object.entries(DOOR_SOCKETS)) {
      const unlocked = Boolean(sockets[key]);
      ctx.fillStyle = '#d9bf86';
      ctx.fillRect(s.x - 3, s.y - 3, 7, 7);
      ctx.fillStyle = unlocked ? s.col : '#2b211d';
      ctx.fillRect(s.x - 2, s.y - 2, 5, 5);
      if (unlocked) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(s.x - 1, s.y - 1, 2, 2);
        if (E?.drawStar && ((f12 & 1) === 0)) {
          E.drawStar(ctx, s.x, s.y - 5, 2, '#ffffff', s.col);
        }
      }
    }
  }

  function drawLastDanceWorldScenery(ctx, worldIdx, scrollX, t) {
    const E = global.TruePixelEngine;
    const f12 = Math.floor(t * 12);
    const sx = R(scrollX);

    if (worldIdx === 0) {
      // MUNDO 1: CAVERNA CRISTALINA RESTAURADA E BONITA
      const g = ctx.createLinearGradient(0, 0, 0, 142);
      g.addColorStop(0, '#2a4d69');
      g.addColorStop(0.6, '#4b86b4');
      g.addColorStop(1, '#adcbe3');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, 142);

      for (let i = 0; i < 7; i++) {
        const px = ((i * 58 - (sx >> 1)) % 380 + 380) % 380 - 30;
        ctx.fillStyle = '#3b6998';
        ctx.fillRect(px, 18, 22, 124);
        ctx.fillStyle = '#84c1ff';
        ctx.fillRect(px + 4, 24, 6, 110);
        if (E?.drawStar) E.drawStar(ctx, px + 10, 42 + (i % 3) * 18, 2, '#ffffff', '#9ef0ff');
      }
      ctx.fillStyle = '#3fc6f0';
      ctx.fillRect(0, 134, W, 10);
      ctx.fillStyle = '#3e7338';
      ctx.fillRect(0, 142, W, 38);
      ctx.fillStyle = '#7ec456';
      ctx.fillRect(0, 142, W, 5);
    } else if (worldIdx === 1) {
      // MUNDO 2: FLORESTA VIVA, CURADA E FLORIDA
      const g = ctx.createLinearGradient(0, 0, 0, 142);
      g.addColorStop(0, '#4fc3f7');
      g.addColorStop(0.65, '#b3e5fc');
      g.addColorStop(1, '#c8e6c9');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, 142);

      for (let i = 0; i < 6; i++) {
        const tx = ((i * 64 - R(sx * 0.65)) % 384 + 384) % 384 - 32;
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(tx + 12, 54, 14, 88);
        ctx.fillStyle = '#2e7d32';
        ctx.fillRect(tx - 6, 26, 50, 34);
        ctx.fillStyle = '#66bb6a';
        ctx.fillRect(tx, 20, 38, 22);
        ctx.fillStyle = (i & 1) ? '#ff80ab' : '#ffd54f';
        ctx.fillRect(tx + 8, 30, 4, 4);
        ctx.fillRect(tx + 26, 26, 4, 4);
      }
      ctx.fillStyle = '#2e7d32';
      ctx.fillRect(0, 142, W, 38);
      ctx.fillStyle = '#81c784';
      ctx.fillRect(0, 142, W, 6);
    } else if (worldIdx === 2) {
      // MUNDO 3: RIO DAS ÁGUAS CLARAS TRANSPARENTE E CRISTALINO
      const g = ctx.createLinearGradient(0, 0, 0, 142);
      g.addColorStop(0, '#29b6f6');
      g.addColorStop(0.55, '#81d4fa');
      g.addColorStop(1, '#e1f5fe');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, 142);

      for (let i = 0; i < 5; i++) {
        const wx = ((i * 76 - R(sx * 0.6)) % 380 + 380) % 380 - 20;
        ctx.fillStyle = '#4dd0e1';
        ctx.fillRect(wx, 34, 18, 98);
        ctx.fillStyle = '#e0f7fa';
        for (let wy = 38; wy < 128; wy += 8) {
          ctx.fillRect(wx + 4 + ((wy + f12) % 6), wy, 6, 3);
        }
      }
      ctx.fillStyle = '#00bcd4';
      ctx.fillRect(0, 126, W, 16);
      ctx.fillStyle = '#ffffff';
      for (let k = 0; k < 10; k++) {
        const rx = ((k * 36 - sx) % W + W) % W;
        ctx.fillRect(rx, 132 + (k & 1) * 4, 8, 1);
      }
      ctx.fillStyle = '#26a69a';
      ctx.fillRect(0, 142, W, 38);
      ctx.fillStyle = '#80cbc4';
      ctx.fillRect(0, 142, W, 5);
    } else {
      // MUNDO 4: CAATINGA FLORIDA COM CACIMBAS CHEIAS E MANDACARUS EM FLOR
      const g = ctx.createLinearGradient(0, 0, 0, 142);
      g.addColorStop(0, '#ffb74d');
      g.addColorStop(0.55, '#ffe082');
      g.addColorStop(1, '#fff8e1');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, 142);

      if (E?.drawStar) E.drawStar(ctx, 260, 38, 6, '#ffffff', '#ffd54f');
      for (let i = 0; i < 6; i++) {
        const mx = ((i * 64 - R(sx * 0.7)) % 384 + 384) % 384 - 24;
        ctx.fillStyle = '#388e3c';
        ctx.fillRect(mx + 10, 68, 8, 74);
        ctx.fillRect(mx + 2, 84, 8, 6);
        ctx.fillRect(mx + 2, 72, 5, 14);
        ctx.fillRect(mx + 18, 90, 8, 6);
        ctx.fillRect(mx + 21, 78, 5, 14);
        ctx.fillStyle = '#fff9c4';
        ctx.fillRect(mx + 12, 65, 4, 4);
        ctx.fillRect(mx + 2, 69, 4, 4);
        ctx.fillStyle = '#29b6f6';
        ctx.fillRect(mx + 28, 136, 22, 6);
      }
      ctx.fillStyle = '#8bc34a';
      ctx.fillRect(0, 142, W, 38);
      ctx.fillStyle = '#aed581';
      ctx.fillRect(0, 142, W, 5);
    }

    for (let f = 0; f < 9; f++) {
      const fx = ((f * 38 - sx) % W + W) % W;
      ctx.fillStyle = (f & 1) ? '#ffd54f' : '#ffffff';
      ctx.fillRect(fx, 145 + (f % 3) * 3, 2, 2);
    }
  }

  // Frase "Obrigado por jogar" encravada na parede em fonte facetada de CRISTAIS
  function drawCrystalWallInscription(ctx, text, cx, cy, t) {
    const E = global.TruePixelEngine;
    const f12 = Math.floor(t * 12);

    const pw = 256, ph = 42;
    const px = R(cx - pw / 2), py = R(cy - ph / 2);

    ctx.fillStyle = '#140e24';
    ctx.fillRect(px - 3, py - 3, pw + 6, ph + 6);
    ctx.fillStyle = '#281e42';
    ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = '#68b8c4';
    ctx.fillRect(px, py, pw, 2);
    ctx.fillRect(px, py + ph - 2, pw, 2);
    ctx.fillRect(px, py, 2, ph);
    ctx.fillRect(px + pw - 2, py, 2, ph);

    const cornerCols = ['#68b8c4', '#69f0ae', '#40c4ff', '#ff9100'];
    const corners = [[px + 6, py + 6], [px + pw - 6, py + 6], [px + 6, py + ph - 6], [px + pw - 6, py + ph - 6]];
    corners.forEach(([qx, qy], i) => {
      ctx.fillStyle = cornerCols[i];
      ctx.fillRect(qx - 3, qy - 3, 6, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qx - 1, qy - 1, 2, 2);
    });

    ctx.save();
    ctx.font = 'bold 18px Consolas, "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#090514';
    ctx.fillText(text, cx + 2, cy + 2);
    ctx.fillStyle = '#7c4dff';
    ctx.fillText(text, cx + 1, cy + 1);
    ctx.fillStyle = '#40c4ff';
    ctx.fillText(text, cx, cy - 1);
    ctx.fillStyle = (f12 & 1) ? '#e0f7fa' : '#ffffff';
    ctx.fillText(text, cx, cy);
    ctx.restore();

    if (E?.drawStar) {
      for (let i = 0; i < 6; i++) {
        const sx = px + 28 + i * 40 + ((f12 * 3 + i * 7) % 9);
        const sy = py + 11 + ((i * 11 + f12) % 20);
        if (((f12 + i) % 3) === 0) {
          E.drawStar(ctx, sx, sy, 2, '#ffffff', cornerCols[i % 4]);
        }
      }
    }
  }

  // ==========================================================================
  // 5. INTEGRAÇÃO NO `TruePixelWorlds` (NÓ 21 — `sanctuary`)
  // ==========================================================================
  function installFinalPhase() {
    const E = global.TruePixelEngine;
    const WLD = global.TruePixelWorlds;
    if (!E || !WLD || WLD._finalPhaseInstalled) return;
    WLD._finalPhaseInstalled = true;

    // Estado progressivo das 4 fadas e dos 4 encaixes da Porta Ancestral
    WLD.finalGuardians = {
      araci:  { x: -20, y: 142, targetX: 54,  state: 'idle', visible: false, flipX: false },
      irece:  { x: -20, y: 142, targetX: 78,  state: 'idle', visible: false, flipX: false },
      jurema: { x: -20, y: 142, targetX: 102, state: 'idle', visible: false, flipX: false },
      ordem:  { x: -20, y: 142, targetX: 126, state: 'idle', visible: false, flipX: false }
    };
    WLD.finalDoorSockets = { forest: false, river: false, caatinga: false, fairy: false };
    WLD.finalPuzzleIndex = 1; // 1: Floresta, 2: Rio, 3: Caatinga, 4: Ordem/Musical
    WLD.gemFlight = null;
    WLD.finalMusicalOrder = null;
    WLD.lastDanceState = null;
    WLD._gateConfusionTriggered = false;

    // Alias em CaveChapter1 para compatibilidade
    if (global.CaveChapter1) {
      global.CaveChapter1.startFinalPhase = function () {
        WLD.startByCampaignNode(21);
      };
    }

    const origStartWorldLevel = WLD.startWorldLevel.bind(WLD);
    WLD.startWorldLevel = function (worldKey, levelNum = 1, nodeId = null) {
      if (worldKey === 'sanctuary' || nodeId === 21) {
        return this.startSanctuaryFinalPhase();
      }
      FinalPhaseMusic.stop();
      return origStartWorldLevel(worldKey, levelNum, nodeId);
    };

    const origRestart = WLD.restartCurrentPhase.bind(WLD);
    WLD.restartCurrentPhase = function () {
      if (this.worldKey === 'sanctuary') {
        E.DialogueBox.close();
        E.TutorialModal.close();
        E.GameHUD.paused = false;
        E.GameHUD.settingsOpen = false;
        this.startSanctuaryPuzzleStep(this.finalPuzzleIndex || 1, true);
        return;
      }
      return origRestart();
    };

    WLD.startSanctuaryFinalPhase = function () {
      this.worldKey = 'sanctuary';
      this.currentLevel = 1;
      this.currentStep = 1;
      this.totalSteps = 4;
      this.campaignNodeId = 21;

      this.prepareCanvasForGame();
      E.DialogueBox.close();
      E.TutorialModal.close();
      this.stopMusicAudio();
      this.stopRegularBgm();

      // No início, NENHUMA das 4 fadas aparece junta e os 4 encaixes estão vazios!
      this.finalDoorSockets = { forest: false, river: false, caatinga: false, fairy: false };
      E.DialogueBox.sockets = { fairy: false, forest: false, river: false, caatinga: false };
      for (const g of Object.values(this.finalGuardians)) {
        g.visible = false;
        g.state = 'idle';
        g.x = -24;
      }
      this.ordemCompanion.visible = false;
      this.guardianActor.visible = false;

      this.obstacleDecay = 0;
      this.targetObstacleDecay = 0;
      this.gateOpenRatio = 0;
      this.waveActive = false;
      this.waveRadius = 0;
      this.pieces = [];
      this.electricShapes = [];
      this.floatingBanners = [];
      this.shellGame = null;
      this.riverMelody = null;
      this.forestNinja = null;
      this.finalMusicalOrder = null;
      this.gemFlight = null;
      this.lastDanceState = null;
      this._gateConfusionTriggered = false;

      this.protag.x = 30;
      this.protag.y = 142;
      this.protag.state = 'idle';

      // Música no início é MISTERIOSA
      FinalPhaseMusic.setMode('mystery');
      E.IrisTransition.start('in', 44, 126, 0.65);

      if (!this.running) {
        this.running = true;
        this.lastNow = typeof performance !== 'undefined' ? performance.now() : 0;
        requestAnimationFrame((now) => this.loop(now));
      }

      this.phase = 'final_intro_mystery';
      this.phaseTime = 0;
      E.DialogueBox.open([
        {
          speaker: 'Protagonista',
          portrait: 'portrait_protagonist',
          text: 'Cheguei ao Portão das Gemas... O ar aqui é misterioso e os quatro relicários aguardam o poder de cada mundo!'
        }
      ], () => {
        this.startSanctuaryPuzzleStep(1, false);
      });
    };

    // Inicia cada um dos 4 puzzles especiais na ordem dos mundos (1: Floresta, 2: Rio, 3: Caatinga, 4: Ordem/Musical)
    WLD.startSanctuaryPuzzleStep = function (stepIdx, skipIntro = false) {
      this.finalPuzzleIndex = clamp(stepIdx, 1, 4);
      this.currentStep = this.finalPuzzleIndex;
      this.totalSteps = 4;
      this.shellGame = null;
      this.riverMelody = null;
      this.forestNinja = null;
      this.finalMusicalOrder = null;
      this.pieces = [];
      this.pureEquation = null;
      this.shadowEquation = null;

      const cfg = {
        1: {
          guardian: 'araci',
          music: 'floresta_variant',
          hud: 'Fase Final - 1/4: Floresta (Araci)',
          speaker: 'Araci (Floresta)',
          portrait: 'portrait_araci',
          text: 'Eu sou Araci! Para forjar a Esmeralda do Portão, corte 8 cristais puros no ar evitando os cristais sombrios!'
        },
        2: {
          guardian: 'irece',
          music: 'rio_variant',
          hud: 'Fase Final - 2/4: Rio (Irecê)',
          speaker: 'Irecê (Rio)',
          portrait: 'portrait_irece',
          text: 'Eu sou Irecê! As águas trazem uma nova melodia secreta! Repita as notas dos sinos de cristal na nova ordem!'
        },
        3: {
          guardian: 'jurema',
          music: 'caatinga_variant',
          hud: 'Fase Final - 3/4: Caatinga (Jurema)',
          speaker: 'Jurema (Caatinga)',
          speakerPortrait: 'portrait_jurema',
          portrait: 'portrait_jurema',
          text: 'Eu sou Jurema! As areias mudaram de resposta: acompanhe as cúpulas e encontre onde a Opala de Fogo se esconde!'
        },
        4: {
          guardian: 'ordem',
          music: 'ordem_variant',
          hud: 'Fase Final - 4/4: Ordem Musical',
          speaker: 'Rainha da Ordem',
          portrait: 'portrait_ordem',
          text: 'Agora estamos todas reunidas! Para o último desafio — o Puzzle Musical da Ordem —, cante no ritmo e toque os Cristais na Ordem!'
        }
      }[this.finalPuzzleIndex];

      E.GameHUD.worldLabel = cfg.hud;
      FinalPhaseMusic.setMode(cfg.music);

      const g = this.finalGuardians[cfg.guardian];
      const launchSpecialMechanic = () => {
        if (this.finalPuzzleIndex === 1) {
          // PUZZLE ESPECIAL 1: FLORESTA (Corte Cristalino Especial — meta inédita: cortar 8 cristais puros em 18s!)
          this.startForestNinjaGame();
          // Vai direto para o desafio especial com parâmetros diferentes da fase normal
          this.forestNinja.totalStages = 1;
          this.forestNinja.currentStage = 2; // Com cristais puros + sombras desde o início!
          this.forestNinja.stageDuration = 16.0;
          this.forestNinja.stageTimeRemaining = 16.0;
          this.forestNinja.targetPureCuts = 8;
          this.phase = 'forest_ninja_game';
          this.forestNinja.floatingBanner = {
            text: 'DESAFIO DE ARACI: CORTE 8 CRISTAIS PUROS!',
            color: '#2ecc71',
            x: 160,
            y: 65,
            timer: 2.2
          };
          FinalPhaseMusic.setMode('floresta_variant');
        } else if (this.finalPuzzleIndex === 2) {
          // PUZZLE ESPECIAL 2: RIO (Sinfonia das Águas com RESPOSTA DIFERENTE da fase 15 normal!)
          // Na fase 15 normal a sequência é [0, 2, 1, 3, 4]; aqui na Fase Final é [4, 1, 3, 0, 2] em 3 rodadas dinâmicas!
          this.startRiverMelodyGame();
          E.TutorialModal.close();
          this.riverMelody.masterSequence = [4, 1, 3, 0];
          this.riverMelody.finalMaxRound = 2; // 3 rodadas (2, 3 e 4 notas na sequência inédita)
          this.setupRiverMelodyRound(1);
          this.phase = 'river_melody_game';
          FinalPhaseMusic.setMode('rio_variant');
        } else if (this.finalPuzzleIndex === 3) {
          // PUZZLE ESPECIAL 3: CAATINGA (Desafio das Areias com RESPOSTA DIFERENTE da fase 20 normal!)
          this.startShellGame();
          E.TutorialModal.close();
          this.shellGame.rounds = [
            { round: 1, cups: 3, duration: 3.6, swaps: 6, speedLabel: 'Média', style: 'cross', customWin: 2 },
            { round: 2, cups: 4, duration: 4.4, swaps: 8, speedLabel: 'Média', style: 'triangle_feint', customWin: 1 },
            { round: 3, cups: 4, duration: 5.0, swaps: 10, speedLabel: 'Rápida', style: 'zigzag_spin', customWin: 3 }
          ];
          this.setupShellRound(0);
          this.shellGame.winningCup = 2;
          this.shellGame.opalCupIdx = 2;
          this.phase = 'shell_game_show';
          this.phaseTime = 0;
          FinalPhaseMusic.setMode('caatinga_variant');
        } else if (this.finalPuzzleIndex === 4) {
          // PUZZLE ESPECIAL 4 (ÚLTIMO): DESAFIO DA ORDEM / MUSICAL
          // Combina o Karaokê Rítmico da Rainha da Ordem + Toque nos 4 Cristais Musicais na Ordem Harmônica Inédita!
          this.startFinalOrderMusicalPuzzle();
        }
      };

      if (skipIntro || g.visible) {
        g.visible = true;
        g.x = g.targetX;
        g.state = 'idle';
        launchSpecialMechanic();
        return;
      }

      // A fada correspondente entra caminhando quando o puzzle dela vai iniciar!
      g.visible = true;
      g.x = -18;
      g.y = 142;
      g.state = 'walk';
      g.flipX = false;
      this.phase = 'final_guardian_enter';
      this.phaseTime = 0;
      this._enteringGuardianKey = cfg.guardian;
      this._onGuardianArrived = () => {
        E.DialogueBox.open([
          {
            speaker: cfg.speaker,
            portrait: cfg.portrait,
            text: cfg.text
          }
        ], () => {
          launchSpecialMechanic();
        });
      };
    };

    // Puzzle Especial 4: Desafio Musical e da Ordem da Rainha da Ordem
    WLD.startFinalOrderMusicalPuzzle = function () {
      FinalPhaseMusic.setMode('ordem_variant');
      this.finalGuardians.ordem.state = 'sing';
      this.finalMusicalOrder = {
        subPhase: 'rhythm_verse', // 1º: Verso Rítmico da Ordem -> 2º: Ordem dos 4 Cristais Harmônicos
        verseTime: 0,
        verseDuration: 7.4,
        phrase: {
          t0: 0.0,
          t1: 7.4,
          words: [
            { text: 'Quatro',   t: 0.9, dur: 0.6 },
            { text: 'gemas',    t: 2.0, dur: 0.6 },
            { text: 'cantam',   t: 3.1, dur: 0.6 },
            { text: 'em',       t: 4.1, dur: 0.5 },
            { text: 'Ordem!',   t: 4.9, dur: 1.9, isHold: true, holdDur: 1.9 }
          ]
        },
        nextExpected: 1,
        // Ordem e posições diferentes de qualquer fase anterior!
        nodes: [
          { order: 1, x: 194, y: 64, col: '#69f0ae', freq: 523.25, label: '1 · Floresta', lit: false },
          { order: 2, x: 92,  y: 88, col: '#40c4ff', freq: 659.25, label: '2 · Rio',      lit: false },
          { order: 3, x: 214, y: 98, col: '#ff9100', freq: 783.99, label: '3 · Caatinga', lit: false },
          { order: 4, x: 138, y: 58, col: '#e040fb', freq: 1046.5, label: '4 · Ordem',    lit: false }
        ]
      };
      if (global.CaveRhythmKaraoke) {
        global.CaveRhythmKaraoke.practicePhrase = this.finalMusicalOrder.phrase;
        global.CaveRhythmKaraoke.resetPractice();
        global.CaveRhythmKaraoke.layoutPhrase(this.finalMusicalOrder.phrase, { x: 10, y: 153, w: 300, h: 25 });
      }
      this.phase = 'final_musical_order_puzzle';
      this.phaseTime = 0;
    };

    // Quando um puzzle é completado, a fada correspondente entrega sua gema que voa até o encaixe da Porta Ancestral!
    WLD.startGemDeliveryToGate = function (stepIdx) {
      const info = {
        1: { guardian: 'araci',  socketKey: 'forest' },
        2: { guardian: 'irece',  socketKey: 'river' },
        3: { guardian: 'jurema', socketKey: 'caatinga' },
        4: { guardian: 'ordem',  socketKey: 'fairy' }
      }[stepIdx];
      if (!info) return;

      this.forestNinja = null;
      this.riverMelody = null;
      this.shellGame = null;
      this.finalMusicalOrder = null;

      const gActor = this.finalGuardians[info.guardian];
      if (gActor) gActor.state = 'celebrate';
      const targetSocket = DOOR_SOCKETS[info.socketKey];

      this.phase = 'final_gem_delivery';
      this.phaseTime = 0;
      this.gemFlight = {
        startX: gActor ? gActor.x : 96,
        startY: (gActor ? gActor.y : 142) - 24,
        endX: targetSocket.x,
        endY: targetSocket.y,
        col: targetSocket.col,
        socketKey: info.socketKey,
        progress: 0,
        landed: false,
        step: stepIdx
      };
      E.GameHUD.playSfx('reward');
    };

    // Intercepta vitórias dos 3 puzzles especiais no modo Santuário para entregar a gema correspondente
    const origFinishForestNinja = WLD.finishForestNinjaVictory.bind(WLD);
    WLD.finishForestNinjaVictory = function () {
      if (this.worldKey === 'sanctuary') {
        this.startGemDeliveryToGate(1);
        return;
      }
      return origFinishForestNinja();
    };

    const origSliceForestCrystal = WLD.sliceForestCrystal.bind(WLD);
    WLD.sliceForestCrystal = function (crystal, isPractice = false) {
      const ok = origSliceForestCrystal(crystal, isPractice);
      if (this.worldKey === 'sanctuary' && !isPractice && this.forestNinja && ok) {
        const target = this.forestNinja.targetPureCuts || 8;
        if (this.forestNinja.pureCuts >= target) {
          setTimeout(() => {
            if (this.worldKey === 'sanctuary' && this.phase === 'forest_ninja_game') {
              this.startGemDeliveryToGate(1);
            }
          }, 350);
        }
      }
      return ok;
    };

    const origFinishRiverMelody = WLD.finishRiverMelodyVictory.bind(WLD);
    WLD.finishRiverMelodyVictory = function () {
      if (this.worldKey === 'sanctuary') {
        this.startGemDeliveryToGate(2);
        return;
      }
      return origFinishRiverMelody();
    };

    const origClickRiverCrystal = WLD.clickRiverMelodyCrystal.bind(WLD);
    WLD.clickRiverMelodyCrystal = function (gemIdx) {
      if (this.worldKey === 'sanctuary' && this.riverMelody && this.riverMelody.finalMaxRound !== undefined) {
        const rm = this.riverMelody;
        const maxR = rm.finalMaxRound;
        const prevRound = rm.roundIndex;
        const res = origClickRiverCrystal(gemIdx);
        if (res && prevRound >= maxR && rm.phase === 'success_pause') {
          setTimeout(() => {
            if (this.worldKey === 'sanctuary' && this.riverMelody) {
              this.startGemDeliveryToGate(2);
            }
          }, 650);
        }
        return res;
      }
      return origClickRiverCrystal(gemIdx);
    };

    const origSetupShellRound = WLD.setupShellRound.bind(WLD);
    WLD.setupShellRound = function (roundIdx) {
      origSetupShellRound(roundIdx);
      if (this.worldKey === 'sanctuary' && this.shellGame) {
        const rDef = this.shellGame.rounds[this.shellGame.roundIndex];
        if (rDef && typeof rDef.customWin === 'number') {
          this.shellGame.winningCup = rDef.customWin % this.shellGame.cups.length;
          this.shellGame.opalCupIdx = this.shellGame.winningCup;
        }
      }
    };

    // Hook no update() de TruePixelWorlds para gerenciar as fases da Fase Final
    const origUpdate = WLD.update.bind(WLD);
    WLD.update = function (dt) {
      if (this.worldKey === 'sanctuary') {
        if (this.phase === 'shell_game_victory') {
          if (this.phaseTime >= 1.1) {
            this.shellGame = null;
            this.startGemDeliveryToGate(3);
          }
          this.t += dt;
          this.phaseTime += dt;
          return;
        }

        if (
          this.phase === 'final_intro_mystery' ||
          this.phase === 'final_guardian_enter' ||
          this.phase === 'final_musical_order_puzzle' ||
          this.phase === 'final_gem_delivery' ||
          this.phase === 'final_gate_opening' ||
          this.phase === 'final_last_dance' ||
          this.phase === 'final_wall_thanks'
        ) {
          if (E.GameHUD.paused || E.GameHUD.settingsOpen) return;
          this.t += dt;
          this.phaseTime += dt;
          E.IrisTransition.update(dt);
          E.DialogueBox.update(dt);

          if (this.phase === 'final_guardian_enter') {
            const g = this.finalGuardians[this._enteringGuardianKey];
            if (g) {
              g.x += dt * 68;
              if (g.x >= g.targetX) {
                g.x = g.targetX;
                g.state = 'idle';
                const cb = this._onGuardianArrived;
                this._onGuardianArrived = null;
                if (typeof cb === 'function') cb();
              }
            }
          } else if (this.phase === 'final_musical_order_puzzle' && this.finalMusicalOrder) {
            const mo = this.finalMusicalOrder;
            if (mo.subPhase === 'rhythm_verse') {
              mo.verseTime += dt;
              if (global.CaveRhythmKaraoke) {
                global.CaveRhythmKaraoke.update(dt, mo.verseTime, Boolean(this._holdingFinalSpace), true);
              }
              if (mo.verseTime >= mo.verseDuration) {
                mo.subPhase = 'harmonic_nodes';
                this.spawnShatter(160, 78, 'pure', 14);
                E.GameHUD.playSfx('reward');
              }
            }
          } else if (this.phase === 'final_gem_delivery' && this.gemFlight) {
            const gf = this.gemFlight;
            gf.progress = clamp(this.phaseTime / 1.2, 0, 1);
            if (gf.progress >= 1 && !gf.landed) {
              gf.landed = true;
              this.finalDoorSockets[gf.socketKey] = true;
              E.DialogueBox.sockets[gf.socketKey] = true;
              this.obstacleDecay = clamp(gf.step * 0.25, 0, 1);
              this.targetObstacleDecay = this.obstacleDecay;
              E.GameHUD.playSfx('equationShatter');
              this.spawnShatter(gf.endX, gf.endY, 'pure', 14);

              const doneStep = gf.step;
              setTimeout(() => {
                if (this.worldKey !== 'sanctuary') return;
                if (doneStep < 4) {
                  this.startSanctuaryPuzzleStep(doneStep + 1, false);
                } else {
                  // Todas as 4 gemas foram entregues: o Portão se abre!
                  this.phase = 'final_gate_opening';
                  this.phaseTime = 0;
                  this.gateOpenRatio = 0;
                  this._gateConfusionTriggered = false;
                  FinalPhaseMusic.setMode('mystery');
                }
              }, 550);
            }
          } else if (this.phase === 'final_gate_opening') {
            this.gateOpenRatio = clamp(this.phaseTime / 2.0, 0, 1);
            if (this.phaseTime >= 2.1 && !this._gateConfusionTriggered) {
              this._gateConfusionTriggered = true;
              // Protagonista vê que está no início e fica confuso; a fada começa a cantar e diz para segui-la!
              this.protag.state = 'shock';
              this.finalGuardians.ordem.state = 'sing';
              E.DialogueBox.open([
                {
                  speaker: 'Protagonista',
                  portrait: 'portrait_protagonist',
                  text: 'Hã?! O portão se abriu... mas lá dentro é o início da caverna! Eu voltei para o começo de tudo?!'
                },
                {
                  speaker: 'Rainha da Ordem',
                  portrait: 'portrait_ordem',
                  text: '♪ Lá-lá-lá! ♪ Não fique confuso! Ouça minha canção e venha: siga-me para ver tudo o que você transformou!'
                }
              ], () => {
                // Entra na "LAST DANCE": personagens correndo e fundo mostrando cada cenário resolvido e bonito!
                this.phase = 'final_last_dance';
                this.phaseTime = 0;
                this.lastDanceState = {
                  worldIdx: 0,
                  worldTime: 0,
                  scrollX: 0,
                  transitioning: false
                };
                this.protag.state = 'walk';
                for (const g of Object.values(this.finalGuardians)) {
                  g.visible = true;
                  g.state = 'walk';
                  g.flipX = false;
                }
                FinalPhaseMusic.setMode('last_dance');
              });
            }
          } else if (this.phase === 'final_last_dance' && this.lastDanceState) {
            const ld = this.lastDanceState;
            ld.worldTime += dt;
            ld.scrollX += dt * 115;

            const WORLD_DURATION = 3.3;
            if (ld.worldTime >= WORLD_DURATION && !ld.transitioning) {
              ld.transitioning = true;
              E.IrisTransition.start('out', 160, 90, 0.42, () => {
                if (ld.worldIdx < 3) {
                  ld.worldIdx++;
                  ld.worldTime = 0;
                  ld.transitioning = false;
                  E.IrisTransition.start('in', 160, 90, 0.42);
                } else {
                  // Chegam ao fim na área do portão novamente: "Obrigado por jogar" em cristais + pulando de alegria!
                  this.phase = 'final_wall_thanks';
                  this.phaseTime = 0;
                  this.protag.state = 'celebrate';
                  for (const g of Object.values(this.finalGuardians)) {
                    g.state = 'celebrate';
                  }
                  E.IrisTransition.start('in', 160, 90, 0.55);
                }
              });
            }
          } else if (this.phase === 'final_wall_thanks') {
            if (this.phaseTime >= 5.0 && !RollingCredits.active) {
              RollingCredits.start();
            }
          }
          return;
        }
      }
      return origUpdate(dt);
    };

    // Hook de clique para o Puzzle Musical da Ordem (Passo 4)
    const installSanctuaryInputHook = function (cv) {
      if (!cv || cv._sanctuaryFinalHooked) return;
      cv._sanctuaryFinalHooked = true;

      cv.addEventListener('pointerdown', (ev) => {
        if (WLD.worldKey !== 'sanctuary' || WLD.phase !== 'final_musical_order_puzzle' || !WLD.finalMusicalOrder) return;
        if (E.GameHUD.paused || E.GameHUD.settingsOpen || E.DialogueBox.isOpen) return;

        const { x, y } = WLD.toLogicalCoords(ev.clientX, ev.clientY);
        if (y <= 20) return; // Deixa a barra superior do HUD funcionar normalmente

        const mo = WLD.finalMusicalOrder;
        if (mo.subPhase === 'rhythm_verse') {
          WLD._holdingFinalSpace = true;
          global.CaveRhythmKaraoke?.onInput(true, false, mo.verseTime, true);
          FinalPhaseMusic.playTone(659.25, 0.2, 'triangle', 0.16, 0);
          ev.stopImmediatePropagation();
          ev.preventDefault();
          return;
        }

        if (mo.subPhase === 'harmonic_nodes') {
          for (const node of mo.nodes) {
            if (Math.hypot(x - node.x, y - node.y) <= 18) {
              if (node.order === mo.nextExpected) {
                node.lit = true;
                mo.nextExpected++;
                FinalPhaseMusic.playTone(node.freq, 0.45, 'triangle', 0.22, 0);
                WLD.spawnShatter(node.x, node.y, 'pure', 10);
                if (mo.nextExpected > 4) {
                  setTimeout(() => WLD.startGemDeliveryToGate(4), 450);
                }
              } else if (!node.lit) {
                for (const n of mo.nodes) n.lit = false;
                mo.nextExpected = 1;
                E.GameHUD.playSfx('error');
              }
              ev.stopImmediatePropagation();
              ev.preventDefault();
              return;
            }
          }
        }
      }, true);

      window.addEventListener('pointerup', () => {
        if (WLD._holdingFinalSpace && WLD.finalMusicalOrder?.subPhase === 'rhythm_verse') {
          WLD._holdingFinalSpace = false;
          global.CaveRhythmKaraoke?.onInput(false, false, WLD.finalMusicalOrder.verseTime, true);
        }
      });

      window.addEventListener('keydown', (e) => {
        if (WLD.worldKey !== 'sanctuary' || WLD.phase !== 'final_musical_order_puzzle' || !WLD.finalMusicalOrder) return;
        if (e.code === 'Space' || e.key === ' ' || e.code === 'Enter') {
          const mo = WLD.finalMusicalOrder;
          if (mo.subPhase === 'rhythm_verse') {
            e.preventDefault();
            WLD._holdingFinalSpace = true;
            global.CaveRhythmKaraoke?.onInput(true, true, mo.verseTime, true);
          } else if (mo.subPhase === 'harmonic_nodes') {
            e.preventDefault();
            const nextNode = mo.nodes.find((n) => n.order === mo.nextExpected);
            if (nextNode) {
              nextNode.lit = true;
              mo.nextExpected++;
              FinalPhaseMusic.playTone(nextNode.freq, 0.45, 'triangle', 0.22, 0);
              WLD.spawnShatter(nextNode.x, nextNode.y, 'pure', 10);
              if (mo.nextExpected > 4) {
                setTimeout(() => WLD.startGemDeliveryToGate(4), 450);
              }
            }
          }
        }
      });

      window.addEventListener('keyup', (e) => {
        if (WLD._holdingFinalSpace && (e.code === 'Space' || e.key === ' ' || e.code === 'Enter')) {
          WLD._holdingFinalSpace = false;
          if (WLD.finalMusicalOrder?.subPhase === 'rhythm_verse') {
            global.CaveRhythmKaraoke?.onInput(false, true, WLD.finalMusicalOrder.verseTime, true);
          }
        }
      });
    };

    if (WLD.canvas) installSanctuaryInputHook(WLD.canvas);
    const origInit = WLD.init.bind(WLD);
    WLD.init = function () {
      const res = origInit();
      installSanctuaryInputHook(this.canvas);
      return res;
    };

    // Hook no render() de TruePixelWorlds para desenhar as Fadas progressivas, Voo da Gema, Início da Caverna, Last Dance e Parede Final
    const origRender = WLD.render.bind(WLD);
    WLD.render = function () {
      if (this.worldKey !== 'sanctuary') {
        return origRender();
      }

      const ctx = this.ctx;
      const tq = Math.floor(this.t * 24) / 24;
      ctx.imageSmoothingEnabled = false;

      if (this.phase === 'map_iris_in' || this.phase === 'map_active') {
        return origRender();
      }

      // 1. CENA DA "LAST DANCE" (Correndo juntos pelos 4 cenários agora resolvidos e bonitos!)
      if (this.phase === 'final_last_dance' && this.lastDanceState) {
        ctx.setTransform(2, 0, 0, 2, 0, 0);
        const ld = this.lastDanceState;
        drawLastDanceWorldScenery(ctx, ld.worldIdx, ld.scrollX, tq);

        const worldTitles = [
          '✦ Caverna Cristalina Restaurada ✦',
          '✦ Floresta Viva e Florida ✦',
          '✦ Rio das Águas Claras Cristalina ✦',
          '✦ Caatinga Florida e Renovada ✦'
        ];
        E.drawParchmentBox(ctx, 52, 8, 216, 18);
        E.drawPixelTextCentered(ctx, worldTitles[ld.worldIdx], 160, 13, '#ffea31', '#000000', 204, 9);

        const bounce = Math.sin(tq * 14) * 2;
        E.ActorAnimator.drawActor(ctx, 'ordem', 'walk', 238, 142 + bounce, tq, { flipX: false });
        E.ActorAnimator.drawMusicNotesLoop(ctx, 238, 110, tq, { count: 4, dirX: -18, dirY: -14, period: 1.3 });
        E.ActorAnimator.drawActor(ctx, 'jurema', 'walk', 194, 142 - bounce, tq, { flipX: false });
        E.ActorAnimator.drawActor(ctx, 'irece', 'walk', 150, 142 + bounce, tq, { flipX: false });
        E.ActorAnimator.drawActor(ctx, 'araci', 'walk', 106, 142 - bounce, tq, { flipX: false });
        E.ActorAnimator.drawActor(ctx, 'protagonist', 'walk', 62, 142 + bounce, tq, { flipX: false });

        E.IrisTransition.render(ctx);
        return;
      }

      // 2. CENA FINAL DE VOLTA AO PORTÃO COM "OBRIGADO POR JOGAR" ENCRAVADO EM CRISTAIS
      if (this.phase === 'final_wall_thanks') {
        this.waveActive = true;
        this.waveRadius = 400;
        origRender();

        ctx.setTransform(2, 0, 0, 2, 0, 0);
        drawCustomGateSockets(ctx, { forest: true, river: true, caatinga: true, fairy: true }, tq);
        drawCrystalWallInscription(ctx, 'Obrigado por jogar', 154, 54, tq);

        const jump = Math.abs(Math.sin(tq * 9)) * 7;
        E.ActorAnimator.drawActor(ctx, 'araci', 'celebrate', 54, 142 - jump, tq, { flipX: false });
        E.ActorAnimator.drawActor(ctx, 'irece', 'celebrate', 96, 142 - (7 - jump), tq, { flipX: false });
        E.ActorAnimator.drawActor(ctx, 'protagonist', 'celebrate', 144, 142 - jump * 1.1, tq, { flipX: false });
        E.ActorAnimator.drawActor(ctx, 'jurema', 'celebrate', 190, 142 - (7 - jump), tq, { flipX: true });
        E.ActorAnimator.drawActor(ctx, 'ordem', 'celebrate', 226, 142 - jump, tq, { flipX: true });

        E.IrisTransition.render(ctx);
        return;
      }

      // 3. RENDERIZAÇÃO PADRÃO DO PORTÃO ANCESTRAL DURANTE OS 4 PUZZLES ESPECIAIS
      origRender();

      ctx.setTransform(2, 0, 0, 2, 0, 0);

      // Mostra os 4 encaixes na porta conforme as gemas são entregues
      drawCustomGateSockets(ctx, this.finalDoorSockets, tq);

      // Quando o portão se abre, mostra lá dentro o INÍCIO DA CAVERNA (deixando o protagonista confuso!)
      if (this.phase === 'final_gate_opening' || this.gateOpenRatio > 0.02) {
        drawBeginningCaveInsideGate(ctx, this.gateOpenRatio, tq);
      }

      // Desenha APENAS as fadas que já se reuniram conforme os puzzles iniciaram!
      for (const [key, g] of Object.entries(this.finalGuardians)) {
        if (g.visible) {
          E.ActorAnimator.drawActor(ctx, key, g.state, R(g.x), R(g.y), tq, { flipX: g.flipX });
          if (g.state === 'sing') {
            E.ActorAnimator.drawMusicNotesLoop(ctx, R(g.x), R(g.y) - 26, tq, {
              count: 3,
              dirX: g.flipX ? -14 : 14,
              dirY: -16,
              period: 1.5
            });
          }
        }
      }

      // Renderiza o Puzzle Especial 4 (Musical / Rainha da Ordem)
      if (this.phase === 'final_musical_order_puzzle' && this.finalMusicalOrder) {
        const mo = this.finalMusicalOrder;
        if (mo.subPhase === 'rhythm_verse') {
          E.drawParchmentBox(ctx, 32, 24, 256, 18);
          E.drawPixelTextCentered(ctx, 'Cante com a Ordem! Toque ou pressione ESPAÇO no ritmo!', 160, 29, '#ffea31', '#000000', 244, 8);
          global.CaveRhythmKaraoke?.render(ctx, mo.verseTime, true, { x: 10, y: 153, w: 300, h: 25 });
        } else if (mo.subPhase === 'harmonic_nodes') {
          E.drawParchmentBox(ctx, 28, 23, 264, 16);
          E.drawPixelTextCentered(ctx, 'Toque os Cristais Musicais na Ordem: 1 → 2 → 3 → 4', 160, 27, '#ffea31', '#000000', 252, 8);

          for (const node of mo.nodes) {
            const pulse = node.order === mo.nextExpected ? 2 : 0;
            const r = 11 + pulse;
            ctx.fillStyle = node.lit ? '#ffffff' : '#140f24';
            ctx.fillRect(node.x - r, node.y - r, r * 2, r * 2);
            ctx.fillStyle = node.col;
            ctx.fillRect(node.x - r + 2, node.y - r + 2, r * 2 - 4, r * 2 - 4);
            if (node.lit && E.drawStar) {
              E.drawStar(ctx, node.x, node.y, 4, '#ffffff', node.col);
            }
            E.drawPixelTextCentered(ctx, String(node.order), node.x, node.y - 4, '#ffffff', '#000000', 16, 9);
            E.drawPixelTextCentered(ctx, node.label, node.x, node.y + 14, '#ffea31', '#000000', 56, 8);
          }
        }
      }

      // Voo da Gema entregue pela Fada até ocupar o encaixe na Porta Ancestral
      if (this.phase === 'final_gem_delivery' && this.gemFlight) {
        const gf = this.gemFlight;
        const p = easeInOut(gf.progress);
        const gx = R(gf.startX + (gf.endX - gf.startX) * p);
        const gy = R(gf.startY + (gf.endY - gf.startY) * p - Math.sin(p * Math.PI) * 32);

        for (let dy = -6; dy <= 6; dy++) {
          const hw = 6 - Math.abs(dy);
          ctx.fillStyle = gf.col;
          ctx.fillRect(gx - hw, gy + dy, hw * 2 + 1, 1);
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(gx - 2, gy - 2, 4, 4);
        if (E.drawStar) E.drawStar(ctx, gx, gy - 8, 3, '#ffffff', gf.col);
      }

      E.DialogueBox.render(ctx, tq);
      E.TutorialModal.render(ctx, tq);
      E.GameHUD.renderModals(ctx);
      E.IrisTransition.render(ctx);
    };
  }

  // ==========================================================================
  // 6. CARD DE CRÉDITOS EM ESTILO DE CRISTAIS NA TELA INICIAL (#creditsDialog)
  // ==========================================================================
  function upgradeMenuCreditsCard() {
    const dlg = document.getElementById('creditsDialog');
    if (!dlg || dlg._crystalUpgraded) return;
    dlg._crystalUpgraded = true;
    dlg.classList.add('crystal-credits-dialog');
    dlg.innerHTML = `
      <form method="dialog" class="crystal-credits-card">
        <div class="crystal-card-prism-border" aria-hidden="true"></div>
        <header class="crystal-card-header">
          <div class="crystal-card-gems" aria-hidden="true">
            <span class="c-gem gem-cyan">❖</span>
            <span class="c-gem gem-emerald">❖</span>
            <span class="c-gem gem-paraiba">❖</span>
            <span class="c-gem gem-opal">❖</span>
          </div>
          <span class="crystal-card-eyebrow">✦ CRÉDITOS DO JOGO ✦</span>
          <h2 id="creditsTitle" class="crystal-card-title">Crystal Math Mania</h2>
          <p class="crystal-card-subtitle">Sinfonia dos Cristais</p>
        </header>

        <div class="crystal-card-body">
          <section class="crystal-credit-block advisor-block">
            <h3 class="crystal-block-title"><span>◆</span> Orientador e Professor <span>◆</span></h3>
            <div class="crystal-advisor-card">
              <div class="crystal-avatar-ring">
                <img data-credit-img="peterson" alt="Orientador e Professor Peterson Lobato">
              </div>
              <div class="crystal-advisor-meta">
                <strong>Peterson Lobato</strong>
                <span>Orientador e Professor</span>
              </div>
            </div>
          </section>

          <section class="crystal-credit-block">
            <h3 class="crystal-block-title"><span>◆</span> Integrantes da Equipe <span>◆</span></h3>
            <ul class="crystal-team-grid">
              <li class="crystal-team-item">
                <span class="c-gem gem-cyan">✦</span>
                <div>
                  <strong>Heitor Givercy Nascimento Macedo</strong>
                  <small>Gestor</small>
                </div>
              </li>
              <li class="crystal-team-item">
                <span class="c-gem gem-emerald">✦</span>
                <div>
                  <strong>Eyder Sanshes Brandão</strong>
                  <small>Programador</small>
                </div>
              </li>
              <li class="crystal-team-item">
                <span class="c-gem gem-paraiba">✦</span>
                <div>
                  <strong>Ítalo José Bomfim da Rocha</strong>
                  <small>Programador</small>
                </div>
              </li>
              <li class="crystal-team-item">
                <span class="c-gem gem-opal">✦</span>
                <div>
                  <strong>Italo Marcus de Sant'Ana Freitas</strong>
                  <small>Desinger</small>
                </div>
              </li>
            </ul>
          </section>

          <section class="crystal-credit-block">
            <h3 class="crystal-block-title"><span>◆</span> Ferramentas Usadas <span>◆</span></h3>
            <div class="crystal-tools-badges">
              <span class="crystal-badge">VS Code</span>
              <span class="crystal-badge">Antigravity IDE</span>
              <span class="crystal-badge">Codex IDE</span>
              <span class="crystal-badge">PixelLabAi</span>
              <span class="crystal-badge">Google Sala de Aula</span>
              <span class="crystal-badge">Trello</span>
              <span class="crystal-badge">Figma</span>
            </div>
          </section>

          <section class="crystal-credit-block uneb-block">
            <h3 class="crystal-block-title"><span>◆</span> Instituição <span>◆</span></h3>
            <div class="crystal-uneb-card">
              <img class="crystal-uneb-logo" data-credit-img="uneb" alt="Brasão UNEB">
              <strong>Universidade do Estado da Bahia (UNEB)</strong>
            </div>
          </section>
        </div>

        <footer class="crystal-card-footer">
          <button class="pixel-button crystal-close-btn">✦ Voltar ao Menu ✦</button>
        </footer>
      </form>
    `;
  }

  function bootFinalSystem() {
    upgradeMenuCreditsCard();
    hydrateCreditImages(document);
    installFinalPhase();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootFinalSystem);
  } else {
    bootFinalSystem();
  }

  global.FinalPhaseMusic = FinalPhaseMusic;
  global.RollingCredits = RollingCredits;
  global.hydrateCreditImages = hydrateCreditImages;
})(typeof window !== 'undefined' ? window : globalThis);
