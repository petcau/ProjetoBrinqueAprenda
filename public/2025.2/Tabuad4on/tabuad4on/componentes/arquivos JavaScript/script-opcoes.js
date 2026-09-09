// CONTROLE DO SOM (MÚSICA GLOBAL) 
document.addEventListener("DOMContentLoaded", () => {
    const botaoSom = document.getElementById("botaoSom");
    if (!botaoSom) return;

    // Atualiza visual inicial
    const musicaAtiva = localStorage.getItem("musicaAtiva") === "true";
    botaoSom.textContent = musicaAtiva ? "🔊" : "🔇";

    botaoSom.addEventListener("click", () => {
        const music = window.globalMusic;
        if (!music) return;

        if (music.paused) {
            music.play();
            localStorage.setItem("musicaAtiva", "true");
            botaoSom.textContent = "🔊";
        } else {
            music.pause();
            localStorage.setItem("musicaAtiva", "false");
            botaoSom.textContent = "🔇";
        }
    });
});

// CONTROLE DE BRILHO
const controleBrilho = document.getElementById("controleBrilho");

controleBrilho.addEventListener("input", () => {
    const brilho = controleBrilho.value;
    document.body.style.filter = `brightness(${brilho})`;
    localStorage.setItem("brilhoTela", brilho);
});

// Carrega configurações salvas
window.addEventListener("load", () => {
    const brilhoSalvo = localStorage.getItem("brilhoTela");
    const botaoSom = document.getElementById("botaoSom");

    if (brilhoSalvo !== null) {
        controleBrilho.value = brilhoSalvo;
        document.body.style.filter = `brightness(${brilhoSalvo})`;
    }

    // Atualiza o botão de som se existir
    if (botaoSom) {
        const musicaAtiva = localStorage.getItem("musicaAtiva") === "true";
        botaoSom.textContent = musicaAtiva ? "🔊" : "🔇";
    }
});

//  VOLTAR 
document.getElementById("botaoVoltar").addEventListener("click", () => {
    window.location.href = "tela-inicial.html";
});





