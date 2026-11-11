"use strict";
(() => {
  const base = new URL("./assets/", document.currentScript.src);
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
