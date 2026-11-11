(() => {
  'use strict';

  // Reading time is shared by the introduction and the reflections between worlds.
  function readingTime(text) {
    return Math.max(7, 3 + text.trim().split(/\s+/).length / 2.3);
  }

  function scene(name, world, motion, action, texts, extra = {}) {
    let cursor = 0;
    const lines = texts.map(text => {
      const line = ['PIXEL', text, cursor];
      cursor += readingTime(text);
      return line;
    });
    return Object.freeze({ name, world, motion, action, lines, duration: cursor, ...extra });
  }

  const opening = [
    scene('Mais um show em OrbitHop', 'concert', 'show',
      'No palco elevado, Pixel agradece. A multidão acena e ergue luzes atrás das grades.', [
        'OrbitHop! Vocês fizeram este show brilhar! Obrigado por cada voz, cada sorriso e cada batida!',
        'Nossa música continua com vocês. Até o próximo show, meu povo!'
      ]),
    scene('O último acorde', 'concert', 'exit',
      'As luzes do palco se apagam aos poucos. Pixel acena uma última vez e caminha para os bastidores.', [
        'Que noite fantástica... Agora, um descanso no camarim e depois eu vou para casa.'
      ]),
    scene('Um silêncio diferente', 'backstage', 'walk',
      'Pixel atravessa o backstage. As luzes da passagem ficam mais suaves e o som da plateia se afasta.', [
        'Engraçado... Este corredor sempre parece tão acolhedor. Por que hoje está diferente?',
        'Talvez eu só esteja cansado. Mesmo assim... minha intuição não para de me chamar.'
      ]),
    scene('Algo fora do compasso', 'dressing', 'rest',
      'No camarim, Pixel percebe uma mudança na atmosfera. A guitarra repousa no suporte.', [
        'Tem alguma coisa errada em OrbitHop. Eu sinto... mas não sei dizer o quê.',
        'Espera. Esse som está vindo da minha guitarra?'
      ]),
    scene('Uma vibração estranha', 'dressing', 'guitar',
      'A guitarra vibra e emite notas desafinadas. Pixel se aproxima e a pega com cuidado.', [
        'Você também está sentindo isso, parceira? Calma... vamos afinar essas notas.',
        'Vai ficar tudo bem. Deve haver uma explicação...'
      ]),
    scene('O ritmo foge das mãos', 'dressing', 'surge',
      'Ao tocar na guitarra, Pixel libera ondas irregulares sem querer. Circuitos luminosos cercam seu corpo.', [
        'Eu não fiz isso! Nos shows, eu escolho cada acorde... Por que meu poder não me obedece?',
        'As notas estão se atropelando! Parece que vou entrar em curto-circuito!',
        'Essa sensação... eu já ouvi algo sobre isso. Uma força maior... tão familiar...'
      ]),
    scene('Sem chão', 'dressing', 'levitate',
      'Pixel começa a levitar com a guitarra. Um portal de bordas quebradas e aura escura surge diante dele.', [
        'Meus pés... estão saindo do chão! Não consigo conter essa energia!',
        'Esse portal está diferente. Eu não escolhi abri-lo!'
      ], { corrupted: true }),
    scene('Um destino desconhecido', 'dressing', 3,
      'O portal anômalo puxa Pixel e a guitarra. Ele é absorvido em direção a um destino desconhecido.', [
        'Segura firme, parceira! OrbitHop... eu vou encontrar o caminho de volta!'
      ], { corrupted: true }),
    scene('Entre um mundo e outro', 'tunnel', 4,
      'Pixel atravessa o túnel entre realidades, tentando entender o que aconteceu.', [
        'O camarim sumiu... Para onde estou indo? Por que meu próprio ritmo ficou assim?'
      ]),
    scene('Tem alguém chegando!', 'candy', 5,
      'A saída anômala se abre sobre o Reino dos Doces. Pixel é arremessado e a guitarra escapa.', [
        'Aaaah! Onde fica o freio?!'
      ], { corrupted: true }),
    scene('Pof! Uma aterrissagem doce', 'candy', 6,
      'Pixel cai sentado numa nuvem macia de açúcar. A guitarra quica e para ao lado dele.', [
        'Pof! Estou inteiro... Mas que lugar é este? Até a minha roupa mudou!',
        'OrbitHop não é assim. Como vim parar neste mundo?'
      ], { corrupted: true }),
    scene('Um passinho de cada vez', 'candy', 7,
      'Pixel apoia a mão, se levanta e tira o açúcar da roupa. Ele vê a guitarra no chão.', [
        'Primeiro, levantar. Depois, entender essa confusão... Minha guitarra! Já vou te buscar.'
      ]),
    scene('Parceiros de novo', 'candy', 8,
      'Pixel se abaixa, pega a guitarra, coloca a correia e ajeita o instrumento.', [
        'Vem cá, parceira. Se ainda conseguimos tocar, talvez possamos encontrar uma saída.'
      ]),
    scene('Uma primeira pista', 'candy', 9,
      'Pixel se recompõe e escuta a melodia daquele mundo antes de tocar um acorde.', [
        'Tudo aqui parece seguir uma batida. Será que meu poder consegue se alinhar com ela?',
        'Preciso descobrir como sair daqui e voltar para casa. Vamos começar por este ritmo.'
      ])
  ];

  const reflections = [
    [
      'Conseguimos acompanhar este mundo... Mas onde eu estou? O que aconteceu no camarim?',
      'Eu preciso sair daqui e encontrar OrbitHop. Se a música abriu um caminho, vou seguir em frente.'
    ],
    [
      'Agora eu me lembro melhor. A guitarra vibrou antes de eu tocar... e meu poder explodiu sozinho.',
      'Aquelas bordas escuras... Será que uma anomalia corrompeu os portais? Preciso entender de onde ela veio.'
    ],
    [
      'Já consigo canalizar minha energia outra vez. Ainda há notas que tremem... mas consigo senti-las.',
      'Meu poder continua instável. Cada novo ritmo parece ajudá-lo a encontrar o compasso.'
    ],
    [
      'Outro mundo ficou para trás, e meu lar ainda está longe. Não posso parar agora.',
      'Vou atravessar quantos mundos forem precisos. Um acorde, um passo e um portal de cada vez.'
    ],
    [
      'O que desestabilizou a linha temporal dos portais? Por que todo o meu ritmo saiu do lugar?',
      'Essa energia está mudando desde o camarim... O que teria força para causar uma transformação assim?'
    ],
    [
      'Talvez eu esteja fazendo a pergunta errada. E se não for apenas o que aconteceu... mas quem está por trás disso?',
      'Quem poderia alcançar tantos mundos? O que essa presença quer de mim... ou de OrbitHop?'
    ],
    [
      'Eu me lembro da promessa que fiz ao meu povo. Proteger OrbitHop, mesmo quando a ameaça parecer grande demais.',
      'Cada luz naquela plateia era alguém com sonhos, histórias e um lugar para chamar de lar.',
      'É por eles que eu sigo. Minha coragem pode tremer... minha promessa continua de pé. Eu vou voltar.'
    ],
    [
      'Quando eu era pequeno, ouvi histórias sobre um inimigo de muitos mundos e realidades. O Devorador de Mundos.',
      'Diziam que ele anunciava o vazio, a escuridão e o fim. Mas... não seria apenas uma lenda?',
      'Uma sombra apagada da história... Como era mesmo o nome dele?'
    ],
    [
      'Se aquelas histórias forem verdadeiras, talvez eu esteja caminhando para a maior batalha da minha vida.',
      'Tenho medo. Mas também tenho tudo o que aprendi nestes mundos. Preciso me preparar para proteger meu povo.',
      'Salvar a mim, salvar OrbitHop... Essa é a direção que escolho. Vamos em frente.'
    ],
    [
      'Essa sombra... Eu me lembro! O nome que faltava... Galactus. Galactus, O Devorador de Mundos!',
      'Espera... Meu poder se manifestou antes do primeiro portal. Depois, cada ritmo o tornou mais forte e mais estável.',
      'Não foi um acidente. E não foi a corrupção dele que me trouxe até aqui... Foi meu próprio poder!',
      'Ele me afastou do perigo para se reequilibrar. A balança precisava de uma força capaz de enfrentar o que estava chegando.',
      'Todos estes mundos... foram minha preparação. Minha intuição estava tentando me proteger, mesmo quando eu não conseguia entendê-la.',
      'Agora eu entendo. Levo cada lição, cada desafio e toda a minha coragem. OrbitHop... estou voltando para libertar você.'
    ]
  ].map((lines, index) => Object.freeze({
    chapter: index + 1,
    title: index === 9 ? 'As peças se encaixam' : 'O que este mundo me ensinou',
    lines: Object.freeze(lines),
    memory: index === 9,
    destination: index === 9 ? null : index + 2
  }));

  window.RR_NARRATIVE = Object.freeze({ readingTime, opening: Object.freeze(opening), reflections: Object.freeze(reflections) });
})();
