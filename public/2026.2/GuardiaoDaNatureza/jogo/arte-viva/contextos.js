"use strict";
(() => {
  const A = VivaArt,
    R = RaizesPersonagens;
  const still = () => document.body.classList.contains("reduce-motion");
  A.friends = (c, w, h, time) => {
    A.scenery(c, 5, w, h);
    const hh = Math.min(h * 0.72, w * 0.83),
      y = h * 0.94;
    // Kai e Flora se olham. As asas ficam longe do rosto de Kai.
    R.draw(c, "acoes", 0, w * 0.34, y, hh);
    A.owl(
      c,
      w * 0.77,
      h * 0.48 + (still() ? 0 : Math.sin(time * 2) * 2),
      hh * 0.31,
      time,
      "voo",
      true,
    );
  };
  function settings(c, w, h, time) {
    A.scenery(c, 5, w, h);
    // Uma pose pousada de perfil sobre um galho; o diário usa Flora em voo.
    c.strokeStyle = "#714a2d";
    c.lineWidth = 9;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(w * 0.14, h * 0.87);
    c.quadraticCurveTo(w * 0.55, h * 0.8, w * 0.85, h * 0.91);
    c.stroke();
    c.strokeStyle = "#b48b4b";
    c.lineWidth = 2;
    c.stroke();
    const f = ArteVivaPersonagens.frame(4, "ombro", time, 0, still());
    R.draw(
      c,
      "flora",
      f.index,
      w * 0.57,
      h * 0.85,
      Math.min(h * 0.62, w * 0.48),
      { flip: f.flip },
    );
  }
  window.ArteVivaContextos = { settings };
})();
