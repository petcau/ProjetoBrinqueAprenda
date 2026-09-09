import { useNavigate } from 'react-router-dom';
import './JogoEmbutido.css';

/**
 * Moldura para jogos que nao sao React.
 *
 * Alguns jogos do portal foram feitos em JavaScript puro e multi-pagina, com
 * navegacao propria por links .html e caminhos relativos. Eles nao passam pelo
 * bundler: ficam em `public/<semestre>/<Jogo>/` e sao servidos como estao, dentro
 * de um iframe.
 *
 * Isso resolve duas coisas de uma vez. O CSS do jogo e o do portal ficam
 * isolados, sem um sobrescrever o outro. E como a navegacao interna do jogo
 * acontece dentro do iframe, sem mexer na rota do portal, a moldura precisa
 * oferecer o proprio caminho de volta.
 *
 * @param {string} url - Caminho do index.html do jogo dentro de public/.
 * @param {string} titulo - Nome do jogo, usado no title do iframe.
 */
function JogoEmbutido({ url, titulo }) {
  const navigate = useNavigate();

  return (
    <main className="jogo-embutido">
      <button
        className="jogo-embutido-voltar"
        onClick={() => navigate('/')}
        title="Voltar para o portal Brinque e Aprenda"
      >
        &#8592; Portal
      </button>

      <iframe
        className="jogo-embutido-frame"
        src={url}
        title={titulo}
        allow="autoplay; fullscreen"
      />
    </main>
  );
}

export default JogoEmbutido;
