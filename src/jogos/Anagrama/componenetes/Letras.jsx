import { useRef } from "react";

function Letras({ letras, onAdicionarLetra, desabilitado }) {
  const clickSoundRef = useRef(null);

  const handleClick = (letra) => {
    if (desabilitado) return;

    // Toca som de clique
    if (clickSoundRef.current) {
      clickSoundRef.current.currentTime = 0;
      clickSoundRef.current.play();
    }

    onAdicionarLetra(letra);
  };

  return (
    <div className="letras">
      {/* Som de clique */}
      <audio
        ref={clickSoundRef}
        src="src/assets/Sons/somClick.wav"
        preload="auto"
      />
      {letras.map((letra, index) => (
        <button
          key={index}
          onClick={() => handleClick(letra)}
          disabled={desabilitado}
        >
          {letra}
        </button>
      ))}
    </div>
  );
}

export default Letras;
