"use strict";
(() => {
  const P = BosquePintura,
    water = P.water,
    tree = P.tree,
    base = new URL("./", document.currentScript.src),
    im = new Image(),
    props = new Image(),
    waters = new WeakMap();
  let ready = false,
    promise;
  function load() {
    return (promise ||= (async () => {
      im.src = new URL("assets/arvores.webp", base);
      await im.decode();
      if (location.pathname.includes("/viva/")) {
        props.src = new URL("assets/costa.webp", base);
        await props.decode();
      }
      ready = true;
    })().catch(() => {}));
  }
  const prior = BosqueVegetacao.load;
  BosqueVegetacao.load = () => Promise.all([prior(), load()]);
  function sprite(c, i, x, y, h) {
    const b = TrilhasArvores[i],
      s = h / b[3];
    c.drawImage(im, ...b, x - (b[2] * s) / 2, y - h, b[2] * s, h);
  }
  P.tree = (c, x, y, h, g, t = 0, seed = 0, reduced = false) => {
    if (!ready || seed === 810) return tree(c, x, y, h, g, t, seed, reduced);
    const k = Math.abs(Math.round(seed)) % 4,
      life = P.ease(g);
    P.oval(c, x + 3, y + 2, h * 0.25, h * 0.065, "#192d2330");
    sprite(c, k, x, y, h * 0.9);
    if (life > 0.015) {
      c.save();
      c.translate(x, y - h * 0.32);
      c.rotate(reduced ? 0 : Math.sin(t * 0.75 + seed) * 0.014);
      sprite(c, k + 4, 0, 0, h * 0.73 * life);
      c.restore();
    }
  };
  P.water = (c, polygon, health, time, reduced, id) => {
    let bank = waters.get(polygon);
    if (!bank) {
      const xs = polygon.map((p) => p[0]),
        ys = polygon.map((p) => p[1]);
      const x = Math.floor(Math.min(...xs)) - 8,
        y = Math.floor(Math.min(...ys)) - 8,
        w = Math.ceil(Math.max(...xs) - x) + 8,
        h = Math.ceil(Math.max(...ys) - y) + 8;
      const frames = [0, 1].map((health) => {
        const a = MataArte.canvas(w, h),
          g = a.getContext("2d");
        g.translate(-x, -y);
        water(g, polygon, health, 0, true, id);
        return a;
      });
      bank = { x, y, frames, current: health, last: time };
      waters.set(polygon, bank);
    }
    const dt = Math.max(0, Math.min(0.1, time - bank.last));
    bank.last = time;
    bank.current +=
      (health - bank.current) * (reduced ? 1 : 1 - Math.exp(-dt * 2));
    c.drawImage(bank.frames[0], bank.x, bank.y);
    c.save();
    c.globalAlpha *= bank.current;
    c.drawImage(bank.frames[1], bank.x, bank.y);
    c.restore();
    c.save();
    P.poly(c, polygon);
    c.clip();
    const flow = reduced ? 0 : time;
    for (let i = 0; i < 20; i++) {
      const x = bank.x + ((i * 79.7 + flow * 9) % (bank.frames[0].width + 20)),
        y =
          bank.y +
          ((i * 47.1) % bank.frames[0].height) +
          Math.sin(flow + i) * 2;
      c.beginPath();
      c.ellipse(
        x,
        y,
        9 + Math.sin(flow * 0.7 + i) * 3,
        1.6,
        0,
        0.15,
        Math.PI * 1.75,
      );
      c.strokeStyle = i % 3 ? "#c8f3e731" : "#f2fff655";
      c.lineWidth = 0.8;
      c.stroke();
    }
    c.restore();
  };
  window.TrilhasNatureza = {
    load,
    prop(c, i, x, y, h) {
      if (!props.naturalWidth) return false;
      const b = TrilhasCosta[i],
        s = h / b[3];
      c.drawImage(props, ...b, x - (b[2] * s) / 2, y - h, b[2] * s, h);
      return true;
    },
    get ready() {
      return ready;
    },
  };
})();
