'use strict';
(() => {
  const mission=document.querySelector('.mission'),toggle=document.getElementById('alternar-missoes');
  toggle.addEventListener('click',()=>{const expanded=mission.classList.toggle('expanded');toggle.setAttribute('aria-expanded',String(expanded));toggle.setAttribute('aria-label',expanded?'Recolher detalhes das missões':'Mostrar detalhes das missões');});
  document.querySelectorAll('.goal').forEach(button=>button.addEventListener('click',()=>{mission.classList.remove('expanded');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Mostrar detalhes das missões');}));
  document.getElementById('pausa').addEventListener('click',()=>{const s=window.GuardiaoFloresta?.estado();if(s)document.getElementById('pausa-resumo').textContent=`Focos apagados: ${s.fires.filter(f=>!f.life).length}/8 · Amigos seguros: ${s.animals.filter(a=>a.stage==='seguro').length}/3 · Água: ${Math.floor(s.water)}%`;});
  let preferences={};try{preferences=JSON.parse(localStorage.getItem('guardiao.horizonte.preferences.v1')||'{}');}catch{}
  if(preferences.leftHanded){document.body.classList.add('left-handed');const style=document.createElement('style');style.textContent='.left-handed .joystick{left:auto;right:20px}.left-handed .actions{right:auto;left:12px}.left-handed .help{right:auto;left:13px}';document.head.append(style);}
  if(preferences.controlSize){const factor=1+Math.min(100,Math.max(0,preferences.controlSize))/1000;document.querySelectorAll('.joystick,.actions').forEach(el=>{el.style.scale=factor;el.style.transformOrigin=el.classList.contains('actions')?(preferences.leftHanded?'bottom left':'bottom right'):(preferences.leftHanded?'bottom right':'bottom left');});}
})();
