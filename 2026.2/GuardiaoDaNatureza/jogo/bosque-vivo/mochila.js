"use strict";
(() => {
  const R = Raizes,
    A = BrisaArte;
  const phase = location.pathname.includes("floresta-viva")
    ? 1
    : location.pathname.includes("jornada")
      ? Number(new URLSearchParams(location.search).get("fase") || 2)
      : 0;
  let dialog,
    tab = "items";
  function itemCard(i) {
    const known = GuardiaoMemoria.has(i.id),
      state =
        phase === 1
          ? window.GuardiaoFloresta?.estado()
          : window.GuardiaoJornada?.estado();
    const canEquip =
      known &&
      i.phase === phase &&
      ((i.id === "mangueira" && !state?.equipped) ||
        (i.id === "protecao" && !state?.protective));
    return `<article class="brisa-item ${known ? "is-known" : "is-undiscovered"}" data-item="${i.id}" aria-label="${known ? i.name : "Equipamento ainda não descoberto"}"><div class="item-illustration" aria-hidden="true">${A.markup(i.id)}</div><div><h3>${known ? i.name : "A descobrir"}</h3><p>${known ? i.description : "Um novo cuidado guarda esta surpresa."}</p>${canEquip ? `<button type="button" data-pack-equip="${i.id}">Preparar equipamento</button>` : ""}</div></article>`;
  }
  function uniformCard(u) {
    const known = GuardiaoMemoria.hasUniform(u.id),
      active = known && GuardiaoMemoria.read().uniform === u.id;
    return `<article class="brisa-item brisa-uniform ${known ? "is-known" : "is-undiscovered"} ${active ? "is-worn" : ""}" data-uniform="${u.id}" aria-label="${known ? u.name : "Traje ainda não descoberto"}"><div class="item-illustration uniform-${u.id}" aria-hidden="true">${BosqueKai.uniformMarkup(u.id)}</div><div><h3>${known ? u.name : "Traje a descobrir"}</h3><p>${known ? u.description : "A equipe entrega este traje durante a aventura."}</p>${active ? '<span class="worn-label">Vestindo agora</span>' : ""}</div></article>`;
  }
  function render() {
    const m = GuardiaoMemoria,
      earned = m.obtained(),
      body = dialog.querySelector("#pack-content");
    dialog
      .querySelectorAll("[data-pack-tab]")
      .forEach((b) =>
        b.setAttribute("aria-selected", String(b.dataset.packTab === tab)),
      );
    if (tab === "items") {
      const sorted = [...m.items].sort(
        (a, b) => m.has(b.id) - m.has(a.id) || a.phase - b.phase,
      );
      body.innerHTML =
        '<p class="collection-hint">Cada aliado entrega ferramentas para cuidar da sua região.</p><div class="brisa-collection">' +
        sorted.map(itemCard).join("") +
        "</div>";
    } else if (tab === "uniforms")
      body.innerHTML =
        '<p class="collection-hint">Os trajes são preparados com o aliado de cada missão.</p><div class="brisa-collection uniform-collection">' +
        m.uniforms.map(uniformCard).join("") +
        "</div>";
    else
      body.innerHTML = `<div class="brisa-crystals"><div class="brisa-necklace">${GuardiaoRelicario.necklace(earned, "pack")}<h3>${earned.length} de 5 cristais</h3></div><div class="crystal-collection">${m.crystals
        .map((c, i) => {
          const known = earned.includes(c.id);
          return `<article class="${known ? "is-known" : "is-undiscovered"}"><div class="item-illustration">${GuardiaoRelicario.fragment(i, known)}</div><h3>${known ? "Cristal da " + c.name : "A descobrir"}</h3><p>${known ? c.description : "Um cuidado, uma nova peça."}</p></article>`;
        })
        .join("")}</div></div>`;
    body.scrollTop = 0;
  }
  function make() {
    if (dialog) return;
    dialog = document.createElement("dialog");
    dialog.id = "mochila-jornada";
    dialog.className = "ra-dialog ra-pack brisa-pack";
    dialog.setAttribute("aria-labelledby", "pack-title");
    dialog.innerHTML = `<header><span class="pack-emblem">${A.markup("bag")}</span><div><p class="eyebrow">CUIDADOS QUE VIAJAM COM VOCÊ</p><h2 id="pack-title">Mochila de Kai</h2></div><button type="button" data-pack-close class="icon-button" aria-label="Fechar mochila">${R.icon("close")}</button></header><div class="ra-tabs" role="tablist" aria-label="Dentro da mochila"><button type="button" role="tab" data-pack-tab="items">Ferramentas</button><button type="button" role="tab" data-pack-tab="crystals">Colar</button><button type="button" role="tab" data-pack-tab="uniforms">Trajes</button></div><section id="pack-content" tabindex="0" role="tabpanel" aria-label="Coleção de Kai"></section><p id="pack-status" role="status"></p>`;
    document.body.append(dialog);
    dialog.addEventListener("click", (e) => {
      if (e.target.closest("[data-pack-close]")) dialog.close();
      const b = e.target.closest("[data-pack-tab]");
      if (b) {
        tab = b.dataset.packTab;
        render();
      }
      const equip = e.target.closest("[data-pack-equip]");
      if (equip && GuardiaoMemoria.has(equip.dataset.packEquip)) {
        dialog.close();
        document.dispatchEvent(
          new CustomEvent("guardiao:equipar", {
            detail: { id: equip.dataset.packEquip },
          }),
        );
      }
    });
    dialog.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        dialog.close();
      }
      if (
        ["ArrowLeft", "ArrowRight"].includes(e.key) &&
        e.target.matches("[data-pack-tab]")
      ) {
        e.preventDefault();
        const tabs = [...dialog.querySelectorAll("[data-pack-tab]")],
          i = tabs.indexOf(e.target),
          b = tabs[(i + (e.key === "ArrowRight" ? 1 : 2)) % 3];
        b.click();
        b.focus();
      }
    });
  }
  function open() {
    if (window.VivaFinal?.active) return;
    make();
    document.querySelectorAll("dialog[open]").forEach((d) => {
      if (d !== dialog && d.id !== "girar-celular" && d.id !== "girar-tela")
        d.close();
    });
    document.dispatchEvent(new CustomEvent("guardiao:neutralizar"));
    render();
    if (!dialog.open) dialog.showModal();
  }
  document.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("map-backpack");
    if (button) button.onclick = open;
    document.addEventListener("keydown", (e) => {
      if (
        !phase &&
        e.key.toLowerCase() === "b" &&
        document.body.dataset.view === "mapa" &&
        !document.querySelector("dialog[open]")
      ) {
        e.preventDefault();
        open();
      }
    });
  });
  window.GuardiaoMochila = { open };
})();
