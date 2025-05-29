import { useNavigate } from "react-router-dom";
import GameLogic from "./LogicaGame/LogicaGame";
import "./Menu.css";

/**
 * Componente que representa o menu do jogo JornadaBicho.
 *
 * Renderiza um bot o para iniciar o jogo e um t tulo.
 * Ao clicar no bot o, o estado da vari vel estado   alterado,
 * o que renderiza o componente GameLogic.
 *
 * @returns {JSX.Element} O componente renderizado.
 */

function MenuJornada({ estado, setEstado }) {
  const navigate = useNavigate();
  const irParaJogo = () => {
    setEstado(false);
  };

  function getBack() {
    if (estado) {
      setEstado(false);
      navigate("/");
    } else {
      setEstado(true);
    }
  }
  return (
    <div className="conteiner_Menu_Jornada">
      <button className="Butao_Voltar_Ao_Menu" onClick={getBack}>
        Voltar para o menu
      </button>

      {estado ? (
        <>
          <figure className="Titulo_JornadaFig">
            <img
              className="Titulo_Jonada_img"
              src="src/jogos/JornadaBicho/game_assets/imagens/titulo.png"
              alt="Título do jogo Jornada Bicho"
              id="Titulo_Jornada"
            />
          </figure>

          <button className="Botao_jogar_Jornada_bicho" onClick={irParaJogo}>
            Jogar
          </button>
        </>
      ) : (
        <>
          <GameLogic />
        </>
      )}
    </div>
  );
}
export default MenuJornada;
