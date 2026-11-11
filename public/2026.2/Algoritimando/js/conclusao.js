/* ============================================================
   conclusao.js — tela de lição (fase concluída)

   É aqui que a atividade vira conceito: ao completar a fase, a
   tela de "Parabéns! Você completou o nível!" mostra a LIÇÃO
   daquela fase e as recompensas.

   Para a criança, a lição é uma IMAGEM (licao.imagem) com a
   pergunta-título. O texto e as perguntas para conversar ficam
   atrás do botão "Para o professor": servem para ele conduzir a
   conversa — e são a base para desenhar a imagem. Enquanto a
   imagem não existe, aparece o quadro "ilustração da lição".

   TODO o conteúdo vem de fase.licao (ver o formato no motor.js);
   este arquivo só monta a tela. Nada de frase de sanduíche aqui.

   Uso:  mostrarConclusao(situacao, indiceFase, premio)
         premio = { estrelas, dicas } ganhos nesta fase
   Ao apertar o botão (ou Esc), dispara
   CustomEvent('conclusao-continuar', { detail: { situacao,
   indiceFase } }) no document — o jogo.js avança para a próxima
   fase (ou volta à central, na última). Mostrar e esconder a tela
   é com o app.js (irPara), como todas as outras.
   ============================================================ */

'use strict';

(function () {

  const raiz = document.querySelector('#licao');
  if (!raiz) return;

  const painel         = raiz.querySelector('.conclusao-painel');
  const progressoTexto = raiz.querySelector('.conclusao-progresso-texto');
  const pergunta       = raiz.querySelector('.conclusao-pergunta');
  const perguntaTexto  = raiz.querySelector('.conclusao-pergunta-texto');
  const blocoTexto     = raiz.querySelector('.conclusao-texto');
  const reflexao       = raiz.querySelector('.conclusao-reflexao');
  const imagem         = raiz.querySelector('.licao-imagem');
  const professor      = raiz.querySelector('.licao-professor');
  const botaoProf      = raiz.querySelector('.licao-botao-prof');
  const listaReflexao  = raiz.querySelector('.conclusao-reflexao ul');
  const botao          = raiz.querySelector('.conclusao-continuar');
  const botaoTexto     = raiz.querySelector('.conclusao-continuar-texto');
  const arte           = raiz.querySelector('.licao-arte');
  const premioEstrelas = raiz.querySelector('.premio-estrelas');
  const premioDicas    = raiz.querySelector('.premio-dicas');
  const caixaSelo      = raiz.querySelector('.licao-selo');

  // para o evento de continuar
  let contexto = null;

  function preencherParagrafos(bloco, texto) {
    bloco.textContent = '';
    const frases = Array.isArray(texto) ? texto : [texto];
    for (const frase of frases) {
      const p = document.createElement('p');
      p.textContent = frase;
      bloco.append(p);
    }
  }

  /* imagem da lição, ou o quadro tracejado enquanto ela não existe
     (background-image não avisa quando falha: um Image() escuta) */
  function preencherImagem(src, legenda) {
    imagem.classList.remove('vazia');
    imagem.textContent = '';
    imagem.style.backgroundImage = '';
    imagem.setAttribute('aria-label', legenda || 'Ilustração da lição');
    const vazia = () => {
      imagem.style.backgroundImage = '';
      imagem.classList.add('vazia');
      imagem.textContent = 'ilustração da lição';
    };
    if (!src) { vazia(); return; }
    imagem.style.backgroundImage = `url("${src}")`;
    const sonda = new Image();
    sonda.onerror = vazia;
    sonda.src = src;
  }

  // o botão troca a imagem pelo texto do professor, e de volta
  function mostrarProfessor(sim) {
    professor.hidden = !sim;
    imagem.hidden = sim;
    botaoProf.setAttribute('aria-expanded', String(sim));
    botaoProf.textContent = sim ? 'Ver a imagem da lição' : 'Ler a lição';
  }
  botaoProf.addEventListener('click', () => mostrarProfessor(professor.hidden));

  /* ------------- abrir e fechar ------------- */

  function mostrarConclusao(situacao, indiceFase, premio = { estrelas: 0, dicas: 0 }) {
    const licao = situacao.fases[indiceFase].licao || {};

    progressoTexto.textContent =
      `Nível ${indiceFase + 1} de ${situacao.fases.length} concluído`;

    pergunta.hidden = !licao.pergunta;
    perguntaTexto.textContent = licao.pergunta || '';

    blocoTexto.hidden = !licao.texto;
    if (licao.texto) preencherParagrafos(blocoTexto, licao.texto);

    preencherImagem(licao.imagem, licao.pergunta);
    mostrarProfessor(false);
    botaoProf.hidden = !licao.texto && !(licao.reflexao && licao.reflexao.length);

    reflexao.hidden = !(licao.reflexao && licao.reflexao.length);
    listaReflexao.textContent = '';
    (licao.reflexao || []).forEach(perguntaReflexao => {
      const li = document.createElement('li');
      li.textContent = perguntaReflexao;
      listaReflexao.append(li);
    });

    // recompensas da fase e o caminho a seguir
    const e = premio.estrelas;
    premioEstrelas.textContent = `+${e} ${e === 1 ? 'estrela' : 'estrelas'}`;
    premioDicas.textContent = `+${premio.dicas} ${premio.dicas === 1 ? 'dica' : 'dicas'}`;
    const ultima = indiceFase + 1 >= situacao.fases.length;
    botaoTexto.textContent = ultima ? 'Voltar à central' : 'Próximo nível';

    // o selo da ideia, na lição que fecha o chamado (campo "selo")
    const selo = ultima ? situacao.selo : null;
    caixaSelo.hidden = !selo;
    if (selo) {
      caixaSelo.querySelector('.licao-selo-disco').replaceChildren(Comum.criarSelo(selo));
      caixaSelo.querySelector('.licao-selo-nome').textContent = selo.nome;
      caixaSelo.querySelector('.licao-selo-frase').textContent = selo.frase || '';
    }
    arte.style.backgroundImage = situacao.fundoConclusao ? `url("${situacao.fundoConclusao}")` : '';
    raiz.classList.toggle('sem-arte', !situacao.fundoConclusao);

    contexto = { situacao, indiceFase };
    painel.scrollTop = 0;
    setTimeout(() => painel.focus({ preventScroll: true }), 50);
  }

  function fechar() {
    if (!contexto) return;
    const detail = contexto;
    contexto = null;
    document.dispatchEvent(new CustomEvent('conclusao-continuar', { detail }));
  }

  botao.addEventListener('click', fechar);

  // Esc também continua
  raiz.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') {
      ev.preventDefault();
      fechar();
    }
  });

  window.mostrarConclusao = mostrarConclusao;

})();
