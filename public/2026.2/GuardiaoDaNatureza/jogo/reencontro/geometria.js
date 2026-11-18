"use strict";
(() => {
  if (!window.ReencontroGeometria) return;
  const phases = structuredClone(GuardiaoFasesJogaveis);
  for (const id of [2, 3, 4, 5]) {
    Object.assign(phases[id], window.ReencontroGeometria[id]);
    phases[id].trees = [];
    phases[id].landmarks = [];
  }
  window.GuardiaoFasesJogaveis = Object.freeze(phases);
})();
