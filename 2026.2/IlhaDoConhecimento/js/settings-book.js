/* ==========================================================================
   CONFIGURAÇÕES: MURAL DE CORTIÇA
   Navegação por cartões, transição FLIP para folha de caderno, paginação,
   acessibilidade, Fullscreen API e modo ?calibrar.
   ========================================================================== */
window.SettingsBook = (() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const settings = window.GameSettings;
  const book = $('#book-dialog'), view = $('#settings-view');
  const stage = $('.mural-stage'), main = $('.mural-main'), sheetContainer = $('.mural-sheet-container');
  const order = ['index', 'audio', 'controls', 'language', 'access', 'howto', 'about'];
  const spreads = Array.from(document.querySelectorAll('[data-settings-section]'));
  const goButtons = Array.from(document.querySelectorAll('[data-settings-go]'));
  const toggles = Array.from(document.querySelectorAll('[data-setting]'));
  const keyCaps = Array.from(document.querySelectorAll('[data-key]'));
  const speedOrder = ['slow', 'normal', 'fast'];
  const reduceQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  const sectionMeta = {
    audio: { title: 'Sons da aventura', icon: 'assets/configuracoes/mural/ui/icone-som.webp' },
    controls: { title: 'Como se mexer', icon: 'assets/configuracoes/mural/ui/icone-controles.webp' },
    language: { title: 'Qual é a sua língua?', icon: 'assets/configuracoes/mural/ui/icone-idioma.webp' },
    access: { title: 'Jogar com conforto', icon: 'assets/configuracoes/mural/ui/icone-acessibilidade.webp' },
    howto: { title: 'Sua missão', icon: 'assets/configuracoes/mural/ui/icone-como-jogar.webp' },
    about: { title: 'Ilha do Conhecimento', icon: 'assets/configuracoes/mural/ui/icone-sobre-nos.webp' }
  };

  const sheetHeaderIcon = $('#sheet-header-icon');
  const sheetMainTitle = $('#sheet-main-title');
  const sheetPagination = $('#sheet-pagination');
  const sheetPrevPage = $('#sheet-prev-page');
  const sheetNextPage = $('#sheet-next-page');
  const sheetPageIndicator = $('#sheet-page-indicator');
  const backButton = $('#settings-back');

  let current = 'index', busy = false, queued = null, activeCard = null;
  let currentSubPage = 1, totalSubPages = 1;

  const calm = () => Boolean(settings?.calm || (reduceQuery && reduceQuery.matches));
  const spreadOf = id => spreads.find(spread => spread.dataset.settingsSection === id);
  const titleOf = id => $(id === 'index' ? '#settings-title' : '#settings-' + id + '-title');
  const menuButtonOf = id => goButtons.find(button => button.dataset.settingsGo === id);

  function restart(element, className) {
    if (!element || calm()) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
  }

  function announce(text) {
    const el = $('#island-announcement');
    if (el) el.textContent = text;
  }

  /* ---------- Paginação interna na folha (sem rolagem) ---------- */
  function getSubPages(sectionId) {
    const spread = spreadOf(sectionId);
    if (spread && typeof spread.querySelectorAll === 'function') {
      return Array.from(spread.querySelectorAll('.sheet-page'));
    }
    return Array.from(document.querySelectorAll('.sheet-page')).filter(p => p.dataset && p.dataset.pageSection === sectionId);
  }

  function setupPagination(sectionId) {
    const pages = getSubPages(sectionId);
    totalSubPages = pages.length;
    currentSubPage = 1;
    pages.forEach((p, idx) => {
      p.hidden = idx !== 0;
      if (p.style) p.style.opacity = idx === 0 ? '1' : '0';
    });
    if (sheetPagination) {
      sheetPagination.hidden = totalSubPages <= 1;
      if (totalSubPages > 1) updatePaginationUI();
    }
  }

  function updatePaginationUI() {
    if (!sheetPagination) return;
    if (sheetPageIndicator) sheetPageIndicator.textContent = currentSubPage + ' / ' + totalSubPages;
    if (sheetPrevPage) sheetPrevPage.disabled = currentSubPage <= 1;
    if (sheetNextPage) sheetNextPage.disabled = currentSubPage >= totalSubPages;
  }

  function changeSubPage(direction) {
    if (busy) return;
    const targetPage = currentSubPage + direction;
    if (targetPage < 1 || targetPage > totalSubPages) return;
    const pages = getSubPages(current);
    const currEl = pages[currentSubPage - 1];
    const nextEl = pages[targetPage - 1];
    if (!currEl || !nextEl) return;

    busy = true;
    GameAudio.click();
    currEl.style.transition = 'opacity 75ms ease-out';
    currEl.style.opacity = '0';
    setTimeout(() => {
      currEl.hidden = true;
      nextEl.hidden = false;
      nextEl.style.opacity = '0';
      void nextEl.offsetWidth;
      nextEl.style.transition = 'opacity 75ms ease-out';
      nextEl.style.opacity = '1';
      currentSubPage = targetPage;
      if (current === 'about') {
        if (sheetHeaderIcon) sheetHeaderIcon.src = targetPage === 2 ? 'assets/configuracoes/mural/ui/icone-creditos.webp' : 'assets/configuracoes/mural/ui/icone-sobre-nos.webp';
        if (sheetMainTitle) sheetMainTitle.textContent = targetPage === 2 ? 'Quem fez a ilha' : 'Ilha do Conhecimento';
      }
      updatePaginationUI();
      setTimeout(() => {
        busy = false;
        announce('Página ' + currentSubPage + ' de ' + totalSubPages);
      }, 85);
    }, 75);
  }

  if (sheetPrevPage) sheetPrevPage.addEventListener('click', () => changeSubPage(-1));
  if (sheetNextPage) sheetNextPage.addEventListener('click', () => changeSubPage(1));

  /* ---------- Transição FLIP: Cartão -> Folha ---------- */
  function openSubmenu(target, triggerButton, focus = 'heading') {
    busy = true;
    activeCard = triggerButton || menuButtonOf(target);
    current = target;
    view.dataset.section = target;
    if (backButton) backButton.hidden = false;

    // Atualiza cabeçalho da folha
    const info = sectionMeta[target];
    if (info) {
      if (sheetHeaderIcon) sheetHeaderIcon.src = info.icon;
      if (sheetMainTitle) sheetMainTitle.textContent = info.title;
    }

    // Exibe a seção ativa
    for (const spread of spreads) spread.hidden = spread.dataset.settingsSection !== target;
    setupPagination(target);

    GameAudio.page();

    let safetyTimer = null;
    const finish = () => {
      if (safetyTimer) clearTimeout(safetyTimer);
      if (sheetContainer) {
        sheetContainer.style.willChange = 'auto';
        sheetContainer.style.transition = '';
        sheetContainer.style.transform = '';
        sheetContainer.style.opacity = '';
      }
      busy = false;
      if (focus === 'heading') (titleOf(target) || sheetMainTitle)?.focus();
      announce('Submenu ' + (info ? info.title : target) + ' aberto.');
      checkOverflow();
      if (queued) { const next = queued; queued = null; go(next.target, next.focus); }
    };

    if (calm() || !sheetContainer || !activeCard) {
      if (sheetContainer) sheetContainer.hidden = false;
      if (main) main.classList.add('is-dimmed');
      finish();
      return;
    }

    // FLIP
    const first = activeCard.getBoundingClientRect();
    sheetContainer.hidden = false;
    sheetContainer.style.transition = 'none';
    if (main) main.classList.add('is-dimmed');

    const last = sheetContainer.getBoundingClientRect();
    if (first.width > 0 && last.width > 0) {
      const dx = (first.left + first.width / 2) - (last.left + last.width / 2);
      const dy = (first.top + first.height / 2) - (last.top + last.height / 2);
      const sx = first.width / last.width;
      const sy = first.height / last.height;

      sheetContainer.style.transformOrigin = 'center center';
      sheetContainer.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) scale(' + sx + ', ' + sy + ')';
      sheetContainer.style.opacity = '0.35';
      sheetContainer.style.willChange = 'transform, opacity';

      requestAnimationFrame(() => {
        sheetContainer.style.transition = 'transform 450ms cubic-bezier(0, 0, 0.2, 1), opacity 450ms ease-out';
        sheetContainer.style.transform = 'none';
        sheetContainer.style.opacity = '1';
      });
    }

    safetyTimer = setTimeout(finish, 550);
    sheetContainer.addEventListener('transitionend', function onEnd(e) {
      if (e.target === sheetContainer) {
        sheetContainer.removeEventListener('transitionend', onEnd);
        finish();
      }
    });
  }

  /* ---------- Transição FLIP Inversa: Folha -> Cartão ---------- */
  function closeSubmenu(focusTarget = 'menu') {
    busy = true;
    const previous = current;
    current = 'index';
    view.dataset.section = 'index';
    if (backButton) backButton.hidden = true;

    GameAudio.page();

    const card = activeCard || menuButtonOf(previous);
    let safetyTimer = null;

    const finish = () => {
      if (safetyTimer) clearTimeout(safetyTimer);
      if (sheetContainer) {
        sheetContainer.hidden = true;
        sheetContainer.style.willChange = 'auto';
        sheetContainer.style.transition = '';
        sheetContainer.style.transform = '';
        sheetContainer.style.opacity = '';
      }
      for (const spread of spreads) spread.hidden = spread.dataset.settingsSection !== 'index';
      if (main) main.classList.remove('is-dimmed');
      busy = false;
      if (focusTarget === 'menu' && card) card.focus();
      else (titleOf('index'))?.focus();
      announce('Retornou ao mural de configurações.');
      if (queued) { const next = queued; queued = null; go(next.target, next.focus); }
    };

    if (calm() || !sheetContainer || !card) {
      finish();
      return;
    }

    const targetRect = card.getBoundingClientRect();
    const sheetRect = sheetContainer.getBoundingClientRect();

    if (targetRect.width > 0 && sheetRect.width > 0) {
      const dx = (targetRect.left + targetRect.width / 2) - (sheetRect.left + sheetRect.width / 2);
      const dy = (targetRect.top + targetRect.height / 2) - (sheetRect.top + sheetRect.height / 2);
      const sx = targetRect.width / sheetRect.width;
      const sy = targetRect.height / sheetRect.height;

      sheetContainer.style.willChange = 'transform, opacity';
      sheetContainer.style.transition = 'transform 450ms cubic-bezier(0, 0, 0.2, 1), opacity 450ms ease-out';
      sheetContainer.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) scale(' + sx + ', ' + sy + ')';
      sheetContainer.style.opacity = '0';
      if (main) main.classList.remove('is-dimmed');
    } else {
      sheetContainer.style.transition = 'opacity 200ms ease-out';
      sheetContainer.style.opacity = '0';
      if (main) main.classList.remove('is-dimmed');
    }

    safetyTimer = setTimeout(finish, 550);
    sheetContainer.addEventListener('transitionend', function onEnd(e) {
      if (e.target === sheetContainer) {
        sheetContainer.removeEventListener('transitionend', onEnd);
        finish();
      }
    });
  }

  function go(target, focus = 'heading') {
    if (!order.includes(target)) return;
    if (busy) { queued = { target, focus }; return; }
    if (target === current) {
      if (focus === 'heading') (titleOf(target) || sheetMainTitle)?.focus();
      return;
    }
    if (target === 'index') {
      closeSubmenu(focus);
      return;
    }
    openSubmenu(target, menuButtonOf(target), focus);
  }

  goButtons.forEach(button => button.addEventListener('click', () => go(button.dataset.settingsGo, 'heading')));
  if (backButton) backButton.addEventListener('click', () => closeSubmenu('menu'));

  /* ---------- Voltar ao menu principal (Ajuste 1) ---------- */
  const cardQuit = $('#settings-card-quit');
  const confirmDialog = $('#settings-confirm-dialog');
  const confirmYes = $('#settings-confirm-yes');
  const confirmNo = $('#settings-confirm-no');
  const confirmPuzzleWarning = $('#settings-confirm-puzzle-warning');

  function isAtMainMenu() {
    const homeScreen = $('#home-screen');
    const isPlaying = document.body.classList.contains('is-playing');
    return (!isPlaying && !window.GameIsland?.active && !window.PuzzleGame?.active && !window.DevPuzzleScreen?.active && !window.ActivePuzzle?.active) || (homeScreen && !homeScreen.hidden);
  }

  function isInPuzzle() {
    return Boolean(
      window.ActivePuzzle?.active ||
      window.DevPuzzleScreen?.active ||
      window.PuzzleGame?.active ||
      window.GeometriaPuzzle?.active ||
      window.OperacoesPuzzle?.active ||
      window.AlgebraPuzzle?.active ||
      window.LabirintoPuzzle?.active ||
      document.querySelector('[role="dialog"][aria-label*="Balança"]') ||
      document.querySelector('[role="dialog"][aria-label*="Ponte"]') ||
      document.querySelector('[role="dialog"][aria-label*="Moinho"]') ||
      document.querySelector('[role="dialog"][aria-label*="Labirinto"]')
    );
  }

  function updateQuitCardState() {
    if (!cardQuit) return;
    const atHome = isAtMainMenu();
    if (atHome) {
      cardQuit.disabled = true;
      cardQuit.setAttribute('aria-disabled', 'true');
      cardQuit.title = 'Você já está no menu principal';
      cardQuit.classList.add('is-disabled');
    } else {
      cardQuit.disabled = false;
      cardQuit.removeAttribute('aria-disabled');
      cardQuit.title = 'Voltar ao menu principal';
      cardQuit.classList.remove('is-disabled');
    }
  }

  function openConfirmQuit() {
    if (isAtMainMenu()) return;
    if (confirmPuzzleWarning) {
      confirmPuzzleWarning.hidden = !isInPuzzle();
    }
    if (confirmDialog) {
      confirmDialog.hidden = false;
      confirmNo?.focus();
    }
  }

  function closeConfirmQuit() {
    if (confirmDialog) confirmDialog.hidden = true;
    cardQuit?.focus();
  }

  function performReturnToMenu() {
    if (confirmDialog) confirmDialog.hidden = true;
    book.close();
    if (window.ActivePuzzle?.close) {
      try { window.ActivePuzzle.close(); } catch (e) { console.warn('Erro ao fechar puzzle ativo:', e); }
    }
    if (window.GameIsland?.stop) {
      window.GameIsland.stop();
    } else {
      const screen = $('#island-screen');
      if (screen) screen.hidden = true;
      const home = $('#home-screen');
      if (home) home.hidden = false;
      document.body.classList.remove('is-playing');
      window.Music?.definirLugar?.('menu');
      $('[data-open="start"]')?.focus();
    }
  }

  if (cardQuit) cardQuit.addEventListener('click', () => { GameAudio.click(); openConfirmQuit(); });
  if (confirmNo) confirmNo.addEventListener('click', () => { GameAudio.click(); closeConfirmQuit(); });
  if (confirmYes) confirmYes.addEventListener('click', () => { GameAudio.click(); performReturnToMenu(); });

  // Escape: no submenu volta ao mural; no menu principal fecha o diálogo
  document.addEventListener('keydown', event => {
    if (!book.open || view.hidden) return;
    if (confirmDialog && !confirmDialog.hidden) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeConfirmQuit();
        return;
      }
      if (event.key === 'Tab') {
        const btns = [confirmYes, confirmNo].filter(b => b && !b.disabled);
        const idx = btns.indexOf(document.activeElement);
        if (event.shiftKey) {
          if (idx <= 0) { event.preventDefault(); btns[btns.length - 1]?.focus(); }
        } else {
          if (idx >= btns.length - 1 || idx === -1) { event.preventDefault(); btns[0]?.focus(); }
        }
        return;
      }
    }
    if (event.key === 'Escape' && current !== 'index') {
      event.preventDefault();
      event.stopPropagation();
      closeSubmenu('menu');
    }
  }, true);

  /* ---------- Áudio ---------- */
  const sliders = { sound: $('#sound-volume'), music: $('#music-volume') };
  function paintAudio() {
    for (const [id, color] of [['sound', '#65a559'], ['music', '#579cae']]) {
      const value = settings.get(id), slider = sliders[id];
      if (!slider) continue;
      slider.value = String(value);
      const valEl = $('#' + id + '-value');
      if (valEl) valEl.value = value + '%';
      slider.setAttribute('aria-valuetext', value + ' por cento');
    }
    const muted = settings.get('mute');
    view.classList.toggle('is-muted', muted);
    GameAudio.setVolumes(muted ? 0 : settings.get('sound'), muted ? 0 : settings.get('music'));
  }
  for (const [id, slider] of Object.entries(sliders)) {
    if (!slider) continue;
    slider.addEventListener('input', () => {
      const value = slider.value;
      if (settings.get('mute')) settings.set('mute', false);
      settings.set(id, value);
      const valEl = $('#' + id + '-value');
      if (valEl) restart(valEl, 'is-popping');
    });
    slider.addEventListener('change', () => { GameAudio.click(); });
  }
  const testSoundBtn = $('#test-sound');
  if (testSoundBtn) testSoundBtn.addEventListener('click', () => { GameAudio.success(); });

  function refreshMusic(active) {
    const musicToggle = $('#music-toggle');
    if (!musicToggle) return;
    musicToggle.setAttribute('aria-pressed', String(active));
    const status = $('#music-status');
    if (status) status.textContent = active ? 'Pausar música de teste' : 'Ouvir música de teste';
  }
  const musicToggle = $('#music-toggle');
  if (musicToggle) musicToggle.addEventListener('click', () => { refreshMusic(GameAudio.toggleMusic()); });

  /* ---------- Interruptores liga/desliga ---------- */
  function paintToggles() {
    for (const toggle of toggles) {
      const on = Boolean(settings.get(toggle.dataset.setting));
      toggle.setAttribute('aria-checked', String(on));
      const stateEl = $('#' + toggle.id + '-state');
      if (stateEl) stateEl.textContent = on ? 'Ligado' : 'Desligado';
    }
  }
  toggles.forEach(toggle => toggle.addEventListener('click', () => {
    const on = toggle.getAttribute('aria-checked') !== 'true';
    settings.set(toggle.dataset.setting, on);
    GameAudio.toggle(on);
  }));

  /* ---------- Controles ---------- */
  function paintSpeed() {
    const speed = settings.get('speed'), index = speedOrder.indexOf(speed);
    const speedVal = $('#speed-value');
    if (speedVal) speedVal.value = settings.speeds[speed].label;
    const prev = $('#speed-prev'), next = $('#speed-next');
    if (prev) prev.setAttribute('aria-disabled', String(index === 0));
    if (next) next.setAttribute('aria-disabled', String(index === speedOrder.length - 1));
    const preview = $('#walk-preview');
    if (preview) preview.dataset.speed = speed;
  }
  function stepSpeed(button, shift) {
    const next = speedOrder[speedOrder.indexOf(settings.get('speed')) + shift];
    if (!next) { restart(button, 'is-shaking'); return; }
    settings.set('speed', next);
    GameAudio.click();
    const speedVal = $('#speed-value');
    if (speedVal) restart(speedVal, 'is-popping');
  }
  const speedPrev = $('#speed-prev'), speedNext = $('#speed-next');
  if (speedPrev) speedPrev.addEventListener('click', () => stepSpeed(speedPrev, -1));
  if (speedNext) speedNext.addEventListener('click', () => stepSpeed(speedNext, 1));

  const touchOptions = Array.from(document.querySelectorAll('.touch-option'));
  function paintTouch() {
    const mode = settings.get('touch');
    for (const option of touchOptions) {
      const isSelected = option.dataset.touch === mode;
      option.setAttribute('aria-checked', String(isSelected));
      option.classList.toggle('is-selected', isSelected);
    }
  }
  touchOptions.forEach(option => option.addEventListener('click', () => {
    if (settings.get('touch') === option.dataset.touch) return;
    settings.set('touch', option.dataset.touch);
    GameAudio.click();
  }));

  document.addEventListener('keydown', event => {
    if (!book.open || view.hidden || current !== 'controls' || !event.key) return;
    const key = event.key.toLowerCase();
    for (const cap of keyCaps) if (cap.dataset.key === key) restart(cap, 'is-pressed');
  });

  /* ---------- Idioma ---------- */
  const langPt = $('#lang-pt'), langEn = $('#lang-en');
  if (langPt) langPt.addEventListener('click', () => {
    GameAudio.click();
    const note = $('#language-note');
    if (note) note.textContent = 'Você já está jogando em português!';
  });
  if (langEn) langEn.addEventListener('click', () => {
    GameAudio.click();
    if (langEn) restart(langEn, 'is-shaking');
    const note = $('#language-note');
    if (note) note.textContent = 'O inglês ainda está chegando. Em breve!';
  });

  /* ---------- Padrões ---------- */
  const resetBtn = $('#settings-reset');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    settings.reset();
    GameAudio.success();
    const note = $('#settings-reset-note');
    if (note) note.textContent = 'Pronto! Tudo voltou ao jeito do começo.';
    announce('Padrões restaurados.');
  });

  /* ---------- Tela cheia (Fullscreen API) ---------- */
  const fsButton = $('#settings-fullscreen');
  const fsRoot = document.documentElement || {};
  const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;
  const canFullscreen = Boolean(fsRoot.requestFullscreen || fsRoot.webkitRequestFullscreen);

  function paintFullscreen() {
    if (!fsButton) return;
    const on = Boolean(fsElement());
    fsButton.setAttribute('aria-pressed', String(on));
    fsButton.setAttribute('aria-label', on ? 'Sair da tela cheia' : 'Ativar tela cheia');
    fsButton.setAttribute('aria-disabled', String(!canFullscreen));
    const label = $('#settings-fullscreen-label');
    if (label) label.textContent = !canFullscreen ? 'Tela cheia indisponível' : on ? 'Sair da tela cheia' : 'Tela cheia';
  }

  if (fsButton) {
    fsButton.addEventListener('click', async () => {
      if (!canFullscreen) return;
      try {
        if (fsElement()) await (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        else await (fsRoot.requestFullscreen || fsRoot.webkitRequestFullscreen).call(fsRoot);
      } catch (error) { console.warn('Tela cheia indisponível', error); }
      paintFullscreen();
    });
    document.addEventListener('fullscreenchange', paintFullscreen);
    document.addEventListener('webkitfullscreenchange', paintFullscreen);
    paintFullscreen();
  }

  /* ---------- Auditoria de Overflow (?calibrar) ---------- */
  function checkOverflow() {
    if (typeof window === 'undefined' || !window.location || !window.location.search) return;
    if (!new URLSearchParams(window.location.search).has('calibrar')) return;
    if (stage) stage.classList.add('mural-calibrar');
    document.querySelectorAll('.mural-stage *').forEach(el => {
      if (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2) {
        el.classList.add('calibrar-overflow');
      } else {
        el.classList.remove('calibrar-overflow');
      }
    });
  }

  function paintAll() { paintAudio(); paintToggles(); paintSpeed(); paintTouch(); }
  settings.onChange(paintAll);
  paintAll();

  // Modo ?calibrar ao carregar
  if (typeof window !== 'undefined' && window.location?.search && new URLSearchParams(window.location.search).has('calibrar')) {
    if (stage) stage.classList.add('mural-calibrar');
  }

  return {
    open(section = 'index') {
      busy = false; queued = null;
      updateQuitCardState();
      if (confirmDialog) confirmDialog.hidden = true;
      const note = $('#settings-reset-note');
      if (note) note.textContent = '';
      const langNote = $('#language-note');
      if (langNote) langNote.textContent = 'O inglês ainda não está disponível.';
      if (section === 'index' || !order.includes(section)) {
        current = 'index';
        view.dataset.section = 'index';
        if (sheetContainer) sheetContainer.hidden = true;
        for (const spread of spreads) spread.hidden = spread.dataset.settingsSection !== 'index';
        if (main) main.classList.remove('is-dimmed');
        if (backButton) backButton.hidden = true;
      } else {
        openSubmenu(section, menuButtonOf(section), 'heading');
      }
      checkOverflow();
    },
    go,
    refreshMusic,
    get current() { return current; }
  };
})();
