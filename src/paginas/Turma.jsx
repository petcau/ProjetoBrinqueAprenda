import { Link, useParams } from 'react-router-dom';
import Layout from '../componentes/Layout';
import CardJogo from '../componentes/CardJogo';
import NaoEncontrada from './NaoEncontrada';
import { acharTurma } from '../dados/jogos';

/**
 * Pagina de uma turma: o que aquele semestre produziu e quem participou.
 *
 * Existe para dar um endereco proprio a cada turma — algo que a equipe possa
 * mostrar depois da disciplina, e que registre o acervo semestre a semestre.
 */
function Turma() {
  const { semestre } = useParams();
  const turma = acharTurma(semestre);

  if (!turma) return <NaoEncontrada />;

  // Equipe da turma inteira, sem repetir quem trabalhou em mais de um jogo.
  const equipe = [...new Set(turma.jogos.flatMap((j) => j.autores))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  );

  return (
    <Layout>
      <section className="bq-turma-abertura">
        <div className="bq-largura">
          <h1>Turma {turma.semestre}</h1>
          <p>
            {turma.curso} · {turma.disciplina} · {turma.periodo}. Esta turma
            publicou {turma.jogos.length}{' '}
            {turma.jogos.length === 1 ? 'jogo' : 'jogos'}, com {equipe.length}{' '}
            estudantes envolvidos.
          </p>
        </div>
      </section>

      <div className="bq-largura bq-turmas">
        <section className="bq-turma">
          <div className="bq-turma-cabeca">
            <h2 className="bq-turma-titulo">Os jogos</h2>
            <Link className="bq-turma-link" to="/">
              ← Ver todas as turmas
            </Link>
          </div>

          <div className="bq-grade">
            {turma.jogos.map((jogo) => (
              <CardJogo key={jogo.slug} jogo={{ ...jogo, turma }} />
            ))}
          </div>
        </section>

        <section className="bq-bloco">
          <h2>Estudantes da turma</h2>
          <div className="bq-equipe">
            <ul className="bq-equipe-lista">
              {equipe.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <p className="bq-equipe-origem">
              Universidade do Estado da Bahia — Campus II, Alagoinhas
            </p>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default Turma;
