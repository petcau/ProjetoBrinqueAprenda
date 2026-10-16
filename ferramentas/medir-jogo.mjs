import puppeteer from 'puppeteer-core';

/**
 * Mede um jogo do portal em vários tamanhos de tela e diz onde ele não cabe.
 *
 * Uso: node ferramentas/medir-jogo.mjs <slug> <seletor-do-quadro> <pasta> [clique]
 *   slug      — o slug em src/dados/jogos.js (ex.: abacomania)
 *   seletor   — o elemento que representa o quadro do jogo
 *   pasta     — onde salvar os prints
 *   clique    — seletor opcional a clicar antes de medir (tela inicial)
 */
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const [, , SLUG, SELETOR, PASTA, CLIQUE] = process.argv;
const URL = `http://localhost:4173/jogar/${SLUG}`;

const TAMANHOS = [
  [1920, 1080],
  [1600, 900],
  [1366, 768],
  [1366, 700],
  [1366, 600],
  [1280, 800],
  [1024, 768],
  [820, 1180],
  [503, 669],
  [390, 844],
];

const navegador = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox'],
});
const pagina = await navegador.newPage();

for (const [L, A] of TAMANHOS) {
  await pagina.setViewport({ width: L, height: A });
  await pagina.goto(URL, { waitUntil: 'networkidle2' });

  if (CLIQUE) {
    try {
      await pagina.waitForSelector(CLIQUE, { timeout: 4000 });
      await pagina.click(CLIQUE);
    } catch {
      /* sem tela inicial */
    }
  }
  await new Promise((r) => setTimeout(r, 1100));

  const d = await pagina.evaluate((sel) => {
    const q = document.querySelector(sel);
    const palco = document.querySelector('.bq-palco-react, .bq-palco-quadro');
    if (!q || !palco) return { erro: 'nao encontrei ' + sel };
    const r = q.getBoundingClientRect();
    const cs = getComputedStyle(q);
    return {
      escala: cs.getPropertyValue('--bq-escala').trim() || '-',
      natural: [q.offsetWidth, Math.max(q.offsetHeight, q.scrollHeight)],
      naTela: [Math.round(r.width), Math.round(r.height)],
      palco: [palco.clientWidth, palco.clientHeight],
      conteudo: [palco.scrollWidth, palco.scrollHeight],
      rolaX: palco.scrollWidth > palco.clientWidth,
      rolaY: palco.scrollHeight > palco.clientHeight,
    };
  }, SELETOR);

  await pagina.screenshot({ path: `${PASTA}/${SLUG}-${L}x${A}.png` });

  if (d.erro) {
    console.log(`${(L + 'x' + A).padEnd(10)} ${d.erro}`);
  } else {
    console.log(
      `${(L + 'x' + A).padEnd(10)} escala ${String(d.escala).padEnd(6)}` +
        ` natural ${d.natural.join('x').padEnd(10)} naTela ${d.naTela.join('x').padEnd(10)}` +
        ` palco ${d.palco.join('x').padEnd(10)}` +
        ` | rolaX ${d.rolaX ? 'SIM' : 'nao'} rolaY ${d.rolaY ? 'SIM' : 'nao'}`
    );
  }
}

await navegador.close();
