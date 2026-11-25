"use strict";
(() => {
  const frame = document.getElementById("guardiao-game"),
    base = new URL("../../", document.currentScript.src);
  function route(value) {
    try {
      const u = new URL(value, base);
      if (u.origin !== base.origin || !u.pathname.startsWith(base.pathname))
        return null;
      const path = u.pathname.slice(base.pathname.length);
      return [
        "jogo/viva/index.html",
        "jogo/jornada/index.html",
        "jogo/floresta-viva/index.html",
      ].includes(path)
        ? u
        : null;
    } catch {
      return null;
    }
  }
  const wanted = route(
    new URL(location.href).searchParams.get("rota") ||
      "jogo/viva/index.html#inicio",
  );
  frame.src = (wanted || new URL(frame.dataset.start, base)).href;
  function sync() {
    const child = frame.contentWindow;
    try {
      child?.dispatchEvent(new child.Event("guardiao:fullscreen"));
    } catch {}
  }
  document.addEventListener("fullscreenchange", sync);
  document.addEventListener("webkitfullscreenchange", sync);
  frame.addEventListener("load", () => {
    const child = frame.contentWindow;
    function reflect() {
      try {
        const u = route(child.location.href);
        if (!u) return;
        const parentURL = new URL("index.html", base);
        parentURL.searchParams.set(
          "rota",
          u.pathname.slice(base.pathname.length) + u.search + u.hash,
        );
        history.replaceState(null, "", parentURL);
        document.title = child.document.title || "Guardião da Natureza";
      } catch {}
    }
    reflect();
    try {
      child.addEventListener("hashchange", reflect);
    } catch {}
    sync();
  });
  window.GuardiaoJanela = Object.freeze({ frame: true });
})();
