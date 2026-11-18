"use strict";
// Elementos do cenário: a mesma árvore cresce no mesmo ponto do terreno.
(() => {
  const TAU = Math.PI * 2;
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const ease = (v) => {
    v = clamp(v);
    return v * v * (3 - 2 * v);
  };
  function random(seed) {
    return () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function mix(a, b, t) {
    const c = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const x = c(a),
      y = c(b);
    t = clamp(t);
    return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(",")})`;
  }
  function poly(c, points) {
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
  }
  function oval(c, x, y, rx, ry, color) {
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), 0, 0, TAU);
    c.fill();
  }
  function line(c, points, color, width) {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineJoin = c.lineCap = "round";
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
  }
  function leaf(c, x, y, size, angle, color) {
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(-size * 0.5, 0);
    c.bezierCurveTo(
      -size * 0.1,
      -size * 0.7,
      size * 0.5,
      -size * 0.4,
      size * 0.6,
      0,
    );
    c.bezierCurveTo(
      size * 0.1,
      size * 0.45,
      -size * 0.2,
      size * 0.45,
      -size * 0.5,
      0,
    );
    c.fill();
    line(
      c,
      [
        [-size * 0.4, 0],
        [size * 0.5, 0],
      ],
      "#e0eaa455",
      Math.max(0.5, size * 0.04),
    );
    c.restore();
  }
  // Branch length and individual leaf scales change continuously; no healthy-map bitmap.
  function tree(c, x, y, height, growth, time = 0, seed = 0, muted = false) {
    const g = ease(growth),
      r = random(seed + 83),
      sway = muted ? 0 : Math.sin(time * 1.1 + seed) * 0.014;
    c.save();
    c.translate(x, y);
    c.rotate(sway * (0.3 + g));
    c.scale(height / 100, height / 100);
    oval(c, 3, 2, 28 + g * 12, 8, "#26352726");
    if (window.BosqueVegetacao?.ready) {
      BosqueVegetacao.draw(
        c,
        "vegetacao",
        seed === 810 ? 3 : 1,
        0,
        0,
        43 + g * 43,
      );
      const buds = [
        [-21, -48, 33],
        [-30, -63, 37],
        [25, -52, 38],
        [21, -75, 42],
        [0, -86, 44],
      ];
      for (let i = 0; i < buds.length; i++) {
        const [bx, by, h] = buds[i],
          bud = ease((g - i * 0.035) / 0.84);
        if (bud > 0.004)
          BosqueVegetacao.draw(
            c,
            "vegetacao",
            4 + (Math.floor(seed) % 3),
            bx * bud,
            by * (0.5 + 0.5 * bud) + h * bud * 0.2,
            h * bud,
          );
      }
      if (g > 0.25) BosqueVegetacao.draw(c, "vegetacao", 8, 4, 4, 15 * g);
      c.restore();
      return;
    }
    const h = 32 + g * 38;
    line(
      c,
      [
        [-15, 2],
        [-3, -5],
        [1, -h],
      ],
      "#463c2c",
      9,
    );
    line(
      c,
      [
        [14, 3],
        [2, -7],
        [1, -h],
      ],
      mix("#69513b", "#97683c", g),
      6,
    );
    line(
      c,
      [
        [-1, -4],
        [2, -h],
      ],
      "#c69b5c66",
      1.7,
    );
    for (let i = 0; i < 8; i++) {
      const side = i % 2 ? 1 : -1,
        by = -h * (0.3 + i * 0.075);
      const bx = side * (15 + r() * 22) * (0.45 + g * 0.55),
        yy = by - 12 - r() * 13;
      line(
        c,
        [
          [1, by + 12],
          [bx * 0.55, by],
          [bx, yy],
        ],
        mix("#493e32", "#8b6038", g),
        3.6 - i * 0.18,
      );
      const bud = ease((g - (i % 4) * 0.065) / 0.79);
      if (bud > 0.005) {
        const a = 11 + r() * 10,
          b = 8 + r() * 7;
        oval(c, bx + 2, yy + 2, a * bud, b * bud, "#264f36");
        oval(
          c,
          bx - 2,
          yy - 2,
          a * bud,
          b * bud,
          i % 3 === 0 ? "#6f9e46" : "#4b8342",
        );
        oval(c, bx - 5, yy - 5, a * 0.67 * bud, b * 0.52 * bud, "#a6c96288");
        for (let j = 0; j < 5; j++)
          leaf(
            c,
            bx - a * 0.7 + r() * a * 1.4,
            yy - b * 0.6 + r() * b,
            (6 + r() * 5) * bud,
            r() * 3 - 1.5,
            j % 2 ? "#a1c95e" : "#78aa4b",
          );
      }
    }
    if (g > 0.6)
      for (let j = 0; j < 4; j++)
        leaf(c, -12 + j * 8, -2, 7 * g, j * 0.8, "#7ca84b");
    c.restore();
  }
  function rock(c, x, y, rx, ry) {
    if (
      window.BosqueVegetacao?.ready &&
      BosqueVegetacao.draw(c, "objetos", 4, x, y, ry * 2 + rx * 0.4)
    )
      return;
    oval(c, x + 2, y + 3, rx + 2, ry * 0.65, "#203c3429");
    c.fillStyle = "#717c6c";
    poly(c, [
      [x - rx, y],
      [x - rx * 0.7, y - ry],
      [x + rx * 0.4, y - ry * 1.25],
      [x + rx, y - ry * 0.25],
      [x + rx * 0.7, y + ry * 0.3],
      [x - rx * 0.6, y + ry * 0.3],
    ]);
    c.fill();
    c.fillStyle = "#b7b7a0";
    poly(c, [
      [x - rx, y],
      [x - rx * 0.7, y - ry],
      [x + rx * 0.4, y - ry * 1.25],
      [x + rx * 0.2, y - ry * 0.25],
    ]);
    c.fill();
    line(
      c,
      [
        [x - rx * 0.5, y - ry * 0.6],
        [x, y - ry * 0.85],
        [x + rx * 0.22, y - ry * 0.8],
      ],
      "#dddbc366",
      1,
    );
  }
  function house(c, x, y, w, h, town = false) {
    if (window.BosqueVegetacao?.ready) {
      oval(c, x, y, w * 0.52, 10, "#a49b7144");
      if (
        BosqueVegetacao.draw(
          c,
          "objetos",
          town === 2 ? 3 : town ? 2 : 0,
          x,
          y,
          h * 2.05,
        )
      )
        return;
    }
    oval(c, x + 6, y + 4, w * 0.6, 15, "#273b3130");
    const top = y - h;
    c.fillStyle = town ? "#d5bc8c" : "#b98d58";
    c.fillRect(x - w / 2, top, w, h);
    c.fillStyle = "#8b6740";
    c.fillRect(x + w * 0.24, top, w * 0.26, h);
    line(
      c,
      [
        [x - w / 2, top + h * 0.18],
        [x + w * 0.24, top + h * 0.18],
      ],
      "#f4dc9c77",
      2,
    );
    for (let j = 0; j < 5; j++)
      line(
        c,
        [
          [x - w / 2, top + (j * h) / 5],
          [x + w / 2, top + (j * h) / 5],
        ],
        "#72573855",
        1,
      );
    c.fillStyle = "#4b7053";
    poly(c, [
      [x - w * 0.63, top + 3],
      [x - w * 0.08, top - h * 0.36],
      [x + w * 0.65, top + 2],
      [x + w * 0.22, top + h * 0.14],
    ]);
    c.fill();
    line(
      c,
      [
        [x - w * 0.63, top + 3],
        [x - w * 0.08, top - h * 0.36],
        [x + w * 0.65, top + 2],
      ],
      "#8eaf62",
      3,
    );
    c.fillStyle = "#523e2d";
    c.fillRect(x - 12, y - h * 0.58, 24, h * 0.58);
    c.fillStyle = "#edcd77";
    c.fillRect(x + w * 0.13, y - h * 0.64, w * 0.2, h * 0.28);
    line(
      c,
      [
        [x + w * 0.23, y - h * 0.64],
        [x + w * 0.23, y - h * 0.36],
      ],
      "#795b38",
      2,
    );
    c.fillStyle = "#d9bf76";
    c.beginPath();
    c.arc(x + 5, y - 20, 2, 0, TAU);
    c.fill();
  }
  function fence(c, a, b) {
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 24));
    for (const h of [10, 22])
      line(
        c,
        [
          [a[0], a[1] - h],
          [b[0], b[1] - h],
        ],
        "#785537",
        4,
      );
    for (let i = 0; i <= n; i++) {
      const x = a[0] + ((b[0] - a[0]) * i) / n,
        y = a[1] + ((b[1] - a[1]) * i) / n;
      line(
        c,
        [
          [x, y],
          [x, y - 31],
        ],
        "#5b4730",
        7,
      );
      line(
        c,
        [
          [x - 1, y - 2],
          [x - 1, y - 29],
        ],
        "#bc9356",
        3,
      );
    }
  }
  function bridge(c, p) {
    const x = Math.min(...p.map((p) => p[0])),
      y = Math.min(...p.map((p) => p[1])),
      w = Math.max(...p.map((p) => p[0])) - x,
      h = Math.max(...p.map((p) => p[1])) - y;
    c.fillStyle = "#594e37";
    poly(c, p);
    c.fill();
    for (let a = x + 2; a < x + w; a += 13) {
      c.fillStyle = a % 26 < 13 ? "#bc965e" : "#d0aa6d";
      c.fillRect(a, y + 1, 11, h - 2);
      line(
        c,
        [
          [a + 3, y + 4],
          [a + 6, y + h - 5],
        ],
        "#876b4333",
        1,
      );
    }
    fence(c, [x, y], [x + w, y]);
    fence(c, [x, y + h], [x + w, y + h]);
  }
  function flame(c, x, y, size, time, seed = 0) {
    for (let i = 0; i < 3; i++) {
      const d = i * 2.5,
        h = size * (0.72 + Math.sin(time * 6 + seed + i) * 0.12);
      c.fillStyle = ["#c95024", "#f7a431", "#ffe68b"][i];
      c.beginPath();
      c.moveTo(x - size * 0.25 + d, y);
      c.bezierCurveTo(
        x - size * 0.5,
        y - h * 0.4,
        x + size * 0.15,
        y - h * 0.66,
        x + Math.sin(time * 4 + seed) * size * 0.15,
        y - h + d * 2,
      );
      c.bezierCurveTo(
        x + size * 0.1,
        y - h * 0.42,
        x + size * 0.52 - d,
        y - h * 0.3,
        x + size * 0.25 - d,
        y,
      );
      c.closePath();
      c.fill();
    }
  }
  function water(c, points, health, time, reduced, seed = 0) {
    if (reduced) time = 0;
    c.save();
    poly(c, points);
    c.strokeStyle = "#536b4a";
    c.lineWidth = 12;
    c.stroke();
    c.strokeStyle = "#d9bd7e";
    c.lineWidth = 6;
    c.stroke();
    const grad = c.createLinearGradient(280, 0, 920, 720);
    grad.addColorStop(0, mix("#5c6a50", "#247c8b", health));
    grad.addColorStop(0.5, mix("#84906c", "#4aa9ad", health));
    grad.addColorStop(1, mix("#596c58", "#246e83", health));
    c.fillStyle = grad;
    c.fill();
    c.clip();
    const r = random(seed + 193);
    for (let i = 0; i < 65; i++) {
      const x = r() * 1280,
        y = (r() * 720 + (reduced ? 0 : time * 9)) % 720,
        l = 5 + r() * 17;
      line(
        c,
        [
          [x, y],
          [x + l, y + Math.sin(i + time * 0.8) * 1.5],
        ],
        "#d2f2d35e",
        1,
      );
    }
    c.restore();
  }
  function inside(p, points) {
    let yes = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [x, y] = points[i],
        [xx, yy] = points[j];
      if (y > p.y !== yy > p.y && p.x < ((xx - x) * (p.y - y)) / (yy - y) + x)
        yes = !yes;
    }
    return yes;
  }
  function smoothPoly(c, points) {
    c.beginPath();
    let last = points.at(-1);
    c.moveTo((last[0] + points[0][0]) / 2, (last[1] + points[0][1]) / 2);
    for (let i = 0; i < points.length; i++) {
      const a = points[i],
        b = points[(i + 1) % points.length];
      c.quadraticCurveTo(...a, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    }
    c.closePath();
  }
  function terrain(
    c,
    owner,
    width,
    height,
    sample,
    time,
    dry = [157, 137, 91],
    green = [108, 150, 73],
  ) {
    if (!owner.field) {
      owner.field = document.createElement("canvas");
      owner.field.width = 64;
      owner.field.height = 36;
      owner.fieldAt = -1;
    }
    if (time - owner.fieldAt > 0.12 || time < owner.fieldAt) {
      owner.fieldAt = time;
      const ctx = owner.field.getContext("2d"),
        im = ctx.createImageData(64, 36),
        r = random(194);
      for (let y = 0; y < 36; y++)
        for (let x = 0; x < 64; x++) {
          const k = (y * 64 + x) * 4,
            g = clamp(
              sample(((x + 0.5) * width) / 64, ((y + 0.5) * height) / 36),
            ),
            noise = r() * 9 - 4.5;
          for (let i = 0; i < 3; i++)
            im.data[k + i] = dry[i] + (green[i] - dry[i]) * g + noise;
          im.data[k + 3] = 255;
        }
      ctx.putImageData(im, 0, 0);
    }
    c.imageSmoothingEnabled = true;
    c.drawImage(owner.field, 0, 0, width, height);
  }
  function trail(c, points, width = 34, paved = false) {
    const trace = () => {
      c.beginPath();
      c.moveTo(...points[0]);
      for (let i = 1; i < points.length - 1; i++) {
        const p = points[i],
          n = points[i + 1];
        c.quadraticCurveTo(...p, (p[0] + n[0]) / 2, (p[1] + n[1]) / 2);
      }
      c.lineTo(...points.at(-1));
    };
    c.lineCap = c.lineJoin = "round";
    trace();
    c.strokeStyle = paved ? "#827a60" : "#b19765";
    c.lineWidth = width + 5;
    c.stroke();
    c.strokeStyle = paved ? "#c0b78d" : "#d6be87";
    c.lineWidth = width;
    c.stroke();
  }
  window.BosquePintura = {
    clamp,
    ease,
    random,
    mix,
    poly,
    oval,
    line,
    leaf,
    tree,
    rock,
    house,
    fence,
    bridge,
    flame,
    water,
    inside,
    smoothPoly,
    terrain,
    trail,
  };
})();
