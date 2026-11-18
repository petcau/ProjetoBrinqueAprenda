"use strict";
(() => {
  const $ = (id) => document.getElementById(id),
    W = window.FlorestaMundo,
    canvas = $("cenario"),
    ctx = canvas.getContext("2d");
  window.BosqueRotas.init(1, W);
  const equipmentReady = BosqueKai.load();
  const world = new BosqueCenario(1, W);
  const KEY = "guardiao.floresta-viva.v2",
    MAP = "guardiao.mapa.progresso.v1",
    ATLAS = window.GuardiaoFlorestaAtlas;
  const player = {
    x: 286,
    y: 260,
    direction: 4,
    distance: 0,
    idle: 0,
    moving: false,
  };
  const life = new window.GuardiaoVidaNatural(1);
  const art = new window.GuardiaoAdventureArt(1);
  const ui = new window.GuardiaoGameUI({
    phase: 1,
    state: () => ({
      locked: locked(),
      action: healing || equipping > 0 || spraying,
      swimming: false,
    }),
  });
  document.body.dataset.phase = "1";
  const colar = new window.GuardiaoColar({ phase: 1, life });
  const flora = { x: 259, y: 190, mode: "voando", elapsed: 0 };
  const stick = { x: 0, y: 0, id: null },
    keys = new Set(),
    sprites = new window.FlorestaSprites();
  const directions = [
    [1, 0],
    [0.707, -0.707],
    [0, -1],
    [-0.707, -0.707],
    [-1, 0],
    [-0.707, 0.707],
    [0, 1],
    [0.707, 0.707],
  ];
  let fires = W.fires.map((f) => ({ ...f, life: 1 })),
    animals = W.animals.map((a) => ({
      ...a,
      stage: "ferido",
      position: { x: a.x, y: a.y },
      route: [],
      distance: 0,
    }));
  let ready = false,
    uiTime = 0,
    clock = 0,
    last = 0,
    raf = 0,
    itemsGiven = false,
    released = false,
    water = 0,
    equipped = false,
    equipping = 0;
  let completed = false,
    stage = "abertura",
    introIndex = 0,
    introDeadline = 0,
    handoff = 0,
    rewardTime = 0,
    rewardStarted = false;
  let routeTicket = 0,
    playerRoutePending = false;
  let route = [],
    routeGoal = null,
    nextReplan = 0,
    spraying = false,
    waterPointer = null,
    target = null,
    healing = null,
    healTime = 0;
  let environment,
    dirty = false,
    saveWarning = false;
  let messageUntil = 0,
    hintUntil = 0,
    toastUntil = 0,
    lastHint = "",
    nextHintTime = 0,
    viewport = { w: innerWidth, h: innerHeight },
    camera = { x: 640, y: 360, scale: 1 };
  let preferences = {};
  try {
    const p = JSON.parse(
      localStorage.getItem("guardiao.horizonte.preferences.v1") || "{}",
    );
    if (p && typeof p === "object") preferences = p;
  } catch {}
  const reduced = () =>
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    preferences.reduceMotion === true;
  document.documentElement.classList.toggle(
    "large-text",
    preferences.largeText === true,
  );
  document.body.classList.toggle("reduce-motion", reduced());
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener(
    "change",
    () => document.body.classList.toggle("reduce-motion", reduced()),
  );
  const intro = [
    "Oi, Kai! Pegue a mangueira e o kit. Vamos proteger a floresta!",
    "Abra o registro vermelho. Apague o fogo e cuide dos três animais. Flora mostra o caminho!",
  ];
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s?.version !== 2) return;
      itemsGiven = s.itemsGiven === true;
      released = itemsGiven && s.released === true;
      equipped = itemsGiven && s.hoseDrawn === true && s.equipped === true;
      water =
        released && Number.isFinite(s.water)
          ? Math.max(0, Math.min(100, s.water))
          : 0;
      if (itemsGiven && Array.isArray(s.fires) && s.fires.length === 8)
        fires.forEach((f, i) => {
          f.life = Number.isFinite(s.fires[i])
            ? Math.max(0, Math.min(1, s.fires[i]))
            : 1;
        });
      if (
        itemsGiven &&
        Number.isFinite(s.x) &&
        Number.isFinite(s.y) &&
        W.walkable(s)
      )
        Object.assign(player, { x: s.x, y: s.y });
      for (const a of animals) {
        const saved = s.animals?.find?.((v) => v.id === a.id);
        if (!saved || !a.fires.every((id) => fires[id].life === 0)) continue;
        if (saved.stage === "seguro") {
          a.stage = "seguro";
          a.position = { ...a.home };
        } else if (saved.stage === "voltando") {
          a.stage = "voltando";
          if (
            saved.position &&
            Number.isFinite(saved.position.x) &&
            Number.isFinite(saved.position.y) &&
            W.walkable(saved.position)
          )
            a.position = { ...saved.position };
          a.route = homeRoute(a);
        }
      }
      completed =
        s.completed === true &&
        released &&
        fires.every((f) => f.life === 0) &&
        animals.every((a) => a.stage === "seguro");
      if (itemsGiven) stage = "explorando";
    } catch {}
  }
  function save() {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          version: 2,
          itemsGiven,
          released,
          equipped,
          hoseDrawn: equipped,
          water,
          x: player.x,
          y: player.y,
          fires: fires.map((f) => f.life),
          animals: animals.map((a) => ({
            id: a.id,
            stage: a.stage,
            position: { ...a.position },
          })),
          completed,
        }),
      );
      window.GuardiaoMemoria.record(
        1,
        [
          ...fires.map((f) => ({
            id: "fogo" + f.id,
            type: "fire",
            status: f.life === 0 ? "done" : "pending",
          })),
          ...animals.map((a) => ({
            id: a.id,
            name: a.name,
            type: "animal",
            status: a.stage === "seguro" ? "safe" : a.stage,
          })),
        ],
        { completed, water, released },
      );
      dirty = false;
    } catch {
      if (!saveWarning) {
        saveWarning = true;
        toast(
          "O navegador não permitiu salvar. Você pode continuar nesta aba.",
        );
      }
    }
  }
  function toast(text) {
    $("flora-talk").hidden = true;
    $("dica").hidden = true;
    $("toast").textContent = text;
    toastUntil = uiTime + 2.8;
  }
  function speak(text, speaker = "Flora") {
    $("toast").textContent = "";
    $("dica").hidden = true;
    $("falante").textContent = speaker;
    $("fala").textContent = text;
    $("flora-talk").hidden = false;
    $("flora-talk").classList.remove("is-leaving");
    messageUntil = uiTime + Math.max(3, Math.min(5, text.length / 24 + 1));
  }
  function hint(text, force = false) {
    if (!force && uiTime < nextHintTime) return;
    if (!text) {
      $("dica").hidden = true;
      return;
    }
    if (
      !preferences.contextHints &&
      preferences.contextHints !== undefined &&
      !force
    )
      return;
    if (!$("flora-talk").hidden || $("toast").textContent) return;
    if (text !== lastHint || force) {
      lastHint = text;
      nextHintTime = uiTime + 12;
      $("dica").textContent = text;
      $("dica").hidden = false;
      hintUntil = uiTime + 3;
    }
  }
  function soundEffect(freq = 650) {
    const name =
      freq >= 950
        ? "vitoria"
        : freq >= 820
          ? "resgate"
          : freq === 780
            ? "receber"
            : freq === 760
              ? "restaurar"
              : freq === 740
                ? "agua-liberada"
                : "toque";
    window.GuardiaoAudio?.effect(name);
  }
  const distance = (p) => W.distance(player, p),
    near = (p, r) => distance(p) < r;
  const paused = () =>
    document.hidden ||
    window.GuardiaoOrientacao?.blocked ||
    [...document.querySelectorAll("dialog")].some(
      (d) => d.open && d.id !== "conversa",
    );
  const locked = () =>
    !ready ||
    paused() ||
    $("conversa").open ||
    stage === "entrega" ||
    stage === "recompensa";
  function neutral() {
    routeTicket++;
    playerRoutePending = false;
    window.GuardiaoAudio?.water(false);
    keys.clear();
    stick.x = stick.y = 0;
    stick.id = null;
    spraying = false;
    waterPointer = null;
    $("stick").style.transform = "";
    $("mangueira").classList.remove("is-held");
  }
  function openDialog(id) {
    if (dirty) save();
    neutral();
    route = [];
    routeGoal = null;
    if (id === "inventario") ui.pack();
    else ui.open(id);
  }
  function lockControls() {
    document.body.dataset.stage = stage;
    document.querySelectorAll(".goal,.actions button,#ajuda").forEach((b) => {
      b.disabled = !itemsGiven || stage === "entrega" || stage === "recompensa";
    });
  }
  function showIntro() {
    neutral();
    route = [];
    stage = "abertura";
    introIndex = 0;
    $("flora-talk").hidden = true;
    introLine();
    ui.open("conversa");
    lockControls();
  }
  function introLine() {
    $("conversa-texto").textContent = intro[introIndex];
    $("conversa-pagina").textContent = introIndex + 1 + " / " + intro.length;
    $("conversa-avancar").textContent =
      introIndex === intro.length - 1 ? "Vamos cuidar!" : "Continuar";
    introDeadline = Infinity;
    cropDOM(
      $("retrato-carlos"),
      "carlos",
      introIndex === 1 ? 3 : introIndex === 3 ? 7 : 2,
      90,
    );
  }
  function advanceIntro() {
    if (introIndex < intro.length - 1) {
      introIndex++;
      introLine();
      return;
    }
    $("conversa").close();
    stage = "entrega";
    handoff = 1.8;
    lockControls();
    $("cinema").hidden = false;
    $("cinema-texto").textContent =
      "Carlos entrega a mangueira e o kit de resgate";
  }
  function grant() {
    itemsGiven = true;
    released = true;
    water = 100;
    window.GuardiaoMemoria.uniform("explorador", { required: true });
    window.GuardiaoMemoria.grant(1);
    equipped = false;
    stage = "explorando";
    $("cinema").hidden = true;
    dirty = true;
    toast("Mangueira e kit de resgate recebidos!");
    save();
    lockControls();
    speak("Tudo pronto! Cuide dos focos e dos animais.");
    soundEffect(780, 0.2);
  }
  const goalsDone = () =>
    released &&
    fires.every((f) => f.life === 0) &&
    animals.every((a) => a.stage === "seguro");
  function getGoal(type) {
    if (type === "carlos") return { x: 286, y: 260, kind: "carlos" };
    if (type === "agua") return { x: 436, y: 392, kind: "agua" };
    if (type === "fogo")
      return fires
        .filter((f) => f.life > 0)
        .sort((a, b) => distance(a) - distance(b))[0];
    return animals
      .filter((a) => a.stage === "ferido")
      .sort((a, b) => distance(a) - distance(b))[0];
  }
  function schedulePath(point, approach = 0) {
    const ticket = ++routeTicket,
      start = { x: player.x, y: player.y };
    playerRoutePending = true;
    route = [];
    routeGoal = { ...point };
    BosqueRotas.route(start, point, {
      approach,
      hazards: [...fires, ...animals],
    })
      .then((path) => {
        if (ticket !== routeTicket) return;
        playerRoutePending = false;
        if (stage === "explorando" && W.distance(player, start) < 3) {
          route = path;
          if (!path.length) routeGoal = null;
        }
      })
      .catch(() => {
        if (ticket === routeTicket) playerRoutePending = false;
      });
  }
  function guide(type) {
    if (locked()) return;
    if (!itemsGiven) {
      speak(
        "Antes de partir, vamos conversar com Carlos e receber os equipamentos.",
      );
      return;
    }
    let point = getGoal(type);
    if (!point) {
      speak(
        type === "animal"
          ? "Os animais estão indo ao abrigo!"
          : "Agora vamos cuidar dos animais!",
      );
      return;
    }
    if (type === "fogo" && (!released || water < 5)) {
      point = getGoal("agua");
      speak("Vamos buscar água no registro!");
    } else if (type === "carlos")
      speak(
        goalsDone() ? "Carlos tem uma surpresa para nós!" : "Vamos até Carlos!",
      );
    else if (type === "animal")
      speak("Apague o fogo. Depois toque na mão perto do animal.");
    else if (type === "agua") speak("No registro vermelho, toque na mão.");
    else speak("Siga a trilha. Segure ÁGUA perto do fogo.");
    schedulePath(
      point,
      (type === "fogo" || type === "animal") && !point.kind
        ? type === "fogo"
          ? 92
          : 49
        : 0,
    );
  }
  function equip() {
    if (!itemsGiven) {
      speak("Carlos vai entregar os equipamentos antes da missão.");
      return;
    }
    if (equipped || equipping > 0) return;
    equipping = 0.65;
    dirty = true;
    $("mangueira").setAttribute("aria-pressed", "true");
  }
  function beginWater() {
    if (locked() || !itemsGiven) return;
    if (!released) {
      speak("Abra o registro primeiro. Toque na missão Água.");
      return;
    }
    if (water <= 0) {
      speak("Água acabou! Volte ao registro.");
      return;
    }
    if (!equipped) equip();
    spraying = true;
    route = [];
    routeGoal = null;
    $("mangueira").classList.add("is-held");
  }
  function homeRoute(a) {
    const request = (a.routeRequest || 0) + 1;
    a.routeRequest = request;
    a.routePending = true;
    Promise.resolve()
      .then(() =>
        BosqueRotas.route({ ...a.position }, a.home, {
          hazards: [...fires, ...animals],
        }),
      )
      .then((path) => {
        if (a.routeRequest !== request || a.stage !== "voltando") return;
        a.route = path;
        a.routePending = false;
        a.nextRetry = uiTime + 2;
      })
      .catch(() => {
        a.routePending = false;
        a.nextRetry = uiTime + 2;
      });
    return [];
  }
  function interact() {
    if (locked()) return;
    if (near({ x: 245, y: 245 }, 87)) {
      if (!itemsGiven) {
        showIntro();
        return;
      }
      if (goalsDone() && !completed) {
        startReward();
        return;
      }
      speak(
        completed
          ? "Obrigado, Kai! O fragmento é seu, e a floresta está segura."
          : animals.some((a) => a.stage === "voltando")
            ? "Estou recebendo os animais. Acompanhe os que ainda estão na trilha e cuide dos focos restantes."
            : "Use a mangueira nos focos, trate os animais com o kit e traga todos para o abrigo. Quando terminar, venha buscar o fragmento do colar.",
        "Carlos",
      );
      return;
    }
    if (near({ x: 395, y: 385 }, 83)) {
      if (!itemsGiven) return;
      released = true;
      water = 100;
      dirty = true;
      save();
      toast("Registro aberto · água liberada");
      soundEffect(740, 0.2);
      return;
    }
    const a = animals
      .filter((a) => a.stage === "ferido" && near(a, 92))
      .sort((a, b) => distance(a) - distance(b))[0];
    if (a) {
      if (a.fires.some((id) => fires[id].life > 0)) {
        speak("Apague o fogo ao redor primeiro!");
        return;
      }
      if (healing) return;
      healing = a;
      healTime = 1.6;
      a.stage = "tratando";
      route = [];
      routeGoal = null;
      player.direction = a.x < player.x ? 4 : 0;
      speak("Pronto, amiguinho! Vamos cuidar de você.");
      return;
    }
    const neighbor = art
      .actors(uiTime, reduced(), 0)
      .filter((a) => near(a, 48))
      .sort((a, b) => distance(a) - distance(b))[0];
    if (neighbor) {
      speak(neighbor.tip || "Vamos cuidar juntos!", neighbor.name || "Vizinho");
      return;
    }
    speak("Use a mão perto de um animal ou do registro.");
  }
  function startReward() {
    neutral();
    route = [];
    routeGoal = null;
    rewardStarted = true;
    rewardTime = 0;
    stage = "recompensa";
    lockControls();
    colar.begin(finishReward);
    $("cinema").hidden = false;
    $("cinema-texto").textContent = "Carlos entrega o fragmento da floresta";
    speak("Você cuidou da floresta! Este fragmento vermelho é seu.", "Carlos");
  }
  function finishReward() {
    if (stage !== "recompensa") return;
    colar.complete();
    completed = true;
    stage = "concluido";
    dirty = true;
    save();
    let saved = true;
    try {
      const old = JSON.parse(localStorage.getItem(MAP) || "null");
      localStorage.setItem(
        MAP,
        JSON.stringify({
          ...old,
          completedFirst: true,
          current: 2,
          completed: [
            ...new Set([
              ...(Array.isArray(old?.completed) ? old.completed : []),
              1,
            ]),
          ],
          pendingRestoration: 1,
        }),
      );
      const oldShards = JSON.parse(
        localStorage.getItem("guardiao.colar.fragmentos.v1") || "[]",
      );
      const shards = Array.isArray(oldShards)
        ? oldShards.filter((n) => Number.isInteger(n) && n >= 1 && n <= 6)
        : [];
      localStorage.setItem(
        "guardiao.colar.fragmentos.v1",
        JSON.stringify([...new Set([...shards, 1])]),
      );
    } catch {
      saved = false;
    }
    $("cinema").hidden = true;
    $("salvo").textContent = saved
      ? "Fragmento vermelho conquistado · próximo destino: Rio Poluído."
      : "Fragmento recebido nesta aba. O navegador não permitiu salvar o progresso.";
    ui.open("vitoria");
    document.dispatchEvent(new CustomEvent("guardiao:conclusao"));
    soundEffect(980, 0.4);
    lockControls();
  }
  function direction(dx, dy) {
    return (Math.round(-Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8;
  }
  function canMove(p) {
    return (
      W.walkable(p) &&
      !fires.some((f) => f.life > 0 && W.distance(p, f) < 24) &&
      !animals.some(
        (a) => a.stage === "ferido" && W.distance(p, a.position) < 19,
      )
    );
  }
  function move(dx, dy) {
    const moved = window.GuardiaoMovimento.move(player, dx, dy, canMove);
    if (moved > 0.01) {
      if (
        Math.floor((player.distance + moved) / 28) >
        Math.floor(player.distance / 28)
      )
        window.GuardiaoAudio?.effect("passo", { gain: 0.22 });
      player.distance += moved;
      player.direction = direction(dx, dy);
      player.idle = 0;
      dirty = true;
    }
    return moved;
  }
  function updateAnimals(dt) {
    for (const a of animals) {
      if (a.stage !== "voltando" || a.routePending) continue;
      while (a.route.length && W.distance(a.position, a.route[0]) < 0.1)
        a.route.shift();
      if (!a.route.length && W.distance(a.position, a.home) > 4) {
        if (uiTime >= (a.nextRetry || 0)) {
          a.nextRetry = uiTime + 1;
          a.route = homeRoute(a);
        }
        if (!a.route.length) continue;
      }
      if (!a.route.length) {
        a.stage = "seguro";
        a.position = { ...a.home };
        a.arrivedAt = uiTime;
        dirty = true;
        save();
        toast(a.name + " em segurança! ✓");
        soundEffect(840, 0.18);
        continue;
      }
      const next = a.route[0],
        d = W.distance(a.position, next),
        step = Math.min(d, 91 * dt);
      a.facingRight = next.x > a.position.x;
      a.position.x += ((next.x - a.position.x) / d) * step;
      a.position.y += ((next.y - a.position.y) / d) * step;
      a.distance += step;
    }
  }
  function updateFlora(dt) {
    FloraCompanheira.update(flora, player, dt, {
      phase: 1,
      busy: spraying || healing || equipping > 0 || stage === "entrega",
      reward: stage === "recompensa" || stage === "concluido",
      jump: ui.height(),
    });
  }
  function update(dt) {
    ui.update(dt);
    clock += dt;
    if (equipping > 0) {
      equipping = Math.max(0, equipping - dt);
      if (equipping === 0) {
        equipped = true;
        dirty = true;
        save();
      }
    }
    if (stage === "entrega") {
      handoff = Math.max(0, handoff - dt);
      player.idle += dt;
      if (handoff === 0) grant();
      updateFlora(dt);
      return;
    }
    if (stage === "recompensa") {
      rewardTime += dt;
      player.moving = false;
      updateFlora(dt);
      if (rewardTime > 2)
        $("cinema-texto").textContent =
          rewardTime < 4
            ? "O fragmento da floresta é seu!"
            : "Kai e Flora celebram a vida que voltou!";
      if (rewardTime >= 6.5) finishReward();
      return;
    }
    let dx =
      stick.x +
      Number(keys.has("d") || keys.has("arrowright")) -
      Number(keys.has("a") || keys.has("arrowleft"));
    let dy =
      stick.y +
      Number(keys.has("s") || keys.has("arrowdown")) -
      Number(keys.has("w") || keys.has("arrowup"));
    if (dx || dy) {
      routeTicket++;
      playerRoutePending = false;
      route = [];
      routeGoal = null;
    } else if (route.length) {
      while (route.length && W.distance(player, route[0]) < 0.1) route.shift();
      if (route.length) {
        const d = W.distance(player, route[0]);
        dx = (route[0].x - player.x) / d;
        dy = (route[0].y - player.y) / d;
      } else {
        routeGoal = null;
        toast("Chegamos!");
      }
    }
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    const travelled =
      healing || equipping > 0
        ? 0
        : move(
            dx *
              Math.min(
                116 * (window.BrisaRitmo?.speed || 1) * dt,
                route.length ? W.distance(player, route[0]) : Infinity,
              ),
            dy *
              Math.min(
                116 * (window.BrisaRitmo?.speed || 1) * dt,
                route.length ? W.distance(player, route[0]) : Infinity,
              ),
          );
    player.moving = travelled > 0.01;
    if (!player.moving) player.idle += dt;
    if (
      route.length &&
      !travelled &&
      len > 0 &&
      !healing &&
      equipping === 0 &&
      uiTime >= nextReplan
    ) {
      nextReplan = uiTime + 0.5;
      // Um animal pode chegar ao abrigo depois que a trilha foi calculada.
      // Recalcule o caminho até o mesmo destino, respeitando os obstáculos atuais.
      const destination = route.at(-1);
      schedulePath(destination);
    }
    if (released && near({ x: 395, y: 385 }, 73) && water < 100) {
      water = Math.min(100, water + 35 * dt);
      dirty = true;
    }
    target = null;
    if (
      spraying &&
      itemsGiven &&
      released &&
      equipped &&
      water > 0 &&
      equipping === 0 &&
      !healing
    ) {
      target =
        fires
          .filter((f) => f.life > 0 && near(f, 155))
          .sort((a, b) => distance(a) - distance(b))[0] || null;
      if (target) water = Math.max(0, water - 4 * dt);
      dirty = true;
      if (target) {
        player.direction = direction(target.x - player.x, target.y - player.y);
        target.life = Math.max(0, target.life - 0.36 * dt);
        if (target.life === 0) {
          target.restoredAt = uiTime;
          save();
          toast("Foco apagado. A vida está voltando!");
          soundEffect(760, 0.16);
        }
      }
    }
    if (healing) {
      healTime = Math.max(0, healTime - dt);
      if (healTime === 0) {
        healing.stage = "voltando";
        healing.route = homeRoute(healing);
        toast(healing.name + " está melhor!");
        healing = null;
        dirty = true;
        save();
      }
    }
    updateAnimals(dt);
    updateFlora(dt);
    updateHUD();
    contextHint();
    if (
      goalsDone() &&
      !completed &&
      !rewardStarted &&
      !route.length &&
      near({ x: 245, y: 245 }, 87)
    )
      startReward();
  }
  let lastHUD = -1;
  function updateHUD(force = false) {
    if (!force && clock - lastHUD < 0.16) return;
    lastHUD = clock;
    ui.objective(
      completed
        ? "Floresta recuperada. Obrigado por cuidar!"
        : !itemsGiven
          ? "Receba os equipamentos de Carlos"
          : !released
            ? "Abra o registro vermelho"
            : fires.some((f) => f.life > 0)
              ? "Segure ÁGUA perto das chamas"
              : animals.some((a) => a.stage !== "seguro")
                ? "Cuide dos animais e acompanhe o resgate"
                : "Volte a Carlos para celebrar",
    );
    $("agua-estado").textContent = released ? "liberada" : "fechada";
    $("agua-check").textContent = released ? "✓" : "○";
    $("incendios").textContent =
      fires.filter((f) => f.life === 0).length + "/8";
    $("animais").textContent =
      animals.filter((a) => a.stage === "seguro").length + "/3";
    $("fogo-check").textContent = fires.every((f) => f.life === 0) ? "✓" : "○";
    $("animal-check").textContent = animals.every((a) => a.stage === "seguro")
      ? "✓"
      : "○";
    $("reserva").value = water;
    $("agua-numero").textContent = Math.floor(water) + "%";
    const wasHidden = $("voltar-carlos").hidden;
    $("voltar-carlos").hidden = !goalsDone() || completed;
    if (wasHidden && !$("voltar-carlos").hidden) {
      speak("Conseguimos! Vamos receber o fragmento com Carlos.");
      schedulePath({ x: 286, y: 260 });
    }
  }
  function contextHint() {
    let t = "";
    if (near({ x: 245, y: 245 }, 87))
      t =
        goalsDone() && !completed
          ? "Toque na mão para receber o fragmento do colar de Carlos."
          : "";
    else if (near({ x: 395, y: 385 }, 83))
      t = released
        ? "Reabastecendo…"
        : "Toque na mão para abrir o registro vermelho.";
    else if (animals.some((a) => a.stage === "ferido" && near(a, 92)))
      t = "Use a mão para tratar o animal depois de apagar o fogo ao redor.";
    else if (fires.some((f) => f.life > 0 && near(f, 155)))
      t =
        water <= 0
          ? "Volte ao registro para encher a mochila."
          : "Segure ÁGUA para apagar as chamas.";
    if (healing) t = "Tratando o ferimento com o kit de resgate…";
    if (equipping > 0) t = "Kai está tirando a mangueira da mochila…";
    hint(t);
  }
  function expire() {
    if ($("toast").textContent && uiTime > toastUntil)
      $("toast").textContent = "";
    if (!$("flora-talk").hidden && uiTime > messageUntil) {
      $("flora-talk").classList.add("is-leaving");
      if (uiTime > messageUntil + 0.3) $("flora-talk").hidden = true;
    }
    if (!$("dica").hidden && uiTime > hintUntil) $("dica").hidden = true;
    if ($("conversa").open && uiTime > introDeadline) advanceIntro();
  }
  function view() {
    const cinematic =
      stage === "recompensa" || (stage === "concluido" && $("vitoria").open);
    const zoom = cinematic
      ? 1 + 0.8 * (reduced() ? 1 : Math.min(1, rewardTime))
      : 1;
    const s = camera.scale * zoom,
      hw = viewport.w / (2 * s),
      hh = viewport.h / (2 * s),
      focusY = player.y - (cinematic ? 25 : 28);
    camera.x = hw >= 640 ? 640 : Math.max(hw, Math.min(1280 - hw, player.x));
    camera.y = hh >= 360 ? 360 : Math.max(hh, Math.min(720 - hh, focusY));
    return {
      s,
      ox: viewport.w / 2 - camera.x * s,
      oy: viewport.h / 2 - camera.y * s,
    };
  }
  function resize() {
    const r = TrilhasRender.pixelRatio();
    viewport = { w: innerWidth, h: innerHeight };
    canvas.width = Math.round(viewport.w * r);
    canvas.height = Math.round(viewport.h * r);
    ctx.setTransform(r, 0, 0, r, 0, 0);
    camera.scale = MataCamera.scale(
      viewport.w,
      viewport.h,
      window.GuardiaoControles.effective() === "touch",
    );
    draw();
  }
  function shadow(x, y, r = 14) {
    ctx.fillStyle = "#183e2455";
    ctx.beginPath();
    ctx.ellipse(x, y + 1, r, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  function ring(x, y, color = "#d3ec9b", r = 19) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  const labelQueue = [];
  function label(text, x, y) {
    labelQueue.push([text, x, y]);
  }
  function paintLabel(text, x, y) {
    if (window.VivaMundo)
      return VivaMundo.label(ctx, text, x, y, view(), viewport.w, viewport.h);
    ctx.font = "bold 11px system-ui";
    ctx.textAlign = "center";
    const w = ctx.measureText(text).width + 15;
    ({ x, y } = GuardiaoEtiquetas.position(
      x,
      y,
      w,
      view(),
      viewport.w,
      viewport.h,
    ));
    ctx.fillStyle = "#f4f1d9ef";
    ctx.strokeStyle = "#6c8a4c";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - 17, w, 23, 9);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#36502c";
    ctx.fillText(text, x, y - 2);
  }
  function drawPlayer() {
    shadow(player.x, player.y);
    ctx.save();
    ctx.translate(0, -ui.height());
    const flip = player.direction >= 3 && player.direction <= 5;
    let name = "kai-repouso",
      index = 0;
    if (
      stage === "recompensa" ||
      (stage === "concluido" && $("vitoria").open)
    ) {
      index =
        stage === "concluido"
          ? 6
          : Math.min(7, Math.floor((rewardTime / 6.5) * 8));
      name = "kai-recompensa";
      colar.drawActor(
        ctx,
        rewardTime,
        player.x,
        player.y,
        65,
        stage === "concluido",
      );
    } else if (healing) {
      index = 6 + Math.min(5, Math.floor(((1.6 - healTime) / 1.6) * 6));
      name = "kai-cuidados";
      BosqueKai.equipment(
        ctx,
        1,
        (1.6 - healTime) / 1.6,
        player.x,
        player.y,
        83,
        flip,
      );
    } else if (equipping > 0) {
      index = Math.min(5, Math.floor(((0.65 - equipping) / 0.65) * 6));
      name = "kai-cuidados";
      BosqueKai.equipment(
        ctx,
        0,
        (0.65 - equipping) / 0.65,
        player.x,
        player.y,
        83,
        flip,
      );
    } else if (!equipped && art.outfit(ctx, player, uiTime, reduced())) {
      name = "uniforme-" + window.GuardiaoMemoria.read().uniform;
      index = player.direction * 2;
    } else if (player.moving && itemsGiven) {
      name = equipped ? "kai-caminhada" : "kai-livre";
      index = player.direction * 2 + (Math.floor(player.distance / 20) % 2);
      life.walk(ctx, player, uiTime, reduced(), equipped);
    } else if (equipped) {
      name = "kai-mangueira";
      index =
        player.direction * 2 + (!reduced() && uiTime % 3.8 > 3.45 ? 1 : 0);
      sprites.hose(
        ctx,
        player.direction,
        index % 2,
        player.x,
        player.y,
        63 + (reduced() ? 0 : Math.sin(uiTime * 2) * 0.35),
      );
    } else {
      const dir = player.direction,
        base = dir === 2 ? 2 : dir >= 3 && dir <= 5 ? 4 : dir === 6 ? 6 : 0;
      index = base + (!reduced() && uiTime % 4.7 > 4.48 ? 1 : 0);
      sprites.draw(
        ctx,
        name,
        index,
        player.x,
        player.y,
        63 + (reduced() ? 0 : Math.sin(uiTime * 1.7) * 0.35),
      );
    }
    document.body.dataset.kaiSprite = name + ":" + index;
    if (!healing && equipping <= 0 && name !== "kai-recompensa")
      colar.chest(ctx, player);
    if (healing) {
      ring(player.x, player.y, "#d1f1a8", 23);
      ctx.fillStyle = "#254d37";
      ctx.fillRect(player.x - 19, player.y + 10, 38, 5);
      ctx.fillStyle = "#badd7b";
      ctx.fillRect(player.x - 18, player.y + 11, 36 * (1 - healTime / 1.6), 3);
    }
    ctx.restore();
  }
  function drawAnimal(a) {
    const p = a.position;
    shadow(p.x, p.y, a.id === "passaro" ? 8 : 13);
    let frame;
    if (a.stage === "ferido") frame = !reduced() && uiTime % 4 > 3.7 ? 1 : 0;
    else if (a.stage === "tratando") frame = 2;
    else if (a.stage === "voltando")
      frame = 4 + (Math.floor(a.distance / 12) % 4);
    else frame = 3;
    sprites.draw(
      ctx,
      a.id,
      frame,
      p.x,
      p.y - (a.stage === "voltando" && a.id === "passaro" ? 11 : 0),
      a.height,
      { flip: a.stage === "voltando" && a.facingRight },
    );
    GuardiaoCuidados.draw(
      ctx,
      a,
      uiTime,
      reduced(),
      a.stage === "tratando" ? 1 - healTime / 1.6 : 0,
      player,
    );
    if (a.stage === "ferido") {
      ring(p.x, p.y, "#e8c68a", 15);
      if (
        !locked() &&
        !healing &&
        near(a, 105) &&
        a ===
          animals
            .filter((a) => a.stage === "ferido")
            .sort((a, b) => distance(a) - distance(b))[0]
      )
        label(a.name + " · precisa de cuidados", p.x, p.y - a.height - 10);
    }
    if (a.stage === "tratando") {
      ring(p.x, p.y, "#b8e58c", 22);
      sprites.draw(ctx, "natureza", 6, p.x + 15, p.y - 14, 13);
    }
    if (!locked() && a.stage === "voltando" && near(p, 130))
      label("Indo até Carlos", p.x, p.y - a.height - 10);
    if (!locked() && a.stage === "seguro" && uiTime - (a.arrivedAt ?? -5) < 3)
      label("Em segurança! ✓", p.x, p.y - a.height - 10);
  }
  function drawFlora() {
    life.flora(ctx, flora, player, uiTime, reduced());
    document.body.dataset.floraState = flora.mode;
  }
  function drawCarlos() {
    const receiving = animals.some(
      (a) => a.stage === "seguro" && uiTime - (a.arrivedAt ?? -5) < 2,
    );
    let pose;
    if (stage === "entrega") pose = 3;
    else if (stage === "recompensa") pose = rewardTime < 1.8 ? 5 : 6;
    else if ($("conversa").open)
      pose = introIndex === 1 ? 3 : introIndex === 3 ? 7 : 2;
    else pose = receiving ? 6 : !reduced() && uiTime % 5 > 4.7 ? 1 : 0;
    if (animals.some((a) => a.stage === "seguro")) pose = receiving ? 6 : 2;
    shadow(245, 245);
    sprites.draw(ctx, "carlos", pose, 245, 245, 68);
    if (!paused() && stage === "explorando" && near({ x: 245, y: 245 }, 100))
      label(
        goalsDone() && !completed
          ? "Carlos · receber fragmento"
          : "Carlos · conversar",
        245,
        166,
      );
  }
  function draw() {
    if (!ready) return;
    labelQueue.length = 0;
    const { s, ox, oy } = view();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "medium";
    ctx.clearRect(0, 0, viewport.w, viewport.h);
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(s, s);
    document.body.classList.toggle(
      "player-near-hud",
      viewport.w < 700 && player.y * s + oy < 195,
    );
    world.ground(ctx, fires, uiTime, reduced(), completed);
    life.ground(ctx, player, uiTime, reduced());
    life.recovery(ctx, fires, uiTime, reduced());
    if (route.length) {
      ctx.strokeStyle = "#f9e9a799";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 9]);
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      route.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (routeGoal)
      ring(
        routeGoal.x,
        routeGoal.y,
        "#d6eeb1",
        24 + (reduced() ? 0 : Math.sin(uiTime * 4) * 2),
      );
    const actors = [
      { y: 245, draw: drawCarlos },
      ...fires.map((f) => ({
        y: f.y,
        draw: () => environment.flame(ctx, f, uiTime, reduced()),
      })),
      ...animals.map((a) => ({ y: a.position.y, draw: () => drawAnimal(a) })),
      ...world
        .actors(uiTime, reduced(), player)
        .map((a) => ({ y: a.y, draw: () => a.draw(ctx) })),
      { y: player.y, draw: drawPlayer },
    ];
    const ratio =
      (Number(released) +
        fires.filter((f) => !f.life).length +
        animals.filter((a) => a.stage === "seguro").length) /
      12;
    document.body.dataset.npcMood =
      ratio >= 1 ? "felizes" : ratio > 0 ? "esperancosos" : "preocupados";
    actors.push(
      ...art
        .actors(uiTime, reduced(), ratio)
        .map((a) => ({ y: a.y, draw: () => art.drawResident(ctx, a, player) })),
    );
    actors.sort((a, b) => a.y - b.y).forEach((a) => a.draw());
    if (
      spraying &&
      released &&
      water > 0 &&
      equipping === 0 &&
      !healing &&
      !locked()
    ) {
      const [dx, dy] = directions[player.direction],
        from = life.water.nozzle(player, uiTime, reduced()),
        to = target
          ? { x: target.x, y: target.y - 12 }
          : { x: from.x + dx * 110, y: from.y + dy * 80 };
      window.GuardiaoAudio?.water(true);
      document.body.dataset.waterFrame = String(
        life.jet(ctx, from, to, uiTime, reduced(), { contact: !!target }),
      );
    } else {
      window.GuardiaoAudio?.water(false);
      life.water.stop();
      document.body.dataset.waterFrame = "none";
    }
    for (const a of animals) {
      if (a.stage === "ferido") {
        const y = a.position.y - a.height - 15;
        ctx.fillStyle = "#fff3c5";
        ctx.strokeStyle = "#be8b37";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(a.position.x, y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        window.GuardiaoIcones?.paint(
          ctx,
          window.GuardiaoIconesImage,
          "paw",
          a.position.x,
          y,
          18,
        );
      }
    }
    drawFlora();
    for (const args of labelQueue) paintLabel(...args);
    if (stage === "entrega") {
      const progress = 1 - handoff / 1.8;
      for (let i = 0; i < 2; i++) {
        const t = Math.max(0, Math.min(1, progress * 1.4 - i * 0.25)),
          x = 245 + (player.x - 245) * t,
          y = 215 + (player.y - 40 - 215) * t - Math.sin(t * Math.PI) * 30;
        sprites.item(ctx, i, x, y, 20, {
          alpha: Math.sin(Math.min(1, progress * 1.3) * Math.PI) * 0.65 + 0.35,
        });
      }
    }
    if (stage === "recompensa") {
      colar.render(rewardTime, reduced());
      environment.celebrate(ctx, player, uiTime, reduced());
      if (rewardTime < 1.2) {
        const t = rewardTime / 1.2;
        sprites.item(
          ctx,
          2,
          245 + (player.x - 245) * t,
          205 - 18 * Math.sin(t * Math.PI),
          17,
        );
      }
    }
    if (released) ring(395, 385, "#a6d99d", 13);
    else if (itemsGiven) ring(395, 385, "#84e3ed", 13);
    if (new URLSearchParams(location.search).has("colisoes")) {
      ctx.strokeStyle = "#ff5e96";
      ctx.lineWidth = 2;
      for (const o of W.obstacles) {
        ctx.beginPath();
        if (o.ellipse) {
          const e = o.ellipse;
          ctx.ellipse(e.x, e.y, e.rx, e.ry, 0, 0, Math.PI * 2);
        } else {
          o.polygon.forEach(([x, y], i) =>
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y),
          );
          ctx.closePath();
        }
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.ellipse(player.x, player.y, W.radius, W.radius, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
  let lastPaint = 0;
  function frame(time) {
    raf = 0;
    if (!ready || document.hidden || window.GuardiaoOrientacao?.blocked) return;
    const dt = last ? Math.min(0.034, (time - last) / 1000) : 0.016;
    last = time;
    if (!paused()) {
      uiTime += dt;
      if ($("conversa").open) {
        player.moving = false;
        player.idle += dt;
        updateFlora(dt);
      } else update(dt);
      expire();
    }
    if (time - lastPaint >= (paused() ? 100 : 0)) {
      draw();
      lastPaint = time;
    }
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (ready && !raf && !document.hidden) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }
  function cropDOM(node, sheetName, index, size) {
    if (sheetName === "carlos") {
      const portrait = document.createElement("canvas");
      portrait.width = 200;
      portrait.height = 240;
      window.RaizesPersonagens.draw(
        portrait.getContext("2d"),
        "npcs",
        index % 4 > 1 ? 5 : 0,
        100,
        238,
        225,
      );
      node.replaceChildren(portrait);
      return;
    }
    const sheet = ATLAS.sheets[sheetName],
      f = sheet.frames[index],
      b = f.bounds;
    const c = document.createElement("canvas");
    c.width = 200;
    c.height = 240;
    c.style.cssText = "display:block;width:100%;height:100%;object-fit:contain";
    const k = Math.min((c.width - 8) / b[2], (c.height - 8) / b[3]);
    c.getContext("2d").drawImage(
      sprites.images.get(sheetName),
      ...b,
      (c.width - b[2] * k) / 2,
      (c.height - b[3] * k) / 2,
      b[2] * k,
      b[3] * k,
    );
    node.style.backgroundImage = "none";
    node.replaceChildren(c);
  }
  function actionIcon(button, index) {
    const mark = document.createElement("span");
    mark.className = "action-symbol";
    mark.innerHTML =
      button === "mangueira"
        ? Raizes.icon("hose")
        : window.GuardiaoIcones.markup("bag");
    $(button).prepend(mark);
  }
  const pad = $("joystick");
  function stickMove(e) {
    const b = pad.getBoundingClientRect(),
      r = b.width * 0.3;
    let x = (e.clientX - b.left - b.width / 2) / r,
      y = (e.clientY - b.top - b.height / 2) / r;
    const d = Math.hypot(x, y);
    if (d < 0.12) x = y = 0;
    else if (d > 1) {
      x /= d;
      y /= d;
    }
    stick.x = x;
    stick.y = y;
    $("stick").style.transform = `translate(${x * r}px,${y * r}px)`;
  }
  pad.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || stick.id !== null || locked()) return;
    e.preventDefault();
    stick.id = e.pointerId;
    pad.setPointerCapture(e.pointerId);
    stickMove(e);
  });
  pad.addEventListener("pointermove", (e) => {
    if (e.pointerId === stick.id) stickMove(e);
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
    pad.addEventListener(type, (e) => {
      if (e.pointerId === stick.id) {
        stick.id = null;
        stick.x = stick.y = 0;
        $("stick").style.transform = "";
        if (dirty) save();
      }
    });
  $("mangueira").addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || locked()) return;
    e.preventDefault();
    waterPointer = e.pointerId;
    $("mangueira").setPointerCapture(e.pointerId);
    beginWater();
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
    $("mangueira").addEventListener(type, (e) => {
      if (e.pointerId === waterPointer) {
        spraying = false;
        waterPointer = null;
        $("mangueira").classList.remove("is-held");
        if (dirty) save();
      }
    });
  $("mangueira").addEventListener("click", (e) => {
    if (e.detail === 0 && !locked()) {
      if (spraying) spraying = false;
      else beginWater();
    }
  });
  $("interagir").addEventListener("click", interact);
  $("conversa-avancar").addEventListener("click", advanceIntro);
  $("conversa").addEventListener("cancel", (e) => e.preventDefault());
  $("mochila").addEventListener("click", () => {
    if (!locked()) openDialog("inventario");
  });
  $("equipar").addEventListener("click", () => {
    $("inventario").close();
    equip();
    save();
  });
  $("pausa").addEventListener("click", () => {
    if (!$("conversa").open) openDialog("menu-pausa");
  });
  $("ajuda").addEventListener("click", () =>
    guide(
      goalsDone()
        ? "carlos"
        : !released || water < 10
          ? "agua"
          : fires.some((f) => f.life > 0)
            ? "fogo"
            : "animal",
    ),
  );
  $("fechar-fala").addEventListener("click", () => {
    $("flora-talk").hidden = true;
  });
  $("flora-talk").addEventListener("pointerenter", () => {
    messageUntil = Math.max(messageUntil, uiTime + 5);
  });
  $("vitoria").addEventListener("close", () => {
    stage = "explorando";
    flora.mode = "voando";
    flora.elapsed = 0;
    lockControls();
  });
  document.querySelectorAll("[data-close]").forEach((b) =>
    b.addEventListener("click", () => {
      $(b.dataset.close).close();
      if (b.dataset.close === "vitoria") {
        stage = "explorando";
        flora.mode = "voando";
        flora.elapsed = 0;
        lockControls();
      }
    }),
  );
  document
    .querySelectorAll("[data-goal]")
    .forEach((b) => b.addEventListener("click", () => guide(b.dataset.goal)));
  $("recomecar").addEventListener("click", () => {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    location.reload();
  });
  $("tela-cheia").addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await $("jogo").requestFullscreen();
    } catch {
      toast("Experimente virar o celular para o modo paisagem.");
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      neutral();
      if (!$("conversa").open && !paused()) {
        e.preventDefault();
        openDialog("menu-pausa");
      }
      return;
    }
    if (locked() || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if (
      [
        "w",
        "a",
        "s",
        "d",
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
        " ",
      ].includes(k)
    ) {
      e.preventDefault();
      keys.add(k);
      if (k === " " && !e.repeat) beginWater();
    }
    if (k === "e" && !e.repeat) interact();
    if (k === "b" && !e.repeat) openDialog("inventario");
  });
  document.addEventListener("keyup", (e) => {
    keys.delete(e.key.toLowerCase());
    if (e.key === " ") {
      spraying = false;
      $("mangueira").classList.remove("is-held");
    }
    if (dirty) save();
  });
  window.addEventListener("guardiao:controles", () => neutral());
  window.addEventListener("blur", () => {
    neutral();
    if (dirty) save();
  });
  window.addEventListener("guardiao:orientacao", () => {
    neutral();
    last = 0;
    if (dirty) save();
    resize();
    if (!window.GuardiaoOrientacao?.blocked) start();
  });
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    neutral();
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
      if (dirty) save();
    } else start();
  });
  window.addEventListener("pagehide", () => {
    neutral();
    cancelAnimationFrame(raf);
    raf = 0;
    if (dirty) save();
  });
  window.addEventListener("pageshow", start);
  window.GuardiaoFloresta = Object.freeze({
    podeMover: (p) => canMove(p),
    estado: () =>
      structuredClone({
        ready,
        scene: world.state(),
        clock,
        uiTime,
        player,
        jump: ui.height(),
        flora,
        stage,
        itemsGiven,
        released,
        water,
        equipped,
        equipping,
        completed,
        rewardStarted,
        rewardTime,
        fires,
        animals,
        route,
        routePending: playerRoutePending,
        necklace: colar.state(),
        waterEffect: life.water.state(),
        paused: paused(),
        locked: locked(),
        camera,
      }),
  });
  window.GuardiaoIcones?.load().then((im) => (window.GuardiaoIconesImage = im));
  document.addEventListener("guardiao:neutralizar", neutral);
  document.addEventListener("guardiao:acao-principal", () => {
    if (locked()) return;
    if (
      released &&
      water > 0 &&
      fires.some((f) => f.life > 0 && near(f, 155))
    ) {
      beginWater();
      return;
    }
    const help = animals.some((a) => a.stage === "ferido" && near(a, 92));
    const friend = art.actors(uiTime, reduced(), 0).some((a) => near(a, 48));
    if (
      help ||
      friend ||
      near({ x: 245, y: 245 }, 87) ||
      near({ x: 395, y: 385 }, 83)
    )
      interact();
    else beginWater();
  });
  document.addEventListener("guardiao:soltar-acao", () => {
    spraying = false;
    $("mangueira").classList.remove("is-held");
  });
  document.addEventListener("guardiao:equipar", (e) => {
    if (e.detail.id === "mangueira") equip();
    else speak("Equipamento pronto. Use a mão perto do animal.", "Kai");
  });
  window.addEventListener("guardiao:preferencias", (e) => {
    preferences = { ...preferences, ...e.detail };
    neutral();
    resize();
  });
  load();
  if (itemsGiven) window.GuardiaoMemoria.grant(1);
  W.setHazards([...fires, ...animals]);
  let loaded = 0,
    loadFailed = false;
  const activeSheets = Object.keys(ATLAS.sheets).filter(
      (name) =>
        ![
          "kai-repouso",
          "kai-cuidados",
          "kai-caminhada",
          "kai-livre",
          "flora",
          "fogo",
          "kai-recompensa",
        ].includes(name),
    ),
    total = activeSheets.length + 7;
  function progress() {
    if (loadFailed) return;
    loaded++;
    $("loading").textContent = "Preparando a floresta… " + loaded + "/" + total;
  }
  Promise.all([
    sprites.load(progress, activeSheets),
    Promise.resolve(null),
    Promise.resolve(null),
    life.load(progress),
    colar.load(),
    art.load(),
    equipmentReady,
    world.ready,
  ])
    .then((result) => {
      environment = new window.FlorestaAmbiente(sprites, result[1], result[2]);
      environment.life = life;
      if (itemsGiven) GuardiaoMemoria.uniform("explorador", { required: true });
      ready = true;
      document.body.dataset.gameReady = "true";
      $("loading").hidden = true;
      flora.x = player.x - 28;
      flora.y = player.y - 70;
      resize();
      lockControls();
      updateHUD();
      cropDOM($("retrato-carlos"), "carlos", 2, 90);
      cropDOM(document.querySelector(".hose-icon"), "itens", 0, 54);
      cropDOM(document.querySelector(".kit-icon"), "itens", 1, 45);
      $("mangueira").querySelector("svg").remove();
      actionIcon("mangueira", 0);
      actionIcon("mochila", 3);
      if (!itemsGiven) showIntro();
      else if (completed) {
        $("salvo").textContent =
          "Seu fragmento vermelho está guardado. Vamos ao próximo destino?";
        $("vitoria").showModal();
      } else
        speak("Vamos continuar! Toque na missão para encontrar o caminho.");
      start();
    })
    .catch(() => {
      loadFailed = true;
      $("loading").innerHTML =
        'Não foi possível carregar a floresta.<br><a href="index.html">Toque para tentar novamente</a>';
    });
})();
