/* Gerenciamento de áudio: sintetizador de efeitos e trilhas sonoras locais. */
window.GameAudio = (() => {
  'use strict';

  let context, effectsGain, musicGain, musicTimer;
  let soundVolume = 70, musicVolume = 35, enabled = false, noteIndex = 0;
  const melody = [261.63,329.63,392,329.63,293.66,349.23,440,349.23,261.63,329.63,392,523.25,440,392,329.63,293.66];

  /* ---------- Efeitos Sintetizados (Web Audio API) ---------- */
  function prepare() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;
    if (!context) {
      context = new AudioCtx();
      effectsGain = context.createGain();
      musicGain = context.createGain();
      effectsGain.connect(context.destination);
      musicGain.connect(context.destination);
      setVolumes(soundVolume, musicVolume);
    }
    if (context.state === 'suspended') context.resume().catch(() => {});
    return true;
  }

  function tone(frequency, duration, gain, type = 'sine') {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    const now = context.currentTime;
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(.45, now + .025);
    envelope.gain.exponentialRampToValueAtTime(.001, now + duration);
    oscillator.connect(envelope);
    envelope.connect(gain);
    oscillator.start(now);
    oscillator.stop(now + duration + .02);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
  }

  function click() { if (prepare()) tone(660, .09, effectsGain, 'triangle'); }
  function success() {
    if (prepare()) {
      tone(523.25, .25, effectsGain);
      setTimeout(() => tone(783.99, .3, effectsGain), 110);
    }
  }

  function page() {
    if (!prepare()) return;
    const length = Math.floor(context.sampleRate * .32);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / length);
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    const now = context.currentTime;
    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.Q.value = .9;
    filter.frequency.setValueAtTime(2600, now);
    filter.frequency.exponentialRampToValueAtTime(700, now + .3);
    envelope.gain.value = .55;
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(effectsGain);
    source.start(now);
    source.onended = () => { source.disconnect(); filter.disconnect(); envelope.disconnect(); };
  }

  function toggle(on) {
    if (!prepare()) return;
    tone(on ? 440 : 587.33, .07, effectsGain, 'triangle');
    setTimeout(() => { if (context) tone(on ? 659.25 : 370, .09, effectsGain, 'triangle'); }, 50);
  }

  function nextNote() {
    if (!enabled || !context) return;
    tone(melody[noteIndex], .28, musicGain, 'sine');
    noteIndex = (noteIndex + 1) % melody.length;
    musicTimer = setTimeout(nextNote, 320);
  }

  function toggleMusic() {
    if (geometryActive || window.Music?.isTocando?.()) return false; // Não sobrepor música em execução
    if (!prepare()) return false;
    enabled = !enabled;
    clearTimeout(musicTimer);
    setVolumes(soundVolume, musicVolume);
    if (enabled) nextNote();
    return enabled;
  }

  function stopMusic() {
    enabled = false;
    clearTimeout(musicTimer);
    if (context) {
      musicGain.gain.setTargetAtTime(0, context.currentTime, .06);
    }
  }

  /* ---------- Música de Geometria (HTMLAudioElement) ---------- */
  let geometryAudio = null;
  let geometryActive = false;
  let geometryFading = false;
  let geometryFadeRaf = null;
  let geometryPendingPlay = false;
  let geometryTargetVolume = 0.35;
  let gestureArmed = false;
  let gestureHandler = null;
  const gestureOpts = { capture: true, passive: true };

  function chooseGeometrySrc() {
    if (typeof Audio === 'undefined') return 'assets/audio/musica-geometria.ogg';
    try {
      const probe = new Audio();
      if (probe.canPlayType) {
        const ogg = probe.canPlayType('audio/ogg; codecs="opus"') || probe.canPlayType('audio/ogg');
        if (ogg === 'probably' || ogg === 'maybe') return 'assets/audio/musica-geometria.ogg';
        const mp3 = probe.canPlayType('audio/mpeg');
        if (mp3 === 'probably' || mp3 === 'maybe') return 'assets/audio/musica-geometria.mp3';
      }
    } catch (_) {}
    return 'assets/audio/musica-geometria.ogg';
  }

  function initGeometryAudio() {
    if (geometryAudio || typeof Audio === 'undefined') return geometryAudio;
    try {
      geometryAudio = new Audio();
      geometryAudio.loop = true;
      geometryAudio.preload = 'auto';
      geometryAudio.src = chooseGeometrySrc();
      geometryAudio.onerror = () => {
        if (geometryAudio.src && geometryAudio.src.endsWith('.ogg')) {
          geometryAudio.src = 'assets/audio/musica-geometria.mp3';
          geometryAudio.load();
        } else {
          console.warn('[GameAudio] Não foi possível carregar a música de Geometria.');
        }
      };
    } catch (e) {
      console.warn('[GameAudio] Falha ao instanciar áudio de Geometria:', e);
    }
    return geometryAudio;
  }

  function isCalm() {
    return Boolean(window.GameSettings?.calm) ||
      (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function cancelGeometryFade() {
    if (geometryFadeRaf) {
      cancelAnimationFrame(geometryFadeRaf);
      geometryFadeRaf = null;
    }
    geometryFading = false;
  }

  function fadeGeometryVolume(fromVol, toVol, durationSec, onEnd) {
    cancelGeometryFade();
    if (!geometryAudio) { if (onEnd) onEnd(); return; }

    geometryTargetVolume = Math.max(0, Math.min(1, toVol));
    if (durationSec <= 0 || isCalm()) {
      geometryAudio.volume = geometryTargetVolume;
      if (onEnd) onEnd();
      return;
    }

    geometryFading = true;
    const startTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const durationMs = durationSec * 1000;
    const startVol = Math.max(0, Math.min(1, fromVol));

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const curVol = startVol + (geometryTargetVolume - startVol) * progress;
      if (geometryAudio) {
        geometryAudio.volume = Math.max(0, Math.min(1, curVol));
      }
      if (progress < 1 && geometryFading) {
        geometryFadeRaf = requestAnimationFrame(step);
      } else {
        geometryFading = false;
        geometryFadeRaf = null;
        if (geometryAudio) geometryAudio.volume = geometryTargetVolume;
        if (onEnd) onEnd();
      }
    }
    geometryFadeRaf = requestAnimationFrame(step);
  }

  function disarmPendingGesture() {
    if (!gestureArmed || !gestureHandler) return;
    window.removeEventListener('pointerdown', gestureHandler, gestureOpts);
    window.removeEventListener('keydown', gestureHandler, gestureOpts);
    window.removeEventListener('touchstart', gestureHandler, gestureOpts);
    gestureArmed = false;
    gestureHandler = null;
  }

  function armPendingGesture() {
    if (gestureArmed) return;
    gestureArmed = true;
    gestureHandler = function onGesture() {
      if (geometryPendingPlay && geometryActive && geometryAudio) {
        geometryPendingPlay = false;
        geometryAudio.play().then(() => {
          const targetVol = Math.max(0, Math.min(1, musicVolume / 100));
          fadeGeometryVolume(geometryAudio.volume, targetVol, 1.0);
        }).catch(() => {});
      }
      disarmPendingGesture();
    };
    window.addEventListener('pointerdown', gestureHandler, gestureOpts);
    window.addEventListener('keydown', gestureHandler, gestureOpts);
    window.addEventListener('touchstart', gestureHandler, gestureOpts);
  }

  /* Ponto de extensão para música tema (conforme regra de convivência) */
  let themeMusicHandle = null;
  function pauseThemeMusic(fadeSec = 0.5) {
    if (themeMusicHandle && typeof themeMusicHandle.pause === 'function') {
      themeMusicHandle.pause(fadeSec);
    }
  }
  function resumeThemeMusic(fadeSec = 0.5) {
    if (themeMusicHandle && typeof themeMusicHandle.resume === 'function') {
      themeMusicHandle.resume(fadeSec);
    }
  }
  function registerThemeMusic(handle) {
    themeMusicHandle = handle;
  }

  function playGeometryMusic() {
    if (geometryActive && geometryAudio && !geometryAudio.paused && !geometryFading) return;
    window.Music?.sairDaCena?.();
    geometryActive = true;
    geometryPendingPlay = false;

    // Se a música de teste sintetizada estiver ligada, para-a
    stopMusic();

    // Pausa a música tema se existir (fade curto de ~0,5 s)
    pauseThemeMusic(0.5);

    const audio = initGeometryAudio();
    if (!audio) return;

    cancelGeometryFade();

    try {
      audio.currentTime = 0;
    } catch (_) {}

    const targetVol = Math.max(0, Math.min(1, musicVolume / 100));
    audio.volume = 0;

    const promise = audio.play();
    if (promise !== undefined) {
      promise.catch(() => {
        if (geometryActive) {
          geometryPendingPlay = true;
          armPendingGesture();
        }
      });
    }

    fadeGeometryVolume(0, targetVol, 1.0);
  }

  function stopGeometryMusic() {
    geometryActive = false;
    geometryPendingPlay = false;
    disarmPendingGesture();

    if (!geometryAudio) {
      resumeThemeMusic(0.5);
      return;
    }

    const currentVol = geometryAudio.volume;
    fadeGeometryVolume(currentVol, 0, 0.7, () => {
      try {
        geometryAudio.pause();
        geometryAudio.currentTime = 0;
      } catch (_) {}
      resumeThemeMusic(0.5);
    });
  }

  function preloadGeometryMusic() {
    const audio = initGeometryAudio();
    if (audio && typeof audio.load === 'function') {
      try { audio.load(); } catch (_) {}
    }
  }

  /* Volume e mudo em tempo real */
  function setVolumes(sound, music) {
    soundVolume = sound;
    musicVolume = music;
    if (context) {
      effectsGain.gain.setTargetAtTime(sound / 100 * .16, context.currentTime, .03);
      musicGain.gain.setTargetAtTime(enabled ? music / 100 * .12 : 0, context.currentTime, .06);
    }
    const target = Math.max(0, Math.min(1, music / 100));
    geometryTargetVolume = target;
    if (geometryActive && geometryAudio) {
      if (geometryFading) {
        cancelGeometryFade();
      }
      geometryAudio.volume = target;
    }
    window.Music?.atualizarVolume?.();
  }

  /* Pausa quando a aba fica oculta e retoma ao voltar */
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (geometryActive && geometryAudio && !geometryAudio.paused) {
          geometryAudio.pause();
        }
      } else {
        if (geometryActive && geometryAudio) {
          geometryAudio.play().catch(() => {
            geometryPendingPlay = true;
            armPendingGesture();
          });
        }
      }
    });
  }

  return {
    click,
    success,
    page,
    toggle,
    setVolumes,
    toggleMusic,
    stopMusic,
    playGeometryMusic,
    stopGeometryMusic,
    preloadGeometryMusic,
    isGeometryMusicPlaying: () => geometryActive,
    pauseThemeMusic,
    resumeThemeMusic,
    registerThemeMusic
  };
})();
/* Áudio reutilizável com ciclo explícito: init no gesto, update no loop e dispose na saída.
   Mantém GameAudio intacto e preserva o construtor nativo window.Audio. */
