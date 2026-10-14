import { Link } from 'react-router-dom';
import Icone from './Icone';
import placas from '../assets/placas.webp';

/**
 * Abertura da home.
 *
 * A arte de fundo e as placas sao imagens em src/assets/ — ver
 * src/assets/LEIA-ME-BANNER.md para a composicao que o leiaute assume.
 * Se o banner sumir, o degrade do CSS aparece no lugar e a abertura continua
 * legivel: nada quebra por falta de imagem.
 *
 * As placas ficam fora de .bq-hero-interno de proposito. Aquele bloco e a
 * coluna de conteudo, limitada a 1120px; ancoradas nele, as placas parariam no
 * meio da tela num monitor largo em vez de no canto da arte.
 */
function Hero() {
  return (
    <section className="bq-hero">
      <div className="bq-hero-arte" aria-hidden="true" />

      {/* Decorativa: as palavras das placas reforcam o que o titulo ja diz,
          por isso alt vazio — o leitor de tela nao precisa repeti-las. */}
      <img className="bq-hero-placas" src={placas} alt="" width="300" height="347" />

      <div className="bq-largura bq-hero-interno">
        <div className="bq-hero-texto">
          <h1>
            Conhecimento também é<br />
            uma <em>aventura!</em>
          </h1>

          <p className="bq-hero-linha">
            Explore jogos, supere desafios, desenvolva suas habilidades e
            descubra um mundo cheio de possibilidades.
          </p>

          <div className="bq-hero-botoes">
            <Link className="bq-botao bq-botao-principal" to="/jogos">
              Explorar jogos
              <Icone nome="seta" tamanho={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
