// === Função para voltar à tela inicial ===
function voltarTelaInicial() {
  window.location.href = "tela-inicial.html";
}

// === Função para voltar à tela de modos ===
function voltarTelaModos() {
  window.location.href = "tela-modos.html";
}

// === Variável de pontuação ===
let pontos = 0;

// === Função que calcula a pontuação final (5 pontos por acerto) ===
function calcularPontuacao() {
  // Primeiro tenta buscar a pontuação salva no localStorage
  const pontuacaoSalva = localStorage.getItem("pontuacao-facil");

  let acertos = 0;

  if (pontuacaoSalva !== null) {
    acertos = parseInt(pontuacaoSalva);
  } else if (typeof window.score !== "undefined") {
    // fallback se a variável global ainda existir (mesma aba)
    acertos = window.score;
  } else {
    console.warn("⚠️ Nenhuma pontuação encontrada. Definindo como 0.");
  }

  // Calcula a pontuação total (5 pontos por acerto)
  pontos = acertos * 5;

  // Atualiza os elementos da tela, se existirem
  const pontuacaoElemento = document.getElementById("pontuacao-facil");
  if (pontuacaoElemento) {
    pontuacaoElemento.textContent = pontos;
  }

  const acertosElemento = document.getElementById("acertos");
  if (acertosElemento) {
    acertosElemento.textContent = acertos;
  }
}

// === Executa quando a página terminar de carregar ===
window.addEventListener("DOMContentLoaded", () => {
  // Só calcula a pontuação quando clicar no botão "Pontuação"
  const botaoPontuacao = document.getElementById("botao-pontuacao");
  if (botaoPontuacao) {
    botaoPontuacao.addEventListener("click", calcularPontuacao);
  }

  // === Adiciona eventos aos botões de navegação ===
  const botaoVoltarModos = document.getElementById("botao-voltarmodos");
  if (botaoVoltarModos) {
    botaoVoltarModos.addEventListener("click", voltarTelaModos);
  }

  const botaoVoltarInicial = document.getElementById("botao-voltarinicial");
  if (botaoVoltarInicial) {
    botaoVoltarInicial.addEventListener("click", voltarTelaInicial);
  }

  // Também calcula automaticamente ao carregar a tela
  calcularPontuacao();
});
