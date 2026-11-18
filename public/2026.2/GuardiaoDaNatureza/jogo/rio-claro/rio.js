"use strict";
(() => {
  const Previous = GuardiaoAdventureArt,
    base = new URL("./", document.currentScript.src),
    atlas = RioClaroAtlas;
  const clamp = (v) => Math.max(0, Math.min(1, v || 0));
  const smooth = (v) => (v = clamp(v)) * v * (3 - 2 * v);
  const cycles = [
    [0, 1, 2, 3],
    [6, 7, 6, 7],
    [4, 5, 4, 5],
    [6, 7, 6, 7],
    [0, 1, 2, 3],
    [12, 13, 14, 15, 16, 17, 18, 19],
    [12, 13, 14, 15, 16, 17, 18, 19],
    [12, 13, 14, 15, 16, 17, 18, 19],
  ];
  function draw(
    c,
    im,
    d,
    index,
    x,
    y,
    height,
    flip = false,
    head = false,
    alpha = 1,
  ) {
    if (!im?.complete || !im.naturalWidth) return false;
    const f = d.frames[index],
      b = f.bounds,
      pivot = head ? f.head : f.pivot,
      k = height / d.referenceHeight;
    c.save();
    c.globalAlpha *= alpha;
    c.translate(x, y);
    if (flip) c.scale(-1, 1);
    c.drawImage(
      im,
      ...b,
      (b[0] - pivot[0]) * k,
      (b[1] - pivot[1]) * k,
      b[2] * k,
      b[3] * k,
    );
    c.restore();
    return true;
  }
  window.GuardiaoAdventureArt = class extends Previous {
    async load(...args) {
      await super.load(...args);
      if (this.phase !== 2) return;
      this.riverSheets = {};
      // TrilhasRender substitui load() da arte base: os sprites aquáticos devem
      // ser dependências explícitas da fase, nunca depender de um load ancestral.
      await Promise.all([
        this.ensure("traje-acoes"),
        ...Object.entries(atlas).map(async ([name, d]) => {
          const im = new Image();
          im.src = new URL(d.file, base).href;
          await im.decode();
          if (im.naturalWidth !== d.width || im.naturalHeight !== d.height)
            throw Error("Prancha aquática incompatível: " + name);
          this.riverSheets[name] = im;
        }),
        (async () => {
          const im = new Image();
          im.src = new URL(
            "../reencontro/" + ReencontroRioAtlas.file,
            base,
          ).href;
          await im.decode();
          this.careOnLand = im;
        })(),
      ]);
    }
    river(c, p, time, reduced, options = {}) {
      if (this.phase !== 2) return super.river(c, p, time, reduced, options);
      const direction = ((p.direction ?? 6) + 8) % 8,
        progress = clamp(options.progress),
        collecting = options.kind === "trash",
        caring = options.kind === "desprender";
      document.body.dataset.heroDirection = String(direction);
      if (options.dressing) return super.river(c, p, time, reduced, options);
      if (!p.swimming && !options.kind) {
        BosqueKai.walk(c, p, time, reduced, 63, false, "protecao");
        return "traje-andar:" + BosqueKai.pose(p, reduced).step;
      }
      if (!p.swimming && caring) {
        const index =
          (options.problem === "net" ? 0 : 4) +
          Math.min(3, Math.floor(progress * 4));
        draw(
          c,
          this.careOnLand,
          ReencontroRioAtlas,
          index,
          p.x,
          p.y,
          66,
          direction >= 3 && direction <= 5,
        );
        return (document.body.dataset.riverPose =
          "libertar-no-habitat:" + index);
      }
      // A coleta usa poses de corpo flutuante, inclusive quando o objeto está
      // próximo da margem. Não reaproveita a antiga pose de ficar de pé no rio.
      const cycle = cycles[direction],
        step = reduced
          ? 0
          : Math.floor(time * (p.moving ? 6 : 1.6)) % cycle.length,
        index =
          collecting || caring
            ? 8 + Math.min(3, Math.floor(progress * 4))
            : cycle[step],
        flip =
          collecting || caring
            ? direction >= 3 && direction <= 5
            : [1, 4, 5].includes(direction),
        bob = reduced ? 0 : Math.sin(time * 3) * 1.1;
      c.save();
      c.strokeStyle = "#d5fff2b5";
      c.lineWidth = 1;
      for (const [rx, ry, dy] of [
        [26, 6, -7],
        [15, 3, 0],
      ]) {
        c.beginPath();
        c.ellipse(
          p.x,
          p.y + dy,
          rx + (reduced ? 0 : Math.sin(time * 3) * 1.4),
          ry,
          0,
          0,
          Math.PI * 2,
        );
        c.stroke();
      }
      c.restore();
      const drawn = draw(
        c,
        this.riverSheets?.kai,
        atlas.kai,
        index,
        p.x,
        p.y - 25 + bob,
        82,
        flip,
        true,
      );
      document.body.dataset.riverSpriteDrawn = String(drawn);
      return (document.body.dataset.riverPose =
        (caring
          ? "libertar-no-habitat:"
          : collecting
            ? "coletar-na-bolsa:"
            : "kai-nadando:") + index);
    }
    riverTrash(c, sprites, target, p, progress) {
      if (!target || progress < 0.18 || progress > 0.82) return;
      const flip = p.direction >= 3 && p.direction <= 5 ? -1 : 1,
        hand = { x: p.x + 18 * flip, y: p.y - 7 },
        bag = { x: p.x - 8 * flip, y: p.y + 18 },
        leg =
          progress < 0.4
            ? smooth((progress - 0.18) / 0.22)
            : smooth((progress - 0.4) / 0.36),
        a = progress < 0.4 ? target : hand,
        b = progress < 0.4 ? hand : bag;
      c.save();
      c.globalAlpha = 1 - smooth((progress - 0.72) / 0.1);
      sprites.draw(
        c,
        "objetos",
        Number(target.id.replace("lixo", "")) % 4,
        a.x + (b.x - a.x) * leg,
        a.y + (b.y - a.y) * leg,
        21,
      );
      c.restore();
    }
    riverAnimal(
      c,
      t,
      time,
      reduced,
      x = t.position.x,
      y = t.position.y,
      height = 32,
      progress = 0,
    ) {
      if (this.phase !== 2 || !this.riverSheets?.animais)
        return super.riverAnimal(c, t, time, reduced, x, y, height);
      const row = t.type === "turtle" ? 2 : t.id === "peixes2" ? 1 : 0,
        pending = t.status === "pending",
        freed = row * 4 + 2 + (reduced ? 0 : Math.floor(time * 3) % 2),
        trapped = row * 4 + (!reduced && time % 4.2 > 3.93 ? 1 : 0),
        release = pending ? smooth((progress - 0.48) / 0.38) : 1,
        scale =
          (height * 260) /
          Math.max(
            ...atlas.animais.frames
              .slice(row * 4, row * 4 + 4)
              .map((f) => f.bounds[3]),
          );
      if (release < 1)
        draw(
          c,
          this.riverSheets.animais,
          atlas.animais,
          trapped,
          x,
          y,
          scale,
          t.facingRight === false,
          false,
          1 - release,
        );
      if (release > 0)
        draw(
          c,
          this.riverSheets.animais,
          atlas.animais,
          freed,
          x,
          y,
          scale,
          t.facingRight === false,
          false,
          release,
        );
      return true;
    }
  };
  const oldCare = GuardiaoCuidados.draw;
  GuardiaoCuidados.draw = (c, t, ...args) => {
    // Rede, sacola e canudo já fazem parte das novas poses. Evita a segunda
    // caixa geométrica que antes era desenhada por cima do animal.
    if (["fish", "turtle"].includes(t.type)) return;
    return oldCare(c, t, ...args);
  };
})();
