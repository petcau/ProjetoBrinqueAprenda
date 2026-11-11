"use strict";
(() => {
  const original = window.GuardiaoElenco;
  if (original)
    window.GuardiaoElenco = Object.freeze({ ...original, actors: () => [] });
  if (window.GuardiaoFasesJogaveis) {
    const phases = structuredClone(GuardiaoFasesJogaveis);
    phases[3].tasks = phases[3].tasks.filter((t) =>
      ["chave-abrigo", "macaco", "tucano", "ave", "capivara"].includes(t.id),
    );
    window.GuardiaoFasesJogaveis = Object.freeze(phases);
  }
})();
