import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  headless: true,
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
await page.goto('http://localhost:5173/jogar/abacomania', { waitUntil: 'networkidle0' });
await page.click('.conta');
await page.screenshot({ path: '.tmp-abaco-before.png', fullPage: true });
console.log(await page.evaluate(() => {
  const game = document.querySelector('.game-container-V');
  const container = document.querySelector('.container');
  const rect = game?.getBoundingClientRect();
  return {
    url: location.href,
    viewport: [innerWidth, innerHeight],
    game: rect && { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    scale: game && getComputedStyle(game).getPropertyValue('--bq-escala'),
    gameOffset: game && [game.offsetWidth, game.offsetHeight],
    container: container && [container.offsetWidth, container.offsetHeight],
    body: [document.body.scrollWidth, document.body.scrollHeight],
  };
}));

const desktop = await browser.newPage();
await desktop.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
await desktop.goto('http://localhost:5173/jogar/abacomania', { waitUntil: 'networkidle0' });
console.log(await desktop.evaluate(() => {
  const game = document.querySelector('.game-container-V');
  const rect = game?.getBoundingClientRect();
  return {
    desktopGame: rect && { width: rect.width, height: rect.height },
    desktopScale: game && getComputedStyle(game).getPropertyValue('--bq-escala'),
  };
}));
await browser.close();
