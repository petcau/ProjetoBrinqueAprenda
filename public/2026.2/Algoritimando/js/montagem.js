/* ============================================================
   montagem.js — a imagem que se monta ao lado do tabuleiro.

   Cada carta colocada aparece também como IMAGEM, e na ordem em
   que está nos espaços — inclusive a errada. A criança não lê só
   "o queijo ficou de fora": ela VÊ o queijo por cima do pão
   fechado. O jogo continua sem bloquear nada; a montagem só
   mostra a consequência da ordem que está na tela.

   Três modos (campo "montagem" da situação — ver motor.js):
   - "pilha":   as peças ("peca" de cada passo) empilham de baixo
                para cima na ordem dos espaços. Passos sem peça
                (pegar, abrir…) não aparecem.
   - "cena":    cada peça tem um lugar fixo numa cena (todas do
                mesmo tamanho, por cima de "montagemBase") e é
                desenhada por cima das anteriores, na ordem dos
                espaços: fechar o estojo antes de guardar o lápis
                deixa o lápis por fora. No erro, a peça que ficou de
                fora (o pré-requisito) vai para a frente, marcada.
   - "tirinha": um quadrinho por espaço; no primeiro erro aquele
                quadrinho fica marcado e os seguintes ficam
                apagados — a história "trava" ali.

   No PC a montagem fica abaixo da bandeja. No celular ela é
   OPCIONAL e começa desligada: o botão "Montagem" do rodapé troca
   a ilustração da cena por ela, sem ocupar mais espaço na tela.

   Uso (pelo jogo.js):
     Montagem.preparar(situacao, fase)            ao montar a fase
     Montagem.atualizar(sequencia, erro, completa) a cada movimento
   ============================================================ */

'use strict';

