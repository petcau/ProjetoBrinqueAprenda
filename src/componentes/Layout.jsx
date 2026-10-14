import Cabecalho from './Cabecalho';
import Rodape from './Rodape';

/**
 * Moldura das paginas de conteudo: cabecalho, conteudo e rodape.
 *
 * A tela de jogo (/jogar/:slug) NAO usa este layout de proposito — la o jogo
 * ocupa a tela inteira.
 */
function Layout({ children }) {
  return (
    <div className="bq-pagina">
      <a className="bq-pular" href="#conteudo">
        Pular para o conteúdo
      </a>

      <Cabecalho />

      <main className="bq-conteudo" id="conteudo">
        {children}
      </main>

      <Rodape />
    </div>
  );
}

export default Layout;
