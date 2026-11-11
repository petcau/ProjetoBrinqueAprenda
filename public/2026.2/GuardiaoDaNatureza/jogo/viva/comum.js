"use strict";
(() => {
  const base = new URL("./", document.currentScript.src),
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
