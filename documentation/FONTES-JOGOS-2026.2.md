# Fontes dos jogos da turma 2026.2

Este arquivo registra de onde veio cada jogo estático anexado ao portal. Antes
de atualizar um jogo, compare o `commit integrado` com a ponta da branch
registrada e preserve adaptações que existam apenas no portal.

| Jogo | Repositório | Branch | Commit integrado | Destino no portal | Adaptações locais |
|---|---|---|---|---|---|
| Algoritimando | `https://github.com/helder41/Algoritimando-1` | `main` | `85f881ebbbc3855fea67f1c3e4cd622d5d8b8f1c` | `public/2026.2/Algoritimando/` | Progresso adaptado pelo catálogo; capa criada para o portal. |
| Ilha do Conhecimento | `https://github.com/danielpsts07/Ilha-do-Conhecimento` | `main` | `35d5048d357895da3058313b11a9dc62806873ab` | `public/2026.2/IlhaDoConhecimento/` | Sem alteração no código do jogo; capa criada para o portal. |
| Robô Ritimado | `https://github.com/asethrya/robo-ritmado` | `main` | `069bc47d044a27b7faeea738f3a6dffd9dcfa887` | `public/2026.2/RoboRitimado/` | Progresso adaptado pelo catálogo; capa criada para o portal. |
| Sinfonia dos Cristais | `https://github.com/Italoviski/Sinfonia-dos-Cristais` | `main` | `96074336e2599ad5c26e25e4464379fba40d12ed` | `public/2026.2/SinfoniaDosCristais/` | Progresso adaptado pelo catálogo; capa criada para o portal. |
| RocketBloom | `https://github.com/sm64isdabest/RocketBloom` | `main` | `186bfa5ad981f27f042e2d7850d476ce6e38ecfc` | `public/2026.2/RocketBloom/` | Build com base do portal; progresso adaptado pelo catálogo; capa criada para o portal. |
| Guardião da Natureza | `https://github.com/iuribrns/GUARDIAO_DA_NATUREZA` | `main` | `af460cbe72b50d0a2070b5f17864958c1700c9f4` | `public/2026.2/GuardiaoDaNatureza/` | Artefato oficial do GitHub Actions; progresso adaptado pelo catálogo; capa criada para o portal. |

## Algoritimando

- Integração inicial: 11 de novembro de 2026.
- Atualizado em 18 de novembro de 2026 (13 commits: tela cheia, desenho para
  celular deitado, botão Configurações e correções da revisão geral).
- Arquivos publicados: `index.html`, `editor.html`, CSS, JavaScript, fontes,
  imagens, áudio e licença MIT.
- Materiais de desenvolvimento (`docs/`, relatórios e arquivos de prompts) não
  são publicados no portal.
- Chaves de progresso preservadas por perfil:
  `algoritimando-progresso` e `algoritimando-perfil`.
- A chave `algoritimando-segredo` (agente secreto, criada na atualização de
  18/11) não é exibida na ficha do portal para não revelar o segredo.
- Capa do portal: `public/capas/algoritimando.webp`, criada com geração de
  imagem a partir da tela inicial real e convertida para WebP 1200 × 675.

## Ilha do Conhecimento

- Integração inicial: 11 de novembro de 2026.
- Atualizado em 18 de novembro de 2026 (organização e limpeza do código: dados
  e introdução passaram para dentro de `assets/`).
- Arquivos publicados: `index.html`, `assets/`, `css/` e `js/`.
- Materiais de desenvolvimento (`docs/`, `tools/`, `tests/`,
  `assets/ferramentas-sprites/`, `package-lock.json` e instruções do
  repositório) não são publicados no portal.
- O código referencia alguns arquivos que não existem no repositório (por
  exemplo `assets/audio/intro.mp3` e `assets/final/cadeado-cinza.png`). Isso já
  acontecia na integração inicial, e o jogo usa alternativas.
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
- Atualizado em 18 de novembro de 2026 (7 commits: habilidades dos cristais,
  novos tutoriais, menu de fases no celular e Modo Livre).
- Versão integrada: 1.1.0.
- O Modo Livre (God Mode), nas configurações, libera todas as fases para
  escolha, mas não marca fases como concluídas nem altera o progresso salvo.
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
- Atualizado em 18 de novembro de 2026 (escala da tela, alertas de colisão,
  lasers de resposta e novos aviões da Terra). Nessa atualização, os 172
  testes passaram.
- Versão integrada: 0.1.0.
- Build do Vite gerado com `--base /2026.2/RocketBloom/`, sem alterar os
  arquivos-fonte do repositório. No Git Bash do Windows, rode com
  `MSYS_NO_PATHCONV=1`, senão o caminho é convertido para uma pasta do Windows.
- Arquivos de desenvolvimento, testes, documentação e dependências não são
  publicados no portal.
- Chave de progresso preservada: `rocketbloom.progress.v1`.
- Na integração inicial, 161 dos 162 testes passaram. O teste upstream “desafio especial
  pausa a aventura, dá recompensa no acerto e não pune o erro” falhou de forma
  reproduzível ao acessar um resultado nulo; o jogo e o build abriram normalmente.
- Capa do portal: `public/capas/rocketbloom.webp`, criada com geração de imagem
  a partir da tela inicial real e convertida para WebP 1200 × 675.

## Guardião da Natureza

- Integração inicial: 11 de novembro de 2026.
- Atualizado em 18 de novembro de 2026 (11 commits: mapas ilustrados,
  restauração da ilha por fase, poses de Kai e Flora, nado e coleta no rio).
- Versão declarada no repositório: 0.1.0.
- Build obtido do artefato `github-pages` do workflow oficial concluído com
  sucesso para o commit integrado.
- Somente os arquivos publicados no artefato foram copiados (276 na
  integração inicial, 335 na atualização de 18/11); histórico,
  versões arquivadas, ferramentas e materiais de desenvolvimento ficaram fora.
- Chave principal de progresso preservada: `guardiao.mapa.progresso.v1`.
- O código do jogo foi mantido sem adaptações locais para permitir atualizações
  diretas a partir de novos artefatos do repositório.
- Capa do portal: `public/capas/guardiao-da-natureza.webp`, criada com geração
  de imagem a partir da tela inicial real e convertida para WebP 1200 × 675.
