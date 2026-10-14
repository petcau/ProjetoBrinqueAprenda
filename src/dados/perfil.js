// ============================================================================
//  PERFIS LOCAIS E PROGRESSO
// ============================================================================
//
//  Nao existe conta, servidor nem cadastro. Um perfil e so um apelido e um
//  bicho, guardados no navegador daquele computador.
//
//  Isso e deliberado, nao preguica. O publico do portal sao criancas, e a LGPD
//  trata dado de menor em artigo proprio: coletar exige consentimento especifico
//  dos responsaveis. Apelido inventado que nunca sai da maquina nao identifica
//  ninguem, e resolve o problema real — o laboratorio da escola, onde 30
//  criancas dividem 15 computadores e o progresso de uma aparecia para a outra.
//
//  O que NAO funciona, e e bom saber: nada disso atravessa para outro
//  computador nem para casa. Sem servidor, nao ha como. Se o tecnico limpar o
//  cache do navegador, some.
//
// ============================================================================

import { JOGOS } from './jogos.js';

const CHAVE_PERFIS = 'ba:perfis';
const CHAVE_ATIVO = 'ba:perfilAtivo';

export const AVATARES = [
  '🦊', '🐢', '🦉', '🐙', '🦋', '🐧',
  '🦁', '🐼', '🦄', '🐝', '🐬', '🦖',
];

// O portal e renderizado tambem fora do navegador nos testes, onde nao existe
// localStorage. Todo acesso passa por aqui.
const temArmazenamento = () => {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
};

function ler(chave, padrao) {
  if (!temArmazenamento()) return padrao;
  try {
    const bruto = window.localStorage.getItem(chave);
    return bruto == null ? padrao : JSON.parse(bruto);
  } catch {
    // Chave corrompida ou escrita por outra versao: melhor recomecar do que
    // derrubar a pagina inteira.
    return padrao;
  }
}

function gravar(chave, valor) {
  if (!temArmazenamento()) return;
  try {
    window.localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // Pode estourar a cota ou o navegador estar em modo restrito. Perder o
    // progresso e ruim, mas quebrar a navegacao e pior.
  }
}

// --- Perfis ----------------------------------------------------------------

export const lerPerfis = () => ler(CHAVE_PERFIS, []);

export function lerPerfilAtivo() {
  const id = ler(CHAVE_ATIVO, null);
  return lerPerfis().find((p) => p.id === id) ?? null;
}

