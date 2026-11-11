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
