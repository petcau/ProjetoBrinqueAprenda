// ============================================================================
//  CATALOGO DO ACERVO - fonte unica de verdade do portal
// ============================================================================
//
//  Tudo que o portal mostra sai daqui: as rotas, os cards da home, as fichas
//  dos jogos, as paginas de turma e os creditos. Nao existe nenhuma outra
//  lista para manter em dia.
//
//  PARA PUBLICAR UM JOGO NOVO, veja o passo a passo em src/dados/MODELO.md
//
//  Um jogo pode ter sido feito de duas formas, e o portal aceita as duas:
//
//    tipo: 'estatico'  HTML, CSS e JS puro. Os arquivos ficam em
//                      public/<semestre>/<NomeDoJogo>/ e sao servidos como
//                      estao, dentro de um iframe. O campo "entrada" aponta
//                      para o index.html do jogo.
//
//    tipo: 'react'     Componente React. Os arquivos ficam em
//                      src/jogos/<semestre>/<NomeDoJogo>/. O campo "carregar"
//                      e um import dinamico: o jogo so e baixado quando
//                      alguem abre a pagina dele.
//
// ============================================================================

export const TURMAS = [
  {
    semestre: "2025.2",
    disciplina: 'Web1',
    curso: 'Engenharia de Software',
    periodo: "agosto a dezembro de 2025",
    jogos: [
      {
        slug: "recicla-kids",
        categorias: ['natureza'],
        titulo: "ReciclaKids",
        subtitulo: "Ajude o Márcio a limpar o planeta e salvar a natureza!",
        sinopse: "Uma aventura ecológica onde aprender sobre coleta seletiva se torna uma missão divertida para salvar o meio ambiente.",
        descricao: "O nosso planeta precisa de ajuda, e Márcio tem uma missão super importante! Em Recicla Kids, os pequenos exploradores vão viajar por vários cenários repletos de desafios ecológicos. Para deixar tudo limpinho, as crianças precisam controlar o Márcio e recolher os lixos espalhados, descobrindo o lugar certo de cada um nas latas da coleta seletiva. É a combinação perfeita de ação, conscientização e muita diversão!",
        chamada: "Transforme o aprendizado sobre sustentabilidade em uma jornada inesquecível! Uma forma leve e colorida de formar os defensores da natureza de amanhã.",
        capa: "/capas/recicla-kids.webp",
        dataCriacao: "2025-12",
        publicoAlvo: 'a-partir-4ano',
        habilidades: [
          "Conscientização ecológica",
          "Coleta seletiva",
          "Coordenação motora",
          "Raciocínio rápido"
        ],
        caracteristicas: [
          { icone: "♻️", titulo: "Aprendizado Verde", descricao: "Ensina de forma prática e visual as cores da coleta seletiva (metal, papel, plástico e vidro)." },
          { icone: "🎮", titulo: "Controle Intuitivo", descricao: "Comandos simples e jogabilidade fluida, ideal para o desenvolvimento motor das crianças." },
          { icone: "🌍", titulo: "Cenários Vibrantes", descricao: "Diferentes ambientes que precisam de limpeza, mantendo o visual dinâmico e o engajamento em alta." },
        ],
        autores: [
          "D'Sordes Moreira Alves",
          "Arthur Paiva",
          "Paulo Henrique Lima Ribeiro",
          "José Natalino Neves de Jesus"
        ],
        jogo: { tipo: 'estatico', entrada: "/2025.2/ReciclaKids/index.html" },
      },
      {
        slug: "palavras-magicas",
        categorias: ['portugues'],
        titulo: "Palavras Mágicas",
        subtitulo: "Decifre os enigmas e encontre as letras escondidas pelo reino!",
        sinopse: "Uma jornada encantada de alfabetização onde cada imagem revela um segredo e cada letra correta te deixa mais perto de vencer o desafio.",
        descricao: "No reino das Palavras Mágicas, os pequenos exploradores são convidados a testar seus conhecimentos de escrita de um jeito super divertido! A cada fase, uma imagem misteriosa aparece na tela dentro do cenário do castelo. O objetivo é completar o nome do objeto selecionando as letras corretas que estão flutuando. Mas cuidado: existem letras intrusas misturadas para tentar confundir os jogadores! É preciso atenção e raciocínio para clicar apenas nas letras certas e avançar na aventura.",
        chamada: "A maneira perfeita de treinar a ortografia e o vocabulário de forma leve, visual e cheia de magia!",
        capa: "/capas/palavras-magicas.webp",
        dataCriacao: "2025-12",
        publicoAlvo: 'a-partir-4ano',
        habilidades: [
          "Alfabetização e Ortografia",
          "Associação de imagem e texto",
          "Percepção visual",
          "Raciocínio lógico"
        ],
        caracteristicas: [
          { icone: "🏰", titulo: "Ambiente Encantado", descricao: "Desafios divertidos ambientados em um lindo castelo sob o céu estrelado que prende a atenção das crianças." },
          { icone: "🔤", titulo: "Mecânica de Clique", descricao: "Interface intuitiva onde as letras são clicadas diretamente na tela, ideal para a autonomia dos pequenos sem precisar digitar." },
          { icone: "🧠", titulo: "Desafio de Atenção", descricao: "Letras intrusas que estimulam o foco, a análise crítica e o reconhecimento correto das palavras." },
        ],
        autores: [
          "Gabriele Natividade",
          "Murilo M. Moura",
          "Luciano Souza",
          "Gabriel Souza",
          "Jimy Kael Lins"
        ],
        jogo: { tipo: 'estatico', entrada: "/2025.2/PalavrasMagicas/componentes/index.html" },
      },
      {
        slug: "tesouro-a-vista",
        // Este grava uma chave por mapa (estrelas_ilha, estrelas_caverna...),
        // entao o adaptador trabalha por prefixo em vez de lista fixa.
        progresso: {
          prefixos: ['estrelas_'],
          resumir: (v) => {
            const mapas = Object.entries(v).filter(([, n]) => n != null && n !== '');
            if (!mapas.length) return [];
            const total = mapas.reduce((s, [, n]) => s + (Number(n) || 0), 0);
            return [
              { rotulo: 'Estrelas', valor: total },
              { rotulo: 'Ilhas visitadas', valor: mapas.length },
            ];
          },
        },
        categorias: ['matematica', 'ciencias', 'historia-geografia', 'portugues'],
        titulo: "Tesouro à Vista",
        subtitulo: "Navegue por mundos desconhecidos e desvende os mistérios do conhecimento!",
        sinopse: "Uma incrível jornada de exploração multimaterias onde responder aos enigmas de criaturas mágicas é a chave para encontrar tesouros perdidos.",
        descricao: "Prepare as suas malas para uma expedição inesquecível em Tesouro à Vista! Neste jogo de aventura, os pequenos exploradores viajam por mapas fantásticos e com visuais totalmente únicos, como a Ilha dos Números, a Gruta da Geografia, o Deserto dos Fatos, o Oceano da Ciência e a Floresta das Letras. Em cada um desses cenários, o jogador assume o papel de um aventureiro diferente e interage com criaturas mágicas nativas da região. Para avançar na exploração e desvendar o mapa, as crianças precisam responder a perguntas sobre os mais diversos temas, incluindo história, geografia, ciências e matemática. Uma caça ao tesouro repleta de descobertas!",
        chamada: "O desafio ideal para testar conhecimentos gerais de forma divertida e imersiva, estimulando a curiosidade e o aprendizado interdisciplinar!",
        capa: "/capas/tesouro-a-vista.webp",
        dataCriacao: "2025-12",
        publicoAlvo: 'a-partir-4ano',
        habilidades: [
          "Conhecimentos gerais (Ciências, História e Geografia)",
          "Raciocínio lógico-matemático",
          "Leitura e interpretação de texto",
          "Curiosidade e exploração"
        ],
        caracteristicas: [
          { icone: "🗺️", titulo: "Mapas Temáticos", descricao: "Diversidade de cenários deslumbrantes com identidades visuais próprias que mantêm a exploração sempre nova e interessante." },
          { icone: "🦄", titulo: "Criaturas Mágicas", descricao: "Personagens fantásticos espalhados pelos mundos que interagem com o jogador e propõem desafios educativos instigantes." },
          { icone: "🧭", titulo: "Heróis Variados", descricao: "A cada novo cenário, o jogador assume a pele de um novo personagem, aumentando a imersão e o fator surpresa na jornada." },
        ],
        autores: [
          "Luiza Bittencourt",
          "Marta Gisele Barreto",
          "Mateus Nepomuceno",
          "Nairana Anjos",
          "Tiago Correia"
        ],
        jogo: { tipo: 'estatico', entrada: "/2025.2/TesouroAVista/index.html" },
      },
      {
        slug: "tabuad4on",
progresso: {
          chaves: ['pontuacao-facil', 'pontuacao-medio', 'pontuacao-dificil'],
          resumir: (v) => [
            ['Fácil', v['pontuacao-facil']],
            ['Médio', v['pontuacao-medio']],
            ['Difícil', v['pontuacao-dificil']],
          ]
            .filter(([, p]) => p != null && p !== '')
            .map(([nome, p]) => ({ rotulo: nome, valor: p })),
        },
        categorias: ['matematica'],
        titulo: "Tabuad4on",
        subtitulo: "Seja rápido nos cálculos e domine a tabuada!",
        sinopse: "Um desafio de matemática eletrizante onde você testa sua agilidade e precisão para responder contas de cabeça antes que o tempo acabe.",
        descricao: "Prepare o seu raciocínio rápido para entrar no mundo de tabuad4on! Escolha o seu nível de desafio entre Fácil, Médio ou Difícil e encare uma sequência de perguntas matemáticas. A cada rodada, quatro opções aparecem na tela e você precisa clicar na resposta correta. Mas fique atento: a partir do nível médio, o relógio começa a correr! Para vencer, você precisa ser mais rápido que o cronômetro, pois o jogo termina se o tempo esgotar ou se você errar. Mostre toda a sua habilidade e quebre recordes com a sua pontuação final!",
        chamada: "Uma forma dinâmica e empolgante de praticar a tabuada, estimulando a concentração, a tomada de decisão rápida e o amor pela matemática!",
        capa: "/capas/tabuad4on.webp",
        dataCriacao: "2025-12",
        publicoAlvo: 'a-partir-4ano',
        habilidades: [
          "Cálculo mental e Tabuada",
          "Raciocínio lógico rápido",
          "Foco e Concentração",
          "Tomada de decisão sob pressão"
        ],
        caracteristicas: [
          { icone: "📊", titulo: "Níveis de Dificuldade", descricao: "Opções de jogo no Fácil, Médio e Difícil para acompanhar o ritmo de aprendizado e evolução de cada criança." },
          { icone: "⏱️", titulo: "Desafio Contra o Tempo", descricao: "Um cronômetro dinâmico que adiciona adrenalina e estimula o cérebro a pensar de forma rápida e precisa." },
          { icone: "🏆", titulo: "Placar de Recordes", descricao: "Exibição de pontuação ao final de cada partida para que a criança veja seu progresso e tente se superar a cada tentativa." },
        ],
        autores: [
          "Gilberlan Martins",
          "Luan de Lima Galvão Cunha",
          "Victor Pereira da Silva",
          "Jadislan Santos Pereira",
          "Simão Pedro da Silva dos Santos"
        ],
        jogo: { tipo: 'estatico', entrada: "/2025.2/Tabuad4on/index.html" },
      },
      {
        slug: "matemagica",
progresso: {
          chaves: ['jogadoresMatemagica'],
          resumir: (v) => {
            const js = JSON.parse(v.jogadoresMatemagica || '[]');
            if (!js.length) return [];
            return [{ rotulo: 'Última partida', valor: js.length + (js.length === 1 ? ' jogador' : ' jogadores') }];
          },
        },
        categorias: ['matematica'],
        titulo: "Matemágica",
        subtitulo: "Trilhe o caminho do tabuleiro e use a magia dos números para chegar ao castelo!",
        sinopse: "Uma divertida disputa em formato de jogo de tabuleiro onde lançar os dados e acertar os desafios matemáticos te guiará até a grande vitória.",
        descricao: "Entre em um reino de fantasia onde a matemática é a sua maior aliada! Em Matemágica, os jogadores mergulham em um incrível tabuleiro medieval com 34 casas repletas de surpresas. É possível jogar sozinho ou reunir a turma em grupos de até 4 crianças para ver quem avança mais rápido. Cada jogador escolhe o seu próprio avatar para representá-lo nessa jornada: um sábio Mago, um bravo Cavaleiro, uma destemida Princesa ou uma criativa Fada. Para caminhar pelo mapa, basta lançar os dados e responder corretamente às perguntas matemáticas que surgem no caminho. Acelere o passo, supere os desafios e seja o primeiro a alcançar o Castelo da Chegada!",
        chamada: "Uma experiência lúdica e cooperativa ideal para unir os amigos, praticar operações matemáticas e transformar o aprendizado em um divertido jogo de estratégia!",
        capa: "/capas/matemagica.webp",
        dataCriacao: "2025-12",
        publicoAlvo: 'a-partir-4ano',
        habilidades: [
          "Raciocínio lógico-matemático",
          "Resolução de problemas",
          "Socialização",
          "Estratégia e contagem"
        ],
        caracteristicas: [
          { icone: "🎲", titulo: "Tabuleiro Clássico", descricao: "Mecânica tradicional de trilha interativa guiada por dados que gera grande engajamento e diversão para o público infantil." },
          { icone: "🧙‍♂️", titulo: "Personagens de Fantasia", descricao: "Escolha entre Mago, Cavaleiro, Princesa ou Fada, incentivando a imaginação e a identificação das crianças com seus avatares." },
          { icone: "👥", titulo: "Modo Multijogador", descricao: "Permite partidas individuais ou em grupos de até 4 participantes, estimulando a competição saudável ou a cooperação em sala de aula." },
        ],
        autores: [
          "Letícia Veras",
          "Laurinete Xavier",
          "Caick Ruan",
          "Pedro Sérgio de Souza"
        ],
        jogo: { tipo: 'estatico', entrada: "/2025.2/Matemagica/index.html" },
      },
      {
        slug: "mathrace",
// O jogo grava em chaves proprias, criadas antes dos perfis existirem.
        // O adaptador so traduz o que ja esta la; nada no jogo foi alterado.
        progresso: {
          chaves: ['Placar', 'MapasDesbloqueados', 'Nome'],
          resumir: (v) => {
            const placar = JSON.parse(v.Placar || '[]');
            const mapas = JSON.parse(v.MapasDesbloqueados || '{}');
            const abertos = Object.values(mapas).filter(Boolean).length;
            return [
              placar[0] && { rotulo: 'Melhor pontuação', valor: placar[0].pontuacao },
              abertos > 1 && { rotulo: 'Pistas liberadas', valor: abertos + ' de ' + Object.keys(mapas).length },
            ].filter(Boolean);
          },
        },
        categorias: ['matematica', 'logica'],
        titulo: "MathRace",
        subtitulo: "Acelere com a matemática e vença essa corrida eletrizante!",
        sinopse: "Um emocionante jogo de corrida onde a velocidade do seu veículo depende totalmente da sua rapidez em resolver cálculos matemáticos.",
        descricao: "Prepare-se para pisar no acelerador no mundo de MathRace! Nesta competição de alta velocidade, o combustível do seu avatar é o seu conhecimento em matemática. A cada problema resolvido corretamente, seu personagem ganha um super impulso e acelera rumo à linha de chegada; mas cuidado, pois errar a resposta fará você desacelerar! Seu grande objetivo é derrotar os 3 competidores controlados pelo sistema e cruzar a linha de chegada em primeiro lugar. Mostre que você é bom de conta e de roda!",
        chamada: "Uma mistura perfeita de adrenalina e aprendizado que estimula o raciocínio rápido e transforma a prática da matemática em uma grande vitória!",
        capa: "/capas/mathrace.webp",
        dataCriacao: "2025-12",
        publicoAlvo: 'a-partir-4ano',
        habilidades: [
          "Cálculo mental rápido",
          "Resolução de problemas sob pressão",
          "Foco e agilidade visual",
          "Tomada de decisão estratégica"
        ],
        caracteristicas: [
          { icone: "🏎️", titulo: "Mecânica de Aceleração", descricao: "Um sistema inovador onde acertar os cálculos matemáticos faz seu personagem correr mais rápido, associando o acerto à recompensa imediata." },
          { icone: "🤖", titulo: "Competidores Inteligentes", descricao: "Enfrente 3 bots do sistema em tempo real, criando uma atmosfera empolgante de disputa e superação para as crianças." },
          { icone: "🚲", titulo: "Modos Desbloqueáveis", descricao: "A cada vitória um novo meio de transporte é liberado: comece a pé e evolua para bicicleta, carro, avião e até barco!" },
        ],
        autores: [
          "Letícia Vitorino de A. Motta",
          "César Andrade G. M. de Sousa",
          "Pedro Luiz Figueiredo Fontes",
          "Leandro Silva Matos"
        ],
        jogo: { tipo: 'estatico', entrada: "/2025.2/MathRace/index.html" },
      },
    ],
  },
  {
    semestre: "2025.1",
    disciplina: 'Web1',
    curso: 'Engenharia de Software',
    periodo: "março a julho de 2025",
    jogos: [
      {
        slug: "anagrama",
        categorias: ['portugues', 'logica'],
        titulo: "Anagrama",
        subtitulo: "Desembaralhe as letras e descubra a palavra misteriosa antes que o tempo acabe!",
        sinopse: "Um empolgante desafio de linguagem e raciocínio onde você precisa reorganizar letras misturadas para formar palavras reais contra o relógio.",
        descricao: "Exercite o seu cérebro e teste o seu vocabulário no divertido mundo do Anagrama! A cada nova fase, o jogo apresenta um conjunto de blocos com letras totalmente embaralhadas na tela. O grande desafio dos pequenos jogadores é usar o raciocínio rápido para descobrir qual é a palavra misteriosa que está escondida ali e organizá-la corretamente. Mas é preciso correr: o jogo conta com um sistema de timing super dinâmico e, se o cronômetro zerar antes de você decifrar o enigma, a partida chega ao fim! Concentre-se, junte as letras e vença o relógio.",
        chamada: "Uma excelente maneira de estimular a ortografia, a agilidade mental e o conhecimento de novas palavras de forma interativa e muito divertida!",
        capa: "/capas/anagrama.webp",
        dataCriacao: "2025-07",
        publicoAlvo: 'a-partir-4ano',
        habilidades: [
          "Alfabetização e Vocabulário",
          "Consciência fonológica e Ortografia",
          "Raciocínio lógico rápido",
          "Foco e gerenciamento de tempo"
        ],
        caracteristicas: [
          { icone: "🔤", titulo: "Desafio de Letras", descricao: "Mecânica instigante que estimula a criança a testar diferentes combinações de sílabas e letras para formar palavras válidas." },
          { icone: "⏱️", titulo: "Sistema de Timing", descricao: "Um relógio regressivo visível na tela que adiciona emoção à partida e incentiva a agilidade no pensamento." },
          { icone: "🕹️", titulo: "Interface Limpa", descricao: "Visual intuitivo com blocos de letras fáceis de visualizar e botões interativos, ideal para a autonomia das crianças." },
        ],
        autores: [
          "Gustavo Mendes",
          "Marco Antônio Dantas",
          "Neemias Vasconcelos",
          "Matheus Oliveira Santos",
          "Hernandes Pereira",
          "Maria Avelino",
          "Joedson Pimentel Jr.",
          "Pablo Santana de Souza",
          "Everton Oliveira"
        ],
        jogo: { tipo: 'react', carregar: () => import('../jogos/2025.1/Anagrama/Anagrama.jsx') },
      },
      {
        slug: "abacomania",
        categorias: ['matematica'],
        titulo: "AbacoMania",
        subtitulo: "Descubra o poder do ábaco e aprenda a contar de um jeito genial!",
        sinopse: "Uma viagem no tempo onde você aprende a usar o instrumento de cálculo mais antigo do mundo para representar números e dominar a matemática.",
        descricao: "Venha se transformar em um mestre dos números com o abacomania! Neste jogo super divertido, as crianças são introduzidas ao incrível universo do ábaco, uma ferramenta milenar usada para fazer contas. O desafio é simples de entender, mas cheio de aprendizado: um número aparece na tela e o jogador precisa usar a lógica para representá-lo movendo as bolinhas do tabuleiro. Cada cor ou posição de bolinha carrega um poder e representa valores diferentes, como 1, 5, 10, 50 e 100. É a combinação perfeita entre história, raciocínio e matemática visual!",
        chamada: "A maneira mais lúdica e prática de entender o sistema de numeração decimal, a composição dos números e exercitar a mente de forma surpreendente!",
        capa: "/capas/abacomania.webp",
        dataCriacao: "2025-07",
        publicoAlvo: 'a-partir-4ano',
        habilidades: [
          "Composição e decomposição numérica",
          "Sistema de numeração decimal",
          "Raciocínio lógico-matemático",
          "Noção de ordens e grandezas (Unidades, Dezenas, Centenas)"
        ],
        caracteristicas: [
          { icone: "🧮", titulo: "Ábaco Interativo", descricao: "Uma versão digital e colorida de um instrumento matemático clássico, facilitando a manipulação e o entendimento prático." },
          { icone: "🔢", titulo: "Valores Posicionais", descricao: "Desafios com bolinhas que valem 1, 5, 10, 50 e 100, ajudando a criança a compreender como grandes números são construídos." },
          { icone: "💡", titulo: "Matemática Visual", descricao: "Transforma números abstratos em algo concreto e visual, tornando o aprendizado muito mais intuitivo e menos intimidador." },
        ],
        autores: [
          "Gustavo Mendes",
          "Marco Antônio Dantas",
          "Neemias Vasconcelos",
          "Matheus Oliveira Santos",
          "Gustavo Ramon Santos",
          "Vítor Gonzaga",
          "Thiago Pereira"
        ],
        jogo: { tipo: 'react', carregar: () => import('../jogos/2025.1/AbacoMania/Abaco.jsx') },
      },
      {
        slug: "digirace",
        categorias: ['portugues', 'tecnologia'],
        titulo: "DigiRace",
        subtitulo: "Seja rápido nos dedos e digite o máximo de palavras que conseguir!",
        sinopse: "Uma corrida contra o relógio onde a sua velocidade de digitação e foco são as chaves para quebrar todos os recordes.",
        descricao: "Prepare os dedos porque a corrida vai começar em Digirace! Neste desafio eletrizante, uma palavra aparece na tela e o jogador precisa digitá-la corretamente o mais rápido que puder. Mas fique muito atento: o relógio não para de contar nem por um segundo! O grande objetivo dos pequenos digitadores é manter a concentração lá no alto para completar o maior número de palavras possíveis dentro do tempo proposto. Cada palavra certa te joga mais para a frente nessa disputa emocionante!",
        chamada: "A combinação perfeita de agilidade e alfabetização, ajudando a dominar o teclado enquanto treina a escrita de forma super divertida!",
        capa: "/capas/digirace.webp",
        dataCriacao: "2025-07",
        publicoAlvo: 'a-partir-4ano',
        habilidades: [
          "Agilidade na digitação (Teclado)",
          "Reconhecimento de letras e palavras",
          "Ortografia e Alfabetização",
          "Foco e gerenciamento de tempo"
        ],
        caracteristicas: [
          { icone: "⌨️", titulo: "Domínio do Teclado", descricao: "Ajuda as crianças a se familiarizarem com a posição das letras no teclado, desenvolvendo a coordenação e a memória motora." },
          { icone: "⏱️", titulo: "Relógio Implacável", descricao: "Um sistema de tempo contínuo que cria uma atmosfera dinâmica de fliperama, incentivando o jogador a ser cada vez mais ágil." },
          { icone: "🏆", titulo: "Desafio de Recordes", descricao: "Estimula a superação pessoal ao desafiar a criança a bater sua própria pontuação máxima a cada nova tentativa." },
        ],
        autores: [
          "Gustavo Mendes",
          "Marco Antônio Dantas",
          "Neemias Vasconcelos",
          "Matheus Oliveira Santos",
          "Eduardo Santos",
          "Gabriel Tolentino",
          "Gustavo Vila Nova Matos",
          "Daniel dos Santos"
        ],
        jogo: { tipo: 'react', carregar: () => import('../jogos/2025.1/JogoDigitacao/Digitacao.jsx') },
      },
      {
        slug: "jornada-dos-bichos",
        categorias: ['ciencias', 'natureza', 'logica'],
        titulo: "Jornada dos Bichos",
        subtitulo: "Ajude os animais a encontrarem seus verdadeiros lares na natureza!",
        sinopse: "Uma divertida aventura de zoologia e ciências onde você explora diferentes habitats e descobre curiosidades sobre o reino animal.",
        descricao: "Prepare-se para viajar pelo mundo e conhecer de perto o reino animal em Jornada dos Bichos! Neste jogo educativo, as crianças exploram lindos cenários como o oceano, a floresta, a savana e a fazenda. O grande desafio dos pequenos biólogos é observar os animais mostrados na tela e arrastar cada um deles até o habitat correto. É preciso ter muita atenção: o jogador precisa de 3 acertos para avançar para a próxima fase, e acumular 3 erros faz perder o nível. Uma jornada fascinante cheia de descobertas da fauna!",
        chamada: "A escolha perfeita para aprender sobre ecologia, características dos animais e habitats naturais de forma visual, interativa e muito empolgante!",
        capa: "/capas/jornada-dos-bichos.webp",
        dataCriacao: "2025-07",
        publicoAlvo: 'a-partir-4ano',
        habilidades: [
          "Ciências e Zoologia básica",
          "Classificação e categorização",
          "Interpretação de pistas e lógica",
          "Coordenação motora fina (Arrastar e soltar)"
        ],
        caracteristicas: [
          { icone: "🌍", titulo: "Habitats Diversificados", descricao: "Cenários coloridos e marcantes que representam ecossistemas reais, ajudando a criança a associar visualmente o bicho à sua casa." },
          { icone: "🕵️‍♂️", titulo: "Pistas Inteligentes", descricao: "Dicas científicas sobre o comportamento e biologia dos animais que estimulam a dedução lógica e expandem o conhecimento geral." },
          { icone: "🔄", titulo: "Mecânica de Arrastar", descricao: "Controles simples de 'arrastar e soltar' os personagens, ideal para o desenvolvimento da precisão motora dos pequenos." },
        ],
        autores: [
          "Gustavo Mendes",
          "Marco Antônio Dantas",
          "Neemias Vasconcelos",
          "Matheus Oliveira Santos",
          "Felipe Dantas Ferreira",
          "Jadson Pereira",
          "Emanuel Bispo",
          "Joabe Borges",
          "Silas Dantas"
        ],
        jogo: { tipo: 'react', carregar: () => import('../jogos/2025.1/JornadaBicho/JornadaBicho.jsx') },
      },
    ],
  },
];

