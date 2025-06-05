import { useState } from "react";
import Jogo from "../componenetes/Jogo";
import '../game.css';

function Home() {
  const [jogoAtivo, setJogoAtivo] = useState(false); // Estado mais descritivo
  
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
            onClick={() => (window.location.href = "/")}
          >
            Voltar
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
            Voltar
          </button>
        </>
      )}
    </div>
  );
}

export default Home;