"use strict";
(() => {
  const positions = {
    1: [
      [330, 300],
      [265, 470],
    ],
    2: [
      [221, 228],
      [1000, 560],
    ],
    3: [
      [486, 278],
      [640, 604],
    ],
    4: [
      [436, 179],
      [810, 576],
    ],
    5: [
      [555, 430],
      [780, 518],
      [550, 368],
      [952, 477],
    ],
  };
  const habitats = {
    mico: { x: 746, y: 159 },
    tucano: { x: 1040, y: 270 },
    passaro: { x: 769, y: 211 },
    capivara: { x: 1052, y: 310 },
    onca: { x: 877, y: 575 },
    arara: { x: 703, y: 109 },
    tamandua: { x: 620, y: 626 },
    anta: { x: 1063, y: 402 },
    preguica: { x: 489, y: 144 },
  };
  const neighbors = {
    1: [
      [450, 300, 1, "Tiago"],
      [730, 350, 2, "Lia"],
      [1090, 580, 3, "Bia"],
      [1020, 375, 4, "Luzia"],
    ],
    2: [
      [330, 300, 0, "João"],
      [935, 300, 2, "Lia"],
      [1020, 470, 3, "Bia"],
      [920, 470, 4, "Luzia"],
    ],
    3: [
      [545, 270, 0, "João"],
      [690, 350, 1, "Tiago"],
      [1000, 340, 3, "Bia"],
      [680, 500, 4, "Luzia"],
    ],
    4: [
      [620, 330, 0, "João"],
      [950, 420, 1, "Tiago"],
      [720, 570, 2, "Lia"],
      [450, 490, 4, "Luzia"],
    ],
    5: [
      [600, 450, 1, "Tiago"],
      [760, 300, 3, "Bia"],
    ],
  };
  function actors(phase, time = 0, ratio = 0, reduced = false) {
    const original = (positions[phase] || []).map(([x, y], i) => {
      const row = phase === 5 ? i : [1, 3][i],
        moving = phase === 5 && row === 2 && ratio >= 1;
      const xx = moving && !reduced ? 400 + ((time * 24) % 470) : x;
      const stage = ratio >= 1 ? 3 : ratio > 0 ? 2 : 0;
      return {
        id: "vizinho-" + i,
        row,
        x: xx,
        y,
        height: 56,
        solid: row !== 2,
        frame:
          row * 4 +
          (stage === 3
            ? reduced
              ? 3
              : 2 + (Math.floor(time * 4 + i) % 2)
            : stage),
      };
    });
    return [
      ...original,
      ...(neighbors[phase] || []).map(([x, y, role, name], i) => ({
        id: "aliado-" + i,
        x,
        y,
        role,
        name,
        height: 61,
        solid: true,
        pose:
          ratio >= 1 ? 1 : !reduced && Math.sin(time * 0.8 + i) > 0.8 ? 2 : 0,
        tip: {
          1: "A ponte é o caminho seguro. Cuide dos focos antes dos animais!",
          2: "Cada resíduo fora da água ajuda a vida do rio.",
          3: "Pense na pergunta. Os amigos precisam de cuidado!",
          4: "Plante a muda e regue. Um cuidado de cada vez!",
          5: "Cada tipo de resíduo tem seu lugar.",
        }[phase],
      })),
    ];
  }
  window.GuardiaoElenco = Object.freeze({
    actors,
    habitat: (name) => habitats[name] && { ...habitats[name] },
  });
})();
