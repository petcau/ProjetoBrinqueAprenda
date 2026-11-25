"use strict";
(() => {
  const base = new URL("./", document.currentScript.src),
    atlas = RemodelacaoAtlas,
    bank = new Map(),
    pending = new Map();
  const aliases = {
    hand: "cuidar",
    leaf: "cuidar",
    plant: "cuidar",
    seeds: "cuidar",
    mudas: "cuidar",
    sementes: "cuidar",
    seedling: "cuidar",
    water: "agua",
    watering: "agua",
    regador: "agua",
    paw: "pata",
    veterinario: "pata",
    kit: "pata",
    fire: "fogo",
    trash: "coletar",
    recycle: "coletar",
    reciclagem: "coletar",
    sun: "solar",
    solar: "solar",
    bag: "mochila",
    saco: "mochila",
    pause: "pausa",
    full: "tela-cheia",
    exit: "tela-cheia",
    book: "livro",
    info: "livro",
    gear: "configuracoes",
    close: "fechar",
    floresta: "fogo",
    rio: "agua",
    fauna: "pata",
    reflorestamento: "cuidar",
    cidade: "solar",
  };
  const bins = {
    plastic: "plastico",
    paper: "papel",
    glass: "vidro",
    metal: "metal",
  };
  const iconName = (raw) => aliases[raw] || raw;
  const has = (raw) => !!atlas["botoes/" + iconName(raw)];
  const url = (key) => new URL(atlas[key].file, base).href;
  function load(key) {
    if (!pending.has(key))
      pending.set(
        key,
        (async () => {
          const im = new Image();
          im.decoding = "async";
          im.src = url(key);
          await im.decode();
          bank.set(key, im);
          return im;
        })(),
      );
    return pending.get(key);
  }
  function icon(raw, cls = "") {
    return `<img class="remodel-icon ${iconName(raw) === "tela-cheia" ? "brisa-full" : ""} ${cls}" src="${url("botoes/" + iconName(raw))}" width="320" height="320" alt="" aria-hidden="true" decoding="async">`;
  }
  function bin(kind) {
    return `<img class="remodel-bin" src="${url("lixeiras/" + bins[kind])}" width="320" height="400" alt="" aria-hidden="true">`;
  }
  function draw(c, key, x, y, h, { angle = 0, alpha = 1 } = {}) {
    const im = bank.get(key),
      d = atlas[key];
    if (!im || !d) return false;
    const [w, hh] = d.size,
      k = h / hh,
      p = d.pivot || [0.5, 1];
    c.save();
    c.globalAlpha *= alpha;
    c.translate(x, y);
    c.rotate(angle);
    c.drawImage(im, -w * p[0] * k, -hh * p[1] * k, w * k, hh * k);
    c.restore();
    return true;
  }
  function material(t) {
    const name = (t.name || "").toLocaleLowerCase("pt-BR");
    if (t.type === "key") return "chave";
    if (/papelão|papelao/.test(name)) return "papelao";
    if (/vidro/.test(name) || t.material === "glass") return "garrafa-vidro";
    if (/casca/.test(name)) return "casca-banana";
    if (/lata|latinha/.test(name) || t.material === "metal") return "latinha";
    if (/papel/.test(name) || t.material === "paper") return "papel-limpo";
    if (/garrafa|plást|plast/.test(name) || t.material === "plastic")
      return "garrafa-plastica";
    return null;
  }
  function frame(name, bx, by, cls = "") {
    const key = "molduras/" + name,
      [w, h] = atlas[key].size,
      ws = [bx, w - 2 * bx, bx],
      hs = [by, h - 2 * by, by];
    return `<span class="remodel-frame ${cls}" aria-hidden="true">${hs.map((hh, r) => ws.map((ww, c) => (ww && hh ? `<svg style="grid-area:${r + 1}/${c + 1}" viewBox="${c === 0 ? 0 : c === 1 ? bx : w - bx} ${r === 0 ? 0 : r === 1 ? by : h - by} ${ww} ${hh}" preserveAspectRatio="none"><image href="${url(key)}" width="${w}" height="${h}"/></svg>` : "")).join("")).join("")}</span>`;
  }
  async function phase(id) {
    const keys = Object.keys(atlas).filter((k) => k.startsWith("botoes/"));
    if (id === 2)
      keys.push(
        ...["garrafa-plastica", "papel-limpo", "latinha", "casca-banana"].map(
          (n) => "materiais/" + n,
        ),
      );
    if (id === 3) keys.push("materiais/chave");
    if (id === 5)
      keys.push(
        ...Object.values(bins).map((n) => "lixeiras/" + n),
        "lixeiras/placa-estacao",
        ...[
          "garrafa-plastica",
          "papel-limpo",
          "latinha",
          "garrafa-vidro",
          "papelao",
          "painel-solar",
        ].map((n) => "materiais/" + n),
      );
    keys.push(...Object.keys(atlas).filter((k) => k.startsWith("molduras/")));
    await Promise.all([...new Set(keys)].map(load));
    return bank;
  }
  const I = window.GuardiaoIcones,
    priorMarkup = I.markup,
    priorLoad = I.load,
    priorPaint = I.paint;
  const markup = (raw) => (has(raw) ? icon(raw) : priorMarkup(raw));
  I.markup = markup;
  I.load = async () => {
    await Promise.all([
      priorLoad(),
      ...Object.keys(atlas)
        .filter((k) => k.startsWith("botoes/"))
        .map(load),
    ]);
    return bank;
  };
  I.paint = (c, old, raw, x, y, h) =>
    has(raw)
      ? draw(c, "botoes/" + iconName(raw), x, y, h)
      : priorPaint(c, old, raw, x, y, h);
  I.prepare = (parent = document) =>
    parent
      .querySelectorAll("[data-icon]")
      .forEach((el) => (el.innerHTML = markup(el.dataset.icon)));
  const oldIcon = Raizes.icon;
  Raizes.icon = (raw) => (has(raw) ? icon(raw) : oldIcon(raw));
  VivaSimbolos.markup = markup;
  VivaSimbolos.load = I.load;
  if (window.GuardiaoArtesInterface) {
    GuardiaoArtesInterface.svg = markup;
    GuardiaoArtesInterface.load = I.load;
  }
  const C = GuardiaoColecao;
  window.GuardiaoColecao = {
    ...C,
    bin: (kind) => (bins[kind] ? bin(kind) : C.bin(kind)),
  };
  window.GuardiaoHUD = {
    ...window.GuardiaoHUD,
    fullIcon: (active) =>
      `<span class="remodel-full">${icon("full")}${active ? '<span class="remodel-exit" aria-hidden="true">↙</span>' : ""}</span>`,
  };
  if (window.GuardiaoAdventureArt) {
    const Previous = GuardiaoAdventureArt;
    window.GuardiaoAdventureArt = class extends Previous {
      residual(c, t) {
        const name = material(t);
        if (["trash", "recycle"].includes(t.type) && name)
          return draw(c, "materiais/" + name, t.x, t.y, 29);
        return super.residual(c, t);
      }
      riverTrash(c, sprites, target, p, progress) {
        const name = target && material(target);
        if (!name) return super.riverTrash(c, sprites, target, p, progress);
        if (progress < 0.18 || progress > 0.82) return;
        const scale = p.swimming ? 0.78 : 1,
          flip = p.direction >= 3 && p.direction <= 5 ? -1 : 1,
          smooth = (value) => {
            const v = Math.max(0, Math.min(1, value));
            return v * v * (3 - 2 * v);
          },
          hand = { x: p.x + 18 * flip * scale, y: p.y - 7 * scale },
          bag = { x: p.x - 8 * flip * scale, y: p.y + 18 * scale },
          first = progress < 0.4,
          leg = first
            ? smooth((progress - 0.18) / 0.22)
            : smooth((progress - 0.4) / 0.36),
          a = first ? target : hand,
          b = first ? hand : bag;
        return draw(
          c,
          "materiais/" + name,
          a.x + (b.x - a.x) * leg,
          a.y + (b.y - a.y) * leg,
          21 * scale,
          { alpha: 1 - smooth((progress - 0.72) / 0.1) },
        );
      }
      binActors(c) {
        if (this.phase !== 5) return super.binActors(c);
        const station = GuardiaoFasesJogaveis[5].station,
          sign = { x: station.x, y: station.y + 70 };
        return GuardiaoCidadeBins.map((s) => ({
          y: s.y,
          draw: () => {
            draw(c, "lixeiras/" + bins[s.kind], s.x, s.y, 66);
            c.save();
            c.font = "bold 10px system-ui";
            c.textAlign = "center";
            c.strokeStyle = "#183c29";
            c.lineWidth = 3;
            c.fillStyle = "#fff2cc";
            c.strokeText(s.label, s.x, s.y + 12);
            c.fillText(s.label, s.x, s.y + 12);
            c.restore();
          },
        })).concat([
          {
            y: sign.y,
            draw: () => draw(c, "lixeiras/placa-estacao", sign.x, sign.y, 47),
          },
        ]);
      }
    };
  }
  window.GuardiaoRemodelacao = {
    atlas,
    bank,
    url,
    load,
    phase,
    icon,
    has,
    markup,
    draw,
    material,
    frame,
    solar(c, t, done, progress) {
      return draw(c, "materiais/painel-solar", t.x, t.y, 55, {
        angle: done ? 0 : -0.12 * (1 - progress),
      });
    },
    state: () => ({ loaded: [...bank.keys()] }),
  };
})();
