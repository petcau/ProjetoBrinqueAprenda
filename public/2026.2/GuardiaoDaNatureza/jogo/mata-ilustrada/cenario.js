"use strict";
// Camadas de chão, pés e copas: os objetos são ordenados junto com Kai e os animais.
(() => {
  const P = BosquePintura,
    Base = BosqueCenario;
  class MataScene extends Base {
    create() {
      super.create();
      for (const o of this.objects) {
        if (o.kind === "tree") o.height *= 1.42;
        if (o.kind === "house") {
          o.h = this.phase === 1 ? 110 : o.town ? 105 : 107;
          if (this.phase !== 1) {
            const i = this.objects.filter((a) => a.kind === "house").indexOf(o),
              wall = this.data.obstacles[i];
            if (wall) {
              o.x = wall.x;
              o.y = wall.y + wall.ry * 0.5;
            }
          }
        }
        if (o.kind === "shelter") o.h = 82;
      }
      this.objects.push(...(this.data.landmarks || []));
      const d = this.data,
        random = P.random(1627 + this.phase);
      this.details = [];
      for (let i = 0; i < 280; i++) {
        const x = 20 + random() * 1240,
          y = 45 + random() * 645;
        if (this.inWater(x, y) || this.nearGoal(x, y, 30)) continue;
        if (
          this.objects.some(
            (o) => o.kind !== "tree" && Math.hypot(x - o.x, y - o.y) < 45,
          )
        )
          continue;
        this.details.push({
          x,
          y,
          height: 9 + random() * 15,
          seed: i,
          frame: i % 6 === 0 ? 18 : 1,
        });
      }
      // Juntas de pedra e canteiros são baixos, portanto não bloqueiam o jogador.
      this.borders = [];
      if (this.phase === 4)
        for (const t of d.tasks.filter((t) => t.type === "bed"))
          this.borders.push(t);
      this.rails = [];
      if (this.phase === 1) {
        const xs = d.bridge.map((p) => p[0]),
          ys = d.bridge.map((p) => p[1]);
        this.rails.push({
          x: Math.min(...xs),
          y: Math.max(...ys),
          w: Math.max(...xs) - Math.min(...xs),
        });
      } else if (d.bridge && this.phase === 2)
        this.rails.push({
          x: d.bridge.x,
          y: d.bridge.y + d.bridge.h,
          w: d.bridge.w,
        });
      if (d.dryBridge)
        this.rails.push({
          x: d.dryBridge.x,
          y: d.dryBridge.y + d.dryBridge.h,
          w: d.dryBridge.w,
        });
      this.objects.sort((a, b) => a.y - b.y);
    }
    inWater(x, y) {
      const d = this.data,
        p = { x, y };
      return this.phase === 1
        ? P.inside(p, d.river)
        : (d.water && P.inside(p, d.water)) ||
            (d.noWalkWater || []).some((w) => P.inside(p, w));
    }
    nearGoal(x, y, radius) {
      const d = this.data;
      return [
        ...(d.tasks || []),
        ...(d.fires || []),
        ...(d.animals || []),
      ].some((t) => Math.hypot(t.x - x, t.y - y) < radius);
    }
    paths() {
      return this.phase === 1
        ? this.data.edges.map(([a, b]) => [
            this.data.nodes[a],
            this.data.nodes[b],
          ])
        : MataLayout.paths[this.phase];
    }
    ground(c, objectives, time, reduced, completed) {
      this.update(objectives, time, reduced, completed);
      const d = this.data;
      P.terrain(c, this, 1280, 720, (x, y) => this.health(x, y), time);
      if (!this.detailLayer) this.detailLayer = MataArte.canvas(1280, 720);
      if (
        this.detailAt === undefined ||
        time - this.detailAt > 0.24 ||
        time < this.detailAt
      ) {
        this.detailAt = time;
        const surface = this.detailLayer.getContext("2d");
        surface.clearRect(0, 0, 1280, 720);
        this.paintDetails(surface);
      }
      c.drawImage(this.detailLayer, 0, 0);
      if (!this.roadLayer && MataArte.ready) {
        this.roadLayer = MataArte.canvas(1280, 720);
        MataPintura.trails(
          this.roadLayer.getContext("2d"),
          this.paths(),
          this.phase === 1 ? 48 : this.phase === 5 ? 48 : 37,
          this.phase === 5,
        );
      }
      if (this.roadLayer) c.drawImage(this.roadLayer, 0, 0);
      if (this.phase === 2) {
        // A areia acompanha a margem física; a tartaruga permanece em terra.
        c.save();
        P.poly(c, d.water);
        c.strokeStyle = MataArte.pattern(c, 3, 210);
        c.lineWidth = 145;
        c.stroke();
        c.restore();
        P.water(
          c,
          d.water,
          this.objectives.filter((t) => t.type === "trash").length / 8,
          time,
          reduced,
          2,
        );
        const b = d.bridge;
        P.bridge(c, [
          [b.x, b.y],
          [b.x + b.w, b.y],
          [b.x + b.w, b.y + b.h],
          [b.x, b.y + b.h],
        ]);
        for (const dock of d.docks || []) P.bridge(c, dock);
        // Pedrinhas pequenas e plantas baixas nas margens, sem obstáculos invisíveis.
        for (let i = 0; i < d.water.length; i++) {
          const a = d.water[i],
            b = d.water[(i + 1) % d.water.length],
            length = Math.hypot(a[0] - b[0], a[1] - b[1]);
          for (let j = 0; j < length / 49; j++) {
            const f = j / Math.max(1, Math.ceil(length / 49)),
              x = a[0] + (b[0] - a[0]) * f,
              y = a[1] + (b[1] - a[1]) * f;
            if (this.nearGoal(x, y, 42)) continue;
            MataArte.draw(c, j % 3 === 0 ? 20 : 19, x, y, 9 + (j % 3) * 4);
          }
        }
      }
      if (this.phase === 1) {
        P.water(c, d.river, 0.8, time, reduced, 1);
        P.bridge(c, d.bridge);
        for (const f of objectives) {
          const alpha =
            f.life > 0 ? 0.5 : 1 - P.ease((time - (f.restoredAt ?? -20)) / 4);
          if (alpha <= 0) continue;
          c.save();
          c.translate(f.x, f.y);
          c.scale(1, 0.57);
          const ash = c.createRadialGradient(0, 0, 8, 0, 0, f.rx * 0.84);
          ash.addColorStop(0, `rgba(21,24,21,${alpha})`);
          ash.addColorStop(1, "#171e1700");
          c.fillStyle = ash;
          c.fillRect(-f.rx, -f.rx, 2 * f.rx, 2 * f.rx);
          c.restore();
        }
        BosqueVegetacao.draw(c, "objetos", 6, 377, 384, 75);
        P.line(
          c,
          [
            [377, 377],
            [395, 385],
          ],
          "#a3a38a",
          12,
        );
        P.oval(c, 395, 385, 14, 8, "#61452f");
        P.oval(c, 395, 380, 13, 6, "#bd513c");
      }
      if (this.phase === 4) {
        for (const t of this.borders) {
          P.oval(c, t.x, t.y + 2, 32, 17, "#402f2588");
          P.oval(c, t.x, t.y, 29, 14, "#775131");
          for (let i = 0; i < 9; i++) {
            const a = (i / 9) * Math.PI * 2;
            P.oval(
              c,
              t.x + Math.cos(a) * 29,
              t.y + Math.sin(a) * 13,
              4,
              2.5,
              i % 2 ? "#b7a67d" : "#887c5f",
            );
          }
        }
        BosqueVegetacao.draw(c, "objetos", 6, d.refill.x, d.refill.y + 5, 51);
      }
      if (this.phase === 5) {
        for (const water of d.noWalkWater || [])
          P.water(c, water, 0.4 + 0.5 * this.cleanRatio, time, reduced, 5);
        if (d.dryBridge) {
          const b = d.dryBridge;
          P.bridge(c, [
            [b.x, b.y],
            [b.x + b.w, b.y],
            [b.x + b.w, b.y + b.h],
            [b.x, b.y + b.h],
          ]);
        }
      }
      // Iluminação suave não encobre os objetivos nem substitui a geometria do mapa.
      const light = c.createRadialGradient(660, 270, 110, 660, 270, 800);
      light.addColorStop(0, "#fff2bb08");
      light.addColorStop(1, "#152e2533");
      c.fillStyle = light;
      c.fillRect(0, 0, 1280, 720);
    }
    paintDetails(c) {
      for (const p of this.details) {
        const health = this.health(p.x, p.y);
        if (health < 0.3)
          MataArte.draw(c, p.frame, p.x, p.y, p.height, p.seed % 2 === 0);
        if (health > 0.08) {
          c.save();
          c.globalAlpha = P.clamp(health * 1.5);
          BosqueVegetacao.draw(
            c,
            "vegetacao",
            p.seed % 11 === 0 ? 9 : 8,
            p.x,
            p.y,
            p.height * (0.5 + health * 0.65),
          );
          c.restore();
        }
      }
    }
    actors(time, reduced, player) {
      const actors = this.objects.map((o) => ({
        y: o.y,
        draw: (c) => {
          const tall =
            o.kind === "house"
              ? o.h * 2.05
              : o.kind === "shelter"
                ? o.h * 1.65
                : o.height || 0;
          const half = o.kind === "house" ? 95 : o.kind === "shelter" ? 65 : 50;
          c.save();
          if (
            player &&
            tall &&
            Math.abs(player.x - o.x) < half &&
            player.y < o.y &&
            player.y > o.y - tall
          )
            c.globalAlpha = 0.4;
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
          else if (o.kind === "decor") {
            P.oval(c, o.x + 2, o.y + 1, o.rx + 2, o.ry + 1, "#1b261d30");
            MataArte.draw(c, o.frame, o.x, o.y + 3, o.height);
            if (o.frame === 12 && !reduced) {
              const glow = c.createRadialGradient(
                o.x + 6,
                o.y - o.height * 0.7,
                1,
                o.x + 6,
                o.y - o.height * 0.7,
                16,
              );
              glow.addColorStop(0, "#ffe6a94d");
              glow.addColorStop(1, "#ffe6a900");
              c.fillStyle = glow;
              c.fillRect(o.x - 12, o.y - o.height * 0.7 - 16, 36, 32);
            }
          } else if (o.kind === "rock") P.rock(c, o.x, o.y, o.rx, o.ry);
          else if (o.kind === "fence") P.fence(c, o.a, o.b);
          else if (o.kind === "shelter")
            BosqueVegetacao.draw(c, "objetos", 1, o.x, o.y, o.h * 1.65);
          else {
            P.house(c, o.x, o.y, o.w, o.h, o.town);
            if (this.phase === 5 && this.cleanRatio < 1 && !reduced)
              for (let i = 0; i < 4; i++) {
                const age = (time * 0.16 + i / 4) % 1;
                P.oval(
                  c,
                  o.x - 38 + Math.sin(age * 3 + i) * 8,
                  o.y - tall + 8 - age * 42,
                  5 + age * 10,
                  7 + age * 10,
                  `rgba(74,79,67,${(1 - this.cleanRatio) * (1 - age) * 0.28})`,
                );
              }
          }
          c.restore();
        },
      }));
      for (const b of this.rails)
        actors.push({
          y: b.y + 2,
          draw: (c) => MataPintura.rail(c, b.x, b.y, b.w),
        });
      return actors;
    }
    state() {
      return {
        ...super.state(),
        art: "mata-ilustrada",
        landmarks: this.data.landmarks?.length || 0,
        groundDetails: this.details.length,
      };
    }
  }
  window.BosqueCenario = MataScene;
})();
