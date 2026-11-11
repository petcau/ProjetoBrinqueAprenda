const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const png = require('./png.cjs');

const rootDir = path.join(__dirname, '../..');
const srcBaixoWebp = path.join(rootDir, 'assets/personagem/menina-baixo-diagonais-4x2.webp');
const currentDiagPng = path.join(rootDir, 'assets/personagem/menina-diagonal-8.png');
const destWebp = path.join(rootDir, 'assets/personagem/menina-diagonal-8.webp');
const destPng = path.join(rootDir, 'assets/personagem/menina-diagonal-8.png');
const previaPng = path.join(__dirname, 'previa-ciclo-diagonal-8.png');

const archiveDir = path.join(rootDir, '_lixeira/historico/diagonais');
if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });

// Arquiva a folha anterior se ainda não arquivada
if (fs.existsSync(destWebp)) {
  fs.copyFileSync(destWebp, path.join(archiveDir, 'menina-diagonal-8-old.webp'));
}
if (fs.existsSync(destPng)) {
  fs.copyFileSync(destPng, path.join(archiveDir, 'menina-diagonal-8-old.png'));
}

const FW = 48, FH = 56, COLS = 10, ROWS = 4;
const PIVOT_X = 24, PIVOT_Y = 52;
const HIP = 44;

// Escala calculada para igualar exatamente à escala 0.20 da imagem 4x4 original:
// img4x4: cellH = 256. imgBaixo: cellH = 303.
// SCALE = 0.20 * (256 / 303) = 0.16897689768976898
const SCALE_BAIXO = 0.20 * (256 / 303);

const CYCLE = [[1,0],[1,1],[2,0],[2,-1],[3,0],[3,1],[0,0],[0,-1]];
const IDLE = [[0,0],[0,1]];

