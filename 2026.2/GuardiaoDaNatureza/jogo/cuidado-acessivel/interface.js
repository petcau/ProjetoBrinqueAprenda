"use strict";
(() => {
  function init() {
    const form = document.getElementById("preferences");
    if (form) {
      document.body.classList.add("settings-in-tabs");
      const fields = [...form.querySelectorAll("fieldset.preference-card")];
      const tablist = document.createElement("div");
      tablist.className = "settings-tabs";
      tablist.setAttribute("role", "tablist");
      tablist.setAttribute("aria-label", "Categorias das configurações");
      const labels = ["Áudio", "Conforto", "Controles"];
      const select = (index, focus = false) => {
        fields.forEach((field, i) => {
          field.hidden = i !== index;
          const tab = tablist.children[i];
          tab.setAttribute("aria-selected", String(i === index));
          tab.tabIndex = i === index ? 0 : -1;
        });
        if (focus) tablist.children[index].focus();
        document.querySelector(".panel-inner").scrollTop = 0;
      };
      fields.forEach((field, index) => {
        field.id = "settings-panel-" + index;
        field.setAttribute("role", "tabpanel");
        field.setAttribute("aria-labelledby", "settings-tab-" + index);
        const tab = document.createElement("button");
        tab.type = "button";
        tab.id = "settings-tab-" + index;
        tab.textContent = labels[index];
        tab.setAttribute("role", "tab");
        tab.setAttribute("aria-controls", field.id);
        tab.addEventListener("click", () => select(index));
        tab.addEventListener("keydown", (e) => {
          let next;
          if (e.key === "ArrowRight") next = (index + 1) % fields.length;
          if (e.key === "ArrowLeft")
            next = (index + fields.length - 1) % fields.length;
          if (e.key === "Home") next = 0;
          if (e.key === "End") next = fields.length - 1;
          if (next !== undefined) {
            e.preventDefault();
            select(next, true);
          }
        });
        tablist.append(tab);
      });
      form.prepend(tablist);
      select(0);
      document.querySelector(".settings-scene")?.remove();
    }
    // O desenho não substitui uma fotografia: mantenha a autoria identificada.
    const team = document.getElementById("team");
    if (team && !team.querySelector(".creators-authorship")) {
      const names = document.createElement("div");
      names.className = "creators-authorship";
      names.innerHTML =
        '<p class="eyebrow">CRIAÇÃO DO PROJETO</p><div class="creator-name"><h3>Iuri Barroso Nascimento</h3><p>Criação e desenvolvimento</p></div><div class="creator-name"><h3>Hicham Mohamed El Attar</h3><p>Criação e desenvolvimento</p></div><p class="other-creators">Com a participação de Eric e Nadson.</p>';
      team.querySelector(".team-profile-heading")?.before(names);
    }
    const hints = document.querySelectorAll(".keyboard-hint,.keyboard-help");
    hints.forEach((el) => {
      el.textContent = el.textContent.replace(/E ·/g, "Enter / E ·");
    });
  }
  window.addEventListener(
    "keydown",
    (e) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key))
        return;
      const choice = e.target.closest?.("#puzzle-options [data-answer]");
      if (!choice) return;
      const options = [
        ...choice.parentElement.querySelectorAll("button:not(:disabled)"),
      ];
      const step = ["ArrowRight", "ArrowDown"].includes(e.key) ? 1 : -1;
      e.preventDefault();
      e.stopImmediatePropagation();
      options[
        (options.indexOf(choice) + step + options.length) % options.length
      ]?.focus();
    },
    { capture: true },
  );
  // O Enter mantém a ativação nativa dos botões e campos; na aventura ele é contextual.
  window.addEventListener(
    "keydown",
    (e) => {
      if (
        e.key !== "Enter" ||
        e.isComposing ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey
      )
        return;
      const field = e.target.closest?.(
        "input,select,textarea,[contenteditable=true]",
      );
      if (field) {
        if (field.matches("input[type=checkbox],input[type=radio]")) {
          e.preventDefault();
          if (!e.repeat) field.click();
        }
        return;
      }
      const dialog =
        e.target.closest?.("dialog[open]") ||
        [...document.querySelectorAll("dialog[open]")].at(-1);
      if (dialog) {
        if (e.target.closest?.("button,a[href],summary")) return;
        const primary = dialog.querySelector(
          "#conversa-avancar,#intro-next,[data-map-action=start],#puzzle-options button,[data-close],button:not(.viewport-control)",
        );
        if (primary && !primary.disabled) {
          e.preventDefault();
          e.stopImmediatePropagation();
          if (!e.repeat) primary.click();
        }
        return;
      }
      if (
        document.getElementById("jogo") &&
        document.body.dataset.gameReady === "true"
      ) {
        const explicit = e.target.closest?.("button,a[href],summary");
        if (
          explicit &&
          !explicit.matches("#interagir,#mangueira,#ferramenta,[data-goal]")
        )
          return;
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!e.repeat)
          document.dispatchEvent(new CustomEvent("guardiao:acao-principal"));
      }
    },
    { capture: true },
  );
  window.addEventListener(
    "keyup",
    (e) => {
      if (e.key === "Enter")
        document.dispatchEvent(new CustomEvent("guardiao:soltar-acao"));
    },
    { capture: true },
  );
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
