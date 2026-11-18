"use strict";
(() => {
  const root = new URL("../../", document.currentScript.src);
  const files = window.GuardiaoArquivosLeves || {};
  function optimized(file, base) {
    const url = new URL(file, new URL(base, root));
    const key = url.pathname.slice(root.pathname.length);
    return files[key] ? new URL(files[key], root).href : null;
  }
  function atlas(records, base, forest = false) {
    for (const record of Object.values(records || {})) {
      if (!record?.file) continue;
      const file = optimized(record.file, base);
      if (file)
        record.file = forest
          ? "../../cuidado-acessivel/assets/" + file.split("/").at(-1)
          : file;
    }
  }
  atlas(window.GuardiaoVidaAtlas, "jogo/vida-natural/assets/");
  atlas(
    window.GuardiaoFlorestaAtlas?.sheets,
    "jogo/floresta-viva/assets/",
    true,
  );
  atlas(window.GuardiaoCampanhaAtlas, "jogo/jornada/");
  atlas(window.GuardiaoAmanhaAtlas, "jogo/novo-amanha/");
  atlas(window.GuardiaoEquilibrioAtlas, "jogo/vida-em-equilibrio/");
  atlas(window.GuardiaoRenascimentoAtlas, "");
  for (const [key, value] of Object.entries(
    window.GuardiaoArteManifesto || {},
  )) {
    if (files[value]) window.GuardiaoArteManifesto[key] = files[value];
  }
  for (const [key, value] of Object.entries(files))
    window.GuardiaoArteManifesto[key] = value;
  document.documentElement.dataset.artQuality = "webp-otimizado";
})();
