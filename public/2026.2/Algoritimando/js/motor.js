/* ============================================================
   motor.js — modelo de dados e motor de validação
   (sem interface: teste no console com `node motor.js`
    ou colando o arquivo no console do navegador)
   ============================================================ */

'use strict';

/* ============================================================
   1. FORMATO DA SITUAÇÃO

   Uma SITUAÇÃO é um tema completo (ex.: "Fazer um sanduíche")
   dividido em FASES. Cada fase tem uma lista de PASSOS.

   Cada passo DECLARA de quais outros passos ele depende (dependeDe).
   A validação é feita sobre esse grafo, não sobre a posição: passos
   que não dependem um do outro podem vir em qualquer ordem, e cada
   dependência quebrada vira uma explicação para a criança.

   O professor não escreve grafo nenhum: na Área do professor ele
   lista os passos na ordem certa e marca, em cada um, "antes deste
   passo, precisa ter acontecido:" — e o editor grava o dependeDe.

   Formato:

   {
     "formato": "passo-a-passo/1",
     "id": "sanduiche",
     "titulo": "Fazer um sanduíche",
     "fases": [
       {
         "id": "fase-1",
         "titulo": "Monte o sanduíche na ordem certa!",
         "passos": [
           { "id": "pao",      "texto": "Pegue o pão.",             "dependeDe": [] },
           { "id": "manteiga", "texto": "Pegue a manteiga.",        "dependeDe": [] },
           { "id": "passar",   "texto": "Passe a manteiga no pão.", "dependeDe": ["pao", "manteiga"] }
         ]
       }
     ]
   }

   Leitura em voz alta do exemplo acima:
   "Pegue o pão. Pegue a manteiga — tanto faz qual dos dois vem
    primeiro (nenhum depende do outro). Depois dos dois, passe a
    manteiga."

   Campos opcionais da SITUAÇÃO inteira (além de formato, id,
   titulo e fases):
     cena        ilustração do chamado no cartão da central (o
                 sanduíche, a caixa, a mochila, o favo)
     local       onde o chamado acontece ("Cozinha"), mostrado no
                 cartão da central de chamados
     area        o lugar do mapa da cidade onde o chamado fica
                 ("casa", "escola", "fabrica", "jardim", "faixa", "casa-azul", "limonada"); um lugar
                 junta vários chamados do mesmo cliente
     cor         cor do título da fase e do cartão na central
     cliente     retrato de quem fez o chamado (círculo do cartão)
     fundo       ilustração de fundo da tela da fase
     fundoConclusao  ilustração da tela de lição (fase concluída)
     montagem    a imagem que se monta ao lado do tabuleiro,
                 conforme a criança coloca as cartas:
                 "pilha"   — cada passo com "peca" põe a sua peça
                             em cima das anteriores, NA ORDEM DOS
                             ESPAÇOS (o sanduíche): fora de ordem, o
                             queijo aparece por cima do pão fechado;
                 "cena"    — cada passo com "peca" desenha a sua
                             peça num lugar fixo, por cima das
                             anteriores, na ordem dos espaços (a
                             mochila): fechar o estojo antes de
                             guardar o lápis deixa o lápis de fora;
                 "tirinha" — um quadrinho por espaço, como uma
                             história em quadrinhos; no primeiro
                             erro a história "trava" ali.
                 Sem o campo, não há montagem.
     selo        o selo da ideia que o chamado ensina, entregue na
                 lição da última fase e guardado no crachá:
                 { nome, frase, exemplo (a legenda de uma carta do
                   chamado), pergunta (para conversar), icone
                   ("repetir", "decidir", "juntar" ou "par": o
                   desenho usado enquanto não há imagem) e imagem }
     montagemBase  (só na "cena") imagem que fica no fundo antes de
                 qualquer peça. A fase pode ter a sua própria, que
                 vale no lugar desta.
   Todos são só aparência: sem eles o jogo usa um visual padrão,
   e nenhum deles muda a validação.

   Campos de cada passo:
     id         identificador único dentro da fase
     texto      legenda da carta
     imagem     ilustração da carta (caminho "img/..." ou data:).
                Enquanto o arquivo não existe (ou não carrega), a
                carta mostra o quadro "ilustração do passo".
     dependeDe  ids dos passos DESTA fase que precisam vir antes
                deste. [] = pode ser um dos primeiros. A ordem da
                lista de passos é a ordem que o professor escreveu
                (a dica segue essa ordem), mas quem decide o que é
                certo é o dependeDe.
     peca       (opcional) imagem que o passo acrescenta à montagem:
                na pilha, uma camada recortada (fundo transparente,
                todas com a mesma largura); na cena, a peça já no
                seu lugar, numa imagem do mesmo tamanho da base
                (fundo transparente); na tirinha, o quadrinho
                do passo (sem ela, a tirinha usa a "imagem").
     ordemLivre (formato antigo, do protótipo) — só é lido quando o
                passo não traz dependeDe; ver a seção 2.
     explicacao (opcional) — texto mostrado quando este passo é
                colocado antes de um pré-requisito dele. Duas formas:
                - uma string única, usada seja qual for o
                  pré-requisito violado;
                - um objeto { idDoPreRequisito: texto, ... }, com
                  "*" como texto reserva para os ids não listados.
                Assim CADA REGRA DE DEPENDÊNCIA CARREGA SEU PRÓPRIO
                TEXTO: quem escreve a situação escreve também a
                explicação, e o código do jogo não conhece frase
                nenhuma sobre sanduíche, escova de dente etc.
                Sem o campo, o motor monta uma frase genérica.

   Campos opcionais de cada FASE (além de id, titulo e passos):
     instrucao  frase curta mostrada sob o título da fase
     mascote    fala do Robô-guia enquanto a fase é jogada. Sem o
                campo, ele diz a frase padrão do jogo. É a fase que
                dá a deixa: aqui o robô fala do que ESTA fase tem
                de novo. Quando a criança
                erra, a explicação do erro toma o balão; corrigido
                o erro, esta frase volta.
     licao      conteúdo da tela de conclusão da fase, mostrada
                quando o tabuleiro fica completo sem erro:
                {
                  pergunta:   título da lição, em forma de pergunta
                  texto:      2 ou 3 frases curtas (string única ou
                              array de strings — cada uma vira um
                              parágrafo)
                  reflexao:   [pergunta, pergunta] — para a criança
                              pensar ou conversar com o professor;
                              não há campo de resposta
                }
                Como a explicacao dos passos, a licao mora nos
                DADOS: a tela de conclusão (conclusao.js) só lê
                daqui, e o código do jogo não conhece frase nenhuma
                sobre sanduíche, escova de dente etc.
   ============================================================ */

