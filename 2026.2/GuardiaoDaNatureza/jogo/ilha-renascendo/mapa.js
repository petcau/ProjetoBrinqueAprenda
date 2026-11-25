"use strict";
(() => {
  const base = new URL("./", document.currentScript.src),
    W = 1280,
    H = 721,
    duration = 6,
    centres = [
      [1024, 166],
      [1069, 397],
      [973, 564],
      [358, 538],
      [307, 166],
    ],
    images = new Map(),
    pending = new Map();
  let canvas,
    layer,
    done = [],
    stage = 0,
    from = 0,
    restoring = 0,
    started = 0,
    ticket = 0,
    loading = false,
    now = 0,
    final = 0,
    finalImage;
  const ease = (n) => {
    n = Math.max(0, Math.min(1, n));
    return n * n * (3 - 2 * n);
  };
  function image(id) {
    if (images.has(id)) return Promise.resolve(images.get(id));
    if (!pending.has(id))
      pending.set(
        id,
        (async () => {
          const im = new Image();
          im.decoding = "async";
          im.src = new URL(
            id
              ? `assets/etapa-${id}.webp`
              : "../mapa-ferido/assets/mapa-antes.webp",
            base,
          ).href;
          await im.decode();
          images.set(id, im);
          pending.delete(id);
          for (const old of images.keys())
            if (![0, stage, from, stage + 1].includes(old)) images.delete(old);
          return im;
        })().catch((e) => {
          pending.delete(id);
          throw e;
        }),
      );
    return pending.get(id);
  }
  function setup() {
    if (canvas) return;
    canvas = Object.assign(document.createElement("canvas"), {
      id: "living-island",
      width: W,
      height: H,
    });
    canvas.setAttribute("aria-hidden", "true");
    document.querySelector(".map-stage").prepend(canvas);
    layer = Object.assign(document.createElement("canvas"), {
      width: W,
      height: H,
    });
    document.getElementById("island-ash")?.remove();
    image(0).catch(() => {
      canvas.dataset.loadError = "true";
    });
  }
  function level(ids) {
    let n = 0;
    while (ids.includes(n + 1) && n < 5) n++;
    return n;
  }
  function prepare() {
    return Promise.all([image(stage), ...(restoring ? [image(from)] : [])]);
  }
  function update(ids, id = 0, finished = false) {
    setup();
    const next = [
        ...new Set(ids.filter((n) => Number.isInteger(n) && n >= 1 && n <= 5)),
      ].sort(),
      target = level(next);
    if (
      next.join() === done.join() &&
      target === stage &&
      (!id || id === restoring)
    )
      return;
    const revision = ++ticket;
    done = next;
    stage = target;
    restoring = id === target && id > 0 ? id : 0;
    from = restoring ? target - 1 : target;
    started = 0;
    loading = true;
    if (target < 5) final = 0;
    if (finished && target === 5) final = 1;
    prepare()
      .then(() => {
        if (revision !== ticket) return;
        loading = false;
        started = performance.now() / 1000;
        // A próxima etapa é preparada só no mapa e em segundo plano.
        if (stage < 5 && !navigator.connection?.saveData) {
          const warm = () => image(stage + 1).catch(() => {});
          if (window.requestIdleCallback)
            requestIdleCallback(warm, { timeout: 4000 });
        }
      })
      .catch(() => {
        if (revision === ticket) {
          loading = false;
          canvas.dataset.loadError = "true";
        }
      });
    if (!target) image(0).catch(() => {});
  }
  function amount(reduced) {
    return !restoring || reduced
      ? 1
      : !started
        ? 0
        : ease((performance.now() / 1000 - started) / duration);
  }
  function health(id, x, y, reduced) {
    if (!done.includes(id)) return 0;
    return id === restoring ? amount(reduced) : 1;
  }
  function fit(c, im) {
    // Contain conserva a imagem inteira; nunca estica largura e altura separadamente.
    const k = Math.min(W / im.naturalWidth, H / im.naturalHeight),
      w = im.naturalWidth * k,
      h = im.naturalHeight * k;
    c.drawImage(im, (W - w) / 2, (H - h) / 2, w, h);
  }
  function reveal(c, before, after, p, id) {
    if (p <= 0) {
      fit(c, before);
      return;
    }
    if (p >= 1) {
      fit(c, after);
      return;
    }
    fit(c, before);
    const g = layer.getContext("2d"),
      [x, y] = centres[id - 1],
      far = Math.max(
        ...[
          [0, 0],
          [W, 0],
          [0, H],
          [W, H],
        ].map(([xx, yy]) => Math.hypot(xx - x, yy - y)),
      ),
      radius = (far + 120) * p;
    g.clearRect(0, 0, W, H);
    fit(g, after);
    g.globalCompositeOperation = "destination-in";
    const mask = g.createRadialGradient(
      x,
      y,
      Math.max(0, radius - 120),
      x,
      y,
      Math.max(1, radius),
    );
    mask.addColorStop(0, "#fff");
    mask.addColorStop(1, "#fff0");
    g.fillStyle = mask;
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = "source-over";
    c.save();
    c.globalAlpha = ease(p / 0.1);
    c.drawImage(layer, 0, 0);
    c.restore();
  }
  function ending(c) {
    if (!final || !images.has(5)) return;
    if (!finalImage) {
      finalImage = new Image();
      finalImage.src = new URL(
        "../arte-viva/assets/mapa-depois.webp",
        base,
      ).href;
      return;
    }
    if (!finalImage.complete || !finalImage.naturalWidth) return;
    // O encerramento existente só recupera o coração da ilha: os cinco
    // territórios mantêm as imagens enviadas e os personagens originais.
    const g = layer.getContext("2d");
    g.clearRect(0, 0, W, H);
    fit(g, finalImage);
    g.globalCompositeOperation = "destination-in";
    const mask = g.createRadialGradient(650, 320, 50, 650, 320, 245);
    mask.addColorStop(0, "#fff");
    mask.addColorStop(0.7, "#fff");
    mask.addColorStop(1, "#fff0");
    g.fillStyle = mask;
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = "source-over";
    c.save();
    c.globalAlpha = final;
    c.drawImage(layer, 0, 0);
    c.restore();
  }
  function paint(time, reduced) {
    setup();
    now = time;
    const c = canvas.getContext("2d");
    c.clearRect(0, 0, W, H);
    c.fillStyle = "#235866";
    c.fillRect(0, 0, W, H);
    const target = images.get(stage),
      previous = images.get(from) || images.get(0),
      p = amount(reduced);
    if (target) {
      if (previous && restoring) reveal(c, previous, target, p, restoring);
      else fit(c, target);
    } else if (previous) fit(c, previous);
    ending(c);
    canvas.dataset.restoration = String(restoring && p < 1 ? restoring : 0);
    canvas.dataset.restorationProgress = String(p);
    if (document.body.dataset.islandStage !== String(stage))
      document.body.dataset.islandStage = String(stage);
  }
  window.BosqueMapa = {
    duration,
    update,
    paint,
    health,
    ready: () => {
      setup();
      return prepare();
    },
    finalGrowth: (n) => {
      final = ease(n);
    },
    state: () => ({
      renderer: "ilustrado-interativo",
      composition: "ilha-antiga",
      completed: [...done],
      restoring,
      finalGrowth: final,
      bitmapReplacements: 0,
      time: now,
      restoredReady: images.has(stage),
      stage,
      loading,
      progress: amount(false),
      source: "referencias-enviadas",
      width: W,
      height: H,
    }),
  };
})();
