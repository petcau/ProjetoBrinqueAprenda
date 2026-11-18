"use strict";
(() => {
  const original = window.GuardiaoElenco;
  if (original)
    window.GuardiaoElenco = Object.freeze({ ...original, actors: () => [] });
  if (window.GuardiaoFasesJogaveis) {
    const phases = structuredClone(GuardiaoFasesJogaveis);
    window.GuardiaoFasesJogaveis = Object.freeze(phases);
  }
})();
