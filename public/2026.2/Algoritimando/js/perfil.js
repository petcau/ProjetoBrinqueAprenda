/* ============================================================
   perfil.js — quem está jogando (localStorage)

   O progresso de cada chamado (fase, estrelas, cartas) fica no
   progresso.js. Aqui fica o que é do AGENTE, e não de um chamado:

     {
       nome:       nome digitado no crachá
       avatar:     "0" a "5" — qual dos 6 agentes (ver CORPO no app.js)
       comecou:    já passou pela abertura e pelo crachá
       dicas:      estoque de dicas — começa com DICAS_INICIAIS e
                   ganha +1 a cada fase concluída (é o "+1 dica" da
                   tela de lição)
       concluidos: { idDoChamado: true } — chamados que já foram
                   até a última fase pelo menos uma vez (continua
                   valendo quando a criança joga de novo)
       promovido:  já viu a promoção de Estagiário para Agente
     }

   Sem localStorage (modo anônimo restrito, memória cheia) o jogo
   segue funcionando — só não lembra.
   ============================================================ */

'use strict';

(function () {

  // a prévia do editor do professor usa uma chave própria: testar
  // um nível lá não mexe no jogo de quem usa este computador
  const CHAVE = window.ALGORITIMANDO_PREVIA ? 'algoritimando-previa-perfil' : 'algoritimando-perfil';
  const DICAS_INICIAIS = 1;

  function padrao() {
    return { nome: 'Agente', avatar: '0', comecou: false, dicas: DICAS_INICIAIS,
             concluidos: {}, promovido: false, senior: false };
  }

  function ler() {
    const p = padrao();
    try {
      const salvo = JSON.parse(localStorage.getItem(CHAVE) || 'null');
      if (salvo && typeof salvo === 'object') {
        if (typeof salvo.nome === 'string' && salvo.nome.trim()) p.nome = salvo.nome.trim().slice(0, 14);
        if (/^[0-5]$/.test(salvo.avatar)) p.avatar = salvo.avatar;
        p.comecou = salvo.comecou === true;
        if (Number.isInteger(salvo.dicas) && salvo.dicas >= 0) p.dicas = salvo.dicas;
        if (salvo.concluidos && typeof salvo.concluidos === 'object') p.concluidos = salvo.concluidos;
        p.promovido = salvo.promovido === true;
        // Agente Sênior: só vale para quem já é Agente
        p.senior = p.promovido && salvo.senior === true;
      }
    } catch { /* segue com o padrão */ }
    return p;
  }

  const dados = ler();

  function gravar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(dados)); } catch { /* segue sem memória */ }
  }

  /** Jogar tudo de novo: zera dicas, chamados e promoção (o nome fica). */
  function recomecar() {
    const p = padrao();
    dados.dicas = p.dicas;
    dados.concluidos = {};
    dados.promovido = false;
    dados.senior = false;
    gravar();
  }

  window.Perfil = { dados, gravar, recomecar };

})();
