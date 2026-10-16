import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PASTA = process.argv[2];

const navegador = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox'],
});

for (const [L, A] of [
  [1920, 1080],
  [1366, 768],
  [1366, 600],
  [1024, 768],
  [526, 551],
  [390, 844],
]) {
  const pagina = await navegador.newPage();
  await pagina.setViewport({ width: L, height: A });
  await pagina.goto('http://localhost:4173/jogar/digirace', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 800));
  await pagina.click('.start-button');

  /* com o semaforo ainda na tela: onde ele esta e o campo deve estar bloqueado */
  await new Promise((r) => setTimeout(r, 900));
  const comSemaforo = await pagina.evaluate(() => {
    const s = document.querySelector('.semaforo-container');
    const painel = document.querySelector('.game-container-D');
    const campo = document.querySelector('.inputD');
    if (!s || !painel) return null;
    const rs = s.getBoundingClientRect();
    const rp = painel.getBoundingClientRect();
    return {
      dentroDoPainel:
        rs.left >= rp.left - 1 && rs.right <= rp.right + 1 &&
        rs.top >= rp.top - 1 && rs.bottom <= rp.bottom + 1,
      encostadoNaDireita: Math.round(rp.right - rs.right),
      tapaOCampo: campo
        ? !(rs.right < campo.getBoundingClientRect().left ||
            rs.left > campo.getBoundingClientRect().right)
        : null,
    };
  });
  await pagina.screenshot({ path: `${PASTA}/semaforo-${L}x${A}.png` });

  /* depois do semaforo: o foco tem que estar no campo */
  await new Promise((r) => setTimeout(r, 5500));
  const jogando = await pagina.evaluate(() => {
    const painel = document.querySelector('.game-container-D');
    const palco = document.querySelector('.bq-palco-react');
    const campo = document.querySelector('.inputD');
    const fase = document.querySelector('.barra-info-d .textoMDfase');
    const tempo = document.querySelector('.barra-info-d .tempo-d');
    const r = painel.getBoundingClientRect();
    return {
      focoNoCampo: document.activeElement === campo,
      campoLiberado: campo ? !campo.disabled : null,
      fonteFase: fase ? getComputedStyle(fase).fontSize : null,
      faseEsquerda: fase && tempo ? fase.getBoundingClientRect().left < tempo.getBoundingClientRect().left : null,
      painel: [Math.round(r.width), Math.round(r.height)],
      palco: [palco.clientWidth, palco.clientHeight],
      rola: palco.scrollHeight > palco.clientHeight || palco.scrollWidth > palco.clientWidth,
      semaforoSumiu: !document.querySelector('.semaforo-container'),
    };
  });
  await pagina.screenshot({ path: `${PASTA}/jogando-${L}x${A}.png` });

  console.log(
    `${(L + 'x' + A).padEnd(10)} semaforo: dentro ${comSemaforo?.dentroDoPainel} dirEm ${comSemaforo?.encostadoNaDireita}px tapaCampo ${comSemaforo?.tapaOCampo}` +
      ` | foco ${jogando.focoNoCampo ? 'SIM' : 'NAO'} fase@esq ${jogando.faseEsquerda} fonte ${jogando.fonteFase}` +
      ` | painel ${jogando.painel.join('x')} rola ${jogando.rola ? 'SIM' : 'nao'}`
  );
  await pagina.close();
}

await navegador.close();
