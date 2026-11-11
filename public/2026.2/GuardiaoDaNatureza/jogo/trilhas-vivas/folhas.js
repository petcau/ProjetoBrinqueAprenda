"use strict";
(() => {
  const base = new URL("./", document.currentScript.src),
    images = [],
    particles = Array.from({ length: 24 }, (_, i) => ({
      x: ((i * 317 + 53) % 997) / 997,
      y: ((i * 127 + 41) % 541) / 541,
      size: 22 + (i % 5) * 3,
      speed: 0.035 + (i % 4) * 0.006,
      spin: i * 1.7,
      frame: i % 3,
    })),
    bursts = [];
  let canvas,
    ctx,
    raf = 0,
    last = 0,
    time = 0,
    active = false,
    ready = false,
    w = 0,
    h = 0,
    ratio = 1,
    burstCount = 0,
    burstAt = -999,
    targetX = 0,
    targetY = 0,
    px = 0,
    py = 0,
    home;
  function resize() {
    w = innerWidth;
    h = innerHeight;
    ratio = Math.min(
      devicePixelRatio || 1,
      Raizes.prefs().graphicsQuality === "leve" ? 1 : 1.5,
    );
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  function burst(target) {
    if (
      !ready ||
      BrisaArte.reduced() ||
      Raizes.prefs().fallingLeaves === false ||
      performance.now() - burstAt < 360
    )
      return;
    burstAt = performance.now();
    const r = target.getBoundingClientRect();
    for (let i = 0; i < 5; i++)
      bursts.push({
        x: r.x + r.width * (0.24 + (i % 3) * 0.25),
        y: r.y + r.height * 0.45,
        vx: (i % 2 ? 1 : -1) * (18 + i * 8),
        vy: -35 - (i % 3) * 12,
        age: 0,
        ttl: 1.7,
        size: 21 + (i % 3) * 3,
        spin: i,
        frame: i % 3,
      });
    if (bursts.length > 15) bursts.splice(0, bursts.length - 15);
    burstCount++;
  }
  function draw(p, x, y, a, alpha, squeeze = 1) {
    const im = images[p.frame];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.scale(squeeze, 1);
    ctx.globalAlpha = alpha;
    ctx.drawImage(im, -p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  }
  function frame(now) {
    raf = 0;
    if (document.hidden) return;
    const dt = Math.min(0.04, last ? (now - last) / 1000 : 0);
    last = now;
    active =
      ready &&
      document.body.dataset.view === "inicio" &&
      !document.querySelector("dialog[open]");
    canvas.hidden = !active;
    if (active) {
      time += dt;
      home ||= document.querySelector(".home-landscape");
      px += (targetX - px) * (1 - Math.exp(-dt * 6));
      py += (targetY - py) * (1 - Math.exp(-dt * 6));
      if (home && !BrisaArte.reduced())
        home.style.transform = `translate3d(${px * 5}px,${py * 3}px,0) scale(1.018)`;
      ctx.clearRect(0, 0, w, h);
      if (Raizes.prefs().fallingLeaves !== false && !BrisaArte.reduced()) {
        const n =
          Raizes.prefs().graphicsQuality === "leve" ? 10 : w < 900 ? 16 : 24;
        for (let i = 0; i < n; i++) {
          const p = particles[i];
          p.y += p.speed * dt;
          if (p.y > 1.09) {
            p.y = -0.09;
            p.x = (p.x + 0.37) % 1;
          }
          draw(
            p,
            (p.x + Math.sin(time * 0.5 + i) * 0.035) * w + px * 4,
            p.y * h,
            p.spin + time * (i % 2 ? 0.35 : -0.28),
            0.65 + (i % 3) * 0.09,
            0.7 + Math.abs(Math.cos(time * 0.6 + i)) * 0.3,
          );
        }
        for (let i = bursts.length - 1; i >= 0; i--) {
          const p = bursts[i];
          p.age += dt;
          p.x += p.vx * dt;
          p.vy += 48 * dt;
          p.y += p.vy * dt;
          draw(
            p,
            p.x,
            p.y,
            p.spin + p.age * 0.9,
            Math.min(1, (p.ttl - p.age) * 2),
          );
          if (p.age >= p.ttl) bursts.splice(i, 1);
        }
      }
    } else {
      bursts.length = 0;
      last = 0;
    }
    // Fora da abertura não há trabalho de canvas; a mesma rotina retoma ao voltar.
    if (active) raf = requestAnimationFrame(frame);
  }
  function start() {
    if (!raf && !document.hidden) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    canvas = document.createElement("canvas");
    canvas.id = "falling-leaves";
    canvas.setAttribute("aria-hidden", "true");
    document.body.append(canvas);
    ctx = canvas.getContext("2d");
    resize();
    Promise.all(
      [0, 1, 2].map(async (i) => {
        const im = new Image();
        im.src = new URL("assets/folha-" + i + ".webp", base);
        await im.decode();
        images[i] = im;
      }),
    )
      .then(() => {
        ready = true;
        start();
      })
      .catch(() => {});
    home = document.querySelector(".home-landscape");
    setTimeout(() => {
      for (const button of document.querySelectorAll(".home-menu a")) {
        const face = document.createElement("span");
        face.className = "drifting-face";
        face.append(...button.childNodes);
        button.append(face);
      }
    }, 0);
    const area = document.querySelector(".home");
    area?.addEventListener(
      "pointermove",
      (e) => {
        if (BrisaArte.reduced()) return;
        targetX = (e.clientX / w - 0.5) * 2;
        targetY = (e.clientY / h - 0.5) * 2;
      },
      { passive: true },
    );
    area?.addEventListener("pointerleave", (e) => {
      if (e.pointerType !== "touch") targetX = targetY = 0;
    });
    for (const b of document.querySelectorAll(".home-menu a,.home-settings")) {
      b.addEventListener("pointerenter", (e) => {
        if (e.pointerType !== "touch") burst(b);
      });
      b.addEventListener("pointerdown", () => burst(b));
      b.addEventListener("focus", () => burst(b));
    }
    area?.addEventListener(
      "pointerdown",
      (e) => {
        if (e.target.closest("a,button")) return;
        targetX = (e.clientX / w - 0.5) * 2;
        targetY = (e.clientY / h - 0.5) * 2;
        burst({
          getBoundingClientRect: () => ({
            x: e.clientX - 25,
            y: e.clientY - 12,
            width: 50,
            height: 24,
          }),
        });
      },
      { passive: true },
    );
    window.VivaFolhas = {
      canvas,
      burst,
      state: () => ({
        active:
          active &&
          Raizes.prefs().fallingLeaves !== false &&
          !BrisaArte.reduced(),
        time,
        count:
          Raizes.prefs().graphicsQuality === "leve"
            ? 10
            : innerWidth < 900
              ? 16
              : 24,
        burstCount,
        burstParticles: bursts.length,
        parallax: [px, py],
      }),
    };
    new MutationObserver(start).observe(document.body, {
      attributes: true,
      attributeFilter: ["data-view", "class"],
    });
    window.addEventListener("resize", resize);
    window.addEventListener("guardiao:preferencias", () => {
      resize();
      if (BrisaArte.reduced() && home) home.style.transform = "";
      start();
    });
    window.addEventListener("pagehide", () => {
      cancelAnimationFrame(raf);
      raf = 0;
    });
    window.addEventListener("pageshow", start);
    document.addEventListener("visibilitychange", start);
  });
})();
