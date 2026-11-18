"use strict";
(() => {
  const P = BosquePintura;
  const done = (t) =>
    t.life === 0 || ["done", "safe", "returning"].includes(t.status);
  class Scene {
    constructor(phase, data) {
      this.phase = phase;
      this.data = data;
      this.objects = [];
      this.objectives = [];
      this.complete = false;
      this.fullAt = null;
      this.time = 0;
      this.reduced = false;
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
      this.base = document.createElement("canvas");
      this.base.width = 1280;
      this.base.height = 720;
      this.create();
    }
    create() {
      const c = this.base.getContext("2d"),
        r = P.random(481 + this.phase),
        d = this.data;
      for (let i = 0; i < 3800; i++) {
        const x = r() * 1280,
          y = r() * 720;
        P.oval(
          c,
          x,
          y,
          0.5 + r() * 2,
          0.4 + r(),
          i % 2 ? "#e9d5a219" : "#24392d1a",
        );
      }
      this.meadows = Array.from({ length: 180 }, (_, i) => ({
        x: r() * 1280,
        y: r() * 720,
        rx: 24 + r() * 35,
        ry: 12 + r() * 25,
        seed: i,
      }));
      if (this.phase === 1) {
        this.objects.push(
          { kind: "house", x: 160, y: 184, w: 151, h: 76 },
          { kind: "shelter", x: 390, y: 187, w: 119, h: 55 },
        );
        for (const t of d.trees)
          this.objects.push({
            ...t,
            kind: "tree",
            height: t.h,
            seed: Math.round(t.x),
          });
        for (const o of d.obstacles.filter((o) =>
          o.name?.startsWith("bosque"),
        )) {
          const pts = o.polygon;
          const x = pts.reduce((s, p) => s + p[0], 0) / pts.length,
            y = pts.reduce((s, p) => s + p[1], 0) / pts.length;
          for (let j = 0; j < 9; j++)
            this.objects.push({
              kind: "tree",
              x: x + (r() - 0.5) * 90,
              y: y + (r() - 0.5) * 65,
              height: 74 + r() * 40,
              seed: j + x,
            });
        }
      } else {
        for (const t of d.trees || [])
          this.objects.push({ ...t, kind: "tree" });
        for (const [i, o] of d.obstacles.entries()) {
          if (o.name === "lixeira" || o.name) continue;
          if (i === 0)
            this.objects.push({
              kind: "house",
              x: Math.max(o.x, 220),
              y: o.y + o.ry * 0.7,
              w: Math.min(170, o.rx * 1.2),
              h: 70,
            });
          else if (this.phase === 5 && i < 3)
            this.objects.push({
              kind: "house",
              x: o.x,
              y: o.y + o.ry * 0.5,
              w: Math.min(165, o.rx * 1.1),
              h: 80,
              town: i === 1 ? 2 : true,
            });
          else if (o.rx > 70) {
            for (let j = 0; j < 6; j++)
              this.objects.push({
                kind: "tree",
                x: o.x + (r() - 0.5) * o.rx,
                y: o.y + (r() - 0.5) * o.ry,
                height: 75 + r() * 35,
                seed: j + o.x,
              });
          } else
            this.objects.push({
              kind: "rock",
              x: o.x,
              y: o.y,
              rx: o.rx,
              ry: o.ry,
            });
        }
        for (const w of d.barriers || [])
          this.objects.push({
            kind: "fence",
            x: w.a[0],
            y: Math.max(w.a[1], w.b[1]),
            a: w.a,
            b: w.b,
          });
      }
      // Border trees occupy blocked terrain only. Their visible roots match the collision boundary.
      for (let i = 0; i < 145; i++) {
        const x = 35 + r() * 1210,
          y = 60 + r() * 610,
          p = { x, y };
        const blocked =
          this.phase === 1
            ? !d.floorPoint(p)
            : !GuardiaoNavegacao.inside(p, d.floor);
        const inWater =
          this.phase === 1
            ? d.inside(p, d.river)
            : d.water && GuardiaoNavegacao.inside(p, d.water);
        if (
          !blocked ||
          inWater ||
          this.objects.some((o) => Math.hypot(o.x - x, o.y - y) < 45)
        )
          continue;
        this.objects.push({
          kind: "tree",
          x,
          y,
          height: 70 + r() * 60,
          seed: i * 11,
        });
      }
      this.objects.sort((a, b) => a.y - b.y);
    }
    health(x, y) {
      let h = this.phase === 1 && x < 490 ? 0.78 : 0.05;
      if (this.complete)
        h = Math.max(
          h,
          this.saved || this.reduced
            ? 1
            : P.ease((this.time - this.fullAt) / 4.5),
        );
      for (const o of this.objectives) {
        const dist = Math.hypot(x - o.x, (y - o.y) * 1.1),
          radius = this.phase === 1 ? 225 : 205;
        if (dist > radius) continue;
        const age = this.reduced
          ? 1
          : P.ease((this.time - (o.restoredAt ?? -10) - dist / 300) / 3.4);
        h = Math.max(h, age * P.clamp((radius - dist) / 70));
      }
      return h;
    }
    update(objectives, time, reduced, completed) {
      this.objectives = objectives.filter(done);
      this.cleanRatio = this.objectives.length / Math.max(1, objectives.length);
      if (this.phase === 5)
        document.body.dataset.industryState =
          this.cleanRatio === 1 ? "recuperada" : "poluida";
      this.time = time;
      this.reduced = reduced;
      if (completed && !this.complete) this.fullAt = time;
      this.complete = completed;
    }
    ground(c, objectives, time, reduced, completed) {
      this.update(objectives, time, reduced, completed);
      const d = this.data;
      P.terrain(
        c,
        this,
        1280,
        720,
        (x, y) => this.health(x, y),
        time,
        this.phase === 1 ? [116, 109, 79] : [168, 146, 98],
      );
      c.drawImage(this.base, 0, 0);
      for (const p of this.meadows) {
        const h = this.health(p.x, p.y);
        if (h < 0.15) continue;
        if (window.BosqueVegetacao?.ready)
          BosqueVegetacao.draw(
            c,
            "vegetacao",
            p.seed % 8 === 0 ? 9 : 8,
            p.x,
            p.y,
            10 + 12 * h,
          );
        else
          for (let j = 0; j < 3; j++) {
            const x = p.x + (j - 1) * 9,
              y = p.y + Math.sin(j + p.seed) * 6;
            P.line(
              c,
              [
                [x - 3, y],
                [x, y - 5 * h],
                [x + 1, y],
              ],
              "#a8bc6388",
              1,
            );
          }
      }
      if (this.phase === 1) {
        c.beginPath();
        for (const [a, b] of d.edges) {
          c.moveTo(...d.nodes[a]);
          c.lineTo(...d.nodes[b]);
        }
        c.lineCap = c.lineJoin = "round";
        c.strokeStyle = "#bfa06b";
        c.lineWidth = 55;
        c.stroke();
        c.strokeStyle = "#ceb37d";
        c.lineWidth = 47;
        c.stroke();
        P.water(c, d.river, 0.8, time, reduced, 1);
        P.bridge(c, d.bridge);
        for (const f of objectives) {
          const age = time - (f.restoredAt ?? -20),
            alpha = f.life > 0 ? 0.65 : 1 - P.ease(age / 4);
          if (alpha <= 0) continue;
          c.save();
          c.translate(f.x, f.y - 4);
          c.scale(1, 0.55);
          const ash = c.createRadialGradient(0, 0, 9, 0, 0, f.rx * 0.72);
          ash.addColorStop(0, `rgba(43,42,34,${alpha})`);
          ash.addColorStop(0.6, `rgba(61,56,40,${alpha * 0.7})`);
          ash.addColorStop(1, "rgba(61,56,40,0)");
          c.fillStyle = ash;
          c.fillRect(-f.rx, -f.rx, f.rx * 2, f.rx * 2);
          c.restore();
        }
        // The reservoir is a separate solid object, beside the actual bridge.
        if (
          !window.BosqueVegetacao?.ready ||
          !BosqueVegetacao.draw(c, "objetos", 6, 377, 384, 67)
        ) {
          P.oval(c, 377, 356, 49, 34, "#777b65");
          P.oval(c, 377, 352, 39, 24, "#459ca6");
        }
        P.line(
          c,
          [
            [377, 377],
            [395, 385],
          ],
          "#a4a688",
          13,
        );
        P.oval(c, 395, 385, 14, 8, "#694a31");
        P.oval(c, 395, 380, 13, 6, "#bd513c");
      } else {
        const routes = {
          2: [
            [
              [315, 245],
              [280, 310],
              [265, 400],
              [325, 525],
              [430, 600],
            ],
            [
              [800, 180],
              [930, 240],
              [1020, 340],
              [950, 440],
              [970, 540],
              [890, 625],
            ],
            [
              [315, 245],
              [390, 190],
              [800, 180],
            ],
          ],
          3: [
            [
              [375, 225],
              [470, 280],
              [620, 220],
              [760, 200],
              [925, 190],
              [1070, 300],
              [1020, 440],
              [900, 530],
              [720, 450],
              [550, 430],
              [400, 480],
              [270, 424],
              [375, 225],
            ],
          ],
          4: [
            [
              [375, 237],
              [460, 310],
              [578, 209],
              [760, 160],
              [900, 158],
              [1030, 230],
              [1045, 332],
              [970, 430],
              [845, 510],
              [680, 560],
              [533, 548],
              [460, 480],
              [505, 409],
              [460, 310],
            ],
          ],
          5: [
            [
              [370, 282],
              [430, 260],
              [690, 217],
              [850, 245],
              [1000, 270],
              [1040, 386],
              [900, 400],
              [785, 433],
              [622, 554],
              [360, 573],
              [282, 493],
              [370, 282],
            ],
          ],
        };
        for (const points of routes[this.phase])
          P.trail(c, points, this.phase === 5 ? 42 : 31, this.phase === 5);
        if (this.phase === 2) {
          // A continuous sandy shore, not a grassy patch underneath the turtle.
          c.save();
          P.poly(c, d.water);
          c.strokeStyle = "#e6ce96";
          c.lineWidth = 140;
          c.stroke();
          c.restore();
          const health =
            this.objectives.filter((t) => t.type === "trash").length / 8;
          P.water(c, d.water, health, time, reduced, 2);
          const b = d.bridge;
          P.bridge(c, [
            [b.x, b.y],
            [b.x + b.w, b.y],
            [b.x + b.w, b.y + b.h],
            [b.x, b.y + b.h],
          ]);
          for (const dock of d.docks || []) P.bridge(c, dock);
        }
        if (this.phase === 5)
          for (const w of d.noWalkWater || [])
            P.water(c, w, 0.7, time, reduced, 5);
        if (this.phase === 5 && d.dryBridge) {
          const b = d.dryBridge;
          P.bridge(c, [
            [b.x, b.y],
            [b.x + b.w, b.y],
            [b.x + b.w, b.y + b.h],
            [b.x, b.y + b.h],
          ]);
        }
        if (this.phase === 4) {
          P.oval(c, d.refill.x, d.refill.y, 30, 19, "#8c937d");
          P.oval(c, d.refill.x, d.refill.y - 4, 22, 13, "#6cb8bc");
        }
      }
      // Soil details stay fixed to the land, not attached to the camera.
      const r = P.random(92 + this.phase);
      for (let i = 0; i < 130; i++) {
        const x = 40 + r() * 1200,
          y = 50 + r() * 620;
        if (
          (this.phase === 1
            ? d.floorPoint({ x, y })
            : GuardiaoNavegacao.inside({ x, y }, d.floor)) &&
          !(d.water && GuardiaoNavegacao.inside({ x, y }, d.water))
        )
          P.oval(c, x, y, 1.6, 0.8, "#7a6b453b");
      }
    }
    actors(time, reduced, player) {
      return this.objects.map((o) => ({
        y: o.y,
        draw: (c) => {
          const overlap =
            player &&
            Math.abs(player.x - o.x) < 45 &&
            player.y < o.y &&
            player.y > o.y - (o.height || 80);
          c.save();
          if (overlap) c.globalAlpha = 0.46;
          if (o.kind === "tree")
            P.tree(
              c,
              o.x,
              o.y,
              o.height,
              this.health(o.x, o.y),
              time,
              o.seed,
              reduced,
            );
          else if (o.kind === "rock") P.rock(c, o.x, o.y, o.rx, o.ry);
          else if (o.kind === "fence") P.fence(c, o.a, o.b);
          else if (
            o.kind === "shelter" &&
            window.BosqueVegetacao?.ready &&
            BosqueVegetacao.draw(c, "objetos", 1, o.x, o.y, o.h * 1.65)
          ) {
          } else P.house(c, o.x, o.y, o.w, o.h, o.town);
          if (
            this.phase === 5 &&
            o.kind === "house" &&
            this.cleanRatio < 1 &&
            !reduced
          ) {
            const originY = o.y - o.h * 1.9;
            for (let i = 0; i < 4; i++) {
              const age = (time * 0.18 + i / 4) % 1;
              P.oval(
                c,
                o.x - o.w * 0.25 + Math.sin(age * 3 + i) * 7,
                originY - age * 35,
                5 + age * 8,
                6 + age * 8,
                `rgba(91,100,82,${(1 - this.cleanRatio) * (1 - age) * 0.24})`,
              );
            }
          }
          c.restore();
        },
      }));
    }
    plant(c, t, time, reduced) {
      const seeded = ["seeded", "growing", "done"].includes(t.status);
      P.oval(c, t.x, t.y, 24, 9, seeded ? "#6a5935" : "#64543b");
      const age =
        t.status === "done"
          ? reduced
            ? 1
            : P.ease((time - (t.restoredAt ?? -10)) / 4)
          : t.status === "growing"
            ? 0.4
            : t.status === "seeded"
              ? 0.1
              : 0;
      if (seeded) {
        if (age < 0.4 && window.BosqueVegetacao?.ready)
          BosqueVegetacao.draw(c, "vegetacao", 11, t.x, t.y, 13 + age * 12);
        if (t.status !== "seeded")
          P.tree(
            c,
            t.x,
            t.y,
            12 + 68 * P.ease(age),
            age,
            time,
            Math.round(t.x),
            reduced,
          );
      } else
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
    }
    state() {
      return {
        phase: this.phase,
        objects: this.objects.length,
        restored: this.objectives.length,
        complete: this.complete,
        renderer: "elementos",
        bitmapReplacements: 0,
      };
    }
  }
  window.BosqueCenario = Scene;
})();
