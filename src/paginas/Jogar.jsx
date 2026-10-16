import { Suspense, lazy, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import NaoEncontrada from './NaoEncontrada';
import { acharJogo } from '../dados/jogos';
import { registrarAbertura } from '../dados/perfil';
import { instalarApi, removerApi } from '../dados/api-jogo.js';
import logo from '../assets/logo-brinque-aprenda.webp';

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
  const navigate = useNavigate();
  const jogo = acharJogo(slug);

  // lazy() precisa ser criado uma vez só por jogo, senão o componente é
  // remontado (e o jogo reiniciado) a cada renderização.
  const Componente = useMemo(
    () => (jogo?.jogo.tipo === 'react' ? lazy(jogo.jogo.carregar) : null),
    [jogo],
  );

  // Conta a partida para o perfil ativo. É o único progresso que o portal
  // consegue registrar nos jogos que não guardam nada por conta própria.
  useEffect(() => {
    if (!jogo) return;
    registrarAbertura(jogo.slug);

    // Deixa a API disponível para o jogo que está abrindo, e tira ao sair:
    // assim um jogo nunca consegue gravar progresso no lugar de outro.
    instalarApi(jogo.slug);
    return removerApi;
  }, [jogo]);

  if (!jogo) return <NaoEncontrada />;

  return (
    <div className="bq-palco">
      <header className="bq-barra-jogo">
        <button
          type="button"
          className="bq-barra-jogo-marca"
          onClick={() => navigate(`/jogo/${jogo.slug}`, { replace: true })}
          aria-label={`Voltar para a página de ${jogo.titulo} no portal`}
          title="Voltar para o portal"
        >
          <img src={logo} alt="Brinque & Aprenda" width="841" height="120" />
        </button>
      </header>

      <div className="bq-palco-area">
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
    </div>
  );
}

export default Jogar;
