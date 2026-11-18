"use strict";
(() => {
  const base = new URL("./", document.currentScript.src);
  const geometry = window.GuardiaoColarGeometria;
  const clamp = (n) => Math.max(0, Math.min(1, n));
  const ease = (n) => {
    const t = clamp(n);
    return t * t * (3 - 2 * t);
  };
  const colors = ["#ff4739", "#39b9ed", "#e9b63c", "#6acb5e", "#b98bff"];
  const titles = [
    "O primeiro cuidado",
    "A força da água",
    "Amigos em segurança",
    "A floresta renasce",
    "Cinco cuidados, um Guardião",
  ];
  class Necklace {
    constructor({ phase, life }) {
      this.phase = phase;
      this.life = life;
      this.earned = [];
      this.active = false;
      try {
        const map = JSON.parse(
          localStorage.getItem("guardiao.mapa.progresso.v1") || "null",
        );
        const shards = JSON.parse(
          localStorage.getItem("guardiao.colar.fragmentos.v1") || "[]",
        );
        this.earned = [
          ...new Set([
            ...(Array.isArray(map?.completed) ? map.completed : []),
            ...(Array.isArray(shards) ? shards : []),
            ...(map?.completedFirst ? [1] : []),
          ]),
        ].filter((n) => Number.isInteger(n) && n >= 1 && n <= 5);
      } catch {}
      this.create();
    }
    create() {
      const defs = geometry.gems
        .map(
          (g, i) =>
            `<clipPath id="colar-clip-${i}"><path d="${g.path}"/></clipPath><linearGradient id="colar-cor-${i}" x2=".8" y2="1"><stop stop-color="${g.light}"/><stop offset=".5" stop-color="${colors[i]}"/><stop offset="1" stop-color="${g.dark}"/></linearGradient>`,
        )
        .join("");
      const gems = geometry.gems
        .map((g, i) => {
          const [x, y, w, h] = g.bounds;
          return `<g data-colar-pedra="${i + 1}"><g clip-path="url(#colar-clip-${i})"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#colar-cor-${i})"/><path d="M${x} ${y + h * 0.2}L${x + w * 0.5} ${y + h * 0.05}L${x + w * 0.3} ${y + h * 0.45}Z M${x + w * 0.7} ${y + h * 0.15}L${x + w} ${y + h * 0.5}L${x + w * 0.55} ${y + h * 0.45}Z" fill="#ffffff" opacity=".48"/><path d="M${x + w * 0.3} ${y + h * 0.45}L${x + w * 0.55} ${y + h * 0.45}L${x + w * 0.9} ${y + h}L${x + w * 0.1} ${y + h}Z" fill="${g.dark}" opacity=".5"/><path d="M${x + w * 0.12} ${y + h * 0.17}L${x + w * 0.55} ${y + h * 0.13}L${x + w * 0.78} ${y + h * 0.3}" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity=".82" fill="none"/></g></g>`;
        })
        .join("");
      this.element = document.createElement("section");
      this.element.id = "colar-cena";
      this.element.className = "colar-cutscene";
      this.element.hidden = true;
      this.element.setAttribute("role", "region");
      this.element.setAttribute(
        "aria-label",
        "A conquista do colar do Guardião",
      );
      this.element.innerHTML = `<div class="colar-card"><header><p class="colar-eyebrow">UMA NOVA CONQUISTA</p><h2 id="colar-titulo"></h2><p id="colar-frase" role="status" aria-live="polite"></p></header><svg class="colar-view" viewBox="0 0 ${geometry.width} ${geometry.height}" aria-label="Colar com os encaixes das cinco pedras" role="img"><defs>${defs}</defs><image href="${new URL("assets/colar-vazio.webp", base).href}" width="${geometry.width}" height="${geometry.height}"/>${gems}<g class="colar-brilho" aria-hidden="true"><path d="M0-36L8-8L34 0L8 8L0 36L-8 8L-34 0L-8-8Z" fill="#fff9d2"/><circle r="47" fill="none" stroke="#ffeaaa" stroke-width="3"/></g></svg><footer><canvas id="colar-kai" width="300" height="160" role="img" aria-label="Kai coloca seu colar enquanto Flora comemora"></canvas><p><strong id="colar-contagem"></strong><span>cuidados que viraram luz</span></p></footer><button id="colar-continuar" type="button">Continuar a aventura <span aria-hidden="true">→</span></button></div>`;
      document.body.append(this.element);
      this.svg = this.element.querySelector("svg");
      this.gemNodes = [...this.element.querySelectorAll("[data-colar-pedra]")];
      this.spark = this.element.querySelector(".colar-brilho");
      this.caption = this.element.querySelector("#colar-frase");
      this.count = this.element.querySelector("#colar-contagem");
      this.button = this.element.querySelector("button");
      this.button.addEventListener("click", () => {
        if (!this.active || this.finishing) return;
        this.finishing = true;
        this.onFinish?.();
      });
    }
    async load() {
      const image = async (path) => {
        const im = new Image();
        im.src = path;
        await im.decode();
        return im;
      };
      [this.actor, this.necklace] = await Promise.all([
        image(
          new URL("../sprites-integros/" + window.GuardiaoColarArte.file, base)
            .href,
        ),
        image(new URL("assets/colar-vazio.webp", base).href),
      ]);
    }
    begin(onFinish) {
      this.before = this.earned.filter((n) => n < this.phase);
      this.after = [...new Set([...this.before, this.phase])];
      this.active = true;
      this.finishing = false;
      this.focused = false;
      this.onFinish = onFinish;
      this.messageStage = "";
      this.element.dataset.phase = String(this.phase);
      this.element.querySelector("h2").textContent = titles[this.phase - 1];
      this.element.style.setProperty("--cristal", colors[this.phase - 1]);
      this.render(0, false);
    }
    complete() {
      this.earned = [...new Set([...this.earned, this.phase])];
      this.active = false;
      this.finishing = true;
      this.element.hidden = true;
      document.body.classList.remove("colar-em-cena");
    }
    render(time, reduced = false) {
      if (!this.active) return;
      const opacity =
        ease((time - 0.75) / 0.4) * (1 - ease((time - 5.85) / 0.45));
      this.element.hidden = opacity <= 0;
      this.element.style.opacity = String(opacity);
      this.element.style.pointerEvents = opacity > 0.5 ? "auto" : "none";
      document.body.classList.toggle("colar-em-cena", opacity > 0.5);
      const landed = time >= 2.8;
      this.element.dataset.state = landed
        ? "encaixado"
        : time >= 1.5
          ? "encaixando"
          : "vazio";
      this.element.dataset.pieces = String(
        this.before.length + (landed ? 1 : 0),
      );
      if (opacity > 0.7 && !this.focused) {
        this.focused = true;
        this.button.focus({ preventScroll: true });
      }
      const travel = ease((time - 1.5) / 1.3);
      geometry.gems.forEach((g, i) => {
        const current = i + 1 === this.phase;
        const visible = this.before.includes(i + 1) || (current && time >= 1.5);
        this.gemNodes[i].style.opacity = visible ? "1" : "0";
        let dx = 0,
          dy = 0,
          scale = 1;
        if (current && !landed) {
          if (reduced) {
            this.gemNodes[i].style.opacity = "0";
          } else {
            dx = (1 - travel) * (geometry.width - g.center[0] + 180);
            dy = -(1 - travel) * 470 - Math.sin(travel * Math.PI) * 110;
            scale = 0.85 + 0.15 * travel;
          }
        }
        const [cx, cy] = g.center;
        this.gemNodes[i].setAttribute(
          "transform",
          `translate(${dx} ${dy}) translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`,
        );
      });
      const zoom = reduced ? 1 : ease((time - 0.95) / 0.55);
      this.svg.setAttribute(
        "viewBox",
        `${110 * zoom} ${620 * zoom} ${geometry.width + (810 - geometry.width) * zoom} ${geometry.height + (900 - geometry.height) * zoom}`,
      );
      const gem = geometry.gems[this.phase - 1];
      const flash =
        landed && !reduced ? Math.max(0, 1 - (time - 2.8) / 0.9) : 0;
      this.spark.style.opacity = String(flash);
      this.spark.setAttribute(
        "transform",
        `translate(${gem.center.join(" ")}) scale(${0.5 + (1 - flash) * 1.7}) rotate(${(1 - flash) * 55})`,
      );
      const stage = landed ? "encaixado" : "vazio";
      if (stage !== this.messageStage) {
        if (landed) window.GuardiaoAudio?.effect("restaurar", { gain: 0.65 });
        this.messageStage = stage;
        this.caption.textContent = landed
          ? `A pedra ${gem.name === "amarelo" ? "amarela" : gem.name === "vermelho" ? "vermelha" : gem.name === "azul" ? "azul" : gem.name === "verde" ? "verde" : "violeta"} encontrou seu lugar!`
          : this.phase === 1
            ? "Seu colar está pronto para o primeiro cuidado."
            : "Cada cuidado completa sua história.";
        this.count.textContent =
          this.before.length + (landed ? 1 : 0) + " de 5";
      }
      const c = this.element.querySelector("canvas").getContext("2d");
      c.clearRect(0, 0, 300, 160);
      this.drawActor(c, time, 100, 150, 116);
      this.life?.draw(
        c,
        "flora",
        reduced ? 14 : 14 + (Math.floor(time * 5) % 2),
        220,
        95,
        46,
      );
    }
    drawActor(ctx, time, x, y, height = 65, final = false) {
      if (!this.actor) return;
      const d = window.GuardiaoColarArte;
      const index = final ? 7 : Math.min(7, Math.floor((time / 6.5) * 8));
      const f = d.frames[index],
        b = f.bounds,
        k = height / d.referenceHeight;
      ctx.drawImage(
        this.actor,
        ...b,
        x + (b[0] - f.pivot[0]) * k,
        y + (b[1] - f.pivot[1]) * k,
        b[2] * k,
        b[3] * k,
      );
      const scale = height / 65;
      if (index === 0)
        this.crystal(
          ctx,
          x + 14 * scale,
          y - 28 * scale,
          6 * scale,
          colors[this.phase - 1],
        );
      const anchor = d.pendants?.[index];
      if (anchor)
        this.medallion(
          ctx,
          x + (anchor[0] - f.pivot[0]) * k,
          y + (anchor[1] - f.pivot[1]) * k,
          height / 78,
          time >= 2.8 ? this.after || this.earned : this.before || this.earned,
        );
      document.body.dataset.necklacePose = String(index);
    }
    crystal(ctx, x, y, size, color) {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = color;
      ctx.strokeStyle = "#f5d381";
      ctx.lineWidth = Math.max(0.6, size * 0.1);
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.6);
      ctx.lineTo(size * 0.4, 0);
      ctx.lineTo(0, size * 0.6);
      ctx.lineTo(-size * 0.4, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    chest(ctx, player, height = 63, earned = this.earned) {
      if ([1, 2, 3].includes(player.direction)) return;
      const scale = height / 63;
      const side = player.direction >= 4 && player.direction <= 5 ? -1 : 1;
      const x = player.x + (player.direction === 6 ? 0 : 3 * side) * scale,
        y = player.y - 32 * scale;
      this.medallion(ctx, x, y, scale, earned);
    }
    medallion(ctx, x, y, scale, earned) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.fillStyle = "#ddb553";
      ctx.strokeStyle = "#6d481e";
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.bezierCurveTo(6, -2, 4, 3, 0, 6);
      ctx.bezierCurveTo(-5, 2, -5, -2, 0, -5);
      ctx.fill();
      ctx.stroke();
      for (const id of earned) {
        const positions = [
          [-1.6, -1.9],
          [-1.7, 1.3],
          [0, 3.2],
          [1.5, 1.1],
          [1.6, -1.7],
        ];
        const p = positions[id - 1];
        if (!p) continue;
        ctx.fillStyle = colors[id - 1];
        ctx.beginPath();
        ctx.ellipse(p[0], p[1], 1, 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    state() {
      return {
        phase: this.phase,
        active: this.active,
        before: [...(this.before || [])],
        after: [...(this.after || [])],
        earned: [...this.earned],
        state: this.element.dataset.state,
        pieces: Number(this.element.dataset.pieces || 0),
      };
    }
  }
  window.GuardiaoColar = Necklace;
})();
