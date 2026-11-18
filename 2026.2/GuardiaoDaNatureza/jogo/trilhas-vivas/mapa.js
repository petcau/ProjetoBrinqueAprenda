"use strict";
(() => {
  const P = BosquePintura,
    centres = [
      [800, 130],
      [835, 310],
      [760, 440],
      [280, 420],
      [240, 130],
    ],
    coast = MataLayout.island;
  const rawRivers = [
    [
      [680, 92],
      [712, 120],
      [689, 172],
      [733, 219],
      [787, 243],
      [807, 288],
      [866, 325],
      [902, 357],
      [930, 421],
      [912, 447],
      [852, 373],
      [836, 347],
      [780, 315],
      [755, 276],
      [704, 251],
      [663, 202],
      [652, 152],
    ],
    [
      [535, 319],
      [578, 327],
      [604, 365],
      [661, 374],
      [704, 418],
      [717, 481],
      [697, 504],
      [680, 452],
      [643, 411],
      [590, 398],
      [567, 356],
      [530, 342],
    ],
  ];
  const rivers = rawRivers.map(TrilhasCurva);
  const trails = [
    [
      [251, 150],
      [288, 173],
      [320, 196],
      [342, 224],
      [360, 254],
      [396, 286],
      [422, 313],
      [452, 326],
    ],
    [
      [452, 326],
      [617, 330],
      [746, 430],
    ],
    [
      [452, 326],
      [340, 400],
      [275, 420],
    ],
    [
      [510, 260],
      [637, 166],
      [790, 130],
    ],
    [
      [637, 166],
      [773, 255],
      [830, 310],
    ],
  ];
  const bridges = [
    [
      [712, 227],
      [762, 249],
      [755, 260],
      [705, 238],
    ],
    [
      [603, 372],
      [655, 390],
      [650, 404],
      [597, 385],
    ],
  ];
  const ground = {},
    trees = [],
    detail = [],
    hills = [],
    houses = [];
  let canvas,
    layer,
    done = [],
    restoring = 0,
    started = 0,
    final = 0,
    now = 0,
    lastBuild = -99,
    dirty = true,
    hover = 0;
  function region(x, y) {
    let id = 1,
      best = Infinity;
    for (let i = 0; i < 5; i++) {
      const d = (x - centres[i][0]) ** 2 + (y - centres[i][1]) ** 2;
      if (d < best) {
        best = d;
        id = i + 1;
      }
    }
    return id;
  }
  function health(id, x, y, reduced) {
    if (!done.includes(id)) return 0;
    if (id !== restoring || reduced) return 1;
    const p = centres[id - 1];
    return P.ease(
      (performance.now() / 1000 -
        started -
        Math.hypot(x - p[0], y - p[1]) / 190) /
        3.5,
    );
  }
  function setup() {
    canvas = document.createElement("canvas");
    canvas.id = "living-island";
    canvas.setAttribute(
      "aria-label",
      "Ilha com cinco regiões interativas e Árvore Guardiã ao centro",
    );
    canvas.setAttribute("aria-hidden", "true");
    const stage = document.querySelector(".map-stage");
    stage.prepend(canvas);
    document.getElementById("island-ash")?.remove();
    BosqueVegetacao.load().then(() => {
      dirty = true;
    });
    const r = P.random(1673);
    for (let i = 0; i < 440; i++) {
      const x = 75 + r() * 860,
        y = 95 + r() * 395,
        id = region(x, y);
      if (
        !P.inside({ x, y }, coast) ||
        Math.hypot(x - 510, (y - 278) * 1.2) < 88 ||
        rivers.some((p) => P.inside({ x, y }, p))
      )
        continue;
      if (centres.some(([cx, cy]) => Math.hypot(x - cx, (y - cy) * 1.3) < 62))
        continue;
      if (id === 5 && x < 345 && y < 205) continue;
      trees.push({ x, y, id, h: 24 + r() * 25, seed: i });
    }
    trees.sort((a, b) => a.y - b.y);
    for (let i = 0; i < 120; i++) {
      const x = 80 + r() * 850,
        y = 100 + r() * 370;
      if (P.inside({ x, y }, coast))
        detail.push({ x, y, seed: i, h: 6 + r() * 8 });
    }
    for (let i = 0; i < 8; i++)
      houses.push({
        x: 136 + (i % 4) * 45 + (i > 3 ? 14 : 0),
        y: 112 + Math.floor(i / 4) * 54,
        h: 34 + (i % 3) * 3,
        town: i % 3 === 0 ? 2 : true,
      });
    for (let i = 0; i < 52; i++) {
      const a = (i / 52) * Math.PI * 2;
      hills.push({
        x: 500 + Math.cos(a) * (435 + r() * 10),
        y: 283 + Math.sin(a) * 210,
        h: 14 + r() * 15,
      });
    }
    stage.addEventListener("pointermove", (e) => {
      const b = e.target.closest(".map-hotspot");
      if (b) hover = Number(b.dataset.phase);
      else {
        const a = canvas.getBoundingClientRect();
        hover = region(
          ((e.clientX - a.x) * 1000) / a.width,
          ((e.clientY - a.y) * 563) / a.height,
        );
      }
    });
    stage.addEventListener("pointerleave", () => (hover = 0));
    stage.addEventListener("click", (e) => {
      if (e.target.closest("button,a")) return;
      const r = canvas.getBoundingClientRect(),
        x = ((e.clientX - r.x) * 1000) / r.width,
        y = ((e.clientY - r.y) * 563) / r.height;
      if (!P.inside({ x, y }, coast)) return;
      document
        .querySelector(`.map-hotspot[data-phase="${region(x, y)}"]`)
        ?.click();
    });
  }
  function update(ids, active = 0, seen = false) {
    if (!canvas) setup();
    if (ids.join(",") !== done.join(",")) {
      dirty = true;
      if (ground.mataTerrain) ground.mataTerrain.at = -99;
    }
    done = [...ids];
    if (active && active !== restoring) {
      started = performance.now() / 1000;
      restoring = active;
      dirty = true;
    }
    if (!ids.includes(restoring)) restoring = 0;
    final = seen ? 1 : window.VivaFinal?.active ? final : 0;
    document.body.dataset.mapRenderer = "elementos";
  }
  function groundLayer(t, reduced) {
    layer ||= MataArte.canvas(1000, 563);
    const c = layer.getContext("2d");
    c.clearRect(0, 0, 1000, 563);
    // Estratos da costa conservam o relevo e a praia da composição antiga.
    for (let i = 18; i > 0; i -= 3) {
      c.save();
      c.translate(0, i);
      P.smoothPoly(c, coast);
      c.fillStyle = i > 7 ? "#4f6f65" : i > 3 ? "#94764d" : "#c4a570";
      c.fill();
      c.restore();
    }
    for (let i = 17; i < coast.length - 1; i++) {
      const a = coast[i],
        b = coast[i + 1],
        n = Math.ceil(Math.hypot(a[0] - b[0], a[1] - b[1]) / 26);
      for (let j = 0; j < n; j++) {
        const t = j / n;
        TrilhasNatureza.prop(
          c,
          i % 3,
          a[0] + (b[0] - a[0]) * t,
          a[1] + (b[1] - a[1]) * t + 26,
          35,
        );
      }
    }
    for (let i = 0; i < coast.length; i += 3) {
      const p = coast[i];
      BosqueVegetacao.draw(c, "objetos", 4, p[0], p[1] + 17, 18 + (i % 3) * 4);
    }
    c.save();
    P.smoothPoly(c, coast);
    c.clip();
    P.terrain(
      c,
      ground,
      1000,
      563,
      (x, y) => health(region(x, y), x, y, reduced),
      t,
    );
    // Clareiras não são retângulos: os materiais acompanham vales, campos e margens.
    for (const [id, x, y, rx, ry, color] of [
      [1, 802, 156, 160, 115, "#282d284d"],
      [4, 276, 416, 175, 97, "#d9ad6330"],
      [5, 229, 147, 154, 91, "#a2a69c30"],
    ]) {
      const g = health(id, x, y, reduced);
      c.save();
      c.globalAlpha = 1 - g;
      c.translate(x, y);
      c.scale(1, ry / rx);
      const fade = c.createRadialGradient(0, 0, 10, 0, 0, rx);
      fade.addColorStop(0, color);
      fade.addColorStop(1, "#0000");
      c.fillStyle = fade;
      c.fillRect(-rx, -rx, rx * 2, rx * 2);
      c.restore();
    }
    MataPintura.trails(c, trails, 13, false);
    // Margem de areia contínua sob o rio.
    for (const p of rivers) {
      P.poly(c, p);
      c.lineWidth = 10;
      c.strokeStyle = "#d8bf8b";
      c.stroke();
    }
    for (const p of detail) {
      if (rivers.some((w) => P.inside(p, w))) continue;
      const g = health(region(p.x, p.y), p.x, p.y, reduced);
      MataArte.draw(c, g > 0.35 ? 18 : p.seed % 2 ? 1 : 19, p.x, p.y, p.h);
    }
    // A vila mantém ruas, pequenas praças e construções nas mesmas posições.
    P.trail(
      c,
      [
        [123, 145],
        [203, 164],
        [296, 152],
        [330, 183],
      ],
      19,
      true,
    );
    for (const h of houses) P.house(c, h.x, h.y, 38, h.h, h.town);
    for (let i = 0; i < 4; i++)
      MataArte.draw(c, 12, 162 + i * 44, 183 + (i % 2) * 12, 25);
    TrilhasNatureza.prop(c, 3, 224, 117, 67);
    TrilhasNatureza.prop(c, 4, 824, 224, 45);
    TrilhasNatureza.prop(c, 5, 681, 154, 31);
    TrilhasNatureza.prop(c, 6, 790, 430, 47);
    TrilhasNatureza.prop(c, 7, 249, 366, 27);
    // Restos do desmatamento dão lugar às mudas, no próprio terreno.
    for (let i = 0; i < 16; i++) {
      const x = 139 + (i % 5) * 42 + (i % 2) * 9,
        y = 333 + Math.floor(i / 5) * 41;
      const g = health(4, x, y, reduced);
      if (g < 0.65)
        BosqueVegetacao.draw(c, "objetos", 5, x, y, 12 * (1 - g * 0.4));
      if (g > 0.01) P.tree(c, x, y, 30 * g, g, t, i, reduced);
    }
    P.fence(c, [722, 428], [765, 435]);
    P.fence(c, [813, 442], [872, 425]);
    P.fence(c, [722, 428], [723, 461]);
    P.fence(c, [872, 425], [874, 459]);
    for (const [x, y] of [
      [753, 422],
      [842, 428],
    ]) {
      MataArte.draw(c, 8, x, y, 30);
      if (!done.includes(3)) {
        P.line(
          c,
          [
            [x - 12, y],
            [x - 12, y - 20],
            [x + 12, y - 20],
            [x + 12, y],
          ],
          "#a8925b",
          2,
        );
        for (let j = 0; j < 4; j++)
          P.line(
            c,
            [
              [x - 9 + j * 6, y],
              [x - 9 + j * 6, y - 20],
            ],
            "#bba878",
            1.5,
          );
      }
    }
    // Água dinâmica ocupa recortes transparentes; nenhuma pintura de mapa é sobreposta.
    c.globalCompositeOperation = "destination-out";
    c.fillStyle = "#000";
    for (const p of rivers) {
      P.poly(c, p);
      c.fill();
    }
    c.globalCompositeOperation = "source-over";
    for (const p of bridges) P.bridge(c, p);
    c.restore();
    P.smoothPoly(c, coast);
    c.lineWidth = 4;
    c.strokeStyle = "#e4d1a2";
    c.stroke();
  }
  function paint(t, reduced) {
    if (!canvas) return;
    now = t;
    const changing = restoring && performance.now() / 1000 - started < 8;
    if (!layer || dirty || (changing && t - lastBuild > 0.12)) {
      groundLayer(t, reduced);
      dirty = false;
      lastBuild = t;
    }
    VivaArt.canvas(canvas, (c, w, h) => {
      c.save();
      c.scale(w / 1000, h / 563);
      const sea = c.createLinearGradient(0, 0, 0, 563);
      sea.addColorStop(0, "#45b9c2");
      sea.addColorStop(0.5, "#1597ae");
      sea.addColorStop(1, "#207d96");
      c.fillStyle = sea;
      c.fillRect(0, 0, 1000, 563);
      for (let i = 0; i < 38; i++) {
        const x = (i * 171.3 + (reduced ? 0 : t * 3)) % 1000,
          y = (i * 79.1) % 563;
        P.line(
          c,
          [
            [x, y],
            [x + 10 + (i % 4) * 3, y],
          ],
          "#d4f6ee3b",
          1,
        );
      }
      // O mar permanece visível ao redor de toda a costa, sem cortar a ilha.
      c.save();
      P.smoothPoly(c, coast);
      c.clip();
      for (const p of rivers)
        P.water(c, p, health(2, 835, 310, reduced), t, reduced, 8);
      c.restore();
      c.drawImage(layer, 0, 0);
      for (const a of trees) {
        const g = health(a.id, a.x, a.y, reduced);
        if (a.id === 4) {
          if (g > 0.01) P.tree(c, a.x, a.y, a.h * g, g, t, a.seed, reduced);
          else BosqueVegetacao.draw(c, "objetos", 5, a.x, a.y, 10);
        } else P.tree(c, a.x, a.y, a.h, g, t, a.seed, reduced);
      }
      for (const [i, x, y] of [
        [0, 720, 170],
        [1, 861, 121],
        [2, 902, 205],
        [3, 780, 102],
        [4, 826, 190],
      ])
        if (!done.includes(1))
          P.flame(c, x, y, 18 + (i % 2) * 6, reduced ? 0 : t, i);
      if (!done.includes(5) && !reduced)
        for (let i = 0; i < 5; i++) {
          const age = (t * 0.12 + i / 5) % 1;
          P.oval(
            c,
            231 + Math.sin(age * 4 + i) * 18,
            95 - age * 45,
            5 + age * 7,
            7 + age * 10,
            `rgba(74,78,66,${(1 - age) * 0.2})`,
          );
        }
      P.oval(c, 510, 305, 65, 19, "#293b3040");
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5;
        BosqueVegetacao.draw(
          c,
          "objetos",
          4,
          510 + Math.cos(a) * 65,
          305 + Math.sin(a) * 22,
          13,
        );
      }
      P.tree(
        c,
        510,
        300,
        165,
        (done.length / 5) * 0.16 + final * 0.84,
        t,
        810,
        reduced,
      );
      if (hover && !window.VivaFinal?.active && !reduced) {
        const [x, y] = centres[hover - 1];
        c.save();
        c.globalAlpha = 0.1 + Math.sin(t * 2) * 0.025;
        P.oval(c, x, y + 13, 80, 25, "#ffe9aa");
        c.restore();
      }
      c.save();
      P.smoothPoly(c, coast);
      c.strokeStyle = "#d4fff2";
      c.globalAlpha = 0.35 + (reduced ? 0 : Math.sin(t * 0.8) * 0.09);
      c.lineWidth = 2;
      c.stroke();
      c.restore();
      c.restore();
    });
  }
  window.BosqueMapa = {
    update,
    paint,
    health,
    finalGrowth: (amount) => {
      final = P.ease(amount);
    },
    state: () => ({
      renderer: "elementos",
      composition: "ilha-antiga",
      trees: trees.length,
      completed: done,
      restoring,
      finalGrowth: final,
      bitmapReplacements: 0,
      time: now,
    }),
  };
})();
