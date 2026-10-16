import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Jogo from "../componenetes/Jogo";
import '../game.css';

function Home() {
  const [jogoAtivo, setJogoAtivo] = useState(false); // Estado mais descritivo
  const navegar = useNavigate();
  
  const handleVoltar = () => {
    setJogoAtivo(false); // Isso desmontará o componente Jogo automaticamente
    // Os áudios serão parados pelo useEffect de limpeza no Jogo.jsx
  };

  return (
    <div className="MenuD">
      {!jogoAtivo ? (
        /* TELA INICIAL */
        <>
          <button 
            className="start-button" 
            onClick={() => setJogoAtivo(true)}
          >
            Começar
          </button>
          <button 
            className="start-button" 
            onClick={() => navegar("/jogo/digirace")}
          >
            Sair
          </button>
        </>
      ) : (
        /* TELA DO JOGO */
        <>
          <Jogo />
          <button 
            className="buttonDD" 
            onClick={handleVoltar}
          >
            Menu
          </button>
          
        </>
      )}
    </div>
  );
}

export default Home;