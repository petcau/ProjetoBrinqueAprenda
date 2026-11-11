"use strict";
(() => {
  let noticeTimer, notice;
  document.addEventListener("guardiao:descoberta", (e) => {
    if (!notice) {
      notice = document.createElement("p");
      notice.className = "care-notice";
      notice.setAttribute("role", "status");
      document.body.append(notice);
    }
    notice.textContent = e.detail.text;
    notice.hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => (notice.hidden = true), 3200);
  });
  class GameUI {
    constructor({ phase, state }) {
      this.phase = phase;
      this.state = state;
      this.jump = 0;
      this.pending = false;
      const pause = document.getElementById("pausa");
      if (pause)
        pause.innerHTML = '<svg class="pause-mark" viewBox="0 0 32 32" aria-hidden="true"><rect x="7" y="5" width="6" height="22" rx="2" fill="currentColor"/><rect x="19" y="5" width="6" height="22" rx="2" fill="currentColor"/></svg>';
      const btn = document.createElement("button");
      btn.id = "jump-action";
      btn.className = "round";
      btn.type = "button";
      btn.setAttribute("aria-label", "Pular no caminho");
      btn.innerHTML = window.GuardiaoIcones.markup("jump");
      document.getElementById("jogo")?.append(btn);
      btn.addEventListener("click", () => this.hop());
      document.addEventListener("keydown", (e) => {
        if (
          e.key.toLowerCase() === "j" &&
          !e.repeat &&
          !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)
        ) {
          e.preventDefault();
          this.hop();
        }
      });
      this.care = document.createElement("p");
      this.care.className = "current-care";
      document.querySelector(".mission,.missions")?.append(this.care);
      document.addEventListener("guardiao:mochila-aberta", () => {
        document.dispatchEvent(new CustomEvent("guardiao:neutralizar"));
      });
    }
    hop() {
      const s = this.state();
      if (
        s.locked ||
        s.action ||
        s.swimming ||
        this.jump > 0 ||
        this.phase === 2
      )
        return;
      this.jump = 0.56;
      window.GuardiaoAudio?.effect("passo", { gain: 0.35 });
    }
    update(dt) {
      this.jump = Math.max(0, this.jump - dt);
    }
    height() {
      return this.jump > 0
        ? Math.sin((1 - this.jump / 0.56) * Math.PI) * 16
        : 0;
    }
    objective(text) {
      if (this.care.textContent !== text) this.care.textContent = text;
    }
    open(id) {
      for (const d of document.querySelectorAll("dialog[open]"))
        if (d.id !== id) d.close();
      const d = document.getElementById(id);
      if (d && !d.open) d.showModal();
    }
    pack() {
      window.GuardiaoMochila.open();
    }
  }
  window.GuardiaoGameUI = GameUI;
})();
