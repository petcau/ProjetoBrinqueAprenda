import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:4173/jogar/anagrama';
const SAIDA = process.argv[2] || 'conferencia.png';
const LARG = Number(process.argv[3] || 1366);
const ALT = Number(process.argv[4] || 700);

const navegador = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox'],
});

const pagina = await navegador.newPage();
await pagina.setViewport({ width: LARG, height: ALT });
await pagina.goto(URL, { waitUntil: 'networkidle2' });

await pagina.waitForSelector('.tela-inicial-box button', { timeout: 5000 });
await pagina.click('.tela-inicial-box button');
await new Promise((r) => setTimeout(r, 1400));

const antes = await pagina.evaluate(() => {
  const q = document.querySelector('.game-container-anagrama');
  const b = document.querySelector('.botao_voltar_menu');
  const palco = document.querySelector('.bq-palco-react');
  const mesa = document.querySelector('.mesa-container');
  const letra = document.querySelector('.letras button');
  const cs = getComputedStyle(q);
  const rq = q.getBoundingClientRect();
  const rb = b.getBoundingClientRect();
  const rm = mesa.getBoundingClientRect();
  return {
    escala: cs.getPropertyValue('--bq-escala').trim(),
    naturalDoQuadro: [q.offsetWidth, Math.max(q.offsetHeight, q.scrollHeight)],
    quadroNaTela: [Math.round(rq.width), Math.round(rq.height)],
    rola:
      palco.scrollHeight > palco.clientHeight ||
      palco.scrollWidth > palco.clientWidth,
    botaoTexto: b.textContent.trim(),
    botaoNaTela: [Math.round(rb.width), Math.round(rb.height)],
    mesaComecaEm: Math.round(rm.top - rq.top),
    letraNaTela: letra
      ? [Math.round(letra.getBoundingClientRect().width), Math.round(letra.getBoundingClientRect().height)]
      : null,
  };
});

await pagina.screenshot({ path: SAIDA });

// o botao Menu tem que voltar para a tela inicial do proprio jogo
await pagina.click('.botao_voltar_menu');
await new Promise((r) => setTimeout(r, 700));
const depois = await pagina.evaluate(() => ({
  voltouParaTelaInicial: !!document.querySelector('.tela-inicial-box'),
  continuaNoPortal: location.pathname,
}));

console.log(JSON.stringify({ ...antes, ...depois }, null, 2));
await navegador.close();
