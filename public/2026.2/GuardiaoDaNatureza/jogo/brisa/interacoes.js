"use strict";
(() => {
  function briefItems() {
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
