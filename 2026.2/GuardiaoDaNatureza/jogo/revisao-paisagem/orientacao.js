"use strict";
(() => {
  const art = new URL("../gire-o-celular/assets/", document.currentScript.src);
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
