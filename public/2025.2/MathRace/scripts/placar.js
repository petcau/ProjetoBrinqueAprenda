import * as saves from "./storage.js"

const div_placar = document.getElementById("placar")

saves.carregar_saves()

saves.placar.forEach((entrada, index) => {
	const nome = document.getElementById("nome-" + (index + 1))
	const pontuacao = document.getElementById("pontuacao-" + (index + 1))
	const cenario = document.getElementById("cenario-" + (index + 1))

	nome.innerText = entrada.nome
	pontuacao.innerText = "- " + entrada.pontuacao.toString() + " -"
	cenario.innerText = (entrada.cenario.charAt(0).toUpperCase() + entrada.cenario.slice(1))
})
