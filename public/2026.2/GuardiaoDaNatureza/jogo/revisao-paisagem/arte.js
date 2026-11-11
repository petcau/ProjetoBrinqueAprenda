"use strict";
(() => {
  const Previous = window.GuardiaoAdventureArt;
  const base = new URL("../vida-em-equilibrio/", document.currentScript.src);
  const localBase = new URL("./", document.currentScript.src);
  const own = {
    ...window.GuardiaoEquilibrioAtlas,
    ...(window.GuardiaoPlantasAtlas
      ? { plantas: window.GuardiaoPlantasAtlas }
      : {}),
  };
  class Art extends Previous {
    constructor(phase) {
      super(phase);
      this.drawings = new Map();
    }
    async ensure(name) {
      if (!own[name]) return super.ensure(name);
      if (this.images.has(name)) return;
      if (!this.loading.has(name))
        this.loading.set(
          name,
          (async () => {
            const d = own[name],
              im = new Image();
            im.src = new URL(
              d.file,
              name === "plantas" ? localBase : base,
            ).href;
            await im.decode();
            if (im.naturalWidth !== d.width || im.naturalHeight !== d.height)
              throw Error("Prancha incompatível: " + name);
            this.images.set(name, im);
          })(),
        );
      return this.loading.get(name);
    }
    async drawing(name, markup) {
      const im = new Image();
      im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(markup);
      await im.decode();
      this.drawings.set(name, im);
    }
    async load() {
      await super.load();
      await Promise.all(
        (this.phase === 2
          ? ["vida-rio", "kai-acoes"]
          : this.phase === 3 || this.phase === 6
            ? ["fauna-grande", "fauna-copa", "vida-rio"]
            : this.phase === 5
              ? ["kai-acoes"]
              : []
        ).map((n) => this.ensure(n)),
      );
      if (this.phase === 4) await this.ensure("plantas");
      if (this.phase === 5)
        await Promise.all(
          ["recyclable", "organic", "residual"].map((n) =>
            this.drawing(n, GuardiaoColecao.bin(n)),
          ),
        );
    }
    draw(ctx, name, index, x, y, height, { flip = false, alpha = 1 } = {}) {
      if (!own[name])
        return super.draw(ctx, name, index, x, y, height, { flip, alpha });
      const d = own[name],
        im = this.images.get(name);
      if (!im) return false;
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
      const name = {
        3: "uniforme-resgate",
        4: "uniforme-plantio",
        5: "uniforme-voluntario",
      }[this.phase];
      if (!name) return false;
      const frame =
        player.direction * 2 +
        (player.moving && !reduced ? Math.floor(player.distance / 15) % 2 : 0);
      return this.draw(ctx, name, frame, player.x, player.y, height);
    }
    river(ctx, player, time, reduced, options = {}) {
      // Directions use -atan2: six points south, two points north.
      if (
        !player.swimming ||
        options.dressing ||
        options.kind ||
        ![5, 6, 7].includes(player.direction)
      )
        return super.river(ctx, player, time, reduced, options);
      const name = "kai-acoes",
        index = reduced || !player.moving ? 0 : Math.floor(time * 9) % 8;
      const d = own[name],
        f = d.frames[index],
        h = 55,
        k = h / d.referenceHeight;
      const head = f.head,
        drawX = player.x - (head[0] - f.pivot[0]) * k,
        drawY = player.y - 26 - (head[1] - f.pivot[1]) * k;
      this.draw(ctx, name, index, drawX, drawY, h, { alpha: 0.62 });
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        player.x,
        player.y - 26,
        Math.max(11, f.headRadius[0] * k),
        Math.max(13, f.headRadius[1] * k),
        0,
        0,
        Math.PI * 2,
      );
      ctx.clip();
      this.draw(ctx, name, index, drawX, drawY, h);
      ctx.restore();
      ctx.strokeStyle = "#ddfff0b0";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(
        player.x,
        player.y - 7,
        23 + (reduced ? 0 : Math.sin(time * 5) * 2),
        6,
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      document.body.dataset.riverPose = "kai-nadando-baixo:" + index;
      return "kai-nadando-baixo:" + index;
    }
    solar(ctx, player, progress) {
      return this.draw(
        ctx,
        "kai-acoes",
        8 + Math.min(3, Math.floor(progress * 4)),
        player.x + 13,
        player.y + 5,
        69,
      );
    }
    riverAnimal(
      ctx,
      t,
      time,
      reduced,
      x = t.position.x,
      y = t.position.y,
      height = 32,
    ) {
      const row = t.type === "turtle" ? 2 : t.id === "peixes2" ? 1 : 0,
        pending = t.status === "pending";
      const f =
        row * 4 +
        (pending
          ? !reduced && time % 4.5 > 4.2
            ? 1
            : 0
          : 2 + (!reduced ? Math.floor(time * 5) % 2 : 0));
      return this.draw(ctx, "vida-rio", f, x, y, height, {
        flip: t.facingRight === false,
      });
    }
    animal(
      ctx,
      t,
      time,
      reduced,
      x = t.position.x,
      y = t.position.y,
      height = 38,
    ) {
      const spec = {
        onca: ["fauna-grande", 0],
        tamandua: ["fauna-grande", 1],
        anta: ["fauna-grande", 2],
        arara: ["fauna-copa", 0],
        preguica: ["fauna-copa", 1],
      }[t.speciesKey];
      if (!spec) return super.animal(ctx, t, time, reduced, x, y, height);
      const pending = t.status === "pending",
        frame =
          spec[1] * 4 +
          (pending
            ? !reduced && time % 4.2 > 3.9
              ? 1
              : 0
            : 2 +
              (!reduced
                ? Math.floor(time * (t.speciesKey === "preguica" ? 1.4 : 5)) % 2
                : 0));
      return this.draw(ctx, spec[0], frame, x, y, height, {
        flip: t.facingRight === false,
      });
    }
    plant(ctx, name, x, y, height, time, reduced) {
      const row = { ipê: 0, ingá: 1, aroeira: 2 }[name] ?? 0;
      const step =
        height < 27
          ? 0
          : height < 50
            ? 1
            : 2 + (!reduced ? Math.floor(time * 1.7) % 2 : 0);
      this.draw(ctx, "plantas", row * 4 + step, x, y, height);
    }
    residual(ctx, t) {
      if (t.type !== "recycle" || t.material !== "residual") return false;
      ctx.save();
      ctx.translate(t.x, t.y - 7);
      ctx.rotate(t.id === "reciclavel5" ? 0.15 : -0.16);
      if (t.id === "reciclavel5") {
        const g = ctx.createLinearGradient(-10, -6, 10, 6);
        g.addColorStop(0, "#aac086");
        g.addColorStop(1, "#65744b");
        ctx.fillStyle = g;
        ctx.strokeStyle = "#536046";
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.roundRect(-11, -6, 22, 13, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#4b5b3c";
        for (const [x, y, r] of [
          [-7, -2, 1.2],
          [-2, 2, 1.5],
          [4, -2, 1.5],
          [7, 3, 1],
          [-7, 3, 0.8],
        ]) {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = "#dfd2ad";
        ctx.strokeStyle = "#84745a";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-9, -11);
        ctx.lineTo(5, -10);
        ctx.lineTo(10, -5);
        ctx.lineTo(8, 10);
        ctx.lineTo(-10, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#968862";
        for (const [x, y, rx, ry] of [
          [-3, -4, 4, 2],
          [3, 4, 3, 2],
          [-5, 5, 2, 1],
        ]) {
          ctx.beginPath();
          ctx.ellipse(x, y, rx, ry, 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      return true;
    }
    bins(ctx, station) {
      const kinds = ["recyclable", "organic", "residual"],
        labels = ["Recicláveis", "Orgânicos", "Rejeitos"];
      for (let i = 0; i < 3; i++) {
        const x = station.x - 74 + i * 74,
          im = this.drawings.get(kinds[i]);
        if (im) ctx.drawImage(im, x - 29, station.y - 64, 58, 64);
        ctx.fillStyle = "#fff3d7";
        ctx.strokeStyle = "#364a3a";
        ctx.lineWidth = 3;
        ctx.font = "bold 10px system-ui";
        ctx.textAlign = "center";
        ctx.strokeText(labels[i], x, station.y + 12);
        ctx.fillText(labels[i], x, station.y + 12);
      }
    }
    energy(ctx, x, y, time, reduced) {
      ctx.strokeStyle = "#f7dd85";
      ctx.lineWidth = 2;
      const opacity = reduced ? 0.7 : 0.5 + Math.sin(time * 3) * 0.3;
      ctx.save();
      ctx.globalAlpha = opacity;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x - 12 + i * 12, y - 57);
        ctx.lineTo(x - 15 + i * 15, y - 68);
        ctx.stroke();
      }
      ctx.restore();
    }
    industry(ctx, time, reduced, clean) {
      // Landscape feedback only. Factories never add an objective or a crystal.
      ctx.save();
      ctx.globalAlpha = clean ? 0.09 : 0.52;
      ctx.fillStyle = "#575558";
      for (let j = 0; j < 3; j++)
        for (let i = 0; i < 5; i++) {
          const age = reduced ? i * 0.6 : (time * 0.45 + i * 0.62) % 3.2;
          ctx.beginPath();
          ctx.ellipse(
            875 + j * 63 + age * 8,
            123 - age * 27,
            7 + age * 6,
            6 + age * 5,
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      ctx.restore();
      document.body.dataset.industryState = clean ? "recuperada" : "poluida";
    }
    underCanopy(p) {
      return (
        this.phase === 3 &&
        ((p.x - 895) / 151) ** 2 + ((p.y - 35 - 223) / 88) ** 2 < 1
      );
    }
    canopyFloor(ctx, player, ground) {
      const under = this.underCanopy(player);
      document.body.dataset.canopyFade = String(under);
      if (!under) return;
      ctx.save();
      const g = ctx.createRadialGradient(895, 223, 30, 895, 223, 151);
      g.addColorStop(0, "#ad9667ba");
      g.addColorStop(0.75, "#ad966798");
      g.addColorStop(1, "#ad966700");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(895, 223, 151, 88, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    actors(time, reduced, ratio) {
      return GuardiaoElenco.actors(this.phase, time, ratio, reduced);
    }
    drawResident(ctx, actor, player) {
      this.draw(ctx, "moradores", actor.frame, actor.x, actor.y, actor.height, {
        flip: player ? player.x < actor.x : actor.row % 2 === 1,
      });
    }
    community(ctx, time, reduced, ratio) {
      document.body.dataset.npcMood =
        ratio >= 1 ? "felizes" : ratio > 0 ? "esperancosos" : "preocupados";
      this.actors(time, reduced, ratio).forEach((actor) =>
        this.drawResident(ctx, actor),
      );
    }
  }
  window.GuardiaoAdventureArt = Art;
})();
