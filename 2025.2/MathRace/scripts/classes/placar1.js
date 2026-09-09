// Botão voltar ao menu
document.getElementById('btnVoltar').addEventListener('click', function() {
    window.location.href = 'index.html'; // ou o nome do seu arquivo de menu principal
});

// Você pode adicionar mais funcionalidades aqui, como:

// Função para atualizar o placar dinamicamente
function atualizarPlacar(dados) {
    // dados seria um array com objetos: [{nome: "VELOCISTA", pontos: 2850, tempo: "1:25.43"}, ...]
    // Aqui você implementaria a lógica para atualizar o HTML
}

// Função para buscar dados do placar (exemplo)
function carregarPlacar() {
    // Aqui você poderia buscar dados de um servidor ou localStorage
    // fetch('api/placar')
    //     .then(response => response.json())
    //     .then(data => atualizarPlacar(data));
}

// Carregar placar quando a página carregar
// carregarPlacar();
