import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PASTA = process.argv[2];
const URL =
  'http://localhost:4173/2025.2/ReciclaKids/pages/gamePlayScreen/gamePlayScreen.html';

const navegador = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox'],
});

for (const [L, A] of [
  [1366, 768],
  [1024, 768],
  [820, 1180],
  [390, 844],
]) {
  const pagina = await navegador.newPage();
  await pagina.setViewport({ width: L, height: A, isMobile: L < 800, hasTouch: L < 800 });
  await pagina.goto(URL, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));

  const pos = () =>
    pagina.evaluate(() => {
      const p = document.getElementById('character');
      return p ? [parseInt(p.style.left) || 0, parseInt(p.style.top) || 0] : null;
    });

  const inicio = await pos();

  /* toca em cada seta e mede o deslocamento */
  async function tocar(classe) {
    const alvo = await pagina.$(`.tecla-toque.${classe}`);
    if (!alvo) return null;
    const caixa = await alvo.boundingBox();
    await pagina.mouse.move(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2);
    await pagina.mouse.down();
    await pagina.mouse.up();
    await new Promise((r) => setTimeout(r, 220));
    return pos();
  }

  const aposDireita = await tocar('direita');
  const aposBaixo = await tocar('baixo');
  const aposEsquerda = await tocar('esquerda');
  const aposCima = await tocar('cima');

  const estado = await pagina.evaluate(() => {
    const c = document.getElementById('controles-toque');
    const r = c.getBoundingClientRect();
    const tabuleiro = document.getElementById('table');
    const rt = tabuleiro ? tabuleiro.getBoundingClientRect() : null;
    const sobrepoe =
      rt && !(r.right < rt.left || r.left > rt.right || r.bottom < rt.top || r.top > rt.bottom);
    return {
      visivel: r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1 && r.left >= -1,
      tamanho: Math.round(r.width) + 'x' + Math.round(r.height),
      cobreOTerreno: sobrepoe,
      sprite: (document.querySelector('#character img') || {}).src?.split('/').pop(),
    };
  });

  await pagina.screenshot({ path: `${PASTA}/recicla-${L}x${A}.png` });

  console.log(
    `${(L + 'x' + A).padEnd(10)} inicio ${JSON.stringify(inicio)} →dir ${JSON.stringify(aposDireita)}` +
      ` →baixo ${JSON.stringify(aposBaixo)} →esq ${JSON.stringify(aposEsquerda)} →cima ${JSON.stringify(aposCima)}` +
      ` | controles ${estado.tamanho} visivel ${estado.visivel} cobre terreno ${estado.cobreOTerreno} sprite ${estado.sprite}`
  );
  await pagina.close();
}

await navegador.close();
