import { Link, useSearchParams } from 'react-router-dom';
import Layout from '../componentes/Layout';
import CardJogo from '../componentes/CardJogo';
import BarraCategorias from '../componentes/BarraCategorias';
import Icone from '../componentes/Icone';
import { JOGOS, acharCategoria } from '../dados/jogos';

/**
 * Todos os jogos numa grade so, com filtro opcional por area.
 *
 * E o destino do item "Jogos" do menu, do botao "Explorar jogos" da abertura e
 * dos cartoes da barra de categorias, que chegam como /jogos?categoria=xxx.
 *
 * O filtro vive na URL, e nao em estado interno, de proposito: assim o
 * professor pode guardar nos favoritos ou mandar para um colega o link de
 * "jogos de matematica".
 */
function Jogos() {
  const [params] = useSearchParams();
  const slug = params.get('categoria');
  const categoria = slug ? acharCategoria(slug) : null;

  // Categoria desconhecida na URL não filtra nada — melhor mostrar tudo do que
  // uma página vazia por causa de um link digitado errado.
  const lista = categoria
    ? JOGOS.filter((j) => j.categorias.includes(categoria.slug))
    : JOGOS;

  return (
    <Layout>
      <section className="bq-turma-abertura">
        <div className="bq-largura">
          <h1>{categoria ? `Jogos de ${categoria.nome}` : 'Todos os jogos'}</h1>
          <p>
            {categoria
              ? categoria.descricao
              : `${JOGOS.length} jogos educativos gratuitos, construídos pelas turmas de Web1 da UNEB. Clique em um deles para ver a descrição, as competências trabalhadas e quem o criou.`}
          </p>
        </div>
      </section>

      <BarraCategorias />

      <div className="bq-largura bq-turmas">
        {categoria && (
          <div
            className="bq-filtro"
            style={{ '--cat-cor': categoria.cor, '--cat-fundo': categoria.fundo }}
          >
            <span className="bq-filtro-selo">
              {lista.length} {lista.length === 1 ? 'jogo' : 'jogos'} de {categoria.nome}
              <Link className="bq-filtro-limpar" to="/jogos" aria-label="Remover o filtro">
                <Icone nome="fechar" tamanho={13} />
              </Link>
            </span>
          </div>
        )}

        <div className="bq-grade">
          {lista.map((jogo) => (
            <CardJogo key={jogo.slug} jogo={jogo} mostrarTurma />
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default Jogos;
