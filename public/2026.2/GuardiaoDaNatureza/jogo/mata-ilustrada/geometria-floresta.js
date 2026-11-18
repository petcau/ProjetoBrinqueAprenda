"use strict";
// Coordenadas em unidades do cenário (1280 × 720). Colisão nos pés, não na copa.
(() => {
  const original = window.FlorestaMundo;
  const radius = 8;
  const geometry = window.GuardiaoMovimento;
  const reservoir = { x: 377, y: 356, rx: 43, ry: 28 };
  const trees = [...original.trees];
  const obstacles = [
    ...GuardiaoElenco.actors(1)
      .filter((a) => a.solid)
      .map((a) => ({ name: a.id, ellipse: { x: a.x, y: a.y, rx: 10, ry: 7 } })),
    { name: "reservatório", ellipse: reservoir },
    { name: "Carlos", ellipse: { x: 245, y: 245, rx: 12, ry: 9 } },
    {
      name: "cabana",
      polygon: [
        [65, 155],
        [255, 155],
        [260, 187],
        [62, 197],
      ],
    },
    {
      name: "abrigo",
      polygon: [
        [345, 168],
        [438, 168],
        [438, 190],
        [345, 195],
      ],
    },
    ...trees.map((t) => ({
      name: "tronco",
      ellipse: { x: t.x, y: t.y, rx: 13, ry: 7 },
    })),
  ];
  // Trilhas largas e clareiras reais: a travessia está na ponte, não na cisterna.
  const edges = [
    ...original.edges.map(([a, b, w]) => [a, b, Math.max(w, 38)]),
    ["leste", "cervo", 32],
    ["baixo", "passaro", 35],
    ["cinza", "capivara", 35],
  ];
  const nodes = {
    ...original.nodes,
    cervo: [1190, 240],
    passaro: [1120, 490],
    capivara: [260, 540],
    registro: [436, 392],
    cisterna: [315, 407],
    beira: [470, 408],
    ponteOeste: [506, 405],
    ponte: [575, 405],
    ponteLeste: [647, 405],
    alto: [900, 200],
    norte: [995, 161],
  };
  const zones = [
    ...original.zones,
    [
      [194, 204],
      [299, 204],
      [330, 227],
      [319, 265],
      [264, 273],
      [194, 268],
    ],
    [
      [253, 222],
      [317, 222],
      [346, 278],
      [316, 337],
      [272, 329],
      [250, 274],
    ],
    [
      [290, 315],
      [445, 306],
      [488, 355],
      [492, 414],
      [423, 441],
      [290, 443],
    ],
    [
      [252, 260],
      [354, 265],
      [365, 315],
      [328, 362],
      [288, 407],
      [272, 454],
      [218, 478],
      [206, 445],
      [267, 344],
    ],
    [
      [300, 384],
      [343, 390],
      [412, 394],
      [468, 376],
      [503, 382],
      [507, 427],
      [422, 441],
      [323, 443],
    ],
    [
      [685, 300],
      [760, 270],
      [846, 301],
      [895, 278],
      [926, 200],
      [1017, 143],
      [1160, 164],
      [1197, 229],
      [1174, 307],
      [1225, 342],
      [1223, 398],
      [1117, 461],
      [1147, 530],
      [1208, 543],
      [1145, 617],
      [995, 649],
      [861, 661],
      [860, 603],
      [1026, 557],
      [1055, 474],
      [976, 444],
      [893, 404],
      [820, 420],
      [743, 434],
      [679, 405],
    ],
  ];
  const distance = original.distance,
    inside = original.inside;
  function segment(p, a, b) {
    const dx = b[0] - a[0],
      dy = b[1] - a[1],
      d = dx * dx + dy * dy,
      t = d
        ? Math.max(0, Math.min(1, ((p.x - a[0]) * dx + (p.y - a[1]) * dy) / d))
        : 0;
    return Math.hypot(p.x - a[0] - t * dx, p.y - a[1] - t * dy);
  }
  function floor(p) {
    return (
      p.x > 20 &&
      p.x < 1255 &&
      p.y > 45 &&
      p.y < 692 &&
      (!inside(p, original.river) || inside(p, original.bridge))
    );
  }
  function walkable(p, r = radius) {
    if (!geometry.fitsFloor(p, r, floor)) return false;
    return !obstacles.some((o) =>
      o.ellipse
        ? geometry.touchesEllipse(p, o.ellipse, r)
        : inside(p, o.polygon) || geometry.polygonMargin(p, o.polygon) <= r,
    );
  }
  const landmarks = [];
  let hazards = [];
  const clear = (p) =>
    !hazards.some(
      (h) =>
        (h.life > 0 || h.stage === "ferido") &&
        distance(p, h.position || h) < (h.stage ? 19 : 27),
    );
  function visible(a, b) {
    const n = Math.max(1, Math.ceil(distance(a, b)));
    for (let i = 0; i <= n; i++)
      if (
        !walkable({
          x: a.x + ((b.x - a.x) * i) / n,
          y: a.y + ((b.y - a.y) * i) / n,
        }) ||
        !clear({
          x: a.x + ((b.x - a.x) * i) / n,
          y: a.y + ((b.y - a.y) * i) / n,
        })
      )
        return false;
    return true;
  }
  // Grade de 8 px compartilhada por Kai e animais; diagonais não cortam quinas.
  const cell = 8,
    cols = 160,
    rows = 90,
    grid = new Uint8Array(cols * rows);
  const point = (id) => ({
    x: (id % cols) * cell + 4,
    y: Math.floor(id / cols) * cell + 4,
  });
  for (let id = 0; id < grid.length; id++)
    grid[id] = Number(walkable(point(id)));
  function closest(p) {
    const choices = [],
      valid = walkable(p);
    for (let id = 0; id < grid.length; id++) {
      if (!grid[id] || !clear(point(id))) continue;
      const q = point(id);
      choices.push({ id, q, d: (q.x - p.x) ** 2 + (q.y - p.y) ** 2 });
    }
    choices.sort((a, b) => a.d - b.d);
    for (const { id, q } of choices) if (!valid || visible(p, q)) return id;
    return -1;
  }
  const search = new window.RaizesBusca({
    cols,
    rows,
    cell,
    point,
    grid,
    walkable,
    visible,
  });
  function route(from, to) {
    const signature = hazards
      .map((h) => Number(h.life > 0 || h.stage === "ferido"))
      .join("");
    return search.route(from, to, { signature, clear });
  }
  function approach(from, target, range = 65) {
    const choices = [];
    for (let r = range; r >= 24; r -= 16)
      for (let i = 0; i < 24; i++) {
        const a = (i * Math.PI) / 12,
          p = { x: target.x + Math.cos(a) * r, y: target.y + Math.sin(a) * r };
        if (walkable(p)) choices.push(p);
      }
    choices.sort((a, b) => distance(from, a) - distance(from, b));
    for (const p of choices) {
      const path = route(from, p);
      if (path.length) return path;
    }
    return [];
  }
  function nearest(p) {
    return Object.keys(nodes).sort(
      (a, b) =>
        distance(p, { x: nodes[a][0], y: nodes[a][1] }) -
        distance(p, { x: nodes[b][0], y: nodes[b][1] }),
    )[0];
  }
  window.FlorestaMundo = Object.freeze({
    ...original,
    nodes,
    trees,
    landmarks,
    edges,
    zones,
    obstacles,
    radius,
    floorPoint: floor,
    reservoir,
    setHazards: (value) => {
      hazards = value;
    },
    walkable,
    visible,
    route,
    approach,
    nearest,
    navigationSnapshot: () => ({ grid: grid.slice(), cell, cols, rows }),
    navigationStats: () => ({ calls: search.calls, expanded: search.expanded }),
  });
})();
