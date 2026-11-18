"use strict";
(() => {
  const base = new URL("./assets/", document.currentScript.src);
  const original = window.GuardiaoArteManifesto;
  // The new paintings preserve the geography and the original source files.
  for (const [source, target] of [
    [
      "jogo/floresta-viva/revisao/assets/floresta-ilustrada.png",
      "floresta-inicio",
    ],
    [
      "jogo/floresta-viva/revisao/assets/floresta-restaurada.png",
      "floresta-restaurado",
    ],
    ...["rio", "fauna", "plantio", "cidade"].flatMap((name) => [
      [`jogo/jornada/assets/mapa-${name}.png`, name + "-inicio"],
      [`jogo/jornada/assets/mapa-${name}-restaurado.png`, name + "-restaurado"],
    ]),
  ])
    original[source] = `jogo/vida-natural/assets/${target}.webp`;

  class NatureLife {
    constructor(phase) {
      this.phase = phase;
      this.rebirth = window.GuardiaoRenascimento
        ? new window.GuardiaoRenascimento(phase)
        : null;
      this.water =
        phase === 1 && window.GuardiaoAgua ? new window.GuardiaoAgua() : null;
      this.images = new Map();
      this.trails = [];
      this.lastStep = 0;
      this.patches = new Map();
      this.treeFades = new Map();
    }
    async load(onProgress = () => {}) {
      const names = [
        "kai-andando",
        "flora",
        ...(this.phase === 1 ? ["kai-mangueira", "fogo"] : []),
      ];
      await Promise.all(
        names.map(async (name) => {
          const d = window.GuardiaoVidaAtlas[name],
            im = new Image();
          im.src = new URL(d.file, base).href;
          await im.decode();
          if (im.naturalWidth !== d.width || im.naturalHeight !== d.height)
            throw Error("Arte natural inválida: " + name);
          this.images.set(name, im);
          onProgress();
        }),
      );
      if (this.water) await this.water.load();
      if (this.rebirth) await this.rebirth.load();
      this.canopyShadow = new Image();
      this.canopyShadow.src = new URL("sombra-copa.svg", base).href;
      await this.canopyShadow.decode();
      onProgress();
    }
    draw(ctx, name, index, x, y, height, { flip = false, angle = 0 } = {}) {
      const sheet = window.GuardiaoVidaAtlas[name],
        image = this.images.get(name);
      if (!sheet || !image) return;
      const frame = sheet.frames[index % sheet.frames.length],
        b = frame.bounds;
      const scale = height / sheet.referenceHeight;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      if (flip) ctx.scale(-1, 1);
      ctx.drawImage(
        image,
        ...b,
        (b[0] - frame.pivot[0]) * scale,
        (b[1] - frame.pivot[1]) * scale,
        b[2] * scale,
        b[3] * scale,
      );
      ctx.restore();
    }
    walk(ctx, player, time, reduced, equipped = false, height = 63) {
      const frame =
        player.direction * 4 + (Math.floor(player.distance / 14) % 4);
      this.draw(
        ctx,
        equipped ? "kai-mangueira" : "kai-andando",
        frame,
        player.x,
        player.y -
          (reduced
            ? 0
            : Math.abs(Math.sin((player.distance * Math.PI) / 28)) * 0.7),
        height,
      );
      document.body.dataset.motionFrame = String(frame);
    }
    flora(ctx, flora, player, time, reduced) {
      let frame,
        height = 42;
      if (flora.mode === "ombro") {
        frame = !reduced && time % 4.8 > 4.55 ? 13 : 12;
        height = 30;
      } else if (flora.mode === "pousando") {
        frame =
          8 +
          Math.min(
            3,
            Math.floor((flora.elapsed / (this.phase === 1 ? 0.45 : 0.65)) * 4),
          );
        height = 36;
      } else if (flora.mode === "decolando") {
        frame = 11 - Math.min(3, Math.floor((flora.elapsed / 0.3) * 4));
        height = 36 + Math.min(1, flora.elapsed / 0.3) * 6;
      } else if (flora.mode === "comemorando") {
        frame = reduced ? 14 : 14 + (Math.floor(time * 5) % 2);
        height = 46;
      } else frame = reduced ? 2 : Math.floor(time * 14) % 8;
      this.draw(
        ctx,
        "flora",
        frame,
        flora.x,
        flora.y +
          (reduced || flora.mode === "ombro" ? 0 : Math.sin(time * 5) * 1.2),
        height,
        { flip: player.direction >= 3 && player.direction <= 5 },
      );
      document.body.dataset.floraFrame = String(frame);
    }
    ground(ctx, player, time, reduced, swimming = false) {
      this.player = player;
      if (reduced) {
        this.trails.length = 0;
        this.lastStep = player.distance;
        return;
      }
      if (this.canopyShadow) {
        for (const [x, y, size] of [
          [225, 390, 170],
          [875, 345, 210],
          [1060, 595, 160],
        ]) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(Math.sin(time * 0.7 + x) * 0.025);
          ctx.drawImage(
            this.canopyShadow,
            -size / 2,
            -size * 0.28,
            size,
            size * 0.65,
          );
          ctx.restore();
        }
      }
      if (player.moving && player.distance - this.lastStep > 14) {
        this.lastStep = player.distance;
        this.trails.push({
          x: player.x,
          y: player.y,
          time,
          swimming,
          side: this.trails.length % 2 ? 1 : -1,
        });
        if (this.trails.length > 24) this.trails.shift();
      }
      this.trails = this.trails.filter((p) => time - p.time < 0.8);
      for (const p of this.trails) {
        const age = (time - p.time) / 0.8;
        ctx.save();
        ctx.globalAlpha = (1 - age) * (p.swimming ? 0.6 : 0.17);
        if (p.swimming) {
          ctx.strokeStyle = "#e0fbff";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, 9 + age * 16, 3 + age * 5, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = "#9e7850";
          ctx.beginPath();
          ctx.ellipse(
            p.x + p.side * 4,
            p.y,
            2.2 + age,
            1.2,
            -0.4 * p.side,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
        ctx.restore();
      }
      // Sparse drifting pollen, without covering the path or the mission markers.
      for (let i = 0; i < 16; i++) {
        const x = (i * 173.3 + time * (3 + (i % 3))) % 1280;
        const y = (i * 97.7 + Math.sin(time * 0.4 + i) * 16 + 720) % 720;
        ctx.fillStyle = `rgba(255,244,180,${0.25 + Math.sin(time + i) * 0.12})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    fire(ctx, f, time, reduced) {
      if (!f.life) return;
      const glow = ctx.createRadialGradient(
        f.x,
        f.y - 12,
        3,
        f.x,
        f.y - 12,
        51,
      );
      glow.addColorStop(0, "#ffb03c44");
      glow.addColorStop(1, "#ffb03c00");
      ctx.fillStyle = glow;
      ctx.fillRect(f.x - 51, f.y - 63, 102, 102);
      this.draw(
        ctx,
        "fogo",
        reduced ? 0 : (Math.floor(time * 13) + f.id * 3) % 8,
        f.x,
        f.y,
        76 * (0.6 + f.life * 0.4),
      );
      if (reduced) return;
      for (let j = 0; j < 4; j++) {
        const age = (time * 0.55 + j * 0.25 + f.id * 0.13) % 1;
        ctx.fillStyle = `rgba(255,198,82,${(1 - age) * 0.7})`;
        ctx.beginPath();
        ctx.arc(
          f.x + Math.sin(j * 7 + time) * (6 + age * 10),
          f.y - 28 - age * 65,
          1.3 * (1 - age),
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
    jet(ctx, from, to, time, reduced, options) {
      return this.water?.draw(ctx, from, to, time, reduced, options) ?? -1;
    }
    recovery(ctx, objectives, time, reduced) {
      if (reduced) return;
      for (const p of objectives) {
        const age = time - p.restoredAt;
        if (!(age >= 0 && age < 2.8)) continue;
        ctx.save();
        ctx.globalAlpha = Math.min(1, age * 3) * (1 - age / 2.8);
        ctx.strokeStyle = "#d7efb1";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(
          p.x,
          p.y - 4,
          20 + age * 31,
          8 + age * 12,
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
        for (let j = 0; j < 7; j++) {
          const a = (j * Math.PI * 2) / 7 + age * 0.4;
          ctx.fillStyle = j % 2 ? "#fff1a3" : "#afdc70";
          ctx.beginPath();
          ctx.ellipse(
            p.x + Math.cos(a) * age * 20,
            p.y - 15 - age * 16 + Math.sin(a) * age * 9,
            3,
            1.5,
            a,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
        ctx.restore();
      }
    }
    restore(ctx, healthy, objectives, time, reduced) {
      this.rebirth?.update(objectives);
      for (const p of objectives) {
        const key = p.x + ":" + p.y;
        const rx = p.rx || 95,
          ry = p.ry || 85,
          y = p.y - 15;
        if (!this.patches.has(key)) {
          const patch = document.createElement("canvas");
          patch.width = Math.ceil(rx * 2);
          patch.height = Math.ceil(ry * 2);
          const c = patch.getContext("2d");
          const sx = healthy.naturalWidth / 1280,
            sy = healthy.naturalHeight / 720;
          c.drawImage(
            healthy,
            (p.x - rx) * sx,
            (y - ry) * sy,
            rx * 2 * sx,
            ry * 2 * sy,
            0,
            0,
            rx * 2,
            ry * 2,
          );
          c.globalCompositeOperation = "destination-in";
          c.translate(rx, ry);
          c.scale(rx, ry);
          const fade = c.createRadialGradient(0, 0, 0.65, 0, 0, 1);
          fade.addColorStop(0, "#fff");
          fade.addColorStop(1, "#fff0");
          c.fillStyle = fade;
          c.fillRect(-1, -1, 2, 2);
          this.patches.set(key, patch);
        }
        const progress = reduced
          ? 1
          : Math.min(1, Math.max(0, (time - (p.restoredAt ?? -3)) / 2.5));
        ctx.save();
        ctx.globalAlpha = 1 - (1 - progress) ** 3;
        ctx.drawImage(this.patches.get(key), p.x - rx, y - ry, rx * 2, ry * 2);
        ctx.restore();
      }
    }
    treeOpacity(tree, time, reduced) {
      const p = this.player;
      if (!p) return 1;
      const under =
        p.y < tree.y - 8 &&
        p.y > tree.y - tree.h * 0.75 &&
        Math.abs(p.x - tree.x) < tree.h * 0.3;
      const target = under ? 0.35 : 1;
      const state = this.treeFades.get(tree) || { value: 1, time };
      state.value +=
        (target - state.value) *
        (reduced ? 1 : 1 - Math.exp(-Math.max(0, time - state.time) * 9));
      state.time = time;
      this.treeFades.set(tree, state);
      return state.value;
    }
  }
  window.GuardiaoVidaNatural = NatureLife;
})();
