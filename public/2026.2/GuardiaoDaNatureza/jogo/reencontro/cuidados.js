"use strict";
(() => {
  const pending = (t) =>
    t.status === "pending" || ["ferido", "tratando"].includes(t.stage);
  const problem = (t) =>
    t.problem || { capivara: "paw", cervo: "paw", passaro: "wing" }[t.id];
  const line = (c, points, color, width) => {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(...points[0]);
    for (const p of points.slice(1)) c.lineTo(...p);
    c.stroke();
  };
  function draw(c, t, time, reduced, progress = 0, player = null) {
    if (!pending(t)) return;
    const kind = problem(t);
    if (!kind || kind === "cage") return;
    const p = t.position || t,
      bird = ["passaro", "arara", "tucano"].includes(t.speciesKey || t.id);
    c.save();
    c.translate(p.x, p.y);
    const k = 1 - Math.min(1, Math.max(0, (progress - 0.35) / 0.65));
    c.globalAlpha *= k;
    if (kind === "plastic") {
      const x = progress * 30,
        y = progress * -13;
      c.translate(x, y);
      const g = c.createLinearGradient(-23, -26, 25, 0);
      g.addColorStop(0, "#e7f8f4a8");
      g.addColorStop(0.5, "#b0d8df50");
      g.addColorStop(1, "#d3eeee9c");
      c.fillStyle = g;
      c.strokeStyle = "#daeaf0";
      c.lineWidth = 1.3;
      c.beginPath();
      c.moveTo(-24, -24);
      c.quadraticCurveTo(0, -32, 24, -22);
      c.lineTo(27, -6);
      c.quadraticCurveTo(0, 6, -25, -4);
      c.closePath();
      c.fill();
      c.stroke();
      line(
        c,
        [
          [-21, -24],
          [-24, -33],
          [-12, -35],
          [-9, -27],
        ],
        "#c4e5e9",
        2,
      );
      line(
        c,
        [
          [15, -27],
          [18, -34],
          [25, -31],
          [23, -23],
        ],
        "#c4e5e9",
        2,
      );
      line(
        c,
        [
          [-14, -21],
          [-9, -11],
          [-13, -4],
        ],
        "#f4fffe9c",
        1,
      );
    } else if (kind === "net") {
      c.translate(progress * 24, -progress * 9);
      c.strokeStyle = "#a89569";
      c.lineWidth = 1.4;
      c.beginPath();
      c.ellipse(0, -13, 29, 17, -0.06, 0, Math.PI * 2);
      c.stroke();
      c.save();
      c.beginPath();
      c.ellipse(0, -13, 29, 17, -0.06, 0, Math.PI * 2);
      c.clip();
      for (let i = -48; i < 50; i += 9) {
        line(
          c,
          [
            [i, -34],
            [i + 44, 10],
          ],
          "#d2c398",
          1,
        );
        line(
          c,
          [
            [i, -34],
            [i - 44, 10],
          ],
          "#7f7658",
          1,
        );
      }
      c.restore();
      line(
        c,
        [
          [25, -18],
          [38, -24],
          [43, -20],
        ],
        "#bfa57a",
        2,
      );
    } else if (kind === "log") {
      c.translate(0, -Math.sin((progress * Math.PI) / 2) * 29);
      line(
        c,
        [
          [-31, -3],
          [1, -9],
          [32, -3],
        ],
        "#483523",
        12,
      );
      line(
        c,
        [
          [-31, -5],
          [1, -11],
          [32, -5],
        ],
        "#987044",
        8,
      );
      line(
        c,
        [
          [-22, -8],
          [0, -12],
          [20, -8],
        ],
        "#d0a166",
        2,
      );
      line(
        c,
        [
          [12, -7],
          [22, -20],
          [30, -23],
        ],
        "#6f4d30",
        5,
      );
      line(
        c,
        [
          [-8, -9],
          [-15, -19],
        ],
        "#6f4d30",
        4,
      );
    } else {
      // Pequeno curativo visível na asa/pata; sem ferimentos gráficos.
      const x = bird ? 14 : 16,
        y = bird ? -14 : -5;
      c.translate(x, y);
      c.rotate(bird ? -0.6 : 0.2);
      c.fillStyle = "#f7d7a4";
      c.strokeStyle = "#8f6744";
      c.lineWidth = 0.8;
      c.beginPath();
      c.roundRect(-7, -5, 14, 10, 2);
      c.fill();
      c.stroke();
      c.fillStyle = "#cf775b";
      c.fillRect(-1.3, -3.5, 2.6, 7);
      c.fillRect(-3.5, -1.3, 7, 2.6);
    }
    c.restore();
    if (progress > 0.1 && progress < 0.88 && player) {
      // O material retirado vai para a bolsa, enquanto o animal continua no lugar.
      const q = Math.max(0, (progress - 0.45) / 0.5),
        x = p.x + (player.x - p.x) * q,
        y = p.y - 14 + (player.y - p.y - 22) * q;
      if (q > 0) {
        c.save();
        c.globalAlpha = 1 - q;
        c.translate(x, y);
        c.rotate(q * 2);
        c.fillStyle = kind === "net" ? "#baab81" : "#d8e7db";
        c.strokeStyle = "#647d72";
        c.lineWidth = 1;
        c.beginPath();
        c.roundRect(-6, -4, 12, 8, 2);
        c.fill();
        c.stroke();
        c.restore();
      }
    }
  }
  function approach(player, animal, nav) {
    // As ações de cuidado são poses laterais. Kai se aproxima do lado do animal,
    // em vez de esticar as mãos para outra direção. Só usa trechos já livres:
    // não faz uma busca síncrona de rota durante o resgate.
    return [-38, 38]
      .map((dx) => ({ x: animal.x + dx, y: animal.y + 12 }))
      .filter(
        (p) =>
          nav.walkable(p) &&
          nav.visible(player, p) &&
          nav.interactionVisible(p, animal),
      )
      .sort(
        (a, b) =>
          Math.hypot(player.x - a.x, player.y - a.y) -
          Math.hypot(player.x - b.x, player.y - b.y),
      )[0];
  }
  window.GuardiaoCuidados = { draw, pending, problem, approach };
})();
