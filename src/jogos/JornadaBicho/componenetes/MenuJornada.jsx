import { useNavigate } from "react-router-dom";
import GameLogic from "./LogicaGame/LogicaGame";
import "./Menu.css";

/**
 * Componente MenuJornada exibe o menu principal do jogo "Jornada Bicho".
 * Permite ao usuário iniciar o jogo ou voltar para o menu principal.
 *
 * @componente
 * @param {Object} props - Propriedades do componente.
 * @param {boolean} props.estado - Controla se o menu ou o jogo é exibido.
 * @param {Function} props.setEstado - Função para atualizar o estado.
 *
 * @exemplo
 * <MenuJornada estado={estado} setEstado={setEstado} />
 */

/**
 * Função para navegar para o jogo, alterando o estado.
 */
function MenuJornada({ estado, setEstado }) {
  const navigate = useNavigate();
  const irParaJogo = () => {
    setEstado(false);
  };


  /**
   * Lida com a lógica de navegação de volta no menu.
   * 
   * Se o estado atual (`estado`) for true, redefine o estado para false e navega para a rota inicial ("/").
   * Se o estado atual for false, define o estado como true.
   *
   * @function
   * @returns {void}
   */
  function getBack() {
    // Se o menu está sendo exibido, volta para a tela inicial
    if (estado) {
      setEstado(false);
      navigate("/");
    } else {
      // Se o jogo está sendo exibido, retorna ao menu do jogo
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
              src="src/jogos/JornadaBicho/game_assets/imagens/titulo-jornada.png"
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
