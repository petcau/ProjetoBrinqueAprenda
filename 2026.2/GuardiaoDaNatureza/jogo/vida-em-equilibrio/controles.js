"use strict";
(() => {
  const key = "guardiao.horizonte.preferences.v1";
  const queries = [
    matchMedia("(pointer:coarse)"),
    matchMedia("(any-pointer:coarse)"),
  ];
  let prefs = {};
  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(key) || "{}") || {};
    } catch {
      return {};
    }
  };
  prefs = read();
  function detected() {
    // Tablets with a trackpad can report a fine primary pointer; their touch screen still matters.
    return queries.some((q) => q.matches) ||
      (navigator.maxTouchPoints > 0 &&
        Math.min(screen.width, screen.height) <= 1100)
      ? "touch"
      : "keyboard";
  }
  const mode = () =>
    ["touch", "keyboard"].includes(prefs.controlMode)
      ? prefs.controlMode
      : "auto";
  const effective = () => (mode() === "auto" ? detected() : mode());
  function apply() {
    document.body.dataset.controls = effective();
    document.body.dataset.detectedDevice = detected();
    document.body.classList.toggle("left-handed", prefs.leftHanded === true);
    document
      .querySelectorAll("[data-control-mode]")
      .forEach((el) => (el.value = mode()));
    document
      .querySelectorAll("[data-control-description]")
      .forEach(
        (el) =>
          (el.textContent =
            effective() === "touch"
              ? "Celular: joystick e botões de toque visíveis."
              : "Computador: use o teclado. Os botões de toque ficam ocultos."),
      );
    window.dispatchEvent(
      new CustomEvent("guardiao:controles", {
        detail: {
          mode: mode(),
          effective: effective(),
          preferences: { ...prefs },
        },
      }),
    );
  }
  function setMode(value) {
    if (!["auto", "touch", "keyboard"].includes(value)) return;
    prefs = { ...prefs, ...read(), controlMode: value };
    try {
      localStorage.setItem(key, JSON.stringify(prefs));
    } catch {}
    apply();
  }
  document.addEventListener("change", (e) => {
    if (e.target.matches("[data-control-mode]")) setMode(e.target.value);
  });
  window.addEventListener("storage", (e) => {
    if (e.key === key) {
      prefs = read();
      apply();
    }
  });
  queries.forEach((q) => q.addEventListener("change", apply));
  window.addEventListener("resize", apply);
  window.GuardiaoControles = Object.freeze({
    mode,
    effective,
    setMode,
    refresh: (overrides) => {
      prefs = { ...prefs, ...read(), ...overrides };
      apply();
    },
  });
  apply();
})();