(function () {

  const tela  = document.querySelector('#fase');
  const caixa = tela && tela.querySelector('.montagem');
  const botao = tela && tela.querySelector('#btn-montagem');
  if (!caixa) {
    window.Montagem = { preparar() {}, atualizar() {} };
    return;
  }

  const CHAVE = (window.ALGORITIMANDO_PREVIA ? 'algoritimando-previa' : 'algoritimando') + '-montagem';

  let modo = null;     // 'pilha' | 'cena' | 'tirinha' | null
  let passos = {};     // id → passo da fase atual
  let base = '';       // cena: a imagem de fundo (montagemBase)
  // o que já estava na tela: só o que chegou agora anima (senão
  // tudo "cairia" de novo a cada carta movida)
  let jaMostrados = new Set();
  let agoraMostrados = new Set();

  function marcarNovo(el, chave) {
    agoraMostrados.add(chave);
    if (!jaMostrados.has(chave)) el.classList.add('nova');
  }

  /* ---------------- botão do celular ---------------- */

  function lerPreferencia() {
    try { return localStorage.getItem(CHAVE) === '1'; } catch { return false; }
  }

  function mostrarNoCelular(sim) {
    tela.classList.toggle('ver-montagem', sim);
    botao.setAttribute('aria-pressed', String(sim));
    botao.textContent = sim ? 'Ver cena' : 'Ver montagem';
    try { localStorage.setItem(CHAVE, sim ? '1' : '0'); } catch { /* sem memória: tudo bem */ }
  }

  botao.addEventListener('click', () => mostrarNoCelular(!tela.classList.contains('ver-montagem')));

  /* No PC a montagem fica com a sobra de altura da área de jogo.
     Com muitas cartas na bandeja pode não sobrar quase nada: aí ela
     se esconde até abrir espaço, em vez de empurrar a tela. */
  if (window.ResizeObserver) {
    new ResizeObserver(() => {
      caixa.classList.toggle('apertada', caixa.getBoundingClientRect().height < 48);
    }).observe(caixa);
  }

  /* ---------------- preparar a fase ---------------- */

  function preparar(situacao, fase) {
    modo = ['pilha', 'cena', 'tirinha'].includes(situacao.montagem) ? situacao.montagem : null;
    // a fase pode trocar o fundo da cena (ex.: a mochila já aberta)
    base = fase.montagemBase || situacao.montagemBase || '';
    jaMostrados = new Set();
    passos = {};
    fase.passos.forEach(p => { passos[p.id] = p; });

    tela.classList.toggle('tem-montagem', !!modo);
    botao.hidden = !modo;
    caixa.hidden = !modo;
    caixa.dataset.modo = modo || '';
    // quantas peças a pilha terá no fim: decide o tamanho delas
    caixa.style.setProperty('--camadas', Math.max(2, fase.passos.filter(p => p.peca).length));
    if (!modo) return;

    mostrarNoCelular(lerPreferencia());
    atualizar(fase.passos.map(() => null), null, false);
  }

  /* ---------------- desenhar ---------------- */

  function atualizar(sequencia, erro, completa) {
    if (!modo) return;
    caixa.textContent = '';
    agoraMostrados = new Set();
    caixa.classList.toggle('com-erro', !!erro);
    caixa.classList.toggle('completa', !!completa && !erro);

    if (modo === 'pilha') desenharPilha(sequencia, erro);
    else if (modo === 'cena') desenharCena(sequencia, erro);
    else desenharTirinha(sequencia, erro);
    jaMostrados = agoraMostrados;
  }

  function imagemDePeca(src, classe) {
    const img = document.createElement('img');
    img.className = classe;
    img.src = src;
    img.alt = '';
    img.onerror = () => img.remove();   // peça que não carrega some
    return img;
  }

  function desenharCena(sequencia, erro) {
    const cena = document.createElement('div');
    cena.className = 'cena';
    if (base) cena.append(imagemDePeca(base, 'cena-base'));

    const ids = sequencia.filter(id => id && passos[id] && passos[id].peca);
    // no erro, o que ficou de fora vem para a frente: senão uma peça
    // posta depois (a mochila fechada, a mesa limpa) poderia escondê-lo
    const deFora = erro && erro.preRequisito && ids.includes(erro.preRequisito.id)
      ? erro.preRequisito.id : null;
    const ordem = deFora ? ids.filter(id => id !== deFora).concat(deFora) : ids;

    ordem.forEach(id => {
      const img = imagemDePeca(passos[id].peca, 'cena-peca');
      marcarNovo(img, id);
      if (erro && (id === deFora || (erro.passo && erro.passo.id === id))) img.classList.add('peca-errada');
      cena.append(img);
    });
    caixa.append(cena);
  }

  function desenharPilha(sequencia, erro) {
    const pilha = document.createElement('div');
    pilha.className = 'pilha';
    const pecas = document.createElement('div');
    pecas.className = 'pilha-pecas';

    sequencia.forEach(id => {
      const passo = id && passos[id];
      if (!passo || !passo.peca) return;
      const img = document.createElement('img');
      img.className = 'peca';
      img.src = passo.peca;
      img.alt = '';
      img.onerror = () => img.remove();   // peça que não carrega some
      if (erro && erro.passo && erro.passo.id === id) img.classList.add('peca-errada');
      marcarNovo(img, id);
      pecas.append(img);
    });

    const prato = document.createElement('div');
    prato.className = 'pilha-prato';
    pilha.append(pecas, prato);

    if (!pecas.children.length) {
      const dica = document.createElement('p');
      dica.className = 'montagem-vazia';
      dica.textContent = 'Coloque as cartas e veja aqui o que acontece!';
      pilha.append(dica);
    }
    caixa.append(pilha);
  }

  function desenharTirinha(sequencia, erro) {
    const fila = document.createElement('ol');
    fila.className = 'tirinha';
    // até 4 quadrinhos por linha
    const colunas = sequencia.length <= 4 ? sequencia.length : Math.ceil(sequencia.length / 2);
    fila.style.setProperty('--quadros', colunas);
    const indiceErro = erro && Number.isInteger(erro.indice) ? erro.indice : -1;

    sequencia.forEach((id, i) => {
      const passo = id && passos[id];
      const quadro = document.createElement('li');
      quadro.className = 'quadro';

      const numero = document.createElement('span');
      numero.className = 'quadro-numero';
      numero.textContent = i + 1;

      if (!passo) {
        quadro.classList.add('vazio');
        quadro.append(numero);
        fila.append(quadro);
        return;
      }

      const figura = document.createElement('div');
      figura.className = 'quadro-figura';
      marcarNovo(figura, i + ':' + id);
      const src = passo.peca || passo.imagem;
      const semImagem = () => {
        figura.style.backgroundImage = '';
        figura.classList.add('sem-imagem');
        figura.textContent = passo.texto;
      };
      if (src) {
        figura.style.backgroundImage = `url("${src}")`;
        const sonda = new Image();
        sonda.onerror = semImagem;
        sonda.src = src;
      } else {
        semImagem();
      }

      if (i === indiceErro) quadro.classList.add('quadro-erro');
      else if (indiceErro >= 0 && i > indiceErro) quadro.classList.add('quadro-parado');

      quadro.append(figura, numero);
      fila.append(quadro);
    });

    caixa.append(fila);
  }

  window.Montagem = { preparar, atualizar };

})();
