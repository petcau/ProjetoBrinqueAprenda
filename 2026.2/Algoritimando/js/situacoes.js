/* ============================================================
   situacoes.js — os chamados que já vêm no jogo.
   Usam EXATAMENTE o mesmo formato que o editor do professor
   gera e salva em .json. Um formato só, nunca dois: nenhum
   campo daqui é especial — tudo pode ser criado no editor.

   Os quatro chamados originais (contam para a promoção):
     SITUACAO_SANDUICHE  cotidiano doméstico (5 fases, 3→8 passos)
     SITUACAO_ROBO       mundo da máquina    (5 fases, 3→8 passos)
     SITUACAO_MOCHILA    rotina escolar      (4 fases, 3→8 passos)
     SITUACAO_ABELHAS    natureza            (4 fases, 3→8 passos)

   Os chamados novos (repetição, condição e caminhos paralelos)
   ficam depois deles, com a sua própria explicação.

   O que vem abaixo vale para os quatro originais:

   Os campos visuais (local, cor, cliente, cena, fundo,
   fundoConclusao) são opcionais e estão descritos no motor.js.
   As ilustrações das cartas (img/passos/) ainda não existem: a
   carta mostra o quadro "ilustração do passo" até o arquivo
   chegar. A lista do que desenhar está em IMAGENS.md.

   A dificuldade cresce de propósito: a cada fase os passos
   ficam mais detalhados, para expor as etapas que a gente
   normalmente pula quando fala com outra pessoa — e que uma
   máquina não consegue adivinhar.

   Progressão conceitual (aparece na LIÇÃO de cada fase):
     a ordem importa → passos livres × passos presos →
     passos escondidos → o computador não adivinha ("instrução") →
     a ideia ganha nome ("algoritmo") + começo, meio e fim.

   As palavras "algoritmo" e "instrução" NUNCA aparecem nas
   primeiras fases: primeiro a criança vive a ideia, só depois
   a ideia ganha nome.

   Cada passo diz, em dependeDe, de quais outros passos ele precisa
   (ver motor.js). Passos que não dependem um do outro podem trocar
   de lugar: é assim que as ordens alternativas são aceitas.
   ============================================================ */

'use strict';

/* ============================================================
   SITUAÇÃO 1 · FAZER UM SANDUÍCHE
   ============================================================ */

const SITUACAO_SANDUICHE = {
  formato: 'passo-a-passo/1',
  id: 'sanduiche',
  titulo: 'Fazer um sanduíche',
  local: 'Cozinha',
  area: 'casa',
  cor: '#8a5a2b',
  cliente: 'img/who1.webp',
  cena: 'img/pic1.webp',
  fundo: 'img/level1.webp',
  fundoConclusao: 'img/win1.webp',
  // a imagem que se monta ao lado do tabuleiro (ver motor.js)
  montagem: 'pilha',
  fases: [

    /* ---------- FASE 1 · a ordem importa (3 passos) ---------- */
    {
      id: 'fase-1',
      titulo: 'Monte o sanduíche na ordem certa!',
      instrucao: 'Arraste as cartas para os espaços — ou toque na carta e depois no espaço.',
      mascote: 'Cada carta é um passo. Qual precisa acontecer primeiro?',
      passos: [
        { id: 'pao', texto: 'Pegue duas fatias de pão.', imagem: 'img/passos/sanduiche-01.webp', peca: 'img/pecas/sanduiche-pao.webp', dependeDe: [] },
        {
          id: 'queijo', texto: 'Coloque o queijo no pão.', imagem: 'img/passos/sanduiche-02.webp', peca: 'img/pecas/sanduiche-queijo.webp', dependeDe: ['pao'],
          explicacao: 'O queijo vai em cima do pão. Sem pão na mesa, o queijo fica voando!',
        },
        {
          id: 'fechar', texto: 'Feche o sanduíche.', imagem: 'img/passos/sanduiche-04.webp', peca: 'img/pecas/sanduiche-pao-cima.webp', dependeDe: ['queijo'],
          explicacao: 'Fechar o sanduíche agora? O queijo ainda está fora — ele fica sem entrar!',
        },
      ],
      licao: {
        pergunta: 'Por que a ordem dos passos importa?',
        imagem: 'img/licoes/sanduiche-1.webp',
        texto: [
          'Para montar o sanduíche, você colocou os passos em uma ordem.',
          'Se a gente troca os passos de lugar, dá confusão: o queijo pode ficar de fora do sanduíche!',
          'Com a ordem certa, tudo dá certo no final.',
        ],
        reflexao: [
          'O que acontece com o queijo se você fechar o sanduíche antes de colocá-lo?',
          'O que mais você faz no seu dia que só dá certo em uma ordem?',
        ],
      },
    },

    /* ---------- FASE 2 · passos livres e passos presos (4 passos) ---------- */
    {
      id: 'fase-2',
      titulo: 'Agora o sanduíche vai ficar recheado!',
      instrucao: 'Alguns passos podem trocar de lugar entre si. Outros não. Fique de olho!',
      mascote: 'O queijo e o presunto podem trocar de lugar. Os outros, não!',
      passos: [
        { id: 'pao', texto: 'Pegue duas fatias de pão.', imagem: 'img/passos/sanduiche-01.webp', peca: 'img/pecas/sanduiche-pao.webp', dependeDe: [] },
        {
          id: 'queijo', texto: 'Coloque o queijo no pão.', imagem: 'img/passos/sanduiche-02.webp', peca: 'img/pecas/sanduiche-queijo.webp', dependeDe: ['pao'],
          explicacao: 'O queijo vai em cima do pão. Sem pão na mesa, o queijo fica voando!',
        },
        {
          id: 'presunto', texto: 'Coloque o presunto no pão.', imagem: 'img/passos/sanduiche-03.webp', peca: 'img/pecas/sanduiche-presunto.webp', dependeDe: ['pao'],
          explicacao: 'O presunto vai em cima do pão. Sem pão na mesa, o presunto fica voando!',
        },
        {
          id: 'fechar', texto: 'Feche o sanduíche.', imagem: 'img/passos/sanduiche-04.webp', peca: 'img/pecas/sanduiche-pao-cima.webp', dependeDe: ['queijo', 'presunto'],
          explicacao: {
            queijo:   'Para fechar o sanduíche, o queijo já precisa estar dentro. Fechando agora, ele fica de fora!',
            presunto: 'Para fechar o sanduíche, o presunto já precisa estar dentro. Fechando agora, ele fica de fora!',
          },
        },
      ],
      licao: {
        pergunta: 'Todo passo tem uma hora certa?',
        imagem: 'img/licoes/sanduiche-2.webp',
        texto: [
          'O queijo e o presunto podiam entrar em qualquer ordem: um não precisa do outro.',
          'Mas fechar o sanduíche precisa esperar os dois estarem dentro.',
          'Um passo só espera aquilo de que ele precisa — os outros são livres!',
        ],
        reflexao: [
          'Quais cartas podiam trocar de lugar sem estragar nada?',
          'Por que fechar o sanduíche não pode vir antes do recheio?',
        ],
      },
    },

    /* ---------- FASE 3 · os passos escondidos (5 passos) ---------- */
    {
      id: 'fase-3',
      titulo: 'Monte o sanduíche sem esquecer nenhum passo!',
      instrucao: 'Tem passos que a gente faz sem pensar. Não esqueça nenhum!',
      mascote: 'Não dá para usar o que ainda está guardado. Pegue antes de usar!',
      passos: [
        { id: 'pegar-pao',      texto: 'Pegue o saco de pão.', imagem: 'img/passos/sanduiche-05.webp', dependeDe: [] },
        { id: 'pegar-manteiga', texto: 'Pegue a manteiga.',    imagem: 'img/passos/sanduiche-06.webp', dependeDe: [] },
        {
          id: 'abrir-saco', texto: 'Abra o saco e tire duas fatias.', imagem: 'img/passos/sanduiche-07.webp', peca: 'img/pecas/sanduiche-pao.webp', dependeDe: ['pegar-pao'],
          explicacao: 'Para abrir o saco de pão, ele precisa estar na sua mão!',
        },
        {
          id: 'passar', texto: 'Passe a manteiga nas fatias.', imagem: 'img/passos/sanduiche-09.webp', peca: 'img/pecas/sanduiche-manteiga.webp', dependeDe: ['abrir-saco', 'pegar-manteiga'],
          explicacao: {
            'abrir-saco':     'As fatias ainda estão dentro do saco! Abra o saco primeiro.',
            'pegar-manteiga': 'Passar a manteiga? Ela ainda está guardada! Pegue a manteiga primeiro.',
          },
        },
        {
          id: 'fechar', texto: 'Feche o sanduíche.', imagem: 'img/passos/sanduiche-04.webp', peca: 'img/pecas/sanduiche-pao-cima.webp', dependeDe: ['passar'],
          explicacao: 'Fechar antes de passar a manteiga? Vira um sanduíche de nada!',
        },
      ],
      licao: {
        pergunta: 'Cadê os passos escondidos?',
        imagem: 'img/licoes/sanduiche-3.webp',
        texto: [
          'Abrir o saco de pão… você faz isso sem nem pensar.',
          'Quando a gente explica para alguém, esses passos pequenos ficam escondidos — a pessoa adivinha sozinha.',
          'Mas eles existem! Sem eles, o sanduíche não sai.',
        ],
        reflexao: [
          'Qual passo desta fase você nunca fala em voz alta quando ensina alguém a fazer um sanduíche?',
          'Se ninguém abrir o saco, como as fatias vão parar na mesa?',
        ],
      },
    },

    /* ---------- FASE 4 · o computador não adivinha (6 passos) ---------- */
    {
      id: 'fase-4',
      titulo: 'Ensine o computador a fazer um sanduíche!',
      instrucao: 'O computador não adivinha nada. Diga cada passo, um por um.',
      mascote: 'O computador não sabe nada sobre sanduíche. Conte tudo para ele!',
      passos: [
        { id: 'pegar-pao',    texto: 'Pegue o saco de pão.',       imagem: 'img/passos/sanduiche-05.webp', dependeDe: [] },
        { id: 'pegar-queijo', texto: 'Pegue uma fatia de queijo.', imagem: 'img/passos/sanduiche-10.webp', dependeDe: [] },
        {
          id: 'abrir-saco', texto: 'Abra o saco de pão.', imagem: 'img/passos/sanduiche-07.webp', dependeDe: ['pegar-pao'],
          explicacao: 'O saco precisa estar na mão do computador antes de abrir!',
        },
        {
          id: 'tirar-fatias', texto: 'Tire duas fatias do saco.', imagem: 'img/passos/sanduiche-08.webp', peca: 'img/pecas/sanduiche-pao.webp', dependeDe: ['abrir-saco'],
          explicacao: 'Tirar fatias de um saco fechado? O computador trava: não dá!',
        },
        {
          id: 'por-queijo', texto: 'Coloque o queijo na fatia.', imagem: 'img/passos/sanduiche-02.webp', peca: 'img/pecas/sanduiche-queijo.webp', dependeDe: ['tirar-fatias', 'pegar-queijo'],
          explicacao: {
            'tirar-fatias': 'As fatias ainda estão dentro do saco! O queijo cairia em cima da mesa.',
            'pegar-queijo': 'Colocar qual queijo? Ele ainda está guardado! O computador precisa pegar a fatia antes.',
          },
        },
        {
          id: 'fechar', texto: 'Feche com a outra fatia.', imagem: 'img/passos/sanduiche-04.webp', peca: 'img/pecas/sanduiche-pao-cima.webp', dependeDe: ['por-queijo'],
          explicacao: 'Fechar antes de o queijo entrar? O computador entrega um sanduíche de nada!',
        },
      ],
      licao: {
        pergunta: 'E se quem monta o sanduíche for um computador?',
        imagem: 'img/licoes/sanduiche-4.webp',
        texto: [
          'Um amigo adivinha os passos escondidos. O computador não adivinha nada!',
          'Ele só faz o que a gente diz, do jeitinho que a gente diz. Cada frase dessas é uma instrução.',
          'Por isso a lista para ele precisa ter todos os passos, na ordem certa.',
        ],
        reflexao: [
          'Por que o computador não consegue tirar o pão de um saco fechado?',
          'Qual passo desta fase você esqueceria de falar?',
        ],
      },
    },

    /* ---------- FASE 5 · algoritmo, do começo ao fim (8 passos) ---------- */
    {
      id: 'fase-5',
      titulo: 'Do primeiro passo até arrumar a mesa!',
      instrucao: 'Pegue tudo, abra tudo, monte — e termine arrumando!',
      mascote: 'Começo, meio e fim: pegar, montar e arrumar a mesa.',
      passos: [
        { id: 'pegar-pao',      texto: 'Pegue o saco de pão.',      imagem: 'img/passos/sanduiche-05.webp', dependeDe: [] },
        { id: 'pegar-manteiga', texto: 'Pegue o pote de manteiga.', imagem: 'img/passos/sanduiche-06.webp', dependeDe: [] },
        { id: 'pegar-faca',     texto: 'Pegue uma faca sem ponta.', imagem: 'img/passos/sanduiche-11.webp', dependeDe: [] },
        {
          id: 'abrir-saco', texto: 'Abra o saco e tire duas fatias.', imagem: 'img/passos/sanduiche-07.webp', peca: 'img/pecas/sanduiche-pao.webp', dependeDe: ['pegar-pao'],
          explicacao: 'O saco precisa estar na sua mão antes de abrir!',
        },
        {
          id: 'abrir-pote', texto: 'Abra o pote de manteiga.', imagem: 'img/passos/sanduiche-12.webp', dependeDe: ['pegar-manteiga'],
          explicacao: 'O pote precisa estar na sua mão antes de abrir!',
        },
        {
          id: 'passar', texto: 'Espalhe a manteiga nas fatias.', imagem: 'img/passos/sanduiche-09.webp', peca: 'img/pecas/sanduiche-manteiga.webp', dependeDe: ['abrir-saco', 'abrir-pote', 'pegar-faca'],
          explicacao: {
            'abrir-saco': 'As fatias ainda estão dentro do saco!',
            'abrir-pote': 'A manteiga ainda está trancada no pote! A faca não atravessa a tampa.',
            'pegar-faca': 'Espalhar com o quê? Pegue a faca primeiro!',
          },
        },
        {
          id: 'fechar-sanduiche', texto: 'Junte as duas fatias.', imagem: 'img/passos/sanduiche-04.webp', peca: 'img/pecas/sanduiche-pao-cima.webp', dependeDe: ['passar'],
          explicacao: 'Juntar as fatias sem manteiga dentro? Sanduíche de nada!',
        },
        {
          id: 'guardar', texto: 'Guarde tudo e deixe a mesa limpa.', imagem: 'img/passos/sanduiche-13.webp', dependeDe: ['fechar-sanduiche'],
          explicacao: 'O sanduíche ainda não está pronto! Termine de montar antes de guardar as coisas.',
        },
      ],
      licao: {
        pergunta: 'Esse passo a passo tem um nome?',
        imagem: 'img/licoes/sanduiche-5.webp',
        texto: [
          'Uma lista de instruções completa e na ordem certa tem nome: algoritmo!',
          'E o seu foi até o fim de verdade: montar, guardar tudo, deixar a mesa limpa.',
          'Quem cria um algoritmo pensa no começo, no meio e no fim.',
        ],
        reflexao: [
          'Por que guardar as coisas também faz parte do passo a passo?',
          'Qual outro algoritmo você segue todo dia sem perceber?',
        ],
      },
    },

  ],
};

