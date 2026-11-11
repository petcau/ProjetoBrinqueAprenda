/* Uma tela própria para abrir os quatro cadeados e reencontrar o gato. */
window.GameRescue = (() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const screen = $('#rescue-screen');
  const names = {
    forest: ['verde', 'Floresta dos Padrões'],
    village: ['azul', 'Vila do Conhecimento'],
    ruins: ['vermelha', 'Ruínas das Formas'],
    farm: ['amarela', 'Fazenda dos Números']
  };
  let active = false, callbacks = {};
  function render() {
    const progress = AdventureProgress;
    screen.dataset.rescued = String(progress.rescued);
    $('#rescue-title').textContent = progress.rescued ? 'Seu amigo está livre!' : 'O gato espera por você';
    $('#rescue-copy').textContent = progress.rescued
      ? 'Miau! Você explorou, aprendeu e abriu os quatro cadeados. Agora vocês podem voltar para casa juntos!'
      : 'Cada chave abre um cadeado da mesma cor. Toque nos cadeados para ajudar seu amigo.';
    $('#rescue-count').textContent = `${progress.unlockedCount} de 4 cadeados abertos`;
    $('#rescue-menu').hidden = !progress.rescued;
    for (const region of progress.regions) {
      const [color, place] = names[region];
      const button = $(`#rescue-lock-${region}`), label = $(`#rescue-label-${region}`);
      const unlocked = progress.isUnlocked(region), owned = progress.hasKey(region);
      button.disabled = unlocked || !owned;
      button.dataset.unlocked = String(unlocked);
      button.setAttribute('aria-label', unlocked ? `Cadeado da chave ${color} aberto` : owned ? `Abrir cadeado com a chave ${color}` : `Chave ${color} ainda está em ${place}`);
      label.textContent = unlocked ? 'Aberto ✓' : owned ? `Usar chave ${color}` : `Falta a chave ${color}`;
    }
    $('#rescue-missing').textContent = progress.rescued
      ? 'A aventura foi concluída. Você pode passear pela ilha e jogar os desafios outra vez.'
      : progress.keyCount === 4 ? 'Você tem todas as chaves! Abra os cadeados que faltam.'
      : 'Procure as chaves na floresta, na vila, nas ruínas e na fazenda. O mapa da ilha mostra o caminho.';
  }
  function open(options = {}) {
    callbacks = options;
    active = true;
    screen.hidden = false;
    $('#rescue-feedback').textContent = '';
    render();
    $('#rescue-title').focus();
  }
  function stop() { active = false; screen.hidden = true; callbacks = {}; }
  function exit(menu = false) {
    if (!active) return;
    const callback = menu ? callbacks.onMenu : callbacks.onExit;
    stop();
    if (menu) window.Music?.definirLugar?.('menu');
    else window.Music?.definirLugar?.('exploracao');
    if (callback) callback();
  }
  for (const region of AdventureProgress.regions) {
    $(`#rescue-lock-${region}`).addEventListener('click', () => {
      if (!active || document.querySelector('dialog[open]') || !AdventureProgress.unlock(region)) return;
      GameAudio.success();
      const finished = AdventureProgress.rescue();
      render();
      $('#rescue-feedback').textContent = finished ? 'Os quatro cadeados abriram! Você libertou seu gato!' : `Você usou a chave ${names[region][0]}. Mais um cadeado aberto!`;
      if (callbacks.onProgress) callbacks.onProgress();
      if (finished) {
        window.Music?.definirLugar?.('final');
        $('#rescue-title').focus();
      }
      else {
        const next = AdventureProgress.regions.find(id => AdventureProgress.hasKey(id) && !AdventureProgress.isUnlocked(id));
        (next ? $(`#rescue-lock-${next}`) : $('#rescue-return')).focus();
      }
    });
  }
  $('#rescue-return').addEventListener('click', () => exit());
  $('#rescue-menu').addEventListener('click', () => exit(true));
  document.addEventListener('keydown', event => {
    if (!active || event.ctrlKey || event.altKey || event.metaKey || document.querySelector('dialog[open]')) return;
    if (event.key === 'Escape' && !event.repeat) { event.preventDefault(); exit(); }
  });
  return { open, stop, get active() { return active; } };
})();
