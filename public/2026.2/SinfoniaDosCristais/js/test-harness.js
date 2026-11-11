/* AI Playtest & Telemetry Harness (window.CrystalTestAPI).
 * Inspects and drives True Pixel Art worlds (CaveChapter1 & TruePixelWorlds)
 * plus Menu/Map navigation for automated E2E playtesting.
 */
(() => {
  'use strict';

  function getActiveWorldModule() {
    if (window.CaveChapter1?.isActiveGame?.()) {
      return { kind: 'cave', mod: window.CaveChapter1 };
    }
    if (window.TruePixelWorlds?.isActiveGame?.()) {
      return { kind: 'worlds', mod: window.TruePixelWorlds };
    }
    return null;
  }

  function skipStory() {
    let steps = 0;
    const E = window.TruePixelEngine;
    const active = getActiveWorldModule();
    if (active?.mod?.phase === 'cutscene_enter' || active?.mod?.phase === 'cutscene_wake') {
      for (let i = 0; i < 40 && (active.mod.phase === 'cutscene_enter' || active.mod.phase === 'cutscene_wake'); i++) {
        active.mod.update?.(0.1);
      }
      steps++;
    }
    while (E?.DialogueBox?.isOpen && steps < 40) {
      E.DialogueBox.advance();
      steps++;
    }
    if (E?.TutorialModal?.isOpen) {
      const done = E.TutorialModal.onDone;
      E.TutorialModal.close();
      if (typeof done === 'function') done();
      steps++;
    }
    return steps > 0;
  }

  function closeDialogs() {
    if (window.AssetPreloader) {
      window.AssetPreloader.active = false;
      window.AssetPreloader.fadingOut = true;
    }
    const pre = document.getElementById('preloaderScreen');
    if (pre) pre.remove();
    skipStory();
    for (const id of ['settingsDialog', 'creditsDialog', 'exitDialog']) {
      const dlg = document.getElementById(id);
      if (dlg?.open) dlg.close();
    }
    const E = window.TruePixelEngine;
    if (E?.GameHUD) {
      E.GameHUD.paused = false;
      E.GameHUD.settingsOpen = false;
    }
  }

  function getState() {
    const active = getActiveWorldModule();
    const E = window.TruePixelEngine;
    const mod = active?.mod || null;
    const pieces = mod
      ? (mod.pieces || [])
          .filter(p => !p.broken && p.value > 0)
          .map(p => ({
            id: p.id,
            type: p.type,
            value: p.value,
            shadow: !!p.shadow,
            inEquation: p.inEquation || null,
            inFraction: p.inFraction || null,
            boosted: !!p.boosted,
            shape: p.shape || null,
            borderType: p.borderType || null,
            coreType: p.coreType || null,
            x: p.x,
            y: p.y
          }))
      : [];

    return {
      screen: document.body.dataset.screen || 'home',
      app: window.CrystalApp?.state || null,
      dialogueOpen: !!E?.DialogueBox?.isOpen,
      tutorialOpen: !!E?.TutorialModal?.isOpen,
      hud: {
        paused: Boolean(E?.GameHUD?.paused),
        muted: Boolean(E?.GameHUD?.muted),
        settingsOpen: Boolean(E?.GameHUD?.settingsOpen)
      },
      performance: window.CrystalPerformance?.report?.() || null,
      caveKaraoke: (() => {
        const K = window.CaveRhythmKaraoke;
        const C = window.CaveChapter1;
        if (!K || !C || (C.currentLevel !== 5 && !C.phase?.startsWith('musical_'))) return null;
        const isPractice = C.phase === 'musical_vignette' && C.vignetteCard === 2;
        const mt = isPractice ? (C.vignettePracticeTime || 0) : (C.musicalTime || 0);
        const phrase = K.getCurrentPhrase ? K.getCurrentPhrase(mt, isPractice) : null;
        const pos = typeof K.getBallPosition === 'function' ? K.getBallPosition(mt, isPractice) : null;
        const phraseIdx = phrase && K.phrases ? K.phrases.indexOf(phrase) : -1;
        let wordIdx = -1;
        if (phrase && phrase.words) {
          wordIdx = phrase.words.findIndex(w => mt >= w.t && mt <= (w.t + (w.isHold ? (w.holdDur || w.dur) : w.dur)));
        }
        return {
          phraseIndex: phraseIdx,
          wordIndex: wordIdx,
          musicalTime: mt,
          ballX: pos ? pos.x : 0,
          ballY: pos ? pos.y : 0,
          arcHeight: pos ? pos.arcHeight : 0,
          arcActive: pos ? Boolean(pos.arcActive) : false,
          isPractice: Boolean(isPractice),
          phase: C.phase
        };
      })(),
      worldRuntime: mod
        ? {
            module: active.kind,
            worldKey: active.kind === 'cave' ? 'cave' : mod.worldKey,
            worldLabel: E?.GameHUD?.worldLabel || '',
            phase: mod.phase,
            currentLevel: mod.currentLevel,
            currentStep: mod.currentStep,
            totalSteps: mod.totalSteps,
            emeraldAltar: mod.emeraldAltar ? { x: mod.emeraldAltar.x, y: mod.emeraldAltar.y } : null,
            fractionPlatform: mod.fractionPlatform
              ? {
                  x: mod.fractionPlatform.x,
                  y: mod.fractionPlatform.y,
                  topSum: mod.fractionPlatform.topSum,
                  bottomSum: mod.fractionPlatform.bottomSum,
                  glowing: !!mod.fractionPlatform.glowing,
                  broken: !!mod.fractionPlatform.broken
                }
              : null,
            riverMelody: mod.riverMelody
              ? {
                  roundIndex: mod.riverMelody.roundIndex,
                  phase: mod.riverMelody.phase,
                  playerIndex: mod.riverMelody.playerIndex,
                  calmMode: !!mod.riverMelody.calmMode,
                  crystalsCount: (mod.riverMelody.crystals || []).length
                }
              : null,
            electricShapes: (mod.electricShapes || []).map(es => ({
              id: es.id,
              shape: es.shape,
              x: es.x,
              y: es.y,
              used: !!es.used
            })),
            shellGame: mod.shellGame
              ? {
                  round: mod.shellGame.round,
                  totalRounds: mod.shellGame.totalRounds,
                  calmMode: !!mod.shellGame.calmMode,
                  opalCupIdx: mod.shellGame.opalCupIdx,
                  cupsCount: (mod.shellGame.cups || []).length
                }
              : null,
            forestNinja: mod.forestNinja
              ? {
                  phase: mod.forestNinja.phase,
                  vignetteCard: mod.forestNinja.vignetteCard,
                  currentStage: mod.forestNinja.currentStage,
                  totalStages: mod.forestNinja.totalStages,
                  stageTimeRemaining: mod.forestNinja.stageTimeRemaining,
                  strikes: mod.forestNinja.strikes,
                  maxStrikes: mod.forestNinja.maxStrikes,
                  pureCuts: mod.forestNinja.pureCuts,
                  maxCombo: mod.forestNinja.maxCombo,
                  flyingCount: (mod.forestNinja.flyingCrystals || []).length
                }
              : null,
            pureEquation: mod.pureEquation
              ? { x: mod.pureEquation.x, y: mod.pureEquation.y, expanded: !!mod.pureEquation.expanded, broken: !!mod.pureEquation.broken }
              : null,
            shadowEquation: mod.shadowEquation
              ? { x: mod.shadowEquation.x, y: mod.shadowEquation.y, expanded: !!mod.shadowEquation.expanded, broken: !!mod.shadowEquation.broken }
              : null,
            pieces
          }
        : null
    };
  }

  function unlockAllLevelsForTest() {
    window.CrystalApp?.unlockAll?.();
    return true;
  }

  function startLevel(id, skipIntroDialog = true) {
    closeDialogs();
    window.CrystalApp?.unlockAll?.();
    window.CrystalApp?.startLevel?.(id);
    if (skipIntroDialog) {
      skipStory();
    }
    return getState();
  }

  function goto(screenName) {
    closeDialogs();
    if (screenName !== 'game') {
      window.CaveChapter1?.deactivateCanvas?.();
      window.TruePixelWorlds?.deactivateCanvas?.();
    }
    window.CrystalApp?.goto?.(screenName);
    return getState();
  }

  function restartLevel() {
    closeDialogs();
    if (window.CaveChapter1?.isActiveGame?.()) {
      window.CaveChapter1.restartCurrentPhase();
    } else if (window.TruePixelWorlds?.isActiveGame?.()) {
      window.TruePixelWorlds.restartCurrentPhase();
    }
    return getState();
  }

  function solveCurrentLevel() {
    skipStory();
    const active = getActiveWorldModule();
    if (!active) {
      return { ok: false, reason: 'Nenhuma fase True Pixel ativa no momento.' };
    }
    const mod = active.mod;
    while (mod.currentStep < mod.totalSteps) {
      if (active.kind === 'cave') {
        mod.currentStep++;
        mod.setupLevelStep(mod.currentLevel, mod.currentStep);
      } else {
        mod.setupStep(mod.currentStep + 1);
      }
    }
    for (const p of mod.pieces) {
      if (p.shadow) p.broken = true;
    }
    if (mod.shadowEquation) mod.shadowEquation.broken = true;
    if (mod.pureEquation) mod.pureEquation.broken = true;
    if (typeof mod.checkIfAllStepTargetsCleared === 'function') {
      mod.checkIfAllStepTargetsCleared(160, 88);
    } else {
      mod.checkStepCleared?.();
    }
    return {
      ok: true,
      module: active.kind,
      worldKey: active.kind === 'cave' ? 'cave' : mod.worldKey,
      phase: mod.phase
    };
  }

  window.CrystalTestAPI = {
    getState,
    goto,
    startLevel,
    restartLevel,
    skipEntrance: () => false,
    skipStory,
    closeDialogs,
    solveCurrentLevel,
    unlockAllLevelsForTest
  };
})();