/* ============================================================
   SITUAÇÃO 2 · O ROBÔ E O CUBO
   Mais perto da máquina: os erros mostram passos que humanos
   acham óbvios (virar antes de andar, abrir a garra antes de
   pegar, soltar depois de chegar, ligar antes de tudo).
   ============================================================ */

const SITUACAO_ROBO = {
  formato: 'passo-a-passo/1',
  id: 'robo',
  titulo: 'O robô e o cubo',
  local: 'Fábrica',
  area: 'fabrica',
  cor: '#2f4f7f',
  cliente: 'img/who2.webp',
  cena: 'img/pic2.webp',
  fundo: 'img/level2.webp',
  fundoConclusao: 'img/win2.webp',
  // a imagem que se monta ao lado do tabuleiro (ver motor.js)
  montagem: 'tirinha',
  fases: [

    /* ---------- FASE 1 · a máquina precisa de ordem (3 passos) ---------- */
    {
      id: 'fase-1',
      titulo: 'Mande o robô guardar o cubo!',
      instrucao: 'O robô faz um passo de cada vez. Coloque na ordem!',
      mascote: 'O robô só faz o que você mandar — e na ordem que você mandar.',
      passos: [
        { id: 'andar', texto: 'Ande até o cubo.', imagem: 'img/passos/robo-01.webp', dependeDe: [] },
        {
          id: 'pegar', texto: 'Pegue o cubo.', imagem: 'img/passos/robo-02.webp', dependeDe: ['andar'],
          explicacao: 'O braço do robô não estica! De longe, a garra fecha no ar. Primeiro ande até o cubo.',
        },
        {
          id: 'colocar', texto: 'Coloque o cubo na plataforma.', imagem: 'img/passos/robo-03.webp', dependeDe: ['pegar'],
          explicacao: 'A garra do robô está vazia! Colocar o quê? Primeiro pegue o cubo.',
        },
      ],
      licao: {
        pergunta: 'Como um robô entende um pedido?',
        imagem: 'img/licoes/robo-1.webp',
        texto: [
          'O robô não pensa como a gente: ele faz um passo de cada vez, na ordem que recebe.',
          'Se a ordem estiver trocada, ele tenta mesmo assim — e dá tudo errado!',
          'Com a ordem certa, o cubo chega à plataforma.',
        ],
        reflexao: [
          'Por que o robô não consegue pegar o cubo de longe?',
          'Se você fosse um robô, o que faria primeiro ao acordar?',
        ],
      },
    },

    /* ---------- FASE 2 · passos livres: a garra aparece (4 passos) ---------- */
    {
      id: 'fase-2',
      titulo: 'Apareceu a garra!',
      instrucao: 'A garra começa fechada — e garra fechada não pega nada.',
      mascote: 'Garra fechada não pega nada. Repare quando ela precisa abrir!',
      passos: [
        { id: 'andar',       texto: 'Ande até o cubo.', imagem: 'img/passos/robo-01.webp', dependeDe: [] },
        { id: 'abrir-garra', texto: 'Abra a garra.',    imagem: 'img/passos/robo-04.webp', dependeDe: [] },
        {
          id: 'fechar-garra', texto: 'Feche a garra no cubo.', imagem: 'img/passos/robo-02.webp', dependeDe: ['andar', 'abrir-garra'],
          explicacao: {
            'andar':       'Fechar a garra daqui? Ela fecha no ar! Primeiro chegue perto do cubo.',
            'abrir-garra': 'A garra está fechada! Garra fechada não pega nada — primeiro abra.',
          },
        },
        {
          id: 'colocar', texto: 'Coloque o cubo na plataforma.', imagem: 'img/passos/robo-03.webp', dependeDe: ['fechar-garra'],
          explicacao: 'A garra ainda não está segurando o cubo! Feche a garra nele primeiro.',
        },
      ],
      licao: {
        pergunta: 'Todos os passos precisam esperar?',
        imagem: 'img/licoes/robo-2.webp',
        texto: [
          'Andar até o cubo e abrir a garra: tanto faz qual vem primeiro — um não precisa do outro!',
          'Mas fechar a garra no cubo precisa esperar os dois.',
          'Um passo só espera aquilo de que ele precisa.',
        ],
        reflexao: [
          'Quais dois passos podiam trocar de lugar sem estragar nada?',
          'Por que abrir a garra precisa vir antes de fechar a garra?',
        ],
      },
    },

    /* ---------- FASE 3 · o óbvio para nós, não para ele (5 passos) ---------- */
    {
      id: 'fase-3',
      titulo: 'Vire o robô antes de ele andar!',
      instrucao: 'O robô só anda para a frente. Ele precisa estar virado para o lado certo!',
      mascote: 'O robô anda para onde está virado. Vire antes de mandar andar!',
      passos: [
        { id: 'virar-cubo',  texto: 'Vire o robô para o cubo.', imagem: 'img/passos/robo-05.webp', dependeDe: [] },
        { id: 'abrir-garra', texto: 'Abra a garra.',            imagem: 'img/passos/robo-04.webp', dependeDe: [] },
        {
          id: 'andar-cubo', texto: 'Ande até o cubo.', imagem: 'img/passos/robo-01.webp', dependeDe: ['virar-cubo'],
          explicacao: 'O robô anda sempre reto, para onde está virado. Sem virar antes, ele bate na parede!',
        },
        {
          id: 'fechar-garra', texto: 'Feche a garra no cubo.', imagem: 'img/passos/robo-02.webp', dependeDe: ['andar-cubo', 'abrir-garra'],
          explicacao: {
            'andar-cubo':  'Fechar a garra daqui? Ela fecha no ar! Primeiro chegue perto do cubo.',
            'abrir-garra': 'A garra está fechada! Garra fechada não pega nada: primeiro abra.',
          },
        },
        {
          id: 'colocar', texto: 'Coloque o cubo na plataforma.', imagem: 'img/passos/robo-03.webp', dependeDe: ['fechar-garra'],
          explicacao: 'A garra ainda não está segurando o cubo! Feche a garra nele primeiro.',
        },
      ],
      licao: {
        pergunta: 'Quem manda alguém "se virar antes de andar"?',
        imagem: 'img/licoes/robo-3.webp',
        texto: [
          'Ninguém fala isso — todo mundo se vira sem pensar.',
          'O robô não: se ninguém mandar virar, ele sai reto e bate na parede.',
          'Para uma máquina, até o passo mais óbvio precisa ser dito.',
        ],
        reflexao: [
          'Que outros passos você faz sem perceber quando atravessa a sala?',
          'O que acontece com um robô que anda sem virar para o lugar certo?',
        ],
      },
    },

    /* ---------- FASE 4 · a viagem completa: soltar também é passo (7 passos) ---------- */
    {
      id: 'fase-4',
      titulo: 'Leve o cubo até a plataforma!',
      instrucao: 'Agora a viagem é completa: pegar o cubo, levar até a plataforma e soltar.',
      mascote: 'Ida e volta: pegar o cubo aqui, soltar lá na plataforma.',
      passos: [
        { id: 'virar-cubo',  texto: 'Vire o robô para o cubo.', imagem: 'img/passos/robo-05.webp', dependeDe: [] },
        { id: 'abrir-garra', texto: 'Abra a garra.',            imagem: 'img/passos/robo-04.webp', dependeDe: [] },
        {
          id: 'andar-cubo', texto: 'Ande até o cubo.', imagem: 'img/passos/robo-01.webp', dependeDe: ['virar-cubo'],
          explicacao: 'O robô anda sempre reto, para onde está virado. Sem virar antes, ele bate na parede!',
        },
        {
          id: 'fechar-garra', texto: 'Feche a garra no cubo.', imagem: 'img/passos/robo-02.webp', dependeDe: ['andar-cubo', 'abrir-garra'],
          explicacao: {
            'andar-cubo':  'Fechar a garra daqui? Ela fecha no ar! Primeiro chegue perto do cubo.',
            'abrir-garra': 'A garra está fechada! Garra fechada não pega nada: primeiro abra.',
          },
        },
        {
          id: 'virar-plataforma', texto: 'Vire o robô para a plataforma.', imagem: 'img/passos/robo-06.webp', dependeDe: ['fechar-garra'],
          explicacao: 'Se o robô virar agora, o cubo fica para trás, sozinho na mesa! Primeiro feche a garra nele.',
        },
        {
          id: 'andar-plataforma', texto: 'Ande até a plataforma.', imagem: 'img/passos/robo-07.webp', dependeDe: ['virar-plataforma'],
          explicacao: 'O robô anda para onde está virado. Sem virar antes, ele leva o cubo direto para a parede!',
        },
        {
          id: 'soltar', texto: 'Abra a garra em cima da plataforma.', imagem: 'img/passos/robo-08.webp', dependeDe: ['andar-plataforma'],
          explicacao: 'Abrir a garra agora? O cubo despenca no meio do caminho! Primeiro chegue até a plataforma.',
        },
      ],
      licao: {
        pergunta: 'O que se esconde dentro de "coloque na plataforma"?',
        imagem: 'img/licoes/robo-4.webp',
        texto: [
          'Quando a gente fala "coloque lá", tem um monte de passo escondido: virar, andar, soltar.',
          'O robô não adivinha nenhum deles. Cada frase dessas é uma instrução.',
          'Se a instrução de soltar não existir, o cubo fica preso na garra para sempre!',
        ],
        reflexao: [
          'O que acontece se ninguém mandar o robô soltar o cubo?',
          'Quantos passos escondidos tem em "guarde o brinquedo na caixa"?',
        ],
      },
    },

    /* ---------- FASE 5 · algoritmo: comece do comecinho (8 passos) ---------- */
    {
      id: 'fase-5',
      titulo: 'Comece do verdadeiro começo!',
      instrucao: 'Um robô desligado não faz nada. Comece do comecinho!',
      mascote: 'Faltou um passo bem no comecinho. Percebe qual?',
      passos: [
        { id: 'ligar', texto: 'Aperte o botão de ligar.', imagem: 'img/passos/robo-09.webp', dependeDe: [] },
        {
          id: 'virar-cubo', texto: 'Vire o robô para o cubo.', imagem: 'img/passos/robo-05.webp', dependeDe: ['ligar'],
          explicacao: 'O robô está desligado! Robô sem energia não escuta instrução nenhuma.',
        },
        {
          id: 'abrir-garra', texto: 'Abra a garra.', imagem: 'img/passos/robo-04.webp', dependeDe: ['ligar'],
          explicacao: 'O robô está desligado! Robô sem energia não escuta instrução nenhuma.',
        },
        {
          id: 'andar-cubo', texto: 'Ande até o cubo.', imagem: 'img/passos/robo-01.webp', dependeDe: ['virar-cubo'],
          explicacao: 'O robô anda sempre reto, para onde está virado. Sem virar antes, ele bate na parede!',
        },
        {
          id: 'fechar-garra', texto: 'Feche a garra no cubo.', imagem: 'img/passos/robo-02.webp', dependeDe: ['andar-cubo', 'abrir-garra'],
          explicacao: {
            'andar-cubo':  'Fechar a garra daqui? Ela fecha no ar! Primeiro chegue perto do cubo.',
            'abrir-garra': 'A garra está fechada! Garra fechada não pega nada: primeiro abra.',
          },
        },
        {
          id: 'virar-plataforma', texto: 'Vire o robô para a plataforma.', imagem: 'img/passos/robo-06.webp', dependeDe: ['fechar-garra'],
          explicacao: 'Se o robô virar agora, o cubo fica para trás, sozinho na mesa! Primeiro feche a garra nele.',
        },
        {
          id: 'andar-plataforma', texto: 'Ande até a plataforma.', imagem: 'img/passos/robo-07.webp', dependeDe: ['virar-plataforma'],
          explicacao: 'O robô anda para onde está virado. Sem virar antes, ele leva o cubo direto para a parede!',
        },
        {
          id: 'soltar', texto: 'Abra a garra em cima da plataforma.', imagem: 'img/passos/robo-08.webp', dependeDe: ['andar-plataforma'],
          explicacao: 'Abrir a garra agora? O cubo despenca no meio do caminho! Primeiro chegue até a plataforma.',
        },
      ],
      licao: {
        pergunta: 'Esse passo a passo tem um nome?',
        imagem: 'img/licoes/robo-5.webp',
        texto: [
          'Uma lista de instruções completa e na ordem certa tem nome: algoritmo!',
          'E o seu começou do verdadeiro começo: ligar o robô — o passo mais esquecido do mundo.',
          'Quem cria um algoritmo pensa no começo, no meio e no fim.',
        ],
        reflexao: [
          'O nosso algoritmo esqueceu um passo lá no finzinho. Qual? Pense no botão…',
          'O que mais precisa ser "ligado" antes de funcionar na sua casa?',
        ],
      },
    },

  ],
};

