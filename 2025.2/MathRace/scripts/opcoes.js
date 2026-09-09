import * as saves from "./storage.js"

const musica = document.getElementById("musica")

const volume_slider = document.getElementById("volume")
const volume_texto = document.getElementById("volume-texto")

saves.carregar_opcoes()

function atualizar_volume()
{
	volume_texto.textContent = "Volume da Música (" + volume_slider.value + "%)"
	musica.volume = volume_slider.value / 100
	saves.salvar_opcoes(volume_slider.value)
}

volume_slider.addEventListener("input", () => {
	atualizar_volume()
})

volume_slider.value = saves.volume
atualizar_volume()
