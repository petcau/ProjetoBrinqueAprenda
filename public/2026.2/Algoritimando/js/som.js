/* ============================================================
   som.js — a música do jogo e os retornos sonoros.

   MÚSICA: a trilha "Agentes de Algoritimando" (audio/musica-
   tema.mp3) toca em loop, baixinha, em todas as telas. Ela só
   começa no primeiro toque na tela — os navegadores não deixam
   tocar som antes disso — e pausa quando a aba fica escondida.

   EFEITOS sintetizados na hora pelo Web Audio (sem arquivo):

     acerto   duas notas subindo — Verificar certo
     erro     duas notas descendo, graves e curtas — sem susto,
              sem "buzina de errado": o erro aqui é parte de
              aprender, não uma punição
     segredo  um mistério que se desvenda — o agente secreto apareceu
     clique   uma nota curta — troca de tela

   EFEITOS em arquivo (audio/efeitos/), cada um com um som
   sintetizado de reserva:

     vitoria     nível concluído
     promocao    promoção a Agente e a Agente Sênior
     festa       a festa da animação final
     selo        a lição que entrega um selo
     figurinha   figurinha nova colando no álbum
     dica        pedir uma dica
     quadro      cada quadro novo da abertura e da animação final
     cartaVolta  a carta sai do tabuleiro e volta para a bandeja
     certificado o certificado abrindo (a animação segue o ápice, 1,6 s)
     selecaoAgente  escolher um agente diferente no crachá
     cartaVai    a carta entra num espaço do tabuleiro (o carta-volta, mais agudo)

   O painel de CONFIGURAÇÕES liga e desliga a música e os efeitos separados, e
   tem um volume para cada um. Desligar é de verdade (sala com
   trinta crianças, professor explicando): música desligada não é
   nem carregada, efeito desligado não cria oscilador. A escolha
   fica guardada no navegador. O volume da música passa pelo Web
   Audio (pelo site), porque o iPhone ignora o volume de um <audio>;
   e a barrinha segue uma curva, para abaixar de verdade perto do
   mínimo (ver tocarMusica).

   O contexto de áudio só nasce no primeiro som — ou seja, depois
   de a criança já ter tocado na tela. É o que os navegadores
   exigem, e evita o aviso de "AudioContext bloqueado" no console.
   ============================================================ */

'use strict';

