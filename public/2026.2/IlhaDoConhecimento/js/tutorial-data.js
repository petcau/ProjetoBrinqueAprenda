/* Dados e roteiros dos tutoriais para cada puzzle (Ilha do Conhecimento).
   Estrutura pura em JavaScript (sem JSON) para compatibilidade nativa file://. */
window.TutorialData = (() => {
  'use strict';

  return {
    algebra: {
      id: 'algebra',
      tituloGeral: 'A Balança Misteriosa',
      passos: [
        {
          titulo: 'Equilibre a balança',
          texto: 'Arraste as joias para os dois lados ficarem iguais.',
          demo: 'algebra-balanca'
        }
      ]
    },
    logica: {
      id: 'logica',
      tituloGeral: 'Labirinto das Runas',
      passos: [
        {
          titulo: 'Siga a ordem das runas',
          texto: 'Veja quais runas acendem. Depois vá até elas na mesma ordem!',
          demo: 'logica-ordem'
        },
        {
          titulo: 'Errou? Volta ao início',
          texto: 'Se for na runa errada, você volta ao começo. Sem problema: tente de novo!',
          demo: 'logica-erro'
        }
      ]
    },
    geometria: {
      id: 'geometria',
      tituloGeral: 'Ruínas das Formas',
      passos: [
        {
          titulo: 'Arraste a peça',
          texto: 'Puxe a peça até o lugar de encaixe.',
          demo: 'geometria-arrastar'
        },
        {
          titulo: 'Gire a peça',
          texto: 'Toque na peça da barra para ela girar.',
          demo: 'geometria-girar'
        },
        {
          titulo: 'Tire a peça',
          texto: 'Toque numa peça já encaixada e ela volta para a barra.',
          demo: 'geometria-tirar'
        }
      ]
    },
    operacoes: {
      id: 'operacoes',
      tituloGeral: 'Campos do Moinho',
      passos: [
        {
          titulo: 'Leia a placa',
          texto: 'Tudo o que você precisa fazer está escrito na placa, lá em cima.',
          demo: 'operacoes-placa'
        },
        {
          titulo: 'Coloque os sacos no moinho',
          texto: 'Leve os sacos da mesa até o moinho. Aqui são dois sacos!',
          demo: 'operacoes-arrastar'
        }
      ]
    }
  };
})();
