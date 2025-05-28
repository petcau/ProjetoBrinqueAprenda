import MenuJonada from "./componenetes/MenuJornada";

import './game.css';
import Estado from "./componenetes/LogicaGame/Estado";
/*
 * Componente que representa o jogo JornadaBicho.
 *
 * Renderiza o componente LogicaArrastar, que por sua vez
 * renderiza a logica do jogo.
 *
 */
function JornadaBicho() {
  return (
      <main className="container_jornada">
        <div className="game_conteiner_Jornada">
          <Estado />
        </div>
      </main>
  );
}

export default JornadaBicho;
