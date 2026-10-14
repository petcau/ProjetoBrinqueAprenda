import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icone from './Icone';
import { CATEGORIAS, contarPorCategoria } from '../dados/jogos';

/**
 * Barra de categorias, logo abaixo da abertura.
 *
 * Nao e enfeite: cada cartao leva para /jogos filtrado por aquela area. E o
 * caminho mais curto para o professor que chega procurando algo especifico.
 *
 * Fica sempre numa linha so, que desliza. No celular isso ja e natural; no
 * desktop, sem as setas, ninguem descobre que ha mais conteudo a direita —
 * por isso elas aparecem e somem conforme da para rolar para cada lado.
 *
 * As areas, as cores e a classificacao de cada jogo estao no catalogo
 * (src/dados/jogos.js). Esta tela nao conhece nenhuma delas por conta propria.
 */
function BarraCategorias() {
  const [params] = useSearchParams();
  const ativa = params.get('categoria');

  const trilho = useRef(null);
  const [podeVoltar, setPodeVoltar] = useState(false);
  const [podeAvancar, setPodeAvancar] = useState(false);

  const medir = useCallback(() => {
    const el = trilho.current;
    if (!el) return;
    const sobra = el.scrollWidth - el.clientWidth;
    setPodeVoltar(el.scrollLeft > 4);
    setPodeAvancar(sobra > 4 && el.scrollLeft < sobra - 4);
  }, []);

  useEffect(() => {
    medir();
    const el = trilho.current;
    if (!el) return;
    el.addEventListener('scroll', medir, { passive: true });
    window.addEventListener('resize', medir);
    return () => {
      el.removeEventListener('scroll', medir);
      window.removeEventListener('resize', medir);
    };
  }, [medir]);

  // Rola quase uma tela cheia, deixando um cartão à vista como referência.
  const rolar = (direcao) => {
    const el = trilho.current;
    if (!el) return;
    el.scrollBy({ left: direcao * (el.clientWidth * 0.8), behavior: 'smooth' });
  };

  return (
    <div className="bq-categorias-faixa">
      <div className="bq-largura bq-carrossel">
        <button
          type="button"
          className="bq-carrossel-seta anterior"
          onClick={() => rolar(-1)}
          hidden={!podeVoltar}
          aria-label="Ver áreas anteriores"
        >
          <Icone nome="seta" tamanho={18} />
        </button>

        <nav
          className="bq-categorias"
          ref={trilho}
          aria-label="Jogos por área de conhecimento"
        >
          {CATEGORIAS.map((cat) => {
            const estaAtiva = cat.slug === ativa;
            // Clicar na área já filtrada limpa o filtro, em vez de recarregar
            // a mesma lista.
            const destino = estaAtiva ? '/jogos' : `/jogos?categoria=${cat.slug}`;

            return (
            <Link
              key={cat.slug}
              to={destino}
              className={estaAtiva ? 'bq-categoria ativa' : 'bq-categoria'}
              aria-current={estaAtiva ? 'true' : undefined}
              style={{ '--cat-cor': cat.cor, '--cat-fundo': cat.fundo }}
            >
              <span className="bq-categoria-icone">
                <Icone nome={cat.slug} tamanho={22} />
              </span>

              <span className="bq-categoria-texto">
                <strong>
                  {cat.nome}
                  <span className="bq-categoria-conta">
                    {contarPorCategoria(cat.slug)}
                    <Icone nome={estaAtiva ? 'fechar' : 'seta'} tamanho={13} />
                  </span>
                </strong>
                <small>{cat.descricao}</small>
              </span>
            </Link>
          );
          })}
        </nav>

        <button
          type="button"
          className="bq-carrossel-seta proxima"
          onClick={() => rolar(1)}
          hidden={!podeAvancar}
          aria-label="Ver mais áreas"
        >
          <Icone nome="seta" tamanho={18} />
        </button>
      </div>
    </div>
  );
}

export default BarraCategorias;
