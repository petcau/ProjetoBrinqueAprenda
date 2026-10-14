import { Link } from 'react-router-dom';
import Icone from './Icone';
import { jogoDoDia, JOGOS, CATEGORIAS, PUBLICOS_CURTO } from '../dados/jogos';

/**
 * O jogo em destaque da home.
 *
 * A home nao lista mais o acervo inteiro: mostra um jogo sorteado e convida a
 * ver o resto. O sorteio e por dia, nao por visita — numa escola a turma toda
 * abre o portal na mesma aula e precisa cair no mesmo jogo.
 */
function JogoDoDia() {
  const jogo = jogoDoDia();
  const areas = CATEGORIAS.filter((c) => jogo.categorias.includes(c.slug));

  return (
    <section className="bq-destaque" aria-labelledby="destaque-titulo">
      <div className="bq-largura">
        <p className="bq-destaque-etiqueta">
          <span>Jogo de hoje</span>
          <Link to="/jogos">
            Ver todos os {JOGOS.length} jogos
            <Icone nome="seta" tamanho={16} />
          </Link>
        </p>

        <div className="bq-destaque-cartao">
          <Link className="bq-destaque-capa" to={`/jogo/${jogo.slug}`} tabIndex={-1} aria-hidden="true">
            <img src={jogo.capa} alt="" width="1200" height="675" />
          </Link>

          <div className="bq-destaque-texto">
            <div className="bq-destaque-areas">
              {areas.map((a) => (
                <span key={a.slug} style={{ '--cat-cor': a.cor, '--cat-fundo': a.fundo }}>
                  <Icone nome={a.slug} tamanho={14} />
                  {a.nome}
                </span>
              ))}
            </div>

            <h2 id="destaque-titulo">
              <Link to={`/jogo/${jogo.slug}`}>{jogo.titulo}</Link>
            </h2>
            <p className="bq-destaque-subtitulo">{jogo.subtitulo}</p>
            <p className="bq-destaque-sinopse">{jogo.sinopse}</p>

            <div className="bq-destaque-meta">
              <span>Turma {jogo.turma.semestre}</span>
              <span>{PUBLICOS_CURTO[jogo.publicoAlvo]}</span>
            </div>

            <div className="bq-destaque-botoes">
              <Link className="bq-botao bq-botao-principal" to={`/jogar/${jogo.slug}`}>
                <Icone nome="play" tamanho={17} />
                Jogar agora
              </Link>
              <Link className="bq-botao bq-botao-claro" to={`/jogo/${jogo.slug}`}>
                Sobre o jogo
                <Icone nome="seta" tamanho={17} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default JogoDoDia;
