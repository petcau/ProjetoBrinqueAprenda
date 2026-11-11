"use strict";
(() => {
  const root = new URL("../../", document.currentScript.src);
  let serial = 0;
  function frame(body, color = "#9bbd70") {
    const id = "collection-" + serial++;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 110" aria-hidden="true"><defs><linearGradient id="${id}-metal" x2=".8" y2="1"><stop stop-color="#fff2bd"/><stop offset=".5" stop-color="#d8ad57"/><stop offset="1" stop-color="#8d602f"/></linearGradient><linearGradient id="${id}-color" x2="1" y2="1"><stop stop-color="#fff8d8"/><stop offset=".3" stop-color="${color}"/><stop offset="1" stop-color="#274a41"/></linearGradient><radialGradient id="${id}-halo"><stop stop-color="#fff9cf"/><stop offset="1" stop-color="#d2d9a3" stop-opacity="0"/></radialGradient></defs><circle cx="50" cy="53" r="48" fill="url(#${id}-halo)"/><ellipse cx="50" cy="97" rx="32" ry="5" fill="#284631" opacity=".16"/><g stroke="#466046" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round">${body.replaceAll("@metal", `url(#${id}-metal)`).replaceAll("@color", `url(#${id}-color)`)}</g></svg>`;
  }
  const bag = `<path d="M22 36Q21 27 31 27H70Q79 29 78 41L75 86Q73 93 62 93H35Q24 91 24 83Z" fill="@color"/><path d="M34 28V18Q50 5 66 18V28" fill="none" stroke="#d8b872" stroke-width="6"/><path d="M24 51H77M31 71H68V87H31Z" fill="#e7cd8a"/><path d="M45 35H56V60H45Z" fill="@metal"/><circle cx="50" cy="49" r="2" fill="#fff2c6"/>`;
  const shapes = {
    mangueira: `<path d="M19 81C-4 40 40 22 64 44S65 103 38 83S28 52 44 53S69 67 51 75" fill="none" stroke="#405b35" stroke-width="13"/><path d="M19 79C-2 41 40 25 62 45" fill="none" stroke="#9daf6e" stroke-width="4"/><path d="M63 47L78 26L91 32L78 56Z" fill="@metal"/><path d="M76 29L86 15L97 22L90 36Z" fill="#72b2b7"/><path d="M65 48L61 61L69 66L77 54" fill="#376976"/><path d="M89 13L94 7M96 18L100 15" stroke="#63d6ee" stroke-width="3"/>`,
    luvas: `<path d="M19 90L11 55Q8 45 17 46L26 57L20 29Q21 21 27 24L34 47L32 19Q36 11 40 19L42 44L46 23Q51 17 54 26L50 57Q54 65 50 78L43 91Z" fill="@color"/><path d="M55 90L51 67L61 56L65 37Q70 29 74 37L75 50L81 30Q86 25 89 32L86 54L94 47Q102 48 95 61L91 87Z" fill="@color"/><path d="M18 85L44 83V96H20ZM54 85L91 84V95H56Z" fill="@metal"/>`,
    kit: `${bag}<path d="M44 62H57V69H64V82H57V89H44V82H37V69H44Z" fill="#f0efcc"/>`,
    rede: `<path d="M16 97L48 54" stroke="#835b35" stroke-width="8"/><path d="M17 94L47 55" stroke="#d9b87a" stroke-width="3"/><ellipse cx="61" cy="38" rx="30" ry="22" transform="rotate(-35 61 38)" fill="#91d2d1" fill-opacity=".45" stroke="#4e8c8c" stroke-width="5"/><path d="M39 26L68 61M48 18L78 53M59 13L86 44M33 35L76 15M37 49L87 27M48 60L89 40" stroke="#649a98" stroke-width="1.4"/>`,
    saco: bag,
    protecao: `<path d="M34 38L18 49L9 70L23 79L32 60V97H46V71H58V97H72V60L81 79L94 71L83 47L67 38Z" fill="@color"/><path d="M32 20Q50 2 69 20L67 43H34Z" fill="#c7eaf0"/><path d="M37 20Q51 13 64 21V34H37Z" fill="#e6f5e8"/><path d="M34 41H68M32 63H73" stroke="#efd16d" stroke-width="6"/><path d="M49 46V65" stroke="#fff0b8" stroke-width="3"/>`,
    corda: `<path d="M32 87C-7 61 11 15 49 14S98 58 70 74S20 64 30 39S80 30 70 48S45 67 43 45M32 86L41 101" fill="none" stroke="#916b38" stroke-width="10"/><path d="M32 86C-7 60 12 17 49 17S95 58 70 71S24 63 33 40S77 32 68 48S47 61 46 45" fill="none" stroke="#e5c47d" stroke-width="4"/>`,
    chave: `<circle cx="34" cy="30" r="19" fill="@metal"/><circle cx="34" cy="29" r="9" fill="#e9e7ba"/><path d="M42 44L79 91L91 82L84 73L77 78L71 70L78 65L71 57L64 63L50 42Z" fill="@metal"/><path d="M29 14L23 18" stroke="#fff2b0" stroke-width="3"/>`,
    pa: `<path d="M35 10H64V30Q48 43 35 30ZM49 35V72" fill="none" stroke="#c09458" stroke-width="6"/><path d="M29 66H70V86L50 104L29 86Z" fill="@color"/><path d="M50 70V97" stroke="#d7e4ce" stroke-width="3"/>`,
    sementes: `<path d="M16 43H79L72 98H23Z" fill="#c19c64"/><path d="M15 40H81V51H15Z" fill="@metal"/><path d="M50 84V62M50 72Q28 72 32 57Q50 57 50 72M50 69Q71 65 69 52Q49 51 50 69" fill="#81b45b"/><path d="M26 44L30 40M38 44L42 40M52 44L56 40M65 44L69 40" stroke="#8a7444"/><ellipse cx="19" cy="92" rx="6" ry="4" fill="#e5ca8e" transform="rotate(30 19 92)"/>`,
    regador: `<path d="M21 43H66L64 88Q42 101 22 88Z" fill="@color"/><path d="M23 46Q-4 35 9 17Q32 3 38 42" fill="none" stroke="#72a6a0" stroke-width="7"/><path d="M65 64L85 39L94 48L67 88Z" fill="@color"/><path d="M81 37L96 48" stroke="#d8dcb1" stroke-width="6"/><path d="M84 55L87 62M92 58L96 65M80 61L81 67" stroke="#5bc6e0" stroke-width="3"/><path d="M29 57V81" stroke="#c3ded0" stroke-width="3"/>`,
    solar: `<path d="M47 68V99M25 99H72" stroke="#96724b" stroke-width="5"/><path d="M18 25H85L76 75H9Z" fill="#477d9a" stroke="#becdb1" stroke-width="4"/><path d="M35 27L26 72M52 26L43 74M68 26L59 75M14 41H81M12 57H78" stroke="#a7d6df" stroke-width="1.4"/><path d="M66 13L71 4M79 18L90 12M83 28L97 27" stroke="#e8be60" stroke-width="3"/>`,
  };
  shapes.veterinario = shapes.kit;
  shapes.mudas = shapes.sementes;
  shapes.jardim = shapes.pa;
  shapes.reciclagem = shapes.saco;
  function item(id) {
    return frame(shapes[id] || bag, id === "solar" ? "#7499b6" : "#88b086");
  }
  function plant(name) {
    const flowers =
      name === "ipê" ? "#e9b9e9" : name === "ingá" ? "#d7eb9d" : "#da8469";
    const leaves =
      name === "ingá"
        ? `<path d="M50 42Q23 30 16 42Q31 54 50 42M50 36Q75 20 88 30Q76 45 50 42M50 62Q25 53 20 65Q38 73 50 62" fill="#84af60"/>`
        : `<path d="M50 61Q13 67 16 42Q18 18 46 22Q56 8 76 26Q97 32 85 53Q77 65 50 61" fill="#72a66a"/>`;
    const buds = [name === "ipê" ? 25 : 67, 38, 77]
      .map(
        (x, i) =>
          `<circle cx="${x}" cy="${27 + i * 11}" r="8" fill="${flowers}"/><circle cx="${x + 2}" cy="${25 + i * 11}" r="3" fill="#fff4c6"/>`,
      )
      .join("");
    return frame(
      `<path d="M48 92L49 29M49 64L31 46M49 53L72 33" stroke="#8c7243" stroke-width="6"/>${leaves}${buds}<path d="M34 85H67L62 102H39Z" fill="#bb8e5f"/>`,
      "#9bb86e",
    );
  }
  const bins = {
    recyclable: ["#559eae", "↻"],
    organic: ["#b48251", ""],
    residual: ["#89929a", ""],
  };
  function bin(kind) {
    const [color] = bins[kind];
    const symbol =
      kind === "organic"
        ? `<path d="M51 74V50Q36 41 31 51Q35 64 51 59Q65 43 73 53Q67 68 51 64" fill="#eadf9b"/>`
        : kind === "residual"
          ? `<path d="M37 49L64 74M64 49L37 74" stroke="#f0ead2" stroke-width="6"/>`
          : `<path d="M45 46L58 46L63 57L68 53L68 68L54 65L59 61L53 52L45 55M66 73L59 82L42 80L41 86L31 73L45 67L43 74L57 75M30 72L25 59L33 49L29 46L43 44L41 59L37 56L32 63L36 69" fill="#f3e7ac"/>`;
    return frame(
      `<path d="M23 30H78L73 95H28Z" fill="@color"/><path d="M18 23H83V36H18ZM34 17H66V24H34Z" fill="${color}"/><path d="M30 40L33 89M70 40L67 89" stroke="#fff4c6" opacity=".35" stroke-width="3"/>${symbol}`,
      color,
    );
  }
  function gem(index, earned) {
    const colors = ["#f47739", "#56caf0", "#edbe55", "#7fca73", "#b394ed"];
    const outlines = [
      "M50 5C52 27 89 31 81 65Q78 93 50 101Q14 89 18 59Q20 37 36 24Q31 47 46 48Q59 37 50 5Z",
      "M50 5Q34 27 22 51Q7 79 50 103Q94 79 78 51Z",
      "M50 5L85 30L83 77L50 103L17 77L15 30Z",
      "M50 7Q94 9 87 52Q80 91 26 102Q8 64 19 36Q26 18 50 7Z",
      "M50 5L87 29V78L50 103L13 78V29Z",
    ];
    const symbols = [
      shapes.mangueira.includes("never")
        ? ""
        : `<path d="M51 40Q72 60 52 81Q32 72 40 57Q43 68 49 63Q55 52 51 40" fill="#ffeaa4"/>`,
      `<path d="M50 39Q30 65 50 78Q71 63 50 39Z" fill="#d4f7fa"/>`,
      `<ellipse cx="50" cy="70" rx="13" ry="10" fill="#fff1bc"/><circle cx="33" cy="54" r="6" fill="#fff1bc"/><circle cx="46" cy="46" r="6" fill="#fff1bc"/><circle cx="61" cy="48" r="6" fill="#fff1bc"/><circle cx="70" cy="59" r="5" fill="#fff1bc"/>`,
      `<path d="M33 77Q27 43 65 37Q75 66 33 77ZM36 73L60 46" fill="#e2f5b3" stroke="#80a45d"/>`,
      `<path d="M29 77V58H42V77M44 77V42H56V77M60 77V51H73V77" fill="#f6e8b0"/>`,
    ];
    return frame(
      `<path d="${outlines[index]}" fill="@color" stroke="#b28c47" stroke-width="3"/><path d="M50 13L34 40L50 91L68 41Z" fill="#fff" opacity=".18"/><path d="M24 36L35 40L20 70M35 40L68 41L82 34M68 41L83 72" fill="none" stroke="#fff6d2" opacity=".45" stroke-width="1.5"/>${earned ? symbols[index] : `<path d="M41 58V48Q50 37 59 48V58M37 58H63V79H37Z" fill="#46594c" stroke="#e1d3a4" stroke-width="3"/>`}<path d="M30 27L35 22" stroke="#fff8d5" stroke-width="3"/>`,
      earned ? colors[index] : "#829180",
    );
  }
  const uniforms = {
    protecao: {
      file: "jogo/novo-amanha/assets/amanha-traje-andar.webp",
      width: 864,
      height: 1312,
      bounds: [20, 1007, 177, 293],
    },
    resgate: {
      file: "jogo/novo-amanha/assets/amanha-uniforme-resgate.webp",
      width: 1008,
      height: 1376,
      bounds: [40, 1061, 172, 303],
    },
    plantio: {
      file: "jogo/novo-amanha/assets/amanha-uniforme-plantio.webp",
      width: 848,
      height: 1360,
      bounds: [18, 1035, 177, 313],
    },
    voluntario: {
      file: "jogo/novo-amanha/assets/amanha-uniforme-voluntario.webp",
      width: 880,
      height: 1312,
      bounds: [21, 1009, 178, 291],
    },
  };
  uniforms.explorador = {
    file: "jogo/sprites-integros/assets/vida-kai-andando.webp",
    width: 2240,
    height: 1280,
    bounds: [1144, 357, 231, 271],
  };
  function uniform(id) {
    const d = uniforms[id];
    if (!d) return item("luvas");
    return `<svg class="pack-outfit" viewBox="${d.bounds.join(" ")}" aria-hidden="true"><image href="${new URL(d.file, root).href}" width="${d.width}" height="${d.height}"/></svg>`;
  }
  window.GuardiaoColecao = Object.freeze({
    item,
    plant,
    bin,
    gem,
    uniform,
    root,
  });
})();
