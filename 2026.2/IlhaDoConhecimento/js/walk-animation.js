(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    factory(exports);
  } else {
    factory((global.WalkAnimation = global.WalkAnimation || {}));
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this, function (exports) {
  'use strict';

  const FW = 48, FH = 56, FRAME_TIME = 8 / 60;           // 7,5 quadros por segundo
  // setor: 0 direita, 1 cima-direita, 2 cima, 3 cima-esquerda, 4 esquerda, 5 baixo-esquerda, 6 baixo, 7 baixo-direita
  const SECTOR_TO_ROW = [2, 7, 3, 6, 1, 4, 0, 5];       // setor -> linha da folha

  // x, y com y POSITIVO PARA BAIXO. prevSector e hysteresisDeg são opcionais.
  function sectorFromVector(x, y, prevSector = null, hysteresisDeg = 0) {
    const ang = (Math.atan2(-y, x) * 180 / Math.PI + 360) % 360;
    let s = Math.round(ang / 45) % 8;
    if (prevSector !== null && prevSector !== s && hysteresisDeg > 0) {
      const d = Math.abs(((ang - prevSector * 45 + 540) % 360) - 180);
      if (d < 22.5 + hysteresisDeg) s = prevSector;
    }
    return s;
  }
  const rowFromSector = (s) => SECTOR_TO_ROW[s];
  const advanceAnim = (moving, animTime, dt) => (moving ? animTime + dt : 0);
  const frameColumn = (moving, animTime) => (moving ? Math.floor(animTime / FRAME_TIME) % 4 : 0);

  exports.FW = FW;
  exports.FH = FH;
  exports.FRAME_TIME = FRAME_TIME;
  exports.SECTOR_TO_ROW = SECTOR_TO_ROW;
  exports.sectorFromVector = sectorFromVector;
  exports.rowFromSector = rowFromSector;
  exports.advanceAnim = advanceAnim;
  exports.frameColumn = frameColumn;
});

