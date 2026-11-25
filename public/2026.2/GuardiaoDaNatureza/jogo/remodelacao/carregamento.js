"use strict";
(() => {
  const root = () => document.getElementById("loading");
  const id = location.pathname.includes("floresta-viva")
    ? 1
    : Number(new URLSearchParams(location.search).get("fase") || 2);
  const names = [
    "Floresta em Chamas",
    "Rio Poluído",
    "Resgate da Fauna",
    "Reflorestamento",
    "Cidade Sustentável",
  ];
  const tips = [
    "Cuide dos focos de incêndio para proteger os animais.",
    "Cada resíduo fora da água ajuda a vida do rio.",
    "Aproxime-se com cuidado dos amigos que precisam de ajuda.",
    "Escolha uma semente, plante e regue.",
    "Cada material tem seu lugar na coleta seletiva.",
  ];
  let total = 0,
    done = 0,
    failed = false,
    finished = false,
    lastPercent = 0;
  function render(label) {
    if (failed || finished) return;
    lastPercent = total ? Math.min(99, Math.floor((done / total) * 100)) : 0;
    root().querySelector("[data-load-status]").textContent =
      label || "Preparando a trilha…";
    root().querySelector("[data-load-count]").textContent = total
      ? lastPercent + "%"
      : "Preparando…";
    const bar = root().querySelector('[role="progressbar"]');
    if (total) bar.setAttribute("aria-valuenow", String(lastPercent));
    else bar.removeAttribute("aria-valuenow");
    root().querySelector("[data-load-fill]").style.width = lastPercent + "%";
  }
  function setup(count) {
    total = count;
    done = 0;
    failed = false;
    finished = false;
    lastPercent = 0;
    const node = root();
    node.className = "remodel-loading";
    node.hidden = false;
    node.innerHTML = `<div class="remodel-load-center"><img class="remodel-load-logo" src="../raizes/assets/titulo.webp" width="1600" height="667" alt="Guardião da Natureza"><p class="eyebrow">PREPARANDO A TRILHA</p><h1>Carregando…</h1><h2>${names[id - 1]}</h2><div class="remodel-load-track" role="progressbar" aria-label="Carregamento da fase" aria-valuemin="0" aria-valuemax="100"><span data-load-fill></span></div><strong data-load-count></strong><p data-load-status></p><div class="remodel-load-tip"><strong>DICA DA FLORA</strong><p>${tips[id - 1]}</p></div><a class="remodel-retry" href="${location.href}" hidden>Tentar novamente</a></div>`;
    document.body.dataset.loadingState = "loading";
    render();
  }
  async function run(jobs) {
    setup(jobs.filter((j) => j.label).length);
    return Promise.all(
      jobs.map((j) =>
        Promise.resolve()
          .then(j.load)
          .then((result) => {
            if (j.label) {
              done++;
              render("Pronto: " + j.label);
            }
            return result;
          }),
      ),
    );
  }
  function finish() {
    if (failed || done !== total)
      throw Error("Recursos obrigatórios incompletos");
    if (document.body.dataset.gameReady !== "true")
      throw Error("A fase ainda não está pronta");
    lastPercent = 100;
    root().querySelector("[data-load-fill]").style.width = "100%";
    root().querySelector("[data-load-count]").textContent = "100%";
    root()
      .querySelector('[role="progressbar"]')
      .setAttribute("aria-valuenow", "100");
    finished = true;
    document.body.dataset.loadingState = "ready";
    root().hidden = true;
  }
  function fail(error) {
    failed = true;
    document.body.dataset.loadingState = "error";
    root().hidden = false;
    root().querySelector("h1").textContent = "Não foi possível carregar";
    root().querySelector("[data-load-status]").textContent =
      "Não foi possível preparar a fase. Confira sua conexão e tente novamente.";
    root().querySelector(".remodel-retry").hidden = false;
    root().querySelector("[data-load-count]").textContent =
      "Carregamento interrompido";
    console.error(error);
  }
  window.GuardiaoCarregamento = {
    run,
    finish,
    fail,
    state: () => ({ total, done, percent: lastPercent, failed, finished }),
  };
})();
