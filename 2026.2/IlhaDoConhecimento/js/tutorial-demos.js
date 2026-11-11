/* Motor de Demonstração Interativo e Registro de Demos (Ilha do Conhecimento).
   Executa vinhetas animadas roteirizadas dentro do furo da moldura (815 x 526 px),
   utilizando os assets reais do puzzle, sem bibliotecas e compatível com file://. */
window.TutorialDemos = (() => {
  'use strict';

  const STAGE_W = 815;
  const STAGE_H = 526;

  // Constantes de ancoragem da mão (fração da dimensão da sprite)
  const MAO_PONTA_X = { apontando: 0.19, pressionando: 0.38 };
  const MAO_PONTA_Y = { apontando: 0.02, pressionando: 0.10 };

  // Escala comum para as duas poses da mão no palco
  const MAO_ESCALA = 0.18; // ~69x77 px na tela

  // Registro de demos
  const registry = {};

  // Cache de imagens carregadas
  const imageCache = {};

  function loadImage(src) {
    if (imageCache[src]) return imageCache[src];
    if (typeof Image === 'undefined') return Promise.resolve(null);
    const p = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn(`[TutorialDemos] Falha ao carregar imagem: ${src}`);
        resolve(null);
      };
      img.src = src;
    });
    imageCache[src] = p;
    return p;
  }

  // Funções de easing suaves
  const ease = {
    linear: t => t,
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeOutCubic: t => (--t) * t * t + 1,
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeOutBack: t => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    easeOutBounce: t => {
      const n1 = 7.5625;
      const d1 = 2.75;
      if (t < 1 / d1) {
        return n1 * t * t;
      } else if (t < 2 / d1) {
        return n1 * (t -= 1.5 / d1) * t + 0.75;
      } else if (t < 2.5 / d1) {
        return n1 * (t -= 2.25 / d1) * t + 0.9375;
      } else {
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
      }
    }
  };

  function isCalmMotion() {
    return Boolean(window.GameSettings?.calm) ||
      (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  // Desenha a mão com ancoragem alinhada no ponto de clique
  function drawHand(ctx, imgs, pose, targetX, targetY, opacity = 1) {
    if (opacity <= 0) return;
    const img = (pose === 'pressionando') ? imgs.maoPressionando : imgs.maoApontando;
    if (!img) return;

    const w = img.naturalWidth || (pose === 'pressionando' ? 364 : 386);
    const h = img.naturalHeight || (pose === 'pressionando' ? 386 : 429);
    const dw = w * MAO_ESCALA;
    const dh = h * MAO_ESCALA;

    const anchorX = MAO_PONTA_X[pose] || 0.19;
    const anchorY = MAO_PONTA_Y[pose] || 0.02;

    const drawX = targetX - dw * anchorX;
    const drawY = targetY - dh * anchorY;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, drawX, drawY, dw, dh);
    ctx.restore();
  }

  // Desenha o anel de toque animado (toque-1 -> toque-2 -> toque-3 com opacidade decrescente)
  function drawTouchRing(ctx, imgs, x, y, progress) {
    if (progress <= 0 || progress >= 1) return;
    let ringImg = imgs.toque1;
    let alpha = 1.0;
    let size = 36;

    if (progress < 0.33) {
      ringImg = imgs.toque1;
      alpha = 1.0 - (progress / 0.33) * 0.2;
      size = 32 + (progress / 0.33) * 8;
    } else if (progress < 0.66) {
      ringImg = imgs.toque2;
      alpha = 0.8 - ((progress - 0.33) / 0.33) * 0.3;
      size = 40 + ((progress - 0.33) / 0.33) * 10;
    } else {
      ringImg = imgs.toque3;
      alpha = 0.5 - ((progress - 0.66) / 0.34) * 0.5;
      size = 50 + ((progress - 0.66) / 0.34) * 12;
    }

    if (!ringImg) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(ringImg, x - size / 2, y - size / 2, size, size);
    ctx.restore();
  }

  // Desenha o selo com animação de pop
  function drawSeal(ctx, imgs, tipo, x, y, scale = 1, alpha = 1) {
    if (alpha <= 0 || scale <= 0) return;
    const img = (tipo === 'erro') ? imgs.seloErro : (tipo === 'reiniciar') ? imgs.seloReiniciar : imgs.seloCerto;
    if (!img) return;

    // Selo pequeno: ~8% da largura do palco (815 * 0.08 ≈ 65 px)
    const baseSize = 65;
    const size = baseSize * scale;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    ctx.restore();
  }

  // Desenha estrelinhas de brilho
  function drawSparkle(ctx, imgs, level, x, y, size = 32, alpha = 1) {
    if (alpha <= 0) return;
    const img = (level === 1) ? imgs.brilho1 : (level === 2) ? imgs.brilho2 : imgs.brilho3;
    if (!img) return;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    ctx.restore();
  }

  /* -------------------------------------------------------------
     DEMONSTRAÇÃO DE ÁLGEBRA: A Balança Misteriosa
     Roteiro:
       0.0s       Balança inclinada (lado esquerdo mais pesado, 3 rubis vs 1 rubi)
       0.8s       Mão aparece como mao-apontando perto da bandeja de joias
       1.4s       Mão alcança a safira certa; toque e pressão (mao-pressionando); joia levanta com pop
       2.4s       Arrasta a safira em arco até o prato direito (prato direito destaca ao receber)
       3.6s       Solta a safira no prato direito com quique; balança começa a nivelar
       6.0s       Balança perfeitamente nivelada; selo "certo" e brilho
       7.0s-8.5s  Pausa de 1.5s com balança equilibrada antes de reiniciar o ciclo
  ------------------------------------------------------------- */
  registry['algebra-balanca'] = {
    async loadAssets() {
      const [
        fundo, coluna, prato, corrente, travessaFrames, bandeja, rubi, safira,
        maoApontando, maoPressionando, toque1, toque2, toque3,
        seloCerto, seloErro, seloReiniciar, brilho1, brilho2, brilho3
      ] = await Promise.all([
        loadImage('assets/puzzles/algebra/fundo_vila.png'),
        loadImage('assets/puzzles/algebra/coluna.png'),
        loadImage('assets/puzzles/algebra/prato.png'),
        loadImage('assets/puzzles/algebra/corrente.png'),
        loadImage('assets/puzzles/algebra/travessa_frames.png'),
        loadImage('assets/puzzles/algebra/bandeja.png'),
        loadImage('assets/puzzles/algebra/rubi.png'),
        loadImage('assets/puzzles/algebra/safira.png'),
        loadImage('assets/tutorial/mao-apontando.webp'),
        loadImage('assets/tutorial/mao-pressionando.webp'),
        loadImage('assets/tutorial/toque-1.webp'),
        loadImage('assets/tutorial/toque-2.webp'),
        loadImage('assets/tutorial/toque-3.webp'),
        loadImage('assets/tutorial/selo-certo.webp'),
        loadImage('assets/tutorial/selo-erro.webp'),
        loadImage('assets/tutorial/selo-reiniciar.webp'),
        loadImage('assets/tutorial/brilho-1.webp'),
        loadImage('assets/tutorial/brilho-2.webp'),
        loadImage('assets/tutorial/brilho-3.webp')
      ]);

      return {
        fundo, coluna, prato, corrente, travessaFrames, bandeja, rubi, safira,
        maoApontando, maoPressionando, toque1, toque2, toque3,
        seloCerto, seloErro, seloReiniciar, brilho1, brilho2, brilho3
      };
    },

    create(canvas, assets) {
      const ctx = canvas.getContext('2d');
      canvas.width = STAGE_W;
      canvas.height = STAGE_H;

      // Geometria da balança baseada no Balanca.create() original
      const layout = (typeof window.ALGEBRA_LAYOUT_LOCAL !== 'undefined')
        ? window.ALGEBRA_LAYOUT_LOCAL
        : {
            escala_jogo: 0.49,
            montagem_validada: {
              base_da_coluna: [512, 428],
              pivo_acima_do_topo_px: 18,
              queda_da_corrente_px: 105,
              grade_prato: { colunas_x: [-40, -13, 13, 40], linhas_y: [0, 20] }
            },
            coluna: { topo_cap: [118, 42] },
            prato: { anel_esq: [70, 20], anel_dir: [337, 20], centro_itens: [203.5, 43] },
            travessa_frames: { meia_dist_ganchos: 153 }
          };

      const scale = layout.escala_jogo;
      const m = layout.montagem_validada;
      const p = layout.prato;
      const f = layout.travessa_frames;
      const px = m.base_da_coluna[0] - 236 * scale / 2 + layout.coluna.topo_cap[0] * scale;
      const py = m.base_da_coluna[1] - 509 * scale + layout.coluna.topo_cap[1] * scale - m.pivo_acima_do_topo_px;

      // Escala para enquadrar 1024x572 em cover na janela 815x526 (corte ~6.7% nas laterais)
      const k = STAGE_H / 572; // ≈ 0.91958
      const offsetX = (STAGE_W - 1024 * k) / 2; // ≈ -63.32 px

      function hookX(a, side) { return px + (side ? 1 : -1) * Math.cos(a * Math.PI / 180) * f.meia_dist_ganchos; }
      function hookY(a, side) { return py + (side ? 1 : -1) * Math.sin(a * Math.PI / 180) * f.meia_dist_ganchos; }
      function panX(a, side) { return hookX(a, side) - p.centro_itens[0] * scale; }
      function panY(a, side) { return hookY(a, side) + m.queda_da_corrente_px - p.anel_esq[1] * scale; }
      function cellX(a, side, slot) { return panX(a, side) + p.centro_itens[0] * scale + m.grade_prato.colunas_x[slot % 4]; }
      function cellY(a, side, slot) { return panY(a, side) + p.centro_itens[1] * scale + m.grade_prato.linhas_y[Math.floor(slot / 4)]; }

      // Posição inicial da safira na bandeja
      const safiraBandejaX = 190 + 312 * scale; // ≈ 342.9
      const safiraBandejaY = 424 + 138 * scale; // ≈ 491.6

      // Posição do slot 1 do prato direito quando equilibrado (angle = 0)
      const targetSlotX = cellX(0, 1, 1);
      const targetSlotY = cellY(0, 1, 1);

      // Renderiza sprite de joia
      function drawStone(img, gx, gy, size, pop = 1) {
        if (!img) return;
        const w = img.naturalWidth || 60;
        const h = img.naturalHeight || 70;
        const sSize = (size / Math.max(w, h)) * pop;
        ctx.drawImage(img, gx - (w * sSize) / 2, gy - h * sSize, w * sSize, h * sSize);
      }

      // Função de desenho do estado no instante t
      function render(t, isReducedStatic = false) {
        ctx.clearRect(0, 0, STAGE_W, STAGE_H);

        // Se for modo reduzido estático e não estiver forçando play
        if (isReducedStatic) {
          t = 6.2; // Exibe o momento da balança equilibrada e explicativa
        }

        // --- CÁLCULO DA TIMELINE ---
        let angle = -12; // Inclinada inicialmente
        let handVisible = false;
        let handPose = 'apontando';
        let handX = 0, handY = 0;
        let touchProgress = 0;
        let safiraState = 'bandeja'; // 'bandeja' | 'arrastando' | 'caindo' | 'prato'
        let safiraX = safiraBandejaX, safiraY = safiraBandejaY;
        let safiraPop = 1.0;
        let panHighlight = false;
        let sealAlpha = 0;
        let sealScale = 0;
        let sparkleLevel = 0;

        if (t < 0.8) {
          angle = -12;
          safiraState = 'bandeja';
        } else if (t < 1.4) {
          // Mão aparece e vai até a safira
          handVisible = true;
          handPose = 'apontando';
          const pMove = (t - 0.8) / 0.6;
          const e = ease.easeInOutQuad(pMove);
          handX = 490 + (safiraBandejaX - 490) * e;
          handY = 520 + (safiraBandejaY - 520) * e;
          safiraState = 'bandeja';
        } else if (t < 2.4) {
          // Pressiona a safira e arrasta em arco até o prato direito
          handVisible = true;
          handPose = 'pressionando';

          // Anel de toque no primeiro instante (1.4s a 1.7s)
          if (t < 1.75) {
            touchProgress = (t - 1.4) / 0.35;
          }

          safiraState = 'arrastando';
          const pDrag = (t - 1.4) / 1.0;
          const e = ease.easeInOutCubic(pDrag);

          // Posição da mão e da joia em arco até o prato direito
          const startX = safiraBandejaX, startY = safiraBandejaY;
          const endX = targetSlotX, endY = targetSlotY - 20;

          // Curva com arco elevado
          const arcLift = Math.sin(pDrag * Math.PI) * 75;
          handX = startX + (endX - startX) * e;
          handY = startY + (endY - startY) * e - arcLift;

          safiraX = handX;
          safiraY = handY + 12;
          safiraPop = 1.15;

          if (pDrag > 0.5) panHighlight = true;
        } else if (t < 3.6) {
          // Solta a joia; cai no prato direito com quique
          const pDrop = (t - 2.4) / 1.2;
          safiraState = 'caindo';

          // Mão afasta-se suavemente
          if (t < 3.0) {
            handVisible = true;
            handPose = 'apontando';
            const pExit = (t - 2.4) / 0.6;
            handX = targetSlotX + pExit * 40;
            handY = targetSlotY - 20 + pExit * 30;
          } else {
            handVisible = false;
          }

          // Joia cai no prato com quique
          const dropE = ease.easeOutBounce(Math.min(1, pDrop * 1.5));
          safiraX = targetSlotX;
          safiraY = (targetSlotY - 25) + dropE * 25;

          // Balança começa a reagir e nivelar gradualmente
          const levelProgress = ease.easeInOutQuad(Math.max(0, (t - 2.8) / 0.8));
          angle = -12 + (0 - (-12)) * levelProgress * 0.4;
        } else if (t < 6.0) {
          // Balança nivela perfeitamente até 0°
          safiraState = 'prato';
          handVisible = false;
          const pLevel = (t - 3.6) / 2.4;
          const eLevel = ease.easeInOutQuad(pLevel);
          angle = -7.2 + (0 - (-7.2)) * eLevel;

          if (t > 5.5) {
            sparkleLevel = 1;
          }
        } else if (t < 7.0) {
          // Balança nivelada: selo certo e brilhos
          safiraState = 'prato';
          angle = 0;
          handVisible = false;

          const pSeal = (t - 6.0) / 1.0;
          sealAlpha = Math.min(1, pSeal * 3);
          sealScale = ease.easeOutBack(Math.min(1, pSeal * 2));
          sparkleLevel = pSeal < 0.5 ? 2 : 3;
        } else {
          // Pausa de 1.5 s (7.0s a 8.5s) com selo e balança nivelada
          safiraState = 'prato';
          angle = 0;
          handVisible = false;
          sealAlpha = Math.max(0, 1 - (t - 8.0) * 2);
          sealScale = 1.0;
          sparkleLevel = 2;
        }

        // --- DESENHO DO CENÁRIO DO PUZZLE ---
        ctx.save();
        ctx.translate(offsetX, 0);
        ctx.scale(k, k);

        // Fundo da vila
        if (assets.fundo) ctx.drawImage(assets.fundo, 0, 0, 1024, 572);

        // Coluna central da balança
        if (assets.coluna) ctx.drawImage(assets.coluna, 453, 123.5, 236 * scale, 509 * scale);

        // Travessa com pivô
        const frameIndex = Math.max(0, Math.min(30, Math.round(angle) + 15));
        const srcX = (frameIndex % 8) * 353;
        const srcY = Math.floor(frameIndex / 8) * 160;
        if (assets.travessaFrames) {
          ctx.drawImage(assets.travessaFrames, srcX, srcY, 353, 160, px - 176.5, py - 80, 353, 160);
        }

        // Pratos e correntes
        for (let side = 0; side < 2; side++) {
          const gx = hookX(angle, side);
          const gy = hookY(angle, side);
          const panCurX = panX(angle, side);
          const panCurY = panY(angle, side);

          // Correntes suspensas
          for (let ring = 0; ring < 2; ring++) {
            const anel = ring ? p.anel_dir : p.anel_esq;
            const ax = panCurX + anel[0] * scale;
            const ay = panCurY + anel[1] * scale;
            ctx.save();
            ctx.translate(gx, gy);
            ctx.rotate(Math.atan2(-(ax - gx), ay - gy));
            if (assets.corrente) {
              ctx.drawImage(assets.corrente, -12, 0, 24, Math.hypot(ax - gx, ay - gy));
            }
            ctx.restore();
          }

          // Destaque do prato direito ao receber joia
          if (side === 1 && panHighlight) {
            ctx.save();
            ctx.shadowColor = '#70d9ff';
            ctx.shadowBlur = 18;
            ctx.fillStyle = '#8ee8ff44';
            ctx.fillRect(panCurX - 6, panCurY - 6, 215, 98);
            ctx.restore();
          }

          // Prato
          if (assets.prato) {
            ctx.drawImage(assets.prato, panCurX, panCurY, 407 * scale, 172 * scale);
          }

          // Joias nos pratos
          if (side === 0) {
            // Prato esquerdo: 3 rubis fixos (peso total = 3)
            drawStone(assets.rubi, cellX(angle, 0, 0), cellY(angle, 0, 0), 34);
            drawStone(assets.rubi, cellX(angle, 0, 1), cellY(angle, 0, 1), 34);
            drawStone(assets.rubi, cellX(angle, 0, 2), cellY(angle, 0, 2), 34);
          } else {
            // Prato direito: 1 rubi inicial (peso = 1)
            drawStone(assets.rubi, cellX(angle, 1, 0), cellY(angle, 1, 0), 34);

            // Safira colocada no prato direito
            if (safiraState === 'prato') {
              drawStone(assets.safira, cellX(angle, 1, 1), cellY(angle, 1, 1), 34);
            }
          }
        }

        // Bandeja de joias
        if (assets.bandeja) {
          ctx.drawImage(assets.bandeja, 190, 424, 958 * scale, 280 * scale);
        }

        // Joia na bandeja (se ainda estiver lá)
        if (safiraState === 'bandeja') {
          drawStone(assets.safira, safiraBandejaX, safiraBandejaY, 46);
        }

        // Outros itens decorativos na bandeja (rubis disponíveis)
        drawStone(assets.rubi, 190 + 147 * scale, 424 + 138 * scale, 46);

        // Safira sendo arrastada ou caindo
        if (safiraState === 'arrastando' || safiraState === 'caindo') {
          // Sombra da joia arrastada
          ctx.fillStyle = '#10182044';
          ctx.beginPath();
          ctx.ellipse(safiraX, safiraY + 22, 18, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          drawStone(assets.safira, safiraX, safiraY, 46, safiraPop);
        }

        ctx.restore(); // Restaura transformação do cenário

        // --- DESENHO DOS ELEMENTOS DA DEMO (no espaço do palco 815x526) ---

        // Converte coordenadas do mundo (1024x572) para palco (815x526)
        function toStageX(gx) { return gx * k + offsetX; }
        function toStageY(gy) { return gy * k; }

        // Anel de toque na safira
        if (touchProgress > 0 && touchProgress < 1) {
          drawTouchRing(ctx, assets, toStageX(safiraBandejaX), toStageY(safiraBandejaY - 10), touchProgress);
        }

        // Mão animada
        if (handVisible) {
          drawHand(ctx, assets, handPose, toStageX(handX), toStageY(handY));
        }

        // Brilho de acerto
        if (sparkleLevel > 0) {
          const sparkX = STAGE_W / 2 + Math.sin(t * 8) * 35;
          const sparkY = STAGE_H * 0.38 + Math.cos(t * 8) * 20;
          drawSparkle(ctx, assets, sparkleLevel, sparkX, sparkY, 48, 0.85);
          drawSparkle(ctx, assets, ((sparkleLevel % 3) + 1), STAGE_W * 0.65, STAGE_H * 0.35, 36, 0.7);
        }

        // Selo "Certo"
        if (sealAlpha > 0) {
          drawSeal(ctx, assets, 'certo', STAGE_W / 2, STAGE_H * 0.42, sealScale, sealAlpha);
        }

        // Se for estático reduzido, desenha uma seta pontilhada explicativa
        if (isReducedStatic) {
          ctx.save();
          ctx.strokeStyle = '#ffe591';
          ctx.lineWidth = 4;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          const startPtX = toStageX(safiraBandejaX);
          const startPtY = toStageY(safiraBandejaY - 10);
          const endPtX = toStageX(targetSlotX);
          const endPtY = toStageY(targetSlotY - 5);
          ctx.moveTo(startPtX, startPtY);
          ctx.quadraticCurveTo((startPtX + endPtX) / 2 - 30, (startPtY + endPtY) / 2 - 80, endPtX, endPtY);
          ctx.stroke();

          // Ponta da seta
          ctx.fillStyle = '#ffe591';
          ctx.beginPath();
          ctx.arc(endPtX, endPtY, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      return {
        duration: 8.5,
        render
      };
    }
  };

  /* -------------------------------------------------------------
     DEMONSTRAÇÕES DE GEOMETRIA: Ruínas das Formas (Ponte de Peças)
     Ciclo 0 (4 colunas x 3 linhas):
       - Peça '02' (rotation 2) colocada em col 0, row 0
       - Peça '05' (rotation 2) colocada em col 1, row 0
       - Encaixe-alvo vazio: 3 células no canto inferior direito
         (col 3, row 1; col 2, row 2; col 3, row 2) para a peça '04' (rotation 3)
     Demos:
       1. 'geometria-arrastar': "Arraste a peça"
       2. 'geometria-girar':    "Gire a peça"
       3. 'geometria-tirar':    "Tire a peça"
  ------------------------------------------------------------- */
  async function loadGeometriaAssets() {
    const [
      fundo, peca02, peca04, peca05,
      maoApontando, maoPressionando,
      toque1, toque2, toque3,
      seloCerto, seloErro, seloReiniciar,
      brilho1, brilho2, brilho3
    ] = await Promise.all([
      loadImage('assets/puzzles/geometria/fundo.jpeg'),
      loadImage('assets/puzzles/geometria/pecas/peca_02.png'),
      loadImage('assets/puzzles/geometria/pecas/peca_04.png'),
      loadImage('assets/puzzles/geometria/pecas/peca_05.png'),
      loadImage('assets/tutorial/mao-apontando.webp'),
      loadImage('assets/tutorial/mao-pressionando.webp'),
      loadImage('assets/tutorial/toque-1.webp'),
      loadImage('assets/tutorial/toque-2.webp'),
      loadImage('assets/tutorial/toque-3.webp'),
      loadImage('assets/tutorial/selo-certo.webp'),
      loadImage('assets/tutorial/selo-erro.webp'),
      loadImage('assets/tutorial/selo-reiniciar.webp'),
      loadImage('assets/tutorial/brilho-1.webp'),
      loadImage('assets/tutorial/brilho-2.webp'),
      loadImage('assets/tutorial/brilho-3.webp')
    ]);

    return {
      fundo, peca02, peca04, peca05,
      maoApontando, maoPressionando,
      toque1, toque2, toque3,
      seloCerto, seloErro, seloReiniciar,
      brilho1, brilho2, brilho3
    };
  }

  function createGeometriaBase(canvas, assets) {
    const ctx = canvas.getContext('2d');

    const STAGE_SCALE = 526 / 714;
    const STAGE_OFFSET_X = (STAGE_W - 1280 * STAGE_SCALE) / 2; // ≈ -63.98 px
    const toStageX = x => x * STAGE_SCALE + STAGE_OFFSET_X;
    const toStageY = y => y * STAGE_SCALE;

    const COLS = 4;
    const ROWS = 3;
    const CELL_DESIGN = 114;
    const CELL_STAGE = CELL_DESIGN * STAGE_SCALE; // ≈ 83.98 px
    const BOARD_LEFT = toStageX(410);              // ≈ 238.06 px
    const BOARD_TOP = toStageY(262);               // ≈ 193.0 px

    // Posição alvo da peça '04' (rotation 3, col 2, row 1)
    const TARGET_X = BOARD_LEFT + 3 * CELL_STAGE; // ≈ 490 px
    const TARGET_Y = BOARD_TOP + 2 * CELL_STAGE;  // ≈ 361 px

    // As 3 células da peça '04'
    const SOCKET_CELLS = [
      { col: 3, row: 1 },
      { col: 2, row: 2 },
      { col: 3, row: 2 }
    ];

    // Posição da peça na bandeja inferior (tray)
    const TRAY_X = STAGE_W / 2;                    // 407.5 px
    const TRAY_Y = toStageY(648);                  // ≈ 477 px
    const TRAY_CELL_SIZE = 40 * STAGE_SCALE;       // ≈ 29.5 px

    const PIECE_SHAPES = {
      '02': {
        w: 2, h: 3,
        cells: [1,0, 1,1, 0,2, 1,2],
        img: assets.peca02
      },
      '05': {
        w: 3, h: 3,
        cells: [2,0, 1,1, 2,1, 0,2, 1,2],
        img: assets.peca05
      },
      '04': {
        w: 2, h: 2,
        cells: [0,0, 0,1, 1,1],
        img: assets.peca04
      }
    };

    function drawPiece(id, x, y, size, angle, pop = 1, shadow = false, alpha = 1) {
      const p = PIECE_SHAPES[id];
      if (!p) return;
      const s = size * pop;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      if (shadow) {
        ctx.save();
        ctx.translate(x + 4, y + 6);
        ctx.rotate(angle);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        for (let i = 0; i < p.cells.length; i += 2) {
          ctx.rect((p.cells[i] - p.w / 2) * s, (p.cells[i + 1] - p.h / 2) * s, s, s);
        }
        ctx.fill();
        ctx.restore();
      }
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      for (let i = 0; i < p.cells.length; i += 2) {
        ctx.rect((p.cells[i] - p.w / 2) * s, (p.cells[i + 1] - p.h / 2) * s, s, s);
      }
      ctx.clip();
      if (p.img) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(p.img, -p.w * s / 2, -p.h * s / 2, p.w * s, p.h * s);
      } else {
        ctx.fillStyle = '#a66beb';
        ctx.strokeStyle = '#eed7ff';
        ctx.lineWidth = 2;
        for (let i = 0; i < p.cells.length; i += 2) {
          const cx = (p.cells[i] - p.w / 2) * s;
          const cy = (p.cells[i + 1] - p.h / 2) * s;
          ctx.fillRect(cx, cy, s, s);
          ctx.strokeRect(cx + 1, cy + 1, s - 2, s - 2);
        }
      }
      ctx.restore();
    }

    function drawBoardBackground(socketHighlight = false, socketPulseAlpha = 0) {
      // 1. Fundo em cover centralizado
      if (assets.fundo) {
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        const bgScale = 526 / 714;
        const bgW = 1280 * bgScale;
        const bgX = (STAGE_W - bgW) / 2;
        ctx.drawImage(assets.fundo, bgX, 0, bgW, 526);
        ctx.restore();
      } else {
        ctx.fillStyle = '#775033';
        ctx.fillRect(0, 0, STAGE_W, 526);
      }

      // 2. Tabuleiro
      ctx.fillStyle = '#211d2d';
      ctx.fillRect(BOARD_LEFT - 4, BOARD_TOP - 4, COLS * CELL_STAGE + 8, ROWS * CELL_STAGE + 8);

      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          ctx.fillStyle = '#10152699';
          ctx.fillRect(BOARD_LEFT + x * CELL_STAGE, BOARD_TOP + y * CELL_STAGE, CELL_STAGE, CELL_STAGE);
          ctx.strokeStyle = '#eee4d49a';
          ctx.strokeRect(BOARD_LEFT + x * CELL_STAGE + 2, BOARD_TOP + y * CELL_STAGE + 2, CELL_STAGE - 4, CELL_STAGE - 4);
        }
      }
      ctx.setLineDash([]);

      // 3. Peças já fixas no tabuleiro: '02' e '05'
      const p02X = BOARD_LEFT + 1 * CELL_STAGE;
      const p02Y = BOARD_TOP + 1.5 * CELL_STAGE;
      drawPiece('02', p02X, p02Y, CELL_STAGE, Math.PI);

      const p05X = BOARD_LEFT + 2.5 * CELL_STAGE;
      const p05Y = BOARD_TOP + 1.5 * CELL_STAGE;
      drawPiece('05', p05X, p05Y, CELL_STAGE, Math.PI);

      // 4. Efeito no encaixe alvo (3 células da peça '04')
      if (socketPulseAlpha > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(77, 255, 133, ${Math.min(0.85, socketPulseAlpha)})`;
        for (const c of SOCKET_CELLS) {
          ctx.fillRect(BOARD_LEFT + c.col * CELL_STAGE + 2, BOARD_TOP + c.row * CELL_STAGE + 2, CELL_STAGE - 4, CELL_STAGE - 4);
        }
        ctx.strokeStyle = '#4dff85';
        ctx.lineWidth = 3;
        for (const c of SOCKET_CELLS) {
          ctx.strokeRect(BOARD_LEFT + c.col * CELL_STAGE + 2, BOARD_TOP + c.row * CELL_STAGE + 2, CELL_STAGE - 4, CELL_STAGE - 4);
        }
        ctx.restore();
      } else if (socketHighlight) {
        ctx.save();
        ctx.strokeStyle = '#ffe591';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        for (const c of SOCKET_CELLS) {
          ctx.strokeRect(BOARD_LEFT + c.col * CELL_STAGE + 2, BOARD_TOP + c.row * CELL_STAGE + 2, CELL_STAGE - 4, CELL_STAGE - 4);
        }
        ctx.restore();
      }

      // 5. Barra inferior (bandeja horizontal)
      ctx.save();
      ctx.fillStyle = 'rgba(23, 24, 41, 0.85)';
      ctx.beginPath();
      ctx.roundRect(160, 444, 495, 70, 12);
      ctx.fill();
      ctx.strokeStyle = '#3a3d58';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    return {
      ctx,
      toStageX,
      toStageY,
      BOARD_LEFT,
      BOARD_TOP,
      CELL_STAGE,
      TARGET_X,
      TARGET_Y,
      SOCKET_CELLS,
      TRAY_X,
      TRAY_Y,
      TRAY_CELL_SIZE,
      drawPiece,
      drawBoardBackground
    };
  }

  /* -------------------------------------------------------------
     PASSO 1: Arraste a peça
  ------------------------------------------------------------- */
  registry['geometria-arrastar'] = {
    loadAssets: loadGeometriaAssets,
    create(canvas, assets) {
      const base = createGeometriaBase(canvas, assets);
      const { ctx, TARGET_X, TARGET_Y, TRAY_X, TRAY_Y, TRAY_CELL_SIZE, CELL_STAGE, drawPiece, drawBoardBackground } = base;

      function render(time, isReducedStatic) {
        ctx.clearRect(0, 0, STAGE_W, STAGE_H);

        let pieceX = TRAY_X;
        let pieceY = TRAY_Y;
        let pieceSize = TRAY_CELL_SIZE;
        let piecePop = 1.0;
        let pieceShadow = false;

        let socketHighlight = true;
        let socketPulseAlpha = 0;

        let handPose = 'apontando';
        let handX = TRAY_X + 45;
        let handY = TRAY_Y + 40;
        let handOpacity = 0;

        let touchRingProgress = 0;
        let showSeal = false;
        let sealScale = 0;
        let sparkleLevel = 0;

        if (isReducedStatic) {
          pieceX = TRAY_X;
          pieceY = TRAY_Y;
          pieceSize = TRAY_CELL_SIZE;
          socketHighlight = true;
          handOpacity = 1;
          handX = TRAY_X;
          handY = TRAY_Y;
        } else if (time < 1.0) {
          pieceX = TRAY_X;
          pieceY = TRAY_Y;
          pieceSize = TRAY_CELL_SIZE;
          socketHighlight = (Math.floor(time * 3) % 2 === 0);
          handOpacity = 0;
        } else if (time < 1.8) {
          const t = ease.easeOutCubic((time - 1.0) / 0.8);
          handOpacity = Math.min(1, (time - 1.0) / 0.3);
          handX = (TRAY_X + 50) + (TRAY_X - (TRAY_X + 50)) * t;
          handY = (TRAY_Y + 45) + (TRAY_Y - (TRAY_Y + 45)) * t;
          pieceX = TRAY_X;
          pieceY = TRAY_Y;
          pieceSize = TRAY_CELL_SIZE;
          socketHighlight = true;
        } else if (time < 2.4) {
          handPose = 'pressionando';
          handOpacity = 1;
          handX = TRAY_X;
          handY = TRAY_Y;
          touchRingProgress = (time - 1.8) / 0.5;
          const tPop = ease.easeOutQuad((time - 1.8) / 0.6);
          piecePop = 1.0 + 0.08 * tPop;
          pieceShadow = true;
          pieceX = TRAY_X;
          pieceY = TRAY_Y - 4 * tPop;
          pieceSize = TRAY_CELL_SIZE;
          socketHighlight = true;
        } else if (time < 4.2) {
          handPose = 'pressionando';
          handOpacity = 1;
          const t = ease.easeInOutCubic((time - 2.4) / 1.8);
          pieceX = TRAY_X + (TARGET_X - TRAY_X) * t;
          pieceY = (TRAY_Y - 4) + (TARGET_Y - (TRAY_Y - 4)) * t - Math.sin(t * Math.PI) * 45;
          pieceSize = TRAY_CELL_SIZE + (CELL_STAGE - TRAY_CELL_SIZE) * t;
          piecePop = 1.08;
          pieceShadow = true;
          handX = pieceX;
          handY = pieceY;

          if (t > 0.6) {
            socketPulseAlpha = 0.4 + 0.4 * Math.sin((time - 3.4) * 8);
          } else {
            socketHighlight = true;
          }
        } else if (time < 6.5) {
          pieceX = TARGET_X;
          pieceY = TARGET_Y;
          pieceSize = CELL_STAGE;
          pieceShadow = false;

          if (time < 4.7) {
            const tBounce = (time - 4.2) / 0.5;
            piecePop = 1.0 + (1 - ease.easeOutBounce(tBounce)) * 0.12;
          } else {
            piecePop = 1.0;
          }

          if (time < 4.8) {
            handPose = 'apontando';
            handOpacity = Math.max(0, 1 - (time - 4.2) / 0.5);
            handX = TARGET_X + (time - 4.2) * 50;
            handY = TARGET_Y + (time - 4.2) * 30;
          } else {
            handOpacity = 0;
          }

          if (time >= 4.4) {
            showSeal = true;
            const tSeal = Math.min(1, (time - 4.4) / 0.35);
            sealScale = ease.easeOutBack(tSeal);
            sparkleLevel = Math.min(3, Math.floor((time - 4.5) / 0.4) + 1);
          }
        } else {
          pieceX = TARGET_X;
          pieceY = TARGET_Y;
          pieceSize = CELL_STAGE;
          handOpacity = 0;
          showSeal = true;
          sealScale = Math.max(0, 1 - (time - 7.6) / 0.5);
        }

        drawBoardBackground(socketHighlight, socketPulseAlpha);

        const pieceAngle = 3 * Math.PI / 2;
        drawPiece('04', pieceX, pieceY, pieceSize, pieceAngle, piecePop, pieceShadow);

        if (touchRingProgress > 0 && touchRingProgress < 1) {
          drawTouchRing(ctx, assets, TRAY_X, TRAY_Y, touchRingProgress);
        }

        drawHand(ctx, assets, handPose, handX, handY, handOpacity);

        if (showSeal && sealScale > 0) {
          drawSeal(ctx, assets, 'certo', TARGET_X, TARGET_Y - 20, sealScale);
          if (sparkleLevel >= 1) drawSparkle(ctx, assets, 1, TARGET_X - 60, TARGET_Y - 50, 28);
          if (sparkleLevel >= 2) drawSparkle(ctx, assets, 2, TARGET_X + 60, TARGET_Y - 45, 34);
          if (sparkleLevel >= 3) drawSparkle(ctx, assets, 3, TARGET_X, TARGET_Y + 50, 38);
        }

        if (isReducedStatic) {
          ctx.save();
          ctx.strokeStyle = '#ffe591';
          ctx.lineWidth = 4;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.moveTo(TRAY_X, TRAY_Y - 15);
          ctx.quadraticCurveTo((TRAY_X + TARGET_X) / 2, TRAY_Y - 80, TARGET_X, TARGET_Y);
          ctx.stroke();
          ctx.fillStyle = '#ffe591';
          ctx.beginPath();
          ctx.arc(TARGET_X, TARGET_Y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      return {
        duration: 8.2,
        render
      };
    }
  };

  /* -------------------------------------------------------------
     PASSO 2: Gire a peça
  ------------------------------------------------------------- */
  registry['geometria-girar'] = {
    loadAssets: loadGeometriaAssets,
    create(canvas, assets) {
      const base = createGeometriaBase(canvas, assets);
      const { ctx, TRAY_X, TRAY_Y, TRAY_CELL_SIZE, drawPiece, drawBoardBackground } = base;

      function render(time, isReducedStatic) {
        ctx.clearRect(0, 0, STAGE_W, STAGE_H);

        let pieceAngle = Math.PI / 2; // Rotação 1 inicial (errada)
        let piecePop = 1.0;

        let handPose = 'apontando';
        let handX = TRAY_X;
        let handY = TRAY_Y;
        let handOpacity = 0;

        let touchRingProgress = 0;
        let showSpinIcon = false;
        let spinIconAlpha = 0;

        let showSeal = false;
        let sealScale = 0;
        let sparkleLevel = 0;

        const SILHOUETTE_X = TRAY_X + 115;
        const SILHOUETTE_Y = TRAY_Y;

        if (isReducedStatic) {
          pieceAngle = Math.PI / 2;
          handOpacity = 1;
          handX = TRAY_X;
          handY = TRAY_Y;
          showSpinIcon = true;
          spinIconAlpha = 0.9;
        } else if (time < 1.0) {
          pieceAngle = Math.PI / 2;
          handOpacity = 0;
        } else if (time < 1.6) {
          const t = ease.easeOutCubic((time - 1.0) / 0.6);
          handOpacity = Math.min(1, (time - 1.0) / 0.3);
          handX = TRAY_X + (1 - t) * 40;
          handY = TRAY_Y + (1 - t) * 35;
          pieceAngle = Math.PI / 2;
        } else if (time < 2.8) {
          handOpacity = 1;
          handX = TRAY_X;
          handY = TRAY_Y;
          touchRingProgress = Math.min(1, (time - 1.6) / 0.45);

          showSpinIcon = true;
          spinIconAlpha = Math.max(0, 1 - (time - 2.0) / 0.7);

          if (time < 1.85) {
            const t = ease.easeOutBack((time - 1.6) / 0.25);
            pieceAngle = Math.PI / 2 + t * (Math.PI / 2);
            piecePop = 1.0 + 0.1 * Math.sin(t * Math.PI);
          } else {
            pieceAngle = Math.PI;
            piecePop = 1.0;
          }
        } else if (time < 4.2) {
          handOpacity = 1;
          handX = TRAY_X;
          handY = TRAY_Y;
          touchRingProgress = Math.min(1, (time - 2.8) / 0.45);

          showSpinIcon = true;
          spinIconAlpha = Math.max(0, 1 - (time - 3.2) / 0.7);

          if (time < 3.05) {
            const t = ease.easeOutBack((time - 2.8) / 0.25);
            pieceAngle = Math.PI + t * (Math.PI / 2);
            piecePop = 1.0 + 0.1 * Math.sin(t * Math.PI);
          } else {
            pieceAngle = 3 * Math.PI / 2;
            piecePop = 1.0;
          }

          if (time > 3.4) {
            handOpacity = Math.max(0, 1 - (time - 3.4) / 0.4);
          }
        } else if (time < 5.2) {
          pieceAngle = 3 * Math.PI / 2;
          handOpacity = 0;
        } else if (time < 7.2) {
          pieceAngle = 3 * Math.PI / 2;
          handOpacity = 0;
          showSeal = true;
          const tSeal = Math.min(1, (time - 5.2) / 0.35);
          sealScale = ease.easeOutBack(tSeal);
          sparkleLevel = Math.min(3, Math.floor((time - 5.3) / 0.4) + 1);
        } else {
          pieceAngle = 3 * Math.PI / 2;
          handOpacity = 0;
          showSeal = true;
          sealScale = Math.max(0, 1 - (time - 7.7) / 0.4);
        }

        drawBoardBackground(true, 0);

        ctx.save();
        ctx.translate(SILHOUETTE_X, SILHOUETTE_Y);
        ctx.rotate(3 * Math.PI / 2);
        ctx.strokeStyle = '#ffe591';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 3]);
        const s = TRAY_CELL_SIZE;
        for (let i = 0; i < 6; i += 2) {
          const cells = [0,0, 0,1, 1,1];
          const cx = (cells[i] - 1) * s;
          const cy = (cells[i + 1] - 1) * s;
          ctx.strokeRect(cx + 1, cy + 1, s - 2, s - 2);
        }
        ctx.restore();

        ctx.save();
        ctx.fillStyle = '#ffe591bb';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ENCAIXE', SILHOUETTE_X, SILHOUETTE_Y - 26);
        ctx.restore();

        drawPiece('04', TRAY_X, TRAY_Y, TRAY_CELL_SIZE, pieceAngle, piecePop, false);

        if (showSpinIcon && spinIconAlpha > 0) {
          drawSeal(ctx, assets, 'reiniciar', TRAY_X - 60, TRAY_Y, 0.75, spinIconAlpha);
        }

        if (touchRingProgress > 0 && touchRingProgress < 1) {
          drawTouchRing(ctx, assets, TRAY_X, TRAY_Y, touchRingProgress);
        }

        drawHand(ctx, assets, handPose, handX, handY, handOpacity);

        if (showSeal && sealScale > 0) {
          drawSeal(ctx, assets, 'certo', TRAY_X, TRAY_Y - 25, sealScale);
          if (sparkleLevel >= 1) drawSparkle(ctx, assets, 1, TRAY_X - 45, TRAY_Y - 45, 26);
          if (sparkleLevel >= 2) drawSparkle(ctx, assets, 2, TRAY_X + 45, TRAY_Y - 40, 30);
          if (sparkleLevel >= 3) drawSparkle(ctx, assets, 3, TRAY_X, TRAY_Y + 35, 32);
        }
      }

      return {
        duration: 8.2,
        render
      };
    }
  };

  /* -------------------------------------------------------------
     PASSO 3: Tire a peça
  ------------------------------------------------------------- */
  registry['geometria-tirar'] = {
    loadAssets: loadGeometriaAssets,
    create(canvas, assets) {
      const base = createGeometriaBase(canvas, assets);
      const { ctx, TARGET_X, TARGET_Y, TRAY_X, TRAY_Y, TRAY_CELL_SIZE, CELL_STAGE, drawPiece, drawBoardBackground } = base;

      function render(time, isReducedStatic) {
        ctx.clearRect(0, 0, STAGE_W, STAGE_H);

        let pieceX = TARGET_X;
        let pieceY = TARGET_Y;
        let pieceSize = CELL_STAGE;
        let piecePop = 1.0;
        let pieceShadow = false;

        let socketHighlight = false;

        let handPose = 'apontando';
        let handX = TARGET_X;
        let handY = TARGET_Y;
        let handOpacity = 0;

        let touchRingProgress = 0;

        if (isReducedStatic) {
          pieceX = TARGET_X;
          pieceY = TARGET_Y;
          pieceSize = CELL_STAGE;
          handOpacity = 1;
          handX = TARGET_X;
          handY = TARGET_Y;
        } else if (time < 1.0) {
          pieceX = TARGET_X;
          pieceY = TARGET_Y;
          pieceSize = CELL_STAGE;
          handOpacity = 0;
          socketHighlight = false;
        } else if (time < 1.6) {
          const t = ease.easeOutCubic((time - 1.0) / 0.6);
          handOpacity = Math.min(1, (time - 1.0) / 0.3);
          handX = TARGET_X + (1 - t) * 45;
          handY = TARGET_Y + (1 - t) * 40;
          pieceX = TARGET_X;
          pieceY = TARGET_Y;
          pieceSize = CELL_STAGE;
        } else if (time < 2.1) {
          touchRingProgress = Math.min(1, (time - 1.6) / 0.4);
          handOpacity = Math.max(0, 1 - (time - 1.6) / 0.35);

          const t = ease.easeInOutQuad((time - 1.6) / 0.5);
          pieceX = TARGET_X + (TRAY_X - TARGET_X) * t;
          pieceY = TARGET_Y + (TRAY_Y - TARGET_Y) * t - Math.sin(t * Math.PI) * 40;
          pieceSize = CELL_STAGE + (TRAY_CELL_SIZE - CELL_STAGE) * t;
          pieceShadow = true;
          piecePop = 1.05;
          socketHighlight = true;
        } else if (time < 2.6) {
          pieceX = TRAY_X;
          pieceY = TRAY_Y;
          pieceSize = TRAY_CELL_SIZE;
          const tBounce = (time - 2.1) / 0.5;
          piecePop = 1.0 + (1 - ease.easeOutBounce(tBounce)) * 0.08;
          pieceShadow = false;
          handOpacity = 0;
          socketHighlight = true;
        } else {
          pieceX = TRAY_X;
          pieceY = TRAY_Y;
          pieceSize = TRAY_CELL_SIZE;
          piecePop = 1.0;
          pieceShadow = false;
          handOpacity = 0;
          socketHighlight = (Math.floor(time * 3) % 2 === 0);
        }

        drawBoardBackground(socketHighlight, 0);

        if (time < 1.6) {
          ctx.save();
          ctx.strokeStyle = '#3a3d58';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(TRAY_X - TRAY_CELL_SIZE, TRAY_Y - TRAY_CELL_SIZE, TRAY_CELL_SIZE * 2, TRAY_CELL_SIZE * 2);
          ctx.restore();
        }

        drawPiece('04', pieceX, pieceY, pieceSize, 3 * Math.PI / 2, piecePop, pieceShadow);

        if (touchRingProgress > 0 && touchRingProgress < 1) {
          drawTouchRing(ctx, assets, TARGET_X, TARGET_Y, touchRingProgress);
        }

        drawHand(ctx, assets, handPose, handX, handY, handOpacity);

        if (isReducedStatic) {
          ctx.save();
          ctx.strokeStyle = '#ffe591';
          ctx.lineWidth = 4;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.moveTo(TARGET_X, TARGET_Y + 15);
          ctx.quadraticCurveTo((TARGET_X + TRAY_X) / 2, TARGET_Y + 50, TRAY_X, TRAY_Y);
          ctx.stroke();
          ctx.fillStyle = '#ffe591';
          ctx.beginPath();
          ctx.arc(TRAY_X, TRAY_Y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      return {
        duration: 7.2,
        render
      };
    }
  };

  /* -------------------------------------------------------------
     DEMONSTRAÇÕES DE RACIOCÍNIO LÓGICO: Labirinto das Runas
     Cenário 1376×768 (1,79:1) em cover no palco 815×526: escala 526/768,
     corte de ~6,8% de cada lado (x de 16,6% a 83,5% fica visível). Coordenadas dos roteiros em % da imagem,
     validadas na máscara mascara-2-runas.webp (100% em área andável).
  ------------------------------------------------------------- */
  const LOGICA_IMG_W = 1376, LOGICA_IMG_H = 768;
  const LOGICA_K = STAGE_H / LOGICA_IMG_H;
  const LOGICA_OX = (STAGE_W - LOGICA_IMG_W * LOGICA_K) / 2;
  const lx = p => p / 100 * LOGICA_IMG_W * LOGICA_K + LOGICA_OX;
  const ly = p => p / 100 * STAGE_H;
  const LOGICA_ESTRELA = [16.8, 39.4], LOGICA_LUA = [83.5, 39.4], LOGICA_INICIO = [50, 89.6];
  const LOGICA_CAMINHOS = {
    ateEstrela: [[50, 89.6], [50, 64.6], [45.6, 56.8], [35.8, 56.2], [26.7, 40.1], [16.6, 39.1]],
    estrelaLua: [[16.6, 39.1], [26.2, 39.6], [35.8, 56.2], [65.1, 56.2], [74.1, 40.1], [83.4, 39.1]],
    ateLua: [[50, 89.6], [50, 64.6], [54.4, 56.8], [65.1, 56.2], [74.1, 40.1], [83.4, 39.1]]
  };

  function loadLogicaAssets() {
    const hero = (typeof window !== 'undefined' && window.HERO_SHEET) || { src: 'personagem/personagem_spritesheet_8_direcoes_v2.png', frameW: 48, frameH: 56, pivotX: 24, pivotY: 52 };
    const list = {
      fundo: 'assets/puzzles/floresta/cenario-2-runas.webp',
      estrela: 'assets/puzzles/simbolos/laje-estrela.webp',
      lua: 'assets/puzzles/simbolos/laje-lua.webp',
      heroi: `assets/${hero.src}`,
      seloCerto: 'assets/tutorial/selo-certo.webp',
      seloErro: 'assets/tutorial/selo-erro.webp',
      seloReiniciar: 'assets/tutorial/selo-reiniciar.webp',
      brilho1: 'assets/tutorial/brilho-1.webp',
      brilho2: 'assets/tutorial/brilho-2.webp',
      brilho3: 'assets/tutorial/brilho-3.webp',
      pontoAtivo: 'assets/tutorial/ponto-ativo.webp',
      pontoInativo: 'assets/tutorial/ponto-inativo.webp'
    };
    const keys = Object.keys(list);
    return Promise.all(keys.map(k => loadImage(list[k]))).then(imgs => {
      const out = { heroSheet: hero };
      keys.forEach((k, i) => { out[k] = imgs[i]; });
      return out;
    });
  }

  // Posição ao longo de um caminho em velocidade constante (u de 0 a 1) e direção (linha da folha).
  function logicaPontoNoCaminho(path, u) {
    const pts = path.map(p => [lx(p[0]), ly(p[1])]);
    const lens = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); lens.push(l); total += l; }
    let d = Math.max(0, Math.min(1, u)) * total;
    for (let i = 0; i < lens.length; i++) {
      if (d <= lens[i] || i === lens.length - 1) {
        const t = lens[i] ? Math.min(1, d / lens[i]) : 1;
        const a = pts[i], b = pts[i + 1];
        return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, dx: b[0] - a[0], dy: b[1] - a[1] };
      }
      d -= lens[i];
    }
    return { x: pts[0][0], y: pts[0][1], dx: 0, dy: -1 };
  }

  // Linha da folha de 8 direções: 0 baixo, 1 esq, 2 dir, 3 cima, 4 baixo-esq, 5 baixo-dir, 6 cima-esq, 7 cima-dir.
  function logicaLinha(dx, dy) {
    const a = Math.atan2(dy, dx), sector = (Math.round(a / (Math.PI / 4)) + 8) % 8;
    return [2, 5, 0, 4, 1, 6, 3, 7][sector];
  }

  function createLogicaBase(canvas, assets) {
    const ctx = canvas.getContext('2d');
    const hs = assets.heroSheet;
    const heroH = STAGE_H * 0.174; // mesma proporção do herói real (75,6 px em 434 px)

    function fundo() {
      if (assets.fundo) {
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(assets.fundo, LOGICA_OX, 0, LOGICA_IMG_W * LOGICA_K, STAGE_H);
      } else { ctx.fillStyle = '#304e39'; ctx.fillRect(0, 0, STAGE_W, STAGE_H); }
    }

    function laje(img, pos, acesa, numero, tremor = 0) {
      const x = lx(pos[0]) + tremor, y = ly(pos[1]);
      const w = 70, h = img ? w * (img.naturalHeight || img.height || 1) / (img.naturalWidth || img.width || 1) : 70;
      if (acesa > 0) {
        const g = ctx.createRadialGradient(x, y, 4, x, y, 70);
        g.addColorStop(0, `rgba(255, 240, 160, ${0.75 * acesa})`);
        g.addColorStop(1, 'rgba(255, 240, 160, 0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 70, 0, Math.PI * 2); ctx.fill();
      }
      ctx.save();
      ctx.globalAlpha = 0.55 + 0.45 * Math.max(acesa, 0);
      ctx.imageSmoothingEnabled = true;
      if (img) ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
      else { ctx.fillStyle = '#8a8f86'; ctx.fillRect(x - 30, y - 30, 60, 60); }
      ctx.restore();
      if (numero) {
        ctx.save();
        ctx.fillStyle = '#183a30'; ctx.strokeStyle = '#ffe591'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x, y - h / 2 - 18, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff5d7'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(numero, x, y - h / 2 - 17);
        ctx.restore();
      }
    }

    function heroi(x, y, linha, andando, tempo, alpha = 1) {
      const scale = heroH / hs.frameH;
      const col = andando ? Math.floor(tempo * 7.5) % 4 : 0;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#10251d77';
      ctx.beginPath(); ctx.ellipse(x, y, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.imageSmoothingEnabled = false;
      if (assets.heroi) ctx.drawImage(assets.heroi, col * hs.frameW, linha * hs.frameH, hs.frameW, hs.frameH, x - hs.pivotX * scale, y - hs.pivotY * scale, hs.frameW * scale, hs.frameH * scale);
      else { ctx.fillStyle = '#efba78'; ctx.fillRect(x - 15, y - heroH, 30, heroH); }
      ctx.restore();
    }

    function faixa(texto) {
      if (!texto) return;
      ctx.save();
      ctx.font = 'bold 24px sans-serif';
      const w = Math.max(280, ctx.measureText(texto).width + 48);
      const x = STAGE_W / 2 - w / 2;
      ctx.fillStyle = '#183a30e6'; ctx.strokeStyle = '#b9dc9a'; ctx.lineWidth = 2;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, 14, w, 44, 10); else ctx.rect(x, 14, w, 44);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff5d7'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(texto, STAGE_W / 2, 37);
      ctx.restore();
    }

    function bolinhas(acesas) {
      for (let i = 0; i < 2; i++) {
        const img = i < acesas ? assets.pontoAtivo : assets.pontoInativo;
        const x = 22 + i * 34, y = 20;
        if (img) { ctx.imageSmoothingEnabled = false; ctx.drawImage(img, x, y, 26, 26); }
        else { ctx.fillStyle = i < acesas ? '#4ade80' : '#14362d'; ctx.beginPath(); ctx.arc(x + 13, y + 13, 11, 0, Math.PI * 2); ctx.fill(); }
      }
    }

    function tracejado(path) {
      ctx.save();
      ctx.strokeStyle = '#ffe591'; ctx.lineWidth = 4; ctx.setLineDash([8, 6]);
      ctx.beginPath();
      path.forEach((p, i) => { const x = lx(p[0]), y = ly(p[1]); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      ctx.stroke();
      const e = path[path.length - 1];
      ctx.setLineDash([]); ctx.fillStyle = '#ffe591';
      ctx.beginPath(); ctx.arc(lx(e[0]), ly(e[1]), 7, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // Personagem percorrendo um caminho numa janela [t0, t1]
    function caminhar(path, t, t0, t1) {
      const u = (t - t0) / (t1 - t0);
      const p = logicaPontoNoCaminho(path, u);
      return { x: p.x, y: p.y, linha: logicaLinha(p.dx, p.dy), andando: u > 0 && u < 1 };
    }

    return { ctx, fundo, laje, heroi, faixa, bolinhas, tracejado, caminhar };
  }

  /* PASSO 1: Siga a ordem das runas (~9,6 s + pausa de 1,5 s = 11,1 s).
     A personagem vai SÓ ATÉ A PRIMEIRA RUNA (a estrela) e para; só a 1ª bolinha acende. */
  registry['logica-ordem'] = {
    loadAssets: loadLogicaAssets,
    create(canvas, assets) {
      const b = createLogicaBase(canvas, assets);
      const ctx = b.ctx;
      const inicio = { x: lx(LOGICA_INICIO[0]), y: ly(LOGICA_INICIO[1]), linha: 3, andando: false };
      const fimEstrela = LOGICA_CAMINHOS.ateEstrela[LOGICA_CAMINHOS.ateEstrela.length - 1];
      const paradaEstrela = { x: lx(fimEstrela[0]), y: ly(fimEstrela[1]), linha: 1, andando: false };

      function render(t, estatico) {
        ctx.clearRect(0, 0, STAGE_W, STAGE_H);
        b.fundo();
        if (estatico) {
          b.laje(assets.estrela, LOGICA_ESTRELA, 1, '1');
          b.laje(assets.lua, LOGICA_LUA, 1, '2');
          b.tracejado(LOGICA_CAMINHOS.ateEstrela);
          b.heroi(inicio.x, inicio.y, 3, false, 0);
          b.bolinhas(1);
          b.faixa('Vá até as runas na mesma ordem!');
          return;
        }
        const estrelaAcesa = t >= 1.0 && t < 2.2 ? 1 : (t >= 8.2 ? 0.6 : 0);
        const luaAcesa = t >= 2.6 && t < 3.8 ? 1 : 0;
        b.laje(assets.estrela, LOGICA_ESTRELA, estrelaAcesa, t >= 1.0 && t < 2.2 ? '1' : '');
        b.laje(assets.lua, LOGICA_LUA, luaAcesa, t >= 2.6 && t < 3.8 ? '2' : '');

        let h = inicio;
        if (t >= 4.6 && t < 8.2) h = b.caminhar(LOGICA_CAMINHOS.ateEstrela, t, 4.6, 8.2);
        else if (t >= 8.2) h = paradaEstrela;
        b.heroi(h.x, h.y, h.linha, h.andando, t);

        b.bolinhas(t >= 8.2 ? 1 : 0);
        if (t >= 8.2) {
          const s = ease.easeOutBack(Math.min(1, (t - 8.2) / 0.3));
          drawSeal(ctx, assets, 'certo', lx(LOGICA_ESTRELA[0]), ly(LOGICA_ESTRELA[1]) - 70, s);
          const k = Math.min(3, Math.floor((t - 8.2) / 0.25) + 1);
          if (k >= 1) drawSparkle(ctx, assets, 1, lx(LOGICA_ESTRELA[0]) - 50, ly(LOGICA_ESTRELA[1]) - 30, 26);
          if (k >= 2) drawSparkle(ctx, assets, 2, lx(LOGICA_ESTRELA[0]) + 45, ly(LOGICA_ESTRELA[1]) - 55, 32);
          if (k >= 3) drawSparkle(ctx, assets, 3, lx(LOGICA_ESTRELA[0]) - 10, ly(LOGICA_ESTRELA[1]) + 40, 38);
        }
        b.faixa(t < 4.2 ? 'Memorize a ordem!' : t < 8.2 ? 'Agora vá na ordem!' : 'Muito bem!');
      }
      return { duration: 11.1, render };
    }
  };

  /* PASSO 2: Errou? Volta ao início (~10,4 s + pausa de 1,5 s = 11,9 s).
     Copia o jogo real: ao errar, a laje treme e aparece o aviso por 1,0 s; a tela
     escurece em 0,4 s e a personagem reaparece no início com o progresso zerado
     (não há caminhada de volta) e um selo-reiniciar em cima dela. */
  registry['logica-erro'] = {
    loadAssets: loadLogicaAssets,
    create(canvas, assets) {
      const b = createLogicaBase(canvas, assets);
      const ctx = b.ctx;
      const inicio = { x: lx(LOGICA_INICIO[0]), y: ly(LOGICA_INICIO[1]), linha: 3, andando: false };
      const lua = LOGICA_CAMINHOS.ateLua[LOGICA_CAMINHOS.ateLua.length - 1];

      function render(t, estatico) {
        ctx.clearRect(0, 0, STAGE_W, STAGE_H);
        b.fundo();
        if (estatico) {
          b.laje(assets.estrela, LOGICA_ESTRELA, 0.5, '1');
          b.laje(assets.lua, LOGICA_LUA, 0, '2');
          b.tracejado(LOGICA_CAMINHOS.ateLua);
          b.heroi(lx(lua[0]), ly(lua[1]), 2, false, 0);
          drawSeal(ctx, assets, 'erro', lx(LOGICA_LUA[0]), ly(LOGICA_LUA[1]) - 70, 1);
          b.heroi(inicio.x, inicio.y, 3, false, 0, 0.5);
          drawSeal(ctx, assets, 'reiniciar', inicio.x + 50, inicio.y - 60, 0.8);
          b.bolinhas(0);
          b.faixa('Errou? Volta ao começo!');
          return;
        }
        const erro = t >= 7.2 && t < 8.2;
        const tremor = erro && t < 7.6 ? Math.sin((t - 7.2) * 80) * 6 : 0;
        b.laje(assets.estrela, LOGICA_ESTRELA, t >= 0.5 && t < 1.3 ? 1 : 0, t >= 0.5 && t < 1.3 ? '1' : '');
        b.laje(assets.lua, LOGICA_LUA, t >= 1.7 && t < 2.5 ? 1 : 0, t >= 1.7 && t < 2.5 ? '2' : '', tremor);

        let h = inicio;
        if (t >= 3.6 && t < 8.6) h = b.caminhar(LOGICA_CAMINHOS.ateLua, t, 3.6, 7.2);
        b.heroi(h.x + (erro ? tremor : 0), h.y, h.linha, h.andando, t);

        if (erro) {
          drawSeal(ctx, assets, 'erro', lx(LOGICA_LUA[0]) + tremor, ly(LOGICA_LUA[1]) - 70, ease.easeOutBack(Math.min(1, (t - 7.2) / 0.3)));
          if (t < 7.6) { ctx.fillStyle = `rgba(220, 40, 40, ${0.22 * (1 - (t - 7.2) / 0.4)})`; ctx.fillRect(0, 0, STAGE_W, STAGE_H); }
        }
        if (t >= 8.6 && t < 10.4) {
          const s = ease.easeOutBack(Math.min(1, (t - 8.6) / 0.3));
          drawSeal(ctx, assets, 'reiniciar', inicio.x, inicio.y - 105, s * 0.85);
        }
        b.bolinhas(0);
        b.faixa(t < 3.2 ? 'Memorize a ordem!' : t < 7.2 ? 'Agora vá na ordem!' : t < 8.2 ? 'Ops! Não era essa.' : t >= 10.4 ? 'Tente de novo!' : '');

        // Escurecer igual ao jogo (0,4 s) e clarear já com a personagem no início
        let escuro = 0;
        if (t >= 8.2 && t < 8.6) escuro = (t - 8.2) / 0.4;
        else if (t >= 8.6 && t < 9.0) escuro = 1 - (t - 8.6) / 0.4;
        if (escuro > 0) { ctx.fillStyle = `rgba(0, 0, 0, ${escuro})`; ctx.fillRect(0, 0, STAGE_W, STAGE_H); }
      }
      return { duration: 11.9, render };
    }
  };

  /* -------------------------------------------------------------
     DEMONSTRAÇÕES DE OPERAÇÕES (Moinho Encantado — 2 passos)
     Janela horizontal x = 0%..86% da cena cheia (1024×572),
     preservando toda a altura (572 px) na moldura 815×526.
  ------------------------------------------------------------- */
  const OP_CROP_X_RATIO = 0.86;
  const OP_FULL_W = 1024;
  const OP_FULL_H = 572;
  const OP_SX = STAGE_W / (OP_FULL_W * OP_CROP_X_RATIO);
  const OP_SY = STAGE_H / OP_FULL_H;
  const ox = pct => (pct / 86) * STAGE_W;
  const oy = pct => (pct / 100) * STAGE_H;

  const OP_SLOTS_PCT = [
    [40.7, 45.6],
    [45.8, 45.6],
    [50.9, 45.6],
    [56.0, 45.6],
    [61.1, 45.6]
  ];
  const OP_MESA_SACOS_PCT = [
    [23.4, 64.6],
    [27.9, 64.6],
    [32.4, 64.6]
  ];

  async function loadOperacoesAssets() {
    const [
      fundo,
      velas,
      slot,
      carrinho,
      saco,
      placa,
      lanterna,
      maoApontando,
      maoPressionando,
      toque1,
      toque2,
      toque3,
      seloCerto,
      brilho1,
      brilho2,
      brilho3
    ] = await Promise.all([
      loadImage('assets/puzzles/operacoes/fundo_fazenda.png'),
      loadImage('assets/puzzles/operacoes/velas_frames.png'),
      loadImage('assets/puzzles/operacoes/slot.png'),
      loadImage('assets/puzzles/operacoes/carrinho.png'),
      loadImage('assets/puzzles/operacoes/saco_trigo.png'),
      loadImage('assets/puzzles/operacoes/placa_pedido.png'),
      loadImage('assets/puzzles/operacoes/lanterna_apagada.png'),
      loadImage('assets/tutorial/mao-apontando.webp'),
      loadImage('assets/tutorial/mao-pressionando.webp'),
      loadImage('assets/tutorial/toque-1.webp'),
      loadImage('assets/tutorial/toque-2.webp'),
      loadImage('assets/tutorial/toque-3.webp'),
      loadImage('assets/tutorial/selo-certo.webp'),
      loadImage('assets/tutorial/brilho-1.webp'),
      loadImage('assets/tutorial/brilho-2.webp'),
      loadImage('assets/tutorial/brilho-3.webp')
    ]);
    return {
      fundo,
      velas,
      slot,
      carrinho,
      saco,
      placa,
      lanterna,
      maoApontando,
      maoPressionando,
      toque1,
      toque2,
      toque3,
      seloCerto,
      brilho1,
      brilho2,
      brilho3
    };
  }

  function createOperacoesBase(canvas, assets) {
    const ctx = canvas.getContext('2d');
    const font = (typeof getComputedStyle === 'function' && document.body)
      ? (getComputedStyle(document.body).fontFamily || 'sans-serif')
      : 'sans-serif';

    function drawFundo(time = 0, girarVelas = false) {
      ctx.save();
      if (assets.fundo) {
        const cropW = Math.round(assets.fundo.naturalWidth * OP_CROP_X_RATIO);
        ctx.drawImage(
          assets.fundo,
          0, 0, cropW, assets.fundo.naturalHeight,
          0, 0, STAGE_W, STAGE_H
        );
      } else {
        ctx.fillStyle = '#6b8e4e';
        ctx.fillRect(0, 0, STAGE_W, STAGE_H);
      }

      // Velas do moinho em (518, 55), escala 1.3 no espaço 1024×572
      const vx = 518 * OP_SX;
      const vy = 55 * OP_SY;
      const vsizeW = 224 * 1.3 * OP_SX;
      const vsizeH = 224 * 1.3 * OP_SY;
      if (assets.velas) {
        const strip = assets.velas.naturalWidth === 3584;
        const frameIdx = girarVelas ? (Math.floor(time * 8) % 16) : 0;
        const sx = strip ? frameIdx * 224 : (frameIdx % 4) * 224;
        const sy = strip ? 0 : Math.floor(frameIdx / 4) * 224;
        ctx.drawImage(assets.velas, sx, sy, 224, 224, vx - vsizeW / 2, vy - vsizeH / 2, vsizeW, vsizeH);
      }

      // 5 espaços (slots) na plataforma do moinho
      for (let i = 0; i < OP_SLOTS_PCT.length; i++) {
        const [px, py] = OP_SLOTS_PCT[i];
        const sx = ox(px);
        const sy = oy(py);
        const sw = (46 * 176 / 180) * OP_SX;
        const sh = 46 * OP_SY;
        if (assets.slot) {
          ctx.drawImage(assets.slot, sx - sw / 2, sy - 40 * OP_SY, sw, sh);
        } else {
          ctx.fillStyle = '#3d2b1f88';
          ctx.fillRect(sx - sw / 2, sy - sh, sw, sh);
        }
      }

      // Carrinho em (501, 275.34) com escala 0.415 no espaço 1024×572
      if (assets.carrinho) {
        const cw = (assets.carrinho.naturalWidth || 875) * 0.415 * OP_SX;
        const ch = (assets.carrinho.naturalHeight || 509) * 0.415 * OP_SY;
        ctx.drawImage(assets.carrinho, 501 * OP_SX, 275.34 * OP_SY, cw, ch);
      }
      ctx.restore();
    }

    function drawSlotHighlight(slotIndex, alpha) {
      if (alpha <= 0) return;
      const [px, py] = OP_SLOTS_PCT[slotIndex];
      const sx = ox(px);
      const sy = oy(py);
      const sw = 46 * OP_SX;
      const sh = 46 * OP_SY;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#ffe57f';
      ctx.lineWidth = 3;
      ctx.fillStyle = 'rgba(255, 229, 127, 0.28)';
      ctx.beginPath();
      ctx.roundRect(sx - sw / 2 - 3, sy - 40 * OP_SY - 3, sw + 6, sh + 6, 8);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    function drawLanternas(primeiraAcesa = 0) {
      for (let i = 0; i < 3; i++) {
        const lx = (210 + i * 40) * OP_SX;
        const ly = 24 * OP_SY;
        const lw = 27.6 * OP_SX;
        const lh = 39.6 * OP_SY;
        if (assets.lanterna) {
          ctx.drawImage(assets.lanterna, lx, ly, lw, lh);
        } else {
          ctx.fillStyle = '#8b6739';
          ctx.fillRect(lx, ly, lw, lh);
        }
        if (i === 0 && primeiraAcesa > 0) {
          ctx.save();
          ctx.globalAlpha = Math.min(1, primeiraAcesa);
          const cx = lx + lw / 2;
          const cy = ly + lh * 0.55;
          const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 32 * OP_SX);
          grad.addColorStop(0, '#fff7c2');
          grad.addColorStop(0.45, '#ffc84ae0');
          grad.addColorStop(1, 'rgba(255, 200, 74, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, 32 * OP_SX, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    function drawPlaca(lineHighlight = [0, 0, 0], borderPulse = 0) {
      const px = 18 * OP_SX;
      const py = 12 * OP_SY;
      const pw = 170 * OP_SX;
      const ph = 134 * OP_SY;

      ctx.save();
      if (borderPulse > 0) {
        ctx.save();
        ctx.strokeStyle = `rgba(255, 224, 102, ${0.55 + 0.4 * borderPulse})`;
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ffd54f';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.roundRect(px + 4, py + 12, pw - 8, ph - 16, 10);
        ctx.stroke();
        ctx.restore();
      }

      if (assets.placa) {
        ctx.drawImage(assets.placa, px, py, pw, ph);
      } else {
        ctx.fillStyle = '#d9b382';
        ctx.fillRect(px, py, pw, ph);
      }

      const cx = ox(10.1);
      const lines = [
        { text: 'Coloque', y: 59 * OP_SY, size: 16 },
        { text: 'no moinho', y: 83 * OP_SY, size: 16 },
        { text: '2 SACOS', y: 111 * OP_SY, size: 20 }
      ];

      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';

      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        const glow = lineHighlight[i] || 0;
        ctx.save();
        if (glow > 0) {
          const scale = 1 + 0.08 * glow;
          ctx.translate(cx, l.y - 6);
          ctx.scale(scale, scale);
          ctx.translate(-cx, -(l.y - 6));
          if (i === 2) {
            ctx.shadowColor = '#ffe066';
            ctx.shadowBlur = 12 * glow;
            ctx.fillStyle = '#fff5bd';
            ctx.fillRect(cx - 52 * OP_SX, l.y - 19 * OP_SY, 104 * OP_SX, 24 * OP_SY);
          } else {
            ctx.fillStyle = `rgba(255, 243, 180, ${0.55 * glow})`;
            ctx.fillRect(cx - 48 * OP_SX, l.y - 16 * OP_SY, 96 * OP_SX, 20 * OP_SY);
          }
        }
        ctx.fillStyle = '#513525';
        ctx.font = `bold ${Math.round(l.size * OP_SY)}px ${font}`;
        ctx.fillText(l.text, cx, l.y);
        ctx.restore();
      }
      ctx.restore();
    }

    function drawTag(label, pctX, pctY, popScale = 1) {
      const x = ox(pctX);
      const y = oy(pctY);
      const w = 152 * OP_SX;
      const h = 35 * OP_SY;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(popScale, popScale);
      ctx.fillStyle = '#34271de8';
      ctx.fillRect(-w / 2, -20 * OP_SY, w, h);
      ctx.fillStyle = '#fff4d3';
      ctx.font = `bold ${Math.round(17 * OP_SY)}px ${font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(label, 0, 4 * OP_SY);
      ctx.restore();
    }

    function drawSaco(x, y, baseH = 38, scale = 1, shadow = false) {
      const h = baseH * OP_SY * scale;
      const ratio = (assets.saco?.naturalWidth || 130) / (assets.saco?.naturalHeight || 151);
      const w = h * ratio;
      ctx.save();
      if (shadow) {
        ctx.fillStyle = '#22160455';
        ctx.beginPath();
        ctx.ellipse(x, y + 4 * OP_SY, w * 0.55, 6 * OP_SY, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      if (assets.saco) {
        ctx.drawImage(assets.saco, x - w / 2, y - h, w, h);
      } else {
        ctx.fillStyle = '#c99b62';
        ctx.fillRect(x - w / 2, y - h, w, h);
      }
      ctx.restore();
    }

    return {
      ctx,
      drawFundo,
      drawSlotHighlight,
      drawLanternas,
      drawPlaca,
      drawTag,
      drawSaco
    };
  }

  /* PASSO 1: Leia a placa (~6,5 s + 1,5 s pausa = 8,0 s) */
  registry['operacoes-placa'] = {
    loadAssets: loadOperacoesAssets,
    create(canvas, assets) {
      const b = createOperacoesBase(canvas, assets);
      const { ctx } = b;

      const PLACA_CENTER_X = ox(10.1);
      const PLACA_CENTER_Y = oy(15.0);
      const MOINHO_PANEL_X = ox(50.9);
      const MOINHO_PANEL_Y = oy(45.6);

      function render(t, estatico) {
        ctx.clearRect(0, 0, STAGE_W, STAGE_H);
        b.drawFundo(t, false);
        b.drawLanternas(0);

        // 3 sacos na mesa
        for (let i = 0; i < 3; i++) {
          b.drawSaco(ox(OP_MESA_SACOS_PCT[i][0]), oy(OP_MESA_SACOS_PCT[i][1]), 38, 1, false);
        }

        // Rótulos escuros
        b.drawTag('No moinho: 0', 50.8, 35.6, 1);
        b.drawTag('Mesa: 3', 30.2, 59.0, 1);
        b.drawTag('Carrinho: 0', 69.3, 53.9, 1);

        if (estatico) {
          ctx.fillStyle = 'rgba(15, 12, 8, 0.35)';
          ctx.fillRect(0, 0, STAGE_W, STAGE_H);
          b.drawPlaca([0.6, 0.6, 1], 1);

          // Linha tracejada da placa ao painel do moinho
          ctx.save();
          ctx.strokeStyle = '#ffe066';
          ctx.lineWidth = 4;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.moveTo(ox(18.0), oy(16.0));
          ctx.quadraticCurveTo(ox(34.0), oy(24.0), MOINHO_PANEL_X, MOINHO_PANEL_Y - 12);
          ctx.stroke();
          ctx.restore();

          drawHand(ctx, assets, 'apontando', PLACA_CENTER_X + 26, PLACA_CENTER_Y + 18, 1);
          return;
        }

        // Escurecimento suave (~45%) entre 0.6s e 5.5s
        let darkAlpha = 0;
        if (t >= 0.6 && t < 1.1) {
          darkAlpha = 0.45 * ease.easeOutQuad((t - 0.6) / 0.5);
        } else if (t >= 1.1 && t < 5.5) {
          darkAlpha = 0.45;
        } else if (t >= 5.5 && t < 6.1) {
          darkAlpha = 0.45 * (1 - ease.easeOutQuad((t - 5.5) / 0.6));
        }

        if (darkAlpha > 0) {
          ctx.fillStyle = `rgba(15, 12, 8, ${darkAlpha})`;
          ctx.fillRect(0, 0, STAGE_W, STAGE_H);
        }

        // Pulso no painel do moinho a partir de 4.0s
        if (t >= 4.0 && t < 5.5) {
          const p = Math.sin(((t - 4.0) / 1.5) * Math.PI);
          const rx = ox(38.1);
          const ry = oy(38.8);
          const rw = ox(63.7) - rx;
          const rh = oy(53.5) - ry;
          ctx.save();
          ctx.strokeStyle = `rgba(255, 224, 102, ${0.85 * p})`;
          ctx.fillStyle = `rgba(255, 224, 102, ${0.22 * p})`;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.roundRect(rx, ry, rw, rh, 12);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        // Destaque das linhas da placa uma por vez (2.0s -> 4.0s)
        const lineGlow = [0, 0, 0];
        if (t >= 2.0 && t < 5.5) {
          if (t >= 2.0 && t < 2.7) lineGlow[0] = Math.sin(((t - 2.0) / 0.7) * Math.PI);
          if (t >= 2.6 && t < 3.3) lineGlow[1] = Math.sin(((t - 2.6) / 0.7) * Math.PI);
          if (t >= 3.2 && t < 5.5) lineGlow[2] = Math.min(1, (t - 3.2) / 0.35);
        }

        const borderPulse = (t >= 0.6 && t < 5.8) ? (0.5 + 0.5 * Math.sin((t - 0.6) * 5)) : 0;
        b.drawPlaca(lineGlow, borderPulse);

        // Linha tracejada animada da placa até o painel do moinho (4.0s -> 5.5s)
        if (t >= 4.0 && t < 5.5) {
          const prog = Math.min(1, (t - 4.0) / 0.6);
          const startX = ox(18.2);
          const startY = oy(16.0);
          const endX = startX + (MOINHO_PANEL_X - startX) * prog;
          const endY = startY + (MOINHO_PANEL_Y - 10 - startY) * prog;
          ctx.save();
          ctx.strokeStyle = '#ffe066';
          ctx.lineWidth = 4;
          ctx.setLineDash([8, 6]);
          ctx.lineDashOffset = -(t - 4.0) * 30;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          ctx.fillStyle = '#ffe066';
          ctx.beginPath();
          ctx.arc(endX, endY, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Anel de toque na placa (1.5s -> 2.1s)
        if (t >= 1.5 && t < 2.1) {
          drawTouchRing(ctx, assets, PLACA_CENTER_X + 18, PLACA_CENTER_Y + 14, (t - 1.5) / 0.6);
        }

        // Mão apontando entra pela direita em 1.2s e some em 5.5s
        let handOpacity = 0;
        let handX = PLACA_CENTER_X + 22;
        let handY = PLACA_CENTER_Y + 18;
        if (t >= 1.2 && t < 1.7) {
          const p = ease.easeOutCubic((t - 1.2) / 0.5);
          handOpacity = Math.min(1, (t - 1.2) / 0.25);
          handX = (PLACA_CENTER_X + 130) + (PLACA_CENTER_X + 22 - (PLACA_CENTER_X + 130)) * p;
          handY = (PLACA_CENTER_Y + 50) + (PLACA_CENTER_Y + 18 - (PLACA_CENTER_Y + 50)) * p;
        } else if (t >= 1.7 && t < 5.5) {
          handOpacity = 1;
          if (t >= 2.0 && t < 3.8) {
            const lineIdx = t < 2.6 ? 0 : t < 3.2 ? 1 : 2;
            const targetY = (lineIdx === 0 ? 59 : lineIdx === 1 ? 83 : 111) * OP_SY;
            handY = targetY + 4;
          }
        } else if (t >= 5.5 && t < 6.0) {
          handOpacity = Math.max(0, 1 - (t - 5.5) / 0.5);
        }

        drawHand(ctx, assets, 'apontando', handX, handY, handOpacity);
      }

      return { duration: 8.0, render };
    }
  };

  /* PASSO 2: Coloque os sacos no moinho (~8,0 s + 1,5 s pausa = 9,5 s) */
  registry['operacoes-arrastar'] = {
    loadAssets: loadOperacoesAssets,
    create(canvas, assets) {
      const b = createOperacoesBase(canvas, assets);
      const { ctx } = b;

      const S1_START_X = ox(OP_MESA_SACOS_PCT[0][0]);
      const S1_START_Y = oy(OP_MESA_SACOS_PCT[0][1]);
      const S2_START_X = ox(OP_MESA_SACOS_PCT[1][0]);
      const S2_START_Y = oy(OP_MESA_SACOS_PCT[1][1]);
      const S3_START_X = ox(OP_MESA_SACOS_PCT[2][0]);
      const S3_START_Y = oy(OP_MESA_SACOS_PCT[2][1]);

      const SLOT1_X = ox(OP_SLOTS_PCT[0][0]);
      const SLOT1_Y = oy(OP_SLOTS_PCT[0][1]);
      const SLOT2_X = ox(OP_SLOTS_PCT[1][0]);
      const SLOT2_Y = oy(OP_SLOTS_PCT[1][1]);

      function render(t, estatico) {
        ctx.clearRect(0, 0, STAGE_W, STAGE_H);

        if (estatico) {
          b.drawFundo(0, true);
          b.drawPlaca([0, 0, 1], 0);
          b.drawLanternas(1);

          // Saco 1 já no 1º espaço, Saco 2 no 2º espaço, Saco 3 na mesa
          b.drawSaco(SLOT1_X, SLOT1_Y, 44, 1, false);
          b.drawSaco(SLOT2_X, SLOT2_Y, 44, 1, false);
          b.drawSaco(S3_START_X, S3_START_Y, 38, 1, false);

          // Seta tracejada da mesa ao moinho
          ctx.save();
          ctx.strokeStyle = '#ffe066';
          ctx.lineWidth = 4;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.moveTo(S2_START_X, S2_START_Y - 18);
          ctx.quadraticCurveTo((S2_START_X + SLOT2_X) / 2, SLOT2_Y - 55, SLOT2_X, SLOT2_Y - 18);
          ctx.stroke();
          ctx.restore();

          b.drawTag('No moinho: 2', 50.8, 35.6, 1);
          b.drawTag('Mesa: 1', 30.2, 59.0, 1);
          b.drawTag('Carrinho: 0', 69.3, 53.9, 1);

          drawSeal(ctx, assets, 'certo', ox(50.9), oy(45.6) - 24, 1);
          return;
        }

        const concluido = t >= 7.2;
        b.drawFundo(t, concluido);
        b.drawPlaca([0, 0, 0], 0);

        const lanternaAcesa = t >= 7.2 ? Math.min(1, (t - 7.2) / 0.35) : 0;
        b.drawLanternas(lanternaAcesa);

        // Destaque nos slots ao receber cada saco
        if (t >= 2.2 && t < 3.4) {
          const a = t < 3.2 ? Math.min(1, (t - 2.2) / 0.4) : Math.max(0, 1 - (t - 3.2) / 0.2);
          b.drawSlotHighlight(0, a);
        }
        if (t >= 5.4 && t < 6.6) {
          const a = t < 6.4 ? Math.min(1, (t - 5.4) / 0.4) : Math.max(0, 1 - (t - 6.4) / 0.2);
          b.drawSlotHighlight(1, a);
        }

        // Estado do 1º saco
        let s1X = S1_START_X;
        let s1Y = S1_START_Y;
        let s1BaseH = 38;
        let s1Scale = 1;
        let s1Shadow = false;

        if (t >= 1.4 && t < 2.0) {
          const p = ease.easeOutQuad((t - 1.4) / 0.6);
          s1Scale = 1 + 0.08 * p;
          s1Y = S1_START_Y - 5 * p;
          s1Shadow = true;
        } else if (t >= 2.0 && t < 3.2) {
          const p = ease.easeInOutCubic((t - 2.0) / 1.2);
          s1X = S1_START_X + (SLOT1_X - S1_START_X) * p;
          s1Y = (S1_START_Y - 5) + (SLOT1_Y - (S1_START_Y - 5)) * p - Math.sin(p * Math.PI) * 48;
          s1BaseH = 38 + (44 - 38) * p;
          s1Scale = 1.08;
          s1Shadow = true;
        } else if (t >= 3.2) {
          s1X = SLOT1_X;
          s1Y = SLOT1_Y;
          s1BaseH = 44;
          if (t < 3.6) {
            s1Scale = 1 + 0.1 * Math.sin(((t - 3.2) / 0.4) * Math.PI);
          }
        }

        // Estado do 2º saco
        let s2X = S2_START_X;
        let s2Y = S2_START_Y;
        let s2BaseH = 38;
        let s2Scale = 1;
        let s2Shadow = false;

        if (t >= 4.6 && t < 5.2) {
          const p = ease.easeOutQuad((t - 4.6) / 0.6);
          s2Scale = 1 + 0.08 * p;
          s2Y = S2_START_Y - 5 * p;
          s2Shadow = true;
        } else if (t >= 5.2 && t < 6.4) {
          const p = ease.easeInOutCubic((t - 5.2) / 1.2);
          s2X = S2_START_X + (SLOT2_X - S2_START_X) * p;
          s2Y = (S2_START_Y - 5) + (SLOT2_Y - (S2_START_Y - 5)) * p - Math.sin(p * Math.PI) * 48;
          s2BaseH = 38 + (44 - 38) * p;
          s2Scale = 1.08;
          s2Shadow = true;
        } else if (t >= 6.4) {
          s2X = SLOT2_X;
          s2Y = SLOT2_Y;
          s2BaseH = 44;
          if (t < 6.8) {
            s2Scale = 1 + 0.1 * Math.sin(((t - 6.4) / 0.4) * Math.PI);
          }
        }

        // Desenha os sacos (saco sendo arrastado por cima dos demais)
        b.drawSaco(S3_START_X, S3_START_Y, 38, 1, false);
        if (s1Shadow) {
          b.drawSaco(s2X, s2Y, s2BaseH, s2Scale, s2Shadow);
          b.drawSaco(s1X, s1Y, s1BaseH, s1Scale, s1Shadow);
        } else {
          b.drawSaco(s1X, s1Y, s1BaseH, s1Scale, s1Shadow);
          b.drawSaco(s2X, s2Y, s2BaseH, s2Scale, s2Shadow);
        }

        // Contadores e pulinho ao atualizar em 3.2s e 6.4s
        const noMoinho = t < 3.2 ? 0 : t < 6.4 ? 1 : 2;
        const naMesa = 3 - noMoinho;
        let popLabels = 1;
        if (t >= 3.2 && t < 3.55) {
          popLabels = 1 + 0.14 * Math.sin(((t - 3.2) / 0.35) * Math.PI);
        } else if (t >= 6.4 && t < 6.75) {
          popLabels = 1 + 0.14 * Math.sin(((t - 6.4) / 0.35) * Math.PI);
        }

        b.drawTag(`No moinho: ${noMoinho}`, 50.8, 35.6, popLabels);
        b.drawTag(`Mesa: ${naMesa}`, 30.2, 59.0, popLabels);
        b.drawTag('Carrinho: 0', 69.3, 53.9, 1);

        // Posição e pose da mão
        let handPose = 'apontando';
        let handX = S1_START_X + 35;
        let handY = S1_START_Y + 25;
        let handOpacity = 0;

        if (t >= 0.8 && t < 1.4) {
          const p = ease.easeOutCubic((t - 0.8) / 0.6);
          handOpacity = Math.min(1, (t - 0.8) / 0.25);
          handX = (S1_START_X + 45) + (S1_START_X - (S1_START_X + 45)) * p;
          handY = (S1_START_Y + 30) + ((S1_START_Y - 16) - (S1_START_Y + 30)) * p;
        } else if (t >= 1.4 && t < 3.2) {
          handOpacity = 1;
          handPose = 'pressionando';
          handX = s1X;
          handY = s1Y - 16;
        } else if (t >= 3.2 && t < 4.0) {
          handOpacity = 1;
          handPose = 'apontando';
          const p = ease.easeInOutQuad((t - 3.2) / 0.8);
          handX = SLOT1_X + (S2_START_X - SLOT1_X) * p;
          handY = (SLOT1_Y - 16) + ((S2_START_Y - 16) - (SLOT1_Y - 16)) * p;
        } else if (t >= 4.0 && t < 4.6) {
          handOpacity = 1;
          handPose = 'apontando';
          handX = S2_START_X;
          handY = S2_START_Y - 16;
        } else if (t >= 4.6 && t < 6.4) {
          handOpacity = 1;
          handPose = 'pressionando';
          handX = s2X;
          handY = s2Y - 16;
        } else if (t >= 6.4 && t < 8.0) {
          handPose = 'apontando';
          handX = SLOT2_X + Math.min(1, (t - 6.4) / 0.6) * 28;
          handY = (SLOT2_Y - 16) + Math.min(1, (t - 6.4) / 0.6) * 18;
          handOpacity = t < 7.5 ? 1 : Math.max(0, 1 - (t - 7.5) / 0.5);
        }

        if (t >= 1.4 && t < 1.9) {
          drawTouchRing(ctx, assets, S1_START_X, S1_START_Y - 16, (t - 1.4) / 0.5);
        }
        if (t >= 4.6 && t < 5.1) {
          drawTouchRing(ctx, assets, S2_START_X, S2_START_Y - 16, (t - 4.6) / 0.5);
        }

        drawHand(ctx, assets, handPose, handX, handY, handOpacity);

        // Em 7.2s: selo-certo sobre o moinho e brilhos (brilho-1..3)
        if (t >= 7.2) {
          const sealScale = ease.easeOutBack(Math.min(1, (t - 7.2) / 0.35));
          const cx = ox(45.8);
          const cy = oy(45.6) - 26;
          drawSeal(ctx, assets, 'certo', cx, cy, sealScale);
          const sp = Math.min(3, Math.floor((t - 7.25) / 0.25) + 1);
          if (sp >= 1) drawSparkle(ctx, assets, 1, cx - 55, cy - 30, 26);
          if (sp >= 2) drawSparkle(ctx, assets, 2, cx + 55, cy - 25, 32);
          if (sp >= 3) drawSparkle(ctx, assets, 3, cx, cy + 42, 36);
        }
      }

      return { duration: 9.5, render };
    }
  };

  /* -------------------------------------------------------------
     MOTOR DE EXECUÇÃO (Loop via requestAnimationFrame com delta)
  ------------------------------------------------------------- */
  let activeRunner = null;

  function iniciar(demoId, canvas, options = {}) {
    parar();

    const config = registry[demoId];
    if (!config) {
      console.warn(`[TutorialDemos] Demonstração '${demoId}' não encontrada.`);
      return null;
    }

    let running = true;
    let rafId = null;
    let lastTime = 0;
    let elapsed = 0;
    let isPlayingOnce = false;
    let instance = null;

    // Carrega assets e inicia loop
    config.loadAssets().then(assets => {
      if (!running || !canvas) return;
      instance = config.create(canvas, assets);

      const calm = isCalmMotion();
      if (calm && !options.forcePlay) {
        // Exibe quadro estático explicativo
        instance.render(0, true);
        return;
      }

      function step(now) {
        if (!running) return;
        if (!lastTime) lastTime = now;
        const dt = Math.min(0.1, (now - lastTime) / 1000);
        lastTime = now;

        if (!document.hidden) {
          elapsed += dt;
          if (elapsed >= instance.duration) {
            if (isPlayingOnce) {
              // Concluiu reprodução única em modo calmo: volta ao estático
              instance.render(0, true);
              isPlayingOnce = false;
              lastTime = 0;
              return;
            }
            elapsed = 0; // Loop contínuo com pausa de 1.5s já incluída no fim da duration
          }
          instance.render(elapsed, false);
        }

        rafId = requestAnimationFrame(step);
      }

      rafId = requestAnimationFrame(step);
    });

    const runner = {
      id: demoId,
      tocarUmaVez() {
        if (!instance) return;
        if (rafId) cancelAnimationFrame(rafId);
        isPlayingOnce = true;
        elapsed = 0;
        lastTime = 0;
        running = true;

        function playStep(now) {
          if (!running) return;
          if (!lastTime) lastTime = now;
          const dt = Math.min(0.1, (now - lastTime) / 1000);
          lastTime = now;

          elapsed += dt;
          if (elapsed >= instance.duration) {
            instance.render(0, true);
            isPlayingOnce = false;
            return;
          }

          instance.render(elapsed, false);
          rafId = requestAnimationFrame(playStep);
        }
        rafId = requestAnimationFrame(playStep);
      },
      parar() {
        running = false;
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }
    };

    activeRunner = runner;
    return runner;
  }

  function parar() {
    if (activeRunner) {
      activeRunner.parar();
      activeRunner = null;
    }
  }

  // Pausa automática quando a aba é ocultada
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      // O delta time em step() já descarta grandes intervalos e paused em hidden
    });
  }

  return {
    STAGE_W,
    STAGE_H,
    MAO_PONTA_X,
    MAO_PONTA_Y,
    MAO_ESCALA,
    registrar(id, demoConfig) {
      registry[id] = demoConfig;
    },
    iniciar,
    parar,
    getActiveRunner: () => activeRunner
  };
})();
