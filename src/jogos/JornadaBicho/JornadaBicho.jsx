import Menu from "./componenetes/Menu";
import { useNavigate } from 'react-router-dom';
import './game.css'; // Não Implementado ainda

/*
 * Componente que representa o jogo JornadaBicho.
 *
 * Renderiza o componente LogicaArrastar, que por sua vez
 * renderiza a logica do jogo.
 *
 */
function JornadaBicho() {
  const navigate = useNavigate();
  return (
      <main className="container">
        <div className="game-container">
          {
            <>
              <button className="Butao_Voltar_Ao_Menu" onClick={() => navigate ("/")}>
                Voltar para o menu
              </button>
              <Menu />
            </>
          }
          </div>
      </main>
  );
}

export default JornadaBicho;
