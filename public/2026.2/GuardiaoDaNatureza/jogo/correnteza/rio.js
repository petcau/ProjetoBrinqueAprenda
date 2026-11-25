"use strict";
(() => {
  const Previous = GuardiaoAdventureArt;
  const swimScale = 0.78;
  const assets = new URL("../jornada-final/", document.currentScript.src);
  window.GuardiaoAdventureArt = class extends Previous {
    async load(...args) {
      await super.load(...args);
      if (this.phase !== 2) return;
      this.dressingImage = new Image();
      this.dressingImage.src = new URL(
        JornadaFinalAtlas["vestir-traje"].file,
        assets,
      );
      await this.dressingImage.decode();
    }
    riverTrash(c, sprites, target, p, progress) {
      if (this.phase !== 2 || !p.swimming || !target)
        return super.riverTrash(c, sprites, target, p, progress);
      c.save();
      c.translate(p.x, p.y);
      c.scale(swimScale, swimScale);
      const result = super.riverTrash(
        c,
        sprites,
        {
          ...target,
          x: (target.x - p.x) / swimScale,
          y: (target.y - p.y) / swimScale,
        },
        { ...p, x: 0, y: 0 },
        progress,
      );
      c.restore();
      return result;
    }
    river(c, p, time, reduced, options = {}) {
      if (this.phase !== 2) return super.river(c, p, time, reduced, options);
      if (options.dressing) {
        const d = JornadaFinalAtlas["vestir-traje"],
          im = this.dressingImage,
          progress = Math.max(0, Math.min(0.999, options.progress || 0)),
          index = Math.min(5, Math.floor(progress * 6)),
          f = d.frames[index],
          b = f.bounds,
          k = 86 / f.height;
        c.save();
        c.translate(p.x, p.y);
        if (im)
          c.drawImage(
            im,
            ...b,
            (b[0] - f.pivot[0]) * k,
            (b[1] - f.pivot[1]) * k,
            b[2] * k,
            b[3] * k,
          );
        c.restore();
        document.body.dataset.dressingPose = String(index);
        return "vestindo-traje:" + index;
      }
      if (!p.swimming) return super.river(c, p, time, reduced, options);
      // Corpo parcialmente submerso. Composição reutilizada por quadro, sem
      // alocar uma superfície nova a cada atualização do jogo.
      this.swimSurface ||= Object.assign(document.createElement("canvas"), {
        width: 220,
        height: 180,
      });
      const g = this.swimSurface.getContext("2d");
      g.clearRect(0, 0, 220, 180);
      const pose = super.river(
        g,
        { ...p, x: 110, y: 90 },
        time,
        reduced,
        options,
      );
      g.globalCompositeOperation = "source-atop";
      // A cabeça emerge; braços, tronco e nadadeiras ficam sob a água em
      // todas as direções, inclusive quando os pés estão acima da cabeça na tela.
      g.beginPath();
      g.rect(0, 0, 220, 180);
      g.ellipse(110, 65, 16, 19, 0, 0, Math.PI * 2);
      g.fillStyle = "#57cfc65e";
      g.fill("evenodd");
      g.globalCompositeOperation = "destination-out";
      g.fillStyle = "#00000044";
      g.fill("evenodd");
      g.globalCompositeOperation = "source-over";
      const scale = swimScale;
      c.drawImage(
        this.swimSurface,
        p.x - 110 * scale,
        p.y - 90 * scale,
        220 * scale,
        180 * scale,
      );
      c.save();
      c.strokeStyle = "#e1fff4bd";
      c.lineWidth = 1.2;
      const t = reduced ? 0 : time;
      for (let i = 0; i < 3; i++) {
        const q = (t * 0.65 + i / 3) % 1;
        c.globalAlpha = (1 - q) * 0.7;
        c.beginPath();
        c.ellipse(
          p.x,
          p.y - 7,
          (18 + q * 18) * scale,
          (4 + q * 4) * scale,
          0,
          0.08,
          Math.PI * 0.95,
        );
        c.stroke();
      }
      c.restore();
      document.body.dataset.swimImmersion = "waterline";
      return pose;
    }
  };
})();
