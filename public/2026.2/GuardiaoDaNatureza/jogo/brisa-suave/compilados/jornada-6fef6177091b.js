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
  const base = new URL("./assets/", ({src:new URL("../encanto-natural/audio.js?v=encanto-1",document.baseURI).href}).src);
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
    ducked = false;
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


;/* jogo/raizes/caminhos.js */
"use strict";
(() => {
  class Heap {
    constructor() {
      this.items = [];
    }
    push(id, score) {
      const a = this.items;
      let i = a.length;
      a.push({ id, score });
      while (i) {
        const p = (i - 1) >> 1;
        if (a[p].score <= score) break;
        a[i] = a[p];
        i = p;
      }
      a[i] = { id, score };
    }
    pop() {
      const a = this.items,
        first = a[0],
        end = a.pop();
      if (a.length) {
        let i = 0;
        while (i * 2 + 1 < a.length) {
          let c = i * 2 + 1;
          if (c + 1 < a.length && a[c + 1].score < a[c].score) c++;
          if (end.score <= a[c].score) break;
          a[i] = a[c];
          i = c;
        }
        a[i] = end;
      }
      return first;
    }
    get size() {
      return this.items.length;
    }
  }
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];
  class Search {
    constructor({ cols, rows, cell, point, grid, walkable, visible }) {
      Object.assign(this, { cols, rows, cell, point, grid, walkable, visible });
      this.count = cols * rows;
      this.points = Array.from({ length: this.count }, (_, id) => point(id));
      this.edges = new Int8Array(this.count * 8);
      this.signature = null;
      this.calls = 0;
      this.expanded = 0;
    }
    reset(signature) {
      if (signature !== this.signature) {
        this.signature = signature;
        this.edges.fill(0);
      }
    }
    nearest(p, clear) {
      const candidates = [];
      for (let id = 0; id < this.count; id++) {
        if (!this.grid[id] || !clear(this.points[id])) continue;
        const q = this.points[id],
          d = (p.x - q.x) ** 2 + (p.y - q.y) ** 2;
        if (candidates.length < 32 || d < candidates.at(-1).d) {
          let index = 0;
          while (index < candidates.length && candidates[index].d < d) index++;
          candidates.splice(index, 0, { id, d });
          if (candidates.length > 32) candidates.pop();
        }
      }
      const valid = this.walkable(p);
      for (const c of candidates)
        if (!valid || this.visible(p, this.points[c.id])) return c.id;
      return -1;
    }
    route(from, to, { signature = "static", clear = () => true } = {}) {
      this.calls++;
      this.reset(signature);
      if (this.visible(from, to)) return [{ ...to }];
      const start = this.nearest(from, clear),
        end = this.nearest(to, clear);
      if (start < 0 || end < 0) return [];
      const costs = new Float64Array(this.count);
      costs.fill(Infinity);
      const previous = new Int32Array(this.count);
      previous.fill(-1);
      const closed = new Uint8Array(this.count),
        heap = new Heap();
      costs[start] = 0;
      heap.push(start, 0);
      while (heap.size) {
        let { id } = heap.pop();
        if (closed[id]) continue;
        closed[id] = 1;
        this.expanded++;
        if (id === end) {
          const ids = [];
          while (id !== start) {
            ids.push(id);
            id = previous[id];
            if (id < 0) return [];
          }
          ids.reverse();
          const path = [this.points[start], ...ids.map((i) => this.points[i])];
          if (this.walkable(to) && this.visible(path.at(-1) || from, to))
            path.push({ ...to });
          const smooth = [];
          let anchor = from,
            index = 0;
          while (index < path.length) {
            let next = index;
            while (
              next + 1 < path.length &&
              this.visible(anchor, path[next + 1])
            )
              next++;
            smooth.push({ ...path[next] });
            anchor = path[next];
            index = next + 1;
          }
          return smooth;
        }
        const x = id % this.cols,
          y = Math.floor(id / this.cols);
        for (let dir = 0; dir < 8; dir++) {
          const [dx, dy] = dirs[dir],
            xx = x + dx,
            yy = y + dy,
            next = yy * this.cols + xx;
          if (
            xx < 0 ||
            xx >= this.cols ||
            yy < 0 ||
            yy >= this.rows ||
            !this.grid[next] ||
            closed[next] ||
            !clear(this.points[next])
          )
            continue;
          if (
            dx &&
            dy &&
            (!this.grid[y * this.cols + xx] || !this.grid[yy * this.cols + x])
          )
            continue;
          const cache = id * 8 + dir;
          let visible = this.edges[cache];
          if (!visible) {
            visible = this.visible(this.points[id], this.points[next]) ? 1 : -1;
            this.edges[cache] = visible;
          }
          if (visible < 0) continue;
          const g = costs[id] + Math.hypot(dx, dy) * this.cell;
          if (g >= costs[next]) continue;
          costs[next] = g;
          previous[next] = id;
          const q = this.points[next],
            goal = this.points[end];
          heap.push(next, g + Math.hypot(q.x - goal.x, q.y - goal.y));
        }
      }
      return [];
    }
  }
  window.RaizesBusca = Search;
})();


;/* jogo/vida-natural/movimento.js */
"use strict";
(() => {
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function segmentDistance(p, a, b) {
    const dx = b[0] - a[0],
      dy = b[1] - a[1];
    const t = Math.max(
      0,
      Math.min(
        1,
        ((p.x - a[0]) * dx + (p.y - a[1]) * dy) / (dx * dx + dy * dy || 1),
      ),
    );
    return Math.hypot(p.x - a[0] - t * dx, p.y - a[1] - t * dy);
  }
  function polygonMargin(p, polygon) {
    let result = Infinity;
    for (let i = 0; i < polygon.length; i++)
      result = Math.min(
        result,
        segmentDistance(p, polygon[i], polygon[(i + 1) % polygon.length]),
      );
    return result;
  }
  // Exact distance from the feet to the ellipse, rather than eight point samples.
  function touchesEllipse(p, ellipse, radius) {
    const x = Math.abs(p.x - ellipse.x),
      y = Math.abs(p.y - ellipse.y);
    const a = ellipse.rx,
      b = ellipse.ry;
    if (x > a + radius || y > b + radius) return false;
    if ((x / a) ** 2 + (y / b) ** 2 <= 1) return true;
    if (!radius) return false;
    let low = 0,
      high = Math.hypot(a * x, b * y);
    for (let i = 0; i < 18; i++) {
      const t = (low + high) / 2;
      if (((a * x) / (t + a * a)) ** 2 + ((b * y) / (t + b * b)) ** 2 > 1)
        low = t;
      else high = t;
    }
    const t = (low + high) / 2;
    return (
      Math.hypot(
        x - (a * a * x) / (t + a * a),
        y - (b * b * y) / (t + b * b),
      ) <= radius
    );
  }
  function fitsFloor(p, radius, floor) {
    if (!floor(p)) return false;
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8;
      if (
        !floor({ x: p.x + Math.cos(a) * radius, y: p.y + Math.sin(a) * radius })
      )
        return false;
    }
    return true;
  }
  // Bounded substeps prevent tunnelling. Axis selection has no fixed X preference.
  function move(position, dx, dy, allowed) {
    if (![position.x, position.y, dx, dy].every(Number.isFinite)) return 0;
    const length = Math.hypot(dx, dy);
    if (!length) return 0;
    const count = Math.ceil(length / 1.5),
      sx = dx / count,
      sy = dy / count;
    let travelled = 0;
    for (let i = 0; i < count; i++) {
      const old = { x: position.x, y: position.y };
      const next = { x: position.x + sx, y: position.y + sy };
      if (allowed(next)) Object.assign(position, next);
      else {
        const xOnly = { x: next.x, y: position.y },
          yOnly = { x: position.x, y: next.y };
        const xClear = sx !== 0 && allowed(xOnly),
          yClear = sy !== 0 && allowed(yOnly);
        if (xClear && (!yClear || Math.abs(sx) >= Math.abs(sy)))
          position.x = next.x;
        else if (yClear) position.y = next.y;
      }
      travelled += distance(old, position);
    }
    return travelled;
  }
  window.GuardiaoMovimento = Object.freeze({
    distance,
    segmentDistance,
    polygonMargin,
    touchesEllipse,
    fitsFloor,
    move,
  });
})();


;/* jogo/sistemas/arte-manifesto.js */
window.GuardiaoArteManifesto={"assets/identidade-flora/flora-16.png":"assets/otimizados/flora-16-97574bec9a16.webp","assets/identidade-flora/flora-180.png":"assets/otimizados/flora-180-0deb6d287fcc.webp","assets/identidade-flora/flora-32.png":"assets/otimizados/flora-32-f491243a1f37.webp","assets/identidade-flora/flora-48.png":"assets/otimizados/flora-48-42205eed98d6.webp","assets/identidade-flora/flora-original.png":"assets/otimizados/flora-original-7302e6715183.webp","jogo/floresta-viva/revisao/assets/capivara-suave.png":"assets/otimizados/capivara-suave-844a858538c3.webp","jogo/floresta-viva/revisao/assets/carlos-vermelho.png":"assets/otimizados/carlos-vermelho-bc809df1aa4a.webp","jogo/floresta-viva/revisao/assets/cervo-suave.png":"assets/otimizados/cervo-suave-25ad3fb1170f.webp","jogo/floresta-viva/revisao/assets/flora-suave.png":"assets/otimizados/flora-suave-dd67f11afef6.webp","jogo/floresta-viva/revisao/assets/floresta-ilustrada.png":"assets/otimizados/floresta-ilustrada-ca31cffff4a3.webp","jogo/floresta-viva/revisao/assets/floresta-restaurada.png":"assets/otimizados/floresta-restaurada-60ff764a4b71.webp","jogo/floresta-viva/revisao/assets/fogo-suave.png":"assets/otimizados/fogo-suave-ee27995891b8.webp","jogo/floresta-viva/revisao/assets/itens-vermelhos.png":"assets/otimizados/itens-vermelhos-bbb77e54a6b6.webp","jogo/floresta-viva/revisao/assets/kai-caminhada-suave.png":"assets/otimizados/kai-caminhada-suave-e5a8badc5a4d.webp","jogo/floresta-viva/revisao/assets/kai-cuidados-suave.png":"assets/otimizados/kai-cuidados-suave-b56ebc07daff.webp","jogo/floresta-viva/revisao/assets/kai-mangueira-suave.png":"assets/otimizados/kai-mangueira-suave-6c1802681685.webp","jogo/floresta-viva/revisao/assets/kai-recompensa-vermelha.png":"assets/otimizados/kai-recompensa-vermelha-2ebe7f054d33.webp","jogo/floresta-viva/revisao/assets/kai-repouso-suave.png":"assets/otimizados/kai-repouso-suave-09f210bdbf02.webp","jogo/floresta-viva/revisao/assets/natureza-suave.png":"assets/otimizados/natureza-suave-6c6e1f007ff1.webp","jogo/floresta-viva/revisao/assets/passaro-suave.png":"assets/otimizados/passaro-suave-20523a4338eb.webp","jogo/jornada/assets/animais-fauna-andando.png":"assets/otimizados/animais-fauna-andando-30ad0a98eda3.webp","jogo/jornada/assets/animais-fauna.png":"assets/otimizados/animais-fauna-b6580d117a40.webp","jogo/jornada/assets/animais-rio.png":"assets/otimizados/animais-rio-0d1f8f89e369.webp","jogo/jornada/assets/icones.png":"assets/otimizados/icones-b06650070bb8.webp","jogo/jornada/assets/kai-floresta.png":"assets/otimizados/kai-floresta-cadc96bcf122.webp","jogo/jornada/assets/kai-livre.png":"assets/otimizados/kai-livre-2a780e2ee1c6.webp","jogo/jornada/assets/kai-nadando.png":"assets/otimizados/kai-nadando-c16c95e3a7c0.webp","jogo/jornada/assets/kai-plantio.png":"assets/otimizados/kai-plantio-2f09fe7cf245.webp","jogo/jornada/assets/kai-rio.png":"assets/otimizados/kai-rio-3455cd21178c.webp","jogo/jornada/assets/mapa-cidade-restaurado.png":"assets/otimizados/mapa-cidade-restaurado-1e6b5a1bc37f.webp","jogo/jornada/assets/mapa-cidade.png":"assets/otimizados/mapa-cidade-f4c69f61fa04.webp","jogo/jornada/assets/mapa-fauna-restaurado.png":"assets/otimizados/mapa-fauna-restaurado-c4ca2389304e.webp","jogo/jornada/assets/mapa-fauna.png":"assets/otimizados/mapa-fauna-64cf0f512e24.webp","jogo/jornada/assets/mapa-plantio-restaurado.png":"assets/otimizados/mapa-plantio-restaurado-a1e026f0c23f.webp","jogo/jornada/assets/mapa-plantio.png":"assets/otimizados/mapa-plantio-d39478f86701.webp","jogo/jornada/assets/mapa-rio-restaurado.png":"assets/otimizados/mapa-rio-restaurado-008e1d91eace.webp","jogo/jornada/assets/mapa-rio.png":"assets/otimizados/mapa-rio-f0a5c324fce7.webp","jogo/jornada/assets/objetos.png":"assets/otimizados/objetos-98df3395e246.webp","jogo/jornada/assets/recompensa-amarelo.png":"assets/otimizados/recompensa-amarelo-047c2f5bbd67.webp","jogo/jornada/assets/recompensa-azul.png":"assets/otimizados/recompensa-azul-78beea59a156.webp","jogo/jornada/assets/recompensa-verde.png":"assets/otimizados/recompensa-verde-bcfc11003a84.webp","jogo/jornada/assets/recompensa-violeta.png":"assets/otimizados/recompensa-violeta-fc5ff22c62d6.webp","tela-inicial/colar-remodelado/assets/01_progressao.png":"assets/otimizados/01_progressao-5e2a3ff090d7.webp","tela-inicial/colar-remodelado/assets/02_encaixe_e_transformacao.png":"assets/otimizados/02_encaixe_e_transformacao-6469a8b805d2.webp","tela-inicial/colar-remodelado/assets/03_pecas_e_base.png":"assets/otimizados/03_pecas_e_base-48faad262472.webp","tela-inicial/colar-remodelado/assets/04_kai_recebendo_colar.png":"assets/otimizados/04_kai_recebendo_colar-bfb2d7e63073.webp","tela-inicial/colar-remodelado/assets/05_encaixes_fases_2_a_5.png":"assets/otimizados/05_encaixes_fases_2_a_5-9562faab704f.webp","tela-inicial/jornada-viva/assets/festa-da-floresta.png":"assets/otimizados/festa-da-floresta-1e920b256270.webp","tela-inicial/jornada-viva/assets/ilha-restaurada.png":"assets/otimizados/ilha-restaurada-f89dd00d7eb4.webp","tela-inicial/jornada-viva/assets/ilha-viva.png":"assets/otimizados/ilha-viva-c81b3e75bcea.webp","tela-inicial/jornada-viva/assets/kai-cuida-da-natureza.png":"assets/otimizados/kai-cuida-da-natureza-8d4e0b7b1884.webp","tela-inicial/mapa-interativo/assets/01_npcs_dialogo.png":"assets/otimizados/01_npcs_dialogo-107886c8fbd1.webp","tela-inicial/mapa-interativo/assets/02_kai_dialogo.png":"assets/otimizados/02_kai_dialogo-9083e324ba39.webp","tela-inicial/mapa-interativo/assets/03_painel_sem_texto.png":"assets/otimizados/03_painel_sem_texto-d49a5da375ed.webp","tela-inicial/mapa-interativo/assets/04_botoes_e_componentes.png":"assets/otimizados/04_botoes_e_componentes-adea2b3accbd.webp","tela-inicial/mapa-interativo/assets/05_equipamentos_e_recompensas.png":"assets/otimizados/05_equipamentos_e_recompensas-de19e7e5fa5a.webp","tela-inicial/menu-vivo/assets/flora-poses.png":"assets/otimizados/flora-poses-783734c861ac.webp","tela-inicial/nova-versao/assets/floresta-modelo.png":"assets/otimizados/floresta-modelo-ecb6a1ebe3f6.webp","tela-inicial/nova-versao/assets/folhas-sprites.png":"assets/otimizados/folhas-sprites-dc0703caf7d4.webp","tela-inicial/nova-versao/assets/horizonte-kai-flora.png":"assets/otimizados/horizonte-kai-flora-447e88cae303.webp","tela-inicial/nova-versao/assets/titulo-guardiao.png":"assets/otimizados/titulo-guardiao-0887371a904b.webp","jogo/floresta-viva/assets/kai-repouso.png":"assets/otimizados/kai-repouso-1ca616974995.webp"};


;/* jogo/sistemas/arte.js */
"use strict";
(() => {
  const root = new URL("../../", ({src:new URL("../sistemas/arte.js",document.baseURI).href}).src);
  function url(value) {
    const original = new URL(value, document.baseURI),
      key = original.pathname.startsWith(root.pathname)
        ? original.pathname.slice(root.pathname.length)
        : null;
    return key && window.GuardiaoArteManifesto?.[key]
      ? new URL(window.GuardiaoArteManifesto[key], root).href
      : original.href;
  }
  window.GuardiaoArte = Object.freeze({ url, root: root.href });
})();


;/* jogo/vida-natural/atlas.js */
window.GuardiaoVidaAtlas = {
  "kai-andando": {
    file: "kai-andando.webp",
    width: 1774,
    height: 887,
    referenceHeight: 217.0,
    frames: [
      { bounds: [38, 8, 184, 214], pivot: [147.625, 222] },
      { bounds: [246, 7, 170, 215], pivot: [344.625, 222] },
      { bounds: [455, 5, 184, 217], pivot: [558.125, 222] },
      { bounds: [683, 5, 169, 217], pivot: [780.125, 222] },
      { bounds: [926, 7, 158, 215], pivot: [1019.875, 222] },
      { bounds: [1136, 6, 160, 215], pivot: [1232.375, 221] },
      { bounds: [1344, 6, 166, 216], pivot: [1433.375, 222] },
      { bounds: [1561, 5, 179, 216], pivot: [1664.875, 221] },
      { bounds: [57, 222, 152, 222], pivot: [112.5, 444] },
      { bounds: [271, 222, 155, 222], pivot: [321.0, 444] },
      { bounds: [492, 222, 150, 222], pivot: [542.0, 444] },
      { bounds: [709, 222, 157, 222], pivot: [760.5, 444] },
      { bounds: [943, 225, 166, 219], pivot: [1015.875, 444] },
      { bounds: [1109, 226, 216, 213], pivot: [1222.375, 439] },
      { bounds: [1375, 226, 174, 218], pivot: [1445.375, 444] },
      { bounds: [1589, 223, 173, 221], pivot: [1668.875, 444] },
      { bounds: [35, 444, 184, 221], pivot: [121.625, 665] },
      { bounds: [250, 444, 179, 221], pivot: [335.125, 665] },
      { bounds: [471, 444, 175, 221], pivot: [548.625, 665] },
      { bounds: [694, 444, 169, 221], pivot: [768.625, 665] },
      { bounds: [923, 444, 180, 221], pivot: [1008.0, 665] },
      { bounds: [1152, 447, 178, 218], pivot: [1232.5, 665] },
      { bounds: [1366, 444, 179, 221], pivot: [1451.5, 665] },
      { bounds: [1595, 444, 168, 221], pivot: [1678.0, 665] },
      { bounds: [29, 665, 181, 209], pivot: [130.125, 874] },
      { bounds: [248, 665, 175, 210], pivot: [341.625, 875] },
      { bounds: [458, 665, 182, 210], pivot: [561.125, 875] },
      { bounds: [684, 665, 176, 208], pivot: [778.625, 873] },
      { bounds: [904, 665, 176, 208], pivot: [1016.875, 873] },
      { bounds: [1121, 665, 168, 207], pivot: [1228.875, 872] },
      { bounds: [1342, 665, 169, 204], pivot: [1451.875, 869] },
      { bounds: [1562, 665, 177, 204], pivot: [1672.375, 869] },
    ],
  },
  "kai-mangueira": {
    file: "kai-mangueira.webp",
    width: 1774,
    height: 887,
    referenceHeight: 214.5,
    frames: [
      { bounds: [21, 10, 190, 211], pivot: [118.625, 221] },
      { bounds: [250, 8, 182, 211], pivot: [339.625, 219] },
      { bounds: [456, 7, 188, 213], pivot: [553.125, 220] },
      { bounds: [681, 9, 188, 211], pivot: [781.125, 220] },
      { bounds: [911, 9, 176, 213], pivot: [989.125, 222] },
      { bounds: [1129, 8, 178, 214], pivot: [1209.625, 222] },
      { bounds: [1352, 6, 171, 216], pivot: [1429.125, 222] },
      { bounds: [1568, 7, 174, 215], pivot: [1650.625, 222] },
      { bounds: [23, 224, 160, 212], pivot: [93.875, 436] },
      { bounds: [248, 224, 154, 217], pivot: [313.375, 441] },
      { bounds: [471, 224, 152, 220], pivot: [537.375, 444] },
      { bounds: [690, 224, 155, 220], pivot: [758.875, 444] },
      { bounds: [916, 225, 189, 219], pivot: [1007.5, 444] },
      { bounds: [1131, 226, 182, 212], pivot: [1219.5, 438] },
      { bounds: [1359, 222, 190, 222], pivot: [1448.0, 444] },
      { bounds: [1582, 222, 181, 222], pivot: [1670.0, 444] },
      { bounds: [14, 444, 193, 221], pivot: [111.5, 665] },
      { bounds: [233, 444, 194, 221], pivot: [330.5, 665] },
      { bounds: [454, 444, 193, 221], pivot: [551.0, 665] },
      { bounds: [674, 444, 194, 221], pivot: [771.5, 665] },
      { bounds: [912, 444, 183, 221], pivot: [1004.5, 665] },
      { bounds: [1135, 444, 192, 221], pivot: [1222.0, 665] },
      { bounds: [1358, 444, 192, 221], pivot: [1442.5, 665] },
      { bounds: [1581, 444, 183, 221], pivot: [1666.0, 665] },
      { bounds: [22, 665, 177, 214], pivot: [123.625, 879] },
      { bounds: [240, 665, 176, 214], pivot: [336.125, 879] },
      { bounds: [461, 665, 178, 213], pivot: [560.625, 878] },
      { bounds: [682, 665, 185, 214], pivot: [784.125, 879] },
      { bounds: [904, 665, 175, 213], pivot: [1007.25, 878] },
      { bounds: [1119, 665, 178, 213], pivot: [1228.25, 878] },
      { bounds: [1340, 665, 178, 213], pivot: [1449.25, 878] },
      { bounds: [1563, 665, 177, 213], pivot: [1671.25, 878] },
    ],
  },
  flora: {
    file: "flora.webp",
    width: 1254,
    height: 1254,
    referenceHeight: 298.5,
    frames: [
      { bounds: [37, 21, 277, 293], pivot: [175.5, 314] },
      { bounds: [314, 54, 313, 260], pivot: [470.5, 314] },
      { bounds: [627, 111, 313, 203], pivot: [783.5, 314] },
      { bounds: [940, 110, 296, 204], pivot: [1088.0, 314] },
      { bounds: [39, 314, 272, 313], pivot: [175.0, 627] },
      { bounds: [315, 314, 312, 313], pivot: [471.0, 627] },
      { bounds: [627, 314, 313, 313], pivot: [783.5, 627] },
      { bounds: [940, 314, 302, 313], pivot: [1091.0, 627] },
      { bounds: [32, 627, 282, 312], pivot: [173.0, 939] },
      { bounds: [314, 627, 313, 304], pivot: [470.5, 931] },
      { bounds: [627, 627, 280, 313], pivot: [767.0, 940] },
      { bounds: [991, 627, 222, 313], pivot: [1102.0, 940] },
      { bounds: [38, 972, 211, 247], pivot: [143.5, 1219] },
      { bounds: [352, 970, 275, 249], pivot: [489.5, 1219] },
      { bounds: [627, 940, 305, 274], pivot: [779.5, 1214] },
      { bounds: [941, 940, 303, 277], pivot: [1092.5, 1217] },
    ],
  },
  fogo: {
    file: "fogo.webp",
    width: 1774,
    height: 887,
    referenceHeight: 393.0,
    frames: [
      { bounds: [58, 40, 373, 383], pivot: [244.5, 423] },
      { bounds: [510, 16, 365, 407], pivot: [692.5, 423] },
      { bounds: [936, 31, 368, 392], pivot: [1120.0, 423] },
      { bounds: [1383, 30, 360, 393], pivot: [1563.0, 423] },
      { bounds: [57, 463, 379, 393], pivot: [246.5, 856] },
      { bounds: [505, 461, 369, 396], pivot: [689.5, 857] },
      { bounds: [941, 472, 365, 385], pivot: [1123.5, 857] },
      { bounds: [1379, 453, 366, 402], pivot: [1562.0, 855] },
    ],
  },
};


;/* jogo/vida-natural/vida.js */
"use strict";
(() => {
  const base = new URL("./assets/", ({src:new URL("../vida-natural/vida.js?v=renascer-1",document.baseURI).href}).src);
  const original = window.GuardiaoArteManifesto;
  // The new paintings preserve the geography and the original source files.
  for (const [source, target] of [
    [
      "jogo/floresta-viva/revisao/assets/floresta-ilustrada.png",
      "floresta-inicio",
    ],
    [
      "jogo/floresta-viva/revisao/assets/floresta-restaurada.png",
      "floresta-restaurado",
    ],
    ...["rio", "fauna", "plantio", "cidade"].flatMap((name) => [
      [`jogo/jornada/assets/mapa-${name}.png`, name + "-inicio"],
      [`jogo/jornada/assets/mapa-${name}-restaurado.png`, name + "-restaurado"],
    ]),
  ])
    original[source] = `jogo/vida-natural/assets/${target}.webp`;

  class NatureLife {
    constructor(phase) {
      this.phase = phase;
      this.rebirth = window.GuardiaoRenascimento
        ? new window.GuardiaoRenascimento(phase)
        : null;
      this.water =
        phase === 1 && window.GuardiaoAgua ? new window.GuardiaoAgua() : null;
      this.images = new Map();
      this.trails = [];
      this.lastStep = 0;
      this.patches = new Map();
      this.treeFades = new Map();
    }
    async load(onProgress = () => {}) {
      const names = [
        "kai-andando",
        "flora",
        ...(this.phase === 1 ? ["kai-mangueira", "fogo"] : []),
      ];
      await Promise.all(
        names.map(async (name) => {
          const d = window.GuardiaoVidaAtlas[name],
            im = new Image();
          im.src = new URL(d.file, base).href;
          await im.decode();
          if (im.naturalWidth !== d.width || im.naturalHeight !== d.height)
            throw Error("Arte natural inválida: " + name);
          this.images.set(name, im);
          onProgress();
        }),
      );
      if (this.water) await this.water.load();
      if (this.rebirth) await this.rebirth.load();
      this.canopyShadow = new Image();
      this.canopyShadow.src = new URL("sombra-copa.svg", base).href;
      await this.canopyShadow.decode();
      onProgress();
    }
    draw(ctx, name, index, x, y, height, { flip = false, angle = 0 } = {}) {
      const sheet = window.GuardiaoVidaAtlas[name],
        image = this.images.get(name);
      if (!sheet || !image) return;
      const frame = sheet.frames[index % sheet.frames.length],
        b = frame.bounds;
      const scale = height / sheet.referenceHeight;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      if (flip) ctx.scale(-1, 1);
      ctx.drawImage(
        image,
        ...b,
        (b[0] - frame.pivot[0]) * scale,
        (b[1] - frame.pivot[1]) * scale,
        b[2] * scale,
        b[3] * scale,
      );
      ctx.restore();
    }
    walk(ctx, player, time, reduced, equipped = false, height = 63) {
      const frame =
        player.direction * 4 + (Math.floor(player.distance / 14) % 4);
      this.draw(
        ctx,
        equipped ? "kai-mangueira" : "kai-andando",
        frame,
        player.x,
        player.y -
          (reduced
            ? 0
            : Math.abs(Math.sin((player.distance * Math.PI) / 28)) * 0.7),
        height,
      );
      document.body.dataset.motionFrame = String(frame);
    }
    flora(ctx, flora, player, time, reduced) {
      let frame,
        height = 42;
      if (flora.mode === "ombro") {
        frame = !reduced && time % 4.8 > 4.55 ? 13 : 12;
        height = 30;
      } else if (flora.mode === "pousando") {
        frame =
          8 +
          Math.min(
            3,
            Math.floor((flora.elapsed / (this.phase === 1 ? 0.45 : 0.65)) * 4),
          );
        height = 36;
      } else if (flora.mode === "decolando") {
        frame = 11 - Math.min(3, Math.floor((flora.elapsed / 0.3) * 4));
        height = 36 + Math.min(1, flora.elapsed / 0.3) * 6;
      } else if (flora.mode === "comemorando") {
        frame = reduced ? 14 : 14 + (Math.floor(time * 5) % 2);
        height = 46;
      } else frame = reduced ? 2 : Math.floor(time * 14) % 8;
      this.draw(
        ctx,
        "flora",
        frame,
        flora.x,
        flora.y +
          (reduced || flora.mode === "ombro" ? 0 : Math.sin(time * 5) * 1.2),
        height,
        { flip: player.direction >= 3 && player.direction <= 5 },
      );
      document.body.dataset.floraFrame = String(frame);
    }
    ground(ctx, player, time, reduced, swimming = false) {
      this.player = player;
      if (reduced) {
        this.trails.length = 0;
        this.lastStep = player.distance;
        return;
      }
      if (this.canopyShadow) {
        for (const [x, y, size] of [
          [225, 390, 170],
          [875, 345, 210],
          [1060, 595, 160],
        ]) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(Math.sin(time * 0.7 + x) * 0.025);
          ctx.drawImage(
            this.canopyShadow,
            -size / 2,
            -size * 0.28,
            size,
            size * 0.65,
          );
          ctx.restore();
        }
      }
      if (player.moving && player.distance - this.lastStep > 14) {
        this.lastStep = player.distance;
        this.trails.push({
          x: player.x,
          y: player.y,
          time,
          swimming,
          side: this.trails.length % 2 ? 1 : -1,
        });
        if (this.trails.length > 24) this.trails.shift();
      }
      this.trails = this.trails.filter((p) => time - p.time < 0.8);
      for (const p of this.trails) {
        const age = (time - p.time) / 0.8;
        ctx.save();
        ctx.globalAlpha = (1 - age) * (p.swimming ? 0.6 : 0.17);
        if (p.swimming) {
          ctx.strokeStyle = "#e0fbff";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, 9 + age * 16, 3 + age * 5, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = "#9e7850";
          ctx.beginPath();
          ctx.ellipse(
            p.x + p.side * 4,
            p.y,
            2.2 + age,
            1.2,
            -0.4 * p.side,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
        ctx.restore();
      }
      // Sparse drifting pollen, without covering the path or the mission markers.
      for (let i = 0; i < 16; i++) {
        const x = (i * 173.3 + time * (3 + (i % 3))) % 1280;
        const y = (i * 97.7 + Math.sin(time * 0.4 + i) * 16 + 720) % 720;
        ctx.fillStyle = `rgba(255,244,180,${0.25 + Math.sin(time + i) * 0.12})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    fire(ctx, f, time, reduced) {
      if (!f.life) return;
      const glow = ctx.createRadialGradient(
        f.x,
        f.y - 12,
        3,
        f.x,
        f.y - 12,
        51,
      );
      glow.addColorStop(0, "#ffb03c44");
      glow.addColorStop(1, "#ffb03c00");
      ctx.fillStyle = glow;
      ctx.fillRect(f.x - 51, f.y - 63, 102, 102);
      this.draw(
        ctx,
        "fogo",
        reduced ? 0 : (Math.floor(time * 13) + f.id * 3) % 8,
        f.x,
        f.y,
        76 * (0.6 + f.life * 0.4),
      );
      if (reduced) return;
      for (let j = 0; j < 4; j++) {
        const age = (time * 0.55 + j * 0.25 + f.id * 0.13) % 1;
        ctx.fillStyle = `rgba(255,198,82,${(1 - age) * 0.7})`;
        ctx.beginPath();
        ctx.arc(
          f.x + Math.sin(j * 7 + time) * (6 + age * 10),
          f.y - 28 - age * 65,
          1.3 * (1 - age),
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
    jet(ctx, from, to, time, reduced, options) {
      return this.water?.draw(ctx, from, to, time, reduced, options) ?? -1;
    }
    recovery(ctx, objectives, time, reduced) {
      if (reduced) return;
      for (const p of objectives) {
        const age = time - p.restoredAt;
        if (!(age >= 0 && age < 2.8)) continue;
        ctx.save();
        ctx.globalAlpha = Math.min(1, age * 3) * (1 - age / 2.8);
        ctx.strokeStyle = "#d7efb1";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(
          p.x,
          p.y - 4,
          20 + age * 31,
          8 + age * 12,
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
        for (let j = 0; j < 7; j++) {
          const a = (j * Math.PI * 2) / 7 + age * 0.4;
          ctx.fillStyle = j % 2 ? "#fff1a3" : "#afdc70";
          ctx.beginPath();
          ctx.ellipse(
            p.x + Math.cos(a) * age * 20,
            p.y - 15 - age * 16 + Math.sin(a) * age * 9,
            3,
            1.5,
            a,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
        ctx.restore();
      }
    }
    restore(ctx, healthy, objectives, time, reduced) {
      this.rebirth?.update(objectives);
      for (const p of objectives) {
        const key = p.x + ":" + p.y;
        const rx = p.rx || 95,
          ry = p.ry || 85,
          y = p.y - 15;
        if (!this.patches.has(key)) {
          const patch = document.createElement("canvas");
          patch.width = Math.ceil(rx * 2);
          patch.height = Math.ceil(ry * 2);
          const c = patch.getContext("2d");
          const sx = healthy.naturalWidth / 1280,
            sy = healthy.naturalHeight / 720;
          c.drawImage(
            healthy,
            (p.x - rx) * sx,
            (y - ry) * sy,
            rx * 2 * sx,
            ry * 2 * sy,
            0,
            0,
            rx * 2,
            ry * 2,
          );
          c.globalCompositeOperation = "destination-in";
          c.translate(rx, ry);
          c.scale(rx, ry);
          const fade = c.createRadialGradient(0, 0, 0.65, 0, 0, 1);
          fade.addColorStop(0, "#fff");
          fade.addColorStop(1, "#fff0");
          c.fillStyle = fade;
          c.fillRect(-1, -1, 2, 2);
          this.patches.set(key, patch);
        }
        const progress = reduced
          ? 1
          : Math.min(1, Math.max(0, (time - (p.restoredAt ?? -3)) / 2.5));
        ctx.save();
        ctx.globalAlpha = 1 - (1 - progress) ** 3;
        ctx.drawImage(this.patches.get(key), p.x - rx, y - ry, rx * 2, ry * 2);
        ctx.restore();
      }
    }
    treeOpacity(tree, time, reduced) {
      const p = this.player;
      if (!p) return 1;
      const under =
        p.y < tree.y - 8 &&
        p.y > tree.y - tree.h * 0.75 &&
        Math.abs(p.x - tree.x) < tree.h * 0.3;
      const target = under ? 0.35 : 1;
      const state = this.treeFades.get(tree) || { value: 1, time };
      state.value +=
        (target - state.value) *
        (reduced ? 1 : 1 - Math.exp(-Math.max(0, time - state.time) * 9));
      state.time = time;
      this.treeFades.set(tree, state);
      return state.value;
    }
  }
  window.GuardiaoVidaNatural = NatureLife;
})();


;/* tela-inicial/renascimento/atlas.js */
window.GuardiaoRenascimentoAtlas = {
  equipe: {
    file: "tela-inicial/renascimento/assets/renascimento-equipe.webp",
    width: 1520,
    height: 1140,
    referenceHeight: 352.0,
    frames: [
      { bounds: [26, 16, 329, 352], pivot: [190.5, 368] },
      { bounds: [406, 16, 329, 352], pivot: [570.5, 368] },
      { bounds: [784, 12, 332, 356], pivot: [950.0, 368] },
      { bounds: [1166, 16, 328, 352], pivot: [1330.0, 368] },
      { bounds: [12, 398, 355, 350], pivot: [189.5, 748] },
      { bounds: [392, 398, 356, 350], pivot: [570.0, 748] },
      { bounds: [773, 398, 354, 350], pivot: [950.0, 748] },
      { bounds: [1154, 397, 352, 351], pivot: [1330.0, 748] },
      { bounds: [12, 772, 356, 356], pivot: [190.0, 1128] },
      { bounds: [392, 772, 355, 356], pivot: [569.5, 1128] },
      { bounds: [772, 772, 355, 356], pivot: [949.5, 1128] },
      { bounds: [1153, 772, 354, 356], pivot: [1330.0, 1128] },
    ],
  },
  arvores: {
    file: "jogo/renascimento/assets/renascimento-arvores.webp",
    width: 3232,
    height: 640,
    referenceHeight: 577.0,
    frames: [
      { bounds: [14, 13, 781, 615], pivot: [404.5, 628] },
      { bounds: [992, 15, 441, 613], pivot: [1212.5, 628] },
      { bounds: [1712, 122, 617, 506], pivot: [2020.5, 628] },
      { bounds: [2544, 87, 569, 541], pivot: [2828.5, 628] },
    ],
  },
};


;/* jogo/renascimento/ambiente.js */
"use strict";
(() => {
  const root = new URL("../../", ({src:new URL("../renascimento/ambiente.js?v=renascer-1",document.baseURI).href}).src),
    manifest = window.GuardiaoArteManifesto;
  for (const name of ["floresta", "rio", "fauna", "plantio", "cidade"]) {
    const original =
      name === "floresta"
        ? "jogo/floresta-viva/revisao/assets/floresta-ilustrada.png"
        : `jogo/jornada/assets/mapa-${name}.png`;
    manifest[original] = `jogo/renascimento/assets/${name}.webp`;
  }
  class Rebirth {
    constructor(phase) {
      this.phase = phase;
      this.objectives = [];
      this.complete = false;
      this.fullAt = null;
      this.saved = false;
      try {
        this.saved =
          JSON.parse(
            localStorage.getItem(
              phase === 1
                ? "guardiao.floresta-viva.v2"
                : `guardiao.jornada.fase.${phase}.v1`,
            ) || "null",
          )?.completed === true;
      } catch {}
    }
    async load() {
      const d = window.GuardiaoRenascimentoAtlas.arvores;
      this.sheet = d;
      this.dead = new Image();
      this.dead.src = new URL(d.file, root).href;
      try {
        await this.dead.decode();
      } catch {
        this.dead = null;
      }
    }
    update(objectives) {
      this.objectives = objectives;
    }
    recovery(tree, time, reduced) {
      if (this.complete) return 1;
      const near = this.objectives.filter(
        (p) => Math.hypot(p.x - tree.x, p.y - tree.y) < 190,
      );
      if (!near.length) return 0;
      return reduced
        ? 1
        : Math.max(
            ...near.map((p) =>
              Math.max(0, Math.min(1, (time - (p.restoredAt ?? -4)) / 2.5)),
            ),
          );
    }
    ashLeaf(ctx, x, y, size, angle) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = "#ab8055";
      ctx.globalAlpha *= 0.65;
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.45, size * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#6b5543";
      ctx.lineWidth = 0.65;
      ctx.beginPath();
      ctx.moveTo(-size * 0.45, 0);
      ctx.lineTo(size * 0.55, 0);
      ctx.stroke();
      ctx.restore();
    }
    drawDead(ctx, tree) {
      if (!this.dead) return;
      const s = this.sheet,
        f = s.frames[(tree.frame || 0) % s.frames.length],
        b = f.bounds,
        k = tree.h / s.referenceHeight;
      ctx.drawImage(
        this.dead,
        ...b,
        (b[0] - f.pivot[0]) * k,
        (b[1] - f.pivot[1]) * k,
        b[2] * k,
        b[3] * k,
      );
    }
    full(ctx, healthy, reduced, completed) {
      this.complete = completed;
      if (!completed) return;
      if (this.fullAt === null) this.fullAt = performance.now();
      const progress =
        reduced || this.saved
          ? 1
          : Math.min(1, (performance.now() - this.fullAt) / 2100);
      ctx.save();
      ctx.globalAlpha = progress;
      ctx.drawImage(healthy, 0, 0, 1280, 720);
      ctx.restore();
    }
  }
  window.GuardiaoRenascimento = Rebirth;
})();


;/* jogo/jornada/atlas.js */
window.GuardiaoCampanhaAtlas={"icones":{"file":"assets/icones.png","width":1448,"height":1086,"referenceHeight":248.5,"frames":[{"bounds":[101,11,243,254],"pivot":[181.0,265]},{"bounds":[428,8,257,259],"pivot":[543.0,267]},{"bounds":[768,35,260,232],"pivot":[905.0,267]},{"bounds":[1137,6,224,263],"pivot":[1267.0,269]},{"bounds":[71,291,275,247],"pivot":[181.0,538]},{"bounds":[406,275,237,266],"pivot":[543.0,541]},{"bounds":[749,310,337,214],"pivot":[905.0,524]},{"bounds":[1086,302,300,233],"pivot":[1267.0,535]},{"bounds":[43,556,295,258],"pivot":[181.0,814]},{"bounds":[381,553,324,243],"pivot":[543.0,796]},{"bounds":[764,555,269,259],"pivot":[905.0,814]},{"bounds":[1110,547,276,261],"pivot":[1267.0,808]},{"bounds":[44,814,290,249],"pivot":[181.0,1063]},{"bounds":[402,817,294,245],"pivot":[543.0,1062]},{"bounds":[754,814,296,248],"pivot":[905.0,1062]},{"bounds":[1120,818,269,231],"pivot":[1267.0,1049]}]},"kai-livre":{"file":"assets/kai-livre.png","width":1261,"height":1247,"referenceHeight":311.0,"frames":[{"bounds":[55,1,245,311],"pivot":[157.5,312]},{"bounds":[367,1,239,311],"pivot":[472.5,312]},{"bounds":[680,1,229,311],"pivot":[788.0,312]},{"bounds":[995,1,218,311],"pivot":[1103.5,312]},{"bounds":[77,312,200,312],"pivot":[157.5,624]},{"bounds":[391,312,201,312],"pivot":[472.5,624]},{"bounds":[711,312,229,312],"pivot":[788.0,624]},{"bounds":[1026,312,218,312],"pivot":[1103.5,624]},{"bounds":[45,624,249,311],"pivot":[157.5,935]},{"bounds":[362,624,247,311],"pivot":[472.5,935]},{"bounds":[693,624,233,311],"pivot":[788.0,935]},{"bounds":[995,624,241,311],"pivot":[1103.5,935]},{"bounds":[42,935,240,301],"pivot":[157.5,1236]},{"bounds":[370,935,222,301],"pivot":[472.5,1236]},{"bounds":[661,935,234,300],"pivot":[788.0,1235]},{"bounds":[978,935,221,299],"pivot":[1103.5,1234]}]},"kai-nadando":{"file":"assets/kai-nadando.png","width":1341,"height":1173,"referenceHeight":256.5,"frames":[{"bounds":[20,16,315,253],"pivot":[167.5,269]},{"bounds":[368,16,302,256],"pivot":[502.5,272]},{"bounds":[670,586,328,294],"pivot":[838.0,880]},{"bounds":[1036,586,273,294],"pivot":[1173.5,880]},{"bounds":[16,880,311,252],"pivot":[167.5,1132]},{"bounds":[362,880,292,252],"pivot":[502.5,1132]},{"bounds":[670,586,328,294],"pivot":[838.0,880],"flip":true},{"bounds":[1036,586,273,294],"pivot":[1173.5,880],"flip":true},{"bounds":[45,589,290,291],"pivot":[167.5,880]},{"bounds":[335,586,335,294],"pivot":[502.5,880]},{"bounds":[706,21,299,254],"pivot":[838.0,275],"flip":true},{"bounds":[1037,19,287,257],"pivot":[1173.5,276],"flip":true},{"bounds":[29,305,293,246],"pivot":[167.5,551]},{"bounds":[371,304,279,246],"pivot":[502.5,550]},{"bounds":[706,21,299,254],"pivot":[838.0,275]},{"bounds":[1037,19,287,257],"pivot":[1173.5,276]}]},"kai-rio":{"file":"assets/kai-rio.png","width":1448,"height":1086,"referenceHeight":358.0,"frames":[{"bounds":[17,3,345,359],"pivot":[181.0,362]},{"bounds":[362,47,362,315],"pivot":[543.0,362]},{"bounds":[724,2,322,360],"pivot":[905.0,362]},{"bounds":[1129,5,290,357],"pivot":[1267.0,362]},{"bounds":[11,362,351,362],"pivot":[181.0,724]},{"bounds":[362,362,362,362],"pivot":[543.0,724]},{"bounds":[724,362,322,362],"pivot":[905.0,724]},{"bounds":[1114,362,308,362],"pivot":[1267.0,724]},{"bounds":[11,724,351,316],"pivot":[181.0,1040]},{"bounds":[362,724,357,323],"pivot":[543.0,1047]},{"bounds":[727,724,359,323],"pivot":[905.0,1047]},{"bounds":[1086,724,321,332],"pivot":[1267.0,1056]}]},"kai-floresta":{"file":"assets/kai-floresta.png","width":1448,"height":1086,"referenceHeight":355.0,"frames":[{"bounds":[55,8,297,354],"pivot":[181.0,362]},{"bounds":[403,7,263,355],"pivot":[543.0,362]},{"bounds":[769,7,289,355],"pivot":[905.0,362]},{"bounds":[1133,6,256,356],"pivot":[1267.0,362]},{"bounds":[58,362,304,362],"pivot":[181.0,724]},{"bounds":[415,362,302,362],"pivot":[543.0,724]},{"bounds":[777,362,305,362],"pivot":[905.0,724]},{"bounds":[1141,362,263,362],"pivot":[1267.0,724]},{"bounds":[61,724,301,346],"pivot":[181.0,1070]},{"bounds":[362,724,321,337],"pivot":[543.0,1061]},{"bounds":[729,724,349,340],"pivot":[905.0,1064]},{"bounds":[1118,724,278,349],"pivot":[1267.0,1073]}]},"kai-plantio":{"file":"assets/kai-plantio.png","width":1448,"height":1086,"referenceHeight":346.5,"frames":[{"bounds":[18,9,314,353],"pivot":[181.0,362]},{"bounds":[382,11,300,351],"pivot":[543.0,362]},{"bounds":[735,30,319,332],"pivot":[905.0,362]},{"bounds":[1109,20,316,342],"pivot":[1267.0,362]},{"bounds":[33,362,299,362],"pivot":[181.0,724]},{"bounds":[363,362,361,348],"pivot":[543.0,710]},{"bounds":[724,362,358,350],"pivot":[905.0,712]},{"bounds":[1134,362,290,362],"pivot":[1267.0,724]},{"bounds":[14,724,325,345],"pivot":[181.0,1069]},{"bounds":[386,742,338,315],"pivot":[543.0,1057]},{"bounds":[724,745,362,319],"pivot":[905.0,1064]},{"bounds":[1086,724,356,344],"pivot":[1267.0,1068]}]},"animais-rio":{"file":"assets/animais-rio.png","width":1536,"height":1024,"referenceHeight":215.0,"frames":[{"bounds":[39,34,308,219],"pivot":[192.0,253]},{"bounds":[421,34,310,219],"pivot":[576.0,253]},{"bounds":[797,28,313,225],"pivot":[960.0,253]},{"bounds":[1178,24,322,229],"pivot":[1344.0,253]},{"bounds":[35,310,337,173],"pivot":[192.0,483]},{"bounds":[418,276,347,172],"pivot":[576.0,448]},{"bounds":[794,315,346,165],"pivot":[960.0,480]},{"bounds":[1184,312,329,160],"pivot":[1344.0,472]},{"bounds":[71,512,283,235],"pivot":[192.0,747]},{"bounds":[454,514,291,227],"pivot":[576.0,741]},{"bounds":[842,513,284,228],"pivot":[960.0,741]},{"bounds":[1220,513,282,232],"pivot":[1344.0,745]},{"bounds":[39,778,327,206],"pivot":[192.0,984]},{"bounds":[429,777,317,211],"pivot":[576.0,988]},{"bounds":[807,777,336,207],"pivot":[960.0,984]},{"bounds":[1196,777,313,207],"pivot":[1344.0,984]}]},"animais-fauna":{"file":"assets/animais-fauna.png","width":1402,"height":1122,"referenceHeight":272.0,"frames":[{"bounds":[66,7,219,272],"pivot":[175.0,279]},{"bounds":[390,7,210,273],"pivot":[525.5,280]},{"bounds":[705,4,297,272],"pivot":[876.5,276]},{"bounds":[1085,10,302,260],"pivot":[1227.0,270]},{"bounds":[75,290,227,271],"pivot":[175.0,561]},{"bounds":[401,289,241,272],"pivot":[525.5,561]},{"bounds":[701,280,247,272],"pivot":[876.5,552]},{"bounds":[1075,293,312,268],"pivot":[1227.0,561]},{"bounds":[30,561,239,281],"pivot":[175.0,842]},{"bounds":[384,561,317,281],"pivot":[525.5,842]},{"bounds":[701,561,351,281],"pivot":[876.5,842]},{"bounds":[1052,561,332,281],"pivot":[1227.0,842]},{"bounds":[80,842,208,257],"pivot":[175.0,1099]},{"bounds":[392,842,204,256],"pivot":[525.5,1098]},{"bounds":[719,842,250,260],"pivot":[876.5,1102]},{"bounds":[1069,842,300,241],"pivot":[1227.0,1083]}]},"animais-fauna-andando":{"file":"assets/animais-fauna-andando.png","width":1402,"height":1122,"referenceHeight":255.5,"frames":[{"bounds":[47,24,299,256],"pivot":[175.0,280]},{"bounds":[350,25,320,255],"pivot":[525.5,280]},{"bounds":[706,25,324,255],"pivot":[876.5,280]},{"bounds":[1069,28,304,252],"pivot":[1227.0,280]},{"bounds":[46,301,304,260],"pivot":[175.0,561]},{"bounds":[350,280,342,281],"pivot":[525.5,561]},{"bounds":[732,280,305,281],"pivot":[876.5,561]},{"bounds":[1073,280,310,281],"pivot":[1227.0,561]},{"bounds":[20,561,330,281],"pivot":[175.0,842]},{"bounds":[350,587,351,224],"pivot":[525.5,811]},{"bounds":[701,561,351,268],"pivot":[876.5,829]},{"bounds":[1052,576,332,266],"pivot":[1227.0,842]},{"bounds":[32,842,304,240],"pivot":[175.0,1082]},{"bounds":[375,849,317,234],"pivot":[525.5,1083]},{"bounds":[723,879,329,192],"pivot":[876.5,1071]},{"bounds":[1052,842,332,241],"pivot":[1227.0,1083]}]},"objetos":{"file":"assets/objetos.png","width":1295,"height":1214,"referenceHeight":265.0,"frames":[{"bounds":[46,91,261,156],"pivot":[162.0,247]},{"bounds":[384,53,214,201],"pivot":[486.0,254]},{"bounds":[692,77,229,168],"pivot":[809.5,245]},{"bounds":[996,52,269,198],"pivot":[1133.0,250]},{"bounds":[33,305,270,302],"pivot":[162.0,607]},{"bounds":[339,305,309,302],"pivot":[486.0,607]},{"bounds":[648,304,291,253],"pivot":[809.5,557]},{"bounds":[1007,305,254,302],"pivot":[1133.0,607]},{"bounds":[39,607,258,303],"pivot":[162.0,910]},{"bounds":[363,607,258,303],"pivot":[486.0,910]},{"bounds":[685,607,252,303],"pivot":[809.5,910]},{"bounds":[1007,607,275,268],"pivot":[1133.0,875]},{"bounds":[28,910,296,262],"pivot":[162.0,1172]},{"bounds":[324,910,293,262],"pivot":[486.0,1172]},{"bounds":[688,910,253,269],"pivot":[809.5,1179]},{"bounds":[1001,918,256,244],"pivot":[1133.0,1162]}]},"recompensa-azul":{"file":"assets/recompensa-azul.png","width":1774,"height":887,"referenceHeight":424.5,"frames":[{"bounds":[44,14,337,430],"pivot":[222.0,444]},{"bounds":[500,14,292,416],"pivot":[665.5,430]},{"bounds":[946,14,312,417],"pivot":[1108.5,431]},{"bounds":[1412,4,289,440],"pivot":[1552.0,444]},{"bounds":[57,444,347,429],"pivot":[222.0,873]},{"bounds":[484,448,341,425],"pivot":[665.5,873]},{"bounds":[923,448,382,424],"pivot":[1108.5,872]},{"bounds":[1380,444,365,402],"pivot":[1552.0,846]}]},"recompensa-amarelo":{"file":"assets/recompensa-amarelo.png","width":1774,"height":887,"referenceHeight":423.5,"frames":[{"bounds":[45,14,336,430],"pivot":[222.0,444]},{"bounds":[500,14,292,416],"pivot":[665.5,430]},{"bounds":[947,14,311,417],"pivot":[1108.5,431]},{"bounds":[1412,4,289,440],"pivot":[1552.0,444]},{"bounds":[58,444,346,429],"pivot":[222.0,873]},{"bounds":[484,448,341,424],"pivot":[665.5,872]},{"bounds":[924,449,380,423],"pivot":[1108.5,872]},{"bounds":[1380,444,365,402],"pivot":[1552.0,846]}]},"recompensa-verde":{"file":"assets/recompensa-verde.png","width":1774,"height":887,"referenceHeight":428.0,"frames":[{"bounds":[43,11,339,433],"pivot":[222.0,444]},{"bounds":[497,11,296,420],"pivot":[665.5,431]},{"bounds":[942,13,318,419],"pivot":[1108.5,432]},{"bounds":[1410,1,294,443],"pivot":[1552.0,444]},{"bounds":[55,444,350,430],"pivot":[222.0,874]},{"bounds":[483,445,341,429],"pivot":[665.5,874]},{"bounds":[922,447,384,427],"pivot":[1108.5,874]},{"bounds":[1378,444,369,404],"pivot":[1552.0,848]}]},"recompensa-violeta":{"file":"assets/recompensa-violeta.png","width":1774,"height":887,"referenceHeight":424.0,"frames":[{"bounds":[45,14,336,430],"pivot":[222.0,444]},{"bounds":[500,14,292,416],"pivot":[665.5,430]},{"bounds":[946,14,312,417],"pivot":[1108.5,431]},{"bounds":[1412,3,289,441],"pivot":[1552.0,444]},{"bounds":[57,444,347,428],"pivot":[222.0,872]},{"bounds":[484,448,341,425],"pivot":[665.5,873]},{"bounds":[923,449,382,423],"pivot":[1108.5,872]},{"bounds":[1380,444,365,402],"pivot":[1552.0,846]}]},"npcs":{"file":"../../tela-inicial/mapa-interativo/assets/01_npcs_dialogo.png","width":887,"height":1774,"referenceHeight":288.0,"frames":[{"bounds":[81,6,157,306],"pivot":[148.0,312]},{"bounds":[360,6,192,300],"pivot":[443.5,306]},{"bounds":[632,6,219,300],"pivot":[739.0,306]},{"bounds":[65,312,169,285],"pivot":[148.0,597]},{"bounds":[349,313,207,284],"pivot":[443.5,597]},{"bounds":[621,312,239,286],"pivot":[739.0,598]},{"bounds":[94,606,142,298],"pivot":[148.0,904]},{"bounds":[371,606,184,298],"pivot":[443.5,904]},{"bounds":[645,606,204,298],"pivot":[739.0,904]},{"bounds":[80,904,151,290],"pivot":[148.0,1194]},{"bounds":[358,904,199,290],"pivot":[443.5,1194]},{"bounds":[633,904,224,290],"pivot":[739.0,1194]},{"bounds":[92,1200,138,286],"pivot":[148.0,1486]},{"bounds":[368,1200,177,286],"pivot":[443.5,1486]},{"bounds":[643,1200,204,286],"pivot":[739.0,1486]},{"bounds":[85,1497,145,273],"pivot":[148.0,1770]},{"bounds":[365,1498,188,272],"pivot":[443.5,1770]},{"bounds":[639,1498,211,272],"pivot":[739.0,1770]}]}};


;/* jogo/vida-em-equilibrio/controles.js */
"use strict";
(() => {
  const key = "guardiao.horizonte.preferences.v1";
  const queries = [
    matchMedia("(pointer:coarse)"),
    matchMedia("(any-pointer:coarse)"),
  ];
  let prefs = {};
  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(key) || "{}") || {};
    } catch {
      return {};
    }
  };
  prefs = read();
  function detected() {
    // Tablets with a trackpad can report a fine primary pointer; their touch screen still matters.
    return queries.some((q) => q.matches) ||
      (navigator.maxTouchPoints > 0 &&
        Math.min(screen.width, screen.height) <= 1100)
      ? "touch"
      : "keyboard";
  }
  const mode = () =>
    ["touch", "keyboard"].includes(prefs.controlMode)
      ? prefs.controlMode
      : "auto";
  const effective = () => (mode() === "auto" ? detected() : mode());
  function apply() {
    document.body.dataset.controls = effective();
    document.body.dataset.detectedDevice = detected();
    document.body.classList.toggle("left-handed", prefs.leftHanded === true);
    document
      .querySelectorAll("[data-control-mode]")
      .forEach((el) => (el.value = mode()));
    document
      .querySelectorAll("[data-control-description]")
      .forEach(
        (el) =>
          (el.textContent =
            effective() === "touch"
              ? "Celular: joystick e botões de toque visíveis."
              : "Computador: use o teclado. Os botões de toque ficam ocultos."),
      );
    window.dispatchEvent(
      new CustomEvent("guardiao:controles", {
        detail: {
          mode: mode(),
          effective: effective(),
          preferences: { ...prefs },
        },
      }),
    );
  }
  function setMode(value) {
    if (!["auto", "touch", "keyboard"].includes(value)) return;
    prefs = { ...prefs, ...read(), controlMode: value };
    try {
      localStorage.setItem(key, JSON.stringify(prefs));
    } catch {}
    apply();
  }
  document.addEventListener("change", (e) => {
    if (e.target.matches("[data-control-mode]")) setMode(e.target.value);
  });
  window.addEventListener("storage", (e) => {
    if (e.key === key) {
      prefs = read();
      apply();
    }
  });
  queries.forEach((q) => q.addEventListener("change", apply));
  window.addEventListener("resize", apply);
  window.GuardiaoControles = Object.freeze({
    mode,
    effective,
    setMode,
    refresh: (overrides) => {
      prefs = { ...prefs, ...read(), ...overrides };
      apply();
    },
  });
  apply();
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


;/* jogo/floresta-viva/assets/atlas.js */
window.GuardiaoFlorestaAtlas={"version":1,"sheets":{"kai-mangueira":{"file":"kai-mangueira.png","width":1263,"height":1246,"referenceHeight":293.0,"frames":[{"bounds":[31,14,252,293],"pivot":[167.5,305]},{"bounds":[346,14,253,293],"pivot":[483.5,305]},{"bounds":[664,14,236,293],"pivot":[788.5,305]},{"bounds":[984,14,233,293],"pivot":[1104.0,305]},{"bounds":[57,319,201,298],"pivot":[160.0,615]},{"bounds":[368,319,207,298],"pivot":[476.5,615]},{"bounds":[664,324,253,293],"pivot":[774.0,615]},{"bounds":[980,324,253,293],"pivot":[1090.0,615]},{"bounds":[40,629,244,292],"pivot":[153.5,919]},{"bounds":[355,629,246,293],"pivot":[469.0,920]},{"bounds":[653,631,232,290],"pivot":[785.0,919]},{"bounds":[965,631,235,290],"pivot":[1100.5,919]},{"bounds":[48,928,219,291],"pivot":[166.0,1217]},{"bounds":[361,927,223,292],"pivot":[482.0,1217]},{"bounds":[661,934,225,288],"pivot":[789.0,1220]},{"bounds":[976,935,226,287],"pivot":[1105.0,1220]}]},"kai-caminhada":{"file":"kai-caminhada.png","width":1263,"height":1246,"referenceHeight":298.0,"frames":[{"bounds":[33,13,260,300],"pivot":[167.0,311]},{"bounds":[356,13,251,299],"pivot":[477.5,310]},{"bounds":[664,11,248,302],"pivot":[793.0,311]},{"bounds":[984,12,244,300],"pivot":[1103.5,310]},{"bounds":[58,320,216,301],"pivot":[170.0,619]},{"bounds":[374,320,213,301],"pivot":[486.0,619]},{"bounds":[683,324,242,297],"pivot":[790.0,619]},{"bounds":[998,324,242,297],"pivot":[1114.0,619]},{"bounds":[41,630,260,295],"pivot":[163.0,925]},{"bounds":[355,629,254,296],"pivot":[467.5,923]},{"bounds":[662,630,258,295],"pivot":[779.5,923]},{"bounds":[989,630,254,295],"pivot":[1098.5,925]},{"bounds":[42,931,231,300],"pivot":[186.0,1229]},{"bounds":[353,930,234,299],"pivot":[453.0,1227]},{"bounds":[658,933,237,297],"pivot":[814.0,1228]},{"bounds":[990,933,240,296],"pivot":[1138.5,1227]}]},"kai-repouso":{"file":"kai-repouso.png","width":1774,"height":887,"referenceHeight":420.5,"frames":[{"bounds":[94,11,286,426],"pivot":[277.0,435]},{"bounds":[501,10,286,427],"pivot":[684.0,435]},{"bounds":[961,10,274,426],"pivot":[1114.5,434]},{"bounds":[1380,10,273,425],"pivot":[1532.5,433]},{"bounds":[139,450,281,416],"pivot":[237.5,864]},{"bounds":[547,450,281,416],"pivot":[642.5,864]},{"bounds":[943,450,311,416],"pivot":[1100.0,864]},{"bounds":[1358,450,312,416],"pivot":[1514.5,864]}]},"kai-recompensa":{"file":"kai-recompensa.png","width":1774,"height":887,"referenceHeight":417.5,"frames":[{"bounds":[48,13,331,415],"pivot":[226.5,426]},{"bounds":[506,14,282,414],"pivot":[682.0,426]},{"bounds":[953,15,304,414],"pivot":[1126.5,427]},{"bounds":[1417,9,282,420],"pivot":[1585.0,427]},{"bounds":[63,437,335,435],"pivot":[233.0,870]},{"bounds":[492,448,323,424],"pivot":[675.5,870]},{"bounds":[930,449,368,423],"pivot":[1120.5,870]},{"bounds":[1385,440,357,404],"pivot":[1614.0,842]}]},"flora":{"file":"flora.png","width":1448,"height":1086,"referenceHeight":280.0,"frames":[{"bounds":[29,38,334,331],"pivot":[170.0,367]},{"bounds":[399,90,331,255],"pivot":[548.0,343]},{"bounds":[730,134,420,236],"pivot":[892.5,368]},{"bounds":[1150,124,288,283],"pivot":[1219.5,405]},{"bounds":[40,470,291,225],"pivot":[161.5,693]},{"bounds":[390,417,310,284],"pivot":[531.0,699]},{"bounds":[732,438,379,296],"pivot":[967.0,732]},{"bounds":[1146,521,281,224],"pivot":[1296.0,743]},{"bounds":[70,777,236,279],"pivot":[168.5,1054]},{"bounds":[405,775,228,281],"pivot":[502.5,1054]},{"bounds":[718,753,372,295],"pivot":[891.5,1046]},{"bounds":[1090,788,342,266],"pivot":[1261.0,1052]}]},"capivara":{"file":"capivara.png","width":1774,"height":887,"referenceHeight":264,"frames":[{"bounds":[80,163,322,264],"pivot":[268.5,425]},{"bounds":[541,165,303,262],"pivot":[701.5,425]},{"bounds":[965,108,326,321],"pivot":[1113.5,427]},{"bounds":[1376,115,345,317],"pivot":[1586.5,430]},{"bounds":[43,499,401,311],"pivot":[313.0,808]},{"bounds":[444,499,443,311],"pivot":[721.5,808]},{"bounds":[925,502,399,308],"pivot":[1194.5,808]},{"bounds":[1369,501,393,309],"pivot":[1519.5,808]}]},"cervo":{"file":"cervo.png","width":1774,"height":887,"referenceHeight":355,"frames":[{"bounds":[63,68,354,355],"pivot":[271.5,421]},{"bounds":[504,68,341,355],"pivot":[715.5,421]},{"bounds":[959,68,289,355],"pivot":[1100.0,421]},{"bounds":[1396,39,307,391],"pivot":[1570.0,428]},{"bounds":[84,462,316,383],"pivot":[199.5,843]},{"bounds":[515,467,321,370],"pivot":[688.0,835]},{"bounds":[954,464,326,379],"pivot":[1142.0,841]},{"bounds":[1375,468,352,363],"pivot":[1559.5,829]}]},"passaro":{"file":"passaro.png","width":1774,"height":887,"referenceHeight":260,"frames":[{"bounds":[81,138,328,259],"pivot":[221.0,395]},{"bounds":[538,138,309,260],"pivot":[659.0,396]},{"bounds":[944,135,358,270],"pivot":[1157.5,403]},{"bounds":[1419,119,323,286],"pivot":[1542.5,403]},{"bounds":[49,458,358,334],"pivot":[302.0,790]},{"bounds":[460,553,427,233],"pivot":[764.5,784]},{"bounds":[887,553,443,271],"pivot":[1275.0,822]},{"bounds":[1330,495,408,298],"pivot":[1629.0,791]}]},"carlos":{"file":"carlos.png","width":1774,"height":887,"referenceHeight":412.0,"frames":[{"bounds":[92,13,249,414],"pivot":[229.0,425]},{"bounds":[532,14,245,413],"pivot":[668.0,425]},{"bounds":[966,14,298,413],"pivot":[1100.0,425]},{"bounds":[1409,14,328,412],"pivot":[1541.5,424]},{"bounds":[97,450,237,412],"pivot":[228.5,860]},{"bounds":[530,450,310,412],"pivot":[665.0,860]},{"bounds":[976,450,279,412],"pivot":[1107.0,860]},{"bounds":[1415,450,324,412],"pivot":[1549.5,860]}]},"natureza":{"file":"natureza.png","width":1536,"height":1024,"referenceHeight":365.0,"frames":[{"bounds":[14,49,399,486],"pivot":[213.5,533]},{"bounds":[425,64,397,471],"pivot":[623.5,533]},{"bounds":[850,181,294,349],"pivot":[997.0,528]},{"bounds":[1144,177,373,358],"pivot":[1330.5,533]},{"bounds":[62,596,305,368],"pivot":[214.5,962]},{"bounds":[440,596,395,362],"pivot":[637.5,956]},{"bounds":[835,616,309,341],"pivot":[989.5,955]},{"bounds":[1144,583,369,392],"pivot":[1328.5,973]}]},"itens":{"file":"itens.png","width":1774,"height":887,"referenceHeight":300.0,"frames":[{"bounds":[50,128,374,385],"pivot":[237.0,511]},{"bounds":[499,144,383,348],"pivot":[690.5,490]},{"bounds":[998,89,236,431],"pivot":[1116.0,518]},{"bounds":[1352,95,380,417],"pivot":[1542.0,510]},{"bounds":[18,610,415,192],"pivot":[225.5,800]},{"bounds":[463,600,409,218],"pivot":[667.5,816]},{"bounds":[904,584,410,250],"pivot":[1109.0,832]},{"bounds":[1349,588,411,252],"pivot":[1554.5,838]}]}}};


;/* jogo/floresta-viva/revisao/atlas.js */
Object.assign(window.GuardiaoFlorestaAtlas.sheets,{"kai-recompensa":{"file":"../revisao/assets/kai-recompensa-vermelha.png","width":1774,"height":887,"referenceHeight":417.0,"frames":[{"bounds":[46,15,332,412],"pivot":[225.0,427]},{"bounds":[502,15,288,413],"pivot":[681.5,428]},{"bounds":[949,16,307,413],"pivot":[1127.5,429]},{"bounds":[1413,6,285,423],"pivot":[1585.0,429]},{"bounds":[59,436,343,434],"pivot":[233.5,870]},{"bounds":[486,448,337,423],"pivot":[675.0,871]},{"bounds":[925,450,378,421],"pivot":[1118.5,871]},{"bounds":[1381,441,362,403],"pivot":[1613.0,844]}]},"carlos":{"file":"../revisao/assets/carlos-vermelho.png","width":1774,"height":887,"referenceHeight":411.0,"frames":[{"bounds":[92,16,248,411],"pivot":[230.0,427]},{"bounds":[552,16,242,411],"pivot":[685.5,427]},{"bounds":[988,16,300,411],"pivot":[1120.0,427]},{"bounds":[1436,16,329,411],"pivot":[1569.5,427]},{"bounds":[95,452,239,410],"pivot":[227.5,862]},{"bounds":[536,451,317,411],"pivot":[671.5,862]},{"bounds":[983,451,287,411],"pivot":[1117.5,862]},{"bounds":[1435,451,323,411],"pivot":[1570.0,862]}]},"itens":{"file":"../revisao/assets/itens-vermelhos.png","width":1774,"height":887,"referenceHeight":313.5,"frames":[{"bounds":[41,118,388,400],"pivot":[235.0,518]},{"bounds":[500,135,387,362],"pivot":[693.5,497]},{"bounds":[887,86,351,436],"pivot":[1062.5,522]},{"bounds":[1344,92,388,420],"pivot":[1538.0,512]},{"bounds":[24,600,416,205],"pivot":[232.0,805]},{"bounds":[469,597,410,225],"pivot":[674.0,822]},{"bounds":[908,579,409,259],"pivot":[1112.5,838]},{"bounds":[1342,580,420,265],"pivot":[1552.0,845]}]},"kai-caminhada":{"file":"../revisao/assets/kai-caminhada-suave.png","width":1263,"height":1246,"referenceHeight":298.0,"frames":[{"bounds":[30,15,261,297],"pivot":[168.5,312]},{"bounds":[350,13,255,298],"pivot":[470.5,311]},{"bounds":[662,13,249,299],"pivot":[791.0,312]},{"bounds":[982,11,241,302],"pivot":[1099.5,313]},{"bounds":[58,322,215,298],"pivot":[170.0,620]},{"bounds":[372,321,215,299],"pivot":[485.0,620]},{"bounds":[683,326,242,296],"pivot":[786.0,622]},{"bounds":[999,313,238,307],"pivot":[1112.5,620]},{"bounds":[42,631,259,294],"pivot":[161.5,925]},{"bounds":[355,631,253,294],"pivot":[468.0,925]},{"bounds":[663,631,259,294],"pivot":[781.0,925]},{"bounds":[989,631,256,294],"pivot":[1095.5,925]},{"bounds":[35,925,240,303],"pivot":[187.0,1228]},{"bounds":[351,930,240,298],"pivot":[451.0,1228]},{"bounds":[658,931,239,297],"pivot":[813.5,1228]},{"bounds":[985,925,248,303],"pivot":[1139.5,1228]}]},"kai-mangueira":{"file":"../revisao/assets/kai-mangueira-suave.png","width":1263,"height":1246,"referenceHeight":296.0,"frames":[{"bounds":[14,10,271,298],"pivot":[164.0,308]},{"bounds":[333,10,275,298],"pivot":[484.0,308]},{"bounds":[656,11,246,296],"pivot":[789.0,307]},{"bounds":[971,10,256,297],"pivot":[1106.5,307]},{"bounds":[49,316,210,300],"pivot":[158.5,616]},{"bounds":[365,316,215,300],"pivot":[479.0,616]},{"bounds":[657,321,268,297],"pivot":[771.5,618]},{"bounds":[986,321,259,297],"pivot":[1091.0,618]},{"bounds":[31,624,264,296],"pivot":[149.5,920]},{"bounds":[353,625,258,295],"pivot":[469.5,920]},{"bounds":[639,626,249,296],"pivot":[784.5,922]},{"bounds":[953,626,251,296],"pivot":[1103.0,922]},{"bounds":[32,926,237,295],"pivot":[163.5,1221]},{"bounds":[352,926,239,295],"pivot":[484.0,1221]},{"bounds":[647,930,243,293],"pivot":[788.5,1223]},{"bounds":[967,929,247,295],"pivot":[1106.5,1224]}]},"kai-repouso":{"file":"../revisao/assets/kai-repouso-suave.png","width":1774,"height":887,"referenceHeight":425.0,"frames":[{"bounds":[91,9,282,427],"pivot":[275.5,436]},{"bounds":[506,11,288,425],"pivot":[695.0,436]},{"bounds":[969,8,286,430],"pivot":[1126.5,438]},{"bounds":[1414,10,284,428],"pivot":[1569.5,438]},{"bounds":[135,446,283,425],"pivot":[237.0,871]},{"bounds":[554,447,288,424],"pivot":[655.0,871]},{"bounds":[953,452,327,416],"pivot":[1118.0,868]},{"bounds":[1396,450,326,418],"pivot":[1559.5,868]}]},"flora":{"file":"../revisao/assets/flora-suave.png","width":1448,"height":1086,"referenceHeight":296.5,"frames":[{"bounds":[33,27,338,342],"pivot":[183.0,369]},{"bounds":[399,86,331,257],"pivot":[541.5,343]},{"bounds":[730,126,420,247],"pivot":[888.5,373]},{"bounds":[1150,114,291,298],"pivot":[1319.5,412]},{"bounds":[44,466,296,230],"pivot":[162.5,696]},{"bounds":[392,413,310,288],"pivot":[537.0,701]},{"bounds":[734,427,378,307],"pivot":[934.5,734]},{"bounds":[1149,412,276,337],"pivot":[1295.0,749]},{"bounds":[69,768,237,291],"pivot":[170.5,1059]},{"bounds":[403,763,233,296],"pivot":[504.0,1059]},{"bounds":[718,754,372,297],"pivot":[892.5,1051]},{"bounds":[1090,749,345,306],"pivot":[1258.0,1055]}]},"natureza":{"file":"../revisao/assets/natureza-suave.png","width":1536,"height":1024,"referenceHeight":393.0,"frames":[{"bounds":[11,50,405,499],"pivot":[185.0,549]},{"bounds":[424,50,407,503],"pivot":[613.5,553]},{"bounds":[847,178,297,363],"pivot":[971.0,541]},{"bounds":[1144,146,381,395],"pivot":[1351.5,541]},{"bounds":[55,582,328,391],"pivot":[72.5,973]},{"bounds":[435,583,400,390],"pivot":[448.5,973]},{"bounds":[835,592,309,380],"pivot":[922.5,972]},{"bounds":[1144,578,381,395],"pivot":[1343.0,973]}]},"capivara":{"file":"../revisao/assets/capivara-suave.png","width":1774,"height":887,"referenceHeight":285,"frames":[{"bounds":[60,149,345,285],"pivot":[252.0,434]},{"bounds":[531,149,327,285],"pivot":[717.0,434]},{"bounds":[956,103,344,332],"pivot":[1110.5,435]},{"bounds":[1381,111,367,331],"pivot":[1601.5,442]},{"bounds":[32,479,412,325],"pivot":[212.0,804]},{"bounds":[444,484,443,322],"pivot":[718.5,806]},{"bounds":[887,483,443,327],"pivot":[1108.0,810]},{"bounds":[1330,483,435,324],"pivot":[1531.0,807]}]},"cervo":{"file":"../revisao/assets/cervo-suave.png","width":1774,"height":887,"referenceHeight":372,"frames":[{"bounds":[50,61,380,372],"pivot":[288.0,433]},{"bounds":[504,62,367,369],"pivot":[733.0,431]},{"bounds":[952,59,319,373],"pivot":[1103.0,432]},{"bounds":[1392,29,327,409],"pivot":[1574.0,438]},{"bounds":[68,456,346,391],"pivot":[289.0,847]},{"bounds":[512,459,349,386],"pivot":[697.0,845]},{"bounds":[945,456,350,391],"pivot":[1152.5,847]},{"bounds":[1373,456,373,384],"pivot":[1569.5,840]}]},"passaro":{"file":"../revisao/assets/passaro-suave.png","width":1774,"height":887,"referenceHeight":283,"frames":[{"bounds":[68,121,357,283],"pivot":[218.0,404]},{"bounds":[533,121,349,283],"pivot":[673.5,404]},{"bounds":[949,114,377,299],"pivot":[1169.5,413]},{"bounds":[1421,100,333,313],"pivot":[1566.5,413]},{"bounds":[50,461,356,327],"pivot":[295.0,788]},{"bounds":[456,552,431,234],"pivot":[754.5,786]},{"bounds":[887,551,443,277],"pivot":[1275.0,828]},{"bounds":[1330,492,414,307],"pivot":[1633.0,799]}]},"kai-cuidados":{"file":"../revisao/assets/kai-cuidados-suave.png","width":1536,"height":1024,"referenceHeight":333,"frames":[{"bounds":[54,9,245,336],"pivot":[204.5,345]},{"bounds":[447,12,255,333],"pivot":[594.5,345]},{"bounds":[810,14,272,331],"pivot":[951.0,345]},{"bounds":[1173,16,305,329],"pivot":[1322.0,345]},{"bounds":[58,345,260,346],"pivot":[211.5,691]},{"bounds":[428,345,265,346],"pivot":[578.0,691]},{"bounds":[802,345,314,344],"pivot":[980.5,689]},{"bounds":[1192,345,313,350],"pivot":[1340.5,695]},{"bounds":[41,705,319,297],"pivot":[201.0,1002]},{"bounds":[433,699,306,302],"pivot":[591.0,1001]},{"bounds":[805,707,329,296],"pivot":[989.0,1003]},{"bounds":[1219,695,217,316],"pivot":[1359.0,1011]}]},"fogo":{"file":"../revisao/assets/fogo-suave.png","width":1774,"height":887,"referenceHeight":363.5,"frames":[{"bounds":[83,42,321,356],"pivot":[245.5,398]},{"bounds":[526,29,326,367],"pivot":[685.5,396]},{"bounds":[938,37,333,360],"pivot":[1112.5,397]},{"bounds":[1400,38,323,405],"pivot":[1540.0,443]},{"bounds":[75,461,346,367],"pivot":[247.5,828]},{"bounds":[515,471,329,358],"pivot":[672.0,829]},{"bounds":[964,475,318,350],"pivot":[1117.5,825]},{"bounds":[1392,443,331,377],"pivot":[1559.5,820]}]}});


;/* jogo/sprites-integros/atlas.js */
"use strict";(()=>{const d={"grupos":{"vida":{"kai-andando":{"file":"assets/vida-kai-andando.webp","width":2240,"height":1280,"referenceHeight":280.5,"frames":[{"bounds":[25,38,230,270],"pivot":[155.375,308]},{"bounds":[312,36,216,272],"pivot":[433.875,308]},{"bounds":[590,36,221,272],"pivot":[716.875,308]},{"bounds":[871,37,218,271],"pivot":[991.375,308]},{"bounds":[1150,34,220,274],"pivot":[1271.375,308]},{"bounds":[1433,30,214,278],"pivot":[1554.375,308]},{"bounds":[1714,31,212,277],"pivot":[1831.875,308]},{"bounds":[1994,30,211,278],"pivot":[2102.375,308]},{"bounds":[36,354,207,274],"pivot":[144.875,628]},{"bounds":[320,354,200,274],"pivot":[425.375,628]},{"bounds":[596,354,208,274],"pivot":[701.875,628]},{"bounds":[875,352,210,276],"pivot":[987.875,628]},{"bounds":[1144,357,231,271],"pivot":[1251.375,628]},{"bounds":[1429,355,222,273],"pivot":[1519.875,628]},{"bounds":[1705,355,230,273],"pivot":[1800.875,628]},{"bounds":[1993,360,214,268],"pivot":[2082.375,628]},{"bounds":[26,665,228,283],"pivot":[122.25,948]},{"bounds":[307,664,226,284],"pivot":[399.75,948]},{"bounds":[583,665,234,283],"pivot":[684.75,948]},{"bounds":[868,665,224,283],"pivot":[967.75,948]},{"bounds":[1142,663,235,285],"pivot":[1207.125,948]},{"bounds":[1418,665,244,283],"pivot":[1486.625,948]},{"bounds":[1702,664,236,284],"pivot":[1767.625,948]},{"bounds":[1982,665,235,283],"pivot":[2047.625,948]},{"bounds":[14,973,251,295],"pivot":[147.625,1268]},{"bounds":[294,975,252,293],"pivot":[428.125,1268]},{"bounds":[573,974,254,294],"pivot":[708.125,1268]},{"bounds":[858,973,245,295],"pivot":[990.625,1268]},{"bounds":[1145,979,230,289],"pivot":[1284.25,1268]},{"bounds":[1424,977,231,291],"pivot":[1566.25,1268]},{"bounds":[1696,978,248,290],"pivot":[1843.25,1268]},{"bounds":[1980,977,240,291],"pivot":[2123.25,1268]}]},"kai-mangueira":{"file":"assets/vida-kai-mangueira.webp","width":1856,"height":1072,"referenceHeight":214.5,"frames":[{"bounds":[18,34,197,222],"pivot":[115.5,256]},{"bounds":[252,34,192,222],"pivot":[344.5,256]},{"bounds":[484,32,193,224],"pivot":[581.0,256]},{"bounds":[715,34,194,222],"pivot":[814.5,256]},{"bounds":[950,32,188,224],"pivot":[1031.125,256]},{"bounds":[1184,32,184,224],"pivot":[1264.625,256]},{"bounds":[1417,30,182,226],"pivot":[1494.625,256]},{"bounds":[1650,31,180,225],"pivot":[1732.125,256]},{"bounds":[30,300,171,224],"pivot":[104.5,524]},{"bounds":[267,298,162,226],"pivot":[337.0,524]},{"bounds":[498,301,163,223],"pivot":[568.0,524]},{"bounds":[730,299,164,225],"pivot":[801.5,524]},{"bounds":[946,301,197,223],"pivot":[1044.75,524]},{"bounds":[1180,304,192,220],"pivot":[1275.75,524]},{"bounds":[1408,300,200,224],"pivot":[1506.25,524]},{"bounds":[1645,302,190,222],"pivot":[1741.25,524]},{"bounds":[14,573,204,219],"pivot":[108.625,792]},{"bounds":[245,578,206,214],"pivot":[339.625,792]},{"bounds":[480,574,200,218],"pivot":[572.125,792]},{"bounds":[712,579,200,213],"pivot":[803.625,792]},{"bounds":[948,575,192,217],"pivot":[1043.0,792]},{"bounds":[1175,574,202,218],"pivot":[1263.5,792]},{"bounds":[1409,572,198,220],"pivot":[1493.0,792]},{"bounds":[1643,574,194,218],"pivot":[1728.5,792]},{"bounds":[22,822,189,238],"pivot":[128.5,1060]},{"bounds":[257,819,182,241],"pivot":[356.0,1060]},{"bounds":[487,821,186,239],"pivot":[590.5,1060]},{"bounds":[716,819,191,241],"pivot":[820.0,1060]},{"bounds":[954,821,181,239],"pivot":[1079.25,1060]},{"bounds":[1183,823,186,237],"pivot":[1314.25,1060]},{"bounds":[1416,828,184,232],"pivot":[1547.25,1060]},{"bounds":[1648,826,183,234],"pivot":[1778.25,1060]}]},"fogo":{"file":"assets/vida-fogo.webp","width":1664,"height":888,"referenceHeight":393.0,"frames":[{"bounds":[16,40,385,392],"pivot":[208.5,432]},{"bounds":[435,13,378,419],"pivot":[624.0,432]},{"bounds":[852,27,377,405],"pivot":[1040.5,432]},{"bounds":[1270,29,372,403],"pivot":[1456.0,432]},{"bounds":[12,471,391,405],"pivot":[207.5,876]},{"bounds":[433,469,382,407],"pivot":[624.0,876]},{"bounds":[852,481,375,395],"pivot":[1039.5,876]},{"bounds":[1266,468,380,408],"pivot":[1456.0,876]}]},"flora":{"file":"assets/vida-flora.webp","width":1904,"height":1504,"referenceHeight":300,"frames":[{"bounds":[66,13,343,351],"pivot":[327,366]},{"bounds":[556,95,316,269],"pivot":[812,370]},{"bounds":[964,111,452,253],"pivot":[1233,363]},{"bounds":[1512,54,307,310],"pivot":[1724,310]},{"bounds":[84,500,308,240],"pivot":[326,751]},{"bounds":[560,430,307,310],"pivot":[772,686]},{"bounds":[964,487,452,253],"pivot":[1233,739]},{"bounds":[1508,471,316,269],"pivot":[1764,746]},{"bounds":[46,798,385,318],"pivot":[307,1106]},{"bounds":[572,870,285,246],"pivot":[786,1115]},{"bounds":[1068,814,245,302],"pivot":[1253,1107]},{"bounds":[1544,814,245,302],"pivot":[1729,1107]},{"bounds":[116,1190,245,302],"pivot":[301,1483]},{"bounds":[592,1186,243,306],"pivot":[774,1483]},{"bounds":[1020,1182,341,310],"pivot":[1239,1500]},{"bounds":[1472,1210,388,282],"pivot":[1714,1499]}]}},"campanha":{"icones":{"file":"assets/campanha-icones.webp","width":1440,"height":1200,"referenceHeight":248.5,"frames":[{"bounds":[55,26,250,262],"pivot":[180.0,288]},{"bounds":[408,19,265,269],"pivot":[540.5,288]},{"bounds":[768,48,264,240],"pivot":[900.0,288]},{"bounds":[1144,16,231,272],"pivot":[1259.5,288]},{"bounds":[38,336,284,252],"pivot":[180.0,588]},{"bounds":[419,313,242,275],"pivot":[540.0,588]},{"bounds":[754,366,291,222],"pivot":[899.5,588]},{"bounds":[1104,347,313,241],"pivot":[1260.5,588]},{"bounds":[30,641,301,247],"pivot":[180.5,888]},{"bounds":[374,641,333,247],"pivot":[540.5,888]},{"bounds":[762,626,275,262],"pivot":[899.5,888]},{"bounds":[1120,618,281,270],"pivot":[1260.5,888]},{"bounds":[31,919,298,269],"pivot":[180.0,1188]},{"bounds":[391,934,298,254],"pivot":[540.0,1188]},{"bounds":[748,925,303,263],"pivot":[899.5,1188]},{"bounds":[1122,948,275,240],"pivot":[1259.5,1188]}]},"kai-nadando":{"file":"assets/campanha-kai-nadando.webp","width":1520,"height":1184,"referenceHeight":256.5,"frames":[{"bounds":[31,27,318,257],"pivot":[190.0,284]},{"bounds":[414,24,311,260],"pivot":[569.5,284]},{"bounds":[798,22,304,262],"pivot":[950.0,284]},{"bounds":[1190,20,279,264],"pivot":[1329.5,284]},{"bounds":[31,309,318,271],"pivot":[190.0,580]},{"bounds":[420,310,300,270],"pivot":[570.0,580]},{"bounds":[798,318,304,262],"pivot":[950.0,580],"flip":true},{"bounds":[1190,316,279,264],"pivot":[1329.5,580],"flip":true},{"bounds":[31,615,318,261],"pivot":[190.0,876]},{"bounds":[393,614,354,262],"pivot":[570.0,876]},{"bounds":[796,616,307,260],"pivot":[949.5,876],"flip":true},{"bounds":[1182,614,295,262],"pivot":[1329.5,876],"flip":true},{"bounds":[40,921,299,251],"pivot":[189.5,1172]},{"bounds":[428,920,284,252],"pivot":[570.0,1172]},{"bounds":[796,912,307,260],"pivot":[949.5,1172]},{"bounds":[1182,910,295,262],"pivot":[1329.5,1172]}]},"kai-rio":{"file":"assets/campanha-kai-rio.webp","width":1808,"height":1248,"referenceHeight":358.0,"frames":[{"bounds":[40,68,372,336],"pivot":[226.0,404]},{"bounds":[514,114,328,290],"pivot":[678.0,404]},{"bounds":[981,59,298,345],"pivot":[1130.0,404]},{"bounds":[1435,54,294,350],"pivot":[1582.0,404]},{"bounds":[12,506,427,314],"pivot":[225.5,820]},{"bounds":[510,504,336,316],"pivot":[678.0,820]},{"bounds":[976,504,307,316],"pivot":[1129.5,820]},{"bounds":[1426,484,313,336],"pivot":[1582.5,820]},{"bounds":[44,846,365,390],"pivot":[226.5,1236]},{"bounds":[510,861,337,375],"pivot":[678.5,1236]},{"bounds":[926,888,407,348],"pivot":[1129.5,1236]},{"bounds":[1412,851,339,385],"pivot":[1581.5,1236]}]},"kai-floresta":{"file":"assets/campanha-kai-floresta.webp","width":1568,"height":1128,"referenceHeight":334.0,"frames":[{"bounds":[58,27,277,337],"pivot":[196.5,364]},{"bounds":[446,15,285,349],"pivot":[588.5,364]},{"bounds":[832,13,297,351],"pivot":[980.5,364]},{"bounds":[1246,33,251,331],"pivot":[1371.5,364]},{"bounds":[59,403,274,337],"pivot":[196.0,740]},{"bounds":[464,415,249,325],"pivot":[588.5,740]},{"bounds":[826,463,308,277],"pivot":[980.0,740]},{"bounds":[1204,464,335,276],"pivot":[1371.5,740]},{"bounds":[20,822,351,294],"pivot":[195.5,1116]},{"bounds":[448,833,279,283],"pivot":[587.5,1116]},{"bounds":[830,837,300,279],"pivot":[980.0,1116]},{"bounds":[1190,822,365,294],"pivot":[1372.5,1116]}]},"kai-plantio":{"file":"assets/campanha-kai-plantio.webp","width":1664,"height":1200,"referenceHeight":346.5,"frames":[{"bounds":[48,47,320,341],"pivot":[208.0,388]},{"bounds":[471,56,306,332],"pivot":[624.0,388]},{"bounds":[877,61,326,327],"pivot":[1040.0,388]},{"bounds":[1294,51,323,337],"pivot":[1455.5,388]},{"bounds":[56,414,304,374],"pivot":[208.0,788]},{"bounds":[462,416,323,372],"pivot":[623.5,788]},{"bounds":[852,425,377,363],"pivot":[1040.5,788]},{"bounds":[1313,420,286,368],"pivot":[1456.0,788]},{"bounds":[44,828,328,360],"pivot":[208.0,1188]},{"bounds":[468,868,311,320],"pivot":[623.5,1188]},{"bounds":[868,863,343,325],"pivot":[1039.5,1188]},{"bounds":[1262,829,389,359],"pivot":[1456.5,1188]}]},"animais-rio":{"file":"assets/campanha-animais-rio.webp","width":1520,"height":1072,"referenceHeight":215.0,"frames":[{"bounds":[32,31,316,225],"pivot":[190.0,256]},{"bounds":[411,29,318,227],"pivot":[570.0,256]},{"bounds":[792,23,317,233],"pivot":[950.5,256]},{"bounds":[1166,18,329,238],"pivot":[1330.5,256]},{"bounds":[20,346,341,178],"pivot":[190.5,524]},{"bounds":[393,347,354,177],"pivot":[570.0,524]},{"bounds":[774,352,352,172],"pivot":[950.0,524]},{"bounds":[1162,355,336,169],"pivot":[1330.0,524]},{"bounds":[46,550,288,242],"pivot":[190.0,792]},{"bounds":[420,559,300,233],"pivot":[570.0,792]},{"bounds":[804,559,292,233],"pivot":[950.0,792]},{"bounds":[1186,553,288,239],"pivot":[1330.0,792]},{"bounds":[24,846,333,214],"pivot":[190.5,1060]},{"bounds":[408,841,323,219],"pivot":[569.5,1060]},{"bounds":[780,846,341,214],"pivot":[950.5,1060]},{"bounds":[1172,845,315,215],"pivot":[1329.5,1060]}]},"animais-fauna":{"file":"assets/campanha-animais-fauna.webp","width":1568,"height":1232,"referenceHeight":272.0,"frames":[{"bounds":[82,15,227,281],"pivot":[195.5,296]},{"bounds":[478,14,220,282],"pivot":[588.0,296]},{"bounds":[828,15,303,281],"pivot":[979.5,296]},{"bounds":[1218,31,308,265],"pivot":[1372.0,296]},{"bounds":[79,346,234,258],"pivot":[196.0,604]},{"bounds":[463,343,250,261],"pivot":[588.0,604]},{"bounds":[854,322,252,282],"pivot":[980.0,604]},{"bounds":[1214,349,316,255],"pivot":[1372.0,604]},{"bounds":[74,631,245,281],"pivot":[196.5,912]},{"bounds":[474,646,228,266],"pivot":[588.0,912]},{"bounds":[798,646,365,266],"pivot":[980.5,912]},{"bounds":[1196,640,352,272],"pivot":[1372.0,912]},{"bounds":[89,940,214,280],"pivot":[196.0,1220]},{"bounds":[484,945,209,275],"pivot":[588.5,1220]},{"bounds":[852,937,256,283],"pivot":[980.0,1220]},{"bounds":[1219,948,306,272],"pivot":[1372.0,1220]}]},"animais-fauna-andando":{"file":"assets/campanha-animais-fauna-andando.webp","width":1632,"height":1248,"referenceHeight":255.5,"frames":[{"bounds":[46,38,317,262],"pivot":[204.5,300]},{"bounds":[443,30,338,270],"pivot":[612.0,300]},{"bounds":[852,26,336,274],"pivot":[1020.0,300]},{"bounds":[1268,37,320,263],"pivot":[1428.0,300]},{"bounds":[46,345,315,267],"pivot":[203.5,612]},{"bounds":[458,345,307,267],"pivot":[611.5,612]},{"bounds":[863,345,314,267],"pivot":[1020.0,612]},{"bounds":[1270,348,317,264],"pivot":[1428.5,612]},{"bounds":[21,659,366,265],"pivot":[204.0,924]},{"bounds":[436,692,352,232],"pivot":[612.0,924]},{"bounds":[829,711,382,213],"pivot":[1020.0,924]},{"bounds":[1261,686,334,238],"pivot":[1428.0,924]},{"bounds":[50,951,309,285],"pivot":[204.5,1236]},{"bounds":[450,999,325,237],"pivot":[612.5,1236]},{"bounds":[848,1034,344,202],"pivot":[1020.0,1236]},{"bounds":[1275,954,306,282],"pivot":[1428.0,1236]}]},"objetos":{"file":"assets/campanha-objetos.webp","width":1424,"height":1312,"referenceHeight":265.0,"frames":[{"bounds":[44,152,268,164],"pivot":[178.0,316]},{"bounds":[424,107,221,209],"pivot":[534.5,316]},{"bounds":[772,145,235,171],"pivot":[889.5,316]},{"bounds":[1108,109,275,207],"pivot":[1245.5,316]},{"bounds":[40,395,276,249],"pivot":[178.0,644]},{"bounds":[368,395,332,249],"pivot":[534.0,644]},{"bounds":[760,383,259,261],"pivot":[889.5,644]},{"bounds":[1116,382,261,262],"pivot":[1246.5,644]},{"bounds":[45,710,266,262],"pivot":[178.0,972]},{"bounds":[400,706,267,266],"pivot":[533.5,972]},{"bounds":[760,691,259,281],"pivot":[889.5,972]},{"bounds":[1100,670,291,302],"pivot":[1245.5,972]},{"bounds":[14,1018,328,282],"pivot":[178.0,1300]},{"bounds":[408,1012,251,288],"pivot":[533.5,1300]},{"bounds":[760,1008,261,292],"pivot":[890.5,1300]},{"bounds":[1114,1050,263,250],"pivot":[1245.5,1300]}]},"npcs":{"file":"assets/campanha-npcs.webp","width":2208,"height":1020,"referenceHeight":288.0,"frames":[{"bounds":[56,15,165,313],"pivot":[138.5,328]},{"bounds":[312,15,205,313],"pivot":[414.5,328]},{"bounds":[576,16,229,312],"pivot":[690.5,328]},{"bounds":[876,30,180,298],"pivot":[966.0,328]},{"bounds":[1132,32,220,296],"pivot":[1242.0,328]},{"bounds":[1393,31,250,297],"pivot":[1518.0,328]},{"bounds":[1716,25,155,303],"pivot":[1793.5,328]},{"bounds":[1972,25,195,303],"pivot":[2069.5,328]},{"bounds":[30,365,215,303],"pivot":[137.5,668]},{"bounds":[334,363,161,305],"pivot":[414.5,668]},{"bounds":[584,364,211,304],"pivot":[689.5,668]},{"bounds":[848,366,236,302],"pivot":[966.0,668]},{"bounds":[1166,370,151,298],"pivot":[1241.5,668]},{"bounds":[1424,369,188,299],"pivot":[1518.0,668]},{"bounds":[1687,368,214,300],"pivot":[1794.0,668]},{"bounds":[1992,385,156,283],"pivot":[2070.0,668]},{"bounds":[38,725,200,283],"pivot":[138.0,1008]},{"bounds":[302,725,224,283],"pivot":[414.0,1008]}]}},"floresta":{"carlos":{"file":"assets/floresta-carlos.webp","width":1456,"height":896,"referenceHeight":411.0,"frames":[{"bounds":[54,15,257,421],"pivot":[182.5,436]},{"bounds":[422,15,248,421],"pivot":[546.0,436]},{"bounds":[756,15,308,421],"pivot":[910.0,436]},{"bounds":[1104,15,340,421],"pivot":[1274.0,436]},{"bounds":[58,463,247,421],"pivot":[181.5,884]},{"bounds":[384,462,323,422],"pivot":[545.5,884]},{"bounds":[762,463,295,421],"pivot":[909.5,884]},{"bounds":[1109,462,330,422],"pivot":[1274.0,884]}]},"itens":{"file":"assets/floresta-itens.webp","width":1840,"height":944,"referenceHeight":313.5,"frames":[{"bounds":[29,51,402,409],"pivot":[230.0,460]},{"bounds":[487,86,406,374],"pivot":[690.0,460]},{"bounds":[1023,14,254,446],"pivot":[1150.0,460]},{"bounds":[1410,30,400,430],"pivot":[1610.0,460]},{"bounds":[15,716,430,216],"pivot":[230.0,932]},{"bounds":[478,696,423,236],"pivot":[689.5,932]},{"bounds":[938,661,423,271],"pivot":[1149.5,932]},{"bounds":[1393,656,434,276],"pivot":[1610.0,932]}]},"kai-mangueira":{"file":"assets/floresta-kai-mangueira.webp","width":1232,"height":1360,"referenceHeight":296.0,"frames":[{"bounds":[14,16,280,312],"pivot":[154.0,328]},{"bounds":[320,17,283,311],"pivot":[461.5,328]},{"bounds":[642,20,257,308],"pivot":[770.5,328]},{"bounds":[946,20,265,308],"pivot":[1078.5,328]},{"bounds":[45,354,218,314],"pivot":[154.0,668]},{"bounds":[348,354,227,314],"pivot":[461.5,668]},{"bounds":[631,361,278,307],"pivot":[770.0,668]},{"bounds":[945,361,266,307],"pivot":[1078.0,668]},{"bounds":[16,699,276,309],"pivot":[154.0,1008]},{"bounds":[328,700,268,308],"pivot":[462.0,1008]},{"bounds":[641,701,258,307],"pivot":[770.0,1008]},{"bounds":[948,701,260,307],"pivot":[1078.0,1008]},{"bounds":[31,1042,246,306],"pivot":[154.0,1348]},{"bounds":[336,1041,253,307],"pivot":[462.5,1348]},{"bounds":[644,1044,251,304],"pivot":[769.5,1348]},{"bounds":[950,1039,256,309],"pivot":[1078.0,1348]}]},"kai-repouso":{"file":"assets/floresta-kai-repouso.webp","width":1456,"height":936,"referenceHeight":425.0,"frames":[{"bounds":[36,15,292,441],"pivot":[182.0,456]},{"bounds":[398,17,297,439],"pivot":[546.5,456]},{"bounds":[764,12,292,444],"pivot":[910.0,456]},{"bounds":[1127,17,294,439],"pivot":[1274.0,456]},{"bounds":[37,490,290,434],"pivot":[182.0,924]},{"bounds":[398,492,297,432],"pivot":[546.5,924]},{"bounds":[741,496,338,428],"pivot":[910.0,924]},{"bounds":[1106,495,337,429],"pivot":[1274.5,924]}]},"natureza":{"file":"assets/floresta-natureza.webp","width":1776,"height":1080,"referenceHeight":393.0,"frames":[{"bounds":[13,17,418,511],"pivot":[222.0,528]},{"bounds":[458,13,417,515],"pivot":[666.5,528]},{"bounds":[971,155,278,373],"pivot":[1110.0,528]},{"bounds":[1351,121,406,407],"pivot":[1554.0,528]},{"bounds":[53,665,338,403],"pivot":[222.0,1068]},{"bounds":[498,668,337,400],"pivot":[666.5,1068]},{"bounds":[923,676,374,392],"pivot":[1110.0,1068]},{"bounds":[1349,665,410,403],"pivot":[1554.0,1068]}]},"capivara":{"file":"assets/floresta-capivara.webp","width":1808,"height":736,"referenceHeight":285,"frames":[{"bounds":[48,64,355,292],"pivot":[225.5,356]},{"bounds":[510,63,335,293],"pivot":[677.5,356]},{"bounds":[953,15,354,341],"pivot":[1130.0,356]},{"bounds":[1392,13,381,343],"pivot":[1582.5,356]},{"bounds":[14,392,424,332],"pivot":[226.0,724]},{"bounds":[465,395,426,329],"pivot":[678.0,724]},{"bounds":[918,386,423,338],"pivot":[1129.5,724]},{"bounds":[1378,394,407,330],"pivot":[1581.5,724]}]},"cervo":{"file":"assets/floresta-cervo.webp","width":1664,"height":888,"referenceHeight":372,"frames":[{"bounds":[13,52,390,380],"pivot":[208.0,432]},{"bounds":[436,55,375,377],"pivot":[623.5,432]},{"bounds":[872,52,336,380],"pivot":[1040.0,432]},{"bounds":[1287,14,338,418],"pivot":[1456.0,432]},{"bounds":[30,474,356,402],"pivot":[208.0,876]},{"bounds":[443,480,362,396],"pivot":[624.0,876]},{"bounds":[858,474,364,402],"pivot":[1040.0,876]},{"bounds":[1265,481,382,395],"pivot":[1456.0,876]}]},"passaro":{"file":"assets/floresta-passaro.webp","width":2016,"height":720,"referenceHeight":283,"frames":[{"bounds":[68,57,367,291],"pivot":[251.5,348]},{"bounds":[578,58,356,290],"pivot":[756.0,348]},{"bounds":[1065,32,390,316],"pivot":[1260.0,348]},{"bounds":[1594,27,339,321],"pivot":[1763.5,348]},{"bounds":[70,373,364,335],"pivot":[252.0,708]},{"bounds":[518,465,477,243],"pivot":[756.5,708]},{"bounds":[1040,422,439,286],"pivot":[1259.5,708]},{"bounds":[1585,390,358,318],"pivot":[1764.0,708]}]},"kai-cuidados":{"file":"assets/floresta-kai-cuidados.webp","width":1456,"height":1140,"referenceHeight":333,"frames":[{"bounds":[54,15,255,353],"pivot":[181.5,368]},{"bounds":[415,20,262,348],"pivot":[546.0,368]},{"bounds":[770,25,281,343],"pivot":[910.5,368]},{"bounds":[1117,27,314,341],"pivot":[1274.0,368]},{"bounds":[46,416,271,332],"pivot":[181.5,748]},{"bounds":[406,409,279,339],"pivot":[545.5,748]},{"bounds":[748,450,323,298],"pivot":[909.5,748]},{"bounds":[1112,436,324,312],"pivot":[1274.0,748]},{"bounds":[16,821,332,307],"pivot":[182.0,1128]},{"bounds":[389,812,314,316],"pivot":[546.0,1128]},{"bounds":[740,824,339,304],"pivot":[909.5,1128]},{"bounds":[1160,798,227,330],"pivot":[1273.5,1128]}]}}},"colar":{"file":"assets/colar-kai-vestindo.webp","width":1440,"height":832,"referenceHeight":388.5,"frames":[{"bounds":[50,14,261,390],"pivot":[180.5,404]},{"bounds":[403,16,274,388],"pivot":[540.0,404]},{"bounds":[764,15,272,389],"pivot":[900.0,404]},{"bounds":[1092,16,335,388],"pivot":[1259.5,404]},{"bounds":[26,428,308,392],"pivot":[180.0,820]},{"bounds":[394,434,291,386],"pivot":[539.5,820]},{"bounds":[761,434,278,386],"pivot":[900.0,820]},{"bounds":[1114,428,291,392],"pivot":[1259.5,820]}],"pendants":[null,[605,255],[963,199],[1363,265],[197,489],[572,641],[939,643],[1293,620]]}};if(window.GuardiaoVidaAtlas)for(const [n,s] of Object.entries(d.grupos.vida)){s.file="../../sprites-integros/"+s.file;window.GuardiaoVidaAtlas[n]=s;}if(window.GuardiaoCampanhaAtlas)for(const [n,s] of Object.entries(d.grupos.campanha)){s.file="../sprites-integros/"+s.file;window.GuardiaoCampanhaAtlas[n]=s;}if(window.GuardiaoFlorestaAtlas)for(const [n,s] of Object.entries(d.grupos.floresta)){s.file="../../sprites-integros/"+s.file;window.GuardiaoFlorestaAtlas.sheets[n]=s;}if(window.GuardiaoArteManifesto)window.GuardiaoArteManifesto["jogo/jornada/assets/icones.png"]="jogo/sprites-integros/assets/campanha-icones.webp";window.GuardiaoColarArte=d.colar;})();


;/* jogo/encanto-natural/flora-atlas.js */
"use strict";
window.GuardiaoFloraEncanto = {
  file: "../../encanto-natural/assets/encanto-flora.webp",
  width: 1424,
  height: 1136,
  referenceHeight: 239.0,
  frames: [
    { bounds: [32, 17, 293, 255], pivot: [178.5, 272] },
    { bounds: [382, 36, 303, 236], pivot: [533.5, 272] },
    { bounds: [726, 30, 328, 242], pivot: [890.0, 272] },
    { bounds: [1100, 29, 293, 243], pivot: [1246.5, 272] },
    { bounds: [64, 299, 229, 257], pivot: [178.5, 556] },
    { bounds: [391, 317, 286, 239], pivot: [534.0, 556] },
    { bounds: [726, 318, 329, 238], pivot: [890.5, 556] },
    { bounds: [1096, 322, 300, 234], pivot: [1246.0, 556] },
    { bounds: [31, 590, 294, 250], pivot: [178.0, 840] },
    { bounds: [376, 603, 315, 237], pivot: [533.5, 840] },
    { bounds: [744, 597, 291, 243], pivot: [889.5, 840] },
    { bounds: [1152, 603, 188, 237], pivot: [1246.0, 840] },
    { bounds: [84, 886, 188, 238], pivot: [178.0, 1124] },
    { bounds: [440, 884, 189, 240], pivot: [534.5, 1124] },
    { bounds: [745, 880, 290, 244], pivot: [890.0, 1124] },
    { bounds: [1087, 887, 318, 237], pivot: [1246.0, 1124] },
  ],
};
if (window.GuardiaoVidaAtlas)
  window.GuardiaoVidaAtlas.flora = window.GuardiaoFloraEncanto;


;/* jogo/colar-vivo/geometria.js */
window.GuardiaoColarGeometria={"width":1024,"height":1536,"pendant":[176,775,671,735],"gems":[{"name":"vermelho","path":"M313 896h3v1h-3ZM309 897h9v1h-9ZM307 898h13v1h-13ZM306 899h15v1h-15ZM304 900h17v1h-17ZM303 901h19v1h-19ZM302 902h20v1h-20ZM303 903h18v1h-18ZM303 904h19v1h-19ZM302 905h21v1h-21ZM296 906h1v1h-1ZM301 906h23v1h-23ZM295 907h3v1h-3ZM300 907h25v1h-25ZM293 908h33v1h-33ZM292 909h34v1h-34ZM290 910h36v1h-36ZM289 911h37v1h-37ZM288 912h38v1h-38ZM287 913h39v1h-39ZM286 914h39v1h-39ZM284 915h40v1h-40ZM283 916h41v1h-41ZM282 917h42v1h-42ZM280 918h45v1h-45ZM279 919h46v1h-46ZM278 920h48v1h-48ZM279 921h47v1h-47ZM279 922h47v1h-47ZM278 923h49v1h-49ZM277 924h50v1h-50ZM276 925h51v1h-51ZM277 926h51v1h-51ZM277 927h51v1h-51ZM278 928h50v1h-50ZM277 929h52v1h-52ZM276 930h53v1h-53ZM275 931h54v1h-54ZM274 932h56v1h-56ZM273 933h57v1h-57ZM272 934h58v1h-58ZM271 935h59v1h-59ZM270 936h61v1h-61ZM269 937h62v1h-62ZM268 938h63v1h-63ZM267 939h64v1h-64ZM266 940h66v1h-66ZM265 941h67v1h-67ZM264 942h68v1h-68ZM263 943h69v1h-69ZM262 944h71v1h-71ZM261 945h72v1h-72ZM261 946h72v1h-72ZM260 947h73v1h-73ZM259 948h75v1h-75ZM258 949h76v1h-76ZM257 950h77v1h-77ZM256 951h78v1h-78ZM255 952h79v1h-79ZM255 953h80v1h-80ZM254 954h81v1h-81ZM253 955h82v1h-82ZM252 956h83v1h-83ZM251 957h84v1h-84ZM250 958h86v1h-86ZM250 959h86v1h-86ZM249 960h87v1h-87ZM248 961h88v1h-88ZM248 962h88v1h-88ZM247 963h89v1h-89ZM246 964h90v1h-90ZM246 965h90v1h-90ZM245 966h92v1h-92ZM244 967h93v1h-93ZM244 968h93v1h-93ZM243 969h94v1h-94ZM242 970h95v1h-95ZM242 971h95v1h-95ZM241 972h96v1h-96ZM240 973h97v1h-97ZM240 974h98v1h-98ZM239 975h99v1h-99ZM233 976h1v1h-1ZM238 976h100v1h-100ZM233 977h3v1h-3ZM237 977h101v1h-101ZM232 978h106v1h-106ZM233 979h105v1h-105ZM233 980h105v1h-105ZM232 981h106v1h-106ZM233 982h105v1h-105ZM234 983h104v1h-104ZM234 984h104v1h-104ZM233 985h105v1h-105ZM233 986h105v1h-105ZM232 987h106v1h-106ZM232 988h106v1h-106ZM231 989h107v1h-107ZM231 990h107v1h-107ZM230 991h108v1h-108ZM230 992h108v1h-108ZM229 993h109v1h-109ZM229 994h109v1h-109ZM228 995h110v1h-110ZM228 996h110v1h-110ZM227 997h111v1h-111ZM227 998h111v1h-111ZM226 999h112v1h-112ZM226 1000h112v1h-112ZM225 1001h113v1h-113ZM225 1002h112v1h-112ZM225 1003h112v1h-112ZM224 1004h113v1h-113ZM224 1005h113v1h-113ZM223 1006h114v1h-114ZM223 1007h114v1h-114ZM222 1008h114v1h-114ZM222 1009h114v1h-114ZM221 1010h115v1h-115ZM221 1011h115v1h-115ZM221 1012h115v1h-115ZM220 1013h115v1h-115ZM220 1014h115v1h-115ZM220 1015h115v1h-115ZM219 1016h116v1h-116ZM219 1017h115v1h-115ZM218 1018h116v1h-116ZM218 1019h116v1h-116ZM218 1020h115v1h-115ZM218 1021h115v1h-115ZM217 1022h115v1h-115ZM217 1023h115v1h-115ZM216 1024h115v1h-115ZM216 1025h115v1h-115ZM216 1026h114v1h-114ZM215 1027h115v1h-115ZM215 1028h114v1h-114ZM215 1029h114v1h-114ZM215 1030h113v1h-113ZM214 1031h113v1h-113ZM214 1032h112v1h-112ZM214 1033h112v1h-112ZM214 1034h111v1h-111ZM213 1035h111v1h-111ZM213 1036h110v1h-110ZM213 1037h109v1h-109ZM213 1038h108v1h-108ZM213 1039h107v1h-107ZM213 1040h106v1h-106ZM213 1041h105v1h-105ZM212 1042h104v1h-104ZM212 1043h103v1h-103ZM212 1044h102v1h-102ZM212 1045h100v1h-100ZM212 1046h99v1h-99ZM212 1047h97v1h-97ZM212 1048h95v1h-95ZM212 1049h93v1h-93ZM212 1050h92v1h-92ZM212 1051h90v1h-90ZM212 1052h88v1h-88ZM212 1053h86v1h-86ZM212 1054h84v1h-84ZM213 1055h81v1h-81ZM213 1056h79v1h-79ZM213 1057h77v1h-77ZM214 1058h73v1h-73ZM214 1059h71v1h-71ZM214 1060h68v1h-68ZM215 1061h65v1h-65ZM216 1062h61v1h-61ZM216 1063h58v1h-58ZM217 1064h53v1h-53ZM218 1065h49v1h-49ZM219 1066h45v1h-45ZM221 1067h39v1h-39ZM223 1068h33v1h-33ZM225 1069h25v1h-25ZM230 1070h15v1h-15Z","bounds":[212,896,126,175],"center":[275.0,983.5],"light":"#ff6d55","dark":"#b51528"},{"name":"azul","path":"M286 1116h20v1h-20ZM307 1116h1v1h-1ZM280 1117h9v1h-9ZM301 1117h12v1h-12ZM273 1118h7v1h-7ZM306 1118h9v1h-9ZM269 1119h3v1h-3ZM273 1119h1v1h-1ZM311 1119h5v1h-5ZM264 1120h5v1h-5ZM261 1121h4v1h-4ZM257 1122h5v1h-5ZM255 1123h4v1h-4ZM284 1123h20v1h-20ZM251 1124h7v1h-7ZM276 1124h32v1h-32ZM248 1125h9v1h-9ZM271 1125h41v1h-41ZM245 1126h13v1h-13ZM267 1126h47v1h-47ZM243 1127h16v1h-16ZM263 1127h53v1h-53ZM241 1128h76v1h-76ZM238 1129h81v1h-81ZM236 1130h84v1h-84ZM234 1131h88v1h-88ZM232 1132h91v1h-91ZM230 1133h94v1h-94ZM229 1134h96v1h-96ZM228 1135h99v1h-99ZM227 1136h101v1h-101ZM226 1137h103v1h-103ZM225 1138h105v1h-105ZM226 1139h104v1h-104ZM227 1140h104v1h-104ZM228 1141h104v1h-104ZM228 1142h105v1h-105ZM227 1143h107v1h-107ZM227 1144h108v1h-108ZM226 1145h110v1h-110ZM226 1146h111v1h-111ZM225 1147h113v1h-113ZM225 1148h114v1h-114ZM225 1149h114v1h-114ZM224 1150h116v1h-116ZM224 1151h117v1h-117ZM224 1152h118v1h-118ZM224 1153h118v1h-118ZM224 1154h119v1h-119ZM224 1155h120v1h-120ZM224 1156h121v1h-121ZM224 1157h121v1h-121ZM224 1158h122v1h-122ZM224 1159h123v1h-123ZM224 1160h124v1h-124ZM225 1161h123v1h-123ZM225 1162h124v1h-124ZM225 1163h125v1h-125ZM225 1164h126v1h-126ZM226 1165h125v1h-125ZM226 1166h126v1h-126ZM226 1167h127v1h-127ZM226 1168h128v1h-128ZM227 1169h127v1h-127ZM227 1170h128v1h-128ZM227 1171h129v1h-129ZM227 1172h129v1h-129ZM228 1173h129v1h-129ZM228 1174h130v1h-130ZM228 1175h130v1h-130ZM229 1176h130v1h-130ZM229 1177h131v1h-131ZM229 1178h131v1h-131ZM230 1179h131v1h-131ZM230 1180h132v1h-132ZM230 1181h132v1h-132ZM231 1182h132v1h-132ZM231 1183h132v1h-132ZM231 1184h133v1h-133ZM232 1185h132v1h-132ZM232 1186h133v1h-133ZM232 1187h134v1h-134ZM233 1188h133v1h-133ZM233 1189h134v1h-134ZM234 1190h133v1h-133ZM234 1191h134v1h-134ZM235 1192h133v1h-133ZM235 1193h134v1h-134ZM235 1194h134v1h-134ZM236 1195h134v1h-134ZM237 1196h133v1h-133ZM237 1197h134v1h-134ZM237 1198h134v1h-134ZM238 1199h134v1h-134ZM238 1200h134v1h-134ZM239 1201h134v1h-134ZM239 1202h134v1h-134ZM240 1203h133v1h-133ZM240 1204h133v1h-133ZM241 1205h132v1h-132ZM241 1206h133v1h-133ZM242 1207h132v1h-132ZM242 1208h132v1h-132ZM243 1209h131v1h-131ZM244 1210h130v1h-130ZM244 1211h130v1h-130ZM245 1212h129v1h-129ZM245 1213h129v1h-129ZM246 1214h128v1h-128ZM246 1215h128v1h-128ZM247 1216h127v1h-127ZM247 1217h127v1h-127ZM248 1218h126v1h-126ZM248 1219h125v1h-125ZM249 1220h124v1h-124ZM250 1221h123v1h-123ZM250 1222h123v1h-123ZM251 1223h122v1h-122ZM252 1224h121v1h-121ZM252 1225h121v1h-121ZM253 1226h119v1h-119ZM254 1227h118v1h-118ZM254 1228h118v1h-118ZM255 1229h117v1h-117ZM256 1230h116v1h-116ZM256 1231h115v1h-115ZM257 1232h114v1h-114ZM258 1233h113v1h-113ZM259 1234h112v1h-112ZM259 1235h111v1h-111ZM260 1236h110v1h-110ZM261 1237h109v1h-109ZM262 1238h107v1h-107ZM262 1239h107v1h-107ZM263 1240h106v1h-106ZM264 1241h104v1h-104ZM265 1242h103v1h-103ZM265 1243h103v1h-103ZM266 1244h101v1h-101ZM267 1245h100v1h-100ZM268 1246h99v1h-99ZM269 1247h97v1h-97ZM269 1248h97v1h-97ZM270 1249h96v1h-96ZM271 1250h94v1h-94ZM272 1251h93v1h-93ZM273 1252h92v1h-92ZM274 1253h90v1h-90ZM275 1254h89v1h-89ZM276 1255h87v1h-87ZM277 1256h86v1h-86ZM278 1257h85v1h-85ZM278 1258h84v1h-84ZM279 1259h83v1h-83ZM280 1260h81v1h-81ZM281 1261h80v1h-80ZM282 1262h78v1h-78ZM283 1263h77v1h-77ZM284 1264h75v1h-75ZM285 1265h74v1h-74ZM286 1266h73v1h-73ZM287 1267h71v1h-71ZM289 1268h68v1h-68ZM290 1269h67v1h-67ZM291 1270h65v1h-65ZM292 1271h64v1h-64ZM293 1272h62v1h-62ZM294 1273h61v1h-61ZM295 1274h59v1h-59ZM297 1275h57v1h-57ZM298 1276h55v1h-55ZM299 1277h53v1h-53ZM300 1278h52v1h-52ZM301 1279h50v1h-50ZM303 1280h47v1h-47ZM304 1281h46v1h-46ZM305 1282h44v1h-44ZM307 1283h41v1h-41ZM308 1284h40v1h-40ZM310 1285h37v1h-37ZM311 1286h35v1h-35ZM313 1287h32v1h-32ZM314 1288h31v1h-31ZM316 1289h28v1h-28ZM318 1290h25v1h-25ZM320 1291h22v1h-22ZM322 1292h19v1h-19ZM324 1293h15v1h-15ZM327 1294h10v1h-10Z","bounds":[224,1116,150,179],"center":[299.0,1205.5],"light":"#65daff","dark":"#1758bd"},{"name":"amarelo","path":"M511 1267h7v1h-7ZM469 1268h79v1h-79ZM464 1269h88v1h-88ZM462 1270h92v1h-92ZM459 1271h97v1h-97ZM457 1272h101v1h-101ZM456 1273h104v1h-104ZM455 1274h106v1h-106ZM453 1275h109v1h-109ZM452 1276h112v1h-112ZM451 1277h114v1h-114ZM449 1278h117v1h-117ZM448 1279h119v1h-119ZM447 1280h121v1h-121ZM446 1281h123v1h-123ZM445 1282h126v1h-126ZM444 1283h128v1h-128ZM442 1284h131v1h-131ZM441 1285h133v1h-133ZM440 1286h135v1h-135ZM439 1287h137v1h-137ZM438 1288h139v1h-139ZM437 1289h141v1h-141ZM436 1290h142v1h-142ZM436 1291h143v1h-143ZM435 1292h145v1h-145ZM434 1293h147v1h-147ZM433 1294h149v1h-149ZM432 1295h151v1h-151ZM431 1296h153v1h-153ZM430 1297h155v1h-155ZM429 1298h157v1h-157ZM428 1299h159v1h-159ZM428 1300h160v1h-160ZM427 1301h161v1h-161ZM426 1302h163v1h-163ZM425 1303h165v1h-165ZM424 1304h167v1h-167ZM424 1305h168v1h-168ZM423 1306h170v1h-170ZM419 1307h2v1h-2ZM422 1307h171v1h-171ZM419 1308h175v1h-175ZM418 1309h177v1h-177ZM418 1310h178v1h-178ZM417 1311h179v1h-179ZM416 1312h181v1h-181ZM415 1313h183v1h-183ZM415 1314h184v1h-184ZM600 1314h1v1h-1ZM414 1315h187v1h-187ZM413 1316h187v1h-187ZM413 1317h187v1h-187ZM412 1318h189v1h-189ZM411 1319h191v1h-191ZM411 1320h192v1h-192ZM410 1321h194v1h-194ZM409 1322h197v1h-197ZM408 1323h199v1h-199ZM408 1324h199v1h-199ZM407 1325h201v1h-201ZM407 1326h201v1h-201ZM406 1327h201v1h-201ZM406 1328h201v1h-201ZM406 1329h202v1h-202ZM406 1330h202v1h-202ZM405 1331h204v1h-204ZM405 1332h204v1h-204ZM405 1333h204v1h-204ZM405 1334h205v1h-205ZM405 1335h205v1h-205ZM405 1336h205v1h-205ZM405 1337h205v1h-205ZM405 1338h205v1h-205ZM405 1339h205v1h-205ZM405 1340h205v1h-205ZM405 1341h204v1h-204ZM406 1342h203v1h-203ZM406 1343h203v1h-203ZM406 1344h203v1h-203ZM407 1345h201v1h-201ZM407 1346h201v1h-201ZM408 1347h199v1h-199ZM409 1348h198v1h-198ZM409 1349h197v1h-197ZM410 1350h195v1h-195ZM411 1351h193v1h-193ZM412 1352h191v1h-191ZM413 1353h189v1h-189ZM414 1354h187v1h-187ZM415 1355h185v1h-185ZM416 1356h182v1h-182ZM418 1357h179v1h-179ZM419 1358h177v1h-177ZM420 1359h174v1h-174ZM422 1360h170v1h-170ZM424 1361h167v1h-167ZM426 1362h163v1h-163ZM428 1363h159v1h-159ZM430 1364h155v1h-155ZM432 1365h151v1h-151ZM435 1366h146v1h-146ZM437 1367h141v1h-141ZM440 1368h135v1h-135ZM443 1369h129v1h-129ZM446 1370h123v1h-123ZM450 1371h116v1h-116ZM454 1372h108v1h-108ZM459 1373h99v1h-99ZM464 1374h88v1h-88ZM469 1375h77v1h-77ZM476 1376h63v1h-63ZM485 1377h46v1h-46ZM501 1378h11v1h-11Z","bounds":[405,1267,205,112],"center":[507.5,1323.0],"light":"#ffed77","dark":"#c58a13"},{"name":"verde","path":"M710 1117h10v1h-10ZM733 1117h10v1h-10ZM708 1118h7v1h-7ZM741 1118h4v1h-4ZM705 1119h7v1h-7ZM703 1120h6v1h-6ZM753 1120h5v1h-5ZM701 1121h6v1h-6ZM757 1121h4v1h-4ZM699 1122h5v1h-5ZM761 1122h4v1h-4ZM698 1123h5v1h-5ZM717 1123h23v1h-23ZM762 1123h7v1h-7ZM696 1124h5v1h-5ZM713 1124h34v1h-34ZM763 1124h9v1h-9ZM695 1125h5v1h-5ZM710 1125h42v1h-42ZM762 1125h12v1h-12ZM694 1126h4v1h-4ZM708 1126h48v1h-48ZM761 1126h16v1h-16ZM693 1127h4v1h-4ZM706 1127h73v1h-73ZM692 1128h4v1h-4ZM704 1128h77v1h-77ZM691 1129h4v1h-4ZM703 1129h79v1h-79ZM689 1130h3v1h-3ZM701 1130h82v1h-82ZM689 1131h1v1h-1ZM700 1131h84v1h-84ZM688 1132h1v1h-1ZM699 1132h87v1h-87ZM687 1133h1v1h-1ZM698 1133h90v1h-90ZM686 1134h1v1h-1ZM696 1134h94v1h-94ZM685 1135h1v1h-1ZM695 1135h96v1h-96ZM684 1136h1v1h-1ZM694 1136h99v1h-99ZM683 1137h1v1h-1ZM693 1137h101v1h-101ZM682 1138h1v1h-1ZM692 1138h103v1h-103ZM681 1139h1v1h-1ZM691 1139h105v1h-105ZM690 1140h108v1h-108ZM689 1141h109v1h-109ZM688 1142h108v1h-108ZM797 1142h2v1h-2ZM687 1143h108v1h-108ZM798 1143h1v1h-1ZM686 1144h108v1h-108ZM685 1145h109v1h-109ZM684 1146h111v1h-111ZM684 1147h111v1h-111ZM683 1148h113v1h-113ZM682 1149h114v1h-114ZM681 1150h115v1h-115ZM680 1151h116v1h-116ZM679 1152h118v1h-118ZM679 1153h118v1h-118ZM678 1154h119v1h-119ZM677 1155h120v1h-120ZM676 1156h121v1h-121ZM676 1157h120v1h-120ZM675 1158h121v1h-121ZM674 1159h122v1h-122ZM673 1160h123v1h-123ZM672 1161h124v1h-124ZM672 1162h124v1h-124ZM671 1163h125v1h-125ZM670 1164h125v1h-125ZM670 1165h125v1h-125ZM669 1166h126v1h-126ZM668 1167h127v1h-127ZM667 1168h128v1h-128ZM667 1169h127v1h-127ZM666 1170h128v1h-128ZM665 1171h129v1h-129ZM664 1172h129v1h-129ZM664 1173h129v1h-129ZM663 1174h130v1h-130ZM662 1175h130v1h-130ZM662 1176h130v1h-130ZM661 1177h131v1h-131ZM661 1178h130v1h-130ZM660 1179h131v1h-131ZM660 1180h131v1h-131ZM659 1181h131v1h-131ZM658 1182h132v1h-132ZM658 1183h132v1h-132ZM657 1184h132v1h-132ZM656 1185h133v1h-133ZM656 1186h132v1h-132ZM655 1187h133v1h-133ZM655 1188h133v1h-133ZM654 1189h133v1h-133ZM653 1190h134v1h-134ZM653 1191h133v1h-133ZM652 1192h134v1h-134ZM645 1193h1v1h-1ZM652 1193h133v1h-133ZM645 1194h1v1h-1ZM651 1194h134v1h-134ZM651 1195h133v1h-133ZM650 1196h134v1h-134ZM649 1197h134v1h-134ZM648 1198h135v1h-135ZM646 1199h136v1h-136ZM646 1200h136v1h-136ZM646 1201h136v1h-136ZM646 1202h135v1h-135ZM647 1203h134v1h-134ZM648 1204h132v1h-132ZM647 1205h133v1h-133ZM647 1206h132v1h-132ZM647 1207h132v1h-132ZM647 1208h131v1h-131ZM647 1209h131v1h-131ZM647 1210h130v1h-130ZM647 1211h130v1h-130ZM647 1212h129v1h-129ZM647 1213h128v1h-128ZM647 1214h128v1h-128ZM647 1215h127v1h-127ZM647 1216h127v1h-127ZM647 1217h126v1h-126ZM647 1218h125v1h-125ZM647 1219h125v1h-125ZM647 1220h124v1h-124ZM648 1221h123v1h-123ZM648 1222h122v1h-122ZM648 1223h121v1h-121ZM648 1224h121v1h-121ZM648 1225h120v1h-120ZM649 1226h118v1h-118ZM649 1227h117v1h-117ZM649 1228h117v1h-117ZM649 1229h116v1h-116ZM650 1230h115v1h-115ZM650 1231h114v1h-114ZM650 1232h113v1h-113ZM650 1233h112v1h-112ZM650 1234h111v1h-111ZM651 1235h109v1h-109ZM651 1236h109v1h-109ZM651 1237h108v1h-108ZM652 1238h106v1h-106ZM652 1239h106v1h-106ZM652 1240h105v1h-105ZM653 1241h103v1h-103ZM653 1242h102v1h-102ZM653 1243h101v1h-101ZM653 1244h101v1h-101ZM654 1245h99v1h-99ZM654 1246h98v1h-98ZM654 1247h97v1h-97ZM655 1248h96v1h-96ZM655 1249h95v1h-95ZM655 1250h94v1h-94ZM656 1251h92v1h-92ZM656 1252h91v1h-91ZM657 1253h90v1h-90ZM657 1254h89v1h-89ZM657 1255h88v1h-88ZM658 1256h86v1h-86ZM658 1257h85v1h-85ZM659 1258h83v1h-83ZM659 1259h82v1h-82ZM660 1260h80v1h-80ZM660 1261h79v1h-79ZM661 1262h77v1h-77ZM661 1263h76v1h-76ZM661 1264h75v1h-75ZM662 1265h73v1h-73ZM662 1266h73v1h-73ZM663 1267h70v1h-70ZM664 1268h68v1h-68ZM664 1269h67v1h-67ZM665 1270h65v1h-65ZM665 1271h64v1h-64ZM666 1272h62v1h-62ZM666 1273h61v1h-61ZM667 1274h59v1h-59ZM667 1275h57v1h-57ZM668 1276h55v1h-55ZM669 1277h53v1h-53ZM669 1278h52v1h-52ZM670 1279h49v1h-49ZM671 1280h47v1h-47ZM671 1281h46v1h-46ZM672 1282h43v1h-43ZM673 1283h41v1h-41ZM673 1284h40v1h-40ZM674 1285h37v1h-37ZM675 1286h35v1h-35ZM676 1287h32v1h-32ZM677 1288h30v1h-30ZM677 1289h28v1h-28ZM678 1290h25v1h-25ZM679 1291h23v1h-23ZM681 1292h19v1h-19ZM682 1293h16v1h-16ZM684 1294h11v1h-11Z","bounds":[645,1117,154,178],"center":[722.0,1206.0],"light":"#a7f57a","dark":"#238351"},{"name":"violeta","path":"M703 897h9v1h-9ZM713 897h2v1h-2ZM702 898h9v1h-9ZM701 899h9v1h-9ZM700 900h10v1h-10ZM700 901h11v1h-11ZM699 902h13v1h-13ZM699 903h15v1h-15ZM698 904h18v1h-18ZM698 905h22v1h-22ZM697 906h24v1h-24ZM697 907h25v1h-25ZM696 908h28v1h-28ZM727 908h3v1h-3ZM696 909h29v1h-29ZM726 909h5v1h-5ZM695 910h37v1h-37ZM695 911h38v1h-38ZM694 912h41v1h-41ZM694 913h42v1h-42ZM693 914h44v1h-44ZM693 915h45v1h-45ZM692 916h43v1h-43ZM692 917h42v1h-42ZM692 918h1v1h-1ZM694 918h39v1h-39ZM695 919h39v1h-39ZM696 920h39v1h-39ZM696 921h40v1h-40ZM696 922h41v1h-41ZM696 923h42v1h-42ZM695 924h44v1h-44ZM695 925h46v1h-46ZM694 926h48v1h-48ZM694 927h49v1h-49ZM693 928h51v1h-51ZM693 929h52v1h-52ZM693 930h53v1h-53ZM693 931h54v1h-54ZM692 932h56v1h-56ZM692 933h57v1h-57ZM692 934h58v1h-58ZM691 935h60v1h-60ZM691 936h61v1h-61ZM691 937h62v1h-62ZM691 938h63v1h-63ZM690 939h65v1h-65ZM690 940h66v1h-66ZM690 941h67v1h-67ZM690 942h67v1h-67ZM690 943h68v1h-68ZM689 944h70v1h-70ZM689 945h71v1h-71ZM689 946h72v1h-72ZM689 947h73v1h-73ZM689 948h74v1h-74ZM688 949h75v1h-75ZM688 950h76v1h-76ZM688 951h77v1h-77ZM688 952h78v1h-78ZM688 953h79v1h-79ZM687 954h80v1h-80ZM687 955h81v1h-81ZM687 956h82v1h-82ZM687 957h83v1h-83ZM687 958h84v1h-84ZM686 959h85v1h-85ZM686 960h86v1h-86ZM686 961h87v1h-87ZM686 962h87v1h-87ZM686 963h88v1h-88ZM686 964h89v1h-89ZM685 965h90v1h-90ZM685 966h91v1h-91ZM685 967h92v1h-92ZM685 968h92v1h-92ZM685 969h93v1h-93ZM685 970h94v1h-94ZM685 971h94v1h-94ZM685 972h95v1h-95ZM685 973h95v1h-95ZM685 974h96v1h-96ZM685 975h97v1h-97ZM684 976h98v1h-98ZM684 977h99v1h-99ZM684 978h100v1h-100ZM684 979h100v1h-100ZM684 980h101v1h-101ZM684 981h102v1h-102ZM684 982h102v1h-102ZM684 983h103v1h-103ZM684 984h103v1h-103ZM684 985h104v1h-104ZM684 986h104v1h-104ZM684 987h105v1h-105ZM684 988h105v1h-105ZM684 989h106v1h-106ZM684 990h106v1h-106ZM684 991h107v1h-107ZM684 992h107v1h-107ZM684 993h108v1h-108ZM684 994h108v1h-108ZM684 995h109v1h-109ZM684 996h109v1h-109ZM684 997h110v1h-110ZM684 998h110v1h-110ZM684 999h111v1h-111ZM684 1000h111v1h-111ZM684 1001h112v1h-112ZM684 1002h112v1h-112ZM685 1003h111v1h-111ZM685 1004h112v1h-112ZM685 1005h112v1h-112ZM685 1006h113v1h-113ZM685 1007h113v1h-113ZM685 1008h113v1h-113ZM685 1009h114v1h-114ZM686 1010h113v1h-113ZM686 1011h114v1h-114ZM686 1012h114v1h-114ZM686 1013h114v1h-114ZM686 1014h115v1h-115ZM687 1015h114v1h-114ZM687 1016h115v1h-115ZM687 1017h115v1h-115ZM688 1018h114v1h-114ZM688 1019h115v1h-115ZM688 1020h115v1h-115ZM689 1021h114v1h-114ZM689 1022h115v1h-115ZM690 1023h114v1h-114ZM690 1024h114v1h-114ZM690 1025h114v1h-114ZM691 1026h114v1h-114ZM692 1027h113v1h-113ZM692 1028h113v1h-113ZM693 1029h112v1h-112ZM693 1030h113v1h-113ZM694 1031h112v1h-112ZM695 1032h111v1h-111ZM695 1033h111v1h-111ZM696 1034h111v1h-111ZM697 1035h110v1h-110ZM698 1036h109v1h-109ZM699 1037h108v1h-108ZM700 1038h108v1h-108ZM701 1039h107v1h-107ZM702 1040h106v1h-106ZM704 1041h104v1h-104ZM705 1042h103v1h-103ZM706 1043h102v1h-102ZM708 1044h101v1h-101ZM709 1045h100v1h-100ZM711 1046h98v1h-98ZM712 1047h97v1h-97ZM714 1048h95v1h-95ZM716 1049h93v1h-93ZM718 1050h91v1h-91ZM720 1051h89v1h-89ZM722 1052h87v1h-87ZM723 1053h85v1h-85ZM725 1054h83v1h-83ZM728 1055h80v1h-80ZM730 1056h78v1h-78ZM732 1057h75v1h-75ZM735 1058h72v1h-72ZM737 1059h70v1h-70ZM740 1060h66v1h-66ZM742 1061h64v1h-64ZM745 1062h60v1h-60ZM748 1063h56v1h-56ZM751 1064h53v1h-53ZM754 1065h48v1h-48ZM758 1066h43v1h-43ZM761 1067h38v1h-38ZM765 1068h32v1h-32ZM770 1069h24v1h-24ZM777 1070h13v1h-13Z","bounds":[684,897,125,174],"center":[746.5,984.0],"light":"#d6b3ff","dark":"#7541bb"}]};


;/* jogo/colar-vivo/colar.js */
"use strict";
(() => {
  const base = new URL("./", ({src:new URL("../colar-vivo/colar.js?v=audio-1",document.baseURI).href}).src);
  const geometry = window.GuardiaoColarGeometria;
  const clamp = (n) => Math.max(0, Math.min(1, n));
  const ease = (n) => {
    const t = clamp(n);
    return t * t * (3 - 2 * t);
  };
  const colors = ["#ff4739", "#39b9ed", "#e9b63c", "#6acb5e", "#b98bff"];
  const titles = [
    "O primeiro cuidado",
    "A força da água",
    "Amigos em segurança",
    "A floresta renasce",
    "Cinco cuidados, um Guardião",
  ];
  class Necklace {
    constructor({ phase, life }) {
      this.phase = phase;
      this.life = life;
      this.earned = [];
      this.active = false;
      try {
        const map = JSON.parse(
          localStorage.getItem("guardiao.mapa.progresso.v1") || "null",
        );
        const shards = JSON.parse(
          localStorage.getItem("guardiao.colar.fragmentos.v1") || "[]",
        );
        this.earned = [
          ...new Set([
            ...(Array.isArray(map?.completed) ? map.completed : []),
            ...(Array.isArray(shards) ? shards : []),
            ...(map?.completedFirst ? [1] : []),
          ]),
        ].filter((n) => Number.isInteger(n) && n >= 1 && n <= 5);
      } catch {}
      this.create();
    }
    create() {
      const defs = geometry.gems
        .map(
          (g, i) =>
            `<clipPath id="colar-clip-${i}"><path d="${g.path}"/></clipPath><linearGradient id="colar-cor-${i}" x2=".8" y2="1"><stop stop-color="${g.light}"/><stop offset=".5" stop-color="${colors[i]}"/><stop offset="1" stop-color="${g.dark}"/></linearGradient>`,
        )
        .join("");
      const gems = geometry.gems
        .map((g, i) => {
          const [x, y, w, h] = g.bounds;
          return `<g data-colar-pedra="${i + 1}"><g clip-path="url(#colar-clip-${i})"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#colar-cor-${i})"/><path d="M${x} ${y + h * 0.2}L${x + w * 0.5} ${y + h * 0.05}L${x + w * 0.3} ${y + h * 0.45}Z M${x + w * 0.7} ${y + h * 0.15}L${x + w} ${y + h * 0.5}L${x + w * 0.55} ${y + h * 0.45}Z" fill="#ffffff" opacity=".48"/><path d="M${x + w * 0.3} ${y + h * 0.45}L${x + w * 0.55} ${y + h * 0.45}L${x + w * 0.9} ${y + h}L${x + w * 0.1} ${y + h}Z" fill="${g.dark}" opacity=".5"/><path d="M${x + w * 0.12} ${y + h * 0.17}L${x + w * 0.55} ${y + h * 0.13}L${x + w * 0.78} ${y + h * 0.3}" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity=".82" fill="none"/></g></g>`;
        })
        .join("");
      this.element = document.createElement("section");
      this.element.id = "colar-cena";
      this.element.className = "colar-cutscene";
      this.element.hidden = true;
      this.element.setAttribute("role", "region");
      this.element.setAttribute(
        "aria-label",
        "A conquista do colar do Guardião",
      );
      this.element.innerHTML = `<div class="colar-card"><header><p class="colar-eyebrow">UMA NOVA CONQUISTA</p><h2 id="colar-titulo"></h2><p id="colar-frase" role="status" aria-live="polite"></p></header><svg class="colar-view" viewBox="0 0 ${geometry.width} ${geometry.height}" aria-label="Colar com os encaixes das cinco pedras" role="img"><defs>${defs}</defs><image href="${new URL("assets/colar-vazio.webp", base).href}" width="${geometry.width}" height="${geometry.height}"/>${gems}<g class="colar-brilho" aria-hidden="true"><path d="M0-36L8-8L34 0L8 8L0 36L-8 8L-34 0L-8-8Z" fill="#fff9d2"/><circle r="47" fill="none" stroke="#ffeaaa" stroke-width="3"/></g></svg><footer><canvas id="colar-kai" width="300" height="160" role="img" aria-label="Kai coloca seu colar enquanto Flora comemora"></canvas><p><strong id="colar-contagem"></strong><span>cuidados que viraram luz</span></p></footer><button id="colar-continuar" type="button">Continuar a aventura <span aria-hidden="true">→</span></button></div>`;
      document.body.append(this.element);
      this.svg = this.element.querySelector("svg");
      this.gemNodes = [...this.element.querySelectorAll("[data-colar-pedra]")];
      this.spark = this.element.querySelector(".colar-brilho");
      this.caption = this.element.querySelector("#colar-frase");
      this.count = this.element.querySelector("#colar-contagem");
      this.button = this.element.querySelector("button");
      this.button.addEventListener("click", () => {
        if (!this.active || this.finishing) return;
        this.finishing = true;
        this.onFinish?.();
      });
    }
    async load() {
      const image = async (path) => {
        const im = new Image();
        im.src = path;
        await im.decode();
        return im;
      };
      [this.actor, this.necklace] = await Promise.all([
        image(
          new URL("../sprites-integros/" + window.GuardiaoColarArte.file, base)
            .href,
        ),
        image(new URL("assets/colar-vazio.webp", base).href),
      ]);
    }
    begin(onFinish) {
      this.before = this.earned.filter((n) => n < this.phase);
      this.after = [...new Set([...this.before, this.phase])];
      this.active = true;
      this.finishing = false;
      this.focused = false;
      this.onFinish = onFinish;
      this.messageStage = "";
      this.element.dataset.phase = String(this.phase);
      this.element.querySelector("h2").textContent = titles[this.phase - 1];
      this.element.style.setProperty("--cristal", colors[this.phase - 1]);
      this.render(0, false);
    }
    complete() {
      this.earned = [...new Set([...this.earned, this.phase])];
      this.active = false;
      this.finishing = true;
      this.element.hidden = true;
      document.body.classList.remove("colar-em-cena");
    }
    render(time, reduced = false) {
      if (!this.active) return;
      const opacity =
        ease((time - 0.75) / 0.4) * (1 - ease((time - 5.85) / 0.45));
      this.element.hidden = opacity <= 0;
      this.element.style.opacity = String(opacity);
      this.element.style.pointerEvents = opacity > 0.5 ? "auto" : "none";
      document.body.classList.toggle("colar-em-cena", opacity > 0.5);
      const landed = time >= 2.8;
      this.element.dataset.state = landed
        ? "encaixado"
        : time >= 1.5
          ? "encaixando"
          : "vazio";
      this.element.dataset.pieces = String(
        this.before.length + (landed ? 1 : 0),
      );
      if (opacity > 0.7 && !this.focused) {
        this.focused = true;
        this.button.focus({ preventScroll: true });
      }
      const travel = ease((time - 1.5) / 1.3);
      geometry.gems.forEach((g, i) => {
        const current = i + 1 === this.phase;
        const visible = this.before.includes(i + 1) || (current && time >= 1.5);
        this.gemNodes[i].style.opacity = visible ? "1" : "0";
        let dx = 0,
          dy = 0,
          scale = 1;
        if (current && !landed) {
          if (reduced) {
            this.gemNodes[i].style.opacity = "0";
          } else {
            dx = (1 - travel) * (geometry.width - g.center[0] + 180);
            dy = -(1 - travel) * 470 - Math.sin(travel * Math.PI) * 110;
            scale = 0.85 + 0.15 * travel;
          }
        }
        const [cx, cy] = g.center;
        this.gemNodes[i].setAttribute(
          "transform",
          `translate(${dx} ${dy}) translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`,
        );
      });
      const zoom = reduced ? 1 : ease((time - 0.95) / 0.55);
      this.svg.setAttribute(
        "viewBox",
        `${110 * zoom} ${620 * zoom} ${geometry.width + (810 - geometry.width) * zoom} ${geometry.height + (900 - geometry.height) * zoom}`,
      );
      const gem = geometry.gems[this.phase - 1];
      const flash =
        landed && !reduced ? Math.max(0, 1 - (time - 2.8) / 0.9) : 0;
      this.spark.style.opacity = String(flash);
      this.spark.setAttribute(
        "transform",
        `translate(${gem.center.join(" ")}) scale(${0.5 + (1 - flash) * 1.7}) rotate(${(1 - flash) * 55})`,
      );
      const stage = landed ? "encaixado" : "vazio";
      if (stage !== this.messageStage) {
        if (landed) window.GuardiaoAudio?.effect("restaurar", { gain: 0.65 });
        this.messageStage = stage;
        this.caption.textContent = landed
          ? `A pedra ${gem.name === "amarelo" ? "amarela" : gem.name === "vermelho" ? "vermelha" : gem.name === "azul" ? "azul" : gem.name === "verde" ? "verde" : "violeta"} encontrou seu lugar!`
          : this.phase === 1
            ? "Seu colar está pronto para o primeiro cuidado."
            : "Cada cuidado completa sua história.";
        this.count.textContent =
          this.before.length + (landed ? 1 : 0) + " de 5";
      }
      const c = this.element.querySelector("canvas").getContext("2d");
      c.clearRect(0, 0, 300, 160);
      this.drawActor(c, time, 100, 150, 116);
      this.life?.draw(
        c,
        "flora",
        reduced ? 14 : 14 + (Math.floor(time * 5) % 2),
        220,
        95,
        46,
      );
    }
    drawActor(ctx, time, x, y, height = 65, final = false) {
      if (!this.actor) return;
      const d = window.GuardiaoColarArte;
      const index = final ? 7 : Math.min(7, Math.floor((time / 6.5) * 8));
      const f = d.frames[index],
        b = f.bounds,
        k = height / d.referenceHeight;
      ctx.drawImage(
        this.actor,
        ...b,
        x + (b[0] - f.pivot[0]) * k,
        y + (b[1] - f.pivot[1]) * k,
        b[2] * k,
        b[3] * k,
      );
      const scale = height / 65;
      if (index === 0)
        this.crystal(
          ctx,
          x + 14 * scale,
          y - 28 * scale,
          6 * scale,
          colors[this.phase - 1],
        );
      const anchor = d.pendants?.[index];
      if (anchor)
        this.medallion(
          ctx,
          x + (anchor[0] - f.pivot[0]) * k,
          y + (anchor[1] - f.pivot[1]) * k,
          height / 78,
          time >= 2.8 ? this.after || this.earned : this.before || this.earned,
        );
      document.body.dataset.necklacePose = String(index);
    }
    crystal(ctx, x, y, size, color) {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = color;
      ctx.strokeStyle = "#f5d381";
      ctx.lineWidth = Math.max(0.6, size * 0.1);
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.6);
      ctx.lineTo(size * 0.4, 0);
      ctx.lineTo(0, size * 0.6);
      ctx.lineTo(-size * 0.4, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    chest(ctx, player, height = 63, earned = this.earned) {
      if ([1, 2, 3].includes(player.direction)) return;
      const scale = height / 63;
      const side = player.direction >= 4 && player.direction <= 5 ? -1 : 1;
      const x = player.x + (player.direction === 6 ? 0 : 3 * side) * scale,
        y = player.y - 32 * scale;
      this.medallion(ctx, x, y, scale, earned);
    }
    medallion(ctx, x, y, scale, earned) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.fillStyle = "#ddb553";
      ctx.strokeStyle = "#6d481e";
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.bezierCurveTo(6, -2, 4, 3, 0, 6);
      ctx.bezierCurveTo(-5, 2, -5, -2, 0, -5);
      ctx.fill();
      ctx.stroke();
      for (const id of earned) {
        const positions = [
          [-1.6, -1.9],
          [-1.7, 1.3],
          [0, 3.2],
          [1.5, 1.1],
          [1.6, -1.7],
        ];
        const p = positions[id - 1];
        if (!p) continue;
        ctx.fillStyle = colors[id - 1];
        ctx.beginPath();
        ctx.ellipse(p[0], p[1], 1, 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    state() {
      return {
        phase: this.phase,
        active: this.active,
        before: [...(this.before || [])],
        after: [...(this.after || [])],
        earned: [...this.earned],
        state: this.element.dataset.state,
        pieces: Number(this.element.dataset.pieces || 0),
      };
    }
  }
  window.GuardiaoColar = Necklace;
})();


;/* jogo/floresta-viva/sprites.js */
'use strict';
(() => {
  const atlas=window.GuardiaoFlorestaAtlas,base=new URL("./",({src:new URL("../floresta-viva/sprites.js",document.baseURI).href}).src);
  class Sprites {
    constructor(){this.images=new Map();}
    async load(onProgress=()=>{},names=Object.keys(atlas.sheets)){await Promise.all(Object.entries(atlas.sheets).filter(([id])=>names.includes(id)).map(async([id,s])=>{const image=new Image();const url=new URL('assets/'+s.file,base).href;image.src=window.GuardiaoArte?.url(url)||url;await image.decode();if(image.naturalWidth!==s.width||image.naturalHeight!==s.height)throw Error('Prancha inválida: '+id);this.images.set(id,image);onProgress();}));return this;}
    draw(ctx,name,index,x,y,height,{flip=false,angle=0,alpha=1,anchor='feet',width=null}={}){
      const sheet=atlas.sheets[name],f=sheet.frames[index%sheet.frames.length],[sx,sy,sw,sh]=f.bounds;
      const scale=height/sheet.referenceHeight;
      ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y);ctx.rotate(angle);if(flip)ctx.scale(-1,1);
      if(anchor==='center')ctx.drawImage(this.images.get(name),sx,sy,sw,sh,-(width??sw*scale)/2,-height/2,width??sw*scale,height);
      else ctx.drawImage(this.images.get(name),sx,sy,sw,sh,(sx-f.pivot[0])*scale,(sy-f.pivot[1])*scale,sw*scale,sh*scale);
      ctx.restore();
    }
    // Horário: E, NE, N, NO, O, SO, S, SE. SO usa espelhamento corrigindo a arte.
    hose(ctx,direction,frame,x,y,height,options={}){const index=direction*2+frame;this.draw(ctx,'kai-mangueira',index,x,y,height,{...options,flip:direction===5});}
    item(ctx,id,x,y,size,options={}){this.draw(ctx,'itens',id,x,y,size,{anchor:'center',...options});}
    jet(ctx,index,from,to,time){
      const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy);if(length<1)return;
      const f=atlas.sheets.itens.frames[4+index%4],[sx,sy,sw,sh]=f.bounds;
      ctx.save();ctx.translate(from.x,from.y);ctx.rotate(Math.atan2(dy,dx));ctx.globalAlpha=.94;
      ctx.drawImage(this.images.get('itens'),sx,sy,sw,sh,0,-9,length,18+Math.sin(time*14)*2);ctx.restore();
    }
  }
  window.FlorestaSprites=Sprites;
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


;/* jogo/raizes/navegacao.js */
"use strict";
(() => {
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function inside(p, polygon) {
    let hit = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i],
        b = polygon[j];
      if (
        a[1] > p.y !== b[1] > p.y &&
        p.x < ((b[0] - a[0]) * (p.y - a[1])) / (b[1] - a[1]) + a[0]
      )
        hit = !hit;
    }
    return hit;
  }
  class Navigation {
    constructor(data) {
      this.data = data;
      this.dynamic = [];
      this.cell = 12;
      this.cols = 107;
      this.rows = 60;
      this.grid = new Uint8Array(this.cols * this.rows);
      for (let i = 0; i < this.grid.length; i++)
        this.grid[i] = Number(this.walkable(this.point(i)));
    }
    setDynamic(points) {
      this.dynamic = points;
      for (let i = 0; i < this.grid.length; i++)
        this.grid[i] = Number(this.walkable(this.point(i)));
    }
    point(id) {
      return {
        x: (id % this.cols) * this.cell + 6,
        y: Math.floor(id / this.cols) * this.cell + 6,
      };
    }
    floor(p) {
      return (
        inside(p, this.data.floor) &&
        !this.dynamic.some((o) => distance(p, o) < 16) &&
        !this.data.obstacles.some(
          (o) => ((p.x - o.x) / o.rx) ** 2 + ((p.y - o.y) / o.ry) ** 2 < 1,
        )
      );
    }
    walkable(p, r = 7) {
      const geometry = window.GuardiaoMovimento;
      return (
        inside(p, this.data.floor) &&
        geometry.polygonMargin(p, this.data.floor) > r &&
        !this.dynamic.some((o) => distance(p, o) < 16 + r) &&
        !this.data.obstacles.some((o) => geometry.touchesEllipse(p, o, r))
      );
    }
    visible(a, b) {
      const n = Math.ceil(distance(a, b));
      for (let i = 0; i <= n; i++) {
        const t = n ? i / n : 0;
        if (
          !this.walkable({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
        )
          return false;
      }
      return true;
    }
    closest(p) {
      const choices = [],
        valid = this.walkable(p);
      for (let i = 0; i < this.grid.length; i++) {
        if (!this.grid[i]) continue;
        const q = this.point(i);
        choices.push({ id: i, q, d: (q.x - p.x) ** 2 + (q.y - p.y) ** 2 });
      }
      choices.sort((a, b) => a.d - b.d);
      for (const { id, q } of choices)
        if (!valid || this.visible(p, q)) return id;
      return -1;
    }
    route(from, to) {
      this.search ||= new window.RaizesBusca({
        cols: this.cols,
        rows: this.rows,
        cell: this.cell,
        point: (id) => this.point(id),
        grid: this.grid,
        walkable: (p) => this.walkable(p),
        visible: (a, b) => this.visible(a, b),
      });
      return this.search.route(from, to, {
        signature:
          this.dynamicSignature ||
          this.dynamic.map((p) => `${p.x}:${p.y}`).join("|"),
      });
    }
    approach(from, target, range = 55) {
      const options = [];
      for (const radius of [range, range * 0.72, range * 0.48]) {
        for (let i = 0; i < 24; i++) {
          const a = (i * Math.PI) / 12;
          const p = {
            x: target.x + Math.cos(a) * radius,
            y: target.y + Math.sin(a) * radius,
          };
          if (this.walkable(p)) options.push(p);
        }
      }
      options.sort((a, b) => distance(from, a) - distance(from, b));
      for (const p of options) {
        const route = this.route(from, p);
        if (route.length) return route;
      }
      return [];
    }
    swimming(p) {
      const b = this.data.bridge;
      return (
        !!this.data.water &&
        inside(p, this.data.water) &&
        !(b && p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h)
      );
    }
  }
  window.GuardiaoNavegacao = { Navigation, distance, inside };
})();


;/* jogo/novo-amanha/sprites.js */
"use strict";
(() => {
  const base = new URL("../jornada/", ({src:new URL("../novo-amanha/sprites.js?v=amanha-1",document.baseURI).href}).src),
    atlas = window.GuardiaoCampanhaAtlas;
  class CampaignSprites {
    constructor() {
      this.images = new Map();
    }
    async load(names, progress = () => {}) {
      await Promise.all(
        [...new Set(names)].map(async (name) => {
          const d = atlas[name];
          if (!d) throw Error("Prancha ausente: " + name);
          const im = new Image();
          im.src = window.GuardiaoArte.url(new URL(d.file, base).href);
          await im.decode();
          if (im.naturalWidth !== d.width || im.naturalHeight !== d.height)
            throw Error("Dimensões inválidas: " + name);
          this.images.set(name, im);
          progress();
        }),
      );
      return this;
    }
    draw(
      ctx,
      name,
      index,
      x,
      y,
      height,
      { flip = false, alpha = 1, angle = 0, center = false } = {},
    ) {
      const d = atlas[name],
        f = d.frames[index % d.frames.length],
        b = f.bounds,
        k = height / d.referenceHeight,
        im = this.images.get(name);
      if (!im) return;
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.translate(x, y);
      ctx.rotate(angle);
      if (flip !== !!f.flip) ctx.scale(-1, 1);
      if (center) {
        const scale = Math.min(height / b[2], height / b[3]);
        ctx.drawImage(
          im,
          ...b,
          (-b[2] * scale) / 2,
          (-b[3] * scale) / 2,
          b[2] * scale,
          b[3] * scale,
        );
      } else
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
    markup(name, index) {
      const d = atlas[name],
        b = d.frames[index].bounds,
        src = window.GuardiaoArte.url(new URL(d.file, base).href);
      return `<svg viewBox="${b.join(" ")}" overflow="hidden" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><image href="${src}" width="${d.width}" height="${d.height}"/></svg>`;
    }
  }
  window.GuardiaoCampaignSprites = CampaignSprites;
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
  const root = new URL("../../", ({src:new URL("../vida-em-equilibrio/colecao.js?v=equilibrio-1",document.baseURI).href}).src);
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


;/* jogo/interface-viva/atlas.js */
window.GuardiaoInterfaceAtlas = {
  ferramentas: {
    file: "assets/viva-ferramentas.webp",
    width: 792,
    height: 552,
    referenceHeight: 164.75,
    frames: [
      { bounds: [31.5, 10.5, 135.0, 167.5], pivot: [99.0, 178.0] },
      { bounds: [209.5, 27.0, 175.0, 151.0], pivot: [297.0, 178.0] },
      { bounds: [410.0, 30.5, 170.0, 147.5], pivot: [495.0, 178.0] },
      { bounds: [610.0, 9.5, 165.5, 168.5], pivot: [692.75, 178.0] },
      { bounds: [35.0, 190.0, 127.5, 172.0], pivot: [98.75, 362.0] },
      { bounds: [214.0, 216.5, 166.5, 145.5], pivot: [297.25, 362.0] },
      { bounds: [428.0, 197.0, 133.5, 165.0], pivot: [494.75, 362.0] },
      { bounds: [619.0, 197.5, 147.5, 164.5], pivot: [692.75, 362.0] },
      { bounds: [18.0, 386.5, 162.5, 159.5], pivot: [99.25, 546.0] },
      { bounds: [204.5, 378.5, 185.0, 167.5], pivot: [297.0, 546.0] },
      { bounds: [412.0, 387.5, 165.5, 158.5], pivot: [494.75, 546.0] },
      { bounds: [609.0, 374.0, 167.5, 172.0], pivot: [692.75, 546.0] },
    ],
    keys: {
      luvas: 0,
      mangueira: 1,
      kit: 2,
      rede: 3,
      protecao: 4,
      corda: 5,
      chave: 6,
      pa: 7,
      sementes: 8,
      regador: 9,
      solar: 10,
      mochila: 11,
    },
  },
  simbolos: {
    file: "assets/viva-simbolos.webp",
    width: 664,
    height: 648,
    referenceHeight: 131.5,
    frames: [
      { bounds: [31.5, 18.5, 103.0, 137.5], pivot: [83.0, 156.0] },
      { bounds: [192.0, 15.5, 113.5, 140.5], pivot: [248.75, 156.0] },
      { bounds: [349.0, 36.5, 132.0, 119.5], pivot: [415.0, 156.0] },
      { bounds: [519.0, 26.5, 124.0, 129.5], pivot: [581.0, 156.0] },
      { bounds: [24.0, 183.0, 118.0, 135.0], pivot: [83.0, 318.0] },
      { bounds: [177.0, 217.5, 144.5, 100.5], pivot: [249.25, 318.0] },
      { bounds: [341.5, 214.5, 147.0, 103.5], pivot: [415.0, 318.0] },
      { bounds: [514.0, 193.0, 134.0, 125.0], pivot: [581.0, 318.0] },
      { bounds: [13.0, 340.5, 140.0, 139.5], pivot: [83.0, 480.0] },
      { bounds: [184.0, 345.0, 130.0, 135.0], pivot: [249.0, 480.0] },
      { bounds: [358.0, 346.5, 113.5, 133.5], pivot: [414.75, 480.0] },
      { bounds: [515.5, 341.0, 131.0, 139.0], pivot: [581.0, 480.0] },
      { bounds: [15.0, 522.0, 136.0, 120.0], pivot: [83.0, 642.0] },
      { bounds: [173.0, 525.0, 152.5, 117.0], pivot: [249.25, 642.0] },
      { bounds: [339.0, 542.0, 152.5, 100.0], pivot: [415.25, 642.0] },
      { bounds: [512.0, 492.0, 138.5, 150.0], pivot: [581.25, 642.0] },
    ],
    keys: {
      water: 0,
      fire: 1,
      paw: 2,
      leaf: 3,
      trash: 4,
      fish: 5,
      turtle: 6,
      recycle: 7,
      sun: 8,
      gear: 9,
      lock: 10,
      shield: 11,
      heart: 12,
      bike: 13,
      bus: 14,
      compass: 15,
    },
  },
};


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
  const base = new URL("./", ({src:new URL("../encontros-da-floresta/relicario.js?v=encontros-1",document.baseURI).href}).src);
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


;/* jogo/vida-em-equilibrio/mochila.js */
"use strict";
(() => {
  const root = new URL("../../", ({src:new URL("../vida-em-equilibrio/mochila.js?v=amanha-1",document.baseURI).href}).src),
    memory = window.GuardiaoMemoria;
  let tab = "items",
    dialog,
    geomPromise;
  const icon = (name) => window.GuardiaoIcones?.markup(name) || "";
  function geometry() {
    if (window.GuardiaoColarGeometria) return Promise.resolve();
    return (geomPromise ??= new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = new URL("jogo/colar-vivo/geometria.js", root).href;
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    }));
  }
  function create() {
    if (dialog) return;
    dialog = document.createElement("dialog");
    dialog.id = "mochila-jornada";
    dialog.className = "journey-pack";
    dialog.setAttribute("aria-labelledby", "pack-title");
    dialog.innerHTML =
      '<header><div><p>COLEÇÃO DO GUARDIÃO</p><h2 id="pack-title">Mochila de Kai</h2></div><button type="button" data-pack-close aria-label="Fechar mochila">×</button></header><div role="tablist" aria-label="Dentro da mochila"><button type="button" role="tab" id="pack-tab-items" aria-controls="pack-content" data-pack-tab="items">Itens</button><button type="button" role="tab" id="pack-tab-crystals" aria-controls="pack-content" data-pack-tab="crystals">Cristais / Amuleto</button><button type="button" role="tab" id="pack-tab-uniforms" aria-controls="pack-content" data-pack-tab="uniforms">Uniformes</button></div><section id="pack-content" role="tabpanel" tabindex="0"></section><p id="pack-status" role="status" aria-live="polite"></p><footer><button type="button" data-pack-close>Voltar à aventura</button></footer>';
    document.body.append(dialog);
    dialog.addEventListener("click", (e) => {
      if (e.target.closest("[data-pack-close]")) dialog.close();
      const next = e.target.closest("[data-pack-tab]")?.dataset.packTab;
      if (next) {
        tab = next;
        render();
      }
      const item = e.target.closest("[data-pack-equip]")?.dataset.packEquip;
      if (item && memory.equip(item)) {
        dialog.close();
      }
    });
    dialog.addEventListener("keydown", (e) => {
      const current = e.target.closest("[data-pack-tab]");
      if (
        !current ||
        !["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
      )
        return;
      e.preventDefault();
      const list = [...dialog.querySelectorAll("[data-pack-tab]")],
        i = list.indexOf(current),
        j =
          e.key === "Home"
            ? 0
            : e.key === "End"
              ? 2
              : (i + (e.key === "ArrowRight" ? 1 : 2)) % 3;
      tab = list[j].dataset.packTab;
      render();
      list[j].focus();
    });
  }
  const $ = (id) => document.getElementById(id);
  function necklace() {
    const g = window.GuardiaoColarGeometria;
    if (!g) return "<p>Preparando o amuleto…</p>";
    const earned = memory.obtained();
    return `<svg viewBox="0 0 ${g.width} ${g.height}" role="img" aria-label="Amuleto com ${earned.length} de cinco cristais"><image href="${new URL("jogo/colar-vivo/assets/colar-vazio.webp", root).href}" width="${g.width}" height="${g.height}"/>${g.gems.map((gem, i) => `<path d="${gem.path}" fill="${earned.includes(i + 1) ? memory.crystals[i].color : "#596354"}" opacity="${earned.includes(i + 1) ? 1 : 0.28}"/>`).join("")}</svg>`;
  }
  function render() {
    if (!dialog) return;
    const state = memory.read(),
      earned = memory.obtained();
    dialog.querySelectorAll("[data-pack-tab]").forEach((b) => {
      const selected = b.dataset.packTab === tab;
      b.setAttribute("aria-selected", String(selected));
      b.tabIndex = selected ? 0 : -1;
    });
    $("pack-content").setAttribute("aria-labelledby", "pack-tab-" + tab);
    if (tab === "items")
      $("pack-content").innerHTML =
        '<p class="pack-intro">Cada encontro traz uma ferramenta para cuidar. Os itens ainda não encontrados ficam bloqueados.</p><div class="pack-grid">' +
        memory.items
          .map((i) => {
            const unlocked = memory.has(i.id),
              current = Number(document.body.dataset.phase || 0);
            return `<article class="pack-card ${unlocked ? "" : "pack-locked"}" data-item="${i.id}" data-unlocked="${unlocked}"><div class="pack-icon">${unlocked ? window.GuardiaoColecao.item(i.id) : icon("lock")}</div><div><h3>${i.name}</h3><p>${unlocked ? i.description : "Você vai encontrar este item durante a fase " + i.phase + "."}</p>${unlocked && current === i.phase ? `<button type="button" data-pack-equip="${i.id}">Usar na missão</button>` : `<span class="pack-label">${unlocked ? "Recebido" : "Ainda não encontrado"}</span>`}</div></article>`;
          })
          .join("") +
        "</div>";
    if (tab === "crystals") {
      $("pack-content").innerHTML =
        `<div class="pack-amulet">${necklace()}<div><h3>${earned.length} de 5 cristais</h3><p>Carlos guardava este amuleto dos cuidadores da ilha. Cada cristal lembra uma ação feita com os amigos.</p><p>Ele guarda a lembrança da jornada. Quem recupera a natureza são as pessoas e a própria vida, com tempo e cuidado.</p></div></div><div class="pack-grid">${memory.crystals.map((c) => `<article class="pack-card ${earned.includes(c.id) ? "" : "pack-locked"}" data-crystal="${c.id}">${window.GuardiaoColecao.gem(c.id - 1, earned.includes(c.id))}<div><h3>Cristal ${c.id === 1 ? "do" : "da"} ${c.name}</h3><p>${earned.includes(c.id) ? c.description : "Conclua a fase " + c.id + " para descobrir este cristal."}</p><span class="pack-label">${earned.includes(c.id) ? "Conquistado" : "Bloqueado"}</span></div></article>`).join("")}</div>`;
      geometry()
        .then(() => {
          if (
            dialog.open &&
            tab === "crystals" &&
            !dialog.querySelector(".pack-amulet svg")
          )
            render();
        })
        .catch(() => {
          $("pack-status").textContent =
            "A coleção continua salva. A ilustração do amuleto não carregou.";
        });
    }
    if (tab === "uniforms")
      $("pack-content").innerHTML =
        '<p class="pack-intro">Conheça os trajes da jornada. Kai veste automaticamente a roupa adequada a cada fase; esta aba é somente para consulta.</p><div class="pack-grid">' +
        memory.uniforms
          .map((u) => {
            const unlocked = memory.hasUniform(u.id);
            return `<article class="pack-card ${unlocked ? "" : "pack-locked"}" data-uniform="${u.id}">${window.GuardiaoColecao.uniform(u.id)}<div><h3>${u.name}</h3><p>${u.description}</p><span class="pack-label">${!unlocked ? "Disponível na fase " + u.phase : Number(document.body.dataset.phase) === u.phase || (u.phase === 0 && Number(document.body.dataset.phase) === 1) ? "Usado nesta fase" : "Traje da fase " + (u.phase || 1)}</span></div></article>`;
          })
          .join("") +
        "</div>";
  }
  function open({ section = "items" } = {}) {
    create();
    tab = section;
    for (const d of document.querySelectorAll("dialog[open]")) d.close();
    render();
    if (!dialog.open) dialog.showModal();
    document.dispatchEvent(new CustomEvent("guardiao:mochila-aberta"));
  }
  document.addEventListener("guardiao:memoria", () => {
    if (dialog?.open) render();
  });
  document.addEventListener("keydown", (e) => {
    if (
      e.key.toLowerCase() === "b" &&
      !e.repeat &&
      !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) &&
      document.body.dataset.page === "missions" &&
      !document.querySelector("dialog[open]")
    ) {
      e.preventDefault();
      open();
    }
  });
  window.GuardiaoMochila = Object.freeze({
    open,
    render,
    close: () => dialog?.close(),
  });
})();


;/* jogo/novo-amanha/interface.js */
"use strict";
(() => {
  let noticeTimer, notice;
  document.addEventListener("guardiao:descoberta", (e) => {
    if (!notice) {
      notice = document.createElement("p");
      notice.className = "care-notice";
      notice.setAttribute("role", "status");
      document.body.append(notice);
    }
    notice.textContent = e.detail.text;
    notice.hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => (notice.hidden = true), 3200);
  });
  class GameUI {
    constructor({ phase, state }) {
      this.phase = phase;
      this.state = state;
      this.jump = 0;
      this.pending = false;
      const pause = document.getElementById("pausa");
      if (pause)
        pause.innerHTML = '<svg class="pause-mark" viewBox="0 0 32 32" aria-hidden="true"><rect x="7" y="5" width="6" height="22" rx="2" fill="currentColor"/><rect x="19" y="5" width="6" height="22" rx="2" fill="currentColor"/></svg>';
      const btn = document.createElement("button");
      btn.id = "jump-action";
      btn.className = "round";
      btn.type = "button";
      btn.setAttribute("aria-label", "Pular no caminho");
      btn.innerHTML = window.GuardiaoIcones.markup("jump");
      document.getElementById("jogo")?.append(btn);
      btn.addEventListener("click", () => this.hop());
      document.addEventListener("keydown", (e) => {
        if (
          e.key.toLowerCase() === "j" &&
          !e.repeat &&
          !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)
        ) {
          e.preventDefault();
          this.hop();
        }
      });
      this.care = document.createElement("p");
      this.care.className = "current-care";
      document.querySelector(".mission,.missions")?.append(this.care);
      document.addEventListener("guardiao:mochila-aberta", () => {
        document.dispatchEvent(new CustomEvent("guardiao:neutralizar"));
      });
    }
    hop() {
      const s = this.state();
      if (
        s.locked ||
        s.action ||
        s.swimming ||
        this.jump > 0 ||
        this.phase === 2
      )
        return;
      this.jump = 0.56;
      window.GuardiaoAudio?.effect("passo", { gain: 0.35 });
    }
    update(dt) {
      this.jump = Math.max(0, this.jump - dt);
    }
    height() {
      return this.jump > 0
        ? Math.sin((1 - this.jump / 0.56) * Math.PI) * 16
        : 0;
    }
    objective(text) {
      if (this.care.textContent !== text) this.care.textContent = text;
    }
    open(id) {
      for (const d of document.querySelectorAll("dialog[open]"))
        if (d.id !== id) d.close();
      const d = document.getElementById(id);
      if (d && !d.open) d.showModal();
    }
    pack() {
      window.GuardiaoMochila.open();
    }
  }
  window.GuardiaoGameUI = GameUI;
})();


;/* jogo/novo-amanha/atlas.js */
window.GuardiaoAmanhaAtlas={"traje-andar":{"file":"assets/amanha-traje-andar.webp","width":864,"height":1312,"referenceHeight":286.0,"frames":[{"bounds":[14,22,189,294],"pivot":[108.5,316]},{"bounds":[230,28,189,288],"pivot":[324.5,316]},{"bounds":[448,17,183,299],"pivot":[539.5,316]},{"bounds":[665,14,182,302],"pivot":[756.0,316]},{"bounds":[19,362,178,282],"pivot":[108.0,644]},{"bounds":[236,362,176,282],"pivot":[324.0,644]},{"bounds":[445,361,190,283],"pivot":[540.0,644]},{"bounds":[662,360,187,284],"pivot":[755.5,644]},{"bounds":[14,685,188,287],"pivot":[108.0,972]},{"bounds":[232,688,184,284],"pivot":[324.0,972]},{"bounds":[446,679,187,293],"pivot":[539.5,972]},{"bounds":[665,678,182,294],"pivot":[756.0,972]},{"bounds":[20,1007,177,293],"pivot":[108.5,1300]},{"bounds":[239,1002,170,298],"pivot":[324.0,1300]},{"bounds":[444,1011,192,289],"pivot":[540.0,1300]},{"bounds":[660,1010,192,290],"pivot":[756.0,1300]}]},"traje-nadar":{"file":"assets/amanha-traje-nadar.webp","width":1584,"height":1376,"referenceHeight":266.0,"frames":[{"bounds":[12,82,371,250],"pivot":[197.5,332],"head":[239.0,164.0],"headRadius":[137.5,104.5]},{"bounds":[428,82,333,250],"pivot":[594.5,332],"head":[625.0,163.0],"headRadius":[110.52,101.0]},{"bounds":[820,62,341,270],"pivot":[990.5,332],"head":[1014.0,153.0],"headRadius":[108.0,110.5]},{"bounds":[1239,76,294,256],"pivot":[1386.0,332],"head":[1413.0,159.0],"headRadius":[97.75,100.5]},{"bounds":[78,401,241,275],"pivot":[198.5,676],"head":[204.0,481.0],"headRadius":[71.0,103.0]},{"bounds":[478,400,233,276],"pivot":[594.5,676],"head":[578.0,478.0],"headRadius":[80.5,111.0]},{"bounds":[832,405,317,271],"pivot":[990.5,676],"head":[966.0,488.0],"headRadius":[107.82,106.0]},{"bounds":[1232,414,309,262],"pivot":[1386.5,676],"head":[1375.0,501.0],"headRadius":[87.5,105.0]},{"bounds":[26,781,344,239],"pivot":[198.0,1020],"head":[170.0,864.0],"headRadius":[118.5,99.0]},{"bounds":[420,798,349,222],"pivot":[594.5,1020],"head":[566.0,879.0],"headRadius":[116.0,92.5]},{"bounds":[830,794,321,226],"pivot":[990.5,1020],"head":[941.0,876.0],"headRadius":[117.92,82.5]},{"bounds":[1231,798,310,222],"pivot":[1386.0,1020],"head":[1354.0,877.0],"headRadius":[106.5,84.0]},{"bounds":[89,1049,218,315],"pivot":[198.0,1364],"head":[196.0,1127.0],"headRadius":[60.5,136.5]},{"bounds":[484,1044,220,320],"pivot":[594.0,1364],"head":[598.0,1120.0],"headRadius":[58.5,129.0]},{"bounds":[845,1128,290,236],"pivot":[990.0,1364],"head":[1022.0,1206.0],"headRadius":[105.5,81.0]},{"bounds":[1236,1121,301,243],"pivot":[1386.5,1364],"head":[1410.0,1200.0],"headRadius":[100.5,88.5]}]},"traje-acoes":{"file":"assets/amanha-traje-acoes.webp","width":1280,"height":1312,"referenceHeight":294.0,"frames":[{"bounds":[20,16,279,300],"pivot":[159.5,316],"head":[161.0,169.0],"headRadius":[91.5,130.5]},{"bounds":[378,16,203,300],"pivot":[479.5,316],"head":[452.0,95.0],"headRadius":[73.5,129.5]},{"bounds":[703,13,194,303],"pivot":[800.0,316],"head":[805.0,81.0],"headRadius":[69.5,69.5]},{"bounds":[1023,15,194,301],"pivot":[1120.0,316],"head":[1110.0,86.0],"headRadius":[65.0,104.0]},{"bounds":[22,371,276,273],"pivot":[160.0,644],"head":[168.0,442.0],"headRadius":[66.5,86.77]},{"bounds":[341,356,278,288],"pivot":[480.0,644],"head":[473.0,428.0],"headRadius":[67.0,85.0]},{"bounds":[687,356,226,288],"pivot":[800.0,644],"head":[774.0,423.0],"headRadius":[65.0,85.0]},{"bounds":[1000,363,241,281],"pivot":[1120.5,644],"head":[1116.0,437.0],"headRadius":[65.5,73.5]},{"bounds":[16,706,288,266],"pivot":[160.0,972],"head":[158.0,781.0],"headRadius":[89.0,98.5]},{"bounds":[378,713,204,259],"pivot":[480.0,972],"head":[486.0,789.0],"headRadius":[71.5,93.0]},{"bounds":[680,705,239,267],"pivot":[799.5,972],"head":[777.0,779.0],"headRadius":[72.5,71.0]},{"bounds":[996,705,248,267],"pivot":[1120.0,972],"head":[1100.0,777.0],"headRadius":[71.5,102.5]},{"bounds":[13,1022,294,278],"pivot":[160.0,1300],"head":[174.0,1116.0],"headRadius":[94.5,120.0]},{"bounds":[372,1044,217,256],"pivot":[480.5,1300],"head":[485.0,1130.0],"headRadius":[69.5,101.5]},{"bounds":[682,1044,236,256],"pivot":[800.0,1300],"head":[818.0,1131.0],"headRadius":[69.5,103.5]},{"bounds":[992,1020,256,280],"pivot":[1120.0,1300],"head":[1133.0,1112.0],"headRadius":[94.5,121.5]}]},"fauna-brasileira":{"file":"assets/amanha-fauna-brasileira.webp","width":1488,"height":1088,"referenceHeight":238.5,"frames":[{"bounds":[51,17,270,243],"pivot":[186.0,260]},{"bounds":[425,18,266,242],"pivot":[558.0,260]},{"bounds":[784,22,293,238],"pivot":[930.5,260]},{"bounds":[1158,14,288,246],"pivot":[1302.0,260]},{"bounds":[30,298,312,234],"pivot":[186.0,532]},{"bounds":[398,304,320,228],"pivot":[558.0,532]},{"bounds":[770,303,320,229],"pivot":[930.0,532]},{"bounds":[1144,293,316,239],"pivot":[1302.0,532]},{"bounds":[30,568,313,236],"pivot":[186.5,804]},{"bounds":[401,568,314,236],"pivot":[558.0,804]},{"bounds":[756,564,347,240],"pivot":[929.5,804]},{"bounds":[1138,567,328,237],"pivot":[1302.0,804]},{"bounds":[44,841,284,235],"pivot":[186.0,1076]},{"bounds":[412,835,293,241],"pivot":[558.5,1076]},{"bounds":[781,836,298,240],"pivot":[930.0,1076]},{"bounds":[1152,840,299,236],"pivot":[1301.5,1076]}]},"moradores":{"file":"assets/amanha-moradores.webp","width":1232,"height":1408,"referenceHeight":289.0,"frames":[{"bounds":[84,55,141,285],"pivot":[154.5,340]},{"bounds":[391,53,142,287],"pivot":[462.0,340]},{"bounds":[641,54,258,286],"pivot":[770.0,340]},{"bounds":[937,55,282,285],"pivot":[1078.0,340]},{"bounds":[60,392,188,300],"pivot":[154.0,692]},{"bounds":[369,392,186,300],"pivot":[462.0,692]},{"bounds":[645,399,250,293],"pivot":[770.0,692]},{"bounds":[954,401,249,291],"pivot":[1078.5,692]},{"bounds":[39,720,230,324],"pivot":[154.0,1044]},{"bounds":[348,719,227,325],"pivot":[461.5,1044]},{"bounds":[645,721,250,323],"pivot":[770.0,1044]},{"bounds":[956,721,245,323],"pivot":[1078.5,1044]},{"bounds":[83,1112,142,284],"pivot":[154.0,1396]},{"bounds":[392,1113,140,283],"pivot":[462.0,1396]},{"bounds":[678,1113,183,283],"pivot":[769.5,1396]},{"bounds":[984,1114,188,282],"pivot":[1078.0,1396]}]},"uniforme-resgate":{"file":"assets/amanha-uniforme-resgate.webp","width":1008,"height":1376,"referenceHeight":309.5,"frames":[{"bounds":[14,24,225,308],"pivot":[126.5,332]},{"bounds":[265,23,226,309],"pivot":[378.0,332]},{"bounds":[536,15,189,317],"pivot":[630.5,332]},{"bounds":[787,17,190,315],"pivot":[882.0,332]},{"bounds":[40,379,171,297],"pivot":[125.5,676]},{"bounds":[287,375,182,301],"pivot":[378.0,676]},{"bounds":[536,366,189,310],"pivot":[630.5,676]},{"bounds":[788,366,189,310],"pivot":[882.5,676]},{"bounds":[30,718,193,302],"pivot":[126.5,1020]},{"bounds":[279,719,198,301],"pivot":[378.0,1020]},{"bounds":[538,718,184,302],"pivot":[630.0,1020]},{"bounds":[787,714,190,306],"pivot":[882.0,1020]},{"bounds":[40,1061,172,303],"pivot":[126.0,1364]},{"bounds":[290,1059,175,305],"pivot":[377.5,1364]},{"bounds":[538,1058,183,306],"pivot":[629.5,1364]},{"bounds":[788,1058,189,306],"pivot":[882.5,1364]}]},"uniforme-plantio":{"file":"assets/amanha-uniforme-plantio.webp","width":848,"height":1360,"referenceHeight":291.0,"frames":[{"bounds":[15,36,182,292],"pivot":[106.0,328]},{"bounds":[228,29,180,299],"pivot":[318.0,328]},{"bounds":[443,34,174,294],"pivot":[530.0,328]},{"bounds":[658,34,168,294],"pivot":[742.0,328]},{"bounds":[26,378,159,290],"pivot":[105.5,668]},{"bounds":[234,378,168,290],"pivot":[318.0,668]},{"bounds":[443,383,174,285],"pivot":[530.0,668]},{"bounds":[652,383,179,285],"pivot":[741.5,668]},{"bounds":[14,720,185,288],"pivot":[106.5,1008]},{"bounds":[227,719,182,289],"pivot":[318.0,1008]},{"bounds":[439,721,182,287],"pivot":[530.0,1008]},{"bounds":[652,726,181,282],"pivot":[742.5,1008]},{"bounds":[18,1035,177,313],"pivot":[106.5,1348]},{"bounds":[230,1037,175,311],"pivot":[317.5,1348]},{"bounds":[440,1045,181,303],"pivot":[530.5,1348]},{"bounds":[651,1047,182,301],"pivot":[742.0,1348]}]},"uniforme-voluntario":{"file":"assets/amanha-uniforme-voluntario.webp","width":880,"height":1312,"referenceHeight":295.5,"frames":[{"bounds":[14,16,193,300],"pivot":[110.5,316]},{"bounds":[238,17,185,299],"pivot":[330.5,316]},{"bounds":[458,15,185,301],"pivot":[550.5,316]},{"bounds":[680,17,179,299],"pivot":[769.5,316]},{"bounds":[21,352,178,292],"pivot":[110.0,644]},{"bounds":[242,353,177,291],"pivot":[330.5,644]},{"bounds":[460,359,180,285],"pivot":[550.0,644]},{"bounds":[681,354,178,290],"pivot":[770.0,644]},{"bounds":[16,673,187,299],"pivot":[109.5,972]},{"bounds":[237,675,186,297],"pivot":[330.0,972]},{"bounds":[460,677,180,295],"pivot":[550.0,972]},{"bounds":[676,678,187,294],"pivot":[769.5,972]},{"bounds":[21,1009,178,291],"pivot":[110.0,1300]},{"bounds":[242,1009,175,291],"pivot":[329.5,1300]},{"bounds":[462,1008,177,292],"pivot":[550.5,1300]},{"bounds":[680,1011,181,289],"pivot":[770.5,1300]}]},"reencontros":{"file":"assets/amanha-reencontros.webp","width":1952,"height":864,"referenceHeight":387.0,"frames":[{"bounds":[12,40,464,380],"pivot":[244.0,420]},{"bounds":[528,34,409,386],"pivot":[732.5,420]},{"bounds":[1082,44,276,376],"pivot":[1220.0,420]},{"bounds":[1504,32,408,388],"pivot":[1708.0,420]},{"bounds":[54,447,381,405],"pivot":[244.5,852]},{"bounds":[543,448,378,404],"pivot":[732.0,852]},{"bounds":[992,450,457,402],"pivot":[1220.5,852]},{"bounds":[1492,499,431,353],"pivot":[1707.5,852]}]}};


;/* jogo/novo-amanha/arte.js */
"use strict";
(() => {
  const base = new URL("./", ({src:new URL("../novo-amanha/arte.js?v=amanha-1",document.baseURI).href}).src),
    atlas = window.GuardiaoAmanhaAtlas;
  class AdventureArt {
    constructor(phase) {
      this.phase = phase;
      this.images = new Map();
      this.water = null;
      this.loading = new Map();
      window.GuardiaoIcones.load()
        .then((im) => (this.iconImage = im))
        .catch(() => {});
    }
    async ensure(name) {
      if (this.images.has(name)) return;
      if (!this.loading.has(name))
        this.loading.set(
          name,
          (async () => {
            const d = atlas[name];
            if (!d) throw Error("Prancha ausente: " + name);
            const im = new Image();
            im.src = new URL(d.file, base).href;
            await im.decode();
            if (im.naturalWidth !== d.width || im.naturalHeight !== d.height)
              throw Error("Prancha incompatível: " + name);
            this.images.set(name, im);
          })(),
        );
      return this.loading.get(name);
    }
    async load() {
      const selected = window.GuardiaoMemoria.read().uniform;
      const outfit = {
        protecao: "traje-andar",
        resgate: "uniforme-resgate",
        plantio: "uniforme-plantio",
        voluntario: "uniforme-voluntario",
      };
      const role = {
        3: "uniforme-resgate",
        4: "uniforme-plantio",
        5: "uniforme-voluntario",
      }[this.phase];
      const list = [
        "moradores",
        ...(this.phase === 2
          ? ["traje-andar", "traje-nadar", "traje-acoes"]
          : []),
        ...([3, 6].includes(this.phase) ? ["fauna-brasileira"] : []),
        ...(role ? [role] : []),
        ...(this.phase === 6
          ? ["reencontros"]
          : outfit[selected]
            ? [outfit[selected]]
            : []),
      ];
      await Promise.all([...new Set(list)].map((name) => this.ensure(name)));
    }
    draw(ctx, name, index, x, y, height, { flip = false, alpha = 1 } = {}) {
      const d = atlas[name],
        im = this.images.get(name);
      if (!d || !im) return false;
      const f = d.frames[index % d.frames.length],
        b = f.bounds,
        k = height / d.referenceHeight;
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.translate(x, y);
      if (flip) ctx.scale(-1, 1);
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
    outfit(ctx, player, time, reduced, height = 63) {
      const current = window.GuardiaoMemoria.read().uniform,
        name = {
          protecao: "traje-andar",
          resgate: "uniforme-resgate",
          plantio: "uniforme-plantio",
          voluntario: "uniforme-voluntario",
        }[current];
      if (!name) return false;
      if (!this.images.has(name)) {
        this.ensure(name).catch(() => {});
        return false;
      }
      const f =
        player.direction * 2 +
        (player.moving && !reduced ? Math.floor(player.distance / 15) % 2 : 0);
      return this.draw(ctx, name, f, player.x, player.y, height);
    }
    river(
      ctx,
      player,
      time,
      reduced,
      { kind = null, progress = 0, dressing = false } = {},
    ) {
      const swimming = player.swimming && !dressing;
      const name =
          dressing || kind
            ? "traje-acoes"
            : swimming
              ? "traje-nadar"
              : "traje-andar",
        row = dressing ? 0 : kind === "turtle" ? 12 : kind === "fish" ? 8 : 4,
        frame =
          dressing || kind
            ? row + Math.min(3, Math.floor(progress * 4))
            : player.direction * 2 +
              (!reduced && player.moving ? Math.floor(time * 7) % 2 : 0),
        h = swimming ? 55 : 63;
      if (swimming) {
        const d = atlas[name],
          f = d.frames[frame],
          k = h / d.referenceHeight;
        const head = f.head || [
          f.bounds[0] + f.bounds[2] * 0.5,
          f.bounds[1] + f.bounds[3] * 0.23,
        ];
        const drawX = player.x - (head[0] - f.pivot[0]) * k;
        const drawY = player.y - 26 - (head[1] - f.pivot[1]) * k;
        // The full prone body stays visible beneath the water. Only the head and visor emerge.
        this.draw(ctx, name, frame, drawX, drawY, h, { alpha: 0.62 });
        ctx.save();
        ctx.beginPath();
        const radius = f.headRadius || [70, 75];
        ctx.ellipse(
          player.x,
          player.y - 26,
          Math.max(10, radius[0] * k),
          Math.max(12, radius[1] * k),
          0,
          0,
          Math.PI * 2,
        );
        ctx.clip();
        this.draw(ctx, name, frame, drawX, drawY, h);
        ctx.restore();
        ctx.strokeStyle = "#d6f7e5b8";
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.ellipse(
          player.x,
          player.y - 8,
          25 + Math.sin(time * 4) * 2,
          6,
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      } else this.draw(ctx, name, frame, player.x, player.y, h);
      document.body.dataset.riverPose = name + ":" + frame;
      return name + ":" + frame;
    }
    animal(
      ctx,
      t,
      time,
      reduced,
      x = t.position.x,
      y = t.position.y,
      height = 36,
    ) {
      const row = { capivara: 0, mico: 1, tucano: 2, passaro: 3 }[t.speciesKey];
      if (row === undefined) return false;
      const pending = t.status === "pending",
        frame =
          row * 4 +
          (pending
            ? !reduced && time % 4.3 > 4.05
              ? 1
              : 0
            : 2 + (!reduced ? Math.floor(time * 6) % 2 : 0));
      return this.draw(ctx, "fauna-brasileira", frame, x, y, height, {
        flip: t.facingRight === false,
      });
    }
    community(
      ctx,
      time,
      reduced,
      ratio,
      { transport = false, bus = false, epilogue = false } = {},
    ) {
      const active = ratio >= 0.2 || epilogue,
        step = reduced ? 0 : Math.floor(time * 5) % 2,
        positions =
          this.phase === 5
            ? [
                [555, 430],
                [735, 513],
                [550, 368],
                [868, 430],
              ]
            : [
                [350, 285],
                [445, 255],
                [340, 315],
                [475, 285],
              ];
      if (this.phase !== 5 && !epilogue && ratio < 0.45) return;
      const rows = this.phase === 5 ? [0, 1, 2, 3] : [1, 3];
      for (const row of rows) {
        const [px, py] = positions[row],
          x = row === 2 && transport ? 400 + ((time * 27) % 440) : px,
          y = py + (!reduced && active ? Math.sin(time * 2 + row) * 0.6 : 0),
          f =
            row * 4 +
            ((row === 2 ? transport : active)
              ? 2 + step
              : !reduced && time % 4.5 > 4.2
                ? 1
                : 0);
        this.draw(
          ctx,
          "moradores",
          f,
          x,
          y,
          row === 0 ? 40 : row === 1 ? 43 : row === 2 ? 52 : 58,
        );
      }
      if (this.phase === 5 && transport) {
        ctx.save();
        ctx.strokeStyle = "#7aaf88";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(390, 389);
        ctx.lineTo(900, 389);
        ctx.stroke();
        ctx.strokeStyle = "#f4e8b4";
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 8]);
        ctx.stroke();
        ctx.restore();
      }
      if (this.phase === 5 && bus) {
        const x = 625 + (reduced ? 0 : Math.sin(time * 0.2) * 230);

        if (this.iconImage)
          window.GuardiaoIcones.paint(ctx, this.iconImage, "bus", x, 573, 56);
      }
    }
  }
  window.GuardiaoAdventureArt = AdventureArt;
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


;/* jogo/vida-em-equilibrio/atlas.js */
window.GuardiaoEquilibrioAtlas={"fauna-grande":{"file":"assets/equilibrio-fauna-grande.webp","width":1536,"height":876,"referenceHeight":212.5,"frames":[{"bounds":[26,106,331,174],"pivot":[191.5,280]},{"bounds":[406,89,339,191],"pivot":[575.5,280]},{"bounds":[794,15,332,265],"pivot":[960.0,280]},{"bounds":[1178,13,332,267],"pivot":[1344.0,280]},{"bounds":[16,369,353,203],"pivot":[192.5,572]},{"bounds":[404,366,344,206],"pivot":[576.0,572]},{"bounds":[781,357,358,215],"pivot":[960.0,572]},{"bounds":[1165,346,358,226],"pivot":[1344.0,572]},{"bounds":[24,681,335,183],"pivot":[191.5,864]},{"bounds":[410,654,331,210],"pivot":[575.5,864]},{"bounds":[788,614,343,250],"pivot":[959.5,864]},{"bounds":[1175,615,338,249],"pivot":[1344.0,864]}]},"fauna-copa":{"file":"assets/equilibrio-fauna-copa.webp","width":1808,"height":848,"referenceHeight":301.5,"frames":[{"bounds":[36,121,381,291],"pivot":[226.5,412]},{"bounds":[486,127,383,285],"pivot":[677.5,412]},{"bounds":[936,14,388,398],"pivot":[1130.0,412]},{"bounds":[1368,100,428,312],"pivot":[1582.0,412]},{"bounds":[44,561,363,275],"pivot":[225.5,836]},{"bounds":[494,567,367,269],"pivot":[677.5,836]},{"bounds":[940,473,379,363],"pivot":[1129.5,836]},{"bounds":[1382,473,399,363],"pivot":[1581.5,836]}]},"vida-rio":{"file":"assets/equilibrio-vida-rio.webp","width":1600,"height":792,"referenceHeight":210.5,"frames":[{"bounds":[30,39,341,213],"pivot":[200.5,252]},{"bounds":[436,40,329,212],"pivot":[600.5,252]},{"bounds":[826,43,348,209],"pivot":[1000.0,252]},{"bounds":[1228,44,343,208],"pivot":[1399.5,252]},{"bounds":[26,326,349,190],"pivot":[200.5,516]},{"bounds":[427,326,346,190],"pivot":[600.0,516]},{"bounds":[814,319,373,197],"pivot":[1000.5,516]},{"bounds":[1215,320,370,196],"pivot":[1400.0,516]},{"bounds":[14,560,373,220],"pivot":[200.5,780]},{"bounds":[414,557,371,223],"pivot":[599.5,780]},{"bounds":[824,565,352,215],"pivot":[1000.0,780]},{"bounds":[1218,540,363,240],"pivot":[1399.5,780]}]},"kai-acoes":{"file":"assets/equilibrio-kai-acoes.webp","width":1552,"height":1104,"referenceHeight":270.0,"frames":[{"bounds":[91,92,206,264],"pivot":[194.0,356],"head":[200.0,197.0],"headRadius":[79.0,87.5]},{"bounds":[464,106,237,250],"pivot":[582.5,356],"head":[580.0,204.0],"headRadius":[84.5,88.0]},{"bounds":[816,110,309,246],"pivot":[970.5,356],"head":[974.0,209.0],"headRadius":[86.0,89.5]},{"bounds":[1176,124,364,232],"pivot":[1358.0,356],"head":[1364.0,223.0],"headRadius":[97.0,89.0]},{"bounds":[28,482,331,242],"pivot":[193.5,724],"head":[196.0,578.0],"headRadius":[87.0,88.0]},{"bounds":[481,464,202,260],"pivot":[582.0,724],"head":[582.0,572.0],"headRadius":[77.5,84.5]},{"bounds":[874,448,191,276],"pivot":[969.5,724],"head":[970.0,560.0],"headRadius":[75.5,86.0]},{"bounds":[1263,439,190,285],"pivot":[1358.0,724],"head":[1354.0,558.0],"headRadius":[76.0,88.0]},{"bounds":[26,756,337,336],"pivot":[194.5,1092]},{"bounds":[415,754,334,338],"pivot":[582.0,1092]},{"bounds":[808,754,325,338],"pivot":[970.5,1092]},{"bounds":[1189,751,338,341],"pivot":[1358.0,1092]}]}};


;/* jogo/cuidado-acessivel/elenco.js */
"use strict";
(() => {
  const positions = {
    1: [
      [330, 300],
      [265, 470],
    ],
    2: [
      [221, 228],
      [1000, 560],
    ],
    3: [
      [486, 278],
      [640, 604],
    ],
    4: [
      [436, 179],
      [810, 576],
    ],
    5: [
      [555, 430],
      [780, 518],
      [550, 368],
      [952, 477],
    ],
  };
  const habitats = {
    mico: { x: 746, y: 159 },
    tucano: { x: 1040, y: 270 },
    passaro: { x: 769, y: 211 },
    capivara: { x: 1052, y: 310 },
    onca: { x: 877, y: 575 },
    arara: { x: 703, y: 109 },
    tamandua: { x: 620, y: 626 },
    anta: { x: 1063, y: 402 },
    preguica: { x: 489, y: 144 },
  };
  const neighbors = {
    1: [
      [450, 300, 1, "Tiago"],
      [730, 350, 2, "Lia"],
      [1090, 580, 3, "Bia"],
      [1020, 375, 4, "Luzia"],
    ],
    2: [
      [330, 300, 0, "João"],
      [935, 300, 2, "Lia"],
      [1020, 470, 3, "Bia"],
      [920, 470, 4, "Luzia"],
    ],
    3: [
      [545, 270, 0, "João"],
      [690, 350, 1, "Tiago"],
      [1000, 340, 3, "Bia"],
      [680, 500, 4, "Luzia"],
    ],
    4: [
      [620, 330, 0, "João"],
      [950, 420, 1, "Tiago"],
      [720, 570, 2, "Lia"],
      [450, 490, 4, "Luzia"],
    ],
    5: [
      [600, 450, 1, "Tiago"],
      [760, 300, 3, "Bia"],
    ],
  };
  function actors(phase, time = 0, ratio = 0, reduced = false) {
    const original = (positions[phase] || []).map(([x, y], i) => {
      const row = phase === 5 ? i : [1, 3][i],
        moving = phase === 5 && row === 2 && ratio >= 1;
      const xx = moving && !reduced ? 400 + ((time * 24) % 470) : x;
      const stage = ratio >= 1 ? 3 : ratio > 0 ? 2 : 0;
      return {
        id: "vizinho-" + i,
        row,
        x: xx,
        y,
        height: 56,
        solid: row !== 2,
        frame:
          row * 4 +
          (stage === 3
            ? reduced
              ? 3
              : 2 + (Math.floor(time * 4 + i) % 2)
            : stage),
      };
    });
    return [
      ...original,
      ...(neighbors[phase] || []).map(([x, y, role, name], i) => ({
        id: "aliado-" + i,
        x,
        y,
        role,
        name,
        height: 61,
        solid: true,
        pose:
          ratio >= 1 ? 1 : !reduced && Math.sin(time * 0.8 + i) > 0.8 ? 2 : 0,
        tip: {
          1: "A ponte é o caminho seguro. Cuide dos focos antes dos animais!",
          2: "Cada resíduo fora da água ajuda a vida do rio.",
          3: "Pense na pergunta. Os amigos precisam de cuidado!",
          4: "Plante a muda e regue. Um cuidado de cada vez!",
          5: "Cada tipo de resíduo tem seu lugar.",
        }[phase],
      })),
    ];
  }
  window.GuardiaoElenco = Object.freeze({
    actors,
    habitat: (name) => habitats[name] && { ...habitats[name] },
  });
})();


;/* jogo/viva/elenco.js */
"use strict";
(() => {
  const original = window.GuardiaoElenco;
  if (original)
    window.GuardiaoElenco = Object.freeze({ ...original, actors: () => [] });
  if (window.GuardiaoFasesJogaveis) {
    const phases = structuredClone(GuardiaoFasesJogaveis);
    window.GuardiaoFasesJogaveis = Object.freeze(phases);
  }
})();


;/* jogo/cuidado-acessivel/geometria.js */
"use strict";
(() => {
  const previous = window.GuardiaoNavegacao;
  if (window.GuardiaoFasesJogaveis) {
    const p = structuredClone(GuardiaoFasesJogaveis);
    p[2].water = [
      [520, 0],
      [738, 0],
      [718, 100],
      [752, 218],
      [810, 285],
      [846, 325],
      [806, 376],
      [879, 423],
      [902, 484],
      [867, 544],
      [847, 612],
      [810, 720],
      [453, 720],
      [476, 646],
      [432, 597],
      [437, 548],
      [363, 515],
      [313, 468],
      [296, 408],
      [304, 344],
      [359, 298],
      [421, 280],
      [431, 216],
      [470, 169],
      [474, 104],
    ];
    p[2].bridge = { x: 400, y: 162, w: 400, h: 34 };
    p[2].docks = [
      [
        [286, 236],
        [430, 260],
        [430, 286],
        [300, 265],
      ],
    ];
    p[2].obstacles = [
      p[2].obstacles[0],
      { x: 405, y: 371, rx: 53, ry: 25 },
      { x: 440, y: 554, rx: 57, ry: 24 },
      { x: 795, y: 272, rx: 45, ry: 24 },
    ];
    p[3].tasks.find((t) => t.id === "macaco").x = 934;
    p[3].tasks.find((t) => t.id === "macaco").y = 111;
    p[3].tasks.find((t) => t.id === "ave").x = 262;
    p[3].tasks.find((t) => t.id === "ave").y = 424;
    p[3].obstacles[1] = { x: 896, y: 338, rx: 30, ry: 19 };
    const wall = (a, b) => ({ a, b, r: 3 });
    p[3].barriers = [
      [
        [112, 209],
        [264, 229],
      ],
      [
        [371, 172],
        [415, 156],
      ],
      [
        [621, 60],
        [709, 86],
      ],
      [
        [790, 77],
        [789, 116],
      ],
      [
        [789, 116],
        [925, 155],
      ],
      [
        [963, 150],
        [1047, 130],
      ],
      [
        [156, 353],
        [245, 349],
      ],
      [
        [295, 395],
        [351, 418],
      ],
      [
        [351, 418],
        [346, 454],
      ],
      [
        [305, 461],
        [181, 497],
      ],
      [
        [476, 525],
        [555, 500],
      ],
      [
        [478, 561],
        [480, 599],
      ],
      [
        [480, 599],
        [594, 630],
      ],
      [
        [712, 499],
        [824, 522],
      ],
      [
        [800, 640],
        [850, 632],
      ],
      [
        [1060, 383],
        [1190, 410],
      ],
      [
        [1187, 410],
        [1191, 471],
      ],
      [
        [1048, 527],
        [1192, 509],
      ],
      [
        [947, 436],
        [952, 485],
      ],
    ].map(([a, b]) => wall(a, b));
    p[4].obstacles[1] = { x: 308, y: 307, rx: 61, ry: 32 };
    Object.assign(
      p[5].tasks.find((t) => t.id === "reciclavel2"),
      { x: 945, y: 391 },
    );
    p[5].obstacles[3] = { x: 482, y: 314, rx: 57, ry: 28 };
    p[5].obstacles.push({ x: 865, y: 450, rx: 55, ry: 25 });
    p[5].barriers = [
      [
        [195, 560],
        [295, 587],
      ],
      [
        [325, 590],
        [430, 612],
      ],
      [
        [835, 337],
        [878, 365],
      ],
      [
        [908, 351],
        [973, 371],
      ],
      [
        [906, 566],
        [1007, 538],
      ],
    ].map(([a, b]) => wall(a, b));
    p[5].noWalkWater = [
      [
        [1115, 337],
        [1240, 350],
        [1260, 720],
        [1020, 720],
        [1051, 579],
        [1090, 472],
      ],
    ];
    p[5].dryBridge = { x: 1050, y: 375, w: 225, h: 71 };
    p[5].floor.splice(5, 0, [1103, 364], [1260, 378], [1260, 448], [1098, 449]);
    for (const id of [2, 3, 4, 5])
      p[id].obstacles.push(
        ...GuardiaoElenco.actors(id)
          .filter((a) => a.solid)
          .map((a) => ({ name: a.id, x: a.x, y: a.y, rx: 10, ry: 7 })),
      );
    // Os três recipientes são sólidos apenas junto aos pés.
    for (const offset of [-74, 0, 74])
      p[5].obstacles.push({
        name: "lixeira",
        x: p[5].station.x + offset,
        y: p[5].station.y - 4,
        rx: 20,
        ry: 9,
      });
    window.GuardiaoFasesJogaveis = Object.freeze(p);
  }
  if (!previous) return;
  const { distance, inside } = previous;
  function segment(p, a, b) {
    const dx = b[0] - a[0],
      dy = b[1] - a[1],
      d = dx * dx + dy * dy,
      t = d
        ? Math.max(0, Math.min(1, ((p.x - a[0]) * dx + (p.y - a[1]) * dy) / d))
        : 0;
    return Math.hypot(p.x - a[0] - t * dx, p.y - a[1] - t * dy);
  }
  class Navigation extends previous.Navigation {
    constructor(data) {
      super(data);
      this.staticGrid = this.grid.slice();
      this.dynamicSignature = "";
    }
    setDynamic(points) {
      const blocking = points.filter((p) => p.type !== "bed");
      const signature = blocking.map((p) => `${p.id}:${p.x}:${p.y}`).join("|");
      if (signature === this.dynamicSignature) return;
      this.dynamicSignature = signature;
      this.dynamic = blocking;
      this.grid.set(this.staticGrid);
      for (let i = 0; i < this.grid.length; i++)
        if (
          this.grid[i] &&
          blocking.some((p) => distance(p, this.point(i)) < 23)
        )
          this.grid[i] = 0;
    }
    walkable(p, r = 7) {
      const b = this.data.dryBridge,
        inBridge =
          b && p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h;
      return (
        super.walkable(p, r) &&
        !(this.data.barriers || []).some(
          (w) => segment(p, w.a, w.b) < w.r + r,
        ) &&
        (!(this.data.noWalkWater || []).some((poly) => inside(p, poly)) ||
          inBridge)
      );
    }
    interactionVisible(a, b) {
      const steps = Math.max(1, Math.ceil(distance(a, b) / 4));
      for (let i = 0; i <= steps; i++) {
        const p = {
          x: a.x + ((b.x - a.x) * i) / steps,
          y: a.y + ((b.y - a.y) * i) / steps,
        };
        if (
          (this.data.barriers || []).some(
            (w) => segment(p, w.a, w.b) <= w.r + 1,
          )
        )
          return false;
      }
      return true;
    }
    approach(from, target, range = 55) {
      const options = [];
      for (const radius of [range, range * 0.72, range * 0.48])
        for (let i = 0; i < 32; i++) {
          const a = (i * Math.PI) / 16,
            p = {
              x: target.x + Math.cos(a) * radius,
              y: target.y + Math.sin(a) * radius,
            };
          if (this.walkable(p) && this.interactionVisible(p, target))
            options.push(p);
        }
      options.sort((a, b) => distance(from, a) - distance(from, b));
      for (const p of options) {
        const path = this.route(from, p);
        if (path.length) return path;
      }
      return [];
    }
    swimming(p) {
      return (
        super.swimming(p) &&
        !(this.data.docks || []).some((poly) => inside(p, poly))
      );
    }
  }
  window.GuardiaoNavegacao = { ...previous, Navigation };
})();


;/* jogo/reencontro/conteudo.js */
"use strict";
(() => {
  if (!window.GuardiaoFasesJogaveis) return;
  const phases = structuredClone(GuardiaoFasesJogaveis);
  const fauna = phases[3];
  const problems = {
    macaco: ["cage", "Mico preso no abrigo"],
    tucano: ["cage", "Tucano preso na gaiola"],
    ave: ["wing", "Passarinho com a asa ferida"],
    capivara: ["net", "Capivara presa numa rede"],
    onca: ["paw", "Onça com a pata machucada"],
    arara: ["net", "Arara enroscada em uma linha"],
    tamandua: ["log", "Tamanduá bloqueado por um galho"],
    anta: ["net", "Anta presa numa rede abandonada"],
    preguica: ["log", "Preguiça isolada por um galho caído"],
  };
  for (const t of fauna.tasks) {
    if (!problems[t.id]) continue;
    [t.problem, t.problemLabel] = problems[t.id];
    t.home = GuardiaoElenco.habitat(t.speciesKey);
  }
  fauna.goals.find((g) => g[0] === "animal")[2] = fauna.tasks.filter(
    (t) => t.type !== "key",
  ).length;
  fauna.intro[1] =
    "Encontre a chave. Há amigos feridos e presos em redes e galhos. Vamos ajudá-los com cuidado!";
  fauna.hint =
    "A patinha mostra quem precisa de ajuda. Chegue perto para cuidar.";
  for (const t of phases[2].tasks) {
    if (t.type === "fish") {
      t.problem = t.id === "peixes1" ? "net" : "plastic";
      t.problemLabel =
        t.id === "peixes1"
          ? "Peixes enroscados numa rede"
          : "Peixes presos no plástico";
      // O peixe é libertado onde está. Nunca é levado para um abrigo em terra.
      t.home = { x: t.x + 36, y: t.y - 16 };
    } else if (t.type === "turtle") {
      t.problem = "plastic";
      t.problemLabel = "Tartaruga presa em plástico e canudo";
      // Praia livre ao norte da rocha grande: o casco não fica sobre o capim.
      t.x = 970;
      t.y = 340;
      t.home = { x: 833, y: 445 };
    }
  }
  phases[2].intro[1] =
    "Vista o traje, recolha o lixo e solte os peixes das embalagens. A tartaruga precisa de ajuda na areia!";
  phases[5].station = { x: 240, y: 535 };
  phases[5].obstacles.push(
    ...[
      { x: 154, y: 514 },
      { x: 225, y: 493 },
      { x: 300, y: 472 },
    ].map((p) => ({ ...p, rx: 18, ry: 9 })),
  );
  window.GuardiaoFasesJogaveis = Object.freeze(phases);
  // A física corresponde à ilustração aprovada, antes das árvores aleatórias.
  window.ReencontroGeometria = Object.fromEntries(
    [2, 3, 4, 5].map((id) => [
      id,
      structuredClone(
        Object.fromEntries(
          [
            "floor",
            "water",
            "bridge",
            "docks",
            "obstacles",
            "barriers",
            "noWalkWater",
            "dryBridge",
          ].map((k) => [k, phases[id][k]]),
        ),
      ),
    ]),
  );
})();


;/* jogo/revisao-paisagem/plantas-atlas.js */
window.GuardiaoPlantasAtlas = {
  file: "assets/paisagem-plantas.webp",
  width: 1744,
  height: 1140,
  referenceHeight: 328.0,
  frames: [
    { bounds: [144, 204, 149, 164], pivot: [218.5, 368] },
    { bounds: [525, 64, 258, 304], pivot: [654.0, 368] },
    { bounds: [900, 22, 380, 346], pivot: [1090.0, 368] },
    { bounds: [1324, 25, 404, 343], pivot: [1526.0, 368] },
    { bounds: [134, 589, 169, 159], pivot: [218.5, 748] },
    { bounds: [526, 443, 255, 305], pivot: [653.5, 748] },
    { bounds: [890, 414, 399, 334], pivot: [1089.5, 748] },
    { bounds: [1322, 420, 409, 328], pivot: [1526.5, 748] },
    { bounds: [135, 943, 166, 185], pivot: [218.0, 1128] },
    { bounds: [524, 800, 259, 328], pivot: [653.5, 1128] },
    { bounds: [893, 773, 394, 355], pivot: [1090.0, 1128] },
    { bounds: [1328, 773, 397, 355], pivot: [1526.5, 1128] },
  ],
};


;/* jogo/revisao-paisagem/plantas.js */
"use strict";
(() => {
  const before = window.GuardiaoColecao,
    atlas = window.GuardiaoPlantasAtlas;
  const file = new URL(atlas.file, ({src:new URL("../revisao-paisagem/plantas.js?v=paisagem-1",document.baseURI).href}).src).href;
  let nextClip = 0;
  function plant(name) {
    const row = { ipê: 0, ingá: 1, aroeira: 2 }[name] ?? 0,
      b = atlas.frames[row * 4 + 1].bounds;
    const id = "plant-frame-" + ++nextClip;
    return `<svg viewBox="${b.join(" ")}" aria-hidden="true"><defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse"><rect x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}"/></clipPath></defs><image href="${file}" width="${atlas.width}" height="${atlas.height}" clip-path="url(#${id})"/></svg>`;
  }
  window.GuardiaoColecao = Object.freeze({ ...before, plant });
})();


;/* jogo/viva/etiquetas.js */
"use strict";
(() => {
  window.GuardiaoEtiquetas = Object.freeze({
    position(x, y, w, view, width, height) {
      const { s, ox, oy } = view;
      let screenX = Math.max(
        8 + (w * s) / 2,
        Math.min(width - 8 - (w * s) / 2, x * s + ox),
      );
      let screenY = Math.max(22, Math.min(height - 10, y * s + oy));
      // As etiquetas do cenário também respeitam as áreas ocupadas pela HUD.
      const reserved = document.querySelectorAll(
        "#jogo .mission,#jogo .missions,#jogo .top-actions,#jogo .joystick,#jogo .actions,#jogo #ajuda,#jogo #jump-action",
      );
      for (let pass = 0; pass < 2; pass++)
        for (const element of reserved) {
          const r = element.getBoundingClientRect();
          if (!r.width || !r.height) continue;
          const left = screenX - (w * s) / 2,
            right = screenX + (w * s) / 2;
          if (
            left < r.right + 5 &&
            right > r.left - 5 &&
            screenY - 17 * s < r.bottom + 5 &&
            screenY + 6 * s > r.top - 5
          )
            screenY =
              r.top < height / 2
                ? Math.min(height - 10, r.bottom + 7 + 17 * s)
                : Math.max(22, r.top - 7 - 6 * s);
        }
      return {
        x: (screenX - ox) / s,
        y: (screenY - oy) / s,
      };
    },
  });

  if (window.GuardiaoGameUI) {
    const Previous = GuardiaoGameUI;
    window.GuardiaoGameUI = class extends Previous {
      constructor(options) {
        super(options);
        this.care.setAttribute("aria-live", "off");
      }
      open(id) {
        for (const d of document.querySelectorAll("dialog[open]"))
          if (d.id !== id && d.id !== "girar-celular") d.close();
        const d = document.getElementById(id);
        if (d && !d.open) d.showModal();
      }
    };
  }
})();


;/* jogo/revisao-paisagem/arte.js */
"use strict";
(() => {
  const Previous = window.GuardiaoAdventureArt;
  const base = new URL("../vida-em-equilibrio/", ({src:new URL("../revisao-paisagem/arte.js?v=equilibrio-1",document.baseURI).href}).src);
  const localBase = new URL("./", ({src:new URL("../revisao-paisagem/arte.js?v=equilibrio-1",document.baseURI).href}).src);
  const own = {
    ...window.GuardiaoEquilibrioAtlas,
    ...(window.GuardiaoPlantasAtlas
      ? { plantas: window.GuardiaoPlantasAtlas }
      : {}),
  };
  class Art extends Previous {
    constructor(phase) {
      super(phase);
      this.drawings = new Map();
    }
    async ensure(name) {
      if (!own[name]) return super.ensure(name);
      if (this.images.has(name)) return;
      if (!this.loading.has(name))
        this.loading.set(
          name,
          (async () => {
            const d = own[name],
              im = new Image();
            im.src = new URL(
              d.file,
              name === "plantas" ? localBase : base,
            ).href;
            await im.decode();
            if (im.naturalWidth !== d.width || im.naturalHeight !== d.height)
              throw Error("Prancha incompatível: " + name);
            this.images.set(name, im);
          })(),
        );
      return this.loading.get(name);
    }
    async drawing(name, markup) {
      const im = new Image();
      im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(markup);
      await im.decode();
      this.drawings.set(name, im);
    }
    async load() {
      await super.load();
      await Promise.all(
        (this.phase === 2
          ? ["vida-rio", "kai-acoes"]
          : this.phase === 3 || this.phase === 6
            ? ["fauna-grande", "fauna-copa", "vida-rio"]
            : this.phase === 5
              ? ["kai-acoes"]
              : []
        ).map((n) => this.ensure(n)),
      );
      if (this.phase === 4) await this.ensure("plantas");
      if (this.phase === 5)
        await Promise.all(
          ["recyclable", "organic", "residual"].map((n) =>
            this.drawing(n, GuardiaoColecao.bin(n)),
          ),
        );
    }
    draw(ctx, name, index, x, y, height, { flip = false, alpha = 1 } = {}) {
      if (!own[name])
        return super.draw(ctx, name, index, x, y, height, { flip, alpha });
      const d = own[name],
        im = this.images.get(name);
      if (!im) return false;
      const f = d.frames[index % d.frames.length],
        b = f.bounds,
        k = height / d.referenceHeight;
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.translate(x, y);
      if (flip) ctx.scale(-1, 1);
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
    outfit(ctx, player, time, reduced, height = 63) {
      const name = {
        3: "uniforme-resgate",
        4: "uniforme-plantio",
        5: "uniforme-voluntario",
      }[this.phase];
      if (!name) return false;
      const frame =
        player.direction * 2 +
        (player.moving && !reduced ? Math.floor(player.distance / 15) % 2 : 0);
      return this.draw(ctx, name, frame, player.x, player.y, height);
    }
    river(ctx, player, time, reduced, options = {}) {
      // Directions use -atan2: six points south, two points north.
      if (
        !player.swimming ||
        options.dressing ||
        options.kind ||
        ![5, 6, 7].includes(player.direction)
      )
        return super.river(ctx, player, time, reduced, options);
      const name = "kai-acoes",
        index = reduced || !player.moving ? 0 : Math.floor(time * 9) % 8;
      const d = own[name],
        f = d.frames[index],
        h = 55,
        k = h / d.referenceHeight;
      const head = f.head,
        drawX = player.x - (head[0] - f.pivot[0]) * k,
        drawY = player.y - 26 - (head[1] - f.pivot[1]) * k;
      this.draw(ctx, name, index, drawX, drawY, h, { alpha: 0.62 });
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        player.x,
        player.y - 26,
        Math.max(11, f.headRadius[0] * k),
        Math.max(13, f.headRadius[1] * k),
        0,
        0,
        Math.PI * 2,
      );
      ctx.clip();
      this.draw(ctx, name, index, drawX, drawY, h);
      ctx.restore();
      ctx.strokeStyle = "#ddfff0b0";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(
        player.x,
        player.y - 7,
        23 + (reduced ? 0 : Math.sin(time * 5) * 2),
        6,
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      document.body.dataset.riverPose = "kai-nadando-baixo:" + index;
      return "kai-nadando-baixo:" + index;
    }
    solar(ctx, player, progress) {
      return this.draw(
        ctx,
        "kai-acoes",
        8 + Math.min(3, Math.floor(progress * 4)),
        player.x + 13,
        player.y + 5,
        69,
      );
    }
    riverAnimal(
      ctx,
      t,
      time,
      reduced,
      x = t.position.x,
      y = t.position.y,
      height = 32,
    ) {
      const row = t.type === "turtle" ? 2 : t.id === "peixes2" ? 1 : 0,
        pending = t.status === "pending";
      const f =
        row * 4 +
        (pending
          ? !reduced && time % 4.5 > 4.2
            ? 1
            : 0
          : 2 + (!reduced ? Math.floor(time * 5) % 2 : 0));
      return this.draw(ctx, "vida-rio", f, x, y, height, {
        flip: t.facingRight === false,
      });
    }
    animal(
      ctx,
      t,
      time,
      reduced,
      x = t.position.x,
      y = t.position.y,
      height = 38,
    ) {
      const spec = {
        onca: ["fauna-grande", 0],
        tamandua: ["fauna-grande", 1],
        anta: ["fauna-grande", 2],
        arara: ["fauna-copa", 0],
        preguica: ["fauna-copa", 1],
      }[t.speciesKey];
      if (!spec) return super.animal(ctx, t, time, reduced, x, y, height);
      const pending = t.status === "pending",
        frame =
          spec[1] * 4 +
          (pending
            ? !reduced && time % 4.2 > 3.9
              ? 1
              : 0
            : 2 +
              (!reduced
                ? Math.floor(time * (t.speciesKey === "preguica" ? 1.4 : 5)) % 2
                : 0));
      return this.draw(ctx, spec[0], frame, x, y, height, {
        flip: t.facingRight === false,
      });
    }
    plant(ctx, name, x, y, height, time, reduced) {
      const row = { ipê: 0, ingá: 1, aroeira: 2 }[name] ?? 0;
      const step =
        height < 27
          ? 0
          : height < 50
            ? 1
            : 2 + (!reduced ? Math.floor(time * 1.7) % 2 : 0);
      this.draw(ctx, "plantas", row * 4 + step, x, y, height);
    }
    residual(ctx, t) {
      if (t.type !== "recycle" || t.material !== "residual") return false;
      ctx.save();
      ctx.translate(t.x, t.y - 7);
      ctx.rotate(t.id === "reciclavel5" ? 0.15 : -0.16);
      if (t.id === "reciclavel5") {
        const g = ctx.createLinearGradient(-10, -6, 10, 6);
        g.addColorStop(0, "#aac086");
        g.addColorStop(1, "#65744b");
        ctx.fillStyle = g;
        ctx.strokeStyle = "#536046";
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.roundRect(-11, -6, 22, 13, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#4b5b3c";
        for (const [x, y, r] of [
          [-7, -2, 1.2],
          [-2, 2, 1.5],
          [4, -2, 1.5],
          [7, 3, 1],
          [-7, 3, 0.8],
        ]) {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = "#dfd2ad";
        ctx.strokeStyle = "#84745a";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-9, -11);
        ctx.lineTo(5, -10);
        ctx.lineTo(10, -5);
        ctx.lineTo(8, 10);
        ctx.lineTo(-10, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#968862";
        for (const [x, y, rx, ry] of [
          [-3, -4, 4, 2],
          [3, 4, 3, 2],
          [-5, 5, 2, 1],
        ]) {
          ctx.beginPath();
          ctx.ellipse(x, y, rx, ry, 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      return true;
    }
    bins(ctx, station) {
      const kinds = ["recyclable", "organic", "residual"],
        labels = ["Recicláveis", "Orgânicos", "Rejeitos"];
      for (let i = 0; i < 3; i++) {
        const x = station.x - 74 + i * 74,
          im = this.drawings.get(kinds[i]);
        if (im) ctx.drawImage(im, x - 29, station.y - 64, 58, 64);
        ctx.fillStyle = "#fff3d7";
        ctx.strokeStyle = "#364a3a";
        ctx.lineWidth = 3;
        ctx.font = "bold 10px system-ui";
        ctx.textAlign = "center";
        ctx.strokeText(labels[i], x, station.y + 12);
        ctx.fillText(labels[i], x, station.y + 12);
      }
    }
    energy(ctx, x, y, time, reduced) {
      ctx.strokeStyle = "#f7dd85";
      ctx.lineWidth = 2;
      const opacity = reduced ? 0.7 : 0.5 + Math.sin(time * 3) * 0.3;
      ctx.save();
      ctx.globalAlpha = opacity;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x - 12 + i * 12, y - 57);
        ctx.lineTo(x - 15 + i * 15, y - 68);
        ctx.stroke();
      }
      ctx.restore();
    }
    industry(ctx, time, reduced, clean) {
      // Landscape feedback only. Factories never add an objective or a crystal.
      ctx.save();
      ctx.globalAlpha = clean ? 0.09 : 0.52;
      ctx.fillStyle = "#575558";
      for (let j = 0; j < 3; j++)
        for (let i = 0; i < 5; i++) {
          const age = reduced ? i * 0.6 : (time * 0.45 + i * 0.62) % 3.2;
          ctx.beginPath();
          ctx.ellipse(
            875 + j * 63 + age * 8,
            123 - age * 27,
            7 + age * 6,
            6 + age * 5,
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      ctx.restore();
      document.body.dataset.industryState = clean ? "recuperada" : "poluida";
    }
    underCanopy(p) {
      return (
        this.phase === 3 &&
        ((p.x - 895) / 151) ** 2 + ((p.y - 35 - 223) / 88) ** 2 < 1
      );
    }
    canopyFloor(ctx, player, ground) {
      const under = this.underCanopy(player);
      document.body.dataset.canopyFade = String(under);
      if (!under) return;
      ctx.save();
      const g = ctx.createRadialGradient(895, 223, 30, 895, 223, 151);
      g.addColorStop(0, "#ad9667ba");
      g.addColorStop(0.75, "#ad966798");
      g.addColorStop(1, "#ad966700");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(895, 223, 151, 88, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    actors(time, reduced, ratio) {
      return GuardiaoElenco.actors(this.phase, time, ratio, reduced);
    }
    drawResident(ctx, actor, player) {
      this.draw(ctx, "moradores", actor.frame, actor.x, actor.y, actor.height, {
        flip: player ? player.x < actor.x : actor.row % 2 === 1,
      });
    }
    community(ctx, time, reduced, ratio) {
      document.body.dataset.npcMood =
        ratio >= 1 ? "felizes" : ratio > 0 ? "esperancosos" : "preocupados";
      this.actors(time, reduced, ratio).forEach((actor) =>
        this.drawResident(ctx, actor),
      );
    }
  }
  window.GuardiaoAdventureArt = Art;
})();


;/* jogo/encontros-da-floresta/colar.js */
"use strict";
(() => {
  const Previous = window.GuardiaoColar,
    bank = window.GuardiaoRelicario;
  const base = new URL("./", ({src:new URL("../encontros-da-floresta/colar.js?v=encontros-1",document.baseURI).href}).src);
  const ease = (n) => {
    n = Math.max(0, Math.min(1, n));
    return n * n * (3 - 2 * n);
  };
  const titles = [
    "O primeiro cuidado",
    "A força da água",
    "Amigos em segurança",
    "A floresta renasce",
    "Cinco cuidados, um Guardião",
  ];
  class Necklace extends Previous {
    create() {
      this.element = document.createElement("section");
      this.element.id = "colar-cena";
      this.element.className = "colar-cutscene encontro-recompensa";
      this.element.hidden = true;
      this.element.setAttribute("role", "region");
      this.element.setAttribute(
        "aria-label",
        "A conquista do colar do Guardião",
      );
      this.element.innerHTML = `<div class="colar-card"><header><p class="colar-eyebrow">UM CUIDADO, UMA CONQUISTA</p><h2 id="colar-titulo"></h2><p id="colar-frase" role="status" aria-live="polite"></p></header>${bank.necklace([], "cutscene")}<footer><canvas id="colar-kai" width="300" height="160" role="img" aria-label="Kai veste o colar e comemora com Flora"></canvas><p><strong id="colar-contagem"></strong><span>cristais conquistados</span></p></footer><button id="colar-continuar" type="button">Continuar a aventura <span aria-hidden="true">→</span></button></div>`;
      document.body.append(this.element);
      this.svg = this.element.querySelector(".colar-view");
      this.gemNodes = [...this.element.querySelectorAll("[data-colar-pedra]")];
      this.spark = this.element.querySelector(".colar-brilho");
      this.caption = this.element.querySelector("#colar-frase");
      this.count = this.element.querySelector("#colar-contagem");
      this.button = this.element.querySelector("button");
      this.button.addEventListener("click", () => {
        if (!this.active || this.finishing) return;
        this.finishing = true;
        this.onFinish?.();
      });
    }
    async load() {
      await Promise.all([
        bank.load(),
        (async () => {
          this.actor = new Image();
          this.actor.src = new URL(
            "../sprites-integros/" + GuardiaoColarArte.file,
            base,
          ).href;
          await this.actor.decode();
        })(),
      ]);
    }
    begin(onFinish) {
      super.begin(onFinish);
      this.element.querySelector("h2").textContent = titles[this.phase - 1];
    }
    render(time, reduced = false) {
      if (!this.active) return;
      const opacity =
        ease((time - 0.75) / 0.4) * (1 - ease((time - 5.85) / 0.45));
      this.element.hidden = opacity <= 0;
      this.element.style.opacity = String(opacity);
      this.element.style.pointerEvents = opacity > 0.5 ? "auto" : "none";
      document.body.classList.toggle("colar-em-cena", opacity > 0.5);
      const landed = time >= 2.8;
      this.element.dataset.state = landed
        ? "encaixado"
        : time >= 1.5
          ? "encaixando"
          : "vazio";
      this.element.dataset.pieces = String(
        this.before.length + (landed ? 1 : 0),
      );
      if (opacity > 0.7 && !this.focused) {
        this.focused = true;
        this.button.focus({ preventScroll: true });
      }
      const travel = ease((time - 1.5) / 1.3);
      this.gemNodes.forEach((node, i) => {
        const current = i + 1 === this.phase,
          visible =
            this.before.includes(i + 1) ||
            (current && time >= 1.5 && (!reduced || landed));
        node.style.opacity = visible ? "1" : "0";
        node.setAttribute(
          "transform",
          current && !landed && !reduced
            ? `translate(${(1 - travel) * 75} ${-(1 - travel) * 155})`
            : "translate(0 0)",
        );
      });
      const slot = bank.slots[this.phase - 1],
        flash = landed && !reduced ? Math.max(0, 1 - (time - 2.8) / 0.9) : 0;
      this.spark.style.opacity = String(flash);
      this.spark.setAttribute(
        "transform",
        `translate(${slot[0] + slot[2] / 2} ${slot[1] + slot[3] / 2}) scale(${0.8 + (1 - flash) * 1.5})`,
      );
      const stage = landed ? "encaixado" : "vazio";
      if (stage !== this.messageStage) {
        this.messageStage = stage;
        if (landed) window.GuardiaoAudio?.effect("restaurar", { gain: 0.65 });
        const word = ["vermelha", "azul", "amarela", "verde", "violeta"][
          this.phase - 1
        ];
        this.caption.textContent = landed
          ? `A pedra ${word} encontrou seu lugar!`
          : this.phase === 1
            ? "O primeiro cristal vai guardar este cuidado."
            : "Cada cuidado completa sua história.";
        this.count.textContent =
          this.before.length + (landed ? 1 : 0) + " de 5";
        this.svg.setAttribute(
          "aria-label",
          `Amuleto com ${this.before.length + (landed ? 1 : 0)} de cinco cristais`,
        );
      }
      const c = this.element.querySelector("canvas").getContext("2d");
      c.clearRect(0, 0, 300, 160);
      this.drawActor(c, time, 100, 150, 116);
      this.life?.draw(
        c,
        "flora",
        reduced ? 14 : 14 + (Math.floor(time * 5) % 2),
        220,
        95,
        46,
      );
    }
    crystal(ctx, x, y, size) {
      bank.paintStone(
        ctx,
        this.phase - 1,
        x - size * 0.6,
        y - size * 0.8,
        size * 1.2,
        size * 1.6,
      );
    }
    medallion(ctx, x, y, scale, earned) {
      bank.paint(ctx, x, y, 13 * scale, earned);
    }
  }
  window.GuardiaoColar = Necklace;
})();


;/* jogo/encontros-da-floresta/olhares.js */
"use strict";
(() => {
  // Ajusta a direção da arte durante a conversa; a posição e a colisão continuam
  // nas mãos do controlador. Não escreve na direção salva do jogador.
  const phase = location.pathname.includes("/floresta-viva/")
    ? 1
    : Number(new URLSearchParams(location.search).get("fase") || 2);
  const npc =
    phase === 1
      ? { x: 245, y: 245 }
      : window.GuardiaoFasesJogaveis?.[phase]?.npcPosition;
  if (!npc) return;
  let player =
    phase === 1
      ? { x: 286, y: 260 }
      : window.GuardiaoFasesJogaveis[phase].start;
  const talking = () =>
    !!document.querySelector("#conversa[open],#intro[open]");
  const direction = (x, y) =>
    (Math.round((Math.atan2(-(npc.y - y), npc.x - x) * 4) / Math.PI) + 8) % 8;
  function look(p) {
    if (!talking()) return p;
    const d = direction(p.x, p.y);
    if (document.body.dataset.talkDirection !== String(d))
      document.body.dataset.talkDirection = String(d);
    return { ...p, direction: d };
  }
  const Life = window.GuardiaoVidaNatural;
  class LifeWithGaze extends Life {
    ground(ctx, p, ...args) {
      player = p;
      return super.ground(ctx, p, ...args);
    }
  }
  window.GuardiaoVidaNatural = LifeWithGaze;
  const Art = window.GuardiaoAdventureArt;
  class ArtWithGaze extends Art {
    outfit(ctx, p, ...args) {
      return super.outfit(ctx, look(p), ...args);
    }
    river(ctx, p, ...args) {
      return super.river(ctx, look(p), ...args);
    }
  }
  window.GuardiaoAdventureArt = ArtWithGaze;
  const Sprites = window.FlorestaSprites;
  class ForestSprites extends Sprites {
    async load(...args) {
      await Promise.all([super.load(...args), GuardiaoRelicario.load()]);
      return this;
    }
    draw(ctx, name, index, x, y, height, options = {}) {
      if (ctx.canvas.id === "cenario") {
        if (name === "carlos") {
          options = { ...options, flip: player.x < x };
          const label = options.flip ? "esquerda" : "direita";
          if (document.body.dataset.npcFacing !== label)
            document.body.dataset.npcFacing = label;
        }
        if (name === "kai-repouso" && talking()) {
          const d = direction(x, y),
            row = d === 2 ? 2 : d >= 3 && d <= 5 ? 4 : d === 6 ? 6 : 0;
          index = row + (index % 2);
          if (document.body.dataset.talkDirection !== String(d))
            document.body.dataset.talkDirection = String(d);
        }
      }
      return super.draw(ctx, name, index, x, y, height, options);
    }
    item(ctx, id, x, y, size, options = {}) {
      if (id !== 2) return super.item(ctx, id, x, y, size, options);
      ctx.save();
      ctx.globalAlpha *= options.alpha ?? 1;
      GuardiaoRelicario.paintStone(
        ctx,
        0,
        x - size / 2,
        y - size / 2,
        size,
        size,
      );
      ctx.restore();
    }
  }
  window.FlorestaSprites = ForestSprites;
  const Campaign = window.GuardiaoCampaignSprites;
  if (Campaign) {
    class CampaignSprites extends Campaign {
      draw(ctx, name, index, x, y, height, options = {}) {
        if (name === "npcs" && ctx.canvas.id === "cenario") {
          options = { ...options, flip: player.x < x };
          const label = options.flip ? "esquerda" : "direita";
          if (document.body.dataset.npcFacing !== label)
            document.body.dataset.npcFacing = label;
        }
        return super.draw(ctx, name, index, x, y, height, options);
      }
    }
    window.GuardiaoCampaignSprites = CampaignSprites;
  }
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


;/* jogo/cuidado-acessivel/carregamento.js */
"use strict";
(() => {
  const root = new URL("../../", ({src:new URL("../cuidado-acessivel/carregamento.js?v=cuidado-1",document.baseURI).href}).src);
  const files = window.GuardiaoArquivosLeves || {};
  function optimized(file, base) {
    const url = new URL(file, new URL(base, root));
    const key = url.pathname.slice(root.pathname.length);
    return files[key] ? new URL(files[key], root).href : null;
  }
  function atlas(records, base, forest = false) {
    for (const record of Object.values(records || {})) {
      if (!record?.file) continue;
      const file = optimized(record.file, base);
      if (file)
        record.file = forest
          ? "../../cuidado-acessivel/assets/" + file.split("/").at(-1)
          : file;
    }
  }
  atlas(window.GuardiaoVidaAtlas, "jogo/vida-natural/assets/");
  atlas(
    window.GuardiaoFlorestaAtlas?.sheets,
    "jogo/floresta-viva/assets/",
    true,
  );
  atlas(window.GuardiaoCampanhaAtlas, "jogo/jornada/");
  atlas(window.GuardiaoAmanhaAtlas, "jogo/novo-amanha/");
  atlas(window.GuardiaoEquilibrioAtlas, "jogo/vida-em-equilibrio/");
  atlas(window.GuardiaoRenascimentoAtlas, "");
  for (const [key, value] of Object.entries(
    window.GuardiaoArteManifesto || {},
  )) {
    if (files[value]) window.GuardiaoArteManifesto[key] = files[value];
  }
  for (const [key, value] of Object.entries(files))
    window.GuardiaoArteManifesto[key] = value;
  document.documentElement.dataset.artQuality = "webp-otimizado";
})();


;/* jogo/cuidado-acessivel/artes.js */
"use strict";
(() => {
  let serial = 0;
  const plants = ["ipê", "ingá", "aroeira"];
  function plant(name) {
    const id = "muda-nativa-" + serial++;
    const row = plants.indexOf(name),
      color = ["#71ad42", "#438c49", "#689748"][Math.max(0, row)];
    const leaves = Array.from({ length: row === 1 ? 12 : 9 }, (_, i) => {
      const x = 24 + ((i * 23) % 70),
        y = 24 + ((i * 17) % 47);
      return `<ellipse cx="${x}" cy="${y}" rx="${row === 1 ? 17 : 23}" ry="${row === 1 ? 8 : 17}" transform="rotate(${i % 2 ? -25 : 20} ${x} ${y})" fill="url(#${id}-leaf)" stroke="#31562e" stroke-width="1.8"/><path d="M${x - 10} ${y + 3}q10 -5 20 -5" fill="none" stroke="#cadc86" stroke-opacity=".45"/>`;
    }).join("");
    const detail =
      row === 0
        ? [
            [33, 28],
            [77, 30],
            [55, 47],
            [85, 55],
            [26, 53],
          ]
            .map(
              ([x, y]) =>
                `<g fill="#f6d96b" stroke="#b99038" stroke-width=".7"><circle cx="${x - 3}" cy="${y}" r="4"/><circle cx="${x + 3}" cy="${y}" r="4"/><circle cx="${x}" cy="${y - 4}" r="4"/><circle cx="${x}" cy="${y + 3}" r="4"/><circle cx="${x}" cy="${y}" r="2" fill="#fff0b2"/></g>`,
            )
            .join("")
        : row === 2
          ? [
              [27, 49],
              [76, 61],
              [68, 22],
              [43, 42],
            ]
              .map(
                ([x, y]) =>
                  `<circle cx="${x}" cy="${y}" r="3" fill="#bf5340" stroke="#7e382d"/>`,
              )
              .join("")
          : "";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140" aria-hidden="true"><defs><linearGradient id="${id}-leaf" x2=".6" y2="1"><stop stop-color="#b4d66b"/><stop offset=".45" stop-color="${color}"/><stop offset="1" stop-color="#316039"/></linearGradient><linearGradient id="${id}-wood"><stop stop-color="#70462b"/><stop offset=".45" stop-color="#bb8751"/><stop offset="1" stop-color="#68412b"/></linearGradient></defs><ellipse cx="60" cy="128" rx="31" ry="7" fill="#273924" opacity=".18"/><path d="M57 122l2-70m1 45L35 70m25 13l23-27m-24 65l-11 5m13-5l11 5" fill="none" stroke="#543d2a" stroke-width="8" stroke-linecap="round"/><path d="M57 122l2-70m1 45L35 70m25 13l23-27" fill="none" stroke="url(#${id}-wood)" stroke-width="5" stroke-linecap="round"/>${leaves}${detail}<path d="M39 125q20-9 43 0" fill="none" stroke="#8e6b40" stroke-width="3"/><path d="M37 121q-6-9-9-7m55 9q4-12 10-10" fill="none" stroke="#75a34a" stroke-width="2"/></svg>`;
  }
  function bin(kind) {
    const id = "lixeira-da-ilha-" + serial++,
      color =
        { recyclable: "#468da6", organic: "#a77b4e", residual: "#77868c" }[
          kind
        ] || "#468da6";
    const symbol =
      kind === "organic"
        ? '<path d="M58 88V57m0 14q-25 2-19-18q20 0 19 18m1 10q25 0 21-20q-20 0-21 20"/>'
        : kind === "residual"
          ? '<path d="M46 62l25 26m0-26L46 88" fill="none" stroke-width="7" stroke-linecap="round"/>'
          : '<path d="M50 54l10-6l10 16l-8 5l-2-7l-5-6m20 14l6 10l-14 12l-6-8l7-1l4-5M56 91l-13 1l-6-19l9-3l-3 7l3 5" fill="none" stroke-width="5" stroke-linejoin="round"/>';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140" aria-hidden="true"><defs><linearGradient id="${id}-body" x2="1" y2=".2"><stop stop-color="${color}"/><stop offset=".5" stop-color="${color}"/><stop offset="1" stop-color="#394f4d"/></linearGradient><linearGradient id="${id}-rim" x2="0" y2="1"><stop stop-color="#d1ad68"/><stop offset=".55" stop-color="#9d713f"/><stop offset="1" stop-color="#68472d"/></linearGradient></defs><ellipse cx="60" cy="128" rx="43" ry="9" fill="#17362d" opacity=".2"/><rect x="28" y="116" width="11" height="15" rx="5" fill="#33433e"/><rect x="81" y="116" width="11" height="15" rx="5" fill="#33433e"/><path d="M27 38l65-5l-3 83q-25 17-57 5Z" fill="url(#${id}-body)" stroke="#3c4d3e" stroke-width="3"/><path d="M36 47l3 62m44-63l-3 61" stroke="#d9ebcb" stroke-opacity=".3" stroke-width="3" stroke-linecap="round"/><path d="M20 34l14-14h60l9 14v12L20 50Z" fill="url(#${id}-rim)" stroke="#5a482c" stroke-width="2.5"/><path d="M27 34l66-5" stroke="#f1d299" stroke-width="2"/><path d="M47 21v-7h28v6" fill="none" stroke="#516441" stroke-width="6" stroke-linejoin="round"/><path d="M29 115q30 12 61-4" fill="none" stroke="#dab678" stroke-width="4"/><rect x="36" y="50" width="45" height="49" rx="12" fill="#23483b" stroke="#c9bc7c" stroke-width="2"/><g fill="#f6ecc8" stroke="#f6ecc8" stroke-width="1.4">${symbol}</g><path d="M91 24q7-13 15-9q-1 12-15 9" fill="#87b85b" stroke="#406037"/><path d="M22 49l-4 9v11m83-24l4 8v10" fill="none" stroke="#4c6449" stroke-width="4" stroke-linecap="round"/></svg>`;
  }
  window.GuardiaoColecao = Object.freeze({
    ...window.GuardiaoColecao,
    plant,
    bin,
  });
  const Previous = window.GuardiaoAdventureArt;
  class NatureArt extends Previous {
    async ensure(name) {
      if (name === "plantas") return;
      return super.ensure(name);
    }
    async load() {
      await super.load();
      this.neighbors = new GuardiaoCampaignSprites();
      await this.neighbors.load(["npcs"]);
      if (this.phase === 4)
        await Promise.all(
          plants.map((name) => this.drawing(name, plant(name))),
        );
    }
    plant(ctx, name, x, y, height, time, reduced) {
      const im = this.drawings.get(name);
      if (!im) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(reduced ? 0 : Math.sin(time * 1.6 + x) * 0.025);
      ctx.drawImage(im, -height * 0.43, -height * 0.94, height * 0.86, height);
      ctx.restore();
    }
    bins(ctx, station) {
      ["recyclable", "organic", "residual"].forEach((kind, i) => {
        const x = station.x - 74 + i * 74,
          im = this.drawings.get(kind);
        if (im) ctx.drawImage(im, x - 34, station.y - 79, 68, 80);
        ctx.save();
        ctx.font = "bold 10px system-ui";
        ctx.textAlign = "center";
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#244635";
        ctx.fillStyle = "#fff4d6";
        const label = ["Recicláveis", "Orgânicos", "Rejeitos"][i];
        ctx.strokeText(label, x, station.y + 13);
        ctx.fillText(label, x, station.y + 13);
        ctx.restore();
      });
    }
    drawResident(ctx, actor, player) {
      if (actor.role !== undefined && this.neighbors) {
        this.neighbors.draw(
          ctx,
          "npcs",
          actor.role * 3 + actor.pose,
          actor.x,
          actor.y,
          actor.height,
          { flip: player ? player.x < actor.x : false },
        );
      } else super.drawResident(ctx, actor, player);
    }
  }
  window.GuardiaoAdventureArt = NatureArt;
})();


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
  const base = new URL("./", ({src:new URL("../raizes/personagens.js?v=raizes-1",document.baseURI).href}).src),
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
  const base = new URL("./", ({src:new URL("../viva/comum.js?v=viva-1",document.baseURI).href}).src),
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
  const full = () =>
    !!(document.fullscreenElement || document.webkitFullscreenElement);
  let pending = false;
  function syncFull() {
    document.querySelectorAll("[data-fullscreen]").forEach((b) => {
      b.innerHTML = icon(full() ? "exit" : "full");
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
      if (full()) {
        const fn = document.fullscreenElement
          ? document.exitFullscreen || document.webkitExitFullscreen
          : document.webkitExitFullscreen || document.exitFullscreen;
        await fn.call(document);
        screen.orientation?.unlock?.();
      } else {
        const fn =
          document.documentElement.requestFullscreen ||
          document.documentElement.webkitRequestFullscreen;
        if (!fn) throw Error();
        await fn.call(document.documentElement);
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
      location.replace(new URL("index.html#inicio", base));
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
  const freshHome = () => location.replace(new URL("index.html#inicio", base));
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
      resetDialog.className = "ra-dialog ra-reset";
      resetDialog.id = "ra-reset";
      resetDialog.setAttribute("aria-labelledby", "ra-reset-title");
      resetDialog.innerHTML = `<p class="eyebrow">UMA NOVA JORNADA</p><h2 id="ra-reset-title">Começar do início?</h2><p>As cinco fases, os itens e os cristais serão reiniciados. A ilha volta ao estado inicial.</p><p>Áudio e controles continuam do seu jeito.</p><div class="ra-dialog-actions"><button type="button" data-cancel autofocus>Continuar por aqui</button><button type="button" class="primary" data-confirm>Sim, recomeçar</button></div>`;
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
    state: () => ({ fullscreen: full(), pending }),
  };
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
  const base = new URL("./", ({src:new URL("../viva/arte.js?v=viva-1",document.baseURI).href}).src),
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
        !!(document.fullscreenElement || document.webkitFullscreenElement),
      );
    });
  }
  Raizes.bindFull = (b) => {
    bind(b);
    fullIcons();
  };
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
    dialog
      .querySelectorAll("[data-pack-tab]")
      .forEach((b) =>
        b.setAttribute("aria-selected", String(b.dataset.packTab === tab)),
      );
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


;/* jogo/raizes/modelos.js */
"use strict";
(() => {
  const A = RaizesPersonagens,
    base = new URL("../vida-natural/assets/", ({src:new URL("../raizes/modelos.js?v=raizes-1",document.baseURI).href}).src);
  const phase = location.pathname.includes("/floresta-viva/")
    ? 1
    : Number(new URLSearchParams(location.search).get("fase") || 2);
  if (window.GuardiaoIcones) {
    const old = GuardiaoIcones;
    window.GuardiaoIcones = {
      ...old,
      markup: (name) => Raizes.icon(name),
    };
  }
  let worldPlayer = { direction: 6, x: 0, y: 0, moving: false, distance: 0 };
  const npc =
    phase === 1
      ? { x: 245, y: 245 }
      : window.GuardiaoFasesJogaveis?.[phase]?.npcPosition;
  function facing(p) {
    if (!document.querySelector("#conversa[open],#intro[open]") || !npc)
      return p;
    return {
      ...p,
      direction:
        (Math.round(-Math.atan2(npc.y - p.y, npc.x - p.x) / (Math.PI / 4)) +
          8) %
        8,
    };
  }
  function hero(ctx, p, time, reduced, height = 63, equipped = false) {
    p = facing(p);
    const y =
      p.y -
      (p.moving && !reduced
        ? Math.abs(Math.sin((p.distance * Math.PI) / 28)) * 0.6
        : 0);
    if (equipped)
      return A.draw(
        ctx,
        "mangueira",
        p.direction * 2 +
          (p.moving && !reduced ? Math.floor(p.distance / 15) % 2 : 0),
        p.x,
        y,
        height,
      );
    if (p.moving)
      return A.draw(
        ctx,
        "kai",
        p.direction * 2 + (reduced ? 0 : Math.floor(p.distance / 15) % 2),
        p.x,
        y,
        height,
      );
    if ([0, 4, 6].includes(p.direction))
      return A.draw(
        ctx,
        "acoes",
        p.direction === 6 ? 1 : 0,
        p.x,
        y,
        height + (reduced ? 0 : Math.sin(time * 1.5) * 0.25),
        { flip: p.direction === 4 },
      );
    return A.draw(ctx, "kai", p.direction * 2, p.x, y, height);
  }
  if (window.GuardiaoAgua) {
    const Previous = GuardiaoAgua;
    window.GuardiaoAgua = class extends Previous {
      nozzle(p, time, reduced = false) {
        const d = A.atlas.mangueira,
          index =
            p.direction * 2 +
            (p.moving && !reduced ? Math.floor(p.distance / 15) % 2 : 0),
          f = d.frames[index],
          point = f.nozzle,
          k = 63 / d.referenceHeight,
          bob =
            p.moving && !reduced
              ? Math.abs(Math.sin((p.distance * Math.PI) / 28)) * 0.6
              : 0;
        return {
          x: p.x + (point[0] - f.pivot[0]) * k,
          y: p.y + (point[1] - f.pivot[1]) * k - bob,
        };
      }
    };
  }
  if (window.GuardiaoVidaNatural) {
    const Previous = GuardiaoVidaNatural;
    window.GuardiaoVidaNatural = class extends Previous {
      async load(onProgress = () => {}) {
        await A.load([
          "kai",
          "flora",
          "npcs",
          "acoes",
          ...(this.phase === 1 ? ["mangueira"] : []),
        ]);
        if (this.phase === 1) {
          const d = GuardiaoVidaAtlas.fogo,
            im = new Image();
          im.src = new URL(d.file, base);
          await im.decode();
          this.images.set("fogo", im);
        }
        if (this.water) await this.water.load();
        if (this.rebirth) await this.rebirth.load();
        this.canopyShadow = new Image();
        this.canopyShadow.src = new URL("sombra-copa.svg", base);
        await this.canopyShadow.decode();
        onProgress();
      }
      draw(ctx, name, index, x, y, height, options = {}) {
        if (name === "flora")
          return A.draw(
            ctx,
            "flora",
            index >= 14 ? 11 : index % 4,
            x,
            y,
            height,
            options,
          );
        return super.draw(ctx, name, index, x, y, height, options);
      }
      ground(ctx, p, ...args) {
        worldPlayer = p;
        return super.ground(ctx, p, ...args);
      }
      walk(ctx, p, time, reduced, equipped = false, height = 63) {
        return hero(ctx, p, time, reduced, height, equipped);
      }
      flora(ctx, f, p, time, reduced) {
        const mode =
          f.mode === "ombro" || f.mode === "pousando"
            ? "ombro"
            : f.mode === "comemorando"
              ? "festa"
              : "voo";
        const h = mode === "ombro" ? 26 : 35;
        A.owl(
          ctx,
          f.x,
          f.y + h * 0.3,
          h,
          reduced ? 0 : time,
          mode,
          p.direction >= 3 && p.direction <= 5,
        );
      }
    };
  }
  if (window.FlorestaSprites) {
    const Previous = FlorestaSprites;
    window.FlorestaSprites = class extends Previous {
      async load(
        onProgress = () => {},
        names = Object.keys(GuardiaoFlorestaAtlas.sheets),
      ) {
        await Promise.all([
          A.load(["kai", "flora", "npcs", "acoes", "mangueira"]),
          super.load(
            onProgress,
            names.filter(
              (n) =>
                ![
                  "carlos",
                  "kai-repouso",
                  "kai-mangueira",
                  "kai-caminhada",
                  "kai-livre",
                  "flora",
                ].includes(n),
            ),
          ),
        ]);
        return this;
      }
      draw(ctx, name, index, x, y, height, options = {}) {
        if (name === "carlos")
          return A.draw(ctx, "npcs", index % 4 > 1 ? 5 : 0, x, y, height, {
            ...options,
            flip: ctx.canvas.id === "cenario" ? worldPlayer.x > x : true,
          });
        if (name === "kai-repouso")
          return hero(
            ctx,
            { ...worldPlayer, x, y, moving: false },
            performance.now() / 1000,
            Raizes.prefs().reduceMotion,
            height,
          );
        if (name === "kai-cuidados" && index >= 6)
          return A.draw(ctx, "acoes", 2, x, y, height, options);
        return super.draw(ctx, name, index, x, y, height, options);
      }
      hose(ctx, direction, frame, x, y, height, options = {}) {
        return A.draw(
          ctx,
          "mangueira",
          direction * 2 + (frame % 2),
          x,
          y,
          height,
          { ...options, flip: false },
        );
      }
    };
  }
  if (window.GuardiaoCampaignSprites) {
    const Previous = GuardiaoCampaignSprites;
    window.GuardiaoCampaignSprites = class extends Previous {
      async load(names, progress = () => {}) {
        await Promise.all([
          A.load(["npcs", "kai", "acoes"]),
          super.load(
            names.filter((n) => !["npcs", "kai-floresta"].includes(n)),
            progress,
          ),
        ]);
        return this;
      }
      draw(ctx, name, index, x, y, height, options = {}) {
        if (name === "npcs")
          return A.draw(
            ctx,
            "npcs",
            Math.floor(index / 3) + (index % 3 ? 5 : 0),
            x,
            y,
            height,
            {
              ...options,
              flip: ctx.canvas.id === "cenario" ? worldPlayer.x > x : true,
            },
          );
        if (name === "kai-floresta")
          return A.draw(ctx, "acoes", 2, x, y, height, options);
        return super.draw(ctx, name, index, x, y, height, options);
      }
      markup(name, index) {
        if (name === "npcs" || name.startsWith("kai-"))
          return '<span aria-hidden="true"></span>';
        return super.markup(name, index);
      }
    };
  }
  if (window.GuardiaoAdventureArt) {
    const Previous = GuardiaoAdventureArt;
    window.GuardiaoAdventureArt = class extends Previous {
      async ensure(name) {
        if (name === "moradores" || name.startsWith("uniforme-")) return;
        return super.ensure(name);
      }
      async load() {
        await Promise.all([
          super.load(),
          A.load(["kai", "flora", "npcs", "acoes"]),
        ]);
      }
      outfit(ctx, p, time, reduced, height = 63) {
        if (this.phase === 2)
          return super.outfit(ctx, p, time, reduced, height);
        return hero(ctx, p, time, reduced, height);
      }
      drawResident(ctx, a, p) {
        const role = a.role ?? a.row % 5,
          pose = a.pose ?? (a.frame % 4 >= 2 ? 1 : 0);
        return A.draw(ctx, "npcs", role + (pose ? 5 : 0), a.x, a.y, a.height, {
          flip: p ? p.x > a.x : false,
        });
      }
    };
  }
  if (window.GuardiaoColar) {
    const Previous = GuardiaoColar;
    window.GuardiaoColar = class extends Previous {
      async load() {
        await Promise.all([
          GuardiaoRelicario.load(),
          A.load(["acoes", "flora"]),
        ]);
      }
      drawActor(ctx, time, x, y, height, celebrate = false) {
        return A.draw(
          ctx,
          "acoes",
          celebrate || time > 5 ? 6 : 1,
          x,
          y,
          height,
        );
      }
    };
  }
})();


;/* jogo/viva/mundo.js */
"use strict";
(() => {
  const A = RaizesPersonagens,
    draw = A.draw,
    scale = 1.32,
    phase = location.pathname.includes("floresta-viva")
      ? 1
      : Number(new URLSearchParams(location.search).get("fase") || 2);
  function face(p) {
    const npc =
      phase === 1
        ? { x: 245, y: 245 }
        : window.GuardiaoFasesJogaveis?.[phase]?.npcPosition;
    if (npc && !p.moving && Math.hypot(p.x - npc.x, p.y - npc.y) < 100)
      return {
        ...p,
        direction:
          (Math.round(-Math.atan2(npc.y - p.y, npc.x - p.x) / (Math.PI / 4)) +
            8) %
          8,
      };
    return p;
  }
  A.draw = function (ctx, name, index, x, y, height, options = {}) {
    return draw(
      ctx,
      name,
      index,
      x,
      y,
      ctx.canvas.id === "cenario" &&
        ["kai", "mangueira", "acoes", "npcs"].includes(name)
        ? height * scale
        : height,
      options,
    );
  };
  const Life = GuardiaoVidaNatural;
  window.GuardiaoVidaNatural = class extends Life {
    ground(ctx, p, ...rest) {
      return super.ground(ctx, face(p), ...rest);
    }
    flora(ctx, f, p, time, reduced) {
      p = face(p);
      const npc =
        phase === 1
          ? { x: 245, y: 245 }
          : GuardiaoFasesJogaveis[phase].npcPosition;
      const near = Math.hypot(p.x - npc.x, p.y - npc.y) < 130;
      if (["ombro", "pousando"].includes(f.mode)) {
        const back = p.direction >= 3 && p.direction <= 5 ? 1 : -1;
        return A.owl(
          ctx,
          p.x + back * 28,
          p.y - 51,
          29,
          reduced ? 0 : time,
          "ombro",
          back === 1,
        );
      }
      return A.owl(
        ctx,
        near ? p.x + (p.x > npc.x ? 48 : -48) : f.x,
        near ? p.y - 94 : f.y - 3,
        39,
        reduced ? 0 : time,
        f.mode === "comemorando" ? "festa" : "voo",
        p.direction >= 3 && p.direction <= 5,
      );
    }
  };
  if (window.GuardiaoAgua) {
    const Water = GuardiaoAgua;
    window.GuardiaoAgua = class extends Water {
      nozzle(p, ...rest) {
        const q = super.nozzle(p, ...rest);
        return { x: p.x + (q.x - p.x) * scale, y: p.y + (q.y - p.y) * scale };
      }
    };
  }
  const Art = GuardiaoAdventureArt;
  window.GuardiaoAdventureArt = class extends Art {
    actors() {
      return [];
    }
    outfit(ctx, p, ...rest) {
      return super.outfit(ctx, face(p), ...rest);
    }
    draw(ctx, name, index, x, y, height, ...rest) {
      return super.draw(
        ctx,
        name,
        index,
        x,
        y,
        /^(traje-|kai-acoes)/.test(name) && ctx.canvas.id === "cenario"
          ? height * scale
          : height,
        ...rest,
      );
    }
  };
  if (window.GuardiaoCampaignSprites) {
    const Sprites = GuardiaoCampaignSprites;
    window.GuardiaoCampaignSprites = class extends Sprites {
      draw(ctx, name, index, x, y, height, ...rest) {
        return super.draw(
          ctx,
          name,
          index,
          x,
          y,
          ctx.canvas.id === "cenario" &&
            ["kai-rio", "kai-plantio", "kai-nadando"].includes(name)
            ? height * scale
            : height,
          ...rest,
        );
      }
    };
  }
  const Forest = FlorestaSprites;
  window.FlorestaSprites = class extends Forest {
    draw(ctx, name, index, x, y, height, ...rest) {
      return super.draw(
        ctx,
        name,
        index,
        x,
        y,
        ctx.canvas.id === "cenario" && name === "kai-cuidados" && index < 6
          ? height * scale
          : height,
        ...rest,
      );
    }
  };
  const Colar = GuardiaoColar;
  window.GuardiaoColar = class extends Colar {
    chest(ctx, p, ...rest) {
      return super.chest(ctx, { ...p, y: p.y - 10 }, ...rest);
    }
  };
  function label(ctx, text, x, y, view, width, height) {
    const s = view.s,
      font = 12.5 / s,
      npc =
        phase === 1
          ? { x: 245, y: 245 }
          : GuardiaoFasesJogaveis[phase].npcPosition;
    const npcLabel = Math.abs(x - npc.x) < 8 && Math.abs(y - (npc.y - 73)) < 15;
    if (npcLabel) y -= 21;
    ctx.font = `600 ${font}px system-ui`;
    ctx.textAlign = "center";
    const max = Math.min(270, width - 30) / s,
      words = text.split(" "),
      lines = [""];
    for (const word of words) {
      const i = lines.length - 1,
        v = lines[i] + " " + word;
      if (ctx.measureText(v.trim()).width > max && lines[i]) lines.push(word);
      else lines[i] = v.trim();
    }
    const w =
        Math.min(max, Math.max(...lines.map((l) => ctx.measureText(l).width))) +
        20 / s,
      h = (lines.length * 16 + 12) / s;
    ({ x, y } = GuardiaoEtiquetas.position(x, y, w, view, width, height));
    // Se a HUD empurra o nome para cima do rosto, use o espaço abaixo dos pés.
    if (
      npcLabel &&
      y + 9 / s > npc.y - 65 * scale - 8 / s &&
      y - h < npc.y + 10 / s
    )
      ({ x, y } = GuardiaoEtiquetas.position(
        npc.x,
        npc.y + h + 10 / s,
        w,
        view,
        width,
        height,
      ));
    ctx.save();
    ctx.fillStyle = "#f3e6bddd";
    ctx.strokeStyle = "#8d6a36";
    ctx.lineWidth = 1.5 / s;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h + 9 / s, w, h, 8 / s);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#345437";
    lines.forEach((line, i) =>
      ctx.fillText(line, x, y - h + 26 / s + (i * 16) / s, max),
    );
    ctx.restore();
  }
  window.VivaMundo = { scale, label, phase };
  function quality() {
    const c = document.getElementById("cenario");
    if (!c) return;
    const cap =
        Raizes.prefs().graphicsQuality === "leve"
          ? 1
          : Raizes.prefs().graphicsQuality === "alta"
            ? 2
            : 1.5,
      p = Math.min(devicePixelRatio || 1, cap),
      w = Math.round(innerWidth * p),
      h = Math.round(innerHeight * p);
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
      c.getContext("2d").setTransform(p, 0, 0, p, 0, 0);
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    const apply = () => requestAnimationFrame(quality);
    window.addEventListener("resize", apply);
    window.addEventListener("guardiao:preferencias", apply);
    apply();
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


;/* jogo/reencontro/geometria.js */
"use strict";
(() => {
  if (!window.ReencontroGeometria) return;
  const phases = structuredClone(GuardiaoFasesJogaveis);
  for (const id of [2, 3, 4, 5]) {
    Object.assign(phases[id], window.ReencontroGeometria[id]);
    phases[id].trees = [];
    phases[id].landmarks = [];
  }
  window.GuardiaoFasesJogaveis = Object.freeze(phases);
})();


;/* jogo/bosque-vivo/cenario.js */
"use strict";
(() => {
  const P = BosquePintura;
  const done = (t) =>
    t.life === 0 || ["done", "safe", "returning"].includes(t.status);
  class Scene {
    constructor(phase, data) {
      this.phase = phase;
      this.data = data;
      this.objects = [];
      this.objectives = [];
      this.complete = false;
      this.fullAt = null;
      this.time = 0;
      this.reduced = false;
      this.saved = false;
      try {
        this.saved =
          JSON.parse(
            localStorage.getItem(
              phase === 1
                ? "guardiao.floresta-viva.v2"
                : `guardiao.jornada.fase.${phase}.v1`,
            ) || "null",
          )?.completed === true;
      } catch {}
      this.base = document.createElement("canvas");
      this.base.width = 1280;
      this.base.height = 720;
      this.create();
    }
    create() {
      const c = this.base.getContext("2d"),
        r = P.random(481 + this.phase),
        d = this.data;
      for (let i = 0; i < 3800; i++) {
        const x = r() * 1280,
          y = r() * 720;
        P.oval(
          c,
          x,
          y,
          0.5 + r() * 2,
          0.4 + r(),
          i % 2 ? "#e9d5a219" : "#24392d1a",
        );
      }
      this.meadows = Array.from({ length: 180 }, (_, i) => ({
        x: r() * 1280,
        y: r() * 720,
        rx: 24 + r() * 35,
        ry: 12 + r() * 25,
        seed: i,
      }));
      if (this.phase === 1) {
        this.objects.push(
          { kind: "house", x: 160, y: 184, w: 151, h: 76 },
          { kind: "shelter", x: 390, y: 187, w: 119, h: 55 },
        );
        for (const t of d.trees)
          this.objects.push({
            ...t,
            kind: "tree",
            height: t.h,
            seed: Math.round(t.x),
          });
        for (const o of d.obstacles.filter((o) =>
          o.name?.startsWith("bosque"),
        )) {
          const pts = o.polygon;
          const x = pts.reduce((s, p) => s + p[0], 0) / pts.length,
            y = pts.reduce((s, p) => s + p[1], 0) / pts.length;
          for (let j = 0; j < 9; j++)
            this.objects.push({
              kind: "tree",
              x: x + (r() - 0.5) * 90,
              y: y + (r() - 0.5) * 65,
              height: 74 + r() * 40,
              seed: j + x,
            });
        }
      } else {
        for (const t of d.trees || [])
          this.objects.push({ ...t, kind: "tree" });
        for (const [i, o] of d.obstacles.entries()) {
          if (o.name === "lixeira" || o.name) continue;
          if (i === 0)
            this.objects.push({
              kind: "house",
              x: Math.max(o.x, 220),
              y: o.y + o.ry * 0.7,
              w: Math.min(170, o.rx * 1.2),
              h: 70,
            });
          else if (this.phase === 5 && i < 3)
            this.objects.push({
              kind: "house",
              x: o.x,
              y: o.y + o.ry * 0.5,
              w: Math.min(165, o.rx * 1.1),
              h: 80,
              town: i === 1 ? 2 : true,
            });
          else if (o.rx > 70) {
            for (let j = 0; j < 6; j++)
              this.objects.push({
                kind: "tree",
                x: o.x + (r() - 0.5) * o.rx,
                y: o.y + (r() - 0.5) * o.ry,
                height: 75 + r() * 35,
                seed: j + o.x,
              });
          } else
            this.objects.push({
              kind: "rock",
              x: o.x,
              y: o.y,
              rx: o.rx,
              ry: o.ry,
            });
        }
        for (const w of d.barriers || [])
          this.objects.push({
            kind: "fence",
            x: w.a[0],
            y: Math.max(w.a[1], w.b[1]),
            a: w.a,
            b: w.b,
          });
      }
      // Border trees occupy blocked terrain only. Their visible roots match the collision boundary.
      for (let i = 0; i < 145; i++) {
        const x = 35 + r() * 1210,
          y = 60 + r() * 610,
          p = { x, y };
        const blocked =
          this.phase === 1
            ? !d.floorPoint(p)
            : !GuardiaoNavegacao.inside(p, d.floor);
        const inWater =
          this.phase === 1
            ? d.inside(p, d.river)
            : d.water && GuardiaoNavegacao.inside(p, d.water);
        if (
          !blocked ||
          inWater ||
          this.objects.some((o) => Math.hypot(o.x - x, o.y - y) < 45)
        )
          continue;
        this.objects.push({
          kind: "tree",
          x,
          y,
          height: 70 + r() * 60,
          seed: i * 11,
        });
      }
      this.objects.sort((a, b) => a.y - b.y);
    }
    health(x, y) {
      let h = this.phase === 1 && x < 490 ? 0.78 : 0.05;
      if (this.complete)
        h = Math.max(
          h,
          this.saved || this.reduced
            ? 1
            : P.ease((this.time - this.fullAt) / 4.5),
        );
      for (const o of this.objectives) {
        const dist = Math.hypot(x - o.x, (y - o.y) * 1.1),
          radius = this.phase === 1 ? 225 : 205;
        if (dist > radius) continue;
        const age = this.reduced
          ? 1
          : P.ease((this.time - (o.restoredAt ?? -10) - dist / 300) / 3.4);
        h = Math.max(h, age * P.clamp((radius - dist) / 70));
      }
      return h;
    }
    update(objectives, time, reduced, completed) {
      this.objectives = objectives.filter(done);
      this.cleanRatio = this.objectives.length / Math.max(1, objectives.length);
      if (this.phase === 5)
        document.body.dataset.industryState =
          this.cleanRatio === 1 ? "recuperada" : "poluida";
      this.time = time;
      this.reduced = reduced;
      if (completed && !this.complete) this.fullAt = time;
      this.complete = completed;
    }
    ground(c, objectives, time, reduced, completed) {
      this.update(objectives, time, reduced, completed);
      const d = this.data;
      P.terrain(
        c,
        this,
        1280,
        720,
        (x, y) => this.health(x, y),
        time,
        this.phase === 1 ? [116, 109, 79] : [168, 146, 98],
      );
      c.drawImage(this.base, 0, 0);
      for (const p of this.meadows) {
        const h = this.health(p.x, p.y);
        if (h < 0.15) continue;
        if (window.BosqueVegetacao?.ready)
          BosqueVegetacao.draw(
            c,
            "vegetacao",
            p.seed % 8 === 0 ? 9 : 8,
            p.x,
            p.y,
            10 + 12 * h,
          );
        else
          for (let j = 0; j < 3; j++) {
            const x = p.x + (j - 1) * 9,
              y = p.y + Math.sin(j + p.seed) * 6;
            P.line(
              c,
              [
                [x - 3, y],
                [x, y - 5 * h],
                [x + 1, y],
              ],
              "#a8bc6388",
              1,
            );
          }
      }
      if (this.phase === 1) {
        c.beginPath();
        for (const [a, b] of d.edges) {
          c.moveTo(...d.nodes[a]);
          c.lineTo(...d.nodes[b]);
        }
        c.lineCap = c.lineJoin = "round";
        c.strokeStyle = "#bfa06b";
        c.lineWidth = 55;
        c.stroke();
        c.strokeStyle = "#ceb37d";
        c.lineWidth = 47;
        c.stroke();
        P.water(c, d.river, 0.8, time, reduced, 1);
        P.bridge(c, d.bridge);
        for (const f of objectives) {
          const age = time - (f.restoredAt ?? -20),
            alpha = f.life > 0 ? 0.65 : 1 - P.ease(age / 4);
          if (alpha <= 0) continue;
          c.save();
          c.translate(f.x, f.y - 4);
          c.scale(1, 0.55);
          const ash = c.createRadialGradient(0, 0, 9, 0, 0, f.rx * 0.72);
          ash.addColorStop(0, `rgba(43,42,34,${alpha})`);
          ash.addColorStop(0.6, `rgba(61,56,40,${alpha * 0.7})`);
          ash.addColorStop(1, "rgba(61,56,40,0)");
          c.fillStyle = ash;
          c.fillRect(-f.rx, -f.rx, f.rx * 2, f.rx * 2);
          c.restore();
        }
        // The reservoir is a separate solid object, beside the actual bridge.
        if (
          !window.BosqueVegetacao?.ready ||
          !BosqueVegetacao.draw(c, "objetos", 6, 377, 384, 67)
        ) {
          P.oval(c, 377, 356, 49, 34, "#777b65");
          P.oval(c, 377, 352, 39, 24, "#459ca6");
        }
        P.line(
          c,
          [
            [377, 377],
            [395, 385],
          ],
          "#a4a688",
          13,
        );
        P.oval(c, 395, 385, 14, 8, "#694a31");
        P.oval(c, 395, 380, 13, 6, "#bd513c");
      } else {
        const routes = {
          2: [
            [
              [315, 245],
              [280, 310],
              [265, 400],
              [325, 525],
              [430, 600],
            ],
            [
              [800, 180],
              [930, 240],
              [1020, 340],
              [950, 440],
              [970, 540],
              [890, 625],
            ],
            [
              [315, 245],
              [390, 190],
              [800, 180],
            ],
          ],
          3: [
            [
              [375, 225],
              [470, 280],
              [620, 220],
              [760, 200],
              [925, 190],
              [1070, 300],
              [1020, 440],
              [900, 530],
              [720, 450],
              [550, 430],
              [400, 480],
              [270, 424],
              [375, 225],
            ],
          ],
          4: [
            [
              [375, 237],
              [460, 310],
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
              [460, 310],
            ],
          ],
          5: [
            [
              [370, 282],
              [430, 260],
              [690, 217],
              [850, 245],
              [1000, 270],
              [1040, 386],
              [900, 400],
              [785, 433],
              [622, 554],
              [360, 573],
              [282, 493],
              [370, 282],
            ],
          ],
        };
        for (const points of routes[this.phase])
          P.trail(c, points, this.phase === 5 ? 42 : 31, this.phase === 5);
        if (this.phase === 2) {
          // A continuous sandy shore, not a grassy patch underneath the turtle.
          c.save();
          P.poly(c, d.water);
          c.strokeStyle = "#e6ce96";
          c.lineWidth = 140;
          c.stroke();
          c.restore();
          const health =
            this.objectives.filter((t) => t.type === "trash").length / 8;
          P.water(c, d.water, health, time, reduced, 2);
          const b = d.bridge;
          P.bridge(c, [
            [b.x, b.y],
            [b.x + b.w, b.y],
            [b.x + b.w, b.y + b.h],
            [b.x, b.y + b.h],
          ]);
          for (const dock of d.docks || []) P.bridge(c, dock);
        }
        if (this.phase === 5)
          for (const w of d.noWalkWater || [])
            P.water(c, w, 0.7, time, reduced, 5);
        if (this.phase === 5 && d.dryBridge) {
          const b = d.dryBridge;
          P.bridge(c, [
            [b.x, b.y],
            [b.x + b.w, b.y],
            [b.x + b.w, b.y + b.h],
            [b.x, b.y + b.h],
          ]);
        }
        if (this.phase === 4) {
          P.oval(c, d.refill.x, d.refill.y, 30, 19, "#8c937d");
          P.oval(c, d.refill.x, d.refill.y - 4, 22, 13, "#6cb8bc");
        }
      }
      // Soil details stay fixed to the land, not attached to the camera.
      const r = P.random(92 + this.phase);
      for (let i = 0; i < 130; i++) {
        const x = 40 + r() * 1200,
          y = 50 + r() * 620;
        if (
          (this.phase === 1
            ? d.floorPoint({ x, y })
            : GuardiaoNavegacao.inside({ x, y }, d.floor)) &&
          !(d.water && GuardiaoNavegacao.inside({ x, y }, d.water))
        )
          P.oval(c, x, y, 1.6, 0.8, "#7a6b453b");
      }
    }
    actors(time, reduced, player) {
      return this.objects.map((o) => ({
        y: o.y,
        draw: (c) => {
          const overlap =
            player &&
            Math.abs(player.x - o.x) < 45 &&
            player.y < o.y &&
            player.y > o.y - (o.height || 80);
          c.save();
          if (overlap) c.globalAlpha = 0.46;
          if (o.kind === "tree")
            P.tree(
              c,
              o.x,
              o.y,
              o.height,
              this.health(o.x, o.y),
              time,
              o.seed,
              reduced,
            );
          else if (o.kind === "rock") P.rock(c, o.x, o.y, o.rx, o.ry);
          else if (o.kind === "fence") P.fence(c, o.a, o.b);
          else if (
            o.kind === "shelter" &&
            window.BosqueVegetacao?.ready &&
            BosqueVegetacao.draw(c, "objetos", 1, o.x, o.y, o.h * 1.65)
          ) {
          } else P.house(c, o.x, o.y, o.w, o.h, o.town);
          if (
            this.phase === 5 &&
            o.kind === "house" &&
            this.cleanRatio < 1 &&
            !reduced
          ) {
            const originY = o.y - o.h * 1.9;
            for (let i = 0; i < 4; i++) {
              const age = (time * 0.18 + i / 4) % 1;
              P.oval(
                c,
                o.x - o.w * 0.25 + Math.sin(age * 3 + i) * 7,
                originY - age * 35,
                5 + age * 8,
                6 + age * 8,
                `rgba(91,100,82,${(1 - this.cleanRatio) * (1 - age) * 0.24})`,
              );
            }
          }
          c.restore();
        },
      }));
    }
    plant(c, t, time, reduced) {
      const seeded = ["seeded", "growing", "done"].includes(t.status);
      P.oval(c, t.x, t.y, 24, 9, seeded ? "#6a5935" : "#64543b");
      const age =
        t.status === "done"
          ? reduced
            ? 1
            : P.ease((time - (t.restoredAt ?? -10)) / 4)
          : t.status === "growing"
            ? 0.4
            : t.status === "seeded"
              ? 0.1
              : 0;
      if (seeded) {
        if (age < 0.4 && window.BosqueVegetacao?.ready)
          BosqueVegetacao.draw(c, "vegetacao", 11, t.x, t.y, 13 + age * 12);
        if (t.status !== "seeded")
          P.tree(
            c,
            t.x,
            t.y,
            12 + 68 * P.ease(age),
            age,
            time,
            Math.round(t.x),
            reduced,
          );
      } else
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
    }
    state() {
      return {
        phase: this.phase,
        objects: this.objects.length,
        restored: this.objectives.length,
        complete: this.complete,
        renderer: "elementos",
        bitmapReplacements: 0,
      };
    }
  }
  window.BosqueCenario = Scene;
})();


;/* jogo/mata-ilustrada/cenario.js */
"use strict";
// Camadas de chão, pés e copas: os objetos são ordenados junto com Kai e os animais.
(() => {
  const P = BosquePintura,
    Base = BosqueCenario;
  class MataScene extends Base {
    create() {
      super.create();
      for (const o of this.objects) {
        if (o.kind === "tree") o.height *= 1.42;
        if (o.kind === "house") {
          o.h = this.phase === 1 ? 110 : o.town ? 105 : 107;
          if (this.phase !== 1) {
            const i = this.objects.filter((a) => a.kind === "house").indexOf(o),
              wall = this.data.obstacles[i];
            if (wall) {
              o.x = wall.x;
              o.y = wall.y + wall.ry * 0.5;
            }
          }
        }
        if (o.kind === "shelter") o.h = 82;
      }
      this.objects.push(...(this.data.landmarks || []));
      const d = this.data,
        random = P.random(1627 + this.phase);
      this.details = [];
      for (let i = 0; i < 280; i++) {
        const x = 20 + random() * 1240,
          y = 45 + random() * 645;
        if (this.inWater(x, y) || this.nearGoal(x, y, 30)) continue;
        if (
          this.objects.some(
            (o) => o.kind !== "tree" && Math.hypot(x - o.x, y - o.y) < 45,
          )
        )
          continue;
        this.details.push({
          x,
          y,
          height: 9 + random() * 15,
          seed: i,
          frame: i % 6 === 0 ? 18 : 1,
        });
      }
      // Juntas de pedra e canteiros são baixos, portanto não bloqueiam o jogador.
      this.borders = [];
      if (this.phase === 4)
        for (const t of d.tasks.filter((t) => t.type === "bed"))
          this.borders.push(t);
      this.rails = [];
      if (this.phase === 1) {
        const xs = d.bridge.map((p) => p[0]),
          ys = d.bridge.map((p) => p[1]);
        this.rails.push({
          x: Math.min(...xs),
          y: Math.max(...ys),
          w: Math.max(...xs) - Math.min(...xs),
        });
      } else if (d.bridge && this.phase === 2)
        this.rails.push({
          x: d.bridge.x,
          y: d.bridge.y + d.bridge.h,
          w: d.bridge.w,
        });
      if (d.dryBridge)
        this.rails.push({
          x: d.dryBridge.x,
          y: d.dryBridge.y + d.dryBridge.h,
          w: d.dryBridge.w,
        });
      this.objects.sort((a, b) => a.y - b.y);
    }
    inWater(x, y) {
      const d = this.data,
        p = { x, y };
      return this.phase === 1
        ? P.inside(p, d.river)
        : (d.water && P.inside(p, d.water)) ||
            (d.noWalkWater || []).some((w) => P.inside(p, w));
    }
    nearGoal(x, y, radius) {
      const d = this.data;
      return [
        ...(d.tasks || []),
        ...(d.fires || []),
        ...(d.animals || []),
      ].some((t) => Math.hypot(t.x - x, t.y - y) < radius);
    }
    paths() {
      return this.phase === 1
        ? this.data.edges.map(([a, b]) => [
            this.data.nodes[a],
            this.data.nodes[b],
          ])
        : MataLayout.paths[this.phase];
    }
    ground(c, objectives, time, reduced, completed) {
      this.update(objectives, time, reduced, completed);
      const d = this.data;
      P.terrain(c, this, 1280, 720, (x, y) => this.health(x, y), time);
      if (!this.detailLayer) this.detailLayer = MataArte.canvas(1280, 720);
      if (
        this.detailAt === undefined ||
        time - this.detailAt > 0.24 ||
        time < this.detailAt
      ) {
        this.detailAt = time;
        const surface = this.detailLayer.getContext("2d");
        surface.clearRect(0, 0, 1280, 720);
        this.paintDetails(surface);
      }
      c.drawImage(this.detailLayer, 0, 0);
      if (!this.roadLayer && MataArte.ready) {
        this.roadLayer = MataArte.canvas(1280, 720);
        MataPintura.trails(
          this.roadLayer.getContext("2d"),
          this.paths(),
          this.phase === 1 ? 48 : this.phase === 5 ? 48 : 37,
          this.phase === 5,
        );
      }
      if (this.roadLayer) c.drawImage(this.roadLayer, 0, 0);
      if (this.phase === 2) {
        // A areia acompanha a margem física; a tartaruga permanece em terra.
        c.save();
        P.poly(c, d.water);
        c.strokeStyle = MataArte.pattern(c, 3, 210);
        c.lineWidth = 145;
        c.stroke();
        c.restore();
        P.water(
          c,
          d.water,
          this.objectives.filter((t) => t.type === "trash").length / 8,
          time,
          reduced,
          2,
        );
        const b = d.bridge;
        P.bridge(c, [
          [b.x, b.y],
          [b.x + b.w, b.y],
          [b.x + b.w, b.y + b.h],
          [b.x, b.y + b.h],
        ]);
        for (const dock of d.docks || []) P.bridge(c, dock);
        // Pedrinhas pequenas e plantas baixas nas margens, sem obstáculos invisíveis.
        for (let i = 0; i < d.water.length; i++) {
          const a = d.water[i],
            b = d.water[(i + 1) % d.water.length],
            length = Math.hypot(a[0] - b[0], a[1] - b[1]);
          for (let j = 0; j < length / 49; j++) {
            const f = j / Math.max(1, Math.ceil(length / 49)),
              x = a[0] + (b[0] - a[0]) * f,
              y = a[1] + (b[1] - a[1]) * f;
            if (this.nearGoal(x, y, 42)) continue;
            MataArte.draw(c, j % 3 === 0 ? 20 : 19, x, y, 9 + (j % 3) * 4);
          }
        }
      }
      if (this.phase === 1) {
        P.water(c, d.river, 0.8, time, reduced, 1);
        P.bridge(c, d.bridge);
        for (const f of objectives) {
          const alpha =
            f.life > 0 ? 0.5 : 1 - P.ease((time - (f.restoredAt ?? -20)) / 4);
          if (alpha <= 0) continue;
          c.save();
          c.translate(f.x, f.y);
          c.scale(1, 0.57);
          const ash = c.createRadialGradient(0, 0, 8, 0, 0, f.rx * 0.84);
          ash.addColorStop(0, `rgba(21,24,21,${alpha})`);
          ash.addColorStop(1, "#171e1700");
          c.fillStyle = ash;
          c.fillRect(-f.rx, -f.rx, 2 * f.rx, 2 * f.rx);
          c.restore();
        }
        BosqueVegetacao.draw(c, "objetos", 6, 377, 384, 75);
        P.line(
          c,
          [
            [377, 377],
            [395, 385],
          ],
          "#a3a38a",
          12,
        );
        P.oval(c, 395, 385, 14, 8, "#61452f");
        P.oval(c, 395, 380, 13, 6, "#bd513c");
      }
      if (this.phase === 4) {
        for (const t of this.borders) {
          P.oval(c, t.x, t.y + 2, 32, 17, "#402f2588");
          P.oval(c, t.x, t.y, 29, 14, "#775131");
          for (let i = 0; i < 9; i++) {
            const a = (i / 9) * Math.PI * 2;
            P.oval(
              c,
              t.x + Math.cos(a) * 29,
              t.y + Math.sin(a) * 13,
              4,
              2.5,
              i % 2 ? "#b7a67d" : "#887c5f",
            );
          }
        }
        BosqueVegetacao.draw(c, "objetos", 6, d.refill.x, d.refill.y + 5, 51);
      }
      if (this.phase === 5) {
        for (const water of d.noWalkWater || [])
          P.water(c, water, 0.4 + 0.5 * this.cleanRatio, time, reduced, 5);
        if (d.dryBridge) {
          const b = d.dryBridge;
          P.bridge(c, [
            [b.x, b.y],
            [b.x + b.w, b.y],
            [b.x + b.w, b.y + b.h],
            [b.x, b.y + b.h],
          ]);
        }
      }
      // Iluminação suave não encobre os objetivos nem substitui a geometria do mapa.
      const light = c.createRadialGradient(660, 270, 110, 660, 270, 800);
      light.addColorStop(0, "#fff2bb08");
      light.addColorStop(1, "#152e2533");
      c.fillStyle = light;
      c.fillRect(0, 0, 1280, 720);
    }
    paintDetails(c) {
      for (const p of this.details) {
        const health = this.health(p.x, p.y);
        if (health < 0.3)
          MataArte.draw(c, p.frame, p.x, p.y, p.height, p.seed % 2 === 0);
        if (health > 0.08) {
          c.save();
          c.globalAlpha = P.clamp(health * 1.5);
          BosqueVegetacao.draw(
            c,
            "vegetacao",
            p.seed % 11 === 0 ? 9 : 8,
            p.x,
            p.y,
            p.height * (0.5 + health * 0.65),
          );
          c.restore();
        }
      }
    }
    actors(time, reduced, player) {
      const actors = this.objects.map((o) => ({
        y: o.y,
        draw: (c) => {
          const tall =
            o.kind === "house"
              ? o.h * 2.05
              : o.kind === "shelter"
                ? o.h * 1.65
                : o.height || 0;
          const half = o.kind === "house" ? 95 : o.kind === "shelter" ? 65 : 50;
          c.save();
          if (
            player &&
            tall &&
            Math.abs(player.x - o.x) < half &&
            player.y < o.y &&
            player.y > o.y - tall
          )
            c.globalAlpha = 0.4;
          if (o.kind === "tree")
            P.tree(
              c,
              o.x,
              o.y,
              o.height,
              this.health(o.x, o.y),
              time,
              o.seed,
              reduced,
            );
          else if (o.kind === "decor") {
            P.oval(c, o.x + 2, o.y + 1, o.rx + 2, o.ry + 1, "#1b261d30");
            MataArte.draw(c, o.frame, o.x, o.y + 3, o.height);
            if (o.frame === 12 && !reduced) {
              const glow = c.createRadialGradient(
                o.x + 6,
                o.y - o.height * 0.7,
                1,
                o.x + 6,
                o.y - o.height * 0.7,
                16,
              );
              glow.addColorStop(0, "#ffe6a94d");
              glow.addColorStop(1, "#ffe6a900");
              c.fillStyle = glow;
              c.fillRect(o.x - 12, o.y - o.height * 0.7 - 16, 36, 32);
            }
          } else if (o.kind === "rock") P.rock(c, o.x, o.y, o.rx, o.ry);
          else if (o.kind === "fence") P.fence(c, o.a, o.b);
          else if (o.kind === "shelter")
            BosqueVegetacao.draw(c, "objetos", 1, o.x, o.y, o.h * 1.65);
          else {
            P.house(c, o.x, o.y, o.w, o.h, o.town);
            if (this.phase === 5 && this.cleanRatio < 1 && !reduced)
              for (let i = 0; i < 4; i++) {
                const age = (time * 0.16 + i / 4) % 1;
                P.oval(
                  c,
                  o.x - 38 + Math.sin(age * 3 + i) * 8,
                  o.y - tall + 8 - age * 42,
                  5 + age * 10,
                  7 + age * 10,
                  `rgba(74,79,67,${(1 - this.cleanRatio) * (1 - age) * 0.28})`,
                );
              }
          }
          c.restore();
        },
      }));
      for (const b of this.rails)
        actors.push({
          y: b.y + 2,
          draw: (c) => MataPintura.rail(c, b.x, b.y, b.w),
        });
      return actors;
    }
    state() {
      return {
        ...super.state(),
        art: "mata-ilustrada",
        landmarks: this.data.landmarks?.length || 0,
        groundDetails: this.details.length,
      };
    }
  }
  window.BosqueCenario = MataScene;
})();


;/* jogo/trilhas-vivas/renderizacao.js */
"use strict";
(() => {
  const Base = BosqueCenario,
    P = BosquePintura,
    oldDraw = BosqueVegetacao.draw,
    cache = new Map();
  let bytes = 0,
    hits = 0,
    misses = 0;
  BosqueVegetacao.draw = (c, name, index, x, y, height) => {
    if (!BosqueVegetacao.ready) return oldDraw(c, name, index, x, y, height);
    const h = Math.max(2, Math.round(height / 2) * 2),
      key = name + ":" + index + ":" + h;
    let sprite = cache.get(key);
    if (!sprite) {
      const f = BosqueVegetacaoAtlas[name]?.frames[index];
      if (!f) return false;
      const width = Math.ceil((h * f.bounds[2]) / f.bounds[3]) + 4;
      sprite = MataArte.canvas(width + 2, h + 4);
      oldDraw(sprite.getContext("2d"), name, index, sprite.width / 2, h + 1, h);
      while (
        bytes + sprite.width * sprite.height * 4 > 12 * 1024 * 1024 &&
        cache.size
      ) {
        const key = cache.keys().next().value,
          v = cache.get(key);
        bytes -= v.width * v.height * 4;
        cache.delete(key);
      }
      bytes += sprite.width * sprite.height * 4;
      cache.set(key, sprite);
      misses++;
    } else hits++;
    const k = height / h;
    c.drawImage(
      sprite,
      x - (sprite.width * k) / 2,
      y - (h + 1) * k,
      sprite.width * k,
      sprite.height * k,
    );
    return true;
  };
  function polygons(scene) {
    const d = scene.data;
    return scene.phase === 1
      ? [d.river]
      : scene.phase === 2
        ? [d.water]
        : d.noWalkWater || [];
  }
  function bridge(c, b) {
    if (Array.isArray(b)) return P.bridge(c, b);
    P.bridge(c, [
      [b.x, b.y],
      [b.x + b.w, b.y],
      [b.x + b.w, b.y + b.h],
      [b.x, b.y + b.h],
    ]);
  }
  const oldTrails = MataPintura.trails;
  MataPintura.trails = (c, paths, width, town) =>
    oldTrails(c, paths, width * (town ? 0.85 : 0.72), town);
  class LivingScene extends Base {
    create() {
      super.create();
      this.objects = this.objects.filter(
        (o) => o.kind !== "tree" || !this.inWater(o.x, o.y),
      );
    }
    ground(c, objectives, time, reduced, complete) {
      this.update(objectives, time, reduced, complete);
      const latest = Math.max(
          -99,
          ...objectives.map((t) => t.restoredAt ?? -99),
          this.fullAt ?? -99,
        ),
        signature =
          this.objectives.map((o) => o.id || o.x + ":" + o.y).join(",") +
          ":" +
          complete;
      const changing = time - latest < 7 && !reduced;
      if (
        !this.landLayer ||
        signature !== this.landSignature ||
        (changing && time - this.landAt > 0.09)
      ) {
        this.landLayer ||= MataArte.canvas(1280, 720);
        const g = this.landLayer.getContext("2d");
        g.clearRect(0, 0, 1280, 720);
        const water = P.water;
        P.water = () => {};
        try {
          super.ground(g, objectives, time, reduced, complete);
        } finally {
          P.water = water;
        }
        // Cache do chão geométrico, com água transparente e pontes sobre a superfície.
        g.save();
        g.globalCompositeOperation = "destination-out";
        g.fillStyle = "#000";
        for (const polygon of polygons(this)) {
          P.poly(g, polygon);
          g.fill();
        }
        g.restore();
        if (this.phase === 1) bridge(g, this.data.bridge);
        if (this.phase === 2) {
          bridge(g, this.data.bridge);
          for (const dock of this.data.docks || []) bridge(g, dock);
        }
        if (this.data.dryBridge) bridge(g, this.data.dryBridge);
        this.landSignature = signature;
        this.landAt = time;
        this.floorBuilds = (this.floorBuilds || 0) + 1;
      }
      for (const polygon of polygons(this))
        P.water(
          c,
          polygon,
          this.phase === 2
            ? this.objectives.filter((t) => t.type === "trash").length / 8
            : this.phase === 1
              ? 0.8
              : 0.4 + 0.5 * this.cleanRatio,
          time,
          reduced,
          this.phase,
        );
      c.drawImage(this.landLayer, 0, 0);
    }
    actors(t, reduced, player) {
      const items = super.actors(t, reduced, player);
      return items.map((a, i) => ({
        y: a.y,
        draw: (c) => {
          const o = this.objects[i];
          if (o) {
            const m = c.getTransform(),
              x = o.x * m.a + m.e,
              y = o.y * m.d + m.f,
              h = (o.height || 230) * m.d,
              w = Math.max(110, h);
            if (
              x < -w ||
              x > c.canvas.width + w ||
              y < -35 ||
              y - h > c.canvas.height + 35
            )
              return;
          }
          a.draw(c);
        },
      }));
    }
    state() {
      return {
        ...super.state(),
        art: "trilhas-vivas",
        floorBuilds: this.floorBuilds || 0,
      };
    }
  }
  window.BosqueCenario = LivingScene;
  // Não decodifica trajes substituídos e moradores que não são mais exibidos.
  const Art = GuardiaoAdventureArt;
  window.GuardiaoAdventureArt = class extends Art {
    async load() {
      const names =
        this.phase === 2
          ? []
          : this.phase === 3
            ? ["fauna-brasileira", "fauna-grande", "fauna-copa"]
            : [];
      await Promise.all(names.map((n) => this.ensure(n)));
      await BosqueKai.load();
    }
  };
  const prior = RaizesPersonagens.load;
  const phase = location.pathname.includes("floresta-viva")
    ? 1
    : Number(new URLSearchParams(location.search).get("fase") || 0);
  RaizesPersonagens.load = (names) =>
    prior(names?.filter((n) => phase === 1 || n !== "mangueira"));
  window.TrilhasRender = {
    stats: () => ({ cached: cache.size, bytes, hits, misses }),
    pixelRatio: () =>
      Math.min(
        devicePixelRatio || 1,
        Raizes.prefs().graphicsQuality === "alta"
          ? 1.75
          : Raizes.prefs().graphicsQuality === "leve"
            ? 1
            : 1.25,
      ),
  };
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


;/* jogo/mata-ilustrada/camera.js */
"use strict";
(() => {
  window.MataCamera = {
    scale(width, height, touch) {
      return Math.max(
        width / 1280,
        height / 720,
        touch ? Math.min(1.22, Math.max(0.93, height / 365)) : 1.18,
      );
    },
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


;/* jogo/reencontro/companheira.js */
"use strict";
(() => {
  const A = RaizesPersonagens;
  // Uma única prancha para o voo, o pouso e a decolagem. As asas ficam inteiras.
  A.atlas.flora = {
    ...GuardiaoFloraEncanto,
    file: "../encanto-natural/assets/encanto-flora.webp",
  };
  function owl(
    c,
    x,
    y,
    height,
    time,
    mode = "voo",
    flip = false,
    progress = 0,
  ) {
    const still = document.body.classList.contains("reduce-motion");
    const frame =
      mode === "pousando"
        ? 8 + Math.min(3, Math.floor(progress * 4))
        : mode === "decolando"
          ? 11 - Math.min(3, Math.floor(progress * 4))
          : mode === "ombro" || mode === "fala"
            ? 12 + (!still && time % 5 > 4.72 ? 1 : 0)
            : mode === "festa"
              ? 14 + (!still ? Math.floor(time * 4) % 2 : 0)
              : still
                ? 2
                : Math.floor(time * 9) % 8;
    A.draw(c, "flora", frame, x, y, height, { flip });
    return frame;
  }
  A.owl = owl;
  if (window.VivaArt) VivaArt.owl = owl;
  function direction(p, phase) {
    const visual = document.body.dataset.heroDirection;
    if (!p.moving && /^[0-7]$/.test(visual || "")) return Number(visual);
    const npc =
      phase === 1
        ? { x: 245, y: 245 }
        : window.GuardiaoFasesJogaveis?.[phase]?.npcPosition;
    if (npc && !p.moving && Math.hypot(p.x - npc.x, p.y - npc.y) < 100)
      return (
        (Math.round(-Math.atan2(npc.y - p.y, npc.x - p.x) / (Math.PI / 4)) +
          8) %
        8
      );
    return p.direction ?? 6;
  }
  function shoulder(p, phase) {
    const d = direction(p, phase);
    return {
      x: p.x + (d >= 3 && d <= 5 ? 19 : -19),
      y: p.y - ([1, 2, 3].includes(d) ? 46 : d >= 5 ? 42 : 43),
    };
  }
  function update(f, p, dt, options) {
    const { phase, busy, reward, jump = 0 } = options;
    const rest = phase !== 2 && !p.moving && !busy && !jump && p.idle > 2.5;
    let target;
    if (reward) {
      f.mode = "comemorando";
      target = { x: p.x + 39, y: p.y - 91 };
    } else if (rest) {
      if (!["aproximando", "pousando", "ombro"].includes(f.mode)) {
        f.mode = "aproximando";
        f.elapsed = 0;
      }
      target = shoulder(p, phase);
      if (
        f.mode === "aproximando" &&
        Math.hypot(f.x - target.x, f.y - target.y) < 3
      ) {
        f.mode = "pousando";
        f.elapsed = 0;
      }
      if (f.mode === "pousando" && f.elapsed >= 0.55) f.mode = "ombro";
    } else {
      if (["aproximando", "pousando", "ombro"].includes(f.mode)) {
        f.mode = "decolando";
        f.elapsed = 0;
      }
      if (f.mode !== "decolando" || f.elapsed >= 0.38) f.mode = "voando";
      const d = p.direction ?? 6,
        angle = (-d * Math.PI) / 4;
      target = {
        x: p.x - Math.cos(angle) * 40 - 12,
        y: p.y - 99 - Math.sin(angle) * 14 - jump,
      };
    }
    f.elapsed += dt;
    const k = 1 - Math.exp(-dt * 7);
    f.x += (target.x - f.x) * k;
    f.y += (target.y - f.y) * k;
    if (f.mode === "ombro") Object.assign(f, target);
  }
  const Life = GuardiaoVidaNatural;
  window.GuardiaoVidaNatural = class extends Life {
    flora(c, f, p, time, reduced) {
      const phase = this.phase,
        mode = f.mode;
      const landed = mode === "ombro";
      const blend =
        mode === "pousando"
          ? Math.min(1, f.elapsed / 0.55)
          : mode === "decolando"
            ? 1 - Math.min(1, f.elapsed / 0.38)
            : landed
              ? 1
              : 0;
      const h = 35 - 8 * blend;
      const frame = owl(
        c,
        f.x,
        f.y + (reduced || landed ? 0 : Math.sin(time * 4) * 0.7),
        h,
        reduced ? 0 : time,
        mode === "comemorando"
          ? "festa"
          : ["ombro", "pousando", "decolando"].includes(mode)
            ? mode
            : "voo",
        direction(p, phase) >= 3 && direction(p, phase) <= 5,
        Math.min(1, f.elapsed / (mode === "pousando" ? 0.55 : 0.38)),
      );
      document.body.dataset.floraFrame = String(frame);
    }
  };
  window.FloraCompanheira = { update, shoulder, direction };
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


;/* jogo/reencontro/rio-atlas.js */
"use strict";
window.ReencontroRioAtlas = {
  file: "assets/kai-rio-cuidado.webp",
  width: 2048,
  height: 1024,
  referenceHeight: 371.0,
  frames: [
    { bounds: [6, 6, 258, 375], pivot: [150.0, 378] },
    { bounds: [518, 6, 297, 375], pivot: [657.0, 378] },
    { bounds: [1030, 6, 279, 375], pivot: [1170.0, 378] },
    { bounds: [1542, 6, 252, 375], pivot: [1682.0, 378] },
    { bounds: [6, 518, 257, 374], pivot: [150.0, 889] },
    { bounds: [518, 518, 264, 376], pivot: [658.0, 891] },
    { bounds: [1030, 518, 275, 375], pivot: [1168.0, 890] },
    { bounds: [1542, 518, 256, 376], pivot: [1686.0, 891] },
  ],
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


;/* jogo/arte-viva/conquista.js */
"use strict";
(() => {
  const Previous = GuardiaoColar;
  window.GuardiaoColar = class extends Previous {
    begin(onFinish) {
      this.celebrationReady = false;
      if (this.phase === 5)
        RaizesPersonagens.load(["acoes"])
          .then(() => {
            this.celebrationReady = true;
          })
          .catch(() => {});
      super.begin(onFinish);
    }
    create() {
      super.create();
      const canvas = this.element.querySelector("canvas");
      canvas.width = 300;
      canvas.height = 230;
      const strip = document.createElement("div");
      strip.className = "colar-pedras";
      strip.setAttribute("aria-hidden", "true");
      strip.innerHTML = Array.from(
        { length: 5 },
        (_, i) =>
          `<span data-pedra-resumo="${i + 1}">${GuardiaoRelicario.fragment(i, true)}</span>`,
      ).join("");
      this.element.querySelector("footer").append(strip);
      this.badges = [...strip.children];
    }
    render(time, reduced = false) {
      super.render(time, reduced);
      if (!this.active) return;
      const earned = time >= 2.8 ? this.after : this.before;
      this.badges.forEach((e, i) =>
        e.classList.toggle("obtained", earned.includes(i + 1)),
      );
      const c = this.element.querySelector("canvas").getContext("2d");
      c.clearRect(0, 0, 300, 230);
      if (this.phase === 5 && time >= 2.8 && this.celebrationReady)
        RaizesPersonagens.draw(c, "acoes", 5, 110, 220, 185);
      else this.drawActor(c, time, 110, 220, 185);
      this.life?.draw(
        c,
        "flora",
        reduced ? 14 : 14 + (Math.floor(time * 4) % 2),
        240,
        121,
        61,
      );
    }
  };
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


;/* jogo/reencontro/cuidados.js */
"use strict";
(() => {
  const pending = (t) =>
    t.status === "pending" || ["ferido", "tratando"].includes(t.stage);
  const problem = (t) =>
    t.problem || { capivara: "paw", cervo: "paw", passaro: "wing" }[t.id];
  const line = (c, points, color, width) => {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(...points[0]);
    for (const p of points.slice(1)) c.lineTo(...p);
    c.stroke();
  };
  function draw(c, t, time, reduced, progress = 0, player = null) {
    if (!pending(t)) return;
    const kind = problem(t);
    if (!kind || kind === "cage") return;
    const p = t.position || t,
      bird = ["passaro", "arara", "tucano"].includes(t.speciesKey || t.id);
    c.save();
    c.translate(p.x, p.y);
    const k = 1 - Math.min(1, Math.max(0, (progress - 0.35) / 0.65));
    c.globalAlpha *= k;
    if (kind === "plastic") {
      const x = progress * 30,
        y = progress * -13;
      c.translate(x, y);
      const g = c.createLinearGradient(-23, -26, 25, 0);
      g.addColorStop(0, "#e7f8f4a8");
      g.addColorStop(0.5, "#b0d8df50");
      g.addColorStop(1, "#d3eeee9c");
      c.fillStyle = g;
      c.strokeStyle = "#daeaf0";
      c.lineWidth = 1.3;
      c.beginPath();
      c.moveTo(-24, -24);
      c.quadraticCurveTo(0, -32, 24, -22);
      c.lineTo(27, -6);
      c.quadraticCurveTo(0, 6, -25, -4);
      c.closePath();
      c.fill();
      c.stroke();
      line(
        c,
        [
          [-21, -24],
          [-24, -33],
          [-12, -35],
          [-9, -27],
        ],
        "#c4e5e9",
        2,
      );
      line(
        c,
        [
          [15, -27],
          [18, -34],
          [25, -31],
          [23, -23],
        ],
        "#c4e5e9",
        2,
      );
      line(
        c,
        [
          [-14, -21],
          [-9, -11],
          [-13, -4],
        ],
        "#f4fffe9c",
        1,
      );
    } else if (kind === "net") {
      c.translate(progress * 24, -progress * 9);
      c.strokeStyle = "#a89569";
      c.lineWidth = 1.4;
      c.beginPath();
      c.ellipse(0, -13, 29, 17, -0.06, 0, Math.PI * 2);
      c.stroke();
      c.save();
      c.beginPath();
      c.ellipse(0, -13, 29, 17, -0.06, 0, Math.PI * 2);
      c.clip();
      for (let i = -48; i < 50; i += 9) {
        line(
          c,
          [
            [i, -34],
            [i + 44, 10],
          ],
          "#d2c398",
          1,
        );
        line(
          c,
          [
            [i, -34],
            [i - 44, 10],
          ],
          "#7f7658",
          1,
        );
      }
      c.restore();
      line(
        c,
        [
          [25, -18],
          [38, -24],
          [43, -20],
        ],
        "#bfa57a",
        2,
      );
    } else if (kind === "log") {
      c.translate(0, -Math.sin((progress * Math.PI) / 2) * 29);
      line(
        c,
        [
          [-31, -3],
          [1, -9],
          [32, -3],
        ],
        "#483523",
        12,
      );
      line(
        c,
        [
          [-31, -5],
          [1, -11],
          [32, -5],
        ],
        "#987044",
        8,
      );
      line(
        c,
        [
          [-22, -8],
          [0, -12],
          [20, -8],
        ],
        "#d0a166",
        2,
      );
      line(
        c,
        [
          [12, -7],
          [22, -20],
          [30, -23],
        ],
        "#6f4d30",
        5,
      );
      line(
        c,
        [
          [-8, -9],
          [-15, -19],
        ],
        "#6f4d30",
        4,
      );
    } else {
      // Pequeno curativo visível na asa/pata; sem ferimentos gráficos.
      const x = bird ? 14 : 16,
        y = bird ? -14 : -5;
      c.translate(x, y);
      c.rotate(bird ? -0.6 : 0.2);
      c.fillStyle = "#f7d7a4";
      c.strokeStyle = "#8f6744";
      c.lineWidth = 0.8;
      c.beginPath();
      c.roundRect(-7, -5, 14, 10, 2);
      c.fill();
      c.stroke();
      c.fillStyle = "#cf775b";
      c.fillRect(-1.3, -3.5, 2.6, 7);
      c.fillRect(-3.5, -1.3, 7, 2.6);
    }
    c.restore();
    if (progress > 0.1 && progress < 0.88 && player) {
      // O material retirado vai para a bolsa, enquanto o animal continua no lugar.
      const q = Math.max(0, (progress - 0.45) / 0.5),
        x = p.x + (player.x - p.x) * q,
        y = p.y - 14 + (player.y - p.y - 22) * q;
      if (q > 0) {
        c.save();
        c.globalAlpha = 1 - q;
        c.translate(x, y);
        c.rotate(q * 2);
        c.fillStyle = kind === "net" ? "#baab81" : "#d8e7db";
        c.strokeStyle = "#647d72";
        c.lineWidth = 1;
        c.beginPath();
        c.roundRect(-6, -4, 12, 8, 2);
        c.fill();
        c.stroke();
        c.restore();
      }
    }
  }
  function approach(player, animal, nav) {
    // As ações de cuidado são poses laterais. Kai se aproxima do lado do animal,
    // em vez de esticar as mãos para outra direção. Só usa trechos já livres:
    // não faz uma busca síncrona de rota durante o resgate.
    return [-38, 38]
      .map((dx) => ({ x: animal.x + dx, y: animal.y + 12 }))
      .filter(
        (p) =>
          nav.walkable(p) &&
          nav.visible(player, p) &&
          nav.interactionVisible(p, animal),
      )
      .sort(
        (a, b) =>
          Math.hypot(player.x - a.x, player.y - a.y) -
          Math.hypot(player.x - b.x, player.y - b.y),
      )[0];
  }
  window.GuardiaoCuidados = { draw, pending, problem, approach };
})();


;/* jogo/rio-claro/atlas.js */
"use strict";
window.RioClaroAtlas = {
  kai: {
    file: "assets/kai-nado.webp",
    width: 1280,
    height: 1600,
    referenceHeight: 260,
    frames: [
      {
        bounds: [13, 50, 294, 219],
        pivot: [160.0, 269],
        head: [207.04, 115.7],
      },
      {
        bounds: [333, 43, 294, 234],
        pivot: [480.0, 277],
        head: [527.04, 113.2],
      },
      {
        bounds: [653, 43, 294, 233],
        pivot: [800.0, 276],
        head: [847.04, 112.9],
      },
      {
        bounds: [973, 43, 294, 233],
        pivot: [1120.0, 276],
        head: [1167.04, 112.9],
      },
      {
        bounds: [52, 333, 215, 294],
        pivot: [159.5, 627],
        head: [159.5, 403.56],
      },
      {
        bounds: [370, 333, 220, 294],
        pivot: [480.0, 627],
        head: [480.0, 403.56],
      },
      {
        bounds: [683, 333, 234, 294],
        pivot: [800.0, 627],
        head: [783.62, 412.38],
      },
      {
        bounds: [994, 333, 251, 294],
        pivot: [1119.5, 627],
        head: [1101.93, 412.38],
      },
      {
        bounds: [13, 684, 294, 231],
        pivot: [160.0, 915],
        head: [207.04, 753.3],
      },
      {
        bounds: [333, 685, 294, 229],
        pivot: [480.0, 914],
        head: [527.04, 753.7],
      },
      {
        bounds: [653, 671, 294, 258],
        pivot: [800.0, 929],
        head: [847.04, 748.4],
      },
      {
        bounds: [973, 672, 294, 255],
        pivot: [1120.0, 927],
        head: [1167.04, 748.5],
      },
      {
        bounds: [47, 973, 226, 294],
        pivot: [160.0, 1267],
        head: [160.0, 1143.52],
      },
      {
        bounds: [340, 973, 279, 294],
        pivot: [479.5, 1267],
        head: [479.5, 1143.52],
      },
      {
        bounds: [653, 1003, 294, 233],
        pivot: [800.0, 1236],
        head: [800.0, 1138.14],
      },
      {
        bounds: [973, 1026, 294, 187],
        pivot: [1120.0, 1213],
        head: [1120.0, 1134.46],
      },
      {
        bounds: [13, 1332, 294, 216],
        pivot: [160.0, 1548],
        head: [160.0, 1457.28],
      },
      {
        bounds: [368, 1293, 223, 294],
        pivot: [479.5, 1587],
        head: [479.5, 1463.52],
      },
      {
        bounds: [701, 1293, 197, 294],
        pivot: [799.5, 1587],
        head: [799.5, 1463.52],
      },
      {
        bounds: [1024, 1293, 191, 294],
        pivot: [1119.5, 1587],
        head: [1119.5, 1463.52],
      },
    ],
  },
  animais: {
    file: "assets/animais-rio.webp",
    width: 1280,
    height: 960,
    referenceHeight: 260,
    frames: [
      {
        bounds: [13, 67, 294, 186],
        pivot: [160.0, 253],
      },
      {
        bounds: [333, 66, 294, 187],
        pivot: [480.0, 253],
      },
      {
        bounds: [653, 69, 294, 181],
        pivot: [800.0, 250],
      },
      {
        bounds: [973, 68, 294, 183],
        pivot: [1120.0, 251],
      },
      {
        bounds: [13, 397, 294, 166],
        pivot: [160.0, 563],
      },
      {
        bounds: [333, 396, 294, 167],
        pivot: [480.0, 563],
      },
      {
        bounds: [653, 401, 294, 158],
        pivot: [800.0, 559],
      },
      {
        bounds: [973, 400, 294, 159],
        pivot: [1120.0, 559],
      },
      {
        bounds: [13, 716, 294, 167],
        pivot: [160.0, 883],
      },
      {
        bounds: [333, 716, 294, 168],
        pivot: [480.0, 884],
      },
      {
        bounds: [653, 709, 294, 182],
        pivot: [800.0, 891],
      },
      {
        bounds: [973, 703, 294, 194],
        pivot: [1120.0, 897],
      },
    ],
  },
};


;/* jogo/rio-claro/rio.js */
"use strict";
(() => {
  const Previous = GuardiaoAdventureArt,
    base = new URL("./", ({src:new URL("../rio-claro/rio.js?v=rio-1",document.baseURI).href}).src),
    atlas = RioClaroAtlas;
  const clamp = (v) => Math.max(0, Math.min(1, v || 0));
  const smooth = (v) => (v = clamp(v)) * v * (3 - 2 * v);
  const cycles = [
    [0, 1, 2, 3],
    [6, 7, 6, 7],
    [4, 5, 4, 5],
    [6, 7, 6, 7],
    [0, 1, 2, 3],
    [12, 13, 14, 15, 16, 17, 18, 19],
    [12, 13, 14, 15, 16, 17, 18, 19],
    [12, 13, 14, 15, 16, 17, 18, 19],
  ];
  function draw(
    c,
    im,
    d,
    index,
    x,
    y,
    height,
    flip = false,
    head = false,
    alpha = 1,
  ) {
    if (!im?.complete || !im.naturalWidth) return false;
    const f = d.frames[index],
      b = f.bounds,
      pivot = head ? f.head : f.pivot,
      k = height / d.referenceHeight;
    c.save();
    c.globalAlpha *= alpha;
    c.translate(x, y);
    if (flip) c.scale(-1, 1);
    c.drawImage(
      im,
      ...b,
      (b[0] - pivot[0]) * k,
      (b[1] - pivot[1]) * k,
      b[2] * k,
      b[3] * k,
    );
    c.restore();
    return true;
  }
  window.GuardiaoAdventureArt = class extends Previous {
    async load(...args) {
      await super.load(...args);
      if (this.phase !== 2) return;
      this.riverSheets = {};
      // TrilhasRender substitui load() da arte base: os sprites aquáticos devem
      // ser dependências explícitas da fase, nunca depender de um load ancestral.
      await Promise.all([
        this.ensure("traje-acoes"),
        ...Object.entries(atlas).map(async ([name, d]) => {
          const im = new Image();
          im.src = new URL(d.file, base).href;
          await im.decode();
          if (im.naturalWidth !== d.width || im.naturalHeight !== d.height)
            throw Error("Prancha aquática incompatível: " + name);
          this.riverSheets[name] = im;
        }),
        (async () => {
          const im = new Image();
          im.src = new URL(
            "../reencontro/" + ReencontroRioAtlas.file,
            base,
          ).href;
          await im.decode();
          this.careOnLand = im;
        })(),
      ]);
    }
    river(c, p, time, reduced, options = {}) {
      if (this.phase !== 2) return super.river(c, p, time, reduced, options);
      const direction = ((p.direction ?? 6) + 8) % 8,
        progress = clamp(options.progress),
        collecting = options.kind === "trash",
        caring = options.kind === "desprender";
      document.body.dataset.heroDirection = String(direction);
      if (options.dressing) return super.river(c, p, time, reduced, options);
      if (!p.swimming && !options.kind) {
        BosqueKai.walk(c, p, time, reduced, 63, false, "protecao");
        return "traje-andar:" + BosqueKai.pose(p, reduced).step;
      }
      if (!p.swimming && caring) {
        const index =
          (options.problem === "net" ? 0 : 4) +
          Math.min(3, Math.floor(progress * 4));
        draw(
          c,
          this.careOnLand,
          ReencontroRioAtlas,
          index,
          p.x,
          p.y,
          66,
          direction >= 3 && direction <= 5,
        );
        return (document.body.dataset.riverPose =
          "libertar-no-habitat:" + index);
      }
      // A coleta usa poses de corpo flutuante, inclusive quando o objeto está
      // próximo da margem. Não reaproveita a antiga pose de ficar de pé no rio.
      const cycle = cycles[direction],
        step = reduced
          ? 0
          : Math.floor(time * (p.moving ? 6 : 1.6)) % cycle.length,
        index =
          collecting || caring
            ? 8 + Math.min(3, Math.floor(progress * 4))
            : cycle[step],
        flip =
          collecting || caring
            ? direction >= 3 && direction <= 5
            : [1, 4, 5].includes(direction),
        bob = reduced ? 0 : Math.sin(time * 3) * 1.1;
      c.save();
      c.strokeStyle = "#d5fff2b5";
      c.lineWidth = 1;
      for (const [rx, ry, dy] of [
        [26, 6, -7],
        [15, 3, 0],
      ]) {
        c.beginPath();
        c.ellipse(
          p.x,
          p.y + dy,
          rx + (reduced ? 0 : Math.sin(time * 3) * 1.4),
          ry,
          0,
          0,
          Math.PI * 2,
        );
        c.stroke();
      }
      c.restore();
      const drawn = draw(
        c,
        this.riverSheets?.kai,
        atlas.kai,
        index,
        p.x,
        p.y - 25 + bob,
        82,
        flip,
        true,
      );
      document.body.dataset.riverSpriteDrawn = String(drawn);
      return (document.body.dataset.riverPose =
        (caring
          ? "libertar-no-habitat:"
          : collecting
            ? "coletar-na-bolsa:"
            : "kai-nadando:") + index);
    }
    riverTrash(c, sprites, target, p, progress) {
      if (!target || progress < 0.18 || progress > 0.82) return;
      const flip = p.direction >= 3 && p.direction <= 5 ? -1 : 1,
        hand = { x: p.x + 18 * flip, y: p.y - 7 },
        bag = { x: p.x - 8 * flip, y: p.y + 18 },
        leg =
          progress < 0.4
            ? smooth((progress - 0.18) / 0.22)
            : smooth((progress - 0.4) / 0.36),
        a = progress < 0.4 ? target : hand,
        b = progress < 0.4 ? hand : bag;
      c.save();
      c.globalAlpha = 1 - smooth((progress - 0.72) / 0.1);
      sprites.draw(
        c,
        "objetos",
        Number(target.id.replace("lixo", "")) % 4,
        a.x + (b.x - a.x) * leg,
        a.y + (b.y - a.y) * leg,
        21,
      );
      c.restore();
    }
    riverAnimal(
      c,
      t,
      time,
      reduced,
      x = t.position.x,
      y = t.position.y,
      height = 32,
      progress = 0,
    ) {
      if (this.phase !== 2 || !this.riverSheets?.animais)
        return super.riverAnimal(c, t, time, reduced, x, y, height);
      const row = t.type === "turtle" ? 2 : t.id === "peixes2" ? 1 : 0,
        pending = t.status === "pending",
        freed = row * 4 + 2 + (reduced ? 0 : Math.floor(time * 3) % 2),
        trapped = row * 4 + (!reduced && time % 4.2 > 3.93 ? 1 : 0),
        release = pending ? smooth((progress - 0.48) / 0.38) : 1,
        scale =
          (height * 260) /
          Math.max(
            ...atlas.animais.frames
              .slice(row * 4, row * 4 + 4)
              .map((f) => f.bounds[3]),
          );
      if (release < 1)
        draw(
          c,
          this.riverSheets.animais,
          atlas.animais,
          trapped,
          x,
          y,
          scale,
          t.facingRight === false,
          false,
          1 - release,
        );
      if (release > 0)
        draw(
          c,
          this.riverSheets.animais,
          atlas.animais,
          freed,
          x,
          y,
          scale,
          t.facingRight === false,
          false,
          release,
        );
      return true;
    }
  };
  const oldCare = GuardiaoCuidados.draw;
  GuardiaoCuidados.draw = (c, t, ...args) => {
    // Rede, sacola e canudo já fazem parte das novas poses. Evita a segunda
    // caixa geométrica que antes era desenhada por cima do animal.
    if (["fish", "turtle"].includes(t.type)) return;
    return oldCare(c, t, ...args);
  };
})();


;/* jogo/correnteza/rio.js */
"use strict";
(() => {
  const Previous = GuardiaoAdventureArt;
  const swimScale = 0.78;
  window.GuardiaoAdventureArt = class extends Previous {
    riverTrash(c, sprites, target, p, progress) {
      if (this.phase !== 2 || !p.swimming || !target)
        return super.riverTrash(c, sprites, target, p, progress);
      c.save();
      c.translate(p.x, p.y);
      c.scale(swimScale, swimScale);
      const result = super.riverTrash(
        c,
        sprites,
        {
          ...target,
          x: (target.x - p.x) / swimScale,
          y: (target.y - p.y) / swimScale,
        },
        { ...p, x: 0, y: 0 },
        progress,
      );
      c.restore();
      return result;
    }
    river(c, p, time, reduced, options = {}) {
      if (this.phase !== 2) return super.river(c, p, time, reduced, options);
      if (options.dressing) {
        // Desenha diretamente o banco carregado, sem atravessar os substitutos de traje.
        const d = GuardiaoAmanhaAtlas["traje-acoes"],
          im = this.images.get("traje-acoes"),
          progress = Math.max(0, Math.min(0.999, options.progress || 0)),
          index = Math.floor(progress * 4),
          f = d.frames[index],
          b = f.bounds,
          k = 90 / d.referenceHeight;
        c.save();
        c.translate(p.x, p.y);
        if (im)
          c.drawImage(
            im,
            ...b,
            (b[0] - f.pivot[0]) * k,
            (b[1] - f.pivot[1]) * k,
            b[2] * k,
            b[3] * k,
          );
        c.restore();
        document.body.dataset.dressingPose = String(index);
        return "vestindo-traje:" + index;
      }
      if (!p.swimming) return super.river(c, p, time, reduced, options);
      // Corpo parcialmente submerso. Composição reutilizada por quadro, sem
      // alocar uma superfície nova a cada atualização do jogo.
      this.swimSurface ||= Object.assign(document.createElement("canvas"), {
        width: 220,
        height: 180,
      });
      const g = this.swimSurface.getContext("2d");
      g.clearRect(0, 0, 220, 180);
      const pose = super.river(
        g,
        { ...p, x: 110, y: 90 },
        time,
        reduced,
        options,
      );
      g.globalCompositeOperation = "source-atop";
      // A cabeça emerge; braços, tronco e nadadeiras ficam sob a água em
      // todas as direções, inclusive quando os pés estão acima da cabeça na tela.
      g.beginPath();
      g.rect(0, 0, 220, 180);
      g.ellipse(110, 65, 16, 19, 0, 0, Math.PI * 2);
      g.fillStyle = "#57cfc65e";
      g.fill("evenodd");
      g.globalCompositeOperation = "destination-out";
      g.fillStyle = "#00000044";
      g.fill("evenodd");
      g.globalCompositeOperation = "source-over";
      const scale = swimScale;
      c.drawImage(
        this.swimSurface,
        p.x - 110 * scale,
        p.y - 90 * scale,
        220 * scale,
        180 * scale,
      );
      c.save();
      c.strokeStyle = "#e1fff4bd";
      c.lineWidth = 1.2;
      const t = reduced ? 0 : time;
      for (let i = 0; i < 3; i++) {
        const q = (t * 0.65 + i / 3) % 1;
        c.globalAlpha = (1 - q) * 0.7;
        c.beginPath();
        c.ellipse(
          p.x,
          p.y - 7,
          (18 + q * 18) * scale,
          (4 + q * 4) * scale,
          0,
          0.08,
          Math.PI * 0.95,
        );
        c.stroke();
      }
      c.restore();
      document.body.dataset.swimImmersion = "waterline";
      return pose;
    }
  };
})();


;/* jogo/clareira/cidade.js */
"use strict";
(() => {
  const spots = [
    { kind: "recyclable", x: 154, y: 514 },
    { kind: "organic", x: 225, y: 493 },
    { kind: "residual", x: 300, y: 472 },
  ];
  const Previous = GuardiaoAdventureArt;
  window.GuardiaoAdventureArt = class extends Previous {
    async load(...args) {
      await super.load(...args);
      if (this.phase === 5)
        await Promise.all(
          spots.map((s) => this.drawing(s.kind, GuardiaoColecao.bin(s.kind))),
        );
    }
    binActors(c) {
      if (this.phase !== 5) return [];
      return spots.map((s, i) => ({
        y: s.y,
        draw: () => {
          const im = this.drawings.get(s.kind);
          if (!im) return;
          c.drawImage(im, s.x - 27, s.y - 61, 54, 63);
          c.save();
          c.font = "bold 9px system-ui";
          c.textAlign = "center";
          c.strokeStyle = "#244635";
          c.lineWidth = 3;
          c.fillStyle = "#fff4d6";
          const label = ["Recicláveis", "Orgânicos", "Rejeitos"][i];
          c.strokeText(label, s.x, s.y + 10);
          c.fillText(label, s.x, s.y + 10);
          c.restore();
        },
      }));
    }
  };
})();


;/* jogo/bosque-vivo/busca-cooperativa.js */
"use strict";
(() => {
  const pause = () => new Promise((resolve) => setTimeout(resolve, 0));
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];
  class Heap {
    constructor() {
      this.a = [];
    }
    push(id, score) {
      let i = this.a.length;
      this.a.push({ id, score });
      while (i) {
        const p = (i - 1) >> 1;
        if (this.a[p].score <= score) break;
        this.a[i] = this.a[p];
        i = p;
      }
      this.a[i] = { id, score };
    }
    pop() {
      const first = this.a[0],
        end = this.a.pop();
      if (this.a.length) {
        let i = 0;
        while (i * 2 + 1 < this.a.length) {
          let j = i * 2 + 1;
          if (j + 1 < this.a.length && this.a[j + 1].score < this.a[j].score)
            j++;
          if (end.score <= this.a[j].score) break;
          this.a[i] = this.a[j];
          i = j;
        }
        this.a[i] = end;
      }
      return first.id;
    }
  }
  async function route(owner, from, to, options) {
    const d = owner.navigationSnapshot
      ? owner.navigationSnapshot()
      : {
          grid: owner.grid.slice(),
          cell: owner.cell,
          cols: owner.cols,
          rows: owner.rows,
        };
    const { grid, cell, cols, rows } = d,
      point = (id) => ({
        x: (id % cols) * cell + cell / 2,
        y: Math.floor(id / cols) * cell + cell / 2,
      });
    const hazards = options.hazards || [],
      clear = (p) =>
        !hazards.some(
          (h) =>
            (h.life > 0 || h.stage === "ferido") &&
            Math.hypot(p.x - (h.position || h).x, p.y - (h.position || h).y) <
              (h.stage ? 19 : 27),
        );
    let deadline = performance.now() + 5;
    async function yieldIfNeeded() {
      if (performance.now() > deadline) {
        await pause();
        deadline = performance.now() + 5;
      }
    }
    for (let i = 0; i < grid.length; i++) {
      if (grid[i] && !clear(point(i))) grid[i] = 0;
      if (i % 128 === 0) await yieldIfNeeded();
    }
    async function nearest(p) {
      let best = -1,
        bestD = Infinity;
      for (let i = 0; i < grid.length; i++) {
        if (grid[i]) {
          const q = point(i),
            v = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
          if (v < bestD) {
            bestD = v;
            best = i;
          }
        }
        if (i % 256 === 0) await yieldIfNeeded();
      }
      return best;
    }
    const start = await nearest(from),
      end = await nearest(to);
    if (start < 0 || end < 0) return [];
    const costs = new Float64Array(grid.length).fill(Infinity),
      previous = new Int32Array(grid.length).fill(-1),
      closed = new Uint8Array(grid.length),
      heap = new Heap();
    costs[start] = 0;
    heap.push(start, 0);
    while (heap.a.length) {
      const id = heap.pop();
      if (closed[id]) continue;
      closed[id] = 1;
      if (id === end) {
        const path = [];
        let p = id;
        while (p !== start) {
          path.push(point(p));
          p = previous[p];
          if (p < 0) return [];
        }
        path.push(point(start));
        path.reverse();
        if (
          Math.hypot(point(end).x - to.x, point(end).y - to.y) < cell * 2 &&
          owner.visible(point(end), to)
        )
          path.push({ ...to });
        return path;
      }
      const x = id % cols,
        y = Math.floor(id / cols),
        p = point(id);
      for (const [dx, dy] of dirs) {
        const xx = x + dx,
          yy = y + dy,
          next = yy * cols + xx;
        if (
          xx < 0 ||
          xx >= cols ||
          yy < 0 ||
          yy >= rows ||
          !grid[next] ||
          closed[next]
        )
          continue;
        if (dx && dy && (!grid[y * cols + xx] || !grid[yy * cols + x]))
          continue;
        const q = point(next);
        if (!owner.visible(p, q)) continue;
        const cost = costs[id] + Math.hypot(dx, dy) * cell;
        if (cost >= costs[next]) continue;
        costs[next] = cost;
        previous[next] = id;
        heap.push(next, cost + Math.hypot(q.x - to.x, q.y - to.y));
        await yieldIfNeeded();
      }
    }
    return [];
  }
  window.BosqueBuscaCooperativa = { route };
})();


;/* jogo/trilhas-vivas/rotas.js */
"use strict";
(() => {
  const base = new URL("./", ({src:new URL("../trilhas-vivas/rotas.js?v=trilhas-1",document.baseURI).href}).src);
  let worker,
    phase,
    nav,
    serial = 0,
    ready,
    failed = false,
    workerReady = false;
  const pending = new Map(),
    metrics = { requests: 0, completed: 0, workerMs: 0, fallbacks: 0 };
  function init(id, owner) {
    if (ready) return ready;
    phase = id;
    nav = owner;
    ready = new Promise((resolve) => {
      const fail = () => {
        failed = true;
        workerReady = false;
        clearTimeout(startTimer);
        resolve(false);
        for (const p of pending.values()) {
          clearTimeout(p.timer);
          p.reject(Error("Rota indisponível"));
        }
        pending.clear();
        worker?.terminate();
      };
      const startTimer = setTimeout(fail, 2500);
      try {
        worker = new Worker(
          new URL("../mata-ilustrada/rotas-worker.js?v=mata-1", base),
        );
        worker.onmessage = ({ data: m }) => {
          if (m.type === "ready") {
            clearTimeout(startTimer);
            workerReady = true;
            resolve(true);
            return;
          }
          if (m.error && m.id === undefined) {
            fail();
            return;
          }
          const p = pending.get(m.id);
          if (!p) return;
          pending.delete(m.id);
          clearTimeout(p.timer);
          if (m.error) p.reject(Error(m.error));
          else {
            metrics.completed++;
            metrics.workerMs += m.duration;
            p.resolve(m.route);
          }
        };
        worker.onerror = fail;
        worker.postMessage({
          type: "init",
          phase: id,
          data: id === 1 ? null : owner.data,
        });
      } catch {
        fail();
      }
    });
    return ready;
  }
  async function route(from, to, options = {}) {
    metrics.requests++;
    await ready;
    if (failed || !worker) return fallback(from, to, options);
    const id = ++serial;
    try {
      return await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(Error("Tempo da rota"));
        }, 5000);
        pending.set(id, { resolve, reject, timer });
        worker.postMessage({ id, from, to, ...options });
      });
    } catch {
      return fallback(from, to, options);
    }
  }
  // Se Workers não estiverem disponíveis, a busca cede a tela entre pequenos lotes.
  async function fallback(from, to, options) {
    metrics.fallbacks++;
    return BosqueBuscaCooperativa.route(nav, from, to, options);
  }
  window.BosqueRotas = {
    init,
    route,
    state: () => ({
      ...metrics,
      pending: pending.size,
      failed,
      workerReady,
      phase,
    }),
  };
  window.addEventListener("pagehide", (e) => {
    if (!e.persisted) worker?.terminate();
  });
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
        document.body.dataset.uiReady !== "true"
      )
        await limited(
          new Promise((resolve) => {
            const observer = new MutationObserver(() => {
              if (
                document.body.dataset.gameReady === "true" ||
                document.body.dataset.uiReady === "true" ||
                document.querySelector("#loading a")
              ) {
                observer.disconnect();
                resolve();
              }
            });
            observer.observe(document.body, {
              attributes: true,
              attributeFilter: ["data-game-ready", "data-ui-ready"],
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


;/* jogo/brisa/painel-jogo.js */
"use strict";
(() => {
  const R = Raizes,
    A = VivaArt,
    $ = (id) => document.getElementById(id);
  const phase = location.pathname.includes("/floresta-viva/")
    ? 1
    : Number(new URLSearchParams(location.search).get("fase") || 2);
  let adjustments,
    raf = 0,
    last = 0;
  const openPack = () => GuardiaoMochila.open();
  function openAdjustments() {
    if (!adjustments) {
      adjustments = document.createElement("dialog");
      adjustments.id = "phase-settings";
      adjustments.className = "ra-dialog ra-phase-settings";
      adjustments.setAttribute("aria-labelledby", "phase-settings-title");
      adjustments.innerHTML = `<header><div><p class="eyebrow">AJUSTES SEM SAIR DA FASE</p><h2 id="phase-settings-title">Do seu jeito</h2></div><button type="button" class="icon-button" aria-label="Retomar jogo">${R.icon("close")}</button></header><div class="phase-settings-form"></div>`;
      document.body.append(adjustments);
      R.bindSettings(adjustments.querySelector(".phase-settings-form"));
      adjustments.querySelector("header button").onclick = () =>
        adjustments.close();
    }
    document.querySelectorAll("dialog[open]").forEach((d) => {
      if (d.id !== "girar-celular") d.close();
    });
    document.dispatchEvent(new CustomEvent("guardiao:neutralizar"));
    adjustments.showModal();
  }
  function setupTalk() {
    const talk = $("conversa") || $("intro");
    if (!talk) return;
    const text = $("conversa-texto") || $("intro-text"),
      next = $("conversa-avancar") || $("intro-next"),
      counter = $("conversa-pagina") || $("intro-count");
    const bin = document.createElement("div");
    bin.hidden = true;
    bin.className = "ra-legacy";
    while (talk.firstChild) bin.append(talk.firstChild);
    document.body.append(bin);
    talk.classList.add("ra-talk");
    talk.setAttribute("aria-labelledby", "ra-talk-title");
    talk.innerHTML = `<header><p class="eyebrow">UM CUIDADO COMEÇA COM UM ENCONTRO</p><h2 id="ra-talk-title">${["Carlos", "Antônio", "Marina", "Rafael", "Luciana"][phase - 1]}</h2></header><div class="ra-talk-columns"><canvas class="ra-talk-scene" aria-label="Kai e o aliado se olham durante a conversa"></canvas><div class="ra-talk-copy"></div></div><footer></footer>`;
    talk.querySelector(".ra-talk-copy").append(text);
    talk.querySelector("footer").append(counter, next);
    next.className = "wood-button primary";
    next.autofocus = true;
  }
  function setupPause() {
    const d = $("menu-pausa"),
      bin = document.createElement("div");
    bin.hidden = true;
    bin.className = "ra-legacy";
    while (d.firstChild) bin.append(d.firstChild);
    document.body.append(bin);
    d.className = "ra-dialog ra-pause";
    d.setAttribute("aria-labelledby", "ra-pause-title");
    d.innerHTML = `<header><canvas id="pause-flora" aria-label="Flora descansa durante a pausa"></canvas><p class="eyebrow">UMA PAUSA NA TRILHA</p><h2 id="ra-pause-title">Respire com a floresta.</h2><button type="button" class="icon-button ra-pause-full" aria-label="Entrar em tela cheia"></button></header><p>Sua aventura continua aqui.</p><nav><button type="button" class="wood-button primary" data-resume>Continuar</button><button type="button" class="wood-button" data-adjust>${R.icon("gear")}Ajustes</button><a class="wood-button" href="${new URL("index.html#mapa", R.base)}">${R.icon("back")}Voltar ao mapa</a></nav>`;
    d.querySelector("[data-resume]").onclick = () => d.close();
    d.querySelector("[data-adjust]").onclick = openAdjustments;
    R.bindFull(d.querySelector(".ra-pause-full"));
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (now - last < 66 || document.hidden) return;
    last = now;
    const t = now / 1000,
      talk = document.querySelector(".ra-talk[open]");
    if (talk)
      A.canvas(talk.querySelector("canvas"), (c, w, h) =>
        A.meeting(c, w, h, phase, t, 0),
      );
    if (phase === 1 && $("vitoria")?.open && $("ra-celebration"))
      A.canvas($("ra-celebration"), (c, w, h) => {
        if (window.RioClaroResumo) {
          RioClaroResumo.paint(
            c,
            w,
            h,
            t,
            document.body.classList.contains("reduce-motion"),
          );
          return;
        }
        A.draw(
          c,
          "acoes",
          6,
          w * 0.38,
          h * 0.93 + Math.sin(t * 4) * 2,
          h * 0.84,
        );
        A.draw(c, "npcs", 5, w * 0.7, h * 0.93, h * 0.86);
        A.owl(c, w * 0.52, h * 0.42, h * 0.35, t, "festa", false);
      });
    if ($("menu-pausa")?.open)
      A.canvas($("pause-flora"), (c, w, h) =>
        A.owl(c, w * 0.5, h * 0.95, h * 0.75, t, "ombro", false),
      );
  }
  function init() {
    document.body.classList.add("raizes-jogo");
    setupTalk();
    setupPause();
    const top = document.querySelector("#jogo .top-actions"),
      bag = $("mochila");
    if (bag) {
      bag.className = "ra-world-icon";
      bag.innerHTML = R.icon("bag");
      bag.setAttribute("aria-label", "Mochila de Kai");
      top.prepend(bag);
    }
    const fs = document.createElement("button");
    fs.type = "button";
    fs.id = "app-fullscreen";
    fs.className = "ra-world-icon";
    top.prepend(fs);
    R.bindFull(fs);
    $("pausa").innerHTML = R.icon("pause");
    $("pausa").className = "ra-world-icon";
    document
      .querySelectorAll("[data-icon]")
      .forEach((el) => (el.innerHTML = R.icon(el.dataset.icon)));
    const hidden = document.createElement("div");
    hidden.hidden = true;
    hidden.className = "ra-legacy";
    document.body.append(hidden);
    for (const id of ["som", "ajuda", "jump-action"])
      if ($(id)) hidden.append($(id));
    if (phase === 1) {
      const waterGoal = document.querySelector('[data-goal="agua"]');
      if (waterGoal) hidden.append(waterGoal);
      $("mangueira").innerHTML = R.icon("hose") + "<small>ÁGUA</small>";
      const title = document.querySelector(".mission h1,.mission h2");
      if (title) title.textContent = "Floresta em Chamas";
    } else {
      $("tool-icon").innerHTML = R.icon(
        phase === 2
          ? "net"
          : phase === 4
            ? "water"
            : phase === 5
              ? "trash"
              : "paw",
      );
    }
    $("interagir").innerHTML = R.icon("hand") + "<small>CUIDAR</small>";
    const rotate = $("girar-tela-cheia");
    if (rotate) R.bindFull(rotate);
    if (phase === 1) {
      const art = document.querySelector(".celebration-art");
      if (art) {
        art.style.backgroundImage = "none";
        art.replaceChildren(
          Object.assign(document.createElement("canvas"), {
            id: "ra-celebration",
          }),
        );
      }
    }
    A.load(["acoes", "flora", "npcs", "encontros"]).then(
      () => (document.body.dataset.newActorsReady = "true"),
    );
    raf = requestAnimationFrame(frame);
  }
  window.addEventListener(
    "keydown",
    (e) => {
      if (document.querySelector("dialog[open]")) return;
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
        ].includes(e.key) &&
        e.target.closest?.(".top-actions")
      )
        $("cenario").focus({ preventScroll: true });
    },
    { capture: true },
  );
  window.addEventListener("pagehide", () => cancelAnimationFrame(raf));
  document.addEventListener("DOMContentLoaded", init, { once: true });
})();


;/* jogo/rio-claro/conclusao.js */
"use strict";
(() => {
  const phase = location.pathname.includes("floresta-viva")
    ? 1
    : Number(new URLSearchParams(location.search).get("fase") || 2);
  function paint(c, w, h, time, reduced = false) {
    c.save();
    c.clearRect(0, 0, w, h);
    // Os pés compartilham o chão; as asas ficam no espaço entre os rostos.
    c.fillStyle = "#698f4330";
    for (const x of [0.25, 0.74]) {
      c.beginPath();
      c.ellipse(w * x, h * 0.92, w * 0.12, h * 0.025, 0, 0, Math.PI * 2);
      c.fill();
    }
    const bob = reduced ? 0 : Math.sin(time * 3) * h * 0.008;
    RaizesPersonagens.draw(c, "acoes", 6, w * 0.25, h * 0.92 + bob, h * 0.76);
    RaizesPersonagens.draw(c, "npcs", 4 + phase, w * 0.75, h * 0.92, h * 0.79);
    RaizesPersonagens.draw(
      c,
      "flora",
      14 + (reduced ? 0 : Math.floor(time * 3) % 2),
      w * 0.52,
      h * 0.32 + bob,
      h * 0.24,
    );
    c.restore();
  }
  function init() {
    const panel = document.getElementById("vitoria");
    if (!panel) return;
    panel.className = "resumo-natural";
    const title = panel.querySelector("h2"),
      eyebrow = panel.querySelector(".panel-eyebrow,.eyebrow"),
      art = panel.querySelector(".celebration-art,#celebration"),
      stats = panel.querySelector(".completion-stats,#victory-stats"),
      next = panel.querySelector("a"),
      explore = panel.querySelector("[data-close=vitoria]"),
      notes = [...panel.querySelectorAll("#salvo,#reward-label,#save-state")];
    const header = document.createElement("header");
    header.className = "resumo-cabecalho";
    header.append(eyebrow, title);
    const body = document.createElement("div");
    body.className = "resumo-corpo";
    const reward = document.createElement("figure");
    reward.className = "resumo-colar";
    const friends = document.createElement("div");
    friends.className = "resumo-amigos";
    friends.append(art);
    const caption = document.createElement("p");
    caption.className = "resumo-legenda";
    caption.textContent =
      "Kai, Flora e " +
      ["Carlos", "Antônio", "Marina", "Rafael", "Luciana"][phase - 1];
    friends.append(caption);
    body.append(reward, friends);
    const footer = document.createElement("footer");
    footer.className = "resumo-acoes";
    explore.className = "resumo-explorar";
    next.className = "primary resumo-proximo";
    footer.append(explore, next);
    const note = document.createElement("div");
    note.className = "resumo-nota";
    note.append(...notes);
    panel.replaceChildren(header, body, stats, note, footer);
    const canvas = panel.querySelector("canvas");
    if (canvas) {
      canvas.width = 420;
      canvas.height = 230;
    }
    function update() {
      let earned = [];
      try {
        earned = JSON.parse(
          localStorage.getItem("guardiao.colar.fragmentos.v1") || "[]",
        );
      } catch {}
      earned = [
        ...new Set([...(Array.isArray(earned) ? earned : []), phase]),
      ].filter((n) => Number.isInteger(n) && n >= 1 && n <= 5);
      reward.innerHTML =
        GuardiaoRelicario.necklace(earned, "summary") +
        `<figcaption><strong>${earned.length} de 5</strong> cristais conquistados</figcaption>` +
        `<div class="resumo-cristais" aria-hidden="true">${Array.from({ length: 5 }, (_, i) => GuardiaoRelicario.fragment(i, earned.includes(i + 1))).join("")}</div>`;
    }
    update();
    new MutationObserver(() => {
      if (panel.open) update();
    }).observe(panel, { attributes: true, attributeFilter: ["open"] });
    document.body.dataset.summaryDesign = "rio-claro";
  }
  window.RioClaroResumo = { paint };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();


;/* jogo/correnteza/conclusao.js */
"use strict";
(() => {
  const Previous = GuardiaoColar;
  window.GuardiaoColar = class extends Previous {
    begin(done) {
      super.begin(done);
      const panel = document.getElementById("vitoria");
      if (!panel) return;
      this.summary = panel;
      this.originalParent = this.svg.parentElement;
      this.rewardFigure = panel.querySelector(".resumo-colar");
      this.rewardFigure.replaceChildren(this.svg);
      const caption = document.createElement("figcaption");
      caption.textContent = "Um novo cristal para o seu colar";
      this.rewardFigure.append(caption);
      const stats = panel.querySelector("#victory-stats"),
        data = window.GuardiaoFasesJogaveis?.[this.phase];
      if (stats && data)
        stats.innerHTML = data.goals
          .map(
            ([, label, total]) =>
              `<span><strong>${total}</strong>${label}</span>`,
          )
          .join("");
      panel.classList.add("reward-preview");
      this.element.hidden = true;
    }
    render(time, reduced) {
      super.render(time, reduced);
      if (!this.active || !this.summary) return;
      this.element.hidden = true;
      document.body.classList.remove("colar-em-cena");
      const cinema = document.getElementById("cinema");
      if (cinema) cinema.hidden = true;
      const canvas = this.summary.querySelector("canvas");
      if (canvas)
        RaizesPersonagens.canvas(canvas, (c, w, h) =>
          RioClaroResumo.paint(c, w, h, time, reduced),
        );
      const eyebrow = this.summary.querySelector(".resumo-cabecalho p");
      eyebrow.textContent =
        time < 2.8 ? "SEU NOVO CRISTAL" : "MISSÃO CONCLUÍDA";
    }
    complete() {
      super.complete();
      if (this.summary) {
        this.originalParent.append(this.svg);
        this.summary.classList.remove("reward-preview");
      }
    }
  };
})();


;/* jogo/brisa-suave/etiquetas.js */
"use strict";
(() => {
  let rectangles = [],
    measured = -999,
    observer;
  const invalidate = () => {
    measured = -999;
  };
  function bounds() {
    const now = performance.now();
    if (now - measured > 120) {
      rectangles = [
        ...document.querySelectorAll(
          "#jogo .mission,#jogo .missions,#jogo .top-actions,#jogo .joystick,#jogo .actions,#jogo #ajuda,#jogo #jump-action",
        ),
      ]
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width && r.height);
      measured = now;
    }
    return rectangles;
  }
  window.GuardiaoEtiquetas = Object.freeze({
    position(x, y, w, view, width, height) {
      const { s, ox, oy } = view;
      const screenX = Math.max(
        8 + (w * s) / 2,
        Math.min(width - 8 - (w * s) / 2, x * s + ox),
      );
      let screenY = Math.max(22, Math.min(height - 10, y * s + oy));
      const reserved = bounds();
      for (let pass = 0; pass < 2; pass++)
        for (const r of reserved)
          if (
            screenX - (w * s) / 2 < r.right + 5 &&
            screenX + (w * s) / 2 > r.left - 5 &&
            screenY - 17 * s < r.bottom + 5 &&
            screenY + 6 * s > r.top - 5
          )
            screenY =
              r.top < height / 2
                ? Math.min(height - 10, r.bottom + 7 + 17 * s)
                : Math.max(22, r.top - 7 - 6 * s);
      return { x: (screenX - ox) / s, y: (screenY - oy) / s };
    },
  });
  window.addEventListener("resize", invalidate);
  document.addEventListener("guardiao:preferencias", invalidate);
  document.addEventListener("DOMContentLoaded", () => {
    const short = {
      agua: "Água",
      fogo: "Fogo",
      animal: "Animais",
      trash: "Lixo",
      key: "Chave",
      bed: "Plantas",
      recycle: "Reciclagem",
      solar: "Energia",
      garden: "Jardins",
    };
    document
      .querySelectorAll("#jogo [data-goal] .goal-label")
      .forEach((label) => {
        const goal = label.closest("[data-goal]")?.dataset.goal;
        if (short[goal]) {
          label.dataset.short = short[goal];
          label.title = label.textContent.trim();
        }
      });
    const water = document.querySelector('[data-goal="agua"]'),
      mission = document.querySelector("#jogo .mission");
    if (water && mission) {
      mission.insertBefore(water, mission.querySelector('[data-goal="fogo"]'));
      const state = document.getElementById("agua-estado");
      const update = () => {
        water.hidden = state?.textContent === "liberada";
        invalidate();
      };
      const watcher = new MutationObserver(() => {
        update();
        if (water.hidden) watcher.disconnect();
      });
      if (state)
        watcher.observe(state, {
          childList: true,
          characterData: true,
          subtree: true,
        });
      update();
    }
    if (!window.ResizeObserver) return;
    observer = new ResizeObserver(invalidate);
    document
      .querySelectorAll(".mission,.missions,.top-actions,.actions")
      .forEach((el) => observer.observe(el));
  });
})();


;/* jogo/trilhas-vivas/campanha.js */
"use strict";
(() => {
  const $ = (id) => document.getElementById(id),
    id = Number(new URLSearchParams(location.search).get("fase") || 2),
    data = window.GuardiaoFasesJogaveis[id];
  if (!data || !window.GuardiaoProgresso.unlocked(id)) {
    $("loading").innerHTML =
      'Esta região vem depois da missão anterior.<br><a href="../../tela-inicial/nova-versao/aventura.html">Voltar ao mapa</a>';
    return;
  }
  const KEY = "guardiao.jornada.fase." + id + ".v1",
    PREF = "guardiao.horizonte.preferences.v1";
  const { Navigation, distance } = window.GuardiaoNavegacao,
    nav = new Navigation({
      ...data,
      obstacles: [...data.obstacles, { ...data.npcPosition, rx: 12, ry: 9 }],
    }),
    canvas = $("cenario"),
    ctx = canvas.getContext("2d");
  window.BosqueRotas.init(id, nav);
  const world = new BosqueCenario(id, data);
  const life = new window.GuardiaoVidaNatural(id);
  const art = new window.GuardiaoAdventureArt(id);
  const ui = new window.GuardiaoGameUI({
    phase: id,
    state: () => ({ locked: locked(), action, swimming: player.swimming }),
  });
  const colar = new window.GuardiaoColar({ phase: id, life });
  const sprites = new window.GuardiaoCampaignSprites(),
    shared = new window.FlorestaSprites(),
    player = {
      ...data.start,
      direction: 4,
      moving: false,
      distance: 0,
      idle: 0,
      swimming: false,
    },
    flora = { x: player.x - 25, y: player.y - 65, mode: "voando", elapsed: 0 };
  let tasks = data.tasks.map((t) => ({
      ...t,
      status: "pending",
      progress: 0,
      position: { x: t.x, y: t.y },
      route: [],
    })),
    ready = false,
    completed = false,
    itemsGiven = false,
    stage = "intro",
    water = 100,
    bag = [],
    route = [],
    action = null,
    puzzleTask = null,
    protective = false,
    dressingTime = 0,
    pendingInteraction = null;
  let routeTicket = 0,
    playerRoutePending = false;
  let time = 0,
    last = 0,
    raf = 0,
    elapsed = 0,
    dirty = false,
    messageUntil = 0,
    introIndex = 0,
    handoff = 0,
    rewardTime = 0,
    announcedReturn = false;
  let iconImage,
    preferences = {},
    view = { w: innerWidth, h: innerHeight },
    camera = { x: 640, y: 360, scale: 1 },
    keys = new Set(),
    stick = { x: 0, y: 0, id: null },
    heldTool = false,
    toolPointer = null;
  try {
    preferences = JSON.parse(localStorage.getItem(PREF) || "{}") || {};
  } catch {}
  const reduced = () =>
    preferences.reduceMotion === true ||
    matchMedia("(prefers-reduced-motion:reduce)").matches;
  const animal = (t) =>
      ["fish", "turtle", "cage", "kitten", "bird", "care"].includes(t.type),
    finished = (t) => t.status === "done" || t.status === "safe";
  const group = (t, type) => (type === "animal" ? animal(t) : t.type === type),
    goalsDone = () => tasks.every(finished),
    paused = () =>
      document.hidden ||
      window.GuardiaoOrientacao?.blocked ||
      [...document.querySelectorAll("dialog")].some((d) => d.open),
    locked = () =>
      !ready ||
      paused() ||
      ["intro", "handoff", "dressing", "reward"].includes(stage);
  const near = (p, r = 82) => distance(player, p) < r;
  function readSave() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s?.version !== 1 || s.phase !== id) return;
      itemsGiven = s.itemsGiven === true;
      if (!itemsGiven) return;
      for (const t of tasks) {
        const old = s.tasks?.find((a) => a.id === t.id);
        if (!old) {
          // Uma partida concluída antes da ampliação da fauna continua concluída.
          if (s.completed && animal(t)) {
            t.status = "safe";
            t.position = { ...animalHome(t) };
          }
          continue;
        }
        const allowed =
          t.type === "bed"
            ? ["pending", "cleared", "dug", "seeded", "growing", "done"]
            : t.type === "recycle"
              ? ["pending", "carried", "done"]
              : animal(t)
                ? ["pending", "returning", "safe"]
                : ["pending", "done"];
        if (allowed.includes(old.status)) {
          t.status =
            t.type === "bed" && ["cleared", "dug"].includes(old.status)
              ? "pending"
              : t.type === "bed" && old.status === "growing"
                ? "done"
                : old.status;
          t.seedSpecies = old.seedSpecies || "ipê";
          t.quizPassed = old.quizPassed === true;
          t.progress = Math.max(0, Math.min(1, Number(old.progress) || 0));
          if (t.status === "safe" && animal(t))
            t.position = { ...animalHome(t) };
          if (t.status === "returning") {
            if (old.position && nav.walkable(old.position))
              t.position = { ...old.position };
            t.route = animalRoute(t);
          }
        }
      }
      bag = tasks.filter((t) => t.status === "carried").map((t) => t.id);
      water = Number.isFinite(s.water)
        ? Math.min(100, Math.max(0, s.water))
        : 100;
      if (s.player && nav.walkable(s.player))
        Object.assign(player, { x: s.player.x, y: s.player.y });
      completed = s.completed === true && goalsDone();
      protective = id === 2 && (s.protective === true || completed);
      if (id === 2 && !protective && nav.swimming(player))
        Object.assign(player, data.start);
      stage = "exploring";
    } catch {}
  }
  function save() {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          version: 1,
          phase: id,
          itemsGiven,
          completed,
          protective,
          water,
          player: { x: player.x, y: player.y },
          tasks: tasks.map((t) => ({
            id: t.id,
            status: t.status,
            progress: t.progress,
            seedSpecies: t.seedSpecies,
            quizPassed: t.quizPassed === true,
            position: { ...t.position },
          })),
        }),
      );
      window.GuardiaoMemoria.record(
        id,
        tasks.map((t) => ({
          id: t.id,
          type: t.type,
          name: t.name,
          status: t.status,
          seedSpecies: t.seedSpecies,
          speciesKey: t.speciesKey,
        })),
        { completed, water, protective },
      );
      dirty = false;
      return true;
    } catch {
      return false;
    }
  }
  function neutral() {
    routeTicket++;
    playerRoutePending = false;
    window.GuardiaoAudio?.water(false);
    keys.clear();
    stick = { x: 0, y: 0, id: null };
    heldTool = false;
    toolPointer = null;
    $("stick").style.transform = "";
    $("ferramenta").classList.remove("is-held");
  }
  function message(text, speaker = "Flora") {
    if (preferences.contextHints === false && speaker === "Dica") return;
    $("message").textContent =
      (speaker === "Dica" ? "" : speaker + ": ") + text;
    $("message").hidden = false;
    messageUntil = time + Math.max(2.8, Math.min(5, text.length / 22));
  }
  function open(id) {
    neutral();
    route = [];
    save();
    if (id === "inventario") ui.pack();
    else ui.open(id);
  }
  function showIntro() {
    introIndex = 0;
    stage = "intro";
    introLine();
    ui.open("intro");
  }
  function introLine() {
    $("intro-name").textContent = data.npc;
    $("intro-text").textContent = data.intro[introIndex];
    $("intro-count").textContent = introIndex + 1 + " / " + data.intro.length;
    $("intro-next").textContent =
      introIndex === 1 ? "Vamos cuidar!" : "Continuar";
    $("intro-portrait").innerHTML = sprites.markup(
      "npcs",
      data.npcRow * 3 + (introIndex === 1 ? 2 : 1),
    );
  }
  function advanceIntro() {
    if (introIndex === 0) {
      introIndex = 1;
      introLine();
      return;
    }
    $("intro").close();
    stage = "handoff";
    handoff = 1.5;
    $("cinema").hidden = false;
    $("cinema-text").textContent =
      data.npc + " entrega " + data.equipmentText.toLowerCase();
  }
  function grant() {
    itemsGiven = true;
    window.GuardiaoMemoria.grant(id);
    if (id !== 2)
      window.GuardiaoMemoria.uniform(
        { 3: "resgate", 4: "plantio", 5: "voluntario" }[id],
        { required: true },
      );
    stage = "exploring";
    $("cinema").hidden = true;
    dirty = true;
    save();
    window.GuardiaoAudio?.effect("receber");
    message(data.hint);
    updateHUD();
    if (id === 2) startDressing();
  }
  function startDressing() {
    neutral();
    route = [];
    stage = "dressing";
    dressingTime = 0;
    $("message").hidden = true;
    $("cinema").hidden = false;
    $("cinema-text").textContent = "Kai veste a proteção para cuidar do rio.";
  }
  function candidate(type = null) {
    return tasks
      .filter(
        (t) =>
          !finished(t) &&
          t.status !== "returning" &&
          t.status !== "carried" &&
          (!type || group(t, type)),
      )
      .sort((a, b) => distance(player, a) - distance(player, b))[0];
  }
  function dependencies(t) {
    return (
      !t.needs ||
      t.needs.every((id) => finished(tasks.find((v) => v.id === id)))
    );
  }
  function target() {
    return tasks
      .filter(
        (t) =>
          !finished(t) &&
          t.status !== "returning" &&
          t.status !== "carried" &&
          near(t, 90),
      )
      .sort((a, b) => distance(player, a) - distance(player, b))[0];
  }
  function schedulePath(target, approach = 0) {
    const ticket = ++routeTicket,
      start = { x: player.x, y: player.y };
    playerRoutePending = true;
    route = [];
    BosqueRotas.route(start, target, {
      approach,
      dynamic: tasks.filter((t) => t.type === "cage" && t.status === "pending"),
    })
      .then((path) => {
        if (ticket !== routeTicket) return;
        playerRoutePending = false;
        if (stage === "exploring" && distance(player, start) < 3) route = path;
      })
      .catch(() => {
        if (ticket === routeTicket) playerRoutePending = false;
      });
  }
  function guide(type = null) {
    if (locked() || action) return;
    let t =
      type === "home"
        ? { ...data.npcPosition, name: data.npc }
        : candidate(type);
    if (t && !dependencies(t))
      t = tasks.find((v) => t.needs?.includes(v.id) && !finished(v));
    if (id === 5 && bag.length && (!t || t.status === "carried"))
      t = { ...data.station, name: "Estação de reciclagem" };
    if (!t) {
      if (goalsDone() || tasks.some((t) => t.status === "returning"))
        t = { ...data.npcPosition, name: data.npc };
      else return;
    }
    schedulePath(t, 52);
    message("Vamos até " + t.name + "!");
  }
  function startAction(t, kind, duration) {
    if (action) return;
    neutral();
    route = [];
    player.moving = false;
    action = { task: t.id, kind, elapsed: 0, duration, problem: t.problem };
    player.direction =
      (Math.round(-Math.atan2(t.y - player.y, t.x - player.x) / (Math.PI / 4)) +
        8) %
      8;
    $("action-progress").hidden = false;
  }
  function animalHome(t) {
    if (t.home) return { ...t.home };
    if (id === 3 && t.speciesKey) return GuardiaoElenco.habitat(t.speciesKey);
    if (id === 2)
      return t.type === "turtle"
        ? { x: 745, y: 430 }
        : { x: 610 + (t.id === "peixes2" ? 90 : 0), y: 420 };
    const index = tasks.filter(animal).indexOf(t);
    return {
      x: data.npcPosition.x - 38 + index * 20,
      y: data.npcPosition.y + 55,
    };
  }
  function animalRoute(t) {
    const request = (t.routeRequest || 0) + 1;
    t.routeRequest = request;
    t.routePending = true;
    Promise.resolve()
      .then(() =>
        BosqueRotas.route({ ...t.position }, animalHome(t), {
          dynamic: tasks.filter(
            (v) => v.type === "cage" && v.status === "pending",
          ),
        }),
      )
      .then((path) => {
        if (t.routeRequest !== request || t.status !== "returning") return;
        t.route = path;
        t.routePending = false;
        t.nextRetry = time + 2;
      })
      .catch(() => {
        t.routePending = false;
      });
    return [];
  }
  function rescue(t) {
    t.status = "returning";
    t.position = { x: t.x, y: t.y };
    nav.setDynamic(
      tasks.filter((v) => v.type === "cage" && v.status === "pending"),
    );
    t.route = animalRoute(t);

    t.restoredAt = elapsed;
    message(t.name + " está melhor!", "Kai");
  }
  function finishAction() {
    const a = action,
      t = tasks.find((t) => t.id === a.task);
    if (a.kind === "clear") {
      t.status = "cleared";
      message("Local limpo! Agora abra a cova.", "Dica");
    } else if (a.kind === "dig") {
      t.status = "dug";
      message("Cova pronta. Escolha uma muda nativa.", "Dica");
    } else if (a.kind === "protect") {
      t.status = "done";
      t.progress = 1;
      t.restoredAt = elapsed;
      message("Muda protegida! Ela vai crescer com cuidado.", "Kai");
    } else if (a.kind === "key") {
      t.status = "done";
      window.GuardiaoMemoria.find("chave");
      message("Chave encontrada! Os abrigos podem ser abertos.", "Kai");
    } else if (a.kind === "seed") {
      t.status = "seeded";
      message("Muda plantada! Enter ou a mão para regar.", "Dica");
    } else if (a.kind === "water") {
      t.status = "done";
      t.progress = 1;
      t.restoredAt = elapsed;
      water = Math.max(0, water - 12);
      message("Uma nova " + t.seedSpecies + " para a floresta!", "Kai");
    } else if (animal(t)) rescue(t);
    else if (t.type === "recycle") {
      t.status = "carried";
      bag.push(t.id);
      message("Na bolsa! Leve à estação de reciclagem.", "Dica");
    } else {
      t.status = "done";
      t.restoredAt = elapsed;
      message(
        t.type === "trash"
          ? "Lixo fora do rio!"
          : t.type === "nest"
            ? "Um lar para os passarinhos!"
            : t.type === "solar"
              ? "Energia limpa!"
              : "Jardim cuidado!",
        "Kai",
      );
    }
    action = null;
    nav.setDynamic(
      tasks.filter((t) => t.type === "cage" && t.status === "pending"),
    );
    $("action-progress").hidden = true;
    dirty = true;
    save();
    updateHUD();
    window.GuardiaoAudio?.effect(
      animal(t)
        ? "resgate"
        : ["seed", "water", "garden", "nest"].includes(a.kind)
          ? "plantar"
          : "coletar",
    );
  }
  const picture = {
    banana:
      '<svg viewBox="0 0 50 50" aria-hidden="true"><path d="M9 10Q9 33 36 36L44 30Q37 49 20 43Q3 37 5 16Z" fill="#edc547" stroke="#8b652d" stroke-width="2"/><path d="M9 10L11 5" stroke="#5f7a34" stroke-width="5"/></svg>',
    fruta:
      '<svg viewBox="0 0 50 50" aria-hidden="true"><path d="M25 13Q5 5 6 28Q11 50 25 42Q41 50 45 27Q45 7 25 13" fill="#dc7046" stroke="#864027" stroke-width="2"/><path d="M25 14L27 5Q40 3 37 11Z" fill="#6c9e43"/></svg>',
  };
  function choices(type) {
    if (type === "cage")
      return [
        ["banana", "Banana", picture.banana],
        ["fruta", "Fruta", picture.fruta],
      ];
    if (type === "solar")
      return [
        ["sun", "Virar para o sol", window.GuardiaoIcones.markup("sun")],
        ["shade", "Virar para a sombra", window.GuardiaoIcones.markup("leaf")],
      ];
    return [
      ["recyclable", "Recicláveis", window.GuardiaoColecao.bin("recyclable")],
      ["organic", "Orgânicos", window.GuardiaoColecao.bin("organic")],
      ["residual", "Rejeitos", window.GuardiaoColecao.bin("residual")],
    ];
  }

  function objectMarkup(i) {
    return sprites.markup("objetos", i);
  }
  function showPuzzle(t) {
    puzzleTask = t;
    $("puzzle-title").textContent =
      t.type === "cage"
        ? "Qual comidinha abre o abrigo?"
        : t.type === "solar"
          ? "Para onde o painel vai olhar?"
          : "Cada material no seu lugar";
    $("puzzle-description").textContent =
      t.type === "cage"
        ? t.species === 1
          ? "O mico adora banana."
          : "O tucano gosta de frutas."
        : t.type === "solar"
          ? "O sol ajuda a produzir energia limpa."
          : t.name + ": escolha uma lixeira.";
    $("puzzle-feedback").textContent = "";
    const options = t.quiz
      ? t.quiz.options.map(([v, label, icon]) => [
          v,
          label,
          window.GuardiaoIcones.markup(icon),
        ])
      : t.type === "bed"
        ? ["ipê", "ingá", "aroeira"].map((name) => [
            name,
            name,
            window.GuardiaoColecao.plant(name),
          ])
        : choices(t.type);
    if (t.quiz) {
      $("puzzle-title").textContent = t.quiz.question;
      $("puzzle-description").textContent =
        "Vamos pensar antes de cuidar de " + t.name + ".";
    }
    if (t.type === "bed") {
      $("puzzle-title").textContent = "Qual muda vamos plantar?";
      $("puzzle-description").textContent =
        "Escolha a planta que você quiser. Todas são nativas. Depois plante e regue!";
    }
    $("puzzle-feedback").removeAttribute("data-correct");
    $("quiz-continue")?.remove();
    $("puzzle-options").replaceChildren(
      ...options.map(([value, label, art]) => {
        const b = document.createElement("button");
        b.type = "button";
        b.dataset.answer = value;
        b.innerHTML = art + "<span>" + label + "</span>";
        b.addEventListener("click", () => answer(value));
        return b;
      }),
    );
    open("puzzle");
    $("puzzle-options").querySelector("button")?.focus();
  }
  function answer(value) {
    const t = puzzleTask;
    if (!t) return;
    if (t.quizPassed && t.quiz) return;
    const correct = t.quiz
      ? value === t.quiz.answer
      : t.type === "bed"
        ? ["ipê", "ingá", "aroeira"].includes(value)
        : t.type === "cage"
          ? value === t.answer
          : t.type === "solar"
            ? value === "sun"
            : value === t.material;
    if (!correct) {
      $("puzzle-feedback").textContent =
        t.type === "bed"
          ? "Este local combina com " + t.native + ". Vamos tentar essa muda?"
          : t.type === "recycle"
            ? "Recicláveis: papel limpo, plástico e metal. Orgânicos: restos de alimento. Rejeitos: resíduos sem reaproveitamento, como papel sujo. Tente de novo!"
            : "Vamos tentar outra? Você consegue!";
      $("puzzle-feedback").dataset.correct = "false";
      tone(330);
      return;
    }
    if (t.quiz) {
      t.quizPassed = true;
      $("puzzle").close();
      puzzleTask = null;
      startAction(t, t.type === "cage" ? "unlock" : "care", 1.35);
      save();
      updateHUD();
      window.GuardiaoAudio?.effect("resgate");
      return;
    }
    if (t.type === "bed") t.seedSpecies = value;
    $("puzzle").close();
    puzzleTask = null;
    if (t.type === "bed") {
      startAction(t, "seed", 1.25);
      return;
    }
    if (t.type === "recycle") {
      t.status = "done";
      t.restoredAt = elapsed;
      bag = bag.filter((v) => v !== t.id);
      save();
      updateHUD();
      message("Reciclagem no lugar certo!", "Kai");
      tone(880);
      if (bag.length && near(data.station, 95))
        setTimeout(() => {
          if (!paused() && bag.length)
            showPuzzle(tasks.find((v) => v.id === bag[0]));
        }, 550);
    } else startAction(t, t.type, t.type === "solar" ? 1.8 : 1.5);
  }
  function interact() {
    if (locked() || action || !itemsGiven) return;
    if (goalsDone() && !completed && near(data.npcPosition, 100)) {
      startReward();
      return;
    }
    if (id === 4 && near(data.refill, 80)) {
      water = 100;
      save();
      updateHUD();
      message("Regador cheio!", "Kai");
      return;
    }
    if (
      id === 5 &&
      near(data.station, 95) &&
      bag.length &&
      (!target() ||
        distance(player, data.station) < distance(player, target()) - 8)
    ) {
      showPuzzle(tasks.find((t) => t.id === bag[0]));
      return;
    }
    const t = target();
    if (!t) {
      const friend = art
        .actors(time, reduced(), 0)
        .filter((a) => near(a, 48))
        .sort((a, b) => distance(player, a) - distance(player, b))[0];
      if (friend) {
        message(
          friend.tip || "Cada cuidado faz a diferença!",
          friend.name || "Vizinho",
        );
        return;
      }
      if (near(data.npcPosition, 80))
        message(
          goalsDone()
            ? "Você fez um lindo trabalho!"
            : tasks.some(finished)
              ? {
                  2: "A água está melhorando. Obrigado por cuidar de cada amigo!",
                  3: "Os amigos estão encontrando seus lares. Estamos conseguindo juntos!",
                  4: "Já vejo a vida brotando. Cada muda vai precisar de acompanhamento.",
                  5: "Os vizinhos estão ajudando. A cidade está mudando com todos nós!",
                }[id]
              : data.hint,
          data.npc,
        );
      return;
    }
    if (!dependencies(t)) {
      message("Vamos recolher o lixo perto deste amigo primeiro.");
      return;
    }
    if (animal(t)) {
      const beside = GuardiaoCuidados.approach(player, t, nav);
      if (beside && distance(player, beside) > 4) {
        pendingInteraction = t.id;
        schedulePath(beside);
        return;
      }
    }
    if (distance(player, t) > 52 || !nav.interactionVisible(player, t)) {
      pendingInteraction = t.id;
      schedulePath(t, 46);
      return;
    }
    if (
      (t.quiz && !t.quizPassed) ||
      t.type === "solar" ||
      (t.type === "cage" && !t.quiz)
    ) {
      showPuzzle(t);
      return;
    }
    if (t.type === "bed") {
      if (t.status === "pending") {
        t.seedSpecies = ["ipê", "ingá", "aroeira"][
          tasks.filter((v) => v.type === "bed").indexOf(t) % 3
        ];
        startAction(t, "seed", 1.05);
      } else if (t.status === "seeded") {
        if (water >= 12) startAction(t, "water", 1.4);
        else message("Encha o regador na fonte.");
      }
      return;
    }
    if (
      t.type === "nest" &&
      tasks.filter((t) => t.type === "bed" && finished(t)).length < 2
    ) {
      message("Plante duas árvores antes de preparar os ninhos.");
      return;
    }
    startAction(
      t,
      t.type,
      t.type === "kitten"
        ? 4.8
        : t.type === "turtle"
          ? 3
          : t.type === "bird"
            ? 2
            : t.type === "fish"
              ? 2.2
              : 1.2,
    );
  }
  function beginTool() {
    if (locked() || action) return;
    heldTool = true;
    $("ferramenta").classList.add("is-held");
    if (id !== 4) interact();
    else if (near(data.refill, 80)) {
      water = 100;
      updateHUD();
      save();
    } else if (
      !tasks.some(
        (t) => t.type === "bed" && t.status === "seeded" && near(t, 90),
      )
    )
      interact();
  }
  function updateObjective() {
    const pending = target() || candidate();
    ui.objective(
      completed
        ? "Região recuperada. Obrigado por cuidar!"
        : goalsDone()
          ? "Volte a " + data.npc + " para celebrar!"
          : !itemsGiven
            ? "Receba os equipamentos de " + data.npc
            : pending && id === 4 && pending.type === "bed"
              ? {
                  pending: "Plante uma muda",
                  seeded: "Regue a muda",
                  growing: "Proteja a muda",
                }[pending.status] +
                " · " +
                pending.name
              : pending
                ? pending.name
                : "Acompanhe os amigos até um lugar seguro.",
    );
  }
  function updateHUD() {
    document.querySelectorAll("[data-goal]").forEach((b) => {
      const type = b.dataset.goal,
        total = tasks.filter((t) => group(t, type)).length,
        done = tasks.filter((t) => group(t, type) && finished(t)).length;
      b.querySelector("strong").textContent = done + "/" + total;
      b.classList.toggle("done", done === total);
    });
    updateObjective();
    $("reserva").value = water;
    $("inventory-state").textContent =
      id === 5
        ? bag.length + " materiais aguardando reciclagem."
        : data.equipmentText;
    const home = document.querySelector(".return-goal");
    home.hidden = !goalsDone() || completed;
    if (goalsDone() && !completed && !announcedReturn) {
      announcedReturn = true;
      message("Conseguimos! Vamos buscar o fragmento com " + data.npc + ".");
      schedulePath(data.npcPosition, 48);
    }
  }
  function startReward() {
    if (completed || stage === "reward") return;
    neutral();
    route = [];
    stage = "reward";
    rewardTime = 0;
    colar.begin(finishReward);
    $("cinema").hidden = false;
    $("cinema-text").textContent =
      data.npc + " entrega o fragmento " + data.colorName;
    $("skip-reward").hidden = false;
  }
  function finishReward() {
    if (stage !== "reward") return;
    colar.complete();
    completed = true;
    stage = "completed";
    const saved = save(),
      progress = window.GuardiaoProgresso.finish(id);
    $("cinema").hidden = true;
    $("skip-reward").hidden = true;
    $("save-state").textContent =
      saved && progress.saved
        ? "Sua conquista está guardada neste navegador."
        : "Sua conquista vale nesta aba. O navegador não permitiu salvar.";
    showVictory();
    tone(1047);
  }
  function showVictory() {
    $("victory-stats").innerHTML = data.goals
      .map(
        ([type, label, total]) =>
          `<span><strong>${total}</strong>${label}</span>`,
      )
      .join("");
    $("reward-label").textContent =
      "Fragmento " + data.colorName + " conquistado!";
    $("reward-label").style.color = data.color;
    $("next-phase").href =
      "../../tela-inicial/nova-versao/aventura.html?restaurar=" +
      id +
      "&destino=" +
      (id < 5 ? id + 1 : "creditos");
    $("next-phase").textContent =
      id === 5 ? "Ver encerramento →" : "Próxima aventura →";
    ui.open("vitoria");
  }
  function canMove(p) {
    return (
      nav.walkable(p) &&
      (id !== 2 || protective || !nav.swimming(p)) &&
      !tasks.some(
        (t) =>
          t.type === "cage" && t.status === "pending" && distance(p, t) < 16,
      )
    );
  }
  function move(dx, dy) {
    const moved = window.GuardiaoMovimento.move(player, dx, dy, canMove);
    if (moved > 0.02) {
      if (
        Math.floor((player.distance + moved) / 28) >
        Math.floor(player.distance / 28)
      )
        window.GuardiaoAudio?.effect(player.swimming ? "nadar" : "passo", {
          gain: 0.22,
        });
      player.distance += moved;
      player.direction =
        (Math.round(-Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8;
      player.idle = 0;
      dirty = true;
    }
    return moved;
  }
  function update(dt) {
    elapsed += dt;
    ui.update(dt);
    if (stage === "dressing") {
      dressingTime += dt;
      if (dressingTime >= 5.6) {
        protective = true;
        stage = "exploring";
        $("cinema").hidden = true;
        document.body.dataset.requiredUniform = "protecao";
        window.GuardiaoMemoria.uniform("protecao", { required: true });
        save();
        message("Proteção pronta. Vamos cuidar do rio!", "Kai");
      }
      updateFlora(dt);
      return;
    }
    if (stage === "handoff") {
      handoff = Math.max(0, handoff - dt);
      if (!handoff) grant();
      updateFlora(dt);
      return;
    }
    if (stage === "reward") {
      rewardTime += dt;
      if (rewardTime > 6.5) finishReward();
      updateFlora(dt);
      return;
    }
    if (action) {
      action.elapsed += dt;
      $("action-progress").firstElementChild.style.scale =
        Math.min(1, action.elapsed / action.duration) + " 1";
      if (action.elapsed >= action.duration) finishAction();
      player.moving = false;
      player.idle = 0;
    } else {
      let dx =
          Number(keys.has("d") || keys.has("arrowright")) -
          Number(keys.has("a") || keys.has("arrowleft")) +
          stick.x,
        dy =
          Number(keys.has("s") || keys.has("arrowdown")) -
          Number(keys.has("w") || keys.has("arrowup")) +
          stick.y;
      if (dx || dy) {
        routeTicket++;
        playerRoutePending = false;
        route = [];
        pendingInteraction = null;
      } else if (route.length) {
        while (route.length && distance(player, route[0]) < 0.1) route.shift();
        if (route.length) {
          const d = distance(player, route[0]);
          dx = (route[0].x - player.x) / d;
          dy = (route[0].y - player.y) / d;
        }
      }
      const len = Math.hypot(dx, dy);
      if (len > 1) {
        dx /= len;
        dy /= len;
      }
      player.swimming = id === 2 && nav.swimming(player);
      const step = Math.min(
        data.speed *
          (window.BrisaRitmo?.speed || 1) *
          (player.swimming ? 0.8 : 1) *
          dt,
        route.length ? distance(player, route[0]) : Infinity,
      );
      const travelled = move(dx * step, dy * step);
      player.moving = travelled > 0.02;
      if (!player.moving) player.idle += dt;
      if (route.length && !travelled && len && time >= nextReplan) {
        nextReplan = time + 0.5;
        if (!playerRoutePending) schedulePath(route.at(-1));
      }
      if (id === 4 && heldTool) {
        const t = tasks
          .filter(
            (t) => t.type === "bed" && t.status === "seeded" && near(t, 90),
          )
          .sort((a, b) => distance(player, a) - distance(player, b))[0];
        if (t && water >= 12) startAction(t, "water", 1.8);
        else if (t && water < 12) {
          message("Vamos encher o regador na fonte!");
          heldTool = false;
        }
      }
    }
    for (const t of tasks) {
      if (t.status !== "returning" || t.routePending) continue;
      while (t.route.length && distance(t.position, t.route[0]) < 0.1)
        t.route.shift();
      if (!t.route.length) {
        if (distance(t.position, animalHome(t)) > 24) {
          if (time >= (t.nextRetry || 0)) {
            t.route = animalRoute(t);
            t.nextRetry = time + 2;
          }
          continue;
        }
        t.status = "safe";
        t.position = animalHome(t);
        t.restoredAt = elapsed;
        dirty = true;
        save();
        updateHUD();
        continue;
      }
      const next = t.route[0],
        d = distance(t.position, next),
        step = Math.min(d, 80 * dt);
      t.facingRight = next.x > t.position.x;
      t.position.x += ((next.x - t.position.x) / d) * step;
      t.position.y += ((next.y - t.position.y) / d) * step;
    }
    if (pendingInteraction && !route.length && !playerRoutePending && !action) {
      const t = tasks.find((t) => t.id === pendingInteraction);
      pendingInteraction = null;
      if (t && near(t, 80)) interact();
    }
    updateFlora(dt);
    if (
      goalsDone() &&
      !completed &&
      near(data.npcPosition, 85) &&
      !route.length
    )
      startReward();
  }
  function updateFlora(dt) {
    FloraCompanheira.update(flora, player, dt, {
      phase: id,
      busy: action || stage === "handoff" || stage === "dressing",
      reward: stage === "reward" || $("vitoria").open,
      jump: ui.height(),
    });
  }
  function transform() {
    const s = camera.scale,
      visibleW = view.w / s,
      visibleH = view.h / s;
    camera.x = Math.min(1280 - visibleW / 2, Math.max(visibleW / 2, player.x));
    camera.y = Math.min(720 - visibleH / 2, Math.max(visibleH / 2, player.y));
    if (visibleW >= 1280) camera.x = 640;
    if (visibleH >= 720) camera.y = 360;
    return { s, ox: view.w / 2 - camera.x * s, oy: view.h / 2 - camera.y * s };
  }
  function resize() {
    view = { w: innerWidth, h: innerHeight };
    const pixel = TrilhasRender.pixelRatio();
    canvas.width = Math.round(view.w * pixel);
    canvas.height = Math.round(view.h * pixel);
    ctx.setTransform(pixel, 0, 0, pixel, 0, 0);
    camera.scale = MataCamera.scale(
      view.w,
      view.h,
      window.GuardiaoControles.effective() === "touch",
    );
    draw();
  }
  function ellipse(x, y, rx, ry, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  function icon(name, x, y, size) {
    window.GuardiaoIcones.paint(ctx, iconImage, name, x, y, size);
  }
  const labelQueue = [];
  function label(text, x, y) {
    labelQueue.push([text, x, y]);
  }
  function paintLabel(text, x, y) {
    if (window.VivaMundo)
      return VivaMundo.label(ctx, text, x, y, transform(), view.w, view.h);
    ctx.font = "bold 10px system-ui";
    ctx.textAlign = "center";
    const w = ctx.measureText(text).width + 14;
    ({ x, y } = GuardiaoEtiquetas.position(
      x,
      y,
      w,
      transform(),
      view.w,
      view.h,
    ));
    ctx.fillStyle = "#fff5dceF";
    ctx.strokeStyle = "#94ad6f";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - 17, w, 23, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#355134";
    ctx.fillText(text, x, y - 2);
  }
  function drawGround() {
    world.ground(ctx, tasks, elapsed, reduced(), completed);
    if (route.length) {
      ctx.strokeStyle = "#fff1bf99";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 8]);
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      route.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (data.station && !art.binActors) art.bins(ctx, data.station);

    if (id === 4) {
      ellipse(data.refill.x, data.refill.y, 22, 7, "#8ce9f144");
      icon("water", data.refill.x, data.refill.y - 17, 20);
    }
  }
  function drawTask(t) {
    try {
      const p = t.position,
        isAnimal = animal(t),
        isCurrent = action?.task === t.id;
      if (["trash", "recycle"].includes(t.type)) {
        if (
          t.status === "pending" &&
          !(
            isCurrent &&
            action.elapsed / action.duration > (id === 2 ? 0.18 : 0.45)
          )
        )
          if (!art.residual(ctx, t))
            sprites.draw(
              ctx,
              "objetos",
              t.type === "trash"
                ? Number(t.id.replace("lixo", "")) % 4
                : {
                    recyclable: Number(t.id.replace("reciclavel", "")) % 3,
                    organic: 3,
                    residual: 1,
                  }[t.material],
              t.x,
              t.y,
              24,
              { angle: id === 2 ? Math.sin(time * 2 + t.x) * 0.1 : 0 },
            );
        return;
      }
      if (t.type === "key") {
        if (!finished(t)) icon("key", t.x, t.y - 9, 26);
        return;
      }
      if (isAnimal) {
        if (isCurrent && ["kitten"].includes(action.kind)) return;
        if (
          id === 2 &&
          art.riverAnimal(
            ctx,
            t,
            time,
            reduced(),
            p.x,
            p.y,
            t.type === "turtle" ? 43 : 30,
            isCurrent ? action.elapsed / action.duration : 0,
          )
        )
          return;
        if (t.speciesKey) {
          art.animal(
            ctx,
            t,
            time,
            reduced(),
            p.x,
            p.y,
            ["capivara", "onca", "anta", "tamandua"].includes(t.speciesKey)
              ? 46
              : 36,
          );
          if (t.type === "cage")
            sprites.draw(
              ctx,
              "objetos",
              t.status === "pending" &&
                !(isCurrent && action.elapsed / action.duration > 0.3)
                ? 4
                : 5,
              t.x,
              t.y,
              60,
              { alpha: t.status === "pending" ? 0.72 : 1 },
            );
          return;
        }
        let sheet,
          index,
          height = 36;
        if (id === 2) {
          sheet = "animais-rio";
          const base = t.type === "turtle" ? 0 : 8;
          if (t.status === "pending")
            index = base + (!reduced() && time % 4 > 3.7 ? 1 : 0);
          else if (t.status === "returning" || t.status === "safe")
            index = base + 4 + (Math.floor(time * 7) % 4);
          else index = base + 3;
          height = t.type === "turtle" ? 38 : 26;
        } else {
          sheet =
            t.status === "returning"
              ? "animais-fauna-andando"
              : "animais-fauna";
          const base = t.species * 4;
          index =
            base +
            (t.status === "pending"
              ? !reduced() && time % 4 > 3.7
                ? 1
                : 0
              : t.status === "returning"
                ? 3
                : 2);
          if (t.status === "returning")
            index = base + (reduced() ? 0 : Math.floor(time * 8) % 4);
          height = t.type === "kitten" ? 32 : t.species === 2 ? 37 : 34;
          if (t.type === "cage" && t.status !== "pending")
            sprites.draw(ctx, "objetos", 5, t.x, t.y, 60);
        }
        ellipse(p.x, p.y, 13, 4, "#1c452b44");
        sprites.draw(
          ctx,
          sheet,
          index,
          p.x,
          p.y - (t.type === "kitten" && t.status === "pending" ? 75 : 0),
          height,
          { flip: t.facingRight },
        );
        if (t.type === "cage" && t.status === "pending")
          sprites.draw(ctx, "objetos", 4, t.x, t.y, 60, { alpha: 0.88 });
        return;
      }
      if (t.type === "transport") {
        if (finished(t))
          icon(t.id === "onibus" ? "bus" : "bike", t.x, t.y - 15, 30);
        return;
      }
      if (t.type === "community") {
        icon(finished(t) ? "heart" : "hand", t.x, t.y - 12, 25);
        return;
      }
      if (t.type === "bed") {
        world.plant(ctx, t, elapsed, reduced());
      } else if (t.type === "nest")
        sprites.draw(ctx, "objetos", finished(t) ? 14 : 13, t.x, t.y, 43);
      else if (t.type === "solar") {
        sprites.draw(ctx, "objetos", finished(t) ? 11 : 10, t.x, t.y, 48);
        if (finished(t)) art.energy(ctx, t.x, t.y, time, reduced());
      } else if (t.type === "garden" && finished(t))
        shared.draw(
          ctx,
          "natureza",
          6,
          t.x,
          t.y,
          22 +
            32 *
              (reduced()
                ? 1
                : Math.min(1, (elapsed - (t.restoredAt ?? -3)) / 2)),
        );
    } finally {
      if (animal(t))
        GuardiaoCuidados.draw(
          ctx,
          t,
          time,
          reduced(),
          action?.task === t.id ? action.elapsed / action.duration : 0,
          player,
        );
    }
  }
  function drawPlayer() {
    const flip = player.direction >= 3 && player.direction <= 5;
    ellipse(player.x, player.y, 13, 4, "#173e2a55");
    let name = "kai-repouso",
      frame = 0,
      y = player.y - ui.height(),
      height = 63;
    if (stage === "reward" || $("vitoria").open) {
      name = "recompensa-" + data.reward;
      frame =
        stage === "reward"
          ? Math.min(7, Math.floor((rewardTime / 6.5) * 8))
          : 6;
      colar.drawActor(ctx, rewardTime, player.x, y, 66, $("vitoria").open);
    } else if (stage === "handoff") {
      const row = id === 2 ? 2 : id === 3 ? 1 : 3;
      BosqueKai.equipment(
        ctx,
        row,
        1 - Math.max(0, handoff) / 1.7,
        player.x,
        y,
        83,
        flip,
      );
      name = "equipamentos";
    } else if (stage === "dressing") {
      const pose = art.river(ctx, player, time, reduced(), {
        dressing: true,
        progress: Math.min(0.999, dressingTime / 5.6),
      });
      name = pose.split(":")[0];
      frame = Number(pose.split(":")[1]);
    } else if (id === 2 && protective) {
      const pose = art.river(ctx, player, time, reduced(), {
        // A pose de coleta alcança a embalagem. As poses antigas de carregar um
        // peixe/tartaruga fariam o animal aparecer duplicado fora da água.
        kind: action
          ? animal(tasks.find((t) => t.id === action.task))
            ? "desprender"
            : action.kind
          : null,
        problem: action?.problem,
        progress: action
          ? Math.min(0.999, action.elapsed / action.duration)
          : 0,
      });
      name = pose.split(":")[0];
      frame = Number(pose.split(":")[1]);
      if (action?.kind === "trash")
        art.riverTrash?.(
          ctx,
          sprites,
          tasks.find((t) => t.id === action.task),
          player,
          action.elapsed / action.duration,
        );
    } else if (action && id >= 3) {
      const target = tasks.find((t) => t.id === action.task),
        progress = Math.min(0.999, action.elapsed / action.duration);
      if (id === 5 && ["solar", "garden"].includes(action.kind)) {
        BosqueKai.walk(
          ctx,
          { ...player, y: y + Math.sin(progress * Math.PI) * 2, moving: false },
          time,
          reduced(),
          height,
          false,
          "voluntario",
        );
        icon(
          action.kind === "solar" ? "sun" : "watering",
          player.x + (target.x < player.x ? -1 : 1) * 23,
          y - 28,
          21,
        );
      } else
        BosqueKai.task(
          ctx,
          id === 3 ? 0 : id === 4 ? (action.kind === "water" ? 2 : 1) : 3,
          progress,
          { ...player, y },
          target,
        );
      document.body.dataset.kaiSprite =
        "tarefa-" + action.kind + ":" + Math.floor(progress * 6);
      return;
    } else if (action && ["care", "feed"].includes(action.kind)) {
      name = "kai-cuidados";
      frame =
        6 + Math.min(5, Math.floor((action.elapsed / action.duration) * 6));
      BosqueKai.equipment(
        ctx,
        1,
        action.elapsed / action.duration,
        player.x,
        y,
        83,
        flip,
      );
      if (action.kind === "feed") {
        const task = tasks.find((t) => t.id === action.task),
          p = Math.min(1, action.elapsed / action.duration),
          x = player.x + (task.x - player.x) * p,
          yy = player.y - 27 + (task.y - player.y + 16) * p;
        ctx.fillStyle = task.speciesKey === "mico" ? "#f4ce65" : "#dc8566";
        ctx.beginPath();
        ctx.ellipse(x, yy, 8, 4, -0.7, 0, Math.PI * 2);
        ctx.fill();
      } else icon("paw", player.x + 18, player.y - 20, 17);
    } else if (action) {
      const p = Math.min(0.999, action.elapsed / action.duration);
      if (["trash", "recycle"].includes(action.kind)) {
        name = "kai-rio";
        frame = Math.floor(p * 4);
      } else if (action.kind === "turtle") {
        name = "kai-rio";
        frame = 4 + Math.floor(p * 4);
      } else if (action.kind === "fish") {
        name = "kai-rio";
        frame = 8 + Math.floor(p * 4);
      } else if (action.kind === "kitten") {
        name = "kai-floresta";
        frame = Math.floor(p * 8);
        y -= Math.sin(p * Math.PI) * 85;
      } else if (action.kind === "bird") {
        name = "kai-floresta";
        frame = 8 + Math.floor(p * 4);
      } else if (["clear", "dig", "protect"].includes(action.kind)) {
        name = "kai-plantio";
        frame = Math.floor(p * 4);
        icon(
          action.kind === "clear"
            ? "trash"
            : action.kind === "dig"
              ? "shovel"
              : "leaf",
          player.x + 17,
          player.y - 25,
          19,
        );
      } else if (action.kind === "seed") {
        name = "kai-plantio";
        frame = Math.floor(p * 4);
      } else if (action.kind === "water") {
        name = "kai-plantio";
        frame = 4 + Math.floor(p * 4);
      } else if (action.kind === "solar") {
        art.solar(ctx, player, p);
        document.body.dataset.kaiSprite = "kai-solar:" + Math.floor(p * 4);
        return;
      } else {
        name = "kai-floresta";
        frame = 8 + Math.floor(p * 4);
      }
      sprites.draw(ctx, name, frame, player.x, y, height, { flip });
    } else if (art.outfit(ctx, { ...player, y }, time, reduced(), height)) {
      name = "uniforme-" + window.GuardiaoMemoria.read().uniform;
      frame =
        player.direction * 2 +
        (player.moving && !reduced()
          ? Math.floor(player.distance / 15) % 2
          : 0);
    } else if (player.swimming) {
      name = "kai-nadando";
      frame =
        player.direction * 2 +
        (!reduced() ? Math.floor(time * (player.moving ? 7 : 3)) % 2 : 0);
      sprites.draw(ctx, name, frame, player.x, y, 43);
    } else if (player.moving) {
      name = "kai-livre";
      frame = player.direction * 2 + (Math.floor(player.distance / 18) % 2);
      life.walk(ctx, player, time, reduced(), false, height);
    } else {
      const d = player.direction,
        base = d === 2 ? 2 : d >= 3 && d <= 5 ? 4 : d === 6 ? 6 : 0;
      frame = base + (!reduced() && time % 4.6 > 4.4 ? 1 : 0);
      shared.draw(
        ctx,
        name,
        frame,
        player.x,
        y,
        height + (reduced() ? 0 : Math.sin(time * 1.8) * 0.35),
      );
    }
    if (!action && !player.swimming && stage !== "reward" && !$("vitoria").open)
      colar.chest(ctx, { ...player, y });
    document.body.dataset.kaiSprite = name + ":" + frame;
    document.body.dataset.swimming = String(player.swimming);
  }
  function drawNPC() {
    ellipse(data.npcPosition.x, data.npcPosition.y, 14, 4, "#173d2855");
    const frame =
      data.npcRow * 3 +
      (stage === "handoff" ||
      completed ||
      goalsDone() ||
      (action && tasks.filter(finished).length > tasks.length * 0.45)
        ? 2
        : $("intro").open || tasks.some(finished)
          ? 1
          : 0);
    sprites.draw(
      ctx,
      "npcs",
      frame,
      data.npcPosition.x,
      data.npcPosition.y,
      65,
    );
    if (near(data.npcPosition, 105) && !paused())
      label(
        goalsDone() && !completed ? "Receber fragmento" : data.npc,
        data.npcPosition.x,
        data.npcPosition.y - 73,
      );
  }
  function drawFlora() {
    life.flora(ctx, flora, player, time, reduced());
    document.body.dataset.floraState = flora.mode;
  }
  function drawCelebration() {
    const c = $("celebration").getContext("2d");
    if (window.RioClaroResumo) {
      RioClaroResumo.paint(c, 420, 230, time, reduced());
      return;
    }
    c.clearRect(0, 0, 420, 175);
    sprites.draw(c, "npcs", data.npcRow * 3 + 1, 105, 150, 108);
    colar.drawActor(c, 6.5, 210, 153, 125, true);
    life.draw(
      c,
      "flora",
      14 + (!reduced() ? Math.floor(time * 4) % 2 : 0),
      295,
      90,
      61,
    );
    const allFriends = tasks.filter(animal);
    const first = id === 3 ? (Math.floor(time / 4) % 3) * 3 : 0;
    allFriends.slice(first, first + 3).forEach((t, i) => {
      if (id === 2)
        art.riverAnimal(
          c,
          { ...t, status: "safe" },
          time,
          reduced(),
          75 + i * 115,
          170,
          30,
        );
      else
        art.animal(
          c,
          { ...t, status: "safe" },
          time,
          reduced(),
          75 + i * 115,
          170,
          30,
        );
    });
  }
  function draw() {
    window.GuardiaoAudio?.water(!paused() && action?.kind === "water");
    if (!ready) return;
    labelQueue.length = 0;
    if (time - (draw.lastObjective ?? -99) > 0.15) {
      updateObjective();
      draw.lastObjective = time;
    }
    const { s, ox, oy } = transform();
    ctx.clearRect(0, 0, view.w, view.h);
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(s, s);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "medium";
    drawGround();
    life.ground(ctx, player, time, reduced(), player.swimming);
    life.recovery(ctx, tasks, elapsed, reduced());
    const actors = tasks.map((t) => ({
      y: t.position.y,
      draw: () => drawTask(t),
    }));
    if (data.station) actors.push(...(art.binActors?.(ctx) || []));
    actors.push(
      ...world
        .actors(time, reduced(), player)
        .map((a) => ({ y: a.y, draw: () => a.draw(ctx) })),
    );
    const ratio = tasks.filter(finished).length / tasks.length;
    document.body.dataset.npcMood =
      ratio >= 1 ? "felizes" : ratio > 0 ? "esperancosos" : "preocupados";
    actors.push(
      ...art
        .actors(time, reduced(), ratio)
        .map((a) => ({ y: a.y, draw: () => art.drawResident(ctx, a, player) })),
    );
    actors.push(
      { y: data.npcPosition.y, draw: drawNPC },
      { y: player.y, draw: drawPlayer },
    );
    actors.sort((a, b) => a.y - b.y).forEach((a) => a.draw());

    drawFlora();
    for (const t of tasks) {
      if (finished(t) || t.status === "returning" || t.status === "carried")
        continue;
      const y =
          t.y -
          (t.type === "kitten"
            ? 118
            : animal(t)
              ? 53
              : t.type === "solar"
                ? 60
                : 37),
        size = animal(t) ? 24 : 18;
      ellipse(t.x, y, animal(t) ? 15 : 11, animal(t) ? 15 : 11, "#fff2c6eb");
      icon(t.icon, t.x, y, size);
      if (
        t === target() &&
        near(t, 95) &&
        !near(t, 70) &&
        !paused() &&
        !action &&
        stage === "exploring"
      )
        label(t.problemLabel || t.name, t.x, y - 20);
    }
    if (stage === "handoff") {
      const p = 1 - handoff / 1.5;
      data.equipment.forEach((name, i) =>
        icon(
          name,
          data.npcPosition.x + (player.x - data.npcPosition.x) * p + i * 15,
          data.npcPosition.y - 38 - Math.sin(p * Math.PI) * 25,
          25,
        ),
      );
    }
    if (stage === "reward" || $("vitoria").open) {
      for (let i = 0; i < 13; i++) {
        const a = time * 1.1 + i * 2.4,
          r = 30 + ((time * 24 + i * 19) % 90);
        ellipse(
          player.x + Math.cos(a) * r,
          player.y - 42 + Math.sin(a) * r * 0.6,
          2,
          2,
          data.color + "bb",
        );
      }
    }
    if (stage === "reward") colar.render(rewardTime, reduced());
    for (const args of labelQueue) paintLabel(...args);
    if (new URLSearchParams(location.search).has("colisoes")) {
      ctx.strokeStyle = "#ff5ca6";
      data.obstacles.forEach((o) => {
        ctx.beginPath();
        ctx.ellipse(o.x, o.y, o.rx, o.ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.beginPath();
      data.floor.forEach(([x, y], i) =>
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y),
      );
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
    document.body.classList.toggle(
      "near-hud",
      view.w < 700 && player.y * s + oy < 170,
    );
    if ($("vitoria").open) drawCelebration();
  }
  let nextReplan = 0;
  let lastPaint = 0;
  function frame(timestamp) {
    raf = 0;
    if (!ready || document.hidden || window.GuardiaoOrientacao?.blocked) return;
    const dt = last ? Math.min(0.04, (timestamp - last) / 1000) : 0.016;
    last = timestamp;
    time += dt;
    if (!paused()) update(dt);
    if (!$("message").hidden && time > messageUntil) $("message").hidden = true;
    if (timestamp - lastPaint >= (paused() ? 100 : 0)) {
      draw();
      lastPaint = timestamp;
    }
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (ready && !raf && !document.hidden) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }
  function tone(freq) {
    window.GuardiaoAudio?.effect(
      freq >= 1000
        ? "vitoria"
        : freq === 330
          ? "tentar"
          : freq >= 850
            ? "restaurar"
            : freq >= 750
              ? "coletar"
              : "toque",
    );
  }
  function syncControls(e) {
    neutral();
    preferences = e?.detail.preferences || preferences;
    document.documentElement.classList.toggle(
      "large-text",
      preferences.largeText === true,
    );
    document.body.classList.toggle("reduce-motion", reduced());
    const factor =
      1 + Math.max(0, Math.min(100, preferences.controlSize || 0)) / 1000;
    document.querySelectorAll(".joystick,.actions").forEach((el) => {
      el.style.scale = factor;
      el.style.transformOrigin = el.classList.contains("actions")
        ? preferences.leftHanded
          ? "bottom left"
          : "bottom right"
        : preferences.leftHanded
          ? "bottom right"
          : "bottom left";
    });
  }
  const pad = $("joystick");
  function stickMove(e) {
    const b = pad.getBoundingClientRect(),
      r = b.width * 0.3;
    let x = (e.clientX - b.x - b.width / 2) / r,
      y = (e.clientY - b.y - b.height / 2) / r,
      d = Math.hypot(x, y);
    if (d < 0.13) x = y = 0;
    else if (d > 1) {
      x /= d;
      y /= d;
    }
    stick.x = x;
    stick.y = y;
    $("stick").style.transform = `translate(${x * r}px,${y * r}px)`;
  }
  pad.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || stick.id !== null || locked() || action) return;
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
        stick.x = stick.y = 0;
        stick.id = null;
        $("stick").style.transform = "";
        save();
      }
    });
  $("ferramenta").addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || locked()) return;
    e.preventDefault();
    toolPointer = e.pointerId;
    $("ferramenta").setPointerCapture(e.pointerId);
    beginTool();
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
    $("ferramenta").addEventListener(type, (e) => {
      if (e.pointerId === toolPointer) {
        heldTool = false;
        toolPointer = null;
        $("ferramenta").classList.remove("is-held");
        save();
      }
    });
  $("ferramenta").addEventListener("click", (e) => {
    if (e.detail === 0) {
      beginTool();
      heldTool = false;
    }
  });
  $("interagir").addEventListener("click", interact);
  $("ajuda").addEventListener("click", () => guide());
  $("intro-next").addEventListener("click", advanceIntro);
  window.addEventListener("guardiao:preferencias", (e) => {
    preferences = { ...preferences, ...e.detail };
    neutral();
    resize();
  });
  document.addEventListener("guardiao:neutralizar", neutral);
  document.addEventListener("guardiao:acao-principal", interact);
  document.addEventListener("guardiao:soltar-acao", () => {
    heldTool = false;
  });
  document.addEventListener("guardiao:equipar", (e) => {
    if (e.detail.id === "protecao" && id === 2 && !protective) startDressing();
    else
      message(
        "Equipamento pronto. Aproxime-se do objetivo e use a mão.",
        "Kai",
      );
  });
  $("intro").addEventListener("cancel", (e) => e.preventDefault());
  $("mochila").addEventListener("click", () => {
    if (!locked()) open("inventario");
  });
  $("pausa").addEventListener("click", () => {
    if (!locked() || $("menu-pausa").open) {
      $("pause-summary").textContent =
        tasks.filter(finished).length +
        " de " +
        tasks.length +
        " cuidados concluídos";
      open("menu-pausa");
    }
  });
  $("toggle-missions").addEventListener("click", () => {
    const el = document.querySelector(".missions"),
      expanded = el.classList.toggle("expanded");
    $("toggle-missions").setAttribute("aria-expanded", String(expanded));
  });
  document.querySelectorAll("[data-close]").forEach((b) =>
    b.addEventListener("click", () => {
      $(b.dataset.close).close();
      if (b.dataset.close === "vitoria") stage = "exploring";
    }),
  );
  $("skip-reward").addEventListener("click", finishReward);
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
      message("Experimente virar seu celular para o lado.", "Dica");
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      neutral();
      if (!paused()) {
        e.preventDefault();
        open("menu-pausa");
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
      if (k === " " && !e.repeat) beginTool();
    }
    if (k === "e" && !e.repeat) interact();
    if (k === "b" && !e.repeat) open("inventario");
  });
  document.addEventListener("keyup", (e) => {
    keys.delete(e.key.toLowerCase());
    if (e.key === " ") {
      heldTool = false;
      $("ferramenta").classList.remove("is-held");
    }
    if (dirty) save();
  });
  window.addEventListener("guardiao:controles", syncControls);
  window.addEventListener("guardiao:orientacao", () => {
    neutral();
    last = 0;
    if (dirty) save();
    resize();
    if (!window.GuardiaoOrientacao?.blocked) start();
  });
  window.addEventListener("resize", resize);
  window.addEventListener("blur", () => {
    neutral();
    if (dirty) save();
  });
  document.addEventListener("visibilitychange", () => {
    neutral();
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
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
  $("phase-name").textContent = data.name;
  document.title = data.name + " · Guardião da Natureza";
  $("settings-link").href += "&fase=" + id;
  document.body.dataset.phase = id;
  syncControls();
  $("goals").innerHTML =
    data.goals
      .map(
        ([type, label, total, iconName]) =>
          `<button class="goal" data-goal="${type}"><span data-icon="${iconName}"></span><span class="goal-label">${label}</span><strong>0/${total}</strong></button>`,
      )
      .join("") +
    `<button class="goal return-goal" data-goal="home" hidden><span data-icon="leaf"></span><span>Voltar a ${data.npc}</span><strong>→</strong></button>`;
  document.querySelectorAll("[data-goal]").forEach((b) =>
    b.addEventListener("click", () => {
      guide(b.dataset.goal);
      document.querySelector(".missions").classList.remove("expanded");
      $("toggle-missions").setAttribute("aria-expanded", "false");
    }),
  );
  $("water-display").hidden = id !== 4;
  $("tool-icon").dataset.icon =
    id === 4 ? "watering" : id === 5 ? "recycle" : id === 3 ? "net" : "net";
  $("tool-name").textContent =
    id === 4 ? "REGAR" : id === 5 ? "RECICLAR" : "USAR";
  $("equipment-list").innerHTML = data.equipment
    .map((n) => window.GuardiaoIcones.markup(n))
    .join("");
  window.GuardiaoIcones.prepare();
  window.GuardiaoJornada = Object.freeze({
    estado: () =>
      structuredClone({
        ready,
        scene: world.state(),
        id,
        stage,
        completed,
        itemsGiven,
        player,
        flora,
        tasks,
        water,
        bag,
        action,
        jump: ui.height(),
        protective,
        dressingTime,
        pendingInteraction,
        route,
        routePending: playerRoutePending,
        camera,
        paused: paused(),
        rewardTime,
        necklace: colar.state(),
        elapsed,
      }),
    caminho: (from, to) => nav.route(from, to),
    podeAndar: (p) => nav.walkable(p),
  });
  readSave();
  if (itemsGiven) window.GuardiaoMemoria.grant(id);
  nav.setDynamic(
    tasks.filter((t) => t.type === "cage" && t.status === "pending"),
  );
  let loaded = 0;
  function progress() {
    loaded++;
    $("loading").textContent =
      "Preparando " + data.name.toLowerCase() + "… " + loaded;
  }
  const specific = id === 2 ? ["animais-rio"] : [];
  Promise.all([
    sprites.load(["npcs", "objetos", ...specific], progress),
    shared.load(progress, ["natureza"]),
    Promise.resolve(null),
    Promise.resolve(null),
    window.GuardiaoIcones.load(),
    life.load(),
    colar.load(),
    art.load(),
    BosqueKai.load(),
    world.ready,
  ])
    .then((r) => {
      iconImage = r[4];
      if (itemsGiven)
        window.GuardiaoMemoria.uniform(
          window.GuardiaoMemoria.phaseUniform(id),
          { required: true },
        );
      ready = true;
      $("loading").hidden = true;
      document.body.dataset.gameReady = "true";
      resize();
      updateHUD();
      if (!itemsGiven) showIntro();
      else if (completed) showVictory();
      else if (id === 2 && !protective) startDressing();
      else message(data.hint);
      if (id === 2 && protective) {
        document.body.dataset.requiredUniform = "protecao";
        window.GuardiaoMemoria.grant(2);
        window.GuardiaoMemoria.uniform("protecao", { required: true });
      }
      start();
    })
    .catch((error) => {
      console.error(error);
      $("loading").innerHTML =
        'Não foi possível carregar a aventura.<br><a href="' +
        location.pathname +
        "?fase=" +
        id +
        '">Tentar novamente</a>';
    });
})();


;/* tela-inicial/renascimento/interacoes.js */
"use strict";
(() => {
  const reduced = () =>
    matchMedia("(prefers-reduced-motion:reduce)").matches ||
    document.body.classList.contains("reduce-motion");
  document.addEventListener("pointerdown", (event) => {
    const b = event.target.closest("button,a");
    if (!b || b.disabled || reduced()) return;
    if (!b.matches(".nature-button,.forest-button,.nature-wood,.round")) return;
    for (let i = 0; i < 3; i++) {
      const leaf = document.createElement("span");
      leaf.className = "wood-spark";
      leaf.setAttribute("aria-hidden", "true");
      leaf.textContent = "❧";
      leaf.style.setProperty("--fly-x", (i - 1) * 32 + "px");
      b.append(leaf);
      setTimeout(() => leaf.remove(), 700);
    }
  });
  window.addEventListener("pagehide", () =>
    document.querySelectorAll(".wood-spark").forEach((n) => n.remove()),
  );
})();


;/* jogo/revisao-paisagem/orientacao.js */
"use strict";
(() => {
  const touch = matchMedia("(any-pointer:coarse)");
  const phone = () => touch.matches || navigator.maxTouchPoints > 0;
  let blocked = false,
    prompt,
    previousFocus;
  function bringForward() {
    if (!blocked || !prompt) return;
    if (prompt.open) prompt.close();
    prompt.showModal();
  }
  function apply() {
    const next = innerHeight > innerWidth;
    document.getElementById("girar-titulo").textContent = phone()
      ? "Gire o celular"
      : "Amplie a janela";
    document.getElementById("girar-dica").textContent = phone()
      ? "Para jogar, deixe a tela deitada. Sua aventura espera por você."
      : "Deixe a janela mais larga que alta para continuar sua aventura.";
    const changed = next !== blocked;
    blocked = next;
    document.body.dataset.orientationBlocked = String(blocked);
    if (blocked) {
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
    prompt.innerHTML =
      '<div class="rotate-card"><svg viewBox="0 0 180 140" aria-hidden="true"><path d="M24 93A59 59 0 01122 28M118 12L132 32L108 35" fill="none" stroke="#a5c47b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><g transform="rotate(-90 90 75)"><rect x="62" y="26" width="56" height="98" rx="12" fill="#31573b" stroke="#d6b779" stroke-width="5"/><rect x="69" y="39" width="42" height="68" rx="3" fill="#a2bd75"/><circle cx="90" cy="116" r="3" fill="#f4e4b0"/><path d="M88 92V61Q69 61 75 49Q94 48 88 69Q104 45 108 60Q112 75 88 76" fill="#507c46"/></g></svg><p class="rotate-kicker">A AVENTURA FICA MELHOR ASSIM</p><h1 id="girar-titulo">Gire o celular</h1><p id="girar-dica">Para jogar, deixe a tela deitada.<br>Sua aventura espera por você.</p><button type="button" id="girar-tela-cheia">Jogar deitado</button><p id="girar-status" role="status">Vire o aparelho para continuar.</p></div>';
    document.body.append(prompt);
    prompt.addEventListener("cancel", (e) => {
      if (blocked) e.preventDefault();
    });
    prompt.querySelector("button").addEventListener("click", async () => {
      try {
        if (!document.fullscreenElement)
          await document.documentElement.requestFullscreen?.();
      } catch {}
      try {
        await screen.orientation?.lock?.("landscape");
      } catch {}
      apply();
      if (blocked)
        document.getElementById("girar-status").textContent =
          "Vire o celular com as mãos para deixar a tela deitada.";
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


;/* jogo/cuidado-acessivel/interface.js */
"use strict";
(() => {
  function init() {
    const form = document.getElementById("preferences");
    if (form) {
      document.body.classList.add("settings-in-tabs");
      const fields = [...form.querySelectorAll("fieldset.preference-card")];
      const tablist = document.createElement("div");
      tablist.className = "settings-tabs";
      tablist.setAttribute("role", "tablist");
      tablist.setAttribute("aria-label", "Categorias das configurações");
      const labels = ["Áudio", "Conforto", "Controles"];
      const select = (index, focus = false) => {
        fields.forEach((field, i) => {
          field.hidden = i !== index;
          const tab = tablist.children[i];
          tab.setAttribute("aria-selected", String(i === index));
          tab.tabIndex = i === index ? 0 : -1;
        });
        if (focus) tablist.children[index].focus();
        document.querySelector(".panel-inner").scrollTop = 0;
      };
      fields.forEach((field, index) => {
        field.id = "settings-panel-" + index;
        field.setAttribute("role", "tabpanel");
        field.setAttribute("aria-labelledby", "settings-tab-" + index);
        const tab = document.createElement("button");
        tab.type = "button";
        tab.id = "settings-tab-" + index;
        tab.textContent = labels[index];
        tab.setAttribute("role", "tab");
        tab.setAttribute("aria-controls", field.id);
        tab.addEventListener("click", () => select(index));
        tab.addEventListener("keydown", (e) => {
          let next;
          if (e.key === "ArrowRight") next = (index + 1) % fields.length;
          if (e.key === "ArrowLeft")
            next = (index + fields.length - 1) % fields.length;
          if (e.key === "Home") next = 0;
          if (e.key === "End") next = fields.length - 1;
          if (next !== undefined) {
            e.preventDefault();
            select(next, true);
          }
        });
        tablist.append(tab);
      });
      form.prepend(tablist);
      select(0);
      document.querySelector(".settings-scene")?.remove();
    }
    // O desenho não substitui uma fotografia: mantenha a autoria identificada.
    const team = document.getElementById("team");
    if (team && !team.querySelector(".creators-authorship")) {
      const names = document.createElement("div");
      names.className = "creators-authorship";
      names.innerHTML =
        '<p class="eyebrow">CRIAÇÃO DO PROJETO</p><div class="creator-name"><h3>Iuri Barroso Nascimento</h3><p>Criação e desenvolvimento</p></div><div class="creator-name"><h3>Hicham Mohamed El Attar</h3><p>Criação e desenvolvimento</p></div><p class="other-creators">Com a participação de Eric e Nadson.</p>';
      team.querySelector(".team-profile-heading")?.before(names);
    }
    const hints = document.querySelectorAll(".keyboard-hint,.keyboard-help");
    hints.forEach((el) => {
      el.textContent = el.textContent.replace(/E ·/g, "Enter / E ·");
    });
  }
  window.addEventListener(
    "keydown",
    (e) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key))
        return;
      const choice = e.target.closest?.("#puzzle-options [data-answer]");
      if (!choice) return;
      const options = [
        ...choice.parentElement.querySelectorAll("button:not(:disabled)"),
      ];
      const step = ["ArrowRight", "ArrowDown"].includes(e.key) ? 1 : -1;
      e.preventDefault();
      e.stopImmediatePropagation();
      options[
        (options.indexOf(choice) + step + options.length) % options.length
      ]?.focus();
    },
    { capture: true },
  );
  // O Enter mantém a ativação nativa dos botões e campos; na aventura ele é contextual.
  window.addEventListener(
    "keydown",
    (e) => {
      if (
        e.key !== "Enter" ||
        e.isComposing ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey
      )
        return;
      const field = e.target.closest?.(
        "input,select,textarea,[contenteditable=true]",
      );
      if (field) {
        if (field.matches("input[type=checkbox],input[type=radio]")) {
          e.preventDefault();
          if (!e.repeat) field.click();
        }
        return;
      }
      const dialog =
        e.target.closest?.("dialog[open]") ||
        [...document.querySelectorAll("dialog[open]")].at(-1);
      if (dialog) {
        if (e.target.closest?.("button,a[href],summary")) return;
        const primary = dialog.querySelector(
          "#conversa-avancar,#intro-next,[data-map-action=start],#puzzle-options button,[data-close],button:not(.viewport-control)",
        );
        if (primary && !primary.disabled) {
          e.preventDefault();
          e.stopImmediatePropagation();
          if (!e.repeat) primary.click();
        }
        return;
      }
      if (
        document.getElementById("jogo") &&
        document.body.dataset.gameReady === "true"
      ) {
        const explicit = e.target.closest?.("button,a[href],summary");
        if (
          explicit &&
          !explicit.matches("#interagir,#mangueira,#ferramenta,[data-goal]")
        )
          return;
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!e.repeat)
          document.dispatchEvent(new CustomEvent("guardiao:acao-principal"));
      }
    },
    { capture: true },
  );
  window.addEventListener(
    "keyup",
    (e) => {
      if (e.key === "Enter")
        document.dispatchEvent(new CustomEvent("guardiao:soltar-acao"));
    },
    { capture: true },
  );
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();

