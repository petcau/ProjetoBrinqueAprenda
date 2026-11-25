"use strict";
(() => {
  const base = new URL("./", document.currentScript.src),
    atlas = ConquistaAtlas;
  const phase = location.pathname.includes("floresta-viva")
    ? 1
    : Number(new URLSearchParams(location.search).get("fase") || 2);
  const url = (name) => new URL(atlas[name].file, base).href;
  function art(
    name,
    rect = atlas[name].bounds,
    cls = "",
    fit = "xMidYMid meet",
  ) {
    const [w, h] = atlas[name].size;
    return `<svg class="conquista-art ${cls}" viewBox="${rect.join(" ")}" preserveAspectRatio="${fit}" aria-hidden="true" overflow="hidden"><image href="${url(name)}" width="${w}" height="${h}"/></svg>`;
  }
  function frame(name, rect, bx, by, cls = "", center = true) {
    const [x, y, w, h] = rect,
      widths = [bx, w - 2 * bx, bx],
      heights = [by, h - 2 * by, by];
    return `<span class="conquista-frame ${cls}" aria-hidden="true">${heights.map((hh, r) => widths.map((ww, c) => (!center && r === 1 && c === 1 ? "" : `<span style="grid-area:${r + 1}/${c + 1}">${art(name, [x + (c === 0 ? 0 : c === 1 ? bx : w - bx), y + (r === 0 ? 0 : r === 1 ? by : h - by), ww, hh], "", "none")}</span>`)).join("")).join("")}</span>`;
  }
  function ring() {
    return `<span class="hud-ring" aria-hidden="true">${art("hud", [300, 350, 300, 300], "hud-ring-fill", "none")}${art("botao-tela-cheia", undefined, "hud-ring-border")}</span>`;
  }
  function fullIcon(active) {
    return `<span class="hud-control-art brisa-full">${art("botao-tela-cheia")}${active ? `<span class="hud-exit">${art("hud", [300, 350, 300, 300], "hud-exit-fill", "none")}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3v5H3m13-5v5h5M3 16h5v5m13-5h-5v5" fill="none" stroke="#ffd35c" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>` : ""}</span>`;
  }
  window.GuardiaoHUD = { fullIcon };
  const sprites = {},
    needed = [
      "kai",
      "flora",
      phase === 1 ? "carlos" : "antonio",
      "cenario-" + phase,
    ];
  let loading;
  function loadFriends() {
    if (phase > 2) return Promise.resolve();
    return (loading ||= Promise.all(
      needed.map(async (name) => {
        const im = new Image();
        im.src = url(name);
        await im.decode();
        sprites[name] = im;
      }),
    ));
  }
  function actor(c, name, x, y, height) {
    const [sx, sy, sw, sh] = atlas[name].bounds,
      k = height / sh;
    c.drawImage(
      sprites[name],
      sx,
      sy,
      sw,
      sh,
      x - (sw * k) / 2,
      y - sh * k,
      sw * k,
      sh * k,
    );
  }
  function installPainter() {
    const old = RioClaroResumo.paint;
    RioClaroResumo.paint = (c, w, h, time, reduced = false) => {
      if (phase > 2 || needed.some((n) => !sprites[n])) {
        old(c, w, h, time, reduced);
        return;
      }
      c.save();
      c.clearRect(0, 0, w, h);
      const bg = sprites["cenario-" + phase],
        k = Math.max(w / bg.width, h / bg.height);
      c.drawImage(
        bg,
        (w - bg.width * k) / 2,
        (h - bg.height * k) / 2,
        bg.width * k,
        bg.height * k,
      );
      const bob = reduced ? 0 : Math.sin(time * 2.5) * h * 0.005;
      actor(c, "kai", w * 0.27, h * 0.95 + bob, h * 0.75);
      actor(
        c,
        phase === 1 ? "carlos" : "antonio",
        w * 0.76,
        h * 0.95,
        h * 0.84,
      );
      actor(c, "flora", w * 0.51, h * 0.35 + bob, h * 0.29);
      c.restore();
    };
  }
  function necklace(earned) {
    const panel = document.getElementById("vitoria");
    if (!panel?.open && !panel?.classList.contains("reward-preview"))
      return null;
    const n = earned.length;
    return (n === 1 || n === 2) && earned.every((id, i) => id === i + 1)
      ? art("colar-" + n, undefined, "conquista-colar-art")
      : GuardiaoRelicario.necklace(earned, "summary");
  }
  window.ConquistaViva = { necklace, ready: loadFriends };
  function decorateStats(panel) {
    const stats = panel.querySelector(".completion-stats,#victory-stats");
    stats.dataset.statCount = String(stats.children.length);
    [...stats.children].forEach((card, i) => {
      if (card.querySelector(".conquista-stat-icon")) return;
      const text = [...card.childNodes]
        .filter((n) => n.nodeType === 3)
        .map((n) => {
          const t = n.textContent;
          n.remove();
          return t;
        })
        .join("")
        .trim();
      const label = document.createElement("span");
      label.className = "conquista-stat-label";
      label.textContent = text;
      const name =
        phase === 1
          ? ["fogo", "pata", null][i]
          : phase === 2
            ? ["lixo", "peixe"][i]
            : phase === 3
              ? ["chave", "pata"][i]
              : phase === 4
                ? "folha"
                : ["lixo", "sun", "folha"][i];
      card.insertAdjacentHTML(
        "afterbegin",
        window.GuardiaoRemodelacao
          ? GuardiaoRemodelacao.frame(
              "cartao-estatistica",
              170,
              80,
              "conquista-stat-frame remodel-stat-frame",
            )
          : frame(
              "painel",
              [62, 608, 480, 155],
              65,
              54,
              "conquista-stat-frame",
            ),
      );
      card.insertAdjacentHTML(
        "beforeend",
        `<span class="conquista-stat-icon" aria-hidden="true">${name ? (window.GuardiaoRemodelacao?.has({ lixo: "trash", pata: "paw", folha: "leaf", fogo: "fire", peixe: "paw" }[name] || name) ? GuardiaoRemodelacao.icon({ lixo: "trash", pata: "paw", folha: "leaf", fogo: "fire", peixe: "paw" }[name] || name) : art(name)) : GuardiaoRelicario.fragment(phase - 1, true)}</span>`,
      );
      card.append(label);
    });
  }
  function summary() {
    const panel = document.getElementById("vitoria");
    panel.classList.add("conquista-panel");
    panel.querySelector(".resumo-cabecalho p").textContent = "MISSÃO CONCLUÍDA";
    let decorated = false;
    function ensureArt() {
      if (decorated) return;
      decorated = true;
      panel.insertAdjacentHTML(
        "afterbegin",
        art("painel", [200, 260, 200, 200], "conquista-paper", "none") +
          frame(
            "painel",
            [0, 0, ...atlas.painel.size],
            26,
            26,
            "conquista-window",
            false,
          ),
      );
      panel
        .querySelector("header")
        .insertAdjacentHTML(
          "afterbegin",
          art(
            "painel",
            [28, 26, 1530, 110],
            "conquista-heading",
            "xMidYMid slice",
          ),
        );
      panel
        .querySelector(".resumo-proximo")
        .insertAdjacentHTML(
          "afterbegin",
          art("avancar", undefined, "conquista-next"),
        );
    }
    const refresh = () => {
      if (!panel.open && !panel.classList.contains("reward-preview")) return;
      ensureArt();
      decorateStats(panel);
      loadFriends().catch(() => {});
    };
    new MutationObserver(refresh).observe(panel, {
      attributes: true,
      attributeFilter: ["open", "class"],
    });
    new MutationObserver(() => {
      if (decorated) decorateStats(panel);
    }).observe(panel.querySelector(".completion-stats,#victory-stats"), {
      childList: true,
    });
    refresh();
    installPainter();
    // O texto da ação muda ao concluir; a arte acompanha sem recriar o link.
    const link = panel.querySelector(".resumo-proximo");
    new MutationObserver(() => {
      if (decorated && !link.querySelector(".conquista-next"))
        link.insertAdjacentHTML(
          "afterbegin",
          art("avancar", undefined, "conquista-next"),
        );
    }).observe(link, { childList: true });
  }
  function hud() {
    const panel = document.querySelector("#jogo .mission,#jogo .missions");
    panel.classList.add("hud-kit");
    panel.insertAdjacentHTML(
      "afterbegin",
      art("hud", [200, 350, 1000, 250], "hud-paper", "none") +
        frame("hud", [5, 10, 1574, 944], 70, 65, "hud-window", false),
    );
    panel
      .querySelector("h1")
      .insertAdjacentHTML(
        "afterbegin",
        frame("hud", [82, 74, 1433, 218], 160, 85, "hud-title-frame"),
      );
    const icons = {
      fire: "fogo",
      paw: "pata",
      water: "agua",
      leaf: "folha",
      key: "chave",
      trash: "lixo",
      net: "peixe",
    };
    const replaceGoals = () => {
      panel.querySelectorAll("[data-icon]").forEach((host) => {
        const name = icons[host.dataset.icon];
        if (name && !host.dataset.hudIcon) {
          host.dataset.hudIcon = name;
          host.innerHTML = window.GuardiaoRemodelacao?.has(host.dataset.icon)
            ? GuardiaoRemodelacao.icon(host.dataset.icon)
            : art(name, undefined, "hud-goal-icon");
        }
      });
    };
    replaceGoals();
    const goals = panel.querySelector("#goals");
    if (goals)
      new MutationObserver(replaceGoals).observe(goals, { childList: true });
    for (const [id, name] of [
      ["mochila", "mochila"],
      ["pausa", "pausa"],
      ["interagir", "cuidar"],
    ]) {
      const b = document.getElementById(id);
      b.classList.add("hud-button");
      b.innerHTML =
        `<span class="hud-control-art">${art("botao-" + name)}</span>` +
        (id === "interagir" ? "<small>CUIDAR</small>" : "");
    }
    const full = document.getElementById("app-fullscreen");
    full.classList.add("hud-button");
    full.innerHTML = fullIcon(GuardiaoTela.state().fullscreen);
    document.querySelector(".ra-pause-full")?.classList.add("hud-button");
    const tool = document.getElementById(
      phase === 1 ? "mangueira" : "ferramenta",
    );
    tool.classList.add("hud-tool");
    if (phase === 5) {
      document.getElementById("tool-icon").innerHTML =
        `<span class="hud-control-art">${art("botao-lixeira")}</span>`;
      tool.classList.add("hud-trash");
    } else tool.insertAdjacentHTML("afterbegin", ring());
    const meter = document.getElementById("reserva"),
      wrapper = document.createElement("span");
    wrapper.className = "hud-meter";
    wrapper.setAttribute("aria-hidden", "true");
    wrapper.innerHTML = `<span class="hud-meter-fill">${art(phase === 4 ? "preenchimento-verde" : "preenchimento-azul", [0, 0, 1774, 220])}</span>${art("trilho-vazio", [0, 0, 1774, 220], "hud-meter-track")}`;
    meter.insertAdjacentElement("afterend", wrapper);
    meter.classList.add("hud-native-meter");
    const update = () =>
      (wrapper.firstElementChild.style.clipPath = `inset(0 ${100 - Math.max(0, Math.min(100, meter.value))}% 0 0)`);
    new MutationObserver(update).observe(meter, {
      attributes: true,
      attributeFilter: ["value"],
    });
    update();
    document.body.dataset.hudDesign = "kit";
  }
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      hud();
      summary();
    },
    { once: true },
  );
})();
