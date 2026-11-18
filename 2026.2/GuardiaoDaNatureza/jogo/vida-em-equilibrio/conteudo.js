"use strict";
(() => {
  const phases = structuredClone(window.GuardiaoFasesJogaveis);
  const fauna = phases[3];
  fauna.tasks = fauna.tasks.filter((t) => t.type !== "kitten");
  const quiz = (question, correct, wrong, explanation) => ({
    question,
    options: [
      ["cuidado", correct, "leaf"],
      ["risco", wrong, "trash"],
    ],
    answer: "cuidado",
    explanation,
  });
  const friends = [
    [
      "onca",
      "Onça-pintada",
      727,
      422,
      "Por que a onça precisa de uma floresta protegida?",
      "Para ter espaço, alimento e abrigo",
      "Para morar numa gaiola",
      "Ela precisa de grandes áreas naturais. Proteger a floresta protege a onça e muitas outras espécies.",
    ],
    [
      "arara",
      "Arara-azul",
      660,
      175,
      "O que ajuda a arara-azul a continuar livre?",
      "Proteger ninhos e palmeiras",
      "Comprar aves capturadas",
      "Palmeiras oferecem alimento e abrigo. A arara deve viver livre; não compre animais silvestres.",
    ],
    [
      "tamandua",
      "Tamanduá-bandeira",
      515,
      534,
      "Qual é o alimento do tamanduá-bandeira?",
      "Formigas e cupins",
      "Embalagens de comida",
      "Com seu focinho e sua língua comprida, ele encontra formigas e cupins. Fogo e estradas ameaçam seu habitat.",
    ],
    [
      "anta",
      "Anta",
      740,
      575,
      "Como a anta ajuda a floresta?",
      "Espalhando sementes dos frutos",
      "Deixando plástico pelo caminho",
      "A anta come frutos e espalha suas sementes. Por isso é conhecida como uma jardineira da floresta!",
    ],
    [
      "preguica",
      "Bicho-preguiça",
      440,
      320,
      "O que deixa o bicho-preguiça mais seguro?",
      "Árvores conectadas e preservadas",
      "Derrubar as árvores ao redor",
      "A preguiça vive nas árvores e come folhas. Copas conectadas ajudam seus deslocamentos lentos e seguros.",
    ],
  ];
  for (const [
    key,
    name,
    x,
    y,
    question,
    correct,
    wrong,
    explanation,
  ] of friends)
    fauna.tasks.push({
      id: key,
      speciesKey: key,
      type: "care",
      x,
      y,
      name,
      icon: "paw",
      quiz: quiz(question, correct, wrong, explanation),
    });
  fauna.goals = [
    ["key", "Chave encontrada", 1, "key"],
    ["animal", "Amigos seguros", 9, "paw"],
  ];
  fauna.equipmentText = "Kit veterinário, alimento e chave dos abrigos";
  fauna.intro[1] =
    "Encontre a chave e ajude os animais brasileiros. Cada amigo tem uma pergunta e um cuidado!";
  const planting = phases[4];
  planting.tasks = planting.tasks.filter((t) => t.type === "bed");
  planting.tasks.forEach((t, i) => {
    delete t.native;
    delete t.protect;
    delete t.terrain;
    t.name = "Canteiro " + (i + 1);
  });
  planting.goals = [["bed", "Plantas cuidadas", 6, "leaf"]];
  planting.equipment = ["seeds", "watering"];
  planting.equipmentText = "Mudas nativas e regador";
  planting.intro = [
    "Oi, Kai! Trouxe ipê, ingá e aroeira. Escolha as suas plantas favoritas!",
    "É só plantar e regar. Depois observe a vida crescendo. A fonte enche o regador!",
  ];
  planting.hint = "Escolha uma muda, plante e segure o regador para cuidar.";
  const city = phases[5];
  city.tasks = city.tasks.filter((t) =>
    ["recycle", "solar", "garden"].includes(t.type),
  );
  const kinds = [
    "recyclable",
    "recyclable",
    "recyclable",
    "organic",
    "residual",
    "residual",
  ];
  const names = [
    "Garrafa plástica",
    "Papel limpo",
    "Latinha",
    "Casca de fruta",
    "Papel sujo",
    "Esponja usada",
  ];
  city.tasks
    .filter((t) => t.type === "recycle")
    .forEach((t, i) => {
      t.category = kinds[i];
      t.name = names[i];
      t.material = kinds[i];
    });
  city.goals = [
    ["recycle", "Resíduos separados", 6, "recycle"],
    ["solar", "Painéis funcionando", 2, "sun"],
    ["garden", "Jardins recuperados", 2, "leaf"],
  ];
  city.intro[1] =
    "Separe os resíduos, ajuste os painéis e recupere os jardins. A cidade muda com cada cuidado!";
  window.GuardiaoFasesJogaveis = Object.freeze(phases);
})();
