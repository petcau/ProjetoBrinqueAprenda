import { Suspense, lazy, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import NaoEncontrada from './NaoEncontrada';
import { acharJogo } from '../dados/jogos';

/**
 * O jogo ocupando a tela inteira.
 *
 * Esta e a unica pagina do portal que sabe da diferenca entre os dois jeitos de
 * fazer um jogo na disciplina:
 *
 *   'estatico'  HTML/CSS/JS puro, servido de public/ dentro de um iframe. O
 *               iframe isola o CSS do jogo do CSS do portal nos dois sentidos,
 *               e a navegacao interna do jogo acontece dentro dele.
 *
 *   'react'     componente React, carregado sob demanda com lazy(). O codigo e
 *               o CSS do jogo so sao baixados quando alguem abre esta pagina,
 *               e nao na home.
 *
 * Nos dois casos o portal oferece o proprio caminho de volta, porque a
 * navegacao interna do jogo nunca devolveria o visitante para a ficha.
 */
function Jogar() {
  const { slug } = useParams();
  const jogo = acharJogo(slug);

  // lazy() precisa ser criado uma vez só por jogo, senão o componente é
  // remontado (e o jogo reiniciado) a cada renderização.
  const Componente = useMemo(
    () => (jogo?.jogo.tipo === 'react' ? lazy(jogo.jogo.carregar) : null),
    [jogo],
  );

  if (!jogo) return <NaoEncontrada />;

  return (
    <div className="bq-palco">
      <Link className="bq-voltar-jogo" to={`/jogo/${jogo.slug}`}>
        ← Voltar
      </Link>

      {jogo.jogo.tipo === 'estatico' ? (
        <iframe
          className="bq-palco-quadro"
          src={jogo.jogo.entrada}
          title={jogo.titulo}
          allow="autoplay; fullscreen"
        />
      ) : (
        <div className="bq-palco-react">
          <Suspense fallback={<p className="bq-carregando">Carregando {jogo.titulo}…</p>}>
            <Componente />
          </Suspense>
        </div>
      )}
    </div>
  );
}

export default Jogar;
