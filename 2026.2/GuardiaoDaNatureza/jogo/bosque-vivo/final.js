"use strict";
(() => {
  const $ = (id) => document.getElementById(id),
    seen = "guardiao.viva.final.v1";
  let active = false,
    finished = false,
    closing = false,
    previousFocus = null,
    finishTimer = 0,
    quietTimer = 0,
    generation = 0;
  const reduced = () =>
    Raizes.prefs().reduceMotion ||
    matchMedia("(prefers-reduced-motion:reduce)").matches;
  const inCinema = () =>
    active && !finished && document.body.dataset.finaleScene === "video";
  function wakeControls() {
    clearTimeout(quietTimer);
    $("final-cinema").dataset.cinemaQuiet = "false";
    if (inCinema() && !$("final-movie").paused && !closing)
      quietTimer = setTimeout(() => {
        $("final-cinema").dataset.cinemaQuiet = "true";
      }, 2800);
  }
  function gate(label, message, state = "awaiting") {
    if (!inCinema() || closing) return;
    $("final-cinema").dataset.cinemaState = state;
    $("cinema-gate").hidden = false;
    $("cinema-action").textContent = label;
    $("final-movie-status").textContent = message;
    wakeControls();
    if (!document.hidden) $("cinema-action").focus({ preventScroll: true });
  }
  function enterFullscreen() {
    if (
      navigator.userActivation?.isActive &&
      !window.GuardiaoTela?.state().fullscreen
    )
      window.GuardiaoTela?.enter().catch(() => {});
  }
  function finalize() {
    if (!active || finished) return;
    finished = true;
    closing = false;
    clearTimeout(quietTimer);
    JornadaRetorno.stop();
    $("final-movie").pause();
    $("final-cinema").hidden = true;
    window.GuardiaoAudio?.cinematic(false);
    BosqueMapa.finalGrowth(1);
    try {
      localStorage.setItem(seen, "visto");
    } catch {}
    document.body.dataset.endingState = "concluido";
    document.body.dataset.finaleScene = "celebracao";
    $("tree-state").textContent = "Árvore Guardiã restaurada";
    $("credits-necklace").innerHTML = GuardiaoRelicario.necklace(
      [1, 2, 3, 4, 5],
      "credits",
    );
    if (!$("final-credits").open) $("final-credits").showModal();
  }
  function complete() {
    if (!active || finished || closing) return;
    closing = true;
    clearTimeout(quietTimer);
    JornadaRetorno.stop();
    $("final-movie").pause();
    $("cinema-gate").hidden = true;
    $("final-cinema").dataset.cinemaState = "leaving";
    finishTimer = setTimeout(finalize, reduced() ? 0 : 750);
  }
  function playScene() {
    if (!inCinema() || closing) return;
    const run = generation,
      movie = $("final-movie");
    movie.controls = false;
    $("cinema-gate").hidden = true;
    $("final-cinema").dataset.cinemaState = "preparing";
    // Start media in the same gesture as fullscreen; no native player is opened.
    movie.play().catch(() => {
      if (run === generation)
        gate("Entrar na cena", "Toque para começar a cena.");
    });
    enterFullscreen();
  }
  function start() {
    if (!Raizes.won() || active) return;
    generation++;
    previousFocus = document.activeElement;
    active = true;
    finished = false;
    closing = false;
    clearTimeout(finishTimer);
    document.body.classList.add("island-ending");
    document.body.dataset.endingState = "retrospectiva";
    document.body.dataset.finaleScene = "retrospectiva";
    enterFullscreen();
    JornadaRetorno.start(startMovie);
  }
  function startMovie() {
    if (!active || finished) return;
    document.body.dataset.endingState = "video";
    document.body.dataset.finaleScene = "video";
    const movie = $("final-movie"),
      cinema = $("final-cinema");
    cinema.hidden = false;
    cinema.dataset.cinemaQuiet = "false";
    cinema.dataset.cinemaState = "preparing";
    movie.controls = false;
    movie.currentTime = 0;
    window.GuardiaoAudio?.cinematic(true);
    cinema.focus({ preventScroll: true });
    if (
      window.GuardiaoTela?.state().fullscreen ||
      navigator.userActivation?.isActive
    )
      playScene();
    else {
      movie.load();
      gate("Entrar na cena", "Toque para assistir à cena em tela cheia.");
    }
  }
  function stop() {
    const wasActive = active;
    active = false;
    generation++;
    closing = false;
    clearTimeout(finishTimer);
    clearTimeout(quietTimer);
    JornadaRetorno.stop();
    $("final-movie").pause();
    $("final-cinema").hidden = true;
    $("cinema-gate").hidden = true;
    document.body.classList.remove("island-ending");
    if ($("final-credits").open) $("final-credits").close();
    if (wasActive) {
      window.GuardiaoAudio?.cinematic(false);
      if (document.body.dataset.view === "mapa") RaizesApp.refreshMap();
      previousFocus?.focus?.();
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    const movie = $("final-movie"),
      cinema = $("final-cinema");
    movie.addEventListener("ended", complete);
    movie.addEventListener("playing", () => {
      if (!inCinema() || closing) return;
      $("cinema-gate").hidden = true;
      cinema.dataset.cinemaState = "playing";
      wakeControls();
    });
    movie.addEventListener("pause", () => {
      if (!movie.ended && inCinema() && !closing)
        gate("Continuar cena", "Toque para continuar de onde parou.", "paused");
    });
    const failure = () =>
      gate(
        "Tentar novamente",
        "Não foi possível carregar a cena. Tente novamente ou pule para continuar.",
        "error",
      );
    movie.addEventListener("error", failure);
    movie.querySelector("source").addEventListener("error", failure);
    $("cinema-action").onclick = () => {
      if (movie.error) movie.load();
      playScene();
    };
    $("ending-skip").onclick = complete;
    $("ending-island").onclick = stop;
    $("final-credits").addEventListener("cancel", (e) => {
      e.preventDefault();
      stop();
    });
    cinema.addEventListener("pointermove", wakeControls);
    cinema.addEventListener("pointerdown", wakeControls);
    cinema.addEventListener("focusin", wakeControls);
    cinema.addEventListener("keydown", (e) => {
      wakeControls();
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        complete();
      }
      if (e.key === "Tab") {
        const controls = [$("cinema-action"), $("ending-skip")].filter(
          (el) => el.getClientRects().length,
        );
        const i = controls.indexOf(document.activeElement),
          next = e.shiftKey
            ? i <= 0
              ? controls.length - 1
              : i - 1
            : (i + 1) % controls.length;
        e.preventDefault();
        controls[next]?.focus();
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && inCinema()) movie.pause();
    });
  });
  window.VivaFinal = {
    get active() {
      return active;
    },
    start,
    stop,
    skip: complete,
    paint: (...args) => JornadaRetorno.paint(...args),
    state: () => ({
      active,
      finished,
      closing,
      elapsed: $("final-movie")?.currentTime || 0,
      scene: document.body.dataset.finaleScene,
      cinema: $("final-cinema")?.dataset.cinemaState,
      retrospective: JornadaRetorno.state(),
    }),
  };
})();
