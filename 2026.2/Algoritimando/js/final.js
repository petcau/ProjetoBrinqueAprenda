/* ============================================================
   final.js — a animação final e o certificado

   Depois da promoção a Agente Sênior (os 8 chamados), passa uma
   sequência de quadros como a da abertura, antes da "Missão
   cumprida". Cada quadro tem zoom lento; alguns têm confete e a
   música de vitória; um deles mostra o álbum completo, com as
   figurinhas chegando uma a uma.

   As imagens são img/fim1.webp a img/fim6.webp (PROMPTS-FINAL.md).
   Enquanto uma não existe, entra uma imagem do jogo no lugar.

   O certificado é uma folha para imprimir (A4 deitada): na
   impressão, só ele aparece (ver @media print no style.css).

   Uso: Final.tocar(perfil, aoTerminar)
        Final.certificado(perfil)
   ============================================================ */

'use strict';

(function () {

  const tela = document.querySelector('#fim');
  if (!tela) {
    window.Final = { tocar(_, fim) { if (fim) fim(); }, certificado() {} };
    return;
  }

  const $ = s => document.querySelector(s);
  const arte    = $('#fimArte');
  const album   = $('#fimAlbum');
  const confete = $('#fimConfete');
  const texto   = $('#fimTexto');
  const dots    = $('#fimDots');
  const proximo = $('#bFimNext');

  // ?v= faz o navegador buscar a imagem nova quando ela muda
  const V = '?v=202611251330';

  /* Os quadros. "reserva": imagem do jogo usada enquanto a do
     quadro não existe. "festa": confete e música de vitória. */
  const QUADROS = [
    { img: 'img/fim1.webp', reserva: 'img/story4.webp',
      texto: () => 'Um dia, o mapa amanheceu diferente: todos os chamados tinham sido atendidos.' },
    { img: 'img/fim2.webp', reserva: 'img/win7.webp', festa: true,
      texto: () => 'Os moradores prepararam uma surpresa na praça. Todos vieram agradecer!' },
    { album: true,
      texto: n => `Seu álbum está completo: ${n} figurinhas, uma para cada nível!` },
    { img: 'img/fim3.webp', reserva: 'img/story1.webp',
      texto: () => 'Cada chamado ensinou uma ideia: ordem, passos escondidos, repetição, condição, ao mesmo tempo, abre e fecha.' },
    { img: 'img/fim4.webp', reserva: 'img/story2.webp',
      texto: () => 'Agora você sabe montar um passo a passo para cada tarefa. O Robô-guia ficou orgulhoso!' },
    { img: 'img/fim5.webp', reserva: 'img/story3.webp', festa: true,
      texto: (_, nome) => `${nome}, você agora é Agente Sênior de Algoritimando!` },
    { img: 'img/fim6.webp', reserva: 'img/story1.webp',
      texto: () => 'Os algoritmos estão em todo lugar. Que passo a passo você vai criar amanhã?' },
  ];

  let atual = 0;
  let nome = 'Agente';
  let aoTerminar = null;
  // os quadros passam sozinhos, a cada 5 s; o último espera o botão
  let relogio = null;
  const tempoDe = () => 5000;   // 5 s por quadro
  function pararRelogio() { clearTimeout(relogio); relogio = null; }

  /* ------------- as peças de cada quadro ------------- */

  function mostrarArte(q) {
    // a imagem do quadro, ou a reserva enquanto ela não existe
    const usar = src => {
      tela.style.setProperty('--arte', `url(${src})`);
      // reinicia o zoom lento
      arte.classList.remove('zoom');
      void arte.offsetWidth;
      arte.classList.add('zoom');
    };
    const sonda = new Image();
    sonda.onload = () => { if (QUADROS[atual] === q) usar(q.img + V); };
    sonda.onerror = () => { if (QUADROS[atual] === q) usar(q.reserva); };
    sonda.src = q.img + V;
  }

  // todas as imagens de lição, na ordem dos chamados
  function figurinhas() {
    const lista = [];
    SITUACOES.forEach(s => s.fases.forEach(f => {
      lista.push({ src: (f.licao && f.licao.imagem) || s.cena, reserva: s.cena, cor: s.cor });
    }));
    return lista;
  }

  function mostrarAlbum() {
    const lista = figurinhas();
    album.textContent = '';
    lista.forEach((f, i) => {
      const el = document.createElement('span');
      el.className = 'fim-figurinha';
      el.style.setProperty('--atraso', `${0.25 + i * 0.07}s`);
      el.style.setProperty('--giro', `${[-3, 2, -1.5, 3, -2, 1][i % 6]}deg`);
      if (f.cor) el.style.setProperty('--c', f.cor);
      const sonda = new Image();
      sonda.onload = () => { el.style.backgroundImage = `url("${f.src}")`; };
      sonda.onerror = () => { if (f.reserva) el.style.backgroundImage = `url("${f.reserva}")`; };
      sonda.src = f.src;
      album.append(el);
    });
    tela.style.setProperty('--arte', 'none');
    return lista.length;
  }

  function soltarConfete() {
    confete.textContent = '';
    const cores = ['#f2b705', '#e2543a', '#4fae6b', '#5b8fd6', '#8a63c7', '#f08ab0'];
    for (let i = 0; i < 40; i++) {
      const c = document.createElement('i');
      c.style.left = `${Math.random() * 100}%`;
      c.style.background = cores[i % cores.length];
      c.style.animationDelay = `${Math.random() * 1.8}s`;
      c.style.animationDuration = `${2.6 + Math.random() * 2}s`;
      c.style.setProperty('--giro', `${Math.random() * 720 - 360}deg`);
      c.style.setProperty('--lado', `${Math.random() * 16 - 8}cqw`);
      confete.append(c);
    }
  }

  function quadro(i) {
    atual = i;
    pararRelogio();
    const q = QUADROS[i];
    album.hidden = !q.album;
    arte.hidden = !!q.album;
    let n = 0;
    if (q.album) n = mostrarAlbum(); else mostrarArte(q);
    texto.textContent = q.texto(n, nome);
    confete.textContent = '';
    if (q.festa) {
      soltarConfete();
      Som.festa();
    } else if (i > 0) {
      Som.quadro();
    }
    dots.innerHTML = QUADROS.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('');
    proximo.textContent = i === QUADROS.length - 1 ? 'Concluir' : 'Avançar ›';
    // o ponto do quadro atual vira uma barrinha que enche no tempo do quadro
    dots.classList.toggle('auto', i < QUADROS.length - 1);
    if (i < QUADROS.length - 1) {
      const tempo = tempoDe(texto.textContent, q);
      dots.style.setProperty('--tempo', tempo + 'ms');
      relogio = setTimeout(() => {
        if (tela.classList.contains('on') && atual === i) quadro(i + 1);
      }, tempo);
    }
  }

  function terminar() {
    pararRelogio();
    confete.textContent = '';
    const fim = aoTerminar;
    aoTerminar = null;
    if (fim) fim();
  }

  proximo.onclick = () => (atual < QUADROS.length - 1 ? quadro(atual + 1) : terminar());
  $('#bFimPular').onclick = terminar;

  function tocar(perfil, fim) {
    nome = (perfil && perfil.nome) || 'Agente';
    aoTerminar = fim || null;
    window.irPara('fim');
    quadro(0);
  }

  /* ------------- certificado ------------- */

  // a ideia que cada chamado ensina (a mesma da tabela do projeto)
  const IDEIAS = {
    sanduiche: 'A ordem importa',
    maos: 'Repetição',
    robo: 'Passos escondidos',
    mochila: 'Instrução',
    abelhas: 'Começo, meio e fim',
    rua: 'Condição',
    limonada: 'Ao mesmo tempo',
    dentes: 'O que abre, fecha',
  };
  const CORPO = ['menina', 'menino', 'afro-menina', 'afro-menino', 'latina', 'latino', 'secreto'];

  function codigoDo(perfil) {
    // o mesmo código do crachá (app.js)
    let n = 7 + Number(perfil.avatar);
    for (const ch of perfil.nome || 'Agente') n = (n * 31 + ch.charCodeAt(0)) % 10000;
    return 'AG-' + String(n).padStart(4, '0');
  }

  function certificado(perfil) {
    const nomeAgente = (perfil && perfil.nome) || 'Agente';
    $('#certNome').textContent = nomeAgente;
    $('#certTexto').textContent =
      `atendeu os ${SITUACOES.length} chamados da cidade de Algoritimando, ajudando os moradores passo a passo, e aprendeu estas ideias:`;
    const lista = $('#certIdeias');
    lista.textContent = '';
    SITUACOES.forEach(s => {
      const li = document.createElement('li');
      if (s.cor) li.style.setProperty('--c', s.cor);
      const b = document.createElement('b');
      b.textContent = IDEIAS[s.id] || s.titulo;
      const small = document.createElement('small');
      small.textContent = s.titulo;
      li.append(b, small);
      lista.append(li);
    });
    $('#certEstrelas').textContent = Progresso.total();
    $('#certCodigo').textContent = codigoDo(perfil);
    $('#certData').textContent = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    const rosto = $('#certRosto');
    rosto.onerror = () => { rosto.onerror = null; rosto.src = `img/av${perfil.avatar}.webp`; };
    rosto.src = `img/agente-${CORPO[+perfil.avatar] || 'menina'}.webp`;
    abrirComFesta();
  }

  /* A entrada do certificado acompanha o som (audio/efeitos/
     certificado.mp3): a folha nasce pequena e cresce junto com a
     música até o ápice (1,6 s); no ápice vêm o clarão, os raios, o
     confete e um pulinho da folha. Os tempos ficam no style.css
     ("certificado: a entrada com festa"). */
  function abrirComFesta() {
    const modal = $('#certificado');
    modal.classList.remove('festa');
    modal.classList.add('on');
    // os efeitos saem do meio da folha (medido antes de ela encolher),
    // em relação à própria camada de efeitos: vale em qualquer tela,
    // com ou sem barra de rolagem
    const folha = modal.querySelector('.certificado-folha').getBoundingClientRect();
    const efeitos = modal.querySelector('.cert-efeitos');
    const base = efeitos.getBoundingClientRect();
    efeitos.style.setProperty('--cx', `${folha.left + folha.width / 2 - base.left}px`);
    efeitos.style.setProperty('--cy', `${folha.top + folha.height / 2 - base.top}px`);
    efeitos.style.setProperty('--lado', `${Math.max(folha.width, folha.height)}px`);
    soltarConfeteDoCertificado(modal.querySelector('.cert-confete'), folha.width);
    void modal.offsetWidth;          // recomeça as animações a cada abertura
    modal.classList.add('festa');
    Som.certificado();
  }

  function soltarConfeteDoCertificado(caixa, largura) {
    caixa.textContent = '';
    const cores = ['#ffd34d', '#8a63c7', '#4fae6b', '#e07a4f', '#3f8fc9', '#ffffff'];
    for (let k = 0; k < 42; k++) {
      const c = document.createElement('i');
      const angulo = (k / 42) * Math.PI * 2 + Math.random() * 0.3;
      const forca = largura * (0.45 + Math.random() * 0.45);
      c.style.setProperty('--dx', `${Math.cos(angulo) * forca}px`);
      c.style.setProperty('--dy', `${Math.sin(angulo) * forca * 0.75}px`);
      c.style.setProperty('--giro', `${(Math.random() * 2 - 1) * 720}deg`);
      c.style.setProperty('--dur', `${1.3 + Math.random() * 1.1}s`);
      c.style.background = cores[k % cores.length];
      if (k % 4 === 0) c.className = 'estrela';
      caixa.append(c);
    }
  }
  $('#bCertFechar').onclick = () => $('#certificado').classList.remove('on');
  /* Impressão: uma cópia da folha vai para #impressao, direto no
     body. O jogo ocupa a tela toda e esconde o que passa dela; no
     iPhone isso cortava o certificado no meio. Fora do jogo, a folha
     se ajusta à largura do papel (ver @media print no style.css).
     Também vale para quem imprime pelo menu do navegador. */
  function prepararImpressao() {
    const destino = $('#impressao');
    if (!destino || !$('#certificado').classList.contains('on')) return;
    // precisa ficar direto no body: o resto do body some na impressão
    if (destino.parentElement !== document.body) document.body.append(destino);
    const copia = $('#certificado .certificado-folha').cloneNode(true);
    copia.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    destino.replaceChildren(copia);
  }
  window.addEventListener('beforeprint', prepararImpressao);
  $('#bCertImprimir').onclick = () => { prepararImpressao(); window.print(); };

  window.Final = { tocar, certificado };
})();
