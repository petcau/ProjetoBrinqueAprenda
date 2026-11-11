"use strict";
(() => {
  const base = new URL("./", document.currentScript.src),
    old = RaizesPersonagens,
    atlas = VivaAtlas,
    images = new Map(),
    promises = new Map();
  async function load(names) {
    await Promise.all(
      names.map((name) => {
        if (!atlas[name]) return old.load([name]);
        if (!promises.has(name))
          promises.set(
            name,
            (async () => {
              const im = new Image();
              im.src = new URL(atlas[name].file, base);
              await im.decode();
              images.set(name, im);
            })(),
          );
        return promises.get(name);
      }),
    );
  }
  function canvas(el, paint) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const quality = Raizes.prefs().graphicsQuality,
      cap = quality === "leve" ? 1 : quality === "alta" ? 2 : 1.5,
      dpr = Math.min(devicePixelRatio || 1, cap);
    if (
      el.width !== Math.round(r.width * dpr) ||
      el.height !== Math.round(r.height * dpr)
    ) {
      el.width = Math.round(r.width * dpr);
      el.height = Math.round(r.height * dpr);
    }
    const ctx = el.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, r.width, r.height);
    paint(ctx, r.width, r.height);
  }
  function draw(ctx, name, index, x, y, height, options = {}) {
    if (!atlas[name]) return old.draw(ctx, name, index, x, y, height, options);
    const d = atlas[name],
      im = images.get(name);
    if (!im) return;
    const f = d.frames[index % d.frames.length],
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
  }
  function scenery(ctx, index, w, h) {
    const im = images.get("encontros");
    if (!im) return;
    const sw = im.width / 2,
      sh = im.height / 3,
      scale = Math.max(w / sw, h / sh),
      vw = w / scale,
      vh = h / scale;
    ctx.drawImage(
      im,
      (index % 2) * sw + (sw - vw) / 2,
      Math.floor(index / 2) * sh + (sh - vh) / 2,
      vw,
      vh,
      0,
      0,
      w,
      h,
    );
  }
  function friends(ctx, w, h, time, scene = false) {
    if (scene) scenery(ctx, 5, w, h);
    const hh = Math.min(h * 0.92, w * 1.3),
      x = w * 0.38,
      y = h * 0.94;
    old.draw(ctx, "acoes", 1, x, y, hh);
    old.owl(ctx, w * 0.79, h * 0.49, hh * 0.22, time, "ombro", true);
  }
  function meeting(ctx, w, h, phase, t, reserve = 42) {
    scenery(ctx, phase - 1, w, h);
    const hh = Math.min((h - reserve) * 0.88, w * 0.63),
      y = h - reserve - 7;
    ctx.fillStyle = "#332c2522";
    for (const x of [w * 0.27, w * 0.74]) {
      ctx.beginPath();
      ctx.ellipse(x, y, hh * 0.18, hh * 0.04, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    old.draw(ctx, "acoes", 0, w * 0.27, y, hh * 0.9);
    old.draw(
      ctx,
      "npcs",
      phase -
        1 +
        (document.body.classList.contains("reduce-motion")
          ? 0
          : Math.sin(t * 0.8) > 0.6
            ? 5
            : 0),
      w * 0.74,
      y,
      hh,
    );
    old.owl(ctx, w * 0.49, y - hh * 0.7, hh * 0.22, t, "voo", true);
  }
  window.VivaArt = {
    base,
    atlas,
    images,
    load,
    canvas,
    draw,
    scenery,
    friends,
    meeting,
    owl: old.owl,
  };
})();
