"use strict";
(() => {
  const Previous = GuardiaoColar;
  window.GuardiaoColar = class extends Previous {
    begin(done) {
      super.begin(done);
      const panel = document.getElementById("vitoria");
      if (!panel) return;
      this.summary = panel;
      this.originalParent = this.svg.parentElement;
      this.rewardFigure = panel.querySelector(".resumo-colar");
      this.rewardFigure.replaceChildren(this.svg);
      const caption = document.createElement("figcaption");
      caption.textContent = "Um novo cristal para o seu colar";
      this.rewardFigure.append(caption);
      const stats = panel.querySelector("#victory-stats"),
        data = window.GuardiaoFasesJogaveis?.[this.phase];
      if (stats && data)
        stats.innerHTML = data.goals
          .map(
            ([, label, total]) =>
              `<span><strong>${total}</strong>${label}</span>`,
          )
          .join("");
      panel.classList.add("reward-preview");
      this.element.hidden = true;
    }
    render(time, reduced) {
      super.render(time, reduced);
      if (!this.active || !this.summary) return;
      this.element.hidden = true;
      document.body.classList.remove("colar-em-cena");
      const cinema = document.getElementById("cinema");
      if (cinema) cinema.hidden = true;
      const canvas = this.summary.querySelector("canvas");
      if (canvas)
        RaizesPersonagens.canvas(canvas, (c, w, h) =>
          RioClaroResumo.paint(c, w, h, time, reduced),
        );
      const eyebrow = this.summary.querySelector(".resumo-cabecalho p");
      eyebrow.textContent =
        time < 2.8 ? "SEU NOVO CRISTAL" : "MISSÃO CONCLUÍDA";
    }
    complete() {
      super.complete();
      if (this.summary) {
        this.originalParent.append(this.svg);
        this.summary.classList.remove("reward-preview");
      }
    }
  };
})();
