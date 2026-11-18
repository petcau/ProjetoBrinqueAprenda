"use strict";
(() => {
  const Previous = window.GuardiaoColar,
    bank = window.GuardiaoRelicario;
  const base = new URL("./", document.currentScript.src);
  const ease = (n) => {
    n = Math.max(0, Math.min(1, n));
    return n * n * (3 - 2 * n);
  };
  const titles = [
    "O primeiro cuidado",
    "A força da água",
    "Amigos em segurança",
    "A floresta renasce",
    "Cinco cuidados, um Guardião",
  ];
  class Necklace extends Previous {
    create() {
      this.element = document.createElement("section");
      this.element.id = "colar-cena";
      this.element.className = "colar-cutscene encontro-recompensa";
      this.element.hidden = true;
      this.element.setAttribute("role", "region");
      this.element.setAttribute(
        "aria-label",
        "A conquista do colar do Guardião",
      );
      this.element.innerHTML = `<div class="colar-card"><header><p class="colar-eyebrow">UM CUIDADO, UMA CONQUISTA</p><h2 id="colar-titulo"></h2><p id="colar-frase" role="status" aria-live="polite"></p></header>${bank.necklace([], "cutscene")}<footer><canvas id="colar-kai" width="300" height="160" role="img" aria-label="Kai veste o colar e comemora com Flora"></canvas><p><strong id="colar-contagem"></strong><span>cristais conquistados</span></p></footer><button id="colar-continuar" type="button">Continuar a aventura <span aria-hidden="true">→</span></button></div>`;
      document.body.append(this.element);
      this.svg = this.element.querySelector(".colar-view");
      this.gemNodes = [...this.element.querySelectorAll("[data-colar-pedra]")];
      this.spark = this.element.querySelector(".colar-brilho");
      this.caption = this.element.querySelector("#colar-frase");
      this.count = this.element.querySelector("#colar-contagem");
      this.button = this.element.querySelector("button");
      this.button.addEventListener("click", () => {
        if (!this.active || this.finishing) return;
        this.finishing = true;
        this.onFinish?.();
      });
    }
    async load() {
      await Promise.all([
        bank.load(),
        (async () => {
          this.actor = new Image();
          this.actor.src = new URL(
            "../sprites-integros/" + GuardiaoColarArte.file,
            base,
          ).href;
          await this.actor.decode();
        })(),
      ]);
    }
    begin(onFinish) {
      super.begin(onFinish);
      this.element.querySelector("h2").textContent = titles[this.phase - 1];
    }
    render(time, reduced = false) {
      if (!this.active) return;
      const opacity =
        ease((time - 0.75) / 0.4) * (1 - ease((time - 5.85) / 0.45));
      this.element.hidden = opacity <= 0;
      this.element.style.opacity = String(opacity);
      this.element.style.pointerEvents = opacity > 0.5 ? "auto" : "none";
      document.body.classList.toggle("colar-em-cena", opacity > 0.5);
      const landed = time >= 2.8;
      this.element.dataset.state = landed
        ? "encaixado"
        : time >= 1.5
          ? "encaixando"
          : "vazio";
      this.element.dataset.pieces = String(
        this.before.length + (landed ? 1 : 0),
      );
      if (opacity > 0.7 && !this.focused) {
        this.focused = true;
        this.button.focus({ preventScroll: true });
      }
      const travel = ease((time - 1.5) / 1.3);
      this.gemNodes.forEach((node, i) => {
        const current = i + 1 === this.phase,
          visible =
            this.before.includes(i + 1) ||
            (current && time >= 1.5 && (!reduced || landed));
        node.style.opacity = visible ? "1" : "0";
        node.setAttribute(
          "transform",
          current && !landed && !reduced
            ? `translate(${(1 - travel) * 75} ${-(1 - travel) * 155})`
            : "translate(0 0)",
        );
      });
      const slot = bank.slots[this.phase - 1],
        flash = landed && !reduced ? Math.max(0, 1 - (time - 2.8) / 0.9) : 0;
      this.spark.style.opacity = String(flash);
      this.spark.setAttribute(
        "transform",
        `translate(${slot[0] + slot[2] / 2} ${slot[1] + slot[3] / 2}) scale(${0.8 + (1 - flash) * 1.5})`,
      );
      const stage = landed ? "encaixado" : "vazio";
      if (stage !== this.messageStage) {
        this.messageStage = stage;
        if (landed) window.GuardiaoAudio?.effect("restaurar", { gain: 0.65 });
        const word = ["vermelha", "azul", "amarela", "verde", "violeta"][
          this.phase - 1
        ];
        this.caption.textContent = landed
          ? `A pedra ${word} encontrou seu lugar!`
          : this.phase === 1
            ? "O primeiro cristal vai guardar este cuidado."
            : "Cada cuidado completa sua história.";
        this.count.textContent =
          this.before.length + (landed ? 1 : 0) + " de 5";
        this.svg.setAttribute(
          "aria-label",
          `Amuleto com ${this.before.length + (landed ? 1 : 0)} de cinco cristais`,
        );
      }
      const c = this.element.querySelector("canvas").getContext("2d");
      c.clearRect(0, 0, 300, 160);
      this.drawActor(c, time, 100, 150, 116);
      this.life?.draw(
        c,
        "flora",
        reduced ? 14 : 14 + (Math.floor(time * 5) % 2),
        220,
        95,
        46,
      );
    }
    crystal(ctx, x, y, size) {
      bank.paintStone(
        ctx,
        this.phase - 1,
        x - size * 0.6,
        y - size * 0.8,
        size * 1.2,
        size * 1.6,
      );
    }
    medallion(ctx, x, y, scale, earned) {
      bank.paint(ctx, x, y, 13 * scale, earned);
    }
  }
  window.GuardiaoColar = Necklace;
})();
