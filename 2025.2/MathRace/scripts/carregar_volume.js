import * as saves from "./storage.js"

const musica = document.getElementById("musica")

saves.carregar_opcoes()

musica.volume = saves.volume / 100