// --- Derivados, para quem consome o catalogo --------------------------------

/** Todos os jogos, de todas as turmas, com a turma embutida em cada um. */
export const JOGOS = TURMAS.flatMap((turma) =>
  turma.jogos.map((jogo) => ({ ...jogo, turma })),
);

/**
 * Categorias do acervo.
 *
 * Servem para o professor achar o que precisa: a barra na home e o filtro em
 * /jogos saem daqui. Um jogo pode estar em mais de uma — o campo  * de cada entrada e uma lista.
 *
 * A ordem aqui e a ordem em que aparecem na tela.
 */
export const CATEGORIAS = [
  {
    slug: 'matematica',
    nome: 'Matemática',
    descricao: 'Desafios, raciocínio e lógica na prática.',
    cor: '#6c3df0',
    fundo: '#f1ecff',
  },
  {
    slug: 'portugues',
    nome: 'Português',
    descricao: 'Leitura, escrita e comunicação.',
    cor: '#e03a73',
    fundo: '#ffecf2',
  },
  {
    slug: 'ciencias',
    nome: 'Ciências',
    descricao: 'Descobertas que transformam o mundo.',
    cor: '#1f9a6a',
    fundo: '#e6f7ef',
  },
  {
    slug: 'logica',
    nome: 'Lógica',
    descricao: 'Pense, resolva e vá além.',
    cor: '#e08a12',
    fundo: '#fff3df',
  },
  {
    slug: 'natureza',
    nome: 'Natureza',
    descricao: 'O planeta, os seres vivos e um futuro melhor.',
    cor: '#2f7fd8',
    fundo: '#e9f2fe',
  },
  {
    slug: 'historia-geografia',
    nome: 'História e Geografia',
    descricao: 'O Brasil, o mundo e quem veio antes.',
    cor: '#b05a22',
    fundo: '#fbeee4',
  },
  {
    slug: 'tecnologia',
    nome: 'Tecnologia',
    descricao: 'Teclado, agilidade e o mundo digital.',
    cor: '#0f8ea8',
    fundo: '#e3f4f9',
  },
];

