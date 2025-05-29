import './game.css';
import Estado from "./componenetes/LogicaGame/Estado";
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