import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PASTA = process.argv[2];

const navegador = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox'],
});
const pagina = await navegador.newPage();
await pagina.setViewport({ width: 1366, height: 768 });
await pagina.goto('http://localhost:4173/jogar/jornada-dos-bichos', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 900));
await pagina.evaluate(() => document.querySelector('.Botao_jogar_Jornada_bicho').click());
await new Promise((r) => setTimeout(r, 2200));

/* posicao das letras/zona antes, para provar que nada se mexe com a janela */
const antes = await pagina.evaluate(() => ({
  zona: Math.round(document.querySelector('.zones').getBoundingClientRect().top),
  bichos: Math.round(document.querySelector('.objects').getBoundingClientRect().top),
}));

/* arrasta os itens corretos ate a zona usando os eventos de drag do HTML5 */
async function arrastar(indice) {
  await pagina.evaluate((i) => {
    const itens = [...document.querySelectorAll('.drag-item')];
    const item = itens[i];
    if (!item) return;
    const zona = document.querySelector('.drop-zone');
    const dt = new DataTransfer();
    item.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
    const r = zona.getBoundingClientRect();
    zona.dispatchEvent(
      new DragEvent('drop', {
        bubbles: true,
        dataTransfer: dt,
        clientX: r.left + r.width / 2,
        clientY: r.top + r.height / 2,
      })
    );
  }, indice);
  await new Promise((r) => setTimeout(r, 450));
}

/* tenta todos os itens ate o jogo decidir */
for (let i = 0; i < 8; i++) {
  const fim = await pagina.evaluate(
    () => !!document.querySelector('.game_won_jornada, .game_over_jornada')
  );
  if (fim) break;
  await arrastar(0);
}

const comJanela = await pagina.evaluate(() => {
  const j = document.querySelector('.game_won_jornada, .game_over_jornada');
  const q = document.querySelector('.game_container_jornada');
  if (!j) return { apareceu: false };
  const rj = j.getBoundingClientRect();
  const rq = q.getBoundingClientRect();
  const texto = j.querySelector('p');
  return {
    apareceu: true,
    texto: texto.textContent.trim(),
    cobreOJogo:
      Math.abs(rj.width - rq.width) < 3 && Math.abs(rj.height - rq.height) < 3,
    zona: Math.round(document.querySelector('.zones').getBoundingClientRect().top),
    bichos: Math.round(document.querySelector('.objects').getBoundingClientRect().top),
    deixaClicar: getComputedStyle(j).pointerEvents === 'none',
  };
});

if (comJanela.apareceu) await pagina.screenshot({ path: `${PASTA}/aviso-jornada.png` });

await new Promise((r) => setTimeout(r, 3200));
const depois = await pagina.evaluate(() => ({
  sumiu: !document.querySelector('.game_won_jornada, .game_over_jornada'),
  botoes: [...document.querySelectorAll('.Controles_JornadaPA button')].map((b) =>
    b.textContent.trim()
  ),
  zona: Math.round(document.querySelector('.zones').getBoundingClientRect().top),
}));

console.log(
  JSON.stringify(
    {
      antes,
      comJanela,
      depoisDe3s: depois,
      nadaSeMexeu: antes.zona === comJanela.zona && comJanela.zona === depois.zona,
    },
    null,
    1
  )
);

await navegador.close();
