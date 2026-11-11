/* Escolhe a coluna da folha da personagem a cada tick ou frame.
   Folha personagem_spritesheet_8_direcoes_v2.png (4 colunas × 8 linhas de 48×56):
   Colunas: 0 parado, 1 passo A, 2 parado, 3 passo B.
   Linhas: 0 baixo, 1 esquerda, 2 direita, 3 cima, 4 baixo-esq, 5 baixo-dir, 6 cima-esq, 7 cima-dir. */
window.HeroAnimation = (() => {
  'use strict';
  const FRAMES = 4, IDLE = 0;
  function column(p) {
    if (p.moving || (p.walk && p.walk > 0)) {
      if (typeof p.animTime === 'number' && typeof WalkAnimation !== 'undefined') {
        return WalkAnimation.frameColumn(true, p.animTime);
      }
      return Math.floor((p.walk || 0) / 8) % FRAMES;
    }
    return IDLE;
  }
  function resolveSheet(dir) {
    return { isDiagonal: dir >= 4, row: dir || 0, fallback: false };
  }
  return Object.freeze({column, resolveSheet, IDLE});
})();
