"use strict";
(() => {
  const base = new URL("assets/", document.currentScript.src);
  const canvas = (w, h) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  };
  const ease = (n) => {
    n = Math.max(0, Math.min(1, n));
    return n * n * (3 - 2 * n);
  };
  class Landscape {
    constructor(name, w, h) {
      this.w = w;
      this.h = h;
      this.name = name;
      this.mask = canvas(w, h);
      this.layer = canvas(w, h);
      // Só o cenário inicial bloqueia a entrada. A restauração é preparada depois.
      this.ready = this.image("antes");
      this.built = -999;
      this.signature = "";
      this.builds = 0;
      this.ready
        .then(() => {
          const warm = () => this.after();
          if (window.requestIdleCallback)
            requestIdleCallback(warm, { timeout: 4000 });
          else setTimeout(warm, 2200);
        })
        .catch(() => {});
    }
    async image(state) {
      const im = new Image();
      im.decoding = "async";
      im.fetchPriority = state === "antes" ? "high" : "low";
      im.src = new URL(
        (this.name === "mapa"
          ? "../../" +
            (state === "antes" ? "mapa-ferido" : "arte-viva") +
            "/assets/"
          : "") +
          this.name +
          "-" +
          state +
          ".webp",
        base,
      );
      await im.decode();
      this[state] = im;
      this.signature = null;
    }
    after() {
      if (this.depois) return Promise.resolve(true);
      if (this.afterPromise) return this.afterPromise;
      if (performance.now() < (this.retryAfter || 0))
        return Promise.resolve(false);
      this.afterPromise = this.image("depois")
        .then(() => true)
        .catch(() => {
          this.afterPromise = null;
          this.retryAfter = performance.now() + 10000;
          return false;
        });
      return this.afterPromise;
    }
    draw(c, points, time, reduced, full = 0) {
      if (!this.antes) {
        c.fillStyle = "#514b37";
        c.fillRect(0, 0, this.w, this.h);
        return;
      }
      if (points.length || full > 0) this.after();
      if (full >= 1 && this.depois) {
        c.drawImage(this.depois, 0, 0, this.w, this.h);
        return;
      }
      const signature =
        points.map((p) => p.id + ":" + p.at).join("|") +
        ":" +
        (full >= 1) +
        ":" +
        !!this.depois;
      const animating =
        points.some((p) => time - p.at < 7) || (full > 0 && full < 1);
      if (
        signature !== this.signature ||
        (this.depois && animating && time - this.built > 0.1)
      ) {
        const m = this.mask.getContext("2d"),
          g = this.layer.getContext("2d");
        m.clearRect(0, 0, this.w, this.h);
        for (const p of this.depois ? points : []) {
          const progress = reduced ? 1 : ease((time - p.at) / 5);
          const radius = Math.max(1, (p.radius || 185) * progress);
          const glow = m.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
          glow.addColorStop(0, "#fff");
          glow.addColorStop(0.65, "#fff");
          glow.addColorStop(1, "#fff0");
          m.fillStyle = glow;
          m.fillRect(p.x - radius, p.y - radius, radius * 2, radius * 2);
        }
        if (full > 0) {
          m.globalAlpha = full;
          m.fillStyle = "#fff";
          m.fillRect(0, 0, this.w, this.h);
          m.globalAlpha = 1;
        }
        g.clearRect(0, 0, this.w, this.h);
        // Sem objetivos concluídos, a imagem saudável não entra na composição.
        // Além de evitar trabalho, o reinício conserva os mesmos pixels da entrada.
        if (this.depois && (points.length || full > 0)) {
          g.drawImage(this.depois, 0, 0, this.w, this.h);
          g.globalCompositeOperation = "destination-in";
          g.drawImage(this.mask, 0, 0);
          g.globalCompositeOperation = "destination-over";
        }
        g.drawImage(this.antes, 0, 0, this.w, this.h);
        g.globalCompositeOperation = "source-over";
        this.signature = signature;
        this.built = time;
        this.builds++;
      }
      c.drawImage(this.layer, 0, 0);
    }
  }
  const names = {
    1: "floresta",
    2: "rio",
    3: "fauna",
    4: "plantio",
    5: "cidade",
  };
  const Previous = window.BosqueCenario;
  if (Previous) {
    window.BosqueCenario = class {
      constructor(phase, data) {
        this.phase = phase;
        this.data = data;
        this.objectives = [];
        this.complete = false;
        this.fullAt = null;
        this.landscape = new Landscape(names[phase], 1280, 720);
        this.ready = this.landscape.ready.catch(() => {
          this.backup = new Previous(phase, data);
        });
      }
      ground(c, tasks, time, reduced, complete) {
        if (this.backup)
          return this.backup.ground(c, tasks, time, reduced, complete);
        this.objectives = tasks.filter(
          (t) =>
            t.life === 0 || ["done", "safe", "returning"].includes(t.status),
        );
        // Conserva o estado público da cidade usado pela interface e pela campanha.
        if (this.phase === 5)
          document.body.dataset.industryState =
            this.objectives.length === tasks.length ? "recuperada" : "poluida";
        const loaded = complete && this.fullAt === null;
        if (loaded) this.fullAt = time;
        this.complete = complete;
        const points = this.objectives.map((t) => ({
          id: t.id,
          x: t.x,
          y: t.y,
          at: t.restoredAt ?? -10,
          radius: 180,
        }));
        this.landscape.draw(
          c,
          points,
          time,
          reduced,
          complete ? (reduced ? 1 : ease((time - this.fullAt) / 4)) : 0,
        );
        // A superfície continua viva; não há retângulos de cenário sobre os caminhos.
        if (!reduced) this.ambient(c, time);
      }
      ambient(c, time) {
        // Reflexos seguem o rio pintado; não ocupam as margens nem a ponte.
        const poly = this.phase === 1 ? this.data.river : this.data.water;
        if (poly) {
          c.save();
          BosquePintura.poly(c, poly);
          c.clip();
          c.strokeStyle = "#d6f4e033";
          c.lineWidth = 0.9;
          for (let i = 0; i < 17; i++) {
            const x = 460 + ((i * 71) % 340),
              y = 80 + ((i * 91 + time * 9) % 600);
            c.beginPath();
            c.ellipse(
              x + Math.sin(time + i) * 3,
              y,
              6 + Math.sin(time * 1.6 + i) * 2,
              1.5,
              0,
              0,
              Math.PI * 2,
            );
            c.stroke();
          }
          c.restore();
        }
        if (this.phase === 5 && !this.complete) {
          c.save();
          c.fillStyle = "#6d656238";
          for (let i = 0; i < 8; i++) {
            const age = (time * 0.22 + i * 0.43) % 3;
            c.beginPath();
            c.ellipse(
              873 + age * 13,
              105 - age * 30,
              5 + age * 5,
              6 + age * 5,
              0,
              0,
              Math.PI * 2,
            );
            c.fill();
          }
          c.restore();
        }
      }
      actors(time, reduced, player) {
        return this.backup?.actors(time, reduced, player) || [];
      }
      plant(c, ...args) {
        const [t, time, reduced] = args,
          P = BosquePintura;
        const seeded = ["seeded", "growing", "done"].includes(t.status);
        P.oval(c, t.x, t.y, 24, 9, seeded ? "#6a5935" : "#64543b");
        if (!seeded) {
          for (let j = 0; j < 3; j++)
            P.line(
              c,
              [
                [t.x - 12 + j * 10, t.y - 3],
                [t.x - 14 + j * 10, t.y + 3],
              ],
              "#b59662",
              1.5,
            );
          return;
        }
        const age =
          t.status === "seeded"
            ? 0.08
            : t.status === "done"
              ? reduced
                ? 1
                : ease((time - (t.restoredAt ?? -10)) / 4)
              : 0.4;
        P.tree(
          c,
          t.x,
          t.y,
          17 + 66 * age,
          0.5 + 0.5 * age,
          time,
          Math.round(t.x),
          reduced,
        );
      }
      state() {
        return {
          phase: this.phase,
          renderer: "ilustrado-interativo",
          art: "reencontro",
          restored: this.objectives.length,
          complete: this.complete,
          objects: 0,
          bitmapReplacements: 0,
          terrainBuilds: this.landscape.builds,
        };
      }
    };
  }
  window.GuardiaoPaisagem = { Landscape, ease };
})();
