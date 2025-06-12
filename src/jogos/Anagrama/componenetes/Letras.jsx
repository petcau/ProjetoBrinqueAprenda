// Importa o hook useRef do React
import { useRef } from "react";

// Componente que exibe os botões das letras
function Letras({ letras, onAdicionarLetra, desabilitado }) {
  // Referência para o som de clique
  const clickSoundRef = useRef(null);

  // Função executada ao clicar em uma letra
  const handleClick = (letra) => {
    // Se o componente estiver desabilitado, não faz nada
    if (desabilitado) return;

    // Toca som de clique ao pressionar uma letra
    if (clickSoundRef.current) {
      clickSoundRef.current.currentTime = 0;
      clickSoundRef.current.play();
    }

    // Adiciona a letra à tentativa atual
    onAdicionarLetra(letra);
  };

  return (
    <div className="letras">
      {/* Elemento de áudio para som de clique */}
      <audio
        ref={clickSoundRef}
        src="src/assets/Sons/somClick.wav"
        preload="auto"
      />

      {/* Gera um botão para cada letra */}
      {letras.map((letra, index) => (
        <button
          key={index} // Chave única para o React
          onClick={() => handleClick(letra)} // Ação ao clicar
          disabled={desabilitado} // Desabilita o botão se necessário
        >
          {letra} {/* Mostra a letra no botão */}
        </button>
      ))}
    </div>
  );
}

// Exporta o componente para uso em outras partes do app
export default Letras;
