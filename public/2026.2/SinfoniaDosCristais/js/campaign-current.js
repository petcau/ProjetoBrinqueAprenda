/* Modular Campaign & Challenge Registry (v2).
 * Challenges (pieces, values, equations, goals) are strictly decoupled from
 * Scene & True Pixel Art Animations (scene ID, whispers, landmarks, restoration waves).
 * To change any level's challenge in the future without touching animations,
 * edit WORLD_CHALLENGES below or call window.CrystalChallenges.updateChallenge(id, spec).
 */
(() => {
  'use strict';

  // === 1. DECLARATIVE CHALLENGE BUILDERS (EASY TO EDIT) ===
  const piece = (kind, value, x, y, dark = false, seedGroup = null) => ({ kind, value, x, y, dark, seedGroup });
  const quartz = (v, x, y, dark = false, group = null) => piece('quartz', v, x, y, dark, group);
  const opal = (v, x, y) => piece('opal', v, x, y, false, null);
  const shadow = (kind, values, group = null) => values.map((v, i) => piece(kind, v, 0.67 + i * 0.1, 0.66, true, group));

  // Pattern A: Fuse two Quartzos (a + b), subtract a Fire Opal (- fire), and annul the resulting Shadow (a + b - fire)
  const basicFusionAndSubtraction = (a, b, fire) => ({
    pieces: [quartz(a, 0.2, 0.35), quartz(b, 0.4, 0.35), opal(fire, 0.6, 0.35), quartz(a + b - fire, 0.78, 0.65, true)]
  });

  // Pattern B: Connect luminous crystals into an ordered Crystalline Equation and annul the matching Shadow Equation
  const equationMatch = (values, kind = 'quartz') => ({
    pieces: [...values.map((v, i) => piece(kind, v, 0.18 + i * 0.13, 0.34)), ...shadow(kind, values, 'target')]
  });

  // Pattern C: Fuse first two Quartzos (a + b), connect to third Quartz (c), and annul Shadow Equation [a + b, c]
  const fuseThenConnect = (a, b, c) => ({
    pieces: [quartz(a, 0.16, 0.27), quartz(b, 0.34, 0.27), quartz(c, 0.52, 0.27), ...shadow('quartz', [a + b, c], 'target')]
  });

  // Pattern D: Subtract Fire Opal (fire) from largest Quartz (a), connect to second Quartz (b), and annul Shadow Equation [a - fire, b]
  const subtractThenConnect = (a, fire, b) => ({
    pieces: [quartz(a, 0.18, 0.3), opal(fire, 0.35, 0.3), quartz(b, 0.52, 0.3), ...shadow('quartz', [a - fire, b], 'target')]
  });

  // Pattern E: Divide Citrine or cut Aquamarine into parts (optionally boosting through Emerald portal)
  const divideAndMatch = (kind, value, parts, boost = false) => ({
    pieces: [piece(kind, value, 0.22, 0.38), ...shadow(kind, Array(parts).fill((value / parts) * (boost ? 2 : 1)))],
    split: parts,
    ...(boost ? { portals: [{ x: 0.48, y: 0.5 }] } : {})
  });

  // === 2. SCENE & ANIMATION METADATA (FIXED — REMAINS UNCHANGED WHEN CHALLENGES ARE EDITED) ===
  const SCENE_ANIMATION_META = {
    1: {
      scene: 'C1',
      landmark: 'door-outcrop',
      doorVisible: true,
      whispers: [
        '“...Arraste um Quartzo sobre o outro para somar seus brilhos...”',
        '“...Leve a Opala de Fogo até o Quartzo para reduzir o excesso...”',
        '“...Una o cristal luminoso à sua sombra igual para despertar a rocha!...”'
      ]
    },
    2: {
      scene: 'C2',
      landmark: 'twin-fountains',
      doorVisible: false,
      whispers: [
        '“...Toque em um cristal e depois no outro para conectá-los em equação...”',
        '“...Não arraste um sobre o outro... mantenha-os ligados pela linha roxa!...”',
        '“...Arraste a alça da equação até a equação sombria igual!...”'
      ]
    },
    3: {
      scene: 'C3',
      landmark: 'subterranean-lake',
      doorVisible: false,
      whispers: [
        '“...A ordem das pedras importa no espelho das águas...”',
        '“...Conecte os três Quartzos na mesma sequência da sombra...”',
        '“...Se errar uma conexão, use um Diamante para desfazer!...”'
      ]
    },
    4: {
      scene: 'C4',
      landmark: 'ancient-geode',
      doorVisible: false,
      specialHarmony: true,
      whispers: [
        '“...O grande geodo pede três brilhos ao lado de um...”',
        '“...Primeiro arraste para fundir... depois clique para conectar!...”',
        '“...Sinta a fenda luminosa abrir o coração mineral!...”'
      ]
    },
    5: {
      scene: 'C5',
      landmark: 'ceiling-prison',
      doorVisible: true,
      boss: true,
      whispers: [
        '“...Estou presa no cristal do alto... Use a Opala para ajustar o Quartzo maior...”',
        '“...Conecte as duas peças restantes na ordem da sombra...”',
        '“...Anule a prisão sombria e liberte minha voz para a Porta Ancestral!...”'
      ]
    }
  };

  // === 3. EDITABLE LEVEL CHALLENGES (CHANGE NUMBERS OR PIECES HERE AT ANY TIME) ===
  const LEVEL_CHALLENGES = [
    // --- MUNDO 1: CAVERNA (FASES 1 A 5) ---
    {
      id: 1,
      name: 'O despertar',
      hint: 'Arraste os Quartzos para juntá-los. Arraste a Opala até o Quartzo. Depois una a luz à sombra igual.',
      goals: ['Fundir os Quartzos e usar a Opala', 'Anular o cristal sombrio', 'Despertar o afloramento da Porta'],
      ...basicFusionAndSubtraction(1, 1, 1)
    },
    {
      id: 2,
      name: 'Galeria dos ecos',
      hint: 'Toque num cristal e depois no outro para conectar. Não arraste um sobre o outro. Leve a equação até a sombria.',
      goals: ['Conectar os Quartzos em equação', 'Corresponder à equação sombria', 'Fazer as fontes voltarem a jorrar'],
      ...equationMatch([1, 2])
    },
    {
      id: 3,
      name: 'Lago subterrâneo',
      hint: 'Monte as peças na mesma ordem da equação sombria e anule o conjunto.',
      goals: ['Ordenar os três Quartzos', 'Anular a equação sombria', 'Iluminar o lago subterrâneo'],
      ...equationMatch([2, 1, 3])
    },
    {
      id: 4,
      name: 'Jardim mineral',
      hint: 'Prepare um Quartzo com três brilhos e conecte-o ao Quartzo com um brilho. Observe a ordem da sombra.',
      goals: ['Fundir Quartzos para formar 3 brilhos', 'Conectar à peça de 1 brilho', 'Abrir o geodo ancestral'],
      ...fuseThenConnect(1, 2, 1)
    },
    {
      id: 5,
      name: 'O sussurro da fada',
      hint: 'Use a Opala para reduzir o Quartzo maior. Conecte as duas peças restantes na ordem da sombra.',
      goals: ['Reduzir o Quartzo maior com a Opala', 'Conectar na ordem [3, 2]', 'Libertar a Fada das Gemas'],
      ...subtractThenConnect(4, 1, 2)
    },

    // --- MUNDO 2: FLORESTA (FASES 6 A 10) ---
    {
      id: 6,
      name: 'Clareira das cinzas',
      hint: 'A Esmeralda duplica uma peça apenas uma vez. Atravesse o portal e encontre a sombra.',
      pieces: [quartz(2, 0.22, 0.42), quartz(4, 0.78, 0.42, true)],
      portals: [{ x: 0.5, y: 0.42 }]
    },
    {
      id: 7,
      name: 'Trilha das sementes',
      hint: 'Use Dividir e chacoalhe o Citrino, ou selecione-o e pressione Q. Cada parte encontra sua sombra.',
      ...divideAndMatch('citrine', 6, 3)
    },
    {
      id: 8,
      name: 'Ponte das raízes',
      hint: 'Divida o Citrino. Passe cada parte pela Esmeralda antes de anular.',
      ...divideAndMatch('citrine', 4, 2, true)
    },
    {
      id: 9,
      name: 'Refúgio da onça',
      hint: 'Duplique o Quartzo com dois brilhos, depois conecte-o ao outro Quartzo e encontre a equação sombria.',
      pieces: [quartz(2, 0.2, 0.3), quartz(1, 0.2, 0.7), ...shadow('quartz', [4, 1], 'target')],
      portals: [{ x: 0.43, y: 0.3 }]
    },
    {
      id: 10,
      name: 'Coração da floresta',
      hint: 'Divida o Citrino em três partes. Duplique cada parte antes de montar a equação.',
      pieces: [piece('citrine', 6, 0.2, 0.3), ...shadow('citrine', [4, 4, 4], 'target')],
      split: 3,
      portals: [{ x: 0.46, y: 0.32 }]
    },

    // --- MUNDO 3: RIO DAS ÁGUAS CLARAS (FASES 11 A 15) ---
    {
      id: 11,
      name: 'Margem esquecida',
      hint: 'Iguale os valores em cima e embaixo da plataforma de fração. Ao brilhar em rosa, clique para quebrar e dividir!',
      pieces: [piece('aqua', 2, 0.22, 0.38), piece('aqua', 2, 0.45, 0.38), piece('aqua', 1, 0.75, 0.65, true)]
    },
    {
      id: 12,
      name: 'Remanso das frações',
      hint: 'Monte a fração igualando os termos com peças de unidades diferentes. Clique na fração brilhante para dividir!',
      pieces: [piece('aqua', 4, 0.2, 0.35), piece('aqua', 2, 0.38, 0.35), piece('aqua', 2, 0.54, 0.35), piece('aqua', 1, 0.78, 0.65, true)]
    },
    {
      id: 13,
      name: 'Travessia das ilhas',
      hint: 'Divida na plataforma de fração para obter o cristal unitário, depois conecte em Equação Cristalina!',
      pieces: [piece('aqua', 3, 0.18, 0.3), piece('aqua', 3, 0.36, 0.3), quartz(2, 0.54, 0.3), piece('aqua', 1, 0.7, 0.7, true, 'target'), quartz(2, 0.85, 0.7, true, 'target')]
    },
    {
      id: 14,
      name: 'Nascentes escondidas',
      hint: 'Use a Opala de Fogo para subtrair, iguale os termos da fração para quebrar e anule a sombra!',
      pieces: [quartz(5, 0.18, 0.3), opal(1, 0.35, 0.3), quartz(4, 0.52, 0.3), quartz(1, 0.78, 0.65, true)]
    },
    {
      id: 15,
      name: 'Canto das cascatas',
      hint: 'Ouça o canto das 5 notas cristalinas e repita a sequência melódica com a fada do rio!',
      pieces: [piece('aqua', 1, 0.15, 0.4), piece('emerald', 1, 0.32, 0.4), piece('citrine', 1, 0.5, 0.4), piece('opal', 1, 0.68, 0.4), piece('rose', 1, 0.85, 0.4)]
    },

    // --- MUNDO 4: CAATINGA (FASES 16 A 20) ---
    {
      id: 16,
      name: 'O despertar do deserto & o círculo sagrado',
      hint: 'Arraste um cristal unitário até o Círculo Elétrico para cristalizá-lo e anule a sombra.',
      ...basicFusionAndSubtraction(2, 3, 2)
    },
    {
      id: 17,
      name: 'Quadriláteros & a ordem dos fatores',
      hint: 'Conecte dois cristais em uma Equação Cristalina antes de entrar no Quadrado ou Retângulo Elétrico. A ordem define a cor da borda e do núcleo!',
      ...subtractThenConnect(5, 2, 1)
    },
    {
      id: 18,
      name: 'A arte do encaixe (tesselação)',
      hint: 'Encaixe dois Quadrados idênticos para formar um Retângulo, ou dois Triângulos para formar um Losango!',
      ...divideAndMatch('citrine', 9, 3, true)
    },
    {
      id: 19,
      name: 'Geometria avançada & equações aninhadas',
      hint: 'Una um Trapézio e um Triângulo em um Pentágono, ou conecte formas geométricas prontas dentro de uma Equação Aninhada.',
      pieces: [piece('aqua', 1, 0.18, 0.3), quartz(2, 0.43, 0.3), piece('aqua', 0.25, 0.85, 0.28, true), piece('aqua', 0.75, 0.66, 0.7, true, 'target'), quartz(2, 0.83, 0.7, true, 'target')]
    },
    {
      id: 20,
      name: 'O santuário da caatinga & o desafio das areias',
      hint: 'Tessele 6 Triângulos no Hexágono Solar, resolva a Grande Equação e vença o Desafio das Areias para despertar a Opala de Fogo!',
      pieces: [quartz(3, 0.16, 0.3), opal(1, 0.31, 0.3), piece('aqua', 0.5, 0.2, 0.73), quartz(4, 0.68, 0.72, true, 'target'), piece('aqua', 0.5, 0.83, 0.72, true, 'target')],
      portals: [{ x: 0.47, y: 0.3 }]
    }
  ];

  const worlds = [
    { name: 'Caverna', subtitle: 'O despertar', healed: 'A Fada das Gemas está livre. A jornada pelas gemas primordiais começa.', x: 5, y: 0, gem: 'fairy' },
    { name: 'Floresta', subtitle: 'O coração da terra', healed: 'As folhas e os sons voltam à floresta.', x: 60, y: 0, gem: 'emerald' },
    { name: 'Rio das Águas Claras', subtitle: 'O canto das nascentes', healed: 'A correnteza recupera sua transparência e sua vida.', x: 60, y: 88, gem: 'paraiba' },
    { name: 'Caatinga', subtitle: 'O florescer do sertão', healed: 'A água retorna às cacimbas e a Caatinga floresce.', x: 0, y: 88, gem: 'fire-opal' }
  ];

  function compileLevel(l, index) {
    const id = l.id || index + 1;
    const world = Math.floor((id - 1) / 5);
    const meta = SCENE_ANIMATION_META[id] || {};
    const pieces = l.pieces || [];
    return {
      ...l,
      id,
      world,
      scene: meta.scene || ['C', 'F', 'R', 'S'][world] + (((id - 1) % 5) + 1),
      landmark: meta.landmark || null,
      doorVisible: !!meta.doorVisible,
      specialHarmony: !!meta.specialHarmony,
      whispers: l.whispers || meta.whispers || [],
      boss: (id - 1) % 5 === 4,
      kind: 'crystalline',
      tools: [
        'drag',
        ...(pieces.some(p => p.kind === 'aqua') ? ['cut'] : []),
        ...(pieces.some(p => p.kind === 'citrine') ? ['shake'] : [])
      ],
      goals: l.goals || ['Preparar os cristais', 'Recuperar a ressonância', 'Anular todos os cristais']
    };
  }

  function rebuildCampaign() {
    window.CrystalCampaign.worlds = worlds;
    window.CrystalCampaign.levels = LEVEL_CHALLENGES.map((l, i) => compileLevel(l, i));
    window.CrystalCampaign.levels.push({
      id: 21,
      name: 'A porta das gemas',
      world: 0,
      scene: 'C5',
      landmark: 'ancient-door-final',
      doorVisible: true,
      boss: true,
      final: true,
      kind: 'crystalline',
      hint: 'As quatro gemas primordiais respondem juntas. Prepare-se para o canto final.',
      whispers: ['“...As quatro Gemas Primordiais cantam juntas na Porta Ancestral!...”'],
      pieces: [],
      tools: ['drag'],
      goals: ['Reunir as quatro gemas', 'Abrir a porta', 'Restaurar a última ressonância']
    });
  }

  rebuildCampaign();

  // Public API to easily modify any level's challenge at runtime or in configuration without altering animations
  window.CrystalChallenges = {
    builders: {
      piece,
      quartz,
      opal,
      shadow,
      basicFusionAndSubtraction,
      equationMatch,
      fuseThenConnect,
      subtractThenConnect,
      divideAndMatch
    },
    getLevelChallenge(id) {
      return LEVEL_CHALLENGES.find(l => l.id === id) || null;
    },
    updateChallenge(id, patch) {
      const idx = LEVEL_CHALLENGES.findIndex(l => l.id === id);
      if (idx === -1) return false;
      LEVEL_CHALLENGES[idx] = { ...LEVEL_CHALLENGES[idx], ...patch, id };
      rebuildCampaign();
      return window.CrystalCampaign.levels[idx];
    }
  };
})();
