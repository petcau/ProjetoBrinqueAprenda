import { Link } from 'react-router-dom';
import Layout from '../componentes/Layout';
import { TURMAS } from '../dados/jogos';

/**
 * Sobre o projeto e creditos.
 *
 * Os creditos sao gerados do catalogo, jogo a jogo. Antes eram uma lista fixa
 * neste arquivo, que precisava ser editada a mao a cada semestre e ja divergia
 * dos nomes registrados na documentacao.
 */
function Sobre() {
  return (
    <Layout>
      <div className="bq-largura bq-sobre">
        <h1>Sobre o projeto</h1>

        <section className="bq-bloco">
          <p className="bq-texto">
            O Brinque e Aprenda é um acervo de jogos educativos digitais voltado
            a estudantes dos anos finais do Ensino Fundamental 1 (4º e 5º ano) e
            do Ensino Fundamental 2 (6º ao 9º ano). Todos os jogos são gratuitos
            e podem ser usados livremente em sala de aula.
          </p>
          <p className="bq-texto">
            O projeto é educacional em dois sentidos. Para quem joga, reúne
            atividades que trabalham competências de matemática, linguagem,
            raciocínio lógico e consciência ambiental. Para quem constrói, é a
            entrega prática da disciplina <strong>Web1</strong> do curso de
            Engenharia de Software da Universidade do Estado da Bahia: a cada
            semestre, uma nova turma projeta, desenvolve e publica seus jogos
            aqui, passando por todo o ciclo de um produto real — do levantamento
            de requisitos ao software no ar.
          </p>
          <p className="bq-texto">
            Por isso o acervo é organizado por turma. Cada jogo guarda o nome de
            quem o fez e o semestre em que nasceu.
          </p>
        </section>

        <section className="bq-bloco">
          <h2>Agradecimentos</h2>
          <p className="bq-texto">
            A equipe do Brinque e Aprenda manifesta seu sincero agradecimento a
            todos que contribuíram para a realização e o sucesso do projeto:
            ao docente Peterson Lobato, ao coordenador Ricardo Peres, ao diretor
            Isaac Douglas e aos discentes que participaram ativamente.
          </p>
          <p className="bq-texto">
            Por fim, o projeto agradece à Universidade do Estado da Bahia, por
            meio de seu compromisso com a educação pública, de qualidade e
            socialmente referenciada. O espaço da UNEB foi essencial para que o
            Brinque e Aprenda se tornasse realidade, reafirmando o papel da
            universidade como ambiente de formação, inclusão e transformação
            social.
          </p>
        </section>

        <section className="bq-bloco">
          <h2>Créditos</h2>

          {TURMAS.map((turma) => (
            <div className="bq-turma-creditos" key={turma.semestre}>
              <h3>
                <Link to={`/turma/${turma.semestre}`}>Turma {turma.semestre}</Link>
              </h3>
              <p className="bq-equipe-origem">
                {turma.curso} · {turma.disciplina} · {turma.periodo}
              </p>

              {turma.jogos.map((jogo) => (
                <p className="bq-jogo-creditos" key={jogo.slug}>
                  <strong>
                    <Link to={`/jogo/${jogo.slug}`}>{jogo.titulo}</Link>
                  </strong>
                  <br />
                  <span>{jogo.autores.join(' · ')}</span>
                </p>
              ))}
            </div>
          ))}

          <aside className="bq-turma-creditos bq-idealizador" aria-labelledby="idealizador-titulo">
            <h3 id="idealizador-titulo">Idealizado por</h3>
            <ul>
              <li>Prof. Peterson Lobato</li>
              <li>
                <a href="mailto:peterson.lobato@hotmail.com">
                  peterson.lobato@hotmail.com
                </a>
              </li>
            </ul>
          </aside>
        </section>
      </div>
    </Layout>
  );
}

export default Sobre;
