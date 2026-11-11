// Gera assets/personagem/menina-diagonal-8.webp (e .png): 10 colunas × 4 linhas de 48×56.
// Linhas: 0 = baixo-esquerda, 1 = baixo-direita, 2 = cima-esquerda, 3 = cima-direita.
// Colunas 0–7 = ciclo de caminhada fluido (4 quadros por passo); 8–9 = respiração parada.
// Processo idêntico a gerar-ciclo-8.cjs: tronco (acima de HIP=44) desloca ±1 px, pés no pivô (24,52).

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const png = require('./png.cjs');

const rootDir = path.join(__dirname, '../..');
const srcWebp = path.join(rootDir, 'assets/personagem/menina-diagonais-4x4.webp');
const destWebp = path.join(rootDir, 'assets/personagem/menina-diagonal-8.webp');
const destPng = path.join(rootDir, 'assets/personagem/menina-diagonal-8.png');
const previaPng = path.join(__dirname, 'previa-ciclo-diagonal-8.png');

const FW = 48, FH = 56, COLS = 10, ROWS = 4;
const PIVOT_X = 24, PIVOT_Y = 52;
const HIP = 44;
const SCALE = 0.20; // Escala calibrada que iguala a altura corporal à folha ortogonal (47 px vs 44-50 px)
const CELL_W = 877 / 4; // 219.25 px por coluna na imagem 877x1024

const CYCLE = [[1,0],[1,1],[2,0],[2,-1],[3,0],[3,1],[0,0],[0,-1]];
const IDLE = [[0,0],[0,1]];

