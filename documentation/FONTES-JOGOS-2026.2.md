# Fontes dos jogos da turma 2026.2

Este arquivo registra de onde veio cada jogo estático anexado ao portal. Antes
de atualizar um jogo, compare o `commit integrado` com a ponta da branch
registrada e preserve adaptações que existam apenas no portal.

| Jogo | Repositório | Branch | Commit integrado | Destino no portal | Adaptações locais |
|---|---|---|---|---|---|
| Algoritimando | `https://github.com/helder41/Algoritimando-1` | `main` | `c5f8f4d702021b4b5ff314668b6a42dae001f388` | `public/2026.2/Algoritimando/` | Progresso adaptado pelo catálogo; capa criada para o portal. |
| Ilha do Conhecimento | `https://github.com/danielpsts07/Ilha-do-Conhecimento` | `main` | `56b3715bc263a8482572b6a48035768ebafb064c` | `public/2026.2/IlhaDoConhecimento/` | Sem alteração no código do jogo; capa criada para o portal. |
| Robô Ritimado | `https://github.com/asethrya/robo-ritmado` | `main` | `069bc47d044a27b7faeea738f3a6dffd9dcfa887` | `public/2026.2/RoboRitimado/` | Progresso adaptado pelo catálogo; capa criada para o portal. |
| Sinfonia dos Cristais | `https://github.com/Italoviski/Sinfonia-dos-Cristais` | `main` | `e54d6f3e3f44d99844afb274cc83a0f38fcc7474` | `public/2026.2/SinfoniaDosCristais/` | Progresso adaptado pelo catálogo; capa criada para o portal. |
| RocketBloom | `https://github.com/sm64isdabest/RocketBloom` | `main` | `0dc1e870ce927fa964702885ab21411c148af728` | `public/2026.2/RocketBloom/` | Build com base do portal; progresso adaptado pelo catálogo; capa criada para o portal. |
| Guardião da Natureza | `https://github.com/iuribrns/GUARDIAO_DA_NATUREZA` | `main` | `4d81d5fa68ca79ea5183f24bdd9350e48e8579fe` | `public/2026.2/GuardiaoDaNatureza/` | Artefato oficial do GitHub Actions; progresso adaptado pelo catálogo; capa criada para o portal. |

## Algoritimando

- Integração inicial: 11 de novembro de 2026.
- Arquivos publicados: `index.html`, `editor.html`, CSS, JavaScript, imagens,
  áudio e licença MIT.
- Materiais de desenvolvimento (`docs/`, relatórios e arquivos de prompts) não
  são publicados no portal.
- Chaves de progresso preservadas por perfil:
  `algoritimando-progresso` e `algoritimando-perfil`.
- Capa do portal: `public/capas/algoritimando.webp`, criada com geração de
  imagem a partir da tela inicial real e convertida para WebP 1200 × 675.

## Ilha do Conhecimento

- Integração inicial: 11 de novembro de 2026.
- Arquivos publicados: `index.html`, CSS, JavaScript, dados, introdução,
  imagens e áudio necessários para executar o jogo.
- Materiais de desenvolvimento (`docs/`, `tools/`, `scratch/`, `referencia/`,
  `registro-software/`, testes e instruções do repositório) não são publicados
  no portal.
- O código do jogo foi mantido sem adaptações locais para permitir atualizações
  diretas a partir do repositório.
- Capa do portal: `public/capas/ilha-do-conhecimento.webp`, criada com geração
  de imagem a partir da tela inicial real e convertida para WebP 1200 × 675.

## Robô Ritimado

- Integração inicial: 11 de novembro de 2026.
- Versão integrada: 0.15.1.
- Arquivos publicados: `index.html`, CSS, JavaScript e a pasta `assets/` com
  imagens, animações e áudio necessários para executar o jogo.
- Relatórios de validação, documentos de pontuação, arquivos de instrução e o
  inicializador para Windows não são publicados no portal.
- Chaves de progresso preservadas: `robo-ritmado-best-v04`, `rr-worlds-v07`
  e `robo-ritmado-toys-unlocked`.
- O código do jogo foi mantido sem adaptações locais para permitir atualizações
  diretas a partir do repositório.
- Capa do portal: `public/capas/robo-ritmado.webp`, criada com geração de imagem
  a partir da tela inicial real e convertida para WebP 1200 × 675.

## Sinfonia dos Cristais

- Integração inicial: 11 de novembro de 2026.
- Versão integrada: 1.1.0.
- Arquivos publicados a partir do build oficial: `index.html`, `assets/`, `css/`,
  `data/` e `js/`.
- Dependências, testes, scripts, documentação e demais materiais de
  desenvolvimento não são publicados no portal.
- Chave de progresso preservada: `crystal-campaign-v4`.
- O código do jogo foi mantido sem adaptações locais para permitir atualizações
  diretas a partir do repositório.
- Capa do portal: `public/capas/sinfonia-dos-cristais.webp`, criada com geração
  de imagem a partir da tela inicial real e convertida para WebP 1200 × 675.

## RocketBloom

- Integração inicial: 11 de novembro de 2026.
- Versão integrada: 0.1.0.
- Build do Vite gerado com `--base /2026.2/RocketBloom/`, sem alterar os
  arquivos-fonte do repositório.
- Arquivos de desenvolvimento, testes, documentação e dependências não são
  publicados no portal.
- Chave de progresso preservada: `rocketbloom.progress.v1`.
- Na integração, 161 dos 162 testes passaram. O teste upstream “desafio especial
  pausa a aventura, dá recompensa no acerto e não pune o erro” falhou de forma
  reproduzível ao acessar um resultado nulo; o jogo e o build abriram normalmente.
- Capa do portal: `public/capas/rocketbloom.webp`, criada com geração de imagem
  a partir da tela inicial real e convertida para WebP 1200 × 675.

## Guardião da Natureza

- Integração inicial: 11 de novembro de 2026.
- Versão declarada no repositório: 0.1.0.
- Build obtido do artefato `github-pages` do workflow oficial concluído com
  sucesso para o commit integrado.
- Somente os 276 arquivos publicados no artefato foram copiados; histórico,
  versões arquivadas, ferramentas e materiais de desenvolvimento ficaram fora.
- Chave principal de progresso preservada: `guardiao.mapa.progresso.v1`.
- O código do jogo foi mantido sem adaptações locais para permitir atualizações
  diretas a partir de novos artefatos do repositório.
- Capa do portal: `public/capas/guardiao-da-natureza.webp`, criada com geração
  de imagem a partir da tela inicial real e convertida para WebP 1200 × 675.
