"use strict";
(() => {
  const baseIcon = Raizes.icon;
  let serial = 0,
    loading;
  const bank = new Map(),
    aliases = {
      watering: "water",
      regador: "water",
      recycle: "trash",
      reciclagem: "trash",
      net: "net",
      protecao: "shield",
      veterinario: "paw",
      kit: "paw",
      mangueira: "hose",
      sementes: "plant",
      mudas: "plant",
      seeds: "plant",
      seedling: "plant",
      jardim: "plant",
      solar: "sun",
      saco: "bag",
      floresta: "fire",
      rio: "water",
      fauna: "paw",
      reflorestamento: "plant",
      cidade: "sun",
    };
  function markup(raw) {
    const name = aliases[raw] || raw,
      id = "viva-emblem-" + serial++;
    const shapes = {
      fire: `<path d="M52 16C54 37 83 40 77 65 73 88 25 91 22 61c-2-16 10-25 19-32-2 20 11 19 11-13Z" fill="url(#${id}-hot)" stroke="#943c20" stroke-width="2"/><path d="M52 45c2 13 17 15 12 29-5 12-25 10-28-1-2-11 11-15 16-28Z" fill="#ffe47d"/>`,
      water: `<path d="M50 15C42 29 22 47 24 65c2 28 52 28 53 0 1-18-19-36-27-50Z" fill="url(#${id}-blue)" stroke="#17668a" stroke-width="2"/><path d="M36 51c-9 12-5 21 3 24" fill="none" stroke="#d3f9ff" stroke-width="5" stroke-linecap="round"/><path d="M19 82q15-8 31 0t31 0" fill="none" stroke="#b0ebdd" stroke-width="3"/>`,
      paw: `<path d="M31 58c-20 17-8 29 8 22l11-5 12 5c18 7 26-8 8-23-14-15-25-16-39 1Z" fill="url(#${id}-gold)" stroke="#76522c" stroke-width="2"/><g fill="#e9c27b" stroke="#76522c" stroke-width="2"><ellipse cx="25" cy="43" rx="8" ry="11" transform="rotate(-25 25 43)"/><ellipse cx="41" cy="31" rx="8" ry="11"/><ellipse cx="60" cy="31" rx="8" ry="11"/><ellipse cx="76" cy="43" rx="8" ry="11" transform="rotate(25 76 43)"/></g>`,
      leaf: `<path d="M77 21C34 14 14 39 27 74c32 14 59-14 50-53Z" fill="url(#${id}-green)" stroke="#2b572a" stroke-width="2"/><path d="M20 82 65 35m-24 25-3-20m13 9 16 1" fill="none" stroke="#e0ed98" stroke-width="3" stroke-linecap="round"/>`,
      plant: `<path d="M27 82q23-12 48 0" fill="none" stroke="#9e7446" stroke-width="8" stroke-linecap="round"/><path d="M50 79V44" stroke="#527335" stroke-width="6"/><path d="M49 59C17 57 16 36 22 29c25-2 33 12 27 30Zm2-11C49 21 66 15 80 22c1 22-13 29-29 26Z" fill="url(#${id}-green)" stroke="#356135" stroke-width="2"/><path d="M28 37 49 56m3-11 20-17" stroke="#d5e48d" stroke-width="2"/>`,
      sun: `<path d="M22 52 50 29 79 52v31H23Z" fill="#e5c07b" stroke="#6f5534" stroke-width="2"/><path d="m18 51 32-27 33 27" fill="none" stroke="#7b5532" stroke-width="8" stroke-linecap="round"/><path d="M37 84V60h24v24" fill="#577c4c"/><rect x="36" y="42" width="28" height="14" rx="2" fill="#4c9fb1" stroke="#ece19f" stroke-width="2"/><circle cx="76" cy="23" r="8" fill="#ffdd79"/><path d="M76 9V6m0 34v-3M62 23h-3m34 0h-3M66 13l-2-2m22 24-2-2" stroke="#ffdf89" stroke-width="3"/>`,
    };
    if (!shapes[name]) {
      const inner = baseIcon(name).replace(
        "<svg ",
        '<svg x="22" y="22" width="56" height="56" ',
      );
      return `<svg class="nature-symbol tool-symbol" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" fill="#315e40" stroke="#cfaa62" stroke-width="4"/><g color="#ffebba">${inner}</g><path d="M73 78q13-2 13-14-14 0-13 14Z" fill="#9dbd5b" stroke="#456d37" stroke-width="1.5"/></svg>`;
    }
    return `<svg class="nature-symbol" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="${id}-green" x2=".6" y2="1"><stop stop-color="#c8e27a"/><stop offset=".5" stop-color="#79ae45"/><stop offset="1" stop-color="#39783c"/></linearGradient><linearGradient id="${id}-blue" x2=".6" y2="1"><stop stop-color="#8fe5ee"/><stop offset=".55" stop-color="#3bafd1"/><stop offset="1" stop-color="#247cb1"/></linearGradient><linearGradient id="${id}-hot" x2=".5" y2="1"><stop stop-color="#ffd866"/><stop offset=".5" stop-color="#f59b35"/><stop offset="1" stop-color="#d75d35"/></linearGradient><linearGradient id="${id}-gold" x2=".5" y2="1"><stop stop-color="#f7dda1"/><stop offset="1" stop-color="#c39153"/></linearGradient></defs><ellipse cx="50" cy="86" rx="31" ry="5" fill="#173d3020"/>${shapes[name]}</svg>`;
  }
  const names = [
    "water",
    "fire",
    "paw",
    "hand",
    "leaf",
    "trash",
    "fish",
    "turtle",
    "seeds",
    "plant",
    "watering",
    "recycle",
    "sun",
    "bag",
    "gear",
    "net",
    "lock",
    "shield",
    "rope",
    "key",
    "shovel",
    "jump",
    "heart",
    "bike",
    "bus",
    "hose",
    "mangueira",
    "kit",
    "flora",
    "pa",
    "sementes",
    "mudas",
    "regador",
    "jardim",
    "protecao",
    "chave",
    "luvas",
    "saco",
    "solar",
    "reciclagem",
    "veterinario",
  ];
  async function load() {
    if (!loading)
      loading = Promise.all(
        names.map(async (name) => {
          const im = new Image();
          im.src =
            "data:image/svg+xml;charset=utf-8," +
            encodeURIComponent(
              markup(name).replace(
                "<svg ",
                '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" ',
              ),
            );
          await im.decode();
          bank.set(name, im);
        }),
      ).then(() => bank);
    return loading;
  }
  function paint(ctx, _, name, x, y, size) {
    const im = bank.get(name) || bank.get("leaf");
    if (im) ctx.drawImage(im, x - size / 2, y - size / 2, size, size);
  }
  Raizes.icon = markup;
  window.GuardiaoIcones = {
    markup,
    prepare(parent = document) {
      parent
        .querySelectorAll("[data-icon]")
        .forEach((el) => (el.innerHTML = markup(el.dataset.icon)));
    },
    load,
    paint,
    draw: async (ctx, name, x, y, size) =>
      paint(ctx, await load(), name, x, y, size),
  };
  window.GuardiaoArtesInterface = { svg: markup, load };
  window.VivaSimbolos = { markup, load };
  if (window.GuardiaoColecao) {
    const c = GuardiaoColecao;
    window.GuardiaoColecao = {
      ...c,
      item: (name) => (name === "mudas" ? c.plant("ipê") : markup(name)),
    };
  }
})();
