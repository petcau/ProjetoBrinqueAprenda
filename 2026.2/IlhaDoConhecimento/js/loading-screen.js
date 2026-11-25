/* Controlador da tela inicial de carregamento (puro JS, compatível com file://). */
window.LoadingScreen = (() => {
  'use strict';

  const THRESHOLD_PERCENT = 80;
  const MIN_DISPLAY_MS = 600;
  const SKIP_BUTTON_DELAY_MS = 15000;
  const HARD_FAILSAFE_MS = 30000;
  const AUDIO_TIMEOUT_MS = 2000;
  const IMAGE_TIMEOUT_MS = 12000;
  const CONCURRENCY = 6;

  const STRINGS = {
    pt: {
      loading: 'Carregando…',
      announceLoading: 'Carregando',
      ready: 'Pronto',
      enterAnyway: 'Entrar mesmo assim',
      title: 'Ilha do Conhecimento'
    },
    en: {
      loading: 'Loading…',
      announceLoading: 'Loading',
      ready: 'Ready',
      enterAnyway: 'Enter anyway',
      title: 'Ilha do Conhecimento'
    }
  };

  function detectLangSync() {
    try {
      const saved = localStorage.getItem('ilha.lang') || localStorage.getItem('ilha.language');
      if (saved && /^en/i.test(saved)) return 'en';
      if (saved && /^pt/i.test(saved)) return 'pt';
    } catch {}
    const docLang = typeof document !== 'undefined' ? document.documentElement?.lang : '';
    return /^en/i.test(docLang) ? 'en' : 'pt';
  }

  function applyEarlyBodyPrefs() {
    if (typeof document === 'undefined' || !document.body) return;
    try {
      if (localStorage.getItem('ilha.largeText') === 'true') document.body.classList.add('large-text');
      if (localStorage.getItem('ilha.calm') === 'true') document.body.classList.add('calm-motion');
    } catch {}
  }

  function isCalmMode() {
    if (typeof document !== 'undefined' && document.body?.classList.contains('calm-motion')) return true;
    try {
      return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch {
      return false;
    }
  }

  function pickAudioUrl(basePath) {
    try {
      const probe = new Audio();
      if (probe.canPlayType && (probe.canPlayType('audio/ogg; codecs="opus"') || probe.canPlayType('audio/ogg'))) {
        return `${basePath}.ogg`;
      }
    } catch {}
    return `${basePath}.mp3`;
  }

  function loadAsset(item) {
    if (item.type === 'font') {
      const ready = typeof document !== 'undefined' && document.fonts && document.fonts.ready;
      if (!ready) return Promise.resolve();
      return Promise.race([
        ready.catch(() => {}),
        new Promise(resolve => setTimeout(resolve, 2500))
      ]);
    }

    if (item.type === 'audio') {
      if (typeof Audio === 'undefined') return Promise.resolve();
      return new Promise(resolve => {
        let settled = false;
        const audio = new Audio();
        const finish = (failed) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          audio.removeEventListener('canplaythrough', onReady);
          audio.removeEventListener('loadeddata', onReady);
          audio.removeEventListener('error', onError);
          if (failed) console.warn('[Loading] Áudio não carregado a tempo (seguindo):', audio.src || item.src);
          resolve();
        };
        const onReady = () => finish(false);
        const onError = () => finish(true);
        const timer = setTimeout(() => finish(false), AUDIO_TIMEOUT_MS);
        audio.preload = 'auto';
        audio.addEventListener('canplaythrough', onReady, { once: true });
        audio.addEventListener('loadeddata', onReady, { once: true });
        audio.addEventListener('error', onError, { once: true });
        audio.src = pickAudioUrl(item.src);
        try { audio.load(); } catch { finish(true); }
      });
    }

    if (typeof Image === 'undefined') return Promise.resolve();
    return new Promise(resolve => {
      let settled = false;
      const img = new Image();
      const finish = (failed) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        img.onload = null;
        img.onerror = null;
        if (failed) console.warn('[Loading] Falha ao carregar imagem:', item.src);
        resolve();
      };
      const timer = setTimeout(() => finish(true), IMAGE_TIMEOUT_MS);
      img.onload = () => finish(false);
      img.onerror = () => finish(true);
      img.src = item.src;
    });
  }

  function init() {
    if (typeof document === 'undefined') return null;
    const screen = document.getElementById('loading-screen');
    if (!screen) return null;

    applyEarlyBodyPrefs();

    const lang = detectLangSync();
    const t = STRINGS[lang] || STRINGS.pt;
    const labelEl = document.getElementById('loading-label');
    const percentEl = document.getElementById('loading-percent');
    const announceEl = document.getElementById('loading-announce');
    const skipBtn = document.getElementById('loading-skip-btn');
    const logoImg = document.getElementById('loading-logo-img');
    const logoFallback = document.getElementById('loading-logo-fallback');

    if (labelEl) labelEl.textContent = t.loading;
    if (skipBtn) skipBtn.textContent = t.enterAnyway;
    if (logoFallback) logoFallback.textContent = t.title;
    if (announceEl) announceEl.textContent = t.announceLoading;

    if (logoImg) {
      const showLogo = () => {
        logoImg.classList.remove('is-hidden');
        if (logoFallback) logoFallback.hidden = true;
      };
      const showFallback = () => {
        logoImg.classList.add('is-hidden');
        if (logoFallback) logoFallback.hidden = false;
      };
      if (logoImg.complete && logoImg.naturalWidth > 0) showLogo();
      else {
        logoImg.addEventListener('load', showLogo, { once: true });
        logoImg.addEventListener('error', showFallback, { once: true });
      }
    }

    const manifest = Array.isArray(window.ASSET_MANIFEST) ? window.ASSET_MANIFEST : [];
    const totalWeight = manifest.reduce((acc, item) => acc + Math.max(1, Number(item.weight) || 1), 0) || 1;
    let loadedWeight = 0;
    let maxRealPercent = 0;
    let displayedPercent = 0;
    let closed = false;
    let rafId = 0;
    let lastTime = 0;
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    function nowMs() {
      return typeof performance !== 'undefined' ? performance.now() : Date.now();
    }

    function dismiss() {
      if (closed) return;
      closed = true;
      window.__loadingScreenDone = true;
      if (rafId) cancelAnimationFrame(rafId);
      clearTimeout(skipTimer);
      clearTimeout(failsafeTimer);
      if (announceEl) announceEl.textContent = t.ready;
      if (percentEl) percentEl.textContent = `${Math.max(THRESHOLD_PERCENT, Math.round(displayedPercent))}%`;

      if (isCalmMode()) {
        screen.hidden = true;
        return;
      }
      screen.classList.add('is-leaving');
      setTimeout(() => { screen.hidden = true; }, 290);
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', () => dismiss());
    }

    const skipTimer = setTimeout(() => {
      if (!closed && skipBtn) {
        skipBtn.hidden = false;
      }
    }, SKIP_BUTTON_DELAY_MS);

    const failsafeTimer = setTimeout(() => {
      if (!closed) dismiss();
    }, HARD_FAILSAFE_MS);

    function tick(ts) {
      if (closed) return;
      const now = ts || nowMs();
      const dt = lastTime ? Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000)) : 0.016;
      lastTime = now;

      // Sobe suavemente sem nunca voltar para trás nem pular bruscamente (máx ~115%/s)
      if (displayedPercent < maxRealPercent) {
        const diff = maxRealPercent - displayedPercent;
        const step = Math.min(diff, Math.max(14 * dt, Math.min(115 * dt, diff * Math.min(1, dt * 8))));
        displayedPercent = Math.min(maxRealPercent, displayedPercent + step);
      }

      if (percentEl) percentEl.textContent = `${Math.round(displayedPercent)}%`;

      const elapsed = nowMs() - startTime;
      if (maxRealPercent >= THRESHOLD_PERCENT && displayedPercent >= THRESHOLD_PERCENT && elapsed >= MIN_DISPLAY_MS) {
        dismiss();
        return;
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    // Fila priorizada com concorrência limitada; após 80%, os ~20% restantes seguem em segundo plano
    let cursor = 0;
    function nextWorker() {
      if (cursor >= manifest.length) return Promise.resolve();
      const item = manifest[cursor++];
      const w = Math.max(1, Number(item.weight) || 1);
      return loadAsset(item).then(() => {
        loadedWeight += w;
        const pct = Math.min(100, (loadedWeight / totalWeight) * 100);
        if (pct > maxRealPercent) maxRealPercent = pct;
        return nextWorker();
      });
    }

    if (manifest.length === 0) {
      maxRealPercent = 100;
    } else {
      const workers = [];
      const count = Math.min(CONCURRENCY, manifest.length);
      for (let i = 0; i < count; i++) workers.push(nextWorker());
      Promise.all(workers).then(() => {
        maxRealPercent = 100;
      });
    }

    return {
      dismiss,
      get realPercent() { return maxRealPercent; },
      get displayedPercent() { return displayedPercent; },
      get closed() { return closed; },
      get lang() { return lang; }
    };
  }

  const instance = init();
  return {
    STRINGS,
    THRESHOLD_PERCENT,
    MIN_DISPLAY_MS,
    SKIP_BUTTON_DELAY_MS,
    HARD_FAILSAFE_MS,
    detectLangSync,
    instance
  };
})();
