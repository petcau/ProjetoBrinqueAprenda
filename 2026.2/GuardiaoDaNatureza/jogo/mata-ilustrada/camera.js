"use strict";
(() => {
  window.MataCamera = {
    scale(width, height, touch) {
      return Math.max(
        width / 1280,
        height / 720,
        touch ? Math.min(1.22, Math.max(0.93, height / 365)) : 1.18,
      );
    },
  };
})();
