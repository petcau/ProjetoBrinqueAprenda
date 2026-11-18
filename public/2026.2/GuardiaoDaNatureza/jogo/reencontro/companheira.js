"use strict";
(() => {
  const A = RaizesPersonagens;
  // Uma única prancha para o voo, o pouso e a decolagem. As asas ficam inteiras.
  A.atlas.flora = {
    ...GuardiaoFloraEncanto,
    file: "../encanto-natural/assets/encanto-flora.webp",
  };
  function owl(
    c,
    x,
    y,
    height,
    time,
    mode = "voo",
    flip = false,
    progress = 0,
  ) {
    const still = document.body.classList.contains("reduce-motion");
    const frame =
      mode === "pousando"
        ? 8 + Math.min(3, Math.floor(progress * 4))
        : mode === "decolando"
          ? 11 - Math.min(3, Math.floor(progress * 4))
          : mode === "ombro" || mode === "fala"
            ? 12 + (!still && time % 5 > 4.72 ? 1 : 0)
            : mode === "festa"
              ? 14 + (!still ? Math.floor(time * 4) % 2 : 0)
              : still
                ? 2
                : Math.floor(time * 9) % 8;
    A.draw(c, "flora", frame, x, y, height, { flip });
    return frame;
  }
  A.owl = owl;
  if (window.VivaArt) VivaArt.owl = owl;
  function direction(p, phase) {
    const visual = document.body.dataset.heroDirection;
    if (!p.moving && /^[0-7]$/.test(visual || "")) return Number(visual);
    const npc =
      phase === 1
        ? { x: 245, y: 245 }
        : window.GuardiaoFasesJogaveis?.[phase]?.npcPosition;
    if (npc && !p.moving && Math.hypot(p.x - npc.x, p.y - npc.y) < 100)
      return (
        (Math.round(-Math.atan2(npc.y - p.y, npc.x - p.x) / (Math.PI / 4)) +
          8) %
        8
      );
    return p.direction ?? 6;
  }
  function shoulder(p, phase) {
    const d = direction(p, phase);
    return {
      x: p.x + (d >= 3 && d <= 5 ? 19 : -19),
      y: p.y - ([1, 2, 3].includes(d) ? 46 : d >= 5 ? 42 : 43),
    };
  }
  function update(f, p, dt, options) {
    const { phase, busy, reward, jump = 0 } = options;
    const rest = phase !== 2 && !p.moving && !busy && !jump && p.idle > 2.5;
    let target;
    if (reward) {
      f.mode = "comemorando";
      target = { x: p.x + 39, y: p.y - 91 };
    } else if (rest) {
      if (!["aproximando", "pousando", "ombro"].includes(f.mode)) {
        f.mode = "aproximando";
        f.elapsed = 0;
      }
      target = shoulder(p, phase);
      if (
        f.mode === "aproximando" &&
        Math.hypot(f.x - target.x, f.y - target.y) < 3
      ) {
        f.mode = "pousando";
        f.elapsed = 0;
      }
      if (f.mode === "pousando" && f.elapsed >= 0.55) f.mode = "ombro";
    } else {
      if (["aproximando", "pousando", "ombro"].includes(f.mode)) {
        f.mode = "decolando";
        f.elapsed = 0;
      }
      if (f.mode !== "decolando" || f.elapsed >= 0.38) f.mode = "voando";
      const d = p.direction ?? 6,
        angle = (-d * Math.PI) / 4;
      target = {
        x: p.x - Math.cos(angle) * 40 - 12,
        y: p.y - 99 - Math.sin(angle) * 14 - jump,
      };
    }
    f.elapsed += dt;
    const k = 1 - Math.exp(-dt * 7);
    f.x += (target.x - f.x) * k;
    f.y += (target.y - f.y) * k;
    if (f.mode === "ombro") Object.assign(f, target);
  }
  const Life = GuardiaoVidaNatural;
  window.GuardiaoVidaNatural = class extends Life {
    flora(c, f, p, time, reduced) {
      const phase = this.phase,
        mode = f.mode;
      const landed = mode === "ombro";
      const blend =
        mode === "pousando"
          ? Math.min(1, f.elapsed / 0.55)
          : mode === "decolando"
            ? 1 - Math.min(1, f.elapsed / 0.38)
            : landed
              ? 1
              : 0;
      const h = 35 - 8 * blend;
      const frame = owl(
        c,
        f.x,
        f.y + (reduced || landed ? 0 : Math.sin(time * 4) * 0.7),
        h,
        reduced ? 0 : time,
        mode === "comemorando"
          ? "festa"
          : ["ombro", "pousando", "decolando"].includes(mode)
            ? mode
            : "voo",
        direction(p, phase) >= 3 && direction(p, phase) <= 5,
        Math.min(1, f.elapsed / (mode === "pousando" ? 0.55 : 0.38)),
      );
      document.body.dataset.floraFrame = String(frame);
    }
  };
  window.FloraCompanheira = { update, shoulder, direction };
})();
