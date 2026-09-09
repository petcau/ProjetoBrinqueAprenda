// === APLICAR BRILHO GLOBAL ===
document.addEventListener("DOMContentLoaded", () => {
    const brilhoSalvo = localStorage.getItem("brilhoTela");

    if (brilhoSalvo !== null) {
        document.body.style.filter = `brightness(${brilhoSalvo})`;
    }
});
