"use strict";
(() => {
  let rectangles = [],
    measured = -999,
    observer;
  const invalidate = () => {
    measured = -999;
  };
  function bounds() {
    const now = performance.now();
    if (now - measured > 120) {
      rectangles = [
        ...document.querySelectorAll(
          "#jogo .mission,#jogo .missions,#jogo .top-actions,#jogo .joystick,#jogo .actions,#jogo #ajuda,#jogo #jump-action",
        ),
      ]
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width && r.height);
      measured = now;
    }
    return rectangles;
  }
  window.GuardiaoEtiquetas = Object.freeze({
    position(x, y, w, view, width, height) {
      const { s, ox, oy } = view;
      const screenX = Math.max(
        8 + (w * s) / 2,
        Math.min(width - 8 - (w * s) / 2, x * s + ox),
      );
      let screenY = Math.max(22, Math.min(height - 10, y * s + oy));
      const reserved = bounds();
      for (let pass = 0; pass < 2; pass++)
        for (const r of reserved)
          if (
            screenX - (w * s) / 2 < r.right + 5 &&
            screenX + (w * s) / 2 > r.left - 5 &&
            screenY - 17 * s < r.bottom + 5 &&
            screenY + 6 * s > r.top - 5
          )
            screenY =
              r.top < height / 2
                ? Math.min(height - 10, r.bottom + 7 + 17 * s)
                : Math.max(22, r.top - 7 - 6 * s);
      return { x: (screenX - ox) / s, y: (screenY - oy) / s };
    },
  });
  window.addEventListener("resize", invalidate);
  document.addEventListener("guardiao:preferencias", invalidate);
  document.addEventListener("DOMContentLoaded", () => {
    const short = {
      agua: "Água",
      fogo: "Fogo",
      animal: "Animais",
      trash: "Lixo",
      key: "Chave",
      bed: "Plantas",
      recycle: "Reciclagem",
      solar: "Energia",
      garden: "Jardins",
    };
    document
      .querySelectorAll("#jogo [data-goal] .goal-label")
      .forEach((label) => {
        const goal = label.closest("[data-goal]")?.dataset.goal;
        if (short[goal]) {
          label.dataset.short = short[goal];
          label.title = label.textContent.trim();
        }
      });
    const water = document.querySelector('[data-goal="agua"]'),
      mission = document.querySelector("#jogo .mission");
    if (water && mission) {
      mission.insertBefore(water, mission.querySelector('[data-goal="fogo"]'));
      const state = document.getElementById("agua-estado");
      const update = () => {
        water.hidden = state?.textContent === "liberada";
        invalidate();
      };
      const watcher = new MutationObserver(() => {
        update();
        if (water.hidden) watcher.disconnect();
      });
      if (state)
        watcher.observe(state, {
          childList: true,
          characterData: true,
          subtree: true,
        });
      update();
    }
    if (!window.ResizeObserver) return;
    observer = new ResizeObserver(invalidate);
    document
      .querySelectorAll(".mission,.missions,.top-actions,.actions")
      .forEach((el) => observer.observe(el));
  });
})();
