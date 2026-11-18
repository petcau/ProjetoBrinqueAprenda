"use strict";
(() => {
  const previous = Raizes.icon;
  let serial = 0;
  const aliases = {
    floresta: "fire",
    rio: "water",
    fauna: "paw",
    reflorestamento: "plant",
    cidade: "sun",
    back: "back",
    exit: "full",
  };
  function icon(raw) {
    const name = aliases[raw] || raw,
      id = "natureza-" + serial++;
    const paths = {
      leaf: `<path d="M15 53C8 21 31 8 54 11c4 25-6 45-32 44" fill="url(#${id}-leaf)"/><path d="M10 60 45 21m-20 24-1-17m10 7 15-1" fill="none" stroke="#f3e8a2" stroke-width="2.5" stroke-linecap="round"/>`,
      book: `<path d="M7 14q13-5 25 3 12-8 25-3v37q-14-5-25 3-13-8-25-3Z" fill="#855026" stroke="#57351e" stroke-width="3"/><path d="M11 11q11-3 21 5 10-8 21-5v34q-11-2-21 5-10-7-21-5Z" fill="#fff1c5" stroke="#c99a4c" stroke-width="2"/><path d="M32 16v33M16 21l10 3m-10 5 10 3m-10 5 10 3" fill="none" stroke="#bc935c" stroke-width="2" stroke-linecap="round"/><path d="M38 37c-4-13 1-17 10-17 1 12-3 17-10 17Z" fill="url(#${id}-leaf)"/><path d="m37 41 7-15" stroke="#f0de8b" stroke-width="1.5"/>`,
      gear: `<path d="m27 6 10 0 2 8 5 2 7-4 7 7-4 7 2 5 8 2v10l-8 2-2 5 4 7-7 7-7-4-5 2-2 8H27l-2-8-5-2-7 4-7-7 4-7-2-5-8-2V33l8-2 2-5-4-7 7-7 7 4 5-2Z" transform="translate(4 -3) scale(.88)" fill="url(#${id}-gold)" stroke="#73431e" stroke-width="3" stroke-linejoin="round"/><circle cx="32" cy="31" r="10" fill="#23583c" stroke="#8e602c" stroke-width="3"/>`,
      full: `<path d="M24 10H11v13m29-13h13v13M11 41v13h13m29-13v13H40" fill="none" stroke="#fff0bd" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
      fire: `<path d="M36 5c3 20 20 25 18 40-2 18-40 20-44 0-3-13 6-21 15-29-2 13 9 13 11-11Z" fill="url(#${id}-fire)" stroke="#a14c22" stroke-width="2"/><path d="M34 31c0 9 11 13 8 20-4 9-20 8-21-1-1-6 8-12 13-19Z" fill="#fff0a2"/>`,
      water: `<path d="M32 5C24 19 10 31 10 43c0 24 44 24 44 0 0-12-14-24-22-38Z" fill="url(#${id}-water)" stroke="#286a81" stroke-width="2"/><path d="M20 34c-6 8-3 17 4 19" fill="none" stroke="#e2feff" stroke-width="4" stroke-linecap="round"/><path d="M42 48q5-4 3-10" fill="none" stroke="#b6f3f6" stroke-width="2" stroke-linecap="round"/>`,
      paw: `<g fill="url(#${id}-gold)" stroke="#86562b" stroke-width="2"><path d="M32 33C22 33 9 47 12 54c3 8 13 1 20 1s18 7 20-1C56 45 42 33 32 33Z"/><ellipse cx="12" cy="29" rx="6" ry="9" transform="rotate(-25 12 29)"/><ellipse cx="25" cy="17" rx="6" ry="9"/><ellipse cx="40" cy="17" rx="6" ry="9"/><ellipse cx="54" cy="29" rx="6" ry="9" transform="rotate(25 54 29)"/></g>`,
      plant: `<path d="M32 56V28" stroke="#4d7536" stroke-width="4"/><path d="M31 38C9 39 8 26 10 19c19-2 24 7 21 19Zm2-10C33 11 44 8 55 12c0 16-9 20-22 16Z" fill="url(#${id}-leaf)" stroke="#3f6c34" stroke-width="2"/><path d="m17 26 14 11m3-10 14-9" stroke="#e0e9a3" stroke-width="2"/><path d="M14 59q18-9 36 0" stroke="#9a6a3d" stroke-width="5" stroke-linecap="round"/>`,
    };
    if (!paths[name]) return previous(raw);
    return `<svg class="nature-symbol brisa-icon brisa-${raw} ${name === "full" ? "brisa-full" : ""} arte-icon" viewBox="0 0 64 64" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><linearGradient id="${id}-leaf" x2=".8" y2="1"><stop stop-color="#d7eb78"/><stop offset=".5" stop-color="#91c84a"/><stop offset="1" stop-color="#3b813b"/></linearGradient><linearGradient id="${id}-gold" x2=".6" y2="1"><stop stop-color="#fff0b0"/><stop offset=".5" stop-color="#e8bd63"/><stop offset="1" stop-color="#b67932"/></linearGradient><linearGradient id="${id}-fire" x2=".3" y2="1"><stop stop-color="#ffdd6a"/><stop offset=".5" stop-color="#ff9a35"/><stop offset="1" stop-color="#dc5527"/></linearGradient><linearGradient id="${id}-water" x2=".8" y2="1"><stop stop-color="#91eff7"/><stop offset=".6" stop-color="#36b6df"/><stop offset="1" stop-color="#277cbb"/></linearGradient></defs>${paths[name]}</svg>`;
  }
  Raizes.icon = icon;
  const oldMarkup = BrisaArte.markup;
  BrisaArte.markup = (name) =>
    ["leaf", "book", "gear", "full", "water", "fire", "paw", "plant"].includes(
      name,
    )
      ? icon(name)
      : oldMarkup(name);
  GuardiaoIcones.markup = icon;
  if (window.GuardiaoArtesInterface) GuardiaoArtesInterface.svg = icon;
  document.addEventListener("DOMContentLoaded", () => {
    // A classe brisa-full conserva o observador de tela cheia sem recriar o ícone.
    document
      .querySelectorAll("[data-fullscreen]")
      .forEach((b) => (b.innerHTML = icon("full")));
  });
})();
