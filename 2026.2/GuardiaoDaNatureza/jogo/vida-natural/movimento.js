"use strict";
(() => {
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function segmentDistance(p, a, b) {
    const dx = b[0] - a[0],
      dy = b[1] - a[1];
    const t = Math.max(
      0,
      Math.min(
        1,
        ((p.x - a[0]) * dx + (p.y - a[1]) * dy) / (dx * dx + dy * dy || 1),
      ),
    );
    return Math.hypot(p.x - a[0] - t * dx, p.y - a[1] - t * dy);
  }
  function polygonMargin(p, polygon) {
    let result = Infinity;
    for (let i = 0; i < polygon.length; i++)
      result = Math.min(
        result,
        segmentDistance(p, polygon[i], polygon[(i + 1) % polygon.length]),
      );
    return result;
  }
  // Exact distance from the feet to the ellipse, rather than eight point samples.
  function touchesEllipse(p, ellipse, radius) {
    const x = Math.abs(p.x - ellipse.x),
      y = Math.abs(p.y - ellipse.y);
    const a = ellipse.rx,
      b = ellipse.ry;
    if (x > a + radius || y > b + radius) return false;
    if ((x / a) ** 2 + (y / b) ** 2 <= 1) return true;
    if (!radius) return false;
    let low = 0,
      high = Math.hypot(a * x, b * y);
    for (let i = 0; i < 18; i++) {
      const t = (low + high) / 2;
      if (((a * x) / (t + a * a)) ** 2 + ((b * y) / (t + b * b)) ** 2 > 1)
        low = t;
      else high = t;
    }
    const t = (low + high) / 2;
    return (
      Math.hypot(
        x - (a * a * x) / (t + a * a),
        y - (b * b * y) / (t + b * b),
      ) <= radius
    );
  }
  function fitsFloor(p, radius, floor) {
    if (!floor(p)) return false;
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8;
      if (
        !floor({ x: p.x + Math.cos(a) * radius, y: p.y + Math.sin(a) * radius })
      )
        return false;
    }
    return true;
  }
  // Bounded substeps prevent tunnelling. Axis selection has no fixed X preference.
  function move(position, dx, dy, allowed) {
    if (![position.x, position.y, dx, dy].every(Number.isFinite)) return 0;
    const length = Math.hypot(dx, dy);
    if (!length) return 0;
    const count = Math.ceil(length / 1.5),
      sx = dx / count,
      sy = dy / count;
    let travelled = 0;
    for (let i = 0; i < count; i++) {
      const old = { x: position.x, y: position.y };
      const next = { x: position.x + sx, y: position.y + sy };
      if (allowed(next)) Object.assign(position, next);
      else {
        const xOnly = { x: next.x, y: position.y },
          yOnly = { x: position.x, y: next.y };
        const xClear = sx !== 0 && allowed(xOnly),
          yClear = sy !== 0 && allowed(yOnly);
        if (xClear && (!yClear || Math.abs(sx) >= Math.abs(sy)))
          position.x = next.x;
        else if (yClear) position.y = next.y;
      }
      travelled += distance(old, position);
    }
    return travelled;
  }
  window.GuardiaoMovimento = Object.freeze({
    distance,
    segmentDistance,
    polygonMargin,
    touchesEllipse,
    fitsFloor,
    move,
  });
})();
