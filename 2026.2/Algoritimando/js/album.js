/* ============================================================
   album.js — "Meu álbum": as figurinhas das lições

   Cada nível concluído cola uma figurinha: a imagem da lição
   daquele nível (licao.imagem), no espaço dela. Uma página por
   chamado, com um espaço por nível. O que ainda não foi feito
   aparece como espaço vazio, com o número do nível.

   Depois das páginas dos chamados vem a página "Figurinhas
   extras": as imagens antigas das lições (errado x certo), em
   img/licoes/comparativas/, liberadas quando a criança vira
   Agente (Perfil.dados.promovido, 4 chamados concluídos).

   O que conta como concluído vem do Progresso (niveis[i] > 0).
   O álbum só lembra quais figurinhas a criança já VIU, para a
   figurinha nova "colar" com animação na primeira vez
   (chave algoritimando-album).

   Uso: Album.abrir()   (botão "Meu álbum" da central)
        Album.esquecer() (ao recomeçar o jogo)
   ============================================================ */

'use strict';

(function () {

  const modal = document.querySelector('#album');
  if (!modal || typeof SITUACOES === 'undefined') {
    window.Album = { abrir() {}, esquecer() {} };
    return;
  }

  const CHAVE = 'algoritimando-album';
  const $ = s => modal.querySelector(s);

  const abas     = $('.album-abas');
  const pagina   = $('.album-pagina');
  const titulo   = $('.album-titulo');
  const local    = $('.album-local');
  const espacos  = $('.album-espacos');
  const contador = $('.album-contador');
  const barra    = $('.album-barra i');
  const anterior = $('.album-anterior');
  const proxima  = $('.album-proxima');
  const zoom     = $('.album-zoom');
  const zoomImg  = $('.album-zoom-imagem');
  const zoomTxt  = $('.album-zoom-texto');
  const zoomNiv  = $('.album-zoom-nivel');

  let atual = 0;

  /* ------------- memória: figurinhas já vistas ------------- */

  function lerVistas() {
    try {
      const v = JSON.parse(localStorage.getItem(CHAVE) || '[]');
      return new Set(Array.isArray(v) ? v : []);
    } catch { return new Set(); }
  }
  function gravarVistas(vistas) {
    try { localStorage.setItem(CHAVE, JSON.stringify([...vistas])); } catch { /* segue sem memória */ }
  }
  function esquecer() {
    try { localStorage.removeItem(CHAVE); } catch { /* nada a apagar */ }
  }

  /* ------------- o que já foi colado ------------- */

  const chaveDe = (s, i) => `${s.id}:${i}`;
  const coladas = s => {
    const niveis = Progresso.ler(s.id).niveis;
    return s.fases.map((_, i) => (niveis[i] || 0) > 0);
  };
  const novasDe = (s, vistas) =>
    coladas(s).filter((ok, i) => ok && !vistas.has(chaveDe(s, i))).length;

  /* ------------- figurinhas extras -------------
     As imagens antigas das lições, que comparavam "errado x certo"
     (saíram das lições na revisão do professor). Ficam numa página
     a mais, liberada quando a criança vira Agente (4 chamados). */
  const EXTRAS = [
    ['sanduiche', 0], ['robo', 2], ['mochila', 0], ['mochila', 2], ['abelhas', 0],
    ['abelhas', 2], ['maos', 0], ['maos', 1], ['maos', 3], ['rua', 0],
  ].map(([id, nivel]) => ({ s: SITUACOES.find(x => x.id === id), nivel }))
    .filter(e => e.s && e.s.fases[e.nivel])
    .map(e => ({ ...e, src: `img/licoes/comparativas/${e.s.id}-${e.nivel + 1}.webp`, chave: `extra:${e.s.id}:${e.nivel}` }));
  const PAG_EXTRAS = SITUACOES.length;   // a última página
  const ULTIMA = () => (EXTRAS.length ? PAG_EXTRAS : SITUACOES.length - 1);
  const extrasLiberadas = () => !!(window.Perfil && Perfil.dados && Perfil.dados.promovido);
  const novasExtras = vistas => (extrasLiberadas() ? EXTRAS.filter(e => !vistas.has(e.chave)).length : 0);

  function atualizarContador() {
    let feitas = 0;
    let total = 0;
    SITUACOES.forEach(s => {
      total += s.fases.length;
      feitas += coladas(s).filter(Boolean).length;
    });
    contador.textContent = `${feitas} de ${total} figurinhas`;
    barra.style.width = `${total ? (feitas / total) * 100 : 0}%`;
  }

  /* ------------- abas (um rosto por chamado) ------------- */

  function desenharAbas(vistas) {
    abas.textContent = '';
    SITUACOES.forEach((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'album-aba' + (i === atual ? ' ativa' : '');
      b.setAttribute('aria-label', s.titulo);
      b.setAttribute('aria-pressed', String(i === atual));
      if (s.cor) b.style.setProperty('--c', s.cor);
      const img = document.createElement('img');
      img.src = s.cliente || 'img/guide.webp';
      img.alt = '';
      const n = coladas(s).filter(Boolean).length;
      const conta = document.createElement('small');
      conta.textContent = `${n}/${s.fases.length}`;
      b.append(img, conta);
      if (i !== atual && novasDe(s, vistas)) {
        const ponto = document.createElement('i');
        ponto.className = 'album-aba-nova';
        ponto.setAttribute('aria-hidden', 'true');
        b.append(ponto);
      }
      b.onclick = () => irPara(i);
      abas.append(b);
    });
    if (!EXTRAS.length) return;
    // a aba das extras: uma estrela, ou um cadeado enquanto não liberou
    const b = document.createElement('button');
    b.type = 'button';
    const ativa = atual === PAG_EXTRAS;
    b.className = 'album-aba album-aba-extras' + (ativa ? ' ativa' : '') + (extrasLiberadas() ? '' : ' trancada');
    b.setAttribute('aria-label', 'Figurinhas extras');
    b.setAttribute('aria-pressed', String(ativa));
    const icone = document.createElement('span');
    icone.className = 'album-aba-icone';
    icone.innerHTML = extrasLiberadas()
      ? '<img src="img/ui/estrela.webp" alt="" />'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/></svg>';
    const conta = document.createElement('small');
    conta.textContent = 'Extras';
    b.append(icone, conta);
    if (!ativa && novasExtras(vistas)) {
      const ponto = document.createElement('i');
      ponto.className = 'album-aba-nova';
      ponto.setAttribute('aria-hidden', 'true');
      b.append(ponto);
    }
    b.onclick = () => irPara(PAG_EXTRAS);
    abas.append(b);
  }

  /* ------------- a página de um chamado ------------- */

  function figurinha(s, i, nova) {
    const licao = s.fases[i].licao || {};
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'figurinha' + (nova ? ' nova' : '');
    b.style.setProperty('--giro', `${[-2, 1.5, -1, 2, -1.5][i % 5]}deg`);
    const quadro = document.createElement('span');
    quadro.className = 'figurinha-imagem';
    // imagem da lição; enquanto ela não existe, a ilustração do chamado
    const src = licao.imagem || s.cena || '';
    const sonda = new Image();
    sonda.onload = () => { quadro.style.backgroundImage = `url("${src}")`; };
    sonda.onerror = () => { if (s.cena) quadro.style.backgroundImage = `url("${s.cena}")`; };
    if (src) sonda.src = src;
    const nivel = document.createElement('small');
    nivel.textContent = `Nível ${i + 1}`;
    const texto = document.createElement('b');
    texto.textContent = licao.pergunta || s.fases[i].titulo || '';
    b.append(quadro, nivel, texto);
    b.setAttribute('aria-label', `Nível ${i + 1}: ${texto.textContent}`);
    b.onclick = () => ampliar(src, s.cena, i, texto.textContent);
    return b;
  }

  function vazio(i) {
    const d = document.createElement('div');
    d.className = 'figurinha-vazia';
    const n = document.createElement('b');
    n.textContent = String(i + 1);
    const t = document.createElement('small');
    t.textContent = `Conclua o nível ${i + 1}`;
    d.append(n, t);
    return d;
  }

  function figurinhaExtra(e, k, nova) {
    const licao = e.s.fases[e.nivel].licao || {};
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'figurinha' + (nova ? ' nova' : '');
    b.style.setProperty('--giro', `${[-2, 1.5, -1, 2, -1.5][k % 5]}deg`);
    const quadro = document.createElement('span');
    quadro.className = 'figurinha-imagem';
    quadro.style.backgroundImage = `url("${e.src}")`;
    const nivel = document.createElement('small');
    nivel.textContent = `${e.s.titulo} · Nível ${e.nivel + 1}`;
    const texto = document.createElement('b');
    texto.textContent = licao.pergunta || '';
    b.append(quadro, nivel, texto);
    b.setAttribute('aria-label', `${nivel.textContent}: ${texto.textContent}`);
    b.onclick = () => ampliar(e.src, e.s.cena, e.nivel, texto.textContent, nivel.textContent);
    return b;
  }

  function extraTrancada() {
    const d = document.createElement('div');
    d.className = 'figurinha-vazia trancada';
    const n = document.createElement('b');
    n.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/></svg>';
    const t = document.createElement('small');
    t.textContent = 'Vire Agente para liberar';
    d.append(n, t);
    return d;
  }

  function desenharExtras(vistas) {
    pagina.style.setProperty('--c', '#c9a24a');
    titulo.textContent = 'Figurinhas extras';
    local.textContent = extrasLiberadas()
      ? 'Como as lições eram antes'
      : 'Liberadas quando você virar Agente (4 chamados concluídos)';
    espacos.textContent = '';
    espacos.dataset.total = 'extras';
    EXTRAS.forEach((e, k) => {
      if (!extrasLiberadas()) { espacos.append(extraTrancada()); return; }
      espacos.append(figurinhaExtra(e, k, !vistas.has(e.chave)));
      vistas.add(e.chave);
    });
  }

  function desenharPagina() {
    const vistas = lerVistas();
    anterior.disabled = atual === 0;
    proxima.disabled = atual === ULTIMA();
    if (atual === PAG_EXTRAS) {
      desenharExtras(vistas);
      gravarVistas(vistas);
      desenharAbas(vistas);
      somDeFigurinhaNova();
      return;
    }
    const s = SITUACOES[atual];
    pagina.style.setProperty('--c', s.cor || 'var(--brown)');
    titulo.textContent = s.titulo;
    local.textContent = s.local || '';
    espacos.textContent = '';
    espacos.dataset.total = String(s.fases.length);
    coladas(s).forEach((ok, i) => {
      if (!ok) { espacos.append(vazio(i)); return; }
      const chave = chaveDe(s, i);
      espacos.append(figurinha(s, i, !vistas.has(chave)));
      vistas.add(chave);
    });
    // as desta página já foram vistas: a animação não repete
    gravarVistas(vistas);
    desenharAbas(vistas);
    somDeFigurinhaNova();
  }

  // figurinha nova colando: o som vem junto com a animação
  function somDeFigurinhaNova() {
    if (espacos.querySelector('.figurinha.nova') && window.Som && Som.figurinha) {
      setTimeout(() => Som.figurinha(), 250);
    }
  }

  function irPara(i) {
    atual = Math.max(0, Math.min(ULTIMA(), i));
    fecharZoom();
    desenharPagina();
  }

  /* ------------- ver uma figurinha grande ------------- */

  function ampliar(src, reserva, i, texto, legenda) {
    zoomImg.style.backgroundImage = '';
    const sonda = new Image();
    sonda.onload = () => { zoomImg.style.backgroundImage = `url("${src}")`; };
    sonda.onerror = () => { if (reserva) zoomImg.style.backgroundImage = `url("${reserva}")`; };
    sonda.src = src;
    zoomNiv.textContent = legenda || `Nível ${i + 1}`;
    zoomTxt.textContent = texto;
    zoom.hidden = false;
  }
  function fecharZoom() { zoom.hidden = true; }
  zoom.onclick = fecharZoom;

  /* ------------- abrir e fechar ------------- */

  function abrir() {
    const vistas = lerVistas();
    // abre na primeira página com figurinha nova; senão, na primeira
    const comNova = SITUACOES.findIndex(s => novasDe(s, vistas) > 0);
    atual = comNova >= 0 ? comNova : novasExtras(vistas) ? PAG_EXTRAS : 0;
    atualizarContador();
    irPara(atual);
    modal.classList.add('on');
  }
  function fechar() {
    fecharZoom();
    modal.classList.remove('on');
  }

  anterior.onclick = () => irPara(atual - 1);
  proxima.onclick = () => irPara(atual + 1);
  $('.album-fechar').onclick = fechar;
  document.addEventListener('keydown', e => {
    if (!modal.classList.contains('on')) return;
    if (e.key === 'Escape') { if (!zoom.hidden) fecharZoom(); else fechar(); }
    else if (e.key === 'ArrowLeft') irPara(atual - 1);
    else if (e.key === 'ArrowRight') irPara(atual + 1);
  });

  // no celular, arrastar a página para o lado troca de chamado
  let toqueX = null;
  pagina.addEventListener('pointerdown', e => { toqueX = e.clientX; });
  pagina.addEventListener('pointerup', e => {
    if (toqueX === null) return;
    const dx = e.clientX - toqueX;
    toqueX = null;
    if (Math.abs(dx) > 60) irPara(atual + (dx < 0 ? 1 : -1));
  });
  pagina.addEventListener('pointercancel', () => { toqueX = null; });

  window.Album = { abrir, esquecer };
})();