const server = http.createServer((req, res) => {
  if (req.url === '/baixo-img') {
    res.writeHead(200, { 'Content-Type': 'image/webp' });
    fs.createReadStream(srcBaixoWebp).pipe(res);
  } else if (req.url === '/current-png') {
    res.writeHead(200, { 'Content-Type': 'image/png' });
    fs.createReadStream(currentDiagPng).pipe(res);
  } else if (req.url === '/save-result') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const { webpBase64, rawRgbaBase64, report } = JSON.parse(body);

      // 1. Salva WebP
      fs.writeFileSync(destWebp, Buffer.from(webpBase64.split(',')[1], 'base64'));

      // 2. Salva PNG
      const rawBuf = Buffer.from(rawRgbaBase64, 'base64');
      const pngImg = { w: FW * COLS, h: FH * ROWS, data: rawBuf };
      png.write(destPng, pngImg);

      // Cópia para _lixeira/historico/diagonais/
      fs.writeFileSync(path.join(archiveDir, 'menina-diagonal-8.webp'), Buffer.from(webpBase64.split(',')[1], 'base64'));
      png.write(path.join(archiveDir, 'menina-diagonal-8.png'), pngImg);

      // 3. Prévia 4x sobre magenta
      const S = 4;
      const pv = png.blank(pngImg.w * S, pngImg.h * S);
      for (let y = 0; y < pv.h; y++) {
        for (let x = 0; x < pv.w; x++) {
          const s = ((Math.floor(y / S)) * pngImg.w + Math.floor(x / S)) * 4;
          const d = (y * pv.w + x) * 4;
          const a = pngImg.data[s + 3] / 255;
          const isGrid = (Math.floor(x / S) % FW === 0) || (Math.floor(y / S) % FH === 0);
          const bg = isGrid ? [40, 40, 40] : [255, 0, 255];
          for (let k = 0; k < 3; k++) {
            pv.data[d + k] = Math.round(pngImg.data[s + k] * a + bg[k] * (1 - a));
          }
          pv.data[d + 3] = 255;
        }
      }
      png.write(previaPng, pv);

      console.log('=== FOLHA DIAGONAL ATUALIZADA COM SUCESSO ===');
      console.log(report);
      console.log(`WebP gravado: ${destWebp}`);
      console.log(`PNG gravado: ${destPng}`);
      console.log(`Prévia gravada: ${previaPng}`);

      res.writeHead(200); res.end('ok');
      setTimeout(() => { server.close(); process.exit(0); }, 300);
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html><html><body><script>
      (async () => {
        const load = url => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = url; });
        const imgBaixo = await load('/baixo-img');
        const imgCurrent = await load('/current-png');

        const FW = ${FW}, FH = ${FH}, COLS = ${COLS}, ROWS = ${ROWS};
        const PIVOT_X = ${PIVOT_X}, PIVOT_Y = ${PIVOT_Y}, HIP = ${HIP};
        const SCALE2 = ${SCALE_BAIXO};

        // 1. Extrai e reduz as células de imgBaixo (4 colunas x 2 linhas) para base 48x56
        const baseCanvas = document.createElement('canvas');
        baseCanvas.width = FW * 4;
        baseCanvas.height = FH * 2;
        const baseCtx = baseCanvas.getContext('2d', { willReadFrequently: true });
        baseCtx.imageSmoothingEnabled = false;

        const cellW = imgBaixo.naturalWidth / 4;
        const cellH = imgBaixo.naturalHeight / 2;

        for (let r = 0; r < 2; r++) {
          for (let c = 0; c < 4; c++) {
            const sx = c * cellW;
            const sy = r * cellH;
            const sw = cellW;
            const sh = cellH;

            // Canvas temporário da célula
            const tc = document.createElement('canvas');
            tc.width = sw;
            tc.height = sh;
            const tctx = tc.getContext('2d');
            tctx.drawImage(imgBaixo, sx, sy, sw, sh, 0, 0, sw, sh);

            // Mede a ponta dos pés na célula
            const tData = tctx.getImageData(0, 0, sw, sh).data;
            let footY = 0, feetX = [];
            for (let y = sh - 1; y >= 0; y--) {
              for (let x = 0; x < sw; x++) {
                if (tData[(y * sw + x) * 4 + 3] > 20) {
                  if (!footY) footY = y;
                  if (y === footY) feetX.push(x);
                }
              }
              if (footY) break;
            }
            const footX = feetX.length ? (feetX[0] + feetX[feetX.length - 1]) / 2 : sw / 2;

            const dstFootX = c * FW + PIVOT_X;
            const dstFootY = r * FH + PIVOT_Y;

            const dstX = dstFootX - footX * SCALE2;
            const dstY = dstFootY - footY * SCALE2;

            baseCtx.save();
            baseCtx.beginPath();
            baseCtx.rect(c * FW, r * FH, FW, FH);
            baseCtx.clip();
            baseCtx.drawImage(tc, 0, 0, sw, sh, dstX, dstY, sw * SCALE2, sh * SCALE2);
            baseCtx.restore();
          }
        }

        // Limpeza de alfa para 1-bit puro
        const baseImgData = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
        const bData = baseImgData.data;
        let cleanTransparent = 0, cleanOpaque = 0;
        for (let i = 0; i < bData.length; i += 4) {
          if (bData[i + 3] < 128) {
            bData[i] = bData[i + 1] = bData[i + 2] = bData[i + 3] = 0;
            cleanTransparent++;
          } else {
            bData[i + 3] = 255;
            cleanOpaque++;
          }
        }
        baseCtx.putImageData(baseImgData, 0, 0);

        // 2. Monta a folha final 10 colunas x 4 linhas de 48x56 (480x224)
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = FW * COLS;
        finalCanvas.height = FH * ROWS;
        const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true });
        finalCtx.imageSmoothingEnabled = false;

        // Copia as linhas 2 e 3 (cima-esquerda e cima-direita) EXATAMENTE como estão da folha atual
        finalCtx.drawImage(imgCurrent, 0, 0);

        // Limpa as linhas 0 e 1 no canvas final para desenhar as novas linhas de baixo
        finalCtx.clearRect(0, 0, finalCanvas.width, FH * 2);

        const finalImgData = finalCtx.getImageData(0, 0, finalCanvas.width, finalCanvas.height);
        const fData = finalImgData.data;

        const getBasePixel = (c, r, x, y) => {
          const idx = ((r * FH + y) * baseCanvas.width + (c * FW + x)) * 4;
          return [bData[idx], bData[idx + 1], bData[idx + 2], bData[idx + 3]];
        };

        const putFinalPixel = (c, r, x, y, rgba) => {
          const idx = ((r * FH + y) * finalCanvas.width + (c * FW + x)) * 4;
          fData[idx] = rgba[0];
          fData[idx + 1] = rgba[1];
          fData[idx + 2] = rgba[2];
          fData[idx + 3] = rgba[3];
        };

        function buildFrame(dc, r, [sc, dy]) {
          for (let y = 0; y < FH; y++) {
            for (let x = 0; x < FW; x++) {
              putFinalPixel(dc, r, x, y, getBasePixel(sc, r, x, y));
            }
          }
          if (!dy) return;
          if (dy > 0) {
            // Desce 1 px
            for (let y = HIP + 1; y >= 1; y--) {
              for (let x = 0; x < FW; x++) {
                const p = getBasePixel(sc, r, x, y - 1);
                if (y === HIP + 1 && p[3] === 0) continue;
                putFinalPixel(dc, r, x, y, p);
              }
            }
            for (let x = 0; x < FW; x++) putFinalPixel(dc, r, x, 0, [0, 0, 0, 0]);
          } else {
            // Sobe 1 px
            for (let y = 0; y < HIP; y++) {
              for (let x = 0; x < FW; x++) {
                putFinalPixel(dc, r, x, y, getBasePixel(sc, r, x, y + 1));
              }
            }
          }
        }

        const CYCLE = ${JSON.stringify(CYCLE)};
        const IDLE = ${JSON.stringify(IDLE)};

        // Aplica o ciclo nas linhas 0 e 1 (baixo-esq e baixo-dir)
        for (let r = 0; r < 2; r++) {
          CYCLE.forEach((f, i) => buildFrame(i, r, f));
          IDLE.forEach((f, i) => buildFrame(8 + i, r, f));
        }

        finalCtx.putImageData(finalImgData, 0, 0);

        // Medições de conferência
        let topY0 = FH, footY0 = 0;
        let topY2 = FH, footY2 = 0;
        for (let y = 0; y < FH; y++) {
          for (let x = 0; x < FW; x++) {
            if (fData[(y * finalCanvas.width + x) * 4 + 3] > 128) {
              if (y < topY0) topY0 = y;
              if (y > footY0) footY0 = y;
            }
            const idx2 = (((2 * FH + y) * finalCanvas.width + x)) * 4;
            if (fData[idx2 + 3] > 128) {
              if (y < topY2) topY2 = y;
              if (y > footY2) footY2 = y;
            }
          }
        }

        const webpBase64 = finalCanvas.toDataURL('image/webp', 1.0);

        let binary = '';
        const bytes = new Uint8Array(fData.buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i += 8192) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(len, i + 8192)));
        }
        const rawRgbaBase64 = btoa(binary);

        const report = 'Folha gerada: ' + finalCanvas.width + 'x' + finalCanvas.height + '\\n' +
          'Linhas 0 e 1 (baixo-esq / baixo-dir): headTopY=' + topY0 + ', footY=' + footY0 + ', altura=' + (footY0 - topY0 + 1) + ' px\\n' +
          'Linhas 2 e 3 (cima-esq / cima-dir): headTopY=' + topY2 + ', footY=' + footY2 + ', altura=' + (footY2 - topY2 + 1) + ' px\\n' +
          'Transparência 1-bit pura garantida.';

        fetch('/save-result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ webpBase64, rawRgbaBase64, report })
        });
      })();
    </script></body></html>`);
  }
});

const PORT = 8095;
server.listen(PORT, () => {
  const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  spawn(chrome, ['--headless=new', '--disable-gpu', `http://localhost:${PORT}`]);
});