/** Busca uma categoria pelo slug. */
export const acharCategoria = (slug) => CATEGORIAS.find((c) => c.slug === slug);

/** Quantos jogos existem em cada categoria. */
export const contarPorCategoria = (slug) =>
  JOGOS.filter((j) => j.categorias.includes(slug)).length;


/** Busca um jogo pelo slug da URL. Devolve undefined se nao existir. */
export const acharJogo = (slug) => JOGOS.find((j) => j.slug === slug);

/**
 * O jogo do dia.
 *
 * O sorteio e determinístico pela data: todo mundo ve o mesmo jogo o dia
 * inteiro, e ele troca a meia-noite. Isso importa na escola — a turma toda
 * abre o portal na mesma aula e precisa cair no mesmo jogo.
 *
 * A multiplicacao por um primo grande e so para embaralhar: sem ela os dias
 * seguidos andariam em ordem pelo catalogo (1, 2, 3...), o que nao parece
 * sorteio nenhum.
 */
export function jogoDoDia(data = new Date()) {
  const diaDoAno = Math.floor(
    (data - new Date(data.getFullYear(), 0, 0)) / 86400000,
  );
  const semente = data.getFullYear() * 372 + diaDoAno;
  const misturado = (semente * 2654435761) % 4294967296;
  return JOGOS[misturado % JOGOS.length];
}

/** Busca uma turma pelo semestre. */
export const acharTurma = (semestre) => TURMAS.find((t) => t.semestre === semestre);

/**
 * Cor de cada turma, usada na barrinha que identifica a secao na home.
 * As turmas pegam as cores na ordem em que aparecem; quando a lista acabar,
 * recomeca do inicio. Para uma turma nova nao e preciso escolher nada.
 */
export const ACENTOS = ['#3457a0', '#e1613f', '#2f7d6a', '#f2a93b', '#7a4fa3'];

/** Rotulos legiveis para os codigos de publico-alvo. */
export const PUBLICOS = {
  'a-partir-4ano': 'A partir do 4º ano do Ensino Fundamental',
};

/** Versao curta, para os selos dos cards. */
export const PUBLICOS_CURTO = {
  'a-partir-4ano': 'A partir do 4º ano',
};

/** "2025-12" vira "dezembro de 2025". */
export function formatarData(iso) {
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const [ano, mes] = String(iso).split('-');
  return mes ? meses[Number(mes) - 1] + " de " + ano : ano;
}
