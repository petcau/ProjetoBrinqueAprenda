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
      "../viva/assets/inicio.webp",
      document.currentScript?.src ||
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
