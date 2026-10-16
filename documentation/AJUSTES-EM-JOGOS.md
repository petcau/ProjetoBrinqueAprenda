# Regras para ajustar um jogo já entregue

Os jogos deste acervo são trabalho das equipes de Web1. Quando um deles precisa
caber melhor na tela, o ajuste é **cirúrgico**: faz caber e nada mais.

Este documento existe porque é fácil errar para o lado do excesso — trocar
fontes, reorganizar blocos, "melhorar" o visual — e entregar de volta um jogo
que não é mais o da equipe.

---

## A regra que resume todas

> **Faça caber. Não redesenhe.**

Se o resultado mudou a aparência do jogo em tela normal, o ajuste passou do
ponto. Quem olhar depois tem que reconhecer o jogo que a equipe entregou.

---

## 1. Só acrescente. Nunca reescreva

- **CSS**: bloco novo no **fim** do arquivo.
- **HTML com `<style>` embutido**: um **segundo** `<style>`, antes de `</head>`.

Nenhuma linha original é alterada ou removida. A verificação é objetiva:

```bash
git diff --numstat -- public/2025.2/NomeDoJogo
```

A coluna de remoções tem que ser **0** em todos os arquivos. Se não for, você
reescreveu alguma coisa.

---

## 2. O que pode e o que não pode mexer

| Pode | Não pode |
|---|---|
| `height`, `min-height`, `max-height` | `font-size`, `font-family`, `font-weight` |
| `padding`, `margin`, `gap` | `color`, `background` |
| `overflow`, `overflow-y` | `border`, `border-radius`, `box-shadow` |
| `align-items`, `justify-content` | ordem ou estrutura dos elementos |

Fonte, cor e borda são **a cara do jogo**. Espaçamento e altura são o que faz
caber. Se o seu bloco novo tem `font-size`, pare e reveja.

Verificação:

```bash
git diff -- public/2025.2/NomeDoJogo | grep "^+" | grep -E "font-size|color:|border|background"
```

Tem que voltar vazio.

---

## 3. Meça antes de mexer

Pergunte: **quantos pixels faltam para caber?**

Se faltam 60px, corte 60px de respiro. Não redesenhe a tela inteira "já que
estou aqui". No Tabuad4on, a tela de questões estava passando por pouco — bastou
reduzir quatro espaçamentos para liberar 69px.

---

## 4. As quatro correções que resolvem quase tudo

**Altura fixa vira mínima.** `height: 100vh` corta o que não couber;
`min-height` deixa crescer e rolar.

```css
body { height: auto; min-height: 100vh; overflow-y: auto; }
```

**`dvh` ao lado de `vh`.** No celular a barra de endereço aparece e some, e o
`100vh` fica maior que a tela visível. O `dvh` acompanha a área real. Mantenha
os dois, nessa ordem — o `vh` é a reserva para navegador antigo.

```css
min-height: 100vh;
min-height: 100dvh;
```

**Media query de altura, não só de largura.** O aperto costuma ser vertical,
ainda mais dentro do portal, onde a barra superior consome parte da altura.

```css
@media (max-height: 700px) { /* corta respiro */ }
```

**Altura fixa em caixa com arte de fundo vira `aspect-ratio`.** Trocar
`height: 900px` por `height: auto; aspect-ratio: 4 / 3` mantém **exatamente** a
proporção que a equipe desenhou, em qualquer largura — melhor do que inventar
uma altura menor. Use a proporção do tamanho original (1200×900 → 4/3,
1440×800 → 9/5).

**Elemento posicionado fora do pai precisa de folga.** Se algo usa
`position: absolute; top: -45px`, abra esse espaço no pai — senão ele é cortado.

---

## 5. Antes de concluir que o leiaute está quebrado

**Verifique se o arquivo é usado.** No Tabuad4on havia um CSS de 1440×1024
exportado de ferramenta de design, sem nenhuma media query — parecia a causa do
problema. Não era: nenhuma tela carregava aquele arquivo. Era código morto, e as
telas de verdade tinham CSS embutido e já responsivo.

```bash
grep -l "nome-do-arquivo.css" caminho/para/*.html
```

Se não retornar nada, aquele CSS não é o problema.

**Liste todos os CSS do jogo, não só o principal.** No Jornada dos Bichos o
`game.css` parecia ser tudo, mas a tela de menu vinha de
`componenetes/Menu.css` — uma caixa de 1440×800 com `overflow: hidden`, o pior
caso do jogo. Só apareceu quando conferi o CSS gerado no `dist/`.

```bash
find caminho/do/jogo -name "*.css"
```

---

## 6. Quando NÃO ajustar

