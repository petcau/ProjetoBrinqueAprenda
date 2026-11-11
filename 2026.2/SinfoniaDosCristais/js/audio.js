/* Chiptune & Crystalline SFX: rich WebAudio synthesis for crystals, fire opal, equations, and UI. */
(() => {
 let ctx, bus, noiseBuf, volume = 0.5, enabled = true, lastClink = -1, lastPulse = -1;

 function ensure(silent = false) {
  if (!ctx) {
   const C = window.AudioContext || window.webkitAudioContext;
   if (!C) return null;
   try {
    ctx = new C();
    bus = ctx.createGain();
    bus.gain.value = enabled ? volume : 0;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -10;
    limiter.ratio.value = 6;
    bus.connect(limiter).connect(ctx.destination);

    // Pre-build white noise buffer for crystal shatters and Fire Opal crackling
    const sr = ctx.sampleRate || 44100;
    noiseBuf = ctx.createBuffer(1, Math.floor(sr * 0.5), sr);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
     data[i] = Math.random() * 2 - 1;
    }
   } catch {
    return null;
   }
  }
  if (!silent && ctx.state === 'suspended') {
   ctx.resume().catch(() => {});
  }
  return ctx;
 }

 function tone(f, t, d, type = 'triangle', v = 0.11, end = f) {
  if (!enabled || !ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(24, f), t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(24, end), t + d);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, v), t + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + d);
  osc.connect(gain).connect(bus);
  osc.start(t);
  osc.stop(t + d + 0.015);
  osc.onended = () => {
   osc.disconnect();
   gain.disconnect();
  };
 }

 function noiseBurst(t, d, filterFreq = 1800, filterType = 'bandpass', q = 2.0, v = 0.12, endFreq = filterFreq) {
  if (!enabled || !ctx || !noiseBuf) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.Q.setValueAtTime(q, t);
  filter.frequency.setValueAtTime(Math.max(60, filterFreq), t);
  if (endFreq !== filterFreq) {
   filter.frequency.exponentialRampToValueAtTime(Math.max(60, endFreq), t + d);
  }
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, v), t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + d);
  src.connect(filter).connect(gain).connect(bus);
  src.start(t);
  src.stop(t + d + 0.015);
  src.onended = () => {
   src.disconnect();
   filter.disconnect();
   gain.disconnect();
  };
 }

 function cue(notes, delay = 0.055, type = 'triangle', v = 0.10, dur = 0.16) {
  if (!enabled || !ensure()) return;
  const t = ctx.currentTime;
  notes.forEach((f, i) => tone(f, t + i * delay, dur, type, v));
 }

 window.CrystalAudio = {
  unlock: ensure,
  hover() {
   if (!enabled || !ctx || ctx.state === 'suspended') return;
   const t = ctx.currentTime;
   tone(1046.5, t, 0.045, 'triangle', 0.07, 1318.5);
   tone(2093, t + 0.008, 0.035, 'sine', 0.04, 2637);
  },
  click() {
   cue([587.3, 880], 0.038, 'triangle', 0.11, 0.11);
  },
  start() {
   cue([261.6, 392, 523.3, 784, 1046.5], 0.075, 'triangle', 0.12, 0.2);
  },
  grab() {
   cue([659.3, 987.8], 0.028, 'triangle', 0.10, 0.11);
  },
  drop() {
   cue([987.8, 659.3], 0.028, 'triangle', 0.09, 0.11);
  },

  // 1. SONS DO TUTORIAL PAGINADO
  tutorialOpen() {
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
    tone(f, t + i * 0.048, 0.18, 'triangle', 0.11);
    tone(f * 2, t + i * 0.048 + 0.01, 0.12, 'sine', 0.05);
   });
  },
  tutorialAdvance() {
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   tone(659.25, t, 0.09, 'triangle', 0.11, 783.99);
   tone(987.77, t + 0.04, 0.13, 'triangle', 0.12, 1318.5);
   tone(1975.5, t + 0.05, 0.09, 'sine', 0.06);
  },
  tutorialClose() {
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   [523.25, 783.99, 1046.5, 1567.98].forEach((f, i) => {
    tone(f, t + i * 0.04, 0.2, 'triangle', 0.11);
   });
  },

  // 2. SONS DE QUARTZO BRANCO E QUARTZO ROSA (PEGAR, SOLTAR E FUSÃO HARMÔNICA)
  quartzGrab() {
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   tone(783.99, t, 0.09, 'triangle', 0.11, 1046.5);
   tone(1567.98, t + 0.02, 0.11, 'sine', 0.08, 2093);
  },
  quartzDrop() {
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   tone(1046.5, t, 0.08, 'triangle', 0.10, 783.99);
   tone(1567.98, t + 0.015, 0.07, 'sine', 0.06, 1174.7);
  },
  roseGrab() {
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   tone(659.25, t, 0.10, 'triangle', 0.11, 880);
   tone(1318.5, t + 0.02, 0.12, 'sine', 0.08, 1760);
   tone(1975.5, t + 0.035, 0.09, 'sine', 0.05);
  },
  roseDrop() {
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   tone(880, t, 0.08, 'triangle', 0.10, 659.25);
   tone(1318.5, t + 0.015, 0.08, 'sine', 0.06, 987.77);
  },
  quartzMerge() {
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   // Acorde cristalino brilhante de fusão (Quartzo Branco)
   [523.25, 783.99, 1046.5, 1567.98].forEach((f, i) => {
    tone(f, t + i * 0.032, 0.24, 'triangle', 0.12);
    tone(f * 1.5, t + i * 0.032 + 0.01, 0.16, 'sine', 0.06);
   });
   noiseBurst(t, 0.06, 3800, 'bandpass', 4.0, 0.07, 5200);
  },
  roseMerge() {
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   // Acorde lírico rosado de fusão (Quartzo Rosa)
   [440, 659.25, 880, 1108.73, 1760].forEach((f, i) => {
    tone(f, t + i * 0.032, 0.25, 'triangle', 0.12);
    tone(f * 2, t + i * 0.032 + 0.01, 0.15, 'sine', 0.06);
   });
   noiseBurst(t, 0.06, 3200, 'bandpass', 4.0, 0.07, 4600);
  },

  // 3. SONS DA OPALA DE FOGO (PEGAR, SOLTAR, CREPITAR E SUBTRAIR)
  opalGrab() {
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   noiseBurst(t, 0.11, 520, 'bandpass', 1.8, 0.13, 1400);
   tone(220, t, 0.10, 'sawtooth', 0.08, 392);
   tone(440, t + 0.02, 0.08, 'triangle', 0.07, 659.25);
  },
  opalDrop() {
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   noiseBurst(t, 0.09, 950, 'bandpass', 2.0, 0.11, 340);
   tone(349.23, t, 0.09, 'sawtooth', 0.07, 196);
  },
  opalPulse() {
   if (!enabled || !ensure()) return;
   if (ctx.currentTime - lastPulse < 0.11) return;
   lastPulse = ctx.currentTime;
   const t = ctx.currentTime;
   // Crepitar de brasa/fogo enquanto a Opala de Fogo treme próxima ao cristal
   noiseBurst(t, 0.065, 1100 + Math.random() * 700, 'bandpass', 2.6, 0.11, 620);
   tone(180 + Math.random() * 55, t, 0.055, 'sawtooth', 0.06, 130);
  },
  opalSubtract() {
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   // Combustão ígnea + estalo de brasa + redução cristalina de 1 unidade
   noiseBurst(t, 0.16, 1600, 'bandpass', 1.6, 0.16, 420);
   noiseBurst(t + 0.03, 0.09, 3400, 'highpass', 1.2, 0.10, 1800);
   tone(587.33, t, 0.11, 'sawtooth', 0.09, 293.66);
   tone(1174.66, t + 0.015, 0.12, 'triangle', 0.11, 587.33);
   tone(1760, t + 0.04, 0.09, 'sine', 0.07, 880);
  },

  // 4. SONS DA EQUAÇÃO CRISTALINA (EXPANDIR, FECHAR, ENCAIXAR, RETIRAR, ATRAÇÃO MAGNÉTICA E QUEBRA)
  equationExpand() {
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   tone(329.63, t, 0.18, 'sine', 0.11, 659.25);
   tone(493.88, t + 0.03, 0.18, 'triangle', 0.10, 987.77);
   tone(1318.5, t + 0.07, 0.14, 'sine', 0.08, 1567.98);
  },
  equationCollapse() {
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   tone(659.25, t, 0.16, 'sine', 0.11, 329.63);
   tone(987.77, t + 0.025, 0.16, 'triangle', 0.10, 493.88);
  },
  equationInsert() {
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   tone(523.25, t, 0.09, 'triangle', 0.11, 783.99);
   tone(1046.5, t + 0.04, 0.14, 'sine', 0.11, 1318.5);
  },
  equationRemove() {
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   tone(987.77, t, 0.08, 'triangle', 0.10, 659.25);
   tone(659.25, t + 0.04, 0.11, 'sine', 0.09, 440);
  },
  equationMagnetic() {
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   // Pulso magnético convergente durante os 0.75s de atração das duas equações
   tone(220, t, 0.72, 'sine', 0.12, 880);
   tone(330, t + 0.04, 0.68, 'triangle', 0.10, 1318.5);
   for (let i = 0; i < 6; i++) {
    tone(523.25 + i * 140, t + i * 0.11, 0.09, 'sine', 0.08, 659.25 + i * 180);
   }
  },
  equationShatter() {
   if (!enabled || !ensure()) return;
   this.shatter();
   const t = ctx.currentTime;
   tone(196, t, 0.26, 'triangle', 0.14, 78);
   [1046.5, 1318.5, 1567.98, 2093].forEach((f, i) => {
    tone(f, t + 0.05 + i * 0.04, 0.22, 'triangle', 0.12);
   });
  },

  // 5. SOM NÍTIDO DE ESTILHAÇAR / QUEBRAR CRISTAIS (PURO + SOMBRIO OU CRISTAL ENORME DO TETO)
  shatter() {
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   // Impacto vítreo + explosão de estilhaços cristalinos em cascata
   noiseBurst(t, 0.19, 2800, 'bandpass', 1.4, 0.18, 950);
   noiseBurst(t + 0.015, 0.14, 5200, 'highpass', 1.8, 0.14, 2400);
   tone(310, t, 0.15, 'triangle', 0.13, 95);
   [1174.66, 1567.98, 2093, 2637, 1760, 1396.9, 2349.3].forEach((f, i) => {
    const dt = i * 0.034;
    tone(f, t + dt, 0.14, 'triangle', 0.12, f * 0.62);
    tone(f * 1.5, t + dt + 0.008, 0.09, 'sine', 0.07, f * 0.9);
   });
  },
  ceilingShatter() {
   if (!enabled || !ensure()) return;
   this.shatter();
   const t = ctx.currentTime;
   noiseBurst(t + 0.06, 0.32, 1600, 'bandpass', 1.1, 0.20, 420);
   tone(146.83, t, 0.38, 'sawtooth', 0.14, 55);
   [2637, 2349.3, 2093, 1760, 1567.98, 1318.5].forEach((f, i) => {
    tone(f, t + 0.12 + i * 0.05, 0.22, 'triangle', 0.12, f * 0.5);
   });
  },

  // 6. EFEITOS ESPECIAIS DO MUNDO DA CAATINGA (FORMAS GEOMÉTRICAS ELÉTRICAS, TESSELAÇÃO E SHELL GAME)
  electricHum() {
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   tone(120, t, 0.18, 'sawtooth', 0.04, 180);
   tone(240, t + 0.02, 0.16, 'triangle', 0.035, 360);
  },
  electricReject() {
   // Estalo elétrico seco e grave ('bzzz-thump' / 'bzzz-clack') ao rejeitar entrada na barreira elétrica
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   noiseBurst(t, 0.12, 1850, 'bandpass', 2.6, 0.17, 420);
   tone(165, t, 0.14, 'sawtooth', 0.15, 62);
   tone(98, t + 0.03, 0.18, 'square', 0.13, 48);
   tone(1320, t + 0.01, 0.05, 'sawtooth', 0.08, 310);
  },
  shapeMaterialize() {
   // Acoplamento / síntese de forma: tremor sub-grave + clique cristalino facetado
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   tone(82.41, t, 0.22, 'sine', 0.15, 55);
   noiseBurst(t + 0.02, 0.06, 3200, 'bandpass', 3.2, 0.11, 1800);
   [587.33, 880, 1174.66, 1760].forEach((f, i) => {
    tone(f, t + 0.025 + i * 0.028, 0.15, 'triangle', 0.11, f * 1.04);
   });
  },
  shapeSnap() {
   this.shapeMaterialize();
  },
  shapeBanner() {
   // Jingle triunfante de 3 notas em marimba de quartzo ao exibir o banner flutuante ('QUADRADO!', 'PENTÁGONO!', etc.)
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   [523.25, 659.25, 1046.5].forEach((f, i) => {
    const dt = i * 0.075;
    tone(f, t + dt, 0.22, 'triangle', 0.13, f * 0.99);
    tone(f * 2, t + dt + 0.008, 0.12, 'sine', 0.06, f * 1.98);
   });
  },
  sandSlide() {
   // Deslize arenoso ('shhh-shhh') + batida oca de argila ao mover os copos de arenito no Shell Game
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   noiseBurst(t, 0.16, 1400, 'bandpass', 1.5, 0.09, 680);
   tone(196, t + 0.11, 0.08, 'sine', 0.08, 110);
  },
  cupStop() {
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   tone(175, t, 0.09, 'triangle', 0.11, 92);
   noiseBurst(t, 0.05, 900, 'lowpass', 1.2, 0.08, 400);
  },
  shellHit() {
   // Jingle harmônico ascendente ao encontrar a Opala de Fogo Primordial sob o copo de arenito
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   [587.33, 739.99, 880, 1174.66].forEach((f, i) => {
    const dt = i * 0.065;
    tone(f, t + dt, 0.2, 'triangle', 0.13, f * 1.02);
    tone(f * 1.5, t + dt + 0.01, 0.12, 'sine', 0.06);
   });
  },
  shellMiss() {
   // Nuvem inofensiva de poeira ao levantar um copo vazio (sem penalidade)
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   noiseBurst(t, 0.18, 950, 'bandpass', 1.1, 0.11, 380);
   tone(293.66, t, 0.14, 'triangle', 0.08, 220);
  },

  // 7. CORTE CRISTALINO ('FRUIT NINJA' DA FLORESTA) E COMBOS
  crystalSlice() {
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   noiseBurst(t, 0.07, 5200, 'highpass', 2.2, 0.16, 2600);
   tone(880, t, 0.11, 'triangle', 0.15, 1760);
   tone(1320, t + 0.015, 0.08, 'sine', 0.12, 2640);
  },
  comboChime(count = 2) {
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   const mult = Math.min(2.2, 1 + (count - 2) * 0.22);
   const base = 523.25 * mult;
   const notes = [base, base * 1.25, base * 1.5, base * 2.0];
   notes.slice(0, Math.min(4, count + 1)).forEach((f, i) => {
    tone(f, t + i * 0.038, 0.20, 'triangle', 0.14, f * 1.04);
    tone(f * 2, t + i * 0.038 + 0.008, 0.11, 'sine', 0.07);
   });
  },
  shadowStrike() {
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   noiseBurst(t, 0.22, 850, 'bandpass', 1.8, 0.22, 160);
   tone(110, t, 0.24, 'sawtooth', 0.18, 48);
   tone(73.42, t + 0.03, 0.28, 'square', 0.15, 36);
  },
  playRiverNote(noteIdx = 0) {
   if (!enabled || !ensure()) return;
   const freqs = [523.25, 587.33, 659.25, 783.99, 880.00];
   const f = freqs[Math.max(0, Math.min(freqs.length - 1, noteIdx))] || 523.25;
   const t = ctx.currentTime;
   tone(f, t, 0.45, 'sine', 0.18);
   tone(f * 2.0, t + 0.003, 0.32, 'triangle', 0.10);
   tone(f * 2.756, t + 0.002, 0.22, 'sine', 0.06);
  },
  fractionPinkGlow() {
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   tone(783.99, t, 0.24, 'triangle', 0.12, 1046.5);
   tone(1174.66, t + 0.03, 0.26, 'sine', 0.09, 1318.5);
  },
  fractionDivide() {
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   cue([523.25, 659.25, 783.99, 1046.5, 1318.5], 0.045, 'triangle', 0.13, 0.32);
   noiseBurst(t, 0.24, 2400, 'bandpass', 2.5, 0.11, 800);
  },
  errorFairy() {
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   tone(349.23, t, 0.24, 'triangle', 0.11, 311.13);
   tone(277.18, t + 0.05, 0.30, 'sawtooth', 0.07, 246.94);
   noiseBurst(t, 0.14, 600, 'lowpass', 1.0, 0.05);
  },

  setEnabled(v) {
   enabled = Boolean(v);
   if (bus && ctx) bus.gain.setTargetAtTime(enabled ? volume : 0, ctx.currentTime, 0.02);
  },
  setVolume(v) {
   const num = Number(v);
   volume = Math.max(0, Math.min(1, Number.isFinite(num) ? num : 0.5));
   if (volume > 0) enabled = true;
   if (bus && ctx) bus.gain.setTargetAtTime(enabled ? volume : 0, ctx.currentTime, 0.02);
  },
  clink() {
   if (!enabled || !ensure() || ctx.currentTime - lastClink < 0.065) return;
   lastClink = ctx.currentTime;
   tone(1568, ctx.currentTime, 0.075, 'square', 0.07, 1175);
   tone(3136, ctx.currentTime, 0.11, 'triangle', 0.09);
  },
  launch() {
   if (!enabled || !ensure()) return;
   tone(180, ctx.currentTime, 0.16, 'triangle', 0.11, 800);
  },
  splash() {
   if (!enabled || !ensure()) return;
   [950, 1430, 620, 390].forEach((f, i) => tone(f, ctx.currentTime + i * 0.025, 0.12, 'triangle', 0.09, 100));
  },
  reward(n = 3) {
   cue([261.6, 329.6, 392, 523.3, 659.3].slice(0, Math.max(2, n + 1)), 0.06, 'triangle', 0.11, 0.18);
  },
  error() {
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   tone(233.08, t, 0.11, 'sawtooth', 0.11, 174.61);
   tone(174.61, t + 0.07, 0.15, 'sawtooth', 0.11, 130.81);
  },
  gameOver() {
   if (!enabled || !ensure()) return;
   const t = ctx.currentTime;
   [392.0, 349.23, 311.13, 261.63].forEach((f, i) => {
    tone(f, t + i * 0.11, 0.24, 'triangle', 0.12, f * 0.94);
    tone(f * 0.5, t + i * 0.11, 0.26, 'sawtooth', 0.06, f * 0.47);
   });
  },
  finale() {
   cue([261.6, 329.6, 392, 523.3, 659.3, 784], 0.1, 'triangle', 0.12, 0.22);
  },
  stopAllMusic(except = null) {
   if (menuTrack && menuTrack !== except) {
    try { menuTrack.pause(); menuTrack.currentTime = 0; } catch (_) {}
   }
   if (typeof window !== 'undefined') {
    const cave = window.CaveChapter1;
    if (cave?.musicAudio && cave.musicAudio !== except) {
     try { cave.musicAudio.pause(); } catch (_) {}
    }
    const worlds = window.TruePixelWorlds;
    if (worlds?.regularAudio && worlds.regularAudio !== except) {
     try { worlds.regularAudio.pause(); } catch (_) {}
    }
    if (worlds?.musicAudio && worlds.musicAudio !== except) {
     try { worlds.musicAudio.pause(); } catch (_) {}
    }
   }
  },
  get enabled() {
   return enabled;
  },
  getVolume() {
   return volume;
  },
  isMuted() {
   return !enabled || volume <= 0;
  }
 };

 function getAssetUrl(relPath) {
  try {
   const base = (typeof document !== 'undefined' && (document.querySelector('base')?.href || document.baseURI)) || (typeof location !== 'undefined' ? location.href : '');
   if (base) return new URL(relPath, base).href;
  } catch {}
  return relPath;
 }

 const hasAudio = typeof Audio !== 'undefined';
 const menuTrack = hasAudio ? new Audio(getAssetUrl('assets/audio/musica-menu.mp3')) : null;
 if (menuTrack) {
  menuTrack.loop = true;
  menuTrack.preload = 'auto';
  menuTrack.setAttribute?.('playsinline', '');
  menuTrack.playsInline = true;
 }
 let menuVol = 0.5;
 if (menuTrack) menuTrack.volume = menuVol;

 let unlockActive = false;
 function setupInteractionUnlock() {
  if (unlockActive || typeof window === 'undefined') return;
  unlockActive = true;
  const events = ['click', 'pointerdown', 'pointerup', 'touchstart', 'touchend', 'keydown'];
  const handler = () => {
   ensure();
   if (!document.body?.dataset?.screen || document.body.dataset.screen === 'home') {
    if (menuTrack && menuTrack.paused) {
     window.CrystalAudio?.stopAllMusic?.(menuTrack);
     menuTrack.volume = menuVol;
     menuTrack.play().then(() => { teardown(); }).catch(() => {});
     return;
    }
   } else {
    teardown();
   }
   if (menuTrack && !menuTrack.paused) {
    teardown();
   }
  };
  function teardown() {
   unlockActive = false;
   events.forEach(ev => {
    window.removeEventListener(ev, handler, true);
    document.removeEventListener(ev, handler, true);
   });
  }
  events.forEach(ev => {
   window.addEventListener(ev, handler, { capture: true, passive: true });
   document.addEventListener(ev, handler, { capture: true, passive: true });
  });
 }

 window.CrystalMenuAudio = {
  get track() { return menuTrack; },
  get playing() { return Boolean(menuTrack && !menuTrack.paused); },
  getVolume() { return menuVol; },
  play() {
   if (typeof document !== 'undefined' && document.body?.dataset?.screen && document.body.dataset.screen !== 'home') {
    if (menuTrack) try { menuTrack.pause(); } catch (_) {}
    return Promise.resolve();
   }
   if (!menuTrack || !menuTrack.paused) return Promise.resolve();
   window.CrystalAudio?.stopAllMusic?.(menuTrack);
   menuTrack.volume = menuVol;
   return menuTrack.play().catch(() => {
    setupInteractionUnlock();
   });
  },
  pause() {
   if (menuTrack) menuTrack.pause();
  },
  stop() {
   if (menuTrack) {
    menuTrack.pause();
    menuTrack.currentTime = 0;
   }
  },
  setVolume(v) {
   const num = Number(v);
   menuVol = Math.max(0, Math.min(1, Number.isFinite(num) ? num : 0.5));
   if (menuTrack) {
    menuTrack.muted = menuVol <= 0;
    menuTrack.volume = menuVol;
    if (menuVol > 0 && menuTrack.paused && typeof document !== 'undefined' && (!document.body?.dataset?.screen || document.body.dataset.screen === 'home')) {
     menuTrack.play().catch(() => {});
    }
   }
  },
  autoStart() {
   if (!menuTrack) return;
   menuTrack.volume = menuVol;
   const p = menuTrack.play();
   if (p && typeof p.catch === 'function') {
    p.catch(() => {
     setupInteractionUnlock();
    });
   }
  }
 };

 if (typeof window !== 'undefined') {
  setupInteractionUnlock();
  // Pre-warm audio graph during idle time to eliminate hover latency
  const prewarm = () => { try { ensure(true); } catch {} };
  if (typeof requestIdleCallback === 'function') {
   requestIdleCallback(prewarm);
  } else {
   setTimeout(prewarm, 100);
  }
  if (document.readyState === 'loading') {
   window.addEventListener('DOMContentLoaded', () => window.CrystalMenuAudio?.autoStart?.());
  } else {
   window.CrystalMenuAudio?.autoStart?.();
  }
 }
})();