import * as config from "./config.js"

const canvas = document.getElementById("canvas-jogo")
const ctx = canvas.getContext("2d")

var width = window.innerWidth
var height = 300

canvas.width = width
canvas.height = height

var pos_x = 0;

// Atualizar tamanho no redimensionamento da tela
window.addEventListener("resize", function(){
	width = window.innerWidth
	canvas.width = width
	ctx.translate(-pos_x, 0)
})

// Limpa o canvas inteiro
function limpar_canvas()
{
	ctx.fillStyle = "#eeeeee"
	ctx.fillRect(0, 0, canvas.width, canvas.height)
}

// Centraliza a posicao X do canvas em x
function centralizar_em(x)
{
	var x_tela = x - pos_x
	var dist_centro = (x_tela) - (canvas.width/2)

	if (dist_centro > 0){
		ctx.translate(-dist_centro, 0)
		pos_x += dist_centro
	}
}

// Desenha uma string
function desenhar_texto(texto, tamanho, x, y)
{
	ctx.textAlign = "center"
	ctx.font = tamanho + "px serif"
	ctx.fillText(texto, pos_x + x, y)
}

// Desenha retângulo
function desenhar_rect(rgba, x, y, width, height)
{
	var original_fillstyle = ctx.fillStyle

	ctx.fillStyle = "rgba(" + rgba.r + ", " + rgba.g + ", " + rgba.b + ", " + rgba.a + ")"
	ctx.fillRect(pos_x + x, y, width, height)

	ctx.fillStyle = original_fillstyle
}

export {canvas, ctx, limpar_canvas, centralizar_em, desenhar_texto, width, height, pos_x, desenhar_rect}
