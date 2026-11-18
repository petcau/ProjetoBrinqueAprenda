"use strict";
(() => {
  // Só adianta o equipamento da fase escolhida, sem baixar as cinco fases na abertura.
  const warmed = new Set();
  document.addEventListener("DOMContentLoaded", () => {
    const preload = () => {
      const id = Number(document.body.dataset.phasePreview);
      if (!id || warmed.has(id) || navigator.connection?.saveData) return;
      warmed.add(id);
      const names = [
        "equipamentos",
        id === 1 ? "mangueira" : GuardiaoMemoria.phaseUniform(id),
        ...(id >= 3 ? ["tarefas"] : []),
      ];
      for (const name of names) {
        const d = BosqueKaiAtlas[name];
        if (!d) continue;
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.as = "image";
        link.href = new URL(d.file, BosqueKai.base);
        document.head.append(link);
      }
    };
    new MutationObserver(preload).observe(document.body, {
      attributes: true,
      attributeFilter: ["data-phase-preview"],
    });
  });
})();
