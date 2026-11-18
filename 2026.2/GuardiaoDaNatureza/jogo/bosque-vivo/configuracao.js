"use strict";
(() => {
  if (!window.GuardiaoFasesJogaveis) return;
  const phases = structuredClone(GuardiaoFasesJogaveis);
  // A turtle starts on the sandy right bank. Fish remain in swimmable water.
  Object.assign(
    phases[2].tasks.find((t) => t.id === "tartaruga"),
    { x: 930, y: 440 },
  );
  for (const id of [2, 3, 4, 5]) {
    const d = phases[id];
    // The new scenes use a forest clearing, not the old island painting's invisible outline.
    d.floor = [
      [20, 45],
      [1260, 45],
      [1260, 692],
      [20, 692],
    ];
    Object.assign(d.obstacles[0], {
      x: 220,
      y: d.obstacles[0].y + d.obstacles[0].ry * 0.4,
      rx: 63,
      ry: 20,
    });
    if (id === 5)
      for (const i of [1, 2])
        Object.assign(d.obstacles[i], {
          y: d.obstacles[i].y + 22,
          rx: 65,
          ry: 20,
        });
    d.trees = [];
    const candidates = [];
    for (let x = 65; x < 1250; x += 57) {
      candidates.push([x, 73], [x + 12, 678]);
    }
    for (let y = 160; y < 630; y += 66)
      candidates.push([55, y], [1230, y + 13]);
    for (const [i, [x, y]] of candidates.entries()) {
      const p = { x, y };
      if (d.water && BosquePintura.inside(p, d.water)) continue;
      if ((d.noWalkWater || []).some((poly) => BosquePintura.inside(p, poly)))
        continue;
      if (
        d.dryBridge &&
        x > d.dryBridge.x - 20 &&
        y > d.dryBridge.y - 30 &&
        y < d.dryBridge.y + d.dryBridge.h + 30
      )
        continue;
      if (
        Math.hypot(x - d.npcPosition.x, y - d.npcPosition.y) < 160 ||
        d.tasks.some((t) => Math.hypot(x - t.x, y - t.y) < 74)
      )
        continue;
      if (
        d.obstacles.some(
          (o) =>
            ((x - o.x) / (o.rx + 25)) ** 2 + ((y - o.y) / (o.ry + 18)) ** 2 < 1,
        )
      )
        continue;
      d.trees.push({ x, y, height: 83 + (i % 4) * 8, seed: i * 13 });
      d.obstacles.push({ ...p, name: "bosque-tronco", rx: 11, ry: 7 });
    }
  }
  window.GuardiaoFasesJogaveis = Object.freeze(phases);
})();
