"use strict";
(() => {
  const A = RaizesPersonagens,
    draw = A.draw,
    scale = 1.32,
    phase = location.pathname.includes("floresta-viva")
      ? 1
      : Number(new URLSearchParams(location.search).get("fase") || 2);
  function face(p) {
    const npc =
      phase === 1
        ? { x: 245, y: 245 }
        : window.GuardiaoFasesJogaveis?.[phase]?.npcPosition;
    if (npc && !p.moving && Math.hypot(p.x - npc.x, p.y - npc.y) < 100)
      return {
        ...p,
        direction:
          (Math.round(-Math.atan2(npc.y - p.y, npc.x - p.x) / (Math.PI / 4)) +
            8) %
          8,
      };
    return p;
  }
  A.draw = function (ctx, name, index, x, y, height, options = {}) {
    return draw(
      ctx,
      name,
      index,
      x,
      y,
      ctx.canvas.id === "cenario" &&
        ["kai", "mangueira", "acoes", "npcs"].includes(name)
        ? height * scale
        : height,
      options,
    );
  };
  const Life = GuardiaoVidaNatural;
  window.GuardiaoVidaNatural = class extends Life {
    ground(ctx, p, ...rest) {
      return super.ground(ctx, face(p), ...rest);
    }
    flora(ctx, f, p, time, reduced) {
      p = face(p);
      const npc =
        phase === 1
          ? { x: 245, y: 245 }
          : GuardiaoFasesJogaveis[phase].npcPosition;
      const near = Math.hypot(p.x - npc.x, p.y - npc.y) < 130;
      if (["ombro", "pousando"].includes(f.mode)) {
        const back = p.direction >= 3 && p.direction <= 5 ? 1 : -1;
        return A.owl(
          ctx,
          p.x + back * 28,
          p.y - 51,
          29,
          reduced ? 0 : time,
          "ombro",
          back === 1,
        );
      }
      return A.owl(
        ctx,
        near ? p.x + (p.x > npc.x ? 48 : -48) : f.x,
        near ? p.y - 94 : f.y - 3,
        39,
        reduced ? 0 : time,
        f.mode === "comemorando" ? "festa" : "voo",
        p.direction >= 3 && p.direction <= 5,
      );
    }
  };
  if (window.GuardiaoAgua) {
    const Water = GuardiaoAgua;
    window.GuardiaoAgua = class extends Water {
      nozzle(p, ...rest) {
        const q = super.nozzle(p, ...rest);
        return { x: p.x + (q.x - p.x) * scale, y: p.y + (q.y - p.y) * scale };
      }
    };
  }
  const Art = GuardiaoAdventureArt;
  window.GuardiaoAdventureArt = class extends Art {
    actors() {
      return [];
    }
    outfit(ctx, p, ...rest) {
      return super.outfit(ctx, face(p), ...rest);
    }
    draw(ctx, name, index, x, y, height, ...rest) {
      return super.draw(
        ctx,
        name,
        index,
        x,
        y,
        /^(traje-|kai-acoes)/.test(name) && ctx.canvas.id === "cenario"
          ? height * scale
          : height,
        ...rest,
      );
    }
  };
  if (window.GuardiaoCampaignSprites) {
    const Sprites = GuardiaoCampaignSprites;
    window.GuardiaoCampaignSprites = class extends Sprites {
      draw(ctx, name, index, x, y, height, ...rest) {
        return super.draw(
          ctx,
          name,
          index,
          x,
          y,
          ctx.canvas.id === "cenario" &&
            ["kai-rio", "kai-plantio", "kai-nadando"].includes(name)
            ? height * scale
            : height,
          ...rest,
        );
      }
    };
  }
  const Forest = FlorestaSprites;
  window.FlorestaSprites = class extends Forest {
    draw(ctx, name, index, x, y, height, ...rest) {
      return super.draw(
        ctx,
        name,
        index,
        x,
        y,
        ctx.canvas.id === "cenario" && name === "kai-cuidados" && index < 6
          ? height * scale
          : height,
        ...rest,
      );
    }
  };
  const Colar = GuardiaoColar;
  window.GuardiaoColar = class extends Colar {
    chest(ctx, p, ...rest) {
      return super.chest(ctx, { ...p, y: p.y - 10 }, ...rest);
    }
  };
  function label(ctx, text, x, y, view, width, height) {
    const s = view.s,
      font = 12.5 / s,
      npc =
        phase === 1
          ? { x: 245, y: 245 }
          : GuardiaoFasesJogaveis[phase].npcPosition;
    const npcLabel = Math.abs(x - npc.x) < 8 && Math.abs(y - (npc.y - 73)) < 15;
    if (npcLabel) y -= 21;
    ctx.font = `600 ${font}px system-ui`;
    ctx.textAlign = "center";
    const max = Math.min(270, width - 30) / s,
      words = text.split(" "),
      lines = [""];
    for (const word of words) {
      const i = lines.length - 1,
        v = lines[i] + " " + word;
      if (ctx.measureText(v.trim()).width > max && lines[i]) lines.push(word);
      else lines[i] = v.trim();
    }
    const w =
        Math.min(max, Math.max(...lines.map((l) => ctx.measureText(l).width))) +
        20 / s,
      h = (lines.length * 16 + 12) / s;
    ({ x, y } = GuardiaoEtiquetas.position(x, y, w, view, width, height));
    // Se a HUD empurra o nome para cima do rosto, use o espaço abaixo dos pés.
    if (
      npcLabel &&
      y + 9 / s > npc.y - 65 * scale - 8 / s &&
      y - h < npc.y + 10 / s
    )
      ({ x, y } = GuardiaoEtiquetas.position(
        npc.x,
        npc.y + h + 10 / s,
        w,
        view,
        width,
        height,
      ));
    ctx.save();
    ctx.fillStyle = "#f3e6bddd";
    ctx.strokeStyle = "#8d6a36";
    ctx.lineWidth = 1.5 / s;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h + 9 / s, w, h, 8 / s);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#345437";
    lines.forEach((line, i) =>
      ctx.fillText(line, x, y - h + 26 / s + (i * 16) / s, max),
    );
    ctx.restore();
  }
  window.VivaMundo = { scale, label, phase };
  function quality() {
    const c = document.getElementById("cenario");
    if (!c) return;
    const cap =
        Raizes.prefs().graphicsQuality === "leve"
          ? 1
          : Raizes.prefs().graphicsQuality === "alta"
            ? 2
            : 1.5,
      p = Math.min(devicePixelRatio || 1, cap),
      w = Math.round(innerWidth * p),
      h = Math.round(innerHeight * p);
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
      c.getContext("2d").setTransform(p, 0, 0, p, 0, 0);
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    const apply = () => requestAnimationFrame(quality);
    window.addEventListener("resize", apply);
    window.addEventListener("guardiao:preferencias", apply);
    apply();
  });
})();
