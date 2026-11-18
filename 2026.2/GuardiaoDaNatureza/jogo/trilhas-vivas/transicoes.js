"use strict";
(() => {
  const base = new URL("./", document.currentScript.src),
    cover = 620,
    reveal = 820;
  let el,
    busy = false,
    count = 0,
    arriving = false,
    arrival = Promise.resolve(),
    queued = null;
  const reduced = () =>
    BrisaArte.reduced() || Raizes.prefs().screenTransitions === false;
  function ensure() {
    if (el) return;
    el = document.createElement("div");
    el.id = "leaf-transition";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML =
      '<div class="grove-shade"></div><div class="grove-half left"></div><div class="grove-half right"></div>' +
      Array.from(
        { length: 12 },
        (_, i) =>
          `<img class="grove-leaf" src="${new URL("assets/folha-" + (i % 3) + ".webp", base)}" alt="" style="--i:${i};--x:${(i * 37) % 100}%;--y:${(i * 61) % 100}%;--angle:${i * 29}deg">`,
      ).join("") +
      '<span class="grove-loading">Preparando a trilha<span>•••</span></span>';
    document.body.append(el);
  }
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  async function run(change) {
    if (busy) {
      if (arriving && !queued) {
        queued = change || (() => {});
        await arrival;
        const next = queued;
        queued = null;
        return run(next);
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
    document.body.dataset.transition = "fechando";
    el.className = "is-covering";
    // O primeiro quadro sem cobertura é confirmado antes de iniciar o movimento.
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r)),
    );
    el.classList.add("grove-closed");
    await delay(cover);
    try {
      change?.();
      await delay(0);
      if (location.hash === "#mapa")
        await Promise.allSettled([
          window.BosqueVegetacao?.load(),
          window.TrilhasNatureza?.load(),
        ]);
      await new Promise((r) => requestAnimationFrame(r));
    } finally {
      document.body.dataset.transition = "abrindo";
      el.classList.remove("grove-closed");
      el.classList.add("is-leaving");
      await delay(reveal);
      el.className = "";
      busy = false;
      document.body.dataset.transition = "pronta";
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
    }),
  };
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      el?.classList.remove("is-covering", "grove-closed", "is-leaving");
      busy = arriving = false;
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
      run(() => (same ? (location.hash = u.hash) : location.assign(u.href)));
    });
    if (reduced()) {
      document.body.dataset.transition = "pronta";
      return;
    }
    busy = arriving = true;
    el.className = "is-covering grove-closed grove-arriving";
    arrival = new Promise((resolve) => {
      let observer, timeout;
      const ready = () =>
        document.body.dataset.gameReady === "true" ||
        document.body.dataset.uiReady === "true" ||
        document.querySelector("#loading a");
      const open = async () => {
        observer?.disconnect();
        clearTimeout(timeout);
        await new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(r)),
        );
        el.classList.remove("grove-arriving", "grove-closed");
        el.classList.add("is-leaving");
        document.body.dataset.transition = "abrindo";
        await delay(reveal);
        el.className = "";
        busy = arriving = false;
        document.body.dataset.transition = "pronta";
        resolve();
      };
      if (ready()) open();
      else {
        observer = new MutationObserver(() => {
          if (ready()) open();
        });
        observer.observe(document.body, {
          attributes: true,
          attributeFilter: ["data-game-ready", "data-ui-ready"],
          childList: true,
          subtree: true,
        });
        timeout = setTimeout(open, 12000);
      }
    });
  });
})();
