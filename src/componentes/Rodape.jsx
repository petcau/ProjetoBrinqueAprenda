import { Link } from 'react-router-dom';
import Icone from './Icone';
import uneb from '../assets/uneb.webp';
import chamada from '../assets/chamada-final.webp';
import { TURMAS, JOGOS, CATEGORIAS, contarPorCategoria } from '../dados/jogos';

/**
 * Rodape do portal.
 *
 * Tudo aqui aponta para pagina que existe. As categorias e as turmas saem do
 * catalogo, entao crescem sozinhas — uma area nova ou uma turma nova aparecem
 * no rodape sem ninguem lembrar de vir aqui.
 *
 * Ficaram de fora, por decisao do projeto, as coisas da referencia visual que
 * ainda nao existem: redes sociais, newsletter, termos de uso, politica de
 * privacidade, FAQ e parceiros. Link que nao leva a lugar nenhum e pior do que
 * link ausente — e o formulario de e-mail, num portal infantil, so deve entrar
 * junto com a politica de privacidade.
 */
function Rodape() {
  const ano = new Date().getFullYear();

  return (
    <footer className="bq-rodape">
      {/* Faixa de chamada, antes do rodapé escuro.
          A arte traz o texto desenhado dentro dela. Em tela larga é ela que
          aparece, e o texto em HTML fica só para o leitor de tela. Em tela
          estreita a arte sai e o texto assume: letra desenhada em imagem não
          reflui nem aumenta, e num celular viraria coisa de 8px. */}
      <section className="bq-chamada-final">
        <div className="bq-largura bq-chamada-interna">
          <img className="bq-chamada-arte" src={chamada} alt="" width="2154" height="401" />

          <div className="bq-chamada-texto">
            <h2>
              Pronto para uma <em>nova aventura?</em>
            </h2>
            <p>Explorar, aprender e se desafiar nunca foi tão divertido!</p>
          </div>

          <Link className="bq-botao bq-botao-principal bq-chamada-botao" to="/jogos">
            <Icone nome="jogos" tamanho={20} />
            Explorar jogos
            <Icone nome="seta" tamanho={18} />
          </Link>
        </div>
      </section>

      <div className="bq-rodape-escuro">
        <div className="bq-largura bq-rodape-colunas">
          <div className="bq-rodape-marca">
            {/* Em texto, e não com a logo: sobre o fundo escuro o roxo da arte
                perde contraste e precisaria de um fundo branco atrás, que fica
                parecendo remendo. Em texto dá para usar tons claros das mesmas
                cores da marca. */}
            <p className="bq-rodape-nome">
              <span>Brinque</span>
              <span>&amp;</span>
              <span>Aprenda</span>
            </p>
            <p>
              Jogos educativos gratuitos, criados por estudantes de Engenharia de
              Software da UNEB. Aprender também pode ser uma grande aventura!
            </p>
          </div>

          <nav className="bq-rodape-coluna" aria-labelledby="rod-nav">
            <h3 id="rod-nav">Navegação</h3>
            <Link to="/">Início</Link>
            <Link to="/jogos">Todos os jogos</Link>
            <Link to="/sobre">Sobre o projeto</Link>
          </nav>

          <nav className="bq-rodape-coluna" aria-labelledby="rod-cat">
            <h3 id="rod-cat">Categorias de jogos</h3>
            {CATEGORIAS.map((cat) => (
              <Link
                key={cat.slug}
                to={`/jogos?categoria=${cat.slug}`}
                style={{ '--cat-cor': cat.cor }}
              >
                <Icone nome={cat.slug} tamanho={17} />
                {cat.nome}
                <small>{contarPorCategoria(cat.slug)}</small>
              </Link>
            ))}
          </nav>

          <nav className="bq-rodape-coluna" aria-labelledby="rod-turmas">
            <h3 id="rod-turmas">Turmas</h3>
            {TURMAS.map((turma) => (
              <Link key={turma.semestre} to={`/turma/${turma.semestre}`}>
                Turma {turma.semestre}
                <small>{turma.jogos.length}</small>
              </Link>
            ))}
            <p className="bq-rodape-nota">
              {JOGOS.length} jogos publicados por {TURMAS.length} turmas da
              disciplina Web1.
            </p>
          </nav>
        </div>

        <div className="bq-largura bq-rodape-realizacao">
          <div className="bq-realizacao">
            <h3>Realização</h3>
            <div>
              <img src={uneb} alt="" width="357" height="200" />
              <span>
                Universidade do Estado da Bahia
                <small>CAMPUS II - Alagoinhas</small>
              </span>
            </div>
          </div>
        </div>

        <div className="bq-largura bq-rodape-base">
          <p>© {ano} Brinque &amp; Aprenda. Projeto acadêmico da UNEB.</p>
        </div>
      </div>
    </footer>
  );
}

export default Rodape;
