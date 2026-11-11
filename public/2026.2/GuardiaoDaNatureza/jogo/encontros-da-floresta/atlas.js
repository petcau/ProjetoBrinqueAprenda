"use strict";
window.GuardiaoEncontrosAtlas = {
  scenes: [
    {
      id: 1,
      width: 475,
      height: 480,
      normal: "assets/encontro-1-olhar.webp",
      blink: "assets/encontro-1-piscada.webp",
    },
    {
      id: 2,
      width: 501,
      height: 470,
      normal: "assets/encontro-2-olhar.webp",
      blink: "assets/encontro-2-piscada.webp",
    },
    {
      id: 3,
      width: 496,
      height: 499,
      normal: "assets/encontro-3-olhar.webp",
      blink: "assets/encontro-3-piscada.webp",
    },
    {
      id: 4,
      width: 513,
      height: 493,
      normal: "assets/encontro-4-olhar.webp",
      blink: "assets/encontro-4-piscada.webp",
    },
    {
      id: 5,
      width: 487,
      height: 500,
      normal: "assets/encontro-5-olhar.webp",
      blink: "assets/encontro-5-piscada.webp",
    },
    {
      id: 6,
      width: 498,
      height: 445,
      normal: "assets/encontro-6-olhar.webp",
      blink: "assets/encontro-6-piscada.webp",
    },
  ],
  crystals: {
    file: "assets/relicario-cristais.webp",
    width: 688,
    height: 576,
    referenceHeight: 218,
    frames: [
      { bounds: [23, 53, 126, 223], pivot: [86.0, 276] },
      { bounds: [193, 62, 130, 214], pivot: [258.0, 276] },
      { bounds: [356, 13, 148, 263], pivot: [430.0, 276] },
      { bounds: [536, 60, 133, 216], pivot: [602.5, 276] },
      { bounds: [24, 346, 125, 218], pivot: [86.5, 564] },
    ],
  },
  mount: {
    file: "assets/montura.webp",
    width: 1024,
    height: 1536,
    pendant: [142, 565, 740, 960],
    slots: [
      [277, 723, 126, 223, 0],
      [245, 982, 130, 214, 0],
      [434, 1113, 148, 263, 0],
      [643, 982, 133, 216, 0],
      [622, 728, 125, 218, 0],
    ],
  },
};
