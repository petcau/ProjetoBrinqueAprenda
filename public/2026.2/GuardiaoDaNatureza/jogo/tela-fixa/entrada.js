"use strict";
(() => {
  if (window.top !== window) return;
  const root = new URL("../../", document.currentScript.src);
  const shell = new URL("index.html", root);
  shell.searchParams.set(
    "rota",
    location.pathname.slice(root.pathname.length) +
      location.search +
      location.hash,
  );
  location.replace(shell);
})();
