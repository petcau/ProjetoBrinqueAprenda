import * as config from "./config.js"

var mapas_desbloqueados = {
	"corredor": true,
	"bicicleta": false,
	"carro": false,
	"barco": false,
	"aviao": false,
}

// Formato:
// placar = [
//  {nome: "PLAYER", pontuacao: PONTUACAO, cenario: "CENARIO"},
// ]
var placar = []

var nome = "Player"

// 0 - 100
var volume

// Carrega os mapas desbloqueados
function carregar_mapas_desbloqueados()
{
	const string_mapas_salvos = localStorage.getItem("MapasDesbloqueados")
	if (string_mapas_salvos != null){
		mapas_desbloqueados = JSON.parse(string_mapas_salvos)
	}
}

// Carrega os placares salvos
function carregar_placar()
{
	const string_placar_salvo = localStorage.getItem("Placar")
	if (string_placar_salvo != null){
		placar = JSON.parse(string_placar_salvo)
		console.log(placar)
	}
}

// Carrega o nome do player
function carregar_nome()
{
	const nome_salvo = localStorage.getItem("Nome")
	if (nome_salvo != null){
		nome = nome_salvo
	}
}

function carregar_saves()
{
	carregar_mapas_desbloqueados()
	carregar_placar()
	carregar_nome()
}

function carregar_opcoes()
{
	const volume_salvo = localStorage.getItem("Volume")
	if (volume_salvo != null){
		volume = JSON.parse(volume_salvo)
	} else {
		volume = 50
	}
}

// Salva os mapas desbloqueados
function salvar_mapas_desbloqueados()
{
	const str = JSON.stringify(mapas_desbloqueados)
	localStorage.setItem("MapasDesbloqueados", str)
}

// Salva o placar
function salvar_placar()
{
	const str = JSON.stringify(placar)
	localStorage.setItem("Placar", str)
}

// Salva o nome do player
function salvar_nome()
{
	localStorage.setItem("Nome", nome)
}

// Salva as opções
function salvar_opcoes(volume)
{
	localStorage.setItem("Volume", volume)
}

// Tenta adicionar ao placar, assume que o placar já foi carregado
function adicionar_ao_placar(pontuacao, nome_cenario)
{
	// Player possui mais entradas do que o permitido, remover os excedentes
	if (placar.length > config.HISTORIA_MAX_PLACAR){
		const excedentes = placar.length - config.HISTORIA_MAX_PLACAR
		placar.splice(-excedentes, excedentes)
	}

	// Placar está lotado?
	if (placar.length == config.HISTORIA_MAX_PLACAR){
		// Placar está ordenado pela pontuação. Se a pontuação atual for maior do que a ultima posição do placar, é possível remover ela
		if (pontuacao > placar[placar.length - 1].pontuacao){
			placar.pop()
			placar.push({nome: nome, pontuacao: pontuacao, cenario: nome_cenario})
		}
	} else {
		placar.push({nome: nome, pontuacao: pontuacao, cenario: nome_cenario})
	}

	// Ordenar por pontuação e salvar
	placar.sort((a, b) => b.pontuacao - a.pontuacao)
	salvar_placar()
}

function desbloquear_mapa(nome_cenario)
{
	if (Object.hasOwn(mapas_desbloqueados, nome_cenario)){
		mapas_desbloqueados[nome_cenario] = true
	}
	salvar_mapas_desbloqueados()
}

export {salvar_opcoes}
export {carregar_saves, carregar_opcoes}
export {adicionar_ao_placar, desbloquear_mapa}
export {mapas_desbloqueados, placar, nome, volume}
