/*import Letras from "./Letras";
import PalavraTentativa from "./PalavraTentativa";
import PalavrasDescobertas from "./PalavrasDescobertas";
import Cronometro from "./Cronometro";

function AnagramaJogo({
  letras,
  tentativa,
  descobertas,
  palavrasValidas,
  adicionarLetra,
  enviarPalavra,
  resetarTentativa,
  limparDescobertas,
  
}) {
  return (
       
    <>
   
    <div className="mesa-container">

      <Cronometro
        tempoInicial={30}
        onTempoEsgotado={() => console.log("Tempo acabou!")}
        onReiniciarTempo={() => {
          resetarTentativa();
          limparDescobertas();
        }}
       
      />

      <Letras letras={letras} onAdicionarLetra={adicionarLetra} />
      <PalavraTentativa tentativa={tentativa} onEnviar={enviarPalavra} />
      <PalavrasDescobertas
        descobertas={descobertas}
        palavrasValidas={palavrasValidas}
      />
      </div>
    </>
  );
}

export default AnagramaJogo;*/

import React, { useRef } from "react";
import Letras from "./Letras";
import PalavraTentativa from "./PalavraTentativa";
import PalavrasDescobertas from "./PalavrasDescobertas";
import Cronometro from "./Cronometro";
function AnagramaJogo({
  letras,
  tentativa,
  descobertas,
  palavrasValidas,
  adicionarLetra,
  enviarPalavra,
  resetarTentativa,
  limparDescobertas,
}) {
  const timesUpSoundRef = useRef(null);

  const handleTempoEsgotado = () => {
    // Tocar som de tempo esgotado
    if (timesUpSoundRef.current) {
      timesUpSoundRef.current.currentTime = 0;
      timesUpSoundRef.current.play();
    }

    console.log("Tempo acabou!");
  };

  return (
    <div className="mesa-container">
      <audio
        ref={timesUpSoundRef}
        src="src\assets\Sons\somDerrota.mp3"
        preload="auto"
      />

      <Cronometro
        tempoInicial={30}
        onTempoEsgotado={handleTempoEsgotado}
        onReiniciarTempo={() => {
          resetarTentativa();
          limparDescobertas();
        }}
      />

      <Letras letras={letras} onAdicionarLetra={adicionarLetra} />
      <PalavraTentativa tentativa={tentativa} onEnviar={enviarPalavra} />
      <PalavrasDescobertas
        descobertas={descobertas}
        palavrasValidas={palavrasValidas}
      />
    </div>
      );
}

export default AnagramaJogo;