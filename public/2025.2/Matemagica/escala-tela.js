/* Reduz a prancheta original de 1920 x 1080 sem alterar sua composicao. */
(function () {
  var palco = document.getElementById('game-scale');
  if (!palco) return;

  var LARGURA = 1920;
  var ALTURA = 1080;

  function ajustar() {
    var escala = Math.min(
      window.innerWidth / LARGURA,
      window.innerHeight / ALTURA,
      1
    );
    var x = (window.innerWidth - LARGURA * escala) / 2;
    var y = (window.innerHeight - ALTURA * escala) / 2;

    palco.style.transform =
      'translate(' + x + 'px, ' + y + 'px) scale(' + escala + ')';

    /* Publica a escala para o CSS. Serve para elementos que ficam ancorados
       na prancheta (para acompanharem a arte) mas NAO devem encolher junto
       com ela — o botao Menu e um deles: ele se desfaz da escala com
       scale(1 / var(--escala)). */
    palco.style.setProperty('--escala', String(escala));
  }

  window.addEventListener('resize', ajustar);
  window.addEventListener('orientationchange', ajustar);
  ajustar();
})();
