// ============================================================================
//  A API QUE O PORTAL OFERECE AOS JOGOS
// ============================================================================
//
//  Um jogo chama uma funcao e o progresso aparece em "Meu espaco". So isso.
//
//  Por que isso existe: os quatro jogos de 2025.2 que guardam pontuacao foram
//  feitos antes dos perfis, cada um inventou o seu formato, e por isso cada um
//  precisou de um tradutor escrito a mao no catalogo. Sem um padrao, todo jogo
//  novo repete esse trabalho — ou fica sem progresso.
//
//  Com este padrao, o jogo chama:
//
//      window.brinqueAprenda.salvar({ pontuacao: 1250, fase: 3, totalFases: 5 });
//
//  e nao precisa saber de perfil, de chave nem de onde aquilo e guardado.
//
//  A instalacao e removida quando se sai do jogo (ver paginas/Jogar.jsx), para
//  um jogo nunca conseguir gravar progresso no lugar de outro.
//
// ============================================================================

import { salvarProgresso } from './perfil.js';

/** Aceita só o que a ficha sabe mostrar, e no tipo certo. */
function limpar(dados) {
  if (!dados || typeof dados !== 'object') return null;

  const limpo = {};
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

  if (num(dados.pontuacao) !== null) limpo.pontuacao = Math.round(dados.pontuacao);
  if (num(dados.fase) !== null) limpo.fase = Math.round(dados.fase);
  if (num(dados.totalFases) !== null) limpo.totalFases = Math.round(dados.totalFases);
  if (typeof dados.concluido === 'boolean') limpo.concluido = dados.concluido;

  // Um rótulo curto e livre, para o que não cabe nos campos acima
  // ("Nível difícil", "3 estrelas"). Cortado para não virar texto solto.
  if (typeof dados.detalhe === 'string' && dados.detalhe.trim()) {
    limpo.detalhe = dados.detalhe.trim().slice(0, 40);
  }

  return Object.keys(limpo).length ? limpo : null;
}

/**
 * Deixa a API disponivel para o jogo que esta aberto.
 *
 * O jogo estatico roda num iframe de mesma origem, entao alcanca isto como
 * `window.parent.brinqueAprenda`. O jogo React roda na mesma janela e usa
 * `window.brinqueAprenda` direto.
 */
export function instalarApi(slug) {
  if (typeof window === 'undefined') return;

  window.brinqueAprenda = {
    versao: 1,
    jogo: slug,

    /** Guarda o progresso no perfil de quem esta jogando. */
    salvar(dados) {
      const limpo = limpar(dados);
      if (!limpo) return false;
      return salvarProgresso(slug, limpo);
    },
  };
}

export function removerApi() {
  if (typeof window === 'undefined') return;
  delete window.brinqueAprenda;
}
