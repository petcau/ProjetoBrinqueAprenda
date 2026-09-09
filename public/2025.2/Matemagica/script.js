/* =====================
   ESTADO GLOBAL DO JOGO (MULTIJOGADOR)
===================== */
let numJogadores = 1;
let jogadores = [];                // [{ id, nome, personagem, posicaoAtual, icone }]
let personagensSelecionados = [];

let jogadoresTabuleiro = [];
let jogadorAtualIndex = 0;         // começa no jogador 0
let perguntas = [];
let dadoValor = 0;
let currentQuestion = null;

/* =====================
   NAVEGAÇÃO ENTRE TELAS
===================== */
function irParaPersonagem() {
  window.location.href = "personagem.html";
}

function irParaTabuleiro() {
  // exige todos os nomes preenchidos
  if (jogadores.length < numJogadores || jogadores.some(j => !j.nome || j.nome.trim() === '')) {
    alert(`Por favor, selecione e preencha o nome para os ${numJogadores} jogadores.`);
    return;
  }
  localStorage.setItem("jogadoresMatemagica", JSON.stringify(jogadores));
  window.location.href = "tabuleiro.html";
}

/* =====================
   TELA DE SELEÇÃO
===================== */
// Mudou nº de jogadores
function gerarCamposDeNome() {
  const select = document.getElementById('numJogadores');
  numJogadores = parseInt(select.value, 10);

  // reset
  jogadores = [];
  personagensSelecionados = [];
  document.querySelectorAll('.card-personagem').forEach(card => {
    card.classList.remove('selecionado');
    const wrapper = card.querySelector('.input-nome-wrapper');
    wrapper.innerHTML = '';
  });

  const btn = document.getElementById('btnComecar');
  if (btn) btn.disabled = true;

  // se 1 jogador, já prepara o primeiro card
  if (numJogadores === 1) {
    const primeiroCardWrapper = document.getElementById('inputWrapper-Cavaleira');
    if (primeiroCardWrapper) {
      primeiroCardWrapper.innerHTML = `
        <input type="text"
               id="nome-Cavaleira"
               class="input-nome-jogador"
               placeholder="Seu nome"
               oninput="validarSelecao()"
               onclick="event.stopPropagation()">
      `;
      const primeiroCard = primeiroCardWrapper.closest('.card-personagem');
      primeiroCard.classList.add('selecionado');
      personagensSelecionados.push('Cavaleira');
    }
  }
}

// Clique em um card
function selecionarPersonagem(cardElement, event) {
  // impede desselecionar ao clicar dentro do input
  if (event && event.target.tagName.toLowerCase() === 'input') {
    event.stopPropagation();
    return;
  }

  const nomePersonagem = cardElement.getAttribute('data-personagem');
  const isSelecionado = cardElement.classList.contains('selecionado');
  const nomeInputWrapper = document.getElementById(`inputWrapper-${nomePersonagem}`);

  if (isSelecionado) {
    cardElement.classList.remove('selecionado');
    personagensSelecionados = personagensSelecionados.filter(p => p !== nomePersonagem);
    nomeInputWrapper.innerHTML = '';
    jogadores = jogadores.filter(j => j.personagem !== nomePersonagem);
  } else {
    if (personagensSelecionados.length < numJogadores) {
      cardElement.classList.add('selecionado');
      personagensSelecionados.push(nomePersonagem);
      const jogadorIndex = personagensSelecionados.length;
      nomeInputWrapper.innerHTML = `
        <input type="text"
               id="nome-${nomePersonagem}"
               class="input-nome-jogador"
               placeholder="Nome Jogador ${jogadorIndex}"
               oninput="validarSelecao()"
               onclick="event.stopPropagation()">
      `;
    } else {
      alert(`Você já selecionou o máximo de ${numJogadores} jogadores.`);
    }
  }

  validarSelecao();
}