window.IntroAudio = (() => {
  'use strict';
  // audio.js carrega antes de config.js: só lemos as constantes ao iniciar o áudio.
  let SONGS;
  function configure(){SONGS ||= {intro:{src:INTRO_MUSIC_SRC,volume:MUSIC_INTRO_VOL,step:MUSIC_INTRO_STEP_S,pattern:[69,0,72,0,70,0,0,75,69,0,76,0,72,70,0,0]},
    final:{src:FINAL_MUSIC_SRC,volume:MUSIC_FINAL_VOL,step:30/MUSIC_FINAL_BPM,chords:[[60,64,67,72],[57,60,64,69],[53,57,60,65],[53,56,60,65],[60,64,67,72],[55,59,62,67],[53,57,60,65],[60,64,67,72]],melody:[76,72,72,68,72,74,72,67]}};}
  const ARPEGGIO=[0,1,2,3,2,1,2,1],tracks=new Set();
  let ctx,music,effects,fx,current,lastSound=-1,lastMusic=-1;
  // MIDI para hertz: cada semitom multiplica a frequência por 2^(1/12).
  const hz=n=>440*2**((n-69)/12);
  function resume(){if(ctx?.state==='suspended'&&!document.hidden)ctx.resume().catch(()=>{});
    for(const t of tracks)if(t.media?.paused&&!t.stopping&&!document.hidden)t.media.play().then(()=>{if(!t.dead&&!t.stopping)t.synth.gain.value=0;}).catch(()=>{});}
  function visibility(){if(document.hidden){ctx?.suspend().catch(()=>{});for(const t of tracks)t.media?.pause();}else resume();}
  function syncVolumes(){if(!ctx)return;const get=window.GameSettings?.get,muted=Boolean(get?.('mute'));
    const sound=muted?0:Math.max(0,Math.min(100,get?.('sound')??70))/100,volume=muted?0:Math.max(0,Math.min(100,get?.('music')??35))/100;
    if(sound!==lastSound){effects.gain.setValueAtTime(sound,ctx.currentTime);lastSound=sound;}if(volume!==lastMusic){music.gain.setValueAtTime(volume,ctx.currentTime);lastMusic=volume;}}
  function init(){configure();if(ctx){resume();return;}const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;
    try{ctx=new Context();music=ctx.createGain();effects=ctx.createGain();music.connect(ctx.destination);effects.connect(ctx.destination);fx={synth:effects,notes:new Set()};
      document.addEventListener('visibilitychange',visibility);for(const key of ['pointerdown','keydown','touchstart'])document.addEventListener(key,resume,true);syncVolumes();resume();}catch{dispose();}}
  function tone(t,n,time,duration,gain,type='triangle',bus=t.synth,attack=.01,hold=false){const osc=ctx.createOscillator(),level=ctx.createGain(),entry={osc,level};
    osc.type=type;osc.frequency.value=hz(n);level.gain.setValueAtTime(0,time);level.gain.linearRampToValueAtTime(gain,time+attack);
    if(hold){level.gain.setValueAtTime(gain,time+duration-.03);level.gain.linearRampToValueAtTime(0,time+duration);}else level.gain.exponentialRampToValueAtTime(.0001,time+duration);
    osc.connect(level);level.connect(bus);t.notes.add(entry);osc.onended=()=>{osc.disconnect();level.disconnect();t.notes.delete(entry);};osc.start(time);osc.stop(time+duration);return entry;
  }
  function clearNotes(t){for(const e of [...t.notes]){e.osc.onended=null;try{e.osc.stop();}catch{}e.osc.disconnect();e.level.disconnect();}t.notes.clear();}
  function release(t){if(t.dead)return;t.dead=true;if(t.stopper){t.stopper.onended=null;try{t.stopper.stop();}catch{}t.stopper.disconnect();}
    if(t.media){t.media.oncanplay=t.media.onerror=null;t.media.pause();t.media.removeAttribute('src');t.media.load();}clearNotes(t);for(const node of t.nodes)node.disconnect();tracks.delete(t);if(current===t)current=null;}
  function fadeStop(t,ms){if(!t||t.dead||t.stopping)return;t.stopping=true;const now=ctx.currentTime,g=t.envelope.gain;
    if(g.cancelAndHoldAtTime)g.cancelAndHoldAtTime(now);else{g.cancelScheduledValues(now);g.setValueAtTime(g.value,now);}g.linearRampToValueAtTime(0,now+ms/1000);
    // Um oscilador silencioso e desconectado fornece o evento de limpeza sem timers.
    const stopper=t.stopper=ctx.createOscillator();stopper.onended=()=>release(t);stopper.start(now);stopper.stop(now+ms/1000);if(ms===0)release(t);
  }
  function tryFile(t){try{const player=t.media=new window.Audio();player.loop=true;player.preload='auto';const source=ctx.createMediaElementSource(player);source.connect(t.envelope);t.nodes.push(source);
      player.oncanplay=()=>{if(t.dead||t.stopping)return;player.play().then(()=>{if(!t.dead&&!t.stopping)t.synth.gain.value=0;}).catch(()=>{});};
      player.onerror=()=>{if(!t.dead){player.pause();t.synth.gain.value=1;}};player.src=SONGS[t.id].src;player.load();}catch{t.synth.gain.value=1;}}
  function playMusic(id){init();if(!ctx)return;
    // Compatibilidade: a intro atual passa null ou o caminho do MP3; ambos significam 'intro'.
    id=id==='final'||id===FINAL_MUSIC_SRC?'final':'intro';if(current?.id===id&&!current.stopping)return;
    for(const t of [...tracks])if(t!==current)release(t);fadeStop(current,600);
    const now=ctx.currentTime,t={id,envelope:ctx.createGain(),synth:ctx.createGain(),notes:new Set(),nodes:[],next:now,step:0,pulse:now,pad:now,stopping:false,dead:false};
    t.nodes.push(t.envelope,t.synth);t.synth.connect(t.envelope);t.envelope.connect(music);t.envelope.gain.setValueAtTime(0,now);t.envelope.gain.linearRampToValueAtTime(SONGS[id].volume,now+.8);
    if(id==='final'){const delay=ctx.createDelay(),feedback=ctx.createGain(),wet=ctx.createGain();delay.delayTime.value=.375;feedback.gain.value=.3;wet.gain.value=.25;
      t.synth.connect(delay);delay.connect(feedback);feedback.connect(delay);delay.connect(wet);wet.connect(t.envelope);t.nodes.push(delay,feedback,wet);}
    current=t;tracks.add(t);tryFile(t);
  }
  function stopMusic(ms=600){for(const t of tracks)fadeStop(t,Math.max(0,ms));}
  function piano(t,n,time,duration,gain){tone(t,n,time,duration,gain);tone(t,n+12,time,duration,gain*.35,'sine');}
  function scheduleIntro(t,end){const song=SONGS.intro;
    while(t.pad<end){for(const n of [45,51]){const p=tone(t,n,t.pad,song.step*16,.03,'sine',t.synth,.02,true);
        const lfo=tone(t,69,t.pad,song.step*16,.03*.4,'sine',p.level.gain,.02,true);lfo.osc.frequency.value=.15;}t.pad+=song.step*16;}
    while(t.pulse<end){const pulse=tone(t,69,t.pulse,.15,.08,'sine');pulse.osc.frequency.setValueAtTime(60,t.pulse);pulse.osc.frequency.exponentialRampToValueAtTime(40,t.pulse+.15);t.pulse+=1.1;}
    while(t.next<end){const n=song.pattern[t.step++%16];if(n){tone(t,n,t.next,1.2,.14,'sine',t.synth,.015).osc.detune.value=-8;tone(t,n,t.next,1.2,.14,'triangle',t.synth,.015).osc.detune.value=8;}t.next+=song.step;}
  }
  function scheduleFinal(t,end){const song=SONGS.final;
    while(t.next<end){const beat=t.step%8,bar=Math.floor(t.step/8)%8,chord=song.chords[bar];piano(t,chord[ARPEGGIO[beat]],t.next,.9,beat===0?.20:.14);
      if(beat===0){piano(t,song.melody[bar],t.next,song.step*8*.95,.12);tone(t,chord[0]-12,t.next,1.8,.10,'sine');}t.step++;t.next+=song.step;}
  }
  function update(dt){if(!ctx)return;syncVolumes();if(document.hidden||ctx.state!=='running')return;const now=ctx.currentTime;
    // Lookahead de 200 ms; o relógio Web Audio é amostrado a cada frame, sem setTimeout/setInterval.
    for(const t of tracks){if(t.stopping||t.dead||t.synth.gain.value===0)continue;t.next=Math.max(t.next,now);t.pad=Math.max(t.pad,now);t.pulse=Math.max(t.pulse,now);
      if(t.id==='intro')scheduleIntro(t,now+.2);else scheduleFinal(t,now+.2);}
  }
  function sfx(id){if(!ctx||document.hidden||current?.stopping)return;syncVolumes();const now=ctx.currentTime;
    if(id==='final'){for(const n of [60,64,67])tone(fx,n,now,.4,.08);}else{tone(fx,72,now,.15,.25);tone(fx,79,now+.1,.15,.25);}}
  function dispose(){document.removeEventListener('visibilitychange',visibility);for(const key of ['pointerdown','keydown','touchstart'])document.removeEventListener(key,resume,true);
    for(const t of [...tracks])release(t);if(fx)clearNotes(fx);music?.disconnect();effects?.disconnect();if(ctx&&ctx.state!=='closed')ctx.close().catch(()=>{});
    ctx=music=effects=fx=current=null;lastSound=lastMusic=-1;
  }
  return {init,playMusic,stopMusic,sfx,update,dispose};
})();
window.IlhaAudio = window.IntroAudio; // API pública de depuração; preserva window.Audio nativo.
