/* Progresso da aventura nesta sessão. Chaves e cadeados têm a mesma região. */
window.AdventureProgress = (() => {
  'use strict';
  const regions = Object.freeze(['forest', 'village', 'ruins', 'farm']);
  const keys = new Set(), unlocked = new Set();
  let rescued = false;
  function award(region) {
    if (!regions.includes(region) || keys.has(region)) return false;
    keys.add(region);
    return true;
  }
  function unlock(region) {
    if (!keys.has(region) || unlocked.has(region)) return false;
    unlocked.add(region);
    return true;
  }
  function rescue() {
    if (unlocked.size !== regions.length || rescued) return false;
    rescued = true;
    return true;
  }
  return Object.freeze({
    regions, award, unlock, rescue,
    hasKey: region => keys.has(region),
    isUnlocked: region => unlocked.has(region),
    get keyCount() { return keys.size; },
    get unlockedCount() { return unlocked.size; },
    get rescued() { return rescued; }
  });
})();
