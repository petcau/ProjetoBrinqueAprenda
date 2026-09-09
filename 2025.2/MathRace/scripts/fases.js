import * as saves from "./storage.js"

const fases = {
	"corredor": document.querySelector(".fase1"),
	"carro": document.querySelector(".fase2"),
	"bicicleta": document.querySelector(".fase3"),
	"aviao": document.querySelector(".fase4"),
	"barco": document.querySelector(".fase5"),
}

saves.carregar_saves()

Object.keys(saves.mapas_desbloqueados).forEach(key => {
	const val = saves.mapas_desbloqueados[key]

	if (val == true){
		// Desbloqueado
		fases[key].classList.remove("grayscale")
		fases[key].classList.remove("disabled")
	}
})
