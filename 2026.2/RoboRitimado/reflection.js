(() => {
  'use strict';

  function create(canvas) {
    const context = canvas.getContext('2d');
    const stageCanvas = document.createElement('canvas');
    const stageContext = stageCanvas.getContext('2d');
    const label = document.getElementById('travelStatus');
    let source, chapter, shadow, done;
    let line = 0, time = 0, elapsed = 0, last = 0;
    let active = false, paused = false, loading = false, pendingSkip = false, model = {};

    function dialogue() {
      label.textContent = chapter.lines[line];
      document.getElementById('travelDestination').textContent = chapter.title;
      document.getElementById('travelAction').textContent = chapter.memory && line === 0
        ? 'Uma silhueta colossal emerge na lembrança de Pixel. A aparência permanece oculta na escuridão.'
        : 'Pixel reflete em voz alta, com a guitarra junto ao corpo.';
      document.getElementById('nextTravel').textContent = line < chapter.lines.length - 1
        ? 'Continuar diálogo →' : chapter.chapter === 10 ? 'Voltar ao resultado →' : 'Abrir o próximo caminho →';
      document.getElementById('travelOverlay').dataset.memory = String(chapter.memory && line === 0);
      document.getElementById('backTravel').disabled = line===0;
      if(!paused)RR_AUDIO.reflectionScore(chapter.chapter,line);
    }

    function draw() {
      const box = canvas.getBoundingClientRect(), width = box.width, height = box.height;
      const dpr = RR_SETTINGS.dpr();
      const mobile = width < 700, gentle = RR_SETTINGS.gentle();
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      const background = source.background, scale = Math.max(width / background.naturalWidth, height / background.naturalHeight);
      context.drawImage(background, (width - background.naturalWidth * scale) / 2,
        (height - background.naturalHeight * scale) / 2, background.naturalWidth * scale, background.naturalHeight * scale);
      const floor = height * (mobile ? .64 : .79), center = width * (mobile ? .61 : .70);
      const stageWidth = width * (mobile ? .95 : .58);
      if (stageCanvas.width !== Math.ceil(stageWidth) || stageCanvas.height !== Math.ceil(height)) {
        stageCanvas.width = Math.ceil(stageWidth); stageCanvas.height = Math.ceil(height);
      }
      RR_PERFORMANCE.platform(stageContext, { width: stageWidth, height, floor, x: stageWidth * .52,
        id: source.level.id, colors: source.level.colors, accent: source.level.accent,
        power: .65, beat: gentle ? 0 : time * .3, soft: gentle, still: gentle });
      context.drawImage(stageCanvas, center - stageWidth * .52, 0, stageWidth, height);
      const rectangle = source.level.frames[0], bodyHeight = Math.min(height * (mobile ? .40 : .57), width * .65);
      const bodyScale = bodyHeight / rectangle[3], ground = source.level.groundY || rectangle[3];
      context.save(); context.translate(center, floor);
      context.rotate(gentle ? 0 : Math.sin(time * .7) * .007);
      context.drawImage(source.sprite, ...rectangle, -rectangle[2] * bodyScale / 2,
        -ground * bodyScale, rectangle[2] * bodyScale, rectangle[3] * bodyScale);
      context.restore();

      const memory = chapter.memory && line === 0;
      if (memory && shadow?.image.naturalWidth) {
        const reveal = Math.min(1, elapsed / 3), image = shadow.image;
        context.save(); context.globalAlpha = reveal * .92;
        context.fillStyle = '#090812'; context.fillRect(0, 0, width, height);
        const halo = context.createRadialGradient(width * .42, height * .35, 0, width * .42, height * .35, height * .7);
        halo.addColorStop(0, '#523353'); halo.addColorStop(1, '#090813');
        context.globalAlpha = reveal * .55; context.fillStyle = halo; context.fillRect(0, 0, width, height);
        const size = height * 1.12, imageWidth = size * image.naturalWidth / image.naturalHeight;
        const drift = gentle ? 0 : Math.sin(time * .25) * height * .008;
        context.globalAlpha = reveal * .70;
        context.drawImage(image, width * .44 - imageWidth / 2, -height * .03 + drift, imageWidth, size);
        context.globalAlpha = reveal * .58; context.fillStyle = '#05050b'; context.fillRect(0, 0, width, height);
        context.restore();
      }
      model = { phase: 'reflection', chapter: chapter.chapter, line, text: chapter.lines[line], memory,
        time, elapsed, voluntary: true, corrupted: false, portalOpen: 0, outfit: source.level.id,
        actorFloor: floor, stageFloor: floor, actorX: center, rotation: 0 };
    }

    function finish() {
      if (!active) { if (loading) pendingSkip = true; return; }
      active = false;
      const resolve = done; done = null; resolve?.();
    }
    function advance() {
      if (!active) return;
      if (line === chapter.lines.length - 1) { finish(); return; }
      line++; elapsed = 0; dialogue(); draw();
    }
    function tick(now) {
      if (!active) return;
      const delta = Math.min(.05, (now - last) / 1000); last = now;
      if (!paused && !document.hidden) { time += delta; elapsed += delta; }
      draw();
      if (elapsed >= RR_NARRATIVE.readingTime(chapter.lines[line])) advance();
      if (active) requestAnimationFrame(tick);
    }
    document.addEventListener('visibilitychange', () => {
      if (active && document.hidden) { paused = true; document.getElementById('pauseTravel').textContent = 'Continuar cena'; }
    });
    return Object.freeze({
      async play(world, reflection) {
        source = world; chapter = reflection;
        loading = true;
        try {
          if (chapter.memory) { shadow = RR_SPRITES.load('assets/memoria-devorador-v13.png'); await shadow.ready; }
        } finally { loading = false; }
        if (pendingSkip) { pendingSkip = false; return; }
        line = 0; elapsed = 0; time = 0; paused = false; active = true; last = performance.now();
        document.getElementById('pauseTravel').textContent = 'Pausar cena'; dialogue();
        return new Promise(resolve => { done = resolve; draw(); requestAnimationFrame(tick); });
      },
      toggle() { if (active) { paused = !paused; document.getElementById('pauseTravel').textContent = paused ? 'Continuar cena' : 'Pausar cena'; if(paused)RR_AUDIO.silence();else dialogue(); } },
      back() { if(active&&line>0){line--;elapsed=0;dialogue();draw();} },
      advance, finish,
      snapshot: () => ({ ...model, active, paused })
    });
  }
  window.RR_REFLECTION = Object.freeze({ create });
})();
