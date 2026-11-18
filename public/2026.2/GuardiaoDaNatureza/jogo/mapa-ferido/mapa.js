"use strict";
(() => {
  const base = new URL("./", document.currentScript.src);
  let image, loading;
  const names = {
    1: ["Floresta", "em Chamas"],
    2: ["Rio Poluído"],
    3: ["Resgate", "da Fauna"],
    4: ["Reflorestamento"],
    5: ["Cidade", "Sustentável"],
  };
  function regionState(id, progress) {
    if (progress.completed.includes(id)) return "recuperada";
    return id === 1 || progress.completed.includes(id - 1)
      ? "atual"
      : "distante";
  }
  function prepare() {
    return (loading ||= (async () => {
      const im = new Image();
      im.decoding = "async";
      im.src = new URL("assets/kai-retrato.webp", base);
      await im.decode();
      image = im;
      return true;
    })().catch(() => false));
  }
  // Um retrato próprio ocupa o marcador; os sprites de Kai na fase são preservados.
  function portrait(c, x, y, radius = 19) {
    if (!image) return false;
    y = Math.max(radius + 4, y);
    c.save();
    c.fillStyle = "#efc576";
    c.strokeStyle = "#87522b";
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(x - radius * 0.35, y + radius * 0.85);
    c.lineTo(x + radius * 0.35, y + radius * 0.85);
    c.lineTo(x, y + radius * 1.52);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = "#95632e";
    c.beginPath();
    c.arc(x, y, radius + 3, 0, Math.PI * 2);
    c.fill();
    c.save();
    c.beginPath();
    c.arc(x, y, radius, 0, Math.PI * 2);
    c.clip();
    c.drawImage(image, x - radius, y - radius, radius * 2, radius * 2);
    c.restore();
    c.strokeStyle = "#ffe2a1";
    c.lineWidth = 2.8;
    c.beginPath();
    c.arc(x, y, radius + 0.3, 0, Math.PI * 2);
    c.stroke();
    c.restore();
    return true;
  }
  window.MapaFerido = {
    regionState,
    label: (id) =>
      (names[id] || [])
        .map((line) => `<span class="map-name-line">${line}</span>`)
        .join(" "),
    prepare,
    portrait,
  };
})();