/* ============================================================
   SITUAÇÃO 3 · HORA DE ARRUMAR A MOCHILA
   Rotina escolar: acontece dentro da sala, e o professor pode
   fotografar o material (ou os próprios alunos arrumando) para
   recriar a situação no editor com as fotos da turma.
   ============================================================ */

const SITUACAO_MOCHILA = {
  formato: 'passo-a-passo/1',
  id: 'mochila',
  titulo: 'Arrumar a mochila',
  local: 'Escola',
  area: 'escola',
  cor: '#3f7d3f',
  cliente: 'img/who3.webp',
  cena: 'img/pic3.webp',
  fundo: 'img/level3.webp',
  fundoConclusao: 'img/win3.webp',
  // a imagem que se monta ao lado do tabuleiro (ver motor.js)
  montagem: 'cena',
  // a cena começa com o estojo aberto e a mochila fechada; nos níveis
  // sem a carta "Abra o zíper", a mochila já começa aberta
  montagemBase: 'img/pecas/mochila-cena-fechada.webp',
  fases: [

    /* ---------- FASE 1 · a ordem importa (3 passos) ---------- */
    {
      id: 'fase-1',
      montagemBase: 'img/pecas/mochila-cena-aberta.webp',
      titulo: 'O sinal tocou! Guarde o material.',
      instrucao: 'Coloque os passos na ordem certa para nada ficar para trás.',
      mascote: 'O estojo precisa estar fechado antes de entrar na mochila.',
      passos: [
        { id: 'guardar-lapis', texto: 'Guarde o lápis no estojo.', imagem: 'img/passos/mochila-01.webp', peca: 'img/pecas/mochila-lapis.webp', dependeDe: [] },
        {
          id: 'fechar-estojo', texto: 'Feche o estojo.', imagem: 'img/passos/mochila-03.webp', peca: 'img/pecas/mochila-estojo-fechado.webp', dependeDe: ['guardar-lapis'],
          explicacao: 'Fechar o estojo agora? O lápis fica de fora, perdido na mesa!',
        },
        {
          id: 'estojo-mochila', texto: 'Guarde o estojo na mochila.', imagem: 'img/passos/mochila-04.webp', peca: 'img/pecas/mochila-estojo-dentro.webp', dependeDe: ['fechar-estojo'],
          explicacao: 'O estojo ainda está aberto! Se ele entrar assim, os lápis se espalham dentro da mochila.',
        },
      ],
      licao: {
        pergunta: 'Por que a ordem dos passos importa?',
        imagem: 'img/licoes/mochila-1.webp',
        texto: [
          'Para guardar o material, você colocou os passos em uma ordem.',
          'Se a gente troca os passos de lugar, dá confusão: o lápis pode ficar perdido na mesa!',
          'Com a ordem certa, nada fica para trás.',
        ],
        reflexao: [
          'O que acontece com o lápis se o estojo fechar antes de ele entrar?',
          'O que você guarda todo dia na hora da saída?',
        ],
      },
    },

    /* ---------- FASE 2 · lápis e borracha não brigam (5 passos) ---------- */
    {
      id: 'fase-2',
      montagemBase: 'img/pecas/mochila-cena-aberta.webp',
      titulo: 'Agora tem mais coisa na mesa!',
      instrucao: 'O lápis e a borracha não brigam: qualquer um pode entrar primeiro!',
      mascote: 'Lápis ou borracha primeiro? Aqui tanto faz!',
      passos: [
        { id: 'guardar-lapis',    texto: 'Guarde o lápis no estojo.',    imagem: 'img/passos/mochila-01.webp', peca: 'img/pecas/mochila-lapis.webp', dependeDe: [] },
        { id: 'guardar-borracha', texto: 'Guarde a borracha no estojo.', imagem: 'img/passos/mochila-02.webp', peca: 'img/pecas/mochila-borracha.webp', dependeDe: [] },
        {
          id: 'fechar-estojo', texto: 'Feche o estojo.', imagem: 'img/passos/mochila-03.webp', peca: 'img/pecas/mochila-estojo-fechado.webp', dependeDe: ['guardar-lapis', 'guardar-borracha'],
          explicacao: {
            'guardar-lapis':    'O lápis ainda está fora! Fechando agora, ele fica perdido na mesa.',
            'guardar-borracha': 'A borracha ainda está fora! Fechando agora, ela fica perdida na mesa.',
          },
        },
        {
          id: 'estojo-mochila', texto: 'Guarde o estojo na mochila.', imagem: 'img/passos/mochila-04.webp', peca: 'img/pecas/mochila-estojo-dentro.webp', dependeDe: ['fechar-estojo'],
          explicacao: 'O estojo aberto derrama tudo dentro da mochila! Feche o estojo primeiro.',
        },
        {
          id: 'fechar-mochila', texto: 'Feche o zíper da mochila.', imagem: 'img/passos/mochila-05.webp', peca: 'img/pecas/mochila-fechar.webp', dependeDe: ['estojo-mochila'],
          explicacao: 'Fechar a mochila sem o estojo dentro? Ele fica esquecido na escola!',
        },
      ],
      licao: {
        pergunta: 'Todo passo tem uma hora certa?',
        imagem: 'img/licoes/mochila-2.webp',
        texto: [
          'O lápis e a borracha podiam entrar no estojo em qualquer ordem: um não precisa do outro.',
          'Mas fechar o estojo precisa esperar os dois estarem dentro.',
          'Um passo só espera aquilo de que ele precisa — os outros são livres!',
        ],
        reflexao: [
          'Quais cartas podiam trocar de lugar sem estragar nada?',
          'Por que fechar o estojo precisa esperar o lápis E a borracha?',
        ],
      },
    },

    /* ---------- FASE 3 · o passo escondido: abrir a mochila (6 passos) ---------- */
    {
      id: 'fase-3',
      titulo: 'Tem um passo que ninguém fala…',
      instrucao: 'Tem um passo escondido aqui. A mochila não abre sozinha!',
      mascote: 'Tem um passo que a gente faz sem perceber. Ele está aí!',
      passos: [
        { id: 'guardar-lapis',    texto: 'Guarde o lápis no estojo.',    imagem: 'img/passos/mochila-01.webp', peca: 'img/pecas/mochila-lapis.webp', dependeDe: [] },
        { id: 'guardar-borracha', texto: 'Guarde a borracha no estojo.', imagem: 'img/passos/mochila-02.webp', peca: 'img/pecas/mochila-borracha.webp', dependeDe: [] },
        {
          id: 'fechar-estojo', texto: 'Feche o estojo.', imagem: 'img/passos/mochila-03.webp', peca: 'img/pecas/mochila-estojo-fechado.webp', dependeDe: ['guardar-lapis', 'guardar-borracha'],
          explicacao: {
            'guardar-lapis':    'O lápis ainda está fora! Fechando agora, ele fica perdido na mesa.',
            'guardar-borracha': 'A borracha ainda está fora! Fechando agora, ela fica perdida na mesa.',
          },
        },
        {
          id: 'abrir-mochila', texto: 'Abra o zíper da mochila.', imagem: 'img/passos/mochila-06.webp', peca: 'img/pecas/mochila-abrir.webp', dependeDe: [],
        },
        {
          id: 'estojo-mochila', texto: 'Guarde o estojo na mochila.', imagem: 'img/passos/mochila-04.webp', peca: 'img/pecas/mochila-estojo-dentro.webp', dependeDe: ['fechar-estojo', 'abrir-mochila'],
          explicacao: {
            'fechar-estojo': 'O estojo aberto derrama tudo dentro da mochila! Feche o estojo primeiro.',
            'abrir-mochila': 'A mochila está fechada! O estojo não atravessa o zíper — abra a mochila primeiro.',
          },
        },
        {
          id: 'fechar-mochila', texto: 'Feche o zíper da mochila.', imagem: 'img/passos/mochila-05.webp', peca: 'img/pecas/mochila-fechar.webp', dependeDe: ['estojo-mochila'],
          explicacao: 'Fechar a mochila sem o estojo dentro? Ele fica esquecido na escola!',
        },
      ],
      licao: {
        pergunta: 'Quem lembra de falar "abra a mochila"?',
        imagem: 'img/licoes/mochila-3.webp',
        texto: [
          'Ninguém fala "abra a mochila" — todo mundo abre sem pensar.',
          'Mas se esse passo não existir, o estojo não entra: ele bate no zíper fechado!',
          'Os passos escondidos existem, mesmo quando ninguém fala deles.',
        ],
        reflexao: [
          'Qual passo desta fase você faz todo dia sem nem perceber?',
          'O que mais você abre sem pensar antes de guardar alguma coisa?',
        ],
      },
    },

    /* ---------- FASE 4 · algoritmo completo, até a mochila nas costas (8 passos) ---------- */
    {
      id: 'fase-4',
      titulo: 'Arrumação completa, do lápis às costas!',
      instrucao: 'Estojo pronto, mochila aberta, tudo guardado: e ela vai para as costas!',
      mascote: 'Do lápis até as costas: o passo a passo inteiro, sem pular nada.',
      passos: [
        { id: 'guardar-lapis',    texto: 'Guarde o lápis no estojo.',    imagem: 'img/passos/mochila-01.webp', peca: 'img/pecas/mochila-lapis.webp', dependeDe: [] },
        { id: 'guardar-borracha', texto: 'Guarde a borracha no estojo.', imagem: 'img/passos/mochila-02.webp', peca: 'img/pecas/mochila-borracha.webp', dependeDe: [] },
        {
          id: 'fechar-estojo', texto: 'Feche o estojo.', imagem: 'img/passos/mochila-03.webp', peca: 'img/pecas/mochila-estojo-fechado.webp', dependeDe: ['guardar-lapis', 'guardar-borracha'],
          explicacao: {
            'guardar-lapis':    'O lápis ainda está fora! Fechando agora, ele fica perdido na mesa.',
            'guardar-borracha': 'A borracha ainda está fora! Fechando agora, ela fica perdida na mesa.',
          },
        },
        {
          id: 'abrir-mochila', texto: 'Abra o zíper da mochila.', imagem: 'img/passos/mochila-06.webp', peca: 'img/pecas/mochila-abrir.webp', dependeDe: [],
        },
        {
          id: 'estojo-mochila', texto: 'Guarde o estojo na mochila.', imagem: 'img/passos/mochila-04.webp', peca: 'img/pecas/mochila-estojo-dentro.webp', dependeDe: ['fechar-estojo', 'abrir-mochila'],
          explicacao: {
            'fechar-estojo': 'O estojo aberto derrama tudo dentro da mochila! Feche o estojo primeiro.',
            'abrir-mochila': 'A mochila está fechada! O estojo não atravessa o zíper — abra a mochila primeiro.',
          },
        },
        {
          id: 'caderno-mochila', texto: 'Guarde o caderno na mochila.', imagem: 'img/passos/mochila-07.webp', peca: 'img/pecas/mochila-caderno.webp', dependeDe: ['abrir-mochila'],
          explicacao: 'A mochila está fechada! O caderno não atravessa o zíper: abra a mochila primeiro.',
        },
        {
          id: 'fechar-mochila', texto: 'Feche o zíper da mochila.', imagem: 'img/passos/mochila-05.webp', peca: 'img/pecas/mochila-fechar.webp', dependeDe: ['estojo-mochila', 'caderno-mochila'],
          explicacao: {
            'estojo-mochila':  'O estojo ainda está fora! Fechando agora, ele fica esquecido na escola.',
            'caderno-mochila': 'O caderno ainda está fora! Fechando agora, ele fica esquecido na escola.',
          },
        },
        {
          id: 'colocar-costas', texto: 'Coloque a mochila nas costas.', imagem: 'img/passos/mochila-08.webp', dependeDe: ['fechar-mochila'],
          explicacao: 'Mochila aberta nas costas? Vira uma chuva de lápis e caderno pelo chão!',
        },
      ],
      licao: {
        pergunta: 'Esse passo a passo tem um nome?',
        imagem: 'img/licoes/mochila-4.webp',
        texto: [
          'Uma lista de passos completa e na ordem certa tem nome: algoritmo!',
          'Você montou um algoritmo de verdade — e ele foi até o fim: mochila fechada e nas costas.',
          'Quem cria um algoritmo pensa no começo, no meio e no fim.',
        ],
        reflexao: [
          'O que ainda falta fazer antes de sair da sala? Olhe para a cadeira…',
          'Qual algoritmo você segue amanhã de manhã antes de vir para a escola?',
        ],
      },
    },

  ],
};

