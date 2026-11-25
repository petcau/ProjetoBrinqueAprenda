# Fontes dos jogos da turma 2026.2

Este arquivo registra de onde veio cada jogo estático anexado ao portal. Antes
de atualizar um jogo, compare o `commit integrado` com a ponta da branch
registrada e preserve adaptações que existam apenas no portal.

| Jogo | Repositório | Branch | Commit integrado | Destino no portal | Adaptações locais |
|---|---|---|---|---|---|
| Algoritimando | `https://github.com/helder41/Algoritimando-1` | `main` | `d330653080b3b6ae2c5ec2f9333546f1482c7dc4` | `public/2026.2/Algoritimando/` | Progresso adaptado pelo catálogo; capa criada para o portal. |
| Ilha do Conhecimento | `https://github.com/danielpsts07/Ilha-do-Conhecimento` | `main` | `3c16b61ed6512143967821d2a1c37f73d29b2de8` | `public/2026.2/IlhaDoConhecimento/` | Sem alteração no código do jogo; capa criada para o portal. |
| Robô Ritimado | `https://github.com/asethrya/robo-ritmado` | `main` | `91cb9f5507da562ef2c3f0300de75ee04303f1f1` | `public/2026.2/RoboRitimado/` | Progresso adaptado pelo catálogo; capa criada para o portal. |
| Sinfonia dos Cristais | `https://github.com/Italoviski/Sinfonia-dos-Cristais` | `main` | `223e061feb62a1e858db66180c862bcd2ecde370` | `public/2026.2/SinfoniaDosCristais/` | Progresso adaptado pelo catálogo; capa criada para o portal. |
| RocketBloom | `https://github.com/sm64isdabest/RocketBloom` | `main` | `68bcef4becacb6a96989746a3fab90cebd50d852` | `public/2026.2/RocketBloom/` | Build com base do portal; progresso adaptado pelo catálogo; capa criada para o portal. |
| Guardião da Natureza | `https://github.com/iuribrns/GUARDIAO_DA_NATUREZA` | `main` | `c79728ac87a16e869c2b19b6eebabed6790cf20b` | `public/2026.2/GuardiaoDaNatureza/` | Artefato oficial do GitHub Actions; progresso adaptado pelo catálogo; capa criada para o portal. |

## Algoritimando

- Integração inicial: 11 de novembro de 2026.
- Atualizado em 18 de novembro de 2026 (13 commits: tela cheia, desenho para
  celular deitado, botão Configurações e correções da revisão geral).
- Atualizado em 25 de novembro de 2026 (70 commits: animação final, álbum de
  figurinhas, certificado para imprimir, novas montagens com bancada, opção
  "Cartas no lugar", "Meus aprendizados" e modo instalável/PWA).
- Arquivos publicados: `index.html`, `editor.html`, CSS, JavaScript, fontes,
  imagens, áudio, licença MIT e, desde 25/11, `manifest.webmanifest` e `sw.js`.
- O `sw.js` (modo offline) fica restrito a `/2026.2/Algoritimando/`, é
  versionado e busca a página pela rede primeiro, então não interfere no
  restante do portal. Dentro do iframe, a linha "Instalar o jogo" das
  Configurações normalmente fica oculta (o navegador só oferece instalação na
  página principal); no iPhone ela mostra a dica de "Adicionar à Tela de
  Início". Foi mantida sem adaptação para não alterar o código do jogo.
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
- Atualizado em 25 de novembro de 2026 (8 commits: tela de carregamento,
  "Sobre nós", créditos e ajustes nos puzzles da balança, geometria e
  operações).
- Arquivos publicados: `index.html`, `assets/`, `css/`, `data/` e `js/`.
- Correção em 25/11: a pasta `data/` (JSON de geometria, labirinto, álgebra,
  operações e final) é buscada pelo jogo quando aberto pelo site, mas tinha
  ficado de fora das integrações anteriores. Passou a ser publicada.
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
- Atualizado em 25 de novembro de 2026 (1 commit: interfaces refinadas, poses
  por mundo e carregamento da aventura). Os arquivos `GERACAO-*.md` de
  `assets/` (anotações de geração de arte) deixaram de ser publicados.
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
- Atualizado em 25 de novembro de 2026 (9 commits: habilidade "Voltar no
  Tempo", coreografia de vitória, menus por bioma, guia com treinos
  interativos, diálogos reescritos, ajustes de fases e nova introdução).
  Os arquivos foram copiados com `git archive` das mesmas pastas que o
  `scripts/build.mjs` copia, sem executar o script.
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
- Atualizado em 25 de novembro de 2026 (68 commits: seletor com ilhas dos
  planetas, novos cenários, modo infinito por planeta, cofre de ouro com metas
  globais, laboratório orbital redesenhado e remoção dos desafios especiais e
  dos diamantes). Nessa atualização, os 273 testes passaram. Como os diamantes
  saíram do jogo, a ficha do catálogo passou a mostrar "Moedas coletadas".
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
- Atualizado em 25 de novembro de 2026 (16 commits: kits ilustrados de
  painéis, mochila, HUD e conclusões, carregamento real das cinco fases,
  sementes nativas ameaçadas e cinemática final com créditos). O vídeo final
  (`jogo/viva/assets/cutscene-final-com-creditos.mp4`) tem cerca de 20 MB.
- Somente os arquivos publicados no artefato foram copiados (276 na
  integração inicial, 335 na atualização de 18/11, 469 na de 25/11); histórico,
  versões arquivadas, ferramentas e materiais de desenvolvimento ficaram fora.
- Chave principal de progresso preservada: `guardiao.mapa.progresso.v1`.
- O código do jogo foi mantido sem adaptações locais para permitir atualizações
  diretas a partir de novos artefatos do repositório.
- Capa do portal: `public/capas/guardiao-da-natureza.webp`, criada com geração
  de imagem a partir da tela inicial real e convertida para WebP 1200 × 675.
