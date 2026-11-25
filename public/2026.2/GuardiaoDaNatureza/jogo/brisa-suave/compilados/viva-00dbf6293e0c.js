"use strict";

;/* jogo/encanto-natural/catalogo.js */
"use strict";
window.GuardiaoTrilha = {
  music: {
    menu: {
      file: "caminhos-da-floresta.mp3",
      duration: 140.488,
      peak: 0.5088,
      rms: 0.085,
      sampleRate: 44100,
      bytes: 1686822,
      title: "Caminhos da Floresta",
      bpm: 82,
      transpose: 0,
      shared: true,
    },
    floresta: {
      file: "caminhos-da-floresta.mp3",
      duration: 140.488,
      peak: 0.5088,
      rms: 0.085,
      sampleRate: 44100,
      bytes: 1686822,
      title: "Caminhos da Floresta",
      bpm: 82,
      transpose: 0,
      shared: true,
    },
    rio: {
      file: "caminhos-da-floresta.mp3",
      duration: 140.488,
      peak: 0.5088,
      rms: 0.085,
      sampleRate: 44100,
      bytes: 1686822,
      title: "Caminhos da Floresta",
      bpm: 82,
      transpose: 0,
      shared: true,
    },
    fauna: {
      file: "caminhos-da-floresta.mp3",
      duration: 140.488,
      peak: 0.5088,
      rms: 0.085,
      sampleRate: 44100,
      bytes: 1686822,
      title: "Caminhos da Floresta",
      bpm: 82,
      transpose: 0,
      shared: true,
    },
    plantio: {
      file: "caminhos-da-floresta.mp3",
      duration: 140.488,
      peak: 0.5088,
      rms: 0.085,
      sampleRate: 44100,
      bytes: 1686822,
      title: "Caminhos da Floresta",
      bpm: 82,
      transpose: 0,
      shared: true,
    },
    cidade: {
      file: "caminhos-da-floresta.mp3",
      duration: 140.488,
      peak: 0.5088,
      rms: 0.085,
      sampleRate: 44100,
      bytes: 1686822,
      title: "Caminhos da Floresta",
      bpm: 82,
      transpose: 0,
      shared: true,
    },
  },
  effects: {
    toque: {
      file: "toque.mp3",
      duration: 0.19,
      peak: 0.2999,
      rms: 0.0601,
      sampleRate: 44100,
      bytes: 2656,
    },
    receber: {
      file: "receber.mp3",
      duration: 0.95,
      peak: 0.3339,
      rms: 0.0899,
      sampleRate: 44100,
      bytes: 10232,
    },
    "agua-liberada": {
      file: "agua-liberada.mp3",
      duration: 1.2,
      peak: 0.465,
      rms: 0.085,
      sampleRate: 44100,
      bytes: 12583,
    },
    mangueira: {
      file: "mangueira.mp3",
      duration: 3.92,
      peak: 0.3987,
      rms: 0.075,
      sampleRate: 44100,
      bytes: 40011,
      loop: true,
    },
    restaurar: {
      file: "restaurar.mp3",
      duration: 1.6,
      peak: 0.3101,
      rms: 0.09,
      sampleRate: 44100,
      bytes: 16762,
    },
    resgate: {
      file: "resgate.mp3",
      duration: 1.35,
      peak: 0.3069,
      rms: 0.09,
      sampleRate: 44100,
      bytes: 14150,
    },
    coletar: {
      file: "coletar.mp3",
      duration: 0.48,
      peak: 0.2447,
      rms: 0.0798,
      sampleRate: 44100,
      bytes: 5530,
    },
    tentar: {
      file: "tentar.mp3",
      duration: 0.4,
      peak: 0.1549,
      rms: 0.0598,
      sampleRate: 44100,
      bytes: 4746,
    },
    vitoria: {
      file: "vitoria.mp3",
      duration: 2.8,
      peak: 0.3991,
      rms: 0.09,
      sampleRate: 44100,
      bytes: 28779,
    },
    passo: {
      file: "passo.mp3",
      duration: 0.17,
      peak: 0.3139,
      rms: 0.0464,
      sampleRate: 44100,
      bytes: 2395,
    },
    nadar: {
      file: "nadar.mp3",
      duration: 0.34,
      peak: 0.3186,
      rms: 0.065,
      sampleRate: 44100,
      bytes: 4224,
    },
    plantar: {
      file: "plantar.mp3",
      duration: 0.62,
      peak: 0.2199,
      rms: 0.0697,
      sampleRate: 44100,
      bytes: 6836,
    },
  },
  credits: {
    composition:
      "Caminhos da Floresta: composição e arranjo originais para Guardião da Natureza.",
    instruments:
      "TimGM6mb — Tim Brechbill e David Bolton; renderização FluidSynth.",
  },
};


;/* jogo/encanto-natural/audio.js */
"use strict";
(() => {
  const base = new URL("./assets/", ({src:new URL("../encanto-natural/audio.js",document.baseURI).href}).src);
  const catalog = window.GuardiaoTrilha;
  const KEY = "guardiao.horizonte.preferences.v1",
    POSITION = "guardiao.audio.encanto.posicao.v1";
  const defaults = {
    music: true,
    musicVolume: 40,
    effects: true,
    effectsVolume: 60,
  };
  const clamp = (v) => Math.max(0, Math.min(100, v));
  const clean = (input) =>
    Object.fromEntries(
      Object.entries(defaults).map(([k, v]) => [
        k,
        typeof input?.[k] === typeof v &&
        (typeof v !== "number" || Number.isFinite(input[k]))
          ? typeof v === "number"
            ? clamp(input[k])
            : input[k]
          : v,
      ]),
    );
  let preferences = clean(null);
  try {
    preferences = clean(JSON.parse(localStorage.getItem(KEY) || "null"));
  } catch {}
  let context = null,
    musicGain,
    effectsGain,
    analyser,
    media = null,
    musicSource;
  let scene = "menu",
    activated = false,
    booted = false,
    leaving = false,
    playPromise = null,
    musicFailed = false,
    ducked = false,
    cinematic = false;
  let waterWanted = false,
    waterVoice = null,
    waterLoading = false,
    lastEffect = "",
    effectCount = 0;
  const buffers = new Map(),
    voices = new Set(),
    lastPlayed = new Map();
  const supported = () => !!(window.AudioContext || window.webkitAudioContext);
  const visible = () => !document.hidden && !leaving;
  const url = (type, name) => new URL(catalog[type][name].file, base).href;
  function ensureContext() {
    if (context || !supported()) return !!context;
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      context = new C();
      musicGain = context.createGain();
      effectsGain = context.createGain();
      analyser = context.createAnalyser();
      analyser.fftSize = 256;
      musicGain.gain.value = 0;
      effectsGain.gain.value = 0;
      musicGain.connect(analyser);
      effectsGain.connect(analyser);
      analyser.connect(context.destination);
      media = new Audio();
      media.preload = "none";
      media.loop = true;
      musicSource = context.createMediaElementSource(media);
      musicSource.connect(musicGain);
      media.addEventListener("error", () => {
        musicFailed = true;
      });
      media.addEventListener("loadedmetadata", () => {
        try {
          const positions = JSON.parse(
            sessionStorage.getItem(POSITION) || "{}",
          );
          const old = positions[catalog.music[scene].file];
          if (Number.isFinite(old) && old >= 0 && media.duration > 0)
            media.currentTime = old % media.duration;
        } catch {}
      });
      gains();
      return true;
    } catch {
      context = null;
      return false;
    }
  }
  function ramp(node, value, seconds = 0.12) {
    if (!node || !context) return;
    node.gain.cancelScheduledValues(context.currentTime);
    node.gain.setTargetAtTime(value, context.currentTime, seconds);
  }
  function gains() {
    ramp(
      musicGain,
      preferences.music && visible()
        ? (preferences.musicVolume / 100) * (ducked ? 0.45 : 1)
        : 0,
      0.2,
    );
    ramp(
      effectsGain,
      preferences.effects && visible() ? preferences.effectsVolume / 100 : 0,
      0.04,
    );
  }
  function savePosition() {
    if (!media || !Number.isFinite(media.currentTime) || !media.currentTime)
      return;
    try {
      const positions = JSON.parse(sessionStorage.getItem(POSITION) || "{}");
      positions[catalog.music[scene].file] = media.currentTime;
      sessionStorage.setItem(POSITION, JSON.stringify(positions));
    } catch {}
  }
  function syncMusic() {
    gains();
    if (!media) return;
    if (
      !activated ||
      cinematic ||
      !visible() ||
      !preferences.music ||
      preferences.musicVolume === 0
    ) {
      savePosition();
      media.pause();
      return;
    }
    if (musicFailed || playPromise || !booted) return;
    if (!media.src) media.src = url("music", scene);
    if (media.paused) {
      playPromise = media.play();
      if (playPromise?.catch)
        playPromise
          .catch(() => {})
          .finally(() => {
            playPromise = null;
          });
      else playPromise = null;
    }
  }
  function rememberActivation() {
    try {
      sessionStorage.setItem("guardiao.audio.liberado.v1", "1");
    } catch {}
  }
  function unlock() {
    if (!visible() || (!preferences.music && !preferences.effects)) return;
    activated = true;
    if (!ensureContext()) return;
    if (context.state !== "running" && context.state !== "closed")
      context
        .resume()
        .then(() => {
          rememberActivation();
          syncMusic();
          if (waterWanted) startWater();
        })
        .catch(() => {});
    if (context.state === "running") rememberActivation();
    syncMusic();
  }
  async function buffer(name) {
    if (!catalog.effects[name]) return null;
    if (!buffers.has(name)) {
      const promise = (async () => {
        const response = await fetch(url("effects", name));
        if (!response.ok) throw Error("Som indisponível");
        return context.decodeAudioData(await response.arrayBuffer());
      })().catch(() => null);
      buffers.set(name, promise);
    }
    return buffers.get(name);
  }
  function stopVoices() {
    for (const voice of voices)
      try {
        voice.stop();
      } catch {}
    voices.clear();
    waterVoice = null;
  }
  async function effect(name = "toque", { gain = 1, preview = false } = {}) {
    if (
      (!preferences.effects && !preview) ||
      preferences.effectsVolume === 0 ||
      !visible() ||
      !catalog.effects[name]
    )
      return;
    // Explicit preview is a gesture, but it does not change the saved mute setting.
    if (preview) {
      activated = true;
      if (!ensureContext()) return;
      context.resume().catch(() => {});
    } else if (!activated) return;
    if (!ensureContext() || voices.size >= 12) return;
    const now = performance.now(),
      interval = ["passo", "nadar"].includes(name) ? 90 : 65;
    if (now - (lastPlayed.get(name) ?? -Infinity) < interval) return;
    lastPlayed.set(name, now);
    const clip = await buffer(name);
    if (
      !clip ||
      !visible() ||
      (!preferences.effects && !preview) ||
      preferences.effectsVolume === 0 ||
      context.state !== "running"
    )
      return;
    const source = context.createBufferSource(),
      volume = context.createGain();
    source.buffer = clip;
    if (!["passo", "nadar", "mangueira"].includes(name))
      source.playbackRate.value =
        2 ** ((catalog.music[scene]?.transpose || 0) / 12);
    volume.gain.value = Math.max(0, Math.min(1, gain));
    source.connect(volume);
    volume.connect(preview && !preferences.effects ? analyser : effectsGain);
    if (preview && !preferences.effects)
      volume.gain.value *= preferences.effectsVolume / 100;
    voices.add(source);
    source.onended = () => {
      voices.delete(source);
      source.disconnect();
      volume.disconnect();
    };
    lastEffect = name;
    effectCount++;
    source.start();
  }
  async function startWater() {
    if (
      waterVoice ||
      waterLoading ||
      !waterWanted ||
      !activated ||
      !preferences.effects ||
      preferences.effectsVolume === 0 ||
      !visible() ||
      !context ||
      context.state !== "running"
    )
      return;
    waterLoading = true;
    const clip = await buffer("mangueira");
    waterLoading = false;
    if (
      !clip ||
      !waterWanted ||
      !preferences.effects ||
      preferences.effectsVolume === 0 ||
      !visible() ||
      context.state !== "running"
    )
      return;
    const source = context.createBufferSource(),
      volume = context.createGain();
    source.buffer = clip;
    source.loop = true;
    volume.gain.setValueAtTime(0, context.currentTime);
    volume.gain.linearRampToValueAtTime(0.32, context.currentTime + 0.08);
    source.connect(volume);
    volume.connect(effectsGain);
    voices.add(source);
    waterVoice = { source, volume };
    source.onended = () => {
      voices.delete(source);
      source.disconnect();
      volume.disconnect();
    };
    source.start();
  }
  function water(active) {
    waterWanted = !!active;
    if (waterWanted) {
      startWater();
      return;
    }
    if (!waterVoice) return;
    const { source, volume } = waterVoice;
    waterVoice = null;
    if (context.state === "running") {
      volume.gain.cancelScheduledValues(context.currentTime);
      volume.gain.setTargetAtTime(0, context.currentTime, 0.025);
      try {
        source.stop(context.currentTime + 0.12);
      } catch {}
    } else {
      try {
        source.stop();
      } catch {}
    }
  }
  function soundButton() {
    const button = document.getElementById("som");
    if (!button) return;
    button.setAttribute("aria-pressed", String(preferences.effects));
    button.setAttribute(
      "aria-label",
      preferences.effects
        ? "Desativar efeitos sonoros"
        : "Ativar efeitos sonoros",
    );
  }
  function update(input, { persist = false } = {}) {
    const next = clean({ ...preferences, ...input }),
      changed = Object.keys(defaults).some((k) => next[k] !== preferences[k]);
    preferences = next;
    if (persist)
      try {
        const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
        localStorage.setItem(KEY, JSON.stringify({ ...saved, ...preferences }));
      } catch {}
    if (!preferences.effects || !preferences.effectsVolume) {
      water(false);
      stopVoices();
    }
    soundButton();
    gains();
    syncMusic();
    if (waterWanted) startWater();
    if (changed)
      window.dispatchEvent(
        new CustomEvent("guardiao:audio-preferences", {
          detail: { ...preferences },
        }),
      );
  }
  function suspend() {
    savePosition();
    media?.pause();
    water(false);
    stopVoices();
    if (context?.state === "running") context.suspend().catch(() => {});
  }
  function boot() {
    if (booted) return;
    booted = true;
    const path = location.pathname;
    const id = Number(
      new URLSearchParams(location.search).get("fase") ||
        document.body.dataset.phase ||
        2,
    );
    scene = path.includes("/floresta-viva/")
      ? "floresta"
      : path.includes("/jornada/")
        ? { 2: "rio", 3: "fauna", 4: "plantio", 5: "cidade" }[id] || "menu"
        : "menu";
    const dialogs = [...document.querySelectorAll("dialog")];
    const observe = new MutationObserver(() => {
      ducked = dialogs.some((d) => d.open);
      if (ducked) water(false);
      gains();
    });
    for (const dialog of dialogs)
      observe.observe(dialog, { attributes: true, attributeFilter: ["open"] });
    ducked = dialogs.some((d) => d.open);
    soundButton();
    syncMusic();
    try {
      if (sessionStorage.getItem("guardiao.audio.liberado.v1") === "1")
        unlock();
    } catch {}
    document.getElementById("som")?.addEventListener("click", () => {
      update({ effects: !preferences.effects }, { persist: true });
      if (preferences.effects) {
        unlock();
        effect("toque");
      }
    });
  }
  document.addEventListener("pointerdown", unlock, { capture: true });
  document.addEventListener("keydown", unlock, { capture: true });
  document.addEventListener("click", (e) => {
    unlock();
    const target = e.target.closest?.('button,a,[role="tab"]');
    if (
      !target ||
      target.matches(":disabled,#preview-sound,#som,#mangueira,#ferramenta") ||
      target.closest('[aria-disabled="true"]')
    )
      return;
    effect("toque", { gain: 0.55 });
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) suspend();
    else if (activated) unlock();
  });
  window.addEventListener("pagehide", () => {
    leaving = true;
    suspend();
  });
  window.addEventListener("pageshow", () => {
    leaving = false;
    if (activated) unlock();
  });
  window.addEventListener("storage", (e) => {
    if (e.key === KEY || e.key === null) {
      try {
        update(clean(JSON.parse(localStorage.getItem(KEY) || "null")));
      } catch {}
    }
  });
  window.addEventListener("guardiao:controles", (e) => {
    if (e.detail?.preferences) update(e.detail.preferences);
  });
  window.GuardiaoAudio = Object.freeze({
    unlock,
    cinematic: (value) => {
      cinematic = !!value;
      if (cinematic) {
        water(false);
        stopVoices();
      }
      syncMusic();
    },
    update,
    effect,
    water,
    setEffects: (value) => update({ effects: !!value }, { persist: true }),
    state: () => ({
      scene,
      track: catalog.music[scene]?.title,
      source: media?.src || "",
      preferences: { ...preferences },
      activated,
      supported: supported(),
      context: context?.state || "none",
      playing:
        !!media &&
        media.readyState >= 2 &&
        !media.paused &&
        context?.state === "running",
      position: media?.currentTime || 0,
      duration: Number.isFinite(media?.duration) ? media.duration : 0,
      ducked,
      water: !!waterVoice,
      waterWanted,
      voices: voices.size,
      lastEffect,
      effectCount,
      musicFailed,
    }),
    level: () => {
      if (!analyser) return 0;
      const samples = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(samples);
      return Math.sqrt(samples.reduce((n, v) => n + v * v, 0) / samples.length);
    },
  });
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();


;/* jogo/sistemas/progresso.js */
"use strict";
(() => {
  const KEY = "guardiao.mapa.progresso.v1",
    SHARDS = "guardiao.colar.fragmentos.v1";
  let memory = null;
  function read() {
    try {
      const p = JSON.parse(localStorage.getItem(KEY) || "null");
      if (p && typeof p === "object") {
        const completed = Array.isArray(p.completed)
          ? p.completed.filter((n) => Number.isInteger(n) && n >= 1 && n <= 5)
          : p.completedFirst
            ? [1]
            : [];
        if (p.completedFirst && !completed.includes(1)) completed.push(1);
        return {
          ...p,
          completed: [...new Set(completed)],
          current: Number.isInteger(p.current)
            ? Math.max(1, Math.min(5, p.current))
            : 1,
        };
      }
    } catch {}
    return memory || { completed: [], current: 1, completedFirst: false };
  }
  function unlocked(id) {
    const s = read();
    return id === 1 || (id >= 2 && id <= 5 && s.completed.includes(id - 1));
  }
  function finish(id) {
    if (!Number.isInteger(id) || id < 1 || id > 5)
      throw new RangeError("Escolha uma das cinco fases.");
    const old = read(),
      completed = [...new Set([...old.completed, id])].sort(),
      next = {
        ...old,
        completed,
        completedFirst: completed.includes(1),
        current: Math.min(5, id + 1),
        pendingRestoration: id,
      };
    memory = next;
    let saved = true;
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      localStorage.setItem(SHARDS, JSON.stringify(completed));
    } catch {
      saved = false;
    }
    return { progress: next, saved };
  }
  window.GuardiaoProgresso = Object.freeze({ read, unlocked, finish });
})();


;/* jogo/jornada/fases.js */
"use strict";
(() => {
  const task = (id, type, x, y, name, extra = {}) => ({
    id,
    type,
    x,
    y,
    name,
    ...extra,
  });
  const common = { width: 1280, height: 720, speed: 125 };
  const phases = {
    2: {
      ...common,
      id: 2,
      name: "Rio Poluído",
      subtitle: "Cada gotinha merece cuidado",
      map: "rio",
      color: "#39b9ed",
      colorName: "azul",
      reward: "azul",
      npc: "Antônio",
      profession: "Guardião do rio",
      npcRow: 1,
      npcPosition: { x: 290, y: 198 },
      start: { x: 335, y: 213 },
      equipment: ["net", "bag"],
      equipmentText: "Rede e bolsa de coleta",
      intro: [
        "Oi, Kai! Aqui estão sua rede e sua bolsa. Vamos limpar o rio juntos!",
        "Recolha o lixo. Depois ajude os peixes e a tartaruga. Eu espero aqui!",
      ],
      hint: "Entre na água e recolha o lixo com a mão.",
      floor: [
        [125, 175],
        [320, 110],
        [450, 90],
        [600, 45],
        [980, 80],
        [1130, 180],
        [1150, 510],
        [1000, 640],
        [690, 681],
        [360, 635],
        [160, 520],
      ],
      obstacles: [
        { x: 170, y: 125, rx: 113, ry: 53 },
        { x: 458, y: 396, rx: 38, ry: 23 },
        { x: 814, y: 490, rx: 45, ry: 20 },
      ],
      water: [
        [540, 0],
        [780, 0],
        [750, 120],
        [785, 235],
        [702, 340],
        [830, 443],
        [900, 505],
        [755, 720],
        [492, 720],
        [577, 577],
        [612, 526],
        [419, 457],
        [380, 360],
        [470, 270],
        [495, 150],
      ],
      bridge: { x: 425, y: 151, w: 380, h: 42 },
      tasks: [
        ...[
          [490, 270],
          [655, 286],
          [550, 382],
          [720, 404],
          [655, 481],
          [752, 536],
          [625, 579],
          [890, 492],
        ].map(([x, y], i) =>
          task(
            "lixo" + i,
            "trash",
            x,
            y,
            [
              "Garrafa",
              "Papel",
              "Latinha",
              "Casca de fruta",
              "Garrafa",
              "Papel",
              "Latinha",
              "Casca de fruta",
            ][i],
            { icon: "trash" },
          ),
        ),
        task("peixes1", "fish", 540, 465, "Peixinhos", {
          icon: "fish",
          needs: ["lixo2", "lixo4"],
        }),
        task("peixes2", "fish", 730, 606, "Peixes do rio", {
          icon: "fish",
          needs: ["lixo5", "lixo6"],
        }),
        task("tartaruga", "turtle", 960, 430, "Tartaruga", {
          icon: "turtle",
          needs: ["lixo3", "lixo7"],
        }),
      ],
      goals: [
        ["trash", "Lixo recolhido", 8, "trash"],
        ["animal", "Amigos do rio", 3, "turtle"],
      ],
    },
    3: {
      ...common,
      id: 3,
      name: "Resgate da Fauna",
      subtitle: "Um abraço para cada amigo",
      map: "fauna",
      color: "#e9b63c",
      colorName: "amarelo",
      reward: "amarelo",
      npc: "Marina",
      profession: "Veterinária da floresta",
      npcRow: 2,
      npcPosition: { x: 330, y: 207 },
      start: { x: 375, y: 225 },
      equipment: ["net", "hand"],
      equipmentText: "Kit de cuidado e corda de resgate",
      intro: [
        "Oi, Kai! Pegue o kit e a corda. Nossos amigos precisam de você.",
        "Abra os abrigos, cuide da ave e ajude o gatinho a descer. Flora vai junto!",
      ],
      hint: "Procure os animais marcados com uma patinha.",
      floor: [
        [225, 165],
        [480, 80],
        [950, 78],
        [1115, 200],
        [1110, 535],
        [930, 636],
        [500, 653],
        [195, 558],
        [142, 385],
      ],
      obstacles: [
        { x: 175, y: 137, rx: 138, ry: 55 },
        { x: 889, y: 355, rx: 26, ry: 18 },
        { x: 455, y: 656, rx: 35, ry: 20 },
      ],
      tasks: [
        task("macaco", "cage", 936, 155, "Mico", {
          species: 1,
          icon: "paw",
          answer: "banana",
        }),
        task("tucano", "cage", 1065, 510, "Tucano", {
          species: 2,
          icon: "paw",
          answer: "fruta",
        }),
        task("gatinho", "kitten", 936, 400, "Gatinho", {
          species: 0,
          icon: "paw",
        }),
        task("ave", "bird", 304, 455, "Azulinho", { species: 3, icon: "paw" }),
      ],
      goals: [["animal", "Amigos seguros", 4, "paw"]],
    },
    4: {
      ...common,
      id: 4,
      name: "Reflorestamento",
      subtitle: "Uma semente, um novo começo",
      map: "plantio",
      color: "#7ac845",
      colorName: "verde",
      reward: "verde",
      npc: "Rafael",
      profession: "Guardião das sementes",
      npcRow: 3,
      npcPosition: { x: 332, y: 215 },
      start: { x: 375, y: 237 },
      equipment: ["seeds", "watering"],
      equipmentText: "Sementes nativas e regador",
      intro: [
        "Oi, Kai! Leve sementes e este regador. Vamos trazer o verde de volta!",
        "Plante, regue e prepare dois ninhos. A fonte enche o regador.",
      ],
      hint: "Toque na mão perto de um canteiro para plantar.",
      floor: [
        [250, 180],
        [470, 104],
        [985, 92],
        [1140, 195],
        [1145, 540],
        [950, 642],
        [435, 650],
        [160, 510],
        [130, 340],
      ],
      obstacles: [
        { x: 170, y: 130, rx: 126, ry: 62 },
        { x: 317, y: 311, rx: 57, ry: 28 },
      ],
      refill: { x: 370, y: 333 },
      tasks: [
        ...[
          [578, 209],
          [900, 158],
          [1045, 332],
          [845, 510],
          [533, 548],
          [505, 409],
        ].map(([x, y], i) =>
          task("canteiro" + i, "bed", x, y, "Canteiro " + (i + 1), {
            icon: "seeds",
          }),
        ),
        task("ninho1", "nest", 244, 427, "Ninho do ipê", { icon: "paw" }),
        task("ninho2", "nest", 1115, 477, "Ninho do sabiá", { icon: "paw" }),
      ],
      goals: [
        ["bed", "Árvores plantadas", 6, "leaf"],
        ["nest", "Ninhos preparados", 2, "paw"],
      ],
    },
    5: {
      ...common,
      id: 5,
      name: "Cidade Sustentável",
      subtitle: "Cuidar também é coisa da cidade",
      map: "cidade",
      color: "#ac83e7",
      colorName: "violeta",
      reward: "violeta",
      npc: "Luciana",
      profession: "Educadora ambiental",
      npcRow: 4,
      npcPosition: { x: 323, y: 261 },
      start: { x: 370, y: 282 },
      equipment: ["recycle", "sun"],
      equipmentText: "Bolsa de reciclagem e kit solar",
      intro: [
        "Bem-vindo, Kai! Com esta bolsa e o kit, a cidade pode ficar mais feliz.",
        "Separe o lixo, ajuste os painéis para o sol e cuide dos jardins!",
      ],
      hint: "Recolha o lixo e leve à estação de reciclagem.",
      floor: [
        [180, 250],
        [370, 170],
        [640, 140],
        [1000, 200],
        [1110, 330],
        [1090, 535],
        [946, 630],
        [525, 655],
        [225, 580],
        [130, 420],
      ],
      obstacles: [
        { x: 173, y: 145, rx: 140, ry: 90 },
        { x: 903, y: 137, rx: 128, ry: 86 },
        { x: 1077, y: 261, rx: 113, ry: 73 },
        { x: 495, y: 311, rx: 38, ry: 18 },
        { x: 1046, y: 625, rx: 35, ry: 21 },
      ],
      station: { x: 282, y: 493 },
      tasks: [
        ...[
          [420, 281],
          [690, 217],
          [947, 367],
          [785, 433],
          [622, 554],
          [361, 573],
        ].map(([x, y], i) =>
          task(
            "reciclavel" + i,
            "recycle",
            x,
            y,
            [
              "Garrafa plástica",
              "Papel",
              "Latinha",
              "Casca de fruta",
              "Papel",
              "Garrafa plástica",
            ][i],
            {
              material: [
                "plastic",
                "paper",
                "metal",
                "organic",
                "paper",
                "plastic",
              ][i],
              icon: "trash",
            },
          ),
        ),
        task("solar1", "solar", 852, 243, "Painel da escola", { icon: "sun" }),
        task("solar2", "solar", 1040, 386, "Painel da biblioteca", {
          icon: "sun",
        }),
        task("jardim1", "garden", 632, 477, "Jardim da praça", {
          icon: "leaf",
        }),
        task("jardim2", "garden", 868, 480, "Jardim das flores", {
          icon: "leaf",
        }),
      ],
      goals: [
        ["recycle", "Lixo reciclado", 6, "recycle"],
        ["solar", "Energia do sol", 2, "sun"],
        ["garden", "Jardins vivos", 2, "leaf"],
      ],
    },
  };
  window.GuardiaoFasesJogaveis = Object.freeze(phases);
})();


;/* jogo/novo-amanha/conteudo.js */
"use strict";
(() => {
  const phases = structuredClone(window.GuardiaoFasesJogaveis);
  Object.assign(phases[2], {
    equipment: ["shield", "net", "bag"],
    equipmentText: "Traje de proteção, rede e bolsa de coleta",
    intro: [
      "Oi, Kai! O rio precisa de ajuda. Leve o traje, a rede e a bolsa de coleta.",
      "Vista a proteção antes de entrar na água. Recolha o lixo e cuide dos peixes e da tartaruga comigo!",
    ],
    hint: "Use a proteção e recolha o lixo perto dos animais.",
  });
  const quiz = (question, options, answer, explanation) => ({
    question,
    options,
    answer,
    explanation,
  });
  const fauna = phases[3];
  fauna.equipment = ["paw", "rope", "hand"];
  fauna.equipmentText = "Kit veterinário, corda e luvas";
  fauna.intro = [
    "Oi, Kai! Sou Marina. Aqui estão o kit, as luvas e a corda de resgate.",
    "A chave está perto da mesa. Cada amigo precisa de um cuidado diferente. Vamos juntos!",
  ];
  for (const t of fauna.tasks) {
    if (t.id === "macaco") {
      t.name = "Mico-leão-dourado";
      t.speciesKey = "mico";
      t.needs = ["chave-abrigo"];
      t.quiz = quiz(
        "Onde o mico-leão-dourado deve viver?",
        [
          ["mata", "Na Mata Atlântica", "leaf"],
          ["gaiola", "Sempre numa gaiola", "lock"],
        ],
        "mata",
        "Isso! O mico-leão-dourado é brasileiro e precisa da Mata Atlântica protegida.",
      );
    }
    if (t.id === "tucano") {
      t.name = "Tucano-toco";
      t.speciesKey = "tucano";
      t.needs = ["chave-abrigo"];
      t.quiz = quiz(
        "Como o tucano ajuda a floresta?",
        [
          ["sementes", "Espalhando sementes", "seeds"],
          ["lixo", "Deixando lixo no chão", "trash"],
        ],
        "sementes",
        "As sementes dos frutos podem viajar com as aves e dar origem a novas árvores!",
      );
    }
    if (t.id === "ave") {
      t.name = "Passarinho ferido";
      t.speciesKey = "passaro";
      t.quiz = quiz(
        "A ave está ferida. Quem pode ajudar?",
        [
          ["marina", "Marina, a veterinária", "paw"],
          ["sozinho", "Dar um remédio sozinho", "bag"],
        ],
        "marina",
        "Marina sabe examinar a ave. Na vida real, peça ajuda a um adulto e a um profissional.",
      );
    }
  }
  fauna.tasks.unshift({
    id: "chave-abrigo",
    type: "key",
    x: 389,
    y: 277,
    name: "Chave dos abrigos",
    icon: "key",
  });
  fauna.tasks.push({
    id: "capivara",
    type: "care",
    x: 1010,
    y: 285,
    name: "Capivara",
    icon: "paw",
    speciesKey: "capivara",
    species: 0,
    quiz: quiz(
      "Qual é um bom lar para a capivara?",
      [
        ["rio", "Vegetação perto da água", "water"],
        ["rua", "Uma rua cheia de carros", "trash"],
      ],
      "rio",
      "Capivaras vivem em grupo e costumam ficar perto de rios e lagoas. Vamos devolver um lugar seguro a ela!",
    ),
  });
  fauna.goals = [
    ["key", "Chave encontrada", 1, "key"],
    ["animal", "Amigos seguros", 5, "paw"],
  ];
  const planting = phases[4];
  planting.equipment = ["shovel", "seeds", "watering"];
  planting.equipmentText = "Pá, sementes nativas, mudas e regador";
  planting.intro = [
    "Oi, Kai! Trouxe ipê, ingá e aroeira. Pegue a pá e o regador.",
    "Limpe o local, cave, plante e regue. Algumas mudas precisam de proteção. A fonte enche o regador!",
  ];
  planting.hint = "Limpe o canteiro e prepare a terra antes de plantar.";
  planting.tasks
    .filter((t) => t.type === "bed")
    .forEach((t, i) => {
      t.native = ["ipê", "ingá", "aroeira"][i % 3];
      t.protect = i % 3 === 1;
      t.terrain =
        i % 3 === 1
          ? "perto da água"
          : i % 3 === 2
            ? "solo seco"
            : "clareira com sol";
      t.name = "Canteiro de " + t.native;
    });
  const city = phases[5];
  city.intro = [
    "Oi, Kai! A comunidade quer participar. Pegue a bolsa, o kit solar e as ferramentas da praça.",
    "Separe os resíduos, cuide dos jardins e ajude os vizinhos a escolher caminhos mais sustentáveis.",
  ];
  city.equipment = ["recycle", "sun", "leaf"];
  city.equipmentText = "Bolsa de reciclagem, kit solar e kit da praça";
  city.tasks.push(
    {
      id: "ciclovia",
      type: "transport",
      x: 560,
      y: 370,
      name: "Ciclovia da comunidade",
      icon: "bike",
      quiz: quiz(
        "Para um passeio curto, qual escolha ajuda o ar?",
        [
          ["bike", "Ir de bicicleta com segurança", "bike"],
          ["car", "Usar um carro para cada pessoa", "trash"],
        ],
        "bike",
        "Bicicletas ocupam menos espaço e não soltam fumaça durante o passeio. A ciclovia deixa o trajeto mais seguro!",
      ),
    },
    {
      id: "onibus",
      type: "transport",
      x: 949,
      y: 527,
      name: "Ponto de ônibus",
      icon: "bus",
      quiz: quiz(
        "Muitas pessoas vão ao mesmo lugar. Como viajar juntas?",
        [
          ["bus", "Usar o transporte público", "bus"],
          ["car", "Cada uma num carro", "trash"],
        ],
        "bus",
        "Um ônibus pode levar muitas pessoas. Compartilhar o transporte reduz o número de carros na rua.",
      ),
    },
    {
      id: "vizinhanca",
      type: "community",
      x: 465,
      y: 454,
      name: "Mutirão da praça",
      icon: "hand",
    },
  );
  city.goals.push(
    ["transport", "Caminhos sustentáveis", 2, "bike"],
    ["community", "Vizinhos ajudados", 1, "hand"],
  );
  window.GuardiaoFasesJogaveis = Object.freeze(phases);
})();


;/* jogo/vida-em-equilibrio/conteudo.js */
"use strict";
(() => {
  const phases = structuredClone(window.GuardiaoFasesJogaveis);
  const fauna = phases[3];
  fauna.tasks = fauna.tasks.filter((t) => t.type !== "kitten");
  const quiz = (question, correct, wrong, explanation) => ({
    question,
    options: [
      ["cuidado", correct, "leaf"],
      ["risco", wrong, "trash"],
    ],
    answer: "cuidado",
    explanation,
  });
  const friends = [
    [
      "onca",
      "Onça-pintada",
      727,
      422,
      "Por que a onça precisa de uma floresta protegida?",
      "Para ter espaço, alimento e abrigo",
      "Para morar numa gaiola",
      "Ela precisa de grandes áreas naturais. Proteger a floresta protege a onça e muitas outras espécies.",
    ],
    [
      "arara",
      "Arara-azul",
      660,
      175,
      "O que ajuda a arara-azul a continuar livre?",
      "Proteger ninhos e palmeiras",
      "Comprar aves capturadas",
      "Palmeiras oferecem alimento e abrigo. A arara deve viver livre; não compre animais silvestres.",
    ],
    [
      "tamandua",
      "Tamanduá-bandeira",
      515,
      534,
      "Qual é o alimento do tamanduá-bandeira?",
      "Formigas e cupins",
      "Embalagens de comida",
      "Com seu focinho e sua língua comprida, ele encontra formigas e cupins. Fogo e estradas ameaçam seu habitat.",
    ],
    [
      "anta",
      "Anta",
      740,
      575,
      "Como a anta ajuda a floresta?",
      "Espalhando sementes dos frutos",
      "Deixando plástico pelo caminho",
      "A anta come frutos e espalha suas sementes. Por isso é conhecida como uma jardineira da floresta!",
    ],
    [
      "preguica",
      "Bicho-preguiça",
      440,
      320,
      "O que deixa o bicho-preguiça mais seguro?",
      "Árvores conectadas e preservadas",
      "Derrubar as árvores ao redor",
      "A preguiça vive nas árvores e come folhas. Copas conectadas ajudam seus deslocamentos lentos e seguros.",
    ],
  ];
  for (const [
    key,
    name,
    x,
    y,
    question,
    correct,
    wrong,
    explanation,
  ] of friends)
    fauna.tasks.push({
      id: key,
      speciesKey: key,
      type: "care",
      x,
      y,
      name,
      icon: "paw",
      quiz: quiz(question, correct, wrong, explanation),
    });
  fauna.goals = [
    ["key", "Chave encontrada", 1, "key"],
    ["animal", "Amigos seguros", 9, "paw"],
  ];
  fauna.equipmentText = "Kit veterinário, alimento e chave dos abrigos";
  fauna.intro[1] =
    "Encontre a chave e ajude os animais brasileiros. Cada amigo tem uma pergunta e um cuidado!";
  const planting = phases[4];
  planting.tasks = planting.tasks.filter((t) => t.type === "bed");
  planting.tasks.forEach((t, i) => {
    delete t.native;
    delete t.protect;
    delete t.terrain;
    t.name = "Canteiro " + (i + 1);
  });
  planting.goals = [["bed", "Plantas cuidadas", 6, "leaf"]];
  planting.equipment = ["seeds", "watering"];
  planting.equipmentText = "Mudas nativas e regador";
  planting.intro = [
    "Oi, Kai! Trouxe ipê, ingá e aroeira. Escolha as suas plantas favoritas!",
    "É só plantar e regar. Depois observe a vida crescendo. A fonte enche o regador!",
  ];
  planting.hint = "Escolha uma muda, plante e segure o regador para cuidar.";
  const city = phases[5];
  city.tasks = city.tasks.filter((t) =>
    ["recycle", "solar", "garden"].includes(t.type),
  );
  const kinds = [
    "recyclable",
    "recyclable",
    "recyclable",
    "organic",
    "residual",
    "residual",
  ];
  const names = [
    "Garrafa plástica",
    "Papel limpo",
    "Latinha",
    "Casca de fruta",
    "Papel sujo",
    "Esponja usada",
  ];
  city.tasks
    .filter((t) => t.type === "recycle")
    .forEach((t, i) => {
      t.category = kinds[i];
      t.name = names[i];
      t.material = kinds[i];
    });
  city.goals = [
    ["recycle", "Resíduos separados", 6, "recycle"],
    ["solar", "Painéis funcionando", 2, "sun"],
    ["garden", "Jardins recuperados", 2, "leaf"],
  ];
  city.intro[1] =
    "Separe os resíduos, ajuste os painéis e recupere os jardins. A cidade muda com cada cuidado!";
  window.GuardiaoFasesJogaveis = Object.freeze(phases);
})();


;/* jogo/encontros-da-floresta/atlas.js */
"use strict";
window.GuardiaoEncontrosAtlas = {
  scenes: [
    {
      id: 1,
      width: 475,
      height: 480,
      normal: "assets/encontro-1-olhar.webp",
      blink: "assets/encontro-1-piscada.webp",
    },
    {
      id: 2,
      width: 501,
      height: 470,
      normal: "assets/encontro-2-olhar.webp",
      blink: "assets/encontro-2-piscada.webp",
    },
    {
      id: 3,
      width: 496,
      height: 499,
      normal: "assets/encontro-3-olhar.webp",
      blink: "assets/encontro-3-piscada.webp",
    },
    {
      id: 4,
      width: 513,
      height: 493,
      normal: "assets/encontro-4-olhar.webp",
      blink: "assets/encontro-4-piscada.webp",
    },
    {
      id: 5,
      width: 487,
      height: 500,
      normal: "assets/encontro-5-olhar.webp",
      blink: "assets/encontro-5-piscada.webp",
    },
    {
      id: 6,
      width: 498,
      height: 445,
      normal: "assets/encontro-6-olhar.webp",
      blink: "assets/encontro-6-piscada.webp",
    },
  ],
  crystals: {
    file: "assets/relicario-cristais.webp",
    width: 688,
    height: 576,
    referenceHeight: 218,
    frames: [
      { bounds: [23, 53, 126, 223], pivot: [86.0, 276] },
      { bounds: [193, 62, 130, 214], pivot: [258.0, 276] },
      { bounds: [356, 13, 148, 263], pivot: [430.0, 276] },
      { bounds: [536, 60, 133, 216], pivot: [602.5, 276] },
      { bounds: [24, 346, 125, 218], pivot: [86.5, 564] },
    ],
  },
  mount: {
    file: "assets/montura.webp",
    width: 1024,
    height: 1536,
    pendant: [142, 565, 740, 960],
    slots: [
      [277, 723, 126, 223, 0],
      [245, 982, 130, 214, 0],
      [434, 1113, 148, 263, 0],
      [643, 982, 133, 216, 0],
      [622, 728, 125, 218, 0],
    ],
  },
};


;/* jogo/encontros-da-floresta/relicario.js */
"use strict";
(() => {
  const base = new URL("./", ({src:new URL("../encontros-da-floresta/relicario.js",document.baseURI).href}).src);
  const atlas = GuardiaoEncontrosAtlas.crystals;
  const colors = ["#ff4739", "#39b9ed", "#e9b63c", "#6acb5e", "#b98bff"];
  const names = ["vermelho", "azul", "amarelo", "verde", "violeta"];
  const mount = GuardiaoEncontrosAtlas.mount;
  const slots = mount.slots;
  const socket =
    "M52 3C77 23 91 55 86 86C81 119 56 139 49 156C41 133 14 112 14 80C14 46 41 25 52 3Z";
  let serial = 0,
    loading;
  const images = {};
  const url = new URL(atlas.file, base).href;
  function stone(index, x, y, w, h) {
    const f = atlas.frames[index],
      b = f.bounds,
      clip = "joia-" + ++serial;
    return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${b.join(" ")}" preserveAspectRatio="xMidYMid meet" overflow="hidden"><defs><clipPath id="${clip}"><rect x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}"/></clipPath></defs><image href="${url}" width="${atlas.width}" height="${atlas.height}" clip-path="url(#${clip})"/></svg>`;
  }
  function fragment(index, earned = true) {
    return `<svg class="cristal-folha" viewBox="0 0 120 180" preserveAspectRatio="xMidYMid meet" data-crystal-art="${index + 1}" aria-hidden="true">${earned ? stone(index, 8, 8, 104, 164) : `<path d="${socket}" transform="translate(10 10)" fill="#839281" stroke="#baab70" stroke-width="3"/>`}</svg>`;
  }
  function frame() {
    return `<image href="${new URL(mount.file, base).href}" width="${mount.width}" height="${mount.height}"/>`;
  }
  function gemGroups(earned, mode = "collection") {
    return slots
      .map(
        ([x, y, w, h, a], i) =>
          `<g data-relicario-pedra="${i + 1}" ${mode === "cutscene" ? `data-colar-pedra="${i + 1}"` : mode === "ending" ? `data-ending-gem="${i + 1}"` : ""} style="opacity:${earned.includes(i + 1) ? 1 : 0}"><g transform="rotate(${a} ${x + w / 2} ${y + h / 2})">${stone(i, x, y, w, h)}</g></g>`,
      )
      .join("");
  }
  function necklace(earned = [], mode = "collection") {
    const label = `Amuleto com ${earned.length} de cinco cristais`;
    return `<svg class="relicario-view${mode === "cutscene" ? " colar-view" : ""}" data-relicario="novo" viewBox="0 0 ${mount.width} ${mount.height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${label}">${frame()}${gemGroups(earned, mode)}${mode === "cutscene" ? '<g class="colar-brilho" aria-hidden="true"><path d="M0-20L5-5L20 0L5 5L0 20L-5 5L-20 0L-5-5Z" fill="#fff8d4"/></g>' : ""}</svg>`;
  }
  function load() {
    if (!loading)
      loading = Promise.all(
        [
          ["sheet", url],
          ["frame", new URL(mount.file, base).href],
        ].map(async ([name, src]) => {
          const im = new Image();
          im.src = src;
          await im.decode();
          images[name] = im;
        }),
      );
    return loading;
  }
  function paintStone(ctx, index, x, y, w, h) {
    if (!images.sheet) return;
    const b = atlas.frames[index].bounds,
      k = Math.min(w / b[2], h / b[3]);
    ctx.drawImage(
      images.sheet,
      ...b,
      x + (w - b[2] * k) / 2,
      y + (h - b[3] * k) / 2,
      b[2] * k,
      b[3] * k,
    );
  }
  function paint(ctx, x, y, height, earned) {
    if (!images.frame || !images.sheet) return;
    const [bx, by, bw, bh] = mount.pendant,
      k = height / bh;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(k, k);
    ctx.translate(-(bx + bw / 2), -(by + bh / 2));
    ctx.beginPath();
    ctx.rect(bx, by, bw, bh);
    ctx.clip();
    ctx.drawImage(images.frame, 0, 0, mount.width, mount.height);
    for (const id of earned) {
      const i = id - 1,
        [xx, yy, w, h, a] = slots[i];
      ctx.save();
      ctx.translate(xx + w / 2, yy + h / 2);
      ctx.rotate((a * Math.PI) / 180);
      paintStone(ctx, i, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
    ctx.restore();
  }
  const api = Object.freeze({
    colors,
    names,
    slots,
    mount,
    fragment,
    necklace,
    frame,
    load,
    paint,
    paintStone,
  });
  window.GuardiaoRelicario = api;
  if (window.GuardiaoColecao)
    window.GuardiaoColecao = Object.freeze({
      ...window.GuardiaoColecao,
      gem: fragment,
    });
})();


;/* jogo/cuidado-acessivel/otimizados.js */
window.GuardiaoArquivosLeves = {
  "jogo/sprites-integros/assets/campanha-animais-fauna-andando.webp":
    "jogo/cuidado-acessivel/assets/campanha-animais-fauna-andando-0648cc5f.webp",
  "jogo/sprites-integros/assets/campanha-animais-fauna.webp":
    "jogo/cuidado-acessivel/assets/campanha-animais-fauna-3c3deb4e.webp",
  "jogo/sprites-integros/assets/campanha-animais-rio.webp":
    "jogo/cuidado-acessivel/assets/campanha-animais-rio-5d8f9e74.webp",
  "jogo/sprites-integros/assets/campanha-icones.webp":
    "jogo/cuidado-acessivel/assets/campanha-icones-cac77f85.webp",
  "jogo/sprites-integros/assets/campanha-kai-floresta.webp":
    "jogo/cuidado-acessivel/assets/campanha-kai-floresta-92db5acf.webp",
  "jogo/sprites-integros/assets/campanha-kai-nadando.webp":
    "jogo/cuidado-acessivel/assets/campanha-kai-nadando-c2495454.webp",
  "jogo/sprites-integros/assets/campanha-kai-plantio.webp":
    "jogo/cuidado-acessivel/assets/campanha-kai-plantio-70084e7d.webp",
  "jogo/sprites-integros/assets/campanha-kai-rio.webp":
    "jogo/cuidado-acessivel/assets/campanha-kai-rio-3edf9612.webp",
  "jogo/sprites-integros/assets/campanha-npcs.webp":
    "jogo/cuidado-acessivel/assets/campanha-npcs-9252227c.webp",
  "jogo/sprites-integros/assets/campanha-objetos.webp":
    "jogo/cuidado-acessivel/assets/campanha-objetos-d3f46fe1.webp",
  "jogo/sprites-integros/assets/colar-kai-vestindo.webp":
    "jogo/cuidado-acessivel/assets/colar-kai-vestindo-97e7b11f.webp",
  "jogo/sprites-integros/assets/floresta-capivara.webp":
    "jogo/cuidado-acessivel/assets/floresta-capivara-d9eb3b44.webp",
  "jogo/sprites-integros/assets/floresta-carlos.webp":
    "jogo/cuidado-acessivel/assets/floresta-carlos-64f5c5eb.webp",
  "jogo/sprites-integros/assets/floresta-cervo.webp":
    "jogo/cuidado-acessivel/assets/floresta-cervo-d0926d15.webp",
  "jogo/sprites-integros/assets/floresta-itens.webp":
    "jogo/cuidado-acessivel/assets/floresta-itens-2d614081.webp",
  "jogo/sprites-integros/assets/floresta-kai-cuidados.webp":
    "jogo/cuidado-acessivel/assets/floresta-kai-cuidados-c8a4c950.webp",
  "jogo/sprites-integros/assets/floresta-kai-mangueira.webp":
    "jogo/cuidado-acessivel/assets/floresta-kai-mangueira-c1d434fb.webp",
  "jogo/sprites-integros/assets/floresta-kai-repouso.webp":
    "jogo/cuidado-acessivel/assets/floresta-kai-repouso-43d39393.webp",
  "jogo/sprites-integros/assets/floresta-natureza.webp":
    "jogo/cuidado-acessivel/assets/floresta-natureza-c7a5d40e.webp",
  "jogo/sprites-integros/assets/floresta-passaro.webp":
    "jogo/cuidado-acessivel/assets/floresta-passaro-16c77d66.webp",
  "jogo/sprites-integros/assets/vida-flora.webp":
    "jogo/cuidado-acessivel/assets/vida-flora-eced3eae.webp",
  "jogo/sprites-integros/assets/vida-fogo.webp":
    "jogo/cuidado-acessivel/assets/vida-fogo-86ec6b1a.webp",
  "jogo/sprites-integros/assets/vida-kai-andando.webp":
    "jogo/cuidado-acessivel/assets/vida-kai-andando-b7997e6d.webp",
  "jogo/sprites-integros/assets/vida-kai-mangueira.webp":
    "jogo/cuidado-acessivel/assets/vida-kai-mangueira-0d731706.webp",
  "jogo/vida-natural/assets/cidade-inicio.webp":
    "jogo/cuidado-acessivel/assets/cidade-inicio-98be532d.webp",
  "jogo/vida-natural/assets/cidade-restaurado.webp":
    "jogo/cuidado-acessivel/assets/cidade-restaurado-3df7a179.webp",
  "jogo/vida-natural/assets/fauna-inicio.webp":
    "jogo/cuidado-acessivel/assets/fauna-inicio-4d3ebb20.webp",
  "jogo/vida-natural/assets/fauna-restaurado.webp":
    "jogo/cuidado-acessivel/assets/fauna-restaurado-db7df046.webp",
  "jogo/vida-natural/assets/flora.webp":
    "jogo/cuidado-acessivel/assets/flora-6a3d0bba.webp",
  "jogo/vida-natural/assets/floresta-inicio.webp":
    "jogo/cuidado-acessivel/assets/floresta-inicio-7c89ff9a.webp",
  "jogo/vida-natural/assets/floresta-restaurado.webp":
    "jogo/cuidado-acessivel/assets/floresta-restaurado-7d31e184.webp",
  "jogo/vida-natural/assets/fogo.webp":
    "jogo/cuidado-acessivel/assets/fogo-37c8cac1.webp",
  "jogo/vida-natural/assets/kai-andando.webp":
    "jogo/cuidado-acessivel/assets/kai-andando-eee574d5.webp",
  "jogo/vida-natural/assets/kai-mangueira.webp":
    "jogo/cuidado-acessivel/assets/kai-mangueira-96f104a7.webp",
  "jogo/vida-natural/assets/plantio-inicio.webp":
    "jogo/cuidado-acessivel/assets/plantio-inicio-fd456994.webp",
  "jogo/vida-natural/assets/plantio-restaurado.webp":
    "jogo/cuidado-acessivel/assets/plantio-restaurado-88299221.webp",
  "jogo/vida-natural/assets/rio-inicio.webp":
    "jogo/cuidado-acessivel/assets/rio-inicio-66cffa0e.webp",
  "jogo/vida-natural/assets/rio-restaurado.webp":
    "jogo/cuidado-acessivel/assets/rio-restaurado-1d1819ec.webp",
  "jogo/renascimento/assets/cidade.webp":
    "jogo/cuidado-acessivel/assets/cidade-767613c3.webp",
  "jogo/renascimento/assets/fauna.webp":
    "jogo/cuidado-acessivel/assets/fauna-e7b142dd.webp",
  "jogo/renascimento/assets/floresta.webp":
    "jogo/cuidado-acessivel/assets/floresta-a3469c65.webp",
  "jogo/renascimento/assets/plantio.webp":
    "jogo/cuidado-acessivel/assets/plantio-f145e319.webp",
  "jogo/renascimento/assets/renascimento-arvores.webp":
    "jogo/cuidado-acessivel/assets/renascimento-arvores-37cf377c.webp",
  "jogo/renascimento/assets/rio.webp":
    "jogo/cuidado-acessivel/assets/rio-020f79c0.webp",
  "jogo/novo-amanha/assets/amanha-equipe-2d.webp":
    "jogo/cuidado-acessivel/assets/amanha-equipe-2d-526a1e5b.webp",
  "jogo/novo-amanha/assets/amanha-fauna-brasileira.webp":
    "jogo/cuidado-acessivel/assets/amanha-fauna-brasileira-c4a5e6ac.webp",
  "jogo/novo-amanha/assets/amanha-moradores.webp":
    "jogo/cuidado-acessivel/assets/amanha-moradores-42424491.webp",
  "jogo/novo-amanha/assets/amanha-reencontros.webp":
    "jogo/cuidado-acessivel/assets/amanha-reencontros-6cd299a8.webp",
  "jogo/novo-amanha/assets/amanha-traje-acoes.webp":
    "jogo/cuidado-acessivel/assets/amanha-traje-acoes-1143b814.webp",
  "jogo/novo-amanha/assets/amanha-traje-andar.webp":
    "jogo/cuidado-acessivel/assets/amanha-traje-andar-e77d3b21.webp",
  "jogo/novo-amanha/assets/amanha-traje-nadar.webp":
    "jogo/cuidado-acessivel/assets/amanha-traje-nadar-64bee8f0.webp",
  "jogo/novo-amanha/assets/amanha-uniforme-plantio.webp":
    "jogo/cuidado-acessivel/assets/amanha-uniforme-plantio-79cb7d38.webp",
  "jogo/novo-amanha/assets/amanha-uniforme-resgate.webp":
    "jogo/cuidado-acessivel/assets/amanha-uniforme-resgate-42f0a10d.webp",
  "jogo/novo-amanha/assets/amanha-uniforme-voluntario.webp":
    "jogo/cuidado-acessivel/assets/amanha-uniforme-voluntario-ea97a490.webp",
  "jogo/novo-amanha/assets/ilha-degradada-celular.webp":
    "jogo/cuidado-acessivel/assets/ilha-degradada-celular-7e7b1274.webp",
  "jogo/novo-amanha/assets/ilha-degradada.webp":
    "jogo/cuidado-acessivel/assets/ilha-degradada-2f17b667.webp",
  "jogo/vida-em-equilibrio/assets/equilibrio-fauna-copa.webp":
    "jogo/cuidado-acessivel/assets/equilibrio-fauna-copa-ac085f5c.webp",
  "jogo/vida-em-equilibrio/assets/equilibrio-fauna-grande.webp":
    "jogo/cuidado-acessivel/assets/equilibrio-fauna-grande-113ac762.webp",
  "jogo/vida-em-equilibrio/assets/equilibrio-kai-acoes.webp":
    "jogo/cuidado-acessivel/assets/equilibrio-kai-acoes-5d14f669.webp",
  "jogo/vida-em-equilibrio/assets/equilibrio-vida-rio.webp":
    "jogo/cuidado-acessivel/assets/equilibrio-vida-rio-2d52684c.webp",
  "jogo/vida-em-equilibrio/assets/mapa-celular.webp":
    "jogo/cuidado-acessivel/assets/mapa-celular-12d1be6a.webp",
  "jogo/vida-em-equilibrio/assets/mapa.webp":
    "jogo/cuidado-acessivel/assets/mapa-7d578b05.webp",
  "jogo/encontros-da-floresta/assets/encontro-1-olhar.webp":
    "jogo/cuidado-acessivel/assets/encontro-1-olhar-4649dacb.webp",
  "jogo/encontros-da-floresta/assets/encontro-2-olhar.webp":
    "jogo/cuidado-acessivel/assets/encontro-2-olhar-6d970e3e.webp",
  "jogo/encontros-da-floresta/assets/encontro-3-olhar.webp":
    "jogo/cuidado-acessivel/assets/encontro-3-olhar-9f28276f.webp",
  "jogo/encontros-da-floresta/assets/encontro-3-piscada.webp":
    "jogo/cuidado-acessivel/assets/encontro-3-piscada-78c3f28f.webp",
  "jogo/encontros-da-floresta/assets/encontro-4-olhar.webp":
    "jogo/cuidado-acessivel/assets/encontro-4-olhar-32422657.webp",
  "jogo/encontros-da-floresta/assets/encontro-4-piscada.webp":
    "jogo/cuidado-acessivel/assets/encontro-4-piscada-006fa341.webp",
  "jogo/encontros-da-floresta/assets/encontro-5-olhar.webp":
    "jogo/cuidado-acessivel/assets/encontro-5-olhar-022880dc.webp",
  "jogo/encontros-da-floresta/assets/montura.webp":
    "jogo/cuidado-acessivel/assets/montura-36f1684b.webp",
};


;/* jogo/raizes/atlas.js */
window.GuardiaoRaizesAtlas = {
  kai: {
    file: "assets/kai.webp",
    width: 1268,
    height: 1241,
    referenceHeight: 260.0,
    frames: [
      { bounds: [79, 21, 161, 263], pivot: [121.0, 281] },
      { bounds: [393, 21, 160, 266], pivot: [428.0, 284] },
      { bounds: [719, 20, 138, 272], pivot: [760.0, 289] },
      { bounds: [1036, 19, 145, 273], pivot: [1085.0, 289] },
      { bounds: [94, 328, 130, 275], pivot: [165.0, 600] },
      { bounds: [414, 327, 124, 275], pivot: [485.5, 599] },
      { bounds: [718, 331, 144, 271], pivot: [821.0, 599] },
      { bounds: [1039, 334, 135, 269], pivot: [1132.0, 600] },
      { bounds: [75, 639, 169, 263], pivot: [197.0, 899] },
      { bounds: [400, 639, 158, 260], pivot: [513.0, 896] },
      { bounds: [728, 638, 140, 266], pivot: [768.0, 901] },
      { bounds: [1045, 639, 142, 269], pivot: [1084.0, 905] },
      { bounds: [98, 950, 127, 265], pivot: [167.5, 1212] },
      { bounds: [410, 951, 135, 266], pivot: [482.0, 1214] },
      { bounds: [723, 952, 135, 261], pivot: [820.0, 1210] },
      { bounds: [1037, 952, 139, 263], pivot: [1149.5, 1212] },
    ],
  },
  mangueira: {
    file: "assets/mangueira.webp",
    width: 1268,
    height: 1241,
    referenceHeight: 263.5,
    frames: [
      {
        bounds: [77, 18, 165, 268],
        pivot: [121.0, 283],
        nozzle: [225.4516129032258, 136.67741935483872],
      },
      {
        bounds: [393, 18, 165, 271],
        pivot: [429.0, 286],
        nozzle: [542.3620689655172, 135.51724137931035],
      },
      {
        bounds: [718, 19, 151, 274],
        pivot: [758.0, 290],
        nozzle: [852.562496814148, 120.52573847996976],
      },
      {
        bounds: [1040, 19, 145, 275],
        pivot: [1083.0, 291],
        nozzle: [1169.207034629274, 116.07867965644036],
      },
      {
        bounds: [100, 326, 120, 277],
        pivot: [166.0, 600],
        nozzle: [129.05405405405406, 412.0],
      },
      {
        bounds: [419, 325, 123, 277],
        pivot: [486.0, 599],
        nozzle: [442.6388888888889, 415.94444444444446],
      },
      {
        bounds: [707, 330, 155, 272],
        pivot: [820.0, 599],
        nozzle: [723.8786796564403, 416.25367965644034],
      },
      {
        bounds: [1024, 333, 151, 269],
        pivot: [1133.0, 599],
        nozzle: [1040.145346323107, 422.76756854532925],
      },
      {
        bounds: [71, 640, 174, 263],
        pivot: [199.0, 900],
        nozzle: [86.88888888888889, 755.2407407407408],
      },
      {
        bounds: [390, 641, 170, 259],
        pivot: [508.0, 897],
        nozzle: [404.75409836065575, 755.0819672131147],
      },
      {
        bounds: [712, 640, 161, 264],
        pivot: [767.0, 901],
        nozzle: [734.5286796564403, 784.5213203435596],
      },
      {
        bounds: [1040, 641, 154, 270],
        pivot: [1083.0, 908],
        nozzle: [1062.617810091223, 796.382189908777],
      },
      {
        bounds: [98, 948, 125, 268],
        pivot: [168.0, 1213],
        nozzle: [160.0204081632653, 1121.938775510204],
      },
      {
        bounds: [412, 948, 129, 271],
        pivot: [483.0, 1216],
        nozzle: [475.44827586206895, 1122.6896551724137],
      },
      {
        bounds: [720, 952, 139, 263],
        pivot: [818.0, 1212],
        nozzle: [831.9908855609509, 1114.6430594739943],
      },
      {
        bounds: [1031, 952, 148, 267],
        pivot: [1153.0, 1216],
        nozzle: [1155.3471267951725, 1124.2180945371078],
      },
    ],
  },
  flora: {
    file: "assets/flora.webp",
    width: 1448,
    height: 1086,
    referenceHeight: 232.0,
    frames: [
      { bounds: [57, 85, 228, 251], pivot: [171.0, 333] },
      { bounds: [369, 87, 324, 192], pivot: [531.0, 276] },
      { bounds: [758, 61, 297, 224], pivot: [906.5, 282] },
      { bounds: [1161, 45, 245, 247], pivot: [1283.5, 289] },
      { bounds: [84, 435, 228, 254], pivot: [198.0, 686] },
      { bounds: [390, 434, 316, 198], pivot: [548.0, 629] },
      { bounds: [754, 415, 296, 220], pivot: [902.0, 632] },
      { bounds: [1130, 406, 258, 244], pivot: [1259.0, 647] },
      { bounds: [82, 794, 192, 238], pivot: [178.0, 1029] },
      { bounds: [445, 793, 191, 238], pivot: [540.5, 1028] },
      { bounds: [789, 787, 249, 245], pivot: [913.5, 1029] },
      { bounds: [1128, 775, 280, 221], pivot: [1268.0, 993] },
    ],
  },
  npcs: {
    file: "assets/npcs.webp",
    width: 1983,
    height: 793,
    referenceHeight: 375.5,
    frames: [
      { bounds: [187, 6, 186, 382], pivot: [304.0, 385] },
      { bounds: [517, 8, 228, 380], pivot: [666.5, 385] },
      { bounds: [910, 5, 189, 383], pivot: [1012.0, 385] },
      { bounds: [1226, 10, 201, 379], pivot: [1373.0, 386] },
      { bounds: [1620, 16, 171, 373], pivot: [1729.0, 386] },
      { bounds: [129, 402, 250, 385], pivot: [299.0, 784] },
      { bounds: [494, 405, 256, 382], pivot: [662.0, 784] },
      { bounds: [850, 401, 248, 386], pivot: [1012.0, 784] },
      { bounds: [1212, 406, 237, 381], pivot: [1369.0, 784] },
      { bounds: [1586, 412, 208, 375], pivot: [1732.0, 784] },
    ],
  },
  acoes: {
    file: "assets/acoes.webp",
    width: 1774,
    height: 887,
    referenceHeight: 420.0,
    frames: [
      { bounds: [135, 5, 183, 426], pivot: [206.5, 428] },
      { bounds: [571, 5, 183, 425], pivot: [644.0, 427] },
      { bounds: [949, 117, 243, 306], pivot: [1060.0, 420] },
      { bounds: [1434, 5, 235, 426], pivot: [1504.0, 428] },
      { bounds: [130, 454, 183, 417], pivot: [208.0, 868] },
      { bounds: [534, 461, 232, 410], pivot: [638.0, 868] },
      { bounds: [966, 453, 247, 418], pivot: [1072.0, 868] },
      { bounds: [1408, 551, 273, 319], pivot: [1602.0, 867] },
    ],
  },
};


;/* jogo/raizes/personagens.js */
"use strict";
(() => {
  const base = new URL("./", ({src:new URL("../raizes/personagens.js",document.baseURI).href}).src),
    atlas = window.GuardiaoRaizesAtlas;
  const images = new Map(),
    promises = new Map();
  async function load(names = ["kai", "flora", "npcs", "acoes"]) {
    await Promise.all(
      names.map((name) => {
        if (!promises.has(name))
          promises.set(
            name,
            (async () => {
              const im = new Image();
              im.src = new URL(atlas[name].file, base);
              await im.decode();
              if (
                im.naturalWidth !== atlas[name].width ||
                im.naturalHeight !== atlas[name].height
              )
                throw Error("Quadro inválido: " + name);
              images.set(name, im);
            })(),
          );
        return promises.get(name);
      }),
    );
  }
  function draw(ctx, name, index, x, y, height, options = {}) {
    const d = atlas[name],
      im = images.get(name);
    if (!im) return false;
    const f = d.frames[(index + d.frames.length) % d.frames.length],
      b = f.bounds,
      k = height / d.referenceHeight;
    ctx.save();
    ctx.globalAlpha *= options.alpha ?? 1;
    ctx.translate(x, y);
    if (options.flip) ctx.scale(-1, 1);
    ctx.rotate(options.angle || 0);
    ctx.drawImage(
      im,
      ...b,
      (b[0] - f.pivot[0]) * k,
      (b[1] - f.pivot[1]) * k,
      b[2] * k,
      b[3] * k,
    );
    ctx.restore();
    return true;
  }
  function canvas(canvas, paint) {
    const r = canvas.getBoundingClientRect(),
      dpr = Math.min(devicePixelRatio || 1, 1.5);
    if (
      canvas.width !== Math.round(r.width * dpr) ||
      canvas.height !== Math.round(r.height * dpr)
    ) {
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
    }
    const c = canvas.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, r.width, r.height);
    paint(c, r.width, r.height);
  }
  function owl(ctx, x, y, h, t, mode = "voo", flip = false) {
    if (document.body.classList.contains("reduce-motion")) t = 0;
    let frame =
      mode === "voo"
        ? Math.floor(t * 9) % 4
        : mode === "festa"
          ? 11
          : mode === "fala"
            ? 10
            : t % 4.8 > 4.5
              ? 9
              : 8;
    draw(ctx, "flora", frame, x, y, h, { flip });
  }
  window.RaizesPersonagens = { load, draw, canvas, owl, atlas, images };
})();


;/* jogo/viva/comum.js */
"use strict";
(() => {
  const base = new URL("./", ({src:new URL("comum.js",document.baseURI).href}).src),
    root = new URL("../../", base);
  const key = "guardiao.horizonte.preferences.v1",
    generation = "guardiao.jornada.geracao.v1";
  const defaults = {
    music: true,
    musicVolume: 40,
    effects: true,
    effectsVolume: 60,
    controlMode: "auto",
    largeText: false,
    reduceMotion: false,
    fallingLeaves: true,
    leftHanded: false,
    controlSize: 0,
    contextHints: true,
    screenTransitions: true,
    graphicsQuality: "equilibrada",
    highContrast: false,
    showKeyHelp: true,
  };
  const paths = {
    back: "M19 12H5m6-6-6 6 6 6",
    play: "m9 5 11 7-11 7Z",
    leaf: "M20 3C7 2 2 9 5 18c9 3 16-2 15-15ZM3 21 16 8",
    book: "M12 6C8 3 4 3 2 5v14c4-2 7-1 10 1m0-14c4-3 8-3 10-1v14c-4-2-7-1-10 1Z",
    gear: "m9 3-1 3-3 1-2 3 2 2-1 3 3 3 3-1 2 2 3-1 1-3 3-2-1-3 1-3-3-1-2-3Z M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
    paw: "M8 14c-7 7-3 9 1 7l3-1 3 1c4 2 8 0 1-7-3-3-5-3-8 0ZM5 6c-3 1-1 7 1 6s2-7-1-6Zm5-4c-3 0-3 7 0 7s3-7 0-7Zm5 0c-3 0-3 7 0 7s3-7 0-7Zm5 4c-3-1-4 5-2 6s5-5 2-6",
    water: "M12 2C8 9 4 12 4 16a8 8 0 0 0 16 0c0-4-4-7-8-14Z",
    fire: "M13 2c3 7 7 9 7 14a8 8 0 0 1-16 0c0-4 3-7 5-8-1 5 2 6 3 3 1-2 1-6 1-9Z",
    bag: "M7 7V5a5 5 0 0 1 10 0v2M5 7h14l2 14H3ZM8 13h8v5H8Z",
    hand: "M8 12V5a1.5 1.5 0 0 1 3 0v6-8a1.5 1.5 0 0 1 3 0v8-7a1.5 1.5 0 0 1 3 0v8-5a1.5 1.5 0 0 1 3 0v7c0 4-2 7-6 7h-2c-3 0-4-2-6-4l-3-4a1.5 1.5 0 0 1 2-2l3 2",
    hose: "M4 19c-4-3-1-8 4-7s6 9 11 5M8 12l2-4 7 4-2 4Zm3-5 2-3 7 4-2 3M20 3l2-1m-1 5h2m-3 4 2 1",
    tree: "M12 22V10M6 21h12M12 3C4-2-2 9 5 12c-6 7 8 10 8 4 7 6 13-6 6-7 4-5-4-11-7-6",
    check: "m5 12 4 4 10-10",
    close: "m6 6 12 12M18 6 6 18",
    full: "M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5",
    exit: "M8 3v5H3m13-5v5h5M3 16h5v5m13-5h-5v5",
    sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2",
  };
  paths.trash = "M5 6h14M9 6V3h6v3M7 6l1 15h8l1-15M10 10v7M14 10v7";
  paths.key =
    "M15 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM11.5 11.5 3 20m3-3 3 3m0-6 3 3";
  paths.net =
    "M13 3c12 0 12 14 0 14S1 3 13 3ZM8 14 2 22m7-16 7 8m0-8-7 8M6 10h14";
  paths.seeds =
    "M8 16c-9-5-4-14 2-10 4 3 2 8-2 10Zm9-4c-7-1-7-9-1-10 6 2 6 7 1 10ZM15 22c-7-2-6-9 0-9 7 1 7 7 0 9Z";
  paths.plant =
    "M12 22V11m0 5C2 17 1 7 3 6c6-1 10 3 9 10Zm0-4c0-9 6-11 10-10 1 8-3 12-10 10Z";
  paths.gear =
    Array.from({ length: 32 }, (_, i) => {
      const a = (i * Math.PI) / 16,
        r = [8.2, 10.5, 10.5, 8.2][i % 4];
      return (
        (i ? "L" : "M") +
        (12 + Math.cos(a) * r).toFixed(2) +
        " " +
        (12 + Math.sin(a) * r).toFixed(2)
      );
    }).join("") + "Z M15.4 12a3.4 3.4 0 1 1-6.8 0 3.4 3.4 0 0 1 6.8 0";
  const aliases = {
    watering: "water",
    seedling: "plant",
    flower: "plant",
    shovel: "plant",
    rope: "leaf",
    lock: "bag",
    help: "book",
    recycle: "trash",
    solar: "sun",
  };
  const icon = (name) =>
    `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[aliases[name] || name] || paths.leaf}"/></svg>`;
  function prefs() {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(key) || "{}") };
    } catch {
      return { ...defaults };
    }
  }
  function apply(p = prefs()) {
    document.documentElement.classList.toggle("large-text", p.largeText);
    document.body.classList.toggle(
      "reduce-motion",
      p.reduceMotion || matchMedia("(prefers-reduced-motion:reduce)").matches,
    );
    document.body.classList.toggle("left-handed", p.leftHanded);
    document.body.classList.toggle("high-contrast", p.highContrast);
    document.body.classList.toggle("hide-key-help", !p.showKeyHelp);
    document.body.dataset.graphics = p.graphicsQuality || "equilibrada";
    window.GuardiaoAudio?.update(p);
    window.GuardiaoControles?.refresh(p);
  }
  function save(next) {
    const p = { ...prefs(), ...next };
    try {
      localStorage.setItem(key, JSON.stringify(p));
    } catch {
      notice("Os ajustes valem nesta sessão.");
    }
    apply(p);
    window.dispatchEvent(
      new CustomEvent("guardiao:preferencias", { detail: p }),
    );
    return p;
  }
  let noticeTimer;
  function notice(text) {
    let el = document.getElementById("raizes-status");
    if (!el) {
      el = document.createElement("p");
      el.id = "raizes-status";
      el.setAttribute("role", "status");
      document.body.append(el);
    }
    el.textContent = text;
    el.hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => (el.hidden = true), 3600);
  }
  function settingsMarkup() {
    const p = prefs();
    const toggle = (id, title, help) =>
      `<label class="ra-setting"><span><strong>${title}</strong>${help ? `<small>${help}</small>` : ""}</span><input type="checkbox" name="${id}" ${p[id] ? "checked" : ""} role="switch"></label>`;
    const volume = (id, title) =>
      `<label class="ra-volume"><span>${title}</span><input type="range" name="${id}" value="${p[id]}" min="0" max="100"><output>${p[id]}%</output></label>`;
    return `<div class="ra-tabs" role="tablist" aria-label="Categorias de ajustes"><button type="button" role="tab" aria-selected="true" data-setting-tab="audio">Áudio</button><button type="button" role="tab" aria-selected="false" data-setting-tab="conforto">Conforto</button><button type="button" role="tab" aria-selected="false" data-setting-tab="controles">Controles</button><button type="button" role="tab" aria-selected="false" data-setting-tab="imagem">Imagem</button></div><div class="ra-settings-body"><section data-setting-panel="audio">${toggle("music", "Música", "Uma trilha calma para a aventura.")}${volume("musicVolume", "Volume da música")}${toggle("effects", "Efeitos sonoros", "Água, passos e descobertas.")}${volume("effectsVolume", "Volume dos efeitos")}<div class="audio-preview"><span aria-hidden="true">${window.VivaSimbolos?.markup("water") || ""}</span><div><strong>Escute um cuidado</strong><p>Teste o volume antes de explorar.</p></div><button type="button" data-audio-preview>Testar efeitos</button><output data-preview-status aria-live="polite"></output></div></section><section data-setting-panel="conforto" hidden>${toggle("largeText", "Texto maior", "Mais conforto para ler.")}${toggle("reduceMotion", "Menos movimento", "Animações suaves, sem balanços.")}${toggle("highContrast", "Painéis mais nítidos", "Fundo firme e contraste reforçado.")}${toggle("contextHints", "Dicas da Flora", "Orientações curtas quando precisar.")}</section><section data-setting-panel="controles" hidden><label class="ra-mode"><strong>Como você quer jogar?</strong><select name="controlMode"><option value="auto">Detectar dispositivo</option><option value="keyboard">Computador · teclado</option><option value="touch">Celular · toque</option></select></label>${toggle("leftHanded", "Joystick à direita", "")}${toggle("showKeyHelp", "Lembrete dos comandos", "Legenda curta durante a exploração.")}${volume("controlSize", "Tamanho dos controles")}<p class="ra-help">WASD ou setas: mover · Enter: cuidar<br>Espaço: equipamento · B: mochila · Esc: pausa</p></section><section data-setting-panel="imagem" hidden><label class="ra-mode"><strong>Qualidade gráfica</strong><select name="graphicsQuality"><option value="leve">Leve · para aparelhos mais simples</option><option value="equilibrada">Equilibrada</option><option value="alta">Mais detalhes</option></select><small>Ajusta a resolução de desenho e a quantidade de folhas.</small></label>${toggle("fallingLeaves", "Folhas caindo", "Movimento natural pela floresta.")}${toggle("screenTransitions", "Transições de tela", "Uma passagem suave entre os caminhos.")}<p class="ra-help">Menos movimento, na aba Conforto, também reduz os efeitos.</p></section></div>`;
  }
  function bindSettings(el) {
    el.innerHTML = settingsMarkup();
    for (const name of ["controlMode", "graphicsQuality"])
      el.querySelector(`[name="${name}"]`).value = prefs()[name];
    el.addEventListener("click", (e) => {
      if (e.target.closest("[data-audio-preview]")) {
        window.GuardiaoAudio?.effect("agua-liberada", { preview: true });
        el.querySelector("[data-preview-status]").textContent = "Som da água";
        return;
      }
      const b = e.target.closest("[data-setting-tab]");
      if (!b) return;
      el.querySelectorAll("[data-setting-tab]").forEach((t) =>
        t.setAttribute("aria-selected", String(t === b)),
      );
      el.querySelectorAll("[data-setting-panel]").forEach((p) => {
        p.hidden = p.dataset.settingPanel !== b.dataset.settingTab;
        if (!p.hidden && !document.body.classList.contains("reduce-motion"))
          p.animate(
            [
              { opacity: 0, transform: "translateY(6px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            { duration: 220 },
          );
      });
      el.querySelector(".ra-settings-body").scrollTop = 0;
      window.dispatchEvent(
        new CustomEvent("viva:settings-tab", { detail: b.dataset.settingTab }),
      );
    });
    el.addEventListener("input", (e) => {
      const input = e.target;
      if (!input.name) return;
      const value =
        input.type === "checkbox"
          ? input.checked
          : input.type === "range"
            ? Number(input.value)
            : input.value;
      save({ [input.name]: value });
      if (input.type === "range") input.nextElementSibling.value = value + "%";
    });
    el.addEventListener("keydown", (e) => {
      if (e.defaultPrevented) return;
      if (e.key === "Enter" && e.target.matches('input[type="checkbox"]')) {
        e.preventDefault();
        e.target.click();
      }
      const b = e.target.closest("[data-setting-tab]");
      if (b && ["ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const tabs = [...el.querySelectorAll("[data-setting-tab]")],
          i = tabs.indexOf(b),
          next =
            tabs[
              (i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length
            ];
        next.click();
        next.focus();
      }
    });
  }
  function fullDocument() {
    try {
      if (parent !== window && parent.GuardiaoJanela?.frame)
        return parent.document;
    } catch {}
    return document;
  }
  const full = () => {
    const owner = fullDocument();
    return !!(owner.fullscreenElement || owner.webkitFullscreenElement);
  };
  let pending = false;
  function syncFull() {
    document.querySelectorAll("[data-fullscreen]").forEach((b) => {
      b.innerHTML =
        window.GuardiaoHUD?.fullIcon(full()) || icon(full() ? "exit" : "full");
      b.title = full() ? "Sair da tela cheia" : "Entrar em tela cheia";
      b.setAttribute("aria-label", b.title);
      b.setAttribute("aria-pressed", String(full()));
      b.disabled = pending;
    });
  }
  async function toggleFull() {
    if (pending) return;
    pending = true;
    syncFull();
    try {
      const owner = fullDocument();
      if (full()) {
        const fn = owner.fullscreenElement
          ? owner.exitFullscreen || owner.webkitExitFullscreen
          : owner.webkitExitFullscreen || owner.exitFullscreen;
        await fn.call(owner);
        screen.orientation?.unlock?.();
      } else {
        const fn =
          owner.documentElement.requestFullscreen ||
          owner.documentElement.webkitRequestFullscreen;
        if (!fn) throw Error();
        await fn.call(owner.documentElement);
        if (navigator.maxTouchPoints)
          try {
            await screen.orientation?.lock("landscape");
          } catch {}
      }
    } catch {
      notice(
        "Este navegador não abriu a tela cheia. Você pode adicionar o jogo à tela inicial pelo menu do celular.",
      );
    } finally {
      pending = false;
      syncFull();
    }
  }
  function bindFull(b) {
    b.dataset.fullscreen = "";
    b.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        toggleFull();
      },
      { capture: true },
    );
    syncFull();
  }
  function won() {
    return [1, 2, 3, 4, 5].every((id) =>
      window.GuardiaoProgresso?.read().completed.includes(id),
    );
  }
  function reset() {
    const keys = Object.keys(localStorage).filter((k) =>
      /^guardiao\.(mapa\.progresso|colar\.fragmentos|amanha\.memoria|floresta-viva|jornada\.fase\.\d+|area-aberta\.floresta|(?:raizes|viva)\.final)\.v\d+$/.test(
        k,
      ),
    );
    const backup = keys.map((k) => [k, localStorage.getItem(k)]);
    try {
      keys.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(generation, crypto.randomUUID());
      activeGeneration = localStorage.getItem(generation);
      document.dispatchEvent(new CustomEvent("guardiao:neutralizar"));
      resetDialog?.close();
      freshHome();
    } catch {
      for (const [k, v] of backup)
        try {
          localStorage.setItem(k, v);
        } catch {}
      notice("Não foi possível reiniciar. Tente novamente.");
    }
  }
  const readGeneration = () => {
    try {
      return localStorage.getItem(generation) || "";
    } catch {
      return "";
    }
  };
  let activeGeneration = readGeneration();
  const stale = () => readGeneration() !== activeGeneration;
  const freshHome = () => {
    const home = new URL("index.html#inicio", base),
      samePage =
        home.origin === location.origin &&
        home.pathname === location.pathname &&
        home.search === location.search;
    location.replace(home);
    // Trocar apenas o hash preservaria inventário e restauração em memória.
    if (samePage) location.reload();
  };
  window.addEventListener("pageshow", () => {
    if (stale()) freshHome();
  });
  window.addEventListener("storage", (e) => {
    if (e.key === generation && stale()) {
      document.dispatchEvent(new CustomEvent("guardiao:neutralizar"));
      freshHome();
    }
  });
  for (const [target, event] of [
    [window, "pagehide"],
    [document, "visibilitychange"],
  ])
    target.addEventListener(
      event,
      (e) => {
        if (stale()) e.stopImmediatePropagation();
      },
      { capture: true },
    );
  let resetDialog;
  function askReset() {
    if (!resetDialog) {
      resetDialog = document.createElement("dialog");
      resetDialog.className = "ra-dialog ra-reset nova-jornada";
      resetDialog.id = "ra-reset";
      resetDialog.setAttribute("aria-labelledby", "ra-reset-title");
      resetDialog.setAttribute(
        "aria-describedby",
        "ra-reset-description ra-reset-preferences",
      );
      resetDialog.innerHTML = `<img class="recomeco-art" src="${new URL("../recomeco/assets/painel.webp", base).href}" width="1774" height="887" alt="" aria-hidden="true" decoding="async">
        <header class="recomeco-heading"><p class="eyebrow">UMA NOVA JORNADA</p><h2 id="ra-reset-title">Começar do início?</h2></header>
        <p id="ra-reset-description">As cinco fases, os itens e os cristais serão reiniciados. A ilha volta ao estado inicial.</p>
        <p id="ra-reset-preferences">Áudio e controles continuam do seu jeito.</p>
        <div class="ra-dialog-actions"><button type="button" data-cancel autofocus>Continuar por aqui</button><button type="button" class="primary" data-confirm>Sim, recomeçar</button></div>`;
      document.body.append(resetDialog);
      resetDialog.querySelector("[data-cancel]").onclick = () =>
        resetDialog.close();
      resetDialog.querySelector("[data-confirm]").onclick = reset;
    }
    resetDialog.showModal();
  }
  window.Raizes = {
    root,
    base,
    icon,
    prefs,
    save,
    apply,
    notice,
    bindSettings,
    bindFull,
    toggleFull,
    won,
    askReset,
  };
  window.GuardiaoTela = {
    toggle: toggleFull,
    enter: () => (full() ? Promise.resolve() : toggleFull()),
    state: () => ({ fullscreen: full(), pending }),
  };
  window.addEventListener("guardiao:fullscreen", syncFull);
  for (const event of ["fullscreenchange", "webkitfullscreenchange"])
    document.addEventListener(event, syncFull);
  document.addEventListener("DOMContentLoaded", () => {
    apply();
    document.querySelectorAll("[data-fullscreen]").forEach(bindFull);
  });
})();


;/* jogo/viva/atlas.js */
window.VivaAtlas = {
  encontros: {
    file: "assets/encontros.webp",
    width: 1448,
    height: 1086,
    cols: 2,
    rows: 3,
  },
  "final-kai": {
    file: "assets/final-kai.webp",
    width: 1246,
    height: 1263,
    referenceHeight: 557,
    frames: [
      { bounds: [185, 14, 229, 557], pivot: [299.5, 569] },
      { bounds: [775, 14, 292, 557], pivot: [921.0, 569] },
      { bounds: [188, 639, 229, 563], pivot: [302.5, 1200] },
      { bounds: [753, 638, 320, 563], pivot: [913.0, 1199] },
    ],
  },
  folhas: {
    file: "assets/folhas.webp",
    width: 1000,
    height: 500,
    referenceHeight: 180,
    frames: [
      { bounds: [56, 49, 150, 180], pivot: [131.0, 227] },
      { bounds: [303, 55, 170, 176], pivot: [388.0, 229] },
      { bounds: [615, 37, 64, 203], pivot: [647.0, 238] },
      { bounds: [803, 75, 156, 141], pivot: [881.0, 214] },
      { bounds: [51, 275, 157, 194], pivot: [129.5, 467] },
      { bounds: [265, 325, 235, 106], pivot: [382.5, 429] },
      { bounds: [557, 279, 162, 190], pivot: [638.0, 467] },
      { bounds: [840, 307, 105, 148], pivot: [892.5, 453] },
    ],
  },
  professor: {
    file: "assets/professor.webp",
    width: 1448,
    height: 1086,
    referenceHeight: 347,
    frames: [
      { bounds: [11, 11, 327, 347], pivot: [174.5, 356] },
      { bounds: [373, 11, 327, 347], pivot: [536.5, 356] },
      { bounds: [735, 11, 327, 347], pivot: [898.5, 356] },
      { bounds: [1097, 11, 326, 347], pivot: [1260.0, 356] },
      { bounds: [15, 369, 347, 341], pivot: [188.5, 708] },
      { bounds: [376, 369, 348, 341], pivot: [550.0, 708] },
      { bounds: [738, 369, 348, 341], pivot: [912.0, 708] },
      { bounds: [1100, 369, 348, 341], pivot: [1274.0, 708] },
      { bounds: [8, 724, 349, 343], pivot: [182.5, 1065] },
      { bounds: [370, 724, 349, 343], pivot: [544.5, 1065] },
      { bounds: [732, 724, 349, 343], pivot: [906.5, 1065] },
      { bounds: [1094, 724, 349, 343], pivot: [1268.5, 1065] },
    ],
  },
};


;/* jogo/viva/arte.js */
"use strict";
(() => {
  const base = new URL("./", ({src:new URL("arte.js",document.baseURI).href}).src),
    old = RaizesPersonagens,
    atlas = VivaAtlas,
    images = new Map(),
    promises = new Map();
  async function load(names) {
    await Promise.all(
      names.map((name) => {
        if (!atlas[name]) return old.load([name]);
        if (!promises.has(name))
          promises.set(
            name,
            (async () => {
              const im = new Image();
              im.src = new URL(atlas[name].file, base);
              await im.decode();
              images.set(name, im);
            })(),
          );
        return promises.get(name);
      }),
    );
  }
  function canvas(el, paint) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const quality = Raizes.prefs().graphicsQuality,
      cap = quality === "leve" ? 1 : quality === "alta" ? 2 : 1.5,
      dpr = Math.min(devicePixelRatio || 1, cap);
    if (
      el.width !== Math.round(r.width * dpr) ||
      el.height !== Math.round(r.height * dpr)
    ) {
      el.width = Math.round(r.width * dpr);
      el.height = Math.round(r.height * dpr);
    }
    const ctx = el.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, r.width, r.height);
    paint(ctx, r.width, r.height);
  }
  function draw(ctx, name, index, x, y, height, options = {}) {
    if (!atlas[name]) return old.draw(ctx, name, index, x, y, height, options);
    const d = atlas[name],
      im = images.get(name);
    if (!im) return;
    const f = d.frames[index % d.frames.length],
      b = f.bounds,
      k = height / d.referenceHeight;
    ctx.save();
    ctx.globalAlpha *= options.alpha ?? 1;
    ctx.translate(x, y);
    if (options.flip) ctx.scale(-1, 1);
    ctx.rotate(options.angle || 0);
    ctx.drawImage(
      im,
      ...b,
      (b[0] - f.pivot[0]) * k,
      (b[1] - f.pivot[1]) * k,
      b[2] * k,
      b[3] * k,
    );
    ctx.restore();
  }
  function scenery(ctx, index, w, h) {
    const im = images.get("encontros");
    if (!im) return;
    const sw = im.width / 2,
      sh = im.height / 3,
      scale = Math.max(w / sw, h / sh),
      vw = w / scale,
      vh = h / scale;
    ctx.drawImage(
      im,
      (index % 2) * sw + (sw - vw) / 2,
      Math.floor(index / 2) * sh + (sh - vh) / 2,
      vw,
      vh,
      0,
      0,
      w,
      h,
    );
  }
  function friends(ctx, w, h, time, scene = false) {
    if (scene) scenery(ctx, 5, w, h);
    const hh = Math.min(h * 0.92, w * 1.3),
      x = w * 0.38,
      y = h * 0.94;
    old.draw(ctx, "acoes", 1, x, y, hh);
    old.owl(ctx, w * 0.79, h * 0.49, hh * 0.22, time, "ombro", true);
  }
  function meeting(ctx, w, h, phase, t, reserve = 42) {
    scenery(ctx, phase - 1, w, h);
    const hh = Math.min((h - reserve) * 0.88, w * 0.63),
      y = h - reserve - 7;
    ctx.fillStyle = "#332c2522";
    for (const x of [w * 0.27, w * 0.74]) {
      ctx.beginPath();
      ctx.ellipse(x, y, hh * 0.18, hh * 0.04, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    old.draw(ctx, "acoes", 0, w * 0.27, y, hh * 0.9);
    old.draw(
      ctx,
      "npcs",
      phase -
        1 +
        (document.body.classList.contains("reduce-motion")
          ? 0
          : Math.sin(t * 0.8) > 0.6
            ? 5
            : 0),
      w * 0.74,
      y,
      hh,
    );
    old.owl(ctx, w * 0.49, y - hh * 0.7, hh * 0.22, t, "voo", true);
  }
  window.VivaArt = {
    base,
    atlas,
    images,
    load,
    canvas,
    draw,
    scenery,
    friends,
    meeting,
    owl: old.owl,
  };
})();


;/* jogo/vida-em-equilibrio/progresso.js */
"use strict";
(() => {
  const KEY = "guardiao.amanha.memoria.v1";
  const items = [
    [
      "mangueira",
      "Mangueira de Carlos",
      "water",
      1,
      "Abra o registro e segure ÁGUA perto dos focos.",
    ],
    [
      "luvas",
      "Luvas de cuidado",
      "hand",
      1,
      "Protegem as mãos de Kai durante os cuidados da aventura.",
    ],
    [
      "kit",
      "Kit de resgate",
      "paw",
      1,
      "Ajuda os animais depois que o caminho está seguro.",
    ],
    [
      "rede",
      "Rede do rio",
      "net",
      2,
      "Recolhe resíduos e ajuda no cuidado dos peixes.",
    ],
    [
      "saco",
      "Bolsa de coleta",
      "bag",
      2,
      "Guarda os resíduos retirados da água.",
    ],
    [
      "protecao",
      "Traje de proteção",
      "shield",
      2,
      "Obrigatório para Kai entrar na água contaminada.",
    ],
    [
      "veterinario",
      "Kit veterinário de Marina",
      "paw",
      3,
      "Serve para cuidar dos amigos com a orientação de Marina.",
    ],
    [
      "corda",
      "Corda de resgate",
      "rope",
      3,
      "Material da equipe de resgate, utilizado com orientação de Marina.",
    ],
    [
      "chave",
      "Chave dos abrigos",
      "key",
      3,
      "Encontre perto de Marina para abrir os cercados.",
    ],
    [
      "pa",
      "Pá de plantio",
      "shovel",
      4,
      "Ferramenta da equipe para cuidar das mudas.",
    ],
    [
      "sementes",
      "Sementes nativas",
      "seeds",
      4,
      "Ipê, ingá e aroeira: cada espécie tem seu lugar.",
    ],
    [
      "mudas",
      "Mudas da floresta",
      "leaf",
      4,
      "Escolha sua muda favorita, plante e regue para vê-la crescer.",
    ],
    [
      "regador",
      "Regador de Rafael",
      "watering",
      4,
      "Molha as mudas; a fonte enche a reserva.",
    ],
    [
      "reciclagem",
      "Bolsa de reciclagem",
      "recycle",
      5,
      "Leva os materiais às lixeiras corretas.",
    ],
    [
      "solar",
      "Kit solar",
      "sun",
      5,
      "Ajuda a comunidade a aproveitar a luz do sol.",
    ],
    [
      "jardim",
      "Kit da praça",
      "leaf",
      5,
      "Recupera os jardins e os espaços dos moradores.",
    ],
  ].map(([id, name, icon, phase, description]) => ({
    id,
    name,
    icon,
    phase,
    description,
  }));
  const uniforms = [
    {
      id: "explorador",
      name: "Explorador",
      phase: 0,
      color: "#518646",
      description: "A roupa da primeira trilha de Kai.",
    },
    {
      id: "protecao",
      name: "Proteção do rio",
      phase: 2,
      color: "#24a4ad",
      description:
        "Traje impermeável, luvas, botas e visor. Obrigatório dentro do rio.",
    },
    {
      id: "resgate",
      name: "Equipe de resgate",
      phase: 3,
      color: "#e3aa42",
      description: "Uniforme do cuidado, com colete e identificação da equipe.",
    },
    {
      id: "plantio",
      name: "Guardião das sementes",
      phase: 4,
      color: "#75a848",
      description: "Roupa para preparar o solo e cuidar das mudas.",
    },
    {
      id: "voluntario",
      name: "Voluntário ambiental",
      phase: 5,
      color: "#a589c6",
      description: "Colete da comunidade que cuida da cidade.",
    },
  ];
  const crystals = [
    ["Fogo", "vermelho", "#ff4739", "A coragem de proteger a floresta."],
    ["Água", "azul", "#39b9ed", "O cuidado com cada gota e com a vida do rio."],
    [
      "Fauna",
      "amarelo",
      "#e9b63c",
      "O respeito aos animais e aos seus habitats.",
    ],
    [
      "Floresta",
      "verde",
      "#6acb5e",
      "A paciência de plantar e acompanhar a vida.",
    ],
    ["Cidade", "violeta", "#b98bff", "A força das pessoas que cuidam juntas."],
  ].map(([name, colorName, color, description], i) => ({
    id: i + 1,
    name,
    colorName,
    color,
    description,
  }));
  let memory = {
    version: 1,
    grants: [],
    found: [],
    uniform: "explorador",
    phases: {},
  };
  const get = (key) => {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch {
      return null;
    }
  };
  function hydrate() {
    const v = get(KEY);
    if (v?.version === 1)
      memory = {
        ...memory,
        ...v,
        grants: Array.isArray(v.grants)
          ? v.grants.filter((n) => Number.isInteger(n) && n >= 1 && n <= 5)
          : [],
        found: Array.isArray(v.found)
          ? v.found.filter((n) => items.some((i) => i.id === n))
          : [],
        phases: v.phases && typeof v.phases === "object" ? v.phases : {},
      };
    if (!uniforms.some((u) => u.id === memory.uniform))
      memory.uniform = "explorador";
    const conquered =
      window.GuardiaoProgresso?.read().completed ||
      get("guardiao.mapa.progresso.v1")?.completed ||
      [];
    if (Array.isArray(conquered))
      for (const id of conquered)
        if (
          Number.isInteger(id) &&
          id >= 1 &&
          id <= 5 &&
          !memory.grants.includes(id)
        )
          memory.grants.push(id);
    // Existing campaigns keep their acquired equipment and victories.
    for (let id = 1; id <= 5; id++) {
      const save = get(
        id === 1
          ? "guardiao.floresta-viva.v2"
          : `guardiao.jornada.fase.${id}.v1`,
      );
      if (save?.itemsGiven && !memory.grants.includes(id))
        memory.grants.push(id);
      if (save?.completed && !memory.phases[id]?.completed)
        memory.phases[id] = {
          ...memory.phases[id],
          completed: true,
          migrated: true,
        };
    }
  }
  hydrate();
  function write() {
    let saved = true;
    try {
      localStorage.setItem(KEY, JSON.stringify(memory));
    } catch {
      saved = false;
    }
    document.dispatchEvent(
      new CustomEvent("guardiao:memoria", { detail: read() }),
    );
    return saved;
  }
  function read() {
    return structuredClone(memory);
  }
  const obtained = () =>
    window.GuardiaoProgresso?.read().completed ||
    get("guardiao.mapa.progresso.v1")?.completed ||
    [];
  const has = (id) => {
    const item = items.find((i) => i.id === id);
    return (
      !!item &&
      (memory.found.includes(id) ||
        (id !== "chave" && memory.grants.includes(item.phase)))
    );
  };
  const hasUniform = (id) => {
    const u = uniforms.find((u) => u.id === id);
    return !!u && (u.phase === 0 || memory.grants.includes(u.phase));
  };
  function grant(phase) {
    if (memory.grants.includes(phase)) return false;
    memory.grants.push(phase);
    write();
    document.dispatchEvent(
      new CustomEvent("guardiao:descoberta", {
        detail: { text: "Novos equipamentos na mochila!", phase },
      }),
    );
    return true;
  }
  function find(id) {
    if (!items.some((i) => i.id === id) || memory.found.includes(id))
      return false;
    memory.found.push(id);
    write();
    document.dispatchEvent(
      new CustomEvent("guardiao:descoberta", {
        detail: { text: items.find((i) => i.id === id).name + " encontrada!" },
      }),
    );
    return true;
  }
  function phaseUniform(phase) {
    return (
      { 2: "protecao", 3: "resgate", 4: "plantio", 5: "voluntario" }[phase] ||
      "explorador"
    );
  }
  function uniform(id, { required = false } = {}) {
    const phase = Number(document.body.dataset.phase || 0);
    if (!required || id !== phaseUniform(phase) || !hasUniform(id))
      return false;
    memory.uniform = id;
    write();
    return true;
  }
  function record(phase, objectives, { completed = false, ...extra } = {}) {
    memory.phases[phase] = {
      ...memory.phases[phase],
      objectives: structuredClone(objectives),
      ...extra,
      completed: completed || memory.phases[phase]?.completed === true,
    };
    write();
  }
  function equip(id) {
    if (!has(id)) return false;
    document.dispatchEvent(
      new CustomEvent("guardiao:equipar", { detail: { id } }),
    );
    return true;
  }
  window.addEventListener("storage", (e) => {
    if ([KEY, "guardiao.mapa.progresso.v1"].includes(e.key)) {
      hydrate();
      document.dispatchEvent(
        new CustomEvent("guardiao:memoria", { detail: read() }),
      );
    }
  });
  window.GuardiaoMemoria = Object.freeze({
    read,
    phaseUniform,
    grant,
    find,
    has,
    hasUniform,
    uniform,
    record,
    equip,
    obtained,
    items,
    uniforms,
    crystals,
  });
})();


;/* jogo/vida-em-equilibrio/colecao.js */
"use strict";
(() => {
  const root = new URL("../../", ({src:new URL("../vida-em-equilibrio/colecao.js",document.baseURI).href}).src);
  let serial = 0;
  function frame(body, color = "#9bbd70") {
    const id = "collection-" + serial++;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 110" aria-hidden="true"><defs><linearGradient id="${id}-metal" x2=".8" y2="1"><stop stop-color="#fff2bd"/><stop offset=".5" stop-color="#d8ad57"/><stop offset="1" stop-color="#8d602f"/></linearGradient><linearGradient id="${id}-color" x2="1" y2="1"><stop stop-color="#fff8d8"/><stop offset=".3" stop-color="${color}"/><stop offset="1" stop-color="#274a41"/></linearGradient><radialGradient id="${id}-halo"><stop stop-color="#fff9cf"/><stop offset="1" stop-color="#d2d9a3" stop-opacity="0"/></radialGradient></defs><circle cx="50" cy="53" r="48" fill="url(#${id}-halo)"/><ellipse cx="50" cy="97" rx="32" ry="5" fill="#284631" opacity=".16"/><g stroke="#466046" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round">${body.replaceAll("@metal", `url(#${id}-metal)`).replaceAll("@color", `url(#${id}-color)`)}</g></svg>`;
  }
  const bag = `<path d="M22 36Q21 27 31 27H70Q79 29 78 41L75 86Q73 93 62 93H35Q24 91 24 83Z" fill="@color"/><path d="M34 28V18Q50 5 66 18V28" fill="none" stroke="#d8b872" stroke-width="6"/><path d="M24 51H77M31 71H68V87H31Z" fill="#e7cd8a"/><path d="M45 35H56V60H45Z" fill="@metal"/><circle cx="50" cy="49" r="2" fill="#fff2c6"/>`;
  const shapes = {
    mangueira: `<path d="M19 81C-4 40 40 22 64 44S65 103 38 83S28 52 44 53S69 67 51 75" fill="none" stroke="#405b35" stroke-width="13"/><path d="M19 79C-2 41 40 25 62 45" fill="none" stroke="#9daf6e" stroke-width="4"/><path d="M63 47L78 26L91 32L78 56Z" fill="@metal"/><path d="M76 29L86 15L97 22L90 36Z" fill="#72b2b7"/><path d="M65 48L61 61L69 66L77 54" fill="#376976"/><path d="M89 13L94 7M96 18L100 15" stroke="#63d6ee" stroke-width="3"/>`,
    luvas: `<path d="M19 90L11 55Q8 45 17 46L26 57L20 29Q21 21 27 24L34 47L32 19Q36 11 40 19L42 44L46 23Q51 17 54 26L50 57Q54 65 50 78L43 91Z" fill="@color"/><path d="M55 90L51 67L61 56L65 37Q70 29 74 37L75 50L81 30Q86 25 89 32L86 54L94 47Q102 48 95 61L91 87Z" fill="@color"/><path d="M18 85L44 83V96H20ZM54 85L91 84V95H56Z" fill="@metal"/>`,
    kit: `${bag}<path d="M44 62H57V69H64V82H57V89H44V82H37V69H44Z" fill="#f0efcc"/>`,
    rede: `<path d="M16 97L48 54" stroke="#835b35" stroke-width="8"/><path d="M17 94L47 55" stroke="#d9b87a" stroke-width="3"/><ellipse cx="61" cy="38" rx="30" ry="22" transform="rotate(-35 61 38)" fill="#91d2d1" fill-opacity=".45" stroke="#4e8c8c" stroke-width="5"/><path d="M39 26L68 61M48 18L78 53M59 13L86 44M33 35L76 15M37 49L87 27M48 60L89 40" stroke="#649a98" stroke-width="1.4"/>`,
    saco: bag,
    protecao: `<path d="M34 38L18 49L9 70L23 79L32 60V97H46V71H58V97H72V60L81 79L94 71L83 47L67 38Z" fill="@color"/><path d="M32 20Q50 2 69 20L67 43H34Z" fill="#c7eaf0"/><path d="M37 20Q51 13 64 21V34H37Z" fill="#e6f5e8"/><path d="M34 41H68M32 63H73" stroke="#efd16d" stroke-width="6"/><path d="M49 46V65" stroke="#fff0b8" stroke-width="3"/>`,
    corda: `<path d="M32 87C-7 61 11 15 49 14S98 58 70 74S20 64 30 39S80 30 70 48S45 67 43 45M32 86L41 101" fill="none" stroke="#916b38" stroke-width="10"/><path d="M32 86C-7 60 12 17 49 17S95 58 70 71S24 63 33 40S77 32 68 48S47 61 46 45" fill="none" stroke="#e5c47d" stroke-width="4"/>`,
    chave: `<circle cx="34" cy="30" r="19" fill="@metal"/><circle cx="34" cy="29" r="9" fill="#e9e7ba"/><path d="M42 44L79 91L91 82L84 73L77 78L71 70L78 65L71 57L64 63L50 42Z" fill="@metal"/><path d="M29 14L23 18" stroke="#fff2b0" stroke-width="3"/>`,
    pa: `<path d="M35 10H64V30Q48 43 35 30ZM49 35V72" fill="none" stroke="#c09458" stroke-width="6"/><path d="M29 66H70V86L50 104L29 86Z" fill="@color"/><path d="M50 70V97" stroke="#d7e4ce" stroke-width="3"/>`,
    sementes: `<path d="M16 43H79L72 98H23Z" fill="#c19c64"/><path d="M15 40H81V51H15Z" fill="@metal"/><path d="M50 84V62M50 72Q28 72 32 57Q50 57 50 72M50 69Q71 65 69 52Q49 51 50 69" fill="#81b45b"/><path d="M26 44L30 40M38 44L42 40M52 44L56 40M65 44L69 40" stroke="#8a7444"/><ellipse cx="19" cy="92" rx="6" ry="4" fill="#e5ca8e" transform="rotate(30 19 92)"/>`,
    regador: `<path d="M21 43H66L64 88Q42 101 22 88Z" fill="@color"/><path d="M23 46Q-4 35 9 17Q32 3 38 42" fill="none" stroke="#72a6a0" stroke-width="7"/><path d="M65 64L85 39L94 48L67 88Z" fill="@color"/><path d="M81 37L96 48" stroke="#d8dcb1" stroke-width="6"/><path d="M84 55L87 62M92 58L96 65M80 61L81 67" stroke="#5bc6e0" stroke-width="3"/><path d="M29 57V81" stroke="#c3ded0" stroke-width="3"/>`,
    solar: `<path d="M47 68V99M25 99H72" stroke="#96724b" stroke-width="5"/><path d="M18 25H85L76 75H9Z" fill="#477d9a" stroke="#becdb1" stroke-width="4"/><path d="M35 27L26 72M52 26L43 74M68 26L59 75M14 41H81M12 57H78" stroke="#a7d6df" stroke-width="1.4"/><path d="M66 13L71 4M79 18L90 12M83 28L97 27" stroke="#e8be60" stroke-width="3"/>`,
  };
  shapes.veterinario = shapes.kit;
  shapes.mudas = shapes.sementes;
  shapes.jardim = shapes.pa;
  shapes.reciclagem = shapes.saco;
  function item(id) {
    return frame(shapes[id] || bag, id === "solar" ? "#7499b6" : "#88b086");
  }
  function plant(name) {
    const flowers =
      name === "ipê" ? "#e9b9e9" : name === "ingá" ? "#d7eb9d" : "#da8469";
    const leaves =
      name === "ingá"
        ? `<path d="M50 42Q23 30 16 42Q31 54 50 42M50 36Q75 20 88 30Q76 45 50 42M50 62Q25 53 20 65Q38 73 50 62" fill="#84af60"/>`
        : `<path d="M50 61Q13 67 16 42Q18 18 46 22Q56 8 76 26Q97 32 85 53Q77 65 50 61" fill="#72a66a"/>`;
    const buds = [name === "ipê" ? 25 : 67, 38, 77]
      .map(
        (x, i) =>
          `<circle cx="${x}" cy="${27 + i * 11}" r="8" fill="${flowers}"/><circle cx="${x + 2}" cy="${25 + i * 11}" r="3" fill="#fff4c6"/>`,
      )
      .join("");
    return frame(
      `<path d="M48 92L49 29M49 64L31 46M49 53L72 33" stroke="#8c7243" stroke-width="6"/>${leaves}${buds}<path d="M34 85H67L62 102H39Z" fill="#bb8e5f"/>`,
      "#9bb86e",
    );
  }
  const bins = {
    recyclable: ["#559eae", "↻"],
    organic: ["#b48251", ""],
    residual: ["#89929a", ""],
  };
  function bin(kind) {
    const [color] = bins[kind];
    const symbol =
      kind === "organic"
        ? `<path d="M51 74V50Q36 41 31 51Q35 64 51 59Q65 43 73 53Q67 68 51 64" fill="#eadf9b"/>`
        : kind === "residual"
          ? `<path d="M37 49L64 74M64 49L37 74" stroke="#f0ead2" stroke-width="6"/>`
          : `<path d="M45 46L58 46L63 57L68 53L68 68L54 65L59 61L53 52L45 55M66 73L59 82L42 80L41 86L31 73L45 67L43 74L57 75M30 72L25 59L33 49L29 46L43 44L41 59L37 56L32 63L36 69" fill="#f3e7ac"/>`;
    return frame(
      `<path d="M23 30H78L73 95H28Z" fill="@color"/><path d="M18 23H83V36H18ZM34 17H66V24H34Z" fill="${color}"/><path d="M30 40L33 89M70 40L67 89" stroke="#fff4c6" opacity=".35" stroke-width="3"/>${symbol}`,
      color,
    );
  }
  function gem(index, earned) {
    const colors = ["#f47739", "#56caf0", "#edbe55", "#7fca73", "#b394ed"];
    const outlines = [
      "M50 5C52 27 89 31 81 65Q78 93 50 101Q14 89 18 59Q20 37 36 24Q31 47 46 48Q59 37 50 5Z",
      "M50 5Q34 27 22 51Q7 79 50 103Q94 79 78 51Z",
      "M50 5L85 30L83 77L50 103L17 77L15 30Z",
      "M50 7Q94 9 87 52Q80 91 26 102Q8 64 19 36Q26 18 50 7Z",
      "M50 5L87 29V78L50 103L13 78V29Z",
    ];
    const symbols = [
      shapes.mangueira.includes("never")
        ? ""
        : `<path d="M51 40Q72 60 52 81Q32 72 40 57Q43 68 49 63Q55 52 51 40" fill="#ffeaa4"/>`,
      `<path d="M50 39Q30 65 50 78Q71 63 50 39Z" fill="#d4f7fa"/>`,
      `<ellipse cx="50" cy="70" rx="13" ry="10" fill="#fff1bc"/><circle cx="33" cy="54" r="6" fill="#fff1bc"/><circle cx="46" cy="46" r="6" fill="#fff1bc"/><circle cx="61" cy="48" r="6" fill="#fff1bc"/><circle cx="70" cy="59" r="5" fill="#fff1bc"/>`,
      `<path d="M33 77Q27 43 65 37Q75 66 33 77ZM36 73L60 46" fill="#e2f5b3" stroke="#80a45d"/>`,
      `<path d="M29 77V58H42V77M44 77V42H56V77M60 77V51H73V77" fill="#f6e8b0"/>`,
    ];
    return frame(
      `<path d="${outlines[index]}" fill="@color" stroke="#b28c47" stroke-width="3"/><path d="M50 13L34 40L50 91L68 41Z" fill="#fff" opacity=".18"/><path d="M24 36L35 40L20 70M35 40L68 41L82 34M68 41L83 72" fill="none" stroke="#fff6d2" opacity=".45" stroke-width="1.5"/>${earned ? symbols[index] : `<path d="M41 58V48Q50 37 59 48V58M37 58H63V79H37Z" fill="#46594c" stroke="#e1d3a4" stroke-width="3"/>`}<path d="M30 27L35 22" stroke="#fff8d5" stroke-width="3"/>`,
      earned ? colors[index] : "#829180",
    );
  }
  const uniforms = {
    protecao: {
      file: "jogo/novo-amanha/assets/amanha-traje-andar.webp",
      width: 864,
      height: 1312,
      bounds: [20, 1007, 177, 293],
    },
    resgate: {
      file: "jogo/novo-amanha/assets/amanha-uniforme-resgate.webp",
      width: 1008,
      height: 1376,
      bounds: [40, 1061, 172, 303],
    },
    plantio: {
      file: "jogo/novo-amanha/assets/amanha-uniforme-plantio.webp",
      width: 848,
      height: 1360,
      bounds: [18, 1035, 177, 313],
    },
    voluntario: {
      file: "jogo/novo-amanha/assets/amanha-uniforme-voluntario.webp",
      width: 880,
      height: 1312,
      bounds: [21, 1009, 178, 291],
    },
  };
  uniforms.explorador = {
    file: "jogo/sprites-integros/assets/vida-kai-andando.webp",
    width: 2240,
    height: 1280,
    bounds: [1144, 357, 231, 271],
  };
  function uniform(id) {
    const d = uniforms[id];
    if (!d) return item("luvas");
    return `<svg class="pack-outfit" viewBox="${d.bounds.join(" ")}" aria-hidden="true"><image href="${new URL(d.file, root).href}" width="${d.width}" height="${d.height}"/></svg>`;
  }
  window.GuardiaoColecao = Object.freeze({
    item,
    plant,
    bin,
    gem,
    uniform,
    root,
  });
})();


;/* jogo/viva/simbolos.js */
"use strict";
(() => {
  const baseIcon = Raizes.icon;
  let serial = 0,
    loading;
  const bank = new Map(),
    aliases = {
      watering: "water",
      regador: "water",
      recycle: "trash",
      reciclagem: "trash",
      net: "net",
      protecao: "shield",
      veterinario: "paw",
      kit: "paw",
      mangueira: "hose",
      sementes: "plant",
      mudas: "plant",
      seeds: "plant",
      seedling: "plant",
      jardim: "plant",
      solar: "sun",
      saco: "bag",
      floresta: "fire",
      rio: "water",
      fauna: "paw",
      reflorestamento: "plant",
      cidade: "sun",
    };
  function markup(raw) {
    const name = aliases[raw] || raw,
      id = "viva-emblem-" + serial++;
    const shapes = {
      fire: `<path d="M52 16C54 37 83 40 77 65 73 88 25 91 22 61c-2-16 10-25 19-32-2 20 11 19 11-13Z" fill="url(#${id}-hot)" stroke="#943c20" stroke-width="2"/><path d="M52 45c2 13 17 15 12 29-5 12-25 10-28-1-2-11 11-15 16-28Z" fill="#ffe47d"/>`,
      water: `<path d="M50 15C42 29 22 47 24 65c2 28 52 28 53 0 1-18-19-36-27-50Z" fill="url(#${id}-blue)" stroke="#17668a" stroke-width="2"/><path d="M36 51c-9 12-5 21 3 24" fill="none" stroke="#d3f9ff" stroke-width="5" stroke-linecap="round"/><path d="M19 82q15-8 31 0t31 0" fill="none" stroke="#b0ebdd" stroke-width="3"/>`,
      paw: `<path d="M31 58c-20 17-8 29 8 22l11-5 12 5c18 7 26-8 8-23-14-15-25-16-39 1Z" fill="url(#${id}-gold)" stroke="#76522c" stroke-width="2"/><g fill="#e9c27b" stroke="#76522c" stroke-width="2"><ellipse cx="25" cy="43" rx="8" ry="11" transform="rotate(-25 25 43)"/><ellipse cx="41" cy="31" rx="8" ry="11"/><ellipse cx="60" cy="31" rx="8" ry="11"/><ellipse cx="76" cy="43" rx="8" ry="11" transform="rotate(25 76 43)"/></g>`,
      leaf: `<path d="M77 21C34 14 14 39 27 74c32 14 59-14 50-53Z" fill="url(#${id}-green)" stroke="#2b572a" stroke-width="2"/><path d="M20 82 65 35m-24 25-3-20m13 9 16 1" fill="none" stroke="#e0ed98" stroke-width="3" stroke-linecap="round"/>`,
      plant: `<path d="M27 82q23-12 48 0" fill="none" stroke="#9e7446" stroke-width="8" stroke-linecap="round"/><path d="M50 79V44" stroke="#527335" stroke-width="6"/><path d="M49 59C17 57 16 36 22 29c25-2 33 12 27 30Zm2-11C49 21 66 15 80 22c1 22-13 29-29 26Z" fill="url(#${id}-green)" stroke="#356135" stroke-width="2"/><path d="M28 37 49 56m3-11 20-17" stroke="#d5e48d" stroke-width="2"/>`,
      sun: `<path d="M22 52 50 29 79 52v31H23Z" fill="#e5c07b" stroke="#6f5534" stroke-width="2"/><path d="m18 51 32-27 33 27" fill="none" stroke="#7b5532" stroke-width="8" stroke-linecap="round"/><path d="M37 84V60h24v24" fill="#577c4c"/><rect x="36" y="42" width="28" height="14" rx="2" fill="#4c9fb1" stroke="#ece19f" stroke-width="2"/><circle cx="76" cy="23" r="8" fill="#ffdd79"/><path d="M76 9V6m0 34v-3M62 23h-3m34 0h-3M66 13l-2-2m22 24-2-2" stroke="#ffdf89" stroke-width="3"/>`,
    };
    if (!shapes[name]) {
      const inner = baseIcon(name).replace(
        "<svg ",
        '<svg x="22" y="22" width="56" height="56" ',
      );
      return `<svg class="nature-symbol tool-symbol" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" fill="#315e40" stroke="#cfaa62" stroke-width="4"/><g color="#ffebba">${inner}</g><path d="M73 78q13-2 13-14-14 0-13 14Z" fill="#9dbd5b" stroke="#456d37" stroke-width="1.5"/></svg>`;
    }
    return `<svg class="nature-symbol" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="${id}-green" x2=".6" y2="1"><stop stop-color="#c8e27a"/><stop offset=".5" stop-color="#79ae45"/><stop offset="1" stop-color="#39783c"/></linearGradient><linearGradient id="${id}-blue" x2=".6" y2="1"><stop stop-color="#8fe5ee"/><stop offset=".55" stop-color="#3bafd1"/><stop offset="1" stop-color="#247cb1"/></linearGradient><linearGradient id="${id}-hot" x2=".5" y2="1"><stop stop-color="#ffd866"/><stop offset=".5" stop-color="#f59b35"/><stop offset="1" stop-color="#d75d35"/></linearGradient><linearGradient id="${id}-gold" x2=".5" y2="1"><stop stop-color="#f7dda1"/><stop offset="1" stop-color="#c39153"/></linearGradient></defs><ellipse cx="50" cy="86" rx="31" ry="5" fill="#173d3020"/>${shapes[name]}</svg>`;
  }
  const names = [
    "water",
    "fire",
    "paw",
    "hand",
    "leaf",
    "trash",
    "fish",
    "turtle",
    "seeds",
    "plant",
    "watering",
    "recycle",
    "sun",
    "bag",
    "gear",
    "net",
    "lock",
    "shield",
    "rope",
    "key",
    "shovel",
    "jump",
    "heart",
    "bike",
    "bus",
    "hose",
    "mangueira",
    "kit",
    "flora",
    "pa",
    "sementes",
    "mudas",
    "regador",
    "jardim",
    "protecao",
    "chave",
    "luvas",
    "saco",
    "solar",
    "reciclagem",
    "veterinario",
  ];
  async function load() {
    if (!loading)
      loading = Promise.all(
        names.map(async (name) => {
          const im = new Image();
          im.src =
            "data:image/svg+xml;charset=utf-8," +
            encodeURIComponent(
              markup(name).replace(
                "<svg ",
                '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" ',
              ),
            );
          await im.decode();
          bank.set(name, im);
        }),
      ).then(() => bank);
    return loading;
  }
  function paint(ctx, _, name, x, y, size) {
    const im = bank.get(name) || bank.get("leaf");
    if (im) ctx.drawImage(im, x - size / 2, y - size / 2, size, size);
  }
  Raizes.icon = markup;
  window.GuardiaoIcones = {
    markup,
    prepare(parent = document) {
      parent
        .querySelectorAll("[data-icon]")
        .forEach((el) => (el.innerHTML = markup(el.dataset.icon)));
    },
    load,
    paint,
    draw: async (ctx, name, x, y, size) =>
      paint(ctx, await load(), name, x, y, size),
  };
  window.GuardiaoArtesInterface = { svg: markup, load };
  window.VivaSimbolos = { markup, load };
  if (window.GuardiaoColecao) {
    const c = GuardiaoColecao;
    window.GuardiaoColecao = {
      ...c,
      item: (name) => (name === "mudas" ? c.plant("ipê") : markup(name)),
    };
  }
})();


;/* jogo/brisa/atlas.js */
window.BrisaAtlas = {
  interface: {
    file: "assets/interface.webp",
    width: 1100,
    height: 1059,
    frames: [
      { name: "gear", bounds: [19, 25, 239, 237] },
      { name: "bag", bounds: [278, 8, 257, 256] },
      { name: "hose", bounds: [556, 6, 261, 257] },
      { name: "hand", bounds: [854, 7, 225, 256] },
      { name: "pause", bounds: [10, 282, 256, 235] },
      { name: "full", bounds: [300, 292, 250, 207] },
      { name: "watering", bounds: [550, 278, 270, 235] },
      { name: "net", bounds: [837, 276, 257, 245] },
      { name: "seeds", bounds: [28, 536, 220, 247] },
      { name: "shovel", bounds: [292, 530, 229, 255] },
      { name: "vest", bounds: [550, 532, 265, 250] },
      { name: "lifevest", bounds: [847, 534, 231, 246] },
      { name: "kit", bounds: [15, 805, 247, 227] },
      { name: "rope", bounds: [283, 810, 251, 228] },
      { name: "key", bounds: [601, 796, 188, 242] },
      { name: "plant", bounds: [852, 800, 221, 239] },
    ],
  },
  botanica: {
    file: "assets/botanica.webp",
    width: 1100,
    height: 550,
    frames: [
      { name: "folha-lima", bounds: [21, 50, 224, 192] },
      { name: "folha-verde", bounds: [321, 30, 207, 213] },
      { name: "folha-curva", bounds: [572, 24, 239, 231] },
      { name: "folha-dourada", bounds: [884, 54, 171, 174] },
      { name: "flor-rosa", bounds: [28, 304, 224, 207] },
      { name: "flor-branca", bounds: [290, 301, 243, 214] },
      { name: "petala-rosa", bounds: [572, 325, 221, 164] },
      { name: "petala-pessego", bounds: [872, 318, 198, 171] },
    ],
  },
  comandos: {
    file: "assets/comandos.webp",
    width: 576,
    height: 384,
    frames: [
      { name: "gear", bounds: [14, 14, 164, 163] },
      { name: "bag", bounds: [206, 14, 164, 163] },
      { name: "hose", bounds: [398, 15, 164, 161] },
      { name: "hand", bounds: [24, 206, 144, 164] },
      { name: "pause", bounds: [206, 212, 164, 151] },
      { name: "full", bounds: [398, 220, 164, 136] },
    ],
  },
};


;/* jogo/brisa/artes.js */
"use strict";
(() => {
  const base = new URL("./", ({src:new URL("../brisa/artes.js?v=brisa-1",document.baseURI).href}).src),
    atlas = BrisaAtlas;
  const fallback = Raizes.icon,
    oldIcons = GuardiaoIcones;
  const images = new Map(),
    promises = new Map();
  const aliases = {
    backpack: "bag",
    mochila: "bag",
    mangueira: "hose",
    luvas: "hand",
    regador: "watering",
    rede: "net",
    sementes: "seeds",
    pa: "shovel",
    protecao: "lifevest",
    veterinario: "kit",
    corda: "rope",
    chave: "key",
    mudas: "plant",
    saco: "bag",
    reciclagem: "bag",
    jardim: "shovel",
    exit: "full",
    back: "leaf",
  };
  const reduced = () => document.body.classList.contains("reduce-motion");
  function entry(raw) {
    const name = aliases[raw] || raw;
    for (const bank of ["comandos", "interface"]) {
      const d = atlas[bank],
        f = d.frames.find((f) => f.name === name);
      if (f) return { bank, d, f };
    }
  }
  function load(bank = "interface") {
    if (!promises.has(bank))
      promises.set(
        bank,
        (async () => {
          const im = new Image();
          im.src = new URL(atlas[bank].file, base);
          await im.decode();
          images.set(bank, im);
          return im;
        })(),
      );
    return promises.get(bank);
  }
  function markup(raw) {
    const e = entry(raw);
    if (!e) return fallback(raw);
    const { d, f } = e;
    return `<svg class="nature-symbol brisa-icon brisa-${raw}" viewBox="${f.bounds.join(" ")}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><image href="${new URL(d.file, base)}" width="${d.width}" height="${d.height}"/></svg>`;
  }
  function draw(ctx, bank, index, x, y, size, options = {}) {
    const d = atlas[bank],
      f = d.frames[index % d.frames.length],
      im = images.get(bank);
    if (!im) return;
    const b = f.bounds,
      k = size / Math.max(b[2], b[3]);
    ctx.save();
    ctx.globalAlpha *= options.alpha ?? 1;
    ctx.translate(x, y);
    ctx.rotate(options.angle || 0);
    ctx.scale(options.squeeze ?? 1, 1);
    ctx.drawImage(
      im,
      ...b,
      (-b[2] * k) / 2,
      (-b[3] * k) / 2,
      b[2] * k,
      b[3] * k,
    );
    ctx.restore();
  }
  function paint(ctx, bank, raw, x, y, size) {
    const e = entry(raw);
    if (!e) return oldIcons.paint(ctx, bank, raw, x, y, size);
    draw(ctx, e.bank, e.d.frames.indexOf(e.f), x, y, size);
  }
  const loadIcons = () =>
    Promise.all([oldIcons.load(), load("comandos"), load("interface")]);
  Raizes.icon = markup;
  window.GuardiaoIcones = {
    ...oldIcons,
    markup,
    load: loadIcons,
    paint,
    draw: async (ctx, name, x, y, size) => {
      await loadIcons();
      paint(ctx, null, name, x, y, size);
    },
    prepare(parent = document) {
      parent
        .querySelectorAll("[data-icon]")
        .forEach((e) => (e.innerHTML = markup(e.dataset.icon)));
    },
  };
  window.GuardiaoArtesInterface = { svg: markup, load: loadIcons };
  if (window.GuardiaoColecao)
    window.GuardiaoColecao = { ...GuardiaoColecao, item: markup };
  const bind = Raizes.bindFull,
    watched = new WeakSet();
  function fullIcons() {
    document.querySelectorAll("[data-fullscreen]").forEach((b) => {
      if (!b.querySelector(".brisa-full")) b.innerHTML = markup("full");
      if (!watched.has(b)) {
        watched.add(b);
        new MutationObserver(fullIcons).observe(b, { childList: true });
      }
      b.classList.toggle(
        "is-fullscreen",
        window.GuardiaoTela?.state().fullscreen ||
          !!(document.fullscreenElement || document.webkitFullscreenElement),
      );
    });
  }
  Raizes.bindFull = (b) => {
    bind(b);
    fullIcons();
  };
  window.addEventListener("guardiao:fullscreen", fullIcons);
  document.addEventListener("fullscreenchange", fullIcons);
  document.addEventListener("webkitfullscreenchange", fullIcons);
  document.addEventListener("DOMContentLoaded", fullIcons);
  const owl = RaizesPersonagens.owl;
  const calmOwl = (ctx, x, y, h, t, mode, flip) =>
    owl(ctx, x, y, h, t * 0.78, mode, flip);
  RaizesPersonagens.owl = calmOwl;
  VivaArt.owl = calmOwl;
  window.BrisaArte = {
    base,
    atlas,
    images,
    load,
    draw,
    markup,
    reduced,
    entry,
  };
})();


;/* jogo/brisa/ajustes.js */
"use strict";
(() => {
  const bind = Raizes.bindSettings,
    save = Raizes.save;
  // Um passeio 18% mais calmo mantém a geometria e a resposta aos controles.
  window.BrisaRitmo = {
    get speed() {
      return Raizes.prefs().calmPace === false ? 1 : 0.82;
    },
  };
  Raizes.save = (next) =>
    save(
      "graphicsQuality" in next &&
        "screenTransitions" in next &&
        "musicVolume" in next
        ? { ...next, calmPace: true }
        : next,
    );
  Raizes.bindSettings = (el) => {
    bind(el);
    el.querySelectorAll("[data-setting-panel]").forEach((panel) => {
      const animate = panel.animate.bind(panel);
      panel.animate = () =>
        animate(
          [
            { opacity: 0.65, transform: "translateY(3px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 340, easing: "ease-out" },
        );
    });
    const section = el.querySelector('[data-setting-panel="controles"]');
    const label = document.createElement("label");
    label.className = "ra-setting calm-pace";
    label.innerHTML = `<span><strong>Passeio tranquilo</strong><small>Kai caminha um pouco mais devagar.</small></span><input type="checkbox" name="calmPace" role="switch" ${Raizes.prefs().calmPace !== false ? "checked" : ""}>`;
    section.insertBefore(label, section.querySelector(".ra-help"));
    label.addEventListener("change", (e) =>
      Raizes.save({ calmPace: e.target.checked }),
    );
    section
      .querySelector('[name="controlMode"]')
      .closest("label")
      .classList.add("mode-choice");
  };
})();


;/* jogo/bosque-vivo/atlas.js */
window.BosqueKaiAtlas = {
  equipamentos: {
    file: "assets/equipamentos.webp",
    width: 1280,
    height: 853,
    cols: 6,
    rows: 4,
    referenceHeight: 195.5,
    frames: [
      { bounds: [60, 9, 108, 199], pivot: [106.5, 206.0] },
      { bounds: [267, 13, 113, 195], pivot: [320.0, 206.0] },
      { bounds: [466, 12, 128, 196], pivot: [533.5, 206.0] },
      { bounds: [682, 11, 131, 197], pivot: [746.5, 206.0] },
      { bounds: [902, 13, 120, 194], pivot: [960.0, 206.0] },
      { bounds: [1118, 13, 126, 194], pivot: [1173.5, 206.0] },
      { bounds: [60, 223, 109, 196], pivot: [106.5, 417.0] },
      { bounds: [271, 224, 109, 195], pivot: [320.0, 417.0] },
      { bounds: [473, 223, 124, 196], pivot: [533.5, 417.0] },
      { bounds: [676, 249, 133, 170], pivot: [746.5, 417.0] },
      { bounds: [888, 248, 129, 171], pivot: [960.0, 417.0] },
      { bounds: [1100, 252, 155, 167], pivot: [1173.5, 417.0] },
      { bounds: [60, 436, 108, 196], pivot: [106.5, 630.0] },
      { bounds: [263, 437, 116, 195], pivot: [320.0, 630.0] },
      { bounds: [470, 437, 127, 195], pivot: [533.5, 630.0] },
      { bounds: [678, 438, 146, 194], pivot: [746.5, 630.0] },
      { bounds: [891, 438, 149, 194], pivot: [960.0, 630.0] },
      { bounds: [1100, 438, 168, 193], pivot: [1173.5, 630.0] },
      { bounds: [60, 649, 108, 195], pivot: [106.5, 842.0] },
      { bounds: [273, 649, 106, 195], pivot: [320.0, 842.0] },
      { bounds: [470, 650, 117, 194], pivot: [533.5, 842.0] },
      { bounds: [692, 649, 102, 196], pivot: [746.5, 842.0] },
      { bounds: [901, 653, 107, 191], pivot: [960.0, 842.0] },
      { bounds: [1114, 656, 104, 188], pivot: [1173.5, 842.0] },
    ],
  },
  explorador: {
    file: "assets/explorador.webp",
    width: 1374,
    height: 1145,
    cols: 6,
    rows: 5,
    referenceHeight: 205.0,
    frames: [
      { bounds: [85, 15, 144, 208], pivot: [129.0, 221.0] },
      { bounds: [315, 22, 124, 202], pivot: [358.0, 221.0] },
      { bounds: [533, 12, 122, 210], pivot: [587.0, 221.0] },
      { bounds: [741, 17, 150, 206], pivot: [816.0, 221.0] },
      { bounds: [969, 20, 117, 204], pivot: [1045.0, 221.0] },
      { bounds: [1193, 14, 111, 209], pivot: [1274.0, 221.0] },
      { bounds: [89, 239, 138, 208], pivot: [125.0, 445.0] },
      { bounds: [311, 243, 119, 205], pivot: [354.0, 445.0] },
      { bounds: [533, 238, 113, 208], pivot: [583.0, 445.0] },
      { bounds: [742, 242, 132, 205], pivot: [812.0, 445.0] },
      { bounds: [967, 245, 111, 203], pivot: [1041.0, 445.0] },
      { bounds: [1186, 238, 110, 209], pivot: [1270.0, 445.0] },
      { bounds: [93, 458, 120, 209], pivot: [126.0, 664.0] },
      { bounds: [319, 464, 111, 202], pivot: [355.0, 664.0] },
      { bounds: [534, 460, 116, 206], pivot: [584.0, 664.0] },
      { bounds: [751, 462, 109, 205], pivot: [813.0, 664.0] },
      { bounds: [971, 464, 108, 202], pivot: [1042.0, 664.0] },
      { bounds: [1188, 462, 111, 203], pivot: [1271.0, 664.0] },
      { bounds: [82, 687, 143, 229], pivot: [141.5, 901.5] },
      { bounds: [327, 687, 112, 204], pivot: [370.5, 901.5] },
      { bounds: [542, 687, 111, 229], pivot: [599.5, 901.5] },
      { bounds: [745, 687, 134, 204], pivot: [828.5, 901.5] },
      { bounds: [974, 687, 118, 202], pivot: [1057.5, 901.5] },
      { bounds: [1197, 687, 108, 229], pivot: [1286.5, 901.5] },
      { bounds: [93, 916, 122, 206], pivot: [124.0, 1116.5] },
      { bounds: [316, 916, 109, 204], pivot: [353.0, 1116.5] },
      { bounds: [537, 916, 101, 194], pivot: [582.0, 1116.5] },
      { bounds: [749, 916, 110, 202], pivot: [811.0, 1116.5] },
      { bounds: [969, 916, 109, 203], pivot: [1040.0, 1116.5] },
      { bounds: [1190, 916, 105, 201], pivot: [1269.0, 1116.5] },
    ],
  },
  protecao: {
    file: "assets/protecao.webp",
    width: 1374,
    height: 1145,
    cols: 6,
    rows: 5,
    referenceHeight: 210.0,
    frames: [
      { bounds: [71, 9, 152, 217], pivot: [111.0, 223.5] },
      { bounds: [305, 13, 120, 215], pivot: [340.0, 223.5] },
      { bounds: [503, 8, 139, 216], pivot: [569.0, 223.5] },
      { bounds: [714, 12, 157, 213], pivot: [798.0, 223.5] },
      { bounds: [959, 13, 122, 214], pivot: [1027.0, 223.5] },
      { bounds: [1183, 10, 127, 215], pivot: [1256.0, 223.5] },
      { bounds: [72, 237, 133, 215], pivot: [109.0, 450.0] },
      { bounds: [302, 240, 119, 214], pivot: [338.0, 450.0] },
      { bounds: [509, 237, 125, 214], pivot: [567.0, 450.0] },
      { bounds: [716, 238, 139, 210], pivot: [796.0, 450.0] },
      { bounds: [959, 240, 115, 214], pivot: [1025.0, 450.0] },
      { bounds: [1187, 238, 109, 214], pivot: [1254.0, 450.0] },
      { bounds: [83, 464, 121, 207], pivot: [111.5, 669.0] },
      { bounds: [300, 464, 122, 205], pivot: [340.5, 669.0] },
      { bounds: [521, 464, 118, 205], pivot: [569.5, 669.0] },
      { bounds: [731, 465, 116, 206], pivot: [798.5, 669.0] },
      { bounds: [959, 466, 119, 206], pivot: [1027.5, 669.0] },
      { bounds: [1190, 464, 109, 207], pivot: [1256.5, 669.0] },
      { bounds: [73, 687, 140, 205], pivot: [121.5, 892.5] },
      { bounds: [304, 687, 118, 205], pivot: [350.5, 892.5] },
      { bounds: [515, 687, 129, 229], pivot: [579.5, 892.5] },
      { bounds: [730, 687, 134, 209], pivot: [808.5, 892.5] },
      { bounds: [959, 687, 119, 206], pivot: [1037.5, 892.5] },
      { bounds: [1185, 687, 116, 229], pivot: [1266.5, 892.5] },
      { bounds: [84, 916, 116, 210], pivot: [112.0, 1122.5] },
      { bounds: [301, 916, 114, 211], pivot: [341.0, 1122.5] },
      { bounds: [518, 916, 116, 201], pivot: [570.0, 1122.5] },
      { bounds: [741, 916, 114, 208], pivot: [799.0, 1122.5] },
      { bounds: [961, 916, 115, 209], pivot: [1028.0, 1122.5] },
      { bounds: [1183, 916, 114, 208], pivot: [1257.0, 1122.5] },
    ],
  },
  resgate: {
    file: "assets/resgate.webp",
    width: 1374,
    height: 1145,
    cols: 6,
    rows: 5,
    referenceHeight: 209.0,
    frames: [
      { bounds: [84, 13, 145, 211], pivot: [131.0, 224.0] },
      { bounds: [322, 17, 120, 210], pivot: [360.0, 224.0] },
      { bounds: [533, 12, 124, 213], pivot: [589.0, 224.0] },
      { bounds: [740, 16, 151, 208], pivot: [818.0, 224.0] },
      { bounds: [975, 17, 113, 210], pivot: [1047.0, 224.0] },
      { bounds: [1193, 12, 111, 215], pivot: [1276.0, 224.0] },
      { bounds: [87, 239, 142, 211], pivot: [128.5, 448.5] },
      { bounds: [321, 242, 111, 209], pivot: [357.5, 448.5] },
      { bounds: [534, 238, 115, 211], pivot: [586.5, 448.5] },
      { bounds: [740, 241, 135, 209], pivot: [815.5, 448.5] },
      { bounds: [974, 244, 109, 207], pivot: [1044.5, 448.5] },
      { bounds: [1195, 237, 104, 214], pivot: [1273.5, 448.5] },
      { bounds: [91, 458, 122, 211], pivot: [127.25, 665.5] },
      { bounds: [317, 463, 112, 204], pivot: [356.25, 665.5] },
      { bounds: [540, 458, 109, 209], pivot: [585.25, 665.5] },
      { bounds: [747, 459, 113, 209], pivot: [814.25, 665.5] },
      { bounds: [970, 463, 111, 205], pivot: [1043.25, 665.5] },
      { bounds: [1195, 460, 108, 206], pivot: [1272.25, 665.5] },
      { bounds: [80, 687, 140, 229], pivot: [138.0, 914.0] },
      { bounds: [323, 687, 111, 229], pivot: [367.0, 914.0] },
      { bounds: [540, 687, 114, 229], pivot: [596.0, 914.0] },
      { bounds: [743, 687, 134, 229], pivot: [825.0, 914.0] },
      { bounds: [972, 687, 114, 203], pivot: [1054.0, 914.0] },
      { bounds: [1194, 687, 111, 229], pivot: [1283.0, 914.0] },
      { bounds: [99, 916, 117, 207], pivot: [129.0, 1118.5] },
      { bounds: [320, 916, 104, 205], pivot: [358.0, 1118.5] },
      { bounds: [537, 916, 103, 196], pivot: [587.0, 1118.5] },
      { bounds: [757, 916, 103, 204], pivot: [816.0, 1118.5] },
      { bounds: [972, 916, 107, 205], pivot: [1045.0, 1118.5] },
      { bounds: [1194, 916, 101, 204], pivot: [1274.0, 1118.5] },
    ],
  },
  voluntario: {
    file: "assets/voluntario.webp",
    width: 1374,
    height: 1145,
    cols: 6,
    rows: 5,
    referenceHeight: 208.0,
    frames: [
      { bounds: [83, 13, 146, 212], pivot: [131.0, 223.5] },
      { bounds: [322, 19, 117, 207], pivot: [360.0, 223.5] },
      { bounds: [533, 13, 121, 211], pivot: [589.0, 223.5] },
      { bounds: [741, 16, 150, 209], pivot: [818.0, 223.5] },
      { bounds: [977, 17, 109, 209], pivot: [1047.0, 223.5] },
      { bounds: [1193, 13, 110, 213], pivot: [1276.0, 223.5] },
      { bounds: [89, 239, 136, 212], pivot: [127.0, 448.5] },
      { bounds: [326, 242, 104, 210], pivot: [356.0, 448.5] },
      { bounds: [536, 237, 112, 212], pivot: [585.0, 448.5] },
      { bounds: [743, 242, 132, 208], pivot: [814.0, 448.5] },
      { bounds: [976, 244, 105, 207], pivot: [1043.0, 448.5] },
      { bounds: [1195, 238, 103, 212], pivot: [1272.0, 448.5] },
      { bounds: [90, 459, 123, 211], pivot: [126.0, 667.0] },
      { bounds: [315, 465, 118, 204], pivot: [355.0, 667.0] },
      { bounds: [535, 460, 113, 208], pivot: [584.0, 667.0] },
      { bounds: [745, 461, 116, 208], pivot: [813.0, 667.0] },
      { bounds: [970, 464, 111, 206], pivot: [1042.0, 667.0] },
      { bounds: [1192, 461, 110, 207], pivot: [1271.0, 667.0] },
      { bounds: [81, 687, 143, 229], pivot: [140.0, 902.0] },
      { bounds: [325, 687, 109, 205], pivot: [369.0, 902.0] },
      { bounds: [539, 687, 117, 229], pivot: [598.0, 902.0] },
      { bounds: [744, 687, 135, 205], pivot: [827.0, 902.0] },
      { bounds: [974, 687, 114, 204], pivot: [1056.0, 902.0] },
      { bounds: [1196, 687, 109, 229], pivot: [1285.0, 902.0] },
      { bounds: [99, 916, 118, 208], pivot: [127.0, 1119.0] },
      { bounds: [319, 916, 104, 207], pivot: [356.0, 1119.0] },
      { bounds: [536, 916, 104, 198], pivot: [585.0, 1119.0] },
      { bounds: [758, 916, 101, 204], pivot: [814.0, 1119.0] },
      { bounds: [974, 916, 106, 206], pivot: [1043.0, 1119.0] },
      { bounds: [1195, 916, 104, 204], pivot: [1272.0, 1119.0] },
    ],
  },
  plantio: {
    file: "assets/plantio.webp",
    width: 1374,
    height: 1145,
    cols: 6,
    rows: 5,
    referenceHeight: 210.0,
    frames: [
      { bounds: [83, 13, 146, 214], pivot: [132.5, 225.5] },
      { bounds: [326, 18, 116, 210], pivot: [361.5, 225.5] },
      { bounds: [532, 13, 124, 214], pivot: [590.5, 225.5] },
      { bounds: [741, 16, 151, 209], pivot: [819.5, 225.5] },
      { bounds: [981, 17, 107, 211], pivot: [1048.5, 225.5] },
      { bounds: [1193, 13, 114, 215], pivot: [1277.5, 225.5] },
      { bounds: [88, 239, 140, 214], pivot: [129.0, 449.5] },
      { bounds: [321, 242, 110, 210], pivot: [358.0, 449.5] },
      { bounds: [533, 237, 115, 213], pivot: [587.0, 449.5] },
      { bounds: [740, 242, 137, 209], pivot: [816.0, 449.5] },
      { bounds: [980, 242, 102, 208], pivot: [1045.0, 449.5] },
      { bounds: [1197, 237, 103, 215], pivot: [1274.0, 449.5] },
      { bounds: [90, 458, 121, 212], pivot: [127.5, 667.5] },
      { bounds: [319, 462, 111, 207], pivot: [356.5, 667.5] },
      { bounds: [533, 458, 118, 211], pivot: [585.5, 667.5] },
      { bounds: [748, 458, 114, 213], pivot: [814.5, 667.5] },
      { bounds: [971, 461, 113, 210], pivot: [1043.5, 667.5] },
      { bounds: [1193, 460, 112, 208], pivot: [1272.5, 667.5] },
      { bounds: [81, 687, 141, 229], pivot: [140.0, 914.0] },
      { bounds: [324, 687, 110, 206], pivot: [369.0, 914.0] },
      { bounds: [540, 687, 116, 229], pivot: [598.0, 914.0] },
      { bounds: [745, 687, 135, 229], pivot: [827.0, 914.0] },
      { bounds: [975, 687, 113, 204], pivot: [1056.0, 914.0] },
      { bounds: [1195, 687, 111, 229], pivot: [1285.0, 914.0] },
      { bounds: [100, 916, 116, 207], pivot: [127.0, 1119.0] },
      { bounds: [321, 916, 101, 205], pivot: [356.0, 1119.0] },
      { bounds: [538, 916, 102, 197], pivot: [585.0, 1119.0] },
      { bounds: [760, 916, 101, 205], pivot: [814.0, 1119.0] },
      { bounds: [975, 916, 105, 205], pivot: [1043.0, 1119.0] },
      { bounds: [1194, 916, 105, 205], pivot: [1272.0, 1119.0] },
    ],
  },
  mangueira: {
    file: "assets/mangueira.webp",
    width: 1374,
    height: 1145,
    cols: 6,
    rows: 5,
    referenceHeight: 212.0,
    frames: [
      {
        bounds: [83, 12, 146, 213],
        pivot: [130.5, 224.0],
        nozzle: [219.0, 129.0],
      },
      {
        bounds: [315, 17, 132, 210],
        pivot: [359.5, 224.0],
        nozzle: [437.0, 135.5],
      },
      {
        bounds: [530, 11, 136, 215],
        pivot: [588.5, 224.0],
        nozzle: [657.0, 128.0],
      },
      {
        bounds: [739, 14, 152, 212],
        pivot: [817.5, 224.0],
        nozzle: [880.0, 134.0],
      },
      {
        bounds: [972, 15, 130, 211],
        pivot: [1046.5, 224.0],
        nozzle: [1093.0, 134.0],
      },
      {
        bounds: [1193, 15, 128, 212],
        pivot: [1275.5, 224.0],
        nozzle: [1313.0, 127.0],
      },
      {
        bounds: [87, 238, 141, 212],
        pivot: [129.0, 448.5],
        nozzle: [218.0, 341.0],
      },
      {
        bounds: [315, 241, 127, 211],
        pivot: [358.0, 448.5],
        nozzle: [436.0, 344.0],
      },
      {
        bounds: [532, 236, 132, 213],
        pivot: [587.0, 448.5],
        nozzle: [658.0, 338.0],
      },
      {
        bounds: [742, 241, 139, 210],
        pivot: [816.0, 448.5],
        nozzle: [875.0, 343.5],
      },
      {
        bounds: [971, 243, 128, 208],
        pivot: [1045.0, 448.5],
        nozzle: [1093.0, 345.0],
      },
      {
        bounds: [1190, 235, 122, 215],
        pivot: [1274.0, 448.5],
        nozzle: [1306.0, 341.0],
      },
      {
        bounds: [102, 458, 107, 229],
        pivot: [127.5, 685.0],
        nozzle: [202.0, 554.0],
      },
      {
        bounds: [325, 462, 106, 207],
        pivot: [356.5, 685.0],
        nozzle: [420.5, 555.0],
      },
      {
        bounds: [543, 458, 104, 229],
        pivot: [585.5, 685.0],
        nozzle: [638.0, 554.0],
      },
      {
        bounds: [761, 459, 102, 228],
        pivot: [814.5, 685.0],
        nozzle: [854.5, 556.5],
      },
      {
        bounds: [978, 461, 104, 207],
        pivot: [1043.5, 685.0],
        nozzle: [1074.0, 556.0],
      },
      {
        bounds: [1198, 459, 102, 228],
        pivot: [1272.5, 685.0],
        nozzle: [1292.0, 553.0],
      },
      {
        bounds: [80, 687, 145, 229],
        pivot: [138.5, 914.0],
        nozzle: [100.0, 798.0],
      },
      {
        bounds: [310, 687, 127, 229],
        pivot: [367.5, 914.0],
        nozzle: [319.0, 804.0],
      },
      {
        bounds: [530, 687, 124, 229],
        pivot: [596.5, 914.0],
        nozzle: [539.0, 802.0],
      },
      {
        bounds: [744, 687, 137, 229],
        pivot: [825.5, 914.0],
        nozzle: [757.0, 804.0],
      },
      {
        bounds: [973, 687, 119, 203],
        pivot: [1054.5, 914.0],
        nozzle: [984.0, 808.0],
      },
      {
        bounds: [1189, 687, 121, 229],
        pivot: [1283.5, 914.0],
        nozzle: [1198.0, 796.0],
      },
      {
        bounds: [95, 916, 111, 207],
        pivot: [124.5, 1118.5],
        nozzle: [151.0, 1030.0],
      },
      {
        bounds: [316, 916, 109, 205],
        pivot: [353.5, 1118.5],
        nozzle: [373.0, 1035.5],
      },
      {
        bounds: [535, 916, 106, 197],
        pivot: [582.5, 1118.5],
        nozzle: [590.5, 1026.0],
      },
      {
        bounds: [754, 916, 108, 204],
        pivot: [811.5, 1118.5],
        nozzle: [815.0, 1031.0],
      },
      {
        bounds: [973, 916, 107, 205],
        pivot: [1040.5, 1118.5],
        nozzle: [1032.0, 1034.0],
      },
      {
        bounds: [1194, 916, 103, 203],
        pivot: [1269.5, 1118.5],
        nozzle: [1250.0, 1025.0],
      },
    ],
  },
  tarefas: {
    file: "assets/tarefas.webp",
    width: 1374,
    height: 916,
    cols: 6,
    rows: 4,
    referenceHeight: 223.5,
    frames: [
      { bounds: [34, 17, 186, 208], pivot: [108.0, 224.5] },
      { bounds: [272, 37, 158, 189], pivot: [337.0, 224.5] },
      { bounds: [488, 29, 170, 197], pivot: [566.0, 224.5] },
      { bounds: [720, 18, 175, 209], pivot: [795.0, 224.5] },
      { bounds: [948, 27, 163, 200], pivot: [1024.0, 224.5] },
      { bounds: [1193, 0, 123, 228], pivot: [1253.0, 224.5] },
      { bounds: [36, 258, 161, 193], pivot: [115.5, 450.0] },
      { bounds: [268, 261, 151, 190], pivot: [344.5, 450.0] },
      { bounds: [486, 267, 164, 188], pivot: [573.5, 450.0] },
      { bounds: [718, 262, 161, 189], pivot: [802.5, 450.0] },
      { bounds: [943, 274, 162, 181], pivot: [1031.5, 450.0] },
      { bounds: [1189, 233, 131, 220], pivot: [1260.5, 450.0] },
      { bounds: [31, 482, 190, 199], pivot: [108.0, 677.5] },
      { bounds: [269, 473, 148, 207], pivot: [337.0, 677.5] },
      { bounds: [489, 474, 158, 205], pivot: [566.0, 677.5] },
      { bounds: [723, 481, 155, 198], pivot: [795.0, 677.5] },
      { bounds: [953, 477, 156, 202], pivot: [1024.0, 677.5] },
      { bounds: [1201, 458, 135, 222], pivot: [1253.0, 677.5] },
      { bounds: [42, 705, 160, 207], pivot: [115.0, 910.0] },
      { bounds: [268, 723, 177, 189], pivot: [344.0, 910.0] },
      { bounds: [505, 711, 146, 200], pivot: [573.0, 910.0] },
      { bounds: [738, 690, 134, 222], pivot: [802.0, 910.0] },
      { bounds: [972, 691, 117, 221], pivot: [1031.0, 910.0] },
      { bounds: [1206, 687, 111, 225], pivot: [1260.0, 910.0] },
    ],
  },
};


;/* jogo/bosque-vivo/trajes.js */
window.BosqueTrajes = {
  explorador: [0, 0, 120, 160],
  protecao: [120, 0, 120, 160],
  resgate: [240, 0, 120, 160],
  plantio: [360, 0, 120, 160],
  voluntario: [480, 0, 120, 160],
};


;/* jogo/reencontro/quadros.js */
"use strict";
// Gerado por desenvolvimento/reencontro/medir-quadros.py.
(() => {
  const frames = {
    equipamentos: {
      file: "../reencontro/assets/equipamentos.webp",
      width: 1536,
      height: 1024,
      frames: [
        { bounds: [4, 4, 114, 203], pivot: [63.0, 202] },
        { bounds: [260, 4, 118, 200], pivot: [311.0, 199] },
        { bounds: [516, 4, 133, 201], pivot: [578.0, 200] },
        { bounds: [772, 4, 137, 201], pivot: [837.0, 200] },
        { bounds: [1028, 4, 125, 200], pivot: [1091.0, 199] },
        { bounds: [1284, 4, 132, 200], pivot: [1345.0, 199] },
        { bounds: [4, 260, 115, 200], pivot: [61.0, 455] },
        { bounds: [260, 260, 115, 200], pivot: [312.0, 455] },
        { bounds: [516, 260, 129, 201], pivot: [581.0, 456] },
        { bounds: [772, 260, 139, 175], pivot: [850.0, 430] },
        { bounds: [1028, 260, 133, 176], pivot: [1102.0, 431] },
        { bounds: [1284, 260, 161, 172], pivot: [1358.0, 427] },
        { bounds: [4, 516, 114, 201], pivot: [61.0, 712] },
        { bounds: [260, 516, 121, 201], pivot: [317.0, 712] },
        { bounds: [516, 516, 132, 199], pivot: [577.0, 710] },
        { bounds: [772, 516, 151, 199], pivot: [834.0, 710] },
        { bounds: [1028, 516, 154, 199], pivot: [1088.0, 710] },
        { bounds: [1284, 516, 174, 199], pivot: [1360.0, 710] },
        { bounds: [4, 772, 113, 201], pivot: [61.0, 968] },
        { bounds: [260, 772, 111, 200], pivot: [313.0, 967] },
        { bounds: [516, 772, 122, 200], pivot: [582.0, 967] },
        { bounds: [772, 772, 108, 200], pivot: [825.0, 967] },
        { bounds: [1028, 772, 111, 197], pivot: [1083.0, 964] },
        { bounds: [1284, 772, 109, 194], pivot: [1341.0, 961] },
      ],
    },
    explorador: {
      file: "../reencontro/assets/explorador.webp",
      width: 1536,
      height: 1280,
      frames: [
        { bounds: [4, 4, 155, 214], pivot: [78.5, 213] },
        { bounds: [260, 4, 131, 208], pivot: [332.0, 207] },
        { bounds: [516, 4, 128, 216], pivot: [584.0, 215] },
        { bounds: [772, 4, 156, 211], pivot: [849.0, 210] },
        { bounds: [1028, 4, 123, 210], pivot: [1093.0, 209] },
        { bounds: [1284, 4, 117, 215], pivot: [1344.0, 214] },
        { bounds: [4, 260, 144, 215], pivot: [74.0, 470] },
        { bounds: [260, 260, 125, 211], pivot: [328.0, 466] },
        { bounds: [516, 260, 119, 215], pivot: [579.0, 470] },
        { bounds: [772, 260, 137, 212], pivot: [845.0, 467] },
        { bounds: [1028, 260, 117, 210], pivot: [1090.0, 465] },
        { bounds: [1284, 260, 116, 214], pivot: [1345.0, 469] },
        { bounds: [4, 516, 126, 215], pivot: [67.0, 726] },
        { bounds: [260, 516, 117, 208], pivot: [319.0, 719] },
        { bounds: [516, 516, 122, 213], pivot: [580.0, 724] },
        { bounds: [772, 516, 115, 211], pivot: [837.0, 722] },
        { bounds: [1028, 516, 113, 209], pivot: [1090.0, 720] },
        { bounds: [1284, 516, 117, 209], pivot: [1345.0, 720] },
        { bounds: [4, 772, 149, 218], pivot: [89.0, 985] },
        { bounds: [260, 772, 119, 212], pivot: [320.0, 979] },
        { bounds: [516, 772, 117, 209], pivot: [576.0, 976] },
        { bounds: [772, 772, 139, 218], pivot: [848.0, 985] },
        { bounds: [1028, 772, 124, 211], pivot: [1091.0, 978] },
        { bounds: [1284, 772, 116, 216], pivot: [1344.0, 983] },
        { bounds: [4, 1028, 128, 226], pivot: [64.0, 1249] },
        { bounds: [260, 1028, 114, 220], pivot: [317.0, 1243] },
        { bounds: [516, 1028, 107, 214], pivot: [571.0, 1237] },
        { bounds: [772, 1028, 116, 219], pivot: [833.0, 1242] },
        { bounds: [1028, 1028, 115, 216], pivot: [1087.0, 1239] },
        { bounds: [1284, 1028, 110, 223], pivot: [1341.0, 1246] },
      ],
    },
    protecao: {
      file: "../reencontro/assets/protecao.webp",
      width: 1536,
      height: 1280,
      frames: [
        { bounds: [4, 4, 158, 222], pivot: [89.0, 221] },
        { bounds: [260, 4, 126, 220], pivot: [325.0, 219] },
        { bounds: [516, 4, 146, 221], pivot: [597.0, 220] },
        { bounds: [772, 4, 162, 217], pivot: [859.0, 216] },
        { bounds: [1028, 4, 128, 220], pivot: [1092.0, 219] },
        { bounds: [1284, 4, 133, 221], pivot: [1355.0, 220] },
        { bounds: [4, 260, 139, 221], pivot: [80.0, 476] },
        { bounds: [260, 260, 125, 220], pivot: [322.0, 475] },
        { bounds: [516, 260, 131, 220], pivot: [586.0, 475] },
        { bounds: [772, 260, 145, 215], pivot: [853.0, 470] },
        { bounds: [1028, 260, 121, 219], pivot: [1087.0, 474] },
        { bounds: [1284, 260, 115, 220], pivot: [1340.0, 475] },
        { bounds: [4, 516, 126, 213], pivot: [68.0, 724] },
        { bounds: [260, 516, 128, 211], pivot: [325.0, 722] },
        { bounds: [516, 516, 124, 211], pivot: [578.0, 722] },
        { bounds: [772, 516, 121, 212], pivot: [836.0, 723] },
        { bounds: [1028, 516, 125, 212], pivot: [1091.0, 723] },
        { bounds: [1284, 516, 115, 214], pivot: [1341.0, 725] },
        { bounds: [4, 772, 145, 219], pivot: [82.0, 986] },
        { bounds: [260, 772, 122, 219], pivot: [322.0, 986] },
        { bounds: [516, 772, 134, 211], pivot: [578.0, 978] },
        { bounds: [772, 772, 140, 220], pivot: [843.0, 987] },
        { bounds: [1028, 772, 126, 216], pivot: [1092.0, 983] },
        { bounds: [1284, 772, 122, 215], pivot: [1345.0, 982] },
        { bounds: [4, 1028, 122, 227], pivot: [67.0, 1250] },
        { bounds: [260, 1028, 120, 225], pivot: [321.0, 1248] },
        { bounds: [516, 1028, 122, 218], pivot: [577.0, 1241] },
        { bounds: [772, 1028, 120, 220], pivot: [833.0, 1243] },
        { bounds: [1028, 1028, 120, 219], pivot: [1091.0, 1242] },
        { bounds: [1284, 1028, 120, 225], pivot: [1346.0, 1248] },
      ],
    },
    resgate: {
      file: "../reencontro/assets/resgate.webp",
      width: 1536,
      height: 1280,
      frames: [
        { bounds: [4, 4, 156, 217], pivot: [79.0, 216] },
        { bounds: [260, 4, 127, 215], pivot: [323.0, 214] },
        { bounds: [516, 4, 130, 219], pivot: [584.0, 218] },
        { bounds: [772, 4, 156, 214], pivot: [849.0, 213] },
        { bounds: [1028, 4, 119, 216], pivot: [1086.0, 215] },
        { bounds: [1284, 4, 117, 221], pivot: [1342.0, 220] },
        { bounds: [4, 260, 147, 219], pivot: [74.0, 474] },
        { bounds: [260, 260, 117, 216], pivot: [316.0, 471] },
        { bounds: [516, 260, 121, 219], pivot: [580.0, 474] },
        { bounds: [772, 260, 141, 215], pivot: [847.0, 470] },
        { bounds: [1028, 260, 115, 216], pivot: [1083.0, 471] },
        { bounds: [1284, 260, 110, 222], pivot: [1337.0, 477] },
        { bounds: [4, 516, 127, 222], pivot: [67.0, 733] },
        { bounds: [260, 516, 118, 212], pivot: [319.0, 723] },
        { bounds: [516, 516, 116, 218], pivot: [573.0, 729] },
        { bounds: [772, 516, 119, 216], pivot: [837.0, 727] },
        { bounds: [1028, 516, 117, 214], pivot: [1090.0, 725] },
        { bounds: [1284, 516, 114, 214], pivot: [1337.0, 725] },
        { bounds: [4, 772, 145, 219], pivot: [89.0, 986] },
        { bounds: [260, 772, 117, 218], pivot: [322.0, 985] },
        { bounds: [516, 772, 121, 213], pivot: [579.0, 980] },
        { bounds: [772, 772, 140, 220], pivot: [848.0, 987] },
        { bounds: [1028, 772, 121, 214], pivot: [1093.0, 981] },
        { bounds: [1284, 772, 117, 217], pivot: [1346.0, 984] },
        { bounds: [4, 1028, 123, 229], pivot: [60.0, 1252] },
        { bounds: [260, 1028, 111, 223], pivot: [315.0, 1246] },
        { bounds: [516, 1028, 110, 217], pivot: [574.0, 1240] },
        { bounds: [772, 1028, 108, 223], pivot: [827.0, 1246] },
        { bounds: [1028, 1028, 114, 221], pivot: [1084.0, 1244] },
        { bounds: [1284, 1028, 107, 224], pivot: [1337.0, 1247] },
      ],
    },
    voluntario: {
      file: "../reencontro/assets/voluntario.webp",
      width: 1536,
      height: 1280,
      frames: [
        { bounds: [4, 4, 156, 218], pivot: [80.0, 217] },
        { bounds: [260, 4, 123, 213], pivot: [323.0, 212] },
        { bounds: [516, 4, 127, 217], pivot: [583.0, 216] },
        { bounds: [772, 4, 156, 215], pivot: [849.0, 214] },
        { bounds: [1028, 4, 115, 215], pivot: [1084.0, 214] },
        { bounds: [1284, 4, 115, 219], pivot: [1343.0, 218] },
        { bounds: [4, 260, 142, 218], pivot: [75.0, 473] },
        { bounds: [260, 260, 110, 216], pivot: [313.0, 471] },
        { bounds: [516, 260, 118, 218], pivot: [576.0, 473] },
        { bounds: [772, 260, 137, 214], pivot: [845.0, 469] },
        { bounds: [1028, 260, 111, 213], pivot: [1081.0, 468] },
        { bounds: [1284, 260, 109, 219], pivot: [1338.0, 474] },
        { bounds: [4, 516, 128, 217], pivot: [70.0, 728] },
        { bounds: [260, 516, 124, 210], pivot: [323.0, 721] },
        { bounds: [516, 516, 118, 214], pivot: [577.0, 725] },
        { bounds: [772, 516, 122, 214], pivot: [841.0, 725] },
        { bounds: [1028, 516, 115, 211], pivot: [1090.0, 722] },
        { bounds: [1284, 516, 115, 213], pivot: [1340.0, 724] },
        { bounds: [4, 772, 149, 218], pivot: [88.0, 985] },
        { bounds: [260, 772, 115, 214], pivot: [317.0, 981] },
        { bounds: [516, 772, 122, 214], pivot: [578.0, 981] },
        { bounds: [772, 772, 141, 218], pivot: [847.0, 985] },
        { bounds: [1028, 772, 119, 213], pivot: [1089.0, 980] },
        { bounds: [1284, 772, 115, 217], pivot: [1344.0, 984] },
        { bounds: [4, 1028, 124, 228], pivot: [60.0, 1251] },
        { bounds: [260, 1028, 110, 223], pivot: [315.0, 1246] },
        { bounds: [516, 1028, 110, 218], pivot: [572.0, 1241] },
        { bounds: [772, 1028, 108, 220], pivot: [826.0, 1243] },
        { bounds: [1028, 1028, 112, 220], pivot: [1083.0, 1243] },
        { bounds: [1284, 1028, 109, 225], pivot: [1337.0, 1248] },
      ],
    },
    plantio: {
      file: "../reencontro/assets/plantio.webp",
      width: 1536,
      height: 1280,
      frames: [
        { bounds: [4, 4, 159, 220], pivot: [83.0, 219] },
        { bounds: [260, 4, 122, 215], pivot: [319.0, 214] },
        { bounds: [516, 4, 131, 220], pivot: [585.0, 219] },
        { bounds: [772, 4, 157, 214], pivot: [849.0, 213] },
        { bounds: [1028, 4, 112, 217], pivot: [1080.0, 216] },
        { bounds: [1284, 4, 119, 221], pivot: [1345.0, 220] },
        { bounds: [4, 260, 146, 220], pivot: [75.0, 475] },
        { bounds: [260, 260, 116, 216], pivot: [317.0, 471] },
        { bounds: [516, 260, 120, 219], pivot: [579.0, 474] },
        { bounds: [772, 260, 143, 215], pivot: [847.0, 470] },
        { bounds: [1028, 260, 107, 214], pivot: [1078.0, 469] },
        { bounds: [1284, 260, 109, 220], pivot: [1336.0, 475] },
        { bounds: [4, 516, 127, 222], pivot: [70.0, 733] },
        { bounds: [260, 516, 117, 213], pivot: [318.0, 724] },
        { bounds: [516, 516, 124, 220], pivot: [580.0, 731] },
        { bounds: [772, 516, 120, 219], pivot: [839.0, 730] },
        { bounds: [1028, 516, 118, 216], pivot: [1091.0, 727] },
        { bounds: [1284, 516, 118, 214], pivot: [1342.5, 725] },
        { bounds: [4, 772, 147, 222], pivot: [90.0, 989] },
        { bounds: [260, 772, 115, 218], pivot: [320.0, 985] },
        { bounds: [516, 772, 122, 215], pivot: [579.0, 982] },
        { bounds: [772, 772, 141, 221], pivot: [849.0, 988] },
        { bounds: [1028, 772, 119, 215], pivot: [1089.5, 982] },
        { bounds: [1284, 772, 117, 219], pivot: [1346.0, 986] },
        { bounds: [4, 1028, 122, 227], pivot: [57.0, 1250] },
        { bounds: [260, 1028, 106, 220], pivot: [312.0, 1243] },
        { bounds: [516, 1028, 107, 217], pivot: [569.0, 1240] },
        { bounds: [772, 1028, 107, 223], pivot: [825.0, 1246] },
        { bounds: [1028, 1028, 111, 218], pivot: [1082.0, 1241] },
        { bounds: [1284, 1028, 111, 225], pivot: [1339.0, 1248] },
      ],
    },
    mangueira: {
      file: "../reencontro/assets/mangueira.webp",
      width: 1536,
      height: 1280,
      frames: [
        {
          bounds: [4, 4, 159, 219],
          pivot: [79.0, 218],
          nozzle: [143.0, 124.0],
        },
        {
          bounds: [260, 4, 138, 216],
          pivot: [327.0, 215],
          nozzle: [385.0, 125.5],
        },
        {
          bounds: [516, 4, 142, 221],
          pivot: [585.0, 220],
          nozzle: [646.0, 124.0],
        },
        {
          bounds: [772, 4, 158, 217],
          pivot: [849.0, 216],
          nozzle: [916.0, 126.0],
        },
        {
          bounds: [1028, 4, 136, 217],
          pivot: [1090.0, 216],
          nozzle: [1152.0, 126.0],
        },
        {
          bounds: [1284, 4, 134, 218],
          pivot: [1344.0, 217],
          nozzle: [1407.0, 119.0],
        },
        {
          bounds: [4, 260, 147, 219],
          pivot: [76.0, 474],
          nozzle: [138.0, 366.0],
        },
        {
          bounds: [260, 260, 133, 217],
          pivot: [323.0, 472],
          nozzle: [384.0, 366.0],
        },
        {
          bounds: [516, 260, 138, 219],
          pivot: [582.0, 474],
          nozzle: [645.0, 365.0],
        },
        {
          bounds: [772, 260, 145, 216],
          pivot: [845.0, 471],
          nozzle: [908.0, 365.5],
        },
        {
          bounds: [1028, 260, 134, 214],
          pivot: [1088.0, 469],
          nozzle: [1153.0, 365.0],
        },
        {
          bounds: [1284, 260, 128, 221],
          pivot: [1344.0, 476],
          nozzle: [1403.0, 369.0],
        },
        {
          bounds: [4, 516, 113, 219],
          pivot: [60.0, 730],
          nozzle: [107.0, 619.0],
        },
        {
          bounds: [260, 516, 112, 213],
          pivot: [315.0, 724],
          nozzle: [358.5, 612.0],
        },
        {
          bounds: [516, 516, 111, 217],
          pivot: [571.0, 728],
          nozzle: [615.0, 617.0],
        },
        {
          bounds: [772, 516, 110, 215],
          pivot: [826.0, 726],
          nozzle: [869.5, 616.5],
        },
        {
          bounds: [1028, 516, 110, 213],
          pivot: [1083.0, 724],
          nozzle: [1127.0, 614.0],
        },
        {
          bounds: [1284, 516, 108, 214],
          pivot: [1338.0, 725],
          nozzle: [1381.0, 614.0],
        },
        {
          bounds: [4, 772, 151, 222],
          pivot: [94.0, 989],
          nozzle: [27.0, 898.0],
        },
        {
          bounds: [260, 772, 133, 218],
          pivot: [336.0, 985],
          nozzle: [272.0, 899.0],
        },
        {
          bounds: [516, 772, 130, 214],
          pivot: [588.0, 981],
          nozzle: [528.0, 901.0],
        },
        {
          bounds: [772, 772, 143, 223],
          pivot: [851.0, 990],
          nozzle: [788.0, 902.0],
        },
        {
          bounds: [1028, 772, 125, 215],
          pivot: [1092.0, 982],
          nozzle: [1042.0, 902.0],
        },
        {
          bounds: [1284, 772, 127, 222],
          pivot: [1355.0, 989],
          nozzle: [1296.0, 896.0],
        },
        {
          bounds: [4, 1028, 117, 229],
          pivot: [61.0, 1252],
          nozzle: [63.0, 1161.0],
        },
        {
          bounds: [260, 1028, 116, 223],
          pivot: [319.0, 1246],
          nozzle: [320.0, 1162.5],
        },
        {
          bounds: [516, 1028, 113, 218],
          pivot: [572.0, 1241],
          nozzle: [574.5, 1156.0],
        },
        {
          bounds: [772, 1028, 116, 222],
          pivot: [830.0, 1245],
          nozzle: [837.0, 1159.0],
        },
        {
          bounds: [1028, 1028, 115, 222],
          pivot: [1086.0, 1245],
          nozzle: [1091.0, 1160.0],
        },
        {
          bounds: [1284, 1028, 111, 226],
          pivot: [1340.0, 1249],
          nozzle: [1344.0, 1157.0],
        },
      ],
    },
    tarefas: {
      file: "../reencontro/assets/tarefas.webp",
      width: 1536,
      height: 1024,
      frames: [
        { bounds: [4, 4, 192, 214], pivot: [96.0, 213] },
        { bounds: [260, 4, 164, 194], pivot: [354.0, 193] },
        { bounds: [516, 4, 176, 203], pivot: [610.0, 202] },
        { bounds: [772, 4, 181, 215], pivot: [852.0, 214] },
        { bounds: [1028, 4, 168, 206], pivot: [1110.0, 205] },
        { bounds: [1284, 4, 128, 233], pivot: [1348.0, 232] },
        { bounds: [4, 260, 166, 199], pivot: [105.0, 454] },
        { bounds: [260, 260, 157, 196], pivot: [350.0, 451] },
        { bounds: [516, 260, 169, 192], pivot: [614.0, 447] },
        { bounds: [772, 260, 167, 194], pivot: [872.0, 449] },
        { bounds: [1028, 260, 168, 186], pivot: [1128.0, 441] },
        { bounds: [1284, 260, 137, 226], pivot: [1358.0, 481] },
        { bounds: [4, 516, 195, 203], pivot: [98.0, 714] },
        { bounds: [260, 516, 154, 213], pivot: [347.0, 724] },
        { bounds: [516, 516, 163, 211], pivot: [613.0, 722] },
        { bounds: [772, 516, 161, 204], pivot: [863.0, 715] },
        { bounds: [1028, 516, 162, 207], pivot: [1120.0, 718] },
        { bounds: [1284, 516, 140, 228], pivot: [1343.0, 739] },
        { bounds: [4, 772, 165, 212], pivot: [97.0, 979] },
        { bounds: [260, 772, 183, 195], pivot: [357.0, 962] },
        { bounds: [516, 772, 151, 205], pivot: [603.0, 972] },
        { bounds: [772, 772, 139, 228], pivot: [838.0, 995] },
        { bounds: [1028, 772, 122, 227], pivot: [1088.0, 994] },
        { bounds: [1284, 772, 116, 232], pivot: [1342.0, 999] },
      ],
    },
  };
  for (const [name, bank] of Object.entries(frames))
    Object.assign(BosqueKaiAtlas[name], bank);
})();


;/* jogo/trilhas-vivas/kai.js */
"use strict";
(() => {
  const base = new URL("../bosque-vivo/", ({src:new URL("../trilhas-vivas/kai.js?v=reencontro-1",document.baseURI).href}).src),
    atlas = BosqueKaiAtlas,
    images = new Map(),
    loading = new Map();
  const phase = location.pathname.includes("floresta-viva")
    ? 1
    : Number(new URLSearchParams(location.search).get("fase") || 0);
  let uniform = window.GuardiaoMemoria?.read().uniform || "explorador";
  document.addEventListener("guardiao:memoria", (e) => {
    uniform = e.detail.uniform;
  });
  const bankFor = {
    explorador: "explorador",
    protecao: "protecao",
    resgate: "resgate",
    plantio: "plantio",
    voluntario: "voluntario",
  };
  function load(names) {
    names ??= [
      "explorador",
      "equipamentos",
      ...(phase >= 3 ? ["tarefas"] : []),
      ...(phase === 1
        ? ["mangueira"]
        : phase > 1
          ? [GuardiaoMemoria.phaseUniform(phase)]
          : []),
    ];
    if (phase > 1) names = names.filter((name) => name !== "mangueira");
    return Promise.all([
      ...names.map((name) => {
        if (!atlas[name]) return Promise.resolve();
        if (!loading.has(name))
          loading.set(
            name,
            (async () => {
              const im = new Image();
              im.src = new URL(atlas[name].file, base);
              await im.decode();
              if (
                im.naturalWidth !== atlas[name].width ||
                im.naturalHeight !== atlas[name].height
              )
                throw Error("Prancha de Kai inválida: " + name);
              images.set(name, im);
            })(),
          );
        return loading.get(name);
      }),
      ...(phase === 4 && window.TrilhasNatureza
        ? [TrilhasNatureza.load()]
        : []),
    ]);
  }
  function draw(
    c,
    name,
    index,
    x,
    y,
    height,
    { flip = false, alpha = 1 } = {},
  ) {
    const d = atlas[name],
      im = images.get(name);
    if (!d || !im) return false;
    const f =
        d.frames[
          ((index % d.frames.length) + d.frames.length) % d.frames.length
        ],
      b = f.bounds,
      k = height / d.referenceHeight;
    c.save();
    c.globalAlpha *= Math.max(0, Math.min(1, alpha));
    c.translate(x, y);
    if (flip) c.scale(-1, 1);
    c.drawImage(
      im,
      ...b,
      (b[0] - f.pivot[0]) * k,
      (b[1] - f.pivot[1]) * k,
      b[2] * k,
      b[3] * k,
    );
    c.restore();
    return true;
  }
  const views = [
    [0, false],
    [1, false],
    [2, false],
    [1, true],
    [0, true],
    [3, false],
    [4, false],
    [3, true],
  ];
  function pose(p, reduced) {
    const [row, flip] = views[p.direction ?? 6];
    return {
      row,
      flip,
      step: p.moving && !reduced ? Math.floor(p.distance / 10) % 6 : 1,
    };
  }
  function walk(c, p, time, reduced, height = 63, equipped = false, forced) {
    if (c.canvas.id === "cenario" && !p.moving && !equipped) {
      const npc =
        phase === 1
          ? { x: 245, y: 245 }
          : window.GuardiaoFasesJogaveis?.[phase]?.npcPosition;
      if (npc && Math.hypot(p.x - npc.x, p.y - npc.y) < 100)
        p = {
          ...p,
          direction:
            (Math.round(-Math.atan2(npc.y - p.y, npc.x - p.x) / (Math.PI / 4)) +
              8) %
            8,
        };
    }
    const bank = equipped
        ? "mangueira"
        : bankFor[forced || uniform] || "explorador",
      v = pose(p, reduced);
    const name = images.has(bank) ? bank : "explorador",
      h = c.canvas.id === "cenario" ? height * 1.32 : height;
    const idle = p.moving || reduced ? 0 : Math.sin(time * 1.8) * 0.8;
    if (c.canvas.id === "cenario") {
      document.body.dataset.kaiUniform = name;
      document.body.dataset.kaiWalkFrame = String(v.step);
      document.body.dataset.kaiWalkDirection = String(p.direction);
      document.body.dataset.heroDirection = String(p.direction);
    }
    c.save();
    if (!p.moving && !reduced) {
      c.translate(p.x, p.y);
      c.rotate(Math.sin(time * 0.85) * 0.006);
      c.translate(-p.x, -p.y);
    }
    const result = draw(c, name, v.row * 6 + v.step, p.x, p.y, h + idle, {
      flip: v.flip,
    });
    c.restore();
    return result;
  }
  function equipment(c, row, progress, x, y, height = 83, flip = false) {
    if (c.canvas.id === "cenario")
      document.body.dataset.heroDirection = flip ? "4" : "0";
    return draw(
      c,
      "equipamentos",
      row * 6 +
        Math.min(5, Math.floor(Math.max(0, Math.min(0.999, progress)) * 6)),
      x,
      y,
      height,
      { flip },
    );
  }
  const Life = window.GuardiaoVidaNatural;
  if (Life)
    window.GuardiaoVidaNatural = class extends Life {
      async load(...args) {
        if (this.rebirth) this.rebirth.load = async () => {};
        await Promise.all([super.load(...args), load()]);
        // Sombras pertencem às árvores reais do cenário, não à pintura antiga.
        this.canopyShadow = null;
      }
      walk(c, p, time, reduced, equipped = false, height = 63) {
        return walk(c, p, time, reduced, height, equipped);
      }
    };
  const Art = window.GuardiaoAdventureArt;
  if (Art)
    window.GuardiaoAdventureArt = class extends Art {
      async load() {
        await Promise.all([super.load(), load()]);
      }
      outfit(c, p, time, reduced, height = 63) {
        return walk(c, p, time, reduced, height);
      }
      river(c, p, time, reduced, options = {}) {
        if (options.dressing || options.kind || p.swimming) {
          const mirrored = options.kind && p.direction >= 3 && p.direction <= 5;
          c.save();
          if (mirrored) {
            c.translate(p.x * 2, 0);
            c.scale(-1, 1);
          }
          const result = super.river(c, p, time, reduced, options);
          c.restore();
          return result;
        }
        walk(c, p, time, reduced, 63, false, "protecao");
        return "traje-andar:" + pose(p, reduced).step;
      }
    };
  if (window.FlorestaSprites) {
    const Forest = FlorestaSprites;
    window.FlorestaSprites = class extends Forest {
      hose(c, direction, frame, x, y, height = 63) {
        return walk(
          c,
          { x, y, direction, moving: false, distance: 0 },
          performance.now() / 1000,
          false,
          height,
          true,
        );
      }
    };
  }
  // Hose and hands share an anchor, including the reflected left-facing views.
  if (window.GuardiaoAgua) {
    const Water = GuardiaoAgua;
    window.GuardiaoAgua = class extends Water {
      nozzle(p, time, reduced) {
        const v = pose(p, reduced),
          d = atlas.mangueira;
        if (!d) return super.nozzle(p, time, reduced);
        const f = d.frames[v.row * 6 + v.step],
          point = f.nozzle,
          k = (63 * 1.32) / d.referenceHeight;
        return {
          x: p.x + (v.flip ? -1 : 1) * (point[0] - f.pivot[0]) * k,
          y: p.y + (point[1] - f.pivot[1]) * k,
        };
      }
    };
  }
  function task(c, row, progress, p, target, height = 83) {
    const flip = target ? target.x < p.x : p.direction >= 3 && p.direction <= 5;
    if (c.canvas.id === "cenario")
      document.body.dataset.heroDirection = flip ? "4" : "0";
    document.body.dataset.kaiAction = String(row);
    document.body.dataset.kaiUniform = {
      0: "resgate",
      1: "plantio",
      2: "plantio",
      3: "voluntario",
    }[row];
    draw(
      c,
      "tarefas",
      row * 6 + Math.min(5, Math.floor(Math.min(0.999, progress) * 6)),
      p.x,
      p.y,
      height,
      { flip },
    );
    if (row === 2 && progress > 0.25 && progress < 0.85 && target) {
      const x = p.x + (flip ? -1 : 1) * 23,
        y = p.y - 17;
      for (let i = 0; i < 7; i++) {
        const t = (performance.now() / 700 + i / 7) % 1;
        BosquePintura.oval(
          c,
          x + (target.x - x) * t,
          y + (target.y - y) * t - t * (1 - t) * 11,
          1.2,
          2,
          "#8ddce7",
        );
      }
    }
  }
  function uniformMarkup(name) {
    const b = BosqueTrajes[name],
      clip = "traje-" + name;
    return `<svg class="bosque-uniform" viewBox="${b.join(" ")}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><clipPath id="${clip}"><rect x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}"/></clipPath></defs><image clip-path="url(#${clip})" href="${new URL("assets/trajes-mini.webp", base)}" width="600" height="160"/></svg>`;
  }

  if (window.RaizesPersonagens) {
    const A = RaizesPersonagens,
      priorLoad = A.load,
      priorDraw = A.draw;
    A.load = (names = ["kai", "flora", "npcs", "acoes"]) =>
      Promise.all([
        priorLoad(names.filter((n) => n !== "kai" && n !== "mangueira")),
        ...(names.includes("kai") || names.includes("mangueira")
          ? [
              load([
                "explorador",
                ...(names.includes("mangueira") ? ["mangueira"] : []),
              ]),
            ]
          : []),
      ]);
    A.draw = (c, name, index, x, y, height, options = {}) =>
      name === "kai" && images.has("explorador")
        ? walk(
            c,
            {
              x,
              y,
              direction: Math.floor(index / 2) % 8,
              moving: true,
              distance: (performance.now() / 1000) * 62,
            },
            performance.now() / 1000,
            document.body.classList.contains("reduce-motion"),
            height,
            false,
            "explorador",
          )
        : priorDraw(c, name, index, x, y, height, options);
  }
  window.BosqueKai = {
    base,
    atlas,
    images,
    load,
    draw,
    equipment,
    task,
    walk,
    pose,
    uniformMarkup,
    state: () => ({ uniform, loaded: [...images.keys()], frames: 6 }),
  };
})();


;/* jogo/arte-viva/atlas.js */
"use strict";
window.ArteVivaAtlas = {
  flora: {
    file: "../arte-viva/assets/flora.webp",
    width: 1024,
    height: 1792,
    referenceHeight: 200,
    frames: [
      {
        bounds: [7, 39, 242, 211],
        pivot: [128.0, 250],
      },
      {
        bounds: [263, 62, 242, 188],
        pivot: [384.0, 250],
      },
      {
        bounds: [519, 71, 242, 179],
        pivot: [640.0, 250],
      },
      {
        bounds: [775, 49, 242, 201],
        pivot: [896.0, 250],
      },
      {
        bounds: [32, 291, 192, 215],
        pivot: [127.82, 506],
      },
      {
        bounds: [264, 306, 239, 200],
        pivot: [383.67, 506],
      },
      {
        bounds: [519, 331, 242, 175],
        pivot: [640.0, 506],
      },
      {
        bounds: [775, 317, 242, 189],
        pivot: [896.0, 506],
      },
      {
        bounds: [7, 556, 242, 206],
        pivot: [128.0, 762],
      },
      {
        bounds: [263, 580, 242, 182],
        pivot: [384.0, 762],
      },
      {
        bounds: [519, 560, 242, 202],
        pivot: [640.0, 762],
      },
      {
        bounds: [817, 564, 157, 198],
        pivot: [895.66, 762],
      },
      {
        bounds: [49, 819, 157, 199],
        pivot: [127.66, 1018],
      },
      {
        bounds: [305, 817, 158, 201],
        pivot: [384.08, 1018],
      },
      {
        bounds: [519, 814, 242, 204],
        pivot: [640.0, 1018],
      },
      {
        bounds: [775, 838, 242, 180],
        pivot: [896.0, 1018],
      },
      {
        bounds: [7, 1059, 242, 215],
        pivot: [128.0, 1274],
      },
      {
        bounds: [263, 1099, 242, 175],
        pivot: [384.0, 1274],
      },
      {
        bounds: [519, 1074, 241, 200],
        pivot: [639.5, 1274],
      },
      {
        bounds: [816, 1074, 160, 200],
        pivot: [896.0, 1274],
      },
      {
        bounds: [19, 1315, 218, 215],
        pivot: [128.0, 1530],
      },
      {
        bounds: [263, 1343, 242, 187],
        pivot: [384.0, 1530],
      },
      {
        bounds: [536, 1330, 208, 200],
        pivot: [640.0, 1530],
      },
      {
        bounds: [823, 1330, 145, 200],
        pivot: [895.5, 1530],
      },
      {
        bounds: [38, 1569, 180, 217],
        pivot: [128.0, 1786],
      },
      {
        bounds: [279, 1588, 209, 198],
        pivot: [383.5, 1786],
      },
      {
        bounds: [545, 1587, 189, 199],
        pivot: [639.5, 1786],
      },
      {
        bounds: [824, 1586, 143, 200],
        pivot: [895.5, 1786],
      },
    ],
  },
};


;/* jogo/arte-viva/personagens.js */
"use strict";
(() => {
  const A = RaizesPersonagens,
    sheet = ArteVivaAtlas.flora;
  A.atlas.flora = sheet;
  if (window.GuardiaoVidaAtlas)
    GuardiaoVidaAtlas.flora = {
      ...sheet,
      file: "../../arte-viva/assets/flora.webp",
    };

  // As 16 poses frontais são as artes anteriores; só costas e perfil são novas.
  const cycle = [0, 1, 2, 1];
  function frame(direction, mode, time, progress = 0, reduced = false) {
    const d = ((Math.round(direction || 0) % 8) + 8) % 8;
    const back = [1, 2, 3].includes(d),
      side = d === 0 || d === 4;
    const row = d === 2 ? 0 : back ? 1 : side ? 2 : -1;
    const perched = mode === "ombro" || mode === "fala";
    let index;
    if (row >= 0) {
      const step = perched
        ? 3
        : mode === "pousando"
          ? progress > 0.65
            ? 3
            : 2
          : mode === "decolando"
            ? progress < 0.35
              ? 3
              : 0
            : reduced
              ? 1
              : cycle[Math.floor(time * 7) % 4];
      index = 16 + row * 4 + step;
    } else
      index =
        mode === "festa" || mode === "comemorando"
          ? 14 + (reduced ? 0 : Math.floor(time * 4) % 2)
          : perched
            ? 12 + (!reduced && time % 5 > 4.72 ? 1 : 0)
            : mode === "pousando"
              ? 8 + Math.min(3, Math.floor(progress * 4))
              : mode === "decolando"
                ? 11 - Math.min(3, Math.floor(progress * 4))
                : reduced
                  ? 2
                  : Math.floor(time * 8) % 8;
    return { index, row, flip: [3, 4, 5].includes(d), direction: d };
  }
  function owl(c, x, y, h, t, mode = "voo", flip = false, progress = 0) {
    const pose = frame(
      6,
      mode,
      t,
      progress,
      document.body.classList.contains("reduce-motion"),
    );
    A.draw(c, "flora", pose.index, x, y, h, { flip });
    return pose.index;
  }
  A.owl = owl;
  if (window.VivaArt) VivaArt.owl = owl;
  const Life = window.GuardiaoVidaNatural;
  if (Life)
    window.GuardiaoVidaNatural = class extends Life {
      async load(...args) {
        await Promise.all([super.load(...args), A.load(["flora"])]);
      }
      flora(c, f, p, time, reduced) {
        const direction =
          f.mode === "comemorando"
            ? 6
            : FloraCompanheira.direction(p, this.phase);
        const duration = f.mode === "pousando" ? 0.55 : 0.38;
        const amount =
          f.mode === "ombro"
            ? 1
            : f.mode === "pousando"
              ? Math.min(1, f.elapsed / 0.55)
              : f.mode === "decolando"
                ? 1 - Math.min(1, f.elapsed / 0.38)
                : 0;
        const pose = frame(
          direction,
          f.mode,
          time,
          Math.min(1, f.elapsed / duration),
          reduced,
        );
        A.draw(
          c,
          "flora",
          pose.index,
          f.x,
          f.y + (reduced || amount === 1 ? 0 : Math.sin(time * 4) * 0.6),
          35 - 8 * amount,
          { flip: pose.flip },
        );
        Object.assign(document.body.dataset, {
          floraFrame: String(pose.index),
          floraView: String(direction),
          floraPerspective: String(pose.row),
        });
      }
      draw(c, name, index, x, y, h, options = {}) {
        if (name === "flora") return A.draw(c, name, index, x, y, h, options);
        return super.draw(c, name, index, x, y, h, options);
      }
    };
  // Kai mantém as pranchas limpas originais, incluindo os cinco uniformes.
  // Nenhum quadro novo substitui o rosto quando ele para ou muda de traje.
  window.ArteVivaPersonagens = { frame, owl, atlas: sheet };
})();


;/* jogo/arte-viva/icones.js */
"use strict";
(() => {
  const previous = Raizes.icon;
  let serial = 0;
  const aliases = {
    floresta: "fire",
    rio: "water",
    fauna: "paw",
    reflorestamento: "plant",
    cidade: "sun",
    back: "back",
    exit: "full",
  };
  function icon(raw) {
    const name = aliases[raw] || raw,
      id = "natureza-" + serial++;
    const paths = {
      leaf: `<path d="M15 53C8 21 31 8 54 11c4 25-6 45-32 44" fill="url(#${id}-leaf)"/><path d="M10 60 45 21m-20 24-1-17m10 7 15-1" fill="none" stroke="#f3e8a2" stroke-width="2.5" stroke-linecap="round"/>`,
      book: `<path d="M7 14q13-5 25 3 12-8 25-3v37q-14-5-25 3-13-8-25-3Z" fill="#855026" stroke="#57351e" stroke-width="3"/><path d="M11 11q11-3 21 5 10-8 21-5v34q-11-2-21 5-10-7-21-5Z" fill="#fff1c5" stroke="#c99a4c" stroke-width="2"/><path d="M32 16v33M16 21l10 3m-10 5 10 3m-10 5 10 3" fill="none" stroke="#bc935c" stroke-width="2" stroke-linecap="round"/><path d="M38 37c-4-13 1-17 10-17 1 12-3 17-10 17Z" fill="url(#${id}-leaf)"/><path d="m37 41 7-15" stroke="#f0de8b" stroke-width="1.5"/>`,
      gear: `<path d="m27 6 10 0 2 8 5 2 7-4 7 7-4 7 2 5 8 2v10l-8 2-2 5 4 7-7 7-7-4-5 2-2 8H27l-2-8-5-2-7 4-7-7 4-7-2-5-8-2V33l8-2 2-5-4-7 7-7 7 4 5-2Z" transform="translate(4 -3) scale(.88)" fill="url(#${id}-gold)" stroke="#73431e" stroke-width="3" stroke-linejoin="round"/><circle cx="32" cy="31" r="10" fill="#23583c" stroke="#8e602c" stroke-width="3"/>`,
      full: `<path d="M24 10H11v13m29-13h13v13M11 41v13h13m29-13v13H40" fill="none" stroke="#fff0bd" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
      fire: `<path d="M36 5c3 20 20 25 18 40-2 18-40 20-44 0-3-13 6-21 15-29-2 13 9 13 11-11Z" fill="url(#${id}-fire)" stroke="#a14c22" stroke-width="2"/><path d="M34 31c0 9 11 13 8 20-4 9-20 8-21-1-1-6 8-12 13-19Z" fill="#fff0a2"/>`,
      water: `<path d="M32 5C24 19 10 31 10 43c0 24 44 24 44 0 0-12-14-24-22-38Z" fill="url(#${id}-water)" stroke="#286a81" stroke-width="2"/><path d="M20 34c-6 8-3 17 4 19" fill="none" stroke="#e2feff" stroke-width="4" stroke-linecap="round"/><path d="M42 48q5-4 3-10" fill="none" stroke="#b6f3f6" stroke-width="2" stroke-linecap="round"/>`,
      paw: `<g fill="url(#${id}-gold)" stroke="#86562b" stroke-width="2"><path d="M32 33C22 33 9 47 12 54c3 8 13 1 20 1s18 7 20-1C56 45 42 33 32 33Z"/><ellipse cx="12" cy="29" rx="6" ry="9" transform="rotate(-25 12 29)"/><ellipse cx="25" cy="17" rx="6" ry="9"/><ellipse cx="40" cy="17" rx="6" ry="9"/><ellipse cx="54" cy="29" rx="6" ry="9" transform="rotate(25 54 29)"/></g>`,
      plant: `<path d="M32 56V28" stroke="#4d7536" stroke-width="4"/><path d="M31 38C9 39 8 26 10 19c19-2 24 7 21 19Zm2-10C33 11 44 8 55 12c0 16-9 20-22 16Z" fill="url(#${id}-leaf)" stroke="#3f6c34" stroke-width="2"/><path d="m17 26 14 11m3-10 14-9" stroke="#e0e9a3" stroke-width="2"/><path d="M14 59q18-9 36 0" stroke="#9a6a3d" stroke-width="5" stroke-linecap="round"/>`,
    };
    if (!paths[name]) return previous(raw);
    return `<svg class="nature-symbol brisa-icon brisa-${raw} ${name === "full" ? "brisa-full" : ""} arte-icon" viewBox="0 0 64 64" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><linearGradient id="${id}-leaf" x2=".8" y2="1"><stop stop-color="#d7eb78"/><stop offset=".5" stop-color="#91c84a"/><stop offset="1" stop-color="#3b813b"/></linearGradient><linearGradient id="${id}-gold" x2=".6" y2="1"><stop stop-color="#fff0b0"/><stop offset=".5" stop-color="#e8bd63"/><stop offset="1" stop-color="#b67932"/></linearGradient><linearGradient id="${id}-fire" x2=".3" y2="1"><stop stop-color="#ffdd6a"/><stop offset=".5" stop-color="#ff9a35"/><stop offset="1" stop-color="#dc5527"/></linearGradient><linearGradient id="${id}-water" x2=".8" y2="1"><stop stop-color="#91eff7"/><stop offset=".6" stop-color="#36b6df"/><stop offset="1" stop-color="#277cbb"/></linearGradient></defs>${paths[name]}</svg>`;
  }
  Raizes.icon = icon;
  const oldMarkup = BrisaArte.markup;
  BrisaArte.markup = (name) =>
    ["leaf", "book", "gear", "full", "water", "fire", "paw", "plant"].includes(
      name,
    )
      ? icon(name)
      : oldMarkup(name);
  GuardiaoIcones.markup = icon;
  if (window.GuardiaoArtesInterface) GuardiaoArtesInterface.svg = icon;
  document.addEventListener("DOMContentLoaded", () => {
    // A classe brisa-full conserva o observador de tela cheia sem recriar o ícone.
    document
      .querySelectorAll("[data-fullscreen]")
      .forEach((b) => (b.innerHTML = icon("full")));
  });
})();


;/* jogo/bosque-vivo/mochila.js */
"use strict";
(() => {
  const R = Raizes,
    A = BrisaArte;
  const phase = location.pathname.includes("floresta-viva")
    ? 1
    : location.pathname.includes("jornada")
      ? Number(new URLSearchParams(location.search).get("fase") || 2)
      : 0;
  let dialog,
    tab = "items";
  function itemCard(i) {
    const known = GuardiaoMemoria.has(i.id),
      state =
        phase === 1
          ? window.GuardiaoFloresta?.estado()
          : window.GuardiaoJornada?.estado();
    const canEquip =
      known &&
      i.phase === phase &&
      ((i.id === "mangueira" && !state?.equipped) ||
        (i.id === "protecao" && !state?.protective));
    return `<article class="brisa-item ${known ? "is-known" : "is-undiscovered"}" data-item="${i.id}" aria-label="${known ? i.name : "Equipamento ainda não descoberto"}"><div class="item-illustration" aria-hidden="true">${A.markup(i.id)}</div><div><h3>${known ? i.name : "A descobrir"}</h3><p>${known ? i.description : "Um novo cuidado guarda esta surpresa."}</p>${canEquip ? `<button type="button" data-pack-equip="${i.id}">Preparar equipamento</button>` : ""}</div></article>`;
  }
  function uniformCard(u) {
    const known = GuardiaoMemoria.hasUniform(u.id),
      active = known && GuardiaoMemoria.read().uniform === u.id;
    return `<article class="brisa-item brisa-uniform ${known ? "is-known" : "is-undiscovered"} ${active ? "is-worn" : ""}" data-uniform="${u.id}" aria-label="${u.name}${known ? "" : ", disponível na fase " + u.phase}"><div class="item-illustration uniform-${u.id}" aria-hidden="true">${BosqueKai.uniformMarkup(u.id)}</div><div><h3>${u.name}</h3><p>${known ? "Traje da fase " + (u.phase || 1) + "." : "Disponível na fase " + u.phase + "."}</p>${active ? '<span class="worn-label">Vestindo agora</span>' : ""}</div></article>`;
  }
  function render() {
    const m = GuardiaoMemoria,
      earned = m.obtained(),
      body = dialog.querySelector("#pack-content");
    dialog.dataset.packView = tab;
    dialog
      .querySelectorAll("[data-pack-tab]")
      .forEach((b) =>
        b.setAttribute("aria-selected", String(b.dataset.packTab === tab)),
      );
    const illustrated = !phase && window.MochilaIlustrada;
    if (illustrated) {
      const content = illustrated.content(tab, m);
      if (content !== null) {
        body.innerHTML = content;
        body.scrollTop = 0;
        return;
      }
    }
    if (tab === "items") {
      const sorted = [...m.items].sort(
        (a, b) => m.has(b.id) - m.has(a.id) || a.phase - b.phase,
      );
      body.innerHTML =
        '<p class="collection-hint">Cada aliado entrega ferramentas para cuidar da sua região.</p><div class="brisa-collection">' +
        sorted.map(itemCard).join("") +
        "</div>";
    } else if (tab === "uniforms")
      body.innerHTML =
        '<p class="collection-hint">Os trajes são preparados com o aliado de cada missão.</p><div class="brisa-collection uniform-collection">' +
        m.uniforms.map(uniformCard).join("") +
        "</div>";
    else
      body.innerHTML = `<div class="brisa-crystals"><div class="brisa-necklace">${GuardiaoRelicario.necklace(earned, "pack")}<h3>${earned.length} de 5 cristais</h3></div><div class="crystal-collection">${m.crystals
        .map((c, i) => {
          const known = earned.includes(c.id);
          return `<article class="${known ? "is-known" : "is-undiscovered"}"><div class="item-illustration">${GuardiaoRelicario.fragment(i, known)}</div><h3>${known ? "Cristal da " + c.name : "A descobrir"}</h3><p>${known ? c.description : "Um cuidado, uma nova peça."}</p></article>`;
        })
        .join("")}</div></div>`;
    body.scrollTop = 0;
  }
  function make() {
    if (dialog) return;
    dialog = document.createElement("dialog");
    dialog.id = "mochila-jornada";
    dialog.className = "ra-dialog ra-pack brisa-pack";
    dialog.setAttribute("aria-labelledby", "pack-title");
    if (!phase && window.MochilaIlustrada) {
      dialog.classList.add("kit-pack");
      dialog.innerHTML = MochilaIlustrada.shell();
    } else
      dialog.innerHTML = `<header><span class="pack-emblem">${A.markup("bag")}</span><div><p class="eyebrow">CUIDADOS QUE VIAJAM COM VOCÊ</p><h2 id="pack-title">Mochila de Kai</h2></div><button type="button" data-pack-close class="icon-button" aria-label="Fechar mochila">${R.icon("close")}</button></header><div class="ra-tabs" role="tablist" aria-label="Dentro da mochila"><button type="button" role="tab" data-pack-tab="items">Ferramentas</button><button type="button" role="tab" data-pack-tab="crystals">Colar</button><button type="button" role="tab" data-pack-tab="uniforms">Trajes</button></div><section id="pack-content" tabindex="0" role="tabpanel" aria-label="Coleção de Kai"></section><p id="pack-status" role="status"></p>`;
    document.body.append(dialog);
    dialog.addEventListener("click", (e) => {
      if (e.target.closest("[data-pack-close]")) dialog.close();
      const b = e.target.closest("[data-pack-tab]");
      if (b) {
        tab = b.dataset.packTab;
        render();
      }
      const equip = e.target.closest("[data-pack-equip]");
      if (equip && GuardiaoMemoria.has(equip.dataset.packEquip)) {
        dialog.close();
        document.dispatchEvent(
          new CustomEvent("guardiao:equipar", {
            detail: { id: equip.dataset.packEquip },
          }),
        );
      }
    });
    dialog.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        e.stopPropagation();
        dialog.close();
      }
      if (
        ["ArrowLeft", "ArrowRight"].includes(e.key) &&
        e.target.matches("[data-pack-tab]")
      ) {
        e.preventDefault();
        const tabs = [...dialog.querySelectorAll("[data-pack-tab]")],
          i = tabs.indexOf(e.target),
          b = tabs[(i + (e.key === "ArrowRight" ? 1 : 2)) % 3];
        b.click();
        b.focus();
      }
    });
  }
  document.addEventListener("guardiao:memoria", () => {
    if (dialog?.open) render();
  });
  function open() {
    if (window.VivaFinal?.active) return;
    make();
    document.querySelectorAll("dialog[open]").forEach((d) => {
      if (d !== dialog && d.id !== "girar-celular" && d.id !== "girar-tela")
        d.close();
    });
    document.dispatchEvent(new CustomEvent("guardiao:neutralizar"));
    render();
    if (!dialog.open) dialog.showModal();
  }
  document.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("map-backpack");
    if (button) button.onclick = open;
    document.addEventListener("keydown", (e) => {
      if (
        !phase &&
        e.key.toLowerCase() === "b" &&
        document.body.dataset.view === "mapa" &&
        !document.querySelector("dialog[open]")
      ) {
        e.preventDefault();
        open();
      }
    });
  });
  window.GuardiaoMochila = { open };
})();


;/* jogo/mochila-ilustrada/atlas.js */
"use strict";
window.MochilaIlustradaAtlas = {
  "painel-colar": {
    file: "assets/painel-colar.webp",
    size: [1585, 992],
    bounds: [0, 0, 1585, 992],
  },
  colar: {
    file: "assets/colar.webp",
    size: [1024, 1536],
    bounds: [0, 0, 1024, 1536],
  },
  "cristal-1": {
    file: "assets/cristal-1.webp",
    size: [434, 724],
    bounds: [83, 133, 284, 450],
  },
  "cristal-2": {
    file: "assets/cristal-2.webp",
    size: [435, 724],
    bounds: [87, 136, 293, 447],
  },
  "cristal-3": {
    file: "assets/cristal-3.webp",
    size: [434, 724],
    bounds: [72, 134, 288, 448],
  },
  "cristal-4": {
    file: "assets/cristal-4.webp",
    size: [435, 724],
    bounds: [54, 135, 292, 447],
  },
  "cristal-5": {
    file: "assets/cristal-5.webp",
    size: [434, 724],
    bounds: [62, 135, 291, 448],
  },
  "painel-trajes": {
    file: "assets/painel-trajes.webp",
    size: [1586, 992],
    bounds: [0, 0, 1586, 992],
  },
  "traje-1": {
    file: "assets/traje-1.webp",
    size: [434, 724],
    bounds: [48, 13, 372, 677],
  },
  "traje-2": {
    file: "assets/traje-2.webp",
    size: [435, 724],
    bounds: [88, 13, 325, 677],
  },
  "traje-3": {
    file: "assets/traje-3.webp",
    size: [434, 724],
    bounds: [71, 13, 319, 677],
  },
  "traje-4": {
    file: "assets/traje-4.webp",
    size: [435, 724],
    bounds: [51, 13, 318, 677],
  },
  "traje-5": {
    file: "assets/traje-5.webp",
    size: [434, 724],
    bounds: [46, 13, 321, 677],
  },
};


;/* jogo/mochila-ilustrada/mochila.js */
"use strict";
(() => {
  const base = new URL("./", ({src:new URL("../mochila-ilustrada/mochila.js?v=1",document.baseURI).href}).src),
    atlas = MochilaIlustradaAtlas;
  let serial = 0;
  const url = (name) => new URL(atlas[name].file, base).href;
  function art(
    name,
    rect = atlas[name].bounds,
    cls = "",
    fit = "xMidYMid meet",
  ) {
    const [w, h] = atlas[name].size;
    return `<svg class="kit-art ${cls}" viewBox="${rect.join(" ")}" preserveAspectRatio="${fit}" overflow="hidden" aria-hidden="true"><image href="${url(name)}" width="${w}" height="${h}"/></svg>`;
  }
  // Nine pieces keep the painted corners and edge thickness intact at each size.
  function frame(name, rect, bx, by, cls = "", center = true) {
    const [x, y, w, h] = rect,
      widths = [bx, w - bx * 2, bx],
      heights = [by, h - by * 2, by];
    return `<span class="kit-frame ${cls}" aria-hidden="true">${heights
      .map((hh, row) =>
        widths
          .map((ww, col) => {
            if (!center && row === 1 && col === 1) return "";
            const xx = x + (col === 0 ? 0 : col === 1 ? bx : w - bx),
              yy = y + (row === 0 ? 0 : row === 1 ? by : h - by);
            return `<span style="grid-area:${row + 1}/${col + 1}">${art(name, [xx, yy, ww, hh], "", "none")}</span>`;
          })
          .join(""),
      )
      .join("")}</span>`;
  }
  const card = () =>
      frame("painel-trajes", [47, 303, 302, 628], 60, 60, "kit-card-frame"),
    check = () =>
      art("painel-trajes", [1470, 320, 56, 56], "kit-check kit-round-icon"),
    tabArt = (selected) =>
      frame(
        "painel-colar",
        selected ? [548, 168, 490, 84] : [54, 168, 492, 84],
        70,
        30,
        selected ? "kit-tab-on" : "kit-tab-off",
      );
  function shell() {
    return `${frame("painel-colar", [0, 0, 1585, 992], 24, 24, "kit-window-frame", false)}
      <header class="kit-pack-heading">
        ${art("painel-colar", [200, 23, 1195, 125], "kit-heading-art", "xMidYMid slice")}
        ${art("painel-colar", [76, 31, 118, 118], "kit-pack-emblem kit-round-icon")}
        <div class="kit-heading-copy"><p class="eyebrow">CUIDADOS QUE VIAJAM COM VOCÊ</p><h2 id="pack-title">Mochila de Kai</h2></div>
        <button type="button" data-pack-close class="icon-button kit-close" aria-label="Fechar mochila">${art("painel-colar", [1417, 36, 98, 98], "kit-round-icon")}</button>
      </header>
      <div class="ra-tabs kit-tabs" role="tablist" aria-label="Dentro da mochila">
        ${[
          ["items", "Ferramentas"],
          ["crystals", "Colar"],
          ["uniforms", "Trajes"],
        ]
          .map(
            ([id, label]) =>
              `<button type="button" role="tab" data-pack-tab="${id}" aria-controls="pack-content" aria-selected="false">${tabArt(false)}${tabArt(true)}<span>${label}</span></button>`,
          )
          .join("")}
      </div>
      <section id="pack-content" tabindex="0" role="tabpanel" aria-label="Coleção de Kai"></section><p id="pack-status" role="status"></p>`;
  }
  const sockets = [
    "M385 730C429 774 455 829 435 879C418 921 368 950 344 979C320 935 286 906 285 866C280 816 331 772 385 730Z",
    "M292 974C350 1001 405 1014 417 1066C432 1117 378 1171 353 1195C314 1177 280 1144 273 1107C259 1061 282 1019 292 974Z",
    "M514 1099C503 1155 471 1188 444 1218C420 1256 469 1308 517 1348C565 1301 616 1266 607 1220C591 1175 544 1137 514 1099Z",
    "M743 974C732 1027 658 1007 612 1052C578 1102 629 1158 676 1195C720 1169 749 1143 754 1106C765 1059 748 1019 743 974Z",
    "M641 730C637 775 593 801 596 850C588 901 639 944 687 979C704 932 744 902 735 847C727 802 678 767 641 730Z",
  ];
  function necklace(earned) {
    const id = "mochila-pedras-" + ++serial;
    return `<svg class="kit-necklace-art" viewBox="0 0 1024 1536" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Colar com ${earned.length} de 5 cristais">
      <defs><filter id="${id}-dim" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope=".35" intercept=".18"/><feFuncG type="linear" slope=".38" intercept=".22"/><feFuncB type="linear" slope=".28" intercept=".12"/></feComponentTransfer></filter>
      ${sockets.map((d, i) => `<clipPath id="${id}-${i}"><path d="${d}"/></clipPath>`).join("")}</defs>
      <image href="${url("colar")}" width="1024" height="1536"/>
      ${sockets.map((_, i) => (earned.includes(i + 1) ? "" : `<g data-kit-empty-gem="${i + 1}" clip-path="url(#${id}-${i})"><image href="${url("colar")}" width="1024" height="1536" filter="url(#${id}-dim)"/></g>`)).join("")}
    </svg>`;
  }
  function crystals(memory) {
    const earned = memory.obtained();
    return `<div class="kit-crystals"><figure class="kit-necklace">
        ${art("painel-colar", [40, 262, 425, 645], "kit-necklace-panel", "none")}
        ${necklace(earned)}<figcaption>${earned.length} de 5 cristais</figcaption>
      </figure><div class="kit-crystal-grid">${memory.crystals
        .map((c) => {
          const known = earned.includes(c.id);
          return `<article class="kit-card kit-crystal ${known ? "is-known" : "is-undiscovered"}" data-crystal="${c.id}">
          ${card()}${known ? check() : ""}<div class="kit-gem-picture">${art("cristal-" + c.id)}</div>
          <h3>Cristal ${c.id === 1 ? "do" : "da"} ${c.name}</h3><p>${known ? c.description : "Conclua a fase " + c.id + " para descobrir este cuidado."}</p>
        </article>`;
        })
        .join("")}</div></div>`;
  }
  function uniforms(memory) {
    const active = memory.read().uniform;
    return `<div class="kit-uniforms"><p class="collection-hint">Os trajes são preparados com o aliado de cada missão.</p><div class="kit-outfit-grid">${memory.uniforms
      .map((u, i) => {
        const known = memory.hasUniform(u.id),
          worn = known && active === u.id;
        return `<article class="kit-card kit-uniform ${known ? "is-known" : "is-undiscovered"} ${worn ? "is-worn" : ""}" data-uniform="${u.id}" aria-label="${u.name}${known ? "" : ", disponível na fase " + (u.phase || 1)}">
        ${card()}${worn ? check() : ""}<div class="kit-outfit-picture">${art("traje-" + (i + 1), undefined, "kit-outfit")}</div>
        <h3>${u.name}</h3><p>${known ? "Traje da fase " + (u.phase || 1) + "." : "Disponível na fase " + u.phase + "."}</p>
        <div class="kit-worn-place">${worn ? `<span class="worn-label">${frame("painel-trajes", [1276, 862, 229, 49], 26, 19, "kit-worn-art")}<span>Vestindo agora</span></span>` : ""}</div>
      </article>`;
      })
      .join("")}</div></div>`;
  }
  window.MochilaIlustrada = Object.freeze({
    art,
    frame,
    shell,
    content: (tab, memory) =>
      tab === "items"
        ? (window.CincoMissoes?.tools(memory) ?? null)
        : tab === "uniforms"
          ? uniforms(memory)
          : crystals(memory),
  });
})();


;/* jogo/cinco-missoes/atlas.js */
"use strict";
Object.assign(window.MochilaIlustradaAtlas, {
  "ferramenta-1": {
    file: "../cinco-missoes/assets/ferramenta-1.webp",
    size: [512, 512],
    bounds: [67, 86, 406, 352],
  },
  "ferramenta-2": {
    file: "../cinco-missoes/assets/ferramenta-2.webp",
    size: [512, 512],
    bounds: [96, 71, 342, 366],
  },
  "ferramenta-3": {
    file: "../cinco-missoes/assets/ferramenta-3.webp",
    size: [512, 512],
    bounds: [39, 86, 405, 344],
  },
  "ferramenta-4": {
    file: "../cinco-missoes/assets/ferramenta-4.webp",
    size: [512, 512],
    bounds: [56, 55, 426, 365],
  },
  "ferramenta-5": {
    file: "../cinco-missoes/assets/ferramenta-5.webp",
    size: [512, 512],
    bounds: [41, 53, 428, 359],
  },
  "ferramenta-6": {
    file: "../cinco-missoes/assets/ferramenta-6.webp",
    size: [512, 512],
    bounds: [54, 57, 390, 355],
  },
  "ferramenta-7": {
    file: "../cinco-missoes/assets/ferramenta-7.webp",
    size: [512, 512],
    bounds: [62, 81, 419, 360],
  },
  "ferramenta-8": {
    file: "../cinco-missoes/assets/ferramenta-8.webp",
    size: [512, 512],
    bounds: [50, 99, 407, 326],
  },
  "ferramenta-9": {
    file: "../cinco-missoes/assets/ferramenta-9.webp",
    size: [512, 512],
    bounds: [90, 72, 348, 371],
  },
  "ferramenta-10": {
    file: "../cinco-missoes/assets/ferramenta-10.webp",
    size: [512, 512],
    bounds: [82, 52, 381, 387],
  },
  "ferramenta-11": {
    file: "../cinco-missoes/assets/ferramenta-11.webp",
    size: [512, 512],
    bounds: [45, 52, 408, 393],
  },
  "ferramenta-12": {
    file: "../cinco-missoes/assets/ferramenta-12.webp",
    size: [512, 512],
    bounds: [65, 64, 353, 376],
  },
  "ferramenta-13": {
    file: "../cinco-missoes/assets/ferramenta-13.webp",
    size: [627, 627],
    bounds: [62, 115, 529, 424],
  },
  "ferramenta-14": {
    file: "../cinco-missoes/assets/ferramenta-14.webp",
    size: [627, 627],
    bounds: [35, 103, 496, 445],
  },
  "ferramenta-15": {
    file: "../cinco-missoes/assets/ferramenta-15.webp",
    size: [627, 627],
    bounds: [59, 89, 537, 436],
  },
  "ferramenta-16": {
    file: "../cinco-missoes/assets/ferramenta-16.webp",
    size: [627, 627],
    bounds: [29, 80, 537, 425],
  },
  "painel-ferramentas": {
    file: "../cinco-missoes/assets/painel-ferramentas.webp",
    size: [1585, 992],
    bounds: [0, 0, 1585, 992],
  },
  "painel-apresentacao": {
    file: "../cinco-missoes/assets/painel-apresentacao.webp",
    size: [1672, 941],
    bounds: [0, 0, 1672, 941],
  },
  "botao-fase": {
    file: "../cinco-missoes/assets/botao-fase.webp",
    size: [735, 122],
    bounds: [0, 0, 735, 122],
  },
  "fechar-fase": {
    file: "../cinco-missoes/assets/fechar-fase.webp",
    size: [106, 107],
    bounds: [0, 0, 106, 107],
  },
  "cena-1": {
    file: "../cinco-missoes/assets/cena-1.webp",
    size: [631, 481],
    bounds: [0, 0, 631, 481],
  },
  "cena-2": {
    file: "../cinco-missoes/assets/cena-2.webp",
    size: [631, 481],
    bounds: [0, 0, 631, 481],
  },
  "cena-3": {
    file: "../cinco-missoes/assets/cena-3.webp",
    size: [631, 481],
    bounds: [0, 0, 631, 481],
  },
  "cena-4": {
    file: "../cinco-missoes/assets/cena-4.webp",
    size: [631, 481],
    bounds: [0, 0, 631, 481],
  },
  "cena-5": {
    file: "../cinco-missoes/assets/cena-5.webp",
    size: [631, 481],
    bounds: [0, 0, 631, 481],
  },
  "emblema-1": {
    file: "../cinco-missoes/assets/emblema-1.webp",
    size: [115, 109],
    bounds: [0, 0, 115, 109],
  },
  "emblema-2": {
    file: "../cinco-missoes/assets/emblema-2.webp",
    size: [115, 109],
    bounds: [0, 0, 115, 109],
  },
  "emblema-3": {
    file: "../cinco-missoes/assets/emblema-3.webp",
    size: [115, 109],
    bounds: [0, 0, 115, 109],
  },
  "emblema-4": {
    file: "../cinco-missoes/assets/emblema-4.webp",
    size: [115, 109],
    bounds: [0, 0, 115, 109],
  },
  "emblema-5": {
    file: "../cinco-missoes/assets/emblema-5.webp",
    size: [115, 109],
    bounds: [0, 0, 115, 109],
  },
});


;/* jogo/cinco-missoes/arte.js */
"use strict";
(() => {
  const base = new URL("./", ({src:new URL("../cinco-missoes/arte.js?v=1",document.baseURI).href}).src);
  const { art, frame } = MochilaIlustrada,
    ids = GuardiaoMemoria.items.map((i) => i.id);
  // A mesma área quadrada centraliza peças largas e altas sem esticá-las.
  const tool = (id) => {
    const name = "ferramenta-" + (ids.indexOf(id) + 1),
      [x, y, w, h] = MochilaIlustradaAtlas[name].bounds,
      side = Math.max(w, h);
    return art(
      name,
      [x + (w - side) / 2, y + (h - side) / 2, side, side],
      "mission-tool",
    );
  };
  const card = () =>
    frame(
      "painel-ferramentas",
      [47, 300, 486, 299],
      64,
      64,
      "mission-card-frame",
    );
  const green = (cls) =>
    frame("painel-apresentacao", [748, 162, 874, 64], 70, 25, cls);
  function tools(memory) {
    const sorted = [...memory.items].sort(
      (a, b) => memory.has(b.id) - memory.has(a.id) || a.phase - b.phase,
    );
    return (
      '<p class="collection-hint">Cada aliado entrega ferramentas para cuidar da sua região.</p><div class="brisa-collection mission-tools-grid">' +
      sorted
        .map((i) => {
          const known = memory.has(i.id),
            description =
              i.id === "jardim"
                ? "Ajuda a cuidar dos espaços verdes da comunidade."
                : i.description;
          return `<article class="brisa-item mission-tool-card ${known ? "is-known" : "is-undiscovered"}" data-item="${i.id}" aria-label="${known ? i.name : "Equipamento ainda não descoberto"}">
        ${card()}<div class="item-illustration" aria-hidden="true">${tool(i.id)}</div><div><h3>${known ? i.name : "A descobrir"}</h3><p>${known ? description : "Um novo cuidado guarda esta surpresa."}</p></div>
      </article>`;
        })
        .join("") +
      "</div>"
    );
  }
  function decorate() {
    const dialog = document.getElementById("phase-dialog");
    if (dialog.dataset.kitDecorated) return;
    dialog.dataset.kitDecorated = "true";
    dialog.insertAdjacentHTML(
      "afterbegin",
      frame(
        "painel-apresentacao",
        [0, 0, 1672, 941],
        21,
        21,
        "brief-window-frame",
        false,
      ),
    );
    dialog
      .querySelector("header")
      .insertAdjacentHTML(
        "afterbegin",
        art(
          "painel-apresentacao",
          [200, 22, 1280, 104],
          "brief-heading-art",
          "xMidYMid slice",
        ),
      );
    dialog
      .querySelectorAll(".phase-copy > section, .phase-loot > section")
      .forEach((section) => {
        section.insertAdjacentHTML("afterbegin", card());
        section
          .querySelector("h3")
          .insertAdjacentHTML("afterbegin", green("brief-label-art"));
      });
    dialog
      .querySelector(".phase-scene")
      .insertAdjacentHTML("afterbegin", card());
    dialog
      .querySelector("figcaption")
      .insertAdjacentHTML(
        "afterbegin",
        frame(
          "painel-apresentacao",
          [49, 660, 675, 97],
          76,
          32,
          "brief-caption-art",
        ),
      );
    for (const id of ["phase-back", "start-phase"])
      document
        .getElementById(id)
        .insertAdjacentHTML(
          "afterbegin",
          frame("botao-fase", [0, 0, 735, 122], 90, 42, "brief-action-art"),
        );
  }
  function brief(id) {
    decorate();
    const dialog = document.getElementById("phase-dialog"),
      picture = document.getElementById("phase-picture"),
      src = new URL("assets/cena-" + id + ".webp", base).href;
    dialog.dataset.kitPhase = String(id);
    document.body.dataset.meetingFlora = "ombro";
    picture.alt =
      "Kai e Flora com " + document.getElementById("phase-npc").textContent;
    if (picture.src !== src) {
      dialog.dataset.pictureReady = "false";
      picture.onload = () => {
        if (picture.src === src) dialog.dataset.pictureReady = "true";
      };
      picture.src = src;
    }
    document.getElementById("phase-emblem").innerHTML = art(
      "emblema-" + id,
      [0, 3, 114, 106],
      "kit-round-icon",
    );
    document.getElementById("close-phase").innerHTML =
      window.GuardiaoRemodelacao
        ? GuardiaoRemodelacao.icon("close")
        : art("fechar-fase", [6, 6, 96, 96], "kit-round-icon");
    const items = GuardiaoMemoria.items.filter((i) => i.phase === id);
    document.getElementById("phase-items").innerHTML =
      `<span class="brief-item-art" aria-hidden="true">${items.map((i) => tool(i.id)).join("")}</span><span>${
        {
          1: "Mangueira e kit de cuidado",
          2: "Rede, bolsa e proteção do rio",
          3: "Kit veterinário e material de resgate",
          4: "Sementes, mudas e regador",
          5: "Materiais para cuidar da cidade",
        }[id]
      }</span>`;
    document.getElementById("phase-reward").innerHTML = art("cristal-" + id);
    const start = document.getElementById("start-phase");
    if (!start.querySelector(".brief-action-art"))
      start.insertAdjacentHTML(
        "afterbegin",
        frame("botao-fase", [0, 0, 735, 122], 90, 42, "brief-action-art"),
      );
  }
  window.CincoMissoes = Object.freeze({ tools, tool, brief });
})();


;/* jogo/brisa-suave/transicoes.js */
"use strict";
(() => {
  const base = new URL("../trilhas-vivas/", ({src:new URL("../brisa-suave/transicoes.js?v=suave-1",document.baseURI).href}).src),
    cover = 480,
    reveal = 600,
    key = "guardiao.passagem.v2";
  let el,
    busy = false,
    arriving = false,
    count = 0,
    epoch = 0,
    queued = null,
    arrival = Promise.resolve();
  const reduced = () =>
    BrisaArte.reduced() || Raizes.prefs().screenTransitions === false;
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  function ensure() {
    if (el) return;
    el = document.createElement("div");
    el.id = "leaf-transition";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML =
      '<div class="grove-shade"></div><div class="grove-half left"></div><div class="grove-half right"></div>' +
      Array.from(
        { length: 8 },
        (_, i) =>
          `<img class="grove-leaf" src="${new URL("assets/folha-" + (i % 3) + ".webp", base)}" alt="" style="--i:${i};--x:${10 + ((i * 31) % 80)}%;--y:${8 + ((i * 23) % 84)}%;--angle:${i * 47}deg">`,
      ).join("") +
      '<span class="grove-loading">Uma nova trilha<span aria-hidden="true">• • •</span></span>';
    document.body.append(el);
  }
  async function limited(promise, ms = 8000) {
    let timer;
    try {
      await Promise.race([
        Promise.resolve(promise).catch(() => {}),
        new Promise((r) => {
          timer = setTimeout(r, ms);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }
  async function viewReady() {
    if (location.hash === "#mapa") await limited(window.BosqueMapa?.ready?.());
  }
  async function open(ticket) {
    if (ticket !== epoch) return;
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r)),
    );
    if (ticket !== epoch) return;
    document.body.dataset.transition = "abrindo";
    el.classList.remove("grove-arriving", "grove-closed", "grove-waiting");
    el.classList.add("is-leaving");
    await delay(reveal);
    if (ticket !== epoch) return;
    el.className = "";
    busy = arriving = false;
    document.body.dataset.transition = "pronta";
  }
  async function run(change, options = {}) {
    if (busy) {
      if (arriving) {
        queued = { change, options };
        await arrival;
        const next = queued;
        queued = null;
        if (next) return run(next.change, next.options);
      }
      return false;
    }
    if (reduced()) {
      change?.();
      return true;
    }
    ensure();
    busy = true;
    count++;
    const ticket = ++epoch;
    document.body.dataset.transition = "fechando";
    el.className = "is-covering";
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r)),
    );
    el.classList.add("grove-closed");
    await delay(cover);
    if (ticket !== epoch) return false;
    if (options.navigation) {
      try {
        sessionStorage.setItem(
          key,
          JSON.stringify({ url: options.navigation, at: Date.now() }),
        );
      } catch {}
      el.classList.add("grove-waiting");
      change?.();
      // A página de saída permanece coberta. A chegada é aberta pelo documento novo.
      return true;
    }
    try {
      await change?.();
      await delay(0);
      await viewReady();
    } finally {
      await open(ticket);
    }
    return true;
  }
  window.VivaTransicao = {
    run,
    flash: () => run(),
    state: () => ({
      busy,
      count,
      cover,
      reveal,
      duration: cover + reveal,
      arriving,
      renderer: "brisa-suave",
    }),
  };
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      epoch++;
      busy = arriving = false;
      queued = null;
      if (el) el.className = "";
      document.body.dataset.transition = "pronta";
    }
  });
  document.addEventListener("DOMContentLoaded", () => {
    ensure();
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href]");
      if (
        !a ||
        e.defaultPrevented ||
        e.button > 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        a.target ||
        a.hasAttribute("download")
      )
        return;
      const u = new URL(a.href);
      if (
        u.origin !== location.origin ||
        a.getAttribute("aria-disabled") === "true"
      )
        return;
      const same =
        u.pathname === location.pathname && u.search === location.search;
      if (same && u.hash === location.hash) return;
      e.preventDefault();
      if (!same) {
        document.dispatchEvent(new CustomEvent("guardiao:neutralizar"));
        a.closest("dialog[open]")?.close();
      }
      run(
        () => (same ? (location.hash = u.hash) : location.assign(u.href)),
        same ? {} : { navigation: u.href },
      );
    });
    let handoff;
    try {
      handoff = JSON.parse(sessionStorage.getItem(key) || "null");
      sessionStorage.removeItem(key);
    } catch {}
    const destination = handoff?.url ? new URL(handoff.url) : null;
    const handed =
      destination &&
      Date.now() - handoff.at < 30000 &&
      destination.pathname === location.pathname &&
      destination.search === location.search;
    if (reduced() || !handed) {
      document.body.dataset.transition = "pronta";
      return;
    }
    busy = arriving = true;
    const ticket = ++epoch;
    el.className = "is-covering grove-closed grove-arriving grove-waiting";
    arrival = (async () => {
      if (
        document.body.dataset.gameReady !== "true" &&
        document.body.dataset.uiReady !== "true" &&
        !document.body.dataset.loadingState
      )
        await limited(
          new Promise((resolve) => {
            const observer = new MutationObserver(() => {
              if (
                document.body.dataset.gameReady === "true" ||
                document.body.dataset.uiReady === "true" ||
                document.querySelector("#loading a") ||
                document.body.dataset.loadingState === "loading" ||
                document.body.dataset.loadingState === "error"
              ) {
                observer.disconnect();
                resolve();
              }
            });
            observer.observe(document.body, {
              attributes: true,
              attributeFilter: [
                "data-game-ready",
                "data-ui-ready",
                "data-loading-state",
              ],
              childList: true,
              subtree: true,
            });
            setTimeout(() => {
              observer.disconnect();
              resolve();
            }, 8000);
          }),
        );
      await viewReady();
      await open(ticket);
    })();
  });
})();


;/* jogo/trilhas-vivas/folhas.js */
"use strict";
(() => {
  const base = new URL("./", ({src:new URL("../trilhas-vivas/folhas.js?v=trilhas-1",document.baseURI).href}).src),
    images = [],
    particles = Array.from({ length: 24 }, (_, i) => ({
      x: ((i * 317 + 53) % 997) / 997,
      y: ((i * 127 + 41) % 541) / 541,
      size: 22 + (i % 5) * 3,
      speed: 0.035 + (i % 4) * 0.006,
      spin: i * 1.7,
      frame: i % 3,
    })),
    bursts = [];
  let canvas,
    ctx,
    raf = 0,
    last = 0,
    time = 0,
    active = false,
    ready = false,
    w = 0,
    h = 0,
    ratio = 1,
    burstCount = 0,
    burstAt = -999,
    targetX = 0,
    targetY = 0,
    px = 0,
    py = 0,
    home;
  function resize() {
    w = innerWidth;
    h = innerHeight;
    ratio = Math.min(
      devicePixelRatio || 1,
      Raizes.prefs().graphicsQuality === "leve" ? 1 : 1.5,
    );
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  function burst(target) {
    if (
      !ready ||
      BrisaArte.reduced() ||
      Raizes.prefs().fallingLeaves === false ||
      performance.now() - burstAt < 360
    )
      return;
    burstAt = performance.now();
    const r = target.getBoundingClientRect();
    for (let i = 0; i < 5; i++)
      bursts.push({
        x: r.x + r.width * (0.24 + (i % 3) * 0.25),
        y: r.y + r.height * 0.45,
        vx: (i % 2 ? 1 : -1) * (18 + i * 8),
        vy: -35 - (i % 3) * 12,
        age: 0,
        ttl: 1.7,
        size: 21 + (i % 3) * 3,
        spin: i,
        frame: i % 3,
      });
    if (bursts.length > 15) bursts.splice(0, bursts.length - 15);
    burstCount++;
  }
  function draw(p, x, y, a, alpha, squeeze = 1) {
    const im = images[p.frame];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.scale(squeeze, 1);
    ctx.globalAlpha = alpha;
    ctx.drawImage(im, -p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  }
  function frame(now) {
    raf = 0;
    if (document.hidden) return;
    const dt = Math.min(0.04, last ? (now - last) / 1000 : 0);
    last = now;
    active =
      ready &&
      document.body.dataset.view === "inicio" &&
      !document.querySelector("dialog[open]");
    canvas.hidden = !active;
    if (active) {
      time += dt;
      home ||= document.querySelector(".home-landscape");
      px += (targetX - px) * (1 - Math.exp(-dt * 6));
      py += (targetY - py) * (1 - Math.exp(-dt * 6));
      if (home && !BrisaArte.reduced())
        home.style.transform = `translate3d(${px * 5}px,${py * 3}px,0) scale(1.018)`;
      ctx.clearRect(0, 0, w, h);
      if (Raizes.prefs().fallingLeaves !== false && !BrisaArte.reduced()) {
        const n =
          Raizes.prefs().graphicsQuality === "leve" ? 10 : w < 900 ? 16 : 24;
        for (let i = 0; i < n; i++) {
          const p = particles[i];
          p.y += p.speed * dt;
          if (p.y > 1.09) {
            p.y = -0.09;
            p.x = (p.x + 0.37) % 1;
          }
          draw(
            p,
            (p.x + Math.sin(time * 0.5 + i) * 0.035) * w + px * 4,
            p.y * h,
            p.spin + time * (i % 2 ? 0.35 : -0.28),
            0.65 + (i % 3) * 0.09,
            0.7 + Math.abs(Math.cos(time * 0.6 + i)) * 0.3,
          );
        }
        for (let i = bursts.length - 1; i >= 0; i--) {
          const p = bursts[i];
          p.age += dt;
          p.x += p.vx * dt;
          p.vy += 48 * dt;
          p.y += p.vy * dt;
          draw(
            p,
            p.x,
            p.y,
            p.spin + p.age * 0.9,
            Math.min(1, (p.ttl - p.age) * 2),
          );
          if (p.age >= p.ttl) bursts.splice(i, 1);
        }
      }
    } else {
      bursts.length = 0;
      last = 0;
    }
    // Fora da abertura não há trabalho de canvas; a mesma rotina retoma ao voltar.
    if (active) raf = requestAnimationFrame(frame);
  }
  function start() {
    if (!raf && !document.hidden) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    canvas = document.createElement("canvas");
    canvas.id = "falling-leaves";
    canvas.setAttribute("aria-hidden", "true");
    document.body.append(canvas);
    ctx = canvas.getContext("2d");
    resize();
    Promise.all(
      [0, 1, 2].map(async (i) => {
        const im = new Image();
        im.src = new URL("assets/folha-" + i + ".webp", base);
        await im.decode();
        images[i] = im;
      }),
    )
      .then(() => {
        ready = true;
        start();
      })
      .catch(() => {});
    home = document.querySelector(".home-landscape");
    setTimeout(() => {
      for (const button of document.querySelectorAll(".home-menu a")) {
        const face = document.createElement("span");
        face.className = "drifting-face";
        face.append(...button.childNodes);
        button.append(face);
      }
    }, 0);
    const area = document.querySelector(".home");
    area?.addEventListener(
      "pointermove",
      (e) => {
        if (BrisaArte.reduced()) return;
        targetX = (e.clientX / w - 0.5) * 2;
        targetY = (e.clientY / h - 0.5) * 2;
      },
      { passive: true },
    );
    area?.addEventListener("pointerleave", (e) => {
      if (e.pointerType !== "touch") targetX = targetY = 0;
    });
    for (const b of document.querySelectorAll(".home-menu a,.home-settings")) {
      b.addEventListener("pointerenter", (e) => {
        if (e.pointerType !== "touch") burst(b);
      });
      b.addEventListener("pointerdown", () => burst(b));
      b.addEventListener("focus", () => burst(b));
    }
    area?.addEventListener(
      "pointerdown",
      (e) => {
        if (e.target.closest("a,button")) return;
        targetX = (e.clientX / w - 0.5) * 2;
        targetY = (e.clientY / h - 0.5) * 2;
        burst({
          getBoundingClientRect: () => ({
            x: e.clientX - 25,
            y: e.clientY - 12,
            width: 50,
            height: 24,
          }),
        });
      },
      { passive: true },
    );
    window.VivaFolhas = {
      canvas,
      burst,
      state: () => ({
        active:
          active &&
          Raizes.prefs().fallingLeaves !== false &&
          !BrisaArte.reduced(),
        time,
        count:
          Raizes.prefs().graphicsQuality === "leve"
            ? 10
            : innerWidth < 900
              ? 16
              : 24,
        burstCount,
        burstParticles: bursts.length,
        parallax: [px, py],
      }),
    };
    new MutationObserver(start).observe(document.body, {
      attributes: true,
      attributeFilter: ["data-view", "class"],
    });
    window.addEventListener("resize", resize);
    window.addEventListener("guardiao:preferencias", () => {
      resize();
      if (BrisaArte.reduced() && home) home.style.transform = "";
      start();
    });
    window.addEventListener("pagehide", () => {
      cancelAnimationFrame(raf);
      raf = 0;
    });
    window.addEventListener("pageshow", start);
    document.addEventListener("visibilitychange", start);
  });
})();


;/* jogo/bosque-vivo/cenario-atlas.js */
window.BosqueVegetacaoAtlas = {
  vegetacao: {
    file: "assets/vegetacao.webp",
    width: 1376,
    height: 1032,
    frames: [
      { bounds: [24, 10, 281, 326] },
      { bounds: [359, 8, 314, 330] },
      { bounds: [755, 10, 277, 325] },
      { bounds: [1032, 8, 335, 329] },
      { bounds: [8, 379, 328, 280] },
      { bounds: [347, 379, 334, 282] },
      { bounds: [688, 381, 333, 284] },
      { bounds: [1032, 384, 337, 264] },
      { bounds: [20, 736, 303, 232] },
      { bounds: [372, 739, 279, 232] },
      { bounds: [735, 692, 249, 285] },
      { bounds: [1090, 784, 230, 165] },
    ],
  },
  objetos: {
    file: "assets/objetos.webp",
    width: 1376,
    height: 688,
    frames: [
      { bounds: [5, 5, 337, 333] },
      { bounds: [349, 30, 336, 305] },
      { bounds: [693, 30, 333, 306] },
      { bounds: [1034, 9, 342, 316] },
      { bounds: [16, 394, 318, 259] },
      { bounds: [348, 407, 335, 233] },
      { bounds: [710, 389, 293, 265] },
      { bounds: [1037, 350, 333, 326] },
    ],
  },
};


;/* jogo/bosque-vivo/vegetacao.js */
"use strict";
(() => {
  const base = new URL("./", ({src:new URL("../bosque-vivo/vegetacao.js?v=bosque-1",document.baseURI).href}).src),
    images = new Map();
  let ready = false,
    promise;
  async function load() {
    if (promise) return promise;
    promise = Promise.allSettled(
      Object.entries(BosqueVegetacaoAtlas).map(async ([name, d]) => {
        const im = new Image();
        im.src = new URL(d.file, base);
        await im.decode();
        images.set(name, im);
      }),
    ).then(() => {
      ready = images.has("vegetacao");
    });
    return promise;
  }
  function draw(c, name, index, x, y, height) {
    const im = images.get(name),
      d = BosqueVegetacaoAtlas[name];
    if (!im || !d) return false;
    const f = d.frames[index],
      b = f.bounds,
      k = height / b[3];
    c.drawImage(im, ...b, x - (b[2] * k) / 2, y - b[3] * k, b[2] * k, b[3] * k);
    return true;
  }
  window.BosqueVegetacao = {
    load,
    draw,
    get ready() {
      return ready;
    },
  };
})();


;/* jogo/bosque-vivo/pintura.js */
"use strict";
// Elementos do cenário: a mesma árvore cresce no mesmo ponto do terreno.
(() => {
  const TAU = Math.PI * 2;
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const ease = (v) => {
    v = clamp(v);
    return v * v * (3 - 2 * v);
  };
  function random(seed) {
    return () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function mix(a, b, t) {
    const c = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const x = c(a),
      y = c(b);
    t = clamp(t);
    return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(",")})`;
  }
  function poly(c, points) {
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
  }
  function oval(c, x, y, rx, ry, color) {
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), 0, 0, TAU);
    c.fill();
  }
  function line(c, points, color, width) {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineJoin = c.lineCap = "round";
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
  }
  function leaf(c, x, y, size, angle, color) {
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(-size * 0.5, 0);
    c.bezierCurveTo(
      -size * 0.1,
      -size * 0.7,
      size * 0.5,
      -size * 0.4,
      size * 0.6,
      0,
    );
    c.bezierCurveTo(
      size * 0.1,
      size * 0.45,
      -size * 0.2,
      size * 0.45,
      -size * 0.5,
      0,
    );
    c.fill();
    line(
      c,
      [
        [-size * 0.4, 0],
        [size * 0.5, 0],
      ],
      "#e0eaa455",
      Math.max(0.5, size * 0.04),
    );
    c.restore();
  }
  // Branch length and individual leaf scales change continuously; no healthy-map bitmap.
  function tree(c, x, y, height, growth, time = 0, seed = 0, muted = false) {
    const g = ease(growth),
      r = random(seed + 83),
      sway = muted ? 0 : Math.sin(time * 1.1 + seed) * 0.014;
    c.save();
    c.translate(x, y);
    c.rotate(sway * (0.3 + g));
    c.scale(height / 100, height / 100);
    oval(c, 3, 2, 28 + g * 12, 8, "#26352726");
    if (window.BosqueVegetacao?.ready) {
      BosqueVegetacao.draw(
        c,
        "vegetacao",
        seed === 810 ? 3 : 1,
        0,
        0,
        43 + g * 43,
      );
      const buds = [
        [-21, -48, 33],
        [-30, -63, 37],
        [25, -52, 38],
        [21, -75, 42],
        [0, -86, 44],
      ];
      for (let i = 0; i < buds.length; i++) {
        const [bx, by, h] = buds[i],
          bud = ease((g - i * 0.035) / 0.84);
        if (bud > 0.004)
          BosqueVegetacao.draw(
            c,
            "vegetacao",
            4 + (Math.floor(seed) % 3),
            bx * bud,
            by * (0.5 + 0.5 * bud) + h * bud * 0.2,
            h * bud,
          );
      }
      if (g > 0.25) BosqueVegetacao.draw(c, "vegetacao", 8, 4, 4, 15 * g);
      c.restore();
      return;
    }
    const h = 32 + g * 38;
    line(
      c,
      [
        [-15, 2],
        [-3, -5],
        [1, -h],
      ],
      "#463c2c",
      9,
    );
    line(
      c,
      [
        [14, 3],
        [2, -7],
        [1, -h],
      ],
      mix("#69513b", "#97683c", g),
      6,
    );
    line(
      c,
      [
        [-1, -4],
        [2, -h],
      ],
      "#c69b5c66",
      1.7,
    );
    for (let i = 0; i < 8; i++) {
      const side = i % 2 ? 1 : -1,
        by = -h * (0.3 + i * 0.075);
      const bx = side * (15 + r() * 22) * (0.45 + g * 0.55),
        yy = by - 12 - r() * 13;
      line(
        c,
        [
          [1, by + 12],
          [bx * 0.55, by],
          [bx, yy],
        ],
        mix("#493e32", "#8b6038", g),
        3.6 - i * 0.18,
      );
      const bud = ease((g - (i % 4) * 0.065) / 0.79);
      if (bud > 0.005) {
        const a = 11 + r() * 10,
          b = 8 + r() * 7;
        oval(c, bx + 2, yy + 2, a * bud, b * bud, "#264f36");
        oval(
          c,
          bx - 2,
          yy - 2,
          a * bud,
          b * bud,
          i % 3 === 0 ? "#6f9e46" : "#4b8342",
        );
        oval(c, bx - 5, yy - 5, a * 0.67 * bud, b * 0.52 * bud, "#a6c96288");
        for (let j = 0; j < 5; j++)
          leaf(
            c,
            bx - a * 0.7 + r() * a * 1.4,
            yy - b * 0.6 + r() * b,
            (6 + r() * 5) * bud,
            r() * 3 - 1.5,
            j % 2 ? "#a1c95e" : "#78aa4b",
          );
      }
    }
    if (g > 0.6)
      for (let j = 0; j < 4; j++)
        leaf(c, -12 + j * 8, -2, 7 * g, j * 0.8, "#7ca84b");
    c.restore();
  }
  function rock(c, x, y, rx, ry) {
    if (
      window.BosqueVegetacao?.ready &&
      BosqueVegetacao.draw(c, "objetos", 4, x, y, ry * 2 + rx * 0.4)
    )
      return;
    oval(c, x + 2, y + 3, rx + 2, ry * 0.65, "#203c3429");
    c.fillStyle = "#717c6c";
    poly(c, [
      [x - rx, y],
      [x - rx * 0.7, y - ry],
      [x + rx * 0.4, y - ry * 1.25],
      [x + rx, y - ry * 0.25],
      [x + rx * 0.7, y + ry * 0.3],
      [x - rx * 0.6, y + ry * 0.3],
    ]);
    c.fill();
    c.fillStyle = "#b7b7a0";
    poly(c, [
      [x - rx, y],
      [x - rx * 0.7, y - ry],
      [x + rx * 0.4, y - ry * 1.25],
      [x + rx * 0.2, y - ry * 0.25],
    ]);
    c.fill();
    line(
      c,
      [
        [x - rx * 0.5, y - ry * 0.6],
        [x, y - ry * 0.85],
        [x + rx * 0.22, y - ry * 0.8],
      ],
      "#dddbc366",
      1,
    );
  }
  function house(c, x, y, w, h, town = false) {
    if (window.BosqueVegetacao?.ready) {
      oval(c, x, y, w * 0.52, 10, "#a49b7144");
      if (
        BosqueVegetacao.draw(
          c,
          "objetos",
          town === 2 ? 3 : town ? 2 : 0,
          x,
          y,
          h * 2.05,
        )
      )
        return;
    }
    oval(c, x + 6, y + 4, w * 0.6, 15, "#273b3130");
    const top = y - h;
    c.fillStyle = town ? "#d5bc8c" : "#b98d58";
    c.fillRect(x - w / 2, top, w, h);
    c.fillStyle = "#8b6740";
    c.fillRect(x + w * 0.24, top, w * 0.26, h);
    line(
      c,
      [
        [x - w / 2, top + h * 0.18],
        [x + w * 0.24, top + h * 0.18],
      ],
      "#f4dc9c77",
      2,
    );
    for (let j = 0; j < 5; j++)
      line(
        c,
        [
          [x - w / 2, top + (j * h) / 5],
          [x + w / 2, top + (j * h) / 5],
        ],
        "#72573855",
        1,
      );
    c.fillStyle = "#4b7053";
    poly(c, [
      [x - w * 0.63, top + 3],
      [x - w * 0.08, top - h * 0.36],
      [x + w * 0.65, top + 2],
      [x + w * 0.22, top + h * 0.14],
    ]);
    c.fill();
    line(
      c,
      [
        [x - w * 0.63, top + 3],
        [x - w * 0.08, top - h * 0.36],
        [x + w * 0.65, top + 2],
      ],
      "#8eaf62",
      3,
    );
    c.fillStyle = "#523e2d";
    c.fillRect(x - 12, y - h * 0.58, 24, h * 0.58);
    c.fillStyle = "#edcd77";
    c.fillRect(x + w * 0.13, y - h * 0.64, w * 0.2, h * 0.28);
    line(
      c,
      [
        [x + w * 0.23, y - h * 0.64],
        [x + w * 0.23, y - h * 0.36],
      ],
      "#795b38",
      2,
    );
    c.fillStyle = "#d9bf76";
    c.beginPath();
    c.arc(x + 5, y - 20, 2, 0, TAU);
    c.fill();
  }
  function fence(c, a, b) {
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 24));
    for (const h of [10, 22])
      line(
        c,
        [
          [a[0], a[1] - h],
          [b[0], b[1] - h],
        ],
        "#785537",
        4,
      );
    for (let i = 0; i <= n; i++) {
      const x = a[0] + ((b[0] - a[0]) * i) / n,
        y = a[1] + ((b[1] - a[1]) * i) / n;
      line(
        c,
        [
          [x, y],
          [x, y - 31],
        ],
        "#5b4730",
        7,
      );
      line(
        c,
        [
          [x - 1, y - 2],
          [x - 1, y - 29],
        ],
        "#bc9356",
        3,
      );
    }
  }
  function bridge(c, p) {
    const x = Math.min(...p.map((p) => p[0])),
      y = Math.min(...p.map((p) => p[1])),
      w = Math.max(...p.map((p) => p[0])) - x,
      h = Math.max(...p.map((p) => p[1])) - y;
    c.fillStyle = "#594e37";
    poly(c, p);
    c.fill();
    for (let a = x + 2; a < x + w; a += 13) {
      c.fillStyle = a % 26 < 13 ? "#bc965e" : "#d0aa6d";
      c.fillRect(a, y + 1, 11, h - 2);
      line(
        c,
        [
          [a + 3, y + 4],
          [a + 6, y + h - 5],
        ],
        "#876b4333",
        1,
      );
    }
    fence(c, [x, y], [x + w, y]);
    fence(c, [x, y + h], [x + w, y + h]);
  }
  function flame(c, x, y, size, time, seed = 0) {
    for (let i = 0; i < 3; i++) {
      const d = i * 2.5,
        h = size * (0.72 + Math.sin(time * 6 + seed + i) * 0.12);
      c.fillStyle = ["#c95024", "#f7a431", "#ffe68b"][i];
      c.beginPath();
      c.moveTo(x - size * 0.25 + d, y);
      c.bezierCurveTo(
        x - size * 0.5,
        y - h * 0.4,
        x + size * 0.15,
        y - h * 0.66,
        x + Math.sin(time * 4 + seed) * size * 0.15,
        y - h + d * 2,
      );
      c.bezierCurveTo(
        x + size * 0.1,
        y - h * 0.42,
        x + size * 0.52 - d,
        y - h * 0.3,
        x + size * 0.25 - d,
        y,
      );
      c.closePath();
      c.fill();
    }
  }
  function water(c, points, health, time, reduced, seed = 0) {
    if (reduced) time = 0;
    c.save();
    poly(c, points);
    c.strokeStyle = "#536b4a";
    c.lineWidth = 12;
    c.stroke();
    c.strokeStyle = "#d9bd7e";
    c.lineWidth = 6;
    c.stroke();
    const grad = c.createLinearGradient(280, 0, 920, 720);
    grad.addColorStop(0, mix("#5c6a50", "#247c8b", health));
    grad.addColorStop(0.5, mix("#84906c", "#4aa9ad", health));
    grad.addColorStop(1, mix("#596c58", "#246e83", health));
    c.fillStyle = grad;
    c.fill();
    c.clip();
    const r = random(seed + 193);
    for (let i = 0; i < 65; i++) {
      const x = r() * 1280,
        y = (r() * 720 + (reduced ? 0 : time * 9)) % 720,
        l = 5 + r() * 17;
      line(
        c,
        [
          [x, y],
          [x + l, y + Math.sin(i + time * 0.8) * 1.5],
        ],
        "#d2f2d35e",
        1,
      );
    }
    c.restore();
  }
  function inside(p, points) {
    let yes = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [x, y] = points[i],
        [xx, yy] = points[j];
      if (y > p.y !== yy > p.y && p.x < ((xx - x) * (p.y - y)) / (yy - y) + x)
        yes = !yes;
    }
    return yes;
  }
  function smoothPoly(c, points) {
    c.beginPath();
    let last = points.at(-1);
    c.moveTo((last[0] + points[0][0]) / 2, (last[1] + points[0][1]) / 2);
    for (let i = 0; i < points.length; i++) {
      const a = points[i],
        b = points[(i + 1) % points.length];
      c.quadraticCurveTo(...a, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    }
    c.closePath();
  }
  function terrain(
    c,
    owner,
    width,
    height,
    sample,
    time,
    dry = [157, 137, 91],
    green = [108, 150, 73],
  ) {
    if (!owner.field) {
      owner.field = document.createElement("canvas");
      owner.field.width = 64;
      owner.field.height = 36;
      owner.fieldAt = -1;
    }
    if (time - owner.fieldAt > 0.12 || time < owner.fieldAt) {
      owner.fieldAt = time;
      const ctx = owner.field.getContext("2d"),
        im = ctx.createImageData(64, 36),
        r = random(194);
      for (let y = 0; y < 36; y++)
        for (let x = 0; x < 64; x++) {
          const k = (y * 64 + x) * 4,
            g = clamp(
              sample(((x + 0.5) * width) / 64, ((y + 0.5) * height) / 36),
            ),
            noise = r() * 9 - 4.5;
          for (let i = 0; i < 3; i++)
            im.data[k + i] = dry[i] + (green[i] - dry[i]) * g + noise;
          im.data[k + 3] = 255;
        }
      ctx.putImageData(im, 0, 0);
    }
    c.imageSmoothingEnabled = true;
    c.drawImage(owner.field, 0, 0, width, height);
  }
  function trail(c, points, width = 34, paved = false) {
    const trace = () => {
      c.beginPath();
      c.moveTo(...points[0]);
      for (let i = 1; i < points.length - 1; i++) {
        const p = points[i],
          n = points[i + 1];
        c.quadraticCurveTo(...p, (p[0] + n[0]) / 2, (p[1] + n[1]) / 2);
      }
      c.lineTo(...points.at(-1));
    };
    c.lineCap = c.lineJoin = "round";
    trace();
    c.strokeStyle = paved ? "#827a60" : "#b19765";
    c.lineWidth = width + 5;
    c.stroke();
    c.strokeStyle = paved ? "#c0b78d" : "#d6be87";
    c.lineWidth = width;
    c.stroke();
  }
  window.BosquePintura = {
    clamp,
    ease,
    random,
    mix,
    poly,
    oval,
    line,
    leaf,
    tree,
    rock,
    house,
    fence,
    bridge,
    flame,
    water,
    inside,
    smoothPoly,
    terrain,
    trail,
  };
})();


;/* jogo/mata-ilustrada/atlas.js */
window.MataAtlas = {
  file: "assets/aderecos.webp",
  frames: [
    { bounds: [14, 32, 233, 208] },
    { bounds: [266, 20, 241, 220] },
    { bounds: [519, 14, 245, 227] },
    { bounds: [776, 30, 240, 203] },
    { bounds: [1037, 11, 220, 231] },
    { bounds: [1287, 61, 238, 162] },
    { bounds: [14, 262, 233, 241] },
    { bounds: [273, 275, 234, 217] },
    { bounds: [551, 264, 181, 244] },
    { bounds: [769, 267, 249, 239] },
    { bounds: [1028, 300, 247, 191] },
    { bounds: [1288, 263, 235, 237] },
    { bounds: [59, 523, 142, 238] },
    { bounds: [258, 545, 252, 198] },
    { bounds: [537, 537, 216, 214] },
    { bounds: [768, 543, 248, 205] },
    { bounds: [1068, 517, 171, 246] },
    { bounds: [1291, 520, 228, 235] },
    { bounds: [13, 774, 239, 219] },
    { bounds: [266, 819, 238, 157] },
    { bounds: [518, 796, 241, 188] },
    { bounds: [780, 773, 229, 224] },
    { bounds: [1024, 809, 251, 170] },
    { bounds: [1284, 801, 241, 183] },
  ],
};


;/* jogo/mata-ilustrada/artes.js */
"use strict";
(() => {
  const base = new URL("./", ({src:new URL("../mata-ilustrada/artes.js?v=mata-1",document.baseURI).href}).src),
    images = new Map(),
    patterns = new Map();
  let promise;
  function canvas(w, h = w) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }
  function load() {
    return (promise ||= Promise.all(
      [
        ["decor", MataAtlas.file],
        ["terrain", "assets/texturas.webp"],
      ].map(async ([name, file]) => {
        const im = new Image();
        im.src = new URL(file, base);
        await im.decode();
        images.set(name, im);
      }),
    ).catch((error) =>
      console.warn(
        "Arte de cenário indisponível; usando desenho de reserva.",
        error.message,
      ),
    ));
  }
  function pattern(c, index, size = 176) {
    const key = index + ":" + size;
    if (!images.has("terrain")) return "#8b7951";
    if (!patterns.has(key)) {
      // Quatro reflexões eliminam emendas duras, sem uma textura de mapa inteiro.
      const tile = canvas(size * 2),
        g = tile.getContext("2d"),
        im = images.get("terrain");
      for (let y = 0; y < 2; y++)
        for (let x = 0; x < 2; x++) {
          g.save();
          g.translate(x ? size * 2 : 0, y ? size * 2 : 0);
          g.scale(x ? -1 : 1, y ? -1 : 1);
          g.drawImage(
            im,
            (index % 4) * 384,
            Math.floor(index / 4) * 384,
            384,
            384,
            0,
            0,
            size,
            size,
          );
          g.restore();
        }
      patterns.set(key, tile);
    }
    return c.createPattern(patterns.get(key), "repeat");
  }
  function draw(c, index, x, y, height, flip = false) {
    const im = images.get("decor");
    if (!im) return false;
    const b = MataAtlas.frames[index].bounds,
      k = height / b[3];
    c.save();
    c.translate(x, y);
    if (flip) c.scale(-1, 1);
    c.drawImage(im, ...b, (-b[2] * k) / 2, -height, b[2] * k, height);
    c.restore();
    return true;
  }
  const oldLoad = BosqueVegetacao.load;
  BosqueVegetacao.load = () => Promise.all([oldLoad(), load()]);
  window.MataArte = {
    load,
    draw,
    pattern,
    canvas,
    get ready() {
      return images.size === 2;
    },
  };
})();


;/* jogo/mata-ilustrada/pintura.js */
"use strict";
(() => {
  const P = BosquePintura,
    old = { ...P };
  function terrain(c, owner, w, h, sampler, time, dry, green) {
    if (!MataArte.ready)
      return old.terrain(c, owner, w, h, sampler, time, dry, green);
    let cache = owner.mataTerrain;
    if (!cache) {
      const phase = owner.phase || 0,
        base = MataArte.canvas(w, h),
        g = base.getContext("2d");
      g.fillStyle = MataArte.pattern(
        g,
        phase === 1 ? 1 : phase === 5 ? 4 : phase === 3 ? 7 : 0,
        phase === 5 ? 216 : 190,
      );
      g.fillRect(0, 0, w, h);
      // Variações de matéria e de luz continuam presas ao solo.
      g.globalAlpha = phase === 1 ? 0.32 : 0.17;
      g.fillStyle = MataArte.pattern(g, 0, 290);
      g.fillRect(0, 0, w, h);
      const meadow = MataArte.canvas(w, h),
        m = meadow.getContext("2d");
      m.fillStyle = MataArte.pattern(m, 2, 210);
      m.fillRect(0, 0, w, h);
      const mask = MataArte.canvas(64, 36);
      cache = owner.mataTerrain = {
        base,
        meadow,
        mask,
        blend: MataArte.canvas(w, h),
        at: -99,
      };
    }
    c.drawImage(cache.base, 0, 0, w, h);
    if (time - cache.at > 0.18 || time < cache.at) {
      cache.at = time;
      const m = cache.mask.getContext("2d"),
        pixels = m.createImageData(64, 36);
      for (let y = 0; y < 36; y++)
        for (let x = 0; x < 64; x++) {
          const i = (y * 64 + x) * 4;
          pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = 255;
          pixels.data[i + 3] = Math.round(
            P.clamp(sampler(((x + 0.5) * w) / 64, ((y + 0.5) * h) / 36)) * 255,
          );
        }
      m.putImageData(pixels, 0, 0);
      const b = cache.blend.getContext("2d");
      b.clearRect(0, 0, w, h);
      b.globalCompositeOperation = "source-over";
      b.drawImage(cache.meadow, 0, 0);
      b.globalCompositeOperation = "destination-in";
      b.drawImage(cache.mask, 0, 0, w, h);
      b.globalCompositeOperation = "source-over";
    }
    c.drawImage(cache.blend, 0, 0, w, h);
    const light = c.createLinearGradient(0, 0, w, h);
    light.addColorStop(0, "#102b281a");
    light.addColorStop(0.52, "#fff3c00a");
    light.addColorStop(1, "#17221c24");
    c.fillStyle = light;
    c.fillRect(0, 0, w, h);
  }
  function trace(c, paths, smooth = true) {
    c.beginPath();
    for (const points of paths) {
      c.moveTo(...points[0]);
      if (!smooth || points.length < 3) {
        for (const p of points.slice(1)) c.lineTo(...p);
        continue;
      }
      for (let i = 1; i < points.length - 1; i++)
        c.quadraticCurveTo(
          ...points[i],
          (points[i][0] + points[i + 1][0]) / 2,
          (points[i][1] + points[i + 1][1]) / 2,
        );
      c.lineTo(...points.at(-1));
    }
  }
  function trails(c, paths, width = 32, town = false) {
    c.save();
    c.lineJoin = c.lineCap = "round";
    trace(c, paths);
    c.strokeStyle = "#29281f28";
    c.lineWidth = width + 7;
    c.stroke();
    c.strokeStyle = town ? "#aa9d7e" : "#9e865a";
    c.lineWidth = width + 2;
    c.stroke();
    c.strokeStyle = MataArte.pattern(c, town ? 4 : 3, town ? 190 : 175);
    c.lineWidth = width;
    c.stroke();
    c.globalAlpha = town ? 0.07 : 0.17;
    c.strokeStyle = town ? "#b8b19a" : "#c4a879";
    c.lineWidth = width - 6;
    c.stroke();
    c.restore();
  }
  function trail(c, points, width = 32, town = false) {
    if (!MataArte.ready) return old.trail(c, points, width, town);
    trails(c, [points], width, town);
  }
  function water(c, points, health, time, reduced, id) {
    if (!MataArte.ready) return old.water(c, points, health, time, reduced, id);
    c.save();
    P.poly(c, points);
    c.clip();
    const depth = c.createLinearGradient(0, 0, 900, 700);
    depth.addColorStop(0, P.mix("#627b65", "#246e7d", health));
    depth.addColorStop(0.45, P.mix("#7e8e64", "#389eae", health));
    depth.addColorStop(1, P.mix("#576f5d", "#125b70", health));
    c.fillStyle = depth;
    c.fillRect(0, 0, 1280, 720);
    c.save();
    const drift = reduced ? 0 : (time * 3) % 320;
    c.translate(Math.sin(time * 0.09) * 8, drift - 320);
    c.globalCompositeOperation = "luminosity";
    c.globalAlpha = 0.36 + health * 0.16;
    c.fillStyle = MataArte.pattern(c, 5, 160);
    c.fillRect(-24, -320, 1350, 1600);
    c.restore();
    c.save();
    c.globalCompositeOperation = "multiply";
    c.globalAlpha = 0.33 * (1 - health);
    c.fillStyle = "#a4b685";
    c.fillRect(0, 0, 1280, 720);
    c.restore();
    // Profundidade no mesmo contorno usado pela colisão, sem uma borda de plástico.
    P.poly(c, points);
    c.strokeStyle = "#203e3c60";
    c.lineWidth = 14;
    c.shadowBlur = 10;
    c.shadowColor = "#173939";
    c.stroke();
    c.shadowBlur = 0;
    c.lineWidth = 2;
    c.strokeStyle = "#c3d4ad77";
    c.stroke();
    c.globalAlpha = 0.15 + 0.2 * health;
    for (let i = 0; i < 16; i++) {
      const x = 170 + ((i * 181) % 990),
        y = 80 + ((i * 97) % 600),
        t = reduced ? i : time * 0.38 + i;
      c.beginPath();
      c.ellipse(
        x + Math.sin(t) * 9,
        y,
        11 + Math.sin(t) * 3,
        2,
        0,
        0.12,
        Math.PI * 1.7,
      );
      c.strokeStyle = "#d4ffff";
      c.lineWidth = 0.9;
      c.stroke();
    }
    c.restore();
  }
  function fence(c, a, b) {
    const distance = Math.hypot(b[0] - a[0], b[1] - a[1]),
      n = Math.max(1, Math.ceil(distance / 36));
    c.save();
    for (const h of [12, 24]) {
      P.line(
        c,
        [
          [a[0], a[1] - h],
          [b[0], b[1] - h],
        ],
        "#4d392b",
        5,
      );
      P.line(
        c,
        [
          [a[0], a[1] - h - 1],
          [b[0], b[1] - h - 1],
        ],
        "#b19056",
        2,
      );
    }
    for (let i = 0; i <= n; i++) {
      const x = a[0] + ((b[0] - a[0]) * i) / n,
        y = a[1] + ((b[1] - a[1]) * i) / n;
      P.oval(c, x + 2, y + 1, 5, 2, "#2932233d");
      c.fillStyle = MataArte.pattern(c, 6, 78);
      c.fillRect(x - 3.5, y - 34, 7, 36);
      P.line(
        c,
        [
          [x - 3, y - 33],
          [x - 3, y],
        ],
        "#e4c387",
        1,
      );
      P.oval(c, x, y - 34, 4, 1.5, "#dcc189");
      P.oval(c, x, y - 14, 1, 1, "#483d2e");
    }
    c.restore();
  }
  function tree(c, x, y, height, growth, time = 0, seed = 0, reduced = false) {
    if (!BosqueVegetacao.ready)
      return old.tree(c, x, y, height, growth, time, seed, reduced);
    const g = P.ease(growth),
      s = height / 100;
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    P.oval(c, 4, 3, 27 + g * 16, 7 + g * 4, "#19251c37");
    BosqueVegetacao.draw(
      c,
      "vegetacao",
      seed === 810 ? 3 : Math.floor(seed) % 4 === 0 ? 0 : 1,
      0,
      1,
      84 + g * 6,
    );
    if (g > 0.015) {
      c.save();
      c.translate(0, -33);
      c.rotate(reduced ? 0 : Math.sin(time * 0.83 + seed) * 0.014 * g);
      BosqueVegetacao.draw(
        c,
        "vegetacao",
        4 + (Math.abs(Math.floor(seed)) % 3),
        0,
        0,
        72 * P.ease(g),
      );
      c.restore();
      if (g > 0.4) BosqueVegetacao.draw(c, "vegetacao", 8, 0, 3, 14 * g);
    }
    c.restore();
  }
  function bridge(c, points) {
    if (!MataArte.ready) return old.bridge(c, points);
    const xs = points.map((p) => p[0]),
      ys = points.map((p) => p[1]),
      x = Math.min(...xs),
      y = Math.min(...ys),
      w = Math.max(...xs) - x,
      h = Math.max(...ys) - y;
    c.save();
    P.poly(c, points);
    c.fillStyle = "#342c22";
    c.fill();
    c.shadowColor = "#181c2077";
    c.shadowBlur = 8;
    c.shadowOffsetY = 5;
    c.fillStyle = MataArte.pattern(c, 6, 120);
    c.fill();
    c.shadowBlur = 0;
    c.shadowOffsetY = 0;
    c.clip();
    for (let px = x + 7; px < x + w; px += 13) {
      P.line(
        c,
        [
          [px, y],
          [px, y + h],
        ],
        "#39291f88",
        1.5,
      );
      P.oval(c, px + 3, y + 4, 1, 1, "#2b2c29");
      P.oval(c, px + 3, y + h - 4, 1, 1, "#2b2c29");
    }
    c.restore();
    // Só a borda norte é desenhada aqui; a sul entra na ordenação por profundidade.
    rail(c, x, y, w);
  }
  function rail(c, x, y, w) {
    for (let px = x + 3; px < x + w; px += Math.max(34, (w - 6) / 3)) {
      P.line(
        c,
        [
          [px, y + 2],
          [px, y - 21],
        ],
        "#503e27",
        5,
      );
      P.line(
        c,
        [
          [px - 1, y],
          [px - 1, y - 20],
        ],
        "#b78d4d",
        2,
      );
      P.oval(c, px, y - 22, 3.2, 1.5, "#d3b477");
    }
    c.save();
    c.strokeStyle = "#c4a76d";
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(x + 3, y - 15);
    c.quadraticCurveTo(x + w / 2, y - 6, x + w - 3, y - 15);
    c.stroke();
    c.restore();
  }
  Object.assign(P, { terrain, trail, water, tree, bridge, fence });
  window.MataPintura = { rail, trails };
})();


;/* jogo/trilhas-vivas/arvores-atlas.js */
window.TrilhasArvores = [
  [4, 9, 248, 243],
  [263, 4, 241, 248],
  [516, 9, 248, 243],
  [779, 4, 234, 248],
  [4, 320, 248, 188],
  [260, 337, 248, 171],
  [516, 325, 248, 183],
  [772, 341, 248, 167],
];
window.TrilhasCosta = [
  [4, 58, 248, 194],
  [260, 77, 248, 175],
  [516, 57, 248, 195],
  [772, 4, 247, 248],
  [4, 317, 248, 191],
  [260, 358, 248, 150],
  [516, 312, 248, 196],
  [772, 362, 248, 146],
];


;/* jogo/trilhas-vivas/natureza.js */
"use strict";
(() => {
  const P = BosquePintura,
    water = P.water,
    tree = P.tree,
    base = new URL("./", ({src:new URL("../trilhas-vivas/natureza.js?v=trilhas-1",document.baseURI).href}).src),
    im = new Image(),
    props = new Image(),
    waters = new WeakMap();
  let ready = false,
    promise;
  function load() {
    return (promise ||= (async () => {
      im.src = new URL("assets/arvores.webp", base);
      await im.decode();
      if (location.pathname.includes("/viva/")) {
        props.src = new URL("assets/costa.webp", base);
        await props.decode();
      }
      ready = true;
    })().catch(() => {}));
  }
  const prior = BosqueVegetacao.load;
  BosqueVegetacao.load = () => Promise.all([prior(), load()]);
  function sprite(c, i, x, y, h) {
    const b = TrilhasArvores[i],
      s = h / b[3];
    c.drawImage(im, ...b, x - (b[2] * s) / 2, y - h, b[2] * s, h);
  }
  P.tree = (c, x, y, h, g, t = 0, seed = 0, reduced = false) => {
    if (!ready || seed === 810) return tree(c, x, y, h, g, t, seed, reduced);
    const k = Math.abs(Math.round(seed)) % 4,
      life = P.ease(g);
    P.oval(c, x + 3, y + 2, h * 0.25, h * 0.065, "#192d2330");
    sprite(c, k, x, y, h * 0.9);
    if (life > 0.015) {
      c.save();
      c.translate(x, y - h * 0.32);
      c.rotate(reduced ? 0 : Math.sin(t * 0.75 + seed) * 0.014);
      sprite(c, k + 4, 0, 0, h * 0.73 * life);
      c.restore();
    }
  };
  P.water = (c, polygon, health, time, reduced, id) => {
    let bank = waters.get(polygon);
    if (!bank) {
      const xs = polygon.map((p) => p[0]),
        ys = polygon.map((p) => p[1]);
      const x = Math.floor(Math.min(...xs)) - 8,
        y = Math.floor(Math.min(...ys)) - 8,
        w = Math.ceil(Math.max(...xs) - x) + 8,
        h = Math.ceil(Math.max(...ys) - y) + 8;
      const frames = [0, 1].map((health) => {
        const a = MataArte.canvas(w, h),
          g = a.getContext("2d");
        g.translate(-x, -y);
        water(g, polygon, health, 0, true, id);
        return a;
      });
      bank = { x, y, frames, current: health, last: time };
      waters.set(polygon, bank);
    }
    const dt = Math.max(0, Math.min(0.1, time - bank.last));
    bank.last = time;
    bank.current +=
      (health - bank.current) * (reduced ? 1 : 1 - Math.exp(-dt * 2));
    c.drawImage(bank.frames[0], bank.x, bank.y);
    c.save();
    c.globalAlpha *= bank.current;
    c.drawImage(bank.frames[1], bank.x, bank.y);
    c.restore();
    c.save();
    P.poly(c, polygon);
    c.clip();
    const flow = reduced ? 0 : time;
    for (let i = 0; i < 20; i++) {
      const x = bank.x + ((i * 79.7 + flow * 9) % (bank.frames[0].width + 20)),
        y =
          bank.y +
          ((i * 47.1) % bank.frames[0].height) +
          Math.sin(flow + i) * 2;
      c.beginPath();
      c.ellipse(
        x,
        y,
        9 + Math.sin(flow * 0.7 + i) * 3,
        1.6,
        0,
        0.15,
        Math.PI * 1.75,
      );
      c.strokeStyle = i % 3 ? "#c8f3e731" : "#f2fff655";
      c.lineWidth = 0.8;
      c.stroke();
    }
    c.restore();
  };
  window.TrilhasNatureza = {
    load,
    prop(c, i, x, y, h) {
      if (!props.naturalWidth) return false;
      const b = TrilhasCosta[i],
        s = h / b[3];
      c.drawImage(props, ...b, x - (b[2] * s) / 2, y - h, b[2] * s, h);
      return true;
    },
    get ready() {
      return ready;
    },
  };
})();


;/* jogo/mata-ilustrada/layout.js */
"use strict";
// Posições dos objetos e seus pés. A ilustração e a física leem este mesmo cadastro.
(() => {
  const entry = (id, frame, x, y, height, rx, ry) => ({
    id,
    kind: "decor",
    frame,
    x,
    y,
    height,
    rx,
    ry,
  });
  const landmarks = {
    1: [
      entry("suprimentos-carlos", 7, 330, 287, 68, 24, 12),
      entry("bomba-apoio", 6, 449, 337, 75, 18, 10),
      entry("placa-trilha", 16, 304, 162, 80, 8, 7),
      entry("madeira-abrigo", 22, 358, 252, 38, 24, 9),
      entry("tronco-queimado-leste", 5, 1014, 441, 54, 29, 10),
      entry("tronco-queimado-norte", 5, 843, 153, 47, 26, 9),
    ],
    2: [
      entry("barril-do-rio", 17, 245, 325, 70, 22, 12),
      entry("rede-e-suprimentos", 7, 262, 285, 60, 22, 11),
      entry("placa-margem", 16, 375, 235, 80, 8, 7),
      entry("madeira-do-pier", 22, 278, 291, 38, 23, 8),
      entry("banco-margem", 10, 1019, 548, 68, 32, 11),
    ],
    3: [
      entry("alimento-fauna", 7, 475, 175, 61, 22, 11),
      entry("comedouro-central", 8, 627, 386, 83, 9, 8),
      entry("abrigo-ninhos", 8, 800, 131, 76, 9, 8),
      entry("banco-marina", 10, 429, 505, 67, 30, 10),
      entry("placa-fauna", 16, 618, 160, 79, 8, 7),
    ],
    4: [
      entry("bancada-viveiro", 9, 467, 139, 89, 33, 15),
      entry("vasos-viveiro", 21, 265, 261, 44, 21, 10),
      entry("barril-rega", 17, 430, 350, 66, 21, 12),
      entry("banco-viveiro", 10, 754, 582, 65, 30, 10),
      entry("madeira-canteiros", 22, 994, 602, 36, 22, 8),
    ],
    5: [
      entry("poste-praca-1", 12, 569, 329, 106, 6, 6),
      entry("poste-praca-2", 12, 755, 353, 106, 6, 6),
      entry("banco-da-praca", 10, 686, 351, 69, 32, 11),
      entry("carrinho-cidade", 15, 449, 452, 67, 29, 13),
      entry("barril-cidade", 17, 981, 547, 65, 21, 12),
      entry("poste-escola", 12, 799, 270, 101, 6, 6),
      entry("poste-reciclagem", 12, 187, 451, 98, 6, 6),
      entry("placa-reciclagem", 16, 366, 475, 76, 8, 7),
    ],
  };
  const paths = {
    2: [
      [
        [315, 245],
        [281, 306],
        [265, 401],
        [326, 523],
        [427, 604],
      ],
      [
        [800, 180],
        [931, 241],
        [1021, 339],
        [950, 440],
        [967, 541],
        [891, 624],
      ],
      [
        [315, 245],
        [393, 180],
        [802, 180],
      ],
    ],
    3: [
      [
        [375, 225],
        [471, 282],
        [621, 220],
        [761, 199],
        [927, 190],
        [1071, 299],
        [1021, 441],
        [900, 532],
        [720, 452],
        [550, 429],
        [398, 480],
        [270, 424],
        [375, 225],
      ],
    ],
    4: [
      [
        [375, 237],
        [462, 310],
        [578, 209],
        [760, 160],
        [900, 158],
        [1030, 230],
        [1045, 332],
        [970, 430],
        [845, 510],
        [680, 560],
        [533, 548],
        [460, 480],
        [505, 409],
        [462, 310],
      ],
      [
        [375, 237],
        [376, 310],
        [370, 333],
      ],
    ],
    5: [
      [
        [370, 282],
        [431, 261],
        [692, 217],
        [850, 294],
        [989, 301],
        [1040, 386],
        [901, 401],
        [785, 433],
        [622, 554],
        [361, 572],
        [282, 493],
        [370, 282],
      ],
      [
        [622, 554],
        [630, 476],
        [686, 351],
        [755, 353],
        [850, 294],
      ],
    ],
  };
  const island = [
    [74, 103],
    [168, 66],
    [300, 69],
    [389, 95],
    [501, 57],
    [613, 74],
    [742, 61],
    [872, 96],
    [943, 151],
    [932, 223],
    [967, 307],
    [933, 381],
    [897, 433],
    [817, 487],
    [714, 508],
    [624, 488],
    [539, 515],
    [451, 500],
    [359, 519],
    [260, 499],
    [172, 468],
    [100, 425],
    [53, 358],
    [68, 280],
    [47, 204],
  ];
  function landmarksFor(id) {
    return (landmarks[id] || []).map((p) => ({ ...p }));
  }
  function awayFromGoals(p, data) {
    const goals = [
      ...(data.tasks || []),
      ...(data.fires || []),
      ...(data.animals || []).flatMap((a) => [a, a.home]),
      ...(data.refill ? [data.refill] : []),
      ...(data.station ? [data.station] : []),
    ];
    return !goals.some(
      (g) => g && Math.hypot(p.x - g.x, p.y - g.y) < Math.max(p.rx, p.ry) + 27,
    );
  }
  window.MataLayout = { landmarksFor, awayFromGoals, paths, island };
})();


;/* jogo/trilhas-vivas/disposicao.js */
"use strict";
(() => {
  // Caminhos ramificados entre pontos de cuidado, em vez de um circuito de corrida.
  Object.assign(MataLayout.paths, {
    3: [
      [
        [375, 225],
        [458, 276],
        [580, 290],
        [680, 335],
        [755, 394],
        [867, 451],
        [1030, 472],
      ],
      [
        [458, 276],
        [397, 352],
        [330, 382],
        [262, 424],
      ],
      [
        [580, 290],
        [679, 211],
        [760, 173],
        [865, 182],
        [945, 153],
        [934, 111],
      ],
      [
        [755, 394],
        [778, 471],
        [900, 530],
        [1030, 472],
        [1065, 510],
      ],
      [
        [680, 335],
        [609, 388],
        [550, 429],
        [400, 480],
      ],
    ],
    4: [
      [
        [375, 237],
        [466, 288],
        [577, 288],
        [699, 336],
        [828, 368],
        [963, 361],
        [1045, 332],
      ],
      [
        [466, 288],
        [489, 245],
        [578, 209],
      ],
      [
        [577, 288],
        [658, 220],
        [774, 202],
        [900, 158],
      ],
      [
        [699, 336],
        [719, 425],
        [845, 510],
      ],
      [
        [577, 288],
        [542, 348],
        [505, 409],
        [492, 483],
        [533, 548],
      ],
      [
        [375, 237],
        [376, 310],
        [370, 333],
      ],
    ],
    5: [
      [
        [370, 282],
        [430, 260],
        [610, 250],
        [742, 270],
        [852, 295],
        [1000, 335],
        [1040, 386],
      ],
      [
        [610, 250],
        [619, 340],
        [630, 433],
        [622, 554],
      ],
      [
        [282, 493],
        [370, 470],
        [485, 455],
        [630, 433],
        [785, 433],
        [1040, 386],
      ],
      [
        [360, 573],
        [493, 559],
        [622, 554],
        [779, 553],
        [981, 547],
      ],
      [
        [630, 433],
        [686, 351],
        [755, 353],
      ],
    ],
  });
})();

(() => {
  const rounded = (poly) =>
    poly.flatMap((p, i) => {
      const a = poly[(i + poly.length - 1) % poly.length],
        b = poly[(i + 1) % poly.length],
        start = [(a[0] + p[0]) / 2, (a[1] + p[1]) / 2],
        end = [(p[0] + b[0]) / 2, (p[1] + b[1]) / 2];
      return Array.from({ length: 5 }, (_, j) => {
        const t = j / 5,
          v = 1 - t;
        return [
          v * v * start[0] + 2 * v * t * p[0] + t * t * end[0],
          v * v * start[1] + 2 * v * t * p[1] + t * t * end[1],
        ];
      });
    });
  window.TrilhasCurva = rounded;
  if (window.GuardiaoFasesJogaveis) {
    GuardiaoFasesJogaveis[2].water = rounded(GuardiaoFasesJogaveis[2].water);
  }
  MataLayout.island = [
    [78, 98],
    [135, 76],
    [196, 72],
    [242, 88],
    [298, 70],
    [352, 99],
    [410, 82],
    [485, 58],
    [544, 81],
    [591, 65],
    [642, 85],
    [704, 62],
    [754, 92],
    [828, 73],
    [885, 109],
    [930, 152],
    [917, 205],
    [947, 247],
    [923, 280],
    [953, 320],
    [927, 361],
    [943, 392],
    [884, 438],
    [858, 475],
    [796, 496],
    [742, 481],
    [704, 511],
    [655, 500],
    [617, 478],
    [555, 508],
    [510, 490],
    [455, 518],
    [403, 497],
    [356, 519],
    [292, 493],
    [238, 504],
    [185, 466],
    [131, 474],
    [100, 433],
    [58, 403],
    [70, 356],
    [46, 319],
    [67, 280],
    [49, 236],
    [70, 194],
    [52, 150],
  ];
})();


;/* jogo/reencontro/paisagem.js */
"use strict";
(() => {
  const base = new URL("assets/", ({src:new URL("../reencontro/paisagem.js?v=reencontro-1",document.baseURI).href}).src);
  const canvas = (w, h) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  };
  const ease = (n) => {
    n = Math.max(0, Math.min(1, n));
    return n * n * (3 - 2 * n);
  };
  class Landscape {
    constructor(name, w, h) {
      this.w = w;
      this.h = h;
      this.name = name;
      this.mask = canvas(w, h);
      this.layer = canvas(w, h);
      // Só o cenário inicial bloqueia a entrada. A restauração é preparada depois.
      this.ready = this.image("antes");
      this.built = -999;
      this.signature = "";
      this.builds = 0;
      this.ready
        .then(() => {
          const warm = () => this.after();
          if (window.requestIdleCallback)
            requestIdleCallback(warm, { timeout: 4000 });
          else setTimeout(warm, 2200);
        })
        .catch(() => {});
    }
    async image(state) {
      const im = new Image();
      im.decoding = "async";
      im.fetchPriority = state === "antes" ? "high" : "low";
      im.src = new URL(
        (this.name === "mapa"
          ? "../../" +
            (state === "antes" ? "mapa-ferido" : "arte-viva") +
            "/assets/"
          : "") +
          this.name +
          "-" +
          state +
          ".webp",
        base,
      );
      await im.decode();
      this[state] = im;
      this.signature = null;
    }
    after() {
      if (this.depois) return Promise.resolve(true);
      if (this.afterPromise) return this.afterPromise;
      if (performance.now() < (this.retryAfter || 0))
        return Promise.resolve(false);
      this.afterPromise = this.image("depois")
        .then(() => true)
        .catch(() => {
          this.afterPromise = null;
          this.retryAfter = performance.now() + 10000;
          return false;
        });
      return this.afterPromise;
    }
    draw(c, points, time, reduced, full = 0) {
      if (!this.antes) {
        c.fillStyle = "#514b37";
        c.fillRect(0, 0, this.w, this.h);
        return;
      }
      if (points.length || full > 0) this.after();
      if (full >= 1 && this.depois) {
        c.drawImage(this.depois, 0, 0, this.w, this.h);
        return;
      }
      const signature =
        points.map((p) => p.id + ":" + p.at).join("|") +
        ":" +
        (full >= 1) +
        ":" +
        !!this.depois;
      const animating =
        points.some((p) => time - p.at < 7) || (full > 0 && full < 1);
      if (
        signature !== this.signature ||
        (this.depois && animating && time - this.built > 0.1)
      ) {
        const m = this.mask.getContext("2d"),
          g = this.layer.getContext("2d");
        m.clearRect(0, 0, this.w, this.h);
        for (const p of this.depois ? points : []) {
          const progress = reduced ? 1 : ease((time - p.at) / 5);
          const radius = Math.max(1, (p.radius || 185) * progress);
          const glow = m.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
          glow.addColorStop(0, "#fff");
          glow.addColorStop(0.65, "#fff");
          glow.addColorStop(1, "#fff0");
          m.fillStyle = glow;
          m.fillRect(p.x - radius, p.y - radius, radius * 2, radius * 2);
        }
        if (full > 0) {
          m.globalAlpha = full;
          m.fillStyle = "#fff";
          m.fillRect(0, 0, this.w, this.h);
          m.globalAlpha = 1;
        }
        g.clearRect(0, 0, this.w, this.h);
        // Sem objetivos concluídos, a imagem saudável não entra na composição.
        // Além de evitar trabalho, o reinício conserva os mesmos pixels da entrada.
        if (this.depois && (points.length || full > 0)) {
          g.drawImage(this.depois, 0, 0, this.w, this.h);
          g.globalCompositeOperation = "destination-in";
          g.drawImage(this.mask, 0, 0);
          g.globalCompositeOperation = "destination-over";
        }
        g.drawImage(this.antes, 0, 0, this.w, this.h);
        g.globalCompositeOperation = "source-over";
        this.signature = signature;
        this.built = time;
        this.builds++;
      }
      c.drawImage(this.layer, 0, 0);
    }
  }
  const names = {
    1: "floresta",
    2: "rio",
    3: "fauna",
    4: "plantio",
    5: "cidade",
  };
  const Previous = window.BosqueCenario;
  if (Previous) {
    window.BosqueCenario = class {
      constructor(phase, data) {
        this.phase = phase;
        this.data = data;
        this.objectives = [];
        this.complete = false;
        this.fullAt = null;
        this.landscape = new Landscape(names[phase], 1280, 720);
        this.ready = this.landscape.ready.catch(() => {
          this.backup = new Previous(phase, data);
        });
      }
      ground(c, tasks, time, reduced, complete) {
        if (this.backup)
          return this.backup.ground(c, tasks, time, reduced, complete);
        this.objectives = tasks.filter(
          (t) =>
            t.life === 0 || ["done", "safe", "returning"].includes(t.status),
        );
        // Conserva o estado público da cidade usado pela interface e pela campanha.
        if (this.phase === 5)
          document.body.dataset.industryState =
            this.objectives.length === tasks.length ? "recuperada" : "poluida";
        const loaded = complete && this.fullAt === null;
        if (loaded) this.fullAt = time;
        this.complete = complete;
        const points = this.objectives.map((t) => ({
          id: t.id,
          x: t.x,
          y: t.y,
          at: t.restoredAt ?? -10,
          radius: 180,
        }));
        this.landscape.draw(
          c,
          points,
          time,
          reduced,
          complete ? (reduced ? 1 : ease((time - this.fullAt) / 4)) : 0,
        );
        // A superfície continua viva; não há retângulos de cenário sobre os caminhos.
        if (!reduced) this.ambient(c, time);
      }
      ambient(c, time) {
        // Reflexos seguem o rio pintado; não ocupam as margens nem a ponte.
        const poly = this.phase === 1 ? this.data.river : this.data.water;
        if (poly) {
          c.save();
          BosquePintura.poly(c, poly);
          c.clip();
          c.strokeStyle = "#d6f4e033";
          c.lineWidth = 0.9;
          for (let i = 0; i < 17; i++) {
            const x = 460 + ((i * 71) % 340),
              y = 80 + ((i * 91 + time * 9) % 600);
            c.beginPath();
            c.ellipse(
              x + Math.sin(time + i) * 3,
              y,
              6 + Math.sin(time * 1.6 + i) * 2,
              1.5,
              0,
              0,
              Math.PI * 2,
            );
            c.stroke();
          }
          c.restore();
        }
        if (this.phase === 5 && !this.complete) {
          c.save();
          c.fillStyle = "#6d656238";
          for (let i = 0; i < 8; i++) {
            const age = (time * 0.22 + i * 0.43) % 3;
            c.beginPath();
            c.ellipse(
              873 + age * 13,
              105 - age * 30,
              5 + age * 5,
              6 + age * 5,
              0,
              0,
              Math.PI * 2,
            );
            c.fill();
          }
          c.restore();
        }
      }
      actors(time, reduced, player) {
        return this.backup?.actors(time, reduced, player) || [];
      }
      plant(c, ...args) {
        const [t, time, reduced] = args,
          P = BosquePintura;
        const seeded = ["seeded", "growing", "done"].includes(t.status);
        P.oval(c, t.x, t.y, 24, 9, seeded ? "#6a5935" : "#64543b");
        if (!seeded) {
          for (let j = 0; j < 3; j++)
            P.line(
              c,
              [
                [t.x - 12 + j * 10, t.y - 3],
                [t.x - 14 + j * 10, t.y + 3],
              ],
              "#b59662",
              1.5,
            );
          return;
        }
        const age =
          t.status === "seeded"
            ? 0.08
            : t.status === "done"
              ? reduced
                ? 1
                : ease((time - (t.restoredAt ?? -10)) / 4)
              : 0.4;
        P.tree(
          c,
          t.x,
          t.y,
          17 + 66 * age,
          0.5 + 0.5 * age,
          time,
          Math.round(t.x),
          reduced,
        );
      }
      state() {
        return {
          phase: this.phase,
          renderer: "ilustrado-interativo",
          art: "reencontro",
          restored: this.objectives.length,
          complete: this.complete,
          objects: 0,
          bitmapReplacements: 0,
          terrainBuilds: this.landscape.builds,
        };
      }
    };
  }
  window.GuardiaoPaisagem = { Landscape, ease };
})();


;/* jogo/ilha-renascendo/mapa.js */
"use strict";
(() => {
  const base = new URL("./", ({src:new URL("../ilha-renascendo/mapa.js?v=1",document.baseURI).href}).src),
    W = 1280,
    H = 721,
    duration = 6,
    centres = [
      [1024, 166],
      [1069, 397],
      [973, 564],
      [358, 538],
      [307, 166],
    ],
    images = new Map(),
    pending = new Map();
  let canvas,
    layer,
    done = [],
    stage = 0,
    from = 0,
    restoring = 0,
    started = 0,
    ticket = 0,
    loading = false,
    now = 0,
    final = 0,
    finalImage;
  const ease = (n) => {
    n = Math.max(0, Math.min(1, n));
    return n * n * (3 - 2 * n);
  };
  function image(id) {
    if (images.has(id)) return Promise.resolve(images.get(id));
    if (!pending.has(id))
      pending.set(
        id,
        (async () => {
          const im = new Image();
          im.decoding = "async";
          im.src = new URL(
            id
              ? `assets/etapa-${id}.webp`
              : "../mapa-ferido/assets/mapa-antes.webp",
            base,
          ).href;
          await im.decode();
          images.set(id, im);
          pending.delete(id);
          for (const old of images.keys())
            if (![0, stage, from, stage + 1].includes(old)) images.delete(old);
          return im;
        })().catch((e) => {
          pending.delete(id);
          throw e;
        }),
      );
    return pending.get(id);
  }
  function setup() {
    if (canvas) return;
    canvas = Object.assign(document.createElement("canvas"), {
      id: "living-island",
      width: W,
      height: H,
    });
    canvas.setAttribute("aria-hidden", "true");
    document.querySelector(".map-stage").prepend(canvas);
    layer = Object.assign(document.createElement("canvas"), {
      width: W,
      height: H,
    });
    document.getElementById("island-ash")?.remove();
    image(0).catch(() => {
      canvas.dataset.loadError = "true";
    });
  }
  function level(ids) {
    let n = 0;
    while (ids.includes(n + 1) && n < 5) n++;
    return n;
  }
  function prepare() {
    return Promise.all([image(stage), ...(restoring ? [image(from)] : [])]);
  }
  function update(ids, id = 0, finished = false) {
    setup();
    const next = [
        ...new Set(ids.filter((n) => Number.isInteger(n) && n >= 1 && n <= 5)),
      ].sort(),
      target = level(next);
    if (
      next.join() === done.join() &&
      target === stage &&
      (!id || id === restoring)
    )
      return;
    const revision = ++ticket;
    done = next;
    stage = target;
    restoring = id === target && id > 0 ? id : 0;
    from = restoring ? target - 1 : target;
    started = 0;
    loading = true;
    if (target < 5) final = 0;
    if (finished && target === 5) final = 1;
    prepare()
      .then(() => {
        if (revision !== ticket) return;
        loading = false;
        started = performance.now() / 1000;
        // A próxima etapa é preparada só no mapa e em segundo plano.
        if (stage < 5 && !navigator.connection?.saveData) {
          const warm = () => image(stage + 1).catch(() => {});
          if (window.requestIdleCallback)
            requestIdleCallback(warm, { timeout: 4000 });
        }
      })
      .catch(() => {
        if (revision === ticket) {
          loading = false;
          canvas.dataset.loadError = "true";
        }
      });
    if (!target) image(0).catch(() => {});
  }
  function amount(reduced) {
    return !restoring || reduced
      ? 1
      : !started
        ? 0
        : ease((performance.now() / 1000 - started) / duration);
  }
  function health(id, x, y, reduced) {
    if (!done.includes(id)) return 0;
    return id === restoring ? amount(reduced) : 1;
  }
  function fit(c, im) {
    // Contain conserva a imagem inteira; nunca estica largura e altura separadamente.
    const k = Math.min(W / im.naturalWidth, H / im.naturalHeight),
      w = im.naturalWidth * k,
      h = im.naturalHeight * k;
    c.drawImage(im, (W - w) / 2, (H - h) / 2, w, h);
  }
  function reveal(c, before, after, p, id) {
    if (p <= 0) {
      fit(c, before);
      return;
    }
    if (p >= 1) {
      fit(c, after);
      return;
    }
    fit(c, before);
    const g = layer.getContext("2d"),
      [x, y] = centres[id - 1],
      far = Math.max(
        ...[
          [0, 0],
          [W, 0],
          [0, H],
          [W, H],
        ].map(([xx, yy]) => Math.hypot(xx - x, yy - y)),
      ),
      radius = (far + 120) * p;
    g.clearRect(0, 0, W, H);
    fit(g, after);
    g.globalCompositeOperation = "destination-in";
    const mask = g.createRadialGradient(
      x,
      y,
      Math.max(0, radius - 120),
      x,
      y,
      Math.max(1, radius),
    );
    mask.addColorStop(0, "#fff");
    mask.addColorStop(1, "#fff0");
    g.fillStyle = mask;
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = "source-over";
    c.save();
    c.globalAlpha = ease(p / 0.1);
    c.drawImage(layer, 0, 0);
    c.restore();
  }
  function ending(c) {
    if (!final || !images.has(5)) return;
    if (!finalImage) {
      finalImage = new Image();
      finalImage.src = new URL(
        "../arte-viva/assets/mapa-depois.webp",
        base,
      ).href;
      return;
    }
    if (!finalImage.complete || !finalImage.naturalWidth) return;
    // O encerramento existente só recupera o coração da ilha: os cinco
    // territórios mantêm as imagens enviadas e os personagens originais.
    const g = layer.getContext("2d");
    g.clearRect(0, 0, W, H);
    fit(g, finalImage);
    g.globalCompositeOperation = "destination-in";
    const mask = g.createRadialGradient(650, 320, 50, 650, 320, 245);
    mask.addColorStop(0, "#fff");
    mask.addColorStop(0.7, "#fff");
    mask.addColorStop(1, "#fff0");
    g.fillStyle = mask;
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = "source-over";
    c.save();
    c.globalAlpha = final;
    c.drawImage(layer, 0, 0);
    c.restore();
  }
  function paint(time, reduced) {
    setup();
    now = time;
    const c = canvas.getContext("2d");
    c.clearRect(0, 0, W, H);
    c.fillStyle = "#235866";
    c.fillRect(0, 0, W, H);
    const target = images.get(stage),
      previous = images.get(from) || images.get(0),
      p = amount(reduced);
    if (target) {
      if (previous && restoring) reveal(c, previous, target, p, restoring);
      else fit(c, target);
    } else if (previous) fit(c, previous);
    ending(c);
    canvas.dataset.restoration = String(restoring && p < 1 ? restoring : 0);
    canvas.dataset.restorationProgress = String(p);
    if (document.body.dataset.islandStage !== String(stage))
      document.body.dataset.islandStage = String(stage);
  }
  window.BosqueMapa = {
    duration,
    update,
    paint,
    health,
    ready: () => {
      setup();
      return prepare();
    },
    finalGrowth: (n) => {
      final = ease(n);
    },
    state: () => ({
      renderer: "ilustrado-interativo",
      composition: "ilha-antiga",
      completed: [...done],
      restoring,
      finalGrowth: final,
      bitmapReplacements: 0,
      time: now,
      restoredReady: images.has(stage),
      stage,
      loading,
      progress: amount(false),
      source: "referencias-enviadas",
      width: W,
      height: H,
    }),
  };
})();


;/* jogo/bosque-vivo/fundo.js */
"use strict";
(() => {
  function init() {
    const host = document.querySelector(".backdrop");
    if (!host) return;
    const im = new Image();
    im.className = "home-landscape";
    im.alt = "";
    im.fetchPriority = "high";
    im.decoding = "async";
    const src = new URL(
      "../arte-viva/assets/inicio.webp",
      ({src:new URL("../bosque-vivo/fundo.js?v=arte-1",document.baseURI).href})?.src ||
        new URL("../bosque-vivo/fundo.js", location.href),
    ).href;
    let attempts = 0;
    im.onload = () => {
      host.dataset.loaded = "true";
    };
    im.onerror = () => {
      if (attempts++ < 2)
        setTimeout(() => {
          im.src = src + "?retomar=" + attempts;
        }, attempts * 1200);
    };
    host.append(im);
    im.src = src;
    window.addEventListener("pageshow", () => {
      if (!im.complete || !im.naturalWidth) im.src = src;
    });
  }
  document.addEventListener("DOMContentLoaded", init);
})();


;/* jogo/arte-viva/contextos.js */
"use strict";
(() => {
  const A = VivaArt,
    R = RaizesPersonagens;
  const still = () => document.body.classList.contains("reduce-motion");
  A.friends = (c, w, h, time) => {
    A.scenery(c, 5, w, h);
    const hh = Math.min(h * 0.72, w * 0.83),
      y = h * 0.94;
    // Kai e Flora se olham. As asas ficam longe do rosto de Kai.
    R.draw(c, "acoes", 0, w * 0.34, y, hh);
    A.owl(
      c,
      w * 0.77,
      h * 0.48 + (still() ? 0 : Math.sin(time * 2) * 2),
      hh * 0.31,
      time,
      "voo",
      true,
    );
  };
  function settings(c, w, h, time) {
    A.scenery(c, 5, w, h);
    // Uma pose pousada de perfil sobre um galho; o diário usa Flora em voo.
    c.strokeStyle = "#714a2d";
    c.lineWidth = 9;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(w * 0.14, h * 0.87);
    c.quadraticCurveTo(w * 0.55, h * 0.8, w * 0.85, h * 0.91);
    c.stroke();
    c.strokeStyle = "#b48b4b";
    c.lineWidth = 2;
    c.stroke();
    const f = ArteVivaPersonagens.frame(4, "ombro", time, 0, still());
    R.draw(
      c,
      "flora",
      f.index,
      w * 0.57,
      h * 0.85,
      Math.min(h * 0.62, w * 0.48),
      { flip: f.flip },
    );
  }
  window.ArteVivaContextos = { settings };
})();


;/* jogo/encontros-vivos/cenas.js */
"use strict";
(() => {
  const R = RaizesPersonagens,
    A = window.VivaArt;
  const still = () =>
    document.body.classList.contains("reduce-motion") ||
    matchMedia("(prefers-reduced-motion:reduce)").matches;
  function breath(t, quiet) {
    return quiet ? 0 : Math.sin(t * 1.8) * 0.8;
  }
  if (A)
    A.meeting = (c, w, h, phase, time, reserve = 42) => {
      A.scenery(c, phase - 1, w, h);
      const quiet = still(),
        t = quiet ? 0 : time,
        hh = Math.min((h - reserve) * 0.88, w * 0.63),
        y = h - reserve - 7,
        kaiHeight = hh * 0.9,
        x = w * 0.33,
        b = breath(t, quiet);
      c.save();
      c.fillStyle = "#332c2522";
      for (const xx of [x, w * 0.76]) {
        c.beginPath();
        c.ellipse(xx, y, hh * 0.18, hh * 0.04, 0, 0, Math.PI * 2);
        c.fill();
      }
      c.save();
      c.translate(x, y);
      c.filter = "saturate(1.1) contrast(1.02)";
      c.rotate(quiet ? 0 : Math.sin(t * 0.85) * 0.005);
      R.draw(c, "acoes", 0, 0, 0, kaiHeight + b);
      // Pés apoiados na capa/ombro de trás; asas recolhidas, rosto de Kai livre.
      const shoulder = { x: -kaiHeight * 0.12, y: -(kaiHeight + b) * 0.565 };
      const pose = ArteVivaPersonagens.frame(0, "ombro", t, 0, quiet);
      const glance =
        !quiet && t % 8 < 6 ? 12 + (t % 4.8 > 4.62 ? 1 : 0) : pose.index;
      R.draw(c, "flora", glance, shoulder.x, shoulder.y, hh * 0.32, {
        angle: quiet ? 0 : Math.sin(t * 1.2) * 0.025,
      });
      c.restore();
      const listening = quiet || Math.sin(t * 0.7 + phase) < 0.25;
      R.draw(
        c,
        "npcs",
        phase - 1 + (listening ? 5 : 0),
        w * 0.76,
        y,
        hh + breath(t + 0.7, quiet),
      );
      c.restore();
      document.body.dataset.meetingFlora = "ombro";
    };
  // Os NPCs respiram e fazem pequenos gestos sem alterar posição ou colisões.
  const prior = R.draw;
  R.draw = (c, name, index, x, y, height, options = {}) => {
    if (name !== "npcs" || c.canvas.id !== "cenario")
      return prior(c, name, index, x, y, height, options);
    const quiet = still(),
      t = performance.now() / 1000,
      role = index % 5,
      gesture = !quiet && (t + role * 1.3) % 6 > 3;
    c.save();
    c.translate(x, y);
    c.rotate(quiet ? 0 : Math.sin(t * 0.85 + role) * 0.012);
    const result = prior(
      c,
      name,
      quiet ? index : role + (gesture ? 5 : 0),
      0,
      0,
      height + breath(t + role, quiet),
      options,
    );
    c.restore();
    return result;
  };
  const Life = window.GuardiaoVidaNatural;
  if (Life)
    window.GuardiaoVidaNatural = class extends Life {
      flora(c, f, p, t, reduced) {
        if (f.mode !== "ombro" && f.mode !== "fala")
          return super.flora(c, f, p, t, reduced);
        c.save();
        c.translate(0, reduced ? 0 : -breath(t, false) * 0.65);
        const result = super.flora(c, f, p, t, reduced);
        c.restore();
        return result;
      }
    };
})();


;/* jogo/arte-viva/ambiente.js */
"use strict";
(() => {
  let canvas,
    c,
    raf = 0,
    last = 0,
    time = 0,
    w = 0,
    h = 0,
    ratio = 1,
    visible = false;
  const reduced = () => document.body.classList.contains("reduce-motion");
  function resize() {
    w = innerWidth;
    h = innerHeight;
    ratio = Math.min(
      devicePixelRatio || 1,
      Raizes.prefs().graphicsQuality === "leve" ? 1 : 1.5,
    );
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
  }
  function frame(now) {
    raf = 0;
    if (
      document.hidden ||
      document.body.dataset.view !== "inicio" ||
      reduced()
    ) {
      visible = false;
      canvas.hidden = true;
      return;
    }
    visible = true;
    canvas.hidden = false;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0);
    last = now;
    time += dt;
    c.setTransform(ratio, 0, 0, ratio, 0, 0);
    c.clearRect(0, 0, w, h);
    // Coordenadas da ilustração, conservando object-fit:cover em qualquer tela.
    const k = Math.max(w / 1672, h / 941),
      ox = (w - 1672 * k) / 2,
      oy = (h - 941 * k) / 2;
    c.translate(ox, oy);
    c.scale(k, k);
    c.save();
    c.beginPath();
    c.moveTo(400, 595);
    c.lineTo(663, 574);
    c.lineTo(1060, 830);
    c.lineTo(920, 941);
    c.lineTo(320, 941);
    c.closePath();
    c.clip();
    for (let i = 0; i < 25; i++) {
      const x = 380 + ((i * 137) % 600),
        y = 620 + ((i * 61) % 335);
      const age = (time * 0.24 + i * 0.137) % 1;
      c.strokeStyle = `rgba(195,255,232,${Math.sin(age * Math.PI) * 0.38})`;
      c.lineWidth = 1.4;
      c.beginPath();
      c.ellipse(
        x + Math.sin(time * 0.5 + i) * 8,
        y,
        8 + age * 25,
        1 + age * 3,
        0,
        0,
        Math.PI,
      );
      c.stroke();
    }
    c.restore();
    // A água da cachoeira se move no cenário, independentemente das folhas.
    for (let i = 0; i < 7; i++) {
      const age = (time * 0.5 + i / 7) % 1,
        x = 590 + i * 9;
      c.strokeStyle = `rgba(228,255,244,${Math.sin(age * Math.PI) * 0.35})`;
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(x, 467 + age * 62);
      c.quadraticCurveTo(x - 4, 493 + age * 62, x - 12, 515 + age * 48);
      c.stroke();
    }
    for (let i = 0; i < 12; i++) {
      const x = 1030 + Math.sin(time * 0.26 + i * 2) * 62,
        y = 430 + Math.cos(time * 0.4 + i * 3) * 62;
      c.globalAlpha = 0.24 + Math.sin(time + i) * 0.19;
      c.fillStyle = "#fff6aa";
      c.beginPath();
      c.arc(x, y, 1.4 + (i % 2) * 0.5, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (!raf && !document.hidden) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    const host = document.querySelector(".backdrop");
    if (!host) return;
    canvas = document.createElement("canvas");
    canvas.id = "home-ambience";
    canvas.setAttribute("aria-hidden", "true");
    host.append(canvas);
    c = canvas.getContext("2d");
    resize();
    new MutationObserver(start).observe(document.body, {
      attributes: true,
      attributeFilter: ["data-view", "class"],
    });
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", start);
    window.addEventListener("pagehide", () => {
      cancelAnimationFrame(raf);
      raf = 0;
    });
    window.addEventListener("pageshow", start);
    window.ArteVivaAmbiente = {
      state: () => ({
        active: visible,
        time,
        renderer: "agua-e-luz-em-camadas",
      }),
    };
    start();
  });
})();


;/* jogo/mapa-ferido/mapa.js */
"use strict";
(() => {
  const base = new URL("./", ({src:new URL("../mapa-ferido/mapa.js?v=ferido-1",document.baseURI).href}).src);
  let image, loading;
  const names = {
    1: ["Floresta", "em Chamas"],
    2: ["Rio Poluído"],
    3: ["Resgate", "da Fauna"],
    4: ["Reflorestamento"],
    5: ["Cidade", "Sustentável"],
  };
  function regionState(id, progress) {
    if (progress.completed.includes(id)) return "recuperada";
    return id === 1 || progress.completed.includes(id - 1)
      ? "atual"
      : "distante";
  }
  function prepare() {
    return (loading ||= (async () => {
      const im = new Image();
      im.decoding = "async";
      im.src = new URL("assets/kai-retrato.webp", base);
      await im.decode();
      image = im;
      return true;
    })().catch(() => false));
  }
  // Um retrato próprio ocupa o marcador; os sprites de Kai na fase são preservados.
  function portrait(c, x, y, radius = 19) {
    if (!image) return false;
    y = Math.max(radius + 4, y);
    c.save();
    c.fillStyle = "#efc576";
    c.strokeStyle = "#87522b";
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(x - radius * 0.35, y + radius * 0.85);
    c.lineTo(x + radius * 0.35, y + radius * 0.85);
    c.lineTo(x, y + radius * 1.52);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = "#95632e";
    c.beginPath();
    c.arc(x, y, radius + 3, 0, Math.PI * 2);
    c.fill();
    c.save();
    c.beginPath();
    c.arc(x, y, radius, 0, Math.PI * 2);
    c.clip();
    c.drawImage(image, x - radius, y - radius, radius * 2, radius * 2);
    c.restore();
    c.strokeStyle = "#ffe2a1";
    c.lineWidth = 2.8;
    c.beginPath();
    c.arc(x, y, radius + 0.3, 0, Math.PI * 2);
    c.stroke();
    c.restore();
    return true;
  }
  window.MapaFerido = {
    regionState,
    label: (id) =>
      (names[id] || [])
        .map((line) => `<span class="map-name-line">${line}</span>`)
        .join(" "),
    prepare,
    portrait,
  };
})();


;/* jogo/trilhas-vivas/menu.js */
"use strict";
(() => {
  const $ = (id) => document.getElementById(id),
    R = Raizes,
    A = VivaArt;
  const phases = [
    {
      id: 1,
      name: "Floresta em Chamas",
      npc: "Carlos",
      job: "Guarda florestal",
      region: [77, 24],
      icon: "fire",
      map: "floresta",
      color: "vermelho",
      items: "Mangueira e kit de cuidado",
      situation:
        "O fogo se espalhou. Carlos precisa de ajuda para proteger a floresta e os animais.",
      goals: [
        "Apague os oito focos de incêndio.",
        "Cuide dos três animais e libere as trilhas.",
        "Volte a Carlos para celebrar.",
      ],
      row: 0,
    },
    {
      id: 2,
      name: "Rio Poluído",
      npc: "Antônio",
      job: "Cuidador do rio",
      region: [82, 49],
      icon: "water",
      map: "rio",
      color: "azul",
      items: "Traje de proteção, rede e bolsa",
      situation:
        "Resíduos poluem a água. Antônio vai orientar Kai a cuidar do rio e de seus moradores.",
      goals: [
        "Vista a proteção e recolha os resíduos.",
        "Ajude os peixes e a tartaruga.",
        "Devolva a vida ao rio.",
      ],
      row: 1,
    },
    {
      id: 3,
      name: "Resgate da Fauna",
      npc: "Marina",
      job: "Cuidadora dos animais",
      region: [76, 78],
      icon: "paw",
      map: "fauna",
      color: "amarelo",
      items: "Kit de resgate e chave dos abrigos",
      situation:
        "Alguns amigos precisam de cuidado. Marina ensina a respeitar cada espécie e seu habitat.",
      goals: [
        "Encontre a chave dos abrigos.",
        "Liberte e cuide dos nove animais.",
        "Acompanhe os amigos aos lugares seguros.",
      ],
      row: 2,
    },
    {
      id: 4,
      name: "Reflorestamento",
      npc: "Rafael",
      job: "Guardião das sementes",
      region: [27, 75],
      icon: "leaf",
      map: "plantio",
      color: "verde",
      items: "Mudas nativas e regador",
      situation:
        "A terra perdeu suas árvores. Rafael trouxe mudas nativas para fazer a vida voltar.",
      goals: [
        "Plante as seis mudas.",
        "Regue com o mesmo botão de cuidado.",
        "Veja a natureza crescer.",
      ],
      row: 3,
    },
    {
      id: 5,
      name: "Cidade Sustentável",
      npc: "Luciana",
      job: "Organizadora da comunidade",
      region: [25, 25],
      icon: "sun",
      map: "cidade",
      color: "violeta",
      items: "Bolsa de coleta e materiais da comunidade",
      situation:
        "A comunidade quer uma cidade mais saudável. Luciana convida Kai a cuidar dos espaços de todos.",
      goals: [
        "Separe os resíduos nas lixeiras.",
        "Ajuste os painéis e cuide dos jardins.",
        "Reúna o último cristal do colar.",
      ],
      row: 4,
    },
  ];
  const biomes = [
    [
      "Amazônia",
      "Árvores, rios e chuvas formam uma grande rede de vida. Floresta protegida também significa água cuidada.",
      "Por lá: tucanos, peixes e muitas outras espécies.",
    ],
    [
      "Mata Atlântica",
      "Essa floresta guarda muitas espécies que só vivem no Brasil. Preservar os pequenos trechos e conectá-los protege seus moradores.",
      "Por lá: mico-leão-dourado e preguiças.",
    ],
    [
      "Cerrado",
      "Árvores de raízes profundas ajudam a guardar água no solo. Suas nascentes alimentam grandes rios do Brasil.",
      "Por lá: lobo-guará, tamanduá e muitas aves.",
    ],
    [
      "Caatinga",
      "A vida se adapta ao tempo seco. Plantas e animais sabem aproveitar a água e precisam de seu ambiente preservado.",
      "Por lá: tatu-bola e ararinha-azul.",
    ],
    [
      "Pantanal",
      "As águas mudam a paisagem ao longo do ano. Proteger os rios ajuda os campos alagados e seus animais.",
      "Por lá: tuiuiú, onça-pintada e capivaras.",
    ],
    [
      "Pampa",
      "Campos e pequenas plantas também são natureza. Muitas espécies dependem desse espaço aberto para viver.",
      "Por lá: veado-campeiro e aves dos campos.",
    ],
  ];
  const advice = [
    "Encontrou lixo no caminho? Avise um adulto. Use proteção para recolher resíduos seguros e separe no lugar certo.",
    "Leve uma garrafinha reutilizável. Menos descartáveis significam menos resíduos perto dos rios.",
    "Cuide de uma planta com um adulto. Observe o solo e regue na medida certa.",
    "Animal silvestre não é bichinho de gaiola. Respeite sua distância e proteja o lugar onde ele vive.",
    "Fogo na natureza é perigoso. Afaste-se e peça ajuda a um adulto; não tente apagar sozinho.",
    "Feche a torneira enquanto escova os dentes. Cada pequena economia ajuda a cuidar da água.",
  ];
  let view = "inicio",
    selected = 1,
    activeAbout = "historia",
    adviceIndex = 0,
    last = 0,
    raf = 0,
    time = 0,
    ready = false,
    restoreTimer = 0,
    captionTimer = 0;
  const reduced = () =>
    R.prefs().reduceMotion ||
    matchMedia("(prefers-reduced-motion:reduce)").matches;
  const progress = () => GuardiaoProgresso.read();
  const file = (path) =>
    new URL(window.GuardiaoArquivosLeves?.[path] || path, R.root).href;
  const unlocked = (id) => id === 1 || progress().completed.includes(id - 1);
  function setIcon(id, name) {
    $(id).innerHTML = R.icon(name) + $(id).innerHTML;
  }
  function mapDraw(restoring = 0) {
    const p = progress();
    MapaFerido.prepare();
    document.body.dataset.mapRestored = String(p.completed.length === 5);
    $("map-hotspots").innerHTML = phases
      .map(
        (d) =>
          `<button type="button" class="map-hotspot ${p.completed.includes(d.id) ? "is-complete" : ""}" data-phase="${d.id}" data-region-state="${MapaFerido.regionState(d.id, p)}" style="--x:${d.region[0]}%;--y:${d.region[1]}%" aria-label="${d.name}. ${unlocked(d.id) ? (p.completed.includes(d.id) ? "Natureza recuperada" : "Disponível") : "Complete a região anterior"}" aria-disabled="${!unlocked(d.id)}"><span class="number">${d.id}</span>${R.icon(d.icon)}<span class="map-region-name">${MapaFerido.label(d.id)}</span><small>${p.completed.includes(d.id) ? "Natureza recuperada" : unlocked(d.id) ? "Vamos cuidar?" : "Complete a região anterior"}</small></button>`,
      )
      .join("");
    BosqueMapa.update(
      p.completed,
      restoring,
      R.won() &&
        localStorage.getItem("guardiao.viva.final.v1") === "visto" &&
        !window.VivaFinal?.active,
    );
    $("island-restoration").innerHTML = "";
    const current = phases.find((d) => d.id === p.current) || phases[0];
    $("map-current").innerHTML = R.icon(current.icon) + current.name;
    $("map-fragments").textContent = p.completed.length + " / 5 cristais";
    $("tree-state").textContent =
      p.completed.length === 0
        ? "Árvore Guardiã enfraquecida"
        : p.completed.length === 5
          ? "A ilha pode florescer de novo"
          : `A árvore recupera forças · ${p.completed.length}/5`;
    $("tree-restoration").innerHTML = "";
    $("map-reset").hidden = !p.completed.length;
    $("replay-ending").hidden = !R.won();
  }
  function maybeRestore() {
    const p = progress(),
      query = new URLSearchParams(location.search);
    const id = Number(query.get("restaurar") || p.pendingRestoration);
    if (id && p.completed.includes(id)) {
      mapDraw(id);
      clearTimeout(restoreTimer);
      Promise.resolve(BosqueMapa.ready())
        .catch(() => {})
        .then(() => {
          if (view !== "mapa" || !progress().completed.includes(id)) return;
          clearTimeout(restoreTimer);
          restoreTimer = setTimeout(
            () => {
              if (view !== "mapa" || !progress().completed.includes(id)) return;
              const s = progress();
              delete s.pendingRestoration;
              try {
                localStorage.setItem(
                  "guardiao.mapa.progresso.v1",
                  JSON.stringify(s),
                );
              } catch {}
              history.replaceState(null, "", location.pathname + "#mapa");
              if (R.won()) window.VivaFinal?.start();
              else mapDraw();
            },
            reduced() ? 300 : (BosqueMapa.duration || 2.1) * 1000 + 200,
          );
        });
    } else if (
      R.won() &&
      localStorage.getItem("guardiao.viva.final.v1") !== "visto"
    ) {
      clearTimeout(restoreTimer);
      restoreTimer = setTimeout(() => {
        if (view === "mapa" && R.won()) window.VivaFinal?.start();
      }, 900);
    }
  }
  function brief(id) {
    selected = id;
    const d = phases[id - 1];
    $("phase-number").textContent = "FASE " + id;
    $("phase-title").textContent = d.name;
    $("phase-npc").textContent = d.npc;
    $("phase-job").textContent = d.job;
    $("phase-situation").textContent = d.situation;
    $("phase-goals").innerHTML = d.goals
      .map((g) => "<li>" + R.icon("leaf") + "<span>" + g + "</span></li>")
      .join("");
    $("phase-items").textContent = d.items;
    $("phase-reward").innerHTML = GuardiaoRelicario.fragment(id - 1, true);
    $("phase-reward-copy").textContent = "Cristal " + d.color + " do colar";
    $("start-phase").href = new URL(
      id === 1
        ? "jogo/floresta-viva/index.html"
        : "jogo/jornada/index.html?fase=" + id,
      R.root,
    ).href;
    $("start-phase").textContent = unlocked(id)
      ? "Iniciar fase"
      : "Conclua a região anterior";
    $("start-phase").setAttribute("aria-disabled", String(!unlocked(id)));
    if (window.CincoMissoes) CincoMissoes.brief(id);
    else A.load(["npcs", "encontros"]);
    document.querySelector(".phase-scene").style.backgroundImage = "none";
    $("phase-dialog").showModal();
    document.body.dataset.phasePreview = String(id);
  }
  function show() {
    const next = location.hash.slice(1).split("?")[0] || "inicio";
    view = ["inicio", "mapa", "sobre", "configuracoes", "final"].includes(next)
      ? next
      : "inicio";
    if (view === "final" && !R.won()) {
      location.replace("#mapa");
      return;
    }
    const playEnding = view === "final";
    if (playEnding) {
      view = "mapa";
      history.replaceState(
        null,
        "",
        location.pathname + location.search + "#mapa",
      );
    }
    document.querySelectorAll("#app > [data-view]").forEach((el) => {
      el.hidden = el.dataset.view !== view;
      el.classList.toggle("entering", !el.hidden && !reduced());
    });
    document.body.dataset.view = view;
    $("back-home").hidden = view === "inicio";
    $("back-home").innerHTML = R.icon("back") + "Início";
    if ($("phase-dialog").open) $("phase-dialog").close();
    clearTimeout(restoreTimer);
    if (view === "mapa") {
      A.load(["acoes", "flora", "kai"]);
      mapDraw();
      maybeRestore();
      const line = $("flora-map-line");
      line.textContent = "Cada cuidado fortalece a Árvore Guardiã.";
      line.hidden = false;
      clearTimeout(captionTimer);
      captionTimer = setTimeout(() => (line.hidden = true), 4500);
    }
    if (view === "configuracoes") A.load(["flora"]);
    if (view === "sobre" && activeAbout === "comandos")
      A.load(["kai", "acoes", "flora", "encontros"]);
    if (view === "sobre" && activeAbout === "equipe") A.load(["professor"]);
    if (playEnding) window.VivaFinal?.start();
    else if (view !== "mapa") window.VivaFinal?.stop();
    document.title =
      (view === "inicio"
        ? "Guardião da Natureza"
        : {
            mapa: "Mapa das fases",
            sobre: "Sobre o jogo",
            configuracoes: "Configurações",
            final: "A Árvore Guardiã",
          }[view]) + " · Jornada de Kai";
  }
  function biome(i) {
    const d = biomes[i];
    $("biome-title").textContent = d[0];
    $("biome-copy").textContent = d[1];
    $("biome-friend").textContent = d[2];
    document
      .querySelectorAll("[data-biome]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(Number(b.dataset.biome) === i)),
      );
  }
  const demo = {
    x: 0.53,
    y: 0.81,
    direction: 6,
    movingUntil: 0,
    actionUntil: 0,
  };
  function demoMove(dx, dy) {
    demo.x = Math.max(0.2, Math.min(0.8, demo.x + dx * 0.06));
    demo.y = Math.max(0.65, Math.min(0.9, demo.y + dy * 0.03));
    demo.direction = (Math.round(-Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8;
    demo.movingUntil = time + 0.8;
    A.load(["kai"]);
  }
  function render(now) {
    raf = requestAnimationFrame(render);
    if (
      now - last < 15 ||
      document.hidden ||
      window.GuardiaoOrientacao?.blocked
    )
      return;
    last = now;
    time = now / 1000;
    if (!ready) return;
    if (view === "mapa") {
      if (
        window.VivaFinal?.active &&
        document.body.dataset.finaleScene === "video"
      )
        return;
      BosqueMapa.paint(time, reduced());
      A.canvas($("map-flora"), (c, w, h) => {
        A.owl(
          c,
          w * 0.48,
          h * 0.91,
          h * 0.7,
          time,
          time % 9 > 7.8 ? "fala" : "ombro",
          true,
        );
      });
      A.canvas($("map-kai"), (c, w, h) => {
        if (window.VivaFinal?.active) {
          VivaFinal.paint(c, w, h, time);
          return;
        }
        const completed = progress().completed;
        if (!reduced()) {
          c.save();
          c.lineWidth = 0.8;
          c.strokeStyle = "#b0e4e376";
          for (let i = 0; i < 9; i++) {
            const x = w * (0.05 + ((i * 137) % 89) / 100),
              y = h * (0.87 + (i % 3) * 0.025),
              r = 4 + ((time * 5 + i * 3) % 18);
            c.globalAlpha = 1 - r / 24;
            c.beginPath();
            c.ellipse(x, y, r, r * 0.24, 0, 0, Math.PI * 2);
            c.stroke();
          }
          if (!completed.includes(1))
            for (let i = 0; i < 13; i++) {
              const k = (time * 0.18 + i * 0.27) % 1;
              c.globalAlpha = (1 - k) * 0.8;
              c.fillStyle = i % 2 ? "#f2b45f" : "#eb7846";
              c.beginPath();
              c.arc(
                w * (0.72 + (i % 5) * 0.033) + Math.sin(time + i) * 3,
                h * (0.24 - k * 0.14),
                1.5,
                0,
                Math.PI * 2,
              );
              c.fill();
            }
          c.restore();
        }
        const d = phases[(progress().current || 1) - 1],
          x = (w * d.region[0]) / 100,
          y = (h * d.region[1]) / 100 - 57;
        if (MapaFerido.portrait(c, x, y, w < 900 ? 17 : 19)) return;
        c.fillStyle = "#305a39";
        c.strokeStyle = "#edce7a";
        c.lineWidth = 3;
        c.beginPath();
        c.arc(x, y, 19, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.save();
        c.beginPath();
        c.arc(x, y, 17, 0, Math.PI * 2);
        c.clip();
        BosqueKai.draw(c, "explorador", 25, x, y + 78, 102);
        c.restore();
        c.fillStyle = "#e4c77d";
        c.beginPath();
        c.moveTo(x - 5, y + 21);
        c.lineTo(x + 5, y + 21);
        c.lineTo(x, y + 29);
        c.fill();
      });
    }
    if (view === "sobre") {
      if (activeAbout === "equipe")
        A.canvas($("professor-portrait"), (c, w, h) => {
          const frame = document.body.classList.contains("reduce-motion")
            ? 8
            : time % 5 > 4.65
              ? 10
              : 8;
          A.draw(c, "professor", frame, w * 0.5, h * 0.99, h * 0.95);
        });
      if (activeAbout === "comandos")
        A.canvas($("how-kai"), (c, w, h) => {
          A.scenery(c, 5, w, h);
          const hh = Math.min(h * 0.64, 168),
            x = w * demo.x,
            y = h * demo.y;
          c.fillStyle = "#214b3333";
          c.beginPath();
          c.ellipse(x, y, hh * 0.25, hh * 0.07, 0, 0, Math.PI * 2);
          c.fill();
          if (time < demo.actionUntil) A.draw(c, "acoes", 7, x, y, hh);
          else if (time < demo.movingUntil)
            A.draw(
              c,
              "kai",
              demo.direction * 2 + (reduced() ? 0 : Math.floor(time * 7) % 2),
              x,
              y,
              hh,
            );
          else A.draw(c, "acoes", 1, x, y, hh);
          A.owl(c, w * 0.84, h * 0.48, hh * 0.24, time, "voo", true);
        });
    }
    if (view === "configuracoes") {
      A.canvas($("settings-flora"), (c, w, h) =>
        A.owl(c, w * 0.5, h * 0.9, h * 0.69, time, "ombro", false),
      );
    }
    if ($("phase-dialog").open && $("phase-conversation"))
      A.canvas($("phase-conversation"), (c, w, h) =>
        A.meeting(c, w, h, selected, time),
      );
  }
  function init() {
    setIcon("play-game", "leaf");
    setIcon("about-game", "book");
    $("settings-game").innerHTML = R.icon("gear");
    $("close-phase").innerHTML = R.icon("close");
    R.bindSettings($("settings-form"));
    $("back-home").onclick = () =>
      VivaTransicao.run(() => (location.hash = "inicio"));
    $("phase-back").onclick = () => $("phase-dialog").close();
    $("close-phase").onclick = () => $("phase-dialog").close();
    $("start-phase").onclick = (e) => {
      if (!unlocked(selected)) {
        e.preventDefault();
        R.notice("Complete a região anterior para continuar.");
      }
    };
    $("map-hotspots").onclick = (e) => {
      const b = e.target.closest("[data-phase]");
      if (b) brief(Number(b.dataset.phase));
    };
    $("map-reset").onclick = R.askReset;
    $("reset-journey").onclick = R.askReset;
    $("ending-restart").onclick = R.askReset;
    $("replay-ending").onclick = () => window.VivaFinal?.start();
    $("defaults-settings").onclick = () => {
      R.save({
        music: true,
        musicVolume: 40,
        effects: true,
        effectsVolume: 60,
        reduceMotion: false,
        largeText: false,
        contextHints: true,
        leftHanded: false,
        controlMode: "auto",
        controlSize: 0,
        fallingLeaves: true,
        screenTransitions: true,
        graphicsQuality: "equilibrada",
        highContrast: false,
        showKeyHelp: true,
      });
      $("settings-form").replaceWith($("settings-form").cloneNode(false));
      R.bindSettings($("settings-form"));
    };
    document.querySelector(".about-tabs").onclick = (e) => {
      const b = e.target.closest("[data-about-tab]");
      if (!b) return;
      activeAbout = b.dataset.aboutTab;
      document
        .querySelectorAll("[data-about-tab]")
        .forEach((t) => t.setAttribute("aria-selected", String(t === b)));
      document
        .querySelectorAll("[data-about-panel]")
        .forEach((p) => (p.hidden = p.dataset.aboutPanel !== activeAbout));
      $("about-content").scrollTop = 0;
      if (activeAbout === "comandos")
        A.load(["kai", "acoes", "flora", "encontros"]);
      if (activeAbout === "equipe") A.load(["professor"]);
      if (!reduced())
        document.getElementById(activeAbout).animate(
          [
            { opacity: 0, transform: "translateY(7px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 240 },
        );
    };
    document.querySelector(".about-tabs").addEventListener("keydown", (e) => {
      if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
      const tabs = [...document.querySelectorAll("[data-about-tab]")],
        i = tabs.indexOf(e.target);
      if (i < 0) return;
      e.preventDefault();
      const next = tabs[(i + (e.key === "ArrowRight" ? 1 : 4)) % tabs.length];
      next.click();
      next.focus();
    });
    $("five-care").innerHTML = phases
      .map((d) => `<article>${R.icon(d.icon)}<h3>${d.name}</h3></article>`)
      .join("");
    $("about-necklace").innerHTML = GuardiaoRelicario.necklace(
      [1, 2, 3, 4, 5],
      "about",
    );
    $("biome-tabs").innerHTML = biomes
      .map(
        (d, i) =>
          `<button type="button" data-biome="${i}" aria-pressed="${i === 0}">${d[0]}</button>`,
      )
      .join("");
    $("biome-tabs").onclick = (e) => {
      const b = e.target.closest("[data-biome]");
      if (b) biome(Number(b.dataset.biome));
    };
    biome(0);
    $("nature-advice").textContent = advice[0];
    $("next-advice").onclick = () =>
      ($("nature-advice").textContent = advice[++adviceIndex % advice.length]);
    $("how-kai").addEventListener("keydown", (e) => {
      const moves = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        w: [0, -1],
        a: [-1, 0],
        s: [0, 1],
        d: [1, 0],
      };
      if (moves[e.key]) {
        e.preventDefault();
        demoMove(...moves[e.key]);
      }
      if (e.key === "Enter") {
        e.preventDefault();
        demo.actionUntil = time + 1.4;
      }
    });
    $("how-kai").addEventListener("pointerdown", (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      demoMove(e.clientX < r.x + r.width / 2 ? -1 : 1, 0);
      demo.actionUntil = 0;
    });
    A.load([])
      .then(() => {
        ready = true;
        document.body.dataset.uiReady = "true";
      })
      .catch(() => R.notice("Uma imagem não carregou. Atualize a página."));
    const fit = () => {
      const island = document.querySelector(".island"),
        stage = document.querySelector(".map-stage"),
        r = island.getBoundingClientRect(),
        k = Math.min(r.width / 1280, r.height / 721);
      stage.style.width = k * 1280 + "px";
      stage.style.height = k * 721 + "px";
      document.body.dataset.mapFit = "inteiro";
    };
    new ResizeObserver(fit).observe(document.querySelector(".island"));
    window.addEventListener("resize", fit);
    fit();
    $("demo-action").innerHTML = R.icon("hand") + "<span>Enter</span>";
    $("demo-action").onclick = () => {
      demo.actionUntil = time + 1.4;
      $("demo-feedback").textContent = "Kai cuida da natureza.";
    };
    const pad = $("demo-joystick"),
      knob = pad.querySelector("i");
    let pointer = null,
      stickX = 0,
      stickY = 0;
    const drag = (e) => {
      const r = pad.getBoundingClientRect(),
        dx = (e.clientX - r.x - r.width / 2) / (r.width * 0.35),
        dy = (e.clientY - r.y - r.height / 2) / (r.height * 0.35),
        d = Math.max(1, Math.hypot(dx, dy));
      stickX = dx / d;
      stickY = dy / d;
      knob.style.translate = `${stickX * 16}px ${stickY * 16}px`;
      demoMove(stickX * 0.34, stickY * 0.34);
      $("demo-feedback").textContent = "Você está movendo Kai.";
    };
    pad.onpointerdown = (e) => {
      pointer = e.pointerId;
      pad.setPointerCapture(pointer);
      drag(e);
    };
    pad.onpointermove = (e) => {
      if (pointer === e.pointerId) drag(e);
    };
    const release = () => {
      pointer = null;
      stickX = stickY = 0;
      knob.style.translate = "0 0";
    };
    pad.onpointerup = release;
    pad.onpointercancel = release;
    pad.onlostpointercapture = release;
    pad.onkeydown = (e) => {
      const d = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      }[e.key];
      if (d) {
        e.preventDefault();
        demoMove(...d);
      }
    };
    const updateSettings = (tab) => {
      const p = R.prefs();
      $("settings-summary").textContent =
        (p.controlMode === "keyboard"
          ? "Teclado"
          : p.controlMode === "touch"
            ? "Toque"
            : "Modo automático") +
        " · " +
        ({
          leve: "Gráficos leves",
          equilibrada: "Gráficos equilibrados",
          alta: "Mais detalhes",
        }[p.graphicsQuality] || "Gráficos equilibrados");
      if (tab)
        $("settings-explainer").textContent = {
          audio: "Ajuste os sons da sua aventura.",
          conforto: "Leia e explore com conforto.",
          controles: "Escolha teclado ou toque.",
          imagem: "Escolha efeitos e qualidade.",
        }[tab];
    };
    window.addEventListener("viva:settings-tab", (e) =>
      updateSettings(e.detail),
    );
    window.addEventListener("guardiao:preferencias", () => updateSettings());
    updateSettings();
    show();
    raf = requestAnimationFrame(render);
  }
  window.addEventListener("hashchange", show);
  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(raf);
    clearTimeout(restoreTimer);
    clearTimeout(captionTimer);
  });
  window.addEventListener("storage", (e) => {
    if (e.key === "guardiao.mapa.progresso.v1" && view === "mapa") mapDraw();
  });
  window.RaizesApp = {
    phases,
    show,
    progress,
    refreshMap: mapDraw,
    view: () => view,
  };
  document.addEventListener("DOMContentLoaded", init, { once: true });
})();


;/* jogo/brisa-suave/carregamento.js */
"use strict";
(() => {
  const base = new URL("./", ({src:new URL("../brisa-suave/carregamento.js?v=suave-1",document.baseURI).href}).src),
    warmed = new Set(),
    files = new Set();
  const maps = {
    1: "floresta",
    2: "rio",
    3: "fauna",
    4: "plantio",
    5: "cidade",
  };
  function prefetch(file, from = base) {
    const url = new URL(file, from).href;
    if (files.has(url)) return;
    files.add(url);
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "image";
    link.href = url;
    link.fetchPriority = "low";
    document.head.append(link);
  }
  function prepare() {
    const id = Number(document.body.dataset.phasePreview);
    if (
      !maps[id] ||
      warmed.has(id) ||
      navigator.connection?.saveData ||
      !GuardiaoProgresso.unlocked(id)
    )
      return;
    warmed.add(id);
    prefetch("../reencontro/assets/" + maps[id] + "-antes.webp");
    prefetch("../arte-viva/assets/flora.webp");
    for (const name of [
      "explorador",
      "equipamentos",
      id === 1 ? "mangueira" : GuardiaoMemoria.phaseUniform(id),
      ...(id >= 3 ? ["tarefas"] : []),
    ])
      if (BosqueKaiAtlas[name])
        prefetch(BosqueKaiAtlas[name].file, BosqueKai.base);
    if (id === 2) prefetch("../reencontro/assets/kai-rio-cuidado.webp");
  }
  document.addEventListener("DOMContentLoaded", () => {
    new MutationObserver(prepare).observe(document.body, {
      attributes: true,
      attributeFilter: ["data-phase-preview"],
    });
  });
  window.BrisaSuaveCarregamento = {
    prepare,
    state: () => ({ phases: [...warmed], files: files.size }),
  };
})();


;/* jogo/brisa/interacoes.js */
"use strict";
(() => {
  function briefItems() {
    if (window.CincoMissoes) return;
    const id = Number(document.body.dataset.phasePreview),
      node = document.getElementById("phase-items");
    if (!id || !node) return;
    const items = GuardiaoMemoria.items.filter((i) => i.phase === id);
    node.innerHTML =
      '<span class="brief-item-art" aria-hidden="true">' +
      items
        .slice(0, 3)
        .map((i) => BrisaArte.markup(i.id))
        .join("") +
      "</span><span>" +
      {
        1: "Mangueira e kit de cuidado",
        2: "Rede, bolsa e proteção do rio",
        3: "Kit veterinário e material de resgate",
        4: "Sementes, mudas e regador",
        5: "Materiais para cuidar da cidade",
      }[id] +
      "</span>";
  }
  document.addEventListener("DOMContentLoaded", () => {
    const bag = document.getElementById("map-backpack");
    if (bag) bag.innerHTML = Raizes.icon("bag") + "<span>Mochila</span>";
    document
      .querySelectorAll(
        ".home-menu a,.home-settings,.map-hotspot,.ra-world-icon",
      )
      .forEach((el) => el.classList.add("brisa-interactive"));
    new MutationObserver(briefItems).observe(document.body, {
      attributes: true,
      attributeFilter: ["data-phase-preview"],
    });
    document.addEventListener("click", (e) => {
      const el = e.target.closest(
        ".wood-button,.map-hotspot,.ra-world-icon,.icon-button,.brisa-map-pack",
      );
      if (!el || BrisaArte.reduced()) return;
      el.animate(
        [
          { filter: "brightness(1)" },
          { filter: "brightness(1.18)" },
          { filter: "brightness(1)" },
        ],
        { duration: 420, easing: "ease-out" },
      );
    });
    if (window.MutationObserver) {
      const root = document.getElementById("map-hotspots");
      if (root)
        new MutationObserver(() => {
          root
            .querySelectorAll(".map-hotspot")
            .forEach((b) => b.classList.add("brisa-interactive"));
          // A conversa já chega pintada ao tocar na placa, sem buscar a arte depois do clique.
          if (document.body.dataset.view === "mapa")
            VivaArt.load(["acoes", "npcs", "flora", "encontros"]);
        }).observe(root, { childList: true });
    }
  });
})();


;/* jogo/jornada-final/atlas.js */
"use strict";
window.JornadaFinalAtlas = {
  abracos: {
    file: "assets/abracos.webp",
    width: 2172,
    height: 724,
    frames: [
      {
        bounds: [47, 131, 362, 520],
        pivot: [228, 651],
        height: 520,
      },
      {
        bounds: [478, 144, 373, 507],
        pivot: [664.5, 651],
        height: 507,
      },
      {
        bounds: [914, 138, 361, 513],
        pivot: [1094.5, 651],
        height: 513,
      },
      {
        bounds: [1347, 148, 354, 505],
        pivot: [1524, 653],
        height: 505,
      },
      {
        bounds: [1782, 156, 360, 496],
        pivot: [1962, 652],
        height: 496,
      },
    ],
  },
  "vestir-traje": {
    file: "assets/vestir-traje.webp",
    width: 2172,
    height: 724,
    frames: [
      {
        bounds: [29, 138, 281, 468],
        pivot: [169.5, 606],
        height: 468,
      },
      {
        bounds: [421, 138, 233, 468],
        pivot: [537.5, 606],
        height: 468,
      },
      {
        bounds: [781, 138, 275, 468],
        pivot: [918.5, 606],
        height: 468,
      },
      {
        bounds: [1159, 138, 222, 468],
        pivot: [1270, 606],
        height: 468,
      },
      {
        bounds: [1518, 139, 235, 467],
        pivot: [1635.5, 606],
        height: 467,
      },
      {
        bounds: [1893, 138, 212, 468],
        pivot: [1999, 606],
        height: 468,
      },
    ],
  },
  "fauna-grande": {
    file: "../cuidado-acessivel/assets/equilibrio-fauna-grande-113ac762.webp",
    width: 1536,
    height: 876,
    referenceHeight: 212.5,
    frames: [
      {
        bounds: [26, 106, 331, 174],
        pivot: [191.5, 280],
      },
      {
        bounds: [406, 89, 339, 191],
        pivot: [575.5, 280],
      },
      {
        bounds: [794, 15, 332, 265],
        pivot: [960, 280],
      },
      {
        bounds: [1178, 13, 332, 267],
        pivot: [1344, 280],
      },
      {
        bounds: [16, 369, 353, 203],
        pivot: [192.5, 572],
      },
      {
        bounds: [404, 366, 344, 206],
        pivot: [576, 572],
      },
      {
        bounds: [781, 357, 358, 215],
        pivot: [960, 572],
      },
      {
        bounds: [1165, 346, 358, 226],
        pivot: [1344, 572],
      },
      {
        bounds: [24, 681, 335, 183],
        pivot: [191.5, 864],
      },
      {
        bounds: [410, 654, 331, 210],
        pivot: [575.5, 864],
      },
      {
        bounds: [788, 614, 343, 250],
        pivot: [959.5, 864],
      },
      {
        bounds: [1175, 615, 338, 249],
        pivot: [1344, 864],
      },
    ],
  },
  "fauna-copa": {
    file: "../cuidado-acessivel/assets/equilibrio-fauna-copa-ac085f5c.webp",
    width: 1808,
    height: 848,
    referenceHeight: 301.5,
    frames: [
      {
        bounds: [36, 121, 381, 291],
        pivot: [226.5, 412],
      },
      {
        bounds: [486, 127, 383, 285],
        pivot: [677.5, 412],
      },
      {
        bounds: [936, 14, 388, 398],
        pivot: [1130, 412],
      },
      {
        bounds: [1368, 100, 428, 312],
        pivot: [1582, 412],
      },
      {
        bounds: [44, 561, 363, 275],
        pivot: [225.5, 836],
      },
      {
        bounds: [494, 567, 367, 269],
        pivot: [677.5, 836],
      },
      {
        bounds: [940, 473, 379, 363],
        pivot: [1129.5, 836],
      },
      {
        bounds: [1382, 473, 399, 363],
        pivot: [1581.5, 836],
      },
    ],
  },
  "fauna-brasileira": {
    file: "../cuidado-acessivel/assets/amanha-fauna-brasileira-c4a5e6ac.webp",
    width: 1488,
    height: 1088,
    referenceHeight: 238.5,
    frames: [
      {
        bounds: [51, 17, 270, 243],
        pivot: [186, 260],
      },
      {
        bounds: [425, 18, 266, 242],
        pivot: [558, 260],
      },
      {
        bounds: [784, 22, 293, 238],
        pivot: [930.5, 260],
      },
      {
        bounds: [1158, 14, 288, 246],
        pivot: [1302, 260],
      },
      {
        bounds: [30, 298, 312, 234],
        pivot: [186, 532],
      },
      {
        bounds: [398, 304, 320, 228],
        pivot: [558, 532],
      },
      {
        bounds: [770, 303, 320, 229],
        pivot: [930, 532],
      },
      {
        bounds: [1144, 293, 316, 239],
        pivot: [1302, 532],
      },
      {
        bounds: [30, 568, 313, 236],
        pivot: [186.5, 804],
      },
      {
        bounds: [401, 568, 314, 236],
        pivot: [558, 804],
      },
      {
        bounds: [756, 564, 347, 240],
        pivot: [929.5, 804],
      },
      {
        bounds: [1138, 567, 328, 237],
        pivot: [1302, 804],
      },
      {
        bounds: [44, 841, 284, 235],
        pivot: [186, 1076],
      },
      {
        bounds: [412, 835, 293, 241],
        pivot: [558.5, 1076],
      },
      {
        bounds: [781, 836, 298, 240],
        pivot: [930, 1076],
      },
      {
        bounds: [1152, 840, 299, 236],
        pivot: [1301.5, 1076],
      },
    ],
  },
  animais: {
    file: "../rio-claro/assets/animais-rio.webp",
    width: 1280,
    height: 960,
    referenceHeight: 260,
    frames: [
      {
        bounds: [13, 67, 294, 186],
        pivot: [160, 253],
      },
      {
        bounds: [333, 66, 294, 187],
        pivot: [480, 253],
      },
      {
        bounds: [653, 69, 294, 181],
        pivot: [800, 250],
      },
      {
        bounds: [973, 68, 294, 183],
        pivot: [1120, 251],
      },
      {
        bounds: [13, 397, 294, 166],
        pivot: [160, 563],
      },
      {
        bounds: [333, 396, 294, 167],
        pivot: [480, 563],
      },
      {
        bounds: [653, 401, 294, 158],
        pivot: [800, 559],
      },
      {
        bounds: [973, 400, 294, 159],
        pivot: [1120, 559],
      },
      {
        bounds: [13, 716, 294, 167],
        pivot: [160, 883],
      },
      {
        bounds: [333, 716, 294, 168],
        pivot: [480, 884],
      },
      {
        bounds: [653, 709, 294, 182],
        pivot: [800, 891],
      },
      {
        bounds: [973, 703, 294, 194],
        pivot: [1120, 897],
      },
    ],
  },
};


;/* jogo/jornada-final/retorno.js */
"use strict";
(() => {
  const base = new URL("./", ({src:new URL("../jornada-final/retorno.js?v=1",document.baseURI).href}).src),
    images = new Map(),
    $ = (id) => document.getElementById(id);
  const visits = [
    {
      name: "Floresta em Chamas",
      map: "floresta",
      npc: "Carlos",
      line: "O fogo deu lugar à vida. Os animais estão seguros, e Carlos recebe Kai de braços abertos.",
    },
    {
      name: "Rio Poluído",
      map: "rio",
      npc: "Antônio",
      line: "A água está limpa. Os peixes nadam livres e a tartaruga voltou à areia, sem plástico.",
    },
    {
      name: "Resgate da Fauna",
      map: "fauna",
      npc: "Marina",
      line: "Mico, preguiça e seus amigos estão recuperados. Marina comemora cada vida protegida.",
    },
    {
      name: "Reflorestamento",
      map: "plantio",
      npc: "Rafael",
      line: "As mudas cresceram e devolveram sombra, flores e abrigo à floresta. Rafael celebra o cuidado de Kai.",
    },
    {
      name: "Cidade Sustentável",
      map: "cidade",
      npc: "Luciana",
      line: "A cidade ganhou jardins, energia limpa e coleta seletiva. Kai e Luciana celebram a comunidade.",
    },
  ];
  let index = 0,
    elapsed = 0,
    last = 0,
    active = false,
    ready = false,
    ticket = 0,
    onComplete = null;
  const still = () =>
    Raizes.prefs().reduceMotion ||
    matchMedia("(prefers-reduced-motion:reduce)").matches;
  async function image(key, path) {
    if (images.has(key)) return;
    const im = new Image();
    im.decoding = "async";
    im.src = new URL(path, base);
    await im.decode();
    images.set(key, im);
  }
  function start(done) {
    const run = ++ticket;
    active = true;
    ready = false;
    index = 0;
    elapsed = 0;
    last = 0;
    onComplete = done;
    $("journey-return").hidden = false;
    $("return-next").focus();
    caption();
    $("return-line").textContent =
      "Revisitando os lugares que você ajudou a transformar…";
    Promise.all([
      ...visits.map((v) =>
        image(v.map, "../reencontro/assets/" + v.map + "-depois.webp"),
      ),
      ...[
        "abracos",
        "fauna-grande",
        "fauna-copa",
        "fauna-brasileira",
        "animais",
      ].map((name) => image(name, JornadaFinalAtlas[name].file)),
      VivaArt.load(["flora"]),
    ])
      .then(() => {
        if (run !== ticket) return;
        ready = true;
        last = 0;
        caption();
      })
      .catch(() => {
        if (run !== ticket) return;
        $("return-line").textContent =
          "Não foi possível carregar as lembranças. Toque no botão para assistir ao vídeo final.";
        $("return-next").textContent = "Ver vídeo final →";
        ready = false;
      });
  }
  function caption() {
    const v = visits[index];
    $("return-title").textContent = v.name;
    $("return-line").textContent = v.line;
    $("return-count").textContent =
      index + 1 + " de 5 · Reencontro com " + v.npc;
    $("return-next").textContent =
      index === 4 ? "Ver vídeo final →" : "Próxima lembrança →";
    document.body.dataset.returnPhase = String(index + 1);
  }
  function finish() {
    if (!active) return;
    active = false;
    ticket++;
    $("journey-return").hidden = true;
    const done = onComplete;
    onComplete = null;
    done?.();
  }
  function next() {
    if (!active) return;
    if (!ready || index === 4) {
      finish();
      return;
    }
    index++;
    elapsed = 0;
    last = 0;
    caption();
  }
  function sprite(c, name, frame, x, y, h, flip = false) {
    const d = JornadaFinalAtlas[name],
      im = images.get(name);
    if (!d || !im) return;
    const f = d.frames[frame],
      b = f.bounds,
      k = h / (f.height || d.referenceHeight || b[3]);
    c.save();
    c.translate(x, y);
    if (flip) c.scale(-1, 1);
    c.drawImage(
      im,
      ...b,
      (b[0] - f.pivot[0]) * k,
      (b[1] - f.pivot[1]) * k,
      b[2] * k,
      b[3] * k,
    );
    c.restore();
  }
  function paint(_c, _w, _h, time) {
    if (!active || !ready) return;
    if (last && !document.hidden)
      elapsed += Math.min(0.1, Math.max(0, time - last));
    last = time;
    if (elapsed >= 7.2) {
      next();
      if (!active) return;
    }
    VivaArt.canvas($("return-art"), (c, w, h) => {
      // Letterbox the original 16:9 maps; every region stays visible on mobile.
      c.fillStyle = "#102e24";
      c.fillRect(0, 0, w, h);
      const k = Math.min(w / 1280, h / 720),
        ox = (w - 1280 * k) / 2,
        oy = (h - 720 * k) / 2;
      c.save();
      c.translate(ox, oy);
      c.scale(k, k);
      if (index > 0 && !still() && elapsed < 0.8) {
        c.drawImage(images.get(visits[index - 1].map), 0, 0, 1280, 720);
        c.save();
        c.globalAlpha = Math.min(1, elapsed / 0.8);
        c.drawImage(images.get(visits[index].map), 0, 0, 1280, 720);
        c.restore();
      } else c.drawImage(images.get(visits[index].map), 0, 0, 1280, 720);

      const t = still() ? 0 : time,
        enter = still() ? 1 : Math.min(1, elapsed / 1.1),
        alpha = enter * enter * (3 - 2 * enter);
      c.globalAlpha = alpha;
      c.fillStyle = "#18392b30";
      c.beginPath();
      c.ellipse(950, 671, 172, 24, 0, 0, Math.PI * 2);
      c.fill();
      // Each reunion uses an actual embrace pose, rather than overlapping standing characters.
      sprite(
        c,
        "abracos",
        index,
        950,
        670,
        385 + (still() ? 0 : Math.sin(t * 1.8) * 1.2),
      );
      VivaArt.owl(c, 1120, 280, 65, t, "festa", true);
      if (index === 0) {
        sprite(c, "fauna-brasileira", 2, 210, 558, 80);
        sprite(c, "fauna-brasileira", 14, 410, 589, 65);
      }
      if (index === 1) {
        sprite(c, "animais", 2, 585, 365, 70);
        sprite(c, "animais", 6, 628, 490, 60);
        sprite(c, "animais", 10, 955, 408, 72);
      }
      if (index === 2) {
        sprite(c, "fauna-brasileira", 6, 490, 202, 65);
        sprite(c, "fauna-copa", 6, 330, 278, 65);
        sprite(c, "fauna-grande", 2, 600, 593, 85);
        sprite(c, "fauna-grande", 10, 193, 564, 86);
        sprite(c, "fauna-copa", 2, 645, 220, 70);
        sprite(c, "fauna-brasileira", 2, 280, 470, 85);
      }
      c.restore();
    });
  }
  function stop() {
    active = false;
    ready = false;
    ticket++;
    last = 0;
    onComplete = null;
    $("journey-return").hidden = true;
  }
  document.addEventListener("DOMContentLoaded", () => {
    $("return-next").onclick = next;
    $("journey-return").addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        $("return-next").focus();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        finish();
      }
    });
    document.addEventListener("visibilitychange", () => {
      last = 0;
    });
  });
  window.JornadaRetorno = {
    start,
    next,
    paint,
    stop,
    state: () => ({ active, ready, index, elapsed, npc: visits[index].npc }),
  };
})();


;/* jogo/bosque-vivo/final.js */
"use strict";
(() => {
  const $ = (id) => document.getElementById(id),
    seen = "guardiao.viva.final.v1";
  let active = false,
    finished = false,
    closing = false,
    previousFocus = null,
    finishTimer = 0,
    quietTimer = 0,
    generation = 0;
  const reduced = () =>
    Raizes.prefs().reduceMotion ||
    matchMedia("(prefers-reduced-motion:reduce)").matches;
  const inCinema = () =>
    active && !finished && document.body.dataset.finaleScene === "video";
  function wakeControls() {
    clearTimeout(quietTimer);
    $("final-cinema").dataset.cinemaQuiet = "false";
    if (inCinema() && !$("final-movie").paused && !closing)
      quietTimer = setTimeout(() => {
        $("final-cinema").dataset.cinemaQuiet = "true";
      }, 2800);
  }
  function gate(label, message, state = "awaiting") {
    if (!inCinema() || closing) return;
    $("final-cinema").dataset.cinemaState = state;
    $("cinema-gate").hidden = false;
    $("cinema-action").textContent = label;
    $("final-movie-status").textContent = message;
    wakeControls();
    if (!document.hidden) $("cinema-action").focus({ preventScroll: true });
  }
  function enterFullscreen() {
    if (
      navigator.userActivation?.isActive &&
      !window.GuardiaoTela?.state().fullscreen
    )
      window.GuardiaoTela?.enter().catch(() => {});
  }
  function finalize() {
    if (!active || finished) return;
    finished = true;
    closing = false;
    clearTimeout(quietTimer);
    JornadaRetorno.stop();
    $("final-movie").pause();
    $("final-cinema").hidden = true;
    window.GuardiaoAudio?.cinematic(false);
    BosqueMapa.finalGrowth(1);
    try {
      localStorage.setItem(seen, "visto");
    } catch {}
    document.body.dataset.endingState = "concluido";
    document.body.dataset.finaleScene = "celebracao";
    $("tree-state").textContent = "Árvore Guardiã restaurada";
    $("credits-necklace").innerHTML = GuardiaoRelicario.necklace(
      [1, 2, 3, 4, 5],
      "credits",
    );
    if (!$("final-credits").open) $("final-credits").showModal();
  }
  function complete() {
    if (!active || finished || closing) return;
    closing = true;
    clearTimeout(quietTimer);
    JornadaRetorno.stop();
    $("final-movie").pause();
    $("cinema-gate").hidden = true;
    $("final-cinema").dataset.cinemaState = "leaving";
    finishTimer = setTimeout(finalize, reduced() ? 0 : 750);
  }
  function playScene() {
    if (!inCinema() || closing) return;
    const run = generation,
      movie = $("final-movie");
    movie.controls = false;
    $("cinema-gate").hidden = true;
    $("final-cinema").dataset.cinemaState = "preparing";
    // Start media in the same gesture as fullscreen; no native player is opened.
    movie.play().catch(() => {
      if (run === generation)
        gate("Entrar na cena", "Toque para começar a cena.");
    });
    enterFullscreen();
  }
  function start() {
    if (!Raizes.won() || active) return;
    generation++;
    previousFocus = document.activeElement;
    active = true;
    finished = false;
    closing = false;
    clearTimeout(finishTimer);
    document.body.classList.add("island-ending");
    document.body.dataset.endingState = "retrospectiva";
    document.body.dataset.finaleScene = "retrospectiva";
    enterFullscreen();
    JornadaRetorno.start(startMovie);
  }
  function startMovie() {
    if (!active || finished) return;
    document.body.dataset.endingState = "video";
    document.body.dataset.finaleScene = "video";
    const movie = $("final-movie"),
      cinema = $("final-cinema");
    cinema.hidden = false;
    cinema.dataset.cinemaQuiet = "false";
    cinema.dataset.cinemaState = "preparing";
    movie.controls = false;
    movie.currentTime = 0;
    window.GuardiaoAudio?.cinematic(true);
    cinema.focus({ preventScroll: true });
    if (
      window.GuardiaoTela?.state().fullscreen ||
      navigator.userActivation?.isActive
    )
      playScene();
    else {
      movie.load();
      gate("Entrar na cena", "Toque para assistir à cena em tela cheia.");
    }
  }
  function stop() {
    const wasActive = active;
    active = false;
    generation++;
    closing = false;
    clearTimeout(finishTimer);
    clearTimeout(quietTimer);
    JornadaRetorno.stop();
    $("final-movie").pause();
    $("final-cinema").hidden = true;
    $("cinema-gate").hidden = true;
    document.body.classList.remove("island-ending");
    if ($("final-credits").open) $("final-credits").close();
    if (wasActive) {
      window.GuardiaoAudio?.cinematic(false);
      if (document.body.dataset.view === "mapa") RaizesApp.refreshMap();
      previousFocus?.focus?.();
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    const movie = $("final-movie"),
      cinema = $("final-cinema");
    movie.addEventListener("ended", complete);
    movie.addEventListener("playing", () => {
      if (!inCinema() || closing) return;
      $("cinema-gate").hidden = true;
      cinema.dataset.cinemaState = "playing";
      wakeControls();
    });
    movie.addEventListener("pause", () => {
      if (!movie.ended && inCinema() && !closing)
        gate("Continuar cena", "Toque para continuar de onde parou.", "paused");
    });
    const failure = () =>
      gate(
        "Tentar novamente",
        "Não foi possível carregar a cena. Tente novamente ou pule para continuar.",
        "error",
      );
    movie.addEventListener("error", failure);
    movie.querySelector("source").addEventListener("error", failure);
    $("cinema-action").onclick = () => {
      if (movie.error) movie.load();
      playScene();
    };
    $("ending-skip").onclick = complete;
    $("ending-island").onclick = stop;
    $("final-credits").addEventListener("cancel", (e) => {
      e.preventDefault();
      stop();
    });
    cinema.addEventListener("pointermove", wakeControls);
    cinema.addEventListener("pointerdown", wakeControls);
    cinema.addEventListener("focusin", wakeControls);
    cinema.addEventListener("keydown", (e) => {
      wakeControls();
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        complete();
      }
      if (e.key === "Tab") {
        const controls = [$("cinema-action"), $("ending-skip")].filter(
          (el) => el.getClientRects().length,
        );
        const i = controls.indexOf(document.activeElement),
          next = e.shiftKey
            ? i <= 0
              ? controls.length - 1
              : i - 1
            : (i + 1) % controls.length;
        e.preventDefault();
        controls[next]?.focus();
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && inCinema()) movie.pause();
    });
  });
  window.VivaFinal = {
    get active() {
      return active;
    },
    start,
    stop,
    skip: complete,
    paint: (...args) => JornadaRetorno.paint(...args),
    state: () => ({
      active,
      finished,
      closing,
      elapsed: $("final-movie")?.currentTime || 0,
      scene: document.body.dataset.finaleScene,
      cinema: $("final-cinema")?.dataset.cinemaState,
      retrospective: JornadaRetorno.state(),
    }),
  };
})();


;/* jogo/revisao-paisagem/orientacao.js */
"use strict";
(() => {
  const art = new URL("../gire-o-celular/assets/", ({src:new URL("../revisao-paisagem/orientacao.js",document.baseURI).href}).src);
  const touch = matchMedia("(any-pointer:coarse)");
  const phone = () => touch.matches || navigator.maxTouchPoints > 0;
  let blocked = false,
    prompt,
    previousFocus,
    pending = false;
  function bringForward() {
    if (!blocked || !prompt) return;
    if (prompt.open) prompt.close();
    prompt.showModal();
  }
  function apply() {
    const next = innerHeight > innerWidth;
    const mobile = phone();
    document.getElementById("girar-titulo").textContent = mobile
      ? "Gire o celular"
      : "Amplie a janela";
    document.getElementById("girar-dica").textContent = mobile
      ? "Deixe a tela na horizontal para começar sua aventura."
      : "Deixe a janela mais larga que alta para continuar sua aventura.";
    document.getElementById("girar-acao").textContent = mobile
      ? "JOGAR NA HORIZONTAL"
      : "AMPLIAR A JANELA";
    const changed = next !== blocked;
    blocked = next;
    document.body.dataset.orientationBlocked = String(blocked);
    if (blocked) {
      if (changed)
        document.getElementById("girar-status").textContent = mobile
          ? "Vire o aparelho para continuar."
          : "Amplie a janela para continuar.";
      if (!prompt.open) {
        previousFocus = document.activeElement;
        prompt.showModal();
      }
    } else if (prompt.open) {
      prompt.close();
      if (previousFocus?.isConnected)
        previousFocus.focus({ preventScroll: true });
    }
    if (changed) {
      document.dispatchEvent(new CustomEvent("guardiao:neutralizar"));
      window.GuardiaoAudio?.water(false);
      window.dispatchEvent(
        new CustomEvent("guardiao:orientacao", { detail: { blocked } }),
      );
    }
  }
  function init() {
    prompt = document.createElement("dialog");
    prompt.id = "girar-celular";
    prompt.setAttribute("aria-labelledby", "girar-titulo");
    prompt.setAttribute("aria-describedby", "girar-dica");
    prompt.innerHTML = `
      <div class="rotate-card">
        <img class="rotate-frame" src="${new URL("moldura.webp", art)}" width="1065" height="1477" alt="" loading="lazy" decoding="async" aria-hidden="true">
        <p class="rotate-brand">GUARDIÃO DA<br>NATUREZA</p>
        <img class="rotate-flora" src="${new URL("flora.webp", art)}" width="1619" height="971" alt="" loading="lazy" decoding="async" aria-hidden="true">
        <p class="rotate-kicker">A floresta espera por você!</p>
        <h1 id="girar-titulo">Gire o celular</h1>
        <p id="girar-dica">Deixe a tela na horizontal para começar sua aventura.</p>
        <button type="button" id="girar-tela-cheia" aria-describedby="girar-status"><span id="girar-acao">JOGAR NA HORIZONTAL</span></button>
        <p id="girar-status" role="status">Vire o aparelho para continuar.</p>
      </div>`;
    document.body.append(prompt);
    prompt.addEventListener("cancel", (e) => {
      if (blocked) e.preventDefault();
    });
    const button = prompt.querySelector("button");
    button.addEventListener("click", async () => {
      if (pending) return;
      pending = true;
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      try {
        try {
          if (
            !document.fullscreenElement &&
            !document.webkitFullscreenElement
          ) {
            const enter =
              document.documentElement.requestFullscreen ||
              document.documentElement.webkitRequestFullscreen;
            if (window.GuardiaoTela) await GuardiaoTela.enter();
            else await enter?.call(document.documentElement);
          }
        } catch {}
        try {
          if (phone()) await screen.orientation?.lock?.("landscape");
        } catch {}
        apply();
        if (blocked)
          document.getElementById("girar-status").textContent = phone()
            ? "Gire o aparelho com as mãos."
            : "Amplie a janela para continuar.";
      } finally {
        pending = false;
        button.disabled = false;
        button.removeAttribute("aria-busy");
      }
    });
    new MutationObserver((records) => {
      if (
        blocked &&
        records.some(
          (r) =>
            r.target !== prompt &&
            r.target.tagName === "DIALOG" &&
            r.target.open,
        )
      )
        bringForward();
    }).observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["open"],
    });
    touch.addEventListener("change", apply);
    window.addEventListener("resize", apply);
    window.addEventListener("pageshow", apply);
    screen.orientation?.addEventListener?.("change", apply);
    apply();
  }
  window.GuardiaoOrientacao = Object.freeze({
    get blocked() {
      return blocked;
    },
    refresh: apply,
  });
  init();
})();


;/* jogo/remodelacao/atlas.js */
"use strict";
window.RemodelacaoAtlas = {
  "botoes/cuidar": {
    name: "cuidar",
    file: "assets/icones/cuidar.webp",
    size: [320, 320],
    pivot: [0.5, 0.5],
  },
  "botoes/coletar": {
    name: "coletar",
    file: "assets/icones/coletar.webp",
    size: [320, 320],
    pivot: [0.5, 0.5],
  },
  "botoes/solar": {
    name: "solar",
    file: "assets/icones/solar.webp",
    size: [320, 320],
    pivot: [0.5, 0.5],
  },
  "botoes/livro": {
    name: "livro",
    file: "assets/icones/livro.webp",
    size: [320, 320],
    pivot: [0.5, 0.5],
  },
  "botoes/mochila": {
    name: "mochila",
    file: "assets/icones/mochila.webp",
    size: [320, 320],
    pivot: [0.5, 0.5],
  },
  "botoes/pausa": {
    name: "pausa",
    file: "assets/icones/pausa.webp",
    size: [320, 320],
    pivot: [0.5, 0.5],
  },
  "botoes/tela-cheia": {
    name: "tela-cheia",
    file: "assets/icones/tela-cheia.webp",
    size: [320, 320],
    pivot: [0.5, 0.5],
  },
  "botoes/fechar": {
    name: "fechar",
    file: "assets/icones/fechar.webp",
    size: [320, 320],
    pivot: [0.5, 0.5],
  },
  "botoes/configuracoes": {
    name: "configuracoes",
    file: "assets/icones/configuracoes.webp",
    size: [320, 320],
    pivot: [0.5, 0.5],
  },
  "botoes/agua": {
    name: "agua",
    file: "assets/icones/agua.webp",
    size: [320, 320],
    pivot: [0.5, 0.5],
  },
  "botoes/pata": {
    name: "pata",
    file: "assets/icones/pata.webp",
    size: [320, 320],
    pivot: [0.5, 0.5],
  },
  "botoes/fogo": {
    name: "fogo",
    file: "assets/icones/fogo.webp",
    size: [320, 320],
    pivot: [0.5, 0.5],
  },
  "materiais/garrafa-plastica": {
    name: "garrafa-plastica",
    file: "assets/materiais/garrafa-plastica.webp",
    size: [320, 320],
    pivot: [0.5, 0.9625],
  },
  "materiais/papel-limpo": {
    name: "papel-limpo",
    file: "assets/materiais/papel-limpo.webp",
    size: [320, 320],
    pivot: [0.5, 0.9625],
  },
  "materiais/garrafa-vidro": {
    name: "garrafa-vidro",
    file: "assets/materiais/garrafa-vidro.webp",
    size: [320, 320],
    pivot: [0.5, 0.9625],
  },
  "materiais/latinha": {
    name: "latinha",
    file: "assets/materiais/latinha.webp",
    size: [320, 320],
    pivot: [0.5, 0.9625],
  },
  "materiais/papelao": {
    name: "papelao",
    file: "assets/materiais/papelao.webp",
    size: [320, 320],
    pivot: [0.5, 0.9625],
  },
  "materiais/casca-banana": {
    name: "casca-banana",
    file: "assets/materiais/casca-banana.webp",
    size: [320, 320],
    pivot: [0.5, 0.9625],
  },
  "materiais/painel-solar": {
    name: "painel-solar",
    file: "assets/materiais/painel-solar.webp",
    size: [320, 320],
    pivot: [0.5, 0.9625],
  },
  "materiais/chave": {
    name: "chave",
    file: "assets/materiais/chave.webp",
    size: [320, 320],
    pivot: [0.5, 0.9625],
  },
  "molduras/faixa-titulo": {
    name: "faixa-titulo",
    file: "assets/ui/faixa-titulo.webp",
    size: [1216, 207],
    pivot: [0.5, 0.5],
  },
  "molduras/cartao-estatistica": {
    name: "cartao-estatistica",
    file: "assets/ui/cartao-estatistica.webp",
    size: [1208, 263],
    pivot: [0.5, 0.5],
  },
  "molduras/trilho-carregamento": {
    name: "trilho-carregamento",
    file: "assets/ui/trilho-carregamento.webp",
    size: [1204, 125],
    pivot: [0.5, 0.5],
  },
  "molduras/botao-acao": {
    name: "botao-acao",
    file: "assets/ui/botao-acao.webp",
    size: [931, 233],
    pivot: [0.5, 0.5],
  },
  "loading/fundo": {
    name: "fundo",
    file: "assets/loading/fundo.webp",
    size: [1672, 941],
  },
  "lixeiras/plastico": {
    name: "plastico",
    file: "assets/lixeiras/plastico.webp",
    size: [320, 400],
    pivot: [0.5, 0.97],
  },
  "lixeiras/papel": {
    name: "papel",
    file: "assets/lixeiras/papel.webp",
    size: [320, 400],
    pivot: [0.5, 0.97],
  },
  "lixeiras/vidro": {
    name: "vidro",
    file: "assets/lixeiras/vidro.webp",
    size: [320, 400],
    pivot: [0.5, 0.97],
  },
  "lixeiras/metal": {
    name: "metal",
    file: "assets/lixeiras/metal.webp",
    size: [320, 400],
    pivot: [0.5, 0.97],
  },
  "lixeiras/placa-estacao": {
    name: "placa-estacao",
    file: "assets/lixeiras/placa-estacao.webp",
    size: [320, 400],
    pivot: [0.5, 0.97],
  },
};


;/* jogo/remodelacao/recursos.js */
"use strict";
(() => {
  const base = new URL("./", ({src:new URL("../remodelacao/recursos.js?v=1",document.baseURI).href}).src),
    atlas = RemodelacaoAtlas,
    bank = new Map(),
    pending = new Map();
  const aliases = {
    hand: "cuidar",
    leaf: "cuidar",
    plant: "cuidar",
    seeds: "cuidar",
    mudas: "cuidar",
    sementes: "cuidar",
    seedling: "cuidar",
    water: "agua",
    watering: "agua",
    regador: "agua",
    paw: "pata",
    veterinario: "pata",
    kit: "pata",
    fire: "fogo",
    trash: "coletar",
    recycle: "coletar",
    reciclagem: "coletar",
    sun: "solar",
    solar: "solar",
    bag: "mochila",
    saco: "mochila",
    pause: "pausa",
    full: "tela-cheia",
    exit: "tela-cheia",
    book: "livro",
    info: "livro",
    gear: "configuracoes",
    close: "fechar",
    floresta: "fogo",
    rio: "agua",
    fauna: "pata",
    reflorestamento: "cuidar",
    cidade: "solar",
  };
  const bins = {
    plastic: "plastico",
    paper: "papel",
    glass: "vidro",
    metal: "metal",
  };
  const iconName = (raw) => aliases[raw] || raw;
  const has = (raw) => !!atlas["botoes/" + iconName(raw)];
  const url = (key) => new URL(atlas[key].file, base).href;
  function load(key) {
    if (!pending.has(key))
      pending.set(
        key,
        (async () => {
          const im = new Image();
          im.decoding = "async";
          im.src = url(key);
          await im.decode();
          bank.set(key, im);
          return im;
        })(),
      );
    return pending.get(key);
  }
  function icon(raw, cls = "") {
    return `<img class="remodel-icon ${iconName(raw) === "tela-cheia" ? "brisa-full" : ""} ${cls}" src="${url("botoes/" + iconName(raw))}" width="320" height="320" alt="" aria-hidden="true" decoding="async">`;
  }
  function bin(kind) {
    return `<img class="remodel-bin" src="${url("lixeiras/" + bins[kind])}" width="320" height="400" alt="" aria-hidden="true">`;
  }
  function draw(c, key, x, y, h, { angle = 0, alpha = 1 } = {}) {
    const im = bank.get(key),
      d = atlas[key];
    if (!im || !d) return false;
    const [w, hh] = d.size,
      k = h / hh,
      p = d.pivot || [0.5, 1];
    c.save();
    c.globalAlpha *= alpha;
    c.translate(x, y);
    c.rotate(angle);
    c.drawImage(im, -w * p[0] * k, -hh * p[1] * k, w * k, hh * k);
    c.restore();
    return true;
  }
  function material(t) {
    const name = (t.name || "").toLocaleLowerCase("pt-BR");
    if (t.type === "key") return "chave";
    if (/papelão|papelao/.test(name)) return "papelao";
    if (/vidro/.test(name) || t.material === "glass") return "garrafa-vidro";
    if (/casca/.test(name)) return "casca-banana";
    if (/lata|latinha/.test(name) || t.material === "metal") return "latinha";
    if (/papel/.test(name) || t.material === "paper") return "papel-limpo";
    if (/garrafa|plást|plast/.test(name) || t.material === "plastic")
      return "garrafa-plastica";
    return null;
  }
  function frame(name, bx, by, cls = "") {
    const key = "molduras/" + name,
      [w, h] = atlas[key].size,
      ws = [bx, w - 2 * bx, bx],
      hs = [by, h - 2 * by, by];
    return `<span class="remodel-frame ${cls}" aria-hidden="true">${hs.map((hh, r) => ws.map((ww, c) => (ww && hh ? `<svg style="grid-area:${r + 1}/${c + 1}" viewBox="${c === 0 ? 0 : c === 1 ? bx : w - bx} ${r === 0 ? 0 : r === 1 ? by : h - by} ${ww} ${hh}" preserveAspectRatio="none"><image href="${url(key)}" width="${w}" height="${h}"/></svg>` : "")).join("")).join("")}</span>`;
  }
  async function phase(id) {
    const keys = Object.keys(atlas).filter((k) => k.startsWith("botoes/"));
    if (id === 2)
      keys.push(
        ...["garrafa-plastica", "papel-limpo", "latinha", "casca-banana"].map(
          (n) => "materiais/" + n,
        ),
      );
    if (id === 3) keys.push("materiais/chave");
    if (id === 5)
      keys.push(
        ...Object.values(bins).map((n) => "lixeiras/" + n),
        "lixeiras/placa-estacao",
        ...[
          "garrafa-plastica",
          "papel-limpo",
          "latinha",
          "garrafa-vidro",
          "papelao",
          "painel-solar",
        ].map((n) => "materiais/" + n),
      );
    keys.push(...Object.keys(atlas).filter((k) => k.startsWith("molduras/")));
    await Promise.all([...new Set(keys)].map(load));
    return bank;
  }
  const I = window.GuardiaoIcones,
    priorMarkup = I.markup,
    priorLoad = I.load,
    priorPaint = I.paint;
  const markup = (raw) => (has(raw) ? icon(raw) : priorMarkup(raw));
  I.markup = markup;
  I.load = async () => {
    await Promise.all([
      priorLoad(),
      ...Object.keys(atlas)
        .filter((k) => k.startsWith("botoes/"))
        .map(load),
    ]);
    return bank;
  };
  I.paint = (c, old, raw, x, y, h) =>
    has(raw)
      ? draw(c, "botoes/" + iconName(raw), x, y, h)
      : priorPaint(c, old, raw, x, y, h);
  I.prepare = (parent = document) =>
    parent
      .querySelectorAll("[data-icon]")
      .forEach((el) => (el.innerHTML = markup(el.dataset.icon)));
  const oldIcon = Raizes.icon;
  Raizes.icon = (raw) => (has(raw) ? icon(raw) : oldIcon(raw));
  VivaSimbolos.markup = markup;
  VivaSimbolos.load = I.load;
  if (window.GuardiaoArtesInterface) {
    GuardiaoArtesInterface.svg = markup;
    GuardiaoArtesInterface.load = I.load;
  }
  const C = GuardiaoColecao;
  window.GuardiaoColecao = {
    ...C,
    bin: (kind) => (bins[kind] ? bin(kind) : C.bin(kind)),
  };
  window.GuardiaoHUD = {
    ...window.GuardiaoHUD,
    fullIcon: (active) =>
      `<span class="remodel-full">${icon("full")}${active ? '<span class="remodel-exit" aria-hidden="true">↙</span>' : ""}</span>`,
  };
  if (window.GuardiaoAdventureArt) {
    const Previous = GuardiaoAdventureArt;
    window.GuardiaoAdventureArt = class extends Previous {
      residual(c, t) {
        const name = material(t);
        if (["trash", "recycle"].includes(t.type) && name)
          return draw(c, "materiais/" + name, t.x, t.y, 29);
        return super.residual(c, t);
      }
      riverTrash(c, sprites, target, p, progress) {
        const name = target && material(target);
        if (!name) return super.riverTrash(c, sprites, target, p, progress);
        if (progress < 0.18 || progress > 0.82) return;
        const scale = p.swimming ? 0.78 : 1,
          flip = p.direction >= 3 && p.direction <= 5 ? -1 : 1,
          smooth = (value) => {
            const v = Math.max(0, Math.min(1, value));
            return v * v * (3 - 2 * v);
          },
          hand = { x: p.x + 18 * flip * scale, y: p.y - 7 * scale },
          bag = { x: p.x - 8 * flip * scale, y: p.y + 18 * scale },
          first = progress < 0.4,
          leg = first
            ? smooth((progress - 0.18) / 0.22)
            : smooth((progress - 0.4) / 0.36),
          a = first ? target : hand,
          b = first ? hand : bag;
        return draw(
          c,
          "materiais/" + name,
          a.x + (b.x - a.x) * leg,
          a.y + (b.y - a.y) * leg,
          21 * scale,
          { alpha: 1 - smooth((progress - 0.72) / 0.1) },
        );
      }
      binActors(c) {
        if (this.phase !== 5) return super.binActors(c);
        const station = GuardiaoFasesJogaveis[5].station,
          sign = { x: station.x, y: station.y + 70 };
        return GuardiaoCidadeBins.map((s) => ({
          y: s.y,
          draw: () => {
            draw(c, "lixeiras/" + bins[s.kind], s.x, s.y, 66);
            c.save();
            c.font = "bold 10px system-ui";
            c.textAlign = "center";
            c.strokeStyle = "#183c29";
            c.lineWidth = 3;
            c.fillStyle = "#fff2cc";
            c.strokeText(s.label, s.x, s.y + 12);
            c.fillText(s.label, s.x, s.y + 12);
            c.restore();
          },
        })).concat([
          {
            y: sign.y,
            draw: () => draw(c, "lixeiras/placa-estacao", sign.x, sign.y, 47),
          },
        ]);
      }
    };
  }
  window.GuardiaoRemodelacao = {
    atlas,
    bank,
    url,
    load,
    phase,
    icon,
    has,
    markup,
    draw,
    material,
    frame,
    solar(c, t, done, progress) {
      return draw(c, "materiais/painel-solar", t.x, t.y, 55, {
        angle: done ? 0 : -0.12 * (1 - progress),
      });
    },
    state: () => ({ loaded: [...bank.keys()] }),
  };
})();


;/* jogo/remodelacao/interface.js */
"use strict";
(() => {
  const K = GuardiaoRemodelacao,
    phase = location.pathname.includes("floresta-viva")
      ? 1
      : Number(new URLSearchParams(location.search).get("fase") || 0);
  function controls(root = document) {
    const list = root.matches?.("[data-fullscreen],.icon-button") ? [root] : [];
    list.push(
      ...root.querySelectorAll(
        "[data-fullscreen],.icon-button,[data-pack-close]",
      ),
    );
    for (const b of list) {
      if (b.querySelector(".remodel-icon")) b.classList.add("remodel-control");
    }
  }
  function talk() {
    const d =
      document.getElementById("intro") || document.getElementById("conversa");
    if (!d?.classList.contains("ra-talk")) return;
    d.classList.add("remodel-talk");
    const head = d.querySelector("header"),
      previousTitle = head.querySelector("h2"),
      title = document.getElementById("intro-name") || previousTitle,
      kicker = head.querySelector(".eyebrow"),
      copy = d.querySelector(".ra-talk-copy"),
      text =
        document.getElementById("intro-text") ||
        document.getElementById("conversa-texto"),
      canvas = d.querySelector(".ra-talk-scene"),
      footer = d.querySelector("footer"),
      names = [
        "Floresta em Chamas",
        "Rio Poluído",
        "Resgate da Fauna",
        "Reflorestamento",
        "Cidade Sustentável",
      ];
    kicker.textContent = "CONVERSA · FASE " + phase;
    if (title !== previousTitle) previousTitle.remove();
    title.classList.add("remodel-talk-name");
    d.setAttribute("aria-labelledby", title.id);
    d.setAttribute("aria-describedby", text.id);
    const message = document.createElement("div");
    message.className = "remodel-talk-message";
    message.append(text);
    copy.append(message, footer);
    copy.prepend(kicker, title);
    const figure = document.createElement("figure"),
      caption = document.createElement("figcaption");
    figure.className = "remodel-talk-visual";
    caption.textContent = names[phase - 1];
    canvas.before(figure);
    figure.append(canvas, caption);
    head.innerHTML =
      K.frame("faixa-titulo", 180, 0, "remodel-talk-frame") +
      K.icon("book") +
      "<p>Um cuidado começa com um encontro</p>";
    footer.classList.add("remodel-talk-footer");
    footer.querySelector("button").classList.add("remodel-action");
  }
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      document.body.classList.add("remodelacao");
      for (const [id, name] of [
        ["mochila", "bag"],
        ["pausa", "pause"],
        ["interagir", "hand"],
        ["settings-game", "gear"],
      ]) {
        const b = document.getElementById(id);
        if (!b) continue;
        b.innerHTML =
          K.icon(name) + (id === "interagir" ? "<small>CUIDAR</small>" : "");
        b.classList.add("remodel-control");
      }
      document.querySelectorAll("[data-icon]").forEach((el) => {
        if (K.has(el.dataset.icon)) el.innerHTML = K.icon(el.dataset.icon);
      });
      document.querySelectorAll("[data-fullscreen]").forEach((b) => {
        b.innerHTML =
          window.GuardiaoHUD?.fullIcon(GuardiaoTela.state().fullscreen) ||
          K.icon("full");
        b.classList.add("remodel-control");
      });
      const close = document.getElementById("close-phase");
      if (close) {
        close.innerHTML = K.icon("close");
        close.classList.add("remodel-control");
      }
      const tool = document.getElementById("tool-icon");
      if (phase === 5 && tool) tool.innerHTML = K.icon("trash");
      if (tool?.querySelector(".remodel-icon")) {
        const button = tool.closest("button");
        button.classList.add("remodel-tool");
        button.querySelector(".hud-ring")?.remove();
      }
      talk();
      controls();
      new MutationObserver((records) => {
        for (const r of records)
          for (const n of r.addedNodes) if (n instanceof Element) controls(n);
      }).observe(document.body, { childList: true });
    },
    { once: true },
  );
})();

