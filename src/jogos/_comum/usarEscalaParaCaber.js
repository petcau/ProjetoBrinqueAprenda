import { useEffect } from 'react';

/**
 * Reduz um jogo de tamanho fixo até caber no espaço disponível, sem redesenhá-lo.
 *
 * Vários jogos do acervo foram desenhados numa medida fixa — o tabuleiro do
 * Anagrama tem 1200x900, o Jornada dos Bichos 1440x800 — com peças posicionadas
 * por coordenada em pixel. Encolher a caixa por CSS não funciona nesses casos:
 * a caixa diminui mas o conteúdo não acompanha, então os elementos saem do
 * lugar e o que não cabe vaza. Escalar o conjunto inteiro resolve, porque tudo
 * encolhe junto e a composição que a equipe calibrou continua idêntica.
 *
 * Três armadilhas na hora de medir, todas já custaram uma rodada de erro:
 *
 * 1. NÃO confie no tamanho declarado no CSS. O quadro do AbacoMania diz
 *    `height: 900px` mas o conteúdo ocupa 907.
 * 2. `overflow: hidden` faz o `scrollHeight` MENTIR: ele devolve a altura da
 *    caixa, porque o que transborda é recortado e não vira área rolável.
 * 3. O conteúdo pode vazar para CIMA. Quando a caixa centraliza com flex e o
 *    conteúdo é mais alto que ela, sobra metade para cada lado — no Jornada
 *    dos Bichos o botão de áudio fica 18px acima do topo. Escalar sozinho não
 *    traz isso de volta: é preciso deslocar junto.
 *
 * Por isso a medida é a união das caixas de todos os descendentes visíveis,
 * com o overflow aberto durante a leitura.
 *
 * O hook escreve as variáveis no próprio elemento e o CSS só as aplica:
 *
 *     .quadro-do-jogo {
 *       transform: translate(var(--bq-escala-x, 0px), var(--bq-escala-y, 0px))
 *                  scale(var(--bq-escala, 1));
 *       transform-origin: top left;
 *       margin-left: var(--bq-escala-mx, 0px);
 *       margin-right: var(--bq-escala-mx, 0px);
 *       margin-bottom: var(--bq-escala-mb, 0px);
 *     }
 *
 * As margens negativas são necessárias porque `transform` é só pintura: o
 * elemento continua ocupando o tamanho original no layout, e sem elas sobraria
 * um vazio do tamanho do que foi encolhido — que vira barra de rolagem.
 *
 * Nunca amplia: o fator é limitado a 1, então em monitor grande o jogo aparece
 * no tamanho original e nada muda.
 *
 * Escreve direto no DOM em vez de devolver um valor para o React porque medir
 * depende do que já está pintado; passar por estado criaria um ciclo entre
 * medir e re-renderizar.
 *
 * @param {{current: HTMLElement|null}} ref  o elemento a ser reduzido
 * @param {unknown} gatilho  valor que muda quando o elemento entra na tela ou
 *   quando o conteúdo dele muda de tamanho. É obrigatório porque o elemento
 *   pode não existir na primeira renderização: no Anagrama o hook é chamado
 *   antes do `return` da tela inicial, e sem o gatilho nas dependências o
 *   efeito sairia cedo e nunca mais rodaria.
 * @param {number} respiro  px descontados do espaço disponível
 */
export function usarEscalaParaCaber(ref, gatilho, respiro = 64) {
  useEffect(() => {
    const quadro = ref.current;
    if (!quadro) return undefined;

    /* Largura disponível: NÃO dá para perguntar ao pai. Quando o filho tem
       largura fixa, o pai não consegue encolher abaixo disso e responde sempre
       o tamanho do conteúdo — a conta nunca apertaria. Quem define o que cabe
       é o primeiro ancestral que recorta, ou seja, o palco do portal. */
    function areaVisivel() {
      for (let n = quadro.parentElement; n; n = n.parentElement) {
        if (getComputedStyle(n).overflowX !== 'visible') return n;
      }
      return document.documentElement;
    }

    function medir() {
      quadro.style.setProperty('--bq-escala', '1');
      quadro.style.setProperty('--bq-escala-x', '0px');
      quadro.style.setProperty('--bq-escala-y', '0px');

      const overflowAntes = quadro.style.overflow;
      quadro.style.overflow = 'visible';

      const caixa = quadro.getBoundingClientRect();
      let topo = 0;
      let base = quadro.offsetHeight;
      let esquerda = 0;
      let direita = quadro.offsetWidth;

      for (const filho of quadro.querySelectorAll('*')) {
        if (!filho.getClientRects().length) continue; /* escondido */
        const r = filho.getBoundingClientRect();
        topo = Math.min(topo, r.top - caixa.top);
        base = Math.max(base, r.bottom - caixa.top);
        esquerda = Math.min(esquerda, r.left - caixa.left);
        direita = Math.max(direita, r.right - caixa.left);
      }

      quadro.style.overflow = overflowAntes;

      const largura = direita - esquerda;
      const altura = base - topo;
      if (largura <= 0 || altura <= 0) return;

      /* A altura disponível vem da JANELA, não de um elemento pai: medir pelo
         pai só funciona se ele tiver altura própria, e quando ele cresce junto
         com o conteúdo a medida se realimenta. */
      const deslocamentoTopo = caixa.top + window.scrollY;
      const disponivelX = areaVisivel().clientWidth - respiro;
      const disponivelY = window.innerHeight - deslocamentoTopo - respiro / 2;
      if (disponivelX <= 0 || disponivelY <= 0) return;

      const bruta = Math.min(disponivelX / largura, disponivelY / altura, 1);
      const escala = Math.round(bruta * 1000) / 1000;

      const px = (v) => Math.round(v * 10) / 10 + 'px';

      quadro.style.setProperty('--bq-escala', String(escala));
      /* traz de volta o que vazava para cima e para a esquerda */
      quadro.style.setProperty('--bq-escala-x', px(-esquerda * escala));
      quadro.style.setProperty('--bq-escala-y', px(-topo * escala));
      /* o espaço que o elemento deve ocupar no layout é o tamanho JÁ escalado */
      quadro.style.setProperty(
        '--bq-escala-mx',
        px((largura * escala - quadro.offsetWidth) / 2)
      );
      quadro.style.setProperty(
        '--bq-escala-mb',
        px(altura * escala - quadro.offsetHeight)
      );
    }

    medir();

    let observador;
    if (typeof ResizeObserver === 'function') {
      /* observa a area; o quadro nao, senao a propria escala realimenta */
      observador = new ResizeObserver(medir);
      observador.observe(areaVisivel());
    }
    window.addEventListener('resize', medir);
    window.addEventListener('orientationchange', medir);
    /* fontes e imagens mudam o tamanho medido depois do primeiro quadro */
    const atraso = window.setTimeout(medir, 300);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(medir);

    return () => {
      if (observador) observador.disconnect();
      window.clearTimeout(atraso);
      window.removeEventListener('resize', medir);
      window.removeEventListener('orientationchange', medir);
    };
  }, [ref, gatilho, respiro]);
}
