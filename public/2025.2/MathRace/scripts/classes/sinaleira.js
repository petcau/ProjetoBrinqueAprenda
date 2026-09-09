import * as config from "../config.js"
import * as canvas from "../canvas.js"

const QUANTIDADE_LEDS = 3
const OFFSET = 80

import {Sprite} from "./sprite.js"

class Sinaleira {
	constructor({posicao, imagem_off, imagem_on})
	{
		this.leds_off = []
		this.leds_on = []

		for (let i = 0; i < QUANTIDADE_LEDS; i++){
			this.leds_off[i] = new Sprite({
				posicao: {
					x: posicao.x + OFFSET * (i - 1),
					y: posicao.y,
				},
				imagem: imagem_off,
			})
			this.leds_on[i] = new Sprite({
				posicao: {
					x: posicao.x + OFFSET * (i - 1),
					y: posicao.y,
				},
				imagem: imagem_on,
			})
		}

		this.lampadas_acesas = 0
	}

	// Setter
	set posicao(nova_posicao)
	{
		for (let i = 0; i < QUANTIDADE_LEDS; i++){
			this.leds_off[i].posicao.x = nova_posicao.x + OFFSET * (i - 1)
			this.leds_off[i].posicao.y = nova_posicao.y

			this.leds_on[i].posicao.x = nova_posicao.x + OFFSET * (i - 1)
			this.leds_on[i].posicao.y = nova_posicao.y
		}
	}

	// Acende o próximo led da sinaleira
	#prox_estado()
	{
		this.lampadas_acesas += 1

		if (this.lampadas_acesas >= QUANTIDADE_LEDS){
			document.dispatchEvent(new Event("SinaleiraTerminado"))
		} else {
			document.dispatchEvent(new Event("SinaleiraClick"))
		}
	}

	iniciar_contagem()
	{
		this.tempo_de_contagem = new Date().getTime()
	}

	// Desenha a imagem correta
	desenhar()
	{
		for (let i = 0; i < this.lampadas_acesas; i++){
			this.leds_on[i].desenhar()
		}
		for (let i = this.lampadas_acesas; i < QUANTIDADE_LEDS; i++){
			this.leds_off[i].desenhar()
		}
	}

	// Atualiza a sinaleira e desenha os leds corretamente
	atualizar()
	{
		var tempo_agora = new Date().getTime()

		if (((tempo_agora - this.tempo_de_contagem)/1000 >= config.SINALEIRA_TEMPO_MUDAR_COR) &&
			(this.lampadas_acesas != QUANTIDADE_LEDS)) {
			this.#prox_estado()
			this.tempo_de_contagem = tempo_agora
		}

		this.desenhar()
	}
}

export {Sinaleira}
