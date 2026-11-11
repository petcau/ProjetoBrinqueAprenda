(() => {
  'use strict';
  let context, menuGain, fxGain, sceneGain, meter, timer, currentScene, step = 0, next = 0, mode = 'silent', ready = false;
  const voices = new Set(), hz = n => 440 * 2 ** ((n - 69) / 12);
  function gains() {
    if (!context) return;
    const s = RR_SETTINGS.get();
    menuGain.gain.setTargetAtTime(s.menuVolume / 100 * .4, context.currentTime, .06);
    fxGain.gain.setTargetAtTime(s.sfxVolume / 100 * .45, context.currentTime, .02);
    sceneGain.gain.setTargetAtTime(s.musicVolume / 100 * .36, context.currentTime, .06);
  }
  async function unlock() {
    try {
      if (!context || context.state === 'closed') {
        context = new (window.AudioContext || window.webkitAudioContext)();
        menuGain = context.createGain(); fxGain = context.createGain();sceneGain=context.createGain();
        const comp = context.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 5;
        meter = context.createAnalyser(); meter.fftSize = 256;
        menuGain.connect(comp); fxGain.connect(comp);sceneGain.connect(comp); comp.connect(meter); meter.connect(context.destination); gains();
      }
      await context.resume(); ready = context.state === 'running';
      document.dispatchEvent(new CustomEvent('rr-audio-status', { detail: ready }));
      return ready;
    } catch { ready = false; return false; }
  }
  function note(midi, when, duration = .2, volume = .12, type = 'sine', bus = fxGain) {
    if (!context || !bus || context.state !== 'running') return;
    const osc = context.createOscillator(), gain = context.createGain();
    osc.type = type; osc.frequency.value = hz(midi);
    gain.gain.setValueAtTime(.0001, when); gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume), when + .014);
    gain.gain.exponentialRampToValueAtTime(.0001, when + duration);
    osc.connect(gain); gain.connect(bus); osc.start(when); osc.stop(when + duration + .02);
    voices.add(osc); osc.onended = () => { voices.delete(osc); osc.disconnect(); gain.disconnect(); };
  }
  function stop() { clearInterval(timer); timer = null; for (const v of voices) { try { v.stop(); } catch {} } voices.clear(); }
  function schedule() {
    if (!ready || document.hidden || mode === 'silent') return;
    // OrbitHop's original F# minor synth arpeggio: 78 BPM, unlike either stage.
    const beat = 60 / 78, melody = [78,81,85,88,85,81,80,76,76,80,83,88,83,80,78,76];
    while (next < context.currentTime + .18) {
      const chord = Math.floor(step / 16) % 4, root = [42,38,45,40][chord];
      if (next >= context.currentTime) {
        note(melody[step % melody.length], next, .48, .10, 'triangle', menuGain);
        note(melody[step % melody.length] + 12, next, .3, .018, 'sine', menuGain);
        if (step % 4 === 0) note(root, next, .75, .15, 'sine', menuGain);
        if (step % 16 === 0) [root+12,root+15,root+19,root+26].forEach(n => note(n,next,2.9,.024,'sine',menuGain));
        if (step % 4 === 2) note(91, next, .055, .035, 'triangle', menuGain);
      }
      step++; next += beat / 2;
    }
  }
  async function menu() { mode = 'menu'; if (!await unlock() || mode !== 'menu') return; if (timer) return; next = context.currentTime + .08; schedule(); timer = setInterval(schedule,35); }
  function silence() { mode = 'silent'; stop(); }
  const signature = { play: [73,80,85], tutorial: [76,78,83], options: [66,73,78], accessibility: [69,76,81], about: [71,75,82], back: [78,73,66] };
  async function cue(kind, action = 'click') {
    if (action === 'hover' && !ready) return;
    if (!await unlock()) return;
    const notes = signature[kind] || signature.options;
    if (action === 'hover') { note(notes[0]+12,context.currentTime,.075,.055,'sine'); return; }
    notes.forEach((n,i) => note(n,context.currentTime+i*.055,.22,.12, i===1?'triangle':'sine'));
  }
  function hit(lane, kind = 'perfect') {
    if (!context || !ready) return;
    note((kind === 'miss' ? [48,50,52,53] : [84,79,88,86])[lane], context.currentTime, kind === 'miss' ? .13 : .2, .10, kind === 'miss' ? 'triangle' : 'sine');
  }
  function portal(stage) {
    if (!context || !ready) return;
    const melody = stage === 2 ? [78,77,73,66] : stage === 3 ? [76,72,67] : [66,73,78,85,90];
    melody.forEach((n,i)=>note(n,context.currentTime+i*.13,.65,.13,'triangle'));
  }
  function cheer(){if(!context||!ready)return;[79,83,86,91].forEach((n,i)=>note(n,context.currentTime+i*.09,.28,.10,'sine'));}
  function story(index){
    if(!context||!ready)return;
    if([1,2,3,4,5].includes(index))portal(index===2?2:1);
    else if(index===6){note(48,context.currentTime,.22,.13,'sine');note(76,context.currentTime+.15,.35,.07,'triangle');}
    else if(index===8)cheer();
    else [66,73,78].forEach((n,i)=>note(n,context.currentTime+i*.12,1.4,.04,'triangle'));
    if([3,4,5].includes(index)){
      const osc=context.createOscillator(),gain=context.createGain(),now=context.currentTime;
      osc.type='sine';osc.frequency.setValueAtTime(index===5?620:120,now);osc.frequency.exponentialRampToValueAtTime(index===5?90:700,now+1.2);
      gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.08,now+.35);gain.gain.exponentialRampToValueAtTime(.0001,now+1.4);
      osc.connect(gain);gain.connect(fxGain);osc.start(now);osc.stop(now+1.45);voices.add(osc);osc.onended=()=>{voices.delete(osc);osc.disconnect();gain.disconnect();};
    }
  }
  function scene(motion){
    if(motion==='credits' && currentScene==='encore' && timer)return;
    silence();
    if(!context||!ready)return;
    currentScene=motion;
    const now=context.currentTime;
    sceneMusic(motion);
    if(motion==='show'){
      cheer();
      const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*.075),context.sampleRate);
      const samples=buffer.getChannelData(0);
      let seed=7919;
      for(let i=0;i<samples.length;i++){seed=seed*16807%2147483647;samples[i]=seed/1073741823.5-1;}
      for(let i=0;i<24;i++){
        const clap=context.createBufferSource(),gain=context.createGain(),at=now+i*.105;
        clap.buffer=buffer;gain.gain.setValueAtTime(.012+(i%3)*.004,at);gain.gain.exponentialRampToValueAtTime(.0001,at+.07);
        clap.connect(gain);gain.connect(fxGain);clap.start(at);voices.add(clap);
        clap.onended=()=>{voices.delete(clap);clap.disconnect();gain.disconnect();};
      }
    }else if(['guitar','surge','levitate',3].includes(motion)){
      const cluster=motion==='guitar'?[66,66.3,73,72.6]:[54,54.4,61,60.7,68];
      cluster.forEach((midi,i)=>note(midi,now+i*.32,.65,.045,'triangle'));
      if(motion==='levitate'||motion===3)portal(2);
    }else if(motion===5){portal(2);note(48,now+1,.35,.05,'sine');}
    else if(motion===6){note(48,now,.22,.09,'sine');note(76,now+.15,.35,.05,'triangle');}
    else if(motion===8)cheer();
    else if(motion===4||motion==='cross'||motion==='return')portal(1);
    else if(motion==='tempus'){
      [54,61,66,69,73,76,78,81,85,90].forEach((pitch,i)=>note(pitch,now+i*.19,1.05,.10,'triangle'));
      note(42,now+1.9,2,.14,'sine');portal(1);
    }
    else if(motion==='encore'){cheer();portal(1);}
    else if(['walk','exit','backstage','ruins'].includes(motion)){
      for(let i=0;i<7;i++)note(41+i%2*3,now+i*.47,.11,.045,'triangle');
    }
    else [54,61,66].forEach((midi,i)=>note(midi,now+i*.2,2.2,.022,'sine'));
  }
  function sceneMusic(motion) {
    const concert=['encore','credits'].includes(motion),final=['charge','tempus'].includes(motion);
    const danger=['guitar','surge','levitate','ruins','confront','memory',3].includes(motion);
    const melody=concert?[74,78,81,86,83,81,78,76,74,81,83,86,88,86,81,78]
      :final?[66,69,73,76,78,81,85,88,90,88,85,83,81,78,76,73]
      :danger?[57,61,64,65,61,57,56,53]:motion==='show'?[73,76,80,83,81,80,76,73]:[69,73,76,81,76,73,71,66];
    const roots=concert?[50,55,47,45]:danger?[41,38,40,37]:[42,38,45,40];
    const interval=concert?.31:final?.21:motion==='show'?.38:.65;
    let index=0,time=context.currentTime+.08;
    mode='scene';
    function score(){
      if(document.hidden)return;
      while(time<context.currentTime+.22){
        if(time>=context.currentTime){
          note(melody[index%melody.length],time,interval*1.35,concert?.14:.075,final?'triangle':'sine',sceneGain);
          if(index%4===0){
            const root=roots[Math.floor(index/8)%4];
            for(const pitch of [root,root+12,root+(danger?15:16),root+19])
              note(pitch,time,interval*4,.043,'sine',sceneGain);
          }
        }
        time+=interval;index++;
      }
    }
    score();timer=setInterval(score,45);
  }
  function battleCue(element='pixel'){
    if(!context||!ready)return;
    const roots={fire:74,water:66,earth:52,air:81,ice:85,void:44,pixel:73};
    [0,element==='void'?6:7,12].forEach((n,i)=>note(roots[element]+n,context.currentTime+i*.07,.28,.078,'triangle'));
  }
  function reflectionScore(chapter,line){
    silence();
    if(!context||!ready)return;
    const memory=chapter===10&&line===0;
    sceneMusic(memory?'memory':'reflection');
    const root=memory?40:chapter===7?53:chapter===10?55:50;
    const intervals=memory?[0,7,13]:chapter===7||chapter===10?[0,7,12,16,19]:[0,7,12,15];
    intervals.forEach((interval,index)=>note(root+interval,context.currentTime+index*.35,4,.025,'sine'));
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (mode === 'menu') menu();
  });
  window.addEventListener('rr-settings',gains);
  window.addEventListener('pagehide',()=>{stop(); context?.close();});
  window.RR_AUDIO = Object.freeze({ unlock, menu, silence, cue, hit, portal, cheer, story, scene, reflectionScore, battleCue,
    snapshot: () => ({ state: context?.state || 'not-started', mode, music: 'Órbita de Casa', bpm: 78,
      menuGain: menuGain?.gain.value || 0, effectsGain: fxGain?.gain.value || 0, voices: voices.size }),
    level: () => { if (!meter) return 0; const d=new Float32Array(meter.fftSize); meter.getFloatTimeDomainData(d); return Math.sqrt(d.reduce((s,v)=>s+v*v,0)/d.length); }
  });
})();