/* ============================================================
   2. O GRAFO DE DEPENDÊNCIAS

   Vem direto do dependeDe de cada passo. Ids que não existem na
   fase (arquivo mexido à mão) e o próprio passo são ignorados.

   Basta ligar cada passo aos seus pré-requisitos DIRETOS: se A vem
   antes de B e B antes de C, então A vem antes de C — e qualquer
   sequência que desrespeite isso quebra pelo menos um elo direto,
   que a validação encontra.

   Arquivos antigos (do protótipo) não têm dependeDe: neles, a
   marcação ordemLivre corta a lista do professor em CAMADAS — um
   passo sem a marcação abre uma camada nova, um passo com ela entra
   na camada do anterior — e cada passo depende de todos os passos
   da camada anterior. Esse modelo antigo criava dependências que
   não existem (ex.: "abrir a garra" antes de "andar"), por isso os
   chamados do jogo e o editor usam o dependeDe.
   ============================================================ */

/**
 * Corta a lista ordenada do professor em camadas.
 * Devolve um array de arrays de passos.
 */
function agruparEmCamadas(passos) {
  const camadas = [];
  for (const passo of passos) {
    if (passo.ordemLivre && camadas.length > 0) {
      // junta-se à camada do passo anterior
      camadas[camadas.length - 1].push(passo);
    } else {
      // abre uma camada nova
      camadas.push([passo]);
    }
  }
  return camadas;
}

