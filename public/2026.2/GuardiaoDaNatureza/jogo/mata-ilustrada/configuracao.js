"use strict";
(() => {
  if (!window.GuardiaoFasesJogaveis) return;
  const phases = structuredClone(GuardiaoFasesJogaveis);
  for (const id of [2, 3, 4, 5]) {
    const d = phases[id];
    // Construções maiores com colisão apenas na base das paredes.
    Object.assign(d.obstacles[0], { rx: 100, ry: 28 });
    if (id === 5) {
      Object.assign(d.obstacles[0], { y: 205 });
      Object.assign(d.obstacles[1], { y: 235, rx: 95, ry: 27 });
      Object.assign(d.obstacles[2], { rx: 95, ry: 27 });
      Object.assign(
        d.tasks.find((t) => t.id === "solar1"),
        { x: 852, y: 295 },
      );
    }
    // Bosques irregulares no interior da clareira. Cada raiz tem um colisor real.
    const random = BosquePintura.random(932 + id);
    const distanceToSegment = (p, a, b) => {
      const dx = b[0] - a[0],
        dy = b[1] - a[1],
        n = dx * dx + dy * dy;
      const t = n
        ? Math.max(0, Math.min(1, ((p.x - a[0]) * dx + (p.y - a[1]) * dy) / n))
        : 0;
      return Math.hypot(p.x - a[0] - t * dx, p.y - a[1] - t * dy);
    };
    const initialNav = new GuardiaoNavegacao.Navigation({
      ...d,
      obstacles: [...d.obstacles, { ...d.npcPosition, rx: 12, ry: 9 }],
    });
    let added = 0;
    for (
      let i = 0;
      i < 450 && added < (id === 2 ? 13 : id === 5 ? 10 : 22);
      i++
    ) {
      const p = { x: 125 + random() * 1010, y: 140 + random() * 470 };
      if (
        !initialNav.walkable(p, 30) ||
        Math.hypot(p.x - d.npcPosition.x, p.y - d.npcPosition.y) < 155
      )
        continue;
      if (d.tasks.some((t) => Math.hypot(t.x - p.x, t.y - p.y) < 85)) continue;
      if (d.trees.some((t) => Math.hypot(t.x - p.x, t.y - p.y) < 59)) continue;
      if (
        MataLayout.landmarksFor(id).some(
          (t) => Math.hypot(t.x - p.x, t.y - p.y) < 58,
        )
      )
        continue;
      if (
        MataLayout.paths[id].some((path) =>
          path.slice(1).some((b, j) => distanceToSegment(p, path[j], b) < 48),
        )
      )
        continue;
      const root = { ...p, height: 108 + random() * 18, seed: 200 + i };
      d.trees.push(root);
      d.obstacles.push({ ...p, name: "mata-tronco", rx: 12, ry: 8 });
      added++;
    }
    const nav = new GuardiaoNavegacao.Navigation({
      ...d,
      obstacles: [...d.obstacles, { ...d.npcPosition, rx: 12, ry: 9 }],
    });
    d.landmarks = MataLayout.landmarksFor(id).filter(
      (p) =>
        MataLayout.awayFromGoals(p, d) &&
        nav.walkable(p, Math.max(p.rx, p.ry) + 8) &&
        Math.hypot(p.x - d.start.x, p.y - d.start.y) > p.rx + 20,
    );
    for (const p of d.landmarks)
      d.obstacles.push({ name: p.id, x: p.x, y: p.y, rx: p.rx, ry: p.ry });
  }
  window.GuardiaoFasesJogaveis = Object.freeze(phases);
})();
