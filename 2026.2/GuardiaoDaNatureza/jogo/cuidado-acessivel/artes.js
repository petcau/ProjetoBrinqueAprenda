"use strict";
(() => {
  let serial = 0;
  const plants = ["ipê", "ingá", "aroeira"];
  function plant(name) {
    const id = "muda-nativa-" + serial++;
    const row = plants.indexOf(name),
      color = ["#71ad42", "#438c49", "#689748"][Math.max(0, row)];
    const leaves = Array.from({ length: row === 1 ? 12 : 9 }, (_, i) => {
      const x = 24 + ((i * 23) % 70),
        y = 24 + ((i * 17) % 47);
      return `<ellipse cx="${x}" cy="${y}" rx="${row === 1 ? 17 : 23}" ry="${row === 1 ? 8 : 17}" transform="rotate(${i % 2 ? -25 : 20} ${x} ${y})" fill="url(#${id}-leaf)" stroke="#31562e" stroke-width="1.8"/><path d="M${x - 10} ${y + 3}q10 -5 20 -5" fill="none" stroke="#cadc86" stroke-opacity=".45"/>`;
    }).join("");
    const detail =
      row === 0
        ? [
            [33, 28],
            [77, 30],
            [55, 47],
            [85, 55],
            [26, 53],
          ]
            .map(
              ([x, y]) =>
                `<g fill="#f6d96b" stroke="#b99038" stroke-width=".7"><circle cx="${x - 3}" cy="${y}" r="4"/><circle cx="${x + 3}" cy="${y}" r="4"/><circle cx="${x}" cy="${y - 4}" r="4"/><circle cx="${x}" cy="${y + 3}" r="4"/><circle cx="${x}" cy="${y}" r="2" fill="#fff0b2"/></g>`,
            )
            .join("")
        : row === 2
          ? [
              [27, 49],
              [76, 61],
              [68, 22],
              [43, 42],
            ]
              .map(
                ([x, y]) =>
                  `<circle cx="${x}" cy="${y}" r="3" fill="#bf5340" stroke="#7e382d"/>`,
              )
              .join("")
          : "";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140" aria-hidden="true"><defs><linearGradient id="${id}-leaf" x2=".6" y2="1"><stop stop-color="#b4d66b"/><stop offset=".45" stop-color="${color}"/><stop offset="1" stop-color="#316039"/></linearGradient><linearGradient id="${id}-wood"><stop stop-color="#70462b"/><stop offset=".45" stop-color="#bb8751"/><stop offset="1" stop-color="#68412b"/></linearGradient></defs><ellipse cx="60" cy="128" rx="31" ry="7" fill="#273924" opacity=".18"/><path d="M57 122l2-70m1 45L35 70m25 13l23-27m-24 65l-11 5m13-5l11 5" fill="none" stroke="#543d2a" stroke-width="8" stroke-linecap="round"/><path d="M57 122l2-70m1 45L35 70m25 13l23-27" fill="none" stroke="url(#${id}-wood)" stroke-width="5" stroke-linecap="round"/>${leaves}${detail}<path d="M39 125q20-9 43 0" fill="none" stroke="#8e6b40" stroke-width="3"/><path d="M37 121q-6-9-9-7m55 9q4-12 10-10" fill="none" stroke="#75a34a" stroke-width="2"/></svg>`;
  }
  function bin(kind) {
    const id = "lixeira-da-ilha-" + serial++,
      color =
        { recyclable: "#468da6", organic: "#a77b4e", residual: "#77868c" }[
          kind
        ] || "#468da6";
    const symbol =
      kind === "organic"
        ? '<path d="M58 88V57m0 14q-25 2-19-18q20 0 19 18m1 10q25 0 21-20q-20 0-21 20"/>'
        : kind === "residual"
          ? '<path d="M46 62l25 26m0-26L46 88" fill="none" stroke-width="7" stroke-linecap="round"/>'
          : '<path d="M50 54l10-6l10 16l-8 5l-2-7l-5-6m20 14l6 10l-14 12l-6-8l7-1l4-5M56 91l-13 1l-6-19l9-3l-3 7l3 5" fill="none" stroke-width="5" stroke-linejoin="round"/>';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140" aria-hidden="true"><defs><linearGradient id="${id}-body" x2="1" y2=".2"><stop stop-color="${color}"/><stop offset=".5" stop-color="${color}"/><stop offset="1" stop-color="#394f4d"/></linearGradient><linearGradient id="${id}-rim" x2="0" y2="1"><stop stop-color="#d1ad68"/><stop offset=".55" stop-color="#9d713f"/><stop offset="1" stop-color="#68472d"/></linearGradient></defs><ellipse cx="60" cy="128" rx="43" ry="9" fill="#17362d" opacity=".2"/><rect x="28" y="116" width="11" height="15" rx="5" fill="#33433e"/><rect x="81" y="116" width="11" height="15" rx="5" fill="#33433e"/><path d="M27 38l65-5l-3 83q-25 17-57 5Z" fill="url(#${id}-body)" stroke="#3c4d3e" stroke-width="3"/><path d="M36 47l3 62m44-63l-3 61" stroke="#d9ebcb" stroke-opacity=".3" stroke-width="3" stroke-linecap="round"/><path d="M20 34l14-14h60l9 14v12L20 50Z" fill="url(#${id}-rim)" stroke="#5a482c" stroke-width="2.5"/><path d="M27 34l66-5" stroke="#f1d299" stroke-width="2"/><path d="M47 21v-7h28v6" fill="none" stroke="#516441" stroke-width="6" stroke-linejoin="round"/><path d="M29 115q30 12 61-4" fill="none" stroke="#dab678" stroke-width="4"/><rect x="36" y="50" width="45" height="49" rx="12" fill="#23483b" stroke="#c9bc7c" stroke-width="2"/><g fill="#f6ecc8" stroke="#f6ecc8" stroke-width="1.4">${symbol}</g><path d="M91 24q7-13 15-9q-1 12-15 9" fill="#87b85b" stroke="#406037"/><path d="M22 49l-4 9v11m83-24l4 8v10" fill="none" stroke="#4c6449" stroke-width="4" stroke-linecap="round"/></svg>`;
  }
  window.GuardiaoColecao = Object.freeze({
    ...window.GuardiaoColecao,
    plant,
    bin,
  });
  const Previous = window.GuardiaoAdventureArt;
  class NatureArt extends Previous {
    async ensure(name) {
      if (name === "plantas") return;
      return super.ensure(name);
    }
    async load() {
      await super.load();
      this.neighbors = new GuardiaoCampaignSprites();
      await this.neighbors.load(["npcs"]);
      if (this.phase === 4)
        await Promise.all(
          plants.map((name) => this.drawing(name, plant(name))),
        );
    }
    plant(ctx, name, x, y, height, time, reduced) {
      const im = this.drawings.get(name);
      if (!im) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(reduced ? 0 : Math.sin(time * 1.6 + x) * 0.025);
      ctx.drawImage(im, -height * 0.43, -height * 0.94, height * 0.86, height);
      ctx.restore();
    }
    bins(ctx, station) {
      ["recyclable", "organic", "residual"].forEach((kind, i) => {
        const x = station.x - 74 + i * 74,
          im = this.drawings.get(kind);
        if (im) ctx.drawImage(im, x - 34, station.y - 79, 68, 80);
        ctx.save();
        ctx.font = "bold 10px system-ui";
        ctx.textAlign = "center";
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#244635";
        ctx.fillStyle = "#fff4d6";
        const label = ["Recicláveis", "Orgânicos", "Rejeitos"][i];
        ctx.strokeText(label, x, station.y + 13);
        ctx.fillText(label, x, station.y + 13);
        ctx.restore();
      });
    }
    drawResident(ctx, actor, player) {
      if (actor.role !== undefined && this.neighbors) {
        this.neighbors.draw(
          ctx,
          "npcs",
          actor.role * 3 + actor.pose,
          actor.x,
          actor.y,
          actor.height,
          { flip: player ? player.x < actor.x : false },
        );
      } else super.drawResident(ctx, actor, player);
    }
  }
  window.GuardiaoAdventureArt = NatureArt;
})();
