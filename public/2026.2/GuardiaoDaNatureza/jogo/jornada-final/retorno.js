"use strict";
(() => {
  const base = new URL("./", document.currentScript.src),
    images = new Map(),
    $ = (id) => document.getElementById(id);
  const visits = [
    {
      name: "Floresta em Chamas",
      map: "floresta",
      npc: "Carlos",
      line: "O fogo deu lugar à vida. Os animais estão seguros, e Carlos recebe Kai de braços abertos.",
    },
    {
      name: "Rio Poluído",
      map: "rio",
      npc: "Antônio",
      line: "A água está limpa. Os peixes nadam livres e a tartaruga voltou à areia, sem plástico.",
    },
    {
      name: "Resgate da Fauna",
      map: "fauna",
      npc: "Marina",
      line: "Mico, preguiça e seus amigos estão recuperados. Marina comemora cada vida protegida.",
    },
    {
      name: "Reflorestamento",
      map: "plantio",
      npc: "Rafael",
      line: "As mudas cresceram e devolveram sombra, flores e abrigo à floresta. Rafael celebra o cuidado de Kai.",
    },
    {
      name: "Cidade Sustentável",
      map: "cidade",
      npc: "Luciana",
      line: "A cidade ganhou jardins, energia limpa e coleta seletiva. Kai e Luciana celebram a comunidade.",
    },
  ];
  let index = 0,
    elapsed = 0,
    last = 0,
    active = false,
    ready = false,
    ticket = 0,
    onComplete = null;
  const still = () =>
    Raizes.prefs().reduceMotion ||
    matchMedia("(prefers-reduced-motion:reduce)").matches;
  async function image(key, path) {
    if (images.has(key)) return;
    const im = new Image();
    im.decoding = "async";
    im.src = new URL(path, base);
    await im.decode();
    images.set(key, im);
  }
  function start(done) {
    const run = ++ticket;
    active = true;
    ready = false;
    index = 0;
    elapsed = 0;
    last = 0;
    onComplete = done;
    $("journey-return").hidden = false;
    $("return-next").focus();
    caption();
    $("return-line").textContent =
      "Revisitando os lugares que você ajudou a transformar…";
    Promise.all([
      ...visits.map((v) =>
        image(v.map, "../reencontro/assets/" + v.map + "-depois.webp"),
      ),
      ...[
        "abracos",
        "fauna-grande",
        "fauna-copa",
        "fauna-brasileira",
        "animais",
      ].map((name) => image(name, JornadaFinalAtlas[name].file)),
      VivaArt.load(["flora"]),
    ])
      .then(() => {
        if (run !== ticket) return;
        ready = true;
        last = 0;
        caption();
      })
      .catch(() => {
        if (run !== ticket) return;
        $("return-line").textContent =
          "Não foi possível carregar as lembranças. Toque no botão para assistir ao vídeo final.";
        $("return-next").textContent = "Ver vídeo final →";
        ready = false;
      });
  }
  function caption() {
    const v = visits[index];
    $("return-title").textContent = v.name;
    $("return-line").textContent = v.line;
    $("return-count").textContent =
      index + 1 + " de 5 · Reencontro com " + v.npc;
    $("return-next").textContent =
      index === 4 ? "Ver vídeo final →" : "Próxima lembrança →";
    document.body.dataset.returnPhase = String(index + 1);
  }
  function finish() {
    if (!active) return;
    active = false;
    ticket++;
    $("journey-return").hidden = true;
    const done = onComplete;
    onComplete = null;
    done?.();
  }
  function next() {
    if (!active) return;
    if (!ready || index === 4) {
      finish();
      return;
    }
    index++;
    elapsed = 0;
    last = 0;
    caption();
  }
  function sprite(c, name, frame, x, y, h, flip = false) {
    const d = JornadaFinalAtlas[name],
      im = images.get(name);
    if (!d || !im) return;
    const f = d.frames[frame],
      b = f.bounds,
      k = h / (f.height || d.referenceHeight || b[3]);
    c.save();
    c.translate(x, y);
    if (flip) c.scale(-1, 1);
    c.drawImage(
      im,
      ...b,
      (b[0] - f.pivot[0]) * k,
      (b[1] - f.pivot[1]) * k,
      b[2] * k,
      b[3] * k,
    );
    c.restore();
  }
  function paint(_c, _w, _h, time) {
    if (!active || !ready) return;
    if (last && !document.hidden)
      elapsed += Math.min(0.1, Math.max(0, time - last));
    last = time;
    if (elapsed >= 7.2) {
      next();
      if (!active) return;
    }
    VivaArt.canvas($("return-art"), (c, w, h) => {
      // Letterbox the original 16:9 maps; every region stays visible on mobile.
      c.fillStyle = "#102e24";
      c.fillRect(0, 0, w, h);
      const k = Math.min(w / 1280, h / 720),
        ox = (w - 1280 * k) / 2,
        oy = (h - 720 * k) / 2;
      c.save();
      c.translate(ox, oy);
      c.scale(k, k);
      if (index > 0 && !still() && elapsed < 0.8) {
        c.drawImage(images.get(visits[index - 1].map), 0, 0, 1280, 720);
        c.save();
        c.globalAlpha = Math.min(1, elapsed / 0.8);
        c.drawImage(images.get(visits[index].map), 0, 0, 1280, 720);
        c.restore();
      } else c.drawImage(images.get(visits[index].map), 0, 0, 1280, 720);

      const t = still() ? 0 : time,
        enter = still() ? 1 : Math.min(1, elapsed / 1.1),
        alpha = enter * enter * (3 - 2 * enter);
      c.globalAlpha = alpha;
      c.fillStyle = "#18392b30";
      c.beginPath();
      c.ellipse(950, 671, 172, 24, 0, 0, Math.PI * 2);
      c.fill();
      // Each reunion uses an actual embrace pose, rather than overlapping standing characters.
      sprite(
        c,
        "abracos",
        index,
        950,
        670,
        385 + (still() ? 0 : Math.sin(t * 1.8) * 1.2),
      );
      VivaArt.owl(c, 1120, 280, 65, t, "festa", true);
      if (index === 0) {
        sprite(c, "fauna-brasileira", 2, 210, 558, 80);
        sprite(c, "fauna-brasileira", 14, 410, 589, 65);
      }
      if (index === 1) {
        sprite(c, "animais", 2, 585, 365, 70);
        sprite(c, "animais", 6, 628, 490, 60);
        sprite(c, "animais", 10, 955, 408, 72);
      }
      if (index === 2) {
        sprite(c, "fauna-brasileira", 6, 490, 202, 65);
        sprite(c, "fauna-copa", 6, 330, 278, 65);
        sprite(c, "fauna-grande", 2, 600, 593, 85);
        sprite(c, "fauna-grande", 10, 193, 564, 86);
        sprite(c, "fauna-copa", 2, 645, 220, 70);
        sprite(c, "fauna-brasileira", 2, 280, 470, 85);
      }
      c.restore();
    });
  }
  function stop() {
    active = false;
    ready = false;
    ticket++;
    last = 0;
    onComplete = null;
    $("journey-return").hidden = true;
  }
  document.addEventListener("DOMContentLoaded", () => {
    $("return-next").onclick = next;
    $("journey-return").addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        $("return-next").focus();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        finish();
      }
    });
    document.addEventListener("visibilitychange", () => {
      last = 0;
    });
  });
  window.JornadaRetorno = {
    start,
    next,
    paint,
    stop,
    state: () => ({ active, ready, index, elapsed, npc: visits[index].npc }),
  };
})();
