"use strict";
(() => {
  const base = new URL("./", document.currentScript.src),
    branch = new Image();
  branch.src = new URL("assets/galho.webp", base).href;
  branch.decode().catch(() => {});
  ArteVivaContextos.settings = (c, w, h, time) => {
    VivaArt.scenery(c, 5, w, h);
    const reduced = document.body.classList.contains("reduce-motion"),
      width = w * 0.94,
      height = (width * branch.naturalHeight) / (branch.naturalWidth || 3),
      perch = h * 0.9;
    if (branch.complete && branch.naturalWidth)
      c.drawImage(branch, w * 0.03, perch - height * 0.46, width, height);
    const pose = ArteVivaPersonagens.frame(4, "ombro", time, 0, reduced);
    // O galho tem uma superfície estável; só Flora respira e pisca.
    RaizesPersonagens.draw(
      c,
      "flora",
      pose.index,
      w * 0.58,
      perch,
      Math.min(h * 0.63, w * 0.42) + (reduced ? 0 : Math.sin(time * 2) * 0.6),
      { flip: pose.flip },
    );
  };
})();
