"use strict";
(() => {
  const base = new URL("./", document.currentScript.src),
    atlas = BrisaAtlas;
  const fallback = Raizes.icon,
    oldIcons = GuardiaoIcones;
  const images = new Map(),
    promises = new Map();
  const aliases = {
    backpack: "bag",
    mochila: "bag",
    mangueira: "hose",
    luvas: "hand",
    regador: "watering",
    rede: "net",
    sementes: "seeds",
    pa: "shovel",
    protecao: "lifevest",
    veterinario: "kit",
    corda: "rope",
    chave: "key",
    mudas: "plant",
    saco: "bag",
    reciclagem: "bag",
    jardim: "shovel",
    exit: "full",
    back: "leaf",
  };
  const reduced = () => document.body.classList.contains("reduce-motion");
  function entry(raw) {
    const name = aliases[raw] || raw;
    for (const bank of ["comandos", "interface"]) {
      const d = atlas[bank],
        f = d.frames.find((f) => f.name === name);
      if (f) return { bank, d, f };
    }
  }
  function load(bank = "interface") {
    if (!promises.has(bank))
      promises.set(
        bank,
        (async () => {
          const im = new Image();
          im.src = new URL(atlas[bank].file, base);
          await im.decode();
          images.set(bank, im);
          return im;
        })(),
      );
    return promises.get(bank);
  }
  function markup(raw) {
    const e = entry(raw);
    if (!e) return fallback(raw);
    const { d, f } = e;
    return `<svg class="nature-symbol brisa-icon brisa-${raw}" viewBox="${f.bounds.join(" ")}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><image href="${new URL(d.file, base)}" width="${d.width}" height="${d.height}"/></svg>`;
  }
  function draw(ctx, bank, index, x, y, size, options = {}) {
    const d = atlas[bank],
      f = d.frames[index % d.frames.length],
      im = images.get(bank);
    if (!im) return;
    const b = f.bounds,
      k = size / Math.max(b[2], b[3]);
    ctx.save();
    ctx.globalAlpha *= options.alpha ?? 1;
    ctx.translate(x, y);
    ctx.rotate(options.angle || 0);
    ctx.scale(options.squeeze ?? 1, 1);
    ctx.drawImage(
      im,
      ...b,
      (-b[2] * k) / 2,
      (-b[3] * k) / 2,
      b[2] * k,
      b[3] * k,
    );
    ctx.restore();
  }
  function paint(ctx, bank, raw, x, y, size) {
    const e = entry(raw);
    if (!e) return oldIcons.paint(ctx, bank, raw, x, y, size);
    draw(ctx, e.bank, e.d.frames.indexOf(e.f), x, y, size);
  }
  const loadIcons = () =>
    Promise.all([oldIcons.load(), load("comandos"), load("interface")]);
  Raizes.icon = markup;
  window.GuardiaoIcones = {
    ...oldIcons,
    markup,
    load: loadIcons,
    paint,
    draw: async (ctx, name, x, y, size) => {
      await loadIcons();
      paint(ctx, null, name, x, y, size);
    },
    prepare(parent = document) {
      parent
        .querySelectorAll("[data-icon]")
        .forEach((e) => (e.innerHTML = markup(e.dataset.icon)));
    },
  };
  window.GuardiaoArtesInterface = { svg: markup, load: loadIcons };
  if (window.GuardiaoColecao)
    window.GuardiaoColecao = { ...GuardiaoColecao, item: markup };
  const bind = Raizes.bindFull,
    watched = new WeakSet();
  function fullIcons() {
    document.querySelectorAll("[data-fullscreen]").forEach((b) => {
      if (!b.querySelector(".brisa-full")) b.innerHTML = markup("full");
      if (!watched.has(b)) {
        watched.add(b);
        new MutationObserver(fullIcons).observe(b, { childList: true });
      }
      b.classList.toggle(
        "is-fullscreen",
        !!(document.fullscreenElement || document.webkitFullscreenElement),
      );
    });
  }
  Raizes.bindFull = (b) => {
    bind(b);
    fullIcons();
  };
  document.addEventListener("fullscreenchange", fullIcons);
  document.addEventListener("webkitfullscreenchange", fullIcons);
  document.addEventListener("DOMContentLoaded", fullIcons);
  const owl = RaizesPersonagens.owl;
  const calmOwl = (ctx, x, y, h, t, mode, flip) =>
    owl(ctx, x, y, h, t * 0.78, mode, flip);
  RaizesPersonagens.owl = calmOwl;
  VivaArt.owl = calmOwl;
  window.BrisaArte = {
    base,
    atlas,
    images,
    load,
    draw,
    markup,
    reduced,
    entry,
  };
})();
