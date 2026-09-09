import {Sprite} from "./sprite.js"

class Veiculo {
	#tempo_trocar_imagem = new Date().getTime()

	constructor({posicao, imagem, imagem_secundaria, possui_secundaria=false})
	{
		this.sprite = new Sprite({
			posicao: posicao,
			imagem: imagem,
			imagem_secundaria: imagem_secundaria,
		})

		this.possui_secundaria = possui_secundaria

		this._posicao = posicao
		this._velocidade = 0
	}

	// Getters
	get posicao()
	{
		return this._posicao
	}
	get velocidade()
	{
		return this._velocidade
	}

	// Setters
	set posicao(nova_posicao)
	{
		this.posicao.x = nova_posicao.x
		this.posicao.y = nova_posicao.y

		this.sprite.posicao.x = nova_posicao.x
		this.sprite.posicao.y = nova_posicao.y
	}
	set velocidade(nova_velocidade)
	{
		this._velocidade = Math.max(nova_velocidade, 0)
	}

	// Gera uma cor random
	cor_random()
	{
		this.sprite.cor_random()
	}

	// Desenha a imagem
	desenhar()
	{
		this.sprite.desenhar()
	}

	// Atualiza a posição de acordo com a velocidade e desenha a imagem
	atualizar()
	{
		if (this.possui_secundaria == true && this.velocidade > 0){
			var tempo_agora = new Date().getTime()
			if ((tempo_agora - this.#tempo_trocar_imagem)/1000 >= 1/this.velocidade){
				this.#tempo_trocar_imagem = tempo_agora
				this.sprite.desenhar_secundaria = !this.sprite.desenhar_secundaria
			}
		}

		this.posicao = {
			x: this.posicao.x + this.velocidade,
			y: this.posicao.y,
		}

		this.desenhar()
	}
}

export {Veiculo}
