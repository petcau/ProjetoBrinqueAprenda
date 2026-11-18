"use strict";
(() => {
  const spots = [
    { kind: "recyclable", x: 154, y: 514 },
    { kind: "organic", x: 225, y: 493 },
    { kind: "residual", x: 300, y: 472 },
  ];
  const Previous = GuardiaoAdventureArt;
  window.GuardiaoAdventureArt = class extends Previous {
    async load(...args) {
      await super.load(...args);
      if (this.phase === 5)
        await Promise.all(
          spots.map((s) => this.drawing(s.kind, GuardiaoColecao.bin(s.kind))),
        );
    }
    binActors(c) {
      if (this.phase !== 5) return [];
      return spots.map((s, i) => ({
        y: s.y,
        draw: () => {
          const im = this.drawings.get(s.kind);
          if (!im) return;
          c.drawImage(im, s.x - 27, s.y - 61, 54, 63);
          c.save();
          c.font = "bold 9px system-ui";
          c.textAlign = "center";
          c.strokeStyle = "#244635";
          c.lineWidth = 3;
          c.fillStyle = "#fff4d6";
          const label = ["Recicláveis", "Orgânicos", "Rejeitos"][i];
          c.strokeText(label, s.x, s.y + 10);
          c.fillText(label, s.x, s.y + 10);
          c.restore();
        },
      }));
    }
  };
})();
