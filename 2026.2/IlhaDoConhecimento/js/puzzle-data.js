/* Desafios locais: três etapas curtas por região, sem carregamento externo. */
window.PuzzleData = (() => {
  'use strict';

  const tokens = [
    {id: 'circle', label: 'Círculo verde', symbol: '●'},
    {id: 'triangle', label: 'Triângulo azul', symbol: '▲'},
    {id: 'square', label: 'Quadrado amarelo', symbol: '■'},
    {id: 'star', label: 'Estrela vermelha', symbol: '★'}
  ];

  const regions = {
    forest: {
      name: 'Floresta dos Padrões',
      title: 'O caminho dos símbolos',
      kind: 'sequence',
      keyName: 'Chave verde',
      key: 'assets/hud/chave-verde.png',
      scene: 'assets/puzzles/ambiente/arvore-copa.png',
      caption: 'O caminho da floresta se abre quando você lembra a ordem dos símbolos.',
      reward: 'Você lembrou os caminhos da floresta! A chave verde abre um dos cadeados do gato.',
      rounds: [
        {sequence: ['circle', 'triangle'], hint: 'São dois símbolos. O primeiro é o círculo verde.'},
        {sequence: ['square', 'circle', 'square'], hint: 'São três símbolos. Começa e termina com o quadrado amarelo.'},
        {sequence: ['triangle', 'star', 'circle', 'triangle'], hint: 'São quatro símbolos. O triângulo azul aparece no começo e no fim.'}
      ]
    },
    village: {
      name: 'Vila do Conhecimento',
      title: 'O número escondido',
      kind: 'missing',
      keyName: 'Chave azul',
      key: 'assets/hud/chave-azul.png',
      scene: 'assets/puzzles/ambiente/biblioteca.png',
      caption: 'Ajude a biblioteca a encontrar os números que sumiram de suas páginas.',
      reward: 'As páginas estão completas! A chave azul abre um dos cadeados do gato.',
      rounds: [
        {left: 2, operator: '+', right: null, result: 5, answer: 3, options: [2, 3, 4], hint: 'Comece no 2 e conte até chegar ao 5. Quantos números você avançou?'},
        {left: null, operator: '+', right: 3, result: 7, answer: 4, options: [4, 3, 5], hint: 'Separe 3 dos 7 pontinhos do total. Quantos ficam no outro grupo?'},
        {left: 9, operator: '−', right: null, result: 5, answer: 4, options: [2, 3, 4], hint: 'Você começa com 9 e precisa ficar com 5. Conte quantos devem sair.'}
      ]
    },
    ruins: {
      name: 'Ruínas das Formas',
      title: 'A peça da porta antiga',
      kind: 'rotation',
      keyName: 'Chave vermelha',
      key: 'assets/hud/chave-vermelha.png',
      scene: 'assets/puzzles/ambiente/arco.png',
      caption: 'Gire a peça de pedra para abrir as três portas das ruínas.',
      reward: 'As portas antigas se abriram! A chave vermelha abre um dos cadeados do gato.',
      rounds: [
        {start: 0, target: 90, hint: 'Cada giro é um quarto de volta. Observe o braço da peça e o cantinho amarelo.'},
        {start: 90, target: 270, hint: 'Compare os dois braços e o cantinho amarelo. Você pode girar nos dois sentidos.'},
        {start: 0, target: 180, hint: 'A peça fica de cabeça para baixo depois de meia volta: dois giros de um quarto.'}
      ]
    },
    farm: {
      name: 'Fazenda dos Números',
      title: 'A conta da colheita',
      kind: 'operation',
      keyName: 'Chave amarela',
      key: 'assets/hud/chave-amarela.png',
      scene: 'assets/puzzles/ambiente/moinho.png',
      caption: 'Conte a colheita e ajude o moinho a descobrir o resultado das contas.',
      reward: 'A colheita está contada! A chave amarela abre um dos cadeados do gato.',
      rounds: [
        {left: 3, operator: '+', right: 2, answer: 5, options: [4, 5, 6], hint: 'Junte os 3 pontinhos com os outros 2 e conte todos.'},
        {left: 7, operator: '−', right: 3, answer: 4, options: [4, 3, 5], hint: 'Comece com 7. Tire 3, um de cada vez, e conte o que ficou.'},
        {left: 4, operator: '+', right: 5, answer: 9, options: [8, 10, 9], hint: 'Comece no 5 e conte mais 4: 6, 7, 8… qual vem depois?'}
      ]
    }
  };

  for (const token of tokens) Object.freeze(token);
  for (const region of Object.values(regions)) {
    for (const round of region.rounds) {
      if (round.sequence) Object.freeze(round.sequence);
      if (round.options) Object.freeze(round.options);
      Object.freeze(round);
    }
    Object.freeze(region.rounds);
    Object.freeze(region);
  }
  return Object.freeze({tokens: Object.freeze(tokens), regions: Object.freeze(regions)});
})();
