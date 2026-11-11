"use strict";
(() => {
  const P = BosquePintura,
    old = { ...P };
  function terrain(c, owner, w, h, sampler, time, dry, green) {
    if (!MataArte.ready)
      return old.terrain(c, owner, w, h, sampler, time, dry, green);
    let cache = owner.mataTerrain;
    if (!cache) {
      const phase = owner.phase || 0,
        base = MataArte.canvas(w, h),
        g = base.getContext("2d");
      g.fillStyle = MataArte.pattern(
        g,
        phase === 1 ? 1 : phase === 5 ? 4 : phase === 3 ? 7 : 0,
        phase === 5 ? 216 : 190,
      );
      g.fillRect(0, 0, w, h);
      // Variações de matéria e de luz continuam presas ao solo.
      g.globalAlpha = phase === 1 ? 0.32 : 0.17;
      g.fillStyle = MataArte.pattern(g, 0, 290);
      g.fillRect(0, 0, w, h);
      const meadow = MataArte.canvas(w, h),
        m = meadow.getContext("2d");
      m.fillStyle = MataArte.pattern(m, 2, 210);
      m.fillRect(0, 0, w, h);
      const mask = MataArte.canvas(64, 36);
      cache = owner.mataTerrain = {
        base,
        meadow,
        mask,
        blend: MataArte.canvas(w, h),
        at: -99,
      };
    }
    c.drawImage(cache.base, 0, 0, w, h);
    if (time - cache.at > 0.18 || time < cache.at) {
      cache.at = time;
      const m = cache.mask.getContext("2d"),
        pixels = m.createImageData(64, 36);
      for (let y = 0; y < 36; y++)
        for (let x = 0; x < 64; x++) {
          const i = (y * 64 + x) * 4;
          pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = 255;
          pixels.data[i + 3] = Math.round(
            P.clamp(sampler(((x + 0.5) * w) / 64, ((y + 0.5) * h) / 36)) * 255,
          );
        }
      m.putImageData(pixels, 0, 0);
      const b = cache.blend.getContext("2d");
      b.clearRect(0, 0, w, h);
      b.globalCompositeOperation = "source-over";
      b.drawImage(cache.meadow, 0, 0);
      b.globalCompositeOperation = "destination-in";
      b.drawImage(cache.mask, 0, 0, w, h);
      b.globalCompositeOperation = "source-over";
    }
    c.drawImage(cache.blend, 0, 0, w, h);
    const light = c.createLinearGradient(0, 0, w, h);
    light.addColorStop(0, "#102b281a");
    light.addColorStop(0.52, "#fff3c00a");
    light.addColorStop(1, "#17221c24");
    c.fillStyle = light;
    c.fillRect(0, 0, w, h);
  }
  function trace(c, paths, smooth = true) {
    c.beginPath();
    for (const points of paths) {
      c.moveTo(...points[0]);
      if (!smooth || points.length < 3) {
        for (const p of points.slice(1)) c.lineTo(...p);
        continue;
      }
      for (let i = 1; i < points.length - 1; i++)
        c.quadraticCurveTo(
          ...points[i],
          (points[i][0] + points[i + 1][0]) / 2,
          (points[i][1] + points[i + 1][1]) / 2,
        );
      c.lineTo(...points.at(-1));
    }
  }
  function trails(c, paths, width = 32, town = false) {
    c.save();
    c.lineJoin = c.lineCap = "round";
    trace(c, paths);
    c.strokeStyle = "#29281f28";
    c.lineWidth = width + 7;
    c.stroke();
    c.strokeStyle = town ? "#aa9d7e" : "#9e865a";
    c.lineWidth = width + 2;
    c.stroke();
    c.strokeStyle = MataArte.pattern(c, town ? 4 : 3, town ? 190 : 175);
    c.lineWidth = width;
    c.stroke();
    c.globalAlpha = town ? 0.07 : 0.17;
    c.strokeStyle = town ? "#b8b19a" : "#c4a879";
    c.lineWidth = width - 6;
    c.stroke();
    c.restore();
  }
  function trail(c, points, width = 32, town = false) {
    if (!MataArte.ready) return old.trail(c, points, width, town);
    trails(c, [points], width, town);
  }
  function water(c, points, health, time, reduced, id) {
    if (!MataArte.ready) return old.water(c, points, health, time, reduced, id);
    c.save();
    P.poly(c, points);
    c.clip();
    const depth = c.createLinearGradient(0, 0, 900, 700);
    depth.addColorStop(0, P.mix("#627b65", "#246e7d", health));
    depth.addColorStop(0.45, P.mix("#7e8e64", "#389eae", health));
    depth.addColorStop(1, P.mix("#576f5d", "#125b70", health));
    c.fillStyle = depth;
    c.fillRect(0, 0, 1280, 720);
    c.save();
    const drift = reduced ? 0 : (time * 3) % 320;
    c.translate(Math.sin(time * 0.09) * 8, drift - 320);
    c.globalCompositeOperation = "luminosity";
    c.globalAlpha = 0.36 + health * 0.16;
    c.fillStyle = MataArte.pattern(c, 5, 160);
    c.fillRect(-24, -320, 1350, 1600);
    c.restore();
    c.save();
    c.globalCompositeOperation = "multiply";
    c.globalAlpha = 0.33 * (1 - health);
    c.fillStyle = "#a4b685";
    c.fillRect(0, 0, 1280, 720);
    c.restore();
    // Profundidade no mesmo contorno usado pela colisão, sem uma borda de plástico.
    P.poly(c, points);
    c.strokeStyle = "#203e3c60";
    c.lineWidth = 14;
    c.shadowBlur = 10;
    c.shadowColor = "#173939";
    c.stroke();
    c.shadowBlur = 0;
    c.lineWidth = 2;
    c.strokeStyle = "#c3d4ad77";
    c.stroke();
    c.globalAlpha = 0.15 + 0.2 * health;
    for (let i = 0; i < 16; i++) {
      const x = 170 + ((i * 181) % 990),
        y = 80 + ((i * 97) % 600),
        t = reduced ? i : time * 0.38 + i;
      c.beginPath();
      c.ellipse(
        x + Math.sin(t) * 9,
        y,
        11 + Math.sin(t) * 3,
        2,
        0,
        0.12,
        Math.PI * 1.7,
      );
      c.strokeStyle = "#d4ffff";
      c.lineWidth = 0.9;
      c.stroke();
    }
    c.restore();
  }
  function fence(c, a, b) {
    const distance = Math.hypot(b[0] - a[0], b[1] - a[1]),
      n = Math.max(1, Math.ceil(distance / 36));
    c.save();
    for (const h of [12, 24]) {
      P.line(
        c,
        [
          [a[0], a[1] - h],
          [b[0], b[1] - h],
        ],
        "#4d392b",
        5,
      );
      P.line(
        c,
        [
          [a[0], a[1] - h - 1],
          [b[0], b[1] - h - 1],
        ],
        "#b19056",
        2,
      );
    }
    for (let i = 0; i <= n; i++) {
      const x = a[0] + ((b[0] - a[0]) * i) / n,
        y = a[1] + ((b[1] - a[1]) * i) / n;
      P.oval(c, x + 2, y + 1, 5, 2, "#2932233d");
      c.fillStyle = MataArte.pattern(c, 6, 78);
      c.fillRect(x - 3.5, y - 34, 7, 36);
      P.line(
        c,
        [
          [x - 3, y - 33],
          [x - 3, y],
        ],
        "#e4c387",
        1,
      );
      P.oval(c, x, y - 34, 4, 1.5, "#dcc189");
      P.oval(c, x, y - 14, 1, 1, "#483d2e");
    }
    c.restore();
  }
  function tree(c, x, y, height, growth, time = 0, seed = 0, reduced = false) {
    if (!BosqueVegetacao.ready)
      return old.tree(c, x, y, height, growth, time, seed, reduced);
    const g = P.ease(growth),
      s = height / 100;
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    P.oval(c, 4, 3, 27 + g * 16, 7 + g * 4, "#19251c37");
    BosqueVegetacao.draw(
      c,
      "vegetacao",
      seed === 810 ? 3 : Math.floor(seed) % 4 === 0 ? 0 : 1,
      0,
      1,
      84 + g * 6,
    );
    if (g > 0.015) {
      c.save();
      c.translate(0, -33);
      c.rotate(reduced ? 0 : Math.sin(time * 0.83 + seed) * 0.014 * g);
      BosqueVegetacao.draw(
        c,
        "vegetacao",
        4 + (Math.abs(Math.floor(seed)) % 3),
        0,
        0,
        72 * P.ease(g),
      );
      c.restore();
      if (g > 0.4) BosqueVegetacao.draw(c, "vegetacao", 8, 0, 3, 14 * g);
    }
    c.restore();
  }
  function bridge(c, points) {
    if (!MataArte.ready) return old.bridge(c, points);
    const xs = points.map((p) => p[0]),
      ys = points.map((p) => p[1]),
      x = Math.min(...xs),
      y = Math.min(...ys),
      w = Math.max(...xs) - x,
      h = Math.max(...ys) - y;
    c.save();
    P.poly(c, points);
    c.fillStyle = "#342c22";
    c.fill();
    c.shadowColor = "#181c2077";
    c.shadowBlur = 8;
    c.shadowOffsetY = 5;
    c.fillStyle = MataArte.pattern(c, 6, 120);
    c.fill();
    c.shadowBlur = 0;
    c.shadowOffsetY = 0;
    c.clip();
    for (let px = x + 7; px < x + w; px += 13) {
      P.line(
        c,
        [
          [px, y],
          [px, y + h],
        ],
        "#39291f88",
        1.5,
      );
      P.oval(c, px + 3, y + 4, 1, 1, "#2b2c29");
      P.oval(c, px + 3, y + h - 4, 1, 1, "#2b2c29");
    }
    c.restore();
    // Só a borda norte é desenhada aqui; a sul entra na ordenação por profundidade.
    rail(c, x, y, w);
  }
  function rail(c, x, y, w) {
    for (let px = x + 3; px < x + w; px += Math.max(34, (w - 6) / 3)) {
      P.line(
        c,
        [
          [px, y + 2],
          [px, y - 21],
        ],
        "#503e27",
        5,
      );
      P.line(
        c,
        [
          [px - 1, y],
          [px - 1, y - 20],
        ],
        "#b78d4d",
        2,
      );
      P.oval(c, px, y - 22, 3.2, 1.5, "#d3b477");
    }
    c.save();
    c.strokeStyle = "#c4a76d";
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(x + 3, y - 15);
    c.quadraticCurveTo(x + w / 2, y - 6, x + w - 3, y - 15);
    c.stroke();
    c.restore();
  }
  Object.assign(P, { terrain, trail, water, tree, bridge, fence });
  window.MataPintura = { rail, trails };
})();
