/* Telas de desafios, tentativas, demonstração e chaves mantidas nesta sessão. */
window.PuzzleGame = (() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const screen = $('#puzzle-screen');
  const title = $('#puzzle-title');
  const board = $('#puzzle-board');
  const controls = $('#puzzle-controls');
  const instruction = $('#puzzle-instruction');
  const feedback = $('#puzzle-feedback');
  const hint = $('#puzzle-hint');
  const next = $('#puzzle-next');
  const help = $('#puzzle-help');
  const back = $('#puzzle-return');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const progress = new Map();
  const timers = new Set();
  let active = false;
  let regionId = null;
  let callbacks = {};
  let demoVersion = 0;
  let observing = false;
  let watch = null;
  let trail = null;
  let confirmSequence = null;
  let replaySequence = null;
  let tokenButtons = [];
  let piece = null;
  let rotationLabel = null;

  const region = () => PuzzleData.regions[regionId];
  const state = () => progress.get(regionId);
  const round = () => region().rounds[state().round];
  const dialogsOpen = () => Array.from(document.querySelectorAll('dialog')).some(dialog => dialog.open);
  const canInteract = () => active && !document.hidden && !dialogsOpen();

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function button(text, action, handler, className = 'puzzle-action') {
    const node = element('button', className, text);
    node.type = 'button';
    node.dataset.puzzleAction = action;
    node.addEventListener('click', () => {
      if (!canInteract()) return;
      handler(node);
    });
    return node;
  }

  function sound(name) {
    if (window.GameAudio && typeof window.GameAudio[name] === 'function') window.GameAudio[name]();
  }

  function setFeedback(text, success = false) {
    feedback.textContent = text;
    feedback.classList.toggle('is-success', success);
  }

  function cancelTimers() {
    demoVersion++;
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
    observing = false;
  }

  function later(callback, delay, version) {
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (!active || version !== demoVersion) return;
      if (!canInteract()) {
        interruptDemo();
        return;
      }
      callback();
    }, delay);
    timers.add(timer);
  }

  function tokenNode(id, className = 'puzzle-token') {
    const token = PuzzleData.tokens.find(item => item.id === id);
    const node = element('span', `${className} token-${token.id}`);
    const shape = element('span', 'puzzle-token-symbol', token.symbol);
    shape.setAttribute('aria-hidden', 'true');
    node.appendChild(shape);
    node.appendChild(element('span', 'puzzle-token-name', token.label));
    return node;
  }

  function drawTrail() {
    trail.replaceChildren();
    const current = state();
    for (let index = 0; index < round().sequence.length; index++) {
      const step = element('span', 'puzzle-step');
      if (current.entered[index]) {
        step.classList.add('is-filled');
        step.appendChild(tokenNode(current.entered[index]));
        step.setAttribute('aria-label', `Sua escolha ${index + 1}: ${PuzzleData.tokens.find(token => token.id === current.entered[index]).label}`);
      } else {
        step.textContent = `${index + 1}`;
        step.setAttribute('aria-label', `Escolha ${index + 1}: vazia`);
      }
      if (index === current.entered.length && !observing) step.classList.add('is-current');
      trail.appendChild(step);
    }
    confirmSequence.disabled = observing || current.solved || !current.demoSeen || current.entered.length !== round().sequence.length;
    for (const node of tokenButtons) node.disabled = observing || current.solved || !current.demoSeen || current.entered.length >= round().sequence.length;
  }

  function interruptDemo() {
    if (!active || !observing || region().kind !== 'sequence') return;
    cancelTimers();
    state().demoSeen = false;
    state().interrupted = true;
    state().entered = [];
    watch.classList.remove('is-lit');
    watch.replaceChildren(element('span', 'puzzle-watch-empty', 'Vamos observar de novo?'));
    screen.dataset.state = 'playing';
    replaySequence.disabled = false;
    replaySequence.textContent = 'Observar de novo';
    setFeedback('A sequência foi interrompida. Use Observar de novo para vê-la do começo.');
    drawTrail();
  }

  function demonstrate() {
    if (!canInteract() || state().solved) return;
    cancelTimers();
    const current = state();
    current.entered = [];
    current.demoSeen = false;
    current.interrupted = false;
    observing = true;
    screen.dataset.state = 'observing';
    replaySequence.disabled = true;
    watch.replaceChildren(element('span', 'puzzle-watch-empty', 'Prepare-se para observar…'));
    setFeedback('Observe um símbolo de cada vez. Depois você vai repetir a ordem.');
    drawTrail();
    const version = demoVersion;
    const duration = reducedMotion.matches ? 1350 : 1050;
    const gap = 350;
    let index = 0;
    function showToken() {
      const token = PuzzleData.tokens.find(item => item.id === round().sequence[index]);
      watch.replaceChildren(tokenNode(token.id));
      watch.classList.add('is-lit');
      setFeedback(`Símbolo ${index + 1} de ${round().sequence.length}: ${token.label}.`);
      later(() => {
        watch.classList.remove('is-lit');
        watch.replaceChildren(element('span', 'puzzle-watch-empty', '…'));
        index++;
        if (index < round().sequence.length) later(showToken, gap, version);
        else later(() => {
          observing = false;
          current.demoSeen = true;
          screen.dataset.state = 'playing';
          watch.replaceChildren(element('span', 'puzzle-watch-empty', 'Agora é sua vez!'));
          replaySequence.disabled = false;
          replaySequence.textContent = 'Rever sequência';
          setFeedback('Sua vez! Escolha os símbolos na ordem em que apareceram.');
          drawTrail();
        }, gap, version);
      }, duration, version);
    }
    later(showToken, 650, version);
  }

  function checkSequence() {
    const current = state();
    if (observing || current.solved || current.entered.length !== round().sequence.length) return;
    if (current.entered.every((id, index) => id === round().sequence[index])) solve();
    else {
      current.entered = [];
      setFeedback('Quase! Vamos tentar outra vez. Você pode rever a sequência quantas vezes quiser.');
      drawTrail();
      replaySequence.focus();
    }
  }

  function renderSequence() {
    instruction.textContent = 'Observe os símbolos. Quando eles sumirem, repita a mesma ordem.';
    const layout = element('div', 'puzzle-sequence');
    watch = element('div', 'puzzle-watch');
    watch.setAttribute('aria-hidden', 'true');
    watch.replaceChildren(element('span', 'puzzle-watch-empty', 'Agora é sua vez!'));
    trail = element('div', 'puzzle-answer-trail');
    trail.setAttribute('role', 'group');
    trail.setAttribute('aria-label', 'A sequência que você escolheu');
    layout.appendChild(watch);
    layout.appendChild(trail);
    board.appendChild(layout);
    const choices = element('div', 'puzzle-choice-grid');
    choices.setAttribute('role', 'group');
    choices.setAttribute('aria-label', 'Símbolos para repetir a sequência');
    tokenButtons = PuzzleData.tokens.map(token => {
      const node = button('', `token-${token.id}`, () => {
        const current = state();
        if (observing || current.solved || !current.demoSeen || current.entered.length >= round().sequence.length) return;
        current.entered.push(token.id);
        sound('click');
        drawTrail();
        setFeedback(`${current.entered.length} de ${round().sequence.length} símbolos escolhidos.`);
        if (current.entered.length === round().sequence.length) confirmSequence.focus();
      }, `puzzle-choice puzzle-token token-${token.id}`);
      node.setAttribute('aria-label', token.label);
      node.dataset.token = token.id;
      const shape = element('span', 'puzzle-token-symbol', token.symbol);
      shape.setAttribute('aria-hidden', 'true');
      node.appendChild(shape);
      node.appendChild(element('span', 'puzzle-token-name', token.label));
      choices.appendChild(node);
      return node;
    });
    controls.appendChild(choices);
    replaySequence = button('Rever sequência', 'replay-sequence', demonstrate);
    confirmSequence = button('Conferir sequência', 'check-sequence', checkSequence);
    controls.appendChild(replaySequence);
    controls.appendChild(button('Apagar minhas escolhas', 'clear-sequence', () => {
      if (observing || state().solved) return;
      state().entered = [];
      drawTrail();
      setFeedback('As escolhas foram apagadas. Tente de novo no seu tempo.');
    }));
    controls.appendChild(confirmSequence);
    drawTrail();
    if (!state().solved && !state().demoSeen) demonstrate();
  }

  function equationNode(value) {
    if (value !== null) return element('span', 'puzzle-number', `${value}`);
    const missing = element('span', 'puzzle-missing', '?');
    missing.setAttribute('aria-label', 'número que falta');
    return missing;
  }

  function countGroup(label, value) {
    const group = element('div', 'puzzle-counter');
    group.appendChild(element('span', 'puzzle-counter-label', `${label}: ${value}`));
    const dots = element('span', 'puzzle-dot-group');
    dots.setAttribute('aria-hidden', 'true');
    for (let index = 0; index < value; index++) dots.appendChild(element('span', 'puzzle-dot', '●'));
    group.appendChild(dots);
    return group;
  }

  function renderNumbers() {
    const data = round();
    const missing = region().kind === 'missing';
    instruction.textContent = missing ? 'Qual número completa a conta? Escolha uma das respostas.' : 'Qual é o resultado da colheita? Escolha uma das respostas.';
    const equation = element('div', 'puzzle-equation');
    equation.setAttribute('role', 'group');
    equation.setAttribute('aria-label', `${data.left === null ? 'Número que falta' : data.left} ${data.operator === '+' ? 'mais' : 'menos'} ${data.right === null ? 'número que falta' : data.right} é igual a ${missing ? data.result : 'qual número?'}`);
    equation.appendChild(equationNode(data.left));
    equation.appendChild(element('span', 'puzzle-operator', data.operator));
    equation.appendChild(equationNode(data.right));
    equation.appendChild(element('span', 'puzzle-operator', '='));
    equation.appendChild(equationNode(missing ? data.result : null));
    board.appendChild(equation);
    const counts = element('div', 'puzzle-counts');
    if (data.left !== null) counts.appendChild(countGroup(data.operator === '+' ? 'Primeiro grupo' : 'Começo', data.left));
    if (data.right !== null) counts.appendChild(countGroup(data.operator === '+' ? 'Outro grupo' : 'Retirar', data.right));
    if (missing) counts.appendChild(countGroup('Total', data.result));
    board.appendChild(counts);
    const choices = element('div', 'puzzle-choice-grid');
    choices.setAttribute('role', 'group');
    choices.setAttribute('aria-label', 'Respostas possíveis');
    for (const value of data.options) {
      const choice = button(`${value}`, `answer-${value}`, node => {
        if (state().solved) return;
        if (value === data.answer) {
          node.classList.add('is-chosen');
          solve();
        } else {
          setFeedback('Ainda não é esse número. Conte os pontinhos ou use a dica e tente outra vez!');
        }
      }, 'puzzle-choice');
      choice.dataset.answer = `${value}`;
      choice.setAttribute('aria-label', `${missing ? 'O número que falta é' : 'O resultado é'} ${value}`);
      choices.appendChild(choice);
    }
    controls.appendChild(choices);
  }

  function shapeSvg(rotation, target) {
    const namespace = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(namespace, 'svg');
    svg.setAttribute('viewBox', '0 0 160 160');
    svg.setAttribute('class', `puzzle-shape-svg${target ? ' puzzle-shape-target' : ''}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `${target ? 'Encaixe' : 'Sua peça'} em L, girado ${rotation} graus. O canto amarelo também precisa corresponder.`);
    const group = document.createElementNS(namespace, 'g');
    group.setAttribute('transform', `rotate(${rotation} 80 80)`);
    const shape = document.createElementNS(namespace, 'path');
    shape.setAttribute('d', 'M 38 28 H 74 V 82 H 122 V 118 H 38 Z');
    shape.setAttribute('fill', target ? '#6d6557' : '#d76a4e');
    shape.setAttribute('stroke', target ? '#433c32' : '#783a2c');
    shape.setAttribute('stroke-width', '5');
    shape.setAttribute('stroke-linejoin', 'miter');
    if (target) shape.setAttribute('stroke-dasharray', '8 4');
    const marker = document.createElementNS(namespace, 'rect');
    marker.setAttribute('x', '46');
    marker.setAttribute('y', '36');
    marker.setAttribute('width', '13');
    marker.setAttribute('height', '13');
    marker.setAttribute('fill', '#ffe197');
    marker.setAttribute('stroke', '#665027');
    marker.setAttribute('stroke-width', '2');
    group.appendChild(shape);
    group.appendChild(marker);
    svg.appendChild(group);
    return {svg, group};
  }

  function rotate(amount) {
    if (!canInteract() || state().solved) return;
    state().rotation = (state().rotation + amount + 360) % 360;
    piece.group.setAttribute('transform', `rotate(${state().rotation} 80 80)`);
    piece.svg.setAttribute('aria-label', `Sua peça em L, girada ${state().rotation} graus. Compare também o canto amarelo.`);
    rotationLabel.textContent = `Sua peça: ${state().rotation}°`;
    setFeedback('Compare a peça e o encaixe. Quando estiverem iguais, use Encaixar peça.');
    sound('click');
  }

  function renderRotation() {
    instruction.textContent = 'Gire a peça em L até ficar igual ao encaixe. Compare também o canto amarelo.';
    const layout = element('div', 'puzzle-geometry');
    const targetCard = element('div', 'puzzle-shape-card');
    targetCard.appendChild(element('h2', '', 'Encaixe da porta'));
    targetCard.appendChild(shapeSvg(round().target, true).svg);
    const playerCard = element('div', 'puzzle-shape-card');
    playerCard.appendChild(element('h2', '', 'Sua peça'));
    piece = shapeSvg(state().rotation, false);
    playerCard.appendChild(piece.svg);
    rotationLabel = element('p', 'puzzle-rotation-label', `Sua peça: ${state().rotation}°`);
    playerCard.appendChild(rotationLabel);
    layout.appendChild(targetCard);
    layout.appendChild(playerCard);
    board.appendChild(layout);
    controls.appendChild(button('↶ Girar para a esquerda', 'rotate-left', () => rotate(-90)));
    controls.appendChild(button('Girar para a direita ↷', 'rotate-right', () => rotate(90)));
    controls.appendChild(button('Encaixar peça', 'check-rotation', () => {
      if (state().solved) return;
      if (state().rotation === round().target) solve();
      else setFeedback('A peça ainda está virada para outro lado. Gire mais um pouco e tente de novo!');
    }));
    controls.appendChild(element('p', 'puzzle-helper', 'As setas ← e → também giram a peça. Cada giro é um quarto de volta.'));
  }

  function markSolved() {
    screen.dataset.state = 'solved';
    setFeedback('Muito bem! Você resolveu este desafio.', true);
    updateProgress();
    for (const node of controls.querySelectorAll('button')) node.disabled = true;
    next.hidden = false;
    next.textContent = state().round === region().rounds.length - 1 ? 'Receber a chave' : 'Próximo desafio';
    help.disabled = true;
  }

  function solve() {
    if (!canInteract() || state().solved) return;
    state().solved = true;
    cancelTimers();
    markSolved();
    sound('success');
    next.focus();
  }

  function updateProgress(reward = false) {
    const total = region().rounds.length;
    const amount = reward ? total : state().round + Number(state().solved);
    $('#puzzle-round').textContent = reward ? `${total} desafios resolvidos` : `Desafio ${state().round + 1} de ${total}`;
    const bar = $('#puzzle-progress');
    if (bar) {
      bar.max = total;
      bar.value = amount;
      bar.textContent = `${amount} de ${total} desafios resolvidos`;
      bar.setAttribute('aria-label', `${amount} de ${total} desafios resolvidos`);
    }
  }

  function renderReward() {
    cancelTimers();
    board.replaceChildren();
    controls.replaceChildren();
    screen.dataset.state = 'reward';
    instruction.textContent = 'Esta chave é sua! Volte para a ilha e continue a aventura.';
    hint.hidden = true;
    hint.textContent = '';
    help.hidden = true;
    help.setAttribute('aria-expanded', 'false');
    next.hidden = true;
    const reward = element('div', 'puzzle-reward');
    const image = element('img', 'puzzle-reward-key');
    image.src = region().key;
    image.alt = region().keyName;
    reward.appendChild(image);
    reward.appendChild(element('h2', '', `${region().keyName} conquistada!`));
    reward.appendChild(element('p', 'puzzle-reward-copy', region().reward));
    board.appendChild(reward);
    controls.appendChild(button('Jogar os desafios de novo', 'replay-region', () => {
      const current = state();
      current.round = 0;
      current.solved = false;
      current.replaying = true;
      current.entered = [];
      current.demoSeen = false;
      current.rotation = region().rounds[0].start || 0;
      $('#puzzle-key-label').textContent = `${region().keyName} já conquistada — pratique à vontade!`;
      renderRound();
      title.focus();
    }, 'puzzle-action puzzle-replay'));
    setFeedback('Chave guardada! Você pode voltar à ilha ou brincar novamente.', true);
    $('#puzzle-key-label').textContent = `${region().keyName} conquistada!`;
    updateProgress(true);
    back.focus();
  }

  function renderRound() {
    cancelTimers();
    board.replaceChildren();
    controls.replaceChildren();
    screen.dataset.state = 'playing';
    help.hidden = false;
    help.disabled = false;
    hint.hidden = true;
    hint.textContent = '';
    help.setAttribute('aria-expanded', 'false');
    next.hidden = true;
    setFeedback('Resolva no seu tempo. A dica está aqui se você precisar.');
    updateProgress();
    if (region().kind === 'sequence') renderSequence();
    else if (region().kind === 'rotation') renderRotation();
    else renderNumbers();
    if (state().solved) markSolved();
  }

  function advance() {
    if (!canInteract() || !state().solved) return;
    const current = state();
    if (current.round < region().rounds.length - 1) {
      current.round++;
      current.solved = false;
      current.entered = [];
      current.demoSeen = false;
      current.rotation = round().start || 0;
      renderRound();
      title.focus();
      return;
    }
    const firstCompletion = !current.completed;
    const completedId = regionId;
    current.completed = true;
    current.replaying = false;
    if (firstCompletion && typeof callbacks.onComplete === 'function') callbacks.onComplete(completedId);
    // A integração pode encerrar a tela dentro do callback. Não renderizar após isso.
    if (active && regionId === completedId) renderReward();
  }

  function open(id, options = {}) {
    if (!PuzzleData.regions[id]) return false;
    stop();
    regionId = id;
    if (id === 'geometria') window.GameAudio?.playGeometryMusic?.();
    window.Music?.definirLugar?.(id);
    callbacks = options;
    active = true;
    if (!progress.has(id)) {
      progress.set(id, {
        round: 0, solved: false, completed: false, replaying: false,
        entered: [], demoSeen: false, interrupted: false,
        rotation: PuzzleData.regions[id].rounds[0].start || 0
      });
    }
    screen.hidden = false;
    screen.dataset.region = id;
    screen.dataset.kind = region().kind;
    title.textContent = region().title;
    title.setAttribute('tabindex', '-1');
    $('#puzzle-region').textContent = region().name;
    $('#puzzle-key').src = region().key;
    $('#puzzle-key').alt = region().keyName;
    $('#puzzle-key-label').textContent = state().completed ? `${region().keyName} já conquistada — pratique à vontade!` : `Sua recompensa: ${region().keyName}`;
    $('#puzzle-scene').src = region().scene;
    $('#puzzle-caption').textContent = region().caption;
    if (state().completed && !state().replaying) renderReward();
    else {
      renderRound();
      title.focus();
    }
    return true;
  }

  function stop() {
    if (regionId === 'geometria') window.GameAudio?.stopGeometryMusic?.();
    if (window.GameIsland?.active) window.Music?.definirLugar?.('exploracao');
    else window.Music?.definirLugar?.('menu');
    if (active && observing && region().kind === 'sequence') {
      state().demoSeen = false;
      state().interrupted = true;
      state().entered = [];
    }
    cancelTimers();
    active = false;
    callbacks = {};
    screen.hidden = true;
    watch = null;
    trail = null;
    confirmSequence = null;
    replaySequence = null;
    tokenButtons = [];
    piece = null;
    rotationLabel = null;
  }

  function exit() {
    if (!canInteract()) return;
    const onExit = callbacks.onExit;
    stop();
    if (typeof onExit === 'function') onExit();
  }

  help.addEventListener('click', () => {
    if (!canInteract() || state().solved || state().completed && !state().replaying) return;
    hint.textContent = round().hint;
    hint.hidden = !hint.hidden;
    help.setAttribute('aria-expanded', `${!hint.hidden}`);
  });
  next.addEventListener('click', advance);
  back.addEventListener('click', exit);
  document.addEventListener('keydown', event => {
    if (!canInteract() || event.ctrlKey || event.altKey || event.metaKey) return;
    const key = event.key.toLowerCase();
    if (key === 'escape') {
      event.preventDefault();
      if (!event.repeat) exit();
    } else if (region().kind === 'rotation' && screen.dataset.state === 'playing' && (key === 'arrowleft' || key === 'arrowright')) {
      event.preventDefault();
      if (!event.repeat) rotate(key === 'arrowleft' ? -90 : 90);
    }
  });
  window.addEventListener('blur', interruptDemo);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) interruptDemo();
  });

  return {open, stop, get active() {return active;}};
})();
