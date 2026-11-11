/* ============================================================
   editor.js — Área do professor.

   Gera e lê o MESMO formato de chamado que já vem no jogo (ver
   motor.js e situacoes.js): um formato só, nunca dois. Salva e abre
   arquivos .json na máquina do professor — sem servidor, sem nuvem.
   No jogo, o menu "Área do professor" abre esse arquivo para jogar.

   O professor nunca vê a palavra "grafo". Ele:
     - escreve os passos NA ORDEM CERTA, de cima para baixo;
     - marca, em cada passo, quais passos de cima precisam ter
       acontecido antes dele (vira dependeDe nos dados) — o que não
       for marcado pode trocar de lugar;
     - escreve, para cada um desses, o que o Robô-guia diz à criança
       que coloca o passo cedo demais (vira explicacao nos dados).

   A PRÉVIA é o jogo de verdade: o editor.html traz as telas de fase
   e de lição do index.html, e quem joga é o jogo.js, com o arrasto.js
   e o motor.js. O progresso e as dicas da prévia ficam em chaves
   próprias (ALGORITIMANDO_PREVIA), longe do jogo da criança.
   ============================================================ */

'use strict';

(function () {

  /* ---------------------- constantes ---------------------- */

  const CHAVE_RASCUNHO = 'algoritimando-editor-rascunho';
  const CHAVE_PREVIA = 'prof:previa';

  // foto de celular chega com 4000px e 3–5MB; no jogo a carta tem
  // ~200px. Cada imagem é reduzida a esta largura ANTES de entrar
  // nos dados — só o resultado é guardado, o original é descartado
  const LARGURA_MAX_IMAGEM = 400;   // carta de passo
  const LARGURA_MAX_LICAO  = 800;   // imagem da lição, que é grande

  // acima disso o arquivo fica pesado para abrir e compartilhar
  const LIMITE_TAMANHO = 4 * 1024 * 1024;

  /* ---------------------- elementos ---------------------- */

  const $ = s => document.querySelector(s);

  const campoTitulo        = $('#campo-titulo');
  const campoCenario       = $('#campo-cenario');
  const campoMontagem      = $('#campo-montagem');
  const blocoBaseCena      = $('#bloco-base-cena');
  const baseCenaEditor     = $('#base-cena-editor');
  const listaFases         = $('#lista-fases');
  const semFase            = $('#sem-fase');
  const faseConteudo       = $('#fase-conteudo');
  const faseCabecalho      = $('#fase-cabecalho');
  const campoFaseTitulo    = $('#campo-fase-titulo');
  const campoFaseInstrucao = $('#campo-fase-instrucao');
  const campoFaseMascote   = $('#campo-fase-mascote');
  const listaPassos        = $('#lista-passos');
  const campoPergunta      = $('#campo-licao-pergunta');
  const campoTextoLicao    = $('#campo-licao-texto');
  const campoReflexao1     = $('#campo-licao-reflexao1');
  const campoReflexao2     = $('#campo-licao-reflexao2');
  const licaoImagemEditor  = $('#licao-imagem-editor');
  const caixaAvisos        = $('#avisos');
  const btnAbrir           = $('#btn-abrir');
  const btnNovo            = $('#btn-novo');
  const btnSalvar          = $('#btn-salvar');
  const btnNovaFase        = $('#btn-nova-fase');
  const btnNovoPasso       = $('#btn-novo-passo');
  const btnTestar          = $('#btn-testar');
  const inputImagem        = $('#input-imagem');
  const inputAbrir         = $('#input-abrir');
  const indicadorTamanho   = $('#indicador-tamanho');

  /* ---------------------- estado ---------------------- */

  let situacao = null;              // o que está sendo editado
  let indiceFase = 0;               // nível aberto no painel
  let pedidoDeImagem = null;   // { dono, largura, depois }: quem pediu imagem
  let salvarConfirmado = false;     // já viu os avisos e insistiu?
  let avisouRascunho = false;       // aviso de rascunho cheio, uma vez só

  function faseAtual() {
    return situacao.fases[indiceFase] || null;
  }

  /* ============================================================
     CENÁRIOS — os fundos dos quatro chamados do jogo
     ============================================================ */

  // só os chamados que têm fundo ilustrado (os novos ainda não têm)
  const CENARIOS = SITUACOES.filter(s => s.fundo).map(s => ({
    id: s.id, nome: `${s.local} (${s.titulo})`,
    fundo: s.fundo, fundoConclusao: s.fundoConclusao, cor: s.cor,
  }));

  campoCenario.append(new Option('Nenhum (fundo liso)', ''));
  CENARIOS.forEach(c => campoCenario.append(new Option(c.nome, c.id)));

  // arquivo aberto: descobre o cenário pelo fundo que ele traz
  function cenarioDoFundo(fundo) {
    // arquivos antigos guardam o fundo em .jpg; hoje é .webp
    const sem = f => String(f || '').replace(/\.(webp|png|jpe?g)$/, '');
    const c = CENARIOS.find(x => sem(x.fundo) === sem(fundo));
    return c ? c.id : '';
  }

  /* ============================================================
     MODELO
     ============================================================ */

  function novaSituacao() {
    return { id: '', titulo: '', cenario: '', montagem: '', montagemBase: '', fases: [novaFase()] };
  }

  function novaFase() {
    return {
      titulo: '', instrucao: '', mascote: '',
      passos: novosPassos(3),
      licao: { pergunta: '', imagem: '', texto: '', reflexao: ['', ''] },
    };
  }

  /* dependeDe: ids dos passos de cima que precisam vir antes.
     explicacao: { idDoPreRequisito: fala do Robô-guia } — uma fala
     para cada dependência (o "*" de arquivos antigos vale para as
     que não têm a sua). */
  function novoPasso(anterior) {
    // id provisório único; vira um id legível na hora de exportar
    return {
      id: 'p-' + Math.random().toString(36).slice(2, 8),
      texto: '', imagem: '', peca: '',
      // por padrão, um passo novo espera o de cima
      dependeDe: anterior ? [anterior.id] : [],
      explicacao: {},
    };
  }

  function novosPassos(qtd) {
    const lista = [];
    for (let i = 0; i < qtd; i++) lista.push(novoPasso(lista[i - 1]));
    return lista;
  }

  /* qualquer coisa vinda de fora (arquivo aberto, rascunho antigo)
     passa por aqui e sai no formato interno do editor */
  function normalizarSituacao(obj) {
    const fases = Array.isArray(obj.fases) ? obj.fases : [];
    return {
      id: typeof obj.id === 'string' ? obj.id : '',
      titulo: typeof obj.titulo === 'string' ? obj.titulo : '',
      cenario: typeof obj.cenario === 'string' ? obj.cenario : cenarioDoFundo(obj.fundo),
      montagem: ['pilha', 'cena', 'tirinha'].includes(obj.montagem) ? obj.montagem : '',
      montagemBase: typeof obj.montagemBase === 'string' ? obj.montagemBase : '',
      // entradas que não são objetos (arquivo mexido à mão) são puladas
      fases: fases.filter(f => f && typeof f === 'object').map(normalizarFase),
    };
  }

  function normalizarFase(f) {
    const licao = f.licao || {};
    const reflexao = Array.isArray(licao.reflexao) ? licao.reflexao : [];
    const brutos = (Array.isArray(f.passos) ? f.passos : [])
      .filter(p => p && typeof p === 'object')
      .map(p => ({ ...p, id: (typeof p.id === 'string' && p.id) ? p.id : novoPasso().id }));
    // o grafo vem do motor: dependeDe quando o arquivo traz, e as
    // camadas do ordemLivre nos arquivos antigos do protótipo
    const grafo = derivarDependencias(brutos);
    const passos = brutos.map(p => ({
      id: p.id,
      texto: typeof p.texto === 'string' ? p.texto : '',
      // só imagens embutidas (data:) viajam com o arquivo; um
      // caminho de outro computador não abriria aqui
      imagem: typeof p.imagem === 'string' ? p.imagem : '',
      peca: typeof p.peca === 'string' ? p.peca : '',
      dependeDe: grafo[p.id] || [],
      explicacao: typeof p.explicacao === 'string' ? (p.explicacao ? { '*': p.explicacao } : {})
                : (p.explicacao && typeof p.explicacao === 'object' ? { ...p.explicacao } : {}),
    }));
    // no editor, só passos de CIMA podem ser pré-requisito
    passos.forEach((p, i) => {
      const acima = new Set(passos.slice(0, i).map(x => x.id));
      p.dependeDe = p.dependeDe.filter(id => acima.has(id));
    });
    return {
      titulo: typeof f.titulo === 'string' ? f.titulo : '',
      instrucao: typeof f.instrucao === 'string' ? f.instrucao : '',
      mascote: typeof f.mascote === 'string' ? f.mascote : '',
      passos,
      licao: {
        pergunta: typeof licao.pergunta === 'string' ? licao.pergunta : '',
        imagem: typeof licao.imagem === 'string' ? licao.imagem : '',
        // no editor o texto vive numa caixa só: cada linha = um parágrafo
        texto: Array.isArray(licao.texto) ? licao.texto.join('\n')
             : (typeof licao.texto === 'string' ? licao.texto : ''),
        reflexao: [reflexao[0] || '', reflexao[1] || ''],
      },
    };
  }

  /* ---------------- rascunho automático ---------------- */

  function guardarRascunho() {
    try { localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(situacao)); }
    catch {
      if (!avisouRascunho) {
        avisouRascunho = true;
        mostrarAvisos([], ['O rascunho automático não coube na memória do navegador ' +
          '(as imagens ocupam espaço). Nada sumiu da tela, mas salve o arquivo ' +
          '.json para não perder o trabalho.']);
      }
    }
  }

  function lerRascunho() {
    try {
      const bruto = localStorage.getItem(CHAVE_RASCUNHO);
      return bruto ? normalizarSituacao(JSON.parse(bruto)) : null;
    } catch { return null; }
  }

  // toda mudança passa por aqui: guarda o rascunho e desarma o
  // "Salvar mesmo assim" (os avisos podem ter mudado)
  function mudou() {
    salvarConfirmado = false;
    btnSalvar.textContent = 'Salvar arquivo';
    guardarRascunho();
    atualizarTamanho();
  }

  /* ---------------- tamanho do arquivo ----------------
     O professor vê o quanto o arquivo pesa enquanto monta — as
     imagens dominam a conta. */

  function formatarTamanho(bytes) {
    if (bytes < 1024 * 1024) {
      return Math.max(1, Math.round(bytes / 1024)) + ' KB';
    }
    return (bytes / (1024 * 1024)).toLocaleString('pt-BR',
      { maximumFractionDigits: 1 }) + ' MB';
  }

  let temporizadorTamanho = 0;
  function atualizarTamanho() {
    // pequena espera para não medir megabytes a cada tecla digitada
    clearTimeout(temporizadorTamanho);
    temporizadorTamanho = setTimeout(() => {
      const bytes = new Blob([JSON.stringify(situacao)]).size;
      const pesado = bytes > LIMITE_TAMANHO;
      indicadorTamanho.classList.toggle('alerta', pesado);
      indicadorTamanho.textContent = pesado
        ? `Tamanho do arquivo: ${formatarTamanho(bytes)}, passou de 4 MB. ` +
          'Assim ele fica lento para abrir e compartilhar; menos fotos ajuda.'
        : `Tamanho do arquivo: ${formatarTamanho(bytes)}`;
    }, 300);
  }

  /* ============================================================
     EXPORTAÇÃO — do modelo do editor para o formato do jogo
     ============================================================ */

  function slug(texto) {
    return (texto || '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /* troca os ids provisórios (p-xxxxxx) por ids legíveis tirados
     da legenda; ids que vieram de arquivo aberto não mudam, para
     não quebrar explicações que apontam para eles */
  function estabilizarIds(fase) {
    const usados = new Set(fase.passos.filter(p => !/^p-/.test(p.id)).map(p => p.id));
    const novo = {};
    for (const p of fase.passos) {
      if (!/^p-/.test(p.id)) continue;
      const base = slug(p.texto).slice(0, 30) || p.id;
      let id = base, n = 2;
      while (usados.has(id)) id = `${base}-${n++}`;
      usados.add(id);
      novo[p.id] = id;
      p.id = id;
    }
    // quem apontava para o id antigo passa a apontar para o novo
    const trocar = id => novo[id] || id;
    for (const p of fase.passos) {
      p.dependeDe = p.dependeDe.map(trocar);
      const expl = {};
      for (const [k, v] of Object.entries(p.explicacao)) expl[trocar(k)] = v;
      p.explicacao = expl;
    }
  }

  function exportarSituacao() {
    const fora = {
      formato: 'passo-a-passo/1',
      id: slug(situacao.titulo) || 'meu-chamado',
      titulo: situacao.titulo.trim(),
    };
    const cenario = CENARIOS.find(c => c.id === situacao.cenario);
    if (cenario) {
      fora.cor = cenario.cor;
      fora.fundo = cenario.fundo;
      fora.fundoConclusao = cenario.fundoConclusao;
    }
    if (situacao.montagem) fora.montagem = situacao.montagem;
    if (situacao.montagem === 'cena' && situacao.montagemBase) fora.montagemBase = situacao.montagemBase;
    fora.fases = situacao.fases.map(exportarFase);
    return fora;
  }

  function exportarFase(fase, i) {
    estabilizarIds(fase);

    const fora = { id: `fase-${i + 1}`, titulo: fase.titulo.trim() };
    if (fase.instrucao.trim()) fora.instrucao = fase.instrucao.trim();
    if (fase.mascote.trim()) fora.mascote = fase.mascote.trim();

    fora.passos = fase.passos.map(p => {
      const passo = { id: p.id, texto: p.texto.trim() };
      if (p.imagem) passo.imagem = p.imagem;
      if (p.peca && situacao.montagem) passo.peca = p.peca;
      passo.dependeDe = p.dependeDe.slice();
      // só as falas das dependências marcadas (e o "*" antigo)
      const expl = {};
      for (const id of p.dependeDe.concat('*')) {
        const t = (p.explicacao[id] || '').trim();
        if (t) expl[id] = t;
      }
      if (Object.keys(expl).length) passo.explicacao = expl;
      return passo;
    });

    const licao = exportarLicao(fase.licao);
    if (licao) fora.licao = licao;
    return fora;
  }

  function exportarLicao(licao) {
    const fora = {};
    if (licao.pergunta.trim()) fora.pergunta = licao.pergunta.trim();
    if (licao.imagem) fora.imagem = licao.imagem;
    const linhas = licao.texto.split('\n').map(l => l.trim()).filter(Boolean);
    if (linhas.length === 1) fora.texto = linhas[0];
    else if (linhas.length > 1) fora.texto = linhas;
    const reflexao = licao.reflexao.map(r => r.trim()).filter(Boolean);
    if (reflexao.length) fora.reflexao = reflexao;
    return Object.keys(fora).length ? fora : null;
  }

  /* ============================================================
     VALIDAÇÃO ANTES DE SALVAR
     Só uma coisa BLOQUEIA de verdade: material injogável (nenhum
     nível, ou nível sem passo nenhum). O resto avisa — quem decide
     é o professor, com um segundo clique.
     ============================================================ */

  function validarSituacao(obj) {
    const erros = [], avisos = [];

    if (!obj.fases.length) {
      erros.push('O chamado não tem nenhum nível. Crie pelo menos um antes de salvar.');
    }
    if (!obj.titulo) {
      avisos.push('O chamado está sem nome: dê um nome para ele aparecer direito para a turma.');
    }

    obj.fases.forEach((fase, i) => {
      const nomeFase = `Nível ${i + 1}` + (fase.titulo ? ` ("${fase.titulo}")` : '');

      if (!fase.passos.length) {
        erros.push(`O ${nomeFase} está sem nenhum passo: adicione os passos ou apague o nível.`);
        return;
      }
      if (fase.passos.length < 3) {
        avisos.push(`O ${nomeFase} tem só ${fase.passos.length} passo(s): com menos de 3, a atividade fica fácil demais.`);
      }
      if (fase.passos.length > 8) {
        avisos.push(`O ${nomeFase} tem ${fase.passos.length} passos: com mais de 8, o tabuleiro não cabe bem na tela do celular.`);
      }
      if (!fase.titulo) avisos.push(`O ${nomeFase} está sem título.`);

      const dependencias = derivarDependencias(fase.passos);

      fase.passos.forEach((p, j) => {
        const nomePasso = `o passo ${j + 1}` + (p.texto ? ` ("${p.texto}")` : '');
        if (!p.imagem) {
          avisos.push(`${nomeFase}: ${nomePasso} está sem imagem, e a carta vai mostrar ` +
            'o quadro "ilustração do passo".');
        }
        if (!p.texto) avisos.push(`${nomeFase}: ${nomePasso} está sem legenda.`);

        const porId = {};
        fase.passos.forEach(x => { porId[x.id] = x; });
        const expl = p.explicacao && typeof p.explicacao === 'object' ? p.explicacao : {};
        for (const id of dependencias[p.id] || []) {
          if (!expl[id] && !expl['*']) {
            const pre = porId[id] && porId[id].texto ? `"${porId[id].texto}"` : 'o passo de que ele depende';
            avisos.push(`${nomeFase}: ${nomePasso} está sem a fala do Robô-guia para quando vier ` +
              `antes de ${pre}. Sem ela, a criança vê só uma frase automática do jogo.`);
          }
        }
      });

      if (!fase.licao) {
        avisos.push(`O ${nomeFase} está sem os textos da tela de lição: a criança vai ` +
          'terminar o nível sem a conversa sobre o que aprendeu.');
      }
    });

    return { erros, avisos };
  }

  function mostrarAvisos(erros, avisos, mensagemOk) {
    caixaAvisos.textContent = '';
    const criar = (classe, prefixo, texto) => {
      const div = document.createElement('div');
      div.className = 'ed-aviso ' + classe;
      const forte = document.createElement('strong');
      forte.textContent = prefixo + ' ';
      div.append(forte, texto);
      caixaAvisos.append(div);
    };
    erros.forEach(t => criar('ed-aviso-erro', 'Falta:', t));
    avisos.forEach(t => criar('ed-aviso-atencao', 'Atenção:', t));
    if (!erros.length && mensagemOk) criar('ed-aviso-ok', 'Pronto!', mensagemOk);

    caixaAvisos.hidden = caixaAvisos.children.length === 0;
    if (!caixaAvisos.hidden) {
      caixaAvisos.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function limparAvisos() {
    caixaAvisos.textContent = '';
    caixaAvisos.hidden = true;
  }

  /* ============================================================
     LISTA DE NÍVEIS (coluna da esquerda)
     ============================================================ */

  function renderizarFases() {
    listaFases.textContent = '';
    situacao.fases.forEach((fase, i) => {
      const li = document.createElement('li');
      li.className = 'ed-fase-item' + (i === indiceFase ? ' atual' : '');

      const abrir = document.createElement('button');
      abrir.type = 'button';
      abrir.className = 'ed-fase-abrir';
      abrir.addEventListener('click', () => {
        indiceFase = i;
        renderizarFases();
        renderizarFase();
      });

      const forte = document.createElement('strong');
      forte.textContent = `Nível ${i + 1}`;
      const nome = document.createElement('span');
      nome.className = 'ed-fase-nome';
      nome.textContent = fase.titulo || '(sem título)';
      const qtd = document.createElement('span');
      qtd.className = 'ed-fase-qtd';
      qtd.textContent = `${fase.passos.length} passo(s)`;
      abrir.append(forte, nome, qtd);

      const botoes = document.createElement('div');
      botoes.className = 'ed-fase-botoes';
      botoes.append(
        botaoMini('↑', `Mover o nível ${i + 1} para cima`, i === 0,
          () => moverFase(i, -1)),
        botaoMini('↓', `Mover o nível ${i + 1} para baixo`, i === situacao.fases.length - 1,
          () => moverFase(i, +1)),
        botaoMini('✕', `Apagar o nível ${i + 1}`, false,
          () => apagarFase(i), 'ed-apagar'),
      );

      li.append(abrir, botoes);
      listaFases.append(li);
    });
  }

  function botaoMini(texto, rotulo, desligado, acao, classeExtra) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ed-botao-mini' + (classeExtra ? ' ' + classeExtra : '');
    b.textContent = texto;
    b.setAttribute('aria-label', rotulo);
    b.title = rotulo;
    b.disabled = desligado;
    b.addEventListener('click', acao);
    return b;
  }

  function moverFase(i, delta) {
    const j = i + delta;
    if (j < 0 || j >= situacao.fases.length) return;
    const [f] = situacao.fases.splice(i, 1);
    situacao.fases.splice(j, 0, f);
    if (indiceFase === i) indiceFase = j;
    else if (indiceFase === j) indiceFase = i;
    renderizarFases();
    renderizarFase();
    mudou();
  }

  function apagarFase(i) {
    const fase = situacao.fases[i];
    const nome = fase.titulo ? `"${fase.titulo}"` : `o Nível ${i + 1}`;
    if (!confirm(`Apagar ${nome}? Os passos dele serão perdidos.`)) return;
    situacao.fases.splice(i, 1);
    indiceFase = Math.max(0, Math.min(indiceFase, situacao.fases.length - 1));
    renderizarFases();
    renderizarFase();
    mudou();
  }

  /* ============================================================
     NÍVEL ABERTO (painel da direita)
     ============================================================ */

  function renderizarFase() {
    const fase = faseAtual();
    semFase.hidden = !!fase;
    faseConteudo.hidden = !fase;
    if (!fase) return;

    faseCabecalho.textContent = `Nível ${indiceFase + 1}`;
    campoFaseTitulo.value = fase.titulo;
    campoFaseInstrucao.value = fase.instrucao;
    campoFaseMascote.value = fase.mascote;
    campoPergunta.value = fase.licao.pergunta;
    campoTextoLicao.value = fase.licao.texto;
    campoReflexao1.value = fase.licao.reflexao[0];
    campoReflexao2.value = fase.licao.reflexao[1];
    renderizarImagemLicao();

    renderizarPassos();
  }

  /* ---------------- cartões de passo ---------------- */

  function renderizarPassos() {
    const fase = faseAtual();
    listaPassos.textContent = '';
    if (!fase) return;

    // o motor diz quem depende de quem — o professor só vê frases
    const dependencias = derivarDependencias(fase.passos);
    const porId = {};
    fase.passos.forEach(p => { porId[p.id] = p; });

    fase.passos.forEach((passo, i) => {
      listaPassos.append(cartaoDePasso(passo, i, dependencias, porId));
    });
  }

  function nomeDoPasso(p) {
    return p && p.texto.trim() ? `“${p.texto.trim()}”` : '(passo sem legenda)';
  }

  function cartaoDePasso(passo, indice, dependencias, porId) {
    const fase = faseAtual();
    const li = document.createElement('li');
    li.className = 'ed-passo';

    /* alça: número + mover/apagar */
    const alca = document.createElement('div');
    alca.className = 'ed-passo-alca';
    const num = document.createElement('span');
    num.className = 'ed-passo-num';
    num.textContent = indice + 1;
    const botoes = document.createElement('div');
    botoes.className = 'ed-passo-botoes';
    botoes.append(
      botaoMini('↑', `Mover o passo ${indice + 1} para cima`, indice === 0,
        () => moverPasso(indice, -1)),
      botaoMini('↓', `Mover o passo ${indice + 1} para baixo`, indice === fase.passos.length - 1,
        () => moverPasso(indice, +1)),
      botaoMini('✕', `Apagar o passo ${indice + 1}`, false,
        () => apagarPasso(indice), 'ed-apagar'),
    );
    alca.append(num, botoes);

    /* corpo: imagem + campos */
    const corpo = document.createElement('div');
    corpo.className = 'ed-passo-corpo';
    const figuras = document.createElement('div');
    figuras.className = 'ed-figuras';
    figuras.append(botaoDeImagem(passo, indice));
    if (situacao.montagem) figuras.append(botaoDePeca(passo, indice));
    corpo.append(figuras);

    const campos = document.createElement('div');
    campos.className = 'ed-passo-campos';

    // legenda
    const campoLegenda = document.createElement('label');
    campoLegenda.className = 'ed-campo';
    const rotuloLegenda = document.createElement('span');
    rotuloLegenda.className = 'ed-rotulo';
    rotuloLegenda.textContent = 'Legenda da carta';
    const inputLegenda = document.createElement('input');
    inputLegenda.type = 'text';
    inputLegenda.maxLength = 80;
    inputLegenda.placeholder = 'Ex.: Coloque a semente no algodão.';
    inputLegenda.value = passo.texto;
    inputLegenda.addEventListener('input', () => {
      passo.texto = inputLegenda.value;
      atualizarVemDepois();
      mudou();
    });
    campoLegenda.append(rotuloLegenda, inputLegenda);
    campos.append(campoLegenda);

    // do que este passo depende: uma caixinha para cada passo de cima
    const acima = fase.passos.slice(0, indice);
    const bloco = document.createElement('fieldset');
    bloco.className = 'ed-depende';
    const legenda = document.createElement('legend');
    legenda.className = 'ed-rotulo';
    legenda.textContent = indice === 0 ? 'Este é o primeiro passo da lista'
      : 'Antes deste passo, precisa ter acontecido:';
    bloco.append(legenda);

    if (!acima.length) {
      const livre = document.createElement('p');
      livre.className = 'ed-vem-depois livre';
      livre.textContent = 'Não precisa esperar nenhum outro passo.';
      bloco.append(livre);
    }

    acima.forEach(pre => {
      const linha = document.createElement('div');
      linha.className = 'ed-dep';
      const check = document.createElement('label');
      check.className = 'ed-check';
      const caixa = document.createElement('input');
      caixa.type = 'checkbox';
      caixa.checked = passo.dependeDe.includes(pre.id);
      caixa.addEventListener('change', () => {
        passo.dependeDe = caixa.checked
          ? fase.passos.filter(x => x.id === pre.id || passo.dependeDe.includes(x.id)).map(x => x.id)
          : passo.dependeDe.filter(id => id !== pre.id);
        renderizarPassos();
        mudou();
      });
      const nome = document.createElement('span');
      nome.className = 'ed-dep-nome';
      nome.dataset.passo = pre.id;
      nome.textContent = nomeDoPasso(pre);
      check.append(caixa, nome);
      linha.append(check);

      if (caixa.checked) {
        const area = document.createElement('textarea');
        area.rows = 2;
        area.placeholder = 'O que o Robô-guia diz se a criança colocar este passo antes dele? ' +
          'Ex.: Sem a semente no algodão, a água não tem o que molhar!';
        area.value = passo.explicacao[pre.id] || passo.explicacao['*'] || '';
        area.setAttribute('aria-label', `Fala do Robô-guia se este passo vier antes de ${nomeDoPasso(pre)}`);
        area.addEventListener('input', () => {
          passo.explicacao[pre.id] = area.value;
          mudou();
        });
        linha.append(area);
      }
      bloco.append(linha);
    });

    if (acima.length) {
      const ajuda = document.createElement('span');
      ajuda.className = 'ed-ajuda';
      ajuda.textContent = passo.dependeDe.length
        ? 'Os passos não marcados podem vir antes ou depois deste. Na fala, conte a consequência do erro, não a regra.'
        : 'Nada marcado: este passo pode ser um dos primeiros, em qualquer ordem.';
      bloco.append(ajuda);
    }
    campos.append(bloco);

    corpo.append(campos);
    li.append(alca, corpo);
    return li;
  }

  // legendas mudaram: atualiza os nomes nas listas "precisa ter
  // acontecido", sem redesenhar os cartões (o professor está digitando)
  function atualizarVemDepois() {
    const fase = faseAtual();
    if (!fase) return;
    const porId = {};
    fase.passos.forEach(p => { porId[p.id] = p; });
    listaPassos.querySelectorAll('.ed-dep-nome[data-passo]').forEach(el => {
      el.textContent = nomeDoPasso(porId[el.dataset.passo]);
    });
  }

  // depois de mover ou apagar: só passos de cima continuam valendo
  function podarDependencias(fase) {
    fase.passos.forEach((p, i) => {
      const acima = new Set(fase.passos.slice(0, i).map(x => x.id));
      p.dependeDe = p.dependeDe.filter(id => acima.has(id));
    });
  }

  function moverPasso(indice, delta) {
    const fase = faseAtual();
    const j = indice + delta;
    if (j < 0 || j >= fase.passos.length) return;
    const [p] = fase.passos.splice(indice, 1);
    fase.passos.splice(j, 0, p);
    podarDependencias(fase);
    renderizarPassos();
    mudou();
  }

  function apagarPasso(indice) {
    const fase = faseAtual();
    const passo = fase.passos[indice];
    const nome = passo.texto ? `"${passo.texto}"` : `o passo ${indice + 1}`;
    if (!confirm(`Apagar ${nome}?`)) return;
    fase.passos.splice(indice, 1);
    podarDependencias(fase);
    renderizarPassos();
    renderizarFases();   // a contagem de passos do nível mudou
    mudou();
  }

  /* ---------------- imagem do passo ----------------
     Um arquivo do computador (foto do material da própria turma,
     desenho feito pela classe…). Ela é reduzida e embutida no .json,
     para o arquivo funcionar em qualquer computador. Sem imagem, a
     carta mostra o quadro "ilustração do passo", como no jogo. */

  function botaoDeImagem(passo, indice) {
    return seletorDeImagem(passo, {
      nome: `a imagem do passo ${indice + 1}`,
      vazio: 'ilustração do passo',
      largura: LARGURA_MAX_IMAGEM,
      depois: renderizarPassos,
    });
  }

  /* A peça da montagem: na pilha, uma camada recortada (png com
     fundo transparente — por isso não vira jpeg); na cena, a peça já
     no seu lugar, do tamanho do fundo da cena; na tirinha, o
     quadrinho do passo. Sem ela, a tirinha usa a imagem da carta. */
  function botaoDePeca(passo, indice) {
    const modo = situacao.montagem;
    return seletorDeImagem(passo, {
      campo: 'peca',
      nome: `a peça da montagem do passo ${indice + 1}`,
      vazio: modo === 'pilha' ? 'peça da pilha (opcional)'
           : modo === 'cena' ? 'peça da cena (opcional)' : 'quadrinho (opcional)',
      rotulo: modo === 'tirinha' ? 'quadrinho' : 'peça',
      largura: modo === 'cena' ? LARGURA_MAX_LICAO : LARGURA_MAX_IMAGEM,
      transparente: true,
      depois: renderizarPassos,
    });
  }

  // cena: o fundo onde as peças vão sendo desenhadas
  function renderizarBaseCena() {
    blocoBaseCena.hidden = situacao.montagem !== 'cena';
    baseCenaEditor.textContent = '';
    if (blocoBaseCena.hidden) return;
    baseCenaEditor.append(seletorDeImagem(situacao, {
      campo: 'montagemBase',
      nome: 'o fundo da cena',
      vazio: 'fundo da cena',
      rotulo: 'fundo',
      largura: LARGURA_MAX_LICAO,
      depois: renderizarBaseCena,
    }));
  }

  /* A lição usa o mesmo seletor: a imagem é o que a criança vê;
     o texto fica atrás do botão "Para o professor". */
  function renderizarImagemLicao() {
    const fase = faseAtual();
    licaoImagemEditor.textContent = '';
    if (!fase) return;
    licaoImagemEditor.append(seletorDeImagem(fase.licao, {
      nome: 'a imagem da lição',
      vazio: 'ilustração da lição',
      largura: LARGURA_MAX_LICAO,
      depois: renderizarImagemLicao,
    }));
  }

  // dono = qualquer objeto com o campo da imagem ("imagem" ou "peca")
  function seletorDeImagem(dono, { campo = 'imagem', nome, vazio, rotulo = 'imagem',
                                   largura, transparente = false, depois }) {
    const passo = { get imagem() { return dono[campo]; }, set imagem(v) { dono[campo] = v; } };
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'ed-miniatura' + (passo.imagem ? '' : ' vazia');
    botao.setAttribute('aria-label', (passo.imagem ? 'Trocar ' : 'Escolher ') + nome);

    const figura = document.createElement('span');
    figura.className = 'ed-miniatura-figura';
    if (passo.imagem) figura.style.backgroundImage = `url("${passo.imagem}")`;
    else figura.textContent = vazio;

    const legenda = document.createElement('span');
    legenda.className = 'ed-miniatura-rotulo';
    legenda.textContent = passo.imagem ? `Trocar ${rotulo}` : `Escolher ${rotulo}…`;

    botao.append(figura, legenda);
    botao.addEventListener('click', () => {
      pedidoDeImagem = { dono: passo, largura, transparente, depois };
      inputImagem.click();
    });

    if (!passo.imagem) return botao;

    // com imagem, dá para tirá-la e voltar ao quadro vazio
    const bloco = document.createElement('div');
    bloco.className = 'ed-figura';
    const tirar = document.createElement('button');
    tirar.type = 'button';
    tirar.className = 'ed-tirar-imagem';
    tirar.textContent = `Tirar ${rotulo}`;
    tirar.addEventListener('click', () => {
      passo.imagem = '';
      depois();
      mudou();
    });
    bloco.append(botao, tirar);
    return bloco;
  }

  inputImagem.addEventListener('change', () => {
    const arquivo = inputImagem.files[0];
    inputImagem.value = '';
    if (!arquivo || !pedidoDeImagem) return;
    const { dono, largura, transparente, depois } = pedidoDeImagem;
    pedidoDeImagem = null;

    const leitor = new FileReader();
    leitor.onload = () => {
      const img = new Image();
      img.onload = () => {
        // encolhe até a largura máxima, mantendo a proporção
        const escala = Math.min(1, largura / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * escala));
        canvas.height = Math.max(1, Math.round(img.height * escala));
        const ctx = canvas.getContext('2d');
        // jpeg não tem transparência: sem este fundo, um png
        // transparente sairia com fundo preto. A peça da pilha
        // precisa do recorte, então fica em png.
        if (!transparente) {
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // só o resultado reduzido é guardado; o original é descartado
        dono.imagem = transparente ? canvas.toDataURL('image/png')
                                   : canvas.toDataURL('image/jpeg', 0.8);
        depois();
        mudou();
      };
      img.onerror = () => {
        mostrarAvisos([], ['Não deu para ler esse arquivo como imagem. Tente um .png ou .jpg.']);
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  });

  /* ============================================================
     CAMPOS FIXOS (ligados uma única vez; escrevem no nível atual)
     ============================================================ */

  function ligarCampo(el, gravar) {
    el.addEventListener('input', () => {
      gravar(el.value);
      mudou();
    });
  }

  ligarCampo(campoTitulo, v => { situacao.titulo = v; });
  campoCenario.addEventListener('change', () => {
    situacao.cenario = campoCenario.value;
    mudou();
  });
  campoMontagem.addEventListener('change', () => {
    situacao.montagem = campoMontagem.value;
    renderizarBaseCena();
    renderizarPassos();   // aparece (ou some) o seletor de peça
    mudou();
  });
  ligarCampo(campoFaseTitulo, v => {
    const f = faseAtual(); if (!f) return;
    f.titulo = v;
    renderizarFases();          // o nome na lista acompanha
  });
  ligarCampo(campoFaseInstrucao, v => { const f = faseAtual(); if (f) f.instrucao = v; });
  ligarCampo(campoFaseMascote, v => { const f = faseAtual(); if (f) f.mascote = v; });
  ligarCampo(campoPergunta,  v => { const f = faseAtual(); if (f) f.licao.pergunta = v; });
  ligarCampo(campoTextoLicao, v => { const f = faseAtual(); if (f) f.licao.texto = v; });
  ligarCampo(campoReflexao1, v => { const f = faseAtual(); if (f) f.licao.reflexao[0] = v; });
  ligarCampo(campoReflexao2, v => { const f = faseAtual(); if (f) f.licao.reflexao[1] = v; });

  /* ============================================================
     AÇÕES DO CABEÇALHO
     ============================================================ */

  btnNovaFase.addEventListener('click', () => {
    situacao.fases.push(novaFase());
    indiceFase = situacao.fases.length - 1;
    renderizarFases();
    renderizarFase();
    mudou();
    campoFaseTitulo.focus();
  });

  btnNovoPasso.addEventListener('click', () => {
    const fase = faseAtual();
    if (!fase) return;
    fase.passos.push(novoPasso(fase.passos[fase.passos.length - 1]));
    renderizarPassos();
    renderizarFases();
    mudou();
    const ultimo = listaPassos.lastElementChild;
    if (ultimo) ultimo.querySelector('input[type="text"]').focus();
  });

  function carregar(nova) {
    situacao = nova;
    if (!situacao.fases.length) situacao.fases.push(novaFase());
    indiceFase = 0;
    campoTitulo.value = situacao.titulo;
    campoCenario.value = situacao.cenario;
    campoMontagem.value = situacao.montagem;
    renderizarBaseCena();
    renderizarFases();
    renderizarFase();
  }

  btnNovo.addEventListener('click', () => {
    if (!confirm('Começar do zero? O que está na tela será apagado.')) return;
    carregar(novaSituacao());
    limparAvisos();
    mudou();
    campoTitulo.focus();
  });

  /* ---------------- salvar ---------------- */

  btnSalvar.addEventListener('click', () => {
    const obj = exportarSituacao();
    const { erros, avisos } = validarSituacao(obj);

    const json = JSON.stringify(obj, null, 2);
    const bytes = new Blob([json]).size;
    if (bytes > LIMITE_TAMANHO) {
      avisos.push(`O arquivo ficou com ${formatarTamanho(bytes)}: acima de 4 MB ` +
        'ele demora para abrir e para passar para outros professores. ' +
        'Usar menos fotos (ou fotos menores) resolve.');
    }

    if (erros.length) {
      mostrarAvisos(erros, avisos);
      return;
    }

    // com avisos, o primeiro clique mostra a lista; salvar de
    // verdade exige um segundo clique consciente
    if (avisos.length && !salvarConfirmado) {
      salvarConfirmado = true;
      btnSalvar.textContent = 'Salvar mesmo assim';
      mostrarAvisos([], avisos.concat(
        ['Revise os pontos acima, ou clique em "Salvar mesmo assim" para baixar do jeito que está.']));
      return;
    }

    baixarArquivo(`${obj.id}.json`, json);
    salvarConfirmado = false;
    btnSalvar.textContent = 'Salvar arquivo';
    mostrarAvisos([], avisos, `Arquivo "${obj.id}.json" (${formatarTamanho(bytes)}) baixado! ` +
      'Para jogar, abra o jogo e use "Área do professor" no menu.');
  });

  function baixarArquivo(nome, json) {
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nome;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  /* ---------------- abrir ---------------- */

  btnAbrir.addEventListener('click', () => inputAbrir.click());

  inputAbrir.addEventListener('change', () => {
    const arquivo = inputAbrir.files[0];
    inputAbrir.value = '';
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onerror = () => {
      mostrarAvisos(['Não deu para ler esse arquivo. Confira se ele ainda existe e tente de novo.'], []);
    };
    leitor.onload = () => {
      /* a conferência é a MESMA do jogo (comum.js), mas aqui a
         exigência é a mais frouxa: o editor existe justamente para
         completar um chamado pela metade */
      const conferencia = Comum.validarArquivoSituacao(leitor.result, false);
      if (!conferencia.ok) {
        mostrarAvisos([conferencia.mensagem], []);
        return;
      }
      let aberta;
      try { aberta = normalizarSituacao(conferencia.situacao); }
      catch {
        mostrarAvisos(['Este arquivo está incompleto ou fora do formato: não deu para abrir.'], []);
        return;
      }
      carregar(aberta);
      mudou();
      const resultado = validarSituacao(exportarSituacao());
      mostrarAvisos(resultado.erros, resultado.avisos, 'Chamado aberto!');
    };
    leitor.readAsText(arquivo);
  });

  /* ============================================================
     PRÉVIA — o nível exatamente como a criança verá.
     As telas são as do jogo, e quem joga é o jogo.js: aqui só se
     abre a camada da prévia e se entrega o chamado a ele.
     ============================================================ */

  const previa = $('.ed-previa');

  // o jogo.js chama irPara('fase' | 'licao'); na prévia só existem
  // essas duas telas
  window.irPara = id => {
    previa.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id));
  };

  btnTestar.addEventListener('click', () => {
    const obj = exportarSituacao();
    const fase = obj.fases[indiceFase];
    if (!fase || !fase.passos.length) {
      mostrarAvisos(['Este nível ainda não tem nenhum passo para testar.'], []);
      return;
    }
    limparAvisos();
    obj.titulo = obj.titulo || 'Teste do chamado';

    // a prévia começa limpa, com todos os níveis liberados e dicas
    // para o professor experimentar
    Progresso.gravar(CHAVE_PREVIA, { fase: obj.fases.length, niveis: [] });
    Perfil.dados.dicas = 3;

    previa.hidden = false;
    document.body.classList.add('ed-testando');
    iniciarSituacao(obj, CHAVE_PREVIA, indiceFase);
  });

  function fecharPrevia() {
    if (previa.hidden) return;
    previa.hidden = true;
    document.body.classList.remove('ed-testando');
    document.querySelector('#niveis').classList.remove('on');
    previa.querySelectorAll('.screen').forEach(s => s.classList.remove('on'));
    Progresso.apagar(CHAVE_PREVIA);
    btnTestar.focus();
  }

  // o botão de casa das telas do jogo volta para o editor
  previa.querySelectorAll('[data-home]').forEach(b => {
    b.title = 'Voltar ao editor';
    b.setAttribute('aria-label', 'Voltar ao editor');
    b.addEventListener('click', fecharPrevia);
  });

  // terminou a lição de um nível: volta para o editor
  document.addEventListener('conclusao-continuar', fecharPrevia);

  // Esc sai da prévia (a não ser que haja carta selecionada: aí o
  // Esc do arrasto.js só cancela a seleção)
  document.addEventListener('keydown', ev => {
    if (ev.key !== 'Escape' || previa.hidden) return;
    if (document.querySelector('.carta-selecionada')) return;
    if (document.querySelector('#niveis.on')) return;
    fecharPrevia();
  }, true);

  /* ============================================================
     PARTIDA
     ============================================================ */

  carregar(lerRascunho() || novaSituacao());
  atualizarTamanho();

})();