/* ============================================================
   SITUAÇÃO 4 · AJUDAR AS ABELHAS
   Natureza: a abelha segue um caminho que ela nunca pula —
   sair, achar a flor, coletar, voltar, guardar. Bom para a
   criança perceber que até um bicho pequeno segue um passo a
   passo completo.
   ============================================================ */

const SITUACAO_ABELHAS = {
  formato: 'passo-a-passo/1',
  id: 'abelhas',
  titulo: 'Ajudar as abelhas',
  local: 'Jardim',
  area: 'jardim',
  cor: '#a8820a',
  cliente: 'img/who4.webp',
  cena: 'img/pic4.webp',
  fundo: 'img/level4.webp',
  fundoConclusao: 'img/win4.webp',
  // a imagem que se monta ao lado do tabuleiro (ver motor.js)
  montagem: 'tirinha',
  fases: [

    /* ---------- FASE 1 · a ordem importa (3 passos) ---------- */
    {
      id: 'fase-1',
      titulo: 'Ajude a abelha a buscar néctar!',
      instrucao: 'A abelha faz um passo de cada vez. Coloque na ordem!',
      mascote: 'O néctar mora dentro da flor. O que a abelha faz primeiro?',
      passos: [
        { id: 'voar-flor', texto: 'Voe até a flor.', imagem: 'img/passos/abelhas-01.webp', dependeDe: [] },
        {
          id: 'nectar', texto: 'Colete o néctar da flor.', imagem: 'img/passos/abelhas-02.webp', dependeDe: ['voar-flor'],
          explicacao: 'Coletar néctar daqui? A flor está longe! Primeiro voe até ela.',
        },
        {
          id: 'voltar', texto: 'Leve o néctar para a colmeia.', imagem: 'img/passos/abelhas-03.webp', dependeDe: ['nectar'],
          explicacao: 'Voltar para a colmeia de mãos vazias? Primeiro colete o néctar!',
        },
      ],
      licao: {
        pergunta: 'Por que a ordem dos passos importa?',
        imagem: 'img/licoes/abelhas-1.webp',
        texto: [
          'Para levar néctar para casa, a abelha seguiu os passos em uma ordem.',
          'Se a ordem fica trocada, ela volta para a colmeia sem nada!',
          'Com a ordem certa, o néctar chega em casa.',
        ],
        reflexao: [
          'O que acontece se a abelha voltar para a colmeia antes de coletar o néctar?',
          'Que caminho você faz todo dia que só dá certo em uma ordem?',
        ],
      },
    },

    /* ---------- FASE 2 · passos livres e passos presos (5 passos) ---------- */
    {
      id: 'fase-2',
      titulo: 'Néctar e pólen: dá para levar os dois!',
      instrucao: 'Alguns passos podem trocar de lugar entre si. Outros não. Fique de olho!',
      mascote: 'Néctar ou pólen primeiro? Tanto faz — mas os dois só depois de chegar na flor!',
      passos: [
        { id: 'sair', texto: 'Saia da colmeia.', imagem: 'img/passos/abelhas-04.webp', dependeDe: [] },
        {
          id: 'voar-flor', texto: 'Voe até a flor.', imagem: 'img/passos/abelhas-01.webp', dependeDe: ['sair'],
          explicacao: 'A abelha ainda está dentro da colmeia! Primeiro ela precisa sair.',
        },
        {
          id: 'nectar', texto: 'Colete o néctar da flor.', imagem: 'img/passos/abelhas-02.webp', dependeDe: ['voar-flor'],
          explicacao: 'Coletar néctar daqui? A flor está longe! Primeiro voe até ela.',
        },
        {
          id: 'polen', texto: 'Junte o pólen nas patinhas.', imagem: 'img/passos/abelhas-05.webp', dependeDe: ['voar-flor'],
          explicacao: 'Juntar pólen daqui? A flor está longe! Primeiro voe até ela.',
        },
        {
          id: 'voltar', texto: 'Leve tudo para a colmeia.', imagem: 'img/passos/abelhas-03.webp', dependeDe: ['nectar', 'polen'],
          explicacao: {
            nectar: 'Voltar agora? O néctar ficou na flor! Colete antes de ir embora.',
            polen:  'Voltar agora? O pólen ficou na flor! Junte nas patinhas antes de ir embora.',
          },
        },
      ],
      licao: {
        pergunta: 'Todo passo tem uma hora certa?',
        imagem: 'img/licoes/abelhas-2.webp',
        texto: [
          'O néctar e o pólen podiam ser coletados em qualquer ordem: um não precisa do outro.',
          'Mas voltar para a colmeia precisa esperar os dois.',
          'Um passo só espera aquilo de que ele precisa — os outros são livres!',
        ],
        reflexao: [
          'Quais cartas podiam trocar de lugar sem estragar nada?',
          'Por que voltar para a colmeia não pode vir antes de coletar?',
        ],
      },
    },

    /* ---------- FASE 3 · o passo escondido (6 passos) ---------- */
    {
      id: 'fase-3',
      titulo: 'Tem um passo que ninguém fala…',
      instrucao: 'Antes de voar, a abelha precisa saber para onde. Procure a flor!',
      mascote: 'Voar para onde? Tem um passo escondido aqui no meio.',
      passos: [
        { id: 'sair', texto: 'Saia da colmeia.', imagem: 'img/passos/abelhas-04.webp', dependeDe: [] },
        {
          id: 'procurar', texto: 'Procure uma flor aberta.', imagem: 'img/passos/abelhas-06.webp', dependeDe: ['sair'],
          explicacao: 'De dentro da colmeia não dá para ver as flores! Primeiro saia.',
        },
        {
          id: 'voar-flor', texto: 'Voe até a flor.', imagem: 'img/passos/abelhas-01.webp', dependeDe: ['procurar'],
          explicacao: 'Voar para onde? A abelha ainda não achou nenhuma flor. Procure primeiro!',
        },
        {
          id: 'nectar', texto: 'Colete o néctar da flor.', imagem: 'img/passos/abelhas-02.webp', dependeDe: ['voar-flor'],
          explicacao: 'Coletar néctar daqui? A flor está longe! Primeiro voe até ela.',
        },
        {
          id: 'polen', texto: 'Junte o pólen nas patinhas.', imagem: 'img/passos/abelhas-05.webp', dependeDe: ['voar-flor'],
          explicacao: 'Juntar pólen daqui? A flor está longe! Primeiro voe até ela.',
        },
        {
          id: 'voltar', texto: 'Leve tudo para a colmeia.', imagem: 'img/passos/abelhas-03.webp', dependeDe: ['nectar', 'polen'],
          explicacao: {
            nectar: 'Voltar agora? O néctar ficou na flor! Colete antes de ir embora.',
            polen:  'Voltar agora? O pólen ficou na flor! Junte nas patinhas antes de ir embora.',
          },
        },
      ],
      licao: {
        pergunta: 'Quem lembra de falar "procure a flor"?',
        imagem: 'img/licoes/abelhas-3.webp',
        texto: [
          'Quando alguém conta o que a abelha faz, ninguém fala "procure uma flor aberta".',
          'Esse passo fica escondido: parece óbvio, então a gente pula.',
          'Mas sem ele a abelha voa sem rumo e não acha néctar nenhum!',
        ],
        reflexao: [
          'Qual passo desta fase você esqueceria de contar para alguém?',
          'Para onde a abelha iria se voasse antes de procurar a flor?',
        ],
      },
    },

    /* ---------- FASE 4 · algoritmo, do começo ao fim (8 passos) ---------- */
    {
      id: 'fase-4',
      titulo: 'Da colmeia até o mel guardado!',
      instrucao: 'Sair, buscar, voltar — e terminar guardando tudo no favo!',
      mascote: 'Começo, meio e fim: o trabalho só acaba quando o favo está fechado.',
      passos: [
        { id: 'sair', texto: 'Saia da colmeia.', imagem: 'img/passos/abelhas-04.webp', dependeDe: [] },
        {
          id: 'procurar', texto: 'Procure uma flor aberta.', imagem: 'img/passos/abelhas-06.webp', dependeDe: ['sair'],
          explicacao: 'De dentro da colmeia não dá para ver as flores! Primeiro saia.',
        },
        {
          id: 'voar-flor', texto: 'Voe até a flor.', imagem: 'img/passos/abelhas-01.webp', dependeDe: ['procurar'],
          explicacao: 'Voar para onde? A abelha ainda não achou nenhuma flor. Procure primeiro!',
        },
        {
          id: 'nectar', texto: 'Colete o néctar da flor.', imagem: 'img/passos/abelhas-02.webp', dependeDe: ['voar-flor'],
          explicacao: 'Coletar néctar daqui? A flor está longe! Primeiro voe até ela.',
        },
        {
          id: 'polen', texto: 'Junte o pólen nas patinhas.', imagem: 'img/passos/abelhas-05.webp', dependeDe: ['voar-flor'],
          explicacao: 'Juntar pólen daqui? A flor está longe! Primeiro voe até ela.',
        },
        {
          id: 'voltar', texto: 'Leve tudo para a colmeia.', imagem: 'img/passos/abelhas-03.webp', dependeDe: ['nectar', 'polen'],
          explicacao: {
            nectar: 'Voltar agora? O néctar ficou na flor! Colete antes de ir embora.',
            polen:  'Voltar agora? O pólen ficou na flor! Junte nas patinhas antes de ir embora.',
          },
        },
        {
          id: 'guardar', texto: 'Guarde o néctar no favo.', imagem: 'img/passos/abelhas-07.webp', dependeDe: ['voltar'],
          explicacao: 'Guardar o néctar onde? A abelha ainda está lá fora! Primeiro volte para a colmeia.',
        },
        {
          id: 'tampar', texto: 'Feche o favo com cera.', imagem: 'img/passos/abelhas-08.webp', dependeDe: ['guardar'],
          explicacao: 'Fechar o favo vazio? Guarde o néctar dentro antes de tampar!',
        },
      ],
      licao: {
        pergunta: 'Esse passo a passo tem um nome?',
        imagem: 'img/licoes/abelhas-4.webp',
        texto: [
          'Uma lista de instruções completa e na ordem certa tem nome: algoritmo!',
          'E o seu foi até o fim de verdade: guardar o néctar e fechar o favo para virar mel.',
          'Quem cria um algoritmo pensa no começo, no meio e no fim.',
        ],
        reflexao: [
          'Por que fechar o favo também faz parte do passo a passo?',
          'Qual outro algoritmo você vê na natureza?',
        ],
      },
    },

  ],
};

