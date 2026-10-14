import { Link } from 'react-router-dom';
import Layout from '../componentes/Layout';

/**
 * Pagina mostrada quando a URL nao corresponde a nenhum jogo ou turma.
 */
function NaoEncontrada() {
  return (
    <Layout>
      <div className="bq-largura bq-vazio">
        <h1>Página não encontrada</h1>
        <p className="bq-texto" style={{ margin: '0 auto 24px' }}>
          O endereço que você abriu não existe no portal. Pode ser um jogo que
          mudou de nome ou um link digitado errado.
        </p>
        <Link className="bq-jogar" to="/">
          Ver todos os jogos
        </Link>
      </div>
    </Layout>
  );
}

export default NaoEncontrada;
