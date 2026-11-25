"use strict";
(() => {
  let canvas,
    c,
    raf = 0,
    last = 0,
    time = 0,
    w = 0,
    h = 0,
    ratio = 1,
    visible = false;
  const reduced = () => document.body.classList.contains("reduce-motion");
  function resize() {
    w = innerWidth;
    h = innerHeight;
    ratio = Math.min(
      devicePixelRatio || 1,
      Raizes.prefs().graphicsQuality === "leve" ? 1 : 1.5,
    );
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
  }
  function frame(now) {
    raf = 0;
    if (
      document.hidden ||
      document.body.dataset.view !== "inicio" ||
      reduced()
    ) {
      visible = false;
      canvas.hidden = true;
      return;
    }
    visible = true;
    canvas.hidden = false;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0);
    last = now;
    time += dt;
    c.setTransform(ratio, 0, 0, ratio, 0, 0);
    c.clearRect(0, 0, w, h);
    // Coordenadas da ilustração, conservando object-fit:cover em qualquer tela.
    const k = Math.max(w / 1672, h / 941),
      ox = (w - 1672 * k) / 2,
      oy = (h - 941 * k) / 2;
    c.translate(ox, oy);
    c.scale(k, k);
    c.save();
    c.beginPath();
    c.moveTo(400, 595);
    c.lineTo(663, 574);
    c.lineTo(1060, 830);
    c.lineTo(920, 941);
    c.lineTo(320, 941);
    c.closePath();
    c.clip();
    for (let i = 0; i < 25; i++) {
      const x = 380 + ((i * 137) % 600),
        y = 620 + ((i * 61) % 335);
      const age = (time * 0.24 + i * 0.137) % 1;
      c.strokeStyle = `rgba(195,255,232,${Math.sin(age * Math.PI) * 0.38})`;
      c.lineWidth = 1.4;
      c.beginPath();
      c.ellipse(
        x + Math.sin(time * 0.5 + i) * 8,
        y,
        8 + age * 25,
        1 + age * 3,
        0,
        0,
        Math.PI,
      );
      c.stroke();
    }
    c.restore();
    // A água da cachoeira se move no cenário, independentemente das folhas.
    for (let i = 0; i < 7; i++) {
      const age = (time * 0.5 + i / 7) % 1,
        x = 590 + i * 9;
      c.strokeStyle = `rgba(228,255,244,${Math.sin(age * Math.PI) * 0.35})`;
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(x, 467 + age * 62);
      c.quadraticCurveTo(x - 4, 493 + age * 62, x - 12, 515 + age * 48);
      c.stroke();
    }
    for (let i = 0; i < 12; i++) {
      const x = 1030 + Math.sin(time * 0.26 + i * 2) * 62,
        y = 430 + Math.cos(time * 0.4 + i * 3) * 62;
      c.globalAlpha = 0.24 + Math.sin(time + i) * 0.19;
      c.fillStyle = "#fff6aa";
      c.beginPath();
      c.arc(x, y, 1.4 + (i % 2) * 0.5, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (!raf && !document.hidden) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    const host = document.querySelector(".backdrop");
    if (!host) return;
    canvas = document.createElement("canvas");
    canvas.id = "home-ambience";
    canvas.setAttribute("aria-hidden", "true");
    host.append(canvas);
    c = canvas.getContext("2d");
    resize();
    new MutationObserver(start).observe(document.body, {
      attributes: true,
      attributeFilter: ["data-view", "class"],
    });
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", start);
    window.addEventListener("pagehide", () => {
      cancelAnimationFrame(raf);
      raf = 0;
    });
    window.addEventListener("pageshow", start);
    window.ArteVivaAmbiente = {
      state: () => ({
        active: visible,
        time,
        renderer: "agua-e-luz-em-camadas",
      }),
    };
    start();
  });
})();
