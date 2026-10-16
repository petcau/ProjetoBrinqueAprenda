import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PASTA = process.argv[2];
const LARG = Number(process.argv[3] || 1366);
const ALT = Number(process.argv[4] || 768);

const navegador = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox'],
});
const pagina = await navegador.newPage();
await pagina.setViewport({ width: LARG, height: ALT });
await pagina.goto('http://localhost:4173/jogar/abacomania', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 1200));

const posicoes = await pagina.evaluate(() => {
  const el = (s) => document.querySelector(s);
  const r = (s) => {
    const e = el(s);
    if (!e) return null;
    const b = e.getBoundingClientRect();
    return { w: Math.round(b.width), h: Math.round(b.height), top: Math.round(b.top), right: Math.round(b.right) };
  };
  const q = el('.game-container-V').getBoundingClientRect();
  const placas = [...document.querySelectorAll('.valor-alvo')].map((e) => {
    const b = e.getBoundingClientRect();
    return { texto: e.textContent.trim(), top: Math.round(b.top), right: Math.round(b.right), fonte: getComputedStyle(e).fontSize, cor: getComputedStyle(e).backgroundColor };
  });
  return {
    menu: r('.botao-menu-abaco'),
    menuTexto: el('.botao-menu-abaco')?.textContent.trim(),
    verificar: r('.verificar-botoes'),
    placas,
    quadroDireita: Math.round(q.right),
  };
});

/* erra de proposito: clica numa conta e manda verificar */
await pagina.click('.conta');
await pagina.click('.verificar-botoes');
await new Promise((r) => setTimeout(r, 400));

const comJanela = await pagina.evaluate(() => {
  const f = document.querySelector('.feedback');
  const q = document.querySelector('.game-container-V');
  const palco = document.querySelector('.bq-palco-react');
  const abaco = document.querySelector('.abaco');
  if (!f) return { apareceu: false };
  const b = f.getBoundingClientRect();
  const qb = q.getBoundingClientRect();
  return {
    apareceu: true,
    texto: f.textContent.trim(),
    centradaNoQuadro:
      Math.abs((b.left + b.right) / 2 - (qb.left + qb.right) / 2) < 3 &&
      Math.abs((b.top + b.bottom) / 2 - (qb.top + qb.bottom) / 2) < 3,
    abacoEm: Math.round(abaco.getBoundingClientRect().top),
    rola: palco.scrollHeight > palco.clientHeight || palco.scrollWidth > palco.clientWidth,
  };
});

await pagina.screenshot({ path: `${PASTA}/abaco-janela.png` });

/* espera passar os 3 segundos */
await new Promise((r) => setTimeout(r, 3200));
const depois = await pagina.evaluate(() => {
  const abaco = document.querySelector('.abaco');
  return {
    janelaSumiu: !document.querySelector('.feedback'),
    abacoEm: Math.round(abaco.getBoundingClientRect().top),
  };
});

console.log(
  JSON.stringify(
    {
      ...posicoes,
      janela: comJanela,
      depoisDe3s: depois,
      abacoNaoSeMexeu: comJanela.abacoEm === depois.abacoEm,
    },
    null,
    2
  )
);

await navegador.close();
