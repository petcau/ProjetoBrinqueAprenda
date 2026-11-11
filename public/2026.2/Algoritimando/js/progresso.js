/* ============================================================
   progresso.js — memória do jogo entre visitas (localStorage)

   Guarda, por chamado, onde a criança está:

     {
       fase:    índice da PRÓXIMA fase a jogar (0 = ainda não
                começou; igual ao total de fases = concluiu tudo)
       niveis:  estrelas (1 a 3) de cada fase já concluída, pela
                ordem das fases — jogar de novo guarda a melhor
     }

   A chave de cada chamado é o id da situação; os chamados abertos
   de um arquivo do professor ganham o prefixo "prof:", para nunca
   disputarem com os que vêm no jogo.

   Se o localStorage estiver indisponível (modo anônimo restrito,
   memória cheia), o jogo segue funcionando — só não lembra.
   ============================================================ */

'use strict';

(function () {

  // a prévia do editor do professor usa uma chave própria: testar
  // um nível lá não mexe no jogo de quem usa este computador
  const CHAVE = window.ALGORITIMANDO_PREVIA ? 'algoritimando-previa-progresso' : 'algoritimando-progresso';

  function lerTudo() {
    try {
      const bruto = localStorage.getItem(CHAVE);
      const obj = bruto ? JSON.parse(bruto) : null;
      return (obj && typeof obj === 'object') ? obj : {};
    } catch { return {}; }
  }

  function gravarTudo(tudo) {
    try { localStorage.setItem(CHAVE, JSON.stringify(tudo)); } catch { /* segue sem memória */ }
  }

  /** Progresso de um chamado, sempre no formato completo. */
  function ler(id) {
    const p = lerTudo()[id];
    if (!p || typeof p !== 'object') return { fase: 0, niveis: [] };
    return {
      fase: Number.isInteger(p.fase) && p.fase >= 0 ? p.fase : 0,
      niveis: Array.isArray(p.niveis)
        ? p.niveis.map(n => (Number.isInteger(n) && n >= 0 && n <= 3 ? n : 0))
        : [],
    };
  }

  function gravar(id, dados) {
    const tudo = lerTudo();
    tudo[id] = { fase: dados.fase, niveis: dados.niveis };
    gravarTudo(tudo);
  }

  /** Recomeçar do zero: apaga fase e estrelas do chamado. */
  function apagar(id) {
    const tudo = lerTudo();
    delete tudo[id];
    gravarTudo(tudo);
  }

  /** Estrelas de um chamado (soma dos níveis). */
  function estrelas(id) {
    return ler(id).niveis.reduce((soma, n) => soma + n, 0);
  }

  /** Estrelas dos chamados do jogo, somadas (os do professor, com
      chave "prof:", contam à parte). */
  function total() {
    return Object.keys(lerTudo())
      .filter(id => !id.startsWith('prof:'))
      .reduce((soma, id) => soma + estrelas(id), 0);
  }

  window.Progresso = { ler, gravar, apagar, estrelas, total };

})();