(function () {

  const CHAVE = 'algoritimando-som';            // efeitos: 'ligado' | 'desligado'
  const CHAVE_AJUSTES = 'algoritimando-som-ajustes';
  const ARQUIVO_MUSICA = 'audio/musica-tema.mp3';

  let ligado = lerPreferencia();                // efeitos
  let contexto = null;
  // a prévia do editor não toca música: o professor está editando
  const ajustes = Object.assign(
    { musica: !window.ALGORITIMANDO_PREVIA, volumeMusica: 0.35, volumeEfeitos: 0.8 },
    lerAjustes());
  if (window.ALGORITIMANDO_PREVIA) ajustes.musica = false;

  function lerPreferencia() {
    try { return localStorage.getItem(CHAVE) !== 'desligado'; }
    catch { return true; }          // sem localStorage, o som vem ligado
  }

  function lerAjustes() {
    try { return JSON.parse(localStorage.getItem(CHAVE_AJUSTES)) || {}; }
    catch { return {}; }
  }

  function gravarPreferencia() {
    try {
      localStorage.setItem(CHAVE, ligado ? 'ligado' : 'desligado');
      if (!window.ALGORITIMANDO_PREVIA) localStorage.setItem(CHAVE_AJUSTES, JSON.stringify(ajustes));
    } catch { /* segue sem lembrar na próxima visita */ }
  }

  /* ---------------- síntese ---------------- */

  /* notas: [[frequência em Hz, duração em segundos], ...] tocadas
     em sequência, cada uma desaparecendo suavemente (sem o "clique"
     que um corte seco produziria no alto-falante) */
  function tocar(notas, volume) {
    if (!ligado) return;
    try {
      const Contexto = window.AudioContext || window.webkitAudioContext;
      if (!Contexto) return;
      contexto = contexto || new Contexto();
      // alguns navegadores devolvem o contexto suspenso
      if (contexto.state === 'suspended') contexto.resume();

      let t = contexto.currentTime;
      for (const [frequencia, duracao] of notas) {
        const oscilador = contexto.createOscillator();
        const ganho = contexto.createGain();
        oscilador.type = 'sine';                  // onda macia, sem aspereza
        oscilador.frequency.value = frequencia;
        ganho.gain.setValueAtTime(Math.max(0.0001, volume * ajustes.volumeEfeitos), t);
        ganho.gain.exponentialRampToValueAtTime(0.0001, t + duracao);
        oscilador.connect(ganho).connect(contexto.destination);
        oscilador.start(t);
        oscilador.stop(t + duracao);
        t += duracao * 0.85;                      // as notas se encavalam de leve
      }
    } catch { /* sem áudio o jogo funciona igual */ }
  }

  const acerto  = () => tocar([[523, 0.10], [659, 0.16]], 0.10);
  const erro    = () => tocar([[233, 0.14], [196, 0.20]], 0.07);
  const clique  = () => tocar([[440, 0.07]], 0.06);
  const vitoriaSintetizada = () => tocar([[523, 0.13], [659, 0.13], [784, 0.13], [1047, 0.32]], 0.11);

  /* ---------------- efeitos em arquivo (audio/efeitos/) ----------------
     Cada um tem um som sintetizado de reserva, que toca se o arquivo
     falhar. Pelo site (e no jogo instalado) os arquivos são lidos uma
     vez e tocam pelo Web Audio, sem atraso e com o volume certo até no
     iPhone. Aberto com dois cliques no index.html o navegador não deixa
     ler arquivos assim: aí cada som toca num <audio> comum.
     volume: o quanto de cada arquivo (eles foram igualados no pico);
     vezes o volume dos efeitos escolhido nas Configurações. */
  const EFEITOS = {
    vitoria:    { arq: 'vitoria.mp3',     volume: 0.30, reserva: vitoriaSintetizada },
    promocao:   { arq: 'promocao.mp3',    volume: 0.30, reserva: vitoriaSintetizada },
    festa:      { arq: 'festafinal.mp3',  volume: 0.30, reserva: vitoriaSintetizada },
    selo:       { arq: 'selo.mp3',        volume: 0.30, reserva: vitoriaSintetizada },
    figurinha:  { arq: 'figurinha.mp3',   volume: 0.28, reserva: acerto },
    dica:       { arq: 'dica.mp3',        volume: 0.28, reserva: () => tocar([[659, 0.09], [880, 0.14]], 0.08) },
    quadro:     { arq: 'quadro.mp3',      volume: 0.22, reserva: clique },
    cartaVolta: { arq: 'carta-volta.mp3', volume: 0.22, reserva: () => tocar([[392, 0.07], [330, 0.10]], 0.06) },
    certificado: { arq: 'certificado.mp3', volume: 0.32, reserva: vitoriaSintetizada },
    selecaoAgente: { arq: 'selecao-agente.mp3', volume: 0.2, reserva: clique },
    cartaVai:   { arq: 'carta-vai.mp3',   volume: 0.22, reserva: clique },
  };
  const PASTA_EFEITOS = 'audio/efeitos/';
  const sons = {};            // nome → AudioBuffer já lido
  let lendoEfeitos = false;

  // lê todos os arquivos uma vez (só pelo site; no file:// o fetch falha)
  function lerEfeitos() {
    if (lendoEfeitos || !ligado || location.protocol === 'file:' || !window.fetch) return;
    const Contexto = window.AudioContext || window.webkitAudioContext;
    if (!Contexto) return;
    lendoEfeitos = true;
    try {
      contexto = contexto || new Contexto();
      if (contexto.state === 'suspended') contexto.resume();
    } catch { return; }
    for (const [nome, e] of Object.entries(EFEITOS)) {
      fetch(PASTA_EFEITOS + e.arq)
        .then(r => (r.ok ? r.arrayBuffer() : Promise.reject()))
        // o Safari antigo só tem a versão com callbacks
        .then(dados => new Promise((ok, falha) => contexto.decodeAudioData(dados, ok, falha)))
        .then(buffer => { sons[nome] = buffer; })
        .catch(() => { /* fica o <audio> ou o som de reserva */ });
    }
  }

  function tocarEfeito(nome) {
    if (!ligado) return;
    const e = EFEITOS[nome];
    const volume = Math.min(1, e.volume * ajustes.volumeEfeitos);
    if (sons[nome] && contexto) {
      try {
        if (contexto.state === 'suspended') contexto.resume();
        const fonte = contexto.createBufferSource();
        const ganho = contexto.createGain();
        fonte.buffer = sons[nome];
        ganho.gain.value = volume;
        fonte.connect(ganho).connect(contexto.destination);
        fonte.start();
        return;
      } catch { /* tenta o <audio> */ }
    }
    try {
      const audio = new Audio(PASTA_EFEITOS + e.arq);
      audio.volume = volume;
      const tentativa = audio.play();
      if (tentativa) tentativa.catch(() => e.reserva());
    } catch { e.reserva(); }
  }

  const vitoria    = () => tocarEfeito('vitoria');
  const promocao   = () => tocarEfeito('promocao');
  const festa      = () => tocarEfeito('festa');
  const selo       = () => tocarEfeito('selo');
  const figurinha  = () => tocarEfeito('figurinha');
  const dica       = () => tocarEfeito('dica');
  const quadro     = () => tocarEfeito('quadro');
  const cartaVolta = () => tocarEfeito('cartaVolta');
  const certificado = () => tocarEfeito('certificado');
  const selecaoAgente = () => tocarEfeito('selecaoAgente');
  const cartaVai = () => tocarEfeito('cartaVai');

  /* O som do agente secreto: um zumbido grave de mistério, uma escada
     de tons inteiros subindo (soa "estranho", como um enigma) e, no
     fim, um acorde brilhante com sininhos agudos — o segredo abriu.
     eventos: [frequência, início (s), duração (s), forma, volume] */
  function tocarCamadas(eventos) {
    if (!ligado) return;
    try {
      const Contexto = window.AudioContext || window.webkitAudioContext;
      if (!Contexto) return;
      contexto = contexto || new Contexto();
      if (contexto.state === 'suspended') contexto.resume();
      const t0 = contexto.currentTime + 0.02;
      for (const [frequencia, inicio, duracao, forma, volume] of eventos) {
        const oscilador = contexto.createOscillator();
        const ganho = contexto.createGain();
        oscilador.type = forma;
        oscilador.frequency.value = frequencia;
        const t = t0 + inicio;
        const v = Math.max(0.0001, volume * ajustes.volumeEfeitos);
        // entra suave e sai suave (sem estalos)
        ganho.gain.setValueAtTime(0.0001, t);
        ganho.gain.exponentialRampToValueAtTime(v, t + Math.min(0.08, duracao / 3));
        ganho.gain.exponentialRampToValueAtTime(0.0001, t + duracao);
        oscilador.connect(ganho).connect(contexto.destination);
        oscilador.start(t);
        oscilador.stop(t + duracao + 0.02);
      }
    } catch { /* sem áudio o jogo funciona igual */ }
  }
  const segredo = () => tocarCamadas([
    // zumbido grave de mistério
    [110, 0, 1.9, 'triangle', 0.09],
    [116.5, 0, 1.9, 'sine', 0.05],
    // escada de tons inteiros subindo
    [220, 0.10, 0.34, 'triangle', 0.08],
    [246.9, 0.32, 0.34, 'triangle', 0.08],
    [277.2, 0.54, 0.34, 'triangle', 0.08],
    [311.1, 0.76, 0.34, 'triangle', 0.08],
    [349.2, 0.98, 0.34, 'triangle', 0.08],
    [392.0, 1.20, 0.40, 'triangle', 0.08],
    // o segredo abre: acorde brilhante
    [440, 1.55, 1.6, 'sine', 0.07],
    [554.4, 1.55, 1.6, 'sine', 0.06],
    [659.3, 1.55, 1.6, 'sine', 0.06],
    [830.6, 1.60, 1.5, 'sine', 0.05],
    // sininhos
    [1760, 1.62, 0.5, 'sine', 0.04],
    [2217, 1.78, 0.5, 'sine', 0.035],
    [2637, 1.94, 0.6, 'sine', 0.03],
    [3520, 2.10, 0.7, 'sine', 0.025],
  ]);

  /* ---------------- música ---------------- */

  let musica = null;      // <audio>, criado só quando a música for tocar
  let ganhoMusica = null; // volume da música pelo Web Audio (pelo site)

  /* O volume da barrinha segue uma curva (o ouvido percebe volume
     assim): perto do mínimo a música fica bem baixinha e no zero some.
     Pelo site, a música passa pelo Web Audio: é o único jeito de o
     iPhone respeitar o volume escolhido (ele ignora o volume do
     <audio>). Aberto com dois cliques (file://) o navegador não deixa
     ligar a música ao Web Audio; aí vale o volume do <audio>. */
  const curvaVolume = v => v * v;

  function ligarMusicaAoWebAudio() {
    if (ganhoMusica || location.protocol === 'file:') return;
    const Contexto = window.AudioContext || window.webkitAudioContext;
    if (!Contexto) return;
    try {
      contexto = contexto || new Contexto();
      const fonte = contexto.createMediaElementSource(musica);
      ganhoMusica = contexto.createGain();
      fonte.connect(ganhoMusica).connect(contexto.destination);
    } catch { ganhoMusica = null; }
  }

  function aplicarVolumeMusica() {
    if (!musica) return;
    const v = curvaVolume(ajustes.volumeMusica);
    if (ganhoMusica) {
      musica.volume = 1;
      ganhoMusica.gain.value = v;
    } else {
      musica.volume = v;
    }
  }

  function tocarMusica() {
    if (!ajustes.musica || document.hidden) return;
    if (!musica) {
      musica = new Audio(ARQUIVO_MUSICA);
      musica.loop = true;
      musica.preload = 'auto';
      ligarMusicaAoWebAudio();
    }
    if (contexto && contexto.state === 'suspended') contexto.resume();
    aplicarVolumeMusica();
    // play() recusado (antes do primeiro toque): tenta de novo no próximo
    const tentativa = musica.play();
    if (tentativa) tentativa.catch(() => {});
  }

  function pausarMusica() {
    if (musica) musica.pause();
  }

  // o primeiro toque, clique ou tecla destrava o som
  ['pointerdown', 'keydown'].forEach(tipo =>
    document.addEventListener(tipo, () => {
      if (ajustes.musica && (!musica || musica.paused)) tocarMusica();
      lerEfeitos();
    }, { capture: true }));

  // aba escondida (outra aba, celular bloqueado): a música espera
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pausarMusica();
    else tocarMusica();
  });

  /* ---------------- painel de configurações (#sons) ----------------
     Os controles estão no index.html (#sons); se a página não os
     tiver (o editor), nada aqui é ligado. */

  function ligarMenu() {
    const painel = document.querySelector('#sons');
    if (!painel) return;
    const btnMusica  = painel.querySelector('#somMusica');
    const btnEfeitos = painel.querySelector('#somEfeitos');
    const volMusica  = painel.querySelector('#volMusica');
    const volEfeitos = painel.querySelector('#volEfeitos');

    function atualizar() {
      btnMusica.textContent = ajustes.musica ? 'Ligada' : 'Desligada';
      btnMusica.setAttribute('aria-pressed', String(ajustes.musica));
      btnMusica.classList.toggle('mudo', !ajustes.musica);
      btnEfeitos.textContent = ligado ? 'Ligados' : 'Desligados';
      btnEfeitos.setAttribute('aria-pressed', String(ligado));
      btnEfeitos.classList.toggle('mudo', !ligado);
      volMusica.value = Math.round(ajustes.volumeMusica * 100);
      volEfeitos.value = Math.round(ajustes.volumeEfeitos * 100);
      volMusica.disabled = !ajustes.musica;
      volEfeitos.disabled = !ligado;
      atualizarBotoes();
    }

    btnMusica.addEventListener('click', () => {
      ajustes.musica = !ajustes.musica;
      if (ajustes.musica) tocarMusica(); else pausarMusica();
      gravarPreferencia(); atualizar();
    });
    btnEfeitos.addEventListener('click', () => {
      ligado = !ligado;
      gravarPreferencia(); atualizar();
      if (ligado) acerto();
    });
    volMusica.addEventListener('input', () => {
      ajustes.volumeMusica = volMusica.value / 100;
      aplicarVolumeMusica();
      gravarPreferencia();
    });
    volEfeitos.addEventListener('change', () => acerto());   // ouvir o volume escolhido
    volEfeitos.addEventListener('input', () => {
      ajustes.volumeEfeitos = volEfeitos.value / 100;
      gravarPreferencia();
    });
    atualizar();
  }

  /* ---------------- botões de ligar/desligar ---------------- */

  /* Recebe um <button> e cuida dele por inteiro: rótulo, estado e
     clique. Pode haver mais de um (o do menu e o da fase): todos
     mudam juntos. Com comTexto, é o botão "Configurações" do menu:
     ele só abre o painel e o texto fica fixo. */
  const botoes = [];

  function atualizarBotoes() {
    for (const { botao, comTexto, icone } of botoes) {
      if (icone) {
        // atalho de qualquer tela: abre o painel; riscado se tudo mudo
        botao.classList.toggle('mudo', !(ligado || ajustes.musica));
        continue;
      }
      botao.classList.toggle('mudo', !ligado);
      botao.setAttribute('aria-pressed', String(ligado));
      const rotulo = ligado ? 'Desligar o som' : 'Ligar o som';
      if (comTexto) {
        botao.removeAttribute('aria-pressed');
        botao.textContent = 'Configurações';
      } else {
        botao.setAttribute('aria-label', rotulo);
        botao.title = rotulo;
      }
    }
  }

  function ligarBotao(botao, comTexto = false) {
    if (!botao) return;
    botoes.push({ botao, comTexto });
    botao.addEventListener('click', () => {
      ligado = !ligado;
      gravarPreferencia();
      atualizarBotoes();
      if (ligado) acerto();        // confirma a escolha com o próprio som
    });
    atualizarBotoes();
  }

  /* O botão "Configurações" do menu abre o painel de ajustes (sons e
     tela cheia). */
  // icone = true: o botão mostra só o alto-falante (o atalho do topo)
  function abrirMenuBotao(botao, icone = false) {
    if (!botao) return;
    botoes.push({ botao, comTexto: !icone, icone });
    botao.addEventListener('click', () => document.querySelector('#sons').classList.add('on'));
    atualizarBotoes();
  }

  ligarMenu();

  window.Som = {
    acerto, erro, vitoria, clique, segredo,
    promocao, festa, selo, figurinha, dica, quadro, cartaVolta, certificado, selecaoAgente, cartaVai,
    ligarBotao, abrirMenuBotao,
  };

})();
