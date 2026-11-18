"use strict";
(() => {
  const pause = () => new Promise((resolve) => setTimeout(resolve, 0));
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];
  class Heap {
    constructor() {
      this.a = [];
    }
    push(id, score) {
      let i = this.a.length;
      this.a.push({ id, score });
      while (i) {
        const p = (i - 1) >> 1;
        if (this.a[p].score <= score) break;
        this.a[i] = this.a[p];
        i = p;
      }
      this.a[i] = { id, score };
    }
    pop() {
      const first = this.a[0],
        end = this.a.pop();
      if (this.a.length) {
        let i = 0;
        while (i * 2 + 1 < this.a.length) {
          let j = i * 2 + 1;
          if (j + 1 < this.a.length && this.a[j + 1].score < this.a[j].score)
            j++;
          if (end.score <= this.a[j].score) break;
          this.a[i] = this.a[j];
          i = j;
        }
        this.a[i] = end;
      }
      return first.id;
    }
  }
  async function route(owner, from, to, options) {
    const d = owner.navigationSnapshot
      ? owner.navigationSnapshot()
      : {
          grid: owner.grid.slice(),
          cell: owner.cell,
          cols: owner.cols,
          rows: owner.rows,
        };
    const { grid, cell, cols, rows } = d,
      point = (id) => ({
        x: (id % cols) * cell + cell / 2,
        y: Math.floor(id / cols) * cell + cell / 2,
      });
    const hazards = options.hazards || [],
      clear = (p) =>
        !hazards.some(
          (h) =>
            (h.life > 0 || h.stage === "ferido") &&
            Math.hypot(p.x - (h.position || h).x, p.y - (h.position || h).y) <
              (h.stage ? 19 : 27),
        );
    let deadline = performance.now() + 5;
    async function yieldIfNeeded() {
      if (performance.now() > deadline) {
        await pause();
        deadline = performance.now() + 5;
      }
    }
    for (let i = 0; i < grid.length; i++) {
      if (grid[i] && !clear(point(i))) grid[i] = 0;
      if (i % 128 === 0) await yieldIfNeeded();
    }
    async function nearest(p) {
      let best = -1,
        bestD = Infinity;
      for (let i = 0; i < grid.length; i++) {
        if (grid[i]) {
          const q = point(i),
            v = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
          if (v < bestD) {
            bestD = v;
            best = i;
          }
        }
        if (i % 256 === 0) await yieldIfNeeded();
      }
      return best;
    }
    const start = await nearest(from),
      end = await nearest(to);
    if (start < 0 || end < 0) return [];
    const costs = new Float64Array(grid.length).fill(Infinity),
      previous = new Int32Array(grid.length).fill(-1),
      closed = new Uint8Array(grid.length),
      heap = new Heap();
    costs[start] = 0;
    heap.push(start, 0);
    while (heap.a.length) {
      const id = heap.pop();
      if (closed[id]) continue;
      closed[id] = 1;
      if (id === end) {
        const path = [];
        let p = id;
        while (p !== start) {
          path.push(point(p));
          p = previous[p];
          if (p < 0) return [];
        }
        path.push(point(start));
        path.reverse();
        if (
          Math.hypot(point(end).x - to.x, point(end).y - to.y) < cell * 2 &&
          owner.visible(point(end), to)
        )
          path.push({ ...to });
        return path;
      }
      const x = id % cols,
        y = Math.floor(id / cols),
        p = point(id);
      for (const [dx, dy] of dirs) {
        const xx = x + dx,
          yy = y + dy,
          next = yy * cols + xx;
        if (
          xx < 0 ||
          xx >= cols ||
          yy < 0 ||
          yy >= rows ||
          !grid[next] ||
          closed[next]
        )
          continue;
        if (dx && dy && (!grid[y * cols + xx] || !grid[yy * cols + x]))
          continue;
        const q = point(next);
        if (!owner.visible(p, q)) continue;
        const cost = costs[id] + Math.hypot(dx, dy) * cell;
        if (cost >= costs[next]) continue;
        costs[next] = cost;
        previous[next] = id;
        heap.push(next, cost + Math.hypot(q.x - to.x, q.y - to.y));
        await yieldIfNeeded();
      }
    }
    return [];
  }
  window.BosqueBuscaCooperativa = { route };
})();
