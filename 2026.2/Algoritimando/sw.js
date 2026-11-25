/* sw.js — gerado por ferramentas/gerar-sw.js. Não edite à mão:
   rode "node ferramentas/gerar-sw.js" depois de mudar o ?v= do index.html. */
'use strict';

const VERSAO = '202611251330';
const CACHE = 'algoritimando-' + VERSAO;
const ARQUIVOS = [
  "./",
  "audio/efeitos/carta-vai.mp3",
  "audio/efeitos/carta-volta.mp3",
  "audio/efeitos/certificado.mp3",
  "audio/efeitos/dica.mp3",
  "audio/efeitos/festafinal.mp3",
  "audio/efeitos/figurinha.mp3",
  "audio/efeitos/promocao.mp3",
  "audio/efeitos/quadro.mp3",
  "audio/efeitos/selecao-agente.mp3",
  "audio/efeitos/selo.mp3",
  "audio/efeitos/vitoria.mp3",
  "audio/musica-tema.mp3",
  "fontes/fontes.css?v=202611251330",
  "fontes/fredoka.woff2",
  "fontes/nunito.woff2",
  "img/agente-afro-menina.webp",
  "img/agente-afro-menino.webp",
  "img/agente-costas.webp",
  "img/agente-latina.webp",
  "img/agente-latino.webp",
  "img/agente-menina.webp",
  "img/agente-menino.webp",
  "img/agente-secreto.webp",
  "img/av0.webp",
  "img/av1.webp",
  "img/av2.webp",
  "img/av3.webp",
  "img/av4.webp",
  "img/av5.webp",
  "img/av6.webp",
  "img/cliente0.webp",
  "img/cliente1.webp",
  "img/cliente2.webp",
  "img/cliente3.webp",
  "img/cliente4.webp",
  "img/cliente5.webp",
  "img/fim1.webp",
  "img/fim2.webp",
  "img/fim3.webp",
  "img/fim4.webp",
  "img/fim5.webp",
  "img/fim6.webp",
  "img/guide-feliz.webp",
  "img/guide-triste.webp",
  "img/guide.webp",
  "img/icones/apple-touch-icon.png",
  "img/icones/favicon-64.png",
  "img/icones/icone-192.png",
  "img/icones/icone-512.png",
  "img/icones/icone-maskable-512.png",
  "img/level1.webp",
  "img/level2.webp",
  "img/level3.webp",
  "img/level4.webp",
  "img/level5.webp",
  "img/level6.webp",
  "img/level7.webp",
  "img/level8.webp",
  "img/licoes/abelhas-1.webp",
  "img/licoes/abelhas-2.webp",
  "img/licoes/abelhas-3.webp",
  "img/licoes/abelhas-4.webp",
  "img/licoes/comparativas/abelhas-1.webp",
  "img/licoes/comparativas/abelhas-3.webp",
  "img/licoes/comparativas/maos-1.webp",
  "img/licoes/comparativas/maos-2.webp",
  "img/licoes/comparativas/maos-4.webp",
  "img/licoes/comparativas/mochila-1.webp",
  "img/licoes/comparativas/mochila-3.webp",
  "img/licoes/comparativas/robo-3.webp",
  "img/licoes/comparativas/rua-1.webp",
  "img/licoes/comparativas/sanduiche-1.webp",
  "img/licoes/dentes-1.webp",
  "img/licoes/dentes-2.webp",
  "img/licoes/dentes-3.webp",
  "img/licoes/dentes-4.webp",
  "img/licoes/limonada-1.webp",
  "img/licoes/limonada-2.webp",
  "img/licoes/limonada-3.webp",
  "img/licoes/maos-1.webp",
  "img/licoes/maos-2.webp",
  "img/licoes/maos-3.webp",
  "img/licoes/maos-4.webp",
  "img/licoes/mochila-1.webp",
  "img/licoes/mochila-2.webp",
  "img/licoes/mochila-3.webp",
  "img/licoes/mochila-4.webp",
  "img/licoes/robo-1.webp",
  "img/licoes/robo-2.webp",
  "img/licoes/robo-3.webp",
  "img/licoes/robo-4.webp",
  "img/licoes/robo-5.webp",
  "img/licoes/rua-1.webp",
  "img/licoes/rua-2.webp",
  "img/licoes/rua-3.webp",
  "img/licoes/sanduiche-1.webp",
  "img/licoes/sanduiche-2.webp",
  "img/licoes/sanduiche-3.webp",
  "img/licoes/sanduiche-4.webp",
  "img/licoes/sanduiche-5.webp",
  "img/menu.webp",
  "img/passos/abelhas-01.webp",
  "img/passos/abelhas-02.webp",
  "img/passos/abelhas-03.webp",
  "img/passos/abelhas-04.webp",
  "img/passos/abelhas-05.webp",
  "img/passos/abelhas-06.webp",
  "img/passos/abelhas-07.webp",
  "img/passos/abelhas-08.webp",
  "img/passos/dentes-01.webp",
  "img/passos/dentes-02.webp",
  "img/passos/dentes-03.webp",
  "img/passos/dentes-04.webp",
  "img/passos/dentes-05.webp",
  "img/passos/dentes-06.webp",
  "img/passos/dentes-07.webp",
  "img/passos/dentes-08.webp",
  "img/passos/limonada-01.webp",
  "img/passos/limonada-02.webp",
  "img/passos/limonada-03.webp",
  "img/passos/limonada-04.webp",
  "img/passos/limonada-05.webp",
  "img/passos/limonada-06.webp",
  "img/passos/limonada-07.webp",
  "img/passos/maos-01.webp",
  "img/passos/maos-02.webp",
  "img/passos/maos-03.webp",
  "img/passos/maos-04.webp",
  "img/passos/maos-05.webp",
  "img/passos/maos-06.webp",
  "img/passos/maos-07.webp",
  "img/passos/mochila-01.webp",
  "img/passos/mochila-02.webp",
  "img/passos/mochila-03.webp",
  "img/passos/mochila-04.webp",
  "img/passos/mochila-05.webp",
  "img/passos/mochila-06.webp",
  "img/passos/mochila-07.webp",
  "img/passos/mochila-08.webp",
  "img/passos/robo-01.webp",
  "img/passos/robo-02.webp",
  "img/passos/robo-03.webp",
  "img/passos/robo-04.webp",
  "img/passos/robo-05.webp",
  "img/passos/robo-06.webp",
  "img/passos/robo-07.webp",
  "img/passos/robo-08.webp",
  "img/passos/robo-09.webp",
  "img/passos/rua-01.webp",
  "img/passos/rua-02.webp",
  "img/passos/rua-03.webp",
  "img/passos/rua-04.webp",
  "img/passos/rua-05.webp",
  "img/passos/rua-06.webp",
  "img/passos/sanduiche-01.webp",
  "img/passos/sanduiche-02.webp",
  "img/passos/sanduiche-03.webp",
  "img/passos/sanduiche-04.webp",
  "img/passos/sanduiche-05.webp",
  "img/passos/sanduiche-06.webp",
  "img/passos/sanduiche-07.webp",
  "img/passos/sanduiche-08.webp",
  "img/passos/sanduiche-09.webp",
  "img/passos/sanduiche-10.webp",
  "img/passos/sanduiche-11.webp",
  "img/passos/sanduiche-12.webp",
  "img/passos/sanduiche-13.webp",
  "img/pecas/dentes-base.webp",
  "img/pecas/dentes-copo-agua-usado.webp",
  "img/pecas/dentes-copo-agua.webp",
  "img/pecas/dentes-escova-espuma.webp",
  "img/pecas/dentes-escova-limpa.webp",
  "img/pecas/dentes-escova-pasta.webp",
  "img/pecas/dentes-escova.webp",
  "img/pecas/dentes-pasta-aberta.webp",
  "img/pecas/dentes-pasta.webp",
  "img/pecas/dentes-porta-escova-limpa.webp",
  "img/pecas/dentes-porta-escova.webp",
  "img/pecas/dentes-porta-vazio.webp",
  "img/pecas/limonada-acucar-usado.webp",
  "img/pecas/limonada-acucar.webp",
  "img/pecas/limonada-base.webp",
  "img/pecas/limonada-copo-cheio.webp",
  "img/pecas/limonada-copo.webp",
  "img/pecas/limonada-jarra-agua-suco.webp",
  "img/pecas/limonada-jarra-agua.webp",
  "img/pecas/limonada-jarra-limonada.webp",
  "img/pecas/limonada-jarra-suco.webp",
  "img/pecas/limonada-jarra.webp",
  "img/pecas/limonada-limao-cortado.webp",
  "img/pecas/limonada-limao-espremido.webp",
  "img/pecas/limonada-limao-lavado.webp",
  "img/pecas/limonada-limao.webp",
  "img/pecas/maos-base.webp",
  "img/pecas/maos-espuma.webp",
  "img/pecas/maos-limpas.webp",
  "img/pecas/maos-molhadas.webp",
  "img/pecas/maos-sabonete.webp",
  "img/pecas/maos-secas.webp",
  "img/pecas/maos-sujas.webp",
  "img/pecas/maos-toalha-usada.webp",
  "img/pecas/maos-toalha.webp",
  "img/pecas/maos-torneira-aberta.webp",
  "img/pecas/maos-torneira.webp",
  "img/pecas/mochila-abrir.webp",
  "img/pecas/mochila-borracha.webp",
  "img/pecas/mochila-caderno.webp",
  "img/pecas/mochila-cena-aberta.webp",
  "img/pecas/mochila-cena-fechada.webp",
  "img/pecas/mochila-estojo-dentro.webp",
  "img/pecas/mochila-estojo-fechado.webp",
  "img/pecas/mochila-fechar.webp",
  "img/pecas/mochila-lapis.webp",
  "img/pecas/sanduiche-manteiga.webp",
  "img/pecas/sanduiche-pao-cima.webp",
  "img/pecas/sanduiche-pao.webp",
  "img/pecas/sanduiche-presunto.webp",
  "img/pecas/sanduiche-queijo.webp",
  "img/pic1.webp",
  "img/pic2.webp",
  "img/pic3.webp",
  "img/pic4.webp",
  "img/pic5.webp",
  "img/pic6.webp",
  "img/pic7.webp",
  "img/pic8.webp",
  "img/promo0.webp",
  "img/promo1.webp",
  "img/promo2.webp",
  "img/promo3.webp",
  "img/promo4.webp",
  "img/promo5.webp",
  "img/promo6.webp",
  "img/robo-feliz.webp",
  "img/robo-normal.webp",
  "img/robo-preocupado.webp",
  "img/robo-sorrindo.webp",
  "img/selos/abre-e-fecha.webp",
  "img/selos/ao-mesmo-tempo.webp",
  "img/selos/condicao.webp",
  "img/selos/repeticao.webp",
  "img/story1.webp",
  "img/story2.webp",
  "img/story3.webp",
  "img/story4.webp",
  "img/ui/cracha-agente.webp",
  "img/ui/cracha-icone.webp",
  "img/ui/cracha-senior.webp",
  "img/ui/dica.webp",
  "img/ui/estrela.webp",
  "img/who1.webp",
  "img/who2.webp",
  "img/who3.webp",
  "img/who4.webp",
  "img/who5.webp",
  "img/who6.webp",
  "img/win1.webp",
  "img/win2.webp",
  "img/win3.webp",
  "img/win4.webp",
  "img/win5.webp",
  "img/win6.webp",
  "img/win7.webp",
  "img/win8.webp",
  "index.html",
  "index.html",
  "index.html",
  "js/album.js?v=202611251330",
  "js/app.js?v=202611251330",
  "js/arrasto.js?v=202611251330",
  "js/comum.js?v=202611251330",
  "js/conclusao.js?v=202611251330",
  "js/em-progresso.js?v=202611251330",
  "js/final.js?v=202611251330",
  "js/final.js?v=202611251330",
  "js/final.js?v=202611251330",
  "js/jogo.js?v=202611251330",
  "js/montagem.js?v=202611251330",
  "js/motor.js?v=202611251330",
  "js/perfil.js?v=202611251330",
  "js/progresso.js?v=202611251330",
  "js/pwa.js?v=202611251330",
  "js/situacoes.js?v=202611251330",
  "js/som.js?v=202611251330",
  "js/versao.js?v=202611251330",
  "manifest.webmanifest",
  "style.css?v=202611251330"
];

