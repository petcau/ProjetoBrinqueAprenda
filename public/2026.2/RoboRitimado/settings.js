(() => {
  'use strict';
  const systemReduced = matchMedia('(prefers-reduced-motion: reduce)');
  const defaults = { musicVolume: 55, sfxVolume: 55, menuVolume: 40, arrowSpeed: 1,
    colorMode: 'off', scaleEnabled: false, uiScale: 1, subtitleScale: 1, arrowScale: 1,
    reduceMotion: systemReduced.matches, danceSpeed: .3, highContrast: false,
    captions: false, speedEnabled: false, gameSpeed: .8, sensitivity: systemReduced.matches,
    darkMode: false, device: 'pc', assistTiming: false, shortSequences: false };
  const bounds = { musicVolume: [0,100], sfxVolume: [0,100], menuVolume: [0,100], arrowSpeed: [.55,1.6],
    uiScale: [1,1.4], subtitleScale: [1,1.8], arrowScale: [1,1.4], danceSpeed: [.15,.6], gameSpeed: [.5,1] };
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('rr-settings-v05') || '{}') || {}; } catch {}
  const value = { ...defaults };
  function normalize(key, val) {
    if (bounds[key]) { const n = Number(val); return Number.isFinite(n) ? Math.max(bounds[key][0], Math.min(bounds[key][1], n)) : defaults[key]; }
    if (key === 'colorMode') return ['off','protanopia','deuteranopia','tritanopia'].includes(val) ? val : 'off';
    if (key === 'device') return ['pc','mobile','tablet'].includes(val) ? val : 'pc';
    return typeof defaults[key] === 'boolean' ? val === true : defaults[key];
  }
  for (const key of Object.keys(defaults)) if (key in saved) value[key] = normalize(key, saved[key]);
  let persistTimer;
  function persist(){clearTimeout(persistTimer);try{localStorage.setItem('rr-settings-v05',JSON.stringify(value));}catch{}}
  window.addEventListener('pagehide',persist);
  function apply() {
    const b = document.body, root = document.documentElement;
    b.classList.toggle('motion-reduced', value.reduceMotion || systemReduced.matches);
    b.classList.toggle('photosensitive', value.sensitivity);
    b.classList.toggle('high-contrast', value.highContrast);
    b.classList.toggle('has-captions', value.captions);
    b.classList.toggle('large-subtitles', value.scaleEnabled && value.subtitleScale > 1.35);
    b.classList.toggle('dark-mode',value.darkMode);
    b.dataset.device=value.device;
    b.dataset.colorMode = value.colorMode;
    root.style.setProperty('--ui-scale', value.scaleEnabled ? value.uiScale : 1);
    root.style.setProperty('--subtitle-scale', value.scaleEnabled ? value.subtitleScale : 1);
    root.style.setProperty('--vision-filter', value.colorMode === 'off' ? 'none' : `url(#vision-${value.colorMode})`);
    window.dispatchEvent(new CustomEvent('rr-settings', { detail: { ...value } }));
  }
  window.RR_SETTINGS = Object.freeze({
    get: () => ({ ...value }),
    set(key, val) { if (!(key in defaults)) return; const next=normalize(key,val);if(value[key]===next)return;value[key]=next;clearTimeout(persistTimer);persistTimer=setTimeout(persist,180);apply(); },
    reset() { Object.assign(value, defaults); try { localStorage.setItem('rr-settings-v05', JSON.stringify(value)); } catch {} apply(); },
    motion: () => value.sensitivity ? 0 : (value.reduceMotion || systemReduced.matches) ? value.danceSpeed : 1,
    gentle: () => value.sensitivity || value.reduceMotion || systemReduced.matches,
    rate: () => value.speedEnabled ? value.gameSpeed : 1,
    dpr: () => Math.min(devicePixelRatio || 1,{pc:1.5,tablet:1.25,mobile:1}[value.device]),
    effects: () => ({pc:1,tablet:.65,mobile:.42}[value.device]),
    apply
  });
  systemReduced.addEventListener('change', apply);
  apply();
})();
