"use strict";
(() => {
  const before = window.GuardiaoColecao,
    atlas = window.GuardiaoPlantasAtlas;
  const file = new URL(atlas.file, document.currentScript.src).href;
  let nextClip = 0;
  function plant(name) {
    const row = { ipê: 0, ingá: 1, aroeira: 2 }[name] ?? 0,
      b = atlas.frames[row * 4 + 1].bounds;
    const id = "plant-frame-" + ++nextClip;
    return `<svg viewBox="${b.join(" ")}" aria-hidden="true"><defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse"><rect x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}"/></clipPath></defs><image href="${file}" width="${atlas.width}" height="${atlas.height}" clip-path="url(#${id})"/></svg>`;
  }
  window.GuardiaoColecao = Object.freeze({ ...before, plant });
})();
