(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  document.body.dataset.screen = 'menu'; document.body.classList.add('warning-pending');
  const root = document.createElement('div'); root.id = 'colorRoot';
  for (const node of [...document.body.children]) if (!['SCRIPT'].includes(node.tagName)) root.append(node);
  document.body.prepend(root);
  root.insertAdjacentHTML('beforeend', `
    <svg width="0" height="0" aria-hidden="true" style="position:absolute"><defs>
      <filter id="vision-protanopia" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0 -.2549 1.2549 0 0 0 .3031 -.5451 1.242 0 0 0 0 0 1 0"/></filter>
      <filter id="vision-deuteranopia" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0 -.4375 1.4375 0 0 0 .2625 -.5625 1.3 0 0 0 0 0 1 0"/></filter>
      <filter id="vision-tritanopia" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1.05 -.3825 .3325 0 0 0 1.2345 -.2345 0 0 0 0 1 0 0 0 0 0 1 0"/></filter>
    </defs></svg>
    <section id="sceneShell" class="scene-shell" aria-label="Menu principal de Robô Ritmado em OrbitHop">
      <div class="orbit-bg" aria-hidden="true"></div><div class="scene-orbit" aria-hidden="true"></div>
      <canvas id="orbitFx" class="orbit-fx" aria-hidden="true"></canvas><canvas id="cinemaCanvas" class="cinema-canvas" role="img" aria-label="A viagem animada de Pixel pelos portais"></canvas>

      <div id="menuContent" class="menu-content"><span class="menu-kicker">UMA AVENTURA EM CADA PARTIDA!</span>
        <h1 class="game-logo" aria-label="Robô Ritmado"><i class="logo-note" aria-hidden="true">♫</i><span class="logo-word logo-robot">Robô</span><span class="logo-word logo-rhythm">Ritmado</span><i class="logo-star" aria-hidden="true">✦</i><span class="logo-decoration" aria-hidden="true">✧　♪　✦　♫　✧</span><i class="logo-sparkles" aria-hidden="true"><b>✦</b><b>♩</b><b>✦</b><b>♪</b><b>✦</b></i></h1>
        <p class="menu-story">Uma guitarra. Muitos mundos!<br> Vem brincar com <strong>Pixel!</strong></p>
        <nav class="menu-nav" aria-label="Menu principal">
          <button id="menuPlay" class="orbit-button play" data-cue="play"><span class="button-icon" aria-hidden="true">▷</span>Jogar<span class="button-arrow" aria-hidden="true">↗</span></button>
          <button id="menuResume" class="orbit-button" data-cue="back" hidden><span class="button-icon" aria-hidden="true">↻</span>Continuar partida<span class="button-arrow" aria-hidden="true">→</span></button>
          <button id="menuTutorial" class="orbit-button tutorial" data-cue="tutorial"><span class="button-icon" aria-hidden="true">♫</span>Tutorial<span class="button-arrow" aria-hidden="true">→</span></button>
          <button id="menuOptions" class="orbit-button options" data-cue="options"><span class="button-icon" aria-hidden="true">⚙</span>Opções<span class="button-arrow" aria-hidden="true">→</span></button>
          <button id="menuAccessibility" class="orbit-button accessibility" data-cue="accessibility"><span class="button-icon" aria-hidden="true">◎</span>Acessibilidade<span class="button-arrow" aria-hidden="true">→</span></button>
          <button id="menuAbout" class="orbit-button about" data-cue="about"><span class="button-icon" aria-hidden="true">✧</span>Sobre Nós<span class="button-arrow" aria-hidden="true">→</span></button>
        </nav><p class="menu-hint"><kbd>Tab</kbd> para navegar · <kbd>Enter</kbd> para escolher<br>Jogue no seu tempo. Ajuste em Acessibilidade.</p>
      </div>
      <div id="portalScene" class="cinema-portal" aria-hidden="true"></div>
      <div id="orbitActor" class="actor-wrap"><div class="actor-plinth" aria-hidden="true"></div><canvas id="menuStage" class="menu-stage" aria-hidden="true"></canvas><canvas id="orbitPixel" role="img" aria-label="Pixel com seu outfit padrão e guitarra estrela, tocando devagar em OrbitHop"></canvas></div>
      <div id="pixelGreeting" class="pixel-greeting"><b>Oi, eu sou Pixel!</b><br>Bora fazer uma música e viajar pelas estrelas?</div><button id="sayHello" class="say-hello" data-cue="tutorial">Oi, Pixel! ♡</button><div id="loadingTrip" class="toast" role="status" hidden>✦ Preparando nossa viagem…</div><div id="pixelName" class="pixel-name"><i></i><div>PIXEL<small>SOM QUE CONECTA MUNDOS</small></div></div>
      <div id="cinemaUI" class="cinema-ui" hidden>
        <div class="cinema-top"><div class="cinema-place"><span id="sceneNumber">PRÓLOGO / 01</span><h2 id="scenePlace">OrbitHop, lar de Pixel</h2></div><div class="view-toolbar"><button id="pauseCinema" class="quiet-button" data-cue="options">Pausar cena</button><button id="skipCinema" class="quiet-button" data-cue="back">Pular introdução</button></div></div>
        <div class="cinema-bottom"><p id="storyAction" class="story-action"></p><div id="storyCaption" class="story-subtitle" role="status" aria-live="polite"></div><div id="storyProgress" class="cinema-progress" aria-hidden="true"></div><div class="cinema-controls"><button id="backCinema" class="quiet-button" data-cue="back" disabled>← Voltar</button><button id="nextCinema" class="quiet-button" data-cue="play">Avançar cena →</button></div></div>
      </div>
      <section id="tutorialUI" class="tutorial-ui" hidden aria-label="Tutorial guiado por Pixel">
        <div class="tutorial-toolbar"><h2>Ensaio com Pixel</h2><button id="leaveTutorial" class="quiet-button" data-cue="back">Voltar ao menu</button></div>
        <div id="tutorialSteps" class="tutorial-steps" aria-label="Progresso do tutorial"></div><div class="lesson-rewards"><span>Estrelinhas do ensaio</span><b id="lessonRewards">☆☆☆☆</b></div>
        <div class="tutorial-board"><canvas id="tutorialCanvas" role="img" aria-label="Pista demonstrativa com quatro direções e alvos fixos"></canvas></div>
        <div class="tutorial-instruction"><div class="speaker"><span class="coach-mascot" aria-hidden="true">+ᴗ</span> SEU AMIGO PIXEL <span id="lessonNumber"></span></div><p id="tutorialDialogue" class="dialogue-text" aria-live="polite"></p><p id="tutorialFeedback" class="tutorial-status" role="status" aria-live="polite"></p></div>
        <div class="tutorial-touch" aria-label="Controles do tutorial"><button data-tutorial-lane="0" aria-label="Esquerda">←</button><button data-tutorial-lane="1" aria-label="Baixo">↓</button><button data-tutorial-lane="2" aria-label="Cima">↑</button><button data-tutorial-lane="3" aria-label="Direita">→</button></div>
        <div class="tutorial-next"><button id="tutorialNext" class="orbit-button tutorial" data-cue="tutorial">Começar ensaio →</button><button id="tutorialPlay" class="orbit-button play" data-cue="play" hidden>Jogar a aventura ↗</button></div>
        <p class="tutorial-caption">Sem vidas e sem pressa. Você avança quando aprender.<br>Use as setas do teclado ou toque nos botões.</p>
      </section>
      <div class="orbit-footer"><div class="now-playing"><span class="equalizer" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>Órbita de Casa <span id="menuAudioStatus">· ative o som</span></span><button id="menuSound" class="music-toggle" aria-label="Ativar som do menu">♪ Ativar som</button></div><span class="footer-tag">SEU RITMO CONECTA O UNIVERSO.</span></div>
    </section><div id="gameCaption" class="game-caption" role="status" aria-live="polite" hidden><span id="captionApproach"></span><span id="captionResult"></span></div>
  `);
  document.body.insertAdjacentHTML('beforeend', `
    <button id="menuFullscreen" class="quiet-button quick-fullscreen" aria-label="Alternar tela cheia" data-cue="options">⛶ Tela cheia</button>
    <dialog id="safetyDialog" class="safety-dialog" aria-labelledby="safetyTitle" aria-describedby="safetyCopy safetyRisk">
      <button id="welcomeFullscreen" class="quiet-button quick-fullscreen" aria-label="Alternar tela cheia" data-cue="options">⛶ Tela cheia</button>
      <div class="welcome-portrait"><img src="assets/pixel-boas-vindas-v11.png" alt="Pixel no traje padrão, de braços acolhedores"></div>
      <div class="safety-body"><span class="dialog-kicker">Mas antes de qualquer coisa, um abraço antes da aventura...</span><h2 id="safetyTitle">Seu ritmo cabe aqui<span class="welcome-bang">!</span></h2><p class="safety-welcome">Olá, aspirante! Eu sou Pixel. ♡</p>
      <p id="safetyCopy">Se você possui alguma deficiência ou necessidade singular, visite <strong>Acessibilidade</strong> antes da jornada. Vamos ajustar o jogo ao seu jeito?</p>
      <div class="welcome-features"><span>◈ Cores e leitura</span><span>♪ Movimento e ritmo</span><span>☏ Legendas e tempo</span></div>
      <p id="safetyRisk" class="welcome-warning"><strong>Cuidado com as luzes:</strong> o jogo contém luzes, animações e efeitos visuais que podem causar desconforto ou desencadear crises em pessoas fotossensíveis. Antes de jogar, ajuste os estímulos, o movimento e a velocidade às suas necessidades.</p>
      <button id="safetyAccessibility" class="orbit-button accessibility" data-cue="accessibility" autofocus><span class="button-icon" aria-hidden="true">◎</span>Ajustar Acessibilidade<span class="button-arrow" aria-hidden="true">→</span></button>
      <button id="closeSafety" class="safety-close" data-cue="back" aria-label="Fechar aviso e ir ao menu">Já está tudo certo. Vamos começar! →</button>
      <p class="safety-note">Disponível o tempo todo no menu e em Opções. Sensibilidade Visual reduz os estímulos, mas não garante ausência de risco.</p></div>
    </dialog>
    <dialog id="settingsDialog" class="settings-dialog" aria-labelledby="settingsTitle">
      <div class="dialog-header"><div><span class="dialog-kicker">NO SEU RITMO</span><h2 id="settingsTitle">Configurações</h2></div><button id="closeSettings" class="close-icon" data-cue="back" aria-label="Fechar configurações">×</button></div>
      <div class="settings-tabs" role="tablist" aria-label="Configurações"><button id="optionsTab" role="tab" aria-selected="true" aria-controls="optionsPanel" data-cue="options">Opções</button><button id="accessibilityTab" role="tab" aria-selected="false" aria-controls="accessibilityPanel" data-cue="accessibility">Acessibilidade</button><button id="preferencesTab" role="tab" aria-selected="false" aria-controls="preferencesPanel" data-cue="options">Preferências</button></div>
      <div class="settings-content"><div id="optionsPanel" role="tabpanel" aria-labelledby="optionsTab"></div><div id="accessibilityPanel" role="tabpanel" aria-labelledby="accessibilityTab" hidden></div><div id="preferencesPanel" role="tabpanel" aria-labelledby="preferencesTab" hidden>
      </div></div>
      <div class="settings-footer"><small>Alterações salvas automaticamente neste navegador.</small><button id="reviewSafety" class="quiet-button" data-cue="accessibility">Rever aviso</button><button id="doneSettings" class="quiet-button" data-cue="back">Concluir</button></div>
    </dialog>
    <dialog id="aboutDialog" class="about-dialog" aria-labelledby="aboutTitle">
      <h2 id="aboutTitle">Sobre Nós</h2>
      <p>Somos três amigos, graduandos em Engenharia de Software e fascinados por jogos e tecnologia.</p>
      <p>Robô Ritmado nasceu da vontade de criar algo juntos. Neste projeto, unimos música, arte e programação e aprendemos, na prática, como nossas ideias ganham vida em um jogo.</p>
      <form method="dialog"><button class="quiet-button" data-cue="back">Voltar ao menu</button></form>
    </dialog>
    <div id="shellToast" class="toast" role="status" aria-live="polite" hidden></div>
  `);
  const slider = (key,label,min,max,step,help) => `<div class="setting-row"><div class="setting-top"><label for="set-${key}">${label}</label><output id="out-${key}" for="set-${key}"></output></div><p>${help}</p><input id="set-${key}" data-setting="${key}" type="range" min="${min}" max="${max}" step="${step}"></div>`;
  const toggle = (key,label,help,sub='') => `<div class="setting-row"><div class="setting-top"><label for="set-${key}">${label}</label><input id="set-${key}" data-setting="${key}" type="checkbox" aria-describedby="help-${key}"></div><p id="help-${key}">${help}</p>${sub}</div>`;
  const subSlider = (key,label,min,max,step) => `<label for="set-${key}">${label}<output id="out-${key}" for="set-${key}"></output></label><input id="set-${key}" data-setting="${key}" type="range" min="${min}" max="${max}" step="${step}">`;
  $('optionsPanel').innerHTML = slider('musicVolume','Volume da Música',0,100,1,'Volume das músicas que tocam nas fases.') + slider('sfxVolume','Sons do Jogo',0,100,1,'Efeitos de botões, acertos, tutorial e portais.') + slider('menuVolume','Volume Principal',0,100,1,'Volume da música que toca na tela de menu.') + slider('arrowSpeed','Velocidade das Setas',.55,1.6,.05,'Ajusta a velocidade visual de aproximação sem mudar o ritmo da música. Valores menores mostram as setas com mais antecedência.') + '<p class="settings-note">Para desacelerar também a música e dar mais tempo a cada ação, use Ajuste de Velocidade do Jogo em Acessibilidade. Mudanças de velocidade são aplicadas ao iniciar ou reiniciar a música.</p>';
  $('accessibilityPanel').innerHTML = toggle('colorEnabled','Modo para Daltonismo','Filtro de cores do cenário, personagem e efeitos, com paleta específica nas setas. A direção e os rótulos continuam identificáveis sem depender só da cor.', '<div id="colorControls" class="setting-sub"><label for="set-colorMode">Tipo de ajuste</label><select id="set-colorMode" data-setting="colorMode"><option value="protanopia">Protanopia</option><option value="deuteranopia">Deuteranopia</option><option value="tritanopia">Tritanopia</option></select></div>')
    + toggle('scaleEnabled','Escalonamento da Interface','Amplie textos e ícones, legendas e as setas fixas e móveis de forma independente.', `<div id="scaleControls" class="setting-sub">${subSlider('uiScale','Interface e ícones',1,1.4,.1)}${subSlider('subtitleScale','Legendas',1,1.8,.1)}${subSlider('arrowScale','Setas fixas e móveis',1,1.4,.1)}</div>`)
    + toggle('reduceMotion','Redução de Movimento Visual','Diminui os movimentos da câmera e dos elementos decorativos. Pixel dança mais devagar.', `<div id="motionControls" class="setting-sub">${subSlider('danceSpeed','Velocidade da dança',.15,.6,.05)}</div>`)
    + toggle('highContrast','Alto Contraste','Painéis pretos, texto branco, contornos fortes e setas de cores sólidas. Reforça a separação entre personagem e cenário.')
    + toggle('captions','Legendas Descritivas','Mostra a direção da próxima seta, sua aproximação, o momento de tocar, os resultados e a pontuação. As falas da história e do tutorial estão sempre visíveis.')
    + toggle('speedEnabled','Ajuste de Velocidade do Jogo','Desacelera música, setas e janelas de acerto juntas para ampliar o tempo de reação.', `<div id="speedControls" class="setting-sub">${subSlider('gameSpeed','Velocidade da partida',.5,1,.05)}</div>`)
    + toggle('sensitivity','Sensibilidade Visual','Reduz brilho e saturação, remove flashes decorativos, partículas e rastros, e deixa Pixel estável. Aplica-se ao menu, cenas, tutorial e fases. Não elimina todos os riscos de fotossensibilidade.');
  $('accessibilityPanel').insertAdjacentHTML('beforeend',
    toggle('assistTiming','Mais tempo para reagir','Amplia a janela das notas especiais.')
    + toggle('shortSequences','Sequências mais curtas','Encurta desafios longos na próxima batalha.'));
  $('preferencesPanel').innerHTML=toggle('darkMode','Modo Escuro','Escurece o fundo e os painéis.')
    + '<div class="setting-row device-setting"><label for="set-device">Dispositivo</label><select id="set-device" data-setting="device"><option value="pc">PC (Computador)</option><option value="mobile">Celular/Smartphone</option><option value="tablet">Tablet</option></select><p>Adapta os controles e a qualidade dos efeitos.</p></div>';
  document.body.insertAdjacentHTML('beforeend','<dialog id="rotateDialog" class="rotate-dialog" aria-labelledby="rotateTitle"><div class="rotate-icon" aria-hidden="true">▯ ↻ ▭</div><h2 id="rotateTitle">Vire a tela para jogar</h2><p>Na horizontal, você vê as setas e os personagens com mais espaço.</p><button id="closeRotate" class="quiet-button" data-cue="back">Entendi</button></dialog>');
  for(const word of document.querySelectorAll('.game-logo .logo-word')) word.dataset.text=word.textContent;
  const appActions = document.createElement('div'); appActions.className = 'game-settings';
  appActions.innerHTML = '<button id="gameMenu" class="quiet-button" data-cue="back" aria-label="Pausar e voltar ao menu">☰ <span class="settings-label">Menu</span></button><button id="gameAccessibility" class="quiet-button" data-cue="accessibility" aria-label="Abrir Acessibilidade">◎</button>';
  document.querySelector('.top-actions').prepend(appActions);
  document.querySelector('.brand')?.addEventListener('click',e=>{e.preventDefault();returnMenu();});

  const buttonInfo={menuPlay:['Jogar','Começar a aventura'],menuTutorial:['Tutorial','Aprender com Pixel'],menuOptions:['Opções','Ajustar sons e velocidade'],menuAccessibility:['Acessibilidade','Do seu jeitinho'],menuAbout:['Sobre Nós','Conheça nossa turma']};
  for(const [id,[title,sub]] of Object.entries(buttonInfo)){const button=$(id);button.setAttribute('aria-label',title);for(const node of [...button.childNodes])if(node.nodeType===Node.TEXT_NODE)node.remove();const label=document.createElement('span');label.className='button-copy';label.innerHTML='<b>'+title+'</b><small>'+sub+'</small>';button.insertBefore(label,button.querySelector('.button-arrow'));}
  let greetingUntil=0;
  $('sayHello').onclick=()=>{const messages=['Oba! Que bom que você veio! ♡','Cada pessoa tem seu ritmo. Vamos achar o nosso?','Minha guitarra tá prontinha! E você?','Toca aqui! A nossa aventura vai ser demais! ✦'];$('pixelGreeting').textContent=messages[Math.floor(Math.random()*messages.length)];greetingUntil=performance.now()+4000;RR_AUDIO.hit(2);};
  let currentScreen = 'menu', toastTimer, lastFocused = null, lastColor = 'deuteranopia', dialogueTimer;
  function toast(message) { $('shellToast').textContent=message; $('shellToast').hidden=false; clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('shellToast').hidden=true,4200); }
  function screen(name) {
    currentScreen = name; document.body.dataset.screen=name;if(name!=='game')RR_GAME.dismissNotices();
    $('sceneShell').setAttribute('aria-label',name==='cutscene'?'Prólogo animado: a viagem de Pixel':name==='tutorial'?'Tutorial em OrbitHop com Pixel':'Menu principal de Robô Ritmado em OrbitHop');
    document.querySelector('.app').inert=name!=='game';
    $('menuContent').hidden=name!=='menu'; $('cinemaUI').hidden=name!=='cutscene'; $('tutorialUI').hidden=name!=='tutorial';
    $('menuFullscreen').hidden=name!=='menu';
    $('pixelName').hidden=name!=='menu'; $('portalScene').hidden=name!=='cutscene';
    $('sceneShell').removeAttribute('data-shot'); if(name!=='cutscene')$('sceneShell').removeAttribute('data-story-world');
    $('pixelGreeting').hidden=name!=='menu';$('sayHello').hidden=name!=='menu';
    $('gameCaption').hidden=name!=='game'||!RR_SETTINGS.get().captions;
    document.querySelector('.world').hidden=name!=='game'; document.querySelector('.ambient').hidden=name!=='game';
    if(name==='menu') { $('menuResume').hidden=!RR_GAME.canResume(); if(!document.body.classList.contains('warning-pending')) RR_AUDIO.menu(); }
    else RR_AUDIO.silence();
    if(name==='tutorial') RR_AUDIO.unlock();
    if(name!=='tutorial') tutorialActive=false;
  }
  async function returnMenu() { await RR_GAME.pause(); cinemaPaused=true; screen('menu'); $('menuPlay').focus({preventScroll:true}); }
  function dismissWarning() { $('safetyDialog').close(); document.body.classList.remove('warning-pending'); if(currentScreen!=='menu')screen('menu');else RR_AUDIO.menu(); }
  function openSettings(tab='options') {
    lastFocused=document.activeElement; syncSettings(); selectTab(tab);
    document.body.classList.add('settings-open');
    if(!$('settingsDialog').open) $('settingsDialog').showModal();
    $(tab+'Tab').focus();
  }
  function closeSettings() { $('settingsDialog').close(); document.body.classList.remove('settings-open'); if(lastFocused?.isConnected) lastFocused.focus({preventScroll:true}); }
  const tabs=['options','accessibility','preferences'];
  function selectTab(tab) {
    for(const key of tabs) { const active=key===tab; $(key+'Panel').hidden=!active; $(key+'Tab').setAttribute('aria-selected',String(active)); $(key+'Tab').tabIndex=active?0:-1; }
    $('settingsTitle').textContent=$(tab+'Tab').textContent;
  }
  function syncSettings() {
    const s=RR_SETTINGS.get();
    for(const input of document.querySelectorAll('[data-setting]')) {
      const key=input.dataset.setting;
      if(key==='colorEnabled') {input.checked=s.colorMode!=='off';continue;}
      if(input.type==='checkbox') input.checked=s[key];
      else {input.value=key==='colorMode'?(s.colorMode==='off'?lastColor:s.colorMode):s[key]; const out=$('out-'+key); if(out) out.textContent=(key.endsWith('Volume')?Math.round(s[key]):Math.round(s[key]*100))+'%';}
    }
    for(const [id,on] of [['colorControls',s.colorMode!=='off'],['scaleControls',s.scaleEnabled],['motionControls',s.reduceMotion],['speedControls',s.speedEnabled]]) {
      $(id).hidden=!on; for(const input of $(id).querySelectorAll('input,select')) input.disabled=!on;
    }
  }
  for(const input of document.querySelectorAll('[data-setting]')) input.addEventListener('input',()=>{
    const key=input.dataset.setting;
    if(key==='colorEnabled') RR_SETTINGS.set('colorMode',input.checked?lastColor:'off');
    else {if(key==='colorMode') lastColor=input.value; RR_SETTINGS.set(key,input.type==='checkbox'?input.checked:input.value);}
    if(key==='device' && input.value!=='pc' && !$('rotateDialog').open) $('rotateDialog').showModal();
    if(input.type==='checkbox'||input.tagName==='SELECT')syncSettings();else{const out=$('out-'+key);if(out)out.textContent=(key.endsWith('Volume')?Math.round(Number(input.value)):Math.round(Number(input.value)*100))+'%';}
  });
  for (const [index,name] of tabs.entries()) {
    const tab=$(name+'Tab');
    tab.onclick=()=>selectTab(name);
    tab.addEventListener('keydown',event=>{
      const next={ArrowLeft:(index+2)%3,ArrowRight:(index+1)%3,Home:0,End:2}[event.key];
      if(next==null)return;
      event.preventDefault();selectTab(tabs[next]);$(tabs[next]+'Tab').focus();
    });
  }
  $('closeRotate').onclick=()=>$('rotateDialog').close();
  for(const id of ['menuFullscreen','welcomeFullscreen']) $(id).onclick=()=>$('fullscreen').click();
  $('closeSettings').onclick=closeSettings; $('doneSettings').onclick=closeSettings;
  $('settingsDialog').addEventListener('cancel',()=>{document.body.classList.remove('settings-open');setTimeout(()=>lastFocused?.focus({preventScroll:true}),0);});
  $('reviewSafety').onclick=()=>{closeSettings();document.body.classList.add('warning-pending');RR_AUDIO.menu();$('safetyDialog').showModal();};
  $('safetyAccessibility').onclick=()=>{dismissWarning();openSettings('accessibility');}; $('closeSafety').onclick=dismissWarning;
  $('safetyDialog').addEventListener('cancel',e=>{e.preventDefault();dismissWarning();});
  for(const b of document.querySelectorAll('[data-return-menu]'))b.onclick=returnMenu;
  $('phaseAccessibility').onclick=()=>openSettings('accessibility');
  $('menuOptions').onclick=()=>openSettings('options'); $('menuAccessibility').onclick=()=>openSettings('accessibility');
  $('menuAbout').onclick=()=>$('aboutDialog').showModal();
  $('gameMenu').onclick=returnMenu;
  $('gameAccessibility').onclick=async()=>{await RR_GAME.pause();openSettings('accessibility');};
  $('menuResume').onclick=async()=>{screen('game');await RR_GAME.resume();};
  $('menuSound').onclick=async()=>{await RR_AUDIO.menu(); if(RR_SETTINGS.get().menuVolume===0)openSettings('options');};
  document.addEventListener('rr-audio-status',e=>{ $('menuAudioStatus').textContent=e.detail?'· synth ambiente · 78 BPM':'· som indisponível';$('menuSound').textContent=e.detail?'♪ Ajustar som':'♪ Ativar som';$('menuSound').setAttribute('aria-label',e.detail?'Ajustar volume do menu':'Ativar som do menu');});
  $('menuSound').onclick=()=>{ if(RR_AUDIO.snapshot().state==='running')openSettings('options');else RR_AUDIO.menu(); };
  let hoverStamp=0;
  document.addEventListener('pointerover',e=>{const b=e.target.closest('button[data-cue]');if(!b||b.disabled||b.contains(e.relatedTarget))return; if(performance.now()-hoverStamp<65)return;hoverStamp=performance.now();RR_AUDIO.cue(b.dataset.cue,'hover');});
  document.addEventListener('focusin',e=>{const b=e.target.closest('button[data-cue]');if(b&&!document.body.classList.contains('warning-pending'))RR_AUDIO.cue(b.dataset.cue,'hover');});
  document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.cue)RR_AUDIO.cue(b.dataset.cue);b.classList.remove('clicked');requestAnimationFrame(()=>b.classList.add('clicked'));setTimeout(()=>b.classList.remove('clicked'),650);});

  // A real-time, layered animated prologue; manual advance and pause remain available.
  const cinema=RR_CINEMA.create($('cinemaCanvas')),shots=cinema.shots;
  let shot=0,shotElapsed=0,cinemaPaused=false,cinemaStarting=false,speechKey='';
  function renderSpeech(){
    const lines=shots[shot].lines;let index=0;for(let i=0;i<lines.length;i++)if(shotElapsed>=lines[i][2])index=i;
    const key=shot+':'+index;if(key===speechKey)return;speechKey=key;
    const [speaker,text]=lines[index],bubble=$('storyCaption');bubble.dataset.speaker=speaker;bubble.replaceChildren();
    const b=document.createElement('b');b.textContent=(speaker==='PIXEL'?'✦ ':'♫ ')+speaker;bubble.append(b,document.createTextNode(text));
    bubble.classList.remove('changed');void bubble.offsetWidth;bubble.classList.add('changed');
    $('nextCinema').textContent=shot===shots.length-1&&index===lines.length-1?'Vamos tocar! →':'Avançar →';
    $('backCinema').disabled=shot===0&&index===0;
  }
  function renderShot(){
    $('sceneShell').dataset.shot=shot;$('sceneShell').dataset.storyWorld=shots[shot].world;
    $('sceneNumber').textContent='NOSSA HISTÓRIA / '+String(shot+1).padStart(2,'0');$('scenePlace').textContent=shots[shot].name;
    $('storyAction').textContent=shots[shot].action;
    $('storyProgress').innerHTML=shots.map((_,i)=>'<span class="'+(i<=shot?'active':'')+'"></span>').join('');
    $('nextCinema').textContent=shot===shots.length-1?'Vamos tocar! →':'E depois? →';
    $('cinemaCanvas').setAttribute('aria-label',shots[shot].action);speechKey='';renderSpeech();if(!cinemaPaused)RR_AUDIO.scene(shots[shot].motion);
  }
  async function startCinema(){
    if(cinemaStarting)return;cinemaStarting=true;$('menuPlay').disabled=true;$('tutorialPlay').disabled=true;$('loadingTrip').hidden=false;
    try{await cinema.ready;RR_GAME.stop();screen('cutscene');shot=0;shotElapsed=0;cinemaPaused=false;$('sceneShell').classList.remove('cinema-paused');$('pauseCinema').textContent='Pausar cena';renderShot();$('pauseCinema').focus({preventScroll:true});}
    catch(error){toast('A viagem ainda não carregou. '+error.message);}
    finally{cinemaStarting=false;$('menuPlay').disabled=false;$('tutorialPlay').disabled=false;$('loadingTrip').hidden=true;}
  }
  async function enterAdventure() {
    if(cinemaStarting)return;cinemaStarting=true;RR_AUDIO.silence();
    try {screen('game');await RR_GAME.adventure();document.body.classList.add('phase-arriving');setTimeout(()=>document.body.classList.remove('phase-arriving'),1000);}
    catch(error){screen('menu');toast('Não foi possível iniciar a aventura: '+error.message);}
    finally{cinemaStarting=false;}
  }
  function nextShot(){if(shot===shots.length-1){enterAdventure();return;}shot++;shotElapsed=0;renderShot();}
  function advanceDialogue(){
    const next=shots[shot].lines.find(line=>line[2]>shotElapsed+.01);
    if(next){shotElapsed=next[2];renderSpeech();}
    else nextShot();
  }
  $('menuPlay').onclick=startCinema; $('nextCinema').onclick=advanceDialogue; $('skipCinema').onclick=enterAdventure;
  $('backCinema').onclick=()=>{
    const index=Number(speechKey.split(':')[1]);
    if(index>0){shotElapsed=shots[shot].lines[index-1][2];renderSpeech();}
    else if(shot>0){shot--;shotElapsed=shots[shot].lines.at(-1)[2];renderShot();}
  };
  $('pauseCinema').onclick=()=>{cinemaPaused=!cinemaPaused;$('sceneShell').classList.toggle('cinema-paused',cinemaPaused);if(cinemaPaused)RR_AUDIO.silence();else RR_AUDIO.scene(shots[shot].motion);$('pauseCinema').textContent=cinemaPaused?'Continuar cena':'Pausar cena';};

  // Learning progresses on successful input, rather than on elapsed time.
  const keys=['ArrowLeft','ArrowDown','ArrowUp','ArrowRight'], glyphs=['←','↓','↑','→'], names=['esquerda','baixo','cima','direita'];
  let tutorialPose=null;
  let lesson=0,tutorialActive=false,lessonElapsed=0,seen=new Set(),tutorialHits=0,tutorialScore=0,tutorialNote=null,feedbackUntil=0;
  const lessons=[
    'Oi! Eu sou Pixel! Vamos brincar de acertar as setas? Eu te mostro como! ♡',
    'Toque nas quatro setas. Pode usar o teclado ou os botões aqui embaixo!',
    'Agora olha só! Quando uma seta encontra a outra… PLIM! É a hora de tocar!',
    'Sua vez! Espere as setinhas se encontrarem e toque em ←. Eu espero com você!',
    'Você conseguiu! Agora vamos brincar com as quatro direções. Uma de cada vez!',
    'Uhuuul! Você já sabe! Vamos usar nossa música para encontrar o caminho de casa?'
  ];
  function dialogue(text){clearTimeout(dialogueTimer);$('tutorialDialogue').textContent=text;$('tutorialDialogue').classList.remove('reveal');requestAnimationFrame(()=>$('tutorialDialogue').classList.add('reveal'));}
  function setLesson(n) {
    tutorialPose=null;
    tutorialDirty=true;lesson=n;lessonElapsed=0;tutorialNote=null;tutorialHits=0;seen.clear();feedbackUntil=0;
    $('lessonRewards').textContent=n===5?'★★★★':'☆☆☆☆';
    $('lessonNumber').textContent=` / ${n+1} DE ${lessons.length}`;dialogue(lessons[n]);$('tutorialFeedback').textContent='';
    $('tutorialSteps').innerHTML=lessons.map((_,i)=>`<i class="${i<n?'complete':i===n?'current':''}"></i>`).join('');
    $('tutorialSteps').setAttribute('aria-label',`Etapa ${n+1} de ${lessons.length}`);
    for(const b of document.querySelectorAll('[data-tutorial-lane]'))b.dataset.seen='false';
    $('tutorialNext').hidden=n===5;$('tutorialNext').disabled=[1,2,3,4].includes(n);
    $('tutorialNext').textContent=n===0?'Começar ensaio →':n===4?'Concluir ensaio →':'Próximo passo →';
    $('tutorialPlay').hidden=n!==5;
    if(n===5){$('tutorialFeedback').textContent=`Ensaio concluído · ${tutorialScore} pontos de treino. No jogo, seu placar começa do zero.`;$('tutorialPlay').focus({preventScroll:true});}
  }
  function startTutorial(){RR_GAME.stop();screen('tutorial');tutorialActive=true;tutorialScore=0;setLesson(0);$('tutorialNext').focus({preventScroll:true});}
  $('menuTutorial').onclick=startTutorial;$('tutorialNext').onclick=()=>setLesson(Math.min(5,lesson+1));$('tutorialPlay').onclick=startCinema;$('leaveTutorial').onclick=returnMenu;
  function feedback(message){$('tutorialFeedback').textContent=message;feedbackUntil=lessonElapsed+2;$('lessonRewards').textContent='★'.repeat(Math.min(4,lesson===1?seen.size:tutorialHits))+'☆'.repeat(Math.max(0,4-(lesson===1?seen.size:tutorialHits)));}
  function tutorialInput(lane) {
    if(!tutorialActive||$('settingsDialog').open||$('safetyDialog').open)return;
    tutorialPose={lane,start:lessonElapsed};
    if(lesson===1){seen.add(lane);document.querySelector(`[data-tutorial-lane="${lane}"]`).dataset.seen='true';RR_AUDIO.hit(lane);feedback(`${seen.size} de 4 direções: ${names[lane]}!`);if(seen.size===4){$('tutorialNext').disabled=false;feedback('Aeee! Quatro estrelinhas! Vamos ao próximo passo?');RR_AUDIO.cheer();}return;}
    if(![3,4].includes(lesson)||!tutorialNote){if(lesson===2)feedback('Nesta etapa, observe o encontro. Sua vez já vem!');return;}
    const delta=Math.abs(tutorialNote.at-lessonElapsed),window=.38/RR_SETTINGS.rate();
    if(lane!==tutorialNote.lane){RR_AUDIO.hit(lane,'miss');feedback(`Vamos tentar ${glyphs[tutorialNote.lane]} ${names[tutorialNote.lane]}. A direção precisa ser igual.`);return;}
    if(delta>window){feedback('Ainda está chegando. Espere a seta encontrar o alvo.');return;}
    const points=delta<.15/RR_SETTINGS.rate()?100:60;tutorialScore+=points;tutorialHits++;RR_AUDIO.hit(lane);tutorialNote=null;document.body.classList.remove('tutorial-success');requestAnimationFrame(()=>document.body.classList.add('tutorial-success'));setTimeout(()=>document.body.classList.remove('tutorial-success'),700);
    feedback(`${points===100?'No ritmo!':'Muito bem!'} +${points} pontos · Treino: ${tutorialScore}`);
    if((lesson===3&&tutorialHits>=1)||(lesson===4&&tutorialHits>=4)){RR_AUDIO.cheer();$('tutorialNext').disabled=false;feedback(`Conseguimos! ${tutorialHits} ${tutorialHits===1?'acerto':'acertos'}. Clique em ${lesson===4?'Concluir ensaio':'Próximo passo'}.`);}
  }
  for(const b of document.querySelectorAll('[data-tutorial-lane]'))b.onclick=()=>tutorialInput(Number(b.dataset.tutorialLane));
  document.addEventListener('keydown',e=>{
    if($('settingsDialog').open||$('safetyDialog').open)return;
    if(currentScreen==='tutorial'&&keys.includes(e.key)&&!e.repeat){e.preventDefault();tutorialInput(keys.indexOf(e.key));}
    if(currentScreen==='cutscene'&&e.key==='Escape'&&!e.repeat){e.preventDefault();$('pauseCinema').click();}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&currentScreen==='cutscene'){cinemaPaused=true;$('sceneShell').classList.add('cinema-paused');$('pauseCinema').textContent='Continuar cena';}});

  const actorImage=RR_SPRITES.load('assets/pixel-padrao-v1.png').image;
  const frames=[[0,0,418,526],[427,0,367,518],[797,0,366,519],[1166,0,370,520],[0,533,445,480],[448,520,340,494],[790,533,369,480],[1160,559,376,451]];
  const actorCanvas=$('orbitPixel'),act=actorCanvas.getContext('2d'),fxCanvas=$('orbitFx'),fx=fxCanvas.getContext('2d'),tutorialCanvas=$('tutorialCanvas'),tc=tutorialCanvas.getContext('2d');
  const dims=new Map();let standardPose=null;
  RR_SPRITES.load('assets/pixel-padrao-v1.png').ready.then(im=>{standardPose=document.createElement('canvas');standardPose.width=418;standardPose.height=526;standardPose.getContext('2d').drawImage(im,0,0,418,526,0,0,418,526);});

  const menuStage=$('menuStage'),menuStageCtx=menuStage.getContext('2d'),menuStageAsset=RR_SPRITES.load('assets/palco-orbithop-v09.png');
  let menuActorBox={x:0,y:0,w:1,h:1};
  function paintMenuStage(){
    const [w,h]=dims.get(actorCanvas)||[1,1],d=RR_SETTINGS.dpr();menuStage.width=Math.round(w*d);menuStage.height=Math.round((h+120)*d);menuStageCtx.setTransform(d,0,0,d,0,0);menuStageCtx.clearRect(0,0,w,h+120);
    if(menuStageAsset.image.complete&&menuStageAsset.image.naturalWidth){const size=Math.min(w*.98,h*.84/.755);menuStageCtx.drawImage(menuStageAsset.image,w*.51-size*.5,h*.86-size*.755,size,size);}
  }
  menuStageAsset.ready.then(paintMenuStage).catch(()=>{});
  for(const canvas of [actorCanvas,fxCanvas,tutorialCanvas])new ResizeObserver(()=>{
    const b=canvas.getBoundingClientRect(),d=canvas===fxCanvas?1:Math.min(devicePixelRatio||1,1.5),w=Math.max(1,b.width),h=Math.max(1,b.height);
    canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);canvas.getContext('2d').setTransform(d,0,0,d,0,0);dims.set(canvas,[w,h]);
    if(canvas===actorCanvas){menuActorBox={x:$('orbitActor').offsetLeft,y:$('orbitActor').offsetTop,w,h};paintMenuStage();}
  }).observe(canvas);
  let last=performance.now(),elapsed=0,actorTime=0,tutorialFrozen=false;
  function actorPose(image,rect,w,h,alpha=1,sway=0){
    if(!(image instanceof HTMLCanvasElement)&&(!image.complete||!image.naturalWidth))return;
    const [sx,sy,sw,sh]=rect,scale=Math.min(w*.96/465,h*(currentScreen==='menu'?.75:.94)/530);
    act.save();act.globalAlpha=alpha;act.translate(w*.51,h*(currentScreen==='menu'?.86:.97));act.rotate(sway);act.drawImage(image,sx,sy,sw,sh,-sw*scale/2,-sh*scale,sw*scale,sh*scale);act.restore();
  }
  function renderActor(dt){
    const [w,h]=dims.get(actorCanvas)||[1,1];act.clearRect(0,0,w,h);
    const motion=RR_SETTINGS.motion();if(!(currentScreen==='cutscene'&&cinemaPaused)&&!document.hidden&&!$('settingsDialog').open)actorTime+=dt*motion;
    if(currentScreen==='cutscene'){cinema.draw(shot,shotElapsed);return;}
    if(currentScreen==='tutorial'){
      if(!actorImage.complete||!actorImage.naturalWidth)return;
      const progress=tutorialPose?(lessonElapsed-tutorialPose.start)/.4:1;
      const weight=motion?RR_PERFORMANCE.stepAmount(progress):0;
      const size=Math.min(w*.96/465,h*.94/530)*520;
      RR_PERFORMANCE.arenaPose(act,actorImage,w*.51,h*.97,size,{
        lane:tutorialPose?.lane??null,weight,previousLane:null,previousWeight:0,motion
      });
      return;
    }
    let f=0;
    if(currentScreen==='menu'&&performance.now()<greetingUntil)f=0;
    const sway=motion===0?0:Math.sin(actorTime*.7)*.009;
    // A single complete pose avoids overlapping silhouettes during slow motion.
    actorPose(standardPose||actorImage,standardPose?[0,0,418,526]:frames[f],w,h,1,sway);

  }
  const motes=Array.from({length:38},(_,i)=>({x:(i*.618033)%1,y:(i*.371)%1,s:10+(i%4)*5,speed:.018+(i%5)*.004,symbol:i%5===0?'♬':i%3===0?'♩':i%4===0?'✧':'♪'}));
  function guitarIcon(x,y,size,rot){fx.save();fx.translate(x,y);fx.rotate(rot);fx.strokeStyle='#a9daf5';fx.lineWidth=1.4;fx.beginPath();fx.ellipse(0,4,size*.24,size*.34,-.4,0,Math.PI*2);fx.stroke();fx.beginPath();fx.moveTo(2,0);fx.lineTo(size*.44,-size*.7);fx.lineTo(size*.52,-size*.65);fx.lineTo(8,6);fx.stroke();fx.restore();}
  function renderFX(){const [w,h]=dims.get(fxCanvas)||[1,1];fx.clearRect(0,0,w,h);if(RR_SETTINGS.gentle()||$('settingsDialog').open||document.body.classList.contains('warning-pending'))return;
    if(currentScreen==='menu'){const b=menuActorBox;fx.save();fx.translate(b.x,b.y);RR_PERFORMANCE.lighting(fx,{width:b.w,height:b.h,floor:b.h*.86,x:b.w*.51,colors:['#f67bda','#7edfff','#b7a1ff','#fff0be'],power:.8,beat:actorTime*.4,soft:RR_SETTINGS.gentle(),still:RR_SETTINGS.motion()===0,deluxe:true});fx.restore();}
    fx.textAlign='center';for(const [i,p] of motes.entries()){if(currentScreen==='tutorial'&&i%2)continue;const x=p.x*w+Math.sin(elapsed*.12+i)*18,y=h-((p.y+elapsed*p.speed)%1)*h;fx.globalAlpha=.15+Math.sin((y/h)*Math.PI)*.3;fx.fillStyle=i%2?'#a2d9f2':'#f3a5df';fx.font=`${p.s}px Segoe UI`;fx.fillText(p.symbol,x,y);}
    fx.globalAlpha=.28;guitarIcon(w*.84,h*.25,56,Math.sin(elapsed*.15)*.2);guitarIcon(w*.48,h*.75,33,-.7+elapsed*.03);fx.globalAlpha=1;
  }
  function tutorialArrow(x,y,lane,size,color,filled){tc.save();tc.translate(x,y);tc.rotate([Math.PI,Math.PI/2,-Math.PI/2,0][lane]);tc.beginPath();[[-.44,-.23],[.03,-.23],[.03,-.46],[.49,0],[.03,.46],[.03,.23],[-.44,.23]].forEach(([a,b],i)=>i?tc.lineTo(a*size,b*size):tc.moveTo(a*size,b*size));tc.closePath();tc.lineWidth=filled?2:3;tc.fillStyle=filled?color:'#161b32';tc.strokeStyle=color;tc.fill();tc.stroke();tc.restore();}
  let tutorialBase=null,tutorialBaseKey='',tutorialDirty=true;
  window.addEventListener('rr-settings',()=>{tutorialBaseKey='';tutorialDirty=true;});
  function renderTutorial(dt){
    if(!tutorialActive)return;const [w,h]=dims.get(tutorialCanvas)||[1,1],s=RR_SETTINGS.get(),rate=RR_SETTINGS.rate();
    tutorialFrozen=document.hidden||$('settingsDialog').open||$('safetyDialog').open;if(!tutorialFrozen)lessonElapsed+=dt;
    const colors=RR_GAME.palette(),target=h-52,laneW=w/4,size=Math.min(69*(s.scaleEnabled?s.arrowScale:1),laneW*.79),travel=3.2/rate/s.arrowSpeed;
    const key=[w,h,s.highContrast,size,...colors].join('|');
    if(key!==tutorialBaseKey){
      tutorialBaseKey=key;tutorialDirty=true;tc.clearRect(0,0,w,h);
    const board=tc.createLinearGradient(0,0,0,h);board.addColorStop(0,'#58449ac9');board.addColorStop(1,'#2b638dc9');tc.fillStyle=s.highContrast?'#000':board;tc.fillRect(0,0,w,h);

    for(let lane=0;lane<4;lane++){const x=(lane+.5)*laneW;tc.fillStyle=colors[lane]+'32';tc.fillRect(x-laneW/2+2,0,laneW-4,h);tc.strokeStyle='#ddd7ef33';tc.beginPath();tc.moveTo(x-laneW/2,0);tc.lineTo(x-laneW/2,h);tc.stroke();tutorialArrow(x,target,lane,size,colors[lane],false);tc.fillStyle='#e1e8ff';tc.font='bold 12px Trebuchet MS';tc.textAlign='center';tc.fillText(names[lane].toUpperCase(),x,h-17);}

      tutorialBase=document.createElement('canvas');tutorialBase.width=tutorialCanvas.width;tutorialBase.height=tutorialCanvas.height;tutorialBase.getContext('2d').drawImage(tutorialCanvas,0,0);
    }
    if(!tutorialNote&&![2,3,4].includes(lesson)&&!tutorialDirty)return;
    tc.clearRect(0,0,w,h);tc.drawImage(tutorialBase,0,0,w,h);tutorialDirty=false;
    const waiting=[3,4].includes(lesson)&&$('tutorialNext').disabled;
    if((lesson===2||waiting)&&!tutorialNote){const lane=lesson===2?Math.floor(lessonElapsed/4)%4:lesson===3?0:[0,1,2,3][tutorialHits];tutorialNote={lane,at:lessonElapsed+travel+.5};}
    if(tutorialNote){const n=tutorialNote,remaining=n.at-lessonElapsed,y=target-remaining*(target-20)/travel;
      if(y>-60&&y<h+60){tutorialArrow((n.lane+.5)*laneW,y,n.lane,size,colors[n.lane],true);}
      tc.fillStyle='#dce9ff';tc.font='bold 16px Trebuchet MS';tc.textAlign='center';tc.fillText(remaining>.4?`${glyphs[n.lane]} ${names[n.lane]} se aproximando`:remaining>-.38/rate?'AGORA!':'Vamos tentar de novo',w/2,26);
      if(lesson===2&&remaining<=0){RR_AUDIO.hit(n.lane);feedback('Viu? É no encontro das setas! [Sino da batida]');tutorialNote=null;if(lessonElapsed>3)$('tutorialNext').disabled=false;}
      else if(waiting&&remaining<-.38/rate){RR_AUDIO.hit(n.lane,'miss');feedback('Tudo bem! A seta volta. Espere o encontro e tente outra vez.');tutorialNote=null;}
    }
    if(lesson===0||lesson===1||lesson===5){tc.fillStyle='#ffe6a9';tc.font=`bold ${Math.min(w/21,lesson===5?25:20)}px Trebuchet MS`;tc.textAlign='center';tc.fillText(lesson===5?'✦ Você encontrou a batida!':lesson===1?'←   ↓   ↑   →':'♫ Vamos encontrar a nossa batida?',w/2,h*.42);}
  }
  let lastFxDraw=-1000,lastActorDraw=-1000;
  function frame(now){requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;
    if(currentScreen==='game'||document.hidden||$('settingsDialog').open||$('aboutDialog').open||document.body.classList.contains('warning-pending'))return;
    if(!document.hidden&&!(currentScreen==='cutscene'&&cinemaPaused))elapsed+=dt;
    if(currentScreen!=='tutorial'||now-lastActorDraw>=32){renderActor(currentScreen==='tutorial'?Math.min(.05,(now-lastActorDraw)/1000):dt);lastActorDraw=now;}if(now-lastFxDraw>=(currentScreen==='tutorial'?48:32)){renderFX();lastFxDraw=now;}renderTutorial(dt);if(currentScreen==='cutscene')renderSpeech();
    if(currentScreen==='cutscene'&&!cinemaPaused&&!document.hidden&&!$('settingsDialog').open){shotElapsed+=dt;if(shotElapsed>=shots[shot].duration)nextShot();}
  }
  document.addEventListener('pointerdown',event=>{
    const button=event.target.closest('button');if(!button||button.disabled||RR_SETTINGS.gentle()||$('safetyDialog').open)return;
    for(let i=0;i<8;i++){const star=document.createElement('i');star.className='ui-star';star.textContent=i%2?'✦':'♪';star.style.left=event.clientX+'px';star.style.top=event.clientY+'px';star.style.setProperty('--spark-x',Math.cos(i*Math.PI/4)*(30+i*4)+'px');star.style.setProperty('--spark-y',Math.sin(i*Math.PI/4)*45-20+'px');document.body.append(star);setTimeout(()=>star.remove(),850);}
  });
  // Read-only QA state: no autoplay or score mutation.
  window.RR_FRONT=Object.freeze({snapshot:()=>({screen:currentScreen,cinema:cinema.snapshot(),shotCount:shots.length,warning:$('safetyDialog').open,settings:$('settingsDialog').open,shot,shotElapsed,cinemaPaused,lesson,lessonElapsed,tutorialHits,tutorialScore,tutorialNote:tutorialNote?{...tutorialNote}:null,actorTime,actorReady:actorImage.complete&&actorImage.naturalWidth>0,settingsValue:RR_SETTINGS.get(),audio:RR_AUDIO.snapshot()})});
  window.addEventListener('rr-settings',()=>{document.body.classList.toggle('interface-enlarged',RR_SETTINGS.get().scaleEnabled&&RR_SETTINGS.get().uiScale>1.1);$('gameCaption').hidden=currentScreen!=='game'||!RR_SETTINGS.get().captions;});
  screen('menu');RR_AUDIO.silence();syncSettings();RR_SETTINGS.apply();
  $('safetyDialog').showModal();
  RR_AUDIO.menu();
  function unlockOnGesture(){
    if(currentScreen==='menu')RR_AUDIO.menu();
    document.removeEventListener('pointerdown',unlockOnGesture,true);
    document.removeEventListener('keydown',unlockOnGesture,true);
  }
  document.addEventListener('pointerdown',unlockOnGesture,true);
  document.addEventListener('keydown',unlockOnGesture,true);
  requestAnimationFrame(frame);
})();
