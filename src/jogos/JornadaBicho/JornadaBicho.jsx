import LogicaArrastar from "./componenetes/LogicaArastar";
import './game.css'; // Não Implementado ainda

/*
 * Componente que representa o jogo JornadaBicho.
 *
 * Renderiza o componente LogicaArrastar, que por sua vez
 * renderiza a logica do jogo.
 *
 */
function JornadaBicho() {
  return (
    <>
      <main className="container">
        <div className="game-container">{<LogicaArrastar />}</div>
      </main>
    </>
  );
}

export default JornadaBicho;
