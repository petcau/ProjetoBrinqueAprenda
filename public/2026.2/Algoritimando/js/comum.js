/* ============================================================
   comum.js — o que o jogo e o editor do professor fazem igual:
   a carta de um passo, o embaralhamento da bandeja e a conferência
   de um arquivo .json.

   A prévia do editor mostra a MESMA carta do jogo: se as duas
   divergirem, o professor testa uma coisa e a criança joga outra.

   Este arquivo mexe no DOM — ao contrário do motor.js, que roda
   no Node para os testes.
   ============================================================ */

'use strict';

(function () {

  /* ============================================================
     FIGURA DA CARTA

     O campo "imagem" de um passo é um caminho ("img/passos/...")
     ou uma data: URL (vinda do editor). Enquanto o arquivo não
     existe — as ilustrações ainda estão sendo feitas, veja
     IMAGENS.md — ou quando ele não carrega, a carta mostra o
     quadro tracejado "ilustração do passo", como no Figma. A
     legenda continua dizendo o passo inteiro.
     ============================================================ */

  function mostrarQuadroVazio(el) {
    el.classList.remove('figura-imagem');
    el.style.backgroundImage = '';
    el.classList.add('figura-vazia');
    el.textContent = 'ilustração do passo';
  }

  function preencherFigura(el, imagem) {
    if (!imagem) {
      mostrarQuadroVazio(el);
      return;
    }

    el.classList.add('figura-imagem');
    el.style.backgroundImage = `url("${imagem}")`;

    /* background-image não avisa quando falha, então a mesma URL é
       pedida de novo por um Image() só para ouvir o onerror. O
       navegador serve as duas do mesmo cache: é uma requisição, não
       duas. */
    const sonda = new Image();
    sonda.onerror = () => mostrarQuadroVazio(el);
    sonda.src = imagem;
  }

  /* ---------------- a carta inteira ---------------- */

  function criarCarta(passo) {
    const carta = document.createElement('article');
    carta.className = 'carta';
    carta.dataset.passo = passo.id;
    // o arrasto.js prepara assim as cartas que já existem na
    // página; estas nascem depois, então recebem os atributos aqui
    carta.tabIndex = 0;
    carta.setAttribute('role', 'button');
    carta.setAttribute('aria-pressed', 'false');

    const figura = document.createElement('div');
    figura.className = 'carta-figura';
    figura.setAttribute('aria-hidden', 'true');   // a legenda já diz tudo
    preencherFigura(figura, passo.imagem);

    const legenda = document.createElement('p');
    legenda.className = 'carta-legenda';
    legenda.textContent = passo.texto || '(sem legenda)';
    // legenda comprida: no celular a carta é baixa e larga, e a letra
    // diminui um pouco para a frase caber inteira (ver style.css)
    if (legenda.textContent.length > 34) legenda.classList.add('legenda-longa');

    carta.append(figura, legenda);
    return carta;
  }

  /* ---------------- bandeja embaralhada ---------------- */

  function embaralhar(passos) {
    const lista = passos.slice();
    for (let i = lista.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lista[i], lista[j]] = [lista[j], lista[i]];
    }
    // se por sorte saiu a ordem certa, desfaz a "dica"
    if (lista.length > 1 && lista.every((p, i) => p === passos[i])) {
      lista.push(lista.shift());
    }
    return lista;
  }

  /* ============================================================
     CONFERIR UM ARQUIVO .json

     A MESMA conferência no jogo (abrir o chamado do professor) e no
     editor (abrir para continuar editando). Devolve { ok: true,
     situacao } ou { ok: false, mensagem } — cada recusa tem a sua
     frase, e a tela nunca trava.

     paraJogar = true  → vai ser jogado agora: exige níveis com passos;
     paraJogar = false → o editor vai COMPLETAR o arquivo, então
                         aceita níveis vazios de propósito.
     ============================================================ */

  function validarArquivoSituacao(texto, paraJogar) {
    let obj;
    try { obj = JSON.parse(texto); }
    catch {
      return { ok: false, mensagem: 'Este arquivo não é um .json válido. ' +
        'Ele foi salvo pela Área do professor?' };
    }

    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      return { ok: false, mensagem: 'Este arquivo não parece ser um chamado do jogo.' };
    }

    if (typeof obj.formato === 'string' && !obj.formato.startsWith('passo-a-passo/')) {
      return { ok: false, mensagem: `Este arquivo é de outro programa ` +
        `(formato "${obj.formato}"), não um chamado do Algoritimando.` };
    }

    if (!Array.isArray(obj.fases)) {
      return { ok: false, mensagem: 'Este arquivo não parece ser um chamado ' +
        'do jogo (não achei os níveis).' };
    }

    if (!paraJogar) return { ok: true, situacao: obj };

    if (!obj.fases.length) {
      return { ok: false, mensagem: 'Este arquivo não tem nenhum nível para jogar. ' +
        'Abra-o na Área do professor para completá-lo.' };
    }

    const jogavel = obj.fases.every(f =>
      f && typeof f === 'object' && Array.isArray(f.passos) && f.passos.length);
    if (!jogavel) {
      return { ok: false, mensagem: 'Este arquivo tem nível sem nenhum passo: ' +
        'abra-o na Área do professor para completá-lo.' };
    }

    return { ok: true, situacao: obj };
  }

  /* ---------------- estrelas (de 0 a 3) ----------------
     A mesma estrela do placar (img/ui/estrela.webp); as que faltam
     aparecem apagadas. Só desenho: quem usa diz o número no
     aria-label do botão. */
  function estrelasHTML(ganhas, total = 3) {
    let html = '';
    for (let i = 0; i < total; i++) {
      html += `<img class="estrela${i < ganhas ? '' : ' apagada'}" src="img/ui/estrela.webp" alt="">`;
    }
    return html;
  }

  /* ---------------- selo de uma ideia ----------------
     Um disco com o desenho da ideia. Enquanto a imagem do selo não
     existe (ou não carrega), fica o desenho em linhas daqui; quando
     existe, ela cobre o disco. "ganho = false" mostra o selo apagado. */
  const TRACO = 'fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';
  const ICONES_SELO = {
    // uma seta que dá a volta: repetir
    repetir: `<path ${TRACO} d="M18.5 8.5A7.5 7.5 0 1 0 19.5 13"/><path ${TRACO} d="M19.5 4.5v4.5H15"/>`,
    // um caminho que se divide em dois: decidir
    decidir: `<path ${TRACO} d="M12 21v-7"/><path ${TRACO} d="M12 14 6 7.5M12 14l6-6.5"/><path ${TRACO} d="M3.5 8.5 6 5l3.5 2M14.5 7 18 5l2.5 3.5"/>`,
    // dois caminhos que se juntam num só: ao mesmo tempo
    juntar: `<path ${TRACO} d="M6 3.5v4.5c0 3.5 6 3.5 6 7M18 3.5v4.5c0 3.5-6 3.5-6 7v5.5"/><path ${TRACO} d="M9 18l3 3 3-3"/>`,
    // um par que abre e fecha
    par: `<path ${TRACO} d="M9 4.5H5.5v15H9M15 4.5h3.5v15H15"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/>`,
  };

  function criarSelo(selo, ganho = true) {
    const disco = document.createElement('span');
    disco.className = 'selo' + (ganho ? '' : ' apagado');
    disco.setAttribute('role', 'img');
    disco.setAttribute('aria-label', `Selo ${selo.nome}${ganho ? '' : ' (ainda não conquistado)'}`);
    disco.innerHTML = `<svg class="selo-desenho" viewBox="0 0 24 24" aria-hidden="true">${ICONES_SELO[selo.icone] || ICONES_SELO.repetir}</svg>`;
    if (selo.imagem) {
      const img = document.createElement('img');
      img.className = 'selo-imagem';
      img.alt = '';
      img.onerror = () => img.remove();
      img.src = selo.imagem;
      disco.append(img);
    }
    return disco;
  }

  window.Comum = { criarCarta, embaralhar, validarArquivoSituacao, estrelasHTML, criarSelo };

})();
