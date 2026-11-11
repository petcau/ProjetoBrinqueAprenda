/* História automática em tela cheia; dados e contrato de saída preservados. */
window.IntroStory = (() => {
  'use strict';
  const INTRO_SEEN_STORAGE_KEY = 'ilha.introSeen';
  let memoryIntroSeen = false;

  function hasSeenIntro() {
    try {
      const raw = localStorage.getItem(INTRO_SEEN_STORAGE_KEY);
      if (raw === 'true') return true;
    } catch {}
    return memoryIntroSeen;
  }

  function markIntroSeen() {
    memoryIntroSeen = true;
    try {
      localStorage.setItem(INTRO_SEEN_STORAGE_KEY, 'true');
    } catch {}
  }

  function resetSeenForTest() {
    memoryIntroSeen = false;
    try {
      localStorage.removeItem(INTRO_SEEN_STORAGE_KEY);
    } catch {}
  }

  function getObjectiveRegions() {
    const regions = window.ISLAND_REGIONS || [];
    const findName = (id, fallback) => {
      const found = regions.find(r => r.id === id);
      return found ? found.name : fallback;
    };
    return [
      { id: 'forest', colorKey: 'green', fill: '#22c55e', stroke: '#14532d', label: 'Chave verde', regionName: findName('forest', 'Floresta dos Padrões') },
      { id: 'village', colorKey: 'blue', fill: '#38bdf8', stroke: '#0c4a6e', label: 'Chave azul', regionName: findName('village', 'Aldeia do Saber') },
      { id: 'ruins', colorKey: 'red', fill: '#ef4444', stroke: '#7f1d1d', label: 'Chave vermelha', regionName: findName('ruins', 'Ruínas das Formas') },
      { id: 'farm', colorKey: 'yellow', fill: '#facc15', stroke: '#713f12', label: 'Chave amarela', regionName: findName('farm', 'Campos Contados') }
    ];
  }

  const PAGES = Object.freeze([
    // PÁGINA 1 (2 painéis: intro-01 e intro-01b)
    {
      id: 'hq-page-1',
      pageNumber: 1,
      layout: 'layout-p1',
      panels: [
        {
          id: 'panel-a',
          sceneId: 'intro-01',
          src: 'intro/intro-01.webp',
          alt: 'Quarto tranquilo à noite: a menina estuda na escrivaninha, o gato dorme na cama e um livro antigo brilha na estante.',
          tilt: -0.6,
          miniPanel: null
        },
        {
          id: 'panel-b',
          sceneId: 'intro-01b',
          src: 'intro/slide2_livro.png',
          alt: 'O livro antigo flutua e cresce com brilho mágico diante da estante.',
          tilt: 0.7,
          miniPanel: {
            src: 'intro/hq-livro-sorriso.webp',
            alt: 'Detalhe do Livro Malvado abrindo um sorriso travesso.',
            pos: 'pos-bottom-right'
          }
        }
      ],
      steps: [
        {
          id: 'p1-s1',
          kind: 'panel',
          panelId: 'panel-a',
          sfx: ['sfx-painel'],
          announce: 'Painel 1: Quarto tranquilo à noite.'
        },
        {
          id: 'p1-s2',
          kind: 'caption',
          panelId: 'panel-a',
          speaker: 'Narrador',
          text: 'Numa noite tranquila, uma menina estudava ao lado do seu gatinho…',
          pos: 'pos-top-left',
          sfx: ['sfx-balao']
        },
        {
          id: 'p1-s3',
          kind: 'caption',
          panelId: 'panel-a',
          speaker: 'Narrador',
          text: 'Mas, na estante, um livro muito antigo estava acordando…',
          pos: 'pos-bottom-center',
          sfx: ['sfx-balao']
        },
        {
          id: 'p1-s4',
          kind: 'panel',
          panelId: 'panel-b',
          sfx: ['sfx-painel', 'sfx-livro-acorda'],
          announce: 'Painel 2: O livro antigo flutua e cresce!'
        },
        {
          id: 'p1-s5',
          kind: 'sfx',
          panelId: 'panel-b',
          text: 'FUUUSH!',
          pos: 'sfx-pos-book-left',
          rotate: -8,
          sfx: []
        },
        {
          id: 'p1-s6',
          kind: 'caption',
          panelId: 'panel-b',
          speaker: 'Narrador',
          text: 'O livro acordou… e começou a crescer!',
          pos: 'pos-top-right',
          sfx: ['sfx-balao']
        }
      ]
    },

    // PÁGINA 2 (3 painéis: intro-02, intro-02b e intro-03)
    {
      id: 'hq-page-2',
      pageNumber: 2,
      layout: 'layout-p2',
      panels: [
        {
          id: 'panel-c',
          sceneId: 'intro-02',
          src: 'intro/intro-02.webp',
          alt: 'O Livro Malvado abre um portal brilhante no quarto enquanto a menina e o gato se assustam.',
          tilt: -0.5,
          miniPanel: {
            src: 'intro/hq-rosto-menina.webp',
            alt: 'Rosto surpreso da menina.',
            pos: 'pos-bottom-right'
          }
        },
        {
          id: 'panel-d',
          sceneId: 'intro-02b',
          src: 'intro/intro-02b.webp',
          alt: 'O Livro Malvado puxa o gatinho laranja no ar em direção ao portal.',
          tilt: 0.6,
          miniPanel: {
            src: 'intro/hq-gato-susto.webp',
            alt: 'Gatinho assustado sendo puxado pela magia.',
            pos: 'pos-bottom-left'
          }
        },
        {
          id: 'panel-e',
          sceneId: 'intro-03',
          src: 'intro/intro-03.webp',
          alt: 'A menina salta em direção ao portal para tentar alcançar o gatinho.',
          tilt: -0.4,
          miniPanel: {
            src: 'intro/hq-pulo.webp',
            alt: 'Detalhe do salto da menina rumo ao portal.',
            pos: 'pos-bottom-right'
          }
        }
      ],
      steps: [
        {
          id: 'p2-s1',
          kind: 'panel',
          panelId: 'panel-c',
          sfx: ['sfx-painel'],
          announce: 'Página 2, Painel 1: O Livro Malvado abre um portal.'
        },
        {
          id: 'p2-s2',
          kind: 'bubble',
          panelId: 'panel-c',
          speaker: 'Livro Malvado',
          theme: 'villain',
          text: 'Hehehe! Há muito tempo eu espero por isso!',
          pos: 'pos-top-right',
          tail: 'tail-down-left',
          sfx: ['sfx-balao', 'sfx-risada-livro']
        },
        {
          id: 'p2-s3',
          kind: 'bubble',
          panelId: 'panel-c',
          speaker: 'Menina',
          theme: 'girl',
          text: 'O que está acontecendo?!',
          pos: 'pos-top-left',
          tail: 'tail-down',
          sfx: ['sfx-balao']
        },
        {
          id: 'p2-s4',
          kind: 'panel',
          panelId: 'panel-d',
          sfx: ['sfx-painel', 'sfx-portal'],
          announce: 'Painel 2: O portal puxa o gatinho.'
        },
        {
          id: 'p2-s5',
          kind: 'sfx',
          panelId: 'panel-d',
          text: 'ZUUUM!',
          pos: 'sfx-pos-portal',
          rotate: -6,
          sfx: []
        },
        {
          id: 'p2-s6',
          kind: 'bubble',
          panelId: 'panel-d',
          speaker: 'Livro Malvado',
          theme: 'villain',
          text: 'Esse gatinho agora é meu!',
          pos: 'pos-bottom-right',
          tail: 'tail-up',
          sfx: ['sfx-balao']
        },
        {
          id: 'p2-s7',
          kind: 'bubble',
          panelId: 'panel-d',
          speaker: 'Gato',
          theme: 'cat',
          text: 'Miaaau!',
          pos: 'pos-top-center',
          tail: 'tail-down',
          sfx: ['sfx-balao', 'sfx-miau']
        },
        {
          id: 'p2-s8',
          kind: 'panel',
          panelId: 'panel-e',
          sfx: ['sfx-painel', 'sfx-pulo'],
          announce: 'Painel 3: A menina pula atrás do gato.'
        },
        {
          id: 'p2-s9',
          kind: 'sfx',
          panelId: 'panel-e',
          text: 'HUP!',
          pos: 'sfx-pos-feet',
          rotate: -10,
          sfx: []
        },
        {
          id: 'p2-s10',
          kind: 'bubble',
          panelId: 'panel-e',
          speaker: 'Menina',
          theme: 'girl',
          text: 'Meu gato! Devolve ele!',
          pos: 'pos-top-left',
          tail: 'tail-down-right',
          sfx: ['sfx-balao']
        }
      ]
    },

    // PÁGINA 3 (2 painéis: intro-04 e intro-05)
    {
      id: 'hq-page-3',
      pageNumber: 3,
      layout: 'layout-p3',
      panels: [
        {
          id: 'panel-f',
          sceneId: 'intro-04',
          src: 'intro/intro-04.webp',
          alt: 'A menina sai do portal no céu e cai em direção a uma ilha mágica.',
          tilt: -0.6,
          miniPanel: null
        },
        {
          id: 'panel-g',
          sceneId: 'intro-05',
          src: 'intro/intro-05.webp',
          alt: 'A menina aterrissa sentada na Praça do Portal da ilha entre nuvens de poeira.',
          tilt: 0.6,
          miniPanel: null
        }
      ],
      steps: [
        {
          id: 'p3-s1',
          kind: 'panel',
          panelId: 'panel-f',
          sfx: ['sfx-painel', 'sfx-queda'],
          announce: 'Página 3, Painel 1: A menina cai pelo céu sobre a ilha.'
        },
        {
          id: 'p3-s2',
          kind: 'sfx',
          panelId: 'panel-f',
          text: 'AAAAH!',
          pos: 'sfx-pos-sky-left',
          rotate: -9,
          sfx: []
        },
        {
          id: 'p3-s3',
          kind: 'caption',
          panelId: 'panel-f',
          speaker: 'Narrador',
          text: 'A menina pulou atrás do gato… e caiu em uma ilha mágica!',
          pos: 'pos-bottom-left',
          sfx: ['sfx-balao']
        },
        {
          id: 'p3-s4',
          kind: 'panel',
          panelId: 'panel-g',
          sfx: ['sfx-painel', 'sfx-puf'],
          announce: 'Painel 2: A menina cai sentada na praça da ilha.'
        },
        {
          id: 'p3-s5',
          kind: 'sfx',
          panelId: 'panel-g',
          text: 'PUF!',
          pos: 'sfx-pos-dust-left',
          rotate: -7,
          sfx: []
        },
        {
          id: 'p3-s6',
          kind: 'bubble',
          panelId: 'panel-g',
          speaker: 'Menina',
          theme: 'girl',
          text: 'Ai! Onde eu estou?',
          pos: 'pos-top-right',
          tail: 'tail-down-left',
          sfx: ['sfx-balao']
        }
      ]
    },

    // PÁGINA 4 (2 painéis: intro-06 e intro-07)
    {
      id: 'hq-page-4',
      pageNumber: 4,
      layout: 'layout-p4',
      panels: [
        {
          id: 'panel-h',
          sceneId: 'intro-06',
          src: 'intro/intro-06.webp',
          alt: 'O Livro Malvado flutua diante da montanha onde o gato está preso com 4 cadeados.',
          tilt: -0.4,
          miniPanel: {
            src: 'intro/hq-gato-preso.webp',
            alt: 'Detalhe do gatinho preso atrás dos 4 cadeados coloridos no Pico do Miau.',
            pos: 'pos-top-right'
          }
        },
        {
          id: 'panel-i',
          sceneId: 'intro-07',
          src: 'intro/intro-07.webp',
          alt: 'Visão geral da Ilha do Conhecimento com as 4 chaves brilhando nos 4 cantos e os 4 cadeados no Pico do Miau.',
          tilt: 0.5,
          hasKeyLockGlow: true,
          miniPanel: {
            src: 'intro/hq-menina-determinada.webp',
            alt: 'A menina olha determinada para a montanha pronta para a aventura.',
            pos: 'pos-bottom-right'
          }
        }
      ],
      steps: [
        {
          id: 'p4-s1',
          kind: 'panel',
          panelId: 'panel-h',
          sfx: ['sfx-painel', 'sfx-cadeado'],
          announce: 'Página 4, Painel 1: O Livro Malvado mostra o gato preso no alto do Pico do Miau.'
        },
        {
          id: 'p4-s2',
          kind: 'bubble',
          panelId: 'panel-h',
          speaker: 'Livro Malvado',
          theme: 'villain',
          text: 'Bem-vinda à Ilha do Conhecimento! Seu gato está preso lá no alto, no Pico do Miau.',
          pos: 'pos-top-left',
          tail: 'tail-right',
          sfx: ['sfx-balao']
        },
        {
          id: 'p4-s3',
          kind: 'bubble',
          panelId: 'panel-h',
          speaker: 'Livro Malvado',
          theme: 'villain',
          text: 'Para libertá-lo, você precisa vencer todos os desafios da ilha!',
          pos: 'pos-bottom-left',
          tail: 'tail-up-right',
          sfx: ['sfx-balao']
        },
        {
          id: 'p4-s4',
          kind: 'panel',
          panelId: 'panel-i',
          sfx: ['sfx-painel'],
          announce: 'Painel 2: Os quatro cantos da ilha brilham com as quatro chaves.'
        },
        {
          id: 'p4-s5',
          kind: 'caption',
          panelId: 'panel-i',
          speaker: 'Livro Malvado',
          theme: 'villain-caption',
          text: 'Ele está trancado com 4 cadeados! Cada chave está escondida em um canto da ilha.',
          pos: 'pos-bottom-left',
          glowKeysLocks: true,
          sfx: ['sfx-balao', 'sfx-cadeado']
        },
        {
          id: 'p4-s6',
          kind: 'caption',
          panelId: 'panel-i',
          speaker: 'Narrador',
          text: 'Explore os 4 cantos da ilha, resolva os desafios, ache as 4 chaves e salve o gato!',
          pos: 'pos-top-center',
          sfx: ['sfx-balao']
        }
      ]
    },

    // PÁGINA 5 — CARTÃO FINAL "SEU OBJETIVO"
    {
      id: 'hq-page-final',
      pageNumber: 5,
      isFinalCard: true,
      layout: 'layout-final',
      panels: [],
      steps: [
        {
          id: 'p5-s1',
          kind: 'final-card',
          sfx: ['sfx-pagina'],
          announce: 'Seu objetivo: Ache as 4 chaves, abra os 4 cadeados e salve o gato!'
        }
      ]
    }
  ]);

  // Lista plana de referências às cenas para compatibilidade de inspeção
  // Frases curtas; textoOriginal permite restaurar cada slide sem perder a história anterior.
  const SCENES = Object.freeze([
    { id: "intro-01", src: "intro/intro-01.webp",
      text: "A menina estuda com seu gato e um livro acorda.", textoOriginal: "Numa noite tranquila, uma menina estudava ao lado do seu gatinho… Mas, na estante, um livro muito antigo estava acordando…" },
    { id: "intro-01b", src: "intro/slide2_livro.png",
      text: "O livro acorda e fica bem grande.", textoOriginal: "FUUUSH! O livro acordou… e começou a crescer!" },
    { id: "intro-02", src: "intro/intro-02.webp",
      text: "O Livro Malvado abre um portal perto do gato.", textoOriginal: "Hehehe! Há muito tempo eu espero por isso! O que está acontecendo?!" },
    { id: "intro-02b", src: "intro/intro-02b.webp",
      text: "O Livro Malvado pega o gato.", textoOriginal: "ZUUUM! Esse gatinho agora é meu! Miaaau!" },
    { id: "intro-03", src: "intro/intro-03.webp",
      text: "A menina pula no portal para buscar seu gato.", textoOriginal: "HUP! Meu gato! Devolve ele!" },
    { id: "intro-04", src: "intro/intro-04.webp",
      text: "A menina segue o gato pelo portal até a ilha.", textoOriginal: "AAAAH! A menina pulou atrás do gato… e caiu em uma ilha mágica!" },
    { id: "intro-05", src: "intro/intro-05.webp",
      text: "A menina chega à Ilha do Conhecimento.", textoOriginal: "PUF! Ai! Onde eu estou?" },
    { id: "intro-06", src: "intro/intro-06.webp",
      text: "O gato está numa cela com 4 cadeados no alto da montanha.", textoOriginal: "Bem-vinda à Ilha do Conhecimento! Seu gato está preso lá no alto, no Pico do Miau. Para libertá-lo, você precisa vencer todos os desafios da ilha!" },
    { id: "intro-07", src: "intro/intro-07.webp",
      text: "Ache 4 chaves na floresta, vila, ruínas e fazenda.", textoOriginal: "Ele está trancado com 4 cadeados! Cada chave está escondida em um canto da ilha. Explore os 4 cantos da ilha, resolva os desafios, ache as 4 chaves e salve o gato!" },
    { id: "intro-final", src: "intro/intro-07.webp",
      text: "Solte o gato com as chaves e voltem para casa.", textoOriginal: "Seu objetivo. Floresta dos Padrões. Aldeia do Saber. Ruínas das Formas. Campos Contados. Ache as 4 chaves → abra os 4 cadeados → salve o gato!" , isFinalCard: true },
  ]);

  let active = false, root, canvas, ctx, skip, live, callback, returnFocus;
  let slides = [], index = 0, elapsed = 0, fade = 0, ending = '', raf = 0, last = 0;
  let width = 0, height = 0, fontSize = 0, margin = 0;
  function prepare(i) {
    const slide = slides[i];
    if (!slide || slide.image) return;
    const image = slide.image = new Image();
    image.onload = () => {
      if (!active || slide.image !== image) return;
      if (INTRO_FIT === 'contain-blur') {
        const bg = slide.bg = document.createElement('canvas');
        bg.width = 64; bg.height = Math.max(1, Math.round(64 * image.naturalHeight / image.naturalWidth));
        const b = bg.getContext('2d');
        b.filter = 'blur(3px)'; b.drawImage(image, -4, -4, bg.width + 8, bg.height + 8);
      }
      layoutImage(slide);
    };
    image.onerror = () => { if (active && slide.image === image) console.warn('Imagem da intro ausente:', slide.src); };
    layout(slide); image.src = slide.src;
  }
  function layout(slide) {
    const words = slide.text.split(/\s+/); let size = fontSize;
    // Em retrato, reduz apenas o necessário para manter o texto inteiro na área disponível.
    do {
      slide.lines.length = 0; slide.font = '700 ' + size + 'px ' + getComputedStyle(root).fontFamily;
      ctx.font = slide.font; slide.lineHeight = size * 1.25; slide.fontSize = size;
      let line = '';
      for (const word of words) {
        const candidate = line ? line + ' ' + word : word;
        if (line && ctx.measureText(candidate).width > width - margin * 2) {
          slide.lines.push(line); line = word;
        } else line = candidate;
      }
      if (line) slide.lines.push(line);
      if (slide.lines.length * slide.lineHeight + size < height * (1 - 2 * INTRO_TEXT_SAFE_MARGIN) - 52 || size <= 16) break;
      size = Math.max(16, size - 1);
    } while (true);
    layoutImage(slide);
  }
  function layoutImage(slide) {
    const image = slide.image;
    if (!image?.naturalWidth) return;
    // Cover usa o maior fator para preencher; contain usa o menor para preservar as bordas.
    const ratioX = width / image.naturalWidth, ratioY = height / image.naturalHeight;
    const s = INTRO_FIT === 'cover' ? Math.max(ratioX, ratioY) : Math.min(ratioX, ratioY);
    slide.w = image.naturalWidth * s; slide.h = image.naturalHeight * s;
    slide.x = (width - slide.w) / 2; slide.y = (height - slide.h) / 2;
    if (slide.bg) {
      const bs = Math.max(width / slide.bg.width, height / slide.bg.height);
      slide.bw = slide.bg.width * bs; slide.bh = slide.bg.height * bs;
    }
  }
  function resize() {
    const rect = root.getBoundingClientRect(); width = canvas.width = Math.max(1, Math.round(rect.width));
    height = canvas.height = Math.max(1, Math.round(rect.height));
    margin = width * INTRO_TEXT_SAFE_MARGIN; fontSize = Math.max(16, height * 0.045);
    ctx.imageSmoothingEnabled = false;
    for (const slide of slides) if (slide.image) layout(slide);
  }
  function enter() {
    elapsed = 0; fade = 0; prepare(index); prepare(index + 1);
    live.textContent = slides[index].text;
    if (INTRO_SLIDE_SFX && index > 0) window.IntroAudio?.sfx(index === slides.length - 1 ? 'final' : 'slide');
  }
  function drawSlide(slide, alpha) {
    ctx.globalAlpha = alpha; ctx.fillStyle = '#101018'; ctx.fillRect(0, 0, width, height);
    if (slide.bg) ctx.drawImage(slide.bg, (width - slide.bw) / 2, (height - slide.bh) / 2, slide.bw, slide.bh);
    if (slide.image?.naturalWidth) ctx.drawImage(slide.image, slide.x, slide.y, slide.w, slide.h);
    const lineHeight = slide.lineHeight, fontSize = slide.fontSize;
    const block = slide.lines.length * lineHeight, bottom = height * INTRO_TEXT_SAFE_MARGIN + 52;
    const top = height - bottom - block - fontSize;
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, top, width, block + fontSize);
    ctx.fillStyle = '#fff'; ctx.font = slide.font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let n = 0; n < slide.lines.length; n++) ctx.fillText(slide.lines[n], width / 2, top + fontSize / 2 + (n + 0.5) * lineHeight);
  }
  function finish(reason) {
    if (!active) return;
    active = false; cancelAnimationFrame(raf); window.IntroAudio?.dispose();
    document.removeEventListener('keydown', key, true); document.removeEventListener('keyup', keyup, true);
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('resize', resize); window.removeEventListener('orientationchange', resize);
    skip.removeEventListener('click', skipClick);
    for (const slide of slides) {
      if (slide.image) slide.image.onload = slide.image.onerror = null;
      slide.image = slide.bg = null; slide.lines.length = 0;
    }
    slides.length = 0; root.remove(); root = canvas = ctx = skip = live = null;
    const cb = callback, focus = returnFocus; callback = returnFocus = null;
    if (cb) cb(reason); else focus?.focus();
  }
  function skipClick() { if (!ending) { ending = 'skip'; fade = 0; window.IntroAudio?.stopMusic(600); } }
  function key(event) {
    event.stopImmediatePropagation();
    if (event.key === 'Tab') { event.preventDefault(); skip.focus(); }
    if (event.key === 'Escape' || event.key === ' ' || event.key === 'Enter') {
      event.preventDefault(); if (!event.repeat) skipClick();
    }
  }
  function keyup(event) { event.stopImmediatePropagation(); }
  function visibility() { last = 0; }
  function loop(now) {
    if (!active) return;
    const dt = document.hidden || !last ? 0 : Math.max(0, Math.min(50, now - last)); last = now;
    window.IntroAudio?.update(dt / 1000);
    const slide = slides[index];
    if (!ending && index === slides.length - 1 && elapsed >= slide.duration && fade === 0) window.IntroAudio?.stopMusic(600);
    if (ending || elapsed >= slide.duration) fade += dt; else elapsed += dt;
    const fadeMs = ending === 'skip' ? Math.min(200, INTRO_FADE_MS) : INTRO_FADE_MS;
    const alpha = Math.min(1, Math.max(0, fade / Math.max(1, fadeMs)));
    ctx.globalAlpha = 1; ctx.fillStyle = '#101018'; ctx.fillRect(0, 0, width, height);
    drawSlide(slide, 1);
    if (ending || index === slides.length - 1) {
      ctx.globalAlpha = alpha; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height);
      skip.style.opacity = 1 - alpha;
    } else if (fade > 0) drawSlide(slides[index + 1], alpha);
    if (alpha >= 1) {
      if (ending || index === slides.length - 1) { if (fade < 600) { raf = requestAnimationFrame(loop); return; } finish(ending || 'complete'); return; }
      const previous = slides[index++];
      if (previous.image) previous.image.onload = previous.image.onerror = null;
      previous.image = previous.bg = null; previous.lines.length = 0; enter();
    }
    raf = requestAnimationFrame(loop);
  }
  function play(onFinish) {
    if (active) { callback = null; finish('close'); }
    window.IntroAudio?.init(); window.IntroAudio?.playMusic(INTRO_MUSIC_FILE_PRESENT ? INTRO_MUSIC_SRC : null);
    callback = typeof onFinish === 'function' ? onFinish : null; returnFocus = document.activeElement;
    for (const scene of SCENES) slides.push({src: scene.src, text: scene.text, duration: scene.duration, lines: []});
    // Duração proporcional ao texto, limitada para permitir leitura sem alongar demais cada cena.
    for (const slide of slides) slide.duration ??= Math.max(INTRO_MIN_MS, Math.min(INTRO_MAX_MS, slide.text.length * INTRO_MS_PER_CHAR));
    root = document.createElement('section'); root.id = 'intro-story-screen'; root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'História inicial');
    canvas = document.createElement('canvas'); canvas.setAttribute('aria-hidden', 'true'); ctx = canvas.getContext('2d');
    skip = document.createElement('button'); skip.type = 'button'; skip.textContent = INTRO_SKIP_LABEL;
    skip.id = 'intro-skip-btn'; live = document.createElement('p'); live.className = 'intro-live';
    live.setAttribute('aria-live', 'polite'); live.setAttribute('aria-atomic', 'true');
    root.append(canvas, live, skip); document.body.appendChild(root);
    active = true; index = 0; last = 0; ending = ''; markIntroSeen(); resize(); enter();
    skip.addEventListener('click', skipClick); document.addEventListener('keydown', key, true);
    document.addEventListener('keyup', keyup, true); document.addEventListener('visibilitychange', visibility);
    window.addEventListener('resize', resize); window.addEventListener('orientationchange', resize);
    skip.focus(); raf = requestAnimationFrame(loop);
  }
  return { PAGES, SCENES, play, close: () => finish('close'), hasSeenIntro, markIntroSeen, resetSeenForTest,
    get active() { return active; }, get sceneIndex() { return index; }, get pageIndex() { return index; },
    get isTyping() { return false; }, get skipVisible() { return active; } };
})();
