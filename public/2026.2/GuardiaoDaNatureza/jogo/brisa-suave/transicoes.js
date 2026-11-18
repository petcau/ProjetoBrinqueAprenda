"use strict";
(() => {
  const base = new URL("../trilhas-vivas/", document.currentScript.src),
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
