"use strict";
(() => {
  const R = Raizes,
    A = VivaArt,
    $ = (id) => document.getElementById(id);
  const phase = location.pathname.includes("/floresta-viva/")
    ? 1
    : Number(new URLSearchParams(location.search).get("fase") || 2);
  let adjustments,
    raf = 0,
    last = 0;
  const openPack = () => GuardiaoMochila.open();
  function openAdjustments() {
    if (!adjustments) {
      adjustments = document.createElement("dialog");
      adjustments.id = "phase-settings";
      adjustments.className = "ra-dialog ra-phase-settings";
      adjustments.setAttribute("aria-labelledby", "phase-settings-title");
      adjustments.innerHTML = `<header><div><p class="eyebrow">AJUSTES SEM SAIR DA FASE</p><h2 id="phase-settings-title">Do seu jeito</h2></div><button type="button" class="icon-button" aria-label="Retomar jogo">${R.icon("close")}</button></header><div class="phase-settings-form"></div>`;
      document.body.append(adjustments);
      R.bindSettings(adjustments.querySelector(".phase-settings-form"));
      adjustments.querySelector("header button").onclick = () =>
        adjustments.close();
    }
    document.querySelectorAll("dialog[open]").forEach((d) => {
      if (d.id !== "girar-celular") d.close();
    });
    document.dispatchEvent(new CustomEvent("guardiao:neutralizar"));
    adjustments.showModal();
  }
  function setupTalk() {
    const talk = $("conversa") || $("intro");
    if (!talk) return;
    const text = $("conversa-texto") || $("intro-text"),
      next = $("conversa-avancar") || $("intro-next"),
      counter = $("conversa-pagina") || $("intro-count");
    const bin = document.createElement("div");
    bin.hidden = true;
    bin.className = "ra-legacy";
    while (talk.firstChild) bin.append(talk.firstChild);
    document.body.append(bin);
    talk.classList.add("ra-talk");
    talk.setAttribute("aria-labelledby", "ra-talk-title");
    talk.innerHTML = `<header><p class="eyebrow">UM CUIDADO COMEÇA COM UM ENCONTRO</p><h2 id="ra-talk-title">${["Carlos", "Antônio", "Marina", "Rafael", "Luciana"][phase - 1]}</h2></header><div class="ra-talk-columns"><canvas class="ra-talk-scene" aria-label="Kai e o aliado se olham durante a conversa"></canvas><div class="ra-talk-copy"></div></div><footer></footer>`;
    talk.querySelector(".ra-talk-copy").append(text);
    talk.querySelector("footer").append(counter, next);
    next.className = "wood-button primary";
    next.autofocus = true;
  }
  function setupPause() {
    const d = $("menu-pausa"),
      bin = document.createElement("div");
    bin.hidden = true;
    bin.className = "ra-legacy";
    while (d.firstChild) bin.append(d.firstChild);
    document.body.append(bin);
    d.className = "ra-dialog ra-pause";
    d.setAttribute("aria-labelledby", "ra-pause-title");
    d.innerHTML = `<header><canvas id="pause-flora" aria-label="Flora descansa durante a pausa"></canvas><p class="eyebrow">UMA PAUSA NA TRILHA</p><h2 id="ra-pause-title">Respire com a floresta.</h2><button type="button" class="icon-button ra-pause-full" aria-label="Entrar em tela cheia"></button></header><p>Sua aventura continua aqui.</p><nav><button type="button" class="wood-button primary" data-resume>Continuar</button><button type="button" class="wood-button" data-adjust>${R.icon("gear")}Ajustes</button><a class="wood-button" href="${new URL("index.html#mapa", R.base)}">${R.icon("back")}Voltar ao mapa</a></nav>`;
    d.querySelector("[data-resume]").onclick = () => d.close();
    d.querySelector("[data-adjust]").onclick = openAdjustments;
    R.bindFull(d.querySelector(".ra-pause-full"));
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (now - last < 66 || document.hidden) return;
    last = now;
    const t = now / 1000,
      talk = document.querySelector(".ra-talk[open]");
    if (talk)
      A.canvas(talk.querySelector("canvas"), (c, w, h) =>
        A.meeting(c, w, h, phase, t, 0),
      );
    if (phase === 1 && $("vitoria")?.open && $("ra-celebration"))
      A.canvas($("ra-celebration"), (c, w, h) => {
        A.draw(
          c,
          "acoes",
          6,
          w * 0.38,
          h * 0.93 + Math.sin(t * 4) * 2,
          h * 0.84,
        );
        A.draw(c, "npcs", 5, w * 0.7, h * 0.93, h * 0.86);
        A.owl(c, w * 0.52, h * 0.42, h * 0.35, t, "festa", false);
      });
    if ($("menu-pausa")?.open)
      A.canvas($("pause-flora"), (c, w, h) =>
        A.owl(c, w * 0.5, h * 0.95, h * 0.75, t, "ombro", false),
      );
  }
  function init() {
    document.body.classList.add("raizes-jogo");
    setupTalk();
    setupPause();
    const top = document.querySelector("#jogo .top-actions"),
      bag = $("mochila");
    if (bag) {
      bag.className = "ra-world-icon";
      bag.innerHTML = R.icon("bag");
      bag.setAttribute("aria-label", "Mochila de Kai");
      top.prepend(bag);
    }
    const fs = document.createElement("button");
    fs.type = "button";
    fs.id = "app-fullscreen";
    fs.className = "ra-world-icon";
    top.prepend(fs);
    R.bindFull(fs);
    $("pausa").innerHTML = R.icon("pause");
    $("pausa").className = "ra-world-icon";
    document
      .querySelectorAll("[data-icon]")
      .forEach((el) => (el.innerHTML = R.icon(el.dataset.icon)));
    const hidden = document.createElement("div");
    hidden.hidden = true;
    hidden.className = "ra-legacy";
    document.body.append(hidden);
    for (const id of ["som", "ajuda", "jump-action"])
      if ($(id)) hidden.append($(id));
    if (phase === 1) {
      const waterGoal = document.querySelector('[data-goal="agua"]');
      if (waterGoal) hidden.append(waterGoal);
      $("mangueira").innerHTML = R.icon("hose") + "<small>ÁGUA</small>";
      const title = document.querySelector(".mission h1,.mission h2");
      if (title) title.textContent = "Floresta em Chamas";
    } else {
      $("tool-icon").innerHTML = R.icon(
        phase === 2
          ? "net"
          : phase === 4
            ? "water"
            : phase === 5
              ? "trash"
              : "paw",
      );
    }
    $("interagir").innerHTML = R.icon("hand") + "<small>CUIDAR</small>";
    const rotate = $("girar-tela-cheia");
    if (rotate) R.bindFull(rotate);
    if (phase === 1) {
      const art = document.querySelector(".celebration-art");
      if (art) {
        art.style.backgroundImage = "none";
        art.replaceChildren(
          Object.assign(document.createElement("canvas"), {
            id: "ra-celebration",
          }),
        );
      }
    }
    A.load(["acoes", "flora", "npcs", "encontros"]).then(
      () => (document.body.dataset.newActorsReady = "true"),
    );
    raf = requestAnimationFrame(frame);
  }
  window.addEventListener(
    "keydown",
    (e) => {
      if (document.querySelector("dialog[open]")) return;
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
        ].includes(e.key) &&
        e.target.closest?.(".top-actions")
      )
        $("cenario").focus({ preventScroll: true });
    },
    { capture: true },
  );
  window.addEventListener("pagehide", () => cancelAnimationFrame(raf));
  document.addEventListener("DOMContentLoaded", init, { once: true });
})();
