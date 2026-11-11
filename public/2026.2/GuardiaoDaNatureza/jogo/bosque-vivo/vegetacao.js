"use strict";
(() => {
  const base = new URL("./", document.currentScript.src),
    images = new Map();
  let ready = false,
    promise;
  async function load() {
    if (promise) return promise;
    promise = Promise.allSettled(
      Object.entries(BosqueVegetacaoAtlas).map(async ([name, d]) => {
        const im = new Image();
        im.src = new URL(d.file, base);
        await im.decode();
        images.set(name, im);
      }),
    ).then(() => {
      ready = images.has("vegetacao");
    });
    return promise;
  }
  function draw(c, name, index, x, y, height) {
    const im = images.get(name),
      d = BosqueVegetacaoAtlas[name];
    if (!im || !d) return false;
    const f = d.frames[index],
      b = f.bounds,
      k = height / b[3];
    c.drawImage(im, ...b, x - (b[2] * k) / 2, y - b[3] * k, b[2] * k, b[3] * k);
    return true;
  }
  window.BosqueVegetacao = {
    load,
    draw,
    get ready() {
      return ready;
    },
  };
})();