// Valida nomes + monta array de jogadores
function validarSelecao() {
  jogadores = [];
  let nomesCompletos = true;

  document.querySelectorAll('.card-personagem.selecionado').forEach((card, index) => {
    const nomePersonagem = card.getAttribute('data-personagem');
    const inputNome = document.getElementById(`nome-${nomePersonagem}`);
    const nomeJogador = inputNome ? inputNome.value.trim() : '';

    if (!nomeJogador) nomesCompletos = false;

    jogadores.push({
      id: index + 1,
      nome: nomeJogador || `Jogador ${index + 1}`,
      personagem: nomePersonagem,
      posicaoAtual: 0,
      icone: obterIcone(nomePersonagem)
    });
  });

  const btn = document.getElementById('btnComecar');
  if (btn) btn.disabled = !(jogadores.length === numJogadores && nomesCompletos);
}

// Ícones por personagem
function obterIcone(personagem, tipo = "tabuleiro") {
  let caminho = '';

  switch (personagem) {
    case 'Fada': caminho = 'images/Fada.png'; break;
    case 'Cavaleiro': caminho = 'images/cavaleiro.png'; break;
    case 'Mago': caminho = 'images/mago.png'; break;
    case 'Princesa': caminho = 'images/princesa.png'; break;
    default: caminho = 'images/cavaleira.png'; break;
  }

  // classe diferente dependendo de onde o ícone será usado
  const classe =
    tipo === "hud"
      ? "icone-hud"
      : "icone-personagem"; // tabuleiro (peão)

  return `<img src="${caminho}" alt="${personagem}" class="${classe}">`;
}


/* ============================
   CARREGAR PERGUNTAS DO JSON
============================ */
/* ============================
   CARREGAR PERGUNTAS DO JSON
============================ */
fetch("fases.json")
  .then(response => response.json())
  .then(data => {
    // garante que só salva se for array válido
    perguntas = Array.isArray(data) ? data : [];

    // se o arquivo estiver vazio, limpa o localStorage
    if (perguntas.length === 0) {
      localStorage.removeItem("perguntasMatemagica");
      console.warn("⚠️ fases.json vazio. Perguntas removidas.");
    } else {
      localStorage.setItem("perguntasMatemagica", JSON.stringify(perguntas));
      console.log("✅ Perguntas carregadas com sucesso!");
    }
  })
  .catch(error => {
    console.error("❌ Erro ao carregar perguntas:", error);
    localStorage.removeItem("perguntasMatemagica"); // impede perguntas antigas
    perguntas = [];
  });

/* ============================
   BOOT: detectar tela e iniciar
============================ */
window.addEventListener('load', function () {
  // Tela de seleção?
  if (document.getElementById('numJogadores')) {
    gerarCamposDeNome();
    return;
  }

  // Tela do tabuleiro
  const jogadoresData = localStorage.getItem("jogadoresMatemagica");
  if (jogadoresData) {
    jogadoresTabuleiro = JSON.parse(jogadoresData);
  } else {
    console.error("Dados de jogadores não encontrados. Redirecionando.");
    return;
  }

  perguntas = JSON.parse(localStorage.getItem("perguntasMatemagica")) || [];

  if (document.getElementById("tabuleiro")) {
    gerarTabuleiro();
    atualizarDisplayJogadorAtual();

    const btnDado = document.getElementById('btnJogarDado');
    if (btnDado) btnDado.addEventListener('click', jogarDado);

    const btnConfirm = document.getElementById('btnConfirmarResposta');
    if (btnConfirm) btnConfirm.addEventListener('click', verificarResposta);
  }
});

