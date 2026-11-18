"use strict";
(() => {
  const Previous = GuardiaoColar;
  window.GuardiaoColar = class extends Previous {
    begin(onFinish) {
      this.celebrationReady = false;
      if (this.phase === 5)
        RaizesPersonagens.load(["acoes"])
          .then(() => {
            this.celebrationReady = true;
          })
          .catch(() => {});
      super.begin(onFinish);
    }
    create() {
      super.create();
      const canvas = this.element.querySelector("canvas");
      canvas.width = 300;
      canvas.height = 230;
      const strip = document.createElement("div");
      strip.className = "colar-pedras";
      strip.setAttribute("aria-hidden", "true");
      strip.innerHTML = Array.from(
        { length: 5 },
        (_, i) =>
          `<span data-pedra-resumo="${i + 1}">${GuardiaoRelicario.fragment(i, true)}</span>`,
      ).join("");
      this.element.querySelector("footer").append(strip);
      this.badges = [...strip.children];
    }
    render(time, reduced = false) {
      super.render(time, reduced);
      if (!this.active) return;
      const earned = time >= 2.8 ? this.after : this.before;
      this.badges.forEach((e, i) =>
        e.classList.toggle("obtained", earned.includes(i + 1)),
      );
      const c = this.element.querySelector("canvas").getContext("2d");
      c.clearRect(0, 0, 300, 230);
      if (this.phase === 5 && time >= 2.8 && this.celebrationReady)
        RaizesPersonagens.draw(c, "acoes", 5, 110, 220, 185);
      else this.drawActor(c, time, 110, 220, 185);
      this.life?.draw(
        c,
        "flora",
        reduced ? 14 : 14 + (Math.floor(time * 4) % 2),
        240,
        121,
        61,
      );
    }
  };
})();
