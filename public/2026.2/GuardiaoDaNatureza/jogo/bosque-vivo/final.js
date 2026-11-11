"use strict";
(() => {
  const A = VivaArt,
    $ = (id) => document.getElementById(id),
    seen = "guardiao.viva.final.v1";
  let active = false,
    elapsed = 0,
    last = 0,
    finished = false,
    loading = false;
  const path = [
      [255, 160],
      [288, 173],
      [320, 196],
      [342, 224],
      [360, 254],
      [396, 286],
      [422, 313],
      [452, 326],
    ],
    lengths = path
      .slice(1)
      .map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1])),
    total = lengths.reduce((a, b) => a + b, 0),
    clamp = (n) => Math.max(0, Math.min(1, n)),
    ease = (n) => {
      n = clamp(n);
      return n * n * (3 - 2 * n);
    };
  function position(t) {
    let distance = clamp(t) * total;
    for (let i = 0; i < lengths.length; i++) {
      if (distance <= lengths[i] || i === lengths.length - 1) {
        const a = path[i],
          b = path[i + 1],
          k = Math.min(1, distance / lengths[i]);
        return {
          x: a[0] + (b[0] - a[0]) * k,
          y: a[1] + (b[1] - a[1]) * k,
          direction:
            (Math.round(-Math.atan2(b[1] - a[1], b[0] - a[0]) / (Math.PI / 4)) +
              8) %
            8,
        };
      }
      distance -= lengths[i];
    }
  }
  function restore(amount) {
    BosqueMapa.finalGrowth(amount);
    $("tree-restoration").innerHTML = "";
  }

  function caption() {
    const line =
      elapsed < 7
        ? "Kai e Flora seguem pelo caminho até a Árvore Guardiã."
        : elapsed < 9
          ? "Os cinco cristais guardam cada cuidado."
          : elapsed < 17
            ? "A árvore recebe essa força. A vida volta a crescer."
            : "Conseguimos, juntos.";
    $("ending-title").textContent =
      elapsed < 9
        ? "O coração da ilha"
        : elapsed < 17
          ? "A floresta volta a florescer."
          : "Um novo amanhecer.";
    $("ending-line").textContent = line;
    document.body.dataset.finaleScene =
      elapsed < 7
        ? "caminho"
        : elapsed < 9
          ? "colar"
          : elapsed < 17
            ? "restauracao"
            : "celebracao";
  }
  function complete() {
    if (finished) return;
    finished = true;
    elapsed = 21;
    restore(1);
    try {
      localStorage.setItem(seen, "visto");
    } catch {}
    document.body.dataset.endingState = "concluido";
    $("tree-state").textContent = "Árvore Guardiã restaurada";
    $("credits-necklace").innerHTML = GuardiaoRelicario.necklace(
      [1, 2, 3, 4, 5],
      "credits",
    );
    if (!$("final-credits").open) $("final-credits").showModal();
  }
  function paint(c, w, h, time) {
    if (!active) return;
    if (last && !finished) elapsed += Math.max(0, Math.min(0.07, time - last));
    last = time;
    const p = position(elapsed / 7),
      scale = w / 1000,
      hh = 72;
    c.save();
    c.scale(scale, scale);
    c.fillStyle = "#17392d35";
    c.beginPath();
    c.ellipse(p.x, p.y, 17, 4, 0, 0, Math.PI * 2);
    c.fill();
    const amount = clamp((elapsed - 9) / 8);
    restore(amount);
    if (elapsed > 8 && elapsed < 18) {
      const glow = c.createRadialGradient(510, 265, 0, 510, 265, 115);
      glow.addColorStop(
        0,
        `rgba(255,229,147,${0.15 * Math.sin(amount * Math.PI)})`,
      );
      glow.addColorStop(1, "rgba(255,224,153,0)");
      c.fillStyle = glow;
      c.fillRect(395, 150, 230, 230);
      const start = { x: p.x + 22, y: p.y - 68 };
      c.save();
      c.globalAlpha = Math.sin(amount * Math.PI) * 0.8;
      c.strokeStyle = "#ffe6aa";
      c.lineWidth = 1.3;
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.moveTo(start.x, start.y);
        c.bezierCurveTo(start.x + 18, 245 + i * 4, 485, 240 + i * 7, 508, 264);
        c.stroke();
      }
      c.restore();
      for (let i = 0; i < 18; i++) {
        const a = i * 2.399 + elapsed * 0.2,
          r = 18 + ((elapsed * 12 + i * 11) % 87);
        A.draw(
          c,
          "folhas",
          i % 8,
          510 + Math.cos(a) * r,
          278 + Math.sin(a) * r * 0.65,
          6 + (i % 3),
          { alpha: Math.sin(amount * Math.PI) * 0.7, angle: a },
        );
      }
    }
    if (elapsed < 7)
      A.draw(
        c,
        "kai",
        p.direction * 2 + (Math.floor(elapsed * 7) % 2),
        p.x,
        p.y,
        hh,
      );
    else
      A.draw(
        c,
        "final-kai",
        elapsed < 9 ? 0 : elapsed < 17 ? 1 : 3,
        p.x,
        p.y + (elapsed > 17 ? Math.sin(time * 4) * 1.5 : 0),
        hh,
      );
    A.owl(
      c,
      p.x + 48,
      p.y - 83 + Math.sin(time * 2.2) * 3,
      29,
      time,
      elapsed > 17 ? "festa" : "voo",
      true,
    );
    c.restore();
    caption();
    if (elapsed >= 21 && !finished) complete();
  }
  async function start() {
    if (!Raizes.won() || loading || active) return;
    loading = true;
    await Promise.all([
      A.load(["final-kai", "folhas", "kai", "acoes", "flora"]),
    ]);
    loading = false;
    active = true;
    elapsed = 0;
    last = 0;
    finished = false;
    document.body.classList.add("island-ending");
    document.body.dataset.endingState = "na-ilha";
    $("island-finale-caption").hidden = false;
    RaizesApp.refreshMap();
    if (
      Raizes.prefs().reduceMotion ||
      matchMedia("(prefers-reduced-motion:reduce)").matches
    )
      complete();
  }
  function stop() {
    active = false;
    last = 0;
    document.body.classList.remove("island-ending");
    $("island-finale-caption").hidden = true;
    if ($("final-credits").open) $("final-credits").close();
    if (document.body.dataset.view === "mapa") RaizesApp.refreshMap();
  }
  function skip() {
    elapsed = 21;
    complete();
  }
  document.addEventListener("DOMContentLoaded", () => {
    $("ending-skip").onclick = skip;
    $("ending-island").onclick = stop;
    $("final-credits").addEventListener("cancel", (e) => {
      e.preventDefault();
      stop();
    });
    document.addEventListener("visibilitychange", () => (last = 0));
  });
  window.VivaFinal = {
    get active() {
      return active;
    },
    start,
    paint,
    stop,
    skip,
    position,
    state: () => ({
      active,
      elapsed,
      finished,
      scene: document.body.dataset.finaleScene,
      path,
    }),
  };
})();
