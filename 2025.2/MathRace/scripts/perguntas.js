import * as config from "./config.js"
import {jogo_pausado} from "./main.js"

const pergunta = document.getElementById("pergunta")

const timer = document.getElementById("timer")
var tempo_restante = 0

const resposta1 = document.getElementById("resposta-1")
const resposta2 = document.getElementById("resposta-2")
const resposta3 = document.getElementById("resposta-3")
const resposta4 = document.getElementById("resposta-4")

var botao_correto

var dados_json

// Clique nos botões de resposta
function botao_clicado(evt)
{
	if (jogo_pausado == true){
		return
	}

	setar_botoes_disabled(true)

	const botao = evt.currentTarget
	if (botao.isSameNode(botao_correto)){
		// Botao correto clicado
		botao.classList.toggle("correto")

		botao.addEventListener("transitionend", () => {
			botao.classList.remove("correto")
			const correto_event = new CustomEvent("RespostaCorreta", {detail: {segundos_restantes: tempo_restante}})
			document.dispatchEvent(correto_event)
		}, {once: true})
	} else {
		// Botao incorreto clicado
		botao.classList.toggle("incorreto")

		botao.addEventListener("transitionend", () => {
			botao.classList.remove("incorreto")
			document.dispatchEvent(new Event("RespostaErrada"))
		}, {once: true})
	}
}

resposta1.addEventListener("click", botao_clicado)
resposta2.addEventListener("click", botao_clicado)
resposta3.addEventListener("click", botao_clicado)
resposta4.addEventListener("click", botao_clicado)
////////////////////////////////

// Atualiza o timer da pergunta para o player
function rodar_timer(delta_time)
{
	tempo_restante = tempo_restante - (delta_time / 1000)

	if (tempo_restante <= 0){
		// Acabou o tempo
		gerar_pergunta()
		// Tratar como resposta errada
		document.dispatchEvent(new Event("RespostaErrada"))
	} else {
		// Ainda não acabou o tempo
		timer.textContent = Math.ceil(tempo_restante).toString()
	}
}

// Carrega as perguntas a partir do cenario
function carregar_perguntas(cenario)
{
	let caminho_json

	switch(cenario){
		case "corredor":
			caminho_json="json/fase1.json"
			break
		case "bicicleta":
			caminho_json="json/fase2.json"
			break
		case "carro":
			caminho_json="json/fase3.json"
			break
		case "aviao":
			caminho_json="json/fase4.json"
			break
		case "barco":
			caminho_json="json/fase5.json"
			break;
	}

	fetch(caminho_json)
		.then(response => {
			return response.json()
		})
		.then(dados => {
			dados_json = dados
		})
}

// Gera uma nova pergunta para o player
function gerar_pergunta()
{
	tempo_restante = config.TEMPO_DE_RESPOSTA

	let index_pergunta_random = Math.floor(Math.random() * dados_json.perguntas.length)
	let pergunta_random = dados_json.perguntas[index_pergunta_random]

	pergunta.textContent = pergunta_random.pergunta

	// Qual botão será o correto (1-4)
	let num_botao_resposta = Math.floor(Math.random() * 4) + 1

	let respostas_incorretas = pergunta_random.respostas.slice()
	respostas_incorretas.splice(respostas_incorretas.indexOf(pergunta_random.resposta_correta), 1)

	// Preencher textos dos botões
	for (var i = 1; i <= 4; i++){
		let esse_botao = document.getElementById("resposta-" + i.toString());

		if (i != num_botao_resposta){
			let index = Math.floor(Math.random() * respostas_incorretas.length)
			let resposta = respostas_incorretas[index]
			respostas_incorretas.splice(index, 1)

			esse_botao.textContent = String(resposta)
		} else {
			botao_correto = esse_botao
			esse_botao.textContent = String(pergunta_random.resposta_correta)
		}
	}

	setar_botoes_disabled(false)
	return
}

function setar_botoes_disabled(bool)
{
	resposta1.disabled = bool
	resposta2.disabled = bool
	resposta3.disabled = bool
	resposta4.disabled = bool
}

document.addEventListener("keydown", (evt) => {
	if (evt.key == "a"){
		resposta1.click()
	} else if (evt.key == "s"){
		resposta2.click()
	} else if (evt.key == "d"){
		resposta3.click()
	} else if (evt.key == "f"){
		resposta4.click()
	}
})

export {carregar_perguntas, gerar_pergunta, rodar_timer}