Se o jogo foi construído num tamanho fixo — exportação de ferramenta de design,
com tudo em `position: absolute` e coordenadas em pixel — **não tente torná-lo
responsivo**. Isso é reescrever o trabalho da equipe, não ajustar.

Nesse caso: **relate**. Pode virar tarefa para a turma atual corrigir o próprio
jogo, o que tem valor pedagógico maior do que alguém de fora refazer.

---

## 7. Confira antes de dar por pronto

- [ ] `git diff --numstat` mostra **0 remoções**
      (exceção aceitável: um `-}` isolado, quando o arquivo não tinha quebra de
      linha no fim e o `}` final só ganhou uma — confirme olhando o `git diff`)
- [ ] Nenhuma linha nova com `font-size`, `color`, `border` ou `background`
- [ ] Chaves do CSS balanceadas (`{` e `}` na mesma quantidade)
- [ ] Tags `<style>` pareadas, se mexeu em HTML
- [ ] Acentos preservados — regravar arquivo pode corromper codificação
- [ ] `npm run build` e o ajuste chega ao `dist/`
- [ ] Abrir no navegador **e reduzir a altura da janela**

O último item é o que mais pega: o problema quase nunca aparece na janela
maximizada do desenvolvedor.

---

## Histórico

O Tabuad4on foi ajustado por estas regras em outubro de 2026:
**8 arquivos, 110 inserções, 0 remoções**. A primeira tentativa tinha 376
inserções e mexia em tamanho de fonte — foi refeita.

Os outros nove jogos do acervo foram revisados em seguida, pelas mesmas regras:
**9 arquivos, 164 inserções**, nenhuma propriedade de aparência.

| Jogo | O que apertava | O que foi feito |
|---|---|---|
| MathRace | `.jogo { height: 100vh }` cortava a tela de jogo | virou `min-height`, mais `dvh` |
| Matemágica | leiaute fixo 1920×1080, arte de 2000px saindo da tela | ligou a escala global — ver abaixo |
| AbacoMania | quadro de 1200px mais 120px de respiro | `max-width: 100%` e respiro menor |
| Anagrama | `height: 900px` e mesa travada em 60% | `aspect-ratio: 4/3`, mesa em 94% |
| Jornada dos Bichos | zonas de 965px lado a lado; menu 1440×800 | zonas encolhem e quebram linha |
| DigiRace | nada | nenhuma alteração: já era fluido |

### Matemágica: a exceção que confirma a seção 6

A tela inicial aparecia cortada: o fim do título ("...ENCANTA**DA** ... DE
NÚMERO**S**") saía pela direita. A causa não era o CSS do `body` — era a arte,
um `<img class="img-topo">` de **2000×1020** em `position: absolute`. As telas
de personagem (2300×1200) e de tabuleiro (1930×1060) têm o mesmo problema.

Não dava para encolher só a imagem: os botões são posicionados por flex com
números calibrados à mão (`padding-bottom: 80px`, `margin-bottom: -500px` no
JOGAR) para cair em cima do pergaminho **no tamanho original**. Mexer na arte
desalinha os botões; mexer nos botões é redesenhar a composição da equipe.

A saída estava no próprio jogo. A equipe deixou pronto, nos três HTML:

```css
#game-scale { width: 1920px; height: 1080px; transform-origin: top left; }
```

...e nunca escreveu o `transform`. Não havia um único `scale()` no jogo. O
ajuste foi **ligar esse gancho**, em `escala-tela.js` — arquivo novo, mais uma
linha de `<script>` em cada HTML. Nenhuma cor, fonte, tamanho ou coordenada
mudou: o quadro inteiro é reduzido junto, então os botões continuam exatamente
onde a equipe os colocou. Em monitor grande a escala dá 1 e nada acontece.

Duas armadilhas que o arquivo resolve e vale copiar:

- **Medir antes de escalar.** Duas telas têm conteúdo maior que o próprio
  `#game-scale`, então escalar por 1920×1080 fixo ainda cortaria. O script mede
  o que de fato ocupa, com 1920×1080 como piso, ignorando o que está
  `display: none` (os modais).
- **`translate` é relativo ao layout, não à janela.** Na tela inicial o `body`
  é flex com `justify-content: flex-end`, então o quadro não começa em (0, 0).
  Centralizar exige medir onde ele está (`getBoundingClientRect`) e deslocar a
  diferença.

Isto **não** contradiz a seção 6. A regra continua: não redesenhe um leiaute
fixo. Terminar um mecanismo que a equipe começou, sem tocar em nenhuma decisão
visual dela, é outra coisa — e foi decisão do responsável pelo portal, não
minha. Quando aparecer um caso assim, procure o gancho antes de concluir que
não há saída.
