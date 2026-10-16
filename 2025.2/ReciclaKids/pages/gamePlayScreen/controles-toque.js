/* ============================================================================
   Controles na tela (setas + acao), para o ReciclaKids funcionar no celular.

   O jogo so andava com o teclado: gamePlayScreen.js escuta um unico `keydown`
   e decide pelo `key.code` ('ArrowUp', 'ArrowLeft', ..., 'Enter'). Num celular
   nao ha teclado, entao nao havia como jogar.

   Estes botoes NAO duplicam a logica: cada um dispara o MESMO evento de
   teclado que a tecla correspondente dispararia. Tudo o que ja funciona com as
   setas e com o Enter passa a funcionar no toque, e nada precisou mudar no
   gamePlayScreen.js — inclusive o que vier a ser acrescentado la depois.

   Este arquivo e carregado pelas quatro telas de fase (rua, praca, floresta,
   praia). O gamePlayScreen.html da pasta acima e um modelo que nenhuma tela
   carrega, por isso nao entra aqui.
   ========================================================================= */
(function () {
  var TECLAS = [
    { classe: 'cima', tecla: 'ArrowUp', texto: '▲', rotulo: 'Mover para cima' },
    { classe: 'esquerda', tecla: 'ArrowLeft', texto: '◀', rotulo: 'Mover para a esquerda' },
    { classe: 'direita', tecla: 'ArrowRight', texto: '▶', rotulo: 'Mover para a direita' },
    { classe: 'baixo', tecla: 'ArrowDown', texto: '▼', rotulo: 'Mover para baixo' },
    { classe: 'acao', tecla: 'Enter', texto: 'Jogar<br>lixo', rotulo: 'Jogar o lixo na lixeira' },
  ];

  function montar() {
    if (document.getElementById('controles-toque')) return;

    var painel = document.createElement('div');
    painel.id = 'controles-toque';
    painel.setAttribute('aria-label', 'Controles do personagem');

    TECLAS.forEach(function (def) {
      var botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'tecla-toque ' + def.classe;
      botao.innerHTML = def.texto;
      botao.setAttribute('aria-label', def.rotulo);

      /* pointerdown em vez de click: responde no instante do toque, sem os
         ~300ms que alguns navegadores de celular esperam para descartar a
         hipotese de duplo toque. */
      botao.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        document.dispatchEvent(
          new KeyboardEvent('keydown', {
            code: def.tecla,
            key: def.tecla,
            bubbles: true,
          })
        );
      });

      /* o toque no botao nao deve rolar a pagina nem abrir menu de contexto */
      botao.addEventListener('touchstart', function (e) { e.preventDefault(); }, { passive: false });
      botao.addEventListener('contextmenu', function (e) { e.preventDefault(); });

      painel.appendChild(botao);
    });

    document.body.appendChild(painel);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', montar);
  } else {
    montar();
  }
})();
