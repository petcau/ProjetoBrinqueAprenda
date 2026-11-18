"use strict";
(() => {
  const Base = BosqueCenario,
    P = BosquePintura,
    oldDraw = BosqueVegetacao.draw,
    cache = new Map();
  let bytes = 0,
    hits = 0,
    misses = 0;
  BosqueVegetacao.draw = (c, name, index, x, y, height) => {
    if (!BosqueVegetacao.ready) return oldDraw(c, name, index, x, y, height);
    const h = Math.max(2, Math.round(height / 2) * 2),
      key = name + ":" + index + ":" + h;
    let sprite = cache.get(key);
    if (!sprite) {
      const f = BosqueVegetacaoAtlas[name]?.frames[index];
      if (!f) return false;
      const width = Math.ceil((h * f.bounds[2]) / f.bounds[3]) + 4;
      sprite = MataArte.canvas(width + 2, h + 4);
      oldDraw(sprite.getContext("2d"), name, index, sprite.width / 2, h + 1, h);
      while (
        bytes + sprite.width * sprite.height * 4 > 12 * 1024 * 1024 &&
        cache.size
      ) {
        const key = cache.keys().next().value,
          v = cache.get(key);
        bytes -= v.width * v.height * 4;
        cache.delete(key);
      }
      bytes += sprite.width * sprite.height * 4;
      cache.set(key, sprite);
      misses++;
    } else hits++;
    const k = height / h;
    c.drawImage(
      sprite,
      x - (sprite.width * k) / 2,
      y - (h + 1) * k,
      sprite.width * k,
      sprite.height * k,
    );
    return true;
  };
  function polygons(scene) {
    const d = scene.data;
    return scene.phase === 1
      ? [d.river]
      : scene.phase === 2
        ? [d.water]
        : d.noWalkWater || [];
  }
  function bridge(c, b) {
    if (Array.isArray(b)) return P.bridge(c, b);
    P.bridge(c, [
      [b.x, b.y],
      [b.x + b.w, b.y],
      [b.x + b.w, b.y + b.h],
      [b.x, b.y + b.h],
    ]);
  }
  const oldTrails = MataPintura.trails;
  MataPintura.trails = (c, paths, width, town) =>
    oldTrails(c, paths, width * (town ? 0.85 : 0.72), town);
  class LivingScene extends Base {
    create() {
      super.create();
      this.objects = this.objects.filter(
        (o) => o.kind !== "tree" || !this.inWater(o.x, o.y),
      );
    }
    ground(c, objectives, time, reduced, complete) {
      this.update(objectives, time, reduced, complete);
      const latest = Math.max(
          -99,
          ...objectives.map((t) => t.restoredAt ?? -99),
          this.fullAt ?? -99,
        ),
        signature =
          this.objectives.map((o) => o.id || o.x + ":" + o.y).join(",") +
          ":" +
          complete;
      const changing = time - latest < 7 && !reduced;
      if (
        !this.landLayer ||
        signature !== this.landSignature ||
        (changing && time - this.landAt > 0.09)
      ) {
        this.landLayer ||= MataArte.canvas(1280, 720);
        const g = this.landLayer.getContext("2d");
        g.clearRect(0, 0, 1280, 720);
        const water = P.water;
        P.water = () => {};
        try {
          super.ground(g, objectives, time, reduced, complete);
        } finally {
          P.water = water;
        }
        // Cache do chão geométrico, com água transparente e pontes sobre a superfície.
        g.save();
        g.globalCompositeOperation = "destination-out";
        g.fillStyle = "#000";
        for (const polygon of polygons(this)) {
          P.poly(g, polygon);
          g.fill();
        }
        g.restore();
        if (this.phase === 1) bridge(g, this.data.bridge);
        if (this.phase === 2) {
          bridge(g, this.data.bridge);
          for (const dock of this.data.docks || []) bridge(g, dock);
        }
        if (this.data.dryBridge) bridge(g, this.data.dryBridge);
        this.landSignature = signature;
        this.landAt = time;
        this.floorBuilds = (this.floorBuilds || 0) + 1;
      }
      for (const polygon of polygons(this))
        P.water(
          c,
          polygon,
          this.phase === 2
            ? this.objectives.filter((t) => t.type === "trash").length / 8
            : this.phase === 1
              ? 0.8
              : 0.4 + 0.5 * this.cleanRatio,
          time,
          reduced,
          this.phase,
        );
      c.drawImage(this.landLayer, 0, 0);
    }
    actors(t, reduced, player) {
      const items = super.actors(t, reduced, player);
      return items.map((a, i) => ({
        y: a.y,
        draw: (c) => {
          const o = this.objects[i];
          if (o) {
            const m = c.getTransform(),
              x = o.x * m.a + m.e,
              y = o.y * m.d + m.f,
              h = (o.height || 230) * m.d,
              w = Math.max(110, h);
            if (
              x < -w ||
              x > c.canvas.width + w ||
              y < -35 ||
              y - h > c.canvas.height + 35
            )
              return;
          }
          a.draw(c);
        },
      }));
    }
    state() {
      return {
        ...super.state(),
        art: "trilhas-vivas",
        floorBuilds: this.floorBuilds || 0,
      };
    }
  }
  window.BosqueCenario = LivingScene;
  // Não decodifica trajes substituídos e moradores que não são mais exibidos.
  const Art = GuardiaoAdventureArt;
  window.GuardiaoAdventureArt = class extends Art {
    async load() {
      const names =
        this.phase === 2
          ? ["traje-nadar", "traje-acoes"]
          : this.phase === 3
            ? ["fauna-brasileira"]
            : [];
      await Promise.all(names.map((n) => this.ensure(n)));
      await BosqueKai.load();
    }
  };
  const prior = RaizesPersonagens.load;
  const phase = location.pathname.includes("floresta-viva")
    ? 1
    : Number(new URLSearchParams(location.search).get("fase") || 0);
  RaizesPersonagens.load = (names) =>
    prior(names?.filter((n) => phase === 1 || n !== "mangueira"));
  window.TrilhasRender = {
    stats: () => ({ cached: cache.size, bytes, hits, misses }),
    pixelRatio: () =>
      Math.min(
        devicePixelRatio || 1,
        Raizes.prefs().graphicsQuality === "alta"
          ? 1.75
          : Raizes.prefs().graphicsQuality === "leve"
            ? 1
            : 1.25,
      ),
  };
})();
