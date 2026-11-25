"use strict";
(() => {
  const base = new URL("./", document.currentScript.src),
    atlas = MochilaIlustradaAtlas;
  let serial = 0;
  const url = (name) => new URL(atlas[name].file, base).href;
  function art(
    name,
    rect = atlas[name].bounds,
    cls = "",
    fit = "xMidYMid meet",
  ) {
    const [w, h] = atlas[name].size;
    return `<svg class="kit-art ${cls}" viewBox="${rect.join(" ")}" preserveAspectRatio="${fit}" overflow="hidden" aria-hidden="true"><image href="${url(name)}" width="${w}" height="${h}"/></svg>`;
  }
  // Nine pieces keep the painted corners and edge thickness intact at each size.
  function frame(name, rect, bx, by, cls = "", center = true) {
    const [x, y, w, h] = rect,
      widths = [bx, w - bx * 2, bx],
      heights = [by, h - by * 2, by];
    return `<span class="kit-frame ${cls}" aria-hidden="true">${heights
      .map((hh, row) =>
        widths
          .map((ww, col) => {
            if (!center && row === 1 && col === 1) return "";
            const xx = x + (col === 0 ? 0 : col === 1 ? bx : w - bx),
              yy = y + (row === 0 ? 0 : row === 1 ? by : h - by);
            return `<span style="grid-area:${row + 1}/${col + 1}">${art(name, [xx, yy, ww, hh], "", "none")}</span>`;
          })
          .join(""),
      )
      .join("")}</span>`;
  }
  const card = () =>
      frame("painel-trajes", [47, 303, 302, 628], 60, 60, "kit-card-frame"),
    check = () =>
      art("painel-trajes", [1470, 320, 56, 56], "kit-check kit-round-icon"),
    tabArt = (selected) =>
      frame(
        "painel-colar",
        selected ? [548, 168, 490, 84] : [54, 168, 492, 84],
        70,
        30,
        selected ? "kit-tab-on" : "kit-tab-off",
      );
  function shell() {
    return `${frame("painel-colar", [0, 0, 1585, 992], 24, 24, "kit-window-frame", false)}
      <header class="kit-pack-heading">
        ${art("painel-colar", [200, 23, 1195, 125], "kit-heading-art", "xMidYMid slice")}
        ${art("painel-colar", [76, 31, 118, 118], "kit-pack-emblem kit-round-icon")}
        <div class="kit-heading-copy"><p class="eyebrow">CUIDADOS QUE VIAJAM COM VOCÊ</p><h2 id="pack-title">Mochila de Kai</h2></div>
        <button type="button" data-pack-close class="icon-button kit-close" aria-label="Fechar mochila">${art("painel-colar", [1417, 36, 98, 98], "kit-round-icon")}</button>
      </header>
      <div class="ra-tabs kit-tabs" role="tablist" aria-label="Dentro da mochila">
        ${[
          ["items", "Ferramentas"],
          ["crystals", "Colar"],
          ["uniforms", "Trajes"],
        ]
          .map(
            ([id, label]) =>
              `<button type="button" role="tab" data-pack-tab="${id}" aria-controls="pack-content" aria-selected="false">${tabArt(false)}${tabArt(true)}<span>${label}</span></button>`,
          )
          .join("")}
      </div>
      <section id="pack-content" tabindex="0" role="tabpanel" aria-label="Coleção de Kai"></section><p id="pack-status" role="status"></p>`;
  }
  const sockets = [
    "M385 730C429 774 455 829 435 879C418 921 368 950 344 979C320 935 286 906 285 866C280 816 331 772 385 730Z",
    "M292 974C350 1001 405 1014 417 1066C432 1117 378 1171 353 1195C314 1177 280 1144 273 1107C259 1061 282 1019 292 974Z",
    "M514 1099C503 1155 471 1188 444 1218C420 1256 469 1308 517 1348C565 1301 616 1266 607 1220C591 1175 544 1137 514 1099Z",
    "M743 974C732 1027 658 1007 612 1052C578 1102 629 1158 676 1195C720 1169 749 1143 754 1106C765 1059 748 1019 743 974Z",
    "M641 730C637 775 593 801 596 850C588 901 639 944 687 979C704 932 744 902 735 847C727 802 678 767 641 730Z",
  ];
  function necklace(earned) {
    const id = "mochila-pedras-" + ++serial;
    return `<svg class="kit-necklace-art" viewBox="0 0 1024 1536" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Colar com ${earned.length} de 5 cristais">
      <defs><filter id="${id}-dim" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope=".35" intercept=".18"/><feFuncG type="linear" slope=".38" intercept=".22"/><feFuncB type="linear" slope=".28" intercept=".12"/></feComponentTransfer></filter>
      ${sockets.map((d, i) => `<clipPath id="${id}-${i}"><path d="${d}"/></clipPath>`).join("")}</defs>
      <image href="${url("colar")}" width="1024" height="1536"/>
      ${sockets.map((_, i) => (earned.includes(i + 1) ? "" : `<g data-kit-empty-gem="${i + 1}" clip-path="url(#${id}-${i})"><image href="${url("colar")}" width="1024" height="1536" filter="url(#${id}-dim)"/></g>`)).join("")}
    </svg>`;
  }
  function crystals(memory) {
    const earned = memory.obtained();
    return `<div class="kit-crystals"><figure class="kit-necklace">
        ${art("painel-colar", [40, 262, 425, 645], "kit-necklace-panel", "none")}
        ${necklace(earned)}<figcaption>${earned.length} de 5 cristais</figcaption>
      </figure><div class="kit-crystal-grid">${memory.crystals
        .map((c) => {
          const known = earned.includes(c.id);
          return `<article class="kit-card kit-crystal ${known ? "is-known" : "is-undiscovered"}" data-crystal="${c.id}">
          ${card()}${known ? check() : ""}<div class="kit-gem-picture">${art("cristal-" + c.id)}</div>
          <h3>Cristal ${c.id === 1 ? "do" : "da"} ${c.name}</h3><p>${known ? c.description : "Conclua a fase " + c.id + " para descobrir este cuidado."}</p>
        </article>`;
        })
        .join("")}</div></div>`;
  }
  function uniforms(memory) {
    const active = memory.read().uniform;
    return `<div class="kit-uniforms"><p class="collection-hint">Os trajes são preparados com o aliado de cada missão.</p><div class="kit-outfit-grid">${memory.uniforms
      .map((u, i) => {
        const known = memory.hasUniform(u.id),
          worn = known && active === u.id;
        return `<article class="kit-card kit-uniform ${known ? "is-known" : "is-undiscovered"} ${worn ? "is-worn" : ""}" data-uniform="${u.id}" aria-label="${u.name}${known ? "" : ", disponível na fase " + (u.phase || 1)}">
        ${card()}${worn ? check() : ""}<div class="kit-outfit-picture">${art("traje-" + (i + 1), undefined, "kit-outfit")}</div>
        <h3>${u.name}</h3><p>${known ? "Traje da fase " + (u.phase || 1) + "." : "Disponível na fase " + u.phase + "."}</p>
        <div class="kit-worn-place">${worn ? `<span class="worn-label">${frame("painel-trajes", [1276, 862, 229, 49], 26, 19, "kit-worn-art")}<span>Vestindo agora</span></span>` : ""}</div>
      </article>`;
      })
      .join("")}</div></div>`;
  }
  window.MochilaIlustrada = Object.freeze({
    art,
    frame,
    shell,
    content: (tab, memory) =>
      tab === "items"
        ? (window.CincoMissoes?.tools(memory) ?? null)
        : tab === "uniforms"
          ? uniforms(memory)
          : crystals(memory),
  });
})();