/**
 * O grafo de dependências de uma fase.
 *
 * Devolve um objeto no formato:
 *   { idDoPasso: [ids dos passos de que ele depende], ... }
 *
 * Exemplo (sanduíche):
 *   { pao: [], manteiga: [], passar: ["pao", "manteiga"] }
 */
function derivarDependencias(passos) {
  const ids = new Set(passos.map(p => p.id));
  const dependencias = {};

  // formato antigo: só para os passos que não declaram dependeDe
  const camadas = agruparEmCamadas(passos);
  camadas.forEach((camada, i) => {
    const anterior = i === 0 ? [] : camadas[i - 1].map(p => p.id);
    for (const passo of camada) dependencias[passo.id] = anterior.slice();
  });

  for (const passo of passos) {
    if (Array.isArray(passo.dependeDe)) {
      dependencias[passo.id] = [...new Set(passo.dependeDe)]
        .filter(id => id !== passo.id && ids.has(id));
    }
  }

  return dependencias;
}

/* ============================================================
   3. VALIDAÇÃO DA SEQUÊNCIA MONTADA PELA CRIANÇA

   Entrada:
     fase       objeto da fase (com .passos)
     sequencia  array com um item por espaço do tabuleiro, na
                ordem: o id do passo colocado, ou null se o
                espaço está vazio.

   IMPORTANTE: a validação NUNCA compara a posição da carta com a
   posição na lista original do professor. Ela só pergunta, para
   cada carta colocada: "os pré-requisitos dela estão antes dela?"
   É por isso que uma ordem alternativa válida (trocar dois passos
   da mesma camada) é ACEITA — não existe sequência decorada,
   existe lógica de dependência.

   Saída:
     {
       ok:       true se nenhum problema foi encontrado até aqui,
       completa: true se todos os espaços estão preenchidos,
       erro:     null, ou o PRIMEIRO problema encontrado:
         {
           tipo:         "pre-requisito-depois" | "sem-espaco-antes"
                         | "passo-desconhecido" | "passo-repetido",
           indice:       posição (começando em 0) do passo com problema,
           passo:        o passo mal colocado,
           preRequisito: o passo que precisava vir antes (quando houver),
           mensagem:     explicação pronta em português
         }
     }

   Tipos de problema:
     "pre-requisito-depois"  o pré-requisito foi colocado DEPOIS
     "sem-espaco-antes"      o pré-requisito ainda não foi colocado
                             e não sobrou nenhum espaço vazio antes
                             (logo é impossível consertar sem mover
                             esta carta)
   Se o pré-requisito ainda não foi colocado mas AINDA HÁ espaço
   vazio antes, não é erro: a criança ainda pode completar.
   ============================================================ */

/**
 * Texto da regra de dependência violada, vindo DOS DADOS da fase.
 * Devolve null quando o passo não traz texto próprio — aí a
 * validação usa a frase genérica montada pelo motor.
 */
function textoDaRegra(passo, preRequisito) {
  const e = passo.explicacao;
  if (!e) return null;
  if (typeof e === 'string') return e;
  return e[preRequisito.id] || e['*'] || null;
}

