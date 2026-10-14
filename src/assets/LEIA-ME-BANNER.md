# banner.webp — a arte da abertura

Arquivo: `src/assets/banner.webp` · atual: **2135 × 502 px**, 237 KB

É a ilustração da primeira dobra da home. Para trocar, substitua o arquivo com
o mesmo nome — o Vite cuida do resto, não é preciso mexer em código.

## O que precisa estar onde

O leiaute conta com esta composição, que é a do banner atual:

```
┌──────────────────────┬───────────────────────┬──────────────┐
│  0 – 40%             │  40 – 80%             │  80 – 100%   │
│  PAISAGEM CALMA      │  PERSONAGENS          │  CENÁRIO     │
│  montanha, cachoeira │  robô, crianças,      │  castelo,    │
│                      │  ícones flutuantes    │  planeta     │
│  ← o texto fica aqui │  ← precisa aparecer   │  ← pode ser  │
│    por cima, com     │    sempre             │    cortado   │
│    escurecimento     │                       │              │
└──────────────────────┴───────────────────────┴──────────────┘
```

- **Esquerda (0–40%)**: recebe um escurecimento por CSS e fica atrás do título.
  Nada importante aqui — céu, montanha, mata.
- **Centro (40–80%)**: os personagens. É a parte que o recorte sempre preserva,
  inclusive no celular.
- **Bordas**: os primeiros e últimos 5% podem ser cortados em telas largas.

## Proporção

A altura do hero acompanha a largura da tela justamente para respeitar os
**4.25:1** do banner — a 1920px de largura dá 442px de altura, quase o recorte
inteiro. Se a arte nova tiver proporção muito diferente, avise: a regra
`min-height` de `.bq-hero-interno`, em `src/estilos/portal.css`, precisa
acompanhar.

Abaixo de 860px o leiaute muda: a arte vira uma faixa no topo, recortada em
2:1 na altura dos personagens, e o texto vai para baixo dela. Vale conferir
esse recorte ao trocar a imagem.

## Exportar

Até 2400px de largura e 300 KB. Para converter e comprimir, use o
[Squoosh](https://squoosh.app), ou pelo terminal:

```bash
node -e "require('sharp')('arte.png').resize({width:2200}).webp({quality:84}).toFile('src/assets/banner.webp')"
```
