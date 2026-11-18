"use strict";
(() => {
  const A = RaizesPersonagens,
    sheet = ArteVivaAtlas.flora;
  A.atlas.flora = sheet;
  if (window.GuardiaoVidaAtlas)
    GuardiaoVidaAtlas.flora = {
      ...sheet,
      file: "../../arte-viva/assets/flora.webp",
    };

  // As 16 poses frontais são as artes anteriores; só costas e perfil são novas.
  const cycle = [0, 1, 2, 1];
  function frame(direction, mode, time, progress = 0, reduced = false) {
    const d = ((Math.round(direction || 0) % 8) + 8) % 8;
    const back = [1, 2, 3].includes(d),
      side = d === 0 || d === 4;
    const row = d === 2 ? 0 : back ? 1 : side ? 2 : -1;
    const perched = mode === "ombro" || mode === "fala";
    let index;
    if (row >= 0) {
      const step = perched
        ? 3
        : mode === "pousando"
          ? progress > 0.65
            ? 3
            : 2
          : mode === "decolando"
            ? progress < 0.35
              ? 3
              : 0
            : reduced
              ? 1
              : cycle[Math.floor(time * 7) % 4];
      index = 16 + row * 4 + step;
    } else
      index =
        mode === "festa" || mode === "comemorando"
          ? 14 + (reduced ? 0 : Math.floor(time * 4) % 2)
          : perched
            ? 12 + (!reduced && time % 5 > 4.72 ? 1 : 0)
            : mode === "pousando"
              ? 8 + Math.min(3, Math.floor(progress * 4))
              : mode === "decolando"
                ? 11 - Math.min(3, Math.floor(progress * 4))
                : reduced
                  ? 2
                  : Math.floor(time * 8) % 8;
    return { index, row, flip: [3, 4, 5].includes(d), direction: d };
  }
  function owl(c, x, y, h, t, mode = "voo", flip = false, progress = 0) {
    const pose = frame(
      6,
      mode,
      t,
      progress,
      document.body.classList.contains("reduce-motion"),
    );
    A.draw(c, "flora", pose.index, x, y, h, { flip });
    return pose.index;
  }
  A.owl = owl;
  if (window.VivaArt) VivaArt.owl = owl;
  const Life = window.GuardiaoVidaNatural;
  if (Life)
    window.GuardiaoVidaNatural = class extends Life {
      async load(...args) {
        await Promise.all([super.load(...args), A.load(["flora"])]);
      }
      flora(c, f, p, time, reduced) {
        const direction =
          f.mode === "comemorando"
            ? 6
            : FloraCompanheira.direction(p, this.phase);
        const duration = f.mode === "pousando" ? 0.55 : 0.38;
        const amount =
          f.mode === "ombro"
            ? 1
            : f.mode === "pousando"
              ? Math.min(1, f.elapsed / 0.55)
              : f.mode === "decolando"
                ? 1 - Math.min(1, f.elapsed / 0.38)
                : 0;
        const pose = frame(
          direction,
          f.mode,
          time,
          Math.min(1, f.elapsed / duration),
          reduced,
        );
        A.draw(
          c,
          "flora",
          pose.index,
          f.x,
          f.y + (reduced || amount === 1 ? 0 : Math.sin(time * 4) * 0.6),
          35 - 8 * amount,
          { flip: pose.flip },
        );
        Object.assign(document.body.dataset, {
          floraFrame: String(pose.index),
          floraView: String(direction),
          floraPerspective: String(pose.row),
        });
      }
      draw(c, name, index, x, y, h, options = {}) {
        if (name === "flora") return A.draw(c, name, index, x, y, h, options);
        return super.draw(c, name, index, x, y, h, options);
      }
    };
  // Kai mantém as pranchas limpas originais, incluindo os cinco uniformes.
  // Nenhum quadro novo substitui o rosto quando ele para ou muda de traje.
  window.ArteVivaPersonagens = { frame, owl, atlas: sheet };
})();
