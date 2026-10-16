import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usarEscalaParaCaber } from "../../../_comum/usarEscalaParaCaber";
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

  // Reduz o quadro de 1440x800 ate caber, sem mudar a composicao da equipe.
  const quadro = useRef(null);
  // respiro 10: o quadro nao tem respiro proprio, entao sobram 5px de cada lado
  usarEscalaParaCaber(quadro, estado, 10);
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
      // Sai do jogo e volta para a pagina dele no portal — e de la que a
      // crianca veio, e e onde ficam a capa e as informacoes do jogo. Ia para
      // a home ("/"), que perde esse contexto.
      //
      // O setEstado(false) que havia aqui trocava para a tela de JOGO no meio
      // da saida, fazendo o tabuleiro piscar antes de navegar.
      navigate("/jogo/jornada-dos-bichos");
    } else {
      // Se o jogo está sendo exibido, retorna ao menu do jogo
      setEstado(true);
    }
  }

  return (
    <div
      className={`conteiner_Menu_Jornada ${estado ? "" : "jogando_jornada"}`}
      ref={quadro}
    >      
      {/* A barra so aparece durante o jogo: no menu a arte ja traz o nome, e
          repetir em cima dela ficava redundante.

          O getBack ja faz as duas coisas conforme a tela — durante o jogo
          volta para o menu, no menu sai para o portal — e o rotulo acompanha. */}
      {estado ? (
        <button className="Butao_Voltar_Ao_Menu" onClick={getBack}>
          Sair
        </button>
      ) : (
        <div className="barra_jornada">
          <button className="Butao_Voltar_Ao_Menu" onClick={getBack}>
            Menu
          </button>

          <h2 className="titulo_barra_jornada">Jornada dos Bichos</h2>
        </div>
      )}

      {estado ? (
        <>
          <figure className="Titulo_JornadaFig">
            <img
              className="Titulo_Jonada_img"
              src="/JornadaBicho/titulo-jornada.png"
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