/* ============================
   TABULEIRO
============================ */
function atualizarDisplayJogadorAtual() {
  const jogadorAtual = jogadoresTabuleiro[jogadorAtualIndex];
  const nomeDisplay = document.getElementById("nomeJogadorDisplay");
  const btnDado = document.getElementById('btnJogarDado');

    if (nomeDisplay) {
    const iconeHud = obterIcone(jogadorAtual.personagem, "hud");

    nomeDisplay.innerHTML = `
      Vez de: <strong>${jogadorAtual.nome}</strong>  
      (${jogadorAtual.personagem}) 
      ${iconeHud}
    `;
  }

  if (btnDado) btnDado.disabled = false;
}

function proximoJogador() {
  jogadorAtualIndex = (jogadorAtualIndex + 1) % jogadoresTabuleiro.length;
  atualizarDisplayJogadorAtual();
}

function gerarTabuleiro() {
  const tabuleiro = document.getElementById("tabuleiro");
  if (!tabuleiro) return;

  tabuleiro.innerHTML = '';

  // cria casas 0..35 (posições vêm do CSS: #casa0, #casa1, ... #casa35)
  for (let i = 0; i <= 35; i++) {
    const casa = document.createElement("div");
    casa.classList.add("casa", "invisivel");
    casa.id = `casa${i}`;
    tabuleiro.appendChild(casa);
  }

  // cria os peões dos jogadores
  jogadoresTabuleiro.forEach(jogador => {
    const jogadorEl = document.createElement("div");
    jogadorEl.classList.add("jogador");
    jogadorEl.id = `jogador-${jogador.id}`;
    jogadorEl.innerHTML = jogador.icone;

    // importante: peão vai direto no TABULEIRO, não na casa
    tabuleiro.appendChild(jogadorEl);

    // começa sempre na casa 0
    jogador.posicaoAtual = 0;
    atualizarPosicao(jogador);
  });
}



/* ============================
   DADO E PERGUNTAS
============================ */
function jogarDado() {
  if (!jogadoresTabuleiro || jogadoresTabuleiro.length === 0) {
    alert("Nenhum jogador encontrado. Volte para a tela de seleção e escolha os personagens.");
    return;
  }

  const btnDado = document.getElementById('btnJogarDado');
  if (btnDado) btnDado.disabled = true;

  dadoValor = Math.floor(Math.random() * 6) + 1;

  const resultadoDado = document.getElementById('resultadoDado');
  if (resultadoDado) resultadoDado.textContent = `Você tirou ${dadoValor}!`;

  mostrarPerguntaParaAvanco();
}


function mostrarPerguntaParaAvanco() {
  const jogadorAtual = jogadoresTabuleiro[jogadorAtualIndex];
  const target = Math.min(jogadorAtual.posicaoAtual + dadoValor, 35);

  // Casa 0 não tem pergunta => vetor é [target - 1]
  const qObj = perguntas[target - 1];

  // Última casa (35) ou sem pergunta: avança direto
  if (!qObj || !qObj.pergunta || target === 35) {
    jogadorAtual.posicaoAtual = target;
    atualizarPosicao(jogadorAtual);
    if (jogadorAtual.posicaoAtual >= 35) {
      mostrarVitoria(jogadorAtual.nome);
    } else {
      proximoJogador();
    }
    return;
  }

  currentQuestion = { target, q: qObj.pergunta, a: qObj.resposta };
  const overlay = document.getElementById('telaPergunta');
  if (overlay) {
    document.getElementById('textoPergunta').textContent =
      `${jogadorAtual.nome}, Casa ${target}: ${currentQuestion.q}`;
    const ansInput = document.getElementById('respostaJogador');
    if (ansInput) {
      ansInput.value = '';
      if (typeof ansInput.focus === 'function') ansInput.focus(); // foco corrigido
    }
    overlay.style.display = 'flex';
  }
}

