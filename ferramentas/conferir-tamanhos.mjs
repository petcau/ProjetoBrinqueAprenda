import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:4173/jogar/anagrama';
const PASTA = process.argv[2];

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

function cabe(dentro, fora) {
  return (
    dentro.left >= fora.left - 1 &&
    dentro.right <= fora.right + 1 &&
    dentro.top >= fora.top - 1 &&
    dentro.bottom <= fora.bottom + 1
  );
}

for (const [L, A] of TAMANHOS) {
  await pagina.setViewport({ width: L, height: A });
  await pagina.goto(URL, { waitUntil: 'networkidle2' });
  await pagina.waitForSelector('.tela-inicial-box button', { timeout: 8000 });
  await pagina.click('.tela-inicial-box button');
  await new Promise((r) => setTimeout(r, 1200));

  const d = await pagina.evaluate(() => {
    const cx = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, w: Math.round(r.width), h: Math.round(r.height) };
    };
    const q = document.querySelector('.game-container-anagrama');
    const palco = document.querySelector('.bq-palco-react');
    return {
      escala: getComputedStyle(q).getPropertyValue('--bq-escala').trim() || '-',
      quadro: cx(q),
      crono: cx(document.querySelector('.cronometro-anagrama')),
      cronoTexto: (document.querySelector('.cronometro-anagrama') || {}).textContent?.trim(),
      menu: cx(document.querySelector('.botao_voltar_menu')),
      menuTexto: (document.querySelector('.botao_voltar_menu') || {}).textContent?.trim(),
      titulo: cx(document.querySelector('.title')),
      nivel: cx(document.querySelector('.fase')),
      letras: cx(document.querySelector('.letras')),
      palcoCaixa: { left: 0, top: 0, right: palco.clientWidth, bottom: palco.clientHeight },
      rolaX: palco.scrollWidth > palco.clientWidth,
      rolaY: palco.scrollHeight > palco.clientHeight,
    };
  });

  await pagina.screenshot({ path: `${PASTA}/r-${L}x${A}.png` });

  const vazam = [];
  for (const nome of ['crono', 'menu', 'titulo', 'nivel', 'letras']) {
    if (d[nome] && !cabe(d[nome], d.palcoCaixa)) vazam.push(nome);
  }

  console.log(
    `${(L + 'x' + A).padEnd(10)} escala ${String(d.escala).padEnd(6)} quadro ${(d.quadro.w + 'x' + d.quadro.h).padEnd(10)}` +
      ` crono ${String(d.cronoTexto).padEnd(3)} menu "${d.menuTexto}"` +
      ` | rolaX ${d.rolaX ? 'SIM' : 'nao'} rolaY ${d.rolaY ? 'SIM' : 'nao'}` +
      (vazam.length ? ` | VAZA: ${vazam.join(',')}` : ' | tudo dentro')
  );
}

await navegador.close();
