"use strict";
(() => {
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function inside(p, polygon) {
    let hit = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i],
        b = polygon[j];
      if (
        a[1] > p.y !== b[1] > p.y &&
        p.x < ((b[0] - a[0]) * (p.y - a[1])) / (b[1] - a[1]) + a[0]
      )
        hit = !hit;
    }
    return hit;
  }
  class Navigation {
    constructor(data) {
      this.data = data;
      this.dynamic = [];
      this.cell = 12;
      this.cols = 107;
      this.rows = 60;
      this.grid = new Uint8Array(this.cols * this.rows);
      for (let i = 0; i < this.grid.length; i++)
        this.grid[i] = Number(this.walkable(this.point(i)));
    }
    setDynamic(points) {
      this.dynamic = points;
      for (let i = 0; i < this.grid.length; i++)
        this.grid[i] = Number(this.walkable(this.point(i)));
    }
    point(id) {
      return {
        x: (id % this.cols) * this.cell + 6,
        y: Math.floor(id / this.cols) * this.cell + 6,
      };
    }
    floor(p) {
      return (
        inside(p, this.data.floor) &&
        !this.dynamic.some((o) => distance(p, o) < 16) &&
        !this.data.obstacles.some(
          (o) => ((p.x - o.x) / o.rx) ** 2 + ((p.y - o.y) / o.ry) ** 2 < 1,
        )
      );
    }
    walkable(p, r = 7) {
      const geometry = window.GuardiaoMovimento;
      return (
        inside(p, this.data.floor) &&
        geometry.polygonMargin(p, this.data.floor) > r &&
        !this.dynamic.some((o) => distance(p, o) < 16 + r) &&
        !this.data.obstacles.some((o) => geometry.touchesEllipse(p, o, r))
      );
    }
    visible(a, b) {
      const n = Math.ceil(distance(a, b));
      for (let i = 0; i <= n; i++) {
        const t = n ? i / n : 0;
        if (
          !this.walkable({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
        )
          return false;
      }
      return true;
    }
    closest(p) {
      const choices = [],
        valid = this.walkable(p);
      for (let i = 0; i < this.grid.length; i++) {
        if (!this.grid[i]) continue;
        const q = this.point(i);
        choices.push({ id: i, q, d: (q.x - p.x) ** 2 + (q.y - p.y) ** 2 });
      }
      choices.sort((a, b) => a.d - b.d);
      for (const { id, q } of choices)
        if (!valid || this.visible(p, q)) return id;
      return -1;
    }
    route(from, to) {
      this.search ||= new window.RaizesBusca({
        cols: this.cols,
        rows: this.rows,
        cell: this.cell,
        point: (id) => this.point(id),
        grid: this.grid,
        walkable: (p) => this.walkable(p),
        visible: (a, b) => this.visible(a, b),
      });
      return this.search.route(from, to, {
        signature:
          this.dynamicSignature ||
          this.dynamic.map((p) => `${p.x}:${p.y}`).join("|"),
      });
    }
    approach(from, target, range = 55) {
      const options = [];
      for (const radius of [range, range * 0.72, range * 0.48]) {
        for (let i = 0; i < 24; i++) {
          const a = (i * Math.PI) / 12;
          const p = {
            x: target.x + Math.cos(a) * radius,
            y: target.y + Math.sin(a) * radius,
          };
          if (this.walkable(p)) options.push(p);
        }
      }
      options.sort((a, b) => distance(from, a) - distance(from, b));
      for (const p of options) {
        const route = this.route(from, p);
        if (route.length) return route;
      }
      return [];
    }
    swimming(p) {
      const b = this.data.bridge;
      return (
        !!this.data.water &&
        inside(p, this.data.water) &&
        !(b && p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h)
      );
    }
  }
  window.GuardiaoNavegacao = { Navigation, distance, inside };
})();
