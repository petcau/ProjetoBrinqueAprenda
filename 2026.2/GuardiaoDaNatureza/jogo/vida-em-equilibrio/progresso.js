"use strict";
(() => {
  const KEY = "guardiao.amanha.memoria.v1";
  const items = [
    [
      "mangueira",
      "Mangueira de Carlos",
      "water",
      1,
      "Abra o registro e segure ÁGUA perto dos focos.",
    ],
    [
      "luvas",
      "Luvas de cuidado",
      "hand",
      1,
      "Protegem as mãos de Kai durante os cuidados da aventura.",
    ],
    [
      "kit",
      "Kit de resgate",
      "paw",
      1,
      "Ajuda os animais depois que o caminho está seguro.",
    ],
    [
      "rede",
      "Rede do rio",
      "net",
      2,
      "Recolhe resíduos e ajuda no cuidado dos peixes.",
    ],
    [
      "saco",
      "Bolsa de coleta",
      "bag",
      2,
      "Guarda os resíduos retirados da água.",
    ],
    [
      "protecao",
      "Traje de proteção",
      "shield",
      2,
      "Obrigatório para Kai entrar na água contaminada.",
    ],
    [
      "veterinario",
      "Kit veterinário de Marina",
      "paw",
      3,
      "Serve para cuidar dos amigos com a orientação de Marina.",
    ],
    [
      "corda",
      "Corda de resgate",
      "rope",
      3,
      "Material da equipe de resgate, utilizado com orientação de Marina.",
    ],
    [
      "chave",
      "Chave dos abrigos",
      "key",
      3,
      "Encontre perto de Marina para abrir os cercados.",
    ],
    [
      "pa",
      "Pá de plantio",
      "shovel",
      4,
      "Ferramenta da equipe para cuidar das mudas.",
    ],
    [
      "sementes",
      "Sementes nativas",
      "seeds",
      4,
      "Ipê, ingá e aroeira: cada espécie tem seu lugar.",
    ],
    [
      "mudas",
      "Mudas da floresta",
      "leaf",
      4,
      "Escolha sua muda favorita, plante e regue para vê-la crescer.",
    ],
    [
      "regador",
      "Regador de Rafael",
      "watering",
      4,
      "Molha as mudas; a fonte enche a reserva.",
    ],
    [
      "reciclagem",
      "Bolsa de reciclagem",
      "recycle",
      5,
      "Leva os materiais às lixeiras corretas.",
    ],
    [
      "solar",
      "Kit solar",
      "sun",
      5,
      "Ajuda a comunidade a aproveitar a luz do sol.",
    ],
    [
      "jardim",
      "Kit da praça",
      "leaf",
      5,
      "Recupera os jardins e os espaços dos moradores.",
    ],
  ].map(([id, name, icon, phase, description]) => ({
    id,
    name,
    icon,
    phase,
    description,
  }));
  const uniforms = [
    {
      id: "explorador",
      name: "Explorador",
      phase: 0,
      color: "#518646",
      description: "A roupa da primeira trilha de Kai.",
    },
    {
      id: "protecao",
      name: "Proteção do rio",
      phase: 2,
      color: "#24a4ad",
      description:
        "Traje impermeável, luvas, botas e visor. Obrigatório dentro do rio.",
    },
    {
      id: "resgate",
      name: "Equipe de resgate",
      phase: 3,
      color: "#e3aa42",
      description: "Uniforme do cuidado, com colete e identificação da equipe.",
    },
    {
      id: "plantio",
      name: "Guardião das sementes",
      phase: 4,
      color: "#75a848",
      description: "Roupa para preparar o solo e cuidar das mudas.",
    },
    {
      id: "voluntario",
      name: "Voluntário ambiental",
      phase: 5,
      color: "#a589c6",
      description: "Colete da comunidade que cuida da cidade.",
    },
  ];
  const crystals = [
    ["Fogo", "vermelho", "#ff4739", "A coragem de proteger a floresta."],
    ["Água", "azul", "#39b9ed", "O cuidado com cada gota e com a vida do rio."],
    [
      "Fauna",
      "amarelo",
      "#e9b63c",
      "O respeito aos animais e aos seus habitats.",
    ],
    [
      "Floresta",
      "verde",
      "#6acb5e",
      "A paciência de plantar e acompanhar a vida.",
    ],
    ["Cidade", "violeta", "#b98bff", "A força das pessoas que cuidam juntas."],
  ].map(([name, colorName, color, description], i) => ({
    id: i + 1,
    name,
    colorName,
    color,
    description,
  }));
  let memory = {
    version: 1,
    grants: [],
    found: [],
    uniform: "explorador",
    phases: {},
  };
  const get = (key) => {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch {
      return null;
    }
  };
  function hydrate() {
    const v = get(KEY);
    if (v?.version === 1)
      memory = {
        ...memory,
        ...v,
        grants: Array.isArray(v.grants)
          ? v.grants.filter((n) => Number.isInteger(n) && n >= 1 && n <= 5)
          : [],
        found: Array.isArray(v.found)
          ? v.found.filter((n) => items.some((i) => i.id === n))
          : [],
        phases: v.phases && typeof v.phases === "object" ? v.phases : {},
      };
    if (!uniforms.some((u) => u.id === memory.uniform))
      memory.uniform = "explorador";
    const conquered =
      window.GuardiaoProgresso?.read().completed ||
      get("guardiao.mapa.progresso.v1")?.completed ||
      [];
    if (Array.isArray(conquered))
      for (const id of conquered)
        if (
          Number.isInteger(id) &&
          id >= 1 &&
          id <= 5 &&
          !memory.grants.includes(id)
        )
          memory.grants.push(id);
    // Existing campaigns keep their acquired equipment and victories.
    for (let id = 1; id <= 5; id++) {
      const save = get(
        id === 1
          ? "guardiao.floresta-viva.v2"
          : `guardiao.jornada.fase.${id}.v1`,
      );
      if (save?.itemsGiven && !memory.grants.includes(id))
        memory.grants.push(id);
      if (save?.completed && !memory.phases[id]?.completed)
        memory.phases[id] = {
          ...memory.phases[id],
          completed: true,
          migrated: true,
        };
    }
  }
  hydrate();
  function write() {
    let saved = true;
    try {
      localStorage.setItem(KEY, JSON.stringify(memory));
    } catch {
      saved = false;
    }
    document.dispatchEvent(
      new CustomEvent("guardiao:memoria", { detail: read() }),
    );
    return saved;
  }
  function read() {
    return structuredClone(memory);
  }
  const obtained = () =>
    window.GuardiaoProgresso?.read().completed ||
    get("guardiao.mapa.progresso.v1")?.completed ||
    [];
  const has = (id) => {
    const item = items.find((i) => i.id === id);
    return (
      !!item &&
      (memory.found.includes(id) ||
        (id !== "chave" && memory.grants.includes(item.phase)))
    );
  };
  const hasUniform = (id) => {
    const u = uniforms.find((u) => u.id === id);
    return !!u && (u.phase === 0 || memory.grants.includes(u.phase));
  };
  function grant(phase) {
    if (memory.grants.includes(phase)) return false;
    memory.grants.push(phase);
    write();
    document.dispatchEvent(
      new CustomEvent("guardiao:descoberta", {
        detail: { text: "Novos equipamentos na mochila!", phase },
      }),
    );
    return true;
  }
  function find(id) {
    if (!items.some((i) => i.id === id) || memory.found.includes(id))
      return false;
    memory.found.push(id);
    write();
    document.dispatchEvent(
      new CustomEvent("guardiao:descoberta", {
        detail: { text: items.find((i) => i.id === id).name + " encontrada!" },
      }),
    );
    return true;
  }
  function phaseUniform(phase) {
    return (
      { 2: "protecao", 3: "resgate", 4: "plantio", 5: "voluntario" }[phase] ||
      "explorador"
    );
  }
  function uniform(id, { required = false } = {}) {
    const phase = Number(document.body.dataset.phase || 0);
    if (!required || id !== phaseUniform(phase) || !hasUniform(id))
      return false;
    memory.uniform = id;
    write();
    return true;
  }
  function record(phase, objectives, { completed = false, ...extra } = {}) {
    memory.phases[phase] = {
      ...memory.phases[phase],
      objectives: structuredClone(objectives),
      ...extra,
      completed: completed || memory.phases[phase]?.completed === true,
    };
    write();
  }
  function equip(id) {
    if (!has(id)) return false;
    document.dispatchEvent(
      new CustomEvent("guardiao:equipar", { detail: { id } }),
    );
    return true;
  }
  window.addEventListener("storage", (e) => {
    if ([KEY, "guardiao.mapa.progresso.v1"].includes(e.key)) {
      hydrate();
      document.dispatchEvent(
        new CustomEvent("guardiao:memoria", { detail: read() }),
      );
    }
  });
  window.GuardiaoMemoria = Object.freeze({
    read,
    phaseUniform,
    grant,
    find,
    has,
    hasUniform,
    uniform,
    record,
    equip,
    obtained,
    items,
    uniforms,
    crystals,
  });
})();
