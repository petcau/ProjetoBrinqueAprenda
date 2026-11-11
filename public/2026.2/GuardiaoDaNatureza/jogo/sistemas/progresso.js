"use strict";
(() => {
  const KEY = "guardiao.mapa.progresso.v1",
    SHARDS = "guardiao.colar.fragmentos.v1";
  let memory = null;
  function read() {
    try {
      const p = JSON.parse(localStorage.getItem(KEY) || "null");
      if (p && typeof p === "object") {
        const completed = Array.isArray(p.completed)
          ? p.completed.filter((n) => Number.isInteger(n) && n >= 1 && n <= 5)
          : p.completedFirst
            ? [1]
            : [];
        if (p.completedFirst && !completed.includes(1)) completed.push(1);
        return {
          ...p,
          completed: [...new Set(completed)],
          current: Number.isInteger(p.current)
            ? Math.max(1, Math.min(5, p.current))
            : 1,
        };
      }
    } catch {}
    return memory || { completed: [], current: 1, completedFirst: false };
  }
  function unlocked(id) {
    const s = read();
    return id === 1 || (id >= 2 && id <= 5 && s.completed.includes(id - 1));
  }
  function finish(id) {
    if (!Number.isInteger(id) || id < 1 || id > 5)
      throw new RangeError("Escolha uma das cinco fases.");
    const old = read(),
      completed = [...new Set([...old.completed, id])].sort(),
      next = {
        ...old,
        completed,
        completedFirst: completed.includes(1),
        current: Math.min(5, id + 1),
        pendingRestoration: id,
      };
    memory = next;
    let saved = true;
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      localStorage.setItem(SHARDS, JSON.stringify(completed));
    } catch {
      saved = false;
    }
    return { progress: next, saved };
  }
  window.GuardiaoProgresso = Object.freeze({ read, unlocked, finish });
})();
