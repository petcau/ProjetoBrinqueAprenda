/* ============================================================
   arrasto.js — manipulação das cartas (SEM validação: quem valida
   é o jogo.js, ouvindo o evento 'carta-movida')

   Três jeitos de mover a mesma carta:

   1. ARRASTAR (mouse e dedo) — Pointer Events + setPointerCapture.
      A carta original NUNCA muda de pai durante o arrasto
      (reparentar cancelaria a captura do ponteiro): quem segue o
      ponteiro é um CLONE com position:fixed; a carta de verdade só
      muda de lugar no DOM na hora de soltar.

   2. TOQUE SIMPLES — tocar na carta seleciona, tocar no espaço
      coloca. Mais confiável que arrastar para mãos pequenas.

   3. TECLADO — Tab foca a carta, Enter/Espaço seleciona, setas
      escolhem o espaço (a bandeja é o último alvo), Enter coloca,
      Esc cancela.

   Regras de movimento (valem para os três jeitos):
   - soltar em espaço vazio       → carta entra no espaço
   - soltar em espaço ocupado     → as duas cartas trocam de lugar
   - soltar na bandeja            → carta volta para a bandeja
   - soltar em qualquer outro lugar → carta volta para a bandeja
   ============================================================ */

'use strict';

(function () {

  /* ---------------------- constantes ---------------------- */

  // deslocamento mínimo (px) para um toque virar arrasto —
  // abaixo disso é um toque simples (seleção)
  const LIMIAR_ARRASTO = 8;

  // no toque, o dedo cobre a carta: o clone é desenhado
  // este tanto de px ACIMA do ponto de contato
  const ELEVACAO_TOQUE = 48;

  // faixa junto às bordas do tabuleiro que dispara a rolagem
  // automática durante o arrasto (celular)
  const MARGEM_ROLAGEM = 56;

  /* ---------------------- elementos ---------------------- */

  const tabuleiro = document.querySelector('.tabuleiro');
  const grade     = document.querySelector('.tabuleiro-grade');
  const bandeja   = document.querySelector('.bandeja');
  const fila      = document.querySelector('.bandeja-fila');
  const leitor    = document.querySelector('.leitor-avisos');
  // no celular quem rola é a tela inteira do nível, não o tabuleiro
  const telaFase  = tabuleiro ? tabuleiro.closest('.screen') : null;

  // o clone nasce dentro do palco (#stage) para herdar as medidas e o
  // estilo das cartas, que são relativas ao palco. Onde fica o ponto
  // (0, 0) do position:fixed depende do navegador (a janela ou o
  // palco), então ele é MEDIDO no começo de cada arrasto.
  const palco     = document.querySelector('#stage') || document.body;

  const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------------------- estado ---------------------- */

  let pendente    = null;  // apertou mas ainda não passou do limiar
  let arrasto     = null;  // arrasto em andamento
  let selecionada = null;  // carta escolhida por toque simples/teclado
  let indiceAlvo  = -1;    // alvo atual da navegação por setas
  let fimDoArrasto = 0;    // quando o último arrasto terminou (para engolir
                           // o clique que o navegador dispara logo depois)

  function espacos() {
    return [...grade.querySelectorAll('.espaco')];
  }

  // alvos que as setas percorrem: todos os espaços e, por último, a bandeja
  function alvosTeclado() {
    return [...espacos(), bandeja];
  }

  function legendaDe(carta) {
    const p = carta.querySelector('.carta-legenda');
    return p ? p.textContent.trim() : 'carta';
  }

  /* ============================================================
     ONDE A CARTA ESTÁ / PARA ONDE ELA VAI
     ============================================================ */

  function origemDe(carta) {
    const espaco = carta.closest('.espaco');
    if (espaco) return { tipo: 'espaco', espaco };
    const li = carta.closest('.bandeja-fila > li');
    return { tipo: 'bandeja', indice: [...fila.children].indexOf(li) };
  }

  // cria um lugar novo na bandeja e põe a carta nele;
  // com índice, entra naquela posição (usado na troca, para a carta
  // deslocada ocupar o lugar de onde a outra saiu)
  function criarLugarNaBandeja(carta, indice = null) {
    const li = document.createElement('li');
    li.appendChild(carta);
    const irmaos = fila.children;
    if (indice !== null && indice >= 0 && indice < irmaos.length) {
      fila.insertBefore(li, irmaos[indice]);
    } else {
      fila.appendChild(li);
    }
  }

  // depois de qualquer movimento: ajusta as classes dos espaços e
  // remove da bandeja os lugares que ficaram vazios
  function sincronizar() {
    for (const espaco of espacos()) {
      const tem = !!espaco.querySelector('.carta');
      espaco.classList.toggle('preenchido', tem);
      espaco.classList.toggle('vazio', !tem);
    }
    for (const li of [...fila.children]) {
      if (!li.querySelector('.carta')) li.remove();
    }
  }

  /**
   * Move a carta para o alvo, aplicando as regras de troca.
   * alvo: { tipo:'espaco', espaco } ou { tipo:'bandeja' }
   * Devolve a frase para o leitor de tela (ou null se nada mudou).
   */
  function executarMovimento(carta, alvo) {
    const origem = origemDe(carta);
    let aviso = null;

    if (alvo.tipo === 'espaco') {
      const espaco = alvo.espaco;
      const ocupante = espaco.querySelector('.carta');
      const numero = espaco.querySelector('.espaco-numero').textContent;

      if (ocupante === carta) {
        // soltou no mesmo lugar: nada a fazer
      } else if (ocupante) {
        // espaço ocupado: as duas trocam de lugar
        if (origem.tipo === 'espaco') origem.espaco.appendChild(ocupante);
        else criarLugarNaBandeja(ocupante, origem.indice);
        espaco.appendChild(carta);
        aviso = `"${legendaDe(carta)}" trocou de lugar com "${legendaDe(ocupante)}" e ficou no espaço ${numero}.`;
      } else {
        espaco.appendChild(carta);
        aviso = `"${legendaDe(carta)}" colocada no espaço ${numero}.`;
      }
    } else {
      if (origem.tipo !== 'bandeja') {
        criarLugarNaBandeja(carta);
        aviso = `"${legendaDe(carta)}" voltou para a bandeja.`;
      }
    }

    sincronizar();

    // avisa o resto do jogo (jogo.js valida a sequência a cada movimento)
    document.dispatchEvent(new CustomEvent('carta-movida', {
      detail: { carta, alvo, mudou: aviso !== null },
    }));

    return aviso;
  }

  /* ============================================================
     ARRASTO (Pointer Events)
     ============================================================ */

  function aoApertar(ev) {
    if (arrasto || pendente) return;      // já tem um dedo/botão agindo
    if (!ev.isPrimary) return;            // ignora o segundo dedo
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;

    const carta = ev.target.closest('.carta');
    if (!carta) return;

    // ainda não é arrasto: só vira arrasto depois do limiar.
    // É esse limiar que separa "toque simples" de "arrastar" e
    // impede que um dedo trêmulo sobre a bandeja vire arrasto sem querer.
    pendente = {
      carta,
      id: ev.pointerId,
      tipo: ev.pointerType,
      x0: ev.clientX,
      y0: ev.clientY,
    };

    // a partir daqui todos os eventos deste ponteiro vêm para a carta,
    // mesmo que o dedo saia de cima dela
    try { carta.setPointerCapture(ev.pointerId); } catch (e) { /* ponteiro já se foi */ }
  }

  function aoMover(ev) {
    if (pendente && ev.pointerId === pendente.id) {
      const dist = Math.hypot(ev.clientX - pendente.x0, ev.clientY - pendente.y0);
      if (dist >= LIMIAR_ARRASTO) iniciarArrasto(ev);
      return;
    }
    if (arrasto && ev.pointerId === arrasto.id) {
      arrasto.x = ev.clientX;
      arrasto.y = ev.clientY;
      posicionarClone();
      atualizarDestaque();
    }
  }

  function iniciarArrasto(ev) {
    const { carta, id, tipo, x0, y0 } = pendente;
    pendente = null;

    cancelarSelecao(); // arrastar limpa qualquer seleção por toque

    const rect = carta.getBoundingClientRect();

    // o clone é quem viaja; a carta original fica no lugar, apagada
    const clone = carta.cloneNode(true);
    clone.classList.remove('carta-selecionada', 'carta-piscar', 'carta-dica',
                           'carta-atencao', 'carta-assentou');
    clone.classList.add('carta-clone');
    clone.removeAttribute('tabindex');
    clone.setAttribute('aria-hidden', 'true');
    clone.style.width = rect.width + 'px';
    clone.style.height = rect.height + 'px';
    palco.appendChild(clone);
    // com transform zerado, o clone mostra onde está o (0, 0) dele
    clone.style.transform = 'none';
    const base = clone.getBoundingClientRect();

    carta.classList.add('carta-origem');
    document.body.classList.add('arrastando');

    arrasto = {
      carta, clone, id, tipo,
      // ponto da carta onde o ponteiro APERTOU (o clone não "pula"
      // mesmo que o dedo já tenha andado até passar do limiar)
      desvioX: x0 - rect.left,
      desvioY: y0 - rect.top,
      // no toque, desenha acima do dedo
      elevacao: tipo === 'mouse' ? 0 : ELEVACAO_TOQUE,
      larg: rect.width,
      alt: rect.height,
      x: ev.clientX,
      y: ev.clientY,
      bx: base.left,
      by: base.top,
      alvo: null,
      px: 0,
      py: 0,
    };

    posicionarClone();
    atualizarDestaque();
    requestAnimationFrame(passoRolagem);
  }

  function posicionarClone() {
    const a = arrasto;
    a.px = a.x - a.desvioX;
    a.py = a.y - a.desvioY - a.elevacao;
    a.clone.style.transform = `translate(${a.px - a.bx}px, ${a.py - a.by}px) scale(1.06)`;
  }

  // ponto usado para descobrir o que está "embaixo" da carta:
  // o CENTRO do clone (no toque, é o que a criança está vendo,
  // não o ponto escondido sob o dedo)
  function pontoDeTeste() {
    const a = arrasto;
    const cx = Math.max(1, Math.min(window.innerWidth - 2, a.px + a.larg / 2));
    const cy = Math.max(1, Math.min(window.innerHeight - 2, a.py + a.alt / 2));
    return [cx, cy];
  }

  function atualizarDestaque() {
    const [cx, cy] = pontoDeTeste();
    // o clone tem pointer-events:none, então elementFromPoint o atravessa
    const sob = document.elementFromPoint(cx, cy);
    const espaco = sob ? sob.closest('.espaco') : null;
    const naBandeja = !espaco && sob && sob.closest('.bandeja');

    aplicarDestaque(espaco || (naBandeja ? bandeja : null));
    arrasto.alvo = espaco ? { tipo: 'espaco', espaco }
                 : naBandeja ? { tipo: 'bandeja' }
                 : null;
  }

  function aplicarDestaque(el) {
    document.querySelectorAll('.destacado').forEach(d => {
      if (d !== el) d.classList.remove('destacado');
    });
    if (el) el.classList.add('destacado');
  }

  // roda a cada quadro enquanto há arrasto: se a carta chega perto da
  // borda de um tabuleiro rolado (celular), rola a área sozinho
  function passoRolagem() {
    if (!arrasto) return;

    if (tabuleiro.scrollHeight > tabuleiro.clientHeight + 2) {
      const r = tabuleiro.getBoundingClientRect();
      const [cx, cy] = pontoDeTeste();
      const dentro = cx > r.left && cx < r.right && cy > r.top - 8 && cy < r.bottom + 8;

      if (dentro) {
        let v = 0;
        if (cy < r.top + MARGEM_ROLAGEM)         v = -velocidade(r.top + MARGEM_ROLAGEM - cy);
        else if (cy > r.bottom - MARGEM_ROLAGEM) v =  velocidade(cy - (r.bottom - MARGEM_ROLAGEM));
        if (v) {
          tabuleiro.scrollTop += v;
          atualizarDestaque(); // o que está sob a carta mudou junto
        }
      }
    }

    // celular: a tela do nível rola inteira. Com 7 ou 8 cartas, o
    // tabuleiro e a bandeja não cabem juntos; levando a carta para
    // perto do alto (ou do rodapé fixo), a tela rola sozinha
    if (telaFase && telaFase.scrollHeight > telaFase.clientHeight + 2) {
      const r = telaFase.getBoundingClientRect();
      const rodape = telaFase.querySelector('.rodape');
      const fixo = rodape && getComputedStyle(rodape).position === 'sticky';
      const fundo = fixo ? rodape.getBoundingClientRect().top : r.bottom;
      const cy = pontoDeTeste()[1];
      let v = 0;
      if (cy < r.top + MARGEM_ROLAGEM)      v = -velocidade(r.top + MARGEM_ROLAGEM - cy);
      else if (cy > fundo - MARGEM_ROLAGEM) v =  velocidade(cy - (fundo - MARGEM_ROLAGEM));
      if (v) {
        const antes = telaFase.scrollTop;
        telaFase.scrollTop += v;
        if (telaFase.scrollTop !== antes) atualizarDestaque();
      }
    }

    requestAnimationFrame(passoRolagem);
  }

  function velocidade(profundidade) {
    return Math.min(16, 3 + profundidade / 6); // acelera perto da borda
  }

  function aoSoltar(ev) {
    if (pendente && ev.pointerId === pendente.id) {
      // nunca passou do limiar: é um toque simples —
      // o evento 'click' que vem a seguir cuida da seleção
      pendente = null;
      return;
    }
    if (arrasto && ev.pointerId === arrasto.id) finalizarArrasto();
  }

  function finalizarArrasto() {
    const a = arrasto;
    arrasto = null;

    document.body.classList.remove('arrastando');
    aplicarDestaque(null);
    fimDoArrasto = performance.now();

    // fora de qualquer alvo válido → devolve para a bandeja
    const alvo = a.alvo || { tipo: 'bandeja' };
    const aviso = executarMovimento(a.carta, alvo);

    if (alvo.tipo === 'bandeja') {
      // garante que o lugar de pouso esteja visível antes de medir
      a.carta.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    pousarClone(a);
    if (aviso) anunciar(aviso);
  }

  // o clone voa suavemente até a posição final da carta e some
  function pousarClone(a) {
    const terminar = () => {
      a.clone.remove();
      a.carta.classList.remove('carta-origem');
    };

    if (reduzMovimento.matches) { terminar(); return; }

    const r = a.carta.getBoundingClientRect();
    a.clone.style.transition = 'transform .18s ease';
    a.clone.style.transform = `translate(${r.left - a.bx}px, ${r.top - a.by}px) scale(1)`;
    a.clone.addEventListener('transitionend', terminar, { once: true });
    setTimeout(terminar, 300); // garantia caso a transição não dispare
  }

  // o sistema tomou o ponteiro (ligação, gesto do sistema...):
  // nada mudou no DOM, então basta desfazer o visual
  function aoCancelarPonteiro(ev) {
    if (pendente && ev.pointerId === pendente.id) pendente = null;
    if (arrasto && ev.pointerId === arrasto.id) {
      const a = arrasto;
      arrasto = null;
      document.body.classList.remove('arrastando');
      aplicarDestaque(null);
      pousarClone(a);
    }
  }

  /* ============================================================
     TOQUE SIMPLES — selecionar e colocar
     ============================================================ */

  function aoClicar(ev) {
    if (performance.now() - fimDoArrasto < 400) return; // eco do arrasto, não é toque

    const carta  = ev.target.closest('.carta');
    const espaco = ev.target.closest('.espaco');
    const naBandeja = ev.target.closest('.bandeja');

    if (!selecionada) {
      if (carta) selecionar(carta);
      return;
    }

    // já existe carta selecionada
    if (carta === selecionada) { cancelarSelecao(); return; }   // tocar de novo cancela
    if (espaco) { moverSelecionadaPara({ tipo: 'espaco', espaco }); return; }
    if (carta)  { selecionar(carta); return; }                  // outra carta da bandeja: muda a seleção
    if (naBandeja) { moverSelecionadaPara({ tipo: 'bandeja' }); return; }
    cancelarSelecao();                                          // tocou fora: desiste
  }

  function selecionar(carta) {
    cancelarSelecao();
    selecionada = carta;
    indiceAlvo = -1;
    carta.classList.add('carta-selecionada');
    carta.setAttribute('aria-pressed', 'true');
    anunciar(`"${legendaDe(carta)}" selecionada. Toque em um espaço para colocar, ou use as setas e Enter.`);
  }

  function cancelarSelecao() {
    if (!selecionada) return;
    selecionada.classList.remove('carta-selecionada');
    selecionada.setAttribute('aria-pressed', 'false');
    selecionada = null;
    indiceAlvo = -1;
    aplicarDestaque(null);
  }

  function moverSelecionadaPara(alvo) {
    const carta = selecionada;
    cancelarSelecao();
    const aviso = executarMovimento(carta, alvo);
    if (aviso) anunciar(aviso);
    carta.focus({ preventScroll: true }); // o foco acompanha a carta
  }

  /* ============================================================
     TECLADO
     ============================================================ */

  function aoTeclar(ev) {
    const tecla = ev.key;
    const ativa = tecla === 'Enter' || tecla === ' ';
    const carta = ev.target instanceof Element ? ev.target.closest('.carta') : null;

    // Enter/Espaço sobre uma carta ainda não selecionada: seleciona
    // e já destaca o primeiro espaço vazio como ponto de partida
    if (ativa && carta && carta !== selecionada) {
      ev.preventDefault();
      selecionar(carta);
      indiceAlvo = indiceInicial();
      destacarAlvoTeclado();
      return;
    }

    if (!selecionada) return;

    if (tecla === 'ArrowRight' || tecla === 'ArrowDown' ||
        tecla === 'ArrowLeft'  || tecla === 'ArrowUp') {
      ev.preventDefault();
      const alvos = alvosTeclado();
      const delta = (tecla === 'ArrowRight' || tecla === 'ArrowDown') ? 1 : -1;
      indiceAlvo = indiceAlvo < 0
        ? indiceInicial()
        : (indiceAlvo + delta + alvos.length) % alvos.length;
      destacarAlvoTeclado();
      return;
    }

    if (tecla === 'Escape') { cancelarSelecao(); return; }

    if (ativa) {
      ev.preventDefault();
      if (indiceAlvo >= 0) {
        const el = alvosTeclado()[indiceAlvo];
        moverSelecionadaPara(el === bandeja ? { tipo: 'bandeja' } : { tipo: 'espaco', espaco: el });
      } else {
        cancelarSelecao();
      }
    }
  }

  function indiceInicial() {
    const lista = espacos();
    const vazio = lista.findIndex(e => !e.querySelector('.carta'));
    return vazio >= 0 ? vazio : 0;
  }

  function destacarAlvoTeclado() {
    const alvos = alvosTeclado();
    const el = alvos[indiceAlvo];
    aplicarDestaque(el);
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' });

    const nome = el === bandeja
      ? 'a bandeja'
      : `o espaço ${el.querySelector('.espaco-numero').textContent}` +
        (el.querySelector('.carta') ? ` (ocupado por "${legendaDe(el.querySelector('.carta'))}")` : ' (vazio)');
    anunciar(`Alvo: ${nome}. Enter para colocar.`);
  }

  /* ============================================================
     LEITOR DE TELA
     ============================================================ */

  function anunciar(texto) {
    if (!leitor) return;
    leitor.textContent = '';
    // trocar o texto em dois tempos garante que repetições também sejam lidas
    setTimeout(() => { leitor.textContent = texto; }, 30);
  }

  /* ============================================================
     PARTIDA
     ============================================================ */

  function preparar() {
    document.querySelectorAll('.carta').forEach(carta => {
      carta.tabIndex = 0;
      carta.setAttribute('role', 'button');
      carta.setAttribute('aria-pressed', 'false');
    });

    document.addEventListener('pointerdown', aoApertar);
    window.addEventListener('pointermove', aoMover);
    window.addEventListener('pointerup', aoSoltar);
    window.addEventListener('pointercancel', aoCancelarPonteiro);
    document.addEventListener('click', aoClicar);
    document.addEventListener('keydown', aoTeclar);

    // sem menu de contexto no toque longo nem arrasto nativo do navegador
    document.addEventListener('contextmenu', ev => {
      if (ev.target.closest('.carta')) ev.preventDefault();
    });
    document.addEventListener('dragstart', ev => ev.preventDefault());

    sincronizar();
  }

  preparar();

  // a dica do jogo.js coloca a carta com as MESMAS regras de
  // movimento (troca, volta para a bandeja, aviso de 'carta-movida')
  window.Arrasto = {
    mover(carta, alvo) {
      cancelarSelecao();
      const aviso = executarMovimento(carta, alvo);
      if (aviso) anunciar(aviso);
    },
  };

})();
