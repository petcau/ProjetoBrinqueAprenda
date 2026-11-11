/* Gerenciador central de trilhas musicais (Ilha do Conhecimento).
   Suporta música por lugar (menu, ilha/exploração, vila, fazenda, geometria, labirinto),
   crossfade suave de ~1,2s, loop contínuo e sincronização em tempo real de volume e mudo. */
window.Music = (() => {
  'use strict';

  const MUSIC_GANHO_MESTRE = 0.8;
  const LOOP_MODO = 'nativo'; // Loop nativo (audio.loop = true) com suporte resiliente
  const FAIXA_CENA_CHAVE = 'labirinto'; // Câmara da chave mantém a música do labirinto
  const CROSSFADE_MS = 1200; // Troca de lugar: crossfade suave de cerca de 1,2 s
  const FADEOUT_SAIDA_MS = 600; // Saída completa de cena: fade-out suave de 600 ms

  // Registro de todas as faixas de áudio disponíveis (.ogg principal, .mp3 reserva)
  const FAIXAS = {
    menu: {
      arquivos: ['assets/audio/musica-menu.ogg', 'assets/audio/musica-menu.mp3'],
      ganho: 1.0
    },
    vila: {
      arquivos: ['assets/audio/musica-vila.ogg', 'assets/audio/musica-vila.mp3'],
      ganho: 1.0
    },
    fazenda: {
      arquivos: ['assets/audio/musica-fazenda.ogg', 'assets/audio/musica-fazenda.mp3'],
      ganho: 1.0
    },
    exploracao: {
      arquivos: ['assets/audio/musica-exploracao.ogg', 'assets/audio/musica-exploracao.mp3'],
      ganho: 1.0
    },
    geometria: {
      arquivos: ['assets/audio/musica-geometria.ogg', 'assets/audio/musica-geometria.mp3'],
      ganho: 1.0
    },
    labirinto: {
      arquivos: ['assets/audio/musica-labirinto.ogg', 'assets/audio/musica-labirinto.mp3'],
      ganho: 1.0
    },
    final: {
      arquivos: ['assets/audio/musica-final.ogg', 'assets/audio/musica-final.mp3'],
      ganho: 1.0
    }
  };

  // Mapeamento das situações do jogo para a faixa correspondente:
  // 1. Menu principal / introdução
  // 2. Mapa da ilha (exploração contínua em qualquer região)
  // 3. Puzzles (durante a gameplay de cada desafio)
  // 4. Final do jogo (resgate do gato, história final e encerramento)
  const CENAS = {
    // 1. Menu inicial e introdução
    menu: 'menu',
    home: 'menu',
    intro: 'menu',
    'tela-inicial': 'menu',

    // 2. Mapa da ilha (toda e qualquer exploração)
    ilha: 'exploracao',
    exploracao: 'exploracao',
    mapa: 'exploracao',

    // 3. Puzzles (apenas dentro da atividade)
    algebra: 'vila',
    operacoes: 'fazenda',
    geometria: 'geometria',
    labirinto: 'labirinto',
    logica: 'labirinto',
    camara: FAIXA_CENA_CHAVE,
    montanha: 'exploracao',

    // 4. Final do jogo (resgate do gato, história final e encerramento)
    final: 'final',
    encerramento: 'final'
  };

  const audios = {}; // faixaId -> HTMLAudioElement (instância única reutilizada)
  const saindoAudios = new Set(); // Elementos em processo de fade-out de saída

  // Controle de fade por elemento de áudio
  const fadeStates = new Map(); // audio -> { token, startVol, targetVol, startTime, durationMs, onEnd }
  let fadeTokenCounter = 0;
  let fadeRaf = null;

  let lugarAtual = null;
  let faixaAtualId = null;
  let elementoAtual = null;

  let aguardandoGesto = false;
  let gestoArmado = false;
  let gestoHandler = null;
  const gestoOpts = { capture: true, passive: true };

  let settingsRegistrado = false;

  function isCalm() {
    return Boolean(window.GameSettings?.calm) ||
      (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function mapearLugarParaFaixa(lugarId) {
    if (!lugarId) return null;
    if (CENAS[lugarId]) return CENAS[lugarId];
    if (FAIXAS[lugarId]) return lugarId;
    return 'exploracao'; // fallback seguro para qualquer região da ilha
  }

  function escolherArquivo(arquivos) {
    if (typeof Audio === 'undefined') return arquivos[0];
    try {
      const probe = new Audio();
      if (probe.canPlayType) {
        const ogg = probe.canPlayType('audio/ogg; codecs="opus"') || probe.canPlayType('audio/ogg');
        if (ogg === 'probably' || ogg === 'maybe') {
          const oggSrc = arquivos.find(a => a.endsWith('.ogg'));
          if (oggSrc) return oggSrc;
        }
        const mp3 = probe.canPlayType('audio/mpeg');
        if (mp3 === 'probably' || mp3 === 'maybe') {
          const mp3Src = arquivos.find(a => a.endsWith('.mp3'));
          if (mp3Src) return mp3Src;
        }
      }
    } catch (_) {}
    return arquivos[0];
  }

  function obterAudio(faixaId) {
    if (audios[faixaId]) return audios[faixaId];
    const config = FAIXAS[faixaId];
    if (!config || !config.arquivos || !config.arquivos.length) return null;
    if (typeof Audio === 'undefined') return null;

    try {
      const audio = new Audio();
      audio.loop = (LOOP_MODO === 'nativo');
      audio.preload = 'auto';
      audio.src = escolherArquivo(config.arquivos);
      audio.onerror = () => {
        // Tenta fallback para mp3 se ogg falhou
        if (audio.src && audio.src.endsWith('.ogg')) {
          const mp3 = config.arquivos.find(a => a.endsWith('.mp3'));
          if (mp3 && !audio.src.endsWith('.mp3')) {
            audio.src = mp3;
            audio.load();
            return;
          }
        }
        console.warn(`[Music] Não foi possível carregar a música da faixa '${faixaId}'.`);
      };
      audios[faixaId] = audio;
      return audio;
    } catch (e) {
      console.warn(`[Music] Falha ao criar áudio para '${faixaId}':`, e);
      return null;
    }
  }

  function calcularVolume(faixaId, overrideMusicVol, overrideMute) {
    const config = FAIXAS[faixaId];
    const ganhoFaixa = config?.ganho ?? 1.0;
    const isMuted = (overrideMute !== undefined)
      ? Boolean(overrideMute)
      : Boolean(typeof window.GameSettings?.get === 'function' ? window.GameSettings.get('mute') : false);
    const rawMusicVol = (overrideMusicVol !== undefined)
      ? overrideMusicVol
      : (typeof window.GameSettings?.get === 'function' ? window.GameSettings.get('music') : 35);
    const musicVol = Number.isFinite(Number(rawMusicVol)) ? Number(rawMusicVol) : 35;
    return Math.max(0, Math.min(1, (musicVol / 100) * (isMuted ? 0 : 1) * MUSIC_GANHO_MESTRE * ganhoFaixa));
  }

  function atualizarLoopFades(now) {
    if (fadeStates.size === 0) {
      fadeRaf = null;
      return;
    }

    const concluídos = [];
    for (const [audio, state] of fadeStates.entries()) {
      const elapsed = now - state.startTime;
      const progress = state.durationMs <= 0 ? 1 : Math.min(1, elapsed / state.durationMs);
      const curVol = state.startVol + (state.targetVol - state.startVol) * progress;
      audio.volume = Math.max(0, Math.min(1, curVol));

      if (progress >= 1) {
        audio.volume = state.targetVol;
        concluídos.push({ audio, token: state.token, onEnd: state.onEnd });
      }
    }

    for (const item of concluídos) {
      // Se não foi substituído por outro fade mais recente
      const cur = fadeStates.get(item.audio);
      if (cur && cur.token === item.token) {
        fadeStates.delete(item.audio);
        if (typeof item.onEnd === 'function') {
          try { item.onEnd(); } catch (_) {}
        }
      }
    }

    if (fadeStates.size > 0) {
      fadeRaf = requestAnimationFrame(atualizarLoopFades);
    } else {
      fadeRaf = null;
    }
  }

  function iniciarFade(audio, fromVol, toVol, duracaoMs, onEnd, customToken) {
    if (!audio) {
      if (typeof onEnd === 'function') onEnd();
      return ++fadeTokenCounter;
    }

    const token = customToken !== undefined ? customToken : ++fadeTokenCounter;
    const targetVol = Math.max(0, Math.min(1, toVol));

    if (duracaoMs <= 0) {
      fadeStates.delete(audio);
      audio.volume = targetVol;
      if (typeof onEnd === 'function') onEnd();
      return token;
    }

    const startVol = Math.max(0, Math.min(1, fromVol));
    const startTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());

    fadeStates.set(audio, {
      token,
      startVol,
      targetVol,
      startTime,
      durationMs: duracaoMs,
      onEnd
    });

    if (!fadeRaf) {
      fadeRaf = requestAnimationFrame(atualizarLoopFades);
    }

    return token;
  }

  function cancelarFade(audio) {
    if (audio) {
      fadeStates.delete(audio);
    } else {
      fadeStates.clear();
      if (fadeRaf) {
        cancelAnimationFrame(fadeRaf);
        fadeRaf = null;
      }
    }
  }

  function desarmarGesto() {
    if (!gestoArmado || !gestoHandler) return;
    window.removeEventListener('pointerdown', gestoHandler, gestoOpts);
    window.removeEventListener('keydown', gestoHandler, gestoOpts);
    window.removeEventListener('touchstart', gestoHandler, gestoOpts);
    gestoArmado = false;
    gestoHandler = null;
    aguardandoGesto = false;
  }

  function armarGesto() {
    if (gestoArmado) return;
    gestoArmado = true;
    gestoHandler = function onGesture() {
      if (aguardandoGesto && lugarAtual && elementoAtual) {
        aguardandoGesto = false;
        elementoAtual.play().then(() => {
          const target = calcularVolume(faixaAtualId);
          iniciarFade(elementoAtual, elementoAtual.volume, target, 800);
        }).catch(() => {});
      }
      desarmarGesto();
    };
    window.addEventListener('pointerdown', gestoHandler, gestoOpts);
    window.addEventListener('keydown', gestoHandler, gestoOpts);
    window.addEventListener('touchstart', gestoHandler, gestoOpts);
  }

  function tentarRegistrarSettings() {
    if (settingsRegistrado) return true;
    if (typeof window !== 'undefined' && window.GameSettings && typeof window.GameSettings.onChange === 'function') {
      try {
        window.GameSettings.onChange((key) => {
          if (key === 'music' || key === 'mute' || key === 'calm') {
            atualizarVolume();
          }
        });
        settingsRegistrado = true;
        return true;
      } catch (_) {}
    }
    return false;
  }

  /**
   * Define o lugar onde o herói está, trocando a música com crossfade suave (~1,2s).
   * Se o novo lugar utilizar a MESMA faixa já ativa, mantém contínua sem reiniciar.
   */
  function definirLugar(lugarId, options = {}) {
    tentarRegistrarSettings();

    if (!lugarId) {
      sairDaCena();
      return;
    }

    const faixaId = mapearLugarParaFaixa(lugarId);
    if (!faixaId || !FAIXAS[faixaId]) return;

    lugarAtual = lugarId;

    // Se já estiver na mesma faixa ativa e ela não estiver pausada nem saindo, mantém contínua
    if (faixaAtualId === faixaId && elementoAtual && !elementoAtual.paused && !saindoAudios.has(elementoAtual)) {
      return;
    }

    const audioAntigo = elementoAtual;
    const duracaoCrossfade = Number.isFinite(options.duracaoMs) ? options.duracaoMs : CROSSFADE_MS;

    faixaAtualId = faixaId;
    const novoAudio = obterAudio(faixaId);
    elementoAtual = novoAudio;

    if (!novoAudio) return;

    // Para música sintetizada de teste se estiver ligada
    window.GameAudio?.stopMusic?.();

    // Se geometria estiver tocando via GameAudio isolado, para
    if (faixaId !== 'geometria' && window.GameAudio?.isGeometryMusicPlaying?.()) {
      window.GameAudio?.stopGeometryMusic?.();
    }

    desarmarGesto();

    // 1. Fade-out suave da faixa anterior (se for diferente da nova)
    if (audioAntigo && audioAntigo !== novoAudio && !audioAntigo.paused) {
      saindoAudios.add(audioAntigo);
      const tokenAntigo = ++fadeTokenCounter;
      iniciarFade(audioAntigo, audioAntigo.volume, 0, duracaoCrossfade, () => {
        if (saindoAudios.has(audioAntigo)) {
          saindoAudios.delete(audioAntigo);
          try {
            audioAntigo.pause();
            audioAntigo.currentTime = 0;
          } catch (_) {}
        }
      }, tokenAntigo);
    }

    // 2. Prepara e inicia a nova faixa com fade-in suave
    saindoAudios.delete(novoAudio);
    try {
      novoAudio.currentTime = 0;
    } catch (_) {}

    const targetVol = calcularVolume(faixaId);
    novoAudio.volume = 0;

    const playToken = ++fadeTokenCounter;
    const playPromise = novoAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        if (playToken === fadeTokenCounter && lugarAtual) {
          aguardandoGesto = true;
          armarGesto();
        }
      });
    }

    iniciarFade(novoAudio, 0, targetVol, duracaoCrossfade, null, playToken);
  }

  // Compatibilidade com a API anterior entrarNaCena / sairDaCena
  function entrarNaCena(nome) {
    if (!nome) return;
    definirLugar(nome, { duracaoMs: 800 });
  }

  function sairDaCena(nome) {
    tentarRegistrarSettings();
    if (nome && nome !== lugarAtual && nome !== faixaAtualId && CENAS[nome] !== faixaAtualId) {
      return;
    }

    lugarAtual = null;
    desarmarGesto();

    const audio = elementoAtual;
    if (!audio) {
      faixaAtualId = null;
      return;
    }

    const startVol = audio.volume;
    saindoAudios.add(audio);
    const duracao = isCalm() ? 0 : FADEOUT_SAIDA_MS;
    const tokenSaida = ++fadeTokenCounter;
    iniciarFade(audio, startVol, 0, duracao, () => {
      if (saindoAudios.has(audio)) {
        saindoAudios.delete(audio);
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch (_) {}
        if (elementoAtual === audio) {
          elementoAtual = null;
          faixaAtualId = null;
        }
      }
    }, tokenSaida);
  }

  function atualizarVolume(overrideMusicVol, overrideMute) {
    tentarRegistrarSettings();
    if (!elementoAtual || !faixaAtualId) return;
    const targetVol = calcularVolume(faixaAtualId, overrideMusicVol, overrideMute);
    const state = fadeStates.get(elementoAtual);
    if (state && lugarAtual !== null) {
      state.targetVol = targetVol;
    } else {
      elementoAtual.volume = targetVol;
    }
  }

  function precarregarFaixa(faixaId) {
    const audio = obterAudio(faixaId);
    if (audio && typeof audio.load === 'function') {
      try { audio.load(); } catch (_) {}
    }
  }

  function precarregarCena(nome) {
    const faixaId = mapearLugarParaFaixa(nome);
    if (faixaId) precarregarFaixa(faixaId);
  }

  // Pausa ao ocultar a aba e retoma suavemente ao voltar
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (elementoAtual && !elementoAtual.paused) {
          elementoAtual.pause();
        }
      } else {
        if (lugarAtual && elementoAtual && elementoAtual.paused) {
          elementoAtual.play().then(() => {
            const target = calcularVolume(faixaAtualId);
            iniciarFade(elementoAtual, elementoAtual.volume, target, 400);
          }).catch(() => {
            aguardandoGesto = true;
            armarGesto();
          });
        }
      }
    });

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', tentarRegistrarSettings, { once: true });
    } else {
      tentarRegistrarSettings();
    }
  }

  return {
    definirLugar,
    entrarNaCena,
    sairDaCena,
    atualizarVolume,
    precarregarFaixa,
    precarregarCena,
    isTocando: () => Boolean(elementoAtual && !elementoAtual.paused),
    getCenaAtual: () => lugarAtual,
    getLugarAtual: () => lugarAtual,
    getFaixaAtual: () => faixaAtualId,
    mapearLugarParaFaixa,
    CROSSFADE_MS,
    FAIXAS,
    CENAS,
    FAIXA_CENA_CHAVE,
    LOOP_MODO,
    MUSIC_GANHO_MESTRE
  };
})();
