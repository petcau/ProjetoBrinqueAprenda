import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:4173/jogar/anagrama';
const PASTA = process.argv[2] || '.';
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
await new Promise((r) => setTimeout(r, 1200));

/* posicao das letras antes do aviso, para provar que nada se mexe */
const antes = await pagina.evaluate(() => {
  const l = document.querySelector('.letras');
  return l ? Math.round(l.getBoundingClientRect().top) : null;
});

/* espera o cronometro zerar (30s) */
await pagina.waitForSelector('.aviso-anagrama', { timeout: 40000 });
await new Promise((r) => setTimeout(r, 500));

const aviso = await pagina.evaluate(() => {
  const a = document.querySelector('.aviso-anagrama');
  const caixa = document.querySelector('.aviso-anagrama-caixa');
  const quadro = document.querySelector('.game-container-anagrama');
  const palco = document.querySelector('.bq-palco-react');
  const letras = document.querySelector('.letras');
  const ra = a.getBoundingClientRect();
  const rq = quadro.getBoundingClientRect();
  return {
    cobreOQuadro:
      Math.abs(ra.width - rq.width) < 2 && Math.abs(ra.height - rq.height) < 2,
    avisoNaTela: [Math.round(ra.width), Math.round(ra.height)],
    quadroNaTela: [Math.round(rq.width), Math.round(rq.height)],
    caixaNaTela: [
      Math.round(caixa.getBoundingClientRect().width),
      Math.round(caixa.getBoundingClientRect().height),
    ],
    texto: caixa.textContent.trim(),
    letrasEm: letras ? Math.round(letras.getBoundingClientRect().top) : null,
    rola:
      palco.scrollHeight > palco.clientHeight ||
      palco.scrollWidth > palco.clientWidth,
  };
});

await pagina.screenshot({ path: PASTA + '/aviso-tempo.png' });

console.log(
  JSON.stringify({ letrasAntes: antes, ...aviso, letrasNaoSeMexeram: antes === aviso.letrasEm }, null, 2)
);

await navegador.close();
