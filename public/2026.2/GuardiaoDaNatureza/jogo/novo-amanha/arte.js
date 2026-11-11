"use strict";
(() => {
  const base = new URL("./", document.currentScript.src),
    atlas = window.GuardiaoAmanhaAtlas;
  class AdventureArt {
    constructor(phase) {
      this.phase = phase;
      this.images = new Map();
      this.water = null;
      this.loading = new Map();
      window.GuardiaoIcones.load()
        .then((im) => (this.iconImage = im))
        .catch(() => {});
    }
    async ensure(name) {
      if (this.images.has(name)) return;
      if (!this.loading.has(name))
        this.loading.set(
          name,
          (async () => {
            const d = atlas[name];
            if (!d) throw Error("Prancha ausente: " + name);
            const im = new Image();
            im.src = new URL(d.file, base).href;
            await im.decode();
            if (im.naturalWidth !== d.width || im.naturalHeight !== d.height)
              throw Error("Prancha incompatível: " + name);
            this.images.set(name, im);
          })(),
        );
      return this.loading.get(name);
    }
    async load() {
      const selected = window.GuardiaoMemoria.read().uniform;
      const outfit = {
        protecao: "traje-andar",
        resgate: "uniforme-resgate",
        plantio: "uniforme-plantio",
        voluntario: "uniforme-voluntario",
      };
      const role = {
        3: "uniforme-resgate",
        4: "uniforme-plantio",
        5: "uniforme-voluntario",
      }[this.phase];
      const list = [
        "moradores",
        ...(this.phase === 2
          ? ["traje-andar", "traje-nadar", "traje-acoes"]
          : []),
        ...([3, 6].includes(this.phase) ? ["fauna-brasileira"] : []),
        ...(role ? [role] : []),
        ...(this.phase === 6
          ? ["reencontros"]
          : outfit[selected]
            ? [outfit[selected]]
            : []),
      ];
      await Promise.all([...new Set(list)].map((name) => this.ensure(name)));
    }
    draw(ctx, name, index, x, y, height, { flip = false, alpha = 1 } = {}) {
      const d = atlas[name],
        im = this.images.get(name);
      if (!d || !im) return false;
      const f = d.frames[index % d.frames.length],
        b = f.bounds,
        k = height / d.referenceHeight;
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.translate(x, y);
      if (flip) ctx.scale(-1, 1);
      ctx.drawImage(
        im,
        ...b,
        (b[0] - f.pivot[0]) * k,
        (b[1] - f.pivot[1]) * k,
        b[2] * k,
        b[3] * k,
      );
      ctx.restore();
      return true;
    }
    outfit(ctx, player, time, reduced, height = 63) {
      const current = window.GuardiaoMemoria.read().uniform,
        name = {
          protecao: "traje-andar",
          resgate: "uniforme-resgate",
          plantio: "uniforme-plantio",
          voluntario: "uniforme-voluntario",
        }[current];
      if (!name) return false;
      if (!this.images.has(name)) {
        this.ensure(name).catch(() => {});
        return false;
      }
      const f =
        player.direction * 2 +
        (player.moving && !reduced ? Math.floor(player.distance / 15) % 2 : 0);
      return this.draw(ctx, name, f, player.x, player.y, height);
    }
    river(
      ctx,
      player,
      time,
      reduced,
      { kind = null, progress = 0, dressing = false } = {},
    ) {
      const swimming = player.swimming && !dressing;
      const name =
          dressing || kind
            ? "traje-acoes"
            : swimming
              ? "traje-nadar"
              : "traje-andar",
        row = dressing ? 0 : kind === "turtle" ? 12 : kind === "fish" ? 8 : 4,
        frame =
          dressing || kind
            ? row + Math.min(3, Math.floor(progress * 4))
            : player.direction * 2 +
              (!reduced && player.moving ? Math.floor(time * 7) % 2 : 0),
        h = swimming ? 55 : 63;
      if (swimming) {
        const d = atlas[name],
          f = d.frames[frame],
          k = h / d.referenceHeight;
        const head = f.head || [
          f.bounds[0] + f.bounds[2] * 0.5,
          f.bounds[1] + f.bounds[3] * 0.23,
        ];
        const drawX = player.x - (head[0] - f.pivot[0]) * k;
        const drawY = player.y - 26 - (head[1] - f.pivot[1]) * k;
        // The full prone body stays visible beneath the water. Only the head and visor emerge.
        this.draw(ctx, name, frame, drawX, drawY, h, { alpha: 0.62 });
        ctx.save();
        ctx.beginPath();
        const radius = f.headRadius || [70, 75];
        ctx.ellipse(
          player.x,
          player.y - 26,
          Math.max(10, radius[0] * k),
          Math.max(12, radius[1] * k),
          0,
          0,
          Math.PI * 2,
        );
        ctx.clip();
        this.draw(ctx, name, frame, drawX, drawY, h);
        ctx.restore();
        ctx.strokeStyle = "#d6f7e5b8";
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.ellipse(
          player.x,
          player.y - 8,
          25 + Math.sin(time * 4) * 2,
          6,
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      } else this.draw(ctx, name, frame, player.x, player.y, h);
      document.body.dataset.riverPose = name + ":" + frame;
      return name + ":" + frame;
    }
    animal(
      ctx,
      t,
      time,
      reduced,
      x = t.position.x,
      y = t.position.y,
      height = 36,
    ) {
      const row = { capivara: 0, mico: 1, tucano: 2, passaro: 3 }[t.speciesKey];
      if (row === undefined) return false;
      const pending = t.status === "pending",
        frame =
          row * 4 +
          (pending
            ? !reduced && time % 4.3 > 4.05
              ? 1
              : 0
            : 2 + (!reduced ? Math.floor(time * 6) % 2 : 0));
      return this.draw(ctx, "fauna-brasileira", frame, x, y, height, {
        flip: t.facingRight === false,
      });
    }
    community(
      ctx,
      time,
      reduced,
      ratio,
      { transport = false, bus = false, epilogue = false } = {},
    ) {
      const active = ratio >= 0.2 || epilogue,
        step = reduced ? 0 : Math.floor(time * 5) % 2,
        positions =
          this.phase === 5
            ? [
                [555, 430],
                [735, 513],
                [550, 368],
                [868, 430],
              ]
            : [
                [350, 285],
                [445, 255],
                [340, 315],
                [475, 285],
              ];
      if (this.phase !== 5 && !epilogue && ratio < 0.45) return;
      const rows = this.phase === 5 ? [0, 1, 2, 3] : [1, 3];
      for (const row of rows) {
        const [px, py] = positions[row],
          x = row === 2 && transport ? 400 + ((time * 27) % 440) : px,
          y = py + (!reduced && active ? Math.sin(time * 2 + row) * 0.6 : 0),
          f =
            row * 4 +
            ((row === 2 ? transport : active)
              ? 2 + step
              : !reduced && time % 4.5 > 4.2
                ? 1
                : 0);
        this.draw(
          ctx,
          "moradores",
          f,
          x,
          y,
          row === 0 ? 40 : row === 1 ? 43 : row === 2 ? 52 : 58,
        );
      }
      if (this.phase === 5 && transport) {
        ctx.save();
        ctx.strokeStyle = "#7aaf88";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(390, 389);
        ctx.lineTo(900, 389);
        ctx.stroke();
        ctx.strokeStyle = "#f4e8b4";
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 8]);
        ctx.stroke();
        ctx.restore();
      }
      if (this.phase === 5 && bus) {
        const x = 625 + (reduced ? 0 : Math.sin(time * 0.2) * 230);

        if (this.iconImage)
          window.GuardiaoIcones.paint(ctx, this.iconImage, "bus", x, 573, 56);
      }
    }
  }
  window.GuardiaoAdventureArt = AdventureArt;
})();