/* ============================
   RESPOSTA E FEEDBACK
============================ */
function verificarResposta() {
  const jogadorAtual = jogadoresTabuleiro[jogadorAtualIndex];
  const ansInput = document.getElementById('respostaJogador');
  const ans = ansInput ? ansInput.value.trim() : '';

  if (!currentQuestion) return;

  document.getElementById('telaPergunta').style.display = 'none';
  const correct = (ans === currentQuestion.a) || (Number(ans) === Number(currentQuestion.a));

  if (correct) {
    jogadorAtual.posicaoAtual = currentQuestion.target;
    atualizarPosicao(jogadorAtual);
    mostrarFeedback(true, currentQuestion.q, currentQuestion.a, jogadorAtual.nome);
    if (jogadorAtual.posicaoAtual >= 35) {
      setTimeout(() => mostrarVitoria(jogadorAtual.nome), 700);
    }
  } else {
    mostrarFeedback(false, currentQuestion.q, currentQuestion.a, jogadorAtual.nome);
  }
}

function mostrarFeedback(ok, q, ansCorreta, nomeJogador) {
  const fb = document.getElementById('feedback');
  if (!fb) return;
  fb.style.display = 'flex';
  document.getElementById('feedbackTitulo').textContent =
    ok ? `✅ ${nomeJogador} acertou!` : `❌ ${nomeJogador} errou!`;
  document.getElementById('feedbackTexto').textContent =
    ok ? `Pergunta: ${q} = ${ansCorreta}` : `Pergunta: ${q}. A resposta correta era: ${ansCorreta}`;

  // continuar: fecha feedback, reabilita dado e passa a vez
  document.getElementById('btnContinuar').onclick = function () {
    continuarJogo();
    proximoJogador();
  };
}

function continuarJogo() {
  const fb = document.getElementById('feedback');
  if (fb) fb.style.display = 'none';

  const btnDado = document.getElementById('btnJogarDado');
  if (btnDado) btnDado.disabled = false;
}

/* =====================
   POSIÇÃO E VITÓRIA
===================== */
function atualizarPosicao(jogador) {
  const jogadorEl = document.getElementById(`jogador-${jogador.id}`);
  const tabuleiro = document.getElementById('tabuleiro');
  if (!jogadorEl || !tabuleiro) return;

  const casa = document.getElementById(`casa${jogador.posicaoAtual}`);
  if (!casa) return;

  const casaRect = casa.getBoundingClientRect();
  const boardRect = tabuleiro.getBoundingClientRect();

  // centro da casa
  const centerX = casaRect.left - boardRect.left + casaRect.width / 2;
  const centerY = casaRect.top  - boardRect.top  + casaRect.height / 2;

  // pega todos os jogadores que estão nessa mesma casa
  const mesmos = jogadoresTabuleiro.filter(j => j.posicaoAtual === jogador.posicaoAtual);
  const idx = mesmos.findIndex(j => j.id === jogador.id);
  const n = mesmos.length;

  // distância do centro para espalhar (ajuste conforme o tamanho do ícone)
  const spread = 15; // pixels – pode aumentar se quiser mais afastado

  let offsetX = 0;
  let offsetY = 0;

  if (n === 1) {
    // só um jogador nessa casa → fica bem no centro
    offsetX = 0;
    offsetY = 0;
  } else if (n === 2) {
    // dois jogadores → esquerda e direita
    offsetX = idx === 0 ? -spread : spread;
    offsetY = 0;
  } else if (n === 3) {
    // três jogadores → dois embaixo, um em cima
    if (idx === 0) { offsetX = -spread; offsetY = spread; }
    else if (idx === 1) { offsetX = spread; offsetY = spread; }
    else { offsetX = 0; offsetY = -spread; }
  } else {
    // quatro ou mais → desenha um quadradinho em volta do centro
    const posicoes = [
      [-spread, -spread],
      [ spread, -spread],
      [-spread,  spread],
      [ spread,  spread],
    ];
    const p = posicoes[idx] || [0, 0];
    offsetX = p[0];
    offsetY = p[1];
  }

  jogadorEl.style.position = 'absolute';
  jogadorEl.style.left = (centerX + offsetX - 30) + 'px';
  jogadorEl.style.top  = (centerY + offsetY - 30) + 'px';

}



