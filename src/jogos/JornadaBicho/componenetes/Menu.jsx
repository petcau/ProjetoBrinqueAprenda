import { useState } from "react";
import GameLogic from "./LogicaGame/LogicaGame";

/**
 * Componente que representa o menu do jogo JornadaBicho.
 *
 * Renderiza um bot o para iniciar o jogo e um t tulo.
 * Ao clicar no bot o, o estado da vari vel estado   alterado,
 * o que renderiza o componente GameLogic.
 *
 * @returns {JSX.Element} O componente renderizado.
 */
function Menu() {
  const [estado, setEstado] = useState(true);

  /**
   * Fun o que altera o estado da vari vel estado.
   *
   * Quando chamada, esta fun o altera o estado da vari vel estado,
   * o que renderiza o componente GameLogic.
   *
   */
  const irParaJogo = () => {
    setEstado(!estado);
  };

  return (
    <>
      <div>
        {estado ? (
          <>
            <p className="Titulo_Jornada">
              <img src="src/jogos/JornadaBicho/game_assets/imagens/titulo.png"/>
            </p>
            <button className="Botao_jogar_Jornada_bicho" onClick={irParaJogo}>Jogar</button>
          </>
        ) : (
          <>
            <button className="Butao_Voltar_Jornada" onClick={irParaJogo}>
              Voltar para a tela inicial;
            </button>
            <GameLogic />
          </>
        )}
      </div>
    </>
  );
}
export default Menu;