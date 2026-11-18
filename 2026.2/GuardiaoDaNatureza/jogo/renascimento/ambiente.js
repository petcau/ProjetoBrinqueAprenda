"use strict";
(() => {
  const root = new URL("../../", document.currentScript.src),
    manifest = window.GuardiaoArteManifesto;
  for (const name of ["floresta", "rio", "fauna", "plantio", "cidade"]) {
    const original =
      name === "floresta"
        ? "jogo/floresta-viva/revisao/assets/floresta-ilustrada.png"
        : `jogo/jornada/assets/mapa-${name}.png`;
    manifest[original] = `jogo/renascimento/assets/${name}.webp`;
  }
  class Rebirth {
    constructor(phase) {
      this.phase = phase;
      this.objectives = [];
      this.complete = false;
      this.fullAt = null;
      this.saved = false;
      try {
        this.saved =
          JSON.parse(
            localStorage.getItem(
              phase === 1
                ? "guardiao.floresta-viva.v2"
                : `guardiao.jornada.fase.${phase}.v1`,
            ) || "null",
          )?.completed === true;
      } catch {}
    }
    async load() {
      const d = window.GuardiaoRenascimentoAtlas.arvores;
      this.sheet = d;
      this.dead = new Image();
      this.dead.src = new URL(d.file, root).href;
      try {
        await this.dead.decode();
      } catch {
        this.dead = null;
      }
    }
    update(objectives) {
      this.objectives = objectives;
    }
    recovery(tree, time, reduced) {
      if (this.complete) return 1;
      const near = this.objectives.filter(
        (p) => Math.hypot(p.x - tree.x, p.y - tree.y) < 190,
      );
      if (!near.length) return 0;
      return reduced
        ? 1
        : Math.max(
            ...near.map((p) =>
              Math.max(0, Math.min(1, (time - (p.restoredAt ?? -4)) / 2.5)),
            ),
          );
    }
    ashLeaf(ctx, x, y, size, angle) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = "#ab8055";
      ctx.globalAlpha *= 0.65;
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.45, size * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#6b5543";
      ctx.lineWidth = 0.65;
      ctx.beginPath();
      ctx.moveTo(-size * 0.45, 0);
      ctx.lineTo(size * 0.55, 0);
      ctx.stroke();
      ctx.restore();
    }
    drawDead(ctx, tree) {
      if (!this.dead) return;
      const s = this.sheet,
        f = s.frames[(tree.frame || 0) % s.frames.length],
        b = f.bounds,
        k = tree.h / s.referenceHeight;
      ctx.drawImage(
        this.dead,
        ...b,
        (b[0] - f.pivot[0]) * k,
        (b[1] - f.pivot[1]) * k,
        b[2] * k,
        b[3] * k,
      );
    }
    full(ctx, healthy, reduced, completed) {
      this.complete = completed;
      if (!completed) return;
      if (this.fullAt === null) this.fullAt = performance.now();
      const progress =
        reduced || this.saved
          ? 1
          : Math.min(1, (performance.now() - this.fullAt) / 2100);
      ctx.save();
      ctx.globalAlpha = progress;
      ctx.drawImage(healthy, 0, 0, 1280, 720);
      ctx.restore();
    }
  }
  window.GuardiaoRenascimento = Rebirth;
})();
