/**
 * PALAVRAS MÁGICAS - Jogo Educativo
 * Módulo Principal - script.js
 * 
 * Este arquivo contém a lógica principal do jogo "Palavras Mágicas",
 * um jogo educativo onde o jogador forma palavras a partir de letras disponíveis.
 * 
 * @version 1.0.0
 * @author Equipe de Desenvolvimento
 */

// ===== CONSTANTES E CONFIGURAÇÕES =====
const CONFIG = {
    audio: {
        musicaVol: 0.5,
        sfxVol: 1.0
    },
    jogo: {
        tempoFeedback: 500 // ms
    },
    zoom: {
        default: 100, // valor padrão em %
        min: 10,
        max: 200,
        step: 10
    }
};

// ===== VARIÁVEIS GLOBAIS =====
let niveis = [];
let nivelAtual = 0;
let palavraCorreta = '';
let letrasAdivinhadas = [];

// ===== ELEMENTOS DOM =====
const DOM = {};
const SONS = {};

// ===== INICIALIZAÇÃO DO JOGO =====
document.addEventListener('DOMContentLoaded', () => {
    inicializarJogo();
});

/**
 * Inicializa o jogo configurando todos os componentes necessários
 */
function inicializarJogo() {
    try {
        mapearElementosDom();
        carregarSons();
        configurarEventos();
        configurarZoom(); // Nova função
        carregarDadosJogo();
        tentarIniciarMusica();
        aplicarZoomSalvo();
        console.log('Jogo inicializado com sucesso!');
    } catch (error) {
        console.error('Erro ao inicializar o jogo:', error);
    }
}

/**
 * Mapeia todos os elementos DOM necessários para o jogo
 */
function mapearElementosDom() {
    // Container Principal (Adicionado para funcionar o Zoom)
    DOM.gameContainer = document.getElementById('game-container');

    // Telas
    DOM.telaInicial = document.getElementById('tela-inicial');
    DOM.telaJogo = document.getElementById('tela-jogo');
    DOM.telaOpcoes = document.getElementById('tela-opcoes');
    DOM.telaCreditos = document.getElementById('tela-creditos');
    DOM.telaFimJogo = document.getElementById('tela-fim-jogo');
    DOM.modalFeedback = document.getElementById('modal-feedback');

    // Botões
    DOM.btnJogar = document.getElementById('btn-jogar');
    DOM.btnOpcoes = document.getElementById('btn-opcoes');
    DOM.btnCreditos = document.getElementById('btn-creditos');
    DOM.btnVoltarMenuFinal = document.getElementById('btn-voltar-menu-final');
    DOM.btnVoltarMenu = document.getElementById('btn-voltar-menu');
    DOM.btnFecharOpcoes = document.getElementById('btn-fechar-opcoes');
    DOM.btnFecharCreditos = document.getElementById('btn-fechar-creditos');
    DOM.btnBackspace = document.getElementById('btn-backspace');
    DOM.botoesGerais = document.querySelectorAll("button");

    // Elementos do Jogo
    DOM.numeroFase = document.getElementById('numero-fase');
    DOM.imagemFase = document.getElementById('imagem-fase');
    DOM.palavraContainer = document.getElementById('palavra-container');
    DOM.letrasBaralho = document.getElementById('letras-baralho');

    // Áudio e Inputs
    DOM.musicaFundo = document.getElementById('musica-fundo');
    DOM.sliderMusica = document.getElementById('slider-musica');
    DOM.sliderSfx = document.getElementById('slider-sfx');

    // Novos elementos de zoom
    DOM.btnZoom = document.getElementById('btn-zoom');
    DOM.zoomDropdown = document.getElementById('zoom-dropdown');
}

/**
 * Configura o dropdown de zoom e seus eventos
 */
