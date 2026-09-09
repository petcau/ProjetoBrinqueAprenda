import * as config from "./config.js"

import {Sprite} from "./classes/sprite.js"
import {SpriteRepetido} from "./classes/sprite-repetido.js"
import {Veiculo} from "./classes/veiculo.js"
import {Bot} from "./classes/bot.js"

let img_pista
let img_veiculo
let img_veiculo_2

let cenario

function carregar_cenario(tipo_cenario)
{
	cenario = tipo_cenario

	switch(tipo_cenario){
		case "carro":
			img_pista = "assets/pistas/pista_asfalto.png"
			img_veiculo = "assets/personagens/carro.png"
			break
		case "barco":
			img_pista = "assets/pistas/pista_agua.png"
			img_veiculo = "assets/personagens/barco.png"
			break
		case "aviao":
			img_pista = "assets/pistas/pista_asfalto.png"
			img_veiculo = "assets/personagens/aviao.png"
			break
		case "bicicleta":
			img_pista = "assets/pistas/pista_terra.png"
			img_veiculo = "assets/personagens/ciclista.png"
			break
		case "corredor":
			img_pista = "assets/pistas/pista_terra.png"
			img_veiculo = "assets/personagens/corredor.png"
			img_veiculo_2 = "assets/personagens/corredor2.png"
			break

		default:
			alert("Cenário inválido " + tipo_cenario)
	}
}

function criar_pistas(pista_array)
{
	for (var i = 0; i < 4; i++){
		const pista = new SpriteRepetido({
			posicao: {
				x: 0,
				y: config.PISTA_OFFSET + i * config.PISTA_ALTURA,
			},
			imagem: img_pista,
		})

		pista_array.push(pista)
	}
}

function criar_veiculos(veiculo_array)
{
	for (var i = 0; i < 4; i++){
		let veiculo

		if (cenario == "corredor"){
			veiculo = new Veiculo({
				posicao: {
					x: 60,
					y: config.PISTA_OFFSET + config.VEICULO_OFFSET + i * config.VEICULO_ESPACAMENTO,
				},
				imagem: img_veiculo,
				imagem_secundaria: img_veiculo_2,
				possui_secundaria: true,
			})
		} else {
			veiculo = new Veiculo({
				posicao: {
					x: 60,
					y: config.PISTA_OFFSET + config.VEICULO_OFFSET + i * config.VEICULO_ESPACAMENTO,
				},
				imagem: img_veiculo,
			})
		}

		// Se não for o player (player é o último)
		if (i != 3){
			veiculo.cor_random()
		}

		veiculo_array.push(veiculo)
	}
}

function criar_bots(bot_array, veiculo_array)
{
	for (var i = 0; i < 3; i++){
		const bot = new Bot({
			veiculo: veiculo_array[i],
			multiplicador_vel: 0.65,
			chance_de_acerto: 0.65,
			tempo_de_resposta: 4,
			variacao_tempo: 0.5,
		})
		bot_array.push(bot)
	}
}

export {carregar_cenario, criar_pistas, criar_veiculos, criar_bots}
