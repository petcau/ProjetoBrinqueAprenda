"use strict";
(() => {
  const base = new URL("../jornada/", document.currentScript.src),
    atlas = window.GuardiaoCampanhaAtlas;
  class CampaignSprites {
    constructor() {
      this.images = new Map();
    }
    async load(names, progress = () => {}) {
      await Promise.all(
        [...new Set(names)].map(async (name) => {
          const d = atlas[name];
          if (!d) throw Error("Prancha ausente: " + name);
          const im = new Image();
          im.src = window.GuardiaoArte.url(new URL(d.file, base).href);
          await im.decode();
          if (im.naturalWidth !== d.width || im.naturalHeight !== d.height)
            throw Error("Dimensões inválidas: " + name);
          this.images.set(name, im);
          progress();
        }),
      );
      return this;
    }
    draw(
      ctx,
      name,
      index,
      x,
      y,
      height,
      { flip = false, alpha = 1, angle = 0, center = false } = {},
    ) {
      const d = atlas[name],
        f = d.frames[index % d.frames.length],
        b = f.bounds,
        k = height / d.referenceHeight,
        im = this.images.get(name);
      if (!im) return;
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.translate(x, y);
      ctx.rotate(angle);
      if (flip !== !!f.flip) ctx.scale(-1, 1);
      if (center) {
        const scale = Math.min(height / b[2], height / b[3]);
        ctx.drawImage(
          im,
          ...b,
          (-b[2] * scale) / 2,
          (-b[3] * scale) / 2,
          b[2] * scale,
          b[3] * scale,
        );
      } else
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
    markup(name, index) {
      const d = atlas[name],
        b = d.frames[index].bounds,
        src = window.GuardiaoArte.url(new URL(d.file, base).href);
      return `<svg viewBox="${b.join(" ")}" overflow="hidden" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><image href="${src}" width="${d.width}" height="${d.height}"/></svg>`;
    }
  }
  window.GuardiaoCampaignSprites = CampaignSprites;
})();
