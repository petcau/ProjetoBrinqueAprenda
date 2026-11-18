"use strict";
(() => {
  const A = RaizesPersonagens,
    base = new URL("../vida-natural/assets/", document.currentScript.src);
  const phase = location.pathname.includes("/floresta-viva/")
    ? 1
    : Number(new URLSearchParams(location.search).get("fase") || 2);
  if (window.GuardiaoIcones) {
    const old = GuardiaoIcones;
    window.GuardiaoIcones = {
      ...old,
      markup: (name) => Raizes.icon(name),
    };
  }
  let worldPlayer = { direction: 6, x: 0, y: 0, moving: false, distance: 0 };
  const npc =
    phase === 1
      ? { x: 245, y: 245 }
      : window.GuardiaoFasesJogaveis?.[phase]?.npcPosition;
  function facing(p) {
    if (!document.querySelector("#conversa[open],#intro[open]") || !npc)
      return p;
    return {
      ...p,
      direction:
        (Math.round(-Math.atan2(npc.y - p.y, npc.x - p.x) / (Math.PI / 4)) +
          8) %
        8,
    };
  }
  function hero(ctx, p, time, reduced, height = 63, equipped = false) {
    p = facing(p);
    const y =
      p.y -
      (p.moving && !reduced
        ? Math.abs(Math.sin((p.distance * Math.PI) / 28)) * 0.6
        : 0);
    if (equipped)
      return A.draw(
        ctx,
        "mangueira",
        p.direction * 2 +
          (p.moving && !reduced ? Math.floor(p.distance / 15) % 2 : 0),
        p.x,
        y,
        height,
      );
    if (p.moving)
      return A.draw(
        ctx,
        "kai",
        p.direction * 2 + (reduced ? 0 : Math.floor(p.distance / 15) % 2),
        p.x,
        y,
        height,
      );
    if ([0, 4, 6].includes(p.direction))
      return A.draw(
        ctx,
        "acoes",
        p.direction === 6 ? 1 : 0,
        p.x,
        y,
        height + (reduced ? 0 : Math.sin(time * 1.5) * 0.25),
        { flip: p.direction === 4 },
      );
    return A.draw(ctx, "kai", p.direction * 2, p.x, y, height);
  }
  if (window.GuardiaoAgua) {
    const Previous = GuardiaoAgua;
    window.GuardiaoAgua = class extends Previous {
      nozzle(p, time, reduced = false) {
        const d = A.atlas.mangueira,
          index =
            p.direction * 2 +
            (p.moving && !reduced ? Math.floor(p.distance / 15) % 2 : 0),
          f = d.frames[index],
          point = f.nozzle,
          k = 63 / d.referenceHeight,
          bob =
            p.moving && !reduced
              ? Math.abs(Math.sin((p.distance * Math.PI) / 28)) * 0.6
              : 0;
        return {
          x: p.x + (point[0] - f.pivot[0]) * k,
          y: p.y + (point[1] - f.pivot[1]) * k - bob,
        };
      }
    };
  }
  if (window.GuardiaoVidaNatural) {
    const Previous = GuardiaoVidaNatural;
    window.GuardiaoVidaNatural = class extends Previous {
      async load(onProgress = () => {}) {
        await A.load([
          "kai",
          "flora",
          "npcs",
          "acoes",
          ...(this.phase === 1 ? ["mangueira"] : []),
        ]);
        if (this.phase === 1) {
          const d = GuardiaoVidaAtlas.fogo,
            im = new Image();
          im.src = new URL(d.file, base);
          await im.decode();
          this.images.set("fogo", im);
        }
        if (this.water) await this.water.load();
        if (this.rebirth) await this.rebirth.load();
        this.canopyShadow = new Image();
        this.canopyShadow.src = new URL("sombra-copa.svg", base);
        await this.canopyShadow.decode();
        onProgress();
      }
      draw(ctx, name, index, x, y, height, options = {}) {
        if (name === "flora")
          return A.draw(
            ctx,
            "flora",
            index >= 14 ? 11 : index % 4,
            x,
            y,
            height,
            options,
          );
        return super.draw(ctx, name, index, x, y, height, options);
      }
      ground(ctx, p, ...args) {
        worldPlayer = p;
        return super.ground(ctx, p, ...args);
      }
      walk(ctx, p, time, reduced, equipped = false, height = 63) {
        return hero(ctx, p, time, reduced, height, equipped);
      }
      flora(ctx, f, p, time, reduced) {
        const mode =
          f.mode === "ombro" || f.mode === "pousando"
            ? "ombro"
            : f.mode === "comemorando"
              ? "festa"
              : "voo";
        const h = mode === "ombro" ? 26 : 35;
        A.owl(
          ctx,
          f.x,
          f.y + h * 0.3,
          h,
          reduced ? 0 : time,
          mode,
          p.direction >= 3 && p.direction <= 5,
        );
      }
    };
  }
  if (window.FlorestaSprites) {
    const Previous = FlorestaSprites;
    window.FlorestaSprites = class extends Previous {
      async load(
        onProgress = () => {},
        names = Object.keys(GuardiaoFlorestaAtlas.sheets),
      ) {
        await Promise.all([
          A.load(["kai", "flora", "npcs", "acoes", "mangueira"]),
          super.load(
            onProgress,
            names.filter(
              (n) =>
                ![
                  "carlos",
                  "kai-repouso",
                  "kai-mangueira",
                  "kai-caminhada",
                  "kai-livre",
                  "flora",
                ].includes(n),
            ),
          ),
        ]);
        return this;
      }
      draw(ctx, name, index, x, y, height, options = {}) {
        if (name === "carlos")
          return A.draw(ctx, "npcs", index % 4 > 1 ? 5 : 0, x, y, height, {
            ...options,
            flip: ctx.canvas.id === "cenario" ? worldPlayer.x > x : true,
          });
        if (name === "kai-repouso")
          return hero(
            ctx,
            { ...worldPlayer, x, y, moving: false },
            performance.now() / 1000,
            Raizes.prefs().reduceMotion,
            height,
          );
        if (name === "kai-cuidados" && index >= 6)
          return A.draw(ctx, "acoes", 2, x, y, height, options);
        return super.draw(ctx, name, index, x, y, height, options);
      }
      hose(ctx, direction, frame, x, y, height, options = {}) {
        return A.draw(
          ctx,
          "mangueira",
          direction * 2 + (frame % 2),
          x,
          y,
          height,
          { ...options, flip: false },
        );
      }
    };
  }
  if (window.GuardiaoCampaignSprites) {
    const Previous = GuardiaoCampaignSprites;
    window.GuardiaoCampaignSprites = class extends Previous {
      async load(names, progress = () => {}) {
        await Promise.all([
          A.load(["npcs", "kai", "acoes"]),
          super.load(
            names.filter((n) => !["npcs", "kai-floresta"].includes(n)),
            progress,
          ),
        ]);
        return this;
      }
      draw(ctx, name, index, x, y, height, options = {}) {
        if (name === "npcs")
          return A.draw(
            ctx,
            "npcs",
            Math.floor(index / 3) + (index % 3 ? 5 : 0),
            x,
            y,
            height,
            {
              ...options,
              flip: ctx.canvas.id === "cenario" ? worldPlayer.x > x : true,
            },
          );
        if (name === "kai-floresta")
          return A.draw(ctx, "acoes", 2, x, y, height, options);
        return super.draw(ctx, name, index, x, y, height, options);
      }
      markup(name, index) {
        if (name === "npcs" || name.startsWith("kai-"))
          return '<span aria-hidden="true"></span>';
        return super.markup(name, index);
      }
    };
  }
  if (window.GuardiaoAdventureArt) {
    const Previous = GuardiaoAdventureArt;
    window.GuardiaoAdventureArt = class extends Previous {
      async ensure(name) {
        if (name === "moradores" || name.startsWith("uniforme-")) return;
        return super.ensure(name);
      }
      async load() {
        await Promise.all([
          super.load(),
          A.load(["kai", "flora", "npcs", "acoes"]),
        ]);
      }
      outfit(ctx, p, time, reduced, height = 63) {
        if (this.phase === 2)
          return super.outfit(ctx, p, time, reduced, height);
        return hero(ctx, p, time, reduced, height);
      }
      drawResident(ctx, a, p) {
        const role = a.role ?? a.row % 5,
          pose = a.pose ?? (a.frame % 4 >= 2 ? 1 : 0);
        return A.draw(ctx, "npcs", role + (pose ? 5 : 0), a.x, a.y, a.height, {
          flip: p ? p.x > a.x : false,
        });
      }
    };
  }
  if (window.GuardiaoColar) {
    const Previous = GuardiaoColar;
    window.GuardiaoColar = class extends Previous {
      async load() {
        await Promise.all([
          GuardiaoRelicario.load(),
          A.load(["acoes", "flora"]),
        ]);
      }
      drawActor(ctx, time, x, y, height, celebrate = false) {
        return A.draw(
          ctx,
          "acoes",
          celebrate || time > 5 ? 6 : 1,
          x,
          y,
          height,
        );
      }
    };
  }
})();
