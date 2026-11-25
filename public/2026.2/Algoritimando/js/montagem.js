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
   - "grade":   o robô do chamado visto de cima, numa grade da
                fábrica. Ele faz de verdade o que as cartas mandam, na
                ordem dos espaços: vira, anda, abre e fecha a garra.
                Na primeira coisa que dá errado (bate na parede, fecha
                a garra no vazio, solta o cubo no chão), ele para ali.
                O cenário sai dos passos da fase (ligar, virar,
                plataforma longe), sem nada a configurar.
   - "jardim":  (abelhas) e "rua" (atravessar a rua): cenas desenhadas
                aqui, sem imagens novas, com o corpo do cliente andando
                por elas: a abelha sai da colmeia, procura a flor,
                coleta e volta para guardar o néctar no favo; o menino
                vai até a faixa, olha a luz, espera o verde, olha para
                os dois lados e atravessa (de mão dada, se tiver a
                carta). Seguem a mesma regra do "estado": param na
                primeira carta que vem antes da hora, com uma estrela.
   - "estado":  uma bancada (montagemBase) com objetos que mudam de
                figura a cada carta (o limão lavado, cortado,
                espremido). Roda as cartas na ordem dos espaços; a
                primeira que vem antes de uma das suas dependências
                para tudo ali, com uma estrela no objeto dela.
                Configuração no chamado: montagemObjetos (onde fica
                cada objeto, figura inicial, quando aparece) e
                montagemRegras (que figura cada objeto ganha quando
                certas cartas já foram feitas; a última que vale
                ganha). Ver o formato no motor.js.

   A montagem aparece sempre, desde o começo do nível: no PC abaixo
   da bandeja (ou ao lado, por cima da cena, quando não cabe), no
   celular em pé no alto da tela. A cena inteira fica no botão de
   tela cheia. Só no celular deitado ela troca de lugar com a
   bandeja, pelo botão "Ver montagem" / "Ver cartas".

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

  let modo = null;     // 'pilha' | 'cena' | 'tirinha' | 'grade' | 'estado' | 'jardim' | 'rua' | null
  let estado = null;   // estado: o chamado (objetos e regras)
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

  /* ---------------- botão "Ver montagem" / "Ver cartas" ----------------
     Só no celular deitado: lá não cabem bandeja e montagem juntas,
     então a montagem troca de lugar com a bandeja. Começa nas cartas
     (sem elas não dá para jogar). Nos outros tamanhos a montagem fica
     sempre à vista e o botão não aparece. */
  const deitado = window.matchMedia('(min-aspect-ratio: 4/5) and (max-height: 500px)');
  // o celular (em pé ou deitado) não mede sobra de altura como o PC
  const celular = window.matchMedia('(max-aspect-ratio: 4/5), (max-height: 500px)');

  function mostrarMontagem(sim) {
    tela.classList.toggle('ver-montagem', sim);
    botao.setAttribute('aria-pressed', String(sim));
    botao.textContent = sim ? 'Ver cartas' : 'Ver montagem';
  }

  botao.addEventListener('click', () => mostrarMontagem(!tela.classList.contains('ver-montagem')));
  // girou o celular: volta ao começo de cada tamanho
  deitado.addEventListener('change', () => { if (modo) mostrarMontagem(!deitado.matches); });

  /* No PC a montagem fica com a sobra de altura da área de jogo.
     Com muitas cartas na bandeja pode não sobrar quase nada: aí ela
     se esconde até abrir espaço, em vez de empurrar a tela. */
  if (window.ResizeObserver) {
    new ResizeObserver(() => {
      caixa.classList.toggle('apertada', caixa.getBoundingClientRect().height < 48);
    }).observe(caixa);

    /* Sobra altura embaixo da bandeja? A conta usa a bandeja CHEIA
       (ela tem as mesmas fileiras do tabuleiro), e não a altura de
       agora: senão, conforme as cartas saem da bandeja, a montagem
       ficaria pulando do lado para baixo no meio do nível. */
    const area = tela.querySelector('.area-jogo');
    const tabuleiro = tela.querySelector('.tabuleiro');
    const bandeja = tela.querySelector('.bandeja');
    const grade = tela.querySelector('.tabuleiro-grade');
    const molduraDe = el => {
      const c = getComputedStyle(el);
      return ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth']
        .reduce((soma, k) => soma + (parseFloat(c[k]) || 0), 0);
    };
    const medirSobra = () => {
      if (celular.matches || !area.clientHeight || !grade.offsetHeight) {
        tela.classList.remove('montagem-sem-espaco');
        return;
      }
      const vao = parseFloat(getComputedStyle(area).rowGap) || 0;
      const sobra = area.clientHeight - 2 * grade.offsetHeight
        - molduraDe(tabuleiro) - molduraDe(bandeja) - 2 * vao;
      tela.classList.toggle('montagem-sem-espaco', sobra < 48);
    };
    const olheiro = new ResizeObserver(medirSobra);
    [area, grade].forEach(el => olheiro.observe(el));
    celular.addEventListener('change', medirSobra);
  }

  /* ---------------- preparar a fase ---------------- */

  function preparar(situacao, fase) {
    modo = ['pilha', 'cena', 'tirinha', 'grade', 'estado', 'jardim', 'rua'].includes(situacao.montagem) ? situacao.montagem : null;
    estado = modo === 'estado' ? situacao : null;
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

    mostrarMontagem(!deitado.matches);
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
    else if (modo === 'grade') desenharGrade(sequencia);
    else if (modo === 'estado') desenharEstado(sequencia);
    else if (modo === 'jardim') desenharJardim(sequencia);
    else if (modo === 'rua') desenharRua(sequencia);
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

  /* ---------------- grade: o robô anda de verdade ---------------- */

  const COLS = 6, LINHAS = 4, LADO = 100;
  const DIRS = { L: [1, 0], S: [0, 1], O: [-1, 0], N: [0, -1] };
  const ANGULO = { L: 0, S: 90, O: 180, N: -90 };
  const NS = 'http://www.w3.org/2000/svg';

  function el(nome, attrs, pai) {
    const e = document.createElementNS(NS, nome);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (pai) pai.append(e);
    return e;
  }
  const centro = ([c, l]) => [c * LADO + LADO / 2, l * LADO + LADO / 2];
  const igual = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];
  const somar = (p, d) => [p[0] + DIRS[d][0], p[1] + DIRS[d][1]];
  const dentro = p => p[0] >= 0 && p[0] < COLS && p[1] >= 0 && p[1] < LINHAS;
  const rumoPara = (de, para) => (de[1] === para[1] ? (para[0] > de[0] ? 'L' : 'O') : (para[1] > de[1] ? 'S' : 'N'));

  /* o cenário sai dos passos da fase */
  function cenario() {
    const tem = id => !!passos[id];
    const longe = tem('andar-plataforma');
    return {
      ligado: !tem('ligar'),
      robo: [1, 2],
      rumo: tem('virar-cubo') ? 'N' : 'L',
      cubo: [4, 2],
      // plataforma longe (níveis 4 e 5) ou logo depois do cubo
      plataforma: longe ? [3, 0] : [5, 2],
      garraAberta: !tem('abrir-garra'),
    };
  }

  /* roda as cartas, na ordem, até a primeira coisa dar errado */
  function simular(sequencia) {
    const e = cenario();
    e.caminho = [e.robo.slice()];
    e.segurando = false;
    e.problema = null;     // { tipo, ponto }
    e.pronto = false;
    e.parado = 0;          // cartas que o robô desligado ignorou

    const andar = alvo => {
      // anda até ficar de frente para o alvo; se não estiver indo
      // para ele, anda até a parede e bate
      for (;;) {
        const prox = somar(e.robo, e.rumo);
        if (igual(prox, alvo)) return true;
        const bloqueio = !dentro(prox) || (!e.segurando && igual(prox, e.cubo)) || igual(prox, e.plataforma);
        if (bloqueio) { e.problema = { tipo: 'bateu', ponto: prox }; return false; }
        e.robo = prox;
        e.caminho.push(prox.slice());
      }
    };
    const deFrenteParaCubo = () => !e.segurando && igual(somar(e.robo, e.rumo), e.cubo);

    for (const id of sequencia) {
      if (!id || e.problema || e.pronto) continue;
      if (!e.ligado && id !== 'ligar') { e.parado += 1; continue; }
      switch (id) {
        case 'ligar': e.ligado = true; break;
        case 'virar-cubo': e.rumo = rumoPara(e.robo, e.cubo); break;
        case 'virar-plataforma': e.rumo = rumoPara(e.robo, e.plataforma); break;
        case 'andar':
        case 'andar-cubo': andar(e.cubo); break;
        case 'andar-plataforma': andar(e.plataforma); break;
        case 'abrir-garra':
          if (e.segurando) { e.segurando = false; e.cubo = somar(e.robo, e.rumo); e.problema = { tipo: 'caiu', ponto: e.cubo }; }
          e.garraAberta = true;
          break;
        case 'pegar':
        case 'fechar-garra':
          if (!deFrenteParaCubo()) { e.garraAberta = false; e.problema = { tipo: 'vazio', ponto: somar(e.robo, e.rumo) }; break; }
          if (!e.garraAberta) { e.problema = { tipo: 'empurrou', ponto: e.cubo }; break; }
          e.garraAberta = false;
          e.segurando = true;
          break;
        case 'colocar':
          // "coloque na plataforma" esconde os passos: leva e solta
          if (!e.segurando) { e.problema = { tipo: 'vazio', ponto: somar(e.robo, e.rumo) }; break; }
          e.robo = [e.plataforma[0] - 1, e.plataforma[1]];
          e.caminho.push(e.robo.slice());
          e.rumo = 'L';
          e.segurando = false;
          e.cubo = e.plataforma.slice();
          e.pronto = true;
          break;
        case 'soltar':
          if (!e.segurando) { e.problema = { tipo: 'vazio', ponto: somar(e.robo, e.rumo) }; break; }
          e.segurando = false;
          e.garraAberta = true;
          e.cubo = somar(e.robo, e.rumo);
          if (igual(e.cubo, e.plataforma)) e.pronto = true;
          else e.problema = { tipo: 'caiu', ponto: e.cubo };
          break;
      }
    }
    return e;
  }

  function desenharGrade(sequencia) {
    const e = simular(sequencia);
    const svg = el('svg', {
      viewBox: `0 0 ${COLS * LADO} ${LINHAS * LADO}`, class: 'grade-svg', role: 'img',
      'aria-label': e.pronto ? 'O robô levou o cubo até a plataforma'
        : e.problema ? 'O robô parou: algo deu errado' : 'O robô seguindo as cartas',
    });
    // chão da fábrica
    el('rect', { x: 0, y: 0, width: COLS * LADO, height: LINHAS * LADO, rx: 18, class: 'g-chao' }, svg);
    for (let c = 0; c < COLS; c++) {
      for (let l = 0; l < LINHAS; l++) {
        el('rect', { x: c * LADO + 4, y: l * LADO + 4, width: LADO - 8, height: LADO - 8, rx: 10, class: 'g-piso' }, svg);
      }
    }
    // plataforma
    const [px, py] = centro(e.plataforma);
    el('circle', { cx: px, cy: py, r: 36, class: 'g-plataforma' + (e.pronto ? ' pronta' : '') }, svg);
    el('circle', { cx: px, cy: py, r: 22, class: 'g-plataforma-luz' }, svg);
    // o caminho feito
    if (e.caminho.length > 1) {
      el('polyline', { points: e.caminho.map(centro).map(p => p.join(',')).join(' '), class: 'g-caminho' }, svg);
    }
    // o cubo, quando não está na garra
    if (!e.segurando) {
      const [cx, cy] = centro(e.cubo);
      el('rect', { x: cx - 26, y: cy - 26, width: 52, height: 52, rx: 8, class: 'g-cubo' }, svg);
    }
    // o robô: corpo laranja, rodas, garra na frente; desligado fica cinza
    const [rx, ry] = centro(e.robo);
    const robo = el('g', { transform: `translate(${rx} ${ry}) rotate(${ANGULO[e.rumo]})`, class: 'g-robo' + (e.ligado ? '' : ' desligado') }, svg);
    el('rect', { x: -30, y: -38, width: 46, height: 14, rx: 6, class: 'g-roda' }, robo);
    el('rect', { x: -30, y: 24, width: 46, height: 14, rx: 6, class: 'g-roda' }, robo);
    el('rect', { x: -34, y: -28, width: 56, height: 56, rx: 14, class: 'g-corpo' }, robo);
    el('path', { d: 'M -14 -10 L 6 0 L -14 10 Z', class: 'g-seta' }, robo);
    const abre = e.garraAberta ? 16 : 7;
    el('path', { d: `M 22 ${-abre} q 18 0 22 ${abre * 0.5}`, class: 'g-garra' }, robo);
    el('path', { d: `M 22 ${abre} q 18 0 22 ${-abre * 0.5}`, class: 'g-garra' }, robo);
    if (e.segurando) el('rect', { x: 30, y: -16, width: 32, height: 32, rx: 5, class: 'g-cubo' }, robo);
    // desligado, ou ligado tarde demais: as cartas de antes não fizeram nada
    if (!e.ligado || e.parado) {
      const z = el('text', { x: rx + 18, y: ry - 34, class: 'g-zzz' }, svg);
      z.textContent = 'z z';
    }
    // onde deu errado: uma estrela de batida
    if (e.problema) {
      const [bx, by] = centro(e.problema.ponto).map((v, k) => (k === 0
        ? Math.max(30, Math.min(COLS * LADO - 30, v)) : Math.max(30, Math.min(LINHAS * LADO - 30, v))));
      const pontos = [];
      for (let k = 0; k < 16; k++) {
        const r = k % 2 ? 12 : 28, a = (Math.PI * k) / 8;
        pontos.push(`${bx + r * Math.cos(a)},${by + r * Math.sin(a)}`);
      }
      el('polygon', { points: pontos.join(' '), class: 'g-batida' }, svg);
    }
    const quadro = document.createElement('div');
    quadro.className = 'grade-quadro';
    marcarNovo(quadro, 'grade:' + sequencia.join('|'));
    quadro.append(svg);
    caixa.append(quadro);
  }

  /* ---------------- estado: objetos que mudam a cada carta ---------------- */

  function desenharEstado(sequencia) {
    const s = estado;
    const ids = new Set(Object.keys(passos));
    // roda as cartas até a primeira que vem antes da hora
    const feitos = new Set();
    let problema = null;
    for (const id of sequencia) {
      if (!id) continue;
      const passo = passos[id];
      if ((passo.dependeDe || []).some(d => !feitos.has(d))) { problema = id; break; }
      feitos.add(id);
    }
    const onde = (s.montagemOnde || {});

    const cena = document.createElement('div');
    cena.className = 'estado-cena';
    if (s.montagemBase) cena.style.backgroundImage = `url("${s.montagemBase}")`;

    for (const obj of s.montagemObjetos || []) {
      // só aparece se alguma carta da fase mexe com ele (ou "sempre")
      if (!obj.sempre && !(obj.passos || []).some(id => ids.has(id))) continue;
      let figura = obj.inicio || null;
      if (obj.inicioSem && !ids.has(obj.inicioSem.passo)) figura = obj.inicioSem.imagem;
      for (const regra of s.montagemRegras || []) {
        if (!(obj.id in regra)) continue;
        if (regra.quando.every(id => feitos.has(id))) figura = regra[obj.id];
      }
      const lugar = document.createElement('div');
      lugar.className = 'estado-objeto';
      lugar.style.left = `${obj.x - obj.w / 2}%`;
      lugar.style.bottom = `${100 - obj.y}%`;
      lugar.style.width = `${obj.w}%`;
      if (figura) {
        const img = imagemDePeca(figura, 'estado-figura');
        marcarNovo(img, obj.id + ':' + figura);
        lugar.append(img);
      }
      if (problema && onde[problema] === obj.id) {
        const estrela = document.createElement('span');
        estrela.className = 'estado-opa';
        estrela.setAttribute('aria-hidden', 'true');
        lugar.append(estrela);
      }
      cena.append(lugar);
    }
    cena.setAttribute('role', 'img');
    cena.setAttribute('aria-label', problema ? 'A montagem parou: um passo veio antes da hora' : 'A bancada seguindo as cartas');
    const quadro = document.createElement('div');
    quadro.className = 'estado-quadro';
    quadro.append(cena);
    caixa.append(quadro);
  }

  /* ---------------- jardim e rua: cenas desenhadas, com o cliente ----------------
     Como no "estado", as cartas rodam na ordem dos espaços até a
     primeira que vem antes de uma das suas dependências: ali tudo
     para, com uma estrela no lugar dela. É a mesma regra do
     Verificar, então a montagem nunca diz outra coisa. O cenário é
     desenhado aqui (sem imagens novas) e o personagem é o corpo do
     cliente (img/cliente3 e cliente4), que se move pela cena. */

  function correrCartas(sequencia) {
    const feitos = new Set();
    let problema = null;
    for (const id of sequencia) {
      if (!id || !passos[id]) continue;
      if ((passos[id].dependeDe || []).some(d => !feitos.has(d))) { problema = id; break; }
      feitos.add(id);
    }
    return { feitos, problema };
  }

  const CL = '#3b2a2a';   // o contorno marrom das ilustrações do jogo

  function estrelaDeOpa(svg, x, y) {
    const pontos = [];
    for (let k = 0; k < 16; k++) {
      const r = k % 2 ? 14 : 32, a = (Math.PI * k) / 8;
      pontos.push(`${(x + r * Math.cos(a)).toFixed(1)},${(y + r * Math.sin(a)).toFixed(1)}`);
    }
    el('polygon', { points: pontos.join(' '), class: 'g-batida c-opa' }, svg);
  }

  // o personagem: uma imagem recortada, com o pé (ou o centro) no ponto dado
  function personagem(svg, src, x, y, largura, altura, espelhar, chave) {
    const fora = el('g', { transform: `translate(${x} ${y})${espelhar ? ' scale(-1 1)' : ''}` }, svg);
    const dentro = el('g', { class: 'c-personagem' }, fora);
    el('image', { href: src, x: -largura / 2, y: -altura, width: largura, height: altura }, dentro);
    marcarNovo(dentro, chave);
    return dentro;
  }

  function trilha(svg, pontos) {
    if (pontos.length < 2) return;
    el('polyline', { points: pontos.map(p => p.join(',')).join(' '), class: 'g-caminho c-trilha' }, svg);
  }

  function quadroDeCena(svg, rotulo) {
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', rotulo);
    const quadro = document.createElement('div');
    quadro.className = 'grade-quadro desenho-quadro';
    quadro.append(svg);
    caixa.append(quadro);
  }

  /* ----- jardim: a abelha sai, procura, coleta, volta e guarda ----- */

  function flor(svg, x, aberta, comNectar, comPolen, destaque) {
    const chao = 470;
    el('path', { d: `M ${x} ${chao} Q ${x - 6} ${chao - 60} ${x} ${chao - 120}`, class: 'c-caule' }, svg);
    el('path', { d: `M ${x - 2} ${chao - 50} q -34 -16 -40 6 q 22 12 40 -6 Z`, class: 'c-folha' }, svg);
    el('path', { d: `M ${x + 2} ${chao - 78} q 34 -16 40 6 q -22 12 -40 -6 Z`, class: 'c-folha' }, svg);
    const cy = chao - 132;
    if (!aberta) {
      // botão fechado
      el('path', { d: `M ${x} ${cy - 26} q 20 18 0 40 q -20 -22 0 -40 Z`, class: 'c-botao' }, svg);
      el('path', { d: `M ${x - 14} ${cy + 4} q 14 18 28 0`, class: 'c-sepala' }, svg);
      return;
    }
    if (destaque) el('circle', { cx: x, cy, r: 64, class: 'c-destaque' }, svg);
    for (let k = 0; k < 8; k++) {
      const a = (Math.PI * k) / 4;
      el('ellipse', { cx: x + 28 * Math.cos(a), cy: cy + 28 * Math.sin(a), rx: 18, ry: 18, class: 'c-petala' }, svg);
    }
    el('circle', { cx: x, cy, r: 20, class: 'c-miolo' }, svg);
    if (comPolen) {
      [[-9, -6], [7, -9], [10, 6], [-6, 9], [0, 0]].forEach(([dx, dy]) =>
        el('circle', { cx: x + dx, cy: cy + dy, r: 3.6, class: 'c-polen' }, svg));
    }
    if (comNectar) el('path', { d: `M ${x} ${cy - 30} q 9 13 0 18 q -9 -5 0 -18 Z`, class: 'c-nectar' }, svg);
  }

  function favo(svg, cx, cy, celula) {
    // um pedaço do favo, visto de dentro da colmeia
    el('circle', { cx, cy, r: 74, class: 'c-janela' }, svg);
    const r = 19, h = r * Math.sqrt(3);
    const lugares = [[0, 0], [1.5 * r, -h / 2], [1.5 * r, h / 2], [0, h], [-1.5 * r, h / 2], [-1.5 * r, -h / 2], [0, -h]];
    lugares.forEach(([dx, dy], i) => {
      const pts = [];
      for (let k = 0; k < 6; k++) {
        const a = (Math.PI * k) / 3;
        pts.push(`${(cx + dx + (r - 2) * Math.cos(a)).toFixed(1)},${(cy + dy + (r - 2) * Math.sin(a)).toFixed(1)}`);
      }
      // as outras células já estão cheias; a do meio é a desta abelha
      const classe = i === 0 ? 'c-celula ' + celula : 'c-celula tampada';
      const hex = el('polygon', { points: pts.join(' '), class: classe }, svg);
      if (i === 0) marcarNovo(hex, 'favo:' + celula);
    });
  }

  function desenharJardim(sequencia) {
    const { feitos, problema } = correrCartas(sequencia);
    const tem = id => !!passos[id];
    const feito = id => feitos.has(id);
    const svg = el('svg', { viewBox: '0 0 800 600', class: 'grade-svg desenho-svg' });

    // céu, nuvens, cerca e grama
    el('rect', { x: 0, y: 0, width: 800, height: 600, rx: 18, class: 'c-ceu' }, svg);
    [[560, 70], [300, 40]].forEach(([x, y]) => el('path', {
      d: `M ${x} ${y} a 22 22 0 0 1 40 -8 a 26 26 0 0 1 48 10 a 18 18 0 0 1 -6 34 h -78 a 18 18 0 0 1 -4 -36 Z`, class: 'c-nuvem',
    }, svg));
    for (let x = 250; x < 800; x += 44) {
      el('path', { d: `M ${x} 470 V 330 l 18 -16 l 18 16 V 470 Z`, class: 'c-cerca' }, svg);
    }
    el('rect', { x: 0, y: 458, width: 800, height: 142, class: 'c-grama' }, svg);
    el('path', { d: 'M 0 458 H 800', class: 'c-borda' }, svg);

    // o galho e a colmeia
    el('path', { d: 'M -10 40 Q 120 60 250 30', class: 'c-galho' }, svg);
    el('path', { d: 'M 130 52 V 84', class: 'c-fio' }, svg);
    const colmeia = [130, 160];
    [[70, 84, 46], [96, 116, 64], [124, 148, 72], [152, 180, 60], [178, 206, 38]].forEach(([y0, y1, w]) => {
      el('rect', { x: colmeia[0] - w, y: y0, width: 2 * w, height: y1 - y0 + 6, rx: (y1 - y0) / 1.6, class: 'c-colmeia' }, svg);
    });
    el('ellipse', { cx: colmeia[0] + 4, cy: 150, rx: 16, ry: 13, class: 'c-porta' }, svg);

    // o favo só aparece quando o nível chega até ele
    if (tem('guardar')) {
      const celula = feito('tampar') ? 'tampada' : feito('guardar') ? 'cheia' : 'vazia';
      el('circle', { cx: 120, cy: 242, r: 6, class: 'c-janela' }, svg);
      el('circle', { cx: 112, cy: 262, r: 9, class: 'c-janela' }, svg);
      favo(svg, 110, 352, celula);
    }

    // as flores: com "procurar", só uma das três está aberta
    const procura = tem('procurar');
    const florX = procura ? 620 : 600;
    const nectarNaFlor = !feito('nectar');
    const polenNaFlor = tem('polen') && !feito('polen');
    if (procura) {
      flor(svg, 470, false);
      flor(svg, 740, false);
    }
    flor(svg, florX, true, nectarNaFlor, polenNaFlor, procura && feito('procurar'));

    // onde a abelha está: anda de um lugar ao outro, na ordem das cartas
    const LUGAR = {
      dentro: [colmeia[0] + 6, 176],
      fora: [262, 196],
      procurando: [430, 170],
      flor: [florX - 78, 262],
      colmeia: [250, 206],
    };
    let onde = tem('sair') ? 'dentro' : 'fora';
    const caminho = [LUGAR[onde]];
    const ir = lugar => { onde = lugar; caminho.push(LUGAR[lugar]); };
    if (feito('sair')) ir('fora');
    if (feito('procurar')) ir('procurando');
    if (feito('voar-flor')) ir('flor');
    if (feito('voltar')) ir('colmeia');
    trilha(svg, caminho);

    const [bx, by] = LUGAR[onde];
    const pequena = onde === 'dentro';
    const larg = pequena ? 64 : 140, alt = larg * 700 / 612;
    // vira para a colmeia quando volta para casa
    const abelha = personagem(svg, 'img/cliente3.webp', bx, by + alt / 2, larg, alt, onde === 'colmeia', 'abelha:' + onde);
    if (pequena) abelha.classList.add('c-dentro');
    // o que ela leva: néctar na cestinha e pólen nas patinhas
    const levando = !feito('guardar');
    const lado = onde === 'colmeia' ? -1 : 1;
    if (feito('nectar') && levando) {
      const nx = bx + lado * larg * 0.3, ny = by + alt * 0.36;
      const gota = el('path', { d: `M ${nx} ${ny - 16} q 11 15 0 21 q -11 -6 0 -21 Z`, class: 'c-nectar' }, svg);
      marcarNovo(gota, 'nectar');
    }
    if (feito('polen') && !feito('voltar')) {
      [[-0.18, 0.4], [-0.02, 0.45]].forEach(([dx, dy], i) => {
        const bola = el('circle', { cx: bx + lado * dx * larg, cy: by + dy * alt, r: 8, class: 'c-polen grande' }, svg);
        marcarNovo(bola, 'polen' + i);
      });
    }

    if (problema) {
      const ONDE = {
        sair: [colmeia[0], 118], procurar: [florX, 338], 'voar-flor': [bx, by],
        nectar: [florX, 338], polen: [florX, 338], voltar: [colmeia[0], 118],
        guardar: [110, 352], tampar: [110, 352],
      };
      const [ox, oy] = ONDE[problema] || [bx, by];
      estrelaDeOpa(svg, ox, oy);
    }
    quadroDeCena(svg, problema ? 'A abelha parou: um passo veio antes da hora' : 'A abelha seguindo as cartas no jardim');
  }

  /* ----- rua: a faixa, o semáforo de duas luzes e o menino ----- */

  function adulto(svg, x, y, escala, chave) {
    // um adulto simples, de mão dada com o menino (à direita dele)
    const g = el('g', { transform: `translate(${x} ${y}) scale(${escala})` }, svg);
    const d = el('g', { class: 'c-personagem' }, g);
    el('rect', { x: -22, y: -96, width: 18, height: 96, rx: 8, class: 'c-calca' }, d);
    el('rect', { x: 4, y: -96, width: 18, height: 96, rx: 8, class: 'c-calca' }, d);
    el('ellipse', { cx: -14, cy: -2, rx: 16, ry: 8, class: 'c-sapato' }, d);
    el('ellipse', { cx: 14, cy: -2, rx: 16, ry: 8, class: 'c-sapato' }, d);
    el('path', { d: 'M -34 -100 q 0 -78 34 -80 q 34 2 34 80 Z', class: 'c-blusa' }, d);
    el('path', { d: 'M -30 -160 q -24 30 -30 62', class: 'c-braco' }, d);
    el('circle', { cx: -60, cy: -94, r: 9, class: 'c-pele' }, d);
    el('path', { d: 'M 30 -160 q 14 34 12 60', class: 'c-braco' }, d);
    el('rect', { x: -9, y: -196, width: 18, height: 20, class: 'c-pele' }, d);
    el('circle', { cx: 0, cy: -222, r: 30, class: 'c-pele' }, d);
    el('path', { d: 'M -31 -222 q -2 -38 31 -38 q 33 0 31 38 q -14 -22 -31 -20 q -17 -2 -31 20 Z', class: 'c-cabelo' }, d);
    el('circle', { cx: -10, cy: -220, r: 3.4, class: 'c-olho' }, d);
    el('circle', { cx: 10, cy: -220, r: 3.4, class: 'c-olho' }, d);
    el('path', { d: 'M -9 -206 q 9 8 18 0', class: 'c-boca' }, d);
    marcarNovo(d, chave);
  }

  function carro(svg, x, andando) {
    const g = el('g', { transform: `translate(${x} 0)` }, svg);
    if (andando) {
      [312, 332, 352].forEach(y => el('path', { d: `M -116 ${y} h -40`, class: 'c-vento' }, g));
    }
    el('path', { d: 'M -100 360 v -38 q 0 -12 12 -14 l 30 -4 l 22 -30 q 6 -8 18 -8 h 70 q 12 0 18 10 l 18 30 q 22 2 22 18 v 36 Z', class: 'c-carro' }, g);
    el('path', { d: 'M -28 304 l 16 -24 h 36 v 24 Z M 34 304 v -24 h 22 q 6 0 10 6 l 12 18 Z', class: 'c-vidro' }, g);
    el('circle', { cx: -58, cy: 362, r: 17, class: 'c-roda' }, g);
    el('circle', { cx: 58, cy: 362, r: 17, class: 'c-roda' }, g);
  }

  function semaforo(svg, x, verde, destaque) {
    el('rect', { x: x - 5, y: 300, width: 10, height: 190, class: 'c-poste' }, svg);
    if (destaque) el('rect', { x: x - 38, y: 200, width: 76, height: 128, rx: 22, class: 'c-destaque' }, svg);
    el('rect', { x: x - 28, y: 210, width: 56, height: 108, rx: 14, class: 'c-caixa' }, svg);
    el('circle', { cx: x, cy: 238, r: 18, class: 'c-luz vermelha' + (verde ? '' : ' acesa') }, svg);
    const luz = el('circle', { cx: x, cy: 290, r: 18, class: 'c-luz verde' + (verde ? ' acesa' : '') }, svg);
    marcarNovo(luz, 'luz:' + verde);
  }

  function desenharRua(sequencia) {
    const { feitos, problema } = correrCartas(sequencia);
    const tem = id => !!passos[id];
    const feito = id => feitos.has(id);
    const svg = el('svg', { viewBox: '0 0 800 600', class: 'grade-svg desenho-svg' });

    // céu e prédios ao fundo, calçada de lá, rua com a faixa, calçada de cá
    el('rect', { x: 0, y: 0, width: 800, height: 600, rx: 18, class: 'c-ceu' }, svg);
    [[20, 70, 120, 'a'], [150, 100, 100, 'b'], [560, 60, 110, 'c'], [680, 110, 120, 'a']].forEach(([x, y, w, cor]) => {
      el('rect', { x, y, width: w, height: 180 - y, class: 'c-predio ' + cor }, svg);
      for (let jy = y + 18; jy < 160; jy += 34) {
        for (let jx = x + 16; jx < x + w - 24; jx += 34) el('rect', { x: jx, y: jy, width: 18, height: 18, rx: 3, class: 'c-janelinha' }, svg);
      }
    });
    el('circle', { cx: 330, cy: 150, r: 36, class: 'c-copa' }, svg);
    el('circle', { cx: 470, cy: 140, r: 44, class: 'c-copa' }, svg);
    el('rect', { x: 0, y: 176, width: 800, height: 64, class: 'c-calcada' }, svg);
    el('rect', { x: 0, y: 236, width: 800, height: 8, class: 'c-meiofio' }, svg);
    el('rect', { x: 0, y: 244, width: 800, height: 190, class: 'c-asfalto' }, svg);
    for (let x = 20; x < 800; x += 90) {
      if (x > 290 && x < 510) continue;
      el('rect', { x, y: 334, width: 50, height: 8, rx: 4, class: 'c-linha' }, svg);
    }
    for (let y = 256; y < 426; y += 30) el('rect', { x: 330, y, width: 140, height: 18, rx: 3, class: 'c-zebra' }, svg);
    el('rect', { x: 0, y: 434, width: 800, height: 8, class: 'c-meiofio' }, svg);
    el('rect', { x: 0, y: 442, width: 800, height: 158, class: 'c-calcada' }, svg);

    // o semáforo de pedestre: vermelho até a criança esperar o verde
    const comLuz = tem('ver-luz');
    const verde = !comLuz || feito('esperar');
    // o carro: passa no vermelho do pedestre, para antes da faixa no verde
    carro(svg, comLuz && !verde ? 690 : 210, comLuz && !verde);
    if (comLuz) semaforo(svg, 530, verde, feito('ver-luz') && !feito('esperar'));

    // onde o menino está
    const LUGAR = { longe: [110, 560], faixa: [390, 548], outro: [400, 232] };
    let onde = 'longe';
    const caminho = [LUGAR.longe];
    if (feito('faixa')) { onde = 'faixa'; caminho.push(LUGAR.faixa); }
    if (feito('atravessar')) { onde = 'outro'; caminho.push(LUGAR.outro); }
    trilha(svg, caminho.map(([x, y]) => [x, y - 10]));

    const [mx, my] = LUGAR[onde];
    const escala = onde === 'outro' ? 0.62 : 1;
    const alt = 150 * escala, larg = alt * 369 / 700;
    // o olhar: para a luz e para os dois lados da rua
    const olhos = [mx, my - alt * 0.78];
    if (feito('ver-luz') && onde !== 'outro') {
      el('path', { d: `M ${olhos[0] + 14} ${olhos[1]} L 512 244`, class: 'c-olhar' }, svg);
    }
    if (feito('olhar') && onde !== 'outro') {
      el('path', { d: `M ${olhos[0] - 14} ${olhos[1]} Q ${olhos[0] - 150} 330 40 330`, class: 'c-olhar' }, svg);
      el('path', { d: `M ${olhos[0] + 14} ${olhos[1]} Q ${olhos[0] + 150} 330 760 330`, class: 'c-olhar' }, svg);
    }
    if (feito('mao')) adulto(svg, mx + larg * 0.95, my, escala * 0.82, 'adulto:' + onde);
    personagem(svg, 'img/cliente4.webp', mx, my, larg, alt, false, 'menino:' + onde);

    if (problema) {
      const ONDE = {
        mao: [mx + 50 * escala, my - alt * 0.5], faixa: [mx, my - alt * 0.55], olhar: [mx, my - alt * 0.85],
        'ver-luz': [530, 264], esperar: [530, 264], atravessar: [400, 340],
      };
      const [ox, oy] = ONDE[problema] || [mx, my - alt / 2];
      estrelaDeOpa(svg, ox, oy);
    }
    quadroDeCena(svg, problema ? 'O menino parou: um passo veio antes da hora'
      : onde === 'outro' ? 'O menino atravessou a rua' : 'O menino seguindo as cartas na calçada');
  }

  window.Montagem = { preparar, atualizar };

})();
