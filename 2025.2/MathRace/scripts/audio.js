const SONS = Object.freeze({
	ACERTO: "assets/som/acerto.wav",
	ERRO: "assets/som/erro.wav",
	SEMAFORO_CLICK: "assets/som/semaforo_click.wav",
	SEMAFORO_GO: "assets/som/semaforo_go.wav",
	MUSICA: "assets/som/musica.mp3",
})

function tocar(som, loop = false, volume=100)
{
	let audio = new Audio(som)
	audio.loop = loop
	audio.volume = volume / 100
	audio.play();
}

export {SONS, tocar}
