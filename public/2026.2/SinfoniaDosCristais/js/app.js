(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const KEY = 'crystal-campaign-v4';
  const defaults = { music: 0.5, fx: 0.5, voice: false, contrast: false, motion: false, assist: false, frameScale: 1 };
  let settings = { ...defaults };
  let completed = [];
  let records = {};
  let current = 1;
  let hasSave = false;
  let unlockedTutorials = [];
  let lastViewedTutorialKey = null;
  let guideIntroShown = false;
  let setupCompleted = false;
  let playerName = '';
  let playerGender = 'male';
  let characterCreated = false;
  let screen = 'home';
  let toastTimer = null;

  const DEFAULT_CHARACTER_NAMES = {
    male: 'Alex',
    female: 'Marina'
  };
  function getDefaultCharacterName(gender) {
    return gender === 'female' ? DEFAULT_CHARACTER_NAMES.female : DEFAULT_CHARACTER_NAMES.male;
  }
  function isDefaultCharacterName(name) {
    const clean = String(name ?? '').trim().toLowerCase();
    return !clean
      || clean === 'protagonista'
      || clean === DEFAULT_CHARACTER_NAMES.male.toLowerCase()
      || clean === DEFAULT_CHARACTER_NAMES.female.toLowerCase();
  }

  function cleanTutorialKeys(list) {
    return Array.isArray(list)
      ? [...new Set(list.filter(k => typeof k === 'string' && k.trim().length > 0).map(k => k.trim()))]
      : [];
  }

  let save = null;
  try {
    save = JSON.parse(localStorage.getItem(KEY));
  } catch {}
  if (save) {
    settings = { ...defaults, ...cleanSettings(save.settings) };
    setupCompleted = Boolean(save.setupCompleted);
    playerName = typeof save.playerName === 'string' ? save.playerName.trim() : '';
    playerGender = save.playerGender === 'female' ? 'female' : 'male';
    characterCreated = Boolean(save.characterCreated);
    const loadedCompleted = cleanProgress(save.completed);
    const loadedRecords = save.records && typeof save.records === 'object' ? save.records : {};
    const isUnverifiedDefaultDump = loadedCompleted.length === 20 && Object.keys(loadedRecords).length === 0 && !save.hasSave;
    if (!isUnverifiedDefaultDump) {
      completed = loadedCompleted;
      records = loadedRecords;
      current = Math.min(21, Math.max(1, Number(save.current) || 1));
      hasSave = Boolean(save.hasSave || completed.length > 0 || current > 1 || Object.keys(records).length > 0);
      unlockedTutorials = cleanTutorialKeys(save.unlockedTutorials);
      lastViewedTutorialKey = (typeof save.lastViewedTutorialKey === 'string' && save.lastViewedTutorialKey.trim())
        ? save.lastViewedTutorialKey.trim()
        : null;
      guideIntroShown = Boolean(save.guideIntroShown || completed.includes(1));
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
    if (Number.isFinite(s?.frameScale)) {
      let fs = Number(s.frameScale);
      if (fs > 2) fs = fs / 100;
      out.frameScale = Math.round(Math.max(0.8, Math.min(1.2, fs)) * 100) / 100;
    }
    return out;
  }

  function cleanProgress(list) {
    return Array.isArray(list)
      ? [...new Set(list.filter(n => Number.isInteger(n) && n >= 1 && n <= 21))]
      : [];
  }

  function isGodModeActive() {
    return Boolean(window.TruePixelEngine?.GameHUD?.godMode);
  }

  function unlocked() {
    let n = 1;
    while (completed.includes(n) && n < 20) n++;
    if (n === 20 && completed.includes(20)) return 21;
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
      localStorage.setItem(KEY, JSON.stringify({
        version: 4,
        settings,
        completed,
        current,
        records,
        hasSave,
        unlockedTutorials,
        lastViewedTutorialKey,
        guideIntroShown,
        setupCompleted,
        playerName,
        playerGender,
        characterCreated
      }));
      return true;
    } catch {
      return false;
    }
  }

  function syncTutorialsToEngine() {
    const hud = window.TruePixelEngine?.GameHUD;
    if (hud && typeof hud.getTutorialKeysForCompleted === 'function') {
      const fromCompleted = hud.getTutorialKeysForCompleted(completed);
      if (fromCompleted.length) {
        unlockedTutorials = cleanTutorialKeys([...unlockedTutorials, ...fromCompleted]);
      }
    }
    hud?.syncTutorialProgress?.({
      unlockedTutorials,
      lastViewedTutorialKey,
      guideIntroShown,
      completed,
      current
    });
  }

  function recordTutorialViewed(key, fromEngine = false) {
    if (typeof key !== 'string' || !key.trim()) return null;
    const cleanKey = key.trim();
    const hud = window.TruePixelEngine?.GameHUD;
    const nextList = [...unlockedTutorials, cleanKey];
    if (hud && typeof hud.getGuideCatalog === 'function') {
      const cat = hud.getGuideCatalog();
      for (const wKey of ['caverna', 'floresta', 'rio', 'caatinga']) {
        for (const item of (cat[wKey]?.items || [])) {
          if (Array.isArray(item.linkedKeys) && item.linkedKeys.includes(cleanKey)) {
            nextList.push(item.key);
          }
        }
      }
    }
    unlockedTutorials = cleanTutorialKeys(nextList);
    lastViewedTutorialKey = cleanKey;
    hasSave = true;
    if (!fromEngine) {
      syncTutorialsToEngine();
    }
    persist();
    return cleanKey;
  }

  function markGuideIntroShown(fromEngine = false) {
    guideIntroShown = true;
    if (!fromEngine) {
      syncTutorialsToEngine();
    }
    persist();
    return true;
  }

  function updateProgressLabels() {
    const done20 = completed.filter(id => id <= 20).length;
    if ($('mapProgress')) {
      $('mapProgress').textContent = done20 + ' / 20 fases restauradas';
    }
    if ($('homeSave')) {
      const prefix = playerName ? `${playerName}, ` : '';
      $('homeSave').textContent = done20
        ? `${prefix}${done20} de 20 fases restauradas. Seu caminho está salvo.`
        : `${prefix}sua jornada começa com um pequeno brilho.`;
    }
  }

  function syncTruePixelSockets() {
    window.TruePixelEngine?.DialogueBox?.syncSocketsFromCompleted?.(completed);
  }

  function formatFrameScaleLabel(scale) {
    const pct = Math.round((Number(scale) || 1) * 100);
    if (pct === 100) return 'Normal (100%)';
    if (pct < 100) return 'Retraído (' + pct + '%)';
    return 'Afastado (' + pct + '%)';
  }

  function applySettings() {
    document.body.classList.toggle('high-contrast', settings.contrast);
    document.body.classList.toggle('reduce-motion', settings.motion);

    window.TruePixelEngine?.setPlayerProfile?.({
      name: playerName || getDefaultCharacterName(playerGender),
      gender: playerGender
    });

    const fs = Math.round(Math.max(0.8, Math.min(1.2, Number(settings.frameScale) || 1)) * 100) / 100;
    settings.frameScale = fs;
    window.CrystalFrameScale = fs;
    document.documentElement?.style?.setProperty?.('--game-frame-scale', String(fs));
    window.CaveChapter1?.fitCanvas?.(window.CaveChapter1?.canvas);
    window.TruePixelWorlds?.fitCanvas?.(window.TruePixelWorlds?.canvas);

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
      ['assistToggle', 'assist'],
      ['wizVoiceToggle', 'voice'],
      ['wizContrastToggle', 'contrast'],
      ['wizMotionToggle', 'motion'],
      ['wizAssistToggle', 'assist']
    ]) {
      const el = $(id);
      if (el) el.checked = settings[k];
    }
    for (const k of ['music', 'fx']) {
      const pct = Math.round(settings[k] * 100);
      const slider = $(k + 'Volume');
      const out = $(k + 'Value');
      if (slider) slider.value = String(pct);
      if (out) out.textContent = pct + '%';

      const wSlider = $(k === 'music' ? 'wizMusicVolume' : 'wizFxVolume');
      const wOut = $(k === 'music' ? 'wizMusicValue' : 'wizFxValue');
      if (wSlider) wSlider.value = String(pct);
      if (wOut) wOut.textContent = pct + '%';
    }

    const scalePct = String(Math.round(fs * 100));
    const scaleLabel = formatFrameScaleLabel(fs);
    for (const sId of ['wizFrameScale', 'frameScaleSlider']) {
      const sEl = $(sId);
      if (sEl) sEl.value = scalePct;
    }
    for (const oId of ['wizFrameScaleValue', 'frameScaleValue']) {
      const oEl = $(oId);
      if (oEl) oEl.textContent = scaleLabel;
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
      godMode: isGodModeActive(),
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
      if (document.activeElement && $('home')?.contains(document.activeElement)) {
        document.activeElement.blur?.();
      }
      window.CrystalMenuAudio?.play?.();
    }
  }

  function isLockedLevel(levelId) {
    if (isGodModeActive()) return false;
    if (completed.includes(levelId)) return false;
    if (levelId === 21) {
      return ![5, 10, 15, 20].every(id => completed.includes(id));
    }
    return levelId > unlocked();
  }

  function startLevel(id) {
    const levelId = Math.min(21, Math.max(1, Number(id) || 1));
    CrystalOnboarding?.skipAll?.();
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
    window.TruePixelEngine?.GameHUD?.resetAbilityCharges?.();

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

  function startNewGame(opts = {}) {
    if (window.CrystalAssetsReady === false && !opts?.force) return;
    unlockAudio();
    requestMobileFullscreenAndLandscape();
    settings.music = 0.5;
    settings.fx = 0.5;
    applySettings();
    completed = [];
    records = {};
    current = 1;
    hasSave = true;
    unlockedTutorials = [];
    lastViewedTutorialKey = null;
    guideIntroShown = false;
    window.TruePixelEngine?.TutorialModal?.seenKeys?.clear?.();
    if (window.TruePixelEngine?.GameHUD) {
      window.TruePixelEngine.GameHUD.diamonds = 0;
      window.TruePixelEngine.GameHUD.guideIntroActive = false;
      window.TruePixelEngine.GameHUD.guideIntroOnDone = null;
    }
    if (window.TruePixelEngine?.DialogueBox?.sockets) {
      window.TruePixelEngine.DialogueBox.sockets.fairy = false;
      window.TruePixelEngine.DialogueBox.sockets.forest = false;
      window.TruePixelEngine.DialogueBox.sockets.river = false;
      window.TruePixelEngine.DialogueBox.sockets.caatinga = false;
    }
    syncTruePixelSockets();
    syncTutorialsToEngine();
    persist();
    updateProgressLabels();
    renderMap();
    notify('Novo jogo iniciado! Sua jornada começa na Caverna.');
    startLevel(1);
  }

  function requestNewGame() {
    if (window.CrystalAssetsReady === false) return;
    unlockAudio();
    requestMobileFullscreenAndLandscape();
    CrystalOnboarding.openCharacterCreation('new_game');
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
          unlockedTutorials = cleanTutorialKeys(savedRaw.unlockedTutorials);
          lastViewedTutorialKey = (typeof savedRaw.lastViewedTutorialKey === 'string' && savedRaw.lastViewedTutorialKey.trim())
            ? savedRaw.lastViewedTutorialKey.trim()
            : null;
          guideIntroShown = Boolean(savedRaw.guideIntroShown || completed.includes(1));
        }
      }
    } catch {}
    syncTruePixelSockets();
    syncTutorialsToEngine();
    updateProgressLabels();
    goto('map');
    const done20 = completed.filter(id => id <= 20).length;
    if (done20 > 0 || current > 1) {
      notify(`Continuando sua jornada: ${done20} de 20 fases restauradas.`);
    } else {
      notify('Selecione a Fase 1 no mapa para continuar sua jornada.');
    }
  }

  function syncFullscreenUI() {
    const isFull = Boolean(window.TruePixelEngine?.GameHUD?.isFullscreen?.());
    const btn = $('fullscreenButton');
    if (btn) btn.textContent = isFull ? '🗗 Sair da Tela Cheia' : '⛶ Alternar Tela Cheia';
    const wizBtn = $('wizFullscreenBtn');
    if (wizBtn) wizBtn.textContent = isFull ? '🗗 Sair da Tela Cheia' : '⛶ Ativar Tela Cheia';
    const toggle = $('fullscreenToggle');
    if (toggle) toggle.checked = isFull;
  }

  function syncGodModeUI() {
    const active = isGodModeActive();
    const gmToggle = $('godModeToggle');
    if (gmToggle) gmToggle.checked = active;
    const gmBtn = $('levelListGodModeBtn');
    if (gmBtn) {
      gmBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
      gmBtn.textContent = active ? '⚡ God Mode: ATIVO (Desativar)' : '⚡ Ativar God Mode';
    }
    if ($('levelListDialog')?.open) {
      renderLevelList();
    }
  }

  function renderLevelList() {
    const container = $('levelListContainer');
    if (!container) return;
    container.replaceChildren();
    const gm = isGodModeActive();
    const unl = unlocked();
    const levels = window.CrystalCampaign?.levels || [];
    const groups = [
      { title: 'Caverna dos Cristais', world: 0, filter: l => l.world === 0 && l.id <= 5 },
      { title: 'Floresta Amazônica', world: 1, filter: l => l.world === 1 },
      { title: 'Rio das Águas Claras', world: 2, filter: l => l.world === 2 },
      { title: 'Caatinga Dourada', world: 3, filter: l => l.world === 3 },
      { title: 'Santuário Final', world: 0, filter: l => l.id === 21 }
    ];
    for (const g of groups) {
      const items = levels.filter(g.filter);
      if (!items.length) continue;
      const section = document.createElement('section');
      section.className = 'level-list-world-group';
      const heading = document.createElement('h3');
      heading.className = 'level-list-world-title';
      heading.textContent = g.title;
      const grid = document.createElement('div');
      grid.className = 'level-list-grid';
      for (const level of items) {
        const isDone = completed.includes(level.id);
        const locked = !gm && !isDone && (
          level.id === 21
            ? ![5, 10, 15, 20].every(id => completed.includes(id))
            : level.id > unl
        );
        const rec = records[level.id];
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'level-list-item';
        if (isDone) card.classList.add('done');
        if (level.id === current) card.classList.add('current');
        if (locked) card.classList.add('locked');
        card.setAttribute('aria-disabled', locked ? 'true' : 'false');

        const top = document.createElement('div');
        top.className = 'level-list-item-top';
        const num = document.createElement('span');
        num.textContent = level.id === 21 ? '★ Final' : `Fase ${level.id}`;
        const badge = document.createElement('span');
        badge.textContent = isDone ? '✓ Concluída' : (locked ? '🔒 Bloqueada' : '▶ Jogar');
        top.append(num, badge);

        const title = document.createElement('div');
        title.className = 'level-list-item-name';
        title.textContent = level.name;

        const stars = document.createElement('div');
        stars.className = 'level-list-item-stars';
        const count = rec?.stars || 0;
        stars.textContent = Array.from({ length: 3 }, (_, i) => i < count ? '★' : '☆').join('');

        card.append(top, title, stars);
        card.onclick = () => {
          if (locked) {
            notify(level.id === 21
              ? 'Reúna as quatro gemas ou ative o God Mode acima para abrir a fase final.'
              : 'Conclua as fases anteriores ou ative o God Mode acima para testar livremente.');
            return;
          }
          $('levelListDialog')?.close?.();
          startFromMap(level.id);
        };
        grid.append(card);
      }
      section.append(heading, grid);
      container.append(section);
    }
  }

  function openLevelList() {
    persist();
    syncGodModeUI();
    renderLevelList();
    $('levelListDialog')?.showModal?.();
  }

  function openSettings() {
    persist();
    if ($('fileStatus')) $('fileStatus').textContent = '';
    syncFullscreenUI();
    syncGodModeUI();
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
    syncTutorialsToEngine();
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

  const allTabs = ['sound', 'display', 'access'];
  for (let i = 0; i < allTabs.length; i++) {
    const tab = allTabs[i];
    const tabBtn = $(tab + 'Tab');
    if (!tabBtn) continue;
    tabBtn.onclick = () => {
      for (const t of allTabs) {
        $(t + 'Tab')?.setAttribute('aria-selected', String(t === tab));
        if ($(t + 'Tab')) $(t + 'Tab').tabIndex = t === tab ? 0 : -1;
        if ($(t + 'Panel')) $(t + 'Panel').hidden = t !== tab;
      }
    };
    tabBtn.onkeydown = e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const nextIdx = e.key === 'ArrowRight' ? (i + 1) % allTabs.length : (i - 1 + allTabs.length) % allTabs.length;
        const nextTab = allTabs[nextIdx];
        $(nextTab + 'Tab')?.click();
        $(nextTab + 'Tab')?.focus();
      }
    };
  }

  if ($('fullscreenButton')) {
    $('fullscreenButton').onclick = async () => {
      await window.TruePixelEngine?.GameHUD?.toggleFullscreen?.();
      syncFullscreenUI();
    };
  }
  if ($('fullscreenToggle')) {
    $('fullscreenToggle').onchange = async () => {
      await window.TruePixelEngine?.GameHUD?.toggleFullscreen?.();
      syncFullscreenUI();
    };
  }
  ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evt => {
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener(evt, syncFullscreenUI);
    }
  });

  if ($('levelMenuBtn')) {
    $('levelMenuBtn').onclick = openLevelList;
  }
  if ($('levelListGodModeBtn')) {
    $('levelListGodModeBtn').onclick = () => {
      window.TruePixelEngine?.GameHUD?.toggleGodMode?.();
      syncGodModeUI();
    };
  }
  if ($('godModeToggle')) {
    $('godModeToggle').onchange = (e) => {
      window.TruePixelEngine?.GameHUD?.setGodMode?.(Boolean(e.target.checked));
      syncGodModeUI();
    };
  }

  // Gesto secreto de 5 toques rápidos para alternar God Mode no mobile
  for (const secretEl of [$('mapTitle'), $('gameTitle')]) {
    if (!secretEl) continue;
    let tapCount = 0;
    let tapResetTimer = null;
    secretEl.addEventListener('pointerdown', () => {
      tapCount++;
      clearTimeout(tapResetTimer);
      tapResetTimer = setTimeout(() => { tapCount = 0; }, 2200);
      if (tapCount >= 5) {
        tapCount = 0;
        window.TruePixelEngine?.GameHUD?.toggleGodMode?.();
        syncGodModeUI();
      }
    });
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
    ['assistToggle', 'assist'],
    ['wizVoiceToggle', 'voice'],
    ['wizContrastToggle', 'contrast'],
    ['wizMotionToggle', 'motion'],
    ['wizAssistToggle', 'assist']
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

  for (const [id, k] of [
    ['musicVolume', 'music'],
    ['fxVolume', 'fx'],
    ['wizMusicVolume', 'music'],
    ['wizFxVolume', 'fx']
  ]) {
    const el = $(id);
    if (!el) continue;
    el.oninput = e => {
      settings[k] = Number(e.target.value) / 100;
      applySettings();
      persist();
    };
  }

  for (const id of ['wizFrameScale', 'frameScaleSlider']) {
    const el = $(id);
    if (!el) continue;
    el.oninput = e => {
      const pct = Number(e.target.value);
      if (Number.isFinite(pct)) {
        settings.frameScale = Math.round(Math.max(0.8, Math.min(1.2, pct / 100)) * 100) / 100;
        applySettings();
        persist();
      }
    };
  }

  if ($('wizFullscreenBtn')) {
    $('wizFullscreenBtn').onclick = async () => {
      await window.TruePixelEngine?.GameHUD?.toggleFullscreen?.();
      syncFullscreenUI();
    };
  }
  if ($('wizTestMusicBtn')) {
    $('wizTestMusicBtn').onclick = () => {
      unlockAudio();
      window.CrystalAudio?.setVolume?.(settings.music);
      if (typeof window.CrystalAudio?.chime === 'function') window.CrystalAudio.chime(2);
      else window.CrystalAudio?.shatter?.();
      window.CrystalMenuAudio?.setVolume?.(settings.music);
      window.CrystalMenuAudio?.play?.();
    };
  }
  if ($('wizTestSfxBtn')) {
    $('wizTestSfxBtn').onclick = () => {
      unlockAudio();
      window.CrystalAudio?.setVolume?.(settings.fx);
      window.CrystalAudio?.shatter?.();
    };
  }

  if ($('testSound')) $('testSound').onclick = () => window.CrystalAudio?.shatter?.();
  if ($('creditsButton')) $('creditsButton').onclick = () => $('creditsDialog')?.showModal();
  if ($('newGameButton')) {
    $('newGameButton').onclick = requestNewGame;
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

  const CrystalOnboarding = {
    splashActive: true,
    brinqueSplashActive: true,
    splashStep: 'brinque',
    splashPhase: 'fade-in',
    wizardActive: false,
    wizardStep: 'access',
    characterScreenActive: false,
    characterSource: 'wizard',
    usingDefaultName: true,
    selectedGender: playerGender,
    loadingTransitionActive: false,
    onCharacterCreation: null,
    _previewRaf: 0,
    _timers: [],

    clearTimers() {
      while (this._timers.length) {
        clearTimeout(this._timers.pop());
      }
    },

    stopPreviewLoop() {
      if (this._previewRaf && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(this._previewRaf);
      }
      this._previewRaf = 0;
    },

    renderCharacterPreviews(now = 0) {
      const E = window.TruePixelEngine;
      if (!E?.SpriteBank) return;
      const frameIdx = Math.floor((now / 1000) * 6) % 4;
      for (const [id, actorKey] of [
        ['previewBoyCanvas', 'protagonist_male'],
        ['previewGirlCanvas', 'protagonist_female']
      ]) {
        const cv = $(id);
        const actor = E.SpriteBank[actorKey];
        const spr = actor?.idle?.[frameIdx] || actor?.idle?.[0];
        if (cv && typeof cv.getContext === 'function' && spr) {
          const ctx = cv.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = false;
            ctx.clearRect?.(0, 0, cv.width || 64, cv.height || 64);
            ctx.drawImage?.(spr, 0, 0, cv.width || 64, cv.height || 64);
          }
        }
      }
    },

    startPreviewLoop() {
      this.stopPreviewLoop();
      const tick = (now) => {
        if (!this.characterScreenActive) {
          this._previewRaf = 0;
          return;
        }
        this.renderCharacterPreviews(now);
        if (typeof requestAnimationFrame === 'function') {
          this._previewRaf = requestAnimationFrame(tick);
        }
      };
      this.renderCharacterPreviews(0);
      if (typeof requestAnimationFrame === 'function') {
        this._previewRaf = requestAnimationFrame(tick);
      }
    },

    startSplash() {
      this.startBrinqueSplash();
    },

    startBrinqueSplash() {
      this.clearTimers();
      this.splashActive = true;
      this.brinqueSplashActive = true;
      this.splashStep = 'brinque';
      this.splashPhase = 'fade-in';
      window.CrystalMenuAudio?.pause?.();
      const unebEl = $('unebSplashScreen');
      if (unebEl) {
        unebEl.hidden = true;
        unebEl.classList?.remove?.('phase-fade-in', 'phase-hold', 'phase-fade-out');
      }
      const el = $('brinqueSplashScreen');
      if (el) {
        el.hidden = false;
        el.classList?.remove?.('phase-hold', 'phase-fade-out');
        el.classList?.add?.('phase-fade-in');
      }
      window.CrystalAudio?.brinqueIntro?.();
      this._timers.push(setTimeout(() => {
        if (!this.brinqueSplashActive) return;
        this.splashPhase = 'hold';
        const s = $('brinqueSplashScreen');
        if (s) {
          s.classList?.remove?.('phase-fade-in');
          s.classList?.add?.('phase-hold');
        }
      }, 1050));
      this._timers.push(setTimeout(() => {
        if (!this.brinqueSplashActive) return;
        this.splashPhase = 'fade-out';
        const s = $('brinqueSplashScreen');
        if (s) {
          s.classList?.remove?.('phase-hold', 'phase-fade-in');
          s.classList?.add?.('phase-fade-out');
        }
      }, 2350));
      this._timers.push(setTimeout(() => {
        if (this.brinqueSplashActive) this.finishBrinqueSplash(false);
      }, 2880));
    },

    finishBrinqueSplash(fromUserGesture = false) {
      if (!this.brinqueSplashActive) return;
      this.clearTimers();
      if (fromUserGesture && !window.CrystalAudio?._lastBrinqueIntro?.played) {
        unlockAudio();
        window.CrystalAudio?.brinqueChime?.();
      }
      this.brinqueSplashActive = false;
      this.startUnebSplash();
      const el = $('brinqueSplashScreen');
      if (el) {
        el.hidden = true;
        el.classList?.remove?.('phase-fade-in', 'phase-hold', 'phase-fade-out');
      }
      window.CrystalMenuAudio?.autoStart?.();
    },

    startUnebSplash() {
      this.clearTimers();
      this.splashActive = true;
      this.brinqueSplashActive = false;
      this.splashStep = 'uneb';
      this.splashPhase = 'fade-in';
      const el = $('unebSplashScreen');
      if (el) {
        el.hidden = false;
        el.classList?.remove?.('phase-hold', 'phase-fade-out');
        el.classList?.add?.('phase-fade-in');
      }
      this._timers.push(setTimeout(() => {
        if (!this.splashActive || this.brinqueSplashActive) return;
        this.splashPhase = 'hold';
        const s = $('unebSplashScreen');
        if (s) {
          s.classList?.remove?.('phase-fade-in');
          s.classList?.add?.('phase-hold');
        }
      }, 900));
      this._timers.push(setTimeout(() => {
        if (!this.splashActive || this.brinqueSplashActive) return;
        this.splashPhase = 'fade-out';
        const s = $('unebSplashScreen');
        if (s) {
          s.classList?.remove?.('phase-hold', 'phase-fade-in');
          s.classList?.add?.('phase-fade-out');
        }
      }, 2400));
      this._timers.push(setTimeout(() => {
        if (this.splashActive && !this.brinqueSplashActive) this.finishSplash();
      }, 3150));
    },

    finishSplash() {
      this.clearTimers();
      this.brinqueSplashActive = false;
      this.splashActive = false;
      this.splashStep = 'done';
      this.splashPhase = 'done';
      const brinqueEl = $('brinqueSplashScreen');
      if (brinqueEl) {
        brinqueEl.hidden = true;
        brinqueEl.classList?.remove?.('phase-fade-in', 'phase-hold', 'phase-fade-out');
      }
      const el = $('unebSplashScreen');
      if (el) {
        el.hidden = true;
        el.classList?.remove?.('phase-fade-in', 'phase-hold', 'phase-fade-out');
      }
      window.CrystalMenuAudio?.autoStart?.();
      if (!setupCompleted) {
        this.openWizard('access');
      } else if (!characterCreated) {
        this.openCharacterCreation('wizard');
      }
    },

    openWizard(step = 'access') {
      this.wizardActive = true;
      const wiz = $('setupWizardScreen');
      if (wiz) wiz.hidden = false;
      applySettings();
      syncFullscreenUI();
      this.goToStep(step);
    },

    goToStep(step) {
      this.wizardStep = step;
      const ind = $('wizardStepIndicator');
      const title = $('wizardTitle');
      if (step === 'access') {
        if (ind) ind.textContent = 'ETAPA 1 DE 2 • CONFIGURAÇÃO INICIAL';
        if (title) title.textContent = 'Acessibilidade';
      } else {
        if (ind) ind.textContent = 'ETAPA 2 DE 2 • ÁUDIO E TELA';
        if (title) title.textContent = 'Configuração de Áudio e Vídeo';
      }
      if ($('wizardStepAccess')) $('wizardStepAccess').hidden = step !== 'access';
      if ($('wizardStepAudio')) $('wizardStepAudio').hidden = step !== 'audio';
    },

    advanceWizard() {
      if (this.wizardStep === 'access') {
        this.goToStep('audio');
      } else {
        this.completeWizard();
      }
    },

    backWizard() {
      if (this.wizardStep === 'audio') {
        this.goToStep('access');
      }
    },

    completeWizard() {
      setupCompleted = true;
      applySettings();
      persist();
      this.wizardActive = false;
      this.wizardStep = 'character';
      const wiz = $('setupWizardScreen');
      if (wiz) wiz.hidden = true;
      if (typeof this.onCharacterCreation === 'function') {
        this.onCharacterCreation();
      } else {
        this.openCharacterCreation('wizard');
      }
    },

    syncNameInputVisual() {
      const nameInput = $('playerNameInput');
      if (nameInput?.classList?.toggle) {
        nameInput.classList.toggle('is-default-name', Boolean(this.usingDefaultName));
      }
    },

    openCharacterCreation(source = 'wizard') {
      this.characterScreenActive = true;
      this.characterSource = source === 'new_game' ? 'new_game' : 'wizard';
      this.wizardStep = 'character';
      const screenEl = $('characterCreationScreen');
      if (screenEl) screenEl.hidden = false;
      const initialGender = (this.selectedGender === 'female' || (this.selectedGender !== 'male' && playerGender === 'female'))
        ? 'female'
        : 'male';
      const keepExistingCustom = this.characterSource === 'wizard'
        && !this.usingDefaultName
        && playerName
        && !isDefaultCharacterName(playerName);
      const nameInput = $('playerNameInput');
      if (keepExistingCustom) {
        this.usingDefaultName = false;
        if (nameInput) nameInput.value = playerName;
      } else {
        this.usingDefaultName = true;
        if (nameInput) nameInput.value = getDefaultCharacterName(initialGender);
      }
      if ($('playerNameError')) $('playerNameError').hidden = true;
      this.syncNameInputVisual();
      this.selectGender(initialGender);
      this.startPreviewLoop();
    },

    selectGender(gender) {
      this.selectedGender = gender === 'female' ? 'female' : 'male';
      const boyBtn = $('genderBoyBtn');
      const girlBtn = $('genderGirlBtn');
      if (boyBtn) {
        boyBtn.classList?.toggle?.('selected', this.selectedGender === 'male');
        boyBtn.setAttribute?.('aria-pressed', String(this.selectedGender === 'male'));
      }
      if (girlBtn) {
        girlBtn.classList?.toggle?.('selected', this.selectedGender === 'female');
        girlBtn.setAttribute?.('aria-pressed', String(this.selectedGender === 'female'));
      }
      const defaultName = getDefaultCharacterName(this.selectedGender);
      const nameInput = $('playerNameInput');
      if (nameInput && (this.usingDefaultName || isDefaultCharacterName(String(nameInput.value ?? '').trim()))) {
        nameInput.value = defaultName;
        this.usingDefaultName = true;
        if ($('playerNameError')) $('playerNameError').hidden = true;
      }
      this.syncNameInputVisual();
      const typedName = String(nameInput?.value ?? '').trim();
      window.TruePixelEngine?.setPlayerProfile?.({
        name: typedName || defaultName,
        gender: this.selectedGender
      });
    },

    handleNameInputFocus() {
      const nameInput = $('playerNameInput');
      if (!nameInput) return;
      if (this.usingDefaultName) {
        nameInput.value = '';
      }
      this.syncNameInputVisual();
    },

    handleNameInputBlur() {
      const nameInput = $('playerNameInput');
      if (!nameInput) return;
      if (this.usingDefaultName && !String(nameInput.value ?? '').trim()) {
        nameInput.value = getDefaultCharacterName(this.selectedGender);
      }
      this.syncNameInputVisual();
    },

    backFromCharacter() {
      this.stopPreviewLoop();
      this.characterScreenActive = false;
      if ($('characterCreationScreen')) $('characterCreationScreen').hidden = true;
      if (this.characterSource === 'new_game') {
        this.wizardStep = 'done';
        applySettings();
        goto('home');
      } else {
        this.openWizard('audio');
      }
    },

    confirmCharacter() {
      const nameInput = $('playerNameInput');
      const rawName = String(nameInput ? (nameInput.value ?? '') : (playerName || getDefaultCharacterName(this.selectedGender))).trim();
      if (!rawName) {
        if ($('playerNameError')) $('playerNameError').hidden = false;
        nameInput?.focus?.();
        return false;
      }
      if ($('playerNameError')) $('playerNameError').hidden = true;
      playerName = rawName;
      playerGender = this.selectedGender === 'female' ? 'female' : 'male';
      characterCreated = true;
      setupCompleted = true;
      applySettings();
      updateProgressLabels();
      persist();
      this.stopPreviewLoop();
      this.characterScreenActive = false;
      if ($('characterCreationScreen')) $('characterCreationScreen').hidden = true;
      this.startLoadingIntoGame();
      return true;
    },

    startLoadingIntoGame() {
      this.clearTimers();
      this.wizardStep = 'loading';
      this.loadingTransitionActive = true;
      if (!$('preloaderScreen') && typeof window.AssetPreloader?.ensureDOM === 'function') {
        window.AssetPreloader.ensureDOM();
      }
      const pre = $('preloaderScreen');
      if (pre) {
        pre.hidden = false;
        if (pre.style) {
          pre.style.transition = 'opacity 0.25s ease';
          pre.style.opacity = '1';
        }
      }
      if (window.AssetPreloader) {
        window.AssetPreloader.active = true;
        window.AssetPreloader.fadingOut = false;
        window.AssetPreloader.ready = false;
        window.AssetPreloader.loadedCount = window.AssetPreloader.totalCount || 17;
        window.AssetPreloader.smoothRatio = 1;
        window.AssetPreloader.currentLabel = `Preparando a aventura de ${playerName}...`;
        window.AssetPreloader.startLoop?.();
      }
      this._timers.push(setTimeout(() => {
        if (this.loadingTransitionActive) this.completeLoadingTransition();
      }, 600));
    },

    completeLoadingTransition() {
      this.clearTimers();
      this.loadingTransitionActive = false;
      this.wizardStep = 'done';
      if (window.AssetPreloader) {
        window.AssetPreloader.active = false;
        window.AssetPreloader.fadingOut = true;
      }
      const pre = $('preloaderScreen');
      if (pre) {
        pre.hidden = true;
        pre.remove?.();
      }
      startNewGame({ force: true });
    },

    skipAll() {
      this.clearTimers();
      this.stopPreviewLoop();
      this.brinqueSplashActive = false;
      this.splashActive = false;
      this.splashStep = 'done';
      this.splashPhase = 'done';
      this.wizardActive = false;
      this.characterScreenActive = false;
      this.loadingTransitionActive = false;
      if ($('brinqueSplashScreen')) $('brinqueSplashScreen').hidden = true;
      if ($('unebSplashScreen')) $('unebSplashScreen').hidden = true;
      if ($('setupWizardScreen')) $('setupWizardScreen').hidden = true;
      if ($('characterCreationScreen')) $('characterCreationScreen').hidden = true;
    }
  };
  window.CrystalOnboarding = CrystalOnboarding;

  if ($('brinqueSplashScreen')) $('brinqueSplashScreen').onclick = () => CrystalOnboarding.finishBrinqueSplash(true);
  if ($('unebSplashScreen')) $('unebSplashScreen').onclick = () => CrystalOnboarding.finishSplash();
  document.addEventListener('keydown', (e) => {
    if (!CrystalOnboarding.splashActive) return;
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Escape') return;
    e.preventDefault?.();
    if (CrystalOnboarding.brinqueSplashActive) {
      CrystalOnboarding.finishBrinqueSplash(true);
    } else {
      CrystalOnboarding.finishSplash();
    }
  });
  if ($('wizardNextToAudioBtn')) $('wizardNextToAudioBtn').onclick = () => CrystalOnboarding.advanceWizard();
  if ($('wizardBackToAccessBtn')) $('wizardBackToAccessBtn').onclick = () => CrystalOnboarding.backWizard();
  if ($('wizardFinishBtn')) $('wizardFinishBtn').onclick = () => CrystalOnboarding.completeWizard();
  if ($('genderBoyBtn')) $('genderBoyBtn').onclick = () => CrystalOnboarding.selectGender('male');
  if ($('genderGirlBtn')) $('genderGirlBtn').onclick = () => CrystalOnboarding.selectGender('female');
  if ($('characterBackBtn')) $('characterBackBtn').onclick = () => CrystalOnboarding.backFromCharacter();
  if ($('characterConfirmBtn')) $('characterConfirmBtn').onclick = () => CrystalOnboarding.confirmCharacter();
  if ($('playerNameInput')) {
    $('playerNameInput').onfocus = () => CrystalOnboarding.handleNameInputFocus();
    $('playerNameInput').onblur = () => CrystalOnboarding.handleNameInputBlur();
    $('playerNameInput').oninput = () => {
      CrystalOnboarding.usingDefaultName = false;
      CrystalOnboarding.syncNameInputVisual();
      if ($('playerNameError')) $('playerNameError').hidden = true;
    };
    $('playerNameInput').onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (CrystalOnboarding.usingDefaultName && !String($('playerNameInput').value ?? '')) {
          $('playerNameInput').value = getDefaultCharacterName(CrystalOnboarding.selectedGender);
        }
        CrystalOnboarding.confirmCharacter();
      }
    };
  }

  syncTruePixelSockets();
  syncTutorialsToEngine();
  applySettings();
  if (window.TruePixelEngine?.GameHUD) {
    window.TruePixelEngine.GameHUD.onGodModeChange = (active) => {
      if (screen === 'map') renderMap();
      syncGodModeUI();
      notify(active ? 'God Mode ativado: Mapa livre e habilidades infinitas!' : 'God Mode desativado.');
    };
    try {
      const params = typeof window !== 'undefined' && window.location?.search
        ? new URLSearchParams(window.location.search)
        : null;
      const urlGod = params?.get('godmode') ?? params?.get('god') ?? params?.get('gm');
      if (urlGod === '1' || urlGod === 'true') {
        window.TruePixelEngine.GameHUD.setGodMode?.(true, true);
      }
    } catch {}
    window.TruePixelEngine.GameHUD.syncGodModeBadge?.();
    syncGodModeUI();
  }
  renderMap();
  updateProgressLabels();
  window.CrystalMenuAudio?.setVolume?.(settings.music);
  CrystalOnboarding.startSplash();

  window.CrystalApp = {
    goto,
    startLevel,
    startFromMap,
    startNewGame,
    continueGame,
    syncProgress,
    recordTutorialViewed,
    markGuideIntroShown,
    notify,
    openSettings,
    openLevelList,
    openCharacterCreation: (source = 'new_game') => CrystalOnboarding.openCharacterCreation(source),
    get godMode() {
      return isGodModeActive();
    },
    setGodMode(val) {
      return window.TruePixelEngine?.GameHUD?.setGodMode?.(val, true);
    },
    toggleGodMode() {
      return window.TruePixelEngine?.GameHUD?.toggleGodMode?.();
    },
    unlockAll() {
      completed = Array.from({ length: 20 }, (_, i) => i + 1);
      for (const id of completed) {
        if (!records[id]) records[id] = { stars: 3, points: 300 };
      }
      hasSave = true;
      syncTruePixelSockets();
      syncTutorialsToEngine();
      persist();
      renderMap();
    },
    get state() {
      return {
        completed: [...completed],
        records: { ...records },
        current,
        hasSave,
        unlockedTutorials: [...unlockedTutorials],
        lastViewedTutorialKey,
        guideIntroShown,
        setupCompleted,
        playerName: playerName || getDefaultCharacterName(playerGender),
        playerGender,
        characterCreated,
        screen,
        godMode: isGodModeActive(),
        infiniteAbilities: isGodModeActive(),
        settings: { ...settings },
        onboarding: {
          splashActive: CrystalOnboarding.splashActive,
          brinqueSplashActive: CrystalOnboarding.brinqueSplashActive,
          splashStep: CrystalOnboarding.splashStep,
          splashPhase: CrystalOnboarding.splashPhase,
          wizardActive: CrystalOnboarding.wizardActive,
          wizardStep: CrystalOnboarding.wizardStep,
          characterScreenActive: CrystalOnboarding.characterScreenActive,
          loadingTransitionActive: CrystalOnboarding.loadingTransitionActive
        }
      };
    }
  };
})();
