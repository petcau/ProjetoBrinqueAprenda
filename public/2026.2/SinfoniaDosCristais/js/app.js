(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const KEY = 'crystal-campaign-v4';
  const defaults = { music: 0.5, fx: 0.5, voice: false, contrast: false, motion: false, assist: false };
  let settings = { ...defaults };
  let completed = [];
  let records = {};
  let current = 1;
  let hasSave = false;
  let screen = 'home';
  let toastTimer = null;

  let save = null;
  try {
    save = JSON.parse(localStorage.getItem(KEY));
  } catch {}
  if (save) {
    settings = { ...defaults, ...cleanSettings(save.settings) };
    const loadedCompleted = cleanProgress(save.completed);
    const loadedRecords = save.records && typeof save.records === 'object' ? save.records : {};
    const isUnverifiedDefaultDump = loadedCompleted.length === 20 && Object.keys(loadedRecords).length === 0 && !save.hasSave;
    if (!isUnverifiedDefaultDump) {
      completed = loadedCompleted;
      records = loadedRecords;
      current = Math.min(21, Math.max(1, Number(save.current) || 1));
      hasSave = Boolean(save.hasSave || completed.length > 0 || current > 1 || Object.keys(records).length > 0);
    }
  }

  function cleanSettings(s) {
    const out = {};
    for (const k of ['music', 'fx']) {
      if (Number.isFinite(s?.[k])) {
        let v = Number(s[k]);
        if (v > 1) v = v / 100;
        // Recover from legacy /100 bug where 0.5 or 0.65 became 0.005 / 0.0065
        if (v > 0 && v <= 0.02) v = 0.5;
        out[k] = Math.max(0, Math.min(1, v));
      }
    }
    for (const k of ['voice', 'contrast', 'motion', 'assist']) {
      if (typeof s?.[k] === 'boolean') out[k] = s[k];
    }
    return out;
  }

  function cleanProgress(list) {
    return Array.isArray(list)
      ? [...new Set(list.filter(n => Number.isInteger(n) && n >= 1 && n <= 21))]
      : [];
  }

  function unlocked() {
    let n = 1;
    while (completed.includes(n) && n < 20) n++;
    return n;
  }

  function speak(text) {
    if (!settings.voice || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR';
    u.rate = 0.95;
    speechSynthesis.speak(u);
  }

  function notify(message) {
    const fb = $('feedback');
    if (fb) {
      fb.textContent = message;
      fb.classList.add('visible');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => fb.classList.remove('visible'), 4300);
    }
    speak(message);
  }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ version: 4, settings, completed, current, records, hasSave }));
      return true;
    } catch {
      return false;
    }
  }

  function updateProgressLabels() {
    const done20 = completed.filter(id => id <= 20).length;
    if ($('mapProgress')) {
      $('mapProgress').textContent = done20 + ' / 20 fases restauradas';
    }
    if ($('homeSave')) {
      $('homeSave').textContent = done20
        ? done20 + ' de 20 fases restauradas. Seu caminho está salvo.'
        : 'Sua jornada começa com um pequeno brilho.';
    }
  }

  function syncTruePixelSockets() {
    window.TruePixelEngine?.DialogueBox?.syncSocketsFromCompleted?.(completed);
  }

  function applySettings() {
    document.body.classList.toggle('high-contrast', settings.contrast);
    document.body.classList.toggle('reduce-motion', settings.motion);

    const hud = window.TruePixelEngine?.GameHUD;
    if (hud) {
      if (settings.music > 0 || settings.fx > 0) {
        hud.muted = false;
      }
      hud.musicVol = Math.round(settings.music * 100);
      hud.sfxVol = Math.round(settings.fx * 100);
      hud.reducedMotion = settings.motion;
      hud.syncAudio?.();
    }

    window.CrystalAudio?.setVolume?.(settings.fx);
    window.CrystalAudio?.setEnabled?.(settings.fx > 0);
    window.CrystalMenuAudio?.setVolume?.(settings.music);
    if (screen === 'home' && settings.music > 0) {
      window.CrystalMenuAudio?.play?.();
    }

    for (const [id, k] of [
      ['voiceToggle', 'voice'],
      ['contrastToggle', 'contrast'],
      ['motionToggle', 'motion'],
      ['assistToggle', 'assist']
    ]) {
      const el = $(id);
      if (el) el.checked = settings[k];
    }
    for (const k of ['music', 'fx']) {
      const slider = $(k + 'Volume');
      const out = $(k + 'Value');
      if (slider) slider.value = String(Math.round(settings[k] * 100));
      if (out) out.textContent = Math.round(settings[k] * 100) + '%';
    }
  }

  function renderMap() {
    syncTruePixelSockets();
    window.CrystalJourney?.render?.({
      completed,
      current,
      unlocked: unlocked(),
      records,
      reduced: settings.motion,
      start: startFromMap,
      notify
    });
    window.TruePixelEngine?.ActorAnimator?.adaptMapFairyIcon?.();
    updateProgressLabels();
  }

  function goto(name) {
    if (name !== 'home') window.CrystalMenuAudio?.pause?.();
    if (name !== 'map') {
      window.CrystalJourney?.close?.();
      const mapEl = $('map');
      if (mapEl) mapEl.classList.remove('iris-entering');
    }
    if (name !== 'game') {
      window.CaveChapter1?.deactivateCanvas?.();
      window.TruePixelWorlds?.deactivateCanvas?.();
      window.CaveChapter1?.stopMusicAudio?.();
      window.TruePixelWorlds?.stopMusicAudio?.();
    }
    if (screen === 'game' && name !== 'game') persist();

    screen = name;
    document.body.dataset.screen = name;
    for (const id of ['home', 'map', 'game']) {
      const el = $(id);
      if (el) el.hidden = id !== name;
    }

    if (name === 'map') {
      renderMap();
      setTimeout(() => document.querySelector('.journey-node.current')?.focus(), 0);
    } else if (name === 'home') {
      updateProgressLabels();
      const targetBtn = ($('continueButton') && hasSave) ? $('continueButton') : ($('newGameButton') || $('playButton'));
      targetBtn?.focus();
      window.CrystalMenuAudio?.play?.();
    }
  }

  function isLockedLevel() {
    return false;
  }

  function startLevel(id) {
    const levelId = Math.min(21, Math.max(1, Number(id) || 1));
    if (isLockedLevel(levelId)) {
      notify(
        levelId === 21
          ? 'Reúna as quatro gemas primordiais para abrir a fase final.'
          : 'Siga as luzes na ordem para aprender cada movimento.'
      );
      return;
    }

    window.CrystalAudio?.stopAllMusic?.();
    window.CrystalMenuAudio?.pause?.();
    window.CaveChapter1?.stopMusicAudio?.();
    window.TruePixelWorlds?.stopMusicAudio?.();
    window.CrystalJourney?.close?.();
    syncTruePixelSockets();

    current = levelId;
    hasSave = true;
    screen = 'game';
    persist();

    document.body.dataset.screen = 'game';
    for (const s of ['home', 'map', 'game']) {
      const el = $(s);
      if (el) el.hidden = true;
    }

    if (levelId >= 1 && levelId <= 5 && window.CaveChapter1) {
      window.TruePixelWorlds?.deactivateCanvas?.();
      if (levelId === 1) window.CaveChapter1.startCutsceneAndFase1();
      else if (levelId === 2) window.CaveChapter1.startFase2();
      else if (levelId === 3) window.CaveChapter1.startFase3();
      else if (levelId === 4) window.CaveChapter1.startFase4();
      else if (typeof window.CaveChapter1.startFase5 === 'function') window.CaveChapter1.startFase5();
      else window.CaveChapter1.startMusicalShow();
      return;
    }

    if (levelId >= 6 && levelId <= 21 && window.TruePixelWorlds) {
      window.CaveChapter1?.deactivateCanvas?.();
      window.TruePixelWorlds.startByCampaignNode(levelId);
    }
  }

  function startFromMap(id) {
    startLevel(id);
  }

  function startNewGame() {
    if (window.CrystalAssetsReady === false) return;
    unlockAudio();
    requestMobileFullscreenAndLandscape();
    settings.music = 0.5;
    settings.fx = 0.5;
    applySettings();
    completed = [];
    records = {};
    current = 1;
    hasSave = true;
    if (window.TruePixelEngine?.GameHUD) {
      window.TruePixelEngine.GameHUD.diamonds = 0;
    }
    if (window.TruePixelEngine?.DialogueBox?.sockets) {
      window.TruePixelEngine.DialogueBox.sockets.fairy = false;
      window.TruePixelEngine.DialogueBox.sockets.forest = false;
      window.TruePixelEngine.DialogueBox.sockets.river = false;
      window.TruePixelEngine.DialogueBox.sockets.caatinga = false;
    }
    syncTruePixelSockets();
    persist();
    updateProgressLabels();
    renderMap();
    notify('Novo jogo iniciado! Sua jornada começa na Caverna.');
    startLevel(1);
  }

  function continueGame() {
    if (window.CrystalAssetsReady === false) return;
    unlockAudio();
    try {
      const savedRaw = JSON.parse(localStorage.getItem(KEY));
      if (savedRaw) {
        const loadedCompleted = cleanProgress(savedRaw.completed);
        const loadedRecords = savedRaw.records && typeof savedRaw.records === 'object' ? savedRaw.records : {};
        const isUnverifiedDefaultDump = loadedCompleted.length === 20 && Object.keys(loadedRecords).length === 0 && !savedRaw.hasSave;
        if (!isUnverifiedDefaultDump && (savedRaw.hasSave || loadedCompleted.length > 0 || Number(savedRaw.current) > 1 || Object.keys(loadedRecords).length > 0)) {
          completed = loadedCompleted;
          records = loadedRecords;
          current = Math.min(21, Math.max(1, Number(savedRaw.current) || 1));
          hasSave = true;
        }
      }
    } catch {}
    syncTruePixelSockets();
    updateProgressLabels();
    goto('map');
    const done20 = completed.filter(id => id <= 20).length;
    if (done20 > 0 || current > 1) {
      notify(`Continuando sua jornada: ${done20} de 20 fases restauradas.`);
    } else {
      notify('Selecione a Fase 1 no mapa para continuar sua jornada.');
    }
  }

  function openSettings() {
    persist();
    if ($('fileStatus')) $('fileStatus').textContent = '';
    $('settingsDialog')?.showModal();
  }

  function syncProgress(ids = [], nextCurrent = null) {
    for (const raw of ids) {
      const n = Number(raw);
      if (Number.isInteger(n) && n >= 1 && n <= 21) {
        if (!completed.includes(n)) completed.push(n);
        if (!records[n]) records[n] = { stars: 3, points: 300 };
      }
    }
    if (Number.isInteger(nextCurrent) && nextCurrent >= 1 && nextCurrent <= 21) {
      current = nextCurrent;
    }
    hasSave = true;
    syncTruePixelSockets();
    persist();
    updateProgressLabels();
    if (screen === 'map') renderMap();
  }

  function unlockAudio() {
    try {
      window.CrystalAudio?.unlock?.();
    } catch {
      notify('O áudio não está disponível. Você pode continuar jogando sem som.');
    }
  }

  // Bind UI dialogs & settings controls
  $('settingsDialog')?.addEventListener('close', () => persist());

  for (const tab of ['sound', 'access']) {
    const tabBtn = $(tab + 'Tab');
    if (!tabBtn) continue;
    tabBtn.onclick = () => {
      for (const t of ['sound', 'access']) {
        $(t + 'Tab')?.setAttribute('aria-selected', String(t === tab));
        if ($(t + 'Tab')) $(t + 'Tab').tabIndex = t === tab ? 0 : -1;
        if ($(t + 'Panel')) $(t + 'Panel').hidden = t !== tab;
      }
    };
    tabBtn.onkeydown = e => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const other = tab === 'sound' ? 'access' : 'sound';
        $(other + 'Tab')?.click();
        $(other + 'Tab')?.focus();
      }
    };
  }

  document.querySelectorAll('[data-settings]').forEach(b => {
    b.onclick = openSettings;
  });
  document.querySelectorAll('[data-home]').forEach(b => {
    b.onclick = () => goto('home');
  });

  for (const [id, k] of [
    ['voiceToggle', 'voice'],
    ['contrastToggle', 'contrast'],
    ['motionToggle', 'motion'],
    ['assistToggle', 'assist']
  ]) {
    const el = $(id);
    if (!el) continue;
    el.onchange = e => {
      settings[k] = e.target.checked;
      applySettings();
      persist();
      if (k === 'voice' && settings.voice) speak('Narrador ativado.');
    };
  }

  for (const k of ['music', 'fx']) {
    const el = $(k + 'Volume');
    if (!el) continue;
    el.oninput = e => {
      settings[k] = Number(e.target.value) / 100;
      applySettings();
      persist();
    };
  }

  if ($('testSound')) $('testSound').onclick = () => window.CrystalAudio?.shatter?.();
  if ($('creditsButton')) $('creditsButton').onclick = () => $('creditsDialog')?.showModal();
  if ($('exitButton')) {
    $('exitButton').onclick = () => {
      const ok = persist();
      const p = $('exitDialog')?.querySelector('p');
      if (p) {
        p.textContent = ok
          ? 'Seu progresso foi guardado neste navegador. Você pode fechar esta aba com segurança.'
          : 'O navegador não permitiu salvar o progresso. Ele será perdido ao fechar esta aba.';
      }
      $('exitDialog')?.showModal();
    };
  }
  if ($('newGameButton')) {
    $('newGameButton').onclick = startNewGame;
  }
  if ($('continueButton')) {
    $('continueButton').onclick = continueGame;
  }
  if ($('playButton')) {
    $('playButton').onclick = continueGame;
  }

  function isMobileDevice() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua);
    const hasCoarsePointer = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    return Boolean(isMobileUA || (hasTouch && (hasCoarsePointer || window.innerWidth <= 1024)));
  }

  function requestMobileFullscreenAndLandscape() {
    if (!isMobileDevice()) return;
    try {
      const docEl = document.documentElement;
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const req = docEl.requestFullscreen || docEl.webkitRequestFullscreen;
        if (typeof req === 'function') {
          const p = req.call(docEl);
          if (p && typeof p.catch === 'function') p.catch(() => {});
        }
      }
    } catch {}
    try {
      if (screen.orientation && typeof screen.orientation.lock === 'function') {
        screen.orientation.lock('landscape').catch(() => {});
      }
    } catch {}
  }

  function syncMobileOrientationUI() {
    const mobile = isMobileDevice();
    document.body.classList.toggle('is-touch-device', mobile);
    const overlay = $('orientationOverlay');
    if (!overlay) return;
    const isPortrait = window.innerHeight > window.innerWidth * 1.05;
    overlay.hidden = !(mobile && isPortrait);
  }

  if ($('enterLandscapeFullscreenBtn')) {
    $('enterLandscapeFullscreenBtn').onclick = () => {
      requestMobileFullscreenAndLandscape();
      syncMobileOrientationUI();
    };
  }

  window.addEventListener('resize', syncMobileOrientationUI);
  window.addEventListener('orientationchange', syncMobileOrientationUI);
  syncMobileOrientationUI();

  document.addEventListener('pointerdown', () => {
    if (!$('settingsDialog')?.open) unlockAudio();
    if (isMobileDevice()) {
      requestMobileFullscreenAndLandscape();
      syncMobileOrientationUI();
    }
  }, { once: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) persist();
  });
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('pagehide', persist);
    // Previne menu de contexto e seleção nativa ao segurar o toque no mobile
    window.addEventListener('contextmenu', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      e.preventDefault();
    }, { passive: false });
  }

  syncTruePixelSockets();
  applySettings();
  renderMap();
  updateProgressLabels();
  window.CrystalMenuAudio?.setVolume?.(settings.music);
  window.CrystalMenuAudio?.autoStart?.();

  window.CrystalApp = {
    goto,
    startLevel,
    startFromMap,
    startNewGame,
    continueGame,
    syncProgress,
    notify,
    openSettings,
    unlockAll() {
      completed = Array.from({ length: 20 }, (_, i) => i + 1);
      for (const id of completed) {
        if (!records[id]) records[id] = { stars: 3, points: 300 };
      }
      hasSave = true;
      syncTruePixelSockets();
      persist();
      renderMap();
    },
    get state() {
      return {
        completed: [...completed],
        records: { ...records },
        current,
        hasSave,
        screen,
        settings: { ...settings }
      };
    }
  };
})();