/* ============================================================
   CHAMADOS NOVOS
   Vieram dos protótipos (em-progresso.js) depois da revisão em
   docs/revisao-chamados-novos.md. Cada um treina uma ideia que os
   quatro chamados originais não têm:
     SITUACAO_MAOS      repetição              (4 fases, 3→7 passos)
     SITUACAO_RUA       condição               (3 fases, 3→6 passos)
     SITUACAO_LIMONADA  caminhos paralelos     (3 fases, 3→7 passos)
     SITUACAO_DENTES    deixar tudo pronto     (4 fases, 3→8 passos)

   Ainda não têm ilustração (cena, fundo, cartas, lições): o jogo
   mostra o quadro tracejado no lugar. O cliente é o do lugar do
   mapa onde o chamado fica.

   Eles aparecem no mapa desde o começo. Os quatro originais levam à
   promoção a Agente; os oito juntos, a Agente Sênior (ver app.js).
   Cada chamado novo entrega o SELO da sua ideia (campo "selo") na
   lição do último nível. Como podem ser jogados antes
   dos originais, as lições falam em "passo a passo" e só a última
   fase de cada um usa a palavra "algoritmo", já explicando o que
   ela quer dizer.

   As explicações de erro terminam na CONSEQUÊNCIA, sem a ordem
   pronta ("faça isto antes"): quem conclui o que mover é a criança.
   ============================================================ */

/* ============================================================
   SITUAÇÃO 5 · LAVAR AS MÃOS
   Repetição: uma carta só manda repetir o mesmo gesto e diz
   quando parar. Depois, o par abrir/fechar e a escolha do melhor
   entre dois jeitos que funcionam.
   ============================================================ */

