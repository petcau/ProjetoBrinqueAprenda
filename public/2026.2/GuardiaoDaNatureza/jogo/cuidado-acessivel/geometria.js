"use strict";
(() => {
  const previous = window.GuardiaoNavegacao;
  if (window.GuardiaoFasesJogaveis) {
    const p = structuredClone(GuardiaoFasesJogaveis);
    p[2].water = [
      [520, 0],
      [738, 0],
      [718, 100],
      [752, 218],
      [810, 285],
      [846, 325],
      [806, 376],
      [879, 423],
      [902, 484],
      [867, 544],
      [847, 612],
      [810, 720],
      [453, 720],
      [476, 646],
      [432, 597],
      [437, 548],
      [363, 515],
      [313, 468],
      [296, 408],
      [304, 344],
      [359, 298],
      [421, 280],
      [431, 216],
      [470, 169],
      [474, 104],
    ];
    p[2].bridge = { x: 400, y: 162, w: 400, h: 34 };
    p[2].docks = [
      [
        [286, 236],
        [430, 260],
        [430, 286],
        [300, 265],
      ],
    ];
    p[2].obstacles = [
      p[2].obstacles[0],
      { x: 405, y: 371, rx: 53, ry: 25 },
      { x: 440, y: 554, rx: 57, ry: 24 },
      { x: 795, y: 272, rx: 45, ry: 24 },
    ];
    p[3].tasks.find((t) => t.id === "macaco").x = 934;
    p[3].tasks.find((t) => t.id === "macaco").y = 111;
    p[3].tasks.find((t) => t.id === "ave").x = 262;
    p[3].tasks.find((t) => t.id === "ave").y = 424;
    p[3].obstacles[1] = { x: 896, y: 338, rx: 30, ry: 19 };
    const wall = (a, b) => ({ a, b, r: 3 });
    p[3].barriers = [
      [
        [112, 209],
        [264, 229],
      ],
      [
        [371, 172],
        [415, 156],
      ],
      [
        [621, 60],
        [709, 86],
      ],
      [
        [790, 77],
        [789, 116],
      ],
      [
        [789, 116],
        [925, 155],
      ],
      [
        [963, 150],
        [1047, 130],
      ],
      [
        [156, 353],
        [245, 349],
      ],
      [
        [295, 395],
        [351, 418],
      ],
      [
        [351, 418],
        [346, 454],
      ],
      [
        [305, 461],
        [181, 497],
      ],
      [
        [476, 525],
        [555, 500],
      ],
      [
        [478, 561],
        [480, 599],
      ],
      [
        [480, 599],
        [594, 630],
      ],
      [
        [712, 499],
        [824, 522],
      ],
      [
        [800, 640],
        [850, 632],
      ],
      [
        [1060, 383],
        [1190, 410],
      ],
      [
        [1187, 410],
        [1191, 471],
      ],
      [
        [1048, 527],
        [1192, 509],
      ],
      [
        [947, 436],
        [952, 485],
      ],
    ].map(([a, b]) => wall(a, b));
    p[4].obstacles[1] = { x: 308, y: 307, rx: 61, ry: 32 };
    Object.assign(
      p[5].tasks.find((t) => t.id === "reciclavel2"),
      { x: 945, y: 391 },
    );
    p[5].obstacles[3] = { x: 482, y: 314, rx: 57, ry: 28 };
    p[5].obstacles.push({ x: 865, y: 450, rx: 55, ry: 25 });
    p[5].barriers = [
      [
        [195, 560],
        [295, 587],
      ],
      [
        [325, 590],
        [430, 612],
      ],
      [
        [835, 337],
        [878, 365],
      ],
      [
        [908, 351],
        [973, 371],
      ],
      [
        [906, 566],
        [1007, 538],
      ],
    ].map(([a, b]) => wall(a, b));
    p[5].noWalkWater = [
      [
        [1115, 337],
        [1240, 350],
        [1260, 720],
        [1020, 720],
        [1051, 579],
        [1090, 472],
      ],
    ];
    p[5].dryBridge = { x: 1050, y: 375, w: 225, h: 71 };
    p[5].floor.splice(5, 0, [1103, 364], [1260, 378], [1260, 448], [1098, 449]);
    for (const id of [2, 3, 4, 5])
      p[id].obstacles.push(
        ...GuardiaoElenco.actors(id)
          .filter((a) => a.solid)
          .map((a) => ({ name: a.id, x: a.x, y: a.y, rx: 10, ry: 7 })),
      );
    // Os três recipientes são sólidos apenas junto aos pés.
    for (const offset of [-74, 0, 74])
      p[5].obstacles.push({
        name: "lixeira",
        x: p[5].station.x + offset,
        y: p[5].station.y - 4,
        rx: 20,
        ry: 9,
      });
    window.GuardiaoFasesJogaveis = Object.freeze(p);
  }
  if (!previous) return;
  const { distance, inside } = previous;
  function segment(p, a, b) {
    const dx = b[0] - a[0],
      dy = b[1] - a[1],
      d = dx * dx + dy * dy,
      t = d
        ? Math.max(0, Math.min(1, ((p.x - a[0]) * dx + (p.y - a[1]) * dy) / d))
        : 0;
    return Math.hypot(p.x - a[0] - t * dx, p.y - a[1] - t * dy);
  }
  class Navigation extends previous.Navigation {
    constructor(data) {
      super(data);
      this.staticGrid = this.grid.slice();
      this.dynamicSignature = "";
    }
    setDynamic(points) {
      const blocking = points.filter((p) => p.type !== "bed");
      const signature = blocking.map((p) => `${p.id}:${p.x}:${p.y}`).join("|");
      if (signature === this.dynamicSignature) return;
      this.dynamicSignature = signature;
      this.dynamic = blocking;
      this.grid.set(this.staticGrid);
      for (let i = 0; i < this.grid.length; i++)
        if (
          this.grid[i] &&
          blocking.some((p) => distance(p, this.point(i)) < 23)
        )
          this.grid[i] = 0;
    }
    walkable(p, r = 7) {
      const b = this.data.dryBridge,
        inBridge =
          b && p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h;
      return (
        super.walkable(p, r) &&
        !(this.data.barriers || []).some(
          (w) => segment(p, w.a, w.b) < w.r + r,
        ) &&
        (!(this.data.noWalkWater || []).some((poly) => inside(p, poly)) ||
          inBridge)
      );
    }
    interactionVisible(a, b) {
      const steps = Math.max(1, Math.ceil(distance(a, b) / 4));
      for (let i = 0; i <= steps; i++) {
        const p = {
          x: a.x + ((b.x - a.x) * i) / steps,
          y: a.y + ((b.y - a.y) * i) / steps,
        };
        if (
          (this.data.barriers || []).some(
            (w) => segment(p, w.a, w.b) <= w.r + 1,
          )
        )
          return false;
      }
      return true;
    }
    approach(from, target, range = 55) {
      const options = [];
      for (const radius of [range, range * 0.72, range * 0.48])
        for (let i = 0; i < 32; i++) {
          const a = (i * Math.PI) / 16,
            p = {
              x: target.x + Math.cos(a) * radius,
              y: target.y + Math.sin(a) * radius,
            };
          if (this.walkable(p) && this.interactionVisible(p, target))
            options.push(p);
        }
      options.sort((a, b) => distance(from, a) - distance(from, b));
      for (const p of options) {
        const path = this.route(from, p);
        if (path.length) return path;
      }
      return [];
    }
    swimming(p) {
      return (
        super.swimming(p) &&
        !(this.data.docks || []).some((poly) => inside(p, poly))
      );
    }
  }
  window.GuardiaoNavegacao = { ...previous, Navigation };
})();
