"use strict";
(() => {
  const base = new URL("./", document.currentScript.src),
    warmed = new Set(),
    files = new Set();
  const maps = {
    1: "floresta",
    2: "rio",
    3: "fauna",
    4: "plantio",
    5: "cidade",
  };
  function prefetch(file, from = base) {
    const url = new URL(file, from).href;
    if (files.has(url)) return;
    files.add(url);
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "image";
    link.href = url;
    link.fetchPriority = "low";
    document.head.append(link);
  }
  function prepare() {
    const id = Number(document.body.dataset.phasePreview);
    if (
      !maps[id] ||
      warmed.has(id) ||
      navigator.connection?.saveData ||
      !GuardiaoProgresso.unlocked(id)
    )
      return;
    warmed.add(id);
    prefetch("../reencontro/assets/" + maps[id] + "-antes.webp");
    prefetch("../arte-viva/assets/flora.webp");
    for (const name of [
      "explorador",
      "equipamentos",
      id === 1 ? "mangueira" : GuardiaoMemoria.phaseUniform(id),
      ...(id >= 3 ? ["tarefas"] : []),
    ])
      if (BosqueKaiAtlas[name])
        prefetch(BosqueKaiAtlas[name].file, BosqueKai.base);
    if (id === 2) prefetch("../reencontro/assets/kai-rio-cuidado.webp");
  }
  document.addEventListener("DOMContentLoaded", () => {
    new MutationObserver(prepare).observe(document.body, {
      attributes: true,
      attributeFilter: ["data-phase-preview"],
    });
  });
  window.BrisaSuaveCarregamento = {
    prepare,
    state: () => ({ phases: [...warmed], files: files.size }),
  };
})();
