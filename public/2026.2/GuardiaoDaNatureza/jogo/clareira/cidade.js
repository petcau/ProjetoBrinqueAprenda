"use strict";
(() => {
  const spots = [
    {
      kind: "plastic",
      label: "Plástico",
      colorName: "Vermelha",
      x: 132,
      y: 525,
    },
    { kind: "glass", label: "Vidro", colorName: "Verde", x: 192, y: 507 },
    { kind: "metal", label: "Metal", colorName: "Amarela", x: 252, y: 489 },
    { kind: "paper", label: "Papel", colorName: "Azul", x: 312, y: 471 },
  ];
  window.GuardiaoCidadeBins = Object.freeze(spots.map(Object.freeze));
  const phases = structuredClone(GuardiaoFasesJogaveis),
    city = phases[5];
  const kinds = ["plastic", "paper", "metal", "glass", "paper", "plastic"];
  const names = [
    "Garrafa plástica",
    "Papel limpo",
    "Latinha de alumínio",
    "Pote de vidro",
    "Caixa de papelão",
    "Embalagem plástica",
  ];
  city.tasks
    .filter((t) => t.type === "recycle")
    .forEach((t, i) => {
      t.material = t.category = kinds[i];
      t.name = names[i];
    });
  city.obstacles = city.obstacles.filter(
    (o) =>
      o.name !== "lixeira" &&
      ![
        [154, 514],
        [225, 493],
        [300, 472],
      ].some(([x, y]) => o.x === x && o.y === y),
  );
  city.obstacles.push(
    ...spots.map((s) => ({ name: "lixeira", x: s.x, y: s.y, rx: 16, ry: 8 })),
  );
  city.intro[1] =
    "Separe plástico na vermelha, vidro na verde, metal na amarela e papel na azul. Depois cuide dos painéis e jardins!";
  window.GuardiaoFasesJogaveis = Object.freeze(phases);
  const Previous = GuardiaoAdventureArt;
  window.GuardiaoAdventureArt = class extends Previous {
    async load(...args) {
      await super.load(...args);
      if (this.phase === 5 && !window.GuardiaoRemodelacao)
        await Promise.all(
          spots.map((s) => this.drawing(s.kind, GuardiaoColecao.bin(s.kind))),
        );
    }
    residual(c, t) {
      if (this.phase !== 5 || t.type !== "recycle") return super.residual(c, t);
      c.save();
      c.translate(t.x, t.y - 4);
      c.lineWidth = 1.5;
      c.strokeStyle = "#47605b";
      if (t.material === "glass") {
        c.fillStyle = "#89cdbba0";
        c.beginPath();
        c.roundRect(-8, -16, 16, 20, 3);
        c.fill();
        c.stroke();
        c.fillStyle = "#cbae76";
        c.fillRect(-9, -19, 18, 4);
        c.strokeStyle = "#e0fff0";
        c.beginPath();
        c.moveTo(-4, -11);
        c.lineTo(-4, 0);
        c.stroke();
      } else if (t.material === "paper") {
        c.fillStyle = "#efe6c7";
        c.fillRect(-11, -13, 22, 17);
        c.strokeRect(-11, -13, 22, 17);
        c.beginPath();
        for (let i = 0; i < 3; i++) {
          c.moveTo(-6, -8 + i * 4);
          c.lineTo(6, -8 + i * 4);
        }
        c.stroke();
      } else if (t.material === "metal") {
        c.fillStyle = "#a5b9bf";
        c.beginPath();
        c.roundRect(-7, -17, 14, 22, 4);
        c.fill();
        c.stroke();
        c.fillStyle = "#e9ede8";
        c.beginPath();
        c.ellipse(0, -15, 6, 2, 0, 0, Math.PI * 2);
        c.fill();
      } else {
        c.fillStyle = "#79b6d3aa";
        c.beginPath();
        c.moveTo(-3, -17);
        c.lineTo(3, -17);
        c.lineTo(3, -11);
        c.lineTo(8, -6);
        c.lineTo(7, 5);
        c.lineTo(-7, 5);
        c.lineTo(-8, -6);
        c.lineTo(-3, -11);
        c.closePath();
        c.fill();
        c.stroke();
        c.fillStyle = "#e0ca77";
        c.fillRect(-4, -20, 8, 4);
      }
      c.restore();
      return true;
    }
    binActors(c) {
      if (this.phase !== 5) return [];
      return spots.map((s) => ({
        y: s.y,
        draw: () => {
          const im = this.drawings.get(s.kind);
          if (!im) return;
          c.drawImage(im, s.x - 25, s.y - 59, 50, 61);
          c.save();
          c.font = "bold 10px system-ui";
          c.textAlign = "center";
          c.strokeStyle = "#244635";
          c.lineWidth = 3;
          c.fillStyle = "#fff4d6";
          c.strokeText(s.label, s.x, s.y + 11);
          c.fillText(s.label, s.x, s.y + 11);
          c.restore();
        },
      }));
    }
  };
})();
