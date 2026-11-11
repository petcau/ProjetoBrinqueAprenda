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
