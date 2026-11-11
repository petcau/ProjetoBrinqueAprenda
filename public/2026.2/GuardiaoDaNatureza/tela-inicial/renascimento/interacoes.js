"use strict";
(() => {
  const reduced = () =>
    matchMedia("(prefers-reduced-motion:reduce)").matches ||
    document.body.classList.contains("reduce-motion");
  document.addEventListener("pointerdown", (event) => {
    const b = event.target.closest("button,a");
    if (!b || b.disabled || reduced()) return;
    if (!b.matches(".nature-button,.forest-button,.nature-wood,.round")) return;
    for (let i = 0; i < 3; i++) {
      const leaf = document.createElement("span");
      leaf.className = "wood-spark";
      leaf.setAttribute("aria-hidden", "true");
      leaf.textContent = "❧";
      leaf.style.setProperty("--fly-x", (i - 1) * 32 + "px");
      b.append(leaf);
      setTimeout(() => leaf.remove(), 700);
    }
  });
  window.addEventListener("pagehide", () =>
    document.querySelectorAll(".wood-spark").forEach((n) => n.remove()),
  );
})();