function configurarZoom() {
    // Gerar opções de 10% a 200%
    for (let i = CONFIG.zoom.min; i <= CONFIG.zoom.max; i += CONFIG.zoom.step) {
        const btn = document.createElement('button');
        btn.classList.add('zoom-option');
        btn.textContent = `${i}%`;
        btn.dataset.zoom = i;
        btn.addEventListener('click', () => {
            aplicarZoom(i);
            fecharDropdownZoom();
            marcarOpcaoAtiva(i);
            salvarZoomPreferido(i);
            executarSom(SONS.clique);
        });
        DOM.zoomDropdown.appendChild(btn);
    }

    // Toggle do dropdown
    DOM.btnZoom.addEventListener('click', (e) => {
        e.stopPropagation();
        DOM.zoomDropdown.classList.toggle('aberto');
        executarSom(SONS.clique);
    });

    // Fechar dropdown ao clicar fora
    document.addEventListener('click', () => {
        DOM.zoomDropdown.classList.remove('aberto');
    });

    // Impedir que clique no dropdown feche ele mesmo
    DOM.zoomDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

/**
 * Aplica o zoom na página (todo o game-container)
 * @param {number} percentual 
 */
function aplicarZoom(percentual) {
    const escala = percentual / 100;
    if(DOM.gameContainer) {
        DOM.gameContainer.style.transform = `scale(${escala})`;
    }
}

/**
 * Marca visualmente a opção atualmente selecionada
 * @param {number} percentual 
 */
function marcarOpcaoAtiva(percentual) {
    document.querySelectorAll('.zoom-option').forEach(opt => {
        opt.classList.toggle('ativo', parseInt(opt.dataset.zoom) === percentual);
    });
}

/**
 * Salva a preferência de zoom no localStorage
 * @param {number} percentual 
 */
function salvarZoomPreferido(percentual) {
    localStorage.setItem('palavrasMagicas_zoom', percentual);
}

/**
 * Aplica o zoom salvo (ou padrão) ao iniciar o jogo
 */
function aplicarZoomSalvo() {
    const salvo = parseInt(localStorage.getItem('palavrasMagicas_zoom')) || CONFIG.zoom.default;
    aplicarZoom(salvo);
    marcarOpcaoAtiva(salvo);
}

/**
 * Fecha o dropdown de zoom
 */
function fecharDropdownZoom() {
    DOM.zoomDropdown.classList.remove('aberto');
}

/**
 * Carrega e configura os sons do jogo
 */
function carregarSons() {
    try {
        SONS.clique = new Audio("../game_assets/sounds/click.mp3");
        SONS.acerto = new Audio('../game_assets/sounds/correct.mp3');
        SONS.erro = new Audio('../game_assets/sounds/incorrect.mp3');
        SONS.sucesso = new Audio('../game_assets/sounds/sucess.mp3');
        
        atualizarVolumeMusica(CONFIG.audio.musicaVol);
    } catch (error) {
        console.error('Erro ao carregar sons:', error);
    }
}

/**
 * Configura todos os eventos do jogo
 */
function configurarEventos() {
    // Navegação entre telas
    DOM.btnJogar.addEventListener('click', iniciarJogo);
    DOM.btnOpcoes.addEventListener('click', () => mostrarTela(DOM.telaOpcoes));
    DOM.btnCreditos.addEventListener('click', () => mostrarTela(DOM.telaCreditos));
    DOM.btnVoltarMenuFinal.addEventListener('click', () => mostrarTela(DOM.telaInicial));
    DOM.btnVoltarMenu.addEventListener('click', () => mostrarTela(DOM.telaInicial));
    DOM.btnFecharOpcoes.addEventListener('click', () => mostrarTela(DOM.telaInicial));
    DOM.btnFecharCreditos.addEventListener('click', () => mostrarTela(DOM.telaInicial));
    
    // Controles de jogo
    DOM.btnBackspace.addEventListener('click', removerUltimaLetra);

    // Configurações de áudio
    DOM.sliderMusica.addEventListener('input', (e) => {
        CONFIG.audio.musicaVol = parseFloat(e.target.value);
        atualizarVolumeMusica(CONFIG.audio.musicaVol);
    });

    DOM.sliderSfx.addEventListener('input', (e) => {
        CONFIG.audio.sfxVol = parseFloat(e.target.value);
    });

    // Som de clique para todos os botões
    DOM.botoesGerais.forEach(botao => {
        botao.addEventListener("click", () => {
            executarSom(SONS.clique);
        });
    });
}

// ===== GERENCIAMENTO DE DADOS =====

/**
 * Carrega os dados dos níveis do jogo
 */
async function carregarDadosJogo() {
    try {
        const response = await fetch('../game_assets/data/niveis.json');
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        niveis = await response.json();
        console.log(`Carregados ${niveis.length} níveis`);
    } catch (error) {
        console.error('Erro ao carregar níveis:', error);
        // Fallback para níveis básicos em caso de erro
        niveis = [
            { nivel: 1, palavra: "SOL", imagem: "../game_assets/images/sol.webp" },
            { nivel: 2, palavra: "GATO", imagem: "../game_assets/images/gato.webp" }
        ];
    }
}

// ===== GERENCIAMENTO DE ÁUDIO =====

/**
 * Tenta iniciar a música de fundo, com fallback para interação do usuário
 */
function tentarIniciarMusica() {
    const promessa = DOM.musicaFundo.play();
    if (promessa !== undefined) {
        promessa.catch(() => {
            document.body.addEventListener('click', () => {
                if (DOM.musicaFundo.paused) {
                    DOM.musicaFundo.play().catch(e => console.warn('Não foi possível reproduzir música:', e));
                }
            }, { once: true });
        });
    }
}

/**
 * Atualiza o volume da música de fundo
 * @param {number} volume - Volume entre 0 e 1
 */
function atualizarVolumeMusica(volume) {
    DOM.musicaFundo.volume = volume;
}

/**
 * Executa um efeito sonoro
 * @param {Audio} audioObj - Objeto de áudio a ser executado
 */
function executarSom(audioObj) {
    if (!audioObj) return;
    
    if (CONFIG.audio.sfxVol > 0) {
        audioObj.volume = CONFIG.audio.sfxVol;
        audioObj.currentTime = 0;
        audioObj.play().catch(() => {
            console.warn('Não foi possível reproduzir efeito sonoro');
        });
    }
}

// ===== GERENCIAMENTO DE TELAS =====

/**
 * Mostra uma tela específica e esconde as demais
 * @param {HTMLElement} telaParaMostrar - Elemento da tela a ser mostrada
 */
function mostrarTela(telaParaMostrar) {
    Object.values(DOM).forEach(el => {
        if (el && el.classList && el.classList.contains('tela')) {
            el.classList.remove('ativa');
        }
    });
    telaParaMostrar.classList.add('ativa');
}

// ===== LÓGICA DO JOGO =====

/**
 * Inicia o jogo a partir do primeiro nível
 */
function iniciarJogo() {
    nivelAtual = 0;
    carregarNivel(nivelAtual);
    mostrarTela(DOM.telaJogo);
}

/**
 * Carrega um nível específico do jogo
 * @param {number} index - Índice do nível a ser carregado
 */
function carregarNivel(index) {
    if (index >= niveis.length) {
        finalizarJogo();
        return;
    }

    const nivel = niveis[index];
    palavraCorreta = nivel.palavra.toUpperCase();
    letrasAdivinhadas = Array(palavraCorreta.length).fill(null);

    // Atualizar interface
    DOM.numeroFase.textContent = `FASE ${nivel.nivel}`;
    DOM.imagemFase.src = nivel.imagem;
    DOM.imagemFase.alt = `Imagem representando a palavra ${nivel.palavra}`;

    // Limpar elementos anteriores
    DOM.palavraContainer.innerHTML = '';
    DOM.letrasBaralho.innerHTML = '';

    // Criar placeholders para a palavra
    palavraCorreta.split('').forEach(() => {
        const placeholder = document.createElement('div');
        placeholder.classList.add('letra-placeholder');
        DOM.palavraContainer.appendChild(placeholder);
    });

    // Preparar e exibir letras do baralho
    const letrasDoBaralho = prepararLetrasBaralho(nivel);
    
    letrasDoBaralho.forEach(letra => {
        const balao = document.createElement('div');
        balao.classList.add('letra-balao');
        balao.textContent = letra;
        balao.setAttribute('role', 'button');
        balao.setAttribute('aria-label', `Letra ${letra}`);
        balao.addEventListener('click', () => selecionarLetra(balao));
        DOM.letrasBaralho.appendChild(balao);
    });
}

/**
 * Prepara as letras do baralho para o nível atual
 * @param {Object} nivel - Objeto do nível atual
 * @returns {Array} Array de letras embaralhadas
 */
function prepararLetrasBaralho(nivel) {
    let letras = nivel.letrasEmbaralhadas ? 
        [...nivel.letrasEmbaralhadas] : 
        gerarLetrasAleatorias(nivel.palavra);
    
    return embaralharArray(letras);
}

/**
 * Embaralha um array usando o algoritmo Fisher-Yates
 * @param {Array} array - Array a ser embaralhado
 * @returns {Array} Array embaralhado
 */
function embaralharArray(array) {
    const novoArray = [...array];
    for (let i = novoArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [novoArray[i], novoArray[j]] = [novoArray[j], novoArray[i]];
    }
    return novoArray;
}

/**
 * Gera letras aleatórias para completar o baralho
 * @param {string} palavra - Palavra do nível atual
 * @returns {Array} Array de letras para o baralho
 */
function gerarLetrasAleatorias(palavra) {
    const letrasDaPalavra = [...new Set(palavra.toUpperCase().split(''))];
    const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let letrasExtras = [];
    
    while (letrasExtras.length < (12 - letrasDaPalavra.length)) {
        const l = alfabeto[Math.floor(Math.random() * alfabeto.length)];
        if (!letrasDaPalavra.includes(l) && !letrasExtras.includes(l)) {
            letrasExtras.push(l);
        }
    }
    
    return [...letrasDaPalavra, ...letrasExtras];
}

/**
 * Processa a seleção de uma letra pelo jogador
 * @param {HTMLElement} balao - Elemento do balão de letra clicado
 */
function selecionarLetra(balao) {
    const proximoIndexVazio = letrasAdivinhadas.indexOf(null);
    if (proximoIndexVazio === -1) return;

    const letraSelecionada = balao.textContent;
    letrasAdivinhadas[proximoIndexVazio] = letraSelecionada;

    const placeholder = DOM.palavraContainer.children[proximoIndexVazio];
    placeholder.textContent = letraSelecionada;
    
    executarSom(SONS.acerto);

    // Verificar se todas as letras foram preenchidas
    if (!letrasAdivinhadas.includes(null)) {
        setTimeout(verificarPalavra, CONFIG.jogo.tempoFeedback);
    }
}

/**
 * Remove a última letra adicionada à palavra
 */
function removerUltimaLetra() {
    let indexParaRemover = -1;
    for (let i = letrasAdivinhadas.length - 1; i >= 0; i--) {
        if (letrasAdivinhadas[i] !== null) {
            indexParaRemover = i;
            break;
        }
    }

    if (indexParaRemover !== -1) {
        letrasAdivinhadas[indexParaRemover] = null;
        const placeholder = DOM.palavraContainer.children[indexParaRemover];
        placeholder.textContent = '';
        executarSom(SONS.clique);
    }
}

/**
 * Verifica se a palavra formada está correta
 */
function verificarPalavra() {
    const palavraFormada = letrasAdivinhadas.join('');
    if (palavraFormada === palavraCorreta) {
        executarSom(SONS.sucesso);
        mostrarFeedback(true);
    } else {
        executarSom(SONS.erro);
        mostrarFeedback(false);
    }
}

// ===== FEEDBACK E PROGRESSO =====

/**
 * Exibe feedback visual para o jogador
 * @param {boolean} isCorrect - Indica se a resposta está correta
 */
function mostrarFeedback(isCorrect) {
    let htmlContent;
    
    if (isCorrect) {
        htmlContent = `
            <div class="feedback-modal-content">
                <h1>MUITO BEM!</h1>
                <button id="btn-continuar-modal" class="btn-feedback-modal">CONTINUAR</button>
            </div>
        `;
    } else {
        htmlContent = `
            <div class="feedback-modal-content">
                <h1>OPS...<br>TENTE DE NOVO!</h1>
                <button id="btn-tentar-novamente-modal" class="btn-feedback-modal">VOLTAR</button>
            </div>
        `;
    }

    DOM.modalFeedback.innerHTML = htmlContent;
    DOM.modalFeedback.classList.add('visivel');

    const btnAcao = isCorrect ? 
        document.getElementById('btn-continuar-modal') : 
        document.getElementById('btn-tentar-novamente-modal');

    btnAcao.addEventListener('click', () => {
        executarSom(SONS.clique);
        DOM.modalFeedback.classList.remove('visivel');
        if (isCorrect) {
            avancarNivel();
        } else {
            resetarTentativa();
        }
    });
}

/**
 * Reseta a tentativa atual, permitindo ao jogador tentar novamente
 */
function resetarTentativa() {
    letrasAdivinhadas.fill(null);
    Array.from(DOM.palavraContainer.children).forEach(p => p.textContent = '');
}

/**
 * Avança para o próximo nível
 */
function avancarNivel() {
    nivelAtual++;
    carregarNivel(nivelAtual);
}

/**
 * Finaliza o jogo quando todos os níveis são completados
 */
function finalizarJogo() {
    mostrarTela(DOM.telaFimJogo);
    executarSom(SONS.sucesso);
}