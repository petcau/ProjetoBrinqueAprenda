"use strict";
(() => {
  const base = new URL("./", document.currentScript.src);
  const atlas = window.GuardiaoAguaAtlas;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  class Water {
    constructor() {
      this.image = null;
      this.active = false;
      this.age = 0;
      this.last = null;
      this.frame = 0;
      this.impact = false;
    }
    async load() {
      const image = new Image();
      image.src = new URL(atlas.file, base).href;
      try {
        await image.decode();
        if (
          image.naturalWidth !== atlas.width ||
          image.naturalHeight !== atlas.height
        )
          throw Error("Prancha de água inválida");
        this.image = image;
      } catch {
        // Keep a functional water effect if the decorative image cannot load.
        this.image = null;
      }
    }
    nozzle(player, time, reduced = false) {
      const d = player.direction;
      const index = player.moving
        ? d * 4 + (Math.floor(player.distance / 14) % 4)
        : d * 2 + (!reduced && time % 3.8 > 3.45 ? 1 : 0);
      const p = atlas.anchors[player.moving ? "walk" : "idle"][index];
      const scale =
        player.moving || reduced ? 1 : (63 + Math.sin(time * 2) * 0.35) / 63;
      const bob =
        player.moving && !reduced
          ? Math.abs(Math.sin((player.distance * Math.PI) / 28)) * 0.7
          : 0;
      return { x: player.x + p[0] * scale, y: player.y + p[1] * scale - bob };
    }
    stop() {
      this.active = false;
      this.last = null;
      this.age = 0;
      this.impact = false;
    }
    draw(ctx, from, to, time, reduced = false, { contact = false } = {}) {
      const dx = to.x - from.x,
        dy = to.y - from.y,
        length = Math.hypot(dx, dy);
      if (
        ![from.x, from.y, to.x, to.y, time].every(Number.isFinite) ||
        length < 1
      ) {
        this.stop();
        return -1;
      }
      if (this.last !== null) this.age += clamp(time - this.last, 0, 0.05);
      this.active = true;
      this.last = time;
      this.frame = reduced
        ? 2
        : Math.floor(time * atlas.fps) % atlas.streams.length;
      this.impact = contact;
      const pressure = reduced ? 1 : 0.45 + 0.55 * Math.min(1, this.age / 0.16);
      const angle = Math.atan2(dy, dx);
      const width = clamp(12 + length * 0.035, 14, 20) * pressure;
      ctx.save();
      ctx.translate(from.x, from.y);
      ctx.rotate(angle);
      if (this.image) {
        const f = atlas.streams[this.frame],
          b = f.bounds;
        const kx = length / (f.end[0] - f.inlet[0]),
          ky = width / f.bodyHeight;
        ctx.globalAlpha *= 0.92;
        ctx.drawImage(
          this.image,
          ...b,
          (b[0] - f.inlet[0]) * kx,
          (b[1] - f.inlet[1]) * ky,
          b[2] * kx,
          b[3] * ky,
        );
      } else this.fallback(ctx, length, width, time, reduced);
      // A short coherent inlet joins the narrow painted stream to the nozzle.
      ctx.fillStyle = "#b7f0f8";
      ctx.beginPath();
      ctx.moveTo(-0.5, -1.3);
      ctx.quadraticCurveTo(4, -1.8, 9, -1);
      ctx.lineTo(9, 1);
      ctx.quadraticCurveTo(4, 1.7, -0.5, 1.3);
      ctx.closePath();
      ctx.fill();
      if (!reduced) {
        // Bounded particle count; all drops travel with the direction of water.
        for (let i = 0; i < 9; i++) {
          const t = (time * 1.7 + i / 9) % 1;
          const side = Math.sin(i * 7.1) * (2 + t * width * 0.45);
          ctx.save();
          ctx.translate(2 + t * length, side);
          ctx.globalAlpha *= 0.65 * (1 - t * 0.5);
          ctx.fillStyle = i % 3 ? "#d8f9ff" : "#75def7";
          ctx.beginPath();
          ctx.ellipse(0, 0, 2.2 + t * 1.4, 0.6 + t * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      ctx.restore();
      if (contact) this.splash(ctx, to, time, reduced, pressure);
      return this.frame;
    }
    fallback(ctx, length, width, time, reduced) {
      const gradient = ctx.createLinearGradient(0, -width / 2, 0, width / 2);
      gradient.addColorStop(0, "#78d7f680");
      gradient.addColorStop(0.45, "#d9f9ffed");
      gradient.addColorStop(1, "#37b8e69c");
      const wobble = reduced ? 0 : Math.sin(time * 16) * 1.3;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, -1.5);
      ctx.bezierCurveTo(
        length * 0.4,
        -3 + wobble,
        length * 0.8,
        -width * 0.5,
        length,
        -width * 0.35,
      );
      ctx.lineTo(length, width * 0.35);
      ctx.bezierCurveTo(
        length * 0.8,
        width * 0.5,
        length * 0.3,
        3 + wobble,
        0,
        1.5,
      );
      ctx.closePath();
      ctx.fill();
    }
    splash(ctx, to, time, reduced, pressure) {
      const f = atlas.splashes[reduced ? 3 : (this.frame + 3) % 8],
        b = f.bounds;
      ctx.save();
      ctx.translate(to.x, to.y + 4);
      ctx.globalAlpha *= 0.85;
      if (this.image) {
        const k = (31 + pressure * 5) / b[2];
        ctx.drawImage(
          this.image,
          ...b,
          (b[0] - f.pivot[0]) * k,
          (b[1] - f.pivot[1]) * k,
          b[2] * k,
          b[3] * k,
        );
      }
      if (!this.image) {
        ctx.fillStyle = "#b7eff5aa";
        ctx.beginPath();
        ctx.ellipse(0, 0, 13, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduced)
        for (let i = 0; i < 6; i++) {
          const age = (time * 1.45 + i / 6) % 1;
          const spread = Math.sin(i * 2.399) * (7 + age * 16);
          const y = -4 - Math.sin(age * Math.PI) * 16 + age * 10;
          ctx.fillStyle = i % 2 ? "#c9f5ff" : "#6fd5ef";
          ctx.globalAlpha = (1 - age) * 0.7;
          ctx.beginPath();
          ctx.ellipse(spread, y, 1, 1.7, spread * -0.025, 0, Math.PI * 2);
          ctx.fill();
        }
      ctx.restore();
    }
    state() {
      return {
        active: this.active,
        frame: this.frame,
        impact: this.impact,
        age: this.age,
        sprites: !!this.image,
      };
    }
  }
  window.GuardiaoAgua = Water;
})();
