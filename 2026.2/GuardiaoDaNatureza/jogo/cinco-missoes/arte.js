"use strict";
(() => {
  const base = new URL("./", document.currentScript.src);
  const { art, frame } = MochilaIlustrada,
    ids = GuardiaoMemoria.items.map((i) => i.id);
  // A mesma área quadrada centraliza peças largas e altas sem esticá-las.
  const tool = (id) => {
    const name = "ferramenta-" + (ids.indexOf(id) + 1),
      [x, y, w, h] = MochilaIlustradaAtlas[name].bounds,
      side = Math.max(w, h);
    return art(
      name,
      [x + (w - side) / 2, y + (h - side) / 2, side, side],
      "mission-tool",
    );
  };
  const card = () =>
    frame(
      "painel-ferramentas",
      [47, 300, 486, 299],
      64,
      64,
      "mission-card-frame",
    );
  const green = (cls) =>
    frame("painel-apresentacao", [748, 162, 874, 64], 70, 25, cls);
  function tools(memory) {
    const sorted = [...memory.items].sort(
      (a, b) => memory.has(b.id) - memory.has(a.id) || a.phase - b.phase,
    );
    return (
      '<p class="collection-hint">Cada aliado entrega ferramentas para cuidar da sua região.</p><div class="brisa-collection mission-tools-grid">' +
      sorted
        .map((i) => {
          const known = memory.has(i.id),
            description =
              i.id === "jardim"
                ? "Ajuda a cuidar dos espaços verdes da comunidade."
                : i.description;
          return `<article class="brisa-item mission-tool-card ${known ? "is-known" : "is-undiscovered"}" data-item="${i.id}" aria-label="${known ? i.name : "Equipamento ainda não descoberto"}">
        ${card()}<div class="item-illustration" aria-hidden="true">${tool(i.id)}</div><div><h3>${known ? i.name : "A descobrir"}</h3><p>${known ? description : "Um novo cuidado guarda esta surpresa."}</p></div>
      </article>`;
        })
        .join("") +
      "</div>"
    );
  }
  function decorate() {
    const dialog = document.getElementById("phase-dialog");
    if (dialog.dataset.kitDecorated) return;
    dialog.dataset.kitDecorated = "true";
    dialog.insertAdjacentHTML(
      "afterbegin",
      frame(
        "painel-apresentacao",
        [0, 0, 1672, 941],
        21,
        21,
        "brief-window-frame",
        false,
      ),
    );
    dialog
      .querySelector("header")
      .insertAdjacentHTML(
        "afterbegin",
        art(
          "painel-apresentacao",
          [200, 22, 1280, 104],
          "brief-heading-art",
          "xMidYMid slice",
        ),
      );
    dialog
      .querySelectorAll(".phase-copy > section, .phase-loot > section")
      .forEach((section) => {
        section.insertAdjacentHTML("afterbegin", card());
        section
          .querySelector("h3")
          .insertAdjacentHTML("afterbegin", green("brief-label-art"));
      });
    dialog
      .querySelector(".phase-scene")
      .insertAdjacentHTML("afterbegin", card());
    dialog
      .querySelector("figcaption")
      .insertAdjacentHTML(
        "afterbegin",
        frame(
          "painel-apresentacao",
          [49, 660, 675, 97],
          76,
          32,
          "brief-caption-art",
        ),
      );
    for (const id of ["phase-back", "start-phase"])
      document
        .getElementById(id)
        .insertAdjacentHTML(
          "afterbegin",
          frame("botao-fase", [0, 0, 735, 122], 90, 42, "brief-action-art"),
        );
  }
  function brief(id) {
    decorate();
    const dialog = document.getElementById("phase-dialog"),
      picture = document.getElementById("phase-picture"),
      src = new URL("assets/cena-" + id + ".webp", base).href;
    dialog.dataset.kitPhase = String(id);
    document.body.dataset.meetingFlora = "ombro";
    picture.alt =
      "Kai e Flora com " + document.getElementById("phase-npc").textContent;
    if (picture.src !== src) {
      dialog.dataset.pictureReady = "false";
      picture.onload = () => {
        if (picture.src === src) dialog.dataset.pictureReady = "true";
      };
      picture.src = src;
    }
    document.getElementById("phase-emblem").innerHTML = art(
      "emblema-" + id,
      [0, 3, 114, 106],
      "kit-round-icon",
    );
    document.getElementById("close-phase").innerHTML =
      window.GuardiaoRemodelacao
        ? GuardiaoRemodelacao.icon("close")
        : art("fechar-fase", [6, 6, 96, 96], "kit-round-icon");
    const items = GuardiaoMemoria.items.filter((i) => i.phase === id);
    document.getElementById("phase-items").innerHTML =
      `<span class="brief-item-art" aria-hidden="true">${items.map((i) => tool(i.id)).join("")}</span><span>${
        {
          1: "Mangueira e kit de cuidado",
          2: "Rede, bolsa e proteção do rio",
          3: "Kit veterinário e material de resgate",
          4: "Sementes, mudas e regador",
          5: "Materiais para cuidar da cidade",
        }[id]
      }</span>`;
    document.getElementById("phase-reward").innerHTML = art("cristal-" + id);
    const start = document.getElementById("start-phase");
    if (!start.querySelector(".brief-action-art"))
      start.insertAdjacentHTML(
        "afterbegin",
        frame("botao-fase", [0, 0, 735, 122], 90, 42, "brief-action-art"),
      );
  }
  window.CincoMissoes = Object.freeze({ tools, tool, brief });
})();
