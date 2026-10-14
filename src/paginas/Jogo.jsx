import { Link, useParams } from 'react-router-dom';
import Layout from '../componentes/Layout';
import NaoEncontrada from './NaoEncontrada';
import { acharJogo, formatarData, PUBLICOS } from '../dados/jogos';

/**
 * Ficha do jogo: a pagina de apresentacao que vem antes de jogar.
 *
 * Serve a tres publicos ao mesmo tempo:
 *  - a crianca decide se quer aquele jogo, vendo capa e descricao;
 *  - o professor avalia as competencias e a serie antes de levar para a aula;
 *  - a equipe que construiu fica creditada num endereco fixo e compartilhavel.
 *
 * Todo o conteudo vem do catalogo. Esta pagina nao sabe se o jogo e React ou
 * HTML puro: isso so importa em /jogar/:slug.
 */
function Jogo() {
  const { slug } = useParams();
  const jogo = acharJogo(slug);

  if (!jogo) return <NaoEncontrada />;

  const { turma } = jogo;

  return (
    <Layout>
      <div className="bq-largura">
        <nav className="bq-migalhas" aria-label="Você está em">
          <Link to="/">Início</Link> › <Link to={`/turma/${turma.semestre}`}>Turma {turma.semestre}</Link> › {jogo.titulo}
        </nav>
      </div>

      <article className="bq-largura bq-ficha">
        <div className="bq-ficha-topo">
          <img
            className="bq-ficha-capa"
            src={jogo.capa}
            alt={`Capa do jogo ${jogo.titulo}`}
            width="1200"
            height="675"
          />

          <div>
            <h1 className="bq-ficha-titulo">{jogo.titulo}</h1>
            <p className="bq-ficha-subtitulo">{jogo.subtitulo}</p>

            <Link className="bq-jogar" to={`/jogar/${jogo.slug}`}>
              ▶ JOGAR
            </Link>

            <dl className="bq-ficha-dados">
              <div>
                <dt>Turma</dt>
                <dd>
                  <Link to={`/turma/${turma.semestre}`}>{turma.semestre}</Link> ·{' '}
                  {turma.disciplina}
                </dd>
              </div>
              <div>
                <dt>Criado em</dt>
                <dd>{formatarData(jogo.dataCriacao)}</dd>
              </div>
              <div>
                <dt>Indicado para</dt>
                <dd>{PUBLICOS[jogo.publicoAlvo] ?? jogo.publicoAlvo}</dd>
              </div>
            </dl>
          </div>
        </div>

        <section className="bq-bloco">
          <h2>Sobre o jogo</h2>
          <p className="bq-texto">{jogo.descricao}</p>
          <p className="bq-chamada">{jogo.chamada}</p>
        </section>

        <section className="bq-bloco">
          <h2>Competências e habilidades</h2>
          <ul className="bq-habilidades">
            {jogo.habilidades.map((h) => (
              <li className="bq-habilidade" key={h}>
                {h}
              </li>
            ))}
          </ul>
        </section>

        {jogo.caracteristicas.length > 0 && (
          <section className="bq-bloco">
            <h2>Como funciona</h2>
            <ul className="bq-caracteristicas">
              {jogo.caracteristicas.map((c) => (
                <li className="bq-caracteristica" key={c.titulo}>
                  <span className="bq-caracteristica-icone" aria-hidden="true">
                    {c.icone}
                  </span>
                  <h3>{c.titulo}</h3>
                  <p>{c.descricao}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="bq-bloco">
          <h2>Quem criou</h2>
          <div className="bq-equipe">
            <ul className="bq-equipe-lista">
              {jogo.autores.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <p className="bq-equipe-origem">
              Turma {turma.semestre} · {turma.curso} · {turma.disciplina} ·
              Universidade do Estado da Bahia
            </p>
          </div>
        </section>
      </article>
    </Layout>
  );
}

export default Jogo;
