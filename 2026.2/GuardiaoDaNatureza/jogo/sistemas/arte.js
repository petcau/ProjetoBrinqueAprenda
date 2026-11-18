"use strict";
(() => {
  const root = new URL("../../", document.currentScript.src);
  function url(value) {
    const original = new URL(value, document.baseURI),
      key = original.pathname.startsWith(root.pathname)
        ? original.pathname.slice(root.pathname.length)
        : null;
    return key && window.GuardiaoArteManifesto?.[key]
      ? new URL(window.GuardiaoArteManifesto[key], root).href
      : original.href;
  }
  window.GuardiaoArte = Object.freeze({ url, root: root.href });
})();
