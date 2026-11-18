"use strict";
(() => {
  // Ajusta a direção da arte durante a conversa; a posição e a colisão continuam
  // nas mãos do controlador. Não escreve na direção salva do jogador.
  const phase = location.pathname.includes("/floresta-viva/")
    ? 1
    : Number(new URLSearchParams(location.search).get("fase") || 2);
  const npc =
    phase === 1
      ? { x: 245, y: 245 }
      : window.GuardiaoFasesJogaveis?.[phase]?.npcPosition;
  if (!npc) return;
  let player =
    phase === 1
      ? { x: 286, y: 260 }
      : window.GuardiaoFasesJogaveis[phase].start;
  const talking = () =>
    !!document.querySelector("#conversa[open],#intro[open]");
  const direction = (x, y) =>
    (Math.round((Math.atan2(-(npc.y - y), npc.x - x) * 4) / Math.PI) + 8) % 8;
  function look(p) {
    if (!talking()) return p;
    const d = direction(p.x, p.y);
    if (document.body.dataset.talkDirection !== String(d))
      document.body.dataset.talkDirection = String(d);
    return { ...p, direction: d };
  }
  const Life = window.GuardiaoVidaNatural;
  class LifeWithGaze extends Life {
    ground(ctx, p, ...args) {
      player = p;
      return super.ground(ctx, p, ...args);
    }
  }
  window.GuardiaoVidaNatural = LifeWithGaze;
  const Art = window.GuardiaoAdventureArt;
  class ArtWithGaze extends Art {
    outfit(ctx, p, ...args) {
      return super.outfit(ctx, look(p), ...args);
    }
    river(ctx, p, ...args) {
      return super.river(ctx, look(p), ...args);
    }
  }
  window.GuardiaoAdventureArt = ArtWithGaze;
  const Sprites = window.FlorestaSprites;
  class ForestSprites extends Sprites {
    async load(...args) {
      await Promise.all([super.load(...args), GuardiaoRelicario.load()]);
      return this;
    }
    draw(ctx, name, index, x, y, height, options = {}) {
      if (ctx.canvas.id === "cenario") {
        if (name === "carlos") {
          options = { ...options, flip: player.x < x };
          const label = options.flip ? "esquerda" : "direita";
          if (document.body.dataset.npcFacing !== label)
            document.body.dataset.npcFacing = label;
        }
        if (name === "kai-repouso" && talking()) {
          const d = direction(x, y),
            row = d === 2 ? 2 : d >= 3 && d <= 5 ? 4 : d === 6 ? 6 : 0;
          index = row + (index % 2);
          if (document.body.dataset.talkDirection !== String(d))
            document.body.dataset.talkDirection = String(d);
        }
      }
      return super.draw(ctx, name, index, x, y, height, options);
    }
    item(ctx, id, x, y, size, options = {}) {
      if (id !== 2) return super.item(ctx, id, x, y, size, options);
      ctx.save();
      ctx.globalAlpha *= options.alpha ?? 1;
      GuardiaoRelicario.paintStone(
        ctx,
        0,
        x - size / 2,
        y - size / 2,
        size,
        size,
      );
      ctx.restore();
    }
  }
  window.FlorestaSprites = ForestSprites;
  const Campaign = window.GuardiaoCampaignSprites;
  if (Campaign) {
    class CampaignSprites extends Campaign {
      draw(ctx, name, index, x, y, height, options = {}) {
        if (name === "npcs" && ctx.canvas.id === "cenario") {
          options = { ...options, flip: player.x < x };
          const label = options.flip ? "esquerda" : "direita";
          if (document.body.dataset.npcFacing !== label)
            document.body.dataset.npcFacing = label;
        }
        return super.draw(ctx, name, index, x, y, height, options);
      }
    }
    window.GuardiaoCampaignSprites = CampaignSprites;
  }
})();