function mostrarVitoria() {
  const tela = document.getElementById('telaFinal');
  if (tela) tela.style.display = 'flex';

  const infoJogador = document.querySelector('.info-jogador');
  if (infoJogador) infoJogador.style.display = 'none';

  const btnDado = document.getElementById('btnJogarDado');
  if (btnDado) btnDado.style.display = 'none';

  const resultadoDado = document.getElementById('resultadoDado');
  if (resultadoDado) resultadoDado.style.display = 'none';

  const telaPergunta = document.getElementById('telaPergunta');
  if (telaPergunta) telaPergunta.style.display = 'none';

  const feedback = document.getElementById('feedback');
  if (feedback) feedback.style.display = 'none';

  const tabuleiro = document.getElementById('tabuleiro');
  if (tabuleiro) {
    tabuleiro.style.pointerEvents = 'none';
    tabuleiro.style.opacity = '0.15';
  }

  // 🔥 PEGAR O JOGADOR VENCEDOR
  const vencedor = jogadoresTabuleiro[jogadorAtualIndex];

  // 🔥 COLOCAR NOME DO VENCEDOR NA TELA
  const texto = document.getElementById('textoVencedor');
  if (texto) texto.textContent = `${vencedor.nome} venceu!`;

  // 🔥 COLOCAR IMAGEM DO PERSONAGEM NA TELA FINAL
  const imgVencedor = document.getElementById('imgVencedor');

  switch (vencedor.personagem) {
    case 'Fada':
      imgVencedor.src = "images/Fada.png";
      break;
    case 'Cavaleiro':
      imgVencedor.src = "images/cavaleiro.png";
      break;
    case 'Princesa':
      imgVencedor.src = "images/princesa.png";
      break;
    case 'Mago':
      imgVencedor.src = "images/mago.png";
      break;
    default:
      imgVencedor.src = "images/cavaleiro.png";
  }

  // 🔥 iniciar confetes
  const container = document.getElementById('confetesContainer');
  if (!container) return;

  const cores = ['#ffeb3b', '#ff4081', '#7c4dff', '#4caf50', '#03a9f4'];

  for (let i = 0; i < 80; i++) {
    const confete = document.createElement('div');
    confete.classList.add('confete');

    confete.style.left = Math.random() * 100 + 'vw';
    confete.style.top = (Math.random() * -20) + 'vh';
    confete.style.backgroundColor = cores[Math.floor(Math.random() * cores.length)];
    confete.style.animationDuration = (2 + Math.random() * 3) + 's';
    confete.style.animationDelay = (Math.random() * 2) + 's';

    container.appendChild(confete);
  }
}




/* =====================
   AUTO na tela de seleção
===================== */
window.onload = function () {
  if (document.getElementById('numJogadores')) {
    gerarCamposDeNome();
  }
};

function desbloquearAudio() {
  audio.muted = false;
  audio.volume = (JSON.parse(localStorage.getItem("mm_prefs") || "{}").som ?? 70) / 100;

  audio.play().then(() => {
    console.log("🎵 Música iniciada com sucesso");
  }).catch(err => {
    console.warn("Falha ao iniciar música:", err);
  });

  // remove após o primeiro clique
  document.removeEventListener("click", desbloquearAudio);
}

document.addEventListener("click", desbloquearAudio, { once: true });


(function () {
  const audio = document.getElementById("bgm");
  if (!audio) return;

  audio.volume = 0.7;
  audio.muted = false;
  audio.preload = "auto";

  const startAudio = () => {
    audio.play()
      .then(() => console.log("🎵 Áudio iniciado"))
      .catch(err => console.error("❌ Falha ao tocar áudio:", err));

    document.removeEventListener("pointerdown", startAudio);
  };

  // pointerdown é mais confiável que click
  document.addEventListener("pointerdown", startAudio, { once: true });
})();
