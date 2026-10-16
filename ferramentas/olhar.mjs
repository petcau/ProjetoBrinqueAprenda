import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = process.argv[2] || 'http://localhost:4173/jogar/anagrama';
const SAIDA = process.argv[3] || 'anagrama.png';
const LARG = Number(process.argv[4] || 1366);
const ALT = Number(process.argv[5] || 700);

const navegador = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars=false'],
});

const pagina = await navegador.newPage();
await pagina.setViewport({ width: LARG, height: ALT });
await pagina.goto(URL, { waitUntil: 'networkidle2' });

// a tela inicial tem um botao "Jogar"; entra no tabuleiro
try {
  await pagina.waitForSelector('.botao-iniciar, .tela-inicial-box button', { timeout: 3000 });
  await pagina.click('.botao-iniciar, .tela-inicial-box button');
} catch {
  /* ja estava no tabuleiro */
}

await new Promise((r) => setTimeout(r, 1200));

const dados = await pagina.evaluate(() => {
  const q = document.querySelector('.game-container-anagrama');
  const palco = document.querySelector('.bq-palco-react');
  const main = q && q.parentElement;
  if (!q) return { erro: 'tabuleiro nao encontrado', html: document.body.innerHTML.slice(0, 400) };
  const cs = getComputedStyle(q);
  const r = q.getBoundingClientRect();
  return {
    escala: cs.getPropertyValue('--bq-escala').trim() || '(nao definida)',
    larguraVar: cs.getPropertyValue('--bq-largura').trim(),
    alturaVar: cs.getPropertyValue('--bq-altura').trim(),
    offset: [q.offsetWidth, q.offsetHeight],
    scroll: [q.scrollWidth, q.scrollHeight],
    renderizado: [Math.round(r.width), Math.round(r.height)],
    topo: Math.round(r.top),
    base: Math.round(r.bottom),
    janela: [innerWidth, innerHeight],
    palcoCliente: palco ? [palco.clientWidth, palco.clientHeight] : null,
    palcoScroll: palco ? [palco.scrollWidth, palco.scrollHeight] : null,
    rolaNoPalco: palco ? palco.scrollHeight > palco.clientHeight : null,
    mainPai: main ? main.className : null,
    avo: main && main.parentElement ? main.parentElement.className : null,
  };
});

console.log(JSON.stringify(dados, null, 2));
await pagina.screenshot({ path: SAIDA });
console.log('print em ' + SAIDA);
await navegador.close();
