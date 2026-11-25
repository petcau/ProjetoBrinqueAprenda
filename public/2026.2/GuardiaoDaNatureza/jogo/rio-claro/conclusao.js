"use strict";
(() => {
  const phase = location.pathname.includes("floresta-viva")
    ? 1
    : Number(new URLSearchParams(location.search).get("fase") || 2);
  function paint(c, w, h, time, reduced = false) {
    c.save();
    c.clearRect(0, 0, w, h);
    // Os pés compartilham o chão; as asas ficam no espaço entre os rostos.
    c.fillStyle = "#698f4330";
    for (const x of [0.25, 0.74]) {
      c.beginPath();
      c.ellipse(w * x, h * 0.92, w * 0.12, h * 0.025, 0, 0, Math.PI * 2);
      c.fill();
    }
    const bob = reduced ? 0 : Math.sin(time * 3) * h * 0.008;
    RaizesPersonagens.draw(c, "acoes", 6, w * 0.25, h * 0.92 + bob, h * 0.76);
    RaizesPersonagens.draw(c, "npcs", 4 + phase, w * 0.75, h * 0.92, h * 0.79);
    RaizesPersonagens.draw(
      c,
      "flora",
      14 + (reduced ? 0 : Math.floor(time * 3) % 2),
      w * 0.52,
      h * 0.32 + bob,
      h * 0.24,
    );
    c.restore();
  }
  function init() {
    const panel = document.getElementById("vitoria");
    if (!panel) return;
    panel.className = "resumo-natural";
    const title = panel.querySelector("h2"),
      eyebrow = panel.querySelector(".panel-eyebrow,.eyebrow"),
      art = panel.querySelector(".celebration-art,#celebration"),
      stats = panel.querySelector(".completion-stats,#victory-stats"),
      next = panel.querySelector("a"),
      notes = [...panel.querySelectorAll("#salvo,#reward-label,#save-state")];
    const header = document.createElement("header");
    header.className = "resumo-cabecalho";
    header.append(eyebrow, title);
    const body = document.createElement("div");
    body.className = "resumo-corpo";
    const reward = document.createElement("figure");
    reward.className = "resumo-colar";
    const friends = document.createElement("div");
    friends.className = "resumo-amigos";
    friends.append(art);
    const caption = document.createElement("p");
    caption.className = "resumo-legenda";
    caption.textContent =
      "Kai, Flora e " +
      ["Carlos", "Antônio", "Marina", "Rafael", "Luciana"][phase - 1];
    friends.append(caption);
    body.append(reward, friends);
    const footer = document.createElement("footer");
    footer.className = "resumo-acoes";
    next.className = "primary resumo-proximo";
    next.autofocus = true;
    footer.append(next);
    next.addEventListener(
      "click",
      (event) => {
        if (
          event.button > 0 ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        // A saída não pode conservar a prévia não modal da recompensa.
        panel.classList.remove("reward-preview");
        panel.dataset.summaryLeaving = "true";
        panel.hidden = true;
        if (panel.open) panel.close();
      },
      { capture: true },
    );
    panel.addEventListener("cancel", (e) => e.preventDefault());
    const note = document.createElement("div");
    note.className = "resumo-nota";
    note.append(...notes);
    panel.replaceChildren(header, body, stats, note, footer);
    const canvas = panel.querySelector("canvas");
    if (canvas) {
      canvas.width = 420;
      canvas.height = 230;
    }
    function update() {
      let earned = [];
      try {
        earned = JSON.parse(
          localStorage.getItem("guardiao.colar.fragmentos.v1") || "[]",
        );
      } catch {}
      earned = [
        ...new Set([...(Array.isArray(earned) ? earned : []), phase]),
      ].filter((n) => Number.isInteger(n) && n >= 1 && n <= 5);
      reward.innerHTML =
        (window.ConquistaViva?.necklace(earned) ||
          GuardiaoRelicario.necklace(earned, "summary")) +
        `<figcaption><strong>${earned.length} de 5</strong> cristais conquistados</figcaption>` +
        `<div class="resumo-cristais" aria-hidden="true">${Array.from({ length: 5 }, (_, i) => GuardiaoRelicario.fragment(i, earned.includes(i + 1))).join("")}</div>`;
    }
    update();
    new MutationObserver(() => {
      if (panel.open) update();
    }).observe(panel, { attributes: true, attributeFilter: ["open"] });
    document.body.dataset.summaryDesign = "rio-claro";
  }
  window.RioClaroResumo = { paint };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
