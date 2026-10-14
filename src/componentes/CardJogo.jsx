import { Link } from 'react-router-dom';
import { PUBLICOS_CURTO } from '../dados/jogos';

/**
 * Card de um jogo na grade.
 *
 * Leva para a ficha do jogo, nao direto para o jogo: e na ficha que estao a
 * descricao, as competencias e os autores. Quem so quer jogar da dois cliques.
 *
 * @param {object} jogo - entrada do catalogo (src/dados/jogos.js)
 * @param {boolean} mostrarTurma - exibe o selo da turma (usado na home)
 */
function CardJogo({ jogo, mostrarTurma = false }) {
  return (
    <Link to={`/jogo/${jogo.slug}`} className="bq-card">
      <img
        className="bq-card-capa"
        src={jogo.capa}
        alt={`Capa do jogo ${jogo.titulo}`}
        loading="lazy"
        width="1200"
        height="675"
      />

      <div className="bq-card-corpo">
        <h3 className="bq-card-titulo">{jogo.titulo}</h3>
        <p className="bq-card-sinopse">{jogo.sinopse}</p>

        <div className="bq-card-rodape">
          {mostrarTurma && jogo.turma && (
            <span className="bq-selo bq-selo-turma">Turma {jogo.turma.semestre}</span>
          )}
          <span className="bq-selo">
            {PUBLICOS_CURTO[jogo.publicoAlvo] ?? jogo.publicoAlvo}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default CardJogo;
