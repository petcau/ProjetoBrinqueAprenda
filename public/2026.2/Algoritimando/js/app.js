/* ============================================================
   app.js — as telas em volta da partida

   menu → abertura (4 quadros) → crachá do agente → central de
   chamados → fase (jogo.js) → lição (conclusao.js) → … → central
   → promoção a Agente (metade dos chamados, quaisquer) → central →
   promoção a Agente Sênior (os 8 chamados) → tela final.

   Cada tela é uma <section class="screen"> do index.html; só uma
   fica com a classe "on" por vez (irPara). Quem joga a fase é o
   jogo.js; aqui só se escolhe O QUE jogar e para onde ir depois.
   ============================================================ */

'use strict';

(function () {

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  const P = Perfil.dados;

  const ABERTURA = [
    'Na cidade de Algoritimando, os chamados de ajuda não param de chegar.',
    'Este é o Robô-guia. Ele sabe onde cada pessoa precisa de ajuda.',
    'Você vai ser o novo estagiário. Aqui está o seu crachá!',
    'No mapa, cada alfinete com um rosto é um chamado. Ensine o robô, passo a passo.',
  ];

  /* ---------------- navegação ---------------- */

  function irPara(id) {
    $$('.screen').forEach(s => s.classList.toggle('on', s.id === id));
    Som.clique();
  }
  window.irPara = irPara;

  /* Os agentes: o número é o P.avatar. Cada um tem o retrato
     (img/avN.webp), a cena de promoção (img/promoN.webp) e o corpo
     inteiro recortado para a tela final. O 6 é o agente secreto. */
  const CORPO = ['menina', 'menino', 'afro-menina', 'afro-menino', 'latina', 'latino', 'secreto'];

  const avatarSrc = () => `img/av${P.avatar}.webp`;

  // topo de todas as telas: rosto + nome do agente e total de estrelas
  function atualizarTopo() {
    $$('.chip.who').forEach(e => {
      e.textContent = '';
      const img = document.createElement('img');
      img.className = 'ci';
      img.src = avatarSrc();
      img.alt = '';
      e.append(img, ' ' + P.nome);
      e.setAttribute('aria-label', `Agente ${P.nome}. Trocar de agente`);
    });
    const total = Progresso.total();
    $$('.gStars').forEach(e => { e.textContent = total; });
  }

  // imagens não são arrastáveis (o arrasto das cartas é outro, por
  // Pointer Events) — evita o "fantasma" da imagem ao segurar o mouse
  document.addEventListener('dragstart', ev => {
    if (ev.target instanceof HTMLImageElement) ev.preventDefault();
  });

  const palco = $('#stage');

  /* ---------------- Esc fecha a janela aberta ----------------
     Vale para todas as janelas (.modal): fecha a que está por cima e
     devolve o foco ao botão que a abriu. A lição e a cena em tela
     cheia já tratam o Esc por conta própria. */
  let antesDaJanela = null;
  new MutationObserver(mudancas => {
    for (const m of mudancas) {
      if (!m.target.classList.contains('modal')) continue;
      const abriu = m.target.classList.contains('on') && !(m.oldValue || '').split(' ').includes('on');
      if (abriu && !m.target.contains(document.activeElement)) antesDaJanela = document.activeElement;
    }
  }).observe(palco, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
  document.addEventListener('keydown', ev => {
    if (ev.key !== 'Escape') return;
    const abertas = $$('.modal.on:not(.cena-cheia)');
    if (!abertas.length) return;
    ev.preventDefault();
    ev.stopPropagation();
    abertas[abertas.length - 1].classList.remove('on');
    if (antesDaJanela && document.contains(antesDaJanela)) antesDaJanela.focus({ preventScroll: true });
  }, true);

  /* ---------------- menu ---------------- */

  function irParaMenu() {
    $('#bPlay').textContent = P.comecou ? 'Continuar' : 'Jogar';
    // sem progresso, não há o que reiniciar
    $('#bReiniciar').hidden = !P.comecou;
    irPara('menu');
  }

  $('#bPlay').onclick = () => {
    // "seguir" e não "central": quem já tinha concluído tudo antes de
    // existir a segunda promoção a recebe aqui
    if (P.comecou) seguir();
    else { revendo = false; quadro(0); irPara('story'); }
  };

  // rever a abertura: no fim (ou no "Pular") volta para o menu
  $('#bHistoria').onclick = () => {
    revendo = P.comecou;
    quadro(0);
    irPara('story');
  };

  /* Reiniciar apaga o progresso, o perfil, os protótipos jogados e o
     agente secreto; os ajustes de som ficam. Pede confirmação, porque
     não tem volta. */
  $('#bReiniciar').onclick = () => $('#reiniciar').classList.add('on');
  $('#bReiniciarNao').onclick = () => $('#reiniciar').classList.remove('on');
  $('#bReiniciarSim').onclick = () => {
    ['algoritimando-progresso', 'algoritimando-perfil', 'algoritimando-montagem', CHAVE_SEGREDO].forEach(k => {
      try { localStorage.removeItem(k); } catch { /* sem memória: nada a apagar */ }
    });
    location.reload();
  };
  Som.abrirMenuBotao($('#bSound'));
  // atalho de som no topo de todas as telas, ao lado do crachá
  const ICONE_SOM = '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M4 9v6h4l5 4V5L8 9H4Z"/>' +
    '<path class="onda" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
    '<path class="risco" d="M16 9l6 6M22 9l-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
    '</svg>';
  $$('.top').forEach(topo => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip som-atalho';
    b.title = 'Configurações';
    b.setAttribute('aria-label', 'Configurações: sons e tela cheia');
    b.innerHTML = ICONE_SOM;
    const depois = topo.querySelector('.chip.who') || topo.querySelector('.chip.home');
    if (depois) depois.after(b); else topo.prepend(b);
    Som.abrirMenuBotao(b, true);
  });
  $('#bSonsFechar').onclick = () => $('#sons').classList.remove('on');

  /* Tela cheia (no painel de configurações): usa a Fullscreen API do
     navegador. Onde ela não existe (iPhone), a linha não aparece. O
     botão acompanha o estado real: sair com Esc também atualiza. */
  const raiz = document.documentElement;
  const emTelaCheia = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  const podeTelaCheia = !!(raiz.requestFullscreen || raiz.webkitRequestFullscreen);
  function mostrarTelaCheia() {
    const sim = emTelaCheia();
    const b = $('#bTelaCheia');
    b.textContent = sim ? 'Ligada' : 'Desligada';
    b.setAttribute('aria-pressed', String(sim));
    b.classList.toggle('mudo', !sim);
  }
  $('#linhaTelaCheia').hidden = !podeTelaCheia;
  $('#bTelaCheia').onclick = () => {
    try {
      if (emTelaCheia()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else {
        const pedido = (raiz.requestFullscreen || raiz.webkitRequestFullscreen).call(raiz);
        if (pedido && pedido.catch) pedido.catch(() => {});
      }
    } catch { /* o navegador recusou: o jogo segue como está */ }
  };
  document.addEventListener('fullscreenchange', mostrarTelaCheia);
  document.addEventListener('webkitfullscreenchange', mostrarTelaCheia);
  mostrarTelaCheia();
  $('#bHow').onclick = () => $('#how').classList.add('on');
  $('#bHowClose').onclick = () => $('#how').classList.remove('on');
  $$('[data-home]').forEach(b => { b.onclick = irParaMenu; });

  /* ---------------- abertura ---------------- */

  let qi = 0;
  let revendo = false;   // abertura vista de novo pelo menu
  function quadro(i) {
    qi = i;
    // a arte aparece inteira; o fundo desfocado (a mesma imagem)
    // preenche a sobra, seja qual for o formato da tela
    // ?v= faz o navegador buscar a imagem nova quando ela muda
    $('#story').style.setProperty('--arte', `url(img/story${i + 1}.webp?v=202611110727)`);
    $('#sceneText').textContent = ABERTURA[i];
    $('#dots').innerHTML = ABERTURA.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('');
    const ultimo = i === ABERTURA.length - 1;
    $('#bNext').textContent = ultimo ? (revendo ? 'Voltar ao menu' : 'Começar!') : 'Avançar ›';
  }
  const fimDaHistoria = () => (revendo ? irParaMenu() : irParaCracha());
  $('#bNext').onclick = () => (qi < ABERTURA.length - 1 ? quadro(qi + 1) : fimDaHistoria());
  $('#bSkip').onclick = fimDaHistoria;

  /* ---------------- crachá ---------------- */

  function irParaCracha() {
    irPara('char');
    $('#nameIn').focus();
  }

  /* Os três cargos. Agente: os 4 chamados originais. Agente Sênior:
     os 8 — por isso ninguém vira Sênior sem ser Agente, seja qual for
     a ordem em que jogou. */
  const CARGOS = ['Estagiário', 'Agente', 'Agente Sênior'];
  const cargo = () => (P.senior ? 2 : P.promovido ? 1 : 0);

  /* O crachá da tela "Quem é você, agente?": foto, nome, cargo
     (Estagiário, Agente ou Agente Sênior), as estrelas do cargo
     e um código do agente que sai do nome e do rosto escolhidos. */
  function atualizarCracha(nome, balancar) {
    nome = nome || 'Agente';
    $('#badgeName').textContent = nome;
    $('#badgeFace').src = avatarSrc();
    $('#badgeCargo').textContent = CARGOS[cargo()];
    $('#cracha').classList.toggle('secreto', P.avatar === '6');
    $$('#badgeEstrelas img').forEach((e, k) => e.classList.toggle('on', k <= cargo()));
    // os selos das ideias: os conquistados acesos, os outros apagados
    const selos = $('#badgeSelos');
    selos.textContent = '';
    SITUACOES.filter(s => s.selo).forEach(s => selos.append(Comum.criarSelo(s.selo, !!P.concluidos[s.id])));
    selos.hidden = !selos.children.length;
    let n = 7 + Number(P.avatar);
    for (const ch of nome) n = (n * 31 + ch.charCodeAt(0)) % 10000;
    $('#badgeCodigo').textContent = 'AG-' + String(n).padStart(4, '0');
    if (balancar) {
      const c = $('#cracha');
      c.classList.remove('balanca');
      void c.offsetWidth;   // reinicia a animação
      c.classList.add('balanca');
    }
  }

  // o crachá do topo (rosto + nome) volta para esta tela: dá para
  // trocar de agente ou de nome sem perder o progresso
  $$('.chip.who').forEach(b => {
    b.onclick = () => {
      $('#nameIn').value = P.nome;
      $$('.avatar').forEach(x => x.classList.toggle('sel', x.dataset.a === P.avatar));
      atualizarCracha(P.nome);
      irParaCracha();
    };
  });
  $$('.avatar').forEach(b => {
    b.onclick = () => {
      $$('.avatar').forEach(x => x.classList.remove('sel'));
      b.classList.add('sel');
      P.avatar = b.dataset.a;
      atualizarCracha($('#nameIn').value.trim(), true);
      Som.clique();
    };
  });
  $('#nameIn').oninput = e => atualizarCracha(e.target.value.trim());

  /* Agente secreto (só para quem sabe): 10 toques SEGUIDOS na
     terceira estrela do crachá revelam o 7º agente na escolha. A
     estrela não reage a nada (nem brilho, nem cursor de clique), e
     uma pausa maior que INTERVALO_SEGREDO entre dois toques zera a
     contagem: ninguém chega lá sem querer. O segredo fica guardado
     neste aparelho até o progresso ser reiniciado (esquecerSegredo). */
  const CHAVE_SEGREDO = 'algoritimando-segredo';
  const TOQUES_SEGREDO = 10;
  const INTERVALO_SEGREDO = 600;   // ms entre um toque e o próximo
  let toquesSegredo = 0;
  let ultimoToque = 0;
  function segredoAberto() {
    try { return localStorage.getItem(CHAVE_SEGREDO) === '1'; } catch { return false; }
  }
  function mostrarSecreto(animar) {
    const b = $('.avatar-secreto');
    b.hidden = false;
    $('.avatars').classList.add('com-secreto');
    if (animar) {
      b.classList.add('revela');
      b.addEventListener('animationend', () => b.classList.remove('revela'), { once: true });
    }
  }
  if (segredoAberto() || P.avatar === '6') mostrarSecreto(false);

  /* Recomeçar o jogo também fecha o segredo: o agente secreto some da
     escolha e, se era o escolhido, volta o primeiro agente. */
  function esquecerSegredo() {
    try { localStorage.removeItem(CHAVE_SEGREDO); } catch { /* nada a apagar */ }
    $('.avatar-secreto').hidden = true;
    $('.avatars').classList.remove('com-secreto');
    if (P.avatar === '6') {
      P.avatar = '0';
      Perfil.gravar();
      $$('.avatar').forEach(x => x.classList.toggle('sel', x.dataset.a === P.avatar));
      atualizarCracha(P.nome);
      atualizarTopo();
    }
  }
  const estrelaSegredo = $$('#badgeEstrelas img')[2];
  estrelaSegredo.addEventListener('click', () => {
    if (!$('.avatar-secreto').hidden) return;
    const agora = Date.now();
    toquesSegredo = agora - ultimoToque <= INTERVALO_SEGREDO ? toquesSegredo + 1 : 1;
    ultimoToque = agora;
    if (toquesSegredo < TOQUES_SEGREDO) return;
    toquesSegredo = 0;
    try { localStorage.setItem(CHAVE_SEGREDO, '1'); } catch { /* fica só nesta visita */ }
    // o momento especial: a cena dourada com o som de mistério
    $('#segredo').classList.add('on');
    Som.segredo();
    $('#bSegredoOk').focus({ preventScroll: true });
  });
  $('#bSegredoOk').onclick = () => {
    $('#segredo').classList.remove('on');
    mostrarSecreto(true);
    $('.avatar-secreto').click();
  };
  $('#bConfirm').onclick = () => {
    P.comecou = true;
    P.nome = $('#nameIn').value.trim().slice(0, 14) || 'Agente';
    Perfil.gravar();
    central(`Bem-vindo, ${P.nome}! Toque num lugar do mapa para ver os chamados.`);
  };

  /* ---------------- central de chamados ---------------- */

  const feitosDe = lista => lista.filter(s => P.concluidos[s.id]).length;
  const faltamDe = lista => lista.length - feitosDe(lista);

  /* As promoções contam QUALQUER chamado concluído, sem separar os
     originais dos novos: Agente com metade dos chamados, Agente
     Sênior com todos. */
  const META_AGENTE = () => Math.ceil(SITUACOES.length / 2);
  const faltamParaProxima = () => (cargo() === 0 ? Math.max(0, META_AGENTE() - feitosDe(SITUACOES))
    : cargo() === 1 ? faltamDe(SITUACOES) : 0);

  /* A promoção que já foi conquistada e ainda não foi mostrada. */
  function promocaoPendente() {
    if (!P.promovido && feitosDe(SITUACOES) >= META_AGENTE()) return 'agente';
    if (P.promovido && !P.senior && faltamDe(SITUACOES) === 0) return 'senior';
    return null;
  }

  /* O começo do jogo: o sanduíche vem primeiro, para dar um início e
     uma direção. Até ele ser concluído, o mapa fica na sombra e só a
     Casa pode ser tocada (e, nela, só o sanduíche). Quem já tinha
     concluído outro chamado antes desta regra não é trancado. */
  const PRIMEIRO = 'sanduiche';
  const cidadeLiberada = () => !!P.concluidos[PRIMEIRO] || feitosDe(SITUACOES) > 0;
  const lugarDoPrimeiro = () => (SITUACOES.find(s => s.id === PRIMEIRO) || {}).area;

  /* Para onde ir depois de um chamado: a promoção, se houver uma
     esperando; senão, a central. */
  function seguir(mensagem) {
    const p = promocaoPendente();
    if (p) promocao(p); else central(mensagem);
  }

  const plural = (n, um, varios) => (n === 1 ? um : varios.replace('#', n));

  /* emProgresso = true mostra os protótipos (em-progresso.js) no
     lugar dos chamados. O progresso deles fica numa chave "prof:",
     como os do professor: não soma estrelas nem conta como
     concluído. */
  let emProgresso = false;
  const chaveDe = s => (emProgresso ? 'prof:em-progresso:' + s.id : s.id);

  /* ---------------- mapa da cidade ----------------
     A central é o mapa da abertura (story1.webp). Cada lugar é a casa
     de um cliente; tocar nele abre os chamados daquele lugar (campo
     "area" da situação); um lugar pode juntar vários chamados. As
     posições são em % da imagem, em cima de cada construção. */
  /* x e y: a ponta do marcador, em % da imagem — logo acima ou ao
     lado da construção, para o marcador não cobrir o desenho */
  const LUGARES = [
    { id: 'casa',      nome: 'Casa',      rosto: 'img/who1.webp', x: 7,  y: 27 },
    { id: 'escola',    nome: 'Escola',    rosto: 'img/who3.webp', x: 70, y: 26 },
    { id: 'fabrica',   nome: 'Fábrica',   rosto: 'img/who2.webp', x: 28, y: 42 },
    { id: 'faixa',     nome: 'Faixa',     rosto: 'img/who5.webp', x: 39, y: 47 },
    { id: 'casa-azul', nome: 'Casa azul', rosto: 'img/who6.webp', x: 62, y: 37 },
    { id: 'limonada',  nome: 'Limonada',  rosto: 'img/who5.webp', x: 51, y: 76 },
    { id: 'jardim',    nome: 'Jardim',    rosto: 'img/who4.webp', x: 89, y: 44 },
  ];
  const doLugar = id => SITUACOES.filter(s => s.area === id);

  /* rosto de cliente: se o arquivo ainda não existe (a menina da
     Casa azul, por exemplo), mostra o Robô-guia no lugar */
  function rosto(img, src) {
    img.onerror = () => { img.onerror = null; img.src = 'img/guide.webp'; };
    img.src = src;
  }

  function desenharMapa() {
    // a imagem e os marcadores ficam num miolo: no celular ele é mais
    // largo que a tela e o mapa rola para os lados
    const quadro = $('#mapa');
    quadro.textContent = '';
    const mapa = document.createElement('div');
    mapa.className = 'mapa-miolo';
    quadro.append(mapa);
    const liberada = cidadeLiberada();
    quadro.classList.toggle('trancado', !liberada);
    if (!liberada) {
      // a sombra: um círculo de luz sobre a Casa e o resto escuro
      const foco = document.createElement('span');
      foco.className = 'mapa-foco';
      foco.setAttribute('aria-hidden', 'true');
      foco.style.setProperty('--x', FOCO_PRIMEIRO.x + '%');
      foco.style.setProperty('--y', FOCO_PRIMEIRO.y + '%');
      mapa.append(foco);
    }
    for (const lugar of LUGARES) {
      const lista = doLugar(lugar.id);
      if (!lista.length) continue;
      const feitos = lista.filter(s => P.concluidos[s.id]).length;
      const botao = document.createElement('button');
      botao.type = 'button';
      const trancado = !liberada && lugar.id !== lugarDoPrimeiro();
      // brilha o lugar que ainda tem chamado por fazer (todos contam
      // para a promoção); antes do sanduíche, só a Casa brilha
      const alvo = !trancado && cargo() < 2 && lista.some(s => !P.concluidos[s.id]);
      botao.className = 'lugar' + (feitos === lista.length ? ' feito' : '') + (alvo ? ' alvo' : '') +
        (trancado ? ' trancado' : '') + (!liberada && !trancado ? ' primeiro' : '');
      if (trancado) {
        botao.disabled = true;
        botao.tabIndex = -1;
      }
      // a posição vai em variáveis: no celular o mapa é mais alto e
      // corta as laterais da imagem, e o CSS refaz a conta do "left"
      botao.style.setProperty('--x', lugar.x + '%');
      botao.style.setProperty('--y', lugar.y + '%');
      botao.setAttribute('aria-label', trancado
        ? `${lugar.nome}: abre depois do sanduíche`
        : `${lugar.nome}: ${feitos} de ${lista.length} ${lista.length === 1 ? 'chamado concluído' : 'chamados concluídos'}`);
      botao.innerHTML = `<span class="lugar-rosto"><img alt=""></span>
        <span class="lugar-nome"></span><span class="lugar-conta"></span>`;
      rosto(botao.querySelector('img'), lugar.rosto);
      botao.querySelector('.lugar-nome').textContent = lugar.nome;
      botao.querySelector('.lugar-conta').textContent = `${feitos}/${lista.length}`;
      botao.onclick = () => abrirLugar(lugar);
      mapa.append(botao);
    }
    // indicador de arrastar: só aparece quando o mapa é maior que a
    // tela (celular) e some quando a criança arrasta pela primeira vez
    const arraste = document.createElement('div');
    arraste.className = 'mapa-arraste';
    arraste.setAttribute('aria-hidden', 'true');
    arraste.innerHTML = `<span class="mapa-arraste-dica">
        <svg viewBox="0 0 48 24"><path d="M4 12h40M4 12l6-6M4 12l6 6M44 12l-6-6M44 12l-6 6"/></svg>
        Arraste para ver a cidade</span>`;
    quadro.prepend(arraste);
    // começa centrado (no PC não rola, então não muda nada); antes do
    // sanduíche, começa na Casa, que fica na beira esquerda
    requestAnimationFrame(() => {
      quadro.scrollLeft = liberada ? (quadro.scrollWidth - quadro.clientWidth) / 2 : 0;
      const rola = quadro.scrollWidth > quadro.clientWidth + 4;
      arraste.hidden = !rola || !liberada || jaArrastou;
      const esconder = () => {
        jaArrastou = true;
        arraste.hidden = true;
      };
      // o scrollLeft acima também dispara "scroll": só vale o da criança
      setTimeout(() => {
        quadro.addEventListener('scroll', esconder, { once: true, passive: true });
      }, 300);
      quadro.addEventListener('pointerdown', esconder, { once: true, passive: true });
    });
  }
  let jaArrastou = false;

  /* centro da luz sobre a Casa, em % da imagem do mapa (a casa e o
     alfinete dela cabem no círculo) */
  const FOCO_PRIMEIRO = { x: 12, y: 18 };

  function abrirLugar(lugar) {
    const modal = $('#local');
    modal.querySelector('.local-nome').textContent = lugar.nome;
    rosto(modal.querySelector('.local-rosto'), lugar.rosto);
    const lista = modal.querySelector('.local-chamados');
    lista.textContent = '';
    doLugar(lugar.id).forEach(s => lista.append(cartaoDeChamado(s, SITUACOES.indexOf(s))));
    modal.classList.add('on');
    if (!emProgresso && !cidadeLiberada()) {
      const aviso = document.createElement('p');
      aviso.className = 'local-aviso';
      aviso.textContent = 'Comece pelo sanduíche. Depois, a cidade toda se abre!';
      lista.prepend(aviso);
    }
  }
  $('#local .local-fechar').onclick = () => $('#local').classList.remove('on');

  /* o cartão de um chamado: no lugar do mapa e na lista "Em progresso" */
  function cartaoDeChamado(s, i) {
    const chave = chaveDe(s);
    const prog = Progresso.ler(chave);
    const feito = emProgresso ? prog.fase >= s.fases.length : !!P.concluidos[s.id];
    const emAndamento = prog.fase > 0 && prog.fase < s.fases.length;
    const espera = !emProgresso && !cidadeLiberada() && s.id !== PRIMEIRO;

    const cartao = document.createElement('div');
    cartao.className = 'call' + (feito ? ' done' : '');
    if (s.cor) cartao.style.setProperty('--c', s.cor);
    cartao.innerHTML = `
      <div class="who"><img alt=""></div>
      <div class="pic"><img alt=""></div>
      <div class="meta">
        <div><b></b><small></small></div>
        <button class="btn"></button>
      </div>`;
    rosto(cartao.querySelector('.who img'), s.cliente || 'img/guide.webp');
    if (s.cena) cartao.querySelector('.pic img').src = s.cena;
    else {
      // protótipo ainda sem ilustração: o quadro tracejado do jogo
      const pic = cartao.querySelector('.pic');
      pic.textContent = 'ilustração do chamado';
      pic.classList.add('figura-vazia');
    }
    cartao.querySelector('b').textContent = s.titulo;

    const nivel = emAndamento ? prog.fase + 1 : feito ? s.fases.length : 1;
    // "Chamado 5 · Banheiro · Nível 1 de 4": cada parte no seu <span>,
    // para o celular mostrar o lugar e o nível em linhas separadas
    const partes = [[`${emProgresso ? 'Protótipo' : 'Chamado'} ${i + 1}`, 'call-num']];
    if (s.local) partes.push([s.local, 'call-local']);
    partes.push([`Nível ${nivel} de ${s.fases.length}`, 'call-nivel']);
    const linha = cartao.querySelector('small');
    partes.forEach(([texto, classe], k) => {
      if (k) {
        const ponto = document.createElement('span');
        ponto.className = 'call-sep';
        ponto.textContent = ' · ';
        linha.append(ponto);
      }
      const parte = document.createElement('span');
      parte.className = classe;
      parte.textContent = texto;
      linha.append(parte);
    });

    const botao = cartao.querySelector('.btn');
    if (feito && !emAndamento) {
      // concluído: a média de estrelas dos níveis (de 1 a 3) e um
      // botão claro para jogar de novo — ele abre a lista de níveis
      const media = Math.round(Progresso.estrelas(chave) / s.fases.length);
      const estrelas = document.createElement('span');
      estrelas.className = 'st';
      estrelas.setAttribute('role', 'img');
      estrelas.setAttribute('aria-label', `${media} de 3 estrelas`);
      estrelas.innerHTML = Comum.estrelasHTML(media);
      // as estrelas ficam logo acima do botão
      const coluna = document.createElement('div');
      coluna.className = 'rejogar-coluna';
      botao.before(coluna);
      coluna.append(estrelas, botao);
      botao.classList.add('rejogar');
      botao.textContent = 'Jogar de novo ›';
      botao.title = 'Escolher um nível para jogar de novo';
    } else if (espera) {
      botao.textContent = 'Depois do sanduíche';
    } else {
      botao.textContent = emAndamento ? 'Continuar ›' : 'Atender ›';
    }
    if (espera) {
      // trancado até o sanduíche: aparece, mas não abre
      cartao.classList.add('call-espera');
      cartao.setAttribute('aria-disabled', 'true');
      cartao.setAttribute('aria-label', `${s.titulo}: abre depois do sanduíche`);
      botao.tabIndex = -1;
      botao.setAttribute('aria-hidden', 'true');
      return cartao;
    }
    // o cartão inteiro abre o chamado; o botão fica só como sinal
    // visual do que vai acontecer (e não recebe foco separado)
    const abrir = () => {
      $('#local').classList.remove('on');
      if (feito && !emAndamento) abrirNiveis(s, chave); else iniciarSituacao(s, chave);
    };
    botao.tabIndex = -1;
    botao.setAttribute('aria-hidden', 'true');
    cartao.classList.add('call-clicavel');
    cartao.tabIndex = 0;
    cartao.setAttribute('role', 'button');
    cartao.setAttribute('aria-label', `${s.titulo}: ${botao.textContent.replace('›', '').trim()}`);
    cartao.onclick = abrir;
    cartao.onkeydown = ev => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); abrir(); }
    };
    return cartao;
  }

  function central(mensagem, modoEmProgresso = false) {
    emProgresso = modoEmProgresso;
    atualizarTopo();
    $('#local').classList.remove('on');
    const lista = $('#calls');
    lista.textContent = '';
    $('#hub').classList.toggle('em-progresso', emProgresso);
    $('#hub .title-box').textContent = emProgresso ? 'Em progresso' : 'Mapa da cidade';
    $('#bEmProgresso').textContent = emProgresso ? '‹ Voltar ao mapa' : 'Em progresso';
    $('#mapa').hidden = emProgresso;
    lista.hidden = !emProgresso;

    if (emProgresso) {
      SITUACOES_EM_PROGRESSO.forEach((s, i) => lista.append(cartaoDeChamado(s, i)));
      $('#hubMsg').textContent = mensagem ||
        'Protótipos de chamados novos. O progresso daqui não conta para o jogo.';
      irPara('hub');
      return;
    }

    desenharMapa();
    // uma barra só, com todos os chamados; embaixo, o próximo objetivo
    const n = feitosDe(SITUACOES), total = SITUACOES.length;
    const faltam = faltamParaProxima();
    const proximo = CARGOS[cargo() + 1];
    $('#bRestart').hidden = n < total;
    $('#progTxt').textContent = `${n} de ${total}`;
    $('#progBar').style.width = (n / total) * 100 + '%';
    $('#progMeta').textContent = proximo
      ? `${plural(faltam, 'Falta 1', 'Faltam #')} para virar ${proximo}`
      : 'Você é Agente Sênior!';
    $('#bIdeias').hidden = !SITUACOES.some(s => s.selo);
    $('#hubMsg').textContent = mensagem ||
      (!cidadeLiberada() ? 'Seu primeiro chamado é na Casa: ajude a fazer um sanduíche. Depois, a cidade toda se abre!'
        : n === 0 ? 'Toque num lugar do mapa para ver os chamados de lá. Todo chamado concluído conta para a sua promoção.'
        : proximo ? `Ótimo trabalho! ${plural(faltam, 'Falta 1 chamado', 'Faltam # chamados')} para você virar ${proximo}. Pode ser qualquer um do mapa.`
        : 'Todos os chamados concluídos! Você pode jogar qualquer um de novo.');
    irPara('hub');
  }

  // fim da última fase de um chamado
  document.addEventListener('situacao-concluida', ev => {
    const s = ev.detail.situacao;
    if (SITUACOES_EM_PROGRESSO.includes(s)) {
      central(`Protótipo "${s.titulo}" concluído!`, true);
    } else if (!SITUACOES.includes(s)) {
      central(`Chamado do professor "${s.titulo}" concluído!`);
    } else if (s.id === PRIMEIRO && feitosDe(SITUACOES) === 1) {
      seguir('Você liberou a cidade! Agora escolha qualquer lugar do mapa.');
    } else {
      seguir(s.selo
        ? `Chamado "${s.titulo}" concluído! O selo "${s.selo.nome}" está no seu crachá.`
        : `Chamado "${s.titulo}" concluído! Escolha o próximo.`);
    }
  });

  /* ---------------- minhas ideias (os selos) ----------------
     Cada selo com a frase da ideia, uma carta do próprio chamado como
     exemplo e uma pergunta para conversar. O que ainda não foi
     conquistado mostra só de qual chamado vem. */
  function abrirIdeias() {
    const lista = $('#ideias .ideias-lista');
    lista.textContent = '';
    SITUACOES.filter(s => s.selo).forEach(s => {
      const ganho = !!P.concluidos[s.id];
      const li = document.createElement('li');
      li.className = 'ideia' + (ganho ? '' : ' apagada');
      if (s.cor) li.style.setProperty('--c', s.cor);
      const texto = document.createElement('div');
      const nome = document.createElement('b');
      nome.textContent = s.selo.nome;
      texto.append(nome);
      const linha = (classe, conteudo) => {
        const p = document.createElement('p');
        p.className = classe;
        p.textContent = conteudo;
        texto.append(p);
      };
      if (ganho) {
        linha('ideia-frase', s.selo.frase);
        if (s.selo.exemplo) linha('ideia-exemplo', `Exemplo: "${s.selo.exemplo}"`);
        if (s.selo.pergunta) linha('ideia-pergunta', s.selo.pergunta);
      } else {
        linha('ideia-frase', `Conclua "${s.titulo}" para ganhar este selo.`);
      }
      li.append(Comum.criarSelo(s.selo, ganho), texto);
      lista.append(li);
    });
    $('#ideias').classList.add('on');
  }
  $('#bIdeias').onclick = abrirIdeias;
  $('#bIdeiasFechar').onclick = () => $('#ideias').classList.remove('on');

  /* ---------------- promoção e final ---------------- */

  /* A cena de promoção serve às duas: mudam o crachá e os textos. O
     crachá de Sênior, enquanto não existir, usa o de Agente. */
  const PROMOCOES = {
    agente: { de: 0, para: 1, cracha: 'img/ui/cracha-agente.webp' },
    senior: { de: 1, para: 2, cracha: 'img/ui/cracha-senior.webp' },
  };
  let ultimaPromocao = null;

  function promocao(tipo) {
    const p = PROMOCOES[tipo];
    ultimaPromocao = tipo;
    if (tipo === 'senior') P.senior = true; else P.promovido = true;
    Perfil.gravar();
    atualizarTopo();
    $('#promo').style.setProperty('--img', `url(img/promo${P.avatar}.webp)`);
    const cracha = $('#promoCracha');
    cracha.onerror = () => { cracha.onerror = null; cracha.src = PROMOCOES.agente.cracha; };
    cracha.src = p.cracha;
    cracha.alt = `Crachá de ${CARGOS[p.para]}`;
    $('#promoDe').textContent = CARGOS[p.de];
    $('#promoPara').textContent = CARGOS[p.para];
    $('#promoFrase').textContent = `Agora você é ${CARGOS[p.para]}!`;
    irPara('promo');
    Som.vitoria();
  }

  /* Depois da promoção: se a outra já está esperando (perfil antigo
     que já tinha tudo concluído vira Agente e Sênior de uma vez),
     ela vem em seguida. A "Missão cumprida" é só de quem concluiu tudo;
     quem virou Agente volta ao mapa, que ainda tem chamados. */
  $('#bPromoNext').onclick = () => {
    const pendente = promocaoPendente();
    if (pendente) { promocao(pendente); return; }
    if (ultimaPromocao === 'senior') { telaFinal(); return; }
    const faltam = faltamDe(SITUACOES);
    central(`Você agora é Agente! ${plural(faltam, 'A cidade ainda tem 1 chamado', 'A cidade ainda tem # chamados')} para você virar Agente Sênior.`);
  };

  /* Quem aparece na tela final: os clientes dos chamados concluídos,
     o agente e o Robô-guia. Um cliente de dois chamados aparece uma
     vez só; figura que ainda não existe some sozinha. */
  const NO_FINAL = {
    sanduiche: 'img/cliente0.webp', maos: 'img/cliente0.webp',
    robo: 'img/cliente1.webp',
    mochila: 'img/cliente2.webp',
    abelhas: 'img/cliente3.webp',
    rua: 'img/cliente4.webp', limonada: 'img/cliente4.webp',
    dentes: 'img/cliente5.webp',
  };

  function telaFinal() {
    const clientes = [...new Set(SITUACOES.filter(s => P.concluidos[s.id]).map(s => NO_FINAL[s.id]).filter(Boolean))];
    const figura = (src, classe) => {
      const img = document.createElement('img');
      img.className = classe;
      img.alt = '';
      img.onerror = () => img.remove();
      img.src = src;
      return img;
    };
    // metade dos clientes de cada lado do agente e do robô
    const meio = Math.ceil(clientes.length / 2);
    const classeDe = src => (src === NO_FINAL.abelhas ? 'bee' : 'c');
    const elenco = $('#cast');
    elenco.textContent = '';
    elenco.classList.toggle('cheio', clientes.length > 4);
    elenco.append(
      ...clientes.slice(0, meio).map(src => figura(src, classeDe(src))),
      figura(`img/agente-${CORPO[+P.avatar]}.webp`, 'ag'),
      figura('img/robo-feliz.webp', 'rb'),
      ...clientes.slice(meio).map(src => figura(src, classeDe(src))),
    );
    const selos = $('#finSelos');
    selos.textContent = '';
    SITUACOES.filter(s => s.selo && P.concluidos[s.id]).forEach(s => selos.append(Comum.criarSelo(s.selo)));
    selos.hidden = !selos.children.length;
    $('#finName').textContent = P.nome;
    $('#finStarsN').textContent = Progresso.total();
    irPara('final');
  }
  $('#bToHub').onclick = () => central();

  function recomecar() {
    SITUACOES.forEach(s => Progresso.apagar(s.id));
    Perfil.recomecar();
    esquecerSegredo();
    central(`Novos chamados chegando! Boa sorte, ${P.nome}!`);
  }
  $('#bAgain').onclick = recomecar;
  $('#bRestart').onclick = () => $('#again').classList.add('on');
  $('#bNo').onclick = () => $('#again').classList.remove('on');
  $('#bYes').onclick = () => {
    $('#again').classList.remove('on');
    recomecar();
  };

  /* ---------------- em progresso (protótipos, com senha) ----------------
     A senha só evita que a turma entre sem querer: está no código,
     então não é proteção de verdade. Depois de digitada, vale até
     fechar o navegador. */

  const SENHA_EM_PROGRESSO = '6234';
  const campoSenha = $('#senhaCampo');
  const avisoSenha = $('#senhaAviso');
  let liberado = false;
  try { liberado = sessionStorage.getItem('algoritimando-em-progresso') === '1'; } catch { /* sem memória */ }

  function entrarEmProgresso() {
    if (campoSenha.value.trim() !== SENHA_EM_PROGRESSO) {
      avisoSenha.textContent = 'Senha errada. Tente de novo.';
      avisoSenha.hidden = false;
      campoSenha.select();
      return;
    }
    liberado = true;
    try { sessionStorage.setItem('algoritimando-em-progresso', '1'); } catch { /* sem memória */ }
    $('#senha').classList.remove('on');
    central('', true);
  }

  $('#bEmProgresso').onclick = () => {
    if (emProgresso) { central(); return; }
    if (liberado) { central('', true); return; }
    campoSenha.value = '';
    avisoSenha.hidden = true;
    $('#senha').classList.add('on');
    setTimeout(() => campoSenha.focus(), 50);
  };
  $('#bSenhaEntrar').onclick = entrarEmProgresso;
  $('#bSenhaCancelar').onclick = () => $('#senha').classList.remove('on');
  campoSenha.addEventListener('keydown', ev => {
    if (ev.key === 'Enter') entrarEmProgresso();
    if (ev.key === 'Escape') $('#senha').classList.remove('on');
  });

  /* ---------------- chamado do professor ----------------
     Um arquivo .json salvo pela Área do professor (editor.html),
     aberto do computador (FileReader, sem servidor) e conferido
     pela mesma função do editor (Comum.validarArquivoSituacao). */

  const inputProf = $('#input-situacao');
  const avisoProf = $('#avisoProf');

  function mostrarAvisoProf(texto) {
    avisoProf.textContent = texto;
    avisoProf.hidden = !texto;
  }

  $('#bProf').onclick = () => {
    mostrarAvisoProf('');
    $('#prof').classList.add('on');
  };
  $('#bProfFechar').onclick = () => $('#prof').classList.remove('on');
  $('#bAbrirProf').onclick = () => inputProf.click();

  inputProf.addEventListener('change', () => {
    const arquivo = inputProf.files[0];
    inputProf.value = '';
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onerror = () => {
      mostrarAvisoProf('Não deu para ler esse arquivo. Confira se ele ainda existe e tente de novo.');
    };
    leitor.onload = () => {
      // cada recusa tem a sua frase: quem abre fica sabendo O QUE há
      // de errado, e a tela nunca trava
      const conferencia = Comum.validarArquivoSituacao(leitor.result, true);
      if (!conferencia.ok) {
        mostrarAvisoProf(conferencia.mensagem);
        return;
      }
      const obj = conferencia.situacao;
      $('#prof').classList.remove('on');
      atualizarTopo();
      iniciarSituacao(obj, 'prof:' + (obj.id || 'chamado'));
    };
    leitor.readAsText(arquivo);
  });

  /* ---------------- partida ---------------- */

  $('#nameIn').value = P.comecou ? P.nome : '';
  $$('.avatar').forEach(x => x.classList.toggle('sel', x.dataset.a === P.avatar));
  atualizarCracha(P.comecou ? P.nome : '');
  atualizarTopo();
  $('#bPlay').textContent = P.comecou ? 'Continuar' : 'Jogar';
  $('#bReiniciar').hidden = !P.comecou;
  $('#menu').classList.add('on');

})();
