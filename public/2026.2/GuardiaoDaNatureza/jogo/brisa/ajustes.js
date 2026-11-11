"use strict";
(() => {
  const bind = Raizes.bindSettings,
    save = Raizes.save;
  // Um passeio 18% mais calmo mantém a geometria e a resposta aos controles.
  window.BrisaRitmo = {
    get speed() {
      return Raizes.prefs().calmPace === false ? 1 : 0.82;
    },
  };
  Raizes.save = (next) =>
    save(
      "graphicsQuality" in next &&
        "screenTransitions" in next &&
        "musicVolume" in next
        ? { ...next, calmPace: true }
        : next,
    );
  Raizes.bindSettings = (el) => {
    bind(el);
    el.querySelectorAll("[data-setting-panel]").forEach((panel) => {
      const animate = panel.animate.bind(panel);
      panel.animate = () =>
        animate(
          [
            { opacity: 0.65, transform: "translateY(3px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 340, easing: "ease-out" },
        );
    });
    const section = el.querySelector('[data-setting-panel="controles"]');
    const label = document.createElement("label");
    label.className = "ra-setting calm-pace";
    label.innerHTML = `<span><strong>Passeio tranquilo</strong><small>Kai caminha um pouco mais devagar.</small></span><input type="checkbox" name="calmPace" role="switch" ${Raizes.prefs().calmPace !== false ? "checked" : ""}>`;
    section.insertBefore(label, section.querySelector(".ra-help"));
    label.addEventListener("change", (e) =>
      Raizes.save({ calmPace: e.target.checked }),
    );
    section
      .querySelector('[name="controlMode"]')
      .closest("label")
      .classList.add("mode-choice");
  };
})();
