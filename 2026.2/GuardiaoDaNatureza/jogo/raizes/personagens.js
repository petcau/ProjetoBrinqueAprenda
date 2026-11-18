"use strict";
(() => {
  const base = new URL("./", document.currentScript.src),
    atlas = window.GuardiaoRaizesAtlas;
  const images = new Map(),
    promises = new Map();
  async function load(names = ["kai", "flora", "npcs", "acoes"]) {
    await Promise.all(
      names.map((name) => {
        if (!promises.has(name))
          promises.set(
            name,
            (async () => {
              const im = new Image();
              im.src = new URL(atlas[name].file, base);
              await im.decode();
              if (
                im.naturalWidth !== atlas[name].width ||
                im.naturalHeight !== atlas[name].height
              )
                throw Error("Quadro inválido: " + name);
              images.set(name, im);
            })(),
          );
        return promises.get(name);
      }),
    );
  }
  function draw(ctx, name, index, x, y, height, options = {}) {
    const d = atlas[name],
      im = images.get(name);
    if (!im) return false;
    const f = d.frames[(index + d.frames.length) % d.frames.length],
      b = f.bounds,
      k = height / d.referenceHeight;
    ctx.save();
    ctx.globalAlpha *= options.alpha ?? 1;
    ctx.translate(x, y);
    if (options.flip) ctx.scale(-1, 1);
    ctx.rotate(options.angle || 0);
    ctx.drawImage(
      im,
      ...b,
      (b[0] - f.pivot[0]) * k,
      (b[1] - f.pivot[1]) * k,
      b[2] * k,
      b[3] * k,
    );
    ctx.restore();
    return true;
  }
  function canvas(canvas, paint) {
    const r = canvas.getBoundingClientRect(),
      dpr = Math.min(devicePixelRatio || 1, 1.5);
    if (
      canvas.width !== Math.round(r.width * dpr) ||
      canvas.height !== Math.round(r.height * dpr)
    ) {
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
    }
    const c = canvas.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, r.width, r.height);
    paint(c, r.width, r.height);
  }
  function owl(ctx, x, y, h, t, mode = "voo", flip = false) {
    if (document.body.classList.contains("reduce-motion")) t = 0;
    let frame =
      mode === "voo"
        ? Math.floor(t * 9) % 4
        : mode === "festa"
          ? 11
          : mode === "fala"
            ? 10
            : t % 4.8 > 4.5
              ? 9
              : 8;
    draw(ctx, "flora", frame, x, y, h, { flip });
  }
  window.RaizesPersonagens = { load, draw, canvas, owl, atlas, images };
})();