// instala: baixa tudo de novo (sem usar o cache do navegador)
self.addEventListener('install', ev => {
  ev.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // um arquivo que falhar não impede os outros
    await Promise.all(ARQUIVOS.map(url =>
      fetch(new Request(url, { cache: 'reload' }))
        .then(r => (r.ok ? cache.put(url, r) : null))
        .catch(() => null)));
    await self.skipWaiting();
  })());
});

// ativa: apaga as versões antigas
self.addEventListener('activate', ev => {
  ev.waitUntil((async () => {
    for (const nome of await caches.keys()) {
      if (nome.startsWith('algoritimando-') && nome !== CACHE) await caches.delete(nome);
    }
    await self.clients.claim();
  })());
});

// a música pede pedaços do arquivo (Range): monta o pedaço a partir do arquivo guardado
async function pedaco(pedido, resposta) {
  const blob = await resposta.blob();
  const m = /bytes=(\d*)-(\d*)/.exec(pedido.headers.get('range') || '');
  const inicio = m && m[1] ? Number(m[1]) : 0;
  const fim = m && m[2] ? Number(m[2]) : blob.size - 1;
  return new Response(blob.slice(inicio, fim + 1), {
    status: 206,
    headers: {
      'Content-Type': resposta.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range': `bytes ${inicio}-${fim}/${blob.size}`,
      'Content-Length': String(fim - inicio + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}

self.addEventListener('fetch', ev => {
  const pedido = ev.request;
  if (pedido.method !== 'GET') return;
  const url = new URL(pedido.url);
  if (url.origin !== self.location.origin) return;

  // a página: tenta a internet primeiro (versão nova), senão a guardada
  if (pedido.mode === 'navigate') {
    ev.respondWith((async () => {
      try {
        const r = await fetch(pedido);
        // guarda só a página do jogo (não o editor)
        if (r.ok && (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html'))) (await caches.open(CACHE)).put('./', r.clone());
        return r;
      } catch {
        return (await caches.match(pedido)) || (await caches.match('./'));
      }
    })());
    return;
  }

  // o resto: o guardado primeiro; o que faltar vem da internet e fica guardado
  ev.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const semRange = new Request(pedido.url);
    const guardado = await cache.match(semRange);
    if (guardado) return pedido.headers.has('range') ? pedaco(pedido, guardado) : guardado;
    const r = await fetch(pedido);
    if (r.ok && r.status === 200) cache.put(semRange, r.clone());
    return r;
  })());
});
