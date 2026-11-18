"use strict";
self.window = self;
importScripts(
  "../vida-natural/movimento.js?v=mata-1",
  "../raizes/caminhos.js?v=mata-1",
  "../raizes/navegacao.js?v=mata-1",
  "../cuidado-acessivel/geometria.js?v=mata-1",
);
let phase, nav;
self.onmessage = ({ data: m }) => {
  try {
    if (m.type === "init") {
      phase = m.phase;
      if (phase === 1) {
        self.GuardiaoElenco = { actors: () => [] };
        importScripts(
          "../floresta-viva/mundo.js?v=mata-1",
          "layout.js?v=mata-1",
          "geometria-floresta.js?v=mata-1",
        );
      } else nav = new GuardiaoNavegacao.Navigation(m.data);
      postMessage({ type: "ready" });
      return;
    }
    const before = performance.now();
    let route;
    if (phase === 1) {
      FlorestaMundo.setHazards(m.hazards || []);
      route = m.approach
        ? FlorestaMundo.approach(m.from, m.to, m.approach)
        : FlorestaMundo.route(m.from, m.to);
    } else {
      nav.setDynamic(m.dynamic || []);
      route = m.approach
        ? nav.approach(m.from, m.to, m.approach)
        : nav.route(m.from, m.to);
      if (!route.length) route = nav.approach(m.from, m.to, 12);
    }
    postMessage({ id: m.id, route, duration: performance.now() - before });
  } catch (e) {
    postMessage({ id: m.id, error: e.message });
  }
};