export function criarPerfil(apelido, avatar) {
  const perfis = lerPerfis();
  const perfil = {
    id: `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    apelido: apelido.trim().slice(0, 18),
    avatar,
    criadoEm: new Date().toISOString(),
  };
  gravar(CHAVE_PERFIS, [...perfis, perfil]);
  trocarPerfil(perfil.id);
  return perfil;
}

export function apagarPerfil(id) {
  gravar(CHAVE_PERFIS, lerPerfis().filter((p) => p.id !== id));
  if (!temArmazenamento()) return;
  // Leva junto tudo que era daquele perfil.
  for (const chave of Object.keys(window.localStorage)) {
    if (chave.startsWith(`ba:${id}:`)) window.localStorage.removeItem(chave);
  }
  if (ler(CHAVE_ATIVO, null) === id) gravar(CHAVE_ATIVO, null);
}

// --- Troca de perfil: a parte delicada --------------------------------------
//
// Os jogos foram feitos antes dos perfis existirem e gravam em chaves proprias,
// fixas (o MathRace usa "Placar", o Tabuad4on usa "pontuacao-facil"). Dois
// perfis no mesmo computador escreveriam um por cima do outro.
//
// Como nao mexemos no codigo das equipes, o portal faz o revezamento: ao trocar
// de perfil, guarda as chaves do perfil que sai e devolve as do que entra.
//
// Isso so e seguro porque a troca acontece em "Meu espaco", com nenhum jogo
// aberto. Trocar de perfil com um jogo rodando em outra aba misturaria tudo.

/**
 * Todas as chaves de localStorage que pertencem a algum jogo.
 *
 * Alguns jogos gravam uma chave por fase (estrelas_ilha, estrelas_praia),
 * e por isso o catalogo pode declarar prefixos em vez de nomes fixos — estes
 * precisam ser resolvidos agora, olhando o que existe de fato.
 */
function chavesDosJogos() {
  const fixas = JOGOS.flatMap((j) => j.progresso?.chaves ?? []);
  const prefixos = JOGOS.flatMap((j) => j.progresso?.prefixos ?? []);
  if (!prefixos.length || !temArmazenamento()) return fixas;

  const porPrefixo = Object.keys(window.localStorage).filter((c) =>
    prefixos.some((p) => c.startsWith(p)),
  );
  return [...new Set([...fixas, ...porPrefixo])];
}

/** As chaves que pertencem a um jogo especifico, fixas e por prefixo. */
function chavesDoJogo(jogo) {
  const fixas = jogo.progresso?.chaves ?? [];
  const prefixos = jogo.progresso?.prefixos ?? [];
  if (!prefixos.length || !temArmazenamento()) return fixas;
  const achadas = Object.keys(window.localStorage).filter((c) =>
    prefixos.some((p) => c.startsWith(p)),
  );
  return [...new Set([...fixas, ...achadas])];
}

function guardarBruto(idPerfil) {
  if (!temArmazenamento() || !idPerfil) return;
  const guardado = {};
  for (const chave of chavesDosJogos()) {
    const valor = window.localStorage.getItem(chave);
    if (valor != null) guardado[chave] = valor;
  }
  gravar(`ba:${idPerfil}:bruto`, guardado);
}

function restaurarBruto(idPerfil) {
  if (!temArmazenamento()) return;
  const guardado = ler(`ba:${idPerfil}:bruto`, {});
  for (const chave of chavesDosJogos()) {
    if (chave in guardado) window.localStorage.setItem(chave, guardado[chave]);
    else window.localStorage.removeItem(chave);
  }
}

export function trocarPerfil(id) {
  const anterior = ler(CHAVE_ATIVO, null);
  if (anterior === id) return;
  if (anterior) guardarBruto(anterior);
  gravar(CHAVE_ATIVO, id);
  if (id) restaurarBruto(id);
}

/** Salva o estado atual dos jogos no perfil ativo, sem trocar de perfil. */
export function sincronizarPerfilAtivo() {
  guardarBruto(ler(CHAVE_ATIVO, null));
}

// --- Uso: o que o portal consegue registrar sozinho --------------------------
//
// Seis dos dez jogos nao gravam pontuacao nenhuma. Para eles, o que da para
// mostrar e o que o proprio portal observa: se ja abriu, quantas vezes e
// quando foi a ultima. Nao depende de nada dentro do jogo.

const chaveUso = (id) => `ba:${id}:uso`;

export function registrarAbertura(slug) {
  const perfil = lerPerfilAtivo();
  if (!perfil) return;
  const uso = ler(chaveUso(perfil.id), {});
  const atual = uso[slug] ?? { aberturas: 0, ultimaVez: null };
  uso[slug] = {
    aberturas: atual.aberturas + 1,
    ultimaVez: new Date().toISOString(),
  };
  gravar(chaveUso(perfil.id), uso);
}

export const lerUso = (idPerfil) => ler(chaveUso(idPerfil), {});

// --- Progresso no formato padrao -------------------------------------------
//
// E o que os jogos novos gravam, pela API em dados/api-jogo.js. Diferente dos
// adaptadores, aqui o portal escolhe a chave e o formato, entao nao precisa de
// tradutor nenhum: o jogo manda, o portal mostra.

const chaveProgresso = (idPerfil, slug) => `ba:${idPerfil}:progresso:${slug}`;

export function salvarProgresso(slug, dados) {
  const perfil = lerPerfilAtivo();
  // Sem perfil escolhido nao ha onde guardar. O jogo nao precisa saber disso:
  // devolve false e segue funcionando normalmente.
  if (!perfil) return false;

  const atual = ler(chaveProgresso(perfil.id, slug), {});
  const novo = { ...atual, ...dados, atualizadoEm: new Date().toISOString() };

  // Pontuacao e recorde: nunca desce. Senao a ultima partida ruim apagaria a
  // melhor, que e justamente o que a crianca quer ver guardado.
  if (typeof atual.pontuacao === 'number' && typeof dados.pontuacao === 'number') {
    novo.pontuacao = Math.max(atual.pontuacao, dados.pontuacao);
  }
  // Fase tambem so avanca.
  if (typeof atual.fase === 'number' && typeof dados.fase === 'number') {
    novo.fase = Math.max(atual.fase, dados.fase);
  }

  gravar(chaveProgresso(perfil.id, slug), novo);
  return true;
}

/** Converte o formato padrao nas linhas que a ficha mostra. */
function resumirPadrao(d) {
  if (!d) return null;
  const linhas = [];
  if (typeof d.pontuacao === 'number') linhas.push({ rotulo: 'Melhor pontuação', valor: d.pontuacao });
  if (typeof d.fase === 'number') {
    linhas.push({
      rotulo: 'Fase',
      valor: d.totalFases ? `${d.fase} de ${d.totalFases}` : d.fase,
    });
  }
  if (d.concluido) linhas.push({ rotulo: 'Terminou o jogo', valor: 'sim' });
  if (d.detalhe) linhas.push({ rotulo: 'Último', valor: d.detalhe });
  return linhas.length ? linhas : null;
}

// --- Progresso de um jogo ---------------------------------------------------

/**
 * Junta o que o portal observou com o que o jogo gravou por conta propria.
 *
 * O `resumir` de cada jogo vive no catalogo, porque cada equipe nomeou as
 * coisas do seu jeito e so o adaptador sabe traduzir.
 */
export function lerProgresso(jogo, idPerfil) {
  const uso = lerUso(idPerfil)[jogo.slug] ?? { aberturas: 0, ultimaVez: null };

  // O formato padrao tem prioridade: se o jogo usa a API, e ele quem manda.
  const padrao = resumirPadrao(ler(chaveProgresso(idPerfil, jogo.slug), null));

  let doJogo = null;
  if (jogo.progresso?.resumir && temArmazenamento()) {
    try {
      const valores = {};
      for (const chave of chavesDoJogo(jogo)) {
        valores[chave] = window.localStorage.getItem(chave);
      }
      doJogo = jogo.progresso.resumir(valores);
    } catch {
      // Formato inesperado no que o jogo gravou: mostra só o uso.
      doJogo = null;
    }
  }

  return {
    ...uso,
    detalhes: padrao ?? doJogo,
    registraProgresso: !!padrao || !!jogo.progresso,
  };
}

/** "há 3 dias", "ontem", "hoje" — mais legível que uma data para criança. */
export function quandoFoi(iso) {
  if (!iso) return null;
  const dias = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (dias <= 0) return 'hoje';
  if (dias === 1) return 'ontem';
  if (dias < 30) return `há ${dias} dias`;
  if (dias < 60) return 'há mais de um mês';
  return `há ${Math.floor(dias / 30)} meses`;
}
