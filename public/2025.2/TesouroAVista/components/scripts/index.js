document.addEventListener('DOMContentLoaded', () => {
    // --- MÚSICA E SONS ---
    const musicaFundo = document.getElementById('musica_fundo');
    const somClique = document.getElementById('som_clique');
    const somPergunta = document.getElementById('som_pergunta');
    const somVitoria = document.getElementById('som_vitoria');
    const somDerrota = document.getElementById('som_derrota');
    const somMoeda = document.getElementById('som_moeda');
    const somVida = document.getElementById('som_vida');

    window.mapaAtual = "";

    const som = [
        "game_assets/opcoes/som.webp",
        "game_assets/opcoes/som_desligado.webp"
    ]
    const musica = [
        "game_assets/opcoes/musica.webp",
        "game_assets/opcoes/musica_desligada.webp"
    ]

    let somAtivo = true;

    window.mostrarAba = function (aba) {
        let creditos = document.getElementById(aba);
        creditos.classList.remove("esconder");
    }

    window.fecharAba = function (aba) {
        let creditos = document.getElementById(aba);
        creditos.classList.add("esconder");
    }

    // Iniciar a música
    function tocarMusica() {
        if (musicaFundo && musicaFundo.paused) {
            musicaFundo.muted = false;
            musicaFundo.play().catch(error => {
                console.log("A reprodução automática ainda está bloqueada.");
            });
            document.removeEventListener('click', tocarMusica);
        }
    }

    document.addEventListener('click', tocarMusica, { once: true });

    window.manipularMusica = function (elemento) {
        const imgElement = elemento.querySelector('img');
        if (musicaFundo && !musicaFundo.paused) {
            imgElement.src = musica[1];
            musicaFundo.pause();
        }
        else {
            musicaFundo.play();
            imgElement.src = musica[0];
        }
    }

    // Manipulação do som e opções de sons

    window.tocarSomClique = function () {
        if (somAtivo && somClique) {
            try {
                somClique.currentTime = 0;
                somClique.play().catch(e => {
                    console.log("Falha ao reproduzir somClique:", e);
                });
            } catch (e) {
                console.log("Erro ao tentar tocar somClique:", e);
            }
        }
    }

    function tocarSomPergunta() {
        if (somAtivo && somPergunta) {
            try {
                somPergunta.currentTime = 0;
                somPergunta.play().catch(e => {
                    console.log("Falha ao reproduzir somPergunta:", e);
                });
            } catch (e) {
                console.log("Erro ao tentar tocar somPergunta:", e);
            }
        }
    }

    function tocarSomVitoria() {
        if (somAtivo && somVitoria) {
            try {
                somVitoria.currentTime = 0;
                somVitoria.play().catch(e => {
                    console.log("Falha ao reproduzir SomVitoria:", e);
                });
            } catch (e) {
                console.log("Erro ao tentar tocar SomVitoria:", e);
            }
        }
    }

    window.tocarSomDerrota = function () {
        if (somAtivo && somDerrota) {
            try {
                somDerrota.currentTime = 0;
                somDerrota.play().catch(e => {
                    console.log("Falha ao reproduzir somDerrota:", e);
                });
            } catch (e) {
                console.log("Erro ao tentar tocar somDerrota:", e);
            }
        }
    }

    function tocarSomMoeda() {
        if (somAtivo && somMoeda) {
            try {
                somMoeda.currentTime = 0;
                somMoeda.play().catch(e => {
                    console.log("Falha ao reproduzir somMoeda:", e);
                });
            } catch (e) {
                console.log("Erro ao tentar tocar somMoeda:", e);
            }
        }
    }

    function tocarSomVida() {
        if (somAtivo && somVida) {
            try {
                somVida.currentTime = 0;
                somVida.play().catch(e => {
                    console.log("Falha ao reproduzir somVida:", e);
                });
            } catch (e) {
                console.log("Erro ao tentar tocar somVida:", e);
            }
        }
    }

    function alterarSom() {
        somAtivo = !somAtivo;
        if (somAtivo) {
            tocarSomClique();
        }
        return somAtivo;
    }

    window.manipularSomClique = function (elemento) {
        const imgElement = elemento.querySelector('img');
        alterarSom();

        if (somAtivo) {
            imgElement.src = som[0];
        } else {
            imgElement.src = som[1];
        }
    }

    // --- CONFIGURAÇÕES DE MAPAS ---

    const CONFIG_MAPAS = {
        'ilha': {
            imagemFundo: 'game_assets/tabuleiro/ilha/mapa.webp',
            posicoesCasas: {
                '1': { top: '71%', left: '25%' },
                '2': { top: '74%', left: '35%' },
                '3': { top: '68%', left: '45%' },
                '4': { top: '48%', left: '46%' },
                '5': { top: '47%', left: '30%' },
                '6': { top: '23%', left: '29%' },
                '7': { top: '22%', left: '40%' },
                '8': { top: '28%', left: '51%' },
                '9': { top: '26%', left: '71%' },
                '10': { top: '44%', left: '74%' },
                '11': { top: '76%', left: '67%' },
                '12': { top: '64%', left: '74%' },
            },
            waypoints: {
                '3-4': [{ top: '60%', left: '44%' },],
                '6-7': [{ top: '23%', left: '35%' },],
                '7-8': [{ top: '22%', left: '49%' },],
                '8-9': [{ top: '31%', left: '62%' },],
                '9-10': [{ top: '26%', left: '78%' },],
                '10-11': [{ top: '71%', left: '62%' },],
                '11-12': [{ top: '71%', left: '73%' },],
            },
            monstros: [
                "ilha/tartaruga.webp",
                "ilha/carangueijo.webp",
                "ilha/papagaio.webp",
                "ilha/macaco.webp",
                "ilha/tiki.webp",
                "ilha/sereia.webp",
                "ilha/pirata zumbi.webp",
                "ilha/serpente marinha.webp",
                "ilha/titã.webp",
                "ilha/fantasma pirata.webp"
            ],
            pergunta: 'game_assets/quiz/ilha/pergunta.webp',
            fundoPergunta: 'game_assets/quiz/ilha/fundoperguntas.webp',
            opcoes: 'ilha/opcoes.webp',
            personagem: 'game_assets/tabuleiro/ilha/iconepirata.webp',
            imagemBau: 'game_assets/tabuleiro/ilha/bau.webp',
            chavePerguntas: 'ilha'
        },
        'caverna': {
            imagemFundo: 'game_assets/tabuleiro/caverna/caverna.webp',
            posicoesCasas: {
                '1': { top: '75%', left: '28%' },
                '2': { top: '88%', left: '23%' },
                '3': { top: '60%', left: '35%' },
                '4': { top: '43%', left: '28%' },
                '5': { top: '27%', left: '22%' },
                '6': { top: '27%', left: '40%' },
                '7': { top: '47%', left: '55%' },
                '8': { top: '28%', left: '70%' },
                '9': { top: '43%', left: '73%' },
                '10': { top: '72%', left: '74%' },
                '11': { top: '81%', left: '62%' },
                '12': { top: '74%', left: '45%' },
            },
            waypoints: {
                '1-2': [{ top: '85%', left: '30%' },],
                '2-3': [{ top: '83%', left: '20%' },],
                '3-4': [{ top: '50%', left: '37%' },],
                '4-5': [{ top: '35%', left: '18%' },],
                '5-6': [{ top: '18%', left: '29%' },],
                '8-9': [{ top: '13%', left: '80%' },],
                '9-10': [{ top: '54%', left: '68%' },],
                '10-11': [{ top: '90%', left: '78%' },],
                '11-12': [{ top: '73%', left: '55%' },],
            },
            monstros: [
                "caverna/barata.webp",
                "caverna/centopeia.webp",
                "caverna/aranha.webp",
                "caverna/morcego.webp",
                "caverna/goblin.webp",
                "caverna/dragaobebe.webp",
                "caverna/goblinpai.webp",
                "caverna/fantasma.webp",
                "caverna/alien.webp",
                "caverna/dragao.webp"
            ],
            pergunta: 'game_assets/quiz/caverna/pergunta.webp',
            fundoPergunta: 'game_assets/quiz/caverna/fundoperguntas.webp',
            opcoes: 'caverna/opcoes.webp',
            personagem: 'game_assets/tabuleiro/caverna/iconeexplorador.webp',
            imagemBau: 'game_assets/tabuleiro/caverna/bau.webp',
            chavePerguntas: 'caverna'
        },
        'deserto': {
            imagemFundo: 'game_assets/tabuleiro/deserto/deserto.webp',
            posicoesCasas: {
                '1': { top: '89%', left: '46%' },
                '2': { top: '90%', left: '23%' },
                '3': { top: '74%', left: '30%' },
                '4': { top: '67%', left: '42%' },
                '5': { top: '57%', left: '32%' },
                '6': { top: '50%', left: '20%' },
                '7': { top: '30%', left: '23%' },
                '8': { top: '22%', left: '31%' },
                '9': { top: '16%', left: '40%' },
                '10': { top: '24%', left: '52%' },
                '11': { top: '29%', left: '62%' },
                '12': { top: '13%', left: '79%' },
            },
            waypoints: {
                '2-3': [{ top: '80%', left: '22%' },],
                '6-7': [{ top: '40%', left: '18%' },],
            },
            monstros: [
                "deserto/besouro.webp",
                "deserto/gato.webp",
                "deserto/dromedario.webp",
                "deserto/cobra.webp",
                "deserto/mumia.webp",
                "deserto/esfinge.webp",
                "deserto/leao.webp",
                "deserto/passaro.webp",
                "deserto/leaodepe.webp",
                "deserto/anubis.webp"
            ],
            pergunta: 'game_assets/quiz/deserto/pergunta.webp',
            fundoPergunta: 'game_assets/quiz/deserto/fundoperguntas.webp',
            opcoes: 'deserto/opcoes.webp',
            personagem: 'game_assets/tabuleiro/deserto/iconeegito.webp',
            imagemBau: 'game_assets/tabuleiro/deserto/bau.webp',
            chavePerguntas: 'deserto'
        },
        'oceano': {
            imagemFundo: 'game_assets/tabuleiro/oceano/oceano.webp',
            posicoesCasas: {
                '1': { top: '92%', left: '50%' },
                '2': { top: '81%', left: '40%' },
                '3': { top: '83%', left: '28%' },
                '4': { top: '73%', left: '18%' },
                '5': { top: '52%', left: '25%' },
                '6': { top: '28%', left: '30%' },
                '7': { top: '20%', left: '45%' },
                '8': { top: '31%', left: '59%' },
                '9': { top: '21%', left: '72%' },
                '10': { top: '44%', left: '76%' },
                '11': { top: '65%', left: '70%' },
                '12': { top: '90%', left: '79%' },
            },
            waypoints: {
                '5-6': [{ top: '23%', left: '25%' },],
                '6-7': [{ top: '28%', left: '37%' },],
                '9-10': [{ top: '23%', left: '82%' },],
                '11-12': [{ top: '80%', left: '81%' },],
            },
            monstros: [
                "oceano/nemo.webp",
                "oceano/cobrinha.webp",
                "oceano/arraia.webp",
                "oceano/tubarao.webp",
                "oceano/cavalomarinho.webp",
                "oceano/peixedepe.webp",
                "oceano/cobrona.webp",
                "oceano/peixedoido.webp",
                "oceano/polvo.webp",
                "oceano/cthulhu.webp"
            ],
            pergunta: 'game_assets/quiz/oceano/pergunta.webp',
            fundoPergunta: 'game_assets/quiz/oceano/fundoperguntas.webp',
            opcoes: 'oceano/opcoes.webp',
            personagem: 'game_assets/tabuleiro/oceano/iconeoceano.webp',
            imagemBau: 'game_assets/tabuleiro/oceano/bau.webp',
            chavePerguntas: 'oceano'
        },
        'floresta': {
            imagemFundo: 'game_assets/tabuleiro/floresta/floresta.webp',
            posicoesCasas: {
                '1': { top: '73%', left: '28%' },
                '2': { top: '84%', left: '20%' },
                '3': { top: '69%', left: '24%' },
                '4': { top: '60%', left: '36%' },
                '5': { top: '46%', left: '29%' },
                '6': { top: '32%', left: '19%' },
                '7': { top: '24%', left: '30%' },
                '8': { top: '31%', left: '40%' },
                '9': { top: '45%', left: '47%' },
                '10': { top: '45%', left: '60%' },
                '11': { top: '33%', left: '70%' },
                '12': { top: '15%', left: '78%' },
            },
            waypoints: {
                '1-2': [{ top: '81%', left: '32%' },],
                '2-3': [{ top: '70%', left: '19%' },],
                '4-5': [{ top: '50%', left: '35%' },],
                '11-12': [{ top: '20%', left: '73%' },]
            },
            monstros: [
                "floresta/sapo.webp",
                "floresta/arara.webp",
                "floresta/tamandua.webp",
                "floresta/onca.webp",
                "floresta/saci.webp",
                "floresta/caipora.webp",
                "floresta/mulasemcabeca.webp",
                "floresta/cuca.webp",
                "floresta/boitata.webp",
                "floresta/manpinguari.webp"
            ],
            pergunta: 'game_assets/quiz/floresta/pergunta.webp',
            fundoPergunta: 'game_assets/quiz/floresta/fundoperguntas.webp',
            opcoes: 'floresta/opcoes.webp',
            personagem: 'game_assets/tabuleiro/floresta/iconefloresta.webp',
            imagemBau: 'game_assets/tabuleiro/floresta/bau.webp',
            chavePerguntas: 'floresta'
        }
    };

    let tempoInicial;

    window.reiniciarJogo = function () {
        casaAtual = 1;
        moedas = 0;
        vidas = 3;
        indice = 0;
        tempoInicial = Date.now();
        
        const posInicial = posicoesDasCasas[1];
        if (posInicial) {
            protagonista.style.top = posInicial.top;
            protagonista.style.left = posInicial.left;
        }

        resetarCasas();
        vidaMoedas();
        atualizarPontoAtivo();
        fecharQuiz();
        ativarBotoes();
    }

    window.carregarMapa = function (idMapa) {
        const config = CONFIG_MAPAS[idMapa];
        window.mapaAtual = idMapa;

        if (!config) {
            console.error("Configuração de mapa não encontrada para:", idMapa);
            return;
        }

        posicoesDasCasas = config.posicoesCasas;
        waypoints = config.waypoints || {};
        monstros = config.monstros;
        chavePerguntasAtual = config.chavePerguntas;
        imagemOpcao = config.opcoes;

        const mapaConteudo = document.querySelector('.tabuleiro_conteudo');
        if (mapaConteudo) {
            mapaConteudo.style.backgroundImage = `url(${config.fundoPergunta})`;
        }

        const mapaProporcional = document.querySelector('.mapa_proporcional');
        if (mapaProporcional) {
            mapaProporcional.style.backgroundImage = `url(${config.imagemFundo})`;
        }

        if (protagonista && config.personagem) {
            protagonista.src = config.personagem;
        }

        const bau = document.querySelector('.ponto_clicavel[data-casa="12"]');
        if (bau) {
            bau.style.backgroundImage = `url(${config.imagemBau})`;
        }

        const fundoDasPerguntas = document.querySelector('.quiz_conteudo');
        if (fundoDasPerguntas) {
            fundoDasPerguntas.style.backgroundImage = `url(${config.fundoPergunta})`;
        }

        const localPerguntas = document.getElementById('imagem_pergunta');
        if (localPerguntas) {
            localPerguntas.src = config.pergunta;
        }

        const quizContainer = document.getElementById('texto_quiz');

        if (quizContainer) {
            quizContainer.classList.remove('quiz_tema_branco', 'quiz_tamanho_opcao');

            if (idMapa === 'caverna' || idMapa === 'floresta') {
                quizContainer.classList.add('quiz_tema_branco');
            }

            if (idMapa != 'ilha') {
                quizContainer.classList.add('quiz_tamanho_opcao');
            }
        }

        atualizarPosicoesVisuais();

        if (typeof window.reiniciarJogo === 'function') {
            window.reiniciarJogo();
        }

        fecharAba('aba_mapas');
        mostrarAba('tabuleiro');
        iniciarJogo();
    };

    window.verificarProgressoMapas = function () {
        console.log("Verificando progresso dos mapas...");
        const mapas = ['ilha', 'caverna', 'deserto', 'oceano', 'floresta'];

        mapas.forEach(nomeMapa => {
            // Tenta pegar do localStorage (ex: "3", "2", "1" ou null)
            const estrelasGanhas = parseInt(localStorage.getItem(`estrelas_${nomeMapa}`)) || 0;

            const overlay = document.getElementById(`overlay-${nomeMapa}`);

            // Seleciona as imagens individuais pelo ID
            const bronze = document.getElementById(`bronze-${nomeMapa}`);
            const prata = document.getElementById(`prata-${nomeMapa}`);
            const ouro = document.getElementById(`ouro-${nomeMapa}`);

            if (overlay) {
                if (estrelasGanhas > 0) {
                    // Se o jogador tem alguma vitória, mostra o overlay
                    overlay.classList.remove('escondido');

                    // LÓGICA DE ACUMULAÇÃO:

                    // 1. Bronze: Aparece se tiver 1, 2 ou 3 estrelas
                    if (bronze) {
                        if (estrelasGanhas >= 1) {
                            bronze.classList.remove('escondido');
                        } else {
                            bronze.classList.add('escondido');
                        }
                    }

                    // 2. Prata: Aparece se tiver 2 ou 3 estrelas
                    if (prata) {
                        if (estrelasGanhas >= 2) {
                            prata.classList.remove('escondido');
                        } else {
                            prata.classList.add('escondido');
                        }
                    }

                    // 3. Ouro: Aparece apenas se tiver 3 estrelas
                    if (ouro) {
                        if (estrelasGanhas >= 3) {
                            ouro.classList.remove('escondido');
                        } else {
                            ouro.classList.add('escondido');
                        }
                    }

                } else {
                    // Se não jogou ou não ganhou (0 estrelas), esconde tudo
                    overlay.classList.add('escondido');
                }
            }
        });
    }

    window.verificarProgressoMapas();

    function atualizarPosicoesVisuais() {
        pontos.forEach(ponto => {
            const casaNumero = parseInt(ponto.getAttribute('data-casa'));
            const pos = posicoesDasCasas[casaNumero];

            if (pos) {
                ponto.style.top = pos.top;
                ponto.style.left = pos.left;
                ponto.style.display = 'block';
            } else {
                ponto.style.display = 'none';
            }
        });
    }

    // --- TABULEIRO E QUIZ ---

    const protagonista = document.getElementById('protagonista');
    const pontos = document.querySelectorAll('.ponto_clicavel');
    const imagemMonstro = document.getElementById("imagem_do_monstro");
    let casaAtual = 1;
    let moedas = 0;
    let vidas = 3;
    let indice = 0;

    let monstros = CONFIG_MAPAS['ilha'].monstros;
    let posicoesDasCasas = CONFIG_MAPAS['ilha'].posicoesCasas;
    let waypoints = CONFIG_MAPAS['ilha'].waypoints;
    let chavePerguntasAtual = 'ilha';
    let imagemOpcao = CONFIG_MAPAS['ilha'].opcoes;
    let perguntas;

    const erros = {
        3: "erro1.webp",
        2: "erro2.webp",
    };

    function inicializarPontos() {
        pontos.forEach(ponto => {
            const casaNumero = parseInt(ponto.getAttribute('data-casa'));
            ponto.addEventListener('click', async () => {
                await tentarMoverPara(casaNumero);
            });
        });
        atualizarPosicoesVisuais();
    }

    function atualizarPontoAtivo() {
        const proximaCasa = casaAtual + 1;

        pontos.forEach(ponto => {
            const casaNumero = parseInt(ponto.getAttribute('data-casa'));

            if (casaNumero === proximaCasa) {
                ponto.classList.add('proxima-casa');
                if (proximaCasa < 12)
                    ponto.classList.add('ponto-gradiente');
            } else {
                ponto.classList.remove('proxima-casa');
                if (casaNumero == proximaCasa - 1) {
                    ponto.classList.add('casa-completa')
                }
            }
        });
    }

    function resetarCasas() {
        pontos.forEach(ponto => {
            ponto.classList.remove('casa-completa');
        });
    }

    async function tentarMoverPara(casaNumero) {
        if (casaNumero !== casaAtual + 1) {
            return;
        }

        await moverPirataPara(casaNumero);
        casaAtual = casaNumero;

        if (casaAtual >= 12) {
            mostrarTelaVitoria();
            tocarSomVitoria()
            return;
        }

        atualizarPontoAtivo();

        indice = casaAtual - 2;
        mostrarPerguntas();
        mostrarQuiz();
    }

    function esperarTransicao(element, timeout = 800) {
        return new Promise(resolve => {
            let terminado = false;
            const onEnd = (e) => {
                if (e.propertyName === 'top' || e.propertyName === 'left') {
                    if (!terminado) {
                        terminado = true;
                        element.removeEventListener('transitionend', onEnd);
                        clearTimeout(tid);
                        resolve();
                    }
                }
            };
            element.addEventListener('transitionend', onEnd);
            const tid = setTimeout(() => {
                if (!terminado) {
                    terminado = true;
                    element.removeEventListener('transitionend', onEnd);
                    resolve();
                }
            }, timeout);
        });
    }

    async function moveParaPosicao(pos, tempoEspera = 500) {
        if (!pos) return;
        protagonista.style.top = pos.top;
        protagonista.style.left = pos.left;
        await esperarTransicao(protagonista, tempoEspera + 300);
        await new Promise(r => setTimeout(r, 50));
    }

    async function moverPirataPara(casaDestino) {
        const inicio = posicoesDasCasas[casaAtual];
        const fim = posicoesDasCasas[casaDestino];
        if (!inicio || !fim) return;

        const chave = `${casaAtual}-${casaDestino}`;
        const wp = waypoints[chave] || [];

        for (let i = 0; i < wp.length; i++) {
            await moveParaPosicao(wp[i], 400);
        }


        await moveParaPosicao(fim, 500);
    }

    inicializarPontos();
    const pos1 = posicoesDasCasas[1];
    if (pos1) {
        protagonista.style.top = pos1.top;
        protagonista.style.left = pos1.left;
    }

    // Perguntas e manipução de itens

    function vidaMoedas() {
        let vidaLocal = document.getElementById("valor_vida");
        vidaLocal.innerHTML = `<img src="game_assets/tabuleiro/iconevida.webp" class="icone-rodape">
        <p class="texto_barra">${vidas}</p>`;
        let moedaLocal = document.getElementById("valor_moeda");
        moedaLocal.innerHTML = `<img src="game_assets/tabuleiro/iconemoeda.webp" class="icone-rodape">
        <p class="texto_barra">${moedas}</p>`;
    }

    vidaMoedas();
    atualizarPontoAtivo();

    function mostrarQuiz() {
        let quiz = document.getElementById("quiz");
        quiz.classList.remove("escondido");

    }

    function fecharQuiz() {
        let quiz = document.getElementById("quiz");
        quiz.classList.add("escondido");
        document.getElementById("quiz_conteudo_moedas").classList.add("quiz_conteudo_escondido");
        document.getElementById("quiz_conteudo_vidas").classList.add("quiz_conteudo_escondido");
    }

    function fecharErro() {
        document.getElementById("quiz_conteudo_vidas").classList.add("quiz_conteudo_escondido");
    }

    async function carregarPerguntas() {
        let response = await fetch("components/data/perguntas.json");
        let dados = await response.json();
        return dados;
    }

    async function iniciarJogo() {
        let dadosCompletos = await carregarPerguntas();
        perguntas = dadosCompletos[chavePerguntasAtual];
    }

    function mostrarPerguntas() {
        tocarSomPergunta();
        let nomeMonstro = monstros[indice];
        imagemMonstro.src = `game_assets/quiz/${nomeMonstro}`;

        let texto = document.getElementById("pergunta");
        texto.innerHTML = perguntas[indice].pergunta;

        let opcoes = document.getElementById("opcoes");
        opcoes.innerHTML = "";

        for (let i = 0; i < 3; i++) {
            opcoes.innerHTML += `<div class="quiz_conteudo_organizacao_quiz_opcoes_resposta">
                                <button class="quiz_botao_opcao" onclick="verificarResposta(${i})">
                                    <div class="quiz_conteudo_organizacao_quiz_opcoes_resposta_imagem">
                                        <img src="game_assets/quiz/${imagemOpcao}">
                                        <div class="quiz_conteudo_organizacao_quiz_opcoes_resposta_texto">
                                            <p>${perguntas[indice].opcoes[i]}</p>
                                        </div>
                                    </div>
                                </button>
                            </div>`;
        }
    }

    function mostrarTelaVitoria() {
        const tela = document.getElementById("tela_vitoria_container");
        mostrarMoedasFinal();

        const tempoFinal = Date.now();
        const tempoGastoSegundos = (tempoFinal - tempoInicial) / 1000;
        let qtdEstrelas = 1;

        if (tempoGastoSegundos <= 120) {
            qtdEstrelas = 3;
        } else if (tempoGastoSegundos <= 300) {
            qtdEstrelas = 2;
        }

        // --- SALVAMENTO DO PROGRESSO ---
        if (window.mapaAtual !== "") {
            console.log(`Tentando salvar ${qtdEstrelas} estrelas para o mapa: ${window.mapaAtual}`);
            const recordeAntigo = parseInt(localStorage.getItem(`estrelas_${window.mapaAtual}`)) || 0;

            if (qtdEstrelas > recordeAntigo) {
                localStorage.setItem(`estrelas_${window.mapaAtual}`, qtdEstrelas);
                console.log("Progresso salvo com sucesso!");
            } else {
                console.log("Pontuação não superou o recorde anterior.");
            }
        } else {
            console.error("ERRO: 'mapaAtual' está vazio. O jogo não sabe qual mapa salvar.");
        }

        console.log(`Você recebeu ${qtdEstrelas} estrelas.`);
        tela.classList.remove("escondido");
        tela.classList.add("mostrar");
        if (typeof window.verificarProgressoMapas === 'function') {
            window.verificarProgressoMapas();
        }

        // --- CÓDIGO DE CONFETES ---
        function shootConfetti(angle, originX, originY, velocity, count, spread) {
            confetti({
                particleCount: count,
                angle: angle,
                spread: spread,
                origin: { x: originX, y: originY },
                startVelocity: velocity,
                ticks: 150,
                gravity: 1.2,
                decay: 0.92,
                shapes: ['square', 'circle'],
                scalar: 1.2,
                zIndex: 99999
            });
        }

        shootConfetti(60, 0, 0.9, 70, 100, 80);
        shootConfetti(120, 1, 0.9, 70, 100, 80);

        setTimeout(() => {
            shootConfetti(45, 0, 0.5, 60, 100, 60);
            shootConfetti(135, 1, 0.5, 60, 100, 60);
        }, 100);

        setTimeout(() => {
            confetti({
                particleCount: 180,
                spread: 180,
                origin: { y: -0.1, x: 0.5 },
                angle: 270,
                gravity: 1.5,
                startVelocity: 50,
                ticks: 200,
                zIndex: 99999
            });
        }, 250);
    }



    window.comprarVida = function (qtdVidas) {
        let custo = 0;

        if (qtdVidas == 1) custo = 4;
        else if (qtdVidas == 2) custo = 8;
        else if (qtdVidas == 3) custo = 12;

        if (moedas >= custo) {
            moedas -= custo;
            vidas += qtdVidas;
            tocarSomMoeda();
            vidaMoedas();
            esconderTelaVidas();
            mostrarQuiz();
        } else {
            tocarSomVida();
        }
    }

    function mostrarTelaVidas() {
        const tela = document.getElementById("tela_vidas");
        tela.classList.remove("escondido");
    }

    window.esconderTelaVidas = function () {
        const tela = document.getElementById("tela_vidas");
        tela.classList.add("escondido");
    }

    window.mostrarTelaDerrota = function() {
        const tela = document.getElementById("tela_derrota_container");
        mostrarMoedasFinal()
        tela.classList.remove("escondido");
        tela.classList.add("mostrar");
    }

    window.esconderTelaVitoria = function () {
        const tela = document.getElementById("tela_vitoria_container");
        tela.classList.remove("mostrar");
        tela.classList.add("escondido");
    }

    window.esconderTelaDerrota = function () {
        const tela = document.getElementById("tela_derrota_container");
        tela.classList.remove("mostrar");
        tela.classList.add("escondido");
    }

    function desativarBotoes() {
        let todosOsBotoes = document.querySelectorAll(".quiz_botao_opcao");
        todosOsBotoes.forEach(botao => {
            botao.disabled = true;
            botao.style.pointerEvents = 'none';

            let containerDaOpcao = botao.closest('.quiz_conteudo_organizacao_quiz_opcoes_resposta');

            if (containerDaOpcao) {
                containerDaOpcao.classList.add('desativado');
            }
        });
    }

    function ativarBotoes() {
        let todosOsBotoes = document.querySelectorAll(".quiz_botao_opcao");
        todosOsBotoes.forEach(botao => {
            botao.disabled = false;
            botao.style.pointerEvents = 'auto';

            let containerDaOpcao = botao.closest('.quiz_conteudo_organizacao_quiz_opcoes_resposta');

            if (containerDaOpcao) {
                containerDaOpcao.classList.remove('desativado');
            }
        });
    }

    function mostrarMoedasFinal() {
        const vitoriaMoeda = document.getElementById("moedas_vitoria");
        const derrotaMoeda = document.getElementById("moedas_derrota");

        const conteudo = `
         <div class="moedas_final_conteudo">
            <img src="game_assets/tabuleiro/iconemoeda.webp">
            <span class="texto_barra">x${moedas}</span>
        </div>
    `;

        if (vitoriaMoeda) vitoriaMoeda.innerHTML = conteudo;
        if (derrotaMoeda) derrotaMoeda.innerHTML = conteudo;
    }

    window.verificarResposta = function (num) {
        let mensagemMoedas = document.getElementById("quiz_conteudo_moedas");

        if (perguntas[indice].resposta == perguntas[indice].opcoes[num]) {
            mensagemMoedas.classList.remove("quiz_conteudo_escondido");
            tocarSomMoeda();
            moedas += 3;
            desativarBotoes();
            setTimeout(fecharQuiz, 2300);
        }
        else {
            let imagemErro = erros[vidas] || erros[2];

            vidas -= 1;
            tocarSomVida();
            if (vidas <= 0) {
                fecharQuiz();
                if (moedas < 4) {
                    mostrarTelaDerrota();
                    tocarSomDerrota();
                } else {
                    mostrarTelaVidas();
                }
            } else {
                let mensagemVidas = document.getElementById("quiz_conteudo_vidas");

                mensagemVidas.innerHTML = `<img src="game_assets/quiz/fundoopcao.webp">
                <img src="game_assets/quiz/${imagemErro}" class="quiz_conteudo_escondido_texto">`;

                mensagemVidas.classList.remove("quiz_conteudo_escondido");
                desativarBotoes();

                setTimeout(() => {
                    fecharErro();
                    ativarBotoes();
                }, 2300);
            }
        }
        vidaMoedas();
    };

    iniciarJogo();
});