const SITUACAO_MAOS = {
  formato: 'passo-a-passo/1',
  id: 'maos',
  titulo: 'Lavar as mãos',
  local: 'Banheiro',
  area: 'casa',
  cor: '#3f9c8a',
  cliente: 'img/who1.webp',
  cena: 'img/pic5.webp',
  fundo: 'img/level5.webp',
  fundoConclusao: 'img/win5.webp',
  // um quadrinho por passo: lavar as mãos é uma história no tempo
  montagem: 'tirinha',
  // o selo da ideia: entregue na lição do último nível (ver motor.js)
  selo: {
    nome: 'Repetição',
    icone: 'repetir',
    imagem: 'img/selos/repeticao.webp',
    frase: 'Um passo pode mandar repetir o mesmo gesto, e diz quando parar.',
    exemplo: 'Esfregue as mãos contando até 20.',
    pergunta: 'Onde mais você repete a mesma coisa até uma hora de parar?',
  },
  fases: [

    /* ---------- FASE 1 · a mesma água, dois momentos (3 passos) ---------- */
    {
      id: 'fase-1',
      titulo: 'Mãos sujas? Vamos lavar!',
      instrucao: 'Arraste as cartas para os espaços — ou toque na carta e depois no espaço.',
      mascote: 'A água aparece em duas cartas. Qual delas vem antes do sabonete?',
      passos: [
        { id: 'molhar', texto: 'Molhe as mãos na água.', imagem: 'img/passos/maos-02.webp', dependeDe: [] },
        {
          id: 'sabonete', texto: 'Passe sabonete nas mãos.', imagem: 'img/passos/maos-03.webp', dependeDe: ['molhar'],
          explicacao: 'Sabonete na mão seca não faz espuma: ele só escorrega e não limpa!',
        },
        {
          id: 'enxaguar', texto: 'Enxágue as mãos.', imagem: 'img/passos/maos-05.webp', dependeDe: ['sabonete'],
          explicacao: 'Enxaguar agora? Ainda não tem sabonete para tirar, e a sujeira continua nas mãos!',
        },
      ],
      licao: {
        pergunta: 'A mesma água, duas vezes?',
        imagem: 'img/licoes/maos-1.webp',
        texto: [
          'A água apareceu duas vezes: no começo para molhar, no fim para tirar o sabonete.',
          'O gesto é quase o mesmo, mas o trabalho é outro. O que muda é o momento em que ele acontece.',
          'Num passo a passo, não basta saber o que fazer: é preciso saber quando.',
        ],
        reflexao: [
          'Por que não adianta enxaguar antes de passar o sabonete?',
          'Que outra tarefa sua usa a mesma coisa em dois momentos diferentes?',
        ],
      },
    },

    /* ---------- FASE 2 · repetição: uma carta que manda repetir (4 passos) ---------- */
    {
      id: 'fase-2',
      titulo: 'Esfregue bem!',
      instrucao: 'Chegou uma carta que manda repetir o mesmo gesto. Onde ela entra?',
      mascote: 'Esfregar uma vez só não limpa. A carta nova manda repetir. Até quando?',
      passos: [
        { id: 'molhar', texto: 'Molhe as mãos na água.', imagem: 'img/passos/maos-02.webp', dependeDe: [] },
        {
          id: 'sabonete', texto: 'Passe sabonete nas mãos.', imagem: 'img/passos/maos-03.webp', dependeDe: ['molhar'],
          explicacao: 'Sabonete na mão seca não faz espuma: ele só escorrega e não limpa!',
        },
        {
          id: 'esfregar', texto: 'Esfregue as mãos contando até 20.', imagem: 'img/passos/maos-04.webp', dependeDe: ['sabonete'],
          explicacao: 'Esfregar sem sabonete só espalha a sujeira de uma mão para a outra!',
        },
        {
          id: 'enxaguar', texto: 'Enxágue as mãos.', imagem: 'img/passos/maos-05.webp', dependeDe: ['esfregar'],
          explicacao: 'Enxaguar agora leva o sabonete embora antes de ele ter tempo de limpar!',
        },
      ],
      licao: {
        pergunta: 'Quantas vezes?',
        imagem: 'img/licoes/maos-2.webp',
        texto: [
          'Esfregar é o mesmo gesto, feito muitas vezes. Imagine vinte cartas iguais no tabuleiro!',
          'Uma carta só resolve: ela manda repetir e diz quando parar, que é ao chegar no 20.',
          'Isso se chama repetição. Toda repetição precisa de uma hora de parar.',
        ],
        reflexao: [
          'O que aconteceria se a carta dissesse só "esfregue", sem dizer até quando?',
          'O que mais você faz repetindo o mesmo gesto até uma hora de parar?',
        ],
      },
    },

    /* ---------- FASE 3 · o par: o que abre, fecha (6 passos) ---------- */
    {
      id: 'fase-3',
      titulo: 'De onde vem a água?',
      instrucao: 'A água não aparece sozinha: alguém abre a torneira. E depois?',
      mascote: 'O que foi aberto no começo tem um par lá no fim. Qual é?',
      passos: [
        { id: 'abrir', texto: 'Abra a torneira.', imagem: 'img/passos/maos-01.webp', dependeDe: [] },
        {
          id: 'molhar', texto: 'Molhe as mãos na água.', imagem: 'img/passos/maos-02.webp', dependeDe: ['abrir'],
          explicacao: 'Molhar as mãos em quê? A torneira está fechada e não sai nem uma gota!',
        },
        {
          id: 'sabonete', texto: 'Passe sabonete nas mãos.', imagem: 'img/passos/maos-03.webp', dependeDe: ['molhar'],
          explicacao: 'Sabonete na mão seca não faz espuma: ele só escorrega e não limpa!',
        },
        {
          id: 'esfregar', texto: 'Esfregue as mãos contando até 20.', imagem: 'img/passos/maos-04.webp', dependeDe: ['sabonete'],
          explicacao: 'Esfregar sem sabonete só espalha a sujeira de uma mão para a outra!',
        },
        {
          id: 'enxaguar', texto: 'Enxágue as mãos.', imagem: 'img/passos/maos-05.webp', dependeDe: ['esfregar'],
          explicacao: 'Enxaguar agora leva o sabonete embora antes de ele ter tempo de limpar!',
        },
        {
          id: 'fechar', texto: 'Feche a torneira.', imagem: 'img/passos/maos-06.webp', dependeDe: ['enxaguar'],
          explicacao: 'Com a torneira fechada, não sobra água para tirar o sabonete das mãos!',
        },
      ],
      licao: {
        pergunta: 'O que você abre, você fecha?',
        imagem: 'img/licoes/maos-3.webp',
        texto: [
          'Abrir a torneira é o passo que todo mundo esquece de contar. Fechar também!',
          'Os dois formam um par: um fica no começo, o outro no fim, e a lavagem acontece no meio.',
          'Quando um passo a passo abre, liga ou pega alguma coisa, ele precisa do passo que fecha, desliga ou guarda.',
        ],
        reflexao: [
          'O que acontece se o passo de fechar a torneira não existir?',
          'Que outros pares assim você conhece? Pense em ligar e desligar, pegar e guardar.',
        ],
      },
    },

    /* ---------- FASE 4 · dois jeitos dão certo: qual é o melhor? (7 passos) ---------- */
    {
      id: 'fase-4',
      titulo: 'Mãos limpas e secas!',
      instrucao: 'Falta secar as mãos. Antes ou depois de fechar a torneira?',
      mascote: 'Duas cartas do fim podem trocar de lugar. Os dois jeitos dão certo. Será que são iguais?',
      passos: [
        { id: 'abrir', texto: 'Abra a torneira.', imagem: 'img/passos/maos-01.webp', dependeDe: [] },
        {
          id: 'molhar', texto: 'Molhe as mãos na água.', imagem: 'img/passos/maos-02.webp', dependeDe: ['abrir'],
          explicacao: 'Molhar as mãos em quê? A torneira está fechada e não sai nem uma gota!',
        },
        {
          id: 'sabonete', texto: 'Passe sabonete nas mãos.', imagem: 'img/passos/maos-03.webp', dependeDe: ['molhar'],
          explicacao: 'Sabonete na mão seca não faz espuma: ele só escorrega e não limpa!',
        },
        {
          id: 'esfregar', texto: 'Esfregue as mãos contando até 20.', imagem: 'img/passos/maos-04.webp', dependeDe: ['sabonete'],
          explicacao: 'Esfregar sem sabonete só espalha a sujeira de uma mão para a outra!',
        },
        {
          id: 'enxaguar', texto: 'Enxágue as mãos.', imagem: 'img/passos/maos-05.webp', dependeDe: ['esfregar'],
          explicacao: 'Enxaguar agora leva o sabonete embora antes de ele ter tempo de limpar!',
        },
        {
          id: 'fechar', texto: 'Feche a torneira.', imagem: 'img/passos/maos-06.webp', dependeDe: ['enxaguar'],
          explicacao: 'Com a torneira fechada, não sobra água para tirar o sabonete das mãos!',
        },
        {
          id: 'secar', texto: 'Seque as mãos na toalha.', imagem: 'img/passos/maos-07.webp', dependeDe: ['enxaguar'],
          explicacao: 'Secar as mãos ainda com sabonete? A toalha fica ensaboada e as mãos continuam grudentas!',
        },
      ],
      licao: {
        pergunta: 'Os dois jeitos dão certo. Qual é o melhor?',
        imagem: 'img/licoes/maos-4.webp',
        texto: [
          'Fechar a torneira e secar as mãos podiam trocar de lugar: os dois jeitos deixam as mãos limpas.',
          'Mas, se você se seca primeiro, a torneira fica aberta esse tempo todo e a água vai embora à toa.',
          'Um passo a passo completo e na ordem certa se chama algoritmo. Quando mais de um funciona, dá para escolher o melhor: o que não desperdiça.',
        ],
        reflexao: [
          'Em que ordem você colocou as duas últimas cartas? A torneira ficou aberta enquanto você se secava?',
          'Em que outro momento da lavagem a torneira poderia ficar fechada para gastar menos água?',
        ],
      },
    },

  ],
};

/* ============================================================
   SITUAÇÃO 6 · ATRAVESSAR A RUA
   Condição: uma carta faz a pergunta ("de que cor está o
   boneco?") e outra decide ("se estiver vermelho, espere").
   A mesma regra vale para tudo aqui: olhar cedo demais não vale,
   porque a rua muda.
   ============================================================ */

const SITUACAO_RUA = {
  formato: 'passo-a-passo/1',
  id: 'rua',
  titulo: 'Atravessar a rua',
  local: 'Caminho da escola',
  area: 'faixa',
  cor: '#c0663a',
  cliente: 'img/who5.webp',
  cena: 'img/pic6.webp',
  fundo: 'img/level6.webp',
  fundoConclusao: 'img/win6.webp',
  // um quadrinho por passo: no erro, a história trava antes da faixa
  montagem: 'tirinha',
  // o selo da ideia: entregue na lição do último nível (ver motor.js)
  selo: {
    nome: 'Condição',
    icone: 'decidir',
    imagem: 'img/selos/condicao.webp',
    frase: 'Um passo pode fazer uma pergunta e decidir pelo que encontra.',
    exemplo: 'Se estiver vermelho, espere o verde.',
    pergunta: 'Que regra da sua casa ou da sua escola começa com "se"?',
  },
  fases: [

    /* ---------- FASE 1 · a ordem que protege (3 passos) ---------- */
    {
      id: 'fase-1',
      titulo: 'Vamos para o outro lado!',
      instrucao: 'Arraste as cartas para os espaços — ou toque na carta e depois no espaço.',
      mascote: 'Na rua, um passo fora de hora pode ser perigoso. Qual vem primeiro?',
      passos: [
        { id: 'faixa', texto: 'Vá até a faixa de pedestres.', imagem: 'img/passos/rua-01.webp', dependeDe: [] },
        {
          id: 'olhar', texto: 'Olhe para os dois lados.', imagem: 'img/passos/rua-02.webp', dependeDe: ['faixa'],
          explicacao: 'Olhar de longe não vale: até você chegar à faixa, pode aparecer um carro que não estava lá!',
        },
        {
          id: 'atravessar', texto: 'Atravesse andando pela faixa.', imagem: 'img/passos/rua-03.webp', dependeDe: ['olhar'],
          explicacao: 'Atravessar sem olhar? Pode vir um carro e você nem vai ver!',
        },
      ],
      licao: {
        pergunta: 'Por que olhar antes?',
        imagem: 'img/licoes/rua-1.webp',
        texto: [
          'Na rua, a ordem dos passos não serve só para dar certo: ela protege você.',
          'Olhar depois de atravessar não adianta nada. E olhar cedo demais também não: a rua muda a cada instante.',
          'A hora de olhar é logo antes de atravessar.',
        ],
        reflexao: [
          'O que pode acontecer se alguém atravessar sem olhar?',
          'Onde fica o lugar mais seguro para atravessar perto da sua escola?',
        ],
      },
    },

    /* ---------- FASE 2 · condição: a pergunta e a decisão (5 passos) ---------- */
    {
      id: 'fase-2',
      titulo: 'Tem um semáforo na faixa!',
      instrucao: 'Duas cartas novas falam do boneco do semáforo. Uma pergunta, a outra decide!',
      mascote: 'Antes de decidir se espera ou se vai, você precisa descobrir uma coisa. O quê?',
      passos: [
        { id: 'faixa', texto: 'Vá até a faixa de pedestres.', imagem: 'img/passos/rua-01.webp', dependeDe: [] },
        {
          id: 'ver-boneco', texto: 'Olhe a cor do boneco do semáforo.', imagem: 'img/passos/rua-04.webp', dependeDe: ['faixa'],
          explicacao: 'Olhar o semáforo de longe? Até você chegar à faixa, o boneco pode mudar de cor!',
        },
        {
          id: 'esperar', texto: 'Se estiver vermelho, espere o verde.', imagem: 'img/passos/rua-05.webp', dependeDe: ['ver-boneco'],
          explicacao: 'Esperar ou seguir? Sem olhar o semáforo, você não sabe de que cor o boneco está!',
        },
        {
          id: 'olhar', texto: 'Olhe para os dois lados.', imagem: 'img/passos/rua-02.webp', dependeDe: ['faixa', 'esperar'],
          explicacao: {
            faixa:   'Olhar de longe não vale: até você chegar à faixa, pode aparecer um carro que não estava lá!',
            esperar: 'Olhou e depois ficou esperando o boneco verde? Nesse tempo, outro carro pode chegar sem você ver!',
          },
        },
        {
          id: 'atravessar', texto: 'Atravesse andando pela faixa.', imagem: 'img/passos/rua-03.webp', dependeDe: ['esperar', 'olhar'],
          explicacao: {
            esperar: 'Atravessar sem saber se o boneco está verde? Com ele vermelho, a vez é dos carros!',
            olhar:   'Mesmo com o boneco verde, um carro pode não ter parado. Sem olhar para os lados, você não vê!',
          },
        },
      ],
      licao: {
        pergunta: 'Um passo que faz uma pergunta?',
        imagem: 'img/licoes/rua-2.webp',
        texto: [
          '"Se estiver vermelho, espere o verde" é um passo diferente: ele começa com SE.',
          'Antes de obedecer, você precisa de uma resposta: de que cor está o boneco? Vermelho, você espera. Verde, você segue.',
          'Isso se chama condição: o mesmo passo a passo faz coisas diferentes, dependendo do que encontra.',
        ],
        reflexao: [
          'Que regra da sua casa ou da sua escola começa com "se"?',
          'O que você faz numa rua que não tem semáforo?',
        ],
      },
    },

    /* ---------- FASE 3 · várias condições juntas: isto E isto E isto (6 passos) ---------- */
    {
      id: 'fase-3',
      titulo: 'Atravessando junto!',
      instrucao: 'Criança atravessa a rua de mão dada com um adulto. Onde entra esse passo?',
      mascote: 'A mão dada cabe em vários lugares da fila. Só em um ela não pode ficar. Qual?',
      passos: [
        { id: 'mao', texto: 'Dê a mão para um adulto.', imagem: 'img/passos/rua-06.webp', dependeDe: [] },
        { id: 'faixa', texto: 'Vá até a faixa de pedestres.', imagem: 'img/passos/rua-01.webp', dependeDe: [] },
        {
          id: 'ver-boneco', texto: 'Olhe a cor do boneco do semáforo.', imagem: 'img/passos/rua-04.webp', dependeDe: ['faixa'],
          explicacao: 'Olhar o semáforo de longe? Até você chegar à faixa, o boneco pode mudar de cor!',
        },
        {
          id: 'esperar', texto: 'Se estiver vermelho, espere o verde.', imagem: 'img/passos/rua-05.webp', dependeDe: ['ver-boneco'],
          explicacao: 'Esperar ou seguir? Sem olhar o semáforo, você não sabe de que cor o boneco está!',
        },
        {
          id: 'olhar', texto: 'Olhe para os dois lados.', imagem: 'img/passos/rua-02.webp', dependeDe: ['faixa', 'esperar'],
          explicacao: {
            faixa:   'Olhar de longe não vale: até você chegar à faixa, pode aparecer um carro que não estava lá!',
            esperar: 'Olhou e depois ficou esperando o boneco verde? Nesse tempo, outro carro pode chegar sem você ver!',
          },
        },
        {
          id: 'atravessar', texto: 'Atravesse andando pela faixa.', imagem: 'img/passos/rua-03.webp', dependeDe: ['mao', 'esperar', 'olhar'],
          explicacao: {
            mao:     'Atravessar sem a mão dada? Se você se assustar no meio da rua, não tem ninguém segurando você!',
            esperar: 'Atravessar sem saber se o boneco está verde? Com ele vermelho, a vez é dos carros!',
            olhar:   'Mesmo com o boneco verde, um carro pode não ter parado. Sem olhar para os lados, você não vê!',
          },
        },
      ],
      licao: {
        pergunta: 'Quantas coisas precisam ser verdade?',
        imagem: 'img/licoes/rua-3.webp',
        texto: [
          'Para atravessar, três coisas precisam ser verdade ao mesmo tempo: a mão dada, o boneco verde e os dois lados olhados.',
          'Se faltar uma só, a resposta é "ainda não". É uma condição com E: isto E isto E isto.',
          'Um passo a passo completo e na ordem certa se chama algoritmo. Com condições, ele sabe até a hora de esperar.',
        ],
        reflexao: [
          'Qual das três coisas você acha mais fácil de esquecer? Por quê?',
          'Que outra tarefa sua só pode começar quando várias coisas são verdade ao mesmo tempo?',
        ],
      },
    },

  ],
};

