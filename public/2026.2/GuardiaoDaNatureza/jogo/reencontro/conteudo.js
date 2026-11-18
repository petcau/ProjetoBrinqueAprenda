"use strict";
(() => {
  if (!window.GuardiaoFasesJogaveis) return;
  const phases = structuredClone(GuardiaoFasesJogaveis);
  const fauna = phases[3];
  const problems = {
    macaco: ["cage", "Mico preso no abrigo"],
    tucano: ["cage", "Tucano preso na gaiola"],
    ave: ["wing", "Passarinho com a asa ferida"],
    capivara: ["net", "Capivara presa numa rede"],
    onca: ["paw", "Onça com a pata machucada"],
    arara: ["net", "Arara enroscada em uma linha"],
    tamandua: ["log", "Tamanduá bloqueado por um galho"],
    anta: ["net", "Anta presa numa rede abandonada"],
    preguica: ["log", "Preguiça isolada por um galho caído"],
  };
  for (const t of fauna.tasks) {
    if (!problems[t.id]) continue;
    [t.problem, t.problemLabel] = problems[t.id];
    t.home = GuardiaoElenco.habitat(t.speciesKey);
  }
  fauna.goals.find((g) => g[0] === "animal")[2] = fauna.tasks.filter(
    (t) => t.type !== "key",
  ).length;
  fauna.intro[1] =
    "Encontre a chave. Há amigos feridos e presos em redes e galhos. Vamos ajudá-los com cuidado!";
  fauna.hint =
    "A patinha mostra quem precisa de ajuda. Chegue perto para cuidar.";
  for (const t of phases[2].tasks) {
    if (t.type === "fish") {
      t.problem = t.id === "peixes1" ? "net" : "plastic";
      t.problemLabel =
        t.id === "peixes1"
          ? "Peixes enroscados numa rede"
          : "Peixes presos no plástico";
      // O peixe é libertado onde está. Nunca é levado para um abrigo em terra.
      t.home = { x: t.x + 36, y: t.y - 16 };
    } else if (t.type === "turtle") {
      t.problem = "plastic";
      t.problemLabel = "Tartaruga presa em plástico e canudo";
      // Praia livre ao norte da rocha grande: o casco não fica sobre o capim.
      t.x = 970;
      t.y = 340;
      t.home = { x: 833, y: 445 };
    }
  }
  phases[2].intro[1] =
    "Vista o traje, recolha o lixo e solte os peixes das embalagens. A tartaruga precisa de ajuda na areia!";
  phases[5].station = { x: 240, y: 535 };
  phases[5].obstacles.push(
    ...[
      { x: 154, y: 514 },
      { x: 225, y: 493 },
      { x: 300, y: 472 },
    ].map((p) => ({ ...p, rx: 18, ry: 9 })),
  );
  window.GuardiaoFasesJogaveis = Object.freeze(phases);
  // A física corresponde à ilustração aprovada, antes das árvores aleatórias.
  window.ReencontroGeometria = Object.fromEntries(
    [2, 3, 4, 5].map((id) => [
      id,
      structuredClone(
        Object.fromEntries(
          [
            "floor",
            "water",
            "bridge",
            "docks",
            "obstacles",
            "barriers",
            "noWalkWater",
            "dryBridge",
          ].map((k) => [k, phases[id][k]]),
        ),
      ),
    ]),
  );
})();