function validarSequencia(fase, sequencia) {
  const dependencias = derivarDependencias(fase.passos);
  const porId = {};
  fase.passos.forEach(p => { porId[p.id] = p; });

  // posição de cada passo já colocado
  const posicao = {};
  for (let i = 0; i < sequencia.length; i++) {
    const id = sequencia[i];
    if (id === null || id === undefined) continue;

    if (!porId[id]) {
      return resultado(false, sequencia, {
        tipo: 'passo-desconhecido', indice: i, passo: { id }, preRequisito: null,
        mensagem: `O id "${id}" não existe nesta fase.`,
      });
    }
    if (posicao[id] !== undefined) {
      return resultado(false, sequencia, {
        tipo: 'passo-repetido', indice: i, passo: porId[id], preRequisito: null,
        mensagem: `O passo "${porId[id].texto}" aparece duas vezes.`,
      });
    }
    posicao[id] = i;
  }

  // percorre da esquerda para a direita e devolve o PRIMEIRO problema
  for (let i = 0; i < sequencia.length; i++) {
    const id = sequencia[i];
    if (id === null || id === undefined) continue;
    const passo = porId[id];

    for (const idPre of dependencias[id]) {
      const preRequisito = porId[idPre];
      const j = posicao[idPre];

      if (j !== undefined && j > i) {
        return resultado(false, sequencia, {
          tipo: 'pre-requisito-depois', indice: i, passo, preRequisito,
          mensagem: textoDaRegra(passo, preRequisito) ||
                    `"${passo.texto}" precisa vir depois de "${preRequisito.texto}", ` +
                    `mas "${preRequisito.texto}" está mais para o fim.`,
        });
      }

      if (j === undefined) {
        const vaziosAntes = sequencia.slice(0, i)
          .filter(x => x === null || x === undefined).length;
        if (vaziosAntes === 0) {
          return resultado(false, sequencia, {
            tipo: 'sem-espaco-antes', indice: i, passo, preRequisito,
            mensagem: textoDaRegra(passo, preRequisito) ||
                      `"${passo.texto}" precisa vir depois de "${preRequisito.texto}", ` +
                      `mas não sobrou nenhum espaço vazio antes dele.`,
          });
        }
        // pré-requisito ausente COM espaço antes: ainda dá para
        // completar — não é erro.
      }
    }
  }

  return resultado(true, sequencia, null);
}

function resultado(ok, sequencia, erro) {
  return {
    ok,
    completa: sequencia.every(x => x !== null && x !== undefined),
    erro,
  };
}

/* ============================================================
   4. TESTES — rodam sozinhos no console
   ============================================================ */

const SITUACAO_EXEMPLO = {
  formato: 'passo-a-passo/1',
  id: 'sanduiche',
  titulo: 'Fazer um sanduíche',
  fases: [
    {
      id: 'fase-1',
      titulo: 'Monte o sanduíche na ordem certa!',
      passos: [
        { id: 'pao',      texto: 'Pegue o pão.',      dependeDe: [] },
        { id: 'manteiga', texto: 'Pegue a manteiga.', dependeDe: [] },
        {
          id: 'passar', texto: 'Passe a manteiga no pão.', dependeDe: ['pao', 'manteiga'],
          explicacao: {
            pao:      'A manteiga precisa do pão já na mesa. Do jeito que está, não tem onde passar!',
            manteiga: 'Para passar a manteiga, ela precisa estar na mesa. Do jeito que está, a faca vai raspar o ar!',
          },
        },
        {
          id: 'queijo', texto: 'Coloque o queijo.', dependeDe: ['passar'],
          explicacao: 'O queijo vai por cima da manteiga. Do jeito que está, ele cai no pão ainda seco!',
        },
        {
          id: 'presunto', texto: 'Coloque o presunto.', dependeDe: ['passar'],
          explicacao: 'O presunto vai por cima da manteiga. Do jeito que está, ele cai no pão ainda seco!',
        },
        {
          id: 'fechar', texto: 'Feche o sanduíche.', dependeDe: ['queijo', 'presunto'],
          explicacao: {
            queijo:   'Para fechar o sanduíche, o queijo já precisa estar dentro. Fechando agora, ele fica de fora!',
            presunto: 'Para fechar o sanduíche, o presunto já precisa estar dentro. Fechando agora, ele fica de fora!',
          },
        },
      ],
    },
  ],
};

