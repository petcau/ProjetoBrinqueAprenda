
/*function Letras({ letras, onAdicionarLetra }) {
  return (
    <div className="letras">
      {letras.map((letra, index) => (
        <button key={index} onClick={() => onAdicionarLetra(letra)}>
          {letra}
        </button>
      ))}
    </div>
  );
}

export default Letras;
*/
import React, { useRef } from "react";

function Letras({ letras, onAdicionarLetra }) {
  const clickSoundRef = useRef(null);

  const handleClick = (letra) => {
    // Toca o som
    if (clickSoundRef.current) {
      clickSoundRef.current.currentTime = 0;
      clickSoundRef.current.play();
    }

    // Chama a função original
    onAdicionarLetra(letra);
  };

  return (
    <div className="letras">
      {/* Elemento de áudio escondido */}
      <audio
        ref={clickSoundRef}
        src="src\assets\Sons\somClick.wav"
        preload="auto"
      />
      {letras.map((letra, index) => (
        <button key={index} onClick={() => handleClick(letra)}>
          {letra}
        </button>
      ))}
    </div>
  );
}

export default Letras;