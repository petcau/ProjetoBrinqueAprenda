"use strict";
(() => {
  const R = RaizesPersonagens,
    A = window.VivaArt;
  const still = () =>
    document.body.classList.contains("reduce-motion") ||
    matchMedia("(prefers-reduced-motion:reduce)").matches;
  function breath(t, quiet) {
    return quiet ? 0 : Math.sin(t * 1.8) * 0.8;
  }
  if (A)
    A.meeting = (c, w, h, phase, time, reserve = 42) => {
      A.scenery(c, phase - 1, w, h);
      const quiet = still(),
        t = quiet ? 0 : time,
        hh = Math.min((h - reserve) * 0.88, w * 0.63),
        y = h - reserve - 7,
        kaiHeight = hh * 0.9,
        x = w * 0.33,
        b = breath(t, quiet);
      c.save();
      c.fillStyle = "#332c2522";
      for (const xx of [x, w * 0.76]) {
        c.beginPath();
        c.ellipse(xx, y, hh * 0.18, hh * 0.04, 0, 0, Math.PI * 2);
        c.fill();
      }
      c.save();
      c.translate(x, y);
      c.filter = "saturate(1.1) contrast(1.02)";
      c.rotate(quiet ? 0 : Math.sin(t * 0.85) * 0.005);
      R.draw(c, "acoes", 0, 0, 0, kaiHeight + b);
      // Pés apoiados na capa/ombro de trás; asas recolhidas, rosto de Kai livre.
      const shoulder = { x: -kaiHeight * 0.12, y: -(kaiHeight + b) * 0.565 };
      const pose = ArteVivaPersonagens.frame(0, "ombro", t, 0, quiet);
      const glance =
        !quiet && t % 8 < 6 ? 12 + (t % 4.8 > 4.62 ? 1 : 0) : pose.index;
      R.draw(c, "flora", glance, shoulder.x, shoulder.y, hh * 0.32, {
        angle: quiet ? 0 : Math.sin(t * 1.2) * 0.025,
      });
      c.restore();
      const listening = quiet || Math.sin(t * 0.7 + phase) < 0.25;
      R.draw(
        c,
        "npcs",
        phase - 1 + (listening ? 5 : 0),
        w * 0.76,
        y,
        hh + breath(t + 0.7, quiet),
      );
      c.restore();
      document.body.dataset.meetingFlora = "ombro";
    };
  // Os NPCs respiram e fazem pequenos gestos sem alterar posição ou colisões.
  const prior = R.draw;
  R.draw = (c, name, index, x, y, height, options = {}) => {
    if (name !== "npcs" || c.canvas.id !== "cenario")
      return prior(c, name, index, x, y, height, options);
    const quiet = still(),
      t = performance.now() / 1000,
      role = index % 5,
      gesture = !quiet && (t + role * 1.3) % 6 > 3;
    c.save();
    c.translate(x, y);
    c.rotate(quiet ? 0 : Math.sin(t * 0.85 + role) * 0.012);
    const result = prior(
      c,
      name,
      quiet ? index : role + (gesture ? 5 : 0),
      0,
      0,
      height + breath(t + role, quiet),
      options,
    );
    c.restore();
    return result;
  };
  const Life = window.GuardiaoVidaNatural;
  if (Life)
    window.GuardiaoVidaNatural = class extends Life {
      flora(c, f, p, t, reduced) {
        if (f.mode !== "ombro" && f.mode !== "fala")
          return super.flora(c, f, p, t, reduced);
        c.save();
        c.translate(0, reduced ? 0 : -breath(t, false) * 0.65);
        const result = super.flora(c, f, p, t, reduced);
        c.restore();
        return result;
      }
    };
})();