/* ============================================================
   SITUAÇÃO 7 · FAZER UMA LIMONADA
   Caminhos paralelos: o caminho do limão e o caminho da jarra
   não dependem um do outro e se encontram na carta de misturar.
   É o chamado com mais ordens certas do jogo, de propósito.
   ============================================================ */

const SITUACAO_LIMONADA = {
  formato: 'passo-a-passo/1',
  id: 'limonada',
  titulo: 'Fazer uma limonada',
  local: 'Cozinha',
  area: 'limonada',
  cor: '#b8941f',
  cliente: 'img/who5.webp',
  cena: 'img/pic7.webp',
  fundo: 'img/level7.webp',
  fundoConclusao: 'img/win7.webp',
  // um quadrinho por passo (uma "cena" da jarra pediria peças que
  // ainda não existem; a tirinha funciona só com as cartas)
  montagem: 'tirinha',
  // o selo da ideia: entregue na lição do último nível (ver motor.js)
  selo: {
    nome: 'Ao mesmo tempo',
    icone: 'juntar',
    imagem: 'img/selos/ao-mesmo-tempo.webp',
    frase: 'Passos que não dependem um do outro podem andar juntos e se encontrar depois.',
    exemplo: 'Coloque água gelada na jarra.',
    pergunta: 'Que tarefa fica mais rápida quando duas pessoas fazem partes diferentes?',
  },
  fases: [

    /* ---------- FASE 1 · o limão muda a cada passo (3 passos) ---------- */
    {
      id: 'fase-1',
      titulo: 'Que calor! Vamos fazer limonada!',
      instrucao: 'Arraste as cartas para os espaços — ou toque na carta e depois no espaço.',
      mascote: 'O limão passa por três passos antes de virar suco. Em que ordem?',
      passos: [
        { id: 'lavar', texto: 'Lave os limões.', imagem: 'img/passos/limonada-01.webp', dependeDe: [] },
        {
          id: 'cortar', texto: 'Peça a um adulto para cortar os limões.', imagem: 'img/passos/limonada-02.webp', dependeDe: ['lavar'],
          explicacao: 'Cortar o limão sujo? A faca leva a sujeira da casca para dentro do suco!',
        },
        {
          id: 'espremer', texto: 'Esprema os limões.', imagem: 'img/passos/limonada-03.webp', dependeDe: ['cortar'],
          explicacao: 'Limão inteiro não solta suco: ele só rola no espremedor, de um lado para o outro!',
        },
      ],
      licao: {
        pergunta: 'O que muda no limão a cada passo?',
        imagem: 'img/licoes/limonada-1.webp',
        texto: [
          'O limão foi mudando: sujo, limpo, cortado, espremido.',
          'Cada passo recebe o limão do jeito que o passo anterior deixou. Por isso não dá para pular nem trocar.',
          'Num passo a passo, as coisas vão se transformando até ficarem prontas.',
        ],
        reflexao: [
          'Por que é um adulto quem corta o limão?',
          'Que outra comida muda de jeito a cada passo da receita?',
        ],
      },
    },

    /* ---------- FASE 2 · dois caminhos ao mesmo tempo (5 passos) ---------- */
    {
      id: 'fase-2',
      titulo: 'Agora a jarra!',
      instrucao: 'O limão e a jarra não dependem um do outro. Só uma carta espera pelos dois!',
      mascote: 'Enquanto um amigo espreme o limão, outro pode encher a jarra. Quem precisa esperar os dois?',
      passos: [
        { id: 'lavar', texto: 'Lave os limões.', imagem: 'img/passos/limonada-01.webp', dependeDe: [] },
        {
          id: 'cortar', texto: 'Peça a um adulto para cortar os limões.', imagem: 'img/passos/limonada-02.webp', dependeDe: ['lavar'],
          explicacao: 'Cortar o limão sujo? A faca leva a sujeira da casca para dentro do suco!',
        },
        {
          id: 'espremer', texto: 'Esprema os limões.', imagem: 'img/passos/limonada-03.webp', dependeDe: ['cortar'],
          explicacao: 'Limão inteiro não solta suco: ele só rola no espremedor, de um lado para o outro!',
        },
        { id: 'agua', texto: 'Coloque água gelada na jarra.', imagem: 'img/passos/limonada-04.webp', dependeDe: [] },
        {
          id: 'misturar', texto: 'Misture o suco com a água da jarra.', imagem: 'img/passos/limonada-05.webp', dependeDe: ['espremer', 'agua'],
          explicacao: {
            espremer: 'Misturar qual suco? O limão ainda não foi espremido: ia ser só água!',
            agua:     'Misturar o suco com qual água? A jarra ainda está vazia!',
          },
        },
      ],
      licao: {
        pergunta: 'Dá para fazer duas coisas ao mesmo tempo?',
        imagem: 'img/licoes/limonada-2.webp',
        texto: [
          'Pôr água na jarra não depende do limão: pode ser antes, no meio ou depois de espremer.',
          'Passos assim podem ser feitos ao mesmo tempo, por duas pessoas. A limonada fica pronta mais rápido!',
          'Só a carta de misturar não tem escolha: ela espera o suco e a água.',
        ],
        reflexao: [
          'Se vocês fossem dois na cozinha, como dividiriam os passos?',
          'Em quantos lugares diferentes da fila a carta da água podia ficar?',
        ],
      },
    },

    /* ---------- FASE 3 · o ponto de encontro: quem espera por quem (7 passos) ---------- */
    {
      id: 'fase-3',
      titulo: 'Limonada pronta para servir!',
      instrucao: 'Chegaram o açúcar e o copo. Quem pode ir a qualquer hora, e quem precisa esperar?',
      mascote: 'São dois caminhos: o do limão e o da jarra. Em que carta eles se encontram?',
      passos: [
        { id: 'lavar', texto: 'Lave os limões.', imagem: 'img/passos/limonada-01.webp', dependeDe: [] },
        {
          id: 'cortar', texto: 'Peça a um adulto para cortar os limões.', imagem: 'img/passos/limonada-02.webp', dependeDe: ['lavar'],
          explicacao: 'Cortar o limão sujo? A faca leva a sujeira da casca para dentro do suco!',
        },
        {
          id: 'espremer', texto: 'Esprema os limões.', imagem: 'img/passos/limonada-03.webp', dependeDe: ['cortar'],
          explicacao: 'Limão inteiro não solta suco: ele só rola no espremedor, de um lado para o outro!',
        },
        { id: 'agua', texto: 'Coloque água gelada na jarra.', imagem: 'img/passos/limonada-04.webp', dependeDe: [] },
        { id: 'acucar', texto: 'Coloque açúcar na jarra.', imagem: 'img/passos/limonada-06.webp', dependeDe: [] },
        {
          id: 'misturar', texto: 'Misture o suco, a água e o açúcar.', imagem: 'img/passos/limonada-05.webp', dependeDe: ['espremer', 'agua', 'acucar'],
          explicacao: {
            espremer: 'Misturar qual suco? O limão ainda não foi espremido: ia ser só água doce!',
            agua:     'Misturar o suco com qual água? Ela ainda não está na jarra!',
            acucar:   'Misturar agora e pôr o açúcar depois? Ele afunda e fica parado no fundo da jarra!',
          },
        },
        {
          id: 'servir', texto: 'Sirva a limonada no copo.', imagem: 'img/passos/limonada-07.webp', dependeDe: ['misturar'],
          explicacao: 'Servir antes de misturar? O copo recebe uma parte só, e a limonada sai sem gosto de limonada!',
        },
      ],
      licao: {
        pergunta: 'Quem espera por quem?',
        imagem: 'img/licoes/limonada-3.webp',
        texto: [
          'Aqui havia dois caminhos: o do limão (lavar, cortar, espremer) e o da jarra (água e açúcar).',
          'Os dois andam ao mesmo tempo e se encontram na carta de misturar. Ela espera o caminho mais demorado chegar.',
          'Um passo a passo completo e na ordem certa se chama algoritmo. Nem sempre ele é uma fila só: às vezes são caminhos que se juntam.',
        ],
        reflexao: [
          'Desenhe os dois caminhos como duas trilhas que se encontram. Onde fica o ponto de encontro?',
          'Em que outra tarefa duas partes ficam prontas separadas e se juntam no final?',
        ],
      },
    },

  ],
};

/* ============================================================
   SITUAÇÃO 8 · ESCOVAR OS DENTES
   Veio do protótipo de em-progresso.js, refeito como pediu a
   revisão (docs/revisao-chamados-novos.md): 3, 4, 6 e 8 passos,
   as cartas só ficam mais detalhadas, e as lições são próprias:
   o passo principal e a preparação → chegar no objetivo e deixar
   coisas para trás → terminar pronto para a próxima vez → o que
   foi aberto fecha, o que foi pego guarda (tudo volta ao lugar).
   A cliente é a menina de pijama coral da Casa azul.
   ============================================================ */