function rodarTestes() {
  const fase = SITUACAO_EXEMPLO.fases[0];
  let passou = 0, falhou = 0;

  function teste(nome, sequencia, esperado, outraFase) {
    const r = validarSequencia(outraFase || fase, sequencia);
    const obtido = {
      ok: r.ok,
      completa: r.completa,
      tipoErro: r.erro ? r.erro.tipo : null,
      passo: r.erro ? r.erro.passo.id : null,
      preRequisito: r.erro && r.erro.preRequisito ? r.erro.preRequisito.id : null,
    };
    const deuCerto = JSON.stringify(obtido) === JSON.stringify(esperado);
    if (deuCerto) passou++; else falhou++;

    console.log(`\n${deuCerto ? 'PASSOU' : 'FALHOU'} — ${nome}`);
    console.log('  sequência:', JSON.stringify(sequencia));
    console.log('  esperava :', JSON.stringify(esperado));
    console.log('  obteve   :', JSON.stringify(obtido));
    if (r.erro) console.log('  mensagem :', r.erro.mensagem);
  }

  console.log('=== Grafo de dependências ===');
  console.log(derivarDependencias(fase.passos));

  teste(
    'sequência correta (a ordem original do professor)',
    ['pao', 'manteiga', 'passar', 'queijo', 'presunto', 'fechar'],
    { ok: true, completa: true, tipoErro: null, passo: null, preRequisito: null },
  );

  teste(
    'pré-requisito violado (passar a manteiga antes de pegar a manteiga)',
    ['pao', 'passar', 'manteiga', 'queijo', 'presunto', 'fechar'],
    { ok: false, completa: true, tipoErro: 'pre-requisito-depois', passo: 'passar', preRequisito: 'manteiga' },
  );

  teste(
    'ordem alternativa VÁLIDA (manteiga antes do pão, presunto antes do queijo) — deve ser ACEITA',
    ['manteiga', 'pao', 'passar', 'presunto', 'queijo', 'fechar'],
    { ok: true, completa: true, tipoErro: null, passo: null, preRequisito: null },
  );

  teste(
    'sequência incompleta sem nenhuma violação (ainda dá para completar)',
    ['manteiga', null, 'passar', null, null, null],
    { ok: true, completa: false, tipoErro: null, passo: null, preRequisito: null },
  );

  teste(
    'sequência incompleta JÁ impossível (queijo no primeiro espaço: não sobrou espaço antes para o pré-requisito)',
    ['queijo', null, null, null, null, null],
    { ok: false, completa: false, tipoErro: 'sem-espaco-antes', passo: 'queijo', preRequisito: 'passar' },
  );

  // o robô: abrir a garra só precisa vir antes de FECHAR a garra,
  // não antes de andar (era a dependência falsa do modelo antigo)
  const robo = { passos: [
    { id: 'virar', texto: 'Vire o robô.', dependeDe: [] },
    { id: 'abrir', texto: 'Abra a garra.', dependeDe: [] },
    { id: 'andar', texto: 'Ande até o cubo.', dependeDe: ['virar'] },
    { id: 'fechar', texto: 'Feche a garra.', dependeDe: ['andar', 'abrir'] },
  ] };
  teste(
    'dependência declarada: andar ANTES de abrir a garra é aceito',
    ['virar', 'andar', 'abrir', 'fechar'],
    { ok: true, completa: true, tipoErro: null, passo: null, preRequisito: null },
    robo,
  );
  teste(
    'dependência declarada: fechar antes de abrir a garra é erro',
    ['virar', 'andar', 'fechar', 'abrir'],
    { ok: false, completa: true, tipoErro: 'pre-requisito-depois', passo: 'fechar', preRequisito: 'abrir' },
    robo,
  );

  // arquivo antigo, sem dependeDe: as camadas do ordemLivre valem
  const antigo = { passos: [
    { id: 'a', texto: 'A' },
    { id: 'b', texto: 'B', ordemLivre: true },
    { id: 'c', texto: 'C' },
  ] };
  teste(
    'formato antigo (ordemLivre): A e B trocam de lugar',
    ['b', 'a', 'c'],
    { ok: true, completa: true, tipoErro: null, passo: null, preRequisito: null },
    antigo,
  );
  teste(
    'formato antigo (ordemLivre): C antes de B é erro',
    ['a', 'c', 'b'],
    { ok: false, completa: true, tipoErro: 'pre-requisito-depois', passo: 'c', preRequisito: 'b' },
    antigo,
  );

  console.log(`\n=== Resultado: ${passou} passou(aram), ${falhou} falhou(aram) ===`);
}

// Os testes rodam sozinhos no Node e na página de teste; na página
// do jogo (que tem tabuleiro) o motor fica em silêncio.
if (typeof document === 'undefined' || !document.querySelector('.tabuleiro')) {
  rodarTestes();
}
