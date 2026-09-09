// === Carregar música global ===
if (!window.globalMusic) {
    window.globalMusic = new Audio("../musica/musica_de_fundo.mp3");
    window.globalMusic.loop = true;

    const musicaAtiva = localStorage.getItem("musicaAtiva") !== "false";

    if (musicaAtiva) {
        window.globalMusic.volume = 0.5;
        window.globalMusic.play().catch(() => {});
    }
}