const SITUACAO_DENTES = {
  formato: 'passo-a-passo/1',
  id: 'dentes',
  titulo: 'Escovar os dentes',
  local: 'Banheiro',
  area: 'casa-azul',
  cor: '#3f8fb5',
  cliente: 'img/who6.webp',
  cena: 'img/pic8.webp',
  fundo: 'img/level8.webp',
  fundoConclusao: 'img/win8.webp',
  // um quadrinho por passo: escovar os dentes é uma história no tempo
  montagem: 'tirinha',
  // o selo da ideia: entregue na lição do último nível (ver motor.js)
  selo: {
    nome: 'Abre e fecha',
    icone: 'par',
    imagem: 'img/selos/abre-e-fecha.webp',
    frase: 'O que foi aberto, fecha. O que foi pego, guarda. Tudo fica pronto para a próxima vez.',
    exemplo: 'Feche a tampa da pasta.',
    pergunta: 'Que pares assim você conhece? Pense em ligar e desligar.',
  },
  fases: [

    /* ---------- FASE 1 · o passo principal e a preparação (3 passos) ---------- */
    {
      id: 'fase-1',
      titulo: 'Hora de escovar os dentes!',
      instrucao: 'Arraste as cartas para os espaços — ou toque na carta e depois no espaço.',
      mascote: 'Um destes passos é o mais importante. Os outros ajudam ele a dar certo.',
      passos: [
        { id: 'pegar-escova', texto: 'Pegue a escova de dentes.', imagem: 'img/passos/dentes-01.webp', dependeDe: [] },
        {
          id: 'por-pasta', texto: 'Coloque pasta na escova.', imagem: 'img/passos/dentes-03.webp', dependeDe: ['pegar-escova'],
          explicacao: 'Pasta em qual escova? Ela ainda está no copo, e a pasta cai direto na pia!',
        },
        {
          id: 'escovar', texto: 'Escove os dentes.', imagem: 'img/passos/dentes-04.webp', dependeDe: ['por-pasta'],
          explicacao: 'Escovar sem pasta? A escova passa nos dentes, mas eles não ficam limpinhos!',
        },
      ],
      licao: {
        pergunta: 'Qual é o passo mais importante?',
        imagem: 'img/licoes/dentes-1.webp',
        texto: [
          'Escovar é o passo que deixa os dentes limpos: é por causa dele que a tarefa existe.',
          'Pegar a escova e pôr a pasta vêm antes para preparar. Sem eles, o passo mais importante não dá certo.',
          'Num passo a passo, muitos passos existem para preparar o principal.',
        ],
        reflexao: [
          'Se você pulasse a pasta, o que ia acontecer com a escovação?',
          'Numa tarefa sua, qual é o passo mais importante? E quais preparam ele?',
        ],
      },
    },

    /* ---------- FASE 2 · o objetivo chegou, mas ficou coisa para trás (4 passos) ---------- */
    {
      id: 'fase-2',
      titulo: 'A pasta tem tampa!',
      instrucao: 'Chegou uma carta nova. Onde ela entra?',
      mascote: 'Os dentes vão ficar limpos. Mas repare: o que fica fora do lugar no fim?',
      passos: [
        { id: 'pegar-escova', texto: 'Pegue a escova de dentes.', imagem: 'img/passos/dentes-01.webp', dependeDe: [] },
        { id: 'abrir-pasta', texto: 'Abra a tampa da pasta.', imagem: 'img/passos/dentes-02.webp', dependeDe: [] },
        {
          id: 'por-pasta', texto: 'Coloque pasta na escova.', imagem: 'img/passos/dentes-03.webp', dependeDe: ['pegar-escova', 'abrir-pasta'],
          explicacao: {
            'pegar-escova': 'A pasta sai do tubo e não tem escova para receber: cai direto na pia!',
            'abrir-pasta': 'Com a tampa fechada, a pasta não sai do tubo, por mais que você aperte!',
          },
        },
        {
          id: 'escovar', texto: 'Escove os dentes.', imagem: 'img/passos/dentes-04.webp', dependeDe: ['por-pasta'],
          explicacao: 'Escovar sem pasta? A escova passa nos dentes, mas eles não ficam limpinhos!',
        },
      ],
      licao: {
        pergunta: 'Os dentes ficaram limpos. E a pia?',
        imagem: 'img/licoes/dentes-2.webp',
        texto: [
          'Deu certo: os dentes estão limpos!',
          'Mas olhe a pia: a pasta ficou aberta e a escova ficou suja de pasta, fora do copo.',
          'Um passo a passo pode chegar no objetivo e mesmo assim deixar coisas para trás. Pensar nos passos também é pensar nisso.',
        ],
        reflexao: [
          'O que acontece com uma pasta que fica aberta até amanhã?',
          'Em que outra tarefa você termina e deixa alguma coisa fora do lugar?',
        ],
      },
    },

    /* ---------- FASE 3 · terminar pronto para a próxima vez (6 passos) ---------- */
    {
      id: 'fase-3',
      titulo: 'Amanhã tem mais escovação!',
      instrucao: 'Depois de escovar ainda tem passos. Onde eles entram?',
      mascote: 'Duas cartas novas cuidam do que vem depois. Elas precisam esperar quem?',
      passos: [
        { id: 'pegar-escova', texto: 'Pegue a escova de dentes.', imagem: 'img/passos/dentes-01.webp', dependeDe: [] },
        { id: 'abrir-pasta', texto: 'Abra a tampa da pasta.', imagem: 'img/passos/dentes-02.webp', dependeDe: [] },
        {
          id: 'por-pasta', texto: 'Coloque pasta na escova.', imagem: 'img/passos/dentes-03.webp', dependeDe: ['pegar-escova', 'abrir-pasta'],
          explicacao: {
            'pegar-escova': 'A pasta sai do tubo e não tem escova para receber: cai direto na pia!',
            'abrir-pasta': 'Com a tampa fechada, a pasta não sai do tubo, por mais que você aperte!',
          },
        },
        {
          id: 'escovar', texto: 'Escove os dentes.', imagem: 'img/passos/dentes-04.webp', dependeDe: ['por-pasta'],
          explicacao: 'Escovar sem pasta? A escova passa nos dentes, mas eles não ficam limpinhos!',
        },
        {
          id: 'enxaguar', texto: 'Enxágue a boca com água.', imagem: 'img/passos/dentes-05.webp', dependeDe: ['escovar'],
          explicacao: 'Enxaguar agora? Ainda não tem espuma nenhuma para tirar da boca!',
        },
        {
          id: 'lavar-escova', texto: 'Lave a escova na água.', imagem: 'img/passos/dentes-06.webp', dependeDe: ['escovar'],
          explicacao: 'Lavar a escova antes de usar? Ela suja de pasta de novo logo em seguida!',
        },
      ],
      licao: {
        pergunta: 'Por que lavar a escova se os dentes já estão limpos?',
        imagem: 'img/licoes/dentes-3.webp',
        texto: [
          'Os dentes já estavam limpos, mas a escova ainda tinha pasta e sujeira.',
          'Amanhã você escova de novo, com a mesma escova. Lavar agora deixa ela pronta para a próxima vez.',
          'Um passo a passo que se repete todo dia precisa terminar deixando tudo pronto para recomeçar.',
        ],
        reflexao: [
          'O que aconteceria com a escova se ninguém lavasse por uma semana?',
          'Que outra tarefa sua se repete todo dia? O que você deixa pronto para a próxima vez?',
        ],
      },
    },

    /* ---------- FASE 4 · o que abre fecha, o que pega guarda (8 passos) ---------- */
    {
      id: 'fase-4',
      titulo: 'Deixe a pia arrumada!',
      instrucao: 'Duas cartas novas fecham a história. Onde elas entram?',
      mascote: 'Fechar a pasta pode acontecer bem cedo. Mas nunca antes de um certo passo. Qual?',
      passos: [
        { id: 'pegar-escova', texto: 'Pegue a escova de dentes.', imagem: 'img/passos/dentes-01.webp', dependeDe: [] },
        { id: 'abrir-pasta', texto: 'Abra a tampa da pasta.', imagem: 'img/passos/dentes-02.webp', dependeDe: [] },
        {
          id: 'por-pasta', texto: 'Coloque pasta na escova.', imagem: 'img/passos/dentes-03.webp', dependeDe: ['pegar-escova', 'abrir-pasta'],
          explicacao: {
            'pegar-escova': 'A pasta sai do tubo e não tem escova para receber: cai direto na pia!',
            'abrir-pasta': 'Com a tampa fechada, a pasta não sai do tubo, por mais que você aperte!',
          },
        },
        {
          id: 'fechar-pasta', texto: 'Feche a tampa da pasta.', imagem: 'img/passos/dentes-07.webp', dependeDe: ['por-pasta'],
          explicacao: 'Fechar agora? A pasta fica presa no tubo e não chega na escova!',
        },
        {
          id: 'escovar', texto: 'Escove os dentes.', imagem: 'img/passos/dentes-04.webp', dependeDe: ['por-pasta'],
          explicacao: 'Escovar sem pasta? A escova passa nos dentes, mas eles não ficam limpinhos!',
        },
        {
          id: 'enxaguar', texto: 'Enxágue a boca com água.', imagem: 'img/passos/dentes-05.webp', dependeDe: ['escovar'],
          explicacao: 'Enxaguar agora? Ainda não tem espuma nenhuma para tirar da boca!',
        },
        {
          id: 'lavar-escova', texto: 'Lave a escova na água.', imagem: 'img/passos/dentes-06.webp', dependeDe: ['escovar'],
          explicacao: 'Lavar a escova antes de usar? Ela suja de pasta de novo logo em seguida!',
        },
        {
          id: 'guardar-escova', texto: 'Guarde a escova no copo.', imagem: 'img/passos/dentes-08.webp', dependeDe: ['lavar-escova'],
          explicacao: 'Guardar a escova assim? A pasta e a sujeira ficam no copo até amanhã!',
        },
      ],
      licao: {
        pergunta: 'Tudo voltou para o lugar?',
        imagem: 'img/licoes/dentes-4.webp',
        texto: [
          'No começo, a escova estava no copo e a pasta estava fechada. No fim, tudo voltou igualzinho.',
          'Cada passo de pegar ou de abrir ganhou o seu par: guardar e fechar. E o par só vem depois de usar.',
          'Um passo a passo completo e na ordem certa se chama algoritmo. Um bom algoritmo termina deixando tudo pronto para a próxima vez.',
        ],
        reflexao: [
          'Encontre os pares: o que foi aberto e fechado? O que foi pego e guardado?',
          'Que bagunça ficaria na pia se faltasse um dos pares?',
        ],
      },
    },

  ],
};

/* Os chamados que contam para a promoção: os quatro originais, que
   levam a criança da "ordem importa" até o nome "algoritmo". */
const SITUACOES_BASE = [SITUACAO_SANDUICHE, SITUACAO_ROBO, SITUACAO_MOCHILA, SITUACAO_ABELHAS];

/* Os chamados novos: aparecem no mapa, somam estrelas e dicas e dão
   cada um o selo da sua ideia. Com os originais, levam a Agente Sênior. */
const SITUACOES_NOVAS = [SITUACAO_MAOS, SITUACAO_RUA, SITUACAO_LIMONADA, SITUACAO_DENTES];

/* Todos os chamados do jogo, na ordem em que aparecem em cada lugar
   do mapa (os originais primeiro). */
const SITUACOES = [...SITUACOES_BASE, ...SITUACOES_NOVAS];
