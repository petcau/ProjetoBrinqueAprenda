"use strict";
(() => {
  const base = new URL("./", document.currentScript.src),
    images = new Map(),
    patterns = new Map();
  let promise;
  function canvas(w, h = w) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }
  function load() {
    return (promise ||= Promise.all(
      [
        ["decor", MataAtlas.file],
        ["terrain", "assets/texturas.webp"],
      ].map(async ([name, file]) => {
        const im = new Image();
        im.src = new URL(file, base);
        await im.decode();
        images.set(name, im);
      }),
    ).catch((error) =>
      console.warn(
        "Arte de cenário indisponível; usando desenho de reserva.",
        error.message,
      ),
    ));
  }
  function pattern(c, index, size = 176) {
    const key = index + ":" + size;
    if (!images.has("terrain")) return "#8b7951";
    if (!patterns.has(key)) {
      // Quatro reflexões eliminam emendas duras, sem uma textura de mapa inteiro.
      const tile = canvas(size * 2),
        g = tile.getContext("2d"),
        im = images.get("terrain");
      for (let y = 0; y < 2; y++)
        for (let x = 0; x < 2; x++) {
          g.save();
          g.translate(x ? size * 2 : 0, y ? size * 2 : 0);
          g.scale(x ? -1 : 1, y ? -1 : 1);
          g.drawImage(
            im,
            (index % 4) * 384,
            Math.floor(index / 4) * 384,
            384,
            384,
            0,
            0,
            size,
            size,
          );
          g.restore();
        }
      patterns.set(key, tile);
    }
    return c.createPattern(patterns.get(key), "repeat");
  }
  function draw(c, index, x, y, height, flip = false) {
    const im = images.get("decor");
    if (!im) return false;
    const b = MataAtlas.frames[index].bounds,
      k = height / b[3];
    c.save();
    c.translate(x, y);
    if (flip) c.scale(-1, 1);
    c.drawImage(im, ...b, (-b[2] * k) / 2, -height, b[2] * k, height);
    c.restore();
    return true;
  }
  const oldLoad = BosqueVegetacao.load;
  BosqueVegetacao.load = () => Promise.all([oldLoad(), load()]);
  window.MataArte = {
    load,
    draw,
    pattern,
    canvas,
    get ready() {
      return images.size === 2;
    },
  };
})();
