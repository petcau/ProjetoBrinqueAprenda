"use strict";
// Posições dos objetos e seus pés. A ilustração e a física leem este mesmo cadastro.
(() => {
  const entry = (id, frame, x, y, height, rx, ry) => ({
    id,
    kind: "decor",
    frame,
    x,
    y,
    height,
    rx,
    ry,
  });
  const landmarks = {
    1: [
      entry("suprimentos-carlos", 7, 330, 287, 68, 24, 12),
      entry("bomba-apoio", 6, 449, 337, 75, 18, 10),
      entry("placa-trilha", 16, 304, 162, 80, 8, 7),
      entry("madeira-abrigo", 22, 358, 252, 38, 24, 9),
      entry("tronco-queimado-leste", 5, 1014, 441, 54, 29, 10),
      entry("tronco-queimado-norte", 5, 843, 153, 47, 26, 9),
    ],
    2: [
      entry("barril-do-rio", 17, 245, 325, 70, 22, 12),
      entry("rede-e-suprimentos", 7, 262, 285, 60, 22, 11),
      entry("placa-margem", 16, 375, 235, 80, 8, 7),
      entry("madeira-do-pier", 22, 278, 291, 38, 23, 8),
      entry("banco-margem", 10, 1019, 548, 68, 32, 11),
    ],
    3: [
      entry("alimento-fauna", 7, 475, 175, 61, 22, 11),
      entry("comedouro-central", 8, 627, 386, 83, 9, 8),
      entry("abrigo-ninhos", 8, 800, 131, 76, 9, 8),
      entry("banco-marina", 10, 429, 505, 67, 30, 10),
      entry("placa-fauna", 16, 618, 160, 79, 8, 7),
    ],
    4: [
      entry("bancada-viveiro", 9, 467, 139, 89, 33, 15),
      entry("vasos-viveiro", 21, 265, 261, 44, 21, 10),
      entry("barril-rega", 17, 430, 350, 66, 21, 12),
      entry("banco-viveiro", 10, 754, 582, 65, 30, 10),
      entry("madeira-canteiros", 22, 994, 602, 36, 22, 8),
    ],
    5: [
      entry("poste-praca-1", 12, 569, 329, 106, 6, 6),
      entry("poste-praca-2", 12, 755, 353, 106, 6, 6),
      entry("banco-da-praca", 10, 686, 351, 69, 32, 11),
      entry("carrinho-cidade", 15, 449, 452, 67, 29, 13),
      entry("barril-cidade", 17, 981, 547, 65, 21, 12),
      entry("poste-escola", 12, 799, 270, 101, 6, 6),
      entry("poste-reciclagem", 12, 187, 451, 98, 6, 6),
      entry("placa-reciclagem", 16, 366, 475, 76, 8, 7),
    ],
  };
  const paths = {
    2: [
      [
        [315, 245],
        [281, 306],
        [265, 401],
        [326, 523],
        [427, 604],
      ],
      [
        [800, 180],
        [931, 241],
        [1021, 339],
        [950, 440],
        [967, 541],
        [891, 624],
      ],
      [
        [315, 245],
        [393, 180],
        [802, 180],
      ],
    ],
    3: [
      [
        [375, 225],
        [471, 282],
        [621, 220],
        [761, 199],
        [927, 190],
        [1071, 299],
        [1021, 441],
        [900, 532],
        [720, 452],
        [550, 429],
        [398, 480],
        [270, 424],
        [375, 225],
      ],
    ],
    4: [
      [
        [375, 237],
        [462, 310],
        [578, 209],
        [760, 160],
        [900, 158],
        [1030, 230],
        [1045, 332],
        [970, 430],
        [845, 510],
        [680, 560],
        [533, 548],
        [460, 480],
        [505, 409],
        [462, 310],
      ],
      [
        [375, 237],
        [376, 310],
        [370, 333],
      ],
    ],
    5: [
      [
        [370, 282],
        [431, 261],
        [692, 217],
        [850, 294],
        [989, 301],
        [1040, 386],
        [901, 401],
        [785, 433],
        [622, 554],
        [361, 572],
        [282, 493],
        [370, 282],
      ],
      [
        [622, 554],
        [630, 476],
        [686, 351],
        [755, 353],
        [850, 294],
      ],
    ],
  };
  const island = [
    [74, 103],
    [168, 66],
    [300, 69],
    [389, 95],
    [501, 57],
    [613, 74],
    [742, 61],
    [872, 96],
    [943, 151],
    [932, 223],
    [967, 307],
    [933, 381],
    [897, 433],
    [817, 487],
    [714, 508],
    [624, 488],
    [539, 515],
    [451, 500],
    [359, 519],
    [260, 499],
    [172, 468],
    [100, 425],
    [53, 358],
    [68, 280],
    [47, 204],
  ];
  function landmarksFor(id) {
    return (landmarks[id] || []).map((p) => ({ ...p }));
  }
  function awayFromGoals(p, data) {
    const goals = [
      ...(data.tasks || []),
      ...(data.fires || []),
      ...(data.animals || []).flatMap((a) => [a, a.home]),
      ...(data.refill ? [data.refill] : []),
      ...(data.station ? [data.station] : []),
    ];
    return !goals.some(
      (g) => g && Math.hypot(p.x - g.x, p.y - g.y) < Math.max(p.rx, p.ry) + 27,
    );
  }
  window.MataLayout = { landmarksFor, awayFromGoals, paths, island };
})();
