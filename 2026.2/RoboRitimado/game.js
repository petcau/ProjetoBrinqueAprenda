(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const LEVELS = window.RR_LEVELS;
  function modal(id,visible){
    const node=$(id),dialog=node.closest('dialog');node.hidden=!visible;
    if(dialog){if(visible&&!dialog.open)dialog.showModal();else if(!visible&&dialog.open)dialog.close();}
    frameDirty=true;dancerDirty=true;
  }

  let currentPreferences=window.RR_SETTINGS.get();
  const preferences=()=>currentPreferences;
  window.addEventListener('rr-settings',()=>{currentPreferences=window.RR_SETTINGS.get();frameDirty=true;dancerDirty=true;});
  let runRate = RR_SETTINGS.rate(), runArrowSpeed = preferences().arrowSpeed;
  let captionUntil = 0;
  function palette() {
    const p = preferences();
    if (p.highContrast) return ['#ffff00','#00ffff','#ffffff','#ff77ff'];
    const variants = { protanopia: ['#77caff','#ffe28a','#ffffff','#c2a0ff'],
      deuteranopia: ['#79c4ff','#ffbd71','#eee4ff','#85eddf'],
      tritanopia: ['#ff9bae','#85ead6','#ffffff','#d9a7ff'] };
    return variants[p.colorMode] || level.colors;
  }
  function caption(text, seconds = 1.2) {
    const el = $('gameCaption'); if (!el || !preferences().captions) return;
    $('captionResult').textContent = text; captionUntil = performance.now() + seconds * 1000;
  }
  let levelIndex = 0, level = LEVELS[0], bankedScore = 0, toysUnlocked = false, unlockedThrough = 0;
  let offset=0;
  let BPM, BEAT, SONG_BEATS, DURATION, COLORS, MELODY, BASS, CHART, MAX_POINTS, GOAL, FRAMES;
  let battle = null, battleEvent = null, coda = null, battleAttempt = 0;
  let battleText = '', holdGrace = 0;
  const isBattle = () => level.id === 'fase11';
  function configureLevel(index) {
    levelIndex = index; level = LEVELS[index];
    runRate = RR_SETTINGS.rate(); runArrowSpeed = preferences().arrowSpeed;
    BPM = level.bpm; BEAT = 60 / BPM / runRate; SONG_BEATS = level.beats; DURATION = SONG_BEATS * BEAT;
    COLORS = palette(); MELODY = level.melody; BASS = level.bass; FRAMES = level.frames;
    battle = null;
    battleEvent = coda = null;
    holdGrace = 0;
    if (isBattle()) {
      const schedule = RR_BATTLE.plan(preferences().shortSequences, Math.max(0,battleAttempt-1));
      battle = RR_BATTLE.create(schedule);
      SONG_BEATS = schedule.end + 8;
      DURATION = SONG_BEATS * BEAT;
      CHART = [];
      for (let beat=4;beat<schedule.end;beat++) {
        if (schedule.events.some(event=>beat>=event.begin && beat<event.end) || level.skipBeat(beat)) continue;
        CHART.push({beat,lane:level.sequence[beat%level.sequence.length],time:beat*BEAT});
      }
      for (const event of schedule.events) CHART.push(...RR_BATTLE.eventNotes(event,BEAT));
      CHART.sort((a,b)=>a.time-b.time);
      MAX_POINTS=CHART.length*200;
      GOAL=1;
      return;
    }
    CHART = [];
    for (let beat = 4, n = 0; beat < SONG_BEATS - 1; beat++) {
      if (level.skipBeat(beat)) continue;
      CHART.push({ beat, lane: level.sequence[n++ % level.sequence.length], time: beat * BEAT });
    }
    // Closing note's acceptance deadline coincides with the music end, even
    // with timing calibration. There is no four-beat empty ending anymore.
    CHART.push({beat:SONG_BEATS-.24/(runRate*BEAT),lane:level.sequence[CHART.length%level.sequence.length],time:DURATION-.24/runRate-offset/1000,closing:true});
    MAX_POINTS = CHART.length * 100 + Math.max(0, CHART.length - 5) * 100; GOAL = level.goal;
    if(GOAL>CHART.length * 100)throw new Error("A meta precisa caber na música.");
  }
  configureLevel(0);
  const KEYS = ['ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowRight'];
  const DIRECTIONS = ['esquerda', 'baixo', 'cima', 'direita'];
  const POINTS = { perfect: 100, good: 60, near: 20, miss: 0 };
  const LABELS = { perfect: 'No ritmo!', good: 'Muito bem!', near: 'Quase!', miss: 'Na próxima!' };
  const JCOLORS = { perfect: '#ffb7e7', good: '#92e6ff', near: '#ffe49d', miss: '#c8bfde' };
  const canvas = $('track'), ctx = canvas.getContext('2d');
  const dancer = $('pixelSprite'), danceCtx = dancer.getContext('2d');
  const imageAsset = url => RR_SPRITES.load(url);
  const assets=LEVELS.map(()=>null);
  function levelAssets(index) {
    if (assets[index]) return assets[index];
    const world = LEVELS[index];
    return assets[index] = {
      sprite: imageAsset(world.sprite),
      background: imageAsset(world.background),
      symbol: imageAsset(world.symbol),
      dance: world.dance ? imageAsset(world.dance.sprite) : null
    };
  }
  levelAssets(0);
  let sprite = assets[0].sprite.image;
  let frameDirty=true,dancerDirty=true,stageHeight=1,lastPortraitMood=-1,lastPortraitSprite=null;
  let perfectStreak = 0, frenzy = false, groove = .28;
  let danceModel = null, stageModel = null, recentResults = [], danceStep=null, lastStageLane=null;
  const stageCanvas=$('pixelStage'), stageCtx=stageCanvas.getContext('2d');
  const portrait=$('pixelPortrait'), portraitCtx=portrait.getContext('2d');
  function resetPerformance(){perfectStreak=0;groove=.28;setFrenzy(false);lastPortraitMood=-1;dancerDirty=true;frameDirty=true;danceStep=null;lastStageLane=null;recentResults=[];danceModel=null;stageModel=null;}
  let dancerWidth = 600, dancerHeight = 500, spriteReady = false;
  let danceFrame = 0, reactionKind = 'perfect';
  const danceSparks = [];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  assets[0].sprite.ready.then(() => { $('spriteStatus').hidden = true; }).catch(error => { $('spriteStatus').textContent = error.message; });
  let width = 500, height = 500, notes = [], particles = [], rings = [];
  let state = 'ready', previousState = '', score = 0, combo = 0, maxCombo = 0;
  let stats = { perfect: 0, good: 0, near: 0, miss: 0 }, best = 0;
  let audio = null, master = null, analyser = null, compressor = null, noise = null;
  let epoch = 0, step = -8, scheduler = null, generation = 0, starting = false;
  let soft = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lastFrame = performance.now(), lastSpeech = 0, judgmentUntil = 0, lastCount = null, visualTime = 0;
  const flashes = [0, 0, 0, 0], pressed = [false, false, false, false];
  const voices = new Set();
  const settingsLocked = () => ['playing', 'countdown', 'paused', 'transition', 'loading'].includes(state);
  try {
    best = Number(localStorage.getItem('robo-ritmado-best-v04')) || 0;
    toysUnlocked = localStorage.getItem('robo-ritmado-toys-unlocked') === 'true';
    unlockedThrough = Math.max(toysUnlocked ? 1 : 0, Math.min(LEVELS.length-1, Number(localStorage.getItem('rr-worlds-v07')) || 0));
    offset = Math.max(-200, Math.min(200, Number(localStorage.getItem('pixel-offset')) || 0));
    const saved = localStorage.getItem('pixel-effects');
    if (saved !== null) soft = saved === 'soft';
  } catch { /* The game also runs with browser storage disabled. */ }
  $('best').textContent = String(best).padStart(5, '0');
  $('offset').value = offset;
  $('offsetValue').textContent = `${offset > 0 ? '+' : ''}${offset} ms`;
  function save(key, value) { try { localStorage.setItem(key, value); } catch {} }
  const formatTime = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const worldButtons = RR_CAMPAIGN.map((stage,i)=>{
    const button=document.createElement('button');button.id=['worldCandy','worldToys','worldIce','worldSky','worldDesert','worldSwamp','worldMist','worldOcean','worldLava','worldScarlet'][i]||'worldFuture'+i;button.className='world-chip';
    button.innerHTML=String(i+1).padStart(2,'0')+' <span>'+stage.name+'</span><small></small>';button.disabled=true;$('journeyNav').append(button);return button.id;
  });
  const phaseButtons=worldButtons.map((id,i)=>{const b=$(id).cloneNode(true);b.id='revisit-'+id;b.addEventListener('click',()=>{document.querySelector('.phase-worlds').open=false;selectWorld(i);});$('phaseJourneyNav').append(b);return b;});
  function updateWorldButtons() {
    worldButtons.forEach((id,i)=>{
      const button=$(id),future=i>=LEVELS.length,locked=future||i>unlockedThrough;
      button.disabled=settingsLocked()||locked;
      button.setAttribute('aria-current',levelIndex===i?'step':'false');
      button.title=future?'Bloqueada · Em desenvolvimento':locked?'Conclua o mundo anterior e carregue o portal.':'Ensaiar em '+LEVELS[i].name+' (novo placar)';
      button.dataset.future=String(future);
      const lock=button.querySelector('small');if(lock)lock.textContent=future?'Em breve':locked?'🔒':'✦';
      const copy=phaseButtons[i];copy.disabled=button.disabled;copy.title=button.title;copy.dataset.future=button.dataset.future;copy.setAttribute('aria-current',button.getAttribute('aria-current'));copy.querySelector('small').textContent=lock.textContent;
      if(i===levelIndex&&document.body.dataset.screen==='game')button.scrollIntoView({block:'nearest',inline:'center'});
    });
  }
  function updateLevelUI() {
    document.body.dataset.theme = level.id;
    document.documentElement.style.setProperty('--pink', level.accent);
    document.querySelector('.world').style.backgroundImage = `url('${level.background}')`;
    $('trackBackdrop').style.backgroundImage=`url('${level.background}')`;
    $('chapterLabel').textContent = `FASE ${String(levelIndex+1).padStart(2,'0')} · ${isBattle()?'BATALHA FINAL':levelIndex?'O SHOW CONTINUA':'PRIMEIRA PARADA'}`;
    $('battleHUD').hidden=$('battleArt').hidden=!isBattle();
    $('phaseDialog').classList.toggle('boss-intro',isBattle());
    $('levelTitle').textContent = level.title; $('levelEm').textContent = level.emphasis;
    $('levelSubtitle').textContent = level.subtitle;
    $('trackName').textContent = level.track;
    document.querySelectorAll('.track-crown span').forEach(el=>el.textContent=level.ornament);
    $('albumCover').src=level.album;$('albumCover').alt='Capa de '+level.song;$('phaseAlbum').src=level.album;
    $('phaseFlurries').innerHTML=Array.from({length:10},(_,i)=>'<img alt="" src="'+level.symbol+'" style="--i:'+i+'">').join('');
    $('frenzyIcon').src=level.symbol;
    const dance = RR_PERFORMANCE.definitions[level.id];
    $('danceStyle').textContent=dance?.style || 'Rock cósmico';
    $('dancePhrase').textContent=dance?.name || 'Defenda OrbitHop';
    $('tempoLabel').textContent = `${Math.round(BPM * runRate)} BPM · ${runRate < 1 ? Math.round(runRate * 100) + '% DO RITMO' : levelIndex ? 'NOVO RITMO' : 'FÁCIL'}`;
    $('songName').textContent = level.song; $('songDescription').textContent = `${level.style} · ${Math.round(BPM * runRate)} BPM`;
    $('time').textContent = `0:00 / ${formatTime(Math.ceil(DURATION))}`;
    $('songFill').style.width = '0%';
    document.querySelector('.song-progress').setAttribute('aria-valuenow', '0');
    const greetings={doces:'O caminho de casa<br>começa no <em>ritmo.</em>',brinquedos:'Todo mundo no<br><em>desfile de estrelas!</em>',gelo:'Pés leves na neve.<br>Vamos <em>valsar?</em>',nebulosa:'Uma melodia brilha<br><em>entre os vaga-lumes!</em>',atlanta:'Vamos seguir<br><em>o compasso das marés!</em>',ceu:'Lá no alto, a música<br><em>abraça as nuvens!</em>',deserto:'Nosso ritmo faz<br><em>as dunas dançarem!</em>',pantano:'Raízes e gotas no<br><em>balanço da floresta!</em>'};
    $('introTitle').innerHTML = (greetings[level.id] || level.subtitle).replace(/<br>/g,' ');
    $('introCopy').textContent = isBattle() ? 'Responda aos avisos com as quatro setas. Segure as notas com cauda até o fim.' : 'Aperte a seta quando ela alcançar o alvo.';
    $('introDetail').textContent = isBattle() ? 'Enfraqueça Galactus e complete os quatro anéis da Sinfonia dos Mundos.' : `${Math.ceil(DURATION)} s · Meta de ${GOAL.toLocaleString('pt-BR')} pontos`;
    $('pixelArt').setAttribute('aria-label', `Pixel dançando com a guitarra e o traje de ${level.name}`);
    document.querySelector('.stage').setAttribute('aria-label', `Jogo de ritmo em ${level.name}`);
    updateWorldButtons(); updateScore();
    if (battle) updateBattle(-4);
  }
  const conversation={
    celebrate:['Uau, que sequência! Você está brilhando!','Olha esse ritmo! Você está mandando muito bem!','Seu esforço está virando música. Que orgulho!','Que show! Adoro tocar com você!','Essa batida é sua! Continue confiando em você!'],
    improve:['Isso! Estamos encontrando o ritmo juntos!','Viu só? Cada tentativa faz você melhorar!','Boa! Um acerto de cada vez. Você consegue!','Seu ritmo está crescendo. Vamos continuar!'],
    encourage:['Eu confio em você! A próxima é nossa!','Tudo bem errar. Vamos tentar juntos de novo?','Respira. Olhe o alvo. Eu estou aqui com você!','Você pode aprender! Cada tentativa conta.','Não desista! Eu acredito no seu ritmo!'],
    waiting:['Siga no seu tempo. Vamos juntos!','Ouça a batida e olhe o encontro das setas.','Minha guitarra e eu estamos com você!']
  };
  const welcomes={doces:'Um passinho de açúcar de cada vez. Vem comigo!',brinquedos:'Vamos brincar com o ritmo? Você faz parte do show!',gelo:'Pés leves na neve. Vamos aprender essa valsa?',nebulosa:'Uma luz de cada vez. Vamos brilhar juntos!',atlanta:'A maré dança com a gente. Eu confio no seu ritmo!',ceu:'Nossa música vai até as nuvens. Vamos juntos!',deserto:'Sinta a batida das dunas. Nosso sol é a música!',pantano:'Cada gotinha tem um ritmo. Vamos descobrir o nosso!'};
  const phraseCounts={};let lastBalloon=0,lastBalloonTone='welcome';
  function speak(text,tone='welcome'){
    const bubble=$('pixelSpeech');$('pixelSpeechText').textContent=text;bubble.dataset.tone=tone;
    bubble.classList.remove('changed');if(!RR_SETTINGS.gentle())requestAnimationFrame(()=>bubble.classList.add('changed'));
    lastBalloon=performance.now();lastBalloonTone=tone;
  }
  function nextConversation(tone){const bank=conversation[tone],i=phraseCounts[tone]||0;phraseCounts[tone]=i+1;speak(bank[i%bank.length],tone);}
  function talkForResult(kind){
    const recent=recentResults.length?recentResults.reduce((a,b)=>a+b,0)/recentResults.length:0;
    const tone=kind==='miss'||recent<.45?'encourage':combo>=5&&recent>=.75?'celebrate':'improve';
    if(performance.now()-lastBalloon>4200||(tone!==lastBalloonTone&&performance.now()-lastBalloon>2100))nextConversation(tone);
  }
  async function showLevel(index, carry = 0) {
    const token = ++generation;levelAssets(index);
    state = 'loading'; spriteReady = false; dancer.style.visibility = 'hidden'; updateWorldButtons(); clearInterval(scheduler); stopVoices();
    $('start').disabled=true;
    await Promise.all([assets[index].sprite.ready, assets[index].background.ready, assets[index].dance?.ready, LEVELS[index].id==='fase11' ? RR_FINALE.arenaReady : null]);
    if (token !== generation) return;
    configureLevel(index); bankedScore = carry; sprite = assets[index].sprite.image;
    RR_SPRITES.validate(sprite, FRAMES);
    danceFrame = 0; resetPerformance();
    score = 0; combo = 0; maxCombo = 0;notes = []; particles = []; rings = []; danceSparks.length = 0;
    stats = { perfect: 0, good: 0, near: 0, miss: 0 };
    modal('intro',true); modal('results',false); modal('pauseOverlay',false);
    $('countdown').innerHTML = ''; $('judgment').classList.remove('show');
    $('pause').disabled = true; $('offset').disabled = false; $('spriteStatus').hidden = true;
    state = 'ready'; updateLevelUI();speak(welcomes[level.id] || 'Vamos descobrir a batida deste mundo juntos!');
    // Wait for visible layout before committing the decoded costume to the canvas.
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    if (token !== generation) return;
    resize(); resizeDancer(); spriteReady = true; dancer.style.visibility = 'visible';modal('intro',true);
    $('start').disabled=false;
  }
  async function selectWorld(index) {
    if (settingsLocked() || index > unlockedThrough || index>=LEVELS.length) return;
    try { await showLevel(index, 0); }
    catch (error) { state = 'ready'; $('start').disabled=false; $('spriteStatus').hidden = false; $('spriteStatus').textContent = error.message; updateWorldButtons(); }
  }
  let traveling=false,skipJourney=false;
  const reflection=RR_REFLECTION.create($('travelCanvas'));
  const traveler=RR_TRAVEL.create($('travelCanvas'));
  async function travel(){
    if(traveling||state!=='results'||score<GOAL||isBattle())return;
    const next=levelIndex+1,carry=bankedScore+score,from={level,sprite,background:assets[levelIndex].background.image};
    traveling=true;skipJourney=false;state='transition';modal('results',false);updateWorldButtons();$('retryTravel').hidden=true;
    $('travelSummary').textContent=carry.toLocaleString('pt-BR')+' pontos seguem com você.';
    $('travelDestination').textContent=LEVELS[next].name;
    $('travelOverlay').showModal();
    try{
      levelAssets(next);
      await Promise.all([assets[next].sprite.ready,assets[next].background.ready]);
      const to={level:LEVELS[next],sprite:assets[next].sprite.image,background:assets[next].background.image};
      await RR_AUDIO.unlock();RR_AUDIO.silence();
      if(!skipJourney)await reflection.play(from,RR_NARRATIVE.reflections[levelIndex]);
      if(!skipJourney){
        $('travelDestination').textContent=to.level.name;
        if (to.level.id==='fase11') await RR_FINALE.play('return',from);
        else await traveler.play(from,to);
      }
      RR_AUDIO.silence();$('travelOverlay').close();
      await showLevel(next,carry);
      $('announcer').textContent='Pixel chegou com coragem a '+level.name+'. Confira a fase e entre no ritmo.';
    }catch(error){state='results';$('start').disabled=false;$('travelOverlay').close();modal('results',true);$('resultMessage').textContent='O portal precisa de mais um instante. '+error.message;updateWorldButtons();}
    finally{traveling=false;}
  }
  function journeyController(){
    if(RR_FINALE.active())return RR_FINALE;
    return reflection.snapshot().active?reflection:traveler;
  }
  function toggleJourney(){journeyController().toggle();}
  $('pauseTravel').onclick=toggleJourney;
  $('nextTravel').onclick=()=>journeyController().advance();
  $('backTravel').onclick=()=>journeyController().back();
  $('skipTravel').onclick=()=>{skipJourney=true;reflection.finish();RR_FINALE.finish();if(traveler.snapshot().active)traveler.finish();};
  $('travelOverlay').addEventListener('cancel',event=>{event.preventDefault();toggleJourney();});
  for(const [id,action]of [['phaseDialog',()=>{}],['resultDialog',()=>{}],['pauseDialog',()=>resume()]])$(id).addEventListener('cancel',e=>{e.preventDefault();action();});
  let manualSoft = soft;
  function setSoft() {
    soft = manualSoft || RR_SETTINGS.gentle();
    document.body.classList.toggle('soft-effects', soft);
    $('effects').setAttribute('aria-pressed', String(soft));
    $('effects').title = soft ? 'Ativar efeitos completos' : 'Reduzir os efeitos visuais';
  }
  setSoft();
  updateLevelUI();
  function clock() { return audio ? audio.currentTime - epoch : -4 * BEAT; }
  // Positive offset accepts the command later; the displayed note and judgment
  // share this clock so the visual alignment remains the target.
  function chartTime() { return clock() - offset / 1000; }
  function resize() {
    const box = canvas.getBoundingClientRect();
    const dpr = RR_SETTINGS.dpr();
    width = box.width; height = box.height;frameDirty=true;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  new ResizeObserver(resize).observe(canvas);
  function resizeDancer() {
    const box = dancer.getBoundingClientRect(), dpr = RR_SETTINGS.dpr();
    dancerWidth = Math.max(1, box.width); dancerHeight = Math.max(1, box.height);
    dancer.width = Math.round(dancerWidth * dpr); dancer.height = Math.round(dancerHeight * dpr);
    danceCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const art=$('pixelArt');Object.assign(stageCanvas.style,{left:art.offsetLeft+'px',top:art.offsetTop+'px',width:box.width+'px',height:(box.height+20)+'px'});
    stageHeight=box.height+20;
    stageCanvas.width=Math.max(1,Math.round(box.width*dpr));stageCanvas.height=Math.max(1,Math.round(stageHeight*dpr));stageCtx.setTransform(dpr,0,0,dpr,0,0);dancerDirty=true;frameDirty=true;
  }
  new ResizeObserver(resizeDancer).observe(dancer);
  function currentStep() {
    const motion=RR_SETTINGS.motion();
    if (!danceStep || !motion) return {lane:null,weight:0,previousLane:null,previousWeight:0,motion};
    const elapsed=Math.max(0,clock()-danceStep.start);
    const progress=elapsed/danceStep.duration;
    const weight=RR_PERFORMANCE.stepAmount(progress);
    const previousWeight=danceStep.previousWeight*(1-RR_PERFORMANCE.stepAmount(Math.min(progress,.24)));
    if(progress>=1)return {lane:null,weight:0,previousLane:null,previousWeight:0,motion};
    return {lane:danceStep.lane,weight,previousLane:danceStep.previousLane,previousWeight,motion};
  }
  function stepOnArrow(lane) {
    const prior=currentStep();
    const motion=RR_SETTINGS.motion();
    if(!motion)return;
    const keepPrevious=prior.previousWeight>prior.weight;
    danceStep={lane,start:clock(),duration:Math.max(.32,Math.min(.48,BEAT*.9))/Math.max(.7,motion),
      previousLane:keepPrevious?prior.previousLane:prior.lane,
      previousWeight:keepPrevious?prior.previousWeight:prior.weight};
    dancerDirty=true;
  }
  let lastStagePaint=-Infinity;
  function drawDancer(dt,step,now) {
    if(!spriteReady)return;
    const moving=step.lane!=null;
    if(!dancerDirty&&!moving&&danceModel?.stepLane==null&&!danceSparks.length)return;
    const dirty=dancerDirty;
    dancerDirty=false;
    danceCtx.clearRect(0,0,dancerWidth,dancerHeight);
    const still=reducedMotion||preferences().sensitivity;
    const paused=state==='paused'||!!document.querySelector('dialog[open]');
    const judged=stats.perfect+stats.good+stats.near+stats.miss;
    const recent=recentResults.length?recentResults.reduce((a,b)=>a+b,0)/recentResults.length:.7;
    const quality=recent*.85+(judged?basePoints()/(judged*100):.7)*.15;
    groove=frenzy?1:judged?Math.max(.1,quality*.85):.28;
    const mood=judged<3?2:quality<.32?0:quality<.55?1:quality<.76?2:quality<.91||combo<8||score<GOAL*.25?3:4;
    const beat=still?0:Math.max(0,clock())/BEAT;
    if(frenzy)drawAura(moving?beat:0);
    danceModel=RR_PERFORMANCE.draw(danceCtx,sprite,level,{
      width:dancerWidth,height:dancerHeight,mood,danceImage:assets[levelIndex].dance?.image,...step
    });
    danceFrame=0;
    if(dirty||lastStageLane!==step.lane||moving&&now-lastStagePaint>=42){
      lastStagePaint=now;
      lastStageLane=step.lane;
      stageModel=RR_PERFORMANCE.platform(stageCtx,{
        width:dancerWidth,height:stageHeight,floor:danceModel.floor,x:danceModel.x,
        id:level.id,colors:COLORS,accent:level.accent,power:groove,beat:moving?beat:0,
        soft,still:still||!moving,deluxe:true,frenzy,symbol:assets[levelIndex].symbol.image
      });
    }
    if($('dancePhrase').textContent!==danceModel.phrase)$('dancePhrase').textContent=danceModel.phrase;
    const emotion=RR_PERFORMANCE.moods[mood];
    if($('pixelMood').textContent!==emotion.name){
      $('pixelMood').textContent=emotion.name;$('pixelMood').title=emotion.message;
      $('pixelArt').setAttribute('aria-label',`Pixel ${emotion.name.toLowerCase()}, com o traje de ${level.name}. ${emotion.message}`);
    }
    // The portrait enlarges the actual visor so the expression is also readable
    // on a small screen. It uses the exact same texture as Pixel's body.
    const tex=RR_PERFORMANCE.texture(sprite,FRAMES[0],level.face,mood,level.id,level.faceClip,level.mouth,level.tears),[fx,fy,fw,fh]=level.face;
    if(lastPortraitMood!==mood||lastPortraitSprite!==sprite){
      portraitCtx.clearRect(0,0,96,84);portraitCtx.drawImage(tex,fx-fw*.8,fy-fh*.8,fw*1.6,fh*2.2,0,0,96,84);lastPortraitMood=mood;lastPortraitSprite=sprite;
    }
    if(!paused)for(const p of danceSparks){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}
    if(!soft&&!still)for(const p of danceSparks){
      danceCtx.globalAlpha=Math.max(0,1-p.age/p.life)*.7;danceCtx.fillStyle=p.color;
      danceCtx.font=`${p.size}px Trebuchet MS`;danceCtx.fillText(p.symbol,danceModel.x+p.x*danceModel.scale,danceModel.floor-danceModel.height*.5+p.y*danceModel.scale);
    }
    danceCtx.globalAlpha=1;
    for(let i=danceSparks.length-1;i>=0;i--)if(danceSparks[i].age>=danceSparks[i].life)danceSparks.splice(i,1);
  }
  const hz = midi => 440 * 2 ** ((midi - 69) / 12);
  function drawAura(beat){
    const x=dancerWidth*.52,y=dancerHeight*.55,r=Math.min(dancerHeight*.44,dancerWidth*.43);
    if(r<1)return;
    const halo=danceCtx.createRadialGradient(x,y,r*.23,x,y,r);
    halo.addColorStop(0,level.accent+'00');
    halo.addColorStop(.64,level.accent+(soft?'26':'78'));
    halo.addColorStop(1,level.accent+'00');
    danceCtx.fillStyle=halo;danceCtx.fillRect(x-r,y-r,r*2,r*2);
    danceCtx.save();danceCtx.strokeStyle=level.accent;danceCtx.globalAlpha=soft?.48:.75;danceCtx.lineWidth=3;
    for(let i=0;i<(soft?1:3);i++){
      const t=soft?0:beat*.55+i*2;
      danceCtx.beginPath();danceCtx.ellipse(x,y,r*(.50+i*.1),r*(.92+i*.07),Math.sin(t)*.26,0,Math.PI*2);danceCtx.stroke();
    }
    danceCtx.restore();
  }
  function tone(midi, when, duration, level = .09, type = 'triangle', destination = master) {
    const osc = audio.createOscillator(), gain = audio.createGain();
    osc.type = type; osc.frequency.value = hz(midi);
    gain.gain.setValueAtTime(.0001, when);
    gain.gain.exponentialRampToValueAtTime(level, when + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, when + duration);
    osc.connect(gain); gain.connect(destination); osc.start(when); osc.stop(when + duration + .015);
    osc.onended = () => { voices.delete(osc); osc.disconnect(); gain.disconnect(); };
    voices.add(osc);
  }
  function kick(when) {
    const osc = audio.createOscillator(), gain = audio.createGain();
    osc.frequency.setValueAtTime(145, when);
    osc.frequency.exponentialRampToValueAtTime(45, when + .17);
    gain.gain.setValueAtTime(.43, when);
    gain.gain.exponentialRampToValueAtTime(.0001, when + .26);
    osc.connect(gain); gain.connect(master); osc.start(when); osc.stop(when + .27);
    osc.onended = () => { voices.delete(osc); osc.disconnect(); gain.disconnect(); };
    voices.add(osc);
  }
  function percussion(when, snare = false) {
    const source = audio.createBufferSource(), filter = audio.createBiquadFilter(), gain = audio.createGain();
    source.buffer = noise;
    filter.type = 'highpass'; filter.frequency.value = snare ? 1300 : 7500;
    gain.gain.setValueAtTime(snare ? .16 : .045, when);
    gain.gain.exponentialRampToValueAtTime(.0001, when + (snare ? .14 : .055));
    source.connect(filter); filter.connect(gain); gain.connect(master);
    source.start(when); source.stop(when + (snare ? .15 : .06));
    source.onended = () => { voices.delete(source); source.disconnect(); filter.disconnect(); gain.disconnect(); };
    voices.add(source);
  }
  function scheduleMusic() {
    if (!audio || !['countdown', 'playing'].includes(state)) return;
    const now = audio.currentTime;
    while (step < SONG_BEATS * 2 && epoch + step * BEAT / 2 < now + .18) {
      const when = epoch + step * BEAT / 2;
      const beat = step / 2;
      if (when >= now) {
        if (beat < 0) {
          if (step % 2 === 0) tone(beat === -1 ? 84 : 79, when, .08, .08, 'sine');
        } else {
          const meter=level.meter,bar=Math.floor(beat/meter),chord=Math.floor(bar/2)%4;
          const kind=level.instrument,ice=kind==='ice',sky=kind==='sky';
          if(step%2===0){
            const b=Math.floor(beat),within=b%meter,root=BASS[chord],m=MELODY[b%MELODY.length];
            if(ice){
              if(within===0)tone(root,when,.85,.105,'sine');
              else [root+12,root+(chord===0?15:16),root+19].forEach(n=>tone(n,when,.34,.023,'triangle'));
              tone(m,when,.65,.085,'triangle');tone(m+12,when,.42,.022,'sine');
              if(within===0)tone(m+24,when,1.2,.013,'sine');
            }else if(sky){
              const arp=[0,7,12,16][within];tone(root+12+arp,when,.75,.07,'sine');
              tone(m,when,.9,.07,'sine');tone(m+12,when,.5,.016,'triangle');
              if(within===0)tone(root,when,1.7,.11,'sine');
              if(within===2)percussion(when);
            }else if(kind==='mist'){
              tone(root,when,.7,.08,'sine');tone(m+12,when,.6,.07,'sine');tone(m+19,when,.22,.02,'triangle');if(within===0)kick(when);if(within===2)percussion(when);
            }else if(kind==='ocean'){
              tone(root,when,.65,.10,'sine');tone(m,when,.52,.075,'triangle');tone(m+12,when,.25,.025,'sine');if(within===0||within===2)tone(root+24,when,.06,.04,'sine');if(within===1||within===3)percussion(when);
            }else if(kind==='lava'){
              kick(when);
              tone(root,when,.32,.11,'triangle');
              tone(m,when,.23,.065,'sawtooth');
              tone(m+7,when,.22,.027,'triangle');
              if(within%2)percussion(when,true);
            }else if(kind==='petal'){
              tone(root,when,.62,.10,'triangle');
              tone(m,when,.48,.072,'triangle');
              tone(m+12,when,.32,.032,'sine');
              if(within%2)percussion(when);else kick(when);
            }else if(kind==='desert'){
              tone(root,when,.27,.12,'triangle');tone(m,when,.22,.10,'triangle');tone(m+12,when,.11,.022,'sine');
              if(within===0||within===2)kick(when);else {tone(root+24,when,.06,.035,'sine');percussion(when);}
            }else if(kind==='swamp'){
              tone(root+(within===2?7:0),when,.36,.13,'sine');tone(m,when,.36,.08,'sine');tone(m+19,when,.12,.025,'triangle');
              if(within===0)kick(when);if(within===1||within===3){tone(86+within,when,.08,.025,'sine');percussion(when);}
            }else if(kind==='toy'){
              if(within===0||within===2)kick(when);
              else {tone(within===1?88:83,when,.055,.075,'triangle');percussion(when+.025);}
              tone(root+(within===2?12:0),when,.19,.10,'triangle');
              tone(m,when,.34,.11,'sine');tone(m+12,when,.15,.028,'sine');tone(m+19,when,.07,.012,'sine');
            }else{
              if(within%2===0)kick(when);else percussion(when,true);
              tone(root,when,.38,.16,'sine');tone(m,when,.28,.095,'triangle');tone(m+12,when,.19,.022,'sine');
            }
            if(within===0){
              const third=(ice?(chord===0||chord===2):(chord===level.minorChord))?3:4;
              [root+12,root+12+third,root+19].forEach(n=>tone(n,when,ice?1.7:sky?2.1:kind==='toy'?.4:1.4,sky?.018:.02,'triangle'));
            }
            const note=CHART.find(n=>n.beat===beat);
            if(note)tone(MELODY[(b+note.lane)%MELODY.length]+12,when,.12,.023,'sine');
          }else if(beat>=16){
            if(kind==='candy'||kind==='toy')percussion(when);
            if(sky)tone(BASS[chord]+[19,24,28,31][Math.floor(beat)%4],when,.45,.025,'sine');
            else if(kind==='swamp'){tone(MELODY[(Math.floor(beat)+3)%MELODY.length],when,.16,.035,'triangle');}
            else if(!ice)tone(MELODY[Math.floor(beat)%MELODY.length]+(kind==='candy'?12:0),when,.12,.025,'sine');
          }
        }
      }
      if(step===SONG_BEATS*2-1&&when>=now)tone(MELODY[0]+12,epoch+DURATION-.24/runRate,.20/runRate,.04,'sine');
      step++;
    }
  }
  async function prepareAudio() {
    if (!audio || audio.state === 'closed') {
      audio = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
      master = audio.createGain();
      compressor = audio.createDynamicsCompressor();
      compressor.threshold.value = -14; compressor.knee.value = 15; compressor.ratio.value = 4;
      analyser = audio.createAnalyser(); analyser.fftSize = 256;
      master.connect(compressor); compressor.connect(analyser); analyser.connect(audio.destination);
      noise = audio.createBuffer(1, Math.ceil(audio.sampleRate * .2), audio.sampleRate);
      const data = noise.getChannelData(0);
      // Fixed seed keeps the percussion identical between attempts.
      let seed = 39271;
      for (let i = 0; i < data.length; i++) { seed = (seed * 16807) % 2147483647; data[i] = seed / 1073741823.5 - 1; }
    }
    await audio.resume();
    if (audio.state !== 'running') throw new Error('O navegador ainda não liberou o som. Clique em Vamos tocar novamente.');
    master.gain.setValueAtTime(preferences().musicVolume / 100 * .72, audio.currentTime);
  }
  function stopVoices() {
    for (const voice of voices) { try { voice.stop(); } catch {} }
    voices.clear();
  }
  function updateScore() {
    $('score').textContent = String(bankedScore + score).padStart(5, '0');
    $('combo').textContent = combo;
    const energy = Math.min(100, Math.floor(score / GOAL * 100));
    $('energyValue').textContent = `${energy}%`; $('energyFill').style.width = `${energy}%`;
    $('energyHint').textContent = energy >= 100 ? (levelIndex ? 'Show carregado! Continue tocando.' : 'Portal carregado! Conclua a música.') : `Nesta fase: ${score.toLocaleString('pt-BR')} / ${GOAL.toLocaleString('pt-BR')} pontos`;
    document.body.classList.toggle('portal-charged', !battle && energy >= 100);
  }
  async function start() {
    if (starting || ['transition', 'loading'].includes(state)) return;
    starting = true; $('start').disabled = true; $('audioError').hidden = true;
    const token = ++generation;
    clearInterval(scheduler); stopVoices();
    try {
      await Promise.all([assets[levelIndex].sprite.ready, assets[levelIndex].background.ready]);
      await prepareAudio();
      if (token !== generation) return;
      if(isBattle()) battleAttempt++;
      configureLevel(levelIndex); updateLevelUI();
      score = 0; combo = 0; maxCombo = 0;
      stats = { perfect: 0, good: 0, near: 0, miss: 0 };
      notes = CHART.map((n, i) => ({ ...n, id: i, result: null }));
      particles = []; rings = []; flashes.fill(0); pressed.fill(false); judgmentUntil = 0;
      danceSparks.length = 0; danceFrame = 0; resetPerformance();
      $('judgment').classList.remove('show');
      modal('intro',false); modal('pauseOverlay',false); modal('results',false);
      $('pause').disabled = false; $('pause').textContent = 'Ⅱ'; $('pause').setAttribute('aria-label', 'Pausar música');
      $('offset').disabled = true;
      state = 'countdown'; epoch = audio.currentTime + .15 + 4 * BEAT;
      updateWorldButtons();
      step = -8; lastCount = null;
      updateScore();speak(welcomes[level.id] || 'Vamos descobrir a batida deste mundo juntos!');$('pixelMessage').textContent = 'Prepare as setas. Vamos nessa!';
      $('announcer').textContent = 'Prepare-se. A música vai começar.';
      scheduleMusic(); scheduler = setInterval(scheduleMusic, 25);
    } catch (error) {
      state = 'ready'; modal('intro',true);
      modal('pauseOverlay',false); modal('results',false);
      $('audioError').textContent = error.message || 'Não foi possível iniciar o áudio. Tente novamente.';
      $('audioError').hidden = false; $('pause').disabled = true; $('offset').disabled = false;
      updateWorldButtons();
    } finally { starting = false; $('start').disabled = false; }
  }
  async function pause() {
    if (!['playing', 'countdown'].includes(state)) return;
    previousState = state; state = 'paused';frameDirty=true;dancerDirty=true;
    clearInterval(scheduler); pressed.fill(false);
    modal('pauseOverlay',true); $('pause').textContent = '▶';
    $('pause').setAttribute('aria-label', 'Continuar música');
    await audio.suspend();
    $('resume').focus({ preventScroll: true });
    $('announcer').textContent = 'Jogo pausado.'; if ($('captionApproach')) $('captionApproach').textContent = ''; caption('Partida pausada. Música e setas paradas.', 60);
  }
  async function resume() {
    if (state !== 'paused' || starting) return;
    starting = true;
    try {
      await audio.resume();
      state = previousState; modal('pauseOverlay',false);
      holdGrace=chartTime()+.4/runRate;
      $('pause').textContent = 'Ⅱ'; $('pause').setAttribute('aria-label', 'Pausar música');
      scheduleMusic(); scheduler = setInterval(scheduleMusic, 25);
      $('announcer').textContent = 'Vamos continuar!'; caption('Continue na batida!', 1);
    } catch { $('announcer').textContent = 'Clique em Continuar para liberar o som.'; }
    finally { starting = false; }
  }
  function spawn(lane, kind) {
    if (preferences().sensitivity) return;
    const x = laneX(lane), y = targetY();
    for (let i = 0; i < (soft ? 4 : kind === 'perfect' ? 42 : kind === 'miss' ? 8 : 24)*RR_SETTINGS.effects(); i++) {
      const angle = Math.random() * Math.PI * 2, speed = 40 + Math.random() * 230;
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 65,
        life: .45 + Math.random() * .6, age: 0, color: kind === 'miss' ? '#b9a6ce' : i % 5 === 0 ? '#fff5cf' : COLORS[(lane + i % 3) % 4],
        size: 2 + Math.random() * 6, star: i % 3 === 0, angle, spin: Math.random() * 5 - 2.5 });
    }
    if (kind !== 'miss') rings.push({ x, y, age: 0, color: COLORS[lane], life: .6, perfect: kind === 'perfect' });
    if (particles.length > 240) particles.splice(0, particles.length - 240);
  }
  function basePoints() {
    return stats.perfect * 100 + stats.good * 60 + stats.near * 20;
  }
  function setFrenzy(active) {
    frenzy = active;
    $('frenzyAlert').hidden = !active;
    $('frenzyLabel').textContent = active ? 'Frenesi! No ritmo vale 200 pontos' : '';
    document.body.classList.toggle('frenzy-active', active);
  }
  function judge(note, kind) {
    if (note.result) return;
    const points = POINTS[kind] * (frenzy && kind === 'perfect' ? 2 : 1);
    note.result = kind;
    battle?.note(note);
    if(kind==='miss'&&battleEvent?.id==='rebound'&&note.event===battleEvent.key&&!battle.resolved(note.event)){
      const exchange=notes.filter(candidate=>candidate.event===note.event);
      for(const remaining of exchange)if(!remaining.result)remaining.result='skip';
      battle.resolve(battleEvent,exchange,clock()/BEAT);
    }
    stats[kind]++;
    score += points;
    perfectStreak = kind === 'perfect' ? perfectStreak + 1 : 0;
    const wasFrenzy = frenzy;
    if (frenzy !== (perfectStreak >= 5)) setFrenzy(perfectStreak >= 5);
    recentResults.push(POINTS[kind]/100);if(recentResults.length>10)recentResults.shift();
    combo = kind === 'perfect' || kind === 'good' ? combo + 1 : 0;
    maxCombo = Math.max(maxCombo, combo);
    reactionKind=kind;
    dancerDirty=true;
    if (kind !== 'miss' && !reducedMotion && !preferences().sensitivity) for (let i = 0; i < (soft ? 2 : kind === 'perfect' ? 24 : 14)*RR_SETTINGS.effects(); i++) {
      danceSparks.push({ x: -100 + Math.random() * 170, y: -50 + Math.random() * 60,
        vx: (Math.random() - .5) * 220, vy: -70 - Math.random() * 130,
        age: 0, life: .8 + Math.random() * .4, color: COLORS[note.lane],
        size: 14 + Math.random() * 13, symbol: i % 3 ? level.ornament : '♪' });
    }
    if (danceSparks.length > 90) danceSparks.splice(0, danceSparks.length - 90);
    updateScore();talkForResult(kind);spawn(note.lane, kind);
    RR_AUDIO.hit(note.lane, kind);
    const description = { perfect: 'Acerto no ritmo!', good: 'Acerto parcial. Muito bem!', near: 'Quase acerto!', miss: 'Erro. A próxima é nossa!' };
    caption(`${description[kind]} ${DIRECTIONS[note.lane]}. +${points} pontos. Total: ${bankedScore + score}.${frenzy&&!wasFrenzy?' Frenesi ativado!':wasFrenzy&&!frenzy?' Frenesi encerrado.':''}`, 1.25);
    flashes[note.lane] = preferences().sensitivity ? 0 : kind === 'miss' ? .08 : .35;
    const label = $('judgment');
    label.style.color = JCOLORS[kind];
    label.innerHTML = `${LABELS[kind]}<small>${points ? '+' + points + ' PONTOS' : 'CONTINUE TOCANDO'}</small>`;
    label.classList.remove('show'); void label.offsetWidth; label.classList.add('show');
    judgmentUntil = performance.now() + 650;
    const now = performance.now();
    if (now - lastSpeech > 900 || combo % 8 === 0) {
      const messages = { perfect: combo >= 8 ? `Combo ${combo}! A gente está brilhando!` : 'Isso! Senti essa batida!', good: 'Muito bem! Vamos juntos!', near: 'Quase! Olhe para o alvo.', miss: 'Tudo bem! A próxima é nossa.' };
      $('pixelMessage').textContent = messages[kind]; lastSpeech = now;
    }
  }
  function input(lane) {
    flashes[lane] = preferences().sensitivity ? 0 : .16;
    if (state !== 'playing') return;
    stepOnArrow(lane);
    const t = chartTime();
    if(notes.some(n=>n.held&&!n.result&&n.lane===lane))return;
    const candidates = notes.filter(n => !n.result && !n.held && n.lane === lane && Math.abs(n.time - t) <= hitWindow(n));
    candidates.sort((a, b) => Math.abs(a.time - t) - Math.abs(b.time - t));
    if (candidates.length) {
      const note = candidates[0], delta = Math.abs(note.time - t);
      if(note.hold){note.held=true;return;}
      judge(note, delta <= .075 / runRate ? 'perfect' : delta <= .15 / runRate ? 'good' : 'near');
    } else {
      // Wrong direction consumes a note only during its actual hit window.
      // Extra presses between notes do not create additional score penalties.
      const wrong = notes.filter(n => !n.result && !n.held && Math.abs(n.time - t) <= hitWindow(n))
        .sort((a, b) => Math.abs(a.time - t) - Math.abs(b.time - t))[0];
      if (wrong) judge(wrong, 'miss');
    }
  }
  function finish() {
    if (state === 'results') return;
    state = 'results'; danceStep=null;setFrenzy(false); clearInterval(scheduler); stopVoices();
    $('countdown').innerHTML = ''; $('pause').disabled = true; $('offset').disabled = false;
    $('songFill').style.width = '100%';
    document.querySelector('.song-progress').setAttribute('aria-valuenow', '100');
    $('time').textContent = `${formatTime(Math.ceil(DURATION))} / ${formatTime(Math.ceil(DURATION))}`;
    modal('results',true);
    const retry = battle ? !battle.snapshot().won : score < GOAL;
    $('retryCoach').hidden = !retry;
    $('retryPixel').hidden = !retry;
    $('resultDialog').classList.toggle('retry-dialog', retry);
    if (retry) {
      const portrait = $('retryPixel');
      const context = portrait.getContext('2d');
      const [x,y,width,height] = FRAMES[0];
      const cropHeight = Math.round(height * .55);
      portrait.width = width;
      portrait.height = cropHeight;
      context.drawImage(sprite,x,y,width,cropHeight,0,0,width,cropHeight);
    }
    $('playAgain').innerHTML=!retry?'Tocar de novo <span>↻</span>':'Tentar de novo com Pixel <span>↻</span>';

    $('resultScore').innerHTML = `${score.toLocaleString('pt-BR')} <small>pontos</small>`;
    $('resultPerfect').textContent = stats.perfect; $('resultGood').textContent = stats.good;
    $('resultNear').textContent = stats.near; $('resultMiss').textContent = stats.miss;
    const accuracy = Math.round(basePoints() / (notes.filter(note=>note.result!=='skip').length * 100) * 100);
    const stars = accuracy >= 85 ? 3 : accuracy >= 55 ? 2 : accuracy > 0 ? 1 : 0;
    $('stars').textContent = '✦'.repeat(stars) + '✧'.repeat(3 - stars);
    $('stars').setAttribute('aria-label', `${stars} de 3 estrelas`);
    const charged = !retry;
    speak(charged?'Conseguimos! Eu sabia que você podia!':'Seu esforço vale muito. Vamos tentar outra vez?',charged?'celebrate':'encourage');
    const hasNext=levelIndex<LEVELS.length-1;
    if(charged)$('energyHint').textContent=hasNext?'Portal aberto para '+LEVELS[levelIndex+1].name+'!':'Dez mundos no nosso ritmo!';
    if(charged&&hasNext){unlockedThrough=Math.max(unlockedThrough,levelIndex+1);toysUnlocked=true;save('rr-worlds-v07',unlockedThrough);save('robo-ritmado-toys-unlocked','true');}
    $('resultPill').textContent=charged?'✦ FASE '+(levelIndex+1)+' CONCLUÍDA':'♡ MAIS UMA TENTATIVA JUNTOS';
    $('resultTitle').textContent = charged ? (levelIndex ? 'Que grande show!' : 'O portal despertou!') : score ? 'Você fez música!' : 'Vamos tentar juntos?';
    $('resultMessage').textContent = battle ? (charged?'A música voltou a OrbitHop!':'A cidade conta com você. Leia os avisos e tente a batalha novamente.') : charged ? LEVELS[levelIndex+1].name+' espera por você!' : `Você fez ${score.toLocaleString('pt-BR')} de ${GOAL.toLocaleString('pt-BR')} pontos. Vamos praticar?`;
    $('resultDetail').textContent = `Combo: ${maxCombo} · Precisão: ${accuracy}% · Total: ${(bankedScore + score).toLocaleString('pt-BR')}`;
    $('nextStage').hidden = !(charged && hasNext);$('lastStory').hidden=!(charged&&battle);
    $('lastStory').textContent='Rever o desfecho';
    if(hasNext)$('nextStage').innerHTML='Ouvir Pixel e seguir para '+LEVELS[levelIndex+1].name+' <span>✦</span>';
    $('playAgain').classList.toggle('replay-secondary', charged && hasNext);
    $('resultHint').textContent = battle ? 'Quatro anéis completam a Sinfonia dos Mundos.' : bankedScore ? `Você trouxe ${bankedScore.toLocaleString('pt-BR')} pontos dos mundos anteriores.` : charged ? 'Seus pontos seguem com você pelo portal.' : `Faltaram ${Math.max(0, GOAL - score).toLocaleString('pt-BR')} pontos para abrir o portal.`;
    $('pixelMessage').textContent = charged ? 'Conseguimos! Olha o nosso portal!' : 'Adorei tocar com você. Mais uma?';
    if (bankedScore + score > best) { best = bankedScore + score; save('robo-ritmado-best-v04', best); $('best').textContent = String(best).padStart(5, '0'); }
    $('announcer').textContent = charged?'Fase concluída!':'Vamos tentar de novo!';
    updateWorldButtons();
    (charged ? hasNext ? $('nextStage') : $('lastStory') : $('playAgain')).focus({ preventScroll: true });
    if (battle && charged) playEnding();
  }
  async function playEnding(){
    if(traveling||state!=='results'||!battle?.snapshot().won)return;
    traveling=true;skipJourney=false;state='transition';modal('results',false);
    $('travelSummary').textContent='';$('travelOverlay').showModal();
    try { await RR_AUDIO.unlock();if(!skipJourney)await RR_FINALE.play('victory'); }
    catch (error) { $('resultMessage').textContent=error.message; }
    finally {
      RR_AUDIO.silence();$('travelOverlay').close();state='results';traveling=false;
      modal('results',true);$('lastStory').focus({preventScroll:true});
    }
  }
  function hitWindow(note) {
    const rules=RR_BATTLE.rules;
    return (note.event!=null&&preferences().assistTiming?rules.assistedTolerance:rules.tolerance)/runRate;
  }
  function updateBattle(beat) {
    const status=battle.snapshot();
    const schedule=battle.schedule;
    const expired=schedule.events.find(event=>beat>=event.end&&!battle.resolved(event.key));
    if(expired) battle.resolve(expired,notes.filter(note=>note.event===expired.key),beat);
    if(coda&&beat>=coda.end&&!battle.resolved(coda.key)){
      battle.resolve(coda,notes.filter(note=>note.event===coda.key),beat);
      coda=null;
    }
    const current=battle.snapshot();
    if(beat>=schedule.end && current.ready && !current.won && !coda){
      coda=RR_BATTLE.finale(Math.ceil(beat)+RR_BATTLE.rules.warning,current.ring);
      notes.push(...RR_BATTLE.eventNotes(coda,BEAT).map((note,index)=>({...note,id:notes.length+index,result:null})));
      SONG_BEATS=coda.end+2;DURATION=SONG_BEATS*BEAT;
    }
    const activeEvent=coda || schedule.events.find(event=>beat>=event.warn&&beat<event.end&&!battle.resolved(event.key));
    const started=!!activeEvent&&beat>=activeEvent.begin;
    if(activeEvent&&battleEvent?.key!==activeEvent.key)RR_AUDIO.battleCue(activeEvent.enemyAttack?'void':activeEvent.element);
    if(activeEvent?.enemyAttack&&started&&!battleEvent?.started)RR_AUDIO.battleCue('void');
    const judgments=activeEvent?notes.filter(note=>note.event===activeEvent.key).map(note=>note.result):[];
    battleEvent=activeEvent?{
      ...activeEvent,started,judgments,
      hits:judgments.filter(result=>['perfect','good','near'].includes(result)).length
    }:null;
    if(status.pixel!==current.pixel || status.enemy!==current.enemy) RR_AUDIO.battleCue(current.result?.event.element);
    if($('pixelMeter').value!==current.pixel){$('pixelMeter').value=current.pixel;$('pixelLife').value=current.pixel+' / 100';}
    if($('bossMeter').value!==current.enemy){$('bossMeter').value=current.enemy;$('bossLife').value=current.enemy+' / 150';}
    const event=battleEvent;
    const arrows=['←','↓','↑','→'];
    const result=current.result;
    const text=event ? `${RR_BATTLE.elements[event.element][0]} ${event.name} · ${event.enemyAttack?(event.started?'Galactus ataca':'Galactus prepara'):(event.started?'Agora':'Prepare-se')}\n${event.pattern.map(lane=>arrows[lane]).join(' ')} · ${event.cue}`
      : result&&beat-result.beat<3 ? result.event.name+' · '+(result.damage?'−'+result.damage+' Galactus':result.loss?'−'+result.loss+' Pixel':result.heal?'+'+result.heal+' vida':'♪ Evento encerrado')
      : `♪ Toque para carregar · Energia ${current.energy}/12${current.ring?' · Anéis '+current.ring+'/4':''}`;
    if(text!==battleText){battleText=text;$('battleCue').textContent=text;}
    return current;
  }
  function laneX(lane) { return width * .16 + lane * width * .2266667; }
  function targetY() { return height - 67; }
  function starPath(context, x, y, radius, rotation = 0) {
    context.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = rotation + i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? radius * .4 : radius;
      if (i) context.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      else context.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    context.closePath();
  }
  function paintArrow(ctx,x,y,lane,size,color,filled,glow) {
    ctx.save(); ctx.translate(x, y);
    ctx.rotate([Math.PI, Math.PI / 2, -Math.PI / 2, 0][lane]);
    ctx.beginPath();
    const path = [[-.44, -.23], [.03, -.23], [.03, -.46], [.49, 0], [.03, .46], [.03, .23], [-.44, .23]];
    path.forEach(([px, py], i) => i ? ctx.lineTo(px * size, py * size) : ctx.moveTo(px * size, py * size));
    ctx.closePath(); ctx.lineJoin = 'round'; ctx.lineWidth = filled ? 2 : 2.5;
    ctx.shadowColor = color; ctx.shadowBlur = glow;
    const fill = ctx.createLinearGradient(-size / 2, -size / 2, size / 2, size / 2);
    fill.addColorStop(0, '#fff7f6'); fill.addColorStop(.35, color); fill.addColorStop(1, color + 'aa');
    ctx.fillStyle = filled ? (preferences().highContrast ? color : fill) : (preferences().highContrast ? '#000000' : '#19152ed9'); ctx.fill(); ctx.strokeStyle = filled ? '#fff3ffdd' : color; ctx.stroke();
    if (filled && !soft && !preferences().highContrast) {
      ctx.save(); ctx.clip(); ctx.shadowBlur = 0;
      if (level.id!=='doces') {
        ctx.fillStyle = '#ffffffb0';
        if(level.id==='pantano'){ctx.beginPath();ctx.ellipse(0,0,size*.07,size*.14,.55,0,Math.PI*2);ctx.fill();}
        else if(level.id==='deserto'){for(let a=0;a<8;a++){ctx.save();ctx.rotate(a*Math.PI/4);ctx.fillRect(-1,size*.07,2,size*.07);ctx.restore();}ctx.beginPath();ctx.arc(0,0,size*.055,0,Math.PI*2);ctx.fill();}
        else if(level.id==='gelo'){for(let a=0;a<6;a++){ctx.save();ctx.rotate(a*Math.PI/3);ctx.fillRect(-1,-size*.15,2,size*.3);ctx.restore();}}
        else if(level.id==='ceu'){ctx.beginPath();[[0,-.16],[.04,-.04],[.16,0],[.04,.04],[0,.16],[-.04,.04],[-.16,0],[-.04,-.04]].forEach(([x,y],i)=>i?ctx.lineTo(x*size,y*size):ctx.moveTo(x*size,y*size));ctx.closePath();ctx.fill();}
        else{starPath(ctx,0,0,size*.105);ctx.fill();}
        ctx.fillStyle = '#ffffff75';
        for (const dx of [-.3, -.15]) { ctx.beginPath(); ctx.arc(dx * size, 0, size * .035, 0, Math.PI * 2); ctx.fill(); }
      } else {
        ctx.strokeStyle = '#ffffff85'; ctx.lineWidth = 3;
        const shift = 4;
        for (let sx = -size; sx < size; sx += 15) { ctx.beginPath(); ctx.moveTo(sx + shift, -size); ctx.lineTo(sx + size + shift, size); ctx.stroke(); }
      }
      ctx.restore();
      ctx.shadowBlur = 0; ctx.globalAlpha = .45; ctx.translate(-size * .035, -size * .045);
      ctx.scale(.72, .7); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
      // Canvas paths are not restored by save/restore: rebuild the arrow after
      // drawing the clipped stripes/star so decorative paths cannot leak out.
      ctx.beginPath();
      path.forEach(([px, py], i) => i ? ctx.lineTo(px * size, py * size) : ctx.moveTo(px * size, py * size));
      ctx.closePath(); ctx.stroke();
    }
    ctx.restore();
  }
  let trackArt;
  function trackGraphics(size) {
    const key=[width,height,size,level.id,soft,preferences().sensitivity,preferences().highContrast,...COLORS].join('|');
    if(trackArt?.key===key)return trackArt;
    const background=document.createElement('canvas');
    background.width=Math.max(1,Math.ceil(width));
    background.height=Math.max(1,Math.ceil(height));
    const base=background.getContext('2d');
    const panel=base.createLinearGradient(0,0,0,height);
    panel.addColorStop(0,preferences().highContrast?'#000':level.panel[0]);
    panel.addColorStop(1,preferences().highContrast?'#000':level.panel[1]);
    base.fillStyle=panel;base.fillRect(0,0,width,height);
    const laneWidth=width*.2266667;
    for(const [lane,color] of COLORS.entries()){
      const x=laneX(lane)-laneWidth/2+1;
      const fill=base.createLinearGradient(0,0,0,height);
      fill.addColorStop(0,color+'0b');fill.addColorStop(.6,color+'1d');fill.addColorStop(1,color+'38');
      base.fillStyle=fill;base.fillRect(x,0,laneWidth-2,height);
    }
    if(!preferences().sensitivity){
      for(const x of [7,width-7])for(let i=0;i<13;i++){
        base.fillStyle=COLORS[i%4]+'9b';
        starPath(base,x,17+i*(height-34)/12,3.1,i*.2);base.fill();
      }
    }
    const stampSize=Math.ceil(size+38);
    const arrows=COLORS.map((color,lane)=>[false,true].map(filled=>{
      const stamp=document.createElement('canvas');
      stamp.width=stamp.height=stampSize;
      paintArrow(stamp.getContext('2d'),stampSize/2,stampSize/2,lane,size,color,filled,soft?0:filled?12:5);
      return stamp;
    }));
    trackArt={key,background,arrows,size};
    return trackArt;
  }
  function arrow(art,x,y,lane,size,filled){
    const stamp=art.arrows[lane][Number(filled)];
    const width=stamp.width*size/art.size;
    ctx.drawImage(stamp,x-width/2,y-width/2,width,width);
  }
  const songProgress=document.querySelector('.song-progress');
  const songTime=$('time');
  function updateSongTime(musicTime) {
    const percent=String(Math.round(Math.max(0,Math.min(1,musicTime/DURATION))*100));
    if(songProgress.getAttribute('aria-valuenow')!==percent){
      songProgress.setAttribute('aria-valuenow',percent);
      $('songFill').style.width=percent+'%';
    }
    const label=`${formatTime(Math.min(DURATION,Math.max(0,musicTime)))} / ${formatTime(Math.ceil(DURATION))}`;
    if(songTime.textContent!==label)songTime.textContent=label;
  }
  function draw(timestamp) {
    requestAnimationFrame(draw);
    const dt = Math.min(.05, (timestamp - lastFrame) / 1000); lastFrame = timestamp;
    if (document.body.dataset.screen !== 'game'||document.hidden) return;
    if(!frameDirty&&!['playing','countdown'].includes(state))return;
    frameDirty=false;
    if (state !== 'paused') visualTime += dt;
    const active = state === 'playing' || state === 'countdown';
    let t = active || state === 'paused' || state === 'results' ? chartTime() : -4 * BEAT;
    const musicT = audio && state !== 'ready' ? clock() : -4 * BEAT;
    const pulse = active && !soft ? Math.max(0, 1 - ((Math.max(0, musicT) / BEAT) % 1) * 3) : .15;
    if (state === 'countdown') {
      const count = Math.ceil(-musicT / BEAT);
      if (count !== lastCount) {
        lastCount = count;
        $('countdown').innerHTML = count > 0 ? `${Math.min(4, count)}<small>PREPARE AS SETAS</small>` : 'Vai!';
      }
      if (musicT >= 0) { state = 'playing'; $('pixelMessage').textContent = 'Ouça a batida. As setas estão chegando!'; }
    }
    if (state === 'playing') {
      if(musicT>BEAT*.8&&lastCount!==null){$('countdown').textContent='';lastCount=null;}
      for (const note of notes) {
        if(note.time>t)break;
        if (note.result) continue;
        if (note.held) {
          if (t>=note.time+note.hold && pressed[note.lane]) judge(note,'perfect');
          else if (!pressed[note.lane]&&t>=holdGrace) judge(note,t>=note.time+note.hold*.5?'near':'miss');
        } else if (t>note.time+hitWindow(note)) judge(note,'miss');
      }
      const outcome=battle&&updateBattle(t/BEAT);
      if (outcome?.won || outcome?.lost || musicT >= DURATION) {for(const note of notes)if(!note.result)judge(note,'miss');finish();}
    }
    if(active&&state!=='results') updateSongTime(musicT);
    if (judgmentUntil && timestamp > judgmentUntil) { $('judgment').classList.remove('show'); judgmentUntil = 0; }
    if (preferences().captions && active) {
      const approaching = notes.find(n => !n.result && n.time - t < 1.4 / runRate && n.time - t > -.24 / runRate);
      const cue = approaching ? `${approaching.time - t < .24 / runRate ? 'AGORA: ' : 'Aproximando: '}${DIRECTIONS[approaching.lane]} ${['←','↓','↑','→'][approaching.lane]}` : 'Ouça a música. Aguarde a próxima seta.';
      if ($('captionApproach').textContent !== cue) $('captionApproach').textContent = cue;
      if (timestamp > captionUntil) $('captionResult').textContent = '';
    }
    if(active&&state==='playing'&&performance.now()-lastBalloon>8500)nextConversation(recentResults.length&&recentResults.slice(-3).every(n=>n===0)?'encourage':'waiting');
    const step=currentStep();
    if(!width||height<=82)return;
    if (battle) RR_FINALE.drawArena($('battleArt'),sprite,Math.max(0,t)/BEAT,battleEvent,{...battle.snapshot(),frenzy},step,timestamp);
    else drawDancer(dt,step,timestamp);
    ctx.clearRect(0, 0, width, height);
    const target = targetY(), laneWidth = width * .2266667, size = Math.min(78 * (preferences().scaleEnabled ? preferences().arrowScale : 1), laneWidth * .88);
    const art=trackGraphics(size);
    ctx.drawImage(art.background,0,0,width,height);
    if(battleEvent?.blocked && t/BEAT>=battleEvent.begin){
      for(const lane of battleEvent.blocked){
        const x=laneX(lane)-laneWidth/2;
        ctx.fillStyle='#1a0f26aa';ctx.fillRect(x,0,laneWidth,height);
        ctx.fillStyle='#f6dcff';ctx.font='bold 15px system-ui';ctx.textAlign='center';
        ctx.fillText('×',laneX(lane),22);
      }
    }
    for(let lane=0;lane<4;lane++){
      if(flashes[lane]<=0)continue;
      if(state!=='paused')flashes[lane]=Math.max(0,flashes[lane]-dt);
      ctx.fillStyle=COLORS[lane]+Math.floor(Math.min(1,flashes[lane]*2)*50).toString(16).padStart(2,'0');
      ctx.fillRect(laneX(lane)-laneWidth/2,target-65,laneWidth,126);
    }
    const travel = 2.3 / runArrowSpeed / runRate, speed = (target - 15) / travel;
    if (settingsLocked() || state === 'results') {
      const first = Math.floor(t / BEAT);
      for (let b = first; b < first + 5; b++) {
        const y = target - (b * BEAT - t) * speed;
        if (y < 0 || y > height) continue;
        ctx.strokeStyle = b % 4 === 0 ? '#e3b5ff18' : '#ffffff08';
        ctx.beginPath(); ctx.moveTo(13, y); ctx.lineTo(width - 13, y); ctx.stroke();
      }
    }
    // The approach line and judging use exactly the same audio clock.
    ctx.shadowColor = '#ffb8e0'; ctx.shadowBlur = soft ? 0 : 8 + pulse * 8;
    ctx.strokeStyle = '#ffc3e565'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(13, target); ctx.lineTo(width - 13, target); ctx.stroke(); ctx.shadowBlur = 0;
    for (let lane = 0; lane < 4; lane++) {
      if (!soft) {
        ctx.save(); ctx.globalAlpha = .28 + pulse * .25; ctx.strokeStyle = COLORS[lane]; ctx.lineWidth = 1;
        ctx.shadowColor = COLORS[lane]; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(laneX(lane), target, size * (.65 + pulse * .08), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      arrow(art,laneX(lane),target,lane,size+(flashes[lane]>.1?4:0),false);
      ctx.font = `bold ${Math.max(7,Math.min(12,width/48))}px Trebuchet MS, Arial`; ctx.fillStyle = '#e4d8ed'; ctx.textAlign = 'center';
      ctx.fillText(DIRECTIONS[lane].toUpperCase(), laneX(lane), target + (width<350?37:50), laneWidth*.94);
    }
    for (const note of notes) {
      if(note.time>t+(target+70)/speed)break;
      if (note.result) continue;
      const y = note.held ? target : target - (note.time - t) * speed;
      if (y < -70 || y > height + 50) continue;
      const approach = Math.max(0, Math.min(1, (target - y) / target));
      const x = laneX(note.lane) + (soft ? 0 : Math.sin(visualTime * 4 + note.id) * 3 * approach), color = COLORS[note.lane];
      if(note.hold){
        const end=target-(note.time+note.hold-t)*speed;
        ctx.fillStyle=color;ctx.globalAlpha=.7;ctx.fillRect(x-5,Math.min(end,y),10,Math.abs(y-end));
        ctx.globalAlpha=1;ctx.fillRect(x-11,end,22,3);
      }
      if(note.event!=null){
        ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.strokeRect(x-size*.43,y-size*.43,size*.86,size*.86);
      }
      if(!soft){
        ctx.globalAlpha=.24;
        ctx.fillStyle=color;
        ctx.fillRect(x-1.5,y-size*.72,3,size*.42);
        ctx.globalAlpha=1;
      }
      arrow(art,x,y,note.lane,size*.88,true);
    }
    for (const ring of rings) {
      if (state !== 'paused') ring.age += dt;
      const p = ring.age / ring.life, radius = 12 + p * (ring.perfect ? 92 : 65);
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - p); ctx.strokeStyle = ring.color;
      ctx.shadowColor = ring.color; ctx.shadowBlur = soft ? 0 : 16; ctx.lineWidth = 4 * (1 - p) + .5;
      ctx.beginPath(); ctx.arc(ring.x, ring.y, radius, 0, Math.PI * 2); ctx.stroke();
      if (!soft) for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4 + p * .7;
        ctx.beginPath(); ctx.moveTo(ring.x + Math.cos(a) * radius * .75, ring.y + Math.sin(a) * radius * .75);
        ctx.lineTo(ring.x + Math.cos(a) * radius * 1.3, ring.y + Math.sin(a) * radius * 1.3); ctx.stroke();
      }
      ctx.restore();
    }
    rings = rings.filter(r => r.age < r.life);
    for (const p of particles) {
      if (state !== 'paused') { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 170 * dt; }
      ctx.globalAlpha = Math.max(0, 1 - p.age / p.life); ctx.fillStyle = p.color;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle + p.age * p.spin);
      if (p.star && !soft) { ctx.shadowColor = p.color; ctx.shadowBlur = 8; starPath(ctx, 0, 0, p.size); ctx.fill(); }
      else ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }
    ctx.globalAlpha = 1; particles = particles.filter(p => p.age < p.life);
    if (!active && state !== 'paused') {
      // A gentle idle meter keeps the world alive without simulating gameplay.
      const mx = width - 30;
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = '#dca4ff38'; const h = soft ? 8 : 5 + (Math.sin(timestamp / 370 + i) + 1) * 6;
        ctx.fillRect(mx + i * 4, 15 - h / 2, 2, h);
      }
    }
  }
  $('start').addEventListener('click', start);
  $('nextStage').addEventListener('click', travel);$('lastStory').addEventListener('click',playEnding);
  $('retryTravel').addEventListener('click', () => {
    travel();
  });
  worldButtons.forEach((id,i)=>$(id).addEventListener('click',()=>selectWorld(i)));
  $('playAgain').addEventListener('click', start);
  $('restartPause').addEventListener('click', start);
  $('resume').addEventListener('click', resume);
  $('pause').addEventListener('click', () => state === 'paused' ? resume() : pause());
  $('effects').addEventListener('click', () => { manualSoft = !manualSoft; setSoft(); save('pixel-effects', manualSoft ? 'soft' : 'full'); });
  $('volume').addEventListener('input', () => {
    RR_SETTINGS.set('musicVolume', Number($('volume').value));
  });
  $('offset').addEventListener('input', () => {
    if (settingsLocked()) return;
    offset = Number($('offset').value); $('offsetValue').textContent = `${offset > 0 ? '+' : ''}${offset} ms`; save('pixel-offset', offset);
  });
  $('fullscreen').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { $('announcer').textContent = 'Use o botão de tela cheia do seu navegador.'; }
  });
  document.addEventListener('keydown', event => {
    if (document.body.dataset.screen !== 'game' || document.querySelector('dialog[open]')) return;
    if (event.target instanceof HTMLInputElement && !['playing', 'countdown'].includes(state)) return;
    const lane = KEYS.indexOf(event.key);
    if (lane >= 0) {
      event.preventDefault();
      if (!event.repeat && !pressed[lane]) { pressed[lane] = true; input(lane); }
    } else if (event.key === 'Escape' && !event.repeat) {
      event.preventDefault();
      if (state === 'paused') resume(); else pause();
    }
  });
  function releaseLane(lane){
    pressed[lane]=false;
    if(state!=='playing'||!battle)return;
    const held=notes.find(note=>note.held&&!note.result&&note.lane===lane);
    if(!held)return;
    const heldTime=chartTime()-held.time;
    judge(held,heldTime>=held.hold-.045/runRate?'perfect':heldTime>=held.hold*.5?'near':'miss');
  }
  document.addEventListener('keyup', event => { const lane = KEYS.indexOf(event.key); if (lane >= 0) releaseLane(lane); });
  for (const button of document.querySelectorAll('[data-lane]')) {
    button.addEventListener('pointerdown', event => {
      event.preventDefault(); const lane = Number(button.dataset.lane);
      if (!pressed[lane]) { pressed[lane] = true; input(lane); }
      button.setPointerCapture(event.pointerId);
    });
    const release = () => releaseLane(Number(button.dataset.lane));
    button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('blur', () => { pressed.fill(false); pause(); });
  window.addEventListener('pagehide', () => { clearInterval(scheduler); stopVoices(); if (audio) audio.close(); });
  // Read-only diagnostics for verifying timing, scoring, audio and pause behavior.
  // Gameplay has no autoplay or score-writing test hooks.
  Object.defineProperty(window, 'pixelDiagnostics', { value: Object.freeze({
    snapshot: () => ({ state, transition:reflection.snapshot().active?reflection.snapshot():traveler.snapshot(), rate: runRate, arrowSpeed: runArrowSpeed, palette: [...COLORS], level: levelIndex + 1, world: level.id, bpm: BPM, song: level.song,
      duration: DURATION, sprite: level.sprite, choreography: danceModel, instrument: level.instrument, meter: level.meter, background: level.background, stage: stageModel, emotion: {name:danceModel?.mood||'Animando',recent:[...recentResults]}, musicSignature: MELODY.join(',') + '/' + BASS.join(','),
      bankedScore, totalScore: bankedScore + score, unlocked: toysUnlocked, unlockedThrough,
      effects: { trackParticles: particles.length, rings: rings.length, dancerParticles: danceSparks.length, reduced: soft },
      time: audio ? clock() : null, chartTime: audio ? chartTime() : null,
      score, combo, maxCombo, frenzy, perfectStreak, groove, stats: { ...stats }, totalNotes: CHART.length, maxPoints: MAX_POINTS,
      goal: GOAL, offset, audioState: audio?.state || 'not-started',
      dancer: { ready: spriteReady, frame: danceFrame, step:currentStep(),
        reaction: reactionKind, width: dancerWidth, height: dancerHeight,
        sourceWidth: sprite.naturalWidth, sourceHeight: sprite.naturalHeight, sourceRect: [...FRAMES[danceFrame]],
        sourceRects: FRAMES.map(r=>[...r]),
        visible: dancer.style.visibility !== 'hidden' },
      battle:battle?{...battle.snapshot(),activeEvent:battleEvent?.id||null,enemyAttack:battleEvent?.enemyAttack||null,attackStarted:battleEvent?.started||false}:null,
      notes: notes.map(n => ({ lane: n.lane, time: n.time, result: n.result, hold:n.hold||0, event:n.event })) }),
    audioLevel: () => {
      if (!analyser) return 0;
      const data = new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(data);
      return Math.sqrt(data.reduce((sum, v) => sum + v * v, 0) / data.length);
    }
  }), writable: false });
  function syncPreferences() {
    frameDirty=true;dancerDirty=true;
    COLORS = palette(); setSoft(); $('volume').value = preferences().musicVolume;
    if (audio && master) master.gain.setTargetAtTime(preferences().musicVolume / 100 * .72, audio.currentTime, .02);
    if (preferences().sensitivity) { particles = []; rings = []; danceSparks.length = 0; flashes.fill(0); }
  }
  window.addEventListener('rr-settings', syncPreferences); syncPreferences();
  window.RR_GAME = Object.freeze({
    pause, resume, palette,
    canResume: () => state === 'paused',
    dismissNotices(){for(const id of ['intro','pauseOverlay','results'])modal(id,false);},
    stop() { for(const id of ['intro','pauseOverlay','results'])modal(id,false);++generation; clearInterval(scheduler); stopVoices(); state = 'ready'; notes = []; pressed.fill(false); },
    async adventure() { await showLevel(0, 0); }
  });
  resize(); resizeDancer(); requestAnimationFrame(draw);
})();
