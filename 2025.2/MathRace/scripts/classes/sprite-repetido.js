import * as canvas from "../canvas.js"
import * as config from "../config.js"

class SpriteRepetido {
	constructor({posicao, imagem})
	{
		this.posicao = posicao
		this.imagem = new Image()
		this.imagem.src = imagem
	}

	// Desenha o sprite até o fim da pista (fim da tela)
	desenhar()
	{
		var numero_imagens = Math.ceil(config.TAMANHO_DA_PISTA / this.imagem.width) + 1

		for (var i = 0; i < numero_imagens; i++){
			canvas.ctx.drawImage(this.imagem, (i * this.imagem.width) + (this.posicao.x), this.posicao.y)
		}
	}
}

export {SpriteRepetido}
