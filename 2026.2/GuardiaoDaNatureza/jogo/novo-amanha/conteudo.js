"use strict";
(() => {
  const phases = structuredClone(window.GuardiaoFasesJogaveis);
  Object.assign(phases[2], {
    equipment: ["shield", "net", "bag"],
    equipmentText: "Traje de proteção, rede e bolsa de coleta",
    intro: [
      "Oi, Kai! O rio precisa de ajuda. Leve o traje, a rede e a bolsa de coleta.",
      "Vista a proteção antes de entrar na água. Recolha o lixo e cuide dos peixes e da tartaruga comigo!",
    ],
    hint: "Use a proteção e recolha o lixo perto dos animais.",
  });
  const quiz = (question, options, answer, explanation) => ({
    question,
    options,
    answer,
    explanation,
  });
  const fauna = phases[3];
  fauna.equipment = ["paw", "rope", "hand"];
  fauna.equipmentText = "Kit veterinário, corda e luvas";
  fauna.intro = [
    "Oi, Kai! Sou Marina. Aqui estão o kit, as luvas e a corda de resgate.",
    "A chave está perto da mesa. Cada amigo precisa de um cuidado diferente. Vamos juntos!",
  ];
  for (const t of fauna.tasks) {
    if (t.id === "macaco") {
      t.name = "Mico-leão-dourado";
      t.speciesKey = "mico";
      t.needs = ["chave-abrigo"];
      t.quiz = quiz(
        "Onde o mico-leão-dourado deve viver?",
        [
          ["mata", "Na Mata Atlântica", "leaf"],
          ["gaiola", "Sempre numa gaiola", "lock"],
        ],
        "mata",
        "Isso! O mico-leão-dourado é brasileiro e precisa da Mata Atlântica protegida.",
      );
    }
    if (t.id === "tucano") {
      t.name = "Tucano-toco";
      t.speciesKey = "tucano";
      t.needs = ["chave-abrigo"];
      t.quiz = quiz(
        "Como o tucano ajuda a floresta?",
        [
          ["sementes", "Espalhando sementes", "seeds"],
          ["lixo", "Deixando lixo no chão", "trash"],
        ],
        "sementes",
        "As sementes dos frutos podem viajar com as aves e dar origem a novas árvores!",
      );
    }
    if (t.id === "ave") {
      t.name = "Passarinho ferido";
      t.speciesKey = "passaro";
      t.quiz = quiz(
        "A ave está ferida. Quem pode ajudar?",
        [
          ["marina", "Marina, a veterinária", "paw"],
          ["sozinho", "Dar um remédio sozinho", "bag"],
        ],
        "marina",
        "Marina sabe examinar a ave. Na vida real, peça ajuda a um adulto e a um profissional.",
      );
    }
  }
  fauna.tasks.unshift({
    id: "chave-abrigo",
    type: "key",
    x: 389,
    y: 277,
    name: "Chave dos abrigos",
    icon: "key",
  });
  fauna.tasks.push({
    id: "capivara",
    type: "care",
    x: 1010,
    y: 285,
    name: "Capivara",
    icon: "paw",
    speciesKey: "capivara",
    species: 0,
    quiz: quiz(
      "Qual é um bom lar para a capivara?",
      [
        ["rio", "Vegetação perto da água", "water"],
        ["rua", "Uma rua cheia de carros", "trash"],
      ],
      "rio",
      "Capivaras vivem em grupo e costumam ficar perto de rios e lagoas. Vamos devolver um lugar seguro a ela!",
    ),
  });
  fauna.goals = [
    ["key", "Chave encontrada", 1, "key"],
    ["animal", "Amigos seguros", 5, "paw"],
  ];
  const planting = phases[4];
  planting.equipment = ["shovel", "seeds", "watering"];
  planting.equipmentText = "Pá, sementes nativas, mudas e regador";
  planting.intro = [
    "Oi, Kai! Trouxe ipê, ingá e aroeira. Pegue a pá e o regador.",
    "Limpe o local, cave, plante e regue. Algumas mudas precisam de proteção. A fonte enche o regador!",
  ];
  planting.hint = "Limpe o canteiro e prepare a terra antes de plantar.";
  planting.tasks
    .filter((t) => t.type === "bed")
    .forEach((t, i) => {
      t.native = ["ipê", "ingá", "aroeira"][i % 3];
      t.protect = i % 3 === 1;
      t.terrain =
        i % 3 === 1
          ? "perto da água"
          : i % 3 === 2
            ? "solo seco"
            : "clareira com sol";
      t.name = "Canteiro de " + t.native;
    });
  const city = phases[5];
  city.intro = [
    "Oi, Kai! A comunidade quer participar. Pegue a bolsa, o kit solar e as ferramentas da praça.",
    "Separe os resíduos, cuide dos jardins e ajude os vizinhos a escolher caminhos mais sustentáveis.",
  ];
  city.equipment = ["recycle", "sun", "leaf"];
  city.equipmentText = "Bolsa de reciclagem, kit solar e kit da praça";
  city.tasks.push(
    {
      id: "ciclovia",
      type: "transport",
      x: 560,
      y: 370,
      name: "Ciclovia da comunidade",
      icon: "bike",
      quiz: quiz(
        "Para um passeio curto, qual escolha ajuda o ar?",
        [
          ["bike", "Ir de bicicleta com segurança", "bike"],
          ["car", "Usar um carro para cada pessoa", "trash"],
        ],
        "bike",
        "Bicicletas ocupam menos espaço e não soltam fumaça durante o passeio. A ciclovia deixa o trajeto mais seguro!",
      ),
    },
    {
      id: "onibus",
      type: "transport",
      x: 949,
      y: 527,
      name: "Ponto de ônibus",
      icon: "bus",
      quiz: quiz(
        "Muitas pessoas vão ao mesmo lugar. Como viajar juntas?",
        [
          ["bus", "Usar o transporte público", "bus"],
          ["car", "Cada uma num carro", "trash"],
        ],
        "bus",
        "Um ônibus pode levar muitas pessoas. Compartilhar o transporte reduz o número de carros na rua.",
      ),
    },
    {
      id: "vizinhanca",
      type: "community",
      x: 465,
      y: 454,
      name: "Mutirão da praça",
      icon: "hand",
    },
  );
  city.goals.push(
    ["transport", "Caminhos sustentáveis", 2, "bike"],
    ["community", "Vizinhos ajudados", 1, "hand"],
  );
  window.GuardiaoFasesJogaveis = Object.freeze(phases);
})();
