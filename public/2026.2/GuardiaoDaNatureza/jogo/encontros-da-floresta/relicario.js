"use strict";
(() => {
  const base = new URL("./", document.currentScript.src);
  const atlas = GuardiaoEncontrosAtlas.crystals;
  const colors = ["#ff4739", "#39b9ed", "#e9b63c", "#6acb5e", "#b98bff"];
  const names = ["vermelho", "azul", "amarelo", "verde", "violeta"];
  const mount = GuardiaoEncontrosAtlas.mount;
  const slots = mount.slots;
  const socket =
    "M52 3C77 23 91 55 86 86C81 119 56 139 49 156C41 133 14 112 14 80C14 46 41 25 52 3Z";
  let serial = 0,
    loading;
  const images = {};
  const url = new URL(atlas.file, base).href;
  function stone(index, x, y, w, h) {
    const f = atlas.frames[index],
      b = f.bounds,
      clip = "joia-" + ++serial;
    return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${b.join(" ")}" preserveAspectRatio="xMidYMid meet" overflow="hidden"><defs><clipPath id="${clip}"><rect x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}"/></clipPath></defs><image href="${url}" width="${atlas.width}" height="${atlas.height}" clip-path="url(#${clip})"/></svg>`;
  }
  function fragment(index, earned = true) {
    return `<svg class="cristal-folha" viewBox="0 0 120 180" preserveAspectRatio="xMidYMid meet" data-crystal-art="${index + 1}" aria-hidden="true">${earned ? stone(index, 8, 8, 104, 164) : `<path d="${socket}" transform="translate(10 10)" fill="#839281" stroke="#baab70" stroke-width="3"/>`}</svg>`;
  }
  function frame() {
    return `<image href="${new URL(mount.file, base).href}" width="${mount.width}" height="${mount.height}"/>`;
  }
  function gemGroups(earned, mode = "collection") {
    return slots
      .map(
        ([x, y, w, h, a], i) =>
          `<g data-relicario-pedra="${i + 1}" ${mode === "cutscene" ? `data-colar-pedra="${i + 1}"` : mode === "ending" ? `data-ending-gem="${i + 1}"` : ""} style="opacity:${earned.includes(i + 1) ? 1 : 0}"><g transform="rotate(${a} ${x + w / 2} ${y + h / 2})">${stone(i, x, y, w, h)}</g></g>`,
      )
      .join("");
  }
  function necklace(earned = [], mode = "collection") {
    const label = `Amuleto com ${earned.length} de cinco cristais`;
    return `<svg class="relicario-view${mode === "cutscene" ? " colar-view" : ""}" data-relicario="novo" viewBox="0 0 ${mount.width} ${mount.height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${label}">${frame()}${gemGroups(earned, mode)}${mode === "cutscene" ? '<g class="colar-brilho" aria-hidden="true"><path d="M0-20L5-5L20 0L5 5L0 20L-5 5L-20 0L-5-5Z" fill="#fff8d4"/></g>' : ""}</svg>`;
  }
  function load() {
    if (!loading)
      loading = Promise.all(
        [
          ["sheet", url],
          ["frame", new URL(mount.file, base).href],
        ].map(async ([name, src]) => {
          const im = new Image();
          im.src = src;
          await im.decode();
          images[name] = im;
        }),
      );
    return loading;
  }
  function paintStone(ctx, index, x, y, w, h) {
    if (!images.sheet) return;
    const b = atlas.frames[index].bounds,
      k = Math.min(w / b[2], h / b[3]);
    ctx.drawImage(
      images.sheet,
      ...b,
      x + (w - b[2] * k) / 2,
      y + (h - b[3] * k) / 2,
      b[2] * k,
      b[3] * k,
    );
  }
  function paint(ctx, x, y, height, earned) {
    if (!images.frame || !images.sheet) return;
    const [bx, by, bw, bh] = mount.pendant,
      k = height / bh;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(k, k);
    ctx.translate(-(bx + bw / 2), -(by + bh / 2));
    ctx.beginPath();
    ctx.rect(bx, by, bw, bh);
    ctx.clip();
    ctx.drawImage(images.frame, 0, 0, mount.width, mount.height);
    for (const id of earned) {
      const i = id - 1,
        [xx, yy, w, h, a] = slots[i];
      ctx.save();
      ctx.translate(xx + w / 2, yy + h / 2);
      ctx.rotate((a * Math.PI) / 180);
      paintStone(ctx, i, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
    ctx.restore();
  }
  const api = Object.freeze({
    colors,
    names,
    slots,
    mount,
    fragment,
    necklace,
    frame,
    load,
    paint,
    paintStone,
  });
  window.GuardiaoRelicario = api;
  if (window.GuardiaoColecao)
    window.GuardiaoColecao = Object.freeze({
      ...window.GuardiaoColecao,
      gem: fragment,
    });
})();
