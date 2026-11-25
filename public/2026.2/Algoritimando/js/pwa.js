/* ============================================================
   pwa.js — modo instalável

   Registra o sw.js, que guarda os arquivos do jogo no aparelho:
   depois da primeira visita, o jogo abre e funciona sem internet.
   Só funciona pelo site (https); aberto com dois cliques no
   index.html (file://), o jogo segue como sempre, sem instalar.

   Nas Configurações aparece a linha "Instalar o jogo":
   - Chrome, Edge e Android: botão "Instalar", que abre a janela
     do próprio navegador;
   - iPhone e iPad: a explicação (Compartilhar > Adicionar à Tela
     de Início), porque lá não existe botão de instalar;
   - já instalado, ou navegador sem instalação: a linha some.
   ============================================================ */

'use strict';

(function () {

  const linha = document.querySelector('#linhaInstalar');
  const botao = document.querySelector('#bInstalar');
  const dica = document.querySelector('#instalarDica');

  const pelaInternet = location.protocol === 'https:' || location.hostname === 'localhost';
  const instalado = window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches
    || window.navigator.standalone === true;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (pelaInternet && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => { /* sem modo offline: o jogo segue */ });
    });
  }

  if (!linha) return;
  linha.hidden = true;
  if (!pelaInternet || instalado) return;

  if (ios) {
    botao.hidden = true;
    dica.textContent = 'No iPhone ou iPad: toque em Compartilhar e depois em "Adicionar à Tela de Início".';
    linha.hidden = false;
    return;
  }

  // Chrome, Edge e Android avisam quando dá para instalar
  let pedido = null;
  window.addEventListener('beforeinstallprompt', ev => {
    ev.preventDefault();
    pedido = ev;
    linha.hidden = false;
  });
  botao.addEventListener('click', async () => {
    if (!pedido) return;
    pedido.prompt();
    try { await pedido.userChoice; } catch { /* a criança fechou a janela */ }
    pedido = null;
    linha.hidden = true;
  });
  window.addEventListener('appinstalled', () => { linha.hidden = true; });
})();
