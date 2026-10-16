import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:4173/jogar/anagrama';
const PASTA = process.argv[2];
const LARG = Number(process.argv[3]);
const ALT = Number(process.argv[4]);
const nome = LARG + 'x' + ALT;

const navegador = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox'],
});

const pagina = await navegador.newPage();
await pagina.setViewport({ width: LARG, height: ALT });
await pagina.goto(URL, { waitUntil: 'networkidle2' });
await pagina.waitForSelector('.tela-inicial-box button', { timeout: 8000 });
await pagina.click('.tela-inicial-box button');
await new Promise((r) => setTimeout(r, 1300));

function dentro(a, b) {
  return a.left >= b.left - 1 && a.right <= b.right + 1 && a.top >= b.top - 1 && a.bottom <= b.bottom + 1;
}

const jogo = await pagina.evaluate(() => {
  const q = document.querySelector('.game-container-anagrama');
  const palco = document.querySelector('.bq-palco-react');
  const crono = document.querySelector('.cronometro-anagrama');
  const menu = document.querySelector('.botao_voltar_menu');
  const nivel = document.querySelector('.fase');
  const caixa = (el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, w: Math.round(r.width), h: Math.round(r.height) };
  };
  return {
    escala: getComputedStyle(q).getPropertyValue('--bq-escala').trim(),
    quadro: caixa(q),
    crono: crono ? caixa(crono) : null,
    cronoTexto: crono ? crono.textContent.trim() : null,
    menu: menu ? caixa(menu) : null,
    menuTexto: menu ? menu.textContent.trim() : null,
    nivel: nivel ? caixa(nivel) : null,
    rola: palco.scrollHeight > palco.clientHeight || palco.scrollWidth > palco.clientWidth,
  };
});

await pagina.screenshot({ path: `${PASTA}/t-${nome}-jogo.png` });

/* espera a janela de tempo esgotado */
let modal = null;
try {
  await pagina.waitForSelector('.aviso-anagrama', { timeout: 40000 });
  await new Promise((r) => setTimeout(r, 400));
  modal = await pagina.evaluate(() => {
    const a = document.querySelector('.aviso-anagrama');
    const c = document.querySelector('.aviso-anagrama-caixa');
    const q = document.querySelector('.game-container-anagrama');
    const palavras = document.querySelector('.container-palavras, .palavras-validas');
    const palco = document.querySelector('.bq-palco-react');
    const r = (el) => { const b = el.getBoundingClientRect(); return { left:b.left, right:b.right, top:b.top, bottom:b.bottom, w:Math.round(b.width), h:Math.round(b.height) }; };
    return {
      sobreposicao: r(a),
      caixa: r(c),
      quadro: r(q),
      palavras: palavras ? r(palavras) : null,
      quadrada: Math.abs(a.getBoundingClientRect().width - a.getBoundingClientRect().height) < 2,
      rola: palco.scrollHeight > palco.clientHeight || palco.scrollWidth > palco.clientWidth,
    };
  });
  await pagina.screenshot({ path: `${PASTA}/t-${nome}-aviso.png` });
} catch (e) {
  modal = { erro: 'janela nao apareceu' };
}

const r = {
  tela: nome,
  escala: jogo.escala,
  rolaNoJogo: jogo.rola,
  cronoTexto: jogo.cronoTexto,
  cronoSoNumero: /^\d+$/.test(jogo.cronoTexto || ''),
  cronoDentroDoQuadro: jogo.crono ? dentro(jogo.crono, jogo.quadro) : null,
  cronoAbaixoDoNivel: jogo.crono && jogo.nivel ? jogo.crono.top >= jogo.nivel.bottom - 2 : null,
  menuTexto: jogo.menuTexto,
  menuDentroDoQuadro: jogo.menu ? dentro(jogo.menu, jogo.quadro) : null,
  janelaQuadrada: modal.quadrada,
  janelaDentroDoQuadro: modal.sobreposicao ? dentro(modal.sobreposicao, modal.quadro) : null,
  palavrasAbaixoDaJanela:
    modal.caixa && modal.palavras ? modal.palavras.top >= modal.caixa.bottom - 2 : null,
  rolaComJanela: modal.rola,
  erro: modal.erro,
};

console.log(JSON.stringify(r));
await navegador.close();