const server = http.createServer((req, res) => {
  if (req.url === '/src-img') {
    res.writeHead(200, { 'Content-Type': 'image/webp' });
    fs.createReadStream(srcWebp).pipe(res);
  } else if (req.url === '/save-result') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const { webpBase64, rawRgbaBase64, report } = JSON.parse(body);

      // 1. Salva WebP
      fs.writeFileSync(destWebp, Buffer.from(webpBase64.split(',')[1], 'base64'));

      // 2. Salva PNG usando png.cjs para garantir compatibilidade
      const rawBuf = Buffer.from(rawRgbaBase64, 'base64');
      const pngImg = { w: FW * COLS, h: FH * ROWS, data: rawBuf };
      png.write(destPng, pngImg);

      // 3. Gera prévia 4x ampliada sobre fundo magenta para auditoria de bordas e transparência
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

      console.log('=== GERAÇÃO CONCLUÍDA COM SUCESSO ===');
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
        const img = new Image();
        await new Promise(r => { img.onload = r; img.src = '/src-img'; });

        // Passo 1: Extrair e reduzir cada uma das 16 células (4 cols x 4 rows) para 48x56
        // com amostragem de vizinho mais próximo (preservando nitidez de pixel art)
        // e pés alinhados no pivô (24, 52).
        const baseCanvas = document.createElement('canvas');
        baseCanvas.width = ${FW * 4};
        baseCanvas.height = ${FH * ROWS};
        const baseCtx = baseCanvas.getContext('2d', { willReadFrequently: true });
        baseCtx.imageSmoothingEnabled = false;

        for (let r = 0; r < ${ROWS}; r++) {
          const sy = r * 256;
          const sh = 256;
          const srcFootY = sy + 250;
          for (let c = 0; c < 4; c++) {
            const sx = c * ${CELL_W};
            const sw = ${CELL_W};
            const srcFootX = (c + 0.5) * ${CELL_W};

            // Canvas temporário para isolar a célula sem sangramento de vizinhos
            const cellCanvas = document.createElement('canvas');
            cellCanvas.width = sw;
            cellCanvas.height = sh;
            const cellCtx = cellCanvas.getContext('2d');
            cellCtx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

            const cellFootX = srcFootX - sx;
            const cellFootY = srcFootY - sy;

            const dstFootX = c * ${FW} + ${PIVOT_X};
            const dstFootY = r * ${FH} + ${PIVOT_Y};

            const dstX = dstFootX - cellFootX * ${SCALE};
            const dstY = dstFootY - cellFootY * ${SCALE};
            const dstW = sw * ${SCALE};
            const dstH = sh * ${SCALE};

            baseCtx.save();
            baseCtx.beginPath();
            baseCtx.rect(c * ${FW}, r * ${FH}, ${FW}, ${FH});
            baseCtx.clip();
            baseCtx.drawImage(cellCanvas, 0, 0, sw, sh, dstX, dstY, dstW, dstH);
            baseCtx.restore();
          }
        }

        // Limpeza de alfa: garantia de alfa 1-bit puro (0 ou 255) sem bordas claras ou verdes
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

        // Passo 2: Montar a folha final 10 colunas x 4 linhas de 48x56 (480x224)
        // com o ciclo de 8 quadros de caminhada + 2 quadros de respiração parada (gerar-ciclo-8)
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = ${FW * COLS};
        finalCanvas.height = ${FH * ROWS};
        const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true });
        const finalImgData = finalCtx.createImageData(finalCanvas.width, finalCanvas.height);
        const fData = finalImgData.data;

        const getBasePixel = (c, r, x, y) => {
          const idx = ((r * ${FH} + y) * baseCanvas.width + (c * ${FW} + x)) * 4;
          return [bData[idx], bData[idx + 1], bData[idx + 2], bData[idx + 3]];
        };

        const putFinalPixel = (c, r, x, y, rgba) => {
          const idx = ((r * ${FH} + y) * finalCanvas.width + (c * ${FW} + x)) * 4;
          fData[idx] = rgba[0];
          fData[idx + 1] = rgba[1];
          fData[idx + 2] = rgba[2];
          fData[idx + 3] = rgba[3];
        };

        function buildFrame(dc, r, [sc, dy]) {
          // Copia quadro base
          for (let y = 0; y < ${FH}; y++) {
            for (let x = 0; x < ${FW}; x++) {
              putFinalPixel(dc, r, x, y, getBasePixel(sc, r, x, y));
            }
          }
          if (!dy) return;
          if (dy > 0) {
            // Desce 1 px: tronco vai para baixo; na emenda só sobrepõe pixels opacos
            for (let y = ${HIP} + 1; y >= 1; y--) {
              for (let x = 0; x < ${FW}; x++) {
                const p = getBasePixel(sc, r, x, y - 1);
                if (y === ${HIP} + 1 && p[3] === 0) continue;
                putFinalPixel(dc, r, x, y, p);
              }
            }
            for (let x = 0; x < ${FW}; x++) putFinalPixel(dc, r, x, 0, [0, 0, 0, 0]);
          } else {
            // Sobe 1 px: linha da cintura se repete sem abrir buraco
            for (let y = 0; y < ${HIP}; y++) {
              for (let x = 0; x < ${FW}; x++) {
                putFinalPixel(dc, r, x, y, getBasePixel(sc, r, x, y + 1));
              }
            }
          }
        }

        const CYCLE = ${JSON.stringify(CYCLE)};
        const IDLE = ${JSON.stringify(IDLE)};

        for (let r = 0; r < ${ROWS}; r++) {
          CYCLE.forEach((f, i) => buildFrame(i, r, f));
          IDLE.forEach((f, i) => buildFrame(8 + i, r, f));
        }

        finalCtx.putImageData(finalImgData, 0, 0);

        // Gera WebP
        const webpBase64 = finalCanvas.toDataURL('image/webp', 1.0);

        // Converte fData para base64 raw RGBA para escrita PNG em node
        let binary = '';
        const bytes = new Uint8Array(fData.buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i += 8192) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(len, i + 8192)));
        }
        const rawRgbaBase64 = btoa(binary);

        const report = 'Folha gerada: ' + finalCanvas.width + 'x' + finalCanvas.height +
          ' (10 colunas x 4 linhas de 48x56)\\n' +
          'Pivô dos pés: (' + ${PIVOT_X} + ', ' + ${PIVOT_Y} + ')\\n' +
          'Cintura HIP: ' + ${HIP} + '\\n' +
          'Pixels transparentes: ' + cleanTransparent + ', opacos: ' + cleanOpaque;

        fetch('/save-result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ webpBase64, rawRgbaBase64, report })
        });
      })();
    </script></body></html>`);
  }
});

const PORT = 8085;
server.listen(PORT, () => {
  const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  spawn(chrome, ['--headless=new', '--disable-gpu', `http://localhost:${PORT}`]);
});

