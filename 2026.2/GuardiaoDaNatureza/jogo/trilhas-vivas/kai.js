"use strict";
(() => {
  const base = new URL("../bosque-vivo/", document.currentScript.src),
    atlas = BosqueKaiAtlas,
    images = new Map(),
    loading = new Map();
  const phase = location.pathname.includes("floresta-viva")
    ? 1
    : Number(new URLSearchParams(location.search).get("fase") || 0);
  let uniform = window.GuardiaoMemoria?.read().uniform || "explorador";
  document.addEventListener("guardiao:memoria", (e) => {
    uniform = e.detail.uniform;
  });
  const bankFor = {
    explorador: "explorador",
    protecao: "protecao",
    resgate: "resgate",
    plantio: "plantio",
    voluntario: "voluntario",
  };
  function load(names) {
    names ??= [
      "explorador",
      "equipamentos",
      ...(phase >= 3 ? ["tarefas"] : []),
      ...(phase === 1
        ? ["mangueira"]
        : phase > 1
          ? [GuardiaoMemoria.phaseUniform(phase)]
          : []),
    ];
    if (phase > 1) names = names.filter((name) => name !== "mangueira");
    return Promise.all([
      ...names.map((name) => {
        if (!atlas[name]) return Promise.resolve();
        if (!loading.has(name))
          loading.set(
            name,
            (async () => {
              const im = new Image();
              im.src = new URL(atlas[name].file, base);
              await im.decode();
              if (
                im.naturalWidth !== atlas[name].width ||
                im.naturalHeight !== atlas[name].height
              )
                throw Error("Prancha de Kai inválida: " + name);
              images.set(name, im);
            })(),
          );
        return loading.get(name);
      }),
      ...(window.BosqueVegetacao ? [BosqueVegetacao.load()] : []),
    ]);
  }
  function draw(
    c,
    name,
    index,
    x,
    y,
    height,
    { flip = false, alpha = 1 } = {},
  ) {
    const d = atlas[name],
      im = images.get(name);
    if (!d || !im) return false;
    const f =
        d.frames[
          ((index % d.frames.length) + d.frames.length) % d.frames.length
        ],
      b = f.bounds,
      k = height / d.referenceHeight;
    c.save();
    c.globalAlpha *= Math.max(0, Math.min(1, alpha));
    c.translate(x, y);
    if (flip) c.scale(-1, 1);
    c.drawImage(
      im,
      ...b,
      (b[0] - f.pivot[0]) * k,
      (b[1] - f.pivot[1]) * k,
      b[2] * k,
      b[3] * k,
    );
    c.restore();
    return true;
  }
  const views = [
    [0, false],
    [1, false],
    [2, false],
    [1, true],
    [0, true],
    [3, false],
    [4, false],
    [3, true],
  ];
  function pose(p, reduced) {
    const [row, flip] = views[p.direction ?? 6];
    return {
      row,
      flip,
      step: p.moving && !reduced ? Math.floor(p.distance / 10) % 6 : 1,
    };
  }
  function walk(c, p, time, reduced, height = 63, equipped = false, forced) {
    if (c.canvas.id === "cenario" && !p.moving && !equipped) {
      const npc =
        phase === 1
          ? { x: 245, y: 245 }
          : window.GuardiaoFasesJogaveis?.[phase]?.npcPosition;
      if (npc && Math.hypot(p.x - npc.x, p.y - npc.y) < 100)
        p = {
          ...p,
          direction:
            (Math.round(-Math.atan2(npc.y - p.y, npc.x - p.x) / (Math.PI / 4)) +
              8) %
            8,
        };
    }
    const bank = equipped
        ? "mangueira"
        : bankFor[forced || uniform] || "explorador",
      v = pose(p, reduced);
    const name = images.has(bank) ? bank : "explorador",
      h = c.canvas.id === "cenario" ? height * 1.32 : height;
    const idle = p.moving || reduced ? 0 : Math.sin(time * 1.7) * 0.35;
    if (c.canvas.id === "cenario") {
      document.body.dataset.kaiUniform = name;
      document.body.dataset.kaiWalkFrame = String(v.step);
      document.body.dataset.kaiWalkDirection = String(p.direction);
    }
    return draw(c, name, v.row * 6 + v.step, p.x, p.y, h + idle, {
      flip: v.flip,
    });
  }
  function equipment(c, row, progress, x, y, height = 83, flip = false) {
    return draw(
      c,
      "equipamentos",
      row * 6 +
        Math.min(5, Math.floor(Math.max(0, Math.min(0.999, progress)) * 6)),
      x,
      y,
      height,
      { flip },
    );
  }
  const Life = window.GuardiaoVidaNatural;
  if (Life)
    window.GuardiaoVidaNatural = class extends Life {
      async load(...args) {
        if (this.rebirth) this.rebirth.load = async () => {};
        await Promise.all([super.load(...args), load()]);
        // Sombras pertencem às árvores reais do cenário, não à pintura antiga.
        this.canopyShadow = null;
      }
      walk(c, p, time, reduced, equipped = false, height = 63) {
        return walk(c, p, time, reduced, height, equipped);
      }
    };
  const Art = window.GuardiaoAdventureArt;
  if (Art)
    window.GuardiaoAdventureArt = class extends Art {
      async load() {
        await Promise.all([super.load(), load()]);
      }
      outfit(c, p, time, reduced, height = 63) {
        return walk(c, p, time, reduced, height);
      }
      river(c, p, time, reduced, options = {}) {
        if (options.dressing || options.kind || p.swimming)
          return super.river(c, p, time, reduced, options);
        walk(c, p, time, reduced, 63, false, "protecao");
        return "traje-andar:" + pose(p, reduced).step;
      }
    };
  if (window.FlorestaSprites) {
    const Forest = FlorestaSprites;
    window.FlorestaSprites = class extends Forest {
      hose(c, direction, frame, x, y, height = 63) {
        return walk(
          c,
          { x, y, direction, moving: false, distance: 0 },
          performance.now() / 1000,
          false,
          height,
          true,
        );
      }
    };
  }
  // Hose and hands share an anchor, including the reflected left-facing views.
  if (window.GuardiaoAgua) {
    const Water = GuardiaoAgua;
    window.GuardiaoAgua = class extends Water {
      nozzle(p, time, reduced) {
        const v = pose(p, reduced),
          d = atlas.mangueira;
        if (!d) return super.nozzle(p, time, reduced);
        const f = d.frames[v.row * 6 + v.step],
          point = f.nozzle,
          k = (63 * 1.32) / d.referenceHeight;
        return {
          x: p.x + (v.flip ? -1 : 1) * (point[0] - f.pivot[0]) * k,
          y: p.y + (point[1] - f.pivot[1]) * k,
        };
      }
    };
  }
  function task(c, row, progress, p, target, height = 83) {
    const flip = target ? target.x < p.x : p.direction >= 3 && p.direction <= 5;
    document.body.dataset.kaiAction = String(row);
    document.body.dataset.kaiUniform = {
      0: "resgate",
      1: "plantio",
      2: "plantio",
      3: "voluntario",
    }[row];
    draw(
      c,
      "tarefas",
      row * 6 + Math.min(5, Math.floor(Math.min(0.999, progress) * 6)),
      p.x,
      p.y,
      height,
      { flip },
    );
    if (row === 2 && progress > 0.25 && progress < 0.85 && target) {
      const x = p.x + (flip ? -1 : 1) * 23,
        y = p.y - 17;
      for (let i = 0; i < 7; i++) {
        const t = (performance.now() / 700 + i / 7) % 1;
        BosquePintura.oval(
          c,
          x + (target.x - x) * t,
          y + (target.y - y) * t - t * (1 - t) * 11,
          1.2,
          2,
          "#8ddce7",
        );
      }
    }
  }
  function uniformMarkup(name) {
    return `<svg class="bosque-uniform" viewBox="${BosqueTrajes[name].join(" ")}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><image href="${new URL("assets/trajes-mini.webp", base)}" width="600" height="160"/></svg>`;
  }
  if (window.RaizesPersonagens) {
    const A = RaizesPersonagens,
      priorLoad = A.load,
      priorDraw = A.draw;
    A.load = (names = ["kai", "flora", "npcs", "acoes"]) =>
      Promise.all([
        priorLoad(names.filter((n) => n !== "kai" && n !== "mangueira")),
        ...(names.includes("kai") || names.includes("mangueira")
          ? [
              load([
                "explorador",
                ...(names.includes("mangueira") ? ["mangueira"] : []),
              ]),
            ]
          : []),
      ]);
    A.draw = (c, name, index, x, y, height, options = {}) =>
      name === "kai" && images.has("explorador")
        ? walk(
            c,
            {
              x,
              y,
              direction: Math.floor(index / 2) % 8,
              moving: true,
              distance: (performance.now() / 1000) * 62,
            },
            performance.now() / 1000,
            document.body.classList.contains("reduce-motion"),
            height,
            false,
            "explorador",
          )
        : priorDraw(c, name, index, x, y, height, options);
  }
  window.BosqueKai = {
    base,
    atlas,
    images,
    load,
    draw,
    equipment,
    task,
    walk,
    pose,
    uniformMarkup,
    state: () => ({ uniform, loaded: [...images.keys()], frames: 6 }),
  };
})();
