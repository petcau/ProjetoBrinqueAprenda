/* Ciclo de exploração, câmera, teclado, controles de toque e diálogos. */
window.GameIsland = (() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const screen = $('#island-screen'), canvas = $('#island-canvas');
  const world = IslandWorld.create();
  const renderer = IslandRenderer.create(canvas, $('#island-minimap'), $('#island-map'), world);
  const INV_SQRT2 = 1 / Math.SQRT2;
  const DIRS = ['down', 'left', 'right', 'up', 'down-left', 'down-right', 'up-left', 'up-right'];
  const DIRS_PT = ['baixo', 'esquerda', 'direita', 'cima', 'baixo-esq', 'baixo-dir', 'cima-esq', 'cima-dir'];
  const DX = [0, -1, 1, 0, -1, 1, -1, 1];
  const DY = [1, 0, 0, -1, 1, 1, -1, -1];
  const ROW_TO_SECTOR = [6, 4, 0, 2, 5, 7, 3, 1];
  const player = {
    ...world.spawn,
    facing: 'down',
    dir: 0,
    row: 0,
    sector: 6,
    moving: false,
    inStep: false,
    animTime: 0,
    frame: HeroAnimation.IDLE,
    steps: 0,
    idle: 0,
    prog: 0,
    dur: 0,
    walk: 0,
    turn: 0,
    was: false,
    fromX: 0,
    fromY: 0,
    toX: 0,
    toY: 0,
    intentName: '(nenhuma)',
    switchesPerSec: 0
  }, camera = { x: 0, y: 0 };
  const dev = world.devScreen = window.DevPuzzleScreen?.create(canvas, world, clearInput);
  const visited = new Set(['center']), pointers = new Map();
  const heldCodes = new Set();
  const touchWalkHeld = new Set();
  const transitionHistory = [];
  const wasdOrder = [];
  const arrowOrder = [];
  const touchWalkOrder = [];
  let lastInputSource = null;
  let releaseGraceTicks = 0;
  let lastDiagonalDir = null;
  let joystickActive = false;
  let joystickSector = null;
  const SECTOR_TO_DIR = [2, 7, 3, 6, 1, 4, 0, 5];
  const MOVEMENT_CODES = new Set([
    'KeyW', 'KeyA', 'KeyS', 'KeyD',
    'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'
  ]);
  const KEY_FALLBACK_TO_CODE = {
    w: 'KeyW', a: 'KeyA', s: 'KeyS', d: 'KeyD',
    arrowup: 'ArrowUp', arrowleft: 'ArrowLeft', arrowdown: 'ArrowDown', arrowright: 'ArrowRight'
  };
  const info = $('#island-info-dialog'), pause = $('#island-pause-dialog'), map = $('#island-map-dialog');
  const dialogs = Array.from(document.querySelectorAll('dialog'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Preferências do livro de configurações: "Menos animações" e velocidade da caminhada.
  const calmMotion = () => reducedMotion.matches || Boolean(window.GameSettings?.calm);
  // Devagar 16, Normal 12, Rápido 8 ticks por passo (fatores em game-settings.js).
  const ticksPerTile = () => Math.round(TICKS_PER_TILE / (window.GameSettings?.walkSpeed || 1));
  const TICK_MS = 1000 / TICK_HZ;
  let active = false, loaded = false, frame = 0, lastTime = 0, acc = 0, near = null, currentRegion = 'center', dialogTrigger = null, foundCat = false, titleTimer = null, initialTitleShown = false, regionCandidate = null, regionCandidateMs = 0;
  const inChallenge = () => Boolean(window.PuzzleGame?.active || window.GameRescue?.active);
  const blocked = () => !loaded || document.hidden || inChallenge() || dev?.active || dialogs.some(dialog => dialog.open);
  function updateProgress() {
    const progress = window.AdventureProgress;
    if (!progress) return;
    $('#island-key-count').textContent = `${progress.keyCount} de 4 chaves`;
    for (const region of progress.regions) {
      const slot = $(`#island-key-${region}`), owned = progress.hasKey(region);
      slot.dataset.owned = String(owned);
      slot.setAttribute('aria-label', `${slot.dataset.keyName}: ${owned ? 'conquistada' : 'a encontrar'}`);
    }
    world.unlockedLocks = progress.regions.filter(id => progress.isUnlocked(id));
    world.catRescued = progress.rescued;
    $('#island-objective').textContent = progress.rescued ? 'Você libertou seu gato! A ilha continua aberta para explorar.' : progress.keyCount === 4 ? 'Você tem as quatro chaves! Volte à montanha para libertar seu gato.' : foundCat ? `Seu gato espera na montanha. Conquiste as chaves: ${progress.keyCount} de 4.` : 'Conquiste as quatro chaves e encontre seu gato na montanha.';
    near = null; updateNearby();
  }
  function returnFromChallenge(trigger) {
    if (!active) return;
    clearInput(); screen.hidden = false; renderer.resize(); updateCamera(true); lastTime = 0;
    updateProgress(); (trigger || canvas).focus();
  }
  function angleDiff(a, b) {
    let d = (a - b + 180) % 360 - 180;
    return d < -180 ? d + 360 : d;
  }

  function resolveJoystickDir(vx, vy) {
    const mag = Math.hypot(vx, vy);
    if (!joystickActive) {
      if (mag < 0.25) return null;
      joystickActive = true;
    } else {
      if (mag < 0.20) {
        joystickActive = false;
        joystickSector = null;
        return null;
      }
    }

    let deg = (Math.atan2(-vy, vx) * 180 / Math.PI) % 360;
    if (deg < 0) deg += 360;

    if (typeof WalkAnimation !== 'undefined') {
      joystickSector = WalkAnimation.sectorFromVector(vx, vy, joystickSector, 6);
      return WalkAnimation.rowFromSector(joystickSector);
    }

    if (joystickSector !== null) {
      const center = joystickSector * 45;
      if (Math.abs(angleDiff(deg, center)) <= 28.5) {
        return SECTOR_TO_DIR[joystickSector];
      }
    }

    joystickSector = Math.round(deg / 45) % 8;
    return SECTOR_TO_DIR[joystickSector];
  }

  let cmdStartX = 0, cmdStartY = 0;
  function recordCommandStart() {
    cmdStartX = player.x;
    cmdStartY = player.y;
    player.distSinceCommand = 0;
  }

  function recordDirectionSwitch() {
    const now = performance.now();
    transitionHistory.push(now);
    while (transitionHistory.length > 0 && now - transitionHistory[0] > 1000) {
      transitionHistory.shift();
    }
    player.switchesPerSec = transitionHistory.length;
  }

  function updateSwitchesPerSec() {
    const now = performance.now();
    while (transitionHistory.length > 0 && now - transitionHistory[0] > 1000) {
      transitionHistory.shift();
    }
    player.switchesPerSec = transitionHistory.length;
  }

  function clearInput() {
    joystickSector = null;
    joystickActive = false;
    wasdOrder.length = 0;
    arrowOrder.length = 0;
    touchWalkOrder.length = 0;
    lastInputSource = null;
    releaseGraceTicks = 0;
    lastDiagonalDir = null;
    heldCodes.clear();
    touchWalkHeld.clear();
    pointers.clear();
    resetJoystick();
    // Para no ponto atual do passo: o mapa não é uma grade fixa, então não há salto.
    Object.assign(player, { moving: false, inStep: false, animTime: 0, prog: 0, walk: 0, turn: 0, was: false, steps: 0, idle: 0, frame: 0, intentName: '(nenhuma)' });
  }

  function readGamepadInput() {
    if (typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function') {
      const gamepads = navigator.getGamepads();
      if (gamepads) {
        for (let i = 0; i < gamepads.length; i++) {
          const gp = gamepads[i];
          if (!gp) continue;
          const up = gp.buttons[12]?.pressed;
          const down = gp.buttons[13]?.pressed;
          const left = gp.buttons[14]?.pressed;
          const right = gp.buttons[15]?.pressed;
          if (up || down || left || right) {
            if (up) return { dir: 3, ix: 0, iy: -1, name: 'Gamepad D-Pad ↑' };
            if (down) return { dir: 0, ix: 0, iy: 1, name: 'Gamepad D-Pad ↓' };
            if (left) return { dir: 1, ix: -1, iy: 0, name: 'Gamepad D-Pad ←' };
            if (right) return { dir: 2, ix: 1, iy: 0, name: 'Gamepad D-Pad →' };
          }
          if (gp.axes && gp.axes.length >= 2) {
            const ax = gp.axes[0], ay = gp.axes[1];
            const joyDir = resolveJoystickDir(ax, ay);
            if (joyDir !== null) {
              return { dir: joyDir, ix: DX[joyDir], iy: DY[joyDir], name: `Gamepad Analógico ${DIRS_PT[joyDir]}` };
            }
          }
        }
      }
    }
    return null;
  }

  function computeRawIntent() {
    // 1. Joystick analógico / touch ou gamepad: se ativo fora da zona morta, define a intenção
    for (const value of pointers.values()) {
      if (!value || (!value.x && !value.y)) continue;
      const joyDir = resolveJoystickDir(value.x, value.y);
      if (joyDir !== null) {
        return { dir: joyDir, ix: DX[joyDir], iy: DY[joyDir], name: `Joystick ${DIRS_PT[joyDir]}` };
      }
    }
    const gpIntent = readGamepadInput();
    if (gpIntent) return gpIntent;

    // 2. Setas do teclado: SOMENTE 4 direções, nunca diagonal; última pressionada manda
    if (arrowOrder.length > 0 && (wasdOrder.length === 0 || lastInputSource === 'arrow')) {
      const lastArrow = arrowOrder[arrowOrder.length - 1];
      if (lastArrow === 'ArrowUp') return { dir: 3, ix: 0, iy: -1, name: '↑' };
      if (lastArrow === 'ArrowDown') return { dir: 0, ix: 0, iy: 1, name: '↓' };
      if (lastArrow === 'ArrowLeft') return { dir: 1, ix: -1, iy: 0, name: '←' };
      if (lastArrow === 'ArrowRight') return { dir: 2, ix: 1, iy: 0, name: '→' };
    }

    // 3. Teclado WASD: diagonais suportadas; teclas opostas resolvem pela última pressionada no eixo
    if (wasdOrder.length > 0) {
      let ix = 0, iy = 0;
      for (let i = wasdOrder.length - 1; i >= 0; i--) {
        const code = wasdOrder[i];
        if (ix === 0 && code === 'KeyA') ix = -1;
        if (ix === 0 && code === 'KeyD') ix = 1;
        if (iy === 0 && code === 'KeyW') iy = -1;
        if (iy === 0 && code === 'KeyS') iy = 1;
      }
      const keys = [];
      if (wasdOrder.includes('KeyW')) keys.push('W');
      if (wasdOrder.includes('KeyA')) keys.push('A');
      if (wasdOrder.includes('KeyS')) keys.push('S');
      if (wasdOrder.includes('KeyD')) keys.push('D');
      const name = keys.join('+');

      if (ix === 0 && iy > 0) return { dir: 0, ix, iy, name }; // baixo
      if (ix < 0 && iy === 0) return { dir: 1, ix, iy, name }; // esquerda
      if (ix > 0 && iy === 0) return { dir: 2, ix, iy, name }; // direita
      if (ix === 0 && iy < 0) return { dir: 3, ix, iy, name }; // cima
      if (ix < 0 && iy > 0) return { dir: 4, ix, iy, name };   // baixo-esq
      if (ix > 0 && iy > 0) return { dir: 5, ix, iy, name };   // baixo-dir
      if (ix < 0 && iy < 0) return { dir: 6, ix, iy, name };   // cima-esq
      if (ix > 0 && iy < 0) return { dir: 7, ix, iy, name };   // cima-dir
      return { dir: null, ix: 0, iy: 0, name: '(nenhuma)' };
    }

    // 4. Direcional tátil (data-walk): SOMENTE 4 direções, última pressionada
    if (touchWalkOrder.length > 0) {
      const lastTouch = touchWalkOrder[touchWalkOrder.length - 1];
      if (lastTouch === 'up') return { dir: 3, ix: 0, iy: -1, name: 'Toque ↑' };
      if (lastTouch === 'down') return { dir: 0, ix: 0, iy: 1, name: 'Toque ↓' };
      if (lastTouch === 'left') return { dir: 1, ix: -1, iy: 0, name: 'Toque ←' };
      if (lastTouch === 'right') return { dir: 2, ix: 1, iy: 0, name: 'Toque →' };
    }

    return { dir: null, ix: 0, iy: 0, name: '(nenhuma)' };
  }

  function computeIntent() {
    const raw = computeRawIntent();
    const rawDir = raw.dir;

    // Se o vetor atual é diagonal, renova o registro da diagonal e zera a tolerância
    if (rawDir !== null && rawDir >= 4) {
      releaseGraceTicks = 0;
      lastDiagonalDir = rawDir;
      return raw;
    }

    // Tolerância ao soltar teclas: se a personagem andava na diagonal e uma tecla foi solta (passou para reta),
    // espera 3 ticks (~50 ms) antes de assumir a direção reta.
    if (rawDir !== null && rawDir < 4) {
      if (lastDiagonalDir !== null && player.was) {
        releaseGraceTicks++;
        if (releaseGraceTicks < 3) {
          return { dir: lastDiagonalDir, ix: DX[lastDiagonalDir], iy: DY[lastDiagonalDir], name: raw.name };
        }
      }
      lastDiagonalDir = null;
      releaseGraceTicks = 0;
      return raw;
    }

    // rawDir === null (teclas soltas): para na última direção
    lastDiagonalDir = null;
    releaseGraceTicks = 0;
    return raw;
  }

  // Procura o passo: inteiro se livre; senão contorna cantos de lado; senão anda até a parede.
  function pathFree(x0, y0, x1, y1) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    for (let i = 1; i <= n; i++) if (!IslandWorld.isWalkable(world, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n)) return false;
    return true;
  }

  function findStep(dir) {
    const { x, y } = player;
    if (dir < 4) {
      const dx = DX[dir], dy = DY[dir];
      if (pathFree(x, y, x + dx * STEP_TILE, y + dy * STEP_TILE)) return { x: x + dx * STEP_TILE, y: y + dy * STEP_TILE, len: 1, isDiag: false };
      const px = -dy, py = dx;
      for (const s of [1, -1]) {
        const lx = x + px * s, ly = y + py * s;
        if (pathFree(x, y, lx, ly) && pathFree(lx, ly, lx + dx * STEP_TILE, ly + dy * STEP_TILE)) return { x: lx + dx * STEP_TILE, y: ly + dy * STEP_TILE, len: 1, isDiag: false };
      }
      let free = 0; while (free < STEP_TILE && IslandWorld.isWalkable(world, x + dx * (free + 1), y + dy * (free + 1))) free++;
      return free >= 1 ? { x: x + dx * free, y: y + dy * free, len: free / STEP_TILE, isDiag: false } : null;
    }

    // Movimento em diagonal
    const signX = DX[dir], signY = DY[dir];
    const stepX = signX * STEP_TILE, stepY = signY * STEP_TILE;

    // Prevenção de corte de quina: as duas células vizinhas e o ponto final precisam estar livres
    const xFree = pathFree(x, y, x + stepX, y);
    const yFree = pathFree(x, y, x, y + stepY);
    const diagFree = pathFree(x, y, x + stepX, y + stepY);

    if (xFree && yFree && diagFree) {
      return { x: x + stepX, y: y + stepY, len: 1, isDiag: true };
    }

    // Diagonal bloqueada: deslize pelo eixo livre (resolvendo X e Y separadamente), sem cortar quina
    if (xFree && !yFree) {
      return { x: x + stepX, y, len: 1, isDiag: false };
    }
    if (yFree && !xFree) {
      return { x, y: y + stepY, len: 1, isDiag: false };
    }

    return null;
  }

  const calcStepDur = (step) => {
    const base = step.isDiag ? (typeof TICKS_PER_DIAGONAL !== 'undefined' ? TICKS_PER_DIAGONAL : 24) : TICKS_PER_TILE;
    return Math.max(1, Math.round(base / (window.GameSettings?.walkSpeed || 1) * step.len));
  };

  // Um tick de 1/60 s: direção derivada puramente do estado da entrada no tick atual.
  function advance(want) {
    const p = player;

    // Caso 1: Sem intenção de movimento (teclas soltas / joystick na zona morta)
    if (want === null) {
      if (!p.inStep) {
        p.walk = 0;
        p.was = false;
        p.turn = 0;
        p.steps = 0;
        p.idle++;
        return;
      }
      p.prog++;
      p.walk++;
      const t = Math.min(1, p.prog / p.dur);
      p.x = p.fromX + (p.toX - p.fromX) * t;
      p.y = p.fromY + (p.toY - p.fromY) * t;
      return;
    }

    p.idle = 0;

    // Caso 2: Em repouso absoluto (!p.inStep && !p.was) - toque rápido só vira
    if (!p.inStep && !p.was) {
      if (want !== p.dir) {
        p.dir = want;
        p.row = want;
        p.facing = DIRS[want];
        p.sector = ROW_TO_SECTOR[want];
        p.turn = TURN_TICKS;
        p.walk = 0;
        recordDirectionSwitch();
        recordCommandStart();
        return;
      }
      if (p.turn > 0) {
        p.turn--;
        if (p.turn > 0) return;
      }
      p.dir = want;
      p.row = want;
      p.facing = DIRS[want];
      p.sector = ROW_TO_SECTOR[want];
      const step = findStep(want);
      if (!step) { p.walk++; p.was = true; return; }
      Object.assign(p, {
        inStep: true,
        prog: 0,
        dur: calcStepDur(step),
        fromX: p.x,
        fromY: p.y,
        toX: step.x,
        toY: step.y
      });
      recordCommandStart();
    }
    // Caso 3: Mudança de direção enquanto já está em movimento
    // Troca IMEDIATA: não completa mais o passo longo na direção antiga!
    else if (want !== p.dir) {
      p.dir = want;
      p.row = want;
      p.facing = DIRS[want];
      p.sector = ROW_TO_SECTOR[want];
      p.turn = 0;
      recordDirectionSwitch();
      recordCommandStart();

      const step = findStep(want);
      if (!step) {
        p.inStep = false;
        p.walk++;
        p.was = true;
        return;
      }
      Object.assign(p, {
        inStep: true,
        prog: 0,
        dur: calcStepDur(step),
        fromX: p.x,
        fromY: p.y,
        toX: step.x,
        toY: step.y
      });
    }
    // Caso 4: Continua na mesma direção
    else if (!p.inStep) {
      const step = findStep(want);
      if (!step) { p.walk++; p.was = true; return; }
      Object.assign(p, {
        inStep: true,
        prog: 0,
        dur: calcStepDur(step),
        fromX: p.x,
        fromY: p.y,
        toX: step.x,
        toY: step.y
      });
    }

    p.prog++;
    p.walk++;
    p.was = true;
    const t = Math.min(1, p.prog / p.dur);
    p.x = p.fromX + (p.toX - p.fromX) * t;
    p.y = p.fromY + (p.toY - p.fromY) * t;
  }

  function tick() {
    if (world.spawnPending) { Object.assign(player, world.spawn); world.spawnPending = false; }
    updateSwitchesPerSec();
    const intent = computeIntent();
    player.intentName = intent.name;
    const isMoving = intent.dir !== null;
    player.moving = isMoving;
    if (isMoving) {
      player.dir = intent.dir;
      player.row = intent.dir;
      player.facing = DIRS[intent.dir];
      player.sector = ROW_TO_SECTOR[intent.dir];
    }
    advance(intent.dir);
    const p = player;
    p.frame = HeroAnimation.column(p, calmMotion());
    if (p.inStep && p.prog >= p.dur) {
      p.x = p.toX;
      p.y = p.toY;
      p.inStep = false;
      p.prog = 0;
      p.steps++;
    }
    p.distSinceCommand = Math.hypot(p.x - cmdStartX, p.y - cmdStartY);
    p.speed = p.moving ? (p.inStep && p.dur > 0 ? (Math.hypot(p.toX - p.fromX, p.toY - p.fromY) / (p.dur * TICK_MS / 1000)) : (STEP_TILE / (TICKS_PER_TILE * TICK_MS / 1000))) : 0;
  }

  function resetJoystick() {
    joystickSector = null;
    const stick = $('#joystick-stick'), joystick = $('#island-joystick');
    if (stick) stick.style.transform = 'translate(-50%,-50%)';
    if (joystick) joystick.classList.remove('is-active');
  }
  function updateCamera(snap, dt = 0) {
    const tx = Math.max(0, Math.min(world.width - renderer.width, player.x - renderer.width / 2));
    const ty = Math.max(0, Math.min(world.height - renderer.height, player.y - renderer.height * .58));
    const follow = snap || calmMotion() ? 1 : 1 - Math.exp(-dt * 10);
    camera.x += (tx - camera.x) * follow; camera.y += (ty - camera.y) * follow;
    camera.x = Math.max(0, Math.min(Math.max(0, world.width - renderer.width), camera.x));
    camera.y = Math.max(0, Math.min(Math.max(0, world.height - renderer.height), camera.y));
  }
  function showRegionTitle(name) {
    const place = document.querySelector('.island-place');
    const titleEl = document.querySelector('#island-region');
    if (!place || !titleEl) return;
    if (titleTimer) {
      clearTimeout(titleTimer);
      titleTimer = null;
    }
    titleEl.textContent = name;
    place.classList.add('is-visible');
    titleTimer = setTimeout(() => {
      place.classList.remove('is-visible');
      titleTimer = null;
    }, 5000);
  }
  function commitRegion(region) {
    if (!region || region.id === currentRegion) return;
    currentRegion = region.id;
    if (!visited.has(region.id)) {
      visited.add(region.id);
      const disc = $('#island-discovery');
      if (disc) disc.textContent = `${visited.size} de 6 lugares descobertos`;
      const ann = $('#island-announcement');
      if (ann) ann.textContent = `Você descobriu: ${region.name}. ${visited.size} de 6 lugares.`;
    } else {
      const ann = $('#island-announcement');
      if (ann) ann.textContent = region.name;
    }
    showRegionTitle(region.name);
  }
  function updateLocation(elapsed = 0) {
    const imgX = player.x / WORLD_SCALE, imgY = player.y / WORLD_SCALE;
    const raw = (typeof getRawIslandRegion === 'function')
      ? getRawIslandRegion(imgX, imgY)
      : IslandWorld.regionAt(player.x, player.y);

    if (!raw) {
      regionCandidate = null;
      regionCandidateMs = 0;
      return;
    }

    if (raw.id === currentRegion) {
      regionCandidate = null;
      regionCandidateMs = 0;
      return;
    }

    const dist = (typeof getIslandZoneDistance === 'function')
      ? getIslandZoneDistance(raw, imgX, imgY)
      : 24;

    if (dist >= 24) {
      commitRegion(raw);
      regionCandidate = null;
      regionCandidateMs = 0;
      return;
    }

    if (regionCandidate && regionCandidate.id === raw.id) {
      regionCandidateMs += (elapsed || TICK_MS);
      if (regionCandidateMs >= 150) {
        commitRegion(raw);
        regionCandidate = null;
        regionCandidateMs = 0;
      }
    } else {
      regionCandidate = raw;
      regionCandidateMs = (elapsed || TICK_MS);
    }
  }
  function updateNearby() {
    const key = window.IslandKeys?.nearest(world, player);
    if (key) { world.mountainNearby = false; near = key; $('#island-interact').disabled = false; $('#island-interact-label').textContent = ''; return; }
    const next = world.points.filter(point => Math.hypot(point.x - player.x, point.y - player.y) < (point.radius || 112)).sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))[0] || null;
    world.mountainNearby = next?.id === 'montanha';
    if (next === near) return;
    near = next; $('#island-interact').disabled = !near;
    $('#island-interact-label').textContent = near ? near.action : 'Aproxime-se de uma placa';
    if (near) $('#island-announcement').textContent = `${near.action}. Aperte E ou use o botão Interagir.`;
  }
  function loop(time) {
    if (!active) return;
    if (inChallenge()) { clearInput(); lastTime = 0; frame = requestAnimationFrame(loop); return; }
    const elapsed = lastTime ? Math.min(time - lastTime, 100) : 0, dt = elapsed / 1000; lastTime = time;
    if (blocked()) { clearInput(); acc = 0; }
    else {
      // Passo fixo: a lógica roda exatamente 60 vezes por segundo, qualquer que seja a taxa da tela.
      acc += elapsed;
      while (acc >= TICK_MS - 1e-6) { tick(); acc -= TICK_MS; } // 1e-6 absorve o arredondamento de 1000/60
      updateLocation(elapsed); updateNearby();
    }
    if (player.moving) {
      player.animTime = (player.animTime || 0) + dt;
    } else {
      player.animTime = 0;
    }
    player.frame = HeroAnimation.column(player, calmMotion());
    updateCamera(false, dt); renderer.draw(player, camera, near, time, calmMotion(), visited);
    if (loaded) window.preloadPuzzles?.(() => active && !blocked());
    frame = requestAnimationFrame(loop);
  }
  function start() {
    if (active) return;
    active = true; $('#home-screen').hidden = true; screen.hidden = false; document.body.classList.add('is-playing'); screen.dataset.touchMode = GameSettings.touch;
    renderer.resize(); updateCamera(true); updateNearby(); updateProgress(); lastTime = 0; canvas.focus(); frame = requestAnimationFrame(loop);
    if (!initialTitleShown) {
      initialTitleShown = true;
      const initialRegion = (typeof getIslandRegion === 'function')
        ? getIslandRegion(player.x / WORLD_SCALE, player.y / WORLD_SCALE, 'center')
        : { id: 'center', name: 'Praça do Portal' };
      currentRegion = initialRegion.id;
      showRegionTitle(initialRegion.name);
      const ann = $('#island-announcement');
      if (ann) ann.textContent = initialRegion.name;
    }
    window.Music?.definirLugar?.('exploracao');
  }
  function stop() {
    dev?.close();
    if (titleTimer) {
      clearTimeout(titleTimer);
      titleTimer = null;
    }
    const place = document.querySelector('.island-place');
    if (place) place.classList.remove('is-visible');
    regionCandidate = null;
    regionCandidateMs = 0;
    active = false; cancelAnimationFrame(frame); clearInput(); lastTime = 0;
    window.PuzzleGame?.stop(); window.GameRescue?.stop();
    for (const dialog of [info, pause, map]) if (dialog.open) dialog.close();
    screen.hidden = true; $('#home-screen').hidden = false; document.body.classList.remove('is-playing');
    window.Music?.definirLugar?.('menu');
    document.querySelector('[data-open="start"]').focus();
  }
  function showDialog(dialog, trigger) {
    if (!active || blocked()) return;
    clearInput(); dialogTrigger = trigger || canvas;
    GameAudio.click(); dialog.showModal();
  }
  function interact(trigger) {
    if (active && !blocked()) updateNearby();
    const key = window.IslandKeys?.nearest(world, player);
    if (key && active && !blocked()) {
      const load = window.PuzzleScenes?.[key.id];
      if (!load) { dev.open(key); return; }
      dev.openScene(key, load, {
        debug: () => renderer.debug, toggleDebug: () => renderer.toggleDebug(), onExit: won => {
          if (won && key.id === 'logica') {
            if (window.AdventureProgress) AdventureProgress.award('forest');
            world.keyState.keys.logica = true; player.x = 630 * WORLD_SCALE; player.y = 650 * WORLD_SCALE;
            updateProgress(); updateCamera(true); $('#island-announcement').textContent = 'Chave da Memória conquistada!';
          }
        }
      });
      return;
    }
    if (!near || !active || blocked()) return;
    if (window.AdventureProgress?.regions.includes(near.id) && window.PuzzleGame) {
      const region = near.id;
      clearInput(); screen.hidden = true; GameAudio.click();
      window.PuzzleGame.open(region, {
        onComplete(id) {
          if (AdventureProgress.award(id)) {
            updateProgress(); $('#island-announcement').textContent = `Chave conquistada! Você tem ${AdventureProgress.keyCount} de 4 chaves.`;
          }
        },
        onExit() { returnFromChallenge(trigger); }
      });
      return;
    }
    if (near.id === 'montanha') {
      const state = world.keyState ||= { keys: {} }, missing = KEYS.filter(k => !state.keys[k.id]).length;
      if (missing) { const message = `A cela tem 4 cadeados! Faltam ${missing} chaves.`; dev.announce(message); $('#island-announcement').textContent = message; return; }
      foundCat = true;
      const load = window.PuzzleScenes?.montanha;
      if (!load) { dev.open(near); return; }
      dev.openScene(near, load, {
        state, debug: () => renderer.debug, toggleDebug: () => renderer.toggleDebug(), onExit: (_won, message) => {
          if (message) { dev.announce(message); $('#island-announcement').textContent = message; }
        }
      });
      return;
    }
    $('#island-info-title').textContent = near.title; $('#island-info-chapter').textContent = near.chapter;
    $('#island-info-copy').textContent = near.text; $('#island-info-note').textContent = near.note;
    showDialog(info, trigger);
  }
  function openMap(trigger) {
    if (!active || blocked()) return;
    renderer.renderOverview(player, camera, visited, true); showDialog(map, trigger);
  }
  const interactBtn = $('#island-interact');
  if (interactBtn) {
    interactBtn.addEventListener('click', event => interact(event.currentTarget));
    interactBtn.addEventListener('pointerdown', () => interactBtn.classList.add('is-pressed'));
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) interactBtn.addEventListener(type, () => interactBtn.classList.remove('is-pressed'));
  }
  // Pausa (Esc) e mapa (M) seguem pelo teclado; os botões são opcionais no HUD imersivo.
  $('#island-pause-button')?.addEventListener('click', event => showDialog(pause, event.currentTarget));
  $('#island-map-button')?.addEventListener('click', event => openMap(event.currentTarget));
  $('#island-minimap-button').addEventListener('click', event => openMap(event.currentTarget));
  $('#island-return-menu').addEventListener('click', stop);
  for (const dialog of [info, pause, map]) {
    dialog.addEventListener('close', () => { clearInput(); if (active) (dialogTrigger || canvas).focus(); });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
  }
  document.addEventListener('keydown', event => {
    if (!active || event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey) return;
    const key = event.key.toLowerCase();
    if (key === 'k' && renderer.debug && !event.repeat && !blocked()) {
      event.preventDefault(); window.IslandKeys?.reset(world); updateNearby(); return;
    }
    if (dev?.input(event)) return;
    if (blocked()) return;
    if (key === 'u' && renderer.debug && !event.repeat) {
      event.preventDefault(); world.keyState ||= { keys: {} };
      for (const id of ['logica', 'algebra', 'geometria', 'operacoes']) world.keyState.keys[id] = true;
      for (const id of window.AdventureProgress?.regions || []) AdventureProgress.award(id);
      updateProgress(); dev.announce('[DEV] As 4 chaves foram concedidas.'); return;
    }
    const code = event.code || KEY_FALLBACK_TO_CODE[key];
    if (code && MOVEMENT_CODES.has(code)) {
      event.preventDefault();
      if (!event.repeat) {
        heldCodes.add(code);
        if (code.startsWith('Key')) {
          const idx = wasdOrder.indexOf(code);
          if (idx !== -1) wasdOrder.splice(idx, 1);
          wasdOrder.push(code);
          lastInputSource = 'wasd';
        } else if (code.startsWith('Arrow')) {
          const idx = arrowOrder.indexOf(code);
          if (idx !== -1) arrowOrder.splice(idx, 1);
          arrowOrder.push(code);
          lastInputSource = 'arrow';
        }
      }
    }
    else if (key === 'e') { event.preventDefault(); if (!event.repeat) interact(); }
    else if (key === 'm') { event.preventDefault(); if (!event.repeat) openMap(); }
    else if (key === 'f3') { event.preventDefault(); if (!event.repeat) renderer.toggleDebug(); }
    else if (key === 'escape') { event.preventDefault(); if (!event.repeat) showDialog(pause); }
  });
  document.addEventListener('keyup', event => {
    const key = event.key.toLowerCase();
    const code = event.code || KEY_FALLBACK_TO_CODE[key];
    if (code) {
      heldCodes.delete(code);
      if (code.startsWith('Key')) {
        const idx = wasdOrder.indexOf(code);
        if (idx !== -1) wasdOrder.splice(idx, 1);
      } else if (code.startsWith('Arrow')) {
        const idx = arrowOrder.indexOf(code);
        if (idx !== -1) arrowOrder.splice(idx, 1);
      }
    }
  });
  // Direcional por toque (data-walk): multitoque para diagonais combinando botões
  document.querySelectorAll('[data-walk]').forEach(button => {
    const dirName = button.dataset.walk;
    button.addEventListener('pointerdown', event => {
      if (!active || blocked()) return;
      event.preventDefault(); button.focus(); button.classList.add('is-pressed');
      button.setPointerCapture(event.pointerId);
      touchWalkHeld.add(dirName);
      const idx = touchWalkOrder.indexOf(dirName);
      if (idx !== -1) touchWalkOrder.splice(idx, 1);
      touchWalkOrder.push(dirName);
      lastInputSource = 'touch';
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, () => {
      button.classList.remove('is-pressed');
      touchWalkHeld.delete(dirName);
      const idx = touchWalkOrder.indexOf(dirName);
      if (idx !== -1) touchWalkOrder.splice(idx, 1);
    });
    // Enter/Espaço no botão: segura o tempo de virar e dar um passo.
    button.addEventListener('click', event => {
      if (event.detail !== 0 || !active || blocked()) return;
      touchWalkHeld.add(dirName);
      setTimeout(() => touchWalkHeld.delete(dirName), (TURN_TICKS + 2) * TICK_MS);
    });
  });
  // Joystick analógico: arrastar o bastão dá um vetor {x,y} dentro de pointers.
  const joystick = $('#island-joystick'), stick = $('#joystick-stick');
  if (joystick) {
    const radius = 46; // alcance do bastão em pixels, limitado ao anel da base
    const setStick = (nx, ny) => { stick.style.transform = `translate(calc(-50% + ${nx * radius}px),calc(-50% + ${ny * radius}px))`; };
    joystick.addEventListener('pointerdown', event => {
      if (!active || blocked()) return;
      event.preventDefault(); joystick.setPointerCapture(event.pointerId); joystick.classList.add('is-active');
      pointers.set(event.pointerId, { x: 0, y: 0 });
    });
    joystick.addEventListener('pointermove', event => {
      if (!pointers.has(event.pointerId)) return;
      event.preventDefault();
      const base = joystick.getBoundingClientRect();
      const cx = (base.left + base.right) / 2, cy = (base.top + base.bottom) / 2;
      let vx = (event.clientX - cx) / radius, vy = (event.clientY - cy) / radius;
      const len = Math.hypot(vx, vy);
      if (len > 1) { vx /= len; vy /= len; } // mantém o bastão dentro do anel
      // Pequena zona morta no centro evita andar sem querer com um toque parado.
      const vec = Math.hypot(vx, vy) < 0.20 ? { x: 0, y: 0 } : { x: vx, y: vy };
      pointers.set(event.pointerId, vec); setStick(vec.x, vec.y);
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) joystick.addEventListener(type, event => {
      if (!pointers.has(event.pointerId)) return;
      pointers.delete(event.pointerId); resetJoystick();
    });
  }
  window.addEventListener('blur', clearInput);
  document.addEventListener('visibilitychange', () => { clearInput(); lastTime = 0; acc = 0; });
  // Reajusta o canvas à janela: redimensionar, girar o aparelho ou barra do navegador mudar.
  const refit = () => { if (active && !inChallenge()) { renderer.resize(); updateCamera(true); } };
  window.addEventListener('resize', refit);
  window.addEventListener('orientationchange', () => { refit(); setTimeout(refit, 250); });
  window.visualViewport?.addEventListener('resize', refit);
  renderer.ready.then(() => {
    loaded = true; $('#island-loading').hidden = renderer.failed.length === 0;
    if (active) updateCamera(true);
    if (renderer.failed.length) $('#island-loading').textContent = 'Algumas imagens não abriram. Confira se a pasta assets está junto do index.html.';
  });
  function teleport(imgX, imgY) { player.x = imgX * WORLD_SCALE; player.y = imgY * WORLD_SCALE; player.moving = false; player.inStep = false; player.prog = 0; updateCamera(true); updateLocation(16); }
  return { start, stop, teleport, getCurrentRegion: () => currentRegion, get active() { return active; }, get player() { return player; }, get renderer() { return renderer; } };
})();
