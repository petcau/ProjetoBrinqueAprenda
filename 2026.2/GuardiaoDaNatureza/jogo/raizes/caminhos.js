"use strict";
(() => {
  class Heap {
    constructor() {
      this.items = [];
    }
    push(id, score) {
      const a = this.items;
      let i = a.length;
      a.push({ id, score });
      while (i) {
        const p = (i - 1) >> 1;
        if (a[p].score <= score) break;
        a[i] = a[p];
        i = p;
      }
      a[i] = { id, score };
    }
    pop() {
      const a = this.items,
        first = a[0],
        end = a.pop();
      if (a.length) {
        let i = 0;
        while (i * 2 + 1 < a.length) {
          let c = i * 2 + 1;
          if (c + 1 < a.length && a[c + 1].score < a[c].score) c++;
          if (end.score <= a[c].score) break;
          a[i] = a[c];
          i = c;
        }
        a[i] = end;
      }
      return first;
    }
    get size() {
      return this.items.length;
    }
  }
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
  class Search {
    constructor({ cols, rows, cell, point, grid, walkable, visible }) {
      Object.assign(this, { cols, rows, cell, point, grid, walkable, visible });
      this.count = cols * rows;
      this.points = Array.from({ length: this.count }, (_, id) => point(id));
      this.edges = new Int8Array(this.count * 8);
      this.signature = null;
      this.calls = 0;
      this.expanded = 0;
    }
    reset(signature) {
      if (signature !== this.signature) {
        this.signature = signature;
        this.edges.fill(0);
      }
    }
    nearest(p, clear) {
      const candidates = [];
      for (let id = 0; id < this.count; id++) {
        if (!this.grid[id] || !clear(this.points[id])) continue;
        const q = this.points[id],
          d = (p.x - q.x) ** 2 + (p.y - q.y) ** 2;
        if (candidates.length < 32 || d < candidates.at(-1).d) {
          let index = 0;
          while (index < candidates.length && candidates[index].d < d) index++;
          candidates.splice(index, 0, { id, d });
          if (candidates.length > 32) candidates.pop();
        }
      }
      const valid = this.walkable(p);
      for (const c of candidates)
        if (!valid || this.visible(p, this.points[c.id])) return c.id;
      return -1;
    }
    route(from, to, { signature = "static", clear = () => true } = {}) {
      this.calls++;
      this.reset(signature);
      if (this.visible(from, to)) return [{ ...to }];
      const start = this.nearest(from, clear),
        end = this.nearest(to, clear);
      if (start < 0 || end < 0) return [];
      const costs = new Float64Array(this.count);
      costs.fill(Infinity);
      const previous = new Int32Array(this.count);
      previous.fill(-1);
      const closed = new Uint8Array(this.count),
        heap = new Heap();
      costs[start] = 0;
      heap.push(start, 0);
      while (heap.size) {
        let { id } = heap.pop();
        if (closed[id]) continue;
        closed[id] = 1;
        this.expanded++;
        if (id === end) {
          const ids = [];
          while (id !== start) {
            ids.push(id);
            id = previous[id];
            if (id < 0) return [];
          }
          ids.reverse();
          const path = [this.points[start], ...ids.map((i) => this.points[i])];
          if (this.walkable(to) && this.visible(path.at(-1) || from, to))
            path.push({ ...to });
          const smooth = [];
          let anchor = from,
            index = 0;
          while (index < path.length) {
            let next = index;
            while (
              next + 1 < path.length &&
              this.visible(anchor, path[next + 1])
            )
              next++;
            smooth.push({ ...path[next] });
            anchor = path[next];
            index = next + 1;
          }
          return smooth;
        }
        const x = id % this.cols,
          y = Math.floor(id / this.cols);
        for (let dir = 0; dir < 8; dir++) {
          const [dx, dy] = dirs[dir],
            xx = x + dx,
            yy = y + dy,
            next = yy * this.cols + xx;
          if (
            xx < 0 ||
            xx >= this.cols ||
            yy < 0 ||
            yy >= this.rows ||
            !this.grid[next] ||
            closed[next] ||
            !clear(this.points[next])
          )
            continue;
          if (
            dx &&
            dy &&
            (!this.grid[y * this.cols + xx] || !this.grid[yy * this.cols + x])
          )
            continue;
          const cache = id * 8 + dir;
          let visible = this.edges[cache];
          if (!visible) {
            visible = this.visible(this.points[id], this.points[next]) ? 1 : -1;
            this.edges[cache] = visible;
          }
          if (visible < 0) continue;
          const g = costs[id] + Math.hypot(dx, dy) * this.cell;
          if (g >= costs[next]) continue;
          costs[next] = g;
          previous[next] = id;
          const q = this.points[next],
            goal = this.points[end];
          heap.push(next, g + Math.hypot(q.x - goal.x, q.y - goal.y));
        }
      }
      return [];
    }
  }
  window.RaizesBusca = Search;
})();
