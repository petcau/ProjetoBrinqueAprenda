import { Link } from 'react-router-dom';
import Layout from '../componentes/Layout';
import Hero from '../componentes/Hero';
import BarraCategorias from '../componentes/BarraCategorias';
import JogoDoDia from '../componentes/JogoDoDia';
import Icone from '../componentes/Icone';
import { TURMAS } from '../dados/jogos';
import faixaTurmas from '../assets/faixa-turmas.webp';

/**
 * Home.
 *
 * Nao lista mais o acervo inteiro: abre com a chamada, as areas, um jogo
 * sorteado do dia, e caminhos para o resto. A lista completa vive em /jogos e
 * cada turma na sua propria pagina.
 *
 * A faixa de turmas fica aqui porque o portal e o registro do que cada semestre
 * da disciplina produziu — tirar isso da home apagaria a leitura principal do
 * projeto. Mostra so os nomes e a contagem, nao os jogos.
 */
function Home() {
  return (
    <Layout>
      <Hero />
      <BarraCategorias />
      <JogoDoDia />

      <section className="bq-faixa-turmas" aria-labelledby="turmas-titulo">
        <div className="bq-largura">
          {/* A arte traz o título e o texto desenhados dentro dela. Em tela
              larga é ela que aparece; o texto em HTML continua aqui para o
              leitor de tela, e volta a ser visível no celular, onde a letra
              desenhada ficaria pequena demais. */}
          <img className="bq-faixa-arte" src={faixaTurmas} alt="" width="2172" height="724" />

          <div className="bq-faixa-texto">
            <h2 id="turmas-titulo">Cada semestre, uma turma nova</h2>
            <p>
              Os jogos deste acervo são construídos pelos estudantes de
              Engenharia de Software da UNEB, na disciplina Web1. Veja o que cada
              turma criou.
            </p>
          </div>

          <div className="bq-turmas-lista">
            {TURMAS.map((turma) => (
              <Link key={turma.semestre} to={`/turma/${turma.semestre}`}>
                <strong>Turma {turma.semestre}</strong>
                <small>
                  {turma.jogos.length} jogos · {turma.periodo}
                </small>
                <Icone nome="seta" tamanho={18} />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

export default Home;
