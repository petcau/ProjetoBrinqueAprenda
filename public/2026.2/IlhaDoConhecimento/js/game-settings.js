/* Preferências do jogador. Usa valores simples no localStorage quando o navegador permite;
   a aventura em si não é salva. */
window.GameSettings = (() => {
  'use strict';
  const isTouchDevice = () => {
    if (typeof window === 'undefined') return false;
    const hasCoarse = Boolean(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    const hasTouch = Boolean((typeof navigator !== 'undefined') && (navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0));
    return hasCoarse || hasTouch;
  };
  const defaultTouch = isTouchDevice() ? 'joystick' : 'arrows';
  // "touch" escolhe o controle na tela para tablet e celular: setas, joystick ou nenhum.
  const defaults = {sound:70, music:35, mute:false, speed:'normal', touch:defaultTouch, largeText:false, calm:false};
  // Devagar = antigo Normal (16 ticks por passo), Normal = antigo Rápido (12), Rápido = Normal × 1,5 (8).
  const speeds = {slow:{factor:1,label:'Devagar'}, normal:{factor:1.3,label:'Normal'}, fast:{factor:1.95,label:'Rápido'}};
  const touchModes = {arrows:{label:'Setas'}, joystick:{label:'Joystick'}, off:{label:'Nenhum'}};
  const values = {...defaults};
  const listeners = [];

  function normalize(key,value) {
    if (key === 'sound' || key === 'music') {
      const number = Number(value);
      return Number.isFinite(number) ? Math.min(100,Math.max(0,Math.round(number))) : defaults[key];
    }
    if (key === 'speed') return Object.hasOwn(speeds,value) ? value : defaults.speed;
    if (key === 'touch') return Object.hasOwn(touchModes,value) ? value : defaults.touch;
    return value === true || value === 'true';
  }
  function store(key) { try { localStorage.setItem(`ilha.${key}`,String(values[key])); } catch {} }
  for (const key of Object.keys(defaults)) {
    try { const raw = localStorage.getItem(`ilha.${key}`); if (raw !== null) values[key] = normalize(key,raw); } catch {}
  }
  // Compatibilidade: antes existia "ilha.pad" (ligar/desligar as setas na tela).
  try {
    const legacy = localStorage.getItem('ilha.pad');
    if (legacy !== null && localStorage.getItem('ilha.touch') === null) values.touch = (legacy === 'false') ? 'off' : 'arrows';
  } catch {}
  // Classes no body permitem que toda a interface reaja às preferências.
  function apply() {
    const body = document.body;
    if (!body) return;
    body.classList.toggle('large-text',values.largeText);
    body.classList.toggle('calm-motion',values.calm);
    // Uma classe por modo de controle de toque, para a ilha mostrar setas, joystick ou nada.
    body.classList.toggle('touch-arrows',values.touch === 'arrows');
    body.classList.toggle('touch-joystick',values.touch === 'joystick');
    body.classList.toggle('touch-off',values.touch === 'off');
    body.dataset.touch = values.touch;
    body.dataset.touchMode = values.touch;
    const screen = document.getElementById('island-screen');
    if (screen) screen.dataset.touchMode = values.touch;
  }
  function set(key,value) {
    if (!Object.hasOwn(defaults,key)) return;
    values[key] = normalize(key,value);
    store(key);apply();
    for (const listener of listeners) listener(key,values[key]);
  }
  function reset() {
    defaults.touch = isTouchDevice() ? 'joystick' : 'arrows';
    for (const key of Object.keys(defaults)) set(key,defaults[key]);
  }
  apply();
  return {
    get:key=>values[key], set, reset, defaults:{...defaults}, speeds, touchModes, isTouchDevice,
    onChange(listener) { listeners.push(listener); },
    get walkSpeed() { return speeds[values.speed].factor; },
    get calm() { return values.calm; },
    get touch() { return values.touch; }
  };
})();
