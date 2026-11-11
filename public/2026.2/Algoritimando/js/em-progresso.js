/* ============================================================
   em-progresso.js — protótipos de chamados novos.

   Ficam na seção "Em progresso" da central, atrás de senha, para
   testar a base dos níveis (passos, dependências, explicações e
   lição) ANTES de fazer as imagens. O formato é EXATAMENTE o dos
   chamados do jogo (situacoes.js) e do .json do professor: quando
   um protótipo ficar bom, ele só muda de arquivo.

   As imagens apontam para os nomes que elas vão ter
   (img/passos/<chamado>-NN.webp, img/licoes/<chamado>-N.webp).
   Enquanto não existem, a carta mostra "ilustração do passo".

   O progresso destes chamados é guardado à parte (chave "prof:"):
   não soma estrelas, não conta como chamado concluído e não
   leva à promoção.

   Quatro protótipos já viraram chamados do jogo (lavar as mãos,
   atravessar a rua, fazer uma limonada e escovar os dentes: ver
   situacoes.js). O que ficou aqui espera ajuste; o que falta está
   em docs/revisao-chamados-novos.md:
     planta    — passos escondidos (ideia repetida; a lição de
                 "esperar" não tem carta)
   ============================================================ */

'use strict';

/* ================= PLANTAR UMA SEMENTE ================= */

const PROTO_PLANTA = {
  formato: 'passo-a-passo/1',
  id: 'planta',
  titulo: 'Plantar uma semente',
  local: 'Horta',
  area: 'jardim',
  cor: '#5f8f3a',
  montagem: 'tirinha',
  fases: [
    {
      id: 'fase-1',
      titulo: 'Vamos plantar!',
      instrucao: 'Arraste as cartas para os espaços — ou toque na carta e depois no espaço.',
      mascote: 'A semente precisa de uma casa antes de ganhar água.',
      passos: [
        { id: 'terra', texto: 'Coloque terra no vaso.', imagem: 'img/passos/planta-02.webp', dependeDe: [] },
        {
          id: 'semente', texto: 'Coloque a semente na terra.', imagem: 'img/passos/planta-04.webp', dependeDe: ['terra'],
          explicacao: 'Semente num vaso vazio não tem onde crescer. Coloque a terra primeiro!',
        },
        {
          id: 'regar', texto: 'Regue a terra.', imagem: 'img/passos/planta-06.webp', dependeDe: ['semente'],
          explicacao: 'Regar agora molha só a terra: a semente ainda nem foi plantada!',
        },
      ],
      licao: {
        pergunta: 'O que a semente precisa primeiro?',
        imagem: 'img/licoes/planta-1.webp',
        texto: [
          'A semente precisa de terra para ficar, e depois de água para crescer.',
          'Cada passo deixa tudo pronto para o próximo.',
        ],
        reflexao: [
          'O que aconteceria com a semente sem terra?',
          'E sem água?',
        ],
      },
    },
    {
      id: 'fase-2',
      titulo: 'A semente precisa ficar coberta!',
      instrucao: 'Tem passos que a gente esquece porque são pequenos. Encontre todos!',
      mascote: 'Semente em cima da terra fica no sol e os passarinhos comem. O que falta?',
      passos: [
        { id: 'vaso', texto: 'Pegue um vaso.', imagem: 'img/passos/planta-01.webp', dependeDe: [] },
        {
          id: 'terra', texto: 'Coloque terra no vaso.', imagem: 'img/passos/planta-02.webp', dependeDe: ['vaso'],
          explicacao: 'Terra onde? O vaso ainda não está aqui. Pegue o vaso primeiro!',
        },
        {
          id: 'buraco', texto: 'Faça um buraquinho na terra.', imagem: 'img/passos/planta-03.webp', dependeDe: ['terra'],
          explicacao: 'Buraquinho em quê? Ainda não tem terra no vaso!',
        },
        {
          id: 'semente', texto: 'Coloque a semente no buraquinho.', imagem: 'img/passos/planta-04.webp', dependeDe: ['buraco'],
          explicacao: 'Sem o buraquinho, a semente fica por cima da terra. Faça o buraquinho antes!',
        },
        {
          id: 'cobrir', texto: 'Cubra a semente com terra.', imagem: 'img/passos/planta-05.webp', dependeDe: ['semente'],
          explicacao: 'Cobrir o quê? A semente ainda não está no buraquinho!',
        },
      ],
      licao: {
        pergunta: 'Cadê os passos escondidos?',
        imagem: 'img/licoes/planta-2.webp',
        texto: [
          'Fazer o buraquinho e cobrir a semente são passos pequenos — e fáceis de esquecer.',
          'Quando a gente explica para alguém, precisa contar até os passos pequenos. Senão, a semente fica de fora!',
        ],
        reflexao: [
          'Qual passo você teria esquecido se fosse explicar sem as cartas?',
          'Por que a semente precisa ficar coberta?',
        ],
      },
    },
    {
      id: 'fase-3',
      titulo: 'Cuide da plantinha!',
      instrucao: 'Depois de plantar, a semente precisa de água e de luz.',
      mascote: 'Regar e levar para o sol: tanto faz qual vem antes. Mas só depois de cobrir!',
      passos: [
        { id: 'vaso', texto: 'Pegue um vaso.', imagem: 'img/passos/planta-01.webp', dependeDe: [] },
        {
          id: 'terra', texto: 'Coloque terra no vaso.', imagem: 'img/passos/planta-02.webp', dependeDe: ['vaso'],
          explicacao: 'Terra onde? O vaso ainda não está aqui. Pegue o vaso primeiro!',
        },
        {
          id: 'buraco', texto: 'Faça um buraquinho na terra.', imagem: 'img/passos/planta-03.webp', dependeDe: ['terra'],
          explicacao: 'Buraquinho em quê? Ainda não tem terra no vaso!',
        },
        {
          id: 'semente', texto: 'Coloque a semente no buraquinho.', imagem: 'img/passos/planta-04.webp', dependeDe: ['buraco'],
          explicacao: 'Sem o buraquinho, a semente fica por cima da terra. Faça o buraquinho antes!',
        },
        {
          id: 'cobrir', texto: 'Cubra a semente com terra.', imagem: 'img/passos/planta-05.webp', dependeDe: ['semente'],
          explicacao: 'Cobrir o quê? A semente ainda não está no buraquinho!',
        },
        {
          id: 'regar', texto: 'Regue a terra.', imagem: 'img/passos/planta-06.webp', dependeDe: ['cobrir'],
          explicacao: 'Regar com a semente descoberta? A água pode levar a semente embora! Cubra antes.',
        },
        {
          id: 'sol', texto: 'Coloque o vaso perto da janela.', imagem: 'img/passos/planta-07.webp', dependeDe: ['cobrir'],
          explicacao: 'Levar o vaso agora? A semente ainda não foi plantada!',
        },
      ],
      licao: {
        pergunta: 'O algoritmo acaba quando a gente para?',
        imagem: 'img/licoes/planta-3.webp',
        texto: [
          'Plantar termina com água e luz — e depois a semente trabalha sozinha por alguns dias.',
          'Alguns algoritmos têm um passo de esperar. Esperar também faz parte!',
        ],
        reflexao: [
          'Quantos dias você acha que a semente leva para brotar?',
          'O que precisa ser repetido todos os dias para a planta crescer?',
        ],
      },
    },
  ],
};

const SITUACOES_EM_PROGRESSO = [PROTO_PLANTA];
