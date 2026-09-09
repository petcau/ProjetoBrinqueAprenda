import * as config from "../config.js"

import {Veiculo} from "./veiculo.js"

class Bot {
	#tempo_ultima_resposta = new Date().getTime()
	#tempo_para_responder

	constructor({veiculo, multiplicador_vel, chance_de_acerto, tempo_de_resposta, variacao_tempo})
	{
		this.veiculo = veiculo
		this.multiplicador_vel = multiplicador_vel
		this.chance_de_acerto = chance_de_acerto
		this.tempo_de_resposta = tempo_de_resposta
		this.variacao_tempo = variacao_tempo

		this.#calcular_novo_tempo_resposta()
	}

	// Calcula uma variação de tempo e um novo tempo de resposta a partir disso
	#calcular_novo_tempo_resposta()
	{
		var variacao = Math.random() * (this.variacao_tempo * 2) - this.variacao_tempo
		var novo_tempo = this.tempo_de_resposta + variacao

		this.#tempo_para_responder = novo_tempo
	}

	// Simula uma resposta para uma pergunta
	#simular_pergunta()
	{
		var tempo_agora = new Date().getTime()

		if ((tempo_agora - this.#tempo_ultima_resposta)/1000 >= this.#tempo_para_responder){
			this.#calcular_novo_tempo_resposta()

			if (Math.random() < this.chance_de_acerto){
				// Acertou
				this.velocidade += config.VELOCIDADE_GANHA_POR_ACERTO * this.multiplicador_vel
			} else {
				// Errou
				this.velocidade -= config.VELOCIDADE_PERDIDA_POR_ERRO * this.multiplicador_vel
			}

			this.#tempo_ultima_resposta = tempo_agora
		}
	}

	// Getters
	get posicao()
	{
		return this.veiculo.posicao
	}
	get velocidade()
	{
		return this.veiculo.velocidade
	}

	// Setters
	set posicao(nova_posicao)
	{
		this.veiculo.posicao = nova_posicao
	}
	set velocidade(nova_velocidade)
	{
		this.veiculo.velocidade = nova_velocidade
	}

	// Desenha a imagem do veículo
	desenhar()
	{
		this.veiculo.desenhar()
	}

	// Atualiza o veículo
	atualizar()
	{
		this.#simular_pergunta()
		this.veiculo.atualizar()
	}

}

export {Bot}
