"use strict";
(() => {
  const base = new URL("./", document.currentScript.src),
    atlas = SementesAtlas;
  const species = Object.freeze([
    {
      name: "Pau-brasil",
      scientific: "Paubrasilia echinata",
      status: "Em Perigo · EN",
      fact: "Uma árvore da Mata Atlântica que precisa de florestas preservadas.",
    },
    {
      name: "Araucária",
      scientific: "Araucaria angustifolia",
      status: "Em Perigo · EN",
      fact: "O pinhão é sua semente. Muitos animais se alimentam dele.",
    },
    {
      name: "Cedro-rosa",
      scientific: "Cedrela fissilis",
      status: "Vulnerável · VU",
      fact: "Suas sementes têm asas e viajam com o vento.",
    },
  ]);
  let image,
    promise,
    serial = 0;
  const index = (name) => {
    const i = species.findIndex((s) => s.name === name);
    return i < 0 ? ({ ipê: 0, ingá: 1, aroeira: 2 }[name] ?? 0) : i;
  };
  function load() {
    return (promise ||= (async () => {
      image = new Image();
      image.src = new URL(atlas.file, base);
      await image.decode();
    })());
  }
  function markup(name) {
    const f = atlas.frames[index(name)],
      b = f.bounds,
      id = "semente-" + serial++;
    return `<svg class="seed-sprite" viewBox="${b.join(" ")}" aria-hidden="true"><defs><clipPath id="${id}"><rect x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}"/></clipPath></defs><image clip-path="url(#${id})" href="${new URL(atlas.file, base)}" width="${atlas.width}" height="${atlas.height}"/></svg>`;
  }
  function draw(c, frame, x, y, h, angle = 0) {
    if (!image) return;
    const f = atlas.frames[frame],
      b = f.bounds,
      k = h / b[3];
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    c.drawImage(image, ...b, (b[0] - f.pivot[0]) * k, -h, b[2] * k, h);
    c.restore();
  }
  const Previous = BosqueCenario;
  window.BosqueCenario = class extends Previous {
    constructor(...args) {
      super(...args);
      if (this.phase === 4) this.ready = Promise.all([this.ready, load()]);
    }
    plant(c, t, time, reduced) {
      if (this.phase !== 4) return super.plant(c, t, time, reduced);
      if (!["seeded", "growing", "done"].includes(t.status))
        return super.plant(c, t, time, reduced);
      const i = index(t.seedSpecies),
        age =
          t.status === "seeded"
            ? 0
            : reduced
              ? 1
              : Math.max(0, Math.min(1, (time - (t.restoredAt ?? -10)) / 4));
      c.save();
      c.fillStyle = "#173b272b";
      c.beginPath();
      c.ellipse(t.x, t.y + 1, 10 + age * 12, 3 + age * 3, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
      if (age < 0.35) draw(c, 3 + i, t.x, t.y, 16 + age * 40);
      else
        draw(
          c,
          6 + i,
          t.x,
          t.y,
          30 + age * 67,
          reduced ? 0 : Math.sin(time * 0.9 + t.x) * 0.008 * age,
        );
    }
  };
  window.GuardiaoSementes = {
    species,
    index,
    load,
    markup,
    source: {
      title:
        "Portaria MMA 148/2022 — lista de flora ameaçada, compilação pública",
      url: "https://github.com/MateusRQ/Flora-ameacada-do-RS-compilada",
      checked: "2026-11-25",
    },
  };
})();